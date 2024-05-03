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
define(["require", "exports", "vs/base/browser/canIUse", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/keyCodes", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/terminal/common/terminal", "vs/platform/workspace/common/workspace", "vs/workbench/browser/actions/workspaceCommands", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalQuickAccess", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/terminal/common/terminalProfiles", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/history/common/history", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/editor/common/editorService", "vs/base/common/path", "vs/workbench/services/configurationResolver/common/variableResolver", "vs/platform/theme/common/themeService", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/common/history", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/base/common/cancellation", "vs/base/common/resources", "vs/editor/common/services/getIconClasses", "vs/platform/files/common/files", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/terminal/browser/terminalIcons", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/iterator", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/base/browser/dom", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/contrib/terminal/browser/terminalContextMenu", "vs/workbench/contrib/terminal/browser/terminalVoice", "vs/workbench/contrib/speech/common/speechService"], function (require, exports, canIUse_1, actions_1, codicons_1, keyCodes_1, network_1, platform_1, types_1, uri_1, codeEditorService_1, nls_1, accessibility_1, actions_2, commands_1, configuration_1, contextkey_1, instantiation_1, label_1, listService_1, notification_1, opener_1, quickInput_1, terminal_1, workspace_1, workspaceCommands_1, editorCommands_1, terminal_2, terminalQuickAccess_1, terminal_3, terminalContextKey_1, terminalProfiles_1, terminalStrings_1, configurationResolver_1, environmentService_1, history_1, preferences_1, remoteAgentService_1, editorService_1, path_1, variableResolver_1, themeService_1, terminalIcon_1, history_2, model_1, language_1, cancellation_1, resources_1, getIconClasses_1, files_1, clipboardService_1, terminalIcons_1, editorGroupsService_1, iterator_1, accessibilityConfiguration_1, dom_1, editorGroupColumn_1, terminalContextMenu_1, terminalVoice_1, speechService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLaunchHelpAction = exports.terminalSendSequenceCommand = exports.switchTerminalShowTabsTitle = exports.switchTerminalActionViewItemSeparator = void 0;
    exports.getCwdForSplit = getCwdForSplit;
    exports.registerTerminalAction = registerTerminalAction;
    exports.registerContextualInstanceAction = registerContextualInstanceAction;
    exports.registerActiveInstanceAction = registerActiveInstanceAction;
    exports.registerActiveXtermAction = registerActiveXtermAction;
    exports.registerTerminalActions = registerTerminalActions;
    exports.validateTerminalName = validateTerminalName;
    exports.refreshTerminalActions = refreshTerminalActions;
    exports.shrinkWorkspaceFolderCwdPairs = shrinkWorkspaceFolderCwdPairs;
    exports.switchTerminalActionViewItemSeparator = '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500';
    exports.switchTerminalShowTabsTitle = (0, nls_1.localize)('showTerminalTabs', "Show Tabs");
    const category = terminalStrings_1.terminalStrings.actionCategory;
    // Some terminal context keys get complicated. Since normalizing and/or context keys can be
    // expensive this is done once per context key and shared.
    const sharedWhenClause = (() => {
        const terminalAvailable = contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated);
        return {
            terminalAvailable,
            terminalAvailable_and_opened: contextkey_1.ContextKeyExpr.and(terminalAvailable, terminalContextKey_1.TerminalContextKeys.isOpen),
            terminalAvailable_and_editorActive: contextkey_1.ContextKeyExpr.and(terminalAvailable, terminalContextKey_1.TerminalContextKeys.terminalEditorActive),
            terminalAvailable_and_singularSelection: contextkey_1.ContextKeyExpr.and(terminalAvailable, terminalContextKey_1.TerminalContextKeys.tabsSingularSelection),
            focusInAny_and_normalBuffer: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focusInAny, terminalContextKey_1.TerminalContextKeys.altBufferActive.negate())
        };
    })();
    async function getCwdForSplit(configHelper, instance, folders, commandService) {
        switch (configHelper.config.splitCwd) {
            case 'workspaceRoot':
                if (folders !== undefined && commandService !== undefined) {
                    if (folders.length === 1) {
                        return folders[0].uri;
                    }
                    else if (folders.length > 1) {
                        // Only choose a path when there's more than 1 folder
                        const options = {
                            placeHolder: (0, nls_1.localize)('workbench.action.terminal.newWorkspacePlaceholder', "Select current working directory for new terminal")
                        };
                        const workspace = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID, [options]);
                        if (!workspace) {
                            // Don't split the instance if the workspace picker was canceled
                            return undefined;
                        }
                        return Promise.resolve(workspace.uri);
                    }
                }
                return '';
            case 'initial':
                return instance.getInitialCwd();
            case 'inherited':
                return instance.getCwd();
        }
    }
    const terminalSendSequenceCommand = async (accessor, args) => {
        const instance = accessor.get(terminal_2.ITerminalService).activeInstance;
        if (instance) {
            const text = (0, types_1.isObject)(args) && 'text' in args ? toOptionalString(args.text) : undefined;
            if (!text) {
                return;
            }
            const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
            const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
            const historyService = accessor.get(history_1.IHistoryService);
            const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(instance.isRemote ? network_1.Schemas.vscodeRemote : network_1.Schemas.file);
            const lastActiveWorkspaceRoot = activeWorkspaceRootUri ? workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) ?? undefined : undefined;
            const resolvedText = await configurationResolverService.resolveAsync(lastActiveWorkspaceRoot, text);
            instance.sendText(resolvedText, false);
        }
    };
    exports.terminalSendSequenceCommand = terminalSendSequenceCommand;
    let TerminalLaunchHelpAction = class TerminalLaunchHelpAction extends actions_1.Action {
        constructor(_openerService) {
            super('workbench.action.terminal.launchHelp', (0, nls_1.localize)('terminalLaunchHelp', "Open Help"));
            this._openerService = _openerService;
        }
        async run() {
            this._openerService.open('https://aka.ms/vscode-troubleshoot-terminal-launch');
        }
    };
    exports.TerminalLaunchHelpAction = TerminalLaunchHelpAction;
    exports.TerminalLaunchHelpAction = TerminalLaunchHelpAction = __decorate([
        __param(0, opener_1.IOpenerService)
    ], TerminalLaunchHelpAction);
    /**
     * A wrapper function around registerAction2 to help make registering terminal actions more concise.
     * The following default options are used if undefined:
     *
     * - `f1`: true
     * - `category`: Terminal
     * - `precondition`: TerminalContextKeys.processSupported
     */
    function registerTerminalAction(options) {
        // Set defaults
        options.f1 = options.f1 ?? true;
        options.category = options.category ?? category;
        options.precondition = options.precondition ?? terminalContextKey_1.TerminalContextKeys.processSupported;
        // Remove run function from options so it's not passed through to registerAction2
        const runFunc = options.run;
        const strictOptions = options;
        delete strictOptions['run'];
        // Register
        return (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super(strictOptions);
            }
            run(accessor, args, args2) {
                return runFunc(getTerminalServices(accessor), accessor, args, args2);
            }
        });
    }
    function parseActionArgs(args) {
        if (Array.isArray(args)) {
            if (args.every(e => e instanceof terminalContextMenu_1.InstanceContext)) {
                return args;
            }
        }
        else if (args instanceof terminalContextMenu_1.InstanceContext) {
            return [args];
        }
        return undefined;
    }
    /**
     * A wrapper around {@link registerTerminalAction} that runs a callback for all currently selected
     * instances provided in the action context. This falls back to the active instance if there are no
     * contextual instances provided.
     */
    function registerContextualInstanceAction(options) {
        const originalRun = options.run;
        return registerTerminalAction({
            ...options,
            run: async (c, accessor, focusedInstanceArgs, allInstanceArgs) => {
                let instances = getSelectedInstances2(accessor, allInstanceArgs);
                if (!instances) {
                    const activeInstance = (options.activeInstanceType === 'view'
                        ? c.groupService
                        : options.activeInstanceType === 'editor' ?
                            c.editorService
                            : c.service).activeInstance;
                    if (!activeInstance) {
                        return;
                    }
                    instances = [activeInstance];
                }
                const results = [];
                for (const instance of instances) {
                    results.push(originalRun(instance, c, accessor, focusedInstanceArgs));
                }
                await Promise.all(results);
                if (options.runAfter) {
                    options.runAfter(instances, c, accessor, focusedInstanceArgs);
                }
            }
        });
    }
    /**
     * A wrapper around {@link registerTerminalAction} that ensures an active instance exists and
     * provides it to the run function.
     */
    function registerActiveInstanceAction(options) {
        const originalRun = options.run;
        return registerTerminalAction({
            ...options,
            run: (c, accessor, args) => {
                const activeInstance = c.service.activeInstance;
                if (activeInstance) {
                    return originalRun(activeInstance, c, accessor, args);
                }
            }
        });
    }
    /**
     * A wrapper around {@link registerTerminalAction} that ensures an active terminal
     * exists and provides it to the run function.
     *
     * This includes detached xterm terminals that are not managed by an {@link ITerminalInstance}.
     */
    function registerActiveXtermAction(options) {
        const originalRun = options.run;
        return registerTerminalAction({
            ...options,
            run: (c, accessor, args) => {
                const activeDetached = iterator_1.Iterable.find(c.service.detachedInstances, d => d.xterm.isFocused);
                if (activeDetached) {
                    return originalRun(activeDetached.xterm, accessor, activeDetached, args);
                }
                const activeInstance = c.service.activeInstance;
                if (activeInstance?.xterm) {
                    return originalRun(activeInstance.xterm, accessor, activeInstance, args);
                }
            }
        });
    }
    function getTerminalServices(accessor) {
        return {
            service: accessor.get(terminal_2.ITerminalService),
            groupService: accessor.get(terminal_2.ITerminalGroupService),
            instanceService: accessor.get(terminal_2.ITerminalInstanceService),
            editorService: accessor.get(terminal_2.ITerminalEditorService),
            profileService: accessor.get(terminal_3.ITerminalProfileService),
            profileResolverService: accessor.get(terminal_3.ITerminalProfileResolverService)
        };
    }
    function registerTerminalActions() {
        registerTerminalAction({
            id: "workbench.action.terminal.newInActiveWorkspace" /* TerminalCommandId.NewInActiveWorkspace */,
            title: (0, nls_1.localize2)('workbench.action.terminal.newInActiveWorkspace', 'Create New Terminal (In Active Workspace)'),
            run: async (c) => {
                if (c.service.isProcessSupportRegistered) {
                    const instance = await c.service.createTerminal({ location: c.service.defaultLocation });
                    if (!instance) {
                        return;
                    }
                    c.service.setActiveInstance(instance);
                }
                await c.groupService.showPanel(true);
            }
        });
        // Register new with profile command
        refreshTerminalActions([]);
        registerTerminalAction({
            id: "workbench.action.createTerminalEditor" /* TerminalCommandId.CreateTerminalEditor */,
            title: (0, nls_1.localize2)('workbench.action.terminal.createTerminalEditor', 'Create New Terminal in Editor Area'),
            run: async (c, _, args) => {
                const options = ((0, types_1.isObject)(args) && 'location' in args) ? args : { location: terminal_1.TerminalLocation.Editor };
                const instance = await c.service.createTerminal(options);
                await instance.focusWhenReady();
            }
        });
        registerTerminalAction({
            id: "workbench.action.createTerminalEditorSameGroup" /* TerminalCommandId.CreateTerminalEditorSameGroup */,
            title: (0, nls_1.localize2)('workbench.action.terminal.createTerminalEditor', 'Create New Terminal in Editor Area'),
            f1: false,
            run: async (c, accessor, args) => {
                // Force the editor into the same editor group if it's locked. This command is only ever
                // called when a terminal is the active editor
                const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const instance = await c.service.createTerminal({
                    location: { viewColumn: (0, editorGroupColumn_1.editorGroupToColumn)(editorGroupsService, editorGroupsService.activeGroup) }
                });
                await instance.focusWhenReady();
            }
        });
        registerTerminalAction({
            id: "workbench.action.createTerminalEditorSide" /* TerminalCommandId.CreateTerminalEditorSide */,
            title: (0, nls_1.localize2)('workbench.action.terminal.createTerminalEditorSide', 'Create New Terminal in Editor Area to the Side'),
            run: async (c) => {
                const instance = await c.service.createTerminal({
                    location: { viewColumn: editorService_1.SIDE_GROUP }
                });
                await instance.focusWhenReady();
            }
        });
        registerContextualInstanceAction({
            id: "workbench.action.terminal.moveToEditor" /* TerminalCommandId.MoveToEditor */,
            title: terminalStrings_1.terminalStrings.moveToEditor,
            precondition: sharedWhenClause.terminalAvailable_and_opened,
            activeInstanceType: 'view',
            run: (instance, c) => c.service.moveToEditor(instance),
            runAfter: (instances) => instances.at(-1)?.focus()
        });
        registerContextualInstanceAction({
            id: "workbench.action.terminal.moveIntoNewWindow" /* TerminalCommandId.MoveIntoNewWindow */,
            title: terminalStrings_1.terminalStrings.moveIntoNewWindow,
            precondition: sharedWhenClause.terminalAvailable_and_opened,
            run: (instance, c) => c.service.moveIntoNewEditor(instance),
            runAfter: (instances) => instances.at(-1)?.focus()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.moveToTerminalPanel" /* TerminalCommandId.MoveToTerminalPanel */,
            title: terminalStrings_1.terminalStrings.moveToTerminalPanel,
            precondition: sharedWhenClause.terminalAvailable_and_editorActive,
            run: (c, _, args) => {
                const source = toOptionalUri(args) ?? c.editorService.activeInstance;
                if (source) {
                    c.service.moveToTerminalView(source);
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focusPreviousPane" /* TerminalCommandId.FocusPreviousPane */,
            title: (0, nls_1.localize2)('workbench.action.terminal.focusPreviousPane', 'Focus Previous Terminal in Terminal Group'),
            keybinding: {
                primary: 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */,
                secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */],
                mac: {
                    primary: 512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */,
                    secondary: [512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */]
                },
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c) => {
                c.groupService.activeGroup?.focusPreviousPane();
                await c.groupService.showPanel(true);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focusNextPane" /* TerminalCommandId.FocusNextPane */,
            title: (0, nls_1.localize2)('workbench.action.terminal.focusNextPane', 'Focus Next Terminal in Terminal Group'),
            keybinding: {
                primary: 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */,
                secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */],
                mac: {
                    primary: 512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */,
                    secondary: [512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */]
                },
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c) => {
                c.groupService.activeGroup?.focusNextPane();
                await c.groupService.showPanel(true);
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.runRecentCommand" /* TerminalCommandId.RunRecentCommand */,
            title: (0, nls_1.localize2)('workbench.action.terminal.runRecentCommand', 'Run Recent Command...'),
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: [
                {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 48 /* KeyCode.KeyR */,
                    when: contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("terminal" /* AccessibleViewProviderId.Terminal */)))),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */ },
                    when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            ],
            run: async (activeInstance, c) => {
                await activeInstance.runRecent('command');
                if (activeInstance?.target === terminal_1.TerminalLocation.Editor) {
                    await c.editorService.revealActiveEditor();
                }
                else {
                    await c.groupService.showPanel(false);
                }
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.copyLastCommand" /* TerminalCommandId.CopyLastCommand */,
            title: (0, nls_1.localize2)('workbench.action.terminal.copyLastCommand', "Copy Last Command"),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (instance, c, accessor) => {
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const commands = instance.capabilities.get(2 /* TerminalCapability.CommandDetection */)?.commands;
                if (!commands || commands.length === 0) {
                    return;
                }
                const command = commands[commands.length - 1];
                if (!command.command) {
                    return;
                }
                await clipboardService.writeText(command.command);
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.copyLastCommandOutput" /* TerminalCommandId.CopyLastCommandOutput */,
            title: (0, nls_1.localize2)('workbench.action.terminal.copyLastCommandOutput', "Copy Last Command Output"),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (instance, c, accessor) => {
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const commands = instance.capabilities.get(2 /* TerminalCapability.CommandDetection */)?.commands;
                if (!commands || commands.length === 0) {
                    return;
                }
                const command = commands[commands.length - 1];
                if (!command?.hasOutput()) {
                    return;
                }
                const output = command.getOutput();
                if ((0, types_1.isString)(output)) {
                    await clipboardService.writeText(output);
                }
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.copyLastCommandAndLastCommandOutput" /* TerminalCommandId.CopyLastCommandAndLastCommandOutput */,
            title: (0, nls_1.localize2)('workbench.action.terminal.copyLastCommandAndOutput', "Copy Last Command and Output"),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (instance, c, accessor) => {
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const commands = instance.capabilities.get(2 /* TerminalCapability.CommandDetection */)?.commands;
                if (!commands || commands.length === 0) {
                    return;
                }
                const command = commands[commands.length - 1];
                if (!command?.hasOutput()) {
                    return;
                }
                const output = command.getOutput();
                if ((0, types_1.isString)(output)) {
                    await clipboardService.writeText(`${command.command !== '' ? command.command + '\n' : ''}${output}`);
                }
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.goToRecentDirectory" /* TerminalCommandId.GoToRecentDirectory */,
            title: (0, nls_1.localize2)('workbench.action.terminal.goToRecentDirectory', 'Go to Recent Directory...'),
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */,
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            run: async (activeInstance, c) => {
                await activeInstance.runRecent('cwd');
                if (activeInstance?.target === terminal_1.TerminalLocation.Editor) {
                    await c.editorService.revealActiveEditor();
                }
                else {
                    await c.groupService.showPanel(false);
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.resizePaneLeft" /* TerminalCommandId.ResizePaneLeft */,
            title: (0, nls_1.localize2)('workbench.action.terminal.resizePaneLeft', 'Resize Terminal Left'),
            keybinding: {
                linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */ },
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 15 /* KeyCode.LeftArrow */ },
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (c) => c.groupService.activeGroup?.resizePane(0 /* Direction.Left */)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.resizePaneRight" /* TerminalCommandId.ResizePaneRight */,
            title: (0, nls_1.localize2)('workbench.action.terminal.resizePaneRight', 'Resize Terminal Right'),
            keybinding: {
                linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */ },
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 17 /* KeyCode.RightArrow */ },
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (c) => c.groupService.activeGroup?.resizePane(1 /* Direction.Right */)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.resizePaneUp" /* TerminalCommandId.ResizePaneUp */,
            title: (0, nls_1.localize2)('workbench.action.terminal.resizePaneUp', 'Resize Terminal Up'),
            keybinding: {
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 16 /* KeyCode.UpArrow */ },
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (c) => c.groupService.activeGroup?.resizePane(2 /* Direction.Up */)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.resizePaneDown" /* TerminalCommandId.ResizePaneDown */,
            title: (0, nls_1.localize2)('workbench.action.terminal.resizePaneDown', 'Resize Terminal Down'),
            keybinding: {
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 18 /* KeyCode.DownArrow */ },
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (c) => c.groupService.activeGroup?.resizePane(3 /* Direction.Down */)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focus" /* TerminalCommandId.Focus */,
            title: terminalStrings_1.terminalStrings.focus,
            keybinding: {
                when: contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, accessibilityConfiguration_1.accessibleViewOnLastLine, accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("terminal" /* AccessibleViewProviderId.Terminal */)),
                primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c) => {
                const instance = c.service.activeInstance || await c.service.createTerminal({ location: terminal_1.TerminalLocation.Panel });
                if (!instance) {
                    return;
                }
                c.service.setActiveInstance(instance);
                focusActiveTerminal(instance, c);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focusTabs" /* TerminalCommandId.FocusTabs */,
            title: (0, nls_1.localize2)('workbench.action.terminal.focus.tabsView', 'Focus Terminal Tabs View'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 93 /* KeyCode.Backslash */,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.tabsFocus, terminalContextKey_1.TerminalContextKeys.focus),
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (c) => c.groupService.focusTabs()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focusNext" /* TerminalCommandId.FocusNext */,
            title: (0, nls_1.localize2)('workbench.action.terminal.focusNext', 'Focus Next Terminal Group'),
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 12 /* KeyCode.PageDown */,
                mac: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 94 /* KeyCode.BracketRight */
                },
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.editorFocus.negate()),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            run: async (c) => {
                c.groupService.setActiveGroupToNext();
                await c.groupService.showPanel(true);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focusPrevious" /* TerminalCommandId.FocusPrevious */,
            title: (0, nls_1.localize2)('workbench.action.terminal.focusPrevious', 'Focus Previous Terminal Group'),
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 11 /* KeyCode.PageUp */,
                mac: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 92 /* KeyCode.BracketLeft */
                },
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.editorFocus.negate()),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            run: async (c) => {
                c.groupService.setActiveGroupToPrevious();
                await c.groupService.showPanel(true);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.runSelectedText" /* TerminalCommandId.RunSelectedText */,
            title: (0, nls_1.localize2)('workbench.action.terminal.runSelectedText', 'Run Selected Text In Active Terminal'),
            run: async (c, accessor) => {
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const editor = codeEditorService.getActiveCodeEditor();
                if (!editor || !editor.hasModel()) {
                    return;
                }
                const instance = await c.service.getActiveOrCreateInstance({ acceptsInput: true });
                const selection = editor.getSelection();
                let text;
                if (selection.isEmpty()) {
                    text = editor.getModel().getLineContent(selection.selectionStartLineNumber).trim();
                }
                else {
                    const endOfLinePreference = platform_1.isWindows ? 1 /* EndOfLinePreference.LF */ : 2 /* EndOfLinePreference.CRLF */;
                    text = editor.getModel().getValueInRange(selection, endOfLinePreference);
                }
                instance.sendText(text, true, true);
                await c.service.revealActiveTerminal(true);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.runActiveFile" /* TerminalCommandId.RunActiveFile */,
            title: (0, nls_1.localize2)('workbench.action.terminal.runActiveFile', 'Run Active File In Active Terminal'),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c, accessor) => {
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const workbenchEnvironmentService = accessor.get(environmentService_1.IWorkbenchEnvironmentService);
                const editor = codeEditorService.getActiveCodeEditor();
                if (!editor || !editor.hasModel()) {
                    return;
                }
                const instance = await c.service.getActiveOrCreateInstance({ acceptsInput: true });
                const isRemote = instance ? instance.isRemote : (workbenchEnvironmentService.remoteAuthority ? true : false);
                const uri = editor.getModel().uri;
                if ((!isRemote && uri.scheme !== network_1.Schemas.file && uri.scheme !== network_1.Schemas.vscodeUserData) || (isRemote && uri.scheme !== network_1.Schemas.vscodeRemote)) {
                    notificationService.warn((0, nls_1.localize)('workbench.action.terminal.runActiveFile.noFile', 'Only files on disk can be run in the terminal'));
                    return;
                }
                // TODO: Convert this to ctrl+c, ctrl+v for pwsh?
                await instance.sendPath(uri, true);
                return c.groupService.showPanel();
            }
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.scrollDown" /* TerminalCommandId.ScrollDownLine */,
            title: (0, nls_1.localize2)('workbench.action.terminal.scrollDown', 'Scroll Down (Line)'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */,
                linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */ },
                when: sharedWhenClause.focusInAny_and_normalBuffer,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => xterm.scrollDownLine()
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.scrollDownPage" /* TerminalCommandId.ScrollDownPage */,
            title: (0, nls_1.localize2)('workbench.action.terminal.scrollDownPage', 'Scroll Down (Page)'),
            keybinding: {
                primary: 1024 /* KeyMod.Shift */ | 12 /* KeyCode.PageDown */,
                mac: { primary: 12 /* KeyCode.PageDown */ },
                when: sharedWhenClause.focusInAny_and_normalBuffer,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => xterm.scrollDownPage()
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.scrollToBottom" /* TerminalCommandId.ScrollToBottom */,
            title: (0, nls_1.localize2)('workbench.action.terminal.scrollToBottom', 'Scroll to Bottom'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 13 /* KeyCode.End */,
                linux: { primary: 1024 /* KeyMod.Shift */ | 13 /* KeyCode.End */ },
                when: sharedWhenClause.focusInAny_and_normalBuffer,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => xterm.scrollToBottom()
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.scrollUp" /* TerminalCommandId.ScrollUpLine */,
            title: (0, nls_1.localize2)('workbench.action.terminal.scrollUp', 'Scroll Up (Line)'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */,
                linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */ },
                when: sharedWhenClause.focusInAny_and_normalBuffer,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => xterm.scrollUpLine()
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.scrollUpPage" /* TerminalCommandId.ScrollUpPage */,
            title: (0, nls_1.localize2)('workbench.action.terminal.scrollUpPage', 'Scroll Up (Page)'),
            f1: true,
            category,
            keybinding: {
                primary: 1024 /* KeyMod.Shift */ | 11 /* KeyCode.PageUp */,
                mac: { primary: 11 /* KeyCode.PageUp */ },
                when: sharedWhenClause.focusInAny_and_normalBuffer,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => xterm.scrollUpPage()
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.scrollToTop" /* TerminalCommandId.ScrollToTop */,
            title: (0, nls_1.localize2)('workbench.action.terminal.scrollToTop', 'Scroll to Top'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */,
                linux: { primary: 1024 /* KeyMod.Shift */ | 14 /* KeyCode.Home */ },
                when: sharedWhenClause.focusInAny_and_normalBuffer,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => xterm.scrollToTop()
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.clearSelection" /* TerminalCommandId.ClearSelection */,
            title: (0, nls_1.localize2)('workbench.action.terminal.clearSelection', 'Clear Selection'),
            keybinding: {
                primary: 9 /* KeyCode.Escape */,
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focusInAny, terminalContextKey_1.TerminalContextKeys.textSelected, terminalContextKey_1.TerminalContextKeys.notFindVisible),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => {
                if (xterm.hasSelection()) {
                    xterm.clearSelection();
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.changeIcon" /* TerminalCommandId.ChangeIcon */,
            title: terminalStrings_1.terminalStrings.changeIcon,
            precondition: sharedWhenClause.terminalAvailable,
            run: (c, _, args) => getResourceOrActiveInstance(c, args)?.changeIcon()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.changeIconActiveTab" /* TerminalCommandId.ChangeIconActiveTab */,
            title: terminalStrings_1.terminalStrings.changeIcon,
            f1: false,
            precondition: sharedWhenClause.terminalAvailable_and_singularSelection,
            run: async (c, accessor, args) => {
                let icon;
                if (c.groupService.lastAccessedMenu === 'inline-tab') {
                    getResourceOrActiveInstance(c, args)?.changeIcon();
                    return;
                }
                for (const terminal of getSelectedInstances(accessor) ?? []) {
                    icon = await terminal.changeIcon(icon);
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.changeColor" /* TerminalCommandId.ChangeColor */,
            title: terminalStrings_1.terminalStrings.changeColor,
            precondition: sharedWhenClause.terminalAvailable,
            run: (c, _, args) => getResourceOrActiveInstance(c, args)?.changeColor()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.changeColorActiveTab" /* TerminalCommandId.ChangeColorActiveTab */,
            title: terminalStrings_1.terminalStrings.changeColor,
            f1: false,
            precondition: sharedWhenClause.terminalAvailable_and_singularSelection,
            run: async (c, accessor, args) => {
                let color;
                let i = 0;
                if (c.groupService.lastAccessedMenu === 'inline-tab') {
                    getResourceOrActiveInstance(c, args)?.changeColor();
                    return;
                }
                for (const terminal of getSelectedInstances(accessor) ?? []) {
                    const skipQuickPick = i !== 0;
                    // Always show the quickpick on the first iteration
                    color = await terminal.changeColor(color, skipQuickPick);
                    i++;
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.rename" /* TerminalCommandId.Rename */,
            title: terminalStrings_1.terminalStrings.rename,
            precondition: sharedWhenClause.terminalAvailable,
            run: (c, accessor, args) => renameWithQuickPick(c, accessor, args)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.renameActiveTab" /* TerminalCommandId.RenameActiveTab */,
            title: terminalStrings_1.terminalStrings.rename,
            f1: false,
            keybinding: {
                primary: 60 /* KeyCode.F2 */,
                mac: {
                    primary: 3 /* KeyCode.Enter */
                },
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.tabsFocus),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable_and_singularSelection,
            run: async (c, accessor) => {
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const instances = getSelectedInstances(accessor);
                const firstInstance = instances?.[0];
                if (!firstInstance) {
                    return;
                }
                if (terminalGroupService.lastAccessedMenu === 'inline-tab') {
                    return renameWithQuickPick(c, accessor, firstInstance);
                }
                c.service.setEditingTerminal(firstInstance);
                c.service.setEditable(firstInstance, {
                    validationMessage: value => validateTerminalName(value),
                    onFinish: async (value, success) => {
                        // Cancel editing first as instance.rename will trigger a rerender automatically
                        c.service.setEditable(firstInstance, null);
                        c.service.setEditingTerminal(undefined);
                        if (success) {
                            const promises = [];
                            for (const instance of instances) {
                                promises.push((async () => {
                                    await instance.rename(value);
                                })());
                            }
                            try {
                                await Promise.all(promises);
                            }
                            catch (e) {
                                notificationService.error(e);
                            }
                        }
                    }
                });
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.detachSession" /* TerminalCommandId.DetachSession */,
            title: (0, nls_1.localize2)('workbench.action.terminal.detachSession', 'Detach Session'),
            run: (activeInstance) => activeInstance.detachProcessAndDispose(terminal_1.TerminalExitReason.User)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.attachToSession" /* TerminalCommandId.AttachToSession */,
            title: (0, nls_1.localize2)('workbench.action.terminal.attachToSession', 'Attach to Session'),
            run: async (c, accessor) => {
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const labelService = accessor.get(label_1.ILabelService);
                const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const remoteAuthority = remoteAgentService.getConnection()?.remoteAuthority ?? undefined;
                const backend = await accessor.get(terminal_2.ITerminalInstanceService).getBackend(remoteAuthority);
                if (!backend) {
                    throw new Error(`No backend registered for remote authority '${remoteAuthority}'`);
                }
                const terms = await backend.listProcesses();
                backend.reduceConnectionGraceTime();
                const unattachedTerms = terms.filter(term => !c.service.isAttachedToTerminal(term));
                const items = unattachedTerms.map(term => {
                    const cwdLabel = labelService.getUriLabel(uri_1.URI.file(term.cwd));
                    return {
                        label: term.title,
                        detail: term.workspaceName ? `${term.workspaceName} \u2E31 ${cwdLabel}` : cwdLabel,
                        description: term.pid ? String(term.pid) : '',
                        term
                    };
                });
                if (items.length === 0) {
                    notificationService.info((0, nls_1.localize)('noUnattachedTerminals', 'There are no unattached terminals to attach to'));
                    return;
                }
                const selected = await quickInputService.pick(items, { canPickMany: false });
                if (selected) {
                    const instance = await c.service.createTerminal({
                        config: { attachPersistentProcess: selected.term }
                    });
                    c.service.setActiveInstance(instance);
                    await focusActiveTerminal(instance, c);
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.quickOpenTerm" /* TerminalCommandId.QuickOpenTerm */,
            title: (0, nls_1.localize2)('quickAccessTerminal', 'Switch Active Terminal'),
            precondition: sharedWhenClause.terminalAvailable,
            run: (c, accessor) => accessor.get(quickInput_1.IQuickInputService).quickAccess.show(terminalQuickAccess_1.TerminalQuickAccessProvider.PREFIX)
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.scrollToPreviousCommand" /* TerminalCommandId.ScrollToPreviousCommand */,
            title: terminalStrings_1.terminalStrings.scrollToPreviousCommand,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            icon: codicons_1.Codicon.arrowUp,
            menu: [
                {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    order: 4,
                    when: contextkey_1.ContextKeyExpr.equals('view', terminal_3.TERMINAL_VIEW_ID),
                    isHiddenByDefault: true
                }
            ],
            run: (activeInstance) => activeInstance.xterm?.markTracker.scrollToPreviousMark(undefined, undefined, activeInstance.capabilities.has(2 /* TerminalCapability.CommandDetection */))
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.scrollToNextCommand" /* TerminalCommandId.ScrollToNextCommand */,
            title: terminalStrings_1.terminalStrings.scrollToNextCommand,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            icon: codicons_1.Codicon.arrowDown,
            menu: [
                {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    order: 4,
                    when: contextkey_1.ContextKeyExpr.equals('view', terminal_3.TERMINAL_VIEW_ID),
                    isHiddenByDefault: true
                }
            ],
            run: (activeInstance) => {
                activeInstance.xterm?.markTracker.scrollToNextMark();
                activeInstance.focus();
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.selectToPreviousCommand" /* TerminalCommandId.SelectToPreviousCommand */,
            title: (0, nls_1.localize2)('workbench.action.terminal.selectToPreviousCommand', 'Select To Previous Command'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */,
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (activeInstance) => {
                activeInstance.xterm?.markTracker.selectToPreviousMark();
                activeInstance.focus();
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.selectToNextCommand" /* TerminalCommandId.SelectToNextCommand */,
            title: (0, nls_1.localize2)('workbench.action.terminal.selectToNextCommand', 'Select To Next Command'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */,
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (activeInstance) => {
                activeInstance.xterm?.markTracker.selectToNextMark();
                activeInstance.focus();
            }
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.selectToPreviousLine" /* TerminalCommandId.SelectToPreviousLine */,
            title: (0, nls_1.localize2)('workbench.action.terminal.selectToPreviousLine', 'Select To Previous Line'),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (xterm, _, instance) => {
                xterm.markTracker.selectToPreviousLine();
                // prefer to call focus on the TerminalInstance for additional accessibility triggers
                (instance || xterm).focus();
            }
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.selectToNextLine" /* TerminalCommandId.SelectToNextLine */,
            title: (0, nls_1.localize2)('workbench.action.terminal.selectToNextLine', 'Select To Next Line'),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (xterm, _, instance) => {
                xterm.markTracker.selectToNextLine();
                // prefer to call focus on the TerminalInstance for additional accessibility triggers
                (instance || xterm).focus();
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.sendSequence" /* TerminalCommandId.SendSequence */,
            title: terminalStrings_1.terminalStrings.sendSequence,
            f1: false,
            metadata: {
                description: terminalStrings_1.terminalStrings.sendSequence.value,
                args: [{
                        name: 'args',
                        schema: {
                            type: 'object',
                            required: ['text'],
                            properties: {
                                text: {
                                    description: (0, nls_1.localize)('sendSequence', "The sequence of text to send to the terminal"),
                                    type: 'string'
                                }
                            },
                        }
                    }]
            },
            run: (c, accessor, args) => (0, exports.terminalSendSequenceCommand)(accessor, args)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.newWithCwd" /* TerminalCommandId.NewWithCwd */,
            title: terminalStrings_1.terminalStrings.newWithCwd,
            metadata: {
                description: terminalStrings_1.terminalStrings.newWithCwd.value,
                args: [{
                        name: 'args',
                        schema: {
                            type: 'object',
                            required: ['cwd'],
                            properties: {
                                cwd: {
                                    description: (0, nls_1.localize)('workbench.action.terminal.newWithCwd.cwd', "The directory to start the terminal at"),
                                    type: 'string'
                                }
                            },
                        }
                    }]
            },
            run: async (c, _, args) => {
                const cwd = (0, types_1.isObject)(args) && 'cwd' in args ? toOptionalString(args.cwd) : undefined;
                const instance = await c.service.createTerminal({ cwd });
                if (!instance) {
                    return;
                }
                c.service.setActiveInstance(instance);
                await focusActiveTerminal(instance, c);
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.renameWithArg" /* TerminalCommandId.RenameWithArgs */,
            title: terminalStrings_1.terminalStrings.renameWithArgs,
            metadata: {
                description: terminalStrings_1.terminalStrings.renameWithArgs.value,
                args: [{
                        name: 'args',
                        schema: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                                name: {
                                    description: (0, nls_1.localize)('workbench.action.terminal.renameWithArg.name', "The new name for the terminal"),
                                    type: 'string',
                                    minLength: 1
                                }
                            }
                        }
                    }]
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: async (activeInstance, c, accessor, args) => {
                const notificationService = accessor.get(notification_1.INotificationService);
                const name = (0, types_1.isObject)(args) && 'name' in args ? toOptionalString(args.name) : undefined;
                if (!name) {
                    notificationService.warn((0, nls_1.localize)('workbench.action.terminal.renameWithArg.noName', "No name argument provided"));
                    return;
                }
                activeInstance.rename(name);
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.relaunch" /* TerminalCommandId.Relaunch */,
            title: (0, nls_1.localize2)('workbench.action.terminal.relaunch', 'Relaunch Active Terminal'),
            run: (activeInstance) => activeInstance.relaunch()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
            title: terminalStrings_1.terminalStrings.split,
            precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 26 /* KeyCode.Digit5 */,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                mac: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */,
                    secondary: [256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 26 /* KeyCode.Digit5 */]
                },
                when: terminalContextKey_1.TerminalContextKeys.focus
            },
            icon: codicons_1.Codicon.splitHorizontal,
            run: async (c, accessor, args) => {
                const optionsOrProfile = (0, types_1.isObject)(args) ? args : undefined;
                const commandService = accessor.get(commands_1.ICommandService);
                const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
                const options = convertOptionsOrProfileToOptions(optionsOrProfile);
                const activeInstance = (await c.service.getInstanceHost(options?.location)).activeInstance;
                if (!activeInstance) {
                    return;
                }
                const cwd = await getCwdForSplit(c.service.configHelper, activeInstance, workspaceContextService.getWorkspace().folders, commandService);
                if (cwd === undefined) {
                    return;
                }
                const instance = await c.service.createTerminal({ location: { parentTerminal: activeInstance }, config: options?.config, cwd });
                await focusActiveTerminal(instance, c);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.splitActiveTab" /* TerminalCommandId.SplitActiveTab */,
            title: terminalStrings_1.terminalStrings.split,
            f1: false,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 26 /* KeyCode.Digit5 */,
                mac: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */,
                    secondary: [256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 26 /* KeyCode.Digit5 */]
                },
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: terminalContextKey_1.TerminalContextKeys.tabsFocus
            },
            run: async (c, accessor) => {
                const instances = getSelectedInstances(accessor);
                if (instances) {
                    const promises = [];
                    for (const t of instances) {
                        promises.push((async () => {
                            await c.service.createTerminal({ location: { parentTerminal: t } });
                            await c.groupService.showPanel(true);
                        })());
                    }
                    await Promise.all(promises);
                }
            }
        });
        registerContextualInstanceAction({
            id: "workbench.action.terminal.unsplit" /* TerminalCommandId.Unsplit */,
            title: terminalStrings_1.terminalStrings.unsplit,
            precondition: sharedWhenClause.terminalAvailable,
            run: async (instance, c) => {
                const group = c.groupService.getGroupForInstance(instance);
                if (group && group?.terminalInstances.length > 1) {
                    c.groupService.unsplitInstance(instance);
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.joinActiveTab" /* TerminalCommandId.JoinActiveTab */,
            title: (0, nls_1.localize2)('workbench.action.terminal.joinInstance', 'Join Terminals'),
            precondition: contextkey_1.ContextKeyExpr.and(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.tabsSingularSelection.toNegated()),
            run: async (c, accessor) => {
                const instances = getSelectedInstances(accessor);
                if (instances && instances.length > 1) {
                    c.groupService.joinInstances(instances);
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.join" /* TerminalCommandId.Join */,
            title: (0, nls_1.localize2)('workbench.action.terminal.join', 'Join Terminals'),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c, accessor) => {
                const themeService = accessor.get(themeService_1.IThemeService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const picks = [];
                if (c.groupService.instances.length <= 1) {
                    notificationService.warn((0, nls_1.localize)('workbench.action.terminal.join.insufficientTerminals', 'Insufficient terminals for the join action'));
                    return;
                }
                const otherInstances = c.groupService.instances.filter(i => i.instanceId !== c.groupService.activeInstance?.instanceId);
                for (const terminal of otherInstances) {
                    const group = c.groupService.getGroupForInstance(terminal);
                    if (group?.terminalInstances.length === 1) {
                        const iconId = (0, terminalIcon_1.getIconId)(accessor, terminal);
                        const label = `$(${iconId}): ${terminal.title}`;
                        const iconClasses = [];
                        const colorClass = (0, terminalIcon_1.getColorClass)(terminal);
                        if (colorClass) {
                            iconClasses.push(colorClass);
                        }
                        const uriClasses = (0, terminalIcon_1.getUriClasses)(terminal, themeService.getColorTheme().type);
                        if (uriClasses) {
                            iconClasses.push(...uriClasses);
                        }
                        picks.push({
                            terminal,
                            label,
                            iconClasses
                        });
                    }
                }
                if (picks.length === 0) {
                    notificationService.warn((0, nls_1.localize)('workbench.action.terminal.join.onlySplits', 'All terminals are joined already'));
                    return;
                }
                const result = await quickInputService.pick(picks, {});
                if (result) {
                    c.groupService.joinInstances([result.terminal, c.groupService.activeInstance]);
                }
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.splitInActiveWorkspace" /* TerminalCommandId.SplitInActiveWorkspace */,
            title: (0, nls_1.localize2)('workbench.action.terminal.splitInActiveWorkspace', 'Split Terminal (In Active Workspace)'),
            run: async (instance, c) => {
                const newInstance = await c.service.createTerminal({ location: { parentTerminal: instance } });
                if (newInstance?.target !== terminal_1.TerminalLocation.Editor) {
                    await c.groupService.showPanel(true);
                }
            }
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.selectAll" /* TerminalCommandId.SelectAll */,
            title: (0, nls_1.localize2)('workbench.action.terminal.selectAll', 'Select All'),
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: [{
                    // Don't use ctrl+a by default as that would override the common go to start
                    // of prompt shell binding
                    primary: 0,
                    // Technically this doesn't need to be here as it will fall back to this
                    // behavior anyway when handed to xterm.js, having this handled by VS Code
                    // makes it easier for users to see how it works though.
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: terminalContextKey_1.TerminalContextKeys.focusInAny
                }],
            run: (xterm) => xterm.selectAll()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
            title: (0, nls_1.localize2)('workbench.action.terminal.new', 'Create New Terminal'),
            precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile),
            icon: terminalIcons_1.newTerminalIcon,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 91 /* KeyCode.Backquote */,
                mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 91 /* KeyCode.Backquote */ },
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            run: async (c, accessor, args) => {
                let eventOrOptions = (0, types_1.isObject)(args) ? args : undefined;
                const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
                const commandService = accessor.get(commands_1.ICommandService);
                const folders = workspaceContextService.getWorkspace().folders;
                if (eventOrOptions && (0, dom_1.isMouseEvent)(eventOrOptions) && (eventOrOptions.altKey || eventOrOptions.ctrlKey)) {
                    await c.service.createTerminal({ location: { splitActiveTerminal: true } });
                    return;
                }
                if (c.service.isProcessSupportRegistered) {
                    eventOrOptions = !eventOrOptions || (0, dom_1.isMouseEvent)(eventOrOptions) ? {} : eventOrOptions;
                    let instance;
                    if (folders.length <= 1) {
                        // Allow terminal service to handle the path when there is only a
                        // single root
                        instance = await c.service.createTerminal(eventOrOptions);
                    }
                    else {
                        const cwd = (await pickTerminalCwd(accessor))?.cwd;
                        if (!cwd) {
                            // Don't create the instance if the workspace picker was canceled
                            return;
                        }
                        eventOrOptions.cwd = cwd;
                        instance = await c.service.createTerminal(eventOrOptions);
                    }
                    c.service.setActiveInstance(instance);
                    await focusActiveTerminal(instance, c);
                }
                else {
                    if (c.profileService.contributedProfiles.length > 0) {
                        commandService.executeCommand("workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */);
                    }
                    else {
                        commandService.executeCommand("workbench.action.terminal.toggleTerminal" /* TerminalCommandId.Toggle */);
                    }
                }
            }
        });
        async function killInstance(c, instance) {
            if (!instance) {
                return;
            }
            await c.service.safeDisposeTerminal(instance);
            if (c.groupService.instances.length > 0) {
                await c.groupService.showPanel(true);
            }
        }
        registerTerminalAction({
            id: "workbench.action.terminal.kill" /* TerminalCommandId.Kill */,
            title: (0, nls_1.localize2)('workbench.action.terminal.kill', 'Kill the Active Terminal Instance'),
            precondition: contextkey_1.ContextKeyExpr.or(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.isOpen),
            icon: terminalIcons_1.killTerminalIcon,
            run: async (c) => killInstance(c, c.groupService.activeInstance)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.killViewOrEditor" /* TerminalCommandId.KillViewOrEditor */,
            title: terminalStrings_1.terminalStrings.kill,
            f1: false, // This is an internal command used for context menus
            precondition: contextkey_1.ContextKeyExpr.or(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.isOpen),
            run: async (c) => killInstance(c, c.service.activeInstance)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.killAll" /* TerminalCommandId.KillAll */,
            title: (0, nls_1.localize2)('workbench.action.terminal.killAll', 'Kill All Terminals'),
            precondition: contextkey_1.ContextKeyExpr.or(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.isOpen),
            icon: codicons_1.Codicon.trash,
            run: async (c) => {
                const disposePromises = [];
                for (const instance of c.service.instances) {
                    disposePromises.push(c.service.safeDisposeTerminal(instance));
                }
                await Promise.all(disposePromises);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.killEditor" /* TerminalCommandId.KillEditor */,
            title: (0, nls_1.localize2)('workbench.action.terminal.killEditor', 'Kill the Active Terminal in Editor Area'),
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */,
                win: { primary: 2048 /* KeyMod.CtrlCmd */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */] },
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.editorFocus)
            },
            run: (c, accessor) => accessor.get(commands_1.ICommandService).executeCommand(editorCommands_1.CLOSE_EDITOR_COMMAND_ID)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.killActiveTab" /* TerminalCommandId.KillActiveTab */,
            title: terminalStrings_1.terminalStrings.kill,
            f1: false,
            precondition: contextkey_1.ContextKeyExpr.or(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.isOpen),
            keybinding: {
                primary: 20 /* KeyCode.Delete */,
                mac: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
                    secondary: [20 /* KeyCode.Delete */]
                },
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: terminalContextKey_1.TerminalContextKeys.tabsFocus
            },
            run: async (c, accessor) => {
                const disposePromises = [];
                for (const terminal of getSelectedInstances(accessor, true) ?? []) {
                    disposePromises.push(c.service.safeDisposeTerminal(terminal));
                }
                await Promise.all(disposePromises);
                c.groupService.focusTabs();
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focusHover" /* TerminalCommandId.FocusHover */,
            title: terminalStrings_1.terminalStrings.focusHover,
            precondition: contextkey_1.ContextKeyExpr.or(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.isOpen),
            keybinding: {
                primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.tabsFocus, terminalContextKey_1.TerminalContextKeys.focus)
            },
            run: (c) => c.groupService.focusHover()
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.clear" /* TerminalCommandId.Clear */,
            title: (0, nls_1.localize2)('workbench.action.terminal.clear', 'Clear'),
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: [{
                    primary: 0,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */ },
                    // Weight is higher than work workbench contributions so the keybinding remains
                    // highest priority when chords are registered afterwards
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                    // Disable the keybinding when accessibility mode is enabled as chords include
                    // important screen reader keybindings such as cmd+k, cmd+i to show the hover
                    when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()), contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("terminal" /* AccessibleViewProviderId.Terminal */))),
                }],
            run: (activeInstance) => activeInstance.clearBuffer()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.selectDefaultShell" /* TerminalCommandId.SelectDefaultProfile */,
            title: (0, nls_1.localize2)('workbench.action.terminal.selectDefaultShell', 'Select Default Profile'),
            run: (c) => c.service.showProfileQuickPick('setDefault')
        });
        registerTerminalAction({
            id: "workbench.action.terminal.openSettings" /* TerminalCommandId.ConfigureTerminalSettings */,
            title: (0, nls_1.localize2)('workbench.action.terminal.openSettings', 'Configure Terminal Settings'),
            precondition: sharedWhenClause.terminalAvailable,
            run: (c, accessor) => accessor.get(preferences_1.IPreferencesService).openSettings({ jsonEditor: false, query: '@feature:terminal' })
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.setDimensions" /* TerminalCommandId.SetDimensions */,
            title: (0, nls_1.localize2)('workbench.action.terminal.setFixedDimensions', 'Set Fixed Dimensions'),
            precondition: sharedWhenClause.terminalAvailable_and_opened,
            run: (activeInstance) => activeInstance.setFixedDimensions()
        });
        registerContextualInstanceAction({
            id: "workbench.action.terminal.sizeToContentWidth" /* TerminalCommandId.SizeToContentWidth */,
            title: terminalStrings_1.terminalStrings.toggleSizeToContentWidth,
            precondition: sharedWhenClause.terminalAvailable_and_opened,
            keybinding: {
                primary: 512 /* KeyMod.Alt */ | 56 /* KeyCode.KeyZ */,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: terminalContextKey_1.TerminalContextKeys.focus
            },
            run: (instance) => instance.toggleSizeToContentWidth()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.clearPreviousSessionHistory" /* TerminalCommandId.ClearPreviousSessionHistory */,
            title: (0, nls_1.localize2)('workbench.action.terminal.clearPreviousSessionHistory', 'Clear Previous Session History'),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c, accessor) => {
                (0, history_2.getCommandHistory)(accessor).clear();
                (0, history_2.clearShellFileHistory)();
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.toggleStickyScroll" /* TerminalCommandId.ToggleStickyScroll */,
            title: (0, nls_1.localize2)('workbench.action.terminal.toggleStickyScroll', 'Toggle Sticky Scroll'),
            toggled: {
                condition: contextkey_1.ContextKeyExpr.equals('config.terminal.integrated.stickyScroll.enabled', true),
                title: (0, nls_1.localize)('stickyScroll', "Sticky Scroll"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Sticky Scroll"),
            },
            run: (c, accessor) => {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const newValue = !configurationService.getValue("terminal.integrated.stickyScroll.enabled" /* TerminalSettingId.StickyScrollEnabled */);
                return configurationService.updateValue("terminal.integrated.stickyScroll.enabled" /* TerminalSettingId.StickyScrollEnabled */, newValue);
            },
            menu: [
                { id: actions_2.MenuId.TerminalStickyScrollContext }
            ]
        });
        // Some commands depend on platform features
        if (canIUse_1.BrowserFeatures.clipboard.writeText) {
            registerActiveXtermAction({
                id: "workbench.action.terminal.copySelection" /* TerminalCommandId.CopySelection */,
                title: (0, nls_1.localize2)('workbench.action.terminal.copySelection', 'Copy Selection'),
                // TODO: Why is copy still showing up when text isn't selected?
                precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.textSelectedInFocused, contextkey_1.ContextKeyExpr.and(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.textSelected)),
                keybinding: [{
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 33 /* KeyCode.KeyC */,
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */ },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.textSelected, terminalContextKey_1.TerminalContextKeys.focus), terminalContextKey_1.TerminalContextKeys.textSelectedInFocused)
                    }],
                run: (activeInstance) => activeInstance.copySelection()
            });
            registerActiveXtermAction({
                id: "workbench.action.terminal.copyAndClearSelection" /* TerminalCommandId.CopyAndClearSelection */,
                title: (0, nls_1.localize2)('workbench.action.terminal.copyAndClearSelection', 'Copy and Clear Selection'),
                precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.textSelectedInFocused, contextkey_1.ContextKeyExpr.and(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.textSelected)),
                keybinding: [{
                        win: { primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */ },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.textSelected, terminalContextKey_1.TerminalContextKeys.focus), terminalContextKey_1.TerminalContextKeys.textSelectedInFocused)
                    }],
                run: async (xterm) => {
                    await xterm.copySelection();
                    xterm.clearSelection();
                }
            });
            registerActiveXtermAction({
                id: "workbench.action.terminal.copySelectionAsHtml" /* TerminalCommandId.CopySelectionAsHtml */,
                title: (0, nls_1.localize2)('workbench.action.terminal.copySelectionAsHtml', 'Copy Selection as HTML'),
                f1: true,
                category,
                precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.textSelectedInFocused, contextkey_1.ContextKeyExpr.and(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.textSelected)),
                run: (xterm) => xterm.copySelection(true)
            });
        }
        if (canIUse_1.BrowserFeatures.clipboard.readText) {
            registerActiveInstanceAction({
                id: "workbench.action.terminal.paste" /* TerminalCommandId.Paste */,
                title: (0, nls_1.localize2)('workbench.action.terminal.paste', 'Paste into Active Terminal'),
                precondition: sharedWhenClause.terminalAvailable,
                keybinding: [{
                        primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */,
                        win: { primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 52 /* KeyCode.KeyV */] },
                        linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 52 /* KeyCode.KeyV */ },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: terminalContextKey_1.TerminalContextKeys.focus
                    }],
                run: (activeInstance) => activeInstance.paste()
            });
        }
        if (canIUse_1.BrowserFeatures.clipboard.readText && platform_1.isLinux) {
            registerActiveInstanceAction({
                id: "workbench.action.terminal.pasteSelection" /* TerminalCommandId.PasteSelection */,
                title: (0, nls_1.localize2)('workbench.action.terminal.pasteSelection', 'Paste Selection into Active Terminal'),
                precondition: sharedWhenClause.terminalAvailable,
                keybinding: [{
                        linux: { primary: 1024 /* KeyMod.Shift */ | 19 /* KeyCode.Insert */ },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: terminalContextKey_1.TerminalContextKeys.focus
                    }],
                run: (activeInstance) => activeInstance.pasteSelection()
            });
        }
        registerTerminalAction({
            id: "workbench.action.terminal.switchTerminal" /* TerminalCommandId.SwitchTerminal */,
            title: (0, nls_1.localize2)('workbench.action.terminal.switchTerminal', 'Switch Terminal'),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c, accessor, args) => {
                const item = toOptionalString(args);
                if (!item) {
                    return;
                }
                if (item === exports.switchTerminalActionViewItemSeparator) {
                    c.service.refreshActiveGroup();
                    return;
                }
                if (item === exports.switchTerminalShowTabsTitle) {
                    accessor.get(configuration_1.IConfigurationService).updateValue("terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */, true);
                    return;
                }
                const terminalIndexRe = /^([0-9]+): /;
                const indexMatches = terminalIndexRe.exec(item);
                if (indexMatches) {
                    c.groupService.setActiveGroupByIndex(Number(indexMatches[1]) - 1);
                    return c.groupService.showPanel(true);
                }
                const quickSelectProfiles = c.profileService.availableProfiles;
                // Remove 'New ' from the selected item to get the profile name
                const profileSelection = item.substring(4);
                if (quickSelectProfiles) {
                    const profile = quickSelectProfiles.find(profile => profile.profileName === profileSelection);
                    if (profile) {
                        const instance = await c.service.createTerminal({
                            config: profile
                        });
                        c.service.setActiveInstance(instance);
                    }
                    else {
                        console.warn(`No profile with name "${profileSelection}"`);
                    }
                }
                else {
                    console.warn(`Unmatched terminal item: "${item}"`);
                }
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.startVoice" /* TerminalCommandId.StartVoice */,
            title: (0, nls_1.localize2)('workbench.action.terminal.startDictation', "Start Dictation in Terminal"),
            precondition: contextkey_1.ContextKeyExpr.and(speechService_1.HasSpeechProvider, sharedWhenClause.terminalAvailable),
            f1: true,
            run: (activeInstance, c, accessor) => {
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                terminalVoice_1.TerminalVoiceSession.getInstance(instantiationService).start();
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.stopVoice" /* TerminalCommandId.StopVoice */,
            title: (0, nls_1.localize2)('workbench.action.terminal.stopDictation', "Stop Dictation in Terminal"),
            precondition: contextkey_1.ContextKeyExpr.and(speechService_1.HasSpeechProvider, sharedWhenClause.terminalAvailable),
            f1: true,
            run: (activeInstance, c, accessor) => {
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                terminalVoice_1.TerminalVoiceSession.getInstance(instantiationService).stop(true);
            }
        });
    }
    function getSelectedInstances2(accessor, args) {
        const terminalService = accessor.get(terminal_2.ITerminalService);
        const result = [];
        const context = parseActionArgs(args);
        if (context && context.length > 0) {
            for (const instanceContext of context) {
                const instance = terminalService.getInstanceFromId(instanceContext.instanceId);
                if (instance) {
                    result.push(instance);
                }
            }
            if (result.length > 0) {
                return result;
            }
        }
        return undefined;
    }
    function getSelectedInstances(accessor, args, args2) {
        const listService = accessor.get(listService_1.IListService);
        const terminalService = accessor.get(terminal_2.ITerminalService);
        const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
        const result = [];
        const list = listService.lastFocusedList;
        // Get selected tab list instance(s)
        const selections = list?.getSelection();
        // Get inline tab instance if there are not tab list selections #196578
        if (terminalGroupService.lastAccessedMenu === 'inline-tab' && !selections?.length) {
            const instance = terminalGroupService.activeInstance;
            return instance ? [terminalGroupService.activeInstance] : undefined;
        }
        if (!list || !selections) {
            return undefined;
        }
        const focused = list.getFocus();
        if (focused.length === 1 && !selections.includes(focused[0])) {
            // focused length is always a max of 1
            // if the focused one is not in the selected list, return that item
            result.push(terminalService.getInstanceFromIndex(focused[0]));
            return result;
        }
        // multi-select
        for (const selection of selections) {
            result.push(terminalService.getInstanceFromIndex(selection));
        }
        return result.filter(r => !!r);
    }
    function validateTerminalName(name) {
        if (!name || name.trim().length === 0) {
            return {
                content: (0, nls_1.localize)('emptyTerminalNameInfo', "Providing no name will reset it to the default value"),
                severity: notification_1.Severity.Info
            };
        }
        return null;
    }
    function convertOptionsOrProfileToOptions(optionsOrProfile) {
        if ((0, types_1.isObject)(optionsOrProfile) && 'profileName' in optionsOrProfile) {
            return { config: optionsOrProfile, location: optionsOrProfile.location };
        }
        return optionsOrProfile;
    }
    let newWithProfileAction;
    function refreshTerminalActions(detectedProfiles) {
        const profileEnum = (0, terminalProfiles_1.createProfileSchemaEnums)(detectedProfiles);
        newWithProfileAction?.dispose();
        // TODO: Use new register function
        newWithProfileAction = (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */,
                    title: (0, nls_1.localize2)('workbench.action.terminal.newWithProfile', 'Create New Terminal (With Profile)'),
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile),
                    metadata: {
                        description: "workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */,
                        args: [{
                                name: 'args',
                                schema: {
                                    type: 'object',
                                    required: ['profileName'],
                                    properties: {
                                        profileName: {
                                            description: (0, nls_1.localize)('workbench.action.terminal.newWithProfile.profileName', "The name of the profile to create"),
                                            type: 'string',
                                            enum: profileEnum.values,
                                            markdownEnumDescriptions: profileEnum.markdownDescriptions
                                        },
                                        location: {
                                            description: (0, nls_1.localize)('newWithProfile.location', "Where to create the terminal"),
                                            type: 'string',
                                            enum: ['view', 'editor'],
                                            enumDescriptions: [
                                                (0, nls_1.localize)('newWithProfile.location.view', 'Create the terminal in the terminal view'),
                                                (0, nls_1.localize)('newWithProfile.location.editor', 'Create the terminal in the editor'),
                                            ]
                                        }
                                    }
                                }
                            }]
                    },
                });
            }
            async run(accessor, eventOrOptionsOrProfile, profile) {
                const c = getTerminalServices(accessor);
                const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
                const commandService = accessor.get(commands_1.ICommandService);
                let event;
                let options;
                let instance;
                let cwd;
                if ((0, types_1.isObject)(eventOrOptionsOrProfile) && eventOrOptionsOrProfile && 'profileName' in eventOrOptionsOrProfile) {
                    const config = c.profileService.availableProfiles.find(profile => profile.profileName === eventOrOptionsOrProfile.profileName);
                    if (!config) {
                        throw new Error(`Could not find terminal profile "${eventOrOptionsOrProfile.profileName}"`);
                    }
                    options = { config };
                    if ('location' in eventOrOptionsOrProfile) {
                        switch (eventOrOptionsOrProfile.location) {
                            case 'editor':
                                options.location = terminal_1.TerminalLocation.Editor;
                                break;
                            case 'view':
                                options.location = terminal_1.TerminalLocation.Panel;
                                break;
                        }
                    }
                }
                else if ((0, dom_1.isMouseEvent)(eventOrOptionsOrProfile) || (0, dom_1.isPointerEvent)(eventOrOptionsOrProfile) || (0, dom_1.isKeyboardEvent)(eventOrOptionsOrProfile)) {
                    event = eventOrOptionsOrProfile;
                    options = profile ? { config: profile } : undefined;
                }
                else {
                    options = convertOptionsOrProfileToOptions(eventOrOptionsOrProfile);
                }
                // split terminal
                if (event && (event.altKey || event.ctrlKey)) {
                    const parentTerminal = c.service.activeInstance;
                    if (parentTerminal) {
                        await c.service.createTerminal({ location: { parentTerminal }, config: options?.config });
                        return;
                    }
                }
                const folders = workspaceContextService.getWorkspace().folders;
                if (folders.length > 1) {
                    // multi-root workspace, create root picker
                    const options = {
                        placeHolder: (0, nls_1.localize)('workbench.action.terminal.newWorkspacePlaceholder', "Select current working directory for new terminal")
                    };
                    const workspace = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID, [options]);
                    if (!workspace) {
                        // Don't create the instance if the workspace picker was canceled
                        return;
                    }
                    cwd = workspace.uri;
                }
                if (options) {
                    options.cwd = cwd;
                    instance = await c.service.createTerminal(options);
                }
                else {
                    instance = await c.service.showProfileQuickPick('createInstance', cwd);
                }
                if (instance) {
                    c.service.setActiveInstance(instance);
                    await focusActiveTerminal(instance, c);
                }
            }
        });
    }
    function getResourceOrActiveInstance(c, resource) {
        return c.service.getInstanceFromResource(toOptionalUri(resource)) || c.service.activeInstance;
    }
    async function pickTerminalCwd(accessor, cancel) {
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        const labelService = accessor.get(label_1.ILabelService);
        const contextService = accessor.get(workspace_1.IWorkspaceContextService);
        const modelService = accessor.get(model_1.IModelService);
        const languageService = accessor.get(language_1.ILanguageService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
        const folders = contextService.getWorkspace().folders;
        if (!folders.length) {
            return;
        }
        const folderCwdPairs = await Promise.all(folders.map(x => resolveWorkspaceFolderCwd(x, configurationService, configurationResolverService)));
        const shrinkedPairs = shrinkWorkspaceFolderCwdPairs(folderCwdPairs);
        if (shrinkedPairs.length === 1) {
            return shrinkedPairs[0];
        }
        const folderPicks = shrinkedPairs.map(pair => {
            const label = pair.folder.name;
            const description = pair.isOverridden
                ? (0, nls_1.localize)('workbench.action.terminal.overriddenCwdDescription', "(Overriden) {0}", labelService.getUriLabel(pair.cwd, { relative: !pair.isAbsolute }))
                : labelService.getUriLabel((0, resources_1.dirname)(pair.cwd), { relative: true });
            return {
                label,
                description: description !== label ? description : undefined,
                pair: pair,
                iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, pair.cwd, files_1.FileKind.ROOT_FOLDER)
            };
        });
        const options = {
            placeHolder: (0, nls_1.localize)('workbench.action.terminal.newWorkspacePlaceholder', "Select current working directory for new terminal"),
            matchOnDescription: true,
            canPickMany: false,
        };
        const token = cancel || cancellation_1.CancellationToken.None;
        const pick = await quickInputService.pick(folderPicks, options, token);
        return pick?.pair;
    }
    async function resolveWorkspaceFolderCwd(folder, configurationService, configurationResolverService) {
        const cwdConfig = configurationService.getValue("terminal.integrated.cwd" /* TerminalSettingId.Cwd */, { resource: folder.uri });
        if (!(0, types_1.isString)(cwdConfig) || cwdConfig.length === 0) {
            return { folder, cwd: folder.uri, isAbsolute: false, isOverridden: false };
        }
        const resolvedCwdConfig = await configurationResolverService.resolveAsync(folder, cwdConfig);
        return (0, path_1.isAbsolute)(resolvedCwdConfig) || resolvedCwdConfig.startsWith(variableResolver_1.AbstractVariableResolverService.VARIABLE_LHS)
            ? { folder, isAbsolute: true, isOverridden: true, cwd: uri_1.URI.from({ scheme: folder.uri.scheme, path: resolvedCwdConfig }) }
            : { folder, isAbsolute: false, isOverridden: true, cwd: uri_1.URI.joinPath(folder.uri, resolvedCwdConfig) };
    }
    /**
     * Drops repeated CWDs, if any, by keeping the one which best matches the workspace folder. It also preserves the original order.
     */
    function shrinkWorkspaceFolderCwdPairs(pairs) {
        const map = new Map();
        for (const pair of pairs) {
            const key = pair.cwd.toString();
            const value = map.get(key);
            if (!value || key === pair.folder.uri.toString()) {
                map.set(key, pair);
            }
        }
        const selectedPairs = new Set(map.values());
        const selectedPairsInOrder = pairs.filter(x => selectedPairs.has(x));
        return selectedPairsInOrder;
    }
    async function focusActiveTerminal(instance, c) {
        if (instance.target === terminal_1.TerminalLocation.Editor) {
            await c.editorService.revealActiveEditor();
            await instance.focusWhenReady(true);
        }
        else {
            await c.groupService.showPanel(true);
        }
    }
    async function renameWithQuickPick(c, accessor, resource) {
        let instance = resource;
        // Check if the 'instance' does not exist or if 'instance.rename' is not defined
        if (!instance || !instance?.rename) {
            // If not, obtain the resource instance using 'getResourceOrActiveInstance'
            instance = getResourceOrActiveInstance(c, resource);
        }
        if (instance) {
            const title = await accessor.get(quickInput_1.IQuickInputService).input({
                value: instance.title,
                prompt: (0, nls_1.localize)('workbench.action.terminal.rename.prompt', "Enter terminal name"),
            });
            instance.rename(title);
        }
    }
    function toOptionalUri(obj) {
        return uri_1.URI.isUri(obj) ? obj : undefined;
    }
    function toOptionalString(obj) {
        return (0, types_1.isString)(obj) ? obj : undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyRmhHLHdDQXlCQztJQXdDRCx3REFvQkM7SUFpQkQsNEVBMkNDO0lBTUQsb0VBYUM7SUFRRCw4REFrQkM7SUFzQkQsMERBeTFDQztJQTBERCxvREFTQztJQVdELHdEQThHQztJQW1FRCxzRUFZQztJQWoxRFksUUFBQSxxQ0FBcUMsR0FBRyx3REFBd0QsQ0FBQztJQUNqRyxRQUFBLDJCQUEyQixHQUFHLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRXJGLE1BQU0sUUFBUSxHQUFHLGlDQUFlLENBQUMsY0FBYyxDQUFDO0lBRWhELDJGQUEyRjtJQUMzRiwwREFBMEQ7SUFDMUQsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEdBQUcsRUFBRTtRQUM5QixNQUFNLGlCQUFpQixHQUFHLDJCQUFjLENBQUMsRUFBRSxDQUFDLHdDQUFtQixDQUFDLGdCQUFnQixFQUFFLHdDQUFtQixDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDOUgsT0FBTztZQUNOLGlCQUFpQjtZQUNqQiw0QkFBNEIsRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSx3Q0FBbUIsQ0FBQyxNQUFNLENBQUM7WUFDL0Ysa0NBQWtDLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsd0NBQW1CLENBQUMsb0JBQW9CLENBQUM7WUFDbkgsdUNBQXVDLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsd0NBQW1CLENBQUMscUJBQXFCLENBQUM7WUFD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