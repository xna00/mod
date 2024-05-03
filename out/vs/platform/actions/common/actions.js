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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/themables", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry"], function (require, exports, actions_1, themables_1, event_1, lifecycle_1, linkedList_1, commands_1, contextkey_1, instantiation_1, keybindingsRegistry_1) {
    "use strict";
    var MenuItemAction_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Action2 = exports.MenuItemAction = exports.SubmenuItemAction = exports.MenuRegistry = exports.IMenuService = exports.MenuId = void 0;
    exports.isIMenuItem = isIMenuItem;
    exports.isISubmenuItem = isISubmenuItem;
    exports.registerAction2 = registerAction2;
    function isIMenuItem(item) {
        return item.command !== undefined;
    }
    function isISubmenuItem(item) {
        return item.submenu !== undefined;
    }
    class MenuId {
        static { this._instances = new Map(); }
        static { this.CommandPalette = new MenuId('CommandPalette'); }
        static { this.DebugBreakpointsContext = new MenuId('DebugBreakpointsContext'); }
        static { this.DebugCallStackContext = new MenuId('DebugCallStackContext'); }
        static { this.DebugConsoleContext = new MenuId('DebugConsoleContext'); }
        static { this.DebugVariablesContext = new MenuId('DebugVariablesContext'); }
        static { this.NotebookVariablesContext = new MenuId('NotebookVariablesContext'); }
        static { this.DebugHoverContext = new MenuId('DebugHoverContext'); }
        static { this.DebugWatchContext = new MenuId('DebugWatchContext'); }
        static { this.DebugToolBar = new MenuId('DebugToolBar'); }
        static { this.DebugToolBarStop = new MenuId('DebugToolBarStop'); }
        static { this.EditorContext = new MenuId('EditorContext'); }
        static { this.SimpleEditorContext = new MenuId('SimpleEditorContext'); }
        static { this.EditorContent = new MenuId('EditorContent'); }
        static { this.EditorLineNumberContext = new MenuId('EditorLineNumberContext'); }
        static { this.EditorContextCopy = new MenuId('EditorContextCopy'); }
        static { this.EditorContextPeek = new MenuId('EditorContextPeek'); }
        static { this.EditorContextShare = new MenuId('EditorContextShare'); }
        static { this.EditorTitle = new MenuId('EditorTitle'); }
        static { this.EditorTitleRun = new MenuId('EditorTitleRun'); }
        static { this.EditorTitleContext = new MenuId('EditorTitleContext'); }
        static { this.EditorTitleContextShare = new MenuId('EditorTitleContextShare'); }
        static { this.EmptyEditorGroup = new MenuId('EmptyEditorGroup'); }
        static { this.EmptyEditorGroupContext = new MenuId('EmptyEditorGroupContext'); }
        static { this.EditorTabsBarContext = new MenuId('EditorTabsBarContext'); }
        static { this.EditorTabsBarShowTabsSubmenu = new MenuId('EditorTabsBarShowTabsSubmenu'); }
        static { this.EditorTabsBarShowTabsZenModeSubmenu = new MenuId('EditorTabsBarShowTabsZenModeSubmenu'); }
        static { this.EditorActionsPositionSubmenu = new MenuId('EditorActionsPositionSubmenu'); }
        static { this.ExplorerContext = new MenuId('ExplorerContext'); }
        static { this.ExplorerContextShare = new MenuId('ExplorerContextShare'); }
        static { this.ExtensionContext = new MenuId('ExtensionContext'); }
        static { this.GlobalActivity = new MenuId('GlobalActivity'); }
        static { this.CommandCenter = new MenuId('CommandCenter'); }
        static { this.CommandCenterCenter = new MenuId('CommandCenterCenter'); }
        static { this.LayoutControlMenuSubmenu = new MenuId('LayoutControlMenuSubmenu'); }
        static { this.LayoutControlMenu = new MenuId('LayoutControlMenu'); }
        static { this.MenubarMainMenu = new MenuId('MenubarMainMenu'); }
        static { this.MenubarAppearanceMenu = new MenuId('MenubarAppearanceMenu'); }
        static { this.MenubarDebugMenu = new MenuId('MenubarDebugMenu'); }
        static { this.MenubarEditMenu = new MenuId('MenubarEditMenu'); }
        static { this.MenubarCopy = new MenuId('MenubarCopy'); }
        static { this.MenubarFileMenu = new MenuId('MenubarFileMenu'); }
        static { this.MenubarGoMenu = new MenuId('MenubarGoMenu'); }
        static { this.MenubarHelpMenu = new MenuId('MenubarHelpMenu'); }
        static { this.MenubarLayoutMenu = new MenuId('MenubarLayoutMenu'); }
        static { this.MenubarNewBreakpointMenu = new MenuId('MenubarNewBreakpointMenu'); }
        static { this.PanelAlignmentMenu = new MenuId('PanelAlignmentMenu'); }
        static { this.PanelPositionMenu = new MenuId('PanelPositionMenu'); }
        static { this.ActivityBarPositionMenu = new MenuId('ActivityBarPositionMenu'); }
        static { this.MenubarPreferencesMenu = new MenuId('MenubarPreferencesMenu'); }
        static { this.MenubarRecentMenu = new MenuId('MenubarRecentMenu'); }
        static { this.MenubarSelectionMenu = new MenuId('MenubarSelectionMenu'); }
        static { this.MenubarShare = new MenuId('MenubarShare'); }
        static { this.MenubarSwitchEditorMenu = new MenuId('MenubarSwitchEditorMenu'); }
        static { this.MenubarSwitchGroupMenu = new MenuId('MenubarSwitchGroupMenu'); }
        static { this.MenubarTerminalMenu = new MenuId('MenubarTerminalMenu'); }
        static { this.MenubarViewMenu = new MenuId('MenubarViewMenu'); }
        static { this.MenubarHomeMenu = new MenuId('MenubarHomeMenu'); }
        static { this.OpenEditorsContext = new MenuId('OpenEditorsContext'); }
        static { this.OpenEditorsContextShare = new MenuId('OpenEditorsContextShare'); }
        static { this.ProblemsPanelContext = new MenuId('ProblemsPanelContext'); }
        static { this.SCMInputBox = new MenuId('SCMInputBox'); }
        static { this.SCMChangesSeparator = new MenuId('SCMChangesSeparator'); }
        static { this.SCMIncomingChanges = new MenuId('SCMIncomingChanges'); }
        static { this.SCMIncomingChangesContext = new MenuId('SCMIncomingChangesContext'); }
        static { this.SCMIncomingChangesSetting = new MenuId('SCMIncomingChangesSetting'); }
        static { this.SCMOutgoingChanges = new MenuId('SCMOutgoingChanges'); }
        static { this.SCMOutgoingChangesContext = new MenuId('SCMOutgoingChangesContext'); }
        static { this.SCMOutgoingChangesSetting = new MenuId('SCMOutgoingChangesSetting'); }
        static { this.SCMIncomingChangesAllChangesContext = new MenuId('SCMIncomingChangesAllChangesContext'); }
        static { this.SCMIncomingChangesHistoryItemContext = new MenuId('SCMIncomingChangesHistoryItemContext'); }
        static { this.SCMOutgoingChangesAllChangesContext = new MenuId('SCMOutgoingChangesAllChangesContext'); }
        static { this.SCMOutgoingChangesHistoryItemContext = new MenuId('SCMOutgoingChangesHistoryItemContext'); }
        static { this.SCMChangeContext = new MenuId('SCMChangeContext'); }
        static { this.SCMResourceContext = new MenuId('SCMResourceContext'); }
        static { this.SCMResourceContextShare = new MenuId('SCMResourceContextShare'); }
        static { this.SCMResourceFolderContext = new MenuId('SCMResourceFolderContext'); }
        static { this.SCMResourceGroupContext = new MenuId('SCMResourceGroupContext'); }
        static { this.SCMSourceControl = new MenuId('SCMSourceControl'); }
        static { this.SCMSourceControlInline = new MenuId('SCMSourceControlInline'); }
        static { this.SCMSourceControlTitle = new MenuId('SCMSourceControlTitle'); }
        static { this.SCMTitle = new MenuId('SCMTitle'); }
        static { this.SearchContext = new MenuId('SearchContext'); }
        static { this.SearchActionMenu = new MenuId('SearchActionContext'); }
        static { this.StatusBarWindowIndicatorMenu = new MenuId('StatusBarWindowIndicatorMenu'); }
        static { this.StatusBarRemoteIndicatorMenu = new MenuId('StatusBarRemoteIndicatorMenu'); }
        static { this.StickyScrollContext = new MenuId('StickyScrollContext'); }
        static { this.TestItem = new MenuId('TestItem'); }
        static { this.TestItemGutter = new MenuId('TestItemGutter'); }
        static { this.TestMessageContext = new MenuId('TestMessageContext'); }
        static { this.TestMessageContent = new MenuId('TestMessageContent'); }
        static { this.TestPeekElement = new MenuId('TestPeekElement'); }
        static { this.TestPeekTitle = new MenuId('TestPeekTitle'); }
        static { this.TouchBarContext = new MenuId('TouchBarContext'); }
        static { this.TitleBarContext = new MenuId('TitleBarContext'); }
        static { this.TitleBarTitleContext = new MenuId('TitleBarTitleContext'); }
        static { this.TunnelContext = new MenuId('TunnelContext'); }
        static { this.TunnelPrivacy = new MenuId('TunnelPrivacy'); }
        static { this.TunnelProtocol = new MenuId('TunnelProtocol'); }
        static { this.TunnelPortInline = new MenuId('TunnelInline'); }
        static { this.TunnelTitle = new MenuId('TunnelTitle'); }
        static { this.TunnelLocalAddressInline = new MenuId('TunnelLocalAddressInline'); }
        static { this.TunnelOriginInline = new MenuId('TunnelOriginInline'); }
        static { this.ViewItemContext = new MenuId('ViewItemContext'); }
        static { this.ViewContainerTitle = new MenuId('ViewContainerTitle'); }
        static { this.ViewContainerTitleContext = new MenuId('ViewContainerTitleContext'); }
        static { this.ViewTitle = new MenuId('ViewTitle'); }
        static { this.ViewTitleContext = new MenuId('ViewTitleContext'); }
        static { this.CommentEditorActions = new MenuId('CommentEditorActions'); }
        static { this.CommentThreadTitle = new MenuId('CommentThreadTitle'); }
        static { this.CommentThreadActions = new MenuId('CommentThreadActions'); }
        static { this.CommentThreadAdditionalActions = new MenuId('CommentThreadAdditionalActions'); }
        static { this.CommentThreadTitleContext = new MenuId('CommentThreadTitleContext'); }
        static { this.CommentThreadCommentContext = new MenuId('CommentThreadCommentContext'); }
        static { this.CommentTitle = new MenuId('CommentTitle'); }
        static { this.CommentActions = new MenuId('CommentActions'); }
        static { this.CommentsViewThreadActions = new MenuId('CommentsViewThreadActions'); }
        static { this.InteractiveToolbar = new MenuId('InteractiveToolbar'); }
        static { this.InteractiveCellTitle = new MenuId('InteractiveCellTitle'); }
        static { this.InteractiveCellDelete = new MenuId('InteractiveCellDelete'); }
        static { this.InteractiveCellExecute = new MenuId('InteractiveCellExecute'); }
        static { this.InteractiveInputExecute = new MenuId('InteractiveInputExecute'); }
        static { this.IssueReporter = new MenuId('IssueReporter'); }
        static { this.NotebookToolbar = new MenuId('NotebookToolbar'); }
        static { this.NotebookStickyScrollContext = new MenuId('NotebookStickyScrollContext'); }
        static { this.NotebookCellTitle = new MenuId('NotebookCellTitle'); }
        static { this.NotebookCellDelete = new MenuId('NotebookCellDelete'); }
        static { this.NotebookCellInsert = new MenuId('NotebookCellInsert'); }
        static { this.NotebookCellBetween = new MenuId('NotebookCellBetween'); }
        static { this.NotebookCellListTop = new MenuId('NotebookCellTop'); }
        static { this.NotebookCellExecute = new MenuId('NotebookCellExecute'); }
        static { this.NotebookCellExecuteGoTo = new MenuId('NotebookCellExecuteGoTo'); }
        static { this.NotebookCellExecutePrimary = new MenuId('NotebookCellExecutePrimary'); }
        static { this.NotebookDiffCellInputTitle = new MenuId('NotebookDiffCellInputTitle'); }
        static { this.NotebookDiffCellMetadataTitle = new MenuId('NotebookDiffCellMetadataTitle'); }
        static { this.NotebookDiffCellOutputsTitle = new MenuId('NotebookDiffCellOutputsTitle'); }
        static { this.NotebookOutputToolbar = new MenuId('NotebookOutputToolbar'); }
        static { this.NotebookOutlineFilter = new MenuId('NotebookOutlineFilter'); }
        static { this.NotebookOutlineActionMenu = new MenuId('NotebookOutlineActionMenu'); }
        static { this.NotebookEditorLayoutConfigure = new MenuId('NotebookEditorLayoutConfigure'); }
        static { this.NotebookKernelSource = new MenuId('NotebookKernelSource'); }
        static { this.BulkEditTitle = new MenuId('BulkEditTitle'); }
        static { this.BulkEditContext = new MenuId('BulkEditContext'); }
        static { this.TimelineItemContext = new MenuId('TimelineItemContext'); }
        static { this.TimelineTitle = new MenuId('TimelineTitle'); }
        static { this.TimelineTitleContext = new MenuId('TimelineTitleContext'); }
        static { this.TimelineFilterSubMenu = new MenuId('TimelineFilterSubMenu'); }
        static { this.AccountsContext = new MenuId('AccountsContext'); }
        static { this.SidebarTitle = new MenuId('SidebarTitle'); }
        static { this.PanelTitle = new MenuId('PanelTitle'); }
        static { this.AuxiliaryBarTitle = new MenuId('AuxiliaryBarTitle'); }
        static { this.AuxiliaryBarHeader = new MenuId('AuxiliaryBarHeader'); }
        static { this.TerminalInstanceContext = new MenuId('TerminalInstanceContext'); }
        static { this.TerminalEditorInstanceContext = new MenuId('TerminalEditorInstanceContext'); }
        static { this.TerminalNewDropdownContext = new MenuId('TerminalNewDropdownContext'); }
        static { this.TerminalTabContext = new MenuId('TerminalTabContext'); }
        static { this.TerminalTabEmptyAreaContext = new MenuId('TerminalTabEmptyAreaContext'); }
        static { this.TerminalStickyScrollContext = new MenuId('TerminalStickyScrollContext'); }
        static { this.WebviewContext = new MenuId('WebviewContext'); }
        static { this.InlineCompletionsActions = new MenuId('InlineCompletionsActions'); }
        static { this.InlineEditActions = new MenuId('InlineEditActions'); }
        static { this.NewFile = new MenuId('NewFile'); }
        static { this.MergeInput1Toolbar = new MenuId('MergeToolbar1Toolbar'); }
        static { this.MergeInput2Toolbar = new MenuId('MergeToolbar2Toolbar'); }
        static { this.MergeBaseToolbar = new MenuId('MergeBaseToolbar'); }
        static { this.MergeInputResultToolbar = new MenuId('MergeToolbarResultToolbar'); }
        static { this.InlineSuggestionToolbar = new MenuId('InlineSuggestionToolbar'); }
        static { this.InlineEditToolbar = new MenuId('InlineEditToolbar'); }
        static { this.ChatContext = new MenuId('ChatContext'); }
        static { this.ChatCodeBlock = new MenuId('ChatCodeblock'); }
        static { this.ChatMessageTitle = new MenuId('ChatMessageTitle'); }
        static { this.ChatExecute = new MenuId('ChatExecute'); }
        static { this.ChatExecuteSecondary = new MenuId('ChatExecuteSecondary'); }
        static { this.ChatInputSide = new MenuId('ChatInputSide'); }
        static { this.AccessibleView = new MenuId('AccessibleView'); }
        static { this.MultiDiffEditorFileToolbar = new MenuId('MultiDiffEditorFileToolbar'); }
        static { this.DiffEditorHunkToolbar = new MenuId('DiffEditorHunkToolbar'); }
        static { this.DiffEditorSelectionToolbar = new MenuId('DiffEditorSelectionToolbar'); }
        /**
         * Create or reuse a `MenuId` with the given identifier
         */
        static for(identifier) {
            return MenuId._instances.get(identifier) ?? new MenuId(identifier);
        }
        /**
         * Create a new `MenuId` with the unique identifier. Will throw if a menu
         * with the identifier already exists, use `MenuId.for(ident)` or a unique
         * identifier
         */
        constructor(identifier) {
            if (MenuId._instances.has(identifier)) {
                throw new TypeError(`MenuId with identifier '${identifier}' already exists. Use MenuId.for(ident) or a unique identifier`);
            }
            MenuId._instances.set(identifier, this);
            this.id = identifier;
        }
    }
    exports.MenuId = MenuId;
    exports.IMenuService = (0, instantiation_1.createDecorator)('menuService');
    class MenuRegistryChangeEvent {
        static { this._all = new Map(); }
        static for(id) {
            let value = this._all.get(id);
            if (!value) {
                value = new MenuRegistryChangeEvent(id);
                this._all.set(id, value);
            }
            return value;
        }
        static merge(events) {
            const ids = new Set();
            for (const item of events) {
                if (item instanceof MenuRegistryChangeEvent) {
                    ids.add(item.id);
                }
            }
            return ids;
        }
        constructor(id) {
            this.id = id;
            this.has = candidate => candidate === id;
        }
    }
    exports.MenuRegistry = new class {
        constructor() {
            this._commands = new Map();
            this._menuItems = new Map();
            this._onDidChangeMenu = new event_1.MicrotaskEmitter({
                merge: MenuRegistryChangeEvent.merge
            });
            this.onDidChangeMenu = this._onDidChangeMenu.event;
        }
        addCommand(command) {
            this._commands.set(command.id, command);
            this._onDidChangeMenu.fire(MenuRegistryChangeEvent.for(MenuId.CommandPalette));
            return (0, lifecycle_1.toDisposable)(() => {
                if (this._commands.delete(command.id)) {
                    this._onDidChangeMenu.fire(MenuRegistryChangeEvent.for(MenuId.CommandPalette));
                }
            });
        }
        getCommand(id) {
            return this._commands.get(id);
        }
        getCommands() {
            const map = new Map();
            this._commands.forEach((value, key) => map.set(key, value));
            return map;
        }
        appendMenuItem(id, item) {
            let list = this._menuItems.get(id);
            if (!list) {
                list = new linkedList_1.LinkedList();
                this._menuItems.set(id, list);
            }
            const rm = list.push(item);
            this._onDidChangeMenu.fire(MenuRegistryChangeEvent.for(id));
            return (0, lifecycle_1.toDisposable)(() => {
                rm();
                this._onDidChangeMenu.fire(MenuRegistryChangeEvent.for(id));
            });
        }
        appendMenuItems(items) {
            const result = new lifecycle_1.DisposableStore();
            for (const { id, item } of items) {
                result.add(this.appendMenuItem(id, item));
            }
            return result;
        }
        getMenuItems(id) {
            let result;
            if (this._menuItems.has(id)) {
                result = [...this._menuItems.get(id)];
            }
            else {
                result = [];
            }
            if (id === MenuId.CommandPalette) {
                // CommandPalette is special because it shows
                // all commands by default
                this._appendImplicitItems(result);
            }
            return result;
        }
        _appendImplicitItems(result) {
            const set = new Set();
            for (const item of result) {
                if (isIMenuItem(item)) {
                    set.add(item.command.id);
                    if (item.alt) {
                        set.add(item.alt.id);
                    }
                }
            }
            this._commands.forEach((command, id) => {
                if (!set.has(id)) {
                    result.push({ command });
                }
            });
        }
    };
    class SubmenuItemAction extends actions_1.SubmenuAction {
        constructor(item, hideActions, actions) {
            super(`submenuitem.${item.submenu.id}`, typeof item.title === 'string' ? item.title : item.title.value, actions, 'submenu');
            this.item = item;
            this.hideActions = hideActions;
        }
    }
    exports.SubmenuItemAction = SubmenuItemAction;
    // implements IAction, does NOT extend Action, so that no one
    // subscribes to events of Action or modified properties
    let MenuItemAction = MenuItemAction_1 = class MenuItemAction {
        static label(action, options) {
            return options?.renderShortTitle && action.shortTitle
                ? (typeof action.shortTitle === 'string' ? action.shortTitle : action.shortTitle.value)
                : (typeof action.title === 'string' ? action.title : action.title.value);
        }
        constructor(item, alt, options, hideActions, contextKeyService, _commandService) {
            this.hideActions = hideActions;
            this._commandService = _commandService;
            this.id = item.id;
            this.label = MenuItemAction_1.label(item, options);
            this.tooltip = (typeof item.tooltip === 'string' ? item.tooltip : item.tooltip?.value) ?? '';
            this.enabled = !item.precondition || contextKeyService.contextMatchesRules(item.precondition);
            this.checked = undefined;
            let icon;
            if (item.toggled) {
                const toggled = (item.toggled.condition ? item.toggled : { condition: item.toggled });
                this.checked = contextKeyService.contextMatchesRules(toggled.condition);
                if (this.checked && toggled.tooltip) {
                    this.tooltip = typeof toggled.tooltip === 'string' ? toggled.tooltip : toggled.tooltip.value;
                }
                if (this.checked && themables_1.ThemeIcon.isThemeIcon(toggled.icon)) {
                    icon = toggled.icon;
                }
                if (this.checked && toggled.title) {
                    this.label = typeof toggled.title === 'string' ? toggled.title : toggled.title.value;
                }
            }
            if (!icon) {
                icon = themables_1.ThemeIcon.isThemeIcon(item.icon) ? item.icon : undefined;
            }
            this.item = item;
            this.alt = alt ? new MenuItemAction_1(alt, undefined, options, hideActions, contextKeyService, _commandService) : undefined;
            this._options = options;
            this.class = icon && themables_1.ThemeIcon.asClassName(icon);
        }
        run(...args) {
            let runArgs = [];
            if (this._options?.arg) {
                runArgs = [...runArgs, this._options.arg];
            }
            if (this._options?.shouldForwardArgs) {
                runArgs = [...runArgs, ...args];
            }
            return this._commandService.executeCommand(this.id, ...runArgs);
        }
    };
    exports.MenuItemAction = MenuItemAction;
    exports.MenuItemAction = MenuItemAction = MenuItemAction_1 = __decorate([
        __param(4, contextkey_1.IContextKeyService),
        __param(5, commands_1.ICommandService)
    ], MenuItemAction);
    class Action2 {
        constructor(desc) {
            this.desc = desc;
        }
    }
    exports.Action2 = Action2;
    function registerAction2(ctor) {
        const disposables = new lifecycle_1.DisposableStore();
        const action = new ctor();
        const { f1, menu, keybinding, ...command } = action.desc;
        if (commands_1.CommandsRegistry.getCommand(command.id)) {
            throw new Error(`Cannot register two commands with the same id: ${command.id}`);
        }
        // command
        disposables.add(commands_1.CommandsRegistry.registerCommand({
            id: command.id,
            handler: (accessor, ...args) => action.run(accessor, ...args),
            metadata: command.metadata,
        }));
        // menu
        if (Array.isArray(menu)) {
            for (const item of menu) {
                disposables.add(exports.MenuRegistry.appendMenuItem(item.id, { command: { ...command, precondition: item.precondition === null ? undefined : command.precondition }, ...item }));
            }
        }
        else if (menu) {
            disposables.add(exports.MenuRegistry.appendMenuItem(menu.id, { command: { ...command, precondition: menu.precondition === null ? undefined : command.precondition }, ...menu }));
        }
        if (f1) {
            disposables.add(exports.MenuRegistry.appendMenuItem(MenuId.CommandPalette, { command, when: command.precondition }));
            disposables.add(exports.MenuRegistry.addCommand(command));
        }
        // keybinding
        if (Array.isArray(keybinding)) {
            for (const item of keybinding) {
                disposables.add(keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                    ...item,
                    id: command.id,
                    when: command.precondition ? contextkey_1.ContextKeyExpr.and(command.precondition, item.when) : item.when
                }));
            }
        }
        else if (keybinding) {
            disposables.add(keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                ...keybinding,
                id: command.id,
                when: command.precondition ? contextkey_1.ContextKeyExpr.and(command.precondition, keybinding.when) : keybinding.when
            }));
        }
        return disposables;
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYWN0aW9ucy9jb21tb24vYWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBa0NoRyxrQ0FFQztJQUVELHdDQUVDO0lBMGlCRCwwQ0FpREM7SUFqbUJELFNBQWdCLFdBQVcsQ0FBQyxJQUFTO1FBQ3BDLE9BQVEsSUFBa0IsQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDO0lBQ2xELENBQUM7SUFFRCxTQUFnQixjQUFjLENBQUMsSUFBUztRQUN2QyxPQUFRLElBQXFCLENBQUMsT0FBTyxLQUFLLFNBQVMsQ0FBQztJQUNyRCxDQUFDO0lBRUQsTUFBYSxNQUFNO2lCQUVNLGVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztpQkFFL0MsbUJBQWMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2lCQUM5Qyw0QkFBdUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2lCQUNoRSwwQkFBcUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO2lCQUM1RCx3QkFBbUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2lCQUN4RCwwQkFBcUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO2lCQUM1RCw2QkFBd0IsR0FBRyxJQUFJLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO2lCQUNsRSxzQkFBaUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2lCQUNwRCxzQkFBaUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2lCQUNwRCxpQkFBWSxHQUFHLElBQUksTUFBTSxDQUFDLGNB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RyxJQUFJLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2lCQUN0RCw4QkFBeUIsR0FBRyxJQUFJLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2lCQUNwRSw4QkFBeUIsR0FBRyxJQUFJLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2lCQUNwRSx1QkFBa0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2lCQUN0RCw4QkFBeUIsR0FBRyxJQUFJLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2lCQUNwRSw4QkFBeUIsR0FBRyxJQUFJLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2lCQUNwRSx3Q0FBbUMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO2lCQUN4Rix5Q0FBb0MsR0FBRyxJQUFJLE1BQU0sQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO2lCQUMxRix3Q0FBbUMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO2lCQUN4Rix5Q0FBb0MsR0FBRyxJQUFJLE1BQU0sQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO2lCQUMxRixxQkFBZ0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2lCQUNsRCx1QkFBa0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2lCQUN0RCw0QkFBdUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2lCQUNoRSw2QkFBd0IsR0FBRyxJQUFJLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO2lCQUNsRSw0QkFBdUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2lCQUNoRSxxQkFBZ0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2lCQUNsRCwyQkFBc0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2lCQUM5RCwwQkFBcUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFD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