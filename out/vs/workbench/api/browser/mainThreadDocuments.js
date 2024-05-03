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
define(["require", "exports", "vs/base/common/errorMessage", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/editor/common/model", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/platform/files/common/files", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/environment/common/environmentService", "vs/base/common/resources", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/event", "vs/workbench/services/path/common/pathService", "vs/base/common/map", "vs/base/common/errors"], function (require, exports, errorMessage_1, lifecycle_1, network_1, uri_1, model_1, model_2, resolverService_1, files_1, extHost_protocol_1, textfiles_1, environmentService_1, resources_1, workingCopyFileService_1, uriIdentity_1, event_1, pathService_1, map_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDocuments = exports.BoundModelReferenceCollection = void 0;
    class BoundModelReferenceCollection {
        constructor(_extUri, _maxAge = 1000 * 60 * 3, // auto-dispse by age
        _maxLength = 1024 * 1024 * 80, // auto-dispose by total length
        _maxSize = 50 // auto-dispose by number of references
        ) {
            this._extUri = _extUri;
            this._maxAge = _maxAge;
            this._maxLength = _maxLength;
            this._maxSize = _maxSize;
            this._data = new Array();
            this._length = 0;
            //
        }
        dispose() {
            this._data = (0, lifecycle_1.dispose)(this._data);
        }
        remove(uri) {
            for (const entry of [...this._data] /* copy array because dispose will modify it */) {
                if (this._extUri.isEqualOrParent(entry.uri, uri)) {
                    entry.dispose();
                }
            }
        }
        add(uri, ref, length = 0) {
            // const length = ref.object.textEditorModel.getValueLength();
            const dispose = () => {
                const idx = this._data.indexOf(entry);
                if (idx >= 0) {
                    this._length -= length;
                    ref.dispose();
                    clearTimeout(handle);
                    this._data.splice(idx, 1);
                }
            };
            const handle = setTimeout(dispose, this._maxAge);
            const entry = { uri, length, dispose };
            this._data.push(entry);
            this._length += length;
            this._cleanup();
        }
        _cleanup() {
            // clean-up wrt total length
            while (this._length > this._maxLength) {
                this._data[0].dispose();
            }
            // clean-up wrt number of documents
            const extraSize = Math.ceil(this._maxSize * 1.2);
            if (this._data.length >= extraSize) {
                (0, lifecycle_1.dispose)(this._data.slice(0, extraSize - this._maxSize));
            }
        }
    }
    exports.BoundModelReferenceCollection = BoundModelReferenceCollection;
    class ModelTracker extends lifecycle_1.Disposable {
        constructor(_model, _onIsCaughtUpWithContentChanges, _proxy, _textFileService) {
            super();
            this._model = _model;
            this._onIsCaughtUpWithContentChanges = _onIsCaughtUpWithContentChanges;
            this._proxy = _proxy;
            this._textFileService = _textFileService;
            this._knownVersionId = this._model.getVersionId();
            this._store.add(this._model.onDidChangeContent((e) => {
                this._knownVersionId = e.versionId;
                this._proxy.$acceptModelChanged(this._model.uri, e, this._textFileService.isDirty(this._model.uri));
                if (this.isCaughtUpWithContentChanges()) {
                    this._onIsCaughtUpWithContentChanges.fire(this._model.uri);
                }
            }));
        }
        isCaughtUpWithContentChanges() {
            return (this._model.getVersionId() === this._knownVersionId);
        }
    }
    let MainThreadDocuments = class MainThreadDocuments extends lifecycle_1.Disposable {
        constructor(extHostContext, _modelService, _textFileService, _fileService, _textModelResolverService, _environmentService, _uriIdentityService, workingCopyFileService, _pathService) {
            super();
            this._modelService = _modelService;
            this._textFileService = _textFileService;
            this._fileService = _fileService;
            this._textModelResolverService = _textModelResolverService;
            this._environmentService = _environmentService;
            this._uriIdentityService = _uriIdentityService;
            this._pathService = _pathService;
            this._onIsCaughtUpWithContentChanges = this._store.add(new event_1.Emitter());
            this.onIsCaughtUpWithContentChanges = this._onIsCaughtUpWithContentChanges.event;
            this._modelTrackers = new map_1.ResourceMap();
            this._modelReferenceCollection = this._store.add(new BoundModelReferenceCollection(_uriIdentityService.extUri));
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDocuments);
            this._store.add(_modelService.onModelLanguageChanged(this._onModelModeChanged, this));
            this._store.add(_textFileService.files.onDidSave(e => {
                if (this._shouldHandleFileEvent(e.model.resource)) {
                    this._proxy.$acceptModelSaved(e.model.resource);
                }
            }));
            this._store.add(_textFileService.files.onDidChangeDirty(m => {
                if (this._shouldHandleFileEvent(m.resource)) {
                    this._proxy.$acceptDirtyStateChanged(m.resource, m.isDirty());
                }
            }));
            this._store.add(workingCopyFileService.onDidRunWorkingCopyFileOperation(e => {
                const isMove = e.operation === 2 /* FileOperation.MOVE */;
                if (isMove || e.operation === 1 /* FileOperation.DELETE */) {
                    for (const pair of e.files) {
                        const removed = isMove ? pair.source : pair.target;
                        if (removed) {
                            this._modelReferenceCollection.remove(removed);
                        }
                    }
                }
            }));
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._modelTrackers.values());
            this._modelTrackers.clear();
            super.dispose();
        }
        isCaughtUpWithContentChanges(resource) {
            const tracker = this._modelTrackers.get(resource);
            if (tracker) {
                return tracker.isCaughtUpWithContentChanges();
            }
            return true;
        }
        _shouldHandleFileEvent(resource) {
            const model = this._modelService.getModel(resource);
            return !!model && (0, model_1.shouldSynchronizeModel)(model);
        }
        handleModelAdded(model) {
            // Same filter as in mainThreadEditorsTracker
            if (!(0, model_1.shouldSynchronizeModel)(model)) {
                // don't synchronize too large models
                return;
            }
            this._modelTrackers.set(model.uri, new ModelTracker(model, this._onIsCaughtUpWithContentChanges, this._proxy, this._textFileService));
        }
        _onModelModeChanged(event) {
            const { model } = event;
            if (!this._modelTrackers.has(model.uri)) {
                return;
            }
            this._proxy.$acceptModelLanguageChanged(model.uri, model.getLanguageId());
        }
        handleModelRemoved(modelUrl) {
            if (!this._modelTrackers.has(modelUrl)) {
                return;
            }
            this._modelTrackers.get(modelUrl).dispose();
            this._modelTrackers.delete(modelUrl);
        }
        // --- from extension host process
        async $trySaveDocument(uri) {
            const target = await this._textFileService.save(uri_1.URI.revive(uri));
            return Boolean(target);
        }
        async $tryOpenDocument(uriData) {
            const inputUri = uri_1.URI.revive(uriData);
            if (!inputUri.scheme || !(inputUri.fsPath || inputUri.authority)) {
                throw new errors_1.ErrorNoTelemetry(`Invalid uri. Scheme and authority or path must be set.`);
            }
            const canonicalUri = this._uriIdentityService.asCanonicalUri(inputUri);
            let promise;
            switch (canonicalUri.scheme) {
                case network_1.Schemas.untitled:
                    promise = this._handleUntitledScheme(canonicalUri);
                    break;
                case network_1.Schemas.file:
                default:
                    promise = this._handleAsResourceInput(canonicalUri);
                    break;
            }
            let documentUri;
            try {
                documentUri = await promise;
            }
            catch (err) {
                throw new errors_1.ErrorNoTelemetry(`cannot open ${canonicalUri.toString()}. Detail: ${(0, errorMessage_1.toErrorMessage)(err)}`);
            }
            if (!documentUri) {
                throw new errors_1.ErrorNoTelemetry(`cannot open ${canonicalUri.toString()}`);
            }
            else if (!resources_1.extUri.isEqual(documentUri, canonicalUri)) {
                throw new errors_1.ErrorNoTelemetry(`cannot open ${canonicalUri.toString()}. Detail: Actual document opened as ${documentUri.toString()}`);
            }
            else if (!this._modelTrackers.has(canonicalUri)) {
                throw new errors_1.ErrorNoTelemetry(`cannot open ${canonicalUri.toString()}. Detail: Files above 50MB cannot be synchronized with extensions.`);
            }
            else {
                return canonicalUri;
            }
        }
        $tryCreateDocument(options) {
            return this._doCreateUntitled(undefined, options ? options.language : undefined, options ? options.content : undefined);
        }
        async _handleAsResourceInput(uri) {
            const ref = await this._textModelResolverService.createModelReference(uri);
            this._modelReferenceCollection.add(uri, ref, ref.object.textEditorModel.getValueLength());
            return ref.object.textEditorModel.uri;
        }
        async _handleUntitledScheme(uri) {
            const asLocalUri = (0, resources_1.toLocalResource)(uri, this._environmentService.remoteAuthority, this._pathService.defaultUriScheme);
            const exists = await this._fileService.exists(asLocalUri);
            if (exists) {
                // don't create a new file ontop of an existing file
                return Promise.reject(new Error('file already exists'));
            }
            return await this._doCreateUntitled(Boolean(uri.path) ? uri : undefined);
        }
        async _doCreateUntitled(associatedResource, languageId, initialValue) {
            const model = this._textFileService.untitled.create({
                associatedResource,
                languageId,
                initialValue
            });
            const resource = model.resource;
            const ref = await this._textModelResolverService.createModelReference(resource);
            if (!this._modelTrackers.has(resource)) {
                ref.dispose();
                throw new Error(`expected URI ${resource.toString()} to have come to LIFE`);
            }
            this._modelReferenceCollection.add(resource, ref, ref.object.textEditorModel.getValueLength());
            event_1.Event.once(model.onDidRevert)(() => this._modelReferenceCollection.remove(resource));
            this._proxy.$acceptDirtyStateChanged(resource, true); // mark as dirty
            return resource;
        }
    };
    exports.MainThreadDocuments = MainThreadDocuments;
    exports.MainThreadDocuments = MainThreadDocuments = __decorate([
        __param(1, model_2.IModelService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, files_1.IFileService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, uriIdentity_1.IUriIdentityService),
        __param(7, workingCopyFileService_1.IWorkingCopyFileService),
        __param(8, pathService_1.IPathService)
    ], MainThreadDocuments);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERvY3VtZW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWREb2N1bWVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0JoRyxNQUFhLDZCQUE2QjtRQUt6QyxZQUNrQixPQUFnQixFQUNoQixVQUFrQixJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxxQkFBcUI7UUFDdEQsYUFBcUIsSUFBSSxHQUFHLElBQUksR0FBRyxFQUFFLEVBQUUsK0JBQStCO1FBQ3RFLFdBQW1CLEVBQUUsQ0FBQyx1Q0FBdUM7O1lBSDdELFlBQU8sR0FBUCxPQUFPLENBQVM7WUFDaEIsWUFBTyxHQUFQLE9BQU8sQ0FBd0I7WUFDL0IsZUFBVSxHQUFWLFVBQVUsQ0FBMkI7WUFDckMsYUFBUSxHQUFSLFFBQVEsQ0FBYTtZQVAvQixVQUFLLEdBQUcsSUFBSSxLQUFLLEVBQWlELENBQUM7WUFDbkUsWUFBTyxHQUFHLENBQUMsQ0FBQztZQVFuQixFQUFFO1FBQ0gsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUEsbUJBQU8sRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELE1BQU0sQ0FBQyxHQUFRO1lBQ2QsS0FBSyxNQUFNLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLCtDQUErQyxFQUFFLENBQUM7Z0JBQ3JGLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNsRCxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2pCLENBQUM7WUFDRixD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