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
define(["require", "exports", "vs/editor/browser/widget/multiDiffEditor/multiDiffEditorWidget", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/labels", "vs/workbench/browser/parts/editor/editorWithViewState", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditorInput", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/editor/common/core/range"], function (require, exports, multiDiffEditorWidget_1, textResourceConfiguration_1, instantiation_1, storage_1, telemetry_1, themeService_1, labels_1, editorWithViewState_1, multiDiffEditorInput_1, editorGroupsService_1, editorService_1, range_1) {
    "use strict";
    var MultiDiffEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiDiffEditor = void 0;
    let MultiDiffEditor = class MultiDiffEditor extends editorWithViewState_1.AbstractEditorWithViewState {
        static { MultiDiffEditor_1 = this; }
        static { this.ID = 'multiDiffEditor'; }
        get viewModel() {
            return this._viewModel;
        }
        constructor(group, instantiationService, telemetryService, themeService, storageService, editorService, editorGroupService, textResourceConfigurationService) {
            super(MultiDiffEditor_1.ID, group, 'multiDiffEditor', telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService);
            this._multiDiffEditorWidget = undefined;
        }
        createEditor(parent) {
            this._multiDiffEditorWidget = this._register(this.instantiationService.createInstance(multiDiffEditorWidget_1.MultiDiffEditorWidget, parent, this.instantiationService.createInstance(WorkbenchUIElementFactory)));
            this._register(this._multiDiffEditorWidget.onDidChangeActiveControl(() => {
                this._onDidChangeControl.fire();
            }));
        }
        async setInput(input, options, context, token) {
            await super.setInput(input, options, context, token);
            this._viewModel = await input.getViewModel();
            this._multiDiffEditorWidget.setViewModel(this._viewModel);
            const viewState = this.loadEditorViewState(input, context);
            if (viewState) {
                this._multiDiffEditorWidget.setViewState(viewState);
            }
            this._applyOptions(options);
        }
        setOptions(options) {
            this._applyOptions(options);
        }
        _applyOptions(options) {
            const viewState = options?.viewState;
            if (!viewState || !viewState.revealData) {
                return;
            }
            this._multiDiffEditorWidget?.reveal(viewState.revealData.resource, {
                range: viewState.revealData.range ? range_1.Range.lift(viewState.revealData.range) : undefined,
                highlight: true
            });
        }
        async clearInput() {
            await super.clearInput();
            this._multiDiffEditorWidget.setViewModel(undefined);
        }
        layout(dimension) {
            this._multiDiffEditorWidget.layout(dimension);
        }
        getControl() {
            return this._multiDiffEditorWidget.getActiveControl();
        }
        focus() {
            super.focus();
            this._multiDiffEditorWidget?.getActiveControl()?.focus();
        }
        hasFocus() {
            return this._multiDiffEditorWidget?.getActiveControl()?.hasTextFocus() || super.hasFocus();
        }
        computeEditorViewState(resource) {
            return this._multiDiffEditorWidget.getViewState();
        }
        tracksEditorViewState(input) {
            return input instanceof multiDiffEditorInput_1.MultiDiffEditorInput;
        }
        toEditorViewStateResource(input) {
            return input.resource;
        }
        tryGetCodeEditor(resource) {
            return this._multiDiffEditorWidget.tryGetCodeEditor(resource);
        }
    };
    exports.MultiDiffEditor = MultiDiffEditor;
    exports.MultiDiffEditor = MultiDiffEditor = MultiDiffEditor_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, themeService_1.IThemeService),
        __param(4, storage_1.IStorageService),
        __param(5, editorService_1.IEditorService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], MultiDiffEditor);
    let WorkbenchUIElementFactory = class WorkbenchUIElementFactory {
        constructor(_instantiationService) {
            this._instantiationService = _instantiationService;
        }
        createResourceLabel(element) {
            const label = this._instantiationService.createInstance(labels_1.ResourceLabel, element, {});
            return {
                setUri(uri, options = {}) {
                    if (!uri) {
                        label.element.clear();
                    }
                    else {
                        label.element.setFile(uri, { strikethrough: options.strikethrough });
                    }
                },
                dispose() {
                    label.dispose();
                }
            };
        }
    };
    WorkbenchUIElementFactory = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], WorkbenchUIElementFactory);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmRWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tdWx0aURpZmZFZGl0b3IvYnJvd3Nlci9tdWx0aURpZmZFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTJCekYsSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxpREFBc0Q7O2lCQUMxRSxPQUFFLEdBQUcsaUJBQWlCLEFBQXBCLENBQXFCO1FBS3ZDLElBQVcsU0FBUztZQUNuQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztRQUVELFlBQ0MsS0FBbUIsRUFDSSxvQkFBMEMsRUFDOUMsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ3pCLGNBQStCLEVBQ2hDLGFBQTZCLEVBQ3ZCLGtCQUF3QyxFQUMzQixnQ0FBbUU7WUFFdEcsS0FBSyxDQUNKLGlCQUFlLENBQUMsRUFBRSxFQUNsQixLQUFLLEVBQ0wsaUJBQWlCLEVBQ2pCLGdCQUFnQixFQUNoQixvQkFBb0IsRUFDcEIsY0FBYyxFQUNkLGdDQUFnQyxFQUNoQyxZQUFZLEVBQ1osYUFBYSxFQUNiLGtCQUFrQixDQUNsQixDQUFDO1lBNUJLLDJCQUFzQixHQUFzQyxTQUFTLENBQUM7UUE2QjlFLENBQUM7UUFFUyxZQUFZLENBQUMsTUFBbUI7WUFDekMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FDcEYsNkNBQXFCLEVBQ3JCLE1BQU0sRUFDTixJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHlCQUF5QixDQUFDLENBQ25FLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHNCQUFz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