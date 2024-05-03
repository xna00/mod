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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/common/editorCommon", "vs/editor/common/model/textModel", "vs/editor/common/languages", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/comments/browser/commentGlyphWidget", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/commentThreadZoneWidget", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/comments/browser/commentsTreeViewer", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/comments/common/commentsConfiguration", "vs/workbench/contrib/comments/browser/commentReply", "vs/base/common/event", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/comments/browser/commentThreadRangeDecorator", "vs/base/browser/ui/aria/aria", "vs/workbench/contrib/comments/common/commentContextKeys", "vs/platform/keybinding/common/keybinding", "vs/platform/accessibility/common/accessibility", "vs/base/common/uri", "vs/css!./media/review"], function (require, exports, actions_1, arrays_1, arraysFind_1, async_1, errors_1, lifecycle_1, editorBrowser_1, codeEditorService_1, range_1, editorCommon_1, textModel_1, languages, nls, contextView_1, instantiation_1, quickInput_1, commentGlyphWidget_1, commentService_1, commentThreadZoneWidget_1, editorService_1, embeddedCodeEditorWidget_1, viewsService_1, commentsTreeViewer_1, configuration_1, commentsConfiguration_1, commentReply_1, event_1, contextkey_1, commentThreadRangeDecorator_1, aria_1, commentContextKeys_1, keybinding_1, accessibility_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentController = exports.ID = void 0;
    exports.revealCommentThread = revealCommentThread;
    exports.ID = 'editor.contrib.review';
    class CommentingRangeDecoration {
        get id() {
            return this._decorationId;
        }
        set id(id) {
            this._decorationId = id;
        }
        get range() {
            return {
                startLineNumber: this._startLineNumber, startColumn: 1,
                endLineNumber: this._endLineNumber, endColumn: 1
            };
        }
        constructor(_editor, _ownerId, _extensionId, _label, _range, options, commentingRangesInfo, isHover = false) {
            this._editor = _editor;
            this._ownerId = _ownerId;
            this._extensionId = _extensionId;
            this._label = _label;
            this._range = _range;
            this.options = options;
            this.commentingRangesInfo = commentingRangesInfo;
            this.isHover = isHover;
            this._startLineNumber = _range.startLineNumber;
            this._endLineNumber = _range.endLineNumber;
        }
        getCommentAction() {
            return {
                extensionId: this._extensionId,
                label: this._label,
                ownerId: this._ownerId,
                commentingRangesInfo: this.commentingRangesInfo
            };
        }
        getOriginalRange() {
            return this._range;
        }
        getActiveRange() {
            return this.id ? this._editor.getModel().getDecorationRange(this.id) : undefined;
        }
    }
    class CommentingRangeDecorator {
        static { this.description = 'commenting-range-decorator'; }
        constructor() {
            this.commentingRangeDecorations = [];
            this.decorationIds = [];
            this._lastHover = -1;
            this._onDidChangeDecorationsCount = new event_1.Emitter();
            this.onDidChangeDecorationsCount = this._onDidChangeDecorationsCount.event;
            const decorationOptions = {
                description: CommentingRangeDecorator.description,
                isWholeLine: true,
                linesDecorationsClassName: 'comment-range-glyph comment-diff-added'
            };
            this.decorationOptions = textModel_1.ModelDecorationOptions.createDynamic(decorationOptions);
            const hoverDecorationOptions = {
                description: CommentingRangeDecorator.description,
                isWholeLine: true,
                linesDecorationsClassName: `comment-range-glyph line-hover`
            };
            this.hoverDecorationOptions = textModel_1.ModelDecorationOptions.createDynamic(hoverDecorationOptions);
            const multilineDecorationOptions = {
                description: CommentingRangeDecorator.description,
                isWholeLine: true,
                linesDecorationsClassName: `comment-range-glyph multiline-add`
            };
            this.multilineDecorationOptions = textModel_1.ModelDecorationOptions.createDynamic(multilineDecorationOptions);
        }
        updateHover(hoverLine) {
            if (this._editor && this._infos && (hoverLine !== this._lastHover)) {
                this._doUpdate(this._editor, this._infos, hoverLine);
            }
            this._lastHover = hoverLine ?? -1;
        }
        updateSelection(cursorLine, range = new range_1.Range(0, 0, 0, 0)) {
            this._lastSelection = range.isEmpty() ? undefined : range;
            this._lastSelectionCursor = range.isEmpty() ? undefined : cursorLine;
            // Some scenarios:
            // Selection is made. Emphasis should show on the drag/selection end location.
            // Selection is made, then user clicks elsewhere. We should still show the decoration.
            if (this._editor && this._infos) {
                this._doUpdate(this._editor, this._infos, cursorLine, range);
            }
        }
        update(editor, commentInfos, cursorLine, range) {
            if (editor) {
                this._editor = editor;
                this._infos = commentInfos;
                this._doUpdate(editor, commentInfos, cursorLine, range);
            }
        }
        _lineHasThread(editor, lineRange) {
            return editor.getDecorationsInRange(lineRange)?.find(decoration => decoration.options.description === commentGlyphWidget_1.CommentGlyphWidget.description);
        }
        _doUpdate(editor, commentInfos, emphasisLine = -1, selectionRange = this._lastSelection) {
            const model = editor.getModel();
            if (!model) {
                return;
            }
            // If there's still a selection, use that.
            emphasisLine = this._lastSelectionCursor ?? emphasisLine;
            const commentingRangeDecorations = [];
            for (const info of commentInfos) {
                info.commentingRanges.ranges.forEach(range => {
                    const rangeObject = new range_1.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
                    let intersectingSelectionRange = selectionRange ? rangeObject.intersectRanges(selectionRange) : undefined;
                    if ((selectionRange && (emphasisLine >= 0) && intersectingSelectionRange)
                        // If there's only one selection line, then just drop into the else if and show an emphasis line.
                        && !((intersectingSelectionRange.startLineNumber === intersectingSelectionRange.endLineNumber)
                            && (emphasisLine === intersectingSelectionRange.startLineNumber))) {
                        // The emphasisLine should be within the commenting range, even if the selection range stretches
                        // outside of the commenting range.
                        // Clip the emphasis and selection ranges to the commenting range
                        let intersectingEmphasisRange;
                        if (emphasisLine <= intersectingSelectionRange.startLineNumber) {
                            intersectingEmphasisRange = intersectingSelectionRange.collapseToStart();
                            intersectingSelectionRange = new range_1.Range(intersectingSelectionRange.startLineNumber + 1, 1, intersectingSelectionRange.endLineNumber, 1);
                        }
                        else {
                            intersectingEmphasisRange = new range_1.Range(intersectingSelectionRange.endLineNumber, 1, intersectingSelectionRange.endLineNumber, 1);
                            intersectingSelectionRange = new range_1.Range(intersectingSelectionRange.startLineNumber, 1, intersectingSelectionRange.endLineNumber - 1, 1);
                        }
                        commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.uniqueOwner, info.extensionId, info.label, intersectingSelectionRange, this.multilineDecorationOptions, info.commentingRanges, true));
                        if (!this._lineHasThread(editor, intersectingEmphasisRange)) {
                            commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.uniqueOwner, info.extensionId, info.label, intersectingEmphasisRange, this.hoverDecorationOptions, info.commentingRanges, true));
                        }
                        const beforeRangeEndLine = Math.min(intersectingEmphasisRange.startLineNumber, intersectingSelectionRange.startLineNumber) - 1;
                        const hasBeforeRange = rangeObject.startLineNumber <= beforeRangeEndLine;
                        const afterRangeStartLine = Math.max(intersectingEmphasisRange.endLineNumber, intersectingSelectionRange.endLineNumber) + 1;
                        const hasAfterRange = rangeObject.endLineNumber >= afterRangeStartLine;
                        if (hasBeforeRange) {
                            const beforeRange = new range_1.Range(range.startLineNumber, 1, beforeRangeEndLine, 1);
                            commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.uniqueOwner, info.extensionId, info.label, beforeRange, this.decorationOptions, info.commentingRanges, true));
                        }
                        if (hasAfterRange) {
                            const afterRange = new range_1.Range(afterRangeStartLine, 1, range.endLineNumber, 1);
                            commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.uniqueOwner, info.extensionId, info.label, afterRange, this.decorationOptions, info.commentingRanges, true));
                        }
                    }
                    else if ((rangeObject.startLineNumber <= emphasisLine) && (emphasisLine <= rangeObject.endLineNumber)) {
                        if (rangeObject.startLineNumber < emphasisLine) {
                            const beforeRange = new range_1.Range(range.startLineNumber, 1, emphasisLine - 1, 1);
                            commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.uniqueOwner, info.extensionId, info.label, beforeRange, this.decorationOptions, info.commentingRanges, true));
                        }
                        const emphasisRange = new range_1.Range(emphasisLine, 1, emphasisLine, 1);
                        if (!this._lineHasThread(editor, emphasisRange)) {
                            commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.uniqueOwner, info.extensionId, info.label, emphasisRange, this.hoverDecorationOptions, info.commentingRanges, true));
                        }
                        if (emphasisLine < rangeObject.endLineNumber) {
                            const afterRange = new range_1.Range(emphasisLine + 1, 1, range.endLineNumber, 1);
                            commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.uniqueOwner, info.extensionId, info.label, afterRange, this.decorationOptions, info.commentingRanges, true));
                        }
                    }
                    else {
                        commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.uniqueOwner, info.extensionId, info.label, range, this.decorationOptions, info.commentingRanges));
                    }
                });
            }
            editor.changeDecorations((accessor) => {
                this.decorationIds = accessor.deltaDecorations(this.decorationIds, commentingRangeDecorations);
                commentingRangeDecorations.forEach((decoration, index) => decoration.id = this.decorationIds[index]);
            });
            const rangesDifference = this.commentingRangeDecorations.length - commentingRangeDecorations.length;
            this.commentingRangeDecorations = commentingRangeDecorations;
            if (rangesDifference) {
                this._onDidChangeDecorationsCount.fire(this.commentingRangeDecorations.length);
            }
        }
        areRangesIntersectingOrTouchingByLine(a, b) {
            // Check if `a` is before `b`
            if (a.endLineNumber < (b.startLineNumber - 1)) {
                return false;
            }
            // Check if `b` is before `a`
            if ((b.endLineNumber + 1) < a.startLineNumber) {
                return false;
            }
            // These ranges must intersect
            return true;
        }
        getMatchedCommentAction(commentRange) {
            if (commentRange === undefined) {
                const foundInfos = this._infos?.filter(info => info.commentingRanges.fileComments);
                if (foundInfos) {
                    return foundInfos.map(foundInfo => {
                        return {
                            action: {
                                ownerId: foundInfo.uniqueOwner,
                                extensionId: foundInfo.extensionId,
                                label: foundInfo.label,
                                commentingRangesInfo: foundInfo.commentingRanges
                            }
                        };
                    });
                }
                return [];
            }
            // keys is ownerId
            const foundHoverActions = new Map();
            for (const decoration of this.commentingRangeDecorations) {
                const range = decoration.getActiveRange();
                if (range && this.areRangesIntersectingOrTouchingByLine(range, commentRange)) {
                    // We can have several commenting ranges that match from the same uniqueOwner because of how
                    // the line hover and selection decoration is done.
                    // The ranges must be merged so that we can see if the new commentRange fits within them.
                    const action = decoration.getCommentAction();
                    const alreadyFoundInfo = foundHoverActions.get(action.ownerId);
                    if (alreadyFoundInfo?.action.commentingRangesInfo === action.commentingRangesInfo) {
                        // Merge ranges.
                        const newRange = new range_1.Range(range.startLineNumber < alreadyFoundInfo.range.startLineNumber ? range.startLineNumber : alreadyFoundInfo.range.startLineNumber, range.startColumn < alreadyFoundInfo.range.startColumn ? range.startColumn : alreadyFoundInfo.range.startColumn, range.endLineNumber > alreadyFoundInfo.range.endLineNumber ? range.endLineNumber : alreadyFoundInfo.range.endLineNumber, range.endColumn > alreadyFoundInfo.range.endColumn ? range.endColumn : alreadyFoundInfo.range.endColumn);
                        foundHoverActions.set(action.ownerId, { range: newRange, action });
                    }
                    else {
                        foundHoverActions.set(action.ownerId, { range, action });
                    }
                }
            }
            const seenOwners = new Set();
            return Array.from(foundHoverActions.values()).filter(action => {
                if (seenOwners.has(action.action.ownerId)) {
                    return false;
                }
                else {
                    seenOwners.add(action.action.ownerId);
                    return true;
                }
            });
        }
        getNearestCommentingRange(findPosition, reverse) {
            let findPositionContainedWithin;
            let decorations;
            if (reverse) {
                decorations = [];
                for (let i = this.commentingRangeDecorations.length - 1; i >= 0; i--) {
                    decorations.push(this.commentingRangeDecorations[i]);
                }
            }
            else {
                decorations = this.commentingRangeDecorations;
            }
            for (const decoration of decorations) {
                const range = decoration.getActiveRange();
                if (!range) {
                    continue;
                }
                if (findPositionContainedWithin && this.areRangesIntersectingOrTouchingByLine(range, findPositionContainedWithin)) {
                    findPositionContainedWithin = range_1.Range.plusRange(findPositionContainedWithin, range);
                    continue;
                }
                if (range.startLineNumber <= findPosition.lineNumber && findPosition.lineNumber <= range.endLineNumber) {
                    findPositionContainedWithin = new range_1.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
                    continue;
                }
                if (!reverse && range.endLineNumber < findPosition.lineNumber) {
                    continue;
                }
                if (reverse && range.startLineNumber > findPosition.lineNumber) {
                    continue;
                }
                return range;
            }
            return (decorations.length > 0 ? (decorations[0].getActiveRange() ?? undefined) : undefined);
        }
        dispose() {
            this.commentingRangeDecorations = [];
        }
    }
    function revealCommentThread(commentService, editorService, uriIdentityService, commentThread, comment, focusReply, pinned, preserveFocus, sideBySide) {
        if (!commentThread.resource) {
            return;
        }
        if (!commentService.isCommentingEnabled) {
            commentService.enableCommenting(true);
        }
        const range = commentThread.range;
        const focus = focusReply ? commentThreadZoneWidget_1.CommentWidgetFocus.Editor : (preserveFocus ? commentThreadZoneWidget_1.CommentWidgetFocus.None : commentThreadZoneWidget_1.CommentWidgetFocus.Widget);
        const activeEditor = editorService.activeTextEditorControl;
        // If the active editor is a diff editor where one of the sides has the comment,
        // then we try to reveal the comment in the diff editor.
        const currentActiveResources = (0, editorBrowser_1.isDiffEditor)(activeEditor) ? [activeEditor.getOriginalEditor(), activeEditor.getModifiedEditor()]
            : (activeEditor ? [activeEditor] : []);
        const threadToReveal = commentThread.threadId;
        const commentToReveal = comment?.uniqueIdInThread;
        const resource = uri_1.URI.parse(commentThread.resource);
        for (const editor of currentActiveResources) {
            const model = editor.getModel();
            if ((model instanceof textModel_1.TextModel) && uriIdentityService.extUri.isEqual(resource, model.uri)) {
                if (threadToReveal && (0, editorBrowser_1.isCodeEditor)(editor)) {
                    const controller = CommentController.get(editor);
                    controller?.revealCommentThread(threadToReveal, commentToReveal, true, focus);
                }
                return;
            }
        }
        editorService.openEditor({
            resource,
            options: {
                pinned: pinned,
                preserveFocus: preserveFocus,
                selection: range ?? new range_1.Range(1, 1, 1, 1)
            }
        }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP).then(editor => {
            if (editor) {
                const control = editor.getControl();
                if (threadToReveal && (0, editorBrowser_1.isCodeEditor)(control)) {
                    const controller = CommentController.get(control);
                    controller?.revealCommentThread(threadToReveal, commentToReveal, true, focus);
                }
            }
        });
    }
    let CommentController = class CommentController {
        constructor(editor, commentService, instantiationService, codeEditorService, contextMenuService, quickInputService, viewsService, configurationService, contextKeyService, editorService, keybindingService, accessibilityService) {
            this.commentService = commentService;
            this.instantiationService = instantiationService;
            this.codeEditorService = codeEditorService;
            this.contextMenuService = contextMenuService;
            this.quickInputService = quickInputService;
            this.viewsService = viewsService;
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.keybindingService = keybindingService;
            this.accessibilityService = accessibilityService;
            this.globalToDispose = new lifecycle_1.DisposableStore();
            this.localToDispose = new lifecycle_1.DisposableStore();
            this.mouseDownInfo = null;
            this._commentingRangeSpaceReserved = false;
            this._commentingRangeAmountReserved = 0;
            this._emptyThreadsToAddQueue = [];
            this._inProcessContinueOnComments = new Map();
            this._editorDisposables = [];
            this._hasRespondedToEditorChange = false;
            this._commentInfos = [];
            this._commentWidgets = [];
            this._pendingNewCommentCache = {};
            this._pendingEditsCache = {};
            this._computePromise = null;
            this._activeCursorHasCommentingRange = commentContextKeys_1.CommentContextKeys.activeCursorHasCommentingRange.bindTo(contextKeyService);
            this._activeEditorHasCommentingRange = commentContextKeys_1.CommentContextKeys.activeEditorHasCommentingRange.bindTo(contextKeyService);
            if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
                return;
            }
            this.editor = editor;
            this._commentingRangeDecorator = new CommentingRangeDecorator();
            this.globalToDispose.add(this._commentingRangeDecorator.onDidChangeDecorationsCount(count => {
                if (count === 0) {
                    this.clearEditorListeners();
                }
                else if (this._editorDisposables.length === 0) {
                    this.registerEditorListeners();
                }
            }));
            this.globalToDispose.add(this._commentThreadRangeDecorator = new commentThreadRangeDecorator_1.CommentThreadRangeDecorator(this.commentService));
            this.globalToDispose.add(this.commentService.onDidDeleteDataProvider(ownerId => {
                if (ownerId) {
                    delete this._pendingNewCommentCache[ownerId];
                    delete this._pendingEditsCache[ownerId];
                }
                else {
                    this._pendingNewCommentCache = {};
                    this._pendingEditsCache = {};
                }
                this.beginCompute();
            }));
            this.globalToDispose.add(this.commentService.onDidSetDataProvider(_ => this.beginComputeAndHandleEditorChange()));
            this.globalToDispose.add(this.commentService.onDidUpdateCommentingRanges(_ => this.beginComputeAndHandleEditorChange()));
            this.globalToDispose.add(this.commentService.onDidSetResourceCommentInfos(e => {
                const editorURI = this.editor && this.editor.hasModel() && this.editor.getModel().uri;
                if (editorURI && editorURI.toString() === e.resource.toString()) {
                    this.setComments(e.commentInfos.filter(commentInfo => commentInfo !== null));
                }
            }));
            this.globalToDispose.add(this.commentService.onDidChangeCommentingEnabled(e => {
                if (e) {
                    this.registerEditorListeners();
                    this.beginCompute();
                }
                else {
                    this.tryUpdateReservedSpace();
                    this.clearEditorListeners();
                    this._commentingRangeDecorator.update(this.editor, []);
                    this._commentThreadRangeDecorator.update(this.editor, []);
                    (0, lifecycle_1.dispose)(this._commentWidgets);
                    this._commentWidgets = [];
                }
            }));
            this.globalToDispose.add(this.editor.onWillChangeModel(e => this.onWillChangeModel(e)));
            this.globalToDispose.add(this.editor.onDidChangeModel(_ => this.onModelChanged()));
            this.globalToDispose.add(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('diffEditor.renderSideBySide')) {
                    this.beginCompute();
                }
            }));
            this.onModelChanged();
            this.codeEditorService.registerDecorationType('comment-controller', commentReply_1.COMMENTEDITOR_DECORATION_KEY, {});
            this.globalToDispose.add(this.commentService.registerContinueOnCommentProvider({
                provideContinueOnComments: () => {
                    const pendingComments = [];
                    if (this._commentWidgets) {
                        for (const zone of this._commentWidgets) {
                            const zonePendingComments = zone.getPendingComments();
                            const pendingNewComment = zonePendingComments.newComment;
                            if (!pendingNewComment) {
                                continue;
                            }
                            let lastCommentBody;
                            if (zone.commentThread.comments && zone.commentThread.comments.length) {
                                const lastComment = zone.commentThread.comments[zone.commentThread.comments.length - 1];
                                if (typeof lastComment.body === 'string') {
                                    lastCommentBody = lastComment.body;
                                }
                                else {
                                    lastCommentBody = lastComment.body.value;
                                }
                            }
                            if (pendingNewComment !== lastCommentBody) {
                                pendingComments.push({
                                    uniqueOwner: zone.uniqueOwner,
                                    uri: zone.editor.getModel().uri,
                                    range: zone.commentThread.range,
                                    body: pendingNewComment,
                                    isReply: (zone.commentThread.comments !== undefined) && (zone.commentThread.comments.length > 0)
                                });
                            }
                        }
                    }
                    return pendingComments;
                }
            }));
        }
        registerEditorListeners() {
            this._editorDisposables = [];
            if (!this.editor) {
                return;
            }
            this._editorDisposables.push(this.editor.onMouseMove(e => this.onEditorMouseMove(e)));
            this._editorDisposables.push(this.editor.onMouseLeave(() => this.onEditorMouseLeave()));
            this._editorDisposables.push(this.editor.onDidChangeCursorPosition(e => this.onEditorChangeCursorPosition(e.position)));
            this._editorDisposables.push(this.editor.onDidFocusEditorWidget(() => this.onEditorChangeCursorPosition(this.editor?.getPosition() ?? null)));
            this._editorDisposables.push(this.editor.onDidChangeCursorSelection(e => this.onEditorChangeCursorSelection(e)));
            this._editorDisposables.push(this.editor.onDidBlurEditorWidget(() => this.onEditorChangeCursorSelection()));
        }
        clearEditorListeners() {
            (0, lifecycle_1.dispose)(this._editorDisposables);
            this._editorDisposables = [];
        }
        onEditorMouseLeave() {
            this._commentingRangeDecorator.updateHover();
        }
        onEditorMouseMove(e) {
            const position = e.target.position?.lineNumber;
            if (e.event.leftButton.valueOf() && position && this.mouseDownInfo) {
                this._commentingRangeDecorator.updateSelection(position, new range_1.Range(this.mouseDownInfo.lineNumber, 1, position, 1));
            }
            else {
                this._commentingRangeDecorator.updateHover(position);
            }
        }
        onEditorChangeCursorSelection(e) {
            const position = this.editor?.getPosition()?.lineNumber;
            if (position) {
                this._commentingRangeDecorator.updateSelection(position, e?.selection);
            }
        }
        onEditorChangeCursorPosition(e) {
            const decorations = e ? this.editor?.getDecorationsInRange(range_1.Range.fromPositions(e, { column: -1, lineNumber: e.lineNumber })) : undefined;
            let hasCommentingRange = false;
            if (decorations) {
                for (const decoration of decorations) {
                    if (decoration.options.description === commentGlyphWidget_1.CommentGlyphWidget.description) {
                        // We don't allow multiple comments on the same line.
                        hasCommentingRange = false;
                        break;
                    }
                    else if (decoration.options.description === CommentingRangeDecorator.description) {
                        hasCommentingRange = true;
                    }
                }
            }
            this._activeCursorHasCommentingRange.set(hasCommentingRange);
        }
        isEditorInlineOriginal(testEditor) {
            if (this.configurationService.getValue('diffEditor.renderSideBySide')) {
                return false;
            }
            const foundEditor = this.editorService.visibleTextEditorControls.find(editor => {
                if (editor.getEditorType() === editorCommon_1.EditorType.IDiffEditor) {
                    const diffEditor = editor;
                    return diffEditor.getOriginalEditor() === testEditor;
                }
                return false;
            });
            return !!foundEditor;
        }
        beginCompute() {
            this._computePromise = (0, async_1.createCancelablePromise)(token => {
                const editorURI = this.editor && this.editor.hasModel() && this.editor.getModel().uri;
                if (editorURI) {
                    return this.commentService.getDocumentComments(editorURI);
                }
                return Promise.resolve([]);
            });
            return this._computePromise.then(commentInfos => {
                this.setComments((0, arrays_1.coalesce)(commentInfos));
                this._computePromise = null;
            }, error => console.log(error));
        }
        beginComputeCommentingRanges() {
            if (this._computeCommentingRangeScheduler) {
                if (this._computeCommentingRangePromise) {
                    this._computeCommentingRangePromise.cancel();
                    this._computeCommentingRangePromise = null;
                }
                this._computeCommentingRangeScheduler.trigger(() => {
                    const editorURI = this.editor && this.editor.hasModel() && this.editor.getModel().uri;
                    if (editorURI) {
                        return this.commentService.getDocumentComments(editorURI);
                    }
                    return Promise.resolve([]);
                }).then(commentInfos => {
                    if (this.commentService.isCommentingEnabled) {
                        const meaningfulCommentInfos = (0, arrays_1.coalesce)(commentInfos);
                        this._commentingRangeDecorator.update(this.editor, meaningfulCommentInfos, this.editor?.getPosition()?.lineNumber, this.editor?.getSelection() ?? undefined);
                    }
                }, (err) => {
                    (0, errors_1.onUnexpectedError)(err);
                    return null;
                });
            }
        }
        static get(editor) {
            return editor.getContribution(exports.ID);
        }
        revealCommentThread(threadId, commentUniqueId, fetchOnceIfNotExist, focus) {
            const commentThreadWidget = this._commentWidgets.filter(widget => widget.commentThread.threadId === threadId);
            if (commentThreadWidget.length === 1) {
                commentThreadWidget[0].reveal(commentUniqueId, focus);
            }
            else if (fetchOnceIfNotExist) {
                if (this._computePromise) {
                    this._computePromise.then(_ => {
                        this.revealCommentThread(threadId, commentUniqueId, false, focus);
                    });
                }
                else {
                    this.beginCompute().then(_ => {
                        this.revealCommentThread(threadId, commentUniqueId, false, focus);
                    });
                }
            }
        }
        collapseAll() {
            for (const widget of this._commentWidgets) {
                widget.collapse();
            }
        }
        expandAll() {
            for (const widget of this._commentWidgets) {
                widget.expand();
            }
        }
        expandUnresolved() {
            for (const widget of this._commentWidgets) {
                if (widget.commentThread.state === languages.CommentThreadState.Unresolved) {
                    widget.expand();
                }
            }
        }
        nextCommentThread() {
            this._findNearestCommentThread();
        }
        _findNearestCommentThread(reverse) {
            if (!this._commentWidgets.length || !this.editor?.hasModel()) {
                return;
            }
            const after = this.editor.getSelection().getEndPosition();
            const sortedWidgets = this._commentWidgets.sort((a, b) => {
                if (reverse) {
                    const temp = a;
                    a = b;
                    b = temp;
                }
                if (a.commentThread.range === undefined) {
                    return -1;
                }
                if (b.commentThread.range === undefined) {
                    return 1;
                }
                if (a.commentThread.range.startLineNumber < b.commentThread.range.startLineNumber) {
                    return -1;
                }
                if (a.commentThread.range.startLineNumber > b.commentThread.range.startLineNumber) {
                    return 1;
                }
                if (a.commentThread.range.startColumn < b.commentThread.range.startColumn) {
                    return -1;
                }
                if (a.commentThread.range.startColumn > b.commentThread.range.startColumn) {
                    return 1;
                }
                return 0;
            });
            const idx = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(sortedWidgets, widget => {
                const lineValueOne = reverse ? after.lineNumber : (widget.commentThread.range?.startLineNumber ?? 0);
                const lineValueTwo = reverse ? (widget.commentThread.range?.startLineNumber ?? 0) : after.lineNumber;
                const columnValueOne = reverse ? after.column : (widget.commentThread.range?.startColumn ?? 0);
                const columnValueTwo = reverse ? (widget.commentThread.range?.startColumn ?? 0) : after.column;
                if (lineValueOne > lineValueTwo) {
                    return true;
                }
                if (lineValueOne < lineValueTwo) {
                    return false;
                }
                if (columnValueOne > columnValueTwo) {
                    return true;
                }
                return false;
            });
            let nextWidget;
            if (idx === this._commentWidgets.length) {
                nextWidget = this._commentWidgets[0];
            }
            else {
                nextWidget = sortedWidgets[idx];
            }
            this.editor.setSelection(nextWidget.commentThread.range ?? new range_1.Range(1, 1, 1, 1));
            nextWidget.reveal(undefined, commentThreadZoneWidget_1.CommentWidgetFocus.Widget);
        }
        previousCommentThread() {
            this._findNearestCommentThread(true);
        }
        _findNearestCommentingRange(reverse) {
            if (!this.editor?.hasModel()) {
                return;
            }
            const after = this.editor.getSelection().getEndPosition();
            const range = this._commentingRangeDecorator.getNearestCommentingRange(after, reverse);
            if (range) {
                const position = reverse ? range.getEndPosition() : range.getStartPosition();
                this.editor.setPosition(position);
                this.editor.revealLineInCenterIfOutsideViewport(position.lineNumber);
            }
            if (this.accessibilityService.isScreenReaderOptimized()) {
                const commentRangeStart = range?.getStartPosition().lineNumber;
                const commentRangeEnd = range?.getEndPosition().lineNumber;
                if (commentRangeStart && commentRangeEnd) {
                    const oneLine = commentRangeStart === commentRangeEnd;
                    oneLine ? (0, aria_1.status)(nls.localize('commentRange', "Line {0}", commentRangeStart)) : (0, aria_1.status)(nls.localize('commentRangeStart', "Lines {0} to {1}", commentRangeStart, commentRangeEnd));
                }
            }
        }
        nextCommentingRange() {
            this._findNearestCommentingRange();
        }
        previousCommentingRange() {
            this._findNearestCommentingRange(true);
        }
        dispose() {
            this.globalToDispose.dispose();
            this.localToDispose.dispose();
            (0, lifecycle_1.dispose)(this._editorDisposables);
            (0, lifecycle_1.dispose)(this._commentWidgets);
            this.editor = null; // Strict null override - nulling out in dispose
        }
        onWillChangeModel(e) {
            if (e.newModelUrl) {
                this.tryUpdateReservedSpace(e.newModelUrl);
            }
        }
        onModelChanged() {
            this.localToDispose.clear();
            this.tryUpdateReservedSpace();
            this.removeCommentWidgetsAndStoreCache();
            if (!this.editor) {
                return;
            }
            this._hasRespondedToEditorChange = false;
            this.localToDispose.add(this.editor.onMouseDown(e => this.onEditorMouseDown(e)));
            this.localToDispose.add(this.editor.onMouseUp(e => this.onEditorMouseUp(e)));
            if (this._editorDisposables.length) {
                this.clearEditorListeners();
                this.registerEditorListeners();
            }
            this._computeCommentingRangeScheduler = new async_1.Delayer(200);
            this.localToDispose.add({
                dispose: () => {
                    this._computeCommentingRangeScheduler?.cancel();
                    this._computeCommentingRangeScheduler = null;
                }
            });
            this.localToDispose.add(this.editor.onDidChangeModelContent(async () => {
                this.beginComputeCommentingRanges();
            }));
            this.localToDispose.add(this.commentService.onDidUpdateCommentThreads(async (e) => {
                const editorURI = this.editor && this.editor.hasModel() && this.editor.getModel().uri;
                if (!editorURI || !this.commentService.isCommentingEnabled) {
                    return;
                }
                if (this._computePromise) {
                    await this._computePromise;
                }
                const commentInfo = this._commentInfos.filter(info => info.uniqueOwner === e.uniqueOwner);
                if (!commentInfo || !commentInfo.length) {
                    return;
                }
                const added = e.added.filter(thread => thread.resource && thread.resource === editorURI.toString());
                const removed = e.removed.filter(thread => thread.resource && thread.resource === editorURI.toString());
                const changed = e.changed.filter(thread => thread.resource && thread.resource === editorURI.toString());
                const pending = e.pending.filter(pending => pending.uri.toString() === editorURI.toString());
                removed.forEach(thread => {
                    const matchedZones = this._commentWidgets.filter(zoneWidget => zoneWidget.uniqueOwner === e.uniqueOwner && zoneWidget.commentThread.threadId === thread.threadId && zoneWidget.commentThread.threadId !== '');
                    if (matchedZones.length) {
                        const matchedZone = matchedZones[0];
                        const index = this._commentWidgets.indexOf(matchedZone);
                        this._commentWidgets.splice(index, 1);
                        matchedZone.dispose();
                    }
                    const infosThreads = this._commentInfos.filter(info => info.uniqueOwner === e.uniqueOwner)[0].threads;
                    for (let i = 0; i < infosThreads.length; i++) {
                        if (infosThreads[i] === thread) {
                            infosThreads.splice(i, 1);
                            i--;
                        }
                    }
                });
                changed.forEach(thread => {
                    const matchedZones = this._commentWidgets.filter(zoneWidget => zoneWidget.uniqueOwner === e.uniqueOwner && zoneWidget.commentThread.threadId === thread.threadId);
                    if (matchedZones.length) {
                        const matchedZone = matchedZones[0];
                        matchedZone.update(thread);
                        this.openCommentsView(thread);
                    }
                });
                for (const thread of added) {
                    const matchedZones = this._commentWidgets.filter(zoneWidget => zoneWidget.uniqueOwner === e.uniqueOwner && zoneWidget.commentThread.threadId === thread.threadId);
                    if (matchedZones.length) {
                        return;
                    }
                    const matchedNewCommentThreadZones = this._commentWidgets.filter(zoneWidget => zoneWidget.uniqueOwner === e.uniqueOwner && zoneWidget.commentThread.commentThreadHandle === -1 && range_1.Range.equalsRange(zoneWidget.commentThread.range, thread.range));
                    if (matchedNewCommentThreadZones.length) {
                        matchedNewCommentThreadZones[0].update(thread);
                        return;
                    }
                    const continueOnCommentIndex = this._inProcessContinueOnComments.get(e.uniqueOwner)?.findIndex(pending => {
                        if (pending.range === undefined) {
                            return thread.range === undefined;
                        }
                        else {
                            return range_1.Range.lift(pending.range).equalsRange(thread.range);
                        }
                    });
                    let continueOnCommentText;
                    if ((continueOnCommentIndex !== undefined) && continueOnCommentIndex >= 0) {
                        continueOnCommentText = this._inProcessContinueOnComments.get(e.uniqueOwner)?.splice(continueOnCommentIndex, 1)[0].body;
                    }
                    const pendingCommentText = (this._pendingNewCommentCache[e.uniqueOwner] && this._pendingNewCommentCache[e.uniqueOwner][thread.threadId])
                        ?? continueOnCommentText;
                    const pendingEdits = this._pendingEditsCache[e.uniqueOwner] && this._pendingEditsCache[e.uniqueOwner][thread.threadId];
                    this.displayCommentThread(e.uniqueOwner, thread, pendingCommentText, pendingEdits);
                    this._commentInfos.filter(info => info.uniqueOwner === e.uniqueOwner)[0].threads.push(thread);
                    this.tryUpdateReservedSpace();
                }
                for (const thread of pending) {
                    await this.resumePendingComment(editorURI, thread);
                }
                this._commentThreadRangeDecorator.update(this.editor, commentInfo);
            }));
            this.beginComputeAndHandleEditorChange();
        }
        async resumePendingComment(editorURI, thread) {
            const matchedZones = this._commentWidgets.filter(zoneWidget => zoneWidget.uniqueOwner === thread.uniqueOwner && range_1.Range.lift(zoneWidget.commentThread.range)?.equalsRange(thread.range));
            if (thread.isReply && matchedZones.length) {
                this.commentService.removeContinueOnComment({ uniqueOwner: thread.uniqueOwner, uri: editorURI, range: thread.range, isReply: true });
                matchedZones[0].setPendingComment(thread.body);
            }
            else if (matchedZones.length) {
                this.commentService.removeContinueOnComment({ uniqueOwner: thread.uniqueOwner, uri: editorURI, range: thread.range, isReply: false });
                const existingPendingComment = matchedZones[0].getPendingComments().newComment;
                // We need to try to reconcile the existing pending comment with the incoming pending comment
                let pendingComment;
                if (!existingPendingComment || thread.body.includes(existingPendingComment)) {
                    pendingComment = thread.body;
                }
                else if (existingPendingComment.includes(thread.body)) {
                    pendingComment = existingPendingComment;
                }
                else {
                    pendingComment = `${existingPendingComment}\n${thread.body}`;
                }
                matchedZones[0].setPendingComment(pendingComment);
            }
            else if (!thread.isReply) {
                const threadStillAvailable = this.commentService.removeContinueOnComment({ uniqueOwner: thread.uniqueOwner, uri: editorURI, range: thread.range, isReply: false });
                if (!threadStillAvailable) {
                    return;
                }
                if (!this._inProcessContinueOnComments.has(thread.uniqueOwner)) {
                    this._inProcessContinueOnComments.set(thread.uniqueOwner, []);
                }
                this._inProcessContinueOnComments.get(thread.uniqueOwner)?.push(thread);
                await this.commentService.createCommentThreadTemplate(thread.uniqueOwner, thread.uri, thread.range ? range_1.Range.lift(thread.range) : undefined);
            }
        }
        beginComputeAndHandleEditorChange() {
            this.beginCompute().then(() => {
                if (!this._hasRespondedToEditorChange) {
                    if (this._commentInfos.some(commentInfo => commentInfo.commentingRanges.ranges.length > 0 || commentInfo.commentingRanges.fileComments)) {
                        this._hasRespondedToEditorChange = true;
                        const verbose = this.configurationService.getValue("accessibility.verbosity.comments" /* AccessibilityVerbositySettingId.Comments */);
                        if (verbose) {
                            const keybinding = this.keybindingService.lookupKeybinding("editor.action.accessibilityHelp" /* AccessibilityCommandId.OpenAccessibilityHelp */)?.getAriaLabel();
                            if (keybinding) {
                                (0, aria_1.status)(nls.localize('hasCommentRangesKb', "Editor has commenting ranges, run the command Open Accessibility Help ({0}), for more information.", keybinding));
                            }
                            else {
                                (0, aria_1.status)(nls.localize('hasCommentRangesNoKb', "Editor has commenting ranges, run the command Open Accessibility Help, which is currently not triggerable via keybinding, for more information."));
                            }
                        }
                        else {
                            (0, aria_1.status)(nls.localize('hasCommentRanges', "Editor has commenting ranges."));
                        }
                    }
                }
            });
        }
        async openCommentsView(thread) {
            if (thread.comments && (thread.comments.length > 0)) {
                const openViewState = this.configurationService.getValue(commentsConfiguration_1.COMMENTS_SECTION).openView;
                if (openViewState === 'file') {
                    return this.viewsService.openView(commentsTreeViewer_1.COMMENTS_VIEW_ID);
                }
                else if (openViewState === 'firstFile' || (openViewState === 'firstFileUnresolved' && thread.state === languages.CommentThreadState.Unresolved)) {
                    const hasShownView = this.viewsService.getViewWithId(commentsTreeViewer_1.COMMENTS_VIEW_ID)?.hasRendered;
                    if (!hasShownView) {
                        return this.viewsService.openView(commentsTreeViewer_1.COMMENTS_VIEW_ID);
                    }
                }
            }
            return undefined;
        }
        displayCommentThread(uniqueOwner, thread, pendingComment, pendingEdits) {
            const editor = this.editor?.getModel();
            if (!editor) {
                return;
            }
            if (!this.editor || this.isEditorInlineOriginal(this.editor)) {
                return;
            }
            let continueOnCommentReply;
            if (thread.range && !pendingComment) {
                continueOnCommentReply = this.commentService.removeContinueOnComment({ uniqueOwner, uri: editor.uri, range: thread.range, isReply: true });
            }
            const zoneWidget = this.instantiationService.createInstance(commentThreadZoneWidget_1.ReviewZoneWidget, this.editor, uniqueOwner, thread, pendingComment ?? continueOnCommentReply?.body, pendingEdits);
            zoneWidget.display(thread.range);
            this._commentWidgets.push(zoneWidget);
            this.openCommentsView(thread);
        }
        onEditorMouseDown(e) {
            this.mouseDownInfo = (0, commentThreadZoneWidget_1.parseMouseDownInfoFromEvent)(e);
        }
        onEditorMouseUp(e) {
            const matchedLineNumber = (0, commentThreadZoneWidget_1.isMouseUpEventDragFromMouseDown)(this.mouseDownInfo, e);
            this.mouseDownInfo = null;
            if (!this.editor || matchedLineNumber === null || !e.target.element) {
                return;
            }
            const mouseUpIsOnDecorator = (e.target.element.className.indexOf('comment-range-glyph') >= 0);
            const lineNumber = e.target.position.lineNumber;
            let range;
            let selection;
            // Check for drag along gutter decoration
            if ((matchedLineNumber !== lineNumber)) {
                if (matchedLineNumber > lineNumber) {
                    selection = new range_1.Range(matchedLineNumber, this.editor.getModel().getLineLength(matchedLineNumber) + 1, lineNumber, 1);
                }
                else {
                    selection = new range_1.Range(matchedLineNumber, 1, lineNumber, this.editor.getModel().getLineLength(lineNumber) + 1);
                }
            }
            else if (mouseUpIsOnDecorator) {
                selection = this.editor.getSelection();
            }
            // Check for selection at line number.
            if (selection && (selection.startLineNumber <= lineNumber) && (lineNumber <= selection.endLineNumber)) {
                range = selection;
                this.editor.setSelection(new range_1.Range(selection.endLineNumber, 1, selection.endLineNumber, 1));
            }
            else if (mouseUpIsOnDecorator) {
                range = new range_1.Range(lineNumber, 1, lineNumber, 1);
            }
            if (range) {
                this.addOrToggleCommentAtLine(range, e);
            }
        }
        async addOrToggleCommentAtLine(commentRange, e) {
            // If an add is already in progress, queue the next add and process it after the current one finishes to
            // prevent empty comment threads from being added to the same line.
            if (!this._addInProgress) {
                this._addInProgress = true;
                // The widget's position is undefined until the widget has been displayed, so rely on the glyph position instead
                const existingCommentsAtLine = this._commentWidgets.filter(widget => widget.getGlyphPosition() === (commentRange ? commentRange.endLineNumber : 0));
                if (existingCommentsAtLine.length) {
                    const allExpanded = existingCommentsAtLine.every(widget => widget.expanded);
                    existingCommentsAtLine.forEach(allExpanded ? widget => widget.collapse() : widget => widget.expand());
                    this.processNextThreadToAdd();
                    return;
                }
                else {
                    this.addCommentAtLine(commentRange, e);
                }
            }
            else {
                this._emptyThreadsToAddQueue.push([commentRange, e]);
            }
        }
        processNextThreadToAdd() {
            this._addInProgress = false;
            const info = this._emptyThreadsToAddQueue.shift();
            if (info) {
                this.addOrToggleCommentAtLine(info[0], info[1]);
            }
        }
        clipUserRangeToCommentRange(userRange, commentRange) {
            if (userRange.startLineNumber < commentRange.startLineNumber) {
                userRange = new range_1.Range(commentRange.startLineNumber, commentRange.startColumn, userRange.endLineNumber, userRange.endColumn);
            }
            if (userRange.endLineNumber > commentRange.endLineNumber) {
                userRange = new range_1.Range(userRange.startLineNumber, userRange.startColumn, commentRange.endLineNumber, commentRange.endColumn);
            }
            return userRange;
        }
        addCommentAtLine(range, e) {
            const newCommentInfos = this._commentingRangeDecorator.getMatchedCommentAction(range);
            if (!newCommentInfos.length || !this.editor?.hasModel()) {
                this._addInProgress = false;
                if (!newCommentInfos.length) {
                    throw new Error('There are no commenting ranges at the current position.');
                }
                return Promise.resolve();
            }
            if (newCommentInfos.length > 1) {
                if (e && range) {
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => e.event,
                        getActions: () => this.getContextMenuActions(newCommentInfos, range),
                        getActionsContext: () => newCommentInfos.length ? newCommentInfos[0] : undefined,
                        onHide: () => { this._addInProgress = false; }
                    });
                    return Promise.resolve();
                }
                else {
                    const picks = this.getCommentProvidersQuickPicks(newCommentInfos);
                    return this.quickInputService.pick(picks, { placeHolder: nls.localize('pickCommentService', "Select Comment Provider"), matchOnDescription: true }).then(pick => {
                        if (!pick) {
                            return;
                        }
                        const commentInfos = newCommentInfos.filter(info => info.action.ownerId === pick.id);
                        if (commentInfos.length) {
                            const { ownerId } = commentInfos[0].action;
                            const clippedRange = range && commentInfos[0].range ? this.clipUserRangeToCommentRange(range, commentInfos[0].range) : range;
                            this.addCommentAtLine2(clippedRange, ownerId);
                        }
                    }).then(() => {
                        this._addInProgress = false;
                    });
                }
            }
            else {
                const { ownerId } = newCommentInfos[0].action;
                const clippedRange = range && newCommentInfos[0].range ? this.clipUserRangeToCommentRange(range, newCommentInfos[0].range) : range;
                this.addCommentAtLine2(clippedRange, ownerId);
            }
            return Promise.resolve();
        }
        getCommentProvidersQuickPicks(commentInfos) {
            const picks = commentInfos.map((commentInfo) => {
                const { ownerId, extensionId, label } = commentInfo.action;
                return {
                    label: label || extensionId,
                    id: ownerId
                };
            });
            return picks;
        }
        getContextMenuActions(commentInfos, commentRange) {
            const actions = [];
            commentInfos.forEach(commentInfo => {
                const { ownerId, extensionId, label } = commentInfo.action;
                actions.push(new actions_1.Action('addCommentThread', `${label || extensionId}`, undefined, true, () => {
                    const clippedRange = commentInfo.range ? this.clipUserRangeToCommentRange(commentRange, commentInfo.range) : commentRange;
                    this.addCommentAtLine2(clippedRange, ownerId);
                    return Promise.resolve();
                }));
            });
            return actions;
        }
        addCommentAtLine2(range, ownerId) {
            if (!this.editor) {
                return;
            }
            this.commentService.createCommentThreadTemplate(ownerId, this.editor.getModel().uri, range);
            this.processNextThreadToAdd();
            return;
        }
        getExistingCommentEditorOptions(editor) {
            const lineDecorationsWidth = editor.getOption(66 /* EditorOption.lineDecorationsWidth */);
            let extraEditorClassName = [];
            const configuredExtraClassName = editor.getRawOptions().extraEditorClassName;
            if (configuredExtraClassName) {
                extraEditorClassName = configuredExtraClassName.split(' ');
            }
            return { lineDecorationsWidth, extraEditorClassName };
        }
        getWithoutCommentsEditorOptions(editor, extraEditorClassName, startingLineDecorationsWidth) {
            let lineDecorationsWidth = startingLineDecorationsWidth;
            const inlineCommentPos = extraEditorClassName.findIndex(name => name === 'inline-comment');
            if (inlineCommentPos >= 0) {
                extraEditorClassName.splice(inlineCommentPos, 1);
            }
            const options = editor.getOptions();
            if (options.get(43 /* EditorOption.folding */) && options.get(110 /* EditorOption.showFoldingControls */) !== 'never') {
                lineDecorationsWidth += 11; // 11 comes from https://github.com/microsoft/vscode/blob/94ee5f58619d59170983f453fe78f156c0cc73a3/src/vs/workbench/contrib/comments/browser/media/review.css#L485
            }
            lineDecorationsWidth -= 24;
            return { extraEditorClassName, lineDecorationsWidth };
        }
        getWithCommentsLineDecorationWidth(editor, startingLineDecorationsWidth) {
            let lineDecorationsWidth = startingLineDecorationsWidth;
            const options = editor.getOptions();
            if (options.get(43 /* EditorOption.folding */) && options.get(110 /* EditorOption.showFoldingControls */) !== 'never') {
                lineDecorationsWidth -= 11;
            }
            lineDecorationsWidth += 24;
            this._commentingRangeAmountReserved = lineDecorationsWidth;
            return this._commentingRangeAmountReserved;
        }
        getWithCommentsEditorOptions(editor, extraEditorClassName, startingLineDecorationsWidth) {
            extraEditorClassName.push('inline-comment');
            return { lineDecorationsWidth: this.getWithCommentsLineDecorationWidth(editor, startingLineDecorationsWidth), extraEditorClassName };
        }
        updateEditorLayoutOptions(editor, extraEditorClassName, lineDecorationsWidth) {
            editor.updateOptions({
                extraEditorClassName: extraEditorClassName.join(' '),
                lineDecorationsWidth: lineDecorationsWidth
            });
        }
        ensureCommentingRangeReservedAmount(editor) {
            const existing = this.getExistingCommentEditorOptions(editor);
            if (existing.lineDecorationsWidth !== this._commentingRangeAmountReserved) {
                editor.updateOptions({
                    lineDecorationsWidth: this.getWithCommentsLineDecorationWidth(editor, existing.lineDecorationsWidth)
                });
            }
        }
        tryUpdateReservedSpace(uri) {
            if (!this.editor) {
                return;
            }
            const hasCommentsOrRangesInInfo = this._commentInfos.some(info => {
                const hasRanges = Boolean(info.commentingRanges && (Array.isArray(info.commentingRanges) ? info.commentingRanges : info.commentingRanges.ranges).length);
                return hasRanges || (info.threads.length > 0);
            });
            uri = uri ?? this.editor.getModel()?.uri;
            const resourceHasCommentingRanges = uri ? this.commentService.resourceHasCommentingRanges(uri) : false;
            const hasCommentsOrRanges = hasCommentsOrRangesInInfo || resourceHasCommentingRanges;
            if (hasCommentsOrRanges && this.commentService.isCommentingEnabled) {
                if (!this._commentingRangeSpaceReserved) {
                    this._commentingRangeSpaceReserved = true;
                    const { lineDecorationsWidth, extraEditorClassName } = this.getExistingCommentEditorOptions(this.editor);
                    const newOptions = this.getWithCommentsEditorOptions(this.editor, extraEditorClassName, lineDecorationsWidth);
                    this.updateEditorLayoutOptions(this.editor, newOptions.extraEditorClassName, newOptions.lineDecorationsWidth);
                }
                else {
                    this.ensureCommentingRangeReservedAmount(this.editor);
                }
            }
            else if ((!hasCommentsOrRanges || !this.commentService.isCommentingEnabled) && this._commentingRangeSpaceReserved) {
                this._commentingRangeSpaceReserved = false;
                const { lineDecorationsWidth, extraEditorClassName } = this.getExistingCommentEditorOptions(this.editor);
                const newOptions = this.getWithoutCommentsEditorOptions(this.editor, extraEditorClassName, lineDecorationsWidth);
                this.updateEditorLayoutOptions(this.editor, newOptions.extraEditorClassName, newOptions.lineDecorationsWidth);
            }
        }
        setComments(commentInfos) {
            if (!this.editor || !this.commentService.isCommentingEnabled) {
                return;
            }
            this._commentInfos = commentInfos;
            this.tryUpdateReservedSpace();
            // create viewzones
            this.removeCommentWidgetsAndStoreCache();
            let hasCommentingRanges = false;
            this._commentInfos.forEach(info => {
                if (!hasCommentingRanges && (info.commentingRanges.ranges.length > 0 || info.commentingRanges.fileComments)) {
                    hasCommentingRanges = true;
                }
                const providerCacheStore = this._pendingNewCommentCache[info.uniqueOwner];
                const providerEditsCacheStore = this._pendingEditsCache[info.uniqueOwner];
                info.threads = info.threads.filter(thread => !thread.isDisposed);
                info.threads.forEach(thread => {
                    let pendingComment = undefined;
                    if (providerCacheStore) {
                        pendingComment = providerCacheStore[thread.threadId];
                    }
                    let pendingEdits = undefined;
                    if (providerEditsCacheStore) {
                        pendingEdits = providerEditsCacheStore[thread.threadId];
                    }
                    this.displayCommentThread(info.uniqueOwner, thread, pendingComment, pendingEdits);
                });
                for (const thread of info.pendingCommentThreads ?? []) {
                    this.resumePendingComment(this.editor.getModel().uri, thread);
                }
            });
            this._commentingRangeDecorator.update(this.editor, this._commentInfos);
            this._commentThreadRangeDecorator.update(this.editor, this._commentInfos);
            if (hasCommentingRanges) {
                this._activeEditorHasCommentingRange.set(true);
            }
            else {
                this._activeEditorHasCommentingRange.set(false);
            }
        }
        closeWidget() {
            this._commentWidgets?.forEach(widget => widget.hide());
            if (this.editor) {
                this.editor.focus();
                this.editor.revealRangeInCenter(this.editor.getSelection());
            }
        }
        removeCommentWidgetsAndStoreCache() {
            if (this._commentWidgets) {
                this._commentWidgets.forEach(zone => {
                    const pendingComments = zone.getPendingComments();
                    const pendingNewComment = pendingComments.newComment;
                    const providerNewCommentCacheStore = this._pendingNewCommentCache[zone.uniqueOwner];
                    let lastCommentBody;
                    if (zone.commentThread.comments && zone.commentThread.comments.length) {
                        const lastComment = zone.commentThread.comments[zone.commentThread.comments.length - 1];
                        if (typeof lastComment.body === 'string') {
                            lastCommentBody = lastComment.body;
                        }
                        else {
                            lastCommentBody = lastComment.body.value;
                        }
                    }
                    if (pendingNewComment && (pendingNewComment !== lastCommentBody)) {
                        if (!providerNewCommentCacheStore) {
                            this._pendingNewCommentCache[zone.uniqueOwner] = {};
                        }
                        this._pendingNewCommentCache[zone.uniqueOwner][zone.commentThread.threadId] = pendingNewComment;
                    }
                    else {
                        if (providerNewCommentCacheStore) {
                            delete providerNewCommentCacheStore[zone.commentThread.threadId];
                        }
                    }
                    const pendingEdits = pendingComments.edits;
                    const providerEditsCacheStore = this._pendingEditsCache[zone.uniqueOwner];
                    if (Object.keys(pendingEdits).length > 0) {
                        if (!providerEditsCacheStore) {
                            this._pendingEditsCache[zone.uniqueOwner] = {};
                        }
                        this._pendingEditsCache[zone.uniqueOwner][zone.commentThread.threadId] = pendingEdits;
                    }
                    else if (providerEditsCacheStore) {
                        delete providerEditsCacheStore[zone.commentThread.threadId];
                    }
                    zone.dispose();
                });
            }
            this._commentWidgets = [];
        }
    };
    exports.CommentController = CommentController;
    exports.CommentController = CommentController = __decorate([
        __param(1, commentService_1.ICommentService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, viewsService_1.IViewsService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, editorService_1.IEditorService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, accessibility_1.IAccessibilityService)
    ], CommentController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9icm93c2VyL2NvbW1lbnRzQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUErV2hHLGtEQWlEQztJQWpYWSxRQUFBLEVBQUUsR0FBRyx1QkFBdUIsQ0FBQztJQWMxQyxNQUFNLHlCQUF5QjtRQUs5QixJQUFXLEVBQUU7WUFDWixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVELElBQVcsRUFBRSxDQUFDLEVBQXNCO1lBQ25DLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFXLEtBQUs7WUFDZixPQUFPO2dCQUNOLGVBQWUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLENBQUM7Z0JBQ3RELGFBQWEsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxDQUFDO2FBQ2hELENBQUM7UUFDSCxDQUFDO1FBRUQsWUFBb0IsT0FBb0IsRUFBVSxRQUFnQixFQUFVLFlBQWdDLEVBQVUsTUFBMEIsRUFBVSxNQUFjLEVBQWtCLE9BQStCLEVBQVUsb0JBQWdELEVBQWtCLFVBQW1CLEtBQUs7WUFBelMsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUFVLGFBQVEsR0FBUixRQUFRLENBQVE7WUFBVSxpQkFBWSxHQUFaLFlBQVksQ0FBb0I7WUFBVSxXQUFNLEdBQU4sTUFBTSxDQUFvQjtZQUFVLFdBQU0sR0FBTixNQUFNLENBQVE7WUFBa0IsWUFBTyxHQUFQLE9BQU8sQ0FBd0I7WUFBVSx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQTRCO1lBQWtCLFlBQU8sR0FBUCxPQUFPLENBQWlC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