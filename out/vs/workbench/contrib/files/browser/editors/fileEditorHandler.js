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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/services/textfile/common/textEditorService", "vs/base/common/resources", "vs/workbench/services/workingCopy/common/workingCopy", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/platform/files/common/files"], function (require, exports, lifecycle_1, uri_1, textEditorService_1, resources_1, workingCopy_1, workingCopyEditorService_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileEditorWorkingCopyEditorHandler = exports.FileEditorInputSerializer = void 0;
    class FileEditorInputSerializer {
        canSerialize(editorInput) {
            return true;
        }
        serialize(editorInput) {
            const fileEditorInput = editorInput;
            const resource = fileEditorInput.resource;
            const preferredResource = fileEditorInput.preferredResource;
            const serializedFileEditorInput = {
                resourceJSON: resource.toJSON(),
                preferredResourceJSON: (0, resources_1.isEqual)(resource, preferredResource) ? undefined : preferredResource, // only storing preferredResource if it differs from the resource
                name: fileEditorInput.getPreferredName(),
                description: fileEditorInput.getPreferredDescription(),
                encoding: fileEditorInput.getEncoding(),
                modeId: fileEditorInput.getPreferredLanguageId() // only using the preferred user associated language here if available to not store redundant data
            };
            return JSON.stringify(serializedFileEditorInput);
        }
        deserialize(instantiationService, serializedEditorInput) {
            return instantiationService.invokeFunction(accessor => {
                const serializedFileEditorInput = JSON.parse(serializedEditorInput);
                const resource = uri_1.URI.revive(serializedFileEditorInput.resourceJSON);
                const preferredResource = uri_1.URI.revive(serializedFileEditorInput.preferredResourceJSON);
                const name = serializedFileEditorInput.name;
                const description = serializedFileEditorInput.description;
                const encoding = serializedFileEditorInput.encoding;
                const languageId = serializedFileEditorInput.modeId;
                const fileEditorInput = accessor.get(textEditorService_1.ITextEditorService).createTextEditor({ resource, label: name, description, encoding, languageId, forceFile: true });
                if (preferredResource) {
                    fileEditorInput.setPreferredResource(preferredResource);
                }
                return fileEditorInput;
            });
        }
    }
    exports.FileEditorInputSerializer = FileEditorInputSerializer;
    let FileEditorWorkingCopyEditorHandler = class FileEditorWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.fileEditorWorkingCopyEditorHandler'; }
        constructor(workingCopyEditorService, textEditorService, fileService) {
            super();
            this.textEditorService = textEditorService;
            this.fileService = fileService;
            this._register(workingCopyEditorService.registerHandler(this));
        }
        handles(workingCopy) {
            return workingCopy.typeId === workingCopy_1.NO_TYPE_ID && this.fileService.canHandleResource(workingCopy.resource);
        }
        handlesSync(workingCopy) {
            return workingCopy.typeId === workingCopy_1.NO_TYPE_ID && this.fileService.hasProvider(workingCopy.resource);
        }
        isOpen(workingCopy, editor) {
            if (!this.handlesSync(workingCopy)) {
                return false;
            }
            // Naturally it would make sense here to check for `instanceof FileEditorInput`
            // but because some custom editors also leverage text file based working copies
            // we need to do a weaker check by only comparing for the resource
            return (0, resources_1.isEqual)(workingCopy.resource, editor.resource);
        }
        createEditor(workingCopy) {
            return this.textEditorService.createTextEditor({ resource: workingCopy.resource, forceFile: true });
        }
    };
    exports.FileEditorWorkingCopyEditorHandler = FileEditorWorkingCopyEditorHandler;
    exports.FileEditorWorkingCopyEditorHandler = FileEditorWorkingCopyEditorHandler = __decorate([
        __param(0, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(1, textEditorService_1.ITextEditorService),
        __param(2, files_1.IFileService)
    ], FileEditorWorkingCopyEditorHandler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUVkaXRvckhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ZpbGVzL2Jyb3dzZXIvZWRpdG9ycy9maWxlRWRpdG9ySGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QmhHLE1BQWEseUJBQXlCO1FBRXJDLFlBQVksQ0FBQyxXQUF3QjtZQUNwQyxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxTQUFTLENBQUMsV0FBd0I7WUFDakMsTUFBTSxlQUFlLEdBQUcsV0FBOEIsQ0FBQztZQUN2RCxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsUUFBUSxDQUFDO1lBQzFDLE1BQU0saUJBQWlCLEdBQUcsZUFBZSxDQUFDLGlCQUFpQixDQUFDO1lBQzVELE1BQU0seUJBQXlCLEdBQStCO2dCQUM3RCxZQUFZLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDL0IscUJBQXFCLEVBQUUsSUFBQSxtQkFBTyxFQUFDLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLGlFQUFpRTtnQkFDOUosSUFBSSxFQUFFLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDeEMsV0FBVyxFQUFFLGVBQWUsQ0FBQyx1QkFBdUIsRUFBRTtnQkFDdEQsUUFBUSxFQUFFLGVBQWUsQ0FBQyxXQUFXLEVBQUU7Z0JBQ3ZDLE1BQU0sRUFBRSxlQUFlLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxrR0FBa0c7YUFDbkosQ0FBQztZQUVGLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFRCxXQUFXLENBQUMsb0JBQTJDLEVBQUUscUJBQTZCO1lBQ3JG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