/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickAccess", "vs/platform/registry/common/platform", "vs/platform/quickinput/browser/helpQuickAccess", "vs/workbench/contrib/quickaccess/browser/viewQuickAccess", "vs/workbench/contrib/quickaccess/browser/commandsQuickAccess", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/quickaccess", "vs/platform/keybinding/common/keybindingsRegistry", "vs/editor/common/editorContextKeys"], function (require, exports, nls_1, quickAccess_1, platform_1, helpQuickAccess_1, viewQuickAccess_1, commandsQuickAccess_1, actions_1, contextkey_1, quickaccess_1, keybindingsRegistry_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Quick Access Proviers
    const quickAccessRegistry = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess);
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: helpQuickAccess_1.HelpQuickAccessProvider,
        prefix: helpQuickAccess_1.HelpQuickAccessProvider.PREFIX,
        placeholder: (0, nls_1.localize)('helpQuickAccessPlaceholder', "Type '{0}' to get help on the actions you can take from here.", helpQuickAccess_1.HelpQuickAccessProvider.PREFIX),
        helpEntries: [{
                description: (0, nls_1.localize)('helpQuickAccess', "Show all Quick Access Providers"),
                commandCenterOrder: 70,
                commandCenterLabel: (0, nls_1.localize)('more', 'More')
            }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: viewQuickAccess_1.ViewQuickAccessProvider,
        prefix: viewQuickAccess_1.ViewQuickAccessProvider.PREFIX,
        contextKey: 'inViewsPicker',
        placeholder: (0, nls_1.localize)('viewQuickAccessPlaceholder', "Type the name of a view, output channel or terminal to open."),
        helpEntries: [{ description: (0, nls_1.localize)('viewQuickAccess', "Open View"), commandId: viewQuickAccess_1.OpenViewPickerAction.ID }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: commandsQuickAccess_1.CommandsQuickAccessProvider,
        prefix: commandsQuickAccess_1.CommandsQuickAccessProvider.PREFIX,
        contextKey: 'inCommandsPicker',
        placeholder: (0, nls_1.localize)('commandsQuickAccessPlaceholder', "Type the name of a command to run."),
        helpEntries: [{ description: (0, nls_1.localize)('commandsQuickAccess', "Show and Run Commands"), commandId: commandsQuickAccess_1.ShowAllCommandsAction.ID, commandCenterOrder: 20 }]
    });
    //#endregion
    //#region Menu contributions
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '1_open',
        command: {
            id: commandsQuickAccess_1.ShowAllCommandsAction.ID,
            title: (0, nls_1.localize)({ key: 'miCommandPalette', comment: ['&& denotes a mnemonic'] }, "&&Command Palette...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarHelpMenu, {
        group: '1_welcome',
        command: {
            id: commandsQuickAccess_1.ShowAllCommandsAction.ID,
            title: (0, nls_1.localize)({ key: 'miShowAllCommands', comment: ['&& denotes a mnemonic'] }, "Show All Commands")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '1_open',
        command: {
            id: viewQuickAccess_1.OpenViewPickerAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpenView', comment: ['&& denotes a mnemonic'] }, "&&Open View...")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '5_infile_nav',
        command: {
            id: 'workbench.action.gotoLine',
            title: (0, nls_1.localize)({ key: 'miGotoLine', comment: ['&& denotes a mnemonic'] }, "Go to &&Line/Column...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
        group: '1_command',
        command: {
            id: commandsQuickAccess_1.ShowAllCommandsAction.ID,
            title: (0, nls_1.localize)('commandPalette', "Command Palette...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, {
        group: 'z_commands',
        when: editorContextKeys_1.EditorContextKeys.editorSimpleInput.toNegated(),
        command: {
            id: commandsQuickAccess_1.ShowAllCommandsAction.ID,
            title: (0, nls_1.localize)('commandPalette', "Command Palette..."),
        },
        order: 1
    });
    //#endregion
    //#region Workbench actions and commands
    (0, actions_1.registerAction2)(commandsQuickAccess_1.ClearCommandHistoryAction);
    (0, actions_1.registerAction2)(commandsQuickAccess_1.ShowAllCommandsAction);
    (0, actions_1.registerAction2)(viewQuickAccess_1.OpenViewPickerAction);
    (0, actions_1.registerAction2)(viewQuickAccess_1.QuickAccessViewPickerAction);
    const inViewsPickerContextKey = 'inViewsPicker';
    const inViewsPickerContext = contextkey_1.ContextKeyExpr.and(quickaccess_1.inQuickPickContext, contextkey_1.ContextKeyExpr.has(inViewsPickerContextKey));
    const viewPickerKeybinding = viewQuickAccess_1.QuickAccessViewPickerAction.KEYBINDING;
    const quickAccessNavigateNextInViewPickerId = 'workbench.action.quickOpenNavigateNextInViewPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigateNextInViewPickerId,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigateNextInViewPickerId, true),
        when: inViewsPickerContext,
        primary: viewPickerKeybinding.primary,
        linux: viewPickerKeybinding.linux,
        mac: viewPickerKeybinding.mac
    });
    const quickAccessNavigatePreviousInViewPickerId = 'workbench.action.quickOpenNavigatePreviousInViewPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigatePreviousInViewPickerId,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigatePreviousInViewPickerId, false),
        when: inViewsPickerContext,
        primary: viewPickerKeybinding.primary | 1024 /* KeyMod.Shift */,
        linux: viewPickerKeybinding.linux,
        mac: {
            primary: viewPickerKeybinding.mac.primary | 1024 /* KeyMod.Shift */
        }
    });
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tBY2Nlc3MuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9xdWlja2FjY2Vzcy9icm93c2VyL3F1aWNrQWNjZXNzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWVoRywrQkFBK0I7SUFFL0IsTUFBTSxtQkFBbUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBdUIsd0JBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUV0RixtQkFBbUIsQ0FBQywyQkFBMkIsQ0FBQztRQUMvQyxJQUFJLEVBQUUseUNBQXVCO1FBQzdCLE1BQU0sRUFBRSx5Q0FBdUIsQ0FBQyxNQUFNO1FBQ3RDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSwrREFBK0QsRUFBRSx5Q0FBdUIsQ0FBQyxNQUFNLENBQUM7UUFDcEosV0FBVyxFQUFFLENBQUM7Z0JBQ2IsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLGlDQUFpQyxDQUFDO2dCQUMzRSxrQkFBa0IsRUFBRSxFQUFFO2dCQUN0QixrQkFBa0IsRUFBRSxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsTUFBTSxDQUFDO2FBQzVDLENBQUM7S0FDRixDQUFDLENBQUM7SUFFSCxtQkFBbUIsQ0FBQywyQkFBMkIsQ0FBQztRQUMvQyxJQUFJLEVBQUUseUNBQXVCO1FBQzdCLE1BQU0sRUFBRSx5Q0FBdUIsQ0FBQyxNQUFNO1FBQ3RDLFVBQVUsRUFBRSxlQUFlO1FBQzNCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSw4REFBOEQsQ0FBQztRQUNuSCxXQUFXLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxXQUFX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