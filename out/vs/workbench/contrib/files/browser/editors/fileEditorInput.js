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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/common/editor/binaryEditorModel", "vs/platform/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/editor/common/services/resolverService", "vs/workbench/contrib/files/common/files", "vs/platform/label/common/label", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/editor/common/editorService", "vs/base/common/resources", "vs/base/common/event", "vs/base/common/network", "vs/editor/common/model/textModel", "vs/workbench/services/path/common/pathService", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/customEditorLabelService"], function (require, exports, editor_1, textResourceEditorInput_1, binaryEditorModel_1, files_1, textfiles_1, instantiation_1, lifecycle_1, resolverService_1, files_2, label_1, filesConfigurationService_1, editorService_1, resources_1, event_1, network_1, textModel_1, pathService_1, textResourceConfiguration_1, customEditorLabelService_1) {
    "use strict";
    var FileEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileEditorInput = void 0;
    var ForceOpenAs;
    (function (ForceOpenAs) {
        ForceOpenAs[ForceOpenAs["None"] = 0] = "None";
        ForceOpenAs[ForceOpenAs["Text"] = 1] = "Text";
        ForceOpenAs[ForceOpenAs["Binary"] = 2] = "Binary";
    })(ForceOpenAs || (ForceOpenAs = {}));
    /**
     * A file editor input is the input type for the file editor of file system resources.
     */
    let FileEditorInput = FileEditorInput_1 = class FileEditorInput extends textResourceEditorInput_1.AbstractTextResourceEditorInput {
        get typeId() {
            return files_2.FILE_EDITOR_INPUT_ID;
        }
        get editorId() {
            return editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
        }
        get capabilities() {
            let capabilities = 32 /* EditorInputCapabilities.CanSplitInGroup */;
            if (this.model) {
                if (this.model.isReadonly()) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            else {
                if (this.fileService.hasProvider(this.resource)) {
                    if (this.filesConfigurationService.isReadonly(this.resource)) {
                        capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                    }
                }
                else {
                    capabilities |= 4 /* EditorInputCapabilities.Untitled */;
                }
            }
            if (!(capabilities & 2 /* EditorInputCapabilities.Readonly */)) {
                capabilities |= 128 /* EditorInputCapabilities.CanDropIntoEditor */;
            }
            return capabilities;
        }
        constructor(resource, preferredResource, preferredName, preferredDescription, preferredEncoding, preferredLanguageId, preferredContents, instantiationService, textFileService, textModelService, labelService, fileService, filesConfigurationService, editorService, pathService, textResourceConfigurationService, customEditorLabelService) {
            super(resource, preferredResource, editorService, textFileService, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService);
            this.instantiationService = instantiationService;
            this.textModelService = textModelService;
            this.pathService = pathService;
            this.forceOpenAs = 0 /* ForceOpenAs.None */;
            this.model = undefined;
            this.cachedTextFileModelReference = undefined;
            this.modelListeners = this._register(new lifecycle_1.DisposableStore());
            this.model = this.textFileService.files.get(resource);
            if (preferredName) {
                this.setPreferredName(preferredName);
            }
            if (preferredDescription) {
                this.setPreferredDescription(preferredDescription);
            }
            if (preferredEncoding) {
                this.setPreferredEncoding(preferredEncoding);
            }
            if (preferredLanguageId) {
                this.setPreferredLanguageId(preferredLanguageId);
            }
            if (typeof preferredContents === 'string') {
                this.setPreferredContents(preferredContents);
            }
            // Attach to model that matches our resource once created
            this._register(this.textFileService.files.onDidCreate(model => this.onDidCreateTextFileModel(model)));
            // If a file model already exists, make sure to wire it in
            if (this.model) {
                this.registerModelListeners(this.model);
            }
        }
        onDidCreateTextFileModel(model) {
            // Once the text file model is created, we keep it inside
            // the input to be able to implement some methods properly
            if ((0, resources_1.isEqual)(model.resource, this.resource)) {
                this.model = model;
                this.registerModelListeners(model);
            }
        }
        registerModelListeners(model) {
            // Clear any old
            this.modelListeners.clear();
            // re-emit some events from the model
            this.modelListeners.add(model.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            this.modelListeners.add(model.onDidChangeReadonly(() => this._onDidChangeCapabilities.fire()));
            // important: treat save errors as potential dirty change because
            // a file that is in save conflict or error will report dirty even
            // if auto save is turned on.
            this.modelListeners.add(model.onDidSaveError(() => this._onDidChangeDirty.fire()));
            // remove model association once it gets disposed
            this.modelListeners.add(event_1.Event.once(model.onWillDispose)(() => {
                this.modelListeners.clear();
                this.model = undefined;
            }));
        }
        getName() {
            return this.preferredName || super.getName();
        }
        setPreferredName(name) {
            if (!this.allowLabelOverride()) {
                return; // block for specific schemes we consider to be owning
            }
            if (this.preferredName !== name) {
                this.preferredName = name;
                this._onDidChangeLabel.fire();
            }
        }
        allowLabelOverride() {
            return this.resource.scheme !== this.pathService.defaultUriScheme &&
                this.resource.scheme !== network_1.Schemas.vscodeUserData &&
                this.resource.scheme !== network_1.Schemas.file &&
                this.resource.scheme !== network_1.Schemas.vscodeRemote;
        }
        getPreferredName() {
            return this.preferredName;
        }
        isReadonly() {
            return this.model ? this.model.isReadonly() : this.filesConfigurationService.isReadonly(this.resource);
        }
        getDescription(verbosity) {
            return this.preferredDescription || super.getDescription(verbosity);
        }
        setPreferredDescription(description) {
            if (!this.allowLabelOverride()) {
                return; // block for specific schemes we consider to be owning
            }
            if (this.preferredDescription !== description) {
                this.preferredDescription = description;
                this._onDidChangeLabel.fire();
            }
        }
        getPreferredDescription() {
            return this.preferredDescription;
        }
        getTitle(verbosity) {
            let title = super.getTitle(verbosity);
            const preferredTitle = this.getPreferredTitle();
            if (preferredTitle) {
                title = `${preferredTitle} (${title})`;
            }
            return title;
        }
        getPreferredTitle() {
            if (this.preferredName && this.preferredDescription) {
                return `${this.preferredName} ${this.preferredDescription}`;
            }
            if (this.preferredName || this.preferredDescription) {
                return this.preferredName ?? this.preferredDescription;
            }
            return undefined;
        }
        getEncoding() {
            if (this.model) {
                return this.model.getEncoding();
            }
            return this.preferredEncoding;
        }
        getPreferredEncoding() {
            return this.preferredEncoding;
        }
        async setEncoding(encoding, mode) {
            this.setPreferredEncoding(encoding);
            return this.model?.setEncoding(encoding, mode);
        }
        setPreferredEncoding(encoding) {
            this.preferredEncoding = encoding;
            // encoding is a good hint to open the file as text
            this.setForceOpenAsText();
        }
        getLanguageId() {
            if (this.model) {
                return this.model.getLanguageId();
            }
            return this.preferredLanguageId;
        }
        getPreferredLanguageId() {
            return this.preferredLanguageId;
        }
        setLanguageId(languageId, source) {
            this.setPreferredLanguageId(languageId);
            this.model?.setLanguageId(languageId, source);
        }
        setPreferredLanguageId(languageId) {
            this.preferredLanguageId = languageId;
            // languages are a good hint to open the file as text
            this.setForceOpenAsText();
        }
        setPreferredContents(contents) {
            this.preferredContents = contents;
            // contents is a good hint to open the file as text
            this.setForceOpenAsText();
        }
        setForceOpenAsText() {
            this.forceOpenAs = 1 /* ForceOpenAs.Text */;
        }
        setForceOpenAsBinary() {
            this.forceOpenAs = 2 /* ForceOpenAs.Binary */;
        }
        isDirty() {
            return !!(this.model?.isDirty());
        }
        isSaving() {
            if (this.model?.hasState(0 /* TextFileEditorModelState.SAVED */) || this.model?.hasState(3 /* TextFileEditorModelState.CONFLICT */) || this.model?.hasState(5 /* TextFileEditorModelState.ERROR */)) {
                return false; // require the model to be dirty and not in conflict or error state
            }
            // Note: currently not checking for ModelState.PENDING_SAVE for a reason
            // because we currently miss an event for this state change on editors
            // and it could result in bad UX where an editor can be closed even though
            // it shows up as dirty and has not finished saving yet.
            if (this.filesConfigurationService.hasShortAutoSaveDelay(this)) {
                return true; // a short auto save is configured, treat this as being saved
            }
            return super.isSaving();
        }
        prefersEditorPane(editorPanes) {
            if (this.forceOpenAs === 2 /* ForceOpenAs.Binary */) {
                return editorPanes.find(editorPane => editorPane.typeId === files_2.BINARY_FILE_EDITOR_ID);
            }
            return editorPanes.find(editorPane => editorPane.typeId === files_2.TEXT_FILE_EDITOR_ID);
        }
        resolve(options) {
            // Resolve as binary
            if (this.forceOpenAs === 2 /* ForceOpenAs.Binary */) {
                return this.doResolveAsBinary();
            }
            // Resolve as text
            return this.doResolveAsText(options);
        }
        async doResolveAsText(options) {
            try {
                // Unset preferred contents after having applied it once
                // to prevent this property to stick. We still want future
                // `resolve` calls to fetch the contents from disk.
                const preferredContents = this.preferredContents;
                this.preferredContents = undefined;
                // Resolve resource via text file service and only allow
                // to open binary files if we are instructed so
                await this.textFileService.files.resolve(this.resource, {
                    languageId: this.preferredLanguageId,
                    encoding: this.preferredEncoding,
                    contents: typeof preferredContents === 'string' ? (0, textModel_1.createTextBufferFactory)(preferredContents) : undefined,
                    reload: { async: true }, // trigger a reload of the model if it exists already but do not wait to show the model
                    allowBinary: this.forceOpenAs === 1 /* ForceOpenAs.Text */,
                    reason: 1 /* TextFileResolveReason.EDITOR */,
                    limits: this.ensureLimits(options)
                });
                // This is a bit ugly, because we first resolve the model and then resolve a model reference. the reason being that binary
                // or very large files do not resolve to a text file model but should be opened as binary files without text. First calling into
                // resolve() ensures we are not creating model references for these kind of resources.
                // In addition we have a bit of payload to take into account (encoding, reload) that the text resolver does not handle yet.
                if (!this.cachedTextFileModelReference) {
                    this.cachedTextFileModelReference = await this.textModelService.createModelReference(this.resource);
                }
                const model = this.cachedTextFileModelReference.object;
                // It is possible that this input was disposed before the model
                // finished resolving. As such, we need to make sure to dispose
                // the model reference to not leak it.
                if (this.isDisposed()) {
                    this.disposeModelReference();
                }
                return model;
            }
            catch (error) {
                // Handle binary files with binary model
                if (error.textFileOperationResult === 0 /* TextFileOperationResult.FILE_IS_BINARY */) {
                    return this.doResolveAsBinary();
                }
                // Bubble any other error up
                throw error;
            }
        }
        async doResolveAsBinary() {
            const model = this.instantiationService.createInstance(binaryEditorModel_1.BinaryEditorModel, this.preferredResource, this.getName());
            await model.resolve();
            return model;
        }
        isResolved() {
            return !!this.model;
        }
        async rename(group, target) {
            return {
                editor: {
                    resource: target,
                    encoding: this.getEncoding(),
                    options: {
                        viewState: (0, editor_1.findViewStateForEditor)(this, group, this.editorService)
                    }
                }
            };
        }
        toUntyped(options) {
            const untypedInput = {
                resource: this.preferredResource,
                forceFile: true,
                options: {
                    override: this.editorId
                }
            };
            if (typeof options?.preserveViewState === 'number') {
                untypedInput.encoding = this.getEncoding();
                untypedInput.languageId = this.getLanguageId();
                untypedInput.contents = (() => {
                    const model = this.textFileService.files.get(this.resource);
                    if (model?.isDirty() && !model.textEditorModel.isTooLargeForHeapOperation()) {
                        return model.textEditorModel.getValue(); // only if dirty and not too large
                    }
                    return undefined;
                })();
                untypedInput.options = {
                    ...untypedInput.options,
                    viewState: (0, editor_1.findViewStateForEditor)(this, options.preserveViewState, this.editorService)
                };
            }
            return untypedInput;
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if (otherInput instanceof FileEditorInput_1) {
                return (0, resources_1.isEqual)(otherInput.resource, this.resource);
            }
            if ((0, editor_1.isResourceEditorInput)(otherInput)) {
                return super.matches(otherInput);
            }
            return false;
        }
        dispose() {
            // Model
            this.model = undefined;
            // Model reference
            this.disposeModelReference();
            super.dispose();
        }
        disposeModelReference() {
            (0, lifecycle_1.dispose)(this.cachedTextFileModelReference);
            this.cachedTextFileModelReference = undefined;
        }
    };
    exports.FileEditorInput = FileEditorInput;
    exports.FileEditorInput = FileEditorInput = FileEditorInput_1 = __decorate([
        __param(7, instantiation_1.IInstantiationService),
        __param(8, textfiles_1.ITextFileService),
        __param(9, resolverService_1.ITextModelService),
        __param(10, label_1.ILabelService),
        __param(11, files_1.IFileService),
        __param(12, filesConfigurationService_1.IFilesConfigurationService),
        __param(13, editorService_1.IEditorService),
        __param(14, pathService_1.IPathService),
        __param(15, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(16, customEditorLabelService_1.ICustomEditorLabelService)
    ], FileEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUVkaXRvcklucHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9icm93c2VyL2VkaXRvcnMvZmlsZUVkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEwQmhHLElBQVcsV0FJVjtJQUpELFdBQVcsV0FBVztRQUNyQiw2Q0FBSSxDQUFBO1FBQ0osNkNBQUksQ0FBQTtRQUNKLGlEQUFNLENBQUE7SUFDUCxDQUFDLEVBSlUsV0FBVyxLQUFYLFdBQVcsUUFJckI7SUFFRDs7T0FFRztJQUNJLElBQU0sZUFBZSx1QkFBckIsTUFBTSxlQUFnQixTQUFRLHlEQUErQjtRQUVuRSxJQUFhLE1BQU07WUFDbEIsT0FBTyw0QkFBb0IsQ0FBQztRQUM3QixDQUFDO1FBRUQsSUFBYSxRQUFRO1lBQ3BCLE9BQU8sbUNBQTBCLENBQUMsRUFBRSxDQUFDO1FBQ3RDLENBQUM7UUFFRCxJQUFhLFlBQVk7WUFDeEIsSUFBSSxZQUFZLG1EQUEwQyxDQUFDO1lBRTNELElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztvQkFDN0IsWUFBWSw0Q0FBb0MsQ0FBQztnQkFDbEQsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUNqRCxJQUFJLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7d0JBQzlELFlBQVksNENBQW9DLENBQUM7b0JBQ2xELENBQUM7Z0JBQ0YsQ0FB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