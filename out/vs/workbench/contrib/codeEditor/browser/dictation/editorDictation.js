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
define(["require", "exports", "vs/nls", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/speech/common/speechService", "vs/base/common/codicons", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/platform/keybinding/common/keybinding", "vs/editor/common/core/editOperation", "vs/editor/common/core/selection", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/platform/actions/common/actions", "vs/base/common/types", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/themables", "vs/css!./editorDictation"], function (require, exports, nls_1, cancellation_1, lifecycle_1, contextkey_1, speechService_1, codicons_1, editorExtensions_1, editorContextKeys_1, keybinding_1, editOperation_1, selection_1, position_1, range_1, actions_1, types_1, actionbar_1, actions_2, themables_1) {
    "use strict";
    var EditorDictation_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorDictation = exports.DictationWidget = exports.EditorDictationStopAction = exports.EditorDictationStartAction = void 0;
    const EDITOR_DICTATION_IN_PROGRESS = new contextkey_1.RawContextKey('editorDictation.inProgress', false);
    const VOICE_CATEGORY = (0, nls_1.localize2)('voiceCategory', "Voice");
    class EditorDictationStartAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'workbench.action.editorDictation.start',
                title: (0, nls_1.localize2)('startDictation', "Start Dictation in Editor"),
                category: VOICE_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(speechService_1.HasSpeechProvider, EDITOR_DICTATION_IN_PROGRESS.toNegated(), editorContextKeys_1.EditorContextKeys.readOnly.toNegated()),
                f1: true,
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 52 /* KeyCode.KeyV */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
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
                        EditorDictation.get(editor)?.stop();
                    }
                });
            }
            EditorDictation.get(editor)?.start();
        }
    }
    exports.EditorDictationStartAction = EditorDictationStartAction;
    class EditorDictationStopAction extends editorExtensions_1.EditorAction2 {
        static { this.ID = 'workbench.action.editorDictation.stop'; }
        constructor() {
            super({
                id: EditorDictationStopAction.ID,
                title: (0, nls_1.localize2)('stopDictation', "Stop Dictation in Editor"),
                category: VOICE_CATEGORY,
                precondition: EDITOR_DICTATION_IN_PROGRESS,
                f1: true,
                keybinding: {
                    primary: 9 /* KeyCode.Escape */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 100
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            EditorDictation.get(editor)?.stop();
        }
    }
    exports.EditorDictationStopAction = EditorDictationStopAction;
    class DictationWidget extends lifecycle_1.Disposable {
        constructor(editor, keybindingService) {
            super();
            this.editor = editor;
            this.suppressMouseDown = true;
            this.allowEditorOverflow = true;
            this.domNode = document.createElement('div');
            const actionBar = this._register(new actionbar_1.ActionBar(this.domNode));
            const stopActionKeybinding = keybindingService.lookupKeybinding(EditorDictationStopAction.ID)?.getLabel();
            actionBar.push((0, actions_2.toAction)({
                id: EditorDictationStopAction.ID,
                label: stopActionKeybinding ? (0, nls_1.localize)('stopDictationShort1', "Stop Dictation ({0})", stopActionKeybinding) : (0, nls_1.localize)('stopDictationShort2', "Stop Dictation"),
                class: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.micFilled),
                run: () => EditorDictation.get(editor)?.stop()
            }), { icon: true, label: false, keybinding: stopActionKeybinding });
            this.domNode.classList.add('editor-dictation-widget');
            this.domNode.appendChild(actionBar.domNode);
        }
        getId() {
            return 'editorDictation';
        }
        getDomNode() {
            return this.domNode;
        }
        getPosition() {
            if (!this.editor.hasModel()) {
                return null;
            }
            const selection = this.editor.getSelection();
            return {
                position: selection.getPosition(),
                preference: [
                    selection.getPosition().equals(selection.getStartPosition()) ? 1 /* ContentWidgetPositionPreference.ABOVE */ : 2 /* ContentWidgetPositionPreference.BELOW */,
                    0 /* ContentWidgetPositionPreference.EXACT */
                ]
            };
        }
        beforeRender() {
            const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
            const width = this.editor.getLayoutInfo().contentWidth * 0.7;
            this.domNode.style.setProperty('--vscode-editor-dictation-widget-height', `${lineHeight}px`);
            this.domNode.style.setProperty('--vscode-editor-dictation-widget-width', `${width}px`);
            return null;
        }
        show() {
            this.editor.addContentWidget(this);
        }
        layout() {
            this.editor.layoutContentWidget(this);
        }
        active() {
            this.domNode.classList.add('recording');
        }
        hide() {
            this.domNode.classList.remove('recording');
            this.editor.removeContentWidget(this);
        }
    }
    exports.DictationWidget = DictationWidget;
    let EditorDictation = class EditorDictation extends lifecycle_1.Disposable {
        static { EditorDictation_1 = this; }
        static { this.ID = 'editorDictation'; }
        static get(editor) {
            return editor.getContribution(EditorDictation_1.ID);
        }
        constructor(editor, speechService, contextKeyService, keybindingService) {
            super();
            this.editor = editor;
            this.speechService = speechService;
            this.contextKeyService = contextKeyService;
            this.keybindingService = keybindingService;
            this.widget = this._register(new DictationWidget(this.editor, this.keybindingService));
            this.editorDictationInProgress = EDITOR_DICTATION_IN_PROGRESS.bindTo(this.contextKeyService);
            this.sessionDisposables = this._register(new lifecycle_1.MutableDisposable());
        }
        async start() {
            const disposables = new lifecycle_1.DisposableStore();
            this.sessionDisposables.value = disposables;
            this.widget.show();
            disposables.add((0, lifecycle_1.toDisposable)(() => this.widget.hide()));
            this.editorDictationInProgress.set(true);
            disposables.add((0, lifecycle_1.toDisposable)(() => this.editorDictationInProgress.reset()));
            const collection = this.editor.createDecorationsCollection();
            disposables.add((0, lifecycle_1.toDisposable)(() => collection.clear()));
            disposables.add(this.editor.onDidChangeCursorPosition(() => this.widget.layout()));
            let previewStart = undefined;
            let lastReplaceTextLength = 0;
            const replaceText = (text, isPreview) => {
                if (!previewStart) {
                    previewStart = (0, types_1.assertIsDefined)(this.editor.getPosition());
                }
                const endPosition = new position_1.Position(previewStart.lineNumber, previewStart.column + text.length);
                this.editor.executeEdits(EditorDictation_1.ID, [
                    editOperation_1.EditOperation.replace(range_1.Range.fromPositions(previewStart, previewStart.with(undefined, previewStart.column + lastReplaceTextLength)), text)
                ], [
                    selection_1.Selection.fromPositions(endPosition)
                ]);
                if (isPreview) {
                    collection.set([
                        {
                            range: range_1.Range.fromPositions(previewStart, previewStart.with(undefined, previewStart.column + text.length)),
                            options: {
                                description: 'editor-dictation-preview',
                                inlineClassName: 'ghost-text-decoration-preview'
                            }
                        }
                    ]);
                }
                else {
                    collection.clear();
                }
                lastReplaceTextLength = text.length;
                if (!isPreview) {
                    previewStart = undefined;
                    lastReplaceTextLength = 0;
                }
                this.editor.revealPositionInCenterIfOutsideViewport(endPosition);
            };
            const cts = new cancellation_1.CancellationTokenSource();
            disposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            const session = await this.speechService.createSpeechToTextSession(cts.token, 'editor');
            disposables.add(session.onDidChange(e => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                switch (e.status) {
                    case speechService_1.SpeechToTextStatus.Started:
                        this.widget.active();
                        break;
                    case speechService_1.SpeechToTextStatus.Stopped:
                        disposables.dispose();
                        break;
                    case speechService_1.SpeechToTextStatus.Recognizing: {
                        if (!e.text) {
                            return;
                        }
                        replaceText(e.text, true);
                        break;
                    }
                    case speechService_1.SpeechToTextStatus.Recognized: {
                        if (!e.text) {
                            return;
                        }
                        replaceText(`${e.text} `, false);
                        break;
                    }
                }
            }));
        }
        stop() {
            this.sessionDisposables.clear();
        }
    };
    exports.EditorDictation = EditorDictation;
    exports.EditorDictation = EditorDictation = EditorDictation_1 = __decorate([
        __param(1, speechService_1.ISpeechService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, keybinding_1.IKeybindingService)
    ], EditorDictation);
    (0, editorExtensions_1.registerEditorContribution)(EditorDictation.ID, EditorDictation, 4 /* EditorContributionInstantiation.Lazy */);
    (0, actions_1.registerAction2)(EditorDictationStartAction);
    (0, actions_1.registerAction2)(EditorDictationStopAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yRGljdGF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb2RlRWRpdG9yL2Jyb3dzZXIvZGljdGF0aW9uL2VkaXRvckRpY3RhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNkJoRyxNQUFNLDRCQUE0QixHQUFHLElBQUksMEJBQWEsQ0FBVSw0QkFBNEIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNyRyxNQUFNLGNBQWMsR0FBRyxJQUFBLGVBQVMsRUFBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFM0QsTUFBYSwwQkFBMkIsU0FBUSxnQ0FBYTtRQUU1RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsd0NBQXdDO2dCQUM1QyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsZ0JBQWdCLEVBQUUsMkJBQTJCLENBQUM7Z0JBQy9ELFFBQVEsRUFBRSxjQUFjO2dCQUN4QixZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsaUNBQWlCLEVBQUUsNEJBQTRCLENBQUMsU0FBUyxFQUFFLEVBQUUscUNBQWlCLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNySSxFQUFFLEVBQUUsSUFBSTtnQkFDUixVQUFVLEVBQUU7b0JBQ1gsT0FBTyxFQUFFLGdEQUEyQix3QkFBZTtvQkFDbkQsTUFBTSw2Q0FBbUM7aUJBQ3pDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLGdCQUFnQixDQUFDLFFBQTBCLEVBQUUsTUFBbUI7WUFDeEUsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7WUFFM0QsTUFBTSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsd0JBQXdCLENBQUMsSUFB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