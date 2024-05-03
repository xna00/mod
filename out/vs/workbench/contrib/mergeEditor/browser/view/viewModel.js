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
define(["require", "exports", "vs/base/common/arraysFind", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/range", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "vs/workbench/contrib/mergeEditor/browser/utils"], function (require, exports, arraysFind_1, lifecycle_1, observable_1, range_1, nls_1, configuration_1, notification_1, lineRange_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorViewModel = void 0;
    let MergeEditorViewModel = class MergeEditorViewModel extends lifecycle_1.Disposable {
        constructor(model, inputCodeEditorView1, inputCodeEditorView2, resultCodeEditorView, baseCodeEditorView, showNonConflictingChanges, configurationService, notificationService) {
            super();
            this.model = model;
            this.inputCodeEditorView1 = inputCodeEditorView1;
            this.inputCodeEditorView2 = inputCodeEditorView2;
            this.resultCodeEditorView = resultCodeEditorView;
            this.baseCodeEditorView = baseCodeEditorView;
            this.showNonConflictingChanges = showNonConflictingChanges;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.manuallySetActiveModifiedBaseRange = (0, observable_1.observableValue)(this, { range: undefined, counter: 0 });
            this.attachedHistory = this._register(new AttachedHistory(this.model.resultTextModel));
            this.shouldUseAppendInsteadOfAccept = (0, utils_1.observableConfigValue)('mergeEditor.shouldUseAppendInsteadOfAccept', false, this.configurationService);
            this.counter = 0;
            this.lastFocusedEditor = (0, observable_1.derivedObservableWithWritableCache)(this, (reader, lastValue) => {
                const editors = [
                    this.inputCodeEditorView1,
                    this.inputCodeEditorView2,
                    this.resultCodeEditorView,
                    this.baseCodeEditorView.read(reader),
                ];
                const view = editors.find((e) => e && e.isFocused.read(reader));
                return view ? { view, counter: this.counter++ } : lastValue || { view: undefined, counter: this.counter++ };
            });
            this.baseShowDiffAgainst = (0, observable_1.derived)(this, reader => {
                const lastFocusedEditor = this.lastFocusedEditor.read(reader);
                if (lastFocusedEditor.view === this.inputCodeEditorView1) {
                    return 1;
                }
                else if (lastFocusedEditor.view === this.inputCodeEditorView2) {
                    return 2;
                }
                return undefined;
            });
            this.selectionInBase = (0, observable_1.derived)(this, reader => {
                const sourceEditor = this.lastFocusedEditor.read(reader).view;
                if (!sourceEditor) {
                    return undefined;
                }
                const selections = sourceEditor.selection.read(reader) || [];
                const rangesInBase = selections.map((selection) => {
                    if (sourceEditor === this.inputCodeEditorView1) {
                        return this.model.translateInputRangeToBase(1, selection);
                    }
                    else if (sourceEditor === this.inputCodeEditorView2) {
                        return this.model.translateInputRangeToBase(2, selection);
                    }
                    else if (sourceEditor === this.resultCodeEditorView) {
                        return this.model.translateResultRangeToBase(selection);
                    }
                    else if (sourceEditor === this.baseCodeEditorView.read(reader)) {
                        return selection;
                    }
                    else {
                        return selection;
                    }
                });
                return {
                    rangesInBase,
                    sourceEditor
                };
            });
            this.activeModifiedBaseRange = (0, observable_1.derived)(this, (reader) => {
                /** @description activeModifiedBaseRange */
                const focusedEditor = this.lastFocusedEditor.read(reader);
                const manualRange = this.manuallySetActiveModifiedBaseRange.read(reader);
                if (manualRange.counter > focusedEditor.counter) {
                    return manualRange.range;
                }
                if (!focusedEditor.view) {
                    return;
                }
                const cursorLineNumber = focusedEditor.view.cursorLineNumber.read(reader);
                if (!cursorLineNumber) {
                    return undefined;
                }
                const modifiedBaseRanges = this.model.modifiedBaseRanges.read(reader);
                return modifiedBaseRanges.find((r) => {
                    const range = this.getRangeOfModifiedBaseRange(focusedEditor.view, r, reader);
                    return range.isEmpty
                        ? range.startLineNumber === cursorLineNumber
                        : range.contains(cursorLineNumber);
                });
            });
            this._register(resultCodeEditorView.editor.onDidChangeModelContent(e => {
                if (this.model.isApplyingEditInResult || e.isRedoing || e.isUndoing) {
                    return;
                }
                const baseRangeStates = [];
                for (const change of e.changes) {
                    const rangeInBase = this.model.translateResultRangeToBase(range_1.Range.lift(change.range));
                    const baseRanges = this.model.findModifiedBaseRangesInRange(new lineRange_1.LineRange(rangeInBase.startLineNumber, rangeInBase.endLineNumber - rangeInBase.startLineNumber));
                    if (baseRanges.length === 1) {
                        const isHandled = this.model.isHandled(baseRanges[0]).get();
                        if (!isHandled) {
                            baseRangeStates.push(baseRanges[0]);
                        }
                    }
                }
                if (baseRangeStates.length === 0) {
                    return;
                }
                const element = {
                    model: this.model,
                    redo() {
                        (0, observable_1.transaction)(tx => {
                            /** @description Mark conflicts touched by manual edits as handled */
                            for (const r of baseRangeStates) {
                                this.model.setHandled(r, true, tx);
                            }
                        });
                    },
                    undo() {
                        (0, observable_1.transaction)(tx => {
                            /** @description Mark conflicts touched by manual edits as handled */
                            for (const r of baseRangeStates) {
                                this.model.setHandled(r, false, tx);
                            }
                        });
                    },
                };
                this.attachedHistory.pushAttachedHistoryElement(element);
                element.redo();
            }));
        }
        getRangeOfModifiedBaseRange(editor, modifiedBaseRange, reader) {
            if (editor === this.resultCodeEditorView) {
                return this.model.getLineRangeInResult(modifiedBaseRange.baseRange, reader);
            }
            else if (editor === this.baseCodeEditorView.get()) {
                return modifiedBaseRange.baseRange;
            }
            else {
                const input = editor === this.inputCodeEditorView1 ? 1 : 2;
                return modifiedBaseRange.getInputRange(input);
            }
        }
        setActiveModifiedBaseRange(range, tx) {
            this.manuallySetActiveModifiedBaseRange.set({ range, counter: this.counter++ }, tx);
        }
        setState(baseRange, state, tx, inputNumber) {
            this.manuallySetActiveModifiedBaseRange.set({ range: baseRange, counter: this.counter++ }, tx);
            this.model.setState(baseRange, state, inputNumber, tx);
        }
        goToConflict(getModifiedBaseRange) {
            let editor = this.lastFocusedEditor.get().view;
            if (!editor) {
                editor = this.resultCodeEditorView;
            }
            const curLineNumber = editor.editor.getPosition()?.lineNumber;
            if (curLineNumber === undefined) {
                return;
            }
            const modifiedBaseRange = getModifiedBaseRange(editor, curLineNumber);
            if (modifiedBaseRange) {
                const range = this.getRangeOfModifiedBaseRange(editor, modifiedBaseRange, undefined);
                editor.editor.focus();
                let startLineNumber = range.startLineNumber;
                let endLineNumberExclusive = range.endLineNumberExclusive;
                if (range.startLineNumber > editor.editor.getModel().getLineCount()) {
                    (0, observable_1.transaction)(tx => {
                        this.setActiveModifiedBaseRange(modifiedBaseRange, tx);
                    });
                    startLineNumber = endLineNumberExclusive = editor.editor.getModel().getLineCount();
                }
                editor.editor.setPosition({
                    lineNumber: startLineNumber,
                    column: editor.editor.getModel().getLineFirstNonWhitespaceColumn(startLineNumber),
                });
                editor.editor.revealLinesNearTop(startLineNumber, endLineNumberExclusive, 0 /* ScrollType.Smooth */);
            }
        }
        goToNextModifiedBaseRange(predicate) {
            this.goToConflict((e, l) => this.model.modifiedBaseRanges
                .get()
                .find((r) => predicate(r) &&
                this.getRangeOfModifiedBaseRange(e, r, undefined).startLineNumber > l) ||
                this.model.modifiedBaseRanges
                    .get()
                    .find((r) => predicate(r)));
        }
        goToPreviousModifiedBaseRange(predicate) {
            this.goToConflict((e, l) => (0, arraysFind_1.findLast)(this.model.modifiedBaseRanges.get(), (r) => predicate(r) &&
                this.getRangeOfModifiedBaseRange(e, r, undefined).endLineNumberExclusive < l) ||
                (0, arraysFind_1.findLast)(this.model.modifiedBaseRanges.get(), (r) => predicate(r)));
        }
        toggleActiveConflict(inputNumber) {
            const activeModifiedBaseRange = this.activeModifiedBaseRange.get();
            if (!activeModifiedBaseRange) {
                this.notificationService.error((0, nls_1.localize)('noConflictMessage', "There is currently no conflict focused that can be toggled."));
                return;
            }
            (0, observable_1.transaction)(tx => {
                /** @description Toggle Active Conflict */
                this.setState(activeModifiedBaseRange, this.model.getState(activeModifiedBaseRange).get().toggle(inputNumber), tx, inputNumber);
            });
        }
        acceptAll(inputNumber) {
            (0, observable_1.transaction)(tx => {
                /** @description Toggle Active Conflict */
                for (const range of this.model.modifiedBaseRanges.get()) {
                    this.setState(range, this.model.getState(range).get().withInputValue(inputNumber, true), tx, inputNumber);
                }
            });
        }
    };
    exports.MergeEditorViewModel = MergeEditorViewModel;
    exports.MergeEditorViewModel = MergeEditorViewModel = __decorate([
        __param(6, configuration_1.IConfigurationService),
        __param(7, notification_1.INotificationService)
    ], MergeEditorViewModel);
    class AttachedHistory extends lifecycle_1.Disposable {
        constructor(model) {
            super();
            this.model = model;
            this.attachedHistory = [];
            this.previousAltId = this.model.getAlternativeVersionId();
            this._register(model.onDidChangeContent((e) => {
                const currentAltId = model.getAlternativeVersionId();
                if (e.isRedoing) {
                    for (const item of this.attachedHistory) {
                        if (this.previousAltId < item.altId && item.altId <= currentAltId) {
                            item.element.redo();
                        }
                    }
                }
                else if (e.isUndoing) {
                    for (let i = this.attachedHistory.length - 1; i >= 0; i--) {
                        const item = this.attachedHistory[i];
                        if (currentAltId < item.altId && item.altId <= this.previousAltId) {
                            item.element.undo();
                        }
                    }
                }
                else {
                    // The user destroyed the redo stack by performing a non redo/undo operation.
                    // Thus we also need to remove all history elements after the last version id.
                    while (this.attachedHistory.length > 0
                        && this.attachedHistory[this.attachedHistory.length - 1].altId > this.previousAltId) {
                        this.attachedHistory.pop();
                    }
                }
                this.previousAltId = currentAltId;
            }));
        }
        /**
         * Pushes an history item that is tied to the last text edit (or an extension of it).
         * When the last text edit is undone/redone, so is is this history item.
         */
        pushAttachedHistoryElement(element) {
            this.attachedHistory.push({ altId: this.model.getAlternativeVersionId(), element });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld01vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL3ZpZXcvdmlld01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW9CekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTtRQU9uRCxZQUNpQixLQUF1QixFQUN2QixvQkFBeUMsRUFDekMsb0JBQXlDLEVBQ3pDLG9CQUEwQyxFQUMxQyxrQkFBK0QsRUFDL0QseUJBQStDLEVBQ3hDLG9CQUE0RCxFQUM3RCxtQkFBMEQ7WUFFaEYsS0FBSyxFQUFFLENBQUM7WUFUUSxVQUFLLEdBQUwsS0FBSyxDQUFrQjtZQUN2Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXFCO1lBQ3pDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBcUI7WUFDekMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUMxQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQTZDO1lBQy9ELDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBc0I7WUFDdkIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM1Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBZGhFLHVDQUFrQyxHQUFHLElBQUEsNEJBQWUsRUFFbkUsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUV6QixvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBNERuRixtQ0FBOEIsR0FBRyxJQUFBLDZCQUFxQixFQUNyRSw0Q0FBNEMsRUFDNUMs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