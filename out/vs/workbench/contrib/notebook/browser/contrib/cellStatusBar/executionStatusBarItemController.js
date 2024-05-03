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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/notebookVisibleCellObserver", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/workbench/contrib/notebook/browser/contrib/cellCommands/cellCommands", "vs/platform/keybinding/common/keybinding"], function (require, exports, async_1, lifecycle_1, platform_1, nls_1, instantiation_1, themeService_1, themables_1, notebookVisibleCellObserver_1, notebookEditorExtensions_1, notebookEditorWidget_1, notebookIcons_1, notebookCommon_1, notebookExecutionStateService_1, notebookService_1, codeCellViewModel_1, cellCommands_1, keybinding_1) {
    "use strict";
    var ExecutionStateCellStatusBarItem_1, TimerCellStatusBarItem_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagnosticCellStatusBarContrib = exports.TimerCellStatusBarContrib = exports.ExecutionStateCellStatusBarContrib = exports.NotebookStatusBarController = void 0;
    exports.formatCellDuration = formatCellDuration;
    function formatCellDuration(duration, showMilliseconds = true) {
        if (showMilliseconds && duration < 1000) {
            return `${duration}ms`;
        }
        const minutes = Math.floor(duration / 1000 / 60);
        const seconds = Math.floor(duration / 1000) % 60;
        const tenths = Math.floor((duration % 1000) / 100);
        if (minutes > 0) {
            return `${minutes}m ${seconds}.${tenths}s`;
        }
        else {
            return `${seconds}.${tenths}s`;
        }
    }
    class NotebookStatusBarController extends lifecycle_1.Disposable {
        constructor(_notebookEditor, _itemFactory) {
            super();
            this._notebookEditor = _notebookEditor;
            this._itemFactory = _itemFactory;
            this._visibleCells = new Map();
            this._observer = this._register(new notebookVisibleCellObserver_1.NotebookVisibleCellObserver(this._notebookEditor));
            this._register(this._observer.onDidChangeVisibleCells(this._updateVisibleCells, this));
            this._updateEverything();
        }
        _updateEverything() {
            this._visibleCells.forEach(lifecycle_1.dispose);
            this._visibleCells.clear();
            this._updateVisibleCells({ added: this._observer.visibleCells, removed: [] });
        }
        _updateVisibleCells(e) {
            const vm = this._notebookEditor.getViewModel();
            if (!vm) {
                return;
            }
            for (const oldCell of e.removed) {
                this._visibleCells.get(oldCell.handle)?.dispose();
                this._visibleCells.delete(oldCell.handle);
            }
            for (const newCell of e.added) {
                this._visibleCells.set(newCell.handle, this._itemFactory(vm, newCell));
            }
        }
        dispose() {
            super.dispose();
            this._visibleCells.forEach(lifecycle_1.dispose);
            this._visibleCells.clear();
        }
    }
    exports.NotebookStatusBarController = NotebookStatusBarController;
    let ExecutionStateCellStatusBarContrib = class ExecutionStateCellStatusBarContrib extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.statusBar.execState'; }
        constructor(notebookEditor, instantiationService) {
            super();
            this._register(new NotebookStatusBarController(notebookEditor, (vm, cell) => instantiationService.createInstance(ExecutionStateCellStatusBarItem, vm, cell)));
        }
    };
    exports.ExecutionStateCellStatusBarContrib = ExecutionStateCellStatusBarContrib;
    exports.ExecutionStateCellStatusBarContrib = ExecutionStateCellStatusBarContrib = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ExecutionStateCellStatusBarContrib);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(ExecutionStateCellStatusBarContrib.id, ExecutionStateCellStatusBarContrib);
    /**
     * Shows the cell's execution state in the cell status bar. When the "executing" state is shown, it will be shown for a minimum brief time.
     */
    let ExecutionStateCellStatusBarItem = class ExecutionStateCellStatusBarItem extends lifecycle_1.Disposable {
        static { ExecutionStateCellStatusBarItem_1 = this; }
        static { this.MIN_SPINNER_TIME = 500; }
        constructor(_notebookViewModel, _cell, _executionStateService) {
            super();
            this._notebookViewModel = _notebookViewModel;
            this._cell = _cell;
            this._executionStateService = _executionStateService;
            this._currentItemIds = [];
            this._clearExecutingStateTimer = this._register(new lifecycle_1.MutableDisposable());
            this._update();
            this._register(this._executionStateService.onDidChangeExecution(e => {
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && e.affectsCell(this._cell.uri)) {
                    this._update();
                }
            }));
            this._register(this._cell.model.onDidChangeInternalMetadata(() => this._update()));
        }
        async _update() {
            const items = this._getItemsForCell();
            if (Array.isArray(items)) {
                this._currentItemIds = this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items }]);
            }
        }
        /**
         *	Returns undefined if there should be no change, and an empty array if all items should be removed.
         */
        _getItemsForCell() {
            const runState = this._executionStateService.getCellExecution(this._cell.uri);
            // Show the execution spinner for a minimum time
            if (runState?.state === notebookCommon_1.NotebookCellExecutionState.Executing && typeof this._showedExecutingStateTime !== 'number') {
                this._showedExecutingStateTime = Date.now();
            }
            else if (runState?.state !== notebookCommon_1.NotebookCellExecutionState.Executing && typeof this._showedExecutingStateTime === 'number') {
                const timeUntilMin = ExecutionStateCellStatusBarItem_1.MIN_SPINNER_TIME - (Date.now() - this._showedExecutingStateTime);
                if (timeUntilMin > 0) {
                    if (!this._clearExecutingStateTimer.value) {
                        this._clearExecutingStateTimer.value = (0, async_1.disposableTimeout)(() => {
                            this._showedExecutingStateTime = undefined;
                            this._clearExecutingStateTimer.clear();
                            this._update();
                        }, timeUntilMin);
                    }
                    return undefined;
                }
                else {
                    this._showedExecutingStateTime = undefined;
                }
            }
            const items = this._getItemForState(runState, this._cell.internalMetadata);
            return items;
        }
        _getItemForState(runState, internalMetadata) {
            const state = runState?.state;
            const { lastRunSuccess } = internalMetadata;
            if (!state && lastRunSuccess) {
                return [{
                        text: `$(${notebookIcons_1.successStateIcon.id})`,
                        color: (0, themeService_1.themeColorFromId)(notebookEditorWidget_1.cellStatusIconSuccess),
                        tooltip: (0, nls_1.localize)('notebook.cell.status.success', "Success"),
                        alignment: 1 /* CellStatusbarAlignment.Left */,
                        priority: Number.MAX_SAFE_INTEGER
                    }];
            }
            else if (!state && lastRunSuccess === false) {
                return [{
                        text: `$(${notebookIcons_1.errorStateIcon.id})`,
                        color: (0, themeService_1.themeColorFromId)(notebookEditorWidget_1.cellStatusIconError),
                        tooltip: (0, nls_1.localize)('notebook.cell.status.failed', "Failed"),
                        alignment: 1 /* CellStatusbarAlignment.Left */,
                        priority: Number.MAX_SAFE_INTEGER
                    }];
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Pending || state === notebookCommon_1.NotebookCellExecutionState.Unconfirmed) {
                return [{
                        text: `$(${notebookIcons_1.pendingStateIcon.id})`,
                        tooltip: (0, nls_1.localize)('notebook.cell.status.pending', "Pending"),
                        alignment: 1 /* CellStatusbarAlignment.Left */,
                        priority: Number.MAX_SAFE_INTEGER
                    }];
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                const icon = runState?.didPause ?
                    notebookIcons_1.executingStateIcon :
                    themables_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin');
                return [{
                        text: `$(${icon.id})`,
                        tooltip: (0, nls_1.localize)('notebook.cell.status.executing', "Executing"),
                        alignment: 1 /* CellStatusbarAlignment.Left */,
                        priority: Number.MAX_SAFE_INTEGER
                    }];
            }
            return [];
        }
        dispose() {
            super.dispose();
            this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items: [] }]);
        }
    };
    ExecutionStateCellStatusBarItem = ExecutionStateCellStatusBarItem_1 = __decorate([
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], ExecutionStateCellStatusBarItem);
    let TimerCellStatusBarContrib = class TimerCellStatusBarContrib extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.statusBar.execTimer'; }
        constructor(notebookEditor, instantiationService) {
            super();
            this._register(new NotebookStatusBarController(notebookEditor, (vm, cell) => instantiationService.createInstance(TimerCellStatusBarItem, vm, cell)));
        }
    };
    exports.TimerCellStatusBarContrib = TimerCellStatusBarContrib;
    exports.TimerCellStatusBarContrib = TimerCellStatusBarContrib = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], TimerCellStatusBarContrib);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(TimerCellStatusBarContrib.id, TimerCellStatusBarContrib);
    const UPDATE_TIMER_GRACE_PERIOD = 200;
    let TimerCellStatusBarItem = class TimerCellStatusBarItem extends lifecycle_1.Disposable {
        static { TimerCellStatusBarItem_1 = this; }
        static { this.UPDATE_INTERVAL = 100; }
        constructor(_notebookViewModel, _cell, _executionStateService, _notebookService) {
            super();
            this._notebookViewModel = _notebookViewModel;
            this._cell = _cell;
            this._executionStateService = _executionStateService;
            this._notebookService = _notebookService;
            this._currentItemIds = [];
            this._scheduler = this._register(new async_1.RunOnceScheduler(() => this._update(), TimerCellStatusBarItem_1.UPDATE_INTERVAL));
            this._update();
            this._register(this._cell.model.onDidChangeInternalMetadata(() => this._update()));
        }
        async _update() {
            let timerItem;
            const runState = this._executionStateService.getCellExecution(this._cell.uri);
            const state = runState?.state;
            const startTime = this._cell.internalMetadata.runStartTime;
            const adjustment = this._cell.internalMetadata.runStartTimeAdjustment ?? 0;
            const endTime = this._cell.internalMetadata.runEndTime;
            if (runState?.didPause) {
                timerItem = undefined;
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                if (typeof startTime === 'number') {
                    timerItem = this._getTimeItem(startTime, Date.now(), adjustment);
                    this._scheduler.schedule();
                }
            }
            else if (!state) {
                if (typeof startTime === 'number' && typeof endTime === 'number') {
                    const timerDuration = Date.now() - startTime + adjustment;
                    const executionDuration = endTime - startTime;
                    const renderDuration = this._cell.internalMetadata.renderDuration ?? {};
                    timerItem = this._getTimeItem(startTime, endTime, undefined, {
                        timerDuration,
                        executionDuration,
                        renderDuration
                    });
                }
            }
            const items = timerItem ? [timerItem] : [];
            if (!items.length && !!runState) {
                if (!this._deferredUpdate) {
                    this._deferredUpdate = (0, async_1.disposableTimeout)(() => {
                        this._deferredUpdate = undefined;
                        this._currentItemIds = this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items }]);
                    }, UPDATE_TIMER_GRACE_PERIOD);
                }
            }
            else {
                this._deferredUpdate?.dispose();
                this._deferredUpdate = undefined;
                this._currentItemIds = this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items }]);
            }
        }
        _getTimeItem(startTime, endTime, adjustment = 0, runtimeInformation) {
            const duration = endTime - startTime + adjustment;
            let tooltip;
            if (runtimeInformation) {
                const lastExecution = new Date(endTime).toLocaleTimeString(platform_1.language);
                const { renderDuration, executionDuration, timerDuration } = runtimeInformation;
                let renderTimes = '';
                for (const key in renderDuration) {
                    const rendererInfo = this._notebookService.getRendererInfo(key);
                    const args = encodeURIComponent(JSON.stringify({
                        extensionId: rendererInfo?.extensionId.value ?? '',
                        issueBody: `Auto-generated text from notebook cell performance. The duration for the renderer, ${rendererInfo?.displayName ?? key}, is slower than expected.\n` +
                            `Execution Time: ${formatCellDuration(executionDuration)}\n` +
                            `Renderer Duration: ${formatCellDuration(renderDuration[key])}\n`
                    }));
                    renderTimes += `- [${rendererInfo?.displayName ?? key}](command:workbench.action.openIssueReporter?${args}) ${formatCellDuration(renderDuration[key])}\n`;
                }
                renderTimes += `\n*${(0, nls_1.localize)('notebook.cell.statusBar.timerTooltip.reportIssueFootnote', "Use the links above to file an issue using the issue reporter.")}*\n`;
                tooltip = {
                    value: (0, nls_1.localize)('notebook.cell.statusBar.timerTooltip', "**Last Execution** {0}\n\n**Execution Time** {1}\n\n**Overhead Time** {2}\n\n**Render Times**\n\n{3}", lastExecution, formatCellDuration(executionDuration), formatCellDuration(timerDuration - executionDuration), renderTimes),
                    isTrusted: true
                };
            }
            return {
                text: formatCellDuration(duration, false),
                alignment: 1 /* CellStatusbarAlignment.Left */,
                priority: Number.MAX_SAFE_INTEGER - 5,
                tooltip
            };
        }
        dispose() {
            super.dispose();
            this._deferredUpdate?.dispose();
            this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items: [] }]);
        }
    };
    TimerCellStatusBarItem = TimerCellStatusBarItem_1 = __decorate([
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(3, notebookService_1.INotebookService)
    ], TimerCellStatusBarItem);
    let DiagnosticCellStatusBarContrib = class DiagnosticCellStatusBarContrib extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.statusBar.diagtnostic'; }
        constructor(notebookEditor, instantiationService) {
            super();
            this._register(new NotebookStatusBarController(notebookEditor, (vm, cell) => cell instanceof codeCellViewModel_1.CodeCellViewModel ?
                instantiationService.createInstance(DiagnosticCellStatusBarItem, vm, cell) :
                lifecycle_1.Disposable.None));
        }
    };
    exports.DiagnosticCellStatusBarContrib = DiagnosticCellStatusBarContrib;
    exports.DiagnosticCellStatusBarContrib = DiagnosticCellStatusBarContrib = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], DiagnosticCellStatusBarContrib);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(DiagnosticCellStatusBarContrib.id, DiagnosticCellStatusBarContrib);
    let DiagnosticCellStatusBarItem = class DiagnosticCellStatusBarItem extends lifecycle_1.Disposable {
        constructor(_notebookViewModel, cell, keybindingService) {
            super();
            this._notebookViewModel = _notebookViewModel;
            this.cell = cell;
            this.keybindingService = keybindingService;
            this._currentItemIds = [];
            this._update();
            this._register(this.cell.cellDiagnostics.onDidDiagnosticsChange(() => this._update()));
        }
        async _update() {
            let item;
            if (!!this.cell.cellDiagnostics.ErrorDetails) {
                const keybinding = this.keybindingService.lookupKeybinding(cellCommands_1.OPEN_CELL_FAILURE_ACTIONS_COMMAND_ID)?.getLabel();
                const tooltip = (0, nls_1.localize)('notebook.cell.status.diagnostic', "Quick Actions {0}", `(${keybinding})`);
                item = {
                    text: `$(sparkle)`,
                    tooltip,
                    alignment: 1 /* CellStatusbarAlignment.Left */,
                    command: cellCommands_1.OPEN_CELL_FAILURE_ACTIONS_COMMAND_ID,
                    priority: Number.MAX_SAFE_INTEGER - 1
                };
            }
            const items = item ? [item] : [];
            this._currentItemIds = this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this.cell.handle, items }]);
        }
        dispose() {
            super.dispose();
            this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this.cell.handle, items: [] }]);
        }
    };
    DiagnosticCellStatusBarItem = __decorate([
        __param(2, keybinding_1.IKeybindingService)
    ], DiagnosticCellStatusBarItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0aW9uU3RhdHVzQmFySXRlbUNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9jZWxsU3RhdHVzQmFyL2V4ZWN1dGlvblN0YXR1c0Jhckl0ZW1Db250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFzQmhHLGdEQWNDO0lBZEQsU0FBZ0Isa0JBQWtCLENBQUMsUUFBZ0IsRUFBRSxtQkFBNEIsSUFBSTtRQUNwRixJQUFJLGdCQUFnQixJQUFJLFFBQVEsR0FBRyxJQUFJLEVBQUUsQ0FBQztZQUN6QyxPQUFPLEdBQUcsUUFBUSxJQUFJLENBQUM7UUFDeEIsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNqRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDakQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUVuRCxJQUFJLE9BQU8sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNqQixPQUFPLEdBQUcsT0FBTyxLQUFLLE9BQU8sSUFBSSxNQUFNLEdBQUcsQ0FBQztRQUM1QyxDQUFDO2FBQU0sQ0FBQztZQUNQLE9BQU8sR0FBRyxPQUFPLElBQUksTUFBTSxHQUFHLENBQUM7UUFDaEMsQ0FBQztJQUNGLENBQUM7SUFFRCxNQUFhLDJCQUE0QixTQUFRLHNCQUFVO1FBSTFELFlBQ2tCLGVBQWdDLEVBQ2hDLFlB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