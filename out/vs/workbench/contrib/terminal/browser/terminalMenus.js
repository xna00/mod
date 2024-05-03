/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/network", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/terminal/common/terminal", "vs/workbench/common/contextkeys", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/services/editor/common/editorService"], function (require, exports, actions_1, codicons_1, network_1, nls_1, actions_2, contextkey_1, terminal_1, contextkeys_1, taskService_1, terminal_2, terminalContextKey_1, terminalStrings_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalMenuBarGroup = void 0;
    exports.setupTerminalMenus = setupTerminalMenus;
    exports.getTerminalActionBarArgs = getTerminalActionBarArgs;
    var ContextMenuGroup;
    (function (ContextMenuGroup) {
        ContextMenuGroup["Create"] = "1_create";
        ContextMenuGroup["Edit"] = "3_edit";
        ContextMenuGroup["Clear"] = "5_clear";
        ContextMenuGroup["Kill"] = "7_kill";
        ContextMenuGroup["Config"] = "9_config";
    })(ContextMenuGroup || (ContextMenuGroup = {}));
    var TerminalMenuBarGroup;
    (function (TerminalMenuBarGroup) {
        TerminalMenuBarGroup["Create"] = "1_create";
        TerminalMenuBarGroup["Run"] = "3_run";
        TerminalMenuBarGroup["Manage"] = "5_manage";
        TerminalMenuBarGroup["Configure"] = "7_configure";
    })(TerminalMenuBarGroup || (exports.TerminalMenuBarGroup = TerminalMenuBarGroup = {}));
    function setupTerminalMenus() {
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.MenubarTerminalMenu,
                item: {
                    group: "1_create" /* TerminalMenuBarGroup.Create */,
                    command: {
                        id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
                        title: (0, nls_1.localize)({ key: 'miNewTerminal', comment: ['&& denotes a mnemonic'] }, "&&New Terminal")
                    },
                    order: 1
                }
            },
            {
                id: actions_2.MenuId.MenubarTerminalMenu,
                item: {
                    group: "1_create" /* TerminalMenuBarGroup.Create */,
                    command: {
                        id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                        title: (0, nls_1.localize)({ key: 'miSplitTerminal', comment: ['&& denotes a mnemonic'] }, "&&Split Terminal"),
                        precondition: contextkey_1.ContextKeyExpr.has("terminalIsOpen" /* TerminalContextKeyStrings.IsOpen */)
                    },
                    order: 2,
                    when: terminalContextKey_1.TerminalContextKeys.processSupported
                }
            },
            {
                id: actions_2.MenuId.MenubarTerminalMenu,
                item: {
                    group: "3_run" /* TerminalMenuBarGroup.Run */,
                    command: {
                        id: "workbench.action.terminal.runActiveFile" /* TerminalCommandId.RunActiveFile */,
                        title: (0, nls_1.localize)({ key: 'miRunActiveFile', comment: ['&& denotes a mnemonic'] }, "Run &&Active File")
                    },
                    order: 3,
                    when: terminalContextKey_1.TerminalContextKeys.processSupported
                }
            },
            {
                id: actions_2.MenuId.MenubarTerminalMenu,
                item: {
                    group: "3_run" /* TerminalMenuBarGroup.Run */,
                    command: {
                        id: "workbench.action.terminal.runSelectedText" /* TerminalCommandId.RunSelectedText */,
                        title: (0, nls_1.localize)({ key: 'miRunSelectedText', comment: ['&& denotes a mnemonic'] }, "Run &&Selected Text")
                    },
                    order: 4,
                    when: terminalContextKey_1.TerminalContextKeys.processSupported
                }
            }
        ]);
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    group: "1_create" /* ContextMenuGroup.Create */,
                    command: {
                        id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                        title: terminalStrings_1.terminalStrings.split.value
                    }
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
                        title: terminalStrings_1.terminalStrings.new
                    },
                    group: "1_create" /* ContextMenuGroup.Create */
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.killViewOrEditor" /* TerminalCommandId.KillViewOrEditor */,
                        title: terminalStrings_1.terminalStrings.kill.value,
                    },
                    group: "7_kill" /* ContextMenuGroup.Kill */
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.copySelection" /* TerminalCommandId.CopySelection */,
                        title: (0, nls_1.localize)('workbench.action.terminal.copySelection.short', "Copy")
                    },
                    group: "3_edit" /* ContextMenuGroup.Edit */,
                    order: 1
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.copySelectionAsHtml" /* TerminalCommandId.CopySelectionAsHtml */,
                        title: (0, nls_1.localize)('workbench.action.terminal.copySelectionAsHtml', "Copy as HTML")
                    },
                    group: "3_edit" /* ContextMenuGroup.Edit */,
                    order: 2
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.paste" /* TerminalCommandId.Paste */,
                        title: (0, nls_1.localize)('workbench.action.terminal.paste.short', "Paste")
                    },
                    group: "3_edit" /* ContextMenuGroup.Edit */,
                    order: 3
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.clear" /* TerminalCommandId.Clear */,
                        title: (0, nls_1.localize)('workbench.action.terminal.clear', "Clear")
                    },
                    group: "5_clear" /* ContextMenuGroup.Clear */,
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.sizeToContentWidth" /* TerminalCommandId.SizeToContentWidth */,
                        title: terminalStrings_1.terminalStrings.toggleSizeToContentWidth
                    },
                    group: "9_config" /* ContextMenuGroup.Config */
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.selectAll" /* TerminalCommandId.SelectAll */,
                        title: (0, nls_1.localize)('workbench.action.terminal.selectAll', "Select All"),
                    },
                    group: "3_edit" /* ContextMenuGroup.Edit */,
                    order: 3
                }
            },
        ]);
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    group: "1_create" /* ContextMenuGroup.Create */,
                    command: {
                        id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                        title: terminalStrings_1.terminalStrings.split.value
                    }
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
                        title: terminalStrings_1.terminalStrings.new
                    },
                    group: "1_create" /* ContextMenuGroup.Create */
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.killEditor" /* TerminalCommandId.KillEditor */,
                        title: terminalStrings_1.terminalStrings.kill.value
                    },
                    group: "7_kill" /* ContextMenuGroup.Kill */
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.copySelection" /* TerminalCommandId.CopySelection */,
                        title: (0, nls_1.localize)('workbench.action.terminal.copySelection.short', "Copy")
                    },
                    group: "3_edit" /* ContextMenuGroup.Edit */,
                    order: 1
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.copySelectionAsHtml" /* TerminalCommandId.CopySelectionAsHtml */,
                        title: (0, nls_1.localize)('workbench.action.terminal.copySelectionAsHtml', "Copy as HTML")
                    },
                    group: "3_edit" /* ContextMenuGroup.Edit */,
                    order: 2
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.paste" /* TerminalCommandId.Paste */,
                        title: (0, nls_1.localize)('workbench.action.terminal.paste.short', "Paste")
                    },
                    group: "3_edit" /* ContextMenuGroup.Edit */,
                    order: 3
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.clear" /* TerminalCommandId.Clear */,
                        title: (0, nls_1.localize)('workbench.action.terminal.clear', "Clear")
                    },
                    group: "5_clear" /* ContextMenuGroup.Clear */,
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.selectAll" /* TerminalCommandId.SelectAll */,
                        title: (0, nls_1.localize)('workbench.action.terminal.selectAll', "Select All"),
                    },
                    group: "3_edit" /* ContextMenuGroup.Edit */,
                    order: 3
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.sizeToContentWidth" /* TerminalCommandId.SizeToContentWidth */,
                        title: terminalStrings_1.terminalStrings.toggleSizeToContentWidth
                    },
                    group: "9_config" /* ContextMenuGroup.Config */
                }
            }
        ]);
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.TerminalTabEmptyAreaContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */,
                        title: (0, nls_1.localize)('workbench.action.terminal.newWithProfile.short', "New Terminal With Profile")
                    },
                    group: "1_create" /* ContextMenuGroup.Create */
                }
            },
            {
                id: actions_2.MenuId.TerminalTabEmptyAreaContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
                        title: terminalStrings_1.terminalStrings.new
                    },
                    group: "1_create" /* ContextMenuGroup.Create */
                }
            }
        ]);
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.TerminalNewDropdownContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.selectDefaultShell" /* TerminalCommandId.SelectDefaultProfile */,
                        title: (0, nls_1.localize2)('workbench.action.terminal.selectDefaultProfile', 'Select Default Profile'),
                    },
                    group: '3_configure'
                }
            },
            {
                id: actions_2.MenuId.TerminalNewDropdownContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.openSettings" /* TerminalCommandId.ConfigureTerminalSettings */,
                        title: (0, nls_1.localize)('workbench.action.terminal.openSettings', "Configure Terminal Settings")
                    },
                    group: '3_configure'
                }
            },
            {
                id: actions_2.MenuId.TerminalNewDropdownContext,
                item: {
                    command: {
                        id: 'workbench.action.tasks.runTask',
                        title: (0, nls_1.localize)('workbench.action.tasks.runTask', "Run Task...")
                    },
                    when: taskService_1.TaskExecutionSupportedContext,
                    group: '4_tasks',
                    order: 1
                },
            },
            {
                id: actions_2.MenuId.TerminalNewDropdownContext,
                item: {
                    command: {
                        id: 'workbench.action.tasks.configureTaskRunner',
                        title: (0, nls_1.localize)('workbench.action.tasks.configureTaskRunner', "Configure Tasks...")
                    },
                    when: taskService_1.TaskExecutionSupportedContext,
                    group: '4_tasks',
                    order: 2
                },
            }
        ]);
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.ViewTitle,
                item: {
                    command: {
                        id: "workbench.action.terminal.switchTerminal" /* TerminalCommandId.SwitchTerminal */,
                        title: (0, nls_1.localize2)('workbench.action.terminal.switchTerminal', 'Switch Terminal')
                    },
                    group: 'navigation',
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', terminal_2.TERMINAL_VIEW_ID), contextkey_1.ContextKeyExpr.not(`config.${"terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */}`)),
                }
            },
            {
                // This is used to show instead of tabs when there is only a single terminal
                id: actions_2.MenuId.ViewTitle,
                item: {
                    command: {
                        id: "workbench.action.terminal.focus" /* TerminalCommandId.Focus */,
                        title: terminalStrings_1.terminalStrings.focus
                    },
                    alt: {
                        id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                        title: terminalStrings_1.terminalStrings.split.value,
                        icon: codicons_1.Codicon.splitHorizontal
                    },
                    group: 'navigation',
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', terminal_2.TERMINAL_VIEW_ID), contextkey_1.ContextKeyExpr.has(`config.${"terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */}`), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActiveTerminal" /* TerminalSettingId.TabsShowActiveTerminal */}`, 'singleTerminal'), contextkey_1.ContextKeyExpr.equals("terminalGroupCount" /* TerminalContextKeyStrings.GroupCount */, 1)), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActiveTerminal" /* TerminalSettingId.TabsShowActiveTerminal */}`, 'singleTerminalOrNarrow'), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals("terminalGroupCount" /* TerminalContextKeyStrings.GroupCount */, 1), contextkey_1.ContextKeyExpr.has("isTerminalTabsNarrow" /* TerminalContextKeyStrings.TabsNarrow */))), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActiveTerminal" /* TerminalSettingId.TabsShowActiveTerminal */}`, 'singleGroup'), contextkey_1.ContextKeyExpr.equals("terminalGroupCount" /* TerminalContextKeyStrings.GroupCount */, 1)), contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActiveTerminal" /* TerminalSettingId.TabsShowActiveTerminal */}`, 'always'))),
                }
            },
            {
                id: actions_2.MenuId.ViewTitle,
                item: {
                    command: {
                        id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                        title: terminalStrings_1.terminalStrings.split,
                        icon: codicons_1.Codicon.splitHorizontal
                    },
                    group: 'navigation',
                    order: 2,
                    when: terminalContextKey_1.TerminalContextKeys.shouldShowViewInlineActions
                }
            },
            {
                id: actions_2.MenuId.ViewTitle,
                item: {
                    command: {
                        id: "workbench.action.terminal.kill" /* TerminalCommandId.Kill */,
                        title: terminalStrings_1.terminalStrings.kill,
                        icon: codicons_1.Codicon.trash
                    },
                    group: 'navigation',
                    order: 3,
                    when: terminalContextKey_1.TerminalContextKeys.shouldShowViewInlineActions
                }
            },
            {
                id: actions_2.MenuId.ViewTitle,
                item: {
                    command: {
                        id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
                        title: terminalStrings_1.terminalStrings.new,
                        icon: codicons_1.Codicon.plus
                    },
                    alt: {
                        id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                        title: terminalStrings_1.terminalStrings.split.value,
                        icon: codicons_1.Codicon.splitHorizontal
                    },
                    group: 'navigation',
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', terminal_2.TERMINAL_VIEW_ID), contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile, terminalContextKey_1.TerminalContextKeys.processSupported))
                }
            },
            {
                id: actions_2.MenuId.ViewTitle,
                item: {
                    command: {
                        id: "workbench.action.terminal.clear" /* TerminalCommandId.Clear */,
                        title: (0, nls_1.localize)('workbench.action.terminal.clearLong', "Clear Terminal"),
                        icon: codicons_1.Codicon.clearAll
                    },
                    group: 'navigation',
                    order: 4,
                    when: contextkey_1.ContextKeyExpr.equals('view', terminal_2.TERMINAL_VIEW_ID),
                    isHiddenByDefault: true
                }
            },
            {
                id: actions_2.MenuId.ViewTitle,
                item: {
                    command: {
                        id: "workbench.action.terminal.runActiveFile" /* TerminalCommandId.RunActiveFile */,
                        title: (0, nls_1.localize)('workbench.action.terminal.runActiveFile', "Run Active File"),
                        icon: codicons_1.Codicon.run
                    },
                    group: 'navigation',
                    order: 5,
                    when: contextkey_1.ContextKeyExpr.equals('view', terminal_2.TERMINAL_VIEW_ID),
                    isHiddenByDefault: true
                }
            },
            {
                id: actions_2.MenuId.ViewTitle,
                item: {
                    command: {
                        id: "workbench.action.terminal.runSelectedText" /* TerminalCommandId.RunSelectedText */,
                        title: (0, nls_1.localize)('workbench.action.terminal.runSelectedText', "Run Selected Text"),
                        icon: codicons_1.Codicon.selection
                    },
                    group: 'navigation',
                    order: 6,
                    when: contextkey_1.ContextKeyExpr.equals('view', terminal_2.TERMINAL_VIEW_ID),
                    isHiddenByDefault: true
                }
            },
        ]);
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.splitActiveTab" /* TerminalCommandId.SplitActiveTab */,
                        title: terminalStrings_1.terminalStrings.split.value,
                    },
                    group: "1_create" /* ContextMenuGroup.Create */,
                    order: 1
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.moveToEditor" /* TerminalCommandId.MoveToEditor */,
                        title: terminalStrings_1.terminalStrings.moveToEditor.value
                    },
                    group: "1_create" /* ContextMenuGroup.Create */,
                    order: 2
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.moveIntoNewWindow" /* TerminalCommandId.MoveIntoNewWindow */,
                        title: terminalStrings_1.terminalStrings.moveIntoNewWindow.value
                    },
                    group: "1_create" /* ContextMenuGroup.Create */,
                    order: 2
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.renameActiveTab" /* TerminalCommandId.RenameActiveTab */,
                        title: (0, nls_1.localize)('workbench.action.terminal.renameInstance', "Rename...")
                    },
                    group: "3_edit" /* ContextMenuGroup.Edit */
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.changeIconActiveTab" /* TerminalCommandId.ChangeIconActiveTab */,
                        title: (0, nls_1.localize)('workbench.action.terminal.changeIcon', "Change Icon...")
                    },
                    group: "3_edit" /* ContextMenuGroup.Edit */
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.changeColorActiveTab" /* TerminalCommandId.ChangeColorActiveTab */,
                        title: (0, nls_1.localize)('workbench.action.terminal.changeColor', "Change Color...")
                    },
                    group: "3_edit" /* ContextMenuGroup.Edit */
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.sizeToContentWidth" /* TerminalCommandId.SizeToContentWidth */,
                        title: terminalStrings_1.terminalStrings.toggleSizeToContentWidth
                    },
                    group: "3_edit" /* ContextMenuGroup.Edit */
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.joinActiveTab" /* TerminalCommandId.JoinActiveTab */,
                        title: (0, nls_1.localize)('workbench.action.terminal.joinInstance', "Join Terminals")
                    },
                    when: terminalContextKey_1.TerminalContextKeys.tabsSingularSelection.toNegated(),
                    group: "9_config" /* ContextMenuGroup.Config */
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.unsplit" /* TerminalCommandId.Unsplit */,
                        title: terminalStrings_1.terminalStrings.unsplit.value
                    },
                    when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.tabsSingularSelection, terminalContextKey_1.TerminalContextKeys.splitTerminal),
                    group: "9_config" /* ContextMenuGroup.Config */
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.killActiveTab" /* TerminalCommandId.KillActiveTab */,
                        title: terminalStrings_1.terminalStrings.kill.value
                    },
                    group: "7_kill" /* ContextMenuGroup.Kill */,
                }
            }
        ]);
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, {
            command: {
                id: "workbench.action.terminal.moveToTerminalPanel" /* TerminalCommandId.MoveToTerminalPanel */,
                title: terminalStrings_1.terminalStrings.moveToTerminalPanel
            },
            when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeTerminal),
            group: '2_files'
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, {
            command: {
                id: "workbench.action.terminal.rename" /* TerminalCommandId.Rename */,
                title: terminalStrings_1.terminalStrings.rename
            },
            when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeTerminal),
            group: '2_files'
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, {
            command: {
                id: "workbench.action.terminal.changeColor" /* TerminalCommandId.ChangeColor */,
                title: terminalStrings_1.terminalStrings.changeColor
            },
            when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeTerminal),
            group: '2_files'
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, {
            command: {
                id: "workbench.action.terminal.changeIcon" /* TerminalCommandId.ChangeIcon */,
                title: terminalStrings_1.terminalStrings.changeIcon
            },
            when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeTerminal),
            group: '2_files'
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, {
            command: {
                id: "workbench.action.terminal.sizeToContentWidth" /* TerminalCommandId.SizeToContentWidth */,
                title: terminalStrings_1.terminalStrings.toggleSizeToContentWidth
            },
            when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeTerminal),
            group: '2_files'
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, {
            command: {
                id: "workbench.action.createTerminalEditorSameGroup" /* TerminalCommandId.CreateTerminalEditorSameGroup */,
                title: terminalStrings_1.terminalStrings.new,
                icon: codicons_1.Codicon.plus
            },
            alt: {
                id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                title: terminalStrings_1.terminalStrings.split.value,
                icon: codicons_1.Codicon.splitHorizontal
            },
            group: 'navigation',
            order: 0,
            when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeTerminal)
        });
    }
    function getTerminalActionBarArgs(location, profiles, defaultProfileName, contributedProfiles, terminalService, dropdownMenu) {
        let dropdownActions = [];
        let submenuActions = [];
        profiles = profiles.filter(e => !e.isAutoDetected);
        const splitLocation = (location === terminal_1.TerminalLocation.Editor || (typeof location === 'object' && 'viewColumn' in location && location.viewColumn === editorService_1.ACTIVE_GROUP)) ? { viewColumn: editorService_1.SIDE_GROUP } : { splitActiveTerminal: true };
        for (const p of profiles) {
            const isDefault = p.profileName === defaultProfileName;
            const options = { config: p, location };
            const splitOptions = { config: p, location: splitLocation };
            const sanitizedProfileName = p.profileName.replace(/[\n\r\t]/g, '');
            dropdownActions.push(new actions_1.Action("workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */, isDefault ? (0, nls_1.localize)('defaultTerminalProfile', "{0} (Default)", sanitizedProfileName) : sanitizedProfileName, undefined, true, async () => {
                const instance = await terminalService.createTerminal(options);
                terminalService.setActiveInstance(instance);
                await terminalService.focusActiveInstance();
            }));
            submenuActions.push(new actions_1.Action("workbench.action.terminal.split" /* TerminalCommandId.Split */, isDefault ? (0, nls_1.localize)('defaultTerminalProfile', "{0} (Default)", sanitizedProfileName) : sanitizedProfileName, undefined, true, async () => {
                const instance = await terminalService.createTerminal(splitOptions);
                terminalService.setActiveInstance(instance);
                await terminalService.focusActiveInstance();
            }));
        }
        for (const contributed of contributedProfiles) {
            const isDefault = contributed.title === defaultProfileName;
            const title = isDefault ? (0, nls_1.localize)('defaultTerminalProfile', "{0} (Default)", contributed.title.replace(/[\n\r\t]/g, '')) : contributed.title.replace(/[\n\r\t]/g, '');
            dropdownActions.push(new actions_1.Action('contributed', title, undefined, true, () => terminalService.createTerminal({
                config: {
                    extensionIdentifier: contributed.extensionIdentifier,
                    id: contributed.id,
                    title
                },
                location
            })));
            submenuActions.push(new actions_1.Action('contributed-split', title, undefined, true, () => terminalService.createTerminal({
                config: {
                    extensionIdentifier: contributed.extensionIdentifier,
                    id: contributed.id,
                    title
                },
                location: splitLocation
            })));
        }
        const defaultProfileAction = dropdownActions.find(d => d.label.endsWith('(Default)'));
        if (defaultProfileAction) {
            dropdownActions = dropdownActions.filter(d => d !== defaultProfileAction).sort((a, b) => a.label.localeCompare(b.label));
            dropdownActions.unshift(defaultProfileAction);
        }
        if (dropdownActions.length > 0) {
            dropdownActions.push(new actions_1.SubmenuAction('split.profile', (0, nls_1.localize)('splitTerminal', 'Split Terminal'), submenuActions));
            dropdownActions.push(new actions_1.Separator());
        }
        const actions = dropdownMenu.getActions();
        dropdownActions.push(...actions_1.Separator.join(...actions.map(a => a[1])));
        const defaultSubmenuProfileAction = submenuActions.find(d => d.label.endsWith('(Default)'));
        if (defaultSubmenuProfileAction) {
            submenuActions = submenuActions.filter(d => d !== defaultSubmenuProfileAction).sort((a, b) => a.label.localeCompare(b.label));
            submenuActions.unshift(defaultSubmenuProfileAction);
        }
        const dropdownAction = new actions_1.Action('refresh profiles', (0, nls_1.localize)('launchProfile', 'Launch Profile...'), 'codicon-chevron-down', true);
        return { dropdownAction, dropdownMenuActions: dropdownActions, className: `terminal-tab-actions-${terminalService.resolveLocation(location)}` };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxNZW51cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbE1lbnVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdDaEcsZ0RBb29CQztJQUVELDREQXFFQztJQTF0QkQsSUFBVyxnQkFNVjtJQU5ELFdBQVcsZ0JBQWdCO1FBQzFCLHVDQUFtQixDQUFBO1FBQ25CLG1DQUFlLENBQUE7UUFDZixxQ0FBaUIsQ0FBQTtRQUNqQixtQ0FBZSxDQUFBO1FBQ2YsdUNBQW1CLENBQUE7SUFDcEIsQ0FBQyxFQU5VLGdCQUFnQixLQUFoQixnQkFBZ0IsUUFNMUI7SUFFRCxJQUFrQixvQkFLakI7SUFMRCxXQUFrQixvQkFBb0I7UUFDckMsMkNBQW1CLENBQUE7UUFDbkIscUNBQWEsQ0FBQTtRQUNiLDJDQUFtQixDQUFBO1FBQ25CLGlEQUF5QixDQUFBO0lBQzFCLENBQUMsRUFMaUIsb0JBQW9CLG9DQUFwQixvQkFBb0IsUUFLckM7SUFFRCxTQUFnQixrQkFBa0I7UUFDakMsc0JBQVksQ0FBQyxlQUFlLENBQzNCO1lBQ0M7Z0JBQ0MsRUFBRSxFQUFFLGdCQUFNLENBQUMsbUJBQW1CO2dCQUM5QixJQUFJLEVBQUU7b0JBQ0wsS0FBSyw4Q0FBNkI7b0JBQ2xDLE9BQU8sRUFBRTt3QkFDUixFQUFFLDZEQUF1Qjt3QkFDekIsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsZ0JBQWdCLENBQUM7cUJBQy9GO29CQUNELEtBQUssRUFBRSxDQUFDO2lCQUNSO2FBQ0Q7WUFDRDtnQkFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxtQkFBbUI7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