/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/platform", "vs/workbench/electron-sandbox/actions/developerActions", "vs/workbench/electron-sandbox/actions/windowActions", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkeys", "vs/platform/native/common/native", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/electron-sandbox/actions/installActions", "vs/workbench/common/contextkeys", "vs/platform/telemetry/common/telemetry", "vs/platform/configuration/common/configuration", "vs/workbench/electron-sandbox/window", "vs/base/browser/dom", "vs/workbench/common/configuration", "vs/platform/window/electron-sandbox/window"], function (require, exports, platform_1, nls_1, actions_1, configurationRegistry_1, platform_2, developerActions_1, windowActions_1, contextkey_1, keybindingsRegistry_1, commands_1, contextkeys_1, native_1, jsonContributionRegistry_1, installActions_1, contextkeys_2, telemetry_1, configuration_1, window_1, dom_1, configuration_2, window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Actions
    (function registerActions() {
        // Actions: Zoom
        (0, actions_1.registerAction2)(windowActions_1.ZoomInAction);
        (0, actions_1.registerAction2)(windowActions_1.ZoomOutAction);
        (0, actions_1.registerAction2)(windowActions_1.ZoomResetAction);
        // Actions: Window
        (0, actions_1.registerAction2)(windowActions_1.SwitchWindowAction);
        (0, actions_1.registerAction2)(windowActions_1.QuickSwitchWindowAction);
        (0, actions_1.registerAction2)(windowActions_1.CloseWindowAction);
        if (platform_2.isMacintosh) {
            // macOS: behave like other native apps that have documents
            // but can run without a document opened and allow to close
            // the window when the last document is closed
            // (https://github.com/microsoft/vscode/issues/126042)
            keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                id: windowActions_1.CloseWindowAction.ID,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(contextkeys_2.EditorsVisibleContext.toNegated(), contextkeys_2.SingleEditorGroupsContext),
                primary: 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */
            });
        }
        // Actions: Install Shell Script (macOS only)
        if (platform_2.isMacintosh) {
            (0, actions_1.registerAction2)(installActions_1.InstallShellScriptAction);
            (0, actions_1.registerAction2)(installActions_1.UninstallShellScriptAction);
        }
        // Quit
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'workbench.action.quit',
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            async handler(accessor) {
                const nativeHostService = accessor.get(native_1.INativeHostService);
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const confirmBeforeClose = configurationService.getValue('window.confirmBeforeClose');
                if (confirmBeforeClose === 'always' || (confirmBeforeClose === 'keyboardOnly' && dom_1.ModifierKeyEmitter.getInstance().isModifierPressed)) {
                    const confirmed = await window_1.NativeWindow.confirmOnShutdown(accessor, 2 /* ShutdownReason.QUIT */);
                    if (!confirmed) {
                        return; // quit prevented by user
                    }
                }
                nativeHostService.quit();
            },
            when: undefined,
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 47 /* KeyCode.KeyQ */ },
            linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 47 /* KeyCode.KeyQ */ }
        });
        // Actions: macOS Native Tabs
        if (platform_2.isMacintosh) {
            for (const command of [
                { handler: windowActions_1.NewWindowTabHandler, id: 'workbench.action.newWindowTab', title: (0, nls_1.localize2)('newTab', 'New Window Tab') },
                { handler: windowActions_1.ShowPreviousWindowTabHandler, id: 'workbench.action.showPreviousWindowTab', title: (0, nls_1.localize2)('showPreviousTab', 'Show Previous Window Tab') },
                { handler: windowActions_1.ShowNextWindowTabHandler, id: 'workbench.action.showNextWindowTab', title: (0, nls_1.localize2)('showNextWindowTab', 'Show Next Window Tab') },
                { handler: windowActions_1.MoveWindowTabToNewWindowHandler, id: 'workbench.action.moveWindowTabToNewWindow', title: (0, nls_1.localize2)('moveWindowTabToNewWindow', 'Move Window Tab to New Window') },
                { handler: windowActions_1.MergeWindowTabsHandlerHandler, id: 'workbench.action.mergeAllWindowTabs', title: (0, nls_1.localize2)('mergeAllWindowTabs', 'Merge All Windows') },
                { handler: windowActions_1.ToggleWindowTabsBarHandler, id: 'workbench.action.toggleWindowTabsBar', title: (0, nls_1.localize2)('toggleWindowTabsBar', 'Toggle Window Tabs Bar') }
            ]) {
                commands_1.CommandsRegistry.registerCommand(command.id, command.handler);
                actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
                    command,
                    when: contextkey_1.ContextKeyExpr.equals('config.window.nativeTabs', true)
                });
            }
        }
        // Actions: Developer
        (0, actions_1.registerAction2)(developerActions_1.ReloadWindowWithExtensionsDisabledAction);
        (0, actions_1.registerAction2)(developerActions_1.ConfigureRuntimeArgumentsAction);
        (0, actions_1.registerAction2)(developerActions_1.ToggleDevToolsAction);
        (0, actions_1.registerAction2)(developerActions_1.OpenUserDataFolderAction);
    })();
    // Menu
    (function registerMenu() {
        // Quit
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
            group: 'z_Exit',
            command: {
                id: 'workbench.action.quit',
                title: (0, nls_1.localize)({ key: 'miExit', comment: ['&& denotes a mnemonic'] }, "E&&xit")
            },
            order: 1,
            when: contextkeys_1.IsMacContext.toNegated()
        });
    })();
    // Configuration
    (function registerConfiguration() {
        const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        // Application
        registry.registerConfiguration({
            ...configuration_2.applicationConfigurationNodeBase,
            'properties': {
                'application.shellEnvironmentResolutionTimeout': {
                    'type': 'number',
                    'default': 10,
                    'minimum': 1,
                    'maximum': 120,
                    'included': !platform_2.isWindows,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('application.shellEnvironmentResolutionTimeout', "Controls the timeout in seconds before giving up resolving the shell environment when the application is not already launched from a terminal. See our [documentation](https://go.microsoft.com/fwlink/?linkid=2149667) for more information.")
                }
            }
        });
        // Window
        registry.registerConfiguration({
            'id': 'window',
            'order': 8,
            'title': (0, nls_1.localize)('windowConfigurationTitle', "Window"),
            'type': 'object',
            'properties': {
                'window.confirmSaveUntitledWorkspace': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('confirmSaveUntitledWorkspace', "Controls whether a confirmation dialog shows asking to save or discard an opened untitled workspace in the window when switching to another workspace. Disabling the confirmation dialog will always discard the untitled workspace."),
                },
                'window.openWithoutArgumentsInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.openWithoutArgumentsInNewWindow.on', "Open a new empty window."),
                        (0, nls_1.localize)('window.openWithoutArgumentsInNewWindow.off', "Focus the last active running instance.")
                    ],
                    'default': platform_2.isMacintosh ? 'off' : 'on',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('openWithoutArgumentsInNewWindow', "Controls whether a new empty window should open when starting a second instance without arguments or if the last running instance should get focus.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.restoreWindows': {
                    'type': 'string',
                    'enum': ['preserve', 'all', 'folders', 'one', 'none'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.reopenFolders.preserve', "Always reopen all windows. If a folder or workspace is opened (e.g. from the command line) it opens as a new window unless it was opened before. If files are opened they will open in one of the restored windows."),
                        (0, nls_1.localize)('window.reopenFolders.all', "Reopen all windows unless a folder, workspace or file is opened (e.g. from the command line)."),
                        (0, nls_1.localize)('window.reopenFolders.folders', "Reopen all windows that had folders or workspaces opened unless a folder, workspace or file is opened (e.g. from the command line)."),
                        (0, nls_1.localize)('window.reopenFolders.one', "Reopen the last active window unless a folder, workspace or file is opened (e.g. from the command line)."),
                        (0, nls_1.localize)('window.reopenFolders.none', "Never reopen a window. Unless a folder or workspace is opened (e.g. from the command line), an empty window will appear.")
                    ],
                    'default': 'all',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('restoreWindows', "Controls how windows are being reopened after starting for the first time. This setting has no effect when the application is already running.")
                },
                'window.restoreFullscreen': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('restoreFullscreen', "Controls whether a window should restore to full screen mode if it was exited in full screen mode.")
                },
                'window.zoomLevel': {
                    'type': 'number',
                    'default': 0,
                    'minimum': window_2.MIN_ZOOM_LEVEL,
                    'maximum': window_2.MAX_ZOOM_LEVEL,
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0} will be a setting name rendered as a link'], key: 'zoomLevel' }, "Adjust the default zoom level for all windows. Each increment above `0` (e.g. `1`) or below (e.g. `-1`) represents zooming `20%` larger or smaller. You can also enter decimals to adjust the zoom level with a finer granularity. See {0} for configuring if the 'Zoom In' and 'Zoom Out' commands apply the zoom level to all windows or only the active window.", '`#window.zoomPerWindow#`'),
                    ignoreSync: true,
                    tags: ['accessibility']
                },
                'window.zoomPerWindow': {
                    'type': 'boolean',
                    'default': true,
                    'markdownDescription': (0, nls_1.localize)({ comment: ['{0} will be a setting name rendered as a link'], key: 'zoomPerWindow' }, "Controls if the 'Zoom In' and 'Zoom Out' commands apply the zoom level to all windows or only the active window. See {0} for configuring a default zoom level for all windows.", '`#window.zoomLevel#`'),
                    tags: ['accessibility']
                },
                'window.newWindowDimensions': {
                    'type': 'string',
                    'enum': ['default', 'inherit', 'offset', 'maximized', 'fullscreen'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.newWindowDimensions.default', "Open new windows in the center of the screen."),
                        (0, nls_1.localize)('window.newWindowDimensions.inherit', "Open new windows with same dimension as last active one."),
                        (0, nls_1.localize)('window.newWindowDimensions.offset', "Open new windows with same dimension as last active one with an offset position."),
                        (0, nls_1.localize)('window.newWindowDimensions.maximized', "Open new windows maximized."),
                        (0, nls_1.localize)('window.newWindowDimensions.fullscreen', "Open new windows in full screen mode.")
                    ],
                    'default': 'default',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('newWindowDimensions', "Controls the dimensions of opening a new window when at least one window is already opened. Note that this setting does not have an impact on the first window that is opened. The first window will always restore the size and location as you left it before closing.")
                },
                'window.closeWhenEmpty': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('closeWhenEmpty', "Controls whether closing the last editor should also close the window. This setting only applies for windows that do not show folders.")
                },
                'window.doubleClickIconToClose': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('window.doubleClickIconToClose', "If enabled, this setting will close the window when the application icon in the title bar is double-clicked. The window will not be able to be dragged by the icon. This setting is effective only if `#window.titleBarStyle#` is set to `custom`.")
                },
                'window.titleBarStyle': {
                    'type': 'string',
                    'enum': ['native', 'custom'],
                    'default': platform_2.isLinux ? 'native' : 'custom',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('titleBarStyle', "Adjust the appearance of the window title bar to be native by the OS or custom. On Linux and Windows, this setting also affects the application and context menu appearances. Changes require a full restart to apply."),
                },
                'window.customTitleBarVisibility': {
                    'type': 'string',
                    'enum': ['auto', 'windowed', 'never'],
                    'markdownEnumDescriptions': [
                        (0, nls_1.localize)(`window.customTitleBarVisibility.auto`, "Automatically changes custom title bar visibility."),
                        (0, nls_1.localize)(`window.customTitleBarVisibility.windowed`, "Hide custom titlebar in full screen. When not in full screen, automatically change custom title bar visibility."),
                        (0, nls_1.localize)(`window.customTitleBarVisibility.never`, "Hide custom titlebar when `#window.titleBarStyle#` is set to `native`."),
                    ],
                    'default': platform_2.isLinux ? 'never' : 'auto',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('window.customTitleBarVisibility', "Adjust when the custom title bar should be shown. The custom title bar can be hidden when in full screen mode with `windowed`. The custom title bar can only be hidden in none full screen mode with `never` when `#window.titleBarStyle#` is set to `native`."),
                },
                'window.dialogStyle': {
                    'type': 'string',
                    'enum': ['native', 'custom'],
                    'default': 'native',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('dialogStyle', "Adjust the appearance of dialog windows.")
                },
                'window.nativeTabs': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('window.nativeTabs', "Enables macOS Sierra window tabs. Note that changes require a full restart to apply and that native tabs will disable a custom title bar style if configured."),
                    'included': platform_2.isMacintosh,
                },
                'window.nativeFullScreen': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('window.nativeFullScreen', "Controls if native full-screen should be used on macOS. Disable this option to prevent macOS from creating a new space when going full-screen."),
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'included': platform_2.isMacintosh
                },
                'window.clickThroughInactive': {
                    'type': 'boolean',
                    'default': true,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('window.clickThroughInactive', "If enabled, clicking on an inactive window will both activate the window and trigger the element under the mouse if it is clickable. If disabled, clicking anywhere on an inactive window will activate it only and a second click is required on the element."),
                    'included': platform_2.isMacintosh
                }
            }
        });
        // Telemetry
        registry.registerConfiguration({
            'id': 'telemetry',
            'order': 110,
            title: (0, nls_1.localize)('telemetryConfigurationTitle', "Telemetry"),
            'type': 'object',
            'properties': {
                'telemetry.enableCrashReporter': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('telemetry.enableCrashReporting', "Enable crash reports to be collected. This helps us improve stability. \nThis option requires restart to take effect."),
                    'default': true,
                    'tags': ['usesOnlineServices', 'telemetry'],
                    'markdownDeprecationMessage': (0, nls_1.localize)('enableCrashReporterDeprecated', "If this setting is false, no telemetry will be sent regardless of the new setting's value. Deprecated due to being combined into the {0} setting.", `\`#${telemetry_1.TELEMETRY_SETTING_ID}#\``),
                }
            }
        });
        // Keybinding
        registry.registerConfiguration({
            'id': 'keyboard',
            'order': 15,
            'type': 'object',
            'title': (0, nls_1.localize)('keyboardConfigurationTitle', "Keyboard"),
            'properties': {
                'keyboard.touchbar.enabled': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('touchbar.enabled', "Enables the macOS touchbar buttons on the keyboard if available."),
                    'included': platform_2.isMacintosh
                },
                'keyboard.touchbar.ignored': {
                    'type': 'array',
                    'items': {
                        'type': 'string'
                    },
                    'default': [],
                    'markdownDescription': (0, nls_1.localize)('touchbar.ignored', 'A set of identifiers for entries in the touchbar that should not show up (for example `workbench.action.navigateBack`).'),
                    'included': platform_2.isMacintosh
                }
            }
        });
        // Security
        registry.registerConfiguration({
            ...configuration_2.securityConfigurationNodeBase,
            'properties': {
                'security.promptForLocalFileProtocolHandling': {
                    'type': 'boolean',
                    'default': true,
                    'markdownDescription': (0, nls_1.localize)('security.promptForLocalFileProtocolHandling', 'If enabled, a dialog will ask for confirmation whenever a local file or workspace is about to open through a protocol handler.'),
                    'scope': 2 /* ConfigurationScope.MACHINE */
                },
                'security.promptForRemoteFileProtocolHandling': {
                    'type': 'boolean',
                    'default': true,
                    'markdownDescription': (0, nls_1.localize)('security.promptForRemoteFileProtocolHandling', 'If enabled, a dialog will ask for confirmation whenever a remote file or workspace is about to open through a protocol handler.'),
                    'scope': 2 /* ConfigurationScope.MACHINE */
                }
            }
        });
    })();
    // JSON Schemas
    (function registerJSONSchemas() {
        const argvDefinitionFileSchemaId = 'vscode://schemas/argv';
        const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
        const schema = {
            id: argvDefinitionFileSchemaId,
            allowComments: true,
            allowTrailingCommas: true,
            description: 'VSCode static command line definition file',
            type: 'object',
            additionalProperties: false,
            properties: {
                locale: {
                    type: 'string',
                    description: (0, nls_1.localize)('argv.locale', 'The display Language to use. Picking a different language requires the associated language pack to be installed.')
                },
                'disable-hardware-acceleration': {
                    type: 'boolean',
                    description: (0, nls_1.localize)('argv.disableHardwareAcceleration', 'Disables hardware acceleration. ONLY change this option if you encounter graphic issues.')
                },
                'force-color-profile': {
                    type: 'string',
                    markdownDescription: (0, nls_1.localize)('argv.forceColorProfile', 'Allows to override the color profile to use. If you experience colors appear badly, try to set this to `srgb` and restart.')
                },
                'enable-crash-reporter': {
                    type: 'boolean',
                    markdownDescription: (0, nls_1.localize)('argv.enableCrashReporter', 'Allows to disable crash reporting, should restart the app if the value is changed.')
                },
                'crash-reporter-id': {
                    type: 'string',
                    markdownDescription: (0, nls_1.localize)('argv.crashReporterId', 'Unique id used for correlating crash reports sent from this app instance.')
                },
                'enable-proposed-api': {
                    type: 'array',
                    description: (0, nls_1.localize)('argv.enebleProposedApi', "Enable proposed APIs for a list of extension ids (such as \`vscode.git\`). Proposed APIs are unstable and subject to breaking without warning at any time. This should only be set for extension development and testing purposes."),
                    items: {
                        type: 'string'
                    }
                },
                'log-level': {
                    type: ['string', 'array'],
                    description: (0, nls_1.localize)('argv.logLevel', "Log level to use. Default is 'info'. Allowed values are 'error', 'warn', 'info', 'debug', 'trace', 'off'.")
                },
                'disable-chromium-sandbox': {
                    type: 'boolean',
                    description: (0, nls_1.localize)('argv.disableChromiumSandbox', "Disables the Chromium sandbox. This is useful when running VS Code as elevated on Linux and running under Applocker on Windows.")
                },
                'use-inmemory-secretstorage': {
                    type: 'boolean',
                    description: (0, nls_1.localize)('argv.useInMemorySecretStorage', "Ensures that an in-memory store will be used for secret storage instead of using the OS's credential store. This is often used when running VS Code extension tests or when you're experiencing difficulties with the credential store.")
                }
            }
        };
        if (platform_2.isLinux) {
            schema.properties['force-renderer-accessibility'] = {
                type: 'boolean',
                description: (0, nls_1.localize)('argv.force-renderer-accessibility', 'Forces the renderer to be accessible. ONLY change this if you are using a screen reader on Linux. On other platforms the renderer will automatically be accessible. This flag is automatically set if you have editor.accessibilitySupport: on.'),
            };
            schema.properties['password-store'] = {
                type: 'string',
                description: (0, nls_1.localize)('argv.passwordStore', "Configures the backend used to store secrets on Linux. This argument is ignored on Windows & macOS.")
            };
        }
        jsonRegistry.registerSchema(argvDefinitionFileSchemaId, schema);
    })();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVza3RvcC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9lbGVjdHJvbi1zYW5kYm94L2Rlc2t0b3AuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBNEJoRyxVQUFVO0lBQ1YsQ0FBQyxTQUFTLGVBQWU7UUFFeEIsZ0JBQWdCO1FBQ2hCLElBQUEseUJBQWUsRUFBQyw0QkFBWSxDQUFDLENBQUM7UUFDOUIsSUFBQSx5QkFBZSxFQUFDLDZCQUFhLENBQUMsQ0FBQztRQUMvQixJQUFBLHlCQUFlLEVBQUMsK0JBQWUsQ0FBQyxDQUFDO1FBRWpDLGtCQUFrQjtRQUNsQixJQUFBLHlCQUFlLEVBQUMsa0NBQWtCLENBQUMsQ0FBQztRQUNwQyxJQUFBLHlCQUFlLEVBQUMsdUNBQXVCLENBQUMsQ0FBQztRQUN6QyxJQUFBLHlCQUFlLEVBQUMsaUNBQWlCLENBQUMsQ0FBQztRQUVuQyxJQUFJLHNCQUFXLEVBQUUsQ0FBQztZQUNqQiwyREFBMkQ7WUFDM0QsMkRBQTJEO1lBQzNELDhDQUE4QztZQUM5QyxzREFBc0Q7WUFDdEQseUNBQW1CLENBQUMsc0JBQXNCLENBQUM7Z0JBQzFDLEVBQUUsRUFBRSxpQ0FBaUIsQ0FBQyxFQUFFO2dCQUN4QixNQUFNLDZDQUFtQztnQkFDekMsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLG1DQUFxQixDQUFDLFNBQVMsRUFBRSxFQUFFLHVDQUF5QixDQUFDO2dCQUN0RixPQUFPLEVBQUUsaURBQTZCO2FBQ3RDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCw2Q0FBNkM7UUFDN0MsSUFBSSxzQkFBVyxFQUFFLENBQUM7WUFDakIsSUFBQSx5QkFBZSxFQUFDLHlDQUF3QixDQUFDLENBQUM7WUFDMUMsSUFBQSx5QkFBZSxF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