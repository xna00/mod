/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "vs/workbench/contrib/mergeEditor/browser/utils", "vs/workbench/contrib/mergeEditor/browser/view/conflictActions", "vs/workbench/contrib/mergeEditor/browser/view/lineAlignment"], function (require, exports, dom_1, arrays_1, lineRange_1, utils_1, conflictActions_1, lineAlignment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorViewZone = exports.MergeEditorViewZones = exports.ViewZoneComputer = void 0;
    class ViewZoneComputer {
        constructor(input1Editor, input2Editor, resultEditor) {
            this.input1Editor = input1Editor;
            this.input2Editor = input2Editor;
            this.resultEditor = resultEditor;
            this.conflictActionsFactoryInput1 = new conflictActions_1.ConflictActionsFactory(this.input1Editor);
            this.conflictActionsFactoryInput2 = new conflictActions_1.ConflictActionsFactory(this.input2Editor);
            this.conflictActionsFactoryResult = new conflictActions_1.ConflictActionsFactory(this.resultEditor);
        }
        computeViewZones(reader, viewModel, options) {
            let input1LinesAdded = 0;
            let input2LinesAdded = 0;
            let baseLinesAdded = 0;
            let resultLinesAdded = 0;
            const input1ViewZones = [];
            const input2ViewZones = [];
            const baseViewZones = [];
            const resultViewZones = [];
            const model = viewModel.model;
            const resultDiffs = model.baseResultDiffs.read(reader);
            const baseRangeWithStoreAndTouchingDiffs = (0, utils_1.join)(model.modifiedBaseRanges.read(reader), resultDiffs, (baseRange, diff) => baseRange.baseRange.touches(diff.inputRange)
                ? arrays_1.CompareResult.neitherLessOrGreaterThan
                : lineRange_1.LineRange.compareByStart(baseRange.baseRange, diff.inputRange));
            const shouldShowCodeLenses = options.codeLensesVisible;
            const showNonConflictingChanges = options.showNonConflictingChanges;
            let lastModifiedBaseRange = undefined;
            let lastBaseResultDiff = undefined;
            for (const m of baseRangeWithStoreAndTouchingDiffs) {
                if (shouldShowCodeLenses && m.left && (m.left.isConflicting || showNonConflictingChanges || !model.isHandled(m.left).read(reader))) {
                    const actions = new conflictActions_1.ActionsSource(viewModel, m.left);
                    if (options.shouldAlignResult || !actions.inputIsEmpty.read(reader)) {
                        input1ViewZones.push(new CommandViewZone(this.conflictActionsFactoryInput1, m.left.input1Range.startLineNumber - 1, actions.itemsInput1));
                        input2ViewZones.push(new CommandViewZone(this.conflictActionsFactoryInput2, m.left.input2Range.startLineNumber - 1, actions.itemsInput2));
                        if (options.shouldAlignBase) {
                            baseViewZones.push(new Placeholder(m.left.baseRange.startLineNumber - 1, 16));
                        }
                    }
                    const afterLineNumber = m.left.baseRange.startLineNumber + (lastBaseResultDiff?.resultingDeltaFromOriginalToModified ?? 0) - 1;
                    resultViewZones.push(new CommandViewZone(this.conflictActionsFactoryResult, afterLineNumber, actions.resultItems));
                }
                const lastResultDiff = (0, arrays_1.lastOrDefault)(m.rights);
                if (lastResultDiff) {
                    lastBaseResultDiff = lastResultDiff;
                }
                let alignedLines;
                if (m.left) {
                    alignedLines = (0, lineAlignment_1.getAlignments)(m.left).map(a => ({
                        input1Line: a[0],
                        baseLine: a[1],
                        input2Line: a[2],
                        resultLine: undefined,
                    }));
                    lastModifiedBaseRange = m.left;
                    // This is a total hack.
                    alignedLines[alignedLines.length - 1].resultLine =
                        m.left.baseRange.endLineNumberExclusive
                            + (lastBaseResultDiff ? lastBaseResultDiff.resultingDeltaFromOriginalToModified : 0);
                }
                else {
                    alignedLines = [{
                            baseLine: lastResultDiff.inputRange.endLineNumberExclusive,
                            input1Line: lastResultDiff.inputRange.endLineNumberExclusive + (lastModifiedBaseRange ? (lastModifiedBaseRange.input1Range.endLineNumberExclusive - lastModifiedBaseRange.baseRange.endLineNumberExclusive) : 0),
                            input2Line: lastResultDiff.inputRange.endLineNumberExclusive + (lastModifiedBaseRange ? (lastModifiedBaseRange.input2Range.endLineNumberExclusive - lastModifiedBaseRange.baseRange.endLineNumberExclusive) : 0),
                            resultLine: lastResultDiff.outputRange.endLineNumberExclusive,
                        }];
                }
                for (const { input1Line, baseLine, input2Line, resultLine } of alignedLines) {
                    if (!options.shouldAlignBase && (input1Line === undefined || input2Line === undefined)) {
                        continue;
                    }
                    const input1Line_ = input1Line !== undefined ? input1Line + input1LinesAdded : -1;
                    const input2Line_ = input2Line !== undefined ? input2Line + input2LinesAdded : -1;
                    const baseLine_ = baseLine + baseLinesAdded;
                    const resultLine_ = resultLine !== undefined ? resultLine + resultLinesAdded : -1;
                    const max = Math.max(options.shouldAlignBase ? baseLine_ : 0, input1Line_, input2Line_, options.shouldAlignResult ? resultLine_ : 0);
                    if (input1Line !== undefined) {
                        const diffInput1 = max - input1Line_;
                        if (diffInput1 > 0) {
                            input1ViewZones.push(new Spacer(input1Line - 1, diffInput1));
                            input1LinesAdded += diffInput1;
                        }
                    }
                    if (input2Line !== undefined) {
                        const diffInput2 = max - input2Line_;
                        if (diffInput2 > 0) {
                            input2ViewZones.push(new Spacer(input2Line - 1, diffInput2));
                            input2LinesAdded += diffInput2;
                        }
                    }
                    if (options.shouldAlignBase) {
                        const diffBase = max - baseLine_;
                        if (diffBase > 0) {
                            baseViewZones.push(new Spacer(baseLine - 1, diffBase));
                            baseLinesAdded += diffBase;
                        }
                    }
                    if (options.shouldAlignResult && resultLine !== undefined) {
                        const diffResult = max - resultLine_;
                        if (diffResult > 0) {
                            resultViewZones.push(new Spacer(resultLine - 1, diffResult));
                            resultLinesAdded += diffResult;
                        }
                    }
                }
            }
            return new MergeEditorViewZones(input1ViewZones, input2ViewZones, baseViewZones, resultViewZones);
        }
    }
    exports.ViewZoneComputer = ViewZoneComputer;
    class MergeEditorViewZones {
        constructor(input1ViewZones, input2ViewZones, baseViewZones, resultViewZones) {
            this.input1ViewZones = input1ViewZones;
            this.input2ViewZones = input2ViewZones;
            this.baseViewZones = baseViewZones;
            this.resultViewZones = resultViewZones;
        }
    }
    exports.MergeEditorViewZones = MergeEditorViewZones;
    /**
     * This is an abstract class to create various editor view zones.
    */
    class MergeEditorViewZone {
    }
    exports.MergeEditorViewZone = MergeEditorViewZone;
    class Spacer extends MergeEditorViewZone {
        constructor(afterLineNumber, heightInLines) {
            super();
            this.afterLineNumber = afterLineNumber;
            this.heightInLines = heightInLines;
        }
        create(viewZoneChangeAccessor, viewZoneIdsToCleanUp, disposableStore) {
            viewZoneIdsToCleanUp.push(viewZoneChangeAccessor.addZone({
                afterLineNumber: this.afterLineNumber,
                heightInLines: this.heightInLines,
                domNode: (0, dom_1.$)('div.diagonal-fill'),
            }));
        }
    }
    class Placeholder extends MergeEditorViewZone {
        constructor(afterLineNumber, heightPx) {
            super();
            this.afterLineNumber = afterLineNumber;
            this.heightPx = heightPx;
        }
        create(viewZoneChangeAccessor, viewZoneIdsToCleanUp, disposableStore) {
            viewZoneIdsToCleanUp.push(viewZoneChangeAccessor.addZone({
                afterLineNumber: this.afterLineNumber,
                heightInPx: this.heightPx,
                domNode: (0, dom_1.$)('div.conflict-actions-placeholder'),
            }));
        }
    }
    class CommandViewZone extends MergeEditorViewZone {
        constructor(conflictActionsFactory, lineNumber, items) {
            super();
            this.conflictActionsFactory = conflictActionsFactory;
            this.lineNumber = lineNumber;
            this.items = items;
        }
        create(viewZoneChangeAccessor, viewZoneIdsToCleanUp, disposableStore) {
            disposableStore.add(this.conflictActionsFactory.createWidget(viewZoneChangeAccessor, this.lineNumber, this.items, viewZoneIdsToCleanUp));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld1pvbmVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL3ZpZXcvdmlld1pvbmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxNQUFhLGdCQUFnQjtRQUs1QixZQUNrQixZQUF5QixFQUN6QixZQUF5QixFQUN6QixZQUF5QjtZQUZ6QixpQkFBWSxHQUFaLFlBQVksQ0FBYTtZQUN6QixpQkFBWSxHQUFaLFlBQVksQ0FBYTtZQUN6QixpQkFBWSxHQUFaLFlBQVksQ0FBYTtZQVAxQixpQ0FBNEIsR0FBRyxJQUFJLHdDQUFzQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM3RSxpQ0FBNEIsR0FBRyxJQUFJLHdDQUFzQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM3RSxpQ0FBNEIsR0FBRyxJQUFJLHdDQUFzQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQU0xRixDQUFDO1FBRUUsZ0JBQWdCLENBQ3RCLE1BQWUsRUFDZixTQUErQixFQUMvQixPQUtDO1lBRUQsSUFBSSxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7WUFDekIsSUFBSSxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7WUFDekIsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1lBRXpCLE1BQU0sZUFBZSxHQUEwQixFQUFFLENBQUM7WUFDbEQsTUFBTSxlQUFlLEdBQTBCLEVBQUUsQ0FBQztZQUNsRCxNQUFNLGFBQWEsR0FBMEIsRUFBRSxDQUFDO1lBQ2hELE1BQU0sZUFBZSxHQUEwQixFQUFFLENBQUM7WUFFbEQsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUU5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