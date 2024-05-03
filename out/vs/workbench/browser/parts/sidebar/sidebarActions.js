/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/workbench/services/layout/browser/layoutService", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/css!./media/sidebarpart"], function (require, exports, nls_1, actions_1, layoutService_1, actionCommonCategories_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FocusSideBarAction = void 0;
    class FocusSideBarAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.focusSideBar',
                title: (0, nls_1.localize2)('focusSideBar', 'Focus into Primary Side Bar'),
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: null,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 21 /* KeyCode.Digit0 */
                }
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            // Show side bar
            if (!layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                layoutService.setPartHidden(false, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                return;
            }
            // Focus into active viewlet
            const viewlet = paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            viewlet?.focus();
        }
    }
    exports.FocusSideBarAction = FocusSideBarAction;
    (0, actions_1.registerAction2)(FocusSideBarAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lkZWJhckFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL3NpZGViYXIvc2lkZWJhckFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLE1BQWEsa0JBQW1CLFNBQVEsaUJBQU87UUFFOUM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLCtCQUErQjtnQkFDbkMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLGNBQWMsRUFBRSw2QkFBNkIsQ0FBQztnQkFDL0QsUUFBUSxFQUFFLG1DQUFVLENBQUMsSUFBSTtnQkFDekIsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsVUFBVSxFQUFFO29CQUNYLE1BQU0sNkNBQW1DO29CQUN6QyxJQUFJLEVBQUUsSUFBSTtvQkFDVixPQUFPLEVBQUUsbURBQStCO2lCQUN4QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQ25DLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUNBQXVCLENBQUMsQ0FBQztZQUM1RCxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMseUNBQXlCLENBQUMsQ0FBQztZQUVyRSxnQkFBZ0I7WUFDaEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLG9EQUFvQixFQUFFLENBQUM7Z0JBQ2xELGFBQWEsQ0FBQyxhQUFhLENBQUMsS0FBSyxxREFBcUIsQ0FBQztnQkFDdkQsT0FBTztZQUNSLENBQUM7WUFFRCw0QkFBNEI7WUFDNUIsTUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsc0JBQXNCLHVDQUErQixDQUFDO1lBQzNGLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUE5QkQsZ0RBOEJDO0lBRUQsSUFBQSx5QkFBZSxFQUFDLGtCQUFrQixDQUFDLENBQUMifQ==