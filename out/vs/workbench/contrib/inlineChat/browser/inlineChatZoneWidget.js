var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/contrib/zoneWidget/browser/zoneWidget", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/inlineChat/common/inlineChat", "./inlineChatWidget", "vs/platform/actions/common/actions"], function (require, exports, dom_1, aria, lifecycle_1, types_1, zoneWidget_1, nls_1, contextkey_1, instantiation_1, inlineChat_1, inlineChatWidget_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatZoneWidget = void 0;
    let InlineChatZoneWidget = class InlineChatZoneWidget extends zoneWidget_1.ZoneWidget {
        constructor(editor, _instaService, contextKeyService) {
            super(editor, { showFrame: false, showArrow: false, isAccessible: true, className: 'inline-chat-widget', keepEditorSelection: true, showInHiddenAreas: true, ordinal: 10000 });
            this._instaService = _instaService;
            this._ctxCursorPosition = inlineChat_1.CTX_INLINE_CHAT_OUTER_CURSOR_POSITION.bindTo(contextKeyService);
            this._disposables.add((0, lifecycle_1.toDisposable)(() => {
                this._ctxCursorPosition.reset();
            }));
            this.widget = this._instaService.createInstance(inlineChatWidget_1.EditorBasedInlineChatWidget, this.editor, {
                telemetrySource: 'interactiveEditorWidget-toolbar',
                inputMenuId: actions_1.MenuId.ChatExecute,
                widgetMenuId: inlineChat_1.MENU_INLINE_CHAT_WIDGET,
                feedbackMenuId: inlineChat_1.MENU_INLINE_CHAT_WIDGET_FEEDBACK,
                statusMenuId: {
                    menu: inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS,
                    options: {
                        buttonConfigProvider: action => {
                            if (action.id === inlineChat_1.ACTION_REGENERATE_RESPONSE || action.id === inlineChat_1.ACTION_TOGGLE_DIFF) {
                                return { showIcon: true, showLabel: false, isSecondary: true };
                            }
                            else if (action.id === inlineChat_1.ACTION_VIEW_IN_CHAT || action.id === inlineChat_1.ACTION_ACCEPT_CHANGES) {
                                return { isSecondary: false };
                            }
                            else {
                                return { isSecondary: true };
                            }
                        }
                    }
                }
            });
            this._disposables.add(this.widget.onDidChangeHeight(() => {
                if (this.position) {
                    // only relayout when visible
                    this._relayout(this._computeHeightInLines());
                }
            }));
            this._disposables.add(this.widget);
            this.create();
            this._disposables.add((0, dom_1.addDisposableListener)(this.domNode, 'click', e => {
                if (!this.widget.hasFocus()) {
                    this.widget.focus();
                }
            }, true));
            // todo@jrieken listen ONLY when showing
            const updateCursorIsAboveContextKey = () => {
                if (!this.position || !this.editor.hasModel()) {
                    this._ctxCursorPosition.reset();
                }
                else if (this.position.lineNumber === this.editor.getPosition().lineNumber) {
                    this._ctxCursorPosition.set('above');
                }
                else if (this.position.lineNumber + 1 === this.editor.getPosition().lineNumber) {
                    this._ctxCursorPosition.set('below');
                }
                else {
                    this._ctxCursorPosition.reset();
                }
            };
            this._disposables.add(this.editor.onDidChangeCursorPosition(e => updateCursorIsAboveContextKey()));
            this._disposables.add(this.editor.onDidFocusEditorText(e => updateCursorIsAboveContextKey()));
            updateCursorIsAboveContextKey();
        }
        _fillContainer(container) {
            container.appendChild(this.widget.domNode);
        }
        _doLayout(heightInPixel) {
            const maxWidth = !this.widget.showsAnyPreview() ? 640 : Number.MAX_SAFE_INTEGER;
            const width = Math.min(maxWidth, this._availableSpaceGivenIndentation(this._indentationWidth));
            this._dimension = new dom_1.Dimension(width, heightInPixel);
            this.widget.layout(this._dimension);
        }
        _availableSpaceGivenIndentation(indentationWidth) {
            const info = this.editor.getLayoutInfo();
            return info.contentWidth - (info.glyphMarginWidth + info.decorationsWidth + (indentationWidth ?? 0));
        }
        _computeHeightInLines() {
            const chatContentHeight = this.widget.contentHeight;
            const editorHeight = this.editor.getLayoutInfo().height;
            const contentHeight = Math.min(chatContentHeight, Math.max(this.widget.minHeight, editorHeight * 0.42));
            const heightInLines = contentHeight / this.editor.getOption(67 /* EditorOption.lineHeight */);
            return heightInLines;
        }
        _onWidth(_widthInPixel) {
            if (this._dimension) {
                this._doLayout(this._dimension.height);
            }
        }
        show(position) {
            (0, types_1.assertType)(this.container);
            const info = this.editor.getLayoutInfo();
            const marginWithoutIndentation = info.glyphMarginWidth + info.decorationsWidth + info.lineNumbersWidth;
            this.container.style.marginLeft = `${marginWithoutIndentation}px`;
            super.show(position, this._computeHeightInLines());
            this._setWidgetMargins(position);
            this.widget.focus();
        }
        updatePositionAndHeight(position) {
            super.updatePositionAndHeight(position, this._computeHeightInLines());
            this._setWidgetMargins(position);
        }
        _getWidth(info) {
            return info.width - info.minimap.minimapWidth;
        }
        updateBackgroundColor(newPosition, wholeRange) {
            (0, types_1.assertType)(this.container);
            const widgetLineNumber = newPosition.lineNumber;
            this.container.classList.toggle('inside-selection', widgetLineNumber > wholeRange.startLineNumber && widgetLineNumber < wholeRange.endLineNumber);
        }
        _calculateIndentationWidth(position) {
            const viewModel = this.editor._getViewModel();
            if (!viewModel) {
                return 0;
            }
            const visibleRange = viewModel.getCompletelyVisibleViewRange();
            if (!visibleRange.containsPosition(position)) {
                // this is needed because `getOffsetForColumn` won't work when the position
                // isn't visible/rendered
                return 0;
            }
            let indentationLevel = viewModel.getLineFirstNonWhitespaceColumn(position.lineNumber);
            let indentationLineNumber = position.lineNumber;
            for (let lineNumber = position.lineNumber; lineNumber >= visibleRange.startLineNumber; lineNumber--) {
                const currentIndentationLevel = viewModel.getLineFirstNonWhitespaceColumn(lineNumber);
                if (currentIndentationLevel !== 0) {
                    indentationLineNumber = lineNumber;
                    indentationLevel = currentIndentationLevel;
                    break;
                }
            }
            return Math.max(0, this.editor.getOffsetForColumn(indentationLineNumber, indentationLevel)); // double-guard against invalie getOffsetForColumn-calls
        }
        _setWidgetMargins(position) {
            const indentationWidth = this._calculateIndentationWidth(position);
            if (this._indentationWidth === indentationWidth) {
                return;
            }
            this._indentationWidth = this._availableSpaceGivenIndentation(indentationWidth) > 400 ? indentationWidth : 0;
            this.widget.domNode.style.marginLeft = `${this._indentationWidth}px`;
            this.widget.domNode.style.marginRight = `${this.editor.getLayoutInfo().minimap.minimapWidth}px`;
        }
        hide() {
            this.container.classList.remove('inside-selection');
            this._ctxCursorPosition.reset();
            this.widget.reset();
            super.hide();
            aria.status((0, nls_1.localize)('inlineChatClosed', 'Closed inline chat widget'));
        }
    };
    exports.InlineChatZoneWidget = InlineChatZoneWidget;
    exports.InlineChatZoneWidget = InlineChatZoneWidget = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService)
    ], InlineChatZoneWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFpvbmVXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvYnJvd3Nlci9pbmxpbmVDaGF0Wm9uZVdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBcUJPLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsdUJBQVU7UUFRbkQsWUFDQyxNQUFtQixFQUNxQixhQUFvQyxFQUN4RCxpQkFBcUM7WUFFekQsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBSHZJLGtCQUFhLEdBQWIsYUFBYSxDQUF1QjtZQUs1RSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsa0RBQXFDLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFMUYsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLDhDQUEyQixFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ3pGLGVBQWUsRUFBRSxpQ0FBaUM7Z0JBQ2xELFdBQVcsRUFBRSxnQkFBTSxDQUFDLFdBQVc7Z0JBQy9CLFlBQVksRUFBRSxvQ0FB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