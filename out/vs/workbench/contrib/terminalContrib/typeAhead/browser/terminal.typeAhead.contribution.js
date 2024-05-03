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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminalContrib/typeAhead/browser/terminalTypeAheadAddon", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, lifecycle_1, configuration_1, instantiation_1, terminalExtensions_1, terminalTypeAheadAddon_1, terminal_1) {
    "use strict";
    var TerminalTypeAheadContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalTypeAheadContribution = class TerminalTypeAheadContribution extends lifecycle_1.DisposableStore {
        static { TerminalTypeAheadContribution_1 = this; }
        static { this.ID = 'terminal.typeAhead'; }
        static get(instance) {
            return instance.getContribution(TerminalTypeAheadContribution_1.ID);
        }
        constructor(instance, _processManager, widgetManager, _configurationService, _instantiationService) {
            super();
            this._processManager = _processManager;
            this._configurationService = _configurationService;
            this._instantiationService = _instantiationService;
            this.add((0, lifecycle_1.toDisposable)(() => this._addon?.dispose()));
        }
        xtermReady(xterm) {
            this._loadTypeAheadAddon(xterm.raw);
            this.add(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.localEchoEnabled" /* TerminalSettingId.LocalEchoEnabled */)) {
                    this._loadTypeAheadAddon(xterm.raw);
                }
            }));
            // Reset the addon when the terminal launches or relaunches
            this.add(this._processManager.onProcessReady(() => {
                this._addon?.reset();
            }));
        }
        _loadTypeAheadAddon(xterm) {
            const enabled = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoEnabled;
            const isRemote = !!this._processManager.remoteAuthority;
            if (enabled === 'off' || enabled === 'auto' && !isRemote) {
                this._addon?.dispose();
                this._addon = undefined;
                return;
            }
            if (this._addon) {
                return;
            }
            if (enabled === 'on' || (enabled === 'auto' && isRemote)) {
                this._addon = this._instantiationService.createInstance(terminalTypeAheadAddon_1.TypeAheadAddon, this._processManager);
                xterm.loadAddon(this._addon);
            }
        }
    };
    TerminalTypeAheadContribution = TerminalTypeAheadContribution_1 = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService)
    ], TerminalTypeAheadContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalTypeAheadContribution.ID, TerminalTypeAheadContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwudHlwZUFoZWFkLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL3R5cGVBaGVhZC9icm93c2VyL3Rlcm1pbmFsLnR5cGVBaGVhZC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYWhHLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQThCLFNBQVEsMkJBQWU7O2lCQUMxQyxPQUFFLEdBQUcsb0JBQW9CLEFBQXZCLENBQXdCO1FBRTFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBMkI7WUFDckMsT0FBTyxRQUFRLENBQUMsZUFBZSxDQUFnQywrQkFBNkIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsRyxDQUFDO1FBSUQsWUFDQyxRQUEyQixFQUNWLGVBQXdDLEVBQ3pELGFBQW9DLEVBQ0kscUJBQTRDLEVBQzVDLHFCQUE0QztZQUVwRixLQUFLLEVBQUUsQ0FBQztZQUxTLG9CQUFlLEdBQWYsZUFBZSxDQUF5QjtZQUVqQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzVDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFHcEYsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVELFVBQVUsQ0FBQyxLQUFpRDtZQUMzRCxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNoRSxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsaUZBQW9DLEVBQUUsQ0FBQztvQkFDaEUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDckMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSiwyREFBMkQ7WUFDM0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2pELElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUM7WUFDdEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxtQkFBbUIsQ0FBQyxLQUF1QjtZQUNsRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUF5QixrQ0FBdUIsQ0FBQyxDQUFDLGdCQUFnQixDQUFDO1lBQ3RILE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQztZQUN4RCxJQUFJLE9BQU8sS0FBSyxLQUFLLElBQUksT0FBTyxLQUFLLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMxRCxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztnQkFDeEIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDakIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssTUFBTSxJQUFJLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzFELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyx1Q0FBYyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDOUYsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUIsQ0FBQztRQUNGLENBQUM7O0lBakRJLDZCQUE2QjtRQWFoQyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUNBQXFCLENBQUE7T0FkbEIsNkJBQTZCLENBa0RsQztJQUVELElBQUEsaURBQTRCLEVBQUMsNkJBQTZCLENBQUMsRUFBRSxFQUFFLDZCQUE2QixDQUFDLENBQUMifQ==