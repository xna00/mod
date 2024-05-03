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
define(["require", "exports", "vs/base/common/types", "vs/workbench/common/editor", "vs/workbench/common/editor/editorOptions", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/common/editor/textEditorModel", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/browser/parts/editor/textCodeEditor", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/languages/modesRegistry", "vs/platform/files/common/files"], function (require, exports, types_1, editor_1, editorOptions_1, textResourceEditorInput_1, textEditorModel_1, untitledTextEditorInput_1, textCodeEditor_1, telemetry_1, storage_1, textResourceConfiguration_1, instantiation_1, themeService_1, editorGroupsService_1, editorService_1, model_1, language_1, modesRegistry_1, files_1) {
    "use strict";
    var TextResourceEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextResourceEditor = exports.AbstractTextResourceEditor = void 0;
    /**
     * An editor implementation that is capable of showing the contents of resource inputs. Uses
     * the TextEditor widget to show the contents.
     */
    let AbstractTextResourceEditor = class AbstractTextResourceEditor extends textCodeEditor_1.AbstractTextCodeEditor {
        constructor(id, group, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, editorService, fileService) {
            super(id, group, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService, fileService);
        }
        async setInput(input, options, context, token) {
            // Set input and resolve
            await super.setInput(input, options, context, token);
            const resolvedModel = await input.resolve();
            // Check for cancellation
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Assert Model instance
            if (!(resolvedModel instanceof textEditorModel_1.BaseTextEditorModel)) {
                throw new Error('Unable to open file as text');
            }
            // Set Editor Model
            const control = (0, types_1.assertIsDefined)(this.editorControl);
            const textEditorModel = resolvedModel.textEditorModel;
            control.setModel(textEditorModel);
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
            control.updateOptions(this.getReadonlyConfiguration(resolvedModel.isReadonly()));
        }
        /**
         * Reveals the last line of this editor if it has a model set.
         */
        revealLastLine() {
            const control = this.editorControl;
            if (!control) {
                return;
            }
            const model = control.getModel();
            if (model) {
                const lastLine = model.getLineCount();
                control.revealPosition({ lineNumber: lastLine, column: model.getLineMaxColumn(lastLine) }, 0 /* ScrollType.Smooth */);
            }
        }
        clearInput() {
            super.clearInput();
            // Clear Model
            this.editorControl?.setModel(null);
        }
        tracksEditorViewState(input) {
            // editor view state persistence is only enabled for untitled and resource inputs
            return input instanceof untitledTextEditorInput_1.UntitledTextEditorInput || input instanceof textResourceEditorInput_1.TextResourceEditorInput;
        }
    };
    exports.AbstractTextResourceEditor = AbstractTextResourceEditor;
    exports.AbstractTextResourceEditor = AbstractTextResourceEditor = __decorate([
        __param(2, telemetry_1.ITelemetryService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, storage_1.IStorageService),
        __param(5, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(6, themeService_1.IThemeService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, editorService_1.IEditorService),
        __param(9, files_1.IFileService)
    ], AbstractTextResourceEditor);
    let TextResourceEditor = class TextResourceEditor extends AbstractTextResourceEditor {
        static { TextResourceEditor_1 = this; }
        static { this.ID = 'workbench.editors.textResourceEditor'; }
        constructor(group, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService, modelService, languageService, fileService) {
            super(TextResourceEditor_1.ID, group, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, editorService, fileService);
            this.modelService = modelService;
            this.languageService = languageService;
        }
        createEditorControl(parent, configuration) {
            super.createEditorControl(parent, configuration);
            // Install a listener for paste to update this editors
            // language if the paste includes a specific language
            const control = this.editorControl;
            if (control) {
                this._register(control.onDidPaste(e => this.onDidEditorPaste(e, control)));
            }
        }
        onDidEditorPaste(e, codeEditor) {
            if (this.input instanceof untitledTextEditorInput_1.UntitledTextEditorInput && this.input.hasLanguageSetExplicitly) {
                return; // do not override language if it was set explicitly
            }
            if (e.range.startLineNumber !== 1 || e.range.startColumn !== 1) {
                return; // document had existing content before the pasted text, don't override.
            }
            if (codeEditor.getOption(91 /* EditorOption.readOnly */)) {
                return; // not for readonly editors
            }
            const textModel = codeEditor.getModel();
            if (!textModel) {
                return; // require a live model
            }
            const pasteIsWholeContents = textModel.getLineCount() === e.range.endLineNumber && textModel.getLineMaxColumn(e.range.endLineNumber) === e.range.endColumn;
            if (!pasteIsWholeContents) {
                return; // document had existing content after the pasted text, don't override.
            }
            const currentLanguageId = textModel.getLanguageId();
            if (currentLanguageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                return; // require current languageId to be unspecific
            }
            let candidateLanguage = undefined;
            // A languageId is provided via the paste event so text was copied using
            // VSCode. As such we trust this languageId and use it if specific
            if (e.languageId) {
                candidateLanguage = { id: e.languageId, source: 'event' };
            }
            // A languageId was not provided, so the data comes from outside VSCode
            // We can still try to guess a good languageId from the first line if
            // the paste changed the first line
            else {
                const guess = this.languageService.guessLanguageIdByFilepathOrFirstLine(textModel.uri, textModel.getLineContent(1).substr(0, 1000 /* ModelConstants.FIRST_LINE_DETECTION_LENGTH_LIMIT */)) ?? undefined;
                if (guess) {
                    candidateLanguage = { id: guess, source: 'guess' };
                }
            }
            // Finally apply languageId to model if specified
            if (candidateLanguage && candidateLanguage.id !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                if (this.input instanceof untitledTextEditorInput_1.UntitledTextEditorInput && candidateLanguage.source === 'event') {
                    // High confidence, set language id at TextEditorModel level to block future auto-detection
                    this.input.setLanguageId(candidateLanguage.id);
                }
                else {
                    textModel.setLanguage(this.languageService.createById(candidateLanguage.id));
                }
                const opts = this.modelService.getCreationOptions(textModel.getLanguageId(), textModel.uri, textModel.isForSimpleWidget);
                textModel.detectIndentation(opts.insertSpaces, opts.tabSize);
            }
        }
    };
    exports.TextResourceEditor = TextResourceEditor;
    exports.TextResourceEditor = TextResourceEditor = TextResourceEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(5, themeService_1.IThemeService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, model_1.IModelService),
        __param(9, language_1.ILanguageService),
        __param(10, files_1.IFileService)
    ], TextResourceEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFJlc291cmNlRWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvdGV4dFJlc291cmNlRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE0QmhHOzs7T0FHRztJQUNJLElBQWUsMEJBQTBCLEdBQXpDLE1BQWUsMEJBQTJCLFNBQVEsdUNBQTRDO1FBRXBHLFlBQ0MsRUFBVSxFQUNWLEtBQW1CLEVBQ0EsZ0JBQW1DLEVBQy9CLG9CQUEyQyxFQUNqRCxjQUErQixFQUNiLGdDQUFtRSxFQUN2RixZQUEyQixFQUNwQixrQkFBd0MsRUFDOUMsYUFBNkIsRUFDL0IsV0FBeUI7WUFFdkMsS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLEVBQUUsY0FBYyxFQUFFLGdDQUFnQyxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDMUssQ0FBQztRQUVRLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBc0MsRUFBRSxPQUF1QyxFQUFFLE9BQTJCLEVBQUUsS0FBd0I7WUFFN0osd0JBQXdCO1lBQ3hCLE1BQU0sS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyRCxNQUFNLGFBQWEsR0FBRyxNQUFNLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUU1Qyx5QkFBeUI7WUFDekIsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELHdCQUF3QjtZQUN4QixJQUFJLENBQUMsQ0FBQyxhQUFhLFlBQVkscUNBQW1C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