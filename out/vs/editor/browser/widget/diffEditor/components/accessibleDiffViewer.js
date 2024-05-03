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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/trustedTypes", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/themables", "vs/editor/browser/config/domFontInfo", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/config/editorOptions", "vs/editor/common/core/lineRange", "vs/editor/common/core/offsetRange", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/diff/rangeMapping", "vs/editor/common/languages/language", "vs/editor/common/tokens/lineTokens", "vs/editor/common/viewLayout/viewLineRenderer", "vs/editor/common/viewModel", "vs/nls", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/iconRegistry", "vs/css!./accessibleDiffViewer"], function (require, exports, dom_1, trustedTypes_1, actionbar_1, scrollableElement_1, actions_1, arrays_1, codicons_1, lifecycle_1, observable_1, themables_1, domFontInfo_1, utils_1, editorOptions_1, lineRange_1, offsetRange_1, position_1, range_1, rangeMapping_1, language_1, lineTokens_1, viewLineRenderer_1, viewModel_1, nls_1, accessibilitySignalService_1, instantiation_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibleDiffViewerModelFromEditors = exports.AccessibleDiffViewer = void 0;
    const accessibleDiffViewerInsertIcon = (0, iconRegistry_1.registerIcon)('diff-review-insert', codicons_1.Codicon.add, (0, nls_1.localize)('accessibleDiffViewerInsertIcon', 'Icon for \'Insert\' in accessible diff viewer.'));
    const accessibleDiffViewerRemoveIcon = (0, iconRegistry_1.registerIcon)('diff-review-remove', codicons_1.Codicon.remove, (0, nls_1.localize)('accessibleDiffViewerRemoveIcon', 'Icon for \'Remove\' in accessible diff viewer.'));
    const accessibleDiffViewerCloseIcon = (0, iconRegistry_1.registerIcon)('diff-review-close', codicons_1.Codicon.close, (0, nls_1.localize)('accessibleDiffViewerCloseIcon', 'Icon for \'Close\' in accessible diff viewer.'));
    let AccessibleDiffViewer = class AccessibleDiffViewer extends lifecycle_1.Disposable {
        static { this._ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('diffReview', { createHTML: value => value }); }
        constructor(_parentNode, _visible, _setVisible, _canClose, _width, _height, _diffs, _models, _instantiationService) {
            super();
            this._parentNode = _parentNode;
            this._visible = _visible;
            this._setVisible = _setVisible;
            this._canClose = _canClose;
            this._width = _width;
            this._height = _height;
            this._diffs = _diffs;
            this._models = _models;
            this._instantiationService = _instantiationService;
            this._state = (0, observable_1.derivedWithStore)(this, (reader, store) => {
                const visible = this._visible.read(reader);
                this._parentNode.style.visibility = visible ? 'visible' : 'hidden';
                if (!visible) {
                    return null;
                }
                const model = store.add(this._instantiationService.createInstance(ViewModel, this._diffs, this._models, this._setVisible, this._canClose));
                const view = store.add(this._instantiationService.createInstance(View, this._parentNode, model, this._width, this._height, this._models));
                return { model, view, };
            }).recomputeInitiallyAndOnChange(this._store);
        }
        next() {
            (0, observable_1.transaction)(tx => {
                const isVisible = this._visible.get();
                this._setVisible(true, tx);
                if (isVisible) {
                    this._state.get().model.nextGroup(tx);
                }
            });
        }
        prev() {
            (0, observable_1.transaction)(tx => {
                this._setVisible(true, tx);
                this._state.get().model.previousGroup(tx);
            });
        }
        close() {
            (0, observable_1.transaction)(tx => {
                this._setVisible(false, tx);
            });
        }
    };
    exports.AccessibleDiffViewer = AccessibleDiffViewer;
    exports.AccessibleDiffViewer = AccessibleDiffViewer = __decorate([
        __param(8, instantiation_1.IInstantiationService)
    ], AccessibleDiffViewer);
    let ViewModel = class ViewModel extends lifecycle_1.Disposable {
        constructor(_diffs, _models, _setVisible, canClose, _accessibilitySignalService) {
            super();
            this._diffs = _diffs;
            this._models = _models;
            this._setVisible = _setVisible;
            this.canClose = canClose;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._groups = (0, observable_1.observableValue)(this, []);
            this._currentGroupIdx = (0, observable_1.observableValue)(this, 0);
            this._currentElementIdx = (0, observable_1.observableValue)(this, 0);
            this.groups = this._groups;
            this.currentGroup = this._currentGroupIdx.map((idx, r) => this._groups.read(r)[idx]);
            this.currentGroupIndex = this._currentGroupIdx;
            this.currentElement = this._currentElementIdx.map((idx, r) => this.currentGroup.read(r)?.lines[idx]);
            this._register((0, observable_1.autorun)(reader => {
                /** @description update groups */
                const diffs = this._diffs.read(reader);
                if (!diffs) {
                    this._groups.set([], undefined);
                    return;
                }
                const groups = computeViewElementGroups(diffs, this._models.getOriginalModel().getLineCount(), this._models.getModifiedModel().getLineCount());
                (0, observable_1.transaction)(tx => {
                    const p = this._models.getModifiedPosition();
                    if (p) {
                        const nextGroup = groups.findIndex(g => p?.lineNumber < g.range.modified.endLineNumberExclusive);
                        if (nextGroup !== -1) {
                            this._currentGroupIdx.set(nextGroup, tx);
                        }
                    }
                    this._groups.set(groups, tx);
                });
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description play audio-cue for diff */
                const currentViewItem = this.currentElement.read(reader);
                if (currentViewItem?.type === LineType.Deleted) {
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.diffLineDeleted, { source: 'accessibleDiffViewer.currentElementChanged' });
                }
                else if (currentViewItem?.type === LineType.Added) {
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.diffLineInserted, { source: 'accessibleDiffViewer.currentElementChanged' });
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description select lines in editor */
                // This ensures editor commands (like revert/stage) work
                const currentViewItem = this.currentElement.read(reader);
                if (currentViewItem && currentViewItem.type !== LineType.Header) {
                    const lineNumber = currentViewItem.modifiedLineNumber ?? currentViewItem.diff.modified.startLineNumber;
                    this._models.modifiedSetSelection(range_1.Range.fromPositions(new position_1.Position(lineNumber, 1)));
                }
            }));
        }
        _goToGroupDelta(delta, tx) {
            const groups = this.groups.get();
            if (!groups || groups.length <= 1) {
                return;
            }
            (0, observable_1.subtransaction)(tx, tx => {
                this._currentGroupIdx.set(offsetRange_1.OffsetRange.ofLength(groups.length).clipCyclic(this._currentGroupIdx.get() + delta), tx);
                this._currentElementIdx.set(0, tx);
            });
        }
        nextGroup(tx) { this._goToGroupDelta(1, tx); }
        previousGroup(tx) { this._goToGroupDelta(-1, tx); }
        _goToLineDelta(delta) {
            const group = this.currentGroup.get();
            if (!group || group.lines.length <= 1) {
                return;
            }
            (0, observable_1.transaction)(tx => {
                this._currentElementIdx.set(offsetRange_1.OffsetRange.ofLength(group.lines.length).clip(this._currentElementIdx.get() + delta), tx);
            });
        }
        goToNextLine() { this._goToLineDelta(1); }
        goToPreviousLine() { this._goToLineDelta(-1); }
        goToLine(line) {
            const group = this.currentGroup.get();
            if (!group) {
                return;
            }
            const idx = group.lines.indexOf(line);
            if (idx === -1) {
                return;
            }
            (0, observable_1.transaction)(tx => {
                this._currentElementIdx.set(idx, tx);
            });
        }
        revealCurrentElementInEditor() {
            if (!this.canClose.get()) {
                return;
            }
            this._setVisible(false, undefined);
            const curElem = this.currentElement.get();
            if (curElem) {
                if (curElem.type === LineType.Deleted) {
                    this._models.originalReveal(range_1.Range.fromPositions(new position_1.Position(curElem.originalLineNumber, 1)));
                }
                else {
                    this._models.modifiedReveal(curElem.type !== LineType.Header
                        ? range_1.Range.fromPositions(new position_1.Position(curElem.modifiedLineNumber, 1))
                        : undefined);
                }
            }
        }
        close() {
            if (!this.canClose.get()) {
                return;
            }
            this._setVisible(false, undefined);
            this._models.modifiedFocus();
        }
    };
    ViewModel = __decorate([
        __param(4, accessibilitySignalService_1.IAccessibilitySignalService)
    ], ViewModel);
    const viewElementGroupLineMargin = 3;
    function computeViewElementGroups(diffs, originalLineCount, modifiedLineCount) {
        const result = [];
        for (const g of (0, arrays_1.groupAdjacentBy)(diffs, (a, b) => (b.modified.startLineNumber - a.modified.endLineNumberExclusive < 2 * viewElementGroupLineMargin))) {
            const viewElements = [];
            viewElements.push(new HeaderViewElement());
            const origFullRange = new lineRange_1.LineRange(Math.max(1, g[0].original.startLineNumber - viewElementGroupLineMargin), Math.min(g[g.length - 1].original.endLineNumberExclusive + viewElementGroupLineMargin, originalLineCount + 1));
            const modifiedFullRange = new lineRange_1.LineRange(Math.max(1, g[0].modified.startLineNumber - viewElementGroupLineMargin), Math.min(g[g.length - 1].modified.endLineNumberExclusive + viewElementGroupLineMargin, modifiedLineCount + 1));
            (0, arrays_1.forEachAdjacent)(g, (a, b) => {
                const origRange = new lineRange_1.LineRange(a ? a.original.endLineNumberExclusive : origFullRange.startLineNumber, b ? b.original.startLineNumber : origFullRange.endLineNumberExclusive);
                const modifiedRange = new lineRange_1.LineRange(a ? a.modified.endLineNumberExclusive : modifiedFullRange.startLineNumber, b ? b.modified.startLineNumber : modifiedFullRange.endLineNumberExclusive);
                origRange.forEach(origLineNumber => {
                    viewElements.push(new UnchangedLineViewElement(origLineNumber, modifiedRange.startLineNumber + (origLineNumber - origRange.startLineNumber)));
                });
                if (b) {
                    b.original.forEach(origLineNumber => {
                        viewElements.push(new DeletedLineViewElement(b, origLineNumber));
                    });
                    b.modified.forEach(modifiedLineNumber => {
                        viewElements.push(new AddedLineViewElement(b, modifiedLineNumber));
                    });
                }
            });
            const modifiedRange = g[0].modified.join(g[g.length - 1].modified);
            const originalRange = g[0].original.join(g[g.length - 1].original);
            result.push(new ViewElementGroup(new rangeMapping_1.LineRangeMapping(modifiedRange, originalRange), viewElements));
        }
        return result;
    }
    var LineType;
    (function (LineType) {
        LineType[LineType["Header"] = 0] = "Header";
        LineType[LineType["Unchanged"] = 1] = "Unchanged";
        LineType[LineType["Deleted"] = 2] = "Deleted";
        LineType[LineType["Added"] = 3] = "Added";
    })(LineType || (LineType = {}));
    class ViewElementGroup {
        constructor(range, lines) {
            this.range = range;
            this.lines = lines;
        }
    }
    class HeaderViewElement {
        constructor() {
            this.type = LineType.Header;
        }
    }
    class DeletedLineViewElement {
        constructor(diff, originalLineNumber) {
            this.diff = diff;
            this.originalLineNumber = originalLineNumber;
            this.type = LineType.Deleted;
            this.modifiedLineNumber = undefined;
        }
    }
    class AddedLineViewElement {
        constructor(diff, modifiedLineNumber) {
            this.diff = diff;
            this.modifiedLineNumber = modifiedLineNumber;
            this.type = LineType.Added;
            this.originalLineNumber = undefined;
        }
    }
    class UnchangedLineViewElement {
        constructor(originalLineNumber, modifiedLineNumber) {
            this.originalLineNumber = originalLineNumber;
            this.modifiedLineNumber = modifiedLineNumber;
            this.type = LineType.Unchanged;
        }
    }
    let View = class View extends lifecycle_1.Disposable {
        constructor(_element, _model, _width, _height, _models, _languageService) {
            super();
            this._element = _element;
            this._model = _model;
            this._width = _width;
            this._height = _height;
            this._models = _models;
            this._languageService = _languageService;
            this.domNode = this._element;
            this.domNode.className = 'monaco-component diff-review monaco-editor-background';
            const actionBarContainer = document.createElement('div');
            actionBarContainer.className = 'diff-review-actions';
            this._actionBar = this._register(new actionbar_1.ActionBar(actionBarContainer));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update actions */
                this._actionBar.clear();
                if (this._model.canClose.read(reader)) {
                    this._actionBar.push(new actions_1.Action('diffreview.close', (0, nls_1.localize)('label.close', "Close"), 'close-diff-review ' + themables_1.ThemeIcon.asClassName(accessibleDiffViewerCloseIcon), true, async () => _model.close()), { label: false, icon: true });
                }
            }));
            this._content = document.createElement('div');
            this._content.className = 'diff-review-content';
            this._content.setAttribute('role', 'code');
            this._scrollbar = this._register(new scrollableElement_1.DomScrollableElement(this._content, {}));
            (0, dom_1.reset)(this.domNode, this._scrollbar.getDomNode(), actionBarContainer);
            this._register((0, observable_1.autorun)(r => {
                this._height.read(r);
                this._width.read(r);
                this._scrollbar.scanDomNode();
            }));
            this._register((0, lifecycle_1.toDisposable)(() => { (0, dom_1.reset)(this.domNode); }));
            this._register((0, utils_1.applyStyle)(this.domNode, { width: this._width, height: this._height }));
            this._register((0, utils_1.applyStyle)(this._content, { width: this._width, height: this._height }));
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description render */
                this._model.currentGroup.read(reader);
                this._render(store);
            }));
            // TODO@hediet use commands
            this._register((0, dom_1.addStandardDisposableListener)(this.domNode, 'keydown', (e) => {
                if (e.equals(18 /* KeyCode.DownArrow */)
                    || e.equals(2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */)
                    || e.equals(512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */)) {
                    e.preventDefault();
                    this._model.goToNextLine();
                }
                if (e.equals(16 /* KeyCode.UpArrow */)
                    || e.equals(2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */)
                    || e.equals(512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */)) {
                    e.preventDefault();
                    this._model.goToPreviousLine();
                }
                if (e.equals(9 /* KeyCode.Escape */)
                    || e.equals(2048 /* KeyMod.CtrlCmd */ | 9 /* KeyCode.Escape */)
                    || e.equals(512 /* KeyMod.Alt */ | 9 /* KeyCode.Escape */)
                    || e.equals(1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */)) {
                    e.preventDefault();
                    this._model.close();
                }
                if (e.equals(10 /* KeyCode.Space */)
                    || e.equals(3 /* KeyCode.Enter */)) {
                    e.preventDefault();
                    this._model.revealCurrentElementInEditor();
                }
            }));
        }
        _render(store) {
            const originalOptions = this._models.getOriginalOptions();
            const modifiedOptions = this._models.getModifiedOptions();
            const container = document.createElement('div');
            container.className = 'diff-review-table';
            container.setAttribute('role', 'list');
            container.setAttribute('aria-label', (0, nls_1.localize)('ariaLabel', 'Accessible Diff Viewer. Use arrow up and down to navigate.'));
            (0, domFontInfo_1.applyFontInfo)(container, modifiedOptions.get(50 /* EditorOption.fontInfo */));
            (0, dom_1.reset)(this._content, container);
            const originalModel = this._models.getOriginalModel();
            const modifiedModel = this._models.getModifiedModel();
            if (!originalModel || !modifiedModel) {
                return;
            }
            const originalModelOpts = originalModel.getOptions();
            const modifiedModelOpts = modifiedModel.getOptions();
            const lineHeight = modifiedOptions.get(67 /* EditorOption.lineHeight */);
            const group = this._model.currentGroup.get();
            for (const viewItem of group?.lines || []) {
                if (!group) {
                    break;
                }
                let row;
                if (viewItem.type === LineType.Header) {
                    const header = document.createElement('div');
                    header.className = 'diff-review-row';
                    header.setAttribute('role', 'listitem');
                    const r = group.range;
                    const diffIndex = this._model.currentGroupIndex.get();
                    const diffsLength = this._model.groups.get().length;
                    const getAriaLines = (lines) => lines === 0 ? (0, nls_1.localize)('no_lines_changed', "no lines changed")
                        : lines === 1 ? (0, nls_1.localize)('one_line_changed', "1 line changed")
                            : (0, nls_1.localize)('more_lines_changed', "{0} lines changed", lines);
                    const originalChangedLinesCntAria = getAriaLines(r.original.length);
                    const modifiedChangedLinesCntAria = getAriaLines(r.modified.length);
                    header.setAttribute('aria-label', (0, nls_1.localize)({
                        key: 'header',
                        comment: [
                            'This is the ARIA label for a git diff header.',
                            'A git diff header looks like this: @@ -154,12 +159,39 @@.',
                            'That encodes that at original line 154 (which is now line 159), 12 lines were removed/changed with 39 lines.',
                            'Variables 0 and 1 refer to the diff index out of total number of diffs.',
                            'Variables 2 and 4 will be numbers (a line number).',
                            'Variables 3 and 5 will be "no lines changed", "1 line changed" or "X lines changed", localized separately.'
                        ]
                    }, "Difference {0} of {1}: original line {2}, {3}, modified line {4}, {5}", (diffIndex + 1), diffsLength, r.original.startLineNumber, originalChangedLinesCntAria, r.modified.startLineNumber, modifiedChangedLinesCntAria));
                    const cell = document.createElement('div');
                    cell.className = 'diff-review-cell diff-review-summary';
                    // e.g.: `1/10: @@ -504,7 +517,7 @@`
                    cell.appendChild(document.createTextNode(`${diffIndex + 1}/${diffsLength}: @@ -${r.original.startLineNumber},${r.original.length} +${r.modified.startLineNumber},${r.modified.length} @@`));
                    header.appendChild(cell);
                    row = header;
                }
                else {
                    row = this._createRow(viewItem, lineHeight, this._width.get(), originalOptions, originalModel, originalModelOpts, modifiedOptions, modifiedModel, modifiedModelOpts);
                }
                container.appendChild(row);
                const isSelectedObs = (0, observable_1.derived)(reader => /** @description isSelected */ this._model.currentElement.read(reader) === viewItem);
                store.add((0, observable_1.autorun)(reader => {
                    /** @description update tab index */
                    const isSelected = isSelectedObs.read(reader);
                    row.tabIndex = isSelected ? 0 : -1;
                    if (isSelected) {
                        row.focus();
                    }
                }));
                store.add((0, dom_1.addDisposableListener)(row, 'focus', () => {
                    this._model.goToLine(viewItem);
                }));
            }
            this._scrollbar.scanDomNode();
        }
        _createRow(item, lineHeight, width, originalOptions, originalModel, originalModelOpts, modifiedOptions, modifiedModel, modifiedModelOpts) {
            const originalLayoutInfo = originalOptions.get(145 /* EditorOption.layoutInfo */);
            const originalLineNumbersWidth = originalLayoutInfo.glyphMarginWidth + originalLayoutInfo.lineNumbersWidth;
            const modifiedLayoutInfo = modifiedOptions.get(145 /* EditorOption.layoutInfo */);
            const modifiedLineNumbersWidth = 10 + modifiedLayoutInfo.glyphMarginWidth + modifiedLayoutInfo.lineNumbersWidth;
            let rowClassName = 'diff-review-row';
            let lineNumbersExtraClassName = '';
            const spacerClassName = 'diff-review-spacer';
            let spacerIcon = null;
            switch (item.type) {
                case LineType.Added:
                    rowClassName = 'diff-review-row line-insert';
                    lineNumbersExtraClassName = ' char-insert';
                    spacerIcon = accessibleDiffViewerInsertIcon;
                    break;
                case LineType.Deleted:
                    rowClassName = 'diff-review-row line-delete';
                    lineNumbersExtraClassName = ' char-delete';
                    spacerIcon = accessibleDiffViewerRemoveIcon;
                    break;
            }
            const row = document.createElement('div');
            row.style.minWidth = width + 'px';
            row.className = rowClassName;
            row.setAttribute('role', 'listitem');
            row.ariaLevel = '';
            const cell = document.createElement('div');
            cell.className = 'diff-review-cell';
            cell.style.height = `${lineHeight}px`;
            row.appendChild(cell);
            const originalLineNumber = document.createElement('span');
            originalLineNumber.style.width = (originalLineNumbersWidth + 'px');
            originalLineNumber.style.minWidth = (originalLineNumbersWidth + 'px');
            originalLineNumber.className = 'diff-review-line-number' + lineNumbersExtraClassName;
            if (item.originalLineNumber !== undefined) {
                originalLineNumber.appendChild(document.createTextNode(String(item.originalLineNumber)));
            }
            else {
                originalLineNumber.innerText = '\u00a0';
            }
            cell.appendChild(originalLineNumber);
            const modifiedLineNumber = document.createElement('span');
            modifiedLineNumber.style.width = (modifiedLineNumbersWidth + 'px');
            modifiedLineNumber.style.minWidth = (modifiedLineNumbersWidth + 'px');
            modifiedLineNumber.style.paddingRight = '10px';
            modifiedLineNumber.className = 'diff-review-line-number' + lineNumbersExtraClassName;
            if (item.modifiedLineNumber !== undefined) {
                modifiedLineNumber.appendChild(document.createTextNode(String(item.modifiedLineNumber)));
            }
            else {
                modifiedLineNumber.innerText = '\u00a0';
            }
            cell.appendChild(modifiedLineNumber);
            const spacer = document.createElement('span');
            spacer.className = spacerClassName;
            if (spacerIcon) {
                const spacerCodicon = document.createElement('span');
                spacerCodicon.className = themables_1.ThemeIcon.asClassName(spacerIcon);
                spacerCodicon.innerText = '\u00a0\u00a0';
                spacer.appendChild(spacerCodicon);
            }
            else {
                spacer.innerText = '\u00a0\u00a0';
            }
            cell.appendChild(spacer);
            let lineContent;
            if (item.modifiedLineNumber !== undefined) {
                let html = this._getLineHtml(modifiedModel, modifiedOptions, modifiedModelOpts.tabSize, item.modifiedLineNumber, this._languageService.languageIdCodec);
                if (AccessibleDiffViewer._ttPolicy) {
                    html = AccessibleDiffViewer._ttPolicy.createHTML(html);
                }
                cell.insertAdjacentHTML('beforeend', html);
                lineContent = modifiedModel.getLineContent(item.modifiedLineNumber);
            }
            else {
                let html = this._getLineHtml(originalModel, originalOptions, originalModelOpts.tabSize, item.originalLineNumber, this._languageService.languageIdCodec);
                if (AccessibleDiffViewer._ttPolicy) {
                    html = AccessibleDiffViewer._ttPolicy.createHTML(html);
                }
                cell.insertAdjacentHTML('beforeend', html);
                lineContent = originalModel.getLineContent(item.originalLineNumber);
            }
            if (lineContent.length === 0) {
                lineContent = (0, nls_1.localize)('blankLine', "blank");
            }
            let ariaLabel = '';
            switch (item.type) {
                case LineType.Unchanged:
                    if (item.originalLineNumber === item.modifiedLineNumber) {
                        ariaLabel = (0, nls_1.localize)({ key: 'unchangedLine', comment: ['The placeholders are contents of the line and should not be translated.'] }, "{0} unchanged line {1}", lineContent, item.originalLineNumber);
                    }
                    else {
                        ariaLabel = (0, nls_1.localize)('equalLine', "{0} original line {1} modified line {2}", lineContent, item.originalLineNumber, item.modifiedLineNumber);
                    }
                    break;
                case LineType.Added:
                    ariaLabel = (0, nls_1.localize)('insertLine', "+ {0} modified line {1}", lineContent, item.modifiedLineNumber);
                    break;
                case LineType.Deleted:
                    ariaLabel = (0, nls_1.localize)('deleteLine', "- {0} original line {1}", lineContent, item.originalLineNumber);
                    break;
            }
            row.setAttribute('aria-label', ariaLabel);
            return row;
        }
        _getLineHtml(model, options, tabSize, lineNumber, languageIdCodec) {
            const lineContent = model.getLineContent(lineNumber);
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const lineTokens = lineTokens_1.LineTokens.createEmpty(lineContent, languageIdCodec);
            const isBasicASCII = viewModel_1.ViewLineRenderingData.isBasicASCII(lineContent, model.mightContainNonBasicASCII());
            const containsRTL = viewModel_1.ViewLineRenderingData.containsRTL(lineContent, isBasicASCII, model.mightContainRTL());
            const r = (0, viewLineRenderer_1.renderViewLine2)(new viewLineRenderer_1.RenderLineInput((fontInfo.isMonospace && !options.get(33 /* EditorOption.disableMonospaceOptimizations */)), fontInfo.canUseHalfwidthRightwardsArrow, lineContent, false, isBasicASCII, containsRTL, 0, lineTokens, [], tabSize, 0, fontInfo.spaceWidth, fontInfo.middotWidth, fontInfo.wsmiddotWidth, options.get(117 /* EditorOption.stopRenderingLineAfter */), options.get(99 /* EditorOption.renderWhitespace */), options.get(94 /* EditorOption.renderControlCharacters */), options.get(51 /* EditorOption.fontLigatures */) !== editorOptions_1.EditorFontLigatures.OFF, null));
            return r.html;
        }
    };
    View = __decorate([
        __param(5, language_1.ILanguageService)
    ], View);
    class AccessibleDiffViewerModelFromEditors {
        constructor(editors) {
            this.editors = editors;
        }
        getOriginalModel() {
            return this.editors.original.getModel();
        }
        getOriginalOptions() {
            return this.editors.original.getOptions();
        }
        originalReveal(range) {
            this.editors.original.revealRange(range);
            this.editors.original.setSelection(range);
            this.editors.original.focus();
        }
        getModifiedModel() {
            return this.editors.modified.getModel();
        }
        getModifiedOptions() {
            return this.editors.modified.getOptions();
        }
        modifiedReveal(range) {
            if (range) {
                this.editors.modified.revealRange(range);
                this.editors.modified.setSelection(range);
            }
            this.editors.modified.focus();
        }
        modifiedSetSelection(range) {
            this.editors.modified.setSelection(range);
        }
        modifiedFocus() {
            this.editors.modified.focus();
        }
        getModifiedPosition() {
            return this.editors.modified.getPosition() ?? undefined;
        }
    }
    exports.AccessibleDiffViewerModelFromEditors = AccessibleDiffViewerModelFromEditors;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJsZURpZmZWaWV3ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2NvbXBvbmVudHMvYWNjZXNzaWJsZURpZmZWaWV3ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0NoRyxNQUFNLDhCQUE4QixHQUFHLElBQUEsMkJBQVksRUFBQyxvQkFBb0IsRUFBRSxrQkFBTyxDQUFDLEdBQUcsRUFBRSxJQUFBLGNBQVEsRUFBQyxnQ0FBZ0MsRUFBRSxnREFBZ0QsQ0FBQyxDQUFDLENBQUM7SUFDckwsTUFBTSw4QkFBOEIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsb0JBQW9CLEVBQUUsa0JBQU8sQ0FBQyxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0NBQWdDLEVBQUUsZ0RBQWdELENBQUMsQ0FBQyxDQUFDO0lBQ3hMLE1BQU0sNkJBQTZCLEdBQUcsSUFBQSwyQkFBWSxFQUFDLG1CQUFtQixFQUFFLGtCQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLCtCQUErQixFQUFFLCtDQUErQyxDQUFDLENBQUMsQ0FBQztJQXVCNUssSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTtpQkFDckMsY0FBUyxHQUFHLElBQUEsdUNBQXdCLEVBQUMsWUFBWSxFQUFFLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQUFBekUsQ0FBMEU7UUFFakcsWUFDa0IsV0FBd0IsRUFDeEIsUUFBOEIsRUFDOUIsV0FBcUUsRUFDckUsU0FBK0IsRUFDL0IsTUFBMkIsRUFDM0IsT0FBNEIsRUFDNUIsTUFBMkQsRUFDM0QsT0FBbUMsRUFDN0IscUJBQTZEO1lBRXBGLEtBQUssRUFB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