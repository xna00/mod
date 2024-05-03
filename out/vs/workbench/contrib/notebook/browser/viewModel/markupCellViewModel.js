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
define(["require", "exports", "vs/base/common/event", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/viewModel/baseCellViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/editor/common/services/resolverService", "vs/platform/undoRedo/common/undoRedo", "vs/editor/browser/services/codeEditorService", "vs/workbench/contrib/notebook/browser/notebookViewEvents"], function (require, exports, event_1, UUID, configuration_1, notebookBrowser_1, baseCellViewModel_1, notebookCommon_1, resolverService_1, undoRedo_1, codeEditorService_1, notebookViewEvents_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkupCellViewModel = void 0;
    let MarkupCellViewModel = class MarkupCellViewModel extends baseCellViewModel_1.BaseCellViewModel {
        get renderedHtml() { return this._renderedHtml; }
        set renderedHtml(value) {
            if (this._renderedHtml !== value) {
                this._renderedHtml = value;
                this._onDidChangeState.fire({ contentChanged: true });
            }
        }
        get layoutInfo() {
            return this._layoutInfo;
        }
        set renderedMarkdownHeight(newHeight) {
            this._previewHeight = newHeight;
            this._updateTotalHeight(this._computeTotalHeight());
        }
        set chatHeight(newHeight) {
            this._chatHeight = newHeight;
            this._updateTotalHeight(this._computeTotalHeight());
        }
        get chatHeight() {
            return this._chatHeight;
        }
        set editorHeight(newHeight) {
            this._editorHeight = newHeight;
            this._statusBarHeight = this.viewContext.notebookOptions.computeStatusBarHeight();
            this._updateTotalHeight(this._computeTotalHeight());
        }
        get editorHeight() {
            throw new Error('MarkdownCellViewModel.editorHeight is write only');
        }
        get foldingState() {
            return this.foldingDelegate.getFoldingState(this.foldingDelegate.getCellIndex(this));
        }
        get outputIsHovered() {
            return this._hoveringOutput;
        }
        set outputIsHovered(v) {
            this._hoveringOutput = v;
        }
        get outputIsFocused() {
            return this._focusOnOutput;
        }
        set outputIsFocused(v) {
            this._focusOnOutput = v;
        }
        get inputInOutputIsFocused() {
            return false;
        }
        set inputInOutputIsFocused(_) {
            //
        }
        get cellIsHovered() {
            return this._hoveringCell;
        }
        set cellIsHovered(v) {
            this._hoveringCell = v;
            this._onDidChangeState.fire({ cellIsHoveredChanged: true });
        }
        constructor(viewType, model, initialNotebookLayoutInfo, foldingDelegate, viewContext, configurationService, textModelService, undoRedoService, codeEditorService) {
            super(viewType, model, UUID.generateUuid(), viewContext, configurationService, textModelService, undoRedoService, codeEditorService);
            this.foldingDelegate = foldingDelegate;
            this.viewContext = viewContext;
            this.cellKind = notebookCommon_1.CellKind.Markup;
            this._previewHeight = 0;
            this._chatHeight = 0;
            this._editorHeight = 0;
            this._statusBarHeight = 0;
            this._onDidChangeLayout = this._register(new event_1.Emitter());
            this.onDidChangeLayout = this._onDidChangeLayout.event;
            this._hoveringOutput = false;
            this._focusOnOutput = false;
            this._hoveringCell = false;
            /**
             * we put outputs stuff here to make compiler happy
             */
            this.outputsViewModels = [];
            this._hasFindResult = this._register(new event_1.Emitter());
            this.hasFindResult = this._hasFindResult.event;
            const { bottomToolbarGap } = this.viewContext.notebookOptions.computeBottomToolbarDimensions(this.viewType);
            this._layoutInfo = {
                chatHeight: 0,
                editorHeight: 0,
                previewHeight: 0,
                fontInfo: initialNotebookLayoutInfo?.fontInfo || null,
                editorWidth: initialNotebookLayoutInfo?.width
                    ? this.viewContext.notebookOptions.computeMarkdownCellEditorWidth(initialNotebookLayoutInfo.width)
                    : 0,
                bottomToolbarOffset: bottomToolbarGap,
                totalHeight: 100,
                layoutState: notebookBrowser_1.CellLayoutState.Uninitialized,
                foldHintHeight: 0,
                statusBarHeight: 0
            };
            this._register(this.onDidChangeState(e => {
                this.viewContext.eventDispatcher.emit([new notebookViewEvents_1.NotebookCellStateChangedEvent(e, this.model)]);
                if (e.foldingStateChanged) {
                    this._updateTotalHeight(this._computeTotalHeight(), notebookBrowser_1.CellLayoutContext.Fold);
                }
            }));
        }
        _computeTotalHeight() {
            const layoutConfiguration = this.viewContext.notebookOptions.getLayoutConfiguration();
            const { bottomToolbarGap } = this.viewContext.notebookOptions.computeBottomToolbarDimensions(this.viewType);
            const foldHintHeight = this._computeFoldHintHeight();
            if (this.getEditState() === notebookBrowser_1.CellEditState.Editing) {
                return this._editorHeight
                    + layoutConfiguration.markdownCellTopMargin
                    + layoutConfiguration.markdownCellBottomMargin
                    + bottomToolbarGap
                    + this._statusBarHeight;
            }
            else {
                // @rebornix
                // On file open, the previewHeight + bottomToolbarGap for a cell out of viewport can be 0
                // When it's 0, the list view will never try to render it anymore even if we scroll the cell into view.
                // Thus we make sure it's greater than 0
                return Math.max(1, this._previewHeight + bottomToolbarGap + foldHintHeight);
            }
        }
        _computeFoldHintHeight() {
            return (this.getEditState() === notebookBrowser_1.CellEditState.Editing || this.foldingState !== 2 /* CellFoldingState.Collapsed */) ?
                0 : this.viewContext.notebookOptions.getLayoutConfiguration().markdownFoldHintHeight;
        }
        updateOptions(e) {
            if (e.cellStatusBarVisibility || e.insertToolbarPosition || e.cellToolbarLocation) {
                this._updateTotalHeight(this._computeTotalHeight());
            }
        }
        getOutputOffset(index) {
            // throw new Error('Method not implemented.');
            return -1;
        }
        updateOutputHeight(index, height) {
            // throw new Error('Method not implemented.');
        }
        triggerFoldingStateChange() {
            this._onDidChangeState.fire({ foldingStateChanged: true });
        }
        _updateTotalHeight(newHeight, context) {
            if (newHeight !== this.layoutInfo.totalHeight) {
                this.layoutChange({ totalHeight: newHeight, context });
            }
        }
        layoutChange(state) {
            // recompute
            const foldHintHeight = this._computeFoldHintHeight();
            if (!this.isInputCollapsed) {
                const editorWidth = state.outerWidth !== undefined
                    ? this.viewContext.notebookOptions.computeMarkdownCellEditorWidth(state.outerWidth)
                    : this._layoutInfo.editorWidth;
                const totalHeight = state.totalHeight === undefined
                    ? (this._layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.Uninitialized ? 100 : this._layoutInfo.totalHeight)
                    : state.totalHeight;
                const previewHeight = this._previewHeight;
                this._layoutInfo = {
                    fontInfo: state.font || this._layoutInfo.fontInfo,
                    editorWidth,
                    previewHeight,
                    chatHeight: this._chatHeight,
                    editorHeight: this._editorHeight,
                    statusBarHeight: this._statusBarHeight,
                    bottomToolbarOffset: this.viewContext.notebookOptions.computeBottomToolbarOffset(totalHeight, this.viewType),
                    totalHeight,
                    layoutState: notebookBrowser_1.CellLayoutState.Measured,
                    foldHintHeight
                };
            }
            else {
                const editorWidth = state.outerWidth !== undefined
                    ? this.viewContext.notebookOptions.computeMarkdownCellEditorWidth(state.outerWidth)
                    : this._layoutInfo.editorWidth;
                const totalHeight = this.viewContext.notebookOptions.computeCollapsedMarkdownCellHeight(this.viewType);
                state.totalHeight = totalHeight;
                this._layoutInfo = {
                    fontInfo: state.font || this._layoutInfo.fontInfo,
                    editorWidth,
                    chatHeight: this._chatHeight,
                    editorHeight: this._editorHeight,
                    statusBarHeight: this._statusBarHeight,
                    previewHeight: this._previewHeight,
                    bottomToolbarOffset: this.viewContext.notebookOptions.computeBottomToolbarOffset(totalHeight, this.viewType),
                    totalHeight,
                    layoutState: notebookBrowser_1.CellLayoutState.Measured,
                    foldHintHeight: 0
                };
            }
            this._onDidChangeLayout.fire(state);
        }
        restoreEditorViewState(editorViewStates, totalHeight) {
            super.restoreEditorViewState(editorViewStates);
            // we might already warmup the viewport so the cell has a total height computed
            if (totalHeight !== undefined && this.layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.Uninitialized) {
                this._layoutInfo = {
                    fontInfo: this._layoutInfo.fontInfo,
                    editorWidth: this._layoutInfo.editorWidth,
                    previewHeight: this._layoutInfo.previewHeight,
                    bottomToolbarOffset: this._layoutInfo.bottomToolbarOffset,
                    totalHeight: totalHeight,
                    chatHeight: this._chatHeight,
                    editorHeight: this._editorHeight,
                    statusBarHeight: this._statusBarHeight,
                    layoutState: notebookBrowser_1.CellLayoutState.FromCache,
                    foldHintHeight: this._layoutInfo.foldHintHeight
                };
                this.layoutChange({});
            }
        }
        getDynamicHeight() {
            return null;
        }
        getHeight(lineHeight) {
            if (this._layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.Uninitialized) {
                return 100;
            }
            else {
                return this._layoutInfo.totalHeight;
            }
        }
        onDidChangeTextModelContent() {
            this._onDidChangeState.fire({ contentChanged: true });
        }
        onDeselect() {
        }
        startFind(value, options) {
            const matches = super.cellStartFind(value, options);
            if (matches === null) {
                return null;
            }
            return {
                cell: this,
                contentMatches: matches
            };
        }
        dispose() {
            super.dispose();
            this.foldingDelegate = null;
        }
    };
    exports.MarkupCellViewModel = MarkupCellViewModel;
    exports.MarkupCellViewModel = MarkupCellViewModel = __decorate([
        __param(5, configuration_1.IConfigurationService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, undoRedo_1.IUndoRedoService),
        __param(8, codeEditorService_1.ICodeEditorService)
    ], MarkupCellViewModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya3VwQ2VsbFZpZXdNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3TW9kZWwvbWFya3VwQ2VsbFZpZXdNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQnpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEscUNBQWlCO1FBUXpELElBQVcsWUFBWSxLQUF5QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQzVFLElBQVcsWUFBWSxDQUFDLEtBQXlCO1lBQ2hELElBQUksSUFBSSxDQUFDLGFBQWEsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN2RCxDQUFDO1FBQ0YsQ0FBQztRQUVELElBQUksVUFBVTtZQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUN6QixDQUFDO1FBSUQsSUFBSSxzQkFBc0IsQ0FBQyxTQUFpQjtZQUMzQyxJQUFJLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQztZQUNoQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBSUQsSUFBSSxVQUFVLENBQUMsU0FBaUI7WUFDL0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7WUFDN0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVELElBQUksVUFB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