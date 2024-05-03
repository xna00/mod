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
define(["require", "exports", "vs/editor/browser/editorBrowser", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/update/common/update", "vs/workbench/contrib/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/timer/browser/timerService", "vs/base/common/path", "vs/base/common/hash"], function (require, exports, editorBrowser_1, lifecycle_1, update_1, files, editorService_1, workspaceTrust_1, panecomposite_1, log_1, productService_1, telemetry_1, environmentService_1, timerService_1, path_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserResourcePerformanceMarks = exports.BrowserStartupTimings = exports.StartupTimings = void 0;
    let StartupTimings = class StartupTimings {
        constructor(_editorService, _paneCompositeService, _lifecycleService, _updateService, _workspaceTrustService) {
            this._editorService = _editorService;
            this._paneCompositeService = _paneCompositeService;
            this._lifecycleService = _lifecycleService;
            this._updateService = _updateService;
            this._workspaceTrustService = _workspaceTrustService;
        }
        async _isStandardStartup() {
            // check for standard startup:
            // * new window (no reload)
            // * workspace is trusted
            // * just one window
            // * explorer viewlet visible
            // * one text editor (not multiple, not webview, welcome etc...)
            // * cached data present (not rejected, not created)
            if (this._lifecycleService.startupKind !== 1 /* StartupKind.NewWindow */) {
                return (0, lifecycle_1.StartupKindToString)(this._lifecycleService.startupKind);
            }
            if (!this._workspaceTrustService.isWorkspaceTrusted()) {
                return 'Workspace not trusted';
            }
            const activeViewlet = this._paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            if (!activeViewlet || activeViewlet.getId() !== files.VIEWLET_ID) {
                return 'Explorer viewlet not visible';
            }
            const visibleEditorPanes = this._editorService.visibleEditorPanes;
            if (visibleEditorPanes.length !== 1) {
                return `Expected text editor count : 1, Actual : ${visibleEditorPanes.length}`;
            }
            if (!(0, editorBrowser_1.isCodeEditor)(visibleEditorPanes[0].getControl())) {
                return 'Active editor is not a text editor';
            }
            const activePanel = this._paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            if (activePanel) {
                return `Current active panel : ${this._paneCompositeService.getPaneComposite(activePanel.getId(), 1 /* ViewContainerLocation.Panel */)?.name}`;
            }
            const isLatestVersion = await this._updateService.isLatestVersion();
            if (isLatestVersion === false) {
                return 'Not on latest version, updates available';
            }
            return undefined;
        }
    };
    exports.StartupTimings = StartupTimings;
    exports.StartupTimings = StartupTimings = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, update_1.IUpdateService),
        __param(4, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], StartupTimings);
    let BrowserStartupTimings = class BrowserStartupTimings extends StartupTimings {
        constructor(editorService, paneCompositeService, lifecycleService, updateService, workspaceTrustService, timerService, logService, environmentService, telemetryService, productService) {
            super(editorService, paneCompositeService, lifecycleService, updateService, workspaceTrustService);
            this.timerService = timerService;
            this.logService = logService;
            this.environmentService = environmentService;
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.logPerfMarks();
        }
        async logPerfMarks() {
            if (!this.environmentService.profDurationMarkers) {
                return;
            }
            await this.timerService.whenReady();
            const standardStartupError = await this._isStandardStartup();
            const perfBaseline = await this.timerService.perfBaseline;
            const [from, to] = this.environmentService.profDurationMarkers;
            const content = `${this.timerService.getDuration(from, to)}\t${this.productService.nameShort}\t${(this.productService.commit || '').slice(0, 10) || '0000000000'}\t${this.telemetryService.sessionId}\t${standardStartupError === undefined ? 'standard_start' : 'NO_standard_start : ' + standardStartupError}\t${String(perfBaseline).padStart(4, '0')}ms\n`;
            this.logService.info(`[prof-timers] ${content}`);
        }
    };
    exports.BrowserStartupTimings = BrowserStartupTimings;
    exports.BrowserStartupTimings = BrowserStartupTimings = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, update_1.IUpdateService),
        __param(4, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(5, timerService_1.ITimerService),
        __param(6, log_1.ILogService),
        __param(7, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, productService_1.IProductService)
    ], BrowserStartupTimings);
    let BrowserResourcePerformanceMarks = class BrowserResourcePerformanceMarks {
        constructor(telemetryService) {
            for (const item of performance.getEntriesByType('resource')) {
                try {
                    const url = new URL(item.name);
                    const name = path_1.posix.basename(url.pathname);
                    telemetryService.publicLog2('startup.resource.perf', {
                        hosthash: `H${(0, hash_1.hash)(url.host).toString(16)}`,
                        name,
                        duration: item.duration
                    });
                }
                catch {
                    // ignore
                }
            }
        }
    };
    exports.BrowserResourcePerformanceMarks = BrowserResourcePerformanceMarks;
    exports.BrowserResourcePerformanceMarks = BrowserResourcePerformanceMarks = __decorate([
        __param(0, telemetry_1.ITelemetryService)
    ], BrowserResourcePerformanceMarks);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnR1cFRpbWluZ3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3BlcmZvcm1hbmNlL2Jyb3dzZXIvc3RhcnR1cFRpbWluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFlLGNBQWMsR0FBN0IsTUFBZSxjQUFjO1FBRW5DLFlBQ2tDLGNBQThCLEVBQ25CLHFCQUFnRCxFQUN4RCxpQkFBb0MsRUFDdkMsY0FBOEIsRUFDWixzQkFBd0Q7WUFKMUUsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ25CLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBMkI7WUFDeEQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUN2QyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDWiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQWtDO1FBRTVHLENBQUM7UUFFUyxLQUFLLENBQUMsa0JBQWtCO1lBQ2pDLDhCQUE4QjtZQUM5QiwyQkFBMkI7WUFDM0IseUJBQXlCO1lBQ3pCLG9CQUFvQjtZQUNwQiw2QkFBNkI7WUFDN0IsZ0VBQWdFO1lBQ2hFLG9EQUFvRDtZQUNwRCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLGtDQUEwQixFQUFFLENBQUM7Z0JBQ2xFLE9BQU8sSUFBQSwrQkFBbUIsRUFBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDaEUsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDO2dCQUN2RCxPQUFPLHVCQUF1QixDQUFDO1lBQ2hDLENBQUM7WUFDRCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsc0JBQXNCLHVDQUErQixDQUFDO1lB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