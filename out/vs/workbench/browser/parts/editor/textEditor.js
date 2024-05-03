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
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/event", "vs/base/common/types", "vs/base/common/lifecycle", "vs/workbench/browser/editor", "vs/workbench/browser/parts/editor/editorWithViewState", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/files/common/files"], function (require, exports, nls_1, objects_1, event_1, types_1, lifecycle_1, editor_1, editorWithViewState_1, storage_1, instantiation_1, telemetry_1, themeService_1, textResourceConfiguration_1, editorGroupsService_1, editorService_1, files_1) {
    "use strict";
    var AbstractTextEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextEditorPaneSelection = exports.AbstractTextEditor = void 0;
    /**
     * The base class of editors that leverage any kind of text editor for the editing experience.
     */
    let AbstractTextEditor = class AbstractTextEditor extends editorWithViewState_1.AbstractEditorWithViewState {
        static { AbstractTextEditor_1 = this; }
        static { this.VIEW_STATE_PREFERENCE_KEY = 'textEditorViewState'; }
        constructor(id, group, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService, fileService) {
            super(id, group, AbstractTextEditor_1.VIEW_STATE_PREFERENCE_KEY, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService);
            this.fileService = fileService;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeScroll = this._register(new event_1.Emitter());
            this.onDidChangeScroll = this._onDidChangeScroll.event;
            this.inputListener = this._register(new lifecycle_1.MutableDisposable());
            // Listen to configuration changes
            this._register(this.textResourceConfigurationService.onDidChangeConfiguration(e => this.handleConfigurationChangeEvent(e)));
            // ARIA: if a group is added or removed, update the editor's ARIA
            // label so that it appears in the label for when there are > 1 groups
            this._register(event_1.Event.any(this.editorGroupService.onDidAddGroup, this.editorGroupService.onDidRemoveGroup)(() => {
                const ariaLabel = this.computeAriaLabel();
                this.editorContainer?.setAttribute('aria-label', ariaLabel);
                this.updateEditorControlOptions({ ariaLabel });
            }));
            // Listen to file system provider changes
            this._register(this.fileService.onDidChangeFileSystemProviderCapabilities(e => this.onDidChangeFileSystemProvider(e.scheme)));
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(e => this.onDidChangeFileSystemProvider(e.scheme)));
        }
        handleConfigurationChangeEvent(e) {
            const resource = this.getActiveResource();
            if (!this.shouldHandleConfigurationChangeEvent(e, resource)) {
                return;
            }
            if (this.isVisible()) {
                this.updateEditorConfiguration(resource);
            }
            else {
                this.hasPendingConfigurationChange = true;
            }
        }
        shouldHandleConfigurationChangeEvent(e, resource) {
            return e.affectsConfiguration(resource, 'editor') || e.affectsConfiguration(resource, 'problems.visibility');
        }
        consumePendingConfigurationChangeEvent() {
            if (this.hasPendingConfigurationChange) {
                this.updateEditorConfiguration();
                this.hasPendingConfigurationChange = false;
            }
        }
        computeConfiguration(configuration) {
            // Specific editor options always overwrite user configuration
            const editorConfiguration = (0, types_1.isObject)(configuration.editor) ? (0, objects_1.deepClone)(configuration.editor) : Object.create(null);
            Object.assign(editorConfiguration, this.getConfigurationOverrides(configuration));
            // ARIA label
            editorConfiguration.ariaLabel = this.computeAriaLabel();
            return editorConfiguration;
        }
        computeAriaLabel() {
            return this.input ? (0, editor_1.computeEditorAriaLabel)(this.input, undefined, this.group, this.editorGroupService.count) : (0, nls_1.localize)('editor', "Editor");
        }
        onDidChangeFileSystemProvider(scheme) {
            if (!this.input) {
                return;
            }
            if (this.getActiveResource()?.scheme === scheme) {
                this.updateReadonly(this.input);
            }
        }
        onDidChangeInputCapabilities(input) {
            if (this.input === input) {
                this.updateReadonly(input);
            }
        }
        updateReadonly(input) {
            this.updateEditorControlOptions({ ...this.getReadonlyConfiguration(input.isReadonly()) });
        }
        getReadonlyConfiguration(isReadonly) {
            return {
                readOnly: !!isReadonly,
                readOnlyMessage: typeof isReadonly !== 'boolean' ? isReadonly : undefined
            };
        }
        getConfigurationOverrides(configuration) {
            return {
                overviewRulerLanes: 3,
                lineNumbersMinChars: 3,
                fixedOverflowWidgets: true,
                ...this.getReadonlyConfiguration(this.input?.isReadonly()),
                renderValidationDecorations: configuration.problems?.visibility !== false ? 'on' : 'off'
            };
        }
        createEditor(parent) {
            // Create editor control
            this.editorContainer = parent;
            this.createEditorControl(parent, this.computeConfiguration(this.textResourceConfigurationService.getValue(this.getActiveResource())));
            // Listeners
            this.registerCodeEditorListeners();
        }
        registerCodeEditorListeners() {
            const mainControl = this.getMainControl();
            if (mainControl) {
                this._register(mainControl.onDidChangeModelLanguage(() => this.updateEditorConfiguration()));
                this._register(mainControl.onDidChangeModel(() => this.updateEditorConfiguration()));
                this._register(mainControl.onDidChangeCursorPosition(e => this._onDidChangeSelection.fire({ reason: this.toEditorPaneSelectionChangeReason(e) })));
                this._register(mainControl.onDidChangeModelContent(() => this._onDidChangeSelection.fire({ reason: 3 /* EditorPaneSelectionChangeReason.EDIT */ })));
                this._register(mainControl.onDidScrollChange(() => this._onDidChangeScroll.fire()));
            }
        }
        toEditorPaneSelectionChangeReason(e) {
            switch (e.source) {
                case "api" /* TextEditorSelectionSource.PROGRAMMATIC */: return 1 /* EditorPaneSelectionChangeReason.PROGRAMMATIC */;
                case "code.navigation" /* TextEditorSelectionSource.NAVIGATION */: return 4 /* EditorPaneSelectionChangeReason.NAVIGATION */;
                case "code.jump" /* TextEditorSelectionSource.JUMP */: return 5 /* EditorPaneSelectionChangeReason.JUMP */;
                default: return 2 /* EditorPaneSelectionChangeReason.USER */;
            }
        }
        getSelection() {
            const mainControl = this.getMainControl();
            if (mainControl) {
                const selection = mainControl.getSelection();
                if (selection) {
                    return new TextEditorPaneSelection(selection);
                }
            }
            return undefined;
        }
        async setInput(input, options, context, token) {
            await super.setInput(input, options, context, token);
            // Update our listener for input capabilities
            this.inputListener.value = input.onDidChangeCapabilities(() => this.onDidChangeInputCapabilities(input));
            // Update editor options after having set the input. We do this because there can be
            // editor input specific options (e.g. an ARIA label depending on the input showing)
            this.updateEditorConfiguration();
            // Update aria label on editor
            const editorContainer = (0, types_1.assertIsDefined)(this.editorContainer);
            editorContainer.setAttribute('aria-label', this.computeAriaLabel());
        }
        clearInput() {
            // Clear input listener
            this.inputListener.clear();
            super.clearInput();
        }
        getScrollPosition() {
            const editor = this.getMainControl();
            if (!editor) {
                throw new Error('Control has not yet been initialized');
            }
            return {
                // The top position can vary depending on the view zones (find widget for example)
                scrollTop: editor.getScrollTop() - editor.getTopForLineNumber(1),
                scrollLeft: editor.getScrollLeft(),
            };
        }
        setScrollPosition(scrollPosition) {
            const editor = this.getMainControl();
            if (!editor) {
                throw new Error('Control has not yet been initialized');
            }
            editor.setScrollTop(scrollPosition.scrollTop);
            if (scrollPosition.scrollLeft) {
                editor.setScrollLeft(scrollPosition.scrollLeft);
            }
        }
        setEditorVisible(visible) {
            if (visible) {
                this.consumePendingConfigurationChangeEvent();
            }
            super.setEditorVisible(visible);
        }
        toEditorViewStateResource(input) {
            return input.resource;
        }
        updateEditorConfiguration(resource = this.getActiveResource()) {
            let configuration = undefined;
            if (resource) {
                configuration = this.textResourceConfigurationService.getValue(resource);
            }
            if (!configuration) {
                return;
            }
            const editorConfiguration = this.computeConfiguration(configuration);
            // Try to figure out the actual editor options that changed from the last time we updated the editor.
            // We do this so that we are not overwriting some dynamic editor settings (e.g. word wrap) that might
            // have been applied to the editor directly.
            let editorSettingsToApply = editorConfiguration;
            if (this.lastAppliedEditorOptions) {
                editorSettingsToApply = (0, objects_1.distinct)(this.lastAppliedEditorOptions, editorSettingsToApply);
            }
            if (Object.keys(editorSettingsToApply).length > 0) {
                this.lastAppliedEditorOptions = editorConfiguration;
                this.updateEditorControlOptions(editorSettingsToApply);
            }
        }
        getActiveResource() {
            const mainControl = this.getMainControl();
            if (mainControl) {
                const model = mainControl.getModel();
                if (model) {
                    return model.uri;
                }
            }
            if (this.input) {
                return this.input.resource;
            }
            return undefined;
        }
        dispose() {
            this.lastAppliedEditorOptions = undefined;
            super.dispose();
        }
    };
    exports.AbstractTextEditor = AbstractTextEditor;
    exports.AbstractTextEditor = AbstractTextEditor = AbstractTextEditor_1 = __decorate([
        __param(2, telemetry_1.ITelemetryService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, storage_1.IStorageService),
        __param(5, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(6, themeService_1.IThemeService),
        __param(7, editorService_1.IEditorService),
        __param(8, editorGroupsService_1.IEditorGroupsService),
        __param(9, files_1.IFileService)
    ], AbstractTextEditor);
    class TextEditorPaneSelection {
        static { this.TEXT_EDITOR_SELECTION_THRESHOLD = 10; } // number of lines to move in editor to justify for significant change
        constructor(textSelection) {
            this.textSelection = textSelection;
        }
        compare(other) {
            if (!(other instanceof TextEditorPaneSelection)) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            const thisLineNumber = Math.min(this.textSelection.selectionStartLineNumber, this.textSelection.positionLineNumber);
            const otherLineNumber = Math.min(other.textSelection.selectionStartLineNumber, other.textSelection.positionLineNumber);
            if (thisLineNumber === otherLineNumber) {
                return 1 /* EditorPaneSelectionCompareResult.IDENTICAL */;
            }
            if (Math.abs(thisLineNumber - otherLineNumber) < TextEditorPaneSelection.TEXT_EDITOR_SELECTION_THRESHOLD) {
                return 2 /* EditorPaneSelectionCompareResult.SIMILAR */; // when in close proximity, treat selection as being similar
            }
            return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
        }
        restore(options) {
            const textEditorOptions = {
                ...options,
                selection: this.textSelection,
                selectionRevealType: 1 /* TextEditorSelectionRevealType.CenterIfOutsideViewport */
            };
            return textEditorOptions;
        }
        log() {
            return `line: ${this.textSelection.startLineNumber}-${this.textSelection.endLineNumber}, col:  ${this.textSelection.startColumn}-${this.textSelection.endColumn}`;
        }
    }
    exports.TextEditorPaneSelection = TextEditorPaneSelection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL3RleHRFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTBDaEc7O09BRUc7SUFDSSxJQUFlLGtCQUFrQixHQUFqQyxNQUFlLGtCQUErQyxTQUFRLGlEQUE4Qjs7aUJBRWxGLDhCQUF5QixHQUFHLHFCQUFxQixBQUF4QixDQUF5QjtRQWUxRSxZQUNDLEVBQVUsRUFDVixLQUFtQixFQUNBLGdCQUFtQyxFQUMvQixvQkFBMkMsRUFDakQsY0FBK0IsRUFDYixnQ0FBbUUsRUFDdkYsWUFBMkIsRUFDMUIsYUFBNkIsRUFDdkIsa0JBQXdDLEVBQ2hELFdBQTRDO1lBRTFELEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLG9CQUFrQixDQUFDLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLGNBQWMsRUFBRSxnQ0FBZ0MsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFGekssZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUF2QnhDLDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW1DLENBQUMsQ0FBQztZQUNqRyx5QkFBb0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBRTlDLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ25FLHNCQUFpQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFPMUMsa0JBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FB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