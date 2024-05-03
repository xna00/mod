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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/mouseCursor/mouseCursor", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/browser/commentFormActions", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/common/commentContextKeys", "./simpleCommentEditor", "vs/platform/keybinding/common/keybinding", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory"], function (require, exports, dom, mouseCursor_1, lifecycle_1, uri_1, uuid_1, language_1, model_1, nls, configuration_1, colorRegistry_1, themeService_1, commentFormActions_1, commentService_1, commentContextKeys_1, simpleCommentEditor_1, keybinding_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentReply = exports.COMMENTEDITOR_DECORATION_KEY = void 0;
    const COMMENT_SCHEME = 'comment';
    let INMEM_MODEL_ID = 0;
    exports.COMMENTEDITOR_DECORATION_KEY = 'commenteditordecoration';
    let CommentReply = class CommentReply extends lifecycle_1.Disposable {
        constructor(owner, container, _parentEditor, _commentThread, _scopedInstatiationService, _contextKeyService, _commentMenus, _commentOptions, _pendingComment, _parentThread, _actionRunDelegate, commentService, languageService, modelService, themeService, configurationService, keybindingService) {
            super();
            this.owner = owner;
            this._parentEditor = _parentEditor;
            this._commentThread = _commentThread;
            this._scopedInstatiationService = _scopedInstatiationService;
            this._contextKeyService = _contextKeyService;
            this._commentMenus = _commentMenus;
            this._commentOptions = _commentOptions;
            this._pendingComment = _pendingComment;
            this._parentThread = _parentThread;
            this._actionRunDelegate = _actionRunDelegate;
            this.commentService = commentService;
            this.languageService = languageService;
            this.modelService = modelService;
            this.themeService = themeService;
            this.keybindingService = keybindingService;
            this._commentThreadDisposables = [];
            this._editorHeight = simpleCommentEditor_1.MIN_EDITOR_HEIGHT;
            this.form = dom.append(container, dom.$('.comment-form'));
            this.commentEditor = this._register(this._scopedInstatiationService.createInstance(simpleCommentEditor_1.SimpleCommentEditor, this.form, simpleCommentEditor_1.SimpleCommentEditor.getEditorOptions(configurationService), _contextKeyService, this._parentThread));
            this.commentEditorIsEmpty = commentContextKeys_1.CommentContextKeys.commentIsEmpty.bindTo(this._contextKeyService);
            this.commentEditorIsEmpty.set(!this._pendingComment);
            const hasExistingComments = this._commentThread.comments && this._commentThread.comments.length > 0;
            const modeId = (0, uuid_1.generateUuid)() + '-' + (hasExistingComments ? this._commentThread.threadId : ++INMEM_MODEL_ID);
            const params = JSON.stringify({
                extensionId: this._commentThread.extensionId,
                commentThreadId: this._commentThread.threadId
            });
            let resource = uri_1.URI.parse(`${COMMENT_SCHEME}://${this._commentThread.extensionId}/commentinput-${modeId}.md?${params}`); // TODO. Remove params once extensions adopt authority.
            const commentController = this.commentService.getCommentController(owner);
            if (commentController) {
                resource = resource.with({ authority: commentController.id });
            }
            const model = this.modelService.createModel(this._pendingComment || '', this.languageService.createByFilepathOrFirstLine(resource), resource, false);
            this._register(model);
            this.commentEditor.setModel(model);
            this.calculateEditorHeight();
            this._register((model.onDidChangeContent(() => {
                this.setCommentEditorDecorations();
                this.commentEditorIsEmpty?.set(!this.commentEditor.getValue());
                if (this.calculateEditorHeight()) {
                    this.commentEditor.layout({ height: this._editorHeight, width: this.commentEditor.getLayoutInfo().width });
                    this.commentEditor.render(true);
                }
            })));
            this.createTextModelListener(this.commentEditor, this.form);
            this.setCommentEditorDecorations();
            // Only add the additional step of clicking a reply button to expand the textarea when there are existing comments
            if (hasExistingComments) {
                this.createReplyButton(this.commentEditor, this.form);
            }
            else if ((this._commentThread.comments && this._commentThread.comments.length === 0) || this._pendingComment) {
                this.expandReplyArea();
            }
            this._error = dom.append(this.form, dom.$('.validation-error.hidden'));
            const formActions = dom.append(this.form, dom.$('.form-actions'));
            this._formActions = dom.append(formActions, dom.$('.other-actions'));
            this.createCommentWidgetFormActions(this._formActions, model);
            this._editorActions = dom.append(formActions, dom.$('.editor-actions'));
            this.createCommentWidgetEditorActions(this._editorActions, model);
        }
        calculateEditorHeight() {
            const newEditorHeight = (0, simpleCommentEditor_1.calculateEditorHeight)(this._parentEditor, this.commentEditor, this._editorHeight);
            if (newEditorHeight !== this._editorHeight) {
                this._editorHeight = newEditorHeight;
                return true;
            }
            return false;
        }
        updateCommentThread(commentThread) {
            const isReplying = this.commentEditor.hasTextFocus();
            if (!this._reviewThreadReplyButton) {
                this.createReplyButton(this.commentEditor, this.form);
            }
            if (this._commentThread.comments && this._commentThread.comments.length === 0) {
                this.expandReplyArea();
            }
            if (isReplying) {
                this.commentEditor.focus();
            }
        }
        getPendingComment() {
            const model = this.commentEditor.getModel();
            if (model && model.getValueLength() > 0) { // checking length is cheap
                return model.getValue();
            }
            return undefined;
        }
        setPendingComment(comment) {
            this._pendingComment = comment;
            this.expandReplyArea();
            this.commentEditor.setValue(comment);
        }
        layout(widthInPixel) {
            this.commentEditor.layout({ height: this._editorHeight, width: widthInPixel - 54 /* margin 20px * 10 + scrollbar 14px*/ });
        }
        focusIfNeeded() {
            if (!this._commentThread.comments || !this._commentThread.comments.length) {
                this.commentEditor.focus();
            }
            else if (this.commentEditor.getModel().getValueLength() > 0) {
                this.expandReplyArea();
            }
        }
        focusCommentEditor() {
            this.commentEditor.focus();
        }
        expandReplyAreaAndFocusCommentEditor() {
            this.expandReplyArea();
            this.commentEditor.focus();
        }
        isCommentEditorFocused() {
            return this.commentEditor.hasWidgetFocus();
        }
        getCommentModel() {
            return this.commentEditor.getModel();
        }
        updateCanReply() {
            if (!this._commentThread.canReply) {
                this.form.style.display = 'none';
            }
            else {
                this.form.style.display = 'block';
            }
        }
        async submitComment() {
            await this._commentFormActions?.triggerDefaultAction();
            this._pendingComment = undefined;
        }
        setCommentEditorDecorations() {
            const model = this.commentEditor.getModel();
            if (model) {
                const valueLength = model.getValueLength();
                const hasExistingComments = this._commentThread.comments && this._commentThread.comments.length > 0;
                const placeholder = valueLength > 0
                    ? ''
                    : hasExistingComments
                        ? (this._commentOptions?.placeHolder || nls.localize('reply', "Reply..."))
                        : (this._commentOptions?.placeHolder || nls.localize('newComment', "Type a new comment"));
                const decorations = [{
                        range: {
                            startLineNumber: 0,
                            endLineNumber: 0,
                            startColumn: 0,
                            endColumn: 1
                        },
                        renderOptions: {
                            after: {
                                contentText: placeholder,
                                color: `${(0, colorRegistry_1.resolveColorValue)(colorRegistry_1.editorForeground, this.themeService.getColorTheme())?.transparent(0.4)}`
                            }
                        }
                    }];
                this.commentEditor.setDecorationsByType('review-zone-widget', exports.COMMENTEDITOR_DECORATION_KEY, decorations);
            }
        }
        createTextModelListener(commentEditor, commentForm) {
            this._commentThreadDisposables.push(commentEditor.onDidFocusEditorWidget(() => {
                this._commentThread.input = {
                    uri: commentEditor.getModel().uri,
                    value: commentEditor.getValue()
                };
                this.commentService.setActiveEditingCommentThread(this._commentThread);
                this.commentService.setActiveCommentAndThread(this.owner, { thread: this._commentThread });
            }));
            this._commentThreadDisposables.push(commentEditor.getModel().onDidChangeContent(() => {
                const modelContent = commentEditor.getValue();
                if (this._commentThread.input && this._commentThread.input.uri === commentEditor.getModel().uri && this._commentThread.input.value !== modelContent) {
                    const newInput = this._commentThread.input;
                    newInput.value = modelContent;
                    this._commentThread.input = newInput;
                }
                this.commentService.setActiveEditingCommentThread(this._commentThread);
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeInput(input => {
                const thread = this._commentThread;
                const model = commentEditor.getModel();
                if (thread.input && model && (thread.input.uri !== model.uri)) {
                    return;
                }
                if (!input) {
                    return;
                }
                if (commentEditor.getValue() !== input.value) {
                    commentEditor.setValue(input.value);
                    if (input.value === '') {
                        this._pendingComment = '';
                        commentForm.classList.remove('expand');
                        commentEditor.getDomNode().style.outline = '';
                        this._error.textContent = '';
                        this._error.classList.add('hidden');
                    }
                }
            }));
        }
        /**
         * Command based actions.
         */
        createCommentWidgetFormActions(container, model) {
            const menu = this._commentMenus.getCommentThreadActions(this._contextKeyService);
            this._register(menu);
            this._register(menu.onDidChange(() => {
                this._commentFormActions.setActions(menu);
            }));
            this._commentFormActions = new commentFormActions_1.CommentFormActions(this.keybindingService, this._contextKeyService, container, async (action) => {
                await this._actionRunDelegate?.();
                await action.run({
                    thread: this._commentThread,
                    text: this.commentEditor.getValue(),
                    $mid: 9 /* MarshalledId.CommentThreadReply */
                });
                this.hideReplyArea();
            });
            this._register(this._commentFormActions);
            this._commentFormActions.setActions(menu);
        }
        createCommentWidgetEditorActions(container, model) {
            const editorMenu = this._commentMenus.getCommentEditorActions(this._contextKeyService);
            this._register(editorMenu);
            this._register(editorMenu.onDidChange(() => {
                this._commentEditorActions.setActions(editorMenu);
            }));
            this._commentEditorActions = new commentFormActions_1.CommentFormActions(this.keybindingService, this._contextKeyService, container, async (action) => {
                this._actionRunDelegate?.();
                action.run({
                    thread: this._commentThread,
                    text: this.commentEditor.getValue(),
                    $mid: 9 /* MarshalledId.CommentThreadReply */
                });
                this.focusCommentEditor();
            });
            this._register(this._commentEditorActions);
            this._commentEditorActions.setActions(editorMenu, true);
        }
        get isReplyExpanded() {
            return this.form.classList.contains('expand');
        }
        expandReplyArea() {
            if (!this.isReplyExpanded) {
                this.form.classList.add('expand');
                this.commentEditor.focus();
                this.commentEditor.layout();
            }
        }
        clearAndExpandReplyArea() {
            if (!this.isReplyExpanded) {
                this.commentEditor.setValue('');
                this.expandReplyArea();
            }
        }
        hideReplyArea() {
            this.commentEditor.getDomNode().style.outline = '';
            this.commentEditor.setValue('');
            this._pendingComment = '';
            this.form.classList.remove('expand');
            this._error.textContent = '';
            this._error.classList.add('hidden');
        }
        createReplyButton(commentEditor, commentForm) {
            this._reviewThreadReplyButton = dom.append(commentForm, dom.$(`button.review-thread-reply-button.${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`));
            this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this._reviewThreadReplyButton, this._commentOptions?.prompt || nls.localize('reply', "Reply...")));
            this._reviewThreadReplyButton.textContent = this._commentOptions?.prompt || nls.localize('reply', "Reply...");
            // bind click/escape actions for reviewThreadReplyButton and textArea
            this._register(dom.addDisposableListener(this._reviewThreadReplyButton, 'click', _ => this.clearAndExpandReplyArea()));
            this._register(dom.addDisposableListener(this._reviewThreadReplyButton, 'focus', _ => this.clearAndExpandReplyArea()));
            commentEditor.onDidBlurEditorWidget(() => {
                if (commentEditor.getModel().getValueLength() === 0 && commentForm.classList.contains('expand')) {
                    commentForm.classList.remove('expand');
                }
            });
        }
        dispose() {
            super.dispose();
            (0, lifecycle_1.dispose)(this._commentThreadDisposables);
        }
    };
    exports.CommentReply = CommentReply;
    exports.CommentReply = CommentReply = __decorate([
        __param(11, commentService_1.ICommentService),
        __param(12, language_1.ILanguageService),
        __param(13, model_1.IModelService),
        __param(14, themeService_1.IThemeService),
        __param(15, configuration_1.IConfigurationService),
        __param(16, keybinding_1.IKeybindingService)
    ], CommentReply);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudFJlcGx5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9icm93c2VyL2NvbW1lbnRSZXBseS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQ2hHLE1BQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQztJQUNqQyxJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUM7SUFDVixRQUFBLDRCQUE0QixHQUFHLHlCQUF5QixDQUFDO0lBRS9ELElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQTRDLFNBQVEsc0JBQVU7UUFhMUUsWUFDVSxLQUFhLEVBQ3RCLFNBQXNCLEVBQ0wsYUFBK0IsRUFDeEMsY0FBMEMsRUFDMUMsMEJBQWlELEVBQ2pELGtCQUFzQyxFQUN0QyxhQUEyQixFQUMzQixlQUFxRCxFQUNyRCxlQUFtQyxFQUNuQyxhQUFtQyxFQUNuQyxrQkFBdUMsRUFDOUIsY0FBdUMsRUFDdEMsZUFBeUMsRUFDNUMsWUFBbUMsRUFDbkMsWUFBbUMsRUFDM0Isb0JBQTJDLEVBQzlDLGlCQUE2QztZQUVqRSxLQUFLLEVBQUUsQ0FBQztZQWxCQyxVQUFLLEdBQUwsS0FBSyxDQUFRO1lBRUwsa0JBQWEsR0FBYixhQUFhLENBQWtCO1lBQ3hDLG1CQUFjLEdBQWQsY0FBYyxDQUE0QjtZQUMxQywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQXVCO1lBQ2pELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDdEMsa0JBQWEsR0FBYixhQUFhLENBQWM7WUFDM0Isb0JBQWUsR0FBZixlQUFlLENBQXNDO1lBQ3JELG9CQUFlLEdBQWYsZUFBZSxDQUFvQjtZQUNuQyxrQkFBYSxHQUFiLGFBQWEsQ0FBc0I7WUFDbkMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN0QixtQkFB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