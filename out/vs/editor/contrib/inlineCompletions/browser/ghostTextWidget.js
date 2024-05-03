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
define(["require", "exports", "vs/base/browser/trustedTypes", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/strings", "vs/editor/browser/config/domFontInfo", "vs/editor/common/config/editorOptions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/stringBuilder", "vs/editor/common/languages/language", "vs/editor/common/model", "vs/editor/common/tokens/lineTokens", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewLayout/viewLineRenderer", "vs/editor/contrib/inlineCompletions/browser/ghostText", "vs/editor/contrib/inlineCompletions/browser/utils", "vs/css!./ghostText"], function (require, exports, trustedTypes_1, event_1, lifecycle_1, observable_1, strings, domFontInfo_1, editorOptions_1, position_1, range_1, stringBuilder_1, language_1, model_1, lineTokens_1, lineDecorations_1, viewLineRenderer_1, ghostText_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ttPolicy = exports.AdditionalLinesWidget = exports.GhostTextWidget = exports.GHOST_TEXT_DESCRIPTION = void 0;
    exports.GHOST_TEXT_DESCRIPTION = 'ghost-text';
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
                const replacedRange = ghostText instanceof ghostText_1.GhostTextReplacement ? ghostText.columnRange : undefined;
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
                for (const part of ghostText.parts) {
                    let lines = part.lines;
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
                        addToAdditionalLines(lines, exports.GHOST_TEXT_DESCRIPTION);
                        if (hiddenTextStartColumn === undefined && part.column <= textBufferLine.length) {
                            hiddenTextStartColumn = part.column;
                        }
                    }
                    lastIdx = part.column - 1;
                }
                if (hiddenTextStartColumn !== undefined) {
                    addToAdditionalLines([textBufferLine.substring(lastIdx)], undefined);
                }
                const hiddenRange = hiddenTextStartColumn !== undefined ? new utils_1.ColumnRange(hiddenTextStartColumn, textBufferLine.length + 1) : undefined;
                return {
                    replacedRange,
                    inlineTexts,
                    additionalLines,
                    hiddenRange,
                    lineNumber: ghostText.lineNumber,
                    additionalReservedLineCount: this.model.minReservedLineCount.read(reader),
                    targetTextModel: textModel,
                };
            });
            this.decorations = (0, observable_1.derived)(this, reader => {
                const uiState = this.uiState.read(reader);
                if (!uiState) {
                    return [];
                }
                const decorations = [];
                if (uiState.replacedRange) {
                    decorations.push({
                        range: uiState.replacedRange.toRange(uiState.lineNumber),
                        options: { inlineClassName: 'inline-completion-text-to-replace', description: 'GhostTextReplacement' }
                    });
                }
                if (uiState.hiddenRange) {
                    decorations.push({
                        range: uiState.hiddenRange.toRange(uiState.lineNumber),
                        options: { inlineClassName: 'ghost-text-hidden', description: 'ghost-text-hidden', }
                    });
                }
                for (const p of uiState.inlineTexts) {
                    decorations.push({
                        range: range_1.Range.fromPositions(new position_1.Position(uiState.lineNumber, p.column)),
                        options: {
                            description: exports.GHOST_TEXT_DESCRIPTION,
                            after: { content: p.text, inlineClassName: p.preview ? 'ghost-text-decoration-preview' : 'ghost-text-decoration', cursorStops: model_1.InjectedTextCursorStops.Left },
                            showIfCollapsed: true,
                        }
                    });
                }
                return decorations;
            });
            this.additionalLinesWidget = this._register(new AdditionalLinesWidget(this.editor, this.languageService.languageIdCodec, (0, observable_1.derived)(reader => {
                /** @description lines */
                const uiState = this.uiState.read(reader);
                return uiState ? {
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
    class AdditionalLinesWidget extends lifecycle_1.Disposable {
        get viewZoneId() { return this._viewZoneId; }
        constructor(editor, languageIdCodec, lines) {
            super();
            this.editor = editor;
            this.languageIdCodec = languageIdCodec;
            this.lines = lines;
            this._viewZoneId = undefined;
            this.editorOptionsChanged = (0, observable_1.observableSignalFromEvent)('editorOptionChanged', event_1.Event.filter(this.editor.onDidChangeConfiguration, e => e.hasChanged(33 /* EditorOption.disableMonospaceOptimizations */)
                || e.hasChanged(117 /* EditorOption.stopRenderingLineAfter */)
                || e.hasChanged(99 /* EditorOption.renderWhitespace */)
                || e.hasChanged(94 /* EditorOption.renderControlCharacters */)
                || e.hasChanged(51 /* EditorOption.fontLigatures */)
                || e.hasChanged(50 /* EditorOption.fontInfo */)
                || e.hasChanged(67 /* EditorOption.lineHeight */)));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update view zone */
                const lines = this.lines.read(reader);
                this.editorOptionsChanged.read(reader);
                if (lines) {
                    this.updateLines(lines.lineNumber, lines.additionalLines, lines.minReservedLineCount);
                }
                else {
                    this.clear();
                }
            }));
        }
        dispose() {
            super.dispose();
            this.clear();
        }
        clear() {
            this.editor.changeViewZones((changeAccessor) => {
                if (this._viewZoneId) {
                    changeAccessor.removeZone(this._viewZoneId);
                    this._viewZoneId = undefined;
                }
            });
        }
        updateLines(lineNumber, additionalLines, minReservedLineCount) {
            const textModel = this.editor.getModel();
            if (!textModel) {
                return;
            }
            const { tabSize } = textModel.getOptions();
            this.editor.changeViewZones((changeAccessor) => {
                if (this._viewZoneId) {
                    changeAccessor.removeZone(this._viewZoneId);
                    this._viewZoneId = undefined;
                }
                const heightInLines = Math.max(additionalLines.length, minReservedLineCount);
                if (heightInLines > 0) {
                    const domNode = document.createElement('div');
                    renderLines(domNode, tabSize, additionalLines, this.editor.getOptions(), this.languageIdCodec);
                    this._viewZoneId = changeAccessor.addZone({
                        afterLineNumber: lineNumber,
                        heightInLines: heightInLines,
                        domNode,
                        afterColumnAffinity: 1 /* PositionAffinity.Right */
                    });
                }
            });
        }
    }
    exports.AdditionalLinesWidget = AdditionalLinesWidget;
    function renderLines(domNode, tabSize, lines, opts, languageIdCodec) {
        const disableMonospaceOptimizations = opts.get(33 /* EditorOption.disableMonospaceOptimizations */);
        const stopRenderingLineAfter = opts.get(117 /* EditorOption.stopRenderingLineAfter */);
        // To avoid visual confusion, we don't want to render visible whitespace
        const renderWhitespace = 'none';
        const renderControlCharacters = opts.get(94 /* EditorOption.renderControlCharacters */);
        const fontLigatures = opts.get(51 /* EditorOption.fontLigatures */);
        const fontInfo = opts.get(50 /* EditorOption.fontInfo */);
        const lineHeight = opts.get(67 /* EditorOption.lineHeight */);
        const sb = new stringBuilder_1.StringBuilder(10000);
        sb.appendString('<div class="suggest-preview-text">');
        for (let i = 0, len = lines.length; i < len; i++) {
            const lineData = lines[i];
            const line = lineData.content;
            sb.appendString('<div class="view-line');
            sb.appendString('" style="top:');
            sb.appendString(String(i * lineHeight));
            sb.appendString('px;width:1000000px;">');
            const isBasicASCII = strings.isBasicASCII(line);
            const containsRTL = strings.containsRTL(line);
            const lineTokens = lineTokens_1.LineTokens.createEmpty(line, languageIdCodec);
            (0, viewLineRenderer_1.renderViewLine)(new viewLineRenderer_1.RenderLineInput((fontInfo.isMonospace && !disableMonospaceOptimizations), fontInfo.canUseHalfwidthRightwardsArrow, line, false, isBasicASCII, containsRTL, 0, lineTokens, lineData.decorations, tabSize, 0, fontInfo.spaceWidth, fontInfo.middotWidth, fontInfo.wsmiddotWidth, stopRenderingLineAfter, renderWhitespace, renderControlCharacters, fontLigatures !== editorOptions_1.EditorFontLigatures.OFF, null), sb);
            sb.appendString('</div>');
        }
        sb.appendString('</div>');
        (0, domFontInfo_1.applyFontInfo)(domNode, fontInfo);
        const html = sb.build();
        const trustedhtml = exports.ttPolicy ? exports.ttPolicy.createHTML(html) : html;
        domNode.innerHTML = trustedhtml;
    }
    exports.ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('editorGhostText', { createHTML: value => value });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2hvc3RUZXh0V2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVDb21wbGV0aW9ucy9icm93c2VyL2dob3N0VGV4dFdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3Qm5GLFFBQUEsc0JBQXNCLEdBQUcsWUFBWSxDQUFDO0lBTzVDLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsc0JBQVU7UUFJOUMsWUFDa0IsTUFBbUIsRUFDbkIsS0FBNEIsRUFDM0IsZUFBa0Q7WUFFcEUsS0FBSyxFQUFFLENBQUM7WUFKUyxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBQ25CLFVBQUssR0FBTCxLQUFLLENBQXVCO1lBQ1Ysb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBTnBELGVBQVUsR0FBRyxJQUFBLDRCQUFlLEVBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFDLHFCQUFnQixHQUFHLElBQUEsZ0NBQW1CLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFhcEksWUFBTyxHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ2pELElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDbEMsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUM7Z0JBQ0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDckQsSUFBSSxTQUFTLEtBQUssSUFBSSxD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