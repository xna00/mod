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
define(["require", "exports", "vs/base/common/event", "vs/base/common/path", "vs/base/common/resources", "vs/editor/common/languages/modesRegistry", "vs/editor/common/services/resolverService", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor/editorInput", "vs/workbench/contrib/interactive/browser/interactiveDocumentService", "vs/workbench/contrib/interactive/browser/interactiveHistoryService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, event_1, paths, resources_1, modesRegistry_1, resolverService_1, configuration_1, dialogs_1, instantiation_1, editorInput_1, interactiveDocumentService_1, interactiveHistoryService_1, notebookCommon_1, notebookEditorInput_1, notebookService_1) {
    "use strict";
    var InteractiveEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveEditorInput = void 0;
    let InteractiveEditorInput = class InteractiveEditorInput extends editorInput_1.EditorInput {
        static { InteractiveEditorInput_1 = this; }
        static create(instantiationService, resource, inputResource, title, language) {
            return instantiationService.createInstance(InteractiveEditorInput_1, resource, inputResource, title, language);
        }
        static { this.windowNames = {}; }
        static setName(notebookUri, title) {
            if (title) {
                this.windowNames[notebookUri.path] = title;
            }
        }
        static { this.ID = 'workbench.input.interactive'; }
        get editorId() {
            return 'interactive';
        }
        get typeId() {
            return InteractiveEditorInput_1.ID;
        }
        get language() {
            return this._inputModelRef?.object.textEditorModel.getLanguageId() ?? this._initLanguage;
        }
        get notebookEditorInput() {
            return this._notebookEditorInput;
        }
        get editorInputs() {
            return [this._notebookEditorInput];
        }
        get resource() {
            return this._resource;
        }
        get inputResource() {
            return this._inputResource;
        }
        get primary() {
            return this._notebookEditorInput;
        }
        constructor(resource, inputResource, title, languageId, instantiationService, textModelService, interactiveDocumentService, historyService, _notebookService, _fileDialogService, configurationService) {
            const input = notebookEditorInput_1.NotebookEditorInput.getOrCreate(instantiationService, resource, undefined, 'interactive', {});
            super();
            this._notebookService = _notebookService;
            this._fileDialogService = _fileDialogService;
            this.isScratchpad = configurationService.getValue(notebookCommon_1.NotebookSetting.InteractiveWindowPromptToSave) !== true;
            this._notebookEditorInput = input;
            this._register(this._notebookEditorInput);
            this.name = title ?? InteractiveEditorInput_1.windowNames[resource.path] ?? paths.basename(resource.path, paths.extname(resource.path));
            this._initLanguage = languageId;
            this._resource = resource;
            this._inputResource = inputResource;
            this._inputResolver = null;
            this._editorModelReference = null;
            this._inputModelRef = null;
            this._textModelService = textModelService;
            this._interactiveDocumentService = interactiveDocumentService;
            this._historyService = historyService;
            this._registerListeners();
        }
        _registerListeners() {
            const oncePrimaryDisposed = event_1.Event.once(this.primary.onWillDispose);
            this._register(oncePrimaryDisposed(() => {
                if (!this.isDisposed()) {
                    this.dispose();
                }
            }));
            // Re-emit some events from the primary side to the outside
            this._register(this.primary.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            this._register(this.primary.onDidChangeLabel(() => this._onDidChangeLabel.fire()));
            // Re-emit some events from both sides to the outside
            this._register(this.primary.onDidChangeCapabilities(() => this._onDidChangeCapabilities.fire()));
        }
        get capabilities() {
            const scratchPad = this.isScratchpad ? 512 /* EditorInputCapabilities.Scratchpad */ : 0;
            return 4 /* EditorInputCapabilities.Untitled */
                | 2 /* EditorInputCapabilities.Readonly */
                | scratchPad;
        }
        async _resolveEditorModel() {
            if (!this._editorModelReference) {
                this._editorModelReference = await this._notebookEditorInput.resolve();
            }
            return this._editorModelReference;
        }
        async resolve() {
            if (this._editorModelReference) {
                return this._editorModelReference;
            }
            if (this._inputResolver) {
                return this._inputResolver;
            }
            this._inputResolver = this._resolveEditorModel();
            return this._inputResolver;
        }
        async resolveInput(language) {
            if (this._inputModelRef) {
                return this._inputModelRef.object.textEditorModel;
            }
            const resolvedLanguage = language ?? this._initLanguage ?? modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
            this._interactiveDocumentService.willCreateInteractiveDocument(this.resource, this.inputResource, resolvedLanguage);
            this._inputModelRef = await this._textModelService.createModelReference(this.inputResource);
            return this._inputModelRef.object.textEditorModel;
        }
        async save(group, options) {
            if (this._editorModelReference) {
                if (this.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                    return this.saveAs(group, options);
                }
                else {
                    await this._editorModelReference.save(options);
                }
                return this;
            }
            return undefined;
        }
        async saveAs(group, options) {
            if (!this._editorModelReference) {
                return undefined;
            }
            const provider = this._notebookService.getContributedNotebookType('interactive');
            if (!provider) {
                return undefined;
            }
            const filename = this.getName() + '.ipynb';
            const pathCandidate = (0, resources_1.joinPath)(await this._fileDialogService.defaultFilePath(), filename);
            const target = await this._fileDialogService.pickFileToSave(pathCandidate, options?.availableFileSystems);
            if (!target) {
                return undefined; // save cancelled
            }
            return await this._editorModelReference.saveAs(target);
        }
        matches(otherInput) {
            if (super.matches(otherInput)) {
                return true;
            }
            if (otherInput instanceof InteractiveEditorInput_1) {
                return (0, resources_1.isEqual)(this.resource, otherInput.resource) && (0, resources_1.isEqual)(this.inputResource, otherInput.inputResource);
            }
            return false;
        }
        getName() {
            return this.name;
        }
        isDirty() {
            if (this.isScratchpad) {
                return false;
            }
            return this._editorModelReference?.isDirty() ?? false;
        }
        isModified() {
            return this._editorModelReference?.isModified() ?? false;
        }
        async revert(_group, options) {
            if (this._editorModelReference && this._editorModelReference.isDirty()) {
                await this._editorModelReference.revert(options);
            }
        }
        dispose() {
            // we support closing the interactive window without prompt, so the editor model should not be dirty
            this._editorModelReference?.revert({ soft: true });
            this._notebookEditorInput?.dispose();
            this._editorModelReference?.dispose();
            this._editorModelReference = null;
            this._interactiveDocumentService.willRemoveInteractiveDocument(this.resource, this.inputResource);
            this._inputModelRef?.dispose();
            this._inputModelRef = null;
            super.dispose();
        }
        get historyService() {
            return this._historyService;
        }
    };
    exports.InteractiveEditorInput = InteractiveEditorInput;
    exports.InteractiveEditorInput = InteractiveEditorInput = InteractiveEditorInput_1 = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, resolverService_1.ITextModelService),
        __param(6, interactiveDocumentService_1.IInteractiveDocumentService),
        __param(7, interactiveHistoryService_1.IInteractiveHistoryService),
        __param(8, notebookService_1.INotebookService),
        __param(9, dialogs_1.IFileDialogService),
        __param(10, configuration_1.IConfigurationService)
    ], InteractiveEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RpdmVFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW50ZXJhY3RpdmUvYnJvd3Nlci9pbnRlcmFjdGl2ZUVkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFvQnpGLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEseUJBQVc7O1FBQ3RELE1BQU0sQ0FBQyxNQUFNLENBQUMsb0JBQTJDLEVBQUUsUUFBYSxFQUFFLGFBQWtCLEVBQUUsS0FBYyxFQUFFLFFBQWlCO1lBQzlILE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUFDLHdCQUFzQixFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzlHLENBQUM7aUJBRWMsZ0JBQVcsR0FBMkIsRUFBRSxBQUE3QixDQUE4QjtRQUV4RCxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQWdCLEVBQUUsS0FBeUI7WUFDekQsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDNUMsQ0FBQztRQUNGLENBQUM7aUJBRWUsT0FBRSxHQUFXLDZCQUE2QixBQUF4QyxDQUF5QztRQUUzRCxJQUFvQixRQUFRO1lBQzNCLE9BQU8sYUFBYSxDQUFDO1FBQ3RCLENBQUM7UUFFRCxJQUFhLE1BQU07WUFDbEIsT0FBTyx3QkFBc0IsQ0FBQyxFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUtELElBQUksUUFBUTtZQUNYLE9BQU8sSUFBSSxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsZUFBZSxDQUFDLGFBQWEsRUFBRSxJQUFJLElBQUksQ0FBQyxhQUFh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