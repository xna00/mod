/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/workbench/services/preferences/common/preferences", "vs/workbench/contrib/preferences/browser/settingsTreeModels", "vs/base/common/network", "vs/platform/configuration/common/configuration", "vs/workbench/services/preferences/common/preferencesModels", "vs/platform/contextview/browser/contextView", "vs/base/browser/ui/actionbar/actionViewItems", "vs/platform/telemetry/common/telemetry", "vs/platform/clipboard/common/clipboardService"], function (require, exports, nls, preferences_1, settingsTreeModels_1, network_1, configuration_1, preferencesModels_1, contextView_1, actionViewItems_1, telemetry_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleSettingRenderer = void 0;
    const codeSettingRegex = /^<code (codesetting)="([^\s"\:]+)(?::([^"]+))?">/;
    let SimpleSettingRenderer = class SimpleSettingRenderer {
        constructor(_configurationService, _contextMenuService, _preferencesService, _telemetryService, _clipboardService) {
            this._configurationService = _configurationService;
            this._contextMenuService = _contextMenuService;
            this._preferencesService = _preferencesService;
            this._telemetryService = _telemetryService;
            this._clipboardService = _clipboardService;
            this._updatedSettings = new Map(); // setting ID to user's original setting value
            this._encounteredSettings = new Map(); // setting ID to setting
            this._featuredSettings = new Map(); // setting ID to feature value
            this.settingsGroups = undefined;
            this._defaultSettings = new preferencesModels_1.DefaultSettings([], 2 /* ConfigurationTarget.USER */);
        }
        get featuredSettingStates() {
            const result = new Map();
            for (const [settingId, value] of this._featuredSettings) {
                result.set(settingId, this._configurationService.getValue(settingId) === value);
            }
            return result;
        }
        getHtmlRenderer() {
            return (html) => {
                const match = codeSettingRegex.exec(html);
                if (match && match.length === 4) {
                    const settingId = match[2];
                    const rendered = this.render(settingId, match[3]);
                    if (rendered) {
                        html = html.replace(codeSettingRegex, rendered);
                    }
                }
                return html;
            };
        }
        settingToUriString(settingId, value) {
            return `${network_1.Schemas.codeSetting}://${settingId}${value ? `/${value}` : ''}`;
        }
        getSetting(settingId) {
            if (!this.settingsGroups) {
                this.settingsGroups = this._defaultSettings.getSettingsGroups();
            }
            if (this._encounteredSettings.has(settingId)) {
                return this._encounteredSettings.get(settingId);
            }
            for (const group of this.settingsGroups) {
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        if (setting.key === settingId) {
                            this._encounteredSettings.set(settingId, setting);
                            return setting;
                        }
                    }
                }
            }
            return undefined;
        }
        parseValue(settingId, value) {
            if (value === 'undefined' || value === '') {
                return undefined;
            }
            const setting = this.getSetting(settingId);
            if (!setting) {
                return value;
            }
            switch (setting.type) {
                case 'boolean':
                    return value === 'true';
                case 'number':
                    return parseInt(value, 10);
                case 'string':
                default:
                    return value;
            }
        }
        render(settingId, newValue) {
            const setting = this.getSetting(settingId);
            if (!setting) {
                return '';
            }
            return this.renderSetting(setting, newValue);
        }
        viewInSettingsMessage(settingId, alreadyDisplayed) {
            if (alreadyDisplayed) {
                return nls.localize('viewInSettings', "View in Settings");
            }
            else {
                const displayName = (0, settingsTreeModels_1.settingKeyToDisplayFormat)(settingId);
                return nls.localize('viewInSettingsDetailed', "View \"{0}: {1}\" in Settings", displayName.category, displayName.label);
            }
        }
        restorePreviousSettingMessage(settingId) {
            const displayName = (0, settingsTreeModels_1.settingKeyToDisplayFormat)(settingId);
            return nls.localize('restorePreviousValue', "Restore value of \"{0}: {1}\"", displayName.category, displayName.label);
        }
        booleanSettingMessage(setting, booleanValue) {
            const currentValue = this._configurationService.getValue(setting.key);
            if (currentValue === booleanValue || (currentValue === undefined && setting.value === booleanValue)) {
                return undefined;
            }
            const displayName = (0, settingsTreeModels_1.settingKeyToDisplayFormat)(setting.key);
            if (booleanValue) {
                return nls.localize('trueMessage', "Enable \"{0}: {1}\"", displayName.category, displayName.label);
            }
            else {
                return nls.localize('falseMessage', "Disable \"{0}: {1}\"", displayName.category, displayName.label);
            }
        }
        stringSettingMessage(setting, stringValue) {
            const currentValue = this._configurationService.getValue(setting.key);
            if (currentValue === stringValue || (currentValue === undefined && setting.value === stringValue)) {
                return undefined;
            }
            const displayName = (0, settingsTreeModels_1.settingKeyToDisplayFormat)(setting.key);
            return nls.localize('stringValue', "Set \"{0}: {1}\" to \"{2}\"", displayName.category, displayName.label, stringValue);
        }
        numberSettingMessage(setting, numberValue) {
            const currentValue = this._configurationService.getValue(setting.key);
            if (currentValue === numberValue || (currentValue === undefined && setting.value === numberValue)) {
                return undefined;
            }
            const displayName = (0, settingsTreeModels_1.settingKeyToDisplayFormat)(setting.key);
            return nls.localize('numberValue', "Set \"{0}: {1}\" to {2}", displayName.category, displayName.label, numberValue);
        }
        renderSetting(setting, newValue) {
            const href = this.settingToUriString(setting.key, newValue);
            const title = nls.localize('changeSettingTitle', "View or change setting");
            return `<code tabindex="0"><a href="${href}" class="codesetting" title="${title}" aria-role="button"><svg width="14" height="14" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M9.1 4.4L8.6 2H7.4l-.5 2.4-.7.3-2-1.3-.9.8 1.3 2-.2.7-2.4.5v1.2l2.4.5.3.8-1.3 2 .8.8 2-1.3.8.3.4 2.3h1.2l.5-2.4.8-.3 2 1.3.8-.8-1.3-2 .3-.8 2.3-.4V7.4l-2.4-.5-.3-.8 1.3-2-.8-.8-2 1.3-.7-.2zM9.4 1l.5 2.4L12 2.1l2 2-1.4 2.1 2.4.4v2.8l-2.4.5L14 12l-2 2-2.1-1.4-.5 2.4H6.6l-.5-2.4L4 13.9l-2-2 1.4-2.1L1 9.4V6.6l2.4-.5L2.1 4l2-2 2.1 1.4.4-2.4h2.8zm.6 7c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM8 9c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z"/></svg>
			<span class="separator"></span>
			<span class="setting-name">${setting.key}</span>
		</a></code><code>`;
        }
        getSettingMessage(setting, newValue) {
            if (setting.type === 'boolean') {
                return this.booleanSettingMessage(setting, newValue);
            }
            else if (setting.type === 'string') {
                return this.stringSettingMessage(setting, newValue);
            }
            else if (setting.type === 'number') {
                return this.numberSettingMessage(setting, newValue);
            }
            return undefined;
        }
        async restoreSetting(settingId) {
            const userOriginalSettingValue = this._updatedSettings.get(settingId);
            this._updatedSettings.delete(settingId);
            return this._configurationService.updateValue(settingId, userOriginalSettingValue, 2 /* ConfigurationTarget.USER */);
        }
        async setSetting(settingId, currentSettingValue, newSettingValue) {
            this._updatedSettings.set(settingId, currentSettingValue);
            return this._configurationService.updateValue(settingId, newSettingValue, 2 /* ConfigurationTarget.USER */);
        }
        getActions(uri) {
            if (uri.scheme !== network_1.Schemas.codeSetting) {
                return;
            }
            const actions = [];
            const settingId = uri.authority;
            const newSettingValue = this.parseValue(uri.authority, uri.path.substring(1));
            const currentSettingValue = this._configurationService.inspect(settingId).userValue;
            if ((newSettingValue !== undefined) && newSettingValue === currentSettingValue && this._updatedSettings.has(settingId)) {
                const restoreMessage = this.restorePreviousSettingMessage(settingId);
                actions.push({
                    class: undefined,
                    id: 'restoreSetting',
                    enabled: true,
                    tooltip: restoreMessage,
                    label: restoreMessage,
                    run: () => {
                        return this.restoreSetting(settingId);
                    }
                });
            }
            else if (newSettingValue !== undefined) {
                const setting = this.getSetting(settingId);
                const trySettingMessage = setting ? this.getSettingMessage(setting, newSettingValue) : undefined;
                if (setting && trySettingMessage) {
                    actions.push({
                        class: undefined,
                        id: 'trySetting',
                        enabled: currentSettingValue !== newSettingValue,
                        tooltip: trySettingMessage,
                        label: trySettingMessage,
                        run: () => {
                            this.setSetting(settingId, currentSettingValue, newSettingValue);
                        }
                    });
                }
            }
            const viewInSettingsMessage = this.viewInSettingsMessage(settingId, actions.length > 0);
            actions.push({
                class: undefined,
                enabled: true,
                id: 'viewInSettings',
                tooltip: viewInSettingsMessage,
                label: viewInSettingsMessage,
                run: () => {
                    return this._preferencesService.openApplicationSettings({ query: `@id:${settingId}` });
                }
            });
            actions.push({
                class: undefined,
                enabled: true,
                id: 'copySettingId',
                tooltip: nls.localize('copySettingId', "Copy Setting ID"),
                label: nls.localize('copySettingId', "Copy Setting ID"),
                run: () => {
                    this._clipboardService.writeText(settingId);
                }
            });
            return actions;
        }
        showContextMenu(uri, x, y) {
            const actions = this.getActions(uri);
            if (!actions) {
                return;
            }
            this._contextMenuService.showContextMenu({
                getAnchor: () => ({ x, y }),
                getActions: () => actions,
                getActionViewItem: (action) => {
                    return new actionViewItems_1.ActionViewItem(action, action, { label: true });
                },
            });
        }
        async updateSetting(uri, x, y) {
            if (uri.scheme === network_1.Schemas.codeSetting) {
                this._telemetryService.publicLog2('releaseNotesSettingAction', {
                    settingId: uri.authority
                });
                return this.showContextMenu(uri, x, y);
            }
        }
    };
    exports.SimpleSettingRenderer = SimpleSettingRenderer;
    exports.SimpleSettingRenderer = SimpleSettingRenderer = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, contextView_1.IContextMenuService),
        __param(2, preferences_1.IPreferencesService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, clipboardService_1.IClipboardService)
    ], SimpleSettingRenderer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25TZXR0aW5nUmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21hcmtkb3duL2Jyb3dzZXIvbWFya2Rvd25TZXR0aW5nUmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZWhHLE1BQU0sZ0JBQWdCLEdBQUcsa0RBQWtELENBQUM7SUFFckUsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBcUI7UUFNakMsWUFDd0IscUJBQTZELEVBQy9ELG1CQUF5RCxFQUN6RCxtQkFBeUQsRUFDM0QsaUJBQXFELEVBQ3JELGlCQUFxRDtZQUpoQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzlDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDeEMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUMxQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ3BDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFUakUscUJBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQWUsQ0FBQyxDQUFDLDhDQUE4QztZQUN6Rix5QkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBb0IsQ0FBQyxDQUFDLHdCQUF3QjtZQUM1RSxzQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBZSxDQUFDLENBQUMsOEJBQThCO1lBc0MxRSxtQkFBYyxHQUFpQyxTQUFTLENBQUM7WUE3QmhFLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLG1DQUFlLENBQUMsRUFBRSxtQ0FBMkIsQ0FBQztRQUMzRSxDQUFDO1FBRUQsSUFBSSxxQkFBcUI7WUFDeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQW1CLENBQUM7WUFDMUMsS0FBSyxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUss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