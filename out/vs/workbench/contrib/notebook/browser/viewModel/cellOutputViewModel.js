/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, event_1, lifecycle_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellOutputViewModel = void 0;
    let handle = 0;
    class CellOutputViewModel extends lifecycle_1.Disposable {
        get model() {
            return this._outputRawData;
        }
        get pickedMimeType() {
            return this._pickedMimeType;
        }
        set pickedMimeType(value) {
            this._pickedMimeType = value;
        }
        constructor(cellViewModel, _outputRawData, _notebookService) {
            super();
            this.cellViewModel = cellViewModel;
            this._outputRawData = _outputRawData;
            this._notebookService = _notebookService;
            this._onDidResetRendererEmitter = this._register(new event_1.Emitter());
            this.onDidResetRenderer = this._onDidResetRendererEmitter.event;
            this.outputHandle = handle++;
        }
        hasMultiMimeType() {
            if (this._outputRawData.outputs.length < 2) {
                return false;
            }
            const firstMimeType = this._outputRawData.outputs[0].mime;
            return this._outputRawData.outputs.some(output => output.mime !== firstMimeType);
        }
        resolveMimeTypes(textModel, kernelProvides) {
            const mimeTypes = this._notebookService.getOutputMimeTypeInfo(textModel, kernelProvides, this.model);
            const index = mimeTypes.findIndex(mimeType => mimeType.rendererId !== notebookCommon_1.RENDERER_NOT_AVAILABLE && mimeType.isTrusted);
            return [mimeTypes, Math.max(index, 0)];
        }
        resetRenderer() {
            // reset the output renderer
            this._pickedMimeType = undefined;
            this.model.bumpVersion();
            this._onDidResetRendererEmitter.fire();
        }
        toRawJSON() {
            return {
                outputs: this._outputRawData.outputs,
                // TODO@rebronix, no id, right?
            };
        }
    }
    exports.CellOutputViewModel = CellOutputViewModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbE91dHB1dFZpZXdNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3TW9kZWwvY2VsbE91dHB1dFZpZXdNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsTUFBYSxtQkFBb0IsU0FBUSxzQkFBVTtRQUlsRCxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7UUFDNUIsQ0FBQztRQUdELElBQUksY0FBYztZQUNqQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUVELElBQUksY0FBYyxDQUFDLEtBQW1DO1lBQ3JELElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBQzlCLENBQUM7UUFFRCxZQUNVLGFBQW9DLEVBQzVCLGNBQTJCLEVBQzNCLGdCQUFrQztZQUVuRCxLQUFLLEVBQUUsQ0FBQztZQUpDLGtCQUFhLEdBQWIsYUFBYSxDQUF1QjtZQUM1QixtQkFBYyxHQUFkLGNBQWMsQ0FBYTtZQUMzQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBbkI1QywrQkFBMEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNoRSx1QkFBa0IsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDO1lBQ3BFLGlCQUFZLEdBQUcsTUFBTSxFQUFFLENBQUM7UUFvQnhCLENBQUM7UUFFRCxnQkFBZ0I7WUFDZixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDNUMsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFELE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxhQUFhLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBRUQsZ0JBQWdCLENBQUMsU0FBNEIsRUFBRSxjQUE2QztZQUMzRixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMscUJBQXFCLENBQUMsU0FBUyxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckcsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEtBQUssdUNBQXNCLElBQUksUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXBILE9BQU8sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRUQsYUFBYTtZQUNaLDRCQUE0QjtZQUM1QixJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQztZQUNqQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN4QyxDQUFDO1FBRUQsU0FBUztZQUNSLE9BQU87Z0JBQ04sT0FBTyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTztnQkFDcEMsK0JBQStCO2FBQy9CLENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUF0REQsa0RBc0RDIn0=