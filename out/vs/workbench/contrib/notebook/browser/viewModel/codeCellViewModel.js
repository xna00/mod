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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/editor/browser/services/codeEditorService", "vs/editor/common/services/resolverService", "vs/editor/common/model/prefixSumComputer", "vs/platform/configuration/common/configuration", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/viewModel/cellOutputViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService", "./baseCellViewModel", "vs/workbench/contrib/notebook/browser/contrib/cellDiagnostics/cellDiagnostics", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, lifecycle_1, UUID, codeEditorService_1, resolverService_1, prefixSumComputer_1, configuration_1, undoRedo_1, notebookBrowser_1, cellOutputViewModel_1, notebookCommon_1, notebookService_1, baseCellViewModel_1, cellDiagnostics_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeCellViewModel = exports.outputDisplayLimit = void 0;
    exports.outputDisplayLimit = 500;
    let CodeCellViewModel = class CodeCellViewModel extends baseCellViewModel_1.BaseCellViewModel {
        get cellDiagnostics() {
            return this._cellDiagnostics;
        }
        set editorHeight(height) {
            if (this._editorHeight === height) {
                return;
            }
            this._editorHeight = height;
            this.layoutChange({ editorHeight: true }, 'CodeCellViewModel#editorHeight');
        }
        get editorHeight() {
            throw new Error('editorHeight is write-only');
        }
        set chatHeight(height) {
            if (this._chatHeight === height) {
                return;
            }
            this._chatHeight = height;
            this.layoutChange({ chatHeight: true }, 'CodeCellViewModel#chatHeight');
        }
        get chatHeight() {
            return this._chatHeight;
        }
        set commentHeight(height) {
            if (this._commentHeight === height) {
                return;
            }
            this._commentHeight = height;
            this.layoutChange({ commentHeight: true }, 'CodeCellViewModel#commentHeight');
        }
        get outputIsHovered() {
            return this._hoveringOutput;
        }
        set outputIsHovered(v) {
            this._hoveringOutput = v;
            this._onDidChangeState.fire({ outputIsHoveredChanged: true });
        }
        get outputIsFocused() {
            return this._focusOnOutput;
        }
        set outputIsFocused(v) {
            this._focusOnOutput = v;
            this._onDidChangeState.fire({ outputIsFocusedChanged: true });
        }
        get inputInOutputIsFocused() {
            return this._focusInputInOutput;
        }
        set inputInOutputIsFocused(v) {
            this._focusInputInOutput = v;
        }
        get outputMinHeight() {
            return this._outputMinHeight;
        }
        /**
         * The minimum height of the output region. It's only set to non-zero temporarily when replacing an output with a new one.
         * It's reset to 0 when the new output is rendered, or in one second.
         */
        set outputMinHeight(newMin) {
            this._outputMinHeight = newMin;
        }
        get layoutInfo() {
            return this._layoutInfo;
        }
        get outputsViewModels() {
            return this._outputViewModels;
        }
        constructor(viewType, model, initialNotebookLayoutInfo, viewContext, configurationService, _notebookService, modelService, undoRedoService, codeEditorService, instantiationService) {
            super(viewType, model, UUID.generateUuid(), viewContext, configurationService, modelService, undoRedoService, codeEditorService);
            this.viewContext = viewContext;
            this._notebookService = _notebookService;
            this.cellKind = notebookCommon_1.CellKind.Code;
            this._onLayoutInfoRead = this._register(new event_1.Emitter());
            this.onLayoutInfoRead = this._onLayoutInfoRead.event;
            this._onDidStartExecution = this._register(new event_1.Emitter());
            this.onDidStartExecution = this._onDidStartExecution.event;
            this._onDidStopExecution = this._register(new event_1.Emitter());
            this.onDidStopExecution = this._onDidStopExecution.event;
            this._onDidChangeOutputs = this._register(new event_1.Emitter());
            this.onDidChangeOutputs = this._onDidChangeOutputs.event;
            this._onDidRemoveOutputs = this._register(new event_1.Emitter());
            this.onDidRemoveOutputs = this._onDidRemoveOutputs.event;
            this._outputCollection = [];
            this._outputsTop = null;
            this._pauseableEmitter = this._register(new event_1.PauseableEmitter());
            this.onDidChangeLayout = this._pauseableEmitter.event;
            this._editorHeight = 0;
            this._chatHeight = 0;
            this._commentHeight = 0;
            this._hoveringOutput = false;
            this._focusOnOutput = false;
            this._focusInputInOutput = false;
            this._outputMinHeight = 0;
            this._hasFindResult = this._register(new event_1.Emitter());
            this.hasFindResult = this._hasFindResult.event;
            this._outputViewModels = this.model.outputs.map(output => new cellOutputViewModel_1.CellOutputViewModel(this, output, this._notebookService));
            this._register(this.model.onDidChangeOutputs((splice) => {
                const removedOutputs = [];
                let outputLayoutChange = false;
                for (let i = splice.start; i < splice.start + splice.deleteCount; i++) {
                    if (this._outputCollection[i] !== undefined && this._outputCollection[i] !== 0) {
                        outputLayoutChange = true;
                    }
                }
                this._outputCollection.splice(splice.start, splice.deleteCount, ...splice.newOutputs.map(() => 0));
                removedOutputs.push(...this._outputViewModels.splice(splice.start, splice.deleteCount, ...splice.newOutputs.map(output => new cellOutputViewModel_1.CellOutputViewModel(this, output, this._notebookService))));
                this._outputsTop = null;
                this._onDidChangeOutputs.fire(splice);
                this._onDidRemoveOutputs.fire(removedOutputs);
                if (outputLayoutChange) {
                    this.layoutChange({ outputHeight: true }, 'CodeCellViewModel#model.onDidChangeOutputs');
                }
                if (this._outputCollection.length === 0) {
                    this._cellDiagnostics.clear();
                }
                (0, lifecycle_1.dispose)(removedOutputs);
            }));
            this._outputCollection = new Array(this.model.outputs.length);
            this._cellDiagnostics = instantiationService.createInstance(cellDiagnostics_1.CellDiagnostics, this);
            this._register(this._cellDiagnostics);
            this._layoutInfo = {
                fontInfo: initialNotebookLayoutInfo?.fontInfo || null,
                editorHeight: 0,
                editorWidth: initialNotebookLayoutInfo
                    ? this.viewContext.notebookOptions.computeCodeCellEditorWidth(initialNotebookLayoutInfo.width)
                    : 0,
                chatHeight: 0,
                statusBarHeight: 0,
                commentHeight: 0,
                outputContainerOffset: 0,
                outputTotalHeight: 0,
                outputShowMoreContainerHeight: 0,
                outputShowMoreContainerOffset: 0,
                totalHeight: this.computeTotalHeight(17, 0, 0, 0),
                codeIndicatorHeight: 0,
                outputIndicatorHeight: 0,
                bottomToolbarOffset: 0,
                layoutState: notebookBrowser_1.CellLayoutState.Uninitialized,
                estimatedHasHorizontalScrolling: false
            };
        }
        updateExecutionState(e) {
            if (e.changed) {
                this._onDidStartExecution.fire(e);
            }
            else {
                this._onDidStopExecution.fire(e);
            }
        }
        updateOptions(e) {
            if (e.cellStatusBarVisibility || e.insertToolbarPosition || e.cellToolbarLocation) {
                this.layoutChange({});
            }
        }
        pauseLayout() {
            this._pauseableEmitter.pause();
        }
        resumeLayout() {
            this._pauseableEmitter.resume();
        }
        layoutChange(state, source) {
            // recompute
            this._ensureOutputsTop();
            const notebookLayoutConfiguration = this.viewContext.notebookOptions.getLayoutConfiguration();
            const bottomToolbarDimensions = this.viewContext.notebookOptions.computeBottomToolbarDimensions(this.viewType);
            const outputShowMoreContainerHeight = state.outputShowMoreContainerHeight ? state.outputShowMoreContainerHeight : this._layoutInfo.outputShowMoreContainerHeight;
            const outputTotalHeight = Math.max(this._outputMinHeight, this.isOutputCollapsed ? notebookLayoutConfiguration.collapsedIndicatorHeight : this._outputsTop.getTotalSum());
            const commentHeight = state.commentHeight ? this._commentHeight : this._layoutInfo.commentHeight;
            const originalLayout = this.layoutInfo;
            if (!this.isInputCollapsed) {
                let newState;
                let editorHeight;
                let totalHeight;
                let hasHorizontalScrolling = false;
                const chatHeight = state.chatHeight ? this._chatHeight : this._layoutInfo.chatHeight;
                if (!state.editorHeight && this._layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.FromCache && !state.outputHeight) {
                    // No new editorHeight info - keep cached totalHeight and estimate editorHeight
                    const estimate = this.estimateEditorHeight(state.font?.lineHeight ?? this._layoutInfo.fontInfo?.lineHeight);
                    editorHeight = estimate.editorHeight;
                    hasHorizontalScrolling = estimate.hasHorizontalScrolling;
                    totalHeight = this._layoutInfo.totalHeight;
                    newState = notebookBrowser_1.CellLayoutState.FromCache;
                }
                else if (state.editorHeight || this._layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.Measured) {
                    // Editor has been measured
                    editorHeight = this._editorHeight;
                    totalHeight = this.computeTotalHeight(this._editorHeight, outputTotalHeight, outputShowMoreContainerHeight, chatHeight);
                    newState = notebookBrowser_1.CellLayoutState.Measured;
                    hasHorizontalScrolling = this._layoutInfo.estimatedHasHorizontalScrolling;
                }
                else {
                    const estimate = this.estimateEditorHeight(state.font?.lineHeight ?? this._layoutInfo.fontInfo?.lineHeight);
                    editorHeight = estimate.editorHeight;
                    hasHorizontalScrolling = estimate.hasHorizontalScrolling;
                    totalHeight = this.computeTotalHeight(editorHeight, outputTotalHeight, outputShowMoreContainerHeight, chatHeight);
                    newState = notebookBrowser_1.CellLayoutState.Estimated;
                }
                const statusBarHeight = this.viewContext.notebookOptions.computeEditorStatusbarHeight(this.internalMetadata, this.uri);
                const codeIndicatorHeight = editorHeight + statusBarHeight;
                const outputIndicatorHeight = outputTotalHeight + outputShowMoreContainerHeight;
                const outputContainerOffset = notebookLayoutConfiguration.editorToolbarHeight
                    + notebookLayoutConfiguration.cellTopMargin // CELL_TOP_MARGIN
                    + chatHeight
                    + editorHeight
                    + statusBarHeight;
                const outputShowMoreContainerOffset = totalHeight
                    - bottomToolbarDimensions.bottomToolbarGap
                    - bottomToolbarDimensions.bottomToolbarHeight / 2
                    - outputShowMoreContainerHeight;
                const bottomToolbarOffset = this.viewContext.notebookOptions.computeBottomToolbarOffset(totalHeight, this.viewType);
                const editorWidth = state.outerWidth !== undefined
                    ? this.viewContext.notebookOptions.computeCodeCellEditorWidth(state.outerWidth)
                    : this._layoutInfo?.editorWidth;
                this._layoutInfo = {
                    fontInfo: state.font ?? this._layoutInfo.fontInfo ?? null,
                    chatHeight,
                    editorHeight,
                    editorWidth,
                    statusBarHeight,
                    commentHeight,
                    outputContainerOffset,
                    outputTotalHeight,
                    outputShowMoreContainerHeight,
                    outputShowMoreContainerOffset,
                    totalHeight,
                    codeIndicatorHeight,
                    outputIndicatorHeight,
                    bottomToolbarOffset,
                    layoutState: newState,
                    estimatedHasHorizontalScrolling: hasHorizontalScrolling
                };
            }
            else {
                const codeIndicatorHeight = notebookLayoutConfiguration.collapsedIndicatorHeight;
                const outputIndicatorHeight = outputTotalHeight + outputShowMoreContainerHeight;
                const chatHeight = state.chatHeight ? this._chatHeight : this._layoutInfo.chatHeight;
                const outputContainerOffset = notebookLayoutConfiguration.cellTopMargin + notebookLayoutConfiguration.collapsedIndicatorHeight;
                const totalHeight = notebookLayoutConfiguration.cellTopMargin
                    + notebookLayoutConfiguration.collapsedIndicatorHeight
                    + notebookLayoutConfiguration.cellBottomMargin //CELL_BOTTOM_MARGIN
                    + bottomToolbarDimensions.bottomToolbarGap //BOTTOM_CELL_TOOLBAR_GAP
                    + chatHeight
                    + commentHeight
                    + outputTotalHeight + outputShowMoreContainerHeight;
                const outputShowMoreContainerOffset = totalHeight
                    - bottomToolbarDimensions.bottomToolbarGap
                    - bottomToolbarDimensions.bottomToolbarHeight / 2
                    - outputShowMoreContainerHeight;
                const bottomToolbarOffset = this.viewContext.notebookOptions.computeBottomToolbarOffset(totalHeight, this.viewType);
                const editorWidth = state.outerWidth !== undefined
                    ? this.viewContext.notebookOptions.computeCodeCellEditorWidth(state.outerWidth)
                    : this._layoutInfo?.editorWidth;
                this._layoutInfo = {
                    fontInfo: state.font ?? this._layoutInfo.fontInfo ?? null,
                    editorHeight: this._layoutInfo.editorHeight,
                    editorWidth,
                    chatHeight: chatHeight,
                    statusBarHeight: 0,
                    commentHeight,
                    outputContainerOffset,
                    outputTotalHeight,
                    outputShowMoreContainerHeight,
                    outputShowMoreContainerOffset,
                    totalHeight,
                    codeIndicatorHeight,
                    outputIndicatorHeight,
                    bottomToolbarOffset,
                    layoutState: this._layoutInfo.layoutState,
                    estimatedHasHorizontalScrolling: false
                };
            }
            this._fireOnDidChangeLayout({
                ...state,
                totalHeight: this.layoutInfo.totalHeight !== originalLayout.totalHeight,
                source,
            });
        }
        _fireOnDidChangeLayout(state) {
            this._pauseableEmitter.fire(state);
        }
        restoreEditorViewState(editorViewStates, totalHeight) {
            super.restoreEditorViewState(editorViewStates);
            if (totalHeight !== undefined && this._layoutInfo.layoutState !== notebookBrowser_1.CellLayoutState.Measured) {
                this._layoutInfo = {
                    fontInfo: this._layoutInfo.fontInfo,
                    chatHeight: this._layoutInfo.chatHeight,
                    editorHeight: this._layoutInfo.editorHeight,
                    editorWidth: this._layoutInfo.editorWidth,
                    statusBarHeight: this.layoutInfo.statusBarHeight,
                    commentHeight: this.layoutInfo.commentHeight,
                    outputContainerOffset: this._layoutInfo.outputContainerOffset,
                    outputTotalHeight: this._layoutInfo.outputTotalHeight,
                    outputShowMoreContainerHeight: this._layoutInfo.outputShowMoreContainerHeight,
                    outputShowMoreContainerOffset: this._layoutInfo.outputShowMoreContainerOffset,
                    totalHeight: totalHeight,
                    codeIndicatorHeight: this._layoutInfo.codeIndicatorHeight,
                    outputIndicatorHeight: this._layoutInfo.outputIndicatorHeight,
                    bottomToolbarOffset: this._layoutInfo.bottomToolbarOffset,
                    layoutState: notebookBrowser_1.CellLayoutState.FromCache,
                    estimatedHasHorizontalScrolling: this._layoutInfo.estimatedHasHorizontalScrolling
                };
            }
        }
        getDynamicHeight() {
            this._onLayoutInfoRead.fire();
            return this._layoutInfo.totalHeight;
        }
        getHeight(lineHeight) {
            if (this._layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.Uninitialized) {
                const estimate = this.estimateEditorHeight(lineHeight);
                return this.computeTotalHeight(estimate.editorHeight, 0, 0, 0);
            }
            else {
                return this._layoutInfo.totalHeight;
            }
        }
        estimateEditorHeight(lineHeight = 20) {
            let hasHorizontalScrolling = false;
            const cellEditorOptions = this.viewContext.getBaseCellEditorOptions(this.language);
            if (this.layoutInfo.fontInfo && cellEditorOptions.value.wordWrap === 'off') {
                for (let i = 0; i < this.lineCount; i++) {
                    const max = this.textBuffer.getLineLastNonWhitespaceColumn(i + 1);
                    const estimatedWidth = max * (this.layoutInfo.fontInfo.typicalHalfwidthCharacterWidth + this.layoutInfo.fontInfo.letterSpacing);
                    if (estimatedWidth > this.layoutInfo.editorWidth) {
                        hasHorizontalScrolling = true;
                        break;
                    }
                }
            }
            const verticalScrollbarHeight = hasHorizontalScrolling ? 12 : 0; // take zoom level into account
            const editorPadding = this.viewContext.notebookOptions.computeEditorPadding(this.internalMetadata, this.uri);
            const editorHeight = this.lineCount * lineHeight
                + editorPadding.top
                + editorPadding.bottom // EDITOR_BOTTOM_PADDING
                + verticalScrollbarHeight;
            return {
                editorHeight,
                hasHorizontalScrolling
            };
        }
        computeTotalHeight(editorHeight, outputsTotalHeight, outputShowMoreContainerHeight, chatHeight) {
            const layoutConfiguration = this.viewContext.notebookOptions.getLayoutConfiguration();
            const { bottomToolbarGap } = this.viewContext.notebookOptions.computeBottomToolbarDimensions(this.viewType);
            return layoutConfiguration.editorToolbarHeight
                + layoutConfiguration.cellTopMargin
                + chatHeight
                + editorHeight
                + this.viewContext.notebookOptions.computeEditorStatusbarHeight(this.internalMetadata, this.uri)
                + this._commentHeight
                + outputsTotalHeight
                + outputShowMoreContainerHeight
                + bottomToolbarGap
                + layoutConfiguration.cellBottomMargin;
        }
        onDidChangeTextModelContent() {
            if (this.getEditState() !== notebookBrowser_1.CellEditState.Editing) {
                this.updateEditState(notebookBrowser_1.CellEditState.Editing, 'onDidChangeTextModelContent');
                this._onDidChangeState.fire({ contentChanged: true });
            }
            this._cellDiagnostics.clear();
        }
        onDeselect() {
            this.updateEditState(notebookBrowser_1.CellEditState.Preview, 'onDeselect');
        }
        updateOutputShowMoreContainerHeight(height) {
            this.layoutChange({ outputShowMoreContainerHeight: height }, 'CodeCellViewModel#updateOutputShowMoreContainerHeight');
        }
        updateOutputMinHeight(height) {
            this.outputMinHeight = height;
        }
        unlockOutputHeight() {
            this.outputMinHeight = 0;
            this.layoutChange({ outputHeight: true });
        }
        updateOutputHeight(index, height, source) {
            if (index >= this._outputCollection.length) {
                throw new Error('Output index out of range!');
            }
            this._ensureOutputsTop();
            if (height < 28 && this._outputViewModels[index].hasMultiMimeType()) {
                height = 28;
            }
            this._outputCollection[index] = height;
            if (this._outputsTop.setValue(index, height)) {
                this.layoutChange({ outputHeight: true }, source);
            }
        }
        getOutputOffsetInContainer(index) {
            this._ensureOutputsTop();
            if (index >= this._outputCollection.length) {
                throw new Error('Output index out of range!');
            }
            return this._outputsTop.getPrefixSum(index - 1);
        }
        getOutputOffset(index) {
            return this.layoutInfo.outputContainerOffset + this.getOutputOffsetInContainer(index);
        }
        spliceOutputHeights(start, deleteCnt, heights) {
            this._ensureOutputsTop();
            this._outputsTop.removeValues(start, deleteCnt);
            if (heights.length) {
                const values = new Uint32Array(heights.length);
                for (let i = 0; i < heights.length; i++) {
                    values[i] = heights[i];
                }
                this._outputsTop.insertValues(start, values);
            }
            this.layoutChange({ outputHeight: true }, 'CodeCellViewModel#spliceOutputs');
        }
        _ensureOutputsTop() {
            if (!this._outputsTop) {
                const values = new Uint32Array(this._outputCollection.length);
                for (let i = 0; i < this._outputCollection.length; i++) {
                    values[i] = this._outputCollection[i];
                }
                this._outputsTop = new prefixSumComputer_1.PrefixSumComputer(values);
            }
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
            this._outputCollection = [];
            this._outputsTop = null;
            (0, lifecycle_1.dispose)(this._outputViewModels);
        }
    };
    exports.CodeCellViewModel = CodeCellViewModel;
    exports.CodeCellViewModel = CodeCellViewModel = __decorate([
        __param(4, configuration_1.IConfigurationService),
        __param(5, notebookService_1.INotebookService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, undoRedo_1.IUndoRedoService),
        __param(8, codeEditorService_1.ICodeEditorService),
        __param(9, instantiation_1.IInstantiationService)
    ], CodeCellViewModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUNlbGxWaWV3TW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlld01vZGVsL2NvZGVDZWxsVmlld01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXdCbkYsUUFBQSxrQkFBa0IsR0FBRyxHQUFHLENBQUM7SUFFL0IsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSxxQ0FBaUI7UUFvQnZELElBQUksZUFBZTtZQUNsQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QixDQUFDO1FBU0QsSUFBSSxZQUFZLENBQUMsTUFBYztZQUM5QixJQUFJLElBQUksQ0FBQyxhQUFhLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQ25DLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7WUFDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFFRCxJQUFJLFlBQVk7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUdELElBQUksVUFBVSxDQUFDLE1BQWM7WUFDNUIsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLE1BQU0sRUFBRSxDQUFDO2dCQUNqQyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDO1lBQzFCLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLEVBQUUsOEJBQThCLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBRUQsSUFBSSxVQUFVO1lB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