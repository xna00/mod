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
define(["require", "exports", "vs/base/common/glob", "vs/workbench/contrib/notebook/common/notebookService", "vs/base/common/resources", "vs/platform/dialogs/common/dialogs", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/platform/label/common/label", "vs/base/common/network", "vs/platform/files/common/files", "vs/workbench/common/editor/resourceEditorInput", "vs/base/common/errors", "vs/base/common/buffer", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/extensions/common/extensions", "vs/nls", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/customEditorLabelService"], function (require, exports, glob, notebookService_1, resources_1, dialogs_1, notebookEditorModelResolverService_1, label_1, network_1, files_1, resourceEditorInput_1, errors_1, buffer_1, filesConfigurationService_1, extensions_1, nls_1, editorService_1, textResourceConfiguration_1, customEditorLabelService_1) {
    "use strict";
    var NotebookEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorInput = void 0;
    exports.isCompositeNotebookEditorInput = isCompositeNotebookEditorInput;
    exports.isNotebookEditorInput = isNotebookEditorInput;
    let NotebookEditorInput = class NotebookEditorInput extends resourceEditorInput_1.AbstractResourceEditorInput {
        static { NotebookEditorInput_1 = this; }
        static getOrCreate(instantiationService, resource, preferredResource, viewType, options = {}) {
            const editor = instantiationService.createInstance(NotebookEditorInput_1, resource, preferredResource, viewType, options);
            if (preferredResource) {
                editor.setPreferredResource(preferredResource);
            }
            return editor;
        }
        static { this.ID = 'workbench.input.notebook'; }
        constructor(resource, preferredResource, viewType, options, _notebookService, _notebookModelResolverService, _fileDialogService, labelService, fileService, filesConfigurationService, extensionService, editorService, textResourceConfigurationService, customEditorLabelService) {
            super(resource, preferredResource, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService);
            this.viewType = viewType;
            this.options = options;
            this._notebookService = _notebookService;
            this._notebookModelResolverService = _notebookModelResolverService;
            this._fileDialogService = _fileDialogService;
            this._editorModelReference = null;
            this._defaultDirtyState = false;
            this._defaultDirtyState = !!options.startDirty;
            // Automatically resolve this input when the "wanted" model comes to life via
            // some other way. This happens only once per input and resolve disposes
            // this listener
            this._sideLoadedListener = _notebookService.onDidAddNotebookDocument(e => {
                if (e.viewType === this.viewType && e.uri.toString() === this.resource.toString()) {
                    this.resolve().catch(errors_1.onUnexpectedError);
                }
            });
            this._register(extensionService.onWillStop(e => {
                if (!this.isDirty()) {
                    return;
                }
                e.veto((async () => {
                    const editors = editorService.findEditors(this);
                    if (editors.length > 0) {
                        const result = await editorService.save(editors[0]);
                        if (result.success) {
                            return false; // Don't Veto
                        }
                    }
                    return true; // Veto
                })(), (0, nls_1.localize)('vetoExtHostRestart', "Notebook '{0}' could not be saved.", this.resource.path));
            }));
        }
        dispose() {
            this._sideLoadedListener.dispose();
            this._editorModelReference?.dispose();
            this._editorModelReference = null;
            super.dispose();
        }
        get typeId() {
            return NotebookEditorInput_1.ID;
        }
        get editorId() {
            return this.viewType;
        }
        get capabilities() {
            let capabilities = 0 /* EditorInputCapabilities.None */;
            if (this.resource.scheme === network_1.Schemas.untitled) {
                capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            }
            if (this._editorModelReference) {
                if (this._editorModelReference.object.isReadonly()) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            else {
                if (this.filesConfigurationService.isReadonly(this.resource)) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            if (!(capabilities & 2 /* EditorInputCapabilities.Readonly */)) {
                capabilities |= 128 /* EditorInputCapabilities.CanDropIntoEditor */;
            }
            return capabilities;
        }
        getDescription(verbosity = 1 /* Verbosity.MEDIUM */) {
            if (!this.hasCapability(4 /* EditorInputCapabilities.Untitled */) || this._editorModelReference?.object.hasAssociatedFilePath()) {
                return super.getDescription(verbosity);
            }
            return undefined; // no description for untitled notebooks without associated file path
        }
        isReadonly() {
            if (!this._editorModelReference) {
                return this.filesConfigurationService.isReadonly(this.resource);
            }
            return this._editorModelReference.object.isReadonly();
        }
        isDirty() {
            if (!this._editorModelReference) {
                return this._defaultDirtyState;
            }
            return this._editorModelReference.object.isDirty();
        }
        isSaving() {
            const model = this._editorModelReference?.object;
            if (!model || !model.isDirty() || model.hasErrorState || this.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                return false; // require the model to be dirty, file-backed and not in an error state
            }
            // if a short auto save is configured, treat this as being saved
            return this.filesConfigurationService.hasShortAutoSaveDelay(this);
        }
        async save(group, options) {
            if (this._editorModelReference) {
                if (this.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                    return this.saveAs(group, options);
                }
                else {
                    await this._editorModelReference.object.save(options);
                }
                return this;
            }
            return undefined;
        }
        async saveAs(group, options) {
            if (!this._editorModelReference) {
                return undefined;
            }
            const provider = this._notebookService.getContributedNotebookType(this.viewType);
            if (!provider) {
                return undefined;
            }
            const pathCandidate = this.hasCapability(4 /* EditorInputCapabilities.Untitled */) ? await this._suggestName(provider, this.labelService.getUriBasenameLabel(this.resource)) : this._editorModelReference.object.resource;
            let target;
            if (this._editorModelReference.object.hasAssociatedFilePath()) {
                target = pathCandidate;
            }
            else {
                target = await this._fileDialogService.pickFileToSave(pathCandidate, options?.availableFileSystems);
                if (!target) {
                    return undefined; // save cancelled
                }
            }
            if (!provider.matches(target)) {
                const patterns = provider.selectors.map(pattern => {
                    if (typeof pattern === 'string') {
                        return pattern;
                    }
                    if (glob.isRelativePattern(pattern)) {
                        return `${pattern} (base ${pattern.base})`;
                    }
                    if (pattern.exclude) {
                        return `${pattern.include} (exclude: ${pattern.exclude})`;
                    }
                    else {
                        return `${pattern.include}`;
                    }
                }).join(', ');
                throw new Error(`File name ${target} is not supported by ${provider.providerDisplayName}.\n\nPlease make sure the file name matches following patterns:\n${patterns}`);
            }
            return await this._editorModelReference.object.saveAs(target);
        }
        async _suggestName(provider, suggestedFilename) {
            // guess file extensions
            const firstSelector = provider.selectors[0];
            let selectorStr = firstSelector && typeof firstSelector === 'string' ? firstSelector : undefined;
            if (!selectorStr && firstSelector) {
                const include = firstSelector.include;
                if (typeof include === 'string') {
                    selectorStr = include;
                }
            }
            if (selectorStr) {
                const matches = /^\*\.([A-Za-z_-]*)$/.exec(selectorStr);
                if (matches && matches.length > 1) {
                    const fileExt = matches[1];
                    if (!suggestedFilename.endsWith(fileExt)) {
                        return (0, resources_1.joinPath)(await this._fileDialogService.defaultFilePath(), suggestedFilename + '.' + fileExt);
                    }
                }
            }
            return (0, resources_1.joinPath)(await this._fileDialogService.defaultFilePath(), suggestedFilename);
        }
        // called when users rename a notebook document
        async rename(group, target) {
            if (this._editorModelReference) {
                return { editor: { resource: target }, options: { override: this.viewType } };
            }
            return undefined;
        }
        async revert(_group, options) {
            if (this._editorModelReference && this._editorModelReference.object.isDirty()) {
                await this._editorModelReference.object.revert(options);
            }
        }
        async resolve(_options, perf) {
            if (!await this._notebookService.canResolve(this.viewType)) {
                return null;
            }
            perf?.mark('extensionActivated');
            // we are now loading the notebook and don't need to listen to
            // "other" loading anymore
            this._sideLoadedListener.dispose();
            if (!this._editorModelReference) {
                const ref = await this._notebookModelResolverService.resolve(this.resource, this.viewType, this.ensureLimits(_options));
                if (this._editorModelReference) {
                    // Re-entrant, double resolve happened. Dispose the addition references and proceed
                    // with the truth.
                    ref.dispose();
                    return this._editorModelReference.object;
                }
                this._editorModelReference = ref;
                if (this.isDisposed()) {
                    this._editorModelReference.dispose();
                    this._editorModelReference = null;
                    return null;
                }
                this._register(this._editorModelReference.object.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
                this._register(this._editorModelReference.object.onDidChangeReadonly(() => this._onDidChangeCapabilities.fire()));
                this._register(this._editorModelReference.object.onDidRevertUntitled(() => this.dispose()));
                if (this._editorModelReference.object.isDirty()) {
                    this._onDidChangeDirty.fire();
                }
            }
            else {
                this._editorModelReference.object.load({ limits: this.ensureLimits(_options) });
            }
            if (this.options._backupId) {
                const info = await this._notebookService.withNotebookDataProvider(this._editorModelReference.object.notebook.viewType);
                if (!(info instanceof notebookService_1.SimpleNotebookProviderInfo)) {
                    throw new Error('CANNOT open file notebook with this provider');
                }
                const data = await info.serializer.dataToNotebook(buffer_1.VSBuffer.fromString(JSON.stringify({ __webview_backup: this.options._backupId })));
                this._editorModelReference.object.notebook.applyEdits([
                    {
                        editType: 1 /* CellEditType.Replace */,
                        index: 0,
                        count: this._editorModelReference.object.notebook.length,
                        cells: data.cells
                    }
                ], true, undefined, () => undefined, undefined, false);
                if (this.options._workingCopy) {
                    this.options._backupId = undefined;
                    this.options._workingCopy = undefined;
                    this.options.startDirty = undefined;
                }
            }
            return this._editorModelReference.object;
        }
        toUntyped() {
            return {
                resource: this.resource,
                options: {
                    override: this.viewType
                }
            };
        }
        matches(otherInput) {
            if (super.matches(otherInput)) {
                return true;
            }
            if (otherInput instanceof NotebookEditorInput_1) {
                return this.viewType === otherInput.viewType && (0, resources_1.isEqual)(this.resource, otherInput.resource);
            }
            return false;
        }
    };
    exports.NotebookEditorInput = NotebookEditorInput;
    exports.NotebookEditorInput = NotebookEditorInput = NotebookEditorInput_1 = __decorate([
        __param(4, notebookService_1.INotebookService),
        __param(5, notebookEditorModelResolverService_1.INotebookEditorModelResolverService),
        __param(6, dialogs_1.IFileDialogService),
        __param(7, label_1.ILabelService),
        __param(8, files_1.IFileService),
        __param(9, filesConfigurationService_1.IFilesConfigurationService),
        __param(10, extensions_1.IExtensionService),
        __param(11, editorService_1.IEditorService),
        __param(12, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(13, customEditorLabelService_1.ICustomEditorLabelService)
    ], NotebookEditorInput);
    function isCompositeNotebookEditorInput(thing) {
        return !!thing
            && typeof thing === 'object'
            && Array.isArray(thing.editorInputs)
            && (thing.editorInputs.every(input => input instanceof NotebookEditorInput));
    }
    function isNotebookEditorInput(thing) {
        return !!thing
            && typeof thing === 'object'
            && thing instanceof NotebookEditorInput;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svY29tbW9uL25vdGVib29rRWRpdG9ySW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFXaEcsd0VBS0M7SUFFRCxzREFJQztJQXhVTSxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLGlEQUEyQjs7UUFFbkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBMkMsRUFBRSxRQUFhLEVBQUUsaUJBQWtDLEVBQUUsUUFBZ0IsRUFBRSxVQUFzQyxFQUFFO1lBQzVLLE1BQU0sTUFBTSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxxQkFBbUIsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3hILElBQUksaUJBQWlCLEVBQUUsQ0FBQztnQkFDdkIsTUFBTSxDQUFDLG9CQUFvQixDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDaEQsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztpQkFFZSxPQUFFLEdBQVcsMEJBQTBCLEFBQXJDLENBQXNDO1FBTXhELFlBQ0MsUUFBYSxFQUNiLGlCQUFrQyxFQUNsQixRQUFnQixFQUNoQixPQUFtQyxFQUNqQyxnQkFBbUQsRUFDaEMsNkJBQW1GLEVBQ3BHLGtCQUF1RCxFQUM1RCxZQUEyQixFQUM1QixXQUF5QixFQUNYLHlCQUFxRCxFQUM5RCxnQkFBbUMsRUFDdEMsYUFBNkIsRUFDVixnQ0FBbUUsRUFDM0Usd0JBQW1EO1lBRTlFLEtBQUssQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSx5QkFBeUIsRUFBRSxnQ0FB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