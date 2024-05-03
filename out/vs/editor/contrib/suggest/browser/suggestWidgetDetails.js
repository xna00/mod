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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/base/browser/ui/resizable/resizable", "vs/nls", "vs/platform/instantiation/common/instantiation"], function (require, exports, dom, scrollableElement_1, codicons_1, themables_1, event_1, htmlContent_1, lifecycle_1, markdownRenderer_1, resizable_1, nls, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestDetailsOverlay = exports.SuggestDetailsWidget = void 0;
    exports.canExpandCompletionItem = canExpandCompletionItem;
    function canExpandCompletionItem(item) {
        return !!item && Boolean(item.completion.documentation || item.completion.detail && item.completion.detail !== item.completion.label);
    }
    let SuggestDetailsWidget = class SuggestDetailsWidget {
        constructor(_editor, instaService) {
            this._editor = _editor;
            this._onDidClose = new event_1.Emitter();
            this.onDidClose = this._onDidClose.event;
            this._onDidChangeContents = new event_1.Emitter();
            this.onDidChangeContents = this._onDidChangeContents.event;
            this._disposables = new lifecycle_1.DisposableStore();
            this._renderDisposeable = new lifecycle_1.DisposableStore();
            this._borderWidth = 1;
            this._size = new dom.Dimension(330, 0);
            this.domNode = dom.$('.suggest-details');
            this.domNode.classList.add('no-docs');
            this._markdownRenderer = instaService.createInstance(markdownRenderer_1.MarkdownRenderer, { editor: _editor });
            this._body = dom.$('.body');
            this._scrollbar = new scrollableElement_1.DomScrollableElement(this._body, {
                alwaysConsumeMouseWheel: true,
            });
            dom.append(this.domNode, this._scrollbar.getDomNode());
            this._disposables.add(this._scrollbar);
            this._header = dom.append(this._body, dom.$('.header'));
            this._close = dom.append(this._header, dom.$('span' + themables_1.ThemeIcon.asCSSSelector(codicons_1.Codicon.close)));
            this._close.title = nls.localize('details.close', "Close");
            this._type = dom.append(this._header, dom.$('p.type'));
            this._docs = dom.append(this._body, dom.$('p.docs'));
            this._configureFont();
            this._disposables.add(this._editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(50 /* EditorOption.fontInfo */)) {
                    this._configureFont();
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
            this._renderDisposeable.dispose();
        }
        _configureFont() {
            const options = this._editor.getOptions();
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const fontFamily = fontInfo.getMassagedFontFamily();
            const fontSize = options.get(119 /* EditorOption.suggestFontSize */) || fontInfo.fontSize;
            const lineHeight = options.get(120 /* EditorOption.suggestLineHeight */) || fontInfo.lineHeight;
            const fontWeight = fontInfo.fontWeight;
            const fontSizePx = `${fontSize}px`;
            const lineHeightPx = `${lineHeight}px`;
            this.domNode.style.fontSize = fontSizePx;
            this.domNode.style.lineHeight = `${lineHeight / fontSize}`;
            this.domNode.style.fontWeight = fontWeight;
            this.domNode.style.fontFeatureSettings = fontInfo.fontFeatureSettings;
            this._type.style.fontFamily = fontFamily;
            this._close.style.height = lineHeightPx;
            this._close.style.width = lineHeightPx;
        }
        getLayoutInfo() {
            const lineHeight = this._editor.getOption(120 /* EditorOption.suggestLineHeight */) || this._editor.getOption(50 /* EditorOption.fontInfo */).lineHeight;
            const borderWidth = this._borderWidth;
            const borderHeight = borderWidth * 2;
            return {
                lineHeight,
                borderWidth,
                borderHeight,
                verticalPadding: 22,
                horizontalPadding: 14
            };
        }
        renderLoading() {
            this._type.textContent = nls.localize('loading', "Loading...");
            this._docs.textContent = '';
            this.domNode.classList.remove('no-docs', 'no-type');
            this.layout(this.size.width, this.getLayoutInfo().lineHeight * 2);
            this._onDidChangeContents.fire(this);
        }
        renderItem(item, explainMode) {
            this._renderDisposeable.clear();
            let { detail, documentation } = item.completion;
            if (explainMode) {
                let md = '';
                md += `score: ${item.score[0]}\n`;
                md += `prefix: ${item.word ?? '(no prefix)'}\n`;
                md += `word: ${item.completion.filterText ? item.completion.filterText + ' (filterText)' : item.textLabel}\n`;
                md += `distance: ${item.distance} (localityBonus-setting)\n`;
                md += `index: ${item.idx}, based on ${item.completion.sortText && `sortText: "${item.completion.sortText}"` || 'label'}\n`;
                md += `commit_chars: ${item.completion.commitCharacters?.join('')}\n`;
                documentation = new htmlContent_1.MarkdownString().appendCodeblock('empty', md);
                detail = `Provider: ${item.provider._debugDisplayName}`;
            }
            if (!explainMode && !canExpandCompletionItem(item)) {
                this.clearContents();
                return;
            }
            this.domNode.classList.remove('no-docs', 'no-type');
            // --- details
            if (detail) {
                const cappedDetail = detail.length > 100000 ? `${detail.substr(0, 100000)}…` : detail;
                this._type.textContent = cappedDetail;
                this._type.title = cappedDetail;
                dom.show(this._type);
                this._type.classList.toggle('auto-wrap', !/\r?\n^\s+/gmi.test(cappedDetail));
            }
            else {
                dom.clearNode(this._type);
                this._type.title = '';
                dom.hide(this._type);
                this.domNode.classList.add('no-type');
            }
            // --- documentation
            dom.clearNode(this._docs);
            if (typeof documentation === 'string') {
                this._docs.classList.remove('markdown-docs');
                this._docs.textContent = documentation;
            }
            else if (documentation) {
                this._docs.classList.add('markdown-docs');
                dom.clearNode(this._docs);
                const renderedContents = this._markdownRenderer.render(documentation);
                this._docs.appendChild(renderedContents.element);
                this._renderDisposeable.add(renderedContents);
                this._renderDisposeable.add(this._markdownRenderer.onDidRenderAsync(() => {
                    this.layout(this._size.width, this._type.clientHeight + this._docs.clientHeight);
                    this._onDidChangeContents.fire(this);
                }));
            }
            this.domNode.style.userSelect = 'text';
            this.domNode.tabIndex = -1;
            this._close.onmousedown = e => {
                e.preventDefault();
                e.stopPropagation();
            };
            this._close.onclick = e => {
                e.preventDefault();
                e.stopPropagation();
                this._onDidClose.fire();
            };
            this._body.scrollTop = 0;
            this.layout(this._size.width, this._type.clientHeight + this._docs.clientHeight);
            this._onDidChangeContents.fire(this);
        }
        clearContents() {
            this.domNode.classList.add('no-docs');
            this._type.textContent = '';
            this._docs.textContent = '';
        }
        get isEmpty() {
            return this.domNode.classList.contains('no-docs');
        }
        get size() {
            return this._size;
        }
        layout(width, height) {
            const newSize = new dom.Dimension(width, height);
            if (!dom.Dimension.equals(newSize, this._size)) {
                this._size = newSize;
                dom.size(this.domNode, width, height);
            }
            this._scrollbar.scanDomNode();
        }
        scrollDown(much = 8) {
            this._body.scrollTop += much;
        }
        scrollUp(much = 8) {
            this._body.scrollTop -= much;
        }
        scrollTop() {
            this._body.scrollTop = 0;
        }
        scrollBottom() {
            this._body.scrollTop = this._body.scrollHeight;
        }
        pageDown() {
            this.scrollDown(80);
        }
        pageUp() {
            this.scrollUp(80);
        }
        set borderWidth(width) {
            this._borderWidth = width;
        }
        get borderWidth() {
            return this._borderWidth;
        }
    };
    exports.SuggestDetailsWidget = SuggestDetailsWidget;
    exports.SuggestDetailsWidget = SuggestDetailsWidget = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], SuggestDetailsWidget);
    class SuggestDetailsOverlay {
        constructor(widget, _editor) {
            this.widget = widget;
            this._editor = _editor;
            this.allowEditorOverflow = true;
            this._disposables = new lifecycle_1.DisposableStore();
            this._added = false;
            this._preferAlignAtTop = true;
            this._resizable = new resizable_1.ResizableHTMLElement();
            this._resizable.domNode.classList.add('suggest-details-container');
            this._resizable.domNode.appendChild(widget.domNode);
            this._resizable.enableSashes(false, true, true, false);
            let topLeftNow;
            let sizeNow;
            let deltaTop = 0;
            let deltaLeft = 0;
            this._disposables.add(this._resizable.onDidWillResize(() => {
                topLeftNow = this._topLeft;
                sizeNow = this._resizable.size;
            }));
            this._disposables.add(this._resizable.onDidResize(e => {
                if (topLeftNow && sizeNow) {
                    this.widget.layout(e.dimension.width, e.dimension.height);
                    let updateTopLeft = false;
                    if (e.west) {
                        deltaLeft = sizeNow.width - e.dimension.width;
                        updateTopLeft = true;
                    }
                    if (e.north) {
                        deltaTop = sizeNow.height - e.dimension.height;
                        updateTopLeft = true;
                    }
                    if (updateTopLeft) {
                        this._applyTopLeft({
                            top: topLeftNow.top + deltaTop,
                            left: topLeftNow.left + deltaLeft,
                        });
                    }
                }
                if (e.done) {
                    topLeftNow = undefined;
                    sizeNow = undefined;
                    deltaTop = 0;
                    deltaLeft = 0;
                    this._userSize = e.dimension;
                }
            }));
            this._disposables.add(this.widget.onDidChangeContents(() => {
                if (this._anchorBox) {
                    this._placeAtAnchor(this._anchorBox, this._userSize ?? this.widget.size, this._preferAlignAtTop);
                }
            }));
        }
        dispose() {
            this._resizable.dispose();
            this._disposables.dispose();
            this.hide();
        }
        getId() {
            return 'suggest.details';
        }
        getDomNode() {
            return this._resizable.domNode;
        }
        getPosition() {
            return this._topLeft ? { preference: this._topLeft } : null;
        }
        show() {
            if (!this._added) {
                this._editor.addOverlayWidget(this);
                this._added = true;
            }
        }
        hide(sessionEnded = false) {
            this._resizable.clearSashHoverState();
            if (this._added) {
                this._editor.removeOverlayWidget(this);
                this._added = false;
                this._anchorBox = undefined;
                this._topLeft = undefined;
            }
            if (sessionEnded) {
                this._userSize = undefined;
                this.widget.clearContents();
            }
        }
        placeAtAnchor(anchor, preferAlignAtTop) {
            const anchorBox = anchor.getBoundingClientRect();
            this._anchorBox = anchorBox;
            this._preferAlignAtTop = preferAlignAtTop;
            this._placeAtAnchor(this._anchorBox, this._userSize ?? this.widget.size, preferAlignAtTop);
        }
        _placeAtAnchor(anchorBox, size, preferAlignAtTop) {
            const bodyBox = dom.getClientArea(this.getDomNode().ownerDocument.body);
            const info = this.widget.getLayoutInfo();
            const defaultMinSize = new dom.Dimension(220, 2 * info.lineHeight);
            const defaultTop = anchorBox.top;
            // EAST
            const eastPlacement = (function () {
                const width = bodyBox.width - (anchorBox.left + anchorBox.width + info.borderWidth + info.horizontalPadding);
                const left = -info.borderWidth + anchorBox.left + anchorBox.width;
                const maxSizeTop = new dom.Dimension(width, bodyBox.height - anchorBox.top - info.borderHeight - info.verticalPadding);
                const maxSizeBottom = maxSizeTop.with(undefined, anchorBox.top + anchorBox.height - info.borderHeight - info.verticalPadding);
                return { top: defaultTop, left, fit: width - size.width, maxSizeTop, maxSizeBottom, minSize: defaultMinSize.with(Math.min(width, defaultMinSize.width)) };
            })();
            // WEST
            const westPlacement = (function () {
                const width = anchorBox.left - info.borderWidth - info.horizontalPadding;
                const left = Math.max(info.horizontalPadding, anchorBox.left - size.width - info.borderWidth);
                const maxSizeTop = new dom.Dimension(width, bodyBox.height - anchorBox.top - info.borderHeight - info.verticalPadding);
                const maxSizeBottom = maxSizeTop.with(undefined, anchorBox.top + anchorBox.height - info.borderHeight - info.verticalPadding);
                return { top: defaultTop, left, fit: width - size.width, maxSizeTop, maxSizeBottom, minSize: defaultMinSize.with(Math.min(width, defaultMinSize.width)) };
            })();
            // SOUTH
            const southPacement = (function () {
                const left = anchorBox.left;
                const top = -info.borderWidth + anchorBox.top + anchorBox.height;
                const maxSizeBottom = new dom.Dimension(anchorBox.width - info.borderHeight, bodyBox.height - anchorBox.top - anchorBox.height - info.verticalPadding);
                return { top, left, fit: maxSizeBottom.height - size.height, maxSizeBottom, maxSizeTop: maxSizeBottom, minSize: defaultMinSize.with(maxSizeBottom.width) };
            })();
            // take first placement that fits or the first with "least bad" fit
            const placements = [eastPlacement, westPlacement, southPacement];
            const placement = placements.find(p => p.fit >= 0) ?? placements.sort((a, b) => b.fit - a.fit)[0];
            // top/bottom placement
            const bottom = anchorBox.top + anchorBox.height - info.borderHeight;
            let alignAtTop;
            let height = size.height;
            const maxHeight = Math.max(placement.maxSizeTop.height, placement.maxSizeBottom.height);
            if (height > maxHeight) {
                height = maxHeight;
            }
            let maxSize;
            if (preferAlignAtTop) {
                if (height <= placement.maxSizeTop.height) {
                    alignAtTop = true;
                    maxSize = placement.maxSizeTop;
                }
                else {
                    alignAtTop = false;
                    maxSize = placement.maxSizeBottom;
                }
            }
            else {
                if (height <= placement.maxSizeBottom.height) {
                    alignAtTop = false;
                    maxSize = placement.maxSizeBottom;
                }
                else {
                    alignAtTop = true;
                    maxSize = placement.maxSizeTop;
                }
            }
            let { top, left } = placement;
            if (!alignAtTop && height > anchorBox.height) {
                top = bottom - height;
            }
            const editorDomNode = this._editor.getDomNode();
            if (editorDomNode) {
                // get bounding rectangle of the suggest widget relative to the editor
                const editorBoundingBox = editorDomNode.getBoundingClientRect();
                top -= editorBoundingBox.top;
                left -= editorBoundingBox.left;
            }
            this._applyTopLeft({ left, top });
            this._resizable.enableSashes(!alignAtTop, placement === eastPlacement, alignAtTop, placement !== eastPlacement);
            this._resizable.minSize = placement.minSize;
            this._resizable.maxSize = maxSize;
            this._resizable.layout(height, Math.min(maxSize.width, size.width));
            this.widget.layout(this._resizable.size.width, this._resizable.size.height);
        }
        _applyTopLeft(topLeft) {
            this._topLeft = topLeft;
            this._editor.layoutOverlayWidget(this);
        }
    }
    exports.SuggestDetailsOverlay = SuggestDetailsOverlay;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdFdpZGdldERldGFpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N1Z2dlc3QvYnJvd3Nlci9zdWdnZXN0V2lkZ2V0RGV0YWlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQmhHLDBEQUVDO0lBRkQsU0FBZ0IsdUJBQXVCLENBQUMsSUFBZ0M7UUFDdkUsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZJLENBQUM7SUFFTSxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFvQjtRQXVCaEMsWUFDa0IsT0FBb0IsRUFDZCxZQUFtQztZQUR6QyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBcEJyQixnQkFBVyxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDMUMsZUFBVSxHQUFnQixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztZQUV6Qyx5QkFBb0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ25ELHdCQUFtQixHQUFnQixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBUTNELGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFHckMsdUJBQWtCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDcEQsaUJBQVksR0FBVyxDQUFDLENBQUM7WUFDekIsVUFBSyxHQUFHLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFNekMs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