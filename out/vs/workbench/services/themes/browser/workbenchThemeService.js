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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/registry/common/platform", "vs/base/common/errors", "vs/platform/configuration/common/configuration", "vs/workbench/services/themes/common/colorThemeData", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/workbench/services/themes/common/fileIconThemeSchema", "vs/base/common/lifecycle", "vs/workbench/services/themes/browser/fileIconThemeData", "vs/base/browser/dom", "vs/workbench/services/environment/browser/environmentService", "vs/platform/files/common/files", "vs/base/common/resources", "vs/workbench/services/themes/common/colorThemeSchema", "vs/platform/instantiation/common/extensions", "vs/platform/remote/common/remoteHosts", "vs/workbench/services/layout/browser/layoutService", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/workbench/services/themes/common/themeExtensionPoints", "vs/workbench/services/themes/common/themeConfiguration", "vs/workbench/services/themes/browser/productIconThemeData", "vs/workbench/services/themes/common/productIconThemeSchema", "vs/platform/log/common/log", "vs/base/common/platform", "vs/platform/theme/common/theme", "vs/workbench/services/themes/common/hostColorSchemeService", "vs/base/common/async", "vs/workbench/services/userData/browser/userDataInit", "vs/platform/theme/browser/iconsStyleSheet", "vs/platform/theme/common/colorRegistry", "vs/editor/common/languages/language", "vs/base/browser/window"], function (require, exports, nls, types, extensions_1, workbenchThemeService_1, storage_1, telemetry_1, platform_1, errors, configuration_1, colorThemeData_1, themeService_1, event_1, fileIconThemeSchema_1, lifecycle_1, fileIconThemeData_1, dom_1, environmentService_1, files_1, resources, colorThemeSchema_1, extensions_2, remoteHosts_1, layoutService_1, extensionResourceLoader_1, themeExtensionPoints_1, themeConfiguration_1, productIconThemeData_1, productIconThemeSchema_1, log_1, platform_2, theme_1, hostColorSchemeService_1, async_1, userDataInit_1, iconsStyleSheet_1, colorRegistry_1, language_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchThemeService = void 0;
    // implementation
    const PERSISTED_OS_COLOR_SCHEME = 'osColorScheme';
    const PERSISTED_OS_COLOR_SCHEME_SCOPE = -1 /* StorageScope.APPLICATION */; // the OS scheme depends on settings in the OS
    const defaultThemeExtensionId = 'vscode-theme-defaults';
    const DEFAULT_FILE_ICON_THEME_ID = 'vscode.vscode-theme-seti-vs-seti';
    const fileIconsEnabledClass = 'file-icons-enabled';
    const colorThemeRulesClassName = 'contributedColorTheme';
    const fileIconThemeRulesClassName = 'contributedFileIconTheme';
    const productIconThemeRulesClassName = 'contributedProductIconTheme';
    const themingRegistry = platform_1.Registry.as(themeService_1.Extensions.ThemingContribution);
    function validateThemeId(theme) {
        // migrations
        switch (theme) {
            case workbenchThemeService_1.VS_LIGHT_THEME: return `vs ${defaultThemeExtensionId}-themes-light_vs-json`;
            case workbenchThemeService_1.VS_DARK_THEME: return `vs-dark ${defaultThemeExtensionId}-themes-dark_vs-json`;
            case workbenchThemeService_1.VS_HC_THEME: return `hc-black ${defaultThemeExtensionId}-themes-hc_black-json`;
            case workbenchThemeService_1.VS_HC_LIGHT_THEME: return `hc-light ${defaultThemeExtensionId}-themes-hc_light-json`;
        }
        return theme;
    }
    const colorThemesExtPoint = (0, themeExtensionPoints_1.registerColorThemeExtensionPoint)();
    const fileIconThemesExtPoint = (0, themeExtensionPoints_1.registerFileIconThemeExtensionPoint)();
    const productIconThemesExtPoint = (0, themeExtensionPoints_1.registerProductIconThemeExtensionPoint)();
    let WorkbenchThemeService = class WorkbenchThemeService extends lifecycle_1.Disposable {
        constructor(extensionService, storageService, configurationService, telemetryService, environmentService, fileService, extensionResourceLoaderService, layoutService, logService, hostColorService, userDataInitializationService, languageService) {
            super();
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.environmentService = environmentService;
            this.extensionResourceLoaderService = extensionResourceLoaderService;
            this.logService = logService;
            this.hostColorService = hostColorService;
            this.userDataInitializationService = userDataInitializationService;
            this.languageService = languageService;
            this.hasDefaultUpdated = false;
            this.themeExtensionsActivated = new Map();
            this.container = layoutService.mainContainer;
            this.settings = new themeConfiguration_1.ThemeConfiguration(configurationService);
            this.colorThemeRegistry = this._register(new themeExtensionPoints_1.ThemeRegistry(colorThemesExtPoint, colorThemeData_1.ColorThemeData.fromExtensionTheme));
            this.colorThemeWatcher = this._register(new ThemeFileWatcher(fileService, environmentService, this.reloadCurrentColorTheme.bind(this)));
            this.onColorThemeChange = new event_1.Emitter({ leakWarningThreshold: 400 });
            this.currentColorTheme = colorThemeData_1.ColorThemeData.createUnloadedTheme('');
            this.colorThemeSequencer = new async_1.Sequencer();
            this.fileIconThemeWatcher = this._register(new ThemeFileWatcher(fileService, environmentService, this.reloadCurrentFileIconTheme.bind(this)));
            this.fileIconThemeRegistry = this._register(new themeExtensionPoints_1.ThemeRegistry(fileIconThemesExtPoint, fileIconThemeData_1.FileIconThemeData.fromExtensionTheme, true, fileIconThemeData_1.FileIconThemeData.noIconTheme));
            this.fileIconThemeLoader = new fileIconThemeData_1.FileIconThemeLoader(extensionResourceLoaderService, languageService);
            this.onFileIconThemeChange = new event_1.Emitter({ leakWarningThreshold: 400 });
            this.currentFileIconTheme = fileIconThemeData_1.FileIconThemeData.createUnloadedTheme('');
            this.fileIconThemeSequencer = new async_1.Sequencer();
            this.productIconThemeWatcher = this._register(new ThemeFileWatcher(fileService, environmentService, this.reloadCurrentProductIconTheme.bind(this)));
            this.productIconThemeRegistry = this._register(new themeExtensionPoints_1.ThemeRegistry(productIconThemesExtPoint, productIconThemeData_1.ProductIconThemeData.fromExtensionTheme, true, productIconThemeData_1.ProductIconThemeData.defaultTheme));
            this.onProductIconThemeChange = new event_1.Emitter();
            this.currentProductIconTheme = productIconThemeData_1.ProductIconThemeData.createUnloadedTheme('');
            this.productIconThemeSequencer = new async_1.Sequencer();
            // In order to avoid paint flashing for tokens, because
            // themes are loaded asynchronously, we need to initialize
            // a color theme document with good defaults until the theme is loaded
            let themeData = colorThemeData_1.ColorThemeData.fromStorageData(this.storageService);
            const colorThemeSetting = this.settings.colorTheme;
            if (themeData && colorThemeSetting !== themeData.settingsId && this.settings.isDefaultColorTheme()) {
                this.hasDefaultUpdated = themeData.settingsId === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK_OLD || themeData.settingsId === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT_OLD;
                // the web has different defaults than the desktop, therefore do not restore when the setting is the default theme and the storage doesn't match that.
                themeData = undefined;
            }
            // the preferred color scheme (high contrast, light, dark) has changed since the last start
            const preferredColorScheme = this.getPreferredColorScheme();
            const defaultColorMap = colorThemeSetting === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT ? workbenchThemeService_1.COLOR_THEME_LIGHT_INITIAL_COLORS : colorThemeSetting === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK ? workbenchThemeService_1.COLOR_THEME_DARK_INITIAL_COLORS : undefined;
            if (preferredColorScheme && themeData?.type !== preferredColorScheme && this.storageService.get(PERSISTED_OS_COLOR_SCHEME, PERSISTED_OS_COLOR_SCHEME_SCOPE) !== preferredColorScheme) {
                themeData = colorThemeData_1.ColorThemeData.createUnloadedThemeForThemeType(preferredColorScheme, undefined);
            }
            if (!themeData) {
                const initialColorTheme = environmentService.options?.initialColorTheme;
                if (initialColorTheme) {
                    themeData = colorThemeData_1.ColorThemeData.createUnloadedThemeForThemeType(initialColorTheme.themeType, initialColorTheme.colors ?? defaultColorMap);
                }
            }
            if (!themeData) {
                themeData = colorThemeData_1.ColorThemeData.createUnloadedThemeForThemeType(platform_2.isWeb ? theme_1.ColorScheme.LIGHT : theme_1.ColorScheme.DARK, defaultColorMap);
            }
            themeData.setCustomizations(this.settings);
            this.applyTheme(themeData, undefined, true);
            const fileIconData = fileIconThemeData_1.FileIconThemeData.fromStorageData(this.storageService);
            if (fileIconData) {
                this.applyAndSetFileIconTheme(fileIconData, true);
            }
            const productIconData = productIconThemeData_1.ProductIconThemeData.fromStorageData(this.storageService);
            if (productIconData) {
                this.applyAndSetProductIconTheme(productIconData, true);
            }
            extensionService.whenInstalledExtensionsRegistered().then(_ => {
                this.installConfigurationListener();
                this.installPreferredSchemeListener();
                this.installRegistryListeners();
                this.initialize().catch(errors.onUnexpectedError);
            });
            const codiconStyleSheet = (0, dom_1.createStyleSheet)();
            codiconStyleSheet.id = 'codiconStyles';
            const iconsStyleSheet = this._register((0, iconsStyleSheet_1.getIconsStyleSheet)(this));
            function updateAll() {
                codiconStyleSheet.textContent = iconsStyleSheet.getCSS();
            }
            const delayer = this._register(new async_1.RunOnceScheduler(updateAll, 0));
            this._register(iconsStyleSheet.onDidChange(() => delayer.schedule()));
            delayer.schedule();
        }
        initialize() {
            const extDevLocs = this.environmentService.extensionDevelopmentLocationURI;
            const extDevLoc = extDevLocs && extDevLocs.length === 1 ? extDevLocs[0] : undefined; // in dev mode, switch to a theme provided by the extension under dev.
            const initializeColorTheme = async () => {
                const devThemes = this.colorThemeRegistry.findThemeByExtensionLocation(extDevLoc);
                if (devThemes.length) {
                    const matchedColorTheme = devThemes.find(theme => theme.type === this.currentColorTheme.type);
                    return this.setColorTheme(matchedColorTheme ? matchedColorTheme.id : devThemes[0].id, undefined);
                }
                const preferredColorScheme = this.getPreferredColorScheme();
                const prevScheme = this.storageService.get(PERSISTED_OS_COLOR_SCHEME, PERSISTED_OS_COLOR_SCHEME_SCOPE);
                if (preferredColorScheme !== prevScheme) {
                    this.storageService.store(PERSISTED_OS_COLOR_SCHEME, preferredColorScheme, PERSISTED_OS_COLOR_SCHEME_SCOPE, 0 /* StorageTarget.USER */);
                    if (preferredColorScheme && this.currentColorTheme.type !== preferredColorScheme) {
                        return this.applyPreferredColorTheme(preferredColorScheme);
                    }
                }
                let theme = this.colorThemeRegistry.findThemeBySettingsId(this.settings.colorTheme, undefined);
                if (!theme) {
                    // If the current theme is not available, first make sure setting sync is complete
                    await this.userDataInitializationService.whenInitializationFinished();
                    // try to get the theme again, now with a fallback to the default themes
                    const fallbackTheme = this.currentColorTheme.type === theme_1.ColorScheme.LIGHT ? workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT : workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK;
                    theme = this.colorThemeRegistry.findThemeBySettingsId(this.settings.colorTheme, fallbackTheme);
                }
                return this.setColorTheme(theme && theme.id, undefined);
            };
            const initializeFileIconTheme = async () => {
                const devThemes = this.fileIconThemeRegistry.findThemeByExtensionLocation(extDevLoc);
                if (devThemes.length) {
                    return this.setFileIconTheme(devThemes[0].id, 8 /* ConfigurationTarget.MEMORY */);
                }
                let theme = this.fileIconThemeRegistry.findThemeBySettingsId(this.settings.fileIconTheme);
                if (!theme) {
                    // If the current theme is not available, first make sure setting sync is complete
                    await this.userDataInitializationService.whenInitializationFinished();
                    theme = this.fileIconThemeRegistry.findThemeBySettingsId(this.settings.fileIconTheme);
                }
                return this.setFileIconTheme(theme ? theme.id : DEFAULT_FILE_ICON_THEME_ID, undefined);
            };
            const initializeProductIconTheme = async () => {
                const devThemes = this.productIconThemeRegistry.findThemeByExtensionLocation(extDevLoc);
                if (devThemes.length) {
                    return this.setProductIconTheme(devThemes[0].id, 8 /* ConfigurationTarget.MEMORY */);
                }
                let theme = this.productIconThemeRegistry.findThemeBySettingsId(this.settings.productIconTheme);
                if (!theme) {
                    // If the current theme is not available, first make sure setting sync is complete
                    await this.userDataInitializationService.whenInitializationFinished();
                    theme = this.productIconThemeRegistry.findThemeBySettingsId(this.settings.productIconTheme);
                }
                return this.setProductIconTheme(theme ? theme.id : productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID, undefined);
            };
            return Promise.all([initializeColorTheme(), initializeFileIconTheme(), initializeProductIconTheme()]);
        }
        installConfigurationListener() {
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                let lazyPreferredColorScheme = null;
                const getPreferredColorScheme = () => {
                    if (lazyPreferredColorScheme === null) {
                        lazyPreferredColorScheme = this.getPreferredColorScheme();
                    }
                    return lazyPreferredColorScheme;
                };
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.COLOR_THEME)) {
                    this.restoreColorTheme();
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME) || e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.DETECT_HC)) {
                    this.handlePreferredSchemeUpdated();
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME) && getPreferredColorScheme() === theme_1.ColorScheme.DARK) {
                    this.applyPreferredColorTheme(theme_1.ColorScheme.DARK);
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME) && getPreferredColorScheme() === theme_1.ColorScheme.LIGHT) {
                    this.applyPreferredColorTheme(theme_1.ColorScheme.LIGHT);
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME) && getPreferredColorScheme() === theme_1.ColorScheme.HIGH_CONTRAST_DARK) {
                    this.applyPreferredColorTheme(theme_1.ColorScheme.HIGH_CONTRAST_DARK);
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME) && getPreferredColorScheme() === theme_1.ColorScheme.HIGH_CONTRAST_LIGHT) {
                    this.applyPreferredColorTheme(theme_1.ColorScheme.HIGH_CONTRAST_LIGHT);
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME)) {
                    this.restoreFileIconTheme();
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PRODUCT_ICON_THEME)) {
                    this.restoreProductIconTheme();
                }
                if (this.currentColorTheme) {
                    let hasColorChanges = false;
                    if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.COLOR_CUSTOMIZATIONS)) {
                        this.currentColorTheme.setCustomColors(this.settings.colorCustomizations);
                        hasColorChanges = true;
                    }
                    if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.TOKEN_COLOR_CUSTOMIZATIONS)) {
                        this.currentColorTheme.setCustomTokenColors(this.settings.tokenColorCustomizations);
                        hasColorChanges = true;
                    }
                    if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS)) {
                        this.currentColorTheme.setCustomSemanticTokenColors(this.settings.semanticTokenColorCustomizations);
                        hasColorChanges = true;
                    }
                    if (hasColorChanges) {
                        this.updateDynamicCSSRules(this.currentColorTheme);
                        this.onColorThemeChange.fire(this.currentColorTheme);
                    }
                }
            }));
        }
        installRegistryListeners() {
            let prevColorId = undefined;
            // update settings schema setting for theme specific settings
            this._register(this.colorThemeRegistry.onDidChange(async (event) => {
                (0, themeConfiguration_1.updateColorThemeConfigurationSchemas)(event.themes);
                if (await this.restoreColorTheme()) { // checks if theme from settings exists and is set
                    // restore theme
                    if (this.currentColorTheme.settingsId === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK && !types.isUndefined(prevColorId) && await this.colorThemeRegistry.findThemeById(prevColorId)) {
                        await this.setColorTheme(prevColorId, 'auto');
                        prevColorId = undefined;
                    }
                    else if (event.added.some(t => t.settingsId === this.currentColorTheme.settingsId)) {
                        await this.reloadCurrentColorTheme();
                    }
                }
                else if (event.removed.some(t => t.settingsId === this.currentColorTheme.settingsId)) {
                    // current theme is no longer available
                    prevColorId = this.currentColorTheme.id;
                    const defaultTheme = this.colorThemeRegistry.findThemeBySettingsId(workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK);
                    await this.setColorTheme(defaultTheme, 'auto');
                }
            }));
            let prevFileIconId = undefined;
            this._register(this._register(this.fileIconThemeRegistry.onDidChange(async (event) => {
                (0, themeConfiguration_1.updateFileIconThemeConfigurationSchemas)(event.themes);
                if (await this.restoreFileIconTheme()) { // checks if theme from settings exists and is set
                    // restore theme
                    if (this.currentFileIconTheme.id === DEFAULT_FILE_ICON_THEME_ID && !types.isUndefined(prevFileIconId) && this.fileIconThemeRegistry.findThemeById(prevFileIconId)) {
                        await this.setFileIconTheme(prevFileIconId, 'auto');
                        prevFileIconId = undefined;
                    }
                    else if (event.added.some(t => t.settingsId === this.currentFileIconTheme.settingsId)) {
                        await this.reloadCurrentFileIconTheme();
                    }
                }
                else if (event.removed.some(t => t.settingsId === this.currentFileIconTheme.settingsId)) {
                    // current theme is no longer available
                    prevFileIconId = this.currentFileIconTheme.id;
                    await this.setFileIconTheme(DEFAULT_FILE_ICON_THEME_ID, 'auto');
                }
            })));
            let prevProductIconId = undefined;
            this._register(this.productIconThemeRegistry.onDidChange(async (event) => {
                (0, themeConfiguration_1.updateProductIconThemeConfigurationSchemas)(event.themes);
                if (await this.restoreProductIconTheme()) { // checks if theme from settings exists and is set
                    // restore theme
                    if (this.currentProductIconTheme.id === productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID && !types.isUndefined(prevProductIconId) && this.productIconThemeRegistry.findThemeById(prevProductIconId)) {
                        await this.setProductIconTheme(prevProductIconId, 'auto');
                        prevProductIconId = undefined;
                    }
                    else if (event.added.some(t => t.settingsId === this.currentProductIconTheme.settingsId)) {
                        await this.reloadCurrentProductIconTheme();
                    }
                }
                else if (event.removed.some(t => t.settingsId === this.currentProductIconTheme.settingsId)) {
                    // current theme is no longer available
                    prevProductIconId = this.currentProductIconTheme.id;
                    await this.setProductIconTheme(productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID, 'auto');
                }
            }));
            this._register(this.languageService.onDidChange(() => this.reloadCurrentFileIconTheme()));
            return Promise.all([this.getColorThemes(), this.getFileIconThemes(), this.getProductIconThemes()]).then(([ct, fit, pit]) => {
                (0, themeConfiguration_1.updateColorThemeConfigurationSchemas)(ct);
                (0, themeConfiguration_1.updateFileIconThemeConfigurationSchemas)(fit);
                (0, themeConfiguration_1.updateProductIconThemeConfigurationSchemas)(pit);
            });
        }
        // preferred scheme handling
        installPreferredSchemeListener() {
            this._register(this.hostColorService.onDidChangeColorScheme(() => this.handlePreferredSchemeUpdated()));
        }
        async handlePreferredSchemeUpdated() {
            const scheme = this.getPreferredColorScheme();
            const prevScheme = this.storageService.get(PERSISTED_OS_COLOR_SCHEME, PERSISTED_OS_COLOR_SCHEME_SCOPE);
            if (scheme !== prevScheme) {
                this.storageService.store(PERSISTED_OS_COLOR_SCHEME, scheme, PERSISTED_OS_COLOR_SCHEME_SCOPE, 1 /* StorageTarget.MACHINE */);
                if (scheme) {
                    if (!prevScheme) {
                        // remember the theme before scheme switching
                        this.themeSettingIdBeforeSchemeSwitch = this.settings.colorTheme;
                    }
                    return this.applyPreferredColorTheme(scheme);
                }
                else if (prevScheme && this.themeSettingIdBeforeSchemeSwitch) {
                    // reapply the theme before scheme switching
                    const theme = this.colorThemeRegistry.findThemeBySettingsId(this.themeSettingIdBeforeSchemeSwitch, undefined);
                    if (theme) {
                        this.setColorTheme(theme.id, 'auto');
                    }
                }
            }
            return undefined;
        }
        getPreferredColorScheme() {
            if (this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.DETECT_HC) && this.hostColorService.highContrast) {
                return this.hostColorService.dark ? theme_1.ColorScheme.HIGH_CONTRAST_DARK : theme_1.ColorScheme.HIGH_CONTRAST_LIGHT;
            }
            if (this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME)) {
                return this.hostColorService.dark ? theme_1.ColorScheme.DARK : theme_1.ColorScheme.LIGHT;
            }
            return undefined;
        }
        async applyPreferredColorTheme(type) {
            let settingId;
            switch (type) {
                case theme_1.ColorScheme.LIGHT:
                    settingId = workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME;
                    break;
                case theme_1.ColorScheme.HIGH_CONTRAST_DARK:
                    settingId = workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME;
                    break;
                case theme_1.ColorScheme.HIGH_CONTRAST_LIGHT:
                    settingId = workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME;
                    break;
                default:
                    settingId = workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME;
            }
            const themeSettingId = this.configurationService.getValue(settingId);
            if (themeSettingId && typeof themeSettingId === 'string') {
                const theme = this.colorThemeRegistry.findThemeBySettingsId(themeSettingId, undefined);
                if (theme) {
                    const configurationTarget = this.settings.findAutoConfigurationTarget(settingId);
                    return this.setColorTheme(theme.id, configurationTarget);
                }
            }
            return null;
        }
        hasUpdatedDefaultThemes() {
            return this.hasDefaultUpdated;
        }
        getColorTheme() {
            return this.currentColorTheme;
        }
        async getColorThemes() {
            return this.colorThemeRegistry.getThemes();
        }
        async getMarketplaceColorThemes(publisher, name, version) {
            const extensionLocation = this.extensionResourceLoaderService.getExtensionGalleryResourceURL({ publisher, name, version }, 'extension');
            if (extensionLocation) {
                try {
                    const manifestContent = await this.extensionResourceLoaderService.readExtensionResource(resources.joinPath(extensionLocation, 'package.json'));
                    return this.colorThemeRegistry.getMarketplaceThemes(JSON.parse(manifestContent), extensionLocation, workbenchThemeService_1.ExtensionData.fromName(publisher, name));
                }
                catch (e) {
                    this.logService.error('Problem loading themes from marketplace', e);
                }
            }
            return [];
        }
        get onDidColorThemeChange() {
            return this.onColorThemeChange.event;
        }
        setColorTheme(themeIdOrTheme, settingsTarget) {
            return this.colorThemeSequencer.queue(async () => {
                return this.internalSetColorTheme(themeIdOrTheme, settingsTarget);
            });
        }
        async internalSetColorTheme(themeIdOrTheme, settingsTarget) {
            if (!themeIdOrTheme) {
                return null;
            }
            const themeId = types.isString(themeIdOrTheme) ? validateThemeId(themeIdOrTheme) : themeIdOrTheme.id;
            if (this.currentColorTheme.isLoaded && themeId === this.currentColorTheme.id) {
                if (settingsTarget !== 'preview') {
                    this.currentColorTheme.toStorage(this.storageService);
                }
                return this.settings.setColorTheme(this.currentColorTheme, settingsTarget);
            }
            let themeData = this.colorThemeRegistry.findThemeById(themeId);
            if (!themeData) {
                if (themeIdOrTheme instanceof colorThemeData_1.ColorThemeData) {
                    themeData = themeIdOrTheme;
                }
                else {
                    return null;
                }
            }
            try {
                await themeData.ensureLoaded(this.extensionResourceLoaderService);
                themeData.setCustomizations(this.settings);
                return this.applyTheme(themeData, settingsTarget);
            }
            catch (error) {
                throw new Error(nls.localize('error.cannotloadtheme', "Unable to load {0}: {1}", themeData.location?.toString(), error.message));
            }
        }
        reloadCurrentColorTheme() {
            return this.colorThemeSequencer.queue(async () => {
                try {
                    const theme = this.colorThemeRegistry.findThemeBySettingsId(this.currentColorTheme.settingsId) || this.currentColorTheme;
                    await theme.reload(this.extensionResourceLoaderService);
                    theme.setCustomizations(this.settings);
                    await this.applyTheme(theme, undefined, false);
                }
                catch (error) {
                    this.logService.info('Unable to reload {0}: {1}', this.currentColorTheme.location?.toString());
                }
            });
        }
        async restoreColorTheme() {
            return this.colorThemeSequencer.queue(async () => {
                const settingId = this.settings.colorTheme;
                const theme = this.colorThemeRegistry.findThemeBySettingsId(settingId);
                if (theme) {
                    if (settingId !== this.currentColorTheme.settingsId) {
                        await this.internalSetColorTheme(theme.id, undefined);
                    }
                    else if (theme !== this.currentColorTheme) {
                        await theme.ensureLoaded(this.extensionResourceLoaderService);
                        theme.setCustomizations(this.settings);
                        await this.applyTheme(theme, undefined, true);
                    }
                    return true;
                }
                return false;
            });
        }
        updateDynamicCSSRules(themeData) {
            const cssRules = new Set();
            const ruleCollector = {
                addRule: (rule) => {
                    if (!cssRules.has(rule)) {
                        cssRules.add(rule);
                    }
                }
            };
            ruleCollector.addRule(`.monaco-workbench { forced-color-adjust: none; }`);
            themingRegistry.getThemingParticipants().forEach(p => p(themeData, ruleCollector, this.environmentService));
            const colorVariables = [];
            for (const item of (0, colorRegistry_1.getColorRegistry)().getColors()) {
                const color = themeData.getColor(item.id, true);
                if (color) {
                    colorVariables.push(`${(0, colorRegistry_1.asCssVariableName)(item.id)}: ${color.toString()};`);
                }
            }
            ruleCollector.addRule(`.monaco-workbench { ${colorVariables.join('\n')} }`);
            _applyRules([...cssRules].join('\n'), colorThemeRulesClassName);
        }
        applyTheme(newTheme, settingsTarget, silent = false) {
            this.updateDynamicCSSRules(newTheme);
            if (this.currentColorTheme.id) {
                this.container.classList.remove(...this.currentColorTheme.classNames);
            }
            else {
                this.container.classList.remove(workbenchThemeService_1.VS_DARK_THEME, workbenchThemeService_1.VS_LIGHT_THEME, workbenchThemeService_1.VS_HC_THEME, workbenchThemeService_1.VS_HC_LIGHT_THEME);
            }
            this.container.classList.add(...newTheme.classNames);
            this.currentColorTheme.clearCaches();
            this.currentColorTheme = newTheme;
            if (!this.colorThemingParticipantChangeListener) {
                this.colorThemingParticipantChangeListener = themingRegistry.onThemingParticipantAdded(_ => this.updateDynamicCSSRules(this.currentColorTheme));
            }
            this.colorThemeWatcher.update(newTheme);
            this.sendTelemetry(newTheme.id, newTheme.extensionData, 'color');
            if (silent) {
                return Promise.resolve(null);
            }
            this.onColorThemeChange.fire(this.currentColorTheme);
            // remember theme data for a quick restore
            if (newTheme.isLoaded && settingsTarget !== 'preview') {
                newTheme.toStorage(this.storageService);
            }
            return this.settings.setColorTheme(this.currentColorTheme, settingsTarget);
        }
        sendTelemetry(themeId, themeData, themeType) {
            if (themeData) {
                const key = themeType + themeData.extensionId;
                if (!this.themeExtensionsActivated.get(key)) {
                    this.telemetryService.publicLog2('activatePlugin', {
                        id: themeData.extensionId,
                        name: themeData.extensionName,
                        isBuiltin: themeData.extensionIsBuiltin,
                        publisherDisplayName: themeData.extensionPublisher,
                        themeId: themeId
                    });
                    this.themeExtensionsActivated.set(key, true);
                }
            }
        }
        async getFileIconThemes() {
            return this.fileIconThemeRegistry.getThemes();
        }
        getFileIconTheme() {
            return this.currentFileIconTheme;
        }
        get onDidFileIconThemeChange() {
            return this.onFileIconThemeChange.event;
        }
        async setFileIconTheme(iconThemeOrId, settingsTarget) {
            return this.fileIconThemeSequencer.queue(async () => {
                return this.internalSetFileIconTheme(iconThemeOrId, settingsTarget);
            });
        }
        async internalSetFileIconTheme(iconThemeOrId, settingsTarget) {
            if (iconThemeOrId === undefined) {
                iconThemeOrId = '';
            }
            const themeId = types.isString(iconThemeOrId) ? iconThemeOrId : iconThemeOrId.id;
            if (themeId !== this.currentFileIconTheme.id || !this.currentFileIconTheme.isLoaded) {
                let newThemeData = this.fileIconThemeRegistry.findThemeById(themeId);
                if (!newThemeData && iconThemeOrId instanceof fileIconThemeData_1.FileIconThemeData) {
                    newThemeData = iconThemeOrId;
                }
                if (!newThemeData) {
                    newThemeData = fileIconThemeData_1.FileIconThemeData.noIconTheme;
                }
                await newThemeData.ensureLoaded(this.fileIconThemeLoader);
                this.applyAndSetFileIconTheme(newThemeData); // updates this.currentFileIconTheme
            }
            const themeData = this.currentFileIconTheme;
            // remember theme data for a quick restore
            if (themeData.isLoaded && settingsTarget !== 'preview' && (!themeData.location || !(0, remoteHosts_1.getRemoteAuthority)(themeData.location))) {
                themeData.toStorage(this.storageService);
            }
            await this.settings.setFileIconTheme(this.currentFileIconTheme, settingsTarget);
            return themeData;
        }
        async getMarketplaceFileIconThemes(publisher, name, version) {
            const extensionLocation = this.extensionResourceLoaderService.getExtensionGalleryResourceURL({ publisher, name, version }, 'extension');
            if (extensionLocation) {
                try {
                    const manifestContent = await this.extensionResourceLoaderService.readExtensionResource(resources.joinPath(extensionLocation, 'package.json'));
                    return this.fileIconThemeRegistry.getMarketplaceThemes(JSON.parse(manifestContent), extensionLocation, workbenchThemeService_1.ExtensionData.fromName(publisher, name));
                }
                catch (e) {
                    this.logService.error('Problem loading themes from marketplace', e);
                }
            }
            return [];
        }
        async reloadCurrentFileIconTheme() {
            return this.fileIconThemeSequencer.queue(async () => {
                await this.currentFileIconTheme.reload(this.fileIconThemeLoader);
                this.applyAndSetFileIconTheme(this.currentFileIconTheme);
            });
        }
        async restoreFileIconTheme() {
            return this.fileIconThemeSequencer.queue(async () => {
                const settingId = this.settings.fileIconTheme;
                const theme = this.fileIconThemeRegistry.findThemeBySettingsId(settingId);
                if (theme) {
                    if (settingId !== this.currentFileIconTheme.settingsId) {
                        await this.internalSetFileIconTheme(theme.id, undefined);
                    }
                    else if (theme !== this.currentFileIconTheme) {
                        await theme.ensureLoaded(this.fileIconThemeLoader);
                        this.applyAndSetFileIconTheme(theme, true);
                    }
                    return true;
                }
                return false;
            });
        }
        applyAndSetFileIconTheme(iconThemeData, silent = false) {
            this.currentFileIconTheme = iconThemeData;
            _applyRules(iconThemeData.styleSheetContent, fileIconThemeRulesClassName);
            if (iconThemeData.id) {
                this.container.classList.add(fileIconsEnabledClass);
            }
            else {
                this.container.classList.remove(fileIconsEnabledClass);
            }
            this.fileIconThemeWatcher.update(iconThemeData);
            if (iconThemeData.id) {
                this.sendTelemetry(iconThemeData.id, iconThemeData.extensionData, 'fileIcon');
            }
            if (!silent) {
                this.onFileIconThemeChange.fire(this.currentFileIconTheme);
            }
        }
        async getProductIconThemes() {
            return this.productIconThemeRegistry.getThemes();
        }
        getProductIconTheme() {
            return this.currentProductIconTheme;
        }
        get onDidProductIconThemeChange() {
            return this.onProductIconThemeChange.event;
        }
        async setProductIconTheme(iconThemeOrId, settingsTarget) {
            return this.productIconThemeSequencer.queue(async () => {
                return this.internalSetProductIconTheme(iconThemeOrId, settingsTarget);
            });
        }
        async internalSetProductIconTheme(iconThemeOrId, settingsTarget) {
            if (iconThemeOrId === undefined) {
                iconThemeOrId = '';
            }
            const themeId = types.isString(iconThemeOrId) ? iconThemeOrId : iconThemeOrId.id;
            if (themeId !== this.currentProductIconTheme.id || !this.currentProductIconTheme.isLoaded) {
                let newThemeData = this.productIconThemeRegistry.findThemeById(themeId);
                if (!newThemeData && iconThemeOrId instanceof productIconThemeData_1.ProductIconThemeData) {
                    newThemeData = iconThemeOrId;
                }
                if (!newThemeData) {
                    newThemeData = productIconThemeData_1.ProductIconThemeData.defaultTheme;
                }
                await newThemeData.ensureLoaded(this.extensionResourceLoaderService, this.logService);
                this.applyAndSetProductIconTheme(newThemeData); // updates this.currentProductIconTheme
            }
            const themeData = this.currentProductIconTheme;
            // remember theme data for a quick restore
            if (themeData.isLoaded && settingsTarget !== 'preview' && (!themeData.location || !(0, remoteHosts_1.getRemoteAuthority)(themeData.location))) {
                themeData.toStorage(this.storageService);
            }
            await this.settings.setProductIconTheme(this.currentProductIconTheme, settingsTarget);
            return themeData;
        }
        async getMarketplaceProductIconThemes(publisher, name, version) {
            const extensionLocation = this.extensionResourceLoaderService.getExtensionGalleryResourceURL({ publisher, name, version }, 'extension');
            if (extensionLocation) {
                try {
                    const manifestContent = await this.extensionResourceLoaderService.readExtensionResource(resources.joinPath(extensionLocation, 'package.json'));
                    return this.productIconThemeRegistry.getMarketplaceThemes(JSON.parse(manifestContent), extensionLocation, workbenchThemeService_1.ExtensionData.fromName(publisher, name));
                }
                catch (e) {
                    this.logService.error('Problem loading themes from marketplace', e);
                }
            }
            return [];
        }
        async reloadCurrentProductIconTheme() {
            return this.productIconThemeSequencer.queue(async () => {
                await this.currentProductIconTheme.reload(this.extensionResourceLoaderService, this.logService);
                this.applyAndSetProductIconTheme(this.currentProductIconTheme);
            });
        }
        async restoreProductIconTheme() {
            return this.productIconThemeSequencer.queue(async () => {
                const settingId = this.settings.productIconTheme;
                const theme = this.productIconThemeRegistry.findThemeBySettingsId(settingId);
                if (theme) {
                    if (settingId !== this.currentProductIconTheme.settingsId) {
                        await this.internalSetProductIconTheme(theme.id, undefined);
                    }
                    else if (theme !== this.currentProductIconTheme) {
                        await theme.ensureLoaded(this.extensionResourceLoaderService, this.logService);
                        this.applyAndSetProductIconTheme(theme, true);
                    }
                    return true;
                }
                return false;
            });
        }
        applyAndSetProductIconTheme(iconThemeData, silent = false) {
            this.currentProductIconTheme = iconThemeData;
            _applyRules(iconThemeData.styleSheetContent, productIconThemeRulesClassName);
            this.productIconThemeWatcher.update(iconThemeData);
            if (iconThemeData.id) {
                this.sendTelemetry(iconThemeData.id, iconThemeData.extensionData, 'productIcon');
            }
            if (!silent) {
                this.onProductIconThemeChange.fire(this.currentProductIconTheme);
            }
        }
    };
    exports.WorkbenchThemeService = WorkbenchThemeService;
    exports.WorkbenchThemeService = WorkbenchThemeService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, storage_1.IStorageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(7, layoutService_1.IWorkbenchLayoutService),
        __param(8, log_1.ILogService),
        __param(9, hostColorSchemeService_1.IHostColorSchemeService),
        __param(10, userDataInit_1.IUserDataInitializationService),
        __param(11, language_1.ILanguageService)
    ], WorkbenchThemeService);
    class ThemeFileWatcher {
        constructor(fileService, environmentService, onUpdate) {
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.onUpdate = onUpdate;
        }
        update(theme) {
            if (!resources.isEqual(theme.location, this.watchedLocation)) {
                this.dispose();
                if (theme.location && (theme.watch || this.environmentService.isExtensionDevelopment)) {
                    this.watchedLocation = theme.location;
                    this.watcherDisposable = this.fileService.watch(theme.location);
                    this.fileService.onDidFilesChange(e => {
                        if (this.watchedLocation && e.contains(this.watchedLocation, 0 /* FileChangeType.UPDATED */)) {
                            this.onUpdate();
                        }
                    });
                }
            }
        }
        dispose() {
            this.watcherDisposable = (0, lifecycle_1.dispose)(this.watcherDisposable);
            this.fileChangeListener = (0, lifecycle_1.dispose)(this.fileChangeListener);
            this.watchedLocation = undefined;
        }
    }
    function _applyRules(styleSheetContent, rulesClassName) {
        const themeStyles = window_1.mainWindow.document.head.getElementsByClassName(rulesClassName);
        if (themeStyles.length === 0) {
            const elStyle = (0, dom_1.createStyleSheet)();
            elStyle.className = rulesClassName;
            elStyle.textContent = styleSheetContent;
        }
        else {
            themeStyles[0].textContent = styleSheetContent;
        }
    }
    (0, colorThemeSchema_1.registerColorThemeSchemas)();
    (0, fileIconThemeSchema_1.registerFileIconThemeSchemas)();
    (0, productIconThemeSchema_1.registerProductIconThemeSchemas)();
    // The WorkbenchThemeService should stay eager as the constructor restores the
    // last used colors / icons from storage. This needs to happen as quickly as possible
    // for a flicker-free startup experience.
    (0, extensions_2.registerSingleton)(workbenchThemeService_1.IWorkbenchThemeService, WorkbenchThemeService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoVGhlbWVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGhlbWVzL2Jyb3dzZXIvd29ya2JlbmNoVGhlbWVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTBDaEcsaUJBQWlCO0lBRWpCLE1BQU0seUJBQXlCLEdBQUcsZUFBZSxDQUFDO0lBQ2xELE1BQU0sK0JBQStCLG9DQUEyQixDQUFDLENBQUMsOENBQThDO0lBRWhILE1BQU0sdUJBQXVCLEdBQUcsdUJBQXVCLENBQUM7SUFFeEQsTUFBTSwwQkFBMEIsR0FBRyxrQ0FBa0MsQ0FBQztJQUN0RSxNQUFNLHFCQUFxQixHQUFHLG9CQUFvQixDQUFDO0lBRW5ELE1BQU0sd0JBQXdCLEdBQUcsdUJBQXVCLENBQUM7SUFDekQsTUFBTSwyQkFBMkIsR0FBRywwQkFBMEIsQ0FBQztJQUMvRCxNQUFNLDhCQUE4QixHQUFHLDZCQUE2QixDQUFDO0lBRXJFLE1BQU0sZUFBZSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFtQix5QkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBRTdGLFNBQVMsZUFBZSxDQUFDLEtBQWE7UUFDckMsYUFBYTtRQUNiLFFBQVEsS0FBSyxFQUFFLENBQUM7WUFDZixLQUFLLHNDQUFjLENBQUMsQ0FBQyxPQUFPLE1BQU0sdUJBQXVCLHVCQUF1QixDQUFDO1lBQ2pGLEtBQUsscUNBQWEsQ0FBQyxDQUFDLE9BQU8sV0FBVyx1QkFBdUIsc0JBQXNCLENBQUM7WUFDcEYsS0FBSyxtQ0FBVyxDQUFDLENBQUMsT0FBTyxZQUFZLHVCQUF1Qix1QkFBdUIsQ0FBQztZQUNwRixLQUFLLHlDQUFpQixDQUFDLENBQUMsT0FBTyxZQUFZLHVCQUF1Qix1QkFBdUIsQ0FB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