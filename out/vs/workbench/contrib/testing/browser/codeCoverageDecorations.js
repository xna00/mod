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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/hoverWidget", "vs/base/common/arraysFind", "vs/base/common/assert", "vs/base/common/cancellation", "vs/base/common/htmlContent", "vs/base/common/keyCodes", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/themables", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/contrib/hover/browser/hoverOperation", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/log/common/log", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/common/testCoverageService", "vs/workbench/contrib/testing/common/testingContextKeys"], function (require, exports, dom, hoverWidget_1, arraysFind_1, assert_1, cancellation_1, htmlContent_1, keyCodes_1, lazy_1, lifecycle_1, observable_1, themables_1, markdownRenderer_1, position_1, range_1, model_1, hoverOperation_1, nls_1, actionCommonCategories_1, actions_1, instantiation_1, keybinding_1, log_1, icons_1, testCoverageService_1, testingContextKeys_1) {
    "use strict";
    var CodeCoverageDecorations_1, LineHoverWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CoverageDetailsModel = exports.CodeCoverageDecorations = void 0;
    const MAX_HOVERED_LINES = 30;
    const CLASS_HIT = 'coverage-deco-hit';
    const CLASS_MISS = 'coverage-deco-miss';
    const TOGGLE_INLINE_COMMAND_TEXT = (0, nls_1.localize)('testing.toggleInlineCoverage', 'Toggle Inline Coverage');
    const TOGGLE_INLINE_COMMAND_ID = 'testing.toggleInlineCoverage';
    const BRANCH_MISS_INDICATOR_CHARS = 4;
    let CodeCoverageDecorations = class CodeCoverageDecorations extends lifecycle_1.Disposable {
        static { CodeCoverageDecorations_1 = this; }
        static { this.showInline = (0, observable_1.observableValue)('inlineCoverage', false); }
        static { this.fileCoverageDecorations = new WeakMap(); }
        constructor(editor, instantiationService, coverage, log) {
            super();
            this.editor = editor;
            this.log = log;
            this.displayedStore = this._register(new lifecycle_1.DisposableStore());
            this.hoveredStore = this._register(new lifecycle_1.DisposableStore());
            this.decorationIds = new Map();
            this.lineHoverWidget = new lazy_1.Lazy(() => this._register(instantiationService.createInstance(LineHoverWidget, this.editor)));
            const modelObs = (0, observable_1.observableFromEvent)(editor.onDidChangeModel, () => editor.getModel());
            const configObs = (0, observable_1.observableFromEvent)(editor.onDidChangeConfiguration, i => i);
            const fileCoverage = (0, observable_1.derived)(reader => {
                const report = coverage.selected.read(reader);
                if (!report) {
                    return;
                }
                const model = modelObs.read(reader);
                if (!model) {
                    return;
                }
                const file = report.getUri(model.uri);
                if (file) {
                    return file;
                }
                report.didAddCoverage.read(reader); // re-read if changes when there's no report
                return undefined;
            });
            this._register((0, observable_1.autorun)(reader => {
                const c = fileCoverage.read(reader);
                if (c) {
                    this.apply(editor.getModel(), c, CodeCoverageDecorations_1.showInline.read(reader));
                }
                else {
                    this.clear();
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                const c = fileCoverage.read(reader);
                if (c) {
                    const evt = configObs.read(reader);
                    if (evt?.hasChanged(67 /* EditorOption.lineHeight */) !== false) {
                        this.updateEditorStyles();
                    }
                }
            }));
            this._register(editor.onMouseMove(e => {
                const model = editor.getModel();
                if (e.target.type === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */ && model) {
                    this.hoverLineNumber(editor.getModel(), e.target.position.lineNumber);
                }
                else if (this.lineHoverWidget.hasValue && this.lineHoverWidget.value.getDomNode().contains(e.target.element)) {
                    // don't dismiss the hover
                }
                else if (CodeCoverageDecorations_1.showInline.get() && e.target.type === 6 /* MouseTargetType.CONTENT_TEXT */ && model) {
                    this.hoverInlineDecoration(model, e.target.position);
                }
                else {
                    this.hoveredStore.clear();
                }
            }));
            this._register(editor.onWillChangeModel(() => {
                const model = editor.getModel();
                if (!this.details || !model) {
                    return;
                }
                // Decorations adjust to local changes made in-editor, keep them synced in case the file is reopened:
                for (const decoration of model.getAllDecorations()) {
                    const own = this.decorationIds.get(decoration.id);
                    if (own) {
                        own.detail.range = decoration.range;
                    }
                }
            }));
        }
        updateEditorStyles() {
            const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
            const { style } = this.editor.getContainerDomNode();
            style.setProperty('--vscode-testing-coverage-lineHeight', `${lineHeight}px`);
        }
        hoverInlineDecoration(model, position) {
            const allDecorations = model.getDecorationsInRange(range_1.Range.fromPositions(position));
            const decoration = (0, arraysFind_1.mapFindFirst)(allDecorations, ({ id }) => this.decorationIds.has(id) ? { id, deco: this.decorationIds.get(id) } : undefined);
            if (decoration === this.hoveredSubject) {
                return;
            }
            this.hoveredStore.clear();
            this.hoveredSubject = decoration;
            if (!decoration) {
                return;
            }
            model.changeDecorations(e => {
                e.changeDecorationOptions(decoration.id, {
                    ...decoration.deco.options,
                    className: `${decoration.deco.options.className} coverage-deco-hovered`,
                });
            });
            this.hoveredStore.add((0, lifecycle_1.toDisposable)(() => {
                this.hoveredSubject = undefined;
                model.changeDecorations(e => {
                    e.changeDecorationOptions(decoration.id, decoration.deco.options);
                });
            }));
        }
        hoverLineNumber(model, lineNumber) {
            if (lineNumber === this.hoveredSubject || !this.details) {
                return;
            }
            this.hoveredStore.clear();
            this.hoveredSubject = lineNumber;
            const todo = [{ line: lineNumber, dir: 0 }];
            const toEnable = new Set();
            const inlineEnabled = CodeCoverageDecorations_1.showInline.get();
            if (!CodeCoverageDecorations_1.showInline.get()) {
                for (let i = 0; i < todo.length && i < MAX_HOVERED_LINES; i++) {
                    const { line, dir } = todo[i];
                    let found = false;
                    for (const decoration of model.getLineDecorations(line)) {
                        if (this.decorationIds.has(decoration.id)) {
                            toEnable.add(decoration.id);
                            found = true;
                        }
                    }
                    if (found) {
                        if (dir <= 0) {
                            todo.push({ line: line - 1, dir: -1 });
                        }
                        if (dir >= 0) {
                            todo.push({ line: line + 1, dir: 1 });
                        }
                    }
                }
                model.changeDecorations(e => {
                    for (const id of toEnable) {
                        const { applyHoverOptions, options } = this.decorationIds.get(id);
                        const dup = { ...options };
                        applyHoverOptions(dup);
                        e.changeDecorationOptions(id, dup);
                    }
                });
            }
            if (toEnable.size || inlineEnabled) {
                this.lineHoverWidget.value.startShowingAt(lineNumber);
            }
            this.hoveredStore.add(this.editor.onMouseLeave(() => {
                this.hoveredStore.clear();
            }));
            this.hoveredStore.add((0, lifecycle_1.toDisposable)(() => {
                this.lineHoverWidget.value.hide();
                this.hoveredSubject = undefined;
                model.changeDecorations(e => {
                    for (const id of toEnable) {
                        const deco = this.decorationIds.get(id);
                        if (deco) {
                            e.changeDecorationOptions(id, deco.options);
                        }
                    }
                });
            }));
        }
        async apply(model, coverage, showInlineByDefault) {
            const details = this.details = await this.loadDetails(coverage, model);
            if (!details) {
                return this.clear();
            }
            this.displayedStore.clear();
            model.changeDecorations(e => {
                for (const detailRange of details.ranges) {
                    const { metadata: { detail, description }, range, primary } = detailRange;
                    if (detail.type === 2 /* DetailType.Branch */) {
                        const hits = detail.detail.branches[detail.branch].count;
                        const cls = hits ? CLASS_HIT : CLASS_MISS;
                        // don't bother showing the miss indicator if the condition wasn't executed at all:
                        const showMissIndicator = !hits && range.isEmpty() && detail.detail.branches.some(b => b.count);
                        const options = {
                            showIfCollapsed: showMissIndicator, // only avoid collapsing if we want to show the miss indicator
                            description: 'coverage-gutter',
                            lineNumberClassName: `coverage-deco-gutter ${cls}`,
                        };
                        const applyHoverOptions = (target) => {
                            target.hoverMessage = description;
                            if (showMissIndicator) {
                                target.after = {
                                    content: '\xa0'.repeat(BRANCH_MISS_INDICATOR_CHARS), // nbsp
                                    inlineClassName: `coverage-deco-branch-miss-indicator ${themables_1.ThemeIcon.asClassName(icons_1.testingCoverageMissingBranch)}`,
                                    inlineClassNameAffectsLetterSpacing: true,
                                    cursorStops: model_1.InjectedTextCursorStops.None,
                                };
                            }
                            else {
                                target.className = `coverage-deco-inline ${cls}`;
                                if (primary && typeof hits === 'number') {
                                    target.before = countBadge(hits);
                                }
                            }
                        };
                        if (showInlineByDefault) {
                            applyHoverOptions(options);
                        }
                        this.decorationIds.set(e.addDecoration(range, options), { options, applyHoverOptions, detail: detailRange });
                    }
                    else if (detail.type === 1 /* DetailType.Statement */) {
                        const cls = detail.count ? CLASS_HIT : CLASS_MISS;
                        const options = {
                            showIfCollapsed: false,
                            description: 'coverage-inline',
                            lineNumberClassName: `coverage-deco-gutter ${cls}`,
                        };
                        const applyHoverOptions = (target) => {
                            target.className = `coverage-deco-inline ${cls}`;
                            target.hoverMessage = description;
                            if (primary && typeof detail.count === 'number') {
                                target.before = countBadge(detail.count);
                            }
                        };
                        if (showInlineByDefault) {
                            applyHoverOptions(options);
                        }
                        this.decorationIds.set(e.addDecoration(range, options), { options, applyHoverOptions, detail: detailRange });
                    }
                }
            });
            this.displayedStore.add((0, lifecycle_1.toDisposable)(() => {
                model.changeDecorations(e => {
                    for (const decoration of this.decorationIds.keys()) {
                        e.removeDecoration(decoration);
                    }
                    this.decorationIds.clear();
                });
            }));
        }
        clear() {
            this.loadingCancellation?.cancel();
            this.loadingCancellation = undefined;
            this.displayedStore.clear();
            this.hoveredStore.clear();
        }
        async loadDetails(coverage, textModel) {
            const existing = CodeCoverageDecorations_1.fileCoverageDecorations.get(coverage);
            if (existing) {
                return existing;
            }
            const cts = this.loadingCancellation = new cancellation_1.CancellationTokenSource();
            this.displayedStore.add(this.loadingCancellation);
            try {
                const details = await coverage.details(this.loadingCancellation.token);
                if (cts.token.isCancellationRequested) {
                    return;
                }
                const model = CodeCoverageDecorations_1.fileCoverageDecorations.get(coverage)
                    || new CoverageDetailsModel(details, textModel);
                CodeCoverageDecorations_1.fileCoverageDecorations.set(coverage, model);
                return model;
            }
            catch (e) {
                this.log.error('Error loading coverage details', e);
            }
            return undefined;
        }
    };
    exports.CodeCoverageDecorations = CodeCoverageDecorations;
    exports.CodeCoverageDecorations = CodeCoverageDecorations = CodeCoverageDecorations_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, testCoverageService_1.ITestCoverageService),
        __param(3, log_1.ILogService)
    ], CodeCoverageDecorations);
    const countBadge = (count) => {
        if (count === 0) {
            return undefined;
        }
        return {
            content: `${count > 99 ? '99+' : count}x`,
            cursorStops: model_1.InjectedTextCursorStops.None,
            inlineClassName: `coverage-deco-inline-count`,
            inlineClassNameAffectsLetterSpacing: true,
        };
    };
    class CoverageDetailsModel {
        constructor(details, textModel) {
            this.details = details;
            this.ranges = [];
            //#region decoration generation
            // Coverage from a provider can have a range that contains smaller ranges,
            // such as a function declaration that has nested statements. In this we
            // make sequential, non-overlapping ranges for each detail for display in
            // the editor without ugly overlaps.
            const detailRanges = details.map(detail => ({
                range: tidyLocation(detail.location),
                primary: true,
                metadata: { detail, description: this.describe(detail, textModel) }
            }));
            for (const { range, metadata: { detail } } of detailRanges) {
                if (detail.type === 1 /* DetailType.Statement */ && detail.branches) {
                    for (let i = 0; i < detail.branches.length; i++) {
                        const branch = { type: 2 /* DetailType.Branch */, branch: i, detail };
                        detailRanges.push({
                            range: tidyLocation(detail.branches[i].location || range_1.Range.fromPositions(range.getEndPosition())),
                            primary: true,
                            metadata: {
                                detail: branch,
                                description: this.describe(branch, textModel),
                            },
                        });
                    }
                }
            }
            // type ordering is done so that function declarations come first on a tie so that
            // single-statement functions (`() => foo()` for example) get inline decorations.
            detailRanges.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range) || a.metadata.detail.type - b.metadata.detail.type);
            const stack = [];
            const result = this.ranges = [];
            const pop = () => {
                const next = stack.pop();
                const prev = stack[stack.length - 1];
                if (prev) {
                    prev.range = prev.range.setStartPosition(next.range.endLineNumber, next.range.endColumn);
                }
                result.push(next);
            };
            for (const item of detailRanges) {
                // 1. Ensure that any ranges in the stack that ended before this are flushed
                const start = item.range.getStartPosition();
                while (stack[stack.length - 1]?.range.containsPosition(start) === false) {
                    pop();
                }
                // Empty ranges (usually representing missing branches) can be added
                // without worry about overlay.
                if (item.range.isEmpty()) {
                    result.push(item);
                    continue;
                }
                // 2. Take the last (overlapping) item in the stack, push range before
                // the `item.range` into the result and modify its stack to push the start
                // until after the `item.range` ends.
                const prev = stack[stack.length - 1];
                if (prev) {
                    const primary = prev.primary;
                    const si = prev.range.setEndPosition(start.lineNumber, start.column);
                    prev.range = prev.range.setStartPosition(item.range.endLineNumber, item.range.endColumn);
                    prev.primary = false;
                    // discard the previous range if it became empty, e.g. a nested statement
                    if (prev.range.isEmpty()) {
                        stack.pop();
                    }
                    result.push({ range: si, primary, metadata: prev.metadata });
                }
                stack.push(item);
            }
            while (stack.length) {
                pop();
            }
            //#endregion
        }
        /** Gets the markdown description for the given detail */
        describe(detail, model) {
            if (detail.type === 0 /* DetailType.Declaration */) {
                return namedDetailLabel(detail.name, detail);
            }
            else if (detail.type === 1 /* DetailType.Statement */) {
                const text = wrapName(model.getValueInRange(tidyLocation(detail.location)).trim() || `<empty statement>`);
                if (detail.branches?.length) {
                    const covered = detail.branches.filter(b => !!b.count).length;
                    return new htmlContent_1.MarkdownString().appendMarkdown((0, nls_1.localize)('coverage.branches', '{0} of {1} of branches in {2} were covered.', covered, detail.branches.length, text));
                }
                else {
                    return namedDetailLabel(text, detail);
                }
            }
            else if (detail.type === 2 /* DetailType.Branch */) {
                const text = wrapName(model.getValueInRange(tidyLocation(detail.detail.location)).trim() || `<empty statement>`);
                const { count, label } = detail.detail.branches[detail.branch];
                const label2 = label ? wrapInBackticks(label) : `#${detail.branch + 1}`;
                if (!count) {
                    return new htmlContent_1.MarkdownString().appendMarkdown((0, nls_1.localize)('coverage.branchNotCovered', 'Branch {0} in {1} was not covered.', label2, text));
                }
                else if (count === true) {
                    return new htmlContent_1.MarkdownString().appendMarkdown((0, nls_1.localize)('coverage.branchCoveredYes', 'Branch {0} in {1} was executed.', label2, text));
                }
                else {
                    return new htmlContent_1.MarkdownString().appendMarkdown((0, nls_1.localize)('coverage.branchCovered', 'Branch {0} in {1} was executed {2} time(s).', label2, text, count));
                }
            }
            (0, assert_1.assertNever)(detail);
        }
    }
    exports.CoverageDetailsModel = CoverageDetailsModel;
    function namedDetailLabel(name, detail) {
        return new htmlContent_1.MarkdownString().appendMarkdown(!detail.count // 0 or false
            ? (0, nls_1.localize)('coverage.declExecutedNo', '`{0}` was not executed.', name)
            : typeof detail.count === 'number'
                ? (0, nls_1.localize)('coverage.declExecutedCount', '`{0}` was executed {1} time(s).', name, detail.count)
                : (0, nls_1.localize)('coverage.declExecutedYes', '`{0}` was executed.', name));
    }
    // 'tidies' the range by normalizing it into a range and removing leading
    // and trailing whitespace.
    function tidyLocation(location) {
        if (location instanceof position_1.Position) {
            return range_1.Range.fromPositions(location, new position_1.Position(location.lineNumber, 0x7FFFFFFF));
        }
        return location;
    }
    let LineHoverComputer = class LineHoverComputer {
        constructor(keybindingService) {
            this.keybindingService = keybindingService;
            this.line = -1;
        }
        /** @inheritdoc */
        computeSync() {
            const strs = [];
            const s = new htmlContent_1.MarkdownString().appendMarkdown(`[${TOGGLE_INLINE_COMMAND_TEXT}](command:${TOGGLE_INLINE_COMMAND_ID})`);
            s.isTrusted = true;
            const binding = this.keybindingService.lookupKeybinding(TOGGLE_INLINE_COMMAND_ID);
            if (binding) {
                s.appendText(` (${binding.getLabel()})`);
            }
            strs.push(s);
            return strs;
        }
    };
    LineHoverComputer = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], LineHoverComputer);
    function wrapInBackticks(str) {
        return '`' + str.replace(/[\n\r`]/g, '') + '`';
    }
    function wrapName(functionNameOrCode) {
        if (functionNameOrCode.length > 50) {
            functionNameOrCode = functionNameOrCode.slice(0, 40) + '...';
        }
        return wrapInBackticks(functionNameOrCode);
    }
    let LineHoverWidget = class LineHoverWidget extends lifecycle_1.Disposable {
        static { LineHoverWidget_1 = this; }
        static { this.ID = 'editor.contrib.testingCoverageLineHoverWidget'; }
        constructor(editor, instantiationService) {
            super();
            this.editor = editor;
            this.hover = this._register(new hoverWidget_1.HoverWidget());
            this.renderDisposables = this._register(new lifecycle_1.DisposableStore());
            this.computer = instantiationService.createInstance(LineHoverComputer);
            this.markdownRenderer = this._register(instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, { editor: this.editor }));
            this.hoverOperation = this._register(new hoverOperation_1.HoverOperation(this.editor, this.computer));
            this.hover.containerDomNode.classList.add('hidden');
            this.hoverOperation.onResult(result => {
                if (result.value.length) {
                    this.render(result.value);
                }
                else {
                    this.hide();
                }
            });
            this.editor.addOverlayWidget(this);
        }
        /** @inheritdoc */
        getId() {
            return LineHoverWidget_1.ID;
        }
        /** @inheritdoc */
        getDomNode() {
            return this.hover.containerDomNode;
        }
        /** @inheritdoc */
        getPosition() {
            return null;
        }
        /** @inheritdoc */
        dispose() {
            this.editor.removeOverlayWidget(this);
            super.dispose();
        }
        /** Shows the hover widget at the given line */
        startShowingAt(lineNumber) {
            this.hide();
            const textModel = this.editor.getModel();
            if (!textModel) {
                return;
            }
            this.computer.line = lineNumber;
            this.hoverOperation.start(0 /* HoverStartMode.Delayed */);
        }
        /** Hides the hover widget */
        hide() {
            this.hoverOperation.cancel();
            this.hover.containerDomNode.classList.add('hidden');
        }
        render(elements) {
            const { hover: h, editor: editor } = this;
            const fragment = document.createDocumentFragment();
            for (const msg of elements) {
                const markdownHoverElement = dom.$('div.hover-row.markdown-hover');
                const hoverContentsElement = dom.append(markdownHoverElement, dom.$('div.hover-contents'));
                const renderedContents = this.renderDisposables.add(this.markdownRenderer.render(msg));
                hoverContentsElement.appendChild(renderedContents.element);
                fragment.appendChild(markdownHoverElement);
            }
            dom.clearNode(h.contentsDomNode);
            h.contentsDomNode.appendChild(fragment);
            h.containerDomNode.classList.remove('hidden');
            const editorLayout = editor.getLayoutInfo();
            const topForLineNumber = editor.getTopForLineNumber(this.computer.line);
            const editorScrollTop = editor.getScrollTop();
            const lineHeight = editor.getOption(67 /* EditorOption.lineHeight */);
            const nodeHeight = h.containerDomNode.clientHeight;
            const top = topForLineNumber - editorScrollTop - ((nodeHeight - lineHeight) / 2);
            const left = editorLayout.lineNumbersLeft + editorLayout.lineNumbersWidth;
            h.containerDomNode.style.left = `${left}px`;
            h.containerDomNode.style.top = `${Math.max(Math.round(top), 0)}px`;
        }
    };
    LineHoverWidget = LineHoverWidget_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], LineHoverWidget);
    (0, actions_1.registerAction2)(class ToggleInlineCoverage extends actions_1.Action2 {
        constructor() {
            super({
                id: TOGGLE_INLINE_COMMAND_ID,
                title: (0, nls_1.localize2)('coverage.toggleInline', "Toggle Inline Coverage"),
                category: actionCommonCategories_1.Categories.Test,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */),
                },
                precondition: testingContextKeys_1.TestingContextKeys.isTestCoverageOpen,
            });
        }
        run() {
            CodeCoverageDecorations.showInline.set(!CodeCoverageDecorations.showInline.get(), undefined);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUNvdmVyYWdlRGVjb3JhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvYnJvd3Nlci9jb2RlQ292ZXJhZ2VEZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBa0NoRyxNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztJQUM3QixNQUFNLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQztJQUN0QyxNQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQztJQUN4QyxNQUFNLDBCQUEwQixHQUFHLElBQUEsY0FBUSxFQUFDLDhCQUE4QixFQUFFLHdCQUF3QixDQUFDLENBQUM7SUFDdEcsTUFBTSx3QkFBd0IsR0FBRyw4QkFBOEIsQ0FBQztJQUNoRSxNQUFNLDJCQUEyQixHQUFHLENBQUMsQ0FBQztJQUUvQixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNCQUFVOztpQkFDeEMsZUFBVSxHQUFHLElBQUEsNEJBQWUsRUFBQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsQUFBM0MsQ0FBNEM7aUJBQzVDLDRCQUF1QixHQUFHLElBQUksT0FBTyxFQUFzQyxBQUFwRCxDQUFxRDtRQWNwRyxZQUNrQixNQUFtQixFQUNiLG9CQUEyQyxFQUM1QyxRQUE4QixFQUN2QyxHQUFpQztZQUU5QyxLQUFLLEVBQUUsQ0FBQztZQUxTLFdBQU0sR0FBTixNQUFNLENBQWE7WUFHTixRQUFHLEdBQUgsR0FBRyxDQUFhO1lBZjlCLG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZELGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lB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