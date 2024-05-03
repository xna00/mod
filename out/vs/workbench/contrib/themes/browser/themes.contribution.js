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
define(["require", "exports", "vs/nls", "vs/base/common/keyCodes", "vs/platform/actions/common/actions", "vs/base/common/strings", "vs/platform/registry/common/platform", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorService", "vs/base/common/color", "vs/platform/theme/common/theme", "vs/workbench/services/themes/common/colorThemeSchema", "vs/base/common/errors", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/themes/browser/productIconThemeData", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/base/common/themables", "vs/base/common/event", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/instantiation/common/instantiation", "vs/platform/commands/common/commands", "vs/workbench/services/themes/browser/fileIconThemeData", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/workbench/common/contributions", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/base/common/platform", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/host/browser/host", "vs/base/browser/window"], function (require, exports, nls_1, keyCodes_1, actions_1, strings_1, platform_1, actionCommonCategories_1, workbenchThemeService_1, extensions_1, extensionManagement_1, colorRegistry_1, editorService_1, color_1, theme_1, colorThemeSchema_1, errors_1, quickInput_1, productIconThemeData_1, panecomposite_1, async_1, cancellation_1, log_1, progress_1, codicons_1, iconRegistry_1, themables_1, event_1, extensionResourceLoader_1, instantiation_1, commands_1, fileIconThemeData_1, configuration_1, dialogs_1, contributions_1, notification_1, storage_1, platform_2, telemetry_1, host_1, window_1) {
    "use strict";
    var DefaultThemeUpdatedNotificationContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.manageExtensionIcon = void 0;
    exports.manageExtensionIcon = (0, iconRegistry_1.registerIcon)('theme-selection-manage-extension', codicons_1.Codicon.gear, (0, nls_1.localize)('manageExtensionIcon', 'Icon for the \'Manage\' action in the theme selection quick pick.'));
    let MarketplaceThemesPicker = class MarketplaceThemesPicker {
        constructor(getMarketplaceColorThemes, marketplaceQuery, extensionGalleryService, extensionManagementService, quickInputService, logService, progressService, paneCompositeService, dialogService) {
            this.getMarketplaceColorThemes = getMarketplaceColorThemes;
            this.marketplaceQuery = marketplaceQuery;
            this.extensionGalleryService = extensionGalleryService;
            this.extensionManagementService = extensionManagementService;
            this.quickInputService = quickInputService;
            this.logService = logService;
            this.progressService = progressService;
            this.paneCompositeService = paneCompositeService;
            this.dialogService = dialogService;
            this._marketplaceExtensions = new Set();
            this._marketplaceThemes = [];
            this._searchOngoing = false;
            this._searchError = undefined;
            this._onDidChange = new event_1.Emitter();
            this._queryDelayer = new async_1.ThrottledDelayer(200);
            this._installedExtensions = extensionManagementService.getInstalled().then(installed => {
                const result = new Set();
                for (const ext of installed) {
                    result.add(ext.identifier.id);
                }
                return result;
            });
        }
        get themes() {
            return this._marketplaceThemes;
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        trigger(value) {
            if (this._tokenSource) {
                this._tokenSource.cancel();
                this._tokenSource = undefined;
            }
            this._queryDelayer.trigger(() => {
                this._tokenSource = new cancellation_1.CancellationTokenSource();
                return this.doSearch(value, this._tokenSource.token);
            });
        }
        async doSearch(value, token) {
            this._searchOngoing = true;
            this._onDidChange.fire();
            try {
                const installedExtensions = await this._installedExtensions;
                const options = { text: `${this.marketplaceQuery} ${value}`, pageSize: 20 };
                const pager = await this.extensionGalleryService.query(options, token);
                for (let i = 0; i < pager.total && i < 1; i++) { // loading multiple pages is turned of for now to avoid flickering
                    if (token.isCancellationRequested) {
                        break;
                    }
                    const nThemes = this._marketplaceThemes.length;
                    const gallery = i === 0 ? pager.firstPage : await pager.getPage(i, token);
                    const promises = [];
                    const promisesGalleries = [];
                    for (let i = 0; i < gallery.length; i++) {
                        if (token.isCancellationRequested) {
                            break;
                        }
                        const ext = gallery[i];
                        if (!installedExtensions.has(ext.identifier.id) && !this._marketplaceExtensions.has(ext.identifier.id)) {
                            this._marketplaceExtensions.add(ext.identifier.id);
                            promises.push(this.getMarketplaceColorThemes(ext.publisher, ext.name, ext.version));
                            promisesGalleries.push(ext);
                        }
                    }
                    const allThemes = await Promise.all(promises);
                    for (let i = 0; i < allThemes.length; i++) {
                        const ext = promisesGalleries[i];
                        for (const theme of allThemes[i]) {
                            this._marketplaceThemes.push({ id: theme.id, theme: theme, label: theme.label, description: `${ext.displayName} · ${ext.publisherDisplayName}`, galleryExtension: ext, buttons: [configureButton] });
                        }
                    }
                    if (nThemes !== this._marketplaceThemes.length) {
                        this._marketplaceThemes.sort((t1, t2) => t1.label.localeCompare(t2.label));
                        this._onDidChange.fire();
                    }
                }
            }
            catch (e) {
                if (!(0, errors_1.isCancellationError)(e)) {
                    this.logService.error(`Error while searching for themes:`, e);
                    this._searchError = 'message' in e ? e.message : String(e);
                }
            }
            finally {
                this._searchOngoing = false;
                this._onDidChange.fire();
            }
        }
        openQuickPick(value, currentTheme, selectTheme) {
            let result = undefined;
            return new Promise((s, _) => {
                const quickpick = this.quickInputService.createQuickPick();
                quickpick.items = [];
                quickpick.sortByLabel = false;
                quickpick.matchOnDescription = true;
                quickpick.buttons = [this.quickInputService.backButton];
                quickpick.title = 'Marketplace Themes';
                quickpick.placeholder = (0, nls_1.localize)('themes.selectMarketplaceTheme', "Type to Search More. Select to Install. Up/Down Keys to Preview");
                quickpick.canSelectMany = false;
                quickpick.onDidChangeValue(() => this.trigger(quickpick.value));
                quickpick.onDidAccept(async (_) => {
                    const themeItem = quickpick.selectedItems[0];
                    if (themeItem?.galleryExtension) {
                        result = 'selected';
                        quickpick.hide();
                        const success = await this.installExtension(themeItem.galleryExtension);
                        if (success) {
                            selectTheme(themeItem.theme, true);
                        }
                        else {
                            selectTheme(currentTheme, true);
                        }
                    }
                });
                quickpick.onDidTriggerItemButton(e => {
                    if (isItem(e.item)) {
                        const extensionId = e.item.theme?.extensionData?.extensionId;
                        if (extensionId) {
                            openExtensionViewlet(this.paneCompositeService, `@id:${extensionId}`);
                        }
                        else {
                            openExtensionViewlet(this.paneCompositeService, `${this.marketplaceQuery} ${quickpick.value}`);
                        }
                    }
                });
                quickpick.onDidChangeActive(themes => {
                    if (result === undefined) {
                        selectTheme(themes[0]?.theme, false);
                    }
                });
                quickpick.onDidHide(() => {
                    if (result === undefined) {
                        selectTheme(currentTheme, true);
                        result = 'cancelled';
                    }
                    quickpick.dispose();
                    s(result);
                });
                quickpick.onDidTriggerButton(e => {
                    if (e === this.quickInputService.backButton) {
                        result = 'back';
                        quickpick.hide();
                    }
                });
                this.onDidChange(() => {
                    let items = this.themes;
                    if (this._searchOngoing) {
                        items = items.concat({ label: '$(sync~spin) Searching for themes...', id: undefined, alwaysShow: true });
                    }
                    else if (items.length === 0 && this._searchError) {
                        items = [{ label: `$(error) ${(0, nls_1.localize)('search.error', 'Error while searching for themes: {0}', this._searchError)}`, id: undefined, alwaysShow: true }];
                    }
                    const activeItemId = quickpick.activeItems[0]?.id;
                    const newActiveItem = activeItemId ? items.find(i => isItem(i) && i.id === activeItemId) : undefined;
                    quickpick.items = items;
                    if (newActiveItem) {
                        quickpick.activeItems = [newActiveItem];
                    }
                });
                this.trigger(value);
                quickpick.show();
            });
        }
        async installExtension(galleryExtension) {
            openExtensionViewlet(this.paneCompositeService, `@id:${galleryExtension.identifier.id}`);
            const result = await this.dialogService.confirm({
                message: (0, nls_1.localize)('installExtension.confirm', "This will install extension '{0}' published by '{1}'. Do you want to continue?", galleryExtension.displayName, galleryExtension.publisherDisplayName),
                primaryButton: (0, nls_1.localize)('installExtension.button.ok', "OK")
            });
            if (!result.confirmed) {
                return false;
            }
            try {
                await this.progressService.withProgress({
                    location: 15 /* ProgressLocation.Notification */,
                    title: (0, nls_1.localize)('installing extensions', "Installing Extension {0}...", galleryExtension.displayName)
                }, async () => {
                    await this.extensionManagementService.installFromGallery(galleryExtension, {
                        // Setting this to false is how you get the extension to be synced with Settings Sync (if enabled).
                        isMachineScoped: false,
                    });
                });
                return true;
            }
            catch (e) {
                this.logService.error(`Problem installing extension ${galleryExtension.identifier.id}`, e);
                return false;
            }
        }
        dispose() {
            if (this._tokenSource) {
                this._tokenSource.cancel();
                this._tokenSource = undefined;
            }
            this._queryDelayer.dispose();
            this._marketplaceExtensions.clear();
            this._marketplaceThemes.length = 0;
        }
    };
    MarketplaceThemesPicker = __decorate([
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, extensionManagement_1.IExtensionManagementService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, log_1.ILogService),
        __param(6, progress_1.IProgressService),
        __param(7, panecomposite_1.IPaneCompositePartService),
        __param(8, dialogs_1.IDialogService)
    ], MarketplaceThemesPicker);
    let InstalledThemesPicker = class InstalledThemesPicker {
        constructor(installMessage, browseMessage, placeholderMessage, marketplaceTag, setTheme, getMarketplaceColorThemes, quickInputService, extensionGalleryService, paneCompositeService, extensionResourceLoaderService, instantiationService) {
            this.installMessage = installMessage;
            this.browseMessage = browseMessage;
            this.placeholderMessage = placeholderMessage;
            this.marketplaceTag = marketplaceTag;
            this.setTheme = setTheme;
            this.getMarketplaceColorThemes = getMarketplaceColorThemes;
            this.quickInputService = quickInputService;
            this.extensionGalleryService = extensionGalleryService;
            this.paneCompositeService = paneCompositeService;
            this.extensionResourceLoaderService = extensionResourceLoaderService;
            this.instantiationService = instantiationService;
        }
        async openQuickPick(picks, currentTheme) {
            let marketplaceThemePicker;
            if (this.extensionGalleryService.isEnabled()) {
                if (this.extensionResourceLoaderService.supportsExtensionGalleryResources && this.browseMessage) {
                    marketplaceThemePicker = this.instantiationService.createInstance(MarketplaceThemesPicker, this.getMarketplaceColorThemes.bind(this), this.marketplaceTag);
                    picks = [...configurationEntries(this.browseMessage), ...picks];
                }
                else {
                    picks = [...picks, ...configurationEntries(this.installMessage)];
                }
            }
            let selectThemeTimeout;
            const selectTheme = (theme, applyTheme) => {
                if (selectThemeTimeout) {
                    clearTimeout(selectThemeTimeout);
                }
                selectThemeTimeout = window_1.mainWindow.setTimeout(() => {
                    selectThemeTimeout = undefined;
                    const newTheme = (theme ?? currentTheme);
                    this.setTheme(newTheme, applyTheme ? 'auto' : 'preview').then(undefined, err => {
                        (0, errors_1.onUnexpectedError)(err);
                        this.setTheme(currentTheme, undefined);
                    });
                }, applyTheme ? 0 : 200);
            };
            const pickInstalledThemes = (activeItemId) => {
                return new Promise((s, _) => {
                    let isCompleted = false;
                    const autoFocusIndex = picks.findIndex(p => isItem(p) && p.id === activeItemId);
                    const quickpick = this.quickInputService.createQuickPick();
                    quickpick.items = picks;
                    quickpick.placeholder = this.placeholderMessage;
                    quickpick.activeItems = [picks[autoFocusIndex]];
                    quickpick.canSelectMany = false;
                    quickpick.matchOnDescription = true;
                    quickpick.onDidAccept(async (_) => {
                        isCompleted = true;
                        const theme = quickpick.selectedItems[0];
                        if (!theme || typeof theme.id === 'undefined') { // 'pick in marketplace' entry
                            if (marketplaceThemePicker) {
                                const res = await marketplaceThemePicker.openQuickPick(quickpick.value, currentTheme, selectTheme);
                                if (res === 'back') {
                                    await pickInstalledThemes(undefined);
                                }
                            }
                            else {
                                openExtensionViewlet(this.paneCompositeService, `${this.marketplaceTag} ${quickpick.value}`);
                            }
                        }
                        else {
                            selectTheme(theme.theme, true);
                        }
                        quickpick.hide();
                        s();
                    });
                    quickpick.onDidChangeActive(themes => selectTheme(themes[0]?.theme, false));
                    quickpick.onDidHide(() => {
                        if (!isCompleted) {
                            selectTheme(currentTheme, true);
                            s();
                        }
                        quickpick.dispose();
                    });
                    quickpick.onDidTriggerItemButton(e => {
                        if (isItem(e.item)) {
                            const extensionId = e.item.theme?.extensionData?.extensionId;
                            if (extensionId) {
                                openExtensionViewlet(this.paneCompositeService, `@id:${extensionId}`);
                            }
                            else {
                                openExtensionViewlet(this.paneCompositeService, `${this.marketplaceTag} ${quickpick.value}`);
                            }
                        }
                    });
                    quickpick.show();
                });
            };
            await pickInstalledThemes(currentTheme.id);
            marketplaceThemePicker?.dispose();
        }
    };
    InstalledThemesPicker = __decorate([
        __param(6, quickInput_1.IQuickInputService),
        __param(7, extensionManagement_1.IExtensionGalleryService),
        __param(8, panecomposite_1.IPaneCompositePartService),
        __param(9, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(10, instantiation_1.IInstantiationService)
    ], InstalledThemesPicker);
    const SelectColorThemeCommandId = 'workbench.action.selectTheme';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SelectColorThemeCommandId,
                title: (0, nls_1.localize2)('selectTheme.label', 'Color Theme'),
                category: actionCommonCategories_1.Categories.Preferences,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 50 /* KeyCode.KeyT */)
                }
            });
        }
        async run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const installMessage = (0, nls_1.localize)('installColorThemes', "Install Additional Color Themes...");
            const browseMessage = '$(plus) ' + (0, nls_1.localize)('browseColorThemes', "Browse Additional Color Themes...");
            const placeholderMessage = (0, nls_1.localize)('themes.selectTheme', "Select Color Theme (Up/Down Keys to Preview)");
            const marketplaceTag = 'category:themes';
            const setTheme = (theme, settingsTarget) => themeService.setColorTheme(theme, settingsTarget);
            const getMarketplaceColorThemes = (publisher, name, version) => themeService.getMarketplaceColorThemes(publisher, name, version);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const picker = instantiationService.createInstance(InstalledThemesPicker, installMessage, browseMessage, placeholderMessage, marketplaceTag, setTheme, getMarketplaceColorThemes);
            const themes = await themeService.getColorThemes();
            const currentTheme = themeService.getColorTheme();
            const picks = [
                ...toEntries(themes.filter(t => t.type === theme_1.ColorScheme.LIGHT), (0, nls_1.localize)('themes.category.light', "light themes")),
                ...toEntries(themes.filter(t => t.type === theme_1.ColorScheme.DARK), (0, nls_1.localize)('themes.category.dark', "dark themes")),
                ...toEntries(themes.filter(t => (0, theme_1.isHighContrast)(t.type)), (0, nls_1.localize)('themes.category.hc', "high contrast themes")),
            ];
            await picker.openQuickPick(picks, currentTheme);
        }
    });
    const SelectFileIconThemeCommandId = 'workbench.action.selectIconTheme';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SelectFileIconThemeCommandId,
                title: (0, nls_1.localize2)('selectIconTheme.label', 'File Icon Theme'),
                category: actionCommonCategories_1.Categories.Preferences,
                f1: true
            });
        }
        async run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const installMessage = (0, nls_1.localize)('installIconThemes', "Install Additional File Icon Themes...");
            const placeholderMessage = (0, nls_1.localize)('themes.selectIconTheme', "Select File Icon Theme (Up/Down Keys to Preview)");
            const marketplaceTag = 'tag:icon-theme';
            const setTheme = (theme, settingsTarget) => themeService.setFileIconTheme(theme, settingsTarget);
            const getMarketplaceColorThemes = (publisher, name, version) => themeService.getMarketplaceFileIconThemes(publisher, name, version);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const picker = instantiationService.createInstance(InstalledThemesPicker, installMessage, undefined, placeholderMessage, marketplaceTag, setTheme, getMarketplaceColorThemes);
            const picks = [
                { type: 'separator', label: (0, nls_1.localize)('fileIconThemeCategory', 'file icon themes') },
                { id: '', theme: fileIconThemeData_1.FileIconThemeData.noIconTheme, label: (0, nls_1.localize)('noIconThemeLabel', 'None'), description: (0, nls_1.localize)('noIconThemeDesc', 'Disable File Icons') },
                ...toEntries(await themeService.getFileIconThemes()),
            ];
            await picker.openQuickPick(picks, themeService.getFileIconTheme());
        }
    });
    const SelectProductIconThemeCommandId = 'workbench.action.selectProductIconTheme';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SelectProductIconThemeCommandId,
                title: (0, nls_1.localize2)('selectProductIconTheme.label', 'Product Icon Theme'),
                category: actionCommonCategories_1.Categories.Preferences,
                f1: true
            });
        }
        async run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const installMessage = (0, nls_1.localize)('installProductIconThemes', "Install Additional Product Icon Themes...");
            const browseMessage = '$(plus) ' + (0, nls_1.localize)('browseProductIconThemes', "Browse Additional Product Icon Themes...");
            const placeholderMessage = (0, nls_1.localize)('themes.selectProductIconTheme', "Select Product Icon Theme (Up/Down Keys to Preview)");
            const marketplaceTag = 'tag:product-icon-theme';
            const setTheme = (theme, settingsTarget) => themeService.setProductIconTheme(theme, settingsTarget);
            const getMarketplaceColorThemes = (publisher, name, version) => themeService.getMarketplaceProductIconThemes(publisher, name, version);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const picker = instantiationService.createInstance(InstalledThemesPicker, installMessage, browseMessage, placeholderMessage, marketplaceTag, setTheme, getMarketplaceColorThemes);
            const picks = [
                { type: 'separator', label: (0, nls_1.localize)('productIconThemeCategory', 'product icon themes') },
                { id: productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID, theme: productIconThemeData_1.ProductIconThemeData.defaultTheme, label: (0, nls_1.localize)('defaultProductIconThemeLabel', 'Default') },
                ...toEntries(await themeService.getProductIconThemes()),
            ];
            await picker.openQuickPick(picks, themeService.getProductIconTheme());
        }
    });
    commands_1.CommandsRegistry.registerCommand('workbench.action.previewColorTheme', async function (accessor, extension, themeSettingsId) {
        const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
        let themes = findBuiltInThemes(await themeService.getColorThemes(), extension);
        if (themes.length === 0) {
            themes = await themeService.getMarketplaceColorThemes(extension.publisher, extension.name, extension.version);
        }
        for (const theme of themes) {
            if (!themeSettingsId || theme.settingsId === themeSettingsId) {
                await themeService.setColorTheme(theme, 'preview');
                return theme.settingsId;
            }
        }
        return undefined;
    });
    function findBuiltInThemes(themes, extension) {
        return themes.filter(({ extensionData }) => extensionData && extensionData.extensionIsBuiltin && (0, strings_1.equalsIgnoreCase)(extensionData.extensionPublisher, extension.publisher) && (0, strings_1.equalsIgnoreCase)(extensionData.extensionName, extension.name));
    }
    function configurationEntries(label) {
        return [
            {
                type: 'separator'
            },
            {
                id: undefined,
                label: label,
                alwaysShow: true,
                buttons: [configureButton]
            }
        ];
    }
    function openExtensionViewlet(paneCompositeService, query) {
        return paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true).then(viewlet => {
            if (viewlet) {
                (viewlet?.getViewPaneContainer()).search(query);
                viewlet.focus();
            }
        });
    }
    function isItem(i) {
        return i['type'] !== 'separator';
    }
    function toEntry(theme) {
        const settingId = theme.settingsId ?? undefined;
        const item = {
            id: theme.id,
            theme: theme,
            label: theme.label,
            description: theme.description || (theme.label === settingId ? undefined : settingId),
        };
        if (theme.extensionData) {
            item.buttons = [configureButton];
        }
        return item;
    }
    function toEntries(themes, label) {
        const sorter = (t1, t2) => t1.label.localeCompare(t2.label);
        const entries = themes.map(toEntry).sort(sorter);
        if (entries.length > 0 && label) {
            entries.unshift({ type: 'separator', label });
        }
        return entries;
    }
    const configureButton = {
        iconClass: themables_1.ThemeIcon.asClassName(exports.manageExtensionIcon),
        tooltip: (0, nls_1.localize)('manage extension', "Manage Extension"),
    };
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.generateColorTheme',
                title: (0, nls_1.localize2)('generateColorTheme.label', 'Generate Color Theme From Current Settings'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const theme = themeService.getColorTheme();
            const colors = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution).getColors();
            const colorIds = colors.map(c => c.id).sort();
            const resultingColors = {};
            const inherited = [];
            for (const colorId of colorIds) {
                const color = theme.getColor(colorId, false);
                if (color) {
                    resultingColors[colorId] = color_1.Color.Format.CSS.formatHexA(color, true);
                }
                else {
                    inherited.push(colorId);
                }
            }
            const nullDefaults = [];
            for (const id of inherited) {
                const color = theme.getColor(id);
                if (color) {
                    resultingColors['__' + id] = color_1.Color.Format.CSS.formatHexA(color, true);
                }
                else {
                    nullDefaults.push(id);
                }
            }
            for (const id of nullDefaults) {
                resultingColors['__' + id] = null;
            }
            let contents = JSON.stringify({
                '$schema': colorThemeSchema_1.colorThemeSchemaId,
                type: theme.type,
                colors: resultingColors,
                tokenColors: theme.tokenColors.filter(t => !!t.scope)
            }, null, '\t');
            contents = contents.replace(/\"__/g, '//"');
            const editorService = accessor.get(editorService_1.IEditorService);
            return editorService.openEditor({ resource: undefined, contents, languageId: 'jsonc', options: { pinned: true } });
        }
    });
    const toggleLightDarkThemesCommandId = 'workbench.action.toggleLightDarkThemes';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: toggleLightDarkThemesCommandId,
                title: (0, nls_1.localize2)('toggleLightDarkThemes.label', 'Toggle between Light/Dark Themes'),
                category: actionCommonCategories_1.Categories.Preferences,
                f1: true,
            });
        }
        async run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const currentTheme = themeService.getColorTheme();
            let newSettingsId = workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME;
            switch (currentTheme.type) {
                case theme_1.ColorScheme.LIGHT:
                    newSettingsId = workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME;
                    break;
                case theme_1.ColorScheme.DARK:
                    newSettingsId = workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME;
                    break;
                case theme_1.ColorScheme.HIGH_CONTRAST_LIGHT:
                    newSettingsId = workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME;
                    break;
                case theme_1.ColorScheme.HIGH_CONTRAST_DARK:
                    newSettingsId = workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME;
                    break;
            }
            const themeSettingId = configurationService.getValue(newSettingsId);
            if (themeSettingId && typeof themeSettingId === 'string') {
                const theme = (await themeService.getColorThemes()).find(t => t.settingsId === themeSettingId);
                if (theme) {
                    themeService.setColorTheme(theme.id, 'auto');
                }
            }
        }
    });
    const browseColorThemesInMarketplaceCommandId = 'workbench.action.browseColorThemesInMarketplace';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: browseColorThemesInMarketplaceCommandId,
                title: (0, nls_1.localize2)('browseColorThemeInMarketPlace.label', 'Browse Color Themes in Marketplace'),
                category: actionCommonCategories_1.Categories.Preferences,
                f1: true,
            });
        }
        async run(accessor) {
            const marketplaceTag = 'category:themes';
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const extensionGalleryService = accessor.get(extensionManagement_1.IExtensionGalleryService);
            const extensionResourceLoaderService = accessor.get(extensionResourceLoader_1.IExtensionResourceLoaderService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            if (!extensionGalleryService.isEnabled() || !extensionResourceLoaderService.supportsExtensionGalleryResources) {
                return;
            }
            const currentTheme = themeService.getColorTheme();
            const getMarketplaceColorThemes = (publisher, name, version) => themeService.getMarketplaceColorThemes(publisher, name, version);
            let selectThemeTimeout;
            const selectTheme = (theme, applyTheme) => {
                if (selectThemeTimeout) {
                    clearTimeout(selectThemeTimeout);
                }
                selectThemeTimeout = window_1.mainWindow.setTimeout(() => {
                    selectThemeTimeout = undefined;
                    const newTheme = (theme ?? currentTheme);
                    themeService.setColorTheme(newTheme, applyTheme ? 'auto' : 'preview').then(undefined, err => {
                        (0, errors_1.onUnexpectedError)(err);
                        themeService.setColorTheme(currentTheme, undefined);
                    });
                }, applyTheme ? 0 : 200);
            };
            const marketplaceThemePicker = instantiationService.createInstance(MarketplaceThemesPicker, getMarketplaceColorThemes, marketplaceTag);
            await marketplaceThemePicker.openQuickPick('', themeService.getColorTheme(), selectTheme).then(undefined, errors_1.onUnexpectedError);
        }
    });
    const ThemesSubMenu = new actions_1.MenuId('ThemesSubMenu');
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
        title: (0, nls_1.localize)('themes', "Themes"),
        submenu: ThemesSubMenu,
        group: '2_configuration',
        order: 7
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
        title: (0, nls_1.localize)({ key: 'miSelectTheme', comment: ['&& denotes a mnemonic'] }, "&&Theme"),
        submenu: ThemesSubMenu,
        group: '2_configuration',
        order: 7
    });
    actions_1.MenuRegistry.appendMenuItem(ThemesSubMenu, {
        command: {
            id: SelectColorThemeCommandId,
            title: (0, nls_1.localize)('selectTheme.label', 'Color Theme')
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(ThemesSubMenu, {
        command: {
            id: SelectFileIconThemeCommandId,
            title: (0, nls_1.localize)('themes.selectIconTheme.label', "File Icon Theme")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(ThemesSubMenu, {
        command: {
            id: SelectProductIconThemeCommandId,
            title: (0, nls_1.localize)('themes.selectProductIconTheme.label', "Product Icon Theme")
        },
        order: 3
    });
    let DefaultThemeUpdatedNotificationContribution = class DefaultThemeUpdatedNotificationContribution {
        static { DefaultThemeUpdatedNotificationContribution_1 = this; }
        static { this.STORAGE_KEY = 'themeUpdatedNotificationShown'; }
        constructor(_notificationService, _workbenchThemeService, _storageService, _commandService, _telemetryService, _hostService) {
            this._notificationService = _notificationService;
            this._workbenchThemeService = _workbenchThemeService;
            this._storageService = _storageService;
            this._commandService = _commandService;
            this._telemetryService = _telemetryService;
            this._hostService = _hostService;
            if (_storageService.getBoolean(DefaultThemeUpdatedNotificationContribution_1.STORAGE_KEY, -1 /* StorageScope.APPLICATION */)) {
                return;
            }
            setTimeout(async () => {
                if (_storageService.getBoolean(DefaultThemeUpdatedNotificationContribution_1.STORAGE_KEY, -1 /* StorageScope.APPLICATION */)) {
                    return;
                }
                if (await this._hostService.hadLastFocus()) {
                    this._storageService.store(DefaultThemeUpdatedNotificationContribution_1.STORAGE_KEY, true, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                    if (this._workbenchThemeService.hasUpdatedDefaultThemes()) {
                        this._showYouGotMigratedNotification();
                    }
                    else {
                        const currentTheme = this._workbenchThemeService.getColorTheme().settingsId;
                        if (currentTheme === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT_OLD || currentTheme === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK_OLD) {
                            this._tryNewThemeNotification();
                        }
                    }
                }
            }, 3000);
        }
        async _showYouGotMigratedNotification() {
            const usingLight = this._workbenchThemeService.getColorTheme().type === theme_1.ColorScheme.LIGHT;
            const newThemeSettingsId = usingLight ? workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT : workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK;
            const newTheme = (await this._workbenchThemeService.getColorThemes()).find(theme => theme.settingsId === newThemeSettingsId);
            if (newTheme) {
                const choices = [
                    {
                        label: (0, nls_1.localize)('button.keep', "Keep New Theme"),
                        run: () => {
                            this._writeTelemetry('keepNew');
                        }
                    },
                    {
                        label: (0, nls_1.localize)('button.browse', "Browse Themes"),
                        run: () => {
                            this._writeTelemetry('browse');
                            this._commandService.executeCommand(SelectColorThemeCommandId);
                        }
                    },
                    {
                        label: (0, nls_1.localize)('button.revert', "Revert"),
                        run: async () => {
                            this._writeTelemetry('keepOld');
                            const oldSettingsId = usingLight ? workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT_OLD : workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK_OLD;
                            const oldTheme = (await this._workbenchThemeService.getColorThemes()).find(theme => theme.settingsId === oldSettingsId);
                            if (oldTheme) {
                                this._workbenchThemeService.setColorTheme(oldTheme, 'auto');
                            }
                        }
                    }
                ];
                await this._notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)({ key: 'themeUpdatedNotification', comment: ['{0} is the name of the new default theme'] }, "Visual Studio Code now ships with a new default theme '{0}'. If you prefer, you can switch back to the old theme or try one of the many other color themes available.", newTheme.label), choices, {
                    onCancel: () => this._writeTelemetry('cancel')
                });
            }
        }
        async _tryNewThemeNotification() {
            const newThemeSettingsId = this._workbenchThemeService.getColorTheme().type === theme_1.ColorScheme.LIGHT ? workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT : workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK;
            const theme = (await this._workbenchThemeService.getColorThemes()).find(theme => theme.settingsId === newThemeSettingsId);
            if (theme) {
                const choices = [{
                        label: (0, nls_1.localize)('button.tryTheme', "Try New Theme"),
                        run: () => {
                            this._writeTelemetry('tryNew');
                            this._workbenchThemeService.setColorTheme(theme, 'auto');
                        }
                    },
                    {
                        label: (0, nls_1.localize)('button.cancel', "Cancel"),
                        run: () => {
                            this._writeTelemetry('cancel');
                        }
                    }];
                await this._notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)({ key: 'newThemeNotification', comment: ['{0} is the name of the new default theme'] }, "Visual Studio Code now ships with a new default theme '{0}'. Do you want to give it a try?", theme.label), choices, { onCancel: () => this._writeTelemetry('cancel') });
            }
        }
        _writeTelemetry(outcome) {
            this._telemetryService.publicLog2('themeUpdatedNotication', {
                web: platform_2.isWeb,
                reaction: outcome
            });
        }
    };
    DefaultThemeUpdatedNotificationContribution = DefaultThemeUpdatedNotificationContribution_1 = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, storage_1.IStorageService),
        __param(3, commands_1.ICommandService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, host_1.IHostService)
    ], DefaultThemeUpdatedNotificationContribution);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(DefaultThemeUpdatedNotificationContribution, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVzLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGhlbWVzL2Jyb3dzZXIvdGhlbWVzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNkNuRixRQUFBLG1CQUFtQixHQUFHLElBQUEsMkJBQVksRUFBQyxrQ0FBa0MsRUFBRSxrQkFBTyxDQUFDLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxtRUFBbUUsQ0FBQyxDQUFDLENBQUM7SUFJeE0sSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBdUI7UUFZNUIsWUFDa0IseUJBQTJHLEVBQzNHLGdCQUF3QixFQUVmLHVCQUFrRSxFQUMvRCwwQkFBd0UsRUFDakYsaUJBQXNELEVBQzdELFVBQXdDLEVBQ25DLGVBQWtELEVBQ3pDLG9CQUFnRSxFQUMzRSxhQUE4QztZQVQ3Qyw4QkFBeUIsR0FBekIseUJBQXlCLENBQWtGO1lBQzNHLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBUTtZQUVFLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDOUMsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUNoRSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQzVDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDbEIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ3hCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMkI7WUFDMUQsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBcEI5QywyQkFBc0IsR0FBZ0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNoRCx1QkFBa0IsR0FBZ0IsRUFBRSxDQUFDO1lBRTlDLG1CQUFjLEdBQVksS0FBSyxDQUFDO1lBQ2hDLGlCQUFZLEdB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