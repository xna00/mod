/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/common/strings", "vs/editor/browser/config/domFontInfo", "vs/editor/common/config/editorOptions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/base/browser/ui/mouseCursor/mouseCursor"], function (require, exports, dom, fastDomNode_1, strings, domFontInfo_1, editorOptions_1, position_1, range_1, mouseCursor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewCursor = exports.CursorPlurality = void 0;
    class ViewCursorRenderData {
        constructor(top, left, paddingLeft, width, height, textContent, textContentClassName) {
            this.top = top;
            this.left = left;
            this.paddingLeft = paddingLeft;
            this.width = width;
            this.height = height;
            this.textContent = textContent;
            this.textContentClassName = textContentClassName;
        }
    }
    var CursorPlurality;
    (function (CursorPlurality) {
        CursorPlurality[CursorPlurality["Single"] = 0] = "Single";
        CursorPlurality[CursorPlurality["MultiPrimary"] = 1] = "MultiPrimary";
        CursorPlurality[CursorPlurality["MultiSecondary"] = 2] = "MultiSecondary";
    })(CursorPlurality || (exports.CursorPlurality = CursorPlurality = {}));
    class ViewCursor {
        constructor(context, plurality) {
            this._context = context;
            const options = this._context.configuration.options;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            this._cursorStyle = options.get(28 /* EditorOption.cursorStyle */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            this._lineCursorWidth = Math.min(options.get(31 /* EditorOption.cursorWidth */), this._typicalHalfwidthCharacterWidth);
            this._isVisible = true;
            // Create the dom node
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._domNode.setClassName(`cursor ${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`);
            this._domNode.setHeight(this._lineHeight);
            this._domNode.setTop(0);
            this._domNode.setLeft(0);
            (0, domFontInfo_1.applyFontInfo)(this._domNode, fontInfo);
            this._domNode.setDisplay('none');
            this._position = new position_1.Position(1, 1);
            this._pluralityClass = '';
            this.setPlurality(plurality);
            this._lastRenderedContent = '';
            this._renderData = null;
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return this._position;
        }
        setPlurality(plurality) {
            switch (plurality) {
                default:
                case CursorPlurality.Single:
                    this._pluralityClass = '';
                    break;
                case CursorPlurality.MultiPrimary:
                    this._pluralityClass = 'cursor-primary';
                    break;
                case CursorPlurality.MultiSecondary:
                    this._pluralityClass = 'cursor-secondary';
                    break;
            }
        }
        show() {
            if (!this._isVisible) {
                this._domNode.setVisibility('inherit');
                this._isVisible = true;
            }
        }
        hide() {
            if (this._isVisible) {
                this._domNode.setVisibility('hidden');
                this._isVisible = false;
            }
        }
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            this._cursorStyle = options.get(28 /* EditorOption.cursorStyle */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            this._lineCursorWidth = Math.min(options.get(31 /* EditorOption.cursorWidth */), this._typicalHalfwidthCharacterWidth);
            (0, domFontInfo_1.applyFontInfo)(this._domNode, fontInfo);
            return true;
        }
        onCursorPositionChanged(position, pauseAnimation) {
            if (pauseAnimation) {
                this._domNode.domNode.style.transitionProperty = 'none';
            }
            else {
                this._domNode.domNode.style.transitionProperty = '';
            }
            this._position = position;
            return true;
        }
        /**
         * If `this._position` is inside a grapheme, returns the position where the grapheme starts.
         * Also returns the next grapheme.
         */
        _getGraphemeAwarePosition() {
            const { lineNumber, column } = this._position;
            const lineContent = this._context.viewModel.getLineContent(lineNumber);
            const [startOffset, endOffset] = strings.getCharContainingOffset(lineContent, column - 1);
            return [new position_1.Position(lineNumber, startOffset + 1), lineContent.substring(startOffset, endOffset)];
        }
        _prepareRender(ctx) {
            let textContent = '';
            let textContentClassName = '';
            const [position, nextGrapheme] = this._getGraphemeAwarePosition();
            if (this._cursorStyle === editorOptions_1.TextEditorCursorStyle.Line || this._cursorStyle === editorOptions_1.TextEditorCursorStyle.LineThin) {
                const visibleRange = ctx.visibleRangeForPosition(position);
                if (!visibleRange || visibleRange.outsideRenderedLine) {
                    // Outside viewport
                    return null;
                }
                const window = dom.getWindow(this._domNode.domNode);
                let width;
                if (this._cursorStyle === editorOptions_1.TextEditorCursorStyle.Line) {
                    width = dom.computeScreenAwareSize(window, this._lineCursorWidth > 0 ? this._lineCursorWidth : 2);
                    if (width > 2) {
                        textContent = nextGrapheme;
                        textContentClassName = this._getTokenClassName(position);
                    }
                }
                else {
                    width = dom.computeScreenAwareSize(window, 1);
                }
                let left = visibleRange.left;
                let paddingLeft = 0;
                if (width >= 2 && left >= 1) {
                    // shift the cursor a bit between the characters
                    paddingLeft = 1;
                    left -= paddingLeft;
                }
                const top = ctx.getVerticalOffsetForLineNumber(position.lineNumber) - ctx.bigNumbersDelta;
                return new ViewCursorRenderData(top, left, paddingLeft, width, this._lineHeight, textContent, textContentClassName);
            }
            const visibleRangeForCharacter = ctx.linesVisibleRangesForRange(new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column + nextGrapheme.length), false);
            if (!visibleRangeForCharacter || visibleRangeForCharacter.length === 0) {
                // Outside viewport
                return null;
            }
            const firstVisibleRangeForCharacter = visibleRangeForCharacter[0];
            if (firstVisibleRangeForCharacter.outsideRenderedLine || firstVisibleRangeForCharacter.ranges.length === 0) {
                // Outside viewport
                return null;
            }
            const range = firstVisibleRangeForCharacter.ranges[0];
            const width = (nextGrapheme === '\t'
                ? this._typicalHalfwidthCharacterWidth
                : (range.width < 1
                    ? this._typicalHalfwidthCharacterWidth
                    : range.width));
            if (this._cursorStyle === editorOptions_1.TextEditorCursorStyle.Block) {
                textContent = nextGrapheme;
                textContentClassName = this._getTokenClassName(position);
            }
            let top = ctx.getVerticalOffsetForLineNumber(position.lineNumber) - ctx.bigNumbersDelta;
            let height = this._lineHeight;
            // Underline might interfere with clicking
            if (this._cursorStyle === editorOptions_1.TextEditorCursorStyle.Underline || this._cursorStyle === editorOptions_1.TextEditorCursorStyle.UnderlineThin) {
                top += this._lineHeight - 2;
                height = 2;
            }
            return new ViewCursorRenderData(top, range.left, 0, width, height, textContent, textContentClassName);
        }
        _getTokenClassName(position) {
            const lineData = this._context.viewModel.getViewLineData(position.lineNumber);
            const tokenIndex = lineData.tokens.findTokenIndexAtOffset(position.column - 1);
            return lineData.tokens.getClassName(tokenIndex);
        }
        prepareRender(ctx) {
            this._renderData = this._prepareRender(ctx);
        }
        render(ctx) {
            if (!this._renderData) {
                this._domNode.setDisplay('none');
                return null;
            }
            if (this._lastRenderedContent !== this._renderData.textContent) {
                this._lastRenderedContent = this._renderData.textContent;
                this._domNode.domNode.textContent = this._lastRenderedContent;
            }
            this._domNode.setClassName(`cursor ${this._pluralityClass} ${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME} ${this._renderData.textContentClassName}`);
            this._domNode.setDisplay('block');
            this._domNode.setTop(this._renderData.top);
            this._domNode.setLeft(this._renderData.left);
            this._domNode.setPaddingLeft(this._renderData.paddingLeft);
            this._domNode.setWidth(this._renderData.width);
            this._domNode.setLineHeight(this._renderData.height);
            this._domNode.setHeight(this._renderData.height);
            return {
                domNode: this._domNode.domNode,
                position: this._position,
                contentLeft: this._renderData.left,
                height: this._renderData.height,
                width: 2
            };
        }
    }
    exports.ViewCursor = ViewCursor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0N1cnNvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL3ZpZXdDdXJzb3JzL3ZpZXdDdXJzb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc0JoRyxNQUFNLG9CQUFvQjtRQUN6QixZQUNpQixHQUFXLEVBQ1gsSUFBWSxFQUNaLFdBQW1CLEVBQ25CLEtBQWEsRUFDYixNQUFjLEVBQ2QsV0FBbUIsRUFDbkIsb0JBQTRCO1lBTjVCLFFBQUcsR0FBSCxHQUFHLENBQVE7WUFDWCxTQUFJLEdBQUosSUFBSSxDQUFRO1lBQ1osZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFDbkIsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUNuQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQVE7UUFDekMsQ0FBQztLQUNMO0lBRUQsSUFBWSxlQUlYO0lBSkQsV0FBWSxlQUFlO1FBQzFCLHlEQUFNLENBQUE7UUFDTixxRUFBWSxDQUFBO1FBQ1oseUVBQWMsQ0FBQTtJQUNmLENBQUMsRUFKVyxlQUFlLCtCQUFmLGVBQWUsUUFJMUI7SUFFRCxNQUFhLFVBQVU7UUFpQnRCLFlBQVksT0FBb0IsRUFBRSxTQUEwQjtZQUMzRCxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN4QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7WUFDcEQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsZ0NBQXVCLENBQUM7WUFFcEQsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxtQ0FBMEIsQ0FBQztZQUMxRCxJQUFJLENBQUMsV0FBVyxH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