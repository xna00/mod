/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/browser", "vs/base/common/color", "vs/base/common/event", "vs/editor/common/languages", "vs/editor/common/encodedTokenAttributes", "vs/editor/common/languages/supports/tokenization", "vs/editor/standalone/common/themes", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/base/common/lifecycle", "vs/platform/theme/common/theme", "vs/platform/theme/browser/iconsStyleSheet", "vs/base/browser/window"], function (require, exports, dom, browser_1, color_1, event_1, languages_1, encodedTokenAttributes_1, tokenization_1, themes_1, platform_1, colorRegistry_1, themeService_1, lifecycle_1, theme_1, iconsStyleSheet_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandaloneThemeService = exports.HC_LIGHT_THEME_NAME = exports.HC_BLACK_THEME_NAME = exports.VS_DARK_THEME_NAME = exports.VS_LIGHT_THEME_NAME = void 0;
    exports.VS_LIGHT_THEME_NAME = 'vs';
    exports.VS_DARK_THEME_NAME = 'vs-dark';
    exports.HC_BLACK_THEME_NAME = 'hc-black';
    exports.HC_LIGHT_THEME_NAME = 'hc-light';
    const colorRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
    const themingRegistry = platform_1.Registry.as(themeService_1.Extensions.ThemingContribution);
    class StandaloneTheme {
        constructor(name, standaloneThemeData) {
            this.semanticHighlighting = false;
            this.themeData = standaloneThemeData;
            const base = standaloneThemeData.base;
            if (name.length > 0) {
                if (isBuiltinTheme(name)) {
                    this.id = name;
                }
                else {
                    this.id = base + ' ' + name;
                }
                this.themeName = name;
            }
            else {
                this.id = base;
                this.themeName = base;
            }
            this.colors = null;
            this.defaultColors = Object.create(null);
            this._tokenTheme = null;
        }
        get label() {
            return this.themeName;
        }
        get base() {
            return this.themeData.base;
        }
        notifyBaseUpdated() {
            if (this.themeData.inherit) {
                this.colors = null;
                this._tokenTheme = null;
            }
        }
        getColors() {
            if (!this.colors) {
                const colors = new Map();
                for (const id in this.themeData.colors) {
                    colors.set(id, color_1.Color.fromHex(this.themeData.colors[id]));
                }
                if (this.themeData.inherit) {
                    const baseData = getBuiltinRules(this.themeData.base);
                    for (const id in baseData.colors) {
                        if (!colors.has(id)) {
                            colors.set(id, color_1.Color.fromHex(baseData.colors[id]));
                        }
                    }
                }
                this.colors = colors;
            }
            return this.colors;
        }
        getColor(colorId, useDefault) {
            const color = this.getColors().get(colorId);
            if (color) {
                return color;
            }
            if (useDefault !== false) {
                return this.getDefault(colorId);
            }
            return undefined;
        }
        getDefault(colorId) {
            let color = this.defaultColors[colorId];
            if (color) {
                return color;
            }
            color = colorRegistry.resolveDefaultColor(colorId, this);
            this.defaultColors[colorId] = color;
            return color;
        }
        defines(colorId) {
            return this.getColors().has(colorId);
        }
        get type() {
            switch (this.base) {
                case exports.VS_LIGHT_THEME_NAME: return theme_1.ColorScheme.LIGHT;
                case exports.HC_BLACK_THEME_NAME: return theme_1.ColorScheme.HIGH_CONTRAST_DARK;
                case exports.HC_LIGHT_THEME_NAME: return theme_1.ColorScheme.HIGH_CONTRAST_LIGHT;
                default: return theme_1.ColorScheme.DARK;
            }
        }
        get tokenTheme() {
            if (!this._tokenTheme) {
                let rules = [];
                let encodedTokensColors = [];
                if (this.themeData.inherit) {
                    const baseData = getBuiltinRules(this.themeData.base);
                    rules = baseData.rules;
                    if (baseData.encodedTokensColors) {
                        encodedTokensColors = baseData.encodedTokensColors;
                    }
                }
                // Pick up default colors from `editor.foreground` and `editor.background` if available
                const editorForeground = this.themeData.colors['editor.foreground'];
                const editorBackground = this.themeData.colors['editor.background'];
                if (editorForeground || editorBackground) {
                    const rule = { token: '' };
                    if (editorForeground) {
                        rule.foreground = editorForeground;
                    }
                    if (editorBackground) {
                        rule.background = editorBackground;
                    }
                    rules.push(rule);
                }
                rules = rules.concat(this.themeData.rules);
                if (this.themeData.encodedTokensColors) {
                    encodedTokensColors = this.themeData.encodedTokensColors;
                }
                this._tokenTheme = tokenization_1.TokenTheme.createFromRawTokenTheme(rules, encodedTokensColors);
            }
            return this._tokenTheme;
        }
        getTokenStyleMetadata(type, modifiers, modelLanguage) {
            // use theme rules match
            const style = this.tokenTheme._match([type].concat(modifiers).join('.'));
            const metadata = style.metadata;
            const foreground = encodedTokenAttributes_1.TokenMetadata.getForeground(metadata);
            const fontStyle = encodedTokenAttributes_1.TokenMetadata.getFontStyle(metadata);
            return {
                foreground: foreground,
                italic: Boolean(fontStyle & 1 /* FontStyle.Italic */),
                bold: Boolean(fontStyle & 2 /* FontStyle.Bold */),
                underline: Boolean(fontStyle & 4 /* FontStyle.Underline */),
                strikethrough: Boolean(fontStyle & 8 /* FontStyle.Strikethrough */)
            };
        }
        get tokenColorMap() {
            return [];
        }
    }
    function isBuiltinTheme(themeName) {
        return (themeName === exports.VS_LIGHT_THEME_NAME
            || themeName === exports.VS_DARK_THEME_NAME
            || themeName === exports.HC_BLACK_THEME_NAME
            || themeName === exports.HC_LIGHT_THEME_NAME);
    }
    function getBuiltinRules(builtinTheme) {
        switch (builtinTheme) {
            case exports.VS_LIGHT_THEME_NAME:
                return themes_1.vs;
            case exports.VS_DARK_THEME_NAME:
                return themes_1.vs_dark;
            case exports.HC_BLACK_THEME_NAME:
                return themes_1.hc_black;
            case exports.HC_LIGHT_THEME_NAME:
                return themes_1.hc_light;
        }
    }
    function newBuiltInTheme(builtinTheme) {
        const themeData = getBuiltinRules(builtinTheme);
        return new StandaloneTheme(builtinTheme, themeData);
    }
    class StandaloneThemeService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onColorThemeChange = this._register(new event_1.Emitter());
            this.onDidColorThemeChange = this._onColorThemeChange.event;
            this._onFileIconThemeChange = this._register(new event_1.Emitter());
            this.onDidFileIconThemeChange = this._onFileIconThemeChange.event;
            this._onProductIconThemeChange = this._register(new event_1.Emitter());
            this.onDidProductIconThemeChange = this._onProductIconThemeChange.event;
            this._environment = Object.create(null);
            this._builtInProductIconTheme = new iconsStyleSheet_1.UnthemedProductIconTheme();
            this._autoDetectHighContrast = true;
            this._knownThemes = new Map();
            this._knownThemes.set(exports.VS_LIGHT_THEME_NAME, newBuiltInTheme(exports.VS_LIGHT_THEME_NAME));
            this._knownThemes.set(exports.VS_DARK_THEME_NAME, newBuiltInTheme(exports.VS_DARK_THEME_NAME));
            this._knownThemes.set(exports.HC_BLACK_THEME_NAME, newBuiltInTheme(exports.HC_BLACK_THEME_NAME));
            this._knownThemes.set(exports.HC_LIGHT_THEME_NAME, newBuiltInTheme(exports.HC_LIGHT_THEME_NAME));
            const iconsStyleSheet = this._register((0, iconsStyleSheet_1.getIconsStyleSheet)(this));
            this._codiconCSS = iconsStyleSheet.getCSS();
            this._themeCSS = '';
            this._allCSS = `${this._codiconCSS}\n${this._themeCSS}`;
            this._globalStyleElement = null;
            this._styleElements = [];
            this._colorMapOverride = null;
            this.setTheme(exports.VS_LIGHT_THEME_NAME);
            this._onOSSchemeChanged();
            this._register(iconsStyleSheet.onDidChange(() => {
                this._codiconCSS = iconsStyleSheet.getCSS();
                this._updateCSS();
            }));
            (0, browser_1.addMatchMediaChangeListener)(window_1.mainWindow, '(forced-colors: active)', () => {
                this._onOSSchemeChanged();
            });
        }
        registerEditorContainer(domNode) {
            if (dom.isInShadowDOM(domNode)) {
                return this._registerShadowDomContainer(domNode);
            }
            return this._registerRegularEditorContainer();
        }
        _registerRegularEditorContainer() {
            if (!this._globalStyleElement) {
                this._globalStyleElement = dom.createStyleSheet(undefined, style => {
                    style.className = 'monaco-colors';
                    style.textContent = this._allCSS;
                });
                this._styleElements.push(this._globalStyleElement);
            }
            return lifecycle_1.Disposable.None;
        }
        _registerShadowDomContainer(domNode) {
            const styleElement = dom.createStyleSheet(domNode, style => {
                style.className = 'monaco-colors';
                style.textContent = this._allCSS;
            });
            this._styleElements.push(styleElement);
            return {
                dispose: () => {
                    for (let i = 0; i < this._styleElements.length; i++) {
                        if (this._styleElements[i] === styleElement) {
                            this._styleElements.splice(i, 1);
                            return;
                        }
                    }
                }
            };
        }
        defineTheme(themeName, themeData) {
            if (!/^[a-z0-9\-]+$/i.test(themeName)) {
                throw new Error('Illegal theme name!');
            }
            if (!isBuiltinTheme(themeData.base) && !isBuiltinTheme(themeName)) {
                throw new Error('Illegal theme base!');
            }
            // set or replace theme
            this._knownThemes.set(themeName, new StandaloneTheme(themeName, themeData));
            if (isBuiltinTheme(themeName)) {
                this._knownThemes.forEach(theme => {
                    if (theme.base === themeName) {
                        theme.notifyBaseUpdated();
                    }
                });
            }
            if (this._theme.themeName === themeName) {
                this.setTheme(themeName); // refresh theme
            }
        }
        getColorTheme() {
            return this._theme;
        }
        setColorMapOverride(colorMapOverride) {
            this._colorMapOverride = colorMapOverride;
            this._updateThemeOrColorMap();
        }
        setTheme(themeName) {
            let theme;
            if (this._knownThemes.has(themeName)) {
                theme = this._knownThemes.get(themeName);
            }
            else {
                theme = this._knownThemes.get(exports.VS_LIGHT_THEME_NAME);
            }
            this._updateActualTheme(theme);
        }
        _updateActualTheme(desiredTheme) {
            if (!desiredTheme || this._theme === desiredTheme) {
                // Nothing to do
                return;
            }
            this._theme = desiredTheme;
            this._updateThemeOrColorMap();
        }
        _onOSSchemeChanged() {
            if (this._autoDetectHighContrast) {
                const wantsHighContrast = window_1.mainWindow.matchMedia(`(forced-colors: active)`).matches;
                if (wantsHighContrast !== (0, theme_1.isHighContrast)(this._theme.type)) {
                    // switch to high contrast or non-high contrast but stick to dark or light
                    let newThemeName;
                    if ((0, theme_1.isDark)(this._theme.type)) {
                        newThemeName = wantsHighContrast ? exports.HC_BLACK_THEME_NAME : exports.VS_DARK_THEME_NAME;
                    }
                    else {
                        newThemeName = wantsHighContrast ? exports.HC_LIGHT_THEME_NAME : exports.VS_LIGHT_THEME_NAME;
                    }
                    this._updateActualTheme(this._knownThemes.get(newThemeName));
                }
            }
        }
        setAutoDetectHighContrast(autoDetectHighContrast) {
            this._autoDetectHighContrast = autoDetectHighContrast;
            this._onOSSchemeChanged();
        }
        _updateThemeOrColorMap() {
            const cssRules = [];
            const hasRule = {};
            const ruleCollector = {
                addRule: (rule) => {
                    if (!hasRule[rule]) {
                        cssRules.push(rule);
                        hasRule[rule] = true;
                    }
                }
            };
            themingRegistry.getThemingParticipants().forEach(p => p(this._theme, ruleCollector, this._environment));
            const colorVariables = [];
            for (const item of colorRegistry.getColors()) {
                const color = this._theme.getColor(item.id, true);
                if (color) {
                    colorVariables.push(`${(0, colorRegistry_1.asCssVariableName)(item.id)}: ${color.toString()};`);
                }
            }
            ruleCollector.addRule(`.monaco-editor, .monaco-diff-editor, .monaco-component { ${colorVariables.join('\n')} }`);
            const colorMap = this._colorMapOverride || this._theme.tokenTheme.getColorMap();
            ruleCollector.addRule((0, tokenization_1.generateTokensCSSForColorMap)(colorMap));
            this._themeCSS = cssRules.join('\n');
            this._updateCSS();
            languages_1.TokenizationRegistry.setColorMap(colorMap);
            this._onColorThemeChange.fire(this._theme);
        }
        _updateCSS() {
            this._allCSS = `${this._codiconCSS}\n${this._themeCSS}`;
            this._styleElements.forEach(styleElement => styleElement.textContent = this._allCSS);
        }
        getFileIconTheme() {
            return {
                hasFileIcons: false,
                hasFolderIcons: false,
                hidesExplorerArrows: false
            };
        }
        getProductIconTheme() {
            return this._builtInProductIconTheme;
        }
    }
    exports.StandaloneThemeService = StandaloneThemeService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZVRoZW1lU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3N0YW5kYWxvbmUvYnJvd3Nlci9zdGFuZGFsb25lVGhlbWVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9CbkYsUUFBQSxtQkFBbUIsR0FBRyxJQUFJLENBQUM7SUFDM0IsUUFBQSxrQkFBa0IsR0FBRyxTQUFTLENBQUM7SUFDL0IsUUFBQSxtQkFBbUIsR0FBRyxVQUFVLENBQUM7SUFDakMsUUFBQSxtQkFBbUIsR0FBRyxVQUFVLENBQUM7SUFFOUMsTUFBTSxhQUFhLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQWlCLDBCQUFVLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNoRixNQUFNLGVBQWUsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBbUIseUJBQWlCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUU3RixNQUFNLGVBQWU7UUFVcEIsWUFBWSxJQUFZLEVBQUUsbUJBQXlDO1lBMkluRCx5QkFBb0IsR0FBRyxLQUFLLENBQUM7WUExSTVDLElBQUksQ0FBQyxTQUFTLEdBQUcsbUJBQW1CLENBQUM7WUFDckMsTUFBTSxJQUFJLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDO1lBQ3RDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDMUIsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7Z0JBQ2hCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO2dCQUM3QixDQUFDO2dCQUNELElBQUksQ0FBQyxTQUFTLEdB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