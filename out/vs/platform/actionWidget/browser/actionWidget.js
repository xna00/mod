var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actionWidget/browser/actionList", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/css!./actionWidget"], function (require, exports, dom, actionbar_1, lifecycle_1, nls_1, actionList_1, actions_1, contextkey_1, contextView_1, extensions_1, instantiation_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IActionWidgetService = void 0;
    (0, colorRegistry_1.registerColor)('actionBar.toggledBackground', { dark: colorRegistry_1.inputActiveOptionBackground, light: colorRegistry_1.inputActiveOptionBackground, hcDark: colorRegistry_1.inputActiveOptionBackground, hcLight: colorRegistry_1.inputActiveOptionBackground, }, (0, nls_1.localize)('actionBar.toggledBackground', 'Background color for toggled action items in action bar.'));
    const ActionWidgetContextKeys = {
        Visible: new contextkey_1.RawContextKey('codeActionMenuVisible', false, (0, nls_1.localize)('codeActionMenuVisible', "Whether the action widget list is visible"))
    };
    exports.IActionWidgetService = (0, instantiation_1.createDecorator)('actionWidgetService');
    let ActionWidgetService = class ActionWidgetService extends lifecycle_1.Disposable {
        get isVisible() {
            return ActionWidgetContextKeys.Visible.getValue(this._contextKeyService) || false;
        }
        constructor(_contextViewService, _contextKeyService, _instantiationService) {
            super();
            this._contextViewService = _contextViewService;
            this._contextKeyService = _contextKeyService;
            this._instantiationService = _instantiationService;
            this._list = this._register(new lifecycle_1.MutableDisposable());
        }
        show(user, supportsPreview, items, delegate, anchor, container, actionBarActions) {
            const visibleContext = ActionWidgetContextKeys.Visible.bindTo(this._contextKeyService);
            const list = this._instantiationService.createInstance(actionList_1.ActionList, user, supportsPreview, items, delegate);
            this._contextViewService.showContextView({
                getAnchor: () => anchor,
                render: (container) => {
                    visibleContext.set(true);
                    return this._renderWidget(container, list, actionBarActions ?? []);
                },
                onHide: (didCancel) => {
                    visibleContext.reset();
                    this._onWidgetClosed(didCancel);
                },
            }, container, false);
        }
        acceptSelected(preview) {
            this._list.value?.acceptSelected(preview);
        }
        focusPrevious() {
            this._list?.value?.focusPrevious();
        }
        focusNext() {
            this._list?.value?.focusNext();
        }
        hide() {
            this._list.value?.hide();
            this._list.clear();
        }
        clear() {
            this._list.clear();
        }
        _renderWidget(element, list, actionBarActions) {
            const widget = document.createElement('div');
            widget.classList.add('action-widget');
            element.appendChild(widget);
            this._list.value = list;
            if (this._list.value) {
                widget.appendChild(this._list.value.domNode);
            }
            else {
                throw new Error('List has no value');
            }
            const renderDisposables = new lifecycle_1.DisposableStore();
            // Invisible div to block mouse interaction in the rest of the UI
            const menuBlock = document.createElement('div');
            const block = element.appendChild(menuBlock);
            block.classList.add('context-view-block');
            renderDisposables.add(dom.addDisposableListener(block, dom.EventType.MOUSE_DOWN, e => e.stopPropagation()));
            // Invisible div to block mouse interaction with the menu
            const pointerBlockDiv = document.createElement('div');
            const pointerBlock = element.appendChild(pointerBlockDiv);
            pointerBlock.classList.add('context-view-pointerBlock');
            // Removes block on click INSIDE widget or ANY mouse movement
            renderDisposables.add(dom.addDisposableListener(pointerBlock, dom.EventType.POINTER_MOVE, () => pointerBlock.remove()));
            renderDisposables.add(dom.addDisposableListener(pointerBlock, dom.EventType.MOUSE_DOWN, () => pointerBlock.remove()));
            // Action bar
            let actionBarWidth = 0;
            if (actionBarActions.length) {
                const actionBar = this._createActionBar('.action-widget-action-bar', actionBarActions);
                if (actionBar) {
                    widget.appendChild(actionBar.getContainer().parentElement);
                    renderDisposables.add(actionBar);
                    actionBarWidth = actionBar.getContainer().offsetWidth;
                }
            }
            const width = this._list.value?.layout(actionBarWidth);
            widget.style.width = `${width}px`;
            const focusTracker = renderDisposables.add(dom.trackFocus(element));
            renderDisposables.add(focusTracker.onDidBlur(() => this.hide()));
            return renderDisposables;
        }
        _createActionBar(className, actions) {
            if (!actions.length) {
                return undefined;
            }
            const container = dom.$(className);
            const actionBar = new actionbar_1.ActionBar(container);
            actionBar.push(actions, { icon: false, label: true });
            return actionBar;
        }
        _onWidgetClosed(didCancel) {
            this._list.value?.hide(didCancel);
        }
    };
    ActionWidgetService = __decorate([
        __param(0, contextView_1.IContextViewService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, instantiation_1.IInstantiationService)
    ], ActionWidgetService);
    (0, extensions_1.registerSingleton)(exports.IActionWidgetService, ActionWidgetService, 1 /* InstantiationType.Delayed */);
    const weight = 100 /* KeybindingWeight.EditorContrib */ + 1000;
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'hideCodeActionWidget',
                title: (0, nls_1.localize2)('hideCodeActionWidget.title', "Hide action widget"),
                precondition: ActionWidgetContextKeys.Visible,
                keybinding: {
                    weight,
                    primary: 9 /* KeyCode.Escape */,
                    secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
                },
            });
        }
        run(accessor) {
            accessor.get(exports.IActionWidgetService).hide();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'selectPrevCodeAction',
                title: (0, nls_1.localize2)('selectPrevCodeAction.title', "Select previous action"),
                precondition: ActionWidgetContextKeys.Visible,
                keybinding: {
                    weight,
                    primary: 16 /* KeyCode.UpArrow */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */],
                    mac: { primary: 16 /* KeyCode.UpArrow */, secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */, 256 /* KeyMod.WinCtrl */ | 46 /* KeyCode.KeyP */] },
                }
            });
        }
        run(accessor) {
            const widgetService = accessor.get(exports.IActionWidgetService);
            if (widgetService instanceof ActionWidgetService) {
                widgetService.focusPrevious();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'selectNextCodeAction',
                title: (0, nls_1.localize2)('selectNextCodeAction.title', "Select next action"),
                precondition: ActionWidgetContextKeys.Visible,
                keybinding: {
                    weight,
                    primary: 18 /* KeyCode.DownArrow */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */],
                    mac: { primary: 18 /* KeyCode.DownArrow */, secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */, 256 /* KeyMod.WinCtrl */ | 44 /* KeyCode.KeyN */] }
                }
            });
        }
        run(accessor) {
            const widgetService = accessor.get(exports.IActionWidgetService);
            if (widgetService instanceof ActionWidgetService) {
                widgetService.focusNext();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: actionList_1.acceptSelectedActionCommand,
                title: (0, nls_1.localize2)('acceptSelected.title', "Accept selected action"),
                precondition: ActionWidgetContextKeys.Visible,
                keybinding: {
                    weight,
                    primary: 3 /* KeyCode.Enter */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */],
                }
            });
        }
        run(accessor) {
            const widgetService = accessor.get(exports.IActionWidgetService);
            if (widgetService instanceof ActionWidgetService) {
                widgetService.acceptSelected();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: actionList_1.previewSelectedActionCommand,
                title: (0, nls_1.localize2)('previewSelected.title', "Preview selected action"),
                precondition: ActionWidgetContextKeys.Visible,
                keybinding: {
                    weight,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                }
            });
        }
        run(accessor) {
            const widgetService = accessor.get(exports.IActionWidgetService);
            if (widgetService instanceof ActionWidgetService) {
                widgetService.acceptSelected(true);
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9hY3Rpb25XaWRnZXQvYnJvd3Nlci9hY3Rpb25XaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQXFCQSxJQUFBLDZCQUFhLEVBQ1osNkJBQTZCLEVBQzdCLEVBQUUsSUFBSSxFQUFFLDJDQUEyQixFQUFFLEtBQUssRUFBRSwyQ0FBMkIsRUFBRSxNQUFNLEVBQUUsMkNBQTJCLEVBQUUsT0FBTyxFQUFFLDJDQUEyQixHQUFHLEVBQ3JKLElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLDBEQUEwRCxDQUFDLENBQ25HLENBQUM7SUFFRixNQUFNLHVCQUF1QixHQUFHO1FBQy9CLE9BQU8sRUFBRSxJQUFJLDBCQUFhLENBQVUsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLDJDQUEyQyxDQUFDLENBQUM7S0FDbkosQ0FBQztJQUVXLFFBQUEsb0JBQW9CLEdBQUcsSUFBQSwrQkFBZSxFQUF1QixxQkFBcUIsQ0FBQyxDQUFDO0lBWWpHLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7UUFHM0MsSUFBSSxTQUFTO1lBQ1osT0FBTyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEtBQUssQ0FBQztRQUNuRixDQUFDO1FBSUQsWUFDc0IsbUJBQXlELEVBQzFELGtCQUF1RCxFQUNwRCxxQkFBNkQ7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFKOEIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUN6Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ25DLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFMcEUs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