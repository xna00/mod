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
define(["require", "exports", "vs/nls", "vs/base/common/performance", "vs/base/common/types", "vs/workbench/services/path/common/pathService", "vs/base/common/actions", "vs/workbench/contrib/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/browser/parts/editor/textCodeEditor", "vs/workbench/common/editor", "vs/workbench/common/editor/editorOptions", "vs/workbench/common/editor/binaryEditorModel", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/platform/files/common/files", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/editor/common/editor", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/files/browser/files", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/configuration/common/configuration", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/host/browser/host", "vs/workbench/services/filesConfiguration/common/filesConfigurationService"], function (require, exports, nls_1, performance_1, types_1, pathService_1, actions_1, files_1, textfiles_1, textCodeEditor_1, editor_1, editorOptions_1, binaryEditorModel_1, fileEditorInput_1, files_2, telemetry_1, workspace_1, storage_1, textResourceConfiguration_1, instantiation_1, themeService_1, editorService_1, editorGroupsService_1, editor_2, uriIdentity_1, files_3, panecomposite_1, configuration_1, preferences_1, host_1, filesConfigurationService_1) {
    "use strict";
    var TextFileEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextFileEditor = void 0;
    /**
     * An implementation of editor for file system resources.
     */
    let TextFileEditor = class TextFileEditor extends textCodeEditor_1.AbstractTextCodeEditor {
        static { TextFileEditor_1 = this; }
        static { this.ID = files_1.TEXT_FILE_EDITOR_ID; }
        constructor(group, telemetryService, fileService, paneCompositeService, instantiationService, contextService, storageService, textResourceConfigurationService, editorService, themeService, editorGroupService, textFileService, explorerService, uriIdentityService, pathService, configurationService, preferencesService, hostService, filesConfigurationService) {
            super(TextFileEditor_1.ID, group, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService, fileService);
            this.paneCompositeService = paneCompositeService;
            this.contextService = contextService;
            this.textFileService = textFileService;
            this.explorerService = explorerService;
            this.uriIdentityService = uriIdentityService;
            this.pathService = pathService;
            this.configurationService = configurationService;
            this.preferencesService = preferencesService;
            this.hostService = hostService;
            this.filesConfigurationService = filesConfigurationService;
            // Clear view state for deleted files
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            // Move view state for moved files
            this._register(this.fileService.onDidRunOperation(e => this.onDidRunOperation(e)));
        }
        onDidFilesChange(e) {
            for (const resource of e.rawDeleted) {
                this.clearEditorViewState(resource);
            }
        }
        onDidRunOperation(e) {
            if (e.operation === 2 /* FileOperation.MOVE */ && e.target) {
                this.moveEditorViewState(e.resource, e.target.resource, this.uriIdentityService.extUri);
            }
        }
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return (0, nls_1.localize)('textFileEditor', "Text File Editor");
        }
        get input() {
            return this._input;
        }
        async setInput(input, options, context, token) {
            (0, performance_1.mark)('code/willSetInputToTextFileEditor');
            // Set input and resolve
            await super.setInput(input, options, context, token);
            try {
                const resolvedModel = await input.resolve(options);
                // Check for cancellation
                if (token.isCancellationRequested) {
                    return;
                }
                // There is a special case where the text editor has to handle binary
                // file editor input: if a binary file has been resolved and cached
                // before, it maybe an actual instance of BinaryEditorModel. In this
                // case our text editor has to open this model using the binary editor.
                // We return early in this case.
                if (resolvedModel instanceof binaryEditorModel_1.BinaryEditorModel) {
                    return this.openAsBinary(input, options);
                }
                const textFileModel = resolvedModel;
                // Editor
                const control = (0, types_1.assertIsDefined)(this.editorControl);
                control.setModel(textFileModel.textEditorModel);
                // Restore view state (unless provided by options)
                if (!(0, editor_1.isTextEditorViewState)(options?.viewState)) {
                    const editorViewState = this.loadEditorViewState(input, context);
                    if (editorViewState) {
                        if (options?.selection) {
                            editorViewState.cursorState = []; // prevent duplicate selections via options
                        }
                        control.restoreViewState(editorViewState);
                    }
                }
                // Apply options to editor if any
                if (options) {
                    (0, editorOptions_1.applyTextEditorOptions)(options, control, 1 /* ScrollType.Immediate */);
                }
                // Since the resolved model provides information about being readonly
                // or not, we apply it here to the editor even though the editor input
                // was already asked for being readonly or not. The rationale is that
                // a resolved model might have more specific information about being
                // readonly or not that the input did not have.
                control.updateOptions(this.getReadonlyConfiguration(textFileModel.isReadonly()));
                if (control.handleInitialized) {
                    control.handleInitialized();
                }
            }
            catch (error) {
                await this.handleSetInputError(error, input, options);
            }
            (0, performance_1.mark)('code/didSetInputToTextFileEditor');
        }
        async handleSetInputError(error, input, options) {
            // Handle case where content appears to be binary
            if (error.textFileOperationResult === 0 /* TextFileOperationResult.FILE_IS_BINARY */) {
                return this.openAsBinary(input, options);
            }
            // Handle case where we were asked to open a folder
            if (error.fileOperationResult === 0 /* FileOperationResult.FILE_IS_DIRECTORY */) {
                const actions = [];
                actions.push((0, actions_1.toAction)({
                    id: 'workbench.files.action.openFolder', label: (0, nls_1.localize)('openFolder', "Open Folder"), run: async () => {
                        return this.hostService.openWindow([{ folderUri: input.resource }], { forceNewWindow: true });
                    }
                }));
                if (this.contextService.isInsideWorkspace(input.preferredResource)) {
                    actions.push((0, actions_1.toAction)({
                        id: 'workbench.files.action.reveal', label: (0, nls_1.localize)('reveal', "Reveal Folder"), run: async () => {
                            await this.paneCompositeService.openPaneComposite(files_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
                            return this.explorerService.select(input.preferredResource, true);
                        }
                    }));
                }
                throw (0, editor_1.createEditorOpenError)((0, nls_1.localize)('fileIsDirectory', "The file is not displayed in the text editor because it is a directory."), actions, { forceMessage: true });
            }
            // Handle case where a file is too large to open without confirmation
            if (error.fileOperationResult === 7 /* FileOperationResult.FILE_TOO_LARGE */) {
                let message;
                if (error instanceof files_2.TooLargeFileOperationError) {
                    message = (0, nls_1.localize)('fileTooLargeForHeapErrorWithSize', "The file is not displayed in the text editor because it is very large ({0}).", files_2.ByteSize.formatSize(error.size));
                }
                else {
                    message = (0, nls_1.localize)('fileTooLargeForHeapErrorWithoutSize', "The file is not displayed in the text editor because it is very large.");
                }
                throw (0, editor_1.createTooLargeFileError)(this.group, input, options, message, this.preferencesService);
            }
            // Offer to create a file from the error if we have a file not found and the name is valid and not readonly
            if (error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */ &&
                !this.filesConfigurationService.isReadonly(input.preferredResource) &&
                await this.pathService.hasValidBasename(input.preferredResource)) {
                const fileNotFoundError = (0, editor_1.createEditorOpenError)(new files_2.FileOperationError((0, nls_1.localize)('unavailableResourceErrorEditorText', "The editor could not be opened because the file was not found."), 1 /* FileOperationResult.FILE_NOT_FOUND */), [
                    (0, actions_1.toAction)({
                        id: 'workbench.files.action.createMissingFile', label: (0, nls_1.localize)('createFile', "Create File"), run: async () => {
                            await this.textFileService.create([{ resource: input.preferredResource }]);
                            return this.editorService.openEditor({
                                resource: input.preferredResource,
                                options: {
                                    pinned: true // new file gets pinned by default
                                }
                            });
                        }
                    })
                ], {
                    // Support the flow of directly pressing `Enter` on the dialog to
                    // create the file on the go. This is nice when for example following
                    // a link to a file that does not exist to scaffold it quickly.
                    allowDialog: true
                });
                throw fileNotFoundError;
            }
            // Otherwise make sure the error bubbles up
            throw error;
        }
        openAsBinary(input, options) {
            const defaultBinaryEditor = this.configurationService.getValue('workbench.editor.defaultBinaryEditor');
            const editorOptions = {
                ...options,
                // Make sure to not steal away the currently active group
                // because we are triggering another openEditor() call
                // and do not control the initial intent that resulted
                // in us now opening as binary.
                activation: editor_2.EditorActivation.PRESERVE
            };
            // Check configuration and determine whether we open the binary
            // file input in a different editor or going through the same
            // editor.
            // Going through the same editor is debt, and a better solution
            // would be to introduce a real editor for the binary case
            // and avoid enforcing binary or text on the file editor input.
            if (defaultBinaryEditor && defaultBinaryEditor !== '' && defaultBinaryEditor !== editor_1.DEFAULT_EDITOR_ASSOCIATION.id) {
                this.doOpenAsBinaryInDifferentEditor(this.group, defaultBinaryEditor, input, editorOptions);
            }
            else {
                this.doOpenAsBinaryInSameEditor(this.group, defaultBinaryEditor, input, editorOptions);
            }
        }
        doOpenAsBinaryInDifferentEditor(group, editorId, editor, editorOptions) {
            this.editorService.replaceEditors([{
                    editor,
                    replacement: { resource: editor.resource, options: { ...editorOptions, override: editorId } }
                }], group);
        }
        doOpenAsBinaryInSameEditor(group, editorId, editor, editorOptions) {
            // Open binary as text
            if (editorId === editor_1.DEFAULT_EDITOR_ASSOCIATION.id) {
                editor.setForceOpenAsText();
                editor.setPreferredLanguageId(files_1.BINARY_TEXT_FILE_MODE); // https://github.com/microsoft/vscode/issues/131076
                editorOptions = { ...editorOptions, forceReload: true }; // Same pane and same input, must force reload to clear cached state
            }
            // Open as binary
            else {
                editor.setForceOpenAsBinary();
            }
            group.openEditor(editor, editorOptions);
        }
        clearInput() {
            super.clearInput();
            // Clear Model
            this.editorControl?.setModel(null);
        }
        createEditorControl(parent, initialOptions) {
            (0, performance_1.mark)('code/willCreateTextFileEditorControl');
            super.createEditorControl(parent, initialOptions);
            (0, performance_1.mark)('code/didCreateTextFileEditorControl');
        }
        tracksEditorViewState(input) {
            return input instanceof fileEditorInput_1.FileEditorInput;
        }
        tracksDisposedEditorViewState() {
            return true; // track view state even for disposed editors
        }
    };
    exports.TextFileEditor = TextFileEditor;
    exports.TextFileEditor = TextFileEditor = TextFileEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, files_2.IFileService),
        __param(3, panecomposite_1.IPaneCompositePartService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, storage_1.IStorageService),
        __param(7, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(8, editorService_1.IEditorService),
        __param(9, themeService_1.IThemeService),
        __param(10, editorGroupsService_1.IEditorGroupsService),
        __param(11, textfiles_1.ITextFileService),
        __param(12, files_3.IExplorerService),
        __param(13, uriIdentity_1.IUriIdentityService),
        __param(14, pathService_1.IPathService),
        __param(15, configuration_1.IConfigurationService),
        __param(16, preferences_1.IPreferencesService),
        __param(17, host_1.IHostService),
        __param(18, filesConfigurationService_1.IFilesConfigurationService)
    ], TextFileEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ZpbGVzL2Jyb3dzZXIvZWRpdG9ycy90ZXh0RmlsZUVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBcUNoRzs7T0FFRztJQUNJLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSx1Q0FBNEM7O2lCQUUvRCxPQUFFLEdBQUcsMkJBQW1CLEFBQXRCLENBQXVCO1FBRXpDLFlBQ0MsS0FBbUIsRUFDQSxnQkFBbUMsRUFDeEMsV0FBeUIsRUFDSyxvQkFBK0MsRUFDcEUsb0JBQTJDLEVBQ3ZCLGNBQXdDLEVBQ2xFLGNBQStCLEVBQ2IsZ0NBQW1FLEVBQ3RGLGFBQTZCLEVBQzlCLFlBQTJCLEVBQ3BCLGtCQUF3QyxFQUMzQixlQUFpQyxFQUNqQyxlQUFpQyxFQUM5QixrQkFBdUMsRUFDOUMsV0FBeUIsRUFDaEIsb0JBQTJDLEVBQzNDLGtCQUF1QyxFQUNoRCxXQUF5QixFQUNYLHlCQUFxRDtZQUVsRyxLQUFLLENBQUMsZ0JBQWMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLGNBQWMsRUFBRSxnQ0FBZ0MsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLGtCQUFrQixFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBakI1SSx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQTJCO1lBRWhELG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQU1oRCxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDakMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQzlCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDOUMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDaEIseUJBQW9CLEdB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