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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/base/browser/ui/iconLabel/iconLabels", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatAgents", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/chat/common/chatModel", "vs/editor/common/core/range", "vs/platform/instantiation/common/serviceCollection", "vs/platform/contextkey/common/contextkey", "vs/css!./media/inlineChatContentWidget"], function (require, exports, dom, event_1, lifecycle_1, position_1, iconLabels_1, instantiation_1, inlineChat_1, chatWidget_1, chatAgents_1, colorRegistry_1, chatModel_1, range_1, serviceCollection_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatContentWidget = void 0;
    let InlineChatContentWidget = class InlineChatContentWidget {
        constructor(_editor, instaService, contextKeyService) {
            this._editor = _editor;
            this.suppressMouseDown = false;
            this.allowEditorOverflow = true;
            this._store = new lifecycle_1.DisposableStore();
            this._domNode = document.createElement('div');
            this._inputContainer = document.createElement('div');
            this._messageContainer = document.createElement('div');
            this._onDidBlur = this._store.add(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._visible = false;
            this._focusNext = false;
            this._defaultChatModel = this._store.add(instaService.createInstance(chatModel_1.ChatModel, `inlineChatDefaultModel/editorContentWidgetPlaceholder`, undefined));
            const scopedInstaService = instaService.createChild(new serviceCollection_1.ServiceCollection([
                contextkey_1.IContextKeyService,
                this._store.add(contextKeyService.createScoped(this._domNode))
            ]));
            this._widget = scopedInstaService.createInstance(chatWidget_1.ChatWidget, chatAgents_1.ChatAgentLocation.Editor, { resource: true }, {
                defaultElementHeight: 32,
                editorOverflowWidgetsDomNode: _editor.getOverflowWidgetsDomNode(),
                renderStyle: 'compact',
                renderInputOnTop: true,
                supportsFileReferences: false,
                menus: {
                    telemetrySource: 'inlineChat-content'
                },
                filter: _item => false
            }, {
                listForeground: colorRegistry_1.editorForeground,
                listBackground: inlineChat_1.inlineChatBackground,
                inputEditorBackground: colorRegistry_1.inputBackground,
                resultEditorBackground: colorRegistry_1.editorBackground
            });
            this._store.add(this._widget);
            this._widget.render(this._inputContainer);
            this._widget.setModel(this._defaultChatModel, {});
            this._store.add(this._widget.inputEditor.onDidContentSizeChange(() => _editor.layoutContentWidget(this)));
            this._domNode.tabIndex = -1;
            this._domNode.className = 'inline-chat-content-widget interactive-session';
            this._domNode.appendChild(this._inputContainer);
            this._messageContainer.classList.add('hidden', 'message');
            this._domNode.appendChild(this._messageContainer);
            const tracker = dom.trackFocus(this._domNode);
            this._store.add(tracker.onDidBlur(() => {
                if (this._visible
                // && !"ON"
                ) {
                    this._onDidBlur.fire();
                }
            }));
            this._store.add(tracker);
        }
        dispose() {
            this._store.dispose();
        }
        getId() {
            return 'inline-chat-content-widget';
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            if (!this._position) {
                return null;
            }
            return {
                position: this._position,
                preference: [1 /* ContentWidgetPositionPreference.ABOVE */]
            };
        }
        beforeRender() {
            const maxHeight = this._widget.input.inputEditor.getOption(67 /* EditorOption.lineHeight */) * 5;
            const inputEditorHeight = this._widget.inputEditor.getContentHeight();
            this._widget.inputEditor.layout(new dom.Dimension(360, Math.min(maxHeight, inputEditorHeight)));
            // const actualHeight = this._widget.inputPartHeight;
            // return new dom.Dimension(width, actualHeight);
            return null;
        }
        afterRender() {
            if (this._focusNext) {
                this._focusNext = false;
                this._widget.focusInput();
            }
        }
        // ---
        get chatWidget() {
            return this._widget;
        }
        get isVisible() {
            return this._visible;
        }
        get value() {
            return this._widget.inputEditor.getValue();
        }
        show(position) {
            if (!this._visible) {
                this._visible = true;
                this._focusNext = true;
                this._editor.revealRangeNearTopIfOutsideViewport(range_1.Range.fromPositions(position));
                this._widget.inputEditor.setValue('');
                const wordInfo = this._editor.getModel()?.getWordAtPosition(position);
                this._position = wordInfo ? new position_1.Position(position.lineNumber, wordInfo.startColumn) : position;
                this._editor.addContentWidget(this);
                this._widget.setVisible(true);
            }
        }
        hide() {
            if (this._visible) {
                this._visible = false;
                this._editor.removeContentWidget(this);
                this._widget.saveState();
                this._widget.setVisible(false);
            }
        }
        setSession(session) {
            this._widget.setModel(session.chatModel, {});
            this._widget.setInputPlaceholder(session.session.placeholder ?? '');
            this._updateMessage(session.session.message ?? '');
        }
        _updateMessage(message) {
            this._messageContainer.classList.toggle('hidden', !message);
            const renderedMessage = (0, iconLabels_1.renderLabelWithIcons)(message);
            dom.reset(this._messageContainer, ...renderedMessage);
            this._editor.layoutContentWidget(this);
        }
    };
    exports.InlineChatContentWidget = InlineChatContentWidget;
    exports.InlineChatContentWidget = InlineChatContentWidget = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService)
    ], InlineChatContentWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdENvbnRlbnRXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvYnJvd3Nlci9pbmxpbmVDaGF0Q29udGVudFdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQnpGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCO1FBcUJuQyxZQUNrQixPQUFvQixFQUNkLFlBQW1DLEVBQ3RDLGlCQUFxQztZQUZ4QyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBcEI3QixzQkFBaUIsR0FBRyxLQUFLLENBQUM7WUFDMUIsd0JBQW1CLEdBQUcsSUFBSSxDQUFDO1lBRW5CLFdBQU0sR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMvQixhQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6QyxvQkFBZSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEQsc0JBQWlCLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUlsRCxlQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzFELGNBQVMsR0FBZ0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFFaEQsYUFBUSxHQUFZLEtBQUssQ0FBQztZQUMxQixlQUFVLEdBQVksS0FBSyxDQUFDO1lBV25DLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLHFCQUFTLEVBQUUsdURBQXVELEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZ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