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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/splitview/splitview", "vs/base/browser/ui/tree/tree", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/services/resolverService", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/workbench/contrib/typeHierarchy/browser/typeHierarchyTree", "vs/workbench/services/editor/common/editorService", "vs/css!./media/typeHierarchy"], function (require, exports, dom_1, splitview_1, tree_1, color_1, event_1, lifecycle_1, embeddedCodeEditorWidget_1, range_1, model_1, resolverService_1, peekView, nls_1, menuEntryActionViewItem_1, actions_1, contextkey_1, instantiation_1, listService_1, storage_1, themeService_1, typeHTree, editorService_1) {
    "use strict";
    var TypeHierarchyTreePeekWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TypeHierarchyTreePeekWidget = void 0;
    // Todo: copied from call hierarchy, to extract
    var State;
    (function (State) {
        State["Loading"] = "loading";
        State["Message"] = "message";
        State["Data"] = "data";
    })(State || (State = {}));
    class LayoutInfo {
        static store(info, storageService) {
            storageService.store('typeHierarchyPeekLayout', JSON.stringify(info), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
        static retrieve(storageService) {
            const value = storageService.get('typeHierarchyPeekLayout', 0 /* StorageScope.PROFILE */, '{}');
            const defaultInfo = { ratio: 0.7, height: 17 };
            try {
                return { ...defaultInfo, ...JSON.parse(value) };
            }
            catch {
                return defaultInfo;
            }
        }
        constructor(ratio, height) {
            this.ratio = ratio;
            this.height = height;
        }
    }
    class TypeHierarchyTree extends listService_1.WorkbenchAsyncDataTree {
    }
    let TypeHierarchyTreePeekWidget = class TypeHierarchyTreePeekWidget extends peekView.PeekViewWidget {
        static { TypeHierarchyTreePeekWidget_1 = this; }
        static { this.TitleMenu = new actions_1.MenuId('typehierarchy/title'); }
        constructor(editor, _where, _direction, themeService, _peekViewService, _editorService, _textModelService, _storageService, _menuService, _contextKeyService, _instantiationService) {
            super(editor, { showFrame: true, showArrow: true, isResizeable: true, isAccessible: true }, _instantiationService);
            this._where = _where;
            this._direction = _direction;
            this._peekViewService = _peekViewService;
            this._editorService = _editorService;
            this._textModelService = _textModelService;
            this._storageService = _storageService;
            this._menuService = _menuService;
            this._contextKeyService = _contextKeyService;
            this._instantiationService = _instantiationService;
            this._treeViewStates = new Map();
            this._previewDisposable = new lifecycle_1.DisposableStore();
            this.create();
            this._peekViewService.addExclusiveWidget(editor, this);
            this._applyTheme(themeService.getColorTheme());
            this._disposables.add(themeService.onDidColorThemeChange(this._applyTheme, this));
            this._disposables.add(this._previewDisposable);
        }
        dispose() {
            LayoutInfo.store(this._layoutInfo, this._storageService);
            this._splitView.dispose();
            this._tree.dispose();
            this._editor.dispose();
            super.dispose();
        }
        get direction() {
            return this._direction;
        }
        _applyTheme(theme) {
            const borderColor = theme.getColor(peekView.peekViewBorder) || color_1.Color.transparent;
            this.style({
                arrowColor: borderColor,
                frameColor: borderColor,
                headerBackgroundColor: theme.getColor(peekView.peekViewTitleBackground) || color_1.Color.transparent,
                primaryHeadingColor: theme.getColor(peekView.peekViewTitleForeground),
                secondaryHeadingColor: theme.getColor(peekView.peekViewTitleInfoForeground)
            });
        }
        _fillHead(container) {
            super._fillHead(container, true);
            const menu = this._menuService.createMenu(TypeHierarchyTreePeekWidget_1.TitleMenu, this._contextKeyService);
            const updateToolbar = () => {
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, undefined, actions);
                this._actionbarWidget.clear();
                this._actionbarWidget.push(actions, { label: false, icon: true });
            };
            this._disposables.add(menu);
            this._disposables.add(menu.onDidChange(updateToolbar));
            updateToolbar();
        }
        _fillBody(parent) {
            this._layoutInfo = LayoutInfo.retrieve(this._storageService);
            this._dim = new dom_1.Dimension(0, 0);
            this._parent = parent;
            parent.classList.add('type-hierarchy');
            const message = document.createElement('div');
            message.classList.add('message');
            parent.appendChild(message);
            this._message = message;
            this._message.tabIndex = 0;
            const container = document.createElement('div');
            container.classList.add('results');
            parent.appendChild(container);
            this._splitView = new splitview_1.SplitView(container, { orientation: 1 /* Orientation.HORIZONTAL */ });
            // editor stuff
            const editorContainer = document.createElement('div');
            editorContainer.classList.add('editor');
            container.appendChild(editorContainer);
            const editorOptions = {
                scrollBeyondLastLine: false,
                scrollbar: {
                    verticalScrollbarSize: 14,
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                    alwaysConsumeMouseWheel: false
                },
                overviewRulerLanes: 2,
                fixedOverflowWidgets: true,
                minimap: {
                    enabled: false
                }
            };
            this._editor = this._instantiationService.createInstance(embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget, editorContainer, editorOptions, {}, this.editor);
            // tree stuff
            const treeContainer = document.createElement('div');
            treeContainer.classList.add('tree');
            container.appendChild(treeContainer);
            const options = {
                sorter: new typeHTree.Sorter(),
                accessibilityProvider: new typeHTree.AccessibilityProvider(() => this._direction),
                identityProvider: new typeHTree.IdentityProvider(() => this._direction),
                expandOnlyOnTwistieClick: true,
                overrideStyles: {
                    listBackground: peekView.peekViewResultsBackground
                }
            };
            this._tree = this._instantiationService.createInstance(TypeHierarchyTree, 'TypeHierarchyPeek', treeContainer, new typeHTree.VirtualDelegate(), [this._instantiationService.createInstance(typeHTree.TypeRenderer)], this._instantiationService.createInstance(typeHTree.DataSource, () => this._direction), options);
            // split stuff
            this._splitView.addView({
                onDidChange: event_1.Event.None,
                element: editorContainer,
                minimumSize: 200,
                maximumSize: Number.MAX_VALUE,
                layout: (width) => {
                    if (this._dim.height) {
                        this._editor.layout({ height: this._dim.height, width });
                    }
                }
            }, splitview_1.Sizing.Distribute);
            this._splitView.addView({
                onDidChange: event_1.Event.None,
                element: treeContainer,
                minimumSize: 100,
                maximumSize: Number.MAX_VALUE,
                layout: (width) => {
                    if (this._dim.height) {
                        this._tree.layout(this._dim.height, width);
                    }
                }
            }, splitview_1.Sizing.Distribute);
            this._disposables.add(this._splitView.onDidSashChange(() => {
                if (this._dim.width) {
                    this._layoutInfo.ratio = this._splitView.getViewSize(0) / this._dim.width;
                }
            }));
            // update editor
            this._disposables.add(this._tree.onDidChangeFocus(this._updatePreview, this));
            this._disposables.add(this._editor.onMouseDown(e => {
                const { event, target } = e;
                if (event.detail !== 2) {
                    return;
                }
                const [focus] = this._tree.getFocus();
                if (!focus) {
                    return;
                }
                this.dispose();
                this._editorService.openEditor({
                    resource: focus.item.uri,
                    options: { selection: target.range }
                });
            }));
            this._disposables.add(this._tree.onMouseDblClick(e => {
                if (e.target === tree_1.TreeMouseEventTarget.Twistie) {
                    return;
                }
                if (e.element) {
                    this.dispose();
                    this._editorService.openEditor({
                        resource: e.element.item.uri,
                        options: { selection: e.element.item.selectionRange, pinned: true }
                    });
                }
            }));
            this._disposables.add(this._tree.onDidChangeSelection(e => {
                const [element] = e.elements;
                // don't close on click
                if (element && (0, dom_1.isKeyboardEvent)(e.browserEvent)) {
                    this.dispose();
                    this._editorService.openEditor({
                        resource: element.item.uri,
                        options: { selection: element.item.selectionRange, pinned: true }
                    });
                }
            }));
        }
        async _updatePreview() {
            const [element] = this._tree.getFocus();
            if (!element) {
                return;
            }
            this._previewDisposable.clear();
            // update: editor and editor highlights
            const options = {
                description: 'type-hierarchy-decoration',
                stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                className: 'type-decoration',
                overviewRuler: {
                    color: (0, themeService_1.themeColorFromId)(peekView.peekViewEditorMatchHighlight),
                    position: model_1.OverviewRulerLane.Center
                },
            };
            let previewUri;
            if (this._direction === "supertypes" /* TypeHierarchyDirection.Supertypes */) {
                // supertypes: show super types and highlight focused type
                previewUri = element.parent ? element.parent.item.uri : element.model.root.uri;
            }
            else {
                // subtypes: show sub types and highlight focused type
                previewUri = element.item.uri;
            }
            const value = await this._textModelService.createModelReference(previewUri);
            this._editor.setModel(value.object.textEditorModel);
            // set decorations for type ranges
            const decorations = [];
            let fullRange;
            const loc = { uri: element.item.uri, range: element.item.selectionRange };
            if (loc.uri.toString() === previewUri.toString()) {
                decorations.push({ range: loc.range, options });
                fullRange = !fullRange ? loc.range : range_1.Range.plusRange(loc.range, fullRange);
            }
            if (fullRange) {
                this._editor.revealRangeInCenter(fullRange, 1 /* ScrollType.Immediate */);
                const decorationsCollection = this._editor.createDecorationsCollection(decorations);
                this._previewDisposable.add((0, lifecycle_1.toDisposable)(() => decorationsCollection.clear()));
            }
            this._previewDisposable.add(value);
            // update: title
            const title = this._direction === "supertypes" /* TypeHierarchyDirection.Supertypes */
                ? (0, nls_1.localize)('supertypes', "Supertypes of '{0}'", element.model.root.name)
                : (0, nls_1.localize)('subtypes', "Subtypes of '{0}'", element.model.root.name);
            this.setTitle(title);
        }
        showLoading() {
            this._parent.dataset['state'] = "loading" /* State.Loading */;
            this.setTitle((0, nls_1.localize)('title.loading', "Loading..."));
            this._show();
        }
        showMessage(message) {
            this._parent.dataset['state'] = "message" /* State.Message */;
            this.setTitle('');
            this.setMetaTitle('');
            this._message.innerText = message;
            this._show();
            this._message.focus();
        }
        async showModel(model) {
            this._show();
            const viewState = this._treeViewStates.get(this._direction);
            await this._tree.setInput(model, viewState);
            const root = this._tree.getNode(model).children[0];
            await this._tree.expand(root.element);
            if (root.children.length === 0) {
                this.showMessage(this._direction === "supertypes" /* TypeHierarchyDirection.Supertypes */
                    ? (0, nls_1.localize)('empt.supertypes', "No supertypes of '{0}'", model.root.name)
                    : (0, nls_1.localize)('empt.subtypes', "No subtypes of '{0}'", model.root.name));
            }
            else {
                this._parent.dataset['state'] = "data" /* State.Data */;
                if (!viewState || this._tree.getFocus().length === 0) {
                    this._tree.setFocus([root.children[0].element]);
                }
                this._tree.domFocus();
                this._updatePreview();
            }
        }
        getModel() {
            return this._tree.getInput();
        }
        getFocused() {
            return this._tree.getFocus()[0];
        }
        async updateDirection(newDirection) {
            const model = this._tree.getInput();
            if (model && newDirection !== this._direction) {
                this._treeViewStates.set(this._direction, this._tree.getViewState());
                this._direction = newDirection;
                await this.showModel(model);
            }
        }
        _show() {
            if (!this._isShowing) {
                this.editor.revealLineInCenterIfOutsideViewport(this._where.lineNumber, 0 /* ScrollType.Smooth */);
                super.show(range_1.Range.fromPositions(this._where), this._layoutInfo.height);
            }
        }
        _onWidth(width) {
            if (this._dim) {
                this._doLayoutBody(this._dim.height, width);
            }
        }
        _doLayoutBody(height, width) {
            if (this._dim.height !== height || this._dim.width !== width) {
                super._doLayoutBody(height, width);
                this._dim = new dom_1.Dimension(width, height);
                this._layoutInfo.height = this._viewZone ? this._viewZone.heightInLines : this._layoutInfo.height;
                this._splitView.layout(width);
                this._splitView.resizeView(0, width * this._layoutInfo.ratio);
            }
        }
    };
    exports.TypeHierarchyTreePeekWidget = TypeHierarchyTreePeekWidget;
    exports.TypeHierarchyTreePeekWidget = TypeHierarchyTreePeekWidget = TypeHierarchyTreePeekWidget_1 = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, peekView.IPeekViewService),
        __param(5, editorService_1.IEditorService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, storage_1.IStorageService),
        __param(8, actions_1.IMenuService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, instantiation_1.IInstantiationService)
    ], TypeHierarchyTreePeekWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZUhpZXJhcmNoeVBlZWsuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3R5cGVIaWVyYXJjaHkvYnJvd3Nlci90eXBlSGllcmFyY2h5UGVlay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBa0NoRywrQ0FBK0M7SUFDL0MsSUFBVyxLQUlWO0lBSkQsV0FBVyxLQUFLO1FBQ2YsNEJBQW1CLENBQUE7UUFDbkIsNEJBQW1CLENBQUE7UUFDbkIsc0JBQWEsQ0FBQTtJQUNkLENBQUMsRUFKVSxLQUFLLEtBQUwsS0FBSyxRQUlmO0lBRUQsTUFBTSxVQUFVO1FBRWYsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFnQixFQUFFLGNBQStCO1lBQzdELGNBQWMsQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsOERBQThDLENBQUM7UUFDcEgsQ0FBQztRQUVELE1BQU0sQ0FBQyxRQUFRLENBQUMsY0FBK0I7WUFDOUMsTUFBTSxLQUFLLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsZ0NBQXdCLElBQUksQ0FBQyxDQUFDO1lBQ3hGLE1BQU0sV0FBVyxHQUFlLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFDM0QsSUFBSSxDQUFDO2dCQUNKLE9BQU8sRUFBRSxHQUFHLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNqRCxDQUFDO1lBQUMsTUFBTSxDQUFDO2dCQUNSLE9BQU8sV0FBVyxDQUFDO1lBQ3BCLENBQUM7UUFDRixDQUFDO1FBRUQsWUFDUSxLQUFhLEVBQ2IsTUFBYztZQURkLFVBQUssR0FBTCxLQUFL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