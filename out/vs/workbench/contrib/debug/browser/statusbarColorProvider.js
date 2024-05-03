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
define(["require", "exports", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/debug/common/debug", "vs/platform/workspace/common/workspace", "vs/workbench/common/theme", "vs/base/common/lifecycle", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/configuration/common/configuration", "vs/platform/layout/browser/layoutService"], function (require, exports, nls_1, colorRegistry_1, debug_1, workspace_1, theme_1, lifecycle_1, statusbar_1, configuration_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusBarColorProvider = exports.COMMAND_CENTER_DEBUGGING_BACKGROUND = exports.STATUS_BAR_DEBUGGING_BORDER = exports.STATUS_BAR_DEBUGGING_FOREGROUND = exports.STATUS_BAR_DEBUGGING_BACKGROUND = void 0;
    exports.isStatusbarInDebugMode = isStatusbarInDebugMode;
    // colors for theming
    exports.STATUS_BAR_DEBUGGING_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBar.debuggingBackground', {
        dark: '#CC6633',
        light: '#CC6633',
        hcDark: '#BA592C',
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('statusBarDebuggingBackground', "Status bar background color when a program is being debugged. The status bar is shown in the bottom of the window"));
    exports.STATUS_BAR_DEBUGGING_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBar.debuggingForeground', {
        dark: theme_1.STATUS_BAR_FOREGROUND,
        light: theme_1.STATUS_BAR_FOREGROUND,
        hcDark: theme_1.STATUS_BAR_FOREGROUND,
        hcLight: '#FFFFFF'
    }, (0, nls_1.localize)('statusBarDebuggingForeground', "Status bar foreground color when a program is being debugged. The status bar is shown in the bottom of the window"));
    exports.STATUS_BAR_DEBUGGING_BORDER = (0, colorRegistry_1.registerColor)('statusBar.debuggingBorder', {
        dark: theme_1.STATUS_BAR_BORDER,
        light: theme_1.STATUS_BAR_BORDER,
        hcDark: theme_1.STATUS_BAR_BORDER,
        hcLight: theme_1.STATUS_BAR_BORDER
    }, (0, nls_1.localize)('statusBarDebuggingBorder', "Status bar border color separating to the sidebar and editor when a program is being debugged. The status bar is shown in the bottom of the window"));
    exports.COMMAND_CENTER_DEBUGGING_BACKGROUND = (0, colorRegistry_1.registerColor)('commandCenter.debuggingBackground', {
        dark: { value: exports.STATUS_BAR_DEBUGGING_BACKGROUND, op: 2 /* ColorTransformType.Transparent */, factor: 0.258 },
        hcDark: { value: exports.STATUS_BAR_DEBUGGING_BACKGROUND, op: 2 /* ColorTransformType.Transparent */, factor: 0.258 },
        light: { value: exports.STATUS_BAR_DEBUGGING_BACKGROUND, op: 2 /* ColorTransformType.Transparent */, factor: 0.258 },
        hcLight: { value: exports.STATUS_BAR_DEBUGGING_BACKGROUND, op: 2 /* ColorTransformType.Transparent */, factor: 0.258 }
    }, (0, nls_1.localize)('commandCenter-activeBackground', "Command center background color when a program is being debugged"), true);
    let StatusBarColorProvider = class StatusBarColorProvider {
        set enabled(enabled) {
            if (enabled === !!this.disposable) {
                return;
            }
            if (enabled) {
                this.disposable = this.statusbarService.overrideStyle({
                    priority: 10,
                    foreground: exports.STATUS_BAR_DEBUGGING_FOREGROUND,
                    background: exports.STATUS_BAR_DEBUGGING_BACKGROUND,
                    border: exports.STATUS_BAR_DEBUGGING_BORDER,
                });
            }
            else {
                this.disposable.dispose();
                this.disposable = undefined;
            }
        }
        constructor(debugService, contextService, statusbarService, layoutService, configurationService) {
            this.debugService = debugService;
            this.contextService = contextService;
            this.statusbarService = statusbarService;
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.debugService.onDidChangeState(this.update, this, this.disposables);
            this.contextService.onDidChangeWorkbenchState(this.update, this, this.disposables);
            this.configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('debug.enableStatusBarColor') || e.affectsConfiguration('debug.toolBarLocation')) {
                    this.update();
                }
            }, this.disposables);
            this.update();
        }
        update() {
            const debugConfig = this.configurationService.getValue('debug');
            const isInDebugMode = isStatusbarInDebugMode(this.debugService.state, this.debugService.getModel().getSessions());
            if (!debugConfig.enableStatusBarColor) {
                this.enabled = false;
            }
            else {
                this.enabled = isInDebugMode;
            }
            const isInCommandCenter = debugConfig.toolBarLocation === 'commandCenter';
            this.layoutService.mainContainer.style.setProperty((0, colorRegistry_1.asCssVariableName)(theme_1.COMMAND_CENTER_BACKGROUND), isInCommandCenter && isInDebugMode
                ? (0, colorRegistry_1.asCssVariable)(exports.COMMAND_CENTER_DEBUGGING_BACKGROUND)
                : '');
        }
        dispose() {
            this.disposable?.dispose();
            this.disposables.dispose();
        }
    };
    exports.StatusBarColorProvider = StatusBarColorProvider;
    exports.StatusBarColorProvider = StatusBarColorProvider = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, statusbar_1.IStatusbarService),
        __param(3, layoutService_1.ILayoutService),
        __param(4, configuration_1.IConfigurationService)
    ], StatusBarColorProvider);
    function isStatusbarInDebugMode(state, sessions) {
        if (state === 0 /* State.Inactive */ || state === 1 /* State.Initializing */ || sessions.every(s => s.suppressDebugStatusbar || s.configuration?.noDebug)) {
            return false;
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzYmFyQ29sb3JQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9zdGF0dXNiYXJDb2xvclByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdIaEcsd0RBTUM7SUF4R0QscUJBQXFCO0lBRVIsUUFBQSwrQkFBK0IsR0FBRyxJQUFBLDZCQUFhLEVBQUMsK0JBQStCLEVBQUU7UUFDN0YsSUFBSSxFQUFFLFNBQVM7UUFDZixLQUFLLEVBQUUsU0FBUztRQUNoQixNQUFNLEVBQUUsU0FBUztRQUNqQixPQUFPLEVBQUUsU0FBUztLQUNsQixFQUFFLElBQUEsY0FBUSxFQUFDLDhCQUE4QixFQUFFLG1IQUFtSCxDQUFDLENBQUMsQ0FBQztJQUVySixRQUFBLCtCQUErQixHQUFHLElBQUEsNkJBQWEsRUFBQywrQkFBK0IsRUFBRTtRQUM3RixJQUFJLEVBQUUsNkJBQXFCO1FBQzNCLEtBQUssRUFBRSw2QkFBcUI7UUFDNUIsTUFBTSxFQUFFLDZCQUFxQjtRQUM3QixPQUFPLEVBQUUsU0FBUztLQUNsQixFQUFFLElBQUEsY0FBUSxFQUFDLDhCQUE4QixFQUFFLG1IQUFtSCxDQUFDLENBQUMsQ0FBQztJQUVySixRQUFBLDJCQUEyQixHQUFHLElBQUEsNkJBQWEsRUFBQywyQkFBMkIsRUFBRTtRQUNyRixJQUFJLEVBQUUseUJBQWlCO1FBQ3ZCLEtBQUssRUFBRSx5QkFBaUI7UUFDeEIsTUFBTSxFQUFFLHlCQUFpQjtRQUN6QixPQUFPLEVBQUUseUJBQWlCO0tBQzFCLEVBQUUsSUFBQSxjQUFRLEVBQUMsMEJBQTBCLEVBQUUsb0pBQW9KLENBQUMsQ0FBQyxDQUFDO0lBRWxMLFFBQUEsbUNBQW1DLEdBQUcsSUFBQSw2QkFBYSxFQUMvRCxtQ0FBbUMsRUFDbkM7UUFDQyxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsdUNBQStCLEVBQUUsRUFBRSx3Q0FBZ0MsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO1FBQ25HLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSx1Q0FBK0IsRUFBRSxFQUFFLHdDQUFnQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7UUFDckcsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLHVDQUErQixFQUFFLEVBQUUsd0NBQWdDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtRQUNwRyxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsdUNBQStCLEVBQUUsRUFBRSx3Q0FBZ0MsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO0tBQ3RHLEVBQ0QsSUFBQSxjQUFRLEVBQUMsZ0NBQWdDLEVBQUUsa0VBQWtFLENBQUMsRUFDOUcsSUFBSSxDQUNKLENBQUM7SUFFSyxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUFzQjtRQUtsQyxJQUFZLE9BQU8sQ0FBQyxPQUFnQjtZQUNuQyxJQUFJLE9BQU8sS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNuQyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDO29CQUNyRCxRQUFRLEVBQUUsRUFBRTtvQkFDWixVQUFVLEVBQUUsdUNBQStCO29CQUMzQyxVQUFVLEVBQUUsdUNBQStCO29CQUMzQyxNQUFNLEVBQUUsbUNBQTJCO2lCQUNuQyxDQUFDLENBQUM7WUFDSixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFVBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDN0IsQ0FBQztRQUNGLENBQUM7UUFFRCxZQUNnQixZQUE0QyxFQUNqQyxjQUF5RCxFQUNoRSxnQkFBb0QsRUFDdkQsYUFBOEMsRUFDdkMsb0JBQTREO1lBSm5ELGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ2hCLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUMvQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3RDLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN0Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBMUJuRSxnQkFBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBNEJwRCxJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN4RSxJQUFJLENBQUMsY0FBYyxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNuRixJQUFJLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDeEQsSUFBSSxDQUFDLENBQUMsb0JBQW9CLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLENBQUMsb0JBQW9CLENBQUMsdUJBQXVCLENBQUMsRUFBRSxDQUFDO29CQUM3RyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2YsQ0FBQztZQUNGLENBQUMsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDckIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVTLE1BQU07WUFDZixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFzQixPQUFPLENBQUMsQ0FBQztZQUNyRixNQUFNLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDbEgsSUFBSSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUN2QyxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUN0QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUM7WUFDOUIsQ0FBQztZQUVELE1BQU0saUJBQWlCLEdBQUcsV0FBVyxDQUFDLGVBQWUsS0FBSyxlQUFlLENBQUM7WUFDMUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFBLGlDQUFpQixFQUFDLGlDQUF5QixDQUFDLEVBQUUsaUJBQWlCLElBQUksYUFBYTtnQkFDbEksQ0FBQyxDQUFDLElBQUEsNkJBQWEsRUFBQywyQ0FBbUMsQ0FBQztnQkFDcEQsQ0FBQyxDQUFDLEVBQUUsQ0FDSixDQUFDO1FBRUgsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUIsQ0FBQztLQUNELENBQUE7SUE3RFksd0RBQXNCO3FDQUF0QixzQkFBc0I7UUF3QmhDLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLHFDQUFxQixDQUFBO09BNUJYLHNCQUFzQixDQTZEbEM7SUFFRCxTQUFnQixzQkFBc0IsQ0FBQyxLQUFZLEVBQUUsUUFBeUI7UUFDN0UsSUFBSSxLQUFLLDJCQUFtQixJQUFJLEtBQUssK0JBQXVCLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsSUFBSSxDQUFDLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDM0ksT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDIn0=