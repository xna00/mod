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
define(["require", "exports", "vs/editor/contrib/peekView/browser/peekView", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/workbench/contrib/callHierarchy/browser/callHierarchyTree", "vs/nls", "vs/editor/common/core/range", "vs/base/browser/ui/splitview/splitview", "vs/base/browser/dom", "vs/base/common/event", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/common/services/resolverService", "vs/base/common/lifecycle", "vs/editor/common/model", "vs/platform/theme/common/themeService", "vs/platform/storage/common/storage", "vs/base/common/color", "vs/base/browser/ui/tree/tree", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/css!./media/callHierarchy"], function (require, exports, peekView, instantiation_1, listService_1, callHTree, nls_1, range_1, splitview_1, dom_1, event_1, editorService_1, embeddedCodeEditorWidget_1, resolverService_1, lifecycle_1, model_1, themeService_1, storage_1, color_1, tree_1, actions_1, contextkey_1, menuEntryActionViewItem_1) {
    "use strict";
    var CallHierarchyTreePeekWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallHierarchyTreePeekWidget = void 0;
    var State;
    (function (State) {
        State["Loading"] = "loading";
        State["Message"] = "message";
        State["Data"] = "data";
    })(State || (State = {}));
    class LayoutInfo {
        static store(info, storageService) {
            storageService.store('callHierarchyPeekLayout', JSON.stringify(info), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
        static retrieve(storageService) {
            const value = storageService.get('callHierarchyPeekLayout', 0 /* StorageScope.PROFILE */, '{}');
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
    class CallHierarchyTree extends listService_1.WorkbenchAsyncDataTree {
    }
    let CallHierarchyTreePeekWidget = class CallHierarchyTreePeekWidget extends peekView.PeekViewWidget {
        static { CallHierarchyTreePeekWidget_1 = this; }
        static { this.TitleMenu = new actions_1.MenuId('callhierarchy/title'); }
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
            const menu = this._menuService.createMenu(CallHierarchyTreePeekWidget_1.TitleMenu, this._contextKeyService);
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
            parent.classList.add('call-hierarchy');
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
                sorter: new callHTree.Sorter(),
                accessibilityProvider: new callHTree.AccessibilityProvider(() => this._direction),
                identityProvider: new callHTree.IdentityProvider(() => this._direction),
                expandOnlyOnTwistieClick: true,
                overrideStyles: {
                    listBackground: peekView.peekViewResultsBackground
                }
            };
            this._tree = this._instantiationService.createInstance(CallHierarchyTree, 'CallHierarchyPeek', treeContainer, new callHTree.VirtualDelegate(), [this._instantiationService.createInstance(callHTree.CallRenderer)], this._instantiationService.createInstance(callHTree.DataSource, () => this._direction), options);
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
                description: 'call-hierarchy-decoration',
                stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                className: 'call-decoration',
                overviewRuler: {
                    color: (0, themeService_1.themeColorFromId)(peekView.peekViewEditorMatchHighlight),
                    position: model_1.OverviewRulerLane.Center
                },
            };
            let previewUri;
            if (this._direction === "outgoingCalls" /* CallHierarchyDirection.CallsFrom */) {
                // outgoing calls: show caller and highlight focused calls
                previewUri = element.parent ? element.parent.item.uri : element.model.root.uri;
            }
            else {
                // incoming calls: show caller and highlight focused calls
                previewUri = element.item.uri;
            }
            const value = await this._textModelService.createModelReference(previewUri);
            this._editor.setModel(value.object.textEditorModel);
            // set decorations for caller ranges (if in the same file)
            const decorations = [];
            let fullRange;
            let locations = element.locations;
            if (!locations) {
                locations = [{ uri: element.item.uri, range: element.item.selectionRange }];
            }
            for (const loc of locations) {
                if (loc.uri.toString() === previewUri.toString()) {
                    decorations.push({ range: loc.range, options });
                    fullRange = !fullRange ? loc.range : range_1.Range.plusRange(loc.range, fullRange);
                }
            }
            if (fullRange) {
                this._editor.revealRangeInCenter(fullRange, 1 /* ScrollType.Immediate */);
                const decorationsCollection = this._editor.createDecorationsCollection(decorations);
                this._previewDisposable.add((0, lifecycle_1.toDisposable)(() => decorationsCollection.clear()));
            }
            this._previewDisposable.add(value);
            // update: title
            const title = this._direction === "outgoingCalls" /* CallHierarchyDirection.CallsFrom */
                ? (0, nls_1.localize)('callFrom', "Calls from '{0}'", element.model.root.name)
                : (0, nls_1.localize)('callsTo', "Callers of '{0}'", element.model.root.name);
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
                //
                this.showMessage(this._direction === "outgoingCalls" /* CallHierarchyDirection.CallsFrom */
                    ? (0, nls_1.localize)('empt.callsFrom', "No calls from '{0}'", model.root.name)
                    : (0, nls_1.localize)('empt.callsTo', "No callers of '{0}'", model.root.name));
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
    exports.CallHierarchyTreePeekWidget = CallHierarchyTreePeekWidget;
    exports.CallHierarchyTreePeekWidget = CallHierarchyTreePeekWidget = CallHierarchyTreePeekWidget_1 = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, peekView.IPeekViewService),
        __param(5, editorService_1.IEditorService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, storage_1.IStorageService),
        __param(8, actions_1.IMenuService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, instantiation_1.IInstantiationService)
    ], CallHierarchyTreePeekWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbEhpZXJhcmNoeVBlZWsuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NhbGxIaWVyYXJjaHkvYnJvd3Nlci9jYWxsSGllcmFyY2h5UGVlay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBa0NoRyxJQUFXLEtBSVY7SUFKRCxXQUFXLEtBQUs7UUFDZiw0QkFBbUIsQ0FBQTtRQUNuQiw0QkFBbUIsQ0FBQTtRQUNuQixzQkFBYSxDQUFBO0lBQ2QsQ0FBQyxFQUpVLEtBQUssS0FBTCxLQUFLLFFBSWY7SUFFRCxNQUFNLFVBQVU7UUFFZixNQUFNLENBQUMsS0FBSyxDQUFDLElBQWdCLEVBQUUsY0FBK0I7WUFDN0QsY0FBYyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyw4REFBOEMsQ0FBQztRQUNwSCxDQUFDO1FBRUQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxjQUErQjtZQUM5QyxNQUFNLEtBQUssR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLHlCQUF5QixnQ0FBd0IsSUFBSSxDQUFDLENBQUM7WUFDeEYsTUFBTSxXQUFXLEdBQWUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUMzRCxJQUFJLENBQUM7Z0JBQ0osT0FBTyxFQUFFLEdBQUcsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ2pELENBQUM7WUFBQyxNQUFNLENBQUM7Z0JBQ1IsT0FBTyxXQUFXLENBQUM7WUFDcEIsQ0FBQztRQUNGLENBQUM7UUFFRCxZQUNRLEtBQWEsRUFDYixNQUFjO1lBRGQsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLFdBQU0sR0FBTixNQUFNLENBQVE7UUFDbEIsQ0FBQztLQUNMO0lBRUQsTUFBTSxpQkFBa0IsU0FBUSxvQ0FBc0U7S0FBSTtJQUVuRyxJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLFFBQVEsQ0FBQyxjQUFjOztpQkFFdkQsY0FBUyxHQUFHLElBQUksZ0JBQU0sQ0FBQyxxQkFBcUIsQ0FBQyxBQUFwQyxDQUFxQztRQWE5RCxZQUNDLE1BQW1CLEVBQ0YsTUFBaUIsRUFDMUIsVUFBa0MsRUFDM0IsWUFBMkIsRUFDZixnQkFBNEQsRUFDdkUsY0FBK0MsRUFDNUMsaUJBQXFELEVBQ3ZELGVBQWlELEVBQ3BELFlBQTJDLEVBQ3JDLGtCQUF1RCxFQUNwRCxxQkFBNkQ7WUFFcEYsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1lBWGxHLFdBQU0sR0FBTixNQUFNLENBQVc7WUFDMUIsZUFBVSxHQUFWLFVBQVUsQ0FBd0I7WUFFRSxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQTJCO1lBQ3RELG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUMzQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ3RDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNuQyxpQkFBWSxHQUFaLFlBQVksQ0FBYztZQUNwQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ25DLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFsQjdFLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQW1ELENBQUM7WUFLcEUsdUJBQWtCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFnQjNELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNkLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdkQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFUSxPQUFPO1lBQ2YsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUN6RCxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN2QixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVELElBQUksU0FBUztZQUNaLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN4QixDQUFDO1FBRU8sV0FBVyxDQUFDLEtBQWtCO1lBQ3JDLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLGFBQUssQ0FBQyxXQUFXLENBQUM7WUFDakYsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDVixVQUFVLEVBQUUsV0FBVztnQkFDdkIsVUFBVSxFQUFFLFdBQVc7Z0JBQ3ZCLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLHVCQUF1QixDQUFDLElBQUksYUFBSyxDQUFDLFdBQVc7Z0JBQzVGLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLHVCQUF1QixDQUFDO2dCQUNyRSxxQkFBcUIsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsQ0FBQzthQUMzRSxDQUFDLENBQUM7UUFDSixDQUFDO1FBRWtCLFNBQVMsQ0FBQyxTQUFzQjtZQUNsRCxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVqQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyw2QkFBMkIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDMUcsTUFBTSxhQUFhLEdBQUcsR0FBRyxFQUFFO2dCQUMxQixNQUFNLE9BQU8sR0FBYyxFQUFFLENBQUM7Z0JBQzlCLElBQUEseURBQStCLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDMUQsSUFBSSxDQUFDLGdCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsZ0JBQWlCLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDcEUsQ0FBQyxDQUFDO1lBQ0YsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELGFBQWEsRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFUyxTQUFTLENBQUMsTUFBbUI7WUFFdEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUM3RCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksZUFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVoQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRXZDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFFM0IsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoRCxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRTlCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxxQkFBUyxDQUFDLFNBQVMsRUFBRSxFQUFFLFdBQVcsZ0NBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBRXBGLGVBQWU7WUFDZixNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RELGVBQWUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hDLFNBQVMsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDdkMsTUFBTSxhQUFhLEdBQW1CO2dCQUNyQyxvQkFBb0IsRUFBRSxLQUFLO2dCQUMzQixTQUFTLEVBQUU7b0JBQ1YscUJBQXFCLEVBQUUsRUFBRTtvQkFDekIsVUFBVSxFQUFFLE1BQU07b0JBQ2xCLFVBQVUsRUFBRSxJQUFJO29CQUNoQixpQkFBaUIsRUFBRSxLQUFLO29CQUN4QixtQkFBbUIsRUFBRSxLQUFLO29CQUMxQix1QkFBdUIsRUFBRSxLQUFLO2lCQUM5QjtnQkFDRCxrQkFBa0IsRUFBRSxDQUFDO2dCQUNyQixvQkFBb0IsRUFBRSxJQUFJO2dCQUMxQixPQUFPLEVBQUU7b0JBQ1IsT0FBTyxFQUFFLEtBQUs7aUJBQ2Q7YUFDRCxDQUFDO1lBQ0YsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUN2RCxtREFBd0IsRUFDeEIsZUFBZSxFQUNmLGFBQWEsRUFDYixFQUFFLEVBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FDWCxDQUFDO1lBRUYsYUFBYTtZQUNiLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEQsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNyQyxNQUFNLE9BQU8sR0FBK0Q7Z0JBQzNFLE1BQU0sRUFBRSxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUU7Z0JBQzlCLHFCQUFxQixFQUFFLElBQUksU0FBUyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7Z0JBQ2pGLGdCQUFnQixFQUFFLElBQUksU0FBUyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7Z0JBQ3ZFLHdCQUF3QixFQUFFLElBQUk7Z0JBQzlCLGNBQWMsRUFBRTtvQkFDZixjQUFjLEVBQUUsUUFBUSxDQUFDLHlCQUF5QjtpQkFDbEQ7YUFDRCxDQUFDO1lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUNyRCxpQkFBaUIsRUFDakIsbUJBQW1CLEVBQ25CLGFBQWEsRUFDYixJQUFJLFNBQVMsQ0FBQyxlQUFlLEVBQUUsRUFDL0IsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUNuRSxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUN0RixPQUFPLENBQ1AsQ0FBQztZQUVGLGNBQWM7WUFDZCxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztnQkFDdkIsV0FBVyxFQUFFLGFBQUssQ0FBQyxJQUFJO2dCQUN2QixPQUFPLEVBQUUsZUFBZTtnQkFDeEIsV0FBVyxFQUFFLEdBQUc7Z0JBQ2hCLFdBQVcsRUFBRSxNQUFNLENBQUMsU0FBUztnQkFDN0IsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7b0JBQ2pCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDdEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztvQkFDMUQsQ0FBQztnQkFDRixDQUFDO2FBQ0QsRUFBRSxrQkFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRXRCLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO2dCQUN2QixXQUFXLEVBQUUsYUFBSyxDQUFDLElBQUk7Z0JBQ3ZCLE9BQU8sRUFBRSxhQUFhO2dCQUN0QixXQUFXLEVBQUUsR0FBRztnQkFDaEIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxTQUFTO2dCQUM3QixNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtvQkFDakIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUN0QixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDNUMsQ0FBQztnQkFDRixDQUFDO2FBQ0QsRUFBRSxrQkFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRXRCLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRTtnQkFDMUQsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNyQixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDM0UsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixnQkFBZ0I7WUFDaEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFOUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2xELE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3hCLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNaLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUM7b0JBQzlCLFFBQVEsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUc7b0JBQ3hCLE9BQU8sRUFBRSxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsS0FBTSxFQUFFO2lCQUNyQyxDQUFDLENBQUM7WUFFSixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3BELElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSywyQkFBb0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDL0MsT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNmLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDZixJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQzt3QkFDOUIsUUFBUSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUc7d0JBQzVCLE9BQU8sRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtxQkFDbkUsQ0FBQyxDQUFDO2dCQUNKLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDekQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7Z0JBQzdCLHVCQUF1QjtnQkFDdkIsSUFBSSxPQUFPLElBQUksSUFBQSxxQkFBZSxFQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO29CQUNoRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUM7d0JBQzlCLFFBQVEsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUc7d0JBQzFCLE9BQU8sRUFBRSxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO3FCQUNqRSxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sS0FBSyxDQUFDLGNBQWM7WUFDM0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBRWhDLHVDQUF1QztZQUN2QyxNQUFNLE9BQU8sR0FBNEI7Z0JBQ3hDLFdBQVcsRUFBRSwyQkFBMkI7Z0JBQ3hDLFVBQVUsNERBQW9EO2dCQUM5RCxTQUFTLEVBQUUsaUJBQWlCO2dCQUM1QixhQUFhLEVBQUU7b0JBQ2QsS0FBSyxFQUFFLElBQUEsK0JBQWdCLEVBQUMsUUFBUSxDQUFDLDRCQUE0QixDQUFDO29CQUM5RCxRQUFRLEVBQUUseUJBQWlCLENBQUMsTUFBTTtpQkFDbEM7YUFDRCxDQUFDO1lBRUYsSUFBSSxVQUFlLENBQUM7WUFDcEIsSUFBSSxJQUFJLENBQUMsVUFBVSwyREFBcUMsRUFBRSxDQUFDO2dCQUMxRCwwREFBMEQ7Z0JBQzFELFVBQVUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUVoRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsMERBQTBEO2dCQUMxRCxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDL0IsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVFLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7WUFFcEQsMERBQTBEO1lBQzFELE1BQU0sV0FBVyxHQUE0QixFQUFFLENBQUM7WUFDaEQsSUFBSSxTQUE2QixDQUFDO1lBQ2xDLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7WUFDbEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixTQUFTLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1lBQzdFLENBQUM7WUFDRCxLQUFLLE1BQU0sR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUM3QixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssVUFBVSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7b0JBQ2xELFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO29CQUNoRCxTQUFTLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGFBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUUsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsU0FBUywrQkFBdUIsQ0FBQztnQkFDbEUsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLDJCQUEyQixDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNwRixJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEYsQ0FBQztZQUNELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbkMsZ0JBQWdCO1lBQ2hCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLDJEQUFxQztnQkFDakUsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ25FLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QixDQUFDO1FBRUQsV0FBVztZQUNWLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxnQ0FBZ0IsQ0FBQztZQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNkLENBQUM7UUFFRCxXQUFXLENBQUMsT0FBZTtZQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsZ0NBQWdCLENBQUM7WUFDOUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsQixJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQztZQUNsQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDYixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQXlCO1lBRXhDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNiLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUU1RCxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUU1QyxNQUFNLElBQUksR0FBMEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFGLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXRDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2hDLEVBQUU7Z0JBQ0YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSwyREFBcUM7b0JBQ3BFLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxxQkFBcUIsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztvQkFDcEUsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxxQkFBcUIsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFdEUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQywwQkFBYSxDQUFDO2dCQUMzQyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN0RCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDakQsQ0FBQztnQkFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdkIsQ0FBQztRQUNGLENBQUM7UUFFRCxRQUFRO1lBQ1AsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFFRCxVQUFVO1lBQ1QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxLQUFLLENBQUMsZUFBZSxDQUFDLFlBQW9DO1lBQ3pELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDcEMsSUFBSSxLQUFLLElBQUksWUFBWSxLQUFLLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBQ3JFLElBQUksQ0FBQyxVQUFVLEdBQUcsWUFBWSxDQUFDO2dCQUMvQixNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0IsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLO1lBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQ0FBbUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsNEJBQW9CLENBQUM7Z0JBQzNGLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2RSxDQUFDO1FBQ0YsQ0FBQztRQUVrQixRQUFRLENBQUMsS0FBYTtZQUN4QyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdDLENBQUM7UUFDRixDQUFDO1FBRWtCLGFBQWEsQ0FBQyxNQUFjLEVBQUUsS0FBYTtZQUM3RCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLE1BQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDOUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxlQUFTLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN6QyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7Z0JBQ2xHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM5QixJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0QsQ0FBQztRQUNGLENBQUM7O0lBeldXLGtFQUEyQjswQ0FBM0IsMkJBQTJCO1FBbUJyQyxXQUFBLDRCQUFhLENBQUE7UUFDYixXQUFBLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQTtRQUN6QixXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLG1DQUFpQixDQUFBO1FBQ2pCLFdBQUEseUJBQWUsQ0FBQTtRQUNmLFdBQUEsc0JBQVksQ0FBQTtRQUNaLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsWUFBQSxxQ0FBcUIsQ0FBQTtPQTFCWCwyQkFBMkIsQ0EwV3ZDIn0=