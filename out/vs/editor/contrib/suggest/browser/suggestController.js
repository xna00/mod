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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/keybindings", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/stopwatch", "vs/base/common/types", "vs/editor/browser/stableEditorScroll", "vs/editor/browser/editorExtensions", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/snippet/browser/snippetParser", "vs/editor/contrib/suggest/browser/suggestMemory", "vs/editor/contrib/suggest/browser/wordContextKey", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "./suggest", "./suggestAlternatives", "./suggestCommitCharacters", "./suggestModel", "./suggestOvertypingCapturer", "./suggestWidget", "vs/platform/telemetry/common/telemetry", "vs/base/common/resources", "vs/base/common/hash", "vs/base/browser/dom", "vs/editor/common/model/textModel"], function (require, exports, aria_1, arrays_1, cancellation_1, errors_1, event_1, keybindings_1, lifecycle_1, platform, stopwatch_1, types_1, stableEditorScroll_1, editorExtensions_1, editOperation_1, position_1, range_1, editorContextKeys_1, snippetController2_1, snippetParser_1, suggestMemory_1, wordContextKey_1, nls, commands_1, contextkey_1, instantiation_1, log_1, suggest_1, suggestAlternatives_1, suggestCommitCharacters_1, suggestModel_1, suggestOvertypingCapturer_1, suggestWidget_1, telemetry_1, resources_1, hash_1, dom_1, textModel_1) {
    "use strict";
    var SuggestController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TriggerSuggestAction = exports.SuggestController = void 0;
    // sticky suggest widget which doesn't disappear on focus out and such
    const _sticky = false;
    class LineSuffix {
        constructor(_model, _position) {
            this._model = _model;
            this._position = _position;
            this._decorationOptions = textModel_1.ModelDecorationOptions.register({
                description: 'suggest-line-suffix',
                stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */
            });
            // spy on what's happening right of the cursor. two cases:
            // 1. end of line -> check that it's still end of line
            // 2. mid of line -> add a marker and compute the delta
            const maxColumn = _model.getLineMaxColumn(_position.lineNumber);
            if (maxColumn !== _position.column) {
                const offset = _model.getOffsetAt(_position);
                const end = _model.getPositionAt(offset + 1);
                _model.changeDecorations(accessor => {
                    if (this._marker) {
                        accessor.removeDecoration(this._marker);
                    }
                    this._marker = accessor.addDecoration(range_1.Range.fromPositions(_position, end), this._decorationOptions);
                });
            }
        }
        dispose() {
            if (this._marker && !this._model.isDisposed()) {
                this._model.changeDecorations(accessor => {
                    accessor.removeDecoration(this._marker);
                    this._marker = undefined;
                });
            }
        }
        delta(position) {
            if (this._model.isDisposed() || this._position.lineNumber !== position.lineNumber) {
                // bail out early if things seems fishy
                return 0;
            }
            // read the marker (in case suggest was triggered at line end) or compare
            // the cursor to the line end.
            if (this._marker) {
                const range = this._model.getDecorationRange(this._marker);
                const end = this._model.getOffsetAt(range.getStartPosition());
                return end - this._model.getOffsetAt(position);
            }
            else {
                return this._model.getLineMaxColumn(position.lineNumber) - position.column;
            }
        }
    }
    var InsertFlags;
    (function (InsertFlags) {
        InsertFlags[InsertFlags["None"] = 0] = "None";
        InsertFlags[InsertFlags["NoBeforeUndoStop"] = 1] = "NoBeforeUndoStop";
        InsertFlags[InsertFlags["NoAfterUndoStop"] = 2] = "NoAfterUndoStop";
        InsertFlags[InsertFlags["KeepAlternativeSuggestions"] = 4] = "KeepAlternativeSuggestions";
        InsertFlags[InsertFlags["AlternativeOverwriteConfig"] = 8] = "AlternativeOverwriteConfig";
    })(InsertFlags || (InsertFlags = {}));
    let SuggestController = class SuggestController {
        static { SuggestController_1 = this; }
        static { this.ID = 'editor.contrib.suggestController'; }
        static get(editor) {
            return editor.getContribution(SuggestController_1.ID);
        }
        constructor(editor, _memoryService, _commandService, _contextKeyService, _instantiationService, _logService, _telemetryService) {
            this._memoryService = _memoryService;
            this._commandService = _commandService;
            this._contextKeyService = _contextKeyService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._telemetryService = _telemetryService;
            this._lineSuffix = new lifecycle_1.MutableDisposable();
            this._toDispose = new lifecycle_1.DisposableStore();
            this._selectors = new PriorityRegistry(s => s.priority);
            this._onWillInsertSuggestItem = new event_1.Emitter();
            this.onWillInsertSuggestItem = this._onWillInsertSuggestItem.event;
            this.editor = editor;
            this.model = _instantiationService.createInstance(suggestModel_1.SuggestModel, this.editor);
            // default selector
            this._selectors.register({
                priority: 0,
                select: (model, pos, items) => this._memoryService.select(model, pos, items)
            });
            // context key: update insert/replace mode
            const ctxInsertMode = suggest_1.Context.InsertMode.bindTo(_contextKeyService);
            ctxInsertMode.set(editor.getOption(118 /* EditorOption.suggest */).insertMode);
            this._toDispose.add(this.model.onDidTrigger(() => ctxInsertMode.set(editor.getOption(118 /* EditorOption.suggest */).insertMode)));
            this.widget = this._toDispose.add(new dom_1.WindowIdleValue((0, dom_1.getWindow)(editor.getDomNode()), () => {
                const widget = this._instantiationService.createInstance(suggestWidget_1.SuggestWidget, this.editor);
                this._toDispose.add(widget);
                this._toDispose.add(widget.onDidSelect(item => this._insertSuggestion(item, 0 /* InsertFlags.None */), this));
                // Wire up logic to accept a suggestion on certain characters
                const commitCharacterController = new suggestCommitCharacters_1.CommitCharacterController(this.editor, widget, this.model, item => this._insertSuggestion(item, 2 /* InsertFlags.NoAfterUndoStop */));
                this._toDispose.add(commitCharacterController);
                // Wire up makes text edit context key
                const ctxMakesTextEdit = suggest_1.Context.MakesTextEdit.bindTo(this._contextKeyService);
                const ctxHasInsertAndReplace = suggest_1.Context.HasInsertAndReplaceRange.bindTo(this._contextKeyService);
                const ctxCanResolve = suggest_1.Context.CanResolve.bindTo(this._contextKeyService);
                this._toDispose.add((0, lifecycle_1.toDisposable)(() => {
                    ctxMakesTextEdit.reset();
                    ctxHasInsertAndReplace.reset();
                    ctxCanResolve.reset();
                }));
                this._toDispose.add(widget.onDidFocus(({ item }) => {
                    // (ctx: makesTextEdit)
                    const position = this.editor.getPosition();
                    const startColumn = item.editStart.column;
                    const endColumn = position.column;
                    let value = true;
                    if (this.editor.getOption(1 /* EditorOption.acceptSuggestionOnEnter */) === 'smart'
                        && this.model.state === 2 /* State.Auto */
                        && !item.completion.additionalTextEdits
                        && !(item.completion.insertTextRules & 4 /* CompletionItemInsertTextRule.InsertAsSnippet */)
                        && endColumn - startColumn === item.completion.insertText.length) {
                        const oldText = this.editor.getModel().getValueInRange({
                            startLineNumber: position.lineNumber,
                            startColumn,
                            endLineNumber: position.lineNumber,
                            endColumn
                        });
                        value = oldText !== item.completion.insertText;
                    }
                    ctxMakesTextEdit.set(value);
                    // (ctx: hasInsertAndReplaceRange)
                    ctxHasInsertAndReplace.set(!position_1.Position.equals(item.editInsertEnd, item.editReplaceEnd));
                    // (ctx: canResolve)
                    ctxCanResolve.set(Boolean(item.provider.resolveCompletionItem) || Boolean(item.completion.documentation) || item.completion.detail !== item.completion.label);
                }));
                this._toDispose.add(widget.onDetailsKeyDown(e => {
                    // cmd + c on macOS, ctrl + c on Win / Linux
                    if (e.toKeyCodeChord().equals(new keybindings_1.KeyCodeChord(true, false, false, false, 33 /* KeyCode.KeyC */)) ||
                        (platform.isMacintosh && e.toKeyCodeChord().equals(new keybindings_1.KeyCodeChord(false, false, false, true, 33 /* KeyCode.KeyC */)))) {
                        e.stopPropagation();
                        return;
                    }
                    if (!e.toKeyCodeChord().isModifierKey()) {
                        this.editor.focus();
                    }
                }));
                return widget;
            }));
            // Wire up text overtyping capture
            this._overtypingCapturer = this._toDispose.add(new dom_1.WindowIdleValue((0, dom_1.getWindow)(editor.getDomNode()), () => {
                return this._toDispose.add(new suggestOvertypingCapturer_1.OvertypingCapturer(this.editor, this.model));
            }));
            this._alternatives = this._toDispose.add(new dom_1.WindowIdleValue((0, dom_1.getWindow)(editor.getDomNode()), () => {
                return this._toDispose.add(new suggestAlternatives_1.SuggestAlternatives(this.editor, this._contextKeyService));
            }));
            this._toDispose.add(_instantiationService.createInstance(wordContextKey_1.WordContextKey, editor));
            this._toDispose.add(this.model.onDidTrigger(e => {
                this.widget.value.showTriggered(e.auto, e.shy ? 250 : 50);
                this._lineSuffix.value = new LineSuffix(this.editor.getModel(), e.position);
            }));
            this._toDispose.add(this.model.onDidSuggest(e => {
                if (e.triggerOptions.shy) {
                    return;
                }
                let index = -1;
                for (const selector of this._selectors.itemsOrderedByPriorityDesc) {
                    index = selector.select(this.editor.getModel(), this.editor.getPosition(), e.completionModel.items);
                    if (index !== -1) {
                        break;
                    }
                }
                if (index === -1) {
                    index = 0;
                }
                if (this.model.state === 0 /* State.Idle */) {
                    // selecting an item can "pump" out selection/cursor change events
                    // which can cancel suggest halfway through this function. therefore
                    // we need to check again and bail if the session has been canceled
                    return;
                }
                let noFocus = false;
                if (e.triggerOptions.auto) {
                    // don't "focus" item when configured to do
                    const options = this.editor.getOption(118 /* EditorOption.suggest */);
                    if (options.selectionMode === 'never' || options.selectionMode === 'always') {
                        // simple: always or never
                        noFocus = options.selectionMode === 'never';
                    }
                    else if (options.selectionMode === 'whenTriggerCharacter') {
                        // on with trigger character
                        noFocus = e.triggerOptions.triggerKind !== 1 /* CompletionTriggerKind.TriggerCharacter */;
                    }
                    else if (options.selectionMode === 'whenQuickSuggestion') {
                        // without trigger character or when refiltering
                        noFocus = e.triggerOptions.triggerKind === 1 /* CompletionTriggerKind.TriggerCharacter */ && !e.triggerOptions.refilter;
                    }
                }
                this.widget.value.showSuggestions(e.completionModel, index, e.isFrozen, e.triggerOptions.auto, noFocus);
            }));
            this._toDispose.add(this.model.onDidCancel(e => {
                if (!e.retrigger) {
                    this.widget.value.hideWidget();
                }
            }));
            this._toDispose.add(this.editor.onDidBlurEditorWidget(() => {
                if (!_sticky) {
                    this.model.cancel();
                    this.model.clear();
                }
            }));
            // Manage the acceptSuggestionsOnEnter context key
            const acceptSuggestionsOnEnter = suggest_1.Context.AcceptSuggestionsOnEnter.bindTo(_contextKeyService);
            const updateFromConfig = () => {
                const acceptSuggestionOnEnter = this.editor.getOption(1 /* EditorOption.acceptSuggestionOnEnter */);
                acceptSuggestionsOnEnter.set(acceptSuggestionOnEnter === 'on' || acceptSuggestionOnEnter === 'smart');
            };
            this._toDispose.add(this.editor.onDidChangeConfiguration(() => updateFromConfig()));
            updateFromConfig();
        }
        dispose() {
            this._alternatives.dispose();
            this._toDispose.dispose();
            this.widget.dispose();
            this.model.dispose();
            this._lineSuffix.dispose();
            this._onWillInsertSuggestItem.dispose();
        }
        _insertSuggestion(event, flags) {
            if (!event || !event.item) {
                this._alternatives.value.reset();
                this.model.cancel();
                this.model.clear();
                return;
            }
            if (!this.editor.hasModel()) {
                return;
            }
            const snippetController = snippetController2_1.SnippetController2.get(this.editor);
            if (!snippetController) {
                return;
            }
            this._onWillInsertSuggestItem.fire({ item: event.item });
            const model = this.editor.getModel();
            const modelVersionNow = model.getAlternativeVersionId();
            const { item } = event;
            //
            const tasks = [];
            const cts = new cancellation_1.CancellationTokenSource();
            // pushing undo stops *before* additional text edits and
            // *after* the main edit
            if (!(flags & 1 /* InsertFlags.NoBeforeUndoStop */)) {
                this.editor.pushUndoStop();
            }
            // compute overwrite[Before|After] deltas BEFORE applying extra edits
            const info = this.getOverwriteInfo(item, Boolean(flags & 8 /* InsertFlags.AlternativeOverwriteConfig */));
            // keep item in memory
            this._memoryService.memorize(model, this.editor.getPosition(), item);
            const isResolved = item.isResolved;
            // telemetry data points: duration of command execution, info about async additional edits (-1=n/a, -2=none, 1=success, 0=failed)
            let _commandExectionDuration = -1;
            let _additionalEditsAppliedAsync = -1;
            if (Array.isArray(item.completion.additionalTextEdits)) {
                // cancel -> stops all listening and closes widget
                this.model.cancel();
                // sync additional edits
                const scrollState = stableEditorScroll_1.StableEditorScrollState.capture(this.editor);
                this.editor.executeEdits('suggestController.additionalTextEdits.sync', item.completion.additionalTextEdits.map(edit => {
                    let range = range_1.Range.lift(edit.range);
                    if (range.startLineNumber === item.position.lineNumber && range.startColumn > item.position.column) {
                        // shift additional edit when it is "after" the completion insertion position
                        const columnDelta = this.editor.getPosition().column - item.position.column;
                        const startColumnDelta = columnDelta;
                        const endColumnDelta = range_1.Range.spansMultipleLines(range) ? 0 : columnDelta;
                        range = new range_1.Range(range.startLineNumber, range.startColumn + startColumnDelta, range.endLineNumber, range.endColumn + endColumnDelta);
                    }
                    return editOperation_1.EditOperation.replaceMove(range, edit.text);
                }));
                scrollState.restoreRelativeVerticalPositionOfCursor(this.editor);
            }
            else if (!isResolved) {
                // async additional edits
                const sw = new stopwatch_1.StopWatch();
                let position;
                const docListener = model.onDidChangeContent(e => {
                    if (e.isFlush) {
                        cts.cancel();
                        docListener.dispose();
                        return;
                    }
                    for (const change of e.changes) {
                        const thisPosition = range_1.Range.getEndPosition(change.range);
                        if (!position || position_1.Position.isBefore(thisPosition, position)) {
                            position = thisPosition;
                        }
                    }
                });
                const oldFlags = flags;
                flags |= 2 /* InsertFlags.NoAfterUndoStop */;
                let didType = false;
                const typeListener = this.editor.onWillType(() => {
                    typeListener.dispose();
                    didType = true;
                    if (!(oldFlags & 2 /* InsertFlags.NoAfterUndoStop */)) {
                        this.editor.pushUndoStop();
                    }
                });
                tasks.push(item.resolve(cts.token).then(() => {
                    if (!item.completion.additionalTextEdits || cts.token.isCancellationRequested) {
                        return undefined;
                    }
                    if (position && item.completion.additionalTextEdits.some(edit => position_1.Position.isBefore(position, range_1.Range.getStartPosition(edit.range)))) {
                        return false;
                    }
                    if (didType) {
                        this.editor.pushUndoStop();
                    }
                    const scrollState = stableEditorScroll_1.StableEditorScrollState.capture(this.editor);
                    this.editor.executeEdits('suggestController.additionalTextEdits.async', item.completion.additionalTextEdits.map(edit => editOperation_1.EditOperation.replaceMove(range_1.Range.lift(edit.range), edit.text)));
                    scrollState.restoreRelativeVerticalPositionOfCursor(this.editor);
                    if (didType || !(oldFlags & 2 /* InsertFlags.NoAfterUndoStop */)) {
                        this.editor.pushUndoStop();
                    }
                    return true;
                }).then(applied => {
                    this._logService.trace('[suggest] async resolving of edits DONE (ms, applied?)', sw.elapsed(), applied);
                    _additionalEditsAppliedAsync = applied === true ? 1 : applied === false ? 0 : -2;
                }).finally(() => {
                    docListener.dispose();
                    typeListener.dispose();
                }));
            }
            let { insertText } = item.completion;
            if (!(item.completion.insertTextRules & 4 /* CompletionItemInsertTextRule.InsertAsSnippet */)) {
                insertText = snippetParser_1.SnippetParser.escape(insertText);
            }
            // cancel -> stops all listening and closes widget
            this.model.cancel();
            snippetController.insert(insertText, {
                overwriteBefore: info.overwriteBefore,
                overwriteAfter: info.overwriteAfter,
                undoStopBefore: false,
                undoStopAfter: false,
                adjustWhitespace: !(item.completion.insertTextRules & 1 /* CompletionItemInsertTextRule.KeepWhitespace */),
                clipboardText: event.model.clipboardText,
                overtypingCapturer: this._overtypingCapturer.value
            });
            if (!(flags & 2 /* InsertFlags.NoAfterUndoStop */)) {
                this.editor.pushUndoStop();
            }
            if (item.completion.command) {
                if (item.completion.command.id === TriggerSuggestAction.id) {
                    // retigger
                    this.model.trigger({ auto: true, retrigger: true });
                }
                else {
                    // exec command, done
                    const sw = new stopwatch_1.StopWatch();
                    tasks.push(this._commandService.executeCommand(item.completion.command.id, ...(item.completion.command.arguments ? [...item.completion.command.arguments] : [])).catch(e => {
                        if (item.completion.extensionId) {
                            (0, errors_1.onUnexpectedExternalError)(e);
                        }
                        else {
                            (0, errors_1.onUnexpectedError)(e);
                        }
                    }).finally(() => {
                        _commandExectionDuration = sw.elapsed();
                    }));
                }
            }
            if (flags & 4 /* InsertFlags.KeepAlternativeSuggestions */) {
                this._alternatives.value.set(event, next => {
                    // cancel resolving of additional edits
                    cts.cancel();
                    // this is not so pretty. when inserting the 'next'
                    // suggestion we undo until we are at the state at
                    // which we were before inserting the previous suggestion...
                    while (model.canUndo()) {
                        if (modelVersionNow !== model.getAlternativeVersionId()) {
                            model.undo();
                        }
                        this._insertSuggestion(next, 1 /* InsertFlags.NoBeforeUndoStop */ | 2 /* InsertFlags.NoAfterUndoStop */ | (flags & 8 /* InsertFlags.AlternativeOverwriteConfig */ ? 8 /* InsertFlags.AlternativeOverwriteConfig */ : 0));
                        break;
                    }
                });
            }
            this._alertCompletionItem(item);
            // clear only now - after all tasks are done
            Promise.all(tasks).finally(() => {
                this._reportSuggestionAcceptedTelemetry(item, model, isResolved, _commandExectionDuration, _additionalEditsAppliedAsync);
                this.model.clear();
                cts.dispose();
            });
        }
        _reportSuggestionAcceptedTelemetry(item, model, itemResolved, commandExectionDuration, additionalEditsAppliedAsync) {
            if (Math.floor(Math.random() * 100) === 0) {
                // throttle telemetry event because accepting completions happens a lot
                return;
            }
            this._telemetryService.publicLog2('suggest.acceptedSuggestion', {
                extensionId: item.extensionId?.value ?? 'unknown',
                providerId: item.provider._debugDisplayName ?? 'unknown',
                kind: item.completion.kind,
                basenameHash: (0, hash_1.hash)((0, resources_1.basename)(model.uri)).toString(16),
                languageId: model.getLanguageId(),
                fileExtension: (0, resources_1.extname)(model.uri),
                resolveInfo: !item.provider.resolveCompletionItem ? -1 : itemResolved ? 1 : 0,
                resolveDuration: item.resolveDuration,
                commandDuration: commandExectionDuration,
                additionalEditsAsync: additionalEditsAppliedAsync
            });
        }
        getOverwriteInfo(item, toggleMode) {
            (0, types_1.assertType)(this.editor.hasModel());
            let replace = this.editor.getOption(118 /* EditorOption.suggest */).insertMode === 'replace';
            if (toggleMode) {
                replace = !replace;
            }
            const overwriteBefore = item.position.column - item.editStart.column;
            const overwriteAfter = (replace ? item.editReplaceEnd.column : item.editInsertEnd.column) - item.position.column;
            const columnDelta = this.editor.getPosition().column - item.position.column;
            const suffixDelta = this._lineSuffix.value ? this._lineSuffix.value.delta(this.editor.getPosition()) : 0;
            return {
                overwriteBefore: overwriteBefore + columnDelta,
                overwriteAfter: overwriteAfter + suffixDelta
            };
        }
        _alertCompletionItem(item) {
            if ((0, arrays_1.isNonEmptyArray)(item.completion.additionalTextEdits)) {
                const msg = nls.localize('aria.alert.snippet', "Accepting '{0}' made {1} additional edits", item.textLabel, item.completion.additionalTextEdits.length);
                (0, aria_1.alert)(msg);
            }
        }
        triggerSuggest(onlyFrom, auto, noFilter) {
            if (this.editor.hasModel()) {
                this.model.trigger({
                    auto: auto ?? false,
                    completionOptions: { providerFilter: onlyFrom, kindFilter: noFilter ? new Set() : undefined }
                });
                this.editor.revealPosition(this.editor.getPosition(), 0 /* ScrollType.Smooth */);
                this.editor.focus();
            }
        }
        triggerSuggestAndAcceptBest(arg) {
            if (!this.editor.hasModel()) {
                return;
            }
            const positionNow = this.editor.getPosition();
            const fallback = () => {
                if (positionNow.equals(this.editor.getPosition())) {
                    this._commandService.executeCommand(arg.fallback);
                }
            };
            const makesTextEdit = (item) => {
                if (item.completion.insertTextRules & 4 /* CompletionItemInsertTextRule.InsertAsSnippet */ || item.completion.additionalTextEdits) {
                    // snippet, other editor -> makes edit
                    return true;
                }
                const position = this.editor.getPosition();
                const startColumn = item.editStart.column;
                const endColumn = position.column;
                if (endColumn - startColumn !== item.completion.insertText.length) {
                    // unequal lengths -> makes edit
                    return true;
                }
                const textNow = this.editor.getModel().getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn,
                    endLineNumber: position.lineNumber,
                    endColumn
                });
                // unequal text -> makes edit
                return textNow !== item.completion.insertText;
            };
            event_1.Event.once(this.model.onDidTrigger)(_ => {
                // wait for trigger because only then the cancel-event is trustworthy
                const listener = [];
                event_1.Event.any(this.model.onDidTrigger, this.model.onDidCancel)(() => {
                    // retrigger or cancel -> try to type default text
                    (0, lifecycle_1.dispose)(listener);
                    fallback();
                }, undefined, listener);
                this.model.onDidSuggest(({ completionModel }) => {
                    (0, lifecycle_1.dispose)(listener);
                    if (completionModel.items.length === 0) {
                        fallback();
                        return;
                    }
                    const index = this._memoryService.select(this.editor.getModel(), this.editor.getPosition(), completionModel.items);
                    const item = completionModel.items[index];
                    if (!makesTextEdit(item)) {
                        fallback();
                        return;
                    }
                    this.editor.pushUndoStop();
                    this._insertSuggestion({ index, item, model: completionModel }, 4 /* InsertFlags.KeepAlternativeSuggestions */ | 1 /* InsertFlags.NoBeforeUndoStop */ | 2 /* InsertFlags.NoAfterUndoStop */);
                }, undefined, listener);
            });
            this.model.trigger({ auto: false, shy: true });
            this.editor.revealPosition(positionNow, 0 /* ScrollType.Smooth */);
            this.editor.focus();
        }
        acceptSelectedSuggestion(keepAlternativeSuggestions, alternativeOverwriteConfig) {
            const item = this.widget.value.getFocusedItem();
            let flags = 0;
            if (keepAlternativeSuggestions) {
                flags |= 4 /* InsertFlags.KeepAlternativeSuggestions */;
            }
            if (alternativeOverwriteConfig) {
                flags |= 8 /* InsertFlags.AlternativeOverwriteConfig */;
            }
            this._insertSuggestion(item, flags);
        }
        acceptNextSuggestion() {
            this._alternatives.value.next();
        }
        acceptPrevSuggestion() {
            this._alternatives.value.prev();
        }
        cancelSuggestWidget() {
            this.model.cancel();
            this.model.clear();
            this.widget.value.hideWidget();
        }
        focusSuggestion() {
            this.widget.value.focusSelected();
        }
        selectNextSuggestion() {
            this.widget.value.selectNext();
        }
        selectNextPageSuggestion() {
            this.widget.value.selectNextPage();
        }
        selectLastSuggestion() {
            this.widget.value.selectLast();
        }
        selectPrevSuggestion() {
            this.widget.value.selectPrevious();
        }
        selectPrevPageSuggestion() {
            this.widget.value.selectPreviousPage();
        }
        selectFirstSuggestion() {
            this.widget.value.selectFirst();
        }
        toggleSuggestionDetails() {
            this.widget.value.toggleDetails();
        }
        toggleExplainMode() {
            this.widget.value.toggleExplainMode();
        }
        toggleSuggestionFocus() {
            this.widget.value.toggleDetailsFocus();
        }
        resetWidgetSize() {
            this.widget.value.resetPersistedSize();
        }
        forceRenderingAbove() {
            this.widget.value.forceRenderingAbove();
        }
        stopForceRenderingAbove() {
            if (!this.widget.isInitialized) {
                // This method has no effect if the widget is not initialized yet.
                return;
            }
            this.widget.value.stopForceRenderingAbove();
        }
        registerSelector(selector) {
            return this._selectors.register(selector);
        }
    };
    exports.SuggestController = SuggestController;
    exports.SuggestController = SuggestController = SuggestController_1 = __decorate([
        __param(1, suggestMemory_1.ISuggestMemoryService),
        __param(2, commands_1.ICommandService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, log_1.ILogService),
        __param(6, telemetry_1.ITelemetryService)
    ], SuggestController);
    class PriorityRegistry {
        constructor(prioritySelector) {
            this.prioritySelector = prioritySelector;
            this._items = new Array();
        }
        register(value) {
            if (this._items.indexOf(value) !== -1) {
                throw new Error('Value is already registered');
            }
            this._items.push(value);
            this._items.sort((s1, s2) => this.prioritySelector(s2) - this.prioritySelector(s1));
            return {
                dispose: () => {
                    const idx = this._items.indexOf(value);
                    if (idx >= 0) {
                        this._items.splice(idx, 1);
                    }
                }
            };
        }
        get itemsOrderedByPriorityDesc() {
            return this._items;
        }
    }
    class TriggerSuggestAction extends editorExtensions_1.EditorAction {
        static { this.id = 'editor.action.triggerSuggest'; }
        constructor() {
            super({
                id: TriggerSuggestAction.id,
                label: nls.localize('suggest.trigger.label', "Trigger Suggest"),
                alias: 'Trigger Suggest',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCompletionItemProvider, suggest_1.Context.Visible.toNegated()),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 10 /* KeyCode.Space */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */],
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 10 /* KeyCode.Space */, secondary: [512 /* KeyMod.Alt */ | 9 /* KeyCode.Escape */, 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */] },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor, args) {
            const controller = SuggestController.get(editor);
            if (!controller) {
                return;
            }
            let auto;
            if (args && typeof args === 'object') {
                if (args.auto === true) {
                    auto = true;
                }
            }
            controller.triggerSuggest(undefined, auto, undefined);
        }
    }
    exports.TriggerSuggestAction = TriggerSuggestAction;
    (0, editorExtensions_1.registerEditorContribution)(SuggestController.ID, SuggestController, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
    (0, editorExtensions_1.registerEditorAction)(TriggerSuggestAction);
    const weight = 100 /* KeybindingWeight.EditorContrib */ + 90;
    const SuggestCommand = editorExtensions_1.EditorCommand.bindToContribution(SuggestController.get);
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'acceptSelectedSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.HasFocusedSuggestion),
        handler(x) {
            x.acceptSelectedSuggestion(true, false);
        },
        kbOpts: [{
                // normal tab
                primary: 2 /* KeyCode.Tab */,
                kbExpr: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, editorContextKeys_1.EditorContextKeys.textInputFocus),
                weight,
            }, {
                // accept on enter has special rules
                primary: 3 /* KeyCode.Enter */,
                kbExpr: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, editorContextKeys_1.EditorContextKeys.textInputFocus, suggest_1.Context.AcceptSuggestionsOnEnter, suggest_1.Context.MakesTextEdit),
                weight,
            }],
        menuOpts: [{
                menuId: suggest_1.suggestWidgetStatusbarMenu,
                title: nls.localize('accept.insert', "Insert"),
                group: 'left',
                order: 1,
                when: suggest_1.Context.HasInsertAndReplaceRange.toNegated()
            }, {
                menuId: suggest_1.suggestWidgetStatusbarMenu,
                title: nls.localize('accept.insert', "Insert"),
                group: 'left',
                order: 1,
                when: contextkey_1.ContextKeyExpr.and(suggest_1.Context.HasInsertAndReplaceRange, suggest_1.Context.InsertMode.isEqualTo('insert'))
            }, {
                menuId: suggest_1.suggestWidgetStatusbarMenu,
                title: nls.localize('accept.replace', "Replace"),
                group: 'left',
                order: 1,
                when: contextkey_1.ContextKeyExpr.and(suggest_1.Context.HasInsertAndReplaceRange, suggest_1.Context.InsertMode.isEqualTo('replace'))
            }]
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'acceptAlternativeSelectedSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, editorContextKeys_1.EditorContextKeys.textInputFocus, suggest_1.Context.HasFocusedSuggestion),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
            secondary: [1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */],
        },
        handler(x) {
            x.acceptSelectedSuggestion(false, true);
        },
        menuOpts: [{
                menuId: suggest_1.suggestWidgetStatusbarMenu,
                group: 'left',
                order: 2,
                when: contextkey_1.ContextKeyExpr.and(suggest_1.Context.HasInsertAndReplaceRange, suggest_1.Context.InsertMode.isEqualTo('insert')),
                title: nls.localize('accept.replace', "Replace")
            }, {
                menuId: suggest_1.suggestWidgetStatusbarMenu,
                group: 'left',
                order: 2,
                when: contextkey_1.ContextKeyExpr.and(suggest_1.Context.HasInsertAndReplaceRange, suggest_1.Context.InsertMode.isEqualTo('replace')),
                title: nls.localize('accept.insert', "Insert")
            }]
    }));
    // continue to support the old command
    commands_1.CommandsRegistry.registerCommandAlias('acceptSelectedSuggestionOnEnter', 'acceptSelectedSuggestion');
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'hideSuggestWidget',
        precondition: suggest_1.Context.Visible,
        handler: x => x.cancelSuggestWidget(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'selectNextSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, contextkey_1.ContextKeyExpr.or(suggest_1.Context.MultipleSuggestions, suggest_1.Context.HasFocusedSuggestion.negate())),
        handler: c => c.selectNextSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 18 /* KeyCode.DownArrow */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */],
            mac: { primary: 18 /* KeyCode.DownArrow */, secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */, 256 /* KeyMod.WinCtrl */ | 44 /* KeyCode.KeyN */] }
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'selectNextPageSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, contextkey_1.ContextKeyExpr.or(suggest_1.Context.MultipleSuggestions, suggest_1.Context.HasFocusedSuggestion.negate())),
        handler: c => c.selectNextPageSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 12 /* KeyCode.PageDown */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 12 /* KeyCode.PageDown */]
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'selectLastSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, contextkey_1.ContextKeyExpr.or(suggest_1.Context.MultipleSuggestions, suggest_1.Context.HasFocusedSuggestion.negate())),
        handler: c => c.selectLastSuggestion()
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'selectPrevSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, contextkey_1.ContextKeyExpr.or(suggest_1.Context.MultipleSuggestions, suggest_1.Context.HasFocusedSuggestion.negate())),
        handler: c => c.selectPrevSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 16 /* KeyCode.UpArrow */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */],
            mac: { primary: 16 /* KeyCode.UpArrow */, secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */, 256 /* KeyMod.WinCtrl */ | 46 /* KeyCode.KeyP */] }
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'selectPrevPageSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, contextkey_1.ContextKeyExpr.or(suggest_1.Context.MultipleSuggestions, suggest_1.Context.HasFocusedSuggestion.negate())),
        handler: c => c.selectPrevPageSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 11 /* KeyCode.PageUp */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 11 /* KeyCode.PageUp */]
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'selectFirstSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, contextkey_1.ContextKeyExpr.or(suggest_1.Context.MultipleSuggestions, suggest_1.Context.HasFocusedSuggestion.negate())),
        handler: c => c.selectFirstSuggestion()
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'focusSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.HasFocusedSuggestion.negate()),
        handler: x => x.focusSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2048 /* KeyMod.CtrlCmd */ | 10 /* KeyCode.Space */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */],
            mac: { primary: 256 /* KeyMod.WinCtrl */ | 10 /* KeyCode.Space */, secondary: [2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */] }
        },
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'focusAndAcceptSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.HasFocusedSuggestion.negate()),
        handler: c => {
            c.focusSuggestion();
            c.acceptSelectedSuggestion(true, false);
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'toggleSuggestionDetails',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.HasFocusedSuggestion),
        handler: x => x.toggleSuggestionDetails(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2048 /* KeyMod.CtrlCmd */ | 10 /* KeyCode.Space */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */],
            mac: { primary: 256 /* KeyMod.WinCtrl */ | 10 /* KeyCode.Space */, secondary: [2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */] }
        },
        menuOpts: [{
                menuId: suggest_1.suggestWidgetStatusbarMenu,
                group: 'right',
                order: 1,
                when: contextkey_1.ContextKeyExpr.and(suggest_1.Context.DetailsVisible, suggest_1.Context.CanResolve),
                title: nls.localize('detail.more', "show less")
            }, {
                menuId: suggest_1.suggestWidgetStatusbarMenu,
                group: 'right',
                order: 1,
                when: contextkey_1.ContextKeyExpr.and(suggest_1.Context.DetailsVisible.toNegated(), suggest_1.Context.CanResolve),
                title: nls.localize('detail.less', "show more")
            }]
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'toggleExplainMode',
        precondition: suggest_1.Context.Visible,
        handler: x => x.toggleExplainMode(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */,
            primary: 2048 /* KeyMod.CtrlCmd */ | 90 /* KeyCode.Slash */,
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'toggleSuggestionFocus',
        precondition: suggest_1.Context.Visible,
        handler: x => x.toggleSuggestionFocus(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 10 /* KeyCode.Space */,
            mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 10 /* KeyCode.Space */ }
        }
    }));
    //#region tab completions
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'insertBestCompletion',
        precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, contextkey_1.ContextKeyExpr.equals('config.editor.tabCompletion', 'on'), wordContextKey_1.WordContextKey.AtEnd, suggest_1.Context.Visible.toNegated(), suggestAlternatives_1.SuggestAlternatives.OtherSuggestions.toNegated(), snippetController2_1.SnippetController2.InSnippetMode.toNegated()),
        handler: (x, arg) => {
            x.triggerSuggestAndAcceptBest((0, types_1.isObject)(arg) ? { fallback: 'tab', ...arg } : { fallback: 'tab' });
        },
        kbOpts: {
            weight,
            primary: 2 /* KeyCode.Tab */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'insertNextSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, contextkey_1.ContextKeyExpr.equals('config.editor.tabCompletion', 'on'), suggestAlternatives_1.SuggestAlternatives.OtherSuggestions, suggest_1.Context.Visible.toNegated(), snippetController2_1.SnippetController2.InSnippetMode.toNegated()),
        handler: x => x.acceptNextSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2 /* KeyCode.Tab */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new SuggestCommand({
        id: 'insertPrevSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, contextkey_1.ContextKeyExpr.equals('config.editor.tabCompletion', 'on'), suggestAlternatives_1.SuggestAlternatives.OtherSuggestions, suggest_1.Context.Visible.toNegated(), snippetController2_1.SnippetController2.InSnippetMode.toNegated()),
        handler: x => x.acceptPrevSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */
        }
    }));
    (0, editorExtensions_1.registerEditorAction)(class extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.resetSuggestSize',
                label: nls.localize('suggest.reset.label', "Reset Suggest Widget Size"),
                alias: 'Reset Suggest Widget Size',
                precondition: undefined
            });
        }
        run(_accessor, editor) {
            SuggestController.get(editor)?.resetWidgetSize();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdENvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N1Z2dlc3QvYnJvd3Nlci9zdWdnZXN0Q29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBOENoRyxzRUFBc0U7SUFDdEUsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUVuQjtJQUVGLE1BQU0sVUFBVTtRQVNmLFlBQTZCLE1BQWtCLEVBQW1CLFNBQW9CO1lBQXpELFdBQU0sR0FBTixNQUFNLENBQVk7WUFBbUIsY0FBUyxHQUFULFNBQVMsQ0FBVztZQVByRSx1QkFBa0IsR0FBRyxrQ0FBc0IsQ0FBQyxRQUFRLENBQUM7Z0JBQ3JFLFdBQVcsRUFBRSxxQkFBcUI7Z0JBQ2xDLFVBQVUsNERBQW9EO2FBQzlELENBQUMsQ0FBQztZQUtGLDBEQUEwRDtZQUMxRCxzREFBc0Q7WUFDdEQsdURBQXVEO1lBQ3ZELE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDaEUsSUFBSSxTQUFTLEtBQUssU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNwQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDN0MsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxFQUFFO29CQUNuQyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDbEIsUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDekMsQ0FBQztv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