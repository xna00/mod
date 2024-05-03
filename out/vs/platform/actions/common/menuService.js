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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/base/common/actions", "vs/platform/storage/common/storage", "vs/base/common/arrays", "vs/nls"], function (require, exports, async_1, event_1, lifecycle_1, actions_1, commands_1, contextkey_1, actions_2, storage_1, arrays_1, nls_1) {
    "use strict";
    var PersistedMenuHideState_1, MenuInfo_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuService = void 0;
    let MenuService = class MenuService {
        constructor(_commandService, storageService) {
            this._commandService = _commandService;
            this._hiddenStates = new PersistedMenuHideState(storageService);
        }
        createMenu(id, contextKeyService, options) {
            return new MenuImpl(id, this._hiddenStates, { emitEventsForSubmenuChanges: false, eventDebounceDelay: 50, ...options }, this._commandService, contextKeyService);
        }
        resetHiddenStates(ids) {
            this._hiddenStates.reset(ids);
        }
    };
    exports.MenuService = MenuService;
    exports.MenuService = MenuService = __decorate([
        __param(0, commands_1.ICommandService),
        __param(1, storage_1.IStorageService)
    ], MenuService);
    let PersistedMenuHideState = class PersistedMenuHideState {
        static { PersistedMenuHideState_1 = this; }
        static { this._key = 'menu.hiddenCommands'; }
        constructor(_storageService) {
            this._storageService = _storageService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._ignoreChangeEvent = false;
            this._hiddenByDefaultCache = new Map();
            try {
                const raw = _storageService.get(PersistedMenuHideState_1._key, 0 /* StorageScope.PROFILE */, '{}');
                this._data = JSON.parse(raw);
            }
            catch (err) {
                this._data = Object.create(null);
            }
            this._disposables.add(_storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, PersistedMenuHideState_1._key, this._disposables)(() => {
                if (!this._ignoreChangeEvent) {
                    try {
                        const raw = _storageService.get(PersistedMenuHideState_1._key, 0 /* StorageScope.PROFILE */, '{}');
                        this._data = JSON.parse(raw);
                    }
                    catch (err) {
                        console.log('FAILED to read storage after UPDATE', err);
                    }
                }
                this._onDidChange.fire();
            }));
        }
        dispose() {
            this._onDidChange.dispose();
            this._disposables.dispose();
        }
        _isHiddenByDefault(menu, commandId) {
            return this._hiddenByDefaultCache.get(`${menu.id}/${commandId}`) ?? false;
        }
        setDefaultState(menu, commandId, hidden) {
            this._hiddenByDefaultCache.set(`${menu.id}/${commandId}`, hidden);
        }
        isHidden(menu, commandId) {
            const hiddenByDefault = this._isHiddenByDefault(menu, commandId);
            const state = this._data[menu.id]?.includes(commandId) ?? false;
            return hiddenByDefault ? !state : state;
        }
        updateHidden(menu, commandId, hidden) {
            const hiddenByDefault = this._isHiddenByDefault(menu, commandId);
            if (hiddenByDefault) {
                hidden = !hidden;
            }
            const entries = this._data[menu.id];
            if (!hidden) {
                // remove and cleanup
                if (entries) {
                    const idx = entries.indexOf(commandId);
                    if (idx >= 0) {
                        (0, arrays_1.removeFastWithoutKeepingOrder)(entries, idx);
                    }
                    if (entries.length === 0) {
                        delete this._data[menu.id];
                    }
                }
            }
            else {
                // add unless already added
                if (!entries) {
                    this._data[menu.id] = [commandId];
                }
                else {
                    const idx = entries.indexOf(commandId);
                    if (idx < 0) {
                        entries.push(commandId);
                    }
                }
            }
            this._persist();
        }
        reset(menus) {
            if (menus === undefined) {
                // reset all
                this._data = Object.create(null);
                this._persist();
            }
            else {
                // reset only for a specific menu
                for (const { id } of menus) {
                    if (this._data[id]) {
                        delete this._data[id];
                    }
                }
                this._persist();
            }
        }
        _persist() {
            try {
                this._ignoreChangeEvent = true;
                const raw = JSON.stringify(this._data);
                this._storageService.store(PersistedMenuHideState_1._key, raw, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }
            finally {
                this._ignoreChangeEvent = false;
            }
        }
    };
    PersistedMenuHideState = PersistedMenuHideState_1 = __decorate([
        __param(0, storage_1.IStorageService)
    ], PersistedMenuHideState);
    let MenuInfo = MenuInfo_1 = class MenuInfo {
        constructor(_id, _hiddenStates, _collectContextKeysForSubmenus, _commandService, _contextKeyService) {
            this._id = _id;
            this._hiddenStates = _hiddenStates;
            this._collectContextKeysForSubmenus = _collectContextKeysForSubmenus;
            this._commandService = _commandService;
            this._contextKeyService = _contextKeyService;
            this._menuGroups = [];
            this._structureContextKeys = new Set();
            this._preconditionContextKeys = new Set();
            this._toggledContextKeys = new Set();
            this.refresh();
        }
        get structureContextKeys() {
            return this._structureContextKeys;
        }
        get preconditionContextKeys() {
            return this._preconditionContextKeys;
        }
        get toggledContextKeys() {
            return this._toggledContextKeys;
        }
        refresh() {
            // reset
            this._menuGroups.length = 0;
            this._structureContextKeys.clear();
            this._preconditionContextKeys.clear();
            this._toggledContextKeys.clear();
            const menuItems = actions_1.MenuRegistry.getMenuItems(this._id);
            let group;
            menuItems.sort(MenuInfo_1._compareMenuItems);
            for (const item of menuItems) {
                // group by groupId
                const groupName = item.group || '';
                if (!group || group[0] !== groupName) {
                    group = [groupName, []];
                    this._menuGroups.push(group);
                }
                group[1].push(item);
                // keep keys for eventing
                this._collectContextKeys(item);
            }
        }
        _collectContextKeys(item) {
            MenuInfo_1._fillInKbExprKeys(item.when, this._structureContextKeys);
            if ((0, actions_1.isIMenuItem)(item)) {
                // keep precondition keys for event if applicable
                if (item.command.precondition) {
                    MenuInfo_1._fillInKbExprKeys(item.command.precondition, this._preconditionContextKeys);
                }
                // keep toggled keys for event if applicable
                if (item.command.toggled) {
                    const toggledExpression = item.command.toggled.condition || item.command.toggled;
                    MenuInfo_1._fillInKbExprKeys(toggledExpression, this._toggledContextKeys);
                }
            }
            else if (this._collectContextKeysForSubmenus) {
                // recursively collect context keys from submenus so that this
                // menu fires events when context key changes affect submenus
                actions_1.MenuRegistry.getMenuItems(item.submenu).forEach(this._collectContextKeys, this);
            }
        }
        createActionGroups(options) {
            const result = [];
            for (const group of this._menuGroups) {
                const [id, items] = group;
                const activeActions = [];
                for (const item of items) {
                    if (this._contextKeyService.contextMatchesRules(item.when)) {
                        const isMenuItem = (0, actions_1.isIMenuItem)(item);
                        if (isMenuItem) {
                            this._hiddenStates.setDefaultState(this._id, item.command.id, !!item.isHiddenByDefault);
                        }
                        const menuHide = createMenuHide(this._id, isMenuItem ? item.command : item, this._hiddenStates);
                        if (isMenuItem) {
                            // MenuItemAction
                            activeActions.push(new actions_1.MenuItemAction(item.command, item.alt, options, menuHide, this._contextKeyService, this._commandService));
                        }
                        else {
                            // SubmenuItemAction
                            const groups = new MenuInfo_1(item.submenu, this._hiddenStates, this._collectContextKeysForSubmenus, this._commandService, this._contextKeyService).createActionGroups(options);
                            const submenuActions = actions_2.Separator.join(...groups.map(g => g[1]));
                            if (submenuActions.length > 0) {
                                activeActions.push(new actions_1.SubmenuItemAction(item, menuHide, submenuActions));
                            }
                        }
                    }
                }
                if (activeActions.length > 0) {
                    result.push([id, activeActions]);
                }
            }
            return result;
        }
        static _fillInKbExprKeys(exp, set) {
            if (exp) {
                for (const key of exp.keys()) {
                    set.add(key);
                }
            }
        }
        static _compareMenuItems(a, b) {
            const aGroup = a.group;
            const bGroup = b.group;
            if (aGroup !== bGroup) {
                // Falsy groups come last
                if (!aGroup) {
                    return 1;
                }
                else if (!bGroup) {
                    return -1;
                }
                // 'navigation' group comes first
                if (aGroup === 'navigation') {
                    return -1;
                }
                else if (bGroup === 'navigation') {
                    return 1;
                }
                // lexical sort for groups
                const value = aGroup.localeCompare(bGroup);
                if (value !== 0) {
                    return value;
                }
            }
            // sort on priority - default is 0
            const aPrio = a.order || 0;
            const bPrio = b.order || 0;
            if (aPrio < bPrio) {
                return -1;
            }
            else if (aPrio > bPrio) {
                return 1;
            }
            // sort on titles
            return MenuInfo_1._compareTitles((0, actions_1.isIMenuItem)(a) ? a.command.title : a.title, (0, actions_1.isIMenuItem)(b) ? b.command.title : b.title);
        }
        static _compareTitles(a, b) {
            const aStr = typeof a === 'string' ? a : a.original;
            const bStr = typeof b === 'string' ? b : b.original;
            return aStr.localeCompare(bStr);
        }
    };
    MenuInfo = MenuInfo_1 = __decorate([
        __param(3, commands_1.ICommandService),
        __param(4, contextkey_1.IContextKeyService)
    ], MenuInfo);
    let MenuImpl = class MenuImpl {
        constructor(id, hiddenStates, options, commandService, contextKeyService) {
            this._disposables = new lifecycle_1.DisposableStore();
            this._menuInfo = new MenuInfo(id, hiddenStates, options.emitEventsForSubmenuChanges, commandService, contextKeyService);
            // Rebuild this menu whenever the menu registry reports an event for this MenuId.
            // This usually happen while code and extensions are loaded and affects the over
            // structure of the menu
            const rebuildMenuSoon = new async_1.RunOnceScheduler(() => {
                this._menuInfo.refresh();
                this._onDidChange.fire({ menu: this, isStructuralChange: true, isEnablementChange: true, isToggleChange: true });
            }, options.eventDebounceDelay);
            this._disposables.add(rebuildMenuSoon);
            this._disposables.add(actions_1.MenuRegistry.onDidChangeMenu(e => {
                if (e.has(id)) {
                    rebuildMenuSoon.schedule();
                }
            }));
            // When context keys or storage state changes we need to check if the menu also has changed. However,
            // we only do that when someone listens on this menu because (1) these events are
            // firing often and (2) menu are often leaked
            const lazyListener = this._disposables.add(new lifecycle_1.DisposableStore());
            const merge = (events) => {
                let isStructuralChange = false;
                let isEnablementChange = false;
                let isToggleChange = false;
                for (const item of events) {
                    isStructuralChange = isStructuralChange || item.isStructuralChange;
                    isEnablementChange = isEnablementChange || item.isEnablementChange;
                    isToggleChange = isToggleChange || item.isToggleChange;
                    if (isStructuralChange && isEnablementChange && isToggleChange) {
                        // everything is TRUE, no need to continue iterating
                        break;
                    }
                }
                return { menu: this, isStructuralChange, isEnablementChange, isToggleChange };
            };
            const startLazyListener = () => {
                lazyListener.add(contextKeyService.onDidChangeContext(e => {
                    const isStructuralChange = e.affectsSome(this._menuInfo.structureContextKeys);
                    const isEnablementChange = e.affectsSome(this._menuInfo.preconditionContextKeys);
                    const isToggleChange = e.affectsSome(this._menuInfo.toggledContextKeys);
                    if (isStructuralChange || isEnablementChange || isToggleChange) {
                        this._onDidChange.fire({ menu: this, isStructuralChange, isEnablementChange, isToggleChange });
                    }
                }));
                lazyListener.add(hiddenStates.onDidChange(e => {
                    this._onDidChange.fire({ menu: this, isStructuralChange: true, isEnablementChange: false, isToggleChange: false });
                }));
            };
            this._onDidChange = new event_1.DebounceEmitter({
                // start/stop context key listener
                onWillAddFirstListener: startLazyListener,
                onDidRemoveLastListener: lazyListener.clear.bind(lazyListener),
                delay: options.eventDebounceDelay,
                merge
            });
            this.onDidChange = this._onDidChange.event;
        }
        getActions(options) {
            return this._menuInfo.createActionGroups(options);
        }
        dispose() {
            this._disposables.dispose();
            this._onDidChange.dispose();
        }
    };
    MenuImpl = __decorate([
        __param(3, commands_1.ICommandService),
        __param(4, contextkey_1.IContextKeyService)
    ], MenuImpl);
    function createMenuHide(menu, command, states) {
        const id = (0, actions_1.isISubmenuItem)(command) ? command.submenu.id : command.id;
        const title = typeof command.title === 'string' ? command.title : command.title.value;
        const hide = (0, actions_2.toAction)({
            id: `hide/${menu.id}/${id}`,
            label: (0, nls_1.localize)('hide.label', 'Hide \'{0}\'', title),
            run() { states.updateHidden(menu, id, true); }
        });
        const toggle = (0, actions_2.toAction)({
            id: `toggle/${menu.id}/${id}`,
            label: title,
            get checked() { return !states.isHidden(menu, id); },
            run() { states.updateHidden(menu, id, !!this.checked); }
        });
        return {
            hide,
            toggle,
            get isHidden() { return !toggle.checked; },
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2FjdGlvbnMvY29tbW9uL21lbnVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFjekYsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBVztRQU12QixZQUNtQyxlQUFnQyxFQUNqRCxjQUErQjtZQURkLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUdsRSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksc0JBQXNCLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVELFVBQVUsQ0FBQyxFQUFVLEVBQUUsaUJBQXFDLEVBQUUsT0FBNEI7WUFDekYsT0FBTyxJQUFJLFFBQVEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLDJCQUEyQixFQUFFLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxFQUFFLEVBQUUsR0FBRyxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDbEssQ0FBQztRQUVELGlCQUFpQixDQUFDLEdBQWM7WUFDL0IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsQ0FBQztLQUNELENBQUE7SUFwQlksa0NBQVc7MEJBQVgsV0FBVztRQU9yQixXQUFBLDBCQUFlLENBQUE7UUFDZixXQUFBLHlCQUFlLENBQUE7T0FSTCxXQUFXLENBb0J2QjtJQUVELElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXNCOztpQkFFSCxTQUFJLEdBQUcscUJBQXFCLEFBQXhCLENBQXlCO1FBV3JELFlBQTZCLGVBQWlEO1lBQWhDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQVQ3RCxpQkFBWSxHQUFH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