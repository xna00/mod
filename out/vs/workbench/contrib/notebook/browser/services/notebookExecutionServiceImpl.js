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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/log/common/log", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/notebook/browser/viewParts/notebookKernelQuickPickStrategy", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService"], function (require, exports, lifecycle_1, nls, commands_1, log_1, workspaceTrust_1, notebookKernelQuickPickStrategy_1, notebookCommon_1, notebookExecutionStateService_1, notebookKernelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookExecutionService = void 0;
    let NotebookExecutionService = class NotebookExecutionService {
        constructor(_commandService, _notebookKernelService, _notebookKernelHistoryService, _workspaceTrustRequestService, _logService, _notebookExecutionStateService) {
            this._commandService = _commandService;
            this._notebookKernelService = _notebookKernelService;
            this._notebookKernelHistoryService = _notebookKernelHistoryService;
            this._workspaceTrustRequestService = _workspaceTrustRequestService;
            this._logService = _logService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this.cellExecutionParticipants = new Set;
        }
        async executeNotebookCells(notebook, cells, contextKeyService) {
            const cellsArr = Array.from(cells)
                .filter(c => c.cellKind === notebookCommon_1.CellKind.Code);
            if (!cellsArr.length) {
                return;
            }
            this._logService.debug(`NotebookExecutionService#executeNotebookCells ${JSON.stringify(cellsArr.map(c => c.handle))}`);
            const message = nls.localize('notebookRunTrust', "Executing a notebook cell will run code from this workspace.");
            const trust = await this._workspaceTrustRequestService.requestWorkspaceTrust({ message });
            if (!trust) {
                return;
            }
            // create cell executions
            const cellExecutions = [];
            for (const cell of cellsArr) {
                const cellExe = this._notebookExecutionStateService.getCellExecution(cell.uri);
                if (!!cellExe) {
                    continue;
                }
                cellExecutions.push([cell, this._notebookExecutionStateService.createCellExecution(notebook.uri, cell.handle)]);
            }
            const kernel = await notebookKernelQuickPickStrategy_1.KernelPickerMRUStrategy.resolveKernel(notebook, this._notebookKernelService, this._notebookKernelHistoryService, this._commandService);
            if (!kernel) {
                // clear all pending cell executions
                cellExecutions.forEach(cellExe => cellExe[1].complete({}));
                return;
            }
            this._notebookKernelHistoryService.addMostRecentKernel(kernel);
            // filter cell executions based on selected kernel
            const validCellExecutions = [];
            for (const [cell, cellExecution] of cellExecutions) {
                if (!kernel.supportedLanguages.includes(cell.language)) {
                    cellExecution.complete({});
                }
                else {
                    validCellExecutions.push(cellExecution);
                }
            }
            // request execution
            if (validCellExecutions.length > 0) {
                await this.runExecutionParticipants(validCellExecutions);
                this._notebookKernelService.selectKernelForNotebook(kernel, notebook);
                await kernel.executeNotebookCellsRequest(notebook.uri, validCellExecutions.map(c => c.cellHandle));
                // the connecting state can change before the kernel resolves executeNotebookCellsRequest
                const unconfirmed = validCellExecutions.filter(exe => exe.state === notebookCommon_1.NotebookCellExecutionState.Unconfirmed);
                if (unconfirmed.length) {
                    this._logService.debug(`NotebookExecutionService#executeNotebookCells completing unconfirmed executions ${JSON.stringify(unconfirmed.map(exe => exe.cellHandle))}`);
                    unconfirmed.forEach(exe => exe.complete({}));
                }
            }
        }
        async cancelNotebookCellHandles(notebook, cells) {
            const cellsArr = Array.from(cells);
            this._logService.debug(`NotebookExecutionService#cancelNotebookCellHandles ${JSON.stringify(cellsArr)}`);
            const kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(notebook);
            if (kernel) {
                await kernel.cancelNotebookCellExecution(notebook.uri, cellsArr);
            }
        }
        async cancelNotebookCells(notebook, cells) {
            this.cancelNotebookCellHandles(notebook, Array.from(cells, cell => cell.handle));
        }
        registerExecutionParticipant(participant) {
            this.cellExecutionParticipants.add(participant);
            return (0, lifecycle_1.toDisposable)(() => this.cellExecutionParticipants.delete(participant));
        }
        async runExecutionParticipants(executions) {
            for (const participant of this.cellExecutionParticipants) {
                await participant.onWillExecuteCell(executions);
            }
            return;
        }
        dispose() {
            this._activeProxyKernelExecutionToken?.dispose(true);
        }
    };
    exports.NotebookExecutionService = NotebookExecutionService;
    exports.NotebookExecutionService = NotebookExecutionService = __decorate([
        __param(0, commands_1.ICommandService),
        __param(1, notebookKernelService_1.INotebookKernelService),
        __param(2, notebookKernelService_1.INotebookKernelHistoryService),
        __param(3, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(4, log_1.ILogService),
        __param(5, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], NotebookExecutionService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFeGVjdXRpb25TZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9zZXJ2aWNlcy9ub3RlYm9va0V4ZWN1dGlvblNlcnZpY2VJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBd0I7UUFJcEMsWUFDa0IsZUFBaUQsRUFDMUMsc0JBQStELEVBQ3hELDZCQUE2RSxFQUM3RSw2QkFBNkUsRUFDL0YsV0FBeUMsRUFDdEIsOEJBQStFO1lBTDdFLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUN6QiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBQ3ZDLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBK0I7WUFDNUQsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUErQjtZQUM5RSxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUNMLG1DQUE4QixHQUE5Qiw4QkFBOEIsQ0FBZ0M7WUE2RS9GLDhCQUF5QixHQUFHLElBQUksR0FBOEIsQ0FBQztRQTNFaEYsQ0FBQztRQUVELEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxRQUE0QixFQUFFLEtBQXNDLEVBQUUsaUJBQXFDO1lBQ3JJLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO2lCQUNoQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxLQUFLLHlCQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdEIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUss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