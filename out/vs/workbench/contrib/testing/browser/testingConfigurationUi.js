/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/types", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/quickinput/common/quickInput", "vs/base/common/themables", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/common/constants", "vs/workbench/contrib/testing/common/testProfileService"], function (require, exports, arrays_1, types_1, nls_1, commands_1, quickInput_1, themables_1, icons_1, constants_1, testProfileService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function buildPicker(accessor, { onlyGroup, showConfigureButtons = true, onlyForTest, onlyConfigurable, placeholder = (0, nls_1.localize)('testConfigurationUi.pick', 'Pick a test profile to use'), }) {
        const profileService = accessor.get(testProfileService_1.ITestProfileService);
        const items = [];
        const pushItems = (allProfiles, description) => {
            for (const profiles of (0, arrays_1.groupBy)(allProfiles, (a, b) => a.group - b.group)) {
                let addedHeader = false;
                if (onlyGroup) {
                    if (profiles[0].group !== onlyGroup) {
                        continue;
                    }
                    addedHeader = true; // showing one group, no need for label
                }
                for (const profile of profiles) {
                    if (onlyConfigurable && !profile.hasConfigurationHandler) {
                        continue;
                    }
                    if (!addedHeader) {
                        items.push({ type: 'separator', label: constants_1.testConfigurationGroupNames[profiles[0].group] });
                        addedHeader = true;
                    }
                    items.push(({
                        type: 'item',
                        profile,
                        label: profile.label,
                        description,
                        alwaysShow: true,
                        buttons: profile.hasConfigurationHandler && showConfigureButtons
                            ? [{
                                    iconClass: themables_1.ThemeIcon.asClassName(icons_1.testingUpdateProfiles),
                                    tooltip: (0, nls_1.localize)('updateTestConfiguration', 'Update Test Configuration')
                                }] : []
                    }));
                }
            }
        };
        if (onlyForTest !== undefined) {
            pushItems(profileService.getControllerProfiles(onlyForTest.controllerId).filter(p => (0, testProfileService_1.canUseProfileWithTest)(p, onlyForTest)));
        }
        else {
            for (const { profiles, controller } of profileService.all()) {
                pushItems(profiles, controller.label.value);
            }
        }
        const quickpick = accessor.get(quickInput_1.IQuickInputService).createQuickPick();
        quickpick.items = items;
        quickpick.placeholder = placeholder;
        return quickpick;
    }
    const triggerButtonHandler = (service, resolve) => (evt) => {
        const profile = evt.item.profile;
        if (profile) {
            service.configure(profile.controllerId, profile.profileId);
            resolve(undefined);
        }
    };
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.pickMultipleTestProfiles',
        handler: async (accessor, options) => {
            const profileService = accessor.get(testProfileService_1.ITestProfileService);
            const quickpick = buildPicker(accessor, options);
            if (!quickpick) {
                return;
            }
            quickpick.canSelectMany = true;
            if (options.selected) {
                quickpick.selectedItems = quickpick.items
                    .filter((i) => i.type === 'item')
                    .filter(i => options.selected.some(s => s.controllerId === i.profile.controllerId && s.profileId === i.profile.profileId));
            }
            const pick = await new Promise(resolve => {
                quickpick.onDidAccept(() => {
                    const selected = quickpick.selectedItems;
                    resolve(selected.map(s => s.profile).filter(types_1.isDefined));
                });
                quickpick.onDidHide(() => resolve(undefined));
                quickpick.onDidTriggerItemButton(triggerButtonHandler(profileService, resolve));
                quickpick.show();
            });
            quickpick.dispose();
            return pick;
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.pickTestProfile',
        handler: async (accessor, options) => {
            const profileService = accessor.get(testProfileService_1.ITestProfileService);
            const quickpick = buildPicker(accessor, options);
            if (!quickpick) {
                return;
            }
            const pick = await new Promise(resolve => {
                quickpick.onDidAccept(() => resolve(quickpick.selectedItems[0]?.profile));
                quickpick.onDidHide(() => resolve(undefined));
                quickpick.onDidTriggerItemButton(triggerButtonHandler(profileService, resolve));
                quickpick.show();
            });
            quickpick.dispose();
            return pick;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ0NvbmZpZ3VyYXRpb25VaS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9icm93c2VyL3Rlc3RpbmdDb25maWd1cmF0aW9uVWkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUEyQmhHLFNBQVMsV0FBVyxDQUFDLFFBQTBCLEVBQUUsRUFDaEQsU0FBUyxFQUNULG9CQUFvQixHQUFHLElBQUksRUFDM0IsV0FBVyxFQUNYLGdCQUFnQixFQUNoQixXQUFXLEdBQUcsSUFBQSxjQUFRLEVBQUMsMEJBQTBCLEVBQUUsNEJBQTRCLENBQUMsR0FDbkQ7UUFDN0IsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3Q0FBbUIsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sS0FBSyxHQUFvRSxFQUFFLENBQUM7UUFDbEYsTUFBTSxTQUFTLEdBQUcsQ0FBQyxXQUE4QixFQUFFLFdBQW9CLEVBQUUsRUFBRTtZQUMxRSxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUEsZ0JBQU8sRUFBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMxRSxJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7Z0JBQ3hCLElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ2YsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO3dCQUNyQyxTQUFTO29CQUNWLENBQUM7b0JBRUQsV0FBVyxHQUFHLElBQUksQ0FBQyxDQUFDLHVDQUF1QztnQkFDNUQsQ0FBQztnQkFFRCxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFD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