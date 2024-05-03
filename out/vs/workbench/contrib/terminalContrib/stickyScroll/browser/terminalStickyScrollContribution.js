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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/terminal/browser/terminalInstance", "vs/workbench/contrib/terminalContrib/stickyScroll/browser/terminalStickyScrollOverlay", "vs/css!./media/stickyScroll"], function (require, exports, event_1, lifecycle_1, configuration_1, contextkey_1, instantiation_1, keybinding_1, terminalInstance_1, terminalStickyScrollOverlay_1) {
    "use strict";
    var TerminalStickyScrollContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalStickyScrollContribution = void 0;
    let TerminalStickyScrollContribution = class TerminalStickyScrollContribution extends lifecycle_1.Disposable {
        static { TerminalStickyScrollContribution_1 = this; }
        static { this.ID = 'terminal.stickyScroll'; }
        static get(instance) {
            return instance.getContribution(TerminalStickyScrollContribution_1.ID);
        }
        constructor(_instance, processManager, widgetManager, _configurationService, _contextKeyService, _instantiationService, _keybindingService) {
            super();
            this._instance = _instance;
            this._configurationService = _configurationService;
            this._contextKeyService = _contextKeyService;
            this._instantiationService = _instantiationService;
            this._keybindingService = _keybindingService;
            this._overlay = this._register(new lifecycle_1.MutableDisposable());
            this._enableListeners = this._register(new lifecycle_1.MutableDisposable());
            this._disableListeners = this._register(new lifecycle_1.MutableDisposable());
            this._register(event_1.Event.runAndSubscribe(this._configurationService.onDidChangeConfiguration, e => {
                if (!e || e.affectsConfiguration("terminal.integrated.stickyScroll.enabled" /* TerminalSettingId.StickyScrollEnabled */)) {
                    this._refreshState();
                }
            }));
        }
        xtermReady(xterm) {
            this._xterm = xterm;
            this._refreshState();
        }
        xtermOpen(xterm) {
            this._refreshState();
        }
        _refreshState() {
            if (this._overlay.value) {
                this._tryDisable();
            }
            else {
                this._tryEnable();
            }
            if (this._overlay.value) {
                this._enableListeners.clear();
                if (!this._disableListeners.value) {
                    this._disableListeners.value = this._instance.capabilities.onDidRemoveCapability(e => {
                        if (e.id === 2 /* TerminalCapability.CommandDetection */) {
                            this._refreshState();
                        }
                    });
                }
            }
            else {
                this._disableListeners.clear();
                if (!this._enableListeners.value) {
                    this._enableListeners.value = this._instance.capabilities.onDidAddCapability(e => {
                        if (e.id === 2 /* TerminalCapability.CommandDetection */) {
                            this._refreshState();
                        }
                    });
                }
            }
        }
        _tryEnable() {
            if (this._shouldBeEnabled()) {
                const xtermCtorEventually = terminalInstance_1.TerminalInstance.getXtermConstructor(this._keybindingService, this._contextKeyService);
                this._overlay.value = this._instantiationService.createInstance(terminalStickyScrollOverlay_1.TerminalStickyScrollOverlay, this._instance, this._xterm, this._instantiationService.createInstance(terminalInstance_1.TerminalInstanceColorProvider, this._instance), this._instance.capabilities.get(2 /* TerminalCapability.CommandDetection */), xtermCtorEventually);
            }
        }
        _tryDisable() {
            if (!this._shouldBeEnabled()) {
                this._overlay.clear();
            }
        }
        _shouldBeEnabled() {
            const capability = this._instance.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            return !!(this._configurationService.getValue("terminal.integrated.stickyScroll.enabled" /* TerminalSettingId.StickyScrollEnabled */) && capability && this._xterm?.raw?.element);
        }
    };
    exports.TerminalStickyScrollContribution = TerminalStickyScrollContribution;
    exports.TerminalStickyScrollContribution = TerminalStickyScrollContribution = TerminalStickyScrollContribution_1 = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, keybinding_1.IKeybindingService)
    ], TerminalStickyScrollContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdGlja3lTY3JvbGxDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9zdGlja3lTY3JvbGwvYnJvd3Nlci90ZXJtaW5hbFN0aWNreVNjcm9sbENvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBa0J6RixJQUFNLGdDQUFnQyxHQUF0QyxNQUFNLGdDQUFpQyxTQUFRLHNCQUFVOztpQkFDL0MsT0FBRSxHQUFHLHVCQUF1QixBQUExQixDQUEyQjtRQUU3QyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQTJCO1lBQ3JDLE9BQU8sUUFBUSxDQUFDLGVBQWUsQ0FBbUMsa0NBQWdDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDeEcsQ0FBQztRQVNELFlBQ2tCLFNBQTRCLEVBQzdDLGNBQThELEVBQzlELGFBQW9DLEVBQ2IscUJBQTZELEVBQ2hFLGtCQUF1RCxFQUNwRCxxQkFBNkQsRUFDaEUsa0JBQXVEO1lBRTNFLEtBQUssRUFBRSxDQUFDO1lBUlMsY0FBUyxHQUFULFNBQVMsQ0FBbUI7WUFHTCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQy9DLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDbkMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUMvQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBWnBFLGFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQStCLENBQUMsQ0FBQztZQUVoRixxQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQzNELHNCQUFpQixHQUFHLElBQUksQ0FBQyxT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