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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/grid/grid", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/resources", "vs/base/common/types", "vs/editor/browser/services/codeEditorService", "vs/editor/common/services/textResourceConfiguration", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/textEditor", "vs/workbench/common/editor", "vs/workbench/common/editor/editorOptions", "vs/workbench/contrib/codeEditor/browser/toggleWordWrap", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInput", "vs/workbench/contrib/mergeEditor/browser/utils", "vs/workbench/contrib/mergeEditor/browser/view/editors/baseCodeEditorView", "vs/workbench/contrib/mergeEditor/browser/view/scrollSynchronizer", "vs/workbench/contrib/mergeEditor/browser/view/viewModel", "vs/workbench/contrib/mergeEditor/browser/view/viewZones", "vs/workbench/contrib/mergeEditor/common/mergeEditor", "vs/workbench/contrib/preferences/common/settingsEditorColorRegistry", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/editor/common/editorService", "./editors/inputCodeEditorView", "./editors/resultCodeEditorView", "vs/css!./media/mergeEditor", "./colors"], function (require, exports, dom_1, grid_1, color_1, errors_1, event_1, lifecycle_1, observable_1, resources_1, types_1, codeEditorService_1, textResourceConfiguration_1, nls_1, configuration_1, contextkey_1, files_1, instantiation_1, storage_1, telemetry_1, themeService_1, textEditor_1, editor_1, editorOptions_1, toggleWordWrap_1, mergeEditorInput_1, utils_1, baseCodeEditorView_1, scrollSynchronizer_1, viewModel_1, viewZones_1, mergeEditor_1, settingsEditorColorRegistry_1, editorGroupsService_1, editorResolverService_1, editorService_1, inputCodeEditorView_1, resultCodeEditorView_1) {
    "use strict";
    var MergeEditor_1, MergeEditorLayoutStore_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorResolverContribution = exports.MergeEditorOpenHandlerContribution = exports.MergeEditor = void 0;
    let MergeEditor = class MergeEditor extends textEditor_1.AbstractTextEditor {
        static { MergeEditor_1 = this; }
        static { this.ID = 'mergeEditor'; }
        get viewModel() {
            return this._viewModel;
        }
        get inputModel() {
            return this._inputModel;
        }
        get model() {
            return this.inputModel.get()?.model;
        }
        get inputsWritable() {
            return !!this._configurationService.getValue('mergeEditor.writableInputs');
        }
        constructor(group, instantiation, contextKeyService, telemetryService, storageService, themeService, textResourceConfigurationService, _configurationService, editorService, editorGroupService, fileService, _codeEditorService, configurationService) {
            super(MergeEditor_1.ID, group, telemetryService, instantiation, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService, fileService);
            this.contextKeyService = contextKeyService;
            this._configurationService = _configurationService;
            this._codeEditorService = _codeEditorService;
            this.configurationService = configurationService;
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this._viewModel = (0, observable_1.observableValue)(this, undefined);
            this._grid = this._register(new lifecycle_1.MutableDisposable());
            this.input1View = this._register(this.instantiationService.createInstance(inputCodeEditorView_1.InputCodeEditorView, 1, this._viewModel));
            this.baseView = (0, observable_1.observableValue)(this, undefined);
            this.baseViewOptions = (0, observable_1.observableValue)(this, undefined);
            this.input2View = this._register(this.instantiationService.createInstance(inputCodeEditorView_1.InputCodeEditorView, 2, this._viewModel));
            this.inputResultView = this._register(this.instantiationService.createInstance(resultCodeEditorView_1.ResultCodeEditorView, this._viewModel));
            this._layoutMode = this.instantiationService.createInstance(MergeEditorLayoutStore);
            this._layoutModeObs = (0, observable_1.observableValue)(this, this._layoutMode.value);
            this._ctxIsMergeEditor = mergeEditor_1.ctxIsMergeEditor.bindTo(this.contextKeyService);
            this._ctxUsesColumnLayout = mergeEditor_1.ctxMergeEditorLayout.bindTo(this.contextKeyService);
            this._ctxShowBase = mergeEditor_1.ctxMergeEditorShowBase.bindTo(this.contextKeyService);
            this._ctxShowBaseAtTop = mergeEditor_1.ctxMergeEditorShowBaseAtTop.bindTo(this.contextKeyService);
            this._ctxResultUri = mergeEditor_1.ctxMergeResultUri.bindTo(this.contextKeyService);
            this._ctxBaseUri = mergeEditor_1.ctxMergeBaseUri.bindTo(this.contextKeyService);
            this._ctxShowNonConflictingChanges = mergeEditor_1.ctxMergeEditorShowNonConflictingChanges.bindTo(this.contextKeyService);
            this._inputModel = (0, observable_1.observableValue)(this, undefined);
            this.viewZoneComputer = new viewZones_1.ViewZoneComputer(this.input1View.editor, this.input2View.editor, this.inputResultView.editor);
            this.codeLensesVisible = (0, utils_1.observableConfigValue)('mergeEditor.showCodeLenses', true, this.configurationService);
            this.scrollSynchronizer = this._register(new scrollSynchronizer_1.ScrollSynchronizer(this._viewModel, this.input1View, this.input2View, this.baseView, this.inputResultView, this._layoutModeObs));
            // #region layout constraints
            this._onDidChangeSizeConstraints = new event_1.Emitter();
            this.onDidChangeSizeConstraints = this._onDidChangeSizeConstraints.event;
            this.baseViewDisposables = this._register(new lifecycle_1.DisposableStore());
            this.showNonConflictingChangesStore = this.instantiationService.createInstance((utils_1.PersistentStore), 'mergeEditor/showNonConflictingChanges');
            this.showNonConflictingChanges = (0, observable_1.observableValue)(this, this.showNonConflictingChangesStore.get() ?? false);
        }
        dispose() {
            this._sessionDisposables.dispose();
            this._ctxIsMergeEditor.reset();
            this._ctxUsesColumnLayout.reset();
            this._ctxShowNonConflictingChanges.reset();
            super.dispose();
        }
        get minimumWidth() {
            return this._layoutMode.value.kind === 'mixed'
                ? this.input1View.view.minimumWidth + this.input2View.view.minimumWidth
                : this.input1View.view.minimumWidth + this.input2View.view.minimumWidth + this.inputResultView.view.minimumWidth;
        }
        // #endregion
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return (0, nls_1.localize)('mergeEditor', "Text Merge Editor");
        }
        createEditorControl(parent, initialOptions) {
            this.rootHtmlElement = parent;
            parent.classList.add('merge-editor');
            this.applyLayout(this._layoutMode.value);
            this.applyOptions(initialOptions);
        }
        updateEditorControlOptions(options) {
            this.applyOptions(options);
        }
        applyOptions(options) {
            const inputOptions = (0, utils_1.deepMerge)(options, {
                minimap: { enabled: false },
                glyphMargin: false,
                lineNumbersMinChars: 2,
                readOnly: !this.inputsWritable
            });
            this.input1View.updateOptions(inputOptions);
            this.input2View.updateOptions(inputOptions);
            this.baseViewOptions.set({ ...this.input2View.editor.getRawOptions() }, undefined);
            this.inputResultView.updateOptions(options);
        }
        getMainControl() {
            return this.inputResultView.editor;
        }
        layout(dimension) {
            this._grid.value?.layout(dimension.width, dimension.height);
        }
        async setInput(input, options, context, token) {
            if (!(input instanceof mergeEditorInput_1.MergeEditorInput)) {
                throw new errors_1.BugIndicatingError('ONLY MergeEditorInput is supported');
            }
            await super.setInput(input, options, context, token);
            this._sessionDisposables.clear();
            (0, observable_1.transaction)(tx => {
                this._viewModel.set(undefined, tx);
                this._inputModel.set(undefined, tx);
            });
            const inputModel = await input.resolve();
            const model = inputModel.model;
            const viewModel = this.instantiationService.createInstance(viewModel_1.MergeEditorViewModel, model, this.input1View, this.input2View, this.inputResultView, this.baseView, this.showNonConflictingChanges);
            model.telemetry.reportMergeEditorOpened({
                combinableConflictCount: model.combinableConflictCount,
                conflictCount: model.conflictCount,
                baseTop: this._layoutModeObs.get().showBaseAtTop,
                baseVisible: this._layoutModeObs.get().showBase,
                isColumnView: this._layoutModeObs.get().kind === 'columns',
            });
            (0, observable_1.transaction)(tx => {
                this._viewModel.set(viewModel, tx);
                this._inputModel.set(inputModel, tx);
            });
            this._sessionDisposables.add(viewModel);
            // Set/unset context keys based on input
            this._ctxResultUri.set(inputModel.resultUri.toString());
            this._ctxBaseUri.set(model.base.uri.toString());
            this._sessionDisposables.add((0, lifecycle_1.toDisposable)(() => {
                this._ctxBaseUri.reset();
                this._ctxResultUri.reset();
            }));
            // Set the view zones before restoring view state!
            // Otherwise scrolling will be off
            this._sessionDisposables.add((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description update alignment view zones */
                const baseView = this.baseView.read(reader);
                this.inputResultView.editor.changeViewZones(resultViewZoneAccessor => {
                    const layout = this._layoutModeObs.read(reader);
                    const shouldAlignResult = layout.kind === 'columns';
                    const shouldAlignBase = layout.kind === 'mixed' && !layout.showBaseAtTop;
                    this.input1View.editor.changeViewZones(input1ViewZoneAccessor => {
                        this.input2View.editor.changeViewZones(input2ViewZoneAccessor => {
                            if (baseView) {
                                baseView.editor.changeViewZones(baseViewZoneAccessor => {
                                    store.add(this.setViewZones(reader, viewModel, this.input1View.editor, input1ViewZoneAccessor, this.input2View.editor, input2ViewZoneAccessor, baseView.editor, baseViewZoneAccessor, shouldAlignBase, this.inputResultView.editor, resultViewZoneAccessor, shouldAlignResult));
                                });
                            }
                            else {
                                store.add(this.setViewZones(reader, viewModel, this.input1View.editor, input1ViewZoneAccessor, this.input2View.editor, input2ViewZoneAccessor, undefined, undefined, false, this.inputResultView.editor, resultViewZoneAccessor, shouldAlignResult));
                            }
                        });
                    });
                });
                this.scrollSynchronizer.updateScrolling();
            }));
            const viewState = this.loadEditorViewState(input, context);
            if (viewState) {
                this._applyViewState(viewState);
            }
            else {
                this._sessionDisposables.add((0, utils_1.thenIfNotDisposed)(model.onInitialized, () => {
                    const firstConflict = model.modifiedBaseRanges.get().find(r => r.isConflicting);
                    if (!firstConflict) {
                        return;
                    }
                    this.input1View.editor.revealLineInCenter(firstConflict.input1Range.startLineNumber);
                    (0, observable_1.transaction)(tx => {
                        /** @description setActiveModifiedBaseRange */
                        viewModel.setActiveModifiedBaseRange(firstConflict, tx);
                    });
                }));
            }
            // word wrap special case - sync transient state from result model to input[1|2] models
            const mirrorWordWrapTransientState = (candidate) => {
                const candidateState = (0, toggleWordWrap_1.readTransientState)(candidate, this._codeEditorService);
                (0, toggleWordWrap_1.writeTransientState)(model.input2.textModel, candidateState, this._codeEditorService);
                (0, toggleWordWrap_1.writeTransientState)(model.input1.textModel, candidateState, this._codeEditorService);
                (0, toggleWordWrap_1.writeTransientState)(model.resultTextModel, candidateState, this._codeEditorService);
                const baseTextModel = this.baseView.get()?.editor.getModel();
                if (baseTextModel) {
                    (0, toggleWordWrap_1.writeTransientState)(baseTextModel, candidateState, this._codeEditorService);
                }
            };
            this._sessionDisposables.add(this._codeEditorService.onDidChangeTransientModelProperty(candidate => {
                mirrorWordWrapTransientState(candidate);
            }));
            mirrorWordWrapTransientState(this.inputResultView.editor.getModel());
            // detect when base, input1, and input2 become empty and replace THIS editor with its result editor
            // TODO@jrieken@hediet this needs a better/cleaner solution
            // https://github.com/microsoft/vscode/issues/155940
            const that = this;
            this._sessionDisposables.add(new class {
                constructor() {
                    this._disposable = new lifecycle_1.DisposableStore();
                    for (const model of this.baseInput1Input2()) {
                        this._disposable.add(model.onDidChangeContent(() => this._checkBaseInput1Input2AllEmpty()));
                    }
                }
                dispose() {
                    this._disposable.dispose();
                }
                *baseInput1Input2() {
                    yield model.base;
                    yield model.input1.textModel;
                    yield model.input2.textModel;
                }
                _checkBaseInput1Input2AllEmpty() {
                    for (const model of this.baseInput1Input2()) {
                        if (model.getValueLength() > 0) {
                            return;
                        }
                    }
                    // all empty -> replace this editor with a normal editor for result
                    that.editorService.replaceEditors([{ editor: input, replacement: { resource: input.result, options: { preserveFocus: true } }, forceReplaceDirty: true }], that.group);
                }
            });
        }
        setViewZones(reader, viewModel, input1Editor, input1ViewZoneAccessor, input2Editor, input2ViewZoneAccessor, baseEditor, baseViewZoneAccessor, shouldAlignBase, resultEditor, resultViewZoneAccessor, shouldAlignResult) {
            const input1ViewZoneIds = [];
            const input2ViewZoneIds = [];
            const baseViewZoneIds = [];
            const resultViewZoneIds = [];
            const viewZones = this.viewZoneComputer.computeViewZones(reader, viewModel, {
                codeLensesVisible: this.codeLensesVisible.read(reader),
                showNonConflictingChanges: this.showNonConflictingChanges.read(reader),
                shouldAlignBase,
                shouldAlignResult,
            });
            const disposableStore = new lifecycle_1.DisposableStore();
            if (baseViewZoneAccessor) {
                for (const v of viewZones.baseViewZones) {
                    v.create(baseViewZoneAccessor, baseViewZoneIds, disposableStore);
                }
            }
            for (const v of viewZones.resultViewZones) {
                v.create(resultViewZoneAccessor, resultViewZoneIds, disposableStore);
            }
            for (const v of viewZones.input1ViewZones) {
                v.create(input1ViewZoneAccessor, input1ViewZoneIds, disposableStore);
            }
            for (const v of viewZones.input2ViewZones) {
                v.create(input2ViewZoneAccessor, input2ViewZoneIds, disposableStore);
            }
            disposableStore.add({
                dispose: () => {
                    input1Editor.changeViewZones(a => {
                        for (const zone of input1ViewZoneIds) {
                            a.removeZone(zone);
                        }
                    });
                    input2Editor.changeViewZones(a => {
                        for (const zone of input2ViewZoneIds) {
                            a.removeZone(zone);
                        }
                    });
                    baseEditor?.changeViewZones(a => {
                        for (const zone of baseViewZoneIds) {
                            a.removeZone(zone);
                        }
                    });
                    resultEditor.changeViewZones(a => {
                        for (const zone of resultViewZoneIds) {
                            a.removeZone(zone);
                        }
                    });
                }
            });
            return disposableStore;
        }
        setOptions(options) {
            super.setOptions(options);
            if (options) {
                (0, editorOptions_1.applyTextEditorOptions)(options, this.inputResultView.editor, 0 /* ScrollType.Smooth */);
            }
        }
        clearInput() {
            super.clearInput();
            this._sessionDisposables.clear();
            for (const { editor } of [this.input1View, this.input2View, this.inputResultView]) {
                editor.setModel(null);
            }
        }
        focus() {
            super.focus();
            (this.getControl() ?? this.inputResultView.editor).focus();
        }
        hasFocus() {
            for (const { editor } of [this.input1View, this.input2View, this.inputResultView]) {
                if (editor.hasTextFocus()) {
                    return true;
                }
            }
            return super.hasFocus();
        }
        setEditorVisible(visible) {
            super.setEditorVisible(visible);
            for (const { editor } of [this.input1View, this.input2View, this.inputResultView]) {
                if (visible) {
                    editor.onVisible();
                }
                else {
                    editor.onHide();
                }
            }
            this._ctxIsMergeEditor.set(visible);
        }
        // ---- interact with "outside world" via`getControl`, `scopedContextKeyService`: we only expose the result-editor keep the others internal
        getControl() {
            return this.inputResultView.editor;
        }
        get scopedContextKeyService() {
            const control = this.getControl();
            return control?.invokeWithinContext(accessor => accessor.get(contextkey_1.IContextKeyService));
        }
        // --- layout
        toggleBase() {
            this.setLayout({
                ...this._layoutMode.value,
                showBase: !this._layoutMode.value.showBase
            });
        }
        toggleShowBaseTop() {
            const showBaseTop = this._layoutMode.value.showBase && this._layoutMode.value.showBaseAtTop;
            this.setLayout({
                ...this._layoutMode.value,
                showBaseAtTop: true,
                showBase: !showBaseTop,
            });
        }
        toggleShowBaseCenter() {
            const showBaseCenter = this._layoutMode.value.showBase && !this._layoutMode.value.showBaseAtTop;
            this.setLayout({
                ...this._layoutMode.value,
                showBaseAtTop: false,
                showBase: !showBaseCenter,
            });
        }
        setLayoutKind(kind) {
            this.setLayout({
                ...this._layoutMode.value,
                kind
            });
        }
        setLayout(newLayout) {
            const value = this._layoutMode.value;
            if (JSON.stringify(value) === JSON.stringify(newLayout)) {
                return;
            }
            this.model?.telemetry.reportLayoutChange({
                baseTop: newLayout.showBaseAtTop,
                baseVisible: newLayout.showBase,
                isColumnView: newLayout.kind === 'columns',
            });
            this.applyLayout(newLayout);
        }
        applyLayout(layout) {
            (0, observable_1.transaction)(tx => {
                /** @description applyLayout */
                if (layout.showBase && !this.baseView.get()) {
                    this.baseViewDisposables.clear();
                    const baseView = this.baseViewDisposables.add(this.instantiationService.createInstance(baseCodeEditorView_1.BaseCodeEditorView, this.viewModel));
                    this.baseViewDisposables.add((0, observable_1.autorun)(reader => {
                        /** @description Update base view options */
                        const options = this.baseViewOptions.read(reader);
                        if (options) {
                            baseView.updateOptions(options);
                        }
                    }));
                    this.baseView.set(baseView, tx);
                }
                else if (!layout.showBase && this.baseView.get()) {
                    this.baseView.set(undefined, tx);
                    this.baseViewDisposables.clear();
                }
                if (layout.kind === 'mixed') {
                    this.setGrid([
                        layout.showBaseAtTop && layout.showBase ? {
                            size: 38,
                            data: this.baseView.get().view
                        } : undefined,
                        {
                            size: 38,
                            groups: [
                                { data: this.input1View.view },
                                !layout.showBaseAtTop && layout.showBase ? { data: this.baseView.get().view } : undefined,
                                { data: this.input2View.view }
                            ].filter(types_1.isDefined)
                        },
                        {
                            size: 62,
                            data: this.inputResultView.view
                        },
                    ].filter(types_1.isDefined));
                }
                else if (layout.kind === 'columns') {
                    this.setGrid([
                        layout.showBase ? {
                            size: 40,
                            data: this.baseView.get().view
                        } : undefined,
                        {
                            size: 60,
                            groups: [{ data: this.input1View.view }, { data: this.inputResultView.view }, { data: this.input2View.view }]
                        },
                    ].filter(types_1.isDefined));
                }
                this._layoutMode.value = layout;
                this._ctxUsesColumnLayout.set(layout.kind);
                this._ctxShowBase.set(layout.showBase);
                this._ctxShowBaseAtTop.set(layout.showBaseAtTop);
                this._onDidChangeSizeConstraints.fire();
                this._layoutModeObs.set(layout, tx);
            });
        }
        setGrid(descriptor) {
            let width = -1;
            let height = -1;
            if (this._grid.value) {
                width = this._grid.value.width;
                height = this._grid.value.height;
            }
            this._grid.value = grid_1.SerializableGrid.from({
                orientation: 0 /* Orientation.VERTICAL */,
                size: 100,
                groups: descriptor,
            }, {
                styles: { separatorBorder: this.theme.getColor(settingsEditorColorRegistry_1.settingsSashBorder) ?? color_1.Color.transparent },
                proportionalLayout: true
            });
            (0, dom_1.reset)(this.rootHtmlElement, this._grid.value.element);
            // Only call layout after the elements have been added to the DOM,
            // so that they have a defined size.
            if (width !== -1) {
                this._grid.value.layout(width, height);
            }
        }
        _applyViewState(state) {
            if (!state) {
                return;
            }
            this.inputResultView.editor.restoreViewState(state);
            if (state.input1State) {
                this.input1View.editor.restoreViewState(state.input1State);
            }
            if (state.input2State) {
                this.input2View.editor.restoreViewState(state.input2State);
            }
            if (state.focusIndex >= 0) {
                [this.input1View.editor, this.input2View.editor, this.inputResultView.editor][state.focusIndex].focus();
            }
        }
        computeEditorViewState(resource) {
            if (!(0, resources_1.isEqual)(this.inputModel.get()?.resultUri, resource)) {
                return undefined;
            }
            const result = this.inputResultView.editor.saveViewState();
            if (!result) {
                return undefined;
            }
            const input1State = this.input1View.editor.saveViewState() ?? undefined;
            const input2State = this.input2View.editor.saveViewState() ?? undefined;
            const focusIndex = [this.input1View.editor, this.input2View.editor, this.inputResultView.editor].findIndex(editor => editor.hasWidgetFocus());
            return { ...result, input1State, input2State, focusIndex };
        }
        tracksEditorViewState(input) {
            return input instanceof mergeEditorInput_1.MergeEditorInput;
        }
        toggleShowNonConflictingChanges() {
            this.showNonConflictingChanges.set(!this.showNonConflictingChanges.get(), undefined);
            this.showNonConflictingChangesStore.set(this.showNonConflictingChanges.get());
            this._ctxShowNonConflictingChanges.set(this.showNonConflictingChanges.get());
        }
    };
    exports.MergeEditor = MergeEditor;
    exports.MergeEditor = MergeEditor = MergeEditor_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, storage_1.IStorageService),
        __param(5, themeService_1.IThemeService),
        __param(6, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, editorService_1.IEditorService),
        __param(9, editorGroupsService_1.IEditorGroupsService),
        __param(10, files_1.IFileService),
        __param(11, codeEditorService_1.ICodeEditorService),
        __param(12, configuration_1.IConfigurationService)
    ], MergeEditor);
    // TODO use PersistentStore
    let MergeEditorLayoutStore = class MergeEditorLayoutStore {
        static { MergeEditorLayoutStore_1 = this; }
        static { this._key = 'mergeEditor/layout'; }
        constructor(_storageService) {
            this._storageService = _storageService;
            this._value = { kind: 'mixed', showBase: false, showBaseAtTop: true };
            const value = _storageService.get(MergeEditorLayoutStore_1._key, 0 /* StorageScope.PROFILE */, 'mixed');
            if (value === 'mixed' || value === 'columns') {
                this._value = { kind: value, showBase: false, showBaseAtTop: true };
            }
            else if (value) {
                try {
                    this._value = JSON.parse(value);
                }
                catch (e) {
                    (0, errors_1.onUnexpectedError)(e);
                }
            }
        }
        get value() {
            return this._value;
        }
        set value(value) {
            if (this._value !== value) {
                this._value = value;
                this._storageService.store(MergeEditorLayoutStore_1._key, JSON.stringify(this._value), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }
        }
    };
    MergeEditorLayoutStore = MergeEditorLayoutStore_1 = __decorate([
        __param(0, storage_1.IStorageService)
    ], MergeEditorLayoutStore);
    let MergeEditorOpenHandlerContribution = class MergeEditorOpenHandlerContribution extends lifecycle_1.Disposable {
        constructor(_editorService, codeEditorService) {
            super();
            this._editorService = _editorService;
            this._store.add(codeEditorService.registerCodeEditorOpenHandler(this.openCodeEditorFromMergeEditor.bind(this)));
        }
        async openCodeEditorFromMergeEditor(input, _source, sideBySide) {
            const activePane = this._editorService.activeEditorPane;
            if (!sideBySide
                && input.options
                && activePane instanceof MergeEditor
                && activePane.getControl()
                && activePane.input instanceof mergeEditorInput_1.MergeEditorInput
                && (0, resources_1.isEqual)(input.resource, activePane.input.result)) {
                // Special: stay inside the merge editor when it is active and when the input
                // targets the result editor of the merge editor.
                const targetEditor = activePane.getControl();
                (0, editorOptions_1.applyTextEditorOptions)(input.options, targetEditor, 0 /* ScrollType.Smooth */);
                return targetEditor;
            }
            // cannot handle this
            return null;
        }
    };
    exports.MergeEditorOpenHandlerContribution = MergeEditorOpenHandlerContribution;
    exports.MergeEditorOpenHandlerContribution = MergeEditorOpenHandlerContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], MergeEditorOpenHandlerContribution);
    let MergeEditorResolverContribution = class MergeEditorResolverContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.mergeEditorResolver'; }
        constructor(editorResolverService, instantiationService) {
            super();
            const mergeEditorInputFactory = (mergeEditor) => {
                return {
                    editor: instantiationService.createInstance(mergeEditorInput_1.MergeEditorInput, mergeEditor.base.resource, {
                        uri: mergeEditor.input1.resource,
                        title: mergeEditor.input1.label ?? (0, resources_1.basename)(mergeEditor.input1.resource),
                        description: mergeEditor.input1.description ?? '',
                        detail: mergeEditor.input1.detail
                    }, {
                        uri: mergeEditor.input2.resource,
                        title: mergeEditor.input2.label ?? (0, resources_1.basename)(mergeEditor.input2.resource),
                        description: mergeEditor.input2.description ?? '',
                        detail: mergeEditor.input2.detail
                    }, mergeEditor.result.resource)
                };
            };
            this._register(editorResolverService.registerEditor(`*`, {
                id: editor_1.DEFAULT_EDITOR_ASSOCIATION.id,
                label: editor_1.DEFAULT_EDITOR_ASSOCIATION.displayName,
                detail: editor_1.DEFAULT_EDITOR_ASSOCIATION.providerDisplayName,
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, {
                createMergeEditorInput: mergeEditorInputFactory
            }));
        }
    };
    exports.MergeEditorResolverContribution = MergeEditorResolverContribution;
    exports.MergeEditorResolverContribution = MergeEditorResolverContribution = __decorate([
        __param(0, editorResolverService_1.IEditorResolverService),
        __param(1, instantiation_1.IInstantiationService)
    ], MergeEditorResolverContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2Jyb3dzZXIvdmlldy9tZXJnZUVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBb0R6RixJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFZLFNBQVEsK0JBQXlDOztpQkFFekQsT0FBRSxHQUFHLGFBQWEsQUFBaEIsQ0FBaUI7UUFLbkMsSUFBVyxTQUFTO1lBQ25CLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN4QixDQUFDO1FBb0JELElBQVcsVUFBVTtZQUNwQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUNELElBQVcsS0FBSztZQUNmLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLENBQUM7UUFDckMsQ0FBQztRQUVELElBQVksY0FBYztZQUN6QixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFVLDRCQUE0QixDQUFDLENBQUM7UUFDckYsQ0FBQztRQWdCRCxZQUNDLEtBQW1CLEVBQ0ksYUFBb0MsRUFDdkMsaUJBQXNELEVBQ3ZELGdCQUFtQyxFQUNyQyxjQUErQixFQUNqQyxZQUEyQixFQUNQLGdDQUFtRSxFQUMvRSxxQkFBNkQsRUFDcEUsYUFBNkIsRUFDdkIsa0JBQXdDLEVBQ2hELFdBQXlCLEVBQ25CLGtCQUF1RCxFQUNwRCxvQkFBNEQ7WUFFbkYsS0FBSyxDQUFDLGFBQVcsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsZ0NBQWdDLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxrQkFBa0IsRUFBRSxXQUFX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