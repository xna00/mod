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
define(["require", "exports", "vs/nls", "vs/editor/common/config/editorOptions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/severity", "vs/platform/notification/common/notification", "vs/base/common/event", "vs/base/common/path", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/product/common/productService", "vs/base/common/platform", "vs/base/common/lifecycle"], function (require, exports, nls, editorOptions_1, configuration_1, terminal_1, severity_1, notification_1, event_1, path_1, extensionManagement_1, instantiation_1, extensionsActions_1, productService_1, platform_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalConfigHelper = void 0;
    var FontConstants;
    (function (FontConstants) {
        FontConstants[FontConstants["MinimumFontSize"] = 6] = "MinimumFontSize";
        FontConstants[FontConstants["MaximumFontSize"] = 100] = "MaximumFontSize";
    })(FontConstants || (FontConstants = {}));
    /**
     * Encapsulates terminal configuration logic, the primary purpose of this file is so that platform
     * specific test cases can be written.
     */
    let TerminalConfigHelper = class TerminalConfigHelper extends lifecycle_1.Disposable {
        get onConfigChanged() { return this._onConfigChanged.event; }
        constructor(_configurationService, _extensionManagementService, _notificationService, _instantiationService, _productService) {
            super();
            this._configurationService = _configurationService;
            this._extensionManagementService = _extensionManagementService;
            this._notificationService = _notificationService;
            this._instantiationService = _instantiationService;
            this._productService = _productService;
            this._linuxDistro = 1 /* LinuxDistro.Unknown */;
            this._onConfigChanged = this._register(new event_1.Emitter());
            this._recommendationsShown = false;
            this._updateConfig();
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(terminal_1.TERMINAL_CONFIG_SECTION)) {
                    this._updateConfig();
                }
            }));
            if (platform_1.isLinux) {
                if (navigator.userAgent.includes('Ubuntu')) {
                    this._linuxDistro = 3 /* LinuxDistro.Ubuntu */;
                }
                else if (navigator.userAgent.includes('Fedora')) {
                    this._linuxDistro = 2 /* LinuxDistro.Fedora */;
                }
            }
        }
        _updateConfig() {
            const configValues = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION);
            configValues.fontWeight = this._normalizeFontWeight(configValues.fontWeight, terminal_1.DEFAULT_FONT_WEIGHT);
            configValues.fontWeightBold = this._normalizeFontWeight(configValues.fontWeightBold, terminal_1.DEFAULT_BOLD_FONT_WEIGHT);
            this.config = configValues;
            this._onConfigChanged.fire();
        }
        configFontIsMonospace() {
            const fontSize = 15;
            const fontFamily = this.config.fontFamily || this._configurationService.getValue('editor').fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            const iRect = this._getBoundingRectFor('i', fontFamily, fontSize);
            const wRect = this._getBoundingRectFor('w', fontFamily, fontSize);
            // Check for invalid bounds, there is no reason to believe the font is not monospace
            if (!iRect || !wRect || !iRect.width || !wRect.width) {
                return true;
            }
            return iRect.width === wRect.width;
        }
        _createCharMeasureElementIfNecessary() {
            if (!this.panelContainer) {
                throw new Error('Cannot measure element when terminal is not attached');
            }
            // Create charMeasureElement if it hasn't been created or if it was orphaned by its parent
            if (!this._charMeasureElement || !this._charMeasureElement.parentElement) {
                this._charMeasureElement = document.createElement('div');
                this.panelContainer.appendChild(this._charMeasureElement);
            }
            return this._charMeasureElement;
        }
        _getBoundingRectFor(char, fontFamily, fontSize) {
            let charMeasureElement;
            try {
                charMeasureElement = this._createCharMeasureElementIfNecessary();
            }
            catch {
                return undefined;
            }
            const style = charMeasureElement.style;
            style.display = 'inline-block';
            style.fontFamily = fontFamily;
            style.fontSize = fontSize + 'px';
            style.lineHeight = 'normal';
            charMeasureElement.innerText = char;
            const rect = charMeasureElement.getBoundingClientRect();
            style.display = 'none';
            return rect;
        }
        _measureFont(w, fontFamily, fontSize, letterSpacing, lineHeight) {
            const rect = this._getBoundingRectFor('X', fontFamily, fontSize);
            // Bounding client rect was invalid, use last font measurement if available.
            if (this._lastFontMeasurement && (!rect || !rect.width || !rect.height)) {
                return this._lastFontMeasurement;
            }
            this._lastFontMeasurement = {
                fontFamily,
                fontSize,
                letterSpacing,
                lineHeight,
                charWidth: 0,
                charHeight: 0
            };
            if (rect && rect.width && rect.height) {
                this._lastFontMeasurement.charHeight = Math.ceil(rect.height);
                // Char width is calculated differently for DOM and the other renderer types. Refer to
                // how each renderer updates their dimensions in xterm.js
                if (this.config.gpuAcceleration === 'off') {
                    this._lastFontMeasurement.charWidth = rect.width;
                }
                else {
                    const deviceCharWidth = Math.floor(rect.width * w.devicePixelRatio);
                    const deviceCellWidth = deviceCharWidth + Math.round(letterSpacing);
                    const cssCellWidth = deviceCellWidth / w.devicePixelRatio;
                    this._lastFontMeasurement.charWidth = cssCellWidth - Math.round(letterSpacing) / w.devicePixelRatio;
                }
            }
            return this._lastFontMeasurement;
        }
        /**
         * Gets the font information based on the terminal.integrated.fontFamily
         * terminal.integrated.fontSize, terminal.integrated.lineHeight configuration properties
         */
        getFont(w, xtermCore, excludeDimensions) {
            const editorConfig = this._configurationService.getValue('editor');
            let fontFamily = this.config.fontFamily || editorConfig.fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            let fontSize = this._clampInt(this.config.fontSize, 6 /* FontConstants.MinimumFontSize */, 100 /* FontConstants.MaximumFontSize */, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize);
            // Work around bad font on Fedora/Ubuntu
            if (!this.config.fontFamily) {
                if (this._linuxDistro === 2 /* LinuxDistro.Fedora */) {
                    fontFamily = '\'DejaVu Sans Mono\'';
                }
                if (this._linuxDistro === 3 /* LinuxDistro.Ubuntu */) {
                    fontFamily = '\'Ubuntu Mono\'';
                    // Ubuntu mono is somehow smaller, so set fontSize a bit larger to get the same perceived size.
                    fontSize = this._clampInt(fontSize + 2, 6 /* FontConstants.MinimumFontSize */, 100 /* FontConstants.MaximumFontSize */, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize);
                }
            }
            // Always fallback to monospace, otherwise a proportional font may become the default
            fontFamily += ', monospace';
            const letterSpacing = this.config.letterSpacing ? Math.max(Math.floor(this.config.letterSpacing), terminal_1.MINIMUM_LETTER_SPACING) : terminal_1.DEFAULT_LETTER_SPACING;
            const lineHeight = this.config.lineHeight ? Math.max(this.config.lineHeight, 1) : terminal_1.DEFAULT_LINE_HEIGHT;
            if (excludeDimensions) {
                return {
                    fontFamily,
                    fontSize,
                    letterSpacing,
                    lineHeight
                };
            }
            // Get the character dimensions from xterm if it's available
            if (xtermCore?._renderService?._renderer.value) {
                const cellDims = xtermCore._renderService.dimensions.css.cell;
                if (cellDims?.width && cellDims?.height) {
                    return {
                        fontFamily,
                        fontSize,
                        letterSpacing,
                        lineHeight,
                        charHeight: cellDims.height / lineHeight,
                        charWidth: cellDims.width - Math.round(letterSpacing) / w.devicePixelRatio
                    };
                }
            }
            // Fall back to measuring the font ourselves
            return this._measureFont(w, fontFamily, fontSize, letterSpacing, lineHeight);
        }
        _clampInt(source, minimum, maximum, fallback) {
            let r = parseInt(source, 10);
            if (isNaN(r)) {
                return fallback;
            }
            if (typeof minimum === 'number') {
                r = Math.max(minimum, r);
            }
            if (typeof maximum === 'number') {
                r = Math.min(maximum, r);
            }
            return r;
        }
        async showRecommendations(shellLaunchConfig) {
            if (this._recommendationsShown) {
                return;
            }
            this._recommendationsShown = true;
            if (platform_1.isWindows && shellLaunchConfig.executable && (0, path_1.basename)(shellLaunchConfig.executable).toLowerCase() === 'wsl.exe') {
                const exeBasedExtensionTips = this._productService.exeBasedExtensionTips;
                if (!exeBasedExtensionTips || !exeBasedExtensionTips.wsl) {
                    return;
                }
                const extId = Object.keys(exeBasedExtensionTips.wsl.recommendations).find(extId => exeBasedExtensionTips.wsl.recommendations[extId].important);
                if (extId && !await this._isExtensionInstalled(extId)) {
                    this._notificationService.prompt(severity_1.default.Info, nls.localize('useWslExtension.title', "The '{0}' extension is recommended for opening a terminal in WSL.", exeBasedExtensionTips.wsl.friendlyName), [
                        {
                            label: nls.localize('install', 'Install'),
                            run: () => {
                                this._instantiationService.createInstance(extensionsActions_1.InstallRecommendedExtensionAction, extId).run();
                            }
                        }
                    ], {
                        sticky: true,
                        neverShowAgain: { id: 'terminalConfigHelper/launchRecommendationsIgnore', scope: notification_1.NeverShowAgainScope.APPLICATION },
                        onCancel: () => { }
                    });
                }
            }
        }
        async _isExtensionInstalled(id) {
            const extensions = await this._extensionManagementService.getInstalled();
            return extensions.some(e => e.identifier.id === id);
        }
        _normalizeFontWeight(input, defaultWeight) {
            if (input === 'normal' || input === 'bold') {
                return input;
            }
            return this._clampInt(input, terminal_1.MINIMUM_FONT_WEIGHT, terminal_1.MAXIMUM_FONT_WEIGHT, defaultWeight);
        }
    };
    exports.TerminalConfigHelper = TerminalConfigHelper;
    exports.TerminalConfigHelper = TerminalConfigHelper = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, extensionManagement_1.IExtensionManagementService),
        __param(2, notification_1.INotificationService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, productService_1.IProductService)
    ], TerminalConfigHelper);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDb25maWdIZWxwZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxDb25maWdIZWxwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxJQUFXLGFBR1Y7SUFIRCxXQUFXLGFBQWE7UUFDdkIsdUVBQW1CLENBQUE7UUFDbkIseUVBQXFCLENBQUE7SUFDdEIsQ0FBQyxFQUhVLGFBQWEsS0FBYixhQUFhLFFBR3ZCO0lBRUQ7OztPQUdHO0lBQ0ksSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTtRQVNuRCxJQUFJLGVBQWUsS0FBa0IsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUUxRSxZQUN3QixxQkFBNkQsRUFDdkQsMkJBQXlFLEVBQ2hGLG9CQUEyRCxFQUMxRCxxQkFBNkQsRUFDbkUsZUFBaUQ7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFOZ0MsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUN0QyxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQTZCO1lBQy9ELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDekMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUNsRCxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFYekQsaUJBQVksK0JBQW9DO1lBR3pDLHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBeUxoRSwwQkFBcUIsR0FBRyxLQUFLLENBQUM7WUE5S3JDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FB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