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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/platform", "vs/base/common/themables", "vs/editor/common/core/position", "vs/editor/common/languages", "vs/editor/contrib/inlineCompletions/browser/commandIds", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/iconRegistry", "vs/css!./inlineCompletionsHintsWidget"], function (require, exports, dom_1, actionViewItems_1, keybindingLabel_1, actions_1, arrays_1, async_1, codicons_1, lifecycle_1, observable_1, platform_1, themables_1, position_1, languages_1, commandIds_1, nls_1, menuEntryActionViewItem_1, toolbar_1, actions_2, commands_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, telemetry_1, iconRegistry_1) {
    "use strict";
    var InlineSuggestionHintsContentWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomizedMenuWorkbenchToolBar = exports.InlineSuggestionHintsContentWidget = exports.InlineCompletionsHintsWidget = void 0;
    let InlineCompletionsHintsWidget = class InlineCompletionsHintsWidget extends lifecycle_1.Disposable {
        constructor(editor, model, instantiationService) {
            super();
            this.editor = editor;
            this.model = model;
            this.instantiationService = instantiationService;
            this.alwaysShowToolbar = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(62 /* EditorOption.inlineSuggest */).showToolbar === 'always');
            this.sessionPosition = undefined;
            this.position = (0, observable_1.derived)(this, reader => {
                const ghostText = this.model.read(reader)?.primaryGhostText.read(reader);
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
                const contentWidget = store.add(this.instantiationService.createInstance(InlineSuggestionHintsContentWidget, this.editor, true, this.position, model.selectedInlineCompletionIndex, model.inlineCompletionsCount, model.selectedInlineCompletion.map(v => /** @description commands */ v?.inlineCompletion.source.inlineCompletions.commands ?? [])));
                editor.addContentWidget(contentWidget);
                store.add((0, lifecycle_1.toDisposable)(() => editor.removeContentWidget(contentWidget)));
                store.add((0, observable_1.autorun)(reader => {
                    /** @description request explicit */
                    const position = this.position.read(reader);
                    if (!position) {
                        return;
                    }
                    if (model.lastTriggerKind.read(reader) !== languages_1.InlineCompletionTriggerKind.Explicit) {
                        model.triggerExplicitly();
                    }
                }));
            }));
        }
    };
    exports.InlineCompletionsHintsWidget = InlineCompletionsHintsWidget;
    exports.InlineCompletionsHintsWidget = InlineCompletionsHintsWidget = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], InlineCompletionsHintsWidget);
    const inlineSuggestionHintsNextIcon = (0, iconRegistry_1.registerIcon)('inline-suggestion-hints-next', codicons_1.Codicon.chevronRight, (0, nls_1.localize)('parameterHintsNextIcon', 'Icon for show next parameter hint.'));
    const inlineSuggestionHintsPreviousIcon = (0, iconRegistry_1.registerIcon)('inline-suggestion-hints-previous', codicons_1.Codicon.chevronLeft, (0, nls_1.localize)('parameterHintsPreviousIcon', 'Icon for show previous parameter hint.'));
    let InlineSuggestionHintsContentWidget = class InlineSuggestionHintsContentWidget extends lifecycle_1.Disposable {
        static { InlineSuggestionHintsContentWidget_1 = this; }
        static { this._dropDownVisible = false; }
        static get dropDownVisible() { return this._dropDownVisible; }
        static { this.id = 0; }
        createCommandAction(commandId, label, iconClassName) {
            const action = new actions_1.Action(commandId, label, iconClassName, true, () => this._commandService.executeCommand(commandId));
            const kb = this.keybindingService.lookupKeybinding(commandId, this._contextKeyService);
            let tooltip = label;
            if (kb) {
                tooltip = (0, nls_1.localize)({ key: 'content', comment: ['A label', 'A keybinding'] }, '{0} ({1})', label, kb.getLabel());
            }
            action.tooltip = tooltip;
            return action;
        }
        constructor(editor, withBorder, _position, _currentSuggestionIdx, _suggestionCount, _extraCommands, _commandService, instantiationService, keybindingService, _contextKeyService, _menuService) {
            super();
            this.editor = editor;
            this.withBorder = withBorder;
            this._position = _position;
            this._currentSuggestionIdx = _currentSuggestionIdx;
            this._suggestionCount = _suggestionCount;
            this._extraCommands = _extraCommands;
            this._commandService = _commandService;
            this.keybindingService = keybindingService;
            this._contextKeyService = _contextKeyService;
            this._menuService = _menuService;
            this.id = `InlineSuggestionHintsContentWidget${InlineSuggestionHintsContentWidget_1.id++}`;
            this.allowEditorOverflow = true;
            this.suppressMouseDown = false;
            this.nodes = (0, dom_1.h)('div.inlineSuggestionsHints', { className: this.withBorder ? '.withBorder' : '' }, [
                (0, dom_1.h)('div@toolBar'),
            ]);
            this.previousAction = this.createCommandAction(commandIds_1.showPreviousInlineSuggestionActionId, (0, nls_1.localize)('previous', 'Previous'), themables_1.ThemeIcon.asClassName(inlineSuggestionHintsPreviousIcon));
            this.availableSuggestionCountAction = new actions_1.Action('inlineSuggestionHints.availableSuggestionCount', '', undefined, false);
            this.nextAction = this.createCommandAction(commandIds_1.showNextInlineSuggestionActionId, (0, nls_1.localize)('next', 'Next'), themables_1.ThemeIcon.asClassName(inlineSuggestionHintsNextIcon));
            // TODO@hediet: deprecate MenuId.InlineCompletionsActions
            this.inlineCompletionsActionsMenus = this._register(this._menuService.createMenu(actions_2.MenuId.InlineCompletionsActions, this._contextKeyService));
            this.clearAvailableSuggestionCountLabelDebounced = this._register(new async_1.RunOnceScheduler(() => {
                this.availableSuggestionCountAction.label = '';
            }, 100));
            this.disableButtonsDebounced = this._register(new async_1.RunOnceScheduler(() => {
                this.previousAction.enabled = this.nextAction.enabled = false;
            }, 100));
            this.lastCommands = [];
            this.toolBar = this._register(instantiationService.createInstance(CustomizedMenuWorkbenchToolBar, this.nodes.toolBar, actions_2.MenuId.InlineSuggestionToolbar, {
                menuOptions: { renderShortTitle: true },
                toolbarOptions: { primaryGroup: g => g.startsWith('primary') },
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_2.MenuItemAction) {
                        return instantiationService.createInstance(StatusBarViewItem, action, undefined);
                    }
                    if (action === this.availableSuggestionCountAction) {
                        const a = new ActionViewItemWithClassName(undefined, action, { label: true, icon: false });
                        a.setClass('availableSuggestionCount');
                        return a;
                    }
                    return undefined;
                },
                telemetrySource: 'InlineSuggestionToolbar',
            }));
            this.toolBar.setPrependedPrimaryActions([
                this.previousAction,
                this.availableSuggestionCountAction,
                this.nextAction,
            ]);
            this._register(this.toolBar.onDidChangeDropdownVisibility(e => {
                InlineSuggestionHintsContentWidget_1._dropDownVisible = e;
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update position */
                this._position.read(reader);
                this.editor.layoutContentWidget(this);
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description counts */
                const suggestionCount = this._suggestionCount.read(reader);
                const currentSuggestionIdx = this._currentSuggestionIdx.read(reader);
                if (suggestionCount !== undefined) {
                    this.clearAvailableSuggestionCountLabelDebounced.cancel();
                    this.availableSuggestionCountAction.label = `${currentSuggestionIdx + 1}/${suggestionCount}`;
                }
                else {
                    this.clearAvailableSuggestionCountLabelDebounced.schedule();
                }
                if (suggestionCount !== undefined && suggestionCount > 1) {
                    this.disableButtonsDebounced.cancel();
                    this.previousAction.enabled = this.nextAction.enabled = true;
                }
                else {
                    this.disableButtonsDebounced.schedule();
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description extra commands */
                const extraCommands = this._extraCommands.read(reader);
                if ((0, arrays_1.equals)(this.lastCommands, extraCommands)) {
                    // nothing to update
                    return;
                }
                this.lastCommands = extraCommands;
                const extraActions = extraCommands.map(c => ({
                    class: undefined,
                    id: c.id,
                    enabled: true,
                    tooltip: c.tooltip || '',
                    label: c.title,
                    run: (event) => {
                        return this._commandService.executeCommand(c.id);
                    },
                }));
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
    exports.InlineSuggestionHintsContentWidget = InlineSuggestionHintsContentWidget;
    exports.InlineSuggestionHintsContentWidget = InlineSuggestionHintsContentWidget = InlineSuggestionHintsContentWidget_1 = __decorate([
        __param(6, commands_1.ICommandService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, actions_2.IMenuService)
    ], InlineSuggestionHintsContentWidget);
    class ActionViewItemWithClassName extends actionViewItems_1.ActionViewItem {
        constructor() {
            super(...arguments);
            this._className = undefined;
        }
        setClass(className) {
            this._className = className;
        }
        render(container) {
            super.render(container);
            if (this._className) {
                container.classList.add(this._className);
            }
        }
        updateTooltip() {
            // NOOP, disable tooltip
        }
    }
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
                this.label.classList.add('inlineSuggestionStatusBarItemLabel');
            }
        }
        updateTooltip() {
            // NOOP, disable tooltip
        }
    }
    let CustomizedMenuWorkbenchToolBar = class CustomizedMenuWorkbenchToolBar extends toolbar_1.WorkbenchToolBar {
        constructor(container, menuId, options2, menuService, contextKeyService, contextMenuService, keybindingService, telemetryService) {
            super(container, { resetMenu: menuId, ...options2 }, menuService, contextKeyService, contextMenuService, keybindingService, telemetryService);
            this.menuId = menuId;
            this.options2 = options2;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.menu = this._store.add(this.menuService.createMenu(this.menuId, this.contextKeyService, { emitEventsForSubmenuChanges: true }));
            this.additionalActions = [];
            this.prependedPrimaryActions = [];
            this._store.add(this.menu.onDidChange(() => this.updateToolbar()));
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
        __param(3, actions_2.IMenuService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, telemetry_1.ITelemetryService)
    ], CustomizedMenuWorkbenchToolBar);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ29tcGxldGlvbnNIaW50c1dpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5saW5lQ29tcGxldGlvbnMvYnJvd3Nlci9pbmxpbmVDb21wbGV0aW9uc0hpbnRzV2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFpQ3pGLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTZCLFNBQVEsc0JBQVU7UUF1QjNELFlBQ2tCLE1BQW1CLEVBQ25CLEtBQXNELEVBQ2hELG9CQUE0RDtZQUVuRixLQUFLLEVBQUUsQ0FBQztZQUpTLFdBQU0sR0FBTixNQUFNLENBQWE7WUFDbkIsVUFBSyxHQUFMLEtBQUssQ0FBaUQ7WUFDL0IseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQXpCbkUsc0JBQWlCLEdBQUcsSUFBQSxnQ0FBbUIsRUFBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxxQ0FBNEIsQ0FBQyxXQUFXLEtBQUssUUFBUSxDQUFDLENBQUM7WUFFekssb0JBQWUsR0FBeUIsU0FBUyxDQUFDO1lBRXpDLGFBQVEsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNsRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRXpFLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN4RixJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQztvQkFDakMsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFFRCxNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztnQkFDOUMsSUFBSSxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDdEYsSUFBSSxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUM7Z0JBQ2xDLENBQUM7Z0JBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxtQkFBUSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxNQUFNLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztnQkFDcEksSUFBSSxDQUFDLGVBQWUsR0FBRyxRQUFRLENBQUM7Z0JBQ2hDLE9BQU8sUUFBUSxDQUFDO1lBQ2pCLENBQUMsQ0FBQyxDQUFDO1lBU0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLDZCQUFnQixFQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNqRCx3Q0FBd0M7Z0JBQ3hDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN0QyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUNwRCxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUN2RSxrQ0FBa0MsRUFDbEMsSUFBSSxDQUFDLE1BQU0sRUFDWCxJQUFJLEVBQ0osSUFBSSxDQUFDLFFBQVEsRUFDYixLQUFLLENBQUMsNkJBQTZCLEVBQ25DLEtBQUssQ0FBQyxzQkFBc0IsRUFDNUIsS0FBSyxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLDRCQUE0QixDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxDQUNqSSxDQUFDLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUN2QyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUV6RSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUEsb0JBQU8sRUFBQyxNQUFNLENBQUMsRUFBRTtvQkFDMUIsb0NBQW9DO29CQUNwQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDNUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUNmLE9BQU87b0JBQ1IsQ0FBQztvQkFDRCxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLHVDQUEyQixDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUNqRixLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDM0IsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRCxDQUFBO0lBN0RZLG9FQUE0QjsyQ0FBNUIsNEJBQTRCO1FBMEJ0QyxXQUFBLHFDQUFxQixDQUFBO09BMUJYLDRCQUE0QixDQTZEeEM7SUFFRCxNQUFNLDZCQUE2QixHQUFHLElBQUEsMkJBQVksRUFBQyw4QkFBOEIsRUFBRSxrQkFBTyxDQUFDLFlBQVksRUFBRSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDLENBQUM7SUFDbkwsTUFBTSxpQ0FBaUMsR0FBRyxJQUFBLDJCQUFZLEVBQUMsa0NBQWtDLEVBQUUsa0JBQU8sQ0FBQyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsd0NBQXdDLENBQUMsQ0FBQyxDQUFDO0lBRTNMLElBQU0sa0NBQWtDLEdBQXhDLE1BQU0sa0NBQW1DLFNBQVEsc0JBQVU7O2lCQUNsRCxxQkFBZ0IsR0FBRyxLQUFLLEFBQVIsQ0FBUztRQUNqQyxNQUFNLEtBQUssZUFBZSxLQUFLLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztpQkFFdEQsT0FBRSxHQUFHLENBQUMsQUFBSixDQUFLO1FBVWQsbUJBQW1CLENBQUMsU0FBaUIsRUFBRSxLQUFhLEVBQUUsYUFBcUI7WUFDbEYsTUFBTSxNQUFNLEdBQUcsSUFBSSxnQkFBTSxDQUN4QixTQUFTLEVBQ1QsS0FBSyxFQUNMLGFBQWEsRUFDYixJQUFJLEVBQ0osR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQ3BELENBQUM7WUFDRixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLEVBQUUsRUFBRSxDQUFDO2dCQUNSLE9BQU8sR0FBRyxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxFQUFFLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNqSCxDQUFDO1lBQ0QsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDekIsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBd0JELFlBQ2tCLE1BQW1CLEVBQ25CLFVBQW1CLEVBQ25CLFNBQXVDLEVBQ3ZDLHFCQUEwQyxFQUMxQyxnQkFBaUQsRUFDakQsY0FBc0MsRUFFdEMsZUFBaUQsRUFDM0Msb0JBQTJDLEVBQzlDLGlCQUFzRCxFQUN0RCxrQkFBdUQsRUFDN0QsWUFBMkM7WUFFekQsS0FBSyxFQUFFLENBQUM7WUFiUyxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBQ25CLGVBQVUsR0FBVixVQUFVLENBQVM7WUFDbkIsY0FBUyxHQUFULFNBQVMsQ0FBOEI7WUFDdkMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUFxQjtZQUMxQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWlDO1lBQ2pELG1CQUFjLEdBQWQsY0FBYyxDQUF3QjtZQUVyQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFFN0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNyQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQzVDLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBM0R6QyxPQUFFLEdBQUcscUNBQXFDLG9DQUFrQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFDckYsd0JBQW1CLEdBQUcsSUFBSSxDQUFDO1lBQzNCLHNCQUFpQixHQUFHLEtBQUssQ0FBQztZQUV6QixVQUFLLEdBQUcsSUFBQSxPQUFDLEVBQUMsNEJBQTRCLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRTtnQkFDN0csSUFBQSxPQUFDLEVBQUMsYUFBYSxDQUFDO2FBQ2hCLENBQUMsQ0FBQztZQW1CYyxtQkFBYyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxpREFBb0MsRUFBRSxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLEVBQUUscUJBQVMsQ0FBQyxXQUFXLENBQUMsaUNBQWlDLENBQUMsQ0FBQyxDQUFDO1lBQzVLLG1DQUE4QixHQUFHLElBQUksZ0JBQU0sQ0FBQyxnREFBZ0QsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BILGVBQVUsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsNkNBQWdDLEVBQUUsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLHFCQUFTLENBQUMsV0FBVyxDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FBQztZQUl6Syx5REFBeUQ7WUFDeEMsa0NBQTZCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FDM0YsZ0JBQU0sQ0FBQyx3QkFBd0IsRUFDL0IsSUFBSSxDQUFDLGtCQUFrQixDQUN2QixDQUFDLENBQUM7WUFFYyxnREFBMkMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFO2dCQUN2RyxJQUFJLENBQUMsOEJBQThCLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNoRCxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVRLDRCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQ25GLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUMvRCxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVELGlCQUFZLEdBQWMsRUFBRSxDQUFDO1lBa0JwQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDhCQUE4QixFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLGdCQUFNLENBQUMsdUJBQXVCLEVBQUU7Z0JBQ3JKLFdBQVcsRUFBRSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRTtnQkFDdkMsY0FBYyxFQUFFLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDOUQsc0JBQXNCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLEVBQUU7b0JBQzNDLElBQUksTUFBTSxZQUFZLHdCQUFjLEVBQUUsQ0FBQzt3QkFDdEMsT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO29CQUNsRixDQUFDO29CQUNELElBQUksTUFBTSxLQUFLLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO3dCQUNwRCxNQUFNLENBQUMsR0FBRyxJQUFJLDJCQUEyQixDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO3dCQUMzRixDQUFDLENBQUMsUUFBUSxDQUFDLDBCQUEwQixDQUFDLENBQUM7d0JBQ3ZDLE9BQU8sQ0FBQyxDQUFDO29CQUNWLENBQUM7b0JBQ0QsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUM7Z0JBQ0QsZUFBZSxFQUFFLHlCQUF5QjthQUMxQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxjQUFjO2dCQUNuQixJQUFJLENBQUMsOEJBQThCO2dCQUNuQyxJQUFJLENBQUMsVUFBVTthQUNmLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDN0Qsb0NBQWtDLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1lBQ3pELENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsb0JBQU8sRUFBQyxNQUFNLENBQUMsRUFBRTtnQkFDL0IsbUNBQW1DO2dCQUNuQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLG9CQUFPLEVBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQy9CLDBCQUEwQjtnQkFDMUIsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUVyRSxJQUFJLGVBQWUsS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDbkMsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUMxRCxJQUFJLENBQUMsOEJBQThCLENBQUMsS0FBSyxHQUFHLEdBQUcsb0JBQW9CLEdBQUcsQ0FBQyxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUM5RixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM3RCxDQUFDO2dCQUVELElBQUksZUFBZSxLQUFLLFNBQVMsSUFBSSxlQUFlLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzFELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDdEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO2dCQUM5RCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN6QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSxvQkFBTyxFQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUMvQixrQ0FBa0M7Z0JBQ2xDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2RCxJQUFJLElBQUEsZUFBTSxFQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLEVBQUUsQ0FBQztvQkFDOUMsb0JBQW9CO29CQUNwQixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxDQUFDLFlBQVksR0FBRyxhQUFhLENBQUM7Z0JBRWxDLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNyRCxLQUFLLEVBQUUsU0FBUztvQkFDaEIsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFO29CQUNSLE9BQU8sRUFBRSxJQUFJO29CQUNiLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTyxJQUFJLEVBQUU7b0JBQ3hCLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSztvQkFDZCxHQUFHLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTt3QkFDZCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDbEQsQ0FBQztpQkFDRCxDQUFDLENBQUMsQ0FBQztnQkFFSixLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLDZCQUE2QixDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7b0JBQzFFLEtBQUssTUFBTSxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7d0JBQzVCLElBQUksTUFBTSxZQUFZLHdCQUFjLEVBQUUsQ0FBQzs0QkFDdEMsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDM0IsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUM3QixZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksbUJBQVMsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZDLENBQUM7Z0JBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMxRCxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELEtBQUssS0FBYSxPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRW5DLFVBQVU7WUFDVCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxXQUFXO1lBQ1YsT0FBTztnQkFDTixRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7Z0JBQzlCLFVBQVUsRUFBRSw4RkFBOEU7Z0JBQzFGLGdCQUFnQiw2Q0FBcUM7YUFDckQsQ0FBQztRQUNILENBQUM7O0lBM0tXLGdGQUFrQztpREFBbEMsa0NBQWtDO1FBNkQ1QyxXQUFBLDBCQUFlLENBQUE7UUFDZixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixZQUFBLHNCQUFZLENBQUE7T0FqRUYsa0NBQWtDLENBNEs5QztJQUVELE1BQU0sMkJBQTRCLFNBQVEsZ0NBQWM7UUFBeEQ7O1lBQ1MsZUFBVSxHQUF1QixTQUFTLENBQUM7UUFnQnBELENBQUM7UUFkQSxRQUFRLENBQUMsU0FBNkI7WUFDckMsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7UUFDN0IsQ0FBQztRQUVRLE1BQU0sQ0FBQyxTQUFzQjtZQUNyQyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3hCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyQixTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUMsQ0FBQztRQUNGLENBQUM7UUFFa0IsYUFBYTtZQUMvQix3QkFBd0I7UUFDekIsQ0FBQztLQUNEO0lBRUQsTUFBTSxpQkFBa0IsU0FBUSxpREFBdUI7UUFDbkMsV0FBVztZQUM3QixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDOUYsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNULE9BQU8sS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzVCLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxHQUFHLEdBQUcsSUFBQSxPQUFDLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBRXJDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxpQ0FBZSxDQUFDLEdBQUcsRUFBRSxhQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsZ0RBQThCLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xILENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsb0NBQW9DLENBQUMsQ0FBQztZQUNoRSxDQUFDO1FBQ0YsQ0FBQztRQUVrQixhQUFhO1lBQy9CLHdCQUF3QjtRQUN6QixDQUFDO0tBQ0Q7SUFFTSxJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUErQixTQUFRLDBCQUFnQjtRQUtuRSxZQUNDLFNBQXNCLEVBQ0wsTUFBYyxFQUNkLFFBQWtELEVBQ3JELFdBQTBDLEVBQ3BDLGlCQUFzRCxFQUNyRCxrQkFBdUMsRUFDeEMsaUJBQXFDLEVBQ3RDLGdCQUFtQztZQUV0RCxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxHQUFHLFFBQVEsRUFBRSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBUjdILFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCxhQUFRLEdBQVIsUUFBUSxDQUEwQztZQUNwQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBVDFELFNBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLDJCQUEyQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6SSxzQkFBaUIsR0FBYyxFQUFFLENBQUM7WUFDbEMsNEJBQXVCLEdBQWMsRUFBRSxDQUFDO1lBYy9DLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFFTyxhQUFhO1lBQ3BCLE1BQU0sT0FBTyxHQUFjLEVBQUUsQ0FBQztZQUM5QixNQUFNLFNBQVMsR0FBYyxFQUFFLENBQUM7WUFDaEMsSUFBQSx5REFBK0IsRUFDOUIsSUFBSSxDQUFDLElBQUksRUFDVCxJQUFJLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFDMUIsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEVBQ3RCLElBQUksQ0FBQyxRQUFRLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLGNBQWMsRUFBRSxtQkFBbUIsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLGNBQWMsRUFBRSw2QkFBNkIsQ0FDN0osQ0FBQztZQUVGLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUMxQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELDBCQUEwQixDQUFDLE9BQWtCO1lBQzVDLElBQUksSUFBQSxlQUFNLEVBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN0RSxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyx1QkFBdUIsR0FBRyxPQUFPLENBQUM7WUFDdkMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFFRCw2QkFBNkIsQ0FBQyxPQUFrQjtZQUMvQyxJQUFJLElBQUEsZUFBTSxFQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDaEUsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsT0FBTyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUN0QixDQUFDO0tBQ0QsQ0FBQTtJQXJEWSx3RUFBOEI7NkNBQTlCLDhCQUE4QjtRQVN4QyxXQUFBLHNCQUFZLENBQUE7UUFDWixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLDZCQUFpQixDQUFBO09BYlAsOEJBQThCLENBcUQxQyJ9