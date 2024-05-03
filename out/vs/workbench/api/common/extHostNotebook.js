/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/api/common/cache", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/services/extensions/common/proxyIdentifier", "./extHostNotebookDocument", "./extHostNotebookEditor", "vs/base/common/objects", "vs/base/common/network", "vs/workbench/contrib/search/common/cellSearchModel", "vs/workbench/contrib/search/common/searchNotebookHelpers", "vs/workbench/services/editor/common/editorResolverService"], function (require, exports, nls_1, buffer_1, event_1, lifecycle_1, map_1, strings_1, types_1, uri_1, files, cache_1, extHost_protocol_1, extHostCommands_1, typeConverters, extHostTypes, proxyIdentifier_1, extHostNotebookDocument_1, extHostNotebookEditor_1, objects_1, network_1, cellSearchModel_1, searchNotebookHelpers_1, editorResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookController = void 0;
    class ExtHostNotebookController {
        static { this._notebookStatusBarItemProviderHandlePool = 0; }
        get activeNotebookEditor() {
            return this._activeNotebookEditor?.apiEditor;
        }
        get visibleNotebookEditors() {
            return this._visibleNotebookEditors.map(editor => editor.apiEditor);
        }
        constructor(mainContext, commands, _textDocumentsAndEditors, _textDocuments, _extHostFileSystem, _extHostSearch) {
            this._textDocumentsAndEditors = _textDocumentsAndEditors;
            this._textDocuments = _textDocuments;
            this._extHostFileSystem = _extHostFileSystem;
            this._extHostSearch = _extHostSearch;
            this._notebookStatusBarItemProviders = new Map();
            this._documents = new map_1.ResourceMap();
            this._editors = new Map();
            this._onDidChangeActiveNotebookEditor = new event_1.Emitter();
            this.onDidChangeActiveNotebookEditor = this._onDidChangeActiveNotebookEditor.event;
            this._visibleNotebookEditors = [];
            this._onDidOpenNotebookDocument = new event_1.Emitter();
            this.onDidOpenNotebookDocument = this._onDidOpenNotebookDocument.event;
            this._onDidCloseNotebookDocument = new event_1.Emitter();
            this.onDidCloseNotebookDocument = this._onDidCloseNotebookDocument.event;
            this._onDidChangeVisibleNotebookEditors = new event_1.Emitter();
            this.onDidChangeVisibleNotebookEditors = this._onDidChangeVisibleNotebookEditors.event;
            this._statusBarCache = new cache_1.Cache('NotebookCellStatusBarCache');
            // --- serialize/deserialize
            this._handlePool = 0;
            this._notebookSerializer = new Map();
            this._notebookProxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebook);
            this._notebookDocumentsProxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookDocuments);
            this._notebookEditorsProxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookEditors);
            this._commandsConverter = commands.converter;
            commands.registerArgumentProcessor({
                // Serialized INotebookCellActionContext
                processArgument: (arg) => {
                    if (arg && arg.$mid === 13 /* MarshalledId.NotebookCellActionContext */) {
                        const notebookUri = arg.notebookEditor?.notebookUri;
                        const cellHandle = arg.cell.handle;
                        const data = this._documents.get(notebookUri);
                        const cell = data?.getCell(cellHandle);
                        if (cell) {
                            return cell.apiCell;
                        }
                    }
                    if (arg && arg.$mid === 14 /* MarshalledId.NotebookActionContext */) {
                        const notebookUri = arg.uri;
                        const data = this._documents.get(notebookUri);
                        if (data) {
                            return data.apiNotebook;
                        }
                    }
                    return arg;
                }
            });
            ExtHostNotebookController._registerApiCommands(commands);
        }
        getEditorById(editorId) {
            const editor = this._editors.get(editorId);
            if (!editor) {
                throw new Error(`unknown text editor: ${editorId}. known editors: ${[...this._editors.keys()]} `);
            }
            return editor;
        }
        getIdByEditor(editor) {
            for (const [id, candidate] of this._editors) {
                if (candidate.apiEditor === editor) {
                    return id;
                }
            }
            return undefined;
        }
        get notebookDocuments() {
            return [...this._documents.values()];
        }
        getNotebookDocument(uri, relaxed) {
            const result = this._documents.get(uri);
            if (!result && !relaxed) {
                throw new Error(`NO notebook document for '${uri}'`);
            }
            return result;
        }
        static _convertNotebookRegistrationData(extension, registration) {
            if (!registration) {
                return;
            }
            const viewOptionsFilenamePattern = registration.filenamePattern
                .map(pattern => typeConverters.NotebookExclusiveDocumentPattern.from(pattern))
                .filter(pattern => pattern !== undefined);
            if (registration.filenamePattern && !viewOptionsFilenamePattern) {
                console.warn(`Notebook content provider view options file name pattern is invalid ${registration.filenamePattern}`);
                return undefined;
            }
            return {
                extension: extension.identifier,
                providerDisplayName: extension.displayName || extension.name,
                displayName: registration.displayName,
                filenamePattern: viewOptionsFilenamePattern,
                exclusive: registration.exclusive || false
            };
        }
        registerNotebookCellStatusBarItemProvider(extension, notebookType, provider) {
            const handle = ExtHostNotebookController._notebookStatusBarItemProviderHandlePool++;
            const eventHandle = typeof provider.onDidChangeCellStatusBarItems === 'function' ? ExtHostNotebookController._notebookStatusBarItemProviderHandlePool++ : undefined;
            this._notebookStatusBarItemProviders.set(handle, provider);
            this._notebookProxy.$registerNotebookCellStatusBarItemProvider(handle, eventHandle, notebookType);
            let subscription;
            if (eventHandle !== undefined) {
                subscription = provider.onDidChangeCellStatusBarItems(_ => this._notebookProxy.$emitCellStatusBarEvent(eventHandle));
            }
            return new extHostTypes.Disposable(() => {
                this._notebookStatusBarItemProviders.delete(handle);
                this._notebookProxy.$unregisterNotebookCellStatusBarItemProvider(handle, eventHandle);
                subscription?.dispose();
            });
        }
        async createNotebookDocument(options) {
            const canonicalUri = await this._notebookDocumentsProxy.$tryCreateNotebook({
                viewType: options.viewType,
                content: options.content && typeConverters.NotebookData.from(options.content)
            });
            return uri_1.URI.revive(canonicalUri);
        }
        async openNotebookDocument(uri) {
            const cached = this._documents.get(uri);
            if (cached) {
                return cached.apiNotebook;
            }
            const canonicalUri = await this._notebookDocumentsProxy.$tryOpenNotebook(uri);
            const document = this._documents.get(uri_1.URI.revive(canonicalUri));
            return (0, types_1.assertIsDefined)(document?.apiNotebook);
        }
        async showNotebookDocument(notebookOrUri, options) {
            if (uri_1.URI.isUri(notebookOrUri)) {
                notebookOrUri = await this.openNotebookDocument(notebookOrUri);
            }
            let resolvedOptions;
            if (typeof options === 'object') {
                resolvedOptions = {
                    position: typeConverters.ViewColumn.from(options.viewColumn),
                    preserveFocus: options.preserveFocus,
                    selections: options.selections && options.selections.map(typeConverters.NotebookRange.from),
                    pinned: typeof options.preview === 'boolean' ? !options.preview : undefined
                };
            }
            else {
                resolvedOptions = {
                    preserveFocus: false
                };
            }
            const editorId = await this._notebookEditorsProxy.$tryShowNotebookDocument(notebookOrUri.uri, notebookOrUri.notebookType, resolvedOptions);
            const editor = editorId && this._editors.get(editorId)?.apiEditor;
            if (editor) {
                return editor;
            }
            if (editorId) {
                throw new Error(`Could NOT open editor for "${notebookOrUri.uri.toString()}" because another editor opened in the meantime.`);
            }
            else {
                throw new Error(`Could NOT open editor for "${notebookOrUri.uri.toString()}".`);
            }
        }
        async $provideNotebookCellStatusBarItems(handle, uri, index, token) {
            const provider = this._notebookStatusBarItemProviders.get(handle);
            const revivedUri = uri_1.URI.revive(uri);
            const document = this._documents.get(revivedUri);
            if (!document || !provider) {
                return;
            }
            const cell = document.getCellFromIndex(index);
            if (!cell) {
                return;
            }
            const result = await provider.provideCellStatusBarItems(cell.apiCell, token);
            if (!result) {
                return undefined;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const cacheId = this._statusBarCache.add([disposables]);
            const resultArr = Array.isArray(result) ? result : [result];
            const items = resultArr.map(item => typeConverters.NotebookStatusBarItem.from(item, this._commandsConverter, disposables));
            return {
                cacheId,
                items
            };
        }
        $releaseNotebookCellStatusBarItems(cacheId) {
            this._statusBarCache.delete(cacheId);
        }
        registerNotebookSerializer(extension, viewType, serializer, options, registration) {
            if ((0, strings_1.isFalsyOrWhitespace)(viewType)) {
                throw new Error(`viewType cannot be empty or just whitespace`);
            }
            const handle = this._handlePool++;
            this._notebookSerializer.set(handle, { viewType, serializer, options });
            this._notebookProxy.$registerNotebookSerializer(handle, { id: extension.identifier, location: extension.extensionLocation }, viewType, typeConverters.NotebookDocumentContentOptions.from(options), ExtHostNotebookController._convertNotebookRegistrationData(extension, registration));
            return (0, lifecycle_1.toDisposable)(() => {
                this._notebookProxy.$unregisterNotebookSerializer(handle);
            });
        }
        async $dataToNotebook(handle, bytes, token) {
            const serializer = this._notebookSerializer.get(handle);
            if (!serializer) {
                throw new Error('NO serializer found');
            }
            const data = await serializer.serializer.deserializeNotebook(bytes.buffer, token);
            return new proxyIdentifier_1.SerializableObjectWithBuffers(typeConverters.NotebookData.from(data));
        }
        async $notebookToData(handle, data, token) {
            const serializer = this._notebookSerializer.get(handle);
            if (!serializer) {
                throw new Error('NO serializer found');
            }
            const bytes = await serializer.serializer.serializeNotebook(typeConverters.NotebookData.to(data.value), token);
            return buffer_1.VSBuffer.wrap(bytes);
        }
        async $saveNotebook(handle, uriComponents, versionId, options, token) {
            const uri = uri_1.URI.revive(uriComponents);
            const serializer = this._notebookSerializer.get(handle);
            if (!serializer) {
                throw new Error('NO serializer found');
            }
            const document = this._documents.get(uri);
            if (!document) {
                throw new Error('Document NOT found');
            }
            if (document.versionId !== versionId) {
                throw new Error('Document version mismatch');
            }
            if (!this._extHostFileSystem.value.isWritableFileSystem(uri.scheme)) {
                throw new files.FileOperationError((0, nls_1.localize)('err.readonly', "Unable to modify read-only file '{0}'", this._resourceForError(uri)), 6 /* files.FileOperationResult.FILE_PERMISSION_DENIED */);
            }
            // validate write
            await this._validateWriteFile(uri, options);
            const data = {
                metadata: (0, objects_1.filter)(document.apiNotebook.metadata, key => !(serializer.options?.transientDocumentMetadata ?? {})[key]),
                cells: [],
            };
            for (const cell of document.apiNotebook.getCells()) {
                const cellData = new extHostTypes.NotebookCellData(cell.kind, cell.document.getText(), cell.document.languageId, cell.mime, !(serializer.options?.transientOutputs) ? [...cell.outputs] : [], cell.metadata, cell.executionSummary);
                cellData.metadata = (0, objects_1.filter)(cell.metadata, key => !(serializer.options?.transientCellMetadata ?? {})[key]);
                data.cells.push(cellData);
            }
            const bytes = await serializer.serializer.serializeNotebook(data, token);
            await this._extHostFileSystem.value.writeFile(uri, bytes);
            const providerExtUri = this._extHostFileSystem.getFileSystemProviderExtUri(uri.scheme);
            const stat = await this._extHostFileSystem.value.stat(uri);
            const fileStats = {
                name: providerExtUri.basename(uri),
                isFile: (stat.type & files.FileType.File) !== 0,
                isDirectory: (stat.type & files.FileType.Directory) !== 0,
                isSymbolicLink: (stat.type & files.FileType.SymbolicLink) !== 0,
                mtime: stat.mtime,
                ctime: stat.ctime,
                size: stat.size,
                readonly: Boolean((stat.permissions ?? 0) & files.FilePermission.Readonly) || !this._extHostFileSystem.value.isWritableFileSystem(uri.scheme),
                locked: Boolean((stat.permissions ?? 0) & files.FilePermission.Locked),
                etag: files.etag({ mtime: stat.mtime, size: stat.size }),
                children: undefined
            };
            return fileStats;
        }
        /**
         * Search for query in all notebooks that can be deserialized by the serializer fetched by `handle`.
         *
         * @param handle used to get notebook serializer
         * @param textQuery the text query to search using
         * @param viewTypeFileTargets the globs (and associated ranks) that are targetting for opening this type of notebook
         * @param otherViewTypeFileTargets ranked globs for other editors that we should consider when deciding whether it will open as this notebook
         * @param token cancellation token
         * @returns `IRawClosedNotebookFileMatch` for every file. Files without matches will just have a `IRawClosedNotebookFileMatch`
         * 	with no `cellResults`. This allows the caller to know what was searched in already, even if it did not yield results.
         */
        async $searchInNotebooks(handle, textQuery, viewTypeFileTargets, otherViewTypeFileTargets, token) {
            const serializer = this._notebookSerializer.get(handle)?.serializer;
            if (!serializer) {
                return {
                    limitHit: false,
                    results: []
                };
            }
            const finalMatchedTargets = new map_1.ResourceSet();
            const runFileQueries = async (includes, token, textQuery) => {
                await Promise.all(includes.map(async (include) => await Promise.all(include.filenamePatterns.map(filePattern => {
                    const query = {
                        _reason: textQuery._reason,
                        folderQueries: textQuery.folderQueries,
                        includePattern: textQuery.includePattern,
                        excludePattern: textQuery.excludePattern,
                        maxResults: textQuery.maxResults,
                        type: 1 /* QueryType.File */,
                        filePattern
                    };
                    // use priority info to exclude info from other globs
                    return this._extHostSearch.doInternalFileSearchWithCustomCallback(query, token, (data) => {
                        data.forEach(uri => {
                            if (finalMatchedTargets.has(uri)) {
                                return;
                            }
                            const hasOtherMatches = otherViewTypeFileTargets.some(target => {
                                // use the same strategy that the editor service uses to open editors
                                // https://github.com/microsoft/vscode/blob/ac1631528e67637da65ec994c6dc35d73f6e33cc/src/vs/workbench/services/editor/browser/editorResolverService.ts#L359-L366
                                if (include.isFromSettings && !target.isFromSettings) {
                                    // if the include is from the settings and target isn't, even if it matches, it's still overridden.
                                    return false;
                                }
                                else {
                                    // longer filePatterns are considered more specifc, so they always have precedence the shorter patterns
                                    return target.filenamePatterns.some(targetFilePattern => (0, editorResolverService_1.globMatchesResource)(targetFilePattern, uri));
                                }
                            });
                            if (hasOtherMatches) {
                                return;
                            }
                            finalMatchedTargets.add(uri);
                        });
                    }).catch(err => {
                        // temporary fix for https://github.com/microsoft/vscode/issues/205044: don't show notebook results for remotehub repos.
                        if (err.code === 'ENOENT') {
                            console.warn(`Could not find notebook search results, ignoring notebook results.`);
                            return {
                                limitHit: false,
                                messages: [],
                            };
                        }
                        else {
                            throw err;
                        }
                    });
                }))));
                return;
            };
            await runFileQueries(viewTypeFileTargets, token, textQuery);
            const results = new map_1.ResourceMap();
            let limitHit = false;
            const promises = Array.from(finalMatchedTargets).map(async (uri) => {
                const cellMatches = [];
                try {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    if (textQuery.maxResults && [...results.values()].reduce((acc, value) => acc + value.cellResults.length, 0) > textQuery.maxResults) {
                        limitHit = true;
                        return;
                    }
                    const simpleCells = [];
                    const notebook = this._documents.get(uri);
                    if (notebook) {
                        const cells = notebook.apiNotebook.getCells();
                        cells.forEach(e => simpleCells.push({
                            input: e.document.getText(),
                            outputs: e.outputs.flatMap(value => value.items.map(output => output.data.toString()))
                        }));
                    }
                    else {
                        const fileContent = await this._extHostFileSystem.value.readFile(uri);
                        const bytes = buffer_1.VSBuffer.fromString(fileContent.toString());
                        const notebook = await serializer.deserializeNotebook(bytes.buffer, token);
                        if (token.isCancellationRequested) {
                            return;
                        }
                        const data = typeConverters.NotebookData.from(notebook);
                        data.cells.forEach(cell => simpleCells.push({
                            input: cell.source,
                            outputs: cell.outputs.flatMap(value => value.items.map(output => output.valueBytes.toString()))
                        }));
                    }
                    if (token.isCancellationRequested) {
                        return;
                    }
                    simpleCells.forEach((cell, index) => {
                        const target = textQuery.contentPattern.pattern;
                        const cellModel = new cellSearchModel_1.CellSearchModel(cell.input, undefined, cell.outputs);
                        const inputMatches = cellModel.findInInputs(target);
                        const outputMatches = cellModel.findInOutputs(target);
                        const webviewResults = outputMatches
                            .flatMap(outputMatch => (0, searchNotebookHelpers_1.genericCellMatchesToTextSearchMatches)(outputMatch.matches, outputMatch.textBuffer))
                            .map((textMatch, index) => {
                            textMatch.webviewIndex = index;
                            return textMatch;
                        });
                        if (inputMatches.length > 0 || outputMatches.length > 0) {
                            const cellMatch = {
                                index: index,
                                contentResults: (0, searchNotebookHelpers_1.genericCellMatchesToTextSearchMatches)(inputMatches, cellModel.inputTextBuffer),
                                webviewResults
                            };
                            cellMatches.push(cellMatch);
                        }
                    });
                    const fileMatch = {
                        resource: uri, cellResults: cellMatches
                    };
                    results.set(uri, fileMatch);
                    return;
                }
                catch (e) {
                    return;
                }
            });
            await Promise.all(promises);
            return {
                limitHit,
                results: [...results.values()]
            };
        }
        async _validateWriteFile(uri, options) {
            const stat = await this._extHostFileSystem.value.stat(uri);
            // Dirty write prevention
            if (typeof options?.mtime === 'number' && typeof options.etag === 'string' && options.etag !== files.ETAG_DISABLED &&
                typeof stat.mtime === 'number' && typeof stat.size === 'number' &&
                options.mtime < stat.mtime && options.etag !== files.etag({ mtime: options.mtime /* not using stat.mtime for a reason, see above */, size: stat.size })) {
                throw new files.FileOperationError((0, nls_1.localize)('fileModifiedError', "File Modified Since"), 3 /* files.FileOperationResult.FILE_MODIFIED_SINCE */, options);
            }
            return;
        }
        _resourceForError(uri) {
            return uri.scheme === network_1.Schemas.file ? uri.fsPath : uri.toString();
        }
        // --- open, save, saveAs, backup
        _createExtHostEditor(document, editorId, data) {
            if (this._editors.has(editorId)) {
                throw new Error(`editor with id ALREADY EXSIST: ${editorId}`);
            }
            const editor = new extHostNotebookEditor_1.ExtHostNotebookEditor(editorId, this._notebookEditorsProxy, document, data.visibleRanges.map(typeConverters.NotebookRange.to), data.selections.map(typeConverters.NotebookRange.to), typeof data.viewColumn === 'number' ? typeConverters.ViewColumn.to(data.viewColumn) : undefined);
            this._editors.set(editorId, editor);
        }
        $acceptDocumentAndEditorsDelta(delta) {
            if (delta.value.removedDocuments) {
                for (const uri of delta.value.removedDocuments) {
                    const revivedUri = uri_1.URI.revive(uri);
                    const document = this._documents.get(revivedUri);
                    if (document) {
                        document.dispose();
                        this._documents.delete(revivedUri);
                        this._textDocumentsAndEditors.$acceptDocumentsAndEditorsDelta({ removedDocuments: document.apiNotebook.getCells().map(cell => cell.document.uri) });
                        this._onDidCloseNotebookDocument.fire(document.apiNotebook);
                    }
                    for (const editor of this._editors.values()) {
                        if (editor.notebookData.uri.toString() === revivedUri.toString()) {
                            this._editors.delete(editor.id);
                        }
                    }
                }
            }
            if (delta.value.addedDocuments) {
                const addedCellDocuments = [];
                for (const modelData of delta.value.addedDocuments) {
                    const uri = uri_1.URI.revive(modelData.uri);
                    if (this._documents.has(uri)) {
                        throw new Error(`adding EXISTING notebook ${uri} `);
                    }
                    const document = new extHostNotebookDocument_1.ExtHostNotebookDocument(this._notebookDocumentsProxy, this._textDocumentsAndEditors, this._textDocuments, uri, modelData);
                    // add cell document as vscode.TextDocument
                    addedCellDocuments.push(...modelData.cells.map(cell => extHostNotebookDocument_1.ExtHostCell.asModelAddData(cell)));
                    this._documents.get(uri)?.dispose();
                    this._documents.set(uri, document);
                    this._textDocumentsAndEditors.$acceptDocumentsAndEditorsDelta({ addedDocuments: addedCellDocuments });
                    this._onDidOpenNotebookDocument.fire(document.apiNotebook);
                }
            }
            if (delta.value.addedEditors) {
                for (const editorModelData of delta.value.addedEditors) {
                    if (this._editors.has(editorModelData.id)) {
                        return;
                    }
                    const revivedUri = uri_1.URI.revive(editorModelData.documentUri);
                    const document = this._documents.get(revivedUri);
                    if (document) {
                        this._createExtHostEditor(document, editorModelData.id, editorModelData);
                    }
                }
            }
            const removedEditors = [];
            if (delta.value.removedEditors) {
                for (const editorid of delta.value.removedEditors) {
                    const editor = this._editors.get(editorid);
                    if (editor) {
                        this._editors.delete(editorid);
                        if (this._activeNotebookEditor?.id === editor.id) {
                            this._activeNotebookEditor = undefined;
                        }
                        removedEditors.push(editor);
                    }
                }
            }
            if (delta.value.visibleEditors) {
                this._visibleNotebookEditors = delta.value.visibleEditors.map(id => this._editors.get(id)).filter(editor => !!editor);
                const visibleEditorsSet = new Set();
                this._visibleNotebookEditors.forEach(editor => visibleEditorsSet.add(editor.id));
                for (const editor of this._editors.values()) {
                    const newValue = visibleEditorsSet.has(editor.id);
                    editor._acceptVisibility(newValue);
                }
                this._visibleNotebookEditors = [...this._editors.values()].map(e => e).filter(e => e.visible);
                this._onDidChangeVisibleNotebookEditors.fire(this.visibleNotebookEditors);
            }
            if (delta.value.newActiveEditor === null) {
                // clear active notebook as current active editor is non-notebook editor
                this._activeNotebookEditor = undefined;
            }
            else if (delta.value.newActiveEditor) {
                const activeEditor = this._editors.get(delta.value.newActiveEditor);
                if (!activeEditor) {
                    console.error(`FAILED to find active notebook editor ${delta.value.newActiveEditor}`);
                }
                this._activeNotebookEditor = this._editors.get(delta.value.newActiveEditor);
            }
            if (delta.value.newActiveEditor !== undefined) {
                this._onDidChangeActiveNotebookEditor.fire(this._activeNotebookEditor?.apiEditor);
            }
        }
        static _registerApiCommands(extHostCommands) {
            const notebookTypeArg = extHostCommands_1.ApiCommandArgument.String.with('notebookType', 'A notebook type');
            const commandDataToNotebook = new extHostCommands_1.ApiCommand('vscode.executeDataToNotebook', '_executeDataToNotebook', 'Invoke notebook serializer', [notebookTypeArg, new extHostCommands_1.ApiCommandArgument('data', 'Bytes to convert to data', v => v instanceof Uint8Array, v => buffer_1.VSBuffer.wrap(v))], new extHostCommands_1.ApiCommandResult('Notebook Data', data => typeConverters.NotebookData.to(data.value)));
            const commandNotebookToData = new extHostCommands_1.ApiCommand('vscode.executeNotebookToData', '_executeNotebookToData', 'Invoke notebook serializer', [notebookTypeArg, new extHostCommands_1.ApiCommandArgument('NotebookData', 'Notebook data to convert to bytes', v => true, v => new proxyIdentifier_1.SerializableObjectWithBuffers(typeConverters.NotebookData.from(v)))], new extHostCommands_1.ApiCommandResult('Bytes', dto => dto.buffer));
            extHostCommands.registerApiCommand(commandDataToNotebook);
            extHostCommands.registerApiCommand(commandNotebookToData);
        }
    }
    exports.ExtHostNotebookController = ExtHostNotebookController;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0Tm90ZWJvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUNoRyxNQUFhLHlCQUF5QjtpQkFDdEIsNkNBQXdDLEdBQVcsQ0FBQyxBQUFaLENBQWE7UUFlcEUsSUFBSSxvQkFBb0I7WUFDdkIsT0FBTyxJQUFJLENBQUMscUJBQXFCLEVBQUUsU0FBUyxDQUFDO1FBQzlDLENBQUM7UUFFRCxJQUFJLHNCQUFzQjtZQUN6QixPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDckUsQ0FBQztRQVlELFlBQ0MsV0FBeUIsRUFDekIsUUFBeUIsRUFDakIsd0JBQW9ELEVBQ3BELGNBQWdDLEVBQ2hDLGtCQUE4QyxFQUM5QyxjQUE4QjtZQUg5Qiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTRCO1lBQ3BELG1CQUFjLEdBQWQsY0FBYyxDQUFrQjtZQUNoQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQTRCO1lBQzlDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQWpDdEIsb0NBQStCLEdBQUcsSUFBSSxHQUFHLEVBQW9ELENBQUM7WUFDOUYsZUFBVSxHQUFHLElBQUksaUJBQVcsRUFBMkIsQ0FBQztZQUN4RCxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQWlDLENBQUM7WUFHcEQscUNBQWdDLEdBQUcsSUFBSSxlQUFPLEVBQXFDLENBQUM7WUFDNUYsb0NBQStCLEdBQUcsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLEtBQUssQ0FBQztZQU0vRSw0QkFBdUIsR0FBNEIsRUFBRSxDQUFDO1lBS3RELCtCQUEwQixHQUFH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