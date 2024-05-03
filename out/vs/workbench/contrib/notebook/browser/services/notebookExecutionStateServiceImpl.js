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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/resources", "vs/base/common/uuid", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, event_1, lifecycle_1, map_1, resources_1, uuid_1, accessibilitySignalService_1, instantiation_1, log_1, notebookCommon_1, notebookExecutionService_1, notebookExecutionStateService_1, notebookKernelService_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookExecutionStateService = void 0;
    let NotebookExecutionStateService = class NotebookExecutionStateService extends lifecycle_1.Disposable {
        constructor(_instantiationService, _logService, _notebookService, _accessibilitySignalService) {
            super();
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._notebookService = _notebookService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._executions = new map_1.ResourceMap();
            this._notebookExecutions = new map_1.ResourceMap();
            this._notebookListeners = new map_1.ResourceMap();
            this._cellListeners = new map_1.ResourceMap();
            this._lastFailedCells = new map_1.ResourceMap();
            this._onDidChangeExecution = this._register(new event_1.Emitter());
            this.onDidChangeExecution = this._onDidChangeExecution.event;
            this._onDidChangeLastRunFailState = this._register(new event_1.Emitter());
            this.onDidChangeLastRunFailState = this._onDidChangeLastRunFailState.event;
        }
        getLastFailedCellForNotebook(notebook) {
            const failedCell = this._lastFailedCells.get(notebook);
            return failedCell?.visible ? failedCell.cellHandle : undefined;
        }
        forceCancelNotebookExecutions(notebookUri) {
            const notebookCellExecutions = this._executions.get(notebookUri);
            if (notebookCellExecutions) {
                for (const exe of notebookCellExecutions.values()) {
                    this._onCellExecutionDidComplete(notebookUri, exe.cellHandle, exe);
                }
            }
            if (this._notebookExecutions.has(notebookUri)) {
                this._onExecutionDidComplete(notebookUri);
            }
        }
        getCellExecution(cellUri) {
            const parsed = notebookCommon_1.CellUri.parse(cellUri);
            if (!parsed) {
                throw new Error(`Not a cell URI: ${cellUri}`);
            }
            const exeMap = this._executions.get(parsed.notebook);
            if (exeMap) {
                return exeMap.get(parsed.handle);
            }
            return undefined;
        }
        getExecution(notebook) {
            return this._notebookExecutions.get(notebook)?.[0];
        }
        getCellExecutionsForNotebook(notebook) {
            const exeMap = this._executions.get(notebook);
            return exeMap ? Array.from(exeMap.values()) : [];
        }
        getCellExecutionsByHandleForNotebook(notebook) {
            const exeMap = this._executions.get(notebook);
            return exeMap ? new Map(exeMap.entries()) : undefined;
        }
        _onCellExecutionDidChange(notebookUri, cellHandle, exe) {
            this._onDidChangeExecution.fire(new NotebookCellExecutionEvent(notebookUri, cellHandle, exe));
        }
        _onCellExecutionDidComplete(notebookUri, cellHandle, exe, lastRunSuccess) {
            const notebookExecutions = this._executions.get(notebookUri);
            if (!notebookExecutions) {
                this._logService.debug(`NotebookExecutionStateService#_onCellExecutionDidComplete - unknown notebook ${notebookUri.toString()}`);
                return;
            }
            exe.dispose();
            const cellUri = notebookCommon_1.CellUri.generate(notebookUri, cellHandle);
            this._cellListeners.get(cellUri)?.dispose();
            this._cellListeners.delete(cellUri);
            notebookExecutions.delete(cellHandle);
            if (notebookExecutions.size === 0) {
                this._executions.delete(notebookUri);
                this._notebookListeners.get(notebookUri)?.dispose();
                this._notebookListeners.delete(notebookUri);
            }
            if (lastRunSuccess !== undefined) {
                if (lastRunSuccess) {
                    if (this._executions.size === 0) {
                        this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.notebookCellCompleted);
                    }
                    this._clearLastFailedCell(notebookUri);
                }
                else {
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.notebookCellFailed);
                    this._setLastFailedCell(notebookUri, cellHandle);
                }
            }
            this._onDidChangeExecution.fire(new NotebookCellExecutionEvent(notebookUri, cellHandle));
        }
        _onExecutionDidChange(notebookUri, exe) {
            this._onDidChangeExecution.fire(new NotebookExecutionEvent(notebookUri, exe));
        }
        _onExecutionDidComplete(notebookUri) {
            const disposables = this._notebookExecutions.get(notebookUri);
            if (!Array.isArray(disposables)) {
                this._logService.debug(`NotebookExecutionStateService#_onCellExecutionDidComplete - unknown notebook ${notebookUri.toString()}`);
                return;
            }
            this._notebookExecutions.delete(notebookUri);
            this._onDidChangeExecution.fire(new NotebookExecutionEvent(notebookUri));
            disposables.forEach(d => d.dispose());
        }
        createCellExecution(notebookUri, cellHandle) {
            const notebook = this._notebookService.getNotebookTextModel(notebookUri);
            if (!notebook) {
                throw new Error(`Notebook not found: ${notebookUri.toString()}`);
            }
            let notebookExecutionMap = this._executions.get(notebookUri);
            if (!notebookExecutionMap) {
                const listeners = this._instantiationService.createInstance(NotebookExecutionListeners, notebookUri);
                this._notebookListeners.set(notebookUri, listeners);
                notebookExecutionMap = new Map();
                this._executions.set(notebookUri, notebookExecutionMap);
            }
            let exe = notebookExecutionMap.get(cellHandle);
            if (!exe) {
                exe = this._createNotebookCellExecution(notebook, cellHandle);
                notebookExecutionMap.set(cellHandle, exe);
                exe.initialize();
                this._onDidChangeExecution.fire(new NotebookCellExecutionEvent(notebookUri, cellHandle, exe));
            }
            return exe;
        }
        createExecution(notebookUri) {
            const notebook = this._notebookService.getNotebookTextModel(notebookUri);
            if (!notebook) {
                throw new Error(`Notebook not found: ${notebookUri.toString()}`);
            }
            if (!this._notebookListeners.has(notebookUri)) {
                const listeners = this._instantiationService.createInstance(NotebookExecutionListeners, notebookUri);
                this._notebookListeners.set(notebookUri, listeners);
            }
            let info = this._notebookExecutions.get(notebookUri);
            if (!info) {
                info = this._createNotebookExecution(notebook);
                this._notebookExecutions.set(notebookUri, info);
                this._onDidChangeExecution.fire(new NotebookExecutionEvent(notebookUri, info[0]));
            }
            return info[0];
        }
        _createNotebookCellExecution(notebook, cellHandle) {
            const notebookUri = notebook.uri;
            const exe = this._instantiationService.createInstance(CellExecution, cellHandle, notebook);
            const disposable = (0, lifecycle_1.combinedDisposable)(exe.onDidUpdate(() => this._onCellExecutionDidChange(notebookUri, cellHandle, exe)), exe.onDidComplete(lastRunSuccess => this._onCellExecutionDidComplete(notebookUri, cellHandle, exe, lastRunSuccess)));
            this._cellListeners.set(notebookCommon_1.CellUri.generate(notebookUri, cellHandle), disposable);
            return exe;
        }
        _createNotebookExecution(notebook) {
            const notebookUri = notebook.uri;
            const exe = this._instantiationService.createInstance(NotebookExecution, notebook);
            const disposable = (0, lifecycle_1.combinedDisposable)(exe.onDidUpdate(() => this._onExecutionDidChange(notebookUri, exe)), exe.onDidComplete(() => this._onExecutionDidComplete(notebookUri)));
            return [exe, disposable];
        }
        _setLastFailedCell(notebookURI, cellHandle) {
            const prevLastFailedCellInfo = this._lastFailedCells.get(notebookURI);
            const notebook = this._notebookService.getNotebookTextModel(notebookURI);
            if (!notebook) {
                return;
            }
            const newLastFailedCellInfo = {
                cellHandle: cellHandle,
                disposable: prevLastFailedCellInfo ? prevLastFailedCellInfo.disposable : this._getFailedCellListener(notebook),
                visible: true
            };
            this._lastFailedCells.set(notebookURI, newLastFailedCellInfo);
            this._onDidChangeLastRunFailState.fire({ visible: true, notebook: notebookURI });
        }
        _setLastFailedCellVisibility(notebookURI, visible) {
            const lastFailedCellInfo = this._lastFailedCells.get(notebookURI);
            if (lastFailedCellInfo) {
                this._lastFailedCells.set(notebookURI, {
                    cellHandle: lastFailedCellInfo.cellHandle,
                    disposable: lastFailedCellInfo.disposable,
                    visible: visible,
                });
            }
            this._onDidChangeLastRunFailState.fire({ visible: visible, notebook: notebookURI });
        }
        _clearLastFailedCell(notebookURI) {
            const lastFailedCellInfo = this._lastFailedCells.get(notebookURI);
            if (lastFailedCellInfo) {
                lastFailedCellInfo.disposable?.dispose();
                this._lastFailedCells.delete(notebookURI);
            }
            this._onDidChangeLastRunFailState.fire({ visible: false, notebook: notebookURI });
        }
        _getFailedCellListener(notebook) {
            return notebook.onWillAddRemoveCells((e) => {
                const lastFailedCell = this._lastFailedCells.get(notebook.uri)?.cellHandle;
                if (lastFailedCell !== undefined) {
                    const lastFailedCellPos = notebook.cells.findIndex(c => c.handle === lastFailedCell);
                    e.rawEvent.changes.forEach(([start, deleteCount, addedCells]) => {
                        if (deleteCount) {
                            if (lastFailedCellPos >= start && lastFailedCellPos < start + deleteCount) {
                                this._setLastFailedCellVisibility(notebook.uri, false);
                            }
                        }
                        if (addedCells.some(cell => cell.handle === lastFailedCell)) {
                            this._setLastFailedCellVisibility(notebook.uri, true);
                        }
                    });
                }
            });
        }
        dispose() {
            super.dispose();
            this._executions.forEach(executionMap => {
                executionMap.forEach(execution => execution.dispose());
                executionMap.clear();
            });
            this._executions.clear();
            this._notebookExecutions.forEach(disposables => {
                disposables.forEach(d => d.dispose());
            });
            this._notebookExecutions.clear();
            this._cellListeners.forEach(disposable => disposable.dispose());
            this._notebookListeners.forEach(disposable => disposable.dispose());
            this._lastFailedCells.forEach(elem => elem.disposable.dispose());
        }
    };
    exports.NotebookExecutionStateService = NotebookExecutionStateService;
    exports.NotebookExecutionStateService = NotebookExecutionStateService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, log_1.ILogService),
        __param(2, notebookService_1.INotebookService),
        __param(3, accessibilitySignalService_1.IAccessibilitySignalService)
    ], NotebookExecutionStateService);
    class NotebookCellExecutionEvent {
        constructor(notebook, cellHandle, changed) {
            this.notebook = notebook;
            this.cellHandle = cellHandle;
            this.changed = changed;
            this.type = notebookExecutionStateService_1.NotebookExecutionType.cell;
        }
        affectsCell(cell) {
            const parsedUri = notebookCommon_1.CellUri.parse(cell);
            return !!parsedUri && (0, resources_1.isEqual)(this.notebook, parsedUri.notebook) && this.cellHandle === parsedUri.handle;
        }
        affectsNotebook(notebook) {
            return (0, resources_1.isEqual)(this.notebook, notebook);
        }
    }
    class NotebookExecutionEvent {
        constructor(notebook, changed) {
            this.notebook = notebook;
            this.changed = changed;
            this.type = notebookExecutionStateService_1.NotebookExecutionType.notebook;
        }
        affectsNotebook(notebook) {
            return (0, resources_1.isEqual)(this.notebook, notebook);
        }
    }
    let NotebookExecutionListeners = class NotebookExecutionListeners extends lifecycle_1.Disposable {
        constructor(notebook, _notebookService, _notebookKernelService, _notebookExecutionService, _notebookExecutionStateService, _logService) {
            super();
            this._notebookService = _notebookService;
            this._notebookKernelService = _notebookKernelService;
            this._notebookExecutionService = _notebookExecutionService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._logService = _logService;
            this._logService.debug(`NotebookExecution#ctor ${notebook.toString()}`);
            const notebookModel = this._notebookService.getNotebookTextModel(notebook);
            if (!notebookModel) {
                throw new Error('Notebook not found: ' + notebook);
            }
            this._notebookModel = notebookModel;
            this._register(this._notebookModel.onWillAddRemoveCells(e => this.onWillAddRemoveCells(e)));
            this._register(this._notebookModel.onWillDispose(() => this.onWillDisposeDocument()));
        }
        cancelAll() {
            this._logService.debug(`NotebookExecutionListeners#cancelAll`);
            const exes = this._notebookExecutionStateService.getCellExecutionsForNotebook(this._notebookModel.uri);
            this._notebookExecutionService.cancelNotebookCellHandles(this._notebookModel, exes.map(exe => exe.cellHandle));
        }
        onWillDisposeDocument() {
            this._logService.debug(`NotebookExecution#onWillDisposeDocument`);
            this.cancelAll();
        }
        onWillAddRemoveCells(e) {
            const notebookExes = this._notebookExecutionStateService.getCellExecutionsByHandleForNotebook(this._notebookModel.uri);
            const executingDeletedHandles = new Set();
            const pendingDeletedHandles = new Set();
            if (notebookExes) {
                e.rawEvent.changes.forEach(([start, deleteCount]) => {
                    if (deleteCount) {
                        const deletedHandles = this._notebookModel.cells.slice(start, start + deleteCount).map(c => c.handle);
                        deletedHandles.forEach(h => {
                            const exe = notebookExes.get(h);
                            if (exe?.state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                                executingDeletedHandles.add(h);
                            }
                            else if (exe) {
                                pendingDeletedHandles.add(h);
                            }
                        });
                    }
                });
            }
            if (executingDeletedHandles.size || pendingDeletedHandles.size) {
                const kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(this._notebookModel);
                if (kernel) {
                    const implementsInterrupt = kernel.implementsInterrupt;
                    const handlesToCancel = implementsInterrupt ? [...executingDeletedHandles] : [...executingDeletedHandles, ...pendingDeletedHandles];
                    this._logService.debug(`NotebookExecution#onWillAddRemoveCells, ${JSON.stringify([...handlesToCancel])}`);
                    if (handlesToCancel.length) {
                        kernel.cancelNotebookCellExecution(this._notebookModel.uri, handlesToCancel);
                    }
                }
            }
        }
    };
    NotebookExecutionListeners = __decorate([
        __param(1, notebookService_1.INotebookService),
        __param(2, notebookKernelService_1.INotebookKernelService),
        __param(3, notebookExecutionService_1.INotebookExecutionService),
        __param(4, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(5, log_1.ILogService)
    ], NotebookExecutionListeners);
    function updateToEdit(update, cellHandle) {
        if (update.editType === notebookExecutionService_1.CellExecutionUpdateType.Output) {
            return {
                editType: 2 /* CellEditType.Output */,
                handle: update.cellHandle,
                append: update.append,
                outputs: update.outputs,
            };
        }
        else if (update.editType === notebookExecutionService_1.CellExecutionUpdateType.OutputItems) {
            return {
                editType: 7 /* CellEditType.OutputItems */,
                items: update.items,
                append: update.append,
                outputId: update.outputId
            };
        }
        else if (update.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState) {
            const newInternalMetadata = {};
            if (typeof update.executionOrder !== 'undefined') {
                newInternalMetadata.executionOrder = update.executionOrder;
            }
            if (typeof update.runStartTime !== 'undefined') {
                newInternalMetadata.runStartTime = update.runStartTime;
            }
            return {
                editType: 9 /* CellEditType.PartialInternalMetadata */,
                handle: cellHandle,
                internalMetadata: newInternalMetadata
            };
        }
        throw new Error('Unknown cell update type');
    }
    let CellExecution = class CellExecution extends lifecycle_1.Disposable {
        get state() {
            return this._state;
        }
        get notebook() {
            return this._notebookModel.uri;
        }
        get didPause() {
            return this._didPause;
        }
        get isPaused() {
            return this._isPaused;
        }
        constructor(cellHandle, _notebookModel, _logService) {
            super();
            this.cellHandle = cellHandle;
            this._notebookModel = _notebookModel;
            this._logService = _logService;
            this._onDidUpdate = this._register(new event_1.Emitter());
            this.onDidUpdate = this._onDidUpdate.event;
            this._onDidComplete = this._register(new event_1.Emitter());
            this.onDidComplete = this._onDidComplete.event;
            this._state = notebookCommon_1.NotebookCellExecutionState.Unconfirmed;
            this._didPause = false;
            this._isPaused = false;
            this._logService.debug(`CellExecution#ctor ${this.getCellLog()}`);
        }
        initialize() {
            const startExecuteEdit = {
                editType: 9 /* CellEditType.PartialInternalMetadata */,
                handle: this.cellHandle,
                internalMetadata: {
                    executionId: (0, uuid_1.generateUuid)(),
                    runStartTime: null,
                    runEndTime: null,
                    lastRunSuccess: null,
                    executionOrder: null,
                    renderDuration: null,
                }
            };
            this._applyExecutionEdits([startExecuteEdit]);
        }
        getCellLog() {
            return `${this._notebookModel.uri.toString()}, ${this.cellHandle}`;
        }
        logUpdates(updates) {
            const updateTypes = updates.map(u => notebookExecutionService_1.CellExecutionUpdateType[u.editType]).join(', ');
            this._logService.debug(`CellExecution#updateExecution ${this.getCellLog()}, [${updateTypes}]`);
        }
        confirm() {
            this._logService.debug(`CellExecution#confirm ${this.getCellLog()}`);
            this._state = notebookCommon_1.NotebookCellExecutionState.Pending;
            this._onDidUpdate.fire();
        }
        update(updates) {
            this.logUpdates(updates);
            if (updates.some(u => u.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState)) {
                this._state = notebookCommon_1.NotebookCellExecutionState.Executing;
            }
            if (!this._didPause && updates.some(u => u.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState && u.didPause)) {
                this._didPause = true;
            }
            const lastIsPausedUpdate = [...updates].reverse().find(u => u.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState && typeof u.isPaused === 'boolean');
            if (lastIsPausedUpdate) {
                this._isPaused = lastIsPausedUpdate.isPaused;
            }
            const cellModel = this._notebookModel.cells.find(c => c.handle === this.cellHandle);
            if (!cellModel) {
                this._logService.debug(`CellExecution#update, updating cell not in notebook: ${this._notebookModel.uri.toString()}, ${this.cellHandle}`);
            }
            else {
                const edits = updates.map(update => updateToEdit(update, this.cellHandle));
                this._applyExecutionEdits(edits);
            }
            if (updates.some(u => u.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState)) {
                this._onDidUpdate.fire();
            }
        }
        complete(completionData) {
            const cellModel = this._notebookModel.cells.find(c => c.handle === this.cellHandle);
            if (!cellModel) {
                this._logService.debug(`CellExecution#complete, completing cell not in notebook: ${this._notebookModel.uri.toString()}, ${this.cellHandle}`);
            }
            else {
                const edit = {
                    editType: 9 /* CellEditType.PartialInternalMetadata */,
                    handle: this.cellHandle,
                    internalMetadata: {
                        lastRunSuccess: completionData.lastRunSuccess,
                        runStartTime: this._didPause ? null : cellModel.internalMetadata.runStartTime,
                        runEndTime: this._didPause ? null : completionData.runEndTime,
                        error: completionData.error
                    }
                };
                this._applyExecutionEdits([edit]);
            }
            this._onDidComplete.fire(completionData.lastRunSuccess);
        }
        _applyExecutionEdits(edits) {
            this._notebookModel.applyEdits(edits, true, undefined, () => undefined, undefined, false);
        }
    };
    CellExecution = __decorate([
        __param(2, log_1.ILogService)
    ], CellExecution);
    let NotebookExecution = class NotebookExecution extends lifecycle_1.Disposable {
        get state() {
            return this._state;
        }
        get notebook() {
            return this._notebookModel.uri;
        }
        constructor(_notebookModel, _logService) {
            super();
            this._notebookModel = _notebookModel;
            this._logService = _logService;
            this._onDidUpdate = this._register(new event_1.Emitter());
            this.onDidUpdate = this._onDidUpdate.event;
            this._onDidComplete = this._register(new event_1.Emitter());
            this.onDidComplete = this._onDidComplete.event;
            this._state = notebookCommon_1.NotebookExecutionState.Unconfirmed;
            this._logService.debug(`NotebookExecution#ctor`);
        }
        debug(message) {
            this._logService.debug(`${message} ${this._notebookModel.uri.toString()}`);
        }
        confirm() {
            this.debug(`Execution#confirm`);
            this._state = notebookCommon_1.NotebookExecutionState.Pending;
            this._onDidUpdate.fire();
        }
        begin() {
            this.debug(`Execution#begin`);
            this._state = notebookCommon_1.NotebookExecutionState.Executing;
            this._onDidUpdate.fire();
        }
        complete() {
            this.debug(`Execution#begin`);
            this._state = notebookCommon_1.NotebookExecutionState.Unconfirmed;
            this._onDidComplete.fire();
        }
    };
    NotebookExecution = __decorate([
        __param(1, log_1.ILogService)
    ], NotebookExecution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFeGVjdXRpb25TdGF0ZVNlcnZpY2VJbXBsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3NlcnZpY2VzL25vdGVib29rRXhlY3V0aW9uU3RhdGVTZXJ2aWNlSW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrQnpGLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQThCLFNBQVEsc0JBQVU7UUFlNUQsWUFDd0IscUJBQTZELEVBQ3ZFLFdBQXlDLEVBQ3BDLGdCQUFtRCxFQUN4QywyQkFBeUU7WUFFdEcsS0FBSyxFQUFFLENBQUM7WUFMZ0MsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUN0RCxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUNuQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ3ZCLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFoQnRGLGdCQUFXLEdBQUcsSUFBSSxpQkFBVyxFQUE4QixDQUFDO1lBQzVELHdCQUFtQixHQUFHLElBQUksaUJBQVcsRUFBb0MsQ0FBQztZQUMxRSx1QkFBa0IsR0FBRyxJQUFJLGlCQUFXLEVBQThCLENBQUM7WUFDbkUsbUJBQWMsR0FBRyxJQUFJLGlCQUFXLEVBQWUsQ0FBQztZQUNoRCxxQkFBZ0IsR0FBRyxJQUFJLGlCQUFXLEVBQW1CLENBQUM7WUFFdEQsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBaUUsQ0FBQyxDQUFDO1lBQ3RJLHlCQUFvQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7WUFFdkMsaUNBQTRCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBa0MsQ0FBQyxD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