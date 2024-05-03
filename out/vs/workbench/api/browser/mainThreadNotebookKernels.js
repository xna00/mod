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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/workbench/api/browser/mainThreadNotebookDto", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "../common/extHost.protocol", "vs/workbench/contrib/notebook/common/notebookService", "vs/base/common/async"], function (require, exports, arrays_1, cancellation_1, errors_1, event_1, lifecycle_1, uri_1, language_1, mainThreadNotebookDto_1, extHostCustomers_1, notebookEditorService_1, notebookExecutionStateService_1, notebookKernelService_1, extHost_protocol_1, notebookService_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebookKernels = void 0;
    class MainThreadKernel {
        get preloadUris() {
            return this.preloads.map(p => p.uri);
        }
        get preloadProvides() {
            return this.preloads.flatMap(p => p.provides);
        }
        constructor(data, _languageService) {
            this._languageService = _languageService;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.id = data.id;
            this.viewType = data.notebookType;
            this.extension = data.extensionId;
            this.implementsInterrupt = data.supportsInterrupt ?? false;
            this.label = data.label;
            this.description = data.description;
            this.detail = data.detail;
            this.supportedLanguages = (0, arrays_1.isNonEmptyArray)(data.supportedLanguages) ? data.supportedLanguages : _languageService.getRegisteredLanguageIds();
            this.implementsExecutionOrder = data.supportsExecutionOrder ?? false;
            this.hasVariableProvider = data.hasVariableProvider ?? false;
            this.localResourceRoot = uri_1.URI.revive(data.extensionLocation);
            this.preloads = data.preloads?.map(u => ({ uri: uri_1.URI.revive(u.uri), provides: u.provides })) ?? [];
        }
        update(data) {
            const event = Object.create(null);
            if (data.label !== undefined) {
                this.label = data.label;
                event.label = true;
            }
            if (data.description !== undefined) {
                this.description = data.description;
                event.description = true;
            }
            if (data.detail !== undefined) {
                this.detail = data.detail;
                event.detail = true;
            }
            if (data.supportedLanguages !== undefined) {
                this.supportedLanguages = (0, arrays_1.isNonEmptyArray)(data.supportedLanguages) ? data.supportedLanguages : this._languageService.getRegisteredLanguageIds();
                event.supportedLanguages = true;
            }
            if (data.supportsExecutionOrder !== undefined) {
                this.implementsExecutionOrder = data.supportsExecutionOrder;
                event.hasExecutionOrder = true;
            }
            if (data.supportsInterrupt !== undefined) {
                this.implementsInterrupt = data.supportsInterrupt;
                event.hasInterruptHandler = true;
            }
            if (data.hasVariableProvider !== undefined) {
                this.hasVariableProvider = data.hasVariableProvider;
                event.hasVariableProvider = true;
            }
            this._onDidChange.fire(event);
        }
    }
    class MainThreadKernelDetectionTask {
        constructor(notebookType) {
            this.notebookType = notebookType;
        }
    }
    let MainThreadNotebookKernels = class MainThreadNotebookKernels {
        constructor(extHostContext, _languageService, _notebookKernelService, _notebookExecutionStateService, _notebookService, notebookEditorService) {
            this._languageService = _languageService;
            this._notebookKernelService = _notebookKernelService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._notebookService = _notebookService;
            this._editors = new lifecycle_1.DisposableMap();
            this._disposables = new lifecycle_1.DisposableStore();
            this._kernels = new Map();
            this._kernelDetectionTasks = new Map();
            this._kernelSourceActionProviders = new Map();
            this._kernelSourceActionProvidersEventRegistrations = new Map();
            this._executions = new Map();
            this._notebookExecutions = new Map();
            this.variableRequestIndex = 0;
            this.variableRequestMap = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebookKernels);
            notebookEditorService.listNotebookEditors().forEach(this._onEditorAdd, this);
            notebookEditorService.onDidAddNotebookEditor(this._onEditorAdd, this, this._disposables);
            notebookEditorService.onDidRemoveNotebookEditor(this._onEditorRemove, this, this._disposables);
            this._disposables.add((0, lifecycle_1.toDisposable)(() => {
                // EH shut down, complete all executions started by this EH
                this._executions.forEach(e => {
                    e.complete({});
                });
                this._notebookExecutions.forEach(e => e.complete());
            }));
            this._disposables.add(this._notebookExecutionStateService.onDidChangeExecution(e => {
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell) {
                    this._proxy.$cellExecutionChanged(e.notebook, e.cellHandle, e.changed?.state);
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
            for (const [, registration] of this._kernels.values()) {
                registration.dispose();
            }
            for (const [, registration] of this._kernelDetectionTasks.values()) {
                registration.dispose();
            }
            for (const [, registration] of this._kernelSourceActionProviders.values()) {
                registration.dispose();
            }
            this._editors.dispose();
        }
        // --- kernel ipc
        _onEditorAdd(editor) {
            const ipcListener = editor.onDidReceiveMessage(e => {
                if (!editor.hasModel()) {
                    return;
                }
                const { selected } = this._notebookKernelService.getMatchingKernel(editor.textModel);
                if (!selected) {
                    return;
                }
                for (const [handle, candidate] of this._kernels) {
                    if (candidate[0] === selected) {
                        this._proxy.$acceptKernelMessageFromRenderer(handle, editor.getId(), e.message);
                        break;
                    }
                }
            });
            this._editors.set(editor, ipcListener);
        }
        _onEditorRemove(editor) {
            this._editors.deleteAndDispose(editor);
        }
        async $postMessage(handle, editorId, message) {
            const tuple = this._kernels.get(handle);
            if (!tuple) {
                throw new Error('kernel already disposed');
            }
            const [kernel] = tuple;
            let didSend = false;
            for (const [editor] of this._editors) {
                if (!editor.hasModel()) {
                    continue;
                }
                if (this._notebookKernelService.getMatchingKernel(editor.textModel).selected !== kernel) {
                    // different kernel
                    continue;
                }
                if (editorId === undefined) {
                    // all editors
                    editor.postMessage(message);
                    didSend = true;
                }
                else if (editor.getId() === editorId) {
                    // selected editors
                    editor.postMessage(message);
                    didSend = true;
                    break;
                }
            }
            return didSend;
        }
        $receiveVariable(requestId, variable) {
            const source = this.variableRequestMap.get(requestId);
            if (source) {
                source.emitOne(variable);
            }
        }
        // --- kernel adding/updating/removal
        async $addKernel(handle, data) {
            const that = this;
            const kernel = new class extends MainThreadKernel {
                async executeNotebookCellsRequest(uri, handles) {
                    await that._proxy.$executeCells(handle, uri, handles);
                }
                async cancelNotebookCellExecution(uri, handles) {
                    await that._proxy.$cancelCells(handle, uri, handles);
                }
                provideVariables(notebookUri, parentId, kind, start, token) {
                    const requestId = `${handle}variables${that.variableRequestIndex++}`;
                    if (that.variableRequestMap.has(requestId)) {
                        return that.variableRequestMap.get(requestId).asyncIterable;
                    }
                    const source = new async_1.AsyncIterableSource();
                    that.variableRequestMap.set(requestId, source);
                    that._proxy.$provideVariables(handle, requestId, notebookUri, parentId, kind, start, token).then(() => {
                        source.resolve();
                        that.variableRequestMap.delete(requestId);
                    }).catch((err) => {
                        source.reject(err);
                        that.variableRequestMap.delete(requestId);
                    });
                    return source.asyncIterable;
                }
            }(data, this._languageService);
            const listener = this._notebookKernelService.onDidChangeSelectedNotebooks(e => {
                if (e.oldKernel === kernel.id) {
                    this._proxy.$acceptNotebookAssociation(handle, e.notebook, false);
                }
                else if (e.newKernel === kernel.id) {
                    this._proxy.$acceptNotebookAssociation(handle, e.notebook, true);
                }
            });
            const registration = this._notebookKernelService.registerKernel(kernel);
            this._kernels.set(handle, [kernel, (0, lifecycle_1.combinedDisposable)(listener, registration)]);
        }
        $updateKernel(handle, data) {
            const tuple = this._kernels.get(handle);
            if (tuple) {
                tuple[0].update(data);
            }
        }
        $removeKernel(handle) {
            const tuple = this._kernels.get(handle);
            if (tuple) {
                tuple[1].dispose();
                this._kernels.delete(handle);
            }
        }
        $updateNotebookPriority(handle, notebook, value) {
            const tuple = this._kernels.get(handle);
            if (tuple) {
                this._notebookKernelService.updateKernelNotebookAffinity(tuple[0], uri_1.URI.revive(notebook), value);
            }
        }
        // --- Cell execution
        $createExecution(handle, controllerId, rawUri, cellHandle) {
            const uri = uri_1.URI.revive(rawUri);
            const notebook = this._notebookService.getNotebookTextModel(uri);
            if (!notebook) {
                throw new Error(`Notebook not found: ${uri.toString()}`);
            }
            const kernel = this._notebookKernelService.getMatchingKernel(notebook);
            if (!kernel.selected || kernel.selected.id !== controllerId) {
                throw new Error(`Kernel is not selected: ${kernel.selected?.id} !== ${controllerId}`);
            }
            const execution = this._notebookExecutionStateService.createCellExecution(uri, cellHandle);
            execution.confirm();
            this._executions.set(handle, execution);
        }
        $updateExecution(handle, data) {
            const updates = data.value;
            try {
                const execution = this._executions.get(handle);
                execution?.update(updates.map(mainThreadNotebookDto_1.NotebookDto.fromCellExecuteUpdateDto));
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
        }
        $completeExecution(handle, data) {
            try {
                const execution = this._executions.get(handle);
                execution?.complete(mainThreadNotebookDto_1.NotebookDto.fromCellExecuteCompleteDto(data.value));
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
            finally {
                this._executions.delete(handle);
            }
        }
        // --- Notebook execution
        $createNotebookExecution(handle, controllerId, rawUri) {
            const uri = uri_1.URI.revive(rawUri);
            const notebook = this._notebookService.getNotebookTextModel(uri);
            if (!notebook) {
                throw new Error(`Notebook not found: ${uri.toString()}`);
            }
            const kernel = this._notebookKernelService.getMatchingKernel(notebook);
            if (!kernel.selected || kernel.selected.id !== controllerId) {
                throw new Error(`Kernel is not selected: ${kernel.selected?.id} !== ${controllerId}`);
            }
            const execution = this._notebookExecutionStateService.createExecution(uri);
            execution.confirm();
            this._notebookExecutions.set(handle, execution);
        }
        $beginNotebookExecution(handle) {
            try {
                const execution = this._notebookExecutions.get(handle);
                execution?.begin();
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
        }
        $completeNotebookExecution(handle) {
            try {
                const execution = this._notebookExecutions.get(handle);
                execution?.complete();
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
            finally {
                this._notebookExecutions.delete(handle);
            }
        }
        // --- notebook kernel detection task
        async $addKernelDetectionTask(handle, notebookType) {
            const kernelDetectionTask = new MainThreadKernelDetectionTask(notebookType);
            const registration = this._notebookKernelService.registerNotebookKernelDetectionTask(kernelDetectionTask);
            this._kernelDetectionTasks.set(handle, [kernelDetectionTask, registration]);
        }
        $removeKernelDetectionTask(handle) {
            const tuple = this._kernelDetectionTasks.get(handle);
            if (tuple) {
                tuple[1].dispose();
                this._kernelDetectionTasks.delete(handle);
            }
        }
        // --- notebook kernel source action provider
        async $addKernelSourceActionProvider(handle, eventHandle, notebookType) {
            const kernelSourceActionProvider = {
                viewType: notebookType,
                provideKernelSourceActions: async () => {
                    const actions = await this._proxy.$provideKernelSourceActions(handle, cancellation_1.CancellationToken.None);
                    return actions.map(action => {
                        let documentation = action.documentation;
                        if (action.documentation && typeof action.documentation !== 'string') {
                            documentation = uri_1.URI.revive(action.documentation);
                        }
                        return {
                            label: action.label,
                            command: action.command,
                            description: action.description,
                            detail: action.detail,
                            documentation,
                        };
                    });
                }
            };
            if (typeof eventHandle === 'number') {
                const emitter = new event_1.Emitter();
                this._kernelSourceActionProvidersEventRegistrations.set(eventHandle, emitter);
                kernelSourceActionProvider.onDidChangeSourceActions = emitter.event;
            }
            const registration = this._notebookKernelService.registerKernelSourceActionProvider(notebookType, kernelSourceActionProvider);
            this._kernelSourceActionProviders.set(handle, [kernelSourceActionProvider, registration]);
        }
        $removeKernelSourceActionProvider(handle, eventHandle) {
            const tuple = this._kernelSourceActionProviders.get(handle);
            if (tuple) {
                tuple[1].dispose();
                this._kernelSourceActionProviders.delete(handle);
            }
            if (typeof eventHandle === 'number') {
                this._kernelSourceActionProvidersEventRegistrations.delete(eventHandle);
            }
        }
        $emitNotebookKernelSourceActionsChangeEvent(eventHandle) {
            const emitter = this._kernelSourceActionProvidersEventRegistrations.get(eventHandle);
            if (emitter instanceof event_1.Emitter) {
                emitter.fire(undefined);
            }
        }
        $variablesUpdated(notebookUri) {
            this._notebookKernelService.notifyVariablesChange(uri_1.URI.revive(notebookUri));
        }
    };
    exports.MainThreadNotebookKernels = MainThreadNotebookKernels;
    exports.MainThreadNotebookKernels = MainThreadNotebookKernels = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadNotebookKernels),
        __param(1, language_1.ILanguageService),
        __param(2, notebookKernelService_1.INotebookKernelService),
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(4, notebookService_1.INotebookService),
        __param(5, notebookEditorService_1.INotebookEditorService)
    ], MainThreadNotebookKernels);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE5vdGVib29rS2VybmVscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWROb3RlYm9va0tlcm5lbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJoRyxNQUFlLGdCQUFnQjtRQWtCOUIsSUFBVyxXQUFXO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVELElBQVcsZUFBZTtZQUN6QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCxZQUFZLElBQXlCLEVBQVUsZ0JBQWtDO1lBQWxDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUF6QmhFLGlCQUFZLEdBQUcsSUFBSSxlQUFPLEVBQThCLENBQUM7WUFFakUsZ0JBQVcsR0FBc0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUF3QmpGLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDbEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBRWxDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDO1lBQzNELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN4QixJQUFJLENBQUMsV0FBVyxH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