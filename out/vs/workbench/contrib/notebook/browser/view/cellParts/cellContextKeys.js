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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatController", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/workbench/contrib/notebook/browser/viewModel/markupCellViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, lifecycle_1, contextkey_1, instantiation_1, notebookChatController_1, notebookBrowser_1, cellPart_1, codeCellViewModel_1, markupCellViewModel_1, notebookCommon_1, notebookContextKeys_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellContextKeyManager = exports.CellContextKeyPart = void 0;
    let CellContextKeyPart = class CellContextKeyPart extends cellPart_1.CellContentPart {
        constructor(notebookEditor, instantiationService) {
            super();
            this.instantiationService = instantiationService;
            this.cellContextKeyManager = this._register(this.instantiationService.createInstance(CellContextKeyManager, notebookEditor, undefined));
        }
        didRenderCell(element) {
            this.cellContextKeyManager.updateForElement(element);
        }
    };
    exports.CellContextKeyPart = CellContextKeyPart;
    exports.CellContextKeyPart = CellContextKeyPart = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], CellContextKeyPart);
    let CellContextKeyManager = class CellContextKeyManager extends lifecycle_1.Disposable {
        constructor(notebookEditor, element, _contextKeyService, _notebookExecutionStateService) {
            super();
            this.notebookEditor = notebookEditor;
            this.element = element;
            this._contextKeyService = _contextKeyService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this.elementDisposables = this._register(new lifecycle_1.DisposableStore());
            this._contextKeyService.bufferChangeEvents(() => {
                this.cellType = notebookContextKeys_1.NOTEBOOK_CELL_TYPE.bindTo(this._contextKeyService);
                this.cellEditable = notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE.bindTo(this._contextKeyService);
                this.cellFocused = notebookContextKeys_1.NOTEBOOK_CELL_FOCUSED.bindTo(this._contextKeyService);
                this.cellEditorFocused = notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.bindTo(this._contextKeyService);
                this.markdownEditMode = notebookContextKeys_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE.bindTo(this._contextKeyService);
                this.cellRunState = notebookContextKeys_1.NOTEBOOK_CELL_EXECUTION_STATE.bindTo(this._contextKeyService);
                this.cellExecuting = notebookContextKeys_1.NOTEBOOK_CELL_EXECUTING.bindTo(this._contextKeyService);
                this.cellHasOutputs = notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS.bindTo(this._contextKeyService);
                this.cellContentCollapsed = notebookContextKeys_1.NOTEBOOK_CELL_INPUT_COLLAPSED.bindTo(this._contextKeyService);
                this.cellOutputCollapsed = notebookContextKeys_1.NOTEBOOK_CELL_OUTPUT_COLLAPSED.bindTo(this._contextKeyService);
                this.cellLineNumbers = notebookContextKeys_1.NOTEBOOK_CELL_LINE_NUMBERS.bindTo(this._contextKeyService);
                this.cellGeneratedByChat = notebookContextKeys_1.NOTEBOOK_CELL_GENERATED_BY_CHAT.bindTo(this._contextKeyService);
                this.cellResource = notebookContextKeys_1.NOTEBOOK_CELL_RESOURCE.bindTo(this._contextKeyService);
                this.cellHasErrorDiagnostics = notebookContextKeys_1.NOTEBOOK_CELL_HAS_ERROR_DIAGNOSTICS.bindTo(this._contextKeyService);
                if (element) {
                    this.updateForElement(element);
                }
            });
            this._register(this._notebookExecutionStateService.onDidChangeExecution(e => {
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && this.element && e.affectsCell(this.element.uri)) {
                    this.updateForExecutionState();
                }
            }));
        }
        updateForElement(element) {
            this.elementDisposables.clear();
            this.element = element;
            if (!element) {
                return;
            }
            this.elementDisposables.add(element.onDidChangeState(e => this.onDidChangeState(e)));
            if (element instanceof codeCellViewModel_1.CodeCellViewModel) {
                this.elementDisposables.add(element.onDidChangeOutputs(() => this.updateForOutputs()));
                this.elementDisposables.add(element.cellDiagnostics.onDidDiagnosticsChange(() => this.updateForDiagnostics()));
            }
            this.elementDisposables.add(this.notebookEditor.onDidChangeActiveCell(() => this.updateForFocusState()));
            if (this.element instanceof markupCellViewModel_1.MarkupCellViewModel) {
                this.cellType.set('markup');
            }
            else if (this.element instanceof codeCellViewModel_1.CodeCellViewModel) {
                this.cellType.set('code');
            }
            this._contextKeyService.bufferChangeEvents(() => {
                this.updateForFocusState();
                this.updateForExecutionState();
                this.updateForEditState();
                this.updateForCollapseState();
                this.updateForOutputs();
                this.updateForChat();
                this.updateForDiagnostics();
                this.cellLineNumbers.set(this.element.lineNumbers);
                this.cellResource.set(this.element.uri.toString());
            });
            const chatController = notebookChatController_1.NotebookChatController.get(this.notebookEditor);
            if (chatController) {
                this.elementDisposables.add(chatController.onDidChangePromptCache(e => {
                    if (e.cell.toString() === this.element.uri.toString()) {
                        this.updateForChat();
                    }
                }));
            }
        }
        onDidChangeState(e) {
            this._contextKeyService.bufferChangeEvents(() => {
                if (e.internalMetadataChanged) {
                    this.updateForExecutionState();
                }
                if (e.editStateChanged) {
                    this.updateForEditState();
                }
                if (e.focusModeChanged) {
                    this.updateForFocusState();
                }
                if (e.cellLineNumberChanged) {
                    this.cellLineNumbers.set(this.element.lineNumbers);
                }
                if (e.inputCollapsedChanged || e.outputCollapsedChanged) {
                    this.updateForCollapseState();
                }
            });
        }
        updateForFocusState() {
            if (!this.element) {
                return;
            }
            const activeCell = this.notebookEditor.getActiveCell();
            this.cellFocused.set(this.notebookEditor.getActiveCell() === this.element);
            if (activeCell === this.element) {
                this.cellEditorFocused.set(this.element.focusMode === notebookBrowser_1.CellFocusMode.Editor);
            }
            else {
                this.cellEditorFocused.set(false);
            }
        }
        updateForExecutionState() {
            if (!this.element) {
                return;
            }
            const internalMetadata = this.element.internalMetadata;
            this.cellEditable.set(!this.notebookEditor.isReadOnly);
            const exeState = this._notebookExecutionStateService.getCellExecution(this.element.uri);
            if (this.element instanceof markupCellViewModel_1.MarkupCellViewModel) {
                this.cellRunState.reset();
                this.cellExecuting.reset();
            }
            else if (exeState?.state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                this.cellRunState.set('executing');
                this.cellExecuting.set(true);
            }
            else if (exeState?.state === notebookCommon_1.NotebookCellExecutionState.Pending || exeState?.state === notebookCommon_1.NotebookCellExecutionState.Unconfirmed) {
                this.cellRunState.set('pending');
                this.cellExecuting.set(true);
            }
            else if (internalMetadata.lastRunSuccess === true) {
                this.cellRunState.set('succeeded');
                this.cellExecuting.set(false);
            }
            else if (internalMetadata.lastRunSuccess === false) {
                this.cellRunState.set('failed');
                this.cellExecuting.set(false);
            }
            else {
                this.cellRunState.set('idle');
                this.cellExecuting.set(false);
            }
        }
        updateForEditState() {
            if (!this.element) {
                return;
            }
            if (this.element instanceof markupCellViewModel_1.MarkupCellViewModel) {
                this.markdownEditMode.set(this.element.getEditState() === notebookBrowser_1.CellEditState.Editing);
            }
            else {
                this.markdownEditMode.set(false);
            }
        }
        updateForCollapseState() {
            if (!this.element) {
                return;
            }
            this.cellContentCollapsed.set(!!this.element.isInputCollapsed);
            this.cellOutputCollapsed.set(!!this.element.isOutputCollapsed);
        }
        updateForOutputs() {
            if (this.element instanceof codeCellViewModel_1.CodeCellViewModel) {
                this.cellHasOutputs.set(this.element.outputsViewModels.length > 0);
            }
            else {
                this.cellHasOutputs.set(false);
            }
        }
        updateForChat() {
            const chatController = notebookChatController_1.NotebookChatController.get(this.notebookEditor);
            if (!chatController || !this.element) {
                this.cellGeneratedByChat.set(false);
                return;
            }
            this.cellGeneratedByChat.set(chatController.isCellGeneratedByChat(this.element));
        }
        updateForDiagnostics() {
            if (this.element instanceof codeCellViewModel_1.CodeCellViewModel) {
                this.cellHasErrorDiagnostics.set(!!this.element.cellDiagnostics.ErrorDetails);
            }
        }
    };
    exports.CellContextKeyManager = CellContextKeyManager;
    exports.CellContextKeyManager = CellContextKeyManager = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], CellContextKeyManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbENvbnRleHRLZXlzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnRzL2NlbGxDb250ZXh0S2V5cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFlekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSwwQkFBZTtRQUd0RCxZQUNDLGNBQXVDLEVBQ0Msb0JBQTJDO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBRmdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFJbkYsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxxQkFBcUIsRUFBRSxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN6SSxDQUFDO1FBRVEsYUFBYSxDQUFDLE9BQXVCO1lBQzdDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0RCxDQUFDO0tBQ0QsQ0FBQTtJQWZZLGdEQUFrQjtpQ0FBbEIsa0JBQWtCO1FBSzVCLFdBQUEscUNBQXFCLENBQUE7T0FMWCxrQkFBa0IsQ0FlOUI7SUFFTSxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO1FBb0JwRCxZQUNrQixjQUF1QyxFQUNoRCxPQUFtQyxFQUN2QixrQkFBdUQsRUFDM0MsOEJBQStFO1lBRS9HLEtBQUssRUFBRSxDQUFDO1lBTFMsbUJBQWMsR0FBZCxjQUFjLENBQXlCO1lBQ2hELFlBQU8sR0FBUCxPQUFPLENBQTRCO1lBQ04sdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUMxQixtQ0FBOEIsR0FB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