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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/layout/browser/layoutService", "vs/platform/opener/common/opener", "vs/platform/quickinput/browser/quickAccess", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "./quickInput", "vs/platform/quickinput/browser/quickInputController", "vs/platform/configuration/common/configuration", "vs/base/browser/dom"], function (require, exports, cancellation_1, event_1, contextkey_1, instantiation_1, layoutService_1, opener_1, quickAccess_1, defaultStyles_1, colorRegistry_1, themeService_1, quickInput_1, quickInputController_1, configuration_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickInputService = void 0;
    let QuickInputService = class QuickInputService extends themeService_1.Themable {
        get backButton() { return this.controller.backButton; }
        get controller() {
            if (!this._controller) {
                this._controller = this._register(this.createController());
            }
            return this._controller;
        }
        get hasController() { return !!this._controller; }
        get quickAccess() {
            if (!this._quickAccess) {
                this._quickAccess = this._register(this.instantiationService.createInstance(quickAccess_1.QuickAccessController));
            }
            return this._quickAccess;
        }
        constructor(instantiationService, contextKeyService, themeService, layoutService, configurationService) {
            super(themeService);
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this._onShow = this._register(new event_1.Emitter());
            this.onShow = this._onShow.event;
            this._onHide = this._register(new event_1.Emitter());
            this.onHide = this._onHide.event;
            this.contexts = new Map();
        }
        createController(host = this.layoutService, options) {
            const defaultOptions = {
                idPrefix: 'quickInput_',
                container: host.activeContainer,
                ignoreFocusOut: () => false,
                backKeybindingLabel: () => undefined,
                setContextKey: (id) => this.setContextKey(id),
                linkOpenerDelegate: (content) => {
                    // HACK: https://github.com/microsoft/vscode/issues/173691
                    this.instantiationService.invokeFunction(accessor => {
                        const openerService = accessor.get(opener_1.IOpenerService);
                        openerService.open(content, { allowCommands: true, fromUserGesture: true });
                    });
                },
                returnFocus: () => host.focus(),
                styles: this.computeStyles(),
                hoverDelegate: this._register(this.instantiationService.createInstance(quickInput_1.QuickInputHoverDelegate))
            };
            const controller = this._register(this.instantiationService.createInstance(quickInputController_1.QuickInputController, {
                ...defaultOptions,
                ...options
            }));
            controller.layout(host.activeContainerDimension, host.activeContainerOffset.quickPickTop);
            // Layout changes
            this._register(host.onDidLayoutActiveContainer(dimension => {
                if ((0, dom_1.getWindow)(host.activeContainer) === (0, dom_1.getWindow)(controller.container)) {
                    controller.layout(dimension, host.activeContainerOffset.quickPickTop);
                }
            }));
            this._register(host.onDidChangeActiveContainer(() => {
                if (controller.isVisible()) {
                    return;
                }
                controller.layout(host.activeContainerDimension, host.activeContainerOffset.quickPickTop);
            }));
            // Context keys
            this._register(controller.onShow(() => {
                this.resetContextKeys();
                this._onShow.fire();
            }));
            this._register(controller.onHide(() => {
                this.resetContextKeys();
                this._onHide.fire();
            }));
            return controller;
        }
        setContextKey(id) {
            let key;
            if (id) {
                key = this.contexts.get(id);
                if (!key) {
                    key = new contextkey_1.RawContextKey(id, false)
                        .bindTo(this.contextKeyService);
                    this.contexts.set(id, key);
                }
            }
            if (key && key.get()) {
                return; // already active context
            }
            this.resetContextKeys();
            key?.set(true);
        }
        resetContextKeys() {
            this.contexts.forEach(context => {
                if (context.get()) {
                    context.reset();
                }
            });
        }
        pick(picks, options = {}, token = cancellation_1.CancellationToken.None) {
            return this.controller.pick(picks, options, token);
        }
        input(options = {}, token = cancellation_1.CancellationToken.None) {
            return this.controller.input(options, token);
        }
        createQuickPick() {
            return this.controller.createQuickPick();
        }
        createInputBox() {
            return this.controller.createInputBox();
        }
        createQuickWidget() {
            return this.controller.createQuickWidget();
        }
        focus() {
            this.controller.focus();
        }
        toggle() {
            this.controller.toggle();
        }
        navigate(next, quickNavigate) {
            this.controller.navigate(next, quickNavigate);
        }
        accept(keyMods) {
            return this.controller.accept(keyMods);
        }
        back() {
            return this.controller.back();
        }
        cancel() {
            return this.controller.cancel();
        }
        updateStyles() {
            if (this.hasController) {
                this.controller.applyStyles(this.computeStyles());
            }
        }
        computeStyles() {
            return {
                widget: {
                    quickInputBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.quickInputBackground),
                    quickInputForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.quickInputForeground),
                    quickInputTitleBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.quickInputTitleBackground),
                    widgetBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.widgetBorder),
                    widgetShadow: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.widgetShadow),
                },
                inputBox: defaultStyles_1.defaultInputBoxStyles,
                toggle: defaultStyles_1.defaultToggleStyles,
                countBadge: defaultStyles_1.defaultCountBadgeStyles,
                button: defaultStyles_1.defaultButtonStyles,
                progressBar: defaultStyles_1.defaultProgressBarStyles,
                keybindingLabel: defaultStyles_1.defaultKeybindingLabelStyles,
                list: (0, defaultStyles_1.getListStyles)({
                    listBackground: colorRegistry_1.quickInputBackground,
                    listFocusBackground: colorRegistry_1.quickInputListFocusBackground,
                    listFocusForeground: colorRegistry_1.quickInputListFocusForeground,
                    // Look like focused when inactive.
                    listInactiveFocusForeground: colorRegistry_1.quickInputListFocusForeground,
                    listInactiveSelectionIconForeground: colorRegistry_1.quickInputListFocusIconForeground,
                    listInactiveFocusBackground: colorRegistry_1.quickInputListFocusBackground,
                    listFocusOutline: colorRegistry_1.activeContrastBorder,
                    listInactiveFocusOutline: colorRegistry_1.activeContrastBorder,
                }),
                pickerGroup: {
                    pickerGroupBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.pickerGroupBorder),
                    pickerGroupForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.pickerGroupForeground),
                }
            };
        }
    };
    exports.QuickInputService = QuickInputService;
    exports.QuickInputService = QuickInputService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, themeService_1.IThemeService),
        __param(3, layoutService_1.ILayoutService),
        __param(4, configuration_1.IConfigurationService)
    ], QuickInputService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tJbnB1dFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3F1aWNraW5wdXQvYnJvd3Nlci9xdWlja0lucHV0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsdUJBQVE7UUFJOUMsSUFBSSxVQUFVLEtBQXdCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBUzFFLElBQVksVUFBVTtZQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFZLGFBQWEsS0FBSyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUcxRCxJQUFJLFdBQVc7WUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxtQ0FBcUIsQ0FBQyxDQUFDLENBQUM7WUFDckcsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDO1FBSUQsWUFDd0Isb0JBQTRELEVBQy9ELGlCQUF3RCxFQUM3RCxZQUEyQixFQUMxQixhQUFnRCxFQUN6QyxvQkFBOEQ7WUFFckYsS0FBSyxDQUFDLFlBQVksQ0FB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