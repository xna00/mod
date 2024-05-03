/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/lineRange", "vs/editor/common/core/range", "vs/editor/common/diff/rangeMapping", "vs/editor/common/model", "vs/nls"], function (require, exports, dom_1, iconLabels_1, codicons_1, lifecycle_1, observable_1, lineRange_1, range_1, rangeMapping_1, model_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RevertButton = exports.RevertButtonsFeature = void 0;
    const emptyArr = [];
    class RevertButtonsFeature extends lifecycle_1.Disposable {
        constructor(_editors, _diffModel, _options, _widget) {
            super();
            this._editors = _editors;
            this._diffModel = _diffModel;
            this._options = _options;
            this._widget = _widget;
            this._selectedDiffs = (0, observable_1.derived)(this, (reader) => {
                /** @description selectedDiffs */
                const model = this._diffModel.read(reader);
                const diff = model?.diff.read(reader);
                // Return `emptyArr` because it is a constant. [] is always a new array and would trigger a change.
                if (!diff) {
                    return emptyArr;
                }
                const selections = this._editors.modifiedSelections.read(reader);
                if (selections.every(s => s.isEmpty())) {
                    return emptyArr;
                }
                const selectedLineNumbers = new lineRange_1.LineRangeSet(selections.map(s => lineRange_1.LineRange.fromRangeInclusive(s)));
                const selectedMappings = diff.mappings.filter(m => m.lineRangeMapping.innerChanges && selectedLineNumbers.intersects(m.lineRangeMapping.modified));
                const result = selectedMappings.map(mapping => ({
                    mapping,
                    rangeMappings: mapping.lineRangeMapping.innerChanges.filter(c => selections.some(s => range_1.Range.areIntersecting(c.modifiedRange, s)))
                }));
                if (result.length === 0 || result.every(r => r.rangeMappings.length === 0)) {
                    return emptyArr;
                }
                return result;
            });
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                if (!this._options.shouldRenderOldRevertArrows.read(reader)) {
                    return;
                }
                const model = this._diffModel.read(reader);
                const diff = model?.diff.read(reader);
                if (!model || !diff) {
                    return;
                }
                if (model.movedTextToCompare.read(reader)) {
                    return;
                }
                const glyphWidgetsModified = [];
                const selectedDiffs = this._selectedDiffs.read(reader);
                const selectedDiffsSet = new Set(selectedDiffs.map(d => d.mapping));
                if (selectedDiffs.length > 0) {
                    // The button to revert the selection
                    const selections = this._editors.modifiedSelections.read(reader);
                    const btn = store.add(new RevertButton(selections[selections.length - 1].positionLineNumber, this._widget, selectedDiffs.flatMap(d => d.rangeMappings), true));
                    this._editors.modified.addGlyphMarginWidget(btn);
                    glyphWidgetsModified.push(btn);
                }
                for (const m of diff.mappings) {
                    if (selectedDiffsSet.has(m)) {
                        continue;
                    }
                    if (!m.lineRangeMapping.modified.isEmpty && m.lineRangeMapping.innerChanges) {
                        const btn = store.add(new RevertButton(m.lineRangeMapping.modified.startLineNumber, this._widget, m.lineRangeMapping, false));
                        this._editors.modified.addGlyphMarginWidget(btn);
                        glyphWidgetsModified.push(btn);
                    }
                }
                store.add((0, lifecycle_1.toDisposable)(() => {
                    for (const w of glyphWidgetsModified) {
                        this._editors.modified.removeGlyphMarginWidget(w);
                    }
                }));
            }));
        }
    }
    exports.RevertButtonsFeature = RevertButtonsFeature;
    class RevertButton extends lifecycle_1.Disposable {
        static { this.counter = 0; }
        getId() { return this._id; }
        constructor(_lineNumber, _widget, _diffs, _revertSelection) {
            super();
            this._lineNumber = _lineNumber;
            this._widget = _widget;
            this._diffs = _diffs;
            this._revertSelection = _revertSelection;
            this._id = `revertButton${RevertButton.counter++}`;
            this._domNode = (0, dom_1.h)('div.revertButton', {
                title: this._revertSelection
                    ? (0, nls_1.localize)('revertSelectedChanges', 'Revert Selected Changes')
                    : (0, nls_1.localize)('revertChange', 'Revert Change')
            }, [(0, iconLabels_1.renderIcon)(codicons_1.Codicon.arrowRight)]).root;
            this._register((0, dom_1.addDisposableListener)(this._domNode, dom_1.EventType.MOUSE_DOWN, e => {
                // don't prevent context menu from showing up
                if (e.button !== 2) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }));
            this._register((0, dom_1.addDisposableListener)(this._domNode, dom_1.EventType.MOUSE_UP, e => {
                e.stopPropagation();
                e.preventDefault();
            }));
            this._register((0, dom_1.addDisposableListener)(this._domNode, dom_1.EventType.CLICK, (e) => {
                if (this._diffs instanceof rangeMapping_1.LineRangeMapping) {
                    this._widget.revert(this._diffs);
                }
                else {
                    this._widget.revertRangeMappings(this._diffs);
                }
                e.stopPropagation();
                e.preventDefault();
            }));
        }
        /**
         * Get the dom node of the glyph widget.
         */
        getDomNode() {
            return this._domNode;
        }
        /**
         * Get the placement of the glyph widget.
         */
        getPosition() {
            return {
                lane: model_1.GlyphMarginLane.Right,
                range: {
                    startColumn: 1,
                    startLineNumber: this._lineNumber,
                    endColumn: 1,
                    endLineNumber: this._lineNumber,
                },
                zIndex: 10001,
            };
        }
    }
    exports.RevertButton = RevertButton;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmV2ZXJ0QnV0dG9uc0ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2ZlYXR1cmVzL3JldmVydEJ1dHRvbnNGZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsTUFBTSxRQUFRLEdBQVksRUFBRSxDQUFDO0lBRTdCLE1BQWEsb0JBQXFCLFNBQVEsc0JBQVU7UUFDbkQsWUFDa0IsUUFBMkIsRUFDM0IsVUFBd0QsRUFDeEQsUUFBMkIsRUFDM0IsT0FBeUI7WUFFMUMsS0FBSyxFQUFFLENBQUM7WUFMUyxhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUMzQixlQUFVLEdBQVYsVUFBVSxDQUE4QztZQUN4RCxhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUMzQixZQUFPLEdBQVAsT0FBTyxDQUFrQjtZQW9EMUIsbUJBQWMsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQzFELGlDQUFpQztnQkFDakMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzNDLE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN0QyxtR0FBbUc7Z0JBQ25HLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFBQyxPQUFPLFFBQVEsQ0FBQztnQkFBQyxDQUFDO2dCQUUvQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDakUsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFF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