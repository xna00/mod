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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/base/common/async", "vs/base/common/event", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/process", "vs/platform/extensionManagement/common/extensionManagementUtil"], function (require, exports, arrays_1, lifecycle_1, resources_1, uri_1, files_1, productService_1, async_1, event_1, path_1, platform_1, process_1, extensionManagementUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractNativeExtensionTipsService = exports.ExtensionTipsService = void 0;
    //#region Base Extension Tips Service
    let ExtensionTipsService = class ExtensionTipsService extends lifecycle_1.Disposable {
        constructor(fileService, productService) {
            super();
            this.fileService = fileService;
            this.productService = productService;
            this.allConfigBasedTips = new Map();
            if (this.productService.configBasedExtensionTips) {
                Object.entries(this.productService.configBasedExtensionTips).forEach(([, value]) => this.allConfigBasedTips.set(value.configPath, value));
            }
        }
        getConfigBasedTips(folder) {
            return this.getValidConfigBasedTips(folder);
        }
        async getImportantExecutableBasedTips() {
            return [];
        }
        async getOtherExecutableBasedTips() {
            return [];
        }
        async getValidConfigBasedTips(folder) {
            const result = [];
            for (const [configPath, tip] of this.allConfigBasedTips) {
                if (tip.configScheme && tip.configScheme !== folder.scheme) {
                    continue;
                }
                try {
                    const content = (await this.fileService.readFile((0, resources_1.joinPath)(folder, configPath))).value.toString();
                    for (const [key, value] of Object.entries(tip.recommendations)) {
                        if (!value.contentPattern || new RegExp(value.contentPattern, 'mig').test(content)) {
                            result.push({
                                extensionId: key,
                                extensionName: value.name,
                                configName: tip.configName,
                                important: !!value.important,
                                isExtensionPack: !!value.isExtensionPack,
                                whenNotInstalled: value.whenNotInstalled
                            });
                        }
                    }
                }
                catch (error) { /* Ignore */ }
            }
            return result;
        }
    };
    exports.ExtensionTipsService = ExtensionTipsService;
    exports.ExtensionTipsService = ExtensionTipsService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, productService_1.IProductService)
    ], ExtensionTipsService);
    const promptedExecutableTipsStorageKey = 'extensionTips/promptedExecutableTips';
    const lastPromptedMediumImpExeTimeStorageKey = 'extensionTips/lastPromptedMediumImpExeTime';
    class AbstractNativeExtensionTipsService extends ExtensionTipsService {
        constructor(userHome, windowEvents, telemetryService, extensionManagementService, storageService, extensionRecommendationNotificationService, fileService, productService) {
            super(fileService, productService);
            this.userHome = userHome;
            this.windowEvents = windowEvents;
            this.telemetryService = telemetryService;
            this.extensionManagementService = extensionManagementService;
            this.storageService = storageService;
            this.extensionRecommendationNotificationService = extensionRecommendationNotificationService;
            this.highImportanceExecutableTips = new Map();
            this.mediumImportanceExecutableTips = new Map();
            this.allOtherExecutableTips = new Map();
            this.highImportanceTipsByExe = new Map();
            this.mediumImportanceTipsByExe = new Map();
            if (productService.exeBasedExtensionTips) {
                Object.entries(productService.exeBasedExtensionTips).forEach(([key, exeBasedExtensionTip]) => {
                    const highImportanceRecommendations = [];
                    const mediumImportanceRecommendations = [];
                    const otherRecommendations = [];
                    Object.entries(exeBasedExtensionTip.recommendations).forEach(([extensionId, value]) => {
                        if (value.important) {
                            if (exeBasedExtensionTip.important) {
                                highImportanceRecommendations.push({ extensionId, extensionName: value.name, isExtensionPack: !!value.isExtensionPack });
                            }
                            else {
                                mediumImportanceRecommendations.push({ extensionId, extensionName: value.name, isExtensionPack: !!value.isExtensionPack });
                            }
                        }
                        else {
                            otherRecommendations.push({ extensionId, extensionName: value.name, isExtensionPack: !!value.isExtensionPack });
                        }
                    });
                    if (highImportanceRecommendations.length) {
                        this.highImportanceExecutableTips.set(key, { exeFriendlyName: exeBasedExtensionTip.friendlyName, windowsPath: exeBasedExtensionTip.windowsPath, recommendations: highImportanceRecommendations });
                    }
                    if (mediumImportanceRecommendations.length) {
                        this.mediumImportanceExecutableTips.set(key, { exeFriendlyName: exeBasedExtensionTip.friendlyName, windowsPath: exeBasedExtensionTip.windowsPath, recommendations: mediumImportanceRecommendations });
                    }
                    if (otherRecommendations.length) {
                        this.allOtherExecutableTips.set(key, { exeFriendlyName: exeBasedExtensionTip.friendlyName, windowsPath: exeBasedExtensionTip.windowsPath, recommendations: otherRecommendations });
                    }
                });
            }
            /*
                3s has come out to be the good number to fetch and prompt important exe based recommendations
                Also fetch important exe based recommendations for reporting telemetry
            */
            (0, async_1.disposableTimeout)(async () => {
                await this.collectTips();
                this.promptHighImportanceExeBasedTip();
                this.promptMediumImportanceExeBasedTip();
            }, 3000, this._store);
        }
        async getImportantExecutableBasedTips() {
            const highImportanceExeTips = await this.getValidExecutableBasedExtensionTips(this.highImportanceExecutableTips);
            const mediumImportanceExeTips = await this.getValidExecutableBasedExtensionTips(this.mediumImportanceExecutableTips);
            return [...highImportanceExeTips, ...mediumImportanceExeTips];
        }
        getOtherExecutableBasedTips() {
            return this.getValidExecutableBasedExtensionTips(this.allOtherExecutableTips);
        }
        async collectTips() {
            const highImportanceExeTips = await this.getValidExecutableBasedExtensionTips(this.highImportanceExecutableTips);
            const mediumImportanceExeTips = await this.getValidExecutableBasedExtensionTips(this.mediumImportanceExecutableTips);
            const local = await this.extensionManagementService.getInstalled();
            this.highImportanceTipsByExe = this.groupImportantTipsByExe(highImportanceExeTips, local);
            this.mediumImportanceTipsByExe = this.groupImportantTipsByExe(mediumImportanceExeTips, local);
        }
        groupImportantTipsByExe(importantExeBasedTips, local) {
            const importantExeBasedRecommendations = new Map();
            importantExeBasedTips.forEach(tip => importantExeBasedRecommendations.set(tip.extensionId.toLowerCase(), tip));
            const { installed, uninstalled: recommendations } = this.groupByInstalled([...importantExeBasedRecommendations.keys()], local);
            /* Log installed and uninstalled exe based recommendations */
            for (const extensionId of installed) {
                const tip = importantExeBasedRecommendations.get(extensionId);
                if (tip) {
                    this.telemetryService.publicLog2('exeExtensionRecommendations:alreadyInstalled', { extensionId, exeName: tip.exeName });
                }
            }
            for (const extensionId of recommendations) {
                const tip = importantExeBasedRecommendations.get(extensionId);
                if (tip) {
                    this.telemetryService.publicLog2('exeExtensionRecommendations:notInstalled', { extensionId, exeName: tip.exeName });
                }
            }
            const promptedExecutableTips = this.getPromptedExecutableTips();
            const tipsByExe = new Map();
            for (const extensionId of recommendations) {
                const tip = importantExeBasedRecommendations.get(extensionId);
                if (tip && (!promptedExecutableTips[tip.exeName] || !promptedExecutableTips[tip.exeName].includes(tip.extensionId))) {
                    let tips = tipsByExe.get(tip.exeName);
                    if (!tips) {
                        tips = [];
                        tipsByExe.set(tip.exeName, tips);
                    }
                    tips.push(tip);
                }
            }
            return tipsByExe;
        }
        /**
         * High importance tips are prompted once per restart session
         */
        promptHighImportanceExeBasedTip() {
            if (this.highImportanceTipsByExe.size === 0) {
                return;
            }
            const [exeName, tips] = [...this.highImportanceTipsByExe.entries()][0];
            this.promptExeRecommendations(tips)
                .then(result => {
                switch (result) {
                    case "reacted" /* RecommendationsNotificationResult.Accepted */:
                        this.addToRecommendedExecutables(tips[0].exeName, tips);
                        break;
                    case "ignored" /* RecommendationsNotificationResult.Ignored */:
                        this.highImportanceTipsByExe.delete(exeName);
                        break;
                    case "incompatibleWindow" /* RecommendationsNotificationResult.IncompatibleWindow */: {
                        // Recommended in incompatible window. Schedule the prompt after active window change
                        const onActiveWindowChange = event_1.Event.once(event_1.Event.latch(event_1.Event.any(this.windowEvents.onDidOpenMainWindow, this.windowEvents.onDidFocusMainWindow)));
                        this._register(onActiveWindowChange(() => this.promptHighImportanceExeBasedTip()));
                        break;
                    }
                    case "toomany" /* RecommendationsNotificationResult.TooMany */: {
                        // Too many notifications. Schedule the prompt after one hour
                        const disposable = this._register(new lifecycle_1.MutableDisposable());
                        disposable.value = (0, async_1.disposableTimeout)(() => { disposable.dispose(); this.promptHighImportanceExeBasedTip(); }, 60 * 60 * 1000 /* 1 hour */);
                        break;
                    }
                }
            });
        }
        /**
         * Medium importance tips are prompted once per 7 days
         */
        promptMediumImportanceExeBasedTip() {
            if (this.mediumImportanceTipsByExe.size === 0) {
                return;
            }
            const lastPromptedMediumExeTime = this.getLastPromptedMediumExeTime();
            const timeSinceLastPrompt = Date.now() - lastPromptedMediumExeTime;
            const promptInterval = 7 * 24 * 60 * 60 * 1000; // 7 Days
            if (timeSinceLastPrompt < promptInterval) {
                // Wait until interval and prompt
                const disposable = this._register(new lifecycle_1.MutableDisposable());
                disposable.value = (0, async_1.disposableTimeout)(() => { disposable.dispose(); this.promptMediumImportanceExeBasedTip(); }, promptInterval - timeSinceLastPrompt);
                return;
            }
            const [exeName, tips] = [...this.mediumImportanceTipsByExe.entries()][0];
            this.promptExeRecommendations(tips)
                .then(result => {
                switch (result) {
                    case "reacted" /* RecommendationsNotificationResult.Accepted */: {
                        // Accepted: Update the last prompted time and caches.
                        this.updateLastPromptedMediumExeTime(Date.now());
                        this.mediumImportanceTipsByExe.delete(exeName);
                        this.addToRecommendedExecutables(tips[0].exeName, tips);
                        // Schedule the next recommendation for next internval
                        const disposable1 = this._register(new lifecycle_1.MutableDisposable());
                        disposable1.value = (0, async_1.disposableTimeout)(() => { disposable1.dispose(); this.promptMediumImportanceExeBasedTip(); }, promptInterval);
                        break;
                    }
                    case "ignored" /* RecommendationsNotificationResult.Ignored */:
                        // Ignored: Remove from the cache and prompt next recommendation
                        this.mediumImportanceTipsByExe.delete(exeName);
                        this.promptMediumImportanceExeBasedTip();
                        break;
                    case "incompatibleWindow" /* RecommendationsNotificationResult.IncompatibleWindow */: {
                        // Recommended in incompatible window. Schedule the prompt after active window change
                        const onActiveWindowChange = event_1.Event.once(event_1.Event.latch(event_1.Event.any(this.windowEvents.onDidOpenMainWindow, this.windowEvents.onDidFocusMainWindow)));
                        this._register(onActiveWindowChange(() => this.promptMediumImportanceExeBasedTip()));
                        break;
                    }
                    case "toomany" /* RecommendationsNotificationResult.TooMany */: {
                        // Too many notifications. Schedule the prompt after one hour
                        const disposable2 = this._register(new lifecycle_1.MutableDisposable());
                        disposable2.value = (0, async_1.disposableTimeout)(() => { disposable2.dispose(); this.promptMediumImportanceExeBasedTip(); }, 60 * 60 * 1000 /* 1 hour */);
                        break;
                    }
                }
            });
        }
        async promptExeRecommendations(tips) {
            const installed = await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */);
            const extensions = tips
                .filter(tip => !tip.whenNotInstalled || tip.whenNotInstalled.every(id => installed.every(local => !(0, extensionManagementUtil_1.areSameExtensions)(local.identifier, { id }))))
                .map(({ extensionId }) => extensionId.toLowerCase());
            return this.extensionRecommendationNotificationService.promptImportantExtensionsInstallNotification({ extensions, source: 3 /* RecommendationSource.EXE */, name: tips[0].exeFriendlyName, searchValue: `@exe:"${tips[0].exeName}"` });
        }
        getLastPromptedMediumExeTime() {
            let value = this.storageService.getNumber(lastPromptedMediumImpExeTimeStorageKey, -1 /* StorageScope.APPLICATION */);
            if (!value) {
                value = Date.now();
                this.updateLastPromptedMediumExeTime(value);
            }
            return value;
        }
        updateLastPromptedMediumExeTime(value) {
            this.storageService.store(lastPromptedMediumImpExeTimeStorageKey, value, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
        getPromptedExecutableTips() {
            return JSON.parse(this.storageService.get(promptedExecutableTipsStorageKey, -1 /* StorageScope.APPLICATION */, '{}'));
        }
        addToRecommendedExecutables(exeName, tips) {
            const promptedExecutableTips = this.getPromptedExecutableTips();
            promptedExecutableTips[exeName] = tips.map(({ extensionId }) => extensionId.toLowerCase());
            this.storageService.store(promptedExecutableTipsStorageKey, JSON.stringify(promptedExecutableTips), -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
        }
        groupByInstalled(recommendationsToSuggest, local) {
            const installed = [], uninstalled = [];
            const installedExtensionsIds = local.reduce((result, i) => { result.add(i.identifier.id.toLowerCase()); return result; }, new Set());
            recommendationsToSuggest.forEach(id => {
                if (installedExtensionsIds.has(id.toLowerCase())) {
                    installed.push(id);
                }
                else {
                    uninstalled.push(id);
                }
            });
            return { installed, uninstalled };
        }
        async getValidExecutableBasedExtensionTips(executableTips) {
            const result = [];
            const checkedExecutables = new Map();
            for (const exeName of executableTips.keys()) {
                const extensionTip = executableTips.get(exeName);
                if (!extensionTip || !(0, arrays_1.isNonEmptyArray)(extensionTip.recommendations)) {
                    continue;
                }
                const exePaths = [];
                if (platform_1.isWindows) {
                    if (extensionTip.windowsPath) {
                        exePaths.push(extensionTip.windowsPath.replace('%USERPROFILE%', () => process_1.env['USERPROFILE'])
                            .replace('%ProgramFiles(x86)%', () => process_1.env['ProgramFiles(x86)'])
                            .replace('%ProgramFiles%', () => process_1.env['ProgramFiles'])
                            .replace('%APPDATA%', () => process_1.env['APPDATA'])
                            .replace('%WINDIR%', () => process_1.env['WINDIR']));
                    }
                }
                else {
                    exePaths.push((0, path_1.join)('/usr/local/bin', exeName));
                    exePaths.push((0, path_1.join)('/usr/bin', exeName));
                    exePaths.push((0, path_1.join)(this.userHome.fsPath, exeName));
                }
                for (const exePath of exePaths) {
                    let exists = checkedExecutables.get(exePath);
                    if (exists === undefined) {
                        exists = await this.fileService.exists(uri_1.URI.file(exePath));
                        checkedExecutables.set(exePath, exists);
                    }
                    if (exists) {
                        for (const { extensionId, extensionName, isExtensionPack, whenNotInstalled } of extensionTip.recommendations) {
                            result.push({
                                extensionId,
                                extensionName,
                                isExtensionPack,
                                exeName,
                                exeFriendlyName: extensionTip.exeFriendlyName,
                                windowsPath: extensionTip.windowsPath,
                                whenNotInstalled: whenNotInstalled
                            });
                        }
                    }
                }
            }
            return result;
        }
    }
    exports.AbstractNativeExtensionTipsService = AbstractNativeExtensionTipsService;
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uVGlwc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvY29tbW9uL2V4dGVuc2lvblRpcHNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNCaEcscUNBQXFDO0lBRTlCLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFNbkQsWUFDZSxXQUE0QyxFQUN6QyxjQUFnRDtZQUVqRSxLQUFLLEVBQUUsQ0FBQztZQUh5QixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN4QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFKakQsdUJBQWtCLEdBQTZDLElBQUksR0FBRyxFQUF1QyxDQUFDO1lBTzlILElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO2dCQUNsRCxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzNJLENBQUM7UUFDRixDQUFDO1FBRUQsa0JBQWtCLENBQUMsTUFBVztZQUM3QixPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQsS0FBSyxDQUFDLCtCQUErQjtZQUNwQyxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxLQUFLLENBQUMsMkJBQTJCO1lBQ2hDLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVPLEtB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