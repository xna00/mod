/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/json", "vs/base/common/color", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/services/themes/common/themeCompatibility", "vs/nls", "vs/base/common/types", "vs/base/common/resources", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/registry/common/platform", "vs/base/common/jsonErrorMessages", "vs/workbench/services/themes/common/plistParser", "vs/platform/theme/common/tokenClassificationRegistry", "vs/workbench/services/themes/common/textMateScopeMatcher", "vs/platform/theme/common/theme"], function (require, exports, path_1, Json, color_1, workbenchThemeService_1, themeCompatibility_1, nls, types, resources, colorRegistry_1, themeService_1, platform_1, jsonErrorMessages_1, plistParser_1, tokenClassificationRegistry_1, textMateScopeMatcher_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorThemeData = void 0;
    const colorRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
    const tokenClassificationRegistry = (0, tokenClassificationRegistry_1.getTokenClassificationRegistry)();
    const tokenGroupToScopesMap = {
        comments: ['comment', 'punctuation.definition.comment'],
        strings: ['string', 'meta.embedded.assembly'],
        keywords: ['keyword - keyword.operator', 'keyword.control', 'storage', 'storage.type'],
        numbers: ['constant.numeric'],
        types: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'],
        functions: ['entity.name.function', 'support.function'],
        variables: ['variable', 'entity.name.variable']
    };
    class ColorThemeData {
        static { this.STORAGE_KEY = 'colorThemeData'; }
        constructor(id, label, settingsId) {
            this.themeTokenColors = [];
            this.customTokenColors = [];
            this.colorMap = {};
            this.customColorMap = {};
            this.semanticTokenRules = [];
            this.customSemanticTokenRules = [];
            this.textMateThemingRules = undefined; // created on demand
            this.tokenColorIndex = undefined; // created on demand
            this.id = id;
            this.label = label;
            this.settingsId = settingsId;
            this.isLoaded = false;
        }
        get semanticHighlighting() {
            if (this.customSemanticHighlighting !== undefined) {
                return this.customSemanticHighlighting;
            }
            if (this.customSemanticHighlightingDeprecated !== undefined) {
                return this.customSemanticHighlightingDeprecated;
            }
            return !!this.themeSemanticHighlighting;
        }
        get tokenColors() {
            if (!this.textMateThemingRules) {
                const result = [];
                // the default rule (scope empty) is always the first rule. Ignore all other default rules.
                const foreground = this.getColor(colorRegistry_1.editorForeground) || this.getDefault(colorRegistry_1.editorForeground);
                const background = this.getColor(colorRegistry_1.editorBackground) || this.getDefault(colorRegistry_1.editorBackground);
                result.push({
                    settings: {
                        foreground: normalizeColor(foreground),
                        background: normalizeColor(background)
                    }
                });
                let hasDefaultTokens = false;
                function addRule(rule) {
                    if (rule.scope && rule.settings) {
                        if (rule.scope === 'token.info-token') {
                            hasDefaultTokens = true;
                        }
                        result.push({ scope: rule.scope, settings: { foreground: normalizeColor(rule.settings.foreground), background: normalizeColor(rule.settings.background), fontStyle: rule.settings.fontStyle } });
                    }
                }
                this.themeTokenColors.forEach(addRule);
                // Add the custom colors after the theme colors
                // so that they will override them
                this.customTokenColors.forEach(addRule);
                if (!hasDefaultTokens) {
                    defaultThemeColors[this.type].forEach(addRule);
                }
                this.textMateThemingRules = result;
            }
            return this.textMateThemingRules;
        }
        getColor(colorId, useDefault) {
            let color = this.customColorMap[colorId];
            if (color) {
                return color;
            }
            color = this.colorMap[colorId];
            if (useDefault !== false && types.isUndefined(color)) {
                color = this.getDefault(colorId);
            }
            return color;
        }
        getTokenStyle(type, modifiers, language, useDefault = true, definitions = {}) {
            const result = {
                foreground: undefined,
                bold: undefined,
                underline: undefined,
                strikethrough: undefined,
                italic: undefined
            };
            const score = {
                foreground: -1,
                bold: -1,
                underline: -1,
                strikethrough: -1,
                italic: -1
            };
            function _processStyle(matchScore, style, definition) {
                if (style.foreground && score.foreground <= matchScore) {
                    score.foreground = matchScore;
                    result.foreground = style.foreground;
                    definitions.foreground = definition;
                }
                for (const p of ['bold', 'underline', 'strikethrough', 'italic']) {
                    const property = p;
                    const info = style[property];
                    if (info !== undefined) {
                        if (score[property] <= matchScore) {
                            score[property] = matchScore;
                            result[property] = info;
                            definitions[property] = definition;
                        }
                    }
                }
            }
            function _processSemanticTokenRule(rule) {
                const matchScore = rule.selector.match(type, modifiers, language);
                if (matchScore >= 0) {
                    _processStyle(matchScore, rule.style, rule);
                }
            }
            this.semanticTokenRules.forEach(_processSemanticTokenRule);
            this.customSemanticTokenRules.forEach(_processSemanticTokenRule);
            let hasUndefinedStyleProperty = false;
            for (const k in score) {
                const key = k;
                if (score[key] === -1) {
                    hasUndefinedStyleProperty = true;
                }
                else {
                    score[key] = Number.MAX_VALUE; // set it to the max, so it won't be replaced by a default
                }
            }
            if (hasUndefinedStyleProperty) {
                for (const rule of tokenClassificationRegistry.getTokenStylingDefaultRules()) {
                    const matchScore = rule.selector.match(type, modifiers, language);
                    if (matchScore >= 0) {
                        let style;
                        if (rule.defaults.scopesToProbe) {
                            style = this.resolveScopes(rule.defaults.scopesToProbe);
                            if (style) {
                                _processStyle(matchScore, style, rule.defaults.scopesToProbe);
                            }
                        }
                        if (!style && useDefault !== false) {
                            const tokenStyleValue = rule.defaults[this.type];
                            style = this.resolveTokenStyleValue(tokenStyleValue);
                            if (style) {
                                _processStyle(matchScore, style, tokenStyleValue);
                            }
                        }
                    }
                }
            }
            return tokenClassificationRegistry_1.TokenStyle.fromData(result);
        }
        /**
         * @param tokenStyleValue Resolve a tokenStyleValue in the context of a theme
         */
        resolveTokenStyleValue(tokenStyleValue) {
            if (tokenStyleValue === undefined) {
                return undefined;
            }
            else if (typeof tokenStyleValue === 'string') {
                const { type, modifiers, language } = (0, tokenClassificationRegistry_1.parseClassifierString)(tokenStyleValue, '');
                return this.getTokenStyle(type, modifiers, language);
            }
            else if (typeof tokenStyleValue === 'object') {
                return tokenStyleValue;
            }
            return undefined;
        }
        getTokenColorIndex() {
            // collect all colors that tokens can have
            if (!this.tokenColorIndex) {
                const index = new TokenColorIndex();
                this.tokenColors.forEach(rule => {
                    index.add(rule.settings.foreground);
                    index.add(rule.settings.background);
                });
                this.semanticTokenRules.forEach(r => index.add(r.style.foreground));
                tokenClassificationRegistry.getTokenStylingDefaultRules().forEach(r => {
                    const defaultColor = r.defaults[this.type];
                    if (defaultColor && typeof defaultColor === 'object') {
                        index.add(defaultColor.foreground);
                    }
                });
                this.customSemanticTokenRules.forEach(r => index.add(r.style.foreground));
                this.tokenColorIndex = index;
            }
            return this.tokenColorIndex;
        }
        get tokenColorMap() {
            return this.getTokenColorIndex().asArray();
        }
        getTokenStyleMetadata(typeWithLanguage, modifiers, defaultLanguage, useDefault = true, definitions = {}) {
            const { type, language } = (0, tokenClassificationRegistry_1.parseClassifierString)(typeWithLanguage, defaultLanguage);
            const style = this.getTokenStyle(type, modifiers, language, useDefault, definitions);
            if (!style) {
                return undefined;
            }
            return {
                foreground: this.getTokenColorIndex().get(style.foreground),
                bold: style.bold,
                underline: style.underline,
                strikethrough: style.strikethrough,
                italic: style.italic,
            };
        }
        getTokenStylingRuleScope(rule) {
            if (this.customSemanticTokenRules.indexOf(rule) !== -1) {
                return 'setting';
            }
            if (this.semanticTokenRules.indexOf(rule) !== -1) {
                return 'theme';
            }
            return undefined;
        }
        getDefault(colorId) {
            return colorRegistry.resolveDefaultColor(colorId, this);
        }
        resolveScopes(scopes, definitions) {
            if (!this.themeTokenScopeMatchers) {
                this.themeTokenScopeMatchers = this.themeTokenColors.map(getScopeMatcher);
            }
            if (!this.customTokenScopeMatchers) {
                this.customTokenScopeMatchers = this.customTokenColors.map(getScopeMatcher);
            }
            for (const scope of scopes) {
                let foreground = undefined;
                let fontStyle = undefined;
                let foregroundScore = -1;
                let fontStyleScore = -1;
                let fontStyleThemingRule = undefined;
                let foregroundThemingRule = undefined;
                function findTokenStyleForScopeInScopes(scopeMatchers, themingRules) {
                    for (let i = 0; i < scopeMatchers.length; i++) {
                        const score = scopeMatchers[i](scope);
                        if (score >= 0) {
                            const themingRule = themingRules[i];
                            const settings = themingRules[i].settings;
                            if (score >= foregroundScore && settings.foreground) {
                                foreground = settings.foreground;
                                foregroundScore = score;
                                foregroundThemingRule = themingRule;
                            }
                            if (score >= fontStyleScore && types.isString(settings.fontStyle)) {
                                fontStyle = settings.fontStyle;
                                fontStyleScore = score;
                                fontStyleThemingRule = themingRule;
                            }
                        }
                    }
                }
                findTokenStyleForScopeInScopes(this.themeTokenScopeMatchers, this.themeTokenColors);
                findTokenStyleForScopeInScopes(this.customTokenScopeMatchers, this.customTokenColors);
                if (foreground !== undefined || fontStyle !== undefined) {
                    if (definitions) {
                        definitions.foreground = foregroundThemingRule;
                        definitions.bold = definitions.italic = definitions.underline = definitions.strikethrough = fontStyleThemingRule;
                        definitions.scope = scope;
                    }
                    return tokenClassificationRegistry_1.TokenStyle.fromSettings(foreground, fontStyle);
                }
            }
            return undefined;
        }
        defines(colorId) {
            return this.customColorMap.hasOwnProperty(colorId) || this.colorMap.hasOwnProperty(colorId);
        }
        setCustomizations(settings) {
            this.setCustomColors(settings.colorCustomizations);
            this.setCustomTokenColors(settings.tokenColorCustomizations);
            this.setCustomSemanticTokenColors(settings.semanticTokenColorCustomizations);
        }
        setCustomColors(colors) {
            this.customColorMap = {};
            this.overwriteCustomColors(colors);
            const themeSpecificColors = this.getThemeSpecificColors(colors);
            if (types.isObject(themeSpecificColors)) {
                this.overwriteCustomColors(themeSpecificColors);
            }
            this.tokenColorIndex = undefined;
            this.textMateThemingRules = undefined;
            this.customTokenScopeMatchers = undefined;
        }
        overwriteCustomColors(colors) {
            for (const id in colors) {
                const colorVal = colors[id];
                if (typeof colorVal === 'string') {
                    this.customColorMap[id] = color_1.Color.fromHex(colorVal);
                }
            }
        }
        setCustomTokenColors(customTokenColors) {
            this.customTokenColors = [];
            this.customSemanticHighlightingDeprecated = undefined;
            // first add the non-theme specific settings
            this.addCustomTokenColors(customTokenColors);
            // append theme specific settings. Last rules will win.
            const themeSpecificTokenColors = this.getThemeSpecificColors(customTokenColors);
            if (types.isObject(themeSpecificTokenColors)) {
                this.addCustomTokenColors(themeSpecificTokenColors);
            }
            this.tokenColorIndex = undefined;
            this.textMateThemingRules = undefined;
            this.customTokenScopeMatchers = undefined;
        }
        setCustomSemanticTokenColors(semanticTokenColors) {
            this.customSemanticTokenRules = [];
            this.customSemanticHighlighting = undefined;
            if (semanticTokenColors) {
                this.customSemanticHighlighting = semanticTokenColors.enabled;
                if (semanticTokenColors.rules) {
                    this.readSemanticTokenRules(semanticTokenColors.rules);
                }
                const themeSpecificColors = this.getThemeSpecificColors(semanticTokenColors);
                if (types.isObject(themeSpecificColors)) {
                    if (themeSpecificColors.enabled !== undefined) {
                        this.customSemanticHighlighting = themeSpecificColors.enabled;
                    }
                    if (themeSpecificColors.rules) {
                        this.readSemanticTokenRules(themeSpecificColors.rules);
                    }
                }
            }
            this.tokenColorIndex = undefined;
            this.textMateThemingRules = undefined;
        }
        isThemeScope(key) {
            return key.charAt(0) === workbenchThemeService_1.THEME_SCOPE_OPEN_PAREN && key.charAt(key.length - 1) === workbenchThemeService_1.THEME_SCOPE_CLOSE_PAREN;
        }
        isThemeScopeMatch(themeId) {
            const themeIdFirstChar = themeId.charAt(0);
            const themeIdLastChar = themeId.charAt(themeId.length - 1);
            const themeIdPrefix = themeId.slice(0, -1);
            const themeIdInfix = themeId.slice(1, -1);
            const themeIdSuffix = themeId.slice(1);
            return themeId === this.settingsId
                || (this.settingsId.includes(themeIdInfix) && themeIdFirstChar === workbenchThemeService_1.THEME_SCOPE_WILDCARD && themeIdLastChar === workbenchThemeService_1.THEME_SCOPE_WILDCARD)
                || (this.settingsId.startsWith(themeIdPrefix) && themeIdLastChar === workbenchThemeService_1.THEME_SCOPE_WILDCARD)
                || (this.settingsId.endsWith(themeIdSuffix) && themeIdFirstChar === workbenchThemeService_1.THEME_SCOPE_WILDCARD);
        }
        getThemeSpecificColors(colors) {
            let themeSpecificColors;
            for (const key in colors) {
                const scopedColors = colors[key];
                if (this.isThemeScope(key) && scopedColors instanceof Object && !Array.isArray(scopedColors)) {
                    const themeScopeList = key.match(workbenchThemeService_1.themeScopeRegex) || [];
                    for (const themeScope of themeScopeList) {
                        const themeId = themeScope.substring(1, themeScope.length - 1);
                        if (this.isThemeScopeMatch(themeId)) {
                            if (!themeSpecificColors) {
                                themeSpecificColors = {};
                            }
                            const scopedThemeSpecificColors = scopedColors;
                            for (const subkey in scopedThemeSpecificColors) {
                                const originalColors = themeSpecificColors[subkey];
                                const overrideColors = scopedThemeSpecificColors[subkey];
                                if (Array.isArray(originalColors) && Array.isArray(overrideColors)) {
                                    themeSpecificColors[subkey] = originalColors.concat(overrideColors);
                                }
                                else if (overrideColors) {
                                    themeSpecificColors[subkey] = overrideColors;
                                }
                            }
                        }
                    }
                }
            }
            return themeSpecificColors;
        }
        readSemanticTokenRules(tokenStylingRuleSection) {
            for (const key in tokenStylingRuleSection) {
                if (!this.isThemeScope(key)) { // still do this test until experimental settings are gone
                    try {
                        const rule = readSemanticTokenRule(key, tokenStylingRuleSection[key]);
                        if (rule) {
                            this.customSemanticTokenRules.push(rule);
                        }
                    }
                    catch (e) {
                        // invalid selector, ignore
                    }
                }
            }
        }
        addCustomTokenColors(customTokenColors) {
            // Put the general customizations such as comments, strings, etc. first so that
            // they can be overridden by specific customizations like "string.interpolated"
            for (const tokenGroup in tokenGroupToScopesMap) {
                const group = tokenGroup; // TS doesn't type 'tokenGroup' properly
                const value = customTokenColors[group];
                if (value) {
                    const settings = typeof value === 'string' ? { foreground: value } : value;
                    const scopes = tokenGroupToScopesMap[group];
                    for (const scope of scopes) {
                        this.customTokenColors.push({ scope, settings });
                    }
                }
            }
            // specific customizations
            if (Array.isArray(customTokenColors.textMateRules)) {
                for (const rule of customTokenColors.textMateRules) {
                    if (rule.scope && rule.settings) {
                        this.customTokenColors.push(rule);
                    }
                }
            }
            if (customTokenColors.semanticHighlighting !== undefined) {
                this.customSemanticHighlightingDeprecated = customTokenColors.semanticHighlighting;
            }
        }
        ensureLoaded(extensionResourceLoaderService) {
            return !this.isLoaded ? this.load(extensionResourceLoaderService) : Promise.resolve(undefined);
        }
        reload(extensionResourceLoaderService) {
            return this.load(extensionResourceLoaderService);
        }
        load(extensionResourceLoaderService) {
            if (!this.location) {
                return Promise.resolve(undefined);
            }
            this.themeTokenColors = [];
            this.clearCaches();
            const result = {
                colors: {},
                textMateRules: [],
                semanticTokenRules: [],
                semanticHighlighting: false
            };
            return _loadColorTheme(extensionResourceLoaderService, this.location, result).then(_ => {
                this.isLoaded = true;
                this.semanticTokenRules = result.semanticTokenRules;
                this.colorMap = result.colors;
                this.themeTokenColors = result.textMateRules;
                this.themeSemanticHighlighting = result.semanticHighlighting;
            });
        }
        clearCaches() {
            this.tokenColorIndex = undefined;
            this.textMateThemingRules = undefined;
            this.themeTokenScopeMatchers = undefined;
            this.customTokenScopeMatchers = undefined;
        }
        toStorage(storageService) {
            const colorMapData = {};
            for (const key in this.colorMap) {
                colorMapData[key] = color_1.Color.Format.CSS.formatHexA(this.colorMap[key], true);
            }
            // no need to persist custom colors, they will be taken from the settings
            const value = JSON.stringify({
                id: this.id,
                label: this.label,
                settingsId: this.settingsId,
                themeTokenColors: this.themeTokenColors.map(tc => ({ settings: tc.settings, scope: tc.scope })), // don't persist names
                semanticTokenRules: this.semanticTokenRules.map(tokenClassificationRegistry_1.SemanticTokenRule.toJSONObject),
                extensionData: workbenchThemeService_1.ExtensionData.toJSONObject(this.extensionData),
                themeSemanticHighlighting: this.themeSemanticHighlighting,
                colorMap: colorMapData,
                watch: this.watch
            });
            // roam persisted color theme colors. Don't enable for icons as they contain references to fonts and images.
            storageService.store(ColorThemeData.STORAGE_KEY, value, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
        get baseTheme() {
            return this.classNames[0];
        }
        get classNames() {
            return this.id.split(' ');
        }
        get type() {
            switch (this.baseTheme) {
                case workbenchThemeService_1.VS_LIGHT_THEME: return theme_1.ColorScheme.LIGHT;
                case workbenchThemeService_1.VS_HC_THEME: return theme_1.ColorScheme.HIGH_CONTRAST_DARK;
                case workbenchThemeService_1.VS_HC_LIGHT_THEME: return theme_1.ColorScheme.HIGH_CONTRAST_LIGHT;
                default: return theme_1.ColorScheme.DARK;
            }
        }
        // constructors
        static createUnloadedThemeForThemeType(themeType, colorMap) {
            return ColorThemeData.createUnloadedTheme((0, themeService_1.getThemeTypeSelector)(themeType), colorMap);
        }
        static createUnloadedTheme(id, colorMap) {
            const themeData = new ColorThemeData(id, '', '__' + id);
            themeData.isLoaded = false;
            themeData.themeTokenColors = [];
            themeData.watch = false;
            if (colorMap) {
                for (const id in colorMap) {
                    themeData.colorMap[id] = color_1.Color.fromHex(colorMap[id]);
                }
            }
            return themeData;
        }
        static createLoadedEmptyTheme(id, settingsId) {
            const themeData = new ColorThemeData(id, '', settingsId);
            themeData.isLoaded = true;
            themeData.themeTokenColors = [];
            themeData.watch = false;
            return themeData;
        }
        static fromStorageData(storageService) {
            const input = storageService.get(ColorThemeData.STORAGE_KEY, 0 /* StorageScope.PROFILE */);
            if (!input) {
                return undefined;
            }
            try {
                const data = JSON.parse(input);
                const theme = new ColorThemeData('', '', '');
                for (const key in data) {
                    switch (key) {
                        case 'colorMap': {
                            const colorMapData = data[key];
                            for (const id in colorMapData) {
                                theme.colorMap[id] = color_1.Color.fromHex(colorMapData[id]);
                            }
                            break;
                        }
                        case 'themeTokenColors':
                        case 'id':
                        case 'label':
                        case 'settingsId':
                        case 'watch':
                        case 'themeSemanticHighlighting':
                            theme[key] = data[key];
                            break;
                        case 'semanticTokenRules': {
                            const rulesData = data[key];
                            if (Array.isArray(rulesData)) {
                                for (const d of rulesData) {
                                    const rule = tokenClassificationRegistry_1.SemanticTokenRule.fromJSONObject(tokenClassificationRegistry, d);
                                    if (rule) {
                                        theme.semanticTokenRules.push(rule);
                                    }
                                }
                            }
                            break;
                        }
                        case 'location':
                            // ignore, no longer restore
                            break;
                        case 'extensionData':
                            theme.extensionData = workbenchThemeService_1.ExtensionData.fromJSONObject(data.extensionData);
                            break;
                    }
                }
                if (!theme.id || !theme.settingsId) {
                    return undefined;
                }
                return theme;
            }
            catch (e) {
                return undefined;
            }
        }
        static fromExtensionTheme(theme, colorThemeLocation, extensionData) {
            const baseTheme = theme['uiTheme'] || 'vs-dark';
            const themeSelector = toCSSSelector(extensionData.extensionId, theme.path);
            const id = `${baseTheme} ${themeSelector}`;
            const label = theme.label || (0, path_1.basename)(theme.path);
            const settingsId = theme.id || label;
            const themeData = new ColorThemeData(id, label, settingsId);
            themeData.description = theme.description;
            themeData.watch = theme._watch === true;
            themeData.location = colorThemeLocation;
            themeData.extensionData = extensionData;
            themeData.isLoaded = false;
            return themeData;
        }
    }
    exports.ColorThemeData = ColorThemeData;
    function toCSSSelector(extensionId, path) {
        if (path.startsWith('./')) {
            path = path.substr(2);
        }
        let str = `${extensionId}-${path}`;
        //remove all characters that are not allowed in css
        str = str.replace(/[^_a-zA-Z0-9-]/g, '-');
        if (str.charAt(0).match(/[0-9-]/)) {
            str = '_' + str;
        }
        return str;
    }
    async function _loadColorTheme(extensionResourceLoaderService, themeLocation, result) {
        if (resources.extname(themeLocation) === '.json') {
            const content = await extensionResourceLoaderService.readExtensionResource(themeLocation);
            const errors = [];
            const contentValue = Json.parse(content, errors);
            if (errors.length > 0) {
                return Promise.reject(new Error(nls.localize('error.cannotparsejson', "Problems parsing JSON theme file: {0}", errors.map(e => (0, jsonErrorMessages_1.getParseErrorMessage)(e.error)).join(', '))));
            }
            else if (Json.getNodeType(contentValue) !== 'object') {
                return Promise.reject(new Error(nls.localize('error.invalidformat', "Invalid format for JSON theme file: Object expected.")));
            }
            if (contentValue.include) {
                await _loadColorTheme(extensionResourceLoaderService, resources.joinPath(resources.dirname(themeLocation), contentValue.include), result);
            }
            if (Array.isArray(contentValue.settings)) {
                (0, themeCompatibility_1.convertSettings)(contentValue.settings, result);
                return null;
            }
            result.semanticHighlighting = result.semanticHighlighting || contentValue.semanticHighlighting;
            const colors = contentValue.colors;
            if (colors) {
                if (typeof colors !== 'object') {
                    return Promise.reject(new Error(nls.localize({ key: 'error.invalidformat.colors', comment: ['{0} will be replaced by a path. Values in quotes should not be translated.'] }, "Problem parsing color theme file: {0}. Property 'colors' is not of type 'object'.", themeLocation.toString())));
                }
                // new JSON color themes format
                for (const colorId in colors) {
                    const colorHex = colors[colorId];
                    if (typeof colorHex === 'string') { // ignore colors tht are null
                        result.colors[colorId] = color_1.Color.fromHex(colors[colorId]);
                    }
                }
            }
            const tokenColors = contentValue.tokenColors;
            if (tokenColors) {
                if (Array.isArray(tokenColors)) {
                    result.textMateRules.push(...tokenColors);
                }
                else if (typeof tokenColors === 'string') {
                    await _loadSyntaxTokens(extensionResourceLoaderService, resources.joinPath(resources.dirname(themeLocation), tokenColors), result);
                }
                else {
                    return Promise.reject(new Error(nls.localize({ key: 'error.invalidformat.tokenColors', comment: ['{0} will be replaced by a path. Values in quotes should not be translated.'] }, "Problem parsing color theme file: {0}. Property 'tokenColors' should be either an array specifying colors or a path to a TextMate theme file", themeLocation.toString())));
                }
            }
            const semanticTokenColors = contentValue.semanticTokenColors;
            if (semanticTokenColors && typeof semanticTokenColors === 'object') {
                for (const key in semanticTokenColors) {
                    try {
                        const rule = readSemanticTokenRule(key, semanticTokenColors[key]);
                        if (rule) {
                            result.semanticTokenRules.push(rule);
                        }
                    }
                    catch (e) {
                        return Promise.reject(new Error(nls.localize({ key: 'error.invalidformat.semanticTokenColors', comment: ['{0} will be replaced by a path. Values in quotes should not be translated.'] }, "Problem parsing color theme file: {0}. Property 'semanticTokenColors' contains a invalid selector", themeLocation.toString())));
                    }
                }
            }
        }
        else {
            return _loadSyntaxTokens(extensionResourceLoaderService, themeLocation, result);
        }
    }
    function _loadSyntaxTokens(extensionResourceLoaderService, themeLocation, result) {
        return extensionResourceLoaderService.readExtensionResource(themeLocation).then(content => {
            try {
                const contentValue = (0, plistParser_1.parse)(content);
                const settings = contentValue.settings;
                if (!Array.isArray(settings)) {
                    return Promise.reject(new Error(nls.localize('error.plist.invalidformat', "Problem parsing tmTheme file: {0}. 'settings' is not array.")));
                }
                (0, themeCompatibility_1.convertSettings)(settings, result);
                return Promise.resolve(null);
            }
            catch (e) {
                return Promise.reject(new Error(nls.localize('error.cannotparse', "Problems parsing tmTheme file: {0}", e.message)));
            }
        }, error => {
            return Promise.reject(new Error(nls.localize('error.cannotload', "Problems loading tmTheme file {0}: {1}", themeLocation.toString(), error.message)));
        });
    }
    const defaultThemeColors = {
        'light': [
            { scope: 'token.info-token', settings: { foreground: '#316bcd' } },
            { scope: 'token.warn-token', settings: { foreground: '#cd9731' } },
            { scope: 'token.error-token', settings: { foreground: '#cd3131' } },
            { scope: 'token.debug-token', settings: { foreground: '#800080' } }
        ],
        'dark': [
            { scope: 'token.info-token', settings: { foreground: '#6796e6' } },
            { scope: 'token.warn-token', settings: { foreground: '#cd9731' } },
            { scope: 'token.error-token', settings: { foreground: '#f44747' } },
            { scope: 'token.debug-token', settings: { foreground: '#b267e6' } }
        ],
        'hcLight': [
            { scope: 'token.info-token', settings: { foreground: '#316bcd' } },
            { scope: 'token.warn-token', settings: { foreground: '#cd9731' } },
            { scope: 'token.error-token', settings: { foreground: '#cd3131' } },
            { scope: 'token.debug-token', settings: { foreground: '#800080' } }
        ],
        'hcDark': [
            { scope: 'token.info-token', settings: { foreground: '#6796e6' } },
            { scope: 'token.warn-token', settings: { foreground: '#008000' } },
            { scope: 'token.error-token', settings: { foreground: '#FF0000' } },
            { scope: 'token.debug-token', settings: { foreground: '#b267e6' } }
        ]
    };
    const noMatch = (_scope) => -1;
    function nameMatcher(identifers, scope) {
        function findInIdents(s, lastIndent) {
            for (let i = lastIndent - 1; i >= 0; i--) {
                if (scopesAreMatching(s, identifers[i])) {
                    return i;
                }
            }
            return -1;
        }
        if (scope.length < identifers.length) {
            return -1;
        }
        let lastScopeIndex = scope.length - 1;
        let lastIdentifierIndex = findInIdents(scope[lastScopeIndex--], identifers.length);
        if (lastIdentifierIndex >= 0) {
            const score = (lastIdentifierIndex + 1) * 0x10000 + identifers[lastIdentifierIndex].length;
            while (lastScopeIndex >= 0) {
                lastIdentifierIndex = findInIdents(scope[lastScopeIndex--], lastIdentifierIndex);
                if (lastIdentifierIndex === -1) {
                    return -1;
                }
            }
            return score;
        }
        return -1;
    }
    function scopesAreMatching(thisScopeName, scopeName) {
        if (!thisScopeName) {
            return false;
        }
        if (thisScopeName === scopeName) {
            return true;
        }
        const len = scopeName.length;
        return thisScopeName.length > len && thisScopeName.substr(0, len) === scopeName && thisScopeName[len] === '.';
    }
    function getScopeMatcher(rule) {
        const ruleScope = rule.scope;
        if (!ruleScope || !rule.settings) {
            return noMatch;
        }
        const matchers = [];
        if (Array.isArray(ruleScope)) {
            for (const rs of ruleScope) {
                (0, textMateScopeMatcher_1.createMatchers)(rs, nameMatcher, matchers);
            }
        }
        else {
            (0, textMateScopeMatcher_1.createMatchers)(ruleScope, nameMatcher, matchers);
        }
        if (matchers.length === 0) {
            return noMatch;
        }
        return (scope) => {
            let max = matchers[0].matcher(scope);
            for (let i = 1; i < matchers.length; i++) {
                max = Math.max(max, matchers[i].matcher(scope));
            }
            return max;
        };
    }
    function readSemanticTokenRule(selectorString, settings) {
        const selector = tokenClassificationRegistry.parseTokenSelector(selectorString);
        let style;
        if (typeof settings === 'string') {
            style = tokenClassificationRegistry_1.TokenStyle.fromSettings(settings, undefined);
        }
        else if (isSemanticTokenColorizationSetting(settings)) {
            style = tokenClassificationRegistry_1.TokenStyle.fromSettings(settings.foreground, settings.fontStyle, settings.bold, settings.underline, settings.strikethrough, settings.italic);
        }
        if (style) {
            return { selector, style };
        }
        return undefined;
    }
    function isSemanticTokenColorizationSetting(style) {
        return style && (types.isString(style.foreground) || types.isString(style.fontStyle) || types.isBoolean(style.italic)
            || types.isBoolean(style.underline) || types.isBoolean(style.strikethrough) || types.isBoolean(style.bold));
    }
    class TokenColorIndex {
        constructor() {
            this._lastColorId = 0;
            this._id2color = [];
            this._color2id = Object.create(null);
        }
        add(color) {
            color = normalizeColor(color);
            if (color === undefined) {
                return 0;
            }
            let value = this._color2id[color];
            if (value) {
                return value;
            }
            value = ++this._lastColorId;
            this._color2id[color] = value;
            this._id2color[value] = color;
            return value;
        }
        get(color) {
            color = normalizeColor(color);
            if (color === undefined) {
                return 0;
            }
            const value = this._color2id[color];
            if (value) {
                return value;
            }
            console.log(`Color ${color} not in index.`);
            return 0;
        }
        asArray() {
            return this._id2color.slice(0);
        }
    }
    function normalizeColor(color) {
        if (!color) {
            return undefined;
        }
        if (typeof color !== 'string') {
            color = color_1.Color.Format.CSS.formatHexA(color, true);
        }
        const len = color.length;
        if (color.charCodeAt(0) !== 35 /* CharCode.Hash */ || (len !== 4 && len !== 5 && len !== 7 && len !== 9)) {
            return undefined;
        }
        const result = [35 /* CharCode.Hash */];
        for (let i = 1; i < len; i++) {
            const upper = hexUpper(color.charCodeAt(i));
            if (!upper) {
                return undefined;
            }
            result.push(upper);
            if (len === 4 || len === 5) {
                result.push(upper);
            }
        }
        if (result.length === 9 && result[7] === 70 /* CharCode.F */ && result[8] === 70 /* CharCode.F */) {
            result.length = 7;
        }
        return String.fromCharCode(...result);
    }
    function hexUpper(charCode) {
        if (charCode >= 48 /* CharCode.Digit0 */ && charCode <= 57 /* CharCode.Digit9 */ || charCode >= 65 /* CharCode.A */ && charCode <= 70 /* CharCode.F */) {
            return charCode;
        }
        else if (charCode >= 97 /* CharCode.a */ && charCode <= 102 /* CharCode.f */) {
            return charCode - 97 /* CharCode.a */ + 65 /* CharCode.A */;
        }
        return 0;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JUaGVtZURhdGEuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90aGVtZXMvY29tbW9uL2NvbG9yVGhlbWVEYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdCaEcsTUFBTSxhQUFhLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQWlCLDBCQUF1QixDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFFN0YsTUFBTSwyQkFBMkIsR0FBRyxJQUFBLDREQUE4QixHQUFFLENBQUM7SUFFckUsTUFBTSxxQkFBcUIsR0FBRztRQUM3QixRQUFRLEVBQUUsQ0FBQyxTQUFTLEVBQUUsZ0NBQWdDLENBQUM7UUFDdkQsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFLHdCQUF3QixDQUFDO1FBQzdDLFFBQVEsRUFBRSxDQUFDLDRCQUE0QixFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxjQUFjLENBQUM7UUFDdEYsT0FBTyxFQUFFLENBQUMsa0JBQWtCLENBQUM7UUFDN0IsS0FBSyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLGVBQWUsQ0FBQztRQUNqRixTQUFTLEVBQUUsQ0FBQyxzQkFBc0IsRUFBRSxrQkFBa0IsQ0FBQztRQUN2RCxTQUFTLEVBQUUsQ0FBQyxVQUFVLEVBQUUsc0JBQXNCLENBQUM7S0FDL0MsQ0FBQztJQVFGLE1BQWEsY0FBYztpQkFFVixnQkFBVyxHQUFHLGdCQUFnQixBQUFuQixDQUFvQjtRQTZCL0MsWUFBb0IsRUFBVSxFQUFFLEtBQWEsRUFBRSxVQUFrQjtZQWR6RCxxQkFBZ0IsR0FBMkIsRUFBRSxDQUFDO1lBQzlDLHNCQUFpQixHQUEyQixFQUFFLENBQUM7WUFDL0MsYUFBUSxHQUFjLEVBQUUsQ0FBQztZQUN6QixtQkFBYyxHQUFj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QVMsRUFBRSxFQUFFO1NBQ25FO1FBQ0QsTUFBTSxFQUFFO1lBQ1AsRUFBRSxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsUUFBUSxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxFQUFFO1lBQ2xFLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsRUFBRTtZQUNsRSxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxRQUFRLEVBQUUsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEVBQUU7WUFDbkUsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsUUFBUSxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxFQUFFO1NBQ25FO1FBQ0QsU0FBUyxFQUFFO1lBQ1YsRUFBRSxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsUUFBUSxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxFQUFFO1lBQ2xFLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsRUFBRTtZQUNsRSxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxRQUFRLEVBQUUsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEVBQUU7WUFDbkUsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsUUFBUSxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxFQUFFO1NBQ25FO1FBQ0QsUUFBUSxFQUFFO1lBQ1QsRUFBRSxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsUUFBUSxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxFQUFFO1lBQ2xFLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsRUFBRTtZQUNsRSxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxRQUFRLEVBQUUsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEVBQUU7WUFDbkUsRUFBRSxLQUFLLEVBQUUsbUJB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