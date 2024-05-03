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
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/network", "vs/base/common/uri", "vs/nls", "vs/platform/theme/common/iconRegistry", "vs/workbench/common/editor/editorInput", "vs/workbench/services/preferences/common/preferences"], function (require, exports, codicons_1, network_1, uri_1, nls, iconRegistry_1, editorInput_1, preferences_1) {
    "use strict";
    var SettingsEditor2Input_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsEditor2Input = void 0;
    const SettingsEditorIcon = (0, iconRegistry_1.registerIcon)('settings-editor-label-icon', codicons_1.Codicon.settings, nls.localize('settingsEditorLabelIcon', 'Icon of the settings editor label.'));
    let SettingsEditor2Input = class SettingsEditor2Input extends editorInput_1.EditorInput {
        static { SettingsEditor2Input_1 = this; }
        static { this.ID = 'workbench.input.settings2'; }
        constructor(_preferencesService) {
            super();
            this.resource = uri_1.URI.from({
                scheme: network_1.Schemas.vscodeSettings,
                path: `settingseditor`
            });
            this._settingsModel = _preferencesService.createSettings2EditorModel();
        }
        matches(otherInput) {
            return super.matches(otherInput) || otherInput instanceof SettingsEditor2Input_1;
        }
        get typeId() {
            return SettingsEditor2Input_1.ID;
        }
        getName() {
            return nls.localize('settingsEditor2InputName', "Settings");
        }
        getIcon() {
            return SettingsEditorIcon;
        }
        async resolve() {
            return this._settingsModel;
        }
        dispose() {
            this._settingsModel.dispose();
            super.dispose();
        }
    };
    exports.SettingsEditor2Input = SettingsEditor2Input;
    exports.SettingsEditor2Input = SettingsEditor2Input = SettingsEditor2Input_1 = __decorate([
        __param(0, preferences_1.IPreferencesService)
    ], SettingsEditor2Input);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3ByZWZlcmVuY2VzL2NvbW1vbi9wcmVmZXJlbmNlc0VkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFhaEcsTUFBTSxrQkFBa0IsR0FBRyxJQUFBLDJCQUFZLEVBQUMsNEJBQTRCLEVBQUUsa0JBQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDLENBQUM7SUFFaEssSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSx5QkFBVzs7aUJBRXBDLE9BQUUsR0FBVywyQkFBMkIsQUFBdEMsQ0FBdUM7UUFRekQsWUFDc0IsbUJBQXdDO1lBRTdELEtBQUssRUFBRSxDQUFDO1lBUkEsYUFBUSxHQUFRLFNBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ2pDLE1BQU0sRUFBRSxpQkFBTyxDQUFDLGNBQWM7Z0JBQzlCLElBQUksRUFBRSxnQkFBZ0I7YUFDdEIsQ0FBQyxDQUFDO1lBT0YsSUFBSSxDQUFDLGNBQWMsR0FBRyxtQkFBbUIsQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1FBQ3hFLENBQUM7UUFFUSxPQUFPLENBQUMsVUFBNkM7WUFDN0QsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLFVBQVUsWUFBWSxzQkFBb0IsQ0FBQztRQUNoRixDQUFDO1FBRUQsSUFBYSxNQUFNO1lBQ2xCLE9BQU8sc0JBQW9CLENBQUMsRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFFUSxPQUFPO1lBQ2YsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLDBCQUEwQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFUSxPQUFPO1lBQ2YsT0FBTyxrQkFBa0IsQ0FBQztRQUMzQixDQUFDO1FBRVEsS0FBSyxDQUFDLE9BQU87WUFDckIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQzVCLENBQUM7UUFFUSxPQUFPO1lBQ2YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUU5QixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQzs7SUExQ1csb0RBQW9CO21DQUFwQixvQkFBb0I7UUFXOUIsV0FBQSxpQ0FBbUIsQ0FBQTtPQVhULG9CQUFvQixDQTJDaEMifQ==