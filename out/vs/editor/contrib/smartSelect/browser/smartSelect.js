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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/editor/browser/editorExtensions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/editor/contrib/smartSelect/browser/bracketSelections", "vs/editor/contrib/smartSelect/browser/wordSelections", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/resolverService", "vs/base/common/types", "vs/base/common/uri"], function (require, exports, arrays, cancellation_1, errors_1, editorExtensions_1, position_1, range_1, selection_1, editorContextKeys_1, bracketSelections_1, wordSelections_1, nls, actions_1, commands_1, languageFeatures_1, resolverService_1, types_1, uri_1) {
    "use strict";
    var SmartSelectController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SmartSelectController = void 0;
    exports.provideSelectionRanges = provideSelectionRanges;
    class SelectionRanges {
        constructor(index, ranges) {
            this.index = index;
            this.ranges = ranges;
        }
        mov(fwd) {
            const index = this.index + (fwd ? 1 : -1);
            if (index < 0 || index >= this.ranges.length) {
                return this;
            }
            const res = new SelectionRanges(index, this.ranges);
            if (res.ranges[index].equalsRange(this.ranges[this.index])) {
                // next range equals this range, retry with next-next
                return res.mov(fwd);
            }
            return res;
        }
    }
    let SmartSelectController = class SmartSelectController {
        static { SmartSelectController_1 = this; }
        static { this.ID = 'editor.contrib.smartSelectController'; }
        static get(editor) {
            return editor.getContribution(SmartSelectController_1.ID);
        }
        constructor(_editor, _languageFeaturesService) {
            this._editor = _editor;
            this._languageFeaturesService = _languageFeaturesService;
            this._ignoreSelection = false;
        }
        dispose() {
            this._selectionListener?.dispose();
        }
        async run(forward) {
            if (!this._editor.hasModel()) {
                return;
            }
            const selections = this._editor.getSelections();
            const model = this._editor.getModel();
            if (!this._state) {
                await provideSelectionRanges(this._languageFeaturesService.selectionRangeProvider, model, selections.map(s => s.getPosition()), this._editor.getOption(113 /* EditorOption.smartSelect */), cancellation_1.CancellationToken.None).then(ranges => {
                    if (!arrays.isNonEmptyArray(ranges) || ranges.length !== selections.length) {
                        // invalid result
                        return;
                    }
                    if (!this._editor.hasModel() || !arrays.equals(this._editor.getSelections(), selections, (a, b) => a.equalsSelection(b))) {
                        // invalid editor state
                        return;
                    }
                    for (let i = 0; i < ranges.length; i++) {
                        ranges[i] = ranges[i].filter(range => {
                            // filter ranges inside the selection
                            return range.containsPosition(selections[i].getStartPosition()) && range.containsPosition(selections[i].getEndPosition());
                        });
                        // prepend current selection
                        ranges[i].unshift(selections[i]);
                    }
                    this._state = ranges.map(ranges => new SelectionRanges(0, ranges));
                    // listen to caret move and forget about state
                    this._selectionListener?.dispose();
                    this._selectionListener = this._editor.onDidChangeCursorPosition(() => {
                        if (!this._ignoreSelection) {
                            this._selectionListener?.dispose();
                            this._state = undefined;
                        }
                    });
                });
            }
            if (!this._state) {
                // no state
                return;
            }
            this._state = this._state.map(state => state.mov(forward));
            const newSelections = this._state.map(state => selection_1.Selection.fromPositions(state.ranges[state.index].getStartPosition(), state.ranges[state.index].getEndPosition()));
            this._ignoreSelection = true;
            try {
                this._editor.setSelections(newSelections);
            }
            finally {
                this._ignoreSelection = false;
            }
        }
    };
    exports.SmartSelectController = SmartSelectController;
    exports.SmartSelectController = SmartSelectController = SmartSelectController_1 = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService)
    ], SmartSelectController);
    class AbstractSmartSelect extends editorExtensions_1.EditorAction {
        constructor(forward, opts) {
            super(opts);
            this._forward = forward;
        }
        async run(_accessor, editor) {
            const controller = SmartSelectController.get(editor);
            if (controller) {
                await controller.run(this._forward);
            }
        }
    }
    class GrowSelectionAction extends AbstractSmartSelect {
        constructor() {
            super(true, {
                id: 'editor.action.smartSelect.expand',
                label: nls.localize('smartSelect.expand', "Expand Selection"),
                alias: 'Expand Selection',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */,
                        secondary: [256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */],
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '1_basic',
                    title: nls.localize({ key: 'miSmartSelectGrow', comment: ['&& denotes a mnemonic'] }, "&&Expand Selection"),
                    order: 2
                }
            });
        }
    }
    // renamed command id
    commands_1.CommandsRegistry.registerCommandAlias('editor.action.smartSelect.grow', 'editor.action.smartSelect.expand');
    class ShrinkSelectionAction extends AbstractSmartSelect {
        constructor() {
            super(false, {
                id: 'editor.action.smartSelect.shrink',
                label: nls.localize('smartSelect.shrink', "Shrink Selection"),
                alias: 'Shrink Selection',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */,
                        secondary: [256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */],
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '1_basic',
                    title: nls.localize({ key: 'miSmartSelectShrink', comment: ['&& denotes a mnemonic'] }, "&&Shrink Selection"),
                    order: 3
                }
            });
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(SmartSelectController.ID, SmartSelectController, 4 /* EditorContributionInstantiation.Lazy */);
    (0, editorExtensions_1.registerEditorAction)(GrowSelectionAction);
    (0, editorExtensions_1.registerEditorAction)(ShrinkSelectionAction);
    async function provideSelectionRanges(registry, model, positions, options, token) {
        const providers = registry.all(model)
            .concat(new wordSelections_1.WordSelectionRangeProvider(options.selectSubwords)); // ALWAYS have word based selection range
        if (providers.length === 1) {
            // add word selection and bracket selection when no provider exists
            providers.unshift(new bracketSelections_1.BracketSelectionRangeProvider());
        }
        const work = [];
        const allRawRanges = [];
        for (const provider of providers) {
            work.push(Promise.resolve(provider.provideSelectionRanges(model, positions, token)).then(allProviderRanges => {
                if (arrays.isNonEmptyArray(allProviderRanges) && allProviderRanges.length === positions.length) {
                    for (let i = 0; i < positions.length; i++) {
                        if (!allRawRanges[i]) {
                            allRawRanges[i] = [];
                        }
                        for (const oneProviderRanges of allProviderRanges[i]) {
                            if (range_1.Range.isIRange(oneProviderRanges.range) && range_1.Range.containsPosition(oneProviderRanges.range, positions[i])) {
                                allRawRanges[i].push(range_1.Range.lift(oneProviderRanges.range));
                            }
                        }
                    }
                }
            }, errors_1.onUnexpectedExternalError));
        }
        await Promise.all(work);
        return allRawRanges.map(oneRawRanges => {
            if (oneRawRanges.length === 0) {
                return [];
            }
            // sort all by start/end position
            oneRawRanges.sort((a, b) => {
                if (position_1.Position.isBefore(a.getStartPosition(), b.getStartPosition())) {
                    return 1;
                }
                else if (position_1.Position.isBefore(b.getStartPosition(), a.getStartPosition())) {
                    return -1;
                }
                else if (position_1.Position.isBefore(a.getEndPosition(), b.getEndPosition())) {
                    return -1;
                }
                else if (position_1.Position.isBefore(b.getEndPosition(), a.getEndPosition())) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            // remove ranges that don't contain the former range or that are equal to the
            // former range
            const oneRanges = [];
            let last;
            for (const range of oneRawRanges) {
                if (!last || (range_1.Range.containsRange(range, last) && !range_1.Range.equalsRange(range, last))) {
                    oneRanges.push(range);
                    last = range;
                }
            }
            if (!options.selectLeadingAndTrailingWhitespace) {
                return oneRanges;
            }
            // add ranges that expand trivia at line starts and ends whenever a range
            // wraps onto the a new line
            const oneRangesWithTrivia = [oneRanges[0]];
            for (let i = 1; i < oneRanges.length; i++) {
                const prev = oneRanges[i - 1];
                const cur = oneRanges[i];
                if (cur.startLineNumber !== prev.startLineNumber || cur.endLineNumber !== prev.endLineNumber) {
                    // add line/block range without leading/failing whitespace
                    const rangeNoWhitespace = new range_1.Range(prev.startLineNumber, model.getLineFirstNonWhitespaceColumn(prev.startLineNumber), prev.endLineNumber, model.getLineLastNonWhitespaceColumn(prev.endLineNumber));
                    if (rangeNoWhitespace.containsRange(prev) && !rangeNoWhitespace.equalsRange(prev) && cur.containsRange(rangeNoWhitespace) && !cur.equalsRange(rangeNoWhitespace)) {
                        oneRangesWithTrivia.push(rangeNoWhitespace);
                    }
                    // add line/block range
                    const rangeFull = new range_1.Range(prev.startLineNumber, 1, prev.endLineNumber, model.getLineMaxColumn(prev.endLineNumber));
                    if (rangeFull.containsRange(prev) && !rangeFull.equalsRange(rangeNoWhitespace) && cur.containsRange(rangeFull) && !cur.equalsRange(rangeFull)) {
                        oneRangesWithTrivia.push(rangeFull);
                    }
                }
                oneRangesWithTrivia.push(cur);
            }
            return oneRangesWithTrivia;
        });
    }
    commands_1.CommandsRegistry.registerCommand('_executeSelectionRangeProvider', async function (accessor, ...args) {
        const [resource, positions] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(resource));
        const registry = accessor.get(languageFeatures_1.ILanguageFeaturesService).selectionRangeProvider;
        const reference = await accessor.get(resolverService_1.ITextModelService).createModelReference(resource);
        try {
            return provideSelectionRanges(registry, reference.object.textEditorModel, positions, { selectLeadingAndTrailingWhitespace: true, selectSubwords: true }, cancellation_1.CancellationToken.None);
        }
        finally {
            reference.dispose();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcnRTZWxlY3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3NtYXJ0U2VsZWN0L2Jyb3dzZXIvc21hcnRTZWxlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWtOaEcsd0RBMkZDO0lBaFJELE1BQU0sZUFBZTtRQUVwQixZQUNVLEtBQWEsRUFDYixNQUFlO1lBRGYsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLFdBQU0sR0FBTixNQUFNLENBQVM7UUFDckIsQ0FBQztRQUVMLEdBQUcsQ0FBQyxHQUFZO1lBQ2YsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDOUMsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxlQUFlLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwRCxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDNUQscURBQXFEO2dCQUNyRCxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUNELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztLQUNEO0lBRU0sSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBcUI7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