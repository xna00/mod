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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/numbers", "vs/base/common/stopwatch", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/services/editorWorker", "vs/editor/common/services/model", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatWordCounter", "vs/workbench/contrib/inlineChat/browser/inlineChatSavingService", "vs/workbench/contrib/inlineChat/browser/inlineChatSession", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionService", "vs/workbench/contrib/inlineChat/browser/inlineChatWidget", "vs/workbench/contrib/inlineChat/browser/utils", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatContext", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, dom_1, async_1, cancellation_1, event_1, htmlContent_1, lifecycle_1, map_1, network_1, numbers_1, stopwatch_1, types_1, uri_1, uuid_1, codeEditorWidget_1, selection_1, languages_1, language_1, editorWorker_1, model_1, nls_1, commands_1, contextkey_1, instantiation_1, progress_1, storage_1, chat_1, chatAgents_1, chatWordCounter_1, inlineChatSavingService_1, inlineChatSession_1, inlineChatSessionService_1, inlineChatWidget_1, utils_1, inlineChat_1, cellOperations_1, notebookChatContext_1, notebookEditorExtensions_1, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    var NotebookChatController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditStrategy = exports.NotebookChatController = void 0;
    class NotebookChatWidget extends lifecycle_1.Disposable {
        set afterModelPosition(afterModelPosition) {
            this.notebookViewZone.afterModelPosition = afterModelPosition;
        }
        get afterModelPosition() {
            return this.notebookViewZone.afterModelPosition;
        }
        set heightInPx(heightInPx) {
            this.notebookViewZone.heightInPx = heightInPx;
        }
        get heightInPx() {
            return this.notebookViewZone.heightInPx;
        }
        get editingCell() {
            return this._editingCell;
        }
        constructor(_notebookEditor, id, notebookViewZone, domNode, widgetContainer, inlineChatWidget, parentEditor, _languageService) {
            super();
            this._notebookEditor = _notebookEditor;
            this.id = id;
            this.notebookViewZone = notebookViewZone;
            this.domNode = domNode;
            this.widgetContainer = widgetContainer;
            this.inlineChatWidget = inlineChatWidget;
            this.parentEditor = parentEditor;
            this._languageService = _languageService;
            this._editingCell = null;
            this._register(inlineChatWidget.onDidChangeHeight(() => {
                this.heightInPx = inlineChatWidget.contentHeight;
                this._notebookEditor.changeViewZones(accessor => {
                    accessor.layoutZone(id);
                });
                this._layoutWidget(inlineChatWidget, widgetContainer);
            }));
            this._layoutWidget(inlineChatWidget, widgetContainer);
        }
        restoreEditingCell(initEditingCell) {
            this._editingCell = initEditingCell;
            const decorationIds = this._notebookEditor.deltaCellDecorations([], [{
                    handle: this._editingCell.handle,
                    options: { className: 'nb-chatGenerationHighlight', outputClassName: 'nb-chatGenerationHighlight' }
                }]);
            this._register((0, lifecycle_1.toDisposable)(() => {
                this._notebookEditor.deltaCellDecorations(decorationIds, []);
            }));
        }
        hasFocus() {
            return this.inlineChatWidget.hasFocus();
        }
        focus() {
            this.updateNotebookEditorFocusNSelections();
            this.inlineChatWidget.focus();
        }
        updateNotebookEditorFocusNSelections() {
            this._notebookEditor.focusContainer(true);
            this._notebookEditor.setFocus({ start: this.afterModelPosition, end: this.afterModelPosition });
            this._notebookEditor.setSelections([{
                    start: this.afterModelPosition,
                    end: this.afterModelPosition
                }]);
        }
        getEditingCell() {
            return this._editingCell;
        }
        async getOrCreateEditingCell() {
            if (this._editingCell) {
                const codeEditor = this._notebookEditor.codeEditors.find(ce => ce[0] === this._editingCell)?.[1];
                if (codeEditor?.hasModel()) {
                    return {
                        cell: this._editingCell,
                        editor: codeEditor
                    };
                }
                else {
                    return undefined;
                }
            }
            if (!this._notebookEditor.hasModel()) {
                return undefined;
            }
            const widgetHasFocus = this.inlineChatWidget.hasFocus();
            this._editingCell = (0, cellOperations_1.insertCell)(this._languageService, this._notebookEditor, this.afterModelPosition, notebookCommon_1.CellKind.Code, 'above');
            if (!this._editingCell) {
                return undefined;
            }
            await this._notebookEditor.revealFirstLineIfOutsideViewport(this._editingCell);
            // update decoration
            const decorationIds = this._notebookEditor.deltaCellDecorations([], [{
                    handle: this._editingCell.handle,
                    options: { className: 'nb-chatGenerationHighlight', outputClassName: 'nb-chatGenerationHighlight' }
                }]);
            this._register((0, lifecycle_1.toDisposable)(() => {
                this._notebookEditor.deltaCellDecorations(decorationIds, []);
            }));
            if (widgetHasFocus) {
                this.focus();
            }
            const codeEditor = this._notebookEditor.codeEditors.find(ce => ce[0] === this._editingCell)?.[1];
            if (codeEditor?.hasModel()) {
                return {
                    cell: this._editingCell,
                    editor: codeEditor
                };
            }
            return undefined;
        }
        async discardChange() {
            if (this._notebookEditor.hasModel() && this._editingCell) {
                // remove the cell from the notebook
                (0, cellOperations_1.runDeleteAction)(this._notebookEditor, this._editingCell);
            }
        }
        _layoutWidget(inlineChatWidget, widgetContainer) {
            const layoutConfiguration = this._notebookEditor.notebookOptions.getLayoutConfiguration();
            const rightMargin = layoutConfiguration.cellRightMargin;
            const leftMargin = this._notebookEditor.notebookOptions.getCellEditorContainerLeftMargin();
            const maxWidth = 640;
            const width = Math.min(maxWidth, this._notebookEditor.getLayoutInfo().width - leftMargin - rightMargin);
            inlineChatWidget.layout(new dom_1.Dimension(width, this.heightInPx));
            inlineChatWidget.domNode.style.width = `${width}px`;
            widgetContainer.style.left = `${leftMargin}px`;
        }
        dispose() {
            this._notebookEditor.changeViewZones(accessor => {
                accessor.removeZone(this.id);
            });
            this.domNode.remove();
            super.dispose();
        }
    }
    class NotebookCellTextModelLikeId {
        static str(k) {
            return `${k.viewType}/${k.uri.toString()}`;
        }
        static obj(s) {
            const idx = s.indexOf('/');
            return {
                viewType: s.substring(0, idx),
                uri: uri_1.URI.parse(s.substring(idx + 1))
            };
        }
    }
    let NotebookChatController = class NotebookChatController extends lifecycle_1.Disposable {
        static { NotebookChatController_1 = this; }
        static { this.id = 'workbench.notebook.chatController'; }
        static { this.counter = 0; }
        static get(editor) {
            return editor.getContribution(NotebookChatController_1.id);
        }
        // History
        static { this._storageKey = 'inline-chat-history'; }
        static { this._promptHistory = []; }
        constructor(_notebookEditor, _instantiationService, _inlineChatSessionService, _contextKeyService, _commandService, _editorWorkerService, _inlineChatSavingService, _modelService, _languageService, _executionStateService, _storageService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._instantiationService = _instantiationService;
            this._inlineChatSessionService = _inlineChatSessionService;
            this._contextKeyService = _contextKeyService;
            this._commandService = _commandService;
            this._editorWorkerService = _editorWorkerService;
            this._inlineChatSavingService = _inlineChatSavingService;
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._executionStateService = _executionStateService;
            this._storageService = _storageService;
            this._historyOffset = -1;
            this._historyCandidate = '';
            this._promptCache = new map_1.LRUCache(1000, 0.7);
            this._onDidChangePromptCache = this._register(new event_1.Emitter());
            this.onDidChangePromptCache = this._onDidChangePromptCache.event;
            this._userEditingDisposables = this._register(new lifecycle_1.DisposableStore());
            this._widgetDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._ctxHasActiveRequest = notebookChatContext_1.CTX_NOTEBOOK_CHAT_HAS_ACTIVE_REQUEST.bindTo(this._contextKeyService);
            this._ctxCellWidgetFocused = notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED.bindTo(this._contextKeyService);
            this._ctxLastResponseType = inlineChat_1.CTX_INLINE_CHAT_LAST_RESPONSE_TYPE.bindTo(this._contextKeyService);
            this._ctxUserDidEdit = notebookChatContext_1.CTX_NOTEBOOK_CHAT_USER_DID_EDIT.bindTo(this._contextKeyService);
            this._ctxOuterFocusPosition = notebookChatContext_1.CTX_NOTEBOOK_CHAT_OUTER_FOCUS_POSITION.bindTo(this._contextKeyService);
            this._registerFocusTracker();
            NotebookChatController_1._promptHistory = JSON.parse(this._storageService.get(NotebookChatController_1._storageKey, 0 /* StorageScope.PROFILE */, '[]'));
            this._historyUpdate = (prompt) => {
                const idx = NotebookChatController_1._promptHistory.indexOf(prompt);
                if (idx >= 0) {
                    NotebookChatController_1._promptHistory.splice(idx, 1);
                }
                NotebookChatController_1._promptHistory.unshift(prompt);
                this._historyOffset = -1;
                this._historyCandidate = '';
                this._storageService.store(NotebookChatController_1._storageKey, JSON.stringify(NotebookChatController_1._promptHistory), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            };
        }
        _registerFocusTracker() {
            this._register(this._notebookEditor.onDidChangeFocus(() => {
                if (!this._widget) {
                    this._ctxOuterFocusPosition.set('');
                    return;
                }
                const widgetIndex = this._widget.afterModelPosition;
                const focus = this._notebookEditor.getFocus().start;
                if (focus + 1 === widgetIndex) {
                    this._ctxOuterFocusPosition.set('above');
                }
                else if (focus === widgetIndex) {
                    this._ctxOuterFocusPosition.set('below');
                }
                else {
                    this._ctxOuterFocusPosition.set('');
                }
            }));
        }
        run(index, input, autoSend) {
            if (this._widget) {
                if (this._widget.afterModelPosition !== index) {
                    const window = (0, dom_1.getWindow)(this._widget.domNode);
                    this._disposeWidget();
                    (0, dom_1.scheduleAtNextAnimationFrame)(window, () => {
                        this._createWidget(index, input, autoSend, undefined);
                    });
                }
                return;
            }
            this._createWidget(index, input, autoSend, undefined);
            // TODO: reveal widget to the center if it's out of the viewport
        }
        restore(editingCell, input) {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const index = this._notebookEditor.textModel.cells.indexOf(editingCell.model);
            if (index < 0) {
                return;
            }
            if (this._widget) {
                if (this._widget.afterModelPosition !== index) {
                    this._disposeWidget();
                    const window = (0, dom_1.getWindow)(this._widget.domNode);
                    (0, dom_1.scheduleAtNextAnimationFrame)(window, () => {
                        this._createWidget(index, input, false, editingCell);
                    });
                }
                return;
            }
            this._createWidget(index, input, false, editingCell);
        }
        _disposeWidget() {
            this._widget?.dispose();
            this._widget = undefined;
            this._widgetDisposableStore.clear();
            this._historyOffset = -1;
            this._historyCandidate = '';
        }
        _createWidget(index, input, autoSend, initEditingCell) {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            // Clear the widget if it's already there
            this._widgetDisposableStore.clear();
            const viewZoneContainer = document.createElement('div');
            viewZoneContainer.classList.add('monaco-editor');
            const widgetContainer = document.createElement('div');
            widgetContainer.style.position = 'absolute';
            viewZoneContainer.appendChild(widgetContainer);
            this._focusTracker = this._widgetDisposableStore.add((0, dom_1.trackFocus)(viewZoneContainer));
            this._widgetDisposableStore.add(this._focusTracker.onDidFocus(() => {
                this._updateNotebookEditorFocusNSelections();
            }));
            const fakeParentEditorElement = document.createElement('div');
            const fakeParentEditor = this._widgetDisposableStore.add(this._instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, fakeParentEditorElement, {}, { isSimpleWidget: true }));
            const inputBoxFragment = `notebook-chat-input-${NotebookChatController_1.counter++}`;
            const notebookUri = this._notebookEditor.textModel.uri;
            const inputUri = notebookUri.with({ scheme: network_1.Schemas.untitled, fragment: inputBoxFragment });
            const result = this._modelService.createModel('', null, inputUri, false);
            fakeParentEditor.setModel(result);
            const inlineChatWidget = this._widgetDisposableStore.add(this._instantiationService.createInstance(inlineChatWidget_1.InlineChatWidget, chatAgents_1.ChatAgentLocation.Notebook, {
                telemetrySource: 'notebook-generate-cell',
                inputMenuId: notebookChatContext_1.MENU_CELL_CHAT_INPUT,
                widgetMenuId: notebookChatContext_1.MENU_CELL_CHAT_WIDGET,
                statusMenuId: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_STATUS,
                feedbackMenuId: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_FEEDBACK
            }));
            inlineChatWidget.placeholder = (0, nls_1.localize)('default.placeholder', "Ask a question");
            inlineChatWidget.updateInfo((0, nls_1.localize)('welcome.1', "AI-generated code may be incorrect"));
            widgetContainer.appendChild(inlineChatWidget.domNode);
            this._widgetDisposableStore.add(inlineChatWidget.onDidChangeInput(() => {
                this._warmupRequestCts?.dispose(true);
                this._warmupRequestCts = undefined;
            }));
            this._notebookEditor.changeViewZones(accessor => {
                const notebookViewZone = {
                    afterModelPosition: index,
                    heightInPx: 80,
                    domNode: viewZoneContainer
                };
                const id = accessor.addZone(notebookViewZone);
                this._scrollWidgetIntoView(index);
                this._widget = new NotebookChatWidget(this._notebookEditor, id, notebookViewZone, viewZoneContainer, widgetContainer, inlineChatWidget, fakeParentEditor, this._languageService);
                if (initEditingCell) {
                    this._widget.restoreEditingCell(initEditingCell);
                    this._updateUserEditingState();
                }
                this._ctxCellWidgetFocused.set(true);
                (0, async_1.disposableTimeout)(() => {
                    this._focusWidget();
                }, 0, this._store);
                this._sessionCtor = (0, async_1.createCancelablePromise)(async (token) => {
                    if (fakeParentEditor.hasModel()) {
                        await this._startSession(fakeParentEditor, token);
                        this._warmupRequestCts = new cancellation_1.CancellationTokenSource();
                        this._startInitialFolowups(fakeParentEditor, this._warmupRequestCts.token);
                        if (this._widget) {
                            this._widget.inlineChatWidget.placeholder = this._activeSession?.session.placeholder ?? (0, nls_1.localize)('default.placeholder', "Ask a question");
                            this._widget.inlineChatWidget.updateInfo(this._activeSession?.session.message ?? (0, nls_1.localize)('welcome.1', "AI-generated code may be incorrect"));
                            this._widget.inlineChatWidget.updateSlashCommands(this._activeSession?.session.slashCommands ?? []);
                            this._focusWidget();
                        }
                        if (this._widget && input) {
                            this._widget.inlineChatWidget.value = input;
                            if (autoSend) {
                                this.acceptInput();
                            }
                        }
                    }
                });
            });
        }
        _scrollWidgetIntoView(index) {
            if (index === 0 || this._notebookEditor.getLength() === 0) {
                // the cell is at the beginning of the notebook
                this._notebookEditor.revealOffsetInCenterIfOutsideViewport(0);
            }
            else {
                // the cell is at the end of the notebook
                const previousCell = this._notebookEditor.cellAt(Math.min(index - 1, this._notebookEditor.getLength() - 1));
                if (previousCell) {
                    const cellTop = this._notebookEditor.getAbsoluteTopOfElement(previousCell);
                    const cellHeight = this._notebookEditor.getHeightOfElement(previousCell);
                    this._notebookEditor.revealOffsetInCenterIfOutsideViewport(cellTop + cellHeight + 48 /** center of the dialog */);
                }
            }
        }
        _focusWidget() {
            if (!this._widget) {
                return;
            }
            this._updateNotebookEditorFocusNSelections();
            this._widget.focus();
        }
        _updateNotebookEditorFocusNSelections() {
            if (!this._widget) {
                return;
            }
            this._widget.updateNotebookEditorFocusNSelections();
        }
        async acceptInput() {
            (0, types_1.assertType)(this._widget);
            await this._sessionCtor;
            (0, types_1.assertType)(this._activeSession);
            this._warmupRequestCts?.dispose(true);
            this._warmupRequestCts = undefined;
            this._activeSession.addInput(new inlineChatSession_1.SessionPrompt(this._widget.inlineChatWidget.value, 0, true));
            (0, types_1.assertType)(this._activeSession.lastInput);
            const value = this._activeSession.lastInput.value;
            this._historyUpdate(value);
            const editor = this._widget.parentEditor;
            const model = editor.getModel();
            if (!editor.hasModel() || !model) {
                return;
            }
            if (this._widget.editingCell && this._widget.editingCell.textBuffer.getLength() > 0) {
                // it already contains some text, clear it
                const ref = await this._widget.editingCell.resolveTextModel();
                ref.setValue('');
            }
            const editingCellIndex = this._widget.editingCell ? this._notebookEditor.getCellIndex(this._widget.editingCell) : undefined;
            if (editingCellIndex !== undefined) {
                this._notebookEditor.setSelections([{
                        start: editingCellIndex,
                        end: editingCellIndex + 1
                    }]);
            }
            else {
                // Update selection to the widget index
                this._notebookEditor.setSelections([{
                        start: this._widget.afterModelPosition,
                        end: this._widget.afterModelPosition
                    }]);
            }
            this._ctxHasActiveRequest.set(true);
            this._widget.inlineChatWidget.updateSlashCommands(this._activeSession.session.slashCommands ?? []);
            this._widget?.inlineChatWidget.updateProgress(true);
            const request = {
                requestId: (0, uuid_1.generateUuid)(),
                prompt: value,
                attempt: this._activeSession.lastInput.attempt,
                selection: { selectionStartLineNumber: 1, selectionStartColumn: 1, positionLineNumber: 1, positionColumn: 1 },
                wholeRange: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
                live: true,
                previewDocument: model.uri,
                withIntentDetection: true, // TODO: don't hard code but allow in corresponding UI to run without intent detection?
            };
            //TODO: update progress in a newly inserted cell below the widget instead of the fake editor
            this._activeRequestCts?.cancel();
            this._activeRequestCts = new cancellation_1.CancellationTokenSource();
            const progressEdits = [];
            const progressiveEditsQueue = new async_1.Queue();
            const progressiveEditsClock = stopwatch_1.StopWatch.create();
            const progressiveEditsAvgDuration = new numbers_1.MovingAverage();
            const progressiveEditsCts = new cancellation_1.CancellationTokenSource(this._activeRequestCts.token);
            let progressiveChatResponse;
            const progress = new progress_1.AsyncProgress(async (data) => {
                // console.log('received chunk', data, request);
                if (this._activeRequestCts?.token.isCancellationRequested) {
                    return;
                }
                if (data.message) {
                    this._widget?.inlineChatWidget.updateToolbar(false);
                    this._widget?.inlineChatWidget.updateInfo(data.message);
                }
                if (data.edits?.length) {
                    if (!request.live) {
                        throw new Error('Progress in NOT supported in non-live mode');
                    }
                    progressEdits.push(data.edits);
                    progressiveEditsAvgDuration.update(progressiveEditsClock.elapsed());
                    progressiveEditsClock.reset();
                    progressiveEditsQueue.queue(async () => {
                        // making changes goes into a queue because otherwise the async-progress time will
                        // influence the time it takes to receive the changes and progressive typing will
                        // become infinitely fast
                        await this._makeChanges(data.edits, data.editsShouldBeInstant
                            ? undefined
                            : { duration: progressiveEditsAvgDuration.value, token: progressiveEditsCts.token });
                    });
                }
                if (data.markdownFragment) {
                    if (!progressiveChatResponse) {
                        const message = {
                            message: new htmlContent_1.MarkdownString(data.markdownFragment, { supportThemeIcons: true, supportHtml: true, isTrusted: false }),
                            providerId: this._activeSession.provider.label,
                            requestId: request.requestId,
                        };
                        progressiveChatResponse = this._widget?.inlineChatWidget.updateChatMessage(message, true);
                    }
                    else {
                        progressiveChatResponse.appendContent(data.markdownFragment);
                    }
                }
            });
            const task = this._activeSession.provider.provideResponse(this._activeSession.session, request, progress, this._activeRequestCts.token);
            let response;
            try {
                this._widget?.inlineChatWidget.updateChatMessage(undefined);
                this._widget?.inlineChatWidget.updateFollowUps(undefined);
                this._widget?.inlineChatWidget.updateProgress(true);
                this._widget?.inlineChatWidget.updateInfo(!this._activeSession.lastExchange ? chat_1.GeneratingPhrase + '\u2026' : '');
                this._ctxHasActiveRequest.set(true);
                const reply = await (0, async_1.raceCancellationError)(Promise.resolve(task), this._activeRequestCts.token);
                if (progressiveEditsQueue.size > 0) {
                    // we must wait for all edits that came in via progress to complete
                    await event_1.Event.toPromise(progressiveEditsQueue.onDrained);
                }
                await progress.drain();
                if (!reply) {
                    response = new inlineChatSession_1.EmptyResponse();
                }
                else {
                    const markdownContents = new htmlContent_1.MarkdownString('', { supportThemeIcons: true, supportHtml: true, isTrusted: false });
                    const replyResponse = response = this._instantiationService.createInstance(inlineChatSession_1.ReplyResponse, reply, markdownContents, this._activeSession.textModelN.uri, this._activeSession.textModelN.getAlternativeVersionId(), progressEdits, request.requestId);
                    for (let i = progressEdits.length; i < replyResponse.allLocalEdits.length; i++) {
                        await this._makeChanges(replyResponse.allLocalEdits[i], undefined);
                    }
                    if (this._activeSession?.provider.provideFollowups) {
                        const followupCts = new cancellation_1.CancellationTokenSource();
                        const followups = await this._activeSession.provider.provideFollowups(this._activeSession.session, replyResponse.raw, followupCts.token);
                        if (followups && this._widget) {
                            const widget = this._widget;
                            widget.inlineChatWidget.updateFollowUps(followups, async (followup) => {
                                if (followup.kind === 'reply') {
                                    widget.inlineChatWidget.value = followup.message;
                                    this.acceptInput();
                                }
                                else {
                                    await this.acceptSession();
                                    this._commandService.executeCommand(followup.commandId, ...(followup.args ?? []));
                                }
                            });
                        }
                    }
                    this._userEditingDisposables.clear();
                    // monitor user edits
                    const editingCell = this._widget.getEditingCell();
                    if (editingCell) {
                        this._userEditingDisposables.add(editingCell.model.onDidChangeContent(() => this._updateUserEditingState()));
                        this._userEditingDisposables.add(editingCell.model.onDidChangeLanguage(() => this._updateUserEditingState()));
                        this._userEditingDisposables.add(editingCell.model.onDidChangeMetadata(() => this._updateUserEditingState()));
                        this._userEditingDisposables.add(editingCell.model.onDidChangeInternalMetadata(() => this._updateUserEditingState()));
                        this._userEditingDisposables.add(editingCell.model.onDidChangeOutputs(() => this._updateUserEditingState()));
                        this._userEditingDisposables.add(this._executionStateService.onDidChangeExecution(e => {
                            if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && e.affectsCell(editingCell.uri)) {
                                this._updateUserEditingState();
                            }
                        }));
                    }
                }
            }
            catch (e) {
                response = new inlineChatSession_1.ErrorResponse(e);
            }
            finally {
                this._ctxHasActiveRequest.set(false);
                this._widget?.inlineChatWidget.updateProgress(false);
                this._widget?.inlineChatWidget.updateInfo('');
                this._widget?.inlineChatWidget.updateToolbar(true);
            }
            this._ctxHasActiveRequest.set(false);
            this._widget?.inlineChatWidget.updateProgress(false);
            this._widget?.inlineChatWidget.updateInfo('');
            this._widget?.inlineChatWidget.updateToolbar(true);
            this._activeSession?.addExchange(new inlineChatSession_1.SessionExchange(this._activeSession.lastInput, response));
            this._ctxLastResponseType.set(response instanceof inlineChatSession_1.ReplyResponse ? response.raw.type : undefined);
        }
        async _startSession(editor, token) {
            if (this._activeSession) {
                this._inlineChatSessionService.releaseSession(this._activeSession);
            }
            const session = await this._inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, token);
            if (!session) {
                return;
            }
            this._activeSession = session;
            this._strategy = new EditStrategy(session);
        }
        async _startInitialFolowups(editor, token) {
            if (!this._activeSession || !this._activeSession.provider.provideFollowups) {
                return;
            }
            const request = {
                requestId: (0, uuid_1.generateUuid)(),
                prompt: '',
                attempt: 0,
                selection: { selectionStartLineNumber: 1, selectionStartColumn: 1, positionLineNumber: 1, positionColumn: 1 },
                wholeRange: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
                live: true,
                previewDocument: editor.getModel().uri,
                withIntentDetection: true
            };
            const progress = new progress_1.AsyncProgress(async (data) => { });
            const task = this._activeSession.provider.provideResponse(this._activeSession.session, request, progress, token);
            const reply = await (0, async_1.raceCancellationError)(Promise.resolve(task), token);
            if (token.isCancellationRequested) {
                return;
            }
            if (!reply) {
                return;
            }
            const markdownContents = new htmlContent_1.MarkdownString('', { supportThemeIcons: true, supportHtml: true, isTrusted: false });
            const response = this._instantiationService.createInstance(inlineChatSession_1.ReplyResponse, reply, markdownContents, this._activeSession.textModelN.uri, this._activeSession.textModelN.getAlternativeVersionId(), [], request.requestId);
            const followups = await this._activeSession.provider.provideFollowups(this._activeSession.session, response.raw, token);
            if (followups && this._widget) {
                const widget = this._widget;
                widget.inlineChatWidget.updateFollowUps(followups, async (followup) => {
                    if (followup.kind === 'reply') {
                        widget.inlineChatWidget.value = followup.message;
                        this.acceptInput();
                    }
                    else {
                        await this.acceptSession();
                        this._commandService.executeCommand(followup.commandId, ...(followup.args ?? []));
                    }
                });
            }
        }
        async _makeChanges(edits, opts) {
            (0, types_1.assertType)(this._activeSession);
            (0, types_1.assertType)(this._strategy);
            (0, types_1.assertType)(this._widget);
            const editingCell = await this._widget.getOrCreateEditingCell();
            if (!editingCell) {
                return;
            }
            const editor = editingCell.editor;
            const moreMinimalEdits = await this._editorWorkerService.computeMoreMinimalEdits(editor.getModel().uri, edits);
            // this._log('edits from PROVIDER and after making them MORE MINIMAL', this._activeSession.provider.debugName, edits, moreMinimalEdits);
            if (moreMinimalEdits?.length === 0) {
                // nothing left to do
                return;
            }
            const actualEdits = !opts && moreMinimalEdits ? moreMinimalEdits : edits;
            const editOperations = actualEdits.map(languages_1.TextEdit.asEditOperation);
            this._inlineChatSavingService.markChanged(this._activeSession);
            try {
                // this._ignoreModelContentChanged = true;
                this._activeSession.wholeRange.trackEdits(editOperations);
                if (opts) {
                    await this._strategy.makeProgressiveChanges(editor, editOperations, opts);
                }
                else {
                    await this._strategy.makeChanges(editor, editOperations);
                }
                // this._ctxDidEdit.set(this._activeSession.hasChangedText);
            }
            finally {
                // this._ignoreModelContentChanged = false;
            }
        }
        _updateUserEditingState() {
            this._ctxUserDidEdit.set(true);
        }
        async acceptSession() {
            (0, types_1.assertType)(this._activeSession);
            (0, types_1.assertType)(this._strategy);
            const editor = this._widget?.parentEditor;
            if (!editor?.hasModel()) {
                return;
            }
            const editingCell = this._widget?.getEditingCell();
            if (editingCell && this._notebookEditor.hasModel() && this._activeSession.lastInput) {
                const cellId = NotebookCellTextModelLikeId.str({ uri: editingCell.uri, viewType: this._notebookEditor.textModel.viewType });
                const prompt = this._activeSession.lastInput.value;
                this._promptCache.set(cellId, prompt);
                this._onDidChangePromptCache.fire({ cell: editingCell.uri });
            }
            try {
                await this._strategy.apply(editor);
                this._inlineChatSessionService.releaseSession(this._activeSession);
            }
            catch (_err) { }
            this.dismiss(false);
        }
        async focusAbove() {
            if (!this._widget) {
                return;
            }
            const index = this._widget.afterModelPosition;
            const prev = index - 1;
            if (prev < 0) {
                return;
            }
            const cell = this._notebookEditor.cellAt(prev);
            if (!cell) {
                return;
            }
            await this._notebookEditor.focusNotebookCell(cell, 'editor');
        }
        async focusNext() {
            if (!this._widget) {
                return;
            }
            const index = this._widget.afterModelPosition;
            const cell = this._notebookEditor.cellAt(index);
            if (!cell) {
                return;
            }
            await this._notebookEditor.focusNotebookCell(cell, 'editor');
        }
        hasFocus() {
            return this._widget?.hasFocus() ?? false;
        }
        focus() {
            this._focusWidget();
        }
        focusNearestWidget(index, direction) {
            switch (direction) {
                case 'above':
                    if (this._widget?.afterModelPosition === index) {
                        this._focusWidget();
                    }
                    break;
                case 'below':
                    if (this._widget?.afterModelPosition === index + 1) {
                        this._focusWidget();
                    }
                    break;
                default:
                    break;
            }
        }
        populateHistory(up) {
            if (!this._widget) {
                return;
            }
            const len = NotebookChatController_1._promptHistory.length;
            if (len === 0) {
                return;
            }
            if (this._historyOffset === -1) {
                // remember the current value
                this._historyCandidate = this._widget.inlineChatWidget.value;
            }
            const newIdx = this._historyOffset + (up ? 1 : -1);
            if (newIdx >= len) {
                // reached the end
                return;
            }
            let entry;
            if (newIdx < 0) {
                entry = this._historyCandidate;
                this._historyOffset = -1;
            }
            else {
                entry = NotebookChatController_1._promptHistory[newIdx];
                this._historyOffset = newIdx;
            }
            this._widget.inlineChatWidget.value = entry;
            this._widget.inlineChatWidget.selectAll();
        }
        async cancelCurrentRequest(discard) {
            if (discard) {
                this._strategy?.cancel();
            }
            this._activeRequestCts?.cancel();
        }
        getEditingCell() {
            return this._widget?.getEditingCell();
        }
        discard() {
            this._strategy?.cancel();
            this._activeRequestCts?.cancel();
            this._widget?.discardChange();
            this.dismiss(true);
        }
        async feedbackLast(kind) {
            if (this._activeSession?.lastExchange && this._activeSession.lastExchange.response instanceof inlineChatSession_1.ReplyResponse) {
                this._activeSession.provider.handleInlineChatResponseFeedback?.(this._activeSession.session, this._activeSession.lastExchange.response.raw, kind);
                this._widget?.inlineChatWidget.updateStatus('Thank you for your feedback!', { resetAfter: 1250 });
            }
        }
        dismiss(discard) {
            const widget = this._widget;
            const widgetIndex = widget?.afterModelPosition;
            const currentFocus = this._notebookEditor.getFocus();
            const isWidgetFocused = currentFocus.start === widgetIndex && currentFocus.end === widgetIndex;
            if (widget && isWidgetFocused) {
                // change focus only when the widget is focused
                const editingCell = widget.getEditingCell();
                const shouldFocusEditingCell = editingCell && !discard;
                const shouldFocusTopCell = widgetIndex === 0 && this._notebookEditor.getLength() > 0;
                const shouldFocusAboveCell = widgetIndex !== 0 && this._notebookEditor.cellAt(widgetIndex - 1);
                if (shouldFocusEditingCell) {
                    this._notebookEditor.focusNotebookCell(editingCell, 'container');
                }
                else if (shouldFocusTopCell) {
                    this._notebookEditor.focusNotebookCell(this._notebookEditor.cellAt(0), 'container');
                }
                else if (shouldFocusAboveCell) {
                    this._notebookEditor.focusNotebookCell(this._notebookEditor.cellAt(widgetIndex - 1), 'container');
                }
            }
            this._ctxCellWidgetFocused.set(false);
            this._ctxUserDidEdit.set(false);
            this._sessionCtor?.cancel();
            this._sessionCtor = undefined;
            this._widget?.dispose();
            this._widget = undefined;
            this._widgetDisposableStore.clear();
        }
        // check if a cell is generated by prompt by checking prompt cache
        isCellGeneratedByChat(cell) {
            if (!this._notebookEditor.hasModel()) {
                // no model attached yet
                return false;
            }
            const cellId = NotebookCellTextModelLikeId.str({ uri: cell.uri, viewType: this._notebookEditor.textModel.viewType });
            return this._promptCache.has(cellId);
        }
        // get prompt from cache
        getPromptFromCache(cell) {
            if (!this._notebookEditor.hasModel()) {
                // no model attached yet
                return undefined;
            }
            const cellId = NotebookCellTextModelLikeId.str({ uri: cell.uri, viewType: this._notebookEditor.textModel.viewType });
            return this._promptCache.get(cellId);
        }
        dispose() {
            this.dismiss(false);
            super.dispose();
        }
    };
    exports.NotebookChatController = NotebookChatController;
    exports.NotebookChatController = NotebookChatController = NotebookChatController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, inlineChatSessionService_1.IInlineChatSessionService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, commands_1.ICommandService),
        __param(5, editorWorker_1.IEditorWorkerService),
        __param(6, inlineChatSavingService_1.IInlineChatSavingService),
        __param(7, model_1.IModelService),
        __param(8, language_1.ILanguageService),
        __param(9, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(10, storage_1.IStorageService)
    ], NotebookChatController);
    class EditStrategy {
        constructor(_session) {
            this._session = _session;
            this._editCount = 0;
        }
        async makeProgressiveChanges(editor, edits, opts) {
            // push undo stop before first edit
            if (++this._editCount === 1) {
                editor.pushUndoStop();
            }
            const durationInSec = opts.duration / 1000;
            for (const edit of edits) {
                const wordCount = (0, chatWordCounter_1.countWords)(edit.text ?? '');
                const speed = wordCount / durationInSec;
                // console.log({ durationInSec, wordCount, speed: wordCount / durationInSec });
                await (0, utils_1.performAsyncTextEdit)(editor.getModel(), (0, utils_1.asProgressiveEdit)(new dom_1.WindowIntervalTimer(), edit, speed, opts.token));
            }
        }
        async makeChanges(editor, edits) {
            const cursorStateComputerAndInlineDiffCollection = (undoEdits) => {
                let last = null;
                for (const edit of undoEdits) {
                    last = !last || last.isBefore(edit.range.getEndPosition()) ? edit.range.getEndPosition() : last;
                    // this._inlineDiffDecorations.collectEditOperation(edit);
                }
                return last && [selection_1.Selection.fromPositions(last)];
            };
            // push undo stop before first edit
            if (++this._editCount === 1) {
                editor.pushUndoStop();
            }
            editor.executeEdits('inline-chat-live', edits, cursorStateComputerAndInlineDiffCollection);
        }
        async apply(editor) {
            if (this._editCount > 0) {
                editor.pushUndoStop();
            }
            if (!(this._session.lastExchange?.response instanceof inlineChatSession_1.ReplyResponse)) {
                return;
            }
            const { untitledTextModel } = this._session.lastExchange.response;
            if (untitledTextModel && !untitledTextModel.isDisposed() && untitledTextModel.isDirty()) {
                await untitledTextModel.save({ reason: 1 /* SaveReason.EXPLICIT */ });
            }
        }
        async cancel() {
            const { textModelN: modelN, textModelNAltVersion, textModelNSnapshotAltVersion } = this._session;
            if (modelN.isDisposed()) {
                return;
            }
            const targetAltVersion = textModelNSnapshotAltVersion ?? textModelNAltVersion;
            while (targetAltVersion < modelN.getAlternativeVersionId() && modelN.canUndo()) {
                modelN.undo();
            }
        }
        createSnapshot() {
            if (this._session && !this._session.textModel0.equalsTextBuffer(this._session.textModelN.getTextBuffer())) {
                this._session.createSnapshot();
            }
        }
    }
    exports.EditStrategy = EditStrategy;
    (0, notebookEditorExtensions_1.registerNotebookContribution)(NotebookChatController.id, NotebookChatController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDaGF0Q29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cm9sbGVyL2NoYXQvbm90ZWJvb2tDaGF0Q29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBaURoRyxNQUFNLGtCQUFtQixTQUFRLHNCQUFVO1FBQzFDLElBQUksa0JBQWtCLENBQUMsa0JBQTBCO1lBQ2hELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQztRQUMvRCxDQUFDO1FBRUQsSUFBSSxrQkFBa0I7WUFDckIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUM7UUFDakQsQ0FBQztRQUVELElBQUksVUFBVSxDQUFDLFVBQWtCO1lBQ2hDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQy9DLENBQUM7UUFFRCxJQUFJLFVBQVU7WUFDYixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUM7UUFDekMsQ0FBQztRQUlELElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDO1FBRUQsWUFDa0IsZUFBZ0MsRUFDeEMsRUFBVSxFQUNWLGdCQUFtQyxFQUNuQyxPQUFvQixFQUNwQixlQUE0QixFQUM1QixnQkFBa0MsRUFDbEMsWUFBOEIsRUFDdEIsZ0JBQWtDO1lBRW5ELEtBQUssRUFBRSxDQUFDO1lBVFMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ3hDLE9BQUUsR0FBRixFQUFFLENBQVE7WUFDVixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ25DLFlBQU8sR0FBUCxPQUFPLENB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