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
define(["require", "exports", "vs/nls", "vs/base/common/performance", "vs/base/common/decorators", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/files/browser/fileActions", "vs/base/browser/dom", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/files/browser/views/explorerDecorationsProvider", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/contextkeys", "vs/workbench/services/decorations/common/decorations", "vs/platform/list/browser/listService", "vs/base/browser/dnd", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/views/viewPane", "vs/platform/label/common/label", "vs/workbench/contrib/files/browser/views/explorerViewer", "vs/platform/theme/common/themeService", "vs/platform/actions/common/actions", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/files/common/explorerModel", "vs/workbench/browser/labels", "vs/platform/storage/common/storage", "vs/platform/clipboard/common/clipboardService", "vs/platform/files/common/files", "vs/base/common/event", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/platform/opener/common/opener", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/common/editor", "vs/workbench/contrib/files/browser/files", "vs/base/common/codicons", "vs/platform/commands/common/commands", "vs/workbench/services/editor/common/editorResolverService", "vs/platform/editor/common/editor", "vs/base/common/map", "vs/base/browser/ui/list/listWidget"], function (require, exports, nls, perf, decorators_1, files_1, fileActions_1, DOM, layoutService_1, explorerDecorationsProvider_1, workspace_1, configuration_1, keybinding_1, instantiation_1, progress_1, contextView_1, contextkey_1, contextkeys_1, decorations_1, listService_1, dnd_1, editorService_1, viewPane_1, label_1, explorerViewer_1, themeService_1, actions_1, telemetry_1, explorerModel_1, labels_1, storage_1, clipboardService_1, files_2, event_1, theme_1, views_1, viewsService_1, opener_1, uriIdentity_1, editor_1, files_3, codicons_1, commands_1, editorResolverService_1, editor_2, map_1, listWidget_1) {
    "use strict";
    var ExplorerView_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExplorerView = void 0;
    exports.getContext = getContext;
    exports.createFileIconThemableTreeContainerScope = createFileIconThemableTreeContainerScope;
    function hasExpandedRootChild(tree, treeInput) {
        for (const folder of treeInput) {
            if (tree.hasNode(folder) && !tree.isCollapsed(folder)) {
                for (const [, child] of folder.children.entries()) {
                    if (tree.hasNode(child) && tree.isCollapsible(child) && !tree.isCollapsed(child)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    /**
     * Whether or not any of the nodes in the tree are expanded
     */
    function hasExpandedNode(tree, treeInput) {
        for (const folder of treeInput) {
            if (tree.hasNode(folder) && !tree.isCollapsed(folder)) {
                return true;
            }
        }
        return false;
    }
    const identityProvider = {
        getId: (stat) => {
            if (stat instanceof explorerModel_1.NewExplorerItem) {
                return `new:${stat.getId()}`;
            }
            return stat.getId();
        }
    };
    function getContext(focus, selection, respectMultiSelection, compressedNavigationControllerProvider) {
        let focusedStat;
        focusedStat = focus.length ? focus[0] : undefined;
        // If we are respecting multi-select and we have a multi-selection we ignore focus as we want to act on the selection
        if (respectMultiSelection && selection.length > 1) {
            focusedStat = undefined;
        }
        const compressedNavigationControllers = focusedStat && compressedNavigationControllerProvider.getCompressedNavigationController(focusedStat);
        const compressedNavigationController = compressedNavigationControllers && compressedNavigationControllers.length ? compressedNavigationControllers[0] : undefined;
        focusedStat = compressedNavigationController ? compressedNavigationController.current : focusedStat;
        const selectedStats = [];
        for (const stat of selection) {
            const controllers = compressedNavigationControllerProvider.getCompressedNavigationController(stat);
            const controller = controllers && controllers.length ? controllers[0] : undefined;
            if (controller && focusedStat && controller === compressedNavigationController) {
                if (stat === focusedStat) {
                    selectedStats.push(stat);
                }
                // Ignore stats which are selected but are part of the same compact node as the focused stat
                continue;
            }
            if (controller) {
                selectedStats.push(...controller.items);
            }
            else {
                selectedStats.push(stat);
            }
        }
        if (!focusedStat) {
            if (respectMultiSelection) {
                return selectedStats;
            }
            else {
                return [];
            }
        }
        if (respectMultiSelection && selectedStats.indexOf(focusedStat) >= 0) {
            return selectedStats;
        }
        return [focusedStat];
    }
    let ExplorerView = class ExplorerView extends viewPane_1.ViewPane {
        static { ExplorerView_1 = this; }
        static { this.TREE_VIEW_STATE_STORAGE_KEY = 'workbench.explorer.treeViewState'; }
        constructor(options, contextMenuService, viewDescriptorService, instantiationService, contextService, progressService, editorService, editorResolverService, layoutService, keybindingService, contextKeyService, configurationService, decorationService, labelService, themeService, telemetryService, explorerService, storageService, clipboardService, fileService, uriIdentityService, commandService, openerService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.contextService = contextService;
            this.progressService = progressService;
            this.editorService = editorService;
            this.editorResolverService = editorResolverService;
            this.layoutService = layoutService;
            this.decorationService = decorationService;
            this.labelService = labelService;
            this.explorerService = explorerService;
            this.storageService = storageService;
            this.clipboardService = clipboardService;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.commandService = commandService;
            this._autoReveal = false;
            this.delegate = options.delegate;
            this.resourceContext = instantiationService.createInstance(contextkeys_1.ResourceContextKey);
            this._register(this.resourceContext);
            this.folderContext = files_1.ExplorerFolderContext.bindTo(contextKeyService);
            this.readonlyContext = files_1.ExplorerResourceReadonlyContext.bindTo(contextKeyService);
            this.availableEditorIdsContext = files_1.ExplorerResourceAvailableEditorIdsContext.bindTo(contextKeyService);
            this.rootContext = files_1.ExplorerRootContext.bindTo(contextKeyService);
            this.resourceMoveableToTrash = files_1.ExplorerResourceMoveableToTrash.bindTo(contextKeyService);
            this.compressedFocusContext = files_1.ExplorerCompressedFocusContext.bindTo(contextKeyService);
            this.compressedFocusFirstContext = files_1.ExplorerCompressedFirstFocusContext.bindTo(contextKeyService);
            this.compressedFocusLastContext = files_1.ExplorerCompressedLastFocusContext.bindTo(contextKeyService);
            this.viewHasSomeCollapsibleRootItem = files_1.ViewHasSomeCollapsibleRootItemContext.bindTo(contextKeyService);
            this.viewVisibleContextKey = files_1.FoldersViewVisibleContext.bindTo(contextKeyService);
            this.explorerService.registerView(this);
        }
        get autoReveal() {
            return this._autoReveal;
        }
        set autoReveal(autoReveal) {
            this._autoReveal = autoReveal;
        }
        get name() {
            return this.labelService.getWorkspaceLabel(this.contextService.getWorkspace());
        }
        get title() {
            return this.name;
        }
        set title(_) {
            // noop
        }
        setVisible(visible) {
            this.viewVisibleContextKey.set(visible);
            super.setVisible(visible);
        }
        get fileCopiedContextKey() {
            return fileActions_1.FileCopiedContext.bindTo(this.contextKeyService);
        }
        get resourceCutContextKey() {
            return files_1.ExplorerResourceCut.bindTo(this.contextKeyService);
        }
        // Split view methods
        renderHeader(container) {
            super.renderHeader(container);
            // Expand on drag over
            this.dragHandler = new dnd_1.DelayedDragHandler(container, () => this.setExpanded(true));
            const titleElement = container.querySelector('.title');
            const setHeader = () => {
                titleElement.textContent = this.name;
                this.updateTitle(this.name);
                this.ariaHeaderLabel = nls.localize('explorerSection', "Explorer Section: {0}", this.name);
                titleElement.setAttribute('aria-label', this.ariaHeaderLabel);
            };
            this._register(this.contextService.onDidChangeWorkspaceName(setHeader));
            this._register(this.labelService.onDidChangeFormatters(setHeader));
            setHeader();
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
        renderBody(container) {
            super.renderBody(container);
            this.container = container;
            this.treeContainer = DOM.append(container, DOM.$('.explorer-folders-view'));
            this.createTree(this.treeContainer);
            this._register(this.labelService.onDidChangeFormatters(() => {
                this._onDidChangeTitleArea.fire();
            }));
            // Update configuration
            this.onConfigurationUpdated(undefined);
            // When the explorer viewer is loaded, listen to changes to the editor input
            this._register(this.editorService.onDidActiveEditorChange(() => {
                this.selectActiveFile();
            }));
            // Also handle configuration updates
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
            this._register(this.onDidChangeBodyVisibility(async (visible) => {
                if (visible) {
                    // Always refresh explorer when it becomes visible to compensate for missing file events #126817
                    await this.setTreeInput();
                    // Update the collapse / expand  button state
                    this.updateAnyCollapsedContext();
                    // Find resource to focus from active editor input if set
                    this.selectActiveFile(true);
                }
            }));
            // Support for paste of files into explorer
            this._register(DOM.addDisposableListener(DOM.getWindow(this.container), DOM.EventType.PASTE, async (event) => {
                if (!this.hasFocus() || this.readonlyContext.get()) {
                    return;
                }
                if (event.clipboardData?.files?.length) {
                    await this.commandService.executeCommand('filesExplorer.paste', event.clipboardData?.files);
                }
            }));
        }
        focus() {
            super.focus();
            this.tree.domFocus();
            if (this.tree.getFocusedPart() === 0 /* AbstractTreePart.Tree */) {
                const focused = this.tree.getFocus();
                if (focused.length === 1 && this._autoReveal) {
                    this.tree.reveal(focused[0], 0.5);
                }
            }
        }
        hasFocus() {
            return DOM.isAncestorOfActiveElement(this.container);
        }
        getFocus() {
            return this.tree.getFocus();
        }
        focusNext() {
            this.tree.focusNext();
        }
        focusLast() {
            this.tree.focusLast();
        }
        getContext(respectMultiSelection) {
            const focusedItems = this.tree.getFocusedPart() === 1 /* AbstractTreePart.StickyScroll */ ?
                this.tree.getStickyScrollFocus() :
                this.tree.getFocus();
            return getContext(focusedItems, this.tree.getSelection(), respectMultiSelection, this.renderer);
        }
        isItemVisible(item) {
            // If filter is undefined it means the tree hasn't been rendered yet, so nothing is visible
            if (!this.filter) {
                return false;
            }
            return this.filter.filter(item, 1 /* TreeVisibility.Visible */);
        }
        isItemCollapsed(item) {
            return this.tree.isCollapsed(item);
        }
        async setEditable(stat, isEditing) {
            if (isEditing) {
                this.horizontalScrolling = this.tree.options.horizontalScrolling;
                if (this.horizontalScrolling) {
                    this.tree.updateOptions({ horizontalScrolling: false });
                }
                await this.tree.expand(stat.parent);
            }
            else {
                if (this.horizontalScrolling !== undefined) {
                    this.tree.updateOptions({ horizontalScrolling: this.horizontalScrolling });
                }
                this.horizontalScrolling = undefined;
                this.treeContainer.classList.remove('highlight');
            }
            await this.refresh(false, stat.parent, false);
            if (isEditing) {
                this.treeContainer.classList.add('highlight');
                this.tree.reveal(stat);
            }
            else {
                this.tree.domFocus();
            }
        }
        async selectActiveFile(reveal = this._autoReveal) {
            if (this._autoReveal) {
                const activeFile = editor_1.EditorResourceAccessor.getCanonicalUri(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                if (activeFile) {
                    const focus = this.tree.getFocus();
                    const selection = this.tree.getSelection();
                    if (focus.length === 1 && this.uriIdentityService.extUri.isEqual(focus[0].resource, activeFile) && selection.length === 1 && this.uriIdentityService.extUri.isEqual(selection[0].resource, activeFile)) {
                        // No action needed, active file is already focused and selected
                        return;
                    }
                    return this.explorerService.select(activeFile, reveal);
                }
            }
        }
        createTree(container) {
            this.filter = this.instantiationService.createInstance(explorerViewer_1.FilesFilter);
            this._register(this.filter);
            this._register(this.filter.onDidChange(() => this.refresh(true)));
            const explorerLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this._register(explorerLabels);
            const updateWidth = (stat) => this.tree.updateWidth(stat);
            this.renderer = this.instantiationService.createInstance(explorerViewer_1.FilesRenderer, container, explorerLabels, updateWidth);
            this._register(this.renderer);
            this._register(createFileIconThemableTreeContainerScope(container, this.themeService));
            const isCompressionEnabled = () => this.configurationService.getValue('explorer.compactFolders');
            const getFileNestingSettings = (item) => this.configurationService.getValue({ resource: item?.root.resource }).explorer.fileNesting;
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchCompressibleAsyncDataTree, 'FileExplorer', container, new explorerViewer_1.ExplorerDelegate(), new explorerViewer_1.ExplorerCompressionDelegate(), [this.renderer], this.instantiationService.createInstance(explorerViewer_1.ExplorerDataSource, this.filter), {
                compressionEnabled: isCompressionEnabled(),
                accessibilityProvider: this.renderer,
                identityProvider,
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (stat) => {
                        if (this.explorerService.isEditable(stat)) {
                            return undefined;
                        }
                        return stat.name;
                    },
                    getCompressedNodeKeyboardNavigationLabel: (stats) => {
                        if (stats.some(stat => this.explorerService.isEditable(stat))) {
                            return undefined;
                        }
                        return stats.map(stat => stat.name).join('/');
                    }
                },
                multipleSelectionSupport: true,
                filter: this.filter,
                sorter: this.instantiationService.createInstance(explorerViewer_1.FileSorter),
                dnd: this.instantiationService.createInstance(explorerViewer_1.FileDragAndDrop, (item) => this.isItemCollapsed(item)),
                collapseByDefault: (e) => {
                    if (e instanceof explorerModel_1.ExplorerItem) {
                        if (e.hasNests && getFileNestingSettings(e).expand) {
                            return false;
                        }
                    }
                    return true;
                },
                autoExpandSingleChildren: true,
                expandOnlyOnTwistieClick: (e) => {
                    if (e instanceof explorerModel_1.ExplorerItem) {
                        if (e.hasNests) {
                            return true;
                        }
                        else if (this.configurationService.getValue('workbench.tree.expandMode') === 'doubleClick') {
                            return true;
                        }
                    }
                    return false;
                },
                paddingBottom: explorerViewer_1.ExplorerDelegate.ITEM_HEIGHT,
                overrideStyles: {
                    listBackground: theme_1.SIDE_BAR_BACKGROUND
                }
            });
            this._register(this.tree);
            this._register(this.themeService.onDidColorThemeChange(() => this.tree.rerender()));
            // Bind configuration
            const onDidChangeCompressionConfiguration = event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('explorer.compactFolders'));
            this._register(onDidChangeCompressionConfiguration(_ => this.tree.updateOptions({ compressionEnabled: isCompressionEnabled() })));
            // Bind context keys
            files_1.FilesExplorerFocusedContext.bindTo(this.tree.contextKeyService);
            files_1.ExplorerFocusedContext.bindTo(this.tree.contextKeyService);
            // Update resource context based on focused element
            this._register(this.tree.onDidChangeFocus(e => this.onFocusChanged(e.elements)));
            this.onFocusChanged([]);
            // Open when selecting via keyboard
            this._register(this.tree.onDidOpen(async (e) => {
                const element = e.element;
                if (!element) {
                    return;
                }
                // Do not react if the user is expanding selection via keyboard.
                // Check if the item was previously also selected, if yes the user is simply expanding / collapsing current selection #66589.
                const shiftDown = DOM.isKeyboardEvent(e.browserEvent) && e.browserEvent.shiftKey;
                if (!shiftDown) {
                    if (element.isDirectory || this.explorerService.isEditable(undefined)) {
                        // Do not react if user is clicking on explorer items while some are being edited #70276
                        // Do not react if clicking on directories
                        return;
                    }
                    this.telemetryService.publicLog2('workbenchActionExecuted', { id: 'workbench.files.openFile', from: 'explorer' });
                    try {
                        this.delegate?.willOpenElement(e.browserEvent);
                        await this.editorService.openEditor({ resource: element.resource, options: { preserveFocus: e.editorOptions.preserveFocus, pinned: e.editorOptions.pinned, source: editor_2.EditorOpenSource.USER } }, e.sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
                    }
                    finally {
                        this.delegate?.didOpenElement();
                    }
                }
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            this._register(this.tree.onDidScroll(async (e) => {
                const editable = this.explorerService.getEditable();
                if (e.scrollTopChanged && editable && this.tree.getRelativeTop(editable.stat) === null) {
                    await editable.data.onFinish('', false);
                }
            }));
            this._register(this.tree.onDidChangeCollapseState(e => {
                const element = e.node.element?.element;
                if (element) {
                    const navigationControllers = this.renderer.getCompressedNavigationController(element instanceof Array ? element[0] : element);
                    navigationControllers?.forEach(controller => controller.updateCollapsed(e.node.collapsed));
                }
                // Update showing expand / collapse button
                this.updateAnyCollapsedContext();
            }));
            this.updateAnyCollapsedContext();
            this._register(this.tree.onMouseDblClick(e => {
                // If empty space is clicked, and not scrolling by page enabled #173261
                const scrollingByPage = this.configurationService.getValue('workbench.list.scrollByPage');
                if (e.element === null && !scrollingByPage) {
                    // click in empty area -> create a new file #116676
                    this.commandService.executeCommand(fileActions_1.NEW_FILE_COMMAND_ID);
                }
            }));
            // save view state
            this._register(this.storageService.onWillSaveState(() => {
                this.storeTreeViewState();
            }));
        }
        // React on events
        onConfigurationUpdated(event) {
            if (!event || event.affectsConfiguration('explorer.autoReveal')) {
                const configuration = this.configurationService.getValue();
                this._autoReveal = configuration?.explorer?.autoReveal;
            }
            // Push down config updates to components of viewer
            if (event && (event.affectsConfiguration('explorer.decorations.colors') || event.affectsConfiguration('explorer.decorations.badges'))) {
                this.refresh(true);
            }
        }
        storeTreeViewState() {
            this.storageService.store(ExplorerView_1.TREE_VIEW_STATE_STORAGE_KEY, JSON.stringify(this.tree.getViewState()), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        setContextKeys(stat) {
            const folders = this.contextService.getWorkspace().folders;
            const resource = stat ? stat.resource : folders[folders.length - 1].uri;
            stat = stat || this.explorerService.findClosest(resource);
            this.resourceContext.set(resource);
            this.folderContext.set(!!stat && stat.isDirectory);
            this.readonlyContext.set(!!stat && !!stat.isReadonly);
            this.rootContext.set(!!stat && stat.isRoot);
            if (resource) {
                const overrides = resource ? this.editorResolverService.getEditors(resource).map(editor => editor.id) : [];
                this.availableEditorIdsContext.set(overrides.join(','));
            }
            else {
                this.availableEditorIdsContext.reset();
            }
        }
        async onContextMenu(e) {
            if ((0, listWidget_1.isInputElement)(e.browserEvent.target)) {
                return;
            }
            const stat = e.element;
            let anchor = e.anchor;
            // Adjust for compressed folders (except when mouse is used)
            if (anchor instanceof HTMLElement) {
                if (stat) {
                    const controllers = this.renderer.getCompressedNavigationController(stat);
                    if (controllers && controllers.length > 0) {
                        if (DOM.isKeyboardEvent(e.browserEvent) || (0, explorerViewer_1.isCompressedFolderName)(e.browserEvent.target)) {
                            anchor = controllers[0].labels[controllers[0].index];
                        }
                        else {
                            controllers.forEach(controller => controller.last());
                        }
                    }
                }
            }
            // update dynamic contexts
            this.fileCopiedContextKey.set(await this.clipboardService.hasResources());
            this.setContextKeys(stat);
            const selection = this.tree.getSelection();
            const roots = this.explorerService.roots; // If the click is outside of the elements pass the root resource if there is only one root. If there are multiple roots pass empty object.
            let arg;
            if (stat instanceof explorerModel_1.ExplorerItem) {
                const compressedControllers = this.renderer.getCompressedNavigationController(stat);
                arg = compressedControllers && compressedControllers.length ? compressedControllers[0].current.resource : stat.resource;
            }
            else {
                arg = roots.length === 1 ? roots[0].resource : {};
            }
            this.contextMenuService.showContextMenu({
                menuId: actions_1.MenuId.ExplorerContext,
                menuActionOptions: { arg, shouldForwardArgs: true },
                contextKeyService: this.tree.contextKeyService,
                getAnchor: () => anchor,
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.tree.domFocus();
                    }
                },
                getActionsContext: () => stat && selection && selection.indexOf(stat) >= 0
                    ? selection.map((fs) => fs.resource)
                    : stat instanceof explorerModel_1.ExplorerItem ? [stat.resource] : []
            });
        }
        onFocusChanged(elements) {
            const stat = elements && elements.length ? elements[0] : undefined;
            this.setContextKeys(stat);
            if (stat) {
                const enableTrash = this.configurationService.getValue().files.enableTrash;
                const hasCapability = this.fileService.hasCapability(stat.resource, 4096 /* FileSystemProviderCapabilities.Trash */);
                this.resourceMoveableToTrash.set(enableTrash && hasCapability);
            }
            else {
                this.resourceMoveableToTrash.reset();
            }
            const compressedNavigationControllers = stat && this.renderer.getCompressedNavigationController(stat);
            if (!compressedNavigationControllers) {
                this.compressedFocusContext.set(false);
                return;
            }
            this.compressedFocusContext.set(true);
            compressedNavigationControllers.forEach(controller => {
                this.updateCompressedNavigationContextKeys(controller);
            });
        }
        // General methods
        /**
         * Refresh the contents of the explorer to get up to date data from the disk about the file structure.
         * If the item is passed we refresh only that level of the tree, otherwise we do a full refresh.
         */
        refresh(recursive, item, cancelEditing = true) {
            if (!this.tree || !this.isBodyVisible() || (item && !this.tree.hasNode(item))) {
                // Tree node doesn't exist yet, when it becomes visible we will refresh
                return Promise.resolve(undefined);
            }
            if (cancelEditing && this.explorerService.isEditable(undefined)) {
                this.tree.domFocus();
            }
            const toRefresh = item || this.tree.getInput();
            return this.tree.updateChildren(toRefresh, recursive, !!item);
        }
        getOptimalWidth() {
            const parentNode = this.tree.getHTMLElement();
            const childNodes = [].slice.call(parentNode.querySelectorAll('.explorer-item .label-name')); // select all file labels
            return DOM.getLargestChildWidth(parentNode, childNodes);
        }
        async setTreeInput() {
            if (!this.isBodyVisible()) {
                return Promise.resolve(undefined);
            }
            // Wait for the last execution to complete before executing
            if (this.setTreeInputPromise) {
                await this.setTreeInputPromise;
            }
            const initialInputSetup = !this.tree.getInput();
            if (initialInputSetup) {
                perf.mark('code/willResolveExplorer');
            }
            const roots = this.explorerService.roots;
            let input = roots[0];
            if (this.contextService.getWorkbenchState() !== 2 /* WorkbenchState.FOLDER */ || roots[0].error) {
                // Display roots only when multi folder workspace
                input = roots;
            }
            let viewState;
            if (this.tree && this.tree.getInput()) {
                viewState = this.tree.getViewState();
            }
            else {
                const rawViewState = this.storageService.get(ExplorerView_1.TREE_VIEW_STATE_STORAGE_KEY, 1 /* StorageScope.WORKSPACE */);
                if (rawViewState) {
                    viewState = JSON.parse(rawViewState);
                }
            }
            const previousInput = this.tree.getInput();
            const promise = this.setTreeInputPromise = this.tree.setInput(input, viewState).then(async () => {
                if (Array.isArray(input)) {
                    if (!viewState || previousInput instanceof explorerModel_1.ExplorerItem) {
                        // There is no view state for this workspace (we transitioned from a folder workspace?), expand up to five roots.
                        // If there are many roots in a workspace, expanding them all would can cause performance issues #176226
                        for (let i = 0; i < Math.min(input.length, 5); i++) {
                            try {
                                await this.tree.expand(input[i]);
                            }
                            catch (e) { }
                        }
                    }
                    // Reloaded or transitioned from an empty workspace, but only have a single folder in the workspace.
                    if (!previousInput && input.length === 1 && this.configurationService.getValue().explorer.expandSingleFolderWorkspaces) {
                        await this.tree.expand(input[0]).catch(() => { });
                    }
                    if (Array.isArray(previousInput)) {
                        const previousRoots = new map_1.ResourceMap();
                        previousInput.forEach(previousRoot => previousRoots.set(previousRoot.resource, true));
                        // Roots added to the explorer -> expand them.
                        await Promise.all(input.map(async (item) => {
                            if (!previousRoots.has(item.resource)) {
                                try {
                                    await this.tree.expand(item);
                                }
                                catch (e) { }
                            }
                        }));
                    }
                }
                if (initialInputSetup) {
                    perf.mark('code/didResolveExplorer');
                }
            });
            this.progressService.withProgress({
                location: 1 /* ProgressLocation.Explorer */,
                delay: this.layoutService.isRestored() ? 800 : 1500 // reduce progress visibility when still restoring
            }, _progress => promise);
            await promise;
            if (!this.decorationsProvider) {
                this.decorationsProvider = new explorerDecorationsProvider_1.ExplorerDecorationsProvider(this.explorerService, this.contextService);
                this._register(this.decorationService.registerDecorationsProvider(this.decorationsProvider));
            }
        }
        async selectResource(resource, reveal = this._autoReveal, retry = 0) {
            // do no retry more than once to prevent infinite loops in cases of inconsistent model
            if (retry === 2) {
                return;
            }
            if (!resource || !this.isBodyVisible()) {
                return;
            }
            // If something is refreshing the explorer, we must await it or else a selection race condition can occur
            if (this.setTreeInputPromise) {
                await this.setTreeInputPromise;
            }
            // Expand all stats in the parent chain.
            let item = this.explorerService.findClosestRoot(resource);
            while (item && item.resource.toString() !== resource.toString()) {
                try {
                    await this.tree.expand(item);
                }
                catch (e) {
                    return this.selectResource(resource, reveal, retry + 1);
                }
                if (!item.children.size) {
                    item = null;
                }
                else {
                    for (const child of item.children.values()) {
                        if (this.uriIdentityService.extUri.isEqualOrParent(resource, child.resource)) {
                            item = child;
                            break;
                        }
                        item = null;
                    }
                }
            }
            if (item) {
                if (item === this.tree.getInput()) {
                    this.tree.setFocus([]);
                    this.tree.setSelection([]);
                    return;
                }
                try {
                    // We must expand the nest to have it be populated in the tree
                    if (item.nestedParent) {
                        await this.tree.expand(item.nestedParent);
                    }
                    if ((reveal === true || reveal === 'force') && this.tree.getRelativeTop(item) === null) {
                        // Don't scroll to the item if it's already visible, or if set not to.
                        this.tree.reveal(item, 0.5);
                    }
                    this.tree.setFocus([item]);
                    this.tree.setSelection([item]);
                }
                catch (e) {
                    // Element might not be in the tree, try again and silently fail
                    return this.selectResource(resource, reveal, retry + 1);
                }
            }
        }
        itemsCopied(stats, cut, previousCut) {
            this.fileCopiedContextKey.set(stats.length > 0);
            this.resourceCutContextKey.set(cut && stats.length > 0);
            previousCut?.forEach(item => this.tree.rerender(item));
            if (cut) {
                stats.forEach(s => this.tree.rerender(s));
            }
        }
        expandAll() {
            if (this.explorerService.isEditable(undefined)) {
                this.tree.domFocus();
            }
            this.tree.expandAll();
        }
        collapseAll() {
            if (this.explorerService.isEditable(undefined)) {
                this.tree.domFocus();
            }
            const treeInput = this.tree.getInput();
            if (Array.isArray(treeInput)) {
                if (hasExpandedRootChild(this.tree, treeInput)) {
                    treeInput.forEach(folder => {
                        folder.children.forEach(child => this.tree.hasNode(child) && this.tree.collapse(child, true));
                    });
                    return;
                }
            }
            this.tree.collapseAll();
        }
        previousCompressedStat() {
            const focused = this.tree.getFocus();
            if (!focused.length) {
                return;
            }
            const compressedNavigationControllers = this.renderer.getCompressedNavigationController(focused[0]);
            compressedNavigationControllers.forEach(controller => {
                controller.previous();
                this.updateCompressedNavigationContextKeys(controller);
            });
        }
        nextCompressedStat() {
            const focused = this.tree.getFocus();
            if (!focused.length) {
                return;
            }
            const compressedNavigationControllers = this.renderer.getCompressedNavigationController(focused[0]);
            compressedNavigationControllers.forEach(controller => {
                controller.next();
                this.updateCompressedNavigationContextKeys(controller);
            });
        }
        firstCompressedStat() {
            const focused = this.tree.getFocus();
            if (!focused.length) {
                return;
            }
            const compressedNavigationControllers = this.renderer.getCompressedNavigationController(focused[0]);
            compressedNavigationControllers.forEach(controller => {
                controller.first();
                this.updateCompressedNavigationContextKeys(controller);
            });
        }
        lastCompressedStat() {
            const focused = this.tree.getFocus();
            if (!focused.length) {
                return;
            }
            const compressedNavigationControllers = this.renderer.getCompressedNavigationController(focused[0]);
            compressedNavigationControllers.forEach(controller => {
                controller.last();
                this.updateCompressedNavigationContextKeys(controller);
            });
        }
        updateCompressedNavigationContextKeys(controller) {
            this.compressedFocusFirstContext.set(controller.index === 0);
            this.compressedFocusLastContext.set(controller.index === controller.count - 1);
        }
        updateAnyCollapsedContext() {
            const treeInput = this.tree.getInput();
            if (treeInput === undefined) {
                return;
            }
            const treeInputArray = Array.isArray(treeInput) ? treeInput : Array.from(treeInput.children.values());
            // Has collapsible root when anything is expanded
            this.viewHasSomeCollapsibleRootItem.set(hasExpandedNode(this.tree, treeInputArray));
            // synchronize state to cache
            this.storeTreeViewState();
        }
        dispose() {
            this.dragHandler?.dispose();
            super.dispose();
        }
    };
    exports.ExplorerView = ExplorerView;
    __decorate([
        decorators_1.memoize
    ], ExplorerView.prototype, "fileCopiedContextKey", null);
    __decorate([
        decorators_1.memoize
    ], ExplorerView.prototype, "resourceCutContextKey", null);
    exports.ExplorerView = ExplorerView = ExplorerView_1 = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, progress_1.IProgressService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorResolverService_1.IEditorResolverService),
        __param(8, layoutService_1.IWorkbenchLayoutService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, decorations_1.IDecorationsService),
        __param(13, label_1.ILabelService),
        __param(14, themeService_1.IThemeService),
        __param(15, telemetry_1.ITelemetryService),
        __param(16, files_3.IExplorerService),
        __param(17, storage_1.IStorageService),
        __param(18, clipboardService_1.IClipboardService),
        __param(19, files_2.IFileService),
        __param(20, uriIdentity_1.IUriIdentityService),
        __param(21, commands_1.ICommandService),
        __param(22, opener_1.IOpenerService)
    ], ExplorerView);
    function createFileIconThemableTreeContainerScope(container, themeService) {
        container.classList.add('file-icon-themable-tree');
        container.classList.add('show-file-icons');
        const onDidChangeFileIconTheme = (theme) => {
            container.classList.toggle('align-icons-and-twisties', theme.hasFileIcons && !theme.hasFolderIcons);
            container.classList.toggle('hide-arrows', theme.hidesExplorerArrows === true);
        };
        onDidChangeFileIconTheme(themeService.getFileIconTheme());
        return themeService.onDidFileIconThemeChange(onDidChangeFileIconTheme);
    }
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.files.action.createFileFromExplorer',
                title: nls.localize('createNewFile', "New File..."),
                f1: false,
                icon: codicons_1.Codicon.newFile,
                precondition: files_1.ExplorerResourceNotReadonlyContext,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', files_1.VIEW_ID),
                    order: 10
                }
            });
        }
        run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            commandService.executeCommand(fileActions_1.NEW_FILE_COMMAND_ID);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.files.action.createFolderFromExplorer',
                title: nls.localize('createNewFolder', "New Folder..."),
                f1: false,
                icon: codicons_1.Codicon.newFolder,
                precondition: files_1.ExplorerResourceNotReadonlyContext,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', files_1.VIEW_ID),
                    order: 20
                }
            });
        }
        run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            commandService.executeCommand(fileActions_1.NEW_FOLDER_COMMAND_ID);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.files.action.refreshFilesExplorer',
                title: nls.localize2('refreshExplorer', "Refresh Explorer"),
                f1: true,
                icon: codicons_1.Codicon.refresh,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', files_1.VIEW_ID),
                    order: 30
                }
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(viewsService_1.IViewsService);
            const explorerService = accessor.get(files_3.IExplorerService);
            await viewsService.openView(files_1.VIEW_ID);
            await explorerService.refresh();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.files.action.collapseExplorerFolders',
                title: nls.localize2('collapseExplorerFolders', "Collapse Folders in Explorer"),
                f1: true,
                icon: codicons_1.Codicon.collapseAll,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', files_1.VIEW_ID),
                    order: 40
                }
            });
        }
        run(accessor) {
            const viewsService = accessor.get(viewsService_1.IViewsService);
            const view = viewsService.getViewWithId(files_1.VIEW_ID);
            if (view !== null) {
                const explorerView = view;
                explorerView.collapseAll();
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9icm93c2VyL3ZpZXdzL2V4cGxvcmVyVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNEZoRyxnQ0ErQ0M7SUFxekJELDRGQVdDO0lBbDVCRCxTQUFTLG9CQUFvQixDQUFDLElBQWlHLEVBQUUsU0FBeUI7UUFDekosS0FBSyxNQUFNLE1BQU0sSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNoQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELEtBQUssTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO29CQUNuRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDbEYsT0FBTyxJQUFJLENBQUM7b0JBQ2IsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQVMsZUFBZSxDQUFDLElBQWlHLEVBQUUsU0FBeUI7UUFDcEosS0FBSyxNQUFNLE1BQU0sSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNoQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0s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