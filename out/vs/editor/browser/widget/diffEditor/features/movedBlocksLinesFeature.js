/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/themables", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/core/offsetRange", "vs/nls"], function (require, exports, dom_1, actionbar_1, actions_1, arrays_1, arraysFind_1, codicons_1, lifecycle_1, observable_1, themables_1, utils_1, offsetRange_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MovedBlocksLinesFeature = void 0;
    class MovedBlocksLinesFeature extends lifecycle_1.Disposable {
        static { this.movedCodeBlockPadding = 4; }
        constructor(_rootElement, _diffModel, _originalEditorLayoutInfo, _modifiedEditorLayoutInfo, _editors) {
            super();
            this._rootElement = _rootElement;
            this._diffModel = _diffModel;
            this._originalEditorLayoutInfo = _originalEditorLayoutInfo;
            this._modifiedEditorLayoutInfo = _modifiedEditorLayoutInfo;
            this._editors = _editors;
            this._originalScrollTop = (0, observable_1.observableFromEvent)(this._editors.original.onDidScrollChange, () => this._editors.original.getScrollTop());
            this._modifiedScrollTop = (0, observable_1.observableFromEvent)(this._editors.modified.onDidScrollChange, () => this._editors.modified.getScrollTop());
            this._viewZonesChanged = (0, observable_1.observableSignalFromEvent)('onDidChangeViewZones', this._editors.modified.onDidChangeViewZones);
            this.width = (0, observable_1.observableValue)(this, 0);
            this._modifiedViewZonesChangedSignal = (0, observable_1.observableSignalFromEvent)('modified.onDidChangeViewZones', this._editors.modified.onDidChangeViewZones);
            this._originalViewZonesChangedSignal = (0, observable_1.observableSignalFromEvent)('original.onDidChangeViewZones', this._editors.original.onDidChangeViewZones);
            this._state = (0, observable_1.derivedWithStore)(this, (reader, store) => {
                /** @description state */
                this._element.replaceChildren();
                const model = this._diffModel.read(reader);
                const moves = model?.diff.read(reader)?.movedTexts;
                if (!moves || moves.length === 0) {
                    this.width.set(0, undefined);
                    return;
                }
                this._viewZonesChanged.read(reader);
                const infoOrig = this._originalEditorLayoutInfo.read(reader);
                const infoMod = this._modifiedEditorLayoutInfo.read(reader);
                if (!infoOrig || !infoMod) {
                    this.width.set(0, undefined);
                    return;
                }
                this._modifiedViewZonesChangedSignal.read(reader);
                this._originalViewZonesChangedSignal.read(reader);
                const lines = moves.map((move) => {
                    function computeLineStart(range, editor) {
                        const t1 = editor.getTopForLineNumber(range.startLineNumber, true);
                        const t2 = editor.getTopForLineNumber(range.endLineNumberExclusive, true);
                        return (t1 + t2) / 2;
                    }
                    const start = computeLineStart(move.lineRangeMapping.original, this._editors.original);
                    const startOffset = this._originalScrollTop.read(reader);
                    const end = computeLineStart(move.lineRangeMapping.modified, this._editors.modified);
                    const endOffset = this._modifiedScrollTop.read(reader);
                    const from = start - startOffset;
                    const to = end - endOffset;
                    const top = Math.min(start, end);
                    const bottom = Math.max(start, end);
                    return { range: new offsetRange_1.OffsetRange(top, bottom), from, to, fromWithoutScroll: start, toWithoutScroll: end, move };
                });
                lines.sort((0, arrays_1.tieBreakComparators)((0, arrays_1.compareBy)(l => l.fromWithoutScroll > l.toWithoutScroll, arrays_1.booleanComparator), (0, arrays_1.compareBy)(l => l.fromWithoutScroll > l.toWithoutScroll ? l.fromWithoutScroll : -l.toWithoutScroll, arrays_1.numberComparator)));
                const layout = LinesLayout.compute(lines.map(l => l.range));
                const padding = 10;
                const lineAreaLeft = infoOrig.verticalScrollbarWidth;
                const lineAreaWidth = (layout.getTrackCount() - 1) * 10 + padding * 2;
                const width = lineAreaLeft + lineAreaWidth + (infoMod.contentLeft - MovedBlocksLinesFeature.movedCodeBlockPadding);
                let idx = 0;
                for (const line of lines) {
                    const track = layout.getTrack(idx);
                    const verticalY = lineAreaLeft + padding + track * 10;
                    const arrowHeight = 15;
                    const arrowWidth = 15;
                    const right = width;
                    const rectWidth = infoMod.glyphMarginWidth + infoMod.lineNumbersWidth;
                    const rectHeight = 18;
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.classList.add('arrow-rectangle');
                    rect.setAttribute('x', `${right - rectWidth}`);
                    rect.setAttribute('y', `${line.to - rectHeight / 2}`);
                    rect.setAttribute('width', `${rectWidth}`);
                    rect.setAttribute('height', `${rectHeight}`);
                    this._element.appendChild(rect);
                    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', `M ${0} ${line.from} L ${verticalY} ${line.from} L ${verticalY} ${line.to} L ${right - arrowWidth} ${line.to}`);
                    path.setAttribute('fill', 'none');
                    g.appendChild(path);
                    const arrowRight = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    arrowRight.classList.add('arrow');
                    store.add((0, observable_1.autorun)(reader => {
                        path.classList.toggle('currentMove', line.move === model.activeMovedText.read(reader));
                        arrowRight.classList.toggle('currentMove', line.move === model.activeMovedText.read(reader));
                    }));
                    arrowRight.setAttribute('points', `${right - arrowWidth},${line.to - arrowHeight / 2} ${right},${line.to} ${right - arrowWidth},${line.to + arrowHeight / 2}`);
                    g.appendChild(arrowRight);
                    this._element.appendChild(g);
                    /*
                    TODO@hediet
                    path.addEventListener('mouseenter', () => {
                        model.setHoveredMovedText(line.move);
                    });
                    path.addEventListener('mouseleave', () => {
                        model.setHoveredMovedText(undefined);
                    });*/
                    idx++;
                }
                this.width.set(lineAreaWidth, undefined);
            });
            this._element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            this._element.setAttribute('class', 'moved-blocks-lines');
            this._rootElement.appendChild(this._element);
            this._register((0, lifecycle_1.toDisposable)(() => this._element.remove()));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update moved blocks lines positioning */
                const info = this._originalEditorLayoutInfo.read(reader);
                const info2 = this._modifiedEditorLayoutInfo.read(reader);
                if (!info || !info2) {
                    return;
                }
                this._element.style.left = `${info.width - info.verticalScrollbarWidth}px`;
                this._element.style.height = `${info.height}px`;
                this._element.style.width = `${info.verticalScrollbarWidth + info.contentLeft - MovedBlocksLinesFeature.movedCodeBlockPadding + this.width.read(reader)}px`;
            }));
            this._register((0, observable_1.recomputeInitiallyAndOnChange)(this._state));
            const movedBlockViewZones = (0, observable_1.derived)(reader => {
                const model = this._diffModel.read(reader);
                const d = model?.diff.read(reader);
                if (!d) {
                    return [];
                }
                return d.movedTexts.map(move => ({
                    move,
                    original: new utils_1.PlaceholderViewZone((0, observable_1.constObservable)(move.lineRangeMapping.original.startLineNumber - 1), 18),
                    modified: new utils_1.PlaceholderViewZone((0, observable_1.constObservable)(move.lineRangeMapping.modified.startLineNumber - 1), 18),
                }));
            });
            this._register((0, utils_1.applyViewZones)(this._editors.original, movedBlockViewZones.map(zones => /** @description movedBlockViewZones.original */ zones.map(z => z.original))));
            this._register((0, utils_1.applyViewZones)(this._editors.modified, movedBlockViewZones.map(zones => /** @description movedBlockViewZones.modified */ zones.map(z => z.modified))));
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                const blocks = movedBlockViewZones.read(reader);
                for (const b of blocks) {
                    store.add(new MovedBlockOverlayWidget(this._editors.original, b.original, b.move, 'original', this._diffModel.get()));
                    store.add(new MovedBlockOverlayWidget(this._editors.modified, b.modified, b.move, 'modified', this._diffModel.get()));
                }
            }));
            const originalHasFocus = (0, observable_1.observableSignalFromEvent)('original.onDidFocusEditorWidget', e => this._editors.original.onDidFocusEditorWidget(() => setTimeout(() => e(undefined), 0)));
            const modifiedHasFocus = (0, observable_1.observableSignalFromEvent)('modified.onDidFocusEditorWidget', e => this._editors.modified.onDidFocusEditorWidget(() => setTimeout(() => e(undefined), 0)));
            let lastChangedEditor = 'modified';
            this._register((0, observable_1.autorunHandleChanges)({
                createEmptyChangeSummary: () => undefined,
                handleChange: (ctx, summary) => {
                    if (ctx.didChange(originalHasFocus)) {
                        lastChangedEditor = 'original';
                    }
                    if (ctx.didChange(modifiedHasFocus)) {
                        lastChangedEditor = 'modified';
                    }
                    return true;
                }
            }, reader => {
                /** @description MovedBlocksLines.setActiveMovedTextFromCursor */
                originalHasFocus.read(reader);
                modifiedHasFocus.read(reader);
                const m = this._diffModel.read(reader);
                if (!m) {
                    return;
                }
                const diff = m.diff.read(reader);
                let movedText = undefined;
                if (diff && lastChangedEditor === 'original') {
                    const originalPos = this._editors.originalCursor.read(reader);
                    if (originalPos) {
                        movedText = diff.movedTexts.find(m => m.lineRangeMapping.original.contains(originalPos.lineNumber));
                    }
                }
                if (diff && lastChangedEditor === 'modified') {
                    const modifiedPos = this._editors.modifiedCursor.read(reader);
                    if (modifiedPos) {
                        movedText = diff.movedTexts.find(m => m.lineRangeMapping.modified.contains(modifiedPos.lineNumber));
                    }
                }
                if (movedText !== m.movedTextToCompare.get()) {
                    m.movedTextToCompare.set(undefined, undefined);
                }
                m.setActiveMovedText(movedText);
            }));
        }
    }
    exports.MovedBlocksLinesFeature = MovedBlocksLinesFeature;
    class LinesLayout {
        static compute(lines) {
            const setsPerTrack = [];
            const trackPerLineIdx = [];
            for (const line of lines) {
                let trackIdx = setsPerTrack.findIndex(set => !set.intersectsStrict(line));
                if (trackIdx === -1) {
                    const maxTrackCount = 6;
                    if (setsPerTrack.length >= maxTrackCount) {
                        trackIdx = (0, arraysFind_1.findMaxIdxBy)(setsPerTrack, (0, arrays_1.compareBy)(set => set.intersectWithRangeLength(line), arrays_1.numberComparator));
                    }
                    else {
                        trackIdx = setsPerTrack.length;
                        setsPerTrack.push(new offsetRange_1.OffsetRangeSet());
                    }
                }
                setsPerTrack[trackIdx].addRange(line);
                trackPerLineIdx.push(trackIdx);
            }
            return new LinesLayout(setsPerTrack.length, trackPerLineIdx);
        }
        constructor(_trackCount, trackPerLineIdx) {
            this._trackCount = _trackCount;
            this.trackPerLineIdx = trackPerLineIdx;
        }
        getTrack(lineIdx) {
            return this.trackPerLineIdx[lineIdx];
        }
        getTrackCount() {
            return this._trackCount;
        }
    }
    class MovedBlockOverlayWidget extends utils_1.ViewZoneOverlayWidget {
        constructor(_editor, _viewZone, _move, _kind, _diffModel) {
            const root = (0, dom_1.h)('div.diff-hidden-lines-widget');
            super(_editor, _viewZone, root.root);
            this._editor = _editor;
            this._move = _move;
            this._kind = _kind;
            this._diffModel = _diffModel;
            this._nodes = (0, dom_1.h)('div.diff-moved-code-block', { style: { marginRight: '4px' } }, [
                (0, dom_1.h)('div.text-content@textContent'),
                (0, dom_1.h)('div.action-bar@actionBar'),
            ]);
            root.root.appendChild(this._nodes.root);
            const editorLayout = (0, observable_1.observableFromEvent)(this._editor.onDidLayoutChange, () => this._editor.getLayoutInfo());
            this._register((0, utils_1.applyStyle)(this._nodes.root, {
                paddingRight: editorLayout.map(l => l.verticalScrollbarWidth)
            }));
            let text;
            if (_move.changes.length > 0) {
                text = this._kind === 'original' ? (0, nls_1.localize)('codeMovedToWithChanges', 'Code moved with changes to line {0}-{1}', this._move.lineRangeMapping.modified.startLineNumber, this._move.lineRangeMapping.modified.endLineNumberExclusive - 1) : (0, nls_1.localize)('codeMovedFromWithChanges', 'Code moved with changes from line {0}-{1}', this._move.lineRangeMapping.original.startLineNumber, this._move.lineRangeMapping.original.endLineNumberExclusive - 1);
            }
            else {
                text = this._kind === 'original' ? (0, nls_1.localize)('codeMovedTo', 'Code moved to line {0}-{1}', this._move.lineRangeMapping.modified.startLineNumber, this._move.lineRangeMapping.modified.endLineNumberExclusive - 1) : (0, nls_1.localize)('codeMovedFrom', 'Code moved from line {0}-{1}', this._move.lineRangeMapping.original.startLineNumber, this._move.lineRangeMapping.original.endLineNumberExclusive - 1);
            }
            const actionBar = this._register(new actionbar_1.ActionBar(this._nodes.actionBar, {
                highlightToggledItems: true,
            }));
            const caption = new actions_1.Action('', text, '', false);
            actionBar.push(caption, { icon: false, label: true });
            const actionCompare = new actions_1.Action('', 'Compare', themables_1.ThemeIcon.asClassName(codicons_1.Codicon.compareChanges), true, () => {
                this._editor.focus();
                this._diffModel.movedTextToCompare.set(this._diffModel.movedTextToCompare.get() === _move ? undefined : this._move, undefined);
            });
            this._register((0, observable_1.autorun)(reader => {
                const isActive = this._diffModel.movedTextToCompare.read(reader) === _move;
                actionCompare.checked = isActive;
            }));
            actionBar.push(actionCompare, { icon: false, label: true });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZWRCbG9ja3NMaW5lc0ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2ZlYXR1cmVzL21vdmVkQmxvY2tzTGluZXNGZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFCaEcsTUFBYSx1QkFBd0IsU0FBUSxzQkFBVTtpQkFDL0IsMEJBQXFCLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFTakQsWUFDa0IsWUFBeUIsRUFDekIsVUFBd0QsRUFDeEQseUJBQStELEVBQy9ELHlCQUErRCxFQUMvRCxRQUEyQjtZQUU1QyxLQUFLLEVBQUUsQ0FBQztZQU5TLGlCQUFZLEdBQVosWUFBWSxDQUFhO1lBQ3pCLGVBQVUsR0FBVixVQUFVLENBQThDO1lBQ3hELDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBc0M7WUFDL0QsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUFzQztZQUMvRCxhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQVg1Qix1QkFBa0IsR0FBRyxJQUFBLGdDQUFtQixFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDaEksdUJBQWtCLEdBQUcsSUFBQSxnQ0FBbUIsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ2hJLHNCQUFpQixHQUFHLElBQUEsc0NBQXlCLEVBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFR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