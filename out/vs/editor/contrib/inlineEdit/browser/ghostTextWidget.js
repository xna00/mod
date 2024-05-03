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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/common/model", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/contrib/inlineCompletions/browser/ghostTextWidget", "vs/editor/contrib/inlineCompletions/browser/utils", "vs/css!./inlineEdit"], function (require, exports, lifecycle_1, observable_1, position_1, range_1, language_1, model_1, lineDecorations_1, ghostTextWidget_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GhostTextWidget = exports.INLINE_EDIT_DESCRIPTION = void 0;
    exports.INLINE_EDIT_DESCRIPTION = 'inline-edit';
    let GhostTextWidget = class GhostTextWidget extends lifecycle_1.Disposable {
        constructor(editor, model, languageService) {
            super();
            this.editor = editor;
            this.model = model;
            this.languageService = languageService;
            this.isDisposed = (0, observable_1.observableValue)(this, false);
            this.currentTextModel = (0, observable_1.observableFromEvent)(this.editor.onDidChangeModel, () => /** @description editor.model */ this.editor.getModel());
            this.uiState = (0, observable_1.derived)(this, reader => {
                if (this.isDisposed.read(reader)) {
                    return undefined;
                }
                const textModel = this.currentTextModel.read(reader);
                if (textModel !== this.model.targetTextModel.read(reader)) {
                    return undefined;
                }
                const ghostText = this.model.ghostText.read(reader);
                if (!ghostText) {
                    return undefined;
                }
                let range = this.model.range?.read(reader);
                //if range is empty, we want to remove it
                if (range && range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn) {
                    range = undefined;
                }
                //check if both range and text are single line - in this case we want to do inline replacement
                //rather than replacing whole lines
                const isSingleLine = (range ? range.startLineNumber === range.endLineNumber : true) && ghostText.parts.length === 1 && ghostText.parts[0].lines.length === 1;
                //check if we're just removing code
                const isPureRemove = ghostText.parts.length === 1 && ghostText.parts[0].lines.every(l => l.length === 0);
                const inlineTexts = [];
                const additionalLines = [];
                function addToAdditionalLines(lines, className) {
                    if (additionalLines.length > 0) {
                        const lastLine = additionalLines[additionalLines.length - 1];
                        if (className) {
                            lastLine.decorations.push(new lineDecorations_1.LineDecoration(lastLine.content.length + 1, lastLine.content.length + 1 + lines[0].length, className, 0 /* InlineDecorationType.Regular */));
                        }
                        lastLine.content += lines[0];
                        lines = lines.slice(1);
                    }
                    for (const line of lines) {
                        additionalLines.push({
                            content: line,
                            decorations: className ? [new lineDecorations_1.LineDecoration(1, line.length + 1, className, 0 /* InlineDecorationType.Regular */)] : []
                        });
                    }
                }
                const textBufferLine = textModel.getLineContent(ghostText.lineNumber);
                let hiddenTextStartColumn = undefined;
                let lastIdx = 0;
                if (!isPureRemove) {
                    for (const part of ghostText.parts) {
                        let lines = part.lines;
                        //If remove range is set, we want to push all new liens to virtual area
                        if (range && !isSingleLine) {
                            addToAdditionalLines(lines, exports.INLINE_EDIT_DESCRIPTION);
                            lines = [];
                        }
                        if (hiddenTextStartColumn === undefined) {
                            inlineTexts.push({
                                column: part.column,
                                text: lines[0],
                                preview: part.preview,
                            });
                            lines = lines.slice(1);
                        }
                        else {
                            addToAdditionalLines([textBufferLine.substring(lastIdx, part.column - 1)], undefined);
                        }
                        if (lines.length > 0) {
                            addToAdditionalLines(lines, exports.INLINE_EDIT_DESCRIPTION);
                            if (hiddenTextStartColumn === undefined && part.column <= textBufferLine.length) {
                                hiddenTextStartColumn = part.column;
                            }
                        }
                        lastIdx = part.column - 1;
                    }
                    if (hiddenTextStartColumn !== undefined) {
                        addToAdditionalLines([textBufferLine.substring(lastIdx)], undefined);
                    }
                }
                const hiddenRange = hiddenTextStartColumn !== undefined ? new utils_1.ColumnRange(hiddenTextStartColumn, textBufferLine.length + 1) : undefined;
                const lineNumber = (isSingleLine || !range) ? ghostText.lineNumber : range.endLineNumber - 1;
                return {
                    inlineTexts,
                    additionalLines,
                    hiddenRange,
                    lineNumber,
                    additionalReservedLineCount: this.model.minReservedLineCount.read(reader),
                    targetTextModel: textModel,
                    range,
                    isSingleLine,
                    isPureRemove,
                    backgroundColoring: this.model.backgroundColoring.read(reader)
                };
            });
            this.decorations = (0, observable_1.derived)(this, reader => {
                const uiState = this.uiState.read(reader);
                if (!uiState) {
                    return [];
                }
                const decorations = [];
                if (uiState.hiddenRange) {
                    decorations.push({
                        range: uiState.hiddenRange.toRange(uiState.lineNumber),
                        options: { inlineClassName: 'inline-edit-hidden', description: 'inline-edit-hidden', }
                    });
                }
                if (uiState.range) {
                    const ranges = [];
                    if (uiState.isSingleLine) {
                        ranges.push(uiState.range);
                    }
                    else if (uiState.isPureRemove) {
                        const lines = uiState.range.endLineNumber - uiState.range.startLineNumber;
                        for (let i = 0; i < lines; i++) {
                            const line = uiState.range.startLineNumber + i;
                            const firstNonWhitespace = uiState.targetTextModel.getLineFirstNonWhitespaceColumn(line);
                            const lastNonWhitespace = uiState.targetTextModel.getLineLastNonWhitespaceColumn(line);
                            const range = new range_1.Range(line, firstNonWhitespace, line, lastNonWhitespace);
                            ranges.push(range);
                        }
                    }
                    else {
                        const lines = uiState.range.endLineNumber - uiState.range.startLineNumber;
                        for (let i = 0; i < lines; i++) {
                            const line = uiState.range.startLineNumber + i;
                            const firstNonWhitespace = uiState.targetTextModel.getLineFirstNonWhitespaceColumn(line);
                            const lastNonWhitespace = uiState.targetTextModel.getLineLastNonWhitespaceColumn(line);
                            const range = new range_1.Range(line, firstNonWhitespace, line, lastNonWhitespace);
                            ranges.push(range);
                        }
                    }
                    const className = uiState.backgroundColoring ? 'inline-edit-remove backgroundColoring' : 'inline-edit-remove';
                    for (const range of ranges) {
                        decorations.push({
                            range,
                            options: { inlineClassName: className, description: 'inline-edit-remove', }
                        });
                    }
                }
                for (const p of uiState.inlineTexts) {
                    decorations.push({
                        range: range_1.Range.fromPositions(new position_1.Position(uiState.lineNumber, p.column)),
                        options: {
                            description: exports.INLINE_EDIT_DESCRIPTION,
                            after: { content: p.text, inlineClassName: p.preview ? 'inline-edit-decoration-preview' : 'inline-edit-decoration', cursorStops: model_1.InjectedTextCursorStops.Left },
                            showIfCollapsed: true,
                        }
                    });
                }
                return decorations;
            });
            this.additionalLinesWidget = this._register(new ghostTextWidget_1.AdditionalLinesWidget(this.editor, this.languageService.languageIdCodec, (0, observable_1.derived)(reader => {
                /** @description lines */
                const uiState = this.uiState.read(reader);
                return uiState && !uiState.isPureRemove ? {
                    lineNumber: uiState.lineNumber,
                    additionalLines: uiState.additionalLines,
                    minReservedLineCount: uiState.additionalReservedLineCount,
                    targetTextModel: uiState.targetTextModel,
                } : undefined;
            })));
            this._register((0, lifecycle_1.toDisposable)(() => { this.isDisposed.set(true, undefined); }));
            this._register((0, utils_1.applyObservableDecorations)(this.editor, this.decorations));
        }
        ownsViewZone(viewZoneId) {
            return this.additionalLinesWidget.viewZoneId === viewZoneId;
        }
    };
    exports.GhostTextWidget = GhostTextWidget;
    exports.GhostTextWidget = GhostTextWidget = __decorate([
        __param(2, language_1.ILanguageService)
    ], GhostTextWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2hvc3RUZXh0V2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVFZGl0L2Jyb3dzZXIvZ2hvc3RUZXh0V2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCbkYsUUFBQSx1QkFBdUIsR0FBRyxhQUFhLENBQUM7SUFTOUMsSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxzQkFBVTtRQUk5QyxZQUNrQixNQUFtQixFQUMzQixLQUE0QixFQUNuQixlQUFrRDtZQUVwRSxLQUFLLEVBQUUsQ0FBQztZQUpTLFdBQU0sR0FBTixNQUFNLENBQWE7WUFDM0IsVUFBSyxHQUFMLEtBQUssQ0FBdUI7WUFDRixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFOcEQsZUFBVSxHQUFHLElBQUEsNEJBQWUsRUFBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUMscUJBQWdCLEdBQUcsSUFBQSxnQ0FBbUIsRUFBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxDQUFDLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQWFwSSxZQUFPLEdBQUcsSUFBQSxvQkFBTyxFQUFDLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRTtnQkFDakQsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUNsQyxPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztnQkFDRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLFNBQVMsS0FBSyxJQUFJLENBQUMsS0FB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