/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/editor/browser/config/tabFocus", "vs/nls", "vs/platform/actions/common/actions"], function (require, exports, aria_1, tabFocus_1, nls, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleTabFocusModeAction = void 0;
    class ToggleTabFocusModeAction extends actions_1.Action2 {
        static { this.ID = 'editor.action.toggleTabFocusMode'; }
        constructor() {
            super({
                id: ToggleTabFocusModeAction.ID,
                title: nls.localize2({ key: 'toggle.tabMovesFocus', comment: ['Turn on/off use of tab key for moving focus around VS Code'] }, 'Toggle Tab Key Moves Focus'),
                precondition: undefined,
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 43 /* KeyCode.KeyM */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 43 /* KeyCode.KeyM */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                f1: true
            });
        }
        run() {
            const oldValue = tabFocus_1.TabFocus.getTabFocusMode();
            const newValue = !oldValue;
            tabFocus_1.TabFocus.setTabFocusMode(newValue);
            if (newValue) {
                (0, aria_1.alert)(nls.localize('toggle.tabMovesFocus.on', "Pressing Tab will now move focus to the next focusable element"));
            }
            else {
                (0, aria_1.alert)(nls.localize('toggle.tabMovesFocus.off', "Pressing Tab will now insert the tab character"));
            }
        }
    }
    exports.ToggleTabFocusModeAction = ToggleTabFocusModeAction;
    (0, actions_1.registerAction2)(ToggleTabFocusModeAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlVGFiRm9jdXNNb2RlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi90b2dnbGVUYWJGb2N1c01vZGUvYnJvd3Nlci90b2dnbGVUYWJGb2N1c01vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsd0JBQXlCLFNBQVEsaUJBQU87aUJBRTdCLE9BQUUsR0FBRyxrQ0FBa0MsQ0FBQztRQUUvRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsd0JBQXdCLENBQUMsRUFBRTtnQkFDL0IsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLEVBQUUsc0JBQXNCLEVBQUUsT0FBTyxFQUFFLENBQUMsNERBQTRELENBQUMsRUFBRSxFQUFFLDRCQUE0QixDQUFDO2dCQUM1SixZQUFZLEVBQUUsU0FBUztnQkFDdkIsVUFBVSxFQUFFO29CQUNYLE9BQU8sRUFBRSxpREFBNkI7b0JBQ3RDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxrREFBNkIsd0JBQWUsRUFBRTtvQkFDOUQsTUFBTSwwQ0FBZ0M7aUJBQ3RDO2dCQUNELEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVNLEdBQUc7WUFDVCxNQUFNLFFBQVEsR0FBRyxtQkFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzVDLE1BQU0sUUFBUSxHQUFHLENBQUMsUUFBUSxDQUFDO1lBQzNCLG1CQUFRLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2QsSUFBQSxZQUFLLEVBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxnRUFBZ0UsQ0FBQyxDQUFDLENBQUM7WUFDbEgsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUEsWUFBSyxFQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLEVBQUUsZ0RBQWdELENBQUMsQ0FBQyxDQUFDO1lBQ25HLENBQUM7UUFDRixDQUFDOztJQTNCRiw0REE0QkM7SUFFRCxJQUFBLHlCQUFlLEVBQUMsd0JBQXdCLENBQUMsQ0FBQyJ9