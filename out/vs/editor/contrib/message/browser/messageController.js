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
define(["require", "exports", "vs/base/browser/markdownRenderer", "vs/base/browser/ui/aria/aria", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/opener/common/opener", "vs/base/browser/dom", "vs/css!./messageController"], function (require, exports, markdownRenderer_1, aria_1, event_1, htmlContent_1, lifecycle_1, editorExtensions_1, range_1, markdownRenderer_2, nls, contextkey_1, opener_1, dom) {
    "use strict";
    var MessageController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessageController = void 0;
    let MessageController = class MessageController {
        static { MessageController_1 = this; }
        static { this.ID = 'editor.contrib.messageController'; }
        static { this.MESSAGE_VISIBLE = new contextkey_1.RawContextKey('messageVisible', false, nls.localize('messageVisible', 'Whether the editor is currently showing an inline message')); }
        static get(editor) {
            return editor.getContribution(MessageController_1.ID);
        }
        constructor(editor, contextKeyService, _openerService) {
            this._openerService = _openerService;
            this._messageWidget = new lifecycle_1.MutableDisposable();
            this._messageListeners = new lifecycle_1.DisposableStore();
            this._mouseOverMessage = false;
            this._editor = editor;
            this._visible = MessageController_1.MESSAGE_VISIBLE.bindTo(contextKeyService);
        }
        dispose() {
            this._message?.dispose();
            this._messageListeners.dispose();
            this._messageWidget.dispose();
            this._visible.reset();
        }
        isVisible() {
            return this._visible.get();
        }
        showMessage(message, position) {
            (0, aria_1.alert)((0, htmlContent_1.isMarkdownString)(message) ? message.value : message);
            this._visible.set(true);
            this._messageWidget.clear();
            this._messageListeners.clear();
            this._message = (0, htmlContent_1.isMarkdownString)(message) ? (0, markdownRenderer_1.renderMarkdown)(message, {
                actionHandler: {
                    callback: (url) => {
                        this.closeMessage();
                        (0, markdownRenderer_2.openLinkFromMarkdown)(this._openerService, url, (0, htmlContent_1.isMarkdownString)(message) ? message.isTrusted : undefined);
                    },
                    disposables: this._messageListeners
                },
            }) : undefined;
            this._messageWidget.value = new MessageWidget(this._editor, position, typeof message === 'string' ? message : this._message.element);
            // close on blur (debounced to allow to tab into the message), cursor, model change, dispose
            this._messageListeners.add(event_1.Event.debounce(this._editor.onDidBlurEditorText, (last, event) => event, 0)(() => {
                if (this._mouseOverMessage) {
                    return; // override when mouse over message
                }
                if (this._messageWidget.value && dom.isAncestor(dom.getActiveElement(), this._messageWidget.value.getDomNode())) {
                    return; // override when focus is inside the message
                }
                this.closeMessage();
            }));
            this._messageListeners.add(this._editor.onDidChangeCursorPosition(() => this.closeMessage()));
            this._messageListeners.add(this._editor.onDidDispose(() => this.closeMessage()));
            this._messageListeners.add(this._editor.onDidChangeModel(() => this.closeMessage()));
            this._messageListeners.add(dom.addDisposableListener(this._messageWidget.value.getDomNode(), dom.EventType.MOUSE_ENTER, () => this._mouseOverMessage = true, true));
            this._messageListeners.add(dom.addDisposableListener(this._messageWidget.value.getDomNode(), dom.EventType.MOUSE_LEAVE, () => this._mouseOverMessage = false, true));
            // close on mouse move
            let bounds;
            this._messageListeners.add(this._editor.onMouseMove(e => {
                // outside the text area
                if (!e.target.position) {
                    return;
                }
                if (!bounds) {
                    // define bounding box around position and first mouse occurance
                    bounds = new range_1.Range(position.lineNumber - 3, 1, e.target.position.lineNumber + 3, 1);
                }
                else if (!bounds.containsPosition(e.target.position)) {
                    // check if position is still in bounds
                    this.closeMessage();
                }
            }));
        }
        closeMessage() {
            this._visible.reset();
            this._messageListeners.clear();
            if (this._messageWidget.value) {
                this._messageListeners.add(MessageWidget.fadeOut(this._messageWidget.value));
            }
        }
    };
    exports.MessageController = MessageController;
    exports.MessageController = MessageController = MessageController_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, opener_1.IOpenerService)
    ], MessageController);
    const MessageCommand = editorExtensions_1.EditorCommand.bindToContribution(MessageController.get);
    (0, editorExtensions_1.registerEditorCommand)(new MessageCommand({
        id: 'leaveEditorMessage',
        precondition: MessageController.MESSAGE_VISIBLE,
        handler: c => c.closeMessage(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 30,
            primary: 9 /* KeyCode.Escape */
        }
    }));
    class MessageWidget {
        static fadeOut(messageWidget) {
            const dispose = () => {
                messageWidget.dispose();
                clearTimeout(handle);
                messageWidget.getDomNode().removeEventListener('animationend', dispose);
            };
            const handle = setTimeout(dispose, 110);
            messageWidget.getDomNode().addEventListener('animationend', dispose);
            messageWidget.getDomNode().classList.add('fadeOut');
            return { dispose };
        }
        constructor(editor, { lineNumber, column }, text) {
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this.suppressMouseDown = false;
            this._editor = editor;
            this._editor.revealLinesInCenterIfOutsideViewport(lineNumber, lineNumber, 0 /* ScrollType.Smooth */);
            this._position = { lineNumber, column };
            this._domNode = document.createElement('div');
            this._domNode.classList.add('monaco-editor-overlaymessage');
            this._domNode.style.marginLeft = '-6px';
            const anchorTop = document.createElement('div');
            anchorTop.classList.add('anchor', 'top');
            this._domNode.appendChild(anchorTop);
            const message = document.createElement('div');
            if (typeof text === 'string') {
                message.classList.add('message');
                message.textContent = text;
            }
            else {
                text.classList.add('message');
                message.appendChild(text);
            }
            this._domNode.appendChild(message);
            const anchorBottom = document.createElement('div');
            anchorBottom.classList.add('anchor', 'below');
            this._domNode.appendChild(anchorBottom);
            this._editor.addContentWidget(this);
            this._domNode.classList.add('fadeIn');
        }
        dispose() {
            this._editor.removeContentWidget(this);
        }
        getId() {
            return 'messageoverlay';
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return {
                position: this._position,
                preference: [
                    1 /* ContentWidgetPositionPreference.ABOVE */,
                    2 /* ContentWidgetPositionPreference.BELOW */,
                ],
                positionAffinity: 1 /* PositionAffinity.Right */,
            };
        }
        afterRender(position) {
            this._domNode.classList.toggle('below', position === 2 /* ContentWidgetPositionPreference.BELOW */);
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(MessageController.ID, MessageController, 4 /* EditorContributionInstantiation.Lazy */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZUNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL21lc3NhZ2UvYnJvd3Nlci9tZXNzYWdlQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0J6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFpQjs7aUJBRU4sT0FBRSxHQUFHLGtDQUFrQyxBQUFyQyxDQUFzQztpQkFFL0Msb0JBQWUsR0FBRyxJQUFJLDBCQUFhLENBQVUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsMkRBQTJELENBQUMsQ0FBQyxBQUFuSixDQUFvSjtRQUVuTCxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQzdCLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBb0IsbUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQVNELFlBQ0MsTUFBbUIsRUFDQyxpQkFBcUMsRUFDekMsY0FBK0M7WUFBOUIsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBUi9DLG1CQUFjLEdBQUcsSUFBSSw2QkFBaUIsRUFBaUIsQ0FBQztZQUN4RCxzQkFBaUIsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUVuRCxzQkFBaUIsR0FBWSxLQUFLLENBQUM7WUFRMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxtQkFBaUIsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDN0UsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxpQkFBaUIsQ0FB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