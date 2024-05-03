/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/features/movedBlocksLinesFeature", "vs/editor/browser/widget/diffEditor/registrations.contribution", "vs/editor/browser/widget/diffEditor/utils"], function (require, exports, lifecycle_1, observable_1, movedBlocksLinesFeature_1, registrations_contribution_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorDecorations = void 0;
    class DiffEditorDecorations extends lifecycle_1.Disposable {
        constructor(_editors, _diffModel, _options, widget) {
            super();
            this._editors = _editors;
            this._diffModel = _diffModel;
            this._options = _options;
            this._decorations = (0, observable_1.derived)(this, (reader) => {
                const diff = this._diffModel.read(reader)?.diff.read(reader);
                if (!diff) {
                    return null;
                }
                const movedTextToCompare = this._diffModel.read(reader).movedTextToCompare.read(reader);
                const renderIndicators = this._options.renderIndicators.read(reader);
                const showEmptyDecorations = this._options.showEmptyDecorations.read(reader);
                const originalDecorations = [];
                const modifiedDecorations = [];
                if (!movedTextToCompare) {
                    for (const m of diff.mappings) {
                        if (!m.lineRangeMapping.original.isEmpty) {
                            originalDecorations.push({ range: m.lineRangeMapping.original.toInclusiveRange(), options: renderIndicators ? registrations_contribution_1.diffLineDeleteDecorationBackgroundWithIndicator : registrations_contribution_1.diffLineDeleteDecorationBackground });
                        }
                        if (!m.lineRangeMapping.modified.isEmpty) {
                            modifiedDecorations.push({ range: m.lineRangeMapping.modified.toInclusiveRange(), options: renderIndicators ? registrations_contribution_1.diffLineAddDecorationBackgroundWithIndicator : registrations_contribution_1.diffLineAddDecorationBackground });
                        }
                        if (m.lineRangeMapping.modified.isEmpty || m.lineRangeMapping.original.isEmpty) {
                            if (!m.lineRangeMapping.original.isEmpty) {
                                originalDecorations.push({ range: m.lineRangeMapping.original.toInclusiveRange(), options: registrations_contribution_1.diffWholeLineDeleteDecoration });
                            }
                            if (!m.lineRangeMapping.modified.isEmpty) {
                                modifiedDecorations.push({ range: m.lineRangeMapping.modified.toInclusiveRange(), options: registrations_contribution_1.diffWholeLineAddDecoration });
                            }
                        }
                        else {
                            for (const i of m.lineRangeMapping.innerChanges || []) {
                                // Don't show empty markers outside the line range
                                if (m.lineRangeMapping.original.contains(i.originalRange.startLineNumber)) {
                                    originalDecorations.push({ range: i.originalRange, options: (i.originalRange.isEmpty() && showEmptyDecorations) ? registrations_contribution_1.diffDeleteDecorationEmpty : registrations_contribution_1.diffDeleteDecoration });
                                }
                                if (m.lineRangeMapping.modified.contains(i.modifiedRange.startLineNumber)) {
                                    modifiedDecorations.push({ range: i.modifiedRange, options: (i.modifiedRange.isEmpty() && showEmptyDecorations) ? registrations_contribution_1.diffAddDecorationEmpty : registrations_contribution_1.diffAddDecoration });
                                }
                            }
                        }
                    }
                }
                if (movedTextToCompare) {
                    for (const m of movedTextToCompare.changes) {
                        const fullRangeOriginal = m.original.toInclusiveRange();
                        if (fullRangeOriginal) {
                            originalDecorations.push({ range: fullRangeOriginal, options: renderIndicators ? registrations_contribution_1.diffLineDeleteDecorationBackgroundWithIndicator : registrations_contribution_1.diffLineDeleteDecorationBackground });
                        }
                        const fullRangeModified = m.modified.toInclusiveRange();
                        if (fullRangeModified) {
                            modifiedDecorations.push({ range: fullRangeModified, options: renderIndicators ? registrations_contribution_1.diffLineAddDecorationBackgroundWithIndicator : registrations_contribution_1.diffLineAddDecorationBackground });
                        }
                        for (const i of m.innerChanges || []) {
                            originalDecorations.push({ range: i.originalRange, options: registrations_contribution_1.diffDeleteDecoration });
                            modifiedDecorations.push({ range: i.modifiedRange, options: registrations_contribution_1.diffAddDecoration });
                        }
                    }
                }
                const activeMovedText = this._diffModel.read(reader).activeMovedText.read(reader);
                for (const m of diff.movedTexts) {
                    originalDecorations.push({
                        range: m.lineRangeMapping.original.toInclusiveRange(), options: {
                            description: 'moved',
                            blockClassName: 'movedOriginal' + (m === activeMovedText ? ' currentMove' : ''),
                            blockPadding: [movedBlocksLinesFeature_1.MovedBlocksLinesFeature.movedCodeBlockPadding, 0, movedBlocksLinesFeature_1.MovedBlocksLinesFeature.movedCodeBlockPadding, movedBlocksLinesFeature_1.MovedBlocksLinesFeature.movedCodeBlockPadding],
                        }
                    });
                    modifiedDecorations.push({
                        range: m.lineRangeMapping.modified.toInclusiveRange(), options: {
                            description: 'moved',
                            blockClassName: 'movedModified' + (m === activeMovedText ? ' currentMove' : ''),
                            blockPadding: [4, 0, 4, 4],
                        }
                    });
                }
                return { originalDecorations, modifiedDecorations };
            });
            this._register((0, utils_1.applyObservableDecorations)(this._editors.original, this._decorations.map(d => d?.originalDecorations || [])));
            this._register((0, utils_1.applyObservableDecorations)(this._editors.modified, this._decorations.map(d => d?.modifiedDecorations || [])));
        }
    }
    exports.DiffEditorDecorations = DiffEditorDecorations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvckRlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9jb21wb25lbnRzL2RpZmZFZGl0b3JEZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBYSxxQkFBc0IsU0FBUSxzQkFBVTtRQUNwRCxZQUNrQixRQUEyQixFQUMzQixVQUF3RCxFQUN4RCxRQUEyQixFQUM1QyxNQUF3QjtZQUV4QixLQUFLLEVBQUUsQ0FBQztZQUxTLGFBQVEsR0FBUixRQUFRLENBQW1CO1lBQzNCLGVBQVUsR0FBVixVQUFVLENBQThDO1lBQ3hELGFBQVEsR0FBUixRQUFRLENBQW1CO1lBUzVCLGlCQUFZLEdBQUcsSUFBQSxvQkFBTyxFQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUN4RCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM3RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1gsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFFRCxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDekYsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDckUsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFD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