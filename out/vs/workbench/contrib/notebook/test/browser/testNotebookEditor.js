/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/mime", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/timeTravelScheduler", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageService", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/editor/common/services/resolverService", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/platform/clipboard/common/clipboardService", "vs/platform/clipboard/test/common/testClipboardService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/layout/browser/layoutService", "vs/platform/list/browser/listService", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/editor/editorModel", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/services/notebookCellStatusBarServiceImpl", "vs/workbench/contrib/notebook/browser/view/notebookCellList", "vs/workbench/contrib/notebook/browser/viewModel/eventDispatcher", "vs/workbench/contrib/notebook/browser/viewModel/notebookViewModelImpl", "vs/workbench/contrib/notebook/browser/viewModel/viewContext", "vs/workbench/contrib/notebook/common/model/notebookCellTextModel", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/browser/notebookOptions", "vs/workbench/services/textmodelResolver/common/textModelResolverService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/editor/common/config/fontInfo", "vs/editor/common/config/editorOptions", "vs/editor/browser/services/codeEditorService", "vs/base/browser/window", "vs/editor/test/browser/editorTestServices", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/inlineChat/common/inlineChatServiceImpl"], function (require, exports, DOM, buffer_1, errors_1, event_1, lifecycle_1, map_1, mime_1, uri_1, mock_1, timeTravelScheduler_1, language_1, languageConfigurationRegistry_1, languageService_1, model_1, modelService_1, resolverService_1, testLanguageConfigurationService_1, clipboardService_1, testClipboardService_1, configuration_1, testConfigurationService_1, contextKeyService_1, contextkey_1, instantiationServiceMock_1, keybinding_1, mockKeybindingService_1, layoutService_1, listService_1, log_1, storage_1, themeService_1, testThemeService_1, undoRedo_1, undoRedoService_1, workspaceTrust_1, editorModel_1, notebookBrowser_1, notebookCellStatusBarServiceImpl_1, notebookCellList_1, eventDispatcher_1, notebookViewModelImpl_1, viewContext_1, notebookCellTextModel_1, notebookTextModel_1, notebookCellStatusBarService_1, notebookCommon_1, notebookExecutionStateService_1, notebookOptions_1, textModelResolverService_1, workbenchTestServices_1, workbenchTestServices_2, fontInfo_1, editorOptions_1, codeEditorService_1, window_1, editorTestServices_1, inlineChat_1, inlineChatServiceImpl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorTestModel = exports.TestCell = void 0;
    exports.setupInstantiationService = setupInstantiationService;
    exports.createTestNotebookEditor = createTestNotebookEditor;
    exports.withTestNotebookDiffModel = withTestNotebookDiffModel;
    exports.withTestNotebook = withTestNotebook;
    exports.createNotebookCellList = createNotebookCellList;
    exports.valueBytesFromString = valueBytesFromString;
    class TestCell extends notebookCellTextModel_1.NotebookCellTextModel {
        constructor(viewType, handle, source, language, cellKind, outputs, languageService) {
            super(notebookCommon_1.CellUri.generate(uri_1.URI.parse('test:///fake/notebook'), handle), handle, source, language, mime_1.Mimes.text, cellKind, outputs, undefined, undefined, undefined, { transientCellMetadata: {}, transientDocumentMetadata: {}, transientOutputs: false, cellContentMetadata: {} }, languageService);
            this.viewType = viewType;
            this.source = source;
        }
    }
    exports.TestCell = TestCell;
    class NotebookEditorTestModel extends editorModel_1.EditorModel {
        get viewType() {
            return this._notebook.viewType;
        }
        get resource() {
            return this._notebook.uri;
        }
        get notebook() {
            return this._notebook;
        }
        constructor(_notebook) {
            super();
            this._notebook = _notebook;
            this._dirty = false;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this.onDidChangeOrphaned = event_1.Event.None;
            this.onDidChangeReadonly = event_1.Event.None;
            this.onDidRevertUntitled = event_1.Event.None;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            if (_notebook && _notebook.onDidChangeContent) {
                this._register(_notebook.onDidChangeContent(() => {
                    this._dirty = true;
                    this._onDidChangeDirty.fire();
                    this._onDidChangeContent.fire();
                }));
            }
        }
        isReadonly() {
            return false;
        }
        isOrphaned() {
            return false;
        }
        hasAssociatedFilePath() {
            return false;
        }
        isDirty() {
            return this._dirty;
        }
        get hasErrorState() {
            return false;
        }
        isModified() {
            return this._dirty;
        }
        getNotebook() {
            return this._notebook;
        }
        async load() {
            return this;
        }
        async save() {
            if (this._notebook) {
                this._dirty = false;
                this._onDidChangeDirty.fire();
                this._onDidSave.fire({});
                // todo, flush all states
                return true;
            }
            return false;
        }
        saveAs() {
            throw new errors_1.NotImplementedError();
        }
        revert() {
            throw new errors_1.NotImplementedError();
        }
    }
    exports.NotebookEditorTestModel = NotebookEditorTestModel;
    function setupInstantiationService(disposables) {
        const instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService());
        const testThemeService = new testThemeService_1.TestThemeService();
        instantiationService.stub(language_1.ILanguageService, disposables.add(new languageService_1.LanguageService()));
        instantiationService.stub(undoRedo_1.IUndoRedoService, instantiationService.createInstance(undoRedoService_1.UndoRedoService));
        instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
        instantiationService.stub(themeService_1.IThemeService, testThemeService);
        instantiationService.stub(languageConfigurationRegistry_1.ILanguageConfigurationService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
        instantiationService.stub(model_1.IModelService, disposables.add(instantiationService.createInstance(modelService_1.ModelService)));
        instantiationService.stub(resolverService_1.ITextModelService, disposables.add(instantiationService.createInstance(textModelResolverService_1.TextModelResolverService)));
        instantiationService.stub(contextkey_1.IContextKeyService, disposables.add(instantiationService.createInstance(contextKeyService_1.ContextKeyService)));
        instantiationService.stub(listService_1.IListService, disposables.add(instantiationService.createInstance(listService_1.ListService)));
        instantiationService.stub(layoutService_1.ILayoutService, new workbenchTestServices_1.TestLayoutService());
        instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
        instantiationService.stub(clipboardService_1.IClipboardService, testClipboardService_1.TestClipboardService);
        instantiationService.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_2.TestStorageService()));
        instantiationService.stub(workspaceTrust_1.IWorkspaceTrustRequestService, disposables.add(new workbenchTestServices_2.TestWorkspaceTrustRequestService(true)));
        instantiationService.stub(notebookExecutionStateService_1.INotebookExecutionStateService, new TestNotebookExecutionStateService());
        instantiationService.stub(keybinding_1.IKeybindingService, new mockKeybindingService_1.MockKeybindingService());
        instantiationService.stub(notebookCellStatusBarService_1.INotebookCellStatusBarService, disposables.add(new notebookCellStatusBarServiceImpl_1.NotebookCellStatusBarService()));
        instantiationService.stub(codeEditorService_1.ICodeEditorService, disposables.add(new editorTestServices_1.TestCodeEditorService(testThemeService)));
        instantiationService.stub(inlineChat_1.IInlineChatService, instantiationService.createInstance(inlineChatServiceImpl_1.InlineChatServiceImpl));
        return instantiationService;
    }
    function _createTestNotebookEditor(instantiationService, disposables, cells) {
        const viewType = 'notebook';
        const notebook = disposables.add(instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, viewType, uri_1.URI.parse('test'), cells.map((cell) => {
            return {
                source: cell[0],
                mime: undefined,
                language: cell[1],
                cellKind: cell[2],
                outputs: cell[3] ?? [],
                metadata: cell[4]
            };
        }), {}, { transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {}, transientOutputs: false }));
        const model = disposables.add(new NotebookEditorTestModel(notebook));
        const notebookOptions = disposables.add(new notebookOptions_1.NotebookOptions(window_1.mainWindow, instantiationService.get(configuration_1.IConfigurationService), instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService), instantiationService.get(codeEditorService_1.ICodeEditorService), false));
        const viewContext = new viewContext_1.ViewContext(notebookOptions, disposables.add(new eventDispatcher_1.NotebookEventDispatcher()), () => ({}));
        const viewModel = disposables.add(instantiationService.createInstance(notebookViewModelImpl_1.NotebookViewModel, viewType, model.notebook, viewContext, null, { isReadOnly: false }));
        const cellList = disposables.add(createNotebookCellList(instantiationService, disposables, viewContext));
        cellList.attachViewModel(viewModel);
        const listViewInfoAccessor = disposables.add(new notebookCellList_1.ListViewInfoAccessor(cellList));
        let visibleRanges = [{ start: 0, end: 100 }];
        const notebookEditor = new class extends (0, mock_1.mock)() {
            constructor() {
                super(...arguments);
                this.notebookOptions = notebookOptions;
                this.onDidChangeModel = new event_1.Emitter().event;
                this.onDidChangeCellState = new event_1.Emitter().event;
                this.textModel = viewModel.notebookDocument;
                this.onDidChangeVisibleRanges = event_1.Event.None;
            }
            // eslint-disable-next-line local/code-must-use-super-dispose
            dispose() {
                viewModel.dispose();
            }
            getViewModel() {
                return viewModel;
            }
            hasModel() {
                return !!viewModel;
            }
            getLength() { return viewModel.length; }
            getFocus() { return viewModel.getFocus(); }
            getSelections() { return viewModel.getSelections(); }
            setFocus(focus) {
                viewModel.updateSelectionsState({
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: focus,
                    selections: viewModel.getSelections()
                });
            }
            setSelections(selections) {
                viewModel.updateSelectionsState({
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: viewModel.getFocus(),
                    selections: selections
                });
            }
            getViewIndexByModelIndex(index) { return listViewInfoAccessor.getViewIndex(viewModel.viewCells[index]); }
            getCellRangeFromViewRange(startIndex, endIndex) { return listViewInfoAccessor.getCellRangeFromViewRange(startIndex, endIndex); }
            revealCellRangeInView() { }
            setHiddenAreas(_ranges) {
                return cellList.setHiddenAreas(_ranges, true);
            }
            getActiveCell() {
                const elements = cellList.getFocusedElements();
                if (elements && elements.length) {
                    return elements[0];
                }
                return undefined;
            }
            hasOutputTextSelection() {
                return false;
            }
            changeModelDecorations() { return null; }
            focusElement() { }
            setCellEditorSelection() { }
            async revealRangeInCenterIfOutsideViewportAsync() { }
            async layoutNotebookCell() { }
            async removeInset() { }
            async focusNotebookCell(cell, focusItem) {
                cell.focusMode = focusItem === 'editor' ? notebookBrowser_1.CellFocusMode.Editor
                    : focusItem === 'output' ? notebookBrowser_1.CellFocusMode.Output
                        : notebookBrowser_1.CellFocusMode.Container;
            }
            cellAt(index) { return viewModel.cellAt(index); }
            getCellIndex(cell) { return viewModel.getCellIndex(cell); }
            getCellsInRange(range) { return viewModel.getCellsInRange(range); }
            getCellByHandle(handle) { return viewModel.getCellByHandle(handle); }
            getNextVisibleCellIndex(index) { return viewModel.getNextVisibleCellIndex(index); }
            getControl() { return this; }
            get onDidChangeSelection() { return viewModel.onDidChangeSelection; }
            get onDidChangeOptions() { return viewModel.onDidChangeOptions; }
            get onDidChangeViewCells() { return viewModel.onDidChangeViewCells; }
            async find(query, options) {
                const findMatches = viewModel.find(query, options).filter(match => match.length > 0);
                return findMatches;
            }
            deltaCellDecorations() { return []; }
            get visibleRanges() {
                return visibleRanges;
            }
            set visibleRanges(_ranges) {
                visibleRanges = _ranges;
            }
            getId() { return ''; }
            setScrollTop(scrollTop) {
                cellList.scrollTop = scrollTop;
            }
            get scrollTop() {
                return cellList.scrollTop;
            }
            getLayoutInfo() {
                return {
                    width: 0,
                    height: 0,
                    scrollHeight: cellList.getScrollHeight(),
                    fontInfo: new fontInfo_1.FontInfo({
                        pixelRatio: 1,
                        fontFamily: 'mockFont',
                        fontWeight: 'normal',
                        fontSize: 14,
                        fontFeatureSettings: editorOptions_1.EditorFontLigatures.OFF,
                        fontVariationSettings: editorOptions_1.EditorFontVariations.OFF,
                        lineHeight: 19,
                        letterSpacing: 1.5,
                        isMonospace: true,
                        typicalHalfwidthCharacterWidth: 10,
                        typicalFullwidthCharacterWidth: 20,
                        canUseHalfwidthRightwardsArrow: true,
                        spaceWidth: 10,
                        middotWidth: 10,
                        wsmiddotWidth: 10,
                        maxDigitWidth: 10,
                    }, true),
                    stickyHeight: 0
                };
            }
        };
        return { editor: notebookEditor, viewModel };
    }
    function createTestNotebookEditor(instantiationService, disposables, cells) {
        return _createTestNotebookEditor(instantiationService, disposables, cells);
    }
    async function withTestNotebookDiffModel(originalCells, modifiedCells, callback) {
        const disposables = new lifecycle_1.DisposableStore();
        const instantiationService = setupInstantiationService(disposables);
        const originalNotebook = createTestNotebookEditor(instantiationService, disposables, originalCells);
        const modifiedNotebook = createTestNotebookEditor(instantiationService, disposables, modifiedCells);
        const originalResource = new class extends (0, mock_1.mock)() {
            get notebook() {
                return originalNotebook.viewModel.notebookDocument;
            }
        };
        const modifiedResource = new class extends (0, mock_1.mock)() {
            get notebook() {
                return modifiedNotebook.viewModel.notebookDocument;
            }
        };
        const model = new class extends (0, mock_1.mock)() {
            get original() {
                return originalResource;
            }
            get modified() {
                return modifiedResource;
            }
        };
        const res = await callback(model, disposables, instantiationService);
        if (res instanceof Promise) {
            res.finally(() => {
                originalNotebook.editor.dispose();
                originalNotebook.viewModel.dispose();
                modifiedNotebook.editor.dispose();
                modifiedNotebook.viewModel.dispose();
                disposables.dispose();
            });
        }
        else {
            originalNotebook.editor.dispose();
            originalNotebook.viewModel.dispose();
            modifiedNotebook.editor.dispose();
            modifiedNotebook.viewModel.dispose();
            disposables.dispose();
        }
        return res;
    }
    async function withTestNotebook(cells, callback, accessor) {
        const disposables = new lifecycle_1.DisposableStore();
        const instantiationService = accessor ?? setupInstantiationService(disposables);
        const notebookEditor = _createTestNotebookEditor(instantiationService, disposables, cells);
        return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const res = await callback(notebookEditor.editor, notebookEditor.viewModel, disposables, instantiationService);
            if (res instanceof Promise) {
                res.finally(() => {
                    notebookEditor.editor.dispose();
                    notebookEditor.viewModel.dispose();
                    notebookEditor.editor.textModel.dispose();
                    disposables.dispose();
                });
            }
            else {
                notebookEditor.editor.dispose();
                notebookEditor.viewModel.dispose();
                notebookEditor.editor.textModel.dispose();
                disposables.dispose();
            }
            return res;
        });
    }
    function createNotebookCellList(instantiationService, disposables, viewContext) {
        const delegate = {
            getHeight(element) { return element.getHeight(17); },
            getTemplateId() { return 'template'; }
        };
        const renderer = {
            templateId: 'template',
            renderTemplate() { return {}; },
            renderElement() { },
            disposeTemplate() { }
        };
        const notebookOptions = !!viewContext ? viewContext.notebookOptions
            : disposables.add(new notebookOptions_1.NotebookOptions(window_1.mainWindow, instantiationService.get(configuration_1.IConfigurationService), instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService), instantiationService.get(codeEditorService_1.ICodeEditorService), false));
        const cellList = disposables.add(instantiationService.createInstance(notebookCellList_1.NotebookCellList, 'NotebookCellList', DOM.$('container'), notebookOptions, delegate, [renderer], instantiationService.get(contextkey_1.IContextKeyService), {
            supportDynamicHeights: true,
            multipleSelectionSupport: true,
        }));
        return cellList;
    }
    function valueBytesFromString(value) {
        return buffer_1.VSBuffer.fromString(value);
    }
    class TestCellExecution {
        constructor(notebook, cellHandle, onComplete) {
            this.notebook = notebook;
            this.cellHandle = cellHandle;
            this.onComplete = onComplete;
            this.state = notebookCommon_1.NotebookCellExecutionState.Unconfirmed;
            this.didPause = false;
            this.isPaused = false;
        }
        confirm() {
        }
        update(updates) {
        }
        complete(complete) {
            this.onComplete();
        }
    }
    class TestNotebookExecutionStateService {
        constructor() {
            this._executions = new map_1.ResourceMap();
            this.onDidChangeExecution = new event_1.Emitter().event;
            this.onDidChangeLastRunFailState = new event_1.Emitter().event;
        }
        forceCancelNotebookExecutions(notebookUri) {
        }
        getCellExecutionsForNotebook(notebook) {
            return [];
        }
        getCellExecution(cellUri) {
            return this._executions.get(cellUri);
        }
        createCellExecution(notebook, cellHandle) {
            const onComplete = () => this._executions.delete(notebookCommon_1.CellUri.generate(notebook, cellHandle));
            const exe = new TestCellExecution(notebook, cellHandle, onComplete);
            this._executions.set(notebookCommon_1.CellUri.generate(notebook, cellHandle), exe);
            return exe;
        }
        getCellExecutionsByHandleForNotebook(notebook) {
            return;
        }
        getLastFailedCellForNotebook(notebook) {
            return;
        }
        getExecution(notebook) {
            return;
        }
        createExecution(notebook) {
            throw new Error('Method not implemented.');
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdE5vdGVib29rRWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay90ZXN0L2Jyb3dzZXIvdGVzdE5vdGVib29rRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlMaEcsOERBdUJDO0lBc0pELDREQUVDO0lBRUQsOERBMkNDO0lBTUQsNENBc0JDO0lBRUQsd0RBOEJDO0lBRUQsb0RBRUM7SUExWUQsTUFBYSxRQUFTLFNBQVEsNkNBQXFCO1FBQ2xELFlBQ1EsUUFBZ0IsRUFDdkIsTUFBYyxFQUNQLE1BQWMsRUFDckIsUUFBZ0IsRUFDaEIsUUFBa0IsRUFDbEIsT0FBcUIsRUFDckIsZUFBaUM7WUFFakMsS0FBSyxDQUFDLHdCQUFPLENBQUMsUUFBUSxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUMsRUFBRSxNQUFNLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxZQUFLLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxxQkFBcUIsRUFBRSxFQUFFLEVBQUUseUJBQXlCLEVBQUUsRUFBRSxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxFQUFFLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQztZQVJ4UixhQUFRLEdBQVIsUUFBUSxDQUFRO1lBRWhCLFdBQU0sR0FBTixNQUFNLENBQVE7UUFPdEIsQ0FBQztLQUNEO0lBWkQsNEJBWUM7SUFFRCxNQUFhLHVCQUF3QixTQUFRLHlCQUFXO1FBaUJ2RCxJQUFJLFFBQVE7WUFDWCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1FBQ2hDLENBQUM7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