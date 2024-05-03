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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/progressbar/progressbar", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/map", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/services/editor/common/editorService", "vs/base/common/resources", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "./outlineViewState", "vs/workbench/services/outline/browser/outline", "vs/workbench/common/editor", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/browser/ui/tree/abstractTree", "vs/workbench/contrib/outline/browser/outline", "vs/platform/theme/browser/defaultStyles", "vs/css!./outlinePane"], function (require, exports, dom, progressbar_1, async_1, lifecycle_1, map_1, nls_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, listService_1, storage_1, themeService_1, viewPane_1, editorService_1, resources_1, views_1, opener_1, telemetry_1, outlineViewState_1, outline_1, editor_1, cancellation_1, event_1, abstractTree_1, outline_2, defaultStyles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutlinePane = void 0;
    class OutlineTreeSorter {
        constructor(_comparator, order) {
            this._comparator = _comparator;
            this.order = order;
        }
        compare(a, b) {
            if (this.order === 2 /* OutlineSortOrder.ByKind */) {
                return this._comparator.compareByType(a, b);
            }
            else if (this.order === 1 /* OutlineSortOrder.ByName */) {
                return this._comparator.compareByName(a, b);
            }
            else {
                return this._comparator.compareByPosition(a, b);
            }
        }
    }
    let OutlinePane = class OutlinePane extends viewPane_1.ViewPane {
        static { this.Id = 'outline'; }
        constructor(options, _outlineService, _instantiationService, viewDescriptorService, _storageService, _editorService, configurationService, keybindingService, contextKeyService, contextMenuService, openerService, themeService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, _instantiationService, openerService, themeService, telemetryService);
            this._outlineService = _outlineService;
            this._instantiationService = _instantiationService;
            this._storageService = _storageService;
            this._editorService = _editorService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._editorControlDisposables = new lifecycle_1.DisposableStore();
            this._editorPaneDisposables = new lifecycle_1.DisposableStore();
            this._outlineViewState = new outlineViewState_1.OutlineViewState();
            this._editorListener = new lifecycle_1.MutableDisposable();
            this._treeStates = new map_1.LRUCache(10);
            this._outlineViewState.restore(this._storageService);
            this._disposables.add(this._outlineViewState);
            contextKeyService.bufferChangeEvents(() => {
                this._ctxFollowsCursor = outline_2.ctxFollowsCursor.bindTo(contextKeyService);
                this._ctxFilterOnType = outline_2.ctxFilterOnType.bindTo(contextKeyService);
                this._ctxSortMode = outline_2.ctxSortMode.bindTo(contextKeyService);
                this._ctxAllCollapsed = outline_2.ctxAllCollapsed.bindTo(contextKeyService);
            });
            const updateContext = () => {
                this._ctxFollowsCursor.set(this._outlineViewState.followCursor);
                this._ctxFilterOnType.set(this._outlineViewState.filterOnType);
                this._ctxSortMode.set(this._outlineViewState.sortBy);
            };
            updateContext();
            this._disposables.add(this._outlineViewState.onDidChange(updateContext));
        }
        dispose() {
            this._disposables.dispose();
            this._editorPaneDisposables.dispose();
            this._editorControlDisposables.dispose();
            this._editorListener.dispose();
            super.dispose();
        }
        focus() {
            super.focus();
            this._tree?.domFocus();
        }
        renderBody(container) {
            super.renderBody(container);
            this._domNode = container;
            container.classList.add('outline-pane');
            const progressContainer = dom.$('.outline-progress');
            this._message = dom.$('.outline-message');
            this._progressBar = new progressbar_1.ProgressBar(progressContainer, defaultStyles_1.defaultProgressBarStyles);
            this._treeContainer = dom.$('.outline-tree');
            dom.append(container, progressContainer, this._message, this._treeContainer);
            this._disposables.add(this.onDidChangeBodyVisibility(visible => {
                if (!visible) {
                    // stop everything when not visible
                    this._editorListener.clear();
                    this._editorPaneDisposables.clear();
                    this._editorControlDisposables.clear();
                }
                else if (!this._editorListener.value) {
                    const event = event_1.Event.any(this._editorService.onDidActiveEditorChange, this._outlineService.onDidChange);
                    this._editorListener.value = event(() => this._handleEditorChanged(this._editorService.activeEditorPane));
                    this._handleEditorChanged(this._editorService.activeEditorPane);
                }
            }));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this._tree?.layout(height, width);
            this._treeDimensions = new dom.Dimension(width, height);
        }
        collapseAll() {
            this._tree?.collapseAll();
        }
        expandAll() {
            this._tree?.expandAll();
        }
        get outlineViewState() {
            return this._outlineViewState;
        }
        _showMessage(message) {
            this._domNode.classList.add('message');
            this._progressBar.stop().hide();
            this._message.innerText = message;
        }
        _captureViewState(uri) {
            if (this._tree) {
                const oldOutline = this._tree.getInput();
                if (!uri) {
                    uri = oldOutline?.uri;
                }
                if (oldOutline && uri) {
                    this._treeStates.set(`${oldOutline.outlineKind}/${uri}`, this._tree.getViewState());
                    return true;
                }
            }
            return false;
        }
        _handleEditorChanged(pane) {
            this._editorPaneDisposables.clear();
            if (pane) {
                // react to control changes from within pane (https://github.com/microsoft/vscode/issues/134008)
                this._editorPaneDisposables.add(pane.onDidChangeControl(() => {
                    this._handleEditorControlChanged(pane);
                }));
            }
            this._handleEditorControlChanged(pane);
        }
        async _handleEditorControlChanged(pane) {
            // persist state
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(pane?.input);
            const didCapture = this._captureViewState();
            this._editorControlDisposables.clear();
            if (!pane || !this._outlineService.canCreateOutline(pane) || !resource) {
                return this._showMessage((0, nls_1.localize)('no-editor', "The active editor cannot provide outline information."));
            }
            let loadingMessage;
            if (!didCapture) {
                loadingMessage = new async_1.TimeoutTimer(() => {
                    this._showMessage((0, nls_1.localize)('loading', "Loading document symbols for '{0}'...", (0, resources_1.basename)(resource)));
                }, 100);
            }
            this._progressBar.infinite().show(500);
            const cts = new cancellation_1.CancellationTokenSource();
            this._editorControlDisposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            const newOutline = await this._outlineService.createOutline(pane, 1 /* OutlineTarget.OutlinePane */, cts.token);
            loadingMessage?.dispose();
            if (!newOutline) {
                return;
            }
            if (cts.token.isCancellationRequested) {
                newOutline?.dispose();
                return;
            }
            this._editorControlDisposables.add(newOutline);
            this._progressBar.stop().hide();
            const sorter = new OutlineTreeSorter(newOutline.config.comparator, this._outlineViewState.sortBy);
            const tree = this._instantiationService.createInstance(listService_1.WorkbenchDataTree, 'OutlinePane', this._treeContainer, newOutline.config.delegate, newOutline.config.renderers, newOutline.config.treeDataSource, {
                ...newOutline.config.options,
                sorter,
                expandOnDoubleClick: false,
                expandOnlyOnTwistieClick: true,
                multipleSelectionSupport: false,
                hideTwistiesOfChildlessElements: true,
                defaultFindMode: this._outlineViewState.filterOnType ? abstractTree_1.TreeFindMode.Filter : abstractTree_1.TreeFindMode.Highlight,
                overrideStyles: { listBackground: this.getBackgroundColor() }
            });
            // update tree, listen to changes
            const updateTree = () => {
                if (newOutline.isEmpty) {
                    // no more elements
                    this._showMessage((0, nls_1.localize)('no-symbols', "No symbols found in document '{0}'", (0, resources_1.basename)(resource)));
                    this._captureViewState(resource);
                    tree.setInput(undefined);
                }
                else if (!tree.getInput()) {
                    // first: init tree
                    this._domNode.classList.remove('message');
                    const state = this._treeStates.get(`${newOutline.outlineKind}/${newOutline.uri}`);
                    tree.setInput(newOutline, state && abstractTree_1.AbstractTreeViewState.lift(state));
                }
                else {
                    // update: refresh tree
                    this._domNode.classList.remove('message');
                    tree.updateChildren();
                }
            };
            updateTree();
            this._editorControlDisposables.add(newOutline.onDidChange(updateTree));
            tree.findMode = this._outlineViewState.filterOnType ? abstractTree_1.TreeFindMode.Filter : abstractTree_1.TreeFindMode.Highlight;
            // feature: apply panel background to tree
            this._editorControlDisposables.add(this.viewDescriptorService.onDidChangeLocation(({ views }) => {
                if (views.some(v => v.id === this.id)) {
                    tree.updateOptions({ overrideStyles: { listBackground: this.getBackgroundColor() } });
                }
            }));
            // feature: filter on type - keep tree and menu in sync
            this._editorControlDisposables.add(tree.onDidChangeFindMode(mode => this._outlineViewState.filterOnType = mode === abstractTree_1.TreeFindMode.Filter));
            // feature: reveal outline selection in editor
            // on change -> reveal/select defining range
            let idPool = 0;
            this._editorControlDisposables.add(tree.onDidOpen(async (e) => {
                const myId = ++idPool;
                const isDoubleClick = e.browserEvent?.type === 'dblclick';
                if (!isDoubleClick) {
                    // workaround for https://github.com/microsoft/vscode/issues/206424
                    await (0, async_1.timeout)(150);
                    if (myId !== idPool) {
                        return;
                    }
                }
                await newOutline.reveal(e.element, e.editorOptions, e.sideBySide, isDoubleClick);
            }));
            // feature: reveal editor selection in outline
            const revealActiveElement = () => {
                if (!this._outlineViewState.followCursor || !newOutline.activeElement) {
                    return;
                }
                let item = newOutline.activeElement;
                while (item) {
                    const top = tree.getRelativeTop(item);
                    if (top === null) {
                        // not visible -> reveal
                        tree.reveal(item, 0.5);
                    }
                    if (tree.getRelativeTop(item) !== null) {
                        tree.setFocus([item]);
                        tree.setSelection([item]);
                        break;
                    }
                    // STILL not visible -> try parent
                    item = tree.getParentElement(item);
                }
            };
            revealActiveElement();
            this._editorControlDisposables.add(newOutline.onDidChange(revealActiveElement));
            // feature: update view when user state changes
            this._editorControlDisposables.add(this._outlineViewState.onDidChange((e) => {
                this._outlineViewState.persist(this._storageService);
                if (e.filterOnType) {
                    tree.findMode = this._outlineViewState.filterOnType ? abstractTree_1.TreeFindMode.Filter : abstractTree_1.TreeFindMode.Highlight;
                }
                if (e.followCursor) {
                    revealActiveElement();
                }
                if (e.sortBy) {
                    sorter.order = this._outlineViewState.sortBy;
                    tree.resort();
                }
            }));
            // feature: expand all nodes when filtering (not when finding)
            let viewState;
            this._editorControlDisposables.add(tree.onDidChangeFindPattern(pattern => {
                if (tree.findMode === abstractTree_1.TreeFindMode.Highlight) {
                    return;
                }
                if (!viewState && pattern) {
                    viewState = tree.getViewState();
                    tree.expandAll();
                }
                else if (!pattern && viewState) {
                    tree.setInput(tree.getInput(), viewState);
                    viewState = undefined;
                }
            }));
            // feature: update all-collapsed context key
            const updateAllCollapsedCtx = () => {
                this._ctxAllCollapsed.set(tree.getNode(null).children.every(node => !node.collapsible || node.collapsed));
            };
            this._editorControlDisposables.add(tree.onDidChangeCollapseState(updateAllCollapsedCtx));
            this._editorControlDisposables.add(tree.onDidChangeModel(updateAllCollapsedCtx));
            updateAllCollapsedCtx();
            // last: set tree property and wire it up to one of our context keys
            tree.layout(this._treeDimensions?.height, this._treeDimensions?.width);
            this._tree = tree;
            this._editorControlDisposables.add((0, lifecycle_1.toDisposable)(() => {
                tree.dispose();
                this._tree = undefined;
            }));
        }
    };
    exports.OutlinePane = OutlinePane;
    exports.OutlinePane = OutlinePane = __decorate([
        __param(1, outline_1.IOutlineService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, views_1.IViewDescriptorService),
        __param(4, storage_1.IStorageService),
        __param(5, editorService_1.IEditorService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, opener_1.IOpenerService),
        __param(11, themeService_1.IThemeService),
        __param(12, telemetry_1.ITelemetryService)
    ], OutlinePane);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZVBhbmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL291dGxpbmUvYnJvd3Nlci9vdXRsaW5lUGFuZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQ2hHLE1BQU0saUJBQWlCO1FBRXRCLFlBQ1MsV0FBa0MsRUFDbkMsS0FBdUI7WUFEdEIsZ0JBQVcsR0FBWCxXQUFXLENBQXVCO1lBQ25DLFVBQUssR0FBTCxLQUFLLENBQWtCO1FBQzNCLENBQUM7UUFFTCxPQUFPLENBQUMsQ0FBSSxFQUFFLENBQUk7WUFDakIsSUFBSSxJQUFJLENBQUMsS0FBSyxvQ0FBNEIsRUFBRSxDQUFDO2dCQUM1QyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3QyxDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLEtBQUssb0NBQTRCLEVBQUUsQ0FBQztnQkFDbkQsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0MsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakQsQ0FBQztRQUNGLENBQUM7S0FDRDtJQUVNLElBQU0sV0FBVyxHQUFqQixNQUFNLFdBQVksU0FBUSxtQkFBUTtpQkFFeEIsT0FBRSxHQUFHLFNBQVMsQUFBWixDQUFhO1FBdUIvQixZQUNDLE9BQTRCLEVBQ1gsZUFBaUQsRUFDM0MscUJBQTZELEVBQzVELHFCQUE2QyxFQUNwRCxlQUFpRCxFQUNsRCxjQUErQyxFQUN4QyxvQkFBMkMsRUFDOUMsaUJBQXFDLEVBQ3JD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