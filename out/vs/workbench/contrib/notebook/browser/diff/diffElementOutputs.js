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
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/diff/diffElementViewModel", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/workbench/contrib/notebook/common/notebookService", "vs/base/common/themables", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/base/browser/keyboardEvent", "vs/platform/quickinput/common/quickInput"], function (require, exports, DOM, nls, lifecycle_1, diffElementViewModel_1, notebookDiffEditorBrowser_1, notebookService_1, themables_1, notebookIcons_1, keyboardEvent_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputContainer = exports.OutputElement = void 0;
    class OutputElement extends lifecycle_1.Disposable {
        constructor(_notebookEditor, _notebookTextModel, _notebookService, _quickInputService, _diffElementViewModel, _diffSide, _nestedCell, _outputContainer, output) {
            super();
            this._notebookEditor = _notebookEditor;
            this._notebookTextModel = _notebookTextModel;
            this._notebookService = _notebookService;
            this._quickInputService = _quickInputService;
            this._diffElementViewModel = _diffElementViewModel;
            this._diffSide = _diffSide;
            this._nestedCell = _nestedCell;
            this._outputContainer = _outputContainer;
            this.output = output;
            this.resizeListener = this._register(new lifecycle_1.DisposableStore());
        }
        render(index, beforeElement) {
            const outputItemDiv = document.createElement('div');
            let result = undefined;
            const [mimeTypes, pick] = this.output.resolveMimeTypes(this._notebookTextModel, undefined);
            const pickedMimeTypeRenderer = mimeTypes[pick];
            if (mimeTypes.length > 1) {
                outputItemDiv.style.position = 'relative';
                const mimeTypePicker = DOM.$('.multi-mimetype-output');
                mimeTypePicker.classList.add(...themables_1.ThemeIcon.asClassNameArray(notebookIcons_1.mimetypeIcon));
                mimeTypePicker.tabIndex = 0;
                mimeTypePicker.title = nls.localize('mimeTypePicker', "Choose a different output mimetype, available mimetypes: {0}", mimeTypes.map(mimeType => mimeType.mimeType).join(', '));
                outputItemDiv.appendChild(mimeTypePicker);
                this.resizeListener.add(DOM.addStandardDisposableListener(mimeTypePicker, 'mousedown', async (e) => {
                    if (e.leftButton) {
                        e.preventDefault();
                        e.stopPropagation();
                        await this.pickActiveMimeTypeRenderer(this._notebookTextModel, this.output);
                    }
                }));
                this.resizeListener.add((DOM.addDisposableListener(mimeTypePicker, DOM.EventType.KEY_DOWN, async (e) => {
                    const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if ((event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */))) {
                        e.preventDefault();
                        e.stopPropagation();
                        await this.pickActiveMimeTypeRenderer(this._notebookTextModel, this.output);
                    }
                })));
            }
            const innerContainer = DOM.$('.output-inner-container');
            DOM.append(outputItemDiv, innerContainer);
            if (mimeTypes.length !== 0) {
                const renderer = this._notebookService.getRendererInfo(pickedMimeTypeRenderer.rendererId);
                result = renderer
                    ? { type: 1 /* RenderOutputType.Extension */, renderer, source: this.output, mimeType: pickedMimeTypeRenderer.mimeType }
                    : this._renderMissingRenderer(this.output, pickedMimeTypeRenderer.mimeType);
                this.output.pickedMimeType = pickedMimeTypeRenderer;
            }
            this.domNode = outputItemDiv;
            this.renderResult = result;
            if (!result) {
                // this.viewCell.updateOutputHeight(index, 0);
                return;
            }
            if (beforeElement) {
                this._outputContainer.insertBefore(outputItemDiv, beforeElement);
            }
            else {
                this._outputContainer.appendChild(outputItemDiv);
            }
            this._notebookEditor.createOutput(this._diffElementViewModel, this._nestedCell, result, () => this.getOutputOffsetInCell(index), this._diffElementViewModel instanceof diffElementViewModel_1.SideBySideDiffElementViewModel
                ? this._diffSide
                : this._diffElementViewModel.type === 'insert' ? notebookDiffEditorBrowser_1.DiffSide.Modified : notebookDiffEditorBrowser_1.DiffSide.Original);
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
                htmlContent: p.outerHTML + a.outerHTML,
            };
        }
        _renderMessage(viewModel, message) {
            const el = DOM.$('p', undefined, message);
            return { type: 0 /* RenderOutputType.Html */, source: viewModel, htmlContent: el.outerHTML };
        }
        async pickActiveMimeTypeRenderer(notebookTextModel, viewModel) {
            const [mimeTypes, currIndex] = viewModel.resolveMimeTypes(notebookTextModel, undefined);
            const items = mimeTypes.filter(mimeType => mimeType.isTrusted).map((mimeType, index) => ({
                label: mimeType.mimeType,
                id: mimeType.mimeType,
                index: index,
                picked: index === currIndex,
                detail: this.generateRendererInfo(mimeType.rendererId),
                description: index === currIndex ? nls.localize('curruentActiveMimeType', "Currently Active") : undefined
            }));
            const picker = this._quickInputService.createQuickPick();
            picker.items = items;
            picker.activeItems = items.filter(item => !!item.picked);
            picker.placeholder = items.length !== mimeTypes.length
                ? nls.localize('promptChooseMimeTypeInSecure.placeHolder', "Select mimetype to render for current output. Rich mimetypes are available only when the notebook is trusted")
                : nls.localize('promptChooseMimeType.placeHolder', "Select mimetype to render for current output");
            const pick = await new Promise(resolve => {
                picker.onDidAccept(() => {
                    resolve(picker.selectedItems.length === 1 ? picker.selectedItems[0].index : undefined);
                    picker.dispose();
                });
                picker.show();
            });
            if (pick === undefined) {
                return;
            }
            if (pick !== currIndex) {
                // user chooses another mimetype
                const index = this._nestedCell.outputsViewModels.indexOf(viewModel);
                const nextElement = this.domNode.nextElementSibling;
                this.resizeListener.clear();
                const element = this.domNode;
                if (element) {
                    element.parentElement?.removeChild(element);
                    this._notebookEditor.removeInset(this._diffElementViewModel, this._nestedCell, viewModel, this._diffSide);
                }
                viewModel.pickedMimeType = mimeTypes[pick];
                this.render(index, nextElement);
            }
        }
        generateRendererInfo(renderId) {
            const renderInfo = this._notebookService.getRendererInfo(renderId);
            if (renderInfo) {
                const displayName = renderInfo.displayName !== '' ? renderInfo.displayName : renderInfo.id;
                return `${displayName} (${renderInfo.extensionId.value})`;
            }
            return nls.localize('builtinRenderInfo', "built-in");
        }
        getCellOutputCurrentIndex() {
            return this._diffElementViewModel.getNestedCellViewModel(this._diffSide).outputs.indexOf(this.output.model);
        }
        updateHeight(index, height) {
            this._diffElementViewModel.updateOutputHeight(this._diffSide, index, height);
        }
        getOutputOffsetInContainer(index) {
            return this._diffElementViewModel.getOutputOffsetInContainer(this._diffSide, index);
        }
        getOutputOffsetInCell(index) {
            return this._diffElementViewModel.getOutputOffsetInCell(this._diffSide, index);
        }
    }
    exports.OutputElement = OutputElement;
    let OutputContainer = class OutputContainer extends lifecycle_1.Disposable {
        constructor(_editor, _notebookTextModel, _diffElementViewModel, _nestedCellViewModel, _diffSide, _outputContainer, _notebookService, _quickInputService) {
            super();
            this._editor = _editor;
            this._notebookTextModel = _notebookTextModel;
            this._diffElementViewModel = _diffElementViewModel;
            this._nestedCellViewModel = _nestedCellViewModel;
            this._diffSide = _diffSide;
            this._outputContainer = _outputContainer;
            this._notebookService = _notebookService;
            this._quickInputService = _quickInputService;
            this._outputEntries = new Map();
            this._register(this._diffElementViewModel.onDidLayoutChange(() => {
                this._outputEntries.forEach((value, key) => {
                    const index = _nestedCellViewModel.outputs.indexOf(key.model);
                    if (index >= 0) {
                        const top = this._diffElementViewModel.getOutputOffsetInContainer(this._diffSide, index);
                        value.domNode.style.top = `${top}px`;
                    }
                });
            }));
            this._register(this._nestedCellViewModel.textModel.onDidChangeOutputs(splice => {
                this._updateOutputs(splice);
            }));
        }
        _updateOutputs(splice) {
            const removedKeys = [];
            this._outputEntries.forEach((value, key) => {
                if (this._nestedCellViewModel.outputsViewModels.indexOf(key) < 0) {
                    // already removed
                    removedKeys.push(key);
                    // remove element from DOM
                    this._outputContainer.removeChild(value.domNode);
                    this._editor.removeInset(this._diffElementViewModel, this._nestedCellViewModel, key, this._diffSide);
                }
            });
            removedKeys.forEach(key => {
                this._outputEntries.get(key)?.dispose();
                this._outputEntries.delete(key);
            });
            let prevElement = undefined;
            const outputsToRender = this._nestedCellViewModel.outputsViewModels;
            outputsToRender.reverse().forEach(output => {
                if (this._outputEntries.has(output)) {
                    // already exist
                    prevElement = this._outputEntries.get(output).domNode;
                    return;
                }
                // newly added element
                const currIndex = this._nestedCellViewModel.outputsViewModels.indexOf(output);
                this._renderOutput(output, currIndex, prevElement);
                prevElement = this._outputEntries.get(output)?.domNode;
            });
        }
        render() {
            // TODO, outputs to render (should have a limit)
            for (let index = 0; index < this._nestedCellViewModel.outputsViewModels.length; index++) {
                const currOutput = this._nestedCellViewModel.outputsViewModels[index];
                // always add to the end
                this._renderOutput(currOutput, index, undefined);
            }
        }
        showOutputs() {
            for (let index = 0; index < this._nestedCellViewModel.outputsViewModels.length; index++) {
                const currOutput = this._nestedCellViewModel.outputsViewModels[index];
                // always add to the end
                this._editor.showInset(this._diffElementViewModel, currOutput.cellViewModel, currOutput, this._diffSide);
            }
        }
        hideOutputs() {
            this._outputEntries.forEach((outputElement, cellOutputViewModel) => {
                this._editor.hideInset(this._diffElementViewModel, this._nestedCellViewModel, cellOutputViewModel);
            });
        }
        _renderOutput(currOutput, index, beforeElement) {
            if (!this._outputEntries.has(currOutput)) {
                this._outputEntries.set(currOutput, new OutputElement(this._editor, this._notebookTextModel, this._notebookService, this._quickInputService, this._diffElementViewModel, this._diffSide, this._nestedCellViewModel, this._outputContainer, currOutput));
            }
            const renderElement = this._outputEntries.get(currOutput);
            renderElement.render(index, beforeElement);
        }
    };
    exports.OutputContainer = OutputContainer;
    exports.OutputContainer = OutputContainer = __decorate([
        __param(6, notebookService_1.INotebookService),
        __param(7, quickInput_1.IQuickInputService)
    ], OutputContainer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVsZW1lbnRPdXRwdXRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2RpZmYvZGlmZkVsZW1lbnRPdXRwdXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNCaEcsTUFBYSxhQUFjLFNBQVEsc0JBQVU7UUFLNUMsWUFDUyxlQUF3QyxFQUN4QyxrQkFBcUMsRUFDckMsZ0JBQWtDLEVBQ2xDLGtCQUFzQyxFQUN0QyxxQkFBK0MsRUFDL0MsU0FBbUIsRUFDbkIsV0FBb0MsRUFDcEMsZ0JBQTZCLEVBQzVCLE1BQTRCO1lBRXJDLEtBQUssRUFBRSxDQUFDO1lBVkEsb0JBQWUsR0FBZixlQUFlLENBQXlCO1lBQ3hDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBbUI7WUFDckMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNsQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ3RDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBMEI7WUFDL0MsY0FBUyxHQUFULFNBQVMsQ0FBVTtZQUNuQixnQkFBVyxHQUFYLFdBQVcsQ0FBeUI7WUFDcEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFhO1lBQzVCLFdBQU0sR0FBTixNQUFNLENBQXNCO1lBYjdCLG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1FBZ0JoRSxDQUFDO1FBRUQsTUFBTSxDQUFDLEtBQWEsRUFBRSxhQUEyQjtZQUNoRCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BELElBQUksTUFBTSxHQUFtQyxTQUFTLENBQUM7WUFFdkQsTUFBTSxDQUFDLFNBQVMsRUFBRSxJ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