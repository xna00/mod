/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/config/editorOptions", "vs/nls", "vs/workbench/contrib/mergeEditor/browser/model/modifiedBaseRange", "vs/workbench/contrib/mergeEditor/browser/view/fixedZoneWidget"], function (require, exports, dom_1, iconLabels_1, hash_1, lifecycle_1, observable_1, editorOptions_1, nls_1, modifiedBaseRange_1, fixedZoneWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActionsSource = exports.ConflictActionsFactory = void 0;
    class ConflictActionsFactory extends lifecycle_1.Disposable {
        constructor(_editor) {
            super();
            this._editor = _editor;
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(50 /* EditorOption.fontInfo */) || e.hasChanged(19 /* EditorOption.codeLensFontSize */) || e.hasChanged(18 /* EditorOption.codeLensFontFamily */)) {
                    this._updateLensStyle();
                }
            }));
            this._styleClassName = '_conflictActionsFactory_' + (0, hash_1.hash)(this._editor.getId()).toString(16);
            this._styleElement = (0, dom_1.createStyleSheet)((0, dom_1.isInShadowDOM)(this._editor.getContainerDomNode())
                ? this._editor.getContainerDomNode()
                : undefined, undefined, this._store);
            this._updateLensStyle();
        }
        _updateLensStyle() {
            const { codeLensHeight, fontSize } = this._getLayoutInfo();
            const fontFamily = this._editor.getOption(18 /* EditorOption.codeLensFontFamily */);
            const editorFontInfo = this._editor.getOption(50 /* EditorOption.fontInfo */);
            const fontFamilyVar = `--codelens-font-family${this._styleClassName}`;
            const fontFeaturesVar = `--codelens-font-features${this._styleClassName}`;
            let newStyle = `
		.${this._styleClassName} { line-height: ${codeLensHeight}px; font-size: ${fontSize}px; padding-right: ${Math.round(fontSize * 0.5)}px; font-feature-settings: var(${fontFeaturesVar}) }
		.monaco-workbench .${this._styleClassName} span.codicon { line-height: ${codeLensHeight}px; font-size: ${fontSize}px; }
		`;
            if (fontFamily) {
                newStyle += `${this._styleClassName} { font-family: var(${fontFamilyVar}), ${editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily}}`;
            }
            this._styleElement.textContent = newStyle;
            this._editor.getContainerDomNode().style.setProperty(fontFamilyVar, fontFamily ?? 'inherit');
            this._editor.getContainerDomNode().style.setProperty(fontFeaturesVar, editorFontInfo.fontFeatureSettings);
        }
        _getLayoutInfo() {
            const lineHeightFactor = Math.max(1.3, this._editor.getOption(67 /* EditorOption.lineHeight */) / this._editor.getOption(52 /* EditorOption.fontSize */));
            let fontSize = this._editor.getOption(19 /* EditorOption.codeLensFontSize */);
            if (!fontSize || fontSize < 5) {
                fontSize = (this._editor.getOption(52 /* EditorOption.fontSize */) * .9) | 0;
            }
            return {
                fontSize,
                codeLensHeight: (fontSize * lineHeightFactor) | 0,
            };
        }
        createWidget(viewZoneChangeAccessor, lineNumber, items, viewZoneIdsToCleanUp) {
            const layoutInfo = this._getLayoutInfo();
            return new ActionsContentWidget(this._editor, viewZoneChangeAccessor, lineNumber, layoutInfo.codeLensHeight + 2, this._styleClassName, items, viewZoneIdsToCleanUp);
        }
    }
    exports.ConflictActionsFactory = ConflictActionsFactory;
    class ActionsSource {
        constructor(viewModel, modifiedBaseRange) {
            this.viewModel = viewModel;
            this.modifiedBaseRange = modifiedBaseRange;
            this.itemsInput1 = this.getItemsInput(1);
            this.itemsInput2 = this.getItemsInput(2);
            this.resultItems = (0, observable_1.derived)(this, reader => {
                const viewModel = this.viewModel;
                const modifiedBaseRange = this.modifiedBaseRange;
                const state = viewModel.model.getState(modifiedBaseRange).read(reader);
                const model = viewModel.model;
                const result = [];
                if (state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized) {
                    result.push({
                        text: (0, nls_1.localize)('manualResolution', "Manual Resolution"),
                        tooltip: (0, nls_1.localize)('manualResolutionTooltip', "This conflict has been resolved manually."),
                    });
                }
                else if (state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.base) {
                    result.push({
                        text: (0, nls_1.localize)('noChangesAccepted', 'No Changes Accepted'),
                        tooltip: (0, nls_1.localize)('noChangesAcceptedTooltip', 'The current resolution of this conflict equals the common ancestor of both the right and left changes.'),
                    });
                }
                else {
                    const labels = [];
                    if (state.includesInput1) {
                        labels.push(model.input1.title);
                    }
                    if (state.includesInput2) {
                        labels.push(model.input2.title);
                    }
                    if (state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.both && state.firstInput === 2) {
                        labels.reverse();
                    }
                    result.push({
                        text: `${labels.join(' + ')}`
                    });
                }
                const stateToggles = [];
                if (state.includesInput1) {
                    stateToggles.push(command((0, nls_1.localize)('remove', 'Remove {0}', model.input1.title), async () => {
                        (0, observable_1.transaction)((tx) => {
                            model.setState(modifiedBaseRange, state.withInputValue(1, false), true, tx);
                            model.telemetry.reportRemoveInvoked(1, state.includesInput(2));
                        });
                    }, (0, nls_1.localize)('removeTooltip', 'Remove {0} from the result document.', model.input1.title)));
                }
                if (state.includesInput2) {
                    stateToggles.push(command((0, nls_1.localize)('remove', 'Remove {0}', model.input2.title), async () => {
                        (0, observable_1.transaction)((tx) => {
                            model.setState(modifiedBaseRange, state.withInputValue(2, false), true, tx);
                            model.telemetry.reportRemoveInvoked(2, state.includesInput(1));
                        });
                    }, (0, nls_1.localize)('removeTooltip', 'Remove {0} from the result document.', model.input2.title)));
                }
                if (state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.both &&
                    state.firstInput === 2) {
                    stateToggles.reverse();
                }
                result.push(...stateToggles);
                if (state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized) {
                    result.push(command((0, nls_1.localize)('resetToBase', 'Reset to base'), async () => {
                        (0, observable_1.transaction)((tx) => {
                            model.setState(modifiedBaseRange, modifiedBaseRange_1.ModifiedBaseRangeState.base, true, tx);
                            model.telemetry.reportResetToBaseInvoked();
                        });
                    }, (0, nls_1.localize)('resetToBaseTooltip', 'Reset this conflict to the common ancestor of both the right and left changes.')));
                }
                return result;
            });
            this.isEmpty = (0, observable_1.derived)(this, reader => {
                return this.itemsInput1.read(reader).length + this.itemsInput2.read(reader).length + this.resultItems.read(reader).length === 0;
            });
            this.inputIsEmpty = (0, observable_1.derived)(this, reader => {
                return this.itemsInput1.read(reader).length + this.itemsInput2.read(reader).length === 0;
            });
        }
        getItemsInput(inputNumber) {
            return (0, observable_1.derived)(reader => {
                /** @description items */
                const viewModel = this.viewModel;
                const modifiedBaseRange = this.modifiedBaseRange;
                if (!viewModel.model.hasBaseRange(modifiedBaseRange)) {
                    return [];
                }
                const state = viewModel.model.getState(modifiedBaseRange).read(reader);
                const handled = viewModel.model.isHandled(modifiedBaseRange).read(reader);
                const model = viewModel.model;
                const result = [];
                const inputData = inputNumber === 1 ? viewModel.model.input1 : viewModel.model.input2;
                const showNonConflictingChanges = viewModel.showNonConflictingChanges.read(reader);
                if (!modifiedBaseRange.isConflicting && handled && !showNonConflictingChanges) {
                    return [];
                }
                const otherInputNumber = inputNumber === 1 ? 2 : 1;
                if (state.kind !== modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized && !state.isInputIncluded(inputNumber)) {
                    if (!state.isInputIncluded(otherInputNumber) || !this.viewModel.shouldUseAppendInsteadOfAccept.read(reader)) {
                        result.push(command((0, nls_1.localize)('accept', "Accept {0}", inputData.title), async () => {
                            (0, observable_1.transaction)((tx) => {
                                model.setState(modifiedBaseRange, state.withInputValue(inputNumber, true, false), inputNumber, tx);
                                model.telemetry.reportAcceptInvoked(inputNumber, state.includesInput(otherInputNumber));
                            });
                        }, (0, nls_1.localize)('acceptTooltip', "Accept {0} in the result document.", inputData.title)));
                        if (modifiedBaseRange.canBeCombined) {
                            const commandName = modifiedBaseRange.isOrderRelevant
                                ? (0, nls_1.localize)('acceptBoth0First', "Accept Combination ({0} First)", inputData.title)
                                : (0, nls_1.localize)('acceptBoth', "Accept Combination");
                            result.push(command(commandName, async () => {
                                (0, observable_1.transaction)((tx) => {
                                    model.setState(modifiedBaseRange, modifiedBaseRange_1.ModifiedBaseRangeState.base
                                        .withInputValue(inputNumber, true)
                                        .withInputValue(otherInputNumber, true, true), true, tx);
                                    model.telemetry.reportSmartCombinationInvoked(state.includesInput(otherInputNumber));
                                });
                            }, (0, nls_1.localize)('acceptBothTooltip', "Accept an automatic combination of both sides in the result document.")));
                        }
                    }
                    else {
                        result.push(command((0, nls_1.localize)('append', "Append {0}", inputData.title), async () => {
                            (0, observable_1.transaction)((tx) => {
                                model.setState(modifiedBaseRange, state.withInputValue(inputNumber, true, false), inputNumber, tx);
                                model.telemetry.reportAcceptInvoked(inputNumber, state.includesInput(otherInputNumber));
                            });
                        }, (0, nls_1.localize)('appendTooltip', "Append {0} to the result document.", inputData.title)));
                        if (modifiedBaseRange.canBeCombined) {
                            result.push(command((0, nls_1.localize)('combine', "Accept Combination", inputData.title), async () => {
                                (0, observable_1.transaction)((tx) => {
                                    model.setState(modifiedBaseRange, state.withInputValue(inputNumber, true, true), inputNumber, tx);
                                    model.telemetry.reportSmartCombinationInvoked(state.includesInput(otherInputNumber));
                                });
                            }, (0, nls_1.localize)('acceptBothTooltip', "Accept an automatic combination of both sides in the result document.")));
                        }
                    }
                    if (!model.isInputHandled(modifiedBaseRange, inputNumber).read(reader)) {
                        result.push(command((0, nls_1.localize)('ignore', 'Ignore'), async () => {
                            (0, observable_1.transaction)((tx) => {
                                model.setInputHandled(modifiedBaseRange, inputNumber, true, tx);
                            });
                        }, (0, nls_1.localize)('markAsHandledTooltip', "Don't take this side of the conflict.")));
                    }
                }
                return result;
            });
        }
    }
    exports.ActionsSource = ActionsSource;
    function command(title, action, tooltip) {
        return {
            text: title,
            action,
            tooltip,
        };
    }
    class ActionsContentWidget extends fixedZoneWidget_1.FixedZoneWidget {
        constructor(editor, viewZoneAccessor, afterLineNumber, height, className, items, viewZoneIdsToCleanUp) {
            super(editor, viewZoneAccessor, afterLineNumber, height, viewZoneIdsToCleanUp);
            this._domNode = (0, dom_1.h)('div.merge-editor-conflict-actions').root;
            this.widgetDomNode.appendChild(this._domNode);
            this._domNode.classList.add(className);
            this._register((0, observable_1.autorun)(reader => {
                /** @description update commands */
                const i = items.read(reader);
                this.setState(i);
            }));
        }
        setState(items) {
            const children = [];
            let isFirst = true;
            for (const item of items) {
                if (isFirst) {
                    isFirst = false;
                }
                else {
                    children.push((0, dom_1.$)('span', undefined, '\u00a0|\u00a0'));
                }
                const title = (0, iconLabels_1.renderLabelWithIcons)(item.text);
                if (item.action) {
                    children.push((0, dom_1.$)('a', { title: item.tooltip, role: 'button', onclick: () => item.action() }, ...title));
                }
                else {
                    children.push((0, dom_1.$)('span', { title: item.tooltip }, ...title));
                }
            }
            (0, dom_1.reset)(this._domNode, ...children);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmxpY3RBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL3ZpZXcvY29uZmxpY3RBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyxNQUFhLHNCQUF1QixTQUFRLHNCQUFVO1FBSXJELFlBQTZCLE9BQW9CO1lBQ2hELEtBQUssRUFBRSxDQUFDO1lBRG9CLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFHaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQzFELElBQUksQ0FBQyxDQUFDLFVBQVUsZ0NBQXVCLElBQUksQ0FBQyxDQUFDLFVBQVUsd0NBQStCLElBQUksQ0FBQyxDQUFDLFVBQVUsMENBQWlDLEVBQUUsQ0FBQztvQkFDekksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3pCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLGVBQWUsR0FBRywwQkFBMEIsR0FBRyxJQUFBLFdBQUksRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVGLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBQSxzQkFBZ0IsRUFDcEMsSUFBQSxtQkFBYSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDaEQsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUU7Z0JBQ3BDLENBQUMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQ3BDLENBQUM7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