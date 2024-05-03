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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/common/editor/resourceEditorInput", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/editor/common/editorService", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/base/common/network", "vs/base/common/resources", "vs/editor/common/services/resolverService", "vs/workbench/common/editor/textResourceEditorModel", "vs/editor/common/model/textModel", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/customEditorLabelService"], function (require, exports, editor_1, resourceEditorInput_1, textfiles_1, editorService_1, files_1, label_1, network_1, resources_1, resolverService_1, textResourceEditorModel_1, textModel_1, filesConfigurationService_1, textResourceConfiguration_1, customEditorLabelService_1) {
    "use strict";
    var TextResourceEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextResourceEditorInput = exports.AbstractTextResourceEditorInput = void 0;
    /**
     * The base class for all editor inputs that open in text editors.
     */
    let AbstractTextResourceEditorInput = class AbstractTextResourceEditorInput extends resourceEditorInput_1.AbstractResourceEditorInput {
        constructor(resource, preferredResource, editorService, textFileService, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService) {
            super(resource, preferredResource, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService);
            this.editorService = editorService;
            this.textFileService = textFileService;
        }
        save(group, options) {
            // If this is neither an `untitled` resource, nor a resource
            // we can handle with the file service, we can only "Save As..."
            if (this.resource.scheme !== network_1.Schemas.untitled && !this.fileService.hasProvider(this.resource)) {
                return this.saveAs(group, options);
            }
            // Normal save
            return this.doSave(options, false, group);
        }
        saveAs(group, options) {
            return this.doSave(options, true, group);
        }
        async doSave(options, saveAs, group) {
            // Save / Save As
            let target;
            if (saveAs) {
                target = await this.textFileService.saveAs(this.resource, undefined, { ...options, suggestedTarget: this.preferredResource });
            }
            else {
                target = await this.textFileService.save(this.resource, options);
            }
            if (!target) {
                return undefined; // save cancelled
            }
            return { resource: target };
        }
        async revert(group, options) {
            await this.textFileService.revert(this.resource, options);
        }
    };
    exports.AbstractTextResourceEditorInput = AbstractTextResourceEditorInput;
    exports.AbstractTextResourceEditorInput = AbstractTextResourceEditorInput = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, label_1.ILabelService),
        __param(5, files_1.IFileService),
        __param(6, filesConfigurationService_1.IFilesConfigurationService),
        __param(7, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(8, customEditorLabelService_1.ICustomEditorLabelService)
    ], AbstractTextResourceEditorInput);
    /**
     * A read-only text editor input whos contents are made of the provided resource that points to an existing
     * code editor model.
     */
    let TextResourceEditorInput = class TextResourceEditorInput extends AbstractTextResourceEditorInput {
        static { TextResourceEditorInput_1 = this; }
        static { this.ID = 'workbench.editors.resourceEditorInput'; }
        get typeId() {
            return TextResourceEditorInput_1.ID;
        }
        get editorId() {
            return editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
        }
        constructor(resource, name, description, preferredLanguageId, preferredContents, textModelService, textFileService, editorService, fileService, labelService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService) {
            super(resource, undefined, editorService, textFileService, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService);
            this.name = name;
            this.description = description;
            this.preferredLanguageId = preferredLanguageId;
            this.preferredContents = preferredContents;
            this.textModelService = textModelService;
            this.cachedModel = undefined;
            this.modelReference = undefined;
        }
        getName() {
            return this.name || super.getName();
        }
        setName(name) {
            if (this.name !== name) {
                this.name = name;
                this._onDidChangeLabel.fire();
            }
        }
        getDescription() {
            return this.description;
        }
        setDescription(description) {
            if (this.description !== description) {
                this.description = description;
                this._onDidChangeLabel.fire();
            }
        }
        setLanguageId(languageId, source) {
            this.setPreferredLanguageId(languageId);
            this.cachedModel?.setLanguageId(languageId, source);
        }
        setPreferredLanguageId(languageId) {
            this.preferredLanguageId = languageId;
        }
        setPreferredContents(contents) {
            this.preferredContents = contents;
        }
        async resolve() {
            // Unset preferred contents and language after resolving
            // once to prevent these properties to stick. We still
            // want the user to change the language in the editor
            // and want to show updated contents (if any) in future
            // `resolve` calls.
            const preferredContents = this.preferredContents;
            const preferredLanguageId = this.preferredLanguageId;
            this.preferredContents = undefined;
            this.preferredLanguageId = undefined;
            if (!this.modelReference) {
                this.modelReference = this.textModelService.createModelReference(this.resource);
            }
            const ref = await this.modelReference;
            // Ensure the resolved model is of expected type
            const model = ref.object;
            if (!(model instanceof textResourceEditorModel_1.TextResourceEditorModel)) {
                ref.dispose();
                this.modelReference = undefined;
                throw new Error(`Unexpected model for TextResourceEditorInput: ${this.resource}`);
            }
            this.cachedModel = model;
            // Set contents and language if preferred
            if (typeof preferredContents === 'string' || typeof preferredLanguageId === 'string') {
                model.updateTextEditorModel(typeof preferredContents === 'string' ? (0, textModel_1.createTextBufferFactory)(preferredContents) : undefined, preferredLanguageId);
            }
            return model;
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if (otherInput instanceof TextResourceEditorInput_1) {
                return (0, resources_1.isEqual)(otherInput.resource, this.resource);
            }
            if ((0, editor_1.isResourceEditorInput)(otherInput)) {
                return super.matches(otherInput);
            }
            return false;
        }
        dispose() {
            if (this.modelReference) {
                this.modelReference.then(ref => ref.dispose());
                this.modelReference = undefined;
            }
            this.cachedModel = undefined;
            super.dispose();
        }
    };
    exports.TextResourceEditorInput = TextResourceEditorInput;
    exports.TextResourceEditorInput = TextResourceEditorInput = TextResourceEditorInput_1 = __decorate([
        __param(5, resolverService_1.ITextModelService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, editorService_1.IEditorService),
        __param(8, files_1.IFileService),
        __param(9, label_1.ILabelService),
        __param(10, filesConfigurationService_1.IFilesConfigurationService),
        __param(11, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(12, customEditorLabelService_1.ICustomEditorLabelService)
    ], TextResourceEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFJlc291cmNlRWRpdG9ySW5wdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vZWRpdG9yL3RleHRSZXNvdXJjZUVkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFvQmhHOztPQUVHO0lBQ0ksSUFBZSwrQkFBK0IsR0FBOUMsTUFBZSwrQkFBZ0MsU0FBUSxpREFBMkI7UUFFeEYsWUFDQyxRQUFhLEVBQ2IsaUJBQWtDLEVBQ0MsYUFBNkIsRUFDM0IsZUFBaUMsRUFDdkQsWUFBMkIsRUFDNUIsV0FBeUIsRUFDWCx5QkFBcUQsRUFDOUMsZ0NBQW1FLEVBQzNFLHdCQUFtRDtZQUU5RSxLQUFLLENBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUseUJBQXlCLEVBQUUsZ0NBQWdDLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztZQVJsSCxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDM0Isb0JBQWUsR0FBZixlQUFlLENBQWtCO1FBUXZFLENBQUM7UUFFUSxJQUFJLENBQUMsS0FBc0IsRUFBRSxPQUE4QjtZQUVuRSw0REFBNEQ7WUFDNUQsZ0VBQWdFO1lBQ2hFLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDL0YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNwQyxDQUFDO1lBRUQsY0FBYztZQUNkLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FB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