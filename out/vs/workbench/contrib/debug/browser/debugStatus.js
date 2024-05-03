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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/contrib/debug/common/debug", "vs/platform/configuration/common/configuration", "vs/workbench/services/statusbar/browser/statusbar"], function (require, exports, nls, lifecycle_1, debug_1, configuration_1, statusbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugStatusContribution = void 0;
    let DebugStatusContribution = class DebugStatusContribution {
        constructor(statusBarService, debugService, configurationService) {
            this.statusBarService = statusBarService;
            this.debugService = debugService;
            this.toDispose = [];
            const addStatusBarEntry = () => {
                this.entryAccessor = this.statusBarService.addEntry(this.entry, 'status.debug', 0 /* StatusbarAlignment.LEFT */, 30 /* Low Priority */);
            };
            const setShowInStatusBar = () => {
                this.showInStatusBar = configurationService.getValue('debug').showInStatusBar;
                if (this.showInStatusBar === 'always' && !this.entryAccessor) {
                    addStatusBarEntry();
                }
            };
            setShowInStatusBar();
            this.toDispose.push(this.debugService.onDidChangeState(state => {
                if (state !== 0 /* State.Inactive */ && this.showInStatusBar === 'onFirstSessionStart' && !this.entryAccessor) {
                    addStatusBarEntry();
                }
            }));
            this.toDispose.push(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug.showInStatusBar')) {
                    setShowInStatusBar();
                    if (this.entryAccessor && this.showInStatusBar === 'never') {
                        this.entryAccessor.dispose();
                        this.entryAccessor = undefined;
                    }
                }
            }));
            this.toDispose.push(this.debugService.getConfigurationManager().onDidSelectConfiguration(e => {
                this.entryAccessor?.update(this.entry);
            }));
        }
        get entry() {
            let text = '';
            const manager = this.debugService.getConfigurationManager();
            const name = manager.selectedConfiguration.name || '';
            const nameAndLaunchPresent = name && manager.selectedConfiguration.launch;
            if (nameAndLaunchPresent) {
                text = (manager.getLaunches().length > 1 ? `${name} (${manager.selectedConfiguration.launch.name})` : name);
            }
            return {
                name: nls.localize('status.debug', "Debug"),
                text: '$(debug-alt-small) ' + text,
                ariaLabel: nls.localize('debugTarget', "Debug: {0}", text),
                tooltip: nls.localize('selectAndStartDebug', "Select and start debug configuration"),
                command: 'workbench.action.debug.selectandstart'
            };
        }
        dispose() {
            this.entryAccessor?.dispose();
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    exports.DebugStatusContribution = DebugStatusContribution;
    exports.DebugStatusContribution = DebugStatusContribution = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, debug_1.IDebugService),
        __param(2, configuration_1.IConfigurationService)
    ], DebugStatusContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdTdGF0dXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2Jyb3dzZXIvZGVidWdTdGF0dXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU3pGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCO1FBTW5DLFlBQ29CLGdCQUFvRCxFQUN4RCxZQUE0QyxFQUNwQyxvQkFBMkM7WUFGOUIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN2QyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUxwRCxjQUFTLEdBQWtCLEVBQUUsQ0FBQztZQVNyQyxNQUFNLGlCQUFpQixHQUFHLEdBQUcsRUFBRTtnQkFDOUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxtQ0FBMkIsRUFBRSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDakksQ0FBQyxDQUFDO1lBRUYsTUFBTSxrQkFBa0IsR0FBRyxHQUFHLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxlQUFlLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFzQixPQUFPLENBQUMsQ0FBQyxlQUFlLENBQUM7Z0JBQ25HLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQzlELGlCQUFpQixFQUFFLENBQUM7Z0JBQ3JCLENBQUM7WUFDRixDQUFDLENBQUM7WUFDRixrQkFBa0IsRUFBRSxDQUFDO1lBRXJCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzlELElB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