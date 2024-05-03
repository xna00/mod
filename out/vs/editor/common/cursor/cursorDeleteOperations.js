/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/commands/replaceCommand", "vs/editor/common/cursorCommon", "vs/editor/common/core/cursorColumns", "vs/editor/common/cursor/cursorMoveOperations", "vs/editor/common/core/range", "vs/editor/common/core/position"], function (require, exports, strings, replaceCommand_1, cursorCommon_1, cursorColumns_1, cursorMoveOperations_1, range_1, position_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DeleteOperations = void 0;
    class DeleteOperations {
        static deleteRight(prevEditOperationType, config, model, selections) {
            const commands = [];
            let shouldPushStackElementBefore = (prevEditOperationType !== 3 /* EditOperationType.DeletingRight */);
            for (let i = 0, len = selections.length; i < len; i++) {
                const selection = selections[i];
                let deleteSelection = selection;
                if (deleteSelection.isEmpty()) {
                    const position = selection.getPosition();
                    const rightOfPosition = cursorMoveOperations_1.MoveOperations.right(config, model, position);
                    deleteSelection = new range_1.Range(rightOfPosition.lineNumber, rightOfPosition.column, position.lineNumber, position.column);
                }
                if (deleteSelection.isEmpty()) {
                    // Probably at end of file => ignore
                    commands[i] = null;
                    continue;
                }
                if (deleteSelection.startLineNumber !== deleteSelection.endLineNumber) {
                    shouldPushStackElementBefore = true;
                }
                commands[i] = new replaceCommand_1.ReplaceCommand(deleteSelection, '');
            }
            return [shouldPushStackElementBefore, commands];
        }
        static isAutoClosingPairDelete(autoClosingDelete, autoClosingBrackets, autoClosingQuotes, autoClosingPairsOpen, model, selections, autoClosedCharacters) {
            if (autoClosingBrackets === 'never' && autoClosingQuotes === 'never') {
                return false;
            }
            if (autoClosingDelete === 'never') {
                return false;
            }
            for (let i = 0, len = selections.length; i < len; i++) {
                const selection = selections[i];
                const position = selection.getPosition();
                if (!selection.isEmpty()) {
                    return false;
                }
                const lineText = model.getLineContent(position.lineNumber);
                if (position.column < 2 || position.column >= lineText.length + 1) {
                    return false;
                }
                const character = lineText.charAt(position.column - 2);
                const autoClosingPairCandidates = autoClosingPairsOpen.get(character);
                if (!autoClosingPairCandidates) {
                    return false;
                }
                if ((0, cursorCommon_1.isQuote)(character)) {
                    if (autoClosingQuotes === 'never') {
                        return false;
                    }
                }
                else {
                    if (autoClosingBrackets === 'never') {
                        return false;
                    }
                }
                const afterCharacter = lineText.charAt(position.column - 1);
                let foundAutoClosingPair = false;
                for (const autoClosingPairCandidate of autoClosingPairCandidates) {
                    if (autoClosingPairCandidate.open === character && autoClosingPairCandidate.close === afterCharacter) {
                        foundAutoClosingPair = true;
                    }
                }
                if (!foundAutoClosingPair) {
                    return false;
                }
                // Must delete the pair only if it was automatically inserted by the editor
                if (autoClosingDelete === 'auto') {
                    let found = false;
                    for (let j = 0, lenJ = autoClosedCharacters.length; j < lenJ; j++) {
                        const autoClosedCharacter = autoClosedCharacters[j];
                        if (position.lineNumber === autoClosedCharacter.startLineNumber && position.column === autoClosedCharacter.startColumn) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        return false;
                    }
                }
            }
            return true;
        }
        static _runAutoClosingPairDelete(config, model, selections) {
            const commands = [];
            for (let i = 0, len = selections.length; i < len; i++) {
                const position = selections[i].getPosition();
                const deleteSelection = new range_1.Range(position.lineNumber, position.column - 1, position.lineNumber, position.column + 1);
                commands[i] = new replaceCommand_1.ReplaceCommand(deleteSelection, '');
            }
            return [true, commands];
        }
        static deleteLeft(prevEditOperationType, config, model, selections, autoClosedCharacters) {
            if (this.isAutoClosingPairDelete(config.autoClosingDelete, config.autoClosingBrackets, config.autoClosingQuotes, config.autoClosingPairs.autoClosingPairsOpenByEnd, model, selections, autoClosedCharacters)) {
                return this._runAutoClosingPairDelete(config, model, selections);
            }
            const commands = [];
            let shouldPushStackElementBefore = (prevEditOperationType !== 2 /* EditOperationType.DeletingLeft */);
            for (let i = 0, len = selections.length; i < len; i++) {
                const deleteRange = DeleteOperations.getDeleteRange(selections[i], model, config);
                // Ignore empty delete ranges, as they have no effect
                // They happen if the cursor is at the beginning of the file.
                if (deleteRange.isEmpty()) {
                    commands[i] = null;
                    continue;
                }
                if (deleteRange.startLineNumber !== deleteRange.endLineNumber) {
                    shouldPushStackElementBefore = true;
                }
                commands[i] = new replaceCommand_1.ReplaceCommand(deleteRange, '');
            }
            return [shouldPushStackElementBefore, commands];
        }
        static getDeleteRange(selection, model, config) {
            if (!selection.isEmpty()) {
                return selection;
            }
            const position = selection.getPosition();
            // Unintend when using tab stops and cursor is within indentation
            if (config.useTabStops && position.column > 1) {
                const lineContent = model.getLineContent(position.lineNumber);
                const firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(lineContent);
                const lastIndentationColumn = (firstNonWhitespaceIndex === -1
                    ? /* entire string is whitespace */ lineContent.length + 1
                    : firstNonWhitespaceIndex + 1);
                if (position.column <= lastIndentationColumn) {
                    const fromVisibleColumn = config.visibleColumnFromColumn(model, position);
                    const toVisibleColumn = cursorColumns_1.CursorColumns.prevIndentTabStop(fromVisibleColumn, config.indentSize);
                    const toColumn = config.columnFromVisibleColumn(model, position.lineNumber, toVisibleColumn);
                    return new range_1.Range(position.lineNumber, toColumn, position.lineNumber, position.column);
                }
            }
            return range_1.Range.fromPositions(DeleteOperations.getPositionAfterDeleteLeft(position, model), position);
        }
        static getPositionAfterDeleteLeft(position, model) {
            if (position.column > 1) {
                // Convert 1-based columns to 0-based offsets and back.
                const idx = strings.getLeftDeleteOffset(position.column - 1, model.getLineContent(position.lineNumber));
                return position.with(undefined, idx + 1);
            }
            else if (position.lineNumber > 1) {
                const newLine = position.lineNumber - 1;
                return new position_1.Position(newLine, model.getLineMaxColumn(newLine));
            }
            else {
                return position;
            }
        }
        static cut(config, model, selections) {
            const commands = [];
            let lastCutRange = null;
            selections.sort((a, b) => position_1.Position.compare(a.getStartPosition(), b.getEndPosition()));
            for (let i = 0, len = selections.length; i < len; i++) {
                const selection = selections[i];
                if (selection.isEmpty()) {
                    if (config.emptySelectionClipboard) {
                        // This is a full line cut
                        const position = selection.getPosition();
                        let startLineNumber, startColumn, endLineNumber, endColumn;
                        if (position.lineNumber < model.getLineCount()) {
                            // Cutting a line in the middle of the model
                            startLineNumber = position.lineNumber;
                            startColumn = 1;
                            endLineNumber = position.lineNumber + 1;
                            endColumn = 1;
                        }
                        else if (position.lineNumber > 1 && lastCutRange?.endLineNumber !== position.lineNumber) {
                            // Cutting the last line & there are more than 1 lines in the model & a previous cut operation does not touch the current cut operation
                            startLineNumber = position.lineNumber - 1;
                            startColumn = model.getLineMaxColumn(position.lineNumber - 1);
                            endLineNumber = position.lineNumber;
                            endColumn = model.getLineMaxColumn(position.lineNumber);
                        }
                        else {
                            // Cutting the single line that the model contains
                            startLineNumber = position.lineNumber;
                            startColumn = 1;
                            endLineNumber = position.lineNumber;
                            endColumn = model.getLineMaxColumn(position.lineNumber);
                        }
                        const deleteSelection = new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
                        lastCutRange = deleteSelection;
                        if (!deleteSelection.isEmpty()) {
                            commands[i] = new replaceCommand_1.ReplaceCommand(deleteSelection, '');
                        }
                        else {
                            commands[i] = null;
                        }
                    }
                    else {
                        // Cannot cut empty selection
                        commands[i] = null;
                    }
                }
                else {
                    commands[i] = new replaceCommand_1.ReplaceCommand(selection, '');
                }
            }
            return new cursorCommon_1.EditOperationResult(0 /* EditOperationType.Other */, commands, {
                shouldPushStackElementBefore: true,
                shouldPushStackElementAfter: true
            });
        }
    }
    exports.DeleteOperations = DeleteOperations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yRGVsZXRlT3BlcmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jdXJzb3IvY3Vyc29yRGVsZXRlT3BlcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSxnQkFBZ0I7UUFFckIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxxQkFBd0MsRUFBRSxNQUEyQixFQUFFLEtBQXlCLEVBQUUsVUFBdUI7WUFDbEosTUFBTSxRQUFRLEdBQTJCLEVBQUUsQ0FBQztZQUM1QyxJQUFJLDRCQUE0QixHQUFHLENBQUMscUJBQXFCLDRDQUFvQyxDQUFDLENBQUM7WUFDL0YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN2RCxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRWhDLElBQUksZUFBZSxHQUFVLFNBQVMsQ0FBQztnQkFFdkMsSUFBSSxlQUFlLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztvQkFDL0IsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUN6QyxNQUFNLGVBQWUsR0FBRyxxQ0FBYyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUN0RSxlQUFlLEdBQUcsSUFBSSxhQUFLLENBQzFCLGVBQWUsQ0FBQyxVQUFVLEVBQzFCLGVBQWUsQ0FBQyxNQUFNLEVBQ3RCLFFBQVEsQ0FBQyxVQUFVLEVBQ25CLFFBQVEsQ0FBQyxNQUFNLENBQ2YsQ0FBQztnQkFDSCxDQUFDO2dCQUVELElBQUksZUFBZSxDQUFDLE9B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