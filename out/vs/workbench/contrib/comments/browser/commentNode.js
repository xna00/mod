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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/editor/common/languages", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/simpleCommentEditor", "vs/editor/common/core/selection", "vs/base/common/event", "vs/platform/notification/common/notification", "vs/base/browser/ui/toolbar/toolbar", "vs/platform/contextview/browser/contextView", "./reactionsAction", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/comments/browser/commentFormActions", "vs/base/browser/ui/mouseCursor/mouseCursor", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/base/common/codicons", "vs/base/common/themables", "vs/workbench/contrib/comments/browser/timestamp", "vs/platform/configuration/common/configuration", "vs/base/common/scrollable", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/browser/event", "vs/workbench/contrib/comments/common/commentContextKeys", "vs/base/common/network", "vs/workbench/contrib/comments/common/commentsConfiguration", "vs/base/browser/mouseEvent", "vs/platform/accessibility/common/accessibility", "vs/platform/keybinding/common/keybinding"], function (require, exports, nls, dom, languages, actionbar_1, actions_1, lifecycle_1, uri_1, model_1, language_1, instantiation_1, commentService_1, simpleCommentEditor_1, selection_1, event_1, notification_1, toolbar_1, contextView_1, reactionsAction_1, actions_2, menuEntryActionViewItem_1, contextkey_1, commentFormActions_1, mouseCursor_1, actionViewItems_1, dropdownActionViewItem_1, codicons_1, themables_1, timestamp_1, configuration_1, scrollable_1, scrollableElement_1, event_2, commentContextKeys_1, network_1, commentsConfiguration_1, mouseEvent_1, accessibility_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentNode = void 0;
    class CommentsActionRunner extends actions_1.ActionRunner {
        async runAction(action, context) {
            await action.run(...context);
        }
    }
    let CommentNode = class CommentNode extends lifecycle_1.Disposable {
        get domNode() {
            return this._domNode;
        }
        constructor(parentEditor, commentThread, comment, pendingEdit, owner, resource, parentThread, markdownRenderer, instantiationService, commentService, modelService, languageService, notificationService, contextMenuService, contextKeyService, configurationService, accessibilityService, keybindingService) {
            super();
            this.parentEditor = parentEditor;
            this.commentThread = commentThread;
            this.comment = comment;
            this.pendingEdit = pendingEdit;
            this.owner = owner;
            this.resource = resource;
            this.parentThread = parentThread;
            this.markdownRenderer = markdownRenderer;
            this.instantiationService = instantiationService;
            this.commentService = commentService;
            this.modelService = modelService;
            this.languageService = languageService;
            this.notificationService = notificationService;
            this.contextMenuService = contextMenuService;
            this.configurationService = configurationService;
            this.accessibilityService = accessibilityService;
            this.keybindingService = keybindingService;
            this._editAction = null;
            this._commentEditContainer = null;
            this._commentEditor = null;
            this._commentEditorDisposables = [];
            this._commentEditorModel = null;
            this._editorHeight = simpleCommentEditor_1.MIN_EDITOR_HEIGHT;
            this._commentFormActions = null;
            this._commentEditorActions = null;
            this._onDidClick = new event_1.Emitter();
            this.isEditing = false;
            this._domNode = dom.$('div.review-comment');
            this._contextKeyService = contextKeyService.createScoped(this._domNode);
            this._commentContextValue = commentContextKeys_1.CommentContextKeys.commentContext.bindTo(this._contextKeyService);
            if (this.comment.contextValue) {
                this._commentContextValue.set(this.comment.contextValue);
            }
            this._commentMenus = this.commentService.getCommentMenus(this.owner);
            this._domNode.tabIndex = -1;
            this._avatar = dom.append(this._domNode, dom.$('div.avatar-container'));
            this.updateCommentUserIcon(this.comment.userIconPath);
            this._commentDetailsContainer = dom.append(this._domNode, dom.$('.review-comment-contents'));
            this.createHeader(this._commentDetailsContainer);
            this._body = document.createElement(`div`);
            this._body.classList.add('comment-body', mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME);
            if (configurationService.getValue(commentsConfiguration_1.COMMENTS_SECTION)?.maxHeight !== false) {
                this._body.classList.add('comment-body-max-height');
            }
            this.createScroll(this._commentDetailsContainer, this._body);
            this.updateCommentBody(this.comment.body);
            if (this.comment.commentReactions && this.comment.commentReactions.length && this.comment.commentReactions.filter(reaction => !!reaction.count).length) {
                this.createReactionsContainer(this._commentDetailsContainer);
            }
            this._domNode.setAttribute('aria-label', `${comment.userName}, ${this.commentBodyValue}`);
            this._domNode.setAttribute('role', 'treeitem');
            this._clearTimeout = null;
            this._register(dom.addDisposableListener(this._domNode, dom.EventType.CLICK, () => this.isEditing || this._onDidClick.fire(this)));
            this._register(dom.addDisposableListener(this._domNode, dom.EventType.CONTEXT_MENU, e => {
                return this.onContextMenu(e);
            }));
            if (pendingEdit) {
                this.switchToEditMode();
            }
            this._register(this.accessibilityService.onDidChangeScreenReaderOptimized(() => {
                this.toggleToolbarHidden(true);
            }));
            this.activeCommentListeners();
        }
        activeCommentListeners() {
            this._register(dom.addDisposableListener(this._domNode, dom.EventType.FOCUS_IN, () => {
                this.commentService.setActiveCommentAndThread(this.owner, { thread: this.commentThread, comment: this.comment });
            }, true));
        }
        createScroll(container, body) {
            this._scrollable = new scrollable_1.Scrollable({
                forceIntegerValues: true,
                smoothScrollDuration: 125,
                scheduleAtNextAnimationFrame: cb => dom.scheduleAtNextAnimationFrame(dom.getWindow(container), cb)
            });
            this._scrollableElement = this._register(new scrollableElement_1.SmoothScrollableElement(body, {
                horizontal: 3 /* ScrollbarVisibility.Visible */,
                vertical: 3 /* ScrollbarVisibility.Visible */
            }, this._scrollable));
            this._register(this._scrollableElement.onScroll(e => {
                if (e.scrollLeftChanged) {
                    body.scrollLeft = e.scrollLeft;
                }
                if (e.scrollTopChanged) {
                    body.scrollTop = e.scrollTop;
                }
            }));
            const onDidScrollViewContainer = this._register(new event_2.DomEmitter(body, 'scroll')).event;
            this._register(onDidScrollViewContainer(_ => {
                const position = this._scrollableElement.getScrollPosition();
                const scrollLeft = Math.abs(body.scrollLeft - position.scrollLeft) <= 1 ? undefined : body.scrollLeft;
                const scrollTop = Math.abs(body.scrollTop - position.scrollTop) <= 1 ? undefined : body.scrollTop;
                if (scrollLeft !== undefined || scrollTop !== undefined) {
                    this._scrollableElement.setScrollPosition({ scrollLeft, scrollTop });
                }
            }));
            container.appendChild(this._scrollableElement.getDomNode());
        }
        updateCommentBody(body) {
            this._body.innerText = '';
            this._md = undefined;
            this._plainText = undefined;
            if (typeof body === 'string') {
                this._plainText = dom.append(this._body, dom.$('.comment-body-plainstring'));
                this._plainText.innerText = body;
            }
            else {
                this._md = this.markdownRenderer.render(body).element;
                this._body.appendChild(this._md);
            }
        }
        updateCommentUserIcon(userIconPath) {
            this._avatar.textContent = '';
            if (userIconPath) {
                const img = dom.append(this._avatar, dom.$('img.avatar'));
                img.src = network_1.FileAccess.uriToBrowserUri(uri_1.URI.revive(userIconPath)).toString(true);
                img.onerror = _ => img.remove();
            }
        }
        get onDidClick() {
            return this._onDidClick.event;
        }
        createTimestamp(container) {
            this._timestamp = dom.append(container, dom.$('span.timestamp-container'));
            this.updateTimestamp(this.comment.timestamp);
        }
        updateTimestamp(raw) {
            if (!this._timestamp) {
                return;
            }
            const timestamp = raw !== undefined ? new Date(raw) : undefined;
            if (!timestamp) {
                this._timestampWidget?.dispose();
            }
            else {
                if (!this._timestampWidget) {
                    this._timestampWidget = new timestamp_1.TimestampWidget(this.configurationService, this._timestamp, timestamp);
                    this._register(this._timestampWidget);
                }
                else {
                    this._timestampWidget.setTimestamp(timestamp);
                }
            }
        }
        createHeader(commentDetailsContainer) {
            const header = dom.append(commentDetailsContainer, dom.$(`div.comment-title.${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`));
            const infoContainer = dom.append(header, dom.$('comment-header-info'));
            const author = dom.append(infoContainer, dom.$('strong.author'));
            author.innerText = this.comment.userName;
            this.createTimestamp(infoContainer);
            this._isPendingLabel = dom.append(infoContainer, dom.$('span.isPending'));
            if (this.comment.label) {
                this._isPendingLabel.innerText = this.comment.label;
            }
            else {
                this._isPendingLabel.innerText = '';
            }
            this._actionsToolbarContainer = dom.append(header, dom.$('.comment-actions'));
            this.toggleToolbarHidden(true);
            this.createActionsToolbar();
        }
        toggleToolbarHidden(hidden) {
            if (hidden && !this.accessibilityService.isScreenReaderOptimized()) {
                this._actionsToolbarContainer.classList.add('hidden');
            }
            else {
                this._actionsToolbarContainer.classList.remove('hidden');
            }
        }
        getToolbarActions(menu) {
            const contributedActions = menu.getActions({ shouldForwardArgs: true });
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            fillInActions(contributedActions, result, false, g => /^inline/.test(g));
            return result;
        }
        get commentNodeContext() {
            return [{
                    thread: this.commentThread,
                    commentUniqueId: this.comment.uniqueIdInThread,
                    $mid: 10 /* MarshalledId.CommentNode */
                },
                {
                    commentControlHandle: this.commentThread.controllerHandle,
                    commentThreadHandle: this.commentThread.commentThreadHandle,
                    $mid: 7 /* MarshalledId.CommentThread */
                }];
        }
        createToolbar() {
            this.toolbar = new toolbar_1.ToolBar(this._actionsToolbarContainer, this.contextMenuService, {
                actionViewItemProvider: (action, options) => {
                    if (action.id === reactionsAction_1.ToggleReactionsAction.ID) {
                        return new dropdownActionViewItem_1.DropdownMenuActionViewItem(action, action.menuActions, this.contextMenuService, {
                            ...options,
                            actionViewItemProvider: (action, options) => this.actionViewItemProvider(action, options),
                            actionRunner: this.actionRunner,
                            classNames: ['toolbar-toggle-pickReactions', ...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.reactions)],
                            anchorAlignmentProvider: () => 1 /* AnchorAlignment.RIGHT */
                        });
                    }
                    return this.actionViewItemProvider(action, options);
                },
                orientation: 0 /* ActionsOrientation.HORIZONTAL */
            });
            this.toolbar.context = this.commentNodeContext;
            this.toolbar.actionRunner = new CommentsActionRunner();
            this.registerActionBarListeners(this._actionsToolbarContainer);
            this._register(this.toolbar);
        }
        createActionsToolbar() {
            const actions = [];
            const hasReactionHandler = this.commentService.hasReactionHandler(this.owner);
            if (hasReactionHandler) {
                const toggleReactionAction = this.createReactionPicker(this.comment.commentReactions || []);
                actions.push(toggleReactionAction);
            }
            const menu = this._commentMenus.getCommentTitleActions(this.comment, this._contextKeyService);
            this._register(menu);
            this._register(menu.onDidChange(e => {
                const { primary, secondary } = this.getToolbarActions(menu);
                if (!this.toolbar && (primary.length || secondary.length)) {
                    this.createToolbar();
                }
                this.toolbar.setActions(primary, secondary);
            }));
            const { primary, secondary } = this.getToolbarActions(menu);
            actions.push(...primary);
            if (actions.length || secondary.length) {
                this.createToolbar();
                this.toolbar.setActions(actions, secondary);
            }
        }
        actionViewItemProvider(action, options) {
            if (action.id === reactionsAction_1.ToggleReactionsAction.ID) {
                options = { label: false, icon: true };
            }
            else {
                options = { label: false, icon: true };
            }
            if (action.id === reactionsAction_1.ReactionAction.ID) {
                const item = new reactionsAction_1.ReactionActionViewItem(action);
                return item;
            }
            else if (action instanceof actions_2.MenuItemAction) {
                return this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate });
            }
            else if (action instanceof actions_2.SubmenuItemAction) {
                return this.instantiationService.createInstance(menuEntryActionViewItem_1.SubmenuEntryActionViewItem, action, options);
            }
            else {
                const item = new actionViewItems_1.ActionViewItem({}, action, options);
                return item;
            }
        }
        async submitComment() {
            if (this._commentEditor && this._commentFormActions) {
                await this._commentFormActions.triggerDefaultAction();
                this.pendingEdit = undefined;
            }
        }
        createReactionPicker(reactionGroup) {
            const toggleReactionAction = this._register(new reactionsAction_1.ToggleReactionsAction(() => {
                toggleReactionActionViewItem?.show();
            }, nls.localize('commentToggleReaction', "Toggle Reaction")));
            let reactionMenuActions = [];
            if (reactionGroup && reactionGroup.length) {
                reactionMenuActions = reactionGroup.map((reaction) => {
                    return new actions_1.Action(`reaction.command.${reaction.label}`, `${reaction.label}`, '', true, async () => {
                        try {
                            await this.commentService.toggleReaction(this.owner, this.resource, this.commentThread, this.comment, reaction);
                        }
                        catch (e) {
                            const error = e.message
                                ? nls.localize('commentToggleReactionError', "Toggling the comment reaction failed: {0}.", e.message)
                                : nls.localize('commentToggleReactionDefaultError', "Toggling the comment reaction failed");
                            this.notificationService.error(error);
                        }
                    });
                });
            }
            toggleReactionAction.menuActions = reactionMenuActions;
            const toggleReactionActionViewItem = new dropdownActionViewItem_1.DropdownMenuActionViewItem(toggleReactionAction, toggleReactionAction.menuActions, this.contextMenuService, {
                actionViewItemProvider: (action, options) => {
                    if (action.id === reactionsAction_1.ToggleReactionsAction.ID) {
                        return toggleReactionActionViewItem;
                    }
                    return this.actionViewItemProvider(action, options);
                },
                actionRunner: this.actionRunner,
                classNames: 'toolbar-toggle-pickReactions',
                anchorAlignmentProvider: () => 1 /* AnchorAlignment.RIGHT */
            });
            return toggleReactionAction;
        }
        createReactionsContainer(commentDetailsContainer) {
            this._reactionActionsContainer = dom.append(commentDetailsContainer, dom.$('div.comment-reactions'));
            this._reactionsActionBar = new actionbar_1.ActionBar(this._reactionActionsContainer, {
                actionViewItemProvider: (action, options) => {
                    if (action.id === reactionsAction_1.ToggleReactionsAction.ID) {
                        return new dropdownActionViewItem_1.DropdownMenuActionViewItem(action, action.menuActions, this.contextMenuService, {
                            actionViewItemProvider: (action, options) => this.actionViewItemProvider(action, options),
                            actionRunner: this.actionRunner,
                            classNames: ['toolbar-toggle-pickReactions', ...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.reactions)],
                            anchorAlignmentProvider: () => 1 /* AnchorAlignment.RIGHT */
                        });
                    }
                    return this.actionViewItemProvider(action, options);
                }
            });
            this._register(this._reactionsActionBar);
            const hasReactionHandler = this.commentService.hasReactionHandler(this.owner);
            this.comment.commentReactions.filter(reaction => !!reaction.count).map(reaction => {
                const action = new reactionsAction_1.ReactionAction(`reaction.${reaction.label}`, `${reaction.label}`, reaction.hasReacted && (reaction.canEdit || hasReactionHandler) ? 'active' : '', (reaction.canEdit || hasReactionHandler), async () => {
                    try {
                        await this.commentService.toggleReaction(this.owner, this.resource, this.commentThread, this.comment, reaction);
                    }
                    catch (e) {
                        let error;
                        if (reaction.hasReacted) {
                            error = e.message
                                ? nls.localize('commentDeleteReactionError', "Deleting the comment reaction failed: {0}.", e.message)
                                : nls.localize('commentDeleteReactionDefaultError', "Deleting the comment reaction failed");
                        }
                        else {
                            error = e.message
                                ? nls.localize('commentAddReactionError', "Deleting the comment reaction failed: {0}.", e.message)
                                : nls.localize('commentAddReactionDefaultError', "Deleting the comment reaction failed");
                        }
                        this.notificationService.error(error);
                    }
                }, reaction.reactors, reaction.iconPath, reaction.count);
                this._reactionsActionBar?.push(action, { label: true, icon: true });
            });
            if (hasReactionHandler) {
                const toggleReactionAction = this.createReactionPicker(this.comment.commentReactions || []);
                this._reactionsActionBar.push(toggleReactionAction, { label: false, icon: true });
            }
        }
        get commentBodyValue() {
            return (typeof this.comment.body === 'string') ? this.comment.body : this.comment.body.value;
        }
        createCommentEditor(editContainer) {
            const container = dom.append(editContainer, dom.$('.edit-textarea'));
            this._commentEditor = this.instantiationService.createInstance(simpleCommentEditor_1.SimpleCommentEditor, container, simpleCommentEditor_1.SimpleCommentEditor.getEditorOptions(this.configurationService), this._contextKeyService, this.parentThread);
            const resource = uri_1.URI.parse(`comment:commentinput-${this.comment.uniqueIdInThread}-${Date.now()}.md`);
            this._commentEditorModel = this.modelService.createModel('', this.languageService.createByFilepathOrFirstLine(resource), resource, false);
            this._commentEditor.setModel(this._commentEditorModel);
            this._commentEditor.setValue(this.pendingEdit ?? this.commentBodyValue);
            this.pendingEdit = undefined;
            this._commentEditor.layout({ width: container.clientWidth - 14, height: this._editorHeight });
            this._commentEditor.focus();
            dom.scheduleAtNextAnimationFrame(dom.getWindow(editContainer), () => {
                this._commentEditor.layout({ width: container.clientWidth - 14, height: this._editorHeight });
                this._commentEditor.focus();
            });
            const lastLine = this._commentEditorModel.getLineCount();
            const lastColumn = this._commentEditorModel.getLineLength(lastLine) + 1;
            this._commentEditor.setSelection(new selection_1.Selection(lastLine, lastColumn, lastLine, lastColumn));
            const commentThread = this.commentThread;
            commentThread.input = {
                uri: this._commentEditor.getModel().uri,
                value: this.commentBodyValue
            };
            this.commentService.setActiveEditingCommentThread(commentThread);
            this.commentService.setActiveCommentAndThread(this.owner, { thread: commentThread, comment: this.comment });
            this._commentEditorDisposables.push(this._commentEditor.onDidFocusEditorWidget(() => {
                commentThread.input = {
                    uri: this._commentEditor.getModel().uri,
                    value: this.commentBodyValue
                };
                this.commentService.setActiveEditingCommentThread(commentThread);
                this.commentService.setActiveCommentAndThread(this.owner, { thread: commentThread, comment: this.comment });
            }));
            this._commentEditorDisposables.push(this._commentEditor.onDidChangeModelContent(e => {
                if (commentThread.input && this._commentEditor && this._commentEditor.getModel().uri === commentThread.input.uri) {
                    const newVal = this._commentEditor.getValue();
                    if (newVal !== commentThread.input.value) {
                        const input = commentThread.input;
                        input.value = newVal;
                        commentThread.input = input;
                        this.commentService.setActiveEditingCommentThread(commentThread);
                        this.commentService.setActiveCommentAndThread(this.owner, { thread: commentThread, comment: this.comment });
                    }
                }
            }));
            this.calculateEditorHeight();
            this._register((this._commentEditorModel.onDidChangeContent(() => {
                if (this._commentEditor && this.calculateEditorHeight()) {
                    this._commentEditor.layout({ height: this._editorHeight, width: this._commentEditor.getLayoutInfo().width });
                    this._commentEditor.render(true);
                }
            })));
            this._register(this._commentEditor);
            this._register(this._commentEditorModel);
        }
        calculateEditorHeight() {
            if (this._commentEditor) {
                const newEditorHeight = (0, simpleCommentEditor_1.calculateEditorHeight)(this.parentEditor, this._commentEditor, this._editorHeight);
                if (newEditorHeight !== this._editorHeight) {
                    this._editorHeight = newEditorHeight;
                    return true;
                }
            }
            return false;
        }
        getPendingEdit() {
            const model = this._commentEditor?.getModel();
            if (model && model.getValueLength() > 0) {
                return model.getValue();
            }
            return undefined;
        }
        removeCommentEditor() {
            this.isEditing = false;
            if (this._editAction) {
                this._editAction.enabled = true;
            }
            this._body.classList.remove('hidden');
            this._commentEditorModel?.dispose();
            (0, lifecycle_1.dispose)(this._commentEditorDisposables);
            this._commentEditorDisposables = [];
            this._commentEditor?.dispose();
            this._commentEditor = null;
            this._commentEditContainer.remove();
        }
        layout(widthInPixel) {
            const editorWidth = widthInPixel !== undefined ? widthInPixel - 72 /* - margin and scrollbar*/ : (this._commentEditor?.getLayoutInfo().width ?? 0);
            this._commentEditor?.layout({ width: editorWidth, height: this._editorHeight });
            const scrollWidth = this._body.scrollWidth;
            const width = dom.getContentWidth(this._body);
            const scrollHeight = this._body.scrollHeight;
            const height = dom.getContentHeight(this._body) + 4;
            this._scrollableElement.setScrollDimensions({ width, scrollWidth, height, scrollHeight });
        }
        switchToEditMode() {
            if (this.isEditing) {
                return;
            }
            this.isEditing = true;
            this._body.classList.add('hidden');
            this._commentEditContainer = dom.append(this._commentDetailsContainer, dom.$('.edit-container'));
            this.createCommentEditor(this._commentEditContainer);
            const formActions = dom.append(this._commentEditContainer, dom.$('.form-actions'));
            const otherActions = dom.append(formActions, dom.$('.other-actions'));
            this.createCommentWidgetFormActions(otherActions);
            const editorActions = dom.append(formActions, dom.$('.editor-actions'));
            this.createCommentWidgetEditorActions(editorActions);
        }
        createCommentWidgetFormActions(container) {
            const menus = this.commentService.getCommentMenus(this.owner);
            const menu = menus.getCommentActions(this.comment, this._contextKeyService);
            this._register(menu);
            this._register(menu.onDidChange(() => {
                this._commentFormActions?.setActions(menu);
            }));
            this._commentFormActions = new commentFormActions_1.CommentFormActions(this.keybindingService, this._contextKeyService, container, (action) => {
                const text = this._commentEditor.getValue();
                action.run({
                    thread: this.commentThread,
                    commentUniqueId: this.comment.uniqueIdInThread,
                    text: text,
                    $mid: 11 /* MarshalledId.CommentThreadNode */
                });
                this.removeCommentEditor();
            });
            this._register(this._commentFormActions);
            this._commentFormActions.setActions(menu);
        }
        createCommentWidgetEditorActions(container) {
            const menus = this.commentService.getCommentMenus(this.owner);
            const menu = menus.getCommentEditorActions(this._contextKeyService);
            this._register(menu);
            this._register(menu.onDidChange(() => {
                this._commentEditorActions?.setActions(menu);
            }));
            this._commentEditorActions = new commentFormActions_1.CommentFormActions(this.keybindingService, this._contextKeyService, container, (action) => {
                const text = this._commentEditor.getValue();
                action.run({
                    thread: this.commentThread,
                    commentUniqueId: this.comment.uniqueIdInThread,
                    text: text,
                    $mid: 11 /* MarshalledId.CommentThreadNode */
                });
                this._commentEditor?.focus();
            });
            this._register(this._commentEditorActions);
            this._commentEditorActions.setActions(menu, true);
        }
        setFocus(focused, visible = false) {
            if (focused) {
                this._domNode.focus();
                this.toggleToolbarHidden(false);
                this._actionsToolbarContainer.classList.add('tabfocused');
                this._domNode.tabIndex = 0;
                if (this.comment.mode === languages.CommentMode.Editing) {
                    this._commentEditor?.focus();
                }
            }
            else {
                if (this._actionsToolbarContainer.classList.contains('tabfocused') && !this._actionsToolbarContainer.classList.contains('mouseover')) {
                    this.toggleToolbarHidden(true);
                    this._domNode.tabIndex = -1;
                }
                this._actionsToolbarContainer.classList.remove('tabfocused');
            }
        }
        registerActionBarListeners(actionsContainer) {
            this._register(dom.addDisposableListener(this._domNode, 'mouseenter', () => {
                this.toggleToolbarHidden(false);
                actionsContainer.classList.add('mouseover');
            }));
            this._register(dom.addDisposableListener(this._domNode, 'mouseleave', () => {
                if (actionsContainer.classList.contains('mouseover') && !actionsContainer.classList.contains('tabfocused')) {
                    this.toggleToolbarHidden(true);
                }
                actionsContainer.classList.remove('mouseover');
            }));
        }
        update(newComment) {
            if (newComment.body !== this.comment.body) {
                this.updateCommentBody(newComment.body);
            }
            if (this.comment.userIconPath && newComment.userIconPath && (uri_1.URI.from(this.comment.userIconPath).toString() !== uri_1.URI.from(newComment.userIconPath).toString())) {
                this.updateCommentUserIcon(newComment.userIconPath);
            }
            const isChangingMode = newComment.mode !== undefined && newComment.mode !== this.comment.mode;
            this.comment = newComment;
            if (isChangingMode) {
                if (newComment.mode === languages.CommentMode.Editing) {
                    this.switchToEditMode();
                }
                else {
                    this.removeCommentEditor();
                }
            }
            if (newComment.label) {
                this._isPendingLabel.innerText = newComment.label;
            }
            else {
                this._isPendingLabel.innerText = '';
            }
            // update comment reactions
            this._reactionActionsContainer?.remove();
            this._reactionsActionBar?.clear();
            if (this.comment.commentReactions && this.comment.commentReactions.some(reaction => !!reaction.count)) {
                this.createReactionsContainer(this._commentDetailsContainer);
            }
            if (this.comment.contextValue) {
                this._commentContextValue.set(this.comment.contextValue);
            }
            else {
                this._commentContextValue.reset();
            }
            if (this.comment.timestamp) {
                this.updateTimestamp(this.comment.timestamp);
            }
        }
        onContextMenu(e) {
            const event = new mouseEvent_1.StandardMouseEvent(dom.getWindow(this._domNode), e);
            this.contextMenuService.showContextMenu({
                getAnchor: () => event,
                menuId: actions_2.MenuId.CommentThreadCommentContext,
                menuActionOptions: { shouldForwardArgs: true },
                contextKeyService: this._contextKeyService,
                actionRunner: new CommentsActionRunner(),
                getActionsContext: () => {
                    return this.commentNodeContext;
                },
            });
        }
        focus() {
            this.domNode.focus();
            if (!this._clearTimeout) {
                this.domNode.classList.add('focus');
                this._clearTimeout = setTimeout(() => {
                    this.domNode.classList.remove('focus');
                }, 3000);
            }
        }
        dispose() {
            super.dispose();
            (0, lifecycle_1.dispose)(this._commentEditorDisposables);
        }
    };
    exports.CommentNode = CommentNode;
    exports.CommentNode = CommentNode = __decorate([
        __param(8, instantiation_1.IInstantiationService),
        __param(9, commentService_1.ICommentService),
        __param(10, model_1.IModelService),
        __param(11, language_1.ILanguageService),
        __param(12, notification_1.INotificationService),
        __param(13, contextView_1.IContextMenuService),
        __param(14, contextkey_1.IContextKeyService),
        __param(15, configuration_1.IConfigurationService),
        __param(16, accessibility_1.IAccessibilityService),
        __param(17, keybinding_1.IKeybindingService)
    ], CommentNode);
    function fillInActions(groups, target, useAlternativeActions, isPrimaryGroup = group => group === 'navigation') {
        for (const tuple of groups) {
            let [group, actions] = tuple;
            if (useAlternativeActions) {
                actions = actions.map(a => (a instanceof actions_2.MenuItemAction) && !!a.alt ? a.alt : a);
            }
            if (isPrimaryGroup(group)) {
                const to = Array.isArray(target) ? target : target.primary;
                to.unshift(...actions);
            }
            else {
                const to = Array.isArray(target) ? target : target.secondary;
                if (to.length > 0) {
                    to.push(new actions_1.Separator());
                }
                to.push(...actions);
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudE5vZGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvbW1lbnRzL2Jyb3dzZXIvY29tbWVudE5vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbURoRyxNQUFNLG9CQUFxQixTQUFRLHNCQUFZO1FBQzNCLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBZSxFQUFFLE9BQWM7WUFDakUsTUFBTSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUM7UUFDOUIsQ0FBQztLQUNEO0lBRU0sSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBMkMsU0FBUSxzQkFBVTtRQW9DekUsSUFBVyxPQUFPO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBSUQsWUFDa0IsWUFBOEIsRUFDdkMsYUFBeUMsRUFDMUMsT0FBMEIsRUFDekIsV0FBK0IsRUFDL0IsS0FBYSxFQUNiLFFBQWEsRUFDYixZQUFrQyxFQUNsQyxnQkFBa0MsRUFDbkIsb0JBQW1ELEVBQ3pELGNBQXVDLEVBQ3pDLFlBQW1DLEVBQ2hDLGVBQXlDLEVBQ3JDLG1CQUFpRCxFQUNsRCxrQkFBK0MsRUFDaEQsaUJBQXFDLEVBQ2xDLG9CQUFtRCxFQUNuRCxvQkFBbUQsRUFDdEQsaUJBQTZDO1lBRWpFLEtBQUssRUFBRSxDQUFDO1lBbkJTLGlCQUFZLEdBQVosWUFBWSxDQUFrQjtZQUN2QyxrQkFBYSxHQUFiLGFBQWEsQ0FBNEI7WUFDMUMsWUFBTyxHQUFQLE9BQU8sQ0FBbUI7WUFDekIsZ0JBQVcsR0FBWCxXQUFXLENBQW9CO1lBQy9CLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDYixhQUFRLEdBQVIsUUFBUSxDQUFLO1lBQ2IsaUJBQVksR0FBWixZQUFZLENBQXNC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