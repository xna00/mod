/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/jsonFormatter", "vs/base/common/lifecycle", "vs/editor/browser/widget/diffEditor/diffEditorWidget", "vs/workbench/contrib/notebook/browser/diff/diffCellEditorOptions", "vs/workbench/contrib/notebook/browser/diff/eventDispatcher", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/workbench/contrib/notebook/browser/notebookBrowser"], function (require, exports, event_1, hash_1, jsonFormatter_1, lifecycle_1, diffEditorWidget_1, diffCellEditorOptions_1, eventDispatcher_1, notebookDiffEditorBrowser_1, notebookBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputComparison = exports.SingleSideDiffElementViewModel = exports.SideBySideDiffElementViewModel = exports.DiffElementViewModelBase = exports.OUTPUT_EDITOR_HEIGHT_MAGIC = exports.PropertyFoldingState = void 0;
    exports.outputEqual = outputEqual;
    exports.getFormattedMetadataJSON = getFormattedMetadataJSON;
    exports.getStreamOutputData = getStreamOutputData;
    exports.getFormattedOutputJSON = getFormattedOutputJSON;
    var PropertyFoldingState;
    (function (PropertyFoldingState) {
        PropertyFoldingState[PropertyFoldingState["Expanded"] = 0] = "Expanded";
        PropertyFoldingState[PropertyFoldingState["Collapsed"] = 1] = "Collapsed";
    })(PropertyFoldingState || (exports.PropertyFoldingState = PropertyFoldingState = {}));
    exports.OUTPUT_EDITOR_HEIGHT_MAGIC = 1440;
    class DiffElementViewModelBase extends lifecycle_1.Disposable {
        set rawOutputHeight(height) {
            this._layout({ rawOutputHeight: Math.min(exports.OUTPUT_EDITOR_HEIGHT_MAGIC, height) });
        }
        get rawOutputHeight() {
            throw new Error('Use Cell.layoutInfo.rawOutputHeight');
        }
        set outputStatusHeight(height) {
            this._layout({ outputStatusHeight: height });
        }
        get outputStatusHeight() {
            throw new Error('Use Cell.layoutInfo.outputStatusHeight');
        }
        set outputMetadataHeight(height) {
            this._layout({ outputMetadataHeight: height });
        }
        get outputMetadataHeight() {
            throw new Error('Use Cell.layoutInfo.outputStatusHeight');
        }
        set editorHeight(height) {
            this._layout({ editorHeight: height });
        }
        get editorHeight() {
            throw new Error('Use Cell.layoutInfo.editorHeight');
        }
        set editorMargin(margin) {
            this._layout({ editorMargin: margin });
        }
        get editorMargin() {
            throw new Error('Use Cell.layoutInfo.editorMargin');
        }
        set metadataStatusHeight(height) {
            this._layout({ metadataStatusHeight: height });
        }
        get metadataStatusHeight() {
            throw new Error('Use Cell.layoutInfo.outputStatusHeight');
        }
        set metadataHeight(height) {
            this._layout({ metadataHeight: height });
        }
        get metadataHeight() {
            throw new Error('Use Cell.layoutInfo.metadataHeight');
        }
        set renderOutput(value) {
            this._renderOutput = value;
            this._layout({ recomputeOutput: true });
            this._stateChangeEmitter.fire({ renderOutput: this._renderOutput });
        }
        get renderOutput() {
            return this._renderOutput;
        }
        get layoutInfo() {
            return this._layoutInfo;
        }
        constructor(mainDocumentTextModel, original, modified, type, editorEventDispatcher, initData) {
            super();
            this.mainDocumentTextModel = mainDocumentTextModel;
            this.original = original;
            this.modified = modified;
            this.type = type;
            this.editorEventDispatcher = editorEventDispatcher;
            this.initData = initData;
            this._layoutInfoEmitter = this._register(new event_1.Emitter());
            this.onDidLayoutChange = this._layoutInfoEmitter.event;
            this._stateChangeEmitter = this._register(new event_1.Emitter());
            this.onDidStateChange = this._stateChangeEmitter.event;
            this._renderOutput = true;
            this._sourceEditorViewState = null;
            this._outputEditorViewState = null;
            this._metadataEditorViewState = null;
            const editorHeight = this._estimateEditorHeight(initData.fontInfo);
            this._layoutInfo = {
                width: 0,
                editorHeight: editorHeight,
                editorMargin: 0,
                metadataHeight: 0,
                metadataStatusHeight: 25,
                rawOutputHeight: 0,
                outputTotalHeight: 0,
                outputStatusHeight: 25,
                outputMetadataHeight: 0,
                bodyMargin: 32,
                totalHeight: 82 + editorHeight,
                layoutState: notebookBrowser_1.CellLayoutState.Uninitialized
            };
            this.metadataFoldingState = PropertyFoldingState.Collapsed;
            this.outputFoldingState = PropertyFoldingState.Collapsed;
            this._register(this.editorEventDispatcher.onDidChangeLayout(e => {
                this._layoutInfoEmitter.fire({ outerWidth: true });
            }));
        }
        layoutChange() {
            this._layout({ recomputeOutput: true });
        }
        _estimateEditorHeight(fontInfo) {
            const lineHeight = fontInfo?.lineHeight ?? 17;
            switch (this.type) {
                case 'unchanged':
                case 'insert':
                    {
                        const lineCount = this.modified.textModel.textBuffer.getLineCount();
                        const editorHeight = lineCount * lineHeight + diffCellEditorOptions_1.fixedEditorPadding.top + diffCellEditorOptions_1.fixedEditorPadding.bottom;
                        return editorHeight;
                    }
                case 'delete':
                case 'modified':
                    {
                        const lineCount = this.original.textModel.textBuffer.getLineCount();
                        const editorHeight = lineCount * lineHeight + diffCellEditorOptions_1.fixedEditorPadding.top + diffCellEditorOptions_1.fixedEditorPadding.bottom;
                        return editorHeight;
                    }
            }
        }
        _layout(delta) {
            const width = delta.width !== undefined ? delta.width : this._layoutInfo.width;
            const editorHeight = delta.editorHeight !== undefined ? delta.editorHeight : this._layoutInfo.editorHeight;
            const editorMargin = delta.editorMargin !== undefined ? delta.editorMargin : this._layoutInfo.editorMargin;
            const metadataHeight = delta.metadataHeight !== undefined ? delta.metadataHeight : this._layoutInfo.metadataHeight;
            const metadataStatusHeight = delta.metadataStatusHeight !== undefined ? delta.metadataStatusHeight : this._layoutInfo.metadataStatusHeight;
            const rawOutputHeight = delta.rawOutputHeight !== undefined ? delta.rawOutputHeight : this._layoutInfo.rawOutputHeight;
            const outputStatusHeight = delta.outputStatusHeight !== undefined ? delta.outputStatusHeight : this._layoutInfo.outputStatusHeight;
            const bodyMargin = delta.bodyMargin !== undefined ? delta.bodyMargin : this._layoutInfo.bodyMargin;
            const outputMetadataHeight = delta.outputMetadataHeight !== undefined ? delta.outputMetadataHeight : this._layoutInfo.outputMetadataHeight;
            const outputHeight = (delta.recomputeOutput || delta.rawOutputHeight !== undefined || delta.outputMetadataHeight !== undefined) ? this._getOutputTotalHeight(rawOutputHeight, outputMetadataHeight) : this._layoutInfo.outputTotalHeight;
            const totalHeight = editorHeight
                + editorMargin
                + metadataHeight
                + metadataStatusHeight
                + outputHeight
                + outputStatusHeight
                + bodyMargin;
            const newLayout = {
                width: width,
                editorHeight: editorHeight,
                editorMargin: editorMargin,
                metadataHeight: metadataHeight,
                metadataStatusHeight: metadataStatusHeight,
                outputTotalHeight: outputHeight,
                outputStatusHeight: outputStatusHeight,
                bodyMargin: bodyMargin,
                rawOutputHeight: rawOutputHeight,
                outputMetadataHeight: outputMetadataHeight,
                totalHeight: totalHeight,
                layoutState: notebookBrowser_1.CellLayoutState.Measured
            };
            let somethingChanged = false;
            const changeEvent = {};
            if (newLayout.width !== this._layoutInfo.width) {
                changeEvent.width = true;
                somethingChanged = true;
            }
            if (newLayout.editorHeight !== this._layoutInfo.editorHeight) {
                changeEvent.editorHeight = true;
                somethingChanged = true;
            }
            if (newLayout.editorMargin !== this._layoutInfo.editorMargin) {
                changeEvent.editorMargin = true;
                somethingChanged = true;
            }
            if (newLayout.metadataHeight !== this._layoutInfo.metadataHeight) {
                changeEvent.metadataHeight = true;
                somethingChanged = true;
            }
            if (newLayout.metadataStatusHeight !== this._layoutInfo.metadataStatusHeight) {
                changeEvent.metadataStatusHeight = true;
                somethingChanged = true;
            }
            if (newLayout.outputTotalHeight !== this._layoutInfo.outputTotalHeight) {
                changeEvent.outputTotalHeight = true;
                somethingChanged = true;
            }
            if (newLayout.outputStatusHeight !== this._layoutInfo.outputStatusHeight) {
                changeEvent.outputStatusHeight = true;
                somethingChanged = true;
            }
            if (newLayout.bodyMargin !== this._layoutInfo.bodyMargin) {
                changeEvent.bodyMargin = true;
                somethingChanged = true;
            }
            if (newLayout.outputMetadataHeight !== this._layoutInfo.outputMetadataHeight) {
                changeEvent.outputMetadataHeight = true;
                somethingChanged = true;
            }
            if (newLayout.totalHeight !== this._layoutInfo.totalHeight) {
                changeEvent.totalHeight = true;
                somethingChanged = true;
            }
            if (somethingChanged) {
                this._layoutInfo = newLayout;
                this._fireLayoutChangeEvent(changeEvent);
            }
        }
        getHeight(lineHeight) {
            if (this._layoutInfo.layoutState === notebookBrowser_1.CellLayoutState.Uninitialized) {
                const editorHeight = this.estimateEditorHeight(lineHeight);
                return this._computeTotalHeight(editorHeight);
            }
            else {
                return this._layoutInfo.totalHeight;
            }
        }
        _computeTotalHeight(editorHeight) {
            const totalHeight = editorHeight
                + this._layoutInfo.editorMargin
                + this._layoutInfo.metadataHeight
                + this._layoutInfo.metadataStatusHeight
                + this._layoutInfo.outputTotalHeight
                + this._layoutInfo.outputStatusHeight
                + this._layoutInfo.outputMetadataHeight
                + this._layoutInfo.bodyMargin;
            return totalHeight;
        }
        estimateEditorHeight(lineHeight = 20) {
            const hasScrolling = false;
            const verticalScrollbarHeight = hasScrolling ? 12 : 0; // take zoom level into account
            // const editorPadding = this.viewContext.notebookOptions.computeEditorPadding(this.internalMetadata);
            const lineCount = Math.max(this.original?.textModel.textBuffer.getLineCount() ?? 1, this.modified?.textModel.textBuffer.getLineCount() ?? 1);
            return lineCount * lineHeight
                + 24 // Top padding
                + 12 // Bottom padding
                + verticalScrollbarHeight;
        }
        _getOutputTotalHeight(rawOutputHeight, metadataHeight) {
            if (this.outputFoldingState === PropertyFoldingState.Collapsed) {
                return 0;
            }
            if (this.renderOutput) {
                if (this.isOutputEmpty()) {
                    // single line;
                    return 24;
                }
                return this.getRichOutputTotalHeight() + metadataHeight;
            }
            else {
                return rawOutputHeight;
            }
        }
        _fireLayoutChangeEvent(state) {
            this._layoutInfoEmitter.fire(state);
            this.editorEventDispatcher.emit([{ type: eventDispatcher_1.NotebookDiffViewEventType.CellLayoutChanged, source: this._layoutInfo }]);
        }
        getComputedCellContainerWidth(layoutInfo, diffEditor, fullWidth) {
            if (fullWidth) {
                return layoutInfo.width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN + (diffEditor ? diffEditorWidget_1.DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH : 0) - 2;
            }
            return (layoutInfo.width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN + (diffEditor ? diffEditorWidget_1.DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH : 0)) / 2 - 18 - 2;
        }
        getOutputEditorViewState() {
            return this._outputEditorViewState;
        }
        saveOutputEditorViewState(viewState) {
            this._outputEditorViewState = viewState;
        }
        getMetadataEditorViewState() {
            return this._metadataEditorViewState;
        }
        saveMetadataEditorViewState(viewState) {
            this._metadataEditorViewState = viewState;
        }
        getSourceEditorViewState() {
            return this._sourceEditorViewState;
        }
        saveSpirceEditorViewState(viewState) {
            this._sourceEditorViewState = viewState;
        }
    }
    exports.DiffElementViewModelBase = DiffElementViewModelBase;
    class SideBySideDiffElementViewModel extends DiffElementViewModelBase {
        get originalDocument() {
            return this.otherDocumentTextModel;
        }
        get modifiedDocument() {
            return this.mainDocumentTextModel;
        }
        constructor(mainDocumentTextModel, otherDocumentTextModel, original, modified, type, editorEventDispatcher, initData) {
            super(mainDocumentTextModel, original, modified, type, editorEventDispatcher, initData);
            this.otherDocumentTextModel = otherDocumentTextModel;
            this.original = original;
            this.modified = modified;
            this.type = type;
            this.metadataFoldingState = PropertyFoldingState.Collapsed;
            this.outputFoldingState = PropertyFoldingState.Collapsed;
            if (this.checkMetadataIfModified()) {
                this.metadataFoldingState = PropertyFoldingState.Expanded;
            }
            if (this.checkIfOutputsModified()) {
                this.outputFoldingState = PropertyFoldingState.Expanded;
            }
            this._register(this.original.onDidChangeOutputLayout(() => {
                this._layout({ recomputeOutput: true });
            }));
            this._register(this.modified.onDidChangeOutputLayout(() => {
                this._layout({ recomputeOutput: true });
            }));
            this._register(this.modified.textModel.onDidChangeContent(() => {
                if (mainDocumentTextModel.transientOptions.cellContentMetadata) {
                    const cellMetadataKeys = [...Object.keys(mainDocumentTextModel.transientOptions.cellContentMetadata)];
                    const modifiedMedataRaw = Object.assign({}, this.modified.metadata);
                    const originalCellMetadata = this.original.metadata;
                    for (const key of cellMetadataKeys) {
                        modifiedMedataRaw[key] = originalCellMetadata[key];
                    }
                    this.modified.textModel.metadata = modifiedMedataRaw;
                }
            }));
        }
        checkIfOutputsModified() {
            if (this.mainDocumentTextModel.transientOptions.transientOutputs) {
                return false;
            }
            const ret = outputsEqual(this.original?.outputs ?? [], this.modified?.outputs ?? []);
            if (ret === 0 /* OutputComparison.Unchanged */) {
                return false;
            }
            return {
                reason: ret === 1 /* OutputComparison.Metadata */ ? 'Output metadata is changed' : undefined,
                kind: ret
            };
        }
        checkMetadataIfModified() {
            const modified = (0, hash_1.hash)(getFormattedMetadataJSON(this.mainDocumentTextModel, this.original?.metadata || {}, this.original?.language)) !== (0, hash_1.hash)(getFormattedMetadataJSON(this.mainDocumentTextModel, this.modified?.metadata ?? {}, this.modified?.language));
            if (modified) {
                return { reason: undefined };
            }
            else {
                return false;
            }
        }
        updateOutputHeight(diffSide, index, height) {
            if (diffSide === notebookDiffEditorBrowser_1.DiffSide.Original) {
                this.original.updateOutputHeight(index, height);
            }
            else {
                this.modified.updateOutputHeight(index, height);
            }
        }
        getOutputOffsetInContainer(diffSide, index) {
            if (diffSide === notebookDiffEditorBrowser_1.DiffSide.Original) {
                return this.original.getOutputOffset(index);
            }
            else {
                return this.modified.getOutputOffset(index);
            }
        }
        getOutputOffsetInCell(diffSide, index) {
            const offsetInOutputsContainer = this.getOutputOffsetInContainer(diffSide, index);
            return this._layoutInfo.editorHeight
                + this._layoutInfo.editorMargin
                + this._layoutInfo.metadataHeight
                + this._layoutInfo.metadataStatusHeight
                + this._layoutInfo.outputStatusHeight
                + this._layoutInfo.bodyMargin / 2
                + offsetInOutputsContainer;
        }
        isOutputEmpty() {
            if (this.mainDocumentTextModel.transientOptions.transientOutputs) {
                return true;
            }
            if (this.checkIfOutputsModified()) {
                return false;
            }
            // outputs are not changed
            return (this.original?.outputs || []).length === 0;
        }
        getRichOutputTotalHeight() {
            return Math.max(this.original.getOutputTotalHeight(), this.modified.getOutputTotalHeight());
        }
        getNestedCellViewModel(diffSide) {
            return diffSide === notebookDiffEditorBrowser_1.DiffSide.Original ? this.original : this.modified;
        }
        getCellByUri(cellUri) {
            if (cellUri.toString() === this.original.uri.toString()) {
                return this.original;
            }
            else {
                return this.modified;
            }
        }
    }
    exports.SideBySideDiffElementViewModel = SideBySideDiffElementViewModel;
    class SingleSideDiffElementViewModel extends DiffElementViewModelBase {
        get cellViewModel() {
            return this.type === 'insert' ? this.modified : this.original;
        }
        get originalDocument() {
            if (this.type === 'insert') {
                return this.otherDocumentTextModel;
            }
            else {
                return this.mainDocumentTextModel;
            }
        }
        get modifiedDocument() {
            if (this.type === 'insert') {
                return this.mainDocumentTextModel;
            }
            else {
                return this.otherDocumentTextModel;
            }
        }
        constructor(mainDocumentTextModel, otherDocumentTextModel, original, modified, type, editorEventDispatcher, initData) {
            super(mainDocumentTextModel, original, modified, type, editorEventDispatcher, initData);
            this.otherDocumentTextModel = otherDocumentTextModel;
            this.type = type;
            this._register(this.cellViewModel.onDidChangeOutputLayout(() => {
                this._layout({ recomputeOutput: true });
            }));
        }
        getNestedCellViewModel(diffSide) {
            return this.type === 'insert' ? this.modified : this.original;
        }
        checkIfOutputsModified() {
            return false;
        }
        checkMetadataIfModified() {
            return false;
        }
        updateOutputHeight(diffSide, index, height) {
            this.cellViewModel?.updateOutputHeight(index, height);
        }
        getOutputOffsetInContainer(diffSide, index) {
            return this.cellViewModel.getOutputOffset(index);
        }
        getOutputOffsetInCell(diffSide, index) {
            const offsetInOutputsContainer = this.cellViewModel.getOutputOffset(index);
            return this._layoutInfo.editorHeight
                + this._layoutInfo.editorMargin
                + this._layoutInfo.metadataHeight
                + this._layoutInfo.metadataStatusHeight
                + this._layoutInfo.outputStatusHeight
                + this._layoutInfo.bodyMargin / 2
                + offsetInOutputsContainer;
        }
        isOutputEmpty() {
            if (this.mainDocumentTextModel.transientOptions.transientOutputs) {
                return true;
            }
            // outputs are not changed
            return (this.original?.outputs || this.modified?.outputs || []).length === 0;
        }
        getRichOutputTotalHeight() {
            return this.cellViewModel?.getOutputTotalHeight() ?? 0;
        }
        getCellByUri(cellUri) {
            return this.cellViewModel;
        }
    }
    exports.SingleSideDiffElementViewModel = SingleSideDiffElementViewModel;
    var OutputComparison;
    (function (OutputComparison) {
        OutputComparison[OutputComparison["Unchanged"] = 0] = "Unchanged";
        OutputComparison[OutputComparison["Metadata"] = 1] = "Metadata";
        OutputComparison[OutputComparison["Other"] = 2] = "Other";
    })(OutputComparison || (exports.OutputComparison = OutputComparison = {}));
    function outputEqual(a, b) {
        if ((0, hash_1.hash)(a.metadata) === (0, hash_1.hash)(b.metadata)) {
            return 2 /* OutputComparison.Other */;
        }
        // metadata not equal
        for (let j = 0; j < a.outputs.length; j++) {
            const aOutputItem = a.outputs[j];
            const bOutputItem = b.outputs[j];
            if (aOutputItem.mime !== bOutputItem.mime) {
                return 2 /* OutputComparison.Other */;
            }
            if (aOutputItem.data.buffer.length !== bOutputItem.data.buffer.length) {
                return 2 /* OutputComparison.Other */;
            }
            for (let k = 0; k < aOutputItem.data.buffer.length; k++) {
                if (aOutputItem.data.buffer[k] !== bOutputItem.data.buffer[k]) {
                    return 2 /* OutputComparison.Other */;
                }
            }
        }
        return 1 /* OutputComparison.Metadata */;
    }
    function outputsEqual(original, modified) {
        if (original.length !== modified.length) {
            return 2 /* OutputComparison.Other */;
        }
        const len = original.length;
        for (let i = 0; i < len; i++) {
            const a = original[i];
            const b = modified[i];
            if ((0, hash_1.hash)(a.metadata) !== (0, hash_1.hash)(b.metadata)) {
                return 1 /* OutputComparison.Metadata */;
            }
            if (a.outputs.length !== b.outputs.length) {
                return 2 /* OutputComparison.Other */;
            }
            for (let j = 0; j < a.outputs.length; j++) {
                const aOutputItem = a.outputs[j];
                const bOutputItem = b.outputs[j];
                if (aOutputItem.mime !== bOutputItem.mime) {
                    return 2 /* OutputComparison.Other */;
                }
                if (aOutputItem.data.buffer.length !== bOutputItem.data.buffer.length) {
                    return 2 /* OutputComparison.Other */;
                }
                for (let k = 0; k < aOutputItem.data.buffer.length; k++) {
                    if (aOutputItem.data.buffer[k] !== bOutputItem.data.buffer[k]) {
                        return 2 /* OutputComparison.Other */;
                    }
                }
            }
        }
        return 0 /* OutputComparison.Unchanged */;
    }
    function getFormattedMetadataJSON(documentTextModel, metadata, language) {
        let filteredMetadata = {};
        if (documentTextModel) {
            const transientCellMetadata = documentTextModel.transientOptions.transientCellMetadata;
            const keys = new Set([...Object.keys(metadata)]);
            for (const key of keys) {
                if (!(transientCellMetadata[key])) {
                    filteredMetadata[key] = metadata[key];
                }
            }
        }
        else {
            filteredMetadata = metadata;
        }
        const obj = {
            language,
            ...filteredMetadata
        };
        const metadataSource = (0, jsonFormatter_1.toFormattedString)(obj, {});
        return metadataSource;
    }
    function getStreamOutputData(outputs) {
        if (!outputs.length) {
            return null;
        }
        const first = outputs[0];
        const mime = first.mime;
        const sameStream = !outputs.find(op => op.mime !== mime);
        if (sameStream) {
            return outputs.map(opit => opit.data.toString()).join('');
        }
        else {
            return null;
        }
    }
    function getFormattedOutputJSON(outputs) {
        if (outputs.length === 1) {
            const streamOutputData = getStreamOutputData(outputs[0].outputs);
            if (streamOutputData) {
                return streamOutputData;
            }
        }
        return JSON.stringify(outputs.map(output => {
            return ({
                metadata: output.metadata,
                outputItems: output.outputs.map(opit => ({
                    mimeType: opit.mime,
                    data: opit.data.toString()
                }))
            });
        }), undefined, '\t');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVsZW1lbnRWaWV3TW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvZGlmZi9kaWZmRWxlbWVudFZpZXdNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxbkJoRyxrQ0EwQkM7SUEyQ0QsNERBeUJDO0lBRUQsa0RBY0M7SUFFRCx3REFpQkM7SUFudUJELElBQVksb0JBR1g7SUFIRCxXQUFZLG9CQUFvQjtRQUMvQix1RUFBUSxDQUFBO1FBQ1IseUVBQVMsQ0FBQTtJQUNWLENBQUMsRUFIVyxvQkFBb0Isb0NBQXBCLG9CQUFvQixRQUcvQjtJQUVZLFFBQUEsMEJBQTBCLEdBQUcsSUFBSSxDQUFDO0lBUS9DLE1BQXNCLHdCQUF5QixTQUFRLHNCQUFVO1FBU2hFLElBQUksZUFBZSxDQUFDLE1BQWM7WUFDakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLGtDQUEwQixFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqRixDQUFDO1FBRUQsSUFBSSxlQUFlO1lBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRUQsSUFBSSxrQkFBa0IsQ0FBQyxNQUFjO1lBQ3BDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxrQkFBa0IsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxJQUFJLGtCQUFrQjtZQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUVELElBQUksb0JBQW9CLENBQUMsTUFBYztZQUN0QyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsb0JB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