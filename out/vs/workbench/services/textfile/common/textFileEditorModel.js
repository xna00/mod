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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/performance", "vs/base/common/types", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/common/editor", "vs/workbench/common/editor/textEditorModel", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/platform/files/common/files", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/base/common/async", "vs/platform/log/common/log", "vs/base/common/path", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/workingCopy/common/workingCopy", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/label/common/label", "vs/base/common/cancellation", "vs/workbench/services/textfile/common/encoding", "vs/editor/common/model/textModel", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/workbench/services/path/common/pathService", "vs/base/common/resources", "vs/platform/accessibility/common/accessibility", "vs/editor/common/languages/modesRegistry", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls_1, event_1, performance_1, types_1, textfiles_1, editor_1, textEditorModel_1, workingCopyBackup_1, files_1, language_1, model_1, async_1, log_1, path_1, workingCopyService_1, workingCopy_1, filesConfigurationService_1, label_1, cancellation_1, encoding_1, textModel_1, languageDetectionWorkerService_1, pathService_1, resources_1, accessibility_1, modesRegistry_1, extensions_1) {
    "use strict";
    var TextFileEditorModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextFileEditorModel = void 0;
    /**
     * The text file editor model listens to changes to its underlying code editor model and saves these changes through the file service back to the disk.
     */
    let TextFileEditorModel = class TextFileEditorModel extends textEditorModel_1.BaseTextEditorModel {
        static { TextFileEditorModel_1 = this; }
        static { this.TEXTFILE_SAVE_ENCODING_SOURCE = editor_1.SaveSourceRegistry.registerSource('textFileEncoding.source', (0, nls_1.localize)('textFileCreate.source', "File Encoding Changed")); }
        static { this.UNDO_REDO_SAVE_PARTICIPANTS_AUTO_SAVE_THROTTLE_THRESHOLD = 500; }
        constructor(resource, preferredEncoding, // encoding as chosen by the user
        preferredLanguageId, languageService, modelService, fileService, textFileService, workingCopyBackupService, logService, workingCopyService, filesConfigurationService, labelService, languageDetectionService, accessibilityService, pathService, extensionService) {
            super(modelService, languageService, languageDetectionService, accessibilityService);
            this.resource = resource;
            this.preferredEncoding = preferredEncoding;
            this.preferredLanguageId = preferredLanguageId;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.workingCopyBackupService = workingCopyBackupService;
            this.logService = logService;
            this.workingCopyService = workingCopyService;
            this.filesConfigurationService = filesConfigurationService;
            this.labelService = labelService;
            this.pathService = pathService;
            this.extensionService = extensionService;
            //#region Events
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidResolve = this._register(new event_1.Emitter());
            this.onDidResolve = this._onDidResolve.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidSaveError = this._register(new event_1.Emitter());
            this.onDidSaveError = this._onDidSaveError.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidRevert = this._register(new event_1.Emitter());
            this.onDidRevert = this._onDidRevert.event;
            this._onDidChangeEncoding = this._register(new event_1.Emitter());
            this.onDidChangeEncoding = this._onDidChangeEncoding.event;
            this._onDidChangeOrphaned = this._register(new event_1.Emitter());
            this.onDidChangeOrphaned = this._onDidChangeOrphaned.event;
            this._onDidChangeReadonly = this._register(new event_1.Emitter());
            this.onDidChangeReadonly = this._onDidChangeReadonly.event;
            //#endregion
            this.typeId = workingCopy_1.NO_TYPE_ID; // IMPORTANT: never change this to not break existing assumptions (e.g. backups)
            this.capabilities = 0 /* WorkingCopyCapabilities.None */;
            this.name = (0, path_1.basename)(this.labelService.getUriLabel(this.resource));
            this.resourceHasExtension = !!resources_1.extUri.extname(this.resource);
            this.versionId = 0;
            this.ignoreDirtyOnModelContentChange = false;
            this.ignoreSaveFromSaveParticipants = false;
            this.lastModelContentChangeFromUndoRedo = undefined;
            this.saveSequentializer = new async_1.TaskSequentializer();
            this.dirty = false;
            this.inConflictMode = false;
            this.inOrphanMode = false;
            this.inErrorMode = false;
            this.hasEncodingSetExplicitly = false;
            // Make known to working copy service
            this._register(this.workingCopyService.registerWorkingCopy(this));
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            this._register(this.filesConfigurationService.onDidChangeFilesAssociation(() => this.onDidChangeFilesAssociation()));
            this._register(this.filesConfigurationService.onDidChangeReadonly(() => this._onDidChangeReadonly.fire()));
        }
        async onDidFilesChange(e) {
            let fileEventImpactsModel = false;
            let newInOrphanModeGuess;
            // If we are currently orphaned, we check if the model file was added back
            if (this.inOrphanMode) {
                const modelFileAdded = e.contains(this.resource, 1 /* FileChangeType.ADDED */);
                if (modelFileAdded) {
                    newInOrphanModeGuess = false;
                    fileEventImpactsModel = true;
                }
            }
            // Otherwise we check if the model file was deleted
            else {
                const modelFileDeleted = e.contains(this.resource, 2 /* FileChangeType.DELETED */);
                if (modelFileDeleted) {
                    newInOrphanModeGuess = true;
                    fileEventImpactsModel = true;
                }
            }
            if (fileEventImpactsModel && this.inOrphanMode !== newInOrphanModeGuess) {
                let newInOrphanModeValidated = false;
                if (newInOrphanModeGuess) {
                    // We have received reports of users seeing delete events even though the file still
                    // exists (network shares issue: https://github.com/microsoft/vscode/issues/13665).
                    // Since we do not want to mark the model as orphaned, we have to check if the
                    // file is really gone and not just a faulty file event.
                    await (0, async_1.timeout)(100, cancellation_1.CancellationToken.None);
                    if (this.isDisposed()) {
                        newInOrphanModeValidated = true;
                    }
                    else {
                        const exists = await this.fileService.exists(this.resource);
                        newInOrphanModeValidated = !exists;
                    }
                }
                if (this.inOrphanMode !== newInOrphanModeValidated && !this.isDisposed()) {
                    this.setOrphaned(newInOrphanModeValidated);
                }
            }
        }
        setOrphaned(orphaned) {
            if (this.inOrphanMode !== orphaned) {
                this.inOrphanMode = orphaned;
                this._onDidChangeOrphaned.fire();
            }
        }
        onDidChangeFilesAssociation() {
            if (!this.isResolved()) {
                return;
            }
            const firstLineText = this.getFirstLineText(this.textEditorModel);
            const languageSelection = this.getOrCreateLanguage(this.resource, this.languageService, this.preferredLanguageId, firstLineText);
            this.textEditorModel.setLanguage(languageSelection);
        }
        setLanguageId(languageId, source) {
            super.setLanguageId(languageId, source);
            this.preferredLanguageId = languageId;
        }
        //#region Backup
        async backup(token) {
            // Fill in metadata if we are resolved
            let meta = undefined;
            if (this.lastResolvedFileStat) {
                meta = {
                    mtime: this.lastResolvedFileStat.mtime,
                    ctime: this.lastResolvedFileStat.ctime,
                    size: this.lastResolvedFileStat.size,
                    etag: this.lastResolvedFileStat.etag,
                    orphaned: this.inOrphanMode
                };
            }
            // Fill in content the same way we would do when
            // saving the file via the text file service
            // encoding support (hardcode UTF-8)
            const content = await this.textFileService.getEncodedReadable(this.resource, this.createSnapshot() ?? undefined, { encoding: encoding_1.UTF8 });
            return { meta, content };
        }
        //#endregion
        //#region Revert
        async revert(options) {
            if (!this.isResolved()) {
                return;
            }
            // Unset flags
            const wasDirty = this.dirty;
            const undo = this.doSetDirty(false);
            // Force read from disk unless reverting soft
            const softUndo = options?.soft;
            if (!softUndo) {
                try {
                    await this.forceResolveFromFile();
                }
                catch (error) {
                    // FileNotFound means the file got deleted meanwhile, so ignore it
                    if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        // Set flags back to previous values, we are still dirty if revert failed
                        undo();
                        throw error;
                    }
                }
            }
            // Emit file change event
            this._onDidRevert.fire();
            // Emit dirty change event
            if (wasDirty) {
                this._onDidChangeDirty.fire();
            }
        }
        //#endregion
        //#region Resolve
        async resolve(options) {
            this.trace('resolve() - enter');
            (0, performance_1.mark)('code/willResolveTextFileEditorModel');
            // Return early if we are disposed
            if (this.isDisposed()) {
                this.trace('resolve() - exit - without resolving because model is disposed');
                return;
            }
            // Unless there are explicit contents provided, it is important that we do not
            // resolve a model that is dirty or is in the process of saving to prevent data
            // loss.
            if (!options?.contents && (this.dirty || this.saveSequentializer.isRunning())) {
                this.trace('resolve() - exit - without resolving because model is dirty or being saved');
                return;
            }
            // Resolve either from backup or from file
            await this.doResolve(options);
            (0, performance_1.mark)('code/didResolveTextFileEditorModel');
        }
        async doResolve(options) {
            // First check if we have contents to use for the model
            if (options?.contents) {
                return this.resolveFromBuffer(options.contents, options);
            }
            // Second, check if we have a backup to resolve from (only for new models)
            const isNewModel = !this.isResolved();
            if (isNewModel) {
                const resolvedFromBackup = await this.resolveFromBackup(options);
                if (resolvedFromBackup) {
                    return;
                }
            }
            // Finally, resolve from file resource
            return this.resolveFromFile(options);
        }
        async resolveFromBuffer(buffer, options) {
            this.trace('resolveFromBuffer()');
            // Try to resolve metdata from disk
            let mtime;
            let ctime;
            let size;
            let etag;
            try {
                const metadata = await this.fileService.stat(this.resource);
                mtime = metadata.mtime;
                ctime = metadata.ctime;
                size = metadata.size;
                etag = metadata.etag;
                // Clear orphaned state when resolving was successful
                this.setOrphaned(false);
            }
            catch (error) {
                // Put some fallback values in error case
                mtime = Date.now();
                ctime = Date.now();
                size = 0;
                etag = files_1.ETAG_DISABLED;
                // Apply orphaned state based on error code
                this.setOrphaned(error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */);
            }
            const preferredEncoding = await this.textFileService.encoding.getPreferredWriteEncoding(this.resource, this.preferredEncoding);
            // Resolve with buffer
            this.resolveFromContent({
                resource: this.resource,
                name: this.name,
                mtime,
                ctime,
                size,
                etag,
                value: buffer,
                encoding: preferredEncoding.encoding,
                readonly: false,
                locked: false
            }, true /* dirty (resolved from buffer) */, options);
        }
        async resolveFromBackup(options) {
            // Resolve backup if any
            const backup = await this.workingCopyBackupService.resolve(this);
            // Resolve preferred encoding if we need it
            let encoding = encoding_1.UTF8;
            if (backup) {
                encoding = (await this.textFileService.encoding.getPreferredWriteEncoding(this.resource, this.preferredEncoding)).encoding;
            }
            // Abort if someone else managed to resolve the model by now
            const isNewModel = !this.isResolved();
            if (!isNewModel) {
                this.trace('resolveFromBackup() - exit - without resolving because previously new model got created meanwhile');
                return true; // imply that resolving has happened in another operation
            }
            // Try to resolve from backup if we have any
            if (backup) {
                await this.doResolveFromBackup(backup, encoding, options);
                return true;
            }
            // Otherwise signal back that resolving did not happen
            return false;
        }
        async doResolveFromBackup(backup, encoding, options) {
            this.trace('doResolveFromBackup()');
            // Resolve with backup
            this.resolveFromContent({
                resource: this.resource,
                name: this.name,
                mtime: backup.meta ? backup.meta.mtime : Date.now(),
                ctime: backup.meta ? backup.meta.ctime : Date.now(),
                size: backup.meta ? backup.meta.size : 0,
                etag: backup.meta ? backup.meta.etag : files_1.ETAG_DISABLED, // etag disabled if unknown!
                value: await (0, textModel_1.createTextBufferFactoryFromStream)(await this.textFileService.getDecodedStream(this.resource, backup.value, { encoding: encoding_1.UTF8 })),
                encoding,
                readonly: false,
                locked: false
            }, true /* dirty (resolved from backup) */, options);
            // Restore orphaned flag based on state
            if (backup.meta?.orphaned) {
                this.setOrphaned(true);
            }
        }
        async resolveFromFile(options) {
            this.trace('resolveFromFile()');
            const forceReadFromFile = options?.forceReadFromFile;
            const allowBinary = this.isResolved() /* always allow if we resolved previously */ || options?.allowBinary;
            // Decide on etag
            let etag;
            if (forceReadFromFile) {
                etag = files_1.ETAG_DISABLED; // disable ETag if we enforce to read from disk
            }
            else if (this.lastResolvedFileStat) {
                etag = this.lastResolvedFileStat.etag; // otherwise respect etag to support caching
            }
            // Remember current version before doing any long running operation
            // to ensure we are not changing a model that was changed meanwhile
            const currentVersionId = this.versionId;
            // Resolve Content
            try {
                const content = await this.textFileService.readStream(this.resource, {
                    acceptTextOnly: !allowBinary,
                    etag,
                    encoding: this.preferredEncoding,
                    limits: options?.limits
                });
                // Clear orphaned state when resolving was successful
                this.setOrphaned(false);
                // Return early if the model content has changed
                // meanwhile to prevent loosing any changes
                if (currentVersionId !== this.versionId) {
                    this.trace('resolveFromFile() - exit - without resolving because model content changed');
                    return;
                }
                return this.resolveFromContent(content, false /* not dirty (resolved from file) */, options);
            }
            catch (error) {
                const result = error.fileOperationResult;
                // Apply orphaned state based on error code
                this.setOrphaned(result === 1 /* FileOperationResult.FILE_NOT_FOUND */);
                // NotModified status is expected and can be handled gracefully
                // if we are resolved. We still want to update our last resolved
                // stat to e.g. detect changes to the file's readonly state
                if (this.isResolved() && result === 2 /* FileOperationResult.FILE_NOT_MODIFIED_SINCE */) {
                    if (error instanceof files_1.NotModifiedSinceFileOperationError) {
                        this.updateLastResolvedFileStat(error.stat);
                    }
                    return;
                }
                // Unless we are forced to read from the file, Ignore when a model has been resolved once
                // and the file was deleted meanwhile. Since we already have the model resolved, we can return
                // to this state and update the orphaned flag to indicate that this model has no version on
                // disk anymore.
                if (this.isResolved() && result === 1 /* FileOperationResult.FILE_NOT_FOUND */ && !forceReadFromFile) {
                    return;
                }
                // Otherwise bubble up the error
                throw error;
            }
        }
        resolveFromContent(content, dirty, options) {
            this.trace('resolveFromContent() - enter');
            // Return early if we are disposed
            if (this.isDisposed()) {
                this.trace('resolveFromContent() - exit - because model is disposed');
                return;
            }
            // Update our resolved disk stat model
            this.updateLastResolvedFileStat({
                resource: this.resource,
                name: content.name,
                mtime: content.mtime,
                ctime: content.ctime,
                size: content.size,
                etag: content.etag,
                readonly: content.readonly,
                locked: content.locked,
                isFile: true,
                isDirectory: false,
                isSymbolicLink: false,
                children: undefined
            });
            // Keep the original encoding to not loose it when saving
            const oldEncoding = this.contentEncoding;
            this.contentEncoding = content.encoding;
            // Handle events if encoding changed
            if (this.preferredEncoding) {
                this.updatePreferredEncoding(this.contentEncoding); // make sure to reflect the real encoding of the file (never out of sync)
            }
            else if (oldEncoding !== this.contentEncoding) {
                this._onDidChangeEncoding.fire();
            }
            // Update Existing Model
            if (this.textEditorModel) {
                this.doUpdateTextModel(content.value);
            }
            // Create New Model
            else {
                this.doCreateTextModel(content.resource, content.value);
            }
            // Update model dirty flag. This is very important to call
            // in both cases of dirty or not because it conditionally
            // updates the `bufferSavedVersionId` to determine the
            // version when to consider the model as saved again (e.g.
            // when undoing back to the saved state)
            this.setDirty(!!dirty);
            // Emit as event
            this._onDidResolve.fire(options?.reason ?? 3 /* TextFileResolveReason.OTHER */);
        }
        doCreateTextModel(resource, value) {
            this.trace('doCreateTextModel()');
            // Create model
            const textModel = this.createTextEditorModel(value, resource, this.preferredLanguageId);
            // Model Listeners
            this.installModelListeners(textModel);
            // Detect language from content
            this.autoDetectLanguage();
        }
        doUpdateTextModel(value) {
            this.trace('doUpdateTextModel()');
            // Update model value in a block that ignores content change events for dirty tracking
            this.ignoreDirtyOnModelContentChange = true;
            try {
                this.updateTextEditorModel(value, this.preferredLanguageId);
            }
            finally {
                this.ignoreDirtyOnModelContentChange = false;
            }
        }
        installModelListeners(model) {
            // See https://github.com/microsoft/vscode/issues/30189
            // This code has been extracted to a different method because it caused a memory leak
            // where `value` was captured in the content change listener closure scope.
            this._register(model.onDidChangeContent(e => this.onModelContentChanged(model, e.isUndoing || e.isRedoing)));
            this._register(model.onDidChangeLanguage(() => this.onMaybeShouldChangeEncoding())); // detect possible encoding change via language specific settings
            super.installModelListeners(model);
        }
        onModelContentChanged(model, isUndoingOrRedoing) {
            this.trace(`onModelContentChanged() - enter`);
            // In any case increment the version id because it tracks the textual content state of the model at all times
            this.versionId++;
            this.trace(`onModelContentChanged() - new versionId ${this.versionId}`);
            // Remember when the user changed the model through a undo/redo operation.
            // We need this information to throttle save participants to fix
            // https://github.com/microsoft/vscode/issues/102542
            if (isUndoingOrRedoing) {
                this.lastModelContentChangeFromUndoRedo = Date.now();
            }
            // We mark check for a dirty-state change upon model content change, unless:
            // - explicitly instructed to ignore it (e.g. from model.resolve())
            // - the model is readonly (in that case we never assume the change was done by the user)
            if (!this.ignoreDirtyOnModelContentChange && !this.isReadonly()) {
                // The contents changed as a matter of Undo and the version reached matches the saved one
                // In this case we clear the dirty flag and emit a SAVED event to indicate this state.
                if (model.getAlternativeVersionId() === this.bufferSavedVersionId) {
                    this.trace('onModelContentChanged() - model content changed back to last saved version');
                    // Clear flags
                    const wasDirty = this.dirty;
                    this.setDirty(false);
                    // Emit revert event if we were dirty
                    if (wasDirty) {
                        this._onDidRevert.fire();
                    }
                }
                // Otherwise the content has changed and we signal this as becoming dirty
                else {
                    this.trace('onModelContentChanged() - model content changed and marked as dirty');
                    // Mark as dirty
                    this.setDirty(true);
                }
            }
            // Emit as event
            this._onDidChangeContent.fire();
            // Detect language from content
            this.autoDetectLanguage();
        }
        async autoDetectLanguage() {
            // Wait to be ready to detect language
            await this.extensionService?.whenInstalledExtensionsRegistered();
            // Only perform language detection conditionally
            const languageId = this.getLanguageId();
            if (this.resource.scheme === this.pathService.defaultUriScheme && // make sure to not detect language for non-user visible documents
                (!languageId || languageId === modesRegistry_1.PLAINTEXT_LANGUAGE_ID) && // only run on files with plaintext language set or no language set at all
                !this.resourceHasExtension // only run if this particular file doesn't have an extension
            ) {
                return super.autoDetectLanguage();
            }
        }
        async forceResolveFromFile() {
            if (this.isDisposed()) {
                return; // return early when the model is invalid
            }
            // We go through the text file service to make
            // sure this kind of `resolve` is properly
            // running in sequence with any other running
            // `resolve` if any, including subsequent runs
            // that are triggered right after.
            await this.textFileService.files.resolve(this.resource, {
                reload: { async: false },
                forceReadFromFile: true
            });
        }
        //#endregion
        //#region Dirty
        isDirty() {
            return this.dirty;
        }
        isModified() {
            return this.isDirty();
        }
        setDirty(dirty) {
            if (!this.isResolved()) {
                return; // only resolved models can be marked dirty
            }
            // Track dirty state and version id
            const wasDirty = this.dirty;
            this.doSetDirty(dirty);
            // Emit as Event if dirty changed
            if (dirty !== wasDirty) {
                this._onDidChangeDirty.fire();
            }
        }
        doSetDirty(dirty) {
            const wasDirty = this.dirty;
            const wasInConflictMode = this.inConflictMode;
            const wasInErrorMode = this.inErrorMode;
            const oldBufferSavedVersionId = this.bufferSavedVersionId;
            if (!dirty) {
                this.dirty = false;
                this.inConflictMode = false;
                this.inErrorMode = false;
                this.updateSavedVersionId();
            }
            else {
                this.dirty = true;
            }
            // Return function to revert this call
            return () => {
                this.dirty = wasDirty;
                this.inConflictMode = wasInConflictMode;
                this.inErrorMode = wasInErrorMode;
                this.bufferSavedVersionId = oldBufferSavedVersionId;
            };
        }
        //#endregion
        //#region Save
        async save(options = Object.create(null)) {
            if (!this.isResolved()) {
                return false;
            }
            if (this.isReadonly()) {
                this.trace('save() - ignoring request for readonly resource');
                return false; // if model is readonly we do not attempt to save at all
            }
            if ((this.hasState(3 /* TextFileEditorModelState.CONFLICT */) || this.hasState(5 /* TextFileEditorModelState.ERROR */)) &&
                (options.reason === 2 /* SaveReason.AUTO */ || options.reason === 3 /* SaveReason.FOCUS_CHANGE */ || options.reason === 4 /* SaveReason.WINDOW_CHANGE */)) {
                this.trace('save() - ignoring auto save request for model that is in conflict or error');
                return false; // if model is in save conflict or error, do not save unless save reason is explicit
            }
            // Actually do save and log
            this.trace('save() - enter');
            await this.doSave(options);
            this.trace('save() - exit');
            return this.hasState(0 /* TextFileEditorModelState.SAVED */);
        }
        async doSave(options) {
            if (typeof options.reason !== 'number') {
                options.reason = 1 /* SaveReason.EXPLICIT */;
            }
            let versionId = this.versionId;
            this.trace(`doSave(${versionId}) - enter with versionId ${versionId}`);
            // Return early if saved from within save participant to break recursion
            //
            // Scenario: a save participant triggers a save() on the model
            if (this.ignoreSaveFromSaveParticipants) {
                this.trace(`doSave(${versionId}) - exit - refusing to save() recursively from save participant`);
                return;
            }
            // Lookup any running save for this versionId and return it if found
            //
            // Scenario: user invoked the save action multiple times quickly for the same contents
            //           while the save was not yet finished to disk
            //
            if (this.saveSequentializer.isRunning(versionId)) {
                this.trace(`doSave(${versionId}) - exit - found a running save for versionId ${versionId}`);
                return this.saveSequentializer.running;
            }
            // Return early if not dirty (unless forced)
            //
            // Scenario: user invoked save action even though the model is not dirty
            if (!options.force && !this.dirty) {
                this.trace(`doSave(${versionId}) - exit - because not dirty and/or versionId is different (this.isDirty: ${this.dirty}, this.versionId: ${this.versionId})`);
                return;
            }
            // Return if currently saving by storing this save request as the next save that should happen.
            // Never ever must 2 saves execute at the same time because this can lead to dirty writes and race conditions.
            //
            // Scenario A: auto save was triggered and is currently busy saving to disk. this takes long enough that another auto save
            //             kicks in.
            // Scenario B: save is very slow (e.g. network share) and the user manages to change the buffer and trigger another save
            //             while the first save has not returned yet.
            //
            if (this.saveSequentializer.isRunning()) {
                this.trace(`doSave(${versionId}) - exit - because busy saving`);
                // Indicate to the save sequentializer that we want to
                // cancel the running operation so that ours can run
                // before the running one finishes.
                // Currently this will try to cancel running save
                // participants but never a running save.
                this.saveSequentializer.cancelRunning();
                // Queue this as the upcoming save and return
                return this.saveSequentializer.queue(() => this.doSave(options));
            }
            // Push all edit operations to the undo stack so that the user has a chance to
            // Ctrl+Z back to the saved version.
            if (this.isResolved()) {
                this.textEditorModel.pushStackElement();
            }
            const saveCancellation = new cancellation_1.CancellationTokenSource();
            return this.saveSequentializer.run(versionId, (async () => {
                // A save participant can still change the model now and since we are so close to saving
                // we do not want to trigger another auto save or similar, so we block this
                // In addition we update our version right after in case it changed because of a model change
                //
                // Save participants can also be skipped through API.
                if (this.isResolved() && !options.skipSaveParticipants) {
                    try {
                        // Measure the time it took from the last undo/redo operation to this save. If this
                        // time is below `UNDO_REDO_SAVE_PARTICIPANTS_THROTTLE_THRESHOLD`, we make sure to
                        // delay the save participant for the remaining time if the reason is auto save.
                        //
                        // This fixes the following issue:
                        // - the user has configured auto save with delay of 100ms or shorter
                        // - the user has a save participant enabled that modifies the file on each save
                        // - the user types into the file and the file gets saved
                        // - the user triggers undo operation
                        // - this will undo the save participant change but trigger the save participant right after
                        // - the user has no chance to undo over the save participant
                        //
                        // Reported as: https://github.com/microsoft/vscode/issues/102542
                        if (options.reason === 2 /* SaveReason.AUTO */ && typeof this.lastModelContentChangeFromUndoRedo === 'number') {
                            const timeFromUndoRedoToSave = Date.now() - this.lastModelContentChangeFromUndoRedo;
                            if (timeFromUndoRedoToSave < TextFileEditorModel_1.UNDO_REDO_SAVE_PARTICIPANTS_AUTO_SAVE_THROTTLE_THRESHOLD) {
                                await (0, async_1.timeout)(TextFileEditorModel_1.UNDO_REDO_SAVE_PARTICIPANTS_AUTO_SAVE_THROTTLE_THRESHOLD - timeFromUndoRedoToSave);
                            }
                        }
                        // Run save participants unless save was cancelled meanwhile
                        if (!saveCancellation.token.isCancellationRequested) {
                            this.ignoreSaveFromSaveParticipants = true;
                            try {
                                await this.textFileService.files.runSaveParticipants(this, { reason: options.reason ?? 1 /* SaveReason.EXPLICIT */, savedFrom: options.from }, saveCancellation.token);
                            }
                            finally {
                                this.ignoreSaveFromSaveParticipants = false;
                            }
                        }
                    }
                    catch (error) {
                        this.logService.error(`[text file model] runSaveParticipants(${versionId}) - resulted in an error: ${error.toString()}`, this.resource.toString());
                    }
                }
                // It is possible that a subsequent save is cancelling this
                // running save. As such we return early when we detect that
                // However, we do not pass the token into the file service
                // because that is an atomic operation currently without
                // cancellation support, so we dispose the cancellation if
                // it was not cancelled yet.
                if (saveCancellation.token.isCancellationRequested) {
                    return;
                }
                else {
                    saveCancellation.dispose();
                }
                // We have to protect against being disposed at this point. It could be that the save() operation
                // was triggerd followed by a dispose() operation right after without waiting. Typically we cannot
                // be disposed if we are dirty, but if we are not dirty, save() and dispose() can still be triggered
                // one after the other without waiting for the save() to complete. If we are disposed(), we risk
                // saving contents to disk that are stale (see https://github.com/microsoft/vscode/issues/50942).
                // To fix this issue, we will not store the contents to disk when we got disposed.
                if (this.isDisposed()) {
                    return;
                }
                // We require a resolved model from this point on, since we are about to write data to disk.
                if (!this.isResolved()) {
                    return;
                }
                // update versionId with its new value (if pre-save changes happened)
                versionId = this.versionId;
                // Clear error flag since we are trying to save again
                this.inErrorMode = false;
                // Save to Disk. We mark the save operation as currently running with
                // the latest versionId because it might have changed from a save
                // participant triggering
                this.trace(`doSave(${versionId}) - before write()`);
                const lastResolvedFileStat = (0, types_1.assertIsDefined)(this.lastResolvedFileStat);
                const resolvedTextFileEditorModel = this;
                return this.saveSequentializer.run(versionId, (async () => {
                    try {
                        const stat = await this.textFileService.write(lastResolvedFileStat.resource, resolvedTextFileEditorModel.createSnapshot(), {
                            mtime: lastResolvedFileStat.mtime,
                            encoding: this.getEncoding(),
                            etag: (options.ignoreModifiedSince || !this.filesConfigurationService.preventSaveConflicts(lastResolvedFileStat.resource, resolvedTextFileEditorModel.getLanguageId())) ? files_1.ETAG_DISABLED : lastResolvedFileStat.etag,
                            unlock: options.writeUnlock,
                            writeElevated: options.writeElevated
                        });
                        this.handleSaveSuccess(stat, versionId, options);
                    }
                    catch (error) {
                        this.handleSaveError(error, versionId, options);
                    }
                })());
            })(), () => saveCancellation.cancel());
        }
        handleSaveSuccess(stat, versionId, options) {
            // Updated resolved stat with updated stat
            this.updateLastResolvedFileStat(stat);
            // Update dirty state unless model has changed meanwhile
            if (versionId === this.versionId) {
                this.trace(`handleSaveSuccess(${versionId}) - setting dirty to false because versionId did not change`);
                this.setDirty(false);
            }
            else {
                this.trace(`handleSaveSuccess(${versionId}) - not setting dirty to false because versionId did change meanwhile`);
            }
            // Update orphan state given save was successful
            this.setOrphaned(false);
            // Emit Save Event
            this._onDidSave.fire({ reason: options.reason, stat, source: options.source });
        }
        handleSaveError(error, versionId, options) {
            (options.ignoreErrorHandler ? this.logService.trace : this.logService.error).apply(this.logService, [`[text file model] handleSaveError(${versionId}) - exit - resulted in a save error: ${error.toString()}`, this.resource.toString()]);
            // Return early if the save() call was made asking to
            // handle the save error itself.
            if (options.ignoreErrorHandler) {
                throw error;
            }
            // In any case of an error, we mark the model as dirty to prevent data loss
            // It could be possible that the write corrupted the file on disk (e.g. when
            // an error happened after truncating the file) and as such we want to preserve
            // the model contents to prevent data loss.
            this.setDirty(true);
            // Flag as error state in the model
            this.inErrorMode = true;
            // Look out for a save conflict
            if (error.fileOperationResult === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */) {
                this.inConflictMode = true;
            }
            // Show to user
            this.textFileService.files.saveErrorHandler.onSaveError(error, this, options);
            // Emit as event
            this._onDidSaveError.fire();
        }
        updateSavedVersionId() {
            // we remember the models alternate version id to remember when the version
            // of the model matches with the saved version on disk. we need to keep this
            // in order to find out if the model changed back to a saved version (e.g.
            // when undoing long enough to reach to a version that is saved and then to
            // clear the dirty flag)
            if (this.isResolved()) {
                this.bufferSavedVersionId = this.textEditorModel.getAlternativeVersionId();
            }
        }
        updateLastResolvedFileStat(newFileStat) {
            const oldReadonly = this.isReadonly();
            // First resolve - just take
            if (!this.lastResolvedFileStat) {
                this.lastResolvedFileStat = newFileStat;
            }
            // Subsequent resolve - make sure that we only assign it if the mtime is equal or has advanced.
            // This prevents race conditions from resolving and saving. If a save comes in late after a revert
            // was called, the mtime could be out of sync.
            else if (this.lastResolvedFileStat.mtime <= newFileStat.mtime) {
                this.lastResolvedFileStat = newFileStat;
            }
            // Signal that the readonly state changed
            if (this.isReadonly() !== oldReadonly) {
                this._onDidChangeReadonly.fire();
            }
        }
        //#endregion
        hasState(state) {
            switch (state) {
                case 3 /* TextFileEditorModelState.CONFLICT */:
                    return this.inConflictMode;
                case 1 /* TextFileEditorModelState.DIRTY */:
                    return this.dirty;
                case 5 /* TextFileEditorModelState.ERROR */:
                    return this.inErrorMode;
                case 4 /* TextFileEditorModelState.ORPHAN */:
                    return this.inOrphanMode;
                case 2 /* TextFileEditorModelState.PENDING_SAVE */:
                    return this.saveSequentializer.isRunning();
                case 0 /* TextFileEditorModelState.SAVED */:
                    return !this.dirty;
            }
        }
        async joinState(state) {
            return this.saveSequentializer.running;
        }
        getLanguageId() {
            if (this.textEditorModel) {
                return this.textEditorModel.getLanguageId();
            }
            return this.preferredLanguageId;
        }
        //#region Encoding
        async onMaybeShouldChangeEncoding() {
            // This is a bit of a hack but there is a narrow case where
            // per-language configured encodings are not working:
            //
            // On startup we may not yet have all languages resolved so
            // we pick a wrong encoding. We never used to re-apply the
            // encoding when the language was then resolved, because that
            // is an operation that is will have to fetch the contents
            // again from disk.
            //
            // To mitigate this issue, when we detect the model language
            // changes, we see if there is a specific encoding configured
            // for the new language and apply it, only if the model is
            // not dirty and only if the encoding was not explicitly set.
            //
            // (see https://github.com/microsoft/vscode/issues/127936)
            if (this.hasEncodingSetExplicitly) {
                this.trace('onMaybeShouldChangeEncoding() - ignoring because encoding was set explicitly');
                return; // never change the user's choice of encoding
            }
            if (this.contentEncoding === encoding_1.UTF8_with_bom || this.contentEncoding === encoding_1.UTF16be || this.contentEncoding === encoding_1.UTF16le) {
                this.trace('onMaybeShouldChangeEncoding() - ignoring because content encoding has a BOM');
                return; // never change an encoding that we can detect 100% via BOMs
            }
            const { encoding } = await this.textFileService.encoding.getPreferredReadEncoding(this.resource);
            if (typeof encoding !== 'string' || !this.isNewEncoding(encoding)) {
                this.trace(`onMaybeShouldChangeEncoding() - ignoring because preferred encoding ${encoding} is not new`);
                return; // return early if encoding is invalid or did not change
            }
            if (this.isDirty()) {
                this.trace('onMaybeShouldChangeEncoding() - ignoring because model is dirty');
                return; // return early to prevent accident saves in this case
            }
            this.logService.info(`Adjusting encoding based on configured language override to '${encoding}' for ${this.resource.toString(true)}.`);
            // Re-open with new encoding
            return this.setEncodingInternal(encoding, 1 /* EncodingMode.Decode */);
        }
        setEncoding(encoding, mode) {
            // Remember that an explicit encoding was set
            this.hasEncodingSetExplicitly = true;
            return this.setEncodingInternal(encoding, mode);
        }
        async setEncodingInternal(encoding, mode) {
            // Encode: Save with encoding
            if (mode === 0 /* EncodingMode.Encode */) {
                this.updatePreferredEncoding(encoding);
                // Save
                if (!this.isDirty()) {
                    this.versionId++; // needs to increment because we change the model potentially
                    this.setDirty(true);
                }
                if (!this.inConflictMode) {
                    await this.save({ source: TextFileEditorModel_1.TEXTFILE_SAVE_ENCODING_SOURCE });
                }
            }
            // Decode: Resolve with encoding
            else {
                if (!this.isNewEncoding(encoding)) {
                    return; // return early if the encoding is already the same
                }
                if (this.isDirty() && !this.inConflictMode) {
                    await this.save();
                }
                this.updatePreferredEncoding(encoding);
                await this.forceResolveFromFile();
            }
        }
        updatePreferredEncoding(encoding) {
            if (!this.isNewEncoding(encoding)) {
                return;
            }
            this.preferredEncoding = encoding;
            // Emit
            this._onDidChangeEncoding.fire();
        }
        isNewEncoding(encoding) {
            if (this.preferredEncoding === encoding) {
                return false; // return early if the encoding is already the same
            }
            if (!this.preferredEncoding && this.contentEncoding === encoding) {
                return false; // also return if we don't have a preferred encoding but the content encoding is already the same
            }
            return true;
        }
        getEncoding() {
            return this.preferredEncoding || this.contentEncoding;
        }
        //#endregion
        trace(msg) {
            this.logService.trace(`[text file model] ${msg}`, this.resource.toString());
        }
        isResolved() {
            return !!this.textEditorModel;
        }
        isReadonly() {
            return this.filesConfigurationService.isReadonly(this.resource, this.lastResolvedFileStat);
        }
        dispose() {
            this.trace('dispose()');
            this.inConflictMode = false;
            this.inOrphanMode = false;
            this.inErrorMode = false;
            super.dispose();
        }
    };
    exports.TextFileEditorModel = TextFileEditorModel;
    exports.TextFileEditorModel = TextFileEditorModel = TextFileEditorModel_1 = __decorate([
        __param(3, language_1.ILanguageService),
        __param(4, model_1.IModelService),
        __param(5, files_1.IFileService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(8, log_1.ILogService),
        __param(9, workingCopyService_1.IWorkingCopyService),
        __param(10, filesConfigurationService_1.IFilesConfigurationService),
        __param(11, label_1.ILabelService),
        __param(12, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(13, accessibility_1.IAccessibilityService),
        __param(14, pathService_1.IPathService),
        __param(15, extensions_1.IExtensionService)
    ], TextFileEditorModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVFZGl0b3JNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RleHRmaWxlL2NvbW1vbi90ZXh0RmlsZUVkaXRvck1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5Q2hHOztPQUVHO0lBQ0ksSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxxQ0FBbUI7O2lCQUVuQyxrQ0FBNkIsR0FBRywyQkFBa0IsQ0FBQyxjQUFjLENBQUMseUJBQXlCLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsdUJBQXVCLENBQUMsQ0FBQyxBQUEzSCxDQUE0SDtpQkFnRHpKLDZEQUF3RCxHQUFHLEdBQUcsQUFBTixDQUFPO1FBWXZGLFlBQ1UsUUFBYSxFQUNkLGlCQUFxQyxFQUFHLGlDQUFpQztRQUN6RSxtQkFBdUMsRUFDN0IsZUFBaUMsRUFDcEMsWUFBMkIsRUFDNUIsV0FBMEMsRUFDdEMsZUFBa0QsRUFDekMsd0JBQW9FLEVBQ2xGLFVBQXdDLEVBQ2hDLGtCQUF3RCxFQUNqRCx5QkFBc0UsRUFDbkYsWUFBNEMsRUFDaEMsd0JBQW1ELEVBQ3ZELG9CQUEyQyxFQUNwRCxXQUEwQyxFQUNyQyxnQkFBb0Q7WUFFdkUsS0FBSyxDQUFDLFlBQVksRUFBRSxlQUFlLEVBQUUsd0JBQXdCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQWpCNUUsYUFBUSxHQUFSLFFBQVEsQ0FBSztZQUNkLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDckMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFvQjtZQUdoQixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNyQixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDeEIsNkJBQXdCLEdBQXhCLHdCQUF3QixD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