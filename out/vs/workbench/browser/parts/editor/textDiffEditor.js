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
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/types", "vs/workbench/browser/parts/editor/textEditor", "vs/workbench/common/editor", "vs/workbench/common/editor/editorOptions", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/editor/textDiffEditorModel", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/registry/common/platform", "vs/base/common/uri", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/editor/common/editor", "vs/platform/contextkey/common/contextkey", "vs/base/common/resources", "vs/base/browser/dom", "vs/platform/files/common/files", "vs/workbench/services/preferences/common/preferences", "vs/base/common/stopwatch", "vs/editor/browser/widget/diffEditor/diffEditorWidget"], function (require, exports, nls_1, objects_1, types_1, textEditor_1, editor_1, editorOptions_1, diffEditorInput_1, textDiffEditorModel_1, telemetry_1, storage_1, textResourceConfiguration_1, instantiation_1, themeService_1, platform_1, uri_1, editorGroupsService_1, editorService_1, editor_2, contextkey_1, resources_1, dom_1, files_1, preferences_1, stopwatch_1, diffEditorWidget_1) {
    "use strict";
    var TextDiffEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextDiffEditor = void 0;
    /**
     * The text editor that leverages the diff text editor for the editing experience.
     */
    let TextDiffEditor = class TextDiffEditor extends textEditor_1.AbstractTextEditor {
        static { TextDiffEditor_1 = this; }
        static { this.ID = editor_1.TEXT_DIFF_EDITOR_ID; }
        get scopedContextKeyService() {
            if (!this.diffEditorControl) {
                return undefined;
            }
            const originalEditor = this.diffEditorControl.getOriginalEditor();
            const modifiedEditor = this.diffEditorControl.getModifiedEditor();
            return (originalEditor.hasTextFocus() ? originalEditor : modifiedEditor).invokeWithinContext(accessor => accessor.get(contextkey_1.IContextKeyService));
        }
        constructor(group, telemetryService, instantiationService, storageService, configurationService, editorService, themeService, editorGroupService, fileService, preferencesService) {
            super(TextDiffEditor_1.ID, group, telemetryService, instantiationService, storageService, configurationService, themeService, editorService, editorGroupService, fileService);
            this.preferencesService = preferencesService;
            this.diffEditorControl = undefined;
            this.inputLifecycleStopWatch = undefined;
            this._previousViewModel = null;
        }
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return (0, nls_1.localize)('textDiffEditor', "Text Diff Editor");
        }
        createEditorControl(parent, configuration) {
            this.diffEditorControl = this._register(this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, parent, configuration, {}));
        }
        updateEditorControlOptions(options) {
            this.diffEditorControl?.updateOptions(options);
        }
        getMainControl() {
            return this.diffEditorControl?.getModifiedEditor();
        }
        async setInput(input, options, context, token) {
            if (this._previousViewModel) {
                this._previousViewModel.dispose();
                this._previousViewModel = null;
            }
            // Cleanup previous things associated with the input
            this.inputLifecycleStopWatch = undefined;
            // Set input and resolve
            await super.setInput(input, options, context, token);
            try {
                const resolvedModel = await input.resolve();
                // Check for cancellation
                if (token.isCancellationRequested) {
                    return undefined;
                }
                // Fallback to open as binary if not text
                if (!(resolvedModel instanceof textDiffEditorModel_1.TextDiffEditorModel)) {
                    this.openAsBinary(input, options);
                    return undefined;
                }
                // Set Editor Model
                const control = (0, types_1.assertIsDefined)(this.diffEditorControl);
                const resolvedDiffEditorModel = resolvedModel;
                const vm = resolvedDiffEditorModel.textDiffEditorModel ? control.createViewModel(resolvedDiffEditorModel.textDiffEditorModel) : null;
                this._previousViewModel = vm;
                await vm?.waitForDiff();
                control.setModel(vm);
                // Restore view state (unless provided by options)
                let hasPreviousViewState = false;
                if (!(0, editor_1.isTextEditorViewState)(options?.viewState)) {
                    hasPreviousViewState = this.restoreTextDiffEditorViewState(input, options, context, control);
                }
                // Apply options to editor if any
                let optionsGotApplied = false;
                if (options) {
                    optionsGotApplied = (0, editorOptions_1.applyTextEditorOptions)(options, control, 1 /* ScrollType.Immediate */);
                }
                if (!optionsGotApplied && !hasPreviousViewState) {
                    control.revealFirstDiff();
                }
                // Since the resolved model provides information about being readonly
                // or not, we apply it here to the editor even though the editor input
                // was already asked for being readonly or not. The rationale is that
                // a resolved model might have more specific information about being
                // readonly or not that the input did not have.
                control.updateOptions({
                    ...this.getReadonlyConfiguration(resolvedDiffEditorModel.modifiedModel?.isReadonly()),
                    originalEditable: !resolvedDiffEditorModel.originalModel?.isReadonly()
                });
                control.handleInitialized();
                // Start to measure input lifecycle
                this.inputLifecycleStopWatch = new stopwatch_1.StopWatch(false);
            }
            catch (error) {
                await this.handleSetInputError(error, input, options);
            }
        }
        async handleSetInputError(error, input, options) {
            // Handle case where content appears to be binary
            if (this.isFileBinaryError(error)) {
                return this.openAsBinary(input, options);
            }
            // Handle case where a file is too large to open without confirmation
            if (error.fileOperationResult === 7 /* FileOperationResult.FILE_TOO_LARGE */) {
                let message;
                if (error instanceof files_1.TooLargeFileOperationError) {
                    message = (0, nls_1.localize)('fileTooLargeForHeapErrorWithSize', "At least one file is not displayed in the text compare editor because it is very large ({0}).", files_1.ByteSize.formatSize(error.size));
                }
                else {
                    message = (0, nls_1.localize)('fileTooLargeForHeapErrorWithoutSize', "At least one file is not displayed in the text compare editor because it is very large.");
                }
                throw (0, editor_1.createTooLargeFileError)(this.group, input, options, message, this.preferencesService);
            }
            // Otherwise make sure the error bubbles up
            throw error;
        }
        restoreTextDiffEditorViewState(editor, options, context, control) {
            const editorViewState = this.loadEditorViewState(editor, context);
            if (editorViewState) {
                if (options?.selection && editorViewState.modified) {
                    editorViewState.modified.cursorState = []; // prevent duplicate selections via options
                }
                control.restoreViewState(editorViewState);
                if (options?.revealIfVisible) {
                    control.revealFirstDiff();
                }
                return true;
            }
            return false;
        }
        openAsBinary(input, options) {
            const original = input.original;
            const modified = input.modified;
            const binaryDiffInput = this.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, input.getName(), input.getDescription(), original, modified, true);
            // Forward binary flag to input if supported
            const fileEditorFactory = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).getFileEditorFactory();
            if (fileEditorFactory.isFileEditor(original)) {
                original.setForceOpenAsBinary();
            }
            if (fileEditorFactory.isFileEditor(modified)) {
                modified.setForceOpenAsBinary();
            }
            // Replace this editor with the binary one
            this.group.replaceEditors([{
                    editor: input,
                    replacement: binaryDiffInput,
                    options: {
                        ...options,
                        // Make sure to not steal away the currently active group
                        // because we are triggering another openEditor() call
                        // and do not control the initial intent that resulted
                        // in us now opening as binary.
                        activation: editor_2.EditorActivation.PRESERVE,
                        pinned: this.group.isPinned(input),
                        sticky: this.group.isSticky(input)
                    }
                }]);
        }
        setOptions(options) {
            super.setOptions(options);
            if (options) {
                (0, editorOptions_1.applyTextEditorOptions)(options, (0, types_1.assertIsDefined)(this.diffEditorControl), 0 /* ScrollType.Smooth */);
            }
        }
        shouldHandleConfigurationChangeEvent(e, resource) {
            if (super.shouldHandleConfigurationChangeEvent(e, resource)) {
                return true;
            }
            return e.affectsConfiguration(resource, 'diffEditor') || e.affectsConfiguration(resource, 'accessibility.verbosity.diffEditor');
        }
        computeConfiguration(configuration) {
            const editorConfiguration = super.computeConfiguration(configuration);
            // Handle diff editor specially by merging in diffEditor configuration
            if ((0, types_1.isObject)(configuration.diffEditor)) {
                const diffEditorConfiguration = (0, objects_1.deepClone)(configuration.diffEditor);
                // User settings defines `diffEditor.codeLens`, but here we rename that to `diffEditor.diffCodeLens` to avoid collisions with `editor.codeLens`.
                diffEditorConfiguration.diffCodeLens = diffEditorConfiguration.codeLens;
                delete diffEditorConfiguration.codeLens;
                // User settings defines `diffEditor.wordWrap`, but here we rename that to `diffEditor.diffWordWrap` to avoid collisions with `editor.wordWrap`.
                diffEditorConfiguration.diffWordWrap = diffEditorConfiguration.wordWrap;
                delete diffEditorConfiguration.wordWrap;
                Object.assign(editorConfiguration, diffEditorConfiguration);
            }
            const verbose = configuration.accessibility?.verbosity?.diffEditor ?? false;
            editorConfiguration.accessibilityVerbose = verbose;
            return editorConfiguration;
        }
        getConfigurationOverrides(configuration) {
            return {
                ...super.getConfigurationOverrides(configuration),
                ...this.getReadonlyConfiguration(this.input?.isReadonly()),
                originalEditable: this.input instanceof diffEditorInput_1.DiffEditorInput && !this.input.original.isReadonly(),
                lineDecorationsWidth: '2ch'
            };
        }
        updateReadonly(input) {
            if (input instanceof diffEditorInput_1.DiffEditorInput) {
                this.diffEditorControl?.updateOptions({
                    ...this.getReadonlyConfiguration(input.isReadonly()),
                    originalEditable: !input.original.isReadonly(),
                });
            }
            else {
                super.updateReadonly(input);
            }
        }
        isFileBinaryError(error) {
            if (Array.isArray(error)) {
                const errors = error;
                return errors.some(error => this.isFileBinaryError(error));
            }
            return error.textFileOperationResult === 0 /* TextFileOperationResult.FILE_IS_BINARY */;
        }
        clearInput() {
            if (this._previousViewModel) {
                this._previousViewModel.dispose();
                this._previousViewModel = null;
            }
            super.clearInput();
            // Log input lifecycle telemetry
            const inputLifecycleElapsed = this.inputLifecycleStopWatch?.elapsed();
            this.inputLifecycleStopWatch = undefined;
            if (typeof inputLifecycleElapsed === 'number') {
                this.logInputLifecycleTelemetry(inputLifecycleElapsed, this.getControl()?.getModel()?.modified?.getLanguageId());
            }
            // Clear Model
            this.diffEditorControl?.setModel(null);
        }
        logInputLifecycleTelemetry(duration, languageId) {
            let collapseUnchangedRegions = false;
            if (this.diffEditorControl instanceof diffEditorWidget_1.DiffEditorWidget) {
                collapseUnchangedRegions = this.diffEditorControl.collapseUnchangedRegions;
            }
            this.telemetryService.publicLog2('diffEditor.editorVisibleTime', {
                editorVisibleTimeMs: duration,
                languageId: languageId ?? '',
                collapseUnchangedRegions,
            });
        }
        getControl() {
            return this.diffEditorControl;
        }
        focus() {
            super.focus();
            this.diffEditorControl?.focus();
        }
        hasFocus() {
            return this.diffEditorControl?.hasTextFocus() || super.hasFocus();
        }
        setEditorVisible(visible) {
            super.setEditorVisible(visible);
            if (visible) {
                this.diffEditorControl?.onVisible();
            }
            else {
                this.diffEditorControl?.onHide();
            }
        }
        layout(dimension) {
            this.diffEditorControl?.layout(dimension);
        }
        setBoundarySashes(sashes) {
            this.diffEditorControl?.setBoundarySashes(sashes);
        }
        tracksEditorViewState(input) {
            return input instanceof diffEditorInput_1.DiffEditorInput;
        }
        computeEditorViewState(resource) {
            if (!this.diffEditorControl) {
                return undefined;
            }
            const model = this.diffEditorControl.getModel();
            if (!model || !model.modified || !model.original) {
                return undefined; // view state always needs a model
            }
            const modelUri = this.toEditorViewStateResource(model);
            if (!modelUri) {
                return undefined; // model URI is needed to make sure we save the view state correctly
            }
            if (!(0, resources_1.isEqual)(modelUri, resource)) {
                return undefined; // prevent saving view state for a model that is not the expected one
            }
            return this.diffEditorControl.saveViewState() ?? undefined;
        }
        toEditorViewStateResource(modelOrInput) {
            let original;
            let modified;
            if (modelOrInput instanceof diffEditorInput_1.DiffEditorInput) {
                original = modelOrInput.original.resource;
                modified = modelOrInput.modified.resource;
            }
            else if (!(0, editor_1.isEditorInput)(modelOrInput)) {
                original = modelOrInput.original.uri;
                modified = modelOrInput.modified.uri;
            }
            if (!original || !modified) {
                return undefined;
            }
            // create a URI that is the Base64 concatenation of original + modified resource
            return uri_1.URI.from({ scheme: 'diff', path: `${(0, dom_1.multibyteAwareBtoa)(original.toString())}${(0, dom_1.multibyteAwareBtoa)(modified.toString())}` });
        }
    };
    exports.TextDiffEditor = TextDiffEditor;
    exports.TextDiffEditor = TextDiffEditor = TextDiffEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(5, editorService_1.IEditorService),
        __param(6, themeService_1.IThemeService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, files_1.IFileService),
        __param(9, preferences_1.IPreferencesService)
    ], TextDiffEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dERpZmZFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci90ZXh0RGlmZkVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBbUNoRzs7T0FFRztJQUNJLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSwrQkFBd0M7O2lCQUMzRCxPQUFFLEdBQUcsNEJBQW1CLEFBQXRCLENBQXVCO1FBTXpDLElBQWEsdUJBQXVCO1lBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ2xFLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBRWxFLE9BQU8sQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUM1SSxDQUFDO1FBRUQsWUFDQyxLQUFtQixFQUNBLGdCQUFtQyxFQUMvQixvQkFBMkMsRUFDakQsY0FBK0IsRUFDYixvQkFBdUQsRUFDMUUsYUFBNkIsRUFDOUIsWUFBMkIsRUFDcEIsa0JBQXdDLEVBQ2hELFdBQXlCLEVBQ2xCLGtCQUF3RDtZQUU3RSxLQUFLLENBQUMsZ0JBQWMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLGNBQWMsRUFBRSxvQkFBb0IsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLGtCQUFrQixFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRnRJLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUF6QnRFLHNCQUFpQixHQUE0QixTQUFTLENBQUM7WUFFdkQsNEJBQXVCLEdBQTBCLFNBQVMsQ0FBQztZQWdEM0QsdUJBQWtCLEdBQWdDLElBQUksQ0FBQztRQXRCL0QsQ0FBQztRQUVRLFFBQVE7WUFDaEIsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM3QixDQUFDO1lBRUQsT0FBTyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFFa0IsbUJBQW1CLENBQUMsTUFBbUIsRUFBRSxhQUFpQztZQUM1RixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1DQUFnQixFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNoSSxDQUFDO1FBRVMsMEJBQTBCLENBQUMsT0FBMkI7WUFDL0QsSUFBSSxDQUFDLGlCQUFpQixFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRVMsY0FBYztZQUN2QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxDQUFDO1FBQ3BELENBQUM7UUFJUSxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQXNCLEVBQUUsT0FBdUMsRUFBRSxPQUEyQixFQUFFLEtBQXdCO1lBQzdJLElBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztZQUNoQyxDQUFDO1lBRUQsb0RBQW9EO1lBQ3BELElBQUksQ0FBQyx1QkFBdUIsR0FBRyxTQUFTLENBQUM7WUFFekMsd0JBQXdCO1lBQ3hCLE1BQU0sS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVyRCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxhQUFhLEdBQUcsTUFBTSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRTVDLHlCQUF5QjtnQkFDekIsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztvQkFDbkMsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUM7Z0JBRUQseUNBQXlDO2dCQUN6QyxJQUFJLENBQUMsQ0FBQyxhQUFhLFlBQVkseUNBQW1CLENBQUMsRUFBRSxDQUFDO29CQUNyRCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDbEMsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUM7Z0JBRUQsbUJBQW1CO2dCQUNuQixNQUFNLE9BQU8sR0FBRyxJQUFBLHVCQUFlLEVBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQ3hELE1BQU0sdUJBQXVCLEdBQUcsYUFBb0MsQ0FBQztnQkFFckUsTUFBTSxFQUFFLEdBQUcsdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNySSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDO2dCQUM3QixNQUFNLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFckIsa0RBQWtEO2dCQUNsRCxJQUFJLG9CQUFvQixHQUFHLEtBQUssQ0FBQztnQkFDakMsSUFBSSxDQUFDLElBQUEsOEJBQXFCLEVBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUM7b0JBQ2hELG9CQUFvQixHQUFHLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDOUYsQ0FBQztnQkFFRCxpQ0FBaUM7Z0JBQ2pDLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDO2dCQUM5QixJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUNiLGlCQUFpQixHQUFHLElBQUEsc0NBQXNCLEVBQUMsT0FBTyxFQUFFLE9BQU8sK0JBQXVCLENBQUM7Z0JBQ3BGLENBQUM7Z0JBRUQsSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztvQkFDakQsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMzQixDQUFDO2dCQUVELHFFQUFxRTtnQkFDckUsc0VBQXNFO2dCQUN0RSxxRUFBcUU7Z0JBQ3JFLG9FQUFvRTtnQkFDcEUsK0NBQStDO2dCQUMvQyxPQUFPLENBQUMsYUFBYSxDQUFDO29CQUNyQixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyx1QkFBdUIsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLENBQUM7b0JBQ3JGLGdCQUFnQixFQUFFLENBQUMsdUJBQXVCLENBQUMsYUFBYSxFQUFFLFVBQVUsRUFBRTtpQkFDdEUsQ0FBQyxDQUFDO2dCQUVILE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUU1QixtQ0FBbUM7Z0JBQ25DLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLHFCQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckQsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdkQsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsbUJBQW1CLENBQUMsS0FBWSxFQUFFLEtBQXNCLEVBQUUsT0FBdUM7WUFFOUcsaURBQWlEO1lBQ2pELElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELHFFQUFxRTtZQUNyRSxJQUF5QixLQUFNLENBQUMsbUJBQW1CLCtDQUF1QyxFQUFFLENBQUM7Z0JBQzVGLElBQUksT0FBZSxDQUFDO2dCQUNwQixJQUFJLEtBQUssWUFBWSxrQ0FBMEIsRUFBRSxDQUFDO29CQUNqRCxPQUFPLEdBQUcsSUFBQSxjQUFRLEVBQUMsa0NBQWtDLEVBQUUsK0ZBQStGLEVBQUUsZ0JBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzFMLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLEdBQUcsSUFBQSxjQUFRLEVBQUMscUNBQXFDLEVBQUUseUZBQXlGLENBQUMsQ0FBQztnQkFDdEosQ0FBQztnQkFFRCxNQUFNLElBQUEsZ0NBQXVCLEVBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUM3RixDQUFDO1lBRUQsMkNBQTJDO1lBQzNDLE1BQU0sS0FBSyxDQUFDO1FBQ2IsQ0FBQztRQUVPLDhCQUE4QixDQUFDLE1BQXVCLEVBQUUsT0FBdUMsRUFBRSxPQUEyQixFQUFFLE9BQW9CO1lBQ3pKLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbEUsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxPQUFPLEVBQUUsU0FBUyxJQUFJLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDcEQsZUFBZSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDLENBQUMsMkNBQTJDO2dCQUN2RixDQUFDO2dCQUVELE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFFMUMsSUFBSSxPQUFPLEVBQUUsZUFBZSxFQUFFLENBQUM7b0JBQzlCLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDM0IsQ0FBQztnQkFFRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTyxZQUFZLENBQUMsS0FBc0IsRUFBRSxPQUF1QztZQUNuRixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1lBQ2hDLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7WUFFaEMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpQ0FBZSxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVySiw0Q0FBNEM7WUFDNUMsTUFBTSxpQkFBaUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIseUJBQWdCLENBQUMsYUFBYSxDQUFDLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUNySCxJQUFJLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUM5QyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUNqQyxDQUFDO1lBRUQsSUFBSSxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDOUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDakMsQ0FBQztZQUVELDBDQUEwQztZQUMxQyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUMxQixNQUFNLEVBQUUsS0FBSztvQkFDYixXQUFXLEVBQUUsZUFBZTtvQkFDNUIsT0FBTyxFQUFFO3dCQUNSLEdBQUcsT0FBTzt3QkFDVix5REFBeUQ7d0JBQ3pELHNEQUFzRDt3QkFDdEQsc0RBQXNEO3dCQUN0RCwrQkFBK0I7d0JBQy9CLFVBQVUsRUFBRSx5QkFBZ0IsQ0FBQyxRQUFRO3dCQUNyQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO3dCQUNsQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO3FCQUNsQztpQkFDRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFUSxVQUFVLENBQUMsT0FBdUM7WUFDMUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUUxQixJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLElBQUEsc0NBQXNCLEVBQUMsT0FBTyxFQUFFLElBQUEsdUJBQWUsRUFBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsNEJBQW9CLENBQUM7WUFDN0YsQ0FBQztRQUNGLENBQUM7UUFFa0Isb0NBQW9DLENBQUMsQ0FBd0MsRUFBRSxRQUFhO1lBQzlHLElBQUksS0FBSyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUM3RCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxPQUFPLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO1FBQ2pJLENBQUM7UUFFa0Isb0JBQW9CLENBQUMsYUFBbUM7WUFDMUUsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFdEUsc0VBQXNFO1lBQ3RFLElBQUksSUFBQSxnQkFBUSxFQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUN4QyxNQUFNLHVCQUF1QixHQUF1QixJQUFBLG1CQUFTLEVBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUV4RixnSkFBZ0o7Z0JBQ2hKLHVCQUF1QixDQUFDLFlBQVksR0FBRyx1QkFBdUIsQ0FBQyxRQUFRLENBQUM7Z0JBQ3hFLE9BQU8sdUJBQXVCLENBQUMsUUFBUSxDQUFDO2dCQUV4QyxnSkFBZ0o7Z0JBQ2hKLHVCQUF1QixDQUFDLFlBQVksR0FBeUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDO2dCQUM5RyxPQUFPLHVCQUF1QixDQUFDLFFBQVEsQ0FBQztnQkFFeEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBQzdELENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxVQUFVLElBQUksS0FBSyxDQUFDO1lBQzNFLG1CQUEwQyxDQUFDLG9CQUFvQixHQUFHLE9BQU8sQ0FBQztZQUUzRSxPQUFPLG1CQUFtQixDQUFDO1FBQzVCLENBQUM7UUFFa0IseUJBQXlCLENBQUMsYUFBbUM7WUFDL0UsT0FBTztnQkFDTixHQUFHLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxhQUFhLENBQUM7Z0JBQ2pELEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLENBQUM7Z0JBQzFELGdCQUFnQixFQUFFLElBQUksQ0FBQyxLQUFLLFlBQVksaUNBQWUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRTtnQkFDNUYsb0JBQW9CLEVBQUUsS0FBSzthQUMzQixDQUFDO1FBQ0gsQ0FBQztRQUVrQixjQUFjLENBQUMsS0FBa0I7WUFDbkQsSUFBSSxLQUFLLFlBQVksaUNBQWUsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsYUFBYSxDQUFDO29CQUNyQyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ3BELGdCQUFnQixFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUU7aUJBQzlDLENBQUMsQ0FBQztZQUNKLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzdCLENBQUM7UUFDRixDQUFDO1FBSU8saUJBQWlCLENBQUMsS0FBc0I7WUFDL0MsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLE1BQU0sTUFBTSxHQUFZLEtBQUssQ0FBQztnQkFFOUIsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDNUQsQ0FBQztZQUVELE9BQWdDLEtBQU0sQ0FBQyx1QkFBdUIsbURBQTJDLENBQUM7UUFDM0csQ0FBQztRQUVRLFVBQVU7WUFDbEIsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1lBQ2hDLENBQUM7WUFFRCxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7WUFFbkIsZ0NBQWdDO1lBQ2hDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ3RFLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxTQUFTLENBQUM7WUFDekMsSUFBSSxPQUFPLHFCQUFxQixLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLENBQUMsMEJBQTBCLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQ2xILENBQUM7WUFFRCxjQUFjO1lBQ2QsSUFBSSxDQUFDLGlCQUFpQixFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRU8sMEJBQTBCLENBQUMsUUFBZ0IsRUFBRSxVQUE4QjtZQUNsRixJQUFJLHdCQUF3QixHQUFHLEtBQUssQ0FBQztZQUNyQyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsWUFBWSxtQ0FBZ0IsRUFBRSxDQUFDO2dCQUN4RCx3QkFBd0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsd0JBQXdCLENBQUM7WUFDNUUsQ0FBQztZQUNELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBVTdCLDhCQUE4QixFQUFFO2dCQUNsQyxtQkFBbUIsRUFBRSxRQUFRO2dCQUM3QixVQUFVLEVBQUUsVUFBVSxJQUFJLEVBQUU7Z0JBQzVCLHdCQUF3QjthQUN4QixDQUFDLENBQUM7UUFDSixDQUFDO1FBRVEsVUFBVTtZQUNsQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztRQUMvQixDQUFDO1FBRVEsS0FBSztZQUNiLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVkLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNqQyxDQUFDO1FBRVEsUUFBUTtZQUNoQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbkUsQ0FBQztRQUVrQixnQkFBZ0IsQ0FBQyxPQUFnQjtZQUNuRCxLQUFLLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFaEMsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixJQUFJLENBQUMsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLENBQUM7WUFDckMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUNsQyxDQUFDO1FBQ0YsQ0FBQztRQUVRLE1BQU0sQ0FBQyxTQUFvQjtZQUNuQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFUSxpQkFBaUIsQ0FBQyxNQUF1QjtZQUNqRCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVrQixxQkFBcUIsQ0FBQyxLQUFrQjtZQUMxRCxPQUFPLEtBQUssWUFBWSxpQ0FBZSxDQUFDO1FBQ3pDLENBQUM7UUFFa0Isc0JBQXNCLENBQUMsUUFBYTtZQUN0RCxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzdCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEQsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2xELE9BQU8sU0FBUyxDQUFDLENBQUMsa0NBQWtDO1lBQ3JELENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkQsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLE9BQU8sU0FBUyxDQUFDLENBQUMsb0VBQW9FO1lBQ3ZGLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBQSxtQkFBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNsQyxPQUFPLFNBQVMsQ0FBQyxDQUFDLHFFQUFxRTtZQUN4RixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxFQUFFLElBQUksU0FBUyxDQUFDO1FBQzVELENBQUM7UUFFa0IseUJBQXlCLENBQUMsWUFBNEM7WUFDeEYsSUFBSSxRQUF5QixDQUFDO1lBQzlCLElBQUksUUFBeUIsQ0FBQztZQUU5QixJQUFJLFlBQVksWUFBWSxpQ0FBZSxFQUFFLENBQUM7Z0JBQzdDLFFBQVEsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztnQkFDMUMsUUFBUSxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1lBQzNDLENBQUM7aUJBQU0sSUFBSSxDQUFDLElBQUEsc0JBQWEsRUFBQyxZQUFZLENBQUMsRUFBRSxDQUFDO2dCQUN6QyxRQUFRLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7Z0JBQ3JDLFFBQVEsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztZQUN0QyxDQUFDO1lBRUQsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM1QixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsZ0ZBQWdGO1lBQ2hGLE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBQSx3QkFBa0IsRUFBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxJQUFBLHdCQUFrQixFQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ25JLENBQUM7O0lBcllXLHdDQUFjOzZCQUFkLGNBQWM7UUFvQnhCLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLDZEQUFpQyxDQUFBO1FBQ2pDLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEsNEJBQWEsQ0FBQTtRQUNiLFdBQUEsMENBQW9CLENBQUE7UUFDcEIsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxpQ0FBbUIsQ0FBQTtPQTVCVCxjQUFjLENBc1kxQiJ9