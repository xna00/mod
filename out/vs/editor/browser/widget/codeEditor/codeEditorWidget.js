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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/network", "vs/editor/browser/config/domFontInfo", "vs/editor/browser/config/editorConfiguration", "vs/editor/browser/config/tabFocus", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/view", "vs/editor/browser/view/domLineBreaksComputer", "vs/editor/browser/view/viewUserInputEvents", "vs/editor/browser/widget/codeEditor/codeEditorContributions", "vs/editor/common/config/editorOptions", "vs/editor/common/core/cursorColumns", "vs/editor/common/core/editorColorRegistry", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/cursor/cursorWordOperations", "vs/editor/common/editorAction", "vs/editor/common/editorCommon", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/model/textModel", "vs/editor/common/services/languageFeatures", "vs/editor/common/viewModel/monospaceLineBreaksComputer", "vs/editor/common/viewModel/viewModelImpl", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/notification/common/notification", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/editor/browser/services/markerDecorations", "vs/css!./editor"], function (require, exports, dom, errors_1, event_1, hash_1, lifecycle_1, network_1, domFontInfo_1, editorConfiguration_1, tabFocus_1, editorExtensions_1, codeEditorService_1, view_1, domLineBreaksComputer_1, viewUserInputEvents_1, codeEditorContributions_1, editorOptions_1, cursorColumns_1, editorColorRegistry_1, position_1, range_1, selection_1, cursorWordOperations_1, editorAction_1, editorCommon, editorContextKeys_1, languageConfigurationRegistry_1, textModel_1, languageFeatures_1, monospaceLineBreaksComputer_1, viewModelImpl_1, nls, accessibility_1, commands_1, contextkey_1, instantiation_1, serviceCollection_1, notification_1, colorRegistry_1, themeService_1) {
    "use strict";
    var CodeEditorWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorModeContext = exports.BooleanEventEmitter = exports.CodeEditorWidget = void 0;
    let CodeEditorWidget = class CodeEditorWidget extends lifecycle_1.Disposable {
        static { CodeEditorWidget_1 = this; }
        static { this.dropIntoEditorDecorationOptions = textModel_1.ModelDecorationOptions.register({
            description: 'workbench-dnd-target',
            className: 'dnd-target'
        }); }
        //#endregion
        get isSimpleWidget() {
            return this._configuration.isSimpleWidget;
        }
        get contextKeyService() { return this._contextKeyService; }
        constructor(domElement, _options, codeEditorWidgetOptions, instantiationService, codeEditorService, commandService, contextKeyService, themeService, notificationService, accessibilityService, languageConfigurationService, languageFeaturesService) {
            super();
            this.languageConfigurationService = languageConfigurationService;
            //#region Eventing
            this._deliveryQueue = (0, event_1.createEventDeliveryQueue)();
            this._contributions = this._register(new codeEditorContributions_1.CodeEditorContributions());
            this._onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this._onDidDispose.event;
            this._onDidChangeModelContent = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidChangeModelContent = this._onDidChangeModelContent.event;
            this._onDidChangeModelLanguage = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidChangeModelLanguage = this._onDidChangeModelLanguage.event;
            this._onDidChangeModelLanguageConfiguration = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidChangeModelLanguageConfiguration = this._onDidChangeModelLanguageConfiguration.event;
            this._onDidChangeModelOptions = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidChangeModelOptions = this._onDidChangeModelOptions.event;
            this._onDidChangeModelDecorations = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidChangeModelDecorations = this._onDidChangeModelDecorations.event;
            this._onDidChangeModelTokens = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidChangeModelTokens = this._onDidChangeModelTokens.event;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._onWillChangeModel = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onWillChangeModel = this._onWillChangeModel.event;
            this._onDidChangeModel = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidChangeModel = this._onDidChangeModel.event;
            this._onDidChangeCursorPosition = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidChangeCursorPosition = this._onDidChangeCursorPosition.event;
            this._onDidChangeCursorSelection = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidChangeCursorSelection = this._onDidChangeCursorSelection.event;
            this._onDidAttemptReadOnlyEdit = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onDidAttemptReadOnlyEdit = this._onDidAttemptReadOnlyEdit.event;
            this._onDidLayoutChange = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidLayoutChange = this._onDidLayoutChange.event;
            this._editorTextFocus = this._register(new BooleanEventEmitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidFocusEditorText = this._editorTextFocus.onDidChangeToTrue;
            this.onDidBlurEditorText = this._editorTextFocus.onDidChangeToFalse;
            this._editorWidgetFocus = this._register(new BooleanEventEmitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidFocusEditorWidget = this._editorWidgetFocus.onDidChangeToTrue;
            this.onDidBlurEditorWidget = this._editorWidgetFocus.onDidChangeToFalse;
            this._onWillType = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onWillType = this._onWillType.event;
            this._onDidType = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onDidType = this._onDidType.event;
            this._onDidCompositionStart = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onDidCompositionStart = this._onDidCompositionStart.event;
            this._onDidCompositionEnd = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onDidCompositionEnd = this._onDidCompositionEnd.event;
            this._onDidPaste = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onDidPaste = this._onDidPaste.event;
            this._onMouseUp = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onMouseUp = this._onMouseUp.event;
            this._onMouseDown = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onMouseDown = this._onMouseDown.event;
            this._onMouseDrag = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onMouseDrag = this._onMouseDrag.event;
            this._onMouseDrop = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onMouseDrop = this._onMouseDrop.event;
            this._onMouseDropCanceled = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onMouseDropCanceled = this._onMouseDropCanceled.event;
            this._onDropIntoEditor = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onDropIntoEditor = this._onDropIntoEditor.event;
            this._onContextMenu = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onContextMenu = this._onContextMenu.event;
            this._onMouseMove = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onMouseMove = this._onMouseMove.event;
            this._onMouseLeave = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onMouseLeave = this._onMouseLeave.event;
            this._onMouseWheel = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onMouseWheel = this._onMouseWheel.event;
            this._onKeyUp = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onKeyUp = this._onKeyUp.event;
            this._onKeyDown = this._register(new InteractionEmitter(this._contributions, this._deliveryQueue));
            this.onKeyDown = this._onKeyDown.event;
            this._onDidContentSizeChange = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidContentSizeChange = this._onDidContentSizeChange.event;
            this._onDidScrollChange = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidScrollChange = this._onDidScrollChange.event;
            this._onDidChangeViewZones = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidChangeViewZones = this._onDidChangeViewZones.event;
            this._onDidChangeHiddenAreas = this._register(new event_1.Emitter({ deliveryQueue: this._deliveryQueue }));
            this.onDidChangeHiddenAreas = this._onDidChangeHiddenAreas.event;
            this._actions = new Map();
            this._bannerDomNode = null;
            this._dropIntoEditorDecorations = this.createDecorationsCollection();
            codeEditorService.willCreateCodeEditor();
            const options = { ..._options };
            this._domElement = domElement;
            this._overflowWidgetsDomNode = options.overflowWidgetsDomNode;
            delete options.overflowWidgetsDomNode;
            this._id = (++EDITOR_ID);
            this._decorationTypeKeysToIds = {};
            this._decorationTypeSubtypes = {};
            this._telemetryData = codeEditorWidgetOptions.telemetryData;
            this._configuration = this._register(this._createConfiguration(codeEditorWidgetOptions.isSimpleWidget || false, options, accessibilityService));
            this._register(this._configuration.onDidChange((e) => {
                this._onDidChangeConfiguration.fire(e);
                const options = this._configuration.options;
                if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                    const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
                    this._onDidLayoutChange.fire(layoutInfo);
                }
            }));
            this._contextKeyService = this._register(contextKeyService.createScoped(this._domElement));
            this._notificationService = notificationService;
            this._codeEditorService = codeEditorService;
            this._commandService = commandService;
            this._themeService = themeService;
            this._register(new EditorContextKeysManager(this, this._contextKeyService));
            this._register(new EditorModeContext(this, this._contextKeyService, languageFeaturesService));
            this._instantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this._contextKeyService]));
            this._modelData = null;
            this._focusTracker = new CodeEditorWidgetFocusTracker(domElement, this._overflowWidgetsDomNode);
            this._register(this._focusTracker.onChange(() => {
                this._editorWidgetFocus.setValue(this._focusTracker.hasFocus());
            }));
            this._contentWidgets = {};
            this._overlayWidgets = {};
            this._glyphMarginWidgets = {};
            let contributions;
            if (Array.isArray(codeEditorWidgetOptions.contributions)) {
                contributions = codeEditorWidgetOptions.contributions;
            }
            else {
                contributions = editorExtensions_1.EditorExtensionsRegistry.getEditorContributions();
            }
            this._contributions.initialize(this, contributions, this._instantiationService);
            for (const action of editorExtensions_1.EditorExtensionsRegistry.getEditorActions()) {
                if (this._actions.has(action.id)) {
                    (0, errors_1.onUnexpectedError)(new Error(`Cannot have two actions with the same id ${action.id}`));
                    continue;
                }
                const internalAction = new editorAction_1.InternalEditorAction(action.id, action.label, action.alias, action.metadata, action.precondition ?? undefined, (args) => {
                    return this._instantiationService.invokeFunction((accessor) => {
                        return Promise.resolve(action.runEditorCommand(accessor, this, args));
                    });
                }, this._contextKeyService);
                this._actions.set(internalAction.id, internalAction);
            }
            const isDropIntoEnabled = () => {
                return !this._configuration.options.get(91 /* EditorOption.readOnly */)
                    && this._configuration.options.get(36 /* EditorOption.dropIntoEditor */).enabled;
            };
            this._register(new dom.DragAndDropObserver(this._domElement, {
                onDragOver: e => {
                    if (!isDropIntoEnabled()) {
                        return;
                    }
                    const target = this.getTargetAtClientPoint(e.clientX, e.clientY);
                    if (target?.position) {
                        this.showDropIndicatorAt(target.position);
                    }
                },
                onDrop: async (e) => {
                    if (!isDropIntoEnabled()) {
                        return;
                    }
                    this.removeDropIndicator();
                    if (!e.dataTransfer) {
                        return;
                    }
                    const target = this.getTargetAtClientPoint(e.clientX, e.clientY);
                    if (target?.position) {
                        this._onDropIntoEditor.fire({ position: target.position, event: e });
                    }
                },
                onDragLeave: () => {
                    this.removeDropIndicator();
                },
                onDragEnd: () => {
                    this.removeDropIndicator();
                },
            }));
            this._codeEditorService.addCodeEditor(this);
        }
        writeScreenReaderContent(reason) {
            this._modelData?.view.writeScreenReaderContent(reason);
        }
        _createConfiguration(isSimpleWidget, options, accessibilityService) {
            return new editorConfiguration_1.EditorConfiguration(isSimpleWidget, options, this._domElement, accessibilityService);
        }
        getId() {
            return this.getEditorType() + ':' + this._id;
        }
        getEditorType() {
            return editorCommon.EditorType.ICodeEditor;
        }
        dispose() {
            this._codeEditorService.removeCodeEditor(this);
            this._focusTracker.dispose();
            this._actions.clear();
            this._contentWidgets = {};
            this._overlayWidgets = {};
            this._removeDecorationTypes();
            this._postDetachModelCleanup(this._detachModel());
            this._onDidDispose.fire();
            super.dispose();
        }
        invokeWithinContext(fn) {
            return this._instantiationService.invokeFunction(fn);
        }
        updateOptions(newOptions) {
            this._configuration.updateOptions(newOptions || {});
        }
        getOptions() {
            return this._configuration.options;
        }
        getOption(id) {
            return this._configuration.options.get(id);
        }
        getRawOptions() {
            return this._configuration.getRawOptions();
        }
        getOverflowWidgetsDomNode() {
            return this._overflowWidgetsDomNode;
        }
        getConfiguredWordAtPosition(position) {
            if (!this._modelData) {
                return null;
            }
            return cursorWordOperations_1.WordOperations.getWordAtPosition(this._modelData.model, this._configuration.options.get(131 /* EditorOption.wordSeparators */), this._configuration.options.get(130 /* EditorOption.wordSegmenterLocales */), position);
        }
        getValue(options = null) {
            if (!this._modelData) {
                return '';
            }
            const preserveBOM = (options && options.preserveBOM) ? true : false;
            let eolPreference = 0 /* EndOfLinePreference.TextDefined */;
            if (options && options.lineEnding && options.lineEnding === '\n') {
                eolPreference = 1 /* EndOfLinePreference.LF */;
            }
            else if (options && options.lineEnding && options.lineEnding === '\r\n') {
                eolPreference = 2 /* EndOfLinePreference.CRLF */;
            }
            return this._modelData.model.getValue(eolPreference, preserveBOM);
        }
        setValue(newValue) {
            if (!this._modelData) {
                return;
            }
            this._modelData.model.setValue(newValue);
        }
        getModel() {
            if (!this._modelData) {
                return null;
            }
            return this._modelData.model;
        }
        setModel(_model = null) {
            const model = _model;
            if (this._modelData === null && model === null) {
                // Current model is the new model
                return;
            }
            if (this._modelData && this._modelData.model === model) {
                // Current model is the new model
                return;
            }
            const e = {
                oldModelUrl: this._modelData?.model.uri || null,
                newModelUrl: model?.uri || null
            };
            this._onWillChangeModel.fire(e);
            const hasTextFocus = this.hasTextFocus();
            const detachedModel = this._detachModel();
            this._attachModel(model);
            if (hasTextFocus && this.hasModel()) {
                this.focus();
            }
            this._removeDecorationTypes();
            this._onDidChangeModel.fire(e);
            this._postDetachModelCleanup(detachedModel);
            this._contributionsDisposable = this._contributions.onAfterModelAttached();
        }
        _removeDecorationTypes() {
            this._decorationTypeKeysToIds = {};
            if (this._decorationTypeSubtypes) {
                for (const decorationType in this._decorationTypeSubtypes) {
                    const subTypes = this._decorationTypeSubtypes[decorationType];
                    for (const subType in subTypes) {
                        this._removeDecorationType(decorationType + '-' + subType);
                    }
                }
                this._decorationTypeSubtypes = {};
            }
        }
        getVisibleRanges() {
            if (!this._modelData) {
                return [];
            }
            return this._modelData.viewModel.getVisibleRanges();
        }
        getVisibleRangesPlusViewportAboveBelow() {
            if (!this._modelData) {
                return [];
            }
            return this._modelData.viewModel.getVisibleRangesPlusViewportAboveBelow();
        }
        getWhitespaces() {
            if (!this._modelData) {
                return [];
            }
            return this._modelData.viewModel.viewLayout.getWhitespaces();
        }
        static _getVerticalOffsetAfterPosition(modelData, modelLineNumber, modelColumn, includeViewZones) {
            const modelPosition = modelData.model.validatePosition({
                lineNumber: modelLineNumber,
                column: modelColumn
            });
            const viewPosition = modelData.viewModel.coordinatesConverter.convertModelPositionToViewPosition(modelPosition);
            return modelData.viewModel.viewLayout.getVerticalOffsetAfterLineNumber(viewPosition.lineNumber, includeViewZones);
        }
        getTopForLineNumber(lineNumber, includeViewZones = false) {
            if (!this._modelData) {
                return -1;
            }
            return CodeEditorWidget_1._getVerticalOffsetForPosition(this._modelData, lineNumber, 1, includeViewZones);
        }
        getTopForPosition(lineNumber, column) {
            if (!this._modelData) {
                return -1;
            }
            return CodeEditorWidget_1._getVerticalOffsetForPosition(this._modelData, lineNumber, column, false);
        }
        static _getVerticalOffsetForPosition(modelData, modelLineNumber, modelColumn, includeViewZones = false) {
            const modelPosition = modelData.model.validatePosition({
                lineNumber: modelLineNumber,
                column: modelColumn
            });
            const viewPosition = modelData.viewModel.coordinatesConverter.convertModelPositionToViewPosition(modelPosition);
            return modelData.viewModel.viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber, includeViewZones);
        }
        getBottomForLineNumber(lineNumber, includeViewZones = false) {
            if (!this._modelData) {
                return -1;
            }
            return CodeEditorWidget_1._getVerticalOffsetAfterPosition(this._modelData, lineNumber, 1, includeViewZones);
        }
        setHiddenAreas(ranges, source) {
            this._modelData?.viewModel.setHiddenAreas(ranges.map(r => range_1.Range.lift(r)), source);
        }
        getVisibleColumnFromPosition(rawPosition) {
            if (!this._modelData) {
                return rawPosition.column;
            }
            const position = this._modelData.model.validatePosition(rawPosition);
            const tabSize = this._modelData.model.getOptions().tabSize;
            return cursorColumns_1.CursorColumns.visibleColumnFromColumn(this._modelData.model.getLineContent(position.lineNumber), position.column, tabSize) + 1;
        }
        getStatusbarColumn(rawPosition) {
            if (!this._modelData) {
                return rawPosition.column;
            }
            const position = this._modelData.model.validatePosition(rawPosition);
            const tabSize = this._modelData.model.getOptions().tabSize;
            return cursorColumns_1.CursorColumns.toStatusbarColumn(this._modelData.model.getLineContent(position.lineNumber), position.column, tabSize);
        }
        getPosition() {
            if (!this._modelData) {
                return null;
            }
            return this._modelData.viewModel.getPosition();
        }
        setPosition(position, source = 'api') {
            if (!this._modelData) {
                return;
            }
            if (!position_1.Position.isIPosition(position)) {
                throw new Error('Invalid arguments');
            }
            this._modelData.viewModel.setSelections(source, [{
                    selectionStartLineNumber: position.lineNumber,
                    selectionStartColumn: position.column,
                    positionLineNumber: position.lineNumber,
                    positionColumn: position.column
                }]);
        }
        _sendRevealRange(modelRange, verticalType, revealHorizontal, scrollType) {
            if (!this._modelData) {
                return;
            }
            if (!range_1.Range.isIRange(modelRange)) {
                throw new Error('Invalid arguments');
            }
            const validatedModelRange = this._modelData.model.validateRange(modelRange);
            const viewRange = this._modelData.viewModel.coordinatesConverter.convertModelRangeToViewRange(validatedModelRange);
            this._modelData.viewModel.revealRange('api', revealHorizontal, viewRange, verticalType, scrollType);
        }
        revealLine(lineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealLine(lineNumber, 0 /* VerticalRevealType.Simple */, scrollType);
        }
        revealLineInCenter(lineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealLine(lineNumber, 1 /* VerticalRevealType.Center */, scrollType);
        }
        revealLineInCenterIfOutsideViewport(lineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealLine(lineNumber, 2 /* VerticalRevealType.CenterIfOutsideViewport */, scrollType);
        }
        revealLineNearTop(lineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealLine(lineNumber, 5 /* VerticalRevealType.NearTop */, scrollType);
        }
        _revealLine(lineNumber, revealType, scrollType) {
            if (typeof lineNumber !== 'number') {
                throw new Error('Invalid arguments');
            }
            this._sendRevealRange(new range_1.Range(lineNumber, 1, lineNumber, 1), revealType, false, scrollType);
        }
        revealPosition(position, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealPosition(position, 0 /* VerticalRevealType.Simple */, true, scrollType);
        }
        revealPositionInCenter(position, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealPosition(position, 1 /* VerticalRevealType.Center */, true, scrollType);
        }
        revealPositionInCenterIfOutsideViewport(position, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealPosition(position, 2 /* VerticalRevealType.CenterIfOutsideViewport */, true, scrollType);
        }
        revealPositionNearTop(position, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealPosition(position, 5 /* VerticalRevealType.NearTop */, true, scrollType);
        }
        _revealPosition(position, verticalType, revealHorizontal, scrollType) {
            if (!position_1.Position.isIPosition(position)) {
                throw new Error('Invalid arguments');
            }
            this._sendRevealRange(new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column), verticalType, revealHorizontal, scrollType);
        }
        getSelection() {
            if (!this._modelData) {
                return null;
            }
            return this._modelData.viewModel.getSelection();
        }
        getSelections() {
            if (!this._modelData) {
                return null;
            }
            return this._modelData.viewModel.getSelections();
        }
        setSelection(something, source = 'api') {
            const isSelection = selection_1.Selection.isISelection(something);
            const isRange = range_1.Range.isIRange(something);
            if (!isSelection && !isRange) {
                throw new Error('Invalid arguments');
            }
            if (isSelection) {
                this._setSelectionImpl(something, source);
            }
            else if (isRange) {
                // act as if it was an IRange
                const selection = {
                    selectionStartLineNumber: something.startLineNumber,
                    selectionStartColumn: something.startColumn,
                    positionLineNumber: something.endLineNumber,
                    positionColumn: something.endColumn
                };
                this._setSelectionImpl(selection, source);
            }
        }
        _setSelectionImpl(sel, source) {
            if (!this._modelData) {
                return;
            }
            const selection = new selection_1.Selection(sel.selectionStartLineNumber, sel.selectionStartColumn, sel.positionLineNumber, sel.positionColumn);
            this._modelData.viewModel.setSelections(source, [selection]);
        }
        revealLines(startLineNumber, endLineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealLines(startLineNumber, endLineNumber, 0 /* VerticalRevealType.Simple */, scrollType);
        }
        revealLinesInCenter(startLineNumber, endLineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealLines(startLineNumber, endLineNumber, 1 /* VerticalRevealType.Center */, scrollType);
        }
        revealLinesInCenterIfOutsideViewport(startLineNumber, endLineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealLines(startLineNumber, endLineNumber, 2 /* VerticalRevealType.CenterIfOutsideViewport */, scrollType);
        }
        revealLinesNearTop(startLineNumber, endLineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealLines(startLineNumber, endLineNumber, 5 /* VerticalRevealType.NearTop */, scrollType);
        }
        _revealLines(startLineNumber, endLineNumber, verticalType, scrollType) {
            if (typeof startLineNumber !== 'number' || typeof endLineNumber !== 'number') {
                throw new Error('Invalid arguments');
            }
            this._sendRevealRange(new range_1.Range(startLineNumber, 1, endLineNumber, 1), verticalType, false, scrollType);
        }
        revealRange(range, scrollType = 0 /* editorCommon.ScrollType.Smooth */, revealVerticalInCenter = false, revealHorizontal = true) {
            this._revealRange(range, revealVerticalInCenter ? 1 /* VerticalRevealType.Center */ : 0 /* VerticalRevealType.Simple */, revealHorizontal, scrollType);
        }
        revealRangeInCenter(range, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealRange(range, 1 /* VerticalRevealType.Center */, true, scrollType);
        }
        revealRangeInCenterIfOutsideViewport(range, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealRange(range, 2 /* VerticalRevealType.CenterIfOutsideViewport */, true, scrollType);
        }
        revealRangeNearTop(range, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealRange(range, 5 /* VerticalRevealType.NearTop */, true, scrollType);
        }
        revealRangeNearTopIfOutsideViewport(range, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealRange(range, 6 /* VerticalRevealType.NearTopIfOutsideViewport */, true, scrollType);
        }
        revealRangeAtTop(range, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._revealRange(range, 3 /* VerticalRevealType.Top */, true, scrollType);
        }
        _revealRange(range, verticalType, revealHorizontal, scrollType) {
            if (!range_1.Range.isIRange(range)) {
                throw new Error('Invalid arguments');
            }
            this._sendRevealRange(range_1.Range.lift(range), verticalType, revealHorizontal, scrollType);
        }
        setSelections(ranges, source = 'api', reason = 0 /* CursorChangeReason.NotSet */) {
            if (!this._modelData) {
                return;
            }
            if (!ranges || ranges.length === 0) {
                throw new Error('Invalid arguments');
            }
            for (let i = 0, len = ranges.length; i < len; i++) {
                if (!selection_1.Selection.isISelection(ranges[i])) {
                    throw new Error('Invalid arguments');
                }
            }
            this._modelData.viewModel.setSelections(source, ranges, reason);
        }
        getContentWidth() {
            if (!this._modelData) {
                return -1;
            }
            return this._modelData.viewModel.viewLayout.getContentWidth();
        }
        getScrollWidth() {
            if (!this._modelData) {
                return -1;
            }
            return this._modelData.viewModel.viewLayout.getScrollWidth();
        }
        getScrollLeft() {
            if (!this._modelData) {
                return -1;
            }
            return this._modelData.viewModel.viewLayout.getCurrentScrollLeft();
        }
        getContentHeight() {
            if (!this._modelData) {
                return -1;
            }
            return this._modelData.viewModel.viewLayout.getContentHeight();
        }
        getScrollHeight() {
            if (!this._modelData) {
                return -1;
            }
            return this._modelData.viewModel.viewLayout.getScrollHeight();
        }
        getScrollTop() {
            if (!this._modelData) {
                return -1;
            }
            return this._modelData.viewModel.viewLayout.getCurrentScrollTop();
        }
        setScrollLeft(newScrollLeft, scrollType = 1 /* editorCommon.ScrollType.Immediate */) {
            if (!this._modelData) {
                return;
            }
            if (typeof newScrollLeft !== 'number') {
                throw new Error('Invalid arguments');
            }
            this._modelData.viewModel.viewLayout.setScrollPosition({
                scrollLeft: newScrollLeft
            }, scrollType);
        }
        setScrollTop(newScrollTop, scrollType = 1 /* editorCommon.ScrollType.Immediate */) {
            if (!this._modelData) {
                return;
            }
            if (typeof newScrollTop !== 'number') {
                throw new Error('Invalid arguments');
            }
            this._modelData.viewModel.viewLayout.setScrollPosition({
                scrollTop: newScrollTop
            }, scrollType);
        }
        setScrollPosition(position, scrollType = 1 /* editorCommon.ScrollType.Immediate */) {
            if (!this._modelData) {
                return;
            }
            this._modelData.viewModel.viewLayout.setScrollPosition(position, scrollType);
        }
        hasPendingScrollAnimation() {
            if (!this._modelData) {
                return false;
            }
            return this._modelData.viewModel.viewLayout.hasPendingScrollAnimation();
        }
        saveViewState() {
            if (!this._modelData) {
                return null;
            }
            const contributionsState = this._contributions.saveViewState();
            const cursorState = this._modelData.viewModel.saveCursorState();
            const viewState = this._modelData.viewModel.saveState();
            return {
                cursorState: cursorState,
                viewState: viewState,
                contributionsState: contributionsState
            };
        }
        restoreViewState(s) {
            if (!this._modelData || !this._modelData.hasRealView) {
                return;
            }
            const codeEditorState = s;
            if (codeEditorState && codeEditorState.cursorState && codeEditorState.viewState) {
                const cursorState = codeEditorState.cursorState;
                if (Array.isArray(cursorState)) {
                    if (cursorState.length > 0) {
                        this._modelData.viewModel.restoreCursorState(cursorState);
                    }
                }
                else {
                    // Backwards compatibility
                    this._modelData.viewModel.restoreCursorState([cursorState]);
                }
                this._contributions.restoreViewState(codeEditorState.contributionsState || {});
                const reducedState = this._modelData.viewModel.reduceRestoreState(codeEditorState.viewState);
                this._modelData.view.restoreState(reducedState);
            }
        }
        handleInitialized() {
            this._getViewModel()?.visibleLinesStabilized();
        }
        onVisible() {
            this._modelData?.view.refreshFocusState();
        }
        onHide() {
            this._modelData?.view.refreshFocusState();
            this._focusTracker.refreshState();
        }
        getContribution(id) {
            return this._contributions.get(id);
        }
        getActions() {
            return Array.from(this._actions.values());
        }
        getSupportedActions() {
            let result = this.getActions();
            result = result.filter(action => action.isSupported());
            return result;
        }
        getAction(id) {
            return this._actions.get(id) || null;
        }
        trigger(source, handlerId, payload) {
            payload = payload || {};
            switch (handlerId) {
                case "compositionStart" /* editorCommon.Handler.CompositionStart */:
                    this._startComposition();
                    return;
                case "compositionEnd" /* editorCommon.Handler.CompositionEnd */:
                    this._endComposition(source);
                    return;
                case "type" /* editorCommon.Handler.Type */: {
                    const args = payload;
                    this._type(source, args.text || '');
                    return;
                }
                case "replacePreviousChar" /* editorCommon.Handler.ReplacePreviousChar */: {
                    const args = payload;
                    this._compositionType(source, args.text || '', args.replaceCharCnt || 0, 0, 0);
                    return;
                }
                case "compositionType" /* editorCommon.Handler.CompositionType */: {
                    const args = payload;
                    this._compositionType(source, args.text || '', args.replacePrevCharCnt || 0, args.replaceNextCharCnt || 0, args.positionDelta || 0);
                    return;
                }
                case "paste" /* editorCommon.Handler.Paste */: {
                    const args = payload;
                    this._paste(source, args.text || '', args.pasteOnNewLine || false, args.multicursorText || null, args.mode || null, args.clipboardEvent);
                    return;
                }
                case "cut" /* editorCommon.Handler.Cut */:
                    this._cut(source);
                    return;
            }
            const action = this.getAction(handlerId);
            if (action) {
                Promise.resolve(action.run(payload)).then(undefined, errors_1.onUnexpectedError);
                return;
            }
            if (!this._modelData) {
                return;
            }
            if (this._triggerEditorCommand(source, handlerId, payload)) {
                return;
            }
            this._triggerCommand(handlerId, payload);
        }
        _triggerCommand(handlerId, payload) {
            this._commandService.executeCommand(handlerId, payload);
        }
        _startComposition() {
            if (!this._modelData) {
                return;
            }
            this._modelData.viewModel.startComposition();
            this._onDidCompositionStart.fire();
        }
        _endComposition(source) {
            if (!this._modelData) {
                return;
            }
            this._modelData.viewModel.endComposition(source);
            this._onDidCompositionEnd.fire();
        }
        _type(source, text) {
            if (!this._modelData || text.length === 0) {
                return;
            }
            if (source === 'keyboard') {
                this._onWillType.fire(text);
            }
            this._modelData.viewModel.type(text, source);
            if (source === 'keyboard') {
                this._onDidType.fire(text);
            }
        }
        _compositionType(source, text, replacePrevCharCnt, replaceNextCharCnt, positionDelta) {
            if (!this._modelData) {
                return;
            }
            this._modelData.viewModel.compositionType(text, replacePrevCharCnt, replaceNextCharCnt, positionDelta, source);
        }
        _paste(source, text, pasteOnNewLine, multicursorText, mode, clipboardEvent) {
            if (!this._modelData) {
                return;
            }
            const viewModel = this._modelData.viewModel;
            const startPosition = viewModel.getSelection().getStartPosition();
            viewModel.paste(text, pasteOnNewLine, multicursorText, source);
            const endPosition = viewModel.getSelection().getStartPosition();
            if (source === 'keyboard') {
                this._onDidPaste.fire({
                    clipboardEvent,
                    range: new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column),
                    languageId: mode
                });
            }
        }
        _cut(source) {
            if (!this._modelData) {
                return;
            }
            this._modelData.viewModel.cut(source);
        }
        _triggerEditorCommand(source, handlerId, payload) {
            const command = editorExtensions_1.EditorExtensionsRegistry.getEditorCommand(handlerId);
            if (command) {
                payload = payload || {};
                payload.source = source;
                this._instantiationService.invokeFunction((accessor) => {
                    Promise.resolve(command.runEditorCommand(accessor, this, payload)).then(undefined, errors_1.onUnexpectedError);
                });
                return true;
            }
            return false;
        }
        _getViewModel() {
            if (!this._modelData) {
                return null;
            }
            return this._modelData.viewModel;
        }
        pushUndoStop() {
            if (!this._modelData) {
                return false;
            }
            if (this._configuration.options.get(91 /* EditorOption.readOnly */)) {
                // read only editor => sorry!
                return false;
            }
            this._modelData.model.pushStackElement();
            return true;
        }
        popUndoStop() {
            if (!this._modelData) {
                return false;
            }
            if (this._configuration.options.get(91 /* EditorOption.readOnly */)) {
                // read only editor => sorry!
                return false;
            }
            this._modelData.model.popStackElement();
            return true;
        }
        executeEdits(source, edits, endCursorState) {
            if (!this._modelData) {
                return false;
            }
            if (this._configuration.options.get(91 /* EditorOption.readOnly */)) {
                // read only editor => sorry!
                return false;
            }
            let cursorStateComputer;
            if (!endCursorState) {
                cursorStateComputer = () => null;
            }
            else if (Array.isArray(endCursorState)) {
                cursorStateComputer = () => endCursorState;
            }
            else {
                cursorStateComputer = endCursorState;
            }
            this._modelData.viewModel.executeEdits(source, edits, cursorStateComputer);
            return true;
        }
        executeCommand(source, command) {
            if (!this._modelData) {
                return;
            }
            this._modelData.viewModel.executeCommand(command, source);
        }
        executeCommands(source, commands) {
            if (!this._modelData) {
                return;
            }
            this._modelData.viewModel.executeCommands(commands, source);
        }
        createDecorationsCollection(decorations) {
            return new EditorDecorationsCollection(this, decorations);
        }
        changeDecorations(callback) {
            if (!this._modelData) {
                // callback will not be called
                return null;
            }
            return this._modelData.model.changeDecorations(callback, this._id);
        }
        getLineDecorations(lineNumber) {
            if (!this._modelData) {
                return null;
            }
            return this._modelData.model.getLineDecorations(lineNumber, this._id, (0, editorOptions_1.filterValidationDecorations)(this._configuration.options));
        }
        getDecorationsInRange(range) {
            if (!this._modelData) {
                return null;
            }
            return this._modelData.model.getDecorationsInRange(range, this._id, (0, editorOptions_1.filterValidationDecorations)(this._configuration.options));
        }
        /**
         * @deprecated
         */
        deltaDecorations(oldDecorations, newDecorations) {
            if (!this._modelData) {
                return [];
            }
            if (oldDecorations.length === 0 && newDecorations.length === 0) {
                return oldDecorations;
            }
            return this._modelData.model.deltaDecorations(oldDecorations, newDecorations, this._id);
        }
        removeDecorations(decorationIds) {
            if (!this._modelData || decorationIds.length === 0) {
                return;
            }
            this._modelData.model.changeDecorations((changeAccessor) => {
                changeAccessor.deltaDecorations(decorationIds, []);
            });
        }
        setDecorationsByType(description, decorationTypeKey, decorationOptions) {
            const newDecorationsSubTypes = {};
            const oldDecorationsSubTypes = this._decorationTypeSubtypes[decorationTypeKey] || {};
            this._decorationTypeSubtypes[decorationTypeKey] = newDecorationsSubTypes;
            const newModelDecorations = [];
            for (const decorationOption of decorationOptions) {
                let typeKey = decorationTypeKey;
                if (decorationOption.renderOptions) {
                    // identify custom render options by a hash code over all keys and values
                    // For custom render options register a decoration type if necessary
                    const subType = (0, hash_1.hash)(decorationOption.renderOptions).toString(16);
                    // The fact that `decorationTypeKey` appears in the typeKey has no influence
                    // it is just a mechanism to get predictable and unique keys (repeatable for the same options and unique across clients)
                    typeKey = decorationTypeKey + '-' + subType;
                    if (!oldDecorationsSubTypes[subType] && !newDecorationsSubTypes[subType]) {
                        // decoration type did not exist before, register new one
                        this._registerDecorationType(description, typeKey, decorationOption.renderOptions, decorationTypeKey);
                    }
                    newDecorationsSubTypes[subType] = true;
                }
                const opts = this._resolveDecorationOptions(typeKey, !!decorationOption.hoverMessage);
                if (decorationOption.hoverMessage) {
                    opts.hoverMessage = decorationOption.hoverMessage;
                }
                newModelDecorations.push({ range: decorationOption.range, options: opts });
            }
            // remove decoration sub types that are no longer used, deregister decoration type if necessary
            for (const subType in oldDecorationsSubTypes) {
                if (!newDecorationsSubTypes[subType]) {
                    this._removeDecorationType(decorationTypeKey + '-' + subType);
                }
            }
            // update all decorations
            const oldDecorationsIds = this._decorationTypeKeysToIds[decorationTypeKey] || [];
            this.changeDecorations(accessor => this._decorationTypeKeysToIds[decorationTypeKey] = accessor.deltaDecorations(oldDecorationsIds, newModelDecorations));
        }
        setDecorationsByTypeFast(decorationTypeKey, ranges) {
            // remove decoration sub types that are no longer used, deregister decoration type if necessary
            const oldDecorationsSubTypes = this._decorationTypeSubtypes[decorationTypeKey] || {};
            for (const subType in oldDecorationsSubTypes) {
                this._removeDecorationType(decorationTypeKey + '-' + subType);
            }
            this._decorationTypeSubtypes[decorationTypeKey] = {};
            const opts = textModel_1.ModelDecorationOptions.createDynamic(this._resolveDecorationOptions(decorationTypeKey, false));
            const newModelDecorations = new Array(ranges.length);
            for (let i = 0, len = ranges.length; i < len; i++) {
                newModelDecorations[i] = { range: ranges[i], options: opts };
            }
            // update all decorations
            const oldDecorationsIds = this._decorationTypeKeysToIds[decorationTypeKey] || [];
            this.changeDecorations(accessor => this._decorationTypeKeysToIds[decorationTypeKey] = accessor.deltaDecorations(oldDecorationsIds, newModelDecorations));
        }
        removeDecorationsByType(decorationTypeKey) {
            // remove decorations for type and sub type
            const oldDecorationsIds = this._decorationTypeKeysToIds[decorationTypeKey];
            if (oldDecorationsIds) {
                this.changeDecorations(accessor => accessor.deltaDecorations(oldDecorationsIds, []));
            }
            if (this._decorationTypeKeysToIds.hasOwnProperty(decorationTypeKey)) {
                delete this._decorationTypeKeysToIds[decorationTypeKey];
            }
            if (this._decorationTypeSubtypes.hasOwnProperty(decorationTypeKey)) {
                delete this._decorationTypeSubtypes[decorationTypeKey];
            }
        }
        getLayoutInfo() {
            const options = this._configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            return layoutInfo;
        }
        createOverviewRuler(cssClassName) {
            if (!this._modelData || !this._modelData.hasRealView) {
                return null;
            }
            return this._modelData.view.createOverviewRuler(cssClassName);
        }
        getContainerDomNode() {
            return this._domElement;
        }
        getDomNode() {
            if (!this._modelData || !this._modelData.hasRealView) {
                return null;
            }
            return this._modelData.view.domNode.domNode;
        }
        delegateVerticalScrollbarPointerDown(browserEvent) {
            if (!this._modelData || !this._modelData.hasRealView) {
                return;
            }
            this._modelData.view.delegateVerticalScrollbarPointerDown(browserEvent);
        }
        delegateScrollFromMouseWheelEvent(browserEvent) {
            if (!this._modelData || !this._modelData.hasRealView) {
                return;
            }
            this._modelData.view.delegateScrollFromMouseWheelEvent(browserEvent);
        }
        layout(dimension, postponeRendering = false) {
            this._configuration.observeContainer(dimension);
            if (!postponeRendering) {
                this.render();
            }
        }
        focus() {
            if (!this._modelData || !this._modelData.hasRealView) {
                return;
            }
            this._modelData.view.focus();
        }
        hasTextFocus() {
            if (!this._modelData || !this._modelData.hasRealView) {
                return false;
            }
            return this._modelData.view.isFocused();
        }
        hasWidgetFocus() {
            return this._focusTracker && this._focusTracker.hasFocus();
        }
        addContentWidget(widget) {
            const widgetData = {
                widget: widget,
                position: widget.getPosition()
            };
            if (this._contentWidgets.hasOwnProperty(widget.getId())) {
                console.warn('Overwriting a content widget with the same id:' + widget.getId());
            }
            this._contentWidgets[widget.getId()] = widgetData;
            if (this._modelData && this._modelData.hasRealView) {
                this._modelData.view.addContentWidget(widgetData);
            }
        }
        layoutContentWidget(widget) {
            const widgetId = widget.getId();
            if (this._contentWidgets.hasOwnProperty(widgetId)) {
                const widgetData = this._contentWidgets[widgetId];
                widgetData.position = widget.getPosition();
                if (this._modelData && this._modelData.hasRealView) {
                    this._modelData.view.layoutContentWidget(widgetData);
                }
            }
        }
        removeContentWidget(widget) {
            const widgetId = widget.getId();
            if (this._contentWidgets.hasOwnProperty(widgetId)) {
                const widgetData = this._contentWidgets[widgetId];
                delete this._contentWidgets[widgetId];
                if (this._modelData && this._modelData.hasRealView) {
                    this._modelData.view.removeContentWidget(widgetData);
                }
            }
        }
        addOverlayWidget(widget) {
            const widgetData = {
                widget: widget,
                position: widget.getPosition()
            };
            if (this._overlayWidgets.hasOwnProperty(widget.getId())) {
                console.warn('Overwriting an overlay widget with the same id.');
            }
            this._overlayWidgets[widget.getId()] = widgetData;
            if (this._modelData && this._modelData.hasRealView) {
                this._modelData.view.addOverlayWidget(widgetData);
            }
        }
        layoutOverlayWidget(widget) {
            const widgetId = widget.getId();
            if (this._overlayWidgets.hasOwnProperty(widgetId)) {
                const widgetData = this._overlayWidgets[widgetId];
                widgetData.position = widget.getPosition();
                if (this._modelData && this._modelData.hasRealView) {
                    this._modelData.view.layoutOverlayWidget(widgetData);
                }
            }
        }
        removeOverlayWidget(widget) {
            const widgetId = widget.getId();
            if (this._overlayWidgets.hasOwnProperty(widgetId)) {
                const widgetData = this._overlayWidgets[widgetId];
                delete this._overlayWidgets[widgetId];
                if (this._modelData && this._modelData.hasRealView) {
                    this._modelData.view.removeOverlayWidget(widgetData);
                }
            }
        }
        addGlyphMarginWidget(widget) {
            const widgetData = {
                widget: widget,
                position: widget.getPosition()
            };
            if (this._glyphMarginWidgets.hasOwnProperty(widget.getId())) {
                console.warn('Overwriting a glyph margin widget with the same id.');
            }
            this._glyphMarginWidgets[widget.getId()] = widgetData;
            if (this._modelData && this._modelData.hasRealView) {
                this._modelData.view.addGlyphMarginWidget(widgetData);
            }
        }
        layoutGlyphMarginWidget(widget) {
            const widgetId = widget.getId();
            if (this._glyphMarginWidgets.hasOwnProperty(widgetId)) {
                const widgetData = this._glyphMarginWidgets[widgetId];
                widgetData.position = widget.getPosition();
                if (this._modelData && this._modelData.hasRealView) {
                    this._modelData.view.layoutGlyphMarginWidget(widgetData);
                }
            }
        }
        removeGlyphMarginWidget(widget) {
            const widgetId = widget.getId();
            if (this._glyphMarginWidgets.hasOwnProperty(widgetId)) {
                const widgetData = this._glyphMarginWidgets[widgetId];
                delete this._glyphMarginWidgets[widgetId];
                if (this._modelData && this._modelData.hasRealView) {
                    this._modelData.view.removeGlyphMarginWidget(widgetData);
                }
            }
        }
        changeViewZones(callback) {
            if (!this._modelData || !this._modelData.hasRealView) {
                return;
            }
            this._modelData.view.change(callback);
        }
        getTargetAtClientPoint(clientX, clientY) {
            if (!this._modelData || !this._modelData.hasRealView) {
                return null;
            }
            return this._modelData.view.getTargetAtClientPoint(clientX, clientY);
        }
        getScrolledVisiblePosition(rawPosition) {
            if (!this._modelData || !this._modelData.hasRealView) {
                return null;
            }
            const position = this._modelData.model.validatePosition(rawPosition);
            const options = this._configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            const top = CodeEditorWidget_1._getVerticalOffsetForPosition(this._modelData, position.lineNumber, position.column) - this.getScrollTop();
            const left = this._modelData.view.getOffsetForColumn(position.lineNumber, position.column) + layoutInfo.glyphMarginWidth + layoutInfo.lineNumbersWidth + layoutInfo.decorationsWidth - this.getScrollLeft();
            return {
                top: top,
                left: left,
                height: options.get(67 /* EditorOption.lineHeight */)
            };
        }
        getOffsetForColumn(lineNumber, column) {
            if (!this._modelData || !this._modelData.hasRealView) {
                return -1;
            }
            return this._modelData.view.getOffsetForColumn(lineNumber, column);
        }
        render(forceRedraw = false) {
            if (!this._modelData || !this._modelData.hasRealView) {
                return;
            }
            this._modelData.view.render(true, forceRedraw);
        }
        setAriaOptions(options) {
            if (!this._modelData || !this._modelData.hasRealView) {
                return;
            }
            this._modelData.view.setAriaOptions(options);
        }
        applyFontInfo(target) {
            (0, domFontInfo_1.applyFontInfo)(target, this._configuration.options.get(50 /* EditorOption.fontInfo */));
        }
        setBanner(domNode, domNodeHeight) {
            if (this._bannerDomNode && this._domElement.contains(this._bannerDomNode)) {
                this._domElement.removeChild(this._bannerDomNode);
            }
            this._bannerDomNode = domNode;
            this._configuration.setReservedHeight(domNode ? domNodeHeight : 0);
            if (this._bannerDomNode) {
                this._domElement.prepend(this._bannerDomNode);
            }
        }
        _attachModel(model) {
            if (!model) {
                this._modelData = null;
                return;
            }
            const listenersToRemove = [];
            this._domElement.setAttribute('data-mode-id', model.getLanguageId());
            this._configuration.setIsDominatedByLongLines(model.isDominatedByLongLines());
            this._configuration.setModelLineCount(model.getLineCount());
            const attachedView = model.onBeforeAttached();
            const viewModel = new viewModelImpl_1.ViewModel(this._id, this._configuration, model, domLineBreaksComputer_1.DOMLineBreaksComputerFactory.create(dom.getWindow(this._domElement)), monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory.create(this._configuration.options), (callback) => dom.scheduleAtNextAnimationFrame(dom.getWindow(this._domElement), callback), this.languageConfigurationService, this._themeService, attachedView);
            // Someone might destroy the model from under the editor, so prevent any exceptions by setting a null model
            listenersToRemove.push(model.onWillDispose(() => this.setModel(null)));
            listenersToRemove.push(viewModel.onEvent((e) => {
                switch (e.kind) {
                    case 0 /* OutgoingViewModelEventKind.ContentSizeChanged */:
                        this._onDidContentSizeChange.fire(e);
                        break;
                    case 1 /* OutgoingViewModelEventKind.FocusChanged */:
                        this._editorTextFocus.setValue(e.hasFocus);
                        break;
                    case 2 /* OutgoingViewModelEventKind.ScrollChanged */:
                        this._onDidScrollChange.fire(e);
                        break;
                    case 3 /* OutgoingViewModelEventKind.ViewZonesChanged */:
                        this._onDidChangeViewZones.fire();
                        break;
                    case 4 /* OutgoingViewModelEventKind.HiddenAreasChanged */:
                        this._onDidChangeHiddenAreas.fire();
                        break;
                    case 5 /* OutgoingViewModelEventKind.ReadOnlyEditAttempt */:
                        this._onDidAttemptReadOnlyEdit.fire();
                        break;
                    case 6 /* OutgoingViewModelEventKind.CursorStateChanged */: {
                        if (e.reachedMaxCursorCount) {
                            const multiCursorLimit = this.getOption(80 /* EditorOption.multiCursorLimit */);
                            const message = nls.localize('cursors.maximum', "The number of cursors has been limited to {0}. Consider using [find and replace](https://code.visualstudio.com/docs/editor/codebasics#_find-and-replace) for larger changes or increase the editor multi cursor limit setting.", multiCursorLimit);
                            this._notificationService.prompt(notification_1.Severity.Warning, message, [
                                {
                                    label: 'Find and Replace',
                                    run: () => {
                                        this._commandService.executeCommand('editor.action.startFindReplaceAction');
                                    }
                                },
                                {
                                    label: nls.localize('goToSetting', 'Increase Multi Cursor Limit'),
                                    run: () => {
                                        this._commandService.executeCommand('workbench.action.openSettings2', {
                                            query: 'editor.multiCursorLimit'
                                        });
                                    }
                                }
                            ]);
                        }
                        const positions = [];
                        for (let i = 0, len = e.selections.length; i < len; i++) {
                            positions[i] = e.selections[i].getPosition();
                        }
                        const e1 = {
                            position: positions[0],
                            secondaryPositions: positions.slice(1),
                            reason: e.reason,
                            source: e.source
                        };
                        this._onDidChangeCursorPosition.fire(e1);
                        const e2 = {
                            selection: e.selections[0],
                            secondarySelections: e.selections.slice(1),
                            modelVersionId: e.modelVersionId,
                            oldSelections: e.oldSelections,
                            oldModelVersionId: e.oldModelVersionId,
                            source: e.source,
                            reason: e.reason
                        };
                        this._onDidChangeCursorSelection.fire(e2);
                        break;
                    }
                    case 7 /* OutgoingViewModelEventKind.ModelDecorationsChanged */:
                        this._onDidChangeModelDecorations.fire(e.event);
                        break;
                    case 8 /* OutgoingViewModelEventKind.ModelLanguageChanged */:
                        this._domElement.setAttribute('data-mode-id', model.getLanguageId());
                        this._onDidChangeModelLanguage.fire(e.event);
                        break;
                    case 9 /* OutgoingViewModelEventKind.ModelLanguageConfigurationChanged */:
                        this._onDidChangeModelLanguageConfiguration.fire(e.event);
                        break;
                    case 10 /* OutgoingViewModelEventKind.ModelContentChanged */:
                        this._onDidChangeModelContent.fire(e.event);
                        break;
                    case 11 /* OutgoingViewModelEventKind.ModelOptionsChanged */:
                        this._onDidChangeModelOptions.fire(e.event);
                        break;
                    case 12 /* OutgoingViewModelEventKind.ModelTokensChanged */:
                        this._onDidChangeModelTokens.fire(e.event);
                        break;
                }
            }));
            const [view, hasRealView] = this._createView(viewModel);
            if (hasRealView) {
                this._domElement.appendChild(view.domNode.domNode);
                let keys = Object.keys(this._contentWidgets);
                for (let i = 0, len = keys.length; i < len; i++) {
                    const widgetId = keys[i];
                    view.addContentWidget(this._contentWidgets[widgetId]);
                }
                keys = Object.keys(this._overlayWidgets);
                for (let i = 0, len = keys.length; i < len; i++) {
                    const widgetId = keys[i];
                    view.addOverlayWidget(this._overlayWidgets[widgetId]);
                }
                keys = Object.keys(this._glyphMarginWidgets);
                for (let i = 0, len = keys.length; i < len; i++) {
                    const widgetId = keys[i];
                    view.addGlyphMarginWidget(this._glyphMarginWidgets[widgetId]);
                }
                view.render(false, true);
                view.domNode.domNode.setAttribute('data-uri', model.uri.toString());
            }
            this._modelData = new ModelData(model, viewModel, view, hasRealView, listenersToRemove, attachedView);
        }
        _createView(viewModel) {
            let commandDelegate;
            if (this.isSimpleWidget) {
                commandDelegate = {
                    paste: (text, pasteOnNewLine, multicursorText, mode) => {
                        this._paste('keyboard', text, pasteOnNewLine, multicursorText, mode);
                    },
                    type: (text) => {
                        this._type('keyboard', text);
                    },
                    compositionType: (text, replacePrevCharCnt, replaceNextCharCnt, positionDelta) => {
                        this._compositionType('keyboard', text, replacePrevCharCnt, replaceNextCharCnt, positionDelta);
                    },
                    startComposition: () => {
                        this._startComposition();
                    },
                    endComposition: () => {
                        this._endComposition('keyboard');
                    },
                    cut: () => {
                        this._cut('keyboard');
                    }
                };
            }
            else {
                commandDelegate = {
                    paste: (text, pasteOnNewLine, multicursorText, mode) => {
                        const payload = { text, pasteOnNewLine, multicursorText, mode };
                        this._commandService.executeCommand("paste" /* editorCommon.Handler.Paste */, payload);
                    },
                    type: (text) => {
                        const payload = { text };
                        this._commandService.executeCommand("type" /* editorCommon.Handler.Type */, payload);
                    },
                    compositionType: (text, replacePrevCharCnt, replaceNextCharCnt, positionDelta) => {
                        // Try if possible to go through the existing `replacePreviousChar` command
                        if (replaceNextCharCnt || positionDelta) {
                            // must be handled through the new command
                            const payload = { text, replacePrevCharCnt, replaceNextCharCnt, positionDelta };
                            this._commandService.executeCommand("compositionType" /* editorCommon.Handler.CompositionType */, payload);
                        }
                        else {
                            const payload = { text, replaceCharCnt: replacePrevCharCnt };
                            this._commandService.executeCommand("replacePreviousChar" /* editorCommon.Handler.ReplacePreviousChar */, payload);
                        }
                    },
                    startComposition: () => {
                        this._commandService.executeCommand("compositionStart" /* editorCommon.Handler.CompositionStart */, {});
                    },
                    endComposition: () => {
                        this._commandService.executeCommand("compositionEnd" /* editorCommon.Handler.CompositionEnd */, {});
                    },
                    cut: () => {
                        this._commandService.executeCommand("cut" /* editorCommon.Handler.Cut */, {});
                    }
                };
            }
            const viewUserInputEvents = new viewUserInputEvents_1.ViewUserInputEvents(viewModel.coordinatesConverter);
            viewUserInputEvents.onKeyDown = (e) => this._onKeyDown.fire(e);
            viewUserInputEvents.onKeyUp = (e) => this._onKeyUp.fire(e);
            viewUserInputEvents.onContextMenu = (e) => this._onContextMenu.fire(e);
            viewUserInputEvents.onMouseMove = (e) => this._onMouseMove.fire(e);
            viewUserInputEvents.onMouseLeave = (e) => this._onMouseLeave.fire(e);
            viewUserInputEvents.onMouseDown = (e) => this._onMouseDown.fire(e);
            viewUserInputEvents.onMouseUp = (e) => this._onMouseUp.fire(e);
            viewUserInputEvents.onMouseDrag = (e) => this._onMouseDrag.fire(e);
            viewUserInputEvents.onMouseDrop = (e) => this._onMouseDrop.fire(e);
            viewUserInputEvents.onMouseDropCanceled = (e) => this._onMouseDropCanceled.fire(e);
            viewUserInputEvents.onMouseWheel = (e) => this._onMouseWheel.fire(e);
            const view = new view_1.View(commandDelegate, this._configuration, this._themeService.getColorTheme(), viewModel, viewUserInputEvents, this._overflowWidgetsDomNode, this._instantiationService);
            return [view, true];
        }
        _postDetachModelCleanup(detachedModel) {
            detachedModel?.removeAllDecorationsWithOwnerId(this._id);
        }
        _detachModel() {
            this._contributionsDisposable?.dispose();
            this._contributionsDisposable = undefined;
            if (!this._modelData) {
                return null;
            }
            const model = this._modelData.model;
            const removeDomNode = this._modelData.hasRealView ? this._modelData.view.domNode.domNode : null;
            this._modelData.dispose();
            this._modelData = null;
            this._domElement.removeAttribute('data-mode-id');
            if (removeDomNode && this._domElement.contains(removeDomNode)) {
                this._domElement.removeChild(removeDomNode);
            }
            if (this._bannerDomNode && this._domElement.contains(this._bannerDomNode)) {
                this._domElement.removeChild(this._bannerDomNode);
            }
            return model;
        }
        _registerDecorationType(description, key, options, parentTypeKey) {
            this._codeEditorService.registerDecorationType(description, key, options, parentTypeKey, this);
        }
        _removeDecorationType(key) {
            this._codeEditorService.removeDecorationType(key);
        }
        _resolveDecorationOptions(typeKey, writable) {
            return this._codeEditorService.resolveDecorationOptions(typeKey, writable);
        }
        getTelemetryData() {
            return this._telemetryData;
        }
        hasModel() {
            return (this._modelData !== null);
        }
        showDropIndicatorAt(position) {
            const newDecorations = [{
                    range: new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                    options: CodeEditorWidget_1.dropIntoEditorDecorationOptions
                }];
            this._dropIntoEditorDecorations.set(newDecorations);
            this.revealPosition(position, 1 /* editorCommon.ScrollType.Immediate */);
        }
        removeDropIndicator() {
            this._dropIntoEditorDecorations.clear();
        }
        setContextValue(key, value) {
            this._contextKeyService.createKey(key, value);
        }
    };
    exports.CodeEditorWidget = CodeEditorWidget;
    exports.CodeEditorWidget = CodeEditorWidget = CodeEditorWidget_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, commands_1.ICommandService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, themeService_1.IThemeService),
        __param(8, notification_1.INotificationService),
        __param(9, accessibility_1.IAccessibilityService),
        __param(10, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(11, languageFeatures_1.ILanguageFeaturesService)
    ], CodeEditorWidget);
    let EDITOR_ID = 0;
    class ModelData {
        constructor(model, viewModel, view, hasRealView, listenersToRemove, attachedView) {
            this.model = model;
            this.viewModel = viewModel;
            this.view = view;
            this.hasRealView = hasRealView;
            this.listenersToRemove = listenersToRemove;
            this.attachedView = attachedView;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.listenersToRemove);
            this.model.onBeforeDetached(this.attachedView);
            if (this.hasRealView) {
                this.view.dispose();
            }
            this.viewModel.dispose();
        }
    }
    var BooleanEventValue;
    (function (BooleanEventValue) {
        BooleanEventValue[BooleanEventValue["NotSet"] = 0] = "NotSet";
        BooleanEventValue[BooleanEventValue["False"] = 1] = "False";
        BooleanEventValue[BooleanEventValue["True"] = 2] = "True";
    })(BooleanEventValue || (BooleanEventValue = {}));
    class BooleanEventEmitter extends lifecycle_1.Disposable {
        constructor(_emitterOptions) {
            super();
            this._emitterOptions = _emitterOptions;
            this._onDidChangeToTrue = this._register(new event_1.Emitter(this._emitterOptions));
            this.onDidChangeToTrue = this._onDidChangeToTrue.event;
            this._onDidChangeToFalse = this._register(new event_1.Emitter(this._emitterOptions));
            this.onDidChangeToFalse = this._onDidChangeToFalse.event;
            this._value = 0 /* BooleanEventValue.NotSet */;
        }
        setValue(_value) {
            const value = (_value ? 2 /* BooleanEventValue.True */ : 1 /* BooleanEventValue.False */);
            if (this._value === value) {
                return;
            }
            this._value = value;
            if (this._value === 2 /* BooleanEventValue.True */) {
                this._onDidChangeToTrue.fire();
            }
            else if (this._value === 1 /* BooleanEventValue.False */) {
                this._onDidChangeToFalse.fire();
            }
        }
    }
    exports.BooleanEventEmitter = BooleanEventEmitter;
    /**
     * A regular event emitter that also makes sure contributions are instantiated if necessary
     */
    class InteractionEmitter extends event_1.Emitter {
        constructor(_contributions, deliveryQueue) {
            super({ deliveryQueue });
            this._contributions = _contributions;
        }
        fire(event) {
            this._contributions.onBeforeInteractionEvent();
            super.fire(event);
        }
    }
    class EditorContextKeysManager extends lifecycle_1.Disposable {
        constructor(editor, contextKeyService) {
            super();
            this._editor = editor;
            contextKeyService.createKey('editorId', editor.getId());
            this._editorSimpleInput = editorContextKeys_1.EditorContextKeys.editorSimpleInput.bindTo(contextKeyService);
            this._editorFocus = editorContextKeys_1.EditorContextKeys.focus.bindTo(contextKeyService);
            this._textInputFocus = editorContextKeys_1.EditorContextKeys.textInputFocus.bindTo(contextKeyService);
            this._editorTextFocus = editorContextKeys_1.EditorContextKeys.editorTextFocus.bindTo(contextKeyService);
            this._tabMovesFocus = editorContextKeys_1.EditorContextKeys.tabMovesFocus.bindTo(contextKeyService);
            this._editorReadonly = editorContextKeys_1.EditorContextKeys.readOnly.bindTo(contextKeyService);
            this._inDiffEditor = editorContextKeys_1.EditorContextKeys.inDiffEditor.bindTo(contextKeyService);
            this._editorColumnSelection = editorContextKeys_1.EditorContextKeys.columnSelection.bindTo(contextKeyService);
            this._hasMultipleSelections = editorContextKeys_1.EditorContextKeys.hasMultipleSelections.bindTo(contextKeyService);
            this._hasNonEmptySelection = editorContextKeys_1.EditorContextKeys.hasNonEmptySelection.bindTo(contextKeyService);
            this._canUndo = editorContextKeys_1.EditorContextKeys.canUndo.bindTo(contextKeyService);
            this._canRedo = editorContextKeys_1.EditorContextKeys.canRedo.bindTo(contextKeyService);
            this._register(this._editor.onDidChangeConfiguration(() => this._updateFromConfig()));
            this._register(this._editor.onDidChangeCursorSelection(() => this._updateFromSelection()));
            this._register(this._editor.onDidFocusEditorWidget(() => this._updateFromFocus()));
            this._register(this._editor.onDidBlurEditorWidget(() => this._updateFromFocus()));
            this._register(this._editor.onDidFocusEditorText(() => this._updateFromFocus()));
            this._register(this._editor.onDidBlurEditorText(() => this._updateFromFocus()));
            this._register(this._editor.onDidChangeModel(() => this._updateFromModel()));
            this._register(this._editor.onDidChangeConfiguration(() => this._updateFromModel()));
            this._register(tabFocus_1.TabFocus.onDidChangeTabFocus((tabFocusMode) => this._tabMovesFocus.set(tabFocusMode)));
            this._updateFromConfig();
            this._updateFromSelection();
            this._updateFromFocus();
            this._updateFromModel();
            this._editorSimpleInput.set(this._editor.isSimpleWidget);
        }
        _updateFromConfig() {
            const options = this._editor.getOptions();
            this._tabMovesFocus.set(tabFocus_1.TabFocus.getTabFocusMode());
            this._editorReadonly.set(options.get(91 /* EditorOption.readOnly */));
            this._inDiffEditor.set(options.get(61 /* EditorOption.inDiffEditor */));
            this._editorColumnSelection.set(options.get(22 /* EditorOption.columnSelection */));
        }
        _updateFromSelection() {
            const selections = this._editor.getSelections();
            if (!selections) {
                this._hasMultipleSelections.reset();
                this._hasNonEmptySelection.reset();
            }
            else {
                this._hasMultipleSelections.set(selections.length > 1);
                this._hasNonEmptySelection.set(selections.some(s => !s.isEmpty()));
            }
        }
        _updateFromFocus() {
            this._editorFocus.set(this._editor.hasWidgetFocus() && !this._editor.isSimpleWidget);
            this._editorTextFocus.set(this._editor.hasTextFocus() && !this._editor.isSimpleWidget);
            this._textInputFocus.set(this._editor.hasTextFocus());
        }
        _updateFromModel() {
            const model = this._editor.getModel();
            this._canUndo.set(Boolean(model && model.canUndo()));
            this._canRedo.set(Boolean(model && model.canRedo()));
        }
    }
    class EditorModeContext extends lifecycle_1.Disposable {
        constructor(_editor, _contextKeyService, _languageFeaturesService) {
            super();
            this._editor = _editor;
            this._contextKeyService = _contextKeyService;
            this._languageFeaturesService = _languageFeaturesService;
            this._langId = editorContextKeys_1.EditorContextKeys.languageId.bindTo(_contextKeyService);
            this._hasCompletionItemProvider = editorContextKeys_1.EditorContextKeys.hasCompletionItemProvider.bindTo(_contextKeyService);
            this._hasCodeActionsProvider = editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider.bindTo(_contextKeyService);
            this._hasCodeLensProvider = editorContextKeys_1.EditorContextKeys.hasCodeLensProvider.bindTo(_contextKeyService);
            this._hasDefinitionProvider = editorContextKeys_1.EditorContextKeys.hasDefinitionProvider.bindTo(_contextKeyService);
            this._hasDeclarationProvider = editorContextKeys_1.EditorContextKeys.hasDeclarationProvider.bindTo(_contextKeyService);
            this._hasImplementationProvider = editorContextKeys_1.EditorContextKeys.hasImplementationProvider.bindTo(_contextKeyService);
            this._hasTypeDefinitionProvider = editorContextKeys_1.EditorContextKeys.hasTypeDefinitionProvider.bindTo(_contextKeyService);
            this._hasHoverProvider = editorContextKeys_1.EditorContextKeys.hasHoverProvider.bindTo(_contextKeyService);
            this._hasDocumentHighlightProvider = editorContextKeys_1.EditorContextKeys.hasDocumentHighlightProvider.bindTo(_contextKeyService);
            this._hasDocumentSymbolProvider = editorContextKeys_1.EditorContextKeys.hasDocumentSymbolProvider.bindTo(_contextKeyService);
            this._hasReferenceProvider = editorContextKeys_1.EditorContextKeys.hasReferenceProvider.bindTo(_contextKeyService);
            this._hasRenameProvider = editorContextKeys_1.EditorContextKeys.hasRenameProvider.bindTo(_contextKeyService);
            this._hasSignatureHelpProvider = editorContextKeys_1.EditorContextKeys.hasSignatureHelpProvider.bindTo(_contextKeyService);
            this._hasInlayHintsProvider = editorContextKeys_1.EditorContextKeys.hasInlayHintsProvider.bindTo(_contextKeyService);
            this._hasDocumentFormattingProvider = editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider.bindTo(_contextKeyService);
            this._hasDocumentSelectionFormattingProvider = editorContextKeys_1.EditorContextKeys.hasDocumentSelectionFormattingProvider.bindTo(_contextKeyService);
            this._hasMultipleDocumentFormattingProvider = editorContextKeys_1.EditorContextKeys.hasMultipleDocumentFormattingProvider.bindTo(_contextKeyService);
            this._hasMultipleDocumentSelectionFormattingProvider = editorContextKeys_1.EditorContextKeys.hasMultipleDocumentSelectionFormattingProvider.bindTo(_contextKeyService);
            this._isInEmbeddedEditor = editorContextKeys_1.EditorContextKeys.isInEmbeddedEditor.bindTo(_contextKeyService);
            const update = () => this._update();
            // update when model/mode changes
            this._register(_editor.onDidChangeModel(update));
            this._register(_editor.onDidChangeModelLanguage(update));
            // update when registries change
            this._register(_languageFeaturesService.completionProvider.onDidChange(update));
            this._register(_languageFeaturesService.codeActionProvider.onDidChange(update));
            this._register(_languageFeaturesService.codeLensProvider.onDidChange(update));
            this._register(_languageFeaturesService.definitionProvider.onDidChange(update));
            this._register(_languageFeaturesService.declarationProvider.onDidChange(update));
            this._register(_languageFeaturesService.implementationProvider.onDidChange(update));
            this._register(_languageFeaturesService.typeDefinitionProvider.onDidChange(update));
            this._register(_languageFeaturesService.hoverProvider.onDidChange(update));
            this._register(_languageFeaturesService.documentHighlightProvider.onDidChange(update));
            this._register(_languageFeaturesService.documentSymbolProvider.onDidChange(update));
            this._register(_languageFeaturesService.referenceProvider.onDidChange(update));
            this._register(_languageFeaturesService.renameProvider.onDidChange(update));
            this._register(_languageFeaturesService.documentFormattingEditProvider.onDidChange(update));
            this._register(_languageFeaturesService.documentRangeFormattingEditProvider.onDidChange(update));
            this._register(_languageFeaturesService.signatureHelpProvider.onDidChange(update));
            this._register(_languageFeaturesService.inlayHintsProvider.onDidChange(update));
            update();
        }
        dispose() {
            super.dispose();
        }
        reset() {
            this._contextKeyService.bufferChangeEvents(() => {
                this._langId.reset();
                this._hasCompletionItemProvider.reset();
                this._hasCodeActionsProvider.reset();
                this._hasCodeLensProvider.reset();
                this._hasDefinitionProvider.reset();
                this._hasDeclarationProvider.reset();
                this._hasImplementationProvider.reset();
                this._hasTypeDefinitionProvider.reset();
                this._hasHoverProvider.reset();
                this._hasDocumentHighlightProvider.reset();
                this._hasDocumentSymbolProvider.reset();
                this._hasReferenceProvider.reset();
                this._hasRenameProvider.reset();
                this._hasDocumentFormattingProvider.reset();
                this._hasDocumentSelectionFormattingProvider.reset();
                this._hasSignatureHelpProvider.reset();
                this._isInEmbeddedEditor.reset();
            });
        }
        _update() {
            const model = this._editor.getModel();
            if (!model) {
                this.reset();
                return;
            }
            this._contextKeyService.bufferChangeEvents(() => {
                this._langId.set(model.getLanguageId());
                this._hasCompletionItemProvider.set(this._languageFeaturesService.completionProvider.has(model));
                this._hasCodeActionsProvider.set(this._languageFeaturesService.codeActionProvider.has(model));
                this._hasCodeLensProvider.set(this._languageFeaturesService.codeLensProvider.has(model));
                this._hasDefinitionProvider.set(this._languageFeaturesService.definitionProvider.has(model));
                this._hasDeclarationProvider.set(this._languageFeaturesService.declarationProvider.has(model));
                this._hasImplementationProvider.set(this._languageFeaturesService.implementationProvider.has(model));
                this._hasTypeDefinitionProvider.set(this._languageFeaturesService.typeDefinitionProvider.has(model));
                this._hasHoverProvider.set(this._languageFeaturesService.hoverProvider.has(model));
                this._hasDocumentHighlightProvider.set(this._languageFeaturesService.documentHighlightProvider.has(model));
                this._hasDocumentSymbolProvider.set(this._languageFeaturesService.documentSymbolProvider.has(model));
                this._hasReferenceProvider.set(this._languageFeaturesService.referenceProvider.has(model));
                this._hasRenameProvider.set(this._languageFeaturesService.renameProvider.has(model));
                this._hasSignatureHelpProvider.set(this._languageFeaturesService.signatureHelpProvider.has(model));
                this._hasInlayHintsProvider.set(this._languageFeaturesService.inlayHintsProvider.has(model));
                this._hasDocumentFormattingProvider.set(this._languageFeaturesService.documentFormattingEditProvider.has(model) || this._languageFeaturesService.documentRangeFormattingEditProvider.has(model));
                this._hasDocumentSelectionFormattingProvider.set(this._languageFeaturesService.documentRangeFormattingEditProvider.has(model));
                this._hasMultipleDocumentFormattingProvider.set(this._languageFeaturesService.documentFormattingEditProvider.all(model).length + this._languageFeaturesService.documentRangeFormattingEditProvider.all(model).length > 1);
                this._hasMultipleDocumentSelectionFormattingProvider.set(this._languageFeaturesService.documentRangeFormattingEditProvider.all(model).length > 1);
                this._isInEmbeddedEditor.set(model.uri.scheme === network_1.Schemas.walkThroughSnippet || model.uri.scheme === network_1.Schemas.vscodeChatCodeBlock);
            });
        }
    }
    exports.EditorModeContext = EditorModeContext;
    class CodeEditorWidgetFocusTracker extends lifecycle_1.Disposable {
        constructor(domElement, overflowWidgetsDomNode) {
            super();
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            this._hadFocus = undefined;
            this._hasDomElementFocus = false;
            this._domFocusTracker = this._register(dom.trackFocus(domElement));
            this._overflowWidgetsDomNodeHasFocus = false;
            this._register(this._domFocusTracker.onDidFocus(() => {
                this._hasDomElementFocus = true;
                this._update();
            }));
            this._register(this._domFocusTracker.onDidBlur(() => {
                this._hasDomElementFocus = false;
                this._update();
            }));
            if (overflowWidgetsDomNode) {
                this._overflowWidgetsDomNode = this._register(dom.trackFocus(overflowWidgetsDomNode));
                this._register(this._overflowWidgetsDomNode.onDidFocus(() => {
                    this._overflowWidgetsDomNodeHasFocus = true;
                    this._update();
                }));
                this._register(this._overflowWidgetsDomNode.onDidBlur(() => {
                    this._overflowWidgetsDomNodeHasFocus = false;
                    this._update();
                }));
            }
        }
        _update() {
            const focused = this._hasDomElementFocus || this._overflowWidgetsDomNodeHasFocus;
            if (this._hadFocus !== focused) {
                this._hadFocus = focused;
                this._onChange.fire(undefined);
            }
        }
        hasFocus() {
            return this._hadFocus ?? false;
        }
        refreshState() {
            this._domFocusTracker.refreshState();
            this._overflowWidgetsDomNode?.refreshState?.();
        }
    }
    class EditorDecorationsCollection {
        get length() {
            return this._decorationIds.length;
        }
        constructor(_editor, decorations) {
            this._editor = _editor;
            this._decorationIds = [];
            this._isChangingDecorations = false;
            if (Array.isArray(decorations) && decorations.length > 0) {
                this.set(decorations);
            }
        }
        onDidChange(listener, thisArgs, disposables) {
            return this._editor.onDidChangeModelDecorations((e) => {
                if (this._isChangingDecorations) {
                    return;
                }
                listener.call(thisArgs, e);
            }, disposables);
        }
        getRange(index) {
            if (!this._editor.hasModel()) {
                return null;
            }
            if (index >= this._decorationIds.length) {
                return null;
            }
            return this._editor.getModel().getDecorationRange(this._decorationIds[index]);
        }
        getRanges() {
            if (!this._editor.hasModel()) {
                return [];
            }
            const model = this._editor.getModel();
            const result = [];
            for (const decorationId of this._decorationIds) {
                const range = model.getDecorationRange(decorationId);
                if (range) {
                    result.push(range);
                }
            }
            return result;
        }
        has(decoration) {
            return this._decorationIds.includes(decoration.id);
        }
        clear() {
            if (this._decorationIds.length === 0) {
                // nothing to do
                return;
            }
            this.set([]);
        }
        set(newDecorations) {
            try {
                this._isChangingDecorations = true;
                this._editor.changeDecorations((accessor) => {
                    this._decorationIds = accessor.deltaDecorations(this._decorationIds, newDecorations);
                });
            }
            finally {
                this._isChangingDecorations = false;
            }
            return this._decorationIds;
        }
        append(newDecorations) {
            let newDecorationIds = [];
            try {
                this._isChangingDecorations = true;
                this._editor.changeDecorations((accessor) => {
                    newDecorationIds = accessor.deltaDecorations([], newDecorations);
                    this._decorationIds = this._decorationIds.concat(newDecorationIds);
                });
            }
            finally {
                this._isChangingDecorations = false;
            }
            return newDecorationIds;
        }
    }
    const squigglyStart = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 3' enable-background='new 0 0 6 3' height='3' width='6'><g fill='`);
    const squigglyEnd = encodeURIComponent(`'><polygon points='5.5,0 2.5,3 1.1,3 4.1,0'/><polygon points='4,0 6,2 6,0.6 5.4,0'/><polygon points='0,2 1,3 2.4,3 0,0.6'/></g></svg>`);
    function getSquigglySVGData(color) {
        return squigglyStart + encodeURIComponent(color.toString()) + squigglyEnd;
    }
    const dotdotdotStart = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" height="3" width="12"><g fill="`);
    const dotdotdotEnd = encodeURIComponent(`"><circle cx="1" cy="1" r="1"/><circle cx="5" cy="1" r="1"/><circle cx="9" cy="1" r="1"/></g></svg>`);
    function getDotDotDotSVGData(color) {
        return dotdotdotStart + encodeURIComponent(color.toString()) + dotdotdotEnd;
    }
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const errorForeground = theme.getColor(colorRegistry_1.editorErrorForeground);
        if (errorForeground) {
            collector.addRule(`.monaco-editor .${"squiggly-error" /* ClassName.EditorErrorDecoration */} { background: url("data:image/svg+xml,${getSquigglySVGData(errorForeground)}") repeat-x bottom left; }`);
        }
        const warningForeground = theme.getColor(colorRegistry_1.editorWarningForeground);
        if (warningForeground) {
            collector.addRule(`.monaco-editor .${"squiggly-warning" /* ClassName.EditorWarningDecoration */} { background: url("data:image/svg+xml,${getSquigglySVGData(warningForeground)}") repeat-x bottom left; }`);
        }
        const infoForeground = theme.getColor(colorRegistry_1.editorInfoForeground);
        if (infoForeground) {
            collector.addRule(`.monaco-editor .${"squiggly-info" /* ClassName.EditorInfoDecoration */} { background: url("data:image/svg+xml,${getSquigglySVGData(infoForeground)}") repeat-x bottom left; }`);
        }
        const hintForeground = theme.getColor(colorRegistry_1.editorHintForeground);
        if (hintForeground) {
            collector.addRule(`.monaco-editor .${"squiggly-hint" /* ClassName.EditorHintDecoration */} { background: url("data:image/svg+xml,${getDotDotDotSVGData(hintForeground)}") no-repeat bottom left; }`);
        }
        const unnecessaryForeground = theme.getColor(editorColorRegistry_1.editorUnnecessaryCodeOpacity);
        if (unnecessaryForeground) {
            collector.addRule(`.monaco-editor.showUnused .${"squiggly-inline-unnecessary" /* ClassName.EditorUnnecessaryInlineDecoration */} { opacity: ${unnecessaryForeground.rgba.a}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUVkaXRvcldpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvd2lkZ2V0L2NvZGVFZGl0b3IvY29kZUVkaXRvcldpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBMkR6RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHNCQUFVOztpQkFFdkIsb0NBQStCLEdBQUcsa0NBQXNCLENBQUMsUUFBUSxDQUFDO1lBQ3pGLFdBQVcsRUFBRSxzQkFBc0I7WUFDbkMsU0FBUyxFQUFFLFlBQVk7U0FDdkIsQ0FBQyxBQUhxRCxDQUdwRDtRQXVISCxZQUFZO1FBRVosSUFBVyxjQUFjO1lBQ3hCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUM7UUFDM0MsQ0FBQztRQWlCRCxJQUFJLGlCQUFpQixLQUFLLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQXNCM0QsWUFDQyxVQUF1QixFQUN2QixRQUE4QyxFQUM5Qyx1QkFBaUQsRUFDMUIsb0JBQTJDLEVBQzlDLGlCQUFxQyxFQUN4QyxjQUErQixFQUM1QixpQkFBcUMsRUFDMUMsWUFBMkIsRUFDcEIsbUJBQXlDLEVBQ3hDLG9CQUEyQyxFQUNuQyw0QkFBNEUsRUFDakYsdUJBQWlEO1lBRTNFLEtBQUssRUFBRSxDQUFDO1lBSHdDLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBK0I7WUEzSzVHLGtCQUFrQjtZQUVELG1CQUFjLEdBQUcsSUFBQSxnQ0FBd0IsR0FBRSxDQUFDO1lBQzFDLG1CQUFjLEdBQTRCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxpREFBdUIsRUFBRSxDQUFDLENBQUM7WUFFMUYsa0JBQWEsR0FBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJ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