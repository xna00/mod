/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/iconRegistry", "vs/platform/action/common/actionCommonCategories", "vs/workbench/common/contextkeys", "vs/workbench/common/views", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, codicons_1, nls_1, actions_1, contextkey_1, iconRegistry_1, actionCommonCategories_1, contextkeys_1, views_1, layoutService_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleAuxiliaryBarAction = void 0;
    const auxiliaryBarRightIcon = (0, iconRegistry_1.registerIcon)('auxiliarybar-right-layout-icon', codicons_1.Codicon.layoutSidebarRight, (0, nls_1.localize)('toggleAuxiliaryIconRight', 'Icon to toggle the auxiliary bar off in its right position.'));
    const auxiliaryBarRightOffIcon = (0, iconRegistry_1.registerIcon)('auxiliarybar-right-off-layout-icon', codicons_1.Codicon.layoutSidebarRightOff, (0, nls_1.localize)('toggleAuxiliaryIconRightOn', 'Icon to toggle the auxiliary bar on in its right position.'));
    const auxiliaryBarLeftIcon = (0, iconRegistry_1.registerIcon)('auxiliarybar-left-layout-icon', codicons_1.Codicon.layoutSidebarLeft, (0, nls_1.localize)('toggleAuxiliaryIconLeft', 'Icon to toggle the auxiliary bar in its left position.'));
    const auxiliaryBarLeftOffIcon = (0, iconRegistry_1.registerIcon)('auxiliarybar-left-off-layout-icon', codicons_1.Codicon.layoutSidebarLeftOff, (0, nls_1.localize)('toggleAuxiliaryIconLeftOn', 'Icon to toggle the auxiliary bar on in its left position.'));
    class ToggleAuxiliaryBarAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.toggleAuxiliaryBar'; }
        static { this.LABEL = (0, nls_1.localize2)('toggleAuxiliaryBar', "Toggle Secondary Side Bar Visibility"); }
        constructor() {
            super({
                id: ToggleAuxiliaryBarAction.ID,
                title: ToggleAuxiliaryBarAction.LABEL,
                toggled: {
                    condition: contextkeys_1.AuxiliaryBarVisibleContext,
                    title: (0, nls_1.localize)('secondary sidebar', "Secondary Side Bar"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'secondary sidebar mnemonic', comment: ['&& denotes a mnemonic'] }, "Secondary Si&&de Bar"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 32 /* KeyCode.KeyB */
                },
                menu: [
                    {
                        id: actions_1.MenuId.LayoutControlMenuSubmenu,
                        group: '0_workbench_layout',
                        order: 1
                    },
                    {
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        group: '2_workbench_layout',
                        order: 2
                    }
                ]
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.setPartHidden(layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */), "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
        }
    }
    exports.ToggleAuxiliaryBarAction = ToggleAuxiliaryBarAction;
    (0, actions_1.registerAction2)(ToggleAuxiliaryBarAction);
    (0, actions_1.registerAction2)(class FocusAuxiliaryBarAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.focusAuxiliaryBar'; }
        static { this.LABEL = (0, nls_1.localize2)('focusAuxiliaryBar', "Focus into Secondary Side Bar"); }
        constructor() {
            super({
                id: FocusAuxiliaryBarAction.ID,
                title: FocusAuxiliaryBarAction.LABEL,
                category: actionCommonCategories_1.Categories.View,
                f1: true,
            });
        }
        async run(accessor) {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            // Show auxiliary bar
            if (!layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */)) {
                layoutService.setPartHidden(false, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
            }
            // Focus into active composite
            const composite = paneCompositeService.getActivePaneComposite(2 /* ViewContainerLocation.AuxiliaryBar */);
            composite?.focus();
        }
    });
    actions_1.MenuRegistry.appendMenuItems([
        {
            id: actions_1.MenuId.LayoutControlMenu,
            item: {
                group: '0_workbench_toggles',
                command: {
                    id: ToggleAuxiliaryBarAction.ID,
                    title: (0, nls_1.localize)('toggleSecondarySideBar', "Toggle Secondary Side Bar"),
                    toggled: { condition: contextkeys_1.AuxiliaryBarVisibleContext, icon: auxiliaryBarLeftIcon },
                    icon: auxiliaryBarLeftOffIcon,
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'toggles'), contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both')), contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right')),
                order: 0
            }
        }, {
            id: actions_1.MenuId.LayoutControlMenu,
            item: {
                group: '0_workbench_toggles',
                command: {
                    id: ToggleAuxiliaryBarAction.ID,
                    title: (0, nls_1.localize)('toggleSecondarySideBar', "Toggle Secondary Side Bar"),
                    toggled: { condition: contextkeys_1.AuxiliaryBarVisibleContext, icon: auxiliaryBarRightIcon },
                    icon: auxiliaryBarRightOffIcon,
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'toggles'), contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both')), contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'left')),
                order: 2
            }
        }, {
            id: actions_1.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleAuxiliaryBarAction.ID,
                    title: (0, nls_1.localize2)('hideAuxiliaryBar', 'Hide Secondary Side Bar'),
                },
                when: contextkey_1.ContextKeyExpr.and(contextkeys_1.AuxiliaryBarVisibleContext, contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(2 /* ViewContainerLocation.AuxiliaryBar */))),
                order: 2
            }
        }
    ]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5QmFyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvYXV4aWxpYXJ5YmFyL2F1eGlsaWFyeUJhckFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUJoRyxNQUFNLHFCQUFxQixHQUFHLElBQUEsMkJBQVksRUFBQyxnQ0FBZ0MsRUFBRSxrQkFBTyxDQUFDLGtCQUFrQixFQUFFLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLDZEQUE2RCxDQUFDLENBQUMsQ0FBQztJQUM5TSxNQUFNLHdCQUF3QixHQUFHLElBQUEsMkJBQVksRUFBQyxvQ0FBb0MsRUFBRSxrQkFBTyxDQUFDLHFCQUFxQixFQUFFLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLDREQUE0RCxDQUFDLENBQUMsQ0FBQztJQUN6TixNQUFNLG9CQUFvQixHQUFHLElBQUEsMkJBQVksRUFBQywrQkFBK0IsRUFBRSxrQkFBTyxDQUFDLGlCQUFpQixFQUFFLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLHdEQUF3RCxDQUFDLENBQUMsQ0FBQztJQUNyTSxNQUFNLHVCQUF1QixHQUFHLElBQUEsMkJBQVksRUFBQyxtQ0FBbUMsRUFBRSxrQkFBTyxDQUFDLG9CQUFvQixFQUFFLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLDJEQUEyRCxDQUFDLENBQUMsQ0FBQztJQUVwTixNQUFhLHdCQUF5QixTQUFRLGlCQUFPO2lCQUVwQyxPQUFFLEdBQUcscUNBQXFDLENBQUM7aUJBQzNDLFVBQUssR0FBRyxJQUFBLGVBQVMsRUFBQyxvQkFBb0IsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDO1FBRWhHO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSx3QkFBd0IsQ0FBQyxFQUFFO2dCQUMvQixLQUFLLEVBQUUsd0JBQXdCLENBQUMsS0FBSztnQkFDckMsT0FBTyxFQUFFO29CQUNSLFNBQVMsRUFBRSx3Q0FBMEI7b0JBQ3JDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxvQkFBb0IsQ0FBQztvQkFDMUQsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLDRCQUE0QixFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxzQkFBc0IsQ0FBQztpQkFDMUg7Z0JBRUQsUUFBUSxFQUFFLG1DQUFVLENBQUMsSUFBSTtnQkFDekIsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsVUFBVSxFQUFFO29CQUNYLE1BQU0sNkNBQW1DO29CQUN6QyxPQUFPLEVBQUUsZ0RBQTJCLHdCQUFlO2lCQUNuRDtnQkFDRCxJQUFJLEVBQUU7b0JBQ0w7d0JBQ0MsRUFBRSxFQUFFLGdCQUFNLENBQUMsd0JBQXdCO3dCQUNuQyxLQUFLLEVBQUUsb0JBQW9CO3dCQUMzQixLQUFLLEVBQUUsQ0FBQztxQkFDUjtvQkFDRDt3QkFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxxQkFBcUI7d0JBQ2hDLEtBQUssRUFBRSxvQkFBb0I7d0JBQzNCLEtBQUssRUFBRSxDQUFDO3FCQUNSO2lCQUNEO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDNUMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUIsQ0FBQyxDQUFDO1lBQzVELGFBQWEsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLFNBQVMsOERBQXlCLCtEQUEwQixDQUFDO1FBQ3hHLENBQUM7O0lBdkNGLDREQXdDQztJQUVELElBQUEseUJBQWUsRUFBQyx3QkFBd0IsQ0FBQyxDQUFDO0lBRTFDLElBQUEseUJBQWUsRUFBQyxNQUFNLHVCQUF3QixTQUFRLGlCQUFPO2lCQUU1QyxPQUFFLEdBQUcsb0NBQW9DLENBQUM7aUJBQzFDLFVBQUssR0FBRyxJQUFBLGVBQVMsRUFBQyxtQkFBbUIsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO1FBRXhGO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSx1QkFBdUIsQ0FBQyxFQUFFO2dCQUM5QixLQUFLLEVBQUUsdUJBQXVCLENBQUMsS0FBSztnQkFDcEMsUUFBUSxFQUFFLG1DQUFVLENBQUMsSUFBSTtnQkFDekIsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUM1QyxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMseUNBQXlCLENBQUMsQ0FBQztZQUNyRSxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVDQUF1QixDQUFDLENBQUM7WUFFNUQscUJBQXFCO1lBQ3JCLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyw4REFBeUIsRUFBRSxDQUFDO2dCQUN2RCxhQUFhLENBQUMsYUFBYSxDQUFDLEtBQUssK0RBQTBCLENBQUM7WUFDN0QsQ0FBQztZQUVELDhCQUE4QjtZQUM5QixNQUFNLFNBQVMsR0FBRyxvQkFBb0IsQ0FBQyxzQkFBc0IsNENBQW9DLENBQUM7WUFDbEcsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDO1FBQ3BCLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxzQkFBWSxDQUFDLGVBQWUsQ0FBQztRQUM1QjtZQUNDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGlCQUFpQjtZQUM1QixJQUFJLEVBQUU7Z0JBQ0wsS0FBSyxFQUFFLHFCQUFxQjtnQkFDNUIsT0FBTyxFQUFFO29CQUNSLEVBQUUsRUFBRSx3QkFBd0IsQ0FBQyxFQUFFO29CQUMvQixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsMkJBQTJCLENBQUM7b0JBQ3RFLE9BQU8sRUFBRSxFQUFFLFNBQVMsRUFBRSx3Q0FBMEIsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7b0JBQzlFLElBQUksRUFBRSx1QkFBdUI7aUJBQzdCO2dCQUNELElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQywyQkFBYyxDQUFDLEVBQUUsQ0FBQywyQkFBYyxDQUFDLE1BQU0sQ0FBQyxxQ0FBcUMsRUFBRSxTQUFTLENBQUMsRUFBRSwyQkFBYyxDQUFDLE1BQU0sQ0FBQyxxQ0FBcUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFLDJCQUFjLENBQUMsTUFBTSxDQUFDLG1DQUFtQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUMvUCxLQUFLLEVBQUUsQ0FBQzthQUNSO1NBQ0QsRUFBRTtZQUNGLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGlCQUFpQjtZQUM1QixJQUFJLEVBQUU7Z0JBQ0wsS0FBSyxFQUFFLHFCQUFxQjtnQkFDNUIsT0FBTyxFQUFFO29CQUNSLEVBQUUsRUFBRSx3QkFBd0IsQ0FBQyxFQUFFO29CQUMvQixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsMkJBQTJCLENBQUM7b0JBQ3RFLE9BQU8sRUFBRSxFQUFFLFNBQVMsRUFBRSx3Q0FBMEIsRUFBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUU7b0JBQy9FLElBQUksRUFBRSx3QkFBd0I7aUJBQzlCO2dCQUNELElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQywyQkFBYyxDQUFDLEVBQUUsQ0FBQywyQkFBYyxDQUFDLE1BQU0sQ0FBQyxxQ0FBcUMsRUFBRSxTQUFTLENBQUMsRUFBRSwyQkFBYyxDQUFDLE1BQU0sQ0FBQyxxQ0FBcUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFLDJCQUFjLENBQUMsTUFBTSxDQUFDLG1DQUFtQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM5UCxLQUFLLEVBQUUsQ0FBQzthQUNSO1NBQ0QsRUFBRTtZQUNGLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGdCQUFnQjtZQUMzQixJQUFJLEVBQUU7Z0JBQ0wsS0FBSyxFQUFFLHlCQUF5QjtnQkFDaEMsT0FBTyxFQUFFO29CQUNSLEVBQUUsRUFBRSx3QkFBd0IsQ0FBQyxFQUFFO29CQUMvQixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsa0JBQWtCLEVBQUUseUJBQXlCLENBQUM7aUJBQy9EO2dCQUNELElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyx3Q0FBMEIsRUFBRSwyQkFBYyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsSUFBQSxxQ0FBNkIsNkNBQW9DLENBQUMsQ0FBQztnQkFDOUosS0FBSyxFQUFFLENBQUM7YUFDUjtTQUNEO0tBQ0QsQ0FBQyxDQUFDIn0=