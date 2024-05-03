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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/features/hideUnchangedRegionsFeature", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, arrays_1, observable_1, hideUnchangedRegionsFeature_1, utils_1, languageFeatures_1, outlineModel_1, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DiffEditorBreadcrumbsSource = class DiffEditorBreadcrumbsSource extends lifecycle_1.Disposable {
        constructor(_textModel, _languageFeaturesService, _outlineModelService) {
            super();
            this._textModel = _textModel;
            this._languageFeaturesService = _languageFeaturesService;
            this._outlineModelService = _outlineModelService;
            this._currentModel = (0, observable_1.observableValue)(this, undefined);
            const documentSymbolProviderChanged = (0, observable_1.observableSignalFromEvent)('documentSymbolProvider.onDidChange', this._languageFeaturesService.documentSymbolProvider.onDidChange);
            const textModelChanged = (0, observable_1.observableSignalFromEvent)('_textModel.onDidChangeContent', event_1.Event.debounce(e => this._textModel.onDidChangeContent(e), () => undefined, 100));
            this._register((0, observable_1.autorunWithStore)(async (reader, store) => {
                documentSymbolProviderChanged.read(reader);
                textModelChanged.read(reader);
                const src = store.add(new utils_1.DisposableCancellationTokenSource());
                const model = await this._outlineModelService.getOrCreate(this._textModel, src.token);
                if (store.isDisposed) {
                    return;
                }
                this._currentModel.set(model, undefined);
            }));
        }
        getBreadcrumbItems(startRange, reader) {
            const m = this._currentModel.read(reader);
            if (!m) {
                return [];
            }
            const symbols = m.asListOfDocumentSymbols()
                .filter(s => startRange.contains(s.range.startLineNumber) && !startRange.contains(s.range.endLineNumber));
            symbols.sort((0, arrays_1.reverseOrder)((0, arrays_1.compareBy)(s => s.range.endLineNumber - s.range.startLineNumber, arrays_1.numberComparator)));
            return symbols.map(s => ({ name: s.name, kind: s.kind, startLineNumber: s.range.startLineNumber }));
        }
    };
    DiffEditorBreadcrumbsSource = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, outlineModel_1.IOutlineModelService)
    ], DiffEditorBreadcrumbsSource);
    hideUnchangedRegionsFeature_1.HideUnchangedRegionsFeature.setBreadcrumbsSourceFactory((textModel, instantiationService) => {
        return instantiationService.createInstance(DiffEditorBreadcrumbsSource, textModel);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9kaWZmRWRpdG9yQnJlYWRjcnVtYnMvYnJvd3Nlci9jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFjaEcsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxzQkFBVTtRQUduRCxZQUNrQixVQUFzQixFQUNiLHdCQUFtRSxFQUN2RSxvQkFBMkQ7WUFFakYsS0FBSyxFQUFFLENBQUM7WUFKUyxlQUFVLEdBQVYsVUFBVSxDQUFZO1lBQ0ksNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUN0RCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBTGpFLGtCQUFhLEdBQUcsSUFBQSw0QkFBZSxFQUEyQixJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFTM0YsTUFBTSw2QkFBNkIsR0FBRyxJQUFBLHNDQUF5QixFQUM5RCxvQ0FBb0MsRUFDcEMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLHNCQUFzQixDQUFDLFdBQVcsQ0FDaEUsQ0FBQztZQUVGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSxzQ0FBeUIsRUFDakQsK0JBQStCLEVBQy9CLGFBQUssQ0FBQyxRQUFRLENBQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FDckYsQ0FBQztZQUVGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSw2QkFBZ0IsRUFBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUN2RCw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzNDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFOUIsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHlDQUFpQyxFQUFFLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN0RixJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFBQyxPQUFPO2dCQUFDLENBQUM7Z0JBRWpDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMxQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVNLGtCQUFrQixDQUFDLFVBQXFCLEVBQUUsTUFBZTtZQUMvRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQUMsT0FBTyxFQUFFLENBQUM7WUFBQyxDQUFDO1lBQ3RCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyx1QkFBdUIsRUFBRTtpQkFDekMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDM0csT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFBLHFCQUFZLEVBQUMsSUFBQSxrQkFBUyxFQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUseUJBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUcsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyRyxDQUFDO0tBQ0QsQ0FBQTtJQXhDSywyQkFBMkI7UUFLOUIsV0FBQSwyQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLG1DQUFvQixDQUFBO09BTmpCLDJCQUEyQixDQXdDaEM7SUFFRCx5REFBMkIsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxvQkFBb0IsRUFBRSxFQUFFO1FBQzNGLE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJCQUEyQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3BGLENBQUMsQ0FBQyxDQUFDIn0=