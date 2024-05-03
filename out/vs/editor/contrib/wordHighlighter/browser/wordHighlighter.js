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
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/languages", "vs/editor/common/model", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/wordHighlighter/browser/highlightDecorations", "vs/platform/contextkey/common/contextkey", "vs/base/common/network", "vs/base/common/map", "vs/editor/common/languageSelector"], function (require, exports, nls, arrays, aria_1, async_1, cancellation_1, errors_1, lifecycle_1, editorBrowser_1, editorExtensions_1, codeEditorService_1, range_1, editorContextKeys_1, languages_1, model_1, languageFeatures_1, highlightDecorations_1, contextkey_1, network_1, map_1, languageSelector_1) {
    "use strict";
    var WordHighlighter_1, WordHighlighterContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WordHighlighterContribution = void 0;
    exports.getOccurrencesAtPosition = getOccurrencesAtPosition;
    exports.getOccurrencesAcrossMultipleModels = getOccurrencesAcrossMultipleModels;
    // import { TextualMultiDocumentHighlightFeature } from 'vs/editor/contrib/wordHighlighter/browser/textualHighlightProvider';
    // import { registerEditorFeature } from 'vs/editor/common/editorFeatures';
    const ctxHasWordHighlights = new contextkey_1.RawContextKey('hasWordHighlights', false);
    function getOccurrencesAtPosition(registry, model, position, token) {
        const orderedByScore = registry.ordered(model);
        // in order of score ask the occurrences provider
        // until someone response with a good result
        // (good = none empty array)
        return (0, async_1.first)(orderedByScore.map(provider => () => {
            return Promise.resolve(provider.provideDocumentHighlights(model, position, token))
                .then(undefined, errors_1.onUnexpectedExternalError);
        }), arrays.isNonEmptyArray).then(result => {
            if (result) {
                const map = new map_1.ResourceMap();
                map.set(model.uri, result);
                return map;
            }
            return new map_1.ResourceMap();
        });
    }
    function getOccurrencesAcrossMultipleModels(registry, model, position, wordSeparators, token, otherModels) {
        const orderedByScore = registry.ordered(model);
        // in order of score ask the occurrences provider
        // until someone response with a good result
        // (good = none empty array)
        return (0, async_1.first)(orderedByScore.map(provider => () => {
            const filteredModels = otherModels.filter(otherModel => {
                return (0, model_1.shouldSynchronizeModel)(otherModel);
            }).filter(otherModel => {
                return (0, languageSelector_1.score)(provider.selector, otherModel.uri, otherModel.getLanguageId(), true, undefined, undefined) > 0;
            });
            return Promise.resolve(provider.provideMultiDocumentHighlights(model, position, filteredModels, token))
                .then(undefined, errors_1.onUnexpectedExternalError);
        }), (t) => t instanceof map_1.ResourceMap && t.size > 0);
    }
    class OccurenceAtPositionRequest {
        constructor(_model, _selection, _wordSeparators) {
            this._model = _model;
            this._selection = _selection;
            this._wordSeparators = _wordSeparators;
            this._wordRange = this._getCurrentWordRange(_model, _selection);
            this._result = null;
        }
        get result() {
            if (!this._result) {
                this._result = (0, async_1.createCancelablePromise)(token => this._compute(this._model, this._selection, this._wordSeparators, token));
            }
            return this._result;
        }
        _getCurrentWordRange(model, selection) {
            const word = model.getWordAtPosition(selection.getPosition());
            if (word) {
                return new range_1.Range(selection.startLineNumber, word.startColumn, selection.startLineNumber, word.endColumn);
            }
            return null;
        }
        isValid(model, selection, decorations) {
            const lineNumber = selection.startLineNumber;
            const startColumn = selection.startColumn;
            const endColumn = selection.endColumn;
            const currentWordRange = this._getCurrentWordRange(model, selection);
            let requestIsValid = Boolean(this._wordRange && this._wordRange.equalsRange(currentWordRange));
            // Even if we are on a different word, if that word is in the decorations ranges, the request is still valid
            // (Same symbol)
            for (let i = 0, len = decorations.length; !requestIsValid && i < len; i++) {
                const range = decorations.getRange(i);
                if (range && range.startLineNumber === lineNumber) {
                    if (range.startColumn <= startColumn && range.endColumn >= endColumn) {
                        requestIsValid = true;
                    }
                }
            }
            return requestIsValid;
        }
        cancel() {
            this.result.cancel();
        }
    }
    class SemanticOccurenceAtPositionRequest extends OccurenceAtPositionRequest {
        constructor(model, selection, wordSeparators, providers) {
            super(model, selection, wordSeparators);
            this._providers = providers;
        }
        _compute(model, selection, wordSeparators, token) {
            return getOccurrencesAtPosition(this._providers, model, selection.getPosition(), token).then(value => {
                if (!value) {
                    return new map_1.ResourceMap();
                }
                return value;
            });
        }
    }
    class MultiModelOccurenceRequest extends OccurenceAtPositionRequest {
        constructor(model, selection, wordSeparators, providers, otherModels) {
            super(model, selection, wordSeparators);
            this._providers = providers;
            this._otherModels = otherModels;
        }
        _compute(model, selection, wordSeparators, token) {
            return getOccurrencesAcrossMultipleModels(this._providers, model, selection.getPosition(), wordSeparators, token, this._otherModels).then(value => {
                if (!value) {
                    return new map_1.ResourceMap();
                }
                return value;
            });
        }
    }
    class TextualOccurenceRequest extends OccurenceAtPositionRequest {
        constructor(model, selection, word, wordSeparators, otherModels) {
            super(model, selection, wordSeparators);
            this._otherModels = otherModels;
            this._selectionIsEmpty = selection.isEmpty();
            this._word = word;
        }
        _compute(model, selection, wordSeparators, token) {
            return (0, async_1.timeout)(250, token).then(() => {
                const result = new map_1.ResourceMap();
                let wordResult;
                if (this._word) {
                    wordResult = this._word;
                }
                else {
                    wordResult = model.getWordAtPosition(selection.getPosition());
                }
                if (!wordResult) {
                    return new map_1.ResourceMap();
                }
                const allModels = [model, ...this._otherModels];
                for (const otherModel of allModels) {
                    if (otherModel.isDisposed()) {
                        continue;
                    }
                    const matches = otherModel.findMatches(wordResult.word, true, false, true, wordSeparators, false);
                    const highlights = matches.map(m => ({
                        range: m.range,
                        kind: languages_1.DocumentHighlightKind.Text
                    }));
                    if (highlights) {
                        result.set(otherModel.uri, highlights);
                    }
                }
                return result;
            });
        }
        isValid(model, selection, decorations) {
            const currentSelectionIsEmpty = selection.isEmpty();
            if (this._selectionIsEmpty !== currentSelectionIsEmpty) {
                return false;
            }
            return super.isValid(model, selection, decorations);
        }
    }
    function computeOccurencesAtPosition(registry, model, selection, word, wordSeparators) {
        if (registry.has(model)) {
            return new SemanticOccurenceAtPositionRequest(model, selection, wordSeparators, registry);
        }
        return new TextualOccurenceRequest(model, selection, word, wordSeparators, []);
    }
    function computeOccurencesMultiModel(registry, model, selection, word, wordSeparators, otherModels) {
        if (registry.has(model)) {
            return new MultiModelOccurenceRequest(model, selection, wordSeparators, registry, otherModels);
        }
        return new TextualOccurenceRequest(model, selection, word, wordSeparators, otherModels);
    }
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeDocumentHighlights', async (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const map = await getOccurrencesAtPosition(languageFeaturesService.documentHighlightProvider, model, position, cancellation_1.CancellationToken.None);
        return map?.get(model.uri);
    });
    let WordHighlighter = class WordHighlighter {
        static { WordHighlighter_1 = this; }
        static { this.storedDecorations = new map_1.ResourceMap(); }
        static { this.query = null; }
        constructor(editor, providers, multiProviders, contextKeyService, codeEditorService) {
            this.toUnhook = new lifecycle_1.DisposableStore();
            this.workerRequestTokenId = 0;
            this.workerRequestCompleted = false;
            this.workerRequestValue = new map_1.ResourceMap();
            this.lastCursorPositionChangeTime = 0;
            this.renderDecorationsTimer = -1;
            this.editor = editor;
            this.providers = providers;
            this.multiDocumentProviders = multiProviders;
            this.codeEditorService = codeEditorService;
            this._hasWordHighlights = ctxHasWordHighlights.bindTo(contextKeyService);
            this._ignorePositionChangeEvent = false;
            this.occurrencesHighlight = this.editor.getOption(81 /* EditorOption.occurrencesHighlight */);
            this.model = this.editor.getModel();
            this.toUnhook.add(editor.onDidChangeCursorPosition((e) => {
                if (this._ignorePositionChangeEvent) {
                    // We are changing the position => ignore this event
                    return;
                }
                if (this.occurrencesHighlight === 'off') {
                    // Early exit if nothing needs to be done!
                    // Leave some form of early exit check here if you wish to continue being a cursor position change listener ;)
                    return;
                }
                this._onPositionChanged(e);
            }));
            this.toUnhook.add(editor.onDidFocusEditorText((e) => {
                if (this.occurrencesHighlight === 'off') {
                    // Early exit if nothing needs to be done
                    return;
                }
                if (!this.workerRequest) {
                    this._run();
                }
            }));
            this.toUnhook.add(editor.onDidChangeModelContent((e) => {
                this._stopAll();
            }));
            this.toUnhook.add(editor.onDidChangeModel((e) => {
                if (!e.newModelUrl && e.oldModelUrl) {
                    this._stopSingular();
                }
                else {
                    if (WordHighlighter_1.query) {
                        this._run();
                    }
                }
            }));
            this.toUnhook.add(editor.onDidChangeConfiguration((e) => {
                const newValue = this.editor.getOption(81 /* EditorOption.occurrencesHighlight */);
                if (this.occurrencesHighlight !== newValue) {
                    this.occurrencesHighlight = newValue;
                    this._stopAll();
                }
            }));
            this.decorations = this.editor.createDecorationsCollection();
            this.workerRequestTokenId = 0;
            this.workerRequest = null;
            this.workerRequestCompleted = false;
            this.lastCursorPositionChangeTime = 0;
            this.renderDecorationsTimer = -1;
            // if there is a query already, highlight off that query
            if (WordHighlighter_1.query) {
                this._run();
            }
        }
        hasDecorations() {
            return (this.decorations.length > 0);
        }
        restore() {
            if (this.occurrencesHighlight === 'off') {
                return;
            }
            this._run();
        }
        stop() {
            if (this.occurrencesHighlight === 'off') {
                return;
            }
            this._stopAll();
        }
        _getSortedHighlights() {
            return (this.decorations.getRanges()
                .sort(range_1.Range.compareRangesUsingStarts));
        }
        moveNext() {
            const highlights = this._getSortedHighlights();
            const index = highlights.findIndex((range) => range.containsPosition(this.editor.getPosition()));
            const newIndex = ((index + 1) % highlights.length);
            const dest = highlights[newIndex];
            try {
                this._ignorePositionChangeEvent = true;
                this.editor.setPosition(dest.getStartPosition());
                this.editor.revealRangeInCenterIfOutsideViewport(dest);
                const word = this._getWord();
                if (word) {
                    const lineContent = this.editor.getModel().getLineContent(dest.startLineNumber);
                    (0, aria_1.alert)(`${lineContent}, ${newIndex + 1} of ${highlights.length} for '${word.word}'`);
                }
            }
            finally {
                this._ignorePositionChangeEvent = false;
            }
        }
        moveBack() {
            const highlights = this._getSortedHighlights();
            const index = highlights.findIndex((range) => range.containsPosition(this.editor.getPosition()));
            const newIndex = ((index - 1 + highlights.length) % highlights.length);
            const dest = highlights[newIndex];
            try {
                this._ignorePositionChangeEvent = true;
                this.editor.setPosition(dest.getStartPosition());
                this.editor.revealRangeInCenterIfOutsideViewport(dest);
                const word = this._getWord();
                if (word) {
                    const lineContent = this.editor.getModel().getLineContent(dest.startLineNumber);
                    (0, aria_1.alert)(`${lineContent}, ${newIndex + 1} of ${highlights.length} for '${word.word}'`);
                }
            }
            finally {
                this._ignorePositionChangeEvent = false;
            }
        }
        _removeSingleDecorations() {
            // return if no model
            if (!this.editor.hasModel()) {
                return;
            }
            const currentDecorationIDs = WordHighlighter_1.storedDecorations.get(this.editor.getModel().uri);
            if (!currentDecorationIDs) {
                return;
            }
            this.editor.removeDecorations(currentDecorationIDs);
            WordHighlighter_1.storedDecorations.delete(this.editor.getModel().uri);
            if (this.decorations.length > 0) {
                this.decorations.clear();
                this._hasWordHighlights.set(false);
            }
        }
        _removeAllDecorations() {
            const currentEditors = this.codeEditorService.listCodeEditors();
            const deleteURI = [];
            // iterate over editors and store models in currentModels
            for (const editor of currentEditors) {
                if (!editor.hasModel()) {
                    continue;
                }
                const currentDecorationIDs = WordHighlighter_1.storedDecorations.get(editor.getModel().uri);
                if (!currentDecorationIDs) {
                    continue;
                }
                editor.removeDecorations(currentDecorationIDs);
                deleteURI.push(editor.getModel().uri);
                const editorHighlighterContrib = WordHighlighterContribution.get(editor);
                if (!editorHighlighterContrib?.wordHighlighter) {
                    continue;
                }
                if (editorHighlighterContrib.wordHighlighter.decorations.length > 0) {
                    editorHighlighterContrib.wordHighlighter.decorations.clear();
                    editorHighlighterContrib.wordHighlighter.workerRequest = null;
                    editorHighlighterContrib.wordHighlighter._hasWordHighlights.set(false);
                }
            }
            for (const uri of deleteURI) {
                WordHighlighter_1.storedDecorations.delete(uri);
            }
        }
        _stopSingular() {
            // Remove any existing decorations + a possible query, and re - run to update decorations
            this._removeSingleDecorations();
            if (this.editor.hasTextFocus()) {
                if (this.editor.getModel()?.uri.scheme !== network_1.Schemas.vscodeNotebookCell && WordHighlighter_1.query?.modelInfo?.model.uri.scheme !== network_1.Schemas.vscodeNotebookCell) { // clear query if focused non-nb editor
                    WordHighlighter_1.query = null;
                    this._run(); // TODO: @Yoyokrazy -- investigate why we need a full rerun here. likely addressed a case/patch in the first iteration of this feature
                }
                else { // remove modelInfo to account for nb cell being disposed
                    if (WordHighlighter_1.query?.modelInfo) {
                        WordHighlighter_1.query.modelInfo = null;
                    }
                }
            }
            // Cancel any renderDecorationsTimer
            if (this.renderDecorationsTimer !== -1) {
                clearTimeout(this.renderDecorationsTimer);
                this.renderDecorationsTimer = -1;
            }
            // Cancel any worker request
            if (this.workerRequest !== null) {
                this.workerRequest.cancel();
                this.workerRequest = null;
            }
            // Invalidate any worker request callback
            if (!this.workerRequestCompleted) {
                this.workerRequestTokenId++;
                this.workerRequestCompleted = true;
            }
        }
        _stopAll() {
            // Remove any existing decorations
            // TODO: @Yoyokrazy -- this triggers as notebooks scroll, causing highlights to disappear momentarily.
            // maybe a nb type check?
            this._removeAllDecorations();
            // Cancel any renderDecorationsTimer
            if (this.renderDecorationsTimer !== -1) {
                clearTimeout(this.renderDecorationsTimer);
                this.renderDecorationsTimer = -1;
            }
            // Cancel any worker request
            if (this.workerRequest !== null) {
                this.workerRequest.cancel();
                this.workerRequest = null;
            }
            // Invalidate any worker request callback
            if (!this.workerRequestCompleted) {
                this.workerRequestTokenId++;
                this.workerRequestCompleted = true;
            }
        }
        _onPositionChanged(e) {
            // disabled
            if (this.occurrencesHighlight === 'off') {
                this._stopAll();
                return;
            }
            // ignore typing & other
            // need to check if the model is a notebook cell, should not stop if nb
            if (e.reason !== 3 /* CursorChangeReason.Explicit */ && this.editor.getModel()?.uri.scheme !== network_1.Schemas.vscodeNotebookCell) {
                this._stopAll();
                return;
            }
            this._run();
        }
        _getWord() {
            const editorSelection = this.editor.getSelection();
            const lineNumber = editorSelection.startLineNumber;
            const startColumn = editorSelection.startColumn;
            if (this.model.isDisposed()) {
                return null;
            }
            return this.model.getWordAtPosition({
                lineNumber: lineNumber,
                column: startColumn
            });
        }
        getOtherModelsToHighlight(model) {
            if (!model) {
                return [];
            }
            // notebook case
            const isNotebookEditor = model.uri.scheme === network_1.Schemas.vscodeNotebookCell;
            if (isNotebookEditor) {
                const currentModels = [];
                const currentEditors = this.codeEditorService.listCodeEditors();
                for (const editor of currentEditors) {
                    const tempModel = editor.getModel();
                    if (tempModel && tempModel !== model && tempModel.uri.scheme === network_1.Schemas.vscodeNotebookCell) {
                        currentModels.push(tempModel);
                    }
                }
                return currentModels;
            }
            // inline case
            // ? current works when highlighting outside of an inline diff, highlighting in.
            // ? broken when highlighting within a diff editor. highlighting the main editor does not work
            // ? editor group service could be useful here
            const currentModels = [];
            const currentEditors = this.codeEditorService.listCodeEditors();
            for (const editor of currentEditors) {
                if (!(0, editorBrowser_1.isDiffEditor)(editor)) {
                    continue;
                }
                const diffModel = editor.getModel();
                if (!diffModel) {
                    continue;
                }
                if (model === diffModel.modified) { // embedded inline chat diff would pass this, allowing highlights
                    //? currentModels.push(diffModel.original);
                    currentModels.push(diffModel.modified);
                }
            }
            if (currentModels.length) { // no matching editors have been found
                return currentModels;
            }
            // multi-doc OFF
            if (this.occurrencesHighlight === 'singleFile') {
                return [];
            }
            // multi-doc ON
            for (const editor of currentEditors) {
                const tempModel = editor.getModel();
                const isValidModel = tempModel && tempModel !== model;
                if (isValidModel) {
                    currentModels.push(tempModel);
                }
            }
            return currentModels;
        }
        _run() {
            let workerRequestIsValid;
            const hasTextFocus = this.editor.hasTextFocus();
            if (!hasTextFocus) { // new nb cell scrolled in, didChangeModel fires
                if (!WordHighlighter_1.query) { // no previous query, nothing to highlight off of
                    return;
                }
            }
            else { // has text focus
                const editorSelection = this.editor.getSelection();
                // ignore multiline selection
                if (!editorSelection || editorSelection.startLineNumber !== editorSelection.endLineNumber) {
                    WordHighlighter_1.query = null;
                    this._stopAll();
                    return;
                }
                const startColumn = editorSelection.startColumn;
                const endColumn = editorSelection.endColumn;
                const word = this._getWord();
                // The selection must be inside a word or surround one word at most
                if (!word || word.startColumn > startColumn || word.endColumn < endColumn) {
                    // no previous query, nothing to highlight
                    WordHighlighter_1.query = null;
                    this._stopAll();
                    return;
                }
                // All the effort below is trying to achieve this:
                // - when cursor is moved to a word, trigger immediately a findOccurrences request
                // - 250ms later after the last cursor move event, render the occurrences
                // - no flickering!
                workerRequestIsValid = (this.workerRequest && this.workerRequest.isValid(this.model, editorSelection, this.decorations));
                WordHighlighter_1.query = {
                    modelInfo: {
                        model: this.model,
                        selection: editorSelection,
                    },
                    word: word
                };
            }
            // There are 4 cases:
            // a) old workerRequest is valid & completed, renderDecorationsTimer fired
            // b) old workerRequest is valid & completed, renderDecorationsTimer not fired
            // c) old workerRequest is valid, but not completed
            // d) old workerRequest is not valid
            // For a) no action is needed
            // For c), member 'lastCursorPositionChangeTime' will be used when installing the timer so no action is needed
            this.lastCursorPositionChangeTime = (new Date()).getTime();
            if (workerRequestIsValid) {
                if (this.workerRequestCompleted && this.renderDecorationsTimer !== -1) {
                    // case b)
                    // Delay the firing of renderDecorationsTimer by an extra 250 ms
                    clearTimeout(this.renderDecorationsTimer);
                    this.renderDecorationsTimer = -1;
                    this._beginRenderDecorations();
                }
            }
            else {
                // case d)
                // Stop all previous actions and start fresh
                this._stopAll();
                const myRequestId = ++this.workerRequestTokenId;
                this.workerRequestCompleted = false;
                const otherModelsToHighlight = this.getOtherModelsToHighlight(this.editor.getModel());
                // when reaching here, there are two possible states.
                // 		1) we have text focus, and a valid query was updated.
                // 		2) we do not have text focus, and a valid query is cached.
                // the query will ALWAYS have the correct data for the current highlight request, so it can always be passed to the workerRequest safely
                if (!WordHighlighter_1.query.modelInfo || WordHighlighter_1.query.modelInfo.model.isDisposed()) {
                    return;
                }
                this.workerRequest = this.computeWithModel(WordHighlighter_1.query.modelInfo.model, WordHighlighter_1.query.modelInfo.selection, WordHighlighter_1.query.word, otherModelsToHighlight);
                this.workerRequest?.result.then(data => {
                    if (myRequestId === this.workerRequestTokenId) {
                        this.workerRequestCompleted = true;
                        this.workerRequestValue = data || [];
                        this._beginRenderDecorations();
                    }
                }, errors_1.onUnexpectedError);
            }
        }
        computeWithModel(model, selection, word, otherModels) {
            if (!otherModels.length) {
                return computeOccurencesAtPosition(this.providers, model, selection, word, this.editor.getOption(131 /* EditorOption.wordSeparators */));
            }
            else {
                return computeOccurencesMultiModel(this.multiDocumentProviders, model, selection, word, this.editor.getOption(131 /* EditorOption.wordSeparators */), otherModels);
            }
        }
        _beginRenderDecorations() {
            const currentTime = (new Date()).getTime();
            const minimumRenderTime = this.lastCursorPositionChangeTime + 250;
            if (currentTime >= minimumRenderTime) {
                // Synchronous
                this.renderDecorationsTimer = -1;
                this.renderDecorations();
            }
            else {
                // Asynchronous
                this.renderDecorationsTimer = setTimeout(() => {
                    this.renderDecorations();
                }, (minimumRenderTime - currentTime));
            }
        }
        renderDecorations() {
            this.renderDecorationsTimer = -1;
            // create new loop, iterate over current editors using this.codeEditorService.listCodeEditors(),
            // if the URI of that codeEditor is in the map, then add the decorations to the decorations array
            // then set the decorations for the editor
            const currentEditors = this.codeEditorService.listCodeEditors();
            for (const editor of currentEditors) {
                const editorHighlighterContrib = WordHighlighterContribution.get(editor);
                if (!editorHighlighterContrib) {
                    continue;
                }
                const newDecorations = [];
                const uri = editor.getModel()?.uri;
                if (uri && this.workerRequestValue.has(uri)) {
                    const oldDecorationIDs = WordHighlighter_1.storedDecorations.get(uri);
                    const newDocumentHighlights = this.workerRequestValue.get(uri);
                    if (newDocumentHighlights) {
                        for (const highlight of newDocumentHighlights) {
                            if (!highlight.range) {
                                continue;
                            }
                            newDecorations.push({
                                range: highlight.range,
                                options: (0, highlightDecorations_1.getHighlightDecorationOptions)(highlight.kind)
                            });
                        }
                    }
                    let newDecorationIDs = [];
                    editor.changeDecorations((changeAccessor) => {
                        newDecorationIDs = changeAccessor.deltaDecorations(oldDecorationIDs ?? [], newDecorations);
                    });
                    WordHighlighter_1.storedDecorations = WordHighlighter_1.storedDecorations.set(uri, newDecorationIDs);
                    if (newDecorations.length > 0) {
                        editorHighlighterContrib.wordHighlighter?.decorations.set(newDecorations);
                        editorHighlighterContrib.wordHighlighter?._hasWordHighlights.set(true);
                    }
                }
            }
        }
        dispose() {
            this._stopSingular();
            this.toUnhook.dispose();
        }
    };
    WordHighlighter = WordHighlighter_1 = __decorate([
        __param(4, codeEditorService_1.ICodeEditorService)
    ], WordHighlighter);
    let WordHighlighterContribution = class WordHighlighterContribution extends lifecycle_1.Disposable {
        static { WordHighlighterContribution_1 = this; }
        static { this.ID = 'editor.contrib.wordHighlighter'; }
        static get(editor) {
            return editor.getContribution(WordHighlighterContribution_1.ID);
        }
        constructor(editor, contextKeyService, languageFeaturesService, codeEditorService) {
            super();
            this._wordHighlighter = null;
            const createWordHighlighterIfPossible = () => {
                if (editor.hasModel() && !editor.getModel().isTooLargeForTokenization()) {
                    this._wordHighlighter = new WordHighlighter(editor, languageFeaturesService.documentHighlightProvider, languageFeaturesService.multiDocumentHighlightProvider, contextKeyService, codeEditorService);
                }
            };
            this._register(editor.onDidChangeModel((e) => {
                if (this._wordHighlighter) {
                    this._wordHighlighter.dispose();
                    this._wordHighlighter = null;
                }
                createWordHighlighterIfPossible();
            }));
            createWordHighlighterIfPossible();
        }
        get wordHighlighter() {
            return this._wordHighlighter;
        }
        saveViewState() {
            if (this._wordHighlighter && this._wordHighlighter.hasDecorations()) {
                return true;
            }
            return false;
        }
        moveNext() {
            this._wordHighlighter?.moveNext();
        }
        moveBack() {
            this._wordHighlighter?.moveBack();
        }
        restoreViewState(state) {
            if (this._wordHighlighter && state) {
                this._wordHighlighter.restore();
            }
        }
        stopHighlighting() {
            this._wordHighlighter?.stop();
        }
        dispose() {
            if (this._wordHighlighter) {
                this._wordHighlighter.dispose();
                this._wordHighlighter = null;
            }
            super.dispose();
        }
    };
    exports.WordHighlighterContribution = WordHighlighterContribution;
    exports.WordHighlighterContribution = WordHighlighterContribution = WordHighlighterContribution_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, languageFeatures_1.ILanguageFeaturesService),
        __param(3, codeEditorService_1.ICodeEditorService)
    ], WordHighlighterContribution);
    class WordHighlightNavigationAction extends editorExtensions_1.EditorAction {
        constructor(next, opts) {
            super(opts);
            this._isNext = next;
        }
        run(accessor, editor) {
            const controller = WordHighlighterContribution.get(editor);
            if (!controller) {
                return;
            }
            if (this._isNext) {
                controller.moveNext();
            }
            else {
                controller.moveBack();
            }
        }
    }
    class NextWordHighlightAction extends WordHighlightNavigationAction {
        constructor() {
            super(true, {
                id: 'editor.action.wordHighlight.next',
                label: nls.localize('wordHighlight.next.label', "Go to Next Symbol Highlight"),
                alias: 'Go to Next Symbol Highlight',
                precondition: ctxHasWordHighlights,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 65 /* KeyCode.F7 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    class PrevWordHighlightAction extends WordHighlightNavigationAction {
        constructor() {
            super(false, {
                id: 'editor.action.wordHighlight.prev',
                label: nls.localize('wordHighlight.previous.label', "Go to Previous Symbol Highlight"),
                alias: 'Go to Previous Symbol Highlight',
                precondition: ctxHasWordHighlights,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* KeyMod.Shift */ | 65 /* KeyCode.F7 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    class TriggerWordHighlightAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.wordHighlight.trigger',
                label: nls.localize('wordHighlight.trigger.label', "Trigger Symbol Highlight"),
                alias: 'Trigger Symbol Highlight',
                precondition: ctxHasWordHighlights.toNegated(),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 0,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor, args) {
            const controller = WordHighlighterContribution.get(editor);
            if (!controller) {
                return;
            }
            controller.restoreViewState(true);
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(WordHighlighterContribution.ID, WordHighlighterContribution, 0 /* EditorContributionInstantiation.Eager */); // eager because it uses `saveViewState`/`restoreViewState`
    (0, editorExtensions_1.registerEditorAction)(NextWordHighlightAction);
    (0, editorExtensions_1.registerEditorAction)(PrevWordHighlightAction);
    (0, editorExtensions_1.registerEditorAction)(TriggerWordHighlightAction);
});
// registerEditorFeature(TextualMultiDocumentHighlightFeature);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZEhpZ2hsaWdodGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi93b3JkSGlnaGxpZ2h0ZXIvYnJvd3Nlci93b3JkSGlnaGxpZ2h0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFDaEcsNERBaUJDO0lBRUQsZ0ZBZ0JDO0lBeENELDZIQUE2SDtJQUM3SCwyRUFBMkU7SUFFM0UsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFcEYsU0FBZ0Isd0JBQXdCLENBQUMsUUFBNEQsRUFBRSxLQUFpQixFQUFFLFFBQWtCLEVBQUUsS0FBd0I7UUFDckssTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUUvQyxpREFBaUQ7UUFDakQsNENBQTRDO1FBQzVDLDRCQUE0QjtRQUM1QixPQUFPLElBQUEsYUFBSyxFQUF5QyxjQUFjLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFO1lBQ3hGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMseUJBQXlCLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztpQkFDaEYsSUFBSSxDQUFDLFNBQVMsRUFBRSxrQ0FBeUIsQ0FBQyxDQUFDO1FBQzlDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDekMsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDWixNQUFNLEdBQUcsR0FBRyxJQUFJLGlCQUFXLEVBQXVCLENBQUM7Z0JBQ25ELEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFD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