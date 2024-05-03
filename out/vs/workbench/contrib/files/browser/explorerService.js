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
define(["require", "exports", "vs/base/common/event", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/workbench/contrib/files/common/explorerModel", "vs/platform/files/common/files", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/platform/clipboard/common/clipboardService", "vs/workbench/services/editor/common/editorService", "vs/platform/uriIdentity/common/uriIdentity", "vs/editor/browser/services/bulkEditService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/progress/common/progress", "vs/base/common/cancellation", "vs/base/common/async", "vs/workbench/services/host/browser/host", "vs/workbench/common/resources", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/telemetry/common/telemetry"], function (require, exports, event_1, workspace_1, lifecycle_1, explorerModel_1, files_1, resources_1, configuration_1, clipboardService_1, editorService_1, uriIdentity_1, bulkEditService_1, undoRedo_1, progress_1, cancellation_1, async_1, host_1, resources_2, filesConfigurationService_1, telemetry_1) {
    "use strict";
    var ExplorerService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExplorerService = exports.UNDO_REDO_SOURCE = void 0;
    exports.UNDO_REDO_SOURCE = new undoRedo_1.UndoRedoSource();
    let ExplorerService = class ExplorerService {
        static { ExplorerService_1 = this; }
        static { this.EXPLORER_FILE_CHANGES_REACT_DELAY = 500; } // delay in ms to react to file changes to give our internal events a chance to react first
        constructor(fileService, configurationService, contextService, clipboardService, editorService, uriIdentityService, bulkEditService, progressService, hostService, filesConfigurationService, telemetryService) {
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.clipboardService = clipboardService;
            this.editorService = editorService;
            this.uriIdentityService = uriIdentityService;
            this.bulkEditService = bulkEditService;
            this.progressService = progressService;
            this.filesConfigurationService = filesConfigurationService;
            this.telemetryService = telemetryService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.fileChangeEvents = [];
            this.config = this.configurationService.getValue('explorer');
            this.model = new explorerModel_1.ExplorerModel(this.contextService, this.uriIdentityService, this.fileService, this.configurationService, this.filesConfigurationService);
            this.disposables.add(this.model);
            this.disposables.add(this.fileService.onDidRunOperation(e => this.onDidRunOperation(e)));
            this.onFileChangesScheduler = new async_1.RunOnceScheduler(async () => {
                const events = this.fileChangeEvents;
                this.fileChangeEvents = [];
                // Filter to the ones we care
                const types = [2 /* FileChangeType.DELETED */];
                if (this.config.sortOrder === "modified" /* SortOrder.Modified */) {
                    types.push(0 /* FileChangeType.UPDATED */);
                }
                let shouldRefresh = false;
                // For DELETED and UPDATED events go through the explorer model and check if any of the items got affected
                this.roots.forEach(r => {
                    if (this.view && !shouldRefresh) {
                        shouldRefresh = doesFileEventAffect(r, this.view, events, types);
                    }
                });
                // For ADDED events we need to go through all the events and check if the explorer is already aware of some of them
                // Or if they affect not yet resolved parts of the explorer. If that is the case we will not refresh.
                events.forEach(e => {
                    if (!shouldRefresh) {
                        for (const resource of e.rawAdded) {
                            const parent = this.model.findClosest((0, resources_1.dirname)(resource));
                            // Parent of the added resource is resolved and the explorer model is not aware of the added resource - we need to refresh
                            if (parent && !parent.getChild((0, resources_1.basename)(resource))) {
                                shouldRefresh = true;
                                break;
                            }
                        }
                    }
                });
                if (shouldRefresh) {
                    await this.refresh(false);
                }
            }, ExplorerService_1.EXPLORER_FILE_CHANGES_REACT_DELAY);
            this.disposables.add(this.fileService.onDidFilesChange(e => {
                this.fileChangeEvents.push(e);
                // Don't mess with the file tree while in the process of editing. #112293
                if (this.editable) {
                    return;
                }
                if (!this.onFileChangesScheduler.isScheduled()) {
                    this.onFileChangesScheduler.schedule();
                }
            }));
            this.disposables.add(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
            this.disposables.add(event_1.Event.any(this.fileService.onDidChangeFileSystemProviderRegistrations, this.fileService.onDidChangeFileSystemProviderCapabilities)(async (e) => {
                let affected = false;
                this.model.roots.forEach(r => {
                    if (r.resource.scheme === e.scheme) {
                        affected = true;
                        r.forgetChildren();
                    }
                });
                if (affected) {
                    if (this.view) {
                        await this.view.setTreeInput();
                    }
                }
            }));
            this.disposables.add(this.model.onDidChangeRoots(() => {
                this.view?.setTreeInput();
            }));
            // Refresh explorer when window gets focus to compensate for missing file events #126817
            this.disposables.add(hostService.onDidChangeFocus(hasFocus => {
                if (hasFocus) {
                    this.refresh(false);
                }
            }));
            this.revealExcludeMatcher = new resources_2.ResourceGlobMatcher((uri) => getRevealExcludes(configurationService.getValue({ resource: uri })), (event) => event.affectsConfiguration('explorer.autoRevealExclude'), contextService, configurationService);
            this.disposables.add(this.revealExcludeMatcher);
        }
        get roots() {
            return this.model.roots;
        }
        get sortOrderConfiguration() {
            return {
                sortOrder: this.config.sortOrder,
                lexicographicOptions: this.config.sortOrderLexicographicOptions,
            };
        }
        registerView(contextProvider) {
            this.view = contextProvider;
        }
        getContext(respectMultiSelection, ignoreNestedChildren = false) {
            if (!this.view) {
                return [];
            }
            const items = new Set(this.view.getContext(respectMultiSelection));
            items.forEach(item => {
                try {
                    if (respectMultiSelection && !ignoreNestedChildren && this.view?.isItemCollapsed(item) && item.nestedChildren) {
                        for (const child of item.nestedChildren) {
                            items.add(child);
                        }
                    }
                }
                catch {
                    // We will error out trying to resolve collapsed nodes that have not yet been resolved.
                    // So we catch and ignore them in the multiSelect context
                    return;
                }
            });
            return [...items];
        }
        async applyBulkEdit(edit, options) {
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            const promise = this.progressService.withProgress({
                location: options.progressLocation || 10 /* ProgressLocation.Window */,
                title: options.progressLabel,
                cancellable: edit.length > 1, // Only allow cancellation when there is more than one edit. Since cancelling will not actually stop the current edit that is in progress.
                delay: 500,
            }, async (progress) => {
                await this.bulkEditService.apply(edit, {
                    undoRedoSource: exports.UNDO_REDO_SOURCE,
                    label: options.undoLabel,
                    code: 'undoredo.explorerOperation',
                    progress,
                    token: cancellationTokenSource.token,
                    confirmBeforeUndo: options.confirmBeforeUndo
                });
            }, () => cancellationTokenSource.cancel());
            await this.progressService.withProgress({ location: 1 /* ProgressLocation.Explorer */, delay: 500 }, () => promise);
            cancellationTokenSource.dispose();
        }
        hasViewFocus() {
            return !!this.view && this.view.hasFocus();
        }
        // IExplorerService methods
        findClosest(resource) {
            return this.model.findClosest(resource);
        }
        findClosestRoot(resource) {
            const parentRoots = this.model.roots.filter(r => this.uriIdentityService.extUri.isEqualOrParent(resource, r.resource))
                .sort((first, second) => second.resource.path.length - first.resource.path.length);
            return parentRoots.length ? parentRoots[0] : null;
        }
        async setEditable(stat, data) {
            if (!this.view) {
                return;
            }
            if (!data) {
                this.editable = undefined;
            }
            else {
                this.editable = { stat, data };
            }
            const isEditing = this.isEditable(stat);
            try {
                await this.view.setEditable(stat, isEditing);
            }
            catch {
                const parent = stat.parent;
                const errorData = {
                    parentIsDirectory: parent?.isDirectory,
                    isDirectory: stat.isDirectory,
                    isReadonly: !!stat.isReadonly,
                    parentIsReadonly: !!parent?.isReadonly,
                    parentIsExcluded: parent?.isExcluded,
                    isExcluded: stat.isExcluded,
                    parentIsRoot: parent?.isRoot,
                    isRoot: stat.isRoot,
                    parentHasNests: parent?.hasNests,
                    hasNests: stat.hasNests,
                };
                this.telemetryService.publicLogError2('explorerView.setEditableError', errorData);
                return;
            }
            if (!this.editable && this.fileChangeEvents.length && !this.onFileChangesScheduler.isScheduled()) {
                this.onFileChangesScheduler.schedule();
            }
        }
        async setToCopy(items, cut) {
            const previouslyCutItems = this.cutItems;
            this.cutItems = cut ? items : undefined;
            await this.clipboardService.writeResources(items.map(s => s.resource));
            this.view?.itemsCopied(items, cut, previouslyCutItems);
        }
        isCut(item) {
            return !!this.cutItems && this.cutItems.some(i => this.uriIdentityService.extUri.isEqual(i.resource, item.resource));
        }
        getEditable() {
            return this.editable;
        }
        getEditableData(stat) {
            return this.editable && this.editable.stat === stat ? this.editable.data : undefined;
        }
        isEditable(stat) {
            return !!this.editable && (this.editable.stat === stat || !stat);
        }
        async select(resource, reveal) {
            if (!this.view) {
                return;
            }
            // If file or parent matches exclude patterns, do not reveal unless reveal argument is 'force'
            const ignoreRevealExcludes = reveal === 'force';
            const fileStat = this.findClosest(resource);
            if (fileStat) {
                if (!this.shouldAutoRevealItem(fileStat, ignoreRevealExcludes)) {
                    return;
                }
                await this.view.selectResource(fileStat.resource, reveal);
                return Promise.resolve(undefined);
            }
            // Stat needs to be resolved first and then revealed
            const options = { resolveTo: [resource], resolveMetadata: this.config.sortOrder === "modified" /* SortOrder.Modified */ };
            const root = this.findClosestRoot(resource);
            if (!root) {
                return undefined;
            }
            try {
                const stat = await this.fileService.resolve(root.resource, options);
                // Convert to model
                const modelStat = explorerModel_1.ExplorerItem.create(this.fileService, this.configurationService, this.filesConfigurationService, stat, undefined, options.resolveTo);
                // Update Input with disk Stat
                explorerModel_1.ExplorerItem.mergeLocalWithDisk(modelStat, root);
                const item = root.find(resource);
                await this.view.refresh(true, root);
                // Once item is resolved, check again if folder should be expanded
                if (item && !this.shouldAutoRevealItem(item, ignoreRevealExcludes)) {
                    return;
                }
                await this.view.selectResource(item ? item.resource : undefined, reveal);
            }
            catch (error) {
                root.error = error;
                await this.view.refresh(false, root);
            }
        }
        async refresh(reveal = true) {
            this.model.roots.forEach(r => r.forgetChildren());
            if (this.view) {
                await this.view.refresh(true);
                const resource = this.editorService.activeEditor?.resource;
                const autoReveal = this.configurationService.getValue().explorer.autoReveal;
                if (reveal && resource && autoReveal) {
                    // We did a top level refresh, reveal the active file #67118
                    this.select(resource, autoReveal);
                }
            }
        }
        // File events
        async onDidRunOperation(e) {
            // When nesting, changes to one file in a folder may impact the rendered structure
            // of all the folder's immediate children, thus a recursive refresh is needed.
            // Ideally the tree would be able to recusively refresh just one level but that does not yet exist.
            const shouldDeepRefresh = this.config.fileNesting.enabled;
            // Add
            if (e.isOperation(0 /* FileOperation.CREATE */) || e.isOperation(3 /* FileOperation.COPY */)) {
                const addedElement = e.target;
                const parentResource = (0, resources_1.dirname)(addedElement.resource);
                const parents = this.model.findAll(parentResource);
                if (parents.length) {
                    // Add the new file to its parent (Model)
                    await Promise.all(parents.map(async (p) => {
                        // We have to check if the parent is resolved #29177
                        const resolveMetadata = this.config.sortOrder === `modified`;
                        if (!p.isDirectoryResolved) {
                            const stat = await this.fileService.resolve(p.resource, { resolveMetadata });
                            if (stat) {
                                const modelStat = explorerModel_1.ExplorerItem.create(this.fileService, this.configurationService, this.filesConfigurationService, stat, p.parent);
                                explorerModel_1.ExplorerItem.mergeLocalWithDisk(modelStat, p);
                            }
                        }
                        const childElement = explorerModel_1.ExplorerItem.create(this.fileService, this.configurationService, this.filesConfigurationService, addedElement, p.parent);
                        // Make sure to remove any previous version of the file if any
                        p.removeChild(childElement);
                        p.addChild(childElement);
                        // Refresh the Parent (View)
                        await this.view?.refresh(shouldDeepRefresh, p);
                    }));
                }
            }
            // Move (including Rename)
            else if (e.isOperation(2 /* FileOperation.MOVE */)) {
                const oldResource = e.resource;
                const newElement = e.target;
                const oldParentResource = (0, resources_1.dirname)(oldResource);
                const newParentResource = (0, resources_1.dirname)(newElement.resource);
                const modelElements = this.model.findAll(oldResource);
                const sameParentMove = modelElements.every(e => !e.nestedParent) && this.uriIdentityService.extUri.isEqual(oldParentResource, newParentResource);
                // Handle Rename
                if (sameParentMove) {
                    await Promise.all(modelElements.map(async (modelElement) => {
                        // Rename File (Model)
                        modelElement.rename(newElement);
                        await this.view?.refresh(shouldDeepRefresh, modelElement.parent);
                    }));
                }
                // Handle Move
                else {
                    const newParents = this.model.findAll(newParentResource);
                    if (newParents.length && modelElements.length) {
                        // Move in Model
                        await Promise.all(modelElements.map(async (modelElement, index) => {
                            const oldParent = modelElement.parent;
                            const oldNestedParent = modelElement.nestedParent;
                            modelElement.move(newParents[index]);
                            if (oldNestedParent) {
                                await this.view?.refresh(false, oldNestedParent);
                            }
                            await this.view?.refresh(false, oldParent);
                            await this.view?.refresh(shouldDeepRefresh, newParents[index]);
                        }));
                    }
                }
            }
            // Delete
            else if (e.isOperation(1 /* FileOperation.DELETE */)) {
                const modelElements = this.model.findAll(e.resource);
                await Promise.all(modelElements.map(async (modelElement) => {
                    if (modelElement.parent) {
                        // Remove Element from Parent (Model)
                        const parent = modelElement.parent;
                        parent.removeChild(modelElement);
                        this.view?.focusNext();
                        const oldNestedParent = modelElement.nestedParent;
                        if (oldNestedParent) {
                            oldNestedParent.removeChild(modelElement);
                            await this.view?.refresh(false, oldNestedParent);
                        }
                        // Refresh Parent (View)
                        await this.view?.refresh(shouldDeepRefresh, parent);
                        if (this.view?.getFocus().length === 0) {
                            this.view?.focusLast();
                        }
                    }
                }));
            }
        }
        // Check if an item matches a explorer.autoRevealExclude pattern
        shouldAutoRevealItem(item, ignore) {
            if (item === undefined || ignore) {
                return true;
            }
            if (this.revealExcludeMatcher.matches(item.resource, name => !!(item.parent && item.parent.getChild(name)))) {
                return false;
            }
            const root = item.root;
            let currentItem = item.parent;
            while (currentItem !== root) {
                if (currentItem === undefined) {
                    return true;
                }
                if (this.revealExcludeMatcher.matches(currentItem.resource)) {
                    return false;
                }
                currentItem = currentItem.parent;
            }
            return true;
        }
        async onConfigurationUpdated(event) {
            if (!event.affectsConfiguration('explorer')) {
                return;
            }
            let shouldRefresh = false;
            if (event.affectsConfiguration('explorer.fileNesting')) {
                shouldRefresh = true;
            }
            const configuration = this.configurationService.getValue();
            const configSortOrder = configuration?.explorer?.sortOrder || "default" /* SortOrder.Default */;
            if (this.config.sortOrder !== configSortOrder) {
                shouldRefresh = this.config.sortOrder !== undefined;
            }
            const configLexicographicOptions = configuration?.explorer?.sortOrderLexicographicOptions || "default" /* LexicographicOptions.Default */;
            if (this.config.sortOrderLexicographicOptions !== configLexicographicOptions) {
                shouldRefresh = shouldRefresh || this.config.sortOrderLexicographicOptions !== undefined;
            }
            this.config = configuration.explorer;
            if (shouldRefresh) {
                await this.refresh();
            }
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    exports.ExplorerService = ExplorerService;
    exports.ExplorerService = ExplorerService = ExplorerService_1 = __decorate([
        __param(0, files_1.IFileService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, clipboardService_1.IClipboardService),
        __param(4, editorService_1.IEditorService),
        __param(5, uriIdentity_1.IUriIdentityService),
        __param(6, bulkEditService_1.IBulkEditService),
        __param(7, progress_1.IProgressService),
        __param(8, host_1.IHostService),
        __param(9, filesConfigurationService_1.IFilesConfigurationService),
        __param(10, telemetry_1.ITelemetryService)
    ], ExplorerService);
    function doesFileEventAffect(item, view, events, types) {
        for (const [_name, child] of item.children) {
            if (view.isItemVisible(child)) {
                if (events.some(e => e.contains(child.resource, ...types))) {
                    return true;
                }
                if (child.isDirectory && child.isDirectoryResolved) {
                    if (doesFileEventAffect(child, view, events, types)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    function getRevealExcludes(configuration) {
        const revealExcludes = configuration && configuration.explorer && configuration.explorer.autoRevealExclude;
        if (!revealExcludes) {
            return {};
        }
        return revealExcludes;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9icm93c2VyL2V4cGxvcmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBMkJuRixRQUFBLGdCQUFnQixHQUFHLElBQUkseUJBQWMsRUFBRSxDQUFDO0lBRTlDLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWU7O2lCQUdILHNDQUFpQyxHQUFHLEdBQUcsQUFBTixDQUFPLEdBQUMsMkZBQTJGO1FBWTVKLFlBQ2UsV0FBaUMsRUFDeEIsb0JBQW1ELEVBQ2hELGNBQWdELEVBQ3ZELGdCQUEyQyxFQUM5QyxhQUFxQyxFQUNoQyxrQkFBd0QsRUFDM0QsZUFBa0QsRUFDbEQsZUFBa0QsRUFDdEQsV0FBeUIsRUFDWCx5QkFBc0UsRUFDL0UsZ0JBQW9EO1lBVmpELGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2hCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDeEMsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQy9DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDdEMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ2YsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMxQyxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDakMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBRXZCLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBNEI7WUFDOUQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQXJCdkQsZ0JBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQU83QyxxQkFBZ0IsR0FBdUIsRUFBRSxDQUFDO1lBZ0JqRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxv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