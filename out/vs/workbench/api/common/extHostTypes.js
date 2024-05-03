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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/map", "vs/base/common/mime", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/extensions/common/extensions", "vs/platform/files/common/files", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, arrays_1, errors_1, htmlContent_1, map_1, mime_1, strings_1, types_1, uri_1, uuid_1, extensions_1, files_1, remoteAuthorityResolver_1, notebookCommon_1) {
    "use strict";
    var Disposable_1, Position_1, Range_1, Selection_1, TextEdit_1, NotebookEdit_1, SnippetString_1, Location_1, SymbolInformation_1, DocumentSymbol_1, CodeActionKind_1, MarkdownString_1, TaskGroup_1, Task_1, TreeItem_1, FileSystemError_1, TestMessage_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineEditTriggerKind = exports.InlineEdit = exports.KeywordRecognitionStatus = exports.SpeechToTextStatus = exports.RelatedInformationType = exports.LanguageModelError = exports.LanguageModelChatAssistantMessage = exports.LanguageModelChatUserMessage = exports.LanguageModelChatSystemMessage = exports.ChatLocation = exports.ChatResponseTurn = exports.ChatRequestTurn = exports.ChatResponseReferencePart = exports.ChatResponseCommandButtonPart = exports.ChatResponseProgressPart = exports.ChatResponseAnchorPart = exports.ChatResponseFileTreePart = exports.ChatResponseMarkdownPart = exports.ChatResultFeedbackKind = exports.InteractiveEditorResponseFeedbackKind = exports.ChatCompletionItem = exports.ChatVariableLevel = exports.ChatCopyKind = exports.InteractiveSessionVoteDirection = exports.TextMultiDiffTabInput = exports.ChatEditorTabInput = exports.InteractiveWindowInput = exports.TerminalEditorTabInput = exports.NotebookDiffEditorTabInput = exports.NotebookEditorTabInput = exports.WebviewEditorTabInput = exports.CustomEditorTabInput = exports.TextMergeTabInput = exports.TextDiffTabInput = exports.TextTabInput = exports.TypeHierarchyItem = exports.PortAutoForwardAction = exports.WorkspaceTrustState = exports.ExternalUriOpenerPriority = exports.DeclarationCoverage = exports.BranchCoverage = exports.StatementCoverage = exports.FileCoverage = exports.TestCoverageCount = exports.TestTag = exports.TestMessage = exports.TestRunRequest = exports.TestRunProfileKind = exports.TestResultState = exports.PortAttributes = exports.LinkedEditingRanges = exports.StandardTokenType = exports.ExtensionRuntime = exports.ExtensionMode = exports.TimelineItem = exports.NotebookVariablesRequestKind = exports.NotebookKernelSourceAction = exports.NotebookRendererScript = exports.NotebookControllerAffinity2 = exports.NotebookControllerAffinity = exports.NotebookCellStatusBarItem = exports.NotebookEditorRevealType = exports.NotebookCellStatusBarAlignment = exports.NotebookCellExecutionState = exports.NotebookCellKind = exports.NotebookCellOutput = exports.NotebookCellOutputItem = exports.NotebookData = exports.NotebookCellData = exports.NotebookRange = exports.ColorThemeKind = exports.ColorTheme = exports.FileDecoration = exports.ExtensionKind = exports.InputBoxValidationSeverity = exports.QuickPickItemKind = exports.QuickInputButtons = exports.DebugVisualization = exports.DebugConsoleMode = exports.SemanticTokensEdits = exports.SemanticTokensEdit = exports.SemanticTokens = exports.SemanticTokensBuilder = exports.SemanticTokensLegend = exports.CommentThreadApplicability = exports.CommentThreadState = exports.CommentState = exports.CommentMode = exports.CommentThreadCollapsibleState = exports.FoldingRangeKind = exports.FoldingRange = exports.FileSystemError = exports.FileChangeType = exports.NewSymbolName = exports.NewSymbolNameTag = exports.InlineValueContext = exports.InlineValueEvaluatableExpression = exports.InlineValueVariableLookup = exports.InlineValueText = exports.InlineCompletionTriggerKind = exports.EvaluatableExpression = exports.Thread = exports.StackFrame = exports.DebugAdapterInlineImplementation = exports.DebugAdapterNamedPipeServer = exports.DebugAdapterServer = exports.DebugAdapterExecutable = exports.DataBreakpoint = exports.FunctionBreakpoint = exports.SourceBreakpoint = exports.Breakpoint = exports.RelativePattern = exports.ConfigurationTarget = exports.ThemeColor = exports.ThemeIcon = exports.DocumentPasteEdit = exports.DocumentPasteEditKind = exports.DocumentPasteTriggerKind = exports.DocumentDropEdit = exports.DataTransfer = exports.DataTransferFile = exports.InternalFileDataTransferItem = exports.InternalDataTransferItem = exports.DataTransferItem = exports.TreeItemCheckboxState = exports.TreeItemCollapsibleState = exports.TreeItem = exports.ViewBadge = exports.ProgressLocation = exports.Task = exports.CustomExecution = exports.TaskScope = exports.ShellQuoting = exports.ShellExecution = exports.ProcessExecution = exports.TaskGroup = exports.TaskPanelKind = exports.TaskRevealKind = exports.TerminalProfile = exports.TerminalLocation = exports.TerminalQuickFixCommand = exports.TerminalQuickFixOpener = exports.TerminalLink = exports.TerminalExitReason = exports.SourceControlInputBoxValidationType = exports.ColorFormat = exports.ColorPresentation = exports.ColorInformation = exports.Color = exports.DocumentLink = exports.SyntaxTokenType = exports.DecorationRangeBehavior = exports.TextDocumentChangeReason = exports.TextEditorSelectionChangeKind = exports.TextEditorRevealType = exports.TextDocumentSaveReason = exports.TextEditorLineNumbersStyle = exports.StatusBarAlignment = exports.ViewColumn = exports.PartialAcceptTriggerKind = exports.InlineSuggestionList = exports.InlineSuggestion = exports.CompletionList = exports.CompletionItem = exports.CompletionItemTag = exports.CompletionItemKind = exports.CompletionTriggerKind = exports.InlayHint = exports.InlayHintLabelPart = exports.InlayHintKind = exports.SignatureHelpTriggerKind = exports.SignatureHelp = exports.SignatureInformation = exports.ParameterInformation = exports.MarkdownString = exports.CodeLens = exports.LanguageStatusSeverity = exports.CallHierarchyOutgoingCall = exports.CallHierarchyIncomingCall = exports.CallHierarchyItem = exports.SelectionRange = exports.CodeActionKind = exports.CodeAction = exports.CodeActionTriggerKind = exports.DocumentSymbol = exports.SymbolInformation = exports.SymbolTag = exports.SymbolKind = exports.MultiDocumentHighlight = exports.DocumentHighlight = exports.DocumentHighlightKind = exports.Hover = exports.Diagnostic = exports.DiagnosticRelatedInformation = exports.Location = exports.DiagnosticSeverity = exports.DiagnosticTag = exports.SnippetString = exports.WorkspaceEdit = exports.FileEditType = exports.SnippetTextEdit = exports.NotebookEdit = exports.TextEdit = exports.EnvironmentVariableMutatorType = exports.EndOfLine = exports.RemoteAuthorityResolverError = exports.ManagedResolvedAuthority = exports.ResolvedAuthority = exports.Selection = exports.Range = exports.Position = exports.Disposable = exports.TerminalQuickFixType = exports.TerminalOutputAnchor = void 0;
    exports.asStatusBarItemIdentifier = asStatusBarItemIdentifier;
    exports.setBreakpointId = setBreakpointId;
    exports.validateTestCoverageCount = validateTestCoverageCount;
    /**
     * @deprecated
     *
     * This utility ensures that old JS code that uses functions for classes still works. Existing usages cannot be removed
     * but new ones must not be added
     * */
    function es5ClassCompat(target) {
        const interceptFunctions = {
            apply: function (...args) {
                if (args.length === 0) {
                    return Reflect.construct(target, []);
                }
                else {
                    const argsList = args.length === 1 ? [] : args[1];
                    return Reflect.construct(target, argsList, args[0].constructor);
                }
            },
            call: function (...args) {
                if (args.length === 0) {
                    return Reflect.construct(target, []);
                }
                else {
                    const [thisArg, ...restArgs] = args;
                    return Reflect.construct(target, restArgs, thisArg.constructor);
                }
            }
        };
        return Object.assign(target, interceptFunctions);
    }
    var TerminalOutputAnchor;
    (function (TerminalOutputAnchor) {
        TerminalOutputAnchor[TerminalOutputAnchor["Top"] = 0] = "Top";
        TerminalOutputAnchor[TerminalOutputAnchor["Bottom"] = 1] = "Bottom";
    })(TerminalOutputAnchor || (exports.TerminalOutputAnchor = TerminalOutputAnchor = {}));
    var TerminalQuickFixType;
    (function (TerminalQuickFixType) {
        TerminalQuickFixType[TerminalQuickFixType["TerminalCommand"] = 0] = "TerminalCommand";
        TerminalQuickFixType[TerminalQuickFixType["Opener"] = 1] = "Opener";
        TerminalQuickFixType[TerminalQuickFixType["Command"] = 3] = "Command";
    })(TerminalQuickFixType || (exports.TerminalQuickFixType = TerminalQuickFixType = {}));
    let Disposable = Disposable_1 = class Disposable {
        static from(...inDisposables) {
            let disposables = inDisposables;
            return new Disposable_1(function () {
                if (disposables) {
                    for (const disposable of disposables) {
                        if (disposable && typeof disposable.dispose === 'function') {
                            disposable.dispose();
                        }
                    }
                    disposables = undefined;
                }
            });
        }
        #callOnDispose;
        constructor(callOnDispose) {
            this.#callOnDispose = callOnDispose;
        }
        dispose() {
            if (typeof this.#callOnDispose === 'function') {
                this.#callOnDispose();
                this.#callOnDispose = undefined;
            }
        }
    };
    exports.Disposable = Disposable;
    exports.Disposable = Disposable = Disposable_1 = __decorate([
        es5ClassCompat
    ], Disposable);
    let Position = Position_1 = class Position {
        static Min(...positions) {
            if (positions.length === 0) {
                throw new TypeError();
            }
            let result = positions[0];
            for (let i = 1; i < positions.length; i++) {
                const p = positions[i];
                if (p.isBefore(result)) {
                    result = p;
                }
            }
            return result;
        }
        static Max(...positions) {
            if (positions.length === 0) {
                throw new TypeError();
            }
            let result = positions[0];
            for (let i = 1; i < positions.length; i++) {
                const p = positions[i];
                if (p.isAfter(result)) {
                    result = p;
                }
            }
            return result;
        }
        static isPosition(other) {
            if (!other) {
                return false;
            }
            if (other instanceof Position_1) {
                return true;
            }
            const { line, character } = other;
            if (typeof line === 'number' && typeof character === 'number') {
                return true;
            }
            return false;
        }
        static of(obj) {
            if (obj instanceof Position_1) {
                return obj;
            }
            else if (this.isPosition(obj)) {
                return new Position_1(obj.line, obj.character);
            }
            throw new Error('Invalid argument, is NOT a position-like object');
        }
        get line() {
            return this._line;
        }
        get character() {
            return this._character;
        }
        constructor(line, character) {
            if (line < 0) {
                throw (0, errors_1.illegalArgument)('line must be non-negative');
            }
            if (character < 0) {
                throw (0, errors_1.illegalArgument)('character must be non-negative');
            }
            this._line = line;
            this._character = character;
        }
        isBefore(other) {
            if (this._line < other._line) {
                return true;
            }
            if (other._line < this._line) {
                return false;
            }
            return this._character < other._character;
        }
        isBeforeOrEqual(other) {
            if (this._line < other._line) {
                return true;
            }
            if (other._line < this._line) {
                return false;
            }
            return this._character <= other._character;
        }
        isAfter(other) {
            return !this.isBeforeOrEqual(other);
        }
        isAfterOrEqual(other) {
            return !this.isBefore(other);
        }
        isEqual(other) {
            return this._line === other._line && this._character === other._character;
        }
        compareTo(other) {
            if (this._line < other._line) {
                return -1;
            }
            else if (this._line > other.line) {
                return 1;
            }
            else {
                // equal line
                if (this._character < other._character) {
                    return -1;
                }
                else if (this._character > other._character) {
                    return 1;
                }
                else {
                    // equal line and character
                    return 0;
                }
            }
        }
        translate(lineDeltaOrChange, characterDelta = 0) {
            if (lineDeltaOrChange === null || characterDelta === null) {
                throw (0, errors_1.illegalArgument)();
            }
            let lineDelta;
            if (typeof lineDeltaOrChange === 'undefined') {
                lineDelta = 0;
            }
            else if (typeof lineDeltaOrChange === 'number') {
                lineDelta = lineDeltaOrChange;
            }
            else {
                lineDelta = typeof lineDeltaOrChange.lineDelta === 'number' ? lineDeltaOrChange.lineDelta : 0;
                characterDelta = typeof lineDeltaOrChange.characterDelta === 'number' ? lineDeltaOrChange.characterDelta : 0;
            }
            if (lineDelta === 0 && characterDelta === 0) {
                return this;
            }
            return new Position_1(this.line + lineDelta, this.character + characterDelta);
        }
        with(lineOrChange, character = this.character) {
            if (lineOrChange === null || character === null) {
                throw (0, errors_1.illegalArgument)();
            }
            let line;
            if (typeof lineOrChange === 'undefined') {
                line = this.line;
            }
            else if (typeof lineOrChange === 'number') {
                line = lineOrChange;
            }
            else {
                line = typeof lineOrChange.line === 'number' ? lineOrChange.line : this.line;
                character = typeof lineOrChange.character === 'number' ? lineOrChange.character : this.character;
            }
            if (line === this.line && character === this.character) {
                return this;
            }
            return new Position_1(line, character);
        }
        toJSON() {
            return { line: this.line, character: this.character };
        }
    };
    exports.Position = Position;
    exports.Position = Position = Position_1 = __decorate([
        es5ClassCompat
    ], Position);
    let Range = Range_1 = class Range {
        static isRange(thing) {
            if (thing instanceof Range_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Position.isPosition(thing.start)
                && Position.isPosition(thing.end);
        }
        static of(obj) {
            if (obj instanceof Range_1) {
                return obj;
            }
            if (this.isRange(obj)) {
                return new Range_1(obj.start, obj.end);
            }
            throw new Error('Invalid argument, is NOT a range-like object');
        }
        get start() {
            return this._start;
        }
        get end() {
            return this._end;
        }
        constructor(startLineOrStart, startColumnOrEnd, endLine, endColumn) {
            let start;
            let end;
            if (typeof startLineOrStart === 'number' && typeof startColumnOrEnd === 'number' && typeof endLine === 'number' && typeof endColumn === 'number') {
                start = new Position(startLineOrStart, startColumnOrEnd);
                end = new Position(endLine, endColumn);
            }
            else if (Position.isPosition(startLineOrStart) && Position.isPosition(startColumnOrEnd)) {
                start = Position.of(startLineOrStart);
                end = Position.of(startColumnOrEnd);
            }
            if (!start || !end) {
                throw new Error('Invalid arguments');
            }
            if (start.isBefore(end)) {
                this._start = start;
                this._end = end;
            }
            else {
                this._start = end;
                this._end = start;
            }
        }
        contains(positionOrRange) {
            if (Range_1.isRange(positionOrRange)) {
                return this.contains(positionOrRange.start)
                    && this.contains(positionOrRange.end);
            }
            else if (Position.isPosition(positionOrRange)) {
                if (Position.of(positionOrRange).isBefore(this._start)) {
                    return false;
                }
                if (this._end.isBefore(positionOrRange)) {
                    return false;
                }
                return true;
            }
            return false;
        }
        isEqual(other) {
            return this._start.isEqual(other._start) && this._end.isEqual(other._end);
        }
        intersection(other) {
            const start = Position.Max(other.start, this._start);
            const end = Position.Min(other.end, this._end);
            if (start.isAfter(end)) {
                // this happens when there is no overlap:
                // |-----|
                //          |----|
                return undefined;
            }
            return new Range_1(start, end);
        }
        union(other) {
            if (this.contains(other)) {
                return this;
            }
            else if (other.contains(this)) {
                return other;
            }
            const start = Position.Min(other.start, this._start);
            const end = Position.Max(other.end, this.end);
            return new Range_1(start, end);
        }
        get isEmpty() {
            return this._start.isEqual(this._end);
        }
        get isSingleLine() {
            return this._start.line === this._end.line;
        }
        with(startOrChange, end = this.end) {
            if (startOrChange === null || end === null) {
                throw (0, errors_1.illegalArgument)();
            }
            let start;
            if (!startOrChange) {
                start = this.start;
            }
            else if (Position.isPosition(startOrChange)) {
                start = startOrChange;
            }
            else {
                start = startOrChange.start || this.start;
                end = startOrChange.end || this.end;
            }
            if (start.isEqual(this._start) && end.isEqual(this.end)) {
                return this;
            }
            return new Range_1(start, end);
        }
        toJSON() {
            return [this.start, this.end];
        }
    };
    exports.Range = Range;
    exports.Range = Range = Range_1 = __decorate([
        es5ClassCompat
    ], Range);
    let Selection = Selection_1 = class Selection extends Range {
        static isSelection(thing) {
            if (thing instanceof Selection_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Range.isRange(thing)
                && Position.isPosition(thing.anchor)
                && Position.isPosition(thing.active)
                && typeof thing.isReversed === 'boolean';
        }
        get anchor() {
            return this._anchor;
        }
        get active() {
            return this._active;
        }
        constructor(anchorLineOrAnchor, anchorColumnOrActive, activeLine, activeColumn) {
            let anchor;
            let active;
            if (typeof anchorLineOrAnchor === 'number' && typeof anchorColumnOrActive === 'number' && typeof activeLine === 'number' && typeof activeColumn === 'number') {
                anchor = new Position(anchorLineOrAnchor, anchorColumnOrActive);
                active = new Position(activeLine, activeColumn);
            }
            else if (Position.isPosition(anchorLineOrAnchor) && Position.isPosition(anchorColumnOrActive)) {
                anchor = Position.of(anchorLineOrAnchor);
                active = Position.of(anchorColumnOrActive);
            }
            if (!anchor || !active) {
                throw new Error('Invalid arguments');
            }
            super(anchor, active);
            this._anchor = anchor;
            this._active = active;
        }
        get isReversed() {
            return this._anchor === this._end;
        }
        toJSON() {
            return {
                start: this.start,
                end: this.end,
                active: this.active,
                anchor: this.anchor
            };
        }
    };
    exports.Selection = Selection;
    exports.Selection = Selection = Selection_1 = __decorate([
        es5ClassCompat
    ], Selection);
    const validateConnectionToken = (connectionToken) => {
        if (typeof connectionToken !== 'string' || connectionToken.length === 0 || !/^[0-9A-Za-z_\-]+$/.test(connectionToken)) {
            throw (0, errors_1.illegalArgument)('connectionToken');
        }
    };
    class ResolvedAuthority {
        static isResolvedAuthority(resolvedAuthority) {
            return resolvedAuthority
                && typeof resolvedAuthority === 'object'
                && typeof resolvedAuthority.host === 'string'
                && typeof resolvedAuthority.port === 'number'
                && (resolvedAuthority.connectionToken === undefined || typeof resolvedAuthority.connectionToken === 'string');
        }
        constructor(host, port, connectionToken) {
            if (typeof host !== 'string' || host.length === 0) {
                throw (0, errors_1.illegalArgument)('host');
            }
            if (typeof port !== 'number' || port === 0 || Math.round(port) !== port) {
                throw (0, errors_1.illegalArgument)('port');
            }
            if (typeof connectionToken !== 'undefined') {
                validateConnectionToken(connectionToken);
            }
            this.host = host;
            this.port = Math.round(port);
            this.connectionToken = connectionToken;
        }
    }
    exports.ResolvedAuthority = ResolvedAuthority;
    class ManagedResolvedAuthority {
        static isManagedResolvedAuthority(resolvedAuthority) {
            return resolvedAuthority
                && typeof resolvedAuthority === 'object'
                && typeof resolvedAuthority.makeConnection === 'function'
                && (resolvedAuthority.connectionToken === undefined || typeof resolvedAuthority.connectionToken === 'string');
        }
        constructor(makeConnection, connectionToken) {
            this.makeConnection = makeConnection;
            this.connectionToken = connectionToken;
            if (typeof connectionToken !== 'undefined') {
                validateConnectionToken(connectionToken);
            }
        }
    }
    exports.ManagedResolvedAuthority = ManagedResolvedAuthority;
    class RemoteAuthorityResolverError extends Error {
        static NotAvailable(message, handled) {
            return new RemoteAuthorityResolverError(message, remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.NotAvailable, handled);
        }
        static TemporarilyNotAvailable(message) {
            return new RemoteAuthorityResolverError(message, remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable);
        }
        constructor(message, code = remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown, detail) {
            super(message);
            this._message = message;
            this._code = code;
            this._detail = detail;
            // workaround when extending builtin objects and when compiling to ES5, see:
            // https://github.com/microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            Object.setPrototypeOf(this, RemoteAuthorityResolverError.prototype);
        }
    }
    exports.RemoteAuthorityResolverError = RemoteAuthorityResolverError;
    var EndOfLine;
    (function (EndOfLine) {
        EndOfLine[EndOfLine["LF"] = 1] = "LF";
        EndOfLine[EndOfLine["CRLF"] = 2] = "CRLF";
    })(EndOfLine || (exports.EndOfLine = EndOfLine = {}));
    var EnvironmentVariableMutatorType;
    (function (EnvironmentVariableMutatorType) {
        EnvironmentVariableMutatorType[EnvironmentVariableMutatorType["Replace"] = 1] = "Replace";
        EnvironmentVariableMutatorType[EnvironmentVariableMutatorType["Append"] = 2] = "Append";
        EnvironmentVariableMutatorType[EnvironmentVariableMutatorType["Prepend"] = 3] = "Prepend";
    })(EnvironmentVariableMutatorType || (exports.EnvironmentVariableMutatorType = EnvironmentVariableMutatorType = {}));
    let TextEdit = TextEdit_1 = class TextEdit {
        static isTextEdit(thing) {
            if (thing instanceof TextEdit_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Range.isRange(thing)
                && typeof thing.newText === 'string';
        }
        static replace(range, newText) {
            return new TextEdit_1(range, newText);
        }
        static insert(position, newText) {
            return TextEdit_1.replace(new Range(position, position), newText);
        }
        static delete(range) {
            return TextEdit_1.replace(range, '');
        }
        static setEndOfLine(eol) {
            const ret = new TextEdit_1(new Range(new Position(0, 0), new Position(0, 0)), '');
            ret.newEol = eol;
            return ret;
        }
        get range() {
            return this._range;
        }
        set range(value) {
            if (value && !Range.isRange(value)) {
                throw (0, errors_1.illegalArgument)('range');
            }
            this._range = value;
        }
        get newText() {
            return this._newText || '';
        }
        set newText(value) {
            if (value && typeof value !== 'string') {
                throw (0, errors_1.illegalArgument)('newText');
            }
            this._newText = value;
        }
        get newEol() {
            return this._newEol;
        }
        set newEol(value) {
            if (value && typeof value !== 'number') {
                throw (0, errors_1.illegalArgument)('newEol');
            }
            this._newEol = value;
        }
        constructor(range, newText) {
            this._range = range;
            this._newText = newText;
        }
        toJSON() {
            return {
                range: this.range,
                newText: this.newText,
                newEol: this._newEol
            };
        }
    };
    exports.TextEdit = TextEdit;
    exports.TextEdit = TextEdit = TextEdit_1 = __decorate([
        es5ClassCompat
    ], TextEdit);
    let NotebookEdit = NotebookEdit_1 = class NotebookEdit {
        static isNotebookCellEdit(thing) {
            if (thing instanceof NotebookEdit_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return NotebookRange.isNotebookRange(thing)
                && Array.isArray(thing.newCells);
        }
        static replaceCells(range, newCells) {
            return new NotebookEdit_1(range, newCells);
        }
        static insertCells(index, newCells) {
            return new NotebookEdit_1(new NotebookRange(index, index), newCells);
        }
        static deleteCells(range) {
            return new NotebookEdit_1(range, []);
        }
        static updateCellMetadata(index, newMetadata) {
            const edit = new NotebookEdit_1(new NotebookRange(index, index), []);
            edit.newCellMetadata = newMetadata;
            return edit;
        }
        static updateNotebookMetadata(newMetadata) {
            const edit = new NotebookEdit_1(new NotebookRange(0, 0), []);
            edit.newNotebookMetadata = newMetadata;
            return edit;
        }
        constructor(range, newCells) {
            this.range = range;
            this.newCells = newCells;
        }
    };
    exports.NotebookEdit = NotebookEdit;
    exports.NotebookEdit = NotebookEdit = NotebookEdit_1 = __decorate([
        es5ClassCompat
    ], NotebookEdit);
    class SnippetTextEdit {
        static isSnippetTextEdit(thing) {
            if (thing instanceof SnippetTextEdit) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Range.isRange(thing.range)
                && SnippetString.isSnippetString(thing.snippet);
        }
        static replace(range, snippet) {
            return new SnippetTextEdit(range, snippet);
        }
        static insert(position, snippet) {
            return SnippetTextEdit.replace(new Range(position, position), snippet);
        }
        constructor(range, snippet) {
            this.range = range;
            this.snippet = snippet;
        }
    }
    exports.SnippetTextEdit = SnippetTextEdit;
    var FileEditType;
    (function (FileEditType) {
        FileEditType[FileEditType["File"] = 1] = "File";
        FileEditType[FileEditType["Text"] = 2] = "Text";
        FileEditType[FileEditType["Cell"] = 3] = "Cell";
        FileEditType[FileEditType["CellReplace"] = 5] = "CellReplace";
        FileEditType[FileEditType["Snippet"] = 6] = "Snippet";
    })(FileEditType || (exports.FileEditType = FileEditType = {}));
    let WorkspaceEdit = class WorkspaceEdit {
        constructor() {
            this._edits = [];
        }
        _allEntries() {
            return this._edits;
        }
        // --- file
        renameFile(from, to, options, metadata) {
            this._edits.push({ _type: 1 /* FileEditType.File */, from, to, options, metadata });
        }
        createFile(uri, options, metadata) {
            this._edits.push({ _type: 1 /* FileEditType.File */, from: undefined, to: uri, options, metadata });
        }
        deleteFile(uri, options, metadata) {
            this._edits.push({ _type: 1 /* FileEditType.File */, from: uri, to: undefined, options, metadata });
        }
        // --- notebook
        replaceNotebookMetadata(uri, value, metadata) {
            this._edits.push({ _type: 3 /* FileEditType.Cell */, metadata, uri, edit: { editType: 5 /* CellEditType.DocumentMetadata */, metadata: value }, notebookMetadata: value });
        }
        replaceNotebookCells(uri, startOrRange, cellData, metadata) {
            const start = startOrRange.start;
            const end = startOrRange.end;
            if (start !== end || cellData.length > 0) {
                this._edits.push({ _type: 5 /* FileEditType.CellReplace */, uri, index: start, count: end - start, cells: cellData, metadata });
            }
        }
        replaceNotebookCellMetadata(uri, index, cellMetadata, metadata) {
            this._edits.push({ _type: 3 /* FileEditType.Cell */, metadata, uri, edit: { editType: 3 /* CellEditType.Metadata */, index, metadata: cellMetadata } });
        }
        // --- text
        replace(uri, range, newText, metadata) {
            this._edits.push({ _type: 2 /* FileEditType.Text */, uri, edit: new TextEdit(range, newText), metadata });
        }
        insert(resource, position, newText, metadata) {
            this.replace(resource, new Range(position, position), newText, metadata);
        }
        delete(resource, range, metadata) {
            this.replace(resource, range, '', metadata);
        }
        // --- text (Maplike)
        has(uri) {
            return this._edits.some(edit => edit._type === 2 /* FileEditType.Text */ && edit.uri.toString() === uri.toString());
        }
        set(uri, edits) {
            if (!edits) {
                // remove all text, snippet, or notebook edits for `uri`
                for (let i = 0; i < this._edits.length; i++) {
                    const element = this._edits[i];
                    switch (element._type) {
                        case 2 /* FileEditType.Text */:
                        case 6 /* FileEditType.Snippet */:
                        case 3 /* FileEditType.Cell */:
                        case 5 /* FileEditType.CellReplace */:
                            if (element.uri.toString() === uri.toString()) {
                                this._edits[i] = undefined; // will be coalesced down below
                            }
                            break;
                    }
                }
                (0, arrays_1.coalesceInPlace)(this._edits);
            }
            else {
                // append edit to the end
                for (const editOrTuple of edits) {
                    if (!editOrTuple) {
                        continue;
                    }
                    let edit;
                    let metadata;
                    if (Array.isArray(editOrTuple)) {
                        edit = editOrTuple[0];
                        metadata = editOrTuple[1];
                    }
                    else {
                        edit = editOrTuple;
                    }
                    if (NotebookEdit.isNotebookCellEdit(edit)) {
                        if (edit.newCellMetadata) {
                            this.replaceNotebookCellMetadata(uri, edit.range.start, edit.newCellMetadata, metadata);
                        }
                        else if (edit.newNotebookMetadata) {
                            this.replaceNotebookMetadata(uri, edit.newNotebookMetadata, metadata);
                        }
                        else {
                            this.replaceNotebookCells(uri, edit.range, edit.newCells, metadata);
                        }
                    }
                    else if (SnippetTextEdit.isSnippetTextEdit(edit)) {
                        this._edits.push({ _type: 6 /* FileEditType.Snippet */, uri, range: edit.range, edit: edit.snippet, metadata });
                    }
                    else {
                        this._edits.push({ _type: 2 /* FileEditType.Text */, uri, edit, metadata });
                    }
                }
            }
        }
        get(uri) {
            const res = [];
            for (const candidate of this._edits) {
                if (candidate._type === 2 /* FileEditType.Text */ && candidate.uri.toString() === uri.toString()) {
                    res.push(candidate.edit);
                }
            }
            return res;
        }
        entries() {
            const textEdits = new map_1.ResourceMap();
            for (const candidate of this._edits) {
                if (candidate._type === 2 /* FileEditType.Text */) {
                    let textEdit = textEdits.get(candidate.uri);
                    if (!textEdit) {
                        textEdit = [candidate.uri, []];
                        textEdits.set(candidate.uri, textEdit);
                    }
                    textEdit[1].push(candidate.edit);
                }
            }
            return [...textEdits.values()];
        }
        get size() {
            return this.entries().length;
        }
        toJSON() {
            return this.entries();
        }
    };
    exports.WorkspaceEdit = WorkspaceEdit;
    exports.WorkspaceEdit = WorkspaceEdit = __decorate([
        es5ClassCompat
    ], WorkspaceEdit);
    let SnippetString = SnippetString_1 = class SnippetString {
        static isSnippetString(thing) {
            if (thing instanceof SnippetString_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return typeof thing.value === 'string';
        }
        static _escape(value) {
            return value.replace(/\$|}|\\/g, '\\$&');
        }
        constructor(value) {
            this._tabstop = 1;
            this.value = value || '';
        }
        appendText(string) {
            this.value += SnippetString_1._escape(string);
            return this;
        }
        appendTabstop(number = this._tabstop++) {
            this.value += '$';
            this.value += number;
            return this;
        }
        appendPlaceholder(value, number = this._tabstop++) {
            if (typeof value === 'function') {
                const nested = new SnippetString_1();
                nested._tabstop = this._tabstop;
                value(nested);
                this._tabstop = nested._tabstop;
                value = nested.value;
            }
            else {
                value = SnippetString_1._escape(value);
            }
            this.value += '${';
            this.value += number;
            this.value += ':';
            this.value += value;
            this.value += '}';
            return this;
        }
        appendChoice(values, number = this._tabstop++) {
            const value = values.map(s => s.replaceAll(/[|\\,]/g, '\\$&')).join(',');
            this.value += '${';
            this.value += number;
            this.value += '|';
            this.value += value;
            this.value += '|}';
            return this;
        }
        appendVariable(name, defaultValue) {
            if (typeof defaultValue === 'function') {
                const nested = new SnippetString_1();
                nested._tabstop = this._tabstop;
                defaultValue(nested);
                this._tabstop = nested._tabstop;
                defaultValue = nested.value;
            }
            else if (typeof defaultValue === 'string') {
                defaultValue = defaultValue.replace(/\$|}/g, '\\$&'); // CodeQL [SM02383] I do not want to escape backslashes here
            }
            this.value += '${';
            this.value += name;
            if (defaultValue) {
                this.value += ':';
                this.value += defaultValue;
            }
            this.value += '}';
            return this;
        }
    };
    exports.SnippetString = SnippetString;
    exports.SnippetString = SnippetString = SnippetString_1 = __decorate([
        es5ClassCompat
    ], SnippetString);
    var DiagnosticTag;
    (function (DiagnosticTag) {
        DiagnosticTag[DiagnosticTag["Unnecessary"] = 1] = "Unnecessary";
        DiagnosticTag[DiagnosticTag["Deprecated"] = 2] = "Deprecated";
    })(DiagnosticTag || (exports.DiagnosticTag = DiagnosticTag = {}));
    var DiagnosticSeverity;
    (function (DiagnosticSeverity) {
        DiagnosticSeverity[DiagnosticSeverity["Hint"] = 3] = "Hint";
        DiagnosticSeverity[DiagnosticSeverity["Information"] = 2] = "Information";
        DiagnosticSeverity[DiagnosticSeverity["Warning"] = 1] = "Warning";
        DiagnosticSeverity[DiagnosticSeverity["Error"] = 0] = "Error";
    })(DiagnosticSeverity || (exports.DiagnosticSeverity = DiagnosticSeverity = {}));
    let Location = Location_1 = class Location {
        static isLocation(thing) {
            if (thing instanceof Location_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Range.isRange(thing.range)
                && uri_1.URI.isUri(thing.uri);
        }
        constructor(uri, rangeOrPosition) {
            this.uri = uri;
            if (!rangeOrPosition) {
                //that's OK
            }
            else if (Range.isRange(rangeOrPosition)) {
                this.range = Range.of(rangeOrPosition);
            }
            else if (Position.isPosition(rangeOrPosition)) {
                this.range = new Range(rangeOrPosition, rangeOrPosition);
            }
            else {
                throw new Error('Illegal argument');
            }
        }
        toJSON() {
            return {
                uri: this.uri,
                range: this.range
            };
        }
    };
    exports.Location = Location;
    exports.Location = Location = Location_1 = __decorate([
        es5ClassCompat
    ], Location);
    let DiagnosticRelatedInformation = class DiagnosticRelatedInformation {
        static is(thing) {
            if (!thing) {
                return false;
            }
            return typeof thing.message === 'string'
                && thing.location
                && Range.isRange(thing.location.range)
                && uri_1.URI.isUri(thing.location.uri);
        }
        constructor(location, message) {
            this.location = location;
            this.message = message;
        }
        static isEqual(a, b) {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.message === b.message
                && a.location.range.isEqual(b.location.range)
                && a.location.uri.toString() === b.location.uri.toString();
        }
    };
    exports.DiagnosticRelatedInformation = DiagnosticRelatedInformation;
    exports.DiagnosticRelatedInformation = DiagnosticRelatedInformation = __decorate([
        es5ClassCompat
    ], DiagnosticRelatedInformation);
    let Diagnostic = class Diagnostic {
        constructor(range, message, severity = DiagnosticSeverity.Error) {
            if (!Range.isRange(range)) {
                throw new TypeError('range must be set');
            }
            if (!message) {
                throw new TypeError('message must be set');
            }
            this.range = range;
            this.message = message;
            this.severity = severity;
        }
        toJSON() {
            return {
                severity: DiagnosticSeverity[this.severity],
                message: this.message,
                range: this.range,
                source: this.source,
                code: this.code,
            };
        }
        static isEqual(a, b) {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.message === b.message
                && a.severity === b.severity
                && a.code === b.code
                && a.severity === b.severity
                && a.source === b.source
                && a.range.isEqual(b.range)
                && (0, arrays_1.equals)(a.tags, b.tags)
                && (0, arrays_1.equals)(a.relatedInformation, b.relatedInformation, DiagnosticRelatedInformation.isEqual);
        }
    };
    exports.Diagnostic = Diagnostic;
    exports.Diagnostic = Diagnostic = __decorate([
        es5ClassCompat
    ], Diagnostic);
    let Hover = class Hover {
        constructor(contents, range) {
            if (!contents) {
                throw new Error('Illegal argument, contents must be defined');
            }
            if (Array.isArray(contents)) {
                this.contents = contents;
            }
            else {
                this.contents = [contents];
            }
            this.range = range;
        }
    };
    exports.Hover = Hover;
    exports.Hover = Hover = __decorate([
        es5ClassCompat
    ], Hover);
    var DocumentHighlightKind;
    (function (DocumentHighlightKind) {
        DocumentHighlightKind[DocumentHighlightKind["Text"] = 0] = "Text";
        DocumentHighlightKind[DocumentHighlightKind["Read"] = 1] = "Read";
        DocumentHighlightKind[DocumentHighlightKind["Write"] = 2] = "Write";
    })(DocumentHighlightKind || (exports.DocumentHighlightKind = DocumentHighlightKind = {}));
    let DocumentHighlight = class DocumentHighlight {
        constructor(range, kind = DocumentHighlightKind.Text) {
            this.range = range;
            this.kind = kind;
        }
        toJSON() {
            return {
                range: this.range,
                kind: DocumentHighlightKind[this.kind]
            };
        }
    };
    exports.DocumentHighlight = DocumentHighlight;
    exports.DocumentHighlight = DocumentHighlight = __decorate([
        es5ClassCompat
    ], DocumentHighlight);
    let MultiDocumentHighlight = class MultiDocumentHighlight {
        constructor(uri, highlights) {
            this.uri = uri;
            this.highlights = highlights;
        }
        toJSON() {
            return {
                uri: this.uri,
                highlights: this.highlights.map(h => h.toJSON())
            };
        }
    };
    exports.MultiDocumentHighlight = MultiDocumentHighlight;
    exports.MultiDocumentHighlight = MultiDocumentHighlight = __decorate([
        es5ClassCompat
    ], MultiDocumentHighlight);
    var SymbolKind;
    (function (SymbolKind) {
        SymbolKind[SymbolKind["File"] = 0] = "File";
        SymbolKind[SymbolKind["Module"] = 1] = "Module";
        SymbolKind[SymbolKind["Namespace"] = 2] = "Namespace";
        SymbolKind[SymbolKind["Package"] = 3] = "Package";
        SymbolKind[SymbolKind["Class"] = 4] = "Class";
        SymbolKind[SymbolKind["Method"] = 5] = "Method";
        SymbolKind[SymbolKind["Property"] = 6] = "Property";
        SymbolKind[SymbolKind["Field"] = 7] = "Field";
        SymbolKind[SymbolKind["Constructor"] = 8] = "Constructor";
        SymbolKind[SymbolKind["Enum"] = 9] = "Enum";
        SymbolKind[SymbolKind["Interface"] = 10] = "Interface";
        SymbolKind[SymbolKind["Function"] = 11] = "Function";
        SymbolKind[SymbolKind["Variable"] = 12] = "Variable";
        SymbolKind[SymbolKind["Constant"] = 13] = "Constant";
        SymbolKind[SymbolKind["String"] = 14] = "String";
        SymbolKind[SymbolKind["Number"] = 15] = "Number";
        SymbolKind[SymbolKind["Boolean"] = 16] = "Boolean";
        SymbolKind[SymbolKind["Array"] = 17] = "Array";
        SymbolKind[SymbolKind["Object"] = 18] = "Object";
        SymbolKind[SymbolKind["Key"] = 19] = "Key";
        SymbolKind[SymbolKind["Null"] = 20] = "Null";
        SymbolKind[SymbolKind["EnumMember"] = 21] = "EnumMember";
        SymbolKind[SymbolKind["Struct"] = 22] = "Struct";
        SymbolKind[SymbolKind["Event"] = 23] = "Event";
        SymbolKind[SymbolKind["Operator"] = 24] = "Operator";
        SymbolKind[SymbolKind["TypeParameter"] = 25] = "TypeParameter";
    })(SymbolKind || (exports.SymbolKind = SymbolKind = {}));
    var SymbolTag;
    (function (SymbolTag) {
        SymbolTag[SymbolTag["Deprecated"] = 1] = "Deprecated";
    })(SymbolTag || (exports.SymbolTag = SymbolTag = {}));
    let SymbolInformation = SymbolInformation_1 = class SymbolInformation {
        static validate(candidate) {
            if (!candidate.name) {
                throw new Error('name must not be falsy');
            }
        }
        constructor(name, kind, rangeOrContainer, locationOrUri, containerName) {
            this.name = name;
            this.kind = kind;
            this.containerName = containerName;
            if (typeof rangeOrContainer === 'string') {
                this.containerName = rangeOrContainer;
            }
            if (locationOrUri instanceof Location) {
                this.location = locationOrUri;
            }
            else if (rangeOrContainer instanceof Range) {
                this.location = new Location(locationOrUri, rangeOrContainer);
            }
            SymbolInformation_1.validate(this);
        }
        toJSON() {
            return {
                name: this.name,
                kind: SymbolKind[this.kind],
                location: this.location,
                containerName: this.containerName
            };
        }
    };
    exports.SymbolInformation = SymbolInformation;
    exports.SymbolInformation = SymbolInformation = SymbolInformation_1 = __decorate([
        es5ClassCompat
    ], SymbolInformation);
    let DocumentSymbol = DocumentSymbol_1 = class DocumentSymbol {
        static validate(candidate) {
            if (!candidate.name) {
                throw new Error('name must not be falsy');
            }
            if (!candidate.range.contains(candidate.selectionRange)) {
                throw new Error('selectionRange must be contained in fullRange');
            }
            candidate.children?.forEach(DocumentSymbol_1.validate);
        }
        constructor(name, detail, kind, range, selectionRange) {
            this.name = name;
            this.detail = detail;
            this.kind = kind;
            this.range = range;
            this.selectionRange = selectionRange;
            this.children = [];
            DocumentSymbol_1.validate(this);
        }
    };
    exports.DocumentSymbol = DocumentSymbol;
    exports.DocumentSymbol = DocumentSymbol = DocumentSymbol_1 = __decorate([
        es5ClassCompat
    ], DocumentSymbol);
    var CodeActionTriggerKind;
    (function (CodeActionTriggerKind) {
        CodeActionTriggerKind[CodeActionTriggerKind["Invoke"] = 1] = "Invoke";
        CodeActionTriggerKind[CodeActionTriggerKind["Automatic"] = 2] = "Automatic";
    })(CodeActionTriggerKind || (exports.CodeActionTriggerKind = CodeActionTriggerKind = {}));
    let CodeAction = class CodeAction {
        constructor(title, kind) {
            this.title = title;
            this.kind = kind;
        }
    };
    exports.CodeAction = CodeAction;
    exports.CodeAction = CodeAction = __decorate([
        es5ClassCompat
    ], CodeAction);
    let CodeActionKind = class CodeActionKind {
        static { CodeActionKind_1 = this; }
        static { this.sep = '.'; }
        constructor(value) {
            this.value = value;
        }
        append(parts) {
            return new CodeActionKind_1(this.value ? this.value + CodeActionKind_1.sep + parts : parts);
        }
        intersects(other) {
            return this.contains(other) || other.contains(this);
        }
        contains(other) {
            return this.value === other.value || other.value.startsWith(this.value + CodeActionKind_1.sep);
        }
    };
    exports.CodeActionKind = CodeActionKind;
    exports.CodeActionKind = CodeActionKind = CodeActionKind_1 = __decorate([
        es5ClassCompat
    ], CodeActionKind);
    CodeActionKind.Empty = new CodeActionKind('');
    CodeActionKind.QuickFix = CodeActionKind.Empty.append('quickfix');
    CodeActionKind.Refactor = CodeActionKind.Empty.append('refactor');
    CodeActionKind.RefactorExtract = CodeActionKind.Refactor.append('extract');
    CodeActionKind.RefactorInline = CodeActionKind.Refactor.append('inline');
    CodeActionKind.RefactorMove = CodeActionKind.Refactor.append('move');
    CodeActionKind.RefactorRewrite = CodeActionKind.Refactor.append('rewrite');
    CodeActionKind.Source = CodeActionKind.Empty.append('source');
    CodeActionKind.SourceOrganizeImports = CodeActionKind.Source.append('organizeImports');
    CodeActionKind.SourceFixAll = CodeActionKind.Source.append('fixAll');
    CodeActionKind.Notebook = CodeActionKind.Empty.append('notebook');
    let SelectionRange = class SelectionRange {
        constructor(range, parent) {
            this.range = range;
            this.parent = parent;
            if (parent && !parent.range.contains(this.range)) {
                throw new Error('Invalid argument: parent must contain this range');
            }
        }
    };
    exports.SelectionRange = SelectionRange;
    exports.SelectionRange = SelectionRange = __decorate([
        es5ClassCompat
    ], SelectionRange);
    class CallHierarchyItem {
        constructor(kind, name, detail, uri, range, selectionRange) {
            this.kind = kind;
            this.name = name;
            this.detail = detail;
            this.uri = uri;
            this.range = range;
            this.selectionRange = selectionRange;
        }
    }
    exports.CallHierarchyItem = CallHierarchyItem;
    class CallHierarchyIncomingCall {
        constructor(item, fromRanges) {
            this.fromRanges = fromRanges;
            this.from = item;
        }
    }
    exports.CallHierarchyIncomingCall = CallHierarchyIncomingCall;
    class CallHierarchyOutgoingCall {
        constructor(item, fromRanges) {
            this.fromRanges = fromRanges;
            this.to = item;
        }
    }
    exports.CallHierarchyOutgoingCall = CallHierarchyOutgoingCall;
    var LanguageStatusSeverity;
    (function (LanguageStatusSeverity) {
        LanguageStatusSeverity[LanguageStatusSeverity["Information"] = 0] = "Information";
        LanguageStatusSeverity[LanguageStatusSeverity["Warning"] = 1] = "Warning";
        LanguageStatusSeverity[LanguageStatusSeverity["Error"] = 2] = "Error";
    })(LanguageStatusSeverity || (exports.LanguageStatusSeverity = LanguageStatusSeverity = {}));
    let CodeLens = class CodeLens {
        constructor(range, command) {
            this.range = range;
            this.command = command;
        }
        get isResolved() {
            return !!this.command;
        }
    };
    exports.CodeLens = CodeLens;
    exports.CodeLens = CodeLens = __decorate([
        es5ClassCompat
    ], CodeLens);
    let MarkdownString = MarkdownString_1 = class MarkdownString {
        #delegate;
        static isMarkdownString(thing) {
            if (thing instanceof MarkdownString_1) {
                return true;
            }
            return thing && thing.appendCodeblock && thing.appendMarkdown && thing.appendText && (thing.value !== undefined);
        }
        constructor(value, supportThemeIcons = false) {
            this.#delegate = new htmlContent_1.MarkdownString(value, { supportThemeIcons });
        }
        get value() {
            return this.#delegate.value;
        }
        set value(value) {
            this.#delegate.value = value;
        }
        get isTrusted() {
            return this.#delegate.isTrusted;
        }
        set isTrusted(value) {
            this.#delegate.isTrusted = value;
        }
        get supportThemeIcons() {
            return this.#delegate.supportThemeIcons;
        }
        set supportThemeIcons(value) {
            this.#delegate.supportThemeIcons = value;
        }
        get supportHtml() {
            return this.#delegate.supportHtml;
        }
        set supportHtml(value) {
            this.#delegate.supportHtml = value;
        }
        get baseUri() {
            return this.#delegate.baseUri;
        }
        set baseUri(value) {
            this.#delegate.baseUri = value;
        }
        appendText(value) {
            this.#delegate.appendText(value);
            return this;
        }
        appendMarkdown(value) {
            this.#delegate.appendMarkdown(value);
            return this;
        }
        appendCodeblock(value, language) {
            this.#delegate.appendCodeblock(language ?? '', value);
            return this;
        }
    };
    exports.MarkdownString = MarkdownString;
    exports.MarkdownString = MarkdownString = MarkdownString_1 = __decorate([
        es5ClassCompat
    ], MarkdownString);
    let ParameterInformation = class ParameterInformation {
        constructor(label, documentation) {
            this.label = label;
            this.documentation = documentation;
        }
    };
    exports.ParameterInformation = ParameterInformation;
    exports.ParameterInformation = ParameterInformation = __decorate([
        es5ClassCompat
    ], ParameterInformation);
    let SignatureInformation = class SignatureInformation {
        constructor(label, documentation) {
            this.label = label;
            this.documentation = documentation;
            this.parameters = [];
        }
    };
    exports.SignatureInformation = SignatureInformation;
    exports.SignatureInformation = SignatureInformation = __decorate([
        es5ClassCompat
    ], SignatureInformation);
    let SignatureHelp = class SignatureHelp {
        constructor() {
            this.activeSignature = 0;
            this.activeParameter = 0;
            this.signatures = [];
        }
    };
    exports.SignatureHelp = SignatureHelp;
    exports.SignatureHelp = SignatureHelp = __decorate([
        es5ClassCompat
    ], SignatureHelp);
    var SignatureHelpTriggerKind;
    (function (SignatureHelpTriggerKind) {
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["Invoke"] = 1] = "Invoke";
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["TriggerCharacter"] = 2] = "TriggerCharacter";
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["ContentChange"] = 3] = "ContentChange";
    })(SignatureHelpTriggerKind || (exports.SignatureHelpTriggerKind = SignatureHelpTriggerKind = {}));
    var InlayHintKind;
    (function (InlayHintKind) {
        InlayHintKind[InlayHintKind["Type"] = 1] = "Type";
        InlayHintKind[InlayHintKind["Parameter"] = 2] = "Parameter";
    })(InlayHintKind || (exports.InlayHintKind = InlayHintKind = {}));
    let InlayHintLabelPart = class InlayHintLabelPart {
        constructor(value) {
            this.value = value;
        }
    };
    exports.InlayHintLabelPart = InlayHintLabelPart;
    exports.InlayHintLabelPart = InlayHintLabelPart = __decorate([
        es5ClassCompat
    ], InlayHintLabelPart);
    let InlayHint = class InlayHint {
        constructor(position, label, kind) {
            this.position = position;
            this.label = label;
            this.kind = kind;
        }
    };
    exports.InlayHint = InlayHint;
    exports.InlayHint = InlayHint = __decorate([
        es5ClassCompat
    ], InlayHint);
    var CompletionTriggerKind;
    (function (CompletionTriggerKind) {
        CompletionTriggerKind[CompletionTriggerKind["Invoke"] = 0] = "Invoke";
        CompletionTriggerKind[CompletionTriggerKind["TriggerCharacter"] = 1] = "TriggerCharacter";
        CompletionTriggerKind[CompletionTriggerKind["TriggerForIncompleteCompletions"] = 2] = "TriggerForIncompleteCompletions";
    })(CompletionTriggerKind || (exports.CompletionTriggerKind = CompletionTriggerKind = {}));
    var CompletionItemKind;
    (function (CompletionItemKind) {
        CompletionItemKind[CompletionItemKind["Text"] = 0] = "Text";
        CompletionItemKind[CompletionItemKind["Method"] = 1] = "Method";
        CompletionItemKind[CompletionItemKind["Function"] = 2] = "Function";
        CompletionItemKind[CompletionItemKind["Constructor"] = 3] = "Constructor";
        CompletionItemKind[CompletionItemKind["Field"] = 4] = "Field";
        CompletionItemKind[CompletionItemKind["Variable"] = 5] = "Variable";
        CompletionItemKind[CompletionItemKind["Class"] = 6] = "Class";
        CompletionItemKind[CompletionItemKind["Interface"] = 7] = "Interface";
        CompletionItemKind[CompletionItemKind["Module"] = 8] = "Module";
        CompletionItemKind[CompletionItemKind["Property"] = 9] = "Property";
        CompletionItemKind[CompletionItemKind["Unit"] = 10] = "Unit";
        CompletionItemKind[CompletionItemKind["Value"] = 11] = "Value";
        CompletionItemKind[CompletionItemKind["Enum"] = 12] = "Enum";
        CompletionItemKind[CompletionItemKind["Keyword"] = 13] = "Keyword";
        CompletionItemKind[CompletionItemKind["Snippet"] = 14] = "Snippet";
        CompletionItemKind[CompletionItemKind["Color"] = 15] = "Color";
        CompletionItemKind[CompletionItemKind["File"] = 16] = "File";
        CompletionItemKind[CompletionItemKind["Reference"] = 17] = "Reference";
        CompletionItemKind[CompletionItemKind["Folder"] = 18] = "Folder";
        CompletionItemKind[CompletionItemKind["EnumMember"] = 19] = "EnumMember";
        CompletionItemKind[CompletionItemKind["Constant"] = 20] = "Constant";
        CompletionItemKind[CompletionItemKind["Struct"] = 21] = "Struct";
        CompletionItemKind[CompletionItemKind["Event"] = 22] = "Event";
        CompletionItemKind[CompletionItemKind["Operator"] = 23] = "Operator";
        CompletionItemKind[CompletionItemKind["TypeParameter"] = 24] = "TypeParameter";
        CompletionItemKind[CompletionItemKind["User"] = 25] = "User";
        CompletionItemKind[CompletionItemKind["Issue"] = 26] = "Issue";
    })(CompletionItemKind || (exports.CompletionItemKind = CompletionItemKind = {}));
    var CompletionItemTag;
    (function (CompletionItemTag) {
        CompletionItemTag[CompletionItemTag["Deprecated"] = 1] = "Deprecated";
    })(CompletionItemTag || (exports.CompletionItemTag = CompletionItemTag = {}));
    let CompletionItem = class CompletionItem {
        constructor(label, kind) {
            this.label = label;
            this.kind = kind;
        }
        toJSON() {
            return {
                label: this.label,
                kind: this.kind && CompletionItemKind[this.kind],
                detail: this.detail,
                documentation: this.documentation,
                sortText: this.sortText,
                filterText: this.filterText,
                preselect: this.preselect,
                insertText: this.insertText,
                textEdit: this.textEdit
            };
        }
    };
    exports.CompletionItem = CompletionItem;
    exports.CompletionItem = CompletionItem = __decorate([
        es5ClassCompat
    ], CompletionItem);
    let CompletionList = class CompletionList {
        constructor(items = [], isIncomplete = false) {
            this.items = items;
            this.isIncomplete = isIncomplete;
        }
    };
    exports.CompletionList = CompletionList;
    exports.CompletionList = CompletionList = __decorate([
        es5ClassCompat
    ], CompletionList);
    let InlineSuggestion = class InlineSuggestion {
        constructor(insertText, range, command) {
            this.insertText = insertText;
            this.range = range;
            this.command = command;
        }
    };
    exports.InlineSuggestion = InlineSuggestion;
    exports.InlineSuggestion = InlineSuggestion = __decorate([
        es5ClassCompat
    ], InlineSuggestion);
    let InlineSuggestionList = class InlineSuggestionList {
        constructor(items) {
            this.commands = undefined;
            this.suppressSuggestions = undefined;
            this.items = items;
        }
    };
    exports.InlineSuggestionList = InlineSuggestionList;
    exports.InlineSuggestionList = InlineSuggestionList = __decorate([
        es5ClassCompat
    ], InlineSuggestionList);
    var PartialAcceptTriggerKind;
    (function (PartialAcceptTriggerKind) {
        PartialAcceptTriggerKind[PartialAcceptTriggerKind["Unknown"] = 0] = "Unknown";
        PartialAcceptTriggerKind[PartialAcceptTriggerKind["Word"] = 1] = "Word";
        PartialAcceptTriggerKind[PartialAcceptTriggerKind["Line"] = 2] = "Line";
        PartialAcceptTriggerKind[PartialAcceptTriggerKind["Suggest"] = 3] = "Suggest";
    })(PartialAcceptTriggerKind || (exports.PartialAcceptTriggerKind = PartialAcceptTriggerKind = {}));
    var ViewColumn;
    (function (ViewColumn) {
        ViewColumn[ViewColumn["Active"] = -1] = "Active";
        ViewColumn[ViewColumn["Beside"] = -2] = "Beside";
        ViewColumn[ViewColumn["One"] = 1] = "One";
        ViewColumn[ViewColumn["Two"] = 2] = "Two";
        ViewColumn[ViewColumn["Three"] = 3] = "Three";
        ViewColumn[ViewColumn["Four"] = 4] = "Four";
        ViewColumn[ViewColumn["Five"] = 5] = "Five";
        ViewColumn[ViewColumn["Six"] = 6] = "Six";
        ViewColumn[ViewColumn["Seven"] = 7] = "Seven";
        ViewColumn[ViewColumn["Eight"] = 8] = "Eight";
        ViewColumn[ViewColumn["Nine"] = 9] = "Nine";
    })(ViewColumn || (exports.ViewColumn = ViewColumn = {}));
    var StatusBarAlignment;
    (function (StatusBarAlignment) {
        StatusBarAlignment[StatusBarAlignment["Left"] = 1] = "Left";
        StatusBarAlignment[StatusBarAlignment["Right"] = 2] = "Right";
    })(StatusBarAlignment || (exports.StatusBarAlignment = StatusBarAlignment = {}));
    function asStatusBarItemIdentifier(extension, id) {
        return `${extensions_1.ExtensionIdentifier.toKey(extension)}.${id}`;
    }
    var TextEditorLineNumbersStyle;
    (function (TextEditorLineNumbersStyle) {
        TextEditorLineNumbersStyle[TextEditorLineNumbersStyle["Off"] = 0] = "Off";
        TextEditorLineNumbersStyle[TextEditorLineNumbersStyle["On"] = 1] = "On";
        TextEditorLineNumbersStyle[TextEditorLineNumbersStyle["Relative"] = 2] = "Relative";
        TextEditorLineNumbersStyle[TextEditorLineNumbersStyle["Interval"] = 3] = "Interval";
    })(TextEditorLineNumbersStyle || (exports.TextEditorLineNumbersStyle = TextEditorLineNumbersStyle = {}));
    var TextDocumentSaveReason;
    (function (TextDocumentSaveReason) {
        TextDocumentSaveReason[TextDocumentSaveReason["Manual"] = 1] = "Manual";
        TextDocumentSaveReason[TextDocumentSaveReason["AfterDelay"] = 2] = "AfterDelay";
        TextDocumentSaveReason[TextDocumentSaveReason["FocusOut"] = 3] = "FocusOut";
    })(TextDocumentSaveReason || (exports.TextDocumentSaveReason = TextDocumentSaveReason = {}));
    var TextEditorRevealType;
    (function (TextEditorRevealType) {
        TextEditorRevealType[TextEditorRevealType["Default"] = 0] = "Default";
        TextEditorRevealType[TextEditorRevealType["InCenter"] = 1] = "InCenter";
        TextEditorRevealType[TextEditorRevealType["InCenterIfOutsideViewport"] = 2] = "InCenterIfOutsideViewport";
        TextEditorRevealType[TextEditorRevealType["AtTop"] = 3] = "AtTop";
    })(TextEditorRevealType || (exports.TextEditorRevealType = TextEditorRevealType = {}));
    var TextEditorSelectionChangeKind;
    (function (TextEditorSelectionChangeKind) {
        TextEditorSelectionChangeKind[TextEditorSelectionChangeKind["Keyboard"] = 1] = "Keyboard";
        TextEditorSelectionChangeKind[TextEditorSelectionChangeKind["Mouse"] = 2] = "Mouse";
        TextEditorSelectionChangeKind[TextEditorSelectionChangeKind["Command"] = 3] = "Command";
    })(TextEditorSelectionChangeKind || (exports.TextEditorSelectionChangeKind = TextEditorSelectionChangeKind = {}));
    var TextDocumentChangeReason;
    (function (TextDocumentChangeReason) {
        TextDocumentChangeReason[TextDocumentChangeReason["Undo"] = 1] = "Undo";
        TextDocumentChangeReason[TextDocumentChangeReason["Redo"] = 2] = "Redo";
    })(TextDocumentChangeReason || (exports.TextDocumentChangeReason = TextDocumentChangeReason = {}));
    /**
     * These values match very carefully the values of `TrackedRangeStickiness`
     */
    var DecorationRangeBehavior;
    (function (DecorationRangeBehavior) {
        /**
         * TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges
         */
        DecorationRangeBehavior[DecorationRangeBehavior["OpenOpen"] = 0] = "OpenOpen";
        /**
         * TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
         */
        DecorationRangeBehavior[DecorationRangeBehavior["ClosedClosed"] = 1] = "ClosedClosed";
        /**
         * TrackedRangeStickiness.GrowsOnlyWhenTypingBefore
         */
        DecorationRangeBehavior[DecorationRangeBehavior["OpenClosed"] = 2] = "OpenClosed";
        /**
         * TrackedRangeStickiness.GrowsOnlyWhenTypingAfter
         */
        DecorationRangeBehavior[DecorationRangeBehavior["ClosedOpen"] = 3] = "ClosedOpen";
    })(DecorationRangeBehavior || (exports.DecorationRangeBehavior = DecorationRangeBehavior = {}));
    (function (TextEditorSelectionChangeKind) {
        function fromValue(s) {
            switch (s) {
                case 'keyboard': return TextEditorSelectionChangeKind.Keyboard;
                case 'mouse': return TextEditorSelectionChangeKind.Mouse;
                case 'api': return TextEditorSelectionChangeKind.Command;
            }
            return undefined;
        }
        TextEditorSelectionChangeKind.fromValue = fromValue;
    })(TextEditorSelectionChangeKind || (exports.TextEditorSelectionChangeKind = TextEditorSelectionChangeKind = {}));
    var SyntaxTokenType;
    (function (SyntaxTokenType) {
        SyntaxTokenType[SyntaxTokenType["Other"] = 0] = "Other";
        SyntaxTokenType[SyntaxTokenType["Comment"] = 1] = "Comment";
        SyntaxTokenType[SyntaxTokenType["String"] = 2] = "String";
        SyntaxTokenType[SyntaxTokenType["RegEx"] = 3] = "RegEx";
    })(SyntaxTokenType || (exports.SyntaxTokenType = SyntaxTokenType = {}));
    (function (SyntaxTokenType) {
        function toString(v) {
            switch (v) {
                case SyntaxTokenType.Other: return 'other';
                case SyntaxTokenType.Comment: return 'comment';
                case SyntaxTokenType.String: return 'string';
                case SyntaxTokenType.RegEx: return 'regex';
            }
            return 'other';
        }
        SyntaxTokenType.toString = toString;
    })(SyntaxTokenType || (exports.SyntaxTokenType = SyntaxTokenType = {}));
    let DocumentLink = class DocumentLink {
        constructor(range, target) {
            if (target && !(uri_1.URI.isUri(target))) {
                throw (0, errors_1.illegalArgument)('target');
            }
            if (!Range.isRange(range) || range.isEmpty) {
                throw (0, errors_1.illegalArgument)('range');
            }
            this.range = range;
            this.target = target;
        }
    };
    exports.DocumentLink = DocumentLink;
    exports.DocumentLink = DocumentLink = __decorate([
        es5ClassCompat
    ], DocumentLink);
    let Color = class Color {
        constructor(red, green, blue, alpha) {
            this.red = red;
            this.green = green;
            this.blue = blue;
            this.alpha = alpha;
        }
    };
    exports.Color = Color;
    exports.Color = Color = __decorate([
        es5ClassCompat
    ], Color);
    let ColorInformation = class ColorInformation {
        constructor(range, color) {
            if (color && !(color instanceof Color)) {
                throw (0, errors_1.illegalArgument)('color');
            }
            if (!Range.isRange(range) || range.isEmpty) {
                throw (0, errors_1.illegalArgument)('range');
            }
            this.range = range;
            this.color = color;
        }
    };
    exports.ColorInformation = ColorInformation;
    exports.ColorInformation = ColorInformation = __decorate([
        es5ClassCompat
    ], ColorInformation);
    let ColorPresentation = class ColorPresentation {
        constructor(label) {
            if (!label || typeof label !== 'string') {
                throw (0, errors_1.illegalArgument)('label');
            }
            this.label = label;
        }
    };
    exports.ColorPresentation = ColorPresentation;
    exports.ColorPresentation = ColorPresentation = __decorate([
        es5ClassCompat
    ], ColorPresentation);
    var ColorFormat;
    (function (ColorFormat) {
        ColorFormat[ColorFormat["RGB"] = 0] = "RGB";
        ColorFormat[ColorFormat["HEX"] = 1] = "HEX";
        ColorFormat[ColorFormat["HSL"] = 2] = "HSL";
    })(ColorFormat || (exports.ColorFormat = ColorFormat = {}));
    var SourceControlInputBoxValidationType;
    (function (SourceControlInputBoxValidationType) {
        SourceControlInputBoxValidationType[SourceControlInputBoxValidationType["Error"] = 0] = "Error";
        SourceControlInputBoxValidationType[SourceControlInputBoxValidationType["Warning"] = 1] = "Warning";
        SourceControlInputBoxValidationType[SourceControlInputBoxValidationType["Information"] = 2] = "Information";
    })(SourceControlInputBoxValidationType || (exports.SourceControlInputBoxValidationType = SourceControlInputBoxValidationType = {}));
    var TerminalExitReason;
    (function (TerminalExitReason) {
        TerminalExitReason[TerminalExitReason["Unknown"] = 0] = "Unknown";
        TerminalExitReason[TerminalExitReason["Shutdown"] = 1] = "Shutdown";
        TerminalExitReason[TerminalExitReason["Process"] = 2] = "Process";
        TerminalExitReason[TerminalExitReason["User"] = 3] = "User";
        TerminalExitReason[TerminalExitReason["Extension"] = 4] = "Extension";
    })(TerminalExitReason || (exports.TerminalExitReason = TerminalExitReason = {}));
    class TerminalLink {
        constructor(startIndex, length, tooltip) {
            this.startIndex = startIndex;
            this.length = length;
            this.tooltip = tooltip;
            if (typeof startIndex !== 'number' || startIndex < 0) {
                throw (0, errors_1.illegalArgument)('startIndex');
            }
            if (typeof length !== 'number' || length < 1) {
                throw (0, errors_1.illegalArgument)('length');
            }
            if (tooltip !== undefined && typeof tooltip !== 'string') {
                throw (0, errors_1.illegalArgument)('tooltip');
            }
        }
    }
    exports.TerminalLink = TerminalLink;
    class TerminalQuickFixOpener {
        constructor(uri) {
            this.uri = uri;
        }
    }
    exports.TerminalQuickFixOpener = TerminalQuickFixOpener;
    class TerminalQuickFixCommand {
        constructor(terminalCommand) {
            this.terminalCommand = terminalCommand;
        }
    }
    exports.TerminalQuickFixCommand = TerminalQuickFixCommand;
    var TerminalLocation;
    (function (TerminalLocation) {
        TerminalLocation[TerminalLocation["Panel"] = 1] = "Panel";
        TerminalLocation[TerminalLocation["Editor"] = 2] = "Editor";
    })(TerminalLocation || (exports.TerminalLocation = TerminalLocation = {}));
    class TerminalProfile {
        constructor(options) {
            this.options = options;
            if (typeof options !== 'object') {
                throw (0, errors_1.illegalArgument)('options');
            }
        }
    }
    exports.TerminalProfile = TerminalProfile;
    var TaskRevealKind;
    (function (TaskRevealKind) {
        TaskRevealKind[TaskRevealKind["Always"] = 1] = "Always";
        TaskRevealKind[TaskRevealKind["Silent"] = 2] = "Silent";
        TaskRevealKind[TaskRevealKind["Never"] = 3] = "Never";
    })(TaskRevealKind || (exports.TaskRevealKind = TaskRevealKind = {}));
    var TaskPanelKind;
    (function (TaskPanelKind) {
        TaskPanelKind[TaskPanelKind["Shared"] = 1] = "Shared";
        TaskPanelKind[TaskPanelKind["Dedicated"] = 2] = "Dedicated";
        TaskPanelKind[TaskPanelKind["New"] = 3] = "New";
    })(TaskPanelKind || (exports.TaskPanelKind = TaskPanelKind = {}));
    let TaskGroup = class TaskGroup {
        static { TaskGroup_1 = this; }
        static { this.Clean = new TaskGroup_1('clean', 'Clean'); }
        static { this.Build = new TaskGroup_1('build', 'Build'); }
        static { this.Rebuild = new TaskGroup_1('rebuild', 'Rebuild'); }
        static { this.Test = new TaskGroup_1('test', 'Test'); }
        static from(value) {
            switch (value) {
                case 'clean':
                    return TaskGroup_1.Clean;
                case 'build':
                    return TaskGroup_1.Build;
                case 'rebuild':
                    return TaskGroup_1.Rebuild;
                case 'test':
                    return TaskGroup_1.Test;
                default:
                    return undefined;
            }
        }
        constructor(id, label) {
            this.label = label;
            if (typeof id !== 'string') {
                throw (0, errors_1.illegalArgument)('name');
            }
            if (typeof label !== 'string') {
                throw (0, errors_1.illegalArgument)('name');
            }
            this._id = id;
        }
        get id() {
            return this._id;
        }
    };
    exports.TaskGroup = TaskGroup;
    exports.TaskGroup = TaskGroup = TaskGroup_1 = __decorate([
        es5ClassCompat
    ], TaskGroup);
    function computeTaskExecutionId(values) {
        let id = '';
        for (let i = 0; i < values.length; i++) {
            id += values[i].replace(/,/g, ',,') + ',';
        }
        return id;
    }
    let ProcessExecution = class ProcessExecution {
        constructor(process, varg1, varg2) {
            if (typeof process !== 'string') {
                throw (0, errors_1.illegalArgument)('process');
            }
            this._args = [];
            this._process = process;
            if (varg1 !== undefined) {
                if (Array.isArray(varg1)) {
                    this._args = varg1;
                    this._options = varg2;
                }
                else {
                    this._options = varg1;
                }
            }
        }
        get process() {
            return this._process;
        }
        set process(value) {
            if (typeof value !== 'string') {
                throw (0, errors_1.illegalArgument)('process');
            }
            this._process = value;
        }
        get args() {
            return this._args;
        }
        set args(value) {
            if (!Array.isArray(value)) {
                value = [];
            }
            this._args = value;
        }
        get options() {
            return this._options;
        }
        set options(value) {
            this._options = value;
        }
        computeId() {
            const props = [];
            props.push('process');
            if (this._process !== undefined) {
                props.push(this._process);
            }
            if (this._args && this._args.length > 0) {
                for (const arg of this._args) {
                    props.push(arg);
                }
            }
            return computeTaskExecutionId(props);
        }
    };
    exports.ProcessExecution = ProcessExecution;
    exports.ProcessExecution = ProcessExecution = __decorate([
        es5ClassCompat
    ], ProcessExecution);
    let ShellExecution = class ShellExecution {
        constructor(arg0, arg1, arg2) {
            this._args = [];
            if (Array.isArray(arg1)) {
                if (!arg0) {
                    throw (0, errors_1.illegalArgument)('command can\'t be undefined or null');
                }
                if (typeof arg0 !== 'string' && typeof arg0.value !== 'string') {
                    throw (0, errors_1.illegalArgument)('command');
                }
                this._command = arg0;
                this._args = arg1;
                this._options = arg2;
            }
            else {
                if (typeof arg0 !== 'string') {
                    throw (0, errors_1.illegalArgument)('commandLine');
                }
                this._commandLine = arg0;
                this._options = arg1;
            }
        }
        get commandLine() {
            return this._commandLine;
        }
        set commandLine(value) {
            if (typeof value !== 'string') {
                throw (0, errors_1.illegalArgument)('commandLine');
            }
            this._commandLine = value;
        }
        get command() {
            return this._command ? this._command : '';
        }
        set command(value) {
            if (typeof value !== 'string' && typeof value.value !== 'string') {
                throw (0, errors_1.illegalArgument)('command');
            }
            this._command = value;
        }
        get args() {
            return this._args;
        }
        set args(value) {
            this._args = value || [];
        }
        get options() {
            return this._options;
        }
        set options(value) {
            this._options = value;
        }
        computeId() {
            const props = [];
            props.push('shell');
            if (this._commandLine !== undefined) {
                props.push(this._commandLine);
            }
            if (this._command !== undefined) {
                props.push(typeof this._command === 'string' ? this._command : this._command.value);
            }
            if (this._args && this._args.length > 0) {
                for (const arg of this._args) {
                    props.push(typeof arg === 'string' ? arg : arg.value);
                }
            }
            return computeTaskExecutionId(props);
        }
    };
    exports.ShellExecution = ShellExecution;
    exports.ShellExecution = ShellExecution = __decorate([
        es5ClassCompat
    ], ShellExecution);
    var ShellQuoting;
    (function (ShellQuoting) {
        ShellQuoting[ShellQuoting["Escape"] = 1] = "Escape";
        ShellQuoting[ShellQuoting["Strong"] = 2] = "Strong";
        ShellQuoting[ShellQuoting["Weak"] = 3] = "Weak";
    })(ShellQuoting || (exports.ShellQuoting = ShellQuoting = {}));
    var TaskScope;
    (function (TaskScope) {
        TaskScope[TaskScope["Global"] = 1] = "Global";
        TaskScope[TaskScope["Workspace"] = 2] = "Workspace";
    })(TaskScope || (exports.TaskScope = TaskScope = {}));
    class CustomExecution {
        constructor(callback) {
            this._callback = callback;
        }
        computeId() {
            return 'customExecution' + (0, uuid_1.generateUuid)();
        }
        set callback(value) {
            this._callback = value;
        }
        get callback() {
            return this._callback;
        }
    }
    exports.CustomExecution = CustomExecution;
    let Task = class Task {
        static { Task_1 = this; }
        static { this.ExtensionCallbackType = 'customExecution'; }
        static { this.ProcessType = 'process'; }
        static { this.ShellType = 'shell'; }
        static { this.EmptyType = '$empty'; }
        constructor(definition, arg2, arg3, arg4, arg5, arg6) {
            this.__deprecated = false;
            this._definition = this.definition = definition;
            let problemMatchers;
            if (typeof arg2 === 'string') {
                this._name = this.name = arg2;
                this._source = this.source = arg3;
                this.execution = arg4;
                problemMatchers = arg5;
                this.__deprecated = true;
            }
            else if (arg2 === TaskScope.Global || arg2 === TaskScope.Workspace) {
                this.target = arg2;
                this._name = this.name = arg3;
                this._source = this.source = arg4;
                this.execution = arg5;
                problemMatchers = arg6;
            }
            else {
                this.target = arg2;
                this._name = this.name = arg3;
                this._source = this.source = arg4;
                this.execution = arg5;
                problemMatchers = arg6;
            }
            if (typeof problemMatchers === 'string') {
                this._problemMatchers = [problemMatchers];
                this._hasDefinedMatchers = true;
            }
            else if (Array.isArray(problemMatchers)) {
                this._problemMatchers = problemMatchers;
                this._hasDefinedMatchers = true;
            }
            else {
                this._problemMatchers = [];
                this._hasDefinedMatchers = false;
            }
            this._isBackground = false;
            this._presentationOptions = Object.create(null);
            this._runOptions = Object.create(null);
        }
        get _id() {
            return this.__id;
        }
        set _id(value) {
            this.__id = value;
        }
        get _deprecated() {
            return this.__deprecated;
        }
        clear() {
            if (this.__id === undefined) {
                return;
            }
            this.__id = undefined;
            this._scope = undefined;
            this.computeDefinitionBasedOnExecution();
        }
        computeDefinitionBasedOnExecution() {
            if (this._execution instanceof ProcessExecution) {
                this._definition = {
                    type: Task_1.ProcessType,
                    id: this._execution.computeId()
                };
            }
            else if (this._execution instanceof ShellExecution) {
                this._definition = {
                    type: Task_1.ShellType,
                    id: this._execution.computeId()
                };
            }
            else if (this._execution instanceof CustomExecution) {
                this._definition = {
                    type: Task_1.ExtensionCallbackType,
                    id: this._execution.computeId()
                };
            }
            else {
                this._definition = {
                    type: Task_1.EmptyType,
                    id: (0, uuid_1.generateUuid)()
                };
            }
        }
        get definition() {
            return this._definition;
        }
        set definition(value) {
            if (value === undefined || value === null) {
                throw (0, errors_1.illegalArgument)('Kind can\'t be undefined or null');
            }
            this.clear();
            this._definition = value;
        }
        get scope() {
            return this._scope;
        }
        set target(value) {
            this.clear();
            this._scope = value;
        }
        get name() {
            return this._name;
        }
        set name(value) {
            if (typeof value !== 'string') {
                throw (0, errors_1.illegalArgument)('name');
            }
            this.clear();
            this._name = value;
        }
        get execution() {
            return this._execution;
        }
        set execution(value) {
            if (value === null) {
                value = undefined;
            }
            this.clear();
            this._execution = value;
            const type = this._definition.type;
            if (Task_1.EmptyType === type || Task_1.ProcessType === type || Task_1.ShellType === type || Task_1.ExtensionCallbackType === type) {
                this.computeDefinitionBasedOnExecution();
            }
        }
        get problemMatchers() {
            return this._problemMatchers;
        }
        set problemMatchers(value) {
            if (!Array.isArray(value)) {
                this.clear();
                this._problemMatchers = [];
                this._hasDefinedMatchers = false;
                return;
            }
            else {
                this.clear();
                this._problemMatchers = value;
                this._hasDefinedMatchers = true;
            }
        }
        get hasDefinedMatchers() {
            return this._hasDefinedMatchers;
        }
        get isBackground() {
            return this._isBackground;
        }
        set isBackground(value) {
            if (value !== true && value !== false) {
                value = false;
            }
            this.clear();
            this._isBackground = value;
        }
        get source() {
            return this._source;
        }
        set source(value) {
            if (typeof value !== 'string' || value.length === 0) {
                throw (0, errors_1.illegalArgument)('source must be a string of length > 0');
            }
            this.clear();
            this._source = value;
        }
        get group() {
            return this._group;
        }
        set group(value) {
            if (value === null) {
                value = undefined;
            }
            this.clear();
            this._group = value;
        }
        get detail() {
            return this._detail;
        }
        set detail(value) {
            if (value === null) {
                value = undefined;
            }
            this._detail = value;
        }
        get presentationOptions() {
            return this._presentationOptions;
        }
        set presentationOptions(value) {
            if (value === null || value === undefined) {
                value = Object.create(null);
            }
            this.clear();
            this._presentationOptions = value;
        }
        get runOptions() {
            return this._runOptions;
        }
        set runOptions(value) {
            if (value === null || value === undefined) {
                value = Object.create(null);
            }
            this.clear();
            this._runOptions = value;
        }
    };
    exports.Task = Task;
    exports.Task = Task = Task_1 = __decorate([
        es5ClassCompat
    ], Task);
    var ProgressLocation;
    (function (ProgressLocation) {
        ProgressLocation[ProgressLocation["SourceControl"] = 1] = "SourceControl";
        ProgressLocation[ProgressLocation["Window"] = 10] = "Window";
        ProgressLocation[ProgressLocation["Notification"] = 15] = "Notification";
    })(ProgressLocation || (exports.ProgressLocation = ProgressLocation = {}));
    var ViewBadge;
    (function (ViewBadge) {
        function isViewBadge(thing) {
            const viewBadgeThing = thing;
            if (!(0, types_1.isNumber)(viewBadgeThing.value)) {
                console.log('INVALID view badge, invalid value', viewBadgeThing.value);
                return false;
            }
            if (viewBadgeThing.tooltip && !(0, types_1.isString)(viewBadgeThing.tooltip)) {
                console.log('INVALID view badge, invalid tooltip', viewBadgeThing.tooltip);
                return false;
            }
            return true;
        }
        ViewBadge.isViewBadge = isViewBadge;
    })(ViewBadge || (exports.ViewBadge = ViewBadge = {}));
    let TreeItem = TreeItem_1 = class TreeItem {
        static isTreeItem(thing, extension) {
            const treeItemThing = thing;
            if (treeItemThing.checkboxState !== undefined) {
                const checkbox = (0, types_1.isNumber)(treeItemThing.checkboxState) ? treeItemThing.checkboxState :
                    (0, types_1.isObject)(treeItemThing.checkboxState) && (0, types_1.isNumber)(treeItemThing.checkboxState.state) ? treeItemThing.checkboxState.state : undefined;
                const tooltip = !(0, types_1.isNumber)(treeItemThing.checkboxState) && (0, types_1.isObject)(treeItemThing.checkboxState) ? treeItemThing.checkboxState.tooltip : undefined;
                if (checkbox === undefined || (checkbox !== TreeItemCheckboxState.Checked && checkbox !== TreeItemCheckboxState.Unchecked) || (tooltip !== undefined && !(0, types_1.isString)(tooltip))) {
                    console.log('INVALID tree item, invalid checkboxState', treeItemThing.checkboxState);
                    return false;
                }
            }
            if (thing instanceof TreeItem_1) {
                return true;
            }
            if (treeItemThing.label !== undefined && !(0, types_1.isString)(treeItemThing.label) && !(treeItemThing.label?.label)) {
                console.log('INVALID tree item, invalid label', treeItemThing.label);
                return false;
            }
            if ((treeItemThing.id !== undefined) && !(0, types_1.isString)(treeItemThing.id)) {
                console.log('INVALID tree item, invalid id', treeItemThing.id);
                return false;
            }
            if ((treeItemThing.iconPath !== undefined) && !(0, types_1.isString)(treeItemThing.iconPath) && !uri_1.URI.isUri(treeItemThing.iconPath) && (!treeItemThing.iconPath || !(0, types_1.isString)(treeItemThing.iconPath.id))) {
                const asLightAndDarkThing = treeItemThing.iconPath;
                if (!asLightAndDarkThing || (!(0, types_1.isString)(asLightAndDarkThing.light) && !uri_1.URI.isUri(asLightAndDarkThing.light) && !(0, types_1.isString)(asLightAndDarkThing.dark) && !uri_1.URI.isUri(asLightAndDarkThing.dark))) {
                    console.log('INVALID tree item, invalid iconPath', treeItemThing.iconPath);
                    return false;
                }
            }
            if ((treeItemThing.description !== undefined) && !(0, types_1.isString)(treeItemThing.description) && (typeof treeItemThing.description !== 'boolean')) {
                console.log('INVALID tree item, invalid description', treeItemThing.description);
                return false;
            }
            if ((treeItemThing.resourceUri !== undefined) && !uri_1.URI.isUri(treeItemThing.resourceUri)) {
                console.log('INVALID tree item, invalid resourceUri', treeItemThing.resourceUri);
                return false;
            }
            if ((treeItemThing.tooltip !== undefined) && !(0, types_1.isString)(treeItemThing.tooltip) && !(treeItemThing.tooltip instanceof MarkdownString)) {
                console.log('INVALID tree item, invalid tooltip', treeItemThing.tooltip);
                return false;
            }
            if ((treeItemThing.command !== undefined) && !treeItemThing.command.command) {
                console.log('INVALID tree item, invalid command', treeItemThing.command);
                return false;
            }
            if ((treeItemThing.collapsibleState !== undefined) && (treeItemThing.collapsibleState < TreeItemCollapsibleState.None) && (treeItemThing.collapsibleState > TreeItemCollapsibleState.Expanded)) {
                console.log('INVALID tree item, invalid collapsibleState', treeItemThing.collapsibleState);
                return false;
            }
            if ((treeItemThing.contextValue !== undefined) && !(0, types_1.isString)(treeItemThing.contextValue)) {
                console.log('INVALID tree item, invalid contextValue', treeItemThing.contextValue);
                return false;
            }
            if ((treeItemThing.accessibilityInformation !== undefined) && !treeItemThing.accessibilityInformation?.label) {
                console.log('INVALID tree item, invalid accessibilityInformation', treeItemThing.accessibilityInformation);
                return false;
            }
            return true;
        }
        constructor(arg1, collapsibleState = TreeItemCollapsibleState.None) {
            this.collapsibleState = collapsibleState;
            if (uri_1.URI.isUri(arg1)) {
                this.resourceUri = arg1;
            }
            else {
                this.label = arg1;
            }
        }
    };
    exports.TreeItem = TreeItem;
    exports.TreeItem = TreeItem = TreeItem_1 = __decorate([
        es5ClassCompat
    ], TreeItem);
    var TreeItemCollapsibleState;
    (function (TreeItemCollapsibleState) {
        TreeItemCollapsibleState[TreeItemCollapsibleState["None"] = 0] = "None";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Collapsed"] = 1] = "Collapsed";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Expanded"] = 2] = "Expanded";
    })(TreeItemCollapsibleState || (exports.TreeItemCollapsibleState = TreeItemCollapsibleState = {}));
    var TreeItemCheckboxState;
    (function (TreeItemCheckboxState) {
        TreeItemCheckboxState[TreeItemCheckboxState["Unchecked"] = 0] = "Unchecked";
        TreeItemCheckboxState[TreeItemCheckboxState["Checked"] = 1] = "Checked";
    })(TreeItemCheckboxState || (exports.TreeItemCheckboxState = TreeItemCheckboxState = {}));
    let DataTransferItem = class DataTransferItem {
        async asString() {
            return typeof this.value === 'string' ? this.value : JSON.stringify(this.value);
        }
        asFile() {
            return undefined;
        }
        constructor(value) {
            this.value = value;
        }
    };
    exports.DataTransferItem = DataTransferItem;
    exports.DataTransferItem = DataTransferItem = __decorate([
        es5ClassCompat
    ], DataTransferItem);
    /**
     * A data transfer item that has been created by VS Code instead of by a extension.
     *
     * Intentionally not exported to extensions.
     */
    class InternalDataTransferItem extends DataTransferItem {
    }
    exports.InternalDataTransferItem = InternalDataTransferItem;
    /**
     * A data transfer item for a file.
     *
     * Intentionally not exported to extensions as only we can create these.
     */
    class InternalFileDataTransferItem extends InternalDataTransferItem {
        #file;
        constructor(file) {
            super('');
            this.#file = file;
        }
        asFile() {
            return this.#file;
        }
    }
    exports.InternalFileDataTransferItem = InternalFileDataTransferItem;
    /**
     * Intentionally not exported to extensions
     */
    class DataTransferFile {
        constructor(name, uri, itemId, getData) {
            this.name = name;
            this.uri = uri;
            this._itemId = itemId;
            this._getData = getData;
        }
        data() {
            return this._getData();
        }
    }
    exports.DataTransferFile = DataTransferFile;
    let DataTransfer = class DataTransfer {
        #items = new Map();
        constructor(init) {
            for (const [mime, item] of init ?? []) {
                const existing = this.#items.get(this.#normalizeMime(mime));
                if (existing) {
                    existing.push(item);
                }
                else {
                    this.#items.set(this.#normalizeMime(mime), [item]);
                }
            }
        }
        get(mimeType) {
            return this.#items.get(this.#normalizeMime(mimeType))?.[0];
        }
        set(mimeType, value) {
            // This intentionally overwrites all entries for a given mimetype.
            // This is similar to how the DOM DataTransfer type works
            this.#items.set(this.#normalizeMime(mimeType), [value]);
        }
        forEach(callbackfn, thisArg) {
            for (const [mime, items] of this.#items) {
                for (const item of items) {
                    callbackfn.call(thisArg, item, mime, this);
                }
            }
        }
        *[Symbol.iterator]() {
            for (const [mime, items] of this.#items) {
                for (const item of items) {
                    yield [mime, item];
                }
            }
        }
        #normalizeMime(mimeType) {
            return mimeType.toLowerCase();
        }
    };
    exports.DataTransfer = DataTransfer;
    exports.DataTransfer = DataTransfer = __decorate([
        es5ClassCompat
    ], DataTransfer);
    let DocumentDropEdit = class DocumentDropEdit {
        constructor(insertText, title, kind) {
            this.insertText = insertText;
            this.title = title;
            this.kind = kind;
        }
    };
    exports.DocumentDropEdit = DocumentDropEdit;
    exports.DocumentDropEdit = DocumentDropEdit = __decorate([
        es5ClassCompat
    ], DocumentDropEdit);
    var DocumentPasteTriggerKind;
    (function (DocumentPasteTriggerKind) {
        DocumentPasteTriggerKind[DocumentPasteTriggerKind["Automatic"] = 0] = "Automatic";
        DocumentPasteTriggerKind[DocumentPasteTriggerKind["PasteAs"] = 1] = "PasteAs";
    })(DocumentPasteTriggerKind || (exports.DocumentPasteTriggerKind = DocumentPasteTriggerKind = {}));
    class DocumentPasteEditKind {
        static { this.sep = '.'; }
        constructor(value) {
            this.value = value;
        }
        append(...parts) {
            return new DocumentPasteEditKind((this.value ? [this.value, ...parts] : parts).join(DocumentPasteEditKind.sep));
        }
        intersects(other) {
            return this.contains(other) || other.contains(this);
        }
        contains(other) {
            return this.value === other.value || other.value.startsWith(this.value + DocumentPasteEditKind.sep);
        }
    }
    exports.DocumentPasteEditKind = DocumentPasteEditKind;
    DocumentPasteEditKind.Empty = new DocumentPasteEditKind('');
    let DocumentPasteEdit = class DocumentPasteEdit {
        constructor(insertText, title, kind) {
            this.title = title;
            this.insertText = insertText;
            this.kind = kind;
        }
    };
    exports.DocumentPasteEdit = DocumentPasteEdit;
    exports.DocumentPasteEdit = DocumentPasteEdit = __decorate([
        es5ClassCompat
    ], DocumentPasteEdit);
    let ThemeIcon = class ThemeIcon {
        constructor(id, color) {
            this.id = id;
            this.color = color;
        }
        static isThemeIcon(thing) {
            if (typeof thing.id !== 'string') {
                console.log('INVALID ThemeIcon, invalid id', thing.id);
                return false;
            }
            return true;
        }
    };
    exports.ThemeIcon = ThemeIcon;
    exports.ThemeIcon = ThemeIcon = __decorate([
        es5ClassCompat
    ], ThemeIcon);
    ThemeIcon.File = new ThemeIcon('file');
    ThemeIcon.Folder = new ThemeIcon('folder');
    let ThemeColor = class ThemeColor {
        constructor(id) {
            this.id = id;
        }
    };
    exports.ThemeColor = ThemeColor;
    exports.ThemeColor = ThemeColor = __decorate([
        es5ClassCompat
    ], ThemeColor);
    var ConfigurationTarget;
    (function (ConfigurationTarget) {
        ConfigurationTarget[ConfigurationTarget["Global"] = 1] = "Global";
        ConfigurationTarget[ConfigurationTarget["Workspace"] = 2] = "Workspace";
        ConfigurationTarget[ConfigurationTarget["WorkspaceFolder"] = 3] = "WorkspaceFolder";
    })(ConfigurationTarget || (exports.ConfigurationTarget = ConfigurationTarget = {}));
    let RelativePattern = class RelativePattern {
        get base() {
            return this._base;
        }
        set base(base) {
            this._base = base;
            this._baseUri = uri_1.URI.file(base);
        }
        get baseUri() {
            return this._baseUri;
        }
        set baseUri(baseUri) {
            this._baseUri = baseUri;
            this._base = baseUri.fsPath;
        }
        constructor(base, pattern) {
            if (typeof base !== 'string') {
                if (!base || !uri_1.URI.isUri(base) && !uri_1.URI.isUri(base.uri)) {
                    throw (0, errors_1.illegalArgument)('base');
                }
            }
            if (typeof pattern !== 'string') {
                throw (0, errors_1.illegalArgument)('pattern');
            }
            if (typeof base === 'string') {
                this.baseUri = uri_1.URI.file(base);
            }
            else if (uri_1.URI.isUri(base)) {
                this.baseUri = base;
            }
            else {
                this.baseUri = base.uri;
            }
            this.pattern = pattern;
        }
        toJSON() {
            return {
                pattern: this.pattern,
                base: this.base,
                baseUri: this.baseUri.toJSON()
            };
        }
    };
    exports.RelativePattern = RelativePattern;
    exports.RelativePattern = RelativePattern = __decorate([
        es5ClassCompat
    ], RelativePattern);
    const breakpointIds = new WeakMap();
    /**
     * We want to be able to construct Breakpoints internally that have a particular id, but we don't want extensions to be
     * able to do this with the exposed Breakpoint classes in extension API.
     * We also want "instanceof" to work with debug.breakpoints and the exposed breakpoint classes.
     * And private members will be renamed in the built js, so casting to any and setting a private member is not safe.
     * So, we store internal breakpoint IDs in a WeakMap. This function must be called after constructing a Breakpoint
     * with a known id.
     */
    function setBreakpointId(bp, id) {
        breakpointIds.set(bp, id);
    }
    let Breakpoint = class Breakpoint {
        constructor(enabled, condition, hitCondition, logMessage, mode) {
            this.enabled = typeof enabled === 'boolean' ? enabled : true;
            if (typeof condition === 'string') {
                this.condition = condition;
            }
            if (typeof hitCondition === 'string') {
                this.hitCondition = hitCondition;
            }
            if (typeof logMessage === 'string') {
                this.logMessage = logMessage;
            }
            if (typeof mode === 'string') {
                this.mode = mode;
            }
        }
        get id() {
            if (!this._id) {
                this._id = breakpointIds.get(this) ?? (0, uuid_1.generateUuid)();
            }
            return this._id;
        }
    };
    exports.Breakpoint = Breakpoint;
    exports.Breakpoint = Breakpoint = __decorate([
        es5ClassCompat
    ], Breakpoint);
    let SourceBreakpoint = class SourceBreakpoint extends Breakpoint {
        constructor(location, enabled, condition, hitCondition, logMessage, mode) {
            super(enabled, condition, hitCondition, logMessage, mode);
            if (location === null) {
                throw (0, errors_1.illegalArgument)('location');
            }
            this.location = location;
        }
    };
    exports.SourceBreakpoint = SourceBreakpoint;
    exports.SourceBreakpoint = SourceBreakpoint = __decorate([
        es5ClassCompat
    ], SourceBreakpoint);
    let FunctionBreakpoint = class FunctionBreakpoint extends Breakpoint {
        constructor(functionName, enabled, condition, hitCondition, logMessage, mode) {
            super(enabled, condition, hitCondition, logMessage, mode);
            this.functionName = functionName;
        }
    };
    exports.FunctionBreakpoint = FunctionBreakpoint;
    exports.FunctionBreakpoint = FunctionBreakpoint = __decorate([
        es5ClassCompat
    ], FunctionBreakpoint);
    let DataBreakpoint = class DataBreakpoint extends Breakpoint {
        constructor(label, dataId, canPersist, enabled, condition, hitCondition, logMessage, mode) {
            super(enabled, condition, hitCondition, logMessage, mode);
            if (!dataId) {
                throw (0, errors_1.illegalArgument)('dataId');
            }
            this.label = label;
            this.dataId = dataId;
            this.canPersist = canPersist;
        }
    };
    exports.DataBreakpoint = DataBreakpoint;
    exports.DataBreakpoint = DataBreakpoint = __decorate([
        es5ClassCompat
    ], DataBreakpoint);
    let DebugAdapterExecutable = class DebugAdapterExecutable {
        constructor(command, args, options) {
            this.command = command;
            this.args = args || [];
            this.options = options;
        }
    };
    exports.DebugAdapterExecutable = DebugAdapterExecutable;
    exports.DebugAdapterExecutable = DebugAdapterExecutable = __decorate([
        es5ClassCompat
    ], DebugAdapterExecutable);
    let DebugAdapterServer = class DebugAdapterServer {
        constructor(port, host) {
            this.port = port;
            this.host = host;
        }
    };
    exports.DebugAdapterServer = DebugAdapterServer;
    exports.DebugAdapterServer = DebugAdapterServer = __decorate([
        es5ClassCompat
    ], DebugAdapterServer);
    let DebugAdapterNamedPipeServer = class DebugAdapterNamedPipeServer {
        constructor(path) {
            this.path = path;
        }
    };
    exports.DebugAdapterNamedPipeServer = DebugAdapterNamedPipeServer;
    exports.DebugAdapterNamedPipeServer = DebugAdapterNamedPipeServer = __decorate([
        es5ClassCompat
    ], DebugAdapterNamedPipeServer);
    let DebugAdapterInlineImplementation = class DebugAdapterInlineImplementation {
        constructor(impl) {
            this.implementation = impl;
        }
    };
    exports.DebugAdapterInlineImplementation = DebugAdapterInlineImplementation;
    exports.DebugAdapterInlineImplementation = DebugAdapterInlineImplementation = __decorate([
        es5ClassCompat
    ], DebugAdapterInlineImplementation);
    class StackFrame {
        constructor(session, threadId, frameId) {
            this.session = session;
            this.threadId = threadId;
            this.frameId = frameId;
        }
    }
    exports.StackFrame = StackFrame;
    class Thread {
        constructor(session, threadId) {
            this.session = session;
            this.threadId = threadId;
        }
    }
    exports.Thread = Thread;
    let EvaluatableExpression = class EvaluatableExpression {
        constructor(range, expression) {
            this.range = range;
            this.expression = expression;
        }
    };
    exports.EvaluatableExpression = EvaluatableExpression;
    exports.EvaluatableExpression = EvaluatableExpression = __decorate([
        es5ClassCompat
    ], EvaluatableExpression);
    var InlineCompletionTriggerKind;
    (function (InlineCompletionTriggerKind) {
        InlineCompletionTriggerKind[InlineCompletionTriggerKind["Invoke"] = 0] = "Invoke";
        InlineCompletionTriggerKind[InlineCompletionTriggerKind["Automatic"] = 1] = "Automatic";
    })(InlineCompletionTriggerKind || (exports.InlineCompletionTriggerKind = InlineCompletionTriggerKind = {}));
    let InlineValueText = class InlineValueText {
        constructor(range, text) {
            this.range = range;
            this.text = text;
        }
    };
    exports.InlineValueText = InlineValueText;
    exports.InlineValueText = InlineValueText = __decorate([
        es5ClassCompat
    ], InlineValueText);
    let InlineValueVariableLookup = class InlineValueVariableLookup {
        constructor(range, variableName, caseSensitiveLookup = true) {
            this.range = range;
            this.variableName = variableName;
            this.caseSensitiveLookup = caseSensitiveLookup;
        }
    };
    exports.InlineValueVariableLookup = InlineValueVariableLookup;
    exports.InlineValueVariableLookup = InlineValueVariableLookup = __decorate([
        es5ClassCompat
    ], InlineValueVariableLookup);
    let InlineValueEvaluatableExpression = class InlineValueEvaluatableExpression {
        constructor(range, expression) {
            this.range = range;
            this.expression = expression;
        }
    };
    exports.InlineValueEvaluatableExpression = InlineValueEvaluatableExpression;
    exports.InlineValueEvaluatableExpression = InlineValueEvaluatableExpression = __decorate([
        es5ClassCompat
    ], InlineValueEvaluatableExpression);
    let InlineValueContext = class InlineValueContext {
        constructor(frameId, range) {
            this.frameId = frameId;
            this.stoppedLocation = range;
        }
    };
    exports.InlineValueContext = InlineValueContext;
    exports.InlineValueContext = InlineValueContext = __decorate([
        es5ClassCompat
    ], InlineValueContext);
    var NewSymbolNameTag;
    (function (NewSymbolNameTag) {
        NewSymbolNameTag[NewSymbolNameTag["AIGenerated"] = 1] = "AIGenerated";
    })(NewSymbolNameTag || (exports.NewSymbolNameTag = NewSymbolNameTag = {}));
    class NewSymbolName {
        constructor(newSymbolName, tags) {
            this.newSymbolName = newSymbolName;
            this.tags = tags;
        }
    }
    exports.NewSymbolName = NewSymbolName;
    //#region file api
    var FileChangeType;
    (function (FileChangeType) {
        FileChangeType[FileChangeType["Changed"] = 1] = "Changed";
        FileChangeType[FileChangeType["Created"] = 2] = "Created";
        FileChangeType[FileChangeType["Deleted"] = 3] = "Deleted";
    })(FileChangeType || (exports.FileChangeType = FileChangeType = {}));
    let FileSystemError = FileSystemError_1 = class FileSystemError extends Error {
        static FileExists(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.FileExists, FileSystemError_1.FileExists);
        }
        static FileNotFound(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.FileNotFound, FileSystemError_1.FileNotFound);
        }
        static FileNotADirectory(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.FileNotADirectory, FileSystemError_1.FileNotADirectory);
        }
        static FileIsADirectory(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.FileIsADirectory, FileSystemError_1.FileIsADirectory);
        }
        static NoPermissions(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.NoPermissions, FileSystemError_1.NoPermissions);
        }
        static Unavailable(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.Unavailable, FileSystemError_1.Unavailable);
        }
        constructor(uriOrMessage, code = files_1.FileSystemProviderErrorCode.Unknown, terminator) {
            super(uri_1.URI.isUri(uriOrMessage) ? uriOrMessage.toString(true) : uriOrMessage);
            this.code = terminator?.name ?? 'Unknown';
            // mark the error as file system provider error so that
            // we can extract the error code on the receiving side
            (0, files_1.markAsFileSystemProviderError)(this, code);
            // workaround when extending builtin objects and when compiling to ES5, see:
            // https://github.com/microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            Object.setPrototypeOf(this, FileSystemError_1.prototype);
            if (typeof Error.captureStackTrace === 'function' && typeof terminator === 'function') {
                // nice stack traces
                Error.captureStackTrace(this, terminator);
            }
        }
    };
    exports.FileSystemError = FileSystemError;
    exports.FileSystemError = FileSystemError = FileSystemError_1 = __decorate([
        es5ClassCompat
    ], FileSystemError);
    //#endregion
    //#region folding api
    let FoldingRange = class FoldingRange {
        constructor(start, end, kind) {
            this.start = start;
            this.end = end;
            this.kind = kind;
        }
    };
    exports.FoldingRange = FoldingRange;
    exports.FoldingRange = FoldingRange = __decorate([
        es5ClassCompat
    ], FoldingRange);
    var FoldingRangeKind;
    (function (FoldingRangeKind) {
        FoldingRangeKind[FoldingRangeKind["Comment"] = 1] = "Comment";
        FoldingRangeKind[FoldingRangeKind["Imports"] = 2] = "Imports";
        FoldingRangeKind[FoldingRangeKind["Region"] = 3] = "Region";
    })(FoldingRangeKind || (exports.FoldingRangeKind = FoldingRangeKind = {}));
    //#endregion
    //#region Comment
    var CommentThreadCollapsibleState;
    (function (CommentThreadCollapsibleState) {
        /**
         * Determines an item is collapsed
         */
        CommentThreadCollapsibleState[CommentThreadCollapsibleState["Collapsed"] = 0] = "Collapsed";
        /**
         * Determines an item is expanded
         */
        CommentThreadCollapsibleState[CommentThreadCollapsibleState["Expanded"] = 1] = "Expanded";
    })(CommentThreadCollapsibleState || (exports.CommentThreadCollapsibleState = CommentThreadCollapsibleState = {}));
    var CommentMode;
    (function (CommentMode) {
        CommentMode[CommentMode["Editing"] = 0] = "Editing";
        CommentMode[CommentMode["Preview"] = 1] = "Preview";
    })(CommentMode || (exports.CommentMode = CommentMode = {}));
    var CommentState;
    (function (CommentState) {
        CommentState[CommentState["Published"] = 0] = "Published";
        CommentState[CommentState["Draft"] = 1] = "Draft";
    })(CommentState || (exports.CommentState = CommentState = {}));
    var CommentThreadState;
    (function (CommentThreadState) {
        CommentThreadState[CommentThreadState["Unresolved"] = 0] = "Unresolved";
        CommentThreadState[CommentThreadState["Resolved"] = 1] = "Resolved";
    })(CommentThreadState || (exports.CommentThreadState = CommentThreadState = {}));
    var CommentThreadApplicability;
    (function (CommentThreadApplicability) {
        CommentThreadApplicability[CommentThreadApplicability["Current"] = 0] = "Current";
        CommentThreadApplicability[CommentThreadApplicability["Outdated"] = 1] = "Outdated";
    })(CommentThreadApplicability || (exports.CommentThreadApplicability = CommentThreadApplicability = {}));
    //#endregion
    //#region Semantic Coloring
    class SemanticTokensLegend {
        constructor(tokenTypes, tokenModifiers = []) {
            this.tokenTypes = tokenTypes;
            this.tokenModifiers = tokenModifiers;
        }
    }
    exports.SemanticTokensLegend = SemanticTokensLegend;
    function isStrArrayOrUndefined(arg) {
        return ((typeof arg === 'undefined') || (0, types_1.isStringArray)(arg));
    }
    class SemanticTokensBuilder {
        constructor(legend) {
            this._prevLine = 0;
            this._prevChar = 0;
            this._dataIsSortedAndDeltaEncoded = true;
            this._data = [];
            this._dataLen = 0;
            this._tokenTypeStrToInt = new Map();
            this._tokenModifierStrToInt = new Map();
            this._hasLegend = false;
            if (legend) {
                this._hasLegend = true;
                for (let i = 0, len = legend.tokenTypes.length; i < len; i++) {
                    this._tokenTypeStrToInt.set(legend.tokenTypes[i], i);
                }
                for (let i = 0, len = legend.tokenModifiers.length; i < len; i++) {
                    this._tokenModifierStrToInt.set(legend.tokenModifiers[i], i);
                }
            }
        }
        push(arg0, arg1, arg2, arg3, arg4) {
            if (typeof arg0 === 'number' && typeof arg1 === 'number' && typeof arg2 === 'number' && typeof arg3 === 'number' && (typeof arg4 === 'number' || typeof arg4 === 'undefined')) {
                if (typeof arg4 === 'undefined') {
                    arg4 = 0;
                }
                // 1st overload
                return this._pushEncoded(arg0, arg1, arg2, arg3, arg4);
            }
            if (Range.isRange(arg0) && typeof arg1 === 'string' && isStrArrayOrUndefined(arg2)) {
                // 2nd overload
                return this._push(arg0, arg1, arg2);
            }
            throw (0, errors_1.illegalArgument)();
        }
        _push(range, tokenType, tokenModifiers) {
            if (!this._hasLegend) {
                throw new Error('Legend must be provided in constructor');
            }
            if (range.start.line !== range.end.line) {
                throw new Error('`range` cannot span multiple lines');
            }
            if (!this._tokenTypeStrToInt.has(tokenType)) {
                throw new Error('`tokenType` is not in the provided legend');
            }
            const line = range.start.line;
            const char = range.start.character;
            const length = range.end.character - range.start.character;
            const nTokenType = this._tokenTypeStrToInt.get(tokenType);
            let nTokenModifiers = 0;
            if (tokenModifiers) {
                for (const tokenModifier of tokenModifiers) {
                    if (!this._tokenModifierStrToInt.has(tokenModifier)) {
                        throw new Error('`tokenModifier` is not in the provided legend');
                    }
                    const nTokenModifier = this._tokenModifierStrToInt.get(tokenModifier);
                    nTokenModifiers |= (1 << nTokenModifier) >>> 0;
                }
            }
            this._pushEncoded(line, char, length, nTokenType, nTokenModifiers);
        }
        _pushEncoded(line, char, length, tokenType, tokenModifiers) {
            if (this._dataIsSortedAndDeltaEncoded && (line < this._prevLine || (line === this._prevLine && char < this._prevChar))) {
                // push calls were ordered and are no longer ordered
                this._dataIsSortedAndDeltaEncoded = false;
                // Remove delta encoding from data
                const tokenCount = (this._data.length / 5) | 0;
                let prevLine = 0;
                let prevChar = 0;
                for (let i = 0; i < tokenCount; i++) {
                    let line = this._data[5 * i];
                    let char = this._data[5 * i + 1];
                    if (line === 0) {
                        // on the same line as previous token
                        line = prevLine;
                        char += prevChar;
                    }
                    else {
                        // on a different line than previous token
                        line += prevLine;
                    }
                    this._data[5 * i] = line;
                    this._data[5 * i + 1] = char;
                    prevLine = line;
                    prevChar = char;
                }
            }
            let pushLine = line;
            let pushChar = char;
            if (this._dataIsSortedAndDeltaEncoded && this._dataLen > 0) {
                pushLine -= this._prevLine;
                if (pushLine === 0) {
                    pushChar -= this._prevChar;
                }
            }
            this._data[this._dataLen++] = pushLine;
            this._data[this._dataLen++] = pushChar;
            this._data[this._dataLen++] = length;
            this._data[this._dataLen++] = tokenType;
            this._data[this._dataLen++] = tokenModifiers;
            this._prevLine = line;
            this._prevChar = char;
        }
        static _sortAndDeltaEncode(data) {
            const pos = [];
            const tokenCount = (data.length / 5) | 0;
            for (let i = 0; i < tokenCount; i++) {
                pos[i] = i;
            }
            pos.sort((a, b) => {
                const aLine = data[5 * a];
                const bLine = data[5 * b];
                if (aLine === bLine) {
                    const aChar = data[5 * a + 1];
                    const bChar = data[5 * b + 1];
                    return aChar - bChar;
                }
                return aLine - bLine;
            });
            const result = new Uint32Array(data.length);
            let prevLine = 0;
            let prevChar = 0;
            for (let i = 0; i < tokenCount; i++) {
                const srcOffset = 5 * pos[i];
                const line = data[srcOffset + 0];
                const char = data[srcOffset + 1];
                const length = data[srcOffset + 2];
                const tokenType = data[srcOffset + 3];
                const tokenModifiers = data[srcOffset + 4];
                const pushLine = line - prevLine;
                const pushChar = (pushLine === 0 ? char - prevChar : char);
                const dstOffset = 5 * i;
                result[dstOffset + 0] = pushLine;
                result[dstOffset + 1] = pushChar;
                result[dstOffset + 2] = length;
                result[dstOffset + 3] = tokenType;
                result[dstOffset + 4] = tokenModifiers;
                prevLine = line;
                prevChar = char;
            }
            return result;
        }
        build(resultId) {
            if (!this._dataIsSortedAndDeltaEncoded) {
                return new SemanticTokens(SemanticTokensBuilder._sortAndDeltaEncode(this._data), resultId);
            }
            return new SemanticTokens(new Uint32Array(this._data), resultId);
        }
    }
    exports.SemanticTokensBuilder = SemanticTokensBuilder;
    class SemanticTokens {
        constructor(data, resultId) {
            this.resultId = resultId;
            this.data = data;
        }
    }
    exports.SemanticTokens = SemanticTokens;
    class SemanticTokensEdit {
        constructor(start, deleteCount, data) {
            this.start = start;
            this.deleteCount = deleteCount;
            this.data = data;
        }
    }
    exports.SemanticTokensEdit = SemanticTokensEdit;
    class SemanticTokensEdits {
        constructor(edits, resultId) {
            this.resultId = resultId;
            this.edits = edits;
        }
    }
    exports.SemanticTokensEdits = SemanticTokensEdits;
    //#endregion
    //#region debug
    var DebugConsoleMode;
    (function (DebugConsoleMode) {
        /**
         * Debug session should have a separate debug console.
         */
        DebugConsoleMode[DebugConsoleMode["Separate"] = 0] = "Separate";
        /**
         * Debug session should share debug console with its parent session.
         * This value has no effect for sessions which do not have a parent session.
         */
        DebugConsoleMode[DebugConsoleMode["MergeWithParent"] = 1] = "MergeWithParent";
    })(DebugConsoleMode || (exports.DebugConsoleMode = DebugConsoleMode = {}));
    class DebugVisualization {
        constructor(name) {
            this.name = name;
        }
    }
    exports.DebugVisualization = DebugVisualization;
    //#endregion
    let QuickInputButtons = class QuickInputButtons {
        static { this.Back = { iconPath: new ThemeIcon('arrow-left') }; }
        constructor() { }
    };
    exports.QuickInputButtons = QuickInputButtons;
    exports.QuickInputButtons = QuickInputButtons = __decorate([
        es5ClassCompat
    ], QuickInputButtons);
    var QuickPickItemKind;
    (function (QuickPickItemKind) {
        QuickPickItemKind[QuickPickItemKind["Separator"] = -1] = "Separator";
        QuickPickItemKind[QuickPickItemKind["Default"] = 0] = "Default";
    })(QuickPickItemKind || (exports.QuickPickItemKind = QuickPickItemKind = {}));
    var InputBoxValidationSeverity;
    (function (InputBoxValidationSeverity) {
        InputBoxValidationSeverity[InputBoxValidationSeverity["Info"] = 1] = "Info";
        InputBoxValidationSeverity[InputBoxValidationSeverity["Warning"] = 2] = "Warning";
        InputBoxValidationSeverity[InputBoxValidationSeverity["Error"] = 3] = "Error";
    })(InputBoxValidationSeverity || (exports.InputBoxValidationSeverity = InputBoxValidationSeverity = {}));
    var ExtensionKind;
    (function (ExtensionKind) {
        ExtensionKind[ExtensionKind["UI"] = 1] = "UI";
        ExtensionKind[ExtensionKind["Workspace"] = 2] = "Workspace";
    })(ExtensionKind || (exports.ExtensionKind = ExtensionKind = {}));
    class FileDecoration {
        static validate(d) {
            if (typeof d.badge === 'string') {
                let len = (0, strings_1.nextCharLength)(d.badge, 0);
                if (len < d.badge.length) {
                    len += (0, strings_1.nextCharLength)(d.badge, len);
                }
                if (d.badge.length > len) {
                    throw new Error(`The 'badge'-property must be undefined or a short character`);
                }
            }
            else if (d.badge) {
                if (!ThemeIcon.isThemeIcon(d.badge)) {
                    throw new Error(`The 'badge'-property is not a valid ThemeIcon`);
                }
            }
            if (!d.color && !d.badge && !d.tooltip) {
                throw new Error(`The decoration is empty`);
            }
            return true;
        }
        constructor(badge, tooltip, color) {
            this.badge = badge;
            this.tooltip = tooltip;
            this.color = color;
        }
    }
    exports.FileDecoration = FileDecoration;
    //#region Theming
    let ColorTheme = class ColorTheme {
        constructor(kind) {
            this.kind = kind;
        }
    };
    exports.ColorTheme = ColorTheme;
    exports.ColorTheme = ColorTheme = __decorate([
        es5ClassCompat
    ], ColorTheme);
    var ColorThemeKind;
    (function (ColorThemeKind) {
        ColorThemeKind[ColorThemeKind["Light"] = 1] = "Light";
        ColorThemeKind[ColorThemeKind["Dark"] = 2] = "Dark";
        ColorThemeKind[ColorThemeKind["HighContrast"] = 3] = "HighContrast";
        ColorThemeKind[ColorThemeKind["HighContrastLight"] = 4] = "HighContrastLight";
    })(ColorThemeKind || (exports.ColorThemeKind = ColorThemeKind = {}));
    //#endregion Theming
    //#region Notebook
    class NotebookRange {
        static isNotebookRange(thing) {
            if (thing instanceof NotebookRange) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return typeof thing.start === 'number'
                && typeof thing.end === 'number';
        }
        get start() {
            return this._start;
        }
        get end() {
            return this._end;
        }
        get isEmpty() {
            return this._start === this._end;
        }
        constructor(start, end) {
            if (start < 0) {
                throw (0, errors_1.illegalArgument)('start must be positive');
            }
            if (end < 0) {
                throw (0, errors_1.illegalArgument)('end must be positive');
            }
            if (start <= end) {
                this._start = start;
                this._end = end;
            }
            else {
                this._start = end;
                this._end = start;
            }
        }
        with(change) {
            let start = this._start;
            let end = this._end;
            if (change.start !== undefined) {
                start = change.start;
            }
            if (change.end !== undefined) {
                end = change.end;
            }
            if (start === this._start && end === this._end) {
                return this;
            }
            return new NotebookRange(start, end);
        }
    }
    exports.NotebookRange = NotebookRange;
    class NotebookCellData {
        static validate(data) {
            if (typeof data.kind !== 'number') {
                throw new Error('NotebookCellData MUST have \'kind\' property');
            }
            if (typeof data.value !== 'string') {
                throw new Error('NotebookCellData MUST have \'value\' property');
            }
            if (typeof data.languageId !== 'string') {
                throw new Error('NotebookCellData MUST have \'languageId\' property');
            }
        }
        static isNotebookCellDataArray(value) {
            return Array.isArray(value) && value.every(elem => NotebookCellData.isNotebookCellData(elem));
        }
        static isNotebookCellData(value) {
            // return value instanceof NotebookCellData;
            return true;
        }
        constructor(kind, value, languageId, mime, outputs, metadata, executionSummary) {
            this.kind = kind;
            this.value = value;
            this.languageId = languageId;
            this.mime = mime;
            this.outputs = outputs ?? [];
            this.metadata = metadata;
            this.executionSummary = executionSummary;
            NotebookCellData.validate(this);
        }
    }
    exports.NotebookCellData = NotebookCellData;
    class NotebookData {
        constructor(cells) {
            this.cells = cells;
        }
    }
    exports.NotebookData = NotebookData;
    class NotebookCellOutputItem {
        static isNotebookCellOutputItem(obj) {
            if (obj instanceof NotebookCellOutputItem) {
                return true;
            }
            if (!obj) {
                return false;
            }
            return typeof obj.mime === 'string'
                && obj.data instanceof Uint8Array;
        }
        static error(err) {
            const obj = {
                name: err.name,
                message: err.message,
                stack: err.stack
            };
            return NotebookCellOutputItem.json(obj, 'application/vnd.code.notebook.error');
        }
        static stdout(value) {
            return NotebookCellOutputItem.text(value, 'application/vnd.code.notebook.stdout');
        }
        static stderr(value) {
            return NotebookCellOutputItem.text(value, 'application/vnd.code.notebook.stderr');
        }
        static bytes(value, mime = 'application/octet-stream') {
            return new NotebookCellOutputItem(value, mime);
        }
        static #encoder = new TextEncoder();
        static text(value, mime = mime_1.Mimes.text) {
            const bytes = NotebookCellOutputItem.#encoder.encode(String(value));
            return new NotebookCellOutputItem(bytes, mime);
        }
        static json(value, mime = 'text/x-json') {
            const rawStr = JSON.stringify(value, undefined, '\t');
            return NotebookCellOutputItem.text(rawStr, mime);
        }
        constructor(data, mime) {
            this.data = data;
            this.mime = mime;
            const mimeNormalized = (0, mime_1.normalizeMimeType)(mime, true);
            if (!mimeNormalized) {
                throw new Error(`INVALID mime type: ${mime}. Must be in the format "type/subtype[;optionalparameter]"`);
            }
            this.mime = mimeNormalized;
        }
    }
    exports.NotebookCellOutputItem = NotebookCellOutputItem;
    class NotebookCellOutput {
        static isNotebookCellOutput(candidate) {
            if (candidate instanceof NotebookCellOutput) {
                return true;
            }
            if (!candidate || typeof candidate !== 'object') {
                return false;
            }
            return typeof candidate.id === 'string' && Array.isArray(candidate.items);
        }
        static ensureUniqueMimeTypes(items, warn = false) {
            const seen = new Set();
            const removeIdx = new Set();
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const normalMime = (0, mime_1.normalizeMimeType)(item.mime);
                // We can have multiple text stream mime types in the same output.
                if (!seen.has(normalMime) || (0, notebookCommon_1.isTextStreamMime)(normalMime)) {
                    seen.add(normalMime);
                    continue;
                }
                // duplicated mime types... first has won
                removeIdx.add(i);
                if (warn) {
                    console.warn(`DUPLICATED mime type '${item.mime}' will be dropped`);
                }
            }
            if (removeIdx.size === 0) {
                return items;
            }
            return items.filter((_item, index) => !removeIdx.has(index));
        }
        constructor(items, idOrMetadata, metadata) {
            this.items = NotebookCellOutput.ensureUniqueMimeTypes(items, true);
            if (typeof idOrMetadata === 'string') {
                this.id = idOrMetadata;
                this.metadata = metadata;
            }
            else {
                this.id = (0, uuid_1.generateUuid)();
                this.metadata = idOrMetadata ?? metadata;
            }
        }
    }
    exports.NotebookCellOutput = NotebookCellOutput;
    var NotebookCellKind;
    (function (NotebookCellKind) {
        NotebookCellKind[NotebookCellKind["Markup"] = 1] = "Markup";
        NotebookCellKind[NotebookCellKind["Code"] = 2] = "Code";
    })(NotebookCellKind || (exports.NotebookCellKind = NotebookCellKind = {}));
    var NotebookCellExecutionState;
    (function (NotebookCellExecutionState) {
        NotebookCellExecutionState[NotebookCellExecutionState["Idle"] = 1] = "Idle";
        NotebookCellExecutionState[NotebookCellExecutionState["Pending"] = 2] = "Pending";
        NotebookCellExecutionState[NotebookCellExecutionState["Executing"] = 3] = "Executing";
    })(NotebookCellExecutionState || (exports.NotebookCellExecutionState = NotebookCellExecutionState = {}));
    var NotebookCellStatusBarAlignment;
    (function (NotebookCellStatusBarAlignment) {
        NotebookCellStatusBarAlignment[NotebookCellStatusBarAlignment["Left"] = 1] = "Left";
        NotebookCellStatusBarAlignment[NotebookCellStatusBarAlignment["Right"] = 2] = "Right";
    })(NotebookCellStatusBarAlignment || (exports.NotebookCellStatusBarAlignment = NotebookCellStatusBarAlignment = {}));
    var NotebookEditorRevealType;
    (function (NotebookEditorRevealType) {
        NotebookEditorRevealType[NotebookEditorRevealType["Default"] = 0] = "Default";
        NotebookEditorRevealType[NotebookEditorRevealType["InCenter"] = 1] = "InCenter";
        NotebookEditorRevealType[NotebookEditorRevealType["InCenterIfOutsideViewport"] = 2] = "InCenterIfOutsideViewport";
        NotebookEditorRevealType[NotebookEditorRevealType["AtTop"] = 3] = "AtTop";
    })(NotebookEditorRevealType || (exports.NotebookEditorRevealType = NotebookEditorRevealType = {}));
    class NotebookCellStatusBarItem {
        constructor(text, alignment) {
            this.text = text;
            this.alignment = alignment;
        }
    }
    exports.NotebookCellStatusBarItem = NotebookCellStatusBarItem;
    var NotebookControllerAffinity;
    (function (NotebookControllerAffinity) {
        NotebookControllerAffinity[NotebookControllerAffinity["Default"] = 1] = "Default";
        NotebookControllerAffinity[NotebookControllerAffinity["Preferred"] = 2] = "Preferred";
    })(NotebookControllerAffinity || (exports.NotebookControllerAffinity = NotebookControllerAffinity = {}));
    var NotebookControllerAffinity2;
    (function (NotebookControllerAffinity2) {
        NotebookControllerAffinity2[NotebookControllerAffinity2["Default"] = 1] = "Default";
        NotebookControllerAffinity2[NotebookControllerAffinity2["Preferred"] = 2] = "Preferred";
        NotebookControllerAffinity2[NotebookControllerAffinity2["Hidden"] = -1] = "Hidden";
    })(NotebookControllerAffinity2 || (exports.NotebookControllerAffinity2 = NotebookControllerAffinity2 = {}));
    class NotebookRendererScript {
        constructor(uri, provides = []) {
            this.uri = uri;
            this.provides = (0, arrays_1.asArray)(provides);
        }
    }
    exports.NotebookRendererScript = NotebookRendererScript;
    class NotebookKernelSourceAction {
        constructor(label) {
            this.label = label;
        }
    }
    exports.NotebookKernelSourceAction = NotebookKernelSourceAction;
    var NotebookVariablesRequestKind;
    (function (NotebookVariablesRequestKind) {
        NotebookVariablesRequestKind[NotebookVariablesRequestKind["Named"] = 1] = "Named";
        NotebookVariablesRequestKind[NotebookVariablesRequestKind["Indexed"] = 2] = "Indexed";
    })(NotebookVariablesRequestKind || (exports.NotebookVariablesRequestKind = NotebookVariablesRequestKind = {}));
    //#endregion
    //#region Timeline
    let TimelineItem = class TimelineItem {
        constructor(label, timestamp) {
            this.label = label;
            this.timestamp = timestamp;
        }
    };
    exports.TimelineItem = TimelineItem;
    exports.TimelineItem = TimelineItem = __decorate([
        es5ClassCompat
    ], TimelineItem);
    //#endregion Timeline
    //#region ExtensionContext
    var ExtensionMode;
    (function (ExtensionMode) {
        /**
         * The extension is installed normally (for example, from the marketplace
         * or VSIX) in VS Code.
         */
        ExtensionMode[ExtensionMode["Production"] = 1] = "Production";
        /**
         * The extension is running from an `--extensionDevelopmentPath` provided
         * when launching VS Code.
         */
        ExtensionMode[ExtensionMode["Development"] = 2] = "Development";
        /**
         * The extension is running from an `--extensionDevelopmentPath` and
         * the extension host is running unit tests.
         */
        ExtensionMode[ExtensionMode["Test"] = 3] = "Test";
    })(ExtensionMode || (exports.ExtensionMode = ExtensionMode = {}));
    var ExtensionRuntime;
    (function (ExtensionRuntime) {
        /**
         * The extension is running in a NodeJS extension host. Runtime access to NodeJS APIs is available.
         */
        ExtensionRuntime[ExtensionRuntime["Node"] = 1] = "Node";
        /**
         * The extension is running in a Webworker extension host. Runtime access is limited to Webworker APIs.
         */
        ExtensionRuntime[ExtensionRuntime["Webworker"] = 2] = "Webworker";
    })(ExtensionRuntime || (exports.ExtensionRuntime = ExtensionRuntime = {}));
    //#endregion ExtensionContext
    var StandardTokenType;
    (function (StandardTokenType) {
        StandardTokenType[StandardTokenType["Other"] = 0] = "Other";
        StandardTokenType[StandardTokenType["Comment"] = 1] = "Comment";
        StandardTokenType[StandardTokenType["String"] = 2] = "String";
        StandardTokenType[StandardTokenType["RegEx"] = 3] = "RegEx";
    })(StandardTokenType || (exports.StandardTokenType = StandardTokenType = {}));
    class LinkedEditingRanges {
        constructor(ranges, wordPattern) {
            this.ranges = ranges;
            this.wordPattern = wordPattern;
        }
    }
    exports.LinkedEditingRanges = LinkedEditingRanges;
    //#region ports
    class PortAttributes {
        constructor(autoForwardAction) {
            this._autoForwardAction = autoForwardAction;
        }
        get autoForwardAction() {
            return this._autoForwardAction;
        }
    }
    exports.PortAttributes = PortAttributes;
    //#endregion ports
    //#region Testing
    var TestResultState;
    (function (TestResultState) {
        TestResultState[TestResultState["Queued"] = 1] = "Queued";
        TestResultState[TestResultState["Running"] = 2] = "Running";
        TestResultState[TestResultState["Passed"] = 3] = "Passed";
        TestResultState[TestResultState["Failed"] = 4] = "Failed";
        TestResultState[TestResultState["Skipped"] = 5] = "Skipped";
        TestResultState[TestResultState["Errored"] = 6] = "Errored";
    })(TestResultState || (exports.TestResultState = TestResultState = {}));
    var TestRunProfileKind;
    (function (TestRunProfileKind) {
        TestRunProfileKind[TestRunProfileKind["Run"] = 1] = "Run";
        TestRunProfileKind[TestRunProfileKind["Debug"] = 2] = "Debug";
        TestRunProfileKind[TestRunProfileKind["Coverage"] = 3] = "Coverage";
    })(TestRunProfileKind || (exports.TestRunProfileKind = TestRunProfileKind = {}));
    let TestRunRequest = class TestRunRequest {
        constructor(include = undefined, exclude = undefined, profile = undefined, continuous = false) {
            this.include = include;
            this.exclude = exclude;
            this.profile = profile;
            this.continuous = continuous;
        }
    };
    exports.TestRunRequest = TestRunRequest;
    exports.TestRunRequest = TestRunRequest = __decorate([
        es5ClassCompat
    ], TestRunRequest);
    let TestMessage = TestMessage_1 = class TestMessage {
        static diff(message, expected, actual) {
            const msg = new TestMessage_1(message);
            msg.expectedOutput = expected;
            msg.actualOutput = actual;
            return msg;
        }
        constructor(message) {
            this.message = message;
        }
    };
    exports.TestMessage = TestMessage;
    exports.TestMessage = TestMessage = TestMessage_1 = __decorate([
        es5ClassCompat
    ], TestMessage);
    let TestTag = class TestTag {
        constructor(id) {
            this.id = id;
        }
    };
    exports.TestTag = TestTag;
    exports.TestTag = TestTag = __decorate([
        es5ClassCompat
    ], TestTag);
    //#endregion
    //#region Test Coverage
    class TestCoverageCount {
        constructor(covered, total) {
            this.covered = covered;
            this.total = total;
            validateTestCoverageCount(this);
        }
    }
    exports.TestCoverageCount = TestCoverageCount;
    function validateTestCoverageCount(cc) {
        if (!cc) {
            return;
        }
        if (cc.covered > cc.total) {
            throw new Error(`The total number of covered items (${cc.covered}) cannot be greater than the total (${cc.total})`);
        }
        if (cc.total < 0) {
            throw new Error(`The number of covered items (${cc.total}) cannot be negative`);
        }
    }
    class FileCoverage {
        static fromDetails(uri, details) {
            const statements = new TestCoverageCount(0, 0);
            const branches = new TestCoverageCount(0, 0);
            const decl = new TestCoverageCount(0, 0);
            for (const detail of details) {
                if ('branches' in detail) {
                    statements.total += 1;
                    statements.covered += detail.executed ? 1 : 0;
                    for (const branch of detail.branches) {
                        branches.total += 1;
                        branches.covered += branch.executed ? 1 : 0;
                    }
                }
                else {
                    decl.total += 1;
                    decl.covered += detail.executed ? 1 : 0;
                }
            }
            const coverage = new FileCoverage(uri, statements, branches.total > 0 ? branches : undefined, decl.total > 0 ? decl : undefined);
            coverage.detailedCoverage = details;
            return coverage;
        }
        constructor(uri, statementCoverage, branchCoverage, declarationCoverage) {
            this.uri = uri;
            this.statementCoverage = statementCoverage;
            this.branchCoverage = branchCoverage;
            this.declarationCoverage = declarationCoverage;
        }
    }
    exports.FileCoverage = FileCoverage;
    class StatementCoverage {
        // back compat until finalization:
        get executionCount() { return +this.executed; }
        set executionCount(n) { this.executed = n; }
        constructor(executed, location, branches = []) {
            this.executed = executed;
            this.location = location;
            this.branches = branches;
        }
    }
    exports.StatementCoverage = StatementCoverage;
    class BranchCoverage {
        // back compat until finalization:
        get executionCount() { return +this.executed; }
        set executionCount(n) { this.executed = n; }
        constructor(executed, location, label) {
            this.executed = executed;
            this.location = location;
            this.label = label;
        }
    }
    exports.BranchCoverage = BranchCoverage;
    class DeclarationCoverage {
        // back compat until finalization:
        get executionCount() { return +this.executed; }
        set executionCount(n) { this.executed = n; }
        constructor(name, executed, location) {
            this.name = name;
            this.executed = executed;
            this.location = location;
        }
    }
    exports.DeclarationCoverage = DeclarationCoverage;
    //#endregion
    var ExternalUriOpenerPriority;
    (function (ExternalUriOpenerPriority) {
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["None"] = 0] = "None";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Option"] = 1] = "Option";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Default"] = 2] = "Default";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Preferred"] = 3] = "Preferred";
    })(ExternalUriOpenerPriority || (exports.ExternalUriOpenerPriority = ExternalUriOpenerPriority = {}));
    var WorkspaceTrustState;
    (function (WorkspaceTrustState) {
        WorkspaceTrustState[WorkspaceTrustState["Untrusted"] = 0] = "Untrusted";
        WorkspaceTrustState[WorkspaceTrustState["Trusted"] = 1] = "Trusted";
        WorkspaceTrustState[WorkspaceTrustState["Unspecified"] = 2] = "Unspecified";
    })(WorkspaceTrustState || (exports.WorkspaceTrustState = WorkspaceTrustState = {}));
    var PortAutoForwardAction;
    (function (PortAutoForwardAction) {
        PortAutoForwardAction[PortAutoForwardAction["Notify"] = 1] = "Notify";
        PortAutoForwardAction[PortAutoForwardAction["OpenBrowser"] = 2] = "OpenBrowser";
        PortAutoForwardAction[PortAutoForwardAction["OpenPreview"] = 3] = "OpenPreview";
        PortAutoForwardAction[PortAutoForwardAction["Silent"] = 4] = "Silent";
        PortAutoForwardAction[PortAutoForwardAction["Ignore"] = 5] = "Ignore";
        PortAutoForwardAction[PortAutoForwardAction["OpenBrowserOnce"] = 6] = "OpenBrowserOnce";
    })(PortAutoForwardAction || (exports.PortAutoForwardAction = PortAutoForwardAction = {}));
    class TypeHierarchyItem {
        constructor(kind, name, detail, uri, range, selectionRange) {
            this.kind = kind;
            this.name = name;
            this.detail = detail;
            this.uri = uri;
            this.range = range;
            this.selectionRange = selectionRange;
        }
    }
    exports.TypeHierarchyItem = TypeHierarchyItem;
    //#region Tab Inputs
    class TextTabInput {
        constructor(uri) {
            this.uri = uri;
        }
    }
    exports.TextTabInput = TextTabInput;
    class TextDiffTabInput {
        constructor(original, modified) {
            this.original = original;
            this.modified = modified;
        }
    }
    exports.TextDiffTabInput = TextDiffTabInput;
    class TextMergeTabInput {
        constructor(base, input1, input2, result) {
            this.base = base;
            this.input1 = input1;
            this.input2 = input2;
            this.result = result;
        }
    }
    exports.TextMergeTabInput = TextMergeTabInput;
    class CustomEditorTabInput {
        constructor(uri, viewType) {
            this.uri = uri;
            this.viewType = viewType;
        }
    }
    exports.CustomEditorTabInput = CustomEditorTabInput;
    class WebviewEditorTabInput {
        constructor(viewType) {
            this.viewType = viewType;
        }
    }
    exports.WebviewEditorTabInput = WebviewEditorTabInput;
    class NotebookEditorTabInput {
        constructor(uri, notebookType) {
            this.uri = uri;
            this.notebookType = notebookType;
        }
    }
    exports.NotebookEditorTabInput = NotebookEditorTabInput;
    class NotebookDiffEditorTabInput {
        constructor(original, modified, notebookType) {
            this.original = original;
            this.modified = modified;
            this.notebookType = notebookType;
        }
    }
    exports.NotebookDiffEditorTabInput = NotebookDiffEditorTabInput;
    class TerminalEditorTabInput {
        constructor() { }
    }
    exports.TerminalEditorTabInput = TerminalEditorTabInput;
    class InteractiveWindowInput {
        constructor(uri, inputBoxUri) {
            this.uri = uri;
            this.inputBoxUri = inputBoxUri;
        }
    }
    exports.InteractiveWindowInput = InteractiveWindowInput;
    class ChatEditorTabInput {
        constructor(providerId) {
            this.providerId = providerId;
        }
    }
    exports.ChatEditorTabInput = ChatEditorTabInput;
    class TextMultiDiffTabInput {
        constructor(textDiffs) {
            this.textDiffs = textDiffs;
        }
    }
    exports.TextMultiDiffTabInput = TextMultiDiffTabInput;
    //#endregion
    //#region Chat
    var InteractiveSessionVoteDirection;
    (function (InteractiveSessionVoteDirection) {
        InteractiveSessionVoteDirection[InteractiveSessionVoteDirection["Down"] = 0] = "Down";
        InteractiveSessionVoteDirection[InteractiveSessionVoteDirection["Up"] = 1] = "Up";
    })(InteractiveSessionVoteDirection || (exports.InteractiveSessionVoteDirection = InteractiveSessionVoteDirection = {}));
    var ChatCopyKind;
    (function (ChatCopyKind) {
        ChatCopyKind[ChatCopyKind["Action"] = 1] = "Action";
        ChatCopyKind[ChatCopyKind["Toolbar"] = 2] = "Toolbar";
    })(ChatCopyKind || (exports.ChatCopyKind = ChatCopyKind = {}));
    var ChatVariableLevel;
    (function (ChatVariableLevel) {
        ChatVariableLevel[ChatVariableLevel["Short"] = 1] = "Short";
        ChatVariableLevel[ChatVariableLevel["Medium"] = 2] = "Medium";
        ChatVariableLevel[ChatVariableLevel["Full"] = 3] = "Full";
    })(ChatVariableLevel || (exports.ChatVariableLevel = ChatVariableLevel = {}));
    class ChatCompletionItem {
        constructor(label, values) {
            this.label = label;
            this.values = values;
        }
    }
    exports.ChatCompletionItem = ChatCompletionItem;
    //#endregion
    //#region Interactive Editor
    var InteractiveEditorResponseFeedbackKind;
    (function (InteractiveEditorResponseFeedbackKind) {
        InteractiveEditorResponseFeedbackKind[InteractiveEditorResponseFeedbackKind["Unhelpful"] = 0] = "Unhelpful";
        InteractiveEditorResponseFeedbackKind[InteractiveEditorResponseFeedbackKind["Helpful"] = 1] = "Helpful";
        InteractiveEditorResponseFeedbackKind[InteractiveEditorResponseFeedbackKind["Undone"] = 2] = "Undone";
        InteractiveEditorResponseFeedbackKind[InteractiveEditorResponseFeedbackKind["Accepted"] = 3] = "Accepted";
        InteractiveEditorResponseFeedbackKind[InteractiveEditorResponseFeedbackKind["Bug"] = 4] = "Bug";
    })(InteractiveEditorResponseFeedbackKind || (exports.InteractiveEditorResponseFeedbackKind = InteractiveEditorResponseFeedbackKind = {}));
    var ChatResultFeedbackKind;
    (function (ChatResultFeedbackKind) {
        ChatResultFeedbackKind[ChatResultFeedbackKind["Unhelpful"] = 0] = "Unhelpful";
        ChatResultFeedbackKind[ChatResultFeedbackKind["Helpful"] = 1] = "Helpful";
    })(ChatResultFeedbackKind || (exports.ChatResultFeedbackKind = ChatResultFeedbackKind = {}));
    class ChatResponseMarkdownPart {
        constructor(value) {
            this.value = typeof value === 'string' ? new MarkdownString(value) : value;
        }
    }
    exports.ChatResponseMarkdownPart = ChatResponseMarkdownPart;
    class ChatResponseFileTreePart {
        constructor(value, baseUri) {
            this.value = value;
            this.baseUri = baseUri;
        }
    }
    exports.ChatResponseFileTreePart = ChatResponseFileTreePart;
    class ChatResponseAnchorPart {
        constructor(value, title) {
            this.value = value;
            this.title = title;
        }
    }
    exports.ChatResponseAnchorPart = ChatResponseAnchorPart;
    class ChatResponseProgressPart {
        constructor(value) {
            this.value = value;
        }
    }
    exports.ChatResponseProgressPart = ChatResponseProgressPart;
    class ChatResponseCommandButtonPart {
        constructor(value) {
            this.value = value;
        }
    }
    exports.ChatResponseCommandButtonPart = ChatResponseCommandButtonPart;
    class ChatResponseReferencePart {
        constructor(value) {
            this.value = value;
        }
    }
    exports.ChatResponseReferencePart = ChatResponseReferencePart;
    class ChatRequestTurn {
        constructor(prompt, command, variables, participant) {
            this.prompt = prompt;
            this.command = command;
            this.variables = variables;
            this.participant = participant;
        }
    }
    exports.ChatRequestTurn = ChatRequestTurn;
    class ChatResponseTurn {
        constructor(response, result, participant, command) {
            this.response = response;
            this.result = result;
            this.participant = participant;
            this.command = command;
        }
    }
    exports.ChatResponseTurn = ChatResponseTurn;
    var ChatLocation;
    (function (ChatLocation) {
        ChatLocation[ChatLocation["Panel"] = 1] = "Panel";
        ChatLocation[ChatLocation["Terminal"] = 2] = "Terminal";
        ChatLocation[ChatLocation["Notebook"] = 3] = "Notebook";
        ChatLocation[ChatLocation["Editor"] = 4] = "Editor";
    })(ChatLocation || (exports.ChatLocation = ChatLocation = {}));
    class LanguageModelChatSystemMessage {
        constructor(content) {
            this.content = content;
        }
    }
    exports.LanguageModelChatSystemMessage = LanguageModelChatSystemMessage;
    class LanguageModelChatUserMessage {
        constructor(content, name) {
            this.content = content;
            this.name = name;
        }
    }
    exports.LanguageModelChatUserMessage = LanguageModelChatUserMessage;
    class LanguageModelChatAssistantMessage {
        constructor(content, name) {
            this.content = content;
            this.name = name;
        }
    }
    exports.LanguageModelChatAssistantMessage = LanguageModelChatAssistantMessage;
    class LanguageModelError extends Error {
        static NotFound(message) {
            return new LanguageModelError(message, LanguageModelError.NotFound.name);
        }
        static NoPermissions(message) {
            return new LanguageModelError(message, LanguageModelError.NoPermissions.name);
        }
        constructor(message, code, cause) {
            super(message, { cause });
            this.name = 'LanguageModelError';
            this.code = code ?? '';
        }
    }
    exports.LanguageModelError = LanguageModelError;
    //#endregion
    //#region ai
    var RelatedInformationType;
    (function (RelatedInformationType) {
        RelatedInformationType[RelatedInformationType["SymbolInformation"] = 1] = "SymbolInformation";
        RelatedInformationType[RelatedInformationType["CommandInformation"] = 2] = "CommandInformation";
        RelatedInformationType[RelatedInformationType["SearchInformation"] = 3] = "SearchInformation";
        RelatedInformationType[RelatedInformationType["SettingInformation"] = 4] = "SettingInformation";
    })(RelatedInformationType || (exports.RelatedInformationType = RelatedInformationType = {}));
    //#endregion
    //#region Speech
    var SpeechToTextStatus;
    (function (SpeechToTextStatus) {
        SpeechToTextStatus[SpeechToTextStatus["Started"] = 1] = "Started";
        SpeechToTextStatus[SpeechToTextStatus["Recognizing"] = 2] = "Recognizing";
        SpeechToTextStatus[SpeechToTextStatus["Recognized"] = 3] = "Recognized";
        SpeechToTextStatus[SpeechToTextStatus["Stopped"] = 4] = "Stopped";
    })(SpeechToTextStatus || (exports.SpeechToTextStatus = SpeechToTextStatus = {}));
    var KeywordRecognitionStatus;
    (function (KeywordRecognitionStatus) {
        KeywordRecognitionStatus[KeywordRecognitionStatus["Recognized"] = 1] = "Recognized";
        KeywordRecognitionStatus[KeywordRecognitionStatus["Stopped"] = 2] = "Stopped";
    })(KeywordRecognitionStatus || (exports.KeywordRecognitionStatus = KeywordRecognitionStatus = {}));
    //#endregion
    //#region InlineEdit
    class InlineEdit {
        constructor(text, range) {
            this.text = text;
            this.range = range;
        }
    }
    exports.InlineEdit = InlineEdit;
    var InlineEditTriggerKind;
    (function (InlineEditTriggerKind) {
        InlineEditTriggerKind[InlineEditTriggerKind["Invoke"] = 0] = "Invoke";
        InlineEditTriggerKind[InlineEditTriggerKind["Automatic"] = 1] = "Automatic";
    })(InlineEditTriggerKind || (exports.InlineEditTriggerKind = InlineEditTriggerKind = {}));
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFR5cGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0VHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7OztJQWd5RGhHLDhEQUVDO0lBcW1DRCwwQ0FFQztJQXFqQ0QsOERBWUM7SUFyN0hEOzs7OztTQUtLO0lBQ0wsU0FBUyxjQUFjLENBQUMsTUFBZ0I7UUFDdkMsTUFBTSxrQkFBa0IsR0FBRztZQUMxQixLQUFLLEVBQUUsVUFBVSxHQUFHLElBQVc7Z0JBQzlCLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDdkIsT0FBTyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDdEMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEQsT0FBTyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNqRSxDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksRUFBRSxVQUFVLEdBQUcsSUFBVztnQkFDN0IsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN2QixPQUFPLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxDQUFDLE9BQU8sRUFBRSxHQUFHLFFBQVEsQ0FBQyxHQUFHLElB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