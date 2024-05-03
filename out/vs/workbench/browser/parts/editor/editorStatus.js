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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/strings", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/actions", "vs/base/common/platform", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/common/editor", "vs/base/common/lifecycle", "vs/editor/contrib/linesOperations/browser/linesOperations", "vs/editor/contrib/indentation/browser/indentation", "vs/workbench/browser/parts/editor/binaryEditor", "vs/workbench/browser/parts/editor/binaryDiffEditor", "vs/workbench/services/editor/common/editorService", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/editor/common/languages/language", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/platform/commands/common/commands", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/textfile/common/encoding", "vs/editor/common/services/textResourceConfiguration", "vs/platform/configuration/common/configuration", "vs/base/common/objects", "vs/editor/browser/editorBrowser", "vs/base/common/network", "vs/workbench/services/preferences/common/preferences", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/base/common/async", "vs/base/common/event", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/markers/common/markers", "vs/platform/telemetry/common/telemetry", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/base/common/keyCodes", "vs/editor/browser/config/tabFocus", "vs/base/browser/window", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/instantiation/common/serviceCollection", "vs/css!./media/editorstatus"], function (require, exports, nls_1, dom_1, strings_1, resources_1, types_1, uri_1, actions_1, platform_1, untitledTextEditorInput_1, editor_1, lifecycle_1, linesOperations_1, indentation_1, binaryEditor_1, binaryDiffEditor_1, editorService_1, files_1, instantiation_1, language_1, range_1, selection_1, commands_1, extensionManagement_1, textfiles_1, encoding_1, textResourceConfiguration_1, configuration_1, objects_1, editorBrowser_1, network_1, preferences_1, quickInput_1, getIconClasses_1, async_1, event_1, statusbar_1, markers_1, telemetry_1, sideBySideEditorInput_1, languageDetectionWorkerService_1, contextkey_1, actions_2, keyCodes_1, tabFocus_1, window_1, editorGroupsService_1, serviceCollection_1) {
    "use strict";
    var ShowLanguageExtensionsAction_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChangeEncodingAction = exports.ChangeEOLAction = exports.ChangeLanguageAction = exports.ShowLanguageExtensionsAction = exports.EditorStatusContribution = void 0;
    class SideBySideEditorEncodingSupport {
        constructor(primary, secondary) {
            this.primary = primary;
            this.secondary = secondary;
        }
        getEncoding() {
            return this.primary.getEncoding(); // always report from modified (right hand) side
        }
        async setEncoding(encoding, mode) {
            await async_1.Promises.settled([this.primary, this.secondary].map(editor => editor.setEncoding(encoding, mode)));
        }
    }
    class SideBySideEditorLanguageSupport {
        constructor(primary, secondary) {
            this.primary = primary;
            this.secondary = secondary;
        }
        setLanguageId(languageId, source) {
            [this.primary, this.secondary].forEach(editor => editor.setLanguageId(languageId, source));
        }
    }
    function toEditorWithEncodingSupport(input) {
        // Untitled Text Editor
        if (input instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
            return input;
        }
        // Side by Side (diff) Editor
        if (input instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
            const primaryEncodingSupport = toEditorWithEncodingSupport(input.primary);
            const secondaryEncodingSupport = toEditorWithEncodingSupport(input.secondary);
            if (primaryEncodingSupport && secondaryEncodingSupport) {
                return new SideBySideEditorEncodingSupport(primaryEncodingSupport, secondaryEncodingSupport);
            }
            return primaryEncodingSupport;
        }
        // File or Resource Editor
        const encodingSupport = input;
        if ((0, types_1.areFunctions)(encodingSupport.setEncoding, encodingSupport.getEncoding)) {
            return encodingSupport;
        }
        // Unsupported for any other editor
        return null;
    }
    function toEditorWithLanguageSupport(input) {
        // Untitled Text Editor
        if (input instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
            return input;
        }
        // Side by Side (diff) Editor
        if (input instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
            const primaryLanguageSupport = toEditorWithLanguageSupport(input.primary);
            const secondaryLanguageSupport = toEditorWithLanguageSupport(input.secondary);
            if (primaryLanguageSupport && secondaryLanguageSupport) {
                return new SideBySideEditorLanguageSupport(primaryLanguageSupport, secondaryLanguageSupport);
            }
            return primaryLanguageSupport;
        }
        // File or Resource Editor
        const languageSupport = input;
        if (typeof languageSupport.setLanguageId === 'function') {
            return languageSupport;
        }
        // Unsupported for any other editor
        return null;
    }
    class StateChange {
        constructor() {
            this.indentation = false;
            this.selectionStatus = false;
            this.languageId = false;
            this.languageStatus = false;
            this.encoding = false;
            this.EOL = false;
            this.tabFocusMode = false;
            this.columnSelectionMode = false;
            this.metadata = false;
        }
        combine(other) {
            this.indentation = this.indentation || other.indentation;
            this.selectionStatus = this.selectionStatus || other.selectionStatus;
            this.languageId = this.languageId || other.languageId;
            this.languageStatus = this.languageStatus || other.languageStatus;
            this.encoding = this.encoding || other.encoding;
            this.EOL = this.EOL || other.EOL;
            this.tabFocusMode = this.tabFocusMode || other.tabFocusMode;
            this.columnSelectionMode = this.columnSelectionMode || other.columnSelectionMode;
            this.metadata = this.metadata || other.metadata;
        }
        hasChanges() {
            return this.indentation
                || this.selectionStatus
                || this.languageId
                || this.languageStatus
                || this.encoding
                || this.EOL
                || this.tabFocusMode
                || this.columnSelectionMode
                || this.metadata;
        }
    }
    class State {
        get selectionStatus() { return this._selectionStatus; }
        get languageId() { return this._languageId; }
        get encoding() { return this._encoding; }
        get EOL() { return this._EOL; }
        get indentation() { return this._indentation; }
        get tabFocusMode() { return this._tabFocusMode; }
        get columnSelectionMode() { return this._columnSelectionMode; }
        get metadata() { return this._metadata; }
        update(update) {
            const change = new StateChange();
            switch (update.type) {
                case 'selectionStatus':
                    if (this._selectionStatus !== update.selectionStatus) {
                        this._selectionStatus = update.selectionStatus;
                        change.selectionStatus = true;
                    }
                    break;
                case 'indentation':
                    if (this._indentation !== update.indentation) {
                        this._indentation = update.indentation;
                        change.indentation = true;
                    }
                    break;
                case 'languageId':
                    if (this._languageId !== update.languageId) {
                        this._languageId = update.languageId;
                        change.languageId = true;
                    }
                    break;
                case 'encoding':
                    if (this._encoding !== update.encoding) {
                        this._encoding = update.encoding;
                        change.encoding = true;
                    }
                    break;
                case 'EOL':
                    if (this._EOL !== update.EOL) {
                        this._EOL = update.EOL;
                        change.EOL = true;
                    }
                    break;
                case 'tabFocusMode':
                    if (this._tabFocusMode !== update.tabFocusMode) {
                        this._tabFocusMode = update.tabFocusMode;
                        change.tabFocusMode = true;
                    }
                    break;
                case 'columnSelectionMode':
                    if (this._columnSelectionMode !== update.columnSelectionMode) {
                        this._columnSelectionMode = update.columnSelectionMode;
                        change.columnSelectionMode = true;
                    }
                    break;
                case 'metadata':
                    if (this._metadata !== update.metadata) {
                        this._metadata = update.metadata;
                        change.metadata = true;
                    }
                    break;
            }
            return change;
        }
    }
    let TabFocusMode = class TabFocusMode extends lifecycle_1.Disposable {
        constructor(configurationService) {
            super();
            this.configurationService = configurationService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.registerListeners();
            const tabFocusModeConfig = configurationService.getValue('editor.tabFocusMode') === true ? true : false;
            tabFocus_1.TabFocus.setTabFocusMode(tabFocusModeConfig);
        }
        registerListeners() {
            this._register(tabFocus_1.TabFocus.onDidChangeTabFocus(tabFocusMode => this._onDidChange.fire(tabFocusMode)));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.tabFocusMode')) {
                    const tabFocusModeConfig = this.configurationService.getValue('editor.tabFocusMode') === true ? true : false;
                    tabFocus_1.TabFocus.setTabFocusMode(tabFocusModeConfig);
                    this._onDidChange.fire(tabFocusModeConfig);
                }
            }));
        }
    };
    TabFocusMode = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], TabFocusMode);
    const nlsSingleSelectionRange = (0, nls_1.localize)('singleSelectionRange', "Ln {0}, Col {1} ({2} selected)");
    const nlsSingleSelection = (0, nls_1.localize)('singleSelection', "Ln {0}, Col {1}");
    const nlsMultiSelectionRange = (0, nls_1.localize)('multiSelectionRange', "{0} selections ({1} characters selected)");
    const nlsMultiSelection = (0, nls_1.localize)('multiSelection', "{0} selections");
    const nlsEOLLF = (0, nls_1.localize)('endOfLineLineFeed', "LF");
    const nlsEOLCRLF = (0, nls_1.localize)('endOfLineCarriageReturnLineFeed', "CRLF");
    let EditorStatus = class EditorStatus extends lifecycle_1.Disposable {
        constructor(targetWindowId, editorService, quickInputService, languageService, textFileService, statusbarService, instantiationService, configurationService) {
            super();
            this.targetWindowId = targetWindowId;
            this.editorService = editorService;
            this.quickInputService = quickInputService;
            this.languageService = languageService;
            this.textFileService = textFileService;
            this.statusbarService = statusbarService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.tabFocusModeElement = this._register(new lifecycle_1.MutableDisposable());
            this.columnSelectionModeElement = this._register(new lifecycle_1.MutableDisposable());
            this.indentationElement = this._register(new lifecycle_1.MutableDisposable());
            this.selectionElement = this._register(new lifecycle_1.MutableDisposable());
            this.encodingElement = this._register(new lifecycle_1.MutableDisposable());
            this.eolElement = this._register(new lifecycle_1.MutableDisposable());
            this.languageElement = this._register(new lifecycle_1.MutableDisposable());
            this.metadataElement = this._register(new lifecycle_1.MutableDisposable());
            this.currentMarkerStatus = this._register(this.instantiationService.createInstance(ShowCurrentMarkerInStatusbarContribution));
            this.tabFocusMode = this._register(this.instantiationService.createInstance(TabFocusMode));
            this.state = new State();
            this.toRender = undefined;
            this.activeEditorListeners = this._register(new lifecycle_1.DisposableStore());
            this.delayedRender = this._register(new lifecycle_1.MutableDisposable());
            this.registerCommands();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateStatusBar()));
            this._register(this.textFileService.untitled.onDidChangeEncoding(model => this.onResourceEncodingChange(model.resource)));
            this._register(this.textFileService.files.onDidChangeEncoding(model => this.onResourceEncodingChange((model.resource))));
            this._register(event_1.Event.runAndSubscribe(this.tabFocusMode.onDidChange, (tabFocusMode) => {
                if (tabFocusMode !== undefined) {
                    this.onTabFocusModeChange(tabFocusMode);
                }
                else {
                    this.onTabFocusModeChange(this.configurationService.getValue('editor.tabFocusMode'));
                }
            }));
        }
        registerCommands() {
            this._register(commands_1.CommandsRegistry.registerCommand({ id: `changeEditorIndentation${this.targetWindowId}`, handler: () => this.showIndentationPicker() }));
        }
        async showIndentationPicker() {
            const activeTextEditorControl = (0, editorBrowser_1.getCodeEditor)(this.editorService.activeTextEditorControl);
            if (!activeTextEditorControl) {
                return this.quickInputService.pick([{ label: (0, nls_1.localize)('noEditor', "No text editor active at this time") }]);
            }
            if (this.editorService.activeEditor?.isReadonly()) {
                return this.quickInputService.pick([{ label: (0, nls_1.localize)('noWritableCodeEditor', "The active code editor is read-only.") }]);
            }
            const picks = [
                (0, types_1.assertIsDefined)(activeTextEditorControl.getAction(indentation_1.IndentUsingSpaces.ID)),
                (0, types_1.assertIsDefined)(activeTextEditorControl.getAction(indentation_1.IndentUsingTabs.ID)),
                (0, types_1.assertIsDefined)(activeTextEditorControl.getAction(indentation_1.ChangeTabDisplaySize.ID)),
                (0, types_1.assertIsDefined)(activeTextEditorControl.getAction(indentation_1.DetectIndentation.ID)),
                (0, types_1.assertIsDefined)(activeTextEditorControl.getAction(indentation_1.IndentationToSpacesAction.ID)),
                (0, types_1.assertIsDefined)(activeTextEditorControl.getAction(indentation_1.IndentationToTabsAction.ID)),
                (0, types_1.assertIsDefined)(activeTextEditorControl.getAction(linesOperations_1.TrimTrailingWhitespaceAction.ID))
            ].map((a) => {
                return {
                    id: a.id,
                    label: a.label,
                    detail: (platform_1.Language.isDefaultVariant() || a.label === a.alias) ? undefined : a.alias,
                    run: () => {
                        activeTextEditorControl.focus();
                        a.run();
                    }
                };
            });
            picks.splice(3, 0, { type: 'separator', label: (0, nls_1.localize)('indentConvert', "convert file") });
            picks.unshift({ type: 'separator', label: (0, nls_1.localize)('indentView', "change view") });
            const action = await this.quickInputService.pick(picks, { placeHolder: (0, nls_1.localize)('pickAction', "Select Action"), matchOnDetail: true });
            return action?.run();
        }
        updateTabFocusModeElement(visible) {
            if (visible) {
                if (!this.tabFocusModeElement.value) {
                    const text = (0, nls_1.localize)('tabFocusModeEnabled', "Tab Moves Focus");
                    this.tabFocusModeElement.value = this.statusbarService.addEntry({
                        name: (0, nls_1.localize)('status.editor.tabFocusMode', "Accessibility Mode"),
                        text,
                        ariaLabel: text,
                        tooltip: (0, nls_1.localize)('disableTabMode', "Disable Accessibility Mode"),
                        command: 'editor.action.toggleTabFocusMode',
                        kind: 'prominent'
                    }, 'status.editor.tabFocusMode', 1 /* StatusbarAlignment.RIGHT */, 100.7);
                }
            }
            else {
                this.tabFocusModeElement.clear();
            }
        }
        updateColumnSelectionModeElement(visible) {
            if (visible) {
                if (!this.columnSelectionModeElement.value) {
                    const text = (0, nls_1.localize)('columnSelectionModeEnabled', "Column Selection");
                    this.columnSelectionModeElement.value = this.statusbarService.addEntry({
                        name: (0, nls_1.localize)('status.editor.columnSelectionMode', "Column Selection Mode"),
                        text,
                        ariaLabel: text,
                        tooltip: (0, nls_1.localize)('disableColumnSelectionMode', "Disable Column Selection Mode"),
                        command: 'editor.action.toggleColumnSelection',
                        kind: 'prominent'
                    }, 'status.editor.columnSelectionMode', 1 /* StatusbarAlignment.RIGHT */, 100.8);
                }
            }
            else {
                this.columnSelectionModeElement.clear();
            }
        }
        updateSelectionElement(text) {
            if (!text) {
                this.selectionElement.clear();
                return;
            }
            const editorURI = (0, editorBrowser_1.getCodeEditor)(this.editorService.activeTextEditorControl)?.getModel()?.uri;
            if (editorURI?.scheme === network_1.Schemas.vscodeNotebookCell) {
                this.selectionElement.clear();
                return;
            }
            const props = {
                name: (0, nls_1.localize)('status.editor.selection', "Editor Selection"),
                text,
                ariaLabel: text,
                tooltip: (0, nls_1.localize)('gotoLine', "Go to Line/Column"),
                command: 'workbench.action.gotoLine'
            };
            this.updateElement(this.selectionElement, props, 'status.editor.selection', 1 /* StatusbarAlignment.RIGHT */, 100.5);
        }
        updateIndentationElement(text) {
            if (!text) {
                this.indentationElement.clear();
                return;
            }
            const editorURI = (0, editorBrowser_1.getCodeEditor)(this.editorService.activeTextEditorControl)?.getModel()?.uri;
            if (editorURI?.scheme === network_1.Schemas.vscodeNotebookCell) {
                this.indentationElement.clear();
                return;
            }
            const props = {
                name: (0, nls_1.localize)('status.editor.indentation', "Editor Indentation"),
                text,
                ariaLabel: text,
                tooltip: (0, nls_1.localize)('selectIndentation', "Select Indentation"),
                command: `changeEditorIndentation${this.targetWindowId}`
            };
            this.updateElement(this.indentationElement, props, 'status.editor.indentation', 1 /* StatusbarAlignment.RIGHT */, 100.4);
        }
        updateEncodingElement(text) {
            if (!text) {
                this.encodingElement.clear();
                return;
            }
            const props = {
                name: (0, nls_1.localize)('status.editor.encoding', "Editor Encoding"),
                text,
                ariaLabel: text,
                tooltip: (0, nls_1.localize)('selectEncoding', "Select Encoding"),
                command: 'workbench.action.editor.changeEncoding'
            };
            this.updateElement(this.encodingElement, props, 'status.editor.encoding', 1 /* StatusbarAlignment.RIGHT */, 100.3);
        }
        updateEOLElement(text) {
            if (!text) {
                this.eolElement.clear();
                return;
            }
            const props = {
                name: (0, nls_1.localize)('status.editor.eol', "Editor End of Line"),
                text,
                ariaLabel: text,
                tooltip: (0, nls_1.localize)('selectEOL', "Select End of Line Sequence"),
                command: 'workbench.action.editor.changeEOL'
            };
            this.updateElement(this.eolElement, props, 'status.editor.eol', 1 /* StatusbarAlignment.RIGHT */, 100.2);
        }
        updateLanguageIdElement(text) {
            if (!text) {
                this.languageElement.clear();
                return;
            }
            const props = {
                name: (0, nls_1.localize)('status.editor.mode', "Editor Language"),
                text,
                ariaLabel: text,
                tooltip: (0, nls_1.localize)('selectLanguageMode', "Select Language Mode"),
                command: 'workbench.action.editor.changeLanguageMode'
            };
            this.updateElement(this.languageElement, props, 'status.editor.mode', 1 /* StatusbarAlignment.RIGHT */, 100.1);
        }
        updateMetadataElement(text) {
            if (!text) {
                this.metadataElement.clear();
                return;
            }
            const props = {
                name: (0, nls_1.localize)('status.editor.info', "File Information"),
                text,
                ariaLabel: text,
                tooltip: (0, nls_1.localize)('fileInfo', "File Information")
            };
            this.updateElement(this.metadataElement, props, 'status.editor.info', 1 /* StatusbarAlignment.RIGHT */, 100);
        }
        updateElement(element, props, id, alignment, priority) {
            if (!element.value) {
                element.value = this.statusbarService.addEntry(props, id, alignment, priority);
            }
            else {
                element.value.update(props);
            }
        }
        updateState(update) {
            const changed = this.state.update(update);
            if (!changed.hasChanges()) {
                return; // Nothing really changed
            }
            if (!this.toRender) {
                this.toRender = changed;
                this.delayedRender.value = (0, dom_1.runAtThisOrScheduleAtNextAnimationFrame)((0, dom_1.getWindowById)(this.targetWindowId, true).window, () => {
                    this.delayedRender.clear();
                    const toRender = this.toRender;
                    this.toRender = undefined;
                    if (toRender) {
                        this.doRenderNow();
                    }
                });
            }
            else {
                this.toRender.combine(changed);
            }
        }
        doRenderNow() {
            this.updateTabFocusModeElement(!!this.state.tabFocusMode);
            this.updateColumnSelectionModeElement(!!this.state.columnSelectionMode);
            this.updateIndentationElement(this.state.indentation);
            this.updateSelectionElement(this.state.selectionStatus);
            this.updateEncodingElement(this.state.encoding);
            this.updateEOLElement(this.state.EOL ? this.state.EOL === '\r\n' ? nlsEOLCRLF : nlsEOLLF : undefined);
            this.updateLanguageIdElement(this.state.languageId);
            this.updateMetadataElement(this.state.metadata);
        }
        getSelectionLabel(info) {
            if (!info || !info.selections) {
                return undefined;
            }
            if (info.selections.length === 1) {
                if (info.charactersSelected) {
                    return (0, strings_1.format)(nlsSingleSelectionRange, info.selections[0].positionLineNumber, info.selections[0].positionColumn, info.charactersSelected);
                }
                return (0, strings_1.format)(nlsSingleSelection, info.selections[0].positionLineNumber, info.selections[0].positionColumn);
            }
            if (info.charactersSelected) {
                return (0, strings_1.format)(nlsMultiSelectionRange, info.selections.length, info.charactersSelected);
            }
            if (info.selections.length > 0) {
                return (0, strings_1.format)(nlsMultiSelection, info.selections.length);
            }
            return undefined;
        }
        updateStatusBar() {
            const activeInput = this.editorService.activeEditor;
            const activeEditorPane = this.editorService.activeEditorPane;
            const activeCodeEditor = activeEditorPane ? (0, editorBrowser_1.getCodeEditor)(activeEditorPane.getControl()) ?? undefined : undefined;
            // Update all states
            this.onColumnSelectionModeChange(activeCodeEditor);
            this.onSelectionChange(activeCodeEditor);
            this.onLanguageChange(activeCodeEditor, activeInput);
            this.onEOLChange(activeCodeEditor);
            this.onEncodingChange(activeEditorPane, activeCodeEditor);
            this.onIndentationChange(activeCodeEditor);
            this.onMetadataChange(activeEditorPane);
            this.currentMarkerStatus.update(activeCodeEditor);
            // Dispose old active editor listeners
            this.activeEditorListeners.clear();
            // Attach new listeners to active editor
            if (activeEditorPane) {
                this.activeEditorListeners.add(activeEditorPane.onDidChangeControl(() => {
                    // Since our editor status is mainly observing the
                    // active editor control, do a full update whenever
                    // the control changes.
                    this.updateStatusBar();
                }));
            }
            // Attach new listeners to active code editor
            if (activeCodeEditor) {
                // Hook Listener for Configuration changes
                this.activeEditorListeners.add(activeCodeEditor.onDidChangeConfiguration((event) => {
                    if (event.hasChanged(22 /* EditorOption.columnSelection */)) {
                        this.onColumnSelectionModeChange(activeCodeEditor);
                    }
                }));
                // Hook Listener for Selection changes
                this.activeEditorListeners.add(event_1.Event.defer(activeCodeEditor.onDidChangeCursorPosition)(() => {
                    this.onSelectionChange(activeCodeEditor);
                    this.currentMarkerStatus.update(activeCodeEditor);
                }));
                // Hook Listener for language changes
                this.activeEditorListeners.add(activeCodeEditor.onDidChangeModelLanguage(() => {
                    this.onLanguageChange(activeCodeEditor, activeInput);
                }));
                // Hook Listener for content changes
                this.activeEditorListeners.add(event_1.Event.accumulate(activeCodeEditor.onDidChangeModelContent)(e => {
                    this.onEOLChange(activeCodeEditor);
                    this.currentMarkerStatus.update(activeCodeEditor);
                    const selections = activeCodeEditor.getSelections();
                    if (selections) {
                        for (const inner of e) {
                            for (const change of inner.changes) {
                                if (selections.some(selection => range_1.Range.areIntersecting(selection, change.range))) {
                                    this.onSelectionChange(activeCodeEditor);
                                    break;
                                }
                            }
                        }
                    }
                }));
                // Hook Listener for content options changes
                this.activeEditorListeners.add(activeCodeEditor.onDidChangeModelOptions(() => {
                    this.onIndentationChange(activeCodeEditor);
                }));
            }
            // Handle binary editors
            else if (activeEditorPane instanceof binaryEditor_1.BaseBinaryResourceEditor || activeEditorPane instanceof binaryDiffEditor_1.BinaryResourceDiffEditor) {
                const binaryEditors = [];
                if (activeEditorPane instanceof binaryDiffEditor_1.BinaryResourceDiffEditor) {
                    const primary = activeEditorPane.getPrimaryEditorPane();
                    if (primary instanceof binaryEditor_1.BaseBinaryResourceEditor) {
                        binaryEditors.push(primary);
                    }
                    const secondary = activeEditorPane.getSecondaryEditorPane();
                    if (secondary instanceof binaryEditor_1.BaseBinaryResourceEditor) {
                        binaryEditors.push(secondary);
                    }
                }
                else {
                    binaryEditors.push(activeEditorPane);
                }
                for (const editor of binaryEditors) {
                    this.activeEditorListeners.add(editor.onDidChangeMetadata(() => {
                        this.onMetadataChange(activeEditorPane);
                    }));
                    this.activeEditorListeners.add(editor.onDidOpenInPlace(() => {
                        this.updateStatusBar();
                    }));
                }
            }
        }
        onLanguageChange(editorWidget, editorInput) {
            const info = { type: 'languageId', languageId: undefined };
            // We only support text based editors
            if (editorWidget && editorInput && toEditorWithLanguageSupport(editorInput)) {
                const textModel = editorWidget.getModel();
                if (textModel) {
                    const languageId = textModel.getLanguageId();
                    info.languageId = this.languageService.getLanguageName(languageId) ?? undefined;
                }
            }
            this.updateState(info);
        }
        onIndentationChange(editorWidget) {
            const update = { type: 'indentation', indentation: undefined };
            if (editorWidget) {
                const model = editorWidget.getModel();
                if (model) {
                    const modelOpts = model.getOptions();
                    update.indentation = (modelOpts.insertSpaces
                        ? modelOpts.tabSize === modelOpts.indentSize
                            ? (0, nls_1.localize)('spacesSize', "Spaces: {0}", modelOpts.indentSize)
                            : (0, nls_1.localize)('spacesAndTabsSize', "Spaces: {0} (Tab Size: {1})", modelOpts.indentSize, modelOpts.tabSize)
                        : (0, nls_1.localize)({ key: 'tabSize', comment: ['Tab corresponds to the tab key'] }, "Tab Size: {0}", modelOpts.tabSize));
                }
            }
            this.updateState(update);
        }
        onMetadataChange(editor) {
            const update = { type: 'metadata', metadata: undefined };
            if (editor instanceof binaryEditor_1.BaseBinaryResourceEditor || editor instanceof binaryDiffEditor_1.BinaryResourceDiffEditor) {
                update.metadata = editor.getMetadata();
            }
            this.updateState(update);
        }
        onColumnSelectionModeChange(editorWidget) {
            const info = { type: 'columnSelectionMode', columnSelectionMode: false };
            if (editorWidget?.getOption(22 /* EditorOption.columnSelection */)) {
                info.columnSelectionMode = true;
            }
            this.updateState(info);
        }
        onSelectionChange(editorWidget) {
            const info = Object.create(null);
            // We only support text based editors
            if (editorWidget) {
                // Compute selection(s)
                info.selections = editorWidget.getSelections() || [];
                // Compute selection length
                info.charactersSelected = 0;
                const textModel = editorWidget.getModel();
                if (textModel) {
                    for (const selection of info.selections) {
                        if (typeof info.charactersSelected !== 'number') {
                            info.charactersSelected = 0;
                        }
                        info.charactersSelected += textModel.getCharacterCountInRange(selection);
                    }
                }
                // Compute the visible column for one selection. This will properly handle tabs and their configured widths
                if (info.selections.length === 1) {
                    const editorPosition = editorWidget.getPosition();
                    const selectionClone = new selection_1.Selection(info.selections[0].selectionStartLineNumber, info.selections[0].selectionStartColumn, info.selections[0].positionLineNumber, editorPosition ? editorWidget.getStatusbarColumn(editorPosition) : info.selections[0].positionColumn);
                    info.selections[0] = selectionClone;
                }
            }
            this.updateState({ type: 'selectionStatus', selectionStatus: this.getSelectionLabel(info) });
        }
        onEOLChange(editorWidget) {
            const info = { type: 'EOL', EOL: undefined };
            if (editorWidget && !editorWidget.getOption(91 /* EditorOption.readOnly */)) {
                const codeEditorModel = editorWidget.getModel();
                if (codeEditorModel) {
                    info.EOL = codeEditorModel.getEOL();
                }
            }
            this.updateState(info);
        }
        onEncodingChange(editor, editorWidget) {
            if (editor && !this.isActiveEditor(editor)) {
                return;
            }
            const info = { type: 'encoding', encoding: undefined };
            // We only support text based editors that have a model associated
            // This ensures we do not show the encoding picker while an editor
            // is still loading.
            if (editor && editorWidget?.hasModel()) {
                const encodingSupport = editor.input ? toEditorWithEncodingSupport(editor.input) : null;
                if (encodingSupport) {
                    const rawEncoding = encodingSupport.getEncoding();
                    const encodingInfo = typeof rawEncoding === 'string' ? encoding_1.SUPPORTED_ENCODINGS[rawEncoding] : undefined;
                    if (encodingInfo) {
                        info.encoding = encodingInfo.labelShort; // if we have a label, take it from there
                    }
                    else {
                        info.encoding = rawEncoding; // otherwise use it raw
                    }
                }
            }
            this.updateState(info);
        }
        onResourceEncodingChange(resource) {
            const activeEditorPane = this.editorService.activeEditorPane;
            if (activeEditorPane) {
                const activeResource = editor_1.EditorResourceAccessor.getCanonicalUri(activeEditorPane.input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                if (activeResource && (0, resources_1.isEqual)(activeResource, resource)) {
                    const activeCodeEditor = (0, editorBrowser_1.getCodeEditor)(activeEditorPane.getControl()) ?? undefined;
                    return this.onEncodingChange(activeEditorPane, activeCodeEditor); // only update if the encoding changed for the active resource
                }
            }
        }
        onTabFocusModeChange(tabFocusMode) {
            const info = { type: 'tabFocusMode', tabFocusMode };
            this.updateState(info);
        }
        isActiveEditor(control) {
            const activeEditorPane = this.editorService.activeEditorPane;
            return !!activeEditorPane && activeEditorPane === control;
        }
    };
    EditorStatus = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, language_1.ILanguageService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, statusbar_1.IStatusbarService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, configuration_1.IConfigurationService)
    ], EditorStatus);
    let EditorStatusContribution = class EditorStatusContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.editorStatus'; }
        constructor(instantiationService, editorGroupService, editorService) {
            super();
            // Main Editor Status
            const mainInstantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([editorService_1.IEditorService, editorService.createScoped('main', this._store)]));
            this._register(mainInstantiationService.createInstance(EditorStatus, window_1.mainWindow.vscodeWindowId));
            // Auxiliary Editor Status
            this._register(editorGroupService.onDidCreateAuxiliaryEditorPart(({ part, instantiationService, disposables }) => {
                disposables.add(instantiationService.createInstance(EditorStatus, part.windowId));
            }));
        }
    };
    exports.EditorStatusContribution = EditorStatusContribution;
    exports.EditorStatusContribution = EditorStatusContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, editorService_1.IEditorService)
    ], EditorStatusContribution);
    let ShowCurrentMarkerInStatusbarContribution = class ShowCurrentMarkerInStatusbarContribution extends lifecycle_1.Disposable {
        constructor(statusbarService, markerService, configurationService) {
            super();
            this.statusbarService = statusbarService;
            this.markerService = markerService;
            this.configurationService = configurationService;
            this.editor = undefined;
            this.markers = [];
            this.currentMarker = null;
            this.statusBarEntryAccessor = this._register(new lifecycle_1.MutableDisposable());
            this._register(markerService.onMarkerChanged(changedResources => this.onMarkerChanged(changedResources)));
            this._register(event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('problems.showCurrentInStatus'))(() => this.updateStatus()));
        }
        update(editor) {
            this.editor = editor;
            this.updateMarkers();
            this.updateStatus();
        }
        updateStatus() {
            const previousMarker = this.currentMarker;
            this.currentMarker = this.getMarker();
            if (this.hasToUpdateStatus(previousMarker, this.currentMarker)) {
                if (this.currentMarker) {
                    const line = (0, strings_1.splitLines)(this.currentMarker.message)[0];
                    const text = `${this.getType(this.currentMarker)} ${line}`;
                    if (!this.statusBarEntryAccessor.value) {
                        this.statusBarEntryAccessor.value = this.statusbarService.addEntry({ name: (0, nls_1.localize)('currentProblem', "Current Problem"), text: '', ariaLabel: '' }, 'statusbar.currentProblem', 0 /* StatusbarAlignment.LEFT */);
                    }
                    this.statusBarEntryAccessor.value.update({ name: (0, nls_1.localize)('currentProblem', "Current Problem"), text, ariaLabel: text });
                }
                else {
                    this.statusBarEntryAccessor.clear();
                }
            }
        }
        hasToUpdateStatus(previousMarker, currentMarker) {
            if (!currentMarker) {
                return true;
            }
            if (!previousMarker) {
                return true;
            }
            return markers_1.IMarkerData.makeKey(previousMarker) !== markers_1.IMarkerData.makeKey(currentMarker);
        }
        getType(marker) {
            switch (marker.severity) {
                case markers_1.MarkerSeverity.Error: return '$(error)';
                case markers_1.MarkerSeverity.Warning: return '$(warning)';
                case markers_1.MarkerSeverity.Info: return '$(info)';
            }
            return '';
        }
        getMarker() {
            if (!this.configurationService.getValue('problems.showCurrentInStatus')) {
                return null;
            }
            if (!this.editor) {
                return null;
            }
            const model = this.editor.getModel();
            if (!model) {
                return null;
            }
            const position = this.editor.getPosition();
            if (!position) {
                return null;
            }
            return this.markers.find(marker => range_1.Range.containsPosition(marker, position)) || null;
        }
        onMarkerChanged(changedResources) {
            if (!this.editor) {
                return;
            }
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            if (model && !changedResources.some(r => (0, resources_1.isEqual)(model.uri, r))) {
                return;
            }
            this.updateMarkers();
        }
        updateMarkers() {
            if (!this.editor) {
                return;
            }
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            if (model) {
                this.markers = this.markerService.read({
                    resource: model.uri,
                    severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning | markers_1.MarkerSeverity.Info
                });
                this.markers.sort(this.compareMarker);
            }
            else {
                this.markers = [];
            }
            this.updateStatus();
        }
        compareMarker(a, b) {
            let res = (0, strings_1.compare)(a.resource.toString(), b.resource.toString());
            if (res === 0) {
                res = markers_1.MarkerSeverity.compare(a.severity, b.severity);
            }
            if (res === 0) {
                res = range_1.Range.compareRangesUsingStarts(a, b);
            }
            return res;
        }
    };
    ShowCurrentMarkerInStatusbarContribution = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, markers_1.IMarkerService),
        __param(2, configuration_1.IConfigurationService)
    ], ShowCurrentMarkerInStatusbarContribution);
    let ShowLanguageExtensionsAction = class ShowLanguageExtensionsAction extends actions_1.Action {
        static { ShowLanguageExtensionsAction_1 = this; }
        static { this.ID = 'workbench.action.showLanguageExtensions'; }
        constructor(fileExtension, commandService, galleryService) {
            super(ShowLanguageExtensionsAction_1.ID, (0, nls_1.localize)('showLanguageExtensions', "Search Marketplace Extensions for '{0}'...", fileExtension));
            this.fileExtension = fileExtension;
            this.commandService = commandService;
            this.enabled = galleryService.isEnabled();
        }
        async run() {
            await this.commandService.executeCommand('workbench.extensions.action.showExtensionsForLanguage', this.fileExtension);
        }
    };
    exports.ShowLanguageExtensionsAction = ShowLanguageExtensionsAction;
    exports.ShowLanguageExtensionsAction = ShowLanguageExtensionsAction = ShowLanguageExtensionsAction_1 = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, extensionManagement_1.IExtensionGalleryService)
    ], ShowLanguageExtensionsAction);
    class ChangeLanguageAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.editor.changeLanguageMode'; }
        constructor() {
            super({
                id: ChangeLanguageAction.ID,
                title: (0, nls_1.localize2)('changeMode', 'Change Language Mode'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 43 /* KeyCode.KeyM */)
                },
                precondition: contextkey_1.ContextKeyExpr.not('notebookEditorFocused')
            });
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const languageService = accessor.get(language_1.ILanguageService);
            const languageDetectionService = accessor.get(languageDetectionWorkerService_1.ILanguageDetectionService);
            const textFileService = accessor.get(textfiles_1.ITextFileService);
            const preferencesService = accessor.get(preferences_1.IPreferencesService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            const activeTextEditorControl = (0, editorBrowser_1.getCodeEditor)(editorService.activeTextEditorControl);
            if (!activeTextEditorControl) {
                await quickInputService.pick([{ label: (0, nls_1.localize)('noEditor', "No text editor active at this time") }]);
                return;
            }
            const textModel = activeTextEditorControl.getModel();
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            // Compute language
            let currentLanguageName;
            let currentLanguageId;
            if (textModel) {
                currentLanguageId = textModel.getLanguageId();
                currentLanguageName = languageService.getLanguageName(currentLanguageId) ?? undefined;
            }
            let hasLanguageSupport = !!resource;
            if (resource?.scheme === network_1.Schemas.untitled && !textFileService.untitled.get(resource)?.hasAssociatedFilePath) {
                hasLanguageSupport = false; // no configuration for untitled resources (e.g. "Untitled-1")
            }
            // All languages are valid picks
            const languages = languageService.getSortedRegisteredLanguageNames();
            const picks = languages
                .map(({ languageName, languageId }) => {
                const extensions = languageService.getExtensions(languageId).join(' ');
                let description;
                if (currentLanguageName === languageName) {
                    description = (0, nls_1.localize)('languageDescription', "({0}) - Configured Language", languageId);
                }
                else {
                    description = (0, nls_1.localize)('languageDescriptionConfigured', "({0})", languageId);
                }
                return {
                    label: languageName,
                    meta: extensions,
                    iconClasses: (0, getIconClasses_1.getIconClassesForLanguageId)(languageId),
                    description
                };
            });
            picks.unshift({ type: 'separator', label: (0, nls_1.localize)('languagesPicks', "languages (identifier)") });
            // Offer action to configure via settings
            let configureLanguageAssociations;
            let configureLanguageSettings;
            let galleryAction;
            if (hasLanguageSupport && resource) {
                const ext = (0, resources_1.extname)(resource) || (0, resources_1.basename)(resource);
                galleryAction = instantiationService.createInstance(ShowLanguageExtensionsAction, ext);
                if (galleryAction.enabled) {
                    picks.unshift(galleryAction);
                }
                configureLanguageSettings = { label: (0, nls_1.localize)('configureModeSettings', "Configure '{0}' language based settings...", currentLanguageName) };
                picks.unshift(configureLanguageSettings);
                configureLanguageAssociations = { label: (0, nls_1.localize)('configureAssociationsExt', "Configure File Association for '{0}'...", ext) };
                picks.unshift(configureLanguageAssociations);
            }
            // Offer to "Auto Detect"
            const autoDetectLanguage = {
                label: (0, nls_1.localize)('autoDetect', "Auto Detect")
            };
            picks.unshift(autoDetectLanguage);
            const pick = await quickInputService.pick(picks, { placeHolder: (0, nls_1.localize)('pickLanguage', "Select Language Mode"), matchOnDescription: true });
            if (!pick) {
                return;
            }
            if (pick === galleryAction) {
                galleryAction.run();
                return;
            }
            // User decided to permanently configure associations, return right after
            if (pick === configureLanguageAssociations) {
                if (resource) {
                    this.configureFileAssociation(resource, languageService, quickInputService, configurationService);
                }
                return;
            }
            // User decided to configure settings for current language
            if (pick === configureLanguageSettings) {
                preferencesService.openUserSettings({ jsonEditor: true, revealSetting: { key: `[${currentLanguageId ?? null}]`, edit: true } });
                return;
            }
            // Change language for active editor
            const activeEditor = editorService.activeEditor;
            if (activeEditor) {
                const languageSupport = toEditorWithLanguageSupport(activeEditor);
                if (languageSupport) {
                    // Find language
                    let languageSelection;
                    let detectedLanguage;
                    if (pick === autoDetectLanguage) {
                        if (textModel) {
                            const resource = editor_1.EditorResourceAccessor.getOriginalUri(activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                            if (resource) {
                                // Detect languages since we are in an untitled file
                                let languageId = languageService.guessLanguageIdByFilepathOrFirstLine(resource, textModel.getLineContent(1)) ?? undefined;
                                if (!languageId || languageId === 'unknown') {
                                    detectedLanguage = await languageDetectionService.detectLanguage(resource);
                                    languageId = detectedLanguage;
                                }
                                if (languageId) {
                                    languageSelection = languageService.createById(languageId);
                                }
                            }
                        }
                    }
                    else {
                        const languageId = languageService.getLanguageIdByLanguageName(pick.label);
                        languageSelection = languageService.createById(languageId);
                        if (resource) {
                            // fire and forget to not slow things down
                            languageDetectionService.detectLanguage(resource).then(detectedLanguageId => {
                                const chosenLanguageId = languageService.getLanguageIdByLanguageName(pick.label) || 'unknown';
                                if (detectedLanguageId === currentLanguageId && currentLanguageId !== chosenLanguageId) {
                                    // If they didn't choose the detected language (which should also be the active language if automatic detection is enabled)
                                    // then the automatic language detection was likely wrong and the user is correcting it. In this case, we want telemetry.
                                    // Keep track of what model was preferred and length of input to help track down potential differences between the result quality across models and content size.
                                    const modelPreference = configurationService.getValue('workbench.editor.preferHistoryBasedLanguageDetection') ? 'history' : 'classic';
                                    telemetryService.publicLog2(languageDetectionWorkerService_1.AutomaticLanguageDetectionLikelyWrongId, {
                                        currentLanguageId: currentLanguageName ?? 'unknown',
                                        nextLanguageId: pick.label,
                                        lineCount: textModel?.getLineCount() ?? -1,
                                        modelPreference,
                                    });
                                }
                            });
                        }
                    }
                    // Change language
                    if (typeof languageSelection !== 'undefined') {
                        languageSupport.setLanguageId(languageSelection.languageId, ChangeLanguageAction.ID);
                        if (resource?.scheme === network_1.Schemas.untitled) {
                            const modelPreference = configurationService.getValue('workbench.editor.preferHistoryBasedLanguageDetection') ? 'history' : 'classic';
                            telemetryService.publicLog2('setUntitledDocumentLanguage', {
                                to: languageSelection.languageId,
                                from: currentLanguageId ?? 'none',
                                modelPreference,
                            });
                        }
                    }
                }
                activeTextEditorControl.focus();
            }
        }
        configureFileAssociation(resource, languageService, quickInputService, configurationService) {
            const extension = (0, resources_1.extname)(resource);
            const base = (0, resources_1.basename)(resource);
            const currentAssociation = languageService.guessLanguageIdByFilepathOrFirstLine(uri_1.URI.file(base));
            const languages = languageService.getSortedRegisteredLanguageNames();
            const picks = languages.map(({ languageName, languageId }) => {
                return {
                    id: languageId,
                    label: languageName,
                    iconClasses: (0, getIconClasses_1.getIconClassesForLanguageId)(languageId),
                    description: (languageId === currentAssociation) ? (0, nls_1.localize)('currentAssociation', "Current Association") : undefined
                };
            });
            setTimeout(async () => {
                const language = await quickInputService.pick(picks, { placeHolder: (0, nls_1.localize)('pickLanguageToConfigure', "Select Language Mode to Associate with '{0}'", extension || base) });
                if (language) {
                    const fileAssociationsConfig = configurationService.inspect(files_1.FILES_ASSOCIATIONS_CONFIG);
                    let associationKey;
                    if (extension && base[0] !== '.') {
                        associationKey = `*${extension}`; // only use "*.ext" if the file path is in the form of <name>.<ext>
                    }
                    else {
                        associationKey = base; // otherwise use the basename (e.g. .gitignore, Dockerfile)
                    }
                    // If the association is already being made in the workspace, make sure to target workspace settings
                    let target = 2 /* ConfigurationTarget.USER */;
                    if (fileAssociationsConfig.workspaceValue && !!fileAssociationsConfig.workspaceValue[associationKey]) {
                        target = 5 /* ConfigurationTarget.WORKSPACE */;
                    }
                    // Make sure to write into the value of the target and not the merged value from USER and WORKSPACE config
                    const currentAssociations = (0, objects_1.deepClone)((target === 5 /* ConfigurationTarget.WORKSPACE */) ? fileAssociationsConfig.workspaceValue : fileAssociationsConfig.userValue) || Object.create(null);
                    currentAssociations[associationKey] = language.id;
                    configurationService.updateValue(files_1.FILES_ASSOCIATIONS_CONFIG, currentAssociations, target);
                }
            }, 50 /* quick input is sensitive to being opened so soon after another */);
        }
    }
    exports.ChangeLanguageAction = ChangeLanguageAction;
    class ChangeEOLAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.editor.changeEOL',
                title: (0, nls_1.localize2)('changeEndOfLine', 'Change End of Line Sequence'),
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const activeTextEditorControl = (0, editorBrowser_1.getCodeEditor)(editorService.activeTextEditorControl);
            if (!activeTextEditorControl) {
                await quickInputService.pick([{ label: (0, nls_1.localize)('noEditor', "No text editor active at this time") }]);
                return;
            }
            if (editorService.activeEditor?.isReadonly()) {
                await quickInputService.pick([{ label: (0, nls_1.localize)('noWritableCodeEditor', "The active code editor is read-only.") }]);
                return;
            }
            let textModel = activeTextEditorControl.getModel();
            const EOLOptions = [
                { label: nlsEOLLF, eol: 0 /* EndOfLineSequence.LF */ },
                { label: nlsEOLCRLF, eol: 1 /* EndOfLineSequence.CRLF */ },
            ];
            const selectedIndex = (textModel?.getEOL() === '\n') ? 0 : 1;
            const eol = await quickInputService.pick(EOLOptions, { placeHolder: (0, nls_1.localize)('pickEndOfLine', "Select End of Line Sequence"), activeItem: EOLOptions[selectedIndex] });
            if (eol) {
                const activeCodeEditor = (0, editorBrowser_1.getCodeEditor)(editorService.activeTextEditorControl);
                if (activeCodeEditor?.hasModel() && !editorService.activeEditor?.isReadonly()) {
                    textModel = activeCodeEditor.getModel();
                    textModel.pushStackElement();
                    textModel.pushEOL(eol.eol);
                    textModel.pushStackElement();
                }
            }
            activeTextEditorControl.focus();
        }
    }
    exports.ChangeEOLAction = ChangeEOLAction;
    class ChangeEncodingAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.editor.changeEncoding',
                title: (0, nls_1.localize2)('changeEncoding', 'Change File Encoding'),
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const fileService = accessor.get(files_1.IFileService);
            const textFileService = accessor.get(textfiles_1.ITextFileService);
            const textResourceConfigurationService = accessor.get(textResourceConfiguration_1.ITextResourceConfigurationService);
            const activeTextEditorControl = (0, editorBrowser_1.getCodeEditor)(editorService.activeTextEditorControl);
            if (!activeTextEditorControl) {
                await quickInputService.pick([{ label: (0, nls_1.localize)('noEditor', "No text editor active at this time") }]);
                return;
            }
            const activeEditorPane = editorService.activeEditorPane;
            if (!activeEditorPane) {
                await quickInputService.pick([{ label: (0, nls_1.localize)('noEditor', "No text editor active at this time") }]);
                return;
            }
            const encodingSupport = toEditorWithEncodingSupport(activeEditorPane.input);
            if (!encodingSupport) {
                await quickInputService.pick([{ label: (0, nls_1.localize)('noFileEditor', "No file active at this time") }]);
                return;
            }
            const saveWithEncodingPick = { label: (0, nls_1.localize)('saveWithEncoding', "Save with Encoding") };
            const reopenWithEncodingPick = { label: (0, nls_1.localize)('reopenWithEncoding', "Reopen with Encoding") };
            if (!platform_1.Language.isDefaultVariant()) {
                const saveWithEncodingAlias = 'Save with Encoding';
                if (saveWithEncodingAlias !== saveWithEncodingPick.label) {
                    saveWithEncodingPick.detail = saveWithEncodingAlias;
                }
                const reopenWithEncodingAlias = 'Reopen with Encoding';
                if (reopenWithEncodingAlias !== reopenWithEncodingPick.label) {
                    reopenWithEncodingPick.detail = reopenWithEncodingAlias;
                }
            }
            let action;
            if (encodingSupport instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
                action = saveWithEncodingPick;
            }
            else if (activeEditorPane.input.isReadonly()) {
                action = reopenWithEncodingPick;
            }
            else {
                action = await quickInputService.pick([reopenWithEncodingPick, saveWithEncodingPick], { placeHolder: (0, nls_1.localize)('pickAction', "Select Action"), matchOnDetail: true });
            }
            if (!action) {
                return;
            }
            await (0, async_1.timeout)(50); // quick input is sensitive to being opened so soon after another
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(activeEditorPane.input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (!resource || (!fileService.hasProvider(resource) && resource.scheme !== network_1.Schemas.untitled)) {
                return; // encoding detection only possible for resources the file service can handle or that are untitled
            }
            let guessedEncoding = undefined;
            if (fileService.hasProvider(resource)) {
                const content = await textFileService.readStream(resource, { autoGuessEncoding: true });
                guessedEncoding = content.encoding;
            }
            const isReopenWithEncoding = (action === reopenWithEncodingPick);
            const configuredEncoding = textResourceConfigurationService.getValue(resource ?? undefined, 'files.encoding');
            let directMatchIndex;
            let aliasMatchIndex;
            // All encodings are valid picks
            const picks = Object.keys(encoding_1.SUPPORTED_ENCODINGS)
                .sort((k1, k2) => {
                if (k1 === configuredEncoding) {
                    return -1;
                }
                else if (k2 === configuredEncoding) {
                    return 1;
                }
                return encoding_1.SUPPORTED_ENCODINGS[k1].order - encoding_1.SUPPORTED_ENCODINGS[k2].order;
            })
                .filter(k => {
                if (k === guessedEncoding && guessedEncoding !== configuredEncoding) {
                    return false; // do not show encoding if it is the guessed encoding that does not match the configured
                }
                return !isReopenWithEncoding || !encoding_1.SUPPORTED_ENCODINGS[k].encodeOnly; // hide those that can only be used for encoding if we are about to decode
            })
                .map((key, index) => {
                if (key === encodingSupport.getEncoding()) {
                    directMatchIndex = index;
                }
                else if (encoding_1.SUPPORTED_ENCODINGS[key].alias === encodingSupport.getEncoding()) {
                    aliasMatchIndex = index;
                }
                return { id: key, label: encoding_1.SUPPORTED_ENCODINGS[key].labelLong, description: key };
            });
            const items = picks.slice();
            // If we have a guessed encoding, show it first unless it matches the configured encoding
            if (guessedEncoding && configuredEncoding !== guessedEncoding && encoding_1.SUPPORTED_ENCODINGS[guessedEncoding]) {
                picks.unshift({ type: 'separator' });
                picks.unshift({ id: guessedEncoding, label: encoding_1.SUPPORTED_ENCODINGS[guessedEncoding].labelLong, description: (0, nls_1.localize)('guessedEncoding', "Guessed from content") });
            }
            const encoding = await quickInputService.pick(picks, {
                placeHolder: isReopenWithEncoding ? (0, nls_1.localize)('pickEncodingForReopen', "Select File Encoding to Reopen File") : (0, nls_1.localize)('pickEncodingForSave', "Select File Encoding to Save with"),
                activeItem: items[typeof directMatchIndex === 'number' ? directMatchIndex : typeof aliasMatchIndex === 'number' ? aliasMatchIndex : -1]
            });
            if (!encoding) {
                return;
            }
            if (!editorService.activeEditorPane) {
                return;
            }
            const activeEncodingSupport = toEditorWithEncodingSupport(editorService.activeEditorPane.input);
            if (typeof encoding.id !== 'undefined' && activeEncodingSupport) {
                await activeEncodingSupport.setEncoding(encoding.id, isReopenWithEncoding ? 1 /* EncodingMode.Decode */ : 0 /* EncodingMode.Encode */); // Set new encoding
            }
            activeTextEditorControl.focus();
        }
    }
    exports.ChangeEncodingAction = ChangeEncodingAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU3RhdHVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yU3RhdHVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEwRGhHLE1BQU0sK0JBQStCO1FBQ3BDLFlBQW9CLE9BQXlCLEVBQVUsU0FBMkI7WUFBOUQsWUFBTyxHQUFQLE9BQU8sQ0FBa0I7WUFBVSxjQUFTLEdBQVQsU0FBUyxDQUFrQjtRQUFJLENBQUM7UUFFdkYsV0FBVztZQUNWLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLGdEQUFnRDtRQUNwRixDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFnQixFQUFFLElBQWtCO1lBQ3JELE1BQU0sZ0JBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUcsQ0FBQztLQUNEO0lBRUQsTUFBTSwrQkFBK0I7UUFFcEMsWUFBb0IsT0FBeUIsRUFBVSxTQUEyQjtZQUE5RCxZQUFPLEdBQVAsT0FBTyxDQUFrQjtZQUFVLGNBQVMsR0FBVCxTQUFTLENBQWtCO1FBQUksQ0FBQztRQUV2RixhQUFhLENBQUMsVUFBa0IsRUFBRSxNQUFlO1lBQ2hELENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM1RixDQUFDO0tBQ0Q7SUFFRCxTQUFTLDJCQUEyQixDQUFDLEtBQWtCO1FBRXRELHVCQUF1QjtRQUN2QixJQUFJLEtBQUssWUFBWSxpREFBdUIsRUFBRSxDQUFDO1lBQzlDLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELDZCQUE2QjtRQUM3QixJQUFJLEtBQUssWUFBWSw2Q0FBcUIsRUFBRSxDQUFDO1lBQzVDLE1BQU0sc0JBQXNCLEdBQUcsMkJBQTJCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFFLE1BQU0sd0JBQXdCLEdBQUcsMkJBQTJCLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRTlFLElBQUksc0JBQXNCLElBQUksd0JBQXdCLEVBQUUsQ0FBQztnQkFDeEQsT0FBTyxJQUFJLCtCQUErQixDQUFDLHNCQUFzQixFQUFFLHdCQUF3QixDQUFDLENBQUM7WUFDOUYsQ0FBQztZQUVELE9BQU8sc0JBQXNCLENBQUM7UUFDL0IsQ0FBQztRQUVELDBCQUEwQjtRQUMxQixNQUFNLGVBQWUsR0FBRyxLQUF5QixDQUFDO1FBQ2xELElBQUksSUFBQSxvQkFBWSxFQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsZUFBZSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7WUFDNUUsT0FBTyxlQUFlLENBQUM7UUFDeEIsQ0FBQztRQUVELG1DQUFtQztRQUNuQyxPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7SUFFRCxTQUFTLDJCQUEyQixDQUFDLEtBQWtCO1FBRXRELHVCQUF1QjtRQUN2QixJQUFJLEtBQUssWUFBWSxpREFBdUIsRUFBRSxDQUFDO1lBQzlDLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELDZCQUE2QjtRQUM3QixJQUFJLEtBQUssWUFBWSw2Q0FBcUIsRUFBRSxDQUFDO1lBQzVDLE1BQU0sc0JBQXNCLEdBQUcsMkJBQTJCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFFLE1BQU0sd0JBQXdCLEdBQUcsMkJBQTJCLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRTlFLElBQUksc0JBQXNCLElBQUksd0JBQXdCLEVBQUUsQ0FBQztnQkFDeEQsT0FBTyxJQUFJLCtCQUErQixDQUFDLHNCQUFzQixFQUFFLHdCQUF3QixDQUFDLENBQUM7WUFDOUYsQ0FBQztZQUVELE9BQU8sc0JBQXNCLENBQUM7UUFDL0IsQ0FBQztRQUVELDBCQUEwQjtRQUMxQixNQUFNLGVBQWUsR0FBRyxLQUF5QixDQUFDO1FBQ2xELElBQUksT0FBTyxlQUFlLENBQUMsYUFBYSxLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQ3pELE9BQU8sZUFBZSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxtQ0FBbUM7UUFDbkMsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBT0QsTUFBTSxXQUFXO1FBQWpCO1lBQ0MsZ0JBQVcsR0FBWSxLQUFLLENBQUM7WUFDN0Isb0JBQWUsR0FBWSxLQUFLLENBQUM7WUFDakMsZUFBVSxHQUFZLEtBQUssQ0FBQztZQUM1QixtQkFBYyxHQUFZLEtBQUssQ0FBQztZQUNoQyxhQUFRLEdBQVksS0FBSyxDQUFDO1lBQzFCLFFBQUcsR0FBWSxLQUFLLENBQUM7WUFDckIsaUJBQVksR0FBWSxLQUFLLENBQUM7WUFDOUIsd0JBQW1CLEdBQVksS0FBSyxDQUFDO1lBQ3JDLGFBQVEsR0FBWSxLQUFLLENBQUM7UUF5QjNCLENBQUM7UUF2QkEsT0FBTyxDQUFDLEtBQWtCO1lBQ3pCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDO1lBQ3pELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDO1lBQ3JFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDO1lBQ3RELElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDO1lBQ2xFLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDO1lBQ2hELElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDO1lBQzVELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsbUJBQW1CLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDO1lBQ2pGLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQ2pELENBQUM7UUFFRCxVQUFVO1lBQ1QsT0FBTyxJQUFJLENBQUMsV0FBVzttQkFDbkIsSUFBSSxDQUFDLGVBQWU7bUJBQ3BCLElBQUksQ0FBQyxVQUFVO21CQUNmLElBQUksQ0FBQyxjQUFjO21CQUNuQixJQUFJLENBQUMsUUFBUTttQkFDYixJQUFJLENBQUMsR0FBRzttQkFDUixJQUFJLENBQUMsWUFBWTttQkFDakIsSUFBSSxDQUFDLG1CQUFtQjttQkFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUNuQixDQUFDO0tBQ0Q7SUFhRCxNQUFNLEtBQUs7UUFHVixJQUFJLGVBQWUsS0FBeUIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBRzNFLElBQUksVUFBVSxLQUF5QixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBR2pFLElBQUksUUFBUSxLQUF5QixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBRzdELElBQUksR0FBRyxLQUF5QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBR25ELElBQUksV0FBVyxLQUF5QixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBR25FLElBQUksWUFBWSxLQUEwQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBR3RFLElBQUksbUJBQW1CLEtBQTBCLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztRQUdwRixJQUFJLFFBQVEsS0FBeUIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUU3RCxNQUFNLENBQUMsTUFBa0I7WUFDeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztZQUVqQyxRQUFRLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDckIsS0FBSyxpQkFBaUI7b0JBQ3JCLElBQUksSUFBSSxDQUFDLGdCQUFnQixLQUFLLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQzt3QkFDdEQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUM7d0JBQy9DLE1BQU0sQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO29CQUMvQixDQUFDO29CQUNELE1BQU07Z0JBRVAsS0FBSyxhQUFhO29CQUNqQixJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUM5QyxJQUFJLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7d0JBQ3ZDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO29CQUMzQixDQUFDO29CQUNELE1BQU07Z0JBRVAsS0FBSyxZQUFZO29CQUNoQixJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO3dCQUM1QyxJQUFJLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7d0JBQ3JDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO29CQUMxQixDQUFDO29CQUNELE1BQU07Z0JBRVAsS0FBSyxVQUFVO29CQUNkLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ3hDLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQzt3QkFDakMsTUFBTSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7b0JBQ3hCLENBQUM7b0JBQ0QsTUFBTTtnQkFFUCxLQUFLLEtBQUs7b0JBQ1QsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQzt3QkFDOUIsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDO3dCQUN2QixNQUFNLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztvQkFDbkIsQ0FBQztvQkFDRCxNQUFNO2dCQUVQLEtBQUssY0FBYztvQkFDbEIsSUFBSSxJQUFJLENBQUMsYUFBYSxLQUFLLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQzt3QkFDaEQsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO3dCQUN6QyxNQUFNLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztvQkFDNUIsQ0FBQztvQkFDRCxNQUFNO2dCQUVQLEtBQUsscUJBQXFCO29CQUN6QixJQUFJLElBQUksQ0FBQyxvQkFBb0IsS0FBSyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsQ0FBQzt3QkFDOUQsSUFBSSxDQUFDLG9CQUFvQixHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQzt3QkFDdkQsTUFBTSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztvQkFDbkMsQ0FBQztvQkFDRCxNQUFNO2dCQUVQLEtBQUssVUFBVTtvQkFDZCxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUN4QyxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7d0JBQ2pDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO29CQUN4QixDQUFDO29CQUNELE1BQU07WUFDUixDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO0tBQ0Q7SUFFRCxJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFhLFNBQVEsc0JBQVU7UUFLcEMsWUFBbUMsb0JBQTREO1lBQzlGLEtBQUssRUFBRSxDQUFDO1lBRDJDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFIOUUsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFXLENBQUMsQ0FBQztZQUM5RCxnQkFBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBSzlDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBRXpCLE1BQU0sa0JBQWtCLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFVLHFCQUFxQixDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUNqSCxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBUSxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRW5HLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNyRSxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLENBQUM7b0JBQ25ELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSxxQkFBcUIsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7b0JBQ3RILG1CQUFRLENBQUMsZUFBZSxDQUFDLGtCQUFrQixDQUFDLENBQUM7b0JBRTdDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBQzVDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNELENBQUE7SUExQkssWUFBWTtRQUtKLFdBQUEscUNBQXFCLENBQUE7T0FMN0IsWUFBWSxDQTBCakI7SUFFRCxNQUFNLHVCQUF1QixHQUFHLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLGdDQUFnQyxDQUFDLENBQUM7SUFDbkcsTUFBTSxrQkFBa0IsR0FBRyxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQzFFLE1BQU0sc0JBQXNCLEdBQUcsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsMENBQTBDLENBQUMsQ0FBQztJQUMzRyxNQUFNLGlCQUFpQixHQUFHLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDLENBQUM7SUFDdkUsTUFBTSxRQUFRLEdBQUcsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDckQsTUFBTSxVQUFVLEdBQUcsSUFBQSxjQUFRLEVBQUMsaUNBQWlDLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFdkUsSUFBTSxZQUFZLEdBQWxCLE1BQU0sWUFBYSxTQUFRLHNCQUFVO1FBb0JwQyxZQUNrQixjQUFzQixFQUN2QixhQUE4QyxFQUMxQyxpQkFBc0QsRUFDeEQsZUFBa0QsRUFDbEQsZUFBa0QsRUFDakQsZ0JBQW9ELEVBQ2hELG9CQUE0RCxFQUM1RCxvQkFBNEQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFUUyxtQkFBYyxHQUFkLGNBQWMsQ0FBUTtZQUNOLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN6QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ3ZDLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNqQyxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUMvQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUExQm5FLHdCQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBMkIsQ0FBQyxDQUFDO1lBQ3ZGLCtCQUEwQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBMkIsQ0FBQyxDQUFDO1lBQzlGLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBMkIsQ0FBQyxDQUFDO1lBQ3RGLHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBMkIsQ0FBQyxDQUFDO1lBQ3BGLG9CQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUEyQixDQUFDLENBQUM7WUFDbkYsZUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBMkIsQ0FBQyxDQUFDO1lBQzlFLG9CQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUEyQixDQUFDLENBQUM7WUFDbkYsb0JBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQTJCLENBQUMsQ0FBQztZQUVuRix3QkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsd0NBQXdDLENBQUMsQ0FBQyxDQUFDO1lBQ3pILGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFFdEYsVUFBSyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7WUFDN0IsYUFBUSxHQUE0QixTQUFTLENBQUM7WUFFckMsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQzlELGtCQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQWN4RSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8saUJBQWlCO1lBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxSCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pILElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDLFlBQVksRUFBRSxFQUFFO2dCQUNwRixJQUFJLFlBQVksS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN6QyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO2dCQUN0RixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxnQkFBZ0I7WUFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQywyQkFBZ0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUFFLEVBQUUsMEJBQTBCLElBQUksQ0FBQyxjQUFjLEVBQUUsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDeEosQ0FBQztRQUVPLEtBQUssQ0FBQyxxQkFBcUI7WUFDbEMsTUFBTSx1QkFBdUIsR0FBRyxJQUFBLDZCQUFhLEVBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQzFGLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUM5QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsb0NBQW9DLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3RyxDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSxzQ0FBc0MsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNILENBQUM7WUFFRCxNQUFNLEtBQUssR0FBdUQ7Z0JBQ2pFLElBQUEsdUJBQWUsRUFBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsK0JBQWlCLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3hFLElBQUEsdUJBQWUsRUFBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsNkJBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdEUsSUFBQSx1QkFBZSxFQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxrQ0FBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDM0UsSUFBQSx1QkFBZSxFQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQywrQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDeEUsSUFBQSx1QkFBZSxFQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyx1Q0FBeUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDaEYsSUFBQSx1QkFBZSxFQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxxQ0FBdUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDOUUsSUFBQSx1QkFBZSxFQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyw4Q0FBNEIsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNuRixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQWdCLEVBQUUsRUFBRTtnQkFDMUIsT0FBTztvQkFDTixFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUU7b0JBQ1IsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLO29CQUNkLE1BQU0sRUFBRSxDQUFDLG1CQUFRLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSztvQkFDbEYsR0FBRyxFQUFFLEdBQUcsRUFBRTt3QkFDVCx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDaEMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUNULENBQUM7aUJBQ0QsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBRUgsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM1RixLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVuRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN2SSxPQUFPLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUN0QixDQUFDO1FBRU8seUJBQXlCLENBQUMsT0FBZ0I7WUFDakQsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNyQyxNQUFNLElBQUksR0FBRyxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO29CQUNoRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUM7d0JBQy9ELElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSxvQkFBb0IsQ0FBQzt3QkFDbEUsSUFBSTt3QkFDSixTQUFTLEVBQUUsSUFBSTt3QkFDZixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsNEJBQTRCLENBQUM7d0JBQ2pFLE9BQU8sRUFBRSxrQ0FBa0M7d0JBQzNDLElBQUksRUFBRSxXQUFXO3FCQUNqQixFQUFFLDRCQUE0QixvQ0FBNEIsS0FBSyxDQUFDLENBQUM7Z0JBQ25FLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2xDLENBQUM7UUFDRixDQUFDO1FBRU8sZ0NBQWdDLENBQUMsT0FBZ0I7WUFDeEQsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixJQUFJLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssRUFBRSxDQUFDO29CQUM1QyxNQUFNLElBQUksR0FBRyxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO29CQUN4RSxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUM7d0JBQ3RFLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxtQ0FBbUMsRUFBRSx1QkFBdUIsQ0FBQzt3QkFDNUUsSUFBSTt3QkFDSixTQUFTLEVBQUUsSUFBSTt3QkFDZixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsK0JBQStCLENBQUM7d0JBQ2hGLE9BQU8sRUFBRSxxQ0FBcUM7d0JBQzlDLElBQUksRUFBRSxXQUFXO3FCQUNqQixFQUFFLG1DQUFtQyxvQ0FBNEIsS0FBSyxDQUFDLENBQUM7Z0JBQzFFLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3pDLENBQUM7UUFDRixDQUFDO1FBRU8sc0JBQXNCLENBQUMsSUFBd0I7WUFDdEQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDOUIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFBLDZCQUFhLEVBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsQ0FBQztZQUM3RixJQUFJLFNBQVMsRUFBRSxNQUFNLEtBQUssaUJBQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUN0RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzlCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQW9CO2dCQUM5QixJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsa0JBQWtCLENBQUM7Z0JBQzdELElBQUk7Z0JBQ0osU0FBUyxFQUFFLElBQUk7Z0JBQ2YsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxtQkFBbUIsQ0FBQztnQkFDbEQsT0FBTyxFQUFFLDJCQUEyQjthQUNwQyxDQUFDO1lBRUYsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLHlCQUF5QixvQ0FBNEIsS0FBSyxDQUFDLENBQUM7UUFDOUcsQ0FBQztRQUVPLHdCQUF3QixDQUFDLElBQXdCO1lBQ3hELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2hDLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxTQUFTLEdBQUcsSUFBQSw2QkFBYSxFQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUM7WUFDN0YsSUFBSSxTQUFTLEVBQUUsTUFBTSxLQUFLLGlCQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDdEQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNoQyxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFvQjtnQkFDOUIsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLG9CQUFvQixDQUFDO2dCQUNqRSxJQUFJO2dCQUNKLFNBQVMsRUFBRSxJQUFJO2dCQUNmLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxvQkFBb0IsQ0FBQztnQkFDNUQsT0FBTyxFQUFFLDBCQUEwQixJQUFJLENBQUMsY0FBYyxFQUFFO2FBQ3hELENBQUM7WUFFRixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsMkJBQTJCLG9DQUE0QixLQUFLLENBQUMsQ0FBQztRQUNsSCxDQUFDO1FBRU8scUJBQXFCLENBQUMsSUFBd0I7WUFDckQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzdCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQW9CO2dCQUM5QixJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsaUJBQWlCLENBQUM7Z0JBQzNELElBQUk7Z0JBQ0osU0FBUyxFQUFFLElBQUk7Z0JBQ2YsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLGlCQUFpQixDQUFDO2dCQUN0RCxPQUFPLEVBQUUsd0NBQXdDO2FBQ2pELENBQUM7WUFFRixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSyxFQUFFLHdCQUF3QixvQ0FBNEIsS0FBSyxDQUFDLENBQUM7UUFDNUcsQ0FBQztRQUVPLGdCQUFnQixDQUFDLElBQXdCO1lBQ2hELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN4QixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFvQjtnQkFDOUIsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLG9CQUFvQixDQUFDO2dCQUN6RCxJQUFJO2dCQUNKLFNBQVMsRUFBRSxJQUFJO2dCQUNmLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsNkJBQTZCLENBQUM7Z0JBQzdELE9BQU8sRUFBRSxtQ0FBbUM7YUFDNUMsQ0FBQztZQUVGLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLG9DQUE0QixLQUFLLENBQUMsQ0FBQztRQUNsRyxDQUFDO1FBRU8sdUJBQXVCLENBQUMsSUFBd0I7WUFDdkQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzdCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQW9CO2dCQUM5QixJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsaUJBQWlCLENBQUM7Z0JBQ3ZELElBQUk7Z0JBQ0osU0FBUyxFQUFFLElBQUk7Z0JBQ2YsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLHNCQUFzQixDQUFDO2dCQUMvRCxPQUFPLEVBQUUsNENBQTRDO2FBQ3JELENBQUM7WUFFRixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSyxFQUFFLG9CQUFvQixvQ0FBNEIsS0FBSyxDQUFDLENBQUM7UUFDeEcsQ0FBQztRQUVPLHFCQUFxQixDQUFDLElBQXdCO1lBQ3JELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUM3QixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFvQjtnQkFDOUIsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLGtCQUFrQixDQUFDO2dCQUN4RCxJQUFJO2dCQUNKLFNBQVMsRUFBRSxJQUFJO2dCQUNmLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsa0JBQWtCLENBQUM7YUFDakQsQ0FBQztZQUVGLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxLQUFLLEVBQUUsb0JBQW9CLG9DQUE0QixHQUFHLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBRU8sYUFBYSxDQUFDLE9BQW1ELEVBQUUsS0FBc0IsRUFBRSxFQUFVLEVBQUUsU0FBNkIsRUFBRSxRQUFnQjtZQUM3SixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNwQixPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDaEYsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzdCLENBQUM7UUFDRixDQUFDO1FBRU8sV0FBVyxDQUFDLE1BQWtCO1lBQ3JDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxDQUFDLHlCQUF5QjtZQUNsQyxDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7Z0JBRXhCLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxHQUFHLElBQUEsNkNBQXVDLEVBQUMsSUFBQSxtQkFBYSxFQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtvQkFDeEgsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFFM0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztvQkFDL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7b0JBQzFCLElBQUksUUFBUSxFQUFFLENBQUM7d0JBQ2QsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNwQixDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLENBQUM7UUFDRixDQUFDO1FBRU8sV0FBVztZQUNsQixJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDMUQsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDeEQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN0RyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNwRCxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRU8saUJBQWlCLENBQUMsSUFBNEI7WUFDckQsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7b0JBQzdCLE9BQU8sSUFBQSxnQkFBTSxFQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBQzNJLENBQUM7Z0JBRUQsT0FBTyxJQUFBLGdCQUFNLEVBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzdHLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUM3QixPQUFPLElBQUEsZ0JBQU0sRUFBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUN4RixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxJQUFBLGdCQUFNLEVBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxRCxDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVPLGVBQWU7WUFDdEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUM7WUFDcEQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDO1lBQzdELE1BQU0sZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUEsNkJBQWEsRUFBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBRWxILG9CQUFvQjtZQUNwQixJQUFJLENBQUMsMkJBQTJCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDckQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzFELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUVsRCxzQ0FBc0M7WUFDdEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBRW5DLHdDQUF3QztZQUN4QyxJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFO29CQUN2RSxrREFBa0Q7b0JBQ2xELG1EQUFtRDtvQkFDbkQsdUJBQXVCO29CQUN2QixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3hCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1lBRUQsNkNBQTZDO1lBQzdDLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFFdEIsMENBQTBDO2dCQUMxQyxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLHdCQUF3QixDQUFDLENBQUMsS0FBZ0MsRUFBRSxFQUFFO29CQUM3RyxJQUFJLEtBQUssQ0FBQyxVQUFVLHVDQUE4QixFQUFFLENBQUM7d0JBQ3BELElBQUksQ0FBQywyQkFBMkIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO29CQUNwRCxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosc0NBQXNDO2dCQUN0QyxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLGFBQUssQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMseUJBQXlCLENBQUMsQ0FBQyxHQUFHLEVBQUU7b0JBQzNGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO29CQUN6QyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQ25ELENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUoscUNBQXFDO2dCQUNyQyxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLHdCQUF3QixDQUFDLEdBQUcsRUFBRTtvQkFDN0UsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUN0RCxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVKLG9DQUFvQztnQkFDcEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxhQUFLLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQzdGLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDbkMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO29CQUVsRCxNQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDcEQsSUFBSSxVQUFVLEVBQUUsQ0FBQzt3QkFDaEIsS0FBSyxNQUFNLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FBQzs0QkFDdkIsS0FBSyxNQUFNLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7Z0NBQ3BDLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLGFBQUssQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0NBQ2xGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO29DQUN6QyxNQUFNO2dDQUNQLENBQUM7NEJBQ0YsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFSiw0Q0FBNEM7Z0JBQzVDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsdUJBQXVCLENBQUMsR0FBRyxFQUFFO29CQUM1RSxJQUFJLENBQUMsbUJBQW1CLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDNUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFFRCx3QkFBd0I7aUJBQ25CLElBQUksZ0JBQWdCLFlBQVksdUNBQXdCLElBQUksZ0JBQWdCLFlBQVksMkNBQXdCLEVBQUUsQ0FBQztnQkFDdkgsTUFBTSxhQUFhLEdBQStCLEVBQUUsQ0FBQztnQkFDckQsSUFBSSxnQkFBZ0IsWUFBWSwyQ0FBd0IsRUFBRSxDQUFDO29CQUMxRCxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO29CQUN4RCxJQUFJLE9BQU8sWUFBWSx1Q0FBd0IsRUFBRSxDQUFDO3dCQUNqRCxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUM3QixDQUFDO29CQUVELE1BQU0sU0FBUyxHQUFHLGdCQUFnQixDQUFDLHNCQUFzQixFQUFFLENBQUM7b0JBQzVELElBQUksU0FBUyxZQUFZLHVDQUF3QixFQUFFLENBQUM7d0JBQ25ELGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQy9CLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLGFBQWEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDdEMsQ0FBQztnQkFFRCxLQUFLLE1BQU0sTUFBTSxJQUFJLGFBQWEsRUFBRSxDQUFDO29CQUNwQyxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUU7d0JBQzlELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO29CQUN6QyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUVKLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRTt3QkFDM0QsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNMLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLGdCQUFnQixDQUFDLFlBQXFDLEVBQUUsV0FBb0M7WUFDbkcsTUFBTSxJQUFJLEdBQWUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsQ0FBQztZQUV2RSxxQ0FBcUM7WUFDckMsSUFBSSxZQUFZLElBQUksV0FBVyxJQUFJLDJCQUEyQixDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7Z0JBQzdFLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDZixNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQzdDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLElBQUksU0FBUyxDQUFDO2dCQUNqRixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsQ0FBQztRQUVPLG1CQUFtQixDQUFDLFlBQXFDO1lBQ2hFLE1BQU0sTUFBTSxHQUFlLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLENBQUM7WUFFM0UsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDbEIsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNYLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDckMsTUFBTSxDQUFDLFdBQVcsR0FBRyxDQUNwQixTQUFTLENBQUMsWUFBWTt3QkFDckIsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDLFVBQVU7NEJBQzNDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUM7NEJBQzdELENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSw2QkFBNkIsRUFBRSxTQUFTLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUM7d0JBQ3hHLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsZ0NBQWdDLENBQUMsRUFBRSxFQUFFLGVBQWUsRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFDLENBQ2hILENBQUM7Z0JBQ0gsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxNQUErQjtZQUN2RCxNQUFNLE1BQU0sR0FBZSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxDQUFDO1lBRXJFLElBQUksTUFBTSxZQUFZLHVDQUF3QixJQUFJLE1BQU0sWUFBWSwyQ0FBd0IsRUFBRSxDQUFDO2dCQUM5RixNQUFNLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN4QyxDQUFDO1lBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBRU8sMkJBQTJCLENBQUMsWUFBcUM7WUFDeEUsTUFBTSxJQUFJLEdBQWUsRUFBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLENBQUM7WUFFckYsSUFBSSxZQUFZLEVBQUUsU0FBUyx1Q0FBOEIsRUFBRSxDQUFDO2dCQUMzRCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1lBQ2pDLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxZQUFxQztZQUM5RCxNQUFNLElBQUksR0FBMkIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV6RCxxQ0FBcUM7WUFDckMsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFFbEIsdUJBQXVCO2dCQUN2QixJQUFJLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUM7Z0JBRXJELDJCQUEyQjtnQkFDM0IsSUFBSSxDQUFDLGtCQUFrQixHQUFHLENBQUMsQ0FBQztnQkFDNUIsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMxQyxJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUNmLEtBQUssTUFBTSxTQUFTLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO3dCQUN6QyxJQUFJLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixLQUFLLFFBQVEsRUFBRSxDQUFDOzRCQUNqRCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO3dCQUM3QixDQUFDO3dCQUVELElBQUksQ0FBQyxrQkFBa0IsSUFBSSxTQUFTLENBQUMsd0JBQXdCLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQzFFLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCwyR0FBMkc7Z0JBQzNHLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ2xDLE1BQU0sY0FBYyxHQUFHLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFFbEQsTUFBTSxjQUFjLEdBQUcsSUFBSSxxQkFBUyxDQUNuQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixFQUMzQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixFQUN2QyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixFQUNyQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQ3BHLENBQUM7b0JBRUYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxjQUFjLENBQUM7Z0JBQ3JDLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5RixDQUFDO1FBRU8sV0FBVyxDQUFDLFlBQXFDO1lBQ3hELE1BQU0sSUFBSSxHQUFlLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUM7WUFFekQsSUFBSSxZQUFZLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxnQ0FBdUIsRUFBRSxDQUFDO2dCQUNwRSxNQUFNLGVBQWUsR0FBRyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2hELElBQUksZUFBZSxFQUFFLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxHQUFHLEdBQUcsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNyQyxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsQ0FBQztRQUVPLGdCQUFnQixDQUFDLE1BQStCLEVBQUUsWUFBcUM7WUFDOUYsSUFBSSxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQzVDLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxJQUFJLEdBQWUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQztZQUVuRSxrRUFBa0U7WUFDbEUsa0VBQWtFO1lBQ2xFLG9CQUFvQjtZQUNwQixJQUFJLE1BQU0sSUFBSSxZQUFZLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDeEMsTUFBTSxlQUFlLEdBQTRCLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLDJCQUEyQixDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNqSCxJQUFJLGVBQWUsRUFBRSxDQUFDO29CQUNyQixNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2xELE1BQU0sWUFBWSxHQUFHLE9BQU8sV0FBVyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsOEJBQW1CLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztvQkFDcEcsSUFBSSxZQUFZLEVBQUUsQ0FBQzt3QkFDbEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUMseUNBQXlDO29CQUNuRixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUMsQ0FBQyx1QkFBdUI7b0JBQ3JELENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFFTyx3QkFBd0IsQ0FBQyxRQUFhO1lBQzdDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztZQUM3RCxJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sY0FBYyxHQUFHLCtCQUFzQixDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSx5QkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUN2SSxJQUFJLGNBQWMsSUFBSSxJQUFBLG1CQUFPLEVBQUMsY0FBYyxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ3pELE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSw2QkFBYSxFQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLElBQUksU0FBUyxDQUFDO29CQUVuRixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsOERBQThEO2dCQUNqSSxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxvQkFBb0IsQ0FBQyxZQUFxQjtZQUNqRCxNQUFNLElBQUksR0FBZSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsWUFBWSxFQUFFLENBQUM7WUFDaEUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QixDQUFDO1FBRU8sY0FBYyxDQUFDLE9BQW9CO1lBQzFDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztZQUU3RCxPQUFPLENBQUMsQ0FBQyxnQkFBZ0IsSUFBSSxnQkFBZ0IsS0FBSyxPQUFPLENBQUM7UUFDM0QsQ0FBQztLQUNELENBQUE7SUFuakJLLFlBQVk7UUFzQmYsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFdBQUEsNEJBQWdCLENBQUE7UUFDaEIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUNBQXFCLENBQUE7T0E1QmxCLFlBQVksQ0FtakJqQjtJQUVNLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7aUJBRXZDLE9BQUUsR0FBRyxnQ0FBZ0MsQUFBbkMsQ0FBb0M7UUFFdEQsWUFDd0Isb0JBQTJDLEVBQzVDLGtCQUF3QyxFQUM5QyxhQUE2QjtZQUU3QyxLQUFLLEVBQUUsQ0FBQztZQUVSLHFCQUFxQjtZQUNyQixNQUFNLHdCQUF3QixHQUFHLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxJQUFJLHFDQUFpQixDQUN0RixDQUFDLDhCQUFjLEVBQUUsYUFBYSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQ2pFLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxTQUFTLENBQUMsd0JBQXdCLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxtQkFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFFakcsMEJBQTBCO1lBQzFCLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsOEJBQThCLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFO2dCQUNoSCxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDbkYsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7O0lBckJXLDREQUF3Qjt1Q0FBeEIsd0JBQXdCO1FBS2xDLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSwwQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLDhCQUFjLENBQUE7T0FQSix3QkFBd0IsQ0FzQnBDO0lBRUQsSUFBTSx3Q0FBd0MsR0FBOUMsTUFBTSx3Q0FBeUMsU0FBUSxzQkFBVTtRQU9oRSxZQUNvQixnQkFBb0QsRUFDdkQsYUFBOEMsRUFDdkMsb0JBQTREO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBSjRCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDdEMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3RCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFQNUUsV0FBTSxHQUE0QixTQUFTLENBQUM7WUFDNUMsWUFBTyxHQUFjLEVBQUUsQ0FBQztZQUN4QixrQkFBYSxHQUFtQixJQUFJLENBQUM7WUFTNUMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBMkIsQ0FBQyxDQUFDO1lBRS9GLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckssQ0FBQztRQUVELE1BQU0sQ0FBQyxNQUErQjtZQUNyQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUVyQixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDckIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFFTyxZQUFZO1lBQ25CLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7WUFDMUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDdEMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO2dCQUNoRSxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDeEIsTUFBTSxJQUFJLEdBQUcsSUFBQSxvQkFBVSxFQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZELE1BQU0sSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7b0JBQzNELElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ3hDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxFQUFFLDBCQUEwQixrQ0FBMEIsQ0FBQztvQkFDM00sQ0FBQztvQkFDRCxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDMUgsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDckMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8saUJBQWlCLENBQUMsY0FBOEIsRUFBRSxhQUE2QjtZQUN0RixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3BCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDckIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTyxxQkFBVyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsS0FBSyxxQkFBVyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNuRixDQUFDO1FBRU8sT0FBTyxDQUFDLE1BQWU7WUFDOUIsUUFBUSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3pCLEtBQUssd0JBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLFVBQVUsQ0FBQztnQkFDN0MsS0FBSyx3QkFBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sWUFBWSxDQUFDO2dCQUNqRCxLQUFLLHdCQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxTQUFTLENBQUM7WUFDNUMsQ0FBQztZQUVELE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVPLFNBQVM7WUFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVUsOEJBQThCLENBQUMsRUFBRSxDQUFDO2dCQUNsRixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzNDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsYUFBSyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztRQUN0RixDQUFDO1FBRU8sZUFBZSxDQUFDLGdCQUFnQztZQUN2RCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDckMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxLQUFLLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLG1CQUFPLEVBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2pFLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFFTyxhQUFhO1lBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2xCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7b0JBQ3RDLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBRztvQkFDbkIsVUFBVSxFQUFFLHdCQUFjLENBQUMsS0FBSyxHQUFHLHdCQUFjLENBQUMsT0FBTyxHQUFHLHdCQUFjLENBQUMsSUFBSTtpQkFDL0UsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN2QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDbkIsQ0FBQztZQUVELElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNyQixDQUFDO1FBRU8sYUFBYSxDQUFDLENBQVUsRUFBRSxDQUFVO1lBQzNDLElBQUksR0FBRyxHQUFHLElBQUEsaUJBQU8sRUFBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNoRSxJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDZixHQUFHLEdBQUcsd0JBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdEQsQ0FBQztZQUVELElBQUksR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNmLEdBQUcsR0FBRyxhQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFFRCxPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUM7S0FDRCxDQUFBO0lBNUlLLHdDQUF3QztRQVEzQyxXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsd0JBQWMsQ0FBQTtRQUNkLFdBQUEscUNBQXFCLENBQUE7T0FWbEIsd0NBQXdDLENBNEk3QztJQUVNLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTZCLFNBQVEsZ0JBQU07O2lCQUV2QyxPQUFFLEdBQUcseUNBQXlDLEFBQTVDLENBQTZDO1FBRS9ELFlBQ1MsYUFBcUIsRUFDSyxjQUErQixFQUN2QyxjQUF3QztZQUVsRSxLQUFLLENBQUMsOEJBQTRCLENBQUMsRUFBRSxFQUFFLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLDRDQUE0QyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFKaEksa0JBQWEsR0FBYixhQUFhLENBQVE7WUFDSyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFLakUsSUFBSSxDQUFDLE9BQU8sR0FBRyxjQUFjLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDM0MsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsdURBQXVELEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3ZILENBQUM7O0lBaEJXLG9FQUE0QjsyQ0FBNUIsNEJBQTRCO1FBTXRDLFdBQUEsMEJBQWUsQ0FBQTtRQUNmLFdBQUEsOENBQXdCLENBQUE7T0FQZCw0QkFBNEIsQ0FpQnhDO0lBRUQsTUFBYSxvQkFBcUIsU0FBUSxpQkFBTztpQkFFaEMsT0FBRSxHQUFHLDRDQUE0QyxDQUFDO1FBRWxFO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxvQkFBb0IsQ0FBQyxFQUFFO2dCQUMzQixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsWUFBWSxFQUFFLHNCQUFzQixDQUFDO2dCQUN0RCxFQUFFLEVBQUUsSUFBSTtnQkFDUixVQUFVLEVBQUU7b0JBQ1gsTUFBTSw2Q0FBbUM7b0JBQ3pDLE9BQU8sRUFBRSxJQUFBLG1CQUFRLEVBQUMsaURBQTZCLHdCQUFlO2lCQUM5RDtnQkFDRCxZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUM7YUFDekQsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDNUMsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7WUFDM0QsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQkFBZ0IsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sd0JBQXdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywwREFBeUIsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNEJBQWdCLENBQUMsQ0FBQztZQUN2RCxNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsaUNBQW1CLENBQUMsQ0FBQztZQUM3RCxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztZQUNqRSxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztZQUNqRSxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNkJBQWlCLENBQUMsQ0FBQztZQUV6RCxNQUFNLHVCQUF1QixHQUFHLElBQUEsNkJBQWEsRUFBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNyRixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsb0NBQW9DLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdEcsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFNBQVMsR0FBRyx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyRCxNQUFNLFFBQVEsR0FBRywrQkFBc0IsQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxFQUFFLGlCQUFpQixFQUFFLHlCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFFcEksbUJBQW1CO1lBQ25CLElBQUksbUJBQXVDLENBQUM7WUFDNUMsSUFBSSxpQkFBcUMsQ0FBQztZQUMxQyxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLGlCQUFpQixHQUFHLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDOUMsbUJBQW1CLEdBQUcsZUFBZSxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLFNBQVMsQ0FBQztZQUN2RixDQUFDO1lBRUQsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQ3BDLElBQUksUUFBUSxFQUFFLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFFBQVEsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLHFCQUFxQixFQUFFLENBQUM7Z0JBQzdHLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxDQUFDLDhEQUE4RDtZQUMzRixDQUFDO1lBRUQsZ0NBQWdDO1lBQ2hDLE1BQU0sU0FBUyxHQUFHLGVBQWUsQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDO1lBQ3JFLE1BQU0sS0FBSyxHQUFxQixTQUFTO2lCQUN2QyxHQUFHLENBQUMsQ0FBQyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFO2dCQUNyQyxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDdkUsSUFBSSxXQUFtQixDQUFDO2dCQUN4QixJQUFJLG1CQUFtQixLQUFLLFlBQVksRUFBRSxDQUFDO29CQUMxQyxXQUFXLEdBQUcsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsNkJBQTZCLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQzFGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxXQUFXLEdBQUcsSUFBQSxjQUFRLEVBQUMsK0JBQStCLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUM5RSxDQUFDO2dCQUVELE9BQU87b0JBQ04sS0FBSyxFQUFFLFlBQVk7b0JBQ25CLElBQUksRUFBRSxVQUFVO29CQUNoQixXQUFXLEVBQUUsSUFBQSw0Q0FBMkIsRUFBQyxVQUFVLENBQUM7b0JBQ3BELFdBQVc7aUJBQ1gsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBRUosS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLHdCQUF3QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRWxHLHlDQUF5QztZQUN6QyxJQUFJLDZCQUF5RCxDQUFDO1lBQzlELElBQUkseUJBQXFELENBQUM7WUFDMUQsSUFBSSxhQUFpQyxDQUFDO1lBQ3RDLElBQUksa0JBQWtCLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sR0FBRyxHQUFHLElBQUEsbUJBQU8sRUFBQyxRQUFRLENBQUMsSUFBSSxJQUFBLG9CQUFRLEVBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRXBELGFBQWEsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZGLElBQUksYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUMzQixLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUM5QixDQUFDO2dCQUVELHlCQUF5QixHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLDRDQUE0QyxFQUFFLG1CQUFtQixDQUFDLEVBQUUsQ0FBQztnQkFDNUksS0FBSyxDQUFDLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2dCQUN6Qyw2QkFBNkIsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSx5Q0FBeUMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNoSSxLQUFLLENBQUMsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUM7WUFDOUMsQ0FBQztZQUVELHlCQUF5QjtZQUN6QixNQUFNLGtCQUFrQixHQUFtQjtnQkFDMUMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxhQUFhLENBQUM7YUFDNUMsQ0FBQztZQUNGLEtBQUssQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUVsQyxNQUFNLElBQUksR0FBRyxNQUFNLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLHNCQUFzQixDQUFDLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM5SSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLElBQUksS0FBSyxhQUFhLEVBQUUsQ0FBQztnQkFDNUIsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNwQixPQUFPO1lBQ1IsQ0FBQztZQUVELHlFQUF5RTtZQUN6RSxJQUFJLElBQUksS0FBSyw2QkFBNkIsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLFFBQVEsRUFBRSxDQUFDO29CQUNkLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLEVBQUUsZUFBZSxFQUFFLGlCQUFpQixFQUFFLG9CQUFvQixDQUFDLENBQUM7Z0JBQ25HLENBQUM7Z0JBQ0QsT0FBTztZQUNSLENBQUM7WUFFRCwwREFBMEQ7WUFDMUQsSUFBSSxJQUFJLEtBQUsseUJBQXlCLEVBQUUsQ0FBQztnQkFDeEMsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLGlCQUFpQixJQUFJLElBQUksR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2hJLE9BQU87WUFDUixDQUFDO1lBRUQsb0NBQW9DO1lBQ3BDLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUM7WUFDaEQsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDbEIsTUFBTSxlQUFlLEdBQUcsMkJBQTJCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2xFLElBQUksZUFBZSxFQUFFLENBQUM7b0JBRXJCLGdCQUFnQjtvQkFDaEIsSUFBSSxpQkFBaUQsQ0FBQztvQkFDdEQsSUFBSSxnQkFBb0MsQ0FBQztvQkFDekMsSUFBSSxJQUFJLEtBQUssa0JBQWtCLEVBQUUsQ0FBQzt3QkFDakMsSUFBSSxTQUFTLEVBQUUsQ0FBQzs0QkFDZixNQUFNLFFBQVEsR0FBRywrQkFBc0IsQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUseUJBQWdCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQzs0QkFDdEgsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQ0FDZCxvREFBb0Q7Z0NBQ3BELElBQUksVUFBVSxHQUF1QixlQUFlLENBQUMsb0NBQW9DLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxTQUFTLENBQUM7Z0NBQzlJLElBQUksQ0FBQyxVQUFVLElBQUksVUFBVSxLQUFLLFNBQVMsRUFBRSxDQUFDO29DQUM3QyxnQkFBZ0IsR0FBRyxNQUFNLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQ0FDM0UsVUFBVSxHQUFHLGdCQUFnQixDQUFDO2dDQUMvQixDQUFDO2dDQUNELElBQUksVUFBVSxFQUFFLENBQUM7b0NBQ2hCLGlCQUFpQixHQUFHLGVBQWUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7Z0NBQzVELENBQUM7NEJBQ0YsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUMzRSxpQkFBaUIsR0FBRyxlQUFlLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUUzRCxJQUFJLFFBQVEsRUFBRSxDQUFDOzRCQUNkLDBDQUEwQzs0QkFDMUMsd0JBQXdCLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO2dDQUMzRSxNQUFNLGdCQUFnQixHQUFHLGVBQWUsQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksU0FBUyxDQUFDO2dDQUM5RixJQUFJLGtCQUFrQixLQUFLLGlCQUFpQixJQUFJLGlCQUFpQixLQUFLLGdCQUFnQixFQUFFLENBQUM7b0NBQ3hGLDJIQUEySDtvQ0FDM0gseUhBQXlIO29DQUN6SCxpS0FBaUs7b0NBQ2pLLE1BQU0sZUFBZSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSxzREFBc0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztvQ0FDL0ksZ0JBQWdCLENBQUMsVUFBVSxDQUFrRyx3RUFBdUMsRUFBRTt3Q0FDckssaUJBQWlCLEVBQUUsbUJBQW1CLElBQUksU0FBUzt3Q0FDbkQsY0FBYyxFQUFFLElBQUksQ0FBQyxLQUFLO3dDQUMxQixTQUFTLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQzt3Q0FDMUMsZUFBZTtxQ0FDZixDQUFDLENBQUM7Z0NBQ0osQ0FBQzs0QkFDRixDQUFDLENBQUMsQ0FBQzt3QkFDSixDQUFDO29CQUNGLENBQUM7b0JBRUQsa0JBQWtCO29CQUNsQixJQUFJLE9BQU8saUJBQWlCLEtBQUssV0FBVyxFQUFFLENBQUM7d0JBQzlDLGVBQWUsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUVyRixJQUFJLFFBQVEsRUFBRSxNQUFNLEtBQUssaUJBQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQzs0QkF3QjNDLE1BQU0sZUFBZSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSxzREFBc0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQzs0QkFDL0ksZ0JBQWdCLENBQUMsVUFBVSxDQUE4RSw2QkFBNkIsRUFBRTtnQ0FDdkksRUFBRSxFQUFFLGlCQUFpQixDQUFDLFVBQVU7Z0NBQ2hDLElBQUksRUFBRSxpQkFBaUIsSUFBSSxNQUFNO2dDQUNqQyxlQUFlOzZCQUNmLENBQUMsQ0FBQzt3QkFDSixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNqQyxDQUFDO1FBQ0YsQ0FBQztRQUVPLHdCQUF3QixDQUFDLFFBQWEsRUFBRSxlQUFpQyxFQUFFLGlCQUFxQyxFQUFFLG9CQUEyQztZQUNwSyxNQUFNLFNBQVMsR0FBRyxJQUFBLG1CQUFPLEVBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxJQUFJLEdBQUcsSUFBQSxvQkFBUSxFQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sa0JBQWtCLEdBQUcsZUFBZSxDQUFDLG9DQUFvQyxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUVoRyxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztZQUNyRSxNQUFNLEtBQUssR0FBcUIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUU7Z0JBQzlFLE9BQU87b0JBQ04sRUFBRSxFQUFFLFVBQVU7b0JBQ2QsS0FBSyxFQUFFLFlBQVk7b0JBQ25CLFdBQVcsRUFBRSxJQUFBLDRDQUEyQixFQUFDLFVBQVUsQ0FBQztvQkFDcEQsV0FBVyxFQUFFLENBQUMsVUFBVSxLQUFLLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7aUJBQ3BILENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUVILFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDckIsTUFBTSxRQUFRLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLDhDQUE4QyxFQUFFLFNBQVMsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzlLLElBQUksUUFBUSxFQUFFLENBQUM7b0JBQ2QsTUFBTSxzQkFBc0IsR0FBRyxvQkFBb0IsQ0FBQyxPQUFPLENBQUssaUNBQXlCLENBQUMsQ0FBQztvQkFFM0YsSUFBSSxjQUFzQixDQUFDO29CQUMzQixJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7d0JBQ2xDLGNBQWMsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDLENBQUMsbUVBQW1FO29CQUN0RyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsY0FBYyxHQUFHLElBQUksQ0FBQyxDQUFDLDJEQUEyRDtvQkFDbkYsQ0FBQztvQkFFRCxvR0FBb0c7b0JBQ3BHLElBQUksTUFBTSxtQ0FBMkIsQ0FBQztvQkFDdEMsSUFBSSxzQkFBc0IsQ0FBQyxjQUFjLElBQUksQ0FBQyxDQUFFLHNCQUFzQixDQUFDLGNBQXNCLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQzt3QkFDL0csTUFBTSx3Q0FBZ0MsQ0FBQztvQkFDeEMsQ0FBQztvQkFFRCwwR0FBMEc7b0JBQzFHLE1BQU0sbUJBQW1CLEdBQUcsSUFBQSxtQkFBUyxFQUFDLENBQUMsTUFBTSwwQ0FBa0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3BMLG1CQUFtQixDQUFDLGNBQWMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBRWxELG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxpQ0FBeUIsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDMUYsQ0FBQztZQUNGLENBQUMsRUFBRSxFQUFFLENBQUMsb0VBQW9FLENBQUMsQ0FBQztRQUM3RSxDQUFDOztJQTFQRixvREEyUEM7SUFNRCxNQUFhLGVBQWdCLFNBQVEsaUJBQU87UUFFM0M7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLG1DQUFtQztnQkFDdkMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLGlCQUFpQixFQUFFLDZCQUE2QixDQUFDO2dCQUNsRSxFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQzVDLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1lBRTNELE1BQU0sdUJBQXVCLEdBQUcsSUFBQSw2QkFBYSxFQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3JGLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUM5QixNQUFNLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN0RyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksYUFBYSxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxNQUFNLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLHNDQUFzQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BILE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxTQUFTLEdBQUcsdUJBQXVCLENBQUMsUUFBUSxFQUFFLENBQUM7WUFFbkQsTUFBTSxVQUFVLEdBQXNCO2dCQUNyQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyw4QkFBc0IsRUFBRTtnQkFDOUMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEdBQUcsZ0NBQXdCLEVBQUU7YUFDbEQsQ0FBQztZQUVGLE1BQU0sYUFBYSxHQUFHLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU3RCxNQUFNLEdBQUcsR0FBRyxNQUFNLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLDZCQUE2QixDQUFDLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdkssSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDVCxNQUFNLGdCQUFnQixHQUFHLElBQUEsNkJBQWEsRUFBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsQ0FBQztnQkFDOUUsSUFBSSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQztvQkFDL0UsU0FBUyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUN4QyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDN0IsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzNCLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUM5QixDQUFDO1lBQ0YsQ0FBQztZQUVELHVCQUF1QixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2pDLENBQUM7S0FDRDtJQS9DRCwwQ0ErQ0M7SUFFRCxNQUFhLG9CQUFxQixTQUFRLGlCQUFPO1FBRWhEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSx3Q0FBd0M7Z0JBQzVDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxnQkFBZ0IsRUFBRSxzQkFBc0IsQ0FBQztnQkFDMUQsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUNuQyxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztZQUNuRCxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztZQUMzRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG9CQUFZLENBQUMsQ0FBQztZQUMvQyxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDRCQUFnQixDQUFDLENBQUM7WUFDdkQsTUFBTSxnQ0FBZ0MsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDZEQUFpQyxDQUFDLENBQUM7WUFFekYsTUFBTSx1QkFBdUIsR0FBRyxJQUFBLDZCQUFhLEVBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDckYsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQzlCLE1BQU0saUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RHLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxnQkFBZ0IsR0FBRyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7WUFDeEQsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0saUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RHLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxlQUFlLEdBQTRCLDJCQUEyQixDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsNkJBQTZCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbkcsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLG9CQUFvQixHQUFtQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxvQkFBb0IsQ0FBQyxFQUFFLENBQUM7WUFDM0csTUFBTSxzQkFBc0IsR0FBbUIsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxDQUFDO1lBRWpILElBQUksQ0FBQyxtQkFBUSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQztnQkFDbEMsTUFBTSxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQztnQkFDbkQsSUFBSSxxQkFBcUIsS0FBSyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDMUQsb0JBQW9CLENBQUMsTUFBTSxHQUFHLHFCQUFxQixDQUFDO2dCQUNyRCxDQUFDO2dCQUVELE1BQU0sdUJBQXVCLEdBQUcsc0JBQXNCLENBQUM7Z0JBQ3ZELElBQUksdUJBQXVCLEtBQUssc0JBQXNCLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQzlELHNCQUFzQixDQUFDLE1BQU0sR0FBRyx1QkFBdUIsQ0FBQztnQkFDekQsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLE1BQWtDLENBQUM7WUFDdkMsSUFBSSxlQUFlLFlBQVksaURBQXVCLEVBQUUsQ0FBQztnQkFDeEQsTUFBTSxHQUFHLG9CQUFvQixDQUFDO1lBQy9CLENBQUM7aUJBQU0sSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxHQUFHLHNCQUFzQixDQUFDO1lBQ2pDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxzQkFBc0IsRUFBRSxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN0SyxDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxJQUFBLGVBQU8sRUFBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGlFQUFpRTtZQUVwRixNQUFNLFFBQVEsR0FBRywrQkFBc0IsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUseUJBQWdCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNoSSxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUMvRixPQUFPLENBQUMsa0dBQWtHO1lBQzNHLENBQUM7WUFFRCxJQUFJLGVBQWUsR0FBdUIsU0FBUyxDQUFDO1lBQ3BELElBQUksV0FBVyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUN2QyxNQUFNLE9BQU8sR0FBRyxNQUFNLGVBQWUsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDeEYsZUFBZSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7WUFDcEMsQ0FBQztZQUVELE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxNQUFNLEtBQUssc0JBQXNCLENBQUMsQ0FBQztZQUVqRSxNQUFNLGtCQUFrQixHQUFHLGdDQUFnQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLElBQUksU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFFOUcsSUFBSSxnQkFBb0MsQ0FBQztZQUN6QyxJQUFJLGVBQW1DLENBQUM7WUFFeEMsZ0NBQWdDO1lBQ2hDLE1BQU0sS0FBSyxHQUFxQixNQUFNLENBQUMsSUFBSSxDQUFDLDhCQUFtQixDQUFDO2lCQUM5RCxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQ2hCLElBQUksRUFBRSxLQUFLLGtCQUFrQixFQUFFLENBQUM7b0JBQy9CLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQztxQkFBTSxJQUFJLEVBQUUsS0FBSyxrQkFBa0IsRUFBRSxDQUFDO29CQUN0QyxPQUFPLENBQUMsQ0FBQztnQkFDVixDQUFDO2dCQUVELE9BQU8sOEJBQW1CLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLDhCQUFtQixDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUN0RSxDQUFDLENBQUM7aUJBQ0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNYLElBQUksQ0FBQyxLQUFLLGVBQWUsSUFBSSxlQUFlLEtBQUssa0JBQWtCLEVBQUUsQ0FBQztvQkFDckUsT0FBTyxLQUFLLENBQUMsQ0FBQyx3RkFBd0Y7Z0JBQ3ZHLENBQUM7Z0JBRUQsT0FBTyxDQUFDLG9CQUFvQixJQUFJLENBQUMsOEJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsMEVBQTBFO1lBQy9JLENBQUMsQ0FBQztpQkFDRCxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ25CLElBQUksR0FBRyxLQUFLLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO29CQUMzQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7Z0JBQzFCLENBQUM7cUJBQU0sSUFBSSw4QkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEtBQUssZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7b0JBQzdFLGVBQWUsR0FBRyxLQUFLLENBQUM7Z0JBQ3pCLENBQUM7Z0JBRUQsT0FBTyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLDhCQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDakYsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFzQixDQUFDO1lBRWhELHlGQUF5RjtZQUN6RixJQUFJLGVBQWUsSUFBSSxrQkFBa0IsS0FBSyxlQUFlLElBQUksOEJBQW1CLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztnQkFDdkcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO2dCQUNyQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsOEJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxzQkFBc0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNqSyxDQUFDO1lBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUNwRCxXQUFXLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLHFDQUFxQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLG1DQUFtQyxDQUFDO2dCQUNuTCxVQUFVLEVBQUUsS0FBSyxDQUFDLE9BQU8sZ0JBQWdCLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxlQUFlLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3ZJLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDckMsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLHFCQUFxQixHQUFHLDJCQUEyQixDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoRyxJQUFJLE9BQU8sUUFBUSxDQUFDLEVBQUUsS0FBSyxXQUFXLElBQUkscUJBQXFCLEVBQUUsQ0FBQztnQkFDakUsTUFBTSxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLDZCQUFxQixDQUFDLDRCQUFvQixDQUFDLENBQUMsQ0FBQyxtQkFBbUI7WUFDNUksQ0FBQztZQUVELHVCQUF1QixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2pDLENBQUM7S0FDRDtJQTNJRCxvREEySUMifQ==