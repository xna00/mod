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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/collections", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/telemetry/common/telemetry"], function (require, exports, dom_1, mouseEvent_1, toolbar_1, actions_1, arrays_1, collections_1, errors_1, event_1, iterator_1, lifecycle_1, nls_1, menuEntryActionViewItem_1, actions_2, contextkey_1, contextView_1, keybinding_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuWorkbenchToolBar = exports.WorkbenchToolBar = exports.HiddenItemStrategy = void 0;
    var HiddenItemStrategy;
    (function (HiddenItemStrategy) {
        /** This toolbar doesn't support hiding*/
        HiddenItemStrategy[HiddenItemStrategy["NoHide"] = -1] = "NoHide";
        /** Hidden items aren't shown anywhere */
        HiddenItemStrategy[HiddenItemStrategy["Ignore"] = 0] = "Ignore";
        /** Hidden items move into the secondary group */
        HiddenItemStrategy[HiddenItemStrategy["RenderInSecondaryGroup"] = 1] = "RenderInSecondaryGroup";
    })(HiddenItemStrategy || (exports.HiddenItemStrategy = HiddenItemStrategy = {}));
    /**
     * The `WorkbenchToolBar` does
     * - support hiding of menu items
     * - lookup keybindings for each actions automatically
     * - send `workbenchActionExecuted`-events for each action
     *
     * See {@link MenuWorkbenchToolBar} for a toolbar that is backed by a menu.
     */
    let WorkbenchToolBar = class WorkbenchToolBar extends toolbar_1.ToolBar {
        constructor(container, _options, _menuService, _contextKeyService, _contextMenuService, keybindingService, telemetryService) {
            super(container, _contextMenuService, {
                // defaults
                getKeyBinding: (action) => keybindingService.lookupKeybinding(action.id) ?? undefined,
                // options (override defaults)
                ..._options,
                // mandatory (overide options)
                allowContextMenu: true,
                skipTelemetry: typeof _options?.telemetrySource === 'string',
            });
            this._options = _options;
            this._menuService = _menuService;
            this._contextKeyService = _contextKeyService;
            this._contextMenuService = _contextMenuService;
            this._sessionDisposables = this._store.add(new lifecycle_1.DisposableStore());
            // telemetry logic
            const telemetrySource = _options?.telemetrySource;
            if (telemetrySource) {
                this._store.add(this.actionBar.onDidRun(e => telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: telemetrySource })));
            }
        }
        setActions(_primary, _secondary = [], menuIds) {
            this._sessionDisposables.clear();
            const primary = _primary.slice(); // for hiding and overflow we set some items to undefined
            const secondary = _secondary.slice();
            const toggleActions = [];
            let toggleActionsCheckedCount = 0;
            const extraSecondary = [];
            let someAreHidden = false;
            // unless disabled, move all hidden items to secondary group or ignore them
            if (this._options?.hiddenItemStrategy !== -1 /* HiddenItemStrategy.NoHide */) {
                for (let i = 0; i < primary.length; i++) {
                    const action = primary[i];
                    if (!(action instanceof actions_2.MenuItemAction) && !(action instanceof actions_2.SubmenuItemAction)) {
                        // console.warn(`Action ${action.id}/${action.label} is not a MenuItemAction`);
                        continue;
                    }
                    if (!action.hideActions) {
                        continue;
                    }
                    // collect all toggle actions
                    toggleActions.push(action.hideActions.toggle);
                    if (action.hideActions.toggle.checked) {
                        toggleActionsCheckedCount++;
                    }
                    // hidden items move into overflow or ignore
                    if (action.hideActions.isHidden) {
                        someAreHidden = true;
                        primary[i] = undefined;
                        if (this._options?.hiddenItemStrategy !== 0 /* HiddenItemStrategy.Ignore */) {
                            extraSecondary[i] = action;
                        }
                    }
                }
            }
            // count for max
            if (this._options?.overflowBehavior !== undefined) {
                const exemptedIds = (0, collections_1.intersection)(new Set(this._options.overflowBehavior.exempted), iterator_1.Iterable.map(primary, a => a?.id));
                const maxItems = this._options.overflowBehavior.maxItems - exemptedIds.size;
                let count = 0;
                for (let i = 0; i < primary.length; i++) {
                    const action = primary[i];
                    if (!action) {
                        continue;
                    }
                    count++;
                    if (exemptedIds.has(action.id)) {
                        continue;
                    }
                    if (count >= maxItems) {
                        primary[i] = undefined;
                        extraSecondary[i] = action;
                    }
                }
            }
            // coalesce turns Array<IAction|undefined> into IAction[]
            (0, arrays_1.coalesceInPlace)(primary);
            (0, arrays_1.coalesceInPlace)(extraSecondary);
            super.setActions(primary, actions_1.Separator.join(extraSecondary, secondary));
            // add context menu for toggle actions
            if (toggleActions.length > 0) {
                this._sessionDisposables.add((0, dom_1.addDisposableListener)(this.getElement(), 'contextmenu', e => {
                    const event = new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(this.getElement()), e);
                    const action = this.getItemAction(event.target);
                    if (!(action)) {
                        return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    let noHide = false;
                    // last item cannot be hidden when using ignore strategy
                    if (toggleActionsCheckedCount === 1 && this._options?.hiddenItemStrategy === 0 /* HiddenItemStrategy.Ignore */) {
                        noHide = true;
                        for (let i = 0; i < toggleActions.length; i++) {
                            if (toggleActions[i].checked) {
                                toggleActions[i] = (0, actions_1.toAction)({
                                    id: action.id,
                                    label: action.label,
                                    checked: true,
                                    enabled: false,
                                    run() { }
                                });
                                break; // there is only one
                            }
                        }
                    }
                    // add "hide foo" actions
                    let hideAction;
                    if (!noHide && (action instanceof actions_2.MenuItemAction || action instanceof actions_2.SubmenuItemAction)) {
                        if (!action.hideActions) {
                            // no context menu for MenuItemAction instances that support no hiding
                            // those are fake actions and need to be cleaned up
                            return;
                        }
                        hideAction = action.hideActions.hide;
                    }
                    else {
                        hideAction = (0, actions_1.toAction)({
                            id: 'label',
                            label: (0, nls_1.localize)('hide', "Hide"),
                            enabled: false,
                            run() { }
                        });
                    }
                    const actions = actions_1.Separator.join([hideAction], toggleActions);
                    // add "Reset Menu" action
                    if (this._options?.resetMenu && !menuIds) {
                        menuIds = [this._options.resetMenu];
                    }
                    if (someAreHidden && menuIds) {
                        actions.push(new actions_1.Separator());
                        actions.push((0, actions_1.toAction)({
                            id: 'resetThisMenu',
                            label: (0, nls_1.localize)('resetThisMenu', "Reset Menu"),
                            run: () => this._menuService.resetHiddenStates(menuIds)
                        }));
                    }
                    this._contextMenuService.showContextMenu({
                        getAnchor: () => event,
                        getActions: () => actions,
                        // add context menu actions (iff appicable)
                        menuId: this._options?.contextMenu,
                        menuActionOptions: { renderShortTitle: true, ...this._options?.menuOptions },
                        skipTelemetry: typeof this._options?.telemetrySource === 'string',
                        contextKeyService: this._contextKeyService,
                    });
                }));
            }
        }
    };
    exports.WorkbenchToolBar = WorkbenchToolBar;
    exports.WorkbenchToolBar = WorkbenchToolBar = __decorate([
        __param(2, actions_2.IMenuService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, telemetry_1.ITelemetryService)
    ], WorkbenchToolBar);
    /**
     * A {@link WorkbenchToolBar workbench toolbar} that is purely driven from a {@link MenuId menu}-identifier.
     *
     * *Note* that Manual updates via `setActions` are NOT supported.
     */
    let MenuWorkbenchToolBar = class MenuWorkbenchToolBar extends WorkbenchToolBar {
        constructor(container, menuId, options, menuService, contextKeyService, contextMenuService, keybindingService, telemetryService) {
            super(container, { resetMenu: menuId, ...options }, menuService, contextKeyService, contextMenuService, keybindingService, telemetryService);
            this._onDidChangeMenuItems = this._store.add(new event_1.Emitter());
            this.onDidChangeMenuItems = this._onDidChangeMenuItems.event;
            // update logic
            const menu = this._store.add(menuService.createMenu(menuId, contextKeyService, { emitEventsForSubmenuChanges: true }));
            const updateToolbar = () => {
                const primary = [];
                const secondary = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, options?.menuOptions, { primary, secondary }, options?.toolbarOptions?.primaryGroup, options?.toolbarOptions?.shouldInlineSubmenu, options?.toolbarOptions?.useSeparatorsInPrimaryActions);
                container.classList.toggle('has-no-actions', primary.length === 0 && secondary.length === 0);
                super.setActions(primary, secondary);
            };
            this._store.add(menu.onDidChange(() => {
                updateToolbar();
                this._onDidChangeMenuItems.fire(this);
            }));
            updateToolbar();
        }
        /**
         * @deprecated The WorkbenchToolBar does not support this method because it works with menus.
         */
        setActions() {
            throw new errors_1.BugIndicatingError('This toolbar is populated from a menu.');
        }
    };
    exports.MenuWorkbenchToolBar = MenuWorkbenchToolBar;
    exports.MenuWorkbenchToolBar = MenuWorkbenchToolBar = __decorate([
        __param(3, actions_2.IMenuService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, telemetry_1.ITelemetryService)
    ], MenuWorkbenchToolBar);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbGJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYWN0aW9ucy9icm93c2VyL3Rvb2xiYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxJQUFrQixrQkFPakI7SUFQRCxXQUFrQixrQkFBa0I7UUFDbkMseUNBQXlDO1FBQ3pDLGdFQUFXLENBQUE7UUFDWCx5Q0FBeUM7UUFDekMsK0RBQVUsQ0FBQTtRQUNWLGlEQUFpRDtRQUNqRCwrRkFBMEIsQ0FBQTtJQUMzQixDQUFDLEVBUGlCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBT25DO0lBNENEOzs7Ozs7O09BT0c7SUFDSSxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLGlCQUFPO1FBSTVDLFlBQ0MsU0FBc0IsRUFDZCxRQUE4QyxFQUN4QyxZQUEyQyxFQUNyQyxrQkFBdUQsRUFDdEQsbUJBQXlELEVBQzFELGlCQUFxQyxFQUN0QyxnQkFBbUM7WUFFdEQsS0FBSyxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsRUFBRTtnQkFDckMsV0FBVztnQkFDWCxhQUFhLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTO2dCQUNyRiw4QkFBOEI7Z0JBQzlCLEdBQUcsUUFBUTtnQkFDWCw4QkFBOEI7Z0JBQzlCLGdCQUFnQixFQUFFLElBQUk7Z0JBQ3RCLGFBQWEsRUFBRSxPQUFPLFFBQVEsRUFBRSxlQUFlLEtBQUssUUFBUTthQUM1RCxDQUFDLENBQUM7WUFmSyxhQUFRLEdBQVIsUUFBUSxDQUFzQztZQUN2QixpQkFBWSxHQUFaLFlBQVksQ0FBYztZQUNwQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ3JD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