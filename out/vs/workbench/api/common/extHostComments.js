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
define(["require", "exports", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/languages", "vs/platform/extensions/common/extensions", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "./extHost.protocol", "vs/workbench/services/extensions/common/extensions"], function (require, exports, async_1, decorators_1, event_1, lifecycle_1, uri_1, languages, extensions_1, extHostTypeConverter, types, extHost_protocol_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createExtHostComments = createExtHostComments;
    function createExtHostComments(mainContext, commands, documents) {
        const proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadComments);
        class ExtHostCommentsImpl {
            static { this.handlePool = 0; }
            constructor() {
                this._commentControllers = new Map();
                this._commentControllersByExtension = new extensions_1.ExtensionIdentifierMap();
                commands.registerArgumentProcessor({
                    processArgument: arg => {
                        if (arg && arg.$mid === 6 /* MarshalledId.CommentController */) {
                            const commentController = this._commentControllers.get(arg.handle);
                            if (!commentController) {
                                return arg;
                            }
                            return commentController.value;
                        }
                        else if (arg && arg.$mid === 7 /* MarshalledId.CommentThread */) {
                            const marshalledCommentThread = arg;
                            const commentController = this._commentControllers.get(marshalledCommentThread.commentControlHandle);
                            if (!commentController) {
                                return marshalledCommentThread;
                            }
                            const commentThread = commentController.getCommentThread(marshalledCommentThread.commentThreadHandle);
                            if (!commentThread) {
                                return marshalledCommentThread;
                            }
                            return commentThread.value;
                        }
                        else if (arg && (arg.$mid === 9 /* MarshalledId.CommentThreadReply */ || arg.$mid === 8 /* MarshalledId.CommentThreadInstance */)) {
                            const commentController = this._commentControllers.get(arg.thread.commentControlHandle);
                            if (!commentController) {
                                return arg;
                            }
                            const commentThread = commentController.getCommentThread(arg.thread.commentThreadHandle);
                            if (!commentThread) {
                                return arg;
                            }
                            if (arg.$mid === 8 /* MarshalledId.CommentThreadInstance */) {
                                return commentThread.value;
                            }
                            return {
                                thread: commentThread.value,
                                text: arg.text
                            };
                        }
                        else if (arg && arg.$mid === 10 /* MarshalledId.CommentNode */) {
                            const commentController = this._commentControllers.get(arg.thread.commentControlHandle);
                            if (!commentController) {
                                return arg;
                            }
                            const commentThread = commentController.getCommentThread(arg.thread.commentThreadHandle);
                            if (!commentThread) {
                                return arg;
                            }
                            const commentUniqueId = arg.commentUniqueId;
                            const comment = commentThread.getCommentByUniqueId(commentUniqueId);
                            if (!comment) {
                                return arg;
                            }
                            return comment;
                        }
                        else if (arg && arg.$mid === 11 /* MarshalledId.CommentThreadNode */) {
                            const commentController = this._commentControllers.get(arg.thread.commentControlHandle);
                            if (!commentController) {
                                return arg;
                            }
                            const commentThread = commentController.getCommentThread(arg.thread.commentThreadHandle);
                            if (!commentThread) {
                                return arg;
                            }
                            const body = arg.text;
                            const commentUniqueId = arg.commentUniqueId;
                            const comment = commentThread.getCommentByUniqueId(commentUniqueId);
                            if (!comment) {
                                return arg;
                            }
                            // If the old comment body was a markdown string, use a markdown string here too.
                            if (typeof comment.body === 'string') {
                                comment.body = body;
                            }
                            else {
                                comment.body = new types.MarkdownString(body);
                            }
                            return comment;
                        }
                        return arg;
                    }
                });
            }
            createCommentController(extension, id, label) {
                const handle = ExtHostCommentsImpl.handlePool++;
                const commentController = new ExtHostCommentController(extension, handle, id, label);
                this._commentControllers.set(commentController.handle, commentController);
                const commentControllers = this._commentControllersByExtension.get(extension.identifier) || [];
                commentControllers.push(commentController);
                this._commentControllersByExtension.set(extension.identifier, commentControllers);
                return commentController.value;
            }
            async $createCommentThreadTemplate(commentControllerHandle, uriComponents, range) {
                const commentController = this._commentControllers.get(commentControllerHandle);
                if (!commentController) {
                    return;
                }
                commentController.$createCommentThreadTemplate(uriComponents, range);
            }
            async $setActiveComment(controllerHandle, commentInfo) {
                const commentController = this._commentControllers.get(controllerHandle);
                if (!commentController) {
                    return;
                }
                commentController.$setActiveComment(commentInfo ?? undefined);
            }
            async $updateCommentThreadTemplate(commentControllerHandle, threadHandle, range) {
                const commentController = this._commentControllers.get(commentControllerHandle);
                if (!commentController) {
                    return;
                }
                commentController.$updateCommentThreadTemplate(threadHandle, range);
            }
            $deleteCommentThread(commentControllerHandle, commentThreadHandle) {
                const commentController = this._commentControllers.get(commentControllerHandle);
                commentController?.$deleteCommentThread(commentThreadHandle);
            }
            async $provideCommentingRanges(commentControllerHandle, uriComponents, token) {
                const commentController = this._commentControllers.get(commentControllerHandle);
                if (!commentController || !commentController.commentingRangeProvider) {
                    return Promise.resolve(undefined);
                }
                const document = await documents.ensureDocumentData(uri_1.URI.revive(uriComponents));
                return (0, async_1.asPromise)(async () => {
                    const rangesResult = await commentController.commentingRangeProvider.provideCommentingRanges(document.document, token);
                    let ranges;
                    if (Array.isArray(rangesResult)) {
                        ranges = {
                            ranges: rangesResult,
                            fileComments: false
                        };
                    }
                    else if (rangesResult) {
                        ranges = {
                            ranges: rangesResult.ranges || [],
                            fileComments: rangesResult.fileComments || false
                        };
                    }
                    else {
                        ranges = rangesResult ?? undefined;
                    }
                    return ranges;
                }).then(ranges => {
                    let convertedResult = undefined;
                    if (ranges) {
                        convertedResult = {
                            ranges: ranges.ranges.map(x => extHostTypeConverter.Range.from(x)),
                            fileComments: ranges.fileComments
                        };
                    }
                    return convertedResult;
                });
            }
            $toggleReaction(commentControllerHandle, threadHandle, uri, comment, reaction) {
                const commentController = this._commentControllers.get(commentControllerHandle);
                if (!commentController || !commentController.reactionHandler) {
                    return Promise.resolve(undefined);
                }
                return (0, async_1.asPromise)(() => {
                    const commentThread = commentController.getCommentThread(threadHandle);
                    if (commentThread) {
                        const vscodeComment = commentThread.getCommentByUniqueId(comment.uniqueIdInThread);
                        if (commentController !== undefined && vscodeComment) {
                            if (commentController.reactionHandler) {
                                return commentController.reactionHandler(vscodeComment, convertFromReaction(reaction));
                            }
                        }
                    }
                    return Promise.resolve(undefined);
                });
            }
        }
        class ExtHostCommentThread {
            static { this._handlePool = 0; }
            set threadId(id) {
                this._id = id;
            }
            get threadId() {
                return this._id;
            }
            get id() {
                return this._id;
            }
            get resource() {
                return this._uri;
            }
            get uri() {
                return this._uri;
            }
            set range(range) {
                if (((range === undefined) !== (this._range === undefined)) || (!range || !this._range || !range.isEqual(this._range))) {
                    this._range = range;
                    this.modifications.range = range;
                    this._onDidUpdateCommentThread.fire();
                }
            }
            get range() {
                return this._range;
            }
            set canReply(state) {
                if (this._canReply !== state) {
                    this._canReply = state;
                    this.modifications.canReply = state;
                    this._onDidUpdateCommentThread.fire();
                }
            }
            get canReply() {
                return this._canReply;
            }
            get label() {
                return this._label;
            }
            set label(label) {
                this._label = label;
                this.modifications.label = label;
                this._onDidUpdateCommentThread.fire();
            }
            get contextValue() {
                return this._contextValue;
            }
            set contextValue(context) {
                this._contextValue = context;
                this.modifications.contextValue = context;
                this._onDidUpdateCommentThread.fire();
            }
            get comments() {
                return this._comments;
            }
            set comments(newComments) {
                this._comments = newComments;
                this.modifications.comments = newComments;
                this._onDidUpdateCommentThread.fire();
            }
            get collapsibleState() {
                return this._collapseState;
            }
            set collapsibleState(newState) {
                this._collapseState = newState;
                this.modifications.collapsibleState = newState;
                this._onDidUpdateCommentThread.fire();
            }
            get state() {
                return this._state;
            }
            set state(newState) {
                this._state = newState;
                if (typeof newState === 'object') {
                    (0, extensions_2.checkProposedApiEnabled)(this.extensionDescription, 'commentThreadApplicability');
                    this.modifications.state = newState.resolved;
                    this.modifications.applicability = newState.applicability;
                }
                else {
                    this.modifications.state = newState;
                }
                this._onDidUpdateCommentThread.fire();
            }
            get isDisposed() {
                return this._isDiposed;
            }
            constructor(commentControllerId, _commentControllerHandle, _id, _uri, _range, _comments, extensionDescription, _isTemplate) {
                this._commentControllerHandle = _commentControllerHandle;
                this._id = _id;
                this._uri = _uri;
                this._range = _range;
                this._comments = _comments;
                this.extensionDescription = extensionDescription;
                this._isTemplate = _isTemplate;
                this.handle = ExtHostCommentThread._handlePool++;
                this.commentHandle = 0;
                this.modifications = Object.create(null);
                this._onDidUpdateCommentThread = new event_1.Emitter();
                this.onDidUpdateCommentThread = this._onDidUpdateCommentThread.event;
                this._canReply = true;
                this._commentsMap = new Map();
                this._acceptInputDisposables = new lifecycle_1.MutableDisposable();
                this._acceptInputDisposables.value = new lifecycle_1.DisposableStore();
                if (this._id === undefined) {
                    this._id = `${commentControllerId}.${this.handle}`;
                }
                proxy.$createCommentThread(_commentControllerHandle, this.handle, this._id, this._uri, extHostTypeConverter.Range.from(this._range), extensionDescription.identifier, this._isTemplate);
                this._localDisposables = [];
                this._isDiposed = false;
                this._localDisposables.push(this.onDidUpdateCommentThread(() => {
                    this.eventuallyUpdateCommentThread();
                }));
                // set up comments after ctor to batch update events.
                this.comments = _comments;
                this._localDisposables.push({
                    dispose: () => {
                        proxy.$deleteCommentThread(_commentControllerHandle, this.handle);
                    }
                });
                const that = this;
                this.value = {
                    get uri() { return that.uri; },
                    get range() { return that.range; },
                    set range(value) { that.range = value; },
                    get comments() { return that.comments; },
                    set comments(value) { that.comments = value; },
                    get collapsibleState() { return that.collapsibleState; },
                    set collapsibleState(value) { that.collapsibleState = value; },
                    get canReply() { return that.canReply; },
                    set canReply(state) { that.canReply = state; },
                    get contextValue() { return that.contextValue; },
                    set contextValue(value) { that.contextValue = value; },
                    get label() { return that.label; },
                    set label(value) { that.label = value; },
                    get state() { return that.state; },
                    set state(value) { that.state = value; },
                    dispose: () => {
                        that.dispose();
                    }
                };
            }
            updateIsTemplate() {
                if (this._isTemplate) {
                    this._isTemplate = false;
                    this.modifications.isTemplate = false;
                }
            }
            eventuallyUpdateCommentThread() {
                if (this._isDiposed) {
                    return;
                }
                this.updateIsTemplate();
                if (!this._acceptInputDisposables.value) {
                    this._acceptInputDisposables.value = new lifecycle_1.DisposableStore();
                }
                const modified = (value) => Object.prototype.hasOwnProperty.call(this.modifications, value);
                const formattedModifications = {};
                if (modified('range')) {
                    formattedModifications.range = extHostTypeConverter.Range.from(this._range);
                }
                if (modified('label')) {
                    formattedModifications.label = this.label;
                }
                if (modified('contextValue')) {
                    /*
                     * null -> cleared contextValue
                     * undefined -> no change
                     */
                    formattedModifications.contextValue = this.contextValue ?? null;
                }
                if (modified('comments')) {
                    formattedModifications.comments =
                        this._comments.map(cmt => convertToDTOComment(this, cmt, this._commentsMap, this.extensionDescription));
                }
                if (modified('collapsibleState')) {
                    formattedModifications.collapseState = convertToCollapsibleState(this._collapseState);
                }
                if (modified('canReply')) {
                    formattedModifications.canReply = this.canReply;
                }
                if (modified('state')) {
                    formattedModifications.state = convertToState(this._state);
                }
                if (modified('applicability')) {
                    formattedModifications.applicability = convertToRelevance(this._state);
                }
                if (modified('isTemplate')) {
                    formattedModifications.isTemplate = this._isTemplate;
                }
                this.modifications = {};
                proxy.$updateCommentThread(this._commentControllerHandle, this.handle, this._id, this._uri, formattedModifications);
            }
            getCommentByUniqueId(uniqueId) {
                for (const key of this._commentsMap) {
                    const comment = key[0];
                    const id = key[1];
                    if (uniqueId === id) {
                        return comment;
                    }
                }
                return;
            }
            dispose() {
                this._isDiposed = true;
                this._acceptInputDisposables.dispose();
                this._localDisposables.forEach(disposable => disposable.dispose());
            }
        }
        __decorate([
            (0, decorators_1.debounce)(100)
        ], ExtHostCommentThread.prototype, "eventuallyUpdateCommentThread", null);
        class ExtHostCommentController {
            get id() {
                return this._id;
            }
            get label() {
                return this._label;
            }
            get handle() {
                return this._handle;
            }
            get commentingRangeProvider() {
                return this._commentingRangeProvider;
            }
            set commentingRangeProvider(provider) {
                this._commentingRangeProvider = provider;
                if (provider?.resourceHints) {
                    (0, extensions_2.checkProposedApiEnabled)(this._extension, 'commentingRangeHint');
                }
                proxy.$updateCommentingRanges(this.handle, provider?.resourceHints);
            }
            get reactionHandler() {
                return this._reactionHandler;
            }
            set reactionHandler(handler) {
                this._reactionHandler = handler;
                proxy.$updateCommentControllerFeatures(this.handle, { reactionHandler: !!handler });
            }
            get options() {
                return this._options;
            }
            set options(options) {
                this._options = options;
                proxy.$updateCommentControllerFeatures(this.handle, { options: this._options });
            }
            get activeComment() {
                (0, extensions_2.checkProposedApiEnabled)(this._extension, 'activeComment');
                return this._activeComment;
            }
            get activeCommentThread() {
                (0, extensions_2.checkProposedApiEnabled)(this._extension, 'activeComment');
                return this._activeThread;
            }
            constructor(_extension, _handle, _id, _label) {
                this._extension = _extension;
                this._handle = _handle;
                this._id = _id;
                this._label = _label;
                this._threads = new Map();
                proxy.$registerCommentController(this.handle, _id, _label, this._extension.identifier.value);
                const that = this;
                this.value = Object.freeze({
                    id: that.id,
                    label: that.label,
                    get options() { return that.options; },
                    set options(options) { that.options = options; },
                    get commentingRangeProvider() { return that.commentingRangeProvider; },
                    set commentingRangeProvider(commentingRangeProvider) { that.commentingRangeProvider = commentingRangeProvider; },
                    get reactionHandler() { return that.reactionHandler; },
                    set reactionHandler(handler) { that.reactionHandler = handler; },
                    // get activeComment(): vscode.Comment | undefined { return that.activeComment; },
                    get activeCommentThread() { return that.activeCommentThread; },
                    createCommentThread(uri, range, comments) {
                        return that.createCommentThread(uri, range, comments).value;
                    },
                    dispose: () => { that.dispose(); },
                }); // TODO @alexr00 remove this cast when the proposed API is stable
                this._localDisposables = [];
                this._localDisposables.push({
                    dispose: () => {
                        proxy.$unregisterCommentController(this.handle);
                    }
                });
            }
            createCommentThread(resource, range, comments) {
                if (range === undefined) {
                    (0, extensions_2.checkProposedApiEnabled)(this._extension, 'fileComments');
                }
                const commentThread = new ExtHostCommentThread(this.id, this.handle, undefined, resource, range, comments, this._extension, false);
                this._threads.set(commentThread.handle, commentThread);
                return commentThread;
            }
            $setActiveComment(commentInfo) {
                if (!commentInfo) {
                    this._activeComment = undefined;
                    this._activeThread = undefined;
                    return;
                }
                const thread = this._threads.get(commentInfo.commentThreadHandle);
                if (thread) {
                    this._activeComment = commentInfo.uniqueIdInThread ? thread.getCommentByUniqueId(commentInfo.uniqueIdInThread) : undefined;
                    this._activeThread = thread;
                }
            }
            $createCommentThreadTemplate(uriComponents, range) {
                const commentThread = new ExtHostCommentThread(this.id, this.handle, undefined, uri_1.URI.revive(uriComponents), extHostTypeConverter.Range.to(range), [], this._extension, true);
                commentThread.collapsibleState = languages.CommentThreadCollapsibleState.Expanded;
                this._threads.set(commentThread.handle, commentThread);
                return commentThread;
            }
            $updateCommentThreadTemplate(threadHandle, range) {
                const thread = this._threads.get(threadHandle);
                if (thread) {
                    thread.range = extHostTypeConverter.Range.to(range);
                }
            }
            $deleteCommentThread(threadHandle) {
                const thread = this._threads.get(threadHandle);
                thread?.dispose();
                this._threads.delete(threadHandle);
            }
            getCommentThread(handle) {
                return this._threads.get(handle);
            }
            dispose() {
                this._threads.forEach(value => {
                    value.dispose();
                });
                this._localDisposables.forEach(disposable => disposable.dispose());
            }
        }
        function convertToDTOComment(thread, vscodeComment, commentsMap, extension) {
            let commentUniqueId = commentsMap.get(vscodeComment);
            if (!commentUniqueId) {
                commentUniqueId = ++thread.commentHandle;
                commentsMap.set(vscodeComment, commentUniqueId);
            }
            if (vscodeComment.state !== undefined) {
                (0, extensions_2.checkProposedApiEnabled)(extension, 'commentsDraftState');
            }
            if (vscodeComment.reactions?.some(reaction => reaction.reactors !== undefined)) {
                (0, extensions_2.checkProposedApiEnabled)(extension, 'commentReactor');
            }
            return {
                mode: vscodeComment.mode,
                contextValue: vscodeComment.contextValue,
                uniqueIdInThread: commentUniqueId,
                body: (typeof vscodeComment.body === 'string') ? vscodeComment.body : extHostTypeConverter.MarkdownString.from(vscodeComment.body),
                userName: vscodeComment.author.name,
                userIconPath: vscodeComment.author.iconPath,
                label: vscodeComment.label,
                commentReactions: vscodeComment.reactions ? vscodeComment.reactions.map(reaction => convertToReaction(reaction)) : undefined,
                state: vscodeComment.state,
                timestamp: vscodeComment.timestamp?.toJSON()
            };
        }
        function convertToReaction(reaction) {
            return {
                label: reaction.label,
                iconPath: reaction.iconPath ? extHostTypeConverter.pathOrURIToURI(reaction.iconPath) : undefined,
                count: reaction.count,
                hasReacted: reaction.authorHasReacted,
                reactors: ((reaction.reactors && (reaction.reactors.length > 0) && (typeof reaction.reactors[0] !== 'string')) ? reaction.reactors.map(reactor => reactor.name) : reaction.reactors)
            };
        }
        function convertFromReaction(reaction) {
            return {
                label: reaction.label || '',
                count: reaction.count || 0,
                iconPath: reaction.iconPath ? uri_1.URI.revive(reaction.iconPath) : '',
                authorHasReacted: reaction.hasReacted || false,
                reactors: reaction.reactors?.map(reactor => ({ name: reactor }))
            };
        }
        function convertToCollapsibleState(kind) {
            if (kind !== undefined) {
                switch (kind) {
                    case types.CommentThreadCollapsibleState.Expanded:
                        return languages.CommentThreadCollapsibleState.Expanded;
                    case types.CommentThreadCollapsibleState.Collapsed:
                        return languages.CommentThreadCollapsibleState.Collapsed;
                }
            }
            return languages.CommentThreadCollapsibleState.Collapsed;
        }
        function convertToState(kind) {
            let resolvedKind;
            if (typeof kind === 'object') {
                resolvedKind = kind.resolved;
            }
            else {
                resolvedKind = kind;
            }
            if (resolvedKind !== undefined) {
                switch (resolvedKind) {
                    case types.CommentThreadState.Unresolved:
                        return languages.CommentThreadState.Unresolved;
                    case types.CommentThreadState.Resolved:
                        return languages.CommentThreadState.Resolved;
                }
            }
            return languages.CommentThreadState.Unresolved;
        }
        function convertToRelevance(kind) {
            let applicabilityKind = undefined;
            if (typeof kind === 'object') {
                applicabilityKind = kind.applicability;
            }
            if (applicabilityKind !== undefined) {
                switch (applicabilityKind) {
                    case types.CommentThreadApplicability.Current:
                        return languages.CommentThreadApplicability.Current;
                    case types.CommentThreadApplicability.Outdated:
                        return languages.CommentThreadApplicability.Outdated;
                }
            }
            return languages.CommentThreadApplicability.Current;
        }
        return new ExtHostCommentsImpl();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENvbW1lbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0Q29tbWVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7SUEyQmhHLHNEQWl4QkM7SUFqeEJELFNBQWdCLHFCQUFxQixDQUFDLFdBQXlCLEVBQUUsUUFBeUIsRUFBRSxTQUEyQjtRQUN0SCxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUVuRSxNQUFNLG1CQUFtQjtxQkFFVCxlQUFVLEdBQUcsQ0FBQyxBQUFKLENBQUs7WUFROUI7Z0JBTFEsd0JBQW1CLEdBQWtELElBQUksR0FBRyxFQUE0QyxDQUFDO2dCQUV6SCxtQ0FBOEIsR0FBdUQsSUFBSSxtQ0FBc0IsRUFBOEIsQ0FBQztnQkFLckosUUFBUSxDQUFDLHlCQUF5QixDQUFDO29CQUNsQyxlQUFlLEVBQUUsR0FBRyxDQUFDLEVBQUU7d0JBQ3RCLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLDJDQUFtQyxFQUFFLENBQUM7NEJBQ3hELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7NEJBRW5FLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dDQUN4QixPQUFPLEdBQUcsQ0FBQzs0QkFDWixDQUFDOzRCQUVELE9BQU8saUJBQWlCLENBQUMsS0FBSyxDQUFDO3dCQUNoQyxDQUFDOzZCQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLHVDQUErQixFQUFFLENBQUM7NEJBQzNELE1BQU0sdUJBQXVCLEdBQTRCLEdBQUcsQ0FBQzs0QkFDN0QsTUFBTSxp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