/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/actions", "vs/workbench/services/layout/browser/layoutService", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/editor/common/editorService", "vs/workbench/common/contextkeys", "vs/base/browser/dom"], function (require, exports, nls_1, statusbar_1, actions_1, layoutService_1, keybindingsRegistry_1, actions_2, actionCommonCategories_1, editorService_1, contextkeys_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HideStatusbarEntryAction = exports.ToggleStatusbarEntryVisibilityAction = void 0;
    class ToggleStatusbarEntryVisibilityAction extends actions_1.Action {
        constructor(id, label, model) {
            super(id, label, undefined, true);
            this.model = model;
            this.checked = !model.isHidden(id);
        }
        async run() {
            if (this.model.isHidden(this.id)) {
                this.model.show(this.id);
            }
            else {
                this.model.hide(this.id);
            }
        }
    }
    exports.ToggleStatusbarEntryVisibilityAction = ToggleStatusbarEntryVisibilityAction;
    class HideStatusbarEntryAction extends actions_1.Action {
        constructor(id, name, model) {
            super(id, (0, nls_1.localize)('hide', "Hide '{0}'", name), undefined, true);
            this.model = model;
        }
        async run() {
            this.model.hide(this.id);
        }
    }
    exports.HideStatusbarEntryAction = HideStatusbarEntryAction;
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.focusPrevious',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 15 /* KeyCode.LeftArrow */,
        secondary: [16 /* KeyCode.UpArrow */],
        when: contextkeys_1.StatusBarFocused,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            statusBarService.focusPreviousEntry();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.focusNext',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 17 /* KeyCode.RightArrow */,
        secondary: [18 /* KeyCode.DownArrow */],
        when: contextkeys_1.StatusBarFocused,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            statusBarService.focusNextEntry();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.focusFirst',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 14 /* KeyCode.Home */,
        when: contextkeys_1.StatusBarFocused,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            statusBarService.focus(false);
            statusBarService.focusNextEntry();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.focusLast',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 13 /* KeyCode.End */,
        when: contextkeys_1.StatusBarFocused,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            statusBarService.focus(false);
            statusBarService.focusPreviousEntry();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.clearFocus',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 9 /* KeyCode.Escape */,
        when: contextkeys_1.StatusBarFocused,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            const editorService = accessor.get(editorService_1.IEditorService);
            if (statusBarService.isEntryFocused()) {
                statusBarService.focus(false);
            }
            else if (editorService.activeEditorPane) {
                editorService.activeEditorPane.focus();
            }
        }
    });
    class FocusStatusBarAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.focusStatusBar',
                title: (0, nls_1.localize2)('focusStatusBar', 'Focus Status Bar'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.focusPart("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, (0, dom_1.getActiveWindow)());
        }
    }
    (0, actions_2.registerAction2)(FocusStatusBarAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzYmFyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvc3RhdHVzYmFyL3N0YXR1c2JhckFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0JoRyxNQUFhLG9DQUFxQyxTQUFRLGdCQUFNO1FBRS9ELFlBQVksRUFBVSxFQUFFLEtBQWEsRUFBVSxLQUF5QjtZQUN2RSxLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFEWSxVQUFLLEdBQUwsS0FBSyxDQUFvQjtZQUd2RSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUc7WUFDakIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUIsQ0FBQztRQUNGLENBQUM7S0FDRDtJQWZELG9GQWVDO0lBRUQsTUFBYSx3QkFBeUIsU0FBUSxnQkFBTTtRQUVuRCxZQUFZLEVBQVUsRUFBRSxJQUFZLEVBQVUsS0FBeUI7WUFDdEUsS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQURw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