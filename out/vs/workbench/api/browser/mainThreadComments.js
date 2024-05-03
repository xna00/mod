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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/core/range", "vs/platform/registry/common/platform", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/commentsView", "../common/extHost.protocol", "vs/workbench/contrib/comments/browser/commentsTreeViewer", "vs/workbench/common/views", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/nls", "vs/base/common/network", "vs/workbench/services/views/common/viewsService"], function (require, exports, event_1, lifecycle_1, uri_1, range_1, platform_1, extHostCustomers_1, commentService_1, commentsView_1, extHost_protocol_1, commentsTreeViewer_1, views_1, descriptors_1, viewPaneContainer_1, codicons_1, iconRegistry_1, nls_1, network_1, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadComments = exports.MainThreadCommentController = exports.MainThreadCommentThread = void 0;
    class MainThreadCommentThread {
        get input() {
            return this._input;
        }
        set input(value) {
            this._input = value;
            this._onDidChangeInput.fire(value);
        }
        get onDidChangeInput() { return this._onDidChangeInput.event; }
        get label() {
            return this._label;
        }
        set label(label) {
            this._label = label;
            this._onDidChangeLabel.fire(this._label);
        }
        get contextValue() {
            return this._contextValue;
        }
        set contextValue(context) {
            this._contextValue = context;
        }
        get comments() {
            return this._comments;
        }
        set comments(newComments) {
            this._comments = newComments;
            this._onDidChangeComments.fire(this._comments);
        }
        get onDidChangeComments() { return this._onDidChangeComments.event; }
        set range(range) {
            this._range = range;
            this._onDidChangeRange.fire(this._range);
        }
        get range() {
            return this._range;
        }
        get onDidChangeCanReply() { return this._onDidChangeCanReply.event; }
        set canReply(state) {
            this._canReply = state;
            this._onDidChangeCanReply.fire(this._canReply);
        }
        get canReply() {
            return this._canReply;
        }
        get collapsibleState() {
            return this._collapsibleState;
        }
        set collapsibleState(newState) {
            this._collapsibleState = newState;
            this._onDidChangeCollapsibleState.fire(this._collapsibleState);
        }
        get initialCollapsibleState() {
            return this._initialCollapsibleState;
        }
        set initialCollapsibleState(initialCollapsibleState) {
            this._initialCollapsibleState = initialCollapsibleState;
            if (this.collapsibleState === undefined) {
                this.collapsibleState = this.initialCollapsibleState;
            }
            this._onDidChangeInitialCollapsibleState.fire(initialCollapsibleState);
        }
        get isDisposed() {
            return this._isDisposed;
        }
        isDocumentCommentThread() {
            return this._range === undefined || range_1.Range.isIRange(this._range);
        }
        get state() {
            return this._state;
        }
        set state(newState) {
            this._state = newState;
            this._onDidChangeState.fire(this._state);
        }
        get applicability() {
            return this._applicability;
        }
        set applicability(value) {
            this._applicability = value;
            this._onDidChangeApplicability.fire(value);
        }
        get isTemplate() {
            return this._isTemplate;
        }
        constructor(commentThreadHandle, controllerHandle, extensionId, threadId, resource, _range, _canReply, _isTemplate) {
            this.commentThreadHandle = commentThreadHandle;
            this.controllerHandle = controllerHandle;
            this.extensionId = extensionId;
            this.threadId = threadId;
            this.resource = resource;
            this._range = _range;
            this._canReply = _canReply;
            this._isTemplate = _isTemplate;
            this._onDidChangeInput = new event_1.Emitter();
            this._onDidChangeLabel = new event_1.Emitter();
            this.onDidChangeLabel = this._onDidChangeLabel.event;
            this._onDidChangeComments = new event_1.Emitter();
            this._onDidChangeCanReply = new event_1.Emitter();
            this._onDidChangeRange = new event_1.Emitter();
            this.onDidChangeRange = this._onDidChangeRange.event;
            this._onDidChangeCollapsibleState = new event_1.Emitter();
            this.onDidChangeCollapsibleState = this._onDidChangeCollapsibleState.event;
            this._onDidChangeInitialCollapsibleState = new event_1.Emitter();
            this.onDidChangeInitialCollapsibleState = this._onDidChangeInitialCollapsibleState.event;
            this._onDidChangeApplicability = new event_1.Emitter();
            this.onDidChangeApplicability = this._onDidChangeApplicability.event;
            this._onDidChangeState = new event_1.Emitter();
            this.onDidChangeState = this._onDidChangeState.event;
            this._isDisposed = false;
            if (_isTemplate) {
                this.comments = [];
            }
        }
        batchUpdate(changes) {
            const modified = (value) => Object.prototype.hasOwnProperty.call(changes, value);
            if (modified('range')) {
                this._range = changes.range;
            }
            if (modified('label')) {
                this._label = changes.label;
            }
            if (modified('contextValue')) {
                this._contextValue = changes.contextValue === null ? undefined : changes.contextValue;
            }
            if (modified('comments')) {
                this._comments = changes.comments;
            }
            if (modified('collapseState')) {
                this.initialCollapsibleState = changes.collapseState;
            }
            if (modified('canReply')) {
                this.canReply = changes.canReply;
            }
            if (modified('state')) {
                this.state = changes.state;
            }
            if (modified('applicability')) {
                this.applicability = changes.applicability;
            }
            if (modified('isTemplate')) {
                this._isTemplate = changes.isTemplate;
            }
        }
        dispose() {
            this._isDisposed = true;
            this._onDidChangeCollapsibleState.dispose();
            this._onDidChangeComments.dispose();
            this._onDidChangeInput.dispose();
            this._onDidChangeLabel.dispose();
            this._onDidChangeRange.dispose();
            this._onDidChangeState.dispose();
        }
        toJSON() {
            return {
                $mid: 7 /* MarshalledId.CommentThread */,
                commentControlHandle: this.controllerHandle,
                commentThreadHandle: this.commentThreadHandle,
            };
        }
    }
    exports.MainThreadCommentThread = MainThreadCommentThread;
    class MainThreadCommentController {
        get handle() {
            return this._handle;
        }
        get id() {
            return this._id;
        }
        get contextValue() {
            return this._id;
        }
        get proxy() {
            return this._proxy;
        }
        get label() {
            return this._label;
        }
        get reactions() {
            return this._reactions;
        }
        set reactions(reactions) {
            this._reactions = reactions;
        }
        get options() {
            return this._features.options;
        }
        get features() {
            return this._features;
        }
        get owner() {
            return this._id;
        }
        constructor(_proxy, _commentService, _handle, _uniqueId, _id, _label, _features) {
            this._proxy = _proxy;
            this._commentService = _commentService;
            this._handle = _handle;
            this._uniqueId = _uniqueId;
            this._id = _id;
            this._label = _label;
            this._features = _features;
            this._threads = new Map();
        }
        async setActiveCommentAndThread(commentInfo) {
            return this._proxy.$setActiveComment(this._handle, commentInfo ? { commentThreadHandle: commentInfo.thread.commentThreadHandle, uniqueIdInThread: commentInfo.comment?.uniqueIdInThread } : undefined);
        }
        updateFeatures(features) {
            this._features = features;
        }
        createCommentThread(extensionId, commentThreadHandle, threadId, resource, range, isTemplate) {
            const thread = new MainThreadCommentThread(commentThreadHandle, this.handle, extensionId, threadId, uri_1.URI.revive(resource).toString(), range, true, isTemplate);
            this._threads.set(commentThreadHandle, thread);
            if (thread.isDocumentCommentThread()) {
                this._commentService.updateComments(this._uniqueId, {
                    added: [thread],
                    removed: [],
                    changed: [],
                    pending: []
                });
            }
            else {
                this._commentService.updateNotebookComments(this._uniqueId, {
                    added: [thread],
                    removed: [],
                    changed: [],
                    pending: []
                });
            }
            return thread;
        }
        updateCommentThread(commentThreadHandle, threadId, resource, changes) {
            const thread = this.getKnownThread(commentThreadHandle);
            thread.batchUpdate(changes);
            if (thread.isDocumentCommentThread()) {
                this._commentService.updateComments(this._uniqueId, {
                    added: [],
                    removed: [],
                    changed: [thread],
                    pending: []
                });
            }
            else {
                this._commentService.updateNotebookComments(this._uniqueId, {
                    added: [],
                    removed: [],
                    changed: [thread],
                    pending: []
                });
            }
        }
        deleteCommentThread(commentThreadHandle) {
            const thread = this.getKnownThread(commentThreadHandle);
            this._threads.delete(commentThreadHandle);
            thread.dispose();
            if (thread.isDocumentCommentThread()) {
                this._commentService.updateComments(this._uniqueId, {
                    added: [],
                    removed: [thread],
                    changed: [],
                    pending: []
                });
            }
            else {
                this._commentService.updateNotebookComments(this._uniqueId, {
                    added: [],
                    removed: [thread],
                    changed: [],
                    pending: []
                });
            }
        }
        deleteCommentThreadMain(commentThreadId) {
            this._threads.forEach(thread => {
                if (thread.threadId === commentThreadId) {
                    this._proxy.$deleteCommentThread(this._handle, thread.commentThreadHandle);
                }
            });
        }
        updateInput(input) {
            const thread = this.activeEditingCommentThread;
            if (thread && thread.input) {
                const commentInput = thread.input;
                commentInput.value = input;
                thread.input = commentInput;
            }
        }
        updateCommentingRanges(resourceHints) {
            this._commentService.updateCommentingRanges(this._uniqueId, resourceHints);
        }
        getKnownThread(commentThreadHandle) {
            const thread = this._threads.get(commentThreadHandle);
            if (!thread) {
                throw new Error('unknown thread');
            }
            return thread;
        }
        async getDocumentComments(resource, token) {
            if (resource.scheme === network_1.Schemas.vscodeNotebookCell) {
                return {
                    uniqueOwner: this._uniqueId,
                    label: this.label,
                    threads: [],
                    commentingRanges: {
                        resource: resource,
                        ranges: [],
                        fileComments: false
                    }
                };
            }
            const ret = [];
            for (const thread of [...this._threads.keys()]) {
                const commentThread = this._threads.get(thread);
                if (commentThread.resource === resource.toString()) {
                    ret.push(commentThread);
                }
            }
            const commentingRanges = await this._proxy.$provideCommentingRanges(this.handle, resource, token);
            return {
                uniqueOwner: this._uniqueId,
                label: this.label,
                threads: ret,
                commentingRanges: {
                    resource: resource,
                    ranges: commentingRanges?.ranges || [],
                    fileComments: commentingRanges?.fileComments
                }
            };
        }
        async getNotebookComments(resource, token) {
            if (resource.scheme !== network_1.Schemas.vscodeNotebookCell) {
                return {
                    uniqueOwner: this._uniqueId,
                    label: this.label,
                    threads: []
                };
            }
            const ret = [];
            for (const thread of [...this._threads.keys()]) {
                const commentThread = this._threads.get(thread);
                if (commentThread.resource === resource.toString()) {
                    ret.push(commentThread);
                }
            }
            return {
                uniqueOwner: this._uniqueId,
                label: this.label,
                threads: ret
            };
        }
        async toggleReaction(uri, thread, comment, reaction, token) {
            return this._proxy.$toggleReaction(this._handle, thread.commentThreadHandle, uri, comment, reaction);
        }
        getAllComments() {
            const ret = [];
            for (const thread of [...this._threads.keys()]) {
                ret.push(this._threads.get(thread));
            }
            return ret;
        }
        createCommentThreadTemplate(resource, range) {
            return this._proxy.$createCommentThreadTemplate(this.handle, resource, range);
        }
        async updateCommentThreadTemplate(threadHandle, range) {
            await this._proxy.$updateCommentThreadTemplate(this.handle, threadHandle, range);
        }
        toJSON() {
            return {
                $mid: 6 /* MarshalledId.CommentController */,
                handle: this.handle
            };
        }
    }
    exports.MainThreadCommentController = MainThreadCommentController;
    const commentsViewIcon = (0, iconRegistry_1.registerIcon)('comments-view-icon', codicons_1.Codicon.commentDiscussion, (0, nls_1.localize)('commentsViewIcon', 'View icon of the comments view.'));
    let MainThreadComments = class MainThreadComments extends lifecycle_1.Disposable {
        constructor(extHostContext, _commentService, _viewsService, _viewDescriptorService) {
            super();
            this._commentService = _commentService;
            this._viewsService = _viewsService;
            this._viewDescriptorService = _viewDescriptorService;
            this._handlers = new Map();
            this._commentControllers = new Map();
            this._activeEditingCommentThreadDisposables = this._register(new lifecycle_1.DisposableStore());
            this._openViewListener = null;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostComments);
            this._commentService.unregisterCommentController();
            this._register(this._commentService.onDidChangeActiveEditingCommentThread(async (thread) => {
                const handle = thread.controllerHandle;
                const controller = this._commentControllers.get(handle);
                if (!controller) {
                    return;
                }
                this._activeEditingCommentThreadDisposables.clear();
                this._activeEditingCommentThread = thread;
                controller.activeEditingCommentThread = this._activeEditingCommentThread;
            }));
        }
        $registerCommentController(handle, id, label, extensionId) {
            const providerId = `${id}-${extensionId}`;
            this._handlers.set(handle, providerId);
            const provider = new MainThreadCommentController(this._proxy, this._commentService, handle, providerId, id, label, {});
            this._commentService.registerCommentController(providerId, provider);
            this._commentControllers.set(handle, provider);
            const commentsPanelAlreadyConstructed = !!this._viewDescriptorService.getViewDescriptorById(commentsTreeViewer_1.COMMENTS_VIEW_ID);
            if (!commentsPanelAlreadyConstructed) {
                this.registerView(commentsPanelAlreadyConstructed);
            }
            this.registerViewListeners(commentsPanelAlreadyConstructed);
            this._commentService.setWorkspaceComments(String(handle), []);
        }
        $unregisterCommentController(handle) {
            const providerId = this._handlers.get(handle);
            this._handlers.delete(handle);
            this._commentControllers.delete(handle);
            if (typeof providerId !== 'string') {
                return;
                // throw new Error('unknown handler');
            }
            else {
                this._commentService.unregisterCommentController(providerId);
            }
        }
        $updateCommentControllerFeatures(handle, features) {
            const provider = this._commentControllers.get(handle);
            if (!provider) {
                return undefined;
            }
            provider.updateFeatures(features);
        }
        $createCommentThread(handle, commentThreadHandle, threadId, resource, range, extensionId, isTemplate) {
            const provider = this._commentControllers.get(handle);
            if (!provider) {
                return undefined;
            }
            return provider.createCommentThread(extensionId.value, commentThreadHandle, threadId, resource, range, isTemplate);
        }
        $updateCommentThread(handle, commentThreadHandle, threadId, resource, changes) {
            const provider = this._commentControllers.get(handle);
            if (!provider) {
                return undefined;
            }
            return provider.updateCommentThread(commentThreadHandle, threadId, resource, changes);
        }
        $deleteCommentThread(handle, commentThreadHandle) {
            const provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            return provider.deleteCommentThread(commentThreadHandle);
        }
        $updateCommentingRanges(handle, resourceHints) {
            const provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            provider.updateCommentingRanges(resourceHints);
        }
        registerView(commentsViewAlreadyRegistered) {
            if (!commentsViewAlreadyRegistered) {
                const VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                    id: commentsTreeViewer_1.COMMENTS_VIEW_ID,
                    title: commentsTreeViewer_1.COMMENTS_VIEW_TITLE,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [commentsTreeViewer_1.COMMENTS_VIEW_ID, { mergeViewWithContainerWhenSingleView: true }]),
                    storageId: commentsTreeViewer_1.COMMENTS_VIEW_STORAGE_ID,
                    hideIfEmpty: true,
                    icon: commentsViewIcon,
                    order: 10,
                }, 1 /* ViewContainerLocation.Panel */);
                platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
                        id: commentsTreeViewer_1.COMMENTS_VIEW_ID,
                        name: commentsTreeViewer_1.COMMENTS_VIEW_TITLE,
                        canToggleVisibility: false,
                        ctorDescriptor: new descriptors_1.SyncDescriptor(commentsView_1.CommentsPanel),
                        canMoveView: true,
                        containerIcon: commentsViewIcon,
                        focusCommand: {
                            id: 'workbench.action.focusCommentsPanel'
                        }
                    }], VIEW_CONTAINER);
            }
        }
        setComments() {
            [...this._commentControllers.keys()].forEach(handle => {
                const threads = this._commentControllers.get(handle).getAllComments();
                if (threads.length) {
                    const providerId = this.getHandler(handle);
                    this._commentService.setWorkspaceComments(providerId, threads);
                }
            });
        }
        registerViewOpenedListener() {
            if (!this._openViewListener) {
                this._openViewListener = this._viewsService.onDidChangeViewVisibility(e => {
                    if (e.id === commentsTreeViewer_1.COMMENTS_VIEW_ID && e.visible) {
                        this.setComments();
                        if (this._openViewListener) {
                            this._openViewListener.dispose();
                            this._openViewListener = null;
                        }
                    }
                });
            }
        }
        /**
         * If the comments view has never been opened, the constructor for it has not yet run so it has
         * no listeners for comment threads being set or updated. Listen for the view opening for the
         * first time and send it comments then.
         */
        registerViewListeners(commentsPanelAlreadyConstructed) {
            if (!commentsPanelAlreadyConstructed) {
                this.registerViewOpenedListener();
            }
            this._register(this._viewDescriptorService.onDidChangeContainer(e => {
                if (e.views.find(view => view.id === commentsTreeViewer_1.COMMENTS_VIEW_ID)) {
                    this.setComments();
                    this.registerViewOpenedListener();
                }
            }));
            this._register(this._viewDescriptorService.onDidChangeContainerLocation(e => {
                const commentsContainer = this._viewDescriptorService.getViewContainerByViewId(commentsTreeViewer_1.COMMENTS_VIEW_ID);
                if (e.viewContainer.id === commentsContainer?.id) {
                    this.setComments();
                    this.registerViewOpenedListener();
                }
            }));
        }
        getHandler(handle) {
            if (!this._handlers.has(handle)) {
                throw new Error('Unknown handler');
            }
            return this._handlers.get(handle);
        }
    };
    exports.MainThreadComments = MainThreadComments;
    exports.MainThreadComments = MainThreadComments = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadComments),
        __param(1, commentService_1.ICommentService),
        __param(2, viewsService_1.IViewsService),
        __param(3, views_1.IViewDescriptorService)
    ], MainThreadComments);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENvbW1lbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZENvbW1lbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJCaEcsTUFBYSx1QkFBdUI7UUFFbkMsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxJQUFJLEtBQUssQ0FBQyxLQUF5QztZQUNsRCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFHRCxJQUFJLGdCQUFnQixLQUFnRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBSTFHLElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRUQsSUFBSSxLQUFLLENBQUMsS0FBeUI7WUFDbEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUlELElBQUksWUFBWTtZQUNmLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFBSSxZQUFZLENBQUMsT0FBMkI7WUFDM0MsSUFBSSxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUM7UUFDOUIsQ0FBQztRQU9ELElBQVcsUUFBUTtZQUNsQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDdkIsQ0FBQztRQUVELElBQVcsUUFBUSxDQUFDLFdB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