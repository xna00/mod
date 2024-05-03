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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/markdownRenderer", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/base/common/themables", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/contrib/notebook/browser/controller/cellOutputActions", "vs/workbench/contrib/notebook/browser/controller/editActions", "vs/workbench/contrib/notebook/browser/contrib/clipboard/cellOutputClipboard"], function (require, exports, DOM, markdownRenderer_1, actions_1, lifecycle_1, nls, menuEntryActionViewItem_1, toolbar_1, actions_2, contextkey_1, instantiation_1, opener_1, quickInput_1, themables_1, extensions_1, notebookBrowser_1, notebookIcons_1, cellPart_1, notebookCommon_1, notebookExecutionStateService_1, notebookService_1, panecomposite_1, cellOutputActions_1, editActions_1, cellOutputClipboard_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellOutputContainer = void 0;
    // DOM structure
    //
    //  #output
    //  |
    //  |  #output-inner-container
    //  |                        |  #cell-output-toolbar
    //  |                        |  #output-element
    //  |                        |  #output-element
    //  |                        |  #output-element
    //  |  #output-inner-container
    //  |                        |  #cell-output-toolbar
    //  |                        |  #output-element
    //  |  #output-inner-container
    //  |                        |  #cell-output-toolbar
    //  |                        |  #output-element
    let CellOutputElement = class CellOutputElement extends lifecycle_1.Disposable {
        constructor(notebookEditor, viewCell, cellOutputContainer, outputContainer, output, notebookService, quickInputService, parentContextKeyService, menuService, paneCompositeService, instantiationService) {
            super();
            this.notebookEditor = notebookEditor;
            this.viewCell = viewCell;
            this.cellOutputContainer = cellOutputContainer;
            this.outputContainer = outputContainer;
            this.output = output;
            this.notebookService = notebookService;
            this.quickInputService = quickInputService;
            this.menuService = menuService;
            this.paneCompositeService = paneCompositeService;
            this.instantiationService = instantiationService;
            this._renderDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._outputHeightTimer = null;
            this.contextKeyService = parentContextKeyService;
            this._register(this.output.model.onDidChangeData(() => {
                this.rerender();
            }));
            this._register(this.output.onDidResetRenderer(() => {
                this.rerender();
            }));
        }
        detach() {
            this.renderedOutputContainer?.parentElement?.removeChild(this.renderedOutputContainer);
            let count = 0;
            if (this.innerContainer) {
                for (let i = 0; i < this.innerContainer.childNodes.length; i++) {
                    if (this.innerContainer.childNodes[i].className === 'rendered-output') {
                        count++;
                    }
                    if (count > 1) {
                        break;
                    }
                }
                if (count === 0) {
                    this.innerContainer.parentElement?.removeChild(this.innerContainer);
                }
            }
            this.notebookEditor.removeInset(this.output);
        }
        updateDOMTop(top) {
            if (this.innerContainer) {
                this.innerContainer.style.top = `${top}px`;
            }
        }
        rerender() {
            if (this.notebookEditor.hasModel() &&
                this.innerContainer &&
                this.renderResult &&
                this.renderResult.type === 1 /* RenderOutputType.Extension */) {
                // Output rendered by extension renderer got an update
                const [mimeTypes, pick] = this.output.resolveMimeTypes(this.notebookEditor.textModel, this.notebookEditor.activeKernel?.preloadProvides);
                const pickedMimeType = mimeTypes[pick];
                if (pickedMimeType.mimeType === this.renderResult.mimeType && pickedMimeType.rendererId === this.renderResult.renderer.id) {
                    // Same mimetype, same renderer, call the extension renderer to update
                    const index = this.viewCell.outputsViewModels.indexOf(this.output);
                    this.notebookEditor.updateOutput(this.viewCell, this.renderResult, this.viewCell.getOutputOffset(index));
                    return;
                }
            }
            if (!this.innerContainer) {
                // init rendering didn't happen
                const currOutputIndex = this.cellOutputContainer.renderedOutputEntries.findIndex(entry => entry.element === this);
                const previousSibling = currOutputIndex > 0 && !!(this.cellOutputContainer.renderedOutputEntries[currOutputIndex - 1].element.innerContainer?.parentElement)
                    ? this.cellOutputContainer.renderedOutputEntries[currOutputIndex - 1].element.innerContainer
                    : undefined;
                this.render(previousSibling);
            }
            else {
                // Another mimetype or renderer is picked, we need to clear the current output and re-render
                const nextElement = this.innerContainer.nextElementSibling;
                this._renderDisposableStore.clear();
                const element = this.innerContainer;
                if (element) {
                    element.parentElement?.removeChild(element);
                    this.notebookEditor.removeInset(this.output);
                }
                this.render(nextElement);
            }
            this._relayoutCell();
        }
        // insert after previousSibling
        _generateInnerOutputContainer(previousSibling, pickedMimeTypeRenderer) {
            this.innerContainer = DOM.$('.output-inner-container');
            if (previousSibling && previousSibling.nextElementSibling) {
                this.outputContainer.domNode.insertBefore(this.innerContainer, previousSibling.nextElementSibling);
            }
            else {
                this.outputContainer.domNode.appendChild(this.innerContainer);
            }
            this.innerContainer.setAttribute('output-mime-type', pickedMimeTypeRenderer.mimeType);
            return this.innerContainer;
        }
        render(previousSibling) {
            const index = this.viewCell.outputsViewModels.indexOf(this.output);
            if (this.viewCell.isOutputCollapsed || !this.notebookEditor.hasModel()) {
                this.cellOutputContainer.flagAsStale();
                return undefined;
            }
            const notebookUri = notebookCommon_1.CellUri.parse(this.viewCell.uri)?.notebook;
            if (!notebookUri) {
                return undefined;
            }
            const notebookTextModel = this.notebookEditor.textModel;
            const [mimeTypes, pick] = this.output.resolveMimeTypes(notebookTextModel, this.notebookEditor.activeKernel?.preloadProvides);
            if (!mimeTypes.find(mimeType => mimeType.isTrusted) || mimeTypes.length === 0) {
                this.viewCell.updateOutputHeight(index, 0, 'CellOutputElement#noMimeType');
                return undefined;
            }
            const selectedPresentation = mimeTypes[pick];
            let renderer = this.notebookService.getRendererInfo(selectedPresentation.rendererId);
            if (!renderer && selectedPresentation.mimeType.indexOf('text/') > -1) {
                renderer = this.notebookService.getRendererInfo('vscode.builtin-renderer');
            }
            const innerContainer = this._generateInnerOutputContainer(previousSibling, selectedPresentation);
            this._attachToolbar(innerContainer, notebookTextModel, this.notebookEditor.activeKernel, index, mimeTypes);
            this.renderedOutputContainer = DOM.append(innerContainer, DOM.$('.rendered-output'));
            this.renderResult = renderer
                ? { type: 1 /* RenderOutputType.Extension */, renderer, source: this.output, mimeType: selectedPresentation.mimeType }
                : this._renderMissingRenderer(this.output, selectedPresentation.mimeType);
            this.output.pickedMimeType = selectedPresentation;
            if (!this.renderResult) {
                this.viewCell.updateOutputHeight(index, 0, 'CellOutputElement#renderResultUndefined');
                return undefined;
            }
            this.notebookEditor.createOutput(this.viewCell, this.renderResult, this.viewCell.getOutputOffset(index), false);
            innerContainer.classList.add('background');
            return { initRenderIsSynchronous: false };
        }
        _renderMissingRenderer(viewModel, preferredMimeType) {
            if (!viewModel.model.outputs.length) {
                return this._renderMessage(viewModel, nls.localize('empty', "Cell has no output"));
            }
            if (!preferredMimeType) {
                const mimeTypes = viewModel.model.outputs.map(op => op.mime);
                const mimeTypesMessage = mimeTypes.join(', ');
                return this._renderMessage(viewModel, nls.localize('noRenderer.2', "No renderer could be found for output. It has the following mimetypes: {0}", mimeTypesMessage));
            }
            return this._renderSearchForMimetype(viewModel, preferredMimeType);
        }
        _renderSearchForMimetype(viewModel, mimeType) {
            const query = `@tag:notebookRenderer ${mimeType}`;
            const p = DOM.$('p', undefined, `No renderer could be found for mimetype "${mimeType}", but one might be available on the Marketplace.`);
            const a = DOM.$('a', { href: `command:workbench.extensions.search?%22${query}%22`, class: 'monaco-button monaco-text-button', tabindex: 0, role: 'button', style: 'padding: 8px; text-decoration: none; color: rgb(255, 255, 255); background-color: rgb(14, 99, 156); max-width: 200px;' }, `Search Marketplace`);
            return {
                type: 0 /* RenderOutputType.Html */,
                source: viewModel,
                htmlContent: p.outerHTML + a.outerHTML
            };
        }
        _renderMessage(viewModel, message) {
            const el = DOM.$('p', undefined, message);
            return { type: 0 /* RenderOutputType.Html */, source: viewModel, htmlContent: el.outerHTML };
        }
        shouldEnableCopy(mimeTypes) {
            if (!mimeTypes.find(mimeType => cellOutputClipboard_1.TEXT_BASED_MIMETYPES.indexOf(mimeType.mimeType) || mimeType.mimeType.startsWith('image/'))) {
                return false;
            }
            if ((0, notebookCommon_1.isTextStreamMime)(mimeTypes[0].mimeType)) {
                const cellViewModel = this.output.cellViewModel;
                const index = cellViewModel.outputsViewModels.indexOf(this.output);
                if (index > 0) {
                    const previousOutput = cellViewModel.model.outputs[index - 1];
                    // if the previous output was also a stream, the copy command will be in that output instead
                    return !(0, notebookCommon_1.isTextStreamMime)(previousOutput.outputs[0].mime);
                }
            }
            return true;
        }
        async _attachToolbar(outputItemDiv, notebookTextModel, kernel, index, mimeTypes) {
            const hasMultipleMimeTypes = mimeTypes.filter(mimeType => mimeType.isTrusted).length > 1;
            const isCopyEnabled = this.shouldEnableCopy(mimeTypes);
            if (index > 0 && !hasMultipleMimeTypes && !isCopyEnabled) {
                // nothing to put in the toolbar
                return;
            }
            if (!this.notebookEditor.hasModel()) {
                return;
            }
            const useConsolidatedButton = this.notebookEditor.notebookOptions.getDisplayOptions().consolidatedOutputButton;
            outputItemDiv.style.position = 'relative';
            const mimeTypePicker = DOM.$('.cell-output-toolbar');
            outputItemDiv.appendChild(mimeTypePicker);
            const toolbar = this._renderDisposableStore.add(this.instantiationService.createInstance(toolbar_1.WorkbenchToolBar, mimeTypePicker, {
                renderDropdownAsChildElement: false
            }));
            toolbar.context = {
                ui: true,
                cell: this.output.cellViewModel,
                outputViewModel: this.output,
                notebookEditor: this.notebookEditor,
                $mid: 13 /* MarshalledId.NotebookCellActionContext */
            };
            // TODO: This could probably be a real registered action, but it has to talk to this output element
            const pickAction = new actions_1.Action('notebook.output.pickMimetype', nls.localize('pickMimeType', "Change Presentation"), themables_1.ThemeIcon.asClassName(notebookIcons_1.mimetypeIcon), undefined, async (_context) => this._pickActiveMimeTypeRenderer(outputItemDiv, notebookTextModel, kernel, this.output));
            const menu = this._renderDisposableStore.add(this.menuService.createMenu(actions_2.MenuId.NotebookOutputToolbar, this.contextKeyService));
            const updateMenuToolbar = () => {
                const primary = [];
                let secondary = [];
                const result = { primary, secondary };
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result, () => false);
                if (index > 0 || !useConsolidatedButton) {
                    // clear outputs should only appear in the first output item's menu
                    secondary = secondary.filter((action) => action.id !== editActions_1.CLEAR_CELL_OUTPUTS_COMMAND_ID);
                }
                if (!isCopyEnabled) {
                    secondary = secondary.filter((action) => action.id !== cellOutputActions_1.COPY_OUTPUT_COMMAND_ID);
                }
                if (hasMultipleMimeTypes) {
                    secondary = [pickAction, ...secondary];
                }
                toolbar.setActions([], secondary);
            };
            updateMenuToolbar();
            this._renderDisposableStore.add(menu.onDidChange(updateMenuToolbar));
        }
        async _pickActiveMimeTypeRenderer(outputItemDiv, notebookTextModel, kernel, viewModel) {
            const [mimeTypes, currIndex] = viewModel.resolveMimeTypes(notebookTextModel, kernel?.preloadProvides);
            const items = [];
            const unsupportedItems = [];
            mimeTypes.forEach((mimeType, index) => {
                if (mimeType.isTrusted) {
                    const arr = mimeType.rendererId === notebookCommon_1.RENDERER_NOT_AVAILABLE ?
                        unsupportedItems :
                        items;
                    arr.push({
                        label: mimeType.mimeType,
                        id: mimeType.mimeType,
                        index: index,
                        picked: index === currIndex,
                        detail: this._generateRendererInfo(mimeType.rendererId),
                        description: index === currIndex ? nls.localize('curruentActiveMimeType', "Currently Active") : undefined
                    });
                }
            });
            if (unsupportedItems.some(m => JUPYTER_RENDERER_MIMETYPES.includes(m.id))) {
                unsupportedItems.push({
                    label: nls.localize('installJupyterPrompt', "Install additional renderers from the marketplace"),
                    id: 'installRenderers',
                    index: mimeTypes.length
                });
            }
            const picker = this.quickInputService.createQuickPick();
            picker.items = [
                ...items,
                { type: 'separator' },
                ...unsupportedItems
            ];
            picker.activeItems = items.filter(item => !!item.picked);
            picker.placeholder = items.length !== mimeTypes.length
                ? nls.localize('promptChooseMimeTypeInSecure.placeHolder', "Select mimetype to render for current output")
                : nls.localize('promptChooseMimeType.placeHolder', "Select mimetype to render for current output");
            const pick = await new Promise(resolve => {
                picker.onDidAccept(() => {
                    resolve(picker.selectedItems.length === 1 ? picker.selectedItems[0] : undefined);
                    picker.dispose();
                });
                picker.show();
            });
            if (pick === undefined || pick.index === currIndex) {
                return;
            }
            if (pick.id === 'installRenderers') {
                this._showJupyterExtension();
                return;
            }
            // user chooses another mimetype
            const nextElement = outputItemDiv.nextElementSibling;
            this._renderDisposableStore.clear();
            const element = this.innerContainer;
            if (element) {
                element.parentElement?.removeChild(element);
                this.notebookEditor.removeInset(viewModel);
            }
            viewModel.pickedMimeType = mimeTypes[pick.index];
            this.viewCell.updateOutputMinHeight(this.viewCell.layoutInfo.outputTotalHeight);
            const { mimeType, rendererId } = mimeTypes[pick.index];
            this.notebookService.updateMimePreferredRenderer(notebookTextModel.viewType, mimeType, rendererId, mimeTypes.map(m => m.mimeType));
            this.render(nextElement);
            this._validateFinalOutputHeight(false);
            this._relayoutCell();
        }
        async _showJupyterExtension() {
            const viewlet = await this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            const view = viewlet?.getViewPaneContainer();
            view?.search(`@id:${notebookBrowser_1.JUPYTER_EXTENSION_ID}`);
        }
        _generateRendererInfo(renderId) {
            const renderInfo = this.notebookService.getRendererInfo(renderId);
            if (renderInfo) {
                const displayName = renderInfo.displayName !== '' ? renderInfo.displayName : renderInfo.id;
                return `${displayName} (${renderInfo.extensionId.value})`;
            }
            return nls.localize('unavailableRenderInfo', "renderer not available");
        }
        _validateFinalOutputHeight(synchronous) {
            if (this._outputHeightTimer !== null) {
                clearTimeout(this._outputHeightTimer);
            }
            if (synchronous) {
                this.viewCell.unlockOutputHeight();
            }
            else {
                this._outputHeightTimer = setTimeout(() => {
                    this.viewCell.unlockOutputHeight();
                }, 1000);
            }
        }
        _relayoutCell() {
            this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
        }
        dispose() {
            if (this._outputHeightTimer) {
                this.viewCell.unlockOutputHeight();
                clearTimeout(this._outputHeightTimer);
            }
            super.dispose();
        }
    };
    CellOutputElement = __decorate([
        __param(5, notebookService_1.INotebookService),
        __param(6, quickInput_1.IQuickInputService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, actions_2.IMenuService),
        __param(9, panecomposite_1.IPaneCompositePartService),
        __param(10, instantiation_1.IInstantiationService)
    ], CellOutputElement);
    class OutputEntryViewHandler {
        constructor(model, element) {
            this.model = model;
            this.element = element;
        }
    }
    var CellOutputUpdateContext;
    (function (CellOutputUpdateContext) {
        CellOutputUpdateContext[CellOutputUpdateContext["Execution"] = 1] = "Execution";
        CellOutputUpdateContext[CellOutputUpdateContext["Other"] = 2] = "Other";
    })(CellOutputUpdateContext || (CellOutputUpdateContext = {}));
    let CellOutputContainer = class CellOutputContainer extends cellPart_1.CellContentPart {
        get renderedOutputEntries() {
            return this._outputEntries;
        }
        constructor(notebookEditor, viewCell, templateData, options, openerService, _notebookExecutionStateService, instantiationService) {
            super();
            this.notebookEditor = notebookEditor;
            this.viewCell = viewCell;
            this.templateData = templateData;
            this.options = options;
            this.openerService = openerService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this.instantiationService = instantiationService;
            this._outputEntries = [];
            this._hasStaleOutputs = false;
            this._outputHeightTimer = null;
            this._register(viewCell.onDidStartExecution(() => {
                viewCell.updateOutputMinHeight(viewCell.layoutInfo.outputTotalHeight);
            }));
            this._register(viewCell.onDidStopExecution(() => {
                this._validateFinalOutputHeight(false);
            }));
            this._register(viewCell.onDidChangeOutputs(splice => {
                const executionState = this._notebookExecutionStateService.getCellExecution(viewCell.uri);
                const context = executionState ? 1 /* CellOutputUpdateContext.Execution */ : 2 /* CellOutputUpdateContext.Other */;
                this._updateOutputs(splice, context);
            }));
            this._register(viewCell.onDidChangeLayout(() => {
                this.updateInternalLayoutNow(viewCell);
            }));
        }
        updateInternalLayoutNow(viewCell) {
            this.templateData.outputContainer.setTop(viewCell.layoutInfo.outputContainerOffset);
            this.templateData.outputShowMoreContainer.setTop(viewCell.layoutInfo.outputShowMoreContainerOffset);
            this._outputEntries.forEach(entry => {
                const index = this.viewCell.outputsViewModels.indexOf(entry.model);
                if (index >= 0) {
                    const top = this.viewCell.getOutputOffsetInContainer(index);
                    entry.element.updateDOMTop(top);
                }
            });
        }
        render() {
            try {
                this._doRender();
            }
            finally {
                // TODO@rebornix, this is probably not necessary at all as cell layout change would send the update request.
                this._relayoutCell();
            }
        }
        /**
         * Notify that an output may have been swapped out without the model getting rendered.
         */
        flagAsStale() {
            this._hasStaleOutputs = true;
        }
        _doRender() {
            if (this.viewCell.outputsViewModels.length > 0) {
                if (this.viewCell.layoutInfo.outputTotalHeight !== 0) {
                    this.viewCell.updateOutputMinHeight(this.viewCell.layoutInfo.outputTotalHeight);
                }
                DOM.show(this.templateData.outputContainer.domNode);
                for (let index = 0; index < Math.min(this.options.limit, this.viewCell.outputsViewModels.length); index++) {
                    const currOutput = this.viewCell.outputsViewModels[index];
                    const entry = this.instantiationService.createInstance(CellOutputElement, this.notebookEditor, this.viewCell, this, this.templateData.outputContainer, currOutput);
                    this._outputEntries.push(new OutputEntryViewHandler(currOutput, entry));
                    entry.render(undefined);
                }
                if (this.viewCell.outputsViewModels.length > this.options.limit) {
                    DOM.show(this.templateData.outputShowMoreContainer.domNode);
                    this.viewCell.updateOutputShowMoreContainerHeight(46);
                }
                this._validateFinalOutputHeight(false);
            }
            else {
                // noop
                DOM.hide(this.templateData.outputContainer.domNode);
            }
            this.templateData.outputShowMoreContainer.domNode.innerText = '';
            if (this.viewCell.outputsViewModels.length > this.options.limit) {
                this.templateData.outputShowMoreContainer.domNode.appendChild(this._generateShowMoreElement(this.templateData.templateDisposables));
            }
            else {
                DOM.hide(this.templateData.outputShowMoreContainer.domNode);
                this.viewCell.updateOutputShowMoreContainerHeight(0);
            }
        }
        viewUpdateShowOutputs(initRendering) {
            if (this._hasStaleOutputs) {
                this._hasStaleOutputs = false;
                this._outputEntries.forEach(entry => {
                    entry.element.rerender();
                });
            }
            for (let index = 0; index < this._outputEntries.length; index++) {
                const viewHandler = this._outputEntries[index];
                const outputEntry = viewHandler.element;
                if (outputEntry.renderResult) {
                    this.notebookEditor.createOutput(this.viewCell, outputEntry.renderResult, this.viewCell.getOutputOffset(index), false);
                }
                else {
                    outputEntry.render(undefined);
                }
            }
            this._relayoutCell();
        }
        viewUpdateHideOuputs() {
            for (let index = 0; index < this._outputEntries.length; index++) {
                this.notebookEditor.hideInset(this._outputEntries[index].model);
            }
        }
        _validateFinalOutputHeight(synchronous) {
            if (this._outputHeightTimer !== null) {
                clearTimeout(this._outputHeightTimer);
            }
            const executionState = this._notebookExecutionStateService.getCellExecution(this.viewCell.uri);
            if (synchronous) {
                this.viewCell.unlockOutputHeight();
            }
            else if (executionState?.state !== notebookCommon_1.NotebookCellExecutionState.Executing) {
                this._outputHeightTimer = setTimeout(() => {
                    this.viewCell.unlockOutputHeight();
                }, 200);
            }
        }
        _updateOutputs(splice, context = 2 /* CellOutputUpdateContext.Other */) {
            const previousOutputHeight = this.viewCell.layoutInfo.outputTotalHeight;
            // for cell output update, we make sure the cell does not shrink before the new outputs are rendered.
            this.viewCell.updateOutputMinHeight(previousOutputHeight);
            if (this.viewCell.outputsViewModels.length) {
                DOM.show(this.templateData.outputContainer.domNode);
            }
            else {
                DOM.hide(this.templateData.outputContainer.domNode);
            }
            this.viewCell.spliceOutputHeights(splice.start, splice.deleteCount, splice.newOutputs.map(_ => 0));
            this._renderNow(splice, context);
        }
        _renderNow(splice, context) {
            if (splice.start >= this.options.limit) {
                // splice items out of limit
                return;
            }
            const firstGroupEntries = this._outputEntries.slice(0, splice.start);
            const deletedEntries = this._outputEntries.slice(splice.start, splice.start + splice.deleteCount);
            const secondGroupEntries = this._outputEntries.slice(splice.start + splice.deleteCount);
            let newlyInserted = this.viewCell.outputsViewModels.slice(splice.start, splice.start + splice.newOutputs.length);
            // [...firstGroup, ...deletedEntries, ...secondGroupEntries]  [...restInModel]
            // [...firstGroup, ...newlyInserted, ...secondGroupEntries, restInModel]
            if (firstGroupEntries.length + newlyInserted.length + secondGroupEntries.length > this.options.limit) {
                // exceeds limit again
                if (firstGroupEntries.length + newlyInserted.length > this.options.limit) {
                    [...deletedEntries, ...secondGroupEntries].forEach(entry => {
                        entry.element.detach();
                        entry.element.dispose();
                    });
                    newlyInserted = newlyInserted.slice(0, this.options.limit - firstGroupEntries.length);
                    const newlyInsertedEntries = newlyInserted.map(insert => {
                        return new OutputEntryViewHandler(insert, this.instantiationService.createInstance(CellOutputElement, this.notebookEditor, this.viewCell, this, this.templateData.outputContainer, insert));
                    });
                    this._outputEntries = [...firstGroupEntries, ...newlyInsertedEntries];
                    // render newly inserted outputs
                    for (let i = firstGroupEntries.length; i < this._outputEntries.length; i++) {
                        this._outputEntries[i].element.render(undefined);
                    }
                }
                else {
                    // part of secondGroupEntries are pushed out of view
                    // now we have to be creative as secondGroupEntries might not use dedicated containers
                    const elementsPushedOutOfView = secondGroupEntries.slice(this.options.limit - firstGroupEntries.length - newlyInserted.length);
                    [...deletedEntries, ...elementsPushedOutOfView].forEach(entry => {
                        entry.element.detach();
                        entry.element.dispose();
                    });
                    // exclusive
                    const reRenderRightBoundary = firstGroupEntries.length + newlyInserted.length;
                    const newlyInsertedEntries = newlyInserted.map(insert => {
                        return new OutputEntryViewHandler(insert, this.instantiationService.createInstance(CellOutputElement, this.notebookEditor, this.viewCell, this, this.templateData.outputContainer, insert));
                    });
                    this._outputEntries = [...firstGroupEntries, ...newlyInsertedEntries, ...secondGroupEntries.slice(0, this.options.limit - firstGroupEntries.length - newlyInserted.length)];
                    for (let i = firstGroupEntries.length; i < reRenderRightBoundary; i++) {
                        const previousSibling = i - 1 >= 0 && this._outputEntries[i - 1] && !!(this._outputEntries[i - 1].element.innerContainer?.parentElement) ? this._outputEntries[i - 1].element.innerContainer : undefined;
                        this._outputEntries[i].element.render(previousSibling);
                    }
                }
            }
            else {
                // after splice, it doesn't exceed
                deletedEntries.forEach(entry => {
                    entry.element.detach();
                    entry.element.dispose();
                });
                const reRenderRightBoundary = firstGroupEntries.length + newlyInserted.length;
                const newlyInsertedEntries = newlyInserted.map(insert => {
                    return new OutputEntryViewHandler(insert, this.instantiationService.createInstance(CellOutputElement, this.notebookEditor, this.viewCell, this, this.templateData.outputContainer, insert));
                });
                let outputsNewlyAvailable = [];
                if (firstGroupEntries.length + newlyInsertedEntries.length + secondGroupEntries.length < this.viewCell.outputsViewModels.length) {
                    const last = Math.min(this.options.limit, this.viewCell.outputsViewModels.length);
                    outputsNewlyAvailable = this.viewCell.outputsViewModels.slice(firstGroupEntries.length + newlyInsertedEntries.length + secondGroupEntries.length, last).map(output => {
                        return new OutputEntryViewHandler(output, this.instantiationService.createInstance(CellOutputElement, this.notebookEditor, this.viewCell, this, this.templateData.outputContainer, output));
                    });
                }
                this._outputEntries = [...firstGroupEntries, ...newlyInsertedEntries, ...secondGroupEntries, ...outputsNewlyAvailable];
                for (let i = firstGroupEntries.length; i < reRenderRightBoundary; i++) {
                    const previousSibling = i - 1 >= 0 && this._outputEntries[i - 1] && !!(this._outputEntries[i - 1].element.innerContainer?.parentElement) ? this._outputEntries[i - 1].element.innerContainer : undefined;
                    this._outputEntries[i].element.render(previousSibling);
                }
                for (let i = 0; i < outputsNewlyAvailable.length; i++) {
                    this._outputEntries[firstGroupEntries.length + newlyInserted.length + secondGroupEntries.length + i].element.render(undefined);
                }
            }
            if (this.viewCell.outputsViewModels.length > this.options.limit) {
                DOM.show(this.templateData.outputShowMoreContainer.domNode);
                if (!this.templateData.outputShowMoreContainer.domNode.hasChildNodes()) {
                    this.templateData.outputShowMoreContainer.domNode.appendChild(this._generateShowMoreElement(this.templateData.templateDisposables));
                }
                this.viewCell.updateOutputShowMoreContainerHeight(46);
            }
            else {
                DOM.hide(this.templateData.outputShowMoreContainer.domNode);
            }
            this._relayoutCell();
            // if it's clearing all outputs, or outputs are all rendered synchronously
            // shrink immediately as the final output height will be zero.
            // if it's rerun, then the output clearing might be temporary, so we don't shrink immediately
            this._validateFinalOutputHeight(context === 2 /* CellOutputUpdateContext.Other */ && this.viewCell.outputsViewModels.length === 0);
        }
        _generateShowMoreElement(disposables) {
            const md = {
                value: `There are more than ${this.options.limit} outputs, [show more (open the raw output data in a text editor) ...](command:workbench.action.openLargeOutput)`,
                isTrusted: true,
                supportThemeIcons: true
            };
            const rendered = (0, markdownRenderer_1.renderMarkdown)(md, {
                actionHandler: {
                    callback: (content) => {
                        if (content === 'command:workbench.action.openLargeOutput') {
                            this.openerService.open(notebookCommon_1.CellUri.generateCellOutputUri(this.notebookEditor.textModel.uri));
                        }
                        return;
                    },
                    disposables
                }
            });
            disposables.add(rendered);
            rendered.element.classList.add('output-show-more');
            return rendered.element;
        }
        _relayoutCell() {
            this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
        }
        dispose() {
            this.viewCell.updateOutputMinHeight(0);
            if (this._outputHeightTimer) {
                clearTimeout(this._outputHeightTimer);
            }
            this._outputEntries.forEach(entry => {
                entry.element.dispose();
            });
            super.dispose();
        }
    };
    exports.CellOutputContainer = CellOutputContainer;
    exports.CellOutputContainer = CellOutputContainer = __decorate([
        __param(4, opener_1.IOpenerService),
        __param(5, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(6, instantiation_1.IInstantiationService)
    ], CellOutputContainer);
    const JUPYTER_RENDERER_MIMETYPES = [
        'application/geo+json',
        'application/vdom.v1+json',
        'application/vnd.dataresource+json',
        'application/vnd.plotly.v1+json',
        'application/vnd.vega.v2+json',
        'application/vnd.vega.v3+json',
        'application/vnd.vega.v4+json',
        'application/vnd.vega.v5+json',
        'application/vnd.vegalite.v1+json',
        'application/vnd.vegalite.v2+json',
        'application/vnd.vegalite.v3+json',
        'application/vnd.vegalite.v4+json',
        'application/x-nteract-model-debug+json',
        'image/svg+xml',
        'text/latex',
        'text/vnd.plotly.v1+html',
        'application/vnd.jupyter.widget-view+json',
        'application/vnd.code.notebook.error'
    ];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbE91dHB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L2NlbGxQYXJ0cy9jZWxsT3V0cHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTRDaEcsZ0JBQWdCO0lBQ2hCLEVBQUU7SUFDRixXQUFXO0lBQ1gsS0FBSztJQUNMLDhCQUE4QjtJQUM5QixvREFBb0Q7SUFDcEQsK0NBQStDO0lBQy9DLCtDQUErQztJQUMvQywrQ0FBK0M7SUFDL0MsOEJBQThCO0lBQzlCLG9EQUFvRDtJQUNwRCwrQ0FBK0M7SUFDL0MsOEJBQThCO0lBQzlCLG9EQUFvRDtJQUNwRCwrQ0FBK0M7SUFDL0MsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSxzQkFBVTtRQVN6QyxZQUNTLGNBQXVDLEVBQ3ZDLFFBQTJCLEVBQzNCLG1CQUF3QyxFQUN4QyxlQUF5QyxFQUN4QyxNQUE0QixFQUNuQixlQUFrRCxFQUNoRCxpQkFBc0QsRUFDdEQsdUJBQTJDLEVBQ2pELFdBQTBDLEVBQzdCLG9CQUFnRSxFQUNwRSxvQkFBNEQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFaQSxtQkFBYyxHQUFkLGNBQWMsQ0FBeUI7WUFDdkMsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFDM0Isd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUN4QyxvQkFBZSxHQUFmLGVBQWUsQ0FBMEI7WUFDeEMsV0FBTSxHQUFOLE1BQU0sQ0FBc0I7WUFDRixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDL0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUUzQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNaLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMkI7WUFDbkQs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