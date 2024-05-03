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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stream", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/common/core/eolCounter", "vs/editor/common/core/indentation", "vs/editor/common/core/lineRange", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/core/textModelDefaults", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/model", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsImpl", "vs/editor/common/model/bracketPairsTextModelPart/colorizedBracketPairsDecorationProvider", "vs/editor/common/model/editStack", "vs/editor/common/model/guidesTextModelPart", "vs/editor/common/model/indentationGuesser", "vs/editor/common/model/intervalTree", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBuffer", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder", "vs/editor/common/model/textModelSearch", "vs/editor/common/model/tokenizationTextModelPart", "vs/editor/common/textModelEvents", "vs/platform/undoRedo/common/undoRedo"], function (require, exports, arrays_1, color_1, errors_1, event_1, lifecycle_1, stream_1, strings, uri_1, eolCounter_1, indentation_1, lineRange_1, position_1, range_1, selection_1, textModelDefaults_1, language_1, languageConfigurationRegistry_1, model, bracketPairsImpl_1, colorizedBracketPairsDecorationProvider_1, editStack_1, guidesTextModelPart_1, indentationGuesser_1, intervalTree_1, pieceTreeTextBuffer_1, pieceTreeTextBufferBuilder_1, textModelSearch_1, tokenizationTextModelPart_1, textModelEvents_1, undoRedo_1) {
    "use strict";
    var TextModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AttachedViews = exports.ModelDecorationOptions = exports.ModelDecorationInjectedTextOptions = exports.ModelDecorationMinimapOptions = exports.ModelDecorationGlyphMarginOptions = exports.ModelDecorationOverviewRulerOptions = exports.TextModel = void 0;
    exports.createTextBufferFactory = createTextBufferFactory;
    exports.createTextBufferFactoryFromStream = createTextBufferFactoryFromStream;
    exports.createTextBufferFactoryFromSnapshot = createTextBufferFactoryFromSnapshot;
    exports.createTextBuffer = createTextBuffer;
    function createTextBufferFactory(text) {
        const builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
        builder.acceptChunk(text);
        return builder.finish();
    }
    function createTextBufferFactoryFromStream(stream) {
        return new Promise((resolve, reject) => {
            const builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
            let done = false;
            (0, stream_1.listenStream)(stream, {
                onData: chunk => {
                    builder.acceptChunk((typeof chunk === 'string') ? chunk : chunk.toString());
                },
                onError: error => {
                    if (!done) {
                        done = true;
                        reject(error);
                    }
                },
                onEnd: () => {
                    if (!done) {
                        done = true;
                        resolve(builder.finish());
                    }
                }
            });
        });
    }
    function createTextBufferFactoryFromSnapshot(snapshot) {
        const builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
        let chunk;
        while (typeof (chunk = snapshot.read()) === 'string') {
            builder.acceptChunk(chunk);
        }
        return builder.finish();
    }
    function createTextBuffer(value, defaultEOL) {
        let factory;
        if (typeof value === 'string') {
            factory = createTextBufferFactory(value);
        }
        else if (model.isITextSnapshot(value)) {
            factory = createTextBufferFactoryFromSnapshot(value);
        }
        else {
            factory = value;
        }
        return factory.create(defaultEOL);
    }
    let MODEL_ID = 0;
    const LIMIT_FIND_COUNT = 999;
    const LONG_LINE_BOUNDARY = 10000;
    class TextModelSnapshot {
        constructor(source) {
            this._source = source;
            this._eos = false;
        }
        read() {
            if (this._eos) {
                return null;
            }
            const result = [];
            let resultCnt = 0;
            let resultLength = 0;
            do {
                const tmp = this._source.read();
                if (tmp === null) {
                    // end-of-stream
                    this._eos = true;
                    if (resultCnt === 0) {
                        return null;
                    }
                    else {
                        return result.join('');
                    }
                }
                if (tmp.length > 0) {
                    result[resultCnt++] = tmp;
                    resultLength += tmp.length;
                }
                if (resultLength >= 64 * 1024) {
                    return result.join('');
                }
            } while (true);
        }
    }
    const invalidFunc = () => { throw new Error(`Invalid change accessor`); };
    var StringOffsetValidationType;
    (function (StringOffsetValidationType) {
        /**
         * Even allowed in surrogate pairs
         */
        StringOffsetValidationType[StringOffsetValidationType["Relaxed"] = 0] = "Relaxed";
        /**
         * Not allowed in surrogate pairs
         */
        StringOffsetValidationType[StringOffsetValidationType["SurrogatePairs"] = 1] = "SurrogatePairs";
    })(StringOffsetValidationType || (StringOffsetValidationType = {}));
    let TextModel = class TextModel extends lifecycle_1.Disposable {
        static { TextModel_1 = this; }
        static { this._MODEL_SYNC_LIMIT = 50 * 1024 * 1024; } // 50 MB,  // used in tests
        static { this.LARGE_FILE_SIZE_THRESHOLD = 20 * 1024 * 1024; } // 20 MB;
        static { this.LARGE_FILE_LINE_COUNT_THRESHOLD = 300 * 1000; } // 300K lines
        static { this.LARGE_FILE_HEAP_OPERATION_THRESHOLD = 256 * 1024 * 1024; } // 256M characters, usually ~> 512MB memory usage
        static { this.DEFAULT_CREATION_OPTIONS = {
            isForSimpleWidget: false,
            tabSize: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.tabSize,
            indentSize: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.indentSize,
            insertSpaces: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.insertSpaces,
            detectIndentation: false,
            defaultEOL: 1 /* model.DefaultEndOfLine.LF */,
            trimAutoWhitespace: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.trimAutoWhitespace,
            largeFileOptimizations: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.largeFileOptimizations,
            bracketPairColorizationOptions: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.bracketPairColorizationOptions,
        }; }
        static resolveOptions(textBuffer, options) {
            if (options.detectIndentation) {
                const guessedIndentation = (0, indentationGuesser_1.guessIndentation)(textBuffer, options.tabSize, options.insertSpaces);
                return new model.TextModelResolvedOptions({
                    tabSize: guessedIndentation.tabSize,
                    indentSize: 'tabSize', // TODO@Alex: guess indentSize independent of tabSize
                    insertSpaces: guessedIndentation.insertSpaces,
                    trimAutoWhitespace: options.trimAutoWhitespace,
                    defaultEOL: options.defaultEOL,
                    bracketPairColorizationOptions: options.bracketPairColorizationOptions,
                });
            }
            return new model.TextModelResolvedOptions(options);
        }
        get onDidChangeLanguage() { return this._tokenizationTextModelPart.onDidChangeLanguage; }
        get onDidChangeLanguageConfiguration() { return this._tokenizationTextModelPart.onDidChangeLanguageConfiguration; }
        get onDidChangeTokens() { return this._tokenizationTextModelPart.onDidChangeTokens; }
        onDidChangeContent(listener) {
            return this._eventEmitter.slowEvent((e) => listener(e.contentChangedEvent));
        }
        onDidChangeContentOrInjectedText(listener) {
            return (0, lifecycle_1.combinedDisposable)(this._eventEmitter.fastEvent(e => listener(e)), this._onDidChangeInjectedText.event(e => listener(e)));
        }
        _isDisposing() { return this.__isDisposing; }
        get tokenization() { return this._tokenizationTextModelPart; }
        get bracketPairs() { return this._bracketPairs; }
        get guides() { return this._guidesTextModelPart; }
        constructor(source, languageIdOrSelection, creationOptions, associatedResource = null, _undoRedoService, _languageService, _languageConfigurationService) {
            super();
            this._undoRedoService = _undoRedoService;
            this._languageService = _languageService;
            this._languageConfigurationService = _languageConfigurationService;
            //#region Events
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this._onDidChangeDecorations = this._register(new DidChangeDecorationsEmitter(affectedInjectedTextLines => this.handleBeforeFireDecorationsChangedEvent(affectedInjectedTextLines)));
            this.onDidChangeDecorations = this._onDidChangeDecorations.event;
            this._onDidChangeOptions = this._register(new event_1.Emitter());
            this.onDidChangeOptions = this._onDidChangeOptions.event;
            this._onDidChangeAttached = this._register(new event_1.Emitter());
            this.onDidChangeAttached = this._onDidChangeAttached.event;
            this._onDidChangeInjectedText = this._register(new event_1.Emitter());
            this._eventEmitter = this._register(new DidChangeContentEmitter());
            this._languageSelectionListener = this._register(new lifecycle_1.MutableDisposable());
            this._deltaDecorationCallCnt = 0;
            this._attachedViews = new AttachedViews();
            // Generate a new unique model id
            MODEL_ID++;
            this.id = '$model' + MODEL_ID;
            this.isForSimpleWidget = creationOptions.isForSimpleWidget;
            if (typeof associatedResource === 'undefined' || associatedResource === null) {
                this._associatedResource = uri_1.URI.parse('inmemory://model/' + MODEL_ID);
            }
            else {
                this._associatedResource = associatedResource;
            }
            this._attachedEditorCount = 0;
            const { textBuffer, disposable } = createTextBuffer(source, creationOptions.defaultEOL);
            this._buffer = textBuffer;
            this._bufferDisposable = disposable;
            this._options = TextModel_1.resolveOptions(this._buffer, creationOptions);
            const languageId = (typeof languageIdOrSelection === 'string' ? languageIdOrSelection : languageIdOrSelection.languageId);
            if (typeof languageIdOrSelection !== 'string') {
                this._languageSelectionListener.value = languageIdOrSelection.onDidChange(() => this._setLanguage(languageIdOrSelection.languageId));
            }
            this._bracketPairs = this._register(new bracketPairsImpl_1.BracketPairsTextModelPart(this, this._languageConfigurationService));
            this._guidesTextModelPart = this._register(new guidesTextModelPart_1.GuidesTextModelPart(this, this._languageConfigurationService));
            this._decorationProvider = this._register(new colorizedBracketPairsDecorationProvider_1.ColorizedBracketPairsDecorationProvider(this));
            this._tokenizationTextModelPart = new tokenizationTextModelPart_1.TokenizationTextModelPart(this._languageService, this._languageConfigurationService, this, this._bracketPairs, languageId, this._attachedViews);
            const bufferLineCount = this._buffer.getLineCount();
            const bufferTextLength = this._buffer.getValueLengthInRange(new range_1.Range(1, 1, bufferLineCount, this._buffer.getLineLength(bufferLineCount) + 1), 0 /* model.EndOfLinePreference.TextDefined */);
            // !!! Make a decision in the ctor and permanently respect this decision !!!
            // If a model is too large at construction time, it will never get tokenized,
            // under no circumstances.
            if (creationOptions.largeFileOptimizations) {
                this._isTooLargeForTokenization = ((bufferTextLength > TextModel_1.LARGE_FILE_SIZE_THRESHOLD)
                    || (bufferLineCount > TextModel_1.LARGE_FILE_LINE_COUNT_THRESHOLD));
                this._isTooLargeForHeapOperation = bufferTextLength > TextModel_1.LARGE_FILE_HEAP_OPERATION_THRESHOLD;
            }
            else {
                this._isTooLargeForTokenization = false;
                this._isTooLargeForHeapOperation = false;
            }
            this._isTooLargeForSyncing = (bufferTextLength > TextModel_1._MODEL_SYNC_LIMIT);
            this._versionId = 1;
            this._alternativeVersionId = 1;
            this._initialUndoRedoSnapshot = null;
            this._isDisposed = false;
            this.__isDisposing = false;
            this._instanceId = strings.singleLetterHash(MODEL_ID);
            this._lastDecorationId = 0;
            this._decorations = Object.create(null);
            this._decorationsTree = new DecorationsTrees();
            this._commandManager = new editStack_1.EditStack(this, this._undoRedoService);
            this._isUndoing = false;
            this._isRedoing = false;
            this._trimAutoWhitespaceLines = null;
            this._register(this._decorationProvider.onDidChange(() => {
                this._onDidChangeDecorations.beginDeferredEmit();
                this._onDidChangeDecorations.fire();
                this._onDidChangeDecorations.endDeferredEmit();
            }));
            this._languageService.requestRichLanguageFeatures(languageId);
        }
        dispose() {
            this.__isDisposing = true;
            this._onWillDispose.fire();
            this._tokenizationTextModelPart.dispose();
            this._isDisposed = true;
            super.dispose();
            this._bufferDisposable.dispose();
            this.__isDisposing = false;
            // Manually release reference to previous text buffer to avoid large leaks
            // in case someone leaks a TextModel reference
            const emptyDisposedTextBuffer = new pieceTreeTextBuffer_1.PieceTreeTextBuffer([], '', '\n', false, false, true, true);
            emptyDisposedTextBuffer.dispose();
            this._buffer = emptyDisposedTextBuffer;
            this._bufferDisposable = lifecycle_1.Disposable.None;
        }
        _hasListeners() {
            return (this._onWillDispose.hasListeners()
                || this._onDidChangeDecorations.hasListeners()
                || this._tokenizationTextModelPart._hasListeners()
                || this._onDidChangeOptions.hasListeners()
                || this._onDidChangeAttached.hasListeners()
                || this._onDidChangeInjectedText.hasListeners()
                || this._eventEmitter.hasListeners());
        }
        _assertNotDisposed() {
            if (this._isDisposed) {
                throw new Error('Model is disposed!');
            }
        }
        equalsTextBuffer(other) {
            this._assertNotDisposed();
            return this._buffer.equals(other);
        }
        getTextBuffer() {
            this._assertNotDisposed();
            return this._buffer;
        }
        _emitContentChangedEvent(rawChange, change) {
            if (this.__isDisposing) {
                // Do not confuse listeners by emitting any event after disposing
                return;
            }
            this._tokenizationTextModelPart.handleDidChangeContent(change);
            this._bracketPairs.handleDidChangeContent(change);
            this._eventEmitter.fire(new textModelEvents_1.InternalModelContentChangeEvent(rawChange, change));
        }
        setValue(value) {
            this._assertNotDisposed();
            if (value === null || value === undefined) {
                throw (0, errors_1.illegalArgument)();
            }
            const { textBuffer, disposable } = createTextBuffer(value, this._options.defaultEOL);
            this._setValueFromTextBuffer(textBuffer, disposable);
        }
        _createContentChanged2(range, rangeOffset, rangeLength, text, isUndoing, isRedoing, isFlush, isEolChange) {
            return {
                changes: [{
                        range: range,
                        rangeOffset: rangeOffset,
                        rangeLength: rangeLength,
                        text: text,
                    }],
                eol: this._buffer.getEOL(),
                isEolChange: isEolChange,
                versionId: this.getVersionId(),
                isUndoing: isUndoing,
                isRedoing: isRedoing,
                isFlush: isFlush
            };
        }
        _setValueFromTextBuffer(textBuffer, textBufferDisposable) {
            this._assertNotDisposed();
            const oldFullModelRange = this.getFullModelRange();
            const oldModelValueLength = this.getValueLengthInRange(oldFullModelRange);
            const endLineNumber = this.getLineCount();
            const endColumn = this.getLineMaxColumn(endLineNumber);
            this._buffer = textBuffer;
            this._bufferDisposable.dispose();
            this._bufferDisposable = textBufferDisposable;
            this._increaseVersionId();
            // Destroy all my decorations
            this._decorations = Object.create(null);
            this._decorationsTree = new DecorationsTrees();
            // Destroy my edit history and settings
            this._commandManager.clear();
            this._trimAutoWhitespaceLines = null;
            this._emitContentChangedEvent(new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawFlush()
            ], this._versionId, false, false), this._createContentChanged2(new range_1.Range(1, 1, endLineNumber, endColumn), 0, oldModelValueLength, this.getValue(), false, false, true, false));
        }
        setEOL(eol) {
            this._assertNotDisposed();
            const newEOL = (eol === 1 /* model.EndOfLineSequence.CRLF */ ? '\r\n' : '\n');
            if (this._buffer.getEOL() === newEOL) {
                // Nothing to do
                return;
            }
            const oldFullModelRange = this.getFullModelRange();
            const oldModelValueLength = this.getValueLengthInRange(oldFullModelRange);
            const endLineNumber = this.getLineCount();
            const endColumn = this.getLineMaxColumn(endLineNumber);
            this._onBeforeEOLChange();
            this._buffer.setEOL(newEOL);
            this._increaseVersionId();
            this._onAfterEOLChange();
            this._emitContentChangedEvent(new textModelEvents_1.ModelRawContentChangedEvent([
                new textModelEvents_1.ModelRawEOLChanged()
            ], this._versionId, false, false), this._createContentChanged2(new range_1.Range(1, 1, endLineNumber, endColumn), 0, oldModelValueLength, this.getValue(), false, false, false, true));
        }
        _onBeforeEOLChange() {
            // Ensure all decorations get their `range` set.
            this._decorationsTree.ensureAllNodesHaveRanges(this);
        }
        _onAfterEOLChange() {
            // Transform back `range` to offsets
            const versionId = this.getVersionId();
            const allDecorations = this._decorationsTree.collectNodesPostOrder();
            for (let i = 0, len = allDecorations.length; i < len; i++) {
                const node = allDecorations[i];
                const range = node.range; // the range is defined due to `_onBeforeEOLChange`
                const delta = node.cachedAbsoluteStart - node.start;
                const startOffset = this._buffer.getOffsetAt(range.startLineNumber, range.startColumn);
                const endOffset = this._buffer.getOffsetAt(range.endLineNumber, range.endColumn);
                node.cachedAbsoluteStart = startOffset;
                node.cachedAbsoluteEnd = endOffset;
                node.cachedVersionId = versionId;
                node.start = startOffset - delta;
                node.end = endOffset - delta;
                (0, intervalTree_1.recomputeMaxEnd)(node);
            }
        }
        onBeforeAttached() {
            this._attachedEditorCount++;
            if (this._attachedEditorCount === 1) {
                this._tokenizationTextModelPart.handleDidChangeAttached();
                this._onDidChangeAttached.fire(undefined);
            }
            return this._attachedViews.attachView();
        }
        onBeforeDetached(view) {
            this._attachedEditorCount--;
            if (this._attachedEditorCount === 0) {
                this._tokenizationTextModelPart.handleDidChangeAttached();
                this._onDidChangeAttached.fire(undefined);
            }
            this._attachedViews.detachView(view);
        }
        isAttachedToEditor() {
            return this._attachedEditorCount > 0;
        }
        getAttachedEditorCount() {
            return this._attachedEditorCount;
        }
        isTooLargeForSyncing() {
            return this._isTooLargeForSyncing;
        }
        isTooLargeForTokenization() {
            return this._isTooLargeForTokenization;
        }
        isTooLargeForHeapOperation() {
            return this._isTooLargeForHeapOperation;
        }
        isDisposed() {
            return this._isDisposed;
        }
        isDominatedByLongLines() {
            this._assertNotDisposed();
            if (this.isTooLargeForTokenization()) {
                // Cannot word wrap huge files anyways, so it doesn't really matter
                return false;
            }
            let smallLineCharCount = 0;
            let longLineCharCount = 0;
            const lineCount = this._buffer.getLineCount();
            for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
                const lineLength = this._buffer.getLineLength(lineNumber);
                if (lineLength >= LONG_LINE_BOUNDARY) {
                    longLineCharCount += lineLength;
                }
                else {
                    smallLineCharCount += lineLength;
                }
            }
            return (longLineCharCount > smallLineCharCount);
        }
        get uri() {
            return this._associatedResource;
        }
        //#region Options
        getOptions() {
            this._assertNotDisposed();
            return this._options;
        }
        getFormattingOptions() {
            return {
                tabSize: this._options.indentSize,
                insertSpaces: this._options.insertSpaces
            };
        }
        updateOptions(_newOpts) {
            this._assertNotDisposed();
            const tabSize = (typeof _newOpts.tabSize !== 'undefined') ? _newOpts.tabSize : this._options.tabSize;
            const indentSize = (typeof _newOpts.indentSize !== 'undefined') ? _newOpts.indentSize : this._options.originalIndentSize;
            const insertSpaces = (typeof _newOpts.insertSpaces !== 'undefined') ? _newOpts.insertSpaces : this._options.insertSpaces;
            const trimAutoWhitespace = (typeof _newOpts.trimAutoWhitespace !== 'undefined') ? _newOpts.trimAutoWhitespace : this._options.trimAutoWhitespace;
            const bracketPairColorizationOptions = (typeof _newOpts.bracketColorizationOptions !== 'undefined') ? _newOpts.bracketColorizationOptions : this._options.bracketPairColorizationOptions;
            const newOpts = new model.TextModelResolvedOptions({
                tabSize: tabSize,
                indentSize: indentSize,
                insertSpaces: insertSpaces,
                defaultEOL: this._options.defaultEOL,
                trimAutoWhitespace: trimAutoWhitespace,
                bracketPairColorizationOptions,
            });
            if (this._options.equals(newOpts)) {
                return;
            }
            const e = this._options.createChangeEvent(newOpts);
            this._options = newOpts;
            this._bracketPairs.handleDidChangeOptions(e);
            this._decorationProvider.handleDidChangeOptions(e);
            this._onDidChangeOptions.fire(e);
        }
        detectIndentation(defaultInsertSpaces, defaultTabSize) {
            this._assertNotDisposed();
            const guessedIndentation = (0, indentationGuesser_1.guessIndentation)(this._buffer, defaultTabSize, defaultInsertSpaces);
            this.updateOptions({
                insertSpaces: guessedIndentation.insertSpaces,
                tabSize: guessedIndentation.tabSize,
                indentSize: guessedIndentation.tabSize, // TODO@Alex: guess indentSize independent of tabSize
            });
        }
        normalizeIndentation(str) {
            this._assertNotDisposed();
            return (0, indentation_1.normalizeIndentation)(str, this._options.indentSize, this._options.insertSpaces);
        }
        //#endregion
        //#region Reading
        getVersionId() {
            this._assertNotDisposed();
            return this._versionId;
        }
        mightContainRTL() {
            return this._buffer.mightContainRTL();
        }
        mightContainUnusualLineTerminators() {
            return this._buffer.mightContainUnusualLineTerminators();
        }
        removeUnusualLineTerminators(selections = null) {
            const matches = this.findMatches(strings.UNUSUAL_LINE_TERMINATORS.source, false, true, false, null, false, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
            this._buffer.resetMightContainUnusualLineTerminators();
            this.pushEditOperations(selections, matches.map(m => ({ range: m.range, text: null })), () => null);
        }
        mightContainNonBasicASCII() {
            return this._buffer.mightContainNonBasicASCII();
        }
        getAlternativeVersionId() {
            this._assertNotDisposed();
            return this._alternativeVersionId;
        }
        getInitialUndoRedoSnapshot() {
            this._assertNotDisposed();
            return this._initialUndoRedoSnapshot;
        }
        getOffsetAt(rawPosition) {
            this._assertNotDisposed();
            const position = this._validatePosition(rawPosition.lineNumber, rawPosition.column, 0 /* StringOffsetValidationType.Relaxed */);
            return this._buffer.getOffsetAt(position.lineNumber, position.column);
        }
        getPositionAt(rawOffset) {
            this._assertNotDisposed();
            const offset = (Math.min(this._buffer.getLength(), Math.max(0, rawOffset)));
            return this._buffer.getPositionAt(offset);
        }
        _increaseVersionId() {
            this._versionId = this._versionId + 1;
            this._alternativeVersionId = this._versionId;
        }
        _overwriteVersionId(versionId) {
            this._versionId = versionId;
        }
        _overwriteAlternativeVersionId(newAlternativeVersionId) {
            this._alternativeVersionId = newAlternativeVersionId;
        }
        _overwriteInitialUndoRedoSnapshot(newInitialUndoRedoSnapshot) {
            this._initialUndoRedoSnapshot = newInitialUndoRedoSnapshot;
        }
        getValue(eol, preserveBOM = false) {
            this._assertNotDisposed();
            if (this.isTooLargeForHeapOperation()) {
                throw new errors_1.BugIndicatingError('Operation would exceed heap memory limits');
            }
            const fullModelRange = this.getFullModelRange();
            const fullModelValue = this.getValueInRange(fullModelRange, eol);
            if (preserveBOM) {
                return this._buffer.getBOM() + fullModelValue;
            }
            return fullModelValue;
        }
        createSnapshot(preserveBOM = false) {
            return new TextModelSnapshot(this._buffer.createSnapshot(preserveBOM));
        }
        getValueLength(eol, preserveBOM = false) {
            this._assertNotDisposed();
            const fullModelRange = this.getFullModelRange();
            const fullModelValue = this.getValueLengthInRange(fullModelRange, eol);
            if (preserveBOM) {
                return this._buffer.getBOM().length + fullModelValue;
            }
            return fullModelValue;
        }
        getValueInRange(rawRange, eol = 0 /* model.EndOfLinePreference.TextDefined */) {
            this._assertNotDisposed();
            return this._buffer.getValueInRange(this.validateRange(rawRange), eol);
        }
        getValueLengthInRange(rawRange, eol = 0 /* model.EndOfLinePreference.TextDefined */) {
            this._assertNotDisposed();
            return this._buffer.getValueLengthInRange(this.validateRange(rawRange), eol);
        }
        getCharacterCountInRange(rawRange, eol = 0 /* model.EndOfLinePreference.TextDefined */) {
            this._assertNotDisposed();
            return this._buffer.getCharacterCountInRange(this.validateRange(rawRange), eol);
        }
        getLineCount() {
            this._assertNotDisposed();
            return this._buffer.getLineCount();
        }
        getLineContent(lineNumber) {
            this._assertNotDisposed();
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            return this._buffer.getLineContent(lineNumber);
        }
        getLineLength(lineNumber) {
            this._assertNotDisposed();
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            return this._buffer.getLineLength(lineNumber);
        }
        getLinesContent() {
            this._assertNotDisposed();
            if (this.isTooLargeForHeapOperation()) {
                throw new errors_1.BugIndicatingError('Operation would exceed heap memory limits');
            }
            return this._buffer.getLinesContent();
        }
        getEOL() {
            this._assertNotDisposed();
            return this._buffer.getEOL();
        }
        getEndOfLineSequence() {
            this._assertNotDisposed();
            return (this._buffer.getEOL() === '\n'
                ? 0 /* model.EndOfLineSequence.LF */
                : 1 /* model.EndOfLineSequence.CRLF */);
        }
        getLineMinColumn(lineNumber) {
            this._assertNotDisposed();
            return 1;
        }
        getLineMaxColumn(lineNumber) {
            this._assertNotDisposed();
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            return this._buffer.getLineLength(lineNumber) + 1;
        }
        getLineFirstNonWhitespaceColumn(lineNumber) {
            this._assertNotDisposed();
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            return this._buffer.getLineFirstNonWhitespaceColumn(lineNumber);
        }
        getLineLastNonWhitespaceColumn(lineNumber) {
            this._assertNotDisposed();
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            return this._buffer.getLineLastNonWhitespaceColumn(lineNumber);
        }
        /**
         * Validates `range` is within buffer bounds, but allows it to sit in between surrogate pairs, etc.
         * Will try to not allocate if possible.
         */
        _validateRangeRelaxedNoAllocations(range) {
            const linesCount = this._buffer.getLineCount();
            const initialStartLineNumber = range.startLineNumber;
            const initialStartColumn = range.startColumn;
            let startLineNumber = Math.floor((typeof initialStartLineNumber === 'number' && !isNaN(initialStartLineNumber)) ? initialStartLineNumber : 1);
            let startColumn = Math.floor((typeof initialStartColumn === 'number' && !isNaN(initialStartColumn)) ? initialStartColumn : 1);
            if (startLineNumber < 1) {
                startLineNumber = 1;
                startColumn = 1;
            }
            else if (startLineNumber > linesCount) {
                startLineNumber = linesCount;
                startColumn = this.getLineMaxColumn(startLineNumber);
            }
            else {
                if (startColumn <= 1) {
                    startColumn = 1;
                }
                else {
                    const maxColumn = this.getLineMaxColumn(startLineNumber);
                    if (startColumn >= maxColumn) {
                        startColumn = maxColumn;
                    }
                }
            }
            const initialEndLineNumber = range.endLineNumber;
            const initialEndColumn = range.endColumn;
            let endLineNumber = Math.floor((typeof initialEndLineNumber === 'number' && !isNaN(initialEndLineNumber)) ? initialEndLineNumber : 1);
            let endColumn = Math.floor((typeof initialEndColumn === 'number' && !isNaN(initialEndColumn)) ? initialEndColumn : 1);
            if (endLineNumber < 1) {
                endLineNumber = 1;
                endColumn = 1;
            }
            else if (endLineNumber > linesCount) {
                endLineNumber = linesCount;
                endColumn = this.getLineMaxColumn(endLineNumber);
            }
            else {
                if (endColumn <= 1) {
                    endColumn = 1;
                }
                else {
                    const maxColumn = this.getLineMaxColumn(endLineNumber);
                    if (endColumn >= maxColumn) {
                        endColumn = maxColumn;
                    }
                }
            }
            if (initialStartLineNumber === startLineNumber
                && initialStartColumn === startColumn
                && initialEndLineNumber === endLineNumber
                && initialEndColumn === endColumn
                && range instanceof range_1.Range
                && !(range instanceof selection_1.Selection)) {
                return range;
            }
            return new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
        }
        _isValidPosition(lineNumber, column, validationType) {
            if (typeof lineNumber !== 'number' || typeof column !== 'number') {
                return false;
            }
            if (isNaN(lineNumber) || isNaN(column)) {
                return false;
            }
            if (lineNumber < 1 || column < 1) {
                return false;
            }
            if ((lineNumber | 0) !== lineNumber || (column | 0) !== column) {
                return false;
            }
            const lineCount = this._buffer.getLineCount();
            if (lineNumber > lineCount) {
                return false;
            }
            if (column === 1) {
                return true;
            }
            const maxColumn = this.getLineMaxColumn(lineNumber);
            if (column > maxColumn) {
                return false;
            }
            if (validationType === 1 /* StringOffsetValidationType.SurrogatePairs */) {
                // !!At this point, column > 1
                const charCodeBefore = this._buffer.getLineCharCode(lineNumber, column - 2);
                if (strings.isHighSurrogate(charCodeBefore)) {
                    return false;
                }
            }
            return true;
        }
        _validatePosition(_lineNumber, _column, validationType) {
            const lineNumber = Math.floor((typeof _lineNumber === 'number' && !isNaN(_lineNumber)) ? _lineNumber : 1);
            const column = Math.floor((typeof _column === 'number' && !isNaN(_column)) ? _column : 1);
            const lineCount = this._buffer.getLineCount();
            if (lineNumber < 1) {
                return new position_1.Position(1, 1);
            }
            if (lineNumber > lineCount) {
                return new position_1.Position(lineCount, this.getLineMaxColumn(lineCount));
            }
            if (column <= 1) {
                return new position_1.Position(lineNumber, 1);
            }
            const maxColumn = this.getLineMaxColumn(lineNumber);
            if (column >= maxColumn) {
                return new position_1.Position(lineNumber, maxColumn);
            }
            if (validationType === 1 /* StringOffsetValidationType.SurrogatePairs */) {
                // If the position would end up in the middle of a high-low surrogate pair,
                // we move it to before the pair
                // !!At this point, column > 1
                const charCodeBefore = this._buffer.getLineCharCode(lineNumber, column - 2);
                if (strings.isHighSurrogate(charCodeBefore)) {
                    return new position_1.Position(lineNumber, column - 1);
                }
            }
            return new position_1.Position(lineNumber, column);
        }
        validatePosition(position) {
            const validationType = 1 /* StringOffsetValidationType.SurrogatePairs */;
            this._assertNotDisposed();
            // Avoid object allocation and cover most likely case
            if (position instanceof position_1.Position) {
                if (this._isValidPosition(position.lineNumber, position.column, validationType)) {
                    return position;
                }
            }
            return this._validatePosition(position.lineNumber, position.column, validationType);
        }
        _isValidRange(range, validationType) {
            const startLineNumber = range.startLineNumber;
            const startColumn = range.startColumn;
            const endLineNumber = range.endLineNumber;
            const endColumn = range.endColumn;
            if (!this._isValidPosition(startLineNumber, startColumn, 0 /* StringOffsetValidationType.Relaxed */)) {
                return false;
            }
            if (!this._isValidPosition(endLineNumber, endColumn, 0 /* StringOffsetValidationType.Relaxed */)) {
                return false;
            }
            if (validationType === 1 /* StringOffsetValidationType.SurrogatePairs */) {
                const charCodeBeforeStart = (startColumn > 1 ? this._buffer.getLineCharCode(startLineNumber, startColumn - 2) : 0);
                const charCodeBeforeEnd = (endColumn > 1 && endColumn <= this._buffer.getLineLength(endLineNumber) ? this._buffer.getLineCharCode(endLineNumber, endColumn - 2) : 0);
                const startInsideSurrogatePair = strings.isHighSurrogate(charCodeBeforeStart);
                const endInsideSurrogatePair = strings.isHighSurrogate(charCodeBeforeEnd);
                if (!startInsideSurrogatePair && !endInsideSurrogatePair) {
                    return true;
                }
                return false;
            }
            return true;
        }
        validateRange(_range) {
            const validationType = 1 /* StringOffsetValidationType.SurrogatePairs */;
            this._assertNotDisposed();
            // Avoid object allocation and cover most likely case
            if ((_range instanceof range_1.Range) && !(_range instanceof selection_1.Selection)) {
                if (this._isValidRange(_range, validationType)) {
                    return _range;
                }
            }
            const start = this._validatePosition(_range.startLineNumber, _range.startColumn, 0 /* StringOffsetValidationType.Relaxed */);
            const end = this._validatePosition(_range.endLineNumber, _range.endColumn, 0 /* StringOffsetValidationType.Relaxed */);
            const startLineNumber = start.lineNumber;
            const startColumn = start.column;
            const endLineNumber = end.lineNumber;
            const endColumn = end.column;
            if (validationType === 1 /* StringOffsetValidationType.SurrogatePairs */) {
                const charCodeBeforeStart = (startColumn > 1 ? this._buffer.getLineCharCode(startLineNumber, startColumn - 2) : 0);
                const charCodeBeforeEnd = (endColumn > 1 && endColumn <= this._buffer.getLineLength(endLineNumber) ? this._buffer.getLineCharCode(endLineNumber, endColumn - 2) : 0);
                const startInsideSurrogatePair = strings.isHighSurrogate(charCodeBeforeStart);
                const endInsideSurrogatePair = strings.isHighSurrogate(charCodeBeforeEnd);
                if (!startInsideSurrogatePair && !endInsideSurrogatePair) {
                    return new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
                }
                if (startLineNumber === endLineNumber && startColumn === endColumn) {
                    // do not expand a collapsed range, simply move it to a valid location
                    return new range_1.Range(startLineNumber, startColumn - 1, endLineNumber, endColumn - 1);
                }
                if (startInsideSurrogatePair && endInsideSurrogatePair) {
                    // expand range at both ends
                    return new range_1.Range(startLineNumber, startColumn - 1, endLineNumber, endColumn + 1);
                }
                if (startInsideSurrogatePair) {
                    // only expand range at the start
                    return new range_1.Range(startLineNumber, startColumn - 1, endLineNumber, endColumn);
                }
                // only expand range at the end
                return new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn + 1);
            }
            return new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
        }
        modifyPosition(rawPosition, offset) {
            this._assertNotDisposed();
            const candidate = this.getOffsetAt(rawPosition) + offset;
            return this.getPositionAt(Math.min(this._buffer.getLength(), Math.max(0, candidate)));
        }
        getFullModelRange() {
            this._assertNotDisposed();
            const lineCount = this.getLineCount();
            return new range_1.Range(1, 1, lineCount, this.getLineMaxColumn(lineCount));
        }
        findMatchesLineByLine(searchRange, searchData, captureMatches, limitResultCount) {
            return this._buffer.findMatchesLineByLine(searchRange, searchData, captureMatches, limitResultCount);
        }
        findMatches(searchString, rawSearchScope, isRegex, matchCase, wordSeparators, captureMatches, limitResultCount = LIMIT_FIND_COUNT) {
            this._assertNotDisposed();
            let searchRanges = null;
            if (rawSearchScope !== null) {
                if (!Array.isArray(rawSearchScope)) {
                    rawSearchScope = [rawSearchScope];
                }
                if (rawSearchScope.every((searchScope) => range_1.Range.isIRange(searchScope))) {
                    searchRanges = rawSearchScope.map((searchScope) => this.validateRange(searchScope));
                }
            }
            if (searchRanges === null) {
                searchRanges = [this.getFullModelRange()];
            }
            searchRanges = searchRanges.sort((d1, d2) => d1.startLineNumber - d2.startLineNumber || d1.startColumn - d2.startColumn);
            const uniqueSearchRanges = [];
            uniqueSearchRanges.push(searchRanges.reduce((prev, curr) => {
                if (range_1.Range.areIntersecting(prev, curr)) {
                    return prev.plusRange(curr);
                }
                uniqueSearchRanges.push(prev);
                return curr;
            }));
            let matchMapper;
            if (!isRegex && searchString.indexOf('\n') < 0) {
                // not regex, not multi line
                const searchParams = new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators);
                const searchData = searchParams.parseSearchRequest();
                if (!searchData) {
                    return [];
                }
                matchMapper = (searchRange) => this.findMatchesLineByLine(searchRange, searchData, captureMatches, limitResultCount);
            }
            else {
                matchMapper = (searchRange) => textModelSearch_1.TextModelSearch.findMatches(this, new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators), searchRange, captureMatches, limitResultCount);
            }
            return uniqueSearchRanges.map(matchMapper).reduce((arr, matches) => arr.concat(matches), []);
        }
        findNextMatch(searchString, rawSearchStart, isRegex, matchCase, wordSeparators, captureMatches) {
            this._assertNotDisposed();
            const searchStart = this.validatePosition(rawSearchStart);
            if (!isRegex && searchString.indexOf('\n') < 0) {
                const searchParams = new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators);
                const searchData = searchParams.parseSearchRequest();
                if (!searchData) {
                    return null;
                }
                const lineCount = this.getLineCount();
                let searchRange = new range_1.Range(searchStart.lineNumber, searchStart.column, lineCount, this.getLineMaxColumn(lineCount));
                let ret = this.findMatchesLineByLine(searchRange, searchData, captureMatches, 1);
                textModelSearch_1.TextModelSearch.findNextMatch(this, new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators), searchStart, captureMatches);
                if (ret.length > 0) {
                    return ret[0];
                }
                searchRange = new range_1.Range(1, 1, searchStart.lineNumber, this.getLineMaxColumn(searchStart.lineNumber));
                ret = this.findMatchesLineByLine(searchRange, searchData, captureMatches, 1);
                if (ret.length > 0) {
                    return ret[0];
                }
                return null;
            }
            return textModelSearch_1.TextModelSearch.findNextMatch(this, new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators), searchStart, captureMatches);
        }
        findPreviousMatch(searchString, rawSearchStart, isRegex, matchCase, wordSeparators, captureMatches) {
            this._assertNotDisposed();
            const searchStart = this.validatePosition(rawSearchStart);
            return textModelSearch_1.TextModelSearch.findPreviousMatch(this, new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators), searchStart, captureMatches);
        }
        //#endregion
        //#region Editing
        pushStackElement() {
            this._commandManager.pushStackElement();
        }
        popStackElement() {
            this._commandManager.popStackElement();
        }
        pushEOL(eol) {
            const currentEOL = (this.getEOL() === '\n' ? 0 /* model.EndOfLineSequence.LF */ : 1 /* model.EndOfLineSequence.CRLF */);
            if (currentEOL === eol) {
                return;
            }
            try {
                this._onDidChangeDecorations.beginDeferredEmit();
                this._eventEmitter.beginDeferredEmit();
                if (this._initialUndoRedoSnapshot === null) {
                    this._initialUndoRedoSnapshot = this._undoRedoService.createSnapshot(this.uri);
                }
                this._commandManager.pushEOL(eol);
            }
            finally {
                this._eventEmitter.endDeferredEmit();
                this._onDidChangeDecorations.endDeferredEmit();
            }
        }
        _validateEditOperation(rawOperation) {
            if (rawOperation instanceof model.ValidAnnotatedEditOperation) {
                return rawOperation;
            }
            return new model.ValidAnnotatedEditOperation(rawOperation.identifier || null, this.validateRange(rawOperation.range), rawOperation.text, rawOperation.forceMoveMarkers || false, rawOperation.isAutoWhitespaceEdit || false, rawOperation._isTracked || false);
        }
        _validateEditOperations(rawOperations) {
            const result = [];
            for (let i = 0, len = rawOperations.length; i < len; i++) {
                result[i] = this._validateEditOperation(rawOperations[i]);
            }
            return result;
        }
        pushEditOperations(beforeCursorState, editOperations, cursorStateComputer, group) {
            try {
                this._onDidChangeDecorations.beginDeferredEmit();
                this._eventEmitter.beginDeferredEmit();
                return this._pushEditOperations(beforeCursorState, this._validateEditOperations(editOperations), cursorStateComputer, group);
            }
            finally {
                this._eventEmitter.endDeferredEmit();
                this._onDidChangeDecorations.endDeferredEmit();
            }
        }
        _pushEditOperations(beforeCursorState, editOperations, cursorStateComputer, group) {
            if (this._options.trimAutoWhitespace && this._trimAutoWhitespaceLines) {
                // Go through each saved line number and insert a trim whitespace edit
                // if it is safe to do so (no conflicts with other edits).
                const incomingEdits = editOperations.map((op) => {
                    return {
                        range: this.validateRange(op.range),
                        text: op.text
                    };
                });
                // Sometimes, auto-formatters change ranges automatically which can cause undesired auto whitespace trimming near the cursor
                // We'll use the following heuristic: if the edits occur near the cursor, then it's ok to trim auto whitespace
                let editsAreNearCursors = true;
                if (beforeCursorState) {
                    for (let i = 0, len = beforeCursorState.length; i < len; i++) {
                        const sel = beforeCursorState[i];
                        let foundEditNearSel = false;
                        for (let j = 0, lenJ = incomingEdits.length; j < lenJ; j++) {
                            const editRange = incomingEdits[j].range;
                            const selIsAbove = editRange.startLineNumber > sel.endLineNumber;
                            const selIsBelow = sel.startLineNumber > editRange.endLineNumber;
                            if (!selIsAbove && !selIsBelow) {
                                foundEditNearSel = true;
                                break;
                            }
                        }
                        if (!foundEditNearSel) {
                            editsAreNearCursors = false;
                            break;
                        }
                    }
                }
                if (editsAreNearCursors) {
                    for (let i = 0, len = this._trimAutoWhitespaceLines.length; i < len; i++) {
                        const trimLineNumber = this._trimAutoWhitespaceLines[i];
                        const maxLineColumn = this.getLineMaxColumn(trimLineNumber);
                        let allowTrimLine = true;
                        for (let j = 0, lenJ = incomingEdits.length; j < lenJ; j++) {
                            const editRange = incomingEdits[j].range;
                            const editText = incomingEdits[j].text;
                            if (trimLineNumber < editRange.startLineNumber || trimLineNumber > editRange.endLineNumber) {
                                // `trimLine` is completely outside this edit
                                continue;
                            }
                            // At this point:
                            //   editRange.startLineNumber <= trimLine <= editRange.endLineNumber
                            if (trimLineNumber === editRange.startLineNumber && editRange.startColumn === maxLineColumn
                                && editRange.isEmpty() && editText && editText.length > 0 && editText.charAt(0) === '\n') {
                                // This edit inserts a new line (and maybe other text) after `trimLine`
                                continue;
                            }
                            if (trimLineNumber === editRange.startLineNumber && editRange.startColumn === 1
                                && editRange.isEmpty() && editText && editText.length > 0 && editText.charAt(editText.length - 1) === '\n') {
                                // This edit inserts a new line (and maybe other text) before `trimLine`
                                continue;
                            }
                            // Looks like we can't trim this line as it would interfere with an incoming edit
                            allowTrimLine = false;
                            break;
                        }
                        if (allowTrimLine) {
                            const trimRange = new range_1.Range(trimLineNumber, 1, trimLineNumber, maxLineColumn);
                            editOperations.push(new model.ValidAnnotatedEditOperation(null, trimRange, null, false, false, false));
                        }
                    }
                }
                this._trimAutoWhitespaceLines = null;
            }
            if (this._initialUndoRedoSnapshot === null) {
                this._initialUndoRedoSnapshot = this._undoRedoService.createSnapshot(this.uri);
            }
            return this._commandManager.pushEditOperation(beforeCursorState, editOperations, cursorStateComputer, group);
        }
        _applyUndo(changes, eol, resultingAlternativeVersionId, resultingSelection) {
            const edits = changes.map((change) => {
                const rangeStart = this.getPositionAt(change.newPosition);
                const rangeEnd = this.getPositionAt(change.newEnd);
                return {
                    range: new range_1.Range(rangeStart.lineNumber, rangeStart.column, rangeEnd.lineNumber, rangeEnd.column),
                    text: change.oldText
                };
            });
            this._applyUndoRedoEdits(edits, eol, true, false, resultingAlternativeVersionId, resultingSelection);
        }
        _applyRedo(changes, eol, resultingAlternativeVersionId, resultingSelection) {
            const edits = changes.map((change) => {
                const rangeStart = this.getPositionAt(change.oldPosition);
                const rangeEnd = this.getPositionAt(change.oldEnd);
                return {
                    range: new range_1.Range(rangeStart.lineNumber, rangeStart.column, rangeEnd.lineNumber, rangeEnd.column),
                    text: change.newText
                };
            });
            this._applyUndoRedoEdits(edits, eol, false, true, resultingAlternativeVersionId, resultingSelection);
        }
        _applyUndoRedoEdits(edits, eol, isUndoing, isRedoing, resultingAlternativeVersionId, resultingSelection) {
            try {
                this._onDidChangeDecorations.beginDeferredEmit();
                this._eventEmitter.beginDeferredEmit();
                this._isUndoing = isUndoing;
                this._isRedoing = isRedoing;
                this.applyEdits(edits, false);
                this.setEOL(eol);
                this._overwriteAlternativeVersionId(resultingAlternativeVersionId);
            }
            finally {
                this._isUndoing = false;
                this._isRedoing = false;
                this._eventEmitter.endDeferredEmit(resultingSelection);
                this._onDidChangeDecorations.endDeferredEmit();
            }
        }
        applyEdits(rawOperations, computeUndoEdits = false) {
            try {
                this._onDidChangeDecorations.beginDeferredEmit();
                this._eventEmitter.beginDeferredEmit();
                const operations = this._validateEditOperations(rawOperations);
                return this._doApplyEdits(operations, computeUndoEdits);
            }
            finally {
                this._eventEmitter.endDeferredEmit();
                this._onDidChangeDecorations.endDeferredEmit();
            }
        }
        _doApplyEdits(rawOperations, computeUndoEdits) {
            const oldLineCount = this._buffer.getLineCount();
            const result = this._buffer.applyEdits(rawOperations, this._options.trimAutoWhitespace, computeUndoEdits);
            const newLineCount = this._buffer.getLineCount();
            const contentChanges = result.changes;
            this._trimAutoWhitespaceLines = result.trimAutoWhitespaceLineNumbers;
            if (contentChanges.length !== 0) {
                // We do a first pass to update decorations
                // because we want to read decorations in the second pass
                // where we will emit content change events
                // and we want to read the final decorations
                for (let i = 0, len = contentChanges.length; i < len; i++) {
                    const change = contentChanges[i];
                    this._decorationsTree.acceptReplace(change.rangeOffset, change.rangeLength, change.text.length, change.forceMoveMarkers);
                }
                const rawContentChanges = [];
                this._increaseVersionId();
                let lineCount = oldLineCount;
                for (let i = 0, len = contentChanges.length; i < len; i++) {
                    const change = contentChanges[i];
                    const [eolCount] = (0, eolCounter_1.countEOL)(change.text);
                    this._onDidChangeDecorations.fire();
                    const startLineNumber = change.range.startLineNumber;
                    const endLineNumber = change.range.endLineNumber;
                    const deletingLinesCnt = endLineNumber - startLineNumber;
                    const insertingLinesCnt = eolCount;
                    const editingLinesCnt = Math.min(deletingLinesCnt, insertingLinesCnt);
                    const changeLineCountDelta = (insertingLinesCnt - deletingLinesCnt);
                    const currentEditStartLineNumber = newLineCount - lineCount - changeLineCountDelta + startLineNumber;
                    const firstEditLineNumber = currentEditStartLineNumber;
                    const lastInsertedLineNumber = currentEditStartLineNumber + insertingLinesCnt;
                    const decorationsWithInjectedTextInEditedRange = this._decorationsTree.getInjectedTextInInterval(this, this.getOffsetAt(new position_1.Position(firstEditLineNumber, 1)), this.getOffsetAt(new position_1.Position(lastInsertedLineNumber, this.getLineMaxColumn(lastInsertedLineNumber))), 0);
                    const injectedTextInEditedRange = textModelEvents_1.LineInjectedText.fromDecorations(decorationsWithInjectedTextInEditedRange);
                    const injectedTextInEditedRangeQueue = new arrays_1.ArrayQueue(injectedTextInEditedRange);
                    for (let j = editingLinesCnt; j >= 0; j--) {
                        const editLineNumber = startLineNumber + j;
                        const currentEditLineNumber = currentEditStartLineNumber + j;
                        injectedTextInEditedRangeQueue.takeFromEndWhile(r => r.lineNumber > currentEditLineNumber);
                        const decorationsInCurrentLine = injectedTextInEditedRangeQueue.takeFromEndWhile(r => r.lineNumber === currentEditLineNumber);
                        rawContentChanges.push(new textModelEvents_1.ModelRawLineChanged(editLineNumber, this.getLineContent(currentEditLineNumber), decorationsInCurrentLine));
                    }
                    if (editingLinesCnt < deletingLinesCnt) {
                        // Must delete some lines
                        const spliceStartLineNumber = startLineNumber + editingLinesCnt;
                        rawContentChanges.push(new textModelEvents_1.ModelRawLinesDeleted(spliceStartLineNumber + 1, endLineNumber));
                    }
                    if (editingLinesCnt < insertingLinesCnt) {
                        const injectedTextInEditedRangeQueue = new arrays_1.ArrayQueue(injectedTextInEditedRange);
                        // Must insert some lines
                        const spliceLineNumber = startLineNumber + editingLinesCnt;
                        const cnt = insertingLinesCnt - editingLinesCnt;
                        const fromLineNumber = newLineCount - lineCount - cnt + spliceLineNumber + 1;
                        const injectedTexts = [];
                        const newLines = [];
                        for (let i = 0; i < cnt; i++) {
                            const lineNumber = fromLineNumber + i;
                            newLines[i] = this.getLineContent(lineNumber);
                            injectedTextInEditedRangeQueue.takeWhile(r => r.lineNumber < lineNumber);
                            injectedTexts[i] = injectedTextInEditedRangeQueue.takeWhile(r => r.lineNumber === lineNumber);
                        }
                        rawContentChanges.push(new textModelEvents_1.ModelRawLinesInserted(spliceLineNumber + 1, startLineNumber + insertingLinesCnt, newLines, injectedTexts));
                    }
                    lineCount += changeLineCountDelta;
                }
                this._emitContentChangedEvent(new textModelEvents_1.ModelRawContentChangedEvent(rawContentChanges, this.getVersionId(), this._isUndoing, this._isRedoing), {
                    changes: contentChanges,
                    eol: this._buffer.getEOL(),
                    isEolChange: false,
                    versionId: this.getVersionId(),
                    isUndoing: this._isUndoing,
                    isRedoing: this._isRedoing,
                    isFlush: false
                });
            }
            return (result.reverseEdits === null ? undefined : result.reverseEdits);
        }
        undo() {
            return this._undoRedoService.undo(this.uri);
        }
        canUndo() {
            return this._undoRedoService.canUndo(this.uri);
        }
        redo() {
            return this._undoRedoService.redo(this.uri);
        }
        canRedo() {
            return this._undoRedoService.canRedo(this.uri);
        }
        //#endregion
        //#region Decorations
        handleBeforeFireDecorationsChangedEvent(affectedInjectedTextLines) {
            // This is called before the decoration changed event is fired.
            if (affectedInjectedTextLines === null || affectedInjectedTextLines.size === 0) {
                return;
            }
            const affectedLines = Array.from(affectedInjectedTextLines);
            const lineChangeEvents = affectedLines.map(lineNumber => new textModelEvents_1.ModelRawLineChanged(lineNumber, this.getLineContent(lineNumber), this._getInjectedTextInLine(lineNumber)));
            this._onDidChangeInjectedText.fire(new textModelEvents_1.ModelInjectedTextChangedEvent(lineChangeEvents));
        }
        changeDecorations(callback, ownerId = 0) {
            this._assertNotDisposed();
            try {
                this._onDidChangeDecorations.beginDeferredEmit();
                return this._changeDecorations(ownerId, callback);
            }
            finally {
                this._onDidChangeDecorations.endDeferredEmit();
            }
        }
        _changeDecorations(ownerId, callback) {
            const changeAccessor = {
                addDecoration: (range, options) => {
                    return this._deltaDecorationsImpl(ownerId, [], [{ range: range, options: options }])[0];
                },
                changeDecoration: (id, newRange) => {
                    this._changeDecorationImpl(id, newRange);
                },
                changeDecorationOptions: (id, options) => {
                    this._changeDecorationOptionsImpl(id, _normalizeOptions(options));
                },
                removeDecoration: (id) => {
                    this._deltaDecorationsImpl(ownerId, [id], []);
                },
                deltaDecorations: (oldDecorations, newDecorations) => {
                    if (oldDecorations.length === 0 && newDecorations.length === 0) {
                        // nothing to do
                        return [];
                    }
                    return this._deltaDecorationsImpl(ownerId, oldDecorations, newDecorations);
                }
            };
            let result = null;
            try {
                result = callback(changeAccessor);
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
            // Invalidate change accessor
            changeAccessor.addDecoration = invalidFunc;
            changeAccessor.changeDecoration = invalidFunc;
            changeAccessor.changeDecorationOptions = invalidFunc;
            changeAccessor.removeDecoration = invalidFunc;
            changeAccessor.deltaDecorations = invalidFunc;
            return result;
        }
        deltaDecorations(oldDecorations, newDecorations, ownerId = 0) {
            this._assertNotDisposed();
            if (!oldDecorations) {
                oldDecorations = [];
            }
            if (oldDecorations.length === 0 && newDecorations.length === 0) {
                // nothing to do
                return [];
            }
            try {
                this._deltaDecorationCallCnt++;
                if (this._deltaDecorationCallCnt > 1) {
                    console.warn(`Invoking deltaDecorations recursively could lead to leaking decorations.`);
                    (0, errors_1.onUnexpectedError)(new Error(`Invoking deltaDecorations recursively could lead to leaking decorations.`));
                }
                this._onDidChangeDecorations.beginDeferredEmit();
                return this._deltaDecorationsImpl(ownerId, oldDecorations, newDecorations);
            }
            finally {
                this._onDidChangeDecorations.endDeferredEmit();
                this._deltaDecorationCallCnt--;
            }
        }
        _getTrackedRange(id) {
            return this.getDecorationRange(id);
        }
        _setTrackedRange(id, newRange, newStickiness) {
            const node = (id ? this._decorations[id] : null);
            if (!node) {
                if (!newRange) {
                    // node doesn't exist, the request is to delete => nothing to do
                    return null;
                }
                // node doesn't exist, the request is to set => add the tracked range
                return this._deltaDecorationsImpl(0, [], [{ range: newRange, options: TRACKED_RANGE_OPTIONS[newStickiness] }], true)[0];
            }
            if (!newRange) {
                // node exists, the request is to delete => delete node
                this._decorationsTree.delete(node);
                delete this._decorations[node.id];
                return null;
            }
            // node exists, the request is to set => change the tracked range and its options
            const range = this._validateRangeRelaxedNoAllocations(newRange);
            const startOffset = this._buffer.getOffsetAt(range.startLineNumber, range.startColumn);
            const endOffset = this._buffer.getOffsetAt(range.endLineNumber, range.endColumn);
            this._decorationsTree.delete(node);
            node.reset(this.getVersionId(), startOffset, endOffset, range);
            node.setOptions(TRACKED_RANGE_OPTIONS[newStickiness]);
            this._decorationsTree.insert(node);
            return node.id;
        }
        removeAllDecorationsWithOwnerId(ownerId) {
            if (this._isDisposed) {
                return;
            }
            const nodes = this._decorationsTree.collectNodesFromOwner(ownerId);
            for (let i = 0, len = nodes.length; i < len; i++) {
                const node = nodes[i];
                this._decorationsTree.delete(node);
                delete this._decorations[node.id];
            }
        }
        getDecorationOptions(decorationId) {
            const node = this._decorations[decorationId];
            if (!node) {
                return null;
            }
            return node.options;
        }
        getDecorationRange(decorationId) {
            const node = this._decorations[decorationId];
            if (!node) {
                return null;
            }
            return this._decorationsTree.getNodeRange(this, node);
        }
        getLineDecorations(lineNumber, ownerId = 0, filterOutValidation = false) {
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                return [];
            }
            return this.getLinesDecorations(lineNumber, lineNumber, ownerId, filterOutValidation);
        }
        getLinesDecorations(_startLineNumber, _endLineNumber, ownerId = 0, filterOutValidation = false, onlyMarginDecorations = false) {
            const lineCount = this.getLineCount();
            const startLineNumber = Math.min(lineCount, Math.max(1, _startLineNumber));
            const endLineNumber = Math.min(lineCount, Math.max(1, _endLineNumber));
            const endColumn = this.getLineMaxColumn(endLineNumber);
            const range = new range_1.Range(startLineNumber, 1, endLineNumber, endColumn);
            const decorations = this._getDecorationsInRange(range, ownerId, filterOutValidation, onlyMarginDecorations);
            (0, arrays_1.pushMany)(decorations, this._decorationProvider.getDecorationsInRange(range, ownerId, filterOutValidation));
            return decorations;
        }
        getDecorationsInRange(range, ownerId = 0, filterOutValidation = false, onlyMinimapDecorations = false, onlyMarginDecorations = false) {
            const validatedRange = this.validateRange(range);
            const decorations = this._getDecorationsInRange(validatedRange, ownerId, filterOutValidation, onlyMarginDecorations);
            (0, arrays_1.pushMany)(decorations, this._decorationProvider.getDecorationsInRange(validatedRange, ownerId, filterOutValidation, onlyMinimapDecorations));
            return decorations;
        }
        getOverviewRulerDecorations(ownerId = 0, filterOutValidation = false) {
            return this._decorationsTree.getAll(this, ownerId, filterOutValidation, true, false);
        }
        getInjectedTextDecorations(ownerId = 0) {
            return this._decorationsTree.getAllInjectedText(this, ownerId);
        }
        _getInjectedTextInLine(lineNumber) {
            const startOffset = this._buffer.getOffsetAt(lineNumber, 1);
            const endOffset = startOffset + this._buffer.getLineLength(lineNumber);
            const result = this._decorationsTree.getInjectedTextInInterval(this, startOffset, endOffset, 0);
            return textModelEvents_1.LineInjectedText.fromDecorations(result).filter(t => t.lineNumber === lineNumber);
        }
        getAllDecorations(ownerId = 0, filterOutValidation = false) {
            let result = this._decorationsTree.getAll(this, ownerId, filterOutValidation, false, false);
            result = result.concat(this._decorationProvider.getAllDecorations(ownerId, filterOutValidation));
            return result;
        }
        getAllMarginDecorations(ownerId = 0) {
            return this._decorationsTree.getAll(this, ownerId, false, false, true);
        }
        _getDecorationsInRange(filterRange, filterOwnerId, filterOutValidation, onlyMarginDecorations) {
            const startOffset = this._buffer.getOffsetAt(filterRange.startLineNumber, filterRange.startColumn);
            const endOffset = this._buffer.getOffsetAt(filterRange.endLineNumber, filterRange.endColumn);
            return this._decorationsTree.getAllInInterval(this, startOffset, endOffset, filterOwnerId, filterOutValidation, onlyMarginDecorations);
        }
        getRangeAt(start, end) {
            return this._buffer.getRangeAt(start, end - start);
        }
        _changeDecorationImpl(decorationId, _range) {
            const node = this._decorations[decorationId];
            if (!node) {
                return;
            }
            if (node.options.after) {
                const oldRange = this.getDecorationRange(decorationId);
                this._onDidChangeDecorations.recordLineAffectedByInjectedText(oldRange.endLineNumber);
            }
            if (node.options.before) {
                const oldRange = this.getDecorationRange(decorationId);
                this._onDidChangeDecorations.recordLineAffectedByInjectedText(oldRange.startLineNumber);
            }
            const range = this._validateRangeRelaxedNoAllocations(_range);
            const startOffset = this._buffer.getOffsetAt(range.startLineNumber, range.startColumn);
            const endOffset = this._buffer.getOffsetAt(range.endLineNumber, range.endColumn);
            this._decorationsTree.delete(node);
            node.reset(this.getVersionId(), startOffset, endOffset, range);
            this._decorationsTree.insert(node);
            this._onDidChangeDecorations.checkAffectedAndFire(node.options);
            if (node.options.after) {
                this._onDidChangeDecorations.recordLineAffectedByInjectedText(range.endLineNumber);
            }
            if (node.options.before) {
                this._onDidChangeDecorations.recordLineAffectedByInjectedText(range.startLineNumber);
            }
        }
        _changeDecorationOptionsImpl(decorationId, options) {
            const node = this._decorations[decorationId];
            if (!node) {
                return;
            }
            const nodeWasInOverviewRuler = (node.options.overviewRuler && node.options.overviewRuler.color ? true : false);
            const nodeIsInOverviewRuler = (options.overviewRuler && options.overviewRuler.color ? true : false);
            this._onDidChangeDecorations.checkAffectedAndFire(node.options);
            this._onDidChangeDecorations.checkAffectedAndFire(options);
            if (node.options.after || options.after) {
                const nodeRange = this._decorationsTree.getNodeRange(this, node);
                this._onDidChangeDecorations.recordLineAffectedByInjectedText(nodeRange.endLineNumber);
            }
            if (node.options.before || options.before) {
                const nodeRange = this._decorationsTree.getNodeRange(this, node);
                this._onDidChangeDecorations.recordLineAffectedByInjectedText(nodeRange.startLineNumber);
            }
            const movedInOverviewRuler = nodeWasInOverviewRuler !== nodeIsInOverviewRuler;
            const changedWhetherInjectedText = isOptionsInjectedText(options) !== isNodeInjectedText(node);
            if (movedInOverviewRuler || changedWhetherInjectedText) {
                this._decorationsTree.delete(node);
                node.setOptions(options);
                this._decorationsTree.insert(node);
            }
            else {
                node.setOptions(options);
            }
        }
        _deltaDecorationsImpl(ownerId, oldDecorationsIds, newDecorations, suppressEvents = false) {
            const versionId = this.getVersionId();
            const oldDecorationsLen = oldDecorationsIds.length;
            let oldDecorationIndex = 0;
            const newDecorationsLen = newDecorations.length;
            let newDecorationIndex = 0;
            this._onDidChangeDecorations.beginDeferredEmit();
            try {
                const result = new Array(newDecorationsLen);
                while (oldDecorationIndex < oldDecorationsLen || newDecorationIndex < newDecorationsLen) {
                    let node = null;
                    if (oldDecorationIndex < oldDecorationsLen) {
                        // (1) get ourselves an old node
                        do {
                            node = this._decorations[oldDecorationsIds[oldDecorationIndex++]];
                        } while (!node && oldDecorationIndex < oldDecorationsLen);
                        // (2) remove the node from the tree (if it exists)
                        if (node) {
                            if (node.options.after) {
                                const nodeRange = this._decorationsTree.getNodeRange(this, node);
                                this._onDidChangeDecorations.recordLineAffectedByInjectedText(nodeRange.endLineNumber);
                            }
                            if (node.options.before) {
                                const nodeRange = this._decorationsTree.getNodeRange(this, node);
                                this._onDidChangeDecorations.recordLineAffectedByInjectedText(nodeRange.startLineNumber);
                            }
                            this._decorationsTree.delete(node);
                            if (!suppressEvents) {
                                this._onDidChangeDecorations.checkAffectedAndFire(node.options);
                            }
                        }
                    }
                    if (newDecorationIndex < newDecorationsLen) {
                        // (3) create a new node if necessary
                        if (!node) {
                            const internalDecorationId = (++this._lastDecorationId);
                            const decorationId = `${this._instanceId};${internalDecorationId}`;
                            node = new intervalTree_1.IntervalNode(decorationId, 0, 0);
                            this._decorations[decorationId] = node;
                        }
                        // (4) initialize node
                        const newDecoration = newDecorations[newDecorationIndex];
                        const range = this._validateRangeRelaxedNoAllocations(newDecoration.range);
                        const options = _normalizeOptions(newDecoration.options);
                        const startOffset = this._buffer.getOffsetAt(range.startLineNumber, range.startColumn);
                        const endOffset = this._buffer.getOffsetAt(range.endLineNumber, range.endColumn);
                        node.ownerId = ownerId;
                        node.reset(versionId, startOffset, endOffset, range);
                        node.setOptions(options);
                        if (node.options.after) {
                            this._onDidChangeDecorations.recordLineAffectedByInjectedText(range.endLineNumber);
                        }
                        if (node.options.before) {
                            this._onDidChangeDecorations.recordLineAffectedByInjectedText(range.startLineNumber);
                        }
                        if (!suppressEvents) {
                            this._onDidChangeDecorations.checkAffectedAndFire(options);
                        }
                        this._decorationsTree.insert(node);
                        result[newDecorationIndex] = node.id;
                        newDecorationIndex++;
                    }
                    else {
                        if (node) {
                            delete this._decorations[node.id];
                        }
                    }
                }
                return result;
            }
            finally {
                this._onDidChangeDecorations.endDeferredEmit();
            }
        }
        //#endregion
        //#region Tokenization
        // TODO move them to the tokenization part.
        getLanguageId() {
            return this.tokenization.getLanguageId();
        }
        setLanguage(languageIdOrSelection, source) {
            if (typeof languageIdOrSelection === 'string') {
                this._languageSelectionListener.clear();
                this._setLanguage(languageIdOrSelection, source);
            }
            else {
                this._languageSelectionListener.value = languageIdOrSelection.onDidChange(() => this._setLanguage(languageIdOrSelection.languageId, source));
                this._setLanguage(languageIdOrSelection.languageId, source);
            }
        }
        _setLanguage(languageId, source) {
            this.tokenization.setLanguageId(languageId, source);
            this._languageService.requestRichLanguageFeatures(languageId);
        }
        getLanguageIdAtPosition(lineNumber, column) {
            return this.tokenization.getLanguageIdAtPosition(lineNumber, column);
        }
        getWordAtPosition(position) {
            return this._tokenizationTextModelPart.getWordAtPosition(position);
        }
        getWordUntilPosition(position) {
            return this._tokenizationTextModelPart.getWordUntilPosition(position);
        }
        //#endregion
        normalizePosition(position, affinity) {
            return position;
        }
        /**
         * Gets the column at which indentation stops at a given line.
         * @internal
        */
        getLineIndentColumn(lineNumber) {
            // Columns start with 1.
            return indentOfLine(this.getLineContent(lineNumber)) + 1;
        }
    };
    exports.TextModel = TextModel;
    exports.TextModel = TextModel = TextModel_1 = __decorate([
        __param(4, undoRedo_1.IUndoRedoService),
        __param(5, language_1.ILanguageService),
        __param(6, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], TextModel);
    function indentOfLine(line) {
        let indent = 0;
        for (const c of line) {
            if (c === ' ' || c === '\t') {
                indent++;
            }
            else {
                break;
            }
        }
        return indent;
    }
    //#region Decorations
    function isNodeInOverviewRuler(node) {
        return (node.options.overviewRuler && node.options.overviewRuler.color ? true : false);
    }
    function isOptionsInjectedText(options) {
        return !!options.after || !!options.before;
    }
    function isNodeInjectedText(node) {
        return !!node.options.after || !!node.options.before;
    }
    class DecorationsTrees {
        constructor() {
            this._decorationsTree0 = new intervalTree_1.IntervalTree();
            this._decorationsTree1 = new intervalTree_1.IntervalTree();
            this._injectedTextDecorationsTree = new intervalTree_1.IntervalTree();
        }
        ensureAllNodesHaveRanges(host) {
            this.getAll(host, 0, false, false, false);
        }
        _ensureNodesHaveRanges(host, nodes) {
            for (const node of nodes) {
                if (node.range === null) {
                    node.range = host.getRangeAt(node.cachedAbsoluteStart, node.cachedAbsoluteEnd);
                }
            }
            return nodes;
        }
        getAllInInterval(host, start, end, filterOwnerId, filterOutValidation, onlyMarginDecorations) {
            const versionId = host.getVersionId();
            const result = this._intervalSearch(start, end, filterOwnerId, filterOutValidation, versionId, onlyMarginDecorations);
            return this._ensureNodesHaveRanges(host, result);
        }
        _intervalSearch(start, end, filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations) {
            const r0 = this._decorationsTree0.intervalSearch(start, end, filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
            const r1 = this._decorationsTree1.intervalSearch(start, end, filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
            const r2 = this._injectedTextDecorationsTree.intervalSearch(start, end, filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
            return r0.concat(r1).concat(r2);
        }
        getInjectedTextInInterval(host, start, end, filterOwnerId) {
            const versionId = host.getVersionId();
            const result = this._injectedTextDecorationsTree.intervalSearch(start, end, filterOwnerId, false, versionId, false);
            return this._ensureNodesHaveRanges(host, result).filter((i) => i.options.showIfCollapsed || !i.range.isEmpty());
        }
        getAllInjectedText(host, filterOwnerId) {
            const versionId = host.getVersionId();
            const result = this._injectedTextDecorationsTree.search(filterOwnerId, false, versionId, false);
            return this._ensureNodesHaveRanges(host, result).filter((i) => i.options.showIfCollapsed || !i.range.isEmpty());
        }
        getAll(host, filterOwnerId, filterOutValidation, overviewRulerOnly, onlyMarginDecorations) {
            const versionId = host.getVersionId();
            const result = this._search(filterOwnerId, filterOutValidation, overviewRulerOnly, versionId, onlyMarginDecorations);
            return this._ensureNodesHaveRanges(host, result);
        }
        _search(filterOwnerId, filterOutValidation, overviewRulerOnly, cachedVersionId, onlyMarginDecorations) {
            if (overviewRulerOnly) {
                return this._decorationsTree1.search(filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
            }
            else {
                const r0 = this._decorationsTree0.search(filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
                const r1 = this._decorationsTree1.search(filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
                const r2 = this._injectedTextDecorationsTree.search(filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
                return r0.concat(r1).concat(r2);
            }
        }
        collectNodesFromOwner(ownerId) {
            const r0 = this._decorationsTree0.collectNodesFromOwner(ownerId);
            const r1 = this._decorationsTree1.collectNodesFromOwner(ownerId);
            const r2 = this._injectedTextDecorationsTree.collectNodesFromOwner(ownerId);
            return r0.concat(r1).concat(r2);
        }
        collectNodesPostOrder() {
            const r0 = this._decorationsTree0.collectNodesPostOrder();
            const r1 = this._decorationsTree1.collectNodesPostOrder();
            const r2 = this._injectedTextDecorationsTree.collectNodesPostOrder();
            return r0.concat(r1).concat(r2);
        }
        insert(node) {
            if (isNodeInjectedText(node)) {
                this._injectedTextDecorationsTree.insert(node);
            }
            else if (isNodeInOverviewRuler(node)) {
                this._decorationsTree1.insert(node);
            }
            else {
                this._decorationsTree0.insert(node);
            }
        }
        delete(node) {
            if (isNodeInjectedText(node)) {
                this._injectedTextDecorationsTree.delete(node);
            }
            else if (isNodeInOverviewRuler(node)) {
                this._decorationsTree1.delete(node);
            }
            else {
                this._decorationsTree0.delete(node);
            }
        }
        getNodeRange(host, node) {
            const versionId = host.getVersionId();
            if (node.cachedVersionId !== versionId) {
                this._resolveNode(node, versionId);
            }
            if (node.range === null) {
                node.range = host.getRangeAt(node.cachedAbsoluteStart, node.cachedAbsoluteEnd);
            }
            return node.range;
        }
        _resolveNode(node, cachedVersionId) {
            if (isNodeInjectedText(node)) {
                this._injectedTextDecorationsTree.resolveNode(node, cachedVersionId);
            }
            else if (isNodeInOverviewRuler(node)) {
                this._decorationsTree1.resolveNode(node, cachedVersionId);
            }
            else {
                this._decorationsTree0.resolveNode(node, cachedVersionId);
            }
        }
        acceptReplace(offset, length, textLength, forceMoveMarkers) {
            this._decorationsTree0.acceptReplace(offset, length, textLength, forceMoveMarkers);
            this._decorationsTree1.acceptReplace(offset, length, textLength, forceMoveMarkers);
            this._injectedTextDecorationsTree.acceptReplace(offset, length, textLength, forceMoveMarkers);
        }
    }
    function cleanClassName(className) {
        return className.replace(/[^a-z0-9\-_]/gi, ' ');
    }
    class DecorationOptions {
        constructor(options) {
            this.color = options.color || '';
            this.darkColor = options.darkColor || '';
        }
    }
    class ModelDecorationOverviewRulerOptions extends DecorationOptions {
        constructor(options) {
            super(options);
            this._resolvedColor = null;
            this.position = (typeof options.position === 'number' ? options.position : model.OverviewRulerLane.Center);
        }
        getColor(theme) {
            if (!this._resolvedColor) {
                if (theme.type !== 'light' && this.darkColor) {
                    this._resolvedColor = this._resolveColor(this.darkColor, theme);
                }
                else {
                    this._resolvedColor = this._resolveColor(this.color, theme);
                }
            }
            return this._resolvedColor;
        }
        invalidateCachedColor() {
            this._resolvedColor = null;
        }
        _resolveColor(color, theme) {
            if (typeof color === 'string') {
                return color;
            }
            const c = color ? theme.getColor(color.id) : null;
            if (!c) {
                return '';
            }
            return c.toString();
        }
    }
    exports.ModelDecorationOverviewRulerOptions = ModelDecorationOverviewRulerOptions;
    class ModelDecorationGlyphMarginOptions {
        constructor(options) {
            this.position = options?.position ?? model.GlyphMarginLane.Center;
            this.persistLane = options?.persistLane;
        }
    }
    exports.ModelDecorationGlyphMarginOptions = ModelDecorationGlyphMarginOptions;
    class ModelDecorationMinimapOptions extends DecorationOptions {
        constructor(options) {
            super(options);
            this.position = options.position;
            this.sectionHeaderStyle = options.sectionHeaderStyle ?? null;
            this.sectionHeaderText = options.sectionHeaderText ?? null;
        }
        getColor(theme) {
            if (!this._resolvedColor) {
                if (theme.type !== 'light' && this.darkColor) {
                    this._resolvedColor = this._resolveColor(this.darkColor, theme);
                }
                else {
                    this._resolvedColor = this._resolveColor(this.color, theme);
                }
            }
            return this._resolvedColor;
        }
        invalidateCachedColor() {
            this._resolvedColor = undefined;
        }
        _resolveColor(color, theme) {
            if (typeof color === 'string') {
                return color_1.Color.fromHex(color);
            }
            return theme.getColor(color.id);
        }
    }
    exports.ModelDecorationMinimapOptions = ModelDecorationMinimapOptions;
    class ModelDecorationInjectedTextOptions {
        static from(options) {
            if (options instanceof ModelDecorationInjectedTextOptions) {
                return options;
            }
            return new ModelDecorationInjectedTextOptions(options);
        }
        constructor(options) {
            this.content = options.content || '';
            this.inlineClassName = options.inlineClassName || null;
            this.inlineClassNameAffectsLetterSpacing = options.inlineClassNameAffectsLetterSpacing || false;
            this.attachedData = options.attachedData || null;
            this.cursorStops = options.cursorStops || null;
        }
    }
    exports.ModelDecorationInjectedTextOptions = ModelDecorationInjectedTextOptions;
    class ModelDecorationOptions {
        static register(options) {
            return new ModelDecorationOptions(options);
        }
        static createDynamic(options) {
            return new ModelDecorationOptions(options);
        }
        constructor(options) {
            this.description = options.description;
            this.blockClassName = options.blockClassName ? cleanClassName(options.blockClassName) : null;
            this.blockDoesNotCollapse = options.blockDoesNotCollapse ?? null;
            this.blockIsAfterEnd = options.blockIsAfterEnd ?? null;
            this.blockPadding = options.blockPadding ?? null;
            this.stickiness = options.stickiness || 0 /* model.TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */;
            this.zIndex = options.zIndex || 0;
            this.className = options.className ? cleanClassName(options.className) : null;
            this.shouldFillLineOnLineBreak = options.shouldFillLineOnLineBreak ?? null;
            this.hoverMessage = options.hoverMessage || null;
            this.glyphMarginHoverMessage = options.glyphMarginHoverMessage || null;
            this.lineNumberHoverMessage = options.lineNumberHoverMessage || null;
            this.isWholeLine = options.isWholeLine || false;
            this.showIfCollapsed = options.showIfCollapsed || false;
            this.collapseOnReplaceEdit = options.collapseOnReplaceEdit || false;
            this.overviewRuler = options.overviewRuler ? new ModelDecorationOverviewRulerOptions(options.overviewRuler) : null;
            this.minimap = options.minimap ? new ModelDecorationMinimapOptions(options.minimap) : null;
            this.glyphMargin = options.glyphMarginClassName ? new ModelDecorationGlyphMarginOptions(options.glyphMargin) : null;
            this.glyphMarginClassName = options.glyphMarginClassName ? cleanClassName(options.glyphMarginClassName) : null;
            this.linesDecorationsClassName = options.linesDecorationsClassName ? cleanClassName(options.linesDecorationsClassName) : null;
            this.lineNumberClassName = options.lineNumberClassName ? cleanClassName(options.lineNumberClassName) : null;
            this.linesDecorationsTooltip = options.linesDecorationsTooltip ? strings.htmlAttributeEncodeValue(options.linesDecorationsTooltip) : null;
            this.firstLineDecorationClassName = options.firstLineDecorationClassName ? cleanClassName(options.firstLineDecorationClassName) : null;
            this.marginClassName = options.marginClassName ? cleanClassName(options.marginClassName) : null;
            this.inlineClassName = options.inlineClassName ? cleanClassName(options.inlineClassName) : null;
            this.inlineClassNameAffectsLetterSpacing = options.inlineClassNameAffectsLetterSpacing || false;
            this.beforeContentClassName = options.beforeContentClassName ? cleanClassName(options.beforeContentClassName) : null;
            this.afterContentClassName = options.afterContentClassName ? cleanClassName(options.afterContentClassName) : null;
            this.after = options.after ? ModelDecorationInjectedTextOptions.from(options.after) : null;
            this.before = options.before ? ModelDecorationInjectedTextOptions.from(options.before) : null;
            this.hideInCommentTokens = options.hideInCommentTokens ?? false;
            this.hideInStringTokens = options.hideInStringTokens ?? false;
        }
    }
    exports.ModelDecorationOptions = ModelDecorationOptions;
    ModelDecorationOptions.EMPTY = ModelDecorationOptions.register({ description: 'empty' });
    /**
     * The order carefully matches the values of the enum.
     */
    const TRACKED_RANGE_OPTIONS = [
        ModelDecorationOptions.register({ description: 'tracked-range-always-grows-when-typing-at-edges', stickiness: 0 /* model.TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */ }),
        ModelDecorationOptions.register({ description: 'tracked-range-never-grows-when-typing-at-edges', stickiness: 1 /* model.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */ }),
        ModelDecorationOptions.register({ description: 'tracked-range-grows-only-when-typing-before', stickiness: 2 /* model.TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */ }),
        ModelDecorationOptions.register({ description: 'tracked-range-grows-only-when-typing-after', stickiness: 3 /* model.TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */ }),
    ];
    function _normalizeOptions(options) {
        if (options instanceof ModelDecorationOptions) {
            return options;
        }
        return ModelDecorationOptions.createDynamic(options);
    }
    class DidChangeDecorationsEmitter extends lifecycle_1.Disposable {
        constructor(handleBeforeFire) {
            super();
            this.handleBeforeFire = handleBeforeFire;
            this._actual = this._register(new event_1.Emitter());
            this.event = this._actual.event;
            this._affectedInjectedTextLines = null;
            this._deferredCnt = 0;
            this._shouldFireDeferred = false;
            this._affectsMinimap = false;
            this._affectsOverviewRuler = false;
            this._affectsGlyphMargin = false;
            this._affectsLineNumber = false;
        }
        hasListeners() {
            return this._actual.hasListeners();
        }
        beginDeferredEmit() {
            this._deferredCnt++;
        }
        endDeferredEmit() {
            this._deferredCnt--;
            if (this._deferredCnt === 0) {
                if (this._shouldFireDeferred) {
                    this.doFire();
                }
                this._affectedInjectedTextLines?.clear();
                this._affectedInjectedTextLines = null;
            }
        }
        recordLineAffectedByInjectedText(lineNumber) {
            if (!this._affectedInjectedTextLines) {
                this._affectedInjectedTextLines = new Set();
            }
            this._affectedInjectedTextLines.add(lineNumber);
        }
        checkAffectedAndFire(options) {
            this._affectsMinimap ||= !!options.minimap?.position;
            this._affectsOverviewRuler ||= !!options.overviewRuler?.color;
            this._affectsGlyphMargin ||= !!options.glyphMarginClassName;
            this._affectsLineNumber ||= !!options.lineNumberClassName;
            this.tryFire();
        }
        fire() {
            this._affectsMinimap = true;
            this._affectsOverviewRuler = true;
            this._affectsGlyphMargin = true;
            this.tryFire();
        }
        tryFire() {
            if (this._deferredCnt === 0) {
                this.doFire();
            }
            else {
                this._shouldFireDeferred = true;
            }
        }
        doFire() {
            this.handleBeforeFire(this._affectedInjectedTextLines);
            const event = {
                affectsMinimap: this._affectsMinimap,
                affectsOverviewRuler: this._affectsOverviewRuler,
                affectsGlyphMargin: this._affectsGlyphMargin,
                affectsLineNumber: this._affectsLineNumber,
            };
            this._shouldFireDeferred = false;
            this._affectsMinimap = false;
            this._affectsOverviewRuler = false;
            this._affectsGlyphMargin = false;
            this._actual.fire(event);
        }
    }
    //#endregion
    class DidChangeContentEmitter extends lifecycle_1.Disposable {
        constructor() {
            super();
            /**
             * Both `fastEvent` and `slowEvent` work the same way and contain the same events, but first we invoke `fastEvent` and then `slowEvent`.
             */
            this._fastEmitter = this._register(new event_1.Emitter());
            this.fastEvent = this._fastEmitter.event;
            this._slowEmitter = this._register(new event_1.Emitter());
            this.slowEvent = this._slowEmitter.event;
            this._deferredCnt = 0;
            this._deferredEvent = null;
        }
        hasListeners() {
            return (this._fastEmitter.hasListeners()
                || this._slowEmitter.hasListeners());
        }
        beginDeferredEmit() {
            this._deferredCnt++;
        }
        endDeferredEmit(resultingSelection = null) {
            this._deferredCnt--;
            if (this._deferredCnt === 0) {
                if (this._deferredEvent !== null) {
                    this._deferredEvent.rawContentChangedEvent.resultingSelection = resultingSelection;
                    const e = this._deferredEvent;
                    this._deferredEvent = null;
                    this._fastEmitter.fire(e);
                    this._slowEmitter.fire(e);
                }
            }
        }
        fire(e) {
            if (this._deferredCnt > 0) {
                if (this._deferredEvent) {
                    this._deferredEvent = this._deferredEvent.merge(e);
                }
                else {
                    this._deferredEvent = e;
                }
                return;
            }
            this._fastEmitter.fire(e);
            this._slowEmitter.fire(e);
        }
    }
    /**
     * @internal
     */
    class AttachedViews {
        constructor() {
            this._onDidChangeVisibleRanges = new event_1.Emitter();
            this.onDidChangeVisibleRanges = this._onDidChangeVisibleRanges.event;
            this._views = new Set();
        }
        attachView() {
            const view = new AttachedViewImpl((state) => {
                this._onDidChangeVisibleRanges.fire({ view, state });
            });
            this._views.add(view);
            return view;
        }
        detachView(view) {
            this._views.delete(view);
            this._onDidChangeVisibleRanges.fire({ view, state: undefined });
        }
    }
    exports.AttachedViews = AttachedViews;
    class AttachedViewImpl {
        constructor(handleStateChange) {
            this.handleStateChange = handleStateChange;
        }
        setVisibleLines(visibleLines, stabilized) {
            const visibleLineRanges = visibleLines.map((line) => new lineRange_1.LineRange(line.startLineNumber, line.endLineNumber + 1));
            this.handleStateChange({ visibleLineRanges, stabilized });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL3RleHRNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNkNoRywwREFJQztJQVdELDhFQXdCQztJQUVELGtGQVNDO0lBRUQsNENBVUM7SUE5REQsU0FBZ0IsdUJBQXVCLENBQUMsSUFBWTtRQUNuRCxNQUFNLE9BQU8sR0FBRyxJQUFJLHVEQUEwQixFQUFFLENBQUM7UUFDakQsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQixPQUFPLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUN6QixDQUFDO0lBV0QsU0FBZ0IsaUNBQWlDLENBQUMsTUFBNEM7UUFDN0YsT0FBTyxJQUFJLE9BQU8sQ0FBMkIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDaEUsTUFBTSxPQUFPLEdBQUcsSUFBSSx1REFBMEIsRUFBRSxDQUFDO1lBRWpELElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztZQUVqQixJQUFBLHFCQUFZLEVBQW9CLE1BQU0sRUFBRTtnQkFDdkMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFO29CQUNmLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDN0UsQ0FBQztnQkFDRCxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUU7b0JBQ2hCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzt3QkFDWCxJQUFJLEdBQUcsSUFBSSxDQUFDO3dCQUNaLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDZixD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