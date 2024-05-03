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
define(["require", "exports", "vs/base/common/event", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/editor/common/core/editOperation", "vs/editor/common/diff/rangeMapping", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/languages/language", "vs/base/common/map", "vs/base/common/network", "vs/base/common/resources", "./inlineChatSessionService", "vs/editor/common/services/editorWorker", "vs/workbench/contrib/inlineChat/browser/utils", "vs/base/common/arrays", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/log/common/log", "vs/platform/extensions/common/extensions"], function (require, exports, event_1, bulkEditService_1, inlineChat_1, range_1, textModel_1, errorMessage_1, errors_1, editOperation_1, rangeMapping_1, textfiles_1, language_1, map_1, network_1, resources_1, inlineChatSessionService_1, editorWorker_1, utils_1, arrays_1, iterator_1, lifecycle_1, contextkey_1, log_1, extensions_1) {
    "use strict";
    var HunkData_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HunkState = exports.HunkData = exports.StashedSession = exports.ReplyResponse = exports.ErrorResponse = exports.EmptyResponse = exports.SessionExchange = exports.SessionPrompt = exports.Session = exports.SessionWholeRange = void 0;
    class SessionWholeRange {
        static { this._options = textModel_1.ModelDecorationOptions.register({ description: 'inlineChat/session/wholeRange' }); }
        constructor(_textModel, wholeRange) {
            this._textModel = _textModel;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._decorationIds = [];
            this._decorationIds = _textModel.deltaDecorations([], [{ range: wholeRange, options: SessionWholeRange._options }]);
        }
        dispose() {
            this._onDidChange.dispose();
            if (!this._textModel.isDisposed()) {
                this._textModel.deltaDecorations(this._decorationIds, []);
            }
        }
        trackEdits(edits) {
            const newDeco = [];
            for (const edit of edits) {
                newDeco.push({ range: edit.range, options: SessionWholeRange._options });
            }
            this._decorationIds.push(...this._textModel.deltaDecorations([], newDeco));
            this._onDidChange.fire(this);
        }
        fixup(changes) {
            const newDeco = [];
            for (const { modified } of changes) {
                const modifiedRange = modified.isEmpty
                    ? new range_1.Range(modified.startLineNumber, 1, modified.startLineNumber, this._textModel.getLineLength(modified.startLineNumber))
                    : new range_1.Range(modified.startLineNumber, 1, modified.endLineNumberExclusive - 1, this._textModel.getLineLength(modified.endLineNumberExclusive - 1));
                newDeco.push({ range: modifiedRange, options: SessionWholeRange._options });
            }
            const [first, ...rest] = this._decorationIds; // first is the original whole range
            const newIds = this._textModel.deltaDecorations(rest, newDeco);
            this._decorationIds = [first].concat(newIds);
            this._onDidChange.fire(this);
        }
        get trackedInitialRange() {
            const [first] = this._decorationIds;
            return this._textModel.getDecorationRange(first) ?? new range_1.Range(1, 1, 1, 1);
        }
        get value() {
            let result;
            for (const id of this._decorationIds) {
                const range = this._textModel.getDecorationRange(id);
                if (range) {
                    if (!result) {
                        result = range;
                    }
                    else {
                        result = range_1.Range.plusRange(result, range);
                    }
                }
            }
            return result;
        }
    }
    exports.SessionWholeRange = SessionWholeRange;
    class Session {
        constructor(editMode, 
        /**
         * The URI of the document which is being EditorEdit
         */
        targetUri, 
        /**
         * A copy of the document at the time the session was started
         */
        textModel0, 
        /**
         * The document into which AI edits went, when live this is `targetUri` otherwise it is a temporary document
         */
        textModelN, provider, session, wholeRange, hunkData, chatModel) {
            this.editMode = editMode;
            this.targetUri = targetUri;
            this.textModel0 = textModel0;
            this.textModelN = textModelN;
            this.provider = provider;
            this.session = session;
            this.wholeRange = wholeRange;
            this.hunkData = hunkData;
            this.chatModel = chatModel;
            this._isUnstashed = false;
            this._exchange = [];
            this._startTime = new Date();
            this.textModelNAltVersion = textModelN.getAlternativeVersionId();
            this._teldata = {
                extension: extensions_1.ExtensionIdentifier.toKey(provider.extensionId),
                startTime: this._startTime.toISOString(),
                endTime: this._startTime.toISOString(),
                edits: 0,
                finishedByEdit: false,
                rounds: '',
                undos: '',
                editMode,
                unstashed: 0,
                acceptedHunks: 0,
                discardedHunks: 0,
                responseTypes: ''
            };
        }
        addInput(input) {
            this._lastInput = input;
        }
        get lastInput() {
            return this._lastInput;
        }
        get isUnstashed() {
            return this._isUnstashed;
        }
        markUnstashed() {
            this._teldata.unstashed += 1;
            this._isUnstashed = true;
        }
        get textModelNSnapshotAltVersion() {
            return this._textModelNSnapshotAltVersion;
        }
        createSnapshot() {
            this._textModelNSnapshotAltVersion = this.textModelN.getAlternativeVersionId();
        }
        addExchange(exchange) {
            this._isUnstashed = false;
            const newLen = this._exchange.push(exchange);
            this._teldata.rounds += `${newLen}|`;
            this._teldata.responseTypes += `${exchange.response instanceof ReplyResponse ? exchange.response.responseType : "empty" /* InlineChatResponseTypes.Empty */}|`;
        }
        get exchanges() {
            return this._exchange;
        }
        get lastExchange() {
            return this._exchange[this._exchange.length - 1];
        }
        get hasChangedText() {
            return !this.textModel0.equalsTextBuffer(this.textModelN.getTextBuffer());
        }
        asChangedText(changes) {
            if (changes.length === 0) {
                return undefined;
            }
            let startLine = Number.MAX_VALUE;
            let endLine = Number.MIN_VALUE;
            for (const change of changes) {
                startLine = Math.min(startLine, change.modified.startLineNumber);
                endLine = Math.max(endLine, change.modified.endLineNumberExclusive);
            }
            return this.textModelN.getValueInRange(new range_1.Range(startLine, 1, endLine, Number.MAX_VALUE));
        }
        recordExternalEditOccurred(didFinish) {
            this._teldata.edits += 1;
            this._teldata.finishedByEdit = didFinish;
        }
        asTelemetryData() {
            for (const item of this.hunkData.getInfo()) {
                switch (item.getState()) {
                    case 1 /* HunkState.Accepted */:
                        this._teldata.acceptedHunks += 1;
                        break;
                    case 2 /* HunkState.Rejected */:
                        this._teldata.discardedHunks += 1;
                        break;
                }
            }
            this._teldata.endTime = new Date().toISOString();
            return this._teldata;
        }
        asRecording() {
            const result = {
                session: this.session,
                when: this._startTime,
                exchanges: []
            };
            for (const exchange of this._exchange) {
                const response = exchange.response;
                if (response instanceof ReplyResponse) {
                    result.exchanges.push({ prompt: exchange.prompt.value, res: response.raw });
                }
            }
            return result;
        }
    }
    exports.Session = Session;
    class SessionPrompt {
        constructor(value, attempt, withIntentDetection) {
            this.value = value;
            this.attempt = attempt;
            this.withIntentDetection = withIntentDetection;
        }
    }
    exports.SessionPrompt = SessionPrompt;
    class SessionExchange {
        constructor(prompt, response) {
            this.prompt = prompt;
            this.response = response;
        }
    }
    exports.SessionExchange = SessionExchange;
    class EmptyResponse {
    }
    exports.EmptyResponse = EmptyResponse;
    class ErrorResponse {
        constructor(error) {
            this.error = error;
            this.message = (0, errorMessage_1.toErrorMessage)(error, false);
            this.isCancellation = (0, errors_1.isCancellationError)(error);
        }
    }
    exports.ErrorResponse = ErrorResponse;
    let ReplyResponse = class ReplyResponse {
        constructor(raw, mdContent, localUri, modelAltVersionId, progressEdits, requestId, _textFileService, _languageService) {
            this.raw = raw;
            this.mdContent = mdContent;
            this.modelAltVersionId = modelAltVersionId;
            this.requestId = requestId;
            this._textFileService = _textFileService;
            this._languageService = _languageService;
            this.allLocalEdits = [];
            const editsMap = new map_1.ResourceMap();
            editsMap.set(localUri, [...progressEdits]);
            if (raw.type === "editorEdit" /* InlineChatResponseType.EditorEdit */) {
                //
                editsMap.get(localUri).push(raw.edits);
            }
            else if (raw.type === "bulkEdit" /* InlineChatResponseType.BulkEdit */) {
                //
                const edits = bulkEditService_1.ResourceEdit.convert(raw.edits);
                for (const edit of edits) {
                    if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                        if (edit.newResource && !edit.oldResource) {
                            editsMap.set(edit.newResource, []);
                            if (edit.options.contents) {
                                console.warn('CONTENT not supported');
                            }
                        }
                    }
                    else if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                        //
                        const array = editsMap.get(edit.resource);
                        if (array) {
                            array.push([edit.textEdit]);
                        }
                        else {
                            editsMap.set(edit.resource, [[edit.textEdit]]);
                        }
                    }
                }
            }
            let needsWorkspaceEdit = false;
            for (const [uri, edits] of editsMap) {
                const flatEdits = edits.flat();
                if (flatEdits.length === 0) {
                    editsMap.delete(uri);
                    continue;
                }
                const isLocalUri = (0, resources_1.isEqual)(uri, localUri);
                needsWorkspaceEdit = needsWorkspaceEdit || (uri.scheme !== network_1.Schemas.untitled && !isLocalUri);
                if (uri.scheme === network_1.Schemas.untitled && !isLocalUri && !this.untitledTextModel) { //TODO@jrieken the first untitled model WINS
                    const langSelection = this._languageService.createByFilepathOrFirstLine(uri, undefined);
                    const untitledTextModel = this._textFileService.untitled.create({
                        associatedResource: uri,
                        languageId: langSelection.languageId
                    });
                    this.untitledTextModel = untitledTextModel;
                    untitledTextModel.resolve().then(async () => {
                        const model = untitledTextModel.textEditorModel;
                        model.applyEdits(flatEdits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text)));
                    });
                }
            }
            this.allLocalEdits = editsMap.get(localUri) ?? [];
            if (needsWorkspaceEdit) {
                const workspaceEdits = [];
                for (const [uri, edits] of editsMap) {
                    for (const edit of edits.flat()) {
                        workspaceEdits.push({ resource: uri, textEdit: edit, versionId: undefined });
                    }
                }
                this.workspaceEdit = { edits: workspaceEdits };
            }
            const hasEdits = editsMap.size > 0;
            const hasMessage = mdContent.value.length > 0;
            if (hasEdits && hasMessage) {
                this.responseType = "mixed" /* InlineChatResponseTypes.Mixed */;
            }
            else if (hasEdits) {
                this.responseType = "onlyEdits" /* InlineChatResponseTypes.OnlyEdits */;
            }
            else if (hasMessage) {
                this.responseType = "onlyMessages" /* InlineChatResponseTypes.OnlyMessages */;
            }
            else {
                this.responseType = "empty" /* InlineChatResponseTypes.Empty */;
            }
        }
    };
    exports.ReplyResponse = ReplyResponse;
    exports.ReplyResponse = ReplyResponse = __decorate([
        __param(6, textfiles_1.ITextFileService),
        __param(7, language_1.ILanguageService)
    ], ReplyResponse);
    let StashedSession = class StashedSession {
        constructor(editor, session, _undoCancelEdits, contextKeyService, _sessionService, _logService) {
            this._undoCancelEdits = _undoCancelEdits;
            this._sessionService = _sessionService;
            this._logService = _logService;
            this._ctxHasStashedSession = inlineChat_1.CTX_INLINE_CHAT_HAS_STASHED_SESSION.bindTo(contextKeyService);
            // keep session for a little bit, only release when user continues to work (type, move cursor, etc.)
            this._session = session;
            this._ctxHasStashedSession.set(true);
            this._listener = event_1.Event.once(event_1.Event.any(editor.onDidChangeCursorSelection, editor.onDidChangeModelContent, editor.onDidChangeModel))(() => {
                this._session = undefined;
                this._sessionService.releaseSession(session);
                this._ctxHasStashedSession.reset();
            });
        }
        dispose() {
            this._listener.dispose();
            this._ctxHasStashedSession.reset();
            if (this._session) {
                this._sessionService.releaseSession(this._session);
            }
        }
        unstash() {
            if (!this._session) {
                return undefined;
            }
            this._listener.dispose();
            const result = this._session;
            result.markUnstashed();
            result.hunkData.ignoreTextModelNChanges = true;
            result.textModelN.pushEditOperations(null, this._undoCancelEdits, () => null);
            result.hunkData.ignoreTextModelNChanges = false;
            this._session = undefined;
            this._logService.debug('[IE] Unstashed session');
            return result;
        }
    };
    exports.StashedSession = StashedSession;
    exports.StashedSession = StashedSession = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, inlineChatSessionService_1.IInlineChatSessionService),
        __param(5, log_1.ILogService)
    ], StashedSession);
    // ---
    let HunkData = class HunkData {
        static { HunkData_1 = this; }
        static { this._HUNK_TRACKED_RANGE = textModel_1.ModelDecorationOptions.register({
            description: 'inline-chat-hunk-tracked-range',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */
        }); }
        static { this._HUNK_THRESHOLD = 8; }
        constructor(_editorWorkerService, _textModel0, _textModelN) {
            this._editorWorkerService = _editorWorkerService;
            this._textModel0 = _textModel0;
            this._textModelN = _textModelN;
            this._store = new lifecycle_1.DisposableStore();
            this._data = new Map();
            this._ignoreChanges = false;
            this._store.add(_textModelN.onDidChangeContent(e => {
                if (!this._ignoreChanges) {
                    this._mirrorChanges(e);
                }
            }));
        }
        dispose() {
            if (!this._textModelN.isDisposed()) {
                this._textModelN.changeDecorations(accessor => {
                    for (const { textModelNDecorations } of this._data.values()) {
                        textModelNDecorations.forEach(accessor.removeDecoration, accessor);
                    }
                });
            }
            if (!this._textModel0.isDisposed()) {
                this._textModel0.changeDecorations(accessor => {
                    for (const { textModel0Decorations } of this._data.values()) {
                        textModel0Decorations.forEach(accessor.removeDecoration, accessor);
                    }
                });
            }
            this._data.clear();
            this._store.dispose();
        }
        set ignoreTextModelNChanges(value) {
            this._ignoreChanges = value;
        }
        get ignoreTextModelNChanges() {
            return this._ignoreChanges;
        }
        _mirrorChanges(event) {
            // mirror textModelN changes to textModel0 execept for those that
            // overlap with a hunk
            const hunkRanges = [];
            const ranges0 = [];
            for (const { textModelNDecorations, textModel0Decorations, state } of this._data.values()) {
                if (state === 0 /* HunkState.Pending */) {
                    // pending means the hunk's changes aren't "sync'd" yet
                    for (let i = 1; i < textModelNDecorations.length; i++) {
                        const rangeN = this._textModelN.getDecorationRange(textModelNDecorations[i]);
                        const range0 = this._textModel0.getDecorationRange(textModel0Decorations[i]);
                        if (rangeN && range0) {
                            hunkRanges.push({ rangeN, range0 });
                        }
                    }
                }
                else if (state === 1 /* HunkState.Accepted */) {
                    // accepted means the hunk's changes are also in textModel0
                    for (let i = 1; i < textModel0Decorations.length; i++) {
                        const range = this._textModel0.getDecorationRange(textModel0Decorations[i]);
                        if (range) {
                            ranges0.push(range);
                        }
                    }
                }
            }
            hunkRanges.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.rangeN, b.rangeN));
            ranges0.sort(range_1.Range.compareRangesUsingStarts);
            const edits = [];
            for (const change of event.changes) {
                let isOverlapping = false;
                let pendingChangesLen = 0;
                for (const { rangeN, range0 } of hunkRanges) {
                    if (rangeN.getEndPosition().isBefore(range_1.Range.getStartPosition(change.range))) {
                        // pending hunk _before_ this change. When projecting into textModel0 we need to
                        // subtract that. Because diffing is relaxed it might include changes that are not
                        // actual insertions/deletions. Therefore we need to take the length of the original
                        // range into account.
                        pendingChangesLen += this._textModelN.getValueLengthInRange(rangeN);
                        pendingChangesLen -= this._textModel0.getValueLengthInRange(range0);
                    }
                    else if (range_1.Range.areIntersectingOrTouching(rangeN, change.range)) {
                        isOverlapping = true;
                        break;
                    }
                    else {
                        // hunks past this change aren't relevant
                        break;
                    }
                }
                if (isOverlapping) {
                    // hunk overlaps, it grew
                    continue;
                }
                const offset0 = change.rangeOffset - pendingChangesLen;
                const start0 = this._textModel0.getPositionAt(offset0);
                let acceptedChangesLen = 0;
                for (const range of ranges0) {
                    if (range.getEndPosition().isBefore(start0)) {
                        // accepted hunk _before_ this projected change. When projecting into textModel0
                        // we need to add that
                        acceptedChangesLen += this._textModel0.getValueLengthInRange(range);
                    }
                }
                const start = this._textModel0.getPositionAt(offset0 + acceptedChangesLen);
                const end = this._textModel0.getPositionAt(offset0 + acceptedChangesLen + change.rangeLength);
                edits.push(editOperation_1.EditOperation.replace(range_1.Range.fromPositions(start, end), change.text));
            }
            this._textModel0.pushEditOperations(null, edits, () => null);
        }
        async recompute() {
            const diff = await this._editorWorkerService.computeDiff(this._textModel0.uri, this._textModelN.uri, { ignoreTrimWhitespace: false, maxComputationTimeMs: Number.MAX_SAFE_INTEGER, computeMoves: false }, 'advanced');
            if (!diff || diff.changes.length === 0) {
                // return new HunkData([], session);
                return;
            }
            // merge changes neighboring changes
            const mergedChanges = [diff.changes[0]];
            for (let i = 1; i < diff.changes.length; i++) {
                const lastChange = mergedChanges[mergedChanges.length - 1];
                const thisChange = diff.changes[i];
                if (thisChange.modified.startLineNumber - lastChange.modified.endLineNumberExclusive <= HunkData_1._HUNK_THRESHOLD) {
                    mergedChanges[mergedChanges.length - 1] = new rangeMapping_1.DetailedLineRangeMapping(lastChange.original.join(thisChange.original), lastChange.modified.join(thisChange.modified), (lastChange.innerChanges ?? []).concat(thisChange.innerChanges ?? []));
                }
                else {
                    mergedChanges.push(thisChange);
                }
            }
            const hunks = mergedChanges.map(change => new RawHunk(change.original, change.modified, change.innerChanges ?? []));
            this._textModelN.changeDecorations(accessorN => {
                this._textModel0.changeDecorations(accessor0 => {
                    // clean up old decorations
                    for (const { textModelNDecorations, textModel0Decorations } of this._data.values()) {
                        textModelNDecorations.forEach(accessorN.removeDecoration, accessorN);
                        textModel0Decorations.forEach(accessor0.removeDecoration, accessor0);
                    }
                    this._data.clear();
                    // add new decorations
                    for (const hunk of hunks) {
                        const textModelNDecorations = [];
                        const textModel0Decorations = [];
                        textModelNDecorations.push(accessorN.addDecoration((0, utils_1.asRange)(hunk.modified, this._textModelN), HunkData_1._HUNK_TRACKED_RANGE));
                        textModel0Decorations.push(accessor0.addDecoration((0, utils_1.asRange)(hunk.original, this._textModel0), HunkData_1._HUNK_TRACKED_RANGE));
                        for (const change of hunk.changes) {
                            textModelNDecorations.push(accessorN.addDecoration(change.modifiedRange, HunkData_1._HUNK_TRACKED_RANGE));
                            textModel0Decorations.push(accessor0.addDecoration(change.originalRange, HunkData_1._HUNK_TRACKED_RANGE));
                        }
                        this._data.set(hunk, {
                            textModelNDecorations,
                            textModel0Decorations,
                            state: 0 /* HunkState.Pending */
                        });
                    }
                });
            });
        }
        get size() {
            return this._data.size;
        }
        get pending() {
            return iterator_1.Iterable.reduce(this._data.values(), (r, { state }) => r + (state === 0 /* HunkState.Pending */ ? 1 : 0), 0);
        }
        _discardEdits(item) {
            const edits = [];
            const rangesN = item.getRangesN();
            const ranges0 = item.getRanges0();
            for (let i = 1; i < rangesN.length; i++) {
                const modifiedRange = rangesN[i];
                const originalValue = this._textModel0.getValueInRange(ranges0[i]);
                edits.push(editOperation_1.EditOperation.replace(modifiedRange, originalValue));
            }
            return edits;
        }
        discardAll() {
            const edits = [];
            for (const item of this.getInfo()) {
                if (item.getState() !== 2 /* HunkState.Rejected */) {
                    edits.push(this._discardEdits(item));
                }
            }
            const undoEdits = [];
            this._textModelN.pushEditOperations(null, edits.flat(), (_undoEdits) => {
                undoEdits.push(_undoEdits);
                return null;
            });
            return undoEdits.flat();
        }
        getInfo() {
            const result = [];
            for (const [hunk, data] of this._data.entries()) {
                const item = {
                    getState: () => {
                        return data.state;
                    },
                    isInsertion: () => {
                        return hunk.original.isEmpty;
                    },
                    getRangesN: () => {
                        const ranges = data.textModelNDecorations.map(id => this._textModelN.getDecorationRange(id));
                        (0, arrays_1.coalesceInPlace)(ranges);
                        return ranges;
                    },
                    getRanges0: () => {
                        const ranges = data.textModel0Decorations.map(id => this._textModel0.getDecorationRange(id));
                        (0, arrays_1.coalesceInPlace)(ranges);
                        return ranges;
                    },
                    discardChanges: () => {
                        // DISCARD: replace modified range with original value. The modified range is retrieved from a decoration
                        // which was created above so that typing in the editor keeps discard working.
                        if (data.state === 0 /* HunkState.Pending */) {
                            const edits = this._discardEdits(item);
                            this._textModelN.pushEditOperations(null, edits, () => null);
                            data.state = 2 /* HunkState.Rejected */;
                        }
                    },
                    acceptChanges: () => {
                        // ACCEPT: replace original range with modified value. The modified value is retrieved from the model via
                        // its decoration and the original range is retrieved from the hunk.
                        if (data.state === 0 /* HunkState.Pending */) {
                            const edits = [];
                            const rangesN = item.getRangesN();
                            const ranges0 = item.getRanges0();
                            for (let i = 1; i < ranges0.length; i++) {
                                const originalRange = ranges0[i];
                                const modifiedValue = this._textModelN.getValueInRange(rangesN[i]);
                                edits.push(editOperation_1.EditOperation.replace(originalRange, modifiedValue));
                            }
                            this._textModel0.pushEditOperations(null, edits, () => null);
                            data.state = 1 /* HunkState.Accepted */;
                        }
                    }
                };
                result.push(item);
            }
            return result;
        }
    };
    exports.HunkData = HunkData;
    exports.HunkData = HunkData = HunkData_1 = __decorate([
        __param(0, editorWorker_1.IEditorWorkerService)
    ], HunkData);
    class RawHunk {
        constructor(original, modified, changes) {
            this.original = original;
            this.modified = modified;
            this.changes = changes;
        }
    }
    var HunkState;
    (function (HunkState) {
        HunkState[HunkState["Pending"] = 0] = "Pending";
        HunkState[HunkState["Accepted"] = 1] = "Accepted";
        HunkState[HunkState["Rejected"] = 2] = "Rejected";
    })(HunkState || (exports.HunkState = HunkState = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFNlc3Npb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvYnJvd3Nlci9pbmxpbmVDaGF0U2Vzc2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBcUVoRyxNQUFhLGlCQUFpQjtpQkFFTCxhQUFRLEdBQTRCLGtDQUFzQixDQUFDLFFBQVEsQ0FBQyxFQUFFLFdBQVcsRUFBRSwrQkFBK0IsRUFBRSxDQUFDLEFBQTdHLENBQThHO1FBTzlJLFlBQTZCLFVBQXNCLEVBQUUsVUFBa0I7WUFBMUMsZUFBVSxHQUFWLFVBQVUsQ0FBWTtZQUxsQyxpQkFBWSxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDM0MsZ0JBQVcsR0FBZ0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFFcEQsbUJBQWMsR0FBYSxFQUFFLENBQUM7WUFHckMsSUFBSSxDQUFDLGNBQWMsR0FBRyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckgsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMzRCxDQUFDO1FBQ0YsQ0FBQztRQUVELFVBQVUsQ0FBQyxLQUE2QjtZQUN2QyxNQUFNLE9BQU8sR0FBNEIs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