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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/editor/common/model/prefixSumComputer", "vs/workbench/contrib/notebook/browser/viewModel/cellOutputViewModel", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, event_1, lifecycle_1, uuid_1, prefixSumComputer_1, cellOutputViewModel_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffNestedCellViewModel = void 0;
    let DiffNestedCellViewModel = class DiffNestedCellViewModel extends lifecycle_1.Disposable {
        get id() {
            return this._id;
        }
        get outputs() {
            return this.textModel.outputs;
        }
        get language() {
            return this.textModel.language;
        }
        get metadata() {
            return this.textModel.metadata;
        }
        get uri() {
            return this.textModel.uri;
        }
        get handle() {
            return this.textModel.handle;
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
        get outputsViewModels() {
            return this._outputViewModels;
        }
        constructor(textModel, _notebookService) {
            super();
            this.textModel = textModel;
            this._notebookService = _notebookService;
            this._onDidChangeState = this._register(new event_1.Emitter());
            this._hoveringOutput = false;
            this._focusOnOutput = false;
            this._focusInputInOutput = false;
            this._outputCollection = [];
            this._outputsTop = null;
            this._onDidChangeOutputLayout = this._register(new event_1.Emitter());
            this.onDidChangeOutputLayout = this._onDidChangeOutputLayout.event;
            this._id = (0, uuid_1.generateUuid)();
            this._outputViewModels = this.textModel.outputs.map(output => new cellOutputViewModel_1.CellOutputViewModel(this, output, this._notebookService));
            this._register(this.textModel.onDidChangeOutputs((splice) => {
                this._outputCollection.splice(splice.start, splice.deleteCount, ...splice.newOutputs.map(() => 0));
                const removed = this._outputViewModels.splice(splice.start, splice.deleteCount, ...splice.newOutputs.map(output => new cellOutputViewModel_1.CellOutputViewModel(this, output, this._notebookService)));
                removed.forEach(vm => vm.dispose());
                this._outputsTop = null;
                this._onDidChangeOutputLayout.fire();
            }));
            this._outputCollection = new Array(this.textModel.outputs.length);
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
        getOutputOffset(index) {
            this._ensureOutputsTop();
            if (index >= this._outputCollection.length) {
                throw new Error('Output index out of range!');
            }
            return this._outputsTop.getPrefixSum(index - 1);
        }
        updateOutputHeight(index, height) {
            if (index >= this._outputCollection.length) {
                throw new Error('Output index out of range!');
            }
            this._ensureOutputsTop();
            this._outputCollection[index] = height;
            if (this._outputsTop.setValue(index, height)) {
                this._onDidChangeOutputLayout.fire();
            }
        }
        getOutputTotalHeight() {
            this._ensureOutputsTop();
            return this._outputsTop?.getTotalSum() ?? 0;
        }
        dispose() {
            super.dispose();
            this._outputViewModels.forEach(output => {
                output.dispose();
            });
        }
    };
    exports.DiffNestedCellViewModel = DiffNestedCellViewModel;
    exports.DiffNestedCellViewModel = DiffNestedCellViewModel = __decorate([
        __param(1, notebookService_1.INotebookService)
    ], DiffNestedCellViewModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZk5lc3RlZENlbGxWaWV3TW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvZGlmZi9kaWZmTmVzdGVkQ2VsbFZpZXdNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxzQkFBVTtRQUV0RCxJQUFJLEVBQUU7WUFDTCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDakIsQ0FBQztRQUVELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7UUFDL0IsQ0FBQztRQUVELElBQUksUUFBUTtZQUNYLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7UUFDaEMsQ0FBQztRQUVELElBQUksUUFBUTtZQUNYLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7UUFDaEMsQ0FBQztRQUVELElBQUksR0FBRztZQUNOLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUM7UUFDM0IsQ0FBQztRQUVELElBQUksTUFBTTtZQUNULE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7UUFDOUIsQ0FBQztRQUtELElBQVcsZUFBZTtZQUN6QixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUVELElBQVcsZUFBZSxDQUFDLENBQVU7WUFDcEMsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLHNCQUFzQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUdELElB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