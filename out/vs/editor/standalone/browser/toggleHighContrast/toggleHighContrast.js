/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/standalone/common/standaloneTheme", "vs/editor/common/standaloneStrings", "vs/platform/theme/common/theme", "vs/editor/standalone/browser/standaloneThemeService"], function (require, exports, editorExtensions_1, standaloneTheme_1, standaloneStrings_1, theme_1, standaloneThemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ToggleHighContrast extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.toggleHighContrast',
                label: standaloneStrings_1.ToggleHighContrastNLS.toggleHighContrast,
                alias: 'Toggle High Contrast Theme',
                precondition: undefined
            });
            this._originalThemeName = null;
        }
        run(accessor, editor) {
            const standaloneThemeService = accessor.get(standaloneTheme_1.IStandaloneThemeService);
            const currentTheme = standaloneThemeService.getColorTheme();
            if ((0, theme_1.isHighContrast)(currentTheme.type)) {
                // We must toggle back to the integrator's theme
                standaloneThemeService.setTheme(this._originalThemeName || ((0, theme_1.isDark)(currentTheme.type) ? standaloneThemeService_1.VS_DARK_THEME_NAME : standaloneThemeService_1.VS_LIGHT_THEME_NAME));
                this._originalThemeName = null;
            }
            else {
                standaloneThemeService.setTheme((0, theme_1.isDark)(currentTheme.type) ? standaloneThemeService_1.HC_BLACK_THEME_NAME : standaloneThemeService_1.HC_LIGHT_THEME_NAME);
                this._originalThemeName = currentTheme.themeName;
            }
        }
    }
    (0, editorExtensions_1.registerEditorAction)(ToggleHighContrast);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlSGlnaENvbnRyYXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3Ivc3RhbmRhbG9uZS9icm93c2VyL3RvZ2dsZUhpZ2hDb250cmFzdC90b2dnbGVIaWdoQ29udHJhc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsTUFBTSxrQkFBbUIsU0FBUSwrQkFBWTtRQUk1QztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsa0NBQWtDO2dCQUN0QyxLQUFLLEVBQUUseUNBQXFCLENBQUMsa0JBQWtCO2dCQUMvQyxLQUFLLEVBQUUsNEJBQTRCO2dCQUNuQyxZQUFZLEVBQUUsU0FBUzthQUN2QixDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1FBQ2hDLENBQUM7UUFFTSxHQUFHLENBQUMsUUFBMEIsRUFBRSxNQUFtQjtZQUN6RCxNQUFNLHNCQUFzQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMseUNBQXVCLENBQUMsQ0FBQztZQUNyRSxNQUFNLFlBQVksR0FBRyxzQkFBc0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM1RCxJQUFJLElBQUEsc0JBQWMsRUFBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDdkMsZ0RBQWdEO2dCQUNoRCxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGtCQUFrQixJQUFJLENBQUMsSUFBQSxjQUFNLEVBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQywyQ0FBa0IsQ0FBQyxDQUFDLENBQUMsNENBQW1CLENBQUMsQ0FBQyxDQUFDO2dCQUNuSSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1lBQ2hDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsSUFBQSxjQUFNLEVBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyw0Q0FBbUIsQ0FBQyxDQUFDLENBQUMsNENBQW1CLENBQUMsQ0FBQztnQkFDdkcsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUM7WUFDbEQsQ0FBQztRQUNGLENBQUM7S0FDRDtJQUVELElBQUEsdUNBQW9CLEVBQUMsa0JBQWtCLENBQUMsQ0FBQyJ9