/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/editor/contrib/hover/browser/hoverOperation", "vs/base/browser/ui/hover/hoverWidget", "vs/editor/common/model"], function (require, exports, dom, arrays_1, htmlContent_1, lifecycle_1, markdownRenderer_1, hoverOperation_1, hoverWidget_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarginHoverWidget = void 0;
    const $ = dom.$;
    class MarginHoverWidget extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.modesGlyphHoverWidget'; }
        constructor(editor, languageService, openerService) {
            super();
            this._renderDisposeables = this._register(new lifecycle_1.DisposableStore());
            this._editor = editor;
            this._isVisible = false;
            this._messages = [];
            this._hover = this._register(new hoverWidget_1.HoverWidget());
            this._hover.containerDomNode.classList.toggle('hidden', !this._isVisible);
            this._markdownRenderer = this._register(new markdownRenderer_1.MarkdownRenderer({ editor: this._editor }, languageService, openerService));
            this._computer = new MarginHoverComputer(this._editor);
            this._hoverOperation = this._register(new hoverOperation_1.HoverOperation(this._editor, this._computer));
            this._register(this._hoverOperation.onResult((result) => {
                this._withResult(result.value);
            }));
            this._register(this._editor.onDidChangeModelDecorations(() => this._onModelDecorationsChanged()));
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(50 /* EditorOption.fontInfo */)) {
                    this._updateFont();
                }
            }));
            this._editor.addOverlayWidget(this);
        }
        dispose() {
            this._editor.removeOverlayWidget(this);
            super.dispose();
        }
        getId() {
            return MarginHoverWidget.ID;
        }
        getDomNode() {
            return this._hover.containerDomNode;
        }
        getPosition() {
            return null;
        }
        _updateFont() {
            const codeClasses = Array.prototype.slice.call(this._hover.contentsDomNode.getElementsByClassName('code'));
            codeClasses.forEach(node => this._editor.applyFontInfo(node));
        }
        _onModelDecorationsChanged() {
            if (this._isVisible) {
                // The decorations have changed and the hover is visible,
                // we need to recompute the displayed text
                this._hoverOperation.cancel();
                this._hoverOperation.start(0 /* HoverStartMode.Delayed */);
            }
        }
        startShowingAt(lineNumber, laneOrLine) {
            if (this._computer.lineNumber === lineNumber && this._computer.lane === laneOrLine) {
                // We have to show the widget at the exact same line number as before, so no work is needed
                return;
            }
            this._hoverOperation.cancel();
            this.hide();
            this._computer.lineNumber = lineNumber;
            this._computer.lane = laneOrLine;
            this._hoverOperation.start(0 /* HoverStartMode.Delayed */);
        }
        hide() {
            this._computer.lineNumber = -1;
            this._hoverOperation.cancel();
            if (!this._isVisible) {
                return;
            }
            this._isVisible = false;
            this._hover.containerDomNode.classList.toggle('hidden', !this._isVisible);
        }
        _withResult(result) {
            this._messages = result;
            if (this._messages.length > 0) {
                this._renderMessages(this._computer.lineNumber, this._messages);
            }
            else {
                this.hide();
            }
        }
        _renderMessages(lineNumber, messages) {
            this._renderDisposeables.clear();
            const fragment = document.createDocumentFragment();
            for (const msg of messages) {
                const markdownHoverElement = $('div.hover-row.markdown-hover');
                const hoverContentsElement = dom.append(markdownHoverElement, $('div.hover-contents'));
                const renderedContents = this._renderDisposeables.add(this._markdownRenderer.render(msg.value));
                hoverContentsElement.appendChild(renderedContents.element);
                fragment.appendChild(markdownHoverElement);
            }
            this._updateContents(fragment);
            this._showAt(lineNumber);
        }
        _updateContents(node) {
            this._hover.contentsDomNode.textContent = '';
            this._hover.contentsDomNode.appendChild(node);
            this._updateFont();
        }
        _showAt(lineNumber) {
            if (!this._isVisible) {
                this._isVisible = true;
                this._hover.containerDomNode.classList.toggle('hidden', !this._isVisible);
            }
            const editorLayout = this._editor.getLayoutInfo();
            const topForLineNumber = this._editor.getTopForLineNumber(lineNumber);
            const editorScrollTop = this._editor.getScrollTop();
            const lineHeight = this._editor.getOption(67 /* EditorOption.lineHeight */);
            const nodeHeight = this._hover.containerDomNode.clientHeight;
            const top = topForLineNumber - editorScrollTop - ((nodeHeight - lineHeight) / 2);
            const left = editorLayout.glyphMarginLeft + editorLayout.glyphMarginWidth + (this._computer.lane === 'lineNo' ? editorLayout.lineNumbersWidth : 0);
            this._hover.containerDomNode.style.left = `${left}px`;
            this._hover.containerDomNode.style.top = `${Math.max(Math.round(top), 0)}px`;
        }
    }
    exports.MarginHoverWidget = MarginHoverWidget;
    class MarginHoverComputer {
        get lineNumber() {
            return this._lineNumber;
        }
        set lineNumber(value) {
            this._lineNumber = value;
        }
        get lane() {
            return this._laneOrLine;
        }
        set lane(value) {
            this._laneOrLine = value;
        }
        constructor(_editor) {
            this._editor = _editor;
            this._lineNumber = -1;
            this._laneOrLine = model_1.GlyphMarginLane.Center;
        }
        computeSync() {
            const toHoverMessage = (contents) => {
                return {
                    value: contents
                };
            };
            const lineDecorations = this._editor.getLineDecorations(this._lineNumber);
            const result = [];
            const isLineHover = this._laneOrLine === 'lineNo';
            if (!lineDecorations) {
                return result;
            }
            for (const d of lineDecorations) {
                const lane = d.options.glyphMargin?.position ?? model_1.GlyphMarginLane.Center;
                if (!isLineHover && lane !== this._laneOrLine) {
                    continue;
                }
                const hoverMessage = isLineHover ? d.options.lineNumberHoverMessage : d.options.glyphMarginHoverMessage;
                if (!hoverMessage || (0, htmlContent_1.isEmptyMarkdownString)(hoverMessage)) {
                    continue;
                }
                result.push(...(0, arrays_1.asArray)(hoverMessage).map(toHoverMessage));
            }
            return result;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFyZ2luSG92ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2hvdmVyL2Jyb3dzZXIvbWFyZ2luSG92ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFRaEIsTUFBYSxpQkFBa0IsU0FBUSxzQkFBVTtpQkFFekIsT0FBRSxHQUFHLHNDQUFzQyxBQUF6QyxDQUEwQztRQWFuRSxZQUNDLE1BQW1CLEVBQ25CLGVBQWlDLEVBQ2pDLGFBQTZCO1lBRTdCLEtBQUssRUFBRSxDQUFDO1lBUFEsd0JBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBUTVFLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBRXRCLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBRXBCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFMUUsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxtQ0FBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsZUFBZSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDeEgsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLG1CQUFtQixDQUFDLElB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