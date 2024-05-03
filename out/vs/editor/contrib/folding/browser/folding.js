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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/types", "vs/editor/browser/stableEditorScroll", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/common/languages", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/folding/browser/foldingModel", "vs/editor/contrib/folding/browser/hiddenRangeModel", "vs/editor/contrib/folding/browser/indentRangeProvider", "vs/nls", "vs/platform/contextkey/common/contextkey", "./foldingDecorations", "./foldingRanges", "./syntaxRangeProvider", "vs/platform/notification/common/notification", "vs/editor/common/services/languageFeatureDebounce", "vs/base/common/stopwatch", "vs/editor/common/services/languageFeatures", "vs/base/common/event", "vs/platform/commands/common/commands", "vs/base/common/uri", "vs/editor/common/services/model", "vs/platform/configuration/common/configuration", "vs/css!./folding"], function (require, exports, async_1, cancellation_1, errors_1, keyCodes_1, lifecycle_1, strings_1, types, stableEditorScroll_1, editorExtensions_1, editorContextKeys_1, languages_1, languageConfigurationRegistry_1, foldingModel_1, hiddenRangeModel_1, indentRangeProvider_1, nls, contextkey_1, foldingDecorations_1, foldingRanges_1, syntaxRangeProvider_1, notification_1, languageFeatureDebounce_1, stopwatch_1, languageFeatures_1, event_1, commands_1, uri_1, model_1, configuration_1) {
    "use strict";
    var FoldingController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RangesLimitReporter = exports.FoldingController = void 0;
    const CONTEXT_FOLDING_ENABLED = new contextkey_1.RawContextKey('foldingEnabled', false);
    let FoldingController = class FoldingController extends lifecycle_1.Disposable {
        static { FoldingController_1 = this; }
        static { this.ID = 'editor.contrib.folding'; }
        static get(editor) {
            return editor.getContribution(FoldingController_1.ID);
        }
        static getFoldingRangeProviders(languageFeaturesService, model) {
            const foldingRangeProviders = languageFeaturesService.foldingRangeProvider.ordered(model);
            return (FoldingController_1._foldingRangeSelector?.(foldingRangeProviders, model)) ?? foldingRangeProviders;
        }
        static setFoldingRangeProviderSelector(foldingRangeSelector) {
            FoldingController_1._foldingRangeSelector = foldingRangeSelector;
            return { dispose: () => { FoldingController_1._foldingRangeSelector = undefined; } };
        }
        constructor(editor, contextKeyService, languageConfigurationService, notificationService, languageFeatureDebounceService, languageFeaturesService) {
            super();
            this.contextKeyService = contextKeyService;
            this.languageConfigurationService = languageConfigurationService;
            this.languageFeaturesService = languageFeaturesService;
            this.localToDispose = this._register(new lifecycle_1.DisposableStore());
            this.editor = editor;
            this._foldingLimitReporter = new RangesLimitReporter(editor);
            const options = this.editor.getOptions();
            this._isEnabled = options.get(43 /* EditorOption.folding */);
            this._useFoldingProviders = options.get(44 /* EditorOption.foldingStrategy */) !== 'indentation';
            this._unfoldOnClickAfterEndOfLine = options.get(48 /* EditorOption.unfoldOnClickAfterEndOfLine */);
            this._restoringViewState = false;
            this._currentModelHasFoldedImports = false;
            this._foldingImportsByDefault = options.get(46 /* EditorOption.foldingImportsByDefault */);
            this.updateDebounceInfo = languageFeatureDebounceService.for(languageFeaturesService.foldingRangeProvider, 'Folding', { min: 200 });
            this.foldingModel = null;
            this.hiddenRangeModel = null;
            this.rangeProvider = null;
            this.foldingRegionPromise = null;
            this.foldingModelPromise = null;
            this.updateScheduler = null;
            this.cursorChangedScheduler = null;
            this.mouseDownInfo = null;
            this.foldingDecorationProvider = new foldingDecorations_1.FoldingDecorationProvider(editor);
            this.foldingDecorationProvider.showFoldingControls = options.get(110 /* EditorOption.showFoldingControls */);
            this.foldingDecorationProvider.showFoldingHighlights = options.get(45 /* EditorOption.foldingHighlight */);
            this.foldingEnabled = CONTEXT_FOLDING_ENABLED.bindTo(this.contextKeyService);
            this.foldingEnabled.set(this._isEnabled);
            this._register(this.editor.onDidChangeModel(() => this.onModelChanged()));
            this._register(this.editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(43 /* EditorOption.folding */)) {
                    this._isEnabled = this.editor.getOptions().get(43 /* EditorOption.folding */);
                    this.foldingEnabled.set(this._isEnabled);
                    this.onModelChanged();
                }
                if (e.hasChanged(47 /* EditorOption.foldingMaximumRegions */)) {
                    this.onModelChanged();
                }
                if (e.hasChanged(110 /* EditorOption.showFoldingControls */) || e.hasChanged(45 /* EditorOption.foldingHighlight */)) {
                    const options = this.editor.getOptions();
                    this.foldingDecorationProvider.showFoldingControls = options.get(110 /* EditorOption.showFoldingControls */);
                    this.foldingDecorationProvider.showFoldingHighlights = options.get(45 /* EditorOption.foldingHighlight */);
                    this.triggerFoldingModelChanged();
                }
                if (e.hasChanged(44 /* EditorOption.foldingStrategy */)) {
                    this._useFoldingProviders = this.editor.getOptions().get(44 /* EditorOption.foldingStrategy */) !== 'indentation';
                    this.onFoldingStrategyChanged();
                }
                if (e.hasChanged(48 /* EditorOption.unfoldOnClickAfterEndOfLine */)) {
                    this._unfoldOnClickAfterEndOfLine = this.editor.getOptions().get(48 /* EditorOption.unfoldOnClickAfterEndOfLine */);
                }
                if (e.hasChanged(46 /* EditorOption.foldingImportsByDefault */)) {
                    this._foldingImportsByDefault = this.editor.getOptions().get(46 /* EditorOption.foldingImportsByDefault */);
                }
            }));
            this.onModelChanged();
        }
        get limitReporter() {
            return this._foldingLimitReporter;
        }
        /**
         * Store view state.
         */
        saveViewState() {
            const model = this.editor.getModel();
            if (!model || !this._isEnabled || model.isTooLargeForTokenization()) {
                return {};
            }
            if (this.foldingModel) { // disposed ?
                const collapsedRegions = this.foldingModel.getMemento();
                const provider = this.rangeProvider ? this.rangeProvider.id : undefined;
                return { collapsedRegions, lineCount: model.getLineCount(), provider, foldedImports: this._currentModelHasFoldedImports };
            }
            return undefined;
        }
        /**
         * Restore view state.
         */
        restoreViewState(state) {
            const model = this.editor.getModel();
            if (!model || !this._isEnabled || model.isTooLargeForTokenization() || !this.hiddenRangeModel) {
                return;
            }
            if (!state) {
                return;
            }
            this._currentModelHasFoldedImports = !!state.foldedImports;
            if (state.collapsedRegions && state.collapsedRegions.length > 0 && this.foldingModel) {
                this._restoringViewState = true;
                try {
                    this.foldingModel.applyMemento(state.collapsedRegions);
                }
                finally {
                    this._restoringViewState = false;
                }
            }
        }
        onModelChanged() {
            this.localToDispose.clear();
            const model = this.editor.getModel();
            if (!this._isEnabled || !model || model.isTooLargeForTokenization()) {
                // huge files get no view model, so they cannot support hidden areas
                return;
            }
            this._currentModelHasFoldedImports = false;
            this.foldingModel = new foldingModel_1.FoldingModel(model, this.foldingDecorationProvider);
            this.localToDispose.add(this.foldingModel);
            this.hiddenRangeModel = new hiddenRangeModel_1.HiddenRangeModel(this.foldingModel);
            this.localToDispose.add(this.hiddenRangeModel);
            this.localToDispose.add(this.hiddenRangeModel.onDidChange(hr => this.onHiddenRangesChanges(hr)));
            this.updateScheduler = new async_1.Delayer(this.updateDebounceInfo.get(model));
            this.cursorChangedScheduler = new async_1.RunOnceScheduler(() => this.revealCursor(), 200);
            this.localToDispose.add(this.cursorChangedScheduler);
            this.localToDispose.add(this.languageFeaturesService.foldingRangeProvider.onDidChange(() => this.onFoldingStrategyChanged()));
            this.localToDispose.add(this.editor.onDidChangeModelLanguageConfiguration(() => this.onFoldingStrategyChanged())); // covers model language changes as well
            this.localToDispose.add(this.editor.onDidChangeModelContent(e => this.onDidChangeModelContent(e)));
            this.localToDispose.add(this.editor.onDidChangeCursorPosition(() => this.onCursorPositionChanged()));
            this.localToDispose.add(this.editor.onMouseDown(e => this.onEditorMouseDown(e)));
            this.localToDispose.add(this.editor.onMouseUp(e => this.onEditorMouseUp(e)));
            this.localToDispose.add({
                dispose: () => {
                    if (this.foldingRegionPromise) {
                        this.foldingRegionPromise.cancel();
                        this.foldingRegionPromise = null;
                    }
                    this.updateScheduler?.cancel();
                    this.updateScheduler = null;
                    this.foldingModel = null;
                    this.foldingModelPromise = null;
                    this.hiddenRangeModel = null;
                    this.cursorChangedScheduler = null;
                    this.rangeProvider?.dispose();
                    this.rangeProvider = null;
                }
            });
            this.triggerFoldingModelChanged();
        }
        onFoldingStrategyChanged() {
            this.rangeProvider?.dispose();
            this.rangeProvider = null;
            this.triggerFoldingModelChanged();
        }
        getRangeProvider(editorModel) {
            if (this.rangeProvider) {
                return this.rangeProvider;
            }
            const indentRangeProvider = new indentRangeProvider_1.IndentRangeProvider(editorModel, this.languageConfigurationService, this._foldingLimitReporter);
            this.rangeProvider = indentRangeProvider; // fallback
            if (this._useFoldingProviders && this.foldingModel) {
                const selectedProviders = FoldingController_1.getFoldingRangeProviders(this.languageFeaturesService, editorModel);
                if (selectedProviders.length > 0) {
                    this.rangeProvider = new syntaxRangeProvider_1.SyntaxRangeProvider(editorModel, selectedProviders, () => this.triggerFoldingModelChanged(), this._foldingLimitReporter, indentRangeProvider);
                }
            }
            return this.rangeProvider;
        }
        getFoldingModel() {
            return this.foldingModelPromise;
        }
        onDidChangeModelContent(e) {
            this.hiddenRangeModel?.notifyChangeModelContent(e);
            this.triggerFoldingModelChanged();
        }
        triggerFoldingModelChanged() {
            if (this.updateScheduler) {
                if (this.foldingRegionPromise) {
                    this.foldingRegionPromise.cancel();
                    this.foldingRegionPromise = null;
                }
                this.foldingModelPromise = this.updateScheduler.trigger(() => {
                    const foldingModel = this.foldingModel;
                    if (!foldingModel) { // null if editor has been disposed, or folding turned off
                        return null;
                    }
                    const sw = new stopwatch_1.StopWatch();
                    const provider = this.getRangeProvider(foldingModel.textModel);
                    const foldingRegionPromise = this.foldingRegionPromise = (0, async_1.createCancelablePromise)(token => provider.compute(token));
                    return foldingRegionPromise.then(foldingRanges => {
                        if (foldingRanges && foldingRegionPromise === this.foldingRegionPromise) { // new request or cancelled in the meantime?
                            let scrollState;
                            if (this._foldingImportsByDefault && !this._currentModelHasFoldedImports) {
                                const hasChanges = foldingRanges.setCollapsedAllOfType(languages_1.FoldingRangeKind.Imports.value, true);
                                if (hasChanges) {
                                    scrollState = stableEditorScroll_1.StableEditorScrollState.capture(this.editor);
                                    this._currentModelHasFoldedImports = hasChanges;
                                }
                            }
                            // some cursors might have moved into hidden regions, make sure they are in expanded regions
                            const selections = this.editor.getSelections();
                            const selectionLineNumbers = selections ? selections.map(s => s.startLineNumber) : [];
                            foldingModel.update(foldingRanges, selectionLineNumbers);
                            scrollState?.restore(this.editor);
                            // update debounce info
                            const newValue = this.updateDebounceInfo.update(foldingModel.textModel, sw.elapsed());
                            if (this.updateScheduler) {
                                this.updateScheduler.defaultDelay = newValue;
                            }
                        }
                        return foldingModel;
                    });
                }).then(undefined, (err) => {
                    (0, errors_1.onUnexpectedError)(err);
                    return null;
                });
            }
        }
        onHiddenRangesChanges(hiddenRanges) {
            if (this.hiddenRangeModel && hiddenRanges.length && !this._restoringViewState) {
                const selections = this.editor.getSelections();
                if (selections) {
                    if (this.hiddenRangeModel.adjustSelections(selections)) {
                        this.editor.setSelections(selections);
                    }
                }
            }
            this.editor.setHiddenAreas(hiddenRanges, this);
        }
        onCursorPositionChanged() {
            if (this.hiddenRangeModel && this.hiddenRangeModel.hasRanges()) {
                this.cursorChangedScheduler.schedule();
            }
        }
        revealCursor() {
            const foldingModel = this.getFoldingModel();
            if (!foldingModel) {
                return;
            }
            foldingModel.then(foldingModel => {
                if (foldingModel) {
                    const selections = this.editor.getSelections();
                    if (selections && selections.length > 0) {
                        const toToggle = [];
                        for (const selection of selections) {
                            const lineNumber = selection.selectionStartLineNumber;
                            if (this.hiddenRangeModel && this.hiddenRangeModel.isHidden(lineNumber)) {
                                toToggle.push(...foldingModel.getAllRegionsAtLine(lineNumber, r => r.isCollapsed && lineNumber > r.startLineNumber));
                            }
                        }
                        if (toToggle.length) {
                            foldingModel.toggleCollapseState(toToggle);
                            this.reveal(selections[0].getPosition());
                        }
                    }
                }
            }).then(undefined, errors_1.onUnexpectedError);
        }
        onEditorMouseDown(e) {
            this.mouseDownInfo = null;
            if (!this.hiddenRangeModel || !e.target || !e.target.range) {
                return;
            }
            if (!e.event.leftButton && !e.event.middleButton) {
                return;
            }
            const range = e.target.range;
            let iconClicked = false;
            switch (e.target.type) {
                case 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */: {
                    const data = e.target.detail;
                    const offsetLeftInGutter = e.target.element.offsetLeft;
                    const gutterOffsetX = data.offsetX - offsetLeftInGutter;
                    // const gutterOffsetX = data.offsetX - data.glyphMarginWidth - data.lineNumbersWidth - data.glyphMarginLeft;
                    // TODO@joao TODO@alex TODO@martin this is such that we don't collide with dirty diff
                    if (gutterOffsetX < 4) { // the whitespace between the border and the real folding icon border is 4px
                        return;
                    }
                    iconClicked = true;
                    break;
                }
                case 7 /* MouseTargetType.CONTENT_EMPTY */: {
                    if (this._unfoldOnClickAfterEndOfLine && this.hiddenRangeModel.hasRanges()) {
                        const data = e.target.detail;
                        if (!data.isAfterLines) {
                            break;
                        }
                    }
                    return;
                }
                case 6 /* MouseTargetType.CONTENT_TEXT */: {
                    if (this.hiddenRangeModel.hasRanges()) {
                        const model = this.editor.getModel();
                        if (model && range.startColumn === model.getLineMaxColumn(range.startLineNumber)) {
                            break;
                        }
                    }
                    return;
                }
                default:
                    return;
            }
            this.mouseDownInfo = { lineNumber: range.startLineNumber, iconClicked };
        }
        onEditorMouseUp(e) {
            const foldingModel = this.foldingModel;
            if (!foldingModel || !this.mouseDownInfo || !e.target) {
                return;
            }
            const lineNumber = this.mouseDownInfo.lineNumber;
            const iconClicked = this.mouseDownInfo.iconClicked;
            const range = e.target.range;
            if (!range || range.startLineNumber !== lineNumber) {
                return;
            }
            if (iconClicked) {
                if (e.target.type !== 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */) {
                    return;
                }
            }
            else {
                const model = this.editor.getModel();
                if (!model || range.startColumn !== model.getLineMaxColumn(lineNumber)) {
                    return;
                }
            }
            const region = foldingModel.getRegionAtLine(lineNumber);
            if (region && region.startLineNumber === lineNumber) {
                const isCollapsed = region.isCollapsed;
                if (iconClicked || isCollapsed) {
                    const surrounding = e.event.altKey;
                    let toToggle = [];
                    if (surrounding) {
                        const filter = (otherRegion) => !otherRegion.containedBy(region) && !region.containedBy(otherRegion);
                        const toMaybeToggle = foldingModel.getRegionsInside(null, filter);
                        for (const r of toMaybeToggle) {
                            if (r.isCollapsed) {
                                toToggle.push(r);
                            }
                        }
                        // if any surrounding regions are folded, unfold those. Otherwise, fold all surrounding
                        if (toToggle.length === 0) {
                            toToggle = toMaybeToggle;
                        }
                    }
                    else {
                        const recursive = e.event.middleButton || e.event.shiftKey;
                        if (recursive) {
                            for (const r of foldingModel.getRegionsInside(region)) {
                                if (r.isCollapsed === isCollapsed) {
                                    toToggle.push(r);
                                }
                            }
                        }
                        // when recursive, first only collapse all children. If all are already folded or there are no children, also fold parent.
                        if (isCollapsed || !recursive || toToggle.length === 0) {
                            toToggle.push(region);
                        }
                    }
                    foldingModel.toggleCollapseState(toToggle);
                    this.reveal({ lineNumber, column: 1 });
                }
            }
        }
        reveal(position) {
            this.editor.revealPositionInCenterIfOutsideViewport(position, 0 /* ScrollType.Smooth */);
        }
    };
    exports.FoldingController = FoldingController;
    exports.FoldingController = FoldingController = FoldingController_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(3, notification_1.INotificationService),
        __param(4, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(5, languageFeatures_1.ILanguageFeaturesService)
    ], FoldingController);
    class RangesLimitReporter {
        constructor(editor) {
            this.editor = editor;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._computed = 0;
            this._limited = false;
        }
        get limit() {
            return this.editor.getOptions().get(47 /* EditorOption.foldingMaximumRegions */);
        }
        get computed() {
            return this._computed;
        }
        get limited() {
            return this._limited;
        }
        update(computed, limited) {
            if (computed !== this._computed || limited !== this._limited) {
                this._computed = computed;
                this._limited = limited;
                this._onDidChange.fire();
            }
        }
    }
    exports.RangesLimitReporter = RangesLimitReporter;
    class FoldingAction extends editorExtensions_1.EditorAction {
        runEditorCommand(accessor, editor, args) {
            const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const foldingController = FoldingController.get(editor);
            if (!foldingController) {
                return;
            }
            const foldingModelPromise = foldingController.getFoldingModel();
            if (foldingModelPromise) {
                this.reportTelemetry(accessor, editor);
                return foldingModelPromise.then(foldingModel => {
                    if (foldingModel) {
                        this.invoke(foldingController, foldingModel, editor, args, languageConfigurationService);
                        const selection = editor.getSelection();
                        if (selection) {
                            foldingController.reveal(selection.getStartPosition());
                        }
                    }
                });
            }
        }
        getSelectedLines(editor) {
            const selections = editor.getSelections();
            return selections ? selections.map(s => s.startLineNumber) : [];
        }
        getLineNumbers(args, editor) {
            if (args && args.selectionLines) {
                return args.selectionLines.map(l => l + 1); // to 0-bases line numbers
            }
            return this.getSelectedLines(editor);
        }
        run(_accessor, _editor) {
        }
    }
    function foldingArgumentsConstraint(args) {
        if (!types.isUndefined(args)) {
            if (!types.isObject(args)) {
                return false;
            }
            const foldingArgs = args;
            if (!types.isUndefined(foldingArgs.levels) && !types.isNumber(foldingArgs.levels)) {
                return false;
            }
            if (!types.isUndefined(foldingArgs.direction) && !types.isString(foldingArgs.direction)) {
                return false;
            }
            if (!types.isUndefined(foldingArgs.selectionLines) && (!Array.isArray(foldingArgs.selectionLines) || !foldingArgs.selectionLines.every(types.isNumber))) {
                return false;
            }
        }
        return true;
    }
    class UnfoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfold',
                label: nls.localize('unfoldAction.label', "Unfold"),
                alias: 'Unfold',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 94 /* KeyCode.BracketRight */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 94 /* KeyCode.BracketRight */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: 'Unfold the content in the editor',
                    args: [
                        {
                            name: 'Unfold editor argument',
                            description: `Property-value pairs that can be passed through this argument:
						* 'levels': Number of levels to unfold. If not set, defaults to 1.
						* 'direction': If 'up', unfold given number of levels up otherwise unfolds down.
						* 'selectionLines': Array of the start lines (0-based) of the editor selections to apply the unfold action to. If not set, the active selection(s) will be used.
						`,
                            constraint: foldingArgumentsConstraint,
                            schema: {
                                'type': 'object',
                                'properties': {
                                    'levels': {
                                        'type': 'number',
                                        'default': 1
                                    },
                                    'direction': {
                                        'type': 'string',
                                        'enum': ['up', 'down'],
                                        'default': 'down'
                                    },
                                    'selectionLines': {
                                        'type': 'array',
                                        'items': {
                                            'type': 'number'
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args) {
            const levels = args && args.levels || 1;
            const lineNumbers = this.getLineNumbers(args, editor);
            if (args && args.direction === 'up') {
                (0, foldingModel_1.setCollapseStateLevelsUp)(foldingModel, false, levels, lineNumbers);
            }
            else {
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false, levels, lineNumbers);
            }
        }
    }
    class UnFoldRecursivelyAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfoldRecursively',
                label: nls.localize('unFoldRecursivelyAction.label', "Unfold Recursively"),
                alias: 'Unfold Recursively',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 94 /* KeyCode.BracketRight */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, _args) {
            (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false, Number.MAX_VALUE, this.getSelectedLines(editor));
        }
    }
    class FoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.fold',
                label: nls.localize('foldAction.label', "Fold"),
                alias: 'Fold',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 92 /* KeyCode.BracketLeft */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 92 /* KeyCode.BracketLeft */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: 'Fold the content in the editor',
                    args: [
                        {
                            name: 'Fold editor argument',
                            description: `Property-value pairs that can be passed through this argument:
							* 'levels': Number of levels to fold.
							* 'direction': If 'up', folds given number of levels up otherwise folds down.
							* 'selectionLines': Array of the start lines (0-based) of the editor selections to apply the fold action to. If not set, the active selection(s) will be used.
							If no levels or direction is set, folds the region at the locations or if already collapsed, the first uncollapsed parent instead.
						`,
                            constraint: foldingArgumentsConstraint,
                            schema: {
                                'type': 'object',
                                'properties': {
                                    'levels': {
                                        'type': 'number',
                                    },
                                    'direction': {
                                        'type': 'string',
                                        'enum': ['up', 'down'],
                                    },
                                    'selectionLines': {
                                        'type': 'array',
                                        'items': {
                                            'type': 'number'
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args) {
            const lineNumbers = this.getLineNumbers(args, editor);
            const levels = args && args.levels;
            const direction = args && args.direction;
            if (typeof levels !== 'number' && typeof direction !== 'string') {
                // fold the region at the location or if already collapsed, the first uncollapsed parent instead.
                (0, foldingModel_1.setCollapseStateUp)(foldingModel, true, lineNumbers);
            }
            else {
                if (direction === 'up') {
                    (0, foldingModel_1.setCollapseStateLevelsUp)(foldingModel, true, levels || 1, lineNumbers);
                }
                else {
                    (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true, levels || 1, lineNumbers);
                }
            }
        }
    }
    class ToggleFoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.toggleFold',
                label: nls.localize('toggleFoldAction.label', "Toggle Fold"),
                alias: 'Toggle Fold',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 42 /* KeyCode.KeyL */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            (0, foldingModel_1.toggleCollapseState)(foldingModel, 1, selectedLines);
        }
    }
    class FoldRecursivelyAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldRecursively',
                label: nls.localize('foldRecursivelyAction.label', "Fold Recursively"),
                alias: 'Fold Recursively',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 92 /* KeyCode.BracketLeft */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true, Number.MAX_VALUE, selectedLines);
        }
    }
    class FoldAllBlockCommentsAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldAllBlockComments',
                label: nls.localize('foldAllBlockComments.label', "Fold All Block Comments"),
                alias: 'Fold All Block Comments',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 90 /* KeyCode.Slash */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args, languageConfigurationService) {
            if (foldingModel.regions.hasTypes()) {
                (0, foldingModel_1.setCollapseStateForType)(foldingModel, languages_1.FoldingRangeKind.Comment.value, true);
            }
            else {
                const editorModel = editor.getModel();
                if (!editorModel) {
                    return;
                }
                const comments = languageConfigurationService.getLanguageConfiguration(editorModel.getLanguageId()).comments;
                if (comments && comments.blockCommentStartToken) {
                    const regExp = new RegExp('^\\s*' + (0, strings_1.escapeRegExpCharacters)(comments.blockCommentStartToken));
                    (0, foldingModel_1.setCollapseStateForMatchingLines)(foldingModel, regExp, true);
                }
            }
        }
    }
    class FoldAllRegionsAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldAllMarkerRegions',
                label: nls.localize('foldAllMarkerRegions.label', "Fold All Regions"),
                alias: 'Fold All Regions',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 29 /* KeyCode.Digit8 */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args, languageConfigurationService) {
            if (foldingModel.regions.hasTypes()) {
                (0, foldingModel_1.setCollapseStateForType)(foldingModel, languages_1.FoldingRangeKind.Region.value, true);
            }
            else {
                const editorModel = editor.getModel();
                if (!editorModel) {
                    return;
                }
                const foldingRules = languageConfigurationService.getLanguageConfiguration(editorModel.getLanguageId()).foldingRules;
                if (foldingRules && foldingRules.markers && foldingRules.markers.start) {
                    const regExp = new RegExp(foldingRules.markers.start);
                    (0, foldingModel_1.setCollapseStateForMatchingLines)(foldingModel, regExp, true);
                }
            }
        }
    }
    class UnfoldAllRegionsAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfoldAllMarkerRegions',
                label: nls.localize('unfoldAllMarkerRegions.label', "Unfold All Regions"),
                alias: 'Unfold All Regions',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 30 /* KeyCode.Digit9 */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args, languageConfigurationService) {
            if (foldingModel.regions.hasTypes()) {
                (0, foldingModel_1.setCollapseStateForType)(foldingModel, languages_1.FoldingRangeKind.Region.value, false);
            }
            else {
                const editorModel = editor.getModel();
                if (!editorModel) {
                    return;
                }
                const foldingRules = languageConfigurationService.getLanguageConfiguration(editorModel.getLanguageId()).foldingRules;
                if (foldingRules && foldingRules.markers && foldingRules.markers.start) {
                    const regExp = new RegExp(foldingRules.markers.start);
                    (0, foldingModel_1.setCollapseStateForMatchingLines)(foldingModel, regExp, false);
                }
            }
        }
    }
    class FoldAllExceptAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldAllExcept',
                label: nls.localize('foldAllExcept.label', "Fold All Except Selected"),
                alias: 'Fold All Except Selected',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 88 /* KeyCode.Minus */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            (0, foldingModel_1.setCollapseStateForRest)(foldingModel, true, selectedLines);
        }
    }
    class UnfoldAllExceptAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfoldAllExcept',
                label: nls.localize('unfoldAllExcept.label', "Unfold All Except Selected"),
                alias: 'Unfold All Except Selected',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 86 /* KeyCode.Equal */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            (0, foldingModel_1.setCollapseStateForRest)(foldingModel, false, selectedLines);
        }
    }
    class FoldAllAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldAll',
                label: nls.localize('foldAllAction.label', "Fold All"),
                alias: 'Fold All',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 21 /* KeyCode.Digit0 */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, _editor) {
            (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true);
        }
    }
    class UnfoldAllAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfoldAll',
                label: nls.localize('unfoldAllAction.label', "Unfold All"),
                alias: 'Unfold All',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 40 /* KeyCode.KeyJ */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, _editor) {
            (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false);
        }
    }
    class FoldLevelAction extends FoldingAction {
        static { this.ID_PREFIX = 'editor.foldLevel'; }
        static { this.ID = (level) => FoldLevelAction.ID_PREFIX + level; }
        getFoldingLevel() {
            return parseInt(this.id.substr(FoldLevelAction.ID_PREFIX.length));
        }
        invoke(_foldingController, foldingModel, editor) {
            (0, foldingModel_1.setCollapseStateAtLevel)(foldingModel, this.getFoldingLevel(), true, this.getSelectedLines(editor));
        }
    }
    /** Action to go to the parent fold of current line */
    class GotoParentFoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.gotoParentFold',
                label: nls.localize('gotoParentFold.label', "Go to Parent Fold"),
                alias: 'Go to Parent Fold',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            if (selectedLines.length > 0) {
                const startLineNumber = (0, foldingModel_1.getParentFoldLine)(selectedLines[0], foldingModel);
                if (startLineNumber !== null) {
                    editor.setSelection({
                        startLineNumber: startLineNumber,
                        startColumn: 1,
                        endLineNumber: startLineNumber,
                        endColumn: 1
                    });
                }
            }
        }
    }
    /** Action to go to the previous fold of current line */
    class GotoPreviousFoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.gotoPreviousFold',
                label: nls.localize('gotoPreviousFold.label', "Go to Previous Folding Range"),
                alias: 'Go to Previous Folding Range',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            if (selectedLines.length > 0) {
                const startLineNumber = (0, foldingModel_1.getPreviousFoldLine)(selectedLines[0], foldingModel);
                if (startLineNumber !== null) {
                    editor.setSelection({
                        startLineNumber: startLineNumber,
                        startColumn: 1,
                        endLineNumber: startLineNumber,
                        endColumn: 1
                    });
                }
            }
        }
    }
    /** Action to go to the next fold of current line */
    class GotoNextFoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.gotoNextFold',
                label: nls.localize('gotoNextFold.label', "Go to Next Folding Range"),
                alias: 'Go to Next Folding Range',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            if (selectedLines.length > 0) {
                const startLineNumber = (0, foldingModel_1.getNextFoldLine)(selectedLines[0], foldingModel);
                if (startLineNumber !== null) {
                    editor.setSelection({
                        startLineNumber: startLineNumber,
                        startColumn: 1,
                        endLineNumber: startLineNumber,
                        endColumn: 1
                    });
                }
            }
        }
    }
    class FoldRangeFromSelectionAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.createFoldingRangeFromSelection',
                label: nls.localize('createManualFoldRange.label', "Create Folding Range from Selection"),
                alias: 'Create Folding Range from Selection',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 87 /* KeyCode.Comma */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const collapseRanges = [];
            const selections = editor.getSelections();
            if (selections) {
                for (const selection of selections) {
                    let endLineNumber = selection.endLineNumber;
                    if (selection.endColumn === 1) {
                        --endLineNumber;
                    }
                    if (endLineNumber > selection.startLineNumber) {
                        collapseRanges.push({
                            startLineNumber: selection.startLineNumber,
                            endLineNumber: endLineNumber,
                            type: undefined,
                            isCollapsed: true,
                            source: 1 /* FoldSource.userDefined */
                        });
                        editor.setSelection({
                            startLineNumber: selection.startLineNumber,
                            startColumn: 1,
                            endLineNumber: selection.startLineNumber,
                            endColumn: 1
                        });
                    }
                }
                if (collapseRanges.length > 0) {
                    collapseRanges.sort((a, b) => {
                        return a.startLineNumber - b.startLineNumber;
                    });
                    const newRanges = foldingRanges_1.FoldingRegions.sanitizeAndMerge(foldingModel.regions, collapseRanges, editor.getModel()?.getLineCount());
                    foldingModel.updatePost(foldingRanges_1.FoldingRegions.fromFoldRanges(newRanges));
                }
            }
        }
    }
    class RemoveFoldRangeFromSelectionAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.removeManualFoldingRanges',
                label: nls.localize('removeManualFoldingRanges.label', "Remove Manual Folding Ranges"),
                alias: 'Remove Manual Folding Ranges',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(foldingController, foldingModel, editor) {
            const selections = editor.getSelections();
            if (selections) {
                const ranges = [];
                for (const selection of selections) {
                    const { startLineNumber, endLineNumber } = selection;
                    ranges.push(endLineNumber >= startLineNumber ? { startLineNumber, endLineNumber } : { endLineNumber, startLineNumber });
                }
                foldingModel.removeManualRanges(ranges);
                foldingController.triggerFoldingModelChanged();
            }
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(FoldingController.ID, FoldingController, 0 /* EditorContributionInstantiation.Eager */); // eager because it uses `saveViewState`/`restoreViewState`
    (0, editorExtensions_1.registerEditorAction)(UnfoldAction);
    (0, editorExtensions_1.registerEditorAction)(UnFoldRecursivelyAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAction);
    (0, editorExtensions_1.registerEditorAction)(FoldRecursivelyAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAllAction);
    (0, editorExtensions_1.registerEditorAction)(UnfoldAllAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAllBlockCommentsAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAllRegionsAction);
    (0, editorExtensions_1.registerEditorAction)(UnfoldAllRegionsAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAllExceptAction);
    (0, editorExtensions_1.registerEditorAction)(UnfoldAllExceptAction);
    (0, editorExtensions_1.registerEditorAction)(ToggleFoldAction);
    (0, editorExtensions_1.registerEditorAction)(GotoParentFoldAction);
    (0, editorExtensions_1.registerEditorAction)(GotoPreviousFoldAction);
    (0, editorExtensions_1.registerEditorAction)(GotoNextFoldAction);
    (0, editorExtensions_1.registerEditorAction)(FoldRangeFromSelectionAction);
    (0, editorExtensions_1.registerEditorAction)(RemoveFoldRangeFromSelectionAction);
    for (let i = 1; i <= 7; i++) {
        (0, editorExtensions_1.registerInstantiatedEditorAction)(new FoldLevelAction({
            id: FoldLevelAction.ID(i),
            label: nls.localize('foldLevelAction.label', "Fold Level {0}", i),
            alias: `Fold Level ${i}`,
            precondition: CONTEXT_FOLDING_ENABLED,
            kbOpts: {
                kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | (21 /* KeyCode.Digit0 */ + i)),
                weight: 100 /* KeybindingWeight.EditorContrib */
            }
        }));
    }
    commands_1.CommandsRegistry.registerCommand('_executeFoldingRangeProvider', async function (accessor, ...args) {
        const [resource] = args;
        if (!(resource instanceof uri_1.URI)) {
            throw (0, errors_1.illegalArgument)();
        }
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const model = accessor.get(model_1.IModelService).getModel(resource);
        if (!model) {
            throw (0, errors_1.illegalArgument)();
        }
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        if (!configurationService.getValue('editor.folding', { resource })) {
            return [];
        }
        const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
        const strategy = configurationService.getValue('editor.foldingStrategy', { resource });
        const foldingLimitReporter = {
            get limit() {
                return configurationService.getValue('editor.foldingMaximumRegions', { resource });
            },
            update: (computed, limited) => { }
        };
        const indentRangeProvider = new indentRangeProvider_1.IndentRangeProvider(model, languageConfigurationService, foldingLimitReporter);
        let rangeProvider = indentRangeProvider;
        if (strategy !== 'indentation') {
            const providers = FoldingController.getFoldingRangeProviders(languageFeaturesService, model);
            if (providers.length) {
                rangeProvider = new syntaxRangeProvider_1.SyntaxRangeProvider(model, providers, () => { }, foldingLimitReporter, indentRangeProvider);
            }
        }
        const ranges = await rangeProvider.compute(cancellation_1.CancellationToken.None);
        const result = [];
        try {
            if (ranges) {
                for (let i = 0; i < ranges.length; i++) {
                    const type = ranges.getType(i);
                    result.push({ start: ranges.getStartLineNumber(i), end: ranges.getEndLineNumber(i), kind: type ? languages_1.FoldingRangeKind.fromValue(type) : undefined });
                }
            }
            return result;
        }
        finally {
            rangeProvider.dispose();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZm9sZGluZy9icm93c2VyL2ZvbGRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXlDaEcsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFzQjdFLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsc0JBQVU7O2lCQUV6QixPQUFFLEdBQUcsd0JBQXdCLEFBQTNCLENBQTRCO1FBRTlDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBbUI7WUFDcEMsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUFvQixtQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBSU0sTUFBTSxDQUFDLHdCQUF3QixDQUFDLHVCQUFpRCxFQUFFLEtBQWlCO1lBQzFHLE1BQU0scUJBQXFCLEdBQUcsdUJBQXVCLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFGLE9BQU8sQ0FBQyxtQkFBaUIsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDLElBQUkscUJBQXFCLENBQUM7UUFDM0csQ0FBQztRQUVNLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQyxvQkFBa0Q7WUFDL0YsbUJBQWlCLENBQUMscUJBQXFCLEdBQUcsb0JBQW9CLENBQUM7WUFDL0QsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxtQkFBaUIsQ0FBQyxxQkFBcUIsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNwRixDQUFDO1FBOEJELFlBQ0MsTUFBbUIsRUFDQyxpQkFBc0QsRUFD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