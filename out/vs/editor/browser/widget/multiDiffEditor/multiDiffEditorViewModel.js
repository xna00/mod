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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/observableInternal/utils", "vs/editor/browser/widget/diffEditor/diffEditorOptions", "vs/editor/browser/widget/diffEditor/diffEditorViewModel", "vs/editor/common/services/model", "vs/platform/instantiation/common/instantiation"], function (require, exports, lifecycle_1, observable_1, utils_1, diffEditorOptions_1, diffEditorViewModel_1, model_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DocumentDiffItemViewModel = exports.MultiDiffEditorViewModel = void 0;
    class MultiDiffEditorViewModel extends lifecycle_1.Disposable {
        async waitForDiffs() {
            for (const d of this.items.get()) {
                await d.diffEditorViewModel.waitForDiff();
            }
        }
        collapseAll() {
            (0, observable_1.transaction)(tx => {
                for (const d of this.items.get()) {
                    d.collapsed.set(true, tx);
                }
            });
        }
        expandAll() {
            (0, observable_1.transaction)(tx => {
                for (const d of this.items.get()) {
                    d.collapsed.set(false, tx);
                }
            });
        }
        get contextKeys() {
            return this.model.contextKeys;
        }
        constructor(model, _instantiationService) {
            super();
            this.model = model;
            this._instantiationService = _instantiationService;
            this._documents = (0, observable_1.observableFromEvent)(this.model.onDidChange, /** @description MultiDiffEditorViewModel.documents */ () => this.model.documents);
            this.items = (0, utils_1.mapObservableArrayCached)(this, this._documents, (d, store) => store.add(this._instantiationService.createInstance(DocumentDiffItemViewModel, d)))
                .recomputeInitiallyAndOnChange(this._store);
            this.activeDiffItem = (0, observable_1.observableValue)(this, undefined);
        }
    }
    exports.MultiDiffEditorViewModel = MultiDiffEditorViewModel;
    let DocumentDiffItemViewModel = class DocumentDiffItemViewModel extends lifecycle_1.Disposable {
        get originalUri() { return this.entry.value.original?.uri; }
        get modifiedUri() { return this.entry.value.modified?.uri; }
        constructor(entry, _instantiationService, _modelService) {
            super();
            this.entry = entry;
            this._instantiationService = _instantiationService;
            this._modelService = _modelService;
            this.collapsed = (0, observable_1.observableValue)(this, false);
            this.lastTemplateData = (0, observable_1.observableValue)(this, { contentHeight: 500, selections: undefined, });
            function updateOptions(options) {
                return {
                    ...options,
                    hideUnchangedRegions: {
                        enabled: true,
                    },
                };
            }
            const options = this._instantiationService.createInstance(diffEditorOptions_1.DiffEditorOptions, updateOptions(this.entry.value.options || {}));
            if (this.entry.value.onOptionsDidChange) {
                this._register(this.entry.value.onOptionsDidChange(() => {
                    options.updateOptions(updateOptions(this.entry.value.options || {}));
                }));
            }
            const originalTextModel = this.entry.value.original ?? this._register(this._modelService.createModel('', null));
            const modifiedTextModel = this.entry.value.modified ?? this._register(this._modelService.createModel('', null));
            this.diffEditorViewModel = this._register(this._instantiationService.createInstance(diffEditorViewModel_1.DiffEditorViewModel, {
                original: originalTextModel,
                modified: modifiedTextModel,
            }, options));
        }
        getKey() {
            return JSON.stringify([
                this.originalUri?.toString(),
                this.modifiedUri?.toString()
            ]);
        }
    };
    exports.DocumentDiffItemViewModel = DocumentDiffItemViewModel;
    exports.DocumentDiffItemViewModel = DocumentDiffItemViewModel = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, model_1.IModelService)
    ], DocumentDiffItemViewModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmRWRpdG9yVmlld01vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvbXVsdGlEaWZmRWRpdG9yL211bHRpRGlmZkVkaXRvclZpZXdNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQmhHLE1BQWEsd0JBQXlCLFNBQVEsc0JBQVU7UUFRaEQsS0FBSyxDQUFDLFlBQVk7WUFDeEIsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzNDLENBQUM7UUFDRixDQUFDO1FBRU0sV0FBVztZQUNqQixJQUFBLHdCQUFXLEVBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ2hCLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO29CQUNsQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQzNCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxTQUFTO1lBQ2YsSUFBQSx3QkFBVyxFQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUNoQixLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztvQkFDbEMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUM1QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsSUFBVyxXQUFXO1lBQ3JCLE9B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