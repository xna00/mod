/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/activity", "vs/workbench/common/contextkeys"], function (require, exports, nls_1, configuration_1, storage_1, actions_1, contextkey_1, activity_1, contextkeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GLOBAL_ACTIVITY_TITLE_ACTION = exports.ACCOUNTS_ACTIVITY_TILE_ACTION = void 0;
    // --- Context Menu Actions --- //
    class ToggleConfigAction extends actions_1.Action2 {
        constructor(section, title, order, mainWindowOnly) {
            const when = mainWindowOnly ? contextkeys_1.IsAuxiliaryWindowFocusedContext.toNegated() : contextkey_1.ContextKeyExpr.true();
            super({
                id: `toggle.${section}`,
                title,
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${section}`, true),
                menu: [
                    {
                        id: actions_1.MenuId.TitleBarContext,
                        when,
                        order,
                        group: '2_config'
                    },
                    {
                        id: actions_1.MenuId.TitleBarTitleContext,
                        when,
                        order,
                        group: '2_config'
                    }
                ]
            });
            this.section = section;
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            const value = configService.getValue(this.section);
            configService.updateValue(this.section, !value);
        }
    }
    (0, actions_1.registerAction2)(class ToggleCommandCenter extends ToggleConfigAction {
        constructor() {
            super("window.commandCenter" /* LayoutSettings.COMMAND_CENTER */, (0, nls_1.localize)('toggle.commandCenter', 'Command Center'), 1, false);
        }
    });
    (0, actions_1.registerAction2)(class ToggleLayoutControl extends ToggleConfigAction {
        constructor() {
            super('workbench.layoutControl.enabled', (0, nls_1.localize)('toggle.layout', 'Layout Controls'), 2, true);
        }
    });
    (0, actions_1.registerAction2)(class ToggleCustomTitleBar extends actions_1.Action2 {
        constructor() {
            super({
                id: `toggle.${"window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */}`,
                title: (0, nls_1.localize)('toggle.hideCustomTitleBar', 'Hide Custom Title Bar'),
                menu: [
                    { id: actions_1.MenuId.TitleBarContext, order: 0, when: contextkey_1.ContextKeyExpr.equals(contextkeys_1.TitleBarStyleContext.key, "native" /* TitlebarStyle.NATIVE */), group: '3_toggle' },
                    { id: actions_1.MenuId.TitleBarTitleContext, order: 0, when: contextkey_1.ContextKeyExpr.equals(contextkeys_1.TitleBarStyleContext.key, "native" /* TitlebarStyle.NATIVE */), group: '3_toggle' },
                ]
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "never" /* CustomTitleBarVisibility.NEVER */);
        }
    });
    (0, actions_1.registerAction2)(class ToggleCustomTitleBarWindowed extends actions_1.Action2 {
        constructor() {
            super({
                id: `toggle.${"window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */}.windowed`,
                title: (0, nls_1.localize)('toggle.hideCustomTitleBarInFullScreen', 'Hide Custom Title Bar In Full Screen'),
                menu: [
                    { id: actions_1.MenuId.TitleBarContext, order: 1, when: contextkeys_1.IsMainWindowFullscreenContext, group: '3_toggle' },
                    { id: actions_1.MenuId.TitleBarTitleContext, order: 1, when: contextkeys_1.IsMainWindowFullscreenContext, group: '3_toggle' },
                ]
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "windowed" /* CustomTitleBarVisibility.WINDOWED */);
        }
    });
    class ToggleCustomTitleBar extends actions_1.Action2 {
        constructor() {
            super({
                id: `toggle.toggleCustomTitleBar`,
                title: (0, nls_1.localize)('toggle.customTitleBar', 'Custom Title Bar'),
                toggled: contextkeys_1.TitleBarVisibleContext,
                menu: [
                    {
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        order: 6,
                        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(contextkeys_1.TitleBarStyleContext.key, "native" /* TitlebarStyle.NATIVE */), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.enabled', false), contextkey_1.ContextKeyExpr.equals('config.window.commandCenter', false), contextkey_1.ContextKeyExpr.notEquals('config.workbench.editor.editorActionsLocation', 'titleBar'), contextkey_1.ContextKeyExpr.notEquals('config.workbench.activityBar.location', 'top'), contextkey_1.ContextKeyExpr.notEquals('config.workbench.activityBar.location', 'bottom'))?.negate()), contextkeys_1.IsMainWindowFullscreenContext),
                        group: '2_workbench_layout'
                    },
                ],
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const titleBarVisibility = configService.getValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */);
            switch (titleBarVisibility) {
                case "never" /* CustomTitleBarVisibility.NEVER */:
                    configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "auto" /* CustomTitleBarVisibility.AUTO */);
                    break;
                case "windowed" /* CustomTitleBarVisibility.WINDOWED */: {
                    const isFullScreen = contextkeys_1.IsMainWindowFullscreenContext.evaluate(contextKeyService.getContext(null));
                    if (isFullScreen) {
                        configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "auto" /* CustomTitleBarVisibility.AUTO */);
                    }
                    else {
                        configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "never" /* CustomTitleBarVisibility.NEVER */);
                    }
                    break;
                }
                case "auto" /* CustomTitleBarVisibility.AUTO */:
                default:
                    configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "never" /* CustomTitleBarVisibility.NEVER */);
                    break;
            }
        }
    }
    (0, actions_1.registerAction2)(ToggleCustomTitleBar);
    (0, actions_1.registerAction2)(class ShowCustomTitleBar extends actions_1.Action2 {
        constructor() {
            super({
                id: `showCustomTitleBar`,
                title: (0, nls_1.localize2)('showCustomTitleBar', "Show Custom Title Bar"),
                precondition: contextkeys_1.TitleBarVisibleContext.negate(),
                f1: true
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "auto" /* CustomTitleBarVisibility.AUTO */);
        }
    });
    (0, actions_1.registerAction2)(class HideCustomTitleBar extends actions_1.Action2 {
        constructor() {
            super({
                id: `hideCustomTitleBar`,
                title: (0, nls_1.localize2)('hideCustomTitleBar', "Hide Custom Title Bar"),
                precondition: contextkeys_1.TitleBarVisibleContext,
                f1: true
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "never" /* CustomTitleBarVisibility.NEVER */);
        }
    });
    (0, actions_1.registerAction2)(class HideCustomTitleBar extends actions_1.Action2 {
        constructor() {
            super({
                id: `hideCustomTitleBarInFullScreen`,
                title: (0, nls_1.localize2)('hideCustomTitleBarInFullScreen', "Hide Custom Title Bar In Full Screen"),
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.TitleBarVisibleContext, contextkeys_1.IsMainWindowFullscreenContext),
                f1: true
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            configService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "windowed" /* CustomTitleBarVisibility.WINDOWED */);
        }
    });
    (0, actions_1.registerAction2)(class ToggleEditorActions extends actions_1.Action2 {
        static { this.settingsID = `workbench.editor.editorActionsLocation`; }
        constructor() {
            const titleBarContextCondition = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.workbench.editor.showTabs`, 'none').negate(), contextkey_1.ContextKeyExpr.equals(`config.${ToggleEditorActions.settingsID}`, 'default'))?.negate();
            super({
                id: `toggle.${ToggleEditorActions.settingsID}`,
                title: (0, nls_1.localize)('toggle.editorActions', 'Editor Actions'),
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${ToggleEditorActions.settingsID}`, 'hidden').negate(),
                menu: [
                    { id: actions_1.MenuId.TitleBarContext, order: 3, when: titleBarContextCondition, group: '2_config' },
                    { id: actions_1.MenuId.TitleBarTitleContext, order: 3, when: titleBarContextCondition, group: '2_config' }
                ]
            });
        }
        run(accessor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            const storageService = accessor.get(storage_1.IStorageService);
            const location = configService.getValue(ToggleEditorActions.settingsID);
            if (location === 'hidden') {
                const showTabs = configService.getValue("workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */);
                // If tabs are visible, then set the editor actions to be in the title bar
                if (showTabs !== 'none') {
                    configService.updateValue(ToggleEditorActions.settingsID, 'titleBar');
                }
                // If tabs are not visible, then set the editor actions to the last location the were before being hidden
                else {
                    const storedValue = storageService.get(ToggleEditorActions.settingsID, 0 /* StorageScope.PROFILE */);
                    configService.updateValue(ToggleEditorActions.settingsID, storedValue ?? 'default');
                }
                storageService.remove(ToggleEditorActions.settingsID, 0 /* StorageScope.PROFILE */);
            }
            // Store the current value (titleBar or default) in the storage service for later to restore
            else {
                configService.updateValue(ToggleEditorActions.settingsID, 'hidden');
                storageService.store(ToggleEditorActions.settingsID, location, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }
        }
    });
    // --- Toolbar actions --- //
    exports.ACCOUNTS_ACTIVITY_TILE_ACTION = {
        id: activity_1.ACCOUNTS_ACTIVITY_ID,
        label: (0, nls_1.localize)('accounts', "Accounts"),
        tooltip: (0, nls_1.localize)('accounts', "Accounts"),
        class: undefined,
        enabled: true,
        run: function () { }
    };
    exports.GLOBAL_ACTIVITY_TITLE_ACTION = {
        id: activity_1.GLOBAL_ACTIVITY_ID,
        label: (0, nls_1.localize)('manage', "Manage"),
        tooltip: (0, nls_1.localize)('manage', "Manage"),
        class: undefined,
        enabled: true,
        run: function () { }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGl0bGViYXJBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy90aXRsZWJhci90aXRsZWJhckFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLGtDQUFrQztJQUVsQyxNQUFNLGtCQUFtQixTQUFRLGlCQUFPO1FBRXZDLFlBQTZCLE9BQWUsRUFBRSxLQUFhLEVBQUUsS0FBYSxFQUFFLGNBQXVCO1lBQ2xHLE1BQU0sSUFBSSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsNkNBQStCLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLDJCQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEcsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxVQUFVLE9BQU8sRUFBRTtnQkFDdkIsS0FBSztnQkFDTCxPQUFPLEVBQUUsMkJBQWMsQ0FBQyxNQUFNLENBQUMsVUFBVSxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUM7Z0JBQ3pELElBQUksRUFBRTtvQkFDTDt3QkFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxlQUFlO3dCQUMxQixJQUFJO3dCQUNKLEtBQUs7d0JBQ0wsS0FBSyxFQUFFLFVBQVU7cUJBQ2pCO29CQUNEO3dCQUNDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLG9CQUFvQjt3QkFDL0IsSUFBSTt3QkFDSixLQUFLO3dCQUNMLEtBQUssRUFBRSxVQUFVO3FCQUNqQjtpQkFDRDthQUNELENBQUMsQ0FBQztZQXBCeUIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQXFCNUMsQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUEwQixFQUFFLEdBQUcsSUFBVztZQUM3QyxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7WUFDMUQs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