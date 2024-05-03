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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/iconLabels", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/platform", "vs/base/common/themables", "vs/base/common/uuid", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/editorColorRegistry", "vs/editor/common/model", "vs/editor/common/services/model", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/themeService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/codeEditor/browser/editorLineNumberMenu", "vs/workbench/contrib/testing/browser/explorerProjections/testItemContextOverlay", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/browser/testMessageColorizer", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/constants", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResult", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testingDecorations", "vs/workbench/contrib/testing/common/testingPeekOpener", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/contrib/testing/common/testingUri"], function (require, exports, dom, actions_1, arrays_1, async_1, event_1, htmlContent_1, iconLabels_1, iterator_1, lifecycle_1, map_1, platform_1, themables_1, uuid_1, codeEditorService_1, editorColorRegistry_1, model_1, model_2, nls_1, menuEntryActionViewItem_1, actions_2, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, quickInput_1, themeService_1, uriIdentity_1, editorLineNumberMenu_1, testItemContextOverlay_1, icons_1, testMessageColorizer_1, configuration_2, constants_1, testId_1, testProfileService_1, testResult_1, testResultService_1, testService_1, testingDecorations_1, testingPeekOpener_1, testingStates_1, testingUri_1) {
    "use strict";
    var TestMessageDecoration_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingDecorations = exports.TestingDecorationService = void 0;
    const MAX_INLINE_MESSAGE_LENGTH = 128;
    const MAX_TESTS_IN_SUBMENU = 30;
    const GLYPH_MARGIN_LANE = model_1.GlyphMarginLane.Center;
    function isOriginalInDiffEditor(codeEditorService, codeEditor) {
        const diffEditors = codeEditorService.listDiffEditors();
        for (const diffEditor of diffEditors) {
            if (diffEditor.getOriginalEditor() === codeEditor) {
                return true;
            }
        }
        return false;
    }
    /** Value for saved decorations, providing fast accessors for the hot 'syncDecorations' path */
    class CachedDecorations {
        constructor() {
            this.runByIdKey = new Map();
            this.messages = new Map();
        }
        get size() {
            return this.runByIdKey.size + this.messages.size;
        }
        /** Gets a test run decoration that contains exactly the given test IDs */
        getForExactTests(testIds) {
            const key = testIds.sort().join('\0\0');
            return this.runByIdKey.get(key);
        }
        /** Gets the decoration that corresponds to the given test message */
        getMessage(message) {
            return this.messages.get(message);
        }
        /** Removes the decoration for the given test messsage */
        removeMessage(message) {
            this.messages.delete(message);
        }
        /** Adds a new test message decoration */
        addMessage(d) {
            this.messages.set(d.testMessage, d);
        }
        /** Adds a new test run decroation */
        addTest(d) {
            const key = d.testIds.sort().join('\0\0');
            this.runByIdKey.set(key, d);
        }
        /** Finds an extension by VS Code event ID */
        getById(decorationId) {
            for (const d of this.runByIdKey.values()) {
                if (d.id === decorationId) {
                    return d;
                }
            }
            for (const d of this.messages.values()) {
                if (d.id === decorationId) {
                    return d;
                }
            }
            return undefined;
        }
        /** Iterate over all decorations */
        *[Symbol.iterator]() {
            for (const d of this.runByIdKey.values()) {
                yield d;
            }
            for (const d of this.messages.values()) {
                yield d;
            }
        }
    }
    let TestingDecorationService = class TestingDecorationService extends lifecycle_1.Disposable {
        constructor(codeEditorService, configurationService, testService, results, instantiationService, modelService) {
            super();
            this.configurationService = configurationService;
            this.testService = testService;
            this.results = results;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.generation = 0;
            this.changeEmitter = new event_1.Emitter();
            this.decorationCache = new map_1.ResourceMap();
            /**
             * List of messages that should be hidden because an editor changed their
             * underlying ranges. I think this is good enough, because:
             *  - Message decorations are never shown across reloads; this does not
             *    need to persist
             *  - Message instances are stable for any completed test results for
             *    the duration of the session.
             */
            this.invalidatedMessages = new WeakSet();
            /** @inheritdoc */
            this.onDidChange = this.changeEmitter.event;
            codeEditorService.registerDecorationType('test-message-decoration', TestMessageDecoration.decorationId, {}, undefined);
            modelService.onModelRemoved(e => this.decorationCache.delete(e.uri));
            const debounceInvalidate = this._register(new async_1.RunOnceScheduler(() => this.invalidate(), 100));
            // If ranges were updated in the document, mark that we should explicitly
            // sync decorations to the published lines, since we assume that everything
            // is up to date. This prevents issues, as in #138632, #138835, #138922.
            this._register(this.testService.onWillProcessDiff(diff => {
                for (const entry of diff) {
                    if (entry.op !== 2 /* TestDiffOpType.DocumentSynced */) {
                        continue;
                    }
                    const rec = this.decorationCache.get(entry.uri);
                    if (rec) {
                        rec.rangeUpdateVersionId = entry.docv;
                    }
                }
                if (!debounceInvalidate.isScheduled()) {
                    debounceInvalidate.schedule();
                }
            }));
            this._register(event_1.Event.any(this.results.onResultsChanged, this.results.onTestChanged, this.testService.excluded.onTestExclusionsChanged, this.testService.showInlineOutput.onDidChange, event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration("testing.gutterEnabled" /* TestingConfigKeys.GutterEnabled */)))(() => {
                if (!debounceInvalidate.isScheduled()) {
                    debounceInvalidate.schedule();
                }
            }));
            this._register(editorLineNumberMenu_1.GutterActionsRegistry.registerGutterActionsGenerator((context, result) => {
                const model = context.editor.getModel();
                const testingDecorations = TestingDecorations.get(context.editor);
                if (!model || !testingDecorations?.currentUri) {
                    return;
                }
                const currentDecorations = this.syncDecorations(testingDecorations.currentUri);
                if (!currentDecorations.size) {
                    return;
                }
                const modelDecorations = model.getLinesDecorations(context.lineNumber, context.lineNumber);
                for (const { id } of modelDecorations) {
                    const decoration = currentDecorations.getById(id);
                    if (decoration) {
                        const { object: actions } = decoration.getContextMenuActions();
                        for (const action of actions) {
                            result.push(action, '1_testing');
                        }
                    }
                }
            }));
        }
        /** @inheritdoc */
        invalidateResultMessage(message) {
            this.invalidatedMessages.add(message);
            this.invalidate();
        }
        /** @inheritdoc */
        syncDecorations(resource) {
            const model = this.modelService.getModel(resource);
            if (!model) {
                return new CachedDecorations();
            }
            const cached = this.decorationCache.get(resource);
            if (cached && cached.generation === this.generation && (cached.rangeUpdateVersionId === undefined || cached.rangeUpdateVersionId !== model.getVersionId())) {
                return cached.value;
            }
            return this.applyDecorations(model);
        }
        /** @inheritdoc */
        getDecoratedTestPosition(resource, testId) {
            const model = this.modelService.getModel(resource);
            if (!model) {
                return undefined;
            }
            const decoration = iterator_1.Iterable.find(this.syncDecorations(resource), v => v instanceof RunTestDecoration && v.isForTest(testId));
            if (!decoration) {
                return undefined;
            }
            // decoration is collapsed, so the range is meaningless; only position matters.
            return model.getDecorationRange(decoration.id)?.getStartPosition();
        }
        invalidate() {
            this.generation++;
            this.changeEmitter.fire();
        }
        /**
         * Applies the current set of test decorations to the given text model.
         */
        applyDecorations(model) {
            const gutterEnabled = (0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.gutterEnabled" /* TestingConfigKeys.GutterEnabled */);
            const uriStr = model.uri.toString();
            const cached = this.decorationCache.get(model.uri);
            const testRangesUpdated = cached?.rangeUpdateVersionId === model.getVersionId();
            const lastDecorations = cached?.value ?? new CachedDecorations();
            const newDecorations = model.changeDecorations(accessor => {
                const newDecorations = new CachedDecorations();
                const runDecorations = new testingDecorations_1.TestDecorations();
                for (const test of this.testService.collection.getNodeByUrl(model.uri)) {
                    if (!test.item.range) {
                        continue;
                    }
                    const stateLookup = this.results.getStateById(test.item.extId);
                    const line = test.item.range.startLineNumber;
                    runDecorations.push({ line, id: '', test, resultItem: stateLookup?.[1] });
                }
                for (const [line, tests] of runDecorations.lines()) {
                    const multi = tests.length > 1;
                    let existing = lastDecorations.getForExactTests(tests.map(t => t.test.item.extId));
                    // see comment in the constructor for what's going on here
                    if (existing && testRangesUpdated && model.getDecorationRange(existing.id)?.startLineNumber !== line) {
                        existing = undefined;
                    }
                    if (existing) {
                        if (existing.replaceOptions(tests, gutterEnabled)) {
                            accessor.changeDecorationOptions(existing.id, existing.editorDecoration.options);
                        }
                        newDecorations.addTest(existing);
                    }
                    else {
                        newDecorations.addTest(multi
                            ? this.instantiationService.createInstance(MultiRunTestDecoration, tests, gutterEnabled, model)
                            : this.instantiationService.createInstance(RunSingleTestDecoration, tests[0].test, tests[0].resultItem, model, gutterEnabled));
                    }
                }
                const messageLines = new Set();
                if ((0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.showAllMessages" /* TestingConfigKeys.ShowAllMessages */)) {
                    this.results.results.forEach(lastResult => this.applyDecorationsFromResult(lastResult, messageLines, uriStr, lastDecorations, model, newDecorations));
                }
                else {
                    this.applyDecorationsFromResult(this.results.results[0], messageLines, uriStr, lastDecorations, model, newDecorations);
                }
                const saveFromRemoval = new Set();
                for (const decoration of newDecorations) {
                    if (decoration.id === '') {
                        decoration.id = accessor.addDecoration(decoration.editorDecoration.range, decoration.editorDecoration.options);
                    }
                    else {
                        saveFromRemoval.add(decoration.id);
                    }
                }
                for (const decoration of lastDecorations) {
                    if (!saveFromRemoval.has(decoration.id)) {
                        accessor.removeDecoration(decoration.id);
                    }
                }
                this.decorationCache.set(model.uri, {
                    generation: this.generation,
                    rangeUpdateVersionId: cached?.rangeUpdateVersionId,
                    value: newDecorations,
                });
                return newDecorations;
            });
            return newDecorations || lastDecorations;
        }
        applyDecorationsFromResult(lastResult, messageLines, uriStr, lastDecorations, model, newDecorations) {
            if (this.testService.showInlineOutput.value && lastResult instanceof testResult_1.LiveTestResult) {
                for (const task of lastResult.tasks) {
                    for (const m of task.otherMessages) {
                        if (!this.invalidatedMessages.has(m) && m.location?.uri.toString() === uriStr) {
                            const decoration = lastDecorations.getMessage(m) || this.instantiationService.createInstance(TestMessageDecoration, m, undefined, model);
                            newDecorations.addMessage(decoration);
                        }
                    }
                }
                for (const test of lastResult.tests) {
                    for (let taskId = 0; taskId < test.tasks.length; taskId++) {
                        const state = test.tasks[taskId];
                        // push error decorations first so they take precedence over normal output
                        for (const kind of [0 /* TestMessageType.Error */, 1 /* TestMessageType.Output */]) {
                            for (let i = 0; i < state.messages.length; i++) {
                                const m = state.messages[i];
                                if (m.type !== kind || this.invalidatedMessages.has(m) || m.location?.uri.toString() !== uriStr) {
                                    continue;
                                }
                                // Only add one message per line number. Overlapping messages
                                // don't appear well, and the peek will show all of them (#134129)
                                const line = m.location.range.startLineNumber;
                                if (!messageLines.has(line)) {
                                    const decoration = lastDecorations.getMessage(m) || this.instantiationService.createInstance(TestMessageDecoration, m, (0, testingUri_1.buildTestUri)({
                                        type: 3 /* TestUriType.ResultActualOutput */,
                                        messageIndex: i,
                                        taskIndex: taskId,
                                        resultId: lastResult.id,
                                        testExtId: test.item.extId,
                                    }), model);
                                    newDecorations.addMessage(decoration);
                                    messageLines.add(line);
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    exports.TestingDecorationService = TestingDecorationService;
    exports.TestingDecorationService = TestingDecorationService = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, testService_1.ITestService),
        __param(3, testResultService_1.ITestResultService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, model_2.IModelService)
    ], TestingDecorationService);
    let TestingDecorations = class TestingDecorations extends lifecycle_1.Disposable {
        /**
         * Gets the decorations associated with the given code editor.
         */
        static get(editor) {
            return editor.getContribution("editor.contrib.testingDecorations" /* Testing.DecorationsContributionId */);
        }
        get currentUri() { return this._currentUri; }
        constructor(editor, codeEditorService, testService, decorations, uriIdentityService) {
            super();
            this.editor = editor;
            this.codeEditorService = codeEditorService;
            this.testService = testService;
            this.decorations = decorations;
            this.uriIdentityService = uriIdentityService;
            this.expectedWidget = new lifecycle_1.MutableDisposable();
            this.actualWidget = new lifecycle_1.MutableDisposable();
            codeEditorService.registerDecorationType('test-message-decoration', TestMessageDecoration.decorationId, {}, undefined, editor);
            this.attachModel(editor.getModel()?.uri);
            this._register(decorations.onDidChange(() => {
                if (this._currentUri) {
                    decorations.syncDecorations(this._currentUri);
                }
            }));
            this._register(this.editor.onDidChangeModel(e => this.attachModel(e.newModelUrl || undefined)));
            this._register(this.editor.onMouseDown(e => {
                if (e.target.position && this.currentUri) {
                    const modelDecorations = editor.getModel()?.getLineDecorations(e.target.position.lineNumber) ?? [];
                    if (!modelDecorations.length) {
                        return;
                    }
                    const cache = decorations.syncDecorations(this.currentUri);
                    for (const { id } of modelDecorations) {
                        if (cache.getById(id)?.click(e)) {
                            e.event.stopPropagation();
                            return;
                        }
                    }
                }
            }));
            this._register(event_1.Event.accumulate(this.editor.onDidChangeModelContent, 0, this._store)(evts => {
                const model = editor.getModel();
                if (!this._currentUri || !model) {
                    return;
                }
                const currentDecorations = decorations.syncDecorations(this._currentUri);
                if (!currentDecorations.size) {
                    return;
                }
                for (const e of evts) {
                    for (const change of e.changes) {
                        const modelDecorations = model.getLinesDecorations(change.range.startLineNumber, change.range.endLineNumber);
                        for (const { id } of modelDecorations) {
                            const decoration = currentDecorations.getById(id);
                            if (decoration instanceof TestMessageDecoration) {
                                decorations.invalidateResultMessage(decoration.testMessage);
                            }
                        }
                    }
                }
            }));
            const updateFontFamilyVar = () => {
                this.editor.getContainerDomNode().style.setProperty('--testMessageDecorationFontFamily', editor.getOption(49 /* EditorOption.fontFamily */));
                this.editor.getContainerDomNode().style.setProperty('--testMessageDecorationFontSize', `${editor.getOption(52 /* EditorOption.fontSize */)}px`);
            };
            this._register(this.editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(49 /* EditorOption.fontFamily */)) {
                    updateFontFamilyVar();
                }
            }));
            updateFontFamilyVar();
        }
        attachModel(uri) {
            switch (uri && (0, testingUri_1.parseTestUri)(uri)?.type) {
                case 4 /* TestUriType.ResultExpectedOutput */:
                    this.expectedWidget.value = new ExpectedLensContentWidget(this.editor);
                    this.actualWidget.clear();
                    break;
                case 3 /* TestUriType.ResultActualOutput */:
                    this.expectedWidget.clear();
                    this.actualWidget.value = new ActualLensContentWidget(this.editor);
                    break;
                default:
                    this.expectedWidget.clear();
                    this.actualWidget.clear();
            }
            if (isOriginalInDiffEditor(this.codeEditorService, this.editor)) {
                uri = undefined;
            }
            this._currentUri = uri;
            if (!uri) {
                return;
            }
            this.decorations.syncDecorations(uri);
            (async () => {
                for await (const _test of (0, testService_1.testsInFile)(this.testService, this.uriIdentityService, uri, false)) {
                    // consume the iterator so that all tests in the file get expanded. Or
                    // at least until the URI changes. If new items are requested, changes
                    // will be trigged in the `onDidProcessDiff` callback.
                    if (this._currentUri !== uri) {
                        break;
                    }
                }
            })();
        }
    };
    exports.TestingDecorations = TestingDecorations;
    exports.TestingDecorations = TestingDecorations = __decorate([
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, testService_1.ITestService),
        __param(3, testingDecorations_1.ITestingDecorationsService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], TestingDecorations);
    const collapseRange = (originalRange) => ({
        startLineNumber: originalRange.startLineNumber,
        endLineNumber: originalRange.startLineNumber,
        startColumn: originalRange.startColumn,
        endColumn: originalRange.startColumn,
    });
    const createRunTestDecoration = (tests, states, visible) => {
        const range = tests[0]?.item.range;
        if (!range) {
            throw new Error('Test decorations can only be created for tests with a range');
        }
        if (!visible) {
            return { range: collapseRange(range), options: { isWholeLine: true, description: 'run-test-decoration' } };
        }
        let computedState = 0 /* TestResultState.Unset */;
        const hoverMessageParts = [];
        let testIdWithMessages;
        let retired = false;
        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            const resultItem = states[i];
            const state = resultItem?.computedState ?? 0 /* TestResultState.Unset */;
            if (hoverMessageParts.length < 10) {
                hoverMessageParts.push((0, constants_1.labelForTestInState)(test.item.label, state));
            }
            computedState = (0, testingStates_1.maxPriority)(computedState, state);
            retired = retired || !!resultItem?.retired;
            if (!testIdWithMessages && resultItem?.tasks.some(t => t.messages.length)) {
                testIdWithMessages = test.item.extId;
            }
        }
        const hasMultipleTests = tests.length > 1 || tests[0].children.size > 0;
        const icon = computedState === 0 /* TestResultState.Unset */
            ? (hasMultipleTests ? icons_1.testingRunAllIcon : icons_1.testingRunIcon)
            : icons_1.testingStatesToIcons.get(computedState);
        let hoverMessage;
        let glyphMarginClassName = themables_1.ThemeIcon.asClassName(icon) + ' testing-run-glyph';
        if (retired) {
            glyphMarginClassName += ' retired';
        }
        return {
            range: collapseRange(range),
            options: {
                description: 'run-test-decoration',
                showIfCollapsed: true,
                get hoverMessage() {
                    if (!hoverMessage) {
                        const building = hoverMessage = new htmlContent_1.MarkdownString('', true).appendText(hoverMessageParts.join(', ') + '.');
                        if (testIdWithMessages) {
                            const args = encodeURIComponent(JSON.stringify([testIdWithMessages]));
                            building.appendMarkdown(` [${(0, nls_1.localize)('peekTestOutout', 'Peek Test Output')}](command:vscode.peekTestError?${args})`);
                        }
                    }
                    return hoverMessage;
                },
                glyphMargin: { position: GLYPH_MARGIN_LANE },
                glyphMarginClassName,
                stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                zIndex: 10000,
            }
        };
    };
    var LensContentWidgetVars;
    (function (LensContentWidgetVars) {
        LensContentWidgetVars["FontFamily"] = "testingDiffLensFontFamily";
        LensContentWidgetVars["FontFeatures"] = "testingDiffLensFontFeatures";
    })(LensContentWidgetVars || (LensContentWidgetVars = {}));
    class TitleLensContentWidget {
        constructor(editor) {
            this.editor = editor;
            /** @inheritdoc */
            this.allowEditorOverflow = false;
            /** @inheritdoc */
            this.suppressMouseDown = true;
            this._domNode = dom.$('span');
            queueMicrotask(() => {
                this.applyStyling();
                this.editor.addContentWidget(this);
            });
        }
        applyStyling() {
            let fontSize = this.editor.getOption(19 /* EditorOption.codeLensFontSize */);
            let height;
            if (!fontSize || fontSize < 5) {
                fontSize = (this.editor.getOption(52 /* EditorOption.fontSize */) * .9) | 0;
                height = this.editor.getOption(67 /* EditorOption.lineHeight */);
            }
            else {
                height = (fontSize * Math.max(1.3, this.editor.getOption(67 /* EditorOption.lineHeight */) / this.editor.getOption(52 /* EditorOption.fontSize */))) | 0;
            }
            const editorFontInfo = this.editor.getOption(50 /* EditorOption.fontInfo */);
            const node = this._domNode;
            node.classList.add('testing-diff-lens-widget');
            node.textContent = this.getText();
            node.style.lineHeight = `${height}px`;
            node.style.fontSize = `${fontSize}px`;
            node.style.fontFamily = `var(--${"testingDiffLensFontFamily" /* LensContentWidgetVars.FontFamily */})`;
            node.style.fontFeatureSettings = `var(--${"testingDiffLensFontFeatures" /* LensContentWidgetVars.FontFeatures */})`;
            const containerStyle = this.editor.getContainerDomNode().style;
            containerStyle.setProperty("testingDiffLensFontFamily" /* LensContentWidgetVars.FontFamily */, this.editor.getOption(18 /* EditorOption.codeLensFontFamily */) ?? 'inherit');
            containerStyle.setProperty("testingDiffLensFontFeatures" /* LensContentWidgetVars.FontFeatures */, editorFontInfo.fontFeatureSettings);
            this.editor.changeViewZones(accessor => {
                if (this.viewZoneId) {
                    accessor.removeZone(this.viewZoneId);
                }
                this.viewZoneId = accessor.addZone({
                    afterLineNumber: 0,
                    afterColumn: 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */,
                    domNode: document.createElement('div'),
                    heightInPx: 20,
                });
            });
        }
        /** @inheritdoc */
        getDomNode() {
            return this._domNode;
        }
        /** @inheritdoc */
        dispose() {
            this.editor.changeViewZones(accessor => {
                if (this.viewZoneId) {
                    accessor.removeZone(this.viewZoneId);
                }
            });
            this.editor.removeContentWidget(this);
        }
        /** @inheritdoc */
        getPosition() {
            return {
                position: { column: 0, lineNumber: 0 },
                preference: [1 /* ContentWidgetPositionPreference.ABOVE */],
            };
        }
    }
    class ExpectedLensContentWidget extends TitleLensContentWidget {
        getId() {
            return 'expectedTestingLens';
        }
        getText() {
            return (0, nls_1.localize)('expected.title', 'Expected');
        }
    }
    class ActualLensContentWidget extends TitleLensContentWidget {
        getId() {
            return 'actualTestingLens';
        }
        getText() {
            return (0, nls_1.localize)('actual.title', 'Actual');
        }
    }
    let RunTestDecoration = class RunTestDecoration {
        get line() {
            return this.editorDecoration.range.startLineNumber;
        }
        get testIds() {
            return this.tests.map(t => t.test.item.extId);
        }
        constructor(tests, visible, model, codeEditorService, testService, contextMenuService, commandService, configurationService, testProfileService, contextKeyService, menuService) {
            this.tests = tests;
            this.visible = visible;
            this.model = model;
            this.codeEditorService = codeEditorService;
            this.testService = testService;
            this.contextMenuService = contextMenuService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.testProfileService = testProfileService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            /** @inheritdoc */
            this.id = '';
            this.displayedStates = tests.map(t => t.resultItem?.computedState);
            this.editorDecoration = createRunTestDecoration(tests.map(t => t.test), tests.map(t => t.resultItem), visible);
            this.editorDecoration.options.glyphMarginHoverMessage = new htmlContent_1.MarkdownString().appendText(this.getGutterLabel());
        }
        /** @inheritdoc */
        click(e) {
            if (e.target.type !== 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */
                || e.target.detail.glyphMarginLane !== GLYPH_MARGIN_LANE
                // handled by editor gutter context menu
                || e.event.rightButton
                || platform_1.isMacintosh && e.event.leftButton && e.event.ctrlKey) {
                return false;
            }
            const alternateAction = e.event.altKey;
            switch ((0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.defaultGutterClickAction" /* TestingConfigKeys.DefaultGutterClickAction */)) {
                case "contextMenu" /* DefaultGutterClickAction.ContextMenu */:
                    this.showContextMenu(e);
                    break;
                case "debug" /* DefaultGutterClickAction.Debug */:
                    this.runWith(alternateAction ? 2 /* TestRunProfileBitset.Run */ : 4 /* TestRunProfileBitset.Debug */);
                    break;
                case "runWithCoverage" /* DefaultGutterClickAction.Coverage */:
                    this.runWith(alternateAction ? 4 /* TestRunProfileBitset.Debug */ : 8 /* TestRunProfileBitset.Coverage */);
                    break;
                case "run" /* DefaultGutterClickAction.Run */:
                default:
                    this.runWith(alternateAction ? 4 /* TestRunProfileBitset.Debug */ : 2 /* TestRunProfileBitset.Run */);
                    break;
            }
            return true;
        }
        /**
         * Updates the decoration to match the new set of tests.
         * @returns true if options were changed, false otherwise
         */
        replaceOptions(newTests, visible) {
            const displayedStates = newTests.map(t => t.resultItem?.computedState);
            if (visible === this.visible && (0, arrays_1.equals)(this.displayedStates, displayedStates)) {
                return false;
            }
            this.tests = newTests;
            this.displayedStates = displayedStates;
            this.visible = visible;
            this.editorDecoration.options = createRunTestDecoration(newTests.map(t => t.test), newTests.map(t => t.resultItem), visible).options;
            this.editorDecoration.options.glyphMarginHoverMessage = new htmlContent_1.MarkdownString().appendText(this.getGutterLabel());
            return true;
        }
        /**
         * Gets whether this decoration serves as the run button for the given test ID.
         */
        isForTest(testId) {
            return this.tests.some(t => t.test.item.extId === testId);
        }
        runWith(profile) {
            return this.testService.runTests({
                tests: this.tests.map(({ test }) => test),
                group: profile,
            });
        }
        showContextMenu(e) {
            const editor = this.codeEditorService.listCodeEditors().find(e => e.getModel() === this.model);
            editor?.getContribution(editorLineNumberMenu_1.EditorLineNumberContextMenu.ID)?.show(e);
        }
        getGutterLabel() {
            switch ((0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.defaultGutterClickAction" /* TestingConfigKeys.DefaultGutterClickAction */)) {
                case "contextMenu" /* DefaultGutterClickAction.ContextMenu */:
                    return (0, nls_1.localize)('testing.gutterMsg.contextMenu', 'Click for test options');
                case "debug" /* DefaultGutterClickAction.Debug */:
                    return (0, nls_1.localize)('testing.gutterMsg.debug', 'Click to debug tests, right click for more options');
                case "runWithCoverage" /* DefaultGutterClickAction.Coverage */:
                    return (0, nls_1.localize)('testing.gutterMsg.coverage', 'Click to run tests with coverage, right click for more options');
                case "run" /* DefaultGutterClickAction.Run */:
                default:
                    return (0, nls_1.localize)('testing.gutterMsg.run', 'Click to run tests, right click for more options');
            }
        }
        /**
         * Gets context menu actions relevant for a singel test.
         */
        getTestContextMenuActions(test, resultItem) {
            const testActions = [];
            const capabilities = this.testProfileService.capabilitiesForTest(test);
            [
                { bitset: 2 /* TestRunProfileBitset.Run */, label: (0, nls_1.localize)('run test', 'Run Test') },
                { bitset: 4 /* TestRunProfileBitset.Debug */, label: (0, nls_1.localize)('debug test', 'Debug Test') },
                { bitset: 8 /* TestRunProfileBitset.Coverage */, label: (0, nls_1.localize)('coverage test', 'Run with Coverage') },
            ].forEach(({ bitset, label }) => {
                if (capabilities & bitset) {
                    testActions.push(new actions_1.Action(`testing.gutter.${bitset}`, label, undefined, undefined, () => this.testService.runTests({ group: bitset, tests: [test] })));
                }
            });
            if (capabilities & 16 /* TestRunProfileBitset.HasNonDefaultProfile */) {
                testActions.push(new actions_1.Action('testing.runUsing', (0, nls_1.localize)('testing.runUsing', 'Execute Using Profile...'), undefined, undefined, async () => {
                    const profile = await this.commandService.executeCommand('vscode.pickTestProfile', { onlyForTest: test });
                    if (!profile) {
                        return;
                    }
                    this.testService.runResolvedTests({
                        targets: [{
                                profileGroup: profile.group,
                                profileId: profile.profileId,
                                controllerId: profile.controllerId,
                                testIds: [test.item.extId]
                            }]
                    });
                }));
            }
            if (resultItem && (0, testingStates_1.isFailedState)(resultItem.computedState)) {
                testActions.push(new actions_1.Action('testing.gutter.peekFailure', (0, nls_1.localize)('peek failure', 'Peek Error'), undefined, undefined, () => this.commandService.executeCommand('vscode.peekTestError', test.item.extId)));
            }
            testActions.push(new actions_1.Action('testing.gutter.reveal', (0, nls_1.localize)('reveal test', 'Reveal in Test Explorer'), undefined, undefined, () => this.commandService.executeCommand('_revealTestInExplorer', test.item.extId)));
            const contributed = this.getContributedTestActions(test, capabilities);
            return { object: actions_1.Separator.join(testActions, contributed), dispose() { } };
        }
        getContributedTestActions(test, capabilities) {
            const contextOverlay = this.contextKeyService.createOverlay((0, testItemContextOverlay_1.getTestItemContextOverlay)(test, capabilities));
            const menu = this.menuService.createMenu(actions_2.MenuId.TestItemGutter, contextOverlay);
            try {
                const target = [];
                const arg = (0, testService_1.getContextForTestItem)(this.testService.collection, test.item.extId);
                (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true, arg }, target);
                return target;
            }
            finally {
                menu.dispose();
            }
        }
    };
    RunTestDecoration = __decorate([
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, testService_1.ITestService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, commands_1.ICommandService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, testProfileService_1.ITestProfileService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, actions_2.IMenuService)
    ], RunTestDecoration);
    let MultiRunTestDecoration = class MultiRunTestDecoration extends RunTestDecoration {
        constructor(tests, visible, model, codeEditorService, testService, contextMenuService, commandService, configurationService, testProfileService, contextKeyService, menuService, quickInputService) {
            super(tests, visible, model, codeEditorService, testService, contextMenuService, commandService, configurationService, testProfileService, contextKeyService, menuService);
            this.quickInputService = quickInputService;
        }
        getContextMenuActions() {
            const allActions = [];
            [
                { bitset: 2 /* TestRunProfileBitset.Run */, label: (0, nls_1.localize)('run all test', 'Run All Tests') },
                { bitset: 8 /* TestRunProfileBitset.Coverage */, label: (0, nls_1.localize)('run all test with coverage', 'Run All Tests with Coverage') },
                { bitset: 4 /* TestRunProfileBitset.Debug */, label: (0, nls_1.localize)('debug all test', 'Debug All Tests') },
            ].forEach(({ bitset, label }, i) => {
                const canRun = this.tests.some(({ test }) => this.testProfileService.capabilitiesForTest(test) & bitset);
                if (canRun) {
                    allActions.push(new actions_1.Action(`testing.gutter.run${i}`, label, undefined, undefined, () => this.runWith(bitset)));
                }
            });
            const testItems = this.tests.map((testItem) => ({
                currentLabel: testItem.test.item.label,
                testItem,
                parent: testId_1.TestId.fromString(testItem.test.item.extId).parentId,
            }));
            const getLabelConflicts = (tests) => {
                const labelCount = new Map();
                for (const test of tests) {
                    labelCount.set(test.currentLabel, (labelCount.get(test.currentLabel) || 0) + 1);
                }
                return tests.filter(e => labelCount.get(e.currentLabel) > 1);
            };
            let conflicts, hasParent = true;
            while ((conflicts = getLabelConflicts(testItems)).length && hasParent) {
                for (const conflict of conflicts) {
                    if (conflict.parent) {
                        const parent = this.testService.collection.getNodeById(conflict.parent.toString());
                        conflict.currentLabel = parent?.item.label + ' > ' + conflict.currentLabel;
                        conflict.parent = conflict.parent.parentId;
                    }
                    else {
                        hasParent = false;
                    }
                }
            }
            testItems.sort((a, b) => {
                const ai = a.testItem.test.item;
                const bi = b.testItem.test.item;
                return (ai.sortText || ai.label).localeCompare(bi.sortText || bi.label);
            });
            const disposable = new lifecycle_1.DisposableStore();
            let testSubmenus = testItems.map(({ currentLabel, testItem }) => {
                const actions = this.getTestContextMenuActions(testItem.test, testItem.resultItem);
                disposable.add(actions);
                return new actions_1.SubmenuAction(testItem.test.item.extId, (0, iconLabels_1.stripIcons)(currentLabel), actions.object);
            });
            const overflow = testSubmenus.length - MAX_TESTS_IN_SUBMENU;
            if (overflow > 0) {
                testSubmenus = testSubmenus.slice(0, MAX_TESTS_IN_SUBMENU);
                testSubmenus.push(new actions_1.Action('testing.gutter.overflow', (0, nls_1.localize)('testOverflowItems', '{0} more tests...', overflow), undefined, undefined, () => this.pickAndRun(testItems)));
            }
            return { object: actions_1.Separator.join(allActions, testSubmenus), dispose: () => disposable.dispose() };
        }
        async pickAndRun(testItems) {
            const doPick = (items, title) => new Promise(resolve => {
                const pick = this.quickInputService.createQuickPick();
                pick.placeholder = title;
                pick.items = items;
                pick.onDidHide(() => {
                    resolve(undefined);
                    pick.dispose();
                });
                pick.onDidAccept(() => {
                    resolve(pick.selectedItems[0]);
                    pick.dispose();
                });
                pick.show();
            });
            const item = await doPick(testItems.map(({ currentLabel, testItem }) => ({ label: currentLabel, test: testItem.test, result: testItem.resultItem })), (0, nls_1.localize)('selectTestToRun', 'Select a test to run'));
            if (!item) {
                return;
            }
            const actions = this.getTestContextMenuActions(item.test, item.result);
            try {
                (await doPick(actions.object, item.label))?.run();
            }
            finally {
                actions.dispose();
            }
        }
    };
    MultiRunTestDecoration = __decorate([
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, testService_1.ITestService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, commands_1.ICommandService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, testProfileService_1.ITestProfileService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, actions_2.IMenuService),
        __param(11, quickInput_1.IQuickInputService)
    ], MultiRunTestDecoration);
    let RunSingleTestDecoration = class RunSingleTestDecoration extends RunTestDecoration {
        constructor(test, resultItem, model, visible, codeEditorService, testService, commandService, contextMenuService, configurationService, testProfiles, contextKeyService, menuService) {
            super([{ test, resultItem }], visible, model, codeEditorService, testService, contextMenuService, commandService, configurationService, testProfiles, contextKeyService, menuService);
        }
        getContextMenuActions() {
            return this.getTestContextMenuActions(this.tests[0].test, this.tests[0].resultItem);
        }
    };
    RunSingleTestDecoration = __decorate([
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, testService_1.ITestService),
        __param(6, commands_1.ICommandService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, testProfileService_1.ITestProfileService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, actions_2.IMenuService)
    ], RunSingleTestDecoration);
    const lineBreakRe = /\r?\n\s*/g;
    let TestMessageDecoration = class TestMessageDecoration {
        static { TestMessageDecoration_1 = this; }
        static { this.inlineClassName = 'test-message-inline-content'; }
        static { this.decorationId = `testmessage-${(0, uuid_1.generateUuid)()}`; }
        constructor(testMessage, messageUri, textModel, peekOpener, editorService) {
            this.testMessage = testMessage;
            this.messageUri = messageUri;
            this.peekOpener = peekOpener;
            this.id = '';
            this.contentIdClass = `test-message-inline-content-id${(0, uuid_1.generateUuid)()}`;
            this.location = testMessage.location;
            this.line = this.location.range.startLineNumber;
            const severity = testMessage.type;
            const message = testMessage.message;
            const options = editorService.resolveDecorationOptions(TestMessageDecoration_1.decorationId, true);
            options.hoverMessage = typeof message === 'string' ? new htmlContent_1.MarkdownString().appendText(message) : message;
            options.zIndex = 10; // todo: in spite of the z-index, this appears behind gitlens
            options.className = `testing-inline-message-severity-${severity}`;
            options.isWholeLine = true;
            options.stickiness = 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */;
            options.collapseOnReplaceEdit = true;
            let inlineText = (0, testMessageColorizer_1.renderTestMessageAsText)(message).replace(lineBreakRe, ' ');
            if (inlineText.length > MAX_INLINE_MESSAGE_LENGTH) {
                inlineText = inlineText.slice(0, MAX_INLINE_MESSAGE_LENGTH - 1) + '…';
            }
            options.after = {
                content: ' '.repeat(4) + inlineText,
                inlineClassName: `test-message-inline-content test-message-inline-content-s${severity} ${this.contentIdClass} ${messageUri ? 'test-message-inline-content-clickable' : ''}`
            };
            options.showIfCollapsed = true;
            const rulerColor = severity === 0 /* TestMessageType.Error */
                ? editorColorRegistry_1.overviewRulerError
                : editorColorRegistry_1.overviewRulerInfo;
            if (rulerColor) {
                options.overviewRuler = { color: (0, themeService_1.themeColorFromId)(rulerColor), position: model_1.OverviewRulerLane.Right };
            }
            const lineLength = textModel.getLineLength(this.location.range.startLineNumber);
            const column = lineLength ? (lineLength + 1) : this.location.range.endColumn;
            this.editorDecoration = {
                options,
                range: {
                    startLineNumber: this.location.range.startLineNumber,
                    startColumn: column,
                    endColumn: column,
                    endLineNumber: this.location.range.startLineNumber,
                }
            };
        }
        click(e) {
            if (e.event.rightButton) {
                return false;
            }
            if (!this.messageUri) {
                return false;
            }
            if (e.target.element?.className.includes(this.contentIdClass)) {
                this.peekOpener.peekUri(this.messageUri);
            }
            return false;
        }
        getContextMenuActions() {
            return { object: [], dispose: () => { } };
        }
    };
    TestMessageDecoration = TestMessageDecoration_1 = __decorate([
        __param(3, testingPeekOpener_1.ITestingPeekOpener),
        __param(4, codeEditorService_1.ICodeEditorService)
    ], TestMessageDecoration);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ0RlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2Jyb3dzZXIvdGVzdGluZ0RlY29yYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFxRGhHLE1BQU0seUJBQXlCLEdBQUcsR0FBRyxDQUFDO0lBQ3RDLE1BQU0sb0JBQW9CLEdBQUcsRUFBRSxDQUFDO0lBQ2hDLE1BQU0saUJBQWlCLEdBQUcsdUJBQWUsQ0FBQyxNQUFNLENBQUM7SUFFakQsU0FBUyxzQkFBc0IsQ0FBQyxpQkFBcUMsRUFBRSxVQUF1QjtRQUM3RixNQUFNLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUV4RCxLQUFLLE1BQU0sVUFBVSxJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ3RDLElBQUksVUFBVSxDQUFDLGlCQUFpQixFQUFFLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ25ELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFPRCwrRkFBK0Y7SUFDL0YsTUFBTSxpQkFBaUI7UUFBdkI7WUFDa0IsZUFBVSxHQUFHLElBQUksR0FBRyxFQUE2QixDQUFDO1lBQ2xELGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBdUMsQ0FBQztRQXlENUUsQ0FBQztRQXZEQSxJQUFXLElBQUk7WUFDZCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO1FBQ2xELENBQUM7UUFFRCwwRUFBMEU7UUFDbkUsZ0JBQWdCLENBQUMsT0FBaUI7WUFDeEMsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxxRUFBcUU7UUFDOUQsVUFBVSxDQUFDLE9BQXFCO1lBQ3RDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELHlEQUF5RDtRQUNsRCxhQUFhLENBQUMsT0FBcUI7WUFDekMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELHlDQUF5QztRQUNsQyxVQUFVLENBQUMsQ0FBd0I7WUFDekMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQscUNBQXFDO1FBQzlCLE9BQU8sQ0FBQyxDQUFvQjtZQUNsQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUVELDZDQUE2QztRQUN0QyxPQUFPLENBQUMsWUFBb0I7WUFDbEMsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxZQUFZLEVBQUUsQ0FBQztvQkFDM0IsT0FBTyxDQUFDLENBQUM7Z0JBQ1YsQ0FBQztZQUNGLENBQUM7WUFDRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLENBQUMsRUFBRSxLQUFLLFlBQVksRUFBRSxDQUFDO29CQUMzQixPQUFPLENBQUMsQ0FBQztnQkFDVixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxtQ0FBbUM7UUFDbkMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDakIsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQzFDLE1BQU0sQ0FBQyxDQUFDO1lBQ1QsQ0FBQztZQUNELEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUN4QyxNQUFNLENBQUMsQ0FBQztZQUNULENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFFTSxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVO1FBMEJ2RCxZQUNxQixpQkFBcUMsRUFDbEMsb0JBQTRELEVBQ3JFLFdBQTBDLEVBQ3BDLE9BQTRDLEVBQ3pDLG9CQUE0RCxFQUNwRSxZQUE0QztZQUUzRCxLQUFLLEVBQUUsQ0FBQztZQU5nQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3BELGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ25CLFlBQU8sR0FBUCxPQUFPLENBQW9CO1lBQ3hCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbkQsaUJBQVksR0FBWixZQUFZLENBQWU7WUE3QnBELGVBQVUsR0FBRyxDQUFDLENBQUM7WUFDTixrQkFBYSxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDcEMsb0JBQWUsR0FBRyxJQUFJLGlCQUFXLEVBTTlDLENBQUM7WUFFTDs7Ozs7OztlQU9HO1lBQ2Msd0JBQW1CLEdBQUcsSUFBSSxPQUFPLEVBQWdCLENBQUM7WUFFbkUsa0JBQWtCO1lBQ0YsZ0JBQVcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztZQVd0RCxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyx5QkFBeUIsRUFBRSxxQkFBcUIsQ0FBQyxZQUFZLEVBQUUsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXZILFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVyRSxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUU5Rix5RUFBeUU7WUFDekUsMkVBQTJFO1lBQzNFLHdFQUF3RTtZQUN4RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3hELEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxFQUFFLENBQUM7b0JBQzFCLElBQUksS0FBSyxDQUFDLEVBQUUsMENBQWtDLEVBQUUsQ0FBQzt3QkFDaEQsU0FBUztvQkFDVixDQUFDO29CQUVELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDaEQsSUFBSSxHQUFHLEVBQUUsQ0FBQzt3QkFDVCxHQUFHLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztvQkFDdkMsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO29CQUN2QyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDL0IsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQ3ZCLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUMxQixJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsRUFDakQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQzdDLGFBQUssQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLCtEQUFpQyxDQUFDLENBQ3pILENBQUMsR0FBRyxFQUFFO2dCQUNOLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO29CQUN2QyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDL0IsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLDRDQUFxQixDQUFDLDhCQUE4QixDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUN2RixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN4QyxNQUFNLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2xFLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsQ0FBQztvQkFDL0MsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDL0UsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDO29CQUM5QixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzNGLEtBQUssTUFBTSxFQUFFLEVBQUUsRUFBRSxJQUFJLGdCQUFnQixFQUFFLENBQUM7b0JBQ3ZDLE1BQU0sVUFBVSxHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDbEQsSUFBSSxVQUFVLEVBQUUsQ0FBQzt3QkFDaEIsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxVQUFVLENBQUMscUJBQXFCLEVBQUUsQ0FBQzt3QkFDL0QsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQzs0QkFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7d0JBQ2xDLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxrQkFBa0I7UUFDWCx1QkFBdUIsQ0FBQyxPQUFxQjtZQUNuRCxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNuQixDQUFDO1FBRUQsa0JBQWtCO1FBQ1gsZUFBZSxDQUFDLFFBQWE7WUFDbkMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU8sSUFBSSxpQkFBaUIsRUFBRSxDQUFDO1lBQ2hDLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsRCxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsVUFBVSxLQUFLLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsb0JBQW9CLEtBQUssU0FBUyxJQUFJLE1BQU0sQ0FBQyxvQkFBb0IsS0FBSyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUM1SixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDckIsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxrQkFBa0I7UUFDWCx3QkFBd0IsQ0FBQyxRQUFhLEVBQUUsTUFBYztZQUM1RCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLG1CQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFlBQVksaUJBQWlCLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzdILElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDakIsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELCtFQUErRTtZQUMvRSxPQUFPLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztRQUNwRSxDQUFDO1FBRU8sVUFBVTtZQUNqQixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRUQ7O1dBRUc7UUFDSyxnQkFBZ0IsQ0FBQyxLQUFpQjtZQUN6QyxNQUFNLGFBQWEsR0FBRyxJQUFBLHVDQUF1QixFQUFDLElBQUksQ0FBQyxvQkFBb0IsZ0VBQWtDLENBQUM7WUFDMUcsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNwQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkQsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLEVBQUUsb0JBQW9CLEtBQUssS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ2hGLE1BQU0sZUFBZSxHQUFHLE1BQU0sRUFBRSxLQUFLLElBQUksSUFBSSxpQkFBaUIsRUFBRSxDQUFDO1lBRWpFLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDekQsTUFBTSxjQUFjLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO2dCQUMvQyxNQUFNLGNBQWMsR0FBRyxJQUFJLG9DQUFlLEVBQXlHLENBQUM7Z0JBQ3BKLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN4RSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDdEIsU0FBUztvQkFDVixDQUFDO29CQUVELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQy9ELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQztvQkFDN0MsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRSxDQUFDO2dCQUVELEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQztvQkFDcEQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7b0JBQy9CLElBQUksUUFBUSxHQUFHLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFFbkYsMERBQTBEO29CQUMxRCxJQUFJLFFBQVEsSUFBSSxpQkFBaUIsSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLGVBQWUsS0FBSyxJQUFJLEVBQUUsQ0FBQzt3QkFDdEcsUUFBUSxHQUFHLFNBQVMsQ0FBQztvQkFDdEIsQ0FBQztvQkFFRCxJQUFJLFFBQVEsRUFBRSxDQUFDO3dCQUNkLElBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLEVBQUUsQ0FBQzs0QkFDbkQsUUFBUSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUNsRixDQUFDO3dCQUNELGNBQWMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ2xDLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxjQUFjLENBQUMsT0FBTyxDQUFDLEtBQUs7NEJBQzNCLENBQUMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHNCQUFzQixFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsS0FBSyxDQUFDOzRCQUMvRixDQUFDLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7b0JBQ2pJLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO2dCQUN2QyxJQUFJLElBQUEsdUNBQXVCLEVBQUMsSUFBSSxDQUFDLG9CQUFvQixvRUFBb0MsRUFBRSxDQUFDO29CQUMzRixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO2dCQUN2SixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFDeEgsQ0FBQztnQkFFRCxNQUFNLGVBQWUsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO2dCQUMxQyxLQUFLLE1BQU0sVUFBVSxJQUFJLGNBQWMsRUFBRSxDQUFDO29CQUN6QyxJQUFJLFVBQVUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7d0JBQzFCLFVBQVUsQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDaEgsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNwQyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsS0FBSyxNQUFNLFVBQVUsSUFBSSxlQUFlLEVBQUUsQ0FBQztvQkFDMUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQ3pDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzFDLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFO29CQUNuQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7b0JBQzNCLG9CQUFvQixFQUFFLE1BQU0sRUFBRSxvQkFBb0I7b0JBQ2xELEtBQUssRUFBRSxjQUFjO2lCQUNyQixDQUFDLENBQUM7Z0JBRUgsT0FBTyxjQUFjLENBQUM7WUFDdkIsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLGNBQWMsSUFBSSxlQUFlLENBQUM7UUFDMUMsQ0FBQztRQUVPLDBCQUEwQixDQUFDLFVBQXVCLEVBQUUsWUFBeUIsRUFBRSxNQUFjLEVBQUUsZUFBa0MsRUFBRSxLQUFpQixFQUFFLGNBQWlDO1lBQzlMLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLElBQUksVUFBVSxZQUFZLDJCQUFjLEVBQUUsQ0FBQztnQkFDckYsS0FBSyxNQUFNLElBQUksSUFBSSxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3JDLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO3dCQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxNQUFNLEVBQUUsQ0FBQzs0QkFDL0UsTUFBTSxVQUFVLEdBQUcsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHFCQUFxQixFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7NEJBQ3pJLGNBQWMsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ3ZDLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2dCQUVELEtBQUssTUFBTSxJQUFJLElBQUksVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNyQyxLQUFLLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQzt3QkFDM0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDakMsMEVBQTBFO3dCQUMxRSxLQUFLLE1BQU0sSUFBSSxJQUFJLCtEQUErQyxFQUFFLENBQUM7NEJBQ3BFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dDQUNoRCxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUM1QixJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssTUFBTSxFQUFFLENBQUM7b0NBQ2pHLFNBQVM7Z0NBQ1YsQ0FBQztnQ0FFRCw2REFBNkQ7Z0NBQzdELGtFQUFrRTtnQ0FDbEUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDO2dDQUM5QyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29DQUM3QixNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxFQUFFLElBQUEseUJBQVksRUFBQzt3Q0FDbkksSUFBSSx3Q0FBZ0M7d0NBQ3BDLFlBQVksRUFBRSxDQUFDO3dDQUNmLFNBQVMsRUFBRSxNQUFNO3dDQUNqQixRQUFRLEVBQUUsVUFBVSxDQUFDLEVBQUU7d0NBQ3ZCLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUs7cUNBQzFCLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQ0FFWCxjQUFjLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29DQUN0QyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dDQUN4QixDQUFDOzRCQUNGLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUFyUVksNERBQXdCO3VDQUF4Qix3QkFBd0I7UUEyQmxDLFdBQUEsc0NBQWtCLENBQUE7UUFDbEIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDBCQUFZLENBQUE7UUFDWixXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxxQkFBYSxDQUFBO09BaENILHdCQUF3QixDQXFRcEM7SUFFTSxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLHNCQUFVO1FBQ2pEOztXQUVHO1FBQ0ksTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUNwQyxPQUFPLE1BQU0sQ0FBQyxlQUFlLDZFQUF1RCxDQUFDO1FBQ3RGLENBQUM7UUFFRCxJQUFXLFVBQVUsS0FBSyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBTXBELFlBQ2tCLE1BQW1CLEVBQ2hCLGlCQUFzRCxFQUM1RCxXQUEwQyxFQUM1QixXQUF3RCxFQUMvRCxrQkFBd0Q7WUFFN0UsS0FBSyxFQUFFLENBQUM7WUFOUyxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBQ0Msc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUMzQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNYLGdCQUFXLEdBQVgsV0FBVyxDQUE0QjtZQUM5Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBUjdELG1CQUFjLEdBQUcsSUFBSSw2QkFBaUIsRUFBNkIsQ0FBQztZQUNwRSxpQkFBWSxHQUFHLElBQUksNkJBQWlCLEVBQTJCLENBQUM7WUFXaEYsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMseUJBQXlCLEVBQUUscUJBQXFCLENBQUMsWUFBWSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFL0gsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRTtnQkFDM0MsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ3RCLFdBQVcsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFdBQVcsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDMUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQzFDLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDbkcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUM5QixPQUFPO29CQUNSLENBQUM7b0JBRUQsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQzNELEtBQUssTUFBTSxFQUFFLEVBQUUsRUFBRSxJQUFJLGdCQUFnQixFQUFFLENBQUM7d0JBQ3ZDLElBQUssS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQWlDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ2xFLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7NEJBQzFCLE9BQU87d0JBQ1IsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDM0YsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNqQyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsTUFBTSxrQkFBa0IsR0FBRyxXQUFXLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDekUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDO29CQUM5QixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFDdEIsS0FBSyxNQUFNLE1BQU0sSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2hDLE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7d0JBQzdHLEtBQUssTUFBTSxFQUFFLEVBQUUsRUFBRSxJQUFJLGdCQUFnQixFQUFFLENBQUM7NEJBQ3ZDLE1BQU0sVUFBVSxHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQzs0QkFDbEQsSUFBSSxVQUFVLFlBQVkscUJBQXFCLEVBQUUsQ0FBQztnQ0FDakQsV0FBVyxDQUFDLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQzs0QkFDN0QsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLG1CQUFtQixHQUFHLEdBQUcsRUFBRTtnQkFDaEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsbUNBQW1DLEVBQUUsTUFBTSxDQUFDLFNBQVMsa0NBQXlCLENBQUMsQ0FBQztnQkFDcEksSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsaUNBQWlDLEVBQUUsR0FBRyxNQUFNLENBQUMsU0FBUyxnQ0FBdUIsSUFBSSxDQUFDLENBQUM7WUFDeEksQ0FBQyxDQUFDO1lBQ0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3pELElBQUksQ0FBQyxDQUFDLFVBQVUsa0NBQXlCLEVBQUUsQ0FBQztvQkFDM0MsbUJBQW1CLEVBQUUsQ0FBQztnQkFDdkIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixtQkFBbUIsRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFFTyxXQUFXLENBQUMsR0FBUztZQUM1QixRQUFRLEdBQUcsSUFBSSxJQUFBLHlCQUFZLEVBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUM7Z0JBQ3hDO29CQUNDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxHQUFHLElBQUkseUJBQXlCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUN2RSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUMxQixNQUFNO2dCQUNQO29CQUNDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQzVCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxHQUFHLElBQUksdUJBQXVCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNuRSxNQUFNO2dCQUNQO29CQUNDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQzVCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDNUIsQ0FBQztZQUVELElBQUksc0JBQXNCLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUNqRSxHQUFHLEdBQUcsU0FBUyxDQUFDO1lBQ2pCLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQztZQUV2QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ1YsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUV0QyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNYLElBQUksS0FBSyxFQUFFLE1BQU0sS0FBSyxJQUFJLElBQUEseUJBQVcsRUFBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDOUYsc0VBQXNFO29CQUN0RSxzRUFBc0U7b0JBQ3RFLHNEQUFzRDtvQkFDdEQsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLEdBQUcsRUFBRSxDQUFDO3dCQUM5QixNQUFNO29CQUNQLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDTixDQUFDO0tBQ0QsQ0FBQTtJQTFIWSxnREFBa0I7aUNBQWxCLGtCQUFrQjtRQWdCNUIsV0FBQSxzQ0FBa0IsQ0FBQTtRQUNsQixXQUFBLDBCQUFZLENBQUE7UUFDWixXQUFBLCtDQUEwQixDQUFBO1FBQzFCLFdBQUEsaUNBQW1CLENBQUE7T0FuQlQsa0JBQWtCLENBMEg5QjtJQUVELE1BQU0sYUFBYSxHQUFHLENBQUMsYUFBcUIsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNqRCxlQUFlLEVBQUUsYUFBYSxDQUFDLGVBQWU7UUFDOUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxlQUFlO1FBQzVDLFdBQVcsRUFBRSxhQUFhLENBQUMsV0FBVztRQUN0QyxTQUFTLEVBQUUsYUFBYSxDQUFDLFdBQVc7S0FDcEMsQ0FBQyxDQUFDO0lBRUgsTUFBTSx1QkFBdUIsR0FBRyxDQUFDLEtBQStDLEVBQUUsTUFBK0MsRUFBRSxPQUFnQixFQUF5QixFQUFFO1FBQzdLLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25DLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsNkRBQTZELENBQUMsQ0FBQztRQUNoRixDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2QsT0FBTyxFQUFFLEtBQUssRUFBRSxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUUsT0FBTyxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUUsRUFBRSxDQUFDO1FBQzVHLENBQUM7UUFFRCxJQUFJLGFBQWEsZ0NBQXdCLENBQUM7UUFDMUMsTUFBTSxpQkFBaUIsR0FBYSxFQUFFLENBQUM7UUFDdkMsSUFBSSxrQkFBc0MsQ0FBQztRQUMzQyxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDcEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sS0FBSyxHQUFHLFVBQVUsRUFBRSxhQUFhLGlDQUF5QixDQUFDO1lBQ2pFLElBQUksaUJBQWlCLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBRSxDQUFDO2dCQUNuQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBQSwrQkFBbUIsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLENBQUM7WUFDRCxhQUFhLEdBQUcsSUFBQSwyQkFBVyxFQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsRCxPQUFPLEdBQUcsT0FBTyxJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDO1lBQzNDLElBQUksQ0FBQyxrQkFBa0IsSUFBSSxVQUFVLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDM0Usa0JBQWtCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDdEMsQ0FBQztRQUNGLENBQUM7UUFFRCxNQUFNLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUN4RSxNQUFNLElBQUksR0FBRyxhQUFhLGtDQUEwQjtZQUNuRCxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMseUJBQWlCLENBQUMsQ0FBQyxDQUFDLHNCQUFjLENBQUM7WUFDekQsQ0FBQyxDQUFDLDRCQUFvQixDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUUsQ0FBQztRQUU1QyxJQUFJLFlBQXlDLENBQUM7UUFFOUMsSUFBSSxvQkFBb0IsR0FBRyxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxvQkFBb0IsQ0FBQztRQUM5RSxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ2Isb0JBQW9CLElBQUksVUFBVSxDQUFDO1FBQ3BDLENBQUM7UUFFRCxPQUFPO1lBQ04sS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLLENBQUM7WUFDM0IsT0FBTyxFQUFFO2dCQUNSLFdBQVcsRUFBRSxxQkFBcUI7Z0JBQ2xDLGVBQWUsRUFBRSxJQUFJO2dCQUNyQixJQUFJLFlBQVk7b0JBQ2YsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUNuQixNQUFNLFFBQVEsR0FBRyxZQUFZLEdBQUcsSUFBSSw0QkFBYyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO3dCQUM1RyxJQUFJLGtCQUFrQixFQUFFLENBQUM7NEJBQ3hCLE1BQU0sSUFBSSxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDdEUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLGtDQUFrQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO3dCQUN2SCxDQUFDO29CQUNGLENBQUM7b0JBRUQsT0FBTyxZQUFZLENBQUM7Z0JBQ3JCLENBQUM7Z0JBQ0QsV0FBVyxFQUFFLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFO2dCQUM1QyxvQkFBb0I7Z0JBQ3BCLFVBQVUsNERBQW9EO2dCQUM5RCxNQUFNLEVBQUUsS0FBSzthQUNiO1NBQ0QsQ0FBQztJQUNILENBQUMsQ0FBQztJQUVGLElBQVcscUJBR1Y7SUFIRCxXQUFXLHFCQUFxQjtRQUMvQixpRUFBd0MsQ0FBQTtRQUN4QyxxRUFBNEMsQ0FBQTtJQUM3QyxDQUFDLEVBSFUscUJBQXFCLEtBQXJCLHFCQUFxQixRQUcvQjtJQUVELE1BQWUsc0JBQXNCO1FBU3BDLFlBQTZCLE1BQW1CO1lBQW5CLFdBQU0sR0FBTixNQUFNLENBQWE7WUFSaEQsa0JBQWtCO1lBQ0Ysd0JBQW1CLEdBQUcsS0FBSyxDQUFDO1lBQzVDLGtCQUFrQjtZQUNGLHNCQUFpQixHQUFHLElBQUksQ0FBQztZQUV4QixhQUFRLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUl6QyxjQUFjLENBQUMsR0FBRyxFQUFFO2dCQUNuQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sWUFBWTtZQUNuQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsd0NBQStCLENBQUM7WUFDcEUsSUFBSSxNQUFjLENBQUM7WUFDbkIsSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxnQ0FBdUIsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ25FLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsa0NBQXlCLENBQUM7WUFDekQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sR0FBRyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsa0NBQXlCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLGdDQUF1QixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEksQ0FBQztZQUVELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxnQ0FBdUIsQ0FBQztZQUNwRSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQzNCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQztZQUN0QyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxHQUFHLFFBQVEsSUFBSSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLFNBQVMsa0VBQWdDLEdBQUcsQ0FBQztZQUNyRSxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixHQUFHLFNBQVMsc0VBQWtDLEdBQUcsQ0FBQztZQUVoRixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLENBQUMsS0FBSyxDQUFDO1lBQy9ELGNBQWMsQ0FBQyxXQUFXLHFFQUFtQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsMENBQWlDLElBQUksU0FBUyxDQUFDLENBQUM7WUFDbEksY0FBYyxDQUFDLFdBQVcseUVBQXFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBRW5HLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUN0QyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDckIsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7Z0JBRUQsSUFBSSxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDO29CQUNsQyxlQUFlLEVBQUUsQ0FBQztvQkFDbEIsV0FBVyxtREFBa0M7b0JBQzdDLE9BQU8sRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztvQkFDdEMsVUFBVSxFQUFFLEVBQUU7aUJBQ2QsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBS0Qsa0JBQWtCO1FBQ1gsVUFBVTtZQUNoQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVELGtCQUFrQjtRQUNYLE9BQU87WUFDYixJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDdEMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ3JCLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxrQkFBa0I7UUFDWCxXQUFXO1lBQ2pCLE9BQU87Z0JBQ04sUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFO2dCQUN0QyxVQUFVLEVBQUUsK0NBQXVDO2FBQ25ELENBQUM7UUFDSCxDQUFDO0tBR0Q7SUFFRCxNQUFNLHlCQUEwQixTQUFRLHNCQUFzQjtRQUN0RCxLQUFLO1lBQ1gsT0FBTyxxQkFBcUIsQ0FBQztRQUM5QixDQUFDO1FBRWtCLE9BQU87WUFDekIsT0FBTyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMvQyxDQUFDO0tBQ0Q7SUFHRCxNQUFNLHVCQUF3QixTQUFRLHNCQUFzQjtRQUNwRCxLQUFLO1lBQ1gsT0FBTyxtQkFBbUIsQ0FBQztRQUM1QixDQUFDO1FBRWtCLE9BQU87WUFDekIsT0FBTyxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDM0MsQ0FBQztLQUNEO0lBRUQsSUFBZSxpQkFBaUIsR0FBaEMsTUFBZSxpQkFBaUI7UUFJL0IsSUFBVyxJQUFJO1lBQ2QsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQztRQUNwRCxDQUFDO1FBRUQsSUFBVyxPQUFPO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBS0QsWUFDVyxLQUdQLEVBQ0ssT0FBZ0IsRUFDTCxLQUFpQixFQUNoQixpQkFBc0QsRUFDNUQsV0FBNEMsRUFDckMsa0JBQTBELEVBQzlELGNBQWtELEVBQzVDLG9CQUE4RCxFQUNoRSxrQkFBMEQsRUFDM0QsaUJBQXdELEVBQzlELFdBQTRDO1lBYmhELFVBQUssR0FBTCxLQUFLLENBR1o7WUFDSyxZQUFPLEdBQVAsT0FBTyxDQUFTO1lBQ0wsVUFBSyxHQUFMLEtBQUssQ0FBWTtZQUNDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDekMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMzQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDekIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM3Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3hDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDM0MsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUE1QjNELGtCQUFrQjtZQUNYLE9BQUUsR0FBRyxFQUFFLENBQUM7WUE2QmQsSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUNuRSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQy9HLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLEdBQUcsSUFBSSw0QkFBYyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQ2hILENBQUM7UUFFRCxrQkFBa0I7UUFDWCxLQUFLLENBQUMsQ0FBb0I7WUFDaEMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksZ0RBQXdDO21CQUNyRCxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEtBQUssaUJBQWlCO2dCQUN4RCx3Q0FBd0M7bUJBQ3JDLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVzttQkFDbkIsc0JBQVcsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFDdEQsQ0FBQztnQkFDRixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUN2QyxRQUFRLElBQUEsdUNBQXVCLEVBQUMsSUFBSSxDQUFDLG9CQUFvQixzRkFBNkMsRUFBRSxDQUFDO2dCQUN4RztvQkFDQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN4QixNQUFNO2dCQUNQO29CQUNDLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsa0NBQTBCLENBQUMsbUNBQTJCLENBQUMsQ0FBQztvQkFDdEYsTUFBTTtnQkFDUDtvQkFDQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLG9DQUE0QixDQUFDLHNDQUE4QixDQUFDLENBQUM7b0JBQzNGLE1BQU07Z0JBQ1AsOENBQWtDO2dCQUNsQztvQkFDQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLG9DQUE0QixDQUFDLGlDQUF5QixDQUFDLENBQUM7b0JBQ3RGLE1BQU07WUFDUixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQ7OztXQUdHO1FBQ0ksY0FBYyxDQUFDLFFBR25CLEVBQUUsT0FBZ0I7WUFDcEIsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDdkUsSUFBSSxPQUFPLEtBQUssSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFBLGVBQU0sRUFBQyxJQUFJLENBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxFQUFFLENBQUM7Z0JBQy9FLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEdBQUcsdUJBQXVCLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQztZQUNySSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLHVCQUF1QixHQUFHLElBQUksNEJBQWMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztZQUMvRyxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRDs7V0FFRztRQUNJLFNBQVMsQ0FBQyxNQUFjO1lBQzlCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssTUFBTSxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQU9TLE9BQU8sQ0FBQyxPQUE2QjtZQUM5QyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDO2dCQUNoQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3pDLEtBQUssRUFBRSxPQUFPO2FBQ2QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLGVBQWUsQ0FBQyxDQUFvQjtZQUMzQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvRixNQUFNLEVBQUUsZUFBZSxDQUE4QixrREFBMkIsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0YsQ0FBQztRQUVPLGNBQWM7WUFDckIsUUFBUSxJQUFBLHVDQUF1QixFQUFDLElBQUksQ0FBQyxvQkFBb0Isc0ZBQTZDLEVBQUUsQ0FBQztnQkFDeEc7b0JBQ0MsT0FBTyxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO2dCQUM1RTtvQkFDQyxPQUFPLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLG9EQUFvRCxDQUFDLENBQUM7Z0JBQ2xHO29CQUNDLE9BQU8sSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsZ0VBQWdFLENBQUMsQ0FBQztnQkFDakgsOENBQWtDO2dCQUNsQztvQkFDQyxPQUFPLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLGtEQUFrRCxDQUFDLENBQUM7WUFDL0YsQ0FBQztRQUNGLENBQUM7UUFFRDs7V0FFRztRQUNPLHlCQUF5QixDQUFDLElBQXNCLEVBQUUsVUFBMkI7WUFDdEYsTUFBTSxXQUFXLEdBQWMsRUFBRSxDQUFDO1lBQ2xDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV2RTtnQkFDQyxFQUFFLE1BQU0sa0NBQTBCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRTtnQkFDN0UsRUFBRSxNQUFNLG9DQUE0QixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLEVBQUU7Z0JBQ25GLEVBQUUsTUFBTSx1Q0FBK0IsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLG1CQUFtQixDQUFDLEVBQUU7YUFDaEcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO2dCQUMvQixJQUFJLFlBQVksR0FBRyxNQUFNLEVBQUUsQ0FBQztvQkFDM0IsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLGdCQUFNLENBQUMsa0JBQWtCLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUNsRixHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEUsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxZQUFZLHFEQUE0QyxFQUFFLENBQUM7Z0JBQzlELFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBTSxDQUFDLGtCQUFrQixFQUFFLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLDBCQUEwQixDQUFDLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDMUksTUFBTSxPQUFPLEdBQWdDLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztvQkFDdkksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNkLE9BQU87b0JBQ1IsQ0FBQztvQkFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDO3dCQUNqQyxPQUFPLEVBQUUsQ0FBQztnQ0FDVCxZQUFZLEVBQUUsT0FBTyxDQUFDLEtBQUs7Z0NBQzNCLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUztnQ0FDNUIsWUFBWSxFQUFFLE9BQU8sQ0FBQyxZQUFZO2dDQUNsQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQzs2QkFDMUIsQ0FBQztxQkFDRixDQUFDLENBQUM7Z0JBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFFRCxJQUFJLFVBQVUsSUFBSSxJQUFBLDZCQUFhLEVBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7Z0JBQzNELFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBTSxDQUFDLDRCQUE0QixFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUNySCxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixDQUFDO1lBRUQsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLGdCQUFNLENBQUMsdUJBQXVCLEVBQUUsSUFBQSxjQUFRLEVBQUMsYUFBYSxFQUFFLHlCQUF5QixDQUFDLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFDNUgsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztZQUN2RSxPQUFPLEVBQUUsTUFBTSxFQUFFLG1CQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsRUFBRSxPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDNUUsQ0FBQztRQUVPLHlCQUF5QixDQUFDLElBQXNCLEVBQUUsWUFBb0I7WUFDN0UsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxJQUFBLGtEQUF5QixFQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQzNHLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGdCQUFNLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRWhGLElBQUksQ0FBQztnQkFDSixNQUFNLE1BQU0sR0FBYyxFQUFFLENBQUM7Z0JBQzdCLE1BQU0sR0FBRyxHQUFHLElBQUEsbUNBQXFCLEVBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDaEYsSUFBQSwyREFBaUMsRUFBQyxJQUFJLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ2xGLE9BQU8sTUFBTSxDQUFDO1lBQ2YsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUEzTGMsaUJBQWlCO1FBc0I3QixXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEsMEJBQVksQ0FBQTtRQUNaLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSwwQkFBZSxDQUFBO1FBQ2YsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHdDQUFtQixDQUFBO1FBQ25CLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsWUFBQSxzQkFBWSxDQUFBO09BN0JBLGlCQUFpQixDQTJML0I7SUFXRCxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLGlCQUFpQjtRQUNyRCxZQUNDLEtBR0csRUFDSCxPQUFnQixFQUNoQixLQUFpQixFQUNHLGlCQUFxQyxFQUMzQyxXQUF5QixFQUNsQixrQkFBdUMsRUFDM0MsY0FBK0IsRUFDekIsb0JBQTJDLEVBQzdDLGtCQUF1QyxFQUN4QyxpQkFBcUMsRUFDM0MsV0FBeUIsRUFDRixpQkFBcUM7WUFFMUUsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsb0JBQW9CLEVBQUUsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFGdEksc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtRQUczRSxDQUFDO1FBRWUscUJBQXFCO1lBQ3BDLE1BQU0sVUFBVSxHQUFjLEVBQUUsQ0FBQztZQUVqQztnQkFDQyxFQUFFLE1BQU0sa0NBQTBCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxlQUFlLENBQUMsRUFBRTtnQkFDdEYsRUFBRSxNQUFNLHVDQUErQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSw2QkFBNkIsQ0FBQyxFQUFFO2dCQUN2SCxFQUFFLE1BQU0sb0NBQTRCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLGlCQUFpQixDQUFDLEVBQUU7YUFDNUYsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDbEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUM7Z0JBQ3pHLElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ1osVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLGdCQUFNLENBQUMscUJBQXFCLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoSCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBaUIsRUFBRSxDQUFDLENBQUM7Z0JBQzlELFlBQVksRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLO2dCQUN0QyxRQUFRO2dCQUNSLE1BQU0sRUFBRSxlQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVE7YUFDNUQsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLGlCQUFpQixHQUFHLENBQUMsS0FBdUIsRUFBRSxFQUFFO2dCQUNyRCxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztnQkFDN0MsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDMUIsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pGLENBQUM7Z0JBRUQsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDL0QsQ0FBQyxDQUFDO1lBRUYsSUFBSSxTQUFTLEVBQUUsU0FBUyxHQUFHLElBQUksQ0FBQztZQUNoQyxPQUFPLENBQUMsU0FBUyxHQUFHLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUN2RSxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUNsQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDckIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQzt3QkFDbkYsUUFBUSxDQUFDLFlBQVksR0FBRyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQzt3QkFDM0UsUUFBUSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztvQkFDNUMsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLFNBQVMsR0FBRyxLQUFLLENBQUM7b0JBQ25CLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN2QixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ2hDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDaEMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6RSxDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sVUFBVSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3pDLElBQUksWUFBWSxHQUFjLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO2dCQUMxRSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ25GLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3hCLE9BQU8sSUFBSSx1QkFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFBLHVCQUFVLEVBQUMsWUFBWSxDQUFDLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlGLENBQUMsQ0FBQyxDQUFDO1lBR0gsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQztZQUM1RCxJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDbEIsWUFBWSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLG9CQUFvQixDQUFDLENBQUM7Z0JBQzNELFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBTSxDQUMzQix5QkFBeUIsRUFDekIsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUUsUUFBUSxDQUFDLEVBQzVELFNBQVMsRUFDVCxTQUFTLEVBQ1QsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FDaEMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELE9BQU8sRUFBRSxNQUFNLEVBQUUsbUJBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztRQUNsRyxDQUFDO1FBRU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUEwQjtZQUNsRCxNQUFNLE1BQU0sR0FBRyxDQUEyQixLQUFVLEVBQUUsS0FBYSxFQUFFLEVBQUUsQ0FBQyxJQUFJLE9BQU8sQ0FBZ0IsT0FBTyxDQUFDLEVBQUU7Z0JBQzVHLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLEVBQUssQ0FBQztnQkFDekQsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2dCQUNuQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtvQkFDbkIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNuQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2hCLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFO29CQUNyQixPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMvQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2hCLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNiLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQ3hCLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQzFILElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLHNCQUFzQixDQUFDLENBQ25ELENBQUM7WUFFRixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkUsSUFBSSxDQUFDO2dCQUNKLENBQUMsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUNuRCxDQUFDO29CQUFTLENBQUM7Z0JBQ1YsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ25CLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQTVISyxzQkFBc0I7UUFRekIsV0FBQSxzQ0FBa0IsQ0FBQTtRQUNsQixXQUFBLDBCQUFZLENBQUE7UUFDWixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsMEJBQWUsQ0FBQTtRQUNmLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSx3Q0FBbUIsQ0FBQTtRQUNuQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFlBQUEsc0JBQVksQ0FBQTtRQUNaLFlBQUEsK0JBQWtCLENBQUE7T0FoQmYsc0JBQXNCLENBNEgzQjtJQUVELElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsaUJBQWlCO1FBQ3RELFlBQ0MsSUFBbUMsRUFDbkMsVUFBc0MsRUFDdEMsS0FBaUIsRUFDakIsT0FBZ0IsRUFDSSxpQkFBcUMsRUFDM0MsV0FBeUIsRUFDdEIsY0FBK0IsRUFDM0Isa0JBQXVDLEVBQ3JDLG9CQUEyQyxFQUM3QyxZQUFpQyxFQUNsQyxpQkFBcUMsRUFDM0MsV0FBeUI7WUFFdkMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsb0JBQW9CLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3ZMLENBQUM7UUFFUSxxQkFBcUI7WUFDN0IsT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNyRixDQUFDO0tBQ0QsQ0FBQTtJQXJCSyx1QkFBdUI7UUFNMUIsV0FBQSxzQ0FBa0IsQ0FBQTtRQUNsQixXQUFBLDBCQUFZLENBQUE7UUFDWixXQUFBLDBCQUFlLENBQUE7UUFDZixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSx3Q0FBbUIsQ0FBQTtRQUNuQixZQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFlBQUEsc0JBQVksQ0FBQTtPQWJULHVCQUF1QixDQXFCNUI7SUFFRCxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUM7SUFFaEMsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBcUI7O2lCQUNILG9CQUFlLEdBQUcsNkJBQTZCLEFBQWhDLENBQWlDO2lCQUNoRCxpQkFBWSxHQUFHLGVBQWUsSUFBQSxtQkFBWSxHQUFFLEVBQUUsQUFBbEMsQ0FBbUM7UUFVdEUsWUFDaUIsV0FBeUIsRUFDeEIsVUFBMkIsRUFDNUMsU0FBcUIsRUFDRCxVQUErQyxFQUMvQyxhQUFpQztZQUpyQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN4QixlQUFVLEdBQVYsVUFBVSxDQUFpQjtZQUVQLGVBQVUsR0FBVixVQUFVLENBQW9CO1lBWjdELE9BQUUsR0FBRyxFQUFFLENBQUM7WUFNRSxtQkFBYyxHQUFHLGlDQUFpQyxJQUFBLG1CQUFZLEdBQUUsRUFBRSxDQUFDO1lBU25GLElBQUksQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVMsQ0FBQztZQUN0QyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQztZQUNoRCxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDO1lBQ2xDLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUM7WUFFcEMsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLHdCQUF3QixDQUFDLHVCQUFxQixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRyxPQUFPLENBQUMsWUFBWSxHQUFHLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSw0QkFBYyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFDeEcsT0FBTyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyw2REFBNkQ7WUFDbEYsT0FBTyxDQUFDLFNBQVMsR0FBRyxtQ0FBbUMsUUFBUSxFQUFFLENBQUM7WUFDbEUsT0FBTyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDM0IsT0FBTyxDQUFDLFVBQVUsNkRBQXFELENBQUM7WUFDeEUsT0FBTyxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQztZQUVyQyxJQUFJLFVBQVUsR0FBRyxJQUFBLDhDQUF1QixFQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDNUUsSUFBSSxVQUFVLENBQUMsTUFBTSxHQUFHLHlCQUF5QixFQUFFLENBQUM7Z0JBQ25ELFVBQVUsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSx5QkFBeUIsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7WUFDdkUsQ0FBQztZQUVELE9BQU8sQ0FBQyxLQUFLLEdBQUc7Z0JBQ2YsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVTtnQkFDbkMsZUFBZSxFQUFFLDREQUE0RCxRQUFRLElBQUksSUFBSSxDQUFDLGNBQWMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLHVDQUF1QyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7YUFDM0ssQ0FBQztZQUNGLE9BQU8sQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBRS9CLE1BQU0sVUFBVSxHQUFHLFFBQVEsa0NBQTBCO2dCQUNwRCxDQUFDLENBQUMsd0NBQWtCO2dCQUNwQixDQUFDLENBQUMsdUNBQWlCLENBQUM7WUFFckIsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxDQUFDLGFBQWEsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFBLCtCQUFnQixFQUFDLFVBQVUsQ0FBQyxFQUFFLFFBQVEsRUFBRSx5QkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNwRyxDQUFDO1lBRUQsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNoRixNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUM7WUFDN0UsSUFBSSxDQUFDLGdCQUFnQixHQUFHO2dCQUN2QixPQUFPO2dCQUNQLEtBQUssRUFBRTtvQkFDTixlQUFlLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsZUFBZTtvQkFDcEQsV0FBVyxFQUFFLE1BQU07b0JBQ25CLFNBQVMsRUFBRSxNQUFNO29CQUNqQixhQUFhLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsZUFBZTtpQkFDbEQ7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUssQ0FBQyxDQUFvQjtZQUN6QixJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztnQkFDL0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxxQkFBcUI7WUFDcEIsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQzNDLENBQUM7O0lBbEZJLHFCQUFxQjtRQWdCeEIsV0FBQSxzQ0FBa0IsQ0FBQTtRQUNsQixXQUFBLHNDQUFrQixDQUFBO09BakJmLHFCQUFxQixDQW1GMUIifQ==