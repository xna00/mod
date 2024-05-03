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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/keyboardLayout/common/keyboardLayout", "vs/base/common/event", "vs/base/common/platform", "vs/platform/keyboardLayout/common/keyboardMapper", "vs/workbench/services/keybinding/common/windowsKeyboardMapper", "vs/workbench/services/keybinding/common/fallbackKeyboardMapper", "vs/workbench/services/keybinding/common/macLinuxKeyboardMapper", "vs/platform/keyboardLayout/common/keyboardConfig", "vs/platform/configuration/common/configuration", "vs/workbench/services/keybinding/electron-sandbox/nativeKeyboardLayoutService", "vs/platform/instantiation/common/extensions"], function (require, exports, lifecycle_1, keyboardLayout_1, event_1, platform_1, keyboardMapper_1, windowsKeyboardMapper_1, fallbackKeyboardMapper_1, macLinuxKeyboardMapper_1, keyboardConfig_1, configuration_1, nativeKeyboardLayoutService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyboardLayoutService = void 0;
    let KeyboardLayoutService = class KeyboardLayoutService extends lifecycle_1.Disposable {
        constructor(_nativeKeyboardLayoutService, _configurationService) {
            super();
            this._nativeKeyboardLayoutService = _nativeKeyboardLayoutService;
            this._configurationService = _configurationService;
            this._onDidChangeKeyboardLayout = this._register(new event_1.Emitter());
            this.onDidChangeKeyboardLayout = this._onDidChangeKeyboardLayout.event;
            this._keyboardMapper = null;
            this._register(this._nativeKeyboardLayoutService.onDidChangeKeyboardLayout(async () => {
                this._keyboardMapper = null;
                this._onDidChangeKeyboardLayout.fire();
            }));
            this._register(_configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration('keyboard')) {
                    this._keyboardMapper = null;
                    this._onDidChangeKeyboardLayout.fire();
                }
            }));
        }
        getRawKeyboardMapping() {
            return this._nativeKeyboardLayoutService.getRawKeyboardMapping();
        }
        getCurrentKeyboardLayout() {
            return this._nativeKeyboardLayoutService.getCurrentKeyboardLayout();
        }
        getAllKeyboardLayouts() {
            return [];
        }
        getKeyboardMapper() {
            const config = (0, keyboardConfig_1.readKeyboardConfig)(this._configurationService);
            if (config.dispatch === 1 /* DispatchConfig.KeyCode */) {
                // Forcefully set to use keyCode
                return new fallbackKeyboardMapper_1.FallbackKeyboardMapper(config.mapAltGrToCtrlAlt, platform_1.OS);
            }
            if (!this._keyboardMapper) {
                this._keyboardMapper = new keyboardMapper_1.CachedKeyboardMapper(createKeyboardMapper(this.getCurrentKeyboardLayout(), this.getRawKeyboardMapping(), config.mapAltGrToCtrlAlt));
            }
            return this._keyboardMapper;
        }
        validateCurrentKeyboardMapping(keyboardEvent) {
            return;
        }
    };
    exports.KeyboardLayoutService = KeyboardLayoutService;
    exports.KeyboardLayoutService = KeyboardLayoutService = __decorate([
        __param(0, nativeKeyboardLayoutService_1.INativeKeyboardLayoutService),
        __param(1, configuration_1.IConfigurationService)
    ], KeyboardLayoutService);
    function createKeyboardMapper(layoutInfo, rawMapping, mapAltGrToCtrlAlt) {
        const _isUSStandard = isUSStandard(layoutInfo);
        if (platform_1.OS === 1 /* OperatingSystem.Windows */) {
            return new windowsKeyboardMapper_1.WindowsKeyboardMapper(_isUSStandard, rawMapping, mapAltGrToCtrlAlt);
        }
        if (!rawMapping || Object.keys(rawMapping).length === 0) {
            // Looks like reading the mappings failed (most likely Mac + Japanese/Chinese keyboard layouts)
            return new fallbackKeyboardMapper_1.FallbackKeyboardMapper(mapAltGrToCtrlAlt, platform_1.OS);
        }
        if (platform_1.OS === 2 /* OperatingSystem.Macintosh */) {
            const kbInfo = layoutInfo;
            if (kbInfo.id === 'com.apple.keylayout.DVORAK-QWERTYCMD') {
                // Use keyCode based dispatching for DVORAK - QWERTY ⌘
                return new fallbackKeyboardMapper_1.FallbackKeyboardMapper(mapAltGrToCtrlAlt, platform_1.OS);
            }
        }
        return new macLinuxKeyboardMapper_1.MacLinuxKeyboardMapper(_isUSStandard, rawMapping, mapAltGrToCtrlAlt, platform_1.OS);
    }
    function isUSStandard(_kbInfo) {
        if (!_kbInfo) {
            return false;
        }
        if (platform_1.OS === 3 /* OperatingSystem.Linux */) {
            const kbInfo = _kbInfo;
            const layouts = kbInfo.layout.split(/,/g);
            return (layouts[kbInfo.group] === 'us');
        }
        if (platform_1.OS === 2 /* OperatingSystem.Macintosh */) {
            const kbInfo = _kbInfo;
            return (kbInfo.id === 'com.apple.keylayout.US');
        }
        if (platform_1.OS === 1 /* OperatingSystem.Windows */) {
            const kbInfo = _kbInfo;
            return (kbInfo.name === '00000409');
        }
        return false;
    }
    (0, extensions_1.registerSingleton)(keyboardLayout_1.IKeyboardLayoutService, KeyboardLayoutService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlS2V5Ym9hcmRMYXlvdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9rZXliaW5kaW5nL2VsZWN0cm9uLXNhbmRib3gvbmF0aXZlS2V5Ym9hcmRMYXlvdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0J6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO1FBU3BELFlBQytCLDRCQUEyRSxFQUNsRixxQkFBNkQ7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFIdUMsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUE4QjtZQUNqRSwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBUHBFLCtCQUEwQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3pFLDhCQUF5QixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUM7WUFTMUUsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFFNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMseUJBQXlCLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ3JGLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO2dCQUM1QixJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN6RSxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO29CQUN4QyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztvQkFDNUIsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN4QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTSxxQkFBcUI7WUFDM0IsT0FBTyxJQUFJLENBQUMsNEJBQTRCLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUNsRSxDQUFDO1FBRU0sd0JBQXdCO1lBQzlCLE9BQU8sSUFBSSxDQUFDLDRCQUE0QixDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFDckUsQ0FBQztRQUVNLHFCQUFxQjtZQUMzQixPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFTSxpQkFBaUI7WUFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBQSxtQ0FBa0IsRUFBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUM5RCxJQUFJLE1BQU0sQ0FBQyxRQUFRLG1DQUEyQixFQUFFLENBQUM7Z0JBQ2hELGdDQUFnQztnQkFDaEMsT0FBTyxJQUFJLCtDQUFzQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxhQUFFLENBQUMsQ0FBQztZQUNqRSxDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLHFDQUFvQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxFQUFFLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDaEssQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM3QixDQUFDO1FBRU0sOEJBQThCLENBQUMsYUFBNkI7WUFDbEUsT0FBTztRQUNSLENBQUM7S0FDRCxDQUFBO0lBeERZLHNEQUFxQjtvQ0FBckIscUJBQXFCO1FBVS9CLFdBQUEsMERBQTRCLENBQUE7UUFDNUIsV0FBQSxxQ0FBcUIsQ0FBQTtPQVhYLHFCQUFxQixDQXdEakM7SUFFRCxTQUFTLG9CQUFvQixDQUFDLFVBQXNDLEVBQUUsVUFBbUMsRUFBRSxpQkFBMEI7UUFDcEksTUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9DLElBQUksYUFBRSxvQ0FBNEIsRUFBRSxDQUFDO1lBQ3BDLE9BQU8sSUFBSSw2Q0FBcUIsQ0FBQyxhQUFhLEVBQTJCLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3pHLENBQUM7UUFFRCxJQUFJLENBQUMsVUFBVSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3pELCtGQUErRjtZQUMvRixPQUFPLElBQUksK0NBQXNCLENBQUMsaUJBQWlCLEVBQUUsYUFBRSxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVELElBQUksYUFBRSxzQ0FBOEIsRUFBRSxDQUFDO1lBQ3RDLE1BQU0sTUFBTSxHQUEyQixVQUFVLENBQUM7WUFDbEQsSUFBSSxNQUFNLENBQUMsRUFBRSxLQUFLLHNDQUFzQyxFQUFFLENBQUM7Z0JBQzFELHNEQUFzRDtnQkFDdEQsT0FBTyxJQUFJLCtDQUFzQixDQUFDLGlCQUFpQixFQUFFLGFBQUUsQ0FBQyxDQUFDO1lBQzFELENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxJQUFJLCtDQUFzQixDQUFDLGFBQWEsRUFBNEIsVUFBVSxFQUFFLGlCQUFpQixFQUFFLGFBQUUsQ0FBQyxDQUFDO0lBQy9HLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBQyxPQUFtQztRQUN4RCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDZCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxJQUFJLGFBQUUsa0NBQTBCLEVBQUUsQ0FBQztZQUNsQyxNQUFNLE1BQU0sR0FBNkIsT0FBTyxDQUFDO1lBQ2pELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFRCxJQUFJLGFBQUUsc0NBQThCLEVBQUUsQ0FBQztZQUN0QyxNQUFNLE1BQU0sR0FBMkIsT0FBTyxDQUFDO1lBQy9DLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLHdCQUF3QixDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVELElBQUksYUFBRSxvQ0FBNEIsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sTUFBTSxHQUErQixPQUFPLENBQUM7WUFDbkQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssVUFBVSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUVELElBQUEsOEJBQWlCLEVBQUMsdUNBQXNCLEVBQUUscUJBQXFCLG9DQUE0QixDQUFDIn0=