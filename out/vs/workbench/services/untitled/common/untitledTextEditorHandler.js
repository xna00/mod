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
define(["require", "exports", "vs/base/common/network", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/services/textfile/common/textEditorService", "vs/base/common/resources", "vs/editor/common/languages/modesRegistry", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/services/workingCopy/common/workingCopy", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/services/untitled/common/untitledTextEditorService"], function (require, exports, network_1, lifecycle_1, uri_1, textEditorService_1, resources_1, modesRegistry_1, environmentService_1, filesConfigurationService_1, pathService_1, untitledTextEditorInput_1, workingCopy_1, workingCopyEditorService_1, untitledTextEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledTextEditorWorkingCopyEditorHandler = exports.UntitledTextEditorInputSerializer = void 0;
    let UntitledTextEditorInputSerializer = class UntitledTextEditorInputSerializer {
        constructor(filesConfigurationService, environmentService, pathService) {
            this.filesConfigurationService = filesConfigurationService;
            this.environmentService = environmentService;
            this.pathService = pathService;
        }
        canSerialize(editorInput) {
            return this.filesConfigurationService.isHotExitEnabled && !editorInput.isDisposed();
        }
        serialize(editorInput) {
            if (!this.canSerialize(editorInput)) {
                return undefined;
            }
            const untitledTextEditorInput = editorInput;
            let resource = untitledTextEditorInput.resource;
            if (untitledTextEditorInput.hasAssociatedFilePath) {
                resource = (0, resources_1.toLocalResource)(resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme); // untitled with associated file path use the local schema
            }
            // Language: only remember language if it is either specific (not text)
            // or if the language was explicitly set by the user. We want to preserve
            // this information across restarts and not set the language unless
            // this is the case.
            let languageId;
            const languageIdCandidate = untitledTextEditorInput.getLanguageId();
            if (languageIdCandidate !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                languageId = languageIdCandidate;
            }
            else if (untitledTextEditorInput.hasLanguageSetExplicitly) {
                languageId = languageIdCandidate;
            }
            const serialized = {
                resourceJSON: resource.toJSON(),
                modeId: languageId,
                encoding: untitledTextEditorInput.getEncoding()
            };
            return JSON.stringify(serialized);
        }
        deserialize(instantiationService, serializedEditorInput) {
            return instantiationService.invokeFunction(accessor => {
                const deserialized = JSON.parse(serializedEditorInput);
                const resource = uri_1.URI.revive(deserialized.resourceJSON);
                const languageId = deserialized.modeId;
                const encoding = deserialized.encoding;
                return accessor.get(textEditorService_1.ITextEditorService).createTextEditor({ resource, languageId, encoding, forceUntitled: true });
            });
        }
    };
    exports.UntitledTextEditorInputSerializer = UntitledTextEditorInputSerializer;
    exports.UntitledTextEditorInputSerializer = UntitledTextEditorInputSerializer = __decorate([
        __param(0, filesConfigurationService_1.IFilesConfigurationService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, pathService_1.IPathService)
    ], UntitledTextEditorInputSerializer);
    let UntitledTextEditorWorkingCopyEditorHandler = class UntitledTextEditorWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.untitledTextEditorWorkingCopyEditorHandler'; }
        constructor(workingCopyEditorService, environmentService, pathService, textEditorService, untitledTextEditorService) {
            super();
            this.environmentService = environmentService;
            this.pathService = pathService;
            this.textEditorService = textEditorService;
            this.untitledTextEditorService = untitledTextEditorService;
            this._register(workingCopyEditorService.registerHandler(this));
        }
        handles(workingCopy) {
            return workingCopy.resource.scheme === network_1.Schemas.untitled && workingCopy.typeId === workingCopy_1.NO_TYPE_ID;
        }
        isOpen(workingCopy, editor) {
            if (!this.handles(workingCopy)) {
                return false;
            }
            return editor instanceof untitledTextEditorInput_1.UntitledTextEditorInput && (0, resources_1.isEqual)(workingCopy.resource, editor.resource);
        }
        createEditor(workingCopy) {
            let editorInputResource;
            // If the untitled has an associated resource,
            // ensure to restore the local resource it had
            if (this.untitledTextEditorService.isUntitledWithAssociatedResource(workingCopy.resource)) {
                editorInputResource = (0, resources_1.toLocalResource)(workingCopy.resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme);
            }
            else {
                editorInputResource = workingCopy.resource;
            }
            return this.textEditorService.createTextEditor({ resource: editorInputResource, forceUntitled: true });
        }
    };
    exports.UntitledTextEditorWorkingCopyEditorHandler = UntitledTextEditorWorkingCopyEditorHandler;
    exports.UntitledTextEditorWorkingCopyEditorHandler = UntitledTextEditorWorkingCopyEditorHandler = __decorate([
        __param(0, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, pathService_1.IPathService),
        __param(3, textEditorService_1.ITextEditorService),
        __param(4, untitledTextEditorService_1.IUntitledTextEditorService)
    ], UntitledTextEditorWorkingCopyEditorHandler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW50aXRsZWRUZXh0RWRpdG9ySGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VudGl0bGVkL2NvbW1vbi91bnRpdGxlZFRleHRFZGl0b3JIYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTBCekYsSUFBTSxpQ0FBaUMsR0FBdkMsTUFBTSxpQ0FBaUM7UUFFN0MsWUFDOEMseUJBQXFELEVBQ25ELGtCQUFnRCxFQUNoRSxXQUF5QjtZQUZYLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBNEI7WUFDbkQsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUNoRSxnQkFBVyxHQUFYLFdBQVcsQ0FBYztRQUNyRCxDQUFDO1FBRUwsWUFBWSxDQUFDLFdBQXdCO1lBQ3BDLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLGdCQUFnQixJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3JGLENBQUM7UUFFRCxTQUFTLENBQUMsV0FBd0I7WUFDakMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE1BQU0sdUJBQXVCLEdBQUcsV0FBc0MsQ0FBQztZQUV2RSxJQUFJLFFBQVEsR0FBRyx1QkFBdUIsQ0FBQyxRQUFRLENBQUM7WUFDaEQsSUFBSSx1QkFBdUIsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUNuRCxRQUFRLEdBQUcsSUFBQSwyQkFBZSxFQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLDBEQUEwRDtZQUM3SyxD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