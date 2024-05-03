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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/base/common/cancellation", "vs/workbench/contrib/comments/browser/commentMenus", "vs/workbench/services/layout/browser/layoutService", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/comments/common/commentsConfiguration", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/workbench/contrib/comments/common/commentContextKeys", "vs/platform/log/common/log", "vs/workbench/contrib/comments/browser/commentsModel", "vs/editor/common/services/model"], function (require, exports, instantiation_1, event_1, lifecycle_1, range_1, cancellation_1, commentMenus_1, layoutService_1, configuration_1, commentsConfiguration_1, contextkey_1, storage_1, commentContextKeys_1, log_1, commentsModel_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentService = exports.ICommentService = void 0;
    exports.ICommentService = (0, instantiation_1.createDecorator)('commentService');
    const CONTINUE_ON_COMMENTS = 'comments.continueOnComments';
    let CommentService = class CommentService extends lifecycle_1.Disposable {
        constructor(instantiationService, layoutService, configurationService, contextKeyService, storageService, logService, modelService) {
            super();
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this.storageService = storageService;
            this.logService = logService;
            this.modelService = modelService;
            this._onDidSetDataProvider = this._register(new event_1.Emitter());
            this.onDidSetDataProvider = this._onDidSetDataProvider.event;
            this._onDidDeleteDataProvider = this._register(new event_1.Emitter());
            this.onDidDeleteDataProvider = this._onDidDeleteDataProvider.event;
            this._onDidSetResourceCommentInfos = this._register(new event_1.Emitter());
            this.onDidSetResourceCommentInfos = this._onDidSetResourceCommentInfos.event;
            this._onDidSetAllCommentThreads = this._register(new event_1.Emitter());
            this.onDidSetAllCommentThreads = this._onDidSetAllCommentThreads.event;
            this._onDidUpdateCommentThreads = this._register(new event_1.Emitter());
            this.onDidUpdateCommentThreads = this._onDidUpdateCommentThreads.event;
            this._onDidUpdateNotebookCommentThreads = this._register(new event_1.Emitter());
            this.onDidUpdateNotebookCommentThreads = this._onDidUpdateNotebookCommentThreads.event;
            this._onDidUpdateCommentingRanges = this._register(new event_1.Emitter());
            this.onDidUpdateCommentingRanges = this._onDidUpdateCommentingRanges.event;
            this._onDidChangeActiveEditingCommentThread = this._register(new event_1.Emitter());
            this.onDidChangeActiveEditingCommentThread = this._onDidChangeActiveEditingCommentThread.event;
            this._onDidChangeCurrentCommentThread = this._register(new event_1.Emitter());
            this.onDidChangeCurrentCommentThread = this._onDidChangeCurrentCommentThread.event;
            this._onDidChangeCommentingEnabled = this._register(new event_1.Emitter());
            this.onDidChangeCommentingEnabled = this._onDidChangeCommentingEnabled.event;
            this._onDidChangeActiveCommentingRange = this._register(new event_1.Emitter());
            this.onDidChangeActiveCommentingRange = this._onDidChangeActiveCommentingRange.event;
            this._commentControls = new Map();
            this._commentMenus = new Map();
            this._isCommentingEnabled = true;
            this._continueOnComments = new Map(); // uniqueOwner -> PendingCommentThread[]
            this._continueOnCommentProviders = new Set();
            this._commentsModel = this._register(new commentsModel_1.CommentsModel());
            this.commentsModel = this._commentsModel;
            this._commentingRangeResources = new Set(); // URIs
            this._commentingRangeResourceHintSchemes = new Set(); // schemes
            this._handleConfiguration();
            this._handleZenMode();
            this._workspaceHasCommenting = commentContextKeys_1.CommentContextKeys.WorkspaceHasCommenting.bindTo(contextKeyService);
            const storageListener = this._register(new lifecycle_1.DisposableStore());
            const storageEvent = event_1.Event.debounce(this.storageService.onDidChangeValue(1 /* StorageScope.WORKSPACE */, CONTINUE_ON_COMMENTS, storageListener), (last, event) => last?.external ? last : event, 500);
            storageListener.add(storageEvent(v => {
                if (!v.external) {
                    return;
                }
                const commentsToRestore = this.storageService.getObject(CONTINUE_ON_COMMENTS, 1 /* StorageScope.WORKSPACE */);
                if (!commentsToRestore) {
                    return;
                }
                this.logService.debug(`Comments: URIs of continue on comments from storage ${commentsToRestore.map(thread => thread.uri.toString()).join(', ')}.`);
                const changedOwners = this._addContinueOnComments(commentsToRestore, this._continueOnComments);
                for (const uniqueOwner of changedOwners) {
                    const control = this._commentControls.get(uniqueOwner);
                    if (!control) {
                        continue;
                    }
                    const evt = {
                        uniqueOwner: uniqueOwner,
                        owner: control.owner,
                        ownerLabel: control.label,
                        pending: this._continueOnComments.get(uniqueOwner) || [],
                        added: [],
                        removed: [],
                        changed: []
                    };
                    this.updateModelThreads(evt);
                }
            }));
            this._register(storageService.onWillSaveState(() => {
                const map = new Map();
                for (const provider of this._continueOnCommentProviders) {
                    const pendingComments = provider.provideContinueOnComments();
                    this._addContinueOnComments(pendingComments, map);
                }
                this._saveContinueOnComments(map);
            }));
            this._register(this.modelService.onModelAdded(model => {
                // Allows comment providers to cause their commenting ranges to be prefetched by opening text documents in the background.
                if (!this._commentingRangeResources.has(model.uri.toString())) {
                    this.getDocumentComments(model.uri);
                }
            }));
        }
        _updateResourcesWithCommentingRanges(resource, commentInfos) {
            for (const comments of commentInfos) {
                if (comments && (comments.commentingRanges.ranges.length > 0 || comments.threads.length > 0)) {
                    this._commentingRangeResources.add(resource.toString());
                }
            }
        }
        _handleConfiguration() {
            this._isCommentingEnabled = this._defaultCommentingEnablement;
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('comments.visible')) {
                    this.enableCommenting(this._defaultCommentingEnablement);
                }
            }));
        }
        _handleZenMode() {
            let preZenModeValue = this._isCommentingEnabled;
            this._register(this.layoutService.onDidChangeZenMode(e => {
                if (e) {
                    preZenModeValue = this._isCommentingEnabled;
                    this.enableCommenting(false);
                }
                else {
                    this.enableCommenting(preZenModeValue);
                }
            }));
        }
        get _defaultCommentingEnablement() {
            return !!this.configurationService.getValue(commentsConfiguration_1.COMMENTS_SECTION)?.visible;
        }
        get isCommentingEnabled() {
            return this._isCommentingEnabled;
        }
        enableCommenting(enable) {
            if (enable !== this._isCommentingEnabled) {
                this._isCommentingEnabled = enable;
                this._onDidChangeCommentingEnabled.fire(enable);
            }
        }
        /**
         * The current comment thread is the thread that has focus or is being hovered.
         * @param commentThread
         */
        setCurrentCommentThread(commentThread) {
            this._onDidChangeCurrentCommentThread.fire(commentThread);
        }
        /**
         * The active comment thread is the the thread that is currently being edited.
         * @param commentThread
         */
        setActiveEditingCommentThread(commentThread) {
            this._onDidChangeActiveEditingCommentThread.fire(commentThread);
        }
        async setActiveCommentAndThread(uniqueOwner, commentInfo) {
            const commentController = this._commentControls.get(uniqueOwner);
            if (!commentController) {
                return;
            }
            if (commentController !== this._lastActiveCommentController) {
                await this._lastActiveCommentController?.setActiveCommentAndThread(undefined);
            }
            this._lastActiveCommentController = commentController;
            return commentController.setActiveCommentAndThread(commentInfo);
        }
        setDocumentComments(resource, commentInfos) {
            this._onDidSetResourceCommentInfos.fire({ resource, commentInfos });
        }
        setModelThreads(ownerId, owner, ownerLabel, commentThreads) {
            this._commentsModel.setCommentThreads(ownerId, owner, ownerLabel, commentThreads);
            this._onDidSetAllCommentThreads.fire({ ownerId, ownerLabel, commentThreads });
        }
        updateModelThreads(event) {
            this._commentsModel.updateCommentThreads(event);
            this._onDidUpdateCommentThreads.fire(event);
        }
        setWorkspaceComments(uniqueOwner, commentsByResource) {
            if (commentsByResource.length) {
                this._workspaceHasCommenting.set(true);
            }
            const control = this._commentControls.get(uniqueOwner);
            if (control) {
                this.setModelThreads(uniqueOwner, control.owner, control.label, commentsByResource);
            }
        }
        removeWorkspaceComments(uniqueOwner) {
            const control = this._commentControls.get(uniqueOwner);
            if (control) {
                this.setModelThreads(uniqueOwner, control.owner, control.label, []);
            }
        }
        registerCommentController(uniqueOwner, commentControl) {
            this._commentControls.set(uniqueOwner, commentControl);
            this._onDidSetDataProvider.fire();
        }
        unregisterCommentController(uniqueOwner) {
            if (uniqueOwner) {
                this._commentControls.delete(uniqueOwner);
            }
            else {
                this._commentControls.clear();
            }
            this._commentsModel.deleteCommentsByOwner(uniqueOwner);
            this._onDidDeleteDataProvider.fire(uniqueOwner);
        }
        getCommentController(uniqueOwner) {
            return this._commentControls.get(uniqueOwner);
        }
        async createCommentThreadTemplate(uniqueOwner, resource, range) {
            const commentController = this._commentControls.get(uniqueOwner);
            if (!commentController) {
                return;
            }
            return commentController.createCommentThreadTemplate(resource, range);
        }
        async updateCommentThreadTemplate(uniqueOwner, threadHandle, range) {
            const commentController = this._commentControls.get(uniqueOwner);
            if (!commentController) {
                return;
            }
            await commentController.updateCommentThreadTemplate(threadHandle, range);
        }
        disposeCommentThread(uniqueOwner, threadId) {
            const controller = this.getCommentController(uniqueOwner);
            controller?.deleteCommentThreadMain(threadId);
        }
        getCommentMenus(uniqueOwner) {
            if (this._commentMenus.get(uniqueOwner)) {
                return this._commentMenus.get(uniqueOwner);
            }
            const menu = this.instantiationService.createInstance(commentMenus_1.CommentMenus);
            this._commentMenus.set(uniqueOwner, menu);
            return menu;
        }
        updateComments(ownerId, event) {
            const control = this._commentControls.get(ownerId);
            if (control) {
                const evt = Object.assign({}, event, { uniqueOwner: ownerId, ownerLabel: control.label, owner: control.owner });
                this.updateModelThreads(evt);
            }
        }
        updateNotebookComments(ownerId, event) {
            const evt = Object.assign({}, event, { uniqueOwner: ownerId });
            this._onDidUpdateNotebookCommentThreads.fire(evt);
        }
        updateCommentingRanges(ownerId, resourceHints) {
            if (resourceHints?.schemes && resourceHints.schemes.length > 0) {
                for (const scheme of resourceHints.schemes) {
                    this._commentingRangeResourceHintSchemes.add(scheme);
                }
            }
            this._workspaceHasCommenting.set(true);
            this._onDidUpdateCommentingRanges.fire({ uniqueOwner: ownerId });
        }
        async toggleReaction(uniqueOwner, resource, thread, comment, reaction) {
            const commentController = this._commentControls.get(uniqueOwner);
            if (commentController) {
                return commentController.toggleReaction(resource, thread, comment, reaction, cancellation_1.CancellationToken.None);
            }
            else {
                throw new Error('Not supported');
            }
        }
        hasReactionHandler(uniqueOwner) {
            const commentProvider = this._commentControls.get(uniqueOwner);
            if (commentProvider) {
                return !!commentProvider.features.reactionHandler;
            }
            return false;
        }
        async getDocumentComments(resource) {
            const commentControlResult = [];
            for (const control of this._commentControls.values()) {
                commentControlResult.push(control.getDocumentComments(resource, cancellation_1.CancellationToken.None)
                    .then(documentComments => {
                    // Check that there aren't any continue on comments in the provided comments
                    // This can happen because continue on comments are stored separately from local un-submitted comments.
                    for (const documentCommentThread of documentComments.threads) {
                        if (documentCommentThread.comments?.length === 0 && documentCommentThread.range) {
                            this.removeContinueOnComment({ range: documentCommentThread.range, uri: resource, uniqueOwner: documentComments.uniqueOwner });
                        }
                    }
                    const pendingComments = this._continueOnComments.get(documentComments.uniqueOwner);
                    documentComments.pendingCommentThreads = pendingComments?.filter(pendingComment => pendingComment.uri.toString() === resource.toString());
                    return documentComments;
                })
                    .catch(_ => {
                    return null;
                }));
            }
            const commentInfos = await Promise.all(commentControlResult);
            this._updateResourcesWithCommentingRanges(resource, commentInfos);
            return commentInfos;
        }
        async getNotebookComments(resource) {
            const commentControlResult = [];
            this._commentControls.forEach(control => {
                commentControlResult.push(control.getNotebookComments(resource, cancellation_1.CancellationToken.None)
                    .catch(_ => {
                    return null;
                }));
            });
            return Promise.all(commentControlResult);
        }
        registerContinueOnCommentProvider(provider) {
            this._continueOnCommentProviders.add(provider);
            return {
                dispose: () => {
                    this._continueOnCommentProviders.delete(provider);
                }
            };
        }
        _saveContinueOnComments(map) {
            const commentsToSave = [];
            for (const pendingComments of map.values()) {
                commentsToSave.push(...pendingComments);
            }
            this.logService.debug(`Comments: URIs of continue on comments to add to storage ${commentsToSave.map(thread => thread.uri.toString()).join(', ')}.`);
            this.storageService.store(CONTINUE_ON_COMMENTS, commentsToSave, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
        }
        removeContinueOnComment(pendingComment) {
            const pendingComments = this._continueOnComments.get(pendingComment.uniqueOwner);
            if (pendingComments) {
                const commentIndex = pendingComments.findIndex(comment => comment.uri.toString() === pendingComment.uri.toString() && range_1.Range.equalsRange(comment.range, pendingComment.range) && (pendingComment.isReply === undefined || comment.isReply === pendingComment.isReply));
                if (commentIndex > -1) {
                    return pendingComments.splice(commentIndex, 1)[0];
                }
            }
            return undefined;
        }
        _addContinueOnComments(pendingComments, map) {
            const changedOwners = new Set();
            for (const pendingComment of pendingComments) {
                if (!map.has(pendingComment.uniqueOwner)) {
                    map.set(pendingComment.uniqueOwner, [pendingComment]);
                    changedOwners.add(pendingComment.uniqueOwner);
                }
                else {
                    const commentsForOwner = map.get(pendingComment.uniqueOwner);
                    if (commentsForOwner.every(comment => (comment.uri.toString() !== pendingComment.uri.toString()) || !range_1.Range.equalsRange(comment.range, pendingComment.range))) {
                        commentsForOwner.push(pendingComment);
                        changedOwners.add(pendingComment.uniqueOwner);
                    }
                }
            }
            return changedOwners;
        }
        resourceHasCommentingRanges(resource) {
            return this._commentingRangeResourceHintSchemes.has(resource.scheme) || this._commentingRangeResources.has(resource.toString());
        }
    };
    exports.CommentService = CommentService;
    exports.CommentService = CommentService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, storage_1.IStorageService),
        __param(5, log_1.ILogService),
        __param(6, model_1.IModelService)
    ], CommentService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvbW1lbnRzL2Jyb3dzZXIvY29tbWVudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0JuRixRQUFBLGVBQWUsR0FBRyxJQUFBLCtCQUFlLEVBQWtCLGdCQUFnQixDQUFDLENBQUM7SUE4RmxGLE1BQU0sb0JBQW9CLEdBQUcsNkJBQTZCLENBQUM7SUFFcEQsSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHNCQUFVO1FBd0Q3QyxZQUN3QixvQkFBOEQsRUFDNUQsYUFBdUQsRUFDekQsb0JBQTRELEVBQy9ELGlCQUFxQyxFQUN4QyxjQUFnRCxFQUNwRCxVQUF3QyxFQUN0QyxZQUE0QztZQUUzRCxLQUFLLEVBQUUsQ0FBQztZQVJrQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzNDLGtCQUFhLEdBQWIsYUFBYSxDQUF5QjtZQUN4Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBRWpELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNuQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3JCLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBNUQzQywwQkFBcUIsR0FBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDbkYseUJBQW9CLEdBQWdCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7WUFFN0QsNkJBQXdCLEdBQWdDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXNCLENBQUMsQ0FBQztZQUNsSCw0QkFBdUIsR0FBOEIsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQztZQUVqRixrQ0FBNkIs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