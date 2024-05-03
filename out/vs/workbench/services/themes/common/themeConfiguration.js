/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/themes/common/colorThemeSchema", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/tokenClassificationRegistry", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/platform"], function (require, exports, nls, types, platform_1, configurationRegistry_1, colorThemeSchema_1, colorRegistry_1, tokenClassificationRegistry_1, workbenchThemeService_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeConfiguration = void 0;
    exports.updateColorThemeConfigurationSchemas = updateColorThemeConfigurationSchemas;
    exports.updateFileIconThemeConfigurationSchemas = updateFileIconThemeConfigurationSchemas;
    exports.updateProductIconThemeConfigurationSchemas = updateProductIconThemeConfigurationSchemas;
    // Configuration: Themes
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const colorThemeSettingEnum = [];
    const colorThemeSettingEnumItemLabels = [];
    const colorThemeSettingEnumDescriptions = [];
    function formatSettingAsLink(str) {
        return `\`#${str}#\``;
    }
    const colorThemeSettingSchema = {
        type: 'string',
        description: nls.localize('colorTheme', "Specifies the color theme used in the workbench."),
        default: platform_2.isWeb ? workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT : workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK,
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const preferredDarkThemeSettingSchema = {
        type: 'string', //
        markdownDescription: nls.localize({ key: 'preferredDarkColorTheme', comment: ['{0} will become a link to another setting.'] }, 'Specifies the preferred color theme for dark OS appearance when {0} is enabled.', formatSettingAsLink(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME)),
        default: workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK,
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const preferredLightThemeSettingSchema = {
        type: 'string',
        markdownDescription: nls.localize({ key: 'preferredLightColorTheme', comment: ['{0} will become a link to another setting.'] }, 'Specifies the preferred color theme for light OS appearance when {0} is enabled.', formatSettingAsLink(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME)),
        default: workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT,
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const preferredHCDarkThemeSettingSchema = {
        type: 'string',
        markdownDescription: nls.localize({ key: 'preferredHCDarkColorTheme', comment: ['{0} will become a link to another setting.'] }, 'Specifies the preferred color theme used in high contrast dark mode when {0} is enabled.', formatSettingAsLink(workbenchThemeService_1.ThemeSettings.DETECT_HC)),
        default: workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_HC_DARK,
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const preferredHCLightThemeSettingSchema = {
        type: 'string',
        markdownDescription: nls.localize({ key: 'preferredHCLightColorTheme', comment: ['{0} will become a link to another setting.'] }, 'Specifies the preferred color theme used in high contrast light mode when {0} is enabled.', formatSettingAsLink(workbenchThemeService_1.ThemeSettings.DETECT_HC)),
        default: workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_HC_LIGHT,
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const detectColorSchemeSettingSchema = {
        type: 'boolean',
        markdownDescription: nls.localize({ key: 'detectColorScheme', comment: ['{0} and {1} will become links to other settings.'] }, 'If set, automatically switch to the preferred color theme based on the OS appearance. If the OS appearance is dark, the theme specified at {0} is used, for light {1}.', formatSettingAsLink(workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME), formatSettingAsLink(workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME)),
        default: false
    };
    const colorCustomizationsSchema = {
        type: 'object',
        description: nls.localize('workbenchColors', "Overrides colors from the currently selected color theme."),
        allOf: [{ $ref: colorRegistry_1.workbenchColorsSchemaId }],
        default: {},
        defaultSnippets: [{
                body: {}
            }]
    };
    const fileIconThemeSettingSchema = {
        type: ['string', 'null'],
        default: workbenchThemeService_1.ThemeSettingDefaults.FILE_ICON_THEME,
        description: nls.localize('iconTheme', "Specifies the file icon theme used in the workbench or 'null' to not show any file icons."),
        enum: [null],
        enumItemLabels: [nls.localize('noIconThemeLabel', 'None')],
        enumDescriptions: [nls.localize('noIconThemeDesc', 'No file icons')],
        errorMessage: nls.localize('iconThemeError', "File icon theme is unknown or not installed.")
    };
    const productIconThemeSettingSchema = {
        type: ['string', 'null'],
        default: workbenchThemeService_1.ThemeSettingDefaults.PRODUCT_ICON_THEME,
        description: nls.localize('productIconTheme', "Specifies the product icon theme used."),
        enum: [workbenchThemeService_1.ThemeSettingDefaults.PRODUCT_ICON_THEME],
        enumItemLabels: [nls.localize('defaultProductIconThemeLabel', 'Default')],
        enumDescriptions: [nls.localize('defaultProductIconThemeDesc', 'Default')],
        errorMessage: nls.localize('productIconThemeError', "Product icon theme is unknown or not installed.")
    };
    const detectHCSchemeSettingSchema = {
        type: 'boolean',
        default: true,
        markdownDescription: nls.localize({ key: 'autoDetectHighContrast', comment: ['{0} and {1} will become links to other settings.'] }, "If enabled, will automatically change to high contrast theme if the OS is using a high contrast theme. The high contrast theme to use is specified by {0} and {1}.", formatSettingAsLink(workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME), formatSettingAsLink(workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME)),
        scope: 1 /* ConfigurationScope.APPLICATION */
    };
    const themeSettingsConfiguration = {
        id: 'workbench',
        order: 7.1,
        type: 'object',
        properties: {
            [workbenchThemeService_1.ThemeSettings.COLOR_THEME]: colorThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME]: preferredDarkThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME]: preferredLightThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME]: preferredHCDarkThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME]: preferredHCLightThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME]: fileIconThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.COLOR_CUSTOMIZATIONS]: colorCustomizationsSchema,
            [workbenchThemeService_1.ThemeSettings.PRODUCT_ICON_THEME]: productIconThemeSettingSchema
        }
    };
    configurationRegistry.registerConfiguration(themeSettingsConfiguration);
    const themeSettingsWindowConfiguration = {
        id: 'window',
        order: 8.1,
        type: 'object',
        properties: {
            [workbenchThemeService_1.ThemeSettings.DETECT_HC]: detectHCSchemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME]: detectColorSchemeSettingSchema,
        }
    };
    configurationRegistry.registerConfiguration(themeSettingsWindowConfiguration);
    function tokenGroupSettings(description) {
        return {
            description,
            $ref: colorThemeSchema_1.textmateColorGroupSchemaId
        };
    }
    const themeSpecificSettingKey = '^\\[[^\\]]*(\\]\\s*\\[[^\\]]*)*\\]$';
    const tokenColorSchema = {
        type: 'object',
        properties: {
            comments: tokenGroupSettings(nls.localize('editorColors.comments', "Sets the colors and styles for comments")),
            strings: tokenGroupSettings(nls.localize('editorColors.strings', "Sets the colors and styles for strings literals.")),
            keywords: tokenGroupSettings(nls.localize('editorColors.keywords', "Sets the colors and styles for keywords.")),
            numbers: tokenGroupSettings(nls.localize('editorColors.numbers', "Sets the colors and styles for number literals.")),
            types: tokenGroupSettings(nls.localize('editorColors.types', "Sets the colors and styles for type declarations and references.")),
            functions: tokenGroupSettings(nls.localize('editorColors.functions', "Sets the colors and styles for functions declarations and references.")),
            variables: tokenGroupSettings(nls.localize('editorColors.variables', "Sets the colors and styles for variables declarations and references.")),
            textMateRules: {
                description: nls.localize('editorColors.textMateRules', 'Sets colors and styles using textmate theming rules (advanced).'),
                $ref: colorThemeSchema_1.textmateColorsSchemaId
            },
            semanticHighlighting: {
                description: nls.localize('editorColors.semanticHighlighting', 'Whether semantic highlighting should be enabled for this theme.'),
                deprecationMessage: nls.localize('editorColors.semanticHighlighting.deprecationMessage', 'Use `enabled` in `editor.semanticTokenColorCustomizations` setting instead.'),
                markdownDeprecationMessage: nls.localize({ key: 'editorColors.semanticHighlighting.deprecationMessageMarkdown', comment: ['{0} will become a link to another setting.'] }, 'Use `enabled` in {0} setting instead.', formatSettingAsLink('editor.semanticTokenColorCustomizations')),
                type: 'boolean'
            }
        },
        additionalProperties: false
    };
    const tokenColorCustomizationSchema = {
        description: nls.localize('editorColors', "Overrides editor syntax colors and font style from the currently selected color theme."),
        default: {},
        allOf: [{ ...tokenColorSchema, patternProperties: { '^\\[': {} } }]
    };
    const semanticTokenColorSchema = {
        type: 'object',
        properties: {
            enabled: {
                type: 'boolean',
                description: nls.localize('editorColors.semanticHighlighting.enabled', 'Whether semantic highlighting is enabled or disabled for this theme'),
                suggestSortText: '0_enabled'
            },
            rules: {
                $ref: tokenClassificationRegistry_1.tokenStylingSchemaId,
                description: nls.localize('editorColors.semanticHighlighting.rules', 'Semantic token styling rules for this theme.'),
                suggestSortText: '0_rules'
            }
        },
        additionalProperties: false
    };
    const semanticTokenColorCustomizationSchema = {
        description: nls.localize('semanticTokenColors', "Overrides editor semantic token color and styles from the currently selected color theme."),
        default: {},
        allOf: [{ ...semanticTokenColorSchema, patternProperties: { '^\\[': {} } }]
    };
    const tokenColorCustomizationConfiguration = {
        id: 'editor',
        order: 7.2,
        type: 'object',
        properties: {
            [workbenchThemeService_1.ThemeSettings.TOKEN_COLOR_CUSTOMIZATIONS]: tokenColorCustomizationSchema,
            [workbenchThemeService_1.ThemeSettings.SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS]: semanticTokenColorCustomizationSchema
        }
    };
    configurationRegistry.registerConfiguration(tokenColorCustomizationConfiguration);
    function updateColorThemeConfigurationSchemas(themes) {
        // updates enum for the 'workbench.colorTheme` setting
        themes.sort((a, b) => a.label.localeCompare(b.label));
        colorThemeSettingEnum.splice(0, colorThemeSettingEnum.length, ...themes.map(t => t.settingsId));
        colorThemeSettingEnumDescriptions.splice(0, colorThemeSettingEnumDescriptions.length, ...themes.map(t => t.description || ''));
        colorThemeSettingEnumItemLabels.splice(0, colorThemeSettingEnumItemLabels.length, ...themes.map(t => t.label || ''));
        const themeSpecificWorkbenchColors = { properties: {} };
        const themeSpecificTokenColors = { properties: {} };
        const themeSpecificSemanticTokenColors = { properties: {} };
        const workbenchColors = { $ref: colorRegistry_1.workbenchColorsSchemaId, additionalProperties: false };
        const tokenColors = { properties: tokenColorSchema.properties, additionalProperties: false };
        for (const t of themes) {
            // add theme specific color customization ("[Abyss]":{ ... })
            const themeId = `[${t.settingsId}]`;
            themeSpecificWorkbenchColors.properties[themeId] = workbenchColors;
            themeSpecificTokenColors.properties[themeId] = tokenColors;
            themeSpecificSemanticTokenColors.properties[themeId] = semanticTokenColorSchema;
        }
        themeSpecificWorkbenchColors.patternProperties = { [themeSpecificSettingKey]: workbenchColors };
        themeSpecificTokenColors.patternProperties = { [themeSpecificSettingKey]: tokenColors };
        themeSpecificSemanticTokenColors.patternProperties = { [themeSpecificSettingKey]: semanticTokenColorSchema };
        colorCustomizationsSchema.allOf[1] = themeSpecificWorkbenchColors;
        tokenColorCustomizationSchema.allOf[1] = themeSpecificTokenColors;
        semanticTokenColorCustomizationSchema.allOf[1] = themeSpecificSemanticTokenColors;
        configurationRegistry.notifyConfigurationSchemaUpdated(themeSettingsConfiguration, tokenColorCustomizationConfiguration);
    }
    function updateFileIconThemeConfigurationSchemas(themes) {
        fileIconThemeSettingSchema.enum.splice(1, Number.MAX_VALUE, ...themes.map(t => t.settingsId));
        fileIconThemeSettingSchema.enumItemLabels.splice(1, Number.MAX_VALUE, ...themes.map(t => t.label));
        fileIconThemeSettingSchema.enumDescriptions.splice(1, Number.MAX_VALUE, ...themes.map(t => t.description || ''));
        configurationRegistry.notifyConfigurationSchemaUpdated(themeSettingsConfiguration);
    }
    function updateProductIconThemeConfigurationSchemas(themes) {
        productIconThemeSettingSchema.enum.splice(1, Number.MAX_VALUE, ...themes.map(t => t.settingsId));
        productIconThemeSettingSchema.enumItemLabels.splice(1, Number.MAX_VALUE, ...themes.map(t => t.label));
        productIconThemeSettingSchema.enumDescriptions.splice(1, Number.MAX_VALUE, ...themes.map(t => t.description || ''));
        configurationRegistry.notifyConfigurationSchemaUpdated(themeSettingsConfiguration);
    }
    class ThemeConfiguration {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        get colorTheme() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.COLOR_THEME);
        }
        get fileIconTheme() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME);
        }
        get productIconTheme() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.PRODUCT_ICON_THEME);
        }
        get colorCustomizations() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.COLOR_CUSTOMIZATIONS) || {};
        }
        get tokenColorCustomizations() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.TOKEN_COLOR_CUSTOMIZATIONS) || {};
        }
        get semanticTokenColorCustomizations() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS);
        }
        async setColorTheme(theme, settingsTarget) {
            await this.writeConfiguration(workbenchThemeService_1.ThemeSettings.COLOR_THEME, theme.settingsId, settingsTarget);
            return theme;
        }
        async setFileIconTheme(theme, settingsTarget) {
            await this.writeConfiguration(workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME, theme.settingsId, settingsTarget);
            return theme;
        }
        async setProductIconTheme(theme, settingsTarget) {
            await this.writeConfiguration(workbenchThemeService_1.ThemeSettings.PRODUCT_ICON_THEME, theme.settingsId, settingsTarget);
            return theme;
        }
        isDefaultColorTheme() {
            const settings = this.configurationService.inspect(workbenchThemeService_1.ThemeSettings.COLOR_THEME);
            return settings && settings.default?.value === settings.value;
        }
        findAutoConfigurationTarget(key) {
            const settings = this.configurationService.inspect(key);
            if (!types.isUndefined(settings.workspaceFolderValue)) {
                return 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
            }
            else if (!types.isUndefined(settings.workspaceValue)) {
                return 5 /* ConfigurationTarget.WORKSPACE */;
            }
            else if (!types.isUndefined(settings.userRemote)) {
                return 4 /* ConfigurationTarget.USER_REMOTE */;
            }
            return 2 /* ConfigurationTarget.USER */;
        }
        async writeConfiguration(key, value, settingsTarget) {
            if (settingsTarget === undefined || settingsTarget === 'preview') {
                return;
            }
            const settings = this.configurationService.inspect(key);
            if (settingsTarget === 'auto') {
                return this.configurationService.updateValue(key, value);
            }
            if (settingsTarget === 2 /* ConfigurationTarget.USER */) {
                if (value === settings.userValue) {
                    return Promise.resolve(undefined); // nothing to do
                }
                else if (value === settings.defaultValue) {
                    if (types.isUndefined(settings.userValue)) {
                        return Promise.resolve(undefined); // nothing to do
                    }
                    value = undefined; // remove configuration from user settings
                }
            }
            else if (settingsTarget === 5 /* ConfigurationTarget.WORKSPACE */ || settingsTarget === 6 /* ConfigurationTarget.WORKSPACE_FOLDER */ || settingsTarget === 4 /* ConfigurationTarget.USER_REMOTE */) {
                if (value === settings.value) {
                    return Promise.resolve(undefined); // nothing to do
                }
            }
            return this.configurationService.updateValue(key, value, settingsTarget);
        }
    }
    exports.ThemeConfiguration = ThemeConfiguration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVDb25maWd1cmF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGhlbWVzL2NvbW1vbi90aGVtZUNvbmZpZ3VyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdU5oRyxvRkE2QkM7SUFFRCwwRkFNQztJQUVELGdHQU1DO0lBclBELHdCQUF3QjtJQUN4QixNQUFNLHFCQUFxQixHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBdUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUV6RyxNQUFNLHFCQUFxQixHQUFhLEVBQUUsQ0FBQztJQUMzQyxNQUFNLCtCQUErQixHQUFhLEVBQUUsQ0FBQztJQUNyRCxNQUFNLGlDQUFpQyxHQUFhLEVBQUUsQ0FBQztJQUV2RCxTQUFTLG1CQUFtQixDQUFDLEdBQVc7UUFDdkMsT0FBTyxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxNQUFNLHVCQUF1QixHQUFpQztRQUM3RCxJQUFJLEVBQUUsUUFBUTtRQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxrREFBa0QsQ0FBQztRQUMzRixPQUFPLEVBQUUsZ0JBQUssQ0FBQyxDQUFDLENBQUMsNENBQW9CLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLDRDQUFvQixDQUFDLGdCQUFnQjtRQUMvRixJQUFJLEVBQUUscUJBQXFCO1FBQzNCLGdCQUFnQixFQUFFLGlDQUFpQztRQUNuRCxjQUFjLEVBQUUsK0JBQStCO1FBQy9DLFlBQVksRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLG9DQUFvQyxDQUFDO0tBQ25GLENBQUM7SUFDRixNQUFNLCtCQUErQixHQUFpQztRQUNyRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDbEIsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsRUFBRSx5QkFBeUIsRUFBRSxPQUFPLEVBQUUsQ0FBQyw0Q0FBNEMsQ0FBQyxFQUFFLEVBQUUsaUZBQWlGLEVBQUUsbUJBQW1CLENBQUMscUNBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3pRLE9BQU8sRUFBRSw0Q0FBb0IsQ0FBQyxnQkFBZ0I7UUFDOUMsSUFBSSxFQUFFLHFCQUFxQjtRQUMzQixnQkFBZ0IsRUFBRSxpQ0FBaUM7UUFDbkQsY0FBYyxFQUFFLCtCQUErQjtRQUMvQyxZQUFZLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxvQ0FBb0MsQ0FBQztLQUNuRixDQUFDO0lBQ0YsTUFBTSxnQ0FBZ0MsR0FBaUM7UUFDdEUsSUFBSSxFQUFFLFFBQVE7UUFDZCxtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxFQUFFLDBCQUEwQixFQUFFLE9BQU8sRUFBRSxDQUFDLDRDQUE0QyxDQUFDLEVBQUUsRUFBRSxrRkFBa0YsRUFBRSxtQkFBbUIsQ0FBQyxxQ0FBYSxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDM1EsT0FBTyxFQUFFLDRDQUFvQixDQUFDLGlCQUFpQjtRQUMvQyxJQUFJLEVBQUUscUJBQXFCO1FBQzNCLGdCQUFnQixFQUFFLGlDQUFpQztRQUNuRCxjQUFjLEVBQUUsK0JBQStCO1FBQy9DLFlBQVksRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLG9DQUFvQyxDQUFDO0tBQ25GLENBQUM7SUFDRixNQUFNLGlDQUFpQyxHQUFpQztRQUN2RSxJQUFJLEVBQUUsUUFBUTtRQUNkLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsMkJBQTJCLEVBQUUsT0FBTyxFQUFFLENBQUMsNENBQTRDLENBQUMsRUFBRSxFQUFFLDBGQUEwRixFQUFFLG1CQUFtQixDQUFDLHFDQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDMVEsT0FBTyxFQUFFLDRDQUFvQixDQUFDLG1CQUFtQjtRQUNqRCxJQUFJLEVBQUUscUJBQXFCO1FBQzNCLGdCQUFnQixFQUFFLGlDQUFpQztRQUNuRCxjQUFjLEVBQUUsK0JBQStCO1FBQy9DLFlBQVksRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLG9DQUFvQyxDQUFDO0tBQ25GLENBQUM7SUFDRixNQUFNLGtDQUFrQyxHQUFpQztRQUN4RSxJQUFJLEVBQUUsUUFBUTtRQUNkLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsNEJBQTRCLEVBQUUsT0FBTyxFQUFFLENBQUMsNENBQTRDLENBQUMsRUFBRSxFQUFFLDJGQUEyRixFQUFFLG1CQUFtQixDQUFDLHFDQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDNVEsT0FBTyxFQUFFLDRDQUFvQixDQUFDLG9CQUFvQjtRQUNsRCxJQUFJLEVBQUUscUJBQXFCO1FBQzNCLGdCQUFnQixFQUFFLGlDQUFpQztRQUNuRCxjQUFjLEVBQUUsK0JBQStCO1FBQy9DLFlBQVksRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLG9DQUFvQyxDQUFDO0tBQ25GLENBQUM7SUFDRixNQUFNLDhCQUE4QixHQUFpQztRQUNwRSxJQUFJLEVBQUUsU0FBUztRQUNmLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsbUJBQW1CLEVBQUUsT0FBTyxFQUFFLENBQUMsa0RBQWtELENBQUMsRUFBRSxFQUFFLHdLQUF3SyxFQUFFLG1CQUFtQixDQUFDLHFDQUFhLENBQUMsb0JBQW9CLENBQUMsRUFBRSxtQkFBbUIsQ0FBQyxxQ0FBYSxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDM1osT0FBTyxFQUFFLEtBQUs7S0FDZCxDQUFDO0lBRUYsTUFBTSx5QkFBeUIsR0FBaUM7UUFDL0QsSUFBSSxFQUFFLFFBQVE7UUFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSwyREFBMkQsQ0FBQztRQUN6RyxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSx1Q0FBdUIsRUFBRSxDQUFDO1FBQzFDLE9BQU8sRUFBRSxFQUFFO1FBQ1gsZUFBZSxFQUFFLENBQUM7Z0JBQ2pCLElBQUksRUFBRSxFQUNMO2FBQ0QsQ0FBQztLQUNGLENBQUM7SUFDRixNQUFNLDBCQUEwQixHQUFpQztRQUNoRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO1FBQ3hCLE9BQU8sRUFBRSw0Q0FBb0IsQ0FBQyxlQUFlO1FBQzdDLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSwyRkFBMkYsQ0FBQztRQUNuSSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUM7UUFDWixjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFELGdCQUFnQixFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUNwRSxZQUFZLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSw4Q0FBOEMsQ0FBQztLQUM1RixDQUFDO0lBQ0YsTUFBTSw2QkFBNkIsR0FBaUM7UUFDbkUsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQztRQUN4QixPQUFPLEVBQUUsNENBQW9CLENBQUMsa0JBQWtCO1FBQ2hELFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLHdDQUF3QyxDQUFDO1FBQ3ZGLElBQUksRUFBRSxDQUFDLDRDQUFvQixDQUFDLGtCQUFrQixDQUFDO1FBQy9DLGNBQWMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsOEJBQThCLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDekUsZ0JBQWdCLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLDZCQUE2QixFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzFFLFlBQVksRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHVCQUF1QixFQUFFLGlEQUFpRCxDQUFDO0tBQ3RHLENBQUM7SUFFRixNQUFNLDJCQUEyQixHQUFpQztRQUNqRSxJQUFJLEVBQUUsU0FBUztRQUNmLE9BQU8sRUFBRSxJQUFJO1FBQ2IsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsRUFBRSx3QkFBd0IsRUFBRSxPQUFPLEVBQUUsQ0FBQyxrREFBa0QsQ0FBQyxFQUFFLEVBQUUsb0tBQW9LLEVBQUUsbUJBQW1CLENBQUMscUNBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLHFDQUFhLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUNsYSxLQUFLLHdDQUFnQztLQUNyQyxDQUFDO0lBRUYsTUFBTSwwQkFBMEIsR0FBdUI7UUFDdEQsRUFBRSxFQUFFLFdBQVc7UUFDZixLQUFLLEVBQUUsR0FBRztRQUNWLElBQUksRUFBRSxRQUFRO1FBQ2QsVUFBVSxFQUFFO1lBQ1gsQ0FBQyxxQ0FBYSxDQUFDLFdBQVcsQ0FBQyxFQUFFLHVCQUF1QjtZQUNwRCxDQUFDLHFDQUFhLENBQUMsb0JBQW9CLENBQUMsRUFBRSwrQkFBK0I7WUFDckUsQ0FBQyxxQ0FBYSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsZ0NBQWdDO1lBQ3ZFLENBQUMscUNBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLGlDQUFpQztZQUMxRSxDQUFDLHFDQUFhLENBQUMsd0JBQXdCLENBQUMsRUFBRSxrQ0FBa0M7WUFDNUUsQ0FBQyxxQ0FBYSxDQUFDLGVBQWUsQ0FBQyxFQUFFLDBCQUEwQjtZQUMzRCxDQUFDLHFDQUFhLENBQUMsb0JBQW9CLENBQUMsRUFBRSx5QkFBeUI7WUFDL0QsQ0FBQyxxQ0FBYSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsNkJBQTZCO1NBQ2pFO0tBQ0QsQ0FBQztJQUNGLHFCQUFxQixDQUFDLHFCQUFxQixDQUFDLDBCQUEwQixDQUFDLENBQUM7SUFFeEUsTUFBTSxnQ0FBZ0MsR0FBdUI7UUFDNUQsRUFBRSxFQUFFLFFBQVE7UUFDWixLQUFLLEVBQUUsR0FBRztRQUNWLElBQUksRUFBRSxRQUFRO1FBQ2QsVUFBVSxFQUFFO1lBQ1gsQ0FBQyxxQ0FBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFLDJCQUEyQjtZQUN0RCxDQUFDLHFDQUFhLENBQUMsbUJBQW1CLENBQUMsRUFBRSw4QkFBOEI7U0FDbkU7S0FDRCxDQUFDO0lBQ0YscUJBQXFCLENBQUMscUJBQXFCLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztJQUU5RSxTQUFTLGtCQUFrQixDQUFDLFdBQW1CO1FBQzlDLE9BQU87WUFDTixXQUFXO1lBQ1gsSUFBSSxFQUFFLDZDQUEwQjtTQUNoQyxDQUFDO0lBQ0gsQ0FBQztJQUVELE1BQU0sdUJBQXVCLEdBQUcscUNBQXFDLENBQUM7SUFFdEUsTUFBTSxnQkFBZ0IsR0FBZ0I7UUFDckMsSUFBSSxFQUFFLFFBQVE7UUFDZCxVQUFVLEVBQUU7WUFDWCxRQUFRLEVBQUUsa0JBQWtCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSx5Q0FBeUMsQ0FBQyxDQUFDO1lBQzlHLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLGtEQUFrRCxDQUFDLENBQUM7WUFDckgsUUFBUSxFQUFFLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUUsMENBQTBDLENBQUMsQ0FBQztZQUMvRyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxpREFBaUQsQ0FBQyxDQUFDO1lBQ3BILEtBQUssRUFBRSxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLGtFQUFrRSxDQUFDLENBQUM7WUFDakksU0FBUyxFQUFFLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsd0JBQXdCLEVBQUUsdUVBQXVFLENBQUMsQ0FBQztZQUM5SSxTQUFTLEVBQUUsa0JBQWtCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSx1RUFBdUUsQ0FBQyxDQUFDO1lBQzlJLGFBQWEsRUFBRTtnQkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsRUFBRSxpRUFBaUUsQ0FBQztnQkFDMUgsSUFBSSxFQUFFLHlDQUFzQjthQUM1QjtZQUNELG9CQUFvQixFQUFFO2dCQUNyQixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQ0FBbUMsRUFBRSxpRUFBaUUsQ0FBQztnQkFDakksa0JBQWtCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzREFBc0QsRUFBRSw2RUFBNkUsQ0FBQztnQkFDdkssMEJBQTBCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsRUFBRSw4REFBOEQsRUFBRSxPQUFPLEVBQUUsQ0FBQyw0Q0FBNEMsQ0FBQyxFQUFFLEVBQUUsdUNBQXVDLEVBQUUsbUJBQW1CLENBQUMseUNBQXlDLENBQUMsQ0FBQztnQkFDblIsSUFBSSxFQUFFLFNBQVM7YUFDZjtTQUNEO1FBQ0Qsb0JBQW9CLEVBQUUsS0FBSztLQUMzQixDQUFDO0lBRUYsTUFBTSw2QkFBNkIsR0FBaUM7UUFDbkUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLHdGQUF3RixDQUFDO1FBQ25JLE9BQU8sRUFBRSxFQUFFO1FBQ1gsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7S0FDbkUsQ0FBQztJQUVGLE1BQU0sd0JBQXdCLEdBQWdCO1FBQzdDLElBQUksRUFBRSxRQUFRO1FBQ2QsVUFBVSxFQUFFO1lBQ1gsT0FBTyxFQUFFO2dCQUNSLElBQUksRUFBRSxTQUFTO2dCQUNmLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDJDQUEyQyxFQUFFLHFFQUFxRSxDQUFDO2dCQUM3SSxlQUFlLEVBQUUsV0FBVzthQUM1QjtZQUNELEtBQUssRUFBRTtnQkFDTixJQUFJLEVBQUUsa0RBQW9CO2dCQUMxQixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx5Q0FBeUMsRUFBRSw4Q0FBOEMsQ0FBQztnQkFDcEgsZUFBZSxFQUFFLFNBQVM7YUFDMUI7U0FDRDtRQUNELG9CQUFvQixFQUFFLEtBQUs7S0FDM0IsQ0FBQztJQUVGLE1BQU0scUNBQXFDLEdBQWlDO1FBQzNFLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLDJGQUEyRixDQUFDO1FBQzdJLE9BQU8sRUFBRSxFQUFFO1FBQ1gsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLHdCQUF3QixFQUFFLGlCQUFpQixFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7S0FDM0UsQ0FBQztJQUVGLE1BQU0sb0NBQW9DLEdBQXVCO1FBQ2hFLEVBQUUsRUFBRSxRQUFRO1FBQ1osS0FBSyxFQUFFLEdBQUc7UUFDVixJQUFJLEVBQUUsUUFBUTtRQUNkLFVBQVUsRUFBRTtZQUNYLENBQUMscUNBQWEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFLDZCQUE2QjtZQUN6RSxDQUFDLHFDQUFhLENBQUMsbUNBQW1DLENBQUMsRUFBRSxxQ0FBcUM7U0FDMUY7S0FDRCxDQUFDO0lBRUYscUJBQXFCLENBQUMscUJBQXFCLENBQUMsb0NBQW9DLENBQUMsQ0FBQztJQUVsRixTQUFnQixvQ0FBb0MsQ0FBQyxNQUE4QjtRQUNsRixzREFBc0Q7UUFDdEQsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RELHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUscUJBQXFCLENBQUMsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ2hHLGlDQUFpQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsaUNBQWlDLENBQUMsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvSCwrQkFBK0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLCtCQUErQixDQUFDLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFckgsTUFBTSw0QkFBNEIsR0FBZ0IsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFDckUsTUFBTSx3QkFBd0IsR0FBZ0IsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFDakUsTUFBTSxnQ0FBZ0MsR0FBZ0IsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFFekUsTUFBTSxlQUFlLEdBQUcsRUFBRSxJQUFJLEVBQUUsdUNBQXVCLEVBQUUsb0JBQW9CLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDdkYsTUFBTSxXQUFXLEdBQUcsRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLG9CQUFvQixFQUFFLEtBQUssRUFBRSxDQUFDO1FBQzdGLEtBQUssTUFBTSxDQUFDLElBQUksTUFBTSxFQUFFLENBQUM7WUFDeEIsNkRBQTZEO1lBQzdELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsR0FBRyxDQUFDO1lBQ3BDLDRCQUE0QixDQUFDLFVBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxlQUFlLENBQUM7WUFDcEUsd0JBQXdCLENBQUMsVUFBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLFdBQVcsQ0FBQztZQUM1RCxnQ0FBZ0MsQ0FBQyxVQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsd0JBQXdCLENBQUM7UUFDbEYsQ0FBQztRQUNELDRCQUE0QixDQUFDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLGVBQWUsRUFBRSxDQUFDO1FBQ2hHLHdCQUF3QixDQUFDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ3hGLGdDQUFnQyxDQUFDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLHdCQUF3QixFQUFFLENBQUM7UUFFN0cseUJBQXlCLENBQUMsS0FBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLDRCQUE0QixDQUFDO1FBQ25FLDZCQUE2QixDQUFDLEtBQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyx3QkFBd0IsQ0FBQztRQUNuRSxxQ0FBcUMsQ0FBQyxLQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsZ0NBQWdDLENBQUM7UUFFbkYscUJBQXFCLENBQUMsZ0NBQWdDLENBQUMsMEJBQTBCLEVBQUUsb0NBQW9DLENBQUMsQ0FBQztJQUMxSCxDQUFDO0lBRUQsU0FBZ0IsdUNBQXVDLENBQUMsTUFBaUM7UUFDeEYsMEJBQTBCLENBQUMsSUFBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUMvRiwwQkFBMEIsQ0FBQyxjQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3BHLDBCQUEwQixDQUFDLGdCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFbEgscUJBQXFCLENBQUMsZ0NBQWdDLENBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBRUQsU0FBZ0IsMENBQTBDLENBQUMsTUFBb0M7UUFDOUYsNkJBQTZCLENBQUMsSUFBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNsRyw2QkFBNkIsQ0FBQyxjQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3ZHLDZCQUE2QixDQUFDLGdCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFckgscUJBQXFCLENBQUMsZ0NBQWdDLENBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBR0QsTUFBYSxrQkFBa0I7UUFDOUIsWUFBb0Isb0JBQTJDO1lBQTNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7UUFDL0QsQ0FBQztRQUVELElBQVcsVUFBVTtZQUNwQixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVMscUNBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5RSxDQUFDO1FBRUQsSUFBVyxhQUFhO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBZ0IscUNBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUN6RixDQUFDO1FBRUQsSUFBVyxnQkFBZ0I7WUFDMUIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFTLHFDQUFhLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBRUQsSUFBVyxtQkFBbUI7WUFDN0IsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUF1QixxQ0FBYSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQzNHLENBQUM7UUFFRCxJQUFXLHdCQUF3QjtZQUNsQyxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQTRCLHFDQUFhLENBQUMsMEJBQTBCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEgsQ0FBQztRQUVELElBQVcsZ0NBQWdDO1lBQzFDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBb0MscUNBQWEsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO1FBQ2pJLENBQUM7UUFFTSxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQTJCLEVBQUUsY0FBa0M7WUFDekYsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMscUNBQWEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUMzRixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsS0FBOEIsRUFBRSxjQUFrQztZQUMvRixNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxxQ0FBYSxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQy9GLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVNLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxLQUFpQyxFQUFFLGNBQWtDO1lBQ3JHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLHFDQUFhLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNsRyxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTSxtQkFBbUI7WUFDekIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxxQ0FBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzlFLE9BQU8sUUFBUSxJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxLQUFLLFFBQVEsQ0FBQyxLQUFLLENBQUM7UUFDL0QsQ0FBQztRQUVNLDJCQUEyQixDQUFDLEdBQVc7WUFDN0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4RCxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDO2dCQUN2RCxvREFBNEM7WUFDN0MsQ0FBQztpQkFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztnQkFDeEQsNkNBQXFDO1lBQ3RDLENBQUM7aUJBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BELCtDQUF1QztZQUN4QyxDQUFDO1lBQ0Qsd0NBQWdDO1FBQ2pDLENBQUM7UUFFTyxLQUFLLENBQUMsa0JBQWtCLENBQUMsR0FBVyxFQUFFLEtBQVUsRUFBRSxjQUFrQztZQUMzRixJQUFJLGNBQWMsS0FBSyxTQUFTLElBQUksY0FBYyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNsRSxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEQsSUFBSSxjQUFjLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQy9CLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUQsQ0FBQztZQUVELElBQUksY0FBYyxxQ0FBNkIsRUFBRSxDQUFDO2dCQUNqRCxJQUFJLEtBQUssS0FBSyxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ2xDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGdCQUFnQjtnQkFDcEQsQ0FBQztxQkFBTSxJQUFJLEtBQUssS0FBSyxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQzVDLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQzt3QkFDM0MsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCO29CQUNwRCxDQUFDO29CQUNELEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQywwQ0FBMEM7Z0JBQzlELENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksY0FBYywwQ0FBa0MsSUFBSSxjQUFjLGlEQUF5QyxJQUFJLGNBQWMsNENBQW9DLEVBQUUsQ0FBQztnQkFDOUssSUFBSSxLQUFLLEtBQUssUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUM5QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0I7Z0JBQ3BELENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDMUUsQ0FBQztLQUNEO0lBdEZELGdEQXNGQyJ9