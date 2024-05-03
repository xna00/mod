/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/nls", "vs/workbench/services/themes/common/workbenchThemeService"], function (require, exports, strings_1, nls_1, workbenchThemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = () => `
<checklist>
	<div class="theme-picker-row">
		<checkbox when-checked="setTheme:${workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK}" checked-on="config.workbench.colorTheme == '${workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK}'">
			<img width="200" src="./dark.png"/>
			${(0, strings_1.escape)((0, nls_1.localize)('dark', "Dark Modern"))}
		</checkbox>
		<checkbox when-checked="setTheme:${workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT}" checked-on="config.workbench.colorTheme == '${workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT}'">
			<img width="200" src="./light.png"/>
			${(0, strings_1.escape)((0, nls_1.localize)('light', "Light Modern"))}
		</checkbox>
	</div>
	<div class="theme-picker-row">
		<checkbox when-checked="setTheme:${workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_HC_DARK}" checked-on="config.workbench.colorTheme == '${workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_HC_DARK}'">
			<img width="200" src="./dark-hc.png"/>
			${(0, strings_1.escape)((0, nls_1.localize)('HighContrast', "Dark High Contrast"))}
		</checkbox>
		<checkbox when-checked="setTheme:${workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_HC_LIGHT}" checked-on="config.workbench.colorTheme == '${workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_HC_LIGHT}'">
			<img width="200" src="./light-hc.png"/>
			${(0, strings_1.escape)((0, nls_1.localize)('HighContrastLight', "Light High Contrast"))}
		</checkbox>
	</div>
</checklist>
<checkbox class="theme-picker-link" when-checked="command:workbench.action.selectTheme" checked-on="false">
	${(0, strings_1.escape)((0, nls_1.localize)('seeMore', "See More Themes..."))}
</checkbox>
`;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVfcGlja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWxjb21lR2V0dGluZ1N0YXJ0ZWQvY29tbW9uL21lZGlhL3RoZW1lX3BpY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxrQkFBZSxHQUFHLEVBQUUsQ0FBQzs7O3FDQUdnQiw0Q0FBb0IsQ0FBQyxnQkFBZ0IsaURBQWlELDRDQUFvQixDQUFDLGdCQUFnQjs7S0FFM0osSUFBQSxnQkFBTSxFQUFDLElBQUEsY0FBUSxFQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQzs7cUNBRVAsNENBQW9CLENBQUMsaUJBQWlCLGlEQUFpRCw0Q0FBb0IsQ0FBQyxpQkFBaUI7O0tBRTdKLElBQUEsZ0JBQU0sRUFBQyxJQUFBLGNBQVEsRUFBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUM7Ozs7cUNBSVQsNENBQW9CLENBQUMsbUJBQW1CLGlEQUFpRCw0Q0FBb0IsQ0FBQyxtQkFBbUI7O0tBRWpLLElBQUEsZ0JBQU0sRUFBQyxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsb0JBQW9CLENBQUMsQ0FBQzs7cUNBRXRCLDRDQUFvQixDQUFDLG9CQUFvQixpREFBaUQsNENBQW9CLENBQUMsb0JBQW9COztLQUVuSyxJQUFBLGdCQUFNLEVBQUMsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUscUJBQXFCLENBQUMsQ0FBQzs7Ozs7R0FLOUQsSUFBQSxnQkFBTSxFQUFDLElBQUEsY0FBUSxFQUFDLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDOztDQUVuRCxDQUFDIn0=