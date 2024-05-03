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
define(["require", "exports", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/contrib/zoneWidget/browser/zoneWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/browser/commentGlyphWidget", "vs/workbench/contrib/comments/browser/commentService", "vs/editor/common/config/editorOptions", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/contrib/comments/browser/commentThreadWidget", "vs/workbench/contrib/comments/browser/commentColors", "vs/editor/contrib/peekView/browser/peekView", "vs/platform/configuration/common/configuration", "vs/editor/browser/stableEditorScroll"], function (require, exports, color_1, event_1, lifecycle_1, range_1, languages, zoneWidget_1, contextkey_1, instantiation_1, themeService_1, commentGlyphWidget_1, commentService_1, editorOptions_1, serviceCollection_1, commentThreadWidget_1, commentColors_1, peekView_1, configuration_1, stableEditorScroll_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReviewZoneWidget = exports.CommentWidgetFocus = void 0;
    exports.parseMouseDownInfoFromEvent = parseMouseDownInfoFromEvent;
    exports.isMouseUpEventDragFromMouseDown = isMouseUpEventDragFromMouseDown;
    exports.isMouseUpEventMatchMouseDown = isMouseUpEventMatchMouseDown;
    function getCommentThreadWidgetStateColor(thread, theme) {
        return (0, commentColors_1.getCommentThreadStateBorderColor)(thread, theme) ?? theme.getColor(peekView_1.peekViewBorder);
    }
    var CommentWidgetFocus;
    (function (CommentWidgetFocus) {
        CommentWidgetFocus[CommentWidgetFocus["None"] = 0] = "None";
        CommentWidgetFocus[CommentWidgetFocus["Widget"] = 1] = "Widget";
        CommentWidgetFocus[CommentWidgetFocus["Editor"] = 2] = "Editor";
    })(CommentWidgetFocus || (exports.CommentWidgetFocus = CommentWidgetFocus = {}));
    function parseMouseDownInfoFromEvent(e) {
        const range = e.target.range;
        if (!range) {
            return null;
        }
        if (!e.event.leftButton) {
            return null;
        }
        if (e.target.type !== 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */) {
            return null;
        }
        const data = e.target.detail;
        const gutterOffsetX = data.offsetX - data.glyphMarginWidth - data.lineNumbersWidth - data.glyphMarginLeft;
        // don't collide with folding and git decorations
        if (gutterOffsetX > 20) {
            return null;
        }
        return { lineNumber: range.startLineNumber };
    }
    function isMouseUpEventDragFromMouseDown(mouseDownInfo, e) {
        if (!mouseDownInfo) {
            return null;
        }
        const { lineNumber } = mouseDownInfo;
        const range = e.target.range;
        if (!range) {
            return null;
        }
        return lineNumber;
    }
    function isMouseUpEventMatchMouseDown(mouseDownInfo, e) {
        if (!mouseDownInfo) {
            return null;
        }
        const { lineNumber } = mouseDownInfo;
        const range = e.target.range;
        if (!range || range.startLineNumber !== lineNumber) {
            return null;
        }
        if (e.target.type !== 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */) {
            return null;
        }
        return lineNumber;
    }
    let ReviewZoneWidget = class ReviewZoneWidget extends zoneWidget_1.ZoneWidget {
        get uniqueOwner() {
            return this._uniqueOwner;
        }
        get commentThread() {
            return this._commentThread;
        }
        get expanded() {
            return this._isExpanded;
        }
        constructor(editor, _uniqueOwner, _commentThread, _pendingComment, _pendingEdits, instantiationService, themeService, commentService, contextKeyService, configurationService) {
            super(editor, { keepEditorSelection: true, isAccessible: true });
            this._uniqueOwner = _uniqueOwner;
            this._commentThread = _commentThread;
            this._pendingComment = _pendingComment;
            this._pendingEdits = _pendingEdits;
            this.themeService = themeService;
            this.commentService = commentService;
            this.configurationService = configurationService;
            this._onDidClose = new event_1.Emitter();
            this._onDidCreateThread = new event_1.Emitter();
            this._globalToDispose = new lifecycle_1.DisposableStore();
            this._commentThreadDisposables = [];
            this._contextKeyService = contextKeyService.createScoped(this.domNode);
            this._scopedInstantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this._contextKeyService]));
            const controller = this.commentService.getCommentController(this._uniqueOwner);
            if (controller) {
                this._commentOptions = controller.options;
            }
            this._initialCollapsibleState = _pendingComment ? languages.CommentThreadCollapsibleState.Expanded : _commentThread.initialCollapsibleState;
            _commentThread.initialCollapsibleState = this._initialCollapsibleState;
            this._isExpanded = this._initialCollapsibleState === languages.CommentThreadCollapsibleState.Expanded;
            this._commentThreadDisposables = [];
            this.create();
            this._globalToDispose.add(this.themeService.onDidColorThemeChange(this._applyTheme, this));
            this._globalToDispose.add(this.editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(50 /* EditorOption.fontInfo */)) {
                    this._applyTheme(this.themeService.getColorTheme());
                }
            }));
            this._applyTheme(this.themeService.getColorTheme());
        }
        get onDidClose() {
            return this._onDidClose.event;
        }
        get onDidCreateThread() {
            return this._onDidCreateThread.event;
        }
        getPosition() {
            if (this.position) {
                return this.position;
            }
            if (this._commentGlyph) {
                return this._commentGlyph.getPosition().position ?? undefined;
            }
            return undefined;
        }
        revealRange() {
            // we don't do anything here as we always do the reveal ourselves.
        }
        reveal(commentUniqueId, focus = CommentWidgetFocus.None) {
            if (!this._isExpanded) {
                this.show(this.arrowPosition(this._commentThread.range), 2);
            }
            if (commentUniqueId !== undefined) {
                const height = this.editor.getLayoutInfo().height;
                const coords = this._commentThreadWidget.getCommentCoords(commentUniqueId);
                if (coords) {
                    let scrollTop = 1;
                    if (this._commentThread.range) {
                        const commentThreadCoords = coords.thread;
                        const commentCoords = coords.comment;
                        scrollTop = this.editor.getTopForLineNumber(this._commentThread.range.startLineNumber) - height / 2 + commentCoords.top - commentThreadCoords.top;
                    }
                    this.editor.setScrollTop(scrollTop);
                    if (focus === CommentWidgetFocus.Widget) {
                        this._commentThreadWidget.focus();
                    }
                    else if (focus === CommentWidgetFocus.Editor) {
                        this._commentThreadWidget.focusCommentEditor();
                    }
                    return;
                }
            }
            const rangeToReveal = this._commentThread.range
                ? new range_1.Range(this._commentThread.range.startLineNumber, this._commentThread.range.startColumn, this._commentThread.range.endLineNumber + 1, 1)
                : new range_1.Range(1, 1, 1, 1);
            this.editor.revealRangeInCenter(rangeToReveal);
            if (focus === CommentWidgetFocus.Widget) {
                this._commentThreadWidget.focus();
            }
            else if (focus === CommentWidgetFocus.Editor) {
                this._commentThreadWidget.focusCommentEditor();
            }
        }
        getPendingComments() {
            return {
                newComment: this._commentThreadWidget.getPendingComment(),
                edits: this._commentThreadWidget.getPendingEdits()
            };
        }
        setPendingComment(comment) {
            this._pendingComment = comment;
            this.expand();
            this._commentThreadWidget.setPendingComment(comment);
        }
        _fillContainer(container) {
            this.setCssClass('review-widget');
            this._commentThreadWidget = this._scopedInstantiationService.createInstance(commentThreadWidget_1.CommentThreadWidget, container, this.editor, this._uniqueOwner, this.editor.getModel().uri, this._contextKeyService, this._scopedInstantiationService, this._commentThread, this._pendingComment, this._pendingEdits, { editor: this.editor, codeBlockFontSize: '', codeBlockFontFamily: this.configurationService.getValue('editor').fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily }, this._commentOptions, {
                actionRunner: async () => {
                    if (!this._commentThread.comments || !this._commentThread.comments.length) {
                        const newPosition = this.getPosition();
                        if (newPosition) {
                            const originalRange = this._commentThread.range;
                            if (!originalRange) {
                                return;
                            }
                            let range;
                            if (newPosition.lineNumber !== originalRange.endLineNumber) {
                                // The widget could have moved as a result of editor changes.
                                // We need to try to calculate the new, more correct, range for the comment.
                                const distance = newPosition.lineNumber - originalRange.endLineNumber;
                                range = new range_1.Range(originalRange.startLineNumber + distance, originalRange.startColumn, originalRange.endLineNumber + distance, originalRange.endColumn);
                            }
                            else {
                                range = new range_1.Range(originalRange.startLineNumber, originalRange.startColumn, originalRange.endLineNumber, originalRange.endColumn);
                            }
                            await this.commentService.updateCommentThreadTemplate(this.uniqueOwner, this._commentThread.commentThreadHandle, range);
                        }
                    }
                },
                collapse: () => {
                    this.collapse();
                }
            });
            this._disposables.add(this._commentThreadWidget);
        }
        arrowPosition(range) {
            if (!range) {
                return undefined;
            }
            // Arrow on top edge of zone widget will be at the start of the line if range is multi-line, else at midpoint of range (rounding rightwards)
            return { lineNumber: range.endLineNumber, column: range.endLineNumber === range.startLineNumber ? (range.startColumn + range.endColumn + 1) / 2 : 1 };
        }
        deleteCommentThread() {
            this.dispose();
            this.commentService.disposeCommentThread(this.uniqueOwner, this._commentThread.threadId);
        }
        collapse() {
            this._commentThread.collapsibleState = languages.CommentThreadCollapsibleState.Collapsed;
        }
        expand() {
            this._commentThread.collapsibleState = languages.CommentThreadCollapsibleState.Expanded;
        }
        getGlyphPosition() {
            if (this._commentGlyph) {
                return this._commentGlyph.getPosition().position.lineNumber;
            }
            return 0;
        }
        toggleExpand() {
            if (this._isExpanded) {
                this._commentThread.collapsibleState = languages.CommentThreadCollapsibleState.Collapsed;
            }
            else {
                this._commentThread.collapsibleState = languages.CommentThreadCollapsibleState.Expanded;
            }
        }
        async update(commentThread) {
            if (this._commentThread !== commentThread) {
                this._commentThreadDisposables.forEach(disposable => disposable.dispose());
                this._commentThread = commentThread;
                this._commentThreadDisposables = [];
                this.bindCommentThreadListeners();
            }
            this._commentThreadWidget.updateCommentThread(commentThread);
            // Move comment glyph widget and show position if the line has changed.
            const lineNumber = this._commentThread.range?.endLineNumber ?? 1;
            let shouldMoveWidget = false;
            if (this._commentGlyph) {
                this._commentGlyph.setThreadState(commentThread.state);
                if (this._commentGlyph.getPosition().position.lineNumber !== lineNumber) {
                    shouldMoveWidget = true;
                    this._commentGlyph.setLineNumber(lineNumber);
                }
            }
            if ((shouldMoveWidget && this._isExpanded) || (this._commentThread.collapsibleState === languages.CommentThreadCollapsibleState.Expanded && !this._isExpanded)) {
                this.show(this.arrowPosition(this._commentThread.range), 2);
            }
            else if (this._commentThread.collapsibleState !== languages.CommentThreadCollapsibleState.Expanded) {
                this.hide();
            }
        }
        _onWidth(widthInPixel) {
            this._commentThreadWidget.layout(widthInPixel);
        }
        _doLayout(heightInPixel, widthInPixel) {
            this._commentThreadWidget.layout(widthInPixel);
        }
        display(range) {
            if (range) {
                this._commentGlyph = new commentGlyphWidget_1.CommentGlyphWidget(this.editor, range?.endLineNumber ?? -1);
                this._commentGlyph.setThreadState(this._commentThread.state);
            }
            this._commentThreadWidget.display(this.editor.getOption(67 /* EditorOption.lineHeight */));
            this._disposables.add(this._commentThreadWidget.onDidResize(dimension => {
                this._refresh(dimension);
            }));
            if ((this._commentThread.collapsibleState === languages.CommentThreadCollapsibleState.Expanded) || (range === undefined)) {
                this.show(this.arrowPosition(range), 2);
            }
            // If this is a new comment thread awaiting user input then we need to reveal it.
            if (this._commentThread.canReply && this._commentThread.isTemplate && (!this._commentThread.comments || (this._commentThread.comments.length === 0))) {
                this.reveal();
            }
            this.bindCommentThreadListeners();
        }
        bindCommentThreadListeners() {
            this._commentThreadDisposables.push(this._commentThread.onDidChangeComments(async (_) => {
                await this.update(this._commentThread);
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeRange(range => {
                // Move comment glyph widget and show position if the line has changed.
                const lineNumber = this._commentThread.range?.startLineNumber ?? 1;
                let shouldMoveWidget = false;
                if (this._commentGlyph) {
                    if (this._commentGlyph.getPosition().position.lineNumber !== lineNumber) {
                        shouldMoveWidget = true;
                        this._commentGlyph.setLineNumber(lineNumber);
                    }
                }
                if (shouldMoveWidget && this._isExpanded) {
                    this.show(this.arrowPosition(this._commentThread.range), 2);
                }
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeCollapsibleState(state => {
                if (state === languages.CommentThreadCollapsibleState.Expanded && !this._isExpanded) {
                    this.show(this.arrowPosition(this._commentThread.range), 2);
                    return;
                }
                if (state === languages.CommentThreadCollapsibleState.Collapsed && this._isExpanded) {
                    this.hide();
                    return;
                }
            }));
            if (this._initialCollapsibleState === undefined) {
                const onDidChangeInitialCollapsibleState = this._commentThread.onDidChangeInitialCollapsibleState(state => {
                    // File comments always start expanded
                    this._initialCollapsibleState = state;
                    this._commentThread.collapsibleState = this._initialCollapsibleState;
                    onDidChangeInitialCollapsibleState.dispose();
                });
                this._commentThreadDisposables.push(onDidChangeInitialCollapsibleState);
            }
            this._commentThreadDisposables.push(this._commentThread.onDidChangeState(() => {
                const borderColor = getCommentThreadWidgetStateColor(this._commentThread.state, this.themeService.getColorTheme()) || color_1.Color.transparent;
                this.style({
                    frameColor: borderColor,
                    arrowColor: borderColor,
                });
                this.container?.style.setProperty(commentColors_1.commentThreadStateColorVar, `${borderColor}`);
                this.container?.style.setProperty(commentColors_1.commentThreadStateBackgroundColorVar, `${borderColor.transparent(.1)}`);
            }));
        }
        async submitComment() {
            return this._commentThreadWidget.submitComment();
        }
        _refresh(dimensions) {
            if (dimensions.height === 0 && dimensions.width === 0) {
                this.commentThread.collapsibleState = languages.CommentThreadCollapsibleState.Collapsed;
                return;
            }
            if (this._isExpanded) {
                this._commentThreadWidget.layout();
                const headHeight = Math.ceil(this.editor.getOption(67 /* EditorOption.lineHeight */) * 1.2);
                const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
                const arrowHeight = Math.round(lineHeight / 3);
                const frameThickness = Math.round(lineHeight / 9) * 2;
                const computedLinesNumber = Math.ceil((headHeight + dimensions.height + arrowHeight + frameThickness + 8 /** margin bottom to avoid margin collapse */) / lineHeight);
                if (this._viewZone?.heightInLines === computedLinesNumber) {
                    return;
                }
                const currentPosition = this.getPosition();
                if (this._viewZone && currentPosition && currentPosition.lineNumber !== this._viewZone.afterLineNumber && this._viewZone.afterLineNumber !== 0) {
                    this._viewZone.afterLineNumber = currentPosition.lineNumber;
                }
                if (!this._commentThread.comments || !this._commentThread.comments.length) {
                    this._commentThreadWidget.focusCommentEditor();
                }
                const capture = stableEditorScroll_1.StableEditorScrollState.capture(this.editor);
                this._relayout(computedLinesNumber);
                capture.restore(this.editor);
            }
        }
        _applyTheme(theme) {
            const borderColor = getCommentThreadWidgetStateColor(this._commentThread.state, this.themeService.getColorTheme()) || color_1.Color.transparent;
            this.style({
                arrowColor: borderColor,
                frameColor: borderColor
            });
            const fontInfo = this.editor.getOption(50 /* EditorOption.fontInfo */);
            // Editor decorations should also be responsive to theme changes
            this._commentThreadWidget.applyTheme(theme, fontInfo);
        }
        show(rangeOrPos, heightInLines) {
            const glyphPosition = this._commentGlyph?.getPosition();
            let range = range_1.Range.isIRange(rangeOrPos) ? rangeOrPos : (rangeOrPos ? range_1.Range.fromPositions(rangeOrPos) : undefined);
            if (glyphPosition?.position && range && glyphPosition.position.lineNumber !== range.endLineNumber) {
                // The widget could have moved as a result of editor changes.
                // We need to try to calculate the new, more correct, range for the comment.
                const distance = glyphPosition.position.lineNumber - range.endLineNumber;
                range = new range_1.Range(range.startLineNumber + distance, range.startColumn, range.endLineNumber + distance, range.endColumn);
            }
            this._isExpanded = true;
            super.show(range ?? new range_1.Range(0, 0, 0, 0), heightInLines);
            this._commentThread.collapsibleState = languages.CommentThreadCollapsibleState.Expanded;
            this._refresh(this._commentThreadWidget.getDimensions());
        }
        hide() {
            if (this._isExpanded) {
                this._isExpanded = false;
                // Focus the container so that the comment editor will be blurred before it is hidden
                if (this.editor.hasWidgetFocus()) {
                    this.editor.focus();
                }
                if (!this._commentThread.comments || !this._commentThread.comments.length) {
                    this.deleteCommentThread();
                }
            }
            super.hide();
        }
        dispose() {
            super.dispose();
            if (this._commentGlyph) {
                this._commentGlyph.dispose();
                this._commentGlyph = undefined;
            }
            this._globalToDispose.dispose();
            this._commentThreadDisposables.forEach(global => global.dispose());
            this._onDidClose.fire(undefined);
        }
    };
    exports.ReviewZoneWidget = ReviewZoneWidget;
    exports.ReviewZoneWidget = ReviewZoneWidget = __decorate([
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService),
        __param(7, commentService_1.ICommentService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, configuration_1.IConfigurationService)
    ], ReviewZoneWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudFRocmVhZFpvbmVXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvbW1lbnRzL2Jyb3dzZXIvY29tbWVudFRocmVhZFpvbmVXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0NoRyxrRUF3QkM7SUFFRCwwRUFjQztJQUVELG9FQWtCQztJQXRFRCxTQUFTLGdDQUFnQyxDQUFDLE1BQWdELEVBQUUsS0FBa0I7UUFDN0csT0FBTyxJQUFBLGdEQUFnQyxFQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLHlCQUFjLENBQUMsQ0FBQztJQUMxRixDQUFDO0lBRUQsSUFBWSxrQkFJWDtJQUpELFdBQVksa0JBQWtCO1FBQzdCLDJEQUFRLENBQUE7UUFDUiwrREFBVSxDQUFBO1FBQ1YsK0RBQVUsQ0FBQTtJQUNYLENBQUMsRUFKVyxrQkFBa0Isa0NBQWxCLGtCQUFrQixRQUk3QjtJQUVELFNBQWdCLDJCQUEyQixDQUFDLENBQW9CO1FBQy9ELE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBRTdCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNaLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3pCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLG9EQUE0QyxFQUFFLENBQUM7WUFDL0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFN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