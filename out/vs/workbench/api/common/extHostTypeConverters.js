/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/buffer", "vs/base/common/dataTransfer", "vs/base/common/functional", "vs/base/common/htmlContent", "vs/base/common/map", "vs/base/common/marked/marked", "vs/base/common/marshalling", "vs/base/common/mime", "vs/base/common/objects", "vs/base/common/prefixTree", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/platform/markers/common/markers", "vs/workbench/api/common/extHostTestingPrivateApi", "vs/workbench/common/editor", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "./extHostTypes"], function (require, exports, arrays_1, buffer_1, dataTransfer_1, functional_1, htmlContent, map_1, marked_1, marshalling_1, mime_1, objects_1, prefixTree_1, resources_1, types_1, uri_1, editorRange, languages, markers_1, extHostTestingPrivateApi_1, editor_1, chatAgents_1, notebooks, testId_1, testTypes_1, editorService_1, extensions_1, types) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugTreeItem = exports.PartialAcceptTriggerKind = exports.PartialAcceptInfo = exports.TerminalQuickFix = exports.ChatAgentUserActionEvent = exports.ChatAgentResult = exports.ChatAgentCompletionItem = exports.ChatAgentResolvedVariable = exports.ChatLocation = exports.ChatAgentRequest = exports.ChatResponseProgress = exports.ChatResponsePart = exports.ChatResponseReferencePart = exports.ChatResponseCommandButtonPart = exports.ChatResponseProgressPart = exports.ChatResponseAnchorPart = exports.ChatResponseFilesPart = exports.ChatResponseMarkdownPart = exports.InteractiveEditorResponseFeedbackKind = exports.ChatVariableLevel = exports.ChatVariable = exports.LanguageModelMessage = exports.ChatInlineFollowup = exports.ChatFollowup = exports.DataTransfer = exports.DataTransferItem = exports.ViewBadge = exports.TypeHierarchyItem = exports.CodeActionTriggerKind = exports.TestCoverage = exports.TestResults = exports.TestItem = exports.TestTag = exports.TestMessage = exports.NotebookRendererScript = exports.NotebookDocumentContentOptions = exports.NotebookKernelSourceAction = exports.NotebookStatusBarItem = exports.NotebookExclusiveDocumentPattern = exports.NotebookCellOutput = exports.NotebookCellOutputItem = exports.NotebookCellData = exports.NotebookData = exports.NotebookCellKind = exports.NotebookCellExecutionState = exports.NotebookCellExecutionSummary = exports.NotebookRange = exports.MappedEditsContext = exports.LanguageSelector = exports.GlobPattern = exports.TextEditorOpenOptions = exports.FoldingRangeKind = exports.FoldingRange = exports.ProgressLocation = exports.EndOfLine = exports.TextEditorLineNumbersStyle = exports.TextDocumentSaveReason = exports.SelectionRange = exports.Color = exports.ColorPresentation = exports.DocumentLink = exports.InlayHintKind = exports.InlayHintLabelPart = exports.InlayHint = exports.SignatureHelp = exports.SignatureInformation = exports.ParameterInformation = exports.CompletionItem = exports.CompletionItemKind = exports.CompletionItemTag = exports.CompletionContext = exports.CompletionTriggerKind = exports.MultiDocumentHighlight = exports.DocumentHighlight = exports.InlineValueContext = exports.InlineValue = exports.EvaluatableExpression = exports.Hover = exports.DefinitionLink = exports.location = exports.CallHierarchyOutgoingCall = exports.CallHierarchyIncomingCall = exports.CallHierarchyItem = exports.DocumentSymbol = exports.WorkspaceSymbol = exports.SymbolTag = exports.SymbolKind = exports.WorkspaceEdit = exports.TextEdit = exports.DecorationRenderOptions = exports.DecorationRangeBehavior = exports.ThemableDecorationRenderOptions = exports.ThemableDecorationAttachmentRenderOptions = exports.MarkdownString = exports.ViewColumn = exports.DiagnosticSeverity = exports.DiagnosticRelatedInformation = exports.Diagnostic = exports.DiagnosticTag = exports.DocumentSelector = exports.Position = exports.TokenType = exports.Location = exports.Range = exports.Selection = void 0;
    exports.isDecorationOptionsArr = isDecorationOptionsArr;
    exports.fromRangeOrRangeWithMessage = fromRangeOrRangeWithMessage;
    exports.pathOrURIToURI = pathOrURIToURI;
    var Selection;
    (function (Selection) {
        function to(selection) {
            const { selectionStartLineNumber, selectionStartColumn, positionLineNumber, positionColumn } = selection;
            const start = new types.Position(selectionStartLineNumber - 1, selectionStartColumn - 1);
            const end = new types.Position(positionLineNumber - 1, positionColumn - 1);
            return new types.Selection(start, end);
        }
        Selection.to = to;
        function from(selection) {
            const { anchor, active } = selection;
            return {
                selectionStartLineNumber: anchor.line + 1,
                selectionStartColumn: anchor.character + 1,
                positionLineNumber: active.line + 1,
                positionColumn: active.character + 1
            };
        }
        Selection.from = from;
    })(Selection || (exports.Selection = Selection = {}));
    var Range;
    (function (Range) {
        function from(range) {
            if (!range) {
                return undefined;
            }
            const { start, end } = range;
            return {
                startLineNumber: start.line + 1,
                startColumn: start.character + 1,
                endLineNumber: end.line + 1,
                endColumn: end.character + 1
            };
        }
        Range.from = from;
        function to(range) {
            if (!range) {
                return undefined;
            }
            const { startLineNumber, startColumn, endLineNumber, endColumn } = range;
            return new types.Range(startLineNumber - 1, startColumn - 1, endLineNumber - 1, endColumn - 1);
        }
        Range.to = to;
    })(Range || (exports.Range = Range = {}));
    var Location;
    (function (Location) {
        function from(location) {
            return {
                uri: location.uri,
                range: Range.from(location.range)
            };
        }
        Location.from = from;
        function to(location) {
            return new types.Location(uri_1.URI.revive(location.uri), Range.to(location.range));
        }
        Location.to = to;
    })(Location || (exports.Location = Location = {}));
    var TokenType;
    (function (TokenType) {
        function to(type) {
            switch (type) {
                case 1 /* encodedTokenAttributes.StandardTokenType.Comment */: return types.StandardTokenType.Comment;
                case 0 /* encodedTokenAttributes.StandardTokenType.Other */: return types.StandardTokenType.Other;
                case 3 /* encodedTokenAttributes.StandardTokenType.RegEx */: return types.StandardTokenType.RegEx;
                case 2 /* encodedTokenAttributes.StandardTokenType.String */: return types.StandardTokenType.String;
            }
        }
        TokenType.to = to;
    })(TokenType || (exports.TokenType = TokenType = {}));
    var Position;
    (function (Position) {
        function to(position) {
            return new types.Position(position.lineNumber - 1, position.column - 1);
        }
        Position.to = to;
        function from(position) {
            return { lineNumber: position.line + 1, column: position.character + 1 };
        }
        Position.from = from;
    })(Position || (exports.Position = Position = {}));
    var DocumentSelector;
    (function (DocumentSelector) {
        function from(value, uriTransformer, extension) {
            return (0, arrays_1.coalesce)((0, arrays_1.asArray)(value).map(sel => _doTransformDocumentSelector(sel, uriTransformer, extension)));
        }
        DocumentSelector.from = from;
        function _doTransformDocumentSelector(selector, uriTransformer, extension) {
            if (typeof selector === 'string') {
                return {
                    $serialized: true,
                    language: selector,
                    isBuiltin: extension?.isBuiltin,
                };
            }
            if (selector) {
                return {
                    $serialized: true,
                    language: selector.language,
                    scheme: _transformScheme(selector.scheme, uriTransformer),
                    pattern: GlobPattern.from(selector.pattern) ?? undefined,
                    exclusive: selector.exclusive,
                    notebookType: selector.notebookType,
                    isBuiltin: extension?.isBuiltin
                };
            }
            return undefined;
        }
        function _transformScheme(scheme, uriTransformer) {
            if (uriTransformer && typeof scheme === 'string') {
                return uriTransformer.transformOutgoingScheme(scheme);
            }
            return scheme;
        }
    })(DocumentSelector || (exports.DocumentSelector = DocumentSelector = {}));
    var DiagnosticTag;
    (function (DiagnosticTag) {
        function from(value) {
            switch (value) {
                case types.DiagnosticTag.Unnecessary:
                    return 1 /* MarkerTag.Unnecessary */;
                case types.DiagnosticTag.Deprecated:
                    return 2 /* MarkerTag.Deprecated */;
            }
            return undefined;
        }
        DiagnosticTag.from = from;
        function to(value) {
            switch (value) {
                case 1 /* MarkerTag.Unnecessary */:
                    return types.DiagnosticTag.Unnecessary;
                case 2 /* MarkerTag.Deprecated */:
                    return types.DiagnosticTag.Deprecated;
                default:
                    return undefined;
            }
        }
        DiagnosticTag.to = to;
    })(DiagnosticTag || (exports.DiagnosticTag = DiagnosticTag = {}));
    var Diagnostic;
    (function (Diagnostic) {
        function from(value) {
            let code;
            if (value.code) {
                if ((0, types_1.isString)(value.code) || (0, types_1.isNumber)(value.code)) {
                    code = String(value.code);
                }
                else {
                    code = {
                        value: String(value.code.value),
                        target: value.code.target,
                    };
                }
            }
            return {
                ...Range.from(value.range),
                message: value.message,
                source: value.source,
                code,
                severity: DiagnosticSeverity.from(value.severity),
                relatedInformation: value.relatedInformation && value.relatedInformation.map(DiagnosticRelatedInformation.from),
                tags: Array.isArray(value.tags) ? (0, arrays_1.coalesce)(value.tags.map(DiagnosticTag.from)) : undefined,
            };
        }
        Diagnostic.from = from;
        function to(value) {
            const res = new types.Diagnostic(Range.to(value), value.message, DiagnosticSeverity.to(value.severity));
            res.source = value.source;
            res.code = (0, types_1.isString)(value.code) ? value.code : value.code?.value;
            res.relatedInformation = value.relatedInformation && value.relatedInformation.map(DiagnosticRelatedInformation.to);
            res.tags = value.tags && (0, arrays_1.coalesce)(value.tags.map(DiagnosticTag.to));
            return res;
        }
        Diagnostic.to = to;
    })(Diagnostic || (exports.Diagnostic = Diagnostic = {}));
    var DiagnosticRelatedInformation;
    (function (DiagnosticRelatedInformation) {
        function from(value) {
            return {
                ...Range.from(value.location.range),
                message: value.message,
                resource: value.location.uri
            };
        }
        DiagnosticRelatedInformation.from = from;
        function to(value) {
            return new types.DiagnosticRelatedInformation(new types.Location(value.resource, Range.to(value)), value.message);
        }
        DiagnosticRelatedInformation.to = to;
    })(DiagnosticRelatedInformation || (exports.DiagnosticRelatedInformation = DiagnosticRelatedInformation = {}));
    var DiagnosticSeverity;
    (function (DiagnosticSeverity) {
        function from(value) {
            switch (value) {
                case types.DiagnosticSeverity.Error:
                    return markers_1.MarkerSeverity.Error;
                case types.DiagnosticSeverity.Warning:
                    return markers_1.MarkerSeverity.Warning;
                case types.DiagnosticSeverity.Information:
                    return markers_1.MarkerSeverity.Info;
                case types.DiagnosticSeverity.Hint:
                    return markers_1.MarkerSeverity.Hint;
            }
            return markers_1.MarkerSeverity.Error;
        }
        DiagnosticSeverity.from = from;
        function to(value) {
            switch (value) {
                case markers_1.MarkerSeverity.Info:
                    return types.DiagnosticSeverity.Information;
                case markers_1.MarkerSeverity.Warning:
                    return types.DiagnosticSeverity.Warning;
                case markers_1.MarkerSeverity.Error:
                    return types.DiagnosticSeverity.Error;
                case markers_1.MarkerSeverity.Hint:
                    return types.DiagnosticSeverity.Hint;
                default:
                    return types.DiagnosticSeverity.Error;
            }
        }
        DiagnosticSeverity.to = to;
    })(DiagnosticSeverity || (exports.DiagnosticSeverity = DiagnosticSeverity = {}));
    var ViewColumn;
    (function (ViewColumn) {
        function from(column) {
            if (typeof column === 'number' && column >= types.ViewColumn.One) {
                return column - 1; // adjust zero index (ViewColumn.ONE => 0)
            }
            if (column === types.ViewColumn.Beside) {
                return editorService_1.SIDE_GROUP;
            }
            return editorService_1.ACTIVE_GROUP; // default is always the active group
        }
        ViewColumn.from = from;
        function to(position) {
            if (typeof position === 'number' && position >= 0) {
                return position + 1; // adjust to index (ViewColumn.ONE => 1)
            }
            throw new Error(`invalid 'EditorGroupColumn'`);
        }
        ViewColumn.to = to;
    })(ViewColumn || (exports.ViewColumn = ViewColumn = {}));
    function isDecorationOptions(something) {
        return (typeof something.range !== 'undefined');
    }
    function isDecorationOptionsArr(something) {
        if (something.length === 0) {
            return true;
        }
        return isDecorationOptions(something[0]) ? true : false;
    }
    var MarkdownString;
    (function (MarkdownString) {
        function fromMany(markup) {
            return markup.map(MarkdownString.from);
        }
        MarkdownString.fromMany = fromMany;
        function isCodeblock(thing) {
            return thing && typeof thing === 'object'
                && typeof thing.language === 'string'
                && typeof thing.value === 'string';
        }
        function from(markup) {
            let res;
            if (isCodeblock(markup)) {
                const { language, value } = markup;
                res = { value: '```' + language + '\n' + value + '\n```\n' };
            }
            else if (types.MarkdownString.isMarkdownString(markup)) {
                res = { value: markup.value, isTrusted: markup.isTrusted, supportThemeIcons: markup.supportThemeIcons, supportHtml: markup.supportHtml, baseUri: markup.baseUri };
            }
            else if (typeof markup === 'string') {
                res = { value: markup };
            }
            else {
                res = { value: '' };
            }
            // extract uris into a separate object
            const resUris = Object.create(null);
            res.uris = resUris;
            const collectUri = (href) => {
                try {
                    let uri = uri_1.URI.parse(href, true);
                    uri = uri.with({ query: _uriMassage(uri.query, resUris) });
                    resUris[href] = uri;
                }
                catch (e) {
                    // ignore
                }
                return '';
            };
            const renderer = new marked_1.marked.Renderer();
            renderer.link = collectUri;
            renderer.image = href => typeof href === 'string' ? collectUri(htmlContent.parseHrefAndDimensions(href).href) : '';
            (0, marked_1.marked)(res.value, { renderer });
            return res;
        }
        MarkdownString.from = from;
        function _uriMassage(part, bucket) {
            if (!part) {
                return part;
            }
            let data;
            try {
                data = (0, marshalling_1.parse)(part);
            }
            catch (e) {
                // ignore
            }
            if (!data) {
                return part;
            }
            let changed = false;
            data = (0, objects_1.cloneAndChange)(data, value => {
                if (uri_1.URI.isUri(value)) {
                    const key = `__uri_${Math.random().toString(16).slice(2, 8)}`;
                    bucket[key] = value;
                    changed = true;
                    return key;
                }
                else {
                    return undefined;
                }
            });
            if (!changed) {
                return part;
            }
            return JSON.stringify(data);
        }
        function to(value) {
            const result = new types.MarkdownString(value.value, value.supportThemeIcons);
            result.isTrusted = value.isTrusted;
            result.supportHtml = value.supportHtml;
            result.baseUri = value.baseUri ? uri_1.URI.from(value.baseUri) : undefined;
            return result;
        }
        MarkdownString.to = to;
        function fromStrict(value) {
            if (!value) {
                return undefined;
            }
            return typeof value === 'string' ? value : MarkdownString.from(value);
        }
        MarkdownString.fromStrict = fromStrict;
    })(MarkdownString || (exports.MarkdownString = MarkdownString = {}));
    function fromRangeOrRangeWithMessage(ranges) {
        if (isDecorationOptionsArr(ranges)) {
            return ranges.map((r) => {
                return {
                    range: Range.from(r.range),
                    hoverMessage: Array.isArray(r.hoverMessage)
                        ? MarkdownString.fromMany(r.hoverMessage)
                        : (r.hoverMessage ? MarkdownString.from(r.hoverMessage) : undefined),
                    renderOptions: /* URI vs Uri */ r.renderOptions
                };
            });
        }
        else {
            return ranges.map((r) => {
                return {
                    range: Range.from(r)
                };
            });
        }
    }
    function pathOrURIToURI(value) {
        if (typeof value === 'undefined') {
            return value;
        }
        if (typeof value === 'string') {
            return uri_1.URI.file(value);
        }
        else {
            return value;
        }
    }
    var ThemableDecorationAttachmentRenderOptions;
    (function (ThemableDecorationAttachmentRenderOptions) {
        function from(options) {
            if (typeof options === 'undefined') {
                return options;
            }
            return {
                contentText: options.contentText,
                contentIconPath: options.contentIconPath ? pathOrURIToURI(options.contentIconPath) : undefined,
                border: options.border,
                borderColor: options.borderColor,
                fontStyle: options.fontStyle,
                fontWeight: options.fontWeight,
                textDecoration: options.textDecoration,
                color: options.color,
                backgroundColor: options.backgroundColor,
                margin: options.margin,
                width: options.width,
                height: options.height,
            };
        }
        ThemableDecorationAttachmentRenderOptions.from = from;
    })(ThemableDecorationAttachmentRenderOptions || (exports.ThemableDecorationAttachmentRenderOptions = ThemableDecorationAttachmentRenderOptions = {}));
    var ThemableDecorationRenderOptions;
    (function (ThemableDecorationRenderOptions) {
        function from(options) {
            if (typeof options === 'undefined') {
                return options;
            }
            return {
                backgroundColor: options.backgroundColor,
                outline: options.outline,
                outlineColor: options.outlineColor,
                outlineStyle: options.outlineStyle,
                outlineWidth: options.outlineWidth,
                border: options.border,
                borderColor: options.borderColor,
                borderRadius: options.borderRadius,
                borderSpacing: options.borderSpacing,
                borderStyle: options.borderStyle,
                borderWidth: options.borderWidth,
                fontStyle: options.fontStyle,
                fontWeight: options.fontWeight,
                textDecoration: options.textDecoration,
                cursor: options.cursor,
                color: options.color,
                opacity: options.opacity,
                letterSpacing: options.letterSpacing,
                gutterIconPath: options.gutterIconPath ? pathOrURIToURI(options.gutterIconPath) : undefined,
                gutterIconSize: options.gutterIconSize,
                overviewRulerColor: options.overviewRulerColor,
                before: options.before ? ThemableDecorationAttachmentRenderOptions.from(options.before) : undefined,
                after: options.after ? ThemableDecorationAttachmentRenderOptions.from(options.after) : undefined,
            };
        }
        ThemableDecorationRenderOptions.from = from;
    })(ThemableDecorationRenderOptions || (exports.ThemableDecorationRenderOptions = ThemableDecorationRenderOptions = {}));
    var DecorationRangeBehavior;
    (function (DecorationRangeBehavior) {
        function from(value) {
            if (typeof value === 'undefined') {
                return value;
            }
            switch (value) {
                case types.DecorationRangeBehavior.OpenOpen:
                    return 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */;
                case types.DecorationRangeBehavior.ClosedClosed:
                    return 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */;
                case types.DecorationRangeBehavior.OpenClosed:
                    return 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */;
                case types.DecorationRangeBehavior.ClosedOpen:
                    return 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */;
            }
        }
        DecorationRangeBehavior.from = from;
    })(DecorationRangeBehavior || (exports.DecorationRangeBehavior = DecorationRangeBehavior = {}));
    var DecorationRenderOptions;
    (function (DecorationRenderOptions) {
        function from(options) {
            return {
                isWholeLine: options.isWholeLine,
                rangeBehavior: options.rangeBehavior ? DecorationRangeBehavior.from(options.rangeBehavior) : undefined,
                overviewRulerLane: options.overviewRulerLane,
                light: options.light ? ThemableDecorationRenderOptions.from(options.light) : undefined,
                dark: options.dark ? ThemableDecorationRenderOptions.from(options.dark) : undefined,
                backgroundColor: options.backgroundColor,
                outline: options.outline,
                outlineColor: options.outlineColor,
                outlineStyle: options.outlineStyle,
                outlineWidth: options.outlineWidth,
                border: options.border,
                borderColor: options.borderColor,
                borderRadius: options.borderRadius,
                borderSpacing: options.borderSpacing,
                borderStyle: options.borderStyle,
                borderWidth: options.borderWidth,
                fontStyle: options.fontStyle,
                fontWeight: options.fontWeight,
                textDecoration: options.textDecoration,
                cursor: options.cursor,
                color: options.color,
                opacity: options.opacity,
                letterSpacing: options.letterSpacing,
                gutterIconPath: options.gutterIconPath ? pathOrURIToURI(options.gutterIconPath) : undefined,
                gutterIconSize: options.gutterIconSize,
                overviewRulerColor: options.overviewRulerColor,
                before: options.before ? ThemableDecorationAttachmentRenderOptions.from(options.before) : undefined,
                after: options.after ? ThemableDecorationAttachmentRenderOptions.from(options.after) : undefined,
            };
        }
        DecorationRenderOptions.from = from;
    })(DecorationRenderOptions || (exports.DecorationRenderOptions = DecorationRenderOptions = {}));
    var TextEdit;
    (function (TextEdit) {
        function from(edit) {
            return {
                text: edit.newText,
                eol: edit.newEol && EndOfLine.from(edit.newEol),
                range: Range.from(edit.range)
            };
        }
        TextEdit.from = from;
        function to(edit) {
            const result = new types.TextEdit(Range.to(edit.range), edit.text);
            result.newEol = (typeof edit.eol === 'undefined' ? undefined : EndOfLine.to(edit.eol));
            return result;
        }
        TextEdit.to = to;
    })(TextEdit || (exports.TextEdit = TextEdit = {}));
    var WorkspaceEdit;
    (function (WorkspaceEdit) {
        function from(value, versionInfo) {
            const result = {
                edits: []
            };
            if (value instanceof types.WorkspaceEdit) {
                // collect all files that are to be created so that their version
                // information (in case they exist as text model already) can be ignored
                const toCreate = new map_1.ResourceSet();
                for (const entry of value._allEntries()) {
                    if (entry._type === 1 /* types.FileEditType.File */ && uri_1.URI.isUri(entry.to) && entry.from === undefined) {
                        toCreate.add(entry.to);
                    }
                }
                for (const entry of value._allEntries()) {
                    if (entry._type === 1 /* types.FileEditType.File */) {
                        let contents;
                        if (entry.options?.contents) {
                            if (ArrayBuffer.isView(entry.options.contents)) {
                                contents = { type: 'base64', value: (0, buffer_1.encodeBase64)(buffer_1.VSBuffer.wrap(entry.options.contents)) };
                            }
                            else {
                                contents = { type: 'dataTransferItem', id: entry.options.contents._itemId };
                            }
                        }
                        // file operation
                        result.edits.push({
                            oldResource: entry.from,
                            newResource: entry.to,
                            options: { ...entry.options, contents },
                            metadata: entry.metadata
                        });
                    }
                    else if (entry._type === 2 /* types.FileEditType.Text */) {
                        // text edits
                        result.edits.push({
                            resource: entry.uri,
                            textEdit: TextEdit.from(entry.edit),
                            versionId: !toCreate.has(entry.uri) ? versionInfo?.getTextDocumentVersion(entry.uri) : undefined,
                            metadata: entry.metadata
                        });
                    }
                    else if (entry._type === 6 /* types.FileEditType.Snippet */) {
                        result.edits.push({
                            resource: entry.uri,
                            textEdit: {
                                range: Range.from(entry.range),
                                text: entry.edit.value,
                                insertAsSnippet: true
                            },
                            versionId: !toCreate.has(entry.uri) ? versionInfo?.getTextDocumentVersion(entry.uri) : undefined,
                            metadata: entry.metadata
                        });
                    }
                    else if (entry._type === 3 /* types.FileEditType.Cell */) {
                        // cell edit
                        result.edits.push({
                            metadata: entry.metadata,
                            resource: entry.uri,
                            cellEdit: entry.edit,
                            notebookMetadata: entry.notebookMetadata,
                            notebookVersionId: versionInfo?.getNotebookDocumentVersion(entry.uri)
                        });
                    }
                    else if (entry._type === 5 /* types.FileEditType.CellReplace */) {
                        // cell replace
                        result.edits.push({
                            metadata: entry.metadata,
                            resource: entry.uri,
                            notebookVersionId: versionInfo?.getNotebookDocumentVersion(entry.uri),
                            cellEdit: {
                                editType: 1 /* notebooks.CellEditType.Replace */,
                                index: entry.index,
                                count: entry.count,
                                cells: entry.cells.map(NotebookCellData.from)
                            }
                        });
                    }
                }
            }
            return result;
        }
        WorkspaceEdit.from = from;
        function to(value) {
            const result = new types.WorkspaceEdit();
            const edits = new map_1.ResourceMap();
            for (const edit of value.edits) {
                if (edit.textEdit) {
                    const item = edit;
                    const uri = uri_1.URI.revive(item.resource);
                    const range = Range.to(item.textEdit.range);
                    const text = item.textEdit.text;
                    const isSnippet = item.textEdit.insertAsSnippet;
                    let editOrSnippetTest;
                    if (isSnippet) {
                        editOrSnippetTest = types.SnippetTextEdit.replace(range, new types.SnippetString(text));
                    }
                    else {
                        editOrSnippetTest = types.TextEdit.replace(range, text);
                    }
                    const array = edits.get(uri);
                    if (!array) {
                        edits.set(uri, [editOrSnippetTest]);
                    }
                    else {
                        array.push(editOrSnippetTest);
                    }
                }
                else {
                    result.renameFile(uri_1.URI.revive(edit.oldResource), uri_1.URI.revive(edit.newResource), edit.options);
                }
            }
            for (const [uri, array] of edits) {
                result.set(uri, array);
            }
            return result;
        }
        WorkspaceEdit.to = to;
    })(WorkspaceEdit || (exports.WorkspaceEdit = WorkspaceEdit = {}));
    var SymbolKind;
    (function (SymbolKind) {
        const _fromMapping = Object.create(null);
        _fromMapping[types.SymbolKind.File] = 0 /* languages.SymbolKind.File */;
        _fromMapping[types.SymbolKind.Module] = 1 /* languages.SymbolKind.Module */;
        _fromMapping[types.SymbolKind.Namespace] = 2 /* languages.SymbolKind.Namespace */;
        _fromMapping[types.SymbolKind.Package] = 3 /* languages.SymbolKind.Package */;
        _fromMapping[types.SymbolKind.Class] = 4 /* languages.SymbolKind.Class */;
        _fromMapping[types.SymbolKind.Method] = 5 /* languages.SymbolKind.Method */;
        _fromMapping[types.SymbolKind.Property] = 6 /* languages.SymbolKind.Property */;
        _fromMapping[types.SymbolKind.Field] = 7 /* languages.SymbolKind.Field */;
        _fromMapping[types.SymbolKind.Constructor] = 8 /* languages.SymbolKind.Constructor */;
        _fromMapping[types.SymbolKind.Enum] = 9 /* languages.SymbolKind.Enum */;
        _fromMapping[types.SymbolKind.Interface] = 10 /* languages.SymbolKind.Interface */;
        _fromMapping[types.SymbolKind.Function] = 11 /* languages.SymbolKind.Function */;
        _fromMapping[types.SymbolKind.Variable] = 12 /* languages.SymbolKind.Variable */;
        _fromMapping[types.SymbolKind.Constant] = 13 /* languages.SymbolKind.Constant */;
        _fromMapping[types.SymbolKind.String] = 14 /* languages.SymbolKind.String */;
        _fromMapping[types.SymbolKind.Number] = 15 /* languages.SymbolKind.Number */;
        _fromMapping[types.SymbolKind.Boolean] = 16 /* languages.SymbolKind.Boolean */;
        _fromMapping[types.SymbolKind.Array] = 17 /* languages.SymbolKind.Array */;
        _fromMapping[types.SymbolKind.Object] = 18 /* languages.SymbolKind.Object */;
        _fromMapping[types.SymbolKind.Key] = 19 /* languages.SymbolKind.Key */;
        _fromMapping[types.SymbolKind.Null] = 20 /* languages.SymbolKind.Null */;
        _fromMapping[types.SymbolKind.EnumMember] = 21 /* languages.SymbolKind.EnumMember */;
        _fromMapping[types.SymbolKind.Struct] = 22 /* languages.SymbolKind.Struct */;
        _fromMapping[types.SymbolKind.Event] = 23 /* languages.SymbolKind.Event */;
        _fromMapping[types.SymbolKind.Operator] = 24 /* languages.SymbolKind.Operator */;
        _fromMapping[types.SymbolKind.TypeParameter] = 25 /* languages.SymbolKind.TypeParameter */;
        function from(kind) {
            return typeof _fromMapping[kind] === 'number' ? _fromMapping[kind] : 6 /* languages.SymbolKind.Property */;
        }
        SymbolKind.from = from;
        function to(kind) {
            for (const k in _fromMapping) {
                if (_fromMapping[k] === kind) {
                    return Number(k);
                }
            }
            return types.SymbolKind.Property;
        }
        SymbolKind.to = to;
    })(SymbolKind || (exports.SymbolKind = SymbolKind = {}));
    var SymbolTag;
    (function (SymbolTag) {
        function from(kind) {
            switch (kind) {
                case types.SymbolTag.Deprecated: return 1 /* languages.SymbolTag.Deprecated */;
            }
        }
        SymbolTag.from = from;
        function to(kind) {
            switch (kind) {
                case 1 /* languages.SymbolTag.Deprecated */: return types.SymbolTag.Deprecated;
            }
        }
        SymbolTag.to = to;
    })(SymbolTag || (exports.SymbolTag = SymbolTag = {}));
    var WorkspaceSymbol;
    (function (WorkspaceSymbol) {
        function from(info) {
            return {
                name: info.name,
                kind: SymbolKind.from(info.kind),
                tags: info.tags && info.tags.map(SymbolTag.from),
                containerName: info.containerName,
                location: location.from(info.location)
            };
        }
        WorkspaceSymbol.from = from;
        function to(info) {
            const result = new types.SymbolInformation(info.name, SymbolKind.to(info.kind), info.containerName, location.to(info.location));
            result.tags = info.tags && info.tags.map(SymbolTag.to);
            return result;
        }
        WorkspaceSymbol.to = to;
    })(WorkspaceSymbol || (exports.WorkspaceSymbol = WorkspaceSymbol = {}));
    var DocumentSymbol;
    (function (DocumentSymbol) {
        function from(info) {
            const result = {
                name: info.name || '!!MISSING: name!!',
                detail: info.detail,
                range: Range.from(info.range),
                selectionRange: Range.from(info.selectionRange),
                kind: SymbolKind.from(info.kind),
                tags: info.tags?.map(SymbolTag.from) ?? []
            };
            if (info.children) {
                result.children = info.children.map(from);
            }
            return result;
        }
        DocumentSymbol.from = from;
        function to(info) {
            const result = new types.DocumentSymbol(info.name, info.detail, SymbolKind.to(info.kind), Range.to(info.range), Range.to(info.selectionRange));
            if ((0, arrays_1.isNonEmptyArray)(info.tags)) {
                result.tags = info.tags.map(SymbolTag.to);
            }
            if (info.children) {
                result.children = info.children.map(to);
            }
            return result;
        }
        DocumentSymbol.to = to;
    })(DocumentSymbol || (exports.DocumentSymbol = DocumentSymbol = {}));
    var CallHierarchyItem;
    (function (CallHierarchyItem) {
        function to(item) {
            const result = new types.CallHierarchyItem(SymbolKind.to(item.kind), item.name, item.detail || '', uri_1.URI.revive(item.uri), Range.to(item.range), Range.to(item.selectionRange));
            result._sessionId = item._sessionId;
            result._itemId = item._itemId;
            return result;
        }
        CallHierarchyItem.to = to;
        function from(item, sessionId, itemId) {
            sessionId = sessionId ?? item._sessionId;
            itemId = itemId ?? item._itemId;
            if (sessionId === undefined || itemId === undefined) {
                throw new Error('invalid item');
            }
            return {
                _sessionId: sessionId,
                _itemId: itemId,
                name: item.name,
                detail: item.detail,
                kind: SymbolKind.from(item.kind),
                uri: item.uri,
                range: Range.from(item.range),
                selectionRange: Range.from(item.selectionRange),
                tags: item.tags?.map(SymbolTag.from)
            };
        }
        CallHierarchyItem.from = from;
    })(CallHierarchyItem || (exports.CallHierarchyItem = CallHierarchyItem = {}));
    var CallHierarchyIncomingCall;
    (function (CallHierarchyIncomingCall) {
        function to(item) {
            return new types.CallHierarchyIncomingCall(CallHierarchyItem.to(item.from), item.fromRanges.map(r => Range.to(r)));
        }
        CallHierarchyIncomingCall.to = to;
    })(CallHierarchyIncomingCall || (exports.CallHierarchyIncomingCall = CallHierarchyIncomingCall = {}));
    var CallHierarchyOutgoingCall;
    (function (CallHierarchyOutgoingCall) {
        function to(item) {
            return new types.CallHierarchyOutgoingCall(CallHierarchyItem.to(item.to), item.fromRanges.map(r => Range.to(r)));
        }
        CallHierarchyOutgoingCall.to = to;
    })(CallHierarchyOutgoingCall || (exports.CallHierarchyOutgoingCall = CallHierarchyOutgoingCall = {}));
    var location;
    (function (location) {
        function from(value) {
            return {
                range: value.range && Range.from(value.range),
                uri: value.uri
            };
        }
        location.from = from;
        function to(value) {
            return new types.Location(uri_1.URI.revive(value.uri), Range.to(value.range));
        }
        location.to = to;
    })(location || (exports.location = location = {}));
    var DefinitionLink;
    (function (DefinitionLink) {
        function from(value) {
            const definitionLink = value;
            const location = value;
            return {
                originSelectionRange: definitionLink.originSelectionRange
                    ? Range.from(definitionLink.originSelectionRange)
                    : undefined,
                uri: definitionLink.targetUri ? definitionLink.targetUri : location.uri,
                range: Range.from(definitionLink.targetRange ? definitionLink.targetRange : location.range),
                targetSelectionRange: definitionLink.targetSelectionRange
                    ? Range.from(definitionLink.targetSelectionRange)
                    : undefined,
            };
        }
        DefinitionLink.from = from;
        function to(value) {
            return {
                targetUri: uri_1.URI.revive(value.uri),
                targetRange: Range.to(value.range),
                targetSelectionRange: value.targetSelectionRange
                    ? Range.to(value.targetSelectionRange)
                    : undefined,
                originSelectionRange: value.originSelectionRange
                    ? Range.to(value.originSelectionRange)
                    : undefined
            };
        }
        DefinitionLink.to = to;
    })(DefinitionLink || (exports.DefinitionLink = DefinitionLink = {}));
    var Hover;
    (function (Hover) {
        function from(hover) {
            return {
                range: Range.from(hover.range),
                contents: MarkdownString.fromMany(hover.contents)
            };
        }
        Hover.from = from;
        function to(info) {
            return new types.Hover(info.contents.map(MarkdownString.to), Range.to(info.range));
        }
        Hover.to = to;
    })(Hover || (exports.Hover = Hover = {}));
    var EvaluatableExpression;
    (function (EvaluatableExpression) {
        function from(expression) {
            return {
                range: Range.from(expression.range),
                expression: expression.expression
            };
        }
        EvaluatableExpression.from = from;
        function to(info) {
            return new types.EvaluatableExpression(Range.to(info.range), info.expression);
        }
        EvaluatableExpression.to = to;
    })(EvaluatableExpression || (exports.EvaluatableExpression = EvaluatableExpression = {}));
    var InlineValue;
    (function (InlineValue) {
        function from(inlineValue) {
            if (inlineValue instanceof types.InlineValueText) {
                return {
                    type: 'text',
                    range: Range.from(inlineValue.range),
                    text: inlineValue.text
                };
            }
            else if (inlineValue instanceof types.InlineValueVariableLookup) {
                return {
                    type: 'variable',
                    range: Range.from(inlineValue.range),
                    variableName: inlineValue.variableName,
                    caseSensitiveLookup: inlineValue.caseSensitiveLookup
                };
            }
            else if (inlineValue instanceof types.InlineValueEvaluatableExpression) {
                return {
                    type: 'expression',
                    range: Range.from(inlineValue.range),
                    expression: inlineValue.expression
                };
            }
            else {
                throw new Error(`Unknown 'InlineValue' type`);
            }
        }
        InlineValue.from = from;
        function to(inlineValue) {
            switch (inlineValue.type) {
                case 'text':
                    return {
                        range: Range.to(inlineValue.range),
                        text: inlineValue.text
                    };
                case 'variable':
                    return {
                        range: Range.to(inlineValue.range),
                        variableName: inlineValue.variableName,
                        caseSensitiveLookup: inlineValue.caseSensitiveLookup
                    };
                case 'expression':
                    return {
                        range: Range.to(inlineValue.range),
                        expression: inlineValue.expression
                    };
            }
        }
        InlineValue.to = to;
    })(InlineValue || (exports.InlineValue = InlineValue = {}));
    var InlineValueContext;
    (function (InlineValueContext) {
        function from(inlineValueContext) {
            return {
                frameId: inlineValueContext.frameId,
                stoppedLocation: Range.from(inlineValueContext.stoppedLocation)
            };
        }
        InlineValueContext.from = from;
        function to(inlineValueContext) {
            return new types.InlineValueContext(inlineValueContext.frameId, Range.to(inlineValueContext.stoppedLocation));
        }
        InlineValueContext.to = to;
    })(InlineValueContext || (exports.InlineValueContext = InlineValueContext = {}));
    var DocumentHighlight;
    (function (DocumentHighlight) {
        function from(documentHighlight) {
            return {
                range: Range.from(documentHighlight.range),
                kind: documentHighlight.kind
            };
        }
        DocumentHighlight.from = from;
        function to(occurrence) {
            return new types.DocumentHighlight(Range.to(occurrence.range), occurrence.kind);
        }
        DocumentHighlight.to = to;
    })(DocumentHighlight || (exports.DocumentHighlight = DocumentHighlight = {}));
    var MultiDocumentHighlight;
    (function (MultiDocumentHighlight) {
        function from(multiDocumentHighlight) {
            return {
                uri: multiDocumentHighlight.uri,
                highlights: multiDocumentHighlight.highlights.map(DocumentHighlight.from)
            };
        }
        MultiDocumentHighlight.from = from;
        function to(multiDocumentHighlight) {
            return new types.MultiDocumentHighlight(uri_1.URI.revive(multiDocumentHighlight.uri), multiDocumentHighlight.highlights.map(DocumentHighlight.to));
        }
        MultiDocumentHighlight.to = to;
    })(MultiDocumentHighlight || (exports.MultiDocumentHighlight = MultiDocumentHighlight = {}));
    var CompletionTriggerKind;
    (function (CompletionTriggerKind) {
        function to(kind) {
            switch (kind) {
                case 1 /* languages.CompletionTriggerKind.TriggerCharacter */:
                    return types.CompletionTriggerKind.TriggerCharacter;
                case 2 /* languages.CompletionTriggerKind.TriggerForIncompleteCompletions */:
                    return types.CompletionTriggerKind.TriggerForIncompleteCompletions;
                case 0 /* languages.CompletionTriggerKind.Invoke */:
                default:
                    return types.CompletionTriggerKind.Invoke;
            }
        }
        CompletionTriggerKind.to = to;
    })(CompletionTriggerKind || (exports.CompletionTriggerKind = CompletionTriggerKind = {}));
    var CompletionContext;
    (function (CompletionContext) {
        function to(context) {
            return {
                triggerKind: CompletionTriggerKind.to(context.triggerKind),
                triggerCharacter: context.triggerCharacter
            };
        }
        CompletionContext.to = to;
    })(CompletionContext || (exports.CompletionContext = CompletionContext = {}));
    var CompletionItemTag;
    (function (CompletionItemTag) {
        function from(kind) {
            switch (kind) {
                case types.CompletionItemTag.Deprecated: return 1 /* languages.CompletionItemTag.Deprecated */;
            }
        }
        CompletionItemTag.from = from;
        function to(kind) {
            switch (kind) {
                case 1 /* languages.CompletionItemTag.Deprecated */: return types.CompletionItemTag.Deprecated;
            }
        }
        CompletionItemTag.to = to;
    })(CompletionItemTag || (exports.CompletionItemTag = CompletionItemTag = {}));
    var CompletionItemKind;
    (function (CompletionItemKind) {
        const _from = new Map([
            [types.CompletionItemKind.Method, 0 /* languages.CompletionItemKind.Method */],
            [types.CompletionItemKind.Function, 1 /* languages.CompletionItemKind.Function */],
            [types.CompletionItemKind.Constructor, 2 /* languages.CompletionItemKind.Constructor */],
            [types.CompletionItemKind.Field, 3 /* languages.CompletionItemKind.Field */],
            [types.CompletionItemKind.Variable, 4 /* languages.CompletionItemKind.Variable */],
            [types.CompletionItemKind.Class, 5 /* languages.CompletionItemKind.Class */],
            [types.CompletionItemKind.Interface, 7 /* languages.CompletionItemKind.Interface */],
            [types.CompletionItemKind.Struct, 6 /* languages.CompletionItemKind.Struct */],
            [types.CompletionItemKind.Module, 8 /* languages.CompletionItemKind.Module */],
            [types.CompletionItemKind.Property, 9 /* languages.CompletionItemKind.Property */],
            [types.CompletionItemKind.Unit, 12 /* languages.CompletionItemKind.Unit */],
            [types.CompletionItemKind.Value, 13 /* languages.CompletionItemKind.Value */],
            [types.CompletionItemKind.Constant, 14 /* languages.CompletionItemKind.Constant */],
            [types.CompletionItemKind.Enum, 15 /* languages.CompletionItemKind.Enum */],
            [types.CompletionItemKind.EnumMember, 16 /* languages.CompletionItemKind.EnumMember */],
            [types.CompletionItemKind.Keyword, 17 /* languages.CompletionItemKind.Keyword */],
            [types.CompletionItemKind.Snippet, 27 /* languages.CompletionItemKind.Snippet */],
            [types.CompletionItemKind.Text, 18 /* languages.CompletionItemKind.Text */],
            [types.CompletionItemKind.Color, 19 /* languages.CompletionItemKind.Color */],
            [types.CompletionItemKind.File, 20 /* languages.CompletionItemKind.File */],
            [types.CompletionItemKind.Reference, 21 /* languages.CompletionItemKind.Reference */],
            [types.CompletionItemKind.Folder, 23 /* languages.CompletionItemKind.Folder */],
            [types.CompletionItemKind.Event, 10 /* languages.CompletionItemKind.Event */],
            [types.CompletionItemKind.Operator, 11 /* languages.CompletionItemKind.Operator */],
            [types.CompletionItemKind.TypeParameter, 24 /* languages.CompletionItemKind.TypeParameter */],
            [types.CompletionItemKind.Issue, 26 /* languages.CompletionItemKind.Issue */],
            [types.CompletionItemKind.User, 25 /* languages.CompletionItemKind.User */],
        ]);
        function from(kind) {
            return _from.get(kind) ?? 9 /* languages.CompletionItemKind.Property */;
        }
        CompletionItemKind.from = from;
        const _to = new Map([
            [0 /* languages.CompletionItemKind.Method */, types.CompletionItemKind.Method],
            [1 /* languages.CompletionItemKind.Function */, types.CompletionItemKind.Function],
            [2 /* languages.CompletionItemKind.Constructor */, types.CompletionItemKind.Constructor],
            [3 /* languages.CompletionItemKind.Field */, types.CompletionItemKind.Field],
            [4 /* languages.CompletionItemKind.Variable */, types.CompletionItemKind.Variable],
            [5 /* languages.CompletionItemKind.Class */, types.CompletionItemKind.Class],
            [7 /* languages.CompletionItemKind.Interface */, types.CompletionItemKind.Interface],
            [6 /* languages.CompletionItemKind.Struct */, types.CompletionItemKind.Struct],
            [8 /* languages.CompletionItemKind.Module */, types.CompletionItemKind.Module],
            [9 /* languages.CompletionItemKind.Property */, types.CompletionItemKind.Property],
            [12 /* languages.CompletionItemKind.Unit */, types.CompletionItemKind.Unit],
            [13 /* languages.CompletionItemKind.Value */, types.CompletionItemKind.Value],
            [14 /* languages.CompletionItemKind.Constant */, types.CompletionItemKind.Constant],
            [15 /* languages.CompletionItemKind.Enum */, types.CompletionItemKind.Enum],
            [16 /* languages.CompletionItemKind.EnumMember */, types.CompletionItemKind.EnumMember],
            [17 /* languages.CompletionItemKind.Keyword */, types.CompletionItemKind.Keyword],
            [27 /* languages.CompletionItemKind.Snippet */, types.CompletionItemKind.Snippet],
            [18 /* languages.CompletionItemKind.Text */, types.CompletionItemKind.Text],
            [19 /* languages.CompletionItemKind.Color */, types.CompletionItemKind.Color],
            [20 /* languages.CompletionItemKind.File */, types.CompletionItemKind.File],
            [21 /* languages.CompletionItemKind.Reference */, types.CompletionItemKind.Reference],
            [23 /* languages.CompletionItemKind.Folder */, types.CompletionItemKind.Folder],
            [10 /* languages.CompletionItemKind.Event */, types.CompletionItemKind.Event],
            [11 /* languages.CompletionItemKind.Operator */, types.CompletionItemKind.Operator],
            [24 /* languages.CompletionItemKind.TypeParameter */, types.CompletionItemKind.TypeParameter],
            [25 /* languages.CompletionItemKind.User */, types.CompletionItemKind.User],
            [26 /* languages.CompletionItemKind.Issue */, types.CompletionItemKind.Issue],
        ]);
        function to(kind) {
            return _to.get(kind) ?? types.CompletionItemKind.Property;
        }
        CompletionItemKind.to = to;
    })(CompletionItemKind || (exports.CompletionItemKind = CompletionItemKind = {}));
    var CompletionItem;
    (function (CompletionItem) {
        function to(suggestion, converter) {
            const result = new types.CompletionItem(suggestion.label);
            result.insertText = suggestion.insertText;
            result.kind = CompletionItemKind.to(suggestion.kind);
            result.tags = suggestion.tags?.map(CompletionItemTag.to);
            result.detail = suggestion.detail;
            result.documentation = htmlContent.isMarkdownString(suggestion.documentation) ? MarkdownString.to(suggestion.documentation) : suggestion.documentation;
            result.sortText = suggestion.sortText;
            result.filterText = suggestion.filterText;
            result.preselect = suggestion.preselect;
            result.commitCharacters = suggestion.commitCharacters;
            // range
            if (editorRange.Range.isIRange(suggestion.range)) {
                result.range = Range.to(suggestion.range);
            }
            else if (typeof suggestion.range === 'object') {
                result.range = { inserting: Range.to(suggestion.range.insert), replacing: Range.to(suggestion.range.replace) };
            }
            result.keepWhitespace = typeof suggestion.insertTextRules === 'undefined' ? false : Boolean(suggestion.insertTextRules & 1 /* languages.CompletionItemInsertTextRule.KeepWhitespace */);
            // 'insertText'-logic
            if (typeof suggestion.insertTextRules !== 'undefined' && suggestion.insertTextRules & 4 /* languages.CompletionItemInsertTextRule.InsertAsSnippet */) {
                result.insertText = new types.SnippetString(suggestion.insertText);
            }
            else {
                result.insertText = suggestion.insertText;
                result.textEdit = result.range instanceof types.Range ? new types.TextEdit(result.range, result.insertText) : undefined;
            }
            if (suggestion.additionalTextEdits && suggestion.additionalTextEdits.length > 0) {
                result.additionalTextEdits = suggestion.additionalTextEdits.map(e => TextEdit.to(e));
            }
            result.command = converter && suggestion.command ? converter.fromInternal(suggestion.command) : undefined;
            return result;
        }
        CompletionItem.to = to;
    })(CompletionItem || (exports.CompletionItem = CompletionItem = {}));
    var ParameterInformation;
    (function (ParameterInformation) {
        function from(info) {
            if (typeof info.label !== 'string' && !Array.isArray(info.label)) {
                throw new TypeError('Invalid label');
            }
            return {
                label: info.label,
                documentation: MarkdownString.fromStrict(info.documentation)
            };
        }
        ParameterInformation.from = from;
        function to(info) {
            return {
                label: info.label,
                documentation: htmlContent.isMarkdownString(info.documentation) ? MarkdownString.to(info.documentation) : info.documentation
            };
        }
        ParameterInformation.to = to;
    })(ParameterInformation || (exports.ParameterInformation = ParameterInformation = {}));
    var SignatureInformation;
    (function (SignatureInformation) {
        function from(info) {
            return {
                label: info.label,
                documentation: MarkdownString.fromStrict(info.documentation),
                parameters: Array.isArray(info.parameters) ? info.parameters.map(ParameterInformation.from) : [],
                activeParameter: info.activeParameter,
            };
        }
        SignatureInformation.from = from;
        function to(info) {
            return {
                label: info.label,
                documentation: htmlContent.isMarkdownString(info.documentation) ? MarkdownString.to(info.documentation) : info.documentation,
                parameters: Array.isArray(info.parameters) ? info.parameters.map(ParameterInformation.to) : [],
                activeParameter: info.activeParameter,
            };
        }
        SignatureInformation.to = to;
    })(SignatureInformation || (exports.SignatureInformation = SignatureInformation = {}));
    var SignatureHelp;
    (function (SignatureHelp) {
        function from(help) {
            return {
                activeSignature: help.activeSignature,
                activeParameter: help.activeParameter,
                signatures: Array.isArray(help.signatures) ? help.signatures.map(SignatureInformation.from) : [],
            };
        }
        SignatureHelp.from = from;
        function to(help) {
            return {
                activeSignature: help.activeSignature,
                activeParameter: help.activeParameter,
                signatures: Array.isArray(help.signatures) ? help.signatures.map(SignatureInformation.to) : [],
            };
        }
        SignatureHelp.to = to;
    })(SignatureHelp || (exports.SignatureHelp = SignatureHelp = {}));
    var InlayHint;
    (function (InlayHint) {
        function to(converter, hint) {
            const res = new types.InlayHint(Position.to(hint.position), typeof hint.label === 'string' ? hint.label : hint.label.map(InlayHintLabelPart.to.bind(undefined, converter)), hint.kind && InlayHintKind.to(hint.kind));
            res.textEdits = hint.textEdits && hint.textEdits.map(TextEdit.to);
            res.tooltip = htmlContent.isMarkdownString(hint.tooltip) ? MarkdownString.to(hint.tooltip) : hint.tooltip;
            res.paddingLeft = hint.paddingLeft;
            res.paddingRight = hint.paddingRight;
            return res;
        }
        InlayHint.to = to;
    })(InlayHint || (exports.InlayHint = InlayHint = {}));
    var InlayHintLabelPart;
    (function (InlayHintLabelPart) {
        function to(converter, part) {
            const result = new types.InlayHintLabelPart(part.label);
            result.tooltip = htmlContent.isMarkdownString(part.tooltip)
                ? MarkdownString.to(part.tooltip)
                : part.tooltip;
            if (languages.Command.is(part.command)) {
                result.command = converter.fromInternal(part.command);
            }
            if (part.location) {
                result.location = location.to(part.location);
            }
            return result;
        }
        InlayHintLabelPart.to = to;
    })(InlayHintLabelPart || (exports.InlayHintLabelPart = InlayHintLabelPart = {}));
    var InlayHintKind;
    (function (InlayHintKind) {
        function from(kind) {
            return kind;
        }
        InlayHintKind.from = from;
        function to(kind) {
            return kind;
        }
        InlayHintKind.to = to;
    })(InlayHintKind || (exports.InlayHintKind = InlayHintKind = {}));
    var DocumentLink;
    (function (DocumentLink) {
        function from(link) {
            return {
                range: Range.from(link.range),
                url: link.target,
                tooltip: link.tooltip
            };
        }
        DocumentLink.from = from;
        function to(link) {
            let target = undefined;
            if (link.url) {
                try {
                    target = typeof link.url === 'string' ? uri_1.URI.parse(link.url, true) : uri_1.URI.revive(link.url);
                }
                catch (err) {
                    // ignore
                }
            }
            return new types.DocumentLink(Range.to(link.range), target);
        }
        DocumentLink.to = to;
    })(DocumentLink || (exports.DocumentLink = DocumentLink = {}));
    var ColorPresentation;
    (function (ColorPresentation) {
        function to(colorPresentation) {
            const cp = new types.ColorPresentation(colorPresentation.label);
            if (colorPresentation.textEdit) {
                cp.textEdit = TextEdit.to(colorPresentation.textEdit);
            }
            if (colorPresentation.additionalTextEdits) {
                cp.additionalTextEdits = colorPresentation.additionalTextEdits.map(value => TextEdit.to(value));
            }
            return cp;
        }
        ColorPresentation.to = to;
        function from(colorPresentation) {
            return {
                label: colorPresentation.label,
                textEdit: colorPresentation.textEdit ? TextEdit.from(colorPresentation.textEdit) : undefined,
                additionalTextEdits: colorPresentation.additionalTextEdits ? colorPresentation.additionalTextEdits.map(value => TextEdit.from(value)) : undefined
            };
        }
        ColorPresentation.from = from;
    })(ColorPresentation || (exports.ColorPresentation = ColorPresentation = {}));
    var Color;
    (function (Color) {
        function to(c) {
            return new types.Color(c[0], c[1], c[2], c[3]);
        }
        Color.to = to;
        function from(color) {
            return [color.red, color.green, color.blue, color.alpha];
        }
        Color.from = from;
    })(Color || (exports.Color = Color = {}));
    var SelectionRange;
    (function (SelectionRange) {
        function from(obj) {
            return { range: Range.from(obj.range) };
        }
        SelectionRange.from = from;
        function to(obj) {
            return new types.SelectionRange(Range.to(obj.range));
        }
        SelectionRange.to = to;
    })(SelectionRange || (exports.SelectionRange = SelectionRange = {}));
    var TextDocumentSaveReason;
    (function (TextDocumentSaveReason) {
        function to(reason) {
            switch (reason) {
                case 2 /* SaveReason.AUTO */:
                    return types.TextDocumentSaveReason.AfterDelay;
                case 1 /* SaveReason.EXPLICIT */:
                    return types.TextDocumentSaveReason.Manual;
                case 3 /* SaveReason.FOCUS_CHANGE */:
                case 4 /* SaveReason.WINDOW_CHANGE */:
                    return types.TextDocumentSaveReason.FocusOut;
            }
        }
        TextDocumentSaveReason.to = to;
    })(TextDocumentSaveReason || (exports.TextDocumentSaveReason = TextDocumentSaveReason = {}));
    var TextEditorLineNumbersStyle;
    (function (TextEditorLineNumbersStyle) {
        function from(style) {
            switch (style) {
                case types.TextEditorLineNumbersStyle.Off:
                    return 0 /* RenderLineNumbersType.Off */;
                case types.TextEditorLineNumbersStyle.Relative:
                    return 2 /* RenderLineNumbersType.Relative */;
                case types.TextEditorLineNumbersStyle.Interval:
                    return 3 /* RenderLineNumbersType.Interval */;
                case types.TextEditorLineNumbersStyle.On:
                default:
                    return 1 /* RenderLineNumbersType.On */;
            }
        }
        TextEditorLineNumbersStyle.from = from;
        function to(style) {
            switch (style) {
                case 0 /* RenderLineNumbersType.Off */:
                    return types.TextEditorLineNumbersStyle.Off;
                case 2 /* RenderLineNumbersType.Relative */:
                    return types.TextEditorLineNumbersStyle.Relative;
                case 3 /* RenderLineNumbersType.Interval */:
                    return types.TextEditorLineNumbersStyle.Interval;
                case 1 /* RenderLineNumbersType.On */:
                default:
                    return types.TextEditorLineNumbersStyle.On;
            }
        }
        TextEditorLineNumbersStyle.to = to;
    })(TextEditorLineNumbersStyle || (exports.TextEditorLineNumbersStyle = TextEditorLineNumbersStyle = {}));
    var EndOfLine;
    (function (EndOfLine) {
        function from(eol) {
            if (eol === types.EndOfLine.CRLF) {
                return 1 /* EndOfLineSequence.CRLF */;
            }
            else if (eol === types.EndOfLine.LF) {
                return 0 /* EndOfLineSequence.LF */;
            }
            return undefined;
        }
        EndOfLine.from = from;
        function to(eol) {
            if (eol === 1 /* EndOfLineSequence.CRLF */) {
                return types.EndOfLine.CRLF;
            }
            else if (eol === 0 /* EndOfLineSequence.LF */) {
                return types.EndOfLine.LF;
            }
            return undefined;
        }
        EndOfLine.to = to;
    })(EndOfLine || (exports.EndOfLine = EndOfLine = {}));
    var ProgressLocation;
    (function (ProgressLocation) {
        function from(loc) {
            if (typeof loc === 'object') {
                return loc.viewId;
            }
            switch (loc) {
                case types.ProgressLocation.SourceControl: return 3 /* MainProgressLocation.Scm */;
                case types.ProgressLocation.Window: return 10 /* MainProgressLocation.Window */;
                case types.ProgressLocation.Notification: return 15 /* MainProgressLocation.Notification */;
            }
            throw new Error(`Unknown 'ProgressLocation'`);
        }
        ProgressLocation.from = from;
    })(ProgressLocation || (exports.ProgressLocation = ProgressLocation = {}));
    var FoldingRange;
    (function (FoldingRange) {
        function from(r) {
            const range = { start: r.start + 1, end: r.end + 1 };
            if (r.kind) {
                range.kind = FoldingRangeKind.from(r.kind);
            }
            return range;
        }
        FoldingRange.from = from;
        function to(r) {
            const range = { start: r.start - 1, end: r.end - 1 };
            if (r.kind) {
                range.kind = FoldingRangeKind.to(r.kind);
            }
            return range;
        }
        FoldingRange.to = to;
    })(FoldingRange || (exports.FoldingRange = FoldingRange = {}));
    var FoldingRangeKind;
    (function (FoldingRangeKind) {
        function from(kind) {
            if (kind) {
                switch (kind) {
                    case types.FoldingRangeKind.Comment:
                        return languages.FoldingRangeKind.Comment;
                    case types.FoldingRangeKind.Imports:
                        return languages.FoldingRangeKind.Imports;
                    case types.FoldingRangeKind.Region:
                        return languages.FoldingRangeKind.Region;
                }
            }
            return undefined;
        }
        FoldingRangeKind.from = from;
        function to(kind) {
            if (kind) {
                switch (kind.value) {
                    case languages.FoldingRangeKind.Comment.value:
                        return types.FoldingRangeKind.Comment;
                    case languages.FoldingRangeKind.Imports.value:
                        return types.FoldingRangeKind.Imports;
                    case languages.FoldingRangeKind.Region.value:
                        return types.FoldingRangeKind.Region;
                }
            }
            return undefined;
        }
        FoldingRangeKind.to = to;
    })(FoldingRangeKind || (exports.FoldingRangeKind = FoldingRangeKind = {}));
    var TextEditorOpenOptions;
    (function (TextEditorOpenOptions) {
        function from(options) {
            if (options) {
                return {
                    pinned: typeof options.preview === 'boolean' ? !options.preview : undefined,
                    inactive: options.background,
                    preserveFocus: options.preserveFocus,
                    selection: typeof options.selection === 'object' ? Range.from(options.selection) : undefined,
                    override: typeof options.override === 'boolean' ? editor_1.DEFAULT_EDITOR_ASSOCIATION.id : undefined
                };
            }
            return undefined;
        }
        TextEditorOpenOptions.from = from;
    })(TextEditorOpenOptions || (exports.TextEditorOpenOptions = TextEditorOpenOptions = {}));
    var GlobPattern;
    (function (GlobPattern) {
        function from(pattern) {
            if (pattern instanceof types.RelativePattern) {
                return pattern.toJSON();
            }
            if (typeof pattern === 'string') {
                return pattern;
            }
            // This is slightly bogus because we declare this method to accept
            // `vscode.GlobPattern` which can be `vscode.RelativePattern` class,
            // but given we cannot enforce classes from our vscode.d.ts, we have
            // to probe for objects too
            // Refs: https://github.com/microsoft/vscode/issues/140771
            if (isRelativePatternShape(pattern) || isLegacyRelativePatternShape(pattern)) {
                return new types.RelativePattern(pattern.baseUri ?? pattern.base, pattern.pattern).toJSON();
            }
            return pattern; // preserve `undefined` and `null`
        }
        GlobPattern.from = from;
        function isRelativePatternShape(obj) {
            const rp = obj;
            if (!rp) {
                return false;
            }
            return uri_1.URI.isUri(rp.baseUri) && typeof rp.pattern === 'string';
        }
        function isLegacyRelativePatternShape(obj) {
            // Before 1.64.x, `RelativePattern` did not have any `baseUri: Uri`
            // property. To preserve backwards compatibility with older extensions
            // we allow this old format when creating the `vscode.RelativePattern`.
            const rp = obj;
            if (!rp) {
                return false;
            }
            return typeof rp.base === 'string' && typeof rp.pattern === 'string';
        }
        function to(pattern) {
            if (typeof pattern === 'string') {
                return pattern;
            }
            return new types.RelativePattern(uri_1.URI.revive(pattern.baseUri), pattern.pattern);
        }
        GlobPattern.to = to;
    })(GlobPattern || (exports.GlobPattern = GlobPattern = {}));
    var LanguageSelector;
    (function (LanguageSelector) {
        function from(selector) {
            if (!selector) {
                return undefined;
            }
            else if (Array.isArray(selector)) {
                return selector.map(from);
            }
            else if (typeof selector === 'string') {
                return selector;
            }
            else {
                const filter = selector; // TODO: microsoft/TypeScript#42768
                return {
                    language: filter.language,
                    scheme: filter.scheme,
                    pattern: GlobPattern.from(filter.pattern),
                    exclusive: filter.exclusive,
                    notebookType: filter.notebookType
                };
            }
        }
        LanguageSelector.from = from;
    })(LanguageSelector || (exports.LanguageSelector = LanguageSelector = {}));
    var MappedEditsContext;
    (function (MappedEditsContext) {
        function is(v) {
            return (!!v && typeof v === 'object' &&
                'documents' in v &&
                Array.isArray(v.documents) &&
                v.documents.every(subArr => Array.isArray(subArr) &&
                    subArr.every(docRef => docRef && typeof docRef === 'object' &&
                        'uri' in docRef && uri_1.URI.isUri(docRef.uri) &&
                        'version' in docRef && typeof docRef.version === 'number' &&
                        'ranges' in docRef && Array.isArray(docRef.ranges) && docRef.ranges.every((r) => r instanceof types.Range))));
        }
        MappedEditsContext.is = is;
        function from(extContext) {
            return {
                documents: extContext.documents.map((subArray) => subArray.map((r) => ({
                    uri: uri_1.URI.from(r.uri),
                    version: r.version,
                    ranges: r.ranges.map((r) => Range.from(r)),
                }))),
            };
        }
        MappedEditsContext.from = from;
    })(MappedEditsContext || (exports.MappedEditsContext = MappedEditsContext = {}));
    var NotebookRange;
    (function (NotebookRange) {
        function from(range) {
            return { start: range.start, end: range.end };
        }
        NotebookRange.from = from;
        function to(range) {
            return new types.NotebookRange(range.start, range.end);
        }
        NotebookRange.to = to;
    })(NotebookRange || (exports.NotebookRange = NotebookRange = {}));
    var NotebookCellExecutionSummary;
    (function (NotebookCellExecutionSummary) {
        function to(data) {
            return {
                timing: typeof data.runStartTime === 'number' && typeof data.runEndTime === 'number' ? { startTime: data.runStartTime, endTime: data.runEndTime } : undefined,
                executionOrder: data.executionOrder,
                success: data.lastRunSuccess
            };
        }
        NotebookCellExecutionSummary.to = to;
        function from(data) {
            return {
                lastRunSuccess: data.success,
                runStartTime: data.timing?.startTime,
                runEndTime: data.timing?.endTime,
                executionOrder: data.executionOrder
            };
        }
        NotebookCellExecutionSummary.from = from;
    })(NotebookCellExecutionSummary || (exports.NotebookCellExecutionSummary = NotebookCellExecutionSummary = {}));
    var NotebookCellExecutionState;
    (function (NotebookCellExecutionState) {
        function to(state) {
            if (state === notebooks.NotebookCellExecutionState.Unconfirmed) {
                return types.NotebookCellExecutionState.Pending;
            }
            else if (state === notebooks.NotebookCellExecutionState.Pending) {
                // Since the (proposed) extension API doesn't have the distinction between Unconfirmed and Pending, we don't want to fire an update for Pending twice
                return undefined;
            }
            else if (state === notebooks.NotebookCellExecutionState.Executing) {
                return types.NotebookCellExecutionState.Executing;
            }
            else {
                throw new Error(`Unknown state: ${state}`);
            }
        }
        NotebookCellExecutionState.to = to;
    })(NotebookCellExecutionState || (exports.NotebookCellExecutionState = NotebookCellExecutionState = {}));
    var NotebookCellKind;
    (function (NotebookCellKind) {
        function from(data) {
            switch (data) {
                case types.NotebookCellKind.Markup:
                    return notebooks.CellKind.Markup;
                case types.NotebookCellKind.Code:
                default:
                    return notebooks.CellKind.Code;
            }
        }
        NotebookCellKind.from = from;
        function to(data) {
            switch (data) {
                case notebooks.CellKind.Markup:
                    return types.NotebookCellKind.Markup;
                case notebooks.CellKind.Code:
                default:
                    return types.NotebookCellKind.Code;
            }
        }
        NotebookCellKind.to = to;
    })(NotebookCellKind || (exports.NotebookCellKind = NotebookCellKind = {}));
    var NotebookData;
    (function (NotebookData) {
        function from(data) {
            const res = {
                metadata: data.metadata ?? Object.create(null),
                cells: [],
            };
            for (const cell of data.cells) {
                types.NotebookCellData.validate(cell);
                res.cells.push(NotebookCellData.from(cell));
            }
            return res;
        }
        NotebookData.from = from;
        function to(data) {
            const res = new types.NotebookData(data.cells.map(NotebookCellData.to));
            if (!(0, types_1.isEmptyObject)(data.metadata)) {
                res.metadata = data.metadata;
            }
            return res;
        }
        NotebookData.to = to;
    })(NotebookData || (exports.NotebookData = NotebookData = {}));
    var NotebookCellData;
    (function (NotebookCellData) {
        function from(data) {
            return {
                cellKind: NotebookCellKind.from(data.kind),
                language: data.languageId,
                mime: data.mime,
                source: data.value,
                metadata: data.metadata,
                internalMetadata: NotebookCellExecutionSummary.from(data.executionSummary ?? {}),
                outputs: data.outputs ? data.outputs.map(NotebookCellOutput.from) : []
            };
        }
        NotebookCellData.from = from;
        function to(data) {
            return new types.NotebookCellData(NotebookCellKind.to(data.cellKind), data.source, data.language, data.mime, data.outputs ? data.outputs.map(NotebookCellOutput.to) : undefined, data.metadata, data.internalMetadata ? NotebookCellExecutionSummary.to(data.internalMetadata) : undefined);
        }
        NotebookCellData.to = to;
    })(NotebookCellData || (exports.NotebookCellData = NotebookCellData = {}));
    var NotebookCellOutputItem;
    (function (NotebookCellOutputItem) {
        function from(item) {
            return {
                mime: item.mime,
                valueBytes: buffer_1.VSBuffer.wrap(item.data),
            };
        }
        NotebookCellOutputItem.from = from;
        function to(item) {
            return new types.NotebookCellOutputItem(item.valueBytes.buffer, item.mime);
        }
        NotebookCellOutputItem.to = to;
    })(NotebookCellOutputItem || (exports.NotebookCellOutputItem = NotebookCellOutputItem = {}));
    var NotebookCellOutput;
    (function (NotebookCellOutput) {
        function from(output) {
            return {
                outputId: output.id,
                items: output.items.map(NotebookCellOutputItem.from),
                metadata: output.metadata
            };
        }
        NotebookCellOutput.from = from;
        function to(output) {
            const items = output.items.map(NotebookCellOutputItem.to);
            return new types.NotebookCellOutput(items, output.outputId, output.metadata);
        }
        NotebookCellOutput.to = to;
    })(NotebookCellOutput || (exports.NotebookCellOutput = NotebookCellOutput = {}));
    var NotebookExclusiveDocumentPattern;
    (function (NotebookExclusiveDocumentPattern) {
        function from(pattern) {
            if (isExclusivePattern(pattern)) {
                return {
                    include: GlobPattern.from(pattern.include) ?? undefined,
                    exclude: GlobPattern.from(pattern.exclude) ?? undefined,
                };
            }
            return GlobPattern.from(pattern) ?? undefined;
        }
        NotebookExclusiveDocumentPattern.from = from;
        function to(pattern) {
            if (isExclusivePattern(pattern)) {
                return {
                    include: GlobPattern.to(pattern.include),
                    exclude: GlobPattern.to(pattern.exclude)
                };
            }
            return GlobPattern.to(pattern);
        }
        NotebookExclusiveDocumentPattern.to = to;
        function isExclusivePattern(obj) {
            const ep = obj;
            if (!ep) {
                return false;
            }
            return !(0, types_1.isUndefinedOrNull)(ep.include) && !(0, types_1.isUndefinedOrNull)(ep.exclude);
        }
    })(NotebookExclusiveDocumentPattern || (exports.NotebookExclusiveDocumentPattern = NotebookExclusiveDocumentPattern = {}));
    var NotebookStatusBarItem;
    (function (NotebookStatusBarItem) {
        function from(item, commandsConverter, disposables) {
            const command = typeof item.command === 'string' ? { title: '', command: item.command } : item.command;
            return {
                alignment: item.alignment === types.NotebookCellStatusBarAlignment.Left ? 1 /* notebooks.CellStatusbarAlignment.Left */ : 2 /* notebooks.CellStatusbarAlignment.Right */,
                command: commandsConverter.toInternal(command, disposables), // TODO@roblou
                text: item.text,
                tooltip: item.tooltip,
                accessibilityInformation: item.accessibilityInformation,
                priority: item.priority
            };
        }
        NotebookStatusBarItem.from = from;
    })(NotebookStatusBarItem || (exports.NotebookStatusBarItem = NotebookStatusBarItem = {}));
    var NotebookKernelSourceAction;
    (function (NotebookKernelSourceAction) {
        function from(item, commandsConverter, disposables) {
            const command = typeof item.command === 'string' ? { title: '', command: item.command } : item.command;
            return {
                command: commandsConverter.toInternal(command, disposables),
                label: item.label,
                description: item.description,
                detail: item.detail,
                documentation: item.documentation
            };
        }
        NotebookKernelSourceAction.from = from;
    })(NotebookKernelSourceAction || (exports.NotebookKernelSourceAction = NotebookKernelSourceAction = {}));
    var NotebookDocumentContentOptions;
    (function (NotebookDocumentContentOptions) {
        function from(options) {
            return {
                transientOutputs: options?.transientOutputs ?? false,
                transientCellMetadata: options?.transientCellMetadata ?? {},
                transientDocumentMetadata: options?.transientDocumentMetadata ?? {},
                cellContentMetadata: options?.cellContentMetadata ?? {}
            };
        }
        NotebookDocumentContentOptions.from = from;
    })(NotebookDocumentContentOptions || (exports.NotebookDocumentContentOptions = NotebookDocumentContentOptions = {}));
    var NotebookRendererScript;
    (function (NotebookRendererScript) {
        function from(preload) {
            return {
                uri: preload.uri,
                provides: preload.provides
            };
        }
        NotebookRendererScript.from = from;
        function to(preload) {
            return new types.NotebookRendererScript(uri_1.URI.revive(preload.uri), preload.provides);
        }
        NotebookRendererScript.to = to;
    })(NotebookRendererScript || (exports.NotebookRendererScript = NotebookRendererScript = {}));
    var TestMessage;
    (function (TestMessage) {
        function from(message) {
            return {
                message: MarkdownString.fromStrict(message.message) || '',
                type: 0 /* TestMessageType.Error */,
                expected: message.expectedOutput,
                actual: message.actualOutput,
                contextValue: message.contextValue,
                location: message.location && ({ range: Range.from(message.location.range), uri: message.location.uri }),
            };
        }
        TestMessage.from = from;
        function to(item) {
            const message = new types.TestMessage(typeof item.message === 'string' ? item.message : MarkdownString.to(item.message));
            message.actualOutput = item.actual;
            message.expectedOutput = item.expected;
            message.contextValue = item.contextValue;
            message.location = item.location ? location.to(item.location) : undefined;
            return message;
        }
        TestMessage.to = to;
    })(TestMessage || (exports.TestMessage = TestMessage = {}));
    var TestTag;
    (function (TestTag) {
        TestTag.namespace = testTypes_1.namespaceTestTag;
        TestTag.denamespace = testTypes_1.denamespaceTestTag;
    })(TestTag || (exports.TestTag = TestTag = {}));
    var TestItem;
    (function (TestItem) {
        function from(item) {
            const ctrlId = (0, extHostTestingPrivateApi_1.getPrivateApiFor)(item).controllerId;
            return {
                extId: testId_1.TestId.fromExtHostTestItem(item, ctrlId).toString(),
                label: item.label,
                uri: uri_1.URI.revive(item.uri),
                busy: item.busy,
                tags: item.tags.map(t => TestTag.namespace(ctrlId, t.id)),
                range: editorRange.Range.lift(Range.from(item.range)),
                description: item.description || null,
                sortText: item.sortText || null,
                error: item.error ? (MarkdownString.fromStrict(item.error) || null) : null,
            };
        }
        TestItem.from = from;
        function toPlain(item) {
            return {
                parent: undefined,
                error: undefined,
                id: testId_1.TestId.fromString(item.extId).localId,
                label: item.label,
                uri: uri_1.URI.revive(item.uri),
                tags: (item.tags || []).map(t => {
                    const { tagId } = TestTag.denamespace(t);
                    return new types.TestTag(tagId);
                }),
                children: {
                    add: () => { },
                    delete: () => { },
                    forEach: () => { },
                    *[Symbol.iterator]() { },
                    get: () => undefined,
                    replace: () => { },
                    size: 0,
                },
                range: Range.to(item.range || undefined),
                canResolveChildren: false,
                busy: item.busy,
                description: item.description || undefined,
                sortText: item.sortText || undefined,
            };
        }
        TestItem.toPlain = toPlain;
    })(TestItem || (exports.TestItem = TestItem = {}));
    (function (TestTag) {
        function from(tag) {
            return { id: tag.id };
        }
        TestTag.from = from;
        function to(tag) {
            return new types.TestTag(tag.id);
        }
        TestTag.to = to;
    })(TestTag || (exports.TestTag = TestTag = {}));
    var TestResults;
    (function (TestResults) {
        const convertTestResultItem = (node, parent) => {
            const item = node.value;
            if (!item) {
                return undefined; // should be unreachable
            }
            const snapshot = ({
                ...TestItem.toPlain(item.item),
                parent,
                taskStates: item.tasks.map(t => ({
                    state: t.state,
                    duration: t.duration,
                    messages: t.messages
                        .filter((m) => m.type === 0 /* TestMessageType.Error */)
                        .map(TestMessage.to),
                })),
                children: [],
            });
            if (node.children) {
                for (const child of node.children.values()) {
                    const c = convertTestResultItem(child, snapshot);
                    if (c) {
                        snapshot.children.push(c);
                    }
                }
            }
            return snapshot;
        };
        function to(serialized) {
            const tree = new prefixTree_1.WellDefinedPrefixTree();
            for (const item of serialized.items) {
                tree.insert(testId_1.TestId.fromString(item.item.extId).path, item);
            }
            // Get the first node with a value in each subtree of IDs.
            const queue = [tree.nodes];
            const roots = [];
            while (queue.length) {
                for (const node of queue.pop()) {
                    if (node.value) {
                        roots.push(node);
                    }
                    else if (node.children) {
                        queue.push(node.children.values());
                    }
                }
            }
            return {
                completedAt: serialized.completedAt,
                results: roots.map(r => convertTestResultItem(r)).filter(types_1.isDefined),
            };
        }
        TestResults.to = to;
    })(TestResults || (exports.TestResults = TestResults = {}));
    var TestCoverage;
    (function (TestCoverage) {
        function fromCoverageCount(count) {
            return { covered: count.covered, total: count.total };
        }
        function fromLocation(location) {
            return 'line' in location ? Position.from(location) : Range.from(location);
        }
        function fromDetails(coverage) {
            if (typeof coverage.executed === 'number' && coverage.executed < 0) {
                throw new Error(`Invalid coverage count ${coverage.executed}`);
            }
            if ('branches' in coverage) {
                return {
                    count: coverage.executed,
                    location: fromLocation(coverage.location),
                    type: 1 /* DetailType.Statement */,
                    branches: coverage.branches.length
                        ? coverage.branches.map(b => ({ count: b.executed, location: b.location && fromLocation(b.location), label: b.label }))
                        : undefined,
                };
            }
            else {
                return {
                    type: 0 /* DetailType.Declaration */,
                    name: coverage.name,
                    count: coverage.executed,
                    location: fromLocation(coverage.location),
                };
            }
        }
        TestCoverage.fromDetails = fromDetails;
        function fromFile(id, coverage) {
            types.validateTestCoverageCount(coverage.statementCoverage);
            types.validateTestCoverageCount(coverage.branchCoverage);
            types.validateTestCoverageCount(coverage.declarationCoverage);
            return {
                id,
                uri: coverage.uri,
                statement: fromCoverageCount(coverage.statementCoverage),
                branch: coverage.branchCoverage && fromCoverageCount(coverage.branchCoverage),
                declaration: coverage.declarationCoverage && fromCoverageCount(coverage.declarationCoverage),
            };
        }
        TestCoverage.fromFile = fromFile;
    })(TestCoverage || (exports.TestCoverage = TestCoverage = {}));
    var CodeActionTriggerKind;
    (function (CodeActionTriggerKind) {
        function to(value) {
            switch (value) {
                case 1 /* languages.CodeActionTriggerType.Invoke */:
                    return types.CodeActionTriggerKind.Invoke;
                case 2 /* languages.CodeActionTriggerType.Auto */:
                    return types.CodeActionTriggerKind.Automatic;
            }
        }
        CodeActionTriggerKind.to = to;
    })(CodeActionTriggerKind || (exports.CodeActionTriggerKind = CodeActionTriggerKind = {}));
    var TypeHierarchyItem;
    (function (TypeHierarchyItem) {
        function to(item) {
            const result = new types.TypeHierarchyItem(SymbolKind.to(item.kind), item.name, item.detail || '', uri_1.URI.revive(item.uri), Range.to(item.range), Range.to(item.selectionRange));
            result._sessionId = item._sessionId;
            result._itemId = item._itemId;
            return result;
        }
        TypeHierarchyItem.to = to;
        function from(item, sessionId, itemId) {
            sessionId = sessionId ?? item._sessionId;
            itemId = itemId ?? item._itemId;
            if (sessionId === undefined || itemId === undefined) {
                throw new Error('invalid item');
            }
            return {
                _sessionId: sessionId,
                _itemId: itemId,
                kind: SymbolKind.from(item.kind),
                name: item.name,
                detail: item.detail ?? '',
                uri: item.uri,
                range: Range.from(item.range),
                selectionRange: Range.from(item.selectionRange),
                tags: item.tags?.map(SymbolTag.from)
            };
        }
        TypeHierarchyItem.from = from;
    })(TypeHierarchyItem || (exports.TypeHierarchyItem = TypeHierarchyItem = {}));
    var ViewBadge;
    (function (ViewBadge) {
        function from(badge) {
            if (!badge) {
                return undefined;
            }
            return {
                value: badge.value,
                tooltip: badge.tooltip
            };
        }
        ViewBadge.from = from;
    })(ViewBadge || (exports.ViewBadge = ViewBadge = {}));
    var DataTransferItem;
    (function (DataTransferItem) {
        function to(mime, item, resolveFileData) {
            const file = item.fileData;
            if (file) {
                return new types.InternalFileDataTransferItem(new types.DataTransferFile(file.name, uri_1.URI.revive(file.uri), file.id, (0, functional_1.createSingleCallFunction)(() => resolveFileData(file.id))));
            }
            if (mime === mime_1.Mimes.uriList && item.uriListData) {
                return new types.InternalDataTransferItem(reviveUriList(item.uriListData));
            }
            return new types.InternalDataTransferItem(item.asString);
        }
        DataTransferItem.to = to;
        async function from(mime, item) {
            const stringValue = await item.asString();
            if (mime === mime_1.Mimes.uriList) {
                return {
                    asString: stringValue,
                    fileData: undefined,
                    uriListData: serializeUriList(stringValue),
                };
            }
            const fileValue = item.asFile();
            return {
                asString: stringValue,
                fileData: fileValue ? {
                    name: fileValue.name,
                    uri: fileValue.uri,
                    id: fileValue._itemId ?? fileValue.id,
                } : undefined,
            };
        }
        DataTransferItem.from = from;
        function serializeUriList(stringValue) {
            return dataTransfer_1.UriList.split(stringValue).map(part => {
                if (part.startsWith('#')) {
                    return part;
                }
                try {
                    return uri_1.URI.parse(part);
                }
                catch {
                    // noop
                }
                return part;
            });
        }
        function reviveUriList(parts) {
            return dataTransfer_1.UriList.create(parts.map(part => {
                return typeof part === 'string' ? part : uri_1.URI.revive(part);
            }));
        }
    })(DataTransferItem || (exports.DataTransferItem = DataTransferItem = {}));
    var DataTransfer;
    (function (DataTransfer) {
        function toDataTransfer(value, resolveFileData) {
            const init = value.items.map(([type, item]) => {
                return [type, DataTransferItem.to(type, item, resolveFileData)];
            });
            return new types.DataTransfer(init);
        }
        DataTransfer.toDataTransfer = toDataTransfer;
        async function from(dataTransfer) {
            const newDTO = { items: [] };
            const promises = [];
            for (const [mime, value] of dataTransfer) {
                promises.push((async () => {
                    newDTO.items.push([mime, await DataTransferItem.from(mime, value)]);
                })());
            }
            await Promise.all(promises);
            return newDTO;
        }
        DataTransfer.from = from;
    })(DataTransfer || (exports.DataTransfer = DataTransfer = {}));
    var ChatFollowup;
    (function (ChatFollowup) {
        function from(followup, request) {
            return {
                kind: 'reply',
                agentId: followup.participant ?? request?.agentId ?? '',
                subCommand: followup.command ?? request?.command,
                message: followup.prompt,
                title: followup.label
            };
        }
        ChatFollowup.from = from;
        function to(followup) {
            return {
                prompt: followup.message,
                label: followup.title,
                participant: followup.agentId,
                command: followup.subCommand,
            };
        }
        ChatFollowup.to = to;
    })(ChatFollowup || (exports.ChatFollowup = ChatFollowup = {}));
    var ChatInlineFollowup;
    (function (ChatInlineFollowup) {
        function from(followup) {
            if ('commandId' in followup) {
                return {
                    kind: 'command',
                    title: followup.title ?? '',
                    commandId: followup.commandId ?? '',
                    when: followup.when ?? '',
                    args: followup.args
                };
            }
            else {
                return {
                    kind: 'reply',
                    message: followup.message,
                    title: followup.title,
                    tooltip: followup.tooltip,
                };
            }
        }
        ChatInlineFollowup.from = from;
    })(ChatInlineFollowup || (exports.ChatInlineFollowup = ChatInlineFollowup = {}));
    var LanguageModelMessage;
    (function (LanguageModelMessage) {
        function to(message) {
            switch (message.role) {
                case 0 /* chatProvider.ChatMessageRole.System */: return new types.LanguageModelChatSystemMessage(message.content);
                case 1 /* chatProvider.ChatMessageRole.User */: return new types.LanguageModelChatUserMessage(message.content);
                case 2 /* chatProvider.ChatMessageRole.Assistant */: return new types.LanguageModelChatAssistantMessage(message.content);
            }
        }
        LanguageModelMessage.to = to;
        function from(message) {
            if (message instanceof types.LanguageModelChatSystemMessage) {
                return { role: 0 /* chatProvider.ChatMessageRole.System */, content: message.content };
            }
            else if (message instanceof types.LanguageModelChatUserMessage) {
                return { role: 1 /* chatProvider.ChatMessageRole.User */, content: message.content };
            }
            else if (message instanceof types.LanguageModelChatAssistantMessage) {
                return { role: 2 /* chatProvider.ChatMessageRole.Assistant */, content: message.content };
            }
            else {
                throw new Error('Invalid LanguageModelMessage');
            }
        }
        LanguageModelMessage.from = from;
    })(LanguageModelMessage || (exports.LanguageModelMessage = LanguageModelMessage = {}));
    var ChatVariable;
    (function (ChatVariable) {
        function objectTo(variableObject) {
            const result = {};
            for (const key of Object.keys(variableObject)) {
                result[key] = variableObject[key].map(ChatVariable.to);
            }
            return result;
        }
        ChatVariable.objectTo = objectTo;
        function to(variable) {
            return {
                level: ChatVariableLevel.to(variable.level),
                kind: variable.kind,
                value: (0, uri_1.isUriComponents)(variable.value) ? uri_1.URI.revive(variable.value) : variable.value,
                description: variable.description
            };
        }
        ChatVariable.to = to;
        function from(variable) {
            return {
                level: ChatVariableLevel.from(variable.level),
                kind: variable.kind,
                value: variable.value,
                description: variable.description
            };
        }
        ChatVariable.from = from;
    })(ChatVariable || (exports.ChatVariable = ChatVariable = {}));
    var ChatVariableLevel;
    (function (ChatVariableLevel) {
        function to(level) {
            switch (level) {
                case 'short': return types.ChatVariableLevel.Short;
                case 'medium': return types.ChatVariableLevel.Medium;
                case 'full':
                default:
                    return types.ChatVariableLevel.Full;
            }
        }
        ChatVariableLevel.to = to;
        function from(level) {
            switch (level) {
                case types.ChatVariableLevel.Short: return 'short';
                case types.ChatVariableLevel.Medium: return 'medium';
                case types.ChatVariableLevel.Full:
                default:
                    return 'full';
            }
        }
        ChatVariableLevel.from = from;
    })(ChatVariableLevel || (exports.ChatVariableLevel = ChatVariableLevel = {}));
    var InteractiveEditorResponseFeedbackKind;
    (function (InteractiveEditorResponseFeedbackKind) {
        function to(kind) {
            switch (kind) {
                case 1 /* InlineChatResponseFeedbackKind.Helpful */:
                    return types.InteractiveEditorResponseFeedbackKind.Helpful;
                case 0 /* InlineChatResponseFeedbackKind.Unhelpful */:
                    return types.InteractiveEditorResponseFeedbackKind.Unhelpful;
                case 2 /* InlineChatResponseFeedbackKind.Undone */:
                    return types.InteractiveEditorResponseFeedbackKind.Undone;
                case 3 /* InlineChatResponseFeedbackKind.Accepted */:
                    return types.InteractiveEditorResponseFeedbackKind.Accepted;
                case 4 /* InlineChatResponseFeedbackKind.Bug */:
                    return types.InteractiveEditorResponseFeedbackKind.Bug;
            }
        }
        InteractiveEditorResponseFeedbackKind.to = to;
    })(InteractiveEditorResponseFeedbackKind || (exports.InteractiveEditorResponseFeedbackKind = InteractiveEditorResponseFeedbackKind = {}));
    var ChatResponseMarkdownPart;
    (function (ChatResponseMarkdownPart) {
        function to(part) {
            return {
                kind: 'markdownContent',
                content: MarkdownString.from(part.value)
            };
        }
        ChatResponseMarkdownPart.to = to;
        function from(part) {
            return new types.ChatResponseMarkdownPart(MarkdownString.to(part.content));
        }
        ChatResponseMarkdownPart.from = from;
    })(ChatResponseMarkdownPart || (exports.ChatResponseMarkdownPart = ChatResponseMarkdownPart = {}));
    var ChatResponseFilesPart;
    (function (ChatResponseFilesPart) {
        function to(part) {
            const { value, baseUri } = part;
            function convert(items, baseUri) {
                return items.map(item => {
                    const myUri = uri_1.URI.joinPath(baseUri, item.name);
                    return {
                        label: item.name,
                        uri: myUri,
                        children: item.children && convert(item.children, myUri)
                    };
                });
            }
            return {
                kind: 'treeData',
                treeData: {
                    label: (0, resources_1.basename)(baseUri),
                    uri: baseUri,
                    children: convert(value, baseUri)
                }
            };
        }
        ChatResponseFilesPart.to = to;
        function from(part) {
            const treeData = (0, marshalling_1.revive)(part.treeData);
            function convert(items) {
                return items.map(item => {
                    return {
                        name: item.label,
                        children: item.children && convert(item.children)
                    };
                });
            }
            const baseUri = treeData.uri;
            const items = treeData.children ? convert(treeData.children) : [];
            return new types.ChatResponseFileTreePart(items, baseUri);
        }
        ChatResponseFilesPart.from = from;
    })(ChatResponseFilesPart || (exports.ChatResponseFilesPart = ChatResponseFilesPart = {}));
    var ChatResponseAnchorPart;
    (function (ChatResponseAnchorPart) {
        function to(part) {
            return {
                kind: 'inlineReference',
                name: part.title,
                inlineReference: !uri_1.URI.isUri(part.value) ? Location.from(part.value) : part.value
            };
        }
        ChatResponseAnchorPart.to = to;
        function from(part) {
            const value = (0, marshalling_1.revive)(part);
            return new types.ChatResponseAnchorPart(uri_1.URI.isUri(value.inlineReference) ? value.inlineReference : Location.to(value.inlineReference), part.name);
        }
        ChatResponseAnchorPart.from = from;
    })(ChatResponseAnchorPart || (exports.ChatResponseAnchorPart = ChatResponseAnchorPart = {}));
    var ChatResponseProgressPart;
    (function (ChatResponseProgressPart) {
        function to(part) {
            return {
                kind: 'progressMessage',
                content: MarkdownString.from(part.value)
            };
        }
        ChatResponseProgressPart.to = to;
        function from(part) {
            return new types.ChatResponseProgressPart(part.content.value);
        }
        ChatResponseProgressPart.from = from;
    })(ChatResponseProgressPart || (exports.ChatResponseProgressPart = ChatResponseProgressPart = {}));
    var ChatResponseCommandButtonPart;
    (function (ChatResponseCommandButtonPart) {
        function to(part, commandsConverter, commandDisposables) {
            // If the command isn't in the converter, then this session may have been restored, and the command args don't exist anymore
            const command = commandsConverter.toInternal(part.value, commandDisposables) ?? { command: part.value.command, title: part.value.title };
            return {
                kind: 'command',
                command
            };
        }
        ChatResponseCommandButtonPart.to = to;
        function from(part, commandsConverter) {
            // If the command isn't in the converter, then this session may have been restored, and the command args don't exist anymore
            return new types.ChatResponseCommandButtonPart(commandsConverter.fromInternal(part.command) ?? { command: part.command.id, title: part.command.title });
        }
        ChatResponseCommandButtonPart.from = from;
    })(ChatResponseCommandButtonPart || (exports.ChatResponseCommandButtonPart = ChatResponseCommandButtonPart = {}));
    var ChatResponseReferencePart;
    (function (ChatResponseReferencePart) {
        function to(part) {
            if ('variableName' in part.value) {
                return {
                    kind: 'reference',
                    reference: {
                        variableName: part.value.variableName,
                        value: uri_1.URI.isUri(part.value.value) || !part.value.value ?
                            part.value.value :
                            Location.from(part.value.value)
                    }
                };
            }
            return {
                kind: 'reference',
                reference: uri_1.URI.isUri(part.value) ?
                    part.value :
                    Location.from(part.value)
            };
        }
        ChatResponseReferencePart.to = to;
        function from(part) {
            const value = (0, marshalling_1.revive)(part);
            const mapValue = (value) => uri_1.URI.isUri(value) ?
                value :
                Location.to(value);
            return new types.ChatResponseReferencePart('variableName' in value.reference ? {
                variableName: value.reference.variableName,
                value: value.reference.value && mapValue(value.reference.value)
            } :
                mapValue(value.reference));
        }
        ChatResponseReferencePart.from = from;
    })(ChatResponseReferencePart || (exports.ChatResponseReferencePart = ChatResponseReferencePart = {}));
    var ChatResponsePart;
    (function (ChatResponsePart) {
        function to(part, commandsConverter, commandDisposables) {
            if (part instanceof types.ChatResponseMarkdownPart) {
                return ChatResponseMarkdownPart.to(part);
            }
            else if (part instanceof types.ChatResponseAnchorPart) {
                return ChatResponseAnchorPart.to(part);
            }
            else if (part instanceof types.ChatResponseReferencePart) {
                return ChatResponseReferencePart.to(part);
            }
            else if (part instanceof types.ChatResponseProgressPart) {
                return ChatResponseProgressPart.to(part);
            }
            else if (part instanceof types.ChatResponseFileTreePart) {
                return ChatResponseFilesPart.to(part);
            }
            else if (part instanceof types.ChatResponseCommandButtonPart) {
                return ChatResponseCommandButtonPart.to(part, commandsConverter, commandDisposables);
            }
            return {
                kind: 'content',
                content: ''
            };
        }
        ChatResponsePart.to = to;
        function from(part, commandsConverter) {
            switch (part.kind) {
                case 'reference': return ChatResponseReferencePart.from(part);
                case 'markdownContent':
                case 'inlineReference':
                case 'progressMessage':
                case 'treeData':
                case 'command':
                    return fromContent(part, commandsConverter);
            }
            return undefined;
        }
        ChatResponsePart.from = from;
        function fromContent(part, commandsConverter) {
            switch (part.kind) {
                case 'markdownContent': return ChatResponseMarkdownPart.from(part);
                case 'inlineReference': return ChatResponseAnchorPart.from(part);
                case 'progressMessage': return undefined;
                case 'treeData': return ChatResponseFilesPart.from(part);
                case 'command': return ChatResponseCommandButtonPart.from(part, commandsConverter);
            }
            return undefined;
        }
        ChatResponsePart.fromContent = fromContent;
    })(ChatResponsePart || (exports.ChatResponsePart = ChatResponsePart = {}));
    var ChatResponseProgress;
    (function (ChatResponseProgress) {
        function from(extension, progress) {
            if ('markdownContent' in progress) {
                (0, extensions_1.checkProposedApiEnabled)(extension, 'chatParticipantAdditions');
                return { content: MarkdownString.from(progress.markdownContent), kind: 'markdownContent' };
            }
            else if ('content' in progress) {
                if ('vulnerabilities' in progress && progress.vulnerabilities) {
                    (0, extensions_1.checkProposedApiEnabled)(extension, 'chatParticipantAdditions');
                    return { content: progress.content, vulnerabilities: progress.vulnerabilities, kind: 'vulnerability' };
                }
                if (typeof progress.content === 'string') {
                    return { content: progress.content, kind: 'content' };
                }
                (0, extensions_1.checkProposedApiEnabled)(extension, 'chatParticipantAdditions');
                return { content: MarkdownString.from(progress.content), kind: 'markdownContent' };
            }
            else if ('documents' in progress) {
                return {
                    documents: progress.documents.map(d => ({
                        uri: d.uri,
                        version: d.version,
                        ranges: d.ranges.map(r => Range.from(r))
                    })),
                    kind: 'usedContext'
                };
            }
            else if ('reference' in progress) {
                return {
                    reference: 'uri' in progress.reference ?
                        {
                            uri: progress.reference.uri,
                            range: Range.from(progress.reference.range)
                        } : progress.reference,
                    kind: 'reference'
                };
            }
            else if ('inlineReference' in progress) {
                return {
                    inlineReference: 'uri' in progress.inlineReference ?
                        {
                            uri: progress.inlineReference.uri,
                            range: Range.from(progress.inlineReference.range)
                        } : progress.inlineReference,
                    name: progress.title,
                    kind: 'inlineReference'
                };
            }
            else if ('participant' in progress) {
                (0, extensions_1.checkProposedApiEnabled)(extension, 'chatParticipantAdditions');
                return { agentId: progress.participant, command: progress.command, kind: 'agentDetection' };
            }
            else if ('message' in progress) {
                return { content: MarkdownString.from(progress.message), kind: 'progressMessage' };
            }
            else {
                return undefined;
            }
        }
        ChatResponseProgress.from = from;
        function toProgressContent(progress, commandsConverter) {
            switch (progress.kind) {
                case 'markdownContent':
                    // For simplicity, don't sent back the 'extended' types, so downgrade markdown to just some text
                    return { content: progress.content.value };
                case 'inlineReference':
                    return {
                        inlineReference: (0, uri_1.isUriComponents)(progress.inlineReference) ?
                            uri_1.URI.revive(progress.inlineReference) :
                            Location.to(progress.inlineReference),
                        title: progress.name
                    };
                case 'command':
                    // If the command isn't in the converter, then this session may have been restored, and the command args don't exist anymore
                    return {
                        command: commandsConverter.fromInternal(progress.command) ?? { command: progress.command.id, title: progress.command.title },
                    };
                default:
                    // Unknown type, eg something in history that was removed? Ignore
                    return undefined;
            }
        }
        ChatResponseProgress.toProgressContent = toProgressContent;
    })(ChatResponseProgress || (exports.ChatResponseProgress = ChatResponseProgress = {}));
    var ChatAgentRequest;
    (function (ChatAgentRequest) {
        function to(request) {
            return {
                prompt: request.message,
                command: request.command,
                variables: request.variables.variables.map(ChatAgentResolvedVariable.to),
                location: ChatLocation.to(request.location),
            };
        }
        ChatAgentRequest.to = to;
    })(ChatAgentRequest || (exports.ChatAgentRequest = ChatAgentRequest = {}));
    var ChatLocation;
    (function (ChatLocation) {
        function to(loc) {
            switch (loc) {
                case chatAgents_1.ChatAgentLocation.Notebook: return types.ChatLocation.Notebook;
                case chatAgents_1.ChatAgentLocation.Terminal: return types.ChatLocation.Terminal;
                case chatAgents_1.ChatAgentLocation.Panel: return types.ChatLocation.Panel;
                case chatAgents_1.ChatAgentLocation.Editor: return types.ChatLocation.Editor;
            }
        }
        ChatLocation.to = to;
    })(ChatLocation || (exports.ChatLocation = ChatLocation = {}));
    var ChatAgentResolvedVariable;
    (function (ChatAgentResolvedVariable) {
        function to(request) {
            return {
                name: request.name,
                range: request.range && [request.range.start, request.range.endExclusive],
                values: request.values.map(ChatVariable.to)
            };
        }
        ChatAgentResolvedVariable.to = to;
    })(ChatAgentResolvedVariable || (exports.ChatAgentResolvedVariable = ChatAgentResolvedVariable = {}));
    var ChatAgentCompletionItem;
    (function (ChatAgentCompletionItem) {
        function from(item) {
            return {
                label: item.label,
                values: item.values.map(ChatVariable.from),
                insertText: item.insertText,
                detail: item.detail,
                documentation: item.documentation,
            };
        }
        ChatAgentCompletionItem.from = from;
    })(ChatAgentCompletionItem || (exports.ChatAgentCompletionItem = ChatAgentCompletionItem = {}));
    var ChatAgentResult;
    (function (ChatAgentResult) {
        function to(result) {
            return {
                errorDetails: result.errorDetails,
                metadata: result.metadata,
            };
        }
        ChatAgentResult.to = to;
    })(ChatAgentResult || (exports.ChatAgentResult = ChatAgentResult = {}));
    var ChatAgentUserActionEvent;
    (function (ChatAgentUserActionEvent) {
        function to(result, event, commandsConverter) {
            if (event.action.kind === 'vote') {
                // Is the "feedback" type
                return;
            }
            const ehResult = ChatAgentResult.to(result);
            if (event.action.kind === 'command') {
                const commandAction = { kind: 'command', commandButton: ChatResponseProgress.toProgressContent(event.action.commandButton, commandsConverter) };
                return { action: commandAction, result: ehResult };
            }
            else if (event.action.kind === 'followUp') {
                const followupAction = { kind: 'followUp', followup: ChatFollowup.to(event.action.followup) };
                return { action: followupAction, result: ehResult };
            }
            else {
                return { action: event.action, result: ehResult };
            }
        }
        ChatAgentUserActionEvent.to = to;
    })(ChatAgentUserActionEvent || (exports.ChatAgentUserActionEvent = ChatAgentUserActionEvent = {}));
    var TerminalQuickFix;
    (function (TerminalQuickFix) {
        function from(quickFix, converter, disposables) {
            if ('terminalCommand' in quickFix) {
                return { terminalCommand: quickFix.terminalCommand, shouldExecute: quickFix.shouldExecute };
            }
            if ('uri' in quickFix) {
                return { uri: quickFix.uri };
            }
            return converter.toInternal(quickFix, disposables);
        }
        TerminalQuickFix.from = from;
    })(TerminalQuickFix || (exports.TerminalQuickFix = TerminalQuickFix = {}));
    var PartialAcceptInfo;
    (function (PartialAcceptInfo) {
        function to(info) {
            return {
                kind: PartialAcceptTriggerKind.to(info.kind),
            };
        }
        PartialAcceptInfo.to = to;
    })(PartialAcceptInfo || (exports.PartialAcceptInfo = PartialAcceptInfo = {}));
    var PartialAcceptTriggerKind;
    (function (PartialAcceptTriggerKind) {
        function to(kind) {
            switch (kind) {
                case 0 /* languages.PartialAcceptTriggerKind.Word */:
                    return types.PartialAcceptTriggerKind.Word;
                case 1 /* languages.PartialAcceptTriggerKind.Line */:
                    return types.PartialAcceptTriggerKind.Line;
                case 2 /* languages.PartialAcceptTriggerKind.Suggest */:
                    return types.PartialAcceptTriggerKind.Suggest;
                default:
                    return types.PartialAcceptTriggerKind.Unknown;
            }
        }
        PartialAcceptTriggerKind.to = to;
    })(PartialAcceptTriggerKind || (exports.PartialAcceptTriggerKind = PartialAcceptTriggerKind = {}));
    var DebugTreeItem;
    (function (DebugTreeItem) {
        function from(item, id) {
            return {
                id,
                label: item.label,
                description: item.description,
                canEdit: item.canEdit,
                collapsibleState: (item.collapsibleState || 0 /* DebugTreeItemCollapsibleState.None */),
                contextValue: item.contextValue,
            };
        }
        DebugTreeItem.from = from;
    })(DebugTreeItem || (exports.DebugTreeItem = DebugTreeItem = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFR5cGVDb252ZXJ0ZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0VHlwZUNvbnZlcnRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc1VoRyx3REFLQztJQXVHRCxrRUFrQkM7SUFFRCx3Q0FTQztJQWxZRCxJQUFpQixTQUFTLENBa0J6QjtJQWxCRCxXQUFpQixTQUFTO1FBRXpCLFNBQWdCLEVBQUUsQ0FBQyxTQUFxQjtZQUN2QyxNQUFNLEVBQUUsd0JBQXdCLEVBQUUsb0JBQW9CLEVBQUUsa0JBQWtCLEVBQUUsY0FBYyxFQUFFLEdBQUcsU0FBUyxDQUFDO1lBQ3pHLE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsR0FBRyxDQUFDLEVBQUUsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDekYsTUFBTSxHQUFHLEdBQUcsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLGtCQUFrQixHQUFHLENBQUMsRUFBRSxjQUFjLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDM0UsT0FBTyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFMZSxZQUFFLEtBS2pCLENBQUE7UUFFRCxTQUFnQixJQUFJLENBQUMsU0FBd0I7WUFDNUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxTQUFTLENBQUM7WUFDckMsT0FBTztnQkFDTix3QkFBd0IsRUFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLENBQUM7Z0JBQ3pDLG9CQUFvQixFQUFFLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQztnQkFDMUMsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLElBQUksR0FB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