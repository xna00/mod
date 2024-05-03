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
define(["require", "exports", "vs/base/browser/fonts", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/config/editorOptions", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/theme", "vs/workbench/services/themes/common/workbenchThemeService"], function (require, exports, fonts_1, event_1, lifecycle_1, editorOptions_1, configuration_1, colorRegistry, theme_1, workbenchThemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewThemeDataProvider = void 0;
    let WebviewThemeDataProvider = class WebviewThemeDataProvider extends lifecycle_1.Disposable {
        constructor(_themeService, _configurationService) {
            super();
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._cachedWebViewThemeData = undefined;
            this._onThemeDataChanged = this._register(new event_1.Emitter());
            this.onThemeDataChanged = this._onThemeDataChanged.event;
            this._register(this._themeService.onDidColorThemeChange(() => {
                this._reset();
            }));
            const webviewConfigurationKeys = ['editor.fontFamily', 'editor.fontWeight', 'editor.fontSize'];
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (webviewConfigurationKeys.some(key => e.affectsConfiguration(key))) {
                    this._reset();
                }
            }));
        }
        getTheme() {
            return this._themeService.getColorTheme();
        }
        getWebviewThemeData() {
            if (!this._cachedWebViewThemeData) {
                const configuration = this._configurationService.getValue('editor');
                const editorFontFamily = configuration.fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
                const editorFontWeight = configuration.fontWeight || editorOptions_1.EDITOR_FONT_DEFAULTS.fontWeight;
                const editorFontSize = configuration.fontSize || editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize;
                const theme = this._themeService.getColorTheme();
                const exportedColors = colorRegistry.getColorRegistry().getColors().reduce((colors, entry) => {
                    const color = theme.getColor(entry.id);
                    if (color) {
                        colors['vscode-' + entry.id.replace('.', '-')] = color.toString();
                    }
                    return colors;
                }, {});
                const styles = {
                    'vscode-font-family': fonts_1.DEFAULT_FONT_FAMILY,
                    'vscode-font-weight': 'normal',
                    'vscode-font-size': '13px',
                    'vscode-editor-font-family': editorFontFamily,
                    'vscode-editor-font-weight': editorFontWeight,
                    'vscode-editor-font-size': editorFontSize + 'px',
                    ...exportedColors
                };
                const activeTheme = ApiThemeClassName.fromTheme(theme);
                this._cachedWebViewThemeData = { styles, activeTheme, themeLabel: theme.label, themeId: theme.settingsId };
            }
            return this._cachedWebViewThemeData;
        }
        _reset() {
            this._cachedWebViewThemeData = undefined;
            this._onThemeDataChanged.fire();
        }
    };
    exports.WebviewThemeDataProvider = WebviewThemeDataProvider;
    exports.WebviewThemeDataProvider = WebviewThemeDataProvider = __decorate([
        __param(0, workbenchThemeService_1.IWorkbenchThemeService),
        __param(1, configuration_1.IConfigurationService)
    ], WebviewThemeDataProvider);
    var ApiThemeClassName;
    (function (ApiThemeClassName) {
        ApiThemeClassName["light"] = "vscode-light";
        ApiThemeClassName["dark"] = "vscode-dark";
        ApiThemeClassName["highContrast"] = "vscode-high-contrast";
        ApiThemeClassName["highContrastLight"] = "vscode-high-contrast-light";
    })(ApiThemeClassName || (ApiThemeClassName = {}));
    (function (ApiThemeClassName) {
        function fromTheme(theme) {
            switch (theme.type) {
                case theme_1.ColorScheme.LIGHT: return ApiThemeClassName.light;
                case theme_1.ColorScheme.DARK: return ApiThemeClassName.dark;
                case theme_1.ColorScheme.HIGH_CONTRAST_DARK: return ApiThemeClassName.highContrast;
                case theme_1.ColorScheme.HIGH_CONTRAST_LIGHT: return ApiThemeClassName.highContrastLight;
            }
        }
        ApiThemeClassName.fromTheme = fromTheme;
    })(ApiThemeClassName || (ApiThemeClassName = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXcvYnJvd3Nlci90aGVtZWluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7UUFPdkQsWUFDeUIsYUFBc0QsRUFDdkQscUJBQTZEO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBSGlDLGtCQUFhLEdBQWIsYUFBYSxDQUF3QjtZQUN0QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBUDdFLDRCQUF1QixHQUFpQyxTQUFTLENBQUM7WUFFekQsd0JBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDM0QsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQztZQVFuRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMscUJBQXFCLENBQUMsR0FBRyxFQUFFO2dCQUM1RCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSx3QkFBd0IsR0FBRyxDQUFDLG1CQUFtQixFQUFFLG1CQUFtQixFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDL0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3RFLElBQUksd0JBQXdCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDdkUsSUFB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