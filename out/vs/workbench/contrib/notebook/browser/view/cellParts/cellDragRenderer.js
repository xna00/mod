/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/trustedTypes", "vs/base/common/color", "vs/base/common/platform", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/languages/textToHtmlTokenizer"], function (require, exports, DOM, trustedTypes_1, color_1, platform, range_1, languages, textToHtmlTokenizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeCellDragImageRenderer = void 0;
    class EditorTextRenderer {
        static { this._ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('cellRendererEditorText', {
            createHTML(input) { return input; }
        }); }
        getRichText(editor, modelRange) {
            const model = editor.getModel();
            if (!model) {
                return null;
            }
            const colorMap = this.getDefaultColorMap();
            const fontInfo = editor.getOptions().get(50 /* EditorOption.fontInfo */);
            const fontFamilyVar = '--notebook-editor-font-family';
            const fontSizeVar = '--notebook-editor-font-size';
            const fontWeightVar = '--notebook-editor-font-weight';
            const style = ``
                + `color: ${colorMap[1 /* ColorId.DefaultForeground */]};`
                + `background-color: ${colorMap[2 /* ColorId.DefaultBackground */]};`
                + `font-family: var(${fontFamilyVar});`
                + `font-weight: var(${fontWeightVar});`
                + `font-size: var(${fontSizeVar});`
                + `line-height: ${fontInfo.lineHeight}px;`
                + `white-space: pre;`;
            const element = DOM.$('div', { style });
            const fontSize = fontInfo.fontSize;
            const fontWeight = fontInfo.fontWeight;
            element.style.setProperty(fontFamilyVar, fontInfo.fontFamily);
            element.style.setProperty(fontSizeVar, `${fontSize}px`);
            element.style.setProperty(fontWeightVar, fontWeight);
            const linesHtml = this.getRichTextLinesAsHtml(model, modelRange, colorMap);
            element.innerHTML = linesHtml;
            return element;
        }
        getRichTextLinesAsHtml(model, modelRange, colorMap) {
            const startLineNumber = modelRange.startLineNumber;
            const startColumn = modelRange.startColumn;
            const endLineNumber = modelRange.endLineNumber;
            const endColumn = modelRange.endColumn;
            const tabSize = model.getOptions().tabSize;
            let result = '';
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const lineTokens = model.tokenization.getLineTokens(lineNumber);
                const lineContent = lineTokens.getLineContent();
                const startOffset = (lineNumber === startLineNumber ? startColumn - 1 : 0);
                const endOffset = (lineNumber === endLineNumber ? endColumn - 1 : lineContent.length);
                if (lineContent === '') {
                    result += '<br>';
                }
                else {
                    result += (0, textToHtmlTokenizer_1.tokenizeLineToHTML)(lineContent, lineTokens.inflate(), colorMap, startOffset, endOffset, tabSize, platform.isWindows);
                }
            }
            return EditorTextRenderer._ttPolicy?.createHTML(result) ?? result;
        }
        getDefaultColorMap() {
            const colorMap = languages.TokenizationRegistry.getColorMap();
            const result = ['#000000'];
            if (colorMap) {
                for (let i = 1, len = colorMap.length; i < len; i++) {
                    result[i] = color_1.Color.Format.CSS.formatHex(colorMap[i]);
                }
            }
            return result;
        }
    }
    class CodeCellDragImageRenderer {
        getDragImage(templateData, editor, type) {
            let dragImage = this.getDragImageImpl(templateData, editor, type);
            if (!dragImage) {
                // TODO@roblourens I don't think this can happen
                dragImage = document.createElement('div');
                dragImage.textContent = '1 cell';
            }
            return dragImage;
        }
        getDragImageImpl(templateData, editor, type) {
            const dragImageContainer = templateData.container.cloneNode(true);
            dragImageContainer.classList.forEach(c => dragImageContainer.classList.remove(c));
            dragImageContainer.classList.add('cell-drag-image', 'monaco-list-row', 'focused', `${type}-cell-row`);
            const editorContainer = dragImageContainer.querySelector('.cell-editor-container');
            if (!editorContainer) {
                return null;
            }
            const richEditorText = new EditorTextRenderer().getRichText(editor, new range_1.Range(1, 1, 1, 1000));
            if (!richEditorText) {
                return null;
            }
            DOM.reset(editorContainer, richEditorText);
            return dragImageContainer;
        }
    }
    exports.CodeCellDragImageRenderer = CodeCellDragImageRenderer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbERyYWdSZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L2NlbGxQYXJ0cy9jZWxsRHJhZ1JlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxNQUFNLGtCQUFrQjtpQkFFUixjQUFTLEdBQUcsSUFBQSx1Q0FBd0IsRUFBQyx3QkFBd0IsRUFBRTtZQUM3RSxVQUFVLENBQUMsS0FBSyxJQUFJLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztTQUNuQyxDQUFDLENBQUM7UUFFSCxXQUFXLENBQUMsTUFBbUIsRUFBRSxVQUFpQjtZQUNqRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzNDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLGdDQUF1QixDQUFDO1lBQ2hFLE1BQU0sYUFBYSxHQUFHLCtCQUErQixDQUFDO1lBQ3RELE1BQU0sV0FBVyxHQUFHLDZCQUE2QixDQUFDO1lBQ2xELE1BQU0sYUFBYSxHQUFHLCtCQUErQixDQUFDO1lBRXRELE1BQU0sS0FBSyxHQUFHLEVBQUU7a0JBQ2IsVUFBVSxRQUFRLG1DQUEyQixHQUFHO2tCQUNoRCxxQkFBcUIsUUFBUSxtQ0FBMkIsR0FBRztrQkFDM0Qsb0JBQW9CLGFBQWEsSUFBSTtrQkFDckMsb0JBQW9CLGFBQWEsSUFBSTtrQkFDckMsa0JBQWtCLFdBQVcsSUFBSTtrQkFDakMsZ0JBQWdCLFFBQVEsQ0FB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