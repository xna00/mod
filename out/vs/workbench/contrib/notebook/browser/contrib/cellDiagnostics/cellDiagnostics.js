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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/markers/common/markers", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/base/common/iterator", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/event"], function (require, exports, lifecycle_1, markers_1, notebookExecutionStateService_1, inlineChat_1, iterator_1, configuration_1, notebookCommon_1, event_1) {
    "use strict";
    var CellDiagnostics_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellDiagnostics = void 0;
    let CellDiagnostics = class CellDiagnostics extends lifecycle_1.Disposable {
        static { CellDiagnostics_1 = this; }
        static { this.ID = 'workbench.notebook.cellDiagnostics'; }
        get ErrorDetails() {
            return this.errorDetails;
        }
        constructor(cell, notebookExecutionStateService, markerService, inlineChatService, configurationService) {
            super();
            this.cell = cell;
            this.notebookExecutionStateService = notebookExecutionStateService;
            this.markerService = markerService;
            this.inlineChatService = inlineChatService;
            this.configurationService = configurationService;
            this._onDidDiagnosticsChange = new event_1.Emitter();
            this.onDidDiagnosticsChange = this._onDidDiagnosticsChange.event;
            this.enabled = false;
            this.listening = false;
            this.errorDetails = undefined;
            if (cell.viewType !== 'interactive') {
                this.updateEnabled();
                this._register(inlineChatService.onDidChangeProviders(() => this.updateEnabled()));
                this._register(configurationService.onDidChangeConfiguration((e) => {
                    if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.cellFailureDiagnostics)) {
                        this.updateEnabled();
                    }
                }));
            }
        }
        updateEnabled() {
            const settingEnabled = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellFailureDiagnostics);
            if (this.enabled && (!settingEnabled || iterator_1.Iterable.isEmpty(this.inlineChatService.getAllProvider()))) {
                this.enabled = false;
                this.clear();
            }
            else if (!this.enabled && settingEnabled && !iterator_1.Iterable.isEmpty(this.inlineChatService.getAllProvider())) {
                this.enabled = true;
                if (!this.listening) {
                    this.listening = true;
                    this._register(this.notebookExecutionStateService.onDidChangeExecution((e) => this.handleChangeExecutionState(e)));
                }
            }
        }
        handleChangeExecutionState(e) {
            if (this.enabled && e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && e.affectsCell(this.cell.uri)) {
                if (!!e.changed) {
                    // cell is running
                    this.clear();
                }
                else {
                    this.setDiagnostics();
                }
            }
        }
        clear() {
            if (this.ErrorDetails) {
                this.markerService.changeOne(CellDiagnostics_1.ID, this.cell.uri, []);
                this.errorDetails = undefined;
                this._onDidDiagnosticsChange.fire();
            }
        }
        setDiagnostics() {
            const metadata = this.cell.model.internalMetadata;
            if (!metadata.lastRunSuccess && metadata?.error?.location) {
                const marker = this.createMarkerData(metadata.error.message, metadata.error.location);
                this.markerService.changeOne(CellDiagnostics_1.ID, this.cell.uri, [marker]);
                this.errorDetails = metadata.error;
                this._onDidDiagnosticsChange.fire();
            }
        }
        createMarkerData(message, location) {
            return {
                severity: 8,
                message: message,
                startLineNumber: location.startLineNumber + 1,
                startColumn: location.startColumn + 1,
                endLineNumber: location.endLineNumber + 1,
                endColumn: location.endColumn + 1,
                source: 'Cell Execution Error'
            };
        }
        dispose() {
            super.dispose();
            this.clear();
        }
    };
    exports.CellDiagnostics = CellDiagnostics;
    exports.CellDiagnostics = CellDiagnostics = CellDiagnostics_1 = __decorate([
        __param(1, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(2, markers_1.IMarkerService),
        __param(3, inlineChat_1.IInlineChatService),
        __param(4, configuration_1.IConfigurationService)
    ], CellDiagnostics);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbERpYWdub3N0aWNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvY2VsbERpYWdub3N0aWNzL2NlbGxEaWFnbm9zdGljcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsc0JBQVU7O2lCQUt2QyxPQUFFLEdBQVcsb0NBQW9DLEFBQS9DLENBQWdEO1FBS3pELElBQVcsWUFBWTtZQUN0QixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDMUIsQ0FBQztRQUVELFlBQ2tCLElBQXVCLEVBQ1IsNkJBQThFLEVBQzlGLGFBQThDLEVBQzFDLGlCQUFzRCxFQUNuRCxvQkFBNEQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFOUyxTQUFJLEdBQUosSUFBSSxDQUFtQjtZQUNTLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFDN0Usa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3pCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDbEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQWpCbkUsNEJBQXVCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUN0RCwyQkFBc0IsR0FBZ0IsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQztZQUkxRSxZQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ2hCLGNBQVMsR0FBRyxLQUFLLENBQUM7WUFDbEIsaUJBQVksR0FBb0MsU0FBUyxDQUFDO1lBY2pFLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxhQUFhLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUVyQixJQUFJLENBQUMs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