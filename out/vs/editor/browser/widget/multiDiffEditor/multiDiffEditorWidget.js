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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/browser/widget/multiDiffEditor/multiDiffEditorWidgetImpl", "./multiDiffEditorViewModel", "vs/platform/instantiation/common/instantiation", "vs/editor/browser/widget/multiDiffEditor/diffEditorItemTemplate", "vs/base/common/event", "./colors"], function (require, exports, lifecycle_1, observable_1, utils_1, multiDiffEditorWidgetImpl_1, multiDiffEditorViewModel_1, instantiation_1, diffEditorItemTemplate_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiDiffEditorWidget = void 0;
    let MultiDiffEditorWidget = class MultiDiffEditorWidget extends lifecycle_1.Disposable {
        constructor(_element, _workbenchUIElementFactory, _instantiationService) {
            super();
            this._element = _element;
            this._workbenchUIElementFactory = _workbenchUIElementFactory;
            this._instantiationService = _instantiationService;
            this._dimension = (0, observable_1.observableValue)(this, undefined);
            this._viewModel = (0, observable_1.observableValue)(this, undefined);
            this._widgetImpl = (0, observable_1.derivedWithStore)(this, (reader, store) => {
                (0, utils_1.readHotReloadableExport)(diffEditorItemTemplate_1.DiffEditorItemTemplate, reader);
                return store.add(this._instantiationService.createInstance(((0, utils_1.readHotReloadableExport)(multiDiffEditorWidgetImpl_1.MultiDiffEditorWidgetImpl, reader)), this._element, this._dimension, this._viewModel, this._workbenchUIElementFactory));
            });
            this._activeControl = (0, observable_1.derived)(this, (reader) => this._widgetImpl.read(reader).activeControl.read(reader));
            this.onDidChangeActiveControl = event_1.Event.fromObservableLight(this._activeControl);
            this._register((0, observable_1.recomputeInitiallyAndOnChange)(this._widgetImpl));
        }
        reveal(resource, options) {
            this._widgetImpl.get().reveal(resource, options);
        }
        createViewModel(model) {
            return new multiDiffEditorViewModel_1.MultiDiffEditorViewModel(model, this._instantiationService);
        }
        setViewModel(viewModel) {
            this._viewModel.set(viewModel, undefined);
        }
        layout(dimension) {
            this._dimension.set(dimension, undefined);
        }
        getActiveControl() {
            return this._activeControl.get();
        }
        getViewState() {
            return this._widgetImpl.get().getViewState();
        }
        setViewState(viewState) {
            this._widgetImpl.get().setViewState(viewState);
        }
        tryGetCodeEditor(resource) {
            return this._widgetImpl.get().tryGetCodeEditor(resource);
        }
    };
    exports.MultiDiffEditorWidget = MultiDiffEditorWidget;
    exports.MultiDiffEditorWidget = MultiDiffEditorWidget = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], MultiDiffEditorWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmRWRpdG9yV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvbXVsdGlEaWZmRWRpdG9yL211bHRpRGlmZkVkaXRvcldpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQnpGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7UUFlcEQsWUFDa0IsUUFBcUIsRUFDckIsMEJBQXNELEVBQ2hELHFCQUE2RDtZQUVwRixLQUFLLEVBQUUsQ0FBQztZQUpTLGFBQVEsR0FBUixRQUFRLENBQWE7WUFDckIsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE0QjtZQUMvQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBakJwRSxlQUFVLEdBQUcsSUFBQSw0QkFBZSxFQUF3QixJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDckUsZUFBVSxHQUFHLElBQUEsNEJBQWUsRUFBdUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXBGLGdCQUFXLEdBQUcsSUFBQSw2QkFBZ0IsRUFBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ3ZFLElBQUEsK0JBQXVCLEVBQUMsK0NBQXNCLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3hELE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLENBQzFELElBQUEsK0JBQXVCLEVBQUMscURBQXlCLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFDM0QsSUFBSSxDQUFDLFFBQVEsRUFDYixJQUFJLENBQUMsVUFBVSxFQUNmLElBQUksQ0FBQyxVQUFVLEVBQ2YsSUFBSSxDQUFDLDBCQUEwQixDQUMvQixDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQTRCYyxtQkFBYyxHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQU10Ryw2QkFBd0IsR0FBRyxhQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBekJ6RixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsMENBQTZCLEVBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVNLE1BQU0sQ0FBQyxRQUE4QixFQUFFLE9BQXVCO1lBQ3BFLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRU0sZUFBZSxDQUFDLEtBQTRCO1lBQ2xELE9BQU8sSUFBSSxtREFBd0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVNLFlBQVksQ0FBQyxTQUErQztZQUNsRSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVNLE1BQU0sQ0FBQyxTQUFvQjtZQUNqQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUlNLGdCQUFnQjtZQUN0QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUlNLFlBQVk7WUFDbEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQzlDLENBQUM7UUFFTSxZQUFZLENBQUMsU0FBb0M7WUFDdkQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVNLGdCQUFnQixDQUFDLFFBQWE7WUFDcEMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFELENBQUM7S0FDRCxDQUFBO0lBNURZLHNEQUFxQjtvQ0FBckIscUJBQXFCO1FBa0IvQixXQUFBLHFDQUFxQixDQUFBO09BbEJYLHFCQUFxQixDQTREakMifQ==