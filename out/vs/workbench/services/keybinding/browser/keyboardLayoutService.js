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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/keybinding/common/keymapInfo", "vs/platform/instantiation/common/extensions", "vs/platform/keyboardLayout/common/keyboardConfig", "vs/platform/keyboardLayout/common/keyboardMapper", "vs/base/common/platform", "vs/workbench/services/keybinding/common/windowsKeyboardMapper", "vs/workbench/services/keybinding/common/fallbackKeyboardMapper", "vs/workbench/services/keybinding/common/macLinuxKeyboardMapper", "vs/platform/files/common/files", "vs/base/common/async", "vs/base/common/json", "vs/base/common/objects", "vs/platform/environment/common/environment", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/platform/commands/common/commands", "vs/platform/storage/common/storage", "vs/platform/keyboardLayout/common/keyboardLayout"], function (require, exports, nls, event_1, lifecycle_1, keymapInfo_1, extensions_1, keyboardConfig_1, keyboardMapper_1, platform_1, windowsKeyboardMapper_1, fallbackKeyboardMapper_1, macLinuxKeyboardMapper_1, files_1, async_1, json_1, objects, environment_1, platform_2, configurationRegistry_1, configuration_1, notification_1, commands_1, storage_1, keyboardLayout_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserKeyboardLayoutService = exports.BrowserKeyboardMapperFactory = exports.BrowserKeyboardMapperFactoryBase = void 0;
    class BrowserKeyboardMapperFactoryBase extends lifecycle_1.Disposable {
        get activeKeymap() {
            return this._activeKeymapInfo;
        }
        get keymapInfos() {
            return this._keymapInfos;
        }
        get activeKeyboardLayout() {
            if (!this._initialized) {
                return null;
            }
            return this._activeKeymapInfo?.layout ?? null;
        }
        get activeKeyMapping() {
            if (!this._initialized) {
                return null;
            }
            return this._activeKeymapInfo?.mapping ?? null;
        }
        get keyboardLayouts() {
            return this._keymapInfos.map(keymapInfo => keymapInfo.layout);
        }
        constructor(_configurationService) {
            super();
            this._configurationService = _configurationService;
            this._onDidChangeKeyboardMapper = new event_1.Emitter();
            this.onDidChangeKeyboardMapper = this._onDidChangeKeyboardMapper.event;
            this.keyboardLayoutMapAllowed = navigator.keyboard !== undefined;
            this._keyboardMapper = null;
            this._initialized = false;
            this._keymapInfos = [];
            this._mru = [];
            this._activeKeymapInfo = null;
            if (navigator.keyboard && navigator.keyboard.addEventListener) {
                navigator.keyboard.addEventListener('layoutchange', () => {
                    // Update user keyboard map settings
                    this._getBrowserKeyMapping().then((mapping) => {
                        if (this.isKeyMappingActive(mapping)) {
                            return;
                        }
                        this.setLayoutFromBrowserAPI();
                    });
                });
            }
            this._register(this._configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('keyboard')) {
                    this._keyboardMapper = null;
                    this._onDidChangeKeyboardMapper.fire();
                }
            }));
        }
        registerKeyboardLayout(layout) {
            this._keymapInfos.push(layout);
            this._mru = this._keymapInfos;
        }
        removeKeyboardLayout(layout) {
            let index = this._mru.indexOf(layout);
            this._mru.splice(index, 1);
            index = this._keymapInfos.indexOf(layout);
            this._keymapInfos.splice(index, 1);
        }
        getMatchedKeymapInfo(keyMapping) {
            if (!keyMapping) {
                return null;
            }
            const usStandard = this.getUSStandardLayout();
            if (usStandard) {
                let maxScore = usStandard.getScore(keyMapping);
                if (maxScore === 0) {
                    return {
                        result: usStandard,
                        score: 0
                    };
                }
                let result = usStandard;
                for (let i = 0; i < this._mru.length; i++) {
                    const score = this._mru[i].getScore(keyMapping);
                    if (score > maxScore) {
                        if (score === 0) {
                            return {
                                result: this._mru[i],
                                score: 0
                            };
                        }
                        maxScore = score;
                        result = this._mru[i];
                    }
                }
                return {
                    result,
                    score: maxScore
                };
            }
            for (let i = 0; i < this._mru.length; i++) {
                if (this._mru[i].fuzzyEqual(keyMapping)) {
                    return {
                        result: this._mru[i],
                        score: 0
                    };
                }
            }
            return null;
        }
        getUSStandardLayout() {
            const usStandardLayouts = this._mru.filter(layout => layout.layout.isUSStandard);
            if (usStandardLayouts.length) {
                return usStandardLayouts[0];
            }
            return null;
        }
        isKeyMappingActive(keymap) {
            return this._activeKeymapInfo && keymap && this._activeKeymapInfo.fuzzyEqual(keymap);
        }
        setUSKeyboardLayout() {
            this._activeKeymapInfo = this.getUSStandardLayout();
        }
        setActiveKeyMapping(keymap) {
            let keymapUpdated = false;
            const matchedKeyboardLayout = this.getMatchedKeymapInfo(keymap);
            if (matchedKeyboardLayout) {
                // let score = matchedKeyboardLayout.score;
                // Due to https://bugs.chromium.org/p/chromium/issues/detail?id=977609, any key after a dead key will generate a wrong mapping,
                // we shoud avoid yielding the false error.
                // if (keymap && score < 0) {
                // const donotAskUpdateKey = 'missing.keyboardlayout.donotask';
                // if (this._storageService.getBoolean(donotAskUpdateKey, StorageScope.APPLICATION)) {
                // 	return;
                // }
                // the keyboard layout doesn't actually match the key event or the keymap from chromium
                // this._notificationService.prompt(
                // 	Severity.Info,
                // 	nls.localize('missing.keyboardlayout', 'Fail to find matching keyboard layout'),
                // 	[{
                // 		label: nls.localize('keyboardLayoutMissing.configure', "Configure"),
                // 		run: () => this._commandService.executeCommand('workbench.action.openKeyboardLayoutPicker')
                // 	}, {
                // 		label: nls.localize('neverAgain', "Don't Show Again"),
                // 		isSecondary: true,
                // 		run: () => this._storageService.store(donotAskUpdateKey, true, StorageScope.APPLICATION)
                // 	}]
                // );
                // console.warn('Active keymap/keyevent does not match current keyboard layout', JSON.stringify(keymap), this._activeKeymapInfo ? JSON.stringify(this._activeKeymapInfo.layout) : '');
                // return;
                // }
                if (!this._activeKeymapInfo) {
                    this._activeKeymapInfo = matchedKeyboardLayout.result;
                    keymapUpdated = true;
                }
                else if (keymap) {
                    if (matchedKeyboardLayout.result.getScore(keymap) > this._activeKeymapInfo.getScore(keymap)) {
                        this._activeKeymapInfo = matchedKeyboardLayout.result;
                        keymapUpdated = true;
                    }
                }
            }
            if (!this._activeKeymapInfo) {
                this._activeKeymapInfo = this.getUSStandardLayout();
                keymapUpdated = true;
            }
            if (!this._activeKeymapInfo || !keymapUpdated) {
                return;
            }
            const index = this._mru.indexOf(this._activeKeymapInfo);
            this._mru.splice(index, 1);
            this._mru.unshift(this._activeKeymapInfo);
            this._setKeyboardData(this._activeKeymapInfo);
        }
        setActiveKeymapInfo(keymapInfo) {
            this._activeKeymapInfo = keymapInfo;
            const index = this._mru.indexOf(this._activeKeymapInfo);
            if (index === 0) {
                return;
            }
            this._mru.splice(index, 1);
            this._mru.unshift(this._activeKeymapInfo);
            this._setKeyboardData(this._activeKeymapInfo);
        }
        setLayoutFromBrowserAPI() {
            this._updateKeyboardLayoutAsync(this._initialized);
        }
        _updateKeyboardLayoutAsync(initialized, keyboardEvent) {
            if (!initialized) {
                return;
            }
            this._getBrowserKeyMapping(keyboardEvent).then(keyMap => {
                // might be false positive
                if (this.isKeyMappingActive(keyMap)) {
                    return;
                }
                this.setActiveKeyMapping(keyMap);
            });
        }
        getKeyboardMapper() {
            const config = (0, keyboardConfig_1.readKeyboardConfig)(this._configurationService);
            if (config.dispatch === 1 /* DispatchConfig.KeyCode */ || !this._initialized || !this._activeKeymapInfo) {
                // Forcefully set to use keyCode
                return new fallbackKeyboardMapper_1.FallbackKeyboardMapper(config.mapAltGrToCtrlAlt, platform_1.OS);
            }
            if (!this._keyboardMapper) {
                this._keyboardMapper = new keyboardMapper_1.CachedKeyboardMapper(BrowserKeyboardMapperFactory._createKeyboardMapper(this._activeKeymapInfo, config.mapAltGrToCtrlAlt));
            }
            return this._keyboardMapper;
        }
        validateCurrentKeyboardMapping(keyboardEvent) {
            if (!this._initialized) {
                return;
            }
            const isCurrentKeyboard = this._validateCurrentKeyboardMapping(keyboardEvent);
            if (isCurrentKeyboard) {
                return;
            }
            this._updateKeyboardLayoutAsync(true, keyboardEvent);
        }
        setKeyboardLayout(layoutName) {
            const matchedLayouts = this.keymapInfos.filter(keymapInfo => (0, keyboardLayout_1.getKeyboardLayoutId)(keymapInfo.layout) === layoutName);
            if (matchedLayouts.length > 0) {
                this.setActiveKeymapInfo(matchedLayouts[0]);
            }
        }
        _setKeyboardData(keymapInfo) {
            this._initialized = true;
            this._keyboardMapper = null;
            this._onDidChangeKeyboardMapper.fire();
        }
        static _createKeyboardMapper(keymapInfo, mapAltGrToCtrlAlt) {
            const rawMapping = keymapInfo.mapping;
            const isUSStandard = !!keymapInfo.layout.isUSStandard;
            if (platform_1.OS === 1 /* OperatingSystem.Windows */) {
                return new windowsKeyboardMapper_1.WindowsKeyboardMapper(isUSStandard, rawMapping, mapAltGrToCtrlAlt);
            }
            if (Object.keys(rawMapping).length === 0) {
                // Looks like reading the mappings failed (most likely Mac + Japanese/Chinese keyboard layouts)
                return new fallbackKeyboardMapper_1.FallbackKeyboardMapper(mapAltGrToCtrlAlt, platform_1.OS);
            }
            return new macLinuxKeyboardMapper_1.MacLinuxKeyboardMapper(isUSStandard, rawMapping, mapAltGrToCtrlAlt, platform_1.OS);
        }
        //#region Browser API
        _validateCurrentKeyboardMapping(keyboardEvent) {
            if (!this._initialized) {
                return true;
            }
            const standardKeyboardEvent = keyboardEvent;
            const currentKeymap = this._activeKeymapInfo;
            if (!currentKeymap) {
                return true;
            }
            if (standardKeyboardEvent.browserEvent.key === 'Dead' || standardKeyboardEvent.browserEvent.isComposing) {
                return true;
            }
            const mapping = currentKeymap.mapping[standardKeyboardEvent.code];
            if (!mapping) {
                return false;
            }
            if (mapping.value === '') {
                // The value is empty when the key is not a printable character, we skip validation.
                if (keyboardEvent.ctrlKey || keyboardEvent.metaKey) {
                    setTimeout(() => {
                        this._getBrowserKeyMapping().then((keymap) => {
                            if (this.isKeyMappingActive(keymap)) {
                                return;
                            }
                            this.setLayoutFromBrowserAPI();
                        });
                    }, 350);
                }
                return true;
            }
            const expectedValue = standardKeyboardEvent.altKey && standardKeyboardEvent.shiftKey ? mapping.withShiftAltGr :
                standardKeyboardEvent.altKey ? mapping.withAltGr :
                    standardKeyboardEvent.shiftKey ? mapping.withShift : mapping.value;
            const isDead = (standardKeyboardEvent.altKey && standardKeyboardEvent.shiftKey && mapping.withShiftAltGrIsDeadKey) ||
                (standardKeyboardEvent.altKey && mapping.withAltGrIsDeadKey) ||
                (standardKeyboardEvent.shiftKey && mapping.withShiftIsDeadKey) ||
                mapping.valueIsDeadKey;
            if (isDead && standardKeyboardEvent.browserEvent.key !== 'Dead') {
                return false;
            }
            // TODO, this assumption is wrong as `browserEvent.key` doesn't necessarily equal expectedValue from real keymap
            if (!isDead && standardKeyboardEvent.browserEvent.key !== expectedValue) {
                return false;
            }
            return true;
        }
        async _getBrowserKeyMapping(keyboardEvent) {
            if (this.keyboardLayoutMapAllowed) {
                try {
                    return await navigator.keyboard.getLayoutMap().then((e) => {
                        const ret = {};
                        for (const key of e) {
                            ret[key[0]] = {
                                'value': key[1],
                                'withShift': '',
                                'withAltGr': '',
                                'withShiftAltGr': ''
                            };
                        }
                        return ret;
                        // const matchedKeyboardLayout = this.getMatchedKeymapInfo(ret);
                        // if (matchedKeyboardLayout) {
                        // 	return matchedKeyboardLayout.result.mapping;
                        // }
                        // return null;
                    });
                }
                catch {
                    // getLayoutMap can throw if invoked from a nested browsing context
                    this.keyboardLayoutMapAllowed = false;
                }
            }
            if (keyboardEvent && !keyboardEvent.shiftKey && !keyboardEvent.altKey && !keyboardEvent.metaKey && !keyboardEvent.metaKey) {
                const ret = {};
                const standardKeyboardEvent = keyboardEvent;
                ret[standardKeyboardEvent.browserEvent.code] = {
                    'value': standardKeyboardEvent.browserEvent.key,
                    'withShift': '',
                    'withAltGr': '',
                    'withShiftAltGr': ''
                };
                const matchedKeyboardLayout = this.getMatchedKeymapInfo(ret);
                if (matchedKeyboardLayout) {
                    return ret;
                }
                return null;
            }
            return null;
        }
    }
    exports.BrowserKeyboardMapperFactoryBase = BrowserKeyboardMapperFactoryBase;
    class BrowserKeyboardMapperFactory extends BrowserKeyboardMapperFactoryBase {
        constructor(configurationService, notificationService, storageService, commandService) {
            // super(notificationService, storageService, commandService);
            super(configurationService);
            const platform = platform_1.isWindows ? 'win' : platform_1.isMacintosh ? 'darwin' : 'linux';
            new Promise((resolve_1, reject_1) => { require(['vs/workbench/services/keybinding/browser/keyboardLayouts/layout.contribution.' + platform], resolve_1, reject_1); }).then((m) => {
                const keymapInfos = m.KeyboardLayoutContribution.INSTANCE.layoutInfos;
                this._keymapInfos.push(...keymapInfos.map(info => (new keymapInfo_1.KeymapInfo(info.layout, info.secondaryLayouts, info.mapping, info.isUserKeyboardLayout))));
                this._mru = this._keymapInfos;
                this._initialized = true;
                this.setLayoutFromBrowserAPI();
            });
        }
    }
    exports.BrowserKeyboardMapperFactory = BrowserKeyboardMapperFactory;
    class UserKeyboardLayout extends lifecycle_1.Disposable {
        get keyboardLayout() { return this._keyboardLayout; }
        constructor(keyboardLayoutResource, fileService) {
            super();
            this.keyboardLayoutResource = keyboardLayoutResource;
            this.fileService = fileService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._keyboardLayout = null;
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.reload().then(changed => {
                if (changed) {
                    this._onDidChange.fire();
                }
            }), 50));
            this._register(event_1.Event.filter(this.fileService.onDidFilesChange, e => e.contains(this.keyboardLayoutResource))(() => this.reloadConfigurationScheduler.schedule()));
        }
        async initialize() {
            await this.reload();
        }
        async reload() {
            const existing = this._keyboardLayout;
            try {
                const content = await this.fileService.readFile(this.keyboardLayoutResource);
                const value = (0, json_1.parse)(content.value.toString());
                if ((0, json_1.getNodeType)(value) === 'object') {
                    const layoutInfo = value.layout;
                    const mappings = value.rawMapping;
                    this._keyboardLayout = keymapInfo_1.KeymapInfo.createKeyboardLayoutFromDebugInfo(layoutInfo, mappings, true);
                }
                else {
                    this._keyboardLayout = null;
                }
            }
            catch (e) {
                this._keyboardLayout = null;
            }
            return existing ? !objects.equals(existing, this._keyboardLayout) : true;
        }
    }
    let BrowserKeyboardLayoutService = class BrowserKeyboardLayoutService extends lifecycle_1.Disposable {
        constructor(environmentService, fileService, notificationService, storageService, commandService, configurationService) {
            super();
            this.configurationService = configurationService;
            this._onDidChangeKeyboardLayout = new event_1.Emitter();
            this.onDidChangeKeyboardLayout = this._onDidChangeKeyboardLayout.event;
            const keyboardConfig = configurationService.getValue('keyboard');
            const layout = keyboardConfig.layout;
            this._keyboardLayoutMode = layout ?? 'autodetect';
            this._factory = new BrowserKeyboardMapperFactory(configurationService, notificationService, storageService, commandService);
            this._register(this._factory.onDidChangeKeyboardMapper(() => {
                this._onDidChangeKeyboardLayout.fire();
            }));
            if (layout && layout !== 'autodetect') {
                // set keyboard layout
                this._factory.setKeyboardLayout(layout);
            }
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('keyboard.layout')) {
                    const keyboardConfig = configurationService.getValue('keyboard');
                    const layout = keyboardConfig.layout;
                    this._keyboardLayoutMode = layout;
                    if (layout === 'autodetect') {
                        this._factory.setLayoutFromBrowserAPI();
                    }
                    else {
                        this._factory.setKeyboardLayout(layout);
                    }
                }
            }));
            this._userKeyboardLayout = new UserKeyboardLayout(environmentService.keyboardLayoutResource, fileService);
            this._userKeyboardLayout.initialize().then(() => {
                if (this._userKeyboardLayout.keyboardLayout) {
                    this._factory.registerKeyboardLayout(this._userKeyboardLayout.keyboardLayout);
                    this.setUserKeyboardLayoutIfMatched();
                }
            });
            this._register(this._userKeyboardLayout.onDidChange(() => {
                const userKeyboardLayouts = this._factory.keymapInfos.filter(layout => layout.isUserKeyboardLayout);
                if (userKeyboardLayouts.length) {
                    if (this._userKeyboardLayout.keyboardLayout) {
                        userKeyboardLayouts[0].update(this._userKeyboardLayout.keyboardLayout);
                    }
                    else {
                        this._factory.removeKeyboardLayout(userKeyboardLayouts[0]);
                    }
                }
                else {
                    if (this._userKeyboardLayout.keyboardLayout) {
                        this._factory.registerKeyboardLayout(this._userKeyboardLayout.keyboardLayout);
                    }
                }
                this.setUserKeyboardLayoutIfMatched();
            }));
        }
        setUserKeyboardLayoutIfMatched() {
            const keyboardConfig = this.configurationService.getValue('keyboard');
            const layout = keyboardConfig.layout;
            if (layout && this._userKeyboardLayout.keyboardLayout) {
                if ((0, keyboardLayout_1.getKeyboardLayoutId)(this._userKeyboardLayout.keyboardLayout.layout) === layout && this._factory.activeKeymap) {
                    if (!this._userKeyboardLayout.keyboardLayout.equal(this._factory.activeKeymap)) {
                        this._factory.setActiveKeymapInfo(this._userKeyboardLayout.keyboardLayout);
                    }
                }
            }
        }
        getKeyboardMapper() {
            return this._factory.getKeyboardMapper();
        }
        getCurrentKeyboardLayout() {
            return this._factory.activeKeyboardLayout;
        }
        getAllKeyboardLayouts() {
            return this._factory.keyboardLayouts;
        }
        getRawKeyboardMapping() {
            return this._factory.activeKeyMapping;
        }
        validateCurrentKeyboardMapping(keyboardEvent) {
            if (this._keyboardLayoutMode !== 'autodetect') {
                return;
            }
            this._factory.validateCurrentKeyboardMapping(keyboardEvent);
        }
    };
    exports.BrowserKeyboardLayoutService = BrowserKeyboardLayoutService;
    exports.BrowserKeyboardLayoutService = BrowserKeyboardLayoutService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, notification_1.INotificationService),
        __param(3, storage_1.IStorageService),
        __param(4, commands_1.ICommandService),
        __param(5, configuration_1.IConfigurationService)
    ], BrowserKeyboardLayoutService);
    (0, extensions_1.registerSingleton)(keyboardLayout_1.IKeyboardLayoutService, BrowserKeyboardLayoutService, 1 /* InstantiationType.Delayed */);
    // Configuration
    const configurationRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const keyboardConfiguration = {
        'id': 'keyboard',
        'order': 15,
        'type': 'object',
        'title': nls.localize('keyboardConfigurationTitle', "Keyboard"),
        'properties': {
            'keyboard.layout': {
                'type': 'string',
                'default': 'autodetect',
                'description': nls.localize('keyboard.layout.config', "Control the keyboard layout used in web.")
            }
        }
    };
    configurationRegistry.registerConfiguration(keyboardConfiguration);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmRMYXlvdXRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMva2V5YmluZGluZy9icm93c2VyL2tleWJvYXJkTGF5b3V0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE4QmhHLE1BQWEsZ0NBQWlDLFNBQVEsc0JBQVU7UUFhL0QsSUFBSSxZQUFZO1lBQ2YsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFDL0IsQ0FBQztRQUVELElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDO1FBRUQsSUFBSSxvQkFBb0I7WUFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxJQUFJLElBQUksQ0FBQztRQUMvQyxDQUFDO1FBRUQsSUFBSSxnQkFBZ0I7WUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsT0FBTyxJQUFJLElBQUksQ0FBQztRQUNoRCxDQUFDO1FBRUQsSUFBSSxlQUFlO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUVELFlBQ2tCLHFCQUE0QztZQUs3RCxLQUFLLEVBQUUsQ0FBQztZQUxTLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUF0QzdDLCtCQUEwQixHQUFH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