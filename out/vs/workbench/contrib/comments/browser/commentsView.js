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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/common/commentModel", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/labels", "vs/workbench/contrib/comments/browser/commentsTreeViewer", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/views", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/comments/browser/comments", "vs/workbench/contrib/comments/browser/commentsViewActions", "vs/workbench/common/memento", "vs/platform/storage/common/storage", "vs/workbench/contrib/comments/browser/commentsFilterOptions", "vs/editor/common/languages", "vs/base/common/iterator", "vs/workbench/contrib/comments/browser/commentsController", "vs/workbench/browser/actions/widgetNavigationCommands", "vs/workbench/contrib/comments/browser/commentsModel", "vs/css!./media/panel"], function (require, exports, nls, dom, resources_1, instantiation_1, themeService_1, commentModel_1, commentService_1, editorService_1, labels_1, commentsTreeViewer_1, viewPane_1, views_1, configuration_1, contextkey_1, contextView_1, keybinding_1, opener_1, telemetry_1, uriIdentity_1, comments_1, commentsViewActions_1, memento_1, storage_1, commentsFilterOptions_1, languages_1, iterator_1, commentsController_1, widgetNavigationCommands_1, commentsModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentsPanel = exports.CONTEXT_KEY_SOME_COMMENTS_EXPANDED = exports.CONTEXT_KEY_HAS_COMMENTS = void 0;
    exports.CONTEXT_KEY_HAS_COMMENTS = new contextkey_1.RawContextKey('commentsView.hasComments', false);
    exports.CONTEXT_KEY_SOME_COMMENTS_EXPANDED = new contextkey_1.RawContextKey('commentsView.someCommentsExpanded', false);
    const VIEW_STORAGE_ID = 'commentsViewState';
    function createResourceCommentsIterator(model) {
        return iterator_1.Iterable.map(model.resourceCommentThreads, m => {
            const CommentNodeIt = iterator_1.Iterable.from(m.commentThreads);
            const children = iterator_1.Iterable.map(CommentNodeIt, r => ({ element: r }));
            return { element: m, children };
        });
    }
    let CommentsPanel = class CommentsPanel extends viewPane_1.FilterViewPane {
        constructor(options, instantiationService, viewDescriptorService, editorService, configurationService, contextKeyService, contextMenuService, keybindingService, openerService, themeService, commentService, telemetryService, uriIdentityService, storageService) {
            const stateMemento = new memento_1.Memento(VIEW_STORAGE_ID, storageService);
            const viewState = stateMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            super({
                ...options,
                filterOptions: {
                    placeholder: nls.localize('comments.filter.placeholder', "Filter (e.g. text, author)"),
                    ariaLabel: nls.localize('comments.filter.ariaLabel', "Filter comments"),
                    history: viewState['filterHistory'] || [],
                    text: viewState['filter'] || '',
                    focusContextKey: comments_1.CommentsViewFilterFocusContextKey.key
                }
            }, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.editorService = editorService;
            this.commentService = commentService;
            this.uriIdentityService = uriIdentityService;
            this.totalComments = 0;
            this.currentHeight = 0;
            this.currentWidth = 0;
            this.cachedFilterStats = undefined;
            this.onDidChangeVisibility = this.onDidChangeBodyVisibility;
            this.hasCommentsContextKey = exports.CONTEXT_KEY_HAS_COMMENTS.bindTo(contextKeyService);
            this.someCommentsExpandedContextKey = exports.CONTEXT_KEY_SOME_COMMENTS_EXPANDED.bindTo(contextKeyService);
            this.stateMemento = stateMemento;
            this.viewState = viewState;
            this.filters = this._register(new commentsViewActions_1.CommentsFilters({
                showResolved: this.viewState['showResolved'] !== false,
                showUnresolved: this.viewState['showUnresolved'] !== false,
            }, this.contextKeyService));
            this.filter = new commentsTreeViewer_1.Filter(new commentsFilterOptions_1.FilterOptions(this.filterWidget.getFilterText(), this.filters.showResolved, this.filters.showUnresolved));
            this._register(this.filters.onDidChange((event) => {
                if (event.showResolved || event.showUnresolved) {
                    this.updateFilter();
                }
            }));
            this._register(this.filterWidget.onDidChangeFilterText(() => this.updateFilter()));
        }
        saveState() {
            this.viewState['filter'] = this.filterWidget.getFilterText();
            this.viewState['filterHistory'] = this.filterWidget.getHistory();
            this.viewState['showResolved'] = this.filters.showResolved;
            this.viewState['showUnresolved'] = this.filters.showUnresolved;
            this.stateMemento.saveMemento();
            super.saveState();
        }
        render() {
            super.render();
            this._register((0, widgetNavigationCommands_1.registerNavigableContainer)({
                focusNotifiers: [this, this.filterWidget],
                focusNextWidget: () => {
                    if (this.filterWidget.hasFocus()) {
                        this.focus();
                    }
                },
                focusPreviousWidget: () => {
                    if (!this.filterWidget.hasFocus()) {
                        this.focusFilter();
                    }
                }
            }));
        }
        focusFilter() {
            this.filterWidget.focus();
        }
        clearFilterText() {
            this.filterWidget.setFilterText('');
        }
        getFilterStats() {
            if (!this.cachedFilterStats) {
                this.cachedFilterStats = {
                    total: this.totalComments,
                    filtered: this.tree?.getVisibleItemCount() ?? 0
                };
            }
            return this.cachedFilterStats;
        }
        updateFilter() {
            this.filter.options = new commentsFilterOptions_1.FilterOptions(this.filterWidget.getFilterText(), this.filters.showResolved, this.filters.showUnresolved);
            this.tree?.filterComments();
            this.cachedFilterStats = undefined;
            const { total, filtered } = this.getFilterStats();
            this.filterWidget.updateBadge(total === filtered || total === 0 ? undefined : nls.localize('showing filtered results', "Showing {0} of {1}", filtered, total));
            this.filterWidget.checkMoreFilters(!this.filters.showResolved || !this.filters.showUnresolved);
        }
        renderBody(container) {
            super.renderBody(container);
            container.classList.add('comments-panel');
            const domContainer = dom.append(container, dom.$('.comments-panel-container'));
            this.treeContainer = dom.append(domContainer, dom.$('.tree-container'));
            this.treeContainer.classList.add('file-icon-themable-tree', 'show-file-icons');
            this.cachedFilterStats = undefined;
            this.createTree();
            this.createMessageBox(domContainer);
            this._register(this.commentService.onDidSetAllCommentThreads(this.onAllCommentsChanged, this));
            this._register(this.commentService.onDidUpdateCommentThreads(this.onCommentsUpdated, this));
            this._register(this.commentService.onDidDeleteDataProvider(this.onDataProviderDeleted, this));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible) {
                    this.refresh();
                }
            }));
            this.renderComments();
        }
        focus() {
            super.focus();
            const element = this.tree?.getHTMLElement();
            if (element && dom.isActiveElement(element)) {
                return;
            }
            if (!this.commentService.commentsModel.hasCommentThreads() && this.messageBoxContainer) {
                this.messageBoxContainer.focus();
            }
            else if (this.tree) {
                this.tree.domFocus();
            }
        }
        async renderComments() {
            this.treeContainer.classList.toggle('hidden', !this.commentService.commentsModel.hasCommentThreads());
            this.renderMessage();
            await this.tree?.setChildren(null, createResourceCommentsIterator(this.commentService.commentsModel));
        }
        collapseAll() {
            if (this.tree) {
                this.tree.collapseAll();
                this.tree.setSelection([]);
                this.tree.setFocus([]);
                this.tree.domFocus();
                this.tree.focusFirst();
            }
        }
        expandAll() {
            if (this.tree) {
                this.tree.expandAll();
                this.tree.setSelection([]);
                this.tree.setFocus([]);
                this.tree.domFocus();
                this.tree.focusFirst();
            }
        }
        get hasRendered() {
            return !!this.tree;
        }
        layoutBodyContent(height = this.currentHeight, width = this.currentWidth) {
            if (this.messageBoxContainer) {
                this.messageBoxContainer.style.height = `${height}px`;
            }
            this.tree?.layout(height, width);
            this.currentHeight = height;
            this.currentWidth = width;
        }
        createMessageBox(parent) {
            this.messageBoxContainer = dom.append(parent, dom.$('.message-box-container'));
            this.messageBoxContainer.setAttribute('tabIndex', '0');
        }
        renderMessage() {
            this.messageBoxContainer.textContent = this.commentService.commentsModel.getMessage();
            this.messageBoxContainer.classList.toggle('hidden', this.commentService.commentsModel.hasCommentThreads());
        }
        getAriaForNode(element) {
            if (element.range) {
                if (element.threadRelevance === languages_1.CommentThreadApplicability.Outdated) {
                    return nls.localize('resourceWithCommentLabelOutdated', "Outdated from ${0} at line {1} column {2} in {3}, source: {4}", element.comment.userName, element.range.startLineNumber, element.range.startColumn, (0, resources_1.basename)(element.resource), (typeof element.comment.body === 'string') ? element.comment.body : element.comment.body.value);
                }
                else {
                    return nls.localize('resourceWithCommentLabel', "${0} at line {1} column {2} in {3}, source: {4}", element.comment.userName, element.range.startLineNumber, element.range.startColumn, (0, resources_1.basename)(element.resource), (typeof element.comment.body === 'string') ? element.comment.body : element.comment.body.value);
                }
            }
            else {
                if (element.threadRelevance === languages_1.CommentThreadApplicability.Outdated) {
                    return nls.localize('resourceWithCommentLabelFileOutdated', "Outdated from {0} in {1}, source: {2}", element.comment.userName, (0, resources_1.basename)(element.resource), (typeof element.comment.body === 'string') ? element.comment.body : element.comment.body.value);
                }
                else {
                    return nls.localize('resourceWithCommentLabelFile', "{0} in {1}, source: {2}", element.comment.userName, (0, resources_1.basename)(element.resource), (typeof element.comment.body === 'string') ? element.comment.body : element.comment.body.value);
                }
            }
        }
        createTree() {
            this.treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, this));
            this.tree = this._register(this.instantiationService.createInstance(commentsTreeViewer_1.CommentsList, this.treeLabels, this.treeContainer, {
                overrideStyles: { listBackground: this.getBackgroundColor() },
                selectionNavigation: true,
                filter: this.filter,
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (item) => {
                        return undefined;
                    }
                },
                accessibilityProvider: {
                    getAriaLabel: (element) => {
                        if (element instanceof commentsModel_1.CommentsModel) {
                            return nls.localize('rootCommentsLabel', "Comments for current workspace");
                        }
                        if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                            return nls.localize('resourceWithCommentThreadsLabel', "Comments in {0}, full path {1}", (0, resources_1.basename)(element.resource), element.resource.fsPath);
                        }
                        if (element instanceof commentModel_1.CommentNode) {
                            return this.getAriaForNode(element);
                        }
                        return '';
                    },
                    getWidgetAriaLabel() {
                        return commentsTreeViewer_1.COMMENTS_VIEW_TITLE.value;
                    }
                }
            }));
            this._register(this.tree.onDidOpen(e => {
                this.openFile(e.element, e.editorOptions.pinned, e.editorOptions.preserveFocus, e.sideBySide);
            }));
            this._register(this.tree.onDidChangeModel(() => {
                this.updateSomeCommentsExpanded();
            }));
            this._register(this.tree.onDidChangeCollapseState(() => {
                this.updateSomeCommentsExpanded();
            }));
        }
        openFile(element, pinned, preserveFocus, sideBySide) {
            if (!element) {
                return;
            }
            if (!(element instanceof commentModel_1.ResourceWithCommentThreads || element instanceof commentModel_1.CommentNode)) {
                return;
            }
            const threadToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].thread : element.thread;
            const commentToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].comment : undefined;
            return (0, commentsController_1.revealCommentThread)(this.commentService, this.editorService, this.uriIdentityService, threadToReveal, commentToReveal, false, pinned, preserveFocus, sideBySide);
        }
        async refresh() {
            if (!this.tree) {
                return;
            }
            if (this.isVisible()) {
                this.hasCommentsContextKey.set(this.commentService.commentsModel.hasCommentThreads());
                this.treeContainer.classList.toggle('hidden', !this.commentService.commentsModel.hasCommentThreads());
                this.cachedFilterStats = undefined;
                this.renderMessage();
                this.tree?.setChildren(null, createResourceCommentsIterator(this.commentService.commentsModel));
                if (this.tree.getSelection().length === 0 && this.commentService.commentsModel.hasCommentThreads()) {
                    const firstComment = this.commentService.commentsModel.resourceCommentThreads[0].commentThreads[0];
                    if (firstComment) {
                        this.tree.setFocus([firstComment]);
                        this.tree.setSelection([firstComment]);
                    }
                }
            }
        }
        onAllCommentsChanged(e) {
            this.cachedFilterStats = undefined;
            this.totalComments += e.commentThreads.length;
            let unresolved = 0;
            for (const thread of e.commentThreads) {
                if (thread.state === languages_1.CommentThreadState.Unresolved) {
                    unresolved++;
                }
            }
            this.refresh();
        }
        onCommentsUpdated(e) {
            this.cachedFilterStats = undefined;
            this.totalComments += e.added.length;
            this.totalComments -= e.removed.length;
            let unresolved = 0;
            for (const resource of this.commentService.commentsModel.resourceCommentThreads) {
                for (const thread of resource.commentThreads) {
                    if (thread.threadState === languages_1.CommentThreadState.Unresolved) {
                        unresolved++;
                    }
                }
            }
            this.refresh();
        }
        onDataProviderDeleted(owner) {
            this.cachedFilterStats = undefined;
            this.totalComments = 0;
            this.refresh();
        }
        updateSomeCommentsExpanded() {
            this.someCommentsExpandedContextKey.set(this.isSomeCommentsExpanded());
        }
        areAllCommentsExpanded() {
            if (!this.tree) {
                return false;
            }
            const navigator = this.tree.navigate();
            while (navigator.next()) {
                if (this.tree.isCollapsed(navigator.current())) {
                    return false;
                }
            }
            return true;
        }
        isSomeCommentsExpanded() {
            if (!this.tree) {
                return false;
            }
            const navigator = this.tree.navigate();
            while (navigator.next()) {
                if (!this.tree.isCollapsed(navigator.current())) {
                    return true;
                }
            }
            return false;
        }
    };
    exports.CommentsPanel = CommentsPanel;
    exports.CommentsPanel = CommentsPanel = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, editorService_1.IEditorService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, opener_1.IOpenerService),
        __param(9, themeService_1.IThemeService),
        __param(10, commentService_1.ICommentService),
        __param(11, telemetry_1.ITelemetryService),
        __param(12, uriIdentity_1.IUriIdentityService),
        __param(13, storage_1.IStorageService)
    ], CommentsPanel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9icm93c2VyL2NvbW1lbnRzVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrQ25GLFFBQUEsd0JBQXdCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pGLFFBQUEsa0NBQWtDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLG1DQUFtQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pILE1BQU0sZUFBZSxHQUFHLG1CQUFtQixDQUFDO0lBRTVDLFNBQVMsOEJBQThCLENBQUMsS0FBcUI7UUFDNUQsT0FBTyxtQkFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDckQsTUFBTSxhQUFhLEdBQUcsbUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sUUFBUSxHQUFHLG1CQUFRLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXBFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDO1FBQ2pDLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVNLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWMsU0FBUSx5QkFBYztRQW1CaEQsWUFDQyxPQUF5QixFQUNGLG9CQUEyQyxFQUMxQyxxQkFBNkMsRUFDckQsYUFBOEMsRUFDdkMsb0JBQTJDLEVBQzlDLGlCQUFxQyxFQUNwQyxrQkFBdUMsRUFDeEMs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