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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/async", "vs/base/common/event", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/browser/view/cellParts/cellToolbarStickyScroll", "vs/platform/actions/browser/toolbar", "vs/base/browser/ui/hover/hoverDelegateFactory"], function (require, exports, DOM, toolbar_1, async_1, event_1, menuEntryActionViewItem_1, actions_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, cellActionView_1, cellPart_1, cellToolbarStickyScroll_1, toolbar_2, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellTitleToolbarPart = exports.BetweenCellToolbar = void 0;
    let BetweenCellToolbar = class BetweenCellToolbar extends cellPart_1.CellOverlayPart {
        constructor(_notebookEditor, _titleToolbarContainer, _bottomCellToolbarContainer, instantiationService, contextMenuService, contextKeyService, menuService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._bottomCellToolbarContainer = _bottomCellToolbarContainer;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
        }
        _initialize() {
            if (this._betweenCellToolbar) {
                return this._betweenCellToolbar;
            }
            const betweenCellToolbar = this._register(new toolbar_1.ToolBar(this._bottomCellToolbarContainer, this.contextMenuService, {
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_1.MenuItemAction) {
                        if (this._notebookEditor.notebookOptions.getDisplayOptions().insertToolbarAlignment === 'center') {
                            return this.instantiationService.createInstance(cellActionView_1.CodiconActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                        }
                        else {
                            return this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                        }
                    }
                    return undefined;
                }
            }));
            this._betweenCellToolbar = betweenCellToolbar;
            const menu = this._register(this.menuService.createMenu(this._notebookEditor.creationOptions.menuIds.cellInsertToolbar, this.contextKeyService));
            const updateActions = () => {
                const actions = getCellToolbarActions(menu);
                betweenCellToolbar.setActions(actions.primary, actions.secondary);
            };
            this._register(menu.onDidChange(() => updateActions()));
            this._register(this._notebookEditor.notebookOptions.onDidChangeOptions((e) => {
                if (e.insertToolbarAlignment) {
                    updateActions();
                }
            }));
            updateActions();
            return betweenCellToolbar;
        }
        didRenderCell(element) {
            const betweenCellToolbar = this._initialize();
            betweenCellToolbar.context = {
                ui: true,
                cell: element,
                notebookEditor: this._notebookEditor,
                $mid: 13 /* MarshalledId.NotebookCellActionContext */
            };
            this.updateInternalLayoutNow(element);
        }
        updateInternalLayoutNow(element) {
            const bottomToolbarOffset = element.layoutInfo.bottomToolbarOffset;
            this._bottomCellToolbarContainer.style.transform = `translateY(${bottomToolbarOffset}px)`;
        }
    };
    exports.BetweenCellToolbar = BetweenCellToolbar;
    exports.BetweenCellToolbar = BetweenCellToolbar = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, actions_1.IMenuService)
    ], BetweenCellToolbar);
    let CellTitleToolbarPart = class CellTitleToolbarPart extends cellPart_1.CellOverlayPart {
        get hasActions() {
            if (!this._model) {
                return false;
            }
            return this._model.actions.primary.length
                + this._model.actions.secondary.length
                + this._model.deleteActions.primary.length
                + this._model.deleteActions.secondary.length
                > 0;
        }
        constructor(toolbarContainer, _rootClassDelegate, toolbarId, deleteToolbarId, _notebookEditor, contextKeyService, menuService, instantiationService) {
            super();
            this.toolbarContainer = toolbarContainer;
            this._rootClassDelegate = _rootClassDelegate;
            this.toolbarId = toolbarId;
            this.deleteToolbarId = deleteToolbarId;
            this._notebookEditor = _notebookEditor;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.instantiationService = instantiationService;
            this._onDidUpdateActions = this._register(new event_1.Emitter());
            this.onDidUpdateActions = this._onDidUpdateActions.event;
        }
        _initializeModel() {
            if (this._model) {
                return this._model;
            }
            const titleMenu = this._register(this.menuService.createMenu(this.toolbarId, this.contextKeyService));
            const deleteMenu = this._register(this.menuService.createMenu(this.deleteToolbarId, this.contextKeyService));
            const actions = getCellToolbarActions(titleMenu);
            const deleteActions = getCellToolbarActions(deleteMenu);
            this._model = {
                titleMenu,
                actions,
                deleteMenu,
                deleteActions
            };
            return this._model;
        }
        _initialize(model, element) {
            if (this._view) {
                return this._view;
            }
            const hoverDelegate = this._register((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
            const toolbar = this._register(this.instantiationService.createInstance(toolbar_2.WorkbenchToolBar, this.toolbarContainer, {
                actionViewItemProvider: (action, options) => {
                    return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action, options);
                },
                renderDropdownAsChildElement: true,
                hoverDelegate
            }));
            const deleteToolbar = this._register(this.instantiationService.invokeFunction(accessor => createDeleteToolbar(accessor, this.toolbarContainer, hoverDelegate, 'cell-delete-toolbar')));
            if (model.deleteActions.primary.length !== 0 || model.deleteActions.secondary.length !== 0) {
                deleteToolbar.setActions(model.deleteActions.primary, model.deleteActions.secondary);
            }
            this.setupChangeListeners(toolbar, model.titleMenu, model.actions);
            this.setupChangeListeners(deleteToolbar, model.deleteMenu, model.deleteActions);
            this._view = {
                toolbar,
                deleteToolbar
            };
            return this._view;
        }
        prepareRenderCell(element) {
            this._initializeModel();
        }
        didRenderCell(element) {
            const model = this._initializeModel();
            const view = this._initialize(model, element);
            this.cellDisposables.add((0, cellToolbarStickyScroll_1.registerCellToolbarStickyScroll)(this._notebookEditor, element, this.toolbarContainer, { extraOffset: 4, min: -14 }));
            this.updateContext(view, {
                ui: true,
                cell: element,
                notebookEditor: this._notebookEditor,
                $mid: 13 /* MarshalledId.NotebookCellActionContext */
            });
        }
        updateContext(view, toolbarContext) {
            view.toolbar.context = toolbarContext;
            view.deleteToolbar.context = toolbarContext;
        }
        setupChangeListeners(toolbar, menu, initActions) {
            // #103926
            let dropdownIsVisible = false;
            let deferredUpdate;
            this.updateActions(toolbar, initActions);
            this._register(menu.onDidChange(() => {
                if (dropdownIsVisible) {
                    const actions = getCellToolbarActions(menu);
                    deferredUpdate = () => this.updateActions(toolbar, actions);
                    return;
                }
                const actions = getCellToolbarActions(menu);
                this.updateActions(toolbar, actions);
            }));
            this._rootClassDelegate.toggle('cell-toolbar-dropdown-active', false);
            this._register(toolbar.onDidChangeDropdownVisibility(visible => {
                dropdownIsVisible = visible;
                this._rootClassDelegate.toggle('cell-toolbar-dropdown-active', visible);
                if (deferredUpdate && !visible) {
                    (0, async_1.disposableTimeout)(() => {
                        deferredUpdate?.();
                    }, 0, this._store);
                    deferredUpdate = undefined;
                }
            }));
        }
        updateActions(toolbar, actions) {
            const hadFocus = DOM.isAncestorOfActiveElement(toolbar.getElement());
            toolbar.setActions(actions.primary, actions.secondary);
            if (hadFocus) {
                this._notebookEditor.focus();
            }
            if (actions.primary.length || actions.secondary.length) {
                this._rootClassDelegate.toggle('cell-has-toolbar-actions', true);
                this._onDidUpdateActions.fire();
            }
            else {
                this._rootClassDelegate.toggle('cell-has-toolbar-actions', false);
                this._onDidUpdateActions.fire();
            }
        }
    };
    exports.CellTitleToolbarPart = CellTitleToolbarPart;
    exports.CellTitleToolbarPart = CellTitleToolbarPart = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, actions_1.IMenuService),
        __param(7, instantiation_1.IInstantiationService)
    ], CellTitleToolbarPart);
    function getCellToolbarActions(menu) {
        const primary = [];
        const secondary = [];
        const result = { primary, secondary };
        (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result, g => /^inline/.test(g));
        return result;
    }
    function createDeleteToolbar(accessor, container, hoverDelegate, elementClass) {
        const contextMenuService = accessor.get(contextView_1.IContextMenuService);
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const toolbar = new toolbar_1.ToolBar(container, contextMenuService, {
            getKeyBinding: action => keybindingService.lookupKeybinding(action.id),
            actionViewItemProvider: (action, options) => {
                return (0, menuEntryActionViewItem_1.createActionViewItem)(instantiationService, action, options);
            },
            renderDropdownAsChildElement: true,
            hoverDelegate
        });
        if (elementClass) {
            toolbar.getElement().classList.add(elementClass);
        }
        return toolbar;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbFRvb2xiYXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnRzL2NlbGxUb29sYmFycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QnpGLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsMEJBQWU7UUFHdEQsWUFDa0IsZUFBd0MsRUFDekQsc0JBQW1DLEVBQ2xCLDJCQUF3QyxFQUNqQixvQkFBMkMsRUFDN0Msa0JBQXVDLEVBQ3hDLGlCQUFxQyxFQUMzQyxXQUF5QjtZQUV4RCxLQUFLLEVBQUUsQ0FBQztZQVJTLG9CQUFlLEdBQWYsZUFBZSxDQUF5QjtZQUV4QyxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQWE7WUFDakIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM3Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3hDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDM0MsZ0JBQVcsR0FBWCxXQUFXLENBQWM7UUFHekQsQ0FBQztRQUVPLFdBQVc7WUFDbEIsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUM7WUFDakMsQ0FBQztZQUVELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGlCQUFPLENBQUMsSUFBSSxDQUFDLDJCQUEyQixFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtnQkFDaEgsc0JBQXNCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLEVBQUU7b0JBQzNDLElBQUksTUFBTSxZQUFZLHdCQUFjLEVBQUUsQ0FBQzt3QkFDdEMsSUFBSSxJQUFJLENB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