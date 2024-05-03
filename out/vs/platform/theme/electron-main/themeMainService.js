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
define(["require", "exports", "electron", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/state/node/state"], function (require, exports, electron_1, event_1, lifecycle_1, platform_1, configuration_1, instantiation_1, state_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeMainService = exports.IThemeMainService = void 0;
    const DEFAULT_BG_LIGHT = '#FFFFFF';
    const DEFAULT_BG_DARK = '#1E1E1E';
    const DEFAULT_BG_HC_BLACK = '#000000';
    const DEFAULT_BG_HC_LIGHT = '#FFFFFF';
    const THEME_STORAGE_KEY = 'theme';
    const THEME_BG_STORAGE_KEY = 'themeBackground';
    const THEME_WINDOW_SPLASH = 'windowSplash';
    exports.IThemeMainService = (0, instantiation_1.createDecorator)('themeMainService');
    let ThemeMainService = class ThemeMainService extends lifecycle_1.Disposable {
        constructor(stateService, configurationService) {
            super();
            this.stateService = stateService;
            this.configurationService = configurationService;
            this._onDidChangeColorScheme = this._register(new event_1.Emitter());
            this.onDidChangeColorScheme = this._onDidChangeColorScheme.event;
            // System Theme
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.systemColorTheme')) {
                    this.updateSystemColorTheme();
                }
            }));
            this.updateSystemColorTheme();
            // Color Scheme changes
            this._register(event_1.Event.fromNodeEventEmitter(electron_1.nativeTheme, 'updated')(() => this._onDidChangeColorScheme.fire(this.getColorScheme())));
        }
        updateSystemColorTheme() {
            switch (this.configurationService.getValue('window.systemColorTheme')) {
                case 'dark':
                    electron_1.nativeTheme.themeSource = 'dark';
                    break;
                case 'light':
                    electron_1.nativeTheme.themeSource = 'light';
                    break;
                case 'auto':
                    switch (this.getBaseTheme()) {
                        case 'vs':
                            electron_1.nativeTheme.themeSource = 'light';
                            break;
                        case 'vs-dark':
                            electron_1.nativeTheme.themeSource = 'dark';
                            break;
                        default: electron_1.nativeTheme.themeSource = 'system';
                    }
                    break;
                default:
                    electron_1.nativeTheme.themeSource = 'system';
                    break;
            }
        }
        getColorScheme() {
            if (platform_1.isWindows) {
                // high contrast is refelected by the shouldUseInvertedColorScheme property
                if (electron_1.nativeTheme.shouldUseHighContrastColors) {
                    // shouldUseInvertedColorScheme is dark, !shouldUseInvertedColorScheme is light
                    return { dark: electron_1.nativeTheme.shouldUseInvertedColorScheme, highContrast: true };
                }
            }
            else if (platform_1.isMacintosh) {
                // high contrast is set if one of shouldUseInvertedColorScheme or shouldUseHighContrastColors is set, reflecting the 'Invert colours' and `Increase contrast` settings in MacOS
                if (electron_1.nativeTheme.shouldUseInvertedColorScheme || electron_1.nativeTheme.shouldUseHighContrastColors) {
                    return { dark: electron_1.nativeTheme.shouldUseDarkColors, highContrast: true };
                }
            }
            else if (platform_1.isLinux) {
                // ubuntu gnome seems to have 3 states, light dark and high contrast
                if (electron_1.nativeTheme.shouldUseHighContrastColors) {
                    return { dark: true, highContrast: true };
                }
            }
            return {
                dark: electron_1.nativeTheme.shouldUseDarkColors,
                highContrast: false
            };
        }
        getBackgroundColor() {
            const colorScheme = this.getColorScheme();
            if (colorScheme.highContrast && this.configurationService.getValue('window.autoDetectHighContrast')) {
                return colorScheme.dark ? DEFAULT_BG_HC_BLACK : DEFAULT_BG_HC_LIGHT;
            }
            let background = this.stateService.getItem(THEME_BG_STORAGE_KEY, null);
            if (!background) {
                switch (this.getBaseTheme()) {
                    case 'vs':
                        background = DEFAULT_BG_LIGHT;
                        break;
                    case 'hc-black':
                        background = DEFAULT_BG_HC_BLACK;
                        break;
                    case 'hc-light':
                        background = DEFAULT_BG_HC_LIGHT;
                        break;
                    default: background = DEFAULT_BG_DARK;
                }
            }
            if (platform_1.isMacintosh && background.toUpperCase() === DEFAULT_BG_DARK) {
                background = '#171717'; // https://github.com/electron/electron/issues/5150
            }
            return background;
        }
        getBaseTheme() {
            const baseTheme = this.stateService.getItem(THEME_STORAGE_KEY, 'vs-dark').split(' ')[0];
            switch (baseTheme) {
                case 'vs': return 'vs';
                case 'hc-black': return 'hc-black';
                case 'hc-light': return 'hc-light';
                default: return 'vs-dark';
            }
        }
        saveWindowSplash(windowId, splash) {
            // Update in storage
            this.stateService.setItems([
                { key: THEME_STORAGE_KEY, data: splash.baseTheme },
                { key: THEME_BG_STORAGE_KEY, data: splash.colorInfo.background },
                { key: THEME_WINDOW_SPLASH, data: splash }
            ]);
            // Update in opened windows
            if (typeof windowId === 'number') {
                this.updateBackgroundColor(windowId, splash);
            }
            // Update system theme
            this.updateSystemColorTheme();
        }
        updateBackgroundColor(windowId, splash) {
            for (const window of electron_1.BrowserWindow.getAllWindows()) {
                if (window.id === windowId) {
                    window.setBackgroundColor(splash.colorInfo.background);
                    break;
                }
            }
        }
        getWindowSplash() {
            return this.stateService.getItem(THEME_WINDOW_SPLASH);
        }
    };
    exports.ThemeMainService = ThemeMainService;
    exports.ThemeMainService = ThemeMainService = __decorate([
        __param(0, state_1.IStateService),
        __param(1, configuration_1.IConfigurationService)
    ], ThemeMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGhlbWUvZWxlY3Ryb24tbWFpbi90aGVtZU1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVloRyxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztJQUNuQyxNQUFNLGVBQWUsR0FBRyxTQUFTLENBQUM7SUFDbEMsTUFBTSxtQkFBbUIsR0FBRyxTQUFTLENBQUM7SUFDdEMsTUFBTSxtQkFBbUIsR0FBRyxTQUFTLENBQUM7SUFFdEMsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUM7SUFDbEMsTUFBTSxvQkFBb0IsR0FBRyxpQkFBaUIsQ0FBQztJQUMvQyxNQUFNLG1CQUFtQixHQUFHLGNBQWMsQ0FBQztJQUU5QixRQUFBLGlCQUFpQixHQUFHLElBQUEsK0JBQWUsRUFBb0Isa0JBQWtCLENBQUMsQ0FBQztJQWdCakYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSxzQkFBVTtRQU8vQyxZQUEyQixZQUFtQyxFQUF5QixvQkFBbUQ7WUFDekksS0FBSyxFQUFFLENBQUM7WUFEMEIsaUJBQVksR0FBWixZQUFZLENBQWU7WUFBaUMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUh6SCw0QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFnQixDQUFDLENBQUM7WUFDOUUsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQztZQUtwRSxlQUFlO1lBQ2YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3JFLElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLHlCQUF5QixDQUFDLEVBQUUsQ0FBQztvQkFDdkQsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQy9CLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFFOUIsdUJBQXVCO1lBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLG9CQUFvQixDQUFDLHNCQUFXLEVBQUUsU0FBUyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEksQ0FBQztRQUVPLHNCQUFzQjtZQUM3QixRQUFRLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQXdDLHlCQUF5QixDQUFDLEVBQUUsQ0FBQztnQkFDOUcsS0FBSyxNQUFNO29CQUNWLHNCQUFXLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQztvQkFDakMsTUFBTTtnQkFDUCxLQUFLLE9BQU87b0JBQ1gsc0JBQVcsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDO29CQUNsQyxNQUFNO2dCQUNQLEtBQUssTUFBTTtvQkFDVixRQUFRLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDO3dCQUM3QixLQUFLLElBQUk7NEJBQUUsc0JBQVcsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDOzRCQUFDLE1BQU07d0JBQ3BELEtBQUssU0FBUzs0QkFBRSxzQkFBVyxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUM7NEJBQUMsTUFBTTt3QkFDeEQsT0FBTyxDQUFDLENBQUMsc0JBQVcsQ0FBQyxXQUFXLEdBQUcsUUFBUSxDQUFDO29CQUM3QyxDQUFDO29CQUNELE1BQU07Z0JBQ1A7b0JBQ0Msc0JBQVcsQ0FBQyxXQUFXLEdBQUcsUUFBUSxDQUFDO29CQUNuQyxNQUFNO1lBQ1IsQ0FBQztRQUNGLENBQUM7UUFFRCxjQUFjO1lBQ2IsSUFBSSxvQkFBUyxFQUFFLENBQUM7Z0JBQ2YsMkVBQTJFO2dCQUMzRSxJQUFJLHNCQUFXLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztvQkFDN0MsK0VBQStFO29CQUMvRSxPQUFPLEVBQUUsSUFBSSxFQUFFLHNCQUFXLENBQUMsNEJBQTRCLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUMvRSxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxJQUFJLHNCQUFXLEVBQUUsQ0FBQztnQkFDeEIsK0tBQStLO2dCQUMvSyxJQUFJLHNCQUFXLENBQUMsNEJBQTRCLElBQUksc0JBQVcsQ0FBQywyQkFBMkIsRUFBRSxDQUFDO29CQUN6RixPQUFPLEVBQUUsSUFBSSxFQUFFLHNCQUFXLENBQUMsbUJBQW1CLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUN0RSxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxJQUFJLGtCQUFPLEVBQUUsQ0FBQztnQkFDcEIsb0VBQW9FO2dCQUNwRSxJQUFJLHNCQUFXLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztvQkFDN0MsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUMzQyxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU87Z0JBQ04sSUFBSSxFQUFFLHNCQUFXLENBQUMsbUJBQW1CO2dCQUNyQyxZQUFZLEVBQUUsS0FBSzthQUNuQixDQUFDO1FBQ0gsQ0FBQztRQUVELGtCQUFrQjtZQUNqQixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDMUMsSUFBSSxXQUFXLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsK0JBQStCLENBQUMsRUFBRSxDQUFDO2dCQUNyRyxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQztZQUNyRSxDQUFDO1lBRUQsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQWdCLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RGLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDakIsUUFBUSxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQztvQkFDN0IsS0FBSyxJQUFJO3dCQUFFLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQzt3QkFBQyxNQUFNO29CQUNoRCxLQUFLLFVBQVU7d0JBQUUsVUFBVSxHQUFHLG1CQUFtQixDQUFDO3dCQUFDLE1BQU07b0JBQ3pELEtBQUssVUFBVTt3QkFBRSxVQUFVLEdBQUcsbUJBQW1CLENBQUM7d0JBQUMsTUFBTTtvQkFDekQsT0FBTyxDQUFDLENBQUMsVUFBVSxHQUFHLGVBQWUsQ0FBQztnQkFDdkMsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLHNCQUFXLElBQUksVUFBVSxDQUFDLFdBQVcsRUFBRSxLQUFLLGVBQWUsRUFBRSxDQUFDO2dCQUNqRSxVQUFVLEdBQUcsU0FBUyxDQUFDLENBQUMsbURBQW1EO1lBQzVFLENBQUM7WUFFRCxPQUFPLFVBQVUsQ0FBQztRQUNuQixDQUFDO1FBRU8sWUFBWTtZQUNuQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBUyxpQkFBaUIsRUFBRSxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEcsUUFBUSxTQUFTLEVBQUUsQ0FBQztnQkFDbkIsS0FBSyxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQztnQkFDdkIsS0FBSyxVQUFVLENBQUMsQ0FBQyxPQUFPLFVBQVUsQ0FBQztnQkFDbkMsS0FBSyxVQUFVLENBQUMsQ0FBQyxPQUFPLFVBQVUsQ0FBQztnQkFDbkMsT0FBTyxDQUFDLENBQUMsT0FBTyxTQUFTLENBQUM7WUFDM0IsQ0FBQztRQUNGLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxRQUE0QixFQUFFLE1BQW9CO1lBRWxFLG9CQUFvQjtZQUNwQixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQztnQkFDMUIsRUFBRSxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUU7Z0JBQ2xELEVBQUUsR0FBRyxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRTtnQkFDaEUsRUFBRSxHQUFHLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTthQUMxQyxDQUFDLENBQUM7WUFFSCwyQkFBMkI7WUFDM0IsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM5QyxDQUFDO1lBRUQsc0JBQXNCO1lBQ3RCLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxRQUFnQixFQUFFLE1BQW9CO1lBQ25FLEtBQUssTUFBTSxNQUFNLElBQUksd0JBQWEsQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDO2dCQUNwRCxJQUFJLE1BQU0sQ0FBQyxFQUFFLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQzVCLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUN2RCxNQUFNO2dCQUNQLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVELGVBQWU7WUFDZCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFlLG1CQUFtQixDQUFDLENBQUM7UUFDckUsQ0FBQztLQUNELENBQUE7SUFsSVksNENBQWdCOytCQUFoQixnQkFBZ0I7UUFPZixXQUFBLHFCQUFhLENBQUE7UUFBdUMsV0FBQSxxQ0FBcUIsQ0FBQTtPQVAxRSxnQkFBZ0IsQ0FrSTVCIn0=