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
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/base/common/lifecycle", "vs/editor/common/languages", "vs/base/common/event", "vs/workbench/contrib/comments/browser/commentService", "vs/base/browser/keyboardEvent", "vs/workbench/contrib/comments/browser/commentNode", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/platform/opener/common/opener", "vs/editor/common/languages/language"], function (require, exports, dom, nls, lifecycle_1, languages, event_1, commentService_1, keyboardEvent_1, commentNode_1, markdownRenderer_1, opener_1, language_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentThreadBody = void 0;
    let CommentThreadBody = class CommentThreadBody extends lifecycle_1.Disposable {
        get length() {
            return this._commentThread.comments ? this._commentThread.comments.length : 0;
        }
        get activeComment() {
            return this._commentElements.filter(node => node.isEditing)[0];
        }
        constructor(_parentEditor, owner, parentResourceUri, container, _options, _commentThread, _pendingEdits, _scopedInstatiationService, _parentCommentThreadWidget, commentService, openerService, languageService) {
            super();
            this._parentEditor = _parentEditor;
            this.owner = owner;
            this.parentResourceUri = parentResourceUri;
            this.container = container;
            this._options = _options;
            this._commentThread = _commentThread;
            this._pendingEdits = _pendingEdits;
            this._scopedInstatiationService = _scopedInstatiationService;
            this._parentCommentThreadWidget = _parentCommentThreadWidget;
            this.commentService = commentService;
            this.openerService = openerService;
            this.languageService = languageService;
            this._commentElements = [];
            this._focusedComment = undefined;
            this._onDidResize = new event_1.Emitter();
            this.onDidResize = this._onDidResize.event;
            this._commentDisposable = new Map();
            this._register(dom.addDisposableListener(container, dom.EventType.FOCUS_IN, e => {
                // TODO @rebornix, limit T to IRange | ICellRange
                this.commentService.setActiveEditingCommentThread(this._commentThread);
            }));
            this._markdownRenderer = this._register(new markdownRenderer_1.MarkdownRenderer(this._options, this.languageService, this.openerService));
        }
        focus() {
            this._commentsElement.focus();
        }
        display() {
            this._commentsElement = dom.append(this.container, dom.$('div.comments-container'));
            this._commentsElement.setAttribute('role', 'presentation');
            this._commentsElement.tabIndex = 0;
            this._updateAriaLabel();
            this._register(dom.addDisposableListener(this._commentsElement, dom.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if ((event.equals(16 /* KeyCode.UpArrow */) || event.equals(18 /* KeyCode.DownArrow */)) && (!this._focusedComment || !this._commentElements[this._focusedComment].isEditing)) {
                    const moveFocusWithinBounds = (change) => {
                        if (this._focusedComment === undefined && change >= 0) {
                            return 0;
                        }
                        if (this._focusedComment === undefined && change < 0) {
                            return this._commentElements.length - 1;
                        }
                        const newIndex = this._focusedComment + change;
                        return Math.min(Math.max(0, newIndex), this._commentElements.length - 1);
                    };
                    this._setFocusedComment(event.equals(16 /* KeyCode.UpArrow */) ? moveFocusWithinBounds(-1) : moveFocusWithinBounds(1));
                }
            }));
            this._commentElements = [];
            if (this._commentThread.comments) {
                for (const comment of this._commentThread.comments) {
                    const newCommentNode = this.createNewCommentNode(comment);
                    this._commentElements.push(newCommentNode);
                    this._commentsElement.appendChild(newCommentNode.domNode);
                    if (comment.mode === languages.CommentMode.Editing) {
                        newCommentNode.switchToEditMode();
                    }
                }
            }
            this._resizeObserver = new MutationObserver(this._refresh.bind(this));
            this._resizeObserver.observe(this.container, {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
            });
        }
        _refresh() {
            const dimensions = dom.getClientArea(this.container);
            this._onDidResize.fire(dimensions);
        }
        getDimensions() {
            return dom.getClientArea(this.container);
        }
        layout(widthInPixel) {
            this._commentElements.forEach(element => {
                element.layout(widthInPixel);
            });
        }
        getPendingEdits() {
            const pendingEdits = {};
            this._commentElements.forEach(element => {
                if (element.isEditing) {
                    const pendingEdit = element.getPendingEdit();
                    if (pendingEdit) {
                        pendingEdits[element.comment.uniqueIdInThread] = pendingEdit;
                    }
                }
            });
            return pendingEdits;
        }
        getCommentCoords(commentUniqueId) {
            const matchedNode = this._commentElements.filter(commentNode => commentNode.comment.uniqueIdInThread === commentUniqueId);
            if (matchedNode && matchedNode.length) {
                const commentThreadCoords = dom.getDomNodePagePosition(this._commentElements[0].domNode);
                const commentCoords = dom.getDomNodePagePosition(matchedNode[0].domNode);
                return {
                    thread: commentThreadCoords,
                    comment: commentCoords
                };
            }
            return;
        }
        updateCommentThread(commentThread, preserveFocus) {
            const oldCommentsLen = this._commentElements.length;
            const newCommentsLen = commentThread.comments ? commentThread.comments.length : 0;
            const commentElementsToDel = [];
            const commentElementsToDelIndex = [];
            for (let i = 0; i < oldCommentsLen; i++) {
                const comment = this._commentElements[i].comment;
                const newComment = commentThread.comments ? commentThread.comments.filter(c => c.uniqueIdInThread === comment.uniqueIdInThread) : [];
                if (newComment.length) {
                    this._commentElements[i].update(newComment[0]);
                }
                else {
                    commentElementsToDelIndex.push(i);
                    commentElementsToDel.push(this._commentElements[i]);
                }
            }
            // del removed elements
            for (let i = commentElementsToDel.length - 1; i >= 0; i--) {
                const commentToDelete = commentElementsToDel[i];
                this._commentDisposable.get(commentToDelete)?.dispose();
                this._commentDisposable.delete(commentToDelete);
                this._commentElements.splice(commentElementsToDelIndex[i], 1);
                this._commentsElement.removeChild(commentToDelete.domNode);
            }
            let lastCommentElement = null;
            const newCommentNodeList = [];
            const newCommentsInEditMode = [];
            for (let i = newCommentsLen - 1; i >= 0; i--) {
                const currentComment = commentThread.comments[i];
                const oldCommentNode = this._commentElements.filter(commentNode => commentNode.comment.uniqueIdInThread === currentComment.uniqueIdInThread);
                if (oldCommentNode.length) {
                    lastCommentElement = oldCommentNode[0].domNode;
                    newCommentNodeList.unshift(oldCommentNode[0]);
                }
                else {
                    const newElement = this.createNewCommentNode(currentComment);
                    newCommentNodeList.unshift(newElement);
                    if (lastCommentElement) {
                        this._commentsElement.insertBefore(newElement.domNode, lastCommentElement);
                        lastCommentElement = newElement.domNode;
                    }
                    else {
                        this._commentsElement.appendChild(newElement.domNode);
                        lastCommentElement = newElement.domNode;
                    }
                    if (currentComment.mode === languages.CommentMode.Editing) {
                        newElement.switchToEditMode();
                        newCommentsInEditMode.push(newElement);
                    }
                }
            }
            this._commentThread = commentThread;
            this._commentElements = newCommentNodeList;
            if (newCommentsInEditMode.length) {
                const lastIndex = this._commentElements.indexOf(newCommentsInEditMode[newCommentsInEditMode.length - 1]);
                this._focusedComment = lastIndex;
            }
            this._updateAriaLabel();
            if (!preserveFocus) {
                this._setFocusedComment(this._focusedComment);
            }
        }
        _updateAriaLabel() {
            if (this._commentThread.isDocumentCommentThread()) {
                if (this._commentThread.range) {
                    this._commentsElement.ariaLabel = nls.localize('commentThreadAria.withRange', "Comment thread with {0} comments on lines {1} through {2}. {3}.", this._commentThread.comments?.length, this._commentThread.range.startLineNumber, this._commentThread.range.endLineNumber, this._commentThread.label);
                }
                else {
                    this._commentsElement.ariaLabel = nls.localize('commentThreadAria.document', "Comment thread with {0} comments on the entire document. {1}.", this._commentThread.comments?.length, this._commentThread.label);
                }
            }
            else {
                this._commentsElement.ariaLabel = nls.localize('commentThreadAria', "Comment thread with {0} comments. {1}.", this._commentThread.comments?.length, this._commentThread.label);
            }
        }
        _setFocusedComment(value) {
            if (this._focusedComment !== undefined) {
                this._commentElements[this._focusedComment]?.setFocus(false);
            }
            if (this._commentElements.length === 0 || value === undefined) {
                this._focusedComment = undefined;
            }
            else {
                this._focusedComment = Math.min(value, this._commentElements.length - 1);
                this._commentElements[this._focusedComment].setFocus(true);
            }
        }
        createNewCommentNode(comment) {
            const newCommentNode = this._scopedInstatiationService.createInstance(commentNode_1.CommentNode, this._parentEditor, this._commentThread, comment, this._pendingEdits ? this._pendingEdits[comment.uniqueIdInThread] : undefined, this.owner, this.parentResourceUri, this._parentCommentThreadWidget, this._markdownRenderer);
            this._register(newCommentNode);
            this._commentDisposable.set(newCommentNode, newCommentNode.onDidClick(clickedNode => this._setFocusedComment(this._commentElements.findIndex(commentNode => commentNode.comment.uniqueIdInThread === clickedNode.comment.uniqueIdInThread))));
            return newCommentNode;
        }
        dispose() {
            super.dispose();
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
                this._resizeObserver = null;
            }
            this._commentDisposable.forEach(v => v.dispose());
        }
    };
    exports.CommentThreadBody = CommentThreadBody;
    exports.CommentThreadBody = CommentThreadBody = __decorate([
        __param(9, commentService_1.ICommentService),
        __param(10, opener_1.IOpenerService),
        __param(11, language_1.ILanguageService)
    ], CommentThreadBody);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudFRocmVhZEJvZHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvbW1lbnRzL2Jyb3dzZXIvY29tbWVudFRocmVhZEJvZHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJ6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUEwRCxTQUFRLHNCQUFVO1FBV3hGLElBQUksTUFBTTtZQUNULE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9FLENBQUM7UUFFRCxJQUFJLGFBQWE7WUFDaEIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFHRCxZQUNrQixhQUErQixFQUN2QyxLQUFhLEVBQ2IsaUJBQXNCLEVBQ3RCLFNBQXNCLEVBQ3ZCLFFBQWtDLEVBQ2xDLGNBQTBDLEVBQzFDLGFBQW9ELEVBQ3BELDBCQUFpRCxFQUNqRCwwQkFBZ0QsRUFDdkMsY0FBdUMsRUFDeEMsYUFBcUMsRUFDbkMsZUFBeUM7WUFFM0QsS0FBSyxFQUFFLENBQUM7WUFiUyxrQkFBYSxHQUFiLGFBQWEsQ0FBa0I7WUFDdkMsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBSztZQUN0QixjQUFTLEdBQVQsU0FBUyxDQUFhO1lBQ3ZCLGFBQVEsR0FBUixRQUFRLENBQTBCO1lBQ2xDLG1CQUFjLEdBQWQsY0FBYyxDQUE0QjtZQUMxQyxrQkFBYSxH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