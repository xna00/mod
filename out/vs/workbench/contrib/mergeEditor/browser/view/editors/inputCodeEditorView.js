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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/ui/toggle/toggle", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/observable", "vs/base/common/strings", "vs/base/common/types", "vs/editor/common/model", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/browser/defaultStyles", "vs/workbench/contrib/mergeEditor/browser/utils", "vs/workbench/contrib/mergeEditor/browser/view/colors", "../editorGutter", "./codeEditorView"], function (require, exports, dom_1, iconLabels_1, toggle_1, actions_1, codicons_1, lifecycle_1, numbers_1, observable_1, strings_1, types_1, model_1, nls_1, actions_2, configuration_1, contextView_1, instantiation_1, defaultStyles_1, utils_1, colors_1, editorGutter_1, codeEditorView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeConflictGutterItemView = exports.ModifiedBaseRangeGutterItemModel = exports.InputCodeEditorView = void 0;
    let InputCodeEditorView = class InputCodeEditorView extends codeEditorView_1.CodeEditorView {
        constructor(inputNumber, viewModel, instantiationService, contextMenuService, configurationService) {
            super(instantiationService, viewModel, configurationService);
            this.inputNumber = inputNumber;
            this.otherInputNumber = this.inputNumber === 1 ? 2 : 1;
            this.modifiedBaseRangeGutterItemInfos = (0, observable_1.derivedOpts)({ debugName: `input${this.inputNumber}.modifiedBaseRangeGutterItemInfos` }, reader => {
                const viewModel = this.viewModel.read(reader);
                if (!viewModel) {
                    return [];
                }
                const model = viewModel.model;
                const inputNumber = this.inputNumber;
                const showNonConflictingChanges = viewModel.showNonConflictingChanges.read(reader);
                return model.modifiedBaseRanges.read(reader)
                    .filter((r) => r.getInputDiffs(this.inputNumber).length > 0 && (showNonConflictingChanges || r.isConflicting || !model.isHandled(r).read(reader)))
                    .map((baseRange, idx) => new ModifiedBaseRangeGutterItemModel(idx.toString(), baseRange, inputNumber, viewModel));
            });
            this.decorations = (0, observable_1.derivedOpts)({ debugName: `input${this.inputNumber}.decorations` }, reader => {
                const viewModel = this.viewModel.read(reader);
                if (!viewModel) {
                    return [];
                }
                const model = viewModel.model;
                const textModel = (this.inputNumber === 1 ? model.input1 : model.input2).textModel;
                const activeModifiedBaseRange = viewModel.activeModifiedBaseRange.read(reader);
                const result = new Array();
                const showNonConflictingChanges = viewModel.showNonConflictingChanges.read(reader);
                const showDeletionMarkers = this.showDeletionMarkers.read(reader);
                const diffWithThis = viewModel.baseCodeEditorView.read(reader) !== undefined && viewModel.baseShowDiffAgainst.read(reader) === this.inputNumber;
                const useSimplifiedDecorations = !diffWithThis && this.useSimplifiedDecorations.read(reader);
                for (const modifiedBaseRange of model.modifiedBaseRanges.read(reader)) {
                    const range = modifiedBaseRange.getInputRange(this.inputNumber);
                    if (!range) {
                        continue;
                    }
                    const blockClassNames = ['merge-editor-block'];
                    let blockPadding = [0, 0, 0, 0];
                    const isHandled = model.isInputHandled(modifiedBaseRange, this.inputNumber).read(reader);
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
                    const inputClassName = this.inputNumber === 1 ? 'input i1' : 'input i2';
                    blockClassNames.push(inputClassName);
                    if (!modifiedBaseRange.isConflicting && !showNonConflictingChanges && isHandled) {
                        continue;
                    }
                    if (useSimplifiedDecorations && !isHandled) {
                        blockClassNames.push('use-simplified-decorations');
                    }
                    result.push({
                        range: range.toInclusiveRangeOrEmpty(),
                        options: {
                            showIfCollapsed: true,
                            blockClassName: blockClassNames.join(' '),
                            blockPadding,
                            blockIsAfterEnd: range.startLineNumber > textModel.getLineCount(),
                            description: 'Merge Editor',
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
                    if (!useSimplifiedDecorations && (modifiedBaseRange.isConflicting || !model.isHandled(modifiedBaseRange).read(reader))) {
                        const inputDiffs = modifiedBaseRange.getInputDiffs(this.inputNumber);
                        for (const diff of inputDiffs) {
                            const range = diff.outputRange.toInclusiveRange();
                            if (range) {
                                result.push({
                                    range,
                                    options: {
                                        className: `merge-editor-diff ${inputClassName}`,
                                        description: 'Merge Editor',
                                        isWholeLine: true,
                                    }
                                });
                            }
                            if (diff.rangeMappings) {
                                for (const d of diff.rangeMappings) {
                                    if (showDeletionMarkers || !d.outputRange.isEmpty()) {
                                        result.push({
                                            range: d.outputRange,
                                            options: {
                                                className: d.outputRange.isEmpty() ? `merge-editor-diff-empty-word ${inputClassName}` : `merge-editor-diff-word ${inputClassName}`,
                                                description: 'Merge Editor',
                                                showIfCollapsed: true,
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                return result;
            });
            this.htmlElements.root.classList.add(`input`);
            this._register(new editorGutter_1.EditorGutter(this.editor, this.htmlElements.gutterDiv, {
                getIntersectingGutterItems: (range, reader) => {
                    if (this.checkboxesVisible.read(reader)) {
                        return this.modifiedBaseRangeGutterItemInfos.read(reader);
                    }
                    else {
                        return [];
                    }
                },
                createView: (item, target) => new MergeConflictGutterItemView(item, target, contextMenuService),
            }));
            this._register((0, codeEditorView_1.createSelectionsAutorun)(this, (baseRange, viewModel) => viewModel.model.translateBaseRangeToInput(this.inputNumber, baseRange)));
            this._register(instantiationService.createInstance(codeEditorView_1.TitleMenu, inputNumber === 1 ? actions_2.MenuId.MergeInput1Toolbar : actions_2.MenuId.MergeInput2Toolbar, this.htmlElements.toolbar));
            this._register((0, observable_1.autorunOpts)({ debugName: `input${this.inputNumber}: update labels & text model` }, reader => {
                const vm = this.viewModel.read(reader);
                if (!vm) {
                    return;
                }
                this.editor.setModel(this.inputNumber === 1 ? vm.model.input1.textModel : vm.model.input2.textModel);
                const title = this.inputNumber === 1
                    ? vm.model.input1.title || (0, nls_1.localize)('input1', 'Input 1')
                    : vm.model.input2.title || (0, nls_1.localize)('input2', 'Input 2');
                const description = this.inputNumber === 1
                    ? vm.model.input1.description
                    : vm.model.input2.description;
                const detail = this.inputNumber === 1
                    ? vm.model.input1.detail
                    : vm.model.input2.detail;
                (0, dom_1.reset)(this.htmlElements.title, ...(0, iconLabels_1.renderLabelWithIcons)(title));
                (0, dom_1.reset)(this.htmlElements.description, ...(description ? (0, iconLabels_1.renderLabelWithIcons)(description) : []));
                (0, dom_1.reset)(this.htmlElements.detail, ...(detail ? (0, iconLabels_1.renderLabelWithIcons)(detail) : []));
            }));
            this._register((0, utils_1.applyObservableDecorations)(this.editor, this.decorations));
        }
    };
    exports.InputCodeEditorView = InputCodeEditorView;
    exports.InputCodeEditorView = InputCodeEditorView = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService)
    ], InputCodeEditorView);
    class ModifiedBaseRangeGutterItemModel {
        constructor(id, baseRange, inputNumber, viewModel) {
            this.id = id;
            this.baseRange = baseRange;
            this.inputNumber = inputNumber;
            this.viewModel = viewModel;
            this.model = this.viewModel.model;
            this.range = this.baseRange.getInputRange(this.inputNumber);
            this.enabled = this.model.isUpToDate;
            this.toggleState = (0, observable_1.derived)(this, reader => {
                const input = this.model
                    .getState(this.baseRange)
                    .read(reader)
                    .getInput(this.inputNumber);
                return input === 2 /* InputState.second */ && !this.baseRange.isOrderRelevant
                    ? 1 /* InputState.first */
                    : input;
            });
            this.state = (0, observable_1.derived)(this, reader => {
                const active = this.viewModel.activeModifiedBaseRange.read(reader);
                if (!this.model.hasBaseRange(this.baseRange)) {
                    return { handled: false, focused: false }; // Invalid state, should only be observed temporarily
                }
                return {
                    handled: this.model.isHandled(this.baseRange).read(reader),
                    focused: this.baseRange === active,
                };
            });
        }
        setState(value, tx) {
            this.viewModel.setState(this.baseRange, this.model
                .getState(this.baseRange)
                .get()
                .withInputValue(this.inputNumber, value), tx, this.inputNumber);
        }
        toggleBothSides() {
            (0, observable_1.transaction)(tx => {
                /** @description Context Menu: toggle both sides */
                const state = this.model
                    .getState(this.baseRange)
                    .get();
                this.model.setState(this.baseRange, state
                    .toggle(this.inputNumber)
                    .toggle(this.inputNumber === 1 ? 2 : 1), true, tx);
            });
        }
        getContextMenuActions() {
            const state = this.model.getState(this.baseRange).get();
            const handled = this.model.isHandled(this.baseRange).get();
            const update = (newState) => {
                (0, observable_1.transaction)(tx => {
                    /** @description Context Menu: Update Base Range State */
                    return this.viewModel.setState(this.baseRange, newState, tx, this.inputNumber);
                });
            };
            function action(id, label, targetState, checked) {
                const action = new actions_1.Action(id, label, undefined, true, () => {
                    update(targetState);
                });
                action.checked = checked;
                return action;
            }
            const both = state.includesInput1 && state.includesInput2;
            return [
                this.baseRange.input1Diffs.length > 0
                    ? action('mergeEditor.acceptInput1', (0, nls_1.localize)('mergeEditor.accept', 'Accept {0}', this.model.input1.title), state.toggle(1), state.includesInput1)
                    : undefined,
                this.baseRange.input2Diffs.length > 0
                    ? action('mergeEditor.acceptInput2', (0, nls_1.localize)('mergeEditor.accept', 'Accept {0}', this.model.input2.title), state.toggle(2), state.includesInput2)
                    : undefined,
                this.baseRange.isConflicting
                    ? (0, utils_1.setFields)(action('mergeEditor.acceptBoth', (0, nls_1.localize)('mergeEditor.acceptBoth', 'Accept Both'), state.withInputValue(1, !both).withInputValue(2, !both), both), { enabled: this.baseRange.canBeCombined })
                    : undefined,
                new actions_1.Separator(),
                this.baseRange.isConflicting
                    ? (0, utils_1.setFields)(action('mergeEditor.swap', (0, nls_1.localize)('mergeEditor.swap', 'Swap'), state.swap(), false), { enabled: !state.kind && (!both || this.baseRange.isOrderRelevant) })
                    : undefined,
                (0, utils_1.setFields)(new actions_1.Action('mergeEditor.markAsHandled', (0, nls_1.localize)('mergeEditor.markAsHandled', 'Mark as Handled'), undefined, true, () => {
                    (0, observable_1.transaction)((tx) => {
                        /** @description Context Menu: Mark as handled */
                        this.model.setHandled(this.baseRange, !handled, tx);
                    });
                }), { checked: handled }),
            ].filter(types_1.isDefined);
        }
    }
    exports.ModifiedBaseRangeGutterItemModel = ModifiedBaseRangeGutterItemModel;
    class MergeConflictGutterItemView extends lifecycle_1.Disposable {
        constructor(item, target, contextMenuService) {
            super();
            this.isMultiLine = (0, observable_1.observableValue)(this, false);
            this.item = (0, observable_1.observableValue)(this, item);
            const checkBox = new toggle_1.Toggle({
                isChecked: false,
                title: '',
                icon: codicons_1.Codicon.check,
                ...defaultStyles_1.defaultToggleStyles
            });
            checkBox.domNode.classList.add('accept-conflict-group');
            this._register((0, dom_1.addDisposableListener)(checkBox.domNode, dom_1.EventType.MOUSE_DOWN, (e) => {
                const item = this.item.get();
                if (!item) {
                    return;
                }
                if (e.button === /* Right */ 2) {
                    e.stopPropagation();
                    e.preventDefault();
                    contextMenuService.showContextMenu({
                        getAnchor: () => checkBox.domNode,
                        getActions: () => item.getContextMenuActions(),
                    });
                }
                else if (e.button === /* Middle */ 1) {
                    e.stopPropagation();
                    e.preventDefault();
                    item.toggleBothSides();
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description Update Checkbox */
                const item = this.item.read(reader);
                const value = item.toggleState.read(reader);
                const iconMap = {
                    [0 /* InputState.excluded */]: { icon: undefined, checked: false, title: (0, nls_1.localize)('accept.excluded', "Accept") },
                    [3 /* InputState.unrecognized */]: { icon: codicons_1.Codicon.circleFilled, checked: false, title: (0, nls_1.localize)('accept.conflicting', "Accept (result is dirty)") },
                    [1 /* InputState.first */]: { icon: codicons_1.Codicon.check, checked: true, title: (0, nls_1.localize)('accept.first', "Undo accept") },
                    [2 /* InputState.second */]: { icon: codicons_1.Codicon.checkAll, checked: true, title: (0, nls_1.localize)('accept.second', "Undo accept (currently second)") },
                };
                const state = iconMap[value];
                checkBox.setIcon(state.icon);
                checkBox.checked = state.checked;
                checkBox.setTitle(state.title);
                if (!item.enabled.read(reader)) {
                    checkBox.disable();
                }
                else {
                    checkBox.enable();
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description Update Checkbox CSS ClassNames */
                const state = this.item.read(reader).state.read(reader);
                const classNames = [
                    'merge-accept-gutter-marker',
                    state.handled && 'handled',
                    state.focused && 'focused',
                    this.isMultiLine.read(reader) ? 'multi-line' : 'single-line',
                ];
                target.className = classNames.filter(c => typeof c === 'string').join(' ');
            }));
            this._register(checkBox.onChange(() => {
                (0, observable_1.transaction)(tx => {
                    /** @description Handle Checkbox Change */
                    this.item.get().setState(checkBox.checked, tx);
                });
            }));
            target.appendChild((0, dom_1.h)('div.background', [strings_1.noBreakWhitespace]).root);
            target.appendChild(this.checkboxDiv = (0, dom_1.h)('div.checkbox', [(0, dom_1.h)('div.checkbox-background', [checkBox.domNode])]).root);
        }
        layout(top, height, viewTop, viewHeight) {
            const checkboxHeight = this.checkboxDiv.clientHeight;
            const middleHeight = height / 2 - checkboxHeight / 2;
            const margin = checkboxHeight;
            let effectiveCheckboxTop = top + middleHeight;
            const preferredViewPortRange = [
                margin,
                viewTop + viewHeight - margin - checkboxHeight
            ];
            const preferredParentRange = [
                top + margin,
                top + height - checkboxHeight - margin
            ];
            if (preferredParentRange[0] < preferredParentRange[1]) {
                effectiveCheckboxTop = (0, numbers_1.clamp)(effectiveCheckboxTop, preferredViewPortRange[0], preferredViewPortRange[1]);
                effectiveCheckboxTop = (0, numbers_1.clamp)(effectiveCheckboxTop, preferredParentRange[0], preferredParentRange[1]);
            }
            this.checkboxDiv.style.top = `${effectiveCheckboxTop - top}px`;
            (0, observable_1.transaction)((tx) => {
                /** @description MergeConflictGutterItemView: Update Is Multi Line */
                this.isMultiLine.set(height > 30, tx);
            });
        }
        update(baseRange) {
            (0, observable_1.transaction)(tx => {
                /** @description MergeConflictGutterItemView: Updating new base range */
                this.item.set(baseRange, tx);
            });
        }
    }
    exports.MergeConflictGutterItemView = MergeConflictGutterItemView;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRDb2RlRWRpdG9yVmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWVyZ2VFZGl0b3IvYnJvd3Nlci92aWV3L2VkaXRvcnMvaW5wdXRDb2RlRWRpdG9yVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyQnpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsK0JBQWM7UUFHdEQsWUFDaUIsV0FBa0IsRUFDbEMsU0FBd0QsRUFDakMsb0JBQTJDLEVBQzdDLGtCQUF1QyxFQUNyQyxvQkFBMkM7WUFFbEUsS0FBSyxDQUFDLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBTjdDLGdCQUFXLEdBQVgsV0FBVyxDQUFPO1lBSG5CLHFCQUFnQixHQUFHLElBQUksQ0FBQyxXQUFXLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQXFFakQscUNBQWdDLEdBQUcsSUFBQSx3QkFBVyxFQUFDLEVBQUUsU0FBUyxFQUFFLFFBQVEsSUFBSSxDQUFDLFdBQVcsbUNBQW1DLEVBQUUsRUFBRSxNQUFNLENBQUMsRUFBRTtnQkFDcEosTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzlDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFBQyxPQUFPLEVBQUUsQ0FBQztnQkFBQyxDQUFDO2dCQUM5QixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDO2dCQUM5QixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO2dCQUVyQyxNQUFNLHlCQUF5QixHQUFHLFNBQVMsQ0FBQyx5QkFB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