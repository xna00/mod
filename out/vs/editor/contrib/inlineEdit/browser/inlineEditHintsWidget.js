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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/platform", "vs/editor/common/core/position", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/telemetry/common/telemetry", "vs/css!./inlineEditHintsWidget"], function (require, exports, dom_1, keybindingLabel_1, actions_1, arrays_1, lifecycle_1, observable_1, platform_1, position_1, menuEntryActionViewItem_1, toolbar_1, actions_2, contextkey_1, contextView_1, instantiation_1, keybinding_1, telemetry_1) {
    "use strict";
    var InlineEditHintsContentWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomizedMenuWorkbenchToolBar = exports.InlineEditHintsContentWidget = exports.InlineEditHintsWidget = void 0;
    let InlineEditHintsWidget = class InlineEditHintsWidget extends lifecycle_1.Disposable {
        constructor(editor, model, instantiationService) {
            super();
            this.editor = editor;
            this.model = model;
            this.instantiationService = instantiationService;
            this.alwaysShowToolbar = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(63 /* EditorOption.inlineEdit */).showToolbar === 'always');
            this.sessionPosition = undefined;
            this.position = (0, observable_1.derived)(this, reader => {
                const ghostText = this.model.read(reader)?.widget.model.ghostText.read(reader);
                if (!this.alwaysShowToolbar.read(reader) || !ghostText || ghostText.parts.length === 0) {
                    this.sessionPosition = undefined;
                    return null;
                }
                const firstColumn = ghostText.parts[0].column;
                if (this.sessionPosition && this.sessionPosition.lineNumber !== ghostText.lineNumber) {
                    this.sessionPosition = undefined;
                }
                const position = new position_1.Position(ghostText.lineNumber, Math.min(firstColumn, this.sessionPosition?.column ?? Number.MAX_SAFE_INTEGER));
                this.sessionPosition = position;
                return position;
            });
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description setup content widget */
                const model = this.model.read(reader);
                if (!model || !this.alwaysShowToolbar.read(reader)) {
                    return;
                }
                const contentWidget = store.add(this.instantiationService.createInstance(InlineEditHintsContentWidget, this.editor, true, this.position));
                editor.addContentWidget(contentWidget);
                store.add((0, lifecycle_1.toDisposable)(() => editor.removeContentWidget(contentWidget)));
            }));
        }
    };
    exports.InlineEditHintsWidget = InlineEditHintsWidget;
    exports.InlineEditHintsWidget = InlineEditHintsWidget = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], InlineEditHintsWidget);
    let InlineEditHintsContentWidget = class InlineEditHintsContentWidget extends lifecycle_1.Disposable {
        static { InlineEditHintsContentWidget_1 = this; }
        static { this._dropDownVisible = false; }
        static get dropDownVisible() { return this._dropDownVisible; }
        static { this.id = 0; }
        constructor(editor, withBorder, _position, instantiationService, _contextKeyService, _menuService) {
            super();
            this.editor = editor;
            this.withBorder = withBorder;
            this._position = _position;
            this._contextKeyService = _contextKeyService;
            this._menuService = _menuService;
            this.id = `InlineEditHintsContentWidget${InlineEditHintsContentWidget_1.id++}`;
            this.allowEditorOverflow = true;
            this.suppressMouseDown = false;
            this.nodes = (0, dom_1.h)('div.inlineEditHints', { className: this.withBorder ? '.withBorder' : '' }, [
                (0, dom_1.h)('div@toolBar'),
            ]);
            this.inlineCompletionsActionsMenus = this._register(this._menuService.createMenu(actions_2.MenuId.InlineEditActions, this._contextKeyService));
            this.toolBar = this._register(instantiationService.createInstance(CustomizedMenuWorkbenchToolBar, this.nodes.toolBar, this.editor, actions_2.MenuId.InlineEditToolbar, {
                menuOptions: { renderShortTitle: true },
                toolbarOptions: { primaryGroup: g => g.startsWith('primary') },
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_2.MenuItemAction) {
                        return instantiationService.createInstance(StatusBarViewItem, action, undefined);
                    }
                    return undefined;
                },
                telemetrySource: 'InlineEditToolbar',
            }));
            this._register(this.toolBar.onDidChangeDropdownVisibility(e => {
                InlineEditHintsContentWidget_1._dropDownVisible = e;
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update position */
                this._position.read(reader);
                this.editor.layoutContentWidget(this);
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description actions menu */
                const extraActions = [];
                for (const [_, group] of this.inlineCompletionsActionsMenus.getActions()) {
                    for (const action of group) {
                        if (action instanceof actions_2.MenuItemAction) {
                            extraActions.push(action);
                        }
                    }
                }
                if (extraActions.length > 0) {
                    extraActions.unshift(new actions_1.Separator());
                }
                this.toolBar.setAdditionalSecondaryActions(extraActions);
            }));
        }
        getId() { return this.id; }
        getDomNode() {
            return this.nodes.root;
        }
        getPosition() {
            return {
                position: this._position.get(),
                preference: [1 /* ContentWidgetPositionPreference.ABOVE */, 2 /* ContentWidgetPositionPreference.BELOW */],
                positionAffinity: 3 /* PositionAffinity.LeftOfInjectedText */,
            };
        }
    };
    exports.InlineEditHintsContentWidget = InlineEditHintsContentWidget;
    exports.InlineEditHintsContentWidget = InlineEditHintsContentWidget = InlineEditHintsContentWidget_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, actions_2.IMenuService)
    ], InlineEditHintsContentWidget);
    class StatusBarViewItem extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
        updateLabel() {
            const kb = this._keybindingService.lookupKeybinding(this._action.id, this._contextKeyService);
            if (!kb) {
                return super.updateLabel();
            }
            if (this.label) {
                const div = (0, dom_1.h)('div.keybinding').root;
                const k = this._register(new keybindingLabel_1.KeybindingLabel(div, platform_1.OS, { disableTitle: true, ...keybindingLabel_1.unthemedKeybindingLabelOptions }));
                k.set(kb);
                this.label.textContent = this._action.label;
                this.label.appendChild(div);
                this.label.classList.add('inlineEditStatusBarItemLabel');
            }
        }
        updateTooltip() {
            // NOOP, disable tooltip
        }
    }
    let CustomizedMenuWorkbenchToolBar = class CustomizedMenuWorkbenchToolBar extends toolbar_1.WorkbenchToolBar {
        constructor(container, editor, menuId, options2, menuService, contextKeyService, contextMenuService, keybindingService, telemetryService) {
            super(container, { resetMenu: menuId, ...options2 }, menuService, contextKeyService, contextMenuService, keybindingService, telemetryService);
            this.editor = editor;
            this.menuId = menuId;
            this.options2 = options2;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.menu = this._store.add(this.menuService.createMenu(this.menuId, this.contextKeyService, { emitEventsForSubmenuChanges: true }));
            this.additionalActions = [];
            this.prependedPrimaryActions = [];
            this._store.add(this.menu.onDidChange(() => this.updateToolbar()));
            this._store.add(this.editor.onDidChangeCursorPosition(() => this.updateToolbar()));
            this.updateToolbar();
        }
        updateToolbar() {
            const primary = [];
            const secondary = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, this.options2?.menuOptions, { primary, secondary }, this.options2?.toolbarOptions?.primaryGroup, this.options2?.toolbarOptions?.shouldInlineSubmenu, this.options2?.toolbarOptions?.useSeparatorsInPrimaryActions);
            secondary.push(...this.additionalActions);
            primary.unshift(...this.prependedPrimaryActions);
            this.setActions(primary, secondary);
        }
        setPrependedPrimaryActions(actions) {
            if ((0, arrays_1.equals)(this.prependedPrimaryActions, actions, (a, b) => a === b)) {
                return;
            }
            this.prependedPrimaryActions = actions;
            this.updateToolbar();
        }
        setAdditionalSecondaryActions(actions) {
            if ((0, arrays_1.equals)(this.additionalActions, actions, (a, b) => a === b)) {
                return;
            }
            this.additionalActions = actions;
            this.updateToolbar();
        }
    };
    exports.CustomizedMenuWorkbenchToolBar = CustomizedMenuWorkbenchToolBar;
    exports.CustomizedMenuWorkbenchToolBar = CustomizedMenuWorkbenchToolBar = __decorate([
        __param(4, actions_2.IMenuService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, telemetry_1.ITelemetryService)
    ], CustomizedMenuWorkbenchToolBar);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lRWRpdEhpbnRzV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVFZGl0L2Jyb3dzZXIvaW5saW5lRWRpdEhpbnRzV2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF3QnpGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7UUF1QnBELFlBQ2tCLE1BQW1CLEVBQ25CLEtBQWdELEVBQzFDLG9CQUE0RDtZQUVuRixLQUFLLEVBQUUsQ0FBQztZQUpTLFdBQU0sR0FBTixNQUFNLENBQWE7WUFDbkIsVUFBSyxHQUFMLEtBQUssQ0FBMkM7WUFDekIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQXpCbkUsc0JBQWlCLEdBQUcsSUFBQSxnQ0FBbUIsRUFBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxrQ0FBeUIsQ0FBQyxXQUFXLEtBQUssUUFBUSxDQUFDLENBQUM7WUFFdEssb0JBQWUsR0FBeUIsU0FBUyxDQUFDO1lBRXpDLGFBQVEsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNsRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRS9FLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxL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