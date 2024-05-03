/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/trustedTypes", "vs/editor/browser/config/domFontInfo", "vs/editor/common/config/editorOptions", "vs/editor/common/core/stringBuilder", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewLayout/viewLineRenderer", "vs/editor/common/viewModel"], function (require, exports, trustedTypes_1, domFontInfo_1, editorOptions_1, stringBuilder_1, lineDecorations_1, viewLineRenderer_1, viewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RenderOptions = exports.LineSource = void 0;
    exports.renderLines = renderLines;
    const ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('diffEditorWidget', { createHTML: value => value });
    function renderLines(source, options, decorations, domNode) {
        (0, domFontInfo_1.applyFontInfo)(domNode, options.fontInfo);
        const hasCharChanges = (decorations.length > 0);
        const sb = new stringBuilder_1.StringBuilder(10000);
        let maxCharsPerLine = 0;
        let renderedLineCount = 0;
        const viewLineCounts = [];
        for (let lineIndex = 0; lineIndex < source.lineTokens.length; lineIndex++) {
            const lineNumber = lineIndex + 1;
            const lineTokens = source.lineTokens[lineIndex];
            const lineBreakData = source.lineBreakData[lineIndex];
            const actualDecorations = lineDecorations_1.LineDecoration.filter(decorations, lineNumber, 1, Number.MAX_SAFE_INTEGER);
            if (lineBreakData) {
                let lastBreakOffset = 0;
                for (const breakOffset of lineBreakData.breakOffsets) {
                    const viewLineTokens = lineTokens.sliceAndInflate(lastBreakOffset, breakOffset, 0);
                    maxCharsPerLine = Math.max(maxCharsPerLine, renderOriginalLine(renderedLineCount, viewLineTokens, lineDecorations_1.LineDecoration.extractWrapped(actualDecorations, lastBreakOffset, breakOffset), hasCharChanges, source.mightContainNonBasicASCII, source.mightContainRTL, options, sb));
                    renderedLineCount++;
                    lastBreakOffset = breakOffset;
                }
                viewLineCounts.push(lineBreakData.breakOffsets.length);
            }
            else {
                viewLineCounts.push(1);
                maxCharsPerLine = Math.max(maxCharsPerLine, renderOriginalLine(renderedLineCount, lineTokens, actualDecorations, hasCharChanges, source.mightContainNonBasicASCII, source.mightContainRTL, options, sb));
                renderedLineCount++;
            }
        }
        maxCharsPerLine += options.scrollBeyondLastColumn;
        const html = sb.build();
        const trustedhtml = ttPolicy ? ttPolicy.createHTML(html) : html;
        domNode.innerHTML = trustedhtml;
        const minWidthInPx = (maxCharsPerLine * options.typicalHalfwidthCharacterWidth);
        return {
            heightInLines: renderedLineCount,
            minWidthInPx,
            viewLineCounts,
        };
    }
    class LineSource {
        constructor(lineTokens, lineBreakData, mightContainNonBasicASCII, mightContainRTL) {
            this.lineTokens = lineTokens;
            this.lineBreakData = lineBreakData;
            this.mightContainNonBasicASCII = mightContainNonBasicASCII;
            this.mightContainRTL = mightContainRTL;
        }
    }
    exports.LineSource = LineSource;
    class RenderOptions {
        static fromEditor(editor) {
            const modifiedEditorOptions = editor.getOptions();
            const fontInfo = modifiedEditorOptions.get(50 /* EditorOption.fontInfo */);
            const layoutInfo = modifiedEditorOptions.get(145 /* EditorOption.layoutInfo */);
            return new RenderOptions(editor.getModel()?.getOptions().tabSize || 0, fontInfo, modifiedEditorOptions.get(33 /* EditorOption.disableMonospaceOptimizations */), fontInfo.typicalHalfwidthCharacterWidth, modifiedEditorOptions.get(104 /* EditorOption.scrollBeyondLastColumn */), modifiedEditorOptions.get(67 /* EditorOption.lineHeight */), layoutInfo.decorationsWidth, modifiedEditorOptions.get(117 /* EditorOption.stopRenderingLineAfter */), modifiedEditorOptions.get(99 /* EditorOption.renderWhitespace */), modifiedEditorOptions.get(94 /* EditorOption.renderControlCharacters */), modifiedEditorOptions.get(51 /* EditorOption.fontLigatures */));
        }
        constructor(tabSize, fontInfo, disableMonospaceOptimizations, typicalHalfwidthCharacterWidth, scrollBeyondLastColumn, lineHeight, lineDecorationsWidth, stopRenderingLineAfter, renderWhitespace, renderControlCharacters, fontLigatures) {
            this.tabSize = tabSize;
            this.fontInfo = fontInfo;
            this.disableMonospaceOptimizations = disableMonospaceOptimizations;
            this.typicalHalfwidthCharacterWidth = typicalHalfwidthCharacterWidth;
            this.scrollBeyondLastColumn = scrollBeyondLastColumn;
            this.lineHeight = lineHeight;
            this.lineDecorationsWidth = lineDecorationsWidth;
            this.stopRenderingLineAfter = stopRenderingLineAfter;
            this.renderWhitespace = renderWhitespace;
            this.renderControlCharacters = renderControlCharacters;
            this.fontLigatures = fontLigatures;
        }
    }
    exports.RenderOptions = RenderOptions;
    function renderOriginalLine(viewLineIdx, lineTokens, decorations, hasCharChanges, mightContainNonBasicASCII, mightContainRTL, options, sb) {
        sb.appendString('<div class="view-line');
        if (!hasCharChanges) {
            // No char changes
            sb.appendString(' char-delete');
        }
        sb.appendString('" style="top:');
        sb.appendString(String(viewLineIdx * options.lineHeight));
        sb.appendString('px;width:1000000px;">');
        const lineContent = lineTokens.getLineContent();
        const isBasicASCII = viewModel_1.ViewLineRenderingData.isBasicASCII(lineContent, mightContainNonBasicASCII);
        const containsRTL = viewModel_1.ViewLineRenderingData.containsRTL(lineContent, isBasicASCII, mightContainRTL);
        const output = (0, viewLineRenderer_1.renderViewLine)(new viewLineRenderer_1.RenderLineInput((options.fontInfo.isMonospace && !options.disableMonospaceOptimizations), options.fontInfo.canUseHalfwidthRightwardsArrow, lineContent, false, isBasicASCII, containsRTL, 0, lineTokens, decorations, options.tabSize, 0, options.fontInfo.spaceWidth, options.fontInfo.middotWidth, options.fontInfo.wsmiddotWidth, options.stopRenderingLineAfter, options.renderWhitespace, options.renderControlCharacters, options.fontLigatures !== editorOptions_1.EditorFontLigatures.OFF, null // Send no selections, original line cannot be selected
        ), sb);
        sb.appendString('</div>');
        return output.characterMapping.getHorizontalOffset(output.characterMapping.length);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyTGluZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2NvbXBvbmVudHMvZGlmZkVkaXRvclZpZXdab25lcy9yZW5kZXJMaW5lcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHLGtDQTREQztJQTlERCxNQUFNLFFBQVEsR0FBRyxJQUFBLHVDQUF3QixFQUFDLGtCQUFrQixFQUFFLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUU5RixTQUFnQixXQUFXLENBQUMsTUFBa0IsRUFBRSxPQUFzQixFQUFFLFdBQStCLEVBQUUsT0FBb0I7UUFDNUgsSUFBQSwyQkFBYSxFQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFekMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRWhELE1BQU0sRUFBRSxHQUFHLElBQUksNkJBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwQyxJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUM7UUFDeEIsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7UUFDMUIsTUFBTSxjQUFjLEdBQWEsRUFBRSxDQUFDO1FBQ3BDLEtBQUssSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLFNBQVMsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDO1lBQzNFLE1BQU0sVUFBVSxHQUFHLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDakMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNoRCxNQUFNLGFBQWEs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