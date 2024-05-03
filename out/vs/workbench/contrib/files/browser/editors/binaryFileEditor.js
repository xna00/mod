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
define(["require", "exports", "vs/nls", "vs/workbench/browser/parts/editor/binaryEditor", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/workbench/contrib/files/common/files", "vs/platform/storage/common/storage", "vs/platform/editor/common/editor", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput"], function (require, exports, nls_1, binaryEditor_1, telemetry_1, themeService_1, fileEditorInput_1, files_1, storage_1, editor_1, editorResolverService_1, editor_2, diffEditorInput_1) {
    "use strict";
    var BinaryFileEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BinaryFileEditor = void 0;
    /**
     * An implementation of editor for binary files that cannot be displayed.
     */
    let BinaryFileEditor = class BinaryFileEditor extends binaryEditor_1.BaseBinaryResourceEditor {
        static { BinaryFileEditor_1 = this; }
        static { this.ID = files_1.BINARY_FILE_EDITOR_ID; }
        constructor(group, telemetryService, themeService, editorResolverService, storageService) {
            super(BinaryFileEditor_1.ID, group, {
                openInternal: (input, options) => this.openInternal(input, options)
            }, telemetryService, themeService, storageService);
            this.editorResolverService = editorResolverService;
        }
        async openInternal(input, options) {
            if (input instanceof fileEditorInput_1.FileEditorInput && this.group.activeEditor) {
                // We operate on the active editor here to support re-opening
                // diff editors where `input` may just be one side of the
                // diff editor.
                // Since `openInternal` can only ever be selected from the
                // active editor of the group, this is a safe assumption.
                // (https://github.com/microsoft/vscode/issues/124222)
                const activeEditor = this.group.activeEditor;
                const untypedActiveEditor = activeEditor?.toUntyped();
                if (!untypedActiveEditor) {
                    return; // we need untyped editor support
                }
                // Try to let the user pick an editor
                let resolvedEditor = await this.editorResolverService.resolveEditor({
                    ...untypedActiveEditor,
                    options: {
                        ...options,
                        override: editor_1.EditorResolution.PICK
                    }
                }, this.group);
                if (resolvedEditor === 2 /* ResolvedStatus.NONE */) {
                    resolvedEditor = undefined;
                }
                else if (resolvedEditor === 1 /* ResolvedStatus.ABORT */) {
                    return;
                }
                // If the result if a file editor, the user indicated to open
                // the binary file as text. As such we adjust the input for that.
                if ((0, editor_2.isEditorInputWithOptions)(resolvedEditor)) {
                    for (const editor of resolvedEditor.editor instanceof diffEditorInput_1.DiffEditorInput ? [resolvedEditor.editor.original, resolvedEditor.editor.modified] : [resolvedEditor.editor]) {
                        if (editor instanceof fileEditorInput_1.FileEditorInput) {
                            editor.setForceOpenAsText();
                            editor.setPreferredLanguageId(files_1.BINARY_TEXT_FILE_MODE); // https://github.com/microsoft/vscode/issues/131076
                        }
                    }
                }
                // Replace the active editor with the picked one
                await this.group.replaceEditors([{
                        editor: activeEditor,
                        replacement: resolvedEditor?.editor ?? input,
                        options: {
                            ...resolvedEditor?.options ?? options
                        }
                    }]);
            }
        }
        getTitle() {
            return this.input ? this.input.getName() : (0, nls_1.localize)('binaryFileEditor', "Binary File Viewer");
        }
    };
    exports.BinaryFileEditor = BinaryFileEditor;
    exports.BinaryFileEditor = BinaryFileEditor = BinaryFileEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, editorResolverService_1.IEditorResolverService),
        __param(4, storage_1.IStorageService)
    ], BinaryFileEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluYXJ5RmlsZUVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvYnJvd3Nlci9lZGl0b3JzL2JpbmFyeUZpbGVFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWdCaEc7O09BRUc7SUFDSSxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHVDQUF3Qjs7aUJBRTdDLE9BQUUsR0FBRyw2QkFBcUIsQUFBeEIsQ0FBeUI7UUFFM0MsWUFDQyxLQUFtQixFQUNBLGdCQUFtQyxFQUN2QyxZQUEyQixFQUNELHFCQUE2QyxFQUNyRSxjQUErQjtZQUVoRCxLQUFLLENBQ0osa0JBQWdCLENBQUMsRUFBRSxFQUNuQixLQUFLLEVBQ0w7Z0JBQ0MsWUFBWSxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDO2FBQ25FLEVBQ0QsZ0JBQWdCLEVBQ2hCLFlBQVksRUFDWixjQUFjLENBQ2QsQ0FBQztZQVp1QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1FBYXZGLENBQUM7UUFFTyxLQUFLLENBQUMsWUFBWSxDQUFDLEtBQWtCLEVBQUUsT0FBbUM7WUFDakYsSUFBSSxLQUFLLFlBQVksaUNBQWUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUVqRSw2REFBNkQ7Z0JBQzdELHlEQUF5RDtnQkFDekQsZUFBZTtnQkFDZiwwREFBMEQ7Z0JBQzFELHlEQUF5RDtnQkFDekQsc0RBQXNEO2dCQUN0RCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztnQkFDN0MsTUFBTSxtQkFBbUIsR0FBRyxZQUFZLEVBQUUsU0FBUyxFQUFFLENBQUM7Z0JBQ3RELElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO29CQUMxQixPQUFPLENBQUMsaUNBQWlDO2dCQUMxQyxDQUFDO2dCQUVELHFDQUFxQztnQkFDckMsSUFBSSxjQUFjLEdBQStCLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGFBQWEsQ0FBQztvQkFDL0YsR0FBRyxtQkFBbUI7b0JBQ3RCLE9BQU8sRUFBRTt3QkFDUixHQUFHLE9BQU87d0JBQ1YsUUFBUSxFQUFFLHlCQUFnQixDQUFDLElBQUk7cUJBQy9CO2lCQUNELEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUVmLElBQUksY0FBYyxnQ0FBd0IsRUFBRSxDQUFDO29CQUM1QyxjQUFjLEdBQUcsU0FBUyxDQUFDO2dCQUM1QixDQUFDO3FCQUFNLElBQUksY0FBYyxpQ0FBeUIsRUFBRSxDQUFDO29CQUNwRCxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsNkRBQTZEO2dCQUM3RCxpRUFBaUU7Z0JBQ2pFLElBQUksSUFBQSxpQ0FBd0IsRUFBQyxjQUFjLENBQUMsRUFBRSxDQUFDO29CQUM5QyxLQUFLLE1BQU0sTUFBTSxJQUFJLGNBQWMsQ0FBQyxNQUFNLFlBQVksaUNBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO3dCQUNwSyxJQUFJLE1BQU0sWUFBWSxpQ0FBZSxFQUFFLENBQUM7NEJBQ3ZDLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDOzRCQUM1QixNQUFNLENBQUMsc0JBQXNCLENBQUMsNkJBQXFCLENBQUMsQ0FBQyxDQUFDLG9EQUFvRDt3QkFDM0csQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsZ0RBQWdEO2dCQUNoRCxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7d0JBQ2hDLE1BQU0sRUFBRSxZQUFZO3dCQUNwQixXQUFXLEVBQUUsY0FBYyxFQUFFLE1BQU0sSUFBSSxLQUFLO3dCQUM1QyxPQUFPLEVBQUU7NEJBQ1IsR0FBRyxjQUFjLEVBQUUsT0FBTyxJQUFJLE9BQU87eUJBQ3JDO3FCQUNELENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztRQUNGLENBQUM7UUFFUSxRQUFRO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUMvRixDQUFDOztJQTdFVyw0Q0FBZ0I7K0JBQWhCLGdCQUFnQjtRQU0xQixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsNEJBQWEsQ0FBQTtRQUNiLFdBQUEsOENBQXNCLENBQUE7UUFDdEIsV0FBQSx5QkFBZSxDQUFBO09BVEwsZ0JBQWdCLENBOEU1QiJ9