/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/layout/browser/layoutService", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/browser/dom", "vs/base/browser/window"], function (require, exports, nls_1, editorGroupsService_1, layoutService_1, actions_1, actionCommonCategories_1, editorService_1, panecomposite_1, dom_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BaseNavigationAction extends actions_1.Action2 {
        constructor(options, direction) {
            super(options);
            this.direction = direction;
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const isEditorFocus = layoutService.hasFocus("workbench.parts.editor" /* Parts.EDITOR_PART */);
            const isPanelFocus = layoutService.hasFocus("workbench.parts.panel" /* Parts.PANEL_PART */);
            const isSidebarFocus = layoutService.hasFocus("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
            const isAuxiliaryBarFocus = layoutService.hasFocus("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
            let neighborPart;
            if (isEditorFocus) {
                const didNavigate = this.navigateAcrossEditorGroup(this.toGroupDirection(this.direction), editorGroupService);
                if (didNavigate) {
                    return;
                }
                neighborPart = layoutService.getVisibleNeighborPart("workbench.parts.editor" /* Parts.EDITOR_PART */, this.direction);
            }
            if (isPanelFocus) {
                neighborPart = layoutService.getVisibleNeighborPart("workbench.parts.panel" /* Parts.PANEL_PART */, this.direction);
            }
            if (isSidebarFocus) {
                neighborPart = layoutService.getVisibleNeighborPart("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */, this.direction);
            }
            if (isAuxiliaryBarFocus) {
                neighborPart = neighborPart = layoutService.getVisibleNeighborPart("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */, this.direction);
            }
            if (neighborPart === "workbench.parts.editor" /* Parts.EDITOR_PART */) {
                if (!this.navigateBackToEditorGroup(this.toGroupDirection(this.direction), editorGroupService)) {
                    this.navigateToEditorGroup(this.direction === 3 /* Direction.Right */ ? 0 /* GroupLocation.FIRST */ : 1 /* GroupLocation.LAST */, editorGroupService);
                }
            }
            else if (neighborPart === "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) {
                this.navigateToSidebar(layoutService, paneCompositeService);
            }
            else if (neighborPart === "workbench.parts.panel" /* Parts.PANEL_PART */) {
                this.navigateToPanel(layoutService, paneCompositeService);
            }
            else if (neighborPart === "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */) {
                this.navigateToAuxiliaryBar(layoutService, paneCompositeService);
            }
        }
        async navigateToPanel(layoutService, paneCompositeService) {
            if (!layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                return false;
            }
            const activePanel = paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            if (!activePanel) {
                return false;
            }
            const activePanelId = activePanel.getId();
            const res = await paneCompositeService.openPaneComposite(activePanelId, 1 /* ViewContainerLocation.Panel */, true);
            if (!res) {
                return false;
            }
            return res;
        }
        async navigateToSidebar(layoutService, paneCompositeService) {
            if (!layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                return false;
            }
            const activeViewlet = paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            if (!activeViewlet) {
                return false;
            }
            const activeViewletId = activeViewlet.getId();
            const viewlet = await paneCompositeService.openPaneComposite(activeViewletId, 0 /* ViewContainerLocation.Sidebar */, true);
            return !!viewlet;
        }
        async navigateToAuxiliaryBar(layoutService, paneCompositeService) {
            if (!layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */)) {
                return false;
            }
            const activePanel = paneCompositeService.getActivePaneComposite(2 /* ViewContainerLocation.AuxiliaryBar */);
            if (!activePanel) {
                return false;
            }
            const activePanelId = activePanel.getId();
            const res = await paneCompositeService.openPaneComposite(activePanelId, 2 /* ViewContainerLocation.AuxiliaryBar */, true);
            if (!res) {
                return false;
            }
            return res;
        }
        navigateAcrossEditorGroup(direction, editorGroupService) {
            return this.doNavigateToEditorGroup({ direction }, editorGroupService);
        }
        navigateToEditorGroup(location, editorGroupService) {
            return this.doNavigateToEditorGroup({ location }, editorGroupService);
        }
        navigateBackToEditorGroup(direction, editorGroupService) {
            if (!editorGroupService.activeGroup) {
                return false;
            }
            const oppositeDirection = this.toOppositeDirection(direction);
            // Check to see if there is a group in between the last
            // active group and the direction of movement
            const groupInBetween = editorGroupService.findGroup({ direction: oppositeDirection }, editorGroupService.activeGroup);
            if (!groupInBetween) {
                // No group in between means we can return
                // focus to the last active editor group
                editorGroupService.activeGroup.focus();
                return true;
            }
            return false;
        }
        toGroupDirection(direction) {
            switch (direction) {
                case 1 /* Direction.Down */: return 1 /* GroupDirection.DOWN */;
                case 2 /* Direction.Left */: return 2 /* GroupDirection.LEFT */;
                case 3 /* Direction.Right */: return 3 /* GroupDirection.RIGHT */;
                case 0 /* Direction.Up */: return 0 /* GroupDirection.UP */;
            }
        }
        toOppositeDirection(direction) {
            switch (direction) {
                case 0 /* GroupDirection.UP */: return 1 /* GroupDirection.DOWN */;
                case 3 /* GroupDirection.RIGHT */: return 2 /* GroupDirection.LEFT */;
                case 2 /* GroupDirection.LEFT */: return 3 /* GroupDirection.RIGHT */;
                case 1 /* GroupDirection.DOWN */: return 0 /* GroupDirection.UP */;
            }
        }
        doNavigateToEditorGroup(scope, editorGroupService) {
            const targetGroup = editorGroupService.findGroup(scope, editorGroupService.activeGroup);
            if (targetGroup) {
                targetGroup.focus();
                return true;
            }
            return false;
        }
    }
    (0, actions_1.registerAction2)(class extends BaseNavigationAction {
        constructor() {
            super({
                id: 'workbench.action.navigateLeft',
                title: (0, nls_1.localize2)('navigateLeft', 'Navigate to the View on the Left'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            }, 2 /* Direction.Left */);
        }
    });
    (0, actions_1.registerAction2)(class extends BaseNavigationAction {
        constructor() {
            super({
                id: 'workbench.action.navigateRight',
                title: (0, nls_1.localize2)('navigateRight', 'Navigate to the View on the Right'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            }, 3 /* Direction.Right */);
        }
    });
    (0, actions_1.registerAction2)(class extends BaseNavigationAction {
        constructor() {
            super({
                id: 'workbench.action.navigateUp',
                title: (0, nls_1.localize2)('navigateUp', 'Navigate to the View Above'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            }, 0 /* Direction.Up */);
        }
    });
    (0, actions_1.registerAction2)(class extends BaseNavigationAction {
        constructor() {
            super({
                id: 'workbench.action.navigateDown',
                title: (0, nls_1.localize2)('navigateDown', 'Navigate to the View Below'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            }, 1 /* Direction.Down */);
        }
    });
    class BaseFocusAction extends actions_1.Action2 {
        constructor(options, focusNext) {
            super(options);
            this.focusNext = focusNext;
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const editorService = accessor.get(editorService_1.IEditorService);
            this.focusNextOrPreviousPart(layoutService, editorService, this.focusNext);
        }
        findVisibleNeighbour(layoutService, part, next) {
            const activeWindow = (0, dom_1.getActiveWindow)();
            const windowIsAuxiliary = (0, window_1.isAuxiliaryWindow)(activeWindow);
            let neighbour;
            if (windowIsAuxiliary) {
                switch (part) {
                    case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                        neighbour = "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */;
                        break;
                    default:
                        neighbour = "workbench.parts.editor" /* Parts.EDITOR_PART */;
                }
            }
            else {
                switch (part) {
                    case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                        neighbour = next ? "workbench.parts.panel" /* Parts.PANEL_PART */ : "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */;
                        break;
                    case "workbench.parts.panel" /* Parts.PANEL_PART */:
                        neighbour = next ? "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */ : "workbench.parts.editor" /* Parts.EDITOR_PART */;
                        break;
                    case "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */:
                        neighbour = next ? "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */ : "workbench.parts.panel" /* Parts.PANEL_PART */;
                        break;
                    case "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */:
                        neighbour = next ? "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */ : "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */;
                        break;
                    case "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */:
                        neighbour = next ? "workbench.parts.editor" /* Parts.EDITOR_PART */ : "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */;
                        break;
                    default:
                        neighbour = "workbench.parts.editor" /* Parts.EDITOR_PART */;
                }
            }
            if (layoutService.isVisible(neighbour, activeWindow) || neighbour === "workbench.parts.editor" /* Parts.EDITOR_PART */) {
                return neighbour;
            }
            return this.findVisibleNeighbour(layoutService, neighbour, next);
        }
        focusNextOrPreviousPart(layoutService, editorService, next) {
            let currentlyFocusedPart;
            if (editorService.activeEditorPane?.hasFocus() || layoutService.hasFocus("workbench.parts.editor" /* Parts.EDITOR_PART */)) {
                currentlyFocusedPart = "workbench.parts.editor" /* Parts.EDITOR_PART */;
            }
            else if (layoutService.hasFocus("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */)) {
                currentlyFocusedPart = "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */;
            }
            else if (layoutService.hasFocus("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */)) {
                currentlyFocusedPart = "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */;
            }
            else if (layoutService.hasFocus("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                currentlyFocusedPart = "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */;
            }
            else if (layoutService.hasFocus("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                currentlyFocusedPart = "workbench.parts.panel" /* Parts.PANEL_PART */;
            }
            layoutService.focusPart(currentlyFocusedPart ? this.findVisibleNeighbour(layoutService, currentlyFocusedPart, next) : "workbench.parts.editor" /* Parts.EDITOR_PART */, (0, dom_1.getActiveWindow)());
        }
    }
    (0, actions_1.registerAction2)(class extends BaseFocusAction {
        constructor() {
            super({
                id: 'workbench.action.focusNextPart',
                title: (0, nls_1.localize2)('focusNextPart', 'Focus Next Part'),
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    primary: 64 /* KeyCode.F6 */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            }, true);
        }
    });
    (0, actions_1.registerAction2)(class extends BaseFocusAction {
        constructor() {
            super({
                id: 'workbench.action.focusPreviousPart',
                title: (0, nls_1.localize2)('focusPreviousPart', 'Focus Previous Part'),
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    primary: 1024 /* KeyMod.Shift */ | 64 /* KeyCode.F6 */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            }, false);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdGlvbkFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL2FjdGlvbnMvbmF2aWdhdGlvbkFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQmhHLE1BQWUsb0JBQXFCLFNBQVEsaUJBQU87UUFFbEQsWUFDQyxPQUF3QixFQUNkLFNBQW9CO1lBRTlCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUZMLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFHL0IsQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVDQUF1QixDQUFDLENBQUM7WUFDNUQsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBDQUFvQixDQUFDLENBQUM7WUFDOUQsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHlDQUF5QixDQUFDLENBQUM7WUFFckUsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLFFBQVEsa0RBQW1CLENBQUM7WUFDaEUsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLFFBQVEsZ0RBQWtCLENBQUM7WUFDOUQsTUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDLFFBQVEsb0RBQW9CLENBQUM7WUFDbEUsTUFBTSxtQkFBbUIsR0FBRyxhQUFhLENBQUMsUUFBUSw4REFBeUIsQ0FBQztZQUU1RSxJQUFJLFlBQStCLENBQUM7WUFDcEMsSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztnQkFDOUcs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