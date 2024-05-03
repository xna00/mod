/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/themables", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/configuration/common/configuration", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/preferences/common/preferences"], function (require, exports, codicons_1, themables_1, nls_1, accessibility_1, actions_1, accessibilitySignalService_1, configuration_1, quickInput_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowAccessibilityAnnouncementHelp = exports.ShowSignalSoundHelp = void 0;
    class ShowSignalSoundHelp extends actions_1.Action2 {
        static { this.ID = 'signals.sounds.help'; }
        constructor() {
            super({
                id: ShowSignalSoundHelp.ID,
                title: (0, nls_1.localize2)('signals.sound.help', "Help: List Signal Sounds"),
                f1: true,
                metadata: {
                    description: (0, nls_1.localize)('accessibility.sound.help.description', "List all accessibility sounds / audio cues and configure their settings")
                }
            });
        }
        async run(accessor) {
            const accessibilitySignalService = accessor.get(accessibilitySignalService_1.IAccessibilitySignalService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const accessibilityService = accessor.get(accessibility_1.IAccessibilityService);
            const preferencesService = accessor.get(preferences_1.IPreferencesService);
            const userGestureSignals = [accessibilitySignalService_1.AccessibilitySignal.save, accessibilitySignalService_1.AccessibilitySignal.format];
            const items = accessibilitySignalService_1.AccessibilitySignal.allAccessibilitySignals.map((signal, idx) => ({
                label: userGestureSignals.includes(signal) ? `${signal.name} (${configurationService.getValue(signal.settingsKey + '.sound')})` : signal.name,
                signal,
                buttons: userGestureSignals.includes(signal) ? [{
                        iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.settingsGear),
                        tooltip: (0, nls_1.localize)('sounds.help.settings', 'Configure Sound'),
                        alwaysVisible: true
                    }] : []
            }));
            const qp = quickInputService.createQuickPick();
            qp.items = items;
            qp.selectedItems = items.filter(i => accessibilitySignalService.isSoundEnabled(i.signal) || userGestureSignals.includes(i.signal) && configurationService.getValue(i.signal.settingsKey + '.sound') !== 'never');
            qp.onDidAccept(() => {
                const enabledSounds = qp.selectedItems.map(i => i.signal);
                const disabledSounds = qp.items.map(i => i.signal).filter(i => !enabledSounds.includes(i));
                for (const signal of enabledSounds) {
                    let { sound, announcement } = configurationService.getValue(signal.settingsKey);
                    sound = userGestureSignals.includes(signal) ? 'userGesture' : accessibilityService.isScreenReaderOptimized() ? 'auto' : 'on';
                    if (announcement) {
                        configurationService.updateValue(signal.settingsKey, { sound, announcement });
                    }
                    else {
                        configurationService.updateValue(signal.settingsKey, { sound });
                    }
                }
                for (const signal of disabledSounds) {
                    let { sound, announcement } = configurationService.getValue(signal.settingsKey);
                    sound = userGestureSignals.includes(signal) ? 'never' : 'off';
                    if (announcement) {
                        configurationService.updateValue(signal.settingsKey, { sound, announcement });
                    }
                    else {
                        configurationService.updateValue(signal.settingsKey, { sound });
                    }
                }
                qp.hide();
            });
            qp.onDidTriggerItemButton(e => {
                preferencesService.openUserSettings({ jsonEditor: true, revealSetting: { key: e.item.signal.settingsKey, edit: true } });
            });
            qp.onDidChangeActive(() => {
                accessibilitySignalService.playSound(qp.activeItems[0].signal.sound.getSound(true), true);
            });
            qp.placeholder = (0, nls_1.localize)('sounds.help.placeholder', 'Select a sound to play and configure');
            qp.canSelectMany = true;
            await qp.show();
        }
    }
    exports.ShowSignalSoundHelp = ShowSignalSoundHelp;
    class ShowAccessibilityAnnouncementHelp extends actions_1.Action2 {
        static { this.ID = 'accessibility.announcement.help'; }
        constructor() {
            super({
                id: ShowAccessibilityAnnouncementHelp.ID,
                title: (0, nls_1.localize2)('accessibility.announcement.help', "Help: List Signal Announcements"),
                f1: true,
                metadata: {
                    description: (0, nls_1.localize)('accessibility.announcement.help.description', "List all accessibility announcements / alerts and configure their settings")
                }
            });
        }
        async run(accessor) {
            const accessibilitySignalService = accessor.get(accessibilitySignalService_1.IAccessibilitySignalService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const accessibilityService = accessor.get(accessibility_1.IAccessibilityService);
            const preferencesService = accessor.get(preferences_1.IPreferencesService);
            const userGestureSignals = [accessibilitySignalService_1.AccessibilitySignal.save, accessibilitySignalService_1.AccessibilitySignal.format];
            const items = accessibilitySignalService_1.AccessibilitySignal.allAccessibilitySignals.filter(c => !!c.legacyAnnouncementSettingsKey).map((signal, idx) => ({
                label: userGestureSignals.includes(signal) ? `${signal.name} (${configurationService.getValue(signal.settingsKey + '.announcement')})` : signal.name,
                signal,
                buttons: userGestureSignals.includes(signal) ? [{
                        iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.settingsGear),
                        tooltip: (0, nls_1.localize)('announcement.help.settings', 'Configure Announcement'),
                        alwaysVisible: true,
                    }] : []
            }));
            const qp = quickInputService.createQuickPick();
            qp.items = items;
            qp.selectedItems = items.filter(i => accessibilitySignalService.isAnnouncementEnabled(i.signal) || userGestureSignals.includes(i.signal) && configurationService.getValue(i.signal.settingsKey + '.announcement') !== 'never');
            qp.onDidAccept(() => {
                const enabledAnnouncements = qp.selectedItems.map(i => i.signal);
                const disabledAnnouncements = accessibilitySignalService_1.AccessibilitySignal.allAccessibilitySignals.filter(cue => !!cue.legacyAnnouncementSettingsKey && !enabledAnnouncements.includes(cue));
                for (const signal of enabledAnnouncements) {
                    let { sound, announcement } = configurationService.getValue(signal.settingsKey);
                    announcement = userGestureSignals.includes(signal) ? 'userGesture' : signal.announcementMessage && accessibilityService.isScreenReaderOptimized() ? 'auto' : undefined;
                    configurationService.updateValue(signal.settingsKey, { sound, announcement });
                }
                for (const signal of disabledAnnouncements) {
                    const announcement = userGestureSignals.includes(signal) ? 'never' : 'off';
                    const sound = configurationService.getValue(signal.settingsKey + '.sound');
                    configurationService.updateValue(signal.settingsKey, announcement ? { sound, announcement } : { sound });
                }
                qp.hide();
            });
            qp.onDidTriggerItemButton(e => {
                preferencesService.openUserSettings({ jsonEditor: true, revealSetting: { key: e.item.signal.settingsKey, edit: true } });
            });
            qp.placeholder = (0, nls_1.localize)('announcement.help.placeholder', 'Select an announcement to configure');
            qp.canSelectMany = true;
            await qp.show();
        }
    }
    exports.ShowAccessibilityAnnouncementHelp = ShowAccessibilityAnnouncementHelp;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2FjY2Vzc2liaWxpdHlTaWduYWxzL2Jyb3dzZXIvY29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLE1BQWEsbUJBQW9CLFNBQVEsaUJBQU87aUJBQy9CLE9BQUUsR0FBRyxxQkFBcUIsQ0FBQztRQUUzQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsbUJBQW1CLENBQUMsRUFBRTtnQkFDMUIsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLG9CQUFvQixFQUFFLDBCQUEwQixDQUFDO2dCQUNsRSxFQUFFLEVBQUUsSUFBSTtnQkFDUixRQUFRLEVBQUU7b0JBQ1QsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHNDQUFzQyxFQUFFLHlFQUF5RSxDQUFDO2lCQUN4STthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQzVDLE1BQU0sMEJBQTBCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3REFBMkIsQ0FBQyxDQUFDO1lBQzdFLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1lBQzNELE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQ0FBbUIsQ0FBQyxDQUFDO1lBQzdELE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxnREFBbUIsQ0FBQyxJQUFJLEVBQUUsZ0RB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