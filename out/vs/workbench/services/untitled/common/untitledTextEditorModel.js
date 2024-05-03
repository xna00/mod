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
define(["require", "exports", "vs/workbench/common/editor/textEditorModel", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/base/common/event", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/editor/common/services/textResourceConfiguration", "vs/editor/common/model/textModel", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/workingCopy/common/workingCopy", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/types", "vs/platform/label/common/label", "vs/editor/common/core/wordHelper", "vs/workbench/services/editor/common/editorService", "vs/base/common/strings", "vs/workbench/services/textfile/common/encoding", "vs/base/common/buffer", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/platform/accessibility/common/accessibility"], function (require, exports, textEditorModel_1, language_1, model_1, event_1, workingCopyBackup_1, textResourceConfiguration_1, textModel_1, workingCopyService_1, workingCopy_1, textfiles_1, types_1, label_1, wordHelper_1, editorService_1, strings_1, encoding_1, buffer_1, languageDetectionWorkerService_1, accessibility_1) {
    "use strict";
    var UntitledTextEditorModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledTextEditorModel = void 0;
    let UntitledTextEditorModel = class UntitledTextEditorModel extends textEditorModel_1.BaseTextEditorModel {
        static { UntitledTextEditorModel_1 = this; }
        static { this.FIRST_LINE_NAME_MAX_LENGTH = 40; }
        static { this.FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH = UntitledTextEditorModel_1.FIRST_LINE_NAME_MAX_LENGTH * 10; }
        // Support the special '${activeEditorLanguage}' language by
        // looking up the language id from the editor that is active
        // before the untitled editor opens. This special id is only
        // used for the initial language and can be changed after the
        // fact (either manually or through auto-detection).
        static { this.ACTIVE_EDITOR_LANGUAGE_ID = '${activeEditorLanguage}'; }
        get name() {
            // Take name from first line if present and only if
            // we have no associated file path. In that case we
            // prefer the file name as title.
            if (this.configuredLabelFormat === 'content' && !this.hasAssociatedFilePath && this.cachedModelFirstLineWords) {
                return this.cachedModelFirstLineWords;
            }
            // Otherwise fallback to resource
            return this.labelService.getUriBasenameLabel(this.resource);
        }
        //#endregion
        constructor(resource, hasAssociatedFilePath, initialValue, preferredLanguageId, preferredEncoding, languageService, modelService, workingCopyBackupService, textResourceConfigurationService, workingCopyService, textFileService, labelService, editorService, languageDetectionService, accessibilityService) {
            super(modelService, languageService, languageDetectionService, accessibilityService);
            this.resource = resource;
            this.hasAssociatedFilePath = hasAssociatedFilePath;
            this.initialValue = initialValue;
            this.preferredLanguageId = preferredLanguageId;
            this.preferredEncoding = preferredEncoding;
            this.workingCopyBackupService = workingCopyBackupService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.workingCopyService = workingCopyService;
            this.textFileService = textFileService;
            this.labelService = labelService;
            this.editorService = editorService;
            //#region Events
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeName = this._register(new event_1.Emitter());
            this.onDidChangeName = this._onDidChangeName.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeEncoding = this._register(new event_1.Emitter());
            this.onDidChangeEncoding = this._onDidChangeEncoding.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidRevert = this._register(new event_1.Emitter());
            this.onDidRevert = this._onDidRevert.event;
            //#endregion
            this.typeId = workingCopy_1.NO_TYPE_ID; // IMPORTANT: never change this to not break existing assumptions (e.g. backups)
            this.capabilities = 2 /* WorkingCopyCapabilities.Untitled */;
            //#region Name
            this.configuredLabelFormat = 'content';
            this.cachedModelFirstLineWords = undefined;
            //#endregion
            //#region Dirty
            this.dirty = this.hasAssociatedFilePath || !!this.initialValue;
            //#endregion
            //#region Resolve
            this.ignoreDirtyOnModelContentChange = false;
            // Make known to working copy service
            this._register(this.workingCopyService.registerWorkingCopy(this));
            // This is typically controlled by the setting `files.defaultLanguage`.
            // If that setting is set, we should not detect the language.
            if (preferredLanguageId) {
                this.setLanguageId(preferredLanguageId);
            }
            // Fetch config
            this.onConfigurationChange(undefined, false);
            this.registerListeners();
        }
        registerListeners() {
            // Config Changes
            this._register(this.textResourceConfigurationService.onDidChangeConfiguration(e => this.onConfigurationChange(e, true)));
        }
        onConfigurationChange(e, fromEvent) {
            // Encoding
            if (!e || e.affectsConfiguration(this.resource, 'files.encoding')) {
                const configuredEncoding = this.textResourceConfigurationService.getValue(this.resource, 'files.encoding');
                if (this.configuredEncoding !== configuredEncoding && typeof configuredEncoding === 'string') {
                    this.configuredEncoding = configuredEncoding;
                    if (fromEvent && !this.preferredEncoding) {
                        this._onDidChangeEncoding.fire(); // do not fire event if we have a preferred encoding set
                    }
                }
            }
            // Label Format
            if (!e || e.affectsConfiguration(this.resource, 'workbench.editor.untitled.labelFormat')) {
                const configuredLabelFormat = this.textResourceConfigurationService.getValue(this.resource, 'workbench.editor.untitled.labelFormat');
                if (this.configuredLabelFormat !== configuredLabelFormat && (configuredLabelFormat === 'content' || configuredLabelFormat === 'name')) {
                    this.configuredLabelFormat = configuredLabelFormat;
                    if (fromEvent) {
                        this._onDidChangeName.fire();
                    }
                }
            }
        }
        //#region Language
        setLanguageId(languageId, source) {
            const actualLanguage = languageId === UntitledTextEditorModel_1.ACTIVE_EDITOR_LANGUAGE_ID
                ? this.editorService.activeTextEditorLanguageId
                : languageId;
            this.preferredLanguageId = actualLanguage;
            if (actualLanguage) {
                super.setLanguageId(actualLanguage, source);
            }
        }
        getLanguageId() {
            if (this.textEditorModel) {
                return this.textEditorModel.getLanguageId();
            }
            return this.preferredLanguageId;
        }
        getEncoding() {
            return this.preferredEncoding || this.configuredEncoding;
        }
        async setEncoding(encoding) {
            const oldEncoding = this.getEncoding();
            this.preferredEncoding = encoding;
            // Emit if it changed
            if (oldEncoding !== this.preferredEncoding) {
                this._onDidChangeEncoding.fire();
            }
        }
        isDirty() {
            return this.dirty;
        }
        isModified() {
            return this.isDirty();
        }
        setDirty(dirty) {
            if (this.dirty === dirty) {
                return;
            }
            this.dirty = dirty;
            this._onDidChangeDirty.fire();
        }
        //#endregion
        //#region Save / Revert / Backup
        async save(options) {
            const target = await this.textFileService.save(this.resource, options);
            // Emit as event
            if (target) {
                this._onDidSave.fire({ reason: options?.reason, source: options?.source });
            }
            return !!target;
        }
        async revert() {
            // Reset contents to be empty
            this.ignoreDirtyOnModelContentChange = true;
            try {
                this.updateTextEditorModel((0, textModel_1.createTextBufferFactory)(''));
            }
            finally {
                this.ignoreDirtyOnModelContentChange = false;
            }
            // No longer dirty
            this.setDirty(false);
            // Emit as event
            this._onDidRevert.fire();
        }
        async backup(token) {
            let content = undefined;
            // Make sure to check whether this model has been resolved
            // or not and fallback to the initial value - if any - to
            // prevent backing up an unresolved model and loosing the
            // initial value.
            if (this.isResolved()) {
                // Fill in content the same way we would do when saving the file
                // via the text file service encoding support (hardcode UTF-8)
                content = await this.textFileService.getEncodedReadable(this.resource, this.createSnapshot() ?? undefined, { encoding: encoding_1.UTF8 });
            }
            else if (typeof this.initialValue === 'string') {
                content = (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(this.initialValue));
            }
            return { content };
        }
        async resolve() {
            // Create text editor model if not yet done
            let createdUntitledModel = false;
            let hasBackup = false;
            if (!this.textEditorModel) {
                let untitledContents;
                // Check for backups or use initial value or empty
                const backup = await this.workingCopyBackupService.resolve(this);
                if (backup) {
                    untitledContents = backup.value;
                    hasBackup = true;
                }
                else {
                    untitledContents = (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(this.initialValue || ''));
                }
                // Determine untitled contents based on backup
                // or initial value. We must use text file service
                // to create the text factory to respect encodings
                // accordingly.
                const untitledContentsFactory = await (0, textModel_1.createTextBufferFactoryFromStream)(await this.textFileService.getDecodedStream(this.resource, untitledContents, { encoding: encoding_1.UTF8 }));
                this.createTextEditorModel(untitledContentsFactory, this.resource, this.preferredLanguageId);
                createdUntitledModel = true;
            }
            // Otherwise: the untitled model already exists and we must assume
            // that the value of the model was changed by the user. As such we
            // do not update the contents, only the language if configured.
            else {
                this.updateTextEditorModel(undefined, this.preferredLanguageId);
            }
            // Listen to text model events
            const textEditorModel = (0, types_1.assertIsDefined)(this.textEditorModel);
            this.installModelListeners(textEditorModel);
            // Only adjust name and dirty state etc. if we
            // actually created the untitled model
            if (createdUntitledModel) {
                // Name
                if (hasBackup || this.initialValue) {
                    this.updateNameFromFirstLine(textEditorModel);
                }
                // Untitled associated to file path are dirty right away as well as untitled with content
                this.setDirty(this.hasAssociatedFilePath || !!hasBackup || !!this.initialValue);
                // If we have initial contents, make sure to emit this
                // as the appropiate events to the outside.
                if (hasBackup || this.initialValue) {
                    this._onDidChangeContent.fire();
                }
            }
            return super.resolve();
        }
        installModelListeners(model) {
            this._register(model.onDidChangeContent(e => this.onModelContentChanged(model, e)));
            this._register(model.onDidChangeLanguage(() => this.onConfigurationChange(undefined, true))); // language change can have impact on config
            super.installModelListeners(model);
        }
        onModelContentChanged(textEditorModel, e) {
            if (!this.ignoreDirtyOnModelContentChange) {
                // mark the untitled text editor as non-dirty once its content becomes empty and we do
                // not have an associated path set. we never want dirty indicator in that case.
                if (!this.hasAssociatedFilePath && textEditorModel.getLineCount() === 1 && textEditorModel.getLineLength(1) === 0) {
                    this.setDirty(false);
                }
                // turn dirty otherwise
                else {
                    this.setDirty(true);
                }
            }
            // Check for name change if first line changed in the range of 0-FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH columns
            if (e.changes.some(change => (change.range.startLineNumber === 1 || change.range.endLineNumber === 1) && change.range.startColumn <= UntitledTextEditorModel_1.FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH)) {
                this.updateNameFromFirstLine(textEditorModel);
            }
            // Emit as general content change event
            this._onDidChangeContent.fire();
            // Detect language from content
            this.autoDetectLanguage();
        }
        updateNameFromFirstLine(textEditorModel) {
            if (this.hasAssociatedFilePath) {
                return; // not in case of an associated file path
            }
            // Determine the first words of the model following these rules:
            // - cannot be only whitespace (so we trim())
            // - cannot be only non-alphanumeric characters (so we run word definition regex over it)
            // - cannot be longer than FIRST_LINE_MAX_TITLE_LENGTH
            // - normalize multiple whitespaces to a single whitespace
            let modelFirstWordsCandidate = undefined;
            let firstLineText = textEditorModel
                .getValueInRange({
                startLineNumber: 1,
                endLineNumber: 1,
                startColumn: 1,
                endColumn: UntitledTextEditorModel_1.FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH + 1 // first cap at FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH
            })
                .trim().replace(/\s+/g, ' ') // normalize whitespaces
                .replace(/\u202E/g, ''); // drop Right-to-Left Override character (#190133)
            firstLineText = firstLineText.substr(0, (0, strings_1.getCharContainingOffset)(// finally cap at FIRST_LINE_NAME_MAX_LENGTH (grapheme aware #111235)
            firstLineText, UntitledTextEditorModel_1.FIRST_LINE_NAME_MAX_LENGTH)[0]);
            if (firstLineText && (0, wordHelper_1.ensureValidWordDefinition)().exec(firstLineText)) {
                modelFirstWordsCandidate = firstLineText;
            }
            if (modelFirstWordsCandidate !== this.cachedModelFirstLineWords) {
                this.cachedModelFirstLineWords = modelFirstWordsCandidate;
                this._onDidChangeName.fire();
            }
        }
        //#endregion
        isReadonly() {
            return false;
        }
    };
    exports.UntitledTextEditorModel = UntitledTextEditorModel;
    exports.UntitledTextEditorModel = UntitledTextEditorModel = UntitledTextEditorModel_1 = __decorate([
        __param(5, language_1.ILanguageService),
        __param(6, model_1.IModelService),
        __param(7, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(8, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(9, workingCopyService_1.IWorkingCopyService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, label_1.ILabelService),
        __param(12, editorService_1.IEditorService),
        __param(13, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(14, accessibility_1.IAccessibilityService)
    ], UntitledTextEditorModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW50aXRsZWRUZXh0RWRpdG9yTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91bnRpdGxlZC9jb21tb24vdW50aXRsZWRUZXh0RWRpdG9yTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWtFekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxxQ0FBbUI7O2lCQUV2QywrQkFBMEIsR0FBRyxFQUFFLEFBQUwsQ0FBTTtpQkFDaEMseUNBQW9DLEdBQUcseUJBQXVCLENBQUMsMEJBQTBCLEdBQUcsRUFBRSxBQUExRCxDQUEyRDtRQUV2SCw0REFBNEQ7UUFDNUQsNERBQTREO1FBQzVELDREQUE0RDtRQUM1RCw2REFBNkQ7UUFDN0Qsb0RBQW9EO2lCQUM1Qiw4QkFBeUIsR0FBRyx5QkFBeUIsQUFBNUIsQ0FBNkI7UUFpQzlFLElBQUksSUFBSTtZQUVQLG1EQUFtRDtZQUNuRCxtREFBbUQ7WUFDbkQsaUNBQWlDO1lBQ2pDLElBQUksSUFBSSxDQUFDLHFCQUFxQixLQUFLLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsSUFBSSxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztnQkFDL0csT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUM7WUFDdkMsQ0FBQztZQUVELGlDQUFpQztZQUNqQyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRCxZQUFZO1FBRVosWUFDVSxRQUFhLEVBQ2IscUJBQThCLEVBQ3RCLFlBQWdDLEVBQ3pDLG1CQUF1QyxFQUN2QyxpQkFBcUMsRUFDM0IsZUFBaUMsRUFDcEMsWUFBMkIsRUFDZix3QkFBb0UsRUFD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