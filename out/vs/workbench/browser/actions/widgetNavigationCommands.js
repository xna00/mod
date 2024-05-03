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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/base/common/lifecycle", "vs/workbench/common/contributions"], function (require, exports, contextkey_1, keybindingsRegistry_1, listService_1, lifecycle_1, contributions_1) {
    "use strict";
    var NavigableContainerManager_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerNavigableContainer = registerNavigableContainer;
    function handleFocusEventsGroup(group, handler) {
        const focusedIndices = new Set();
        return (0, lifecycle_1.combinedDisposable)(...group.map((events, index) => (0, lifecycle_1.combinedDisposable)(events.onDidFocus(() => {
            if (!focusedIndices.size) {
                handler(true);
            }
            focusedIndices.add(index);
        }), events.onDidBlur(() => {
            focusedIndices.delete(index);
            if (!focusedIndices.size) {
                handler(false);
            }
        }))));
    }
    const NavigableContainerFocusedContextKey = new contextkey_1.RawContextKey('navigableContainerFocused', false);
    let NavigableContainerManager = class NavigableContainerManager {
        static { NavigableContainerManager_1 = this; }
        static { this.ID = 'workbench.contrib.navigableContainerManager'; }
        constructor(contextKeyService) {
            this.containers = new Set();
            this.focused = NavigableContainerFocusedContextKey.bindTo(contextKeyService);
            NavigableContainerManager_1.INSTANCE = this;
        }
        dispose() {
            this.containers.clear();
            this.focused.reset();
            NavigableContainerManager_1.INSTANCE = undefined;
        }
        static register(container) {
            const instance = this.INSTANCE;
            if (!instance) {
                return lifecycle_1.Disposable.None;
            }
            instance.containers.add(container);
            return (0, lifecycle_1.combinedDisposable)(handleFocusEventsGroup(container.focusNotifiers, (isFocus) => {
                if (isFocus) {
                    instance.focused.set(true);
                    instance.lastContainer = container;
                }
                else if (instance.lastContainer === container) {
                    instance.focused.set(false);
                    instance.lastContainer = undefined;
                }
            }), (0, lifecycle_1.toDisposable)(() => {
                instance.containers.delete(container);
                if (instance.lastContainer === container) {
                    instance.focused.set(false);
                    instance.lastContainer = undefined;
                }
            }));
        }
        static getActive() {
            return this.INSTANCE?.lastContainer;
        }
    };
    NavigableContainerManager = NavigableContainerManager_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService)
    ], NavigableContainerManager);
    function registerNavigableContainer(container) {
        return NavigableContainerManager.register(container);
    }
    (0, contributions_1.registerWorkbenchContribution2)(NavigableContainerManager.ID, NavigableContainerManager, 1 /* WorkbenchPhase.BlockStartup */);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'widgetNavigation.focusPrevious',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(NavigableContainerFocusedContextKey, contextkey_1.ContextKeyExpr.or(listService_1.WorkbenchListFocusContextKey?.negate(), listService_1.WorkbenchListScrollAtTopContextKey)),
        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
        handler: () => {
            const activeContainer = NavigableContainerManager.getActive();
            activeContainer?.focusPreviousWidget();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'widgetNavigation.focusNext',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(NavigableContainerFocusedContextKey, contextkey_1.ContextKeyExpr.or(listService_1.WorkbenchListFocusContextKey?.negate(), listService_1.WorkbenchListScrollAtBottomContextKey)),
        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
        handler: () => {
            const activeContainer = NavigableContainerManager.getActive();
            activeContainer?.focusNextWidget();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2lkZ2V0TmF2aWdhdGlvbkNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9hY3Rpb25zL3dpZGdldE5hdmlnYXRpb25Db21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyR2hHLGdFQUVDO0lBNUVELFNBQVMsc0JBQXNCLENBQUMsS0FBZ0MsRUFBRSxPQUFtQztRQUNwRyxNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBQ3pDLE9BQU8sSUFBQSw4QkFBa0IsRUFBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFBLDhCQUFrQixFQUMzRSxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRTtZQUN0QixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUMxQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDZixDQUFDO1lBQ0QsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsRUFDRixNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtZQUNyQixjQUFjLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzdCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoQixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsTUFBTSxtQ0FBbUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsMkJBQTJCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFM0csSUFBTSx5QkFBeUIs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