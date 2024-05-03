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
define(["require", "exports", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/codicons", "vs/base/common/keyCodes", "vs/editor/browser/editorExtensions", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/speech/common/speechService", "vs/base/common/cancellation", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/base/browser/dom", "vs/workbench/contrib/inlineChat/browser/inlineChatActions", "vs/platform/keybinding/common/keybinding", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/editorContextKeys", "vs/workbench/contrib/chat/common/voiceChat", "vs/css!./inlineChatQuickVoice"], function (require, exports, iconLabels_1, codicons_1, keyCodes_1, editorExtensions_1, nls_1, contextkey_1, speechService_1, cancellation_1, inlineChatController_1, dom, inlineChatActions_1, keybinding_1, event_1, lifecycle_1, editorContextKeys_1, voiceChat_1) {
    "use strict";
    var InlineChatQuickVoice_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatQuickVoice = exports.CancelAction = exports.StopAction = exports.StartAction = void 0;
    const CTX_QUICK_CHAT_IN_PROGRESS = new contextkey_1.RawContextKey('inlineChat.quickChatInProgress', false);
    class StartAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlineChat.quickVoice.start',
                title: (0, nls_1.localize2)('start', "Start Inline Voice Chat"),
                category: inlineChatActions_1.AbstractInlineChatAction.category,
                precondition: contextkey_1.ContextKeyExpr.and(speechService_1.HasSpeechProvider, CTX_QUICK_CHAT_IN_PROGRESS.toNegated(), editorContextKeys_1.EditorContextKeys.focus),
                f1: true,
                keybinding: {
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 39 /* KeyCode.KeyI */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 100
                }
            });
        }
        runEditorCommand(accessor, editor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const holdMode = keybindingService.enableKeybindingHoldMode(this.desc.id);
            if (holdMode) {
                let shouldCallStop = false;
                const handle = setTimeout(() => {
                    shouldCallStop = true;
                }, 500);
                holdMode.finally(() => {
                    clearTimeout(handle);
                    if (shouldCallStop) {
                        InlineChatQuickVoice.get(editor)?.stop();
                    }
                });
            }
            InlineChatQuickVoice.get(editor)?.start();
        }
    }
    exports.StartAction = StartAction;
    class StopAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlineChat.quickVoice.stop',
                title: (0, nls_1.localize2)('stop', "Stop Inline Voice Chat"),
                category: inlineChatActions_1.AbstractInlineChatAction.category,
                precondition: contextkey_1.ContextKeyExpr.and(speechService_1.HasSpeechProvider, CTX_QUICK_CHAT_IN_PROGRESS),
                f1: true,
                keybinding: {
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 39 /* KeyCode.KeyI */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 100
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            InlineChatQuickVoice.get(editor)?.stop();
        }
    }
    exports.StopAction = StopAction;
    class CancelAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlineChat.quickVoice.Cancel',
                title: (0, nls_1.localize)('Cancel', "Cancel Inline Voice Chat"),
                category: inlineChatActions_1.AbstractInlineChatAction.category,
                precondition: contextkey_1.ContextKeyExpr.and(speechService_1.HasSpeechProvider, CTX_QUICK_CHAT_IN_PROGRESS),
                keybinding: {
                    primary: 9 /* KeyCode.Escape */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        runEditorCommand(accessor, editor, ...args) {
            InlineChatQuickVoice.get(editor)?.cancel();
        }
    }
    exports.CancelAction = CancelAction;
    class QuickVoiceWidget {
        constructor(_editor) {
            this._editor = _editor;
            this.suppressMouseDown = true;
            this.allowEditorOverflow = true;
            this._domNode = document.createElement('div');
            this._elements = dom.h('.inline-chat-quick-voice@main', [
                dom.h('span@mic'),
                dom.h('span', [
                    dom.h('span.message@message'),
                    dom.h('span.preview@preview'),
                ])
            ]);
            this._onDidBlur = new event_1.Emitter();
            this.onDidBlur = this._onDidBlur.event;
            this._domNode.appendChild(this._elements.root);
            this._domNode.style.zIndex = '1000';
            this._domNode.tabIndex = -1;
            this._domNode.style.outline = 'none';
            dom.reset(this._elements.mic, (0, iconLabels_1.renderIcon)(codicons_1.Codicon.micFilled));
        }
        dispose() {
            this._focusTracker?.dispose();
            this._onDidBlur.dispose();
        }
        getId() {
            return 'inlineChatQuickVoice';
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            if (!this._editor.hasModel()) {
                return null;
            }
            const selection = this._editor.getSelection();
            return {
                position: selection.getStartPosition(),
                preference: [1 /* ContentWidgetPositionPreference.ABOVE */, 0 /* ContentWidgetPositionPreference.EXACT */]
            };
        }
        beforeRender() {
            const lineHeight = this._editor.getOption(67 /* EditorOption.lineHeight */);
            const width = this._editor.getLayoutInfo().contentWidth * 0.7;
            this._elements.main.style.setProperty('--vscode-inline-chat-quick-voice-height', `${lineHeight}px`);
            this._elements.main.style.setProperty('--vscode-inline-chat-quick-voice-width', `${width}px`);
            return null;
        }
        afterRender() {
            this._domNode.focus();
            this._focusTracker?.dispose();
            this._focusTracker = dom.trackFocus(this._domNode);
            this._focusTracker.onDidBlur(() => this._onDidBlur.fire());
        }
        // ---
        updateInput(data) {
            this._elements.message.textContent = data.message ?? '';
            this._elements.preview.textContent = data.preview ?? '';
        }
        show() {
            this._editor.addContentWidget(this);
        }
        active() {
            this._elements.main.classList.add('recording');
        }
        hide() {
            this._elements.main.classList.remove('recording');
            this._elements.message.textContent = '';
            this._elements.preview.textContent = '';
            this._editor.removeContentWidget(this);
            this._focusTracker?.dispose();
        }
    }
    let InlineChatQuickVoice = class InlineChatQuickVoice {
        static { InlineChatQuickVoice_1 = this; }
        static { this.ID = 'inlineChatQuickVoice'; }
        static get(editor) {
            return editor.getContribution(InlineChatQuickVoice_1.ID);
        }
        constructor(_editor, _voiceChatService, contextKeyService) {
            this._editor = _editor;
            this._voiceChatService = _voiceChatService;
            this._store = new lifecycle_1.DisposableStore();
            this._widget = this._store.add(new QuickVoiceWidget(this._editor));
            this._widget.onDidBlur(() => this._finishCallback?.(true), undefined, this._store);
            this._ctxQuickChatInProgress = CTX_QUICK_CHAT_IN_PROGRESS.bindTo(contextKeyService);
        }
        dispose() {
            this._finishCallback?.(true);
            this._ctxQuickChatInProgress.reset();
            this._store.dispose();
        }
        async start() {
            this._finishCallback?.(true);
            const cts = new cancellation_1.CancellationTokenSource();
            this._widget.show();
            this._ctxQuickChatInProgress.set(true);
            let message;
            let preview;
            const session = await this._voiceChatService.createVoiceChatSession(cts.token, { usesAgents: false });
            const listener = session.onDidChange(e => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                switch (e.status) {
                    case speechService_1.SpeechToTextStatus.Started:
                        this._widget.active();
                        break;
                    case speechService_1.SpeechToTextStatus.Stopped:
                        break;
                    case speechService_1.SpeechToTextStatus.Recognizing:
                        preview = e.text;
                        this._widget.updateInput({ message, preview });
                        break;
                    case speechService_1.SpeechToTextStatus.Recognized:
                        message = !message ? e.text : `${message} ${e.text}`;
                        preview = '';
                        this._widget.updateInput({ message, preview });
                        break;
                }
            });
            const done = (abort) => {
                cts.dispose(true);
                listener.dispose();
                this._widget.hide();
                this._ctxQuickChatInProgress.reset();
                this._editor.focus();
                if (!abort && message) {
                    inlineChatController_1.InlineChatController.get(this._editor)?.run({ message, autoSend: true });
                }
            };
            this._finishCallback = done;
        }
        stop() {
            this._finishCallback?.(false);
        }
        cancel() {
            this._finishCallback?.(true);
        }
    };
    exports.InlineChatQuickVoice = InlineChatQuickVoice;
    exports.InlineChatQuickVoice = InlineChatQuickVoice = InlineChatQuickVoice_1 = __decorate([
        __param(1, voiceChat_1.IVoiceChatService),
        __param(2, contextkey_1.IContextKeyService)
    ], InlineChatQuickVoice);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFF1aWNrVm9pY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvZWxlY3Ryb24tc2FuZGJveC9pbmxpbmVDaGF0UXVpY2tWb2ljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBMEJoRyxNQUFNLDBCQUEwQixHQUFHLElBQUksMEJBQWEsQ0FBVSxnQ0FBZ0MsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUV2RyxNQUFhLFdBQVksU0FBUSxnQ0FBYTtRQUU3QztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsNkJBQTZCO2dCQUNqQyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsT0FBTyxFQUFFLHlCQUF5QixDQUFDO2dCQUNwRCxRQUFRLEVBQUUsNENBQXdCLENBQUMsUUFBUTtnQkFDM0MsWUFBWSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLGlDQUFpQixFQUFFLDBCQUEwQixDQUFDLFNBQVMsRUFBRSxFQUFFLHFDQUFpQixDQUFDLEtBQUssQ0FBQztnQkFDcEgsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsVUFBVSxFQUFFO29CQUNYLE9BQU8sRUFBRSxJQUFBLG1CQUFRLEVBQUMsaURBQTZCLHdCQUFlO29CQUM5RCxNQUFNLEVBQUUsOENBQW9DLEdBQUc7aUJBQy9DO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLGdCQUFnQixDQUFDLFFBQTBCLEVBQUUsTUFBbUI7WUFDeEUsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7WUFFM0QsTUFBTSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZ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