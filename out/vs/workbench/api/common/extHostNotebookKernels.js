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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/contrib/webview/common/webview", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/proxyIdentifier", "vs/workbench/contrib/notebook/common/notebookKernelService"], function (require, exports, arrays_1, async_1, cancellation_1, event_1, lifecycle_1, map_1, uri_1, extensions_1, log_1, extHost_protocol_1, extHostCommands_1, extHostTypeConverters, extHostTypes_1, webview_1, notebookExecutionService_1, extensions_2, proxyIdentifier_1, notebookKernelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookKernels = void 0;
    exports.createKernelId = createKernelId;
    let ExtHostNotebookKernels = class ExtHostNotebookKernels {
        constructor(mainContext, _initData, _extHostNotebook, _commands, _logService) {
            this._initData = _initData;
            this._extHostNotebook = _extHostNotebook;
            this._commands = _commands;
            this._logService = _logService;
            this._activeExecutions = new map_1.ResourceMap();
            this._activeNotebookExecutions = new map_1.ResourceMap();
            this._kernelDetectionTask = new Map();
            this._kernelDetectionTaskHandlePool = 0;
            this._kernelSourceActionProviders = new Map();
            this._kernelSourceActionProviderHandlePool = 0;
            this._kernelData = new Map();
            this._handlePool = 0;
            this._onDidChangeCellExecutionState = new event_1.Emitter();
            this.onDidChangeNotebookCellExecutionState = this._onDidChangeCellExecutionState.event;
            this.id = 0;
            this.variableStore = {};
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookKernels);
            // todo@rebornix @joyceerhl: move to APICommands once stabilized.
            const selectKernelApiCommand = new extHostCommands_1.ApiCommand('notebook.selectKernel', '_notebook.selectKernel', 'Trigger kernel picker for specified notebook editor widget', [
                new extHostCommands_1.ApiCommandArgument('options', 'Select kernel options', v => true, (v) => {
                    if (v && 'notebookEditor' in v && 'id' in v) {
                        const notebookEditorId = this._extHostNotebook.getIdByEditor(v.notebookEditor);
                        return {
                            id: v.id, extension: v.extension, notebookEditorId
                        };
                    }
                    else if (v && 'notebookEditor' in v) {
                        const notebookEditorId = this._extHostNotebook.getIdByEditor(v.notebookEditor);
                        if (notebookEditorId === undefined) {
                            throw new Error(`Cannot invoke 'notebook.selectKernel' for unrecognized notebook editor ${v.notebookEditor.notebook.uri.toString()}`);
                        }
                        return { notebookEditorId };
                    }
                    return v;
                })
            ], extHostCommands_1.ApiCommandResult.Void);
            const requestKernelVariablesApiCommand = new extHostCommands_1.ApiCommand('vscode.executeNotebookVariableProvider', '_executeNotebookVariableProvider', 'Execute notebook variable provider', [extHostCommands_1.ApiCommandArgument.Uri], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of variables', (value, apiArgs) => {
                return value.map(variable => {
                    return {
                        variable: {
                            name: variable.name,
                            value: variable.value,
                            expression: variable.expression,
                            type: variable.type,
                            language: variable.language
                        },
                        hasNamedChildren: variable.hasNamedChildren,
                        indexedChildrenCount: variable.indexedChildrenCount
                    };
                });
            }));
            this._commands.registerApiCommand(selectKernelApiCommand);
            this._commands.registerApiCommand(requestKernelVariablesApiCommand);
        }
        createNotebookController(extension, id, viewType, label, handler, preloads) {
            for (const data of this._kernelData.values()) {
                if (data.controller.id === id && extensions_1.ExtensionIdentifier.equals(extension.identifier, data.extensionId)) {
                    throw new Error(`notebook controller with id '${id}' ALREADY exist`);
                }
            }
            const handle = this._handlePool++;
            const that = this;
            this._logService.trace(`NotebookController[${handle}], CREATED by ${extension.identifier.value}, ${id}`);
            const _defaultExecutHandler = () => console.warn(`NO execute handler from notebook controller '${data.id}' of extension: '${extension.identifier}'`);
            let isDisposed = false;
            const onDidChangeSelection = new event_1.Emitter();
            const onDidReceiveMessage = new event_1.Emitter();
            const data = {
                id: createKernelId(extension.identifier, id),
                notebookType: viewType,
                extensionId: extension.identifier,
                extensionLocation: extension.extensionLocation,
                label: label || extension.identifier.value,
                preloads: preloads ? preloads.map(extHostTypeConverters.NotebookRendererScript.from) : []
            };
            //
            let _executeHandler = handler ?? _defaultExecutHandler;
            let _interruptHandler;
            let _variableProvider;
            this._proxy.$addKernel(handle, data).catch(err => {
                // this can happen when a kernel with that ID is already registered
                console.log(err);
                isDisposed = true;
            });
            // update: all setters write directly into the dto object
            // and trigger an update. the actual update will only happen
            // once per event loop execution
            let tokenPool = 0;
            const _update = () => {
                if (isDisposed) {
                    return;
                }
                const myToken = ++tokenPool;
                Promise.resolve().then(() => {
                    if (myToken === tokenPool) {
                        this._proxy.$updateKernel(handle, data);
                    }
                });
            };
            // notebook documents that are associated to this controller
            const associatedNotebooks = new map_1.ResourceMap();
            const controller = {
                get id() { return id; },
                get notebookType() { return data.notebookType; },
                onDidChangeSelectedNotebooks: onDidChangeSelection.event,
                get label() {
                    return data.label;
                },
                set label(value) {
                    data.label = value ?? extension.displayName ?? extension.name;
                    _update();
                },
                get detail() {
                    return data.detail ?? '';
                },
                set detail(value) {
                    data.detail = value;
                    _update();
                },
                get description() {
                    return data.description ?? '';
                },
                set description(value) {
                    data.description = value;
                    _update();
                },
                get supportedLanguages() {
                    return data.supportedLanguages;
                },
                set supportedLanguages(value) {
                    data.supportedLanguages = value;
                    _update();
                },
                get supportsExecutionOrder() {
                    return data.supportsExecutionOrder ?? false;
                },
                set supportsExecutionOrder(value) {
                    data.supportsExecutionOrder = value;
                    _update();
                },
                get rendererScripts() {
                    return data.preloads ? data.preloads.map(extHostTypeConverters.NotebookRendererScript.to) : [];
                },
                get executeHandler() {
                    return _executeHandler;
                },
                set executeHandler(value) {
                    _executeHandler = value ?? _defaultExecutHandler;
                },
                get interruptHandler() {
                    return _interruptHandler;
                },
                set interruptHandler(value) {
                    _interruptHandler = value;
                    data.supportsInterrupt = Boolean(value);
                    _update();
                },
                set variableProvider(value) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookVariableProvider');
                    _variableProvider = value;
                    data.hasVariableProvider = !!value;
                    value?.onDidChangeVariables(e => that._proxy.$variablesUpdated(e.uri));
                    _update();
                },
                get variableProvider() {
                    return _variableProvider;
                },
                createNotebookCellExecution(cell) {
                    if (isDisposed) {
                        throw new Error('notebook controller is DISPOSED');
                    }
                    if (!associatedNotebooks.has(cell.notebook.uri)) {
                        that._logService.trace(`NotebookController[${handle}] NOT associated to notebook, associated to THESE notebooks:`, Array.from(associatedNotebooks.keys()).map(u => u.toString()));
                        throw new Error(`notebook controller is NOT associated to notebook: ${cell.notebook.uri.toString()}`);
                    }
                    return that._createNotebookCellExecution(cell, createKernelId(extension.identifier, this.id));
                },
                createNotebookExecution(notebook) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookExecution');
                    if (isDisposed) {
                        throw new Error('notebook controller is DISPOSED');
                    }
                    if (!associatedNotebooks.has(notebook.uri)) {
                        that._logService.trace(`NotebookController[${handle}] NOT associated to notebook, associated to THESE notebooks:`, Array.from(associatedNotebooks.keys()).map(u => u.toString()));
                        throw new Error(`notebook controller is NOT associated to notebook: ${notebook.uri.toString()}`);
                    }
                    return that._createNotebookExecution(notebook, createKernelId(extension.identifier, this.id));
                },
                dispose: () => {
                    if (!isDisposed) {
                        this._logService.trace(`NotebookController[${handle}], DISPOSED`);
                        isDisposed = true;
                        this._kernelData.delete(handle);
                        onDidChangeSelection.dispose();
                        onDidReceiveMessage.dispose();
                        this._proxy.$removeKernel(handle);
                    }
                },
                // --- priority
                updateNotebookAffinity(notebook, priority) {
                    if (priority === extHostTypes_1.NotebookControllerAffinity2.Hidden) {
                        // This api only adds an extra enum value, the function is the same, so just gate on the new value being passed
                        // for proposedAPI check.
                        (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookControllerAffinityHidden');
                    }
                    that._proxy.$updateNotebookPriority(handle, notebook.uri, priority);
                },
                // --- ipc
                onDidReceiveMessage: onDidReceiveMessage.event,
                postMessage(message, editor) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookMessaging');
                    return that._proxy.$postMessage(handle, editor && that._extHostNotebook.getIdByEditor(editor), message);
                },
                asWebviewUri(uri) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookMessaging');
                    return (0, webview_1.asWebviewUri)(uri, that._initData.remote);
                },
            };
            this._kernelData.set(handle, {
                extensionId: extension.identifier,
                controller,
                onDidReceiveMessage,
                onDidChangeSelection,
                associatedNotebooks
            });
            return controller;
        }
        getIdByController(controller) {
            for (const [_, candidate] of this._kernelData) {
                if (candidate.controller === controller) {
                    return createKernelId(candidate.extensionId, controller.id);
                }
            }
            return null;
        }
        createNotebookControllerDetectionTask(extension, viewType) {
            const handle = this._kernelDetectionTaskHandlePool++;
            const that = this;
            this._logService.trace(`NotebookControllerDetectionTask[${handle}], CREATED by ${extension.identifier.value}`);
            this._proxy.$addKernelDetectionTask(handle, viewType);
            const detectionTask = {
                dispose: () => {
                    this._kernelDetectionTask.delete(handle);
                    that._proxy.$removeKernelDetectionTask(handle);
                }
            };
            this._kernelDetectionTask.set(handle, detectionTask);
            return detectionTask;
        }
        registerKernelSourceActionProvider(extension, viewType, provider) {
            const handle = this._kernelSourceActionProviderHandlePool++;
            const eventHandle = typeof provider.onDidChangeNotebookKernelSourceActions === 'function' ? handle : undefined;
            const that = this;
            this._kernelSourceActionProviders.set(handle, provider);
            this._logService.trace(`NotebookKernelSourceActionProvider[${handle}], CREATED by ${extension.identifier.value}`);
            this._proxy.$addKernelSourceActionProvider(handle, handle, viewType);
            let subscription;
            if (eventHandle !== undefined) {
                subscription = provider.onDidChangeNotebookKernelSourceActions(_ => this._proxy.$emitNotebookKernelSourceActionsChangeEvent(eventHandle));
            }
            return {
                dispose: () => {
                    this._kernelSourceActionProviders.delete(handle);
                    that._proxy.$removeKernelSourceActionProvider(handle, handle);
                    subscription?.dispose();
                }
            };
        }
        async $provideKernelSourceActions(handle, token) {
            const provider = this._kernelSourceActionProviders.get(handle);
            if (provider) {
                const disposables = new lifecycle_1.DisposableStore();
                const ret = await provider.provideNotebookKernelSourceActions(token);
                return (ret ?? []).map(item => extHostTypeConverters.NotebookKernelSourceAction.from(item, this._commands.converter, disposables));
            }
            return [];
        }
        $acceptNotebookAssociation(handle, uri, value) {
            const obj = this._kernelData.get(handle);
            if (obj) {
                // update data structure
                const notebook = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(uri));
                if (value) {
                    obj.associatedNotebooks.set(notebook.uri, true);
                }
                else {
                    obj.associatedNotebooks.delete(notebook.uri);
                }
                this._logService.trace(`NotebookController[${handle}] ASSOCIATE notebook`, notebook.uri.toString(), value);
                // send event
                obj.onDidChangeSelection.fire({
                    selected: value,
                    notebook: notebook.apiNotebook
                });
            }
        }
        async $executeCells(handle, uri, handles) {
            const obj = this._kernelData.get(handle);
            if (!obj) {
                // extension can dispose kernels in the meantime
                return;
            }
            const document = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(uri));
            const cells = [];
            for (const cellHandle of handles) {
                const cell = document.getCell(cellHandle);
                if (cell) {
                    cells.push(cell.apiCell);
                }
            }
            try {
                this._logService.trace(`NotebookController[${handle}] EXECUTE cells`, document.uri.toString(), cells.length);
                await obj.controller.executeHandler.call(obj.controller, cells, document.apiNotebook, obj.controller);
            }
            catch (err) {
                //
                this._logService.error(`NotebookController[${handle}] execute cells FAILED`, err);
                console.error(err);
            }
        }
        async $cancelCells(handle, uri, handles) {
            const obj = this._kernelData.get(handle);
            if (!obj) {
                // extension can dispose kernels in the meantime
                return;
            }
            // cancel or interrupt depends on the controller. When an interrupt handler is used we
            // don't trigger the cancelation token of executions.
            const document = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(uri));
            if (obj.controller.interruptHandler) {
                await obj.controller.interruptHandler.call(obj.controller, document.apiNotebook);
            }
            else {
                for (const cellHandle of handles) {
                    const cell = document.getCell(cellHandle);
                    if (cell) {
                        this._activeExecutions.get(cell.uri)?.cancel();
                    }
                }
            }
            if (obj.controller.interruptHandler) {
                // If we're interrupting all cells, we also need to cancel the notebook level execution.
                const items = this._activeNotebookExecutions.get(document.uri);
                if (handles.length && Array.isArray(items) && items.length) {
                    items.forEach(d => d.dispose());
                }
            }
        }
        async $provideVariables(handle, requestId, notebookUri, parentId, kind, start, token) {
            const obj = this._kernelData.get(handle);
            if (!obj) {
                return;
            }
            const document = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(notebookUri));
            const variableProvider = obj.controller.variableProvider;
            if (!variableProvider) {
                return;
            }
            let parent = undefined;
            if (parentId !== undefined) {
                parent = this.variableStore[parentId];
                if (!parent) {
                    // request for unknown parent
                    return;
                }
            }
            else {
                // root request, clear store
                this.variableStore = {};
            }
            const requestKind = kind === 'named' ? extHostTypes_1.NotebookVariablesRequestKind.Named : extHostTypes_1.NotebookVariablesRequestKind.Indexed;
            const variableResults = variableProvider.provideVariables(document.apiNotebook, parent, requestKind, start, token);
            let resultCount = 0;
            for await (const result of variableResults) {
                if (token.isCancellationRequested) {
                    return;
                }
                const variable = {
                    id: this.id++,
                    name: result.variable.name,
                    value: result.variable.value,
                    type: result.variable.type,
                    interfaces: result.variable.interfaces,
                    language: result.variable.language,
                    expression: result.variable.expression,
                    hasNamedChildren: result.hasNamedChildren,
                    indexedChildrenCount: result.indexedChildrenCount,
                    extensionId: obj.extensionId.value,
                };
                this.variableStore[variable.id] = result.variable;
                this._proxy.$receiveVariable(requestId, variable);
                if (resultCount++ >= notebookKernelService_1.variablePageSize) {
                    return;
                }
            }
        }
        $acceptKernelMessageFromRenderer(handle, editorId, message) {
            const obj = this._kernelData.get(handle);
            if (!obj) {
                // extension can dispose kernels in the meantime
                return;
            }
            const editor = this._extHostNotebook.getEditorById(editorId);
            obj.onDidReceiveMessage.fire(Object.freeze({ editor: editor.apiEditor, message }));
        }
        $cellExecutionChanged(uri, cellHandle, state) {
            const document = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(uri));
            const cell = document.getCell(cellHandle);
            if (cell) {
                const newState = state ? extHostTypeConverters.NotebookCellExecutionState.to(state) : extHostTypes_1.NotebookCellExecutionState.Idle;
                if (newState !== undefined) {
                    this._onDidChangeCellExecutionState.fire({
                        cell: cell.apiCell,
                        state: newState
                    });
                }
            }
        }
        // ---
        _createNotebookCellExecution(cell, controllerId) {
            if (cell.index < 0) {
                throw new Error('CANNOT execute cell that has been REMOVED from notebook');
            }
            const notebook = this._extHostNotebook.getNotebookDocument(cell.notebook.uri);
            const cellObj = notebook.getCellFromApiCell(cell);
            if (!cellObj) {
                throw new Error('invalid cell');
            }
            if (this._activeExecutions.has(cellObj.uri)) {
                throw new Error(`duplicate execution for ${cellObj.uri}`);
            }
            const execution = new NotebookCellExecutionTask(controllerId, cellObj, this._proxy);
            this._activeExecutions.set(cellObj.uri, execution);
            const listener = execution.onDidChangeState(() => {
                if (execution.state === NotebookCellExecutionTaskState.Resolved) {
                    execution.dispose();
                    listener.dispose();
                    this._activeExecutions.delete(cellObj.uri);
                }
            });
            return execution.asApiObject();
        }
        // ---
        _createNotebookExecution(nb, controllerId) {
            const notebook = this._extHostNotebook.getNotebookDocument(nb.uri);
            const runningCell = nb.getCells().find(cell => {
                const apiCell = notebook.getCellFromApiCell(cell);
                return apiCell && this._activeExecutions.has(apiCell.uri);
            });
            if (runningCell) {
                throw new Error(`duplicate cell execution for ${runningCell.document.uri}`);
            }
            if (this._activeNotebookExecutions.has(notebook.uri)) {
                throw new Error(`duplicate notebook execution for ${notebook.uri}`);
            }
            const execution = new NotebookExecutionTask(controllerId, notebook, this._proxy);
            const listener = execution.onDidChangeState(() => {
                if (execution.state === NotebookExecutionTaskState.Resolved) {
                    execution.dispose();
                    listener.dispose();
                    this._activeNotebookExecutions.delete(notebook.uri);
                }
            });
            this._activeNotebookExecutions.set(notebook.uri, [execution, listener]);
            return execution.asApiObject();
        }
    };
    exports.ExtHostNotebookKernels = ExtHostNotebookKernels;
    exports.ExtHostNotebookKernels = ExtHostNotebookKernels = __decorate([
        __param(4, log_1.ILogService)
    ], ExtHostNotebookKernels);
    var NotebookCellExecutionTaskState;
    (function (NotebookCellExecutionTaskState) {
        NotebookCellExecutionTaskState[NotebookCellExecutionTaskState["Init"] = 0] = "Init";
        NotebookCellExecutionTaskState[NotebookCellExecutionTaskState["Started"] = 1] = "Started";
        NotebookCellExecutionTaskState[NotebookCellExecutionTaskState["Resolved"] = 2] = "Resolved";
    })(NotebookCellExecutionTaskState || (NotebookCellExecutionTaskState = {}));
    class NotebookCellExecutionTask extends lifecycle_1.Disposable {
        static { this.HANDLE = 0; }
        get state() { return this._state; }
        constructor(controllerId, _cell, _proxy) {
            super();
            this._cell = _cell;
            this._proxy = _proxy;
            this._handle = NotebookCellExecutionTask.HANDLE++;
            this._onDidChangeState = new event_1.Emitter();
            this.onDidChangeState = this._onDidChangeState.event;
            this._state = NotebookCellExecutionTaskState.Init;
            this._tokenSource = this._register(new cancellation_1.CancellationTokenSource());
            this._collector = new TimeoutBasedCollector(10, updates => this.update(updates));
            this._executionOrder = _cell.internalMetadata.executionOrder;
            this._proxy.$createExecution(this._handle, controllerId, this._cell.notebook.uri, this._cell.handle);
        }
        cancel() {
            this._tokenSource.cancel();
        }
        async updateSoon(update) {
            await this._collector.addItem(update);
        }
        async update(update) {
            const updates = Array.isArray(update) ? update : [update];
            return this._proxy.$updateExecution(this._handle, new proxyIdentifier_1.SerializableObjectWithBuffers(updates));
        }
        verifyStateForOutput() {
            if (this._state === NotebookCellExecutionTaskState.Init) {
                throw new Error('Must call start before modifying cell output');
            }
            if (this._state === NotebookCellExecutionTaskState.Resolved) {
                throw new Error('Cannot modify cell output after calling resolve');
            }
        }
        cellIndexToHandle(cellOrCellIndex) {
            let cell = this._cell;
            if (cellOrCellIndex) {
                cell = this._cell.notebook.getCellFromApiCell(cellOrCellIndex);
            }
            if (!cell) {
                throw new Error('INVALID cell');
            }
            return cell.handle;
        }
        validateAndConvertOutputs(items) {
            return items.map(output => {
                const newOutput = extHostTypes_1.NotebookCellOutput.ensureUniqueMimeTypes(output.items, true);
                if (newOutput === output.items) {
                    return extHostTypeConverters.NotebookCellOutput.from(output);
                }
                return extHostTypeConverters.NotebookCellOutput.from({
                    items: newOutput,
                    id: output.id,
                    metadata: output.metadata
                });
            });
        }
        async updateOutputs(outputs, cell, append) {
            const handle = this.cellIndexToHandle(cell);
            const outputDtos = this.validateAndConvertOutputs((0, arrays_1.asArray)(outputs));
            return this.updateSoon({
                editType: notebookExecutionService_1.CellExecutionUpdateType.Output,
                cellHandle: handle,
                append,
                outputs: outputDtos
            });
        }
        async updateOutputItems(items, output, append) {
            items = extHostTypes_1.NotebookCellOutput.ensureUniqueMimeTypes((0, arrays_1.asArray)(items), true);
            return this.updateSoon({
                editType: notebookExecutionService_1.CellExecutionUpdateType.OutputItems,
                items: items.map(extHostTypeConverters.NotebookCellOutputItem.from),
                outputId: output.id,
                append
            });
        }
        asApiObject() {
            const that = this;
            const result = {
                get token() { return that._tokenSource.token; },
                get cell() { return that._cell.apiCell; },
                get executionOrder() { return that._executionOrder; },
                set executionOrder(v) {
                    that._executionOrder = v;
                    that.update([{
                            editType: notebookExecutionService_1.CellExecutionUpdateType.ExecutionState,
                            executionOrder: that._executionOrder
                        }]);
                },
                start(startTime) {
                    if (that._state === NotebookCellExecutionTaskState.Resolved || that._state === NotebookCellExecutionTaskState.Started) {
                        throw new Error('Cannot call start again');
                    }
                    that._state = NotebookCellExecutionTaskState.Started;
                    that._onDidChangeState.fire();
                    that.update({
                        editType: notebookExecutionService_1.CellExecutionUpdateType.ExecutionState,
                        runStartTime: startTime
                    });
                },
                end(success, endTime, executionError) {
                    if (that._state === NotebookCellExecutionTaskState.Resolved) {
                        throw new Error('Cannot call resolve twice');
                    }
                    that._state = NotebookCellExecutionTaskState.Resolved;
                    that._onDidChangeState.fire();
                    // The last update needs to be ordered correctly and applied immediately,
                    // so we use updateSoon and immediately flush.
                    that._collector.flush();
                    const error = executionError ? {
                        message: executionError.message,
                        stack: executionError.stack,
                        location: executionError?.location ? {
                            startLineNumber: executionError.location.start.line,
                            startColumn: executionError.location.start.character,
                            endLineNumber: executionError.location.end.line,
                            endColumn: executionError.location.end.character
                        } : undefined,
                        uri: executionError.uri
                    } : undefined;
                    that._proxy.$completeExecution(that._handle, new proxyIdentifier_1.SerializableObjectWithBuffers({
                        runEndTime: endTime,
                        lastRunSuccess: success,
                        error
                    }));
                },
                clearOutput(cell) {
                    that.verifyStateForOutput();
                    return that.updateOutputs([], cell, false);
                },
                appendOutput(outputs, cell) {
                    that.verifyStateForOutput();
                    return that.updateOutputs(outputs, cell, true);
                },
                replaceOutput(outputs, cell) {
                    that.verifyStateForOutput();
                    return that.updateOutputs(outputs, cell, false);
                },
                appendOutputItems(items, output) {
                    that.verifyStateForOutput();
                    return that.updateOutputItems(items, output, true);
                },
                replaceOutputItems(items, output) {
                    that.verifyStateForOutput();
                    return that.updateOutputItems(items, output, false);
                }
            };
            return Object.freeze(result);
        }
    }
    var NotebookExecutionTaskState;
    (function (NotebookExecutionTaskState) {
        NotebookExecutionTaskState[NotebookExecutionTaskState["Init"] = 0] = "Init";
        NotebookExecutionTaskState[NotebookExecutionTaskState["Started"] = 1] = "Started";
        NotebookExecutionTaskState[NotebookExecutionTaskState["Resolved"] = 2] = "Resolved";
    })(NotebookExecutionTaskState || (NotebookExecutionTaskState = {}));
    class NotebookExecutionTask extends lifecycle_1.Disposable {
        static { this.HANDLE = 0; }
        get state() { return this._state; }
        constructor(controllerId, _notebook, _proxy) {
            super();
            this._notebook = _notebook;
            this._proxy = _proxy;
            this._handle = NotebookExecutionTask.HANDLE++;
            this._onDidChangeState = new event_1.Emitter();
            this.onDidChangeState = this._onDidChangeState.event;
            this._state = NotebookExecutionTaskState.Init;
            this._tokenSource = this._register(new cancellation_1.CancellationTokenSource());
            this._proxy.$createNotebookExecution(this._handle, controllerId, this._notebook.uri);
        }
        cancel() {
            this._tokenSource.cancel();
        }
        asApiObject() {
            const result = {
                start: () => {
                    if (this._state === NotebookExecutionTaskState.Resolved || this._state === NotebookExecutionTaskState.Started) {
                        throw new Error('Cannot call start again');
                    }
                    this._state = NotebookExecutionTaskState.Started;
                    this._onDidChangeState.fire();
                    this._proxy.$beginNotebookExecution(this._handle);
                },
                end: () => {
                    if (this._state === NotebookExecutionTaskState.Resolved) {
                        throw new Error('Cannot call resolve twice');
                    }
                    this._state = NotebookExecutionTaskState.Resolved;
                    this._onDidChangeState.fire();
                    this._proxy.$completeNotebookExecution(this._handle);
                },
            };
            return Object.freeze(result);
        }
    }
    class TimeoutBasedCollector {
        constructor(delay, callback) {
            this.delay = delay;
            this.callback = callback;
            this.batch = [];
            this.startedTimer = Date.now();
        }
        addItem(item) {
            this.batch.push(item);
            if (!this.currentDeferred) {
                this.currentDeferred = new async_1.DeferredPromise();
                this.startedTimer = Date.now();
                (0, async_1.timeout)(this.delay).then(() => {
                    return this.flush();
                });
            }
            // This can be called by the extension repeatedly for a long time before the timeout is able to run.
            // Force a flush after the delay.
            if (Date.now() - this.startedTimer > this.delay) {
                return this.flush();
            }
            return this.currentDeferred.p;
        }
        flush() {
            if (this.batch.length === 0 || !this.currentDeferred) {
                return Promise.resolve();
            }
            const deferred = this.currentDeferred;
            this.currentDeferred = undefined;
            const batch = this.batch;
            this.batch = [];
            return this.callback(batch)
                .finally(() => deferred.complete());
        }
    }
    function createKernelId(extensionIdentifier, id) {
        return `${extensionIdentifier.value}/${id}`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rS2VybmVscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdE5vdGVib29rS2VybmVscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF1MkJoRyx3Q0FFQztJQWwwQk0sSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBc0I7UUFrQmxDLFlBQ0MsV0FBeUIsRUFDUixTQUFrQyxFQUNsQyxnQkFBMkMsRUFDcEQsU0FBMEIsRUFDckIsV0FBeUM7WUFIckMsY0FBUyxHQUFULFNBQVMsQ0FBeUI7WUFDbEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUEyQjtZQUNwRCxjQUFTLEdBQVQsU0FBUyxDQUFpQjtZQUNKLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBcEJ0QyxzQkFBaUIsR0FBRyxJQUFJLGlCQUFXLEVBQTZCLENBQUM7WUFDakUsOEJBQXlCLEdBQUcsSUFBSSxpQkFBVyxFQUF3QyxDQUFDO1lBRTdGLHlCQUFvQixHQUFHLElBQUksR0FBRyxFQUFrRCxDQUFDO1lBQ2pGLG1DQUE4QixHQUFXLENBQUMsQ0FBQztZQUUzQyxpQ0FBNEIsR0FBRyxJQUFJLEdBQUcsRUFBcUQsQ0FBQztZQUM1RiwwQ0FBcUMsR0FBVyxDQUFDLENBQUM7WUFFekMsZ0JBQVcsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztZQUN0RCxnQkFBVyxHQUFXLENBQUMsQ0FBQztZQUVmLG1DQUE4QixHQUFHLElBQUksZUFBTyxFQUFnRCxDQUFDO1lBQ3JHLDBDQUFxQyxHQUFHLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxLQUFLLENBQUM7WUErWG5GLE9BQUUsR0FBRyxDQUFDLENBQUM7WUFDUCxrQkFBYSxHQUFvQyxFQUFFLENBQUM7WUF2WDNELElBQUksQ0FB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