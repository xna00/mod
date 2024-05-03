/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostWebview", "./cache", "./extHost.protocol", "./extHostTypes"], function (require, exports, cancellation_1, hash_1, lifecycle_1, network_1, resources_1, uri_1, typeConverters, extHostWebview_1, cache_1, extHostProtocol, extHostTypes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostCustomEditors = void 0;
    class CustomDocumentStoreEntry {
        constructor(document, _storagePath) {
            this.document = document;
            this._storagePath = _storagePath;
            this._backupCounter = 1;
            this._edits = new cache_1.Cache('custom documents');
        }
        addEdit(item) {
            return this._edits.add([item]);
        }
        async undo(editId, isDirty) {
            await this.getEdit(editId).undo();
            if (!isDirty) {
                this.disposeBackup();
            }
        }
        async redo(editId, isDirty) {
            await this.getEdit(editId).redo();
            if (!isDirty) {
                this.disposeBackup();
            }
        }
        disposeEdits(editIds) {
            for (const id of editIds) {
                this._edits.delete(id);
            }
        }
        getNewBackupUri() {
            if (!this._storagePath) {
                throw new Error('Backup requires a valid storage path');
            }
            const fileName = hashPath(this.document.uri) + (this._backupCounter++);
            return (0, resources_1.joinPath)(this._storagePath, fileName);
        }
        updateBackup(backup) {
            this._backup?.delete();
            this._backup = backup;
        }
        disposeBackup() {
            this._backup?.delete();
            this._backup = undefined;
        }
        getEdit(editId) {
            const edit = this._edits.get(editId, 0);
            if (!edit) {
                throw new Error('No edit found');
            }
            return edit;
        }
    }
    class CustomDocumentStore {
        constructor() {
            this._documents = new Map();
        }
        get(viewType, resource) {
            return this._documents.get(this.key(viewType, resource));
        }
        add(viewType, document, storagePath) {
            const key = this.key(viewType, document.uri);
            if (this._documents.has(key)) {
                throw new Error(`Document already exists for viewType:${viewType} resource:${document.uri}`);
            }
            const entry = new CustomDocumentStoreEntry(document, storagePath);
            this._documents.set(key, entry);
            return entry;
        }
        delete(viewType, document) {
            const key = this.key(viewType, document.uri);
            this._documents.delete(key);
        }
        key(viewType, resource) {
            return `${viewType}@@@${resource}`;
        }
    }
    var CustomEditorType;
    (function (CustomEditorType) {
        CustomEditorType[CustomEditorType["Text"] = 0] = "Text";
        CustomEditorType[CustomEditorType["Custom"] = 1] = "Custom";
    })(CustomEditorType || (CustomEditorType = {}));
    class EditorProviderStore {
        constructor() {
            this._providers = new Map();
        }
        addTextProvider(viewType, extension, provider) {
            return this.add(0 /* CustomEditorType.Text */, viewType, extension, provider);
        }
        addCustomProvider(viewType, extension, provider) {
            return this.add(1 /* CustomEditorType.Custom */, viewType, extension, provider);
        }
        get(viewType) {
            return this._providers.get(viewType);
        }
        add(type, viewType, extension, provider) {
            if (this._providers.has(viewType)) {
                throw new Error(`Provider for viewType:${viewType} already registered`);
            }
            this._providers.set(viewType, { type, extension, provider });
            return new extHostTypes.Disposable(() => this._providers.delete(viewType));
        }
    }
    class ExtHostCustomEditors {
        constructor(mainContext, _extHostDocuments, _extensionStoragePaths, _extHostWebview, _extHostWebviewPanels) {
            this._extHostDocuments = _extHostDocuments;
            this._extensionStoragePaths = _extensionStoragePaths;
            this._extHostWebview = _extHostWebview;
            this._extHostWebviewPanels = _extHostWebviewPanels;
            this._editorProviders = new EditorProviderStore();
            this._documents = new CustomDocumentStore();
            this._proxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadCustomEditors);
        }
        registerCustomEditorProvider(extension, viewType, provider, options) {
            const disposables = new lifecycle_1.DisposableStore();
            if (isCustomTextEditorProvider(provider)) {
                disposables.add(this._editorProviders.addTextProvider(viewType, extension, provider));
                this._proxy.$registerTextEditorProvider((0, extHostWebview_1.toExtensionData)(extension), viewType, options.webviewOptions || {}, {
                    supportsMove: !!provider.moveCustomTextEditor,
                }, (0, extHostWebview_1.shouldSerializeBuffersForPostMessage)(extension));
            }
            else {
                disposables.add(this._editorProviders.addCustomProvider(viewType, extension, provider));
                if (isCustomEditorProviderWithEditingCapability(provider)) {
                    disposables.add(provider.onDidChangeCustomDocument(e => {
                        const entry = this.getCustomDocumentEntry(viewType, e.document.uri);
                        if (isEditEvent(e)) {
                            const editId = entry.addEdit(e);
                            this._proxy.$onDidEdit(e.document.uri, viewType, editId, e.label);
                        }
                        else {
                            this._proxy.$onContentChange(e.document.uri, viewType);
                        }
                    }));
                }
                this._proxy.$registerCustomEditorProvider((0, extHostWebview_1.toExtensionData)(extension), viewType, options.webviewOptions || {}, !!options.supportsMultipleEditorsPerDocument, (0, extHostWebview_1.shouldSerializeBuffersForPostMessage)(extension));
            }
            return extHostTypes.Disposable.from(disposables, new extHostTypes.Disposable(() => {
                this._proxy.$unregisterEditorProvider(viewType);
            }));
        }
        async $createCustomDocument(resource, viewType, backupId, untitledDocumentData, cancellation) {
            const entry = this._editorProviders.get(viewType);
            if (!entry) {
                throw new Error(`No provider found for '${viewType}'`);
            }
            if (entry.type !== 1 /* CustomEditorType.Custom */) {
                throw new Error(`Invalid provide type for '${viewType}'`);
            }
            const revivedResource = uri_1.URI.revive(resource);
            const document = await entry.provider.openCustomDocument(revivedResource, { backupId, untitledDocumentData: untitledDocumentData?.buffer }, cancellation);
            let storageRoot;
            if (isCustomEditorProviderWithEditingCapability(entry.provider) && this._extensionStoragePaths) {
                storageRoot = this._extensionStoragePaths.workspaceValue(entry.extension) ?? this._extensionStoragePaths.globalValue(entry.extension);
            }
            this._documents.add(viewType, document, storageRoot);
            return { editable: isCustomEditorProviderWithEditingCapability(entry.provider) };
        }
        async $disposeCustomDocument(resource, viewType) {
            const entry = this._editorProviders.get(viewType);
            if (!entry) {
                throw new Error(`No provider found for '${viewType}'`);
            }
            if (entry.type !== 1 /* CustomEditorType.Custom */) {
                throw new Error(`Invalid provider type for '${viewType}'`);
            }
            const revivedResource = uri_1.URI.revive(resource);
            const { document } = this.getCustomDocumentEntry(viewType, revivedResource);
            this._documents.delete(viewType, document);
            document.dispose();
        }
        async $resolveCustomEditor(resource, handle, viewType, initData, position, cancellation) {
            const entry = this._editorProviders.get(viewType);
            if (!entry) {
                throw new Error(`No provider found for '${viewType}'`);
            }
            const viewColumn = typeConverters.ViewColumn.to(position);
            const webview = this._extHostWebview.createNewWebview(handle, initData.contentOptions, entry.extension);
            const panel = this._extHostWebviewPanels.createNewWebviewPanel(handle, viewType, initData.title, viewColumn, initData.options, webview, initData.active);
            const revivedResource = uri_1.URI.revive(resource);
            switch (entry.type) {
                case 1 /* CustomEditorType.Custom */: {
                    const { document } = this.getCustomDocumentEntry(viewType, revivedResource);
                    return entry.provider.resolveCustomEditor(document, panel, cancellation);
                }
                case 0 /* CustomEditorType.Text */: {
                    const document = this._extHostDocuments.getDocument(revivedResource);
                    return entry.provider.resolveCustomTextEditor(document, panel, cancellation);
                }
                default: {
                    throw new Error('Unknown webview provider type');
                }
            }
        }
        $disposeEdits(resourceComponents, viewType, editIds) {
            const document = this.getCustomDocumentEntry(viewType, resourceComponents);
            document.disposeEdits(editIds);
        }
        async $onMoveCustomEditor(handle, newResourceComponents, viewType) {
            const entry = this._editorProviders.get(viewType);
            if (!entry) {
                throw new Error(`No provider found for '${viewType}'`);
            }
            if (!entry.provider.moveCustomTextEditor) {
                throw new Error(`Provider does not implement move '${viewType}'`);
            }
            const webview = this._extHostWebviewPanels.getWebviewPanel(handle);
            if (!webview) {
                throw new Error(`No webview found`);
            }
            const resource = uri_1.URI.revive(newResourceComponents);
            const document = this._extHostDocuments.getDocument(resource);
            await entry.provider.moveCustomTextEditor(document, webview, cancellation_1.CancellationToken.None);
        }
        async $undo(resourceComponents, viewType, editId, isDirty) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            return entry.undo(editId, isDirty);
        }
        async $redo(resourceComponents, viewType, editId, isDirty) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            return entry.redo(editId, isDirty);
        }
        async $revert(resourceComponents, viewType, cancellation) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            const provider = this.getCustomEditorProvider(viewType);
            await provider.revertCustomDocument(entry.document, cancellation);
            entry.disposeBackup();
        }
        async $onSave(resourceComponents, viewType, cancellation) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            const provider = this.getCustomEditorProvider(viewType);
            await provider.saveCustomDocument(entry.document, cancellation);
            entry.disposeBackup();
        }
        async $onSaveAs(resourceComponents, viewType, targetResource, cancellation) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            const provider = this.getCustomEditorProvider(viewType);
            return provider.saveCustomDocumentAs(entry.document, uri_1.URI.revive(targetResource), cancellation);
        }
        async $backup(resourceComponents, viewType, cancellation) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            const provider = this.getCustomEditorProvider(viewType);
            const backup = await provider.backupCustomDocument(entry.document, {
                destination: entry.getNewBackupUri(),
            }, cancellation);
            entry.updateBackup(backup);
            return backup.id;
        }
        getCustomDocumentEntry(viewType, resource) {
            const entry = this._documents.get(viewType, uri_1.URI.revive(resource));
            if (!entry) {
                throw new Error('No custom document found');
            }
            return entry;
        }
        getCustomEditorProvider(viewType) {
            const entry = this._editorProviders.get(viewType);
            const provider = entry?.provider;
            if (!provider || !isCustomEditorProviderWithEditingCapability(provider)) {
                throw new Error('Custom document is not editable');
            }
            return provider;
        }
    }
    exports.ExtHostCustomEditors = ExtHostCustomEditors;
    function isCustomEditorProviderWithEditingCapability(provider) {
        return !!provider.onDidChangeCustomDocument;
    }
    function isCustomTextEditorProvider(provider) {
        return typeof provider.resolveCustomTextEditor === 'function';
    }
    function isEditEvent(e) {
        return typeof e.undo === 'function'
            && typeof e.redo === 'function';
    }
    function hashPath(resource) {
        const str = resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.untitled ? resource.fsPath : resource.toString();
        return (0, hash_1.hash)(str) + '';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEN1c3RvbUVkaXRvcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RDdXN0b21FZGl0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXNCaEcsTUFBTSx3QkFBd0I7UUFJN0IsWUFDaUIsUUFBK0IsRUFDOUIsWUFBNkI7WUFEOUIsYUFBUSxHQUFSLFFBQVEsQ0FBdUI7WUFDOUIsaUJBQVksR0FBWixZQUFZLENBQWlCO1lBSnZDLG1CQUFjLEdBQUcsQ0FBQyxDQUFDO1lBT1YsV0FBTSxHQUFHLElBQUksYUFBSyxDQUFpQyxrQkFBa0IsQ0FBQyxDQUFDO1FBRnBGLENBQUM7UUFNTCxPQUFPLENBQUMsSUFBb0M7WUFDM0MsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBYyxFQUFFLE9BQWdCO1lBQzFDLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3RCLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFjLEVBQUUsT0FBZ0I7WUFDMUMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDdEIsQ0FBQztRQUNGLENBQUM7UUFFRCxZQUFZLENBQUMsT0FBaUI7WUFDN0IsS0FBSyxNQUFNLEVBQUUsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDeEIsQ0FBQztRQUNGLENBQUM7UUFFRCxlQUFlO1lBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFDRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZFLE9BQU8sSUFBQSxvQkFBUSxFQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELFlBQVksQ0FBQyxNQUFtQztZQUMvQyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxhQUFhO1lBQ1osSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQztRQUMxQixDQUFDO1FBRU8sT0FBTyxDQUFDLE1BQWM7WUFDN0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7S0FDRDtJQUVELE1BQU0sbUJBQW1CO1FBQXpCO1lBQ2tCLGVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBb0MsQ0FBQztRQXdCM0UsQ0FBQztRQXRCTyxHQUFHLENBQUMsUUFBZ0IsRUFBRSxRQUFvQjtZQUNoRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUFnQixFQUFFLFFBQStCLEVBQUUsV0FBNEI7WUFDekYsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsUUFBUSxhQUFhLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQzlGLENBQUM7WUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLHdCQUF3QixDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNsRSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEMsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU0sTUFBTSxDQUFDLFFBQWdCLEVBQUUsUUFBK0I7WUFDOUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFTyxHQUFHLENBQUMsUUFBZ0IsRUFBRSxRQUFvQjtZQUNqRCxPQUFPLEdBQUcsUUFBUSxNQUFNLFFBQVEsRUFBRSxDQUFDO1FBQ3BDLENBQUM7S0FDRDtJQUVELElBQVcsZ0JBR1Y7SUFIRCxXQUFXLGdCQUFnQjtRQUMxQix1REFBSSxDQUFBO1FBQ0osMkRBQU0sQ0FBQTtJQUNQLENBQUMsRUFIVSxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBRzFCO0lBWUQsTUFBTSxtQkFBbUI7UUFBekI7WUFDa0IsZUFBVSxHQUFHLElBQUksR0FBRyxFQUF5QixDQUFDO1FBcUJoRSxDQUFDO1FBbkJPLGVBQWUsQ0FBQyxRQUFnQixFQUFFLFNBQWdDLEVBQUUsUUFBeUM7WUFDbkgsT0FBTyxJQUFJLENBQUMsR0FBRyxnQ0FBd0IsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2RSxDQUFDO1FBRU0saUJBQWlCLENBQUMsUUFBZ0IsRUFBRSxTQUFnQyxFQUFFLFFBQTZDO1lBQ3pILE9BQU8sSUFBSSxDQUFDLEdBQUcsa0NBQTBCLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDekUsQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUFnQjtZQUMxQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFTyxHQUFHLENBQUMsSUFBc0IsRUFBRSxRQUFnQixFQUFFLFNBQWdDLEVBQUUsUUFBK0U7WUFDdEssSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixRQUFRLHFCQUFxQixDQUFDLENBQUM7WUFDekUsQ0FBQztZQUNELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFtQixDQUFDLENBQUM7WUFDOUUsT0FBTyxJQUFJLFlBQVksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUM1RSxDQUFDO0tBQ0Q7SUFFRCxNQUFhLG9CQUFvQjtRQVFoQyxZQUNDLFdBQXlDLEVBQ3hCLGlCQUFtQyxFQUNuQyxzQkFBMEQsRUFDMUQsZUFBZ0MsRUFDaEMscUJBQTJDO1lBSDNDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBa0I7WUFDbkMsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFvQztZQUMxRCxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDaEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUFzQjtZQVQ1QyxxQkFBZ0IsR0FBRyxJQUFJLG1CQUFtQixFQUFFLENBQUM7WUFFN0MsZUFBVSxHQUFHLElBQUksbUJBQW1CLEVBQUUsQ0FBQztZQVN2RCxJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7UUFFTSw0QkFBNEIsQ0FDbEMsU0FBZ0MsRUFDaEMsUUFBZ0IsRUFDaEIsUUFBK0UsRUFDL0UsT0FBc0c7WUFFdEcsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDMUMsSUFBSSwwQkFBMEIsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUMxQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUN0RixJQUFJLENBQUMsTUFBTSxDQUFDLDJCQUEyQixDQUFDLElBQUEsZ0NBQWUsRUFBQyxTQUFTLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLGNBQWMsSUFBSSxFQUFFLEVBQUU7b0JBQzNHLFlBQVksRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLG9CQUFvQjtpQkFDN0MsRUFBRSxJQUFBLHFEQUFvQyxFQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDckQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFFeEYsSUFBSSwyQ0FBMkMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUMzRCxXQUFXLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFDdEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNwRSxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUNwQixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNoQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDbkUsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7d0JBQ3hELENBQUM7b0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDTCxDQUFDO2dCQUVELElBQUksQ0FBQyxNQUFNLENBQUMsNkJBQTZCLENBQUMsSUFBQSxnQ0FBZSxFQUFDLFNBQVMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsY0FBYyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGtDQUFrQyxFQUFFLElBQUEscURBQW9DLEVBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUM5TSxDQUFDO1lBRUQsT0FBTyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FDbEMsV0FBVyxFQUNYLElBQUksWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMseUJBQXlCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakQsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNOLENBQUM7UUFFRCxLQUFLLENBQUMscUJBQXFCLENBQUMsUUFBdUIsRUFBRSxRQUFnQixFQUFFLFFBQTRCLEVBQUUsb0JBQTBDLEVBQUUsWUFBK0I7WUFDL0ssTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBRUQsSUFBSSxLQUFLLENBQUMsSUFBSSxvQ0FBNEIsRUFBRSxDQUFDO2dCQUM1QyxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBQzNELENBQUM7WUFFRCxNQUFNLGVBQWUsR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLEVBQUUsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFFMUosSUFBSSxXQUE0QixDQUFDO1lBQ2pDLElBQUksMkNBQTJDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2dCQUNoRyxXQUFXLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdkksQ0FBQztZQUNELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFckQsT0FBTyxFQUFFLFFBQVEsRUFBRSwyQ0FBMkMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztRQUNsRixDQUFDO1FBRUQsS0FBSyxDQUFDLHNCQUFzQixDQUFDLFFBQXVCLEVBQUUsUUFBZ0I7WUFDckUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBRUQsSUFBSSxLQUFLLENBQUMsSUFBSSxvQ0FBNEIsRUFBRSxDQUFDO2dCQUM1QyxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBQzVELENBQUM7WUFFRCxNQUFNLGVBQWUsR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzVFLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEIsQ0FBQztRQUVELEtBQUssQ0FBQyxvQkFBb0IsQ0FDekIsUUFBdUIsRUFDdkIsTUFBcUMsRUFDckMsUUFBZ0IsRUFDaEIsUUFLQyxFQUNELFFBQTJCLEVBQzNCLFlBQStCO1lBRS9CLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDeEQsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTFELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3hHLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUV6SixNQUFNLGVBQWUsR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTdDLFFBQVEsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNwQixvQ0FBNEIsQ0FBQyxDQUFDLENBQUM7b0JBQzlCLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxDQUFDO29CQUM1RSxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDMUUsQ0FBQztnQkFDRCxrQ0FBMEIsQ0FBQyxDQUFDLENBQUM7b0JBQzVCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ3JFLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUM5RSxDQUFDO2dCQUNELE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO2dCQUNsRCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxhQUFhLENBQUMsa0JBQWlDLEVBQUUsUUFBZ0IsRUFBRSxPQUFpQjtZQUNuRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsUUFBUSxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDM0UsUUFBUSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBRUQsS0FBSyxDQUFDLG1CQUFtQixDQUFDLE1BQWMsRUFBRSxxQkFBb0MsRUFBRSxRQUFnQjtZQUMvRixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFFRCxJQUFJLENBQUUsS0FBSyxDQUFDLFFBQTRDLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDL0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQ0FBcUMsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNuRSxDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDbkQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5RCxNQUFPLEtBQUssQ0FBQyxRQUE0QyxDQUFDLG9CQUFxQixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUgsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsa0JBQWlDLEVBQUUsUUFBZ0IsRUFBRSxNQUFjLEVBQUUsT0FBZ0I7WUFDaEcsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3hFLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsa0JBQWlDLEVBQUUsUUFBZ0IsRUFBRSxNQUFjLEVBQUUsT0FBZ0I7WUFDaEcsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3hFLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsa0JBQWlDLEVBQUUsUUFBZ0IsRUFBRSxZQUErQjtZQUNqRyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsUUFBUSxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDeEUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sUUFBUSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDbEUsS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLGtCQUFpQyxFQUFFLFFBQWdCLEVBQUUsWUFBK0I7WUFDakcsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxNQUFNLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2hFLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUN2QixDQUFDO1FBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxrQkFBaUMsRUFBRSxRQUFnQixFQUFFLGNBQTZCLEVBQUUsWUFBK0I7WUFDbEksTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxPQUFPLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDaEcsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsa0JBQWlDLEVBQUUsUUFBZ0IsRUFBRSxZQUErQjtZQUNqRyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsUUFBUSxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDeEUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXhELE1BQU0sTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUU7Z0JBQ2xFLFdBQVcsRUFBRSxLQUFLLENBQUMsZUFBZSxFQUFFO2FBQ3BDLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDakIsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMzQixPQUFPLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDbEIsQ0FBQztRQUVPLHNCQUFzQixDQUFDLFFBQWdCLEVBQUUsUUFBdUI7WUFDdkUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNsRSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQzdDLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTyx1QkFBdUIsQ0FBQyxRQUFnQjtZQUMvQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sUUFBUSxHQUFHLEtBQUssRUFBRSxRQUFRLENBQUM7WUFDakMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pFLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztLQUNEO0lBdk5ELG9EQXVOQztJQUVELFNBQVMsMkNBQTJDLENBQUMsUUFBNkc7UUFDakssT0FBTyxDQUFDLENBQUUsUUFBd0MsQ0FBQyx5QkFBeUIsQ0FBQztJQUM5RSxDQUFDO0lBRUQsU0FBUywwQkFBMEIsQ0FBQyxRQUFzRztRQUN6SSxPQUFPLE9BQVEsUUFBNEMsQ0FBQyx1QkFBdUIsS0FBSyxVQUFVLENBQUM7SUFDcEcsQ0FBQztJQUVELFNBQVMsV0FBVyxDQUFDLENBQTJFO1FBQy9GLE9BQU8sT0FBUSxDQUFvQyxDQUFDLElBQUksS0FBSyxVQUFVO2VBQ25FLE9BQVEsQ0FBb0MsQ0FBQyxJQUFJLEtBQUssVUFBVSxDQUFDO0lBQ3RFLENBQUM7SUFFRCxTQUFTLFFBQVEsQ0FBQyxRQUFhO1FBQzlCLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdILE9BQU8sSUFBQSxXQUFJLEVBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3ZCLENBQUMifQ==