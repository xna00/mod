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
define(["require", "exports", "vs/nls", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/common/editor", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/base/common/path", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/workbench/services/untitled/common/untitledTextEditorModel", "vs/workbench/services/textfile/common/textFileEditorModelManager", "vs/platform/instantiation/common/instantiation", "vs/base/common/network", "vs/editor/common/model/textModel", "vs/editor/common/services/model", "vs/base/common/resources", "vs/platform/dialogs/common/dialogs", "vs/base/common/buffer", "vs/editor/common/services/textResourceConfiguration", "vs/editor/common/languages/modesRegistry", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/common/editor/textEditorModel", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/services/textfile/common/encoding", "vs/base/common/stream", "vs/editor/common/languages/language", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/workbench/services/files/common/elevatedFileService", "vs/workbench/services/decorations/common/decorations", "vs/base/common/event", "vs/base/common/codicons", "vs/platform/theme/common/colorRegistry", "vs/base/common/arrays"], function (require, exports, nls_1, textfiles_1, editor_1, lifecycle_1, files_1, lifecycle_2, path_1, environmentService_1, untitledTextEditorService_1, untitledTextEditorModel_1, textFileEditorModelManager_1, instantiation_1, network_1, textModel_1, model_1, resources_1, dialogs_1, buffer_1, textResourceConfiguration_1, modesRegistry_1, filesConfigurationService_1, textEditorModel_1, codeEditorService_1, pathService_1, workingCopyFileService_1, uriIdentity_1, workspace_1, encoding_1, stream_1, language_1, log_1, cancellation_1, elevatedFileService_1, decorations_1, event_1, codicons_1, colorRegistry_1, arrays_1) {
    "use strict";
    var AbstractTextFileService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EncodingOracle = exports.AbstractTextFileService = void 0;
    let AbstractTextFileService = class AbstractTextFileService extends lifecycle_2.Disposable {
        static { AbstractTextFileService_1 = this; }
        static { this.TEXTFILE_SAVE_CREATE_SOURCE = editor_1.SaveSourceRegistry.registerSource('textFileCreate.source', (0, nls_1.localize)('textFileCreate.source', "File Created")); }
        static { this.TEXTFILE_SAVE_REPLACE_SOURCE = editor_1.SaveSourceRegistry.registerSource('textFileOverwrite.source', (0, nls_1.localize)('textFileOverwrite.source', "File Replaced")); }
        constructor(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, codeEditorService, pathService, workingCopyFileService, uriIdentityService, languageService, logService, elevatedFileService, decorationsService) {
            super();
            this.fileService = fileService;
            this.untitledTextEditorService = untitledTextEditorService;
            this.lifecycleService = lifecycleService;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.environmentService = environmentService;
            this.dialogService = dialogService;
            this.fileDialogService = fileDialogService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.filesConfigurationService = filesConfigurationService;
            this.codeEditorService = codeEditorService;
            this.pathService = pathService;
            this.workingCopyFileService = workingCopyFileService;
            this.uriIdentityService = uriIdentityService;
            this.languageService = languageService;
            this.logService = logService;
            this.elevatedFileService = elevatedFileService;
            this.decorationsService = decorationsService;
            this.files = this._register(this.instantiationService.createInstance(textFileEditorModelManager_1.TextFileEditorModelManager));
            this.untitled = this.untitledTextEditorService;
            this.provideDecorations();
        }
        //#region decorations
        provideDecorations() {
            // Text file model decorations
            const provider = this._register(new class extends lifecycle_2.Disposable {
                constructor(files) {
                    super();
                    this.files = files;
                    this.label = (0, nls_1.localize)('textFileModelDecorations', "Text File Model Decorations");
                    this._onDidChange = this._register(new event_1.Emitter());
                    this.onDidChange = this._onDidChange.event;
                    this.registerListeners();
                }
                registerListeners() {
                    // Creates
                    this._register(this.files.onDidResolve(({ model }) => {
                        if (model.isReadonly() || model.hasState(4 /* TextFileEditorModelState.ORPHAN */)) {
                            this._onDidChange.fire([model.resource]);
                        }
                    }));
                    // Removals: once a text file model is no longer
                    // under our control, make sure to signal this as
                    // decoration change because from this point on we
                    // have no way of updating the decoration anymore.
                    this._register(this.files.onDidRemove(modelUri => this._onDidChange.fire([modelUri])));
                    // Changes
                    this._register(this.files.onDidChangeReadonly(model => this._onDidChange.fire([model.resource])));
                    this._register(this.files.onDidChangeOrphaned(model => this._onDidChange.fire([model.resource])));
                }
                provideDecorations(uri) {
                    const model = this.files.get(uri);
                    if (!model || model.isDisposed()) {
                        return undefined;
                    }
                    const isReadonly = model.isReadonly();
                    const isOrphaned = model.hasState(4 /* TextFileEditorModelState.ORPHAN */);
                    // Readonly + Orphaned
                    if (isReadonly && isOrphaned) {
                        return {
                            color: colorRegistry_1.listErrorForeground,
                            letter: codicons_1.Codicon.lockSmall,
                            strikethrough: true,
                            tooltip: (0, nls_1.localize)('readonlyAndDeleted', "Deleted, Read-only"),
                        };
                    }
                    // Readonly
                    else if (isReadonly) {
                        return {
                            letter: codicons_1.Codicon.lockSmall,
                            tooltip: (0, nls_1.localize)('readonly', "Read-only"),
                        };
                    }
                    // Orphaned
                    else if (isOrphaned) {
                        return {
                            color: colorRegistry_1.listErrorForeground,
                            strikethrough: true,
                            tooltip: (0, nls_1.localize)('deleted', "Deleted"),
                        };
                    }
                    return undefined;
                }
            }(this.files));
            this._register(this.decorationsService.registerDecorationsProvider(provider));
        }
        get encoding() {
            if (!this._encoding) {
                this._encoding = this._register(this.instantiationService.createInstance(EncodingOracle));
            }
            return this._encoding;
        }
        async read(resource, options) {
            const [bufferStream, decoder] = await this.doRead(resource, {
                ...options,
                // optimization: since we know that the caller does not
                // care about buffering, we indicate this to the reader.
                // this reduces all the overhead the buffered reading
                // has (open, read, close) if the provider supports
                // unbuffered reading.
                preferUnbuffered: true
            });
            return {
                ...bufferStream,
                encoding: decoder.detected.encoding || encoding_1.UTF8,
                value: await (0, stream_1.consumeStream)(decoder.stream, strings => strings.join(''))
            };
        }
        async readStream(resource, options) {
            const [bufferStream, decoder] = await this.doRead(resource, options);
            return {
                ...bufferStream,
                encoding: decoder.detected.encoding || encoding_1.UTF8,
                value: await (0, textModel_1.createTextBufferFactoryFromStream)(decoder.stream)
            };
        }
        async doRead(resource, options) {
            const cts = new cancellation_1.CancellationTokenSource();
            // read stream raw (either buffered or unbuffered)
            let bufferStream;
            if (options?.preferUnbuffered) {
                const content = await this.fileService.readFile(resource, options, cts.token);
                bufferStream = {
                    ...content,
                    value: (0, buffer_1.bufferToStream)(content.value)
                };
            }
            else {
                bufferStream = await this.fileService.readFileStream(resource, options, cts.token);
            }
            // read through encoding library
            try {
                const decoder = await this.doGetDecodedStream(resource, bufferStream.value, options);
                return [bufferStream, decoder];
            }
            catch (error) {
                // Make sure to cancel reading on error to
                // stop file service activity as soon as
                // possible. When for example a large binary
                // file is read we want to cancel the read
                // instantly.
                // Refs:
                // - https://github.com/microsoft/vscode/issues/138805
                // - https://github.com/microsoft/vscode/issues/132771
                cts.dispose(true);
                // special treatment for streams that are binary
                if (error.decodeStreamErrorKind === 1 /* DecodeStreamErrorKind.STREAM_IS_BINARY */) {
                    throw new textfiles_1.TextFileOperationError((0, nls_1.localize)('fileBinaryError', "File seems to be binary and cannot be opened as text"), 0 /* TextFileOperationResult.FILE_IS_BINARY */, options);
                }
                // re-throw any other error as it is
                else {
                    throw error;
                }
            }
        }
        async create(operations, undoInfo) {
            const operationsWithContents = await Promise.all(operations.map(async (operation) => {
                const contents = await this.getEncodedReadable(operation.resource, operation.value);
                return {
                    resource: operation.resource,
                    contents,
                    overwrite: operation.options?.overwrite
                };
            }));
            return this.workingCopyFileService.create(operationsWithContents, cancellation_1.CancellationToken.None, undoInfo);
        }
        async write(resource, value, options) {
            const readable = await this.getEncodedReadable(resource, value, options);
            if (options?.writeElevated && this.elevatedFileService.isSupported(resource)) {
                return this.elevatedFileService.writeFileElevated(resource, readable, options);
            }
            return this.fileService.writeFile(resource, readable, options);
        }
        async getEncodedReadable(resource, value, options) {
            // check for encoding
            const { encoding, addBOM } = await this.encoding.getWriteEncoding(resource, options);
            // when encoding is standard skip encoding step
            if (encoding === encoding_1.UTF8 && !addBOM) {
                return typeof value === 'undefined'
                    ? undefined
                    : (0, textfiles_1.toBufferOrReadable)(value);
            }
            // otherwise create encoded readable
            value = value || '';
            const snapshot = typeof value === 'string' ? (0, textfiles_1.stringToSnapshot)(value) : value;
            return (0, encoding_1.toEncodeReadable)(snapshot, encoding, { addBOM });
        }
        async getDecodedStream(resource, value, options) {
            return (await this.doGetDecodedStream(resource, value, options)).stream;
        }
        doGetDecodedStream(resource, stream, options) {
            // read through encoding library
            return (0, encoding_1.toDecodeStream)(stream, {
                acceptTextOnly: options?.acceptTextOnly ?? false,
                guessEncoding: options?.autoGuessEncoding || this.textResourceConfigurationService.getValue(resource, 'files.autoGuessEncoding'),
                overwriteEncoding: async (detectedEncoding) => {
                    const { encoding } = await this.encoding.getPreferredReadEncoding(resource, options, detectedEncoding ?? undefined);
                    return encoding;
                }
            });
        }
        //#endregion
        //#region save
        async save(resource, options) {
            // Untitled
            if (resource.scheme === network_1.Schemas.untitled) {
                const model = this.untitled.get(resource);
                if (model) {
                    let targetUri;
                    // Untitled with associated file path don't need to prompt
                    if (model.hasAssociatedFilePath) {
                        targetUri = await this.suggestSavePath(resource);
                    }
                    // Otherwise ask user
                    else {
                        targetUri = await this.fileDialogService.pickFileToSave(await this.suggestSavePath(resource), options?.availableFileSystems);
                    }
                    // Save as if target provided
                    if (targetUri) {
                        return this.saveAs(resource, targetUri, options);
                    }
                }
            }
            // File
            else {
                const model = this.files.get(resource);
                if (model) {
                    return await model.save(options) ? resource : undefined;
                }
            }
            return undefined;
        }
        async saveAs(source, target, options) {
            // Get to target resource
            if (!target) {
                target = await this.fileDialogService.pickFileToSave(await this.suggestSavePath(options?.suggestedTarget ?? source), options?.availableFileSystems);
            }
            if (!target) {
                return; // user canceled
            }
            // Ensure target is not marked as readonly and prompt otherwise
            if (this.filesConfigurationService.isReadonly(target)) {
                const confirmed = await this.confirmMakeWriteable(target);
                if (!confirmed) {
                    return;
                }
                else {
                    this.filesConfigurationService.updateReadonly(target, false);
                }
            }
            // Just save if target is same as models own resource
            if ((0, resources_1.isEqual)(source, target)) {
                return this.save(source, { ...options, force: true /* force to save, even if not dirty (https://github.com/microsoft/vscode/issues/99619) */ });
            }
            // If the target is different but of same identity, we
            // move the source to the target, knowing that the
            // underlying file system cannot have both and then save.
            // However, this will only work if the source exists
            // and is not orphaned, so we need to check that too.
            if (this.fileService.hasProvider(source) && this.uriIdentityService.extUri.isEqual(source, target) && (await this.fileService.exists(source))) {
                await this.workingCopyFileService.move([{ file: { source, target } }], cancellation_1.CancellationToken.None);
                // At this point we don't know whether we have a
                // model for the source or the target URI so we
                // simply try to save with both resources.
                const success = await this.save(source, options);
                if (!success) {
                    await this.save(target, options);
                }
                return target;
            }
            // Do it
            return this.doSaveAs(source, target, options);
        }
        async doSaveAs(source, target, options) {
            let success = false;
            // If the source is an existing text file model, we can directly
            // use that model to copy the contents to the target destination
            const textFileModel = this.files.get(source);
            if (textFileModel?.isResolved()) {
                success = await this.doSaveAsTextFile(textFileModel, source, target, options);
            }
            // Otherwise if the source can be handled by the file service
            // we can simply invoke the copy() function to save as
            else if (this.fileService.hasProvider(source)) {
                await this.fileService.copy(source, target, true);
                success = true;
            }
            // Finally we simply check if we can find a editor model that
            // would give us access to the contents.
            else {
                const textModel = this.modelService.getModel(source);
                if (textModel) {
                    success = await this.doSaveAsTextFile(textModel, source, target, options);
                }
            }
            if (!success) {
                return undefined;
            }
            // Revert the source
            try {
                await this.revert(source);
            }
            catch (error) {
                // It is possible that reverting the source fails, for example
                // when a remote is disconnected and we cannot read it anymore.
                // However, this should not interrupt the "Save As" flow, so
                // we gracefully catch the error and just log it.
                this.logService.error(error);
            }
            return target;
        }
        async doSaveAsTextFile(sourceModel, source, target, options) {
            // Find source encoding if any
            let sourceModelEncoding = undefined;
            const sourceModelWithEncodingSupport = sourceModel;
            if (typeof sourceModelWithEncodingSupport.getEncoding === 'function') {
                sourceModelEncoding = sourceModelWithEncodingSupport.getEncoding();
            }
            // Prefer an existing model if it is already resolved for the given target resource
            let targetExists = false;
            let targetModel = this.files.get(target);
            if (targetModel?.isResolved()) {
                targetExists = true;
            }
            // Otherwise create the target file empty if it does not exist already and resolve it from there
            else {
                targetExists = await this.fileService.exists(target);
                // create target file adhoc if it does not exist yet
                if (!targetExists) {
                    await this.create([{ resource: target, value: '' }]);
                }
                try {
                    targetModel = await this.files.resolve(target, { encoding: sourceModelEncoding });
                }
                catch (error) {
                    // if the target already exists and was not created by us, it is possible
                    // that we cannot resolve the target as text model if it is binary or too
                    // large. in that case we have to delete the target file first and then
                    // re-run the operation.
                    if (targetExists) {
                        if (error.textFileOperationResult === 0 /* TextFileOperationResult.FILE_IS_BINARY */ ||
                            error.fileOperationResult === 7 /* FileOperationResult.FILE_TOO_LARGE */) {
                            await this.fileService.del(target);
                            return this.doSaveAsTextFile(sourceModel, source, target, options);
                        }
                    }
                    throw error;
                }
            }
            // Confirm to overwrite if we have an untitled file with associated file where
            // the file actually exists on disk and we are instructed to save to that file
            // path. This can happen if the file was created after the untitled file was opened.
            // See https://github.com/microsoft/vscode/issues/67946
            let write;
            if (sourceModel instanceof untitledTextEditorModel_1.UntitledTextEditorModel && sourceModel.hasAssociatedFilePath && targetExists && this.uriIdentityService.extUri.isEqual(target, (0, resources_1.toLocalResource)(sourceModel.resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme))) {
                write = await this.confirmOverwrite(target);
            }
            else {
                write = true;
            }
            if (!write) {
                return false;
            }
            let sourceTextModel = undefined;
            if (sourceModel instanceof textEditorModel_1.BaseTextEditorModel) {
                if (sourceModel.isResolved()) {
                    sourceTextModel = sourceModel.textEditorModel ?? undefined;
                }
            }
            else {
                sourceTextModel = sourceModel;
            }
            let targetTextModel = undefined;
            if (targetModel.isResolved()) {
                targetTextModel = targetModel.textEditorModel;
            }
            // take over model value, encoding and language (only if more specific) from source model
            if (sourceTextModel && targetTextModel) {
                // encoding
                targetModel.updatePreferredEncoding(sourceModelEncoding);
                // content
                this.modelService.updateModel(targetTextModel, (0, textModel_1.createTextBufferFactoryFromSnapshot)(sourceTextModel.createSnapshot()));
                // language
                const sourceLanguageId = sourceTextModel.getLanguageId();
                const targetLanguageId = targetTextModel.getLanguageId();
                if (sourceLanguageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID && targetLanguageId === modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                    targetTextModel.setLanguage(sourceLanguageId); // only use if more specific than plain/text
                }
                // transient properties
                const sourceTransientProperties = this.codeEditorService.getTransientModelProperties(sourceTextModel);
                if (sourceTransientProperties) {
                    for (const [key, value] of sourceTransientProperties) {
                        this.codeEditorService.setTransientModelProperty(targetTextModel, key, value);
                    }
                }
            }
            // set source options depending on target exists or not
            if (!options?.source) {
                options = {
                    ...options,
                    source: targetExists ? AbstractTextFileService_1.TEXTFILE_SAVE_REPLACE_SOURCE : AbstractTextFileService_1.TEXTFILE_SAVE_CREATE_SOURCE
                };
            }
            // save model
            return targetModel.save({
                ...options,
                from: source
            });
        }
        async confirmOverwrite(resource) {
            const { confirmed } = await this.dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('confirmOverwrite', "'{0}' already exists. Do you want to replace it?", (0, resources_1.basename)(resource)),
                detail: (0, nls_1.localize)('overwriteIrreversible', "A file or folder with the name '{0}' already exists in the folder '{1}'. Replacing it will overwrite its current contents.", (0, resources_1.basename)(resource), (0, resources_1.basename)((0, resources_1.dirname)(resource))),
                primaryButton: (0, nls_1.localize)({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
            });
            return confirmed;
        }
        async confirmMakeWriteable(resource) {
            const { confirmed } = await this.dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('confirmMakeWriteable', "'{0}' is marked as read-only. Do you want to save anyway?", (0, resources_1.basename)(resource)),
                detail: (0, nls_1.localize)('confirmMakeWriteableDetail', "Paths can be configured as read-only via settings."),
                primaryButton: (0, nls_1.localize)({ key: 'makeWriteableButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Save Anyway")
            });
            return confirmed;
        }
        async suggestSavePath(resource) {
            // Just take the resource as is if the file service can handle it
            if (this.fileService.hasProvider(resource)) {
                return resource;
            }
            const remoteAuthority = this.environmentService.remoteAuthority;
            const defaultFilePath = await this.fileDialogService.defaultFilePath();
            // Otherwise try to suggest a path that can be saved
            let suggestedFilename = undefined;
            if (resource.scheme === network_1.Schemas.untitled) {
                const model = this.untitled.get(resource);
                if (model) {
                    // Untitled with associated file path
                    if (model.hasAssociatedFilePath) {
                        return (0, resources_1.toLocalResource)(resource, remoteAuthority, this.pathService.defaultUriScheme);
                    }
                    // Untitled without associated file path: use name
                    // of untitled model if it is a valid path name and
                    // figure out the file extension from the mode if any.
                    let nameCandidate;
                    if (await this.pathService.hasValidBasename((0, resources_1.joinPath)(defaultFilePath, model.name), model.name)) {
                        nameCandidate = model.name;
                    }
                    else {
                        nameCandidate = (0, resources_1.basename)(resource);
                    }
                    const languageId = model.getLanguageId();
                    if (languageId && languageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                        suggestedFilename = this.suggestFilename(languageId, nameCandidate);
                    }
                    else {
                        suggestedFilename = nameCandidate;
                    }
                }
            }
            // Fallback to basename of resource
            if (!suggestedFilename) {
                suggestedFilename = (0, resources_1.basename)(resource);
            }
            // Try to place where last active file was if any
            // Otherwise fallback to user home
            return (0, resources_1.joinPath)(defaultFilePath, suggestedFilename);
        }
        suggestFilename(languageId, untitledName) {
            const languageName = this.languageService.getLanguageName(languageId);
            if (!languageName) {
                return untitledName; // unknown language, so we cannot suggest a better name
            }
            const untitledExtension = (0, path_1.extname)(untitledName);
            const extensions = this.languageService.getExtensions(languageId);
            if (extensions.includes(untitledExtension)) {
                return untitledName; // preserve extension if it is compatible with the mode
            }
            const primaryExtension = (0, arrays_1.firstOrDefault)(extensions);
            if (primaryExtension) {
                if (untitledExtension) {
                    return `${untitledName.substring(0, untitledName.indexOf(untitledExtension))}${primaryExtension}`;
                }
                return `${untitledName}${primaryExtension}`;
            }
            const filenames = this.languageService.getFilenames(languageId);
            if (filenames.includes(untitledName)) {
                return untitledName; // preserve name if it is compatible with the mode
            }
            return (0, arrays_1.firstOrDefault)(filenames) ?? untitledName;
        }
        //#endregion
        //#region revert
        async revert(resource, options) {
            // Untitled
            if (resource.scheme === network_1.Schemas.untitled) {
                const model = this.untitled.get(resource);
                if (model) {
                    return model.revert(options);
                }
            }
            // File
            else {
                const model = this.files.get(resource);
                if (model && (model.isDirty() || options?.force)) {
                    return model.revert(options);
                }
            }
        }
        //#endregion
        //#region dirty
        isDirty(resource) {
            const model = resource.scheme === network_1.Schemas.untitled ? this.untitled.get(resource) : this.files.get(resource);
            if (model) {
                return model.isDirty();
            }
            return false;
        }
    };
    exports.AbstractTextFileService = AbstractTextFileService;
    exports.AbstractTextFileService = AbstractTextFileService = AbstractTextFileService_1 = __decorate([
        __param(0, files_1.IFileService),
        __param(1, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, model_1.IModelService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, dialogs_1.IDialogService),
        __param(7, dialogs_1.IFileDialogService),
        __param(8, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(9, filesConfigurationService_1.IFilesConfigurationService),
        __param(10, codeEditorService_1.ICodeEditorService),
        __param(11, pathService_1.IPathService),
        __param(12, workingCopyFileService_1.IWorkingCopyFileService),
        __param(13, uriIdentity_1.IUriIdentityService),
        __param(14, language_1.ILanguageService),
        __param(15, log_1.ILogService),
        __param(16, elevatedFileService_1.IElevatedFileService),
        __param(17, decorations_1.IDecorationsService)
    ], AbstractTextFileService);
    let EncodingOracle = class EncodingOracle extends lifecycle_2.Disposable {
        get encodingOverrides() { return this._encodingOverrides; }
        set encodingOverrides(value) { this._encodingOverrides = value; }
        constructor(textResourceConfigurationService, environmentService, contextService, uriIdentityService) {
            super();
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.uriIdentityService = uriIdentityService;
            this._encodingOverrides = this.getDefaultEncodingOverrides();
            this.registerListeners();
        }
        registerListeners() {
            // Workspace Folder Change
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.encodingOverrides = this.getDefaultEncodingOverrides()));
        }
        getDefaultEncodingOverrides() {
            const defaultEncodingOverrides = [];
            // Global settings
            defaultEncodingOverrides.push({ parent: this.environmentService.userRoamingDataHome, encoding: encoding_1.UTF8 });
            // Workspace files (via extension and via untitled workspaces location)
            defaultEncodingOverrides.push({ extension: workspace_1.WORKSPACE_EXTENSION, encoding: encoding_1.UTF8 });
            defaultEncodingOverrides.push({ parent: this.environmentService.untitledWorkspacesHome, encoding: encoding_1.UTF8 });
            // Folder Settings
            this.contextService.getWorkspace().folders.forEach(folder => {
                defaultEncodingOverrides.push({ parent: (0, resources_1.joinPath)(folder.uri, '.vscode'), encoding: encoding_1.UTF8 });
            });
            return defaultEncodingOverrides;
        }
        async getWriteEncoding(resource, options) {
            const { encoding, hasBOM } = await this.getPreferredWriteEncoding(resource, options ? options.encoding : undefined);
            return { encoding, addBOM: hasBOM };
        }
        async getPreferredWriteEncoding(resource, preferredEncoding) {
            const resourceEncoding = await this.getEncodingForResource(resource, preferredEncoding);
            return {
                encoding: resourceEncoding,
                hasBOM: resourceEncoding === encoding_1.UTF16be || resourceEncoding === encoding_1.UTF16le || resourceEncoding === encoding_1.UTF8_with_bom // enforce BOM for certain encodings
            };
        }
        async getPreferredReadEncoding(resource, options, detectedEncoding) {
            let preferredEncoding;
            // Encoding passed in as option
            if (options?.encoding) {
                if (detectedEncoding === encoding_1.UTF8_with_bom && options.encoding === encoding_1.UTF8) {
                    preferredEncoding = encoding_1.UTF8_with_bom; // indicate the file has BOM if we are to resolve with UTF 8
                }
                else {
                    preferredEncoding = options.encoding; // give passed in encoding highest priority
                }
            }
            // Encoding detected
            else if (typeof detectedEncoding === 'string') {
                preferredEncoding = detectedEncoding;
            }
            // Encoding configured
            else if (this.textResourceConfigurationService.getValue(resource, 'files.encoding') === encoding_1.UTF8_with_bom) {
                preferredEncoding = encoding_1.UTF8; // if we did not detect UTF 8 BOM before, this can only be UTF 8 then
            }
            const encoding = await this.getEncodingForResource(resource, preferredEncoding);
            return {
                encoding,
                hasBOM: encoding === encoding_1.UTF16be || encoding === encoding_1.UTF16le || encoding === encoding_1.UTF8_with_bom // enforce BOM for certain encodings
            };
        }
        async getEncodingForResource(resource, preferredEncoding) {
            let fileEncoding;
            const override = this.getEncodingOverride(resource);
            if (override) {
                fileEncoding = override; // encoding override always wins
            }
            else if (preferredEncoding) {
                fileEncoding = preferredEncoding; // preferred encoding comes second
            }
            else {
                fileEncoding = this.textResourceConfigurationService.getValue(resource, 'files.encoding'); // and last we check for settings
            }
            if (fileEncoding !== encoding_1.UTF8) {
                if (!fileEncoding || !(await (0, encoding_1.encodingExists)(fileEncoding))) {
                    fileEncoding = encoding_1.UTF8; // the default is UTF-8
                }
            }
            return fileEncoding;
        }
        getEncodingOverride(resource) {
            if (this.encodingOverrides?.length) {
                for (const override of this.encodingOverrides) {
                    // check if the resource is child of encoding override path
                    if (override.parent && this.uriIdentityService.extUri.isEqualOrParent(resource, override.parent)) {
                        return override.encoding;
                    }
                    // check if the resource extension is equal to encoding override
                    if (override.extension && (0, resources_1.extname)(resource) === `.${override.extension}`) {
                        return override.encoding;
                    }
                }
            }
            return undefined;
        }
    };
    exports.EncodingOracle = EncodingOracle;
    exports.EncodingOracle = EncodingOracle = __decorate([
        __param(0, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], EncodingOracle);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dGZpbGUvYnJvd3Nlci90ZXh0RmlsZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTRDekYsSUFBZSx1QkFBdUIsR0FBdEMsTUFBZSx1QkFBd0IsU0FBUSxzQkFBVTs7aUJBSXZDLGdDQUEyQixHQUFHLDJCQUFrQixDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsRUFBRSxJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSxjQUFjLENBQUMsQ0FBQyxBQUFoSCxDQUFpSDtpQkFDNUksaUNBQTRCLEdBQUcsMkJBQWtCLENBQUMsY0FBYyxDQUFDLDBCQUEwQixFQUFFLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLGVBQWUsQ0FBQyxDQUFDLEFBQXZILENBQXdIO1FBTTVLLFlBQ2UsV0FBNEMsRUFDOUIseUJBQTZELEVBQ3RFLGdCQUFzRCxFQUNsRCxvQkFBOEQsRUFDdEUsWUFBNEMsRUFDN0Isa0JBQW1FLEVBQ2pGLGFBQThDLEVBQzFDLGlCQUFzRCxFQUN2QyxnQ0FBc0YsRUFDN0YseUJBQXdFLEVBQ2hGLGlCQUFzRCxFQUM1RCxXQUEwQyxFQUMvQixzQkFBZ0UsRUFDcEUsa0JBQXdELEVBQzNELGVBQWtELEVBQ3ZELFVBQTBDLEVBQ2pDLG1CQUEwRCxFQUMzRCxrQkFBd0Q7WUFFN0UsS0FBSyxFQUFFLENBQUM7WUFuQnlCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3RCLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBNEI7WUFDbkQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUMvQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3JELGlCQUFZLEdBQVosWUFBWSxD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