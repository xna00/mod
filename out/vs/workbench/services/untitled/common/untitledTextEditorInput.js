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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/services/textfile/common/textfiles", "vs/platform/label/common/label", "vs/workbench/services/editor/common/editorService", "vs/platform/files/common/files", "vs/base/common/resources", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/editor/common/services/resolverService", "vs/base/common/lifecycle", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/customEditorLabelService"], function (require, exports, editor_1, textResourceEditorInput_1, textfiles_1, label_1, editorService_1, files_1, resources_1, environmentService_1, pathService_1, filesConfigurationService_1, resolverService_1, lifecycle_1, textResourceConfiguration_1, customEditorLabelService_1) {
    "use strict";
    var UntitledTextEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledTextEditorInput = void 0;
    /**
     * An editor input to be used for untitled text buffers.
     */
    let UntitledTextEditorInput = class UntitledTextEditorInput extends textResourceEditorInput_1.AbstractTextResourceEditorInput {
        static { UntitledTextEditorInput_1 = this; }
        static { this.ID = 'workbench.editors.untitledEditorInput'; }
        get typeId() {
            return UntitledTextEditorInput_1.ID;
        }
        get editorId() {
            return editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
        }
        constructor(model, textFileService, labelService, editorService, fileService, environmentService, pathService, filesConfigurationService, textModelService, textResourceConfigurationService, customEditorLabelService) {
            super(model.resource, undefined, editorService, textFileService, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService);
            this.model = model;
            this.environmentService = environmentService;
            this.pathService = pathService;
            this.textModelService = textModelService;
            this.modelResolve = undefined;
            this.modelDisposables = this._register(new lifecycle_1.DisposableStore());
            this.cachedUntitledTextEditorModelReference = undefined;
            this.registerModelListeners(model);
            this._register(this.textFileService.untitled.onDidCreate(model => this.onDidCreateUntitledModel(model)));
        }
        registerModelListeners(model) {
            this.modelDisposables.clear();
            // re-emit some events from the model
            this.modelDisposables.add(model.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            this.modelDisposables.add(model.onDidChangeName(() => this._onDidChangeLabel.fire()));
            // a reverted untitled text editor model renders this input disposed
            this.modelDisposables.add(model.onDidRevert(() => this.dispose()));
        }
        onDidCreateUntitledModel(model) {
            if ((0, resources_1.isEqual)(model.resource, this.model.resource) && model !== this.model) {
                // Ensure that we keep our model up to date with
                // the actual model from the service so that we
                // never get out of sync with the truth.
                this.model = model;
                this.registerModelListeners(model);
            }
        }
        getName() {
            return this.model.name;
        }
        getDescription(verbosity = 1 /* Verbosity.MEDIUM */) {
            // Without associated path: only use if name and description differ
            if (!this.model.hasAssociatedFilePath) {
                const descriptionCandidate = this.resource.path;
                if (descriptionCandidate !== this.getName()) {
                    return descriptionCandidate;
                }
                return undefined;
            }
            // With associated path: delegate to parent
            return super.getDescription(verbosity);
        }
        getTitle(verbosity) {
            // Without associated path: check if name and description differ to decide
            // if description should appear besides the name to distinguish better
            if (!this.model.hasAssociatedFilePath) {
                const name = this.getName();
                const description = this.getDescription();
                if (description && description !== name) {
                    return `${name} • ${description}`;
                }
                return name;
            }
            // With associated path: delegate to parent
            return super.getTitle(verbosity);
        }
        isDirty() {
            return this.model.isDirty();
        }
        getEncoding() {
            return this.model.getEncoding();
        }
        setEncoding(encoding, mode /* ignored, we only have Encode */) {
            return this.model.setEncoding(encoding);
        }
        get hasLanguageSetExplicitly() { return this.model.hasLanguageSetExplicitly; }
        get hasAssociatedFilePath() { return this.model.hasAssociatedFilePath; }
        setLanguageId(languageId, source) {
            this.model.setLanguageId(languageId, source);
        }
        getLanguageId() {
            return this.model.getLanguageId();
        }
        async resolve() {
            if (!this.modelResolve) {
                this.modelResolve = (async () => {
                    // Acquire a model reference
                    this.cachedUntitledTextEditorModelReference = await this.textModelService.createModelReference(this.resource);
                })();
            }
            await this.modelResolve;
            // It is possible that this input was disposed before the model
            // finished resolving. As such, we need to make sure to dispose
            // the model reference to not leak it.
            if (this.isDisposed()) {
                this.disposeModelReference();
            }
            return this.model;
        }
        toUntyped(options) {
            const untypedInput = {
                resource: this.model.hasAssociatedFilePath ? (0, resources_1.toLocalResource)(this.model.resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme) : this.resource,
                forceUntitled: true,
                options: {
                    override: this.editorId
                }
            };
            if (typeof options?.preserveViewState === 'number') {
                untypedInput.encoding = this.getEncoding();
                untypedInput.languageId = this.getLanguageId();
                untypedInput.contents = this.model.isModified() ? this.model.textEditorModel?.getValue() : undefined;
                untypedInput.options.viewState = (0, editor_1.findViewStateForEditor)(this, options.preserveViewState, this.editorService);
                if (typeof untypedInput.contents === 'string' && !this.model.hasAssociatedFilePath && !options.preserveResource) {
                    // Given how generic untitled resources in the system are, we
                    // need to be careful not to set our resource into the untyped
                    // editor if we want to transport contents too, because of
                    // issue https://github.com/microsoft/vscode/issues/140898
                    // The workaround is to simply remove the resource association
                    // if we have contents and no associated resource.
                    // In that case we can ensure that a new untitled resource is
                    // being created and the contents can be restored properly.
                    untypedInput.resource = undefined;
                }
            }
            return untypedInput;
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if (otherInput instanceof UntitledTextEditorInput_1) {
                return (0, resources_1.isEqual)(otherInput.resource, this.resource);
            }
            if ((0, editor_1.isUntitledResourceEditorInput)(otherInput)) {
                return super.matches(otherInput);
            }
            return false;
        }
        dispose() {
            // Model
            this.modelResolve = undefined;
            // Model reference
            this.disposeModelReference();
            super.dispose();
        }
        disposeModelReference() {
            (0, lifecycle_1.dispose)(this.cachedUntitledTextEditorModelReference);
            this.cachedUntitledTextEditorModelReference = undefined;
        }
    };
    exports.UntitledTextEditorInput = UntitledTextEditorInput;
    exports.UntitledTextEditorInput = UntitledTextEditorInput = UntitledTextEditorInput_1 = __decorate([
        __param(1, textfiles_1.ITextFileService),
        __param(2, label_1.ILabelService),
        __param(3, editorService_1.IEditorService),
        __param(4, files_1.IFileService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, pathService_1.IPathService),
        __param(7, filesConfigurationService_1.IFilesConfigurationService),
        __param(8, resolverService_1.ITextModelService),
        __param(9, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(10, customEditorLabelService_1.ICustomEditorLabelService)
    ], UntitledTextEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW50aXRsZWRUZXh0RWRpdG9ySW5wdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91bnRpdGxlZC9jb21tb24vdW50aXRsZWRUZXh0RWRpdG9ySW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFCaEc7O09BRUc7SUFDSSxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHlEQUErQjs7aUJBRTNELE9BQUUsR0FBVyx1Q0FBdUMsQUFBbEQsQ0FBbUQ7UUFFckUsSUFBYSxNQUFNO1lBQ2xCLE9BQU8seUJBQXVCLENBQUMsRUFBRSxDQUFDO1FBQ25DLENBQUM7UUFFRCxJQUFhLFFBQVE7WUFDcEIsT0FBTyxtQ0FBMEIsQ0FBQyxFQUFFLENBQUM7UUFDdEMsQ0FBQztRQU1ELFlBQ1csS0FBK0IsRUFDdkIsZUFBaUMsRUFDcEMsWUFBMkIsRUFDMUIsYUFBNkIsRUFDL0IsV0FBeUIsRUFDVCxrQkFBaUUsRUFDakYsV0FBMEMsRUFDNUIseUJBQXFELEVBQzlELGdCQUFvRCxFQUNwQyxnQ0FBbUUsRUFDM0Usd0JBQW1EO1lBRTlFLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUseUJBQXlCLEVBQUUsZ0NBQWdDLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztZQVp6SyxVQUFLLEdBQUwsS0FBSyxDQUEwQjtZQUtNLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBOEI7WUFDaEUsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFFcEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQWJoRSxpQkFBWSxHQUE4QixTQUFTLENBQUM7WUFDM0MscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQ2xFLDJDQUFzQyxHQUFxRCxTQUFTLENBQUM7WUFpQjVHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVuQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUcsQ0FBQztRQUVPLHNCQUFzQixDQUFDLEtBQStCO1lBQzdELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUU5QixxQ0FBcUM7WUFDckMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2RixJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV0RixvRUFBb0U7WUFDcEUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUVPLHdCQUF3QixDQUFDLEtBQStCO1lBQy9ELElBQUksSUFBQSxtQkFBTyxFQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUUxRSxnREFBZ0Q7Z0JBQ2hELCtDQUErQztnQkFDL0Msd0NBQXdDO2dCQUV4QyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztnQkFDbkIsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BDLENBQUM7UUFDRixDQUFDO1FBRVEsT0FBTztZQUNmLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7UUFDeEIsQ0FBQztRQUVRLGNBQWMsQ0FBQyxTQUFTLDJCQUFtQjtZQUVuRCxtRUFBbUU7WUFDbkUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztnQkFDaEQsSUFBSSxvQkFBb0IsS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztvQkFDN0MsT0FBTyxvQkFBb0IsQ0FBQztnQkFDN0IsQ0FBQztnQkFFRCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsMkNBQTJDO1lBQzNDLE9BQU8sS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRVEsUUFBUSxDQUFDLFNBQW9CO1lBRXJDLDBFQUEwRTtZQUMxRSxzRUFBc0U7WUFDdEUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM1QixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzFDLElBQUksV0FBVyxJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUUsQ0FBQztvQkFDekMsT0FBTyxHQUFHLElBQUksTUFBTSxXQUFXLEVBQUUsQ0FBQztnQkFDbkMsQ0FBQztnQkFFRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCwyQ0FBMkM7WUFDM0MsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFUSxPQUFPO1lBQ2YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFFRCxXQUFXO1lBQ1YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2pDLENBQUM7UUFFRCxXQUFXLENBQUMsUUFBZ0IsRUFBRSxJQUFrQixDQUFDLGtDQUFrQztZQUNsRixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFRCxJQUFJLHdCQUF3QixLQUFLLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7UUFFOUUsSUFBSSxxQkFBcUIsS0FBSyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1FBRXhFLGFBQWEsQ0FBQyxVQUFrQixFQUFFLE1BQWU7WUFDaEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxhQUFhO1lBQ1osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ25DLENBQUM7UUFFUSxLQUFLLENBQUMsT0FBTztZQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsS0FBSyxJQUFJLEVBQUU7b0JBRS9CLDRCQUE0QjtvQkFDNUIsSUFBSSxDQUFDLHNDQUFzQyxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQXlDLENBQUM7Z0JBQ3ZKLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDTixDQUFDO1lBRUQsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDO1lBRXhCLCtEQUErRDtZQUMvRCwrREFBK0Q7WUFDL0Qsc0NBQXNDO1lBQ3RDLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQzlCLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUVRLFNBQVMsQ0FBQyxPQUErQjtZQUNqRCxNQUFNLFlBQVksR0FBa0c7Z0JBQ25ILFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxJQUFBLDJCQUFlLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRO2dCQUM3SyxhQUFhLEVBQUUsSUFBSTtnQkFDbkIsT0FBTyxFQUFFO29CQUNSLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtpQkFDdkI7YUFDRCxDQUFDO1lBRUYsSUFBSSxPQUFPLE9BQU8sRUFBRSxpQkFBaUIsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDcEQsWUFBWSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzNDLFlBQVksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUMvQyxZQUFZLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7Z0JBQ3JHLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUEsK0JBQXNCLEVBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBRTdHLElBQUksT0FBTyxZQUFZLENBQUMsUUFBUSxLQUFLLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDakgsNkRBQTZEO29CQUM3RCw4REFBOEQ7b0JBQzlELDBEQUEwRDtvQkFDMUQsMERBQTBEO29CQUMxRCw4REFBOEQ7b0JBQzlELGtEQUFrRDtvQkFDbEQsNkRBQTZEO29CQUM3RCwyREFBMkQ7b0JBQzNELFlBQVksQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO2dCQUNuQyxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sWUFBWSxDQUFDO1FBQ3JCLENBQUM7UUFFUSxPQUFPLENBQUMsVUFBNkM7WUFDN0QsSUFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksVUFBVSxZQUFZLHlCQUF1QixFQUFFLENBQUM7Z0JBQ25ELE9BQU8sSUFBQSxtQkFBTyxFQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BELENBQUM7WUFFRCxJQUFJLElBQUEsc0NBQTZCLEVBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDL0MsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFUSxPQUFPO1lBRWYsUUFBUTtZQUNSLElBQUksQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDO1lBRTlCLGtCQUFrQjtZQUNsQixJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUU3QixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVPLHFCQUFxQjtZQUM1QixJQUFBLG1CQUFPLEVBQUMsSUFBSSxDQUFDLHNDQUFzQyxDQUFDLENBQUM7WUFDckQsSUFBSSxDQUFDLHNDQUFzQyxHQUFHLFNBQVMsQ0FBQztRQUN6RCxDQUFDOztJQTNNVywwREFBdUI7c0NBQXZCLHVCQUF1QjtRQWtCakMsV0FBQSw0QkFBZ0IsQ0FBQTtRQUNoQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLGlEQUE0QixDQUFBO1FBQzVCLFdBQUEsMEJBQVksQ0FBQTtRQUNaLFdBQUEsc0RBQTBCLENBQUE7UUFDMUIsV0FBQSxtQ0FBaUIsQ0FBQTtRQUNqQixXQUFBLDZEQUFpQyxDQUFBO1FBQ2pDLFlBQUEsb0RBQXlCLENBQUE7T0EzQmYsdUJBQXVCLENBNE1uQyJ9