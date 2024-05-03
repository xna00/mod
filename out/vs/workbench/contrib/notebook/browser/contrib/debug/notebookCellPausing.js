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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, async_1, lifecycle_1, uri_1, platform_1, contributions_1, debug_1, notebookCommon_1, notebookExecutionService_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NotebookCellPausing = class NotebookCellPausing extends lifecycle_1.Disposable {
        constructor(_debugService, _notebookExecutionStateService) {
            super();
            this._debugService = _debugService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._pausedCells = new Set();
            this._register(_debugService.getModel().onDidChangeCallStack(() => {
                // First update using the stale callstack if the real callstack is empty, to reduce blinking while stepping.
                // After not pausing for 2s, update again with the latest callstack.
                this.onDidChangeCallStack(true);
                this._scheduler.schedule();
            }));
            this._scheduler = this._register(new async_1.RunOnceScheduler(() => this.onDidChangeCallStack(false), 2000));
        }
        async onDidChangeCallStack(fallBackOnStaleCallstack) {
            const newPausedCells = new Set();
            for (const session of this._debugService.getModel().getSessions()) {
                for (const thread of session.getAllThreads()) {
                    let callStack = thread.getCallStack();
                    if (fallBackOnStaleCallstack && !callStack.length) {
                        callStack = thread.getStaleCallStack();
                    }
                    callStack.forEach(sf => {
                        const parsed = notebookCommon_1.CellUri.parse(sf.source.uri);
                        if (parsed) {
                            newPausedCells.add(sf.source.uri.toString());
                            this.editIsPaused(sf.source.uri, true);
                        }
                    });
                }
            }
            for (const uri of this._pausedCells) {
                if (!newPausedCells.has(uri)) {
                    this.editIsPaused(uri_1.URI.parse(uri), false);
                    this._pausedCells.delete(uri);
                }
            }
            newPausedCells.forEach(cell => this._pausedCells.add(cell));
        }
        editIsPaused(cellUri, isPaused) {
            const parsed = notebookCommon_1.CellUri.parse(cellUri);
            if (parsed) {
                const exeState = this._notebookExecutionStateService.getCellExecution(cellUri);
                if (exeState && (exeState.isPaused !== isPaused || !exeState.didPause)) {
                    exeState.update([{
                            editType: notebookExecutionService_1.CellExecutionUpdateType.ExecutionState,
                            didPause: true,
                            isPaused
                        }]);
                }
            }
        }
    };
    NotebookCellPausing = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], NotebookCellPausing);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(NotebookCellPausing, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDZWxsUGF1c2luZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2RlYnVnL25vdGVib29rQ2VsbFBhdXNpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFjaEcsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTtRQUszQyxZQUNnQixhQUE2QyxFQUM1Qiw4QkFBK0U7WUFFL0csS0FBSyxFQUFFLENBQUM7WUFId0Isa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDWCxtQ0FBOEIsR0FBOUIsOEJBQThCLENBQWdDO1lBTi9GLGlCQUFZLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQVVqRCxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2pFLDRHQUE0RztnQkFDNUcsb0VBQW9FO2dCQUNwRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3RHLENBQUM7UUFFTyxLQUFLLENBQUMsb0JBQW9CLENBQUMsd0JBQWlDO1lBQ25FLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUFFekMsS0FBSyxNQUFNLE9B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