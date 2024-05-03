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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/model", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "vs/workbench/contrib/mergeEditor/browser/utils", "vs/workbench/contrib/mergeEditor/browser/view/colors", "vs/workbench/contrib/mergeEditor/browser/view/editorGutter", "vs/workbench/contrib/mergeEditor/common/mergeEditor", "./codeEditorView"], function (require, exports, dom_1, actionbar_1, iconLabels_1, arrays_1, errors_1, lifecycle_1, observable_1, model_1, nls_1, actions_1, configuration_1, contextkey_1, instantiation_1, label_1, lineRange_1, utils_1, colors_1, editorGutter_1, mergeEditor_1, codeEditorView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResultCodeEditorView = void 0;
    let ResultCodeEditorView = class ResultCodeEditorView extends codeEditorView_1.CodeEditorView {
        constructor(viewModel, instantiationService, _labelService, configurationService) {
            super(instantiationService, viewModel, configurationService);
            this._labelService = _labelService;
            this.decorations = (0, observable_1.derived)(this, reader => {
                const viewModel = this.viewModel.read(reader);
                if (!viewModel) {
                    return [];
                }
                const model = viewModel.model;
                const textModel = model.resultTextModel;
                const result = new Array();
                const baseRangeWithStoreAndTouchingDiffs = (0, utils_1.join)(model.modifiedBaseRanges.read(reader), model.baseResultDiffs.read(reader), (baseRange, diff) => baseRange.baseRange.touches(diff.inputRange)
                    ? arrays_1.CompareResult.neitherLessOrGreaterThan
                    : lineRange_1.LineRange.compareByStart(baseRange.baseRange, diff.inputRange));
                const activeModifiedBaseRange = viewModel.activeModifiedBaseRange.read(reader);
                const showNonConflictingChanges = viewModel.showNonConflictingChanges.read(reader);
                for (const m of baseRangeWithStoreAndTouchingDiffs) {
                    const modifiedBaseRange = m.left;
                    if (modifiedBaseRange) {
                        const blockClassNames = ['merge-editor-block'];
                        let blockPadding = [0, 0, 0, 0];
                        const isHandled = model.isHandled(modifiedBaseRange).read(reader);
                        if (isHandled) {
                            blockClassNames.push('handled');
                        }
                        if (modifiedBaseRange === activeModifiedBaseRange) {
                            blockClassNames.push('focused');
                            blockPadding = [0, 2, 0, 2];
                        }
                        if (modifiedBaseRange.isConflicting) {
                            blockClassNames.push('conflicting');
                        }
                        blockClassNames.push('result');
                        if (!modifiedBaseRange.isConflicting && !showNonConflictingChanges && isHandled) {
                            continue;
                        }
                        const range = model.getLineRangeInResult(modifiedBaseRange.baseRange, reader);
                        result.push({
                            range: range.toInclusiveRangeOrEmpty(),
                            options: {
                                showIfCollapsed: true,
                                blockClassName: blockClassNames.join(' '),
                                blockPadding,
                                blockIsAfterEnd: range.startLineNumber > textModel.getLineCount(),
                                description: 'Result Diff',
                                minimap: {
                                    position: 2 /* MinimapPosition.Gutter */,
                                    color: { id: isHandled ? colors_1.handledConflictMinimapOverViewRulerColor : colors_1.unhandledConflictMinimapOverViewRulerColor },
                                },
                                overviewRuler: modifiedBaseRange.isConflicting ? {
                                    position: model_1.OverviewRulerLane.Center,
                                    color: { id: isHandled ? colors_1.handledConflictMinimapOverViewRulerColor : colors_1.unhandledConflictMinimapOverViewRulerColor },
                                } : undefined
                            }
                        });
                    }
                    if (!modifiedBaseRange || modifiedBaseRange.isConflicting) {
                        for (const diff of m.rights) {
                            const range = diff.outputRange.toInclusiveRange();
                            if (range) {
                                result.push({
                                    range,
                                    options: {
                                        className: `merge-editor-diff result`,
                                        description: 'Merge Editor',
                                        isWholeLine: true,
                                    }
                                });
                            }
                            if (diff.rangeMappings) {
                                for (const d of diff.rangeMappings) {
                                    result.push({
                                        range: d.outputRange,
                                        options: {
                                            className: `merge-editor-diff-word result`,
                                            description: 'Merge Editor'
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
                return result;
            });
            this.editor.invokeWithinContext(accessor => {
                const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
                const isMergeResultEditor = mergeEditor_1.ctxIsMergeResultEditor.bindTo(contextKeyService);
                isMergeResultEditor.set(true);
                this._register((0, lifecycle_1.toDisposable)(() => isMergeResultEditor.reset()));
            });
            this.htmlElements.gutterDiv.style.width = '5px';
            this.htmlElements.root.classList.add(`result`);
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description update checkboxes */
                if (this.checkboxesVisible.read(reader)) {
                    store.add(new editorGutter_1.EditorGutter(this.editor, this.htmlElements.gutterDiv, {
                        getIntersectingGutterItems: (range, reader) => [],
                        createView: (item, target) => { throw new errors_1.BugIndicatingError(); },
                    }));
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update labels & text model */
                const vm = this.viewModel.read(reader);
                if (!vm) {
                    return;
                }
                this.editor.setModel(vm.model.resultTextModel);
                (0, dom_1.reset)(this.htmlElements.title, ...(0, iconLabels_1.renderLabelWithIcons)((0, nls_1.localize)('result', 'Result')));
                (0, dom_1.reset)(this.htmlElements.description, ...(0, iconLabels_1.renderLabelWithIcons)(this._labelService.getUriLabel(vm.model.resultTextModel.uri, { relative: true })));
            }));
            const remainingConflictsActionBar = this._register(new actionbar_1.ActionBar(this.htmlElements.detail));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update remainingConflicts label */
                const vm = this.viewModel.read(reader);
                if (!vm) {
                    return;
                }
                const model = vm.model;
                if (!model) {
                    return;
                }
                const count = model.unhandledConflictsCount.read(reader);
                const text = count === 1
                    ? (0, nls_1.localize)('mergeEditor.remainingConflicts', '{0} Conflict Remaining', count)
                    : (0, nls_1.localize)('mergeEditor.remainingConflict', '{0} Conflicts Remaining ', count);
                remainingConflictsActionBar.clear();
                remainingConflictsActionBar.push({
                    class: undefined,
                    enabled: count > 0,
                    id: 'nextConflict',
                    label: text,
                    run() {
                        vm.model.telemetry.reportConflictCounterClicked();
                        vm.goToNextModifiedBaseRange(m => !model.isHandled(m).get());
                    },
                    tooltip: count > 0
                        ? (0, nls_1.localize)('goToNextConflict', 'Go to next conflict')
                        : (0, nls_1.localize)('allConflictHandled', 'All conflicts handled, the merge can be completed now.'),
                });
            }));
            this._register((0, utils_1.applyObservableDecorations)(this.editor, this.decorations));
            this._register((0, codeEditorView_1.createSelectionsAutorun)(this, (baseRange, viewModel) => viewModel.model.translateBaseRangeToResult(baseRange)));
            this._register(instantiationService.createInstance(codeEditorView_1.TitleMenu, actions_1.MenuId.MergeInputResultToolbar, this.htmlElements.toolbar));
        }
    };
    exports.ResultCodeEditorView = ResultCodeEditorView;
    exports.ResultCodeEditorView = ResultCodeEditorView = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, label_1.ILabelService),
        __param(3, configuration_1.IConfigurationService)
    ], ResultCodeEditorView);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdWx0Q29kZUVkaXRvclZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2Jyb3dzZXIvdmlldy9lZGl0b3JzL3Jlc3VsdENvZGVFZGl0b3JWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXdCekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSwrQkFBYztRQUN2RCxZQUNDLFNBQXdELEVBQ2pDLG9CQUEyQyxFQUNuRCxhQUE2QyxFQUNyQyxvQkFBMkM7WUFFbEUsS0FBSyxDQUFDLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBSDdCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBb0c1QyxnQkFBVyxHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ3JELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ2hCLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUM7Z0JBQ0QsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztnQkFDOUIsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztnQkFDeEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxLQUFLLEVBQXlCLENBQUM7Z0JBRWxELE1BQU0sa0NBQWtDLEdBQUcsSUFBQSxZQUFJLEVBQzlDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQ3JDLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUNsQyxDQUFD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