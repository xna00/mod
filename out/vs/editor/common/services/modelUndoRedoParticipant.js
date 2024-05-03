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
define(["require", "exports", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/base/common/lifecycle", "vs/platform/undoRedo/common/undoRedo", "vs/editor/common/model/editStack"], function (require, exports, model_1, resolverService_1, lifecycle_1, undoRedo_1, editStack_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModelUndoRedoParticipant = void 0;
    let ModelUndoRedoParticipant = class ModelUndoRedoParticipant extends lifecycle_1.Disposable {
        constructor(_modelService, _textModelService, _undoRedoService) {
            super();
            this._modelService = _modelService;
            this._textModelService = _textModelService;
            this._undoRedoService = _undoRedoService;
            this._register(this._modelService.onModelRemoved((model) => {
                // a model will get disposed, so let's check if the undo redo stack is maintained
                const elements = this._undoRedoService.getElements(model.uri);
                if (elements.past.length === 0 && elements.future.length === 0) {
                    return;
                }
                for (const element of elements.past) {
                    if (element instanceof editStack_1.MultiModelEditStackElement) {
                        element.setDelegate(this);
                    }
                }
                for (const element of elements.future) {
                    if (element instanceof editStack_1.MultiModelEditStackElement) {
                        element.setDelegate(this);
                    }
                }
            }));
        }
        prepareUndoRedo(element) {
            // Load all the needed text models
            const missingModels = element.getMissingModels();
            if (missingModels.length === 0) {
                // All models are available!
                return lifecycle_1.Disposable.None;
            }
            const disposablesPromises = missingModels.map(async (uri) => {
                try {
                    const reference = await this._textModelService.createModelReference(uri);
                    return reference;
                }
                catch (err) {
                    // This model could not be loaded, maybe it was deleted in the meantime?
                    return lifecycle_1.Disposable.None;
                }
            });
            return Promise.all(disposablesPromises).then(disposables => {
                return {
                    dispose: () => (0, lifecycle_1.dispose)(disposables)
                };
            });
        }
    };
    exports.ModelUndoRedoParticipant = ModelUndoRedoParticipant;
    exports.ModelUndoRedoParticipant = ModelUndoRedoParticipant = __decorate([
        __param(0, model_1.IModelService),
        __param(1, resolverService_1.ITextModelService),
        __param(2, undoRedo_1.IUndoRedoService)
    ], ModelUndoRedoParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxVbmRvUmVkb1BhcnRpY2lwYW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL21vZGVsVW5kb1JlZG9QYXJ0aWNpcGFudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFRekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTtRQUN2RCxZQUNpQyxhQUE0QixFQUN4QixpQkFBb0MsRUFDckMsZ0JBQWtDO1lBRXJFLEtBQUssRUFBRSxDQUFDO1lBSndCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQ3hCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDckMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUdyRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQzFELGlGQUFpRjtnQkFDakYsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzlELElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNoRSxPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3JDLElBQUksT0FBTyxZQUFZLHNDQUEwQixFQUFFLENBQUM7d0JBQ25ELE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzNCLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDdkMsSUFBSSxPQUFPLFlBQVksc0NBQTBCLEVBQUUsQ0FBQzt3QkFDbkQsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDM0IsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTSxlQUFlLENBQUMsT0FBbUM7WUFDekQsa0NBQWtDO1lBQ2xDLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ2pELElBQUksYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsNEJBQTRCO2dCQUM1QixPQUFPLHNCQUFVLENBQUMsSUFBSSxDQUFDO1lBQ3hCLENBQUM7WUFFRCxNQUFNLG1CQUFtQixHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUMzRCxJQUFJLENBQUM7b0JBQ0osTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3pFLE9BQW9CLFNBQVMsQ0FBQztnQkFDL0IsQ0FBQztnQkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNkLHdFQUF3RTtvQkFDeEUsT0FBTyxzQkFBVSxDQUFDLElBQUksQ0FBQztnQkFDeEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dCQUMxRCxPQUFPO29CQUNOLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFBLG1CQUFPLEVBQUMsV0FBVyxDQUFDO2lCQUNuQyxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QsQ0FBQTtJQWxEWSw0REFBd0I7dUNBQXhCLHdCQUF3QjtRQUVsQyxXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLG1DQUFpQixDQUFBO1FBQ2pCLFdBQUEsMkJBQWdCLENBQUE7T0FKTix3QkFBd0IsQ0FrRHBDIn0=