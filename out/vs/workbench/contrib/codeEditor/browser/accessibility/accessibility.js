/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/base/browser/ui/aria/aria", "vs/editor/common/standaloneStrings", "vs/css!./accessibility"], function (require, exports, nls, configuration_1, accessibility_1, actions_1, accessibilityConfiguration_1, aria_1, standaloneStrings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ToggleScreenReaderMode extends actions_1.Action2 {
        constructor() {
            super({
                id: 'editor.action.toggleScreenReaderAccessibilityMode',
                title: nls.localize2('toggleScreenReaderMode', "Toggle Screen Reader Accessibility Mode"),
                f1: true,
                keybinding: [{
                        primary: 2048 /* KeyMod.CtrlCmd */ | 35 /* KeyCode.KeyE */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
                        when: accessibilityConfiguration_1.accessibilityHelpIsShown
                    },
                    {
                        primary: 512 /* KeyMod.Alt */ | 59 /* KeyCode.F1 */ | 1024 /* KeyMod.Shift */,
                        linux: { primary: 512 /* KeyMod.Alt */ | 62 /* KeyCode.F4 */ | 1024 /* KeyMod.Shift */ },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
                    }]
            });
        }
        async run(accessor) {
            const accessibiiltyService = accessor.get(accessibility_1.IAccessibilityService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const isScreenReaderOptimized = accessibiiltyService.isScreenReaderOptimized();
            configurationService.updateValue('editor.accessibilitySupport', isScreenReaderOptimized ? 'off' : 'on', 2 /* ConfigurationTarget.USER */);
            (0, aria_1.alert)(isScreenReaderOptimized ? standaloneStrings_1.AccessibilityHelpNLS.screenReaderModeDisabled : standaloneStrings_1.AccessibilityHelpNLS.screenReaderModeEnabled);
        }
    }
    (0, actions_1.registerAction2)(ToggleScreenReaderMode);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL2FjY2Vzc2liaWxpdHkvYWNjZXNzaWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWNoRyxNQUFNLHNCQUF1QixTQUFRLGlCQUFPO1FBRTNDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxtREFBbUQ7Z0JBQ3ZELEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLHdCQUF3QixFQUFFLHlDQUF5QyxDQUFDO2dCQUN6RixFQUFFLEVBQUUsSUFBSTtnQkFDUixVQUFVLEVBQUUsQ0FBQzt3QkFDWixPQUFPLEVBQUUsaURBQTZCO3dCQUN0QyxNQUFNLEVBQUUsOENBQW9DLEVBQUU7d0JBQzlDLElBQUksRUFBRSxxREFBd0I7cUJBQzlCO29CQUNEO3dCQUNDLE9BQU8sRUFBRSwwQ0FBdUIsMEJBQWU7d0JBQy9DLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSwwQ0FBdUIsMEJBQWUsRUFBRTt3QkFDMUQsTUFBTSxFQUFFLDhDQUFvQyxFQUFFO3FCQUM5QyxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDbkMsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7WUFDakUsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7WUFDakUsTUFBTSx1QkFBdUIsR0FBRyxvQkFBb0IsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQy9FLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyw2QkFBNkIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLG1DQUEyQixDQUFDO1lBQ2xJLElBQUEsWUFBSyxFQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyx3Q0FBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsd0NBQW9CLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUMvSCxDQUFDO0tBQ0Q7SUFFRCxJQUFBLHlCQUFlLEVBQUMsc0JBQXNCLENBQUMsQ0FBQyJ9