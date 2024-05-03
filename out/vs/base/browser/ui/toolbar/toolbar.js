/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./toolbar"], function (require, exports, actionbar_1, dropdownActionViewItem_1, actions_1, codicons_1, themables_1, event_1, lifecycle_1, nls, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleMenuAction = exports.ToolBar = void 0;
    /**
     * A widget that combines an action bar for primary actions and a dropdown for secondary actions.
     */
    class ToolBar extends lifecycle_1.Disposable {
        constructor(container, contextMenuProvider, options = { orientation: 0 /* ActionsOrientation.HORIZONTAL */ }) {
            super();
            this.submenuActionViewItems = [];
            this.hasSecondaryActions = false;
            this._onDidChangeDropdownVisibility = this._register(new event_1.EventMultiplexer());
            this.onDidChangeDropdownVisibility = this._onDidChangeDropdownVisibility.event;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            options.hoverDelegate = options.hoverDelegate ?? this._register((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
            this.options = options;
            this.lookupKeybindings = typeof this.options.getKeyBinding === 'function';
            this.toggleMenuAction = this._register(new ToggleMenuAction(() => this.toggleMenuActionViewItem?.show(), options.toggleMenuTitle));
            this.element = document.createElement('div');
            this.element.className = 'monaco-toolbar';
            container.appendChild(this.element);
            this.actionBar = this._register(new actionbar_1.ActionBar(this.element, {
                orientation: options.orientation,
                ariaLabel: options.ariaLabel,
                actionRunner: options.actionRunner,
                allowContextMenu: options.allowContextMenu,
                highlightToggledItems: options.highlightToggledItems,
                hoverDelegate: options.hoverDelegate,
                actionViewItemProvider: (action, viewItemOptions) => {
                    if (action.id === ToggleMenuAction.ID) {
                        this.toggleMenuActionViewItem = new dropdownActionViewItem_1.DropdownMenuActionViewItem(action, action.menuActions, contextMenuProvider, {
                            actionViewItemProvider: this.options.actionViewItemProvider,
                            actionRunner: this.actionRunner,
                            keybindingProvider: this.options.getKeyBinding,
                            classNames: themables_1.ThemeIcon.asClassNameArray(options.moreIcon ?? codicons_1.Codicon.toolBarMore),
                            anchorAlignmentProvider: this.options.anchorAlignmentProvider,
                            menuAsChild: !!this.options.renderDropdownAsChildElement,
                            skipTelemetry: this.options.skipTelemetry,
                            isMenu: true,
                            hoverDelegate: this.options.hoverDelegate
                        });
                        this.toggleMenuActionViewItem.setActionContext(this.actionBar.context);
                        this.disposables.add(this._onDidChangeDropdownVisibility.add(this.toggleMenuActionViewItem.onDidChangeVisibility));
                        return this.toggleMenuActionViewItem;
                    }
                    if (options.actionViewItemProvider) {
                        const result = options.actionViewItemProvider(action, viewItemOptions);
                        if (result) {
                            return result;
                        }
                    }
                    if (action instanceof actions_1.SubmenuAction) {
                        const result = new dropdownActionViewItem_1.DropdownMenuActionViewItem(action, action.actions, contextMenuProvider, {
                            actionViewItemProvider: this.options.actionViewItemProvider,
                            actionRunner: this.actionRunner,
                            keybindingProvider: this.options.getKeyBinding,
                            classNames: action.class,
                            anchorAlignmentProvider: this.options.anchorAlignmentProvider,
                            menuAsChild: !!this.options.renderDropdownAsChildElement,
                            skipTelemetry: this.options.skipTelemetry,
                            hoverDelegate: this.options.hoverDelegate
                        });
                        result.setActionContext(this.actionBar.context);
                        this.submenuActionViewItems.push(result);
                        this.disposables.add(this._onDidChangeDropdownVisibility.add(result.onDidChangeVisibility));
                        return result;
                    }
                    return undefined;
                }
            }));
        }
        set actionRunner(actionRunner) {
            this.actionBar.actionRunner = actionRunner;
        }
        get actionRunner() {
            return this.actionBar.actionRunner;
        }
        set context(context) {
            this.actionBar.context = context;
            this.toggleMenuActionViewItem?.setActionContext(context);
            for (const actionViewItem of this.submenuActionViewItems) {
                actionViewItem.setActionContext(context);
            }
        }
        getElement() {
            return this.element;
        }
        focus() {
            this.actionBar.focus();
        }
        getItemsWidth() {
            let itemsWidth = 0;
            for (let i = 0; i < this.actionBar.length(); i++) {
                itemsWidth += this.actionBar.getWidth(i);
            }
            return itemsWidth;
        }
        getItemAction(indexOrElement) {
            return this.actionBar.getAction(indexOrElement);
        }
        getItemWidth(index) {
            return this.actionBar.getWidth(index);
        }
        getItemsLength() {
            return this.actionBar.length();
        }
        setAriaLabel(label) {
            this.actionBar.setAriaLabel(label);
        }
        setActions(primaryActions, secondaryActions) {
            this.clear();
            const primaryActionsToSet = primaryActions ? primaryActions.slice(0) : [];
            // Inject additional action to open secondary actions if present
            this.hasSecondaryActions = !!(secondaryActions && secondaryActions.length > 0);
            if (this.hasSecondaryActions && secondaryActions) {
                this.toggleMenuAction.menuActions = secondaryActions.slice(0);
                primaryActionsToSet.push(this.toggleMenuAction);
            }
            primaryActionsToSet.forEach(action => {
                this.actionBar.push(action, { icon: true, label: false, keybinding: this.getKeybindingLabel(action) });
            });
        }
        isEmpty() {
            return this.actionBar.isEmpty();
        }
        getKeybindingLabel(action) {
            const key = this.lookupKeybindings ? this.options.getKeyBinding?.(action) : undefined;
            return key?.getLabel() ?? undefined;
        }
        clear() {
            this.submenuActionViewItems = [];
            this.disposables.clear();
            this.actionBar.clear();
        }
        dispose() {
            this.clear();
            this.disposables.dispose();
            super.dispose();
        }
    }
    exports.ToolBar = ToolBar;
    class ToggleMenuAction extends actions_1.Action {
        static { this.ID = 'toolbar.toggle.more'; }
        constructor(toggleDropdownMenu, title) {
            title = title || nls.localize('moreActions', "More Actions...");
            super(ToggleMenuAction.ID, title, undefined, true);
            this._menuActions = [];
            this.toggleDropdownMenu = toggleDropdownMenu;
        }
        async run() {
            this.toggleDropdownMenu();
        }
        get menuActions() {
            return this._menuActions;
        }
        set menuActions(actions) {
            this._menuActions = actions;
        }
    }
    exports.ToggleMenuAction = ToggleMenuAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbGJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL3Rvb2xiYXIvdG9vbGJhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1Q2hHOztPQUVHO0lBQ0gsTUFBYSxPQUFRLFNBQVEsc0JBQVU7UUFjdEMsWUFBWSxTQUFzQixFQUFFLG1CQUF5QyxFQUFFLFVBQTJCLEVBQUUsV0FBVyx1Q0FBK0IsRUFBRTtZQUN2SixLQUFLLEVBQUUsQ0FBQztZQVZELDJCQUFzQixHQUFpQyxFQUFFLENBQUM7WUFDMUQsd0JBQW1CLEdBQVksS0FBSyxDQUFDO1lBSXJDLG1DQUE4QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsRUFBVyxDQUFDLENBQUM7WUFDaEYsa0NBQTZCLEdBQUcsSUFBSSxDQUFDLDhCQUE4QixDQUFDLEtBQUssQ0FBQztZQUMzRSxnQkFBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUszRCxPQUFPLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLGlEQUEwQixHQUFFLENBQUMsQ0FBQztZQUM5RixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN2QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsS0FBSyxVQUFVLENBQUM7WUFFMUUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxFQUFFLEVBQUUsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENB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