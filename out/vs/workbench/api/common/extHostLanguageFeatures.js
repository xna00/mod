/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/idGenerator", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/stopwatch", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/services/semanticTokensDto", "vs/nls", "vs/platform/extensions/common/extensions", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/services/extensions/common/extensions", "./cache", "./extHost.protocol"], function (require, exports, arrays_1, async_1, cancellation_1, errors_1, idGenerator_1, lifecycle_1, objects_1, stopwatch_1, strings_1, types_1, uri_1, range_1, selection_1, languages, semanticTokensDto_1, nls_1, extensions_1, typeConvert, extHostTypes_1, extensions_2, cache_1, extHostProtocol) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLanguageFeatures = void 0;
    // --- adapter
    class DocumentSymbolAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDocumentSymbols(resource, token) {
            const doc = this._documents.getDocument(resource);
            const value = await this._provider.provideDocumentSymbols(doc, token);
            if ((0, arrays_1.isFalsyOrEmpty)(value)) {
                return undefined;
            }
            else if (value[0] instanceof extHostTypes_1.DocumentSymbol) {
                return value.map(typeConvert.DocumentSymbol.from);
            }
            else {
                return DocumentSymbolAdapter._asDocumentSymbolTree(value);
            }
        }
        static _asDocumentSymbolTree(infos) {
            // first sort by start (and end) and then loop over all elements
            // and build a tree based on containment.
            infos = infos.slice(0).sort((a, b) => {
                let res = a.location.range.start.compareTo(b.location.range.start);
                if (res === 0) {
                    res = b.location.range.end.compareTo(a.location.range.end);
                }
                return res;
            });
            const res = [];
            const parentStack = [];
            for (const info of infos) {
                const element = {
                    name: info.name || '!!MISSING: name!!',
                    kind: typeConvert.SymbolKind.from(info.kind),
                    tags: info.tags?.map(typeConvert.SymbolTag.from) || [],
                    detail: '',
                    containerName: info.containerName,
                    range: typeConvert.Range.from(info.location.range),
                    selectionRange: typeConvert.Range.from(info.location.range),
                    children: []
                };
                while (true) {
                    if (parentStack.length === 0) {
                        parentStack.push(element);
                        res.push(element);
                        break;
                    }
                    const parent = parentStack[parentStack.length - 1];
                    if (range_1.Range.containsRange(parent.range, element.range) && !range_1.Range.equalsRange(parent.range, element.range)) {
                        parent.children?.push(element);
                        parentStack.push(element);
                        break;
                    }
                    parentStack.pop();
                }
            }
            return res;
        }
    }
    class CodeLensAdapter {
        constructor(_documents, _commands, _provider, _extension, _extTelemetry, _logService) {
            this._documents = _documents;
            this._commands = _commands;
            this._provider = _provider;
            this._extension = _extension;
            this._extTelemetry = _extTelemetry;
            this._logService = _logService;
            this._cache = new cache_1.Cache('CodeLens');
            this._disposables = new Map();
        }
        async provideCodeLenses(resource, token) {
            const doc = this._documents.getDocument(resource);
            const lenses = await this._provider.provideCodeLenses(doc, token);
            if (!lenses || token.isCancellationRequested) {
                return undefined;
            }
            const cacheId = this._cache.add(lenses);
            const disposables = new lifecycle_1.DisposableStore();
            this._disposables.set(cacheId, disposables);
            const result = {
                cacheId,
                lenses: [],
            };
            for (let i = 0; i < lenses.length; i++) {
                result.lenses.push({
                    cacheId: [cacheId, i],
                    range: typeConvert.Range.from(lenses[i].range),
                    command: this._commands.toInternal(lenses[i].command, disposables)
                });
            }
            return result;
        }
        async resolveCodeLens(symbol, token) {
            const lens = symbol.cacheId && this._cache.get(...symbol.cacheId);
            if (!lens) {
                return undefined;
            }
            let resolvedLens;
            if (typeof this._provider.resolveCodeLens !== 'function' || lens.isResolved) {
                resolvedLens = lens;
            }
            else {
                resolvedLens = await this._provider.resolveCodeLens(lens, token);
            }
            if (!resolvedLens) {
                resolvedLens = lens;
            }
            if (token.isCancellationRequested) {
                return undefined;
            }
            const disposables = symbol.cacheId && this._disposables.get(symbol.cacheId[0]);
            if (!disposables) {
                // disposed in the meantime
                return undefined;
            }
            if (!resolvedLens.command) {
                const error = new Error('INVALID code lens resolved, lacks command: ' + this._extension.identifier.value);
                this._extTelemetry.onExtensionError(this._extension.identifier, error);
                this._logService.error(error);
                return undefined;
            }
            symbol.command = this._commands.toInternal(resolvedLens.command, disposables);
            return symbol;
        }
        releaseCodeLenses(cachedId) {
            this._disposables.get(cachedId)?.dispose();
            this._disposables.delete(cachedId);
            this._cache.delete(cachedId);
        }
    }
    function convertToLocationLinks(value) {
        if (Array.isArray(value)) {
            return value.map(typeConvert.DefinitionLink.from);
        }
        else if (value) {
            return [typeConvert.DefinitionLink.from(value)];
        }
        return [];
    }
    class DefinitionAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDefinition(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideDefinition(doc, pos, token);
            return convertToLocationLinks(value);
        }
    }
    class DeclarationAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDeclaration(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideDeclaration(doc, pos, token);
            return convertToLocationLinks(value);
        }
    }
    class ImplementationAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideImplementation(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideImplementation(doc, pos, token);
            return convertToLocationLinks(value);
        }
    }
    class TypeDefinitionAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideTypeDefinition(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideTypeDefinition(doc, pos, token);
            return convertToLocationLinks(value);
        }
    }
    class HoverAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideHover(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideHover(doc, pos, token);
            if (!value || (0, arrays_1.isFalsyOrEmpty)(value.contents)) {
                return undefined;
            }
            if (!value.range) {
                value.range = doc.getWordRangeAtPosition(pos);
            }
            if (!value.range) {
                value.range = new extHostTypes_1.Range(pos, pos);
            }
            return typeConvert.Hover.from(value);
        }
    }
    class EvaluatableExpressionAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideEvaluatableExpression(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideEvaluatableExpression(doc, pos, token);
            if (value) {
                return typeConvert.EvaluatableExpression.from(value);
            }
            return undefined;
        }
    }
    class InlineValuesAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideInlineValues(resource, viewPort, context, token) {
            const doc = this._documents.getDocument(resource);
            const value = await this._provider.provideInlineValues(doc, typeConvert.Range.to(viewPort), typeConvert.InlineValueContext.to(context), token);
            if (Array.isArray(value)) {
                return value.map(iv => typeConvert.InlineValue.from(iv));
            }
            return undefined;
        }
    }
    class DocumentHighlightAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDocumentHighlights(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideDocumentHighlights(doc, pos, token);
            if (Array.isArray(value)) {
                return value.map(typeConvert.DocumentHighlight.from);
            }
            return undefined;
        }
    }
    class MultiDocumentHighlightAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideMultiDocumentHighlights(resource, position, otherResources, token) {
            const doc = this._documents.getDocument(resource);
            const otherDocuments = otherResources.map(r => this._documents.getDocument(r));
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideMultiDocumentHighlights(doc, pos, otherDocuments, token);
            if (Array.isArray(value)) {
                return value.map(typeConvert.MultiDocumentHighlight.from);
            }
            return undefined;
        }
    }
    class LinkedEditingRangeAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideLinkedEditingRanges(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideLinkedEditingRanges(doc, pos, token);
            if (value && Array.isArray(value.ranges)) {
                return {
                    ranges: (0, arrays_1.coalesce)(value.ranges.map(typeConvert.Range.from)),
                    wordPattern: value.wordPattern
                };
            }
            return undefined;
        }
    }
    class ReferenceAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideReferences(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideReferences(doc, pos, context, token);
            if (Array.isArray(value)) {
                return value.map(typeConvert.location.from);
            }
            return undefined;
        }
    }
    class CodeActionAdapter {
        static { this._maxCodeActionsPerFile = 1000; }
        constructor(_documents, _commands, _diagnostics, _provider, _logService, _extension, _apiDeprecation) {
            this._documents = _documents;
            this._commands = _commands;
            this._diagnostics = _diagnostics;
            this._provider = _provider;
            this._logService = _logService;
            this._extension = _extension;
            this._apiDeprecation = _apiDeprecation;
            this._cache = new cache_1.Cache('CodeAction');
            this._disposables = new Map();
        }
        async provideCodeActions(resource, rangeOrSelection, context, token) {
            const doc = this._documents.getDocument(resource);
            const ran = selection_1.Selection.isISelection(rangeOrSelection)
                ? typeConvert.Selection.to(rangeOrSelection)
                : typeConvert.Range.to(rangeOrSelection);
            const allDiagnostics = [];
            for (const diagnostic of this._diagnostics.getDiagnostics(resource)) {
                if (ran.intersection(diagnostic.range)) {
                    const newLen = allDiagnostics.push(diagnostic);
                    if (newLen > CodeActionAdapter._maxCodeActionsPerFile) {
                        break;
                    }
                }
            }
            const codeActionContext = {
                diagnostics: allDiagnostics,
                only: context.only ? new extHostTypes_1.CodeActionKind(context.only) : undefined,
                triggerKind: typeConvert.CodeActionTriggerKind.to(context.trigger),
            };
            const commandsOrActions = await this._provider.provideCodeActions(doc, ran, codeActionContext, token);
            if (!(0, arrays_1.isNonEmptyArray)(commandsOrActions) || token.isCancellationRequested) {
                return undefined;
            }
            const cacheId = this._cache.add(commandsOrActions);
            const disposables = new lifecycle_1.DisposableStore();
            this._disposables.set(cacheId, disposables);
            const actions = [];
            for (let i = 0; i < commandsOrActions.length; i++) {
                const candidate = commandsOrActions[i];
                if (!candidate) {
                    continue;
                }
                if (CodeActionAdapter._isCommand(candidate)) {
                    // old school: synthetic code action
                    this._apiDeprecation.report('CodeActionProvider.provideCodeActions - return commands', this._extension, `Return 'CodeAction' instances instead.`);
                    actions.push({
                        _isSynthetic: true,
                        title: candidate.title,
                        command: this._commands.toInternal(candidate, disposables),
                    });
                }
                else {
                    if (codeActionContext.only) {
                        if (!candidate.kind) {
                            this._logService.warn(`${this._extension.identifier.value} - Code actions of kind '${codeActionContext.only.value} 'requested but returned code action does not have a 'kind'. Code action will be dropped. Please set 'CodeAction.kind'.`);
                        }
                        else if (!codeActionContext.only.contains(candidate.kind)) {
                            this._logService.warn(`${this._extension.identifier.value} - Code actions of kind '${codeActionContext.only.value} 'requested but returned code action is of kind '${candidate.kind.value}'. Code action will be dropped. Please check 'CodeActionContext.only' to only return requested code actions.`);
                        }
                    }
                    // Ensures that this is either a Range[] or an empty array so we don't get Array<Range | undefined>
                    const range = candidate.ranges ?? [];
                    // new school: convert code action
                    actions.push({
                        cacheId: [cacheId, i],
                        title: candidate.title,
                        command: candidate.command && this._commands.toInternal(candidate.command, disposables),
                        diagnostics: candidate.diagnostics && candidate.diagnostics.map(typeConvert.Diagnostic.from),
                        edit: candidate.edit && typeConvert.WorkspaceEdit.from(candidate.edit, undefined),
                        kind: candidate.kind && candidate.kind.value,
                        isPreferred: candidate.isPreferred,
                        isAI: (0, extensions_2.isProposedApiEnabled)(this._extension, 'codeActionAI') ? candidate.isAI : false,
                        ranges: (0, extensions_2.isProposedApiEnabled)(this._extension, 'codeActionRanges') ? (0, arrays_1.coalesce)(range.map(typeConvert.Range.from)) : undefined,
                        disabled: candidate.disabled?.reason
                    });
                }
            }
            return { cacheId, actions };
        }
        async resolveCodeAction(id, token) {
            const [sessionId, itemId] = id;
            const item = this._cache.get(sessionId, itemId);
            if (!item || CodeActionAdapter._isCommand(item)) {
                return {}; // code actions only!
            }
            if (!this._provider.resolveCodeAction) {
                return {}; // this should not happen...
            }
            const resolvedItem = (await this._provider.resolveCodeAction(item, token)) ?? item;
            let resolvedEdit;
            if (resolvedItem.edit) {
                resolvedEdit = typeConvert.WorkspaceEdit.from(resolvedItem.edit, undefined);
            }
            let resolvedCommand;
            if (resolvedItem.command) {
                const disposables = this._disposables.get(sessionId);
                if (disposables) {
                    resolvedCommand = this._commands.toInternal(resolvedItem.command, disposables);
                }
            }
            return { edit: resolvedEdit, command: resolvedCommand };
        }
        releaseCodeActions(cachedId) {
            this._disposables.get(cachedId)?.dispose();
            this._disposables.delete(cachedId);
            this._cache.delete(cachedId);
        }
        static _isCommand(thing) {
            return typeof thing.command === 'string' && typeof thing.title === 'string';
        }
    }
    class DocumentPasteEditProvider {
        constructor(_proxy, _documents, _provider, _handle, _extension) {
            this._proxy = _proxy;
            this._documents = _documents;
            this._provider = _provider;
            this._handle = _handle;
            this._extension = _extension;
            this._cache = new cache_1.Cache('DocumentPasteEdit');
        }
        async prepareDocumentPaste(resource, ranges, dataTransferDto, token) {
            if (!this._provider.prepareDocumentPaste) {
                return;
            }
            const doc = this._documents.getDocument(resource);
            const vscodeRanges = ranges.map(range => typeConvert.Range.to(range));
            const dataTransfer = typeConvert.DataTransfer.toDataTransfer(dataTransferDto, () => {
                throw new errors_1.NotImplementedError();
            });
            await this._provider.prepareDocumentPaste(doc, vscodeRanges, dataTransfer, token);
            if (token.isCancellationRequested) {
                return;
            }
            // Only send back values that have been added to the data transfer
            const entries = Array.from(dataTransfer).filter(([, value]) => !(value instanceof extHostTypes_1.InternalDataTransferItem));
            return typeConvert.DataTransfer.from(entries);
        }
        async providePasteEdits(requestId, resource, ranges, dataTransferDto, context, token) {
            if (!this._provider.provideDocumentPasteEdits) {
                return [];
            }
            const doc = this._documents.getDocument(resource);
            const vscodeRanges = ranges.map(range => typeConvert.Range.to(range));
            const dataTransfer = typeConvert.DataTransfer.toDataTransfer(dataTransferDto, async (id) => {
                return (await this._proxy.$resolvePasteFileData(this._handle, requestId, id)).buffer;
            });
            const edits = await this._provider.provideDocumentPasteEdits(doc, vscodeRanges, dataTransfer, {
                only: context.only ? new extHostTypes_1.DocumentPasteEditKind(context.only) : undefined,
                triggerKind: context.triggerKind,
            }, token);
            if (!edits || token.isCancellationRequested) {
                return [];
            }
            const cacheId = this._cache.add(edits);
            return edits.map((edit, i) => ({
                _cacheId: [cacheId, i],
                title: edit.title ?? (0, nls_1.localize)('defaultPasteLabel', "Paste using '{0}' extension", this._extension.displayName || this._extension.name),
                kind: edit.kind,
                yieldTo: edit.yieldTo?.map(x => x.value),
                insertText: typeof edit.insertText === 'string' ? edit.insertText : { snippet: edit.insertText.value },
                additionalEdit: edit.additionalEdit ? typeConvert.WorkspaceEdit.from(edit.additionalEdit, undefined) : undefined,
            }));
        }
        async resolvePasteEdit(id, token) {
            const [sessionId, itemId] = id;
            const item = this._cache.get(sessionId, itemId);
            if (!item || !this._provider.resolveDocumentPasteEdit) {
                return {}; // this should not happen...
            }
            const resolvedItem = (await this._provider.resolveDocumentPasteEdit(item, token)) ?? item;
            const additionalEdit = resolvedItem.additionalEdit ? typeConvert.WorkspaceEdit.from(resolvedItem.additionalEdit, undefined) : undefined;
            return { additionalEdit };
        }
        releasePasteEdits(id) {
            this._cache.delete(id);
        }
    }
    class DocumentFormattingAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDocumentFormattingEdits(resource, options, token) {
            const document = this._documents.getDocument(resource);
            const value = await this._provider.provideDocumentFormattingEdits(document, options, token);
            if (Array.isArray(value)) {
                return value.map(typeConvert.TextEdit.from);
            }
            return undefined;
        }
    }
    class RangeFormattingAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDocumentRangeFormattingEdits(resource, range, options, token) {
            const document = this._documents.getDocument(resource);
            const ran = typeConvert.Range.to(range);
            const value = await this._provider.provideDocumentRangeFormattingEdits(document, ran, options, token);
            if (Array.isArray(value)) {
                return value.map(typeConvert.TextEdit.from);
            }
            return undefined;
        }
        async provideDocumentRangesFormattingEdits(resource, ranges, options, token) {
            (0, types_1.assertType)(typeof this._provider.provideDocumentRangesFormattingEdits === 'function', 'INVALID invocation of `provideDocumentRangesFormattingEdits`');
            const document = this._documents.getDocument(resource);
            const _ranges = ranges.map(typeConvert.Range.to);
            const value = await this._provider.provideDocumentRangesFormattingEdits(document, _ranges, options, token);
            if (Array.isArray(value)) {
                return value.map(typeConvert.TextEdit.from);
            }
            return undefined;
        }
    }
    class OnTypeFormattingAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this.autoFormatTriggerCharacters = []; // not here
        }
        async provideOnTypeFormattingEdits(resource, position, ch, options, token) {
            const document = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideOnTypeFormattingEdits(document, pos, ch, options, token);
            if (Array.isArray(value)) {
                return value.map(typeConvert.TextEdit.from);
            }
            return undefined;
        }
    }
    class NavigateTypeAdapter {
        constructor(_provider, _logService) {
            this._provider = _provider;
            this._logService = _logService;
            this._cache = new cache_1.Cache('WorkspaceSymbols');
        }
        async provideWorkspaceSymbols(search, token) {
            const value = await this._provider.provideWorkspaceSymbols(search, token);
            if (!(0, arrays_1.isNonEmptyArray)(value)) {
                return { symbols: [] };
            }
            const sid = this._cache.add(value);
            const result = {
                cacheId: sid,
                symbols: []
            };
            for (let i = 0; i < value.length; i++) {
                const item = value[i];
                if (!item || !item.name) {
                    this._logService.warn('INVALID SymbolInformation', item);
                    continue;
                }
                result.symbols.push({
                    ...typeConvert.WorkspaceSymbol.from(item),
                    cacheId: [sid, i]
                });
            }
            return result;
        }
        async resolveWorkspaceSymbol(symbol, token) {
            if (typeof this._provider.resolveWorkspaceSymbol !== 'function') {
                return symbol;
            }
            if (!symbol.cacheId) {
                return symbol;
            }
            const item = this._cache.get(...symbol.cacheId);
            if (item) {
                const value = await this._provider.resolveWorkspaceSymbol(item, token);
                return value && (0, objects_1.mixin)(symbol, typeConvert.WorkspaceSymbol.from(value), true);
            }
            return undefined;
        }
        releaseWorkspaceSymbols(id) {
            this._cache.delete(id);
        }
    }
    class RenameAdapter {
        static supportsResolving(provider) {
            return typeof provider.prepareRename === 'function';
        }
        constructor(_documents, _provider, _logService) {
            this._documents = _documents;
            this._provider = _provider;
            this._logService = _logService;
        }
        async provideRenameEdits(resource, position, newName, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            try {
                const value = await this._provider.provideRenameEdits(doc, pos, newName, token);
                if (!value) {
                    return undefined;
                }
                return typeConvert.WorkspaceEdit.from(value);
            }
            catch (err) {
                const rejectReason = RenameAdapter._asMessage(err);
                if (rejectReason) {
                    return { rejectReason, edits: undefined };
                }
                else {
                    // generic error
                    return Promise.reject(err);
                }
            }
        }
        async resolveRenameLocation(resource, position, token) {
            if (typeof this._provider.prepareRename !== 'function') {
                return Promise.resolve(undefined);
            }
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            try {
                const rangeOrLocation = await this._provider.prepareRename(doc, pos, token);
                let range;
                let text;
                if (extHostTypes_1.Range.isRange(rangeOrLocation)) {
                    range = rangeOrLocation;
                    text = doc.getText(rangeOrLocation);
                }
                else if ((0, types_1.isObject)(rangeOrLocation)) {
                    range = rangeOrLocation.range;
                    text = rangeOrLocation.placeholder;
                }
                if (!range || !text) {
                    return undefined;
                }
                if (range.start.line > pos.line || range.end.line < pos.line) {
                    this._logService.warn('INVALID rename location: position line must be within range start/end lines');
                    return undefined;
                }
                return { range: typeConvert.Range.from(range), text };
            }
            catch (err) {
                const rejectReason = RenameAdapter._asMessage(err);
                if (rejectReason) {
                    return { rejectReason, range: undefined, text: undefined };
                }
                else {
                    return Promise.reject(err);
                }
            }
        }
        static _asMessage(err) {
            if (typeof err === 'string') {
                return err;
            }
            else if (err instanceof Error && typeof err.message === 'string') {
                return err.message;
            }
            else {
                return undefined;
            }
        }
    }
    class NewSymbolNamesAdapter {
        constructor(_documents, _provider, _logService) {
            this._documents = _documents;
            this._provider = _provider;
            this._logService = _logService;
        }
        async provideNewSymbolNames(resource, range, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Range.to(range);
            try {
                const value = await this._provider.provideNewSymbolNames(doc, pos, token);
                if (!value) {
                    return undefined;
                }
                return value.map(v => typeof v === 'string' /* @ulugbekna: for backward compatibility because `value` used to be just `string[]` */
                    ? { newSymbolName: v }
                    : { newSymbolName: v.newSymbolName, tags: v.tags });
            }
            catch (err) {
                this._logService.error(NewSymbolNamesAdapter._asMessage(err) ?? JSON.stringify(err, null, '\t') /* @ulugbekna: assuming `err` doesn't have circular references that could result in an exception when converting to JSON */);
                return undefined;
            }
        }
        // @ulugbekna: this method is also defined in RenameAdapter but seems OK to be duplicated
        static _asMessage(err) {
            if (typeof err === 'string') {
                return err;
            }
            else if (err instanceof Error && typeof err.message === 'string') {
                return err.message;
            }
            else {
                return undefined;
            }
        }
    }
    class SemanticTokensPreviousResult {
        constructor(resultId, tokens) {
            this.resultId = resultId;
            this.tokens = tokens;
        }
    }
    class DocumentSemanticTokensAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._nextResultId = 1;
            this._previousResults = new Map();
        }
        async provideDocumentSemanticTokens(resource, previousResultId, token) {
            const doc = this._documents.getDocument(resource);
            const previousResult = (previousResultId !== 0 ? this._previousResults.get(previousResultId) : null);
            let value = typeof previousResult?.resultId === 'string' && typeof this._provider.provideDocumentSemanticTokensEdits === 'function'
                ? await this._provider.provideDocumentSemanticTokensEdits(doc, previousResult.resultId, token)
                : await this._provider.provideDocumentSemanticTokens(doc, token);
            if (previousResult) {
                this._previousResults.delete(previousResultId);
            }
            if (!value) {
                return null;
            }
            value = DocumentSemanticTokensAdapter._fixProvidedSemanticTokens(value);
            return this._send(DocumentSemanticTokensAdapter._convertToEdits(previousResult, value), value);
        }
        async releaseDocumentSemanticColoring(semanticColoringResultId) {
            this._previousResults.delete(semanticColoringResultId);
        }
        static _fixProvidedSemanticTokens(v) {
            if (DocumentSemanticTokensAdapter._isSemanticTokens(v)) {
                if (DocumentSemanticTokensAdapter._isCorrectSemanticTokens(v)) {
                    return v;
                }
                return new extHostTypes_1.SemanticTokens(new Uint32Array(v.data), v.resultId);
            }
            else if (DocumentSemanticTokensAdapter._isSemanticTokensEdits(v)) {
                if (DocumentSemanticTokensAdapter._isCorrectSemanticTokensEdits(v)) {
                    return v;
                }
                return new extHostTypes_1.SemanticTokensEdits(v.edits.map(edit => new extHostTypes_1.SemanticTokensEdit(edit.start, edit.deleteCount, edit.data ? new Uint32Array(edit.data) : edit.data)), v.resultId);
            }
            return v;
        }
        static _isSemanticTokens(v) {
            return v && !!(v.data);
        }
        static _isCorrectSemanticTokens(v) {
            return (v.data instanceof Uint32Array);
        }
        static _isSemanticTokensEdits(v) {
            return v && Array.isArray(v.edits);
        }
        static _isCorrectSemanticTokensEdits(v) {
            for (const edit of v.edits) {
                if (!(edit.data instanceof Uint32Array)) {
                    return false;
                }
            }
            return true;
        }
        static _convertToEdits(previousResult, newResult) {
            if (!DocumentSemanticTokensAdapter._isSemanticTokens(newResult)) {
                return newResult;
            }
            if (!previousResult || !previousResult.tokens) {
                return newResult;
            }
            const oldData = previousResult.tokens;
            const oldLength = oldData.length;
            const newData = newResult.data;
            const newLength = newData.length;
            let commonPrefixLength = 0;
            const maxCommonPrefixLength = Math.min(oldLength, newLength);
            while (commonPrefixLength < maxCommonPrefixLength && oldData[commonPrefixLength] === newData[commonPrefixLength]) {
                commonPrefixLength++;
            }
            if (commonPrefixLength === oldLength && commonPrefixLength === newLength) {
                // complete overlap!
                return new extHostTypes_1.SemanticTokensEdits([], newResult.resultId);
            }
            let commonSuffixLength = 0;
            const maxCommonSuffixLength = maxCommonPrefixLength - commonPrefixLength;
            while (commonSuffixLength < maxCommonSuffixLength && oldData[oldLength - commonSuffixLength - 1] === newData[newLength - commonSuffixLength - 1]) {
                commonSuffixLength++;
            }
            return new extHostTypes_1.SemanticTokensEdits([{
                    start: commonPrefixLength,
                    deleteCount: (oldLength - commonPrefixLength - commonSuffixLength),
                    data: newData.subarray(commonPrefixLength, newLength - commonSuffixLength)
                }], newResult.resultId);
        }
        _send(value, original) {
            if (DocumentSemanticTokensAdapter._isSemanticTokens(value)) {
                const myId = this._nextResultId++;
                this._previousResults.set(myId, new SemanticTokensPreviousResult(value.resultId, value.data));
                return (0, semanticTokensDto_1.encodeSemanticTokensDto)({
                    id: myId,
                    type: 'full',
                    data: value.data
                });
            }
            if (DocumentSemanticTokensAdapter._isSemanticTokensEdits(value)) {
                const myId = this._nextResultId++;
                if (DocumentSemanticTokensAdapter._isSemanticTokens(original)) {
                    // store the original
                    this._previousResults.set(myId, new SemanticTokensPreviousResult(original.resultId, original.data));
                }
                else {
                    this._previousResults.set(myId, new SemanticTokensPreviousResult(value.resultId));
                }
                return (0, semanticTokensDto_1.encodeSemanticTokensDto)({
                    id: myId,
                    type: 'delta',
                    deltas: (value.edits || []).map(edit => ({ start: edit.start, deleteCount: edit.deleteCount, data: edit.data }))
                });
            }
            return null;
        }
    }
    class DocumentRangeSemanticTokensAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDocumentRangeSemanticTokens(resource, range, token) {
            const doc = this._documents.getDocument(resource);
            const value = await this._provider.provideDocumentRangeSemanticTokens(doc, typeConvert.Range.to(range), token);
            if (!value) {
                return null;
            }
            return this._send(value);
        }
        _send(value) {
            return (0, semanticTokensDto_1.encodeSemanticTokensDto)({
                id: 0,
                type: 'full',
                data: value.data
            });
        }
    }
    class CompletionsAdapter {
        static supportsResolving(provider) {
            return typeof provider.resolveCompletionItem === 'function';
        }
        constructor(_documents, _commands, _provider, _apiDeprecation, _extension) {
            this._documents = _documents;
            this._commands = _commands;
            this._provider = _provider;
            this._apiDeprecation = _apiDeprecation;
            this._extension = _extension;
            this._cache = new cache_1.Cache('CompletionItem');
            this._disposables = new Map();
        }
        async provideCompletionItems(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            // The default insert/replace ranges. It's important to compute them
            // before asynchronously asking the provider for its results. See
            // https://github.com/microsoft/vscode/issues/83400#issuecomment-546851421
            const replaceRange = doc.getWordRangeAtPosition(pos) || new extHostTypes_1.Range(pos, pos);
            const insertRange = replaceRange.with({ end: pos });
            const sw = new stopwatch_1.StopWatch();
            const itemsOrList = await this._provider.provideCompletionItems(doc, pos, token, typeConvert.CompletionContext.to(context));
            if (!itemsOrList) {
                // undefined and null are valid results
                return undefined;
            }
            if (token.isCancellationRequested) {
                // cancelled -> return without further ado, esp no caching
                // of results as they will leak
                return undefined;
            }
            const list = Array.isArray(itemsOrList) ? new extHostTypes_1.CompletionList(itemsOrList) : itemsOrList;
            // keep result for providers that support resolving
            const pid = CompletionsAdapter.supportsResolving(this._provider) ? this._cache.add(list.items) : this._cache.add([]);
            const disposables = new lifecycle_1.DisposableStore();
            this._disposables.set(pid, disposables);
            const completions = [];
            const result = {
                x: pid,
                ["b" /* extHostProtocol.ISuggestResultDtoField.completions */]: completions,
                ["a" /* extHostProtocol.ISuggestResultDtoField.defaultRanges */]: { replace: typeConvert.Range.from(replaceRange), insert: typeConvert.Range.from(insertRange) },
                ["c" /* extHostProtocol.ISuggestResultDtoField.isIncomplete */]: list.isIncomplete || undefined,
                ["d" /* extHostProtocol.ISuggestResultDtoField.duration */]: sw.elapsed()
            };
            for (let i = 0; i < list.items.length; i++) {
                const item = list.items[i];
                // check for bad completion item first
                const dto = this._convertCompletionItem(item, [pid, i], insertRange, replaceRange);
                completions.push(dto);
            }
            return result;
        }
        async resolveCompletionItem(id, token) {
            if (typeof this._provider.resolveCompletionItem !== 'function') {
                return undefined;
            }
            const item = this._cache.get(...id);
            if (!item) {
                return undefined;
            }
            const dto1 = this._convertCompletionItem(item, id);
            const resolvedItem = await this._provider.resolveCompletionItem(item, token);
            if (!resolvedItem) {
                return undefined;
            }
            const dto2 = this._convertCompletionItem(resolvedItem, id);
            if (dto1["h" /* extHostProtocol.ISuggestDataDtoField.insertText */] !== dto2["h" /* extHostProtocol.ISuggestDataDtoField.insertText */]
                || dto1["i" /* extHostProtocol.ISuggestDataDtoField.insertTextRules */] !== dto2["i" /* extHostProtocol.ISuggestDataDtoField.insertTextRules */]) {
                this._apiDeprecation.report('CompletionItem.insertText', this._extension, 'extension MAY NOT change \'insertText\' of a CompletionItem during resolve');
            }
            if (dto1["n" /* extHostProtocol.ISuggestDataDtoField.commandIdent */] !== dto2["n" /* extHostProtocol.ISuggestDataDtoField.commandIdent */]
                || dto1["o" /* extHostProtocol.ISuggestDataDtoField.commandId */] !== dto2["o" /* extHostProtocol.ISuggestDataDtoField.commandId */]
                || !(0, objects_1.equals)(dto1["p" /* extHostProtocol.ISuggestDataDtoField.commandArguments */], dto2["p" /* extHostProtocol.ISuggestDataDtoField.commandArguments */])) {
                this._apiDeprecation.report('CompletionItem.command', this._extension, 'extension MAY NOT change \'command\' of a CompletionItem during resolve');
            }
            return {
                ...dto1,
                ["d" /* extHostProtocol.ISuggestDataDtoField.documentation */]: dto2["d" /* extHostProtocol.ISuggestDataDtoField.documentation */],
                ["c" /* extHostProtocol.ISuggestDataDtoField.detail */]: dto2["c" /* extHostProtocol.ISuggestDataDtoField.detail */],
                ["l" /* extHostProtocol.ISuggestDataDtoField.additionalTextEdits */]: dto2["l" /* extHostProtocol.ISuggestDataDtoField.additionalTextEdits */],
                // (fishy) async insertText
                ["h" /* extHostProtocol.ISuggestDataDtoField.insertText */]: dto2["h" /* extHostProtocol.ISuggestDataDtoField.insertText */],
                ["i" /* extHostProtocol.ISuggestDataDtoField.insertTextRules */]: dto2["i" /* extHostProtocol.ISuggestDataDtoField.insertTextRules */],
                // (fishy) async command
                ["n" /* extHostProtocol.ISuggestDataDtoField.commandIdent */]: dto2["n" /* extHostProtocol.ISuggestDataDtoField.commandIdent */],
                ["o" /* extHostProtocol.ISuggestDataDtoField.commandId */]: dto2["o" /* extHostProtocol.ISuggestDataDtoField.commandId */],
                ["p" /* extHostProtocol.ISuggestDataDtoField.commandArguments */]: dto2["p" /* extHostProtocol.ISuggestDataDtoField.commandArguments */],
            };
        }
        releaseCompletionItems(id) {
            this._disposables.get(id)?.dispose();
            this._disposables.delete(id);
            this._cache.delete(id);
        }
        _convertCompletionItem(item, id, defaultInsertRange, defaultReplaceRange) {
            const disposables = this._disposables.get(id[0]);
            if (!disposables) {
                throw Error('DisposableStore is missing...');
            }
            const command = this._commands.toInternal(item.command, disposables);
            const result = {
                //
                x: id,
                //
                ["a" /* extHostProtocol.ISuggestDataDtoField.label */]: item.label,
                ["b" /* extHostProtocol.ISuggestDataDtoField.kind */]: item.kind !== undefined ? typeConvert.CompletionItemKind.from(item.kind) : undefined,
                ["m" /* extHostProtocol.ISuggestDataDtoField.kindModifier */]: item.tags && item.tags.map(typeConvert.CompletionItemTag.from),
                ["c" /* extHostProtocol.ISuggestDataDtoField.detail */]: item.detail,
                ["d" /* extHostProtocol.ISuggestDataDtoField.documentation */]: typeof item.documentation === 'undefined' ? undefined : typeConvert.MarkdownString.fromStrict(item.documentation),
                ["e" /* extHostProtocol.ISuggestDataDtoField.sortText */]: item.sortText !== item.label ? item.sortText : undefined,
                ["f" /* extHostProtocol.ISuggestDataDtoField.filterText */]: item.filterText !== item.label ? item.filterText : undefined,
                ["g" /* extHostProtocol.ISuggestDataDtoField.preselect */]: item.preselect || undefined,
                ["i" /* extHostProtocol.ISuggestDataDtoField.insertTextRules */]: item.keepWhitespace ? 1 /* languages.CompletionItemInsertTextRule.KeepWhitespace */ : 0 /* languages.CompletionItemInsertTextRule.None */,
                ["k" /* extHostProtocol.ISuggestDataDtoField.commitCharacters */]: item.commitCharacters?.join(''),
                ["l" /* extHostProtocol.ISuggestDataDtoField.additionalTextEdits */]: item.additionalTextEdits && item.additionalTextEdits.map(typeConvert.TextEdit.from),
                ["n" /* extHostProtocol.ISuggestDataDtoField.commandIdent */]: command?.$ident,
                ["o" /* extHostProtocol.ISuggestDataDtoField.commandId */]: command?.id,
                ["p" /* extHostProtocol.ISuggestDataDtoField.commandArguments */]: command?.$ident ? undefined : command?.arguments, // filled in on main side from $ident
            };
            // 'insertText'-logic
            if (item.textEdit) {
                this._apiDeprecation.report('CompletionItem.textEdit', this._extension, `Use 'CompletionItem.insertText' and 'CompletionItem.range' instead.`);
                result["h" /* extHostProtocol.ISuggestDataDtoField.insertText */] = item.textEdit.newText;
            }
            else if (typeof item.insertText === 'string') {
                result["h" /* extHostProtocol.ISuggestDataDtoField.insertText */] = item.insertText;
            }
            else if (item.insertText instanceof extHostTypes_1.SnippetString) {
                result["h" /* extHostProtocol.ISuggestDataDtoField.insertText */] = item.insertText.value;
                result["i" /* extHostProtocol.ISuggestDataDtoField.insertTextRules */] |= 4 /* languages.CompletionItemInsertTextRule.InsertAsSnippet */;
            }
            // 'overwrite[Before|After]'-logic
            let range;
            if (item.textEdit) {
                range = item.textEdit.range;
            }
            else if (item.range) {
                range = item.range;
            }
            if (extHostTypes_1.Range.isRange(range)) {
                // "old" range
                result["j" /* extHostProtocol.ISuggestDataDtoField.range */] = typeConvert.Range.from(range);
            }
            else if (range && (!defaultInsertRange?.isEqual(range.inserting) || !defaultReplaceRange?.isEqual(range.replacing))) {
                // ONLY send range when it's different from the default ranges (safe bandwidth)
                result["j" /* extHostProtocol.ISuggestDataDtoField.range */] = {
                    insert: typeConvert.Range.from(range.inserting),
                    replace: typeConvert.Range.from(range.replacing)
                };
            }
            return result;
        }
    }
    class InlineCompletionAdapterBase {
        async provideInlineCompletions(resource, position, context, token) {
            return undefined;
        }
        disposeCompletions(pid) { }
        handleDidShowCompletionItem(pid, idx, updatedInsertText) { }
        handlePartialAccept(pid, idx, acceptedCharacters, info) { }
    }
    class InlineCompletionAdapter extends InlineCompletionAdapterBase {
        constructor(_extension, _documents, _provider, _commands) {
            super();
            this._extension = _extension;
            this._documents = _documents;
            this._provider = _provider;
            this._commands = _commands;
            this._references = new ReferenceMap();
            this._isAdditionsProposedApiEnabled = (0, extensions_2.isProposedApiEnabled)(this._extension, 'inlineCompletionsAdditions');
            this.languageTriggerKindToVSCodeTriggerKind = {
                [languages.InlineCompletionTriggerKind.Automatic]: extHostTypes_1.InlineCompletionTriggerKind.Automatic,
                [languages.InlineCompletionTriggerKind.Explicit]: extHostTypes_1.InlineCompletionTriggerKind.Invoke,
            };
        }
        get supportsHandleEvents() {
            return (0, extensions_2.isProposedApiEnabled)(this._extension, 'inlineCompletionsAdditions')
                && (typeof this._provider.handleDidShowCompletionItem === 'function'
                    || typeof this._provider.handleDidPartiallyAcceptCompletionItem === 'function');
        }
        async provideInlineCompletions(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const result = await this._provider.provideInlineCompletionItems(doc, pos, {
                selectedCompletionInfo: context.selectedSuggestionInfo
                    ? {
                        range: typeConvert.Range.to(context.selectedSuggestionInfo.range),
                        text: context.selectedSuggestionInfo.text
                    }
                    : undefined,
                triggerKind: this.languageTriggerKindToVSCodeTriggerKind[context.triggerKind]
            }, token);
            if (!result) {
                // undefined and null are valid results
                return undefined;
            }
            if (token.isCancellationRequested) {
                // cancelled -> return without further ado, esp no caching
                // of results as they will leak
                return undefined;
            }
            const normalizedResult = Array.isArray(result) ? result : result.items;
            const commands = this._isAdditionsProposedApiEnabled ? Array.isArray(result) ? [] : result.commands || [] : [];
            const enableForwardStability = this._isAdditionsProposedApiEnabled && !Array.isArray(result) ? result.enableForwardStability : undefined;
            let disposableStore = undefined;
            const pid = this._references.createReferenceId({
                dispose() {
                    disposableStore?.dispose();
                },
                items: normalizedResult
            });
            return {
                pid,
                items: normalizedResult.map((item, idx) => {
                    let command = undefined;
                    if (item.command) {
                        if (!disposableStore) {
                            disposableStore = new lifecycle_1.DisposableStore();
                        }
                        command = this._commands.toInternal(item.command, disposableStore);
                    }
                    const insertText = item.insertText;
                    return ({
                        insertText: typeof insertText === 'string' ? insertText : { snippet: insertText.value },
                        filterText: item.filterText,
                        range: item.range ? typeConvert.Range.from(item.range) : undefined,
                        command,
                        idx: idx,
                        completeBracketPairs: this._isAdditionsProposedApiEnabled ? item.completeBracketPairs : false,
                    });
                }),
                commands: commands.map(c => {
                    if (!disposableStore) {
                        disposableStore = new lifecycle_1.DisposableStore();
                    }
                    return this._commands.toInternal(c, disposableStore);
                }),
                suppressSuggestions: false,
                enableForwardStability,
            };
        }
        disposeCompletions(pid) {
            const data = this._references.disposeReferenceId(pid);
            data?.dispose();
        }
        handleDidShowCompletionItem(pid, idx, updatedInsertText) {
            const completionItem = this._references.get(pid)?.items[idx];
            if (completionItem) {
                if (this._provider.handleDidShowCompletionItem && this._isAdditionsProposedApiEnabled) {
                    this._provider.handleDidShowCompletionItem(completionItem, updatedInsertText);
                }
            }
        }
        handlePartialAccept(pid, idx, acceptedCharacters, info) {
            const completionItem = this._references.get(pid)?.items[idx];
            if (completionItem) {
                if (this._provider.handleDidPartiallyAcceptCompletionItem && this._isAdditionsProposedApiEnabled) {
                    this._provider.handleDidPartiallyAcceptCompletionItem(completionItem, acceptedCharacters);
                    this._provider.handleDidPartiallyAcceptCompletionItem(completionItem, typeConvert.PartialAcceptInfo.to(info));
                }
            }
        }
    }
    class InlineEditAdapter {
        async provideInlineEdits(uri, context, token) {
            const doc = this._documents.getDocument(uri);
            const result = await this._provider.provideInlineEdit(doc, {
                triggerKind: this.languageTriggerKindToVSCodeTriggerKind[context.triggerKind]
            }, token);
            if (!result) {
                // undefined and null are valid results
                return undefined;
            }
            if (token.isCancellationRequested) {
                // cancelled -> return without further ado, esp no caching
                // of results as they will leak
                return undefined;
            }
            let disposableStore = undefined;
            const pid = this._references.createReferenceId({
                dispose() {
                    disposableStore?.dispose();
                },
                item: result
            });
            let acceptCommand = undefined;
            if (result.accepted) {
                if (!disposableStore) {
                    disposableStore = new lifecycle_1.DisposableStore();
                }
                acceptCommand = this._commands.toInternal(result.accepted, disposableStore);
            }
            let rejectCommand = undefined;
            if (result.rejected) {
                if (!disposableStore) {
                    disposableStore = new lifecycle_1.DisposableStore();
                }
                rejectCommand = this._commands.toInternal(result.rejected, disposableStore);
            }
            const langResult = {
                pid,
                text: result.text,
                range: typeConvert.Range.from(result.range),
                accepted: acceptCommand,
                rejected: rejectCommand,
            };
            return langResult;
        }
        disposeEdit(pid) {
            const data = this._references.disposeReferenceId(pid);
            data?.dispose();
        }
        constructor(_extension, _documents, _provider, _commands) {
            this._documents = _documents;
            this._provider = _provider;
            this._commands = _commands;
            this._references = new ReferenceMap();
            this.languageTriggerKindToVSCodeTriggerKind = {
                [languages.InlineEditTriggerKind.Automatic]: extHostTypes_1.InlineEditTriggerKind.Automatic,
                [languages.InlineEditTriggerKind.Invoke]: extHostTypes_1.InlineEditTriggerKind.Invoke,
            };
        }
    }
    class ReferenceMap {
        constructor() {
            this._references = new Map();
            this._idPool = 1;
        }
        createReferenceId(value) {
            const id = this._idPool++;
            this._references.set(id, value);
            return id;
        }
        disposeReferenceId(referenceId) {
            const value = this._references.get(referenceId);
            this._references.delete(referenceId);
            return value;
        }
        get(referenceId) {
            return this._references.get(referenceId);
        }
    }
    class SignatureHelpAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._cache = new cache_1.Cache('SignatureHelp');
        }
        async provideSignatureHelp(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const vscodeContext = this.reviveContext(context);
            const value = await this._provider.provideSignatureHelp(doc, pos, token, vscodeContext);
            if (value) {
                const id = this._cache.add([value]);
                return { ...typeConvert.SignatureHelp.from(value), id };
            }
            return undefined;
        }
        reviveContext(context) {
            let activeSignatureHelp = undefined;
            if (context.activeSignatureHelp) {
                const revivedSignatureHelp = typeConvert.SignatureHelp.to(context.activeSignatureHelp);
                const saved = this._cache.get(context.activeSignatureHelp.id, 0);
                if (saved) {
                    activeSignatureHelp = saved;
                    activeSignatureHelp.activeSignature = revivedSignatureHelp.activeSignature;
                    activeSignatureHelp.activeParameter = revivedSignatureHelp.activeParameter;
                }
                else {
                    activeSignatureHelp = revivedSignatureHelp;
                }
            }
            return { ...context, activeSignatureHelp };
        }
        releaseSignatureHelp(id) {
            this._cache.delete(id);
        }
    }
    class InlayHintsAdapter {
        constructor(_documents, _commands, _provider, _logService, _extension) {
            this._documents = _documents;
            this._commands = _commands;
            this._provider = _provider;
            this._logService = _logService;
            this._extension = _extension;
            this._cache = new cache_1.Cache('InlayHints');
            this._disposables = new Map();
        }
        async provideInlayHints(resource, ran, token) {
            const doc = this._documents.getDocument(resource);
            const range = typeConvert.Range.to(ran);
            const hints = await this._provider.provideInlayHints(doc, range, token);
            if (!Array.isArray(hints) || hints.length === 0) {
                // bad result
                this._logService.trace(`[InlayHints] NO inlay hints from '${this._extension.identifier.value}' for range ${JSON.stringify(ran)}`);
                return undefined;
            }
            if (token.isCancellationRequested) {
                // cancelled -> return without further ado, esp no caching
                // of results as they will leak
                return undefined;
            }
            const pid = this._cache.add(hints);
            this._disposables.set(pid, new lifecycle_1.DisposableStore());
            const result = { hints: [], cacheId: pid };
            for (let i = 0; i < hints.length; i++) {
                if (this._isValidInlayHint(hints[i], range)) {
                    result.hints.push(this._convertInlayHint(hints[i], [pid, i]));
                }
            }
            this._logService.trace(`[InlayHints] ${result.hints.length} inlay hints from '${this._extension.identifier.value}' for range ${JSON.stringify(ran)}`);
            return result;
        }
        async resolveInlayHint(id, token) {
            if (typeof this._provider.resolveInlayHint !== 'function') {
                return undefined;
            }
            const item = this._cache.get(...id);
            if (!item) {
                return undefined;
            }
            const hint = await this._provider.resolveInlayHint(item, token);
            if (!hint) {
                return undefined;
            }
            if (!this._isValidInlayHint(hint)) {
                return undefined;
            }
            return this._convertInlayHint(hint, id);
        }
        releaseHints(id) {
            this._disposables.get(id)?.dispose();
            this._disposables.delete(id);
            this._cache.delete(id);
        }
        _isValidInlayHint(hint, range) {
            if (hint.label.length === 0 || Array.isArray(hint.label) && hint.label.every(part => part.value.length === 0)) {
                console.log('INVALID inlay hint, empty label', hint);
                return false;
            }
            if (range && !range.contains(hint.position)) {
                // console.log('INVALID inlay hint, position outside range', range, hint);
                return false;
            }
            return true;
        }
        _convertInlayHint(hint, id) {
            const disposables = this._disposables.get(id[0]);
            if (!disposables) {
                throw Error('DisposableStore is missing...');
            }
            const result = {
                label: '', // fill-in below
                cacheId: id,
                tooltip: typeConvert.MarkdownString.fromStrict(hint.tooltip),
                position: typeConvert.Position.from(hint.position),
                textEdits: hint.textEdits && hint.textEdits.map(typeConvert.TextEdit.from),
                kind: hint.kind && typeConvert.InlayHintKind.from(hint.kind),
                paddingLeft: hint.paddingLeft,
                paddingRight: hint.paddingRight,
            };
            if (typeof hint.label === 'string') {
                result.label = hint.label;
            }
            else {
                const parts = [];
                result.label = parts;
                for (const part of hint.label) {
                    if (!part.value) {
                        console.warn('INVALID inlay hint, empty label part', this._extension.identifier.value);
                        continue;
                    }
                    const part2 = {
                        label: part.value,
                        tooltip: typeConvert.MarkdownString.fromStrict(part.tooltip)
                    };
                    if (extHostTypes_1.Location.isLocation(part.location)) {
                        part2.location = typeConvert.location.from(part.location);
                    }
                    if (part.command) {
                        part2.command = this._commands.toInternal(part.command, disposables);
                    }
                    parts.push(part2);
                }
            }
            return result;
        }
    }
    class LinkProviderAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._cache = new cache_1.Cache('DocumentLink');
        }
        async provideLinks(resource, token) {
            const doc = this._documents.getDocument(resource);
            const links = await this._provider.provideDocumentLinks(doc, token);
            if (!Array.isArray(links) || links.length === 0) {
                // bad result
                return undefined;
            }
            if (token.isCancellationRequested) {
                // cancelled -> return without further ado, esp no caching
                // of results as they will leak
                return undefined;
            }
            if (typeof this._provider.resolveDocumentLink !== 'function') {
                // no resolve -> no caching
                return { links: links.filter(LinkProviderAdapter._validateLink).map(typeConvert.DocumentLink.from) };
            }
            else {
                // cache links for future resolving
                const pid = this._cache.add(links);
                const result = { links: [], cacheId: pid };
                for (let i = 0; i < links.length; i++) {
                    if (!LinkProviderAdapter._validateLink(links[i])) {
                        continue;
                    }
                    const dto = typeConvert.DocumentLink.from(links[i]);
                    dto.cacheId = [pid, i];
                    result.links.push(dto);
                }
                return result;
            }
        }
        static _validateLink(link) {
            if (link.target && link.target.path.length > 50_000) {
                console.warn('DROPPING link because it is too long');
                return false;
            }
            return true;
        }
        async resolveLink(id, token) {
            if (typeof this._provider.resolveDocumentLink !== 'function') {
                return undefined;
            }
            const item = this._cache.get(...id);
            if (!item) {
                return undefined;
            }
            const link = await this._provider.resolveDocumentLink(item, token);
            if (!link || !LinkProviderAdapter._validateLink(link)) {
                return undefined;
            }
            return typeConvert.DocumentLink.from(link);
        }
        releaseLinks(id) {
            this._cache.delete(id);
        }
    }
    class ColorProviderAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideColors(resource, token) {
            const doc = this._documents.getDocument(resource);
            const colors = await this._provider.provideDocumentColors(doc, token);
            if (!Array.isArray(colors)) {
                return [];
            }
            const colorInfos = colors.map(ci => {
                return {
                    color: typeConvert.Color.from(ci.color),
                    range: typeConvert.Range.from(ci.range)
                };
            });
            return colorInfos;
        }
        async provideColorPresentations(resource, raw, token) {
            const document = this._documents.getDocument(resource);
            const range = typeConvert.Range.to(raw.range);
            const color = typeConvert.Color.to(raw.color);
            const value = await this._provider.provideColorPresentations(color, { document, range }, token);
            if (!Array.isArray(value)) {
                return undefined;
            }
            return value.map(typeConvert.ColorPresentation.from);
        }
    }
    class FoldingProviderAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideFoldingRanges(resource, context, token) {
            const doc = this._documents.getDocument(resource);
            const ranges = await this._provider.provideFoldingRanges(doc, context, token);
            if (!Array.isArray(ranges)) {
                return undefined;
            }
            return ranges.map(typeConvert.FoldingRange.from);
        }
    }
    class SelectionRangeAdapter {
        constructor(_documents, _provider, _logService) {
            this._documents = _documents;
            this._provider = _provider;
            this._logService = _logService;
        }
        async provideSelectionRanges(resource, pos, token) {
            const document = this._documents.getDocument(resource);
            const positions = pos.map(typeConvert.Position.to);
            const allProviderRanges = await this._provider.provideSelectionRanges(document, positions, token);
            if (!(0, arrays_1.isNonEmptyArray)(allProviderRanges)) {
                return [];
            }
            if (allProviderRanges.length !== positions.length) {
                this._logService.warn('BAD selection ranges, provider must return ranges for each position');
                return [];
            }
            const allResults = [];
            for (let i = 0; i < positions.length; i++) {
                const oneResult = [];
                allResults.push(oneResult);
                let last = positions[i];
                let selectionRange = allProviderRanges[i];
                while (true) {
                    if (!selectionRange.range.contains(last)) {
                        throw new Error('INVALID selection range, must contain the previous range');
                    }
                    oneResult.push(typeConvert.SelectionRange.from(selectionRange));
                    if (!selectionRange.parent) {
                        break;
                    }
                    last = selectionRange.range;
                    selectionRange = selectionRange.parent;
                }
            }
            return allResults;
        }
    }
    class CallHierarchyAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._idPool = new idGenerator_1.IdGenerator('');
            this._cache = new Map();
        }
        async prepareSession(uri, position, token) {
            const doc = this._documents.getDocument(uri);
            const pos = typeConvert.Position.to(position);
            const items = await this._provider.prepareCallHierarchy(doc, pos, token);
            if (!items) {
                return undefined;
            }
            const sessionId = this._idPool.nextId();
            this._cache.set(sessionId, new Map());
            if (Array.isArray(items)) {
                return items.map(item => this._cacheAndConvertItem(sessionId, item));
            }
            else {
                return [this._cacheAndConvertItem(sessionId, items)];
            }
        }
        async provideCallsTo(sessionId, itemId, token) {
            const item = this._itemFromCache(sessionId, itemId);
            if (!item) {
                throw new Error('missing call hierarchy item');
            }
            const calls = await this._provider.provideCallHierarchyIncomingCalls(item, token);
            if (!calls) {
                return undefined;
            }
            return calls.map(call => {
                return {
                    from: this._cacheAndConvertItem(sessionId, call.from),
                    fromRanges: call.fromRanges.map(r => typeConvert.Range.from(r))
                };
            });
        }
        async provideCallsFrom(sessionId, itemId, token) {
            const item = this._itemFromCache(sessionId, itemId);
            if (!item) {
                throw new Error('missing call hierarchy item');
            }
            const calls = await this._provider.provideCallHierarchyOutgoingCalls(item, token);
            if (!calls) {
                return undefined;
            }
            return calls.map(call => {
                return {
                    to: this._cacheAndConvertItem(sessionId, call.to),
                    fromRanges: call.fromRanges.map(r => typeConvert.Range.from(r))
                };
            });
        }
        releaseSession(sessionId) {
            this._cache.delete(sessionId);
        }
        _cacheAndConvertItem(sessionId, item) {
            const map = this._cache.get(sessionId);
            const dto = typeConvert.CallHierarchyItem.from(item, sessionId, map.size.toString(36));
            map.set(dto._itemId, item);
            return dto;
        }
        _itemFromCache(sessionId, itemId) {
            const map = this._cache.get(sessionId);
            return map?.get(itemId);
        }
    }
    class TypeHierarchyAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._idPool = new idGenerator_1.IdGenerator('');
            this._cache = new Map();
        }
        async prepareSession(uri, position, token) {
            const doc = this._documents.getDocument(uri);
            const pos = typeConvert.Position.to(position);
            const items = await this._provider.prepareTypeHierarchy(doc, pos, token);
            if (!items) {
                return undefined;
            }
            const sessionId = this._idPool.nextId();
            this._cache.set(sessionId, new Map());
            if (Array.isArray(items)) {
                return items.map(item => this._cacheAndConvertItem(sessionId, item));
            }
            else {
                return [this._cacheAndConvertItem(sessionId, items)];
            }
        }
        async provideSupertypes(sessionId, itemId, token) {
            const item = this._itemFromCache(sessionId, itemId);
            if (!item) {
                throw new Error('missing type hierarchy item');
            }
            const supertypes = await this._provider.provideTypeHierarchySupertypes(item, token);
            if (!supertypes) {
                return undefined;
            }
            return supertypes.map(supertype => {
                return this._cacheAndConvertItem(sessionId, supertype);
            });
        }
        async provideSubtypes(sessionId, itemId, token) {
            const item = this._itemFromCache(sessionId, itemId);
            if (!item) {
                throw new Error('missing type hierarchy item');
            }
            const subtypes = await this._provider.provideTypeHierarchySubtypes(item, token);
            if (!subtypes) {
                return undefined;
            }
            return subtypes.map(subtype => {
                return this._cacheAndConvertItem(sessionId, subtype);
            });
        }
        releaseSession(sessionId) {
            this._cache.delete(sessionId);
        }
        _cacheAndConvertItem(sessionId, item) {
            const map = this._cache.get(sessionId);
            const dto = typeConvert.TypeHierarchyItem.from(item, sessionId, map.size.toString(36));
            map.set(dto._itemId, item);
            return dto;
        }
        _itemFromCache(sessionId, itemId) {
            const map = this._cache.get(sessionId);
            return map?.get(itemId);
        }
    }
    class DocumentOnDropEditAdapter {
        constructor(_proxy, _documents, _provider, _handle, _extension) {
            this._proxy = _proxy;
            this._documents = _documents;
            this._provider = _provider;
            this._handle = _handle;
            this._extension = _extension;
        }
        async provideDocumentOnDropEdits(requestId, uri, position, dataTransferDto, token) {
            const doc = this._documents.getDocument(uri);
            const pos = typeConvert.Position.to(position);
            const dataTransfer = typeConvert.DataTransfer.toDataTransfer(dataTransferDto, async (id) => {
                return (await this._proxy.$resolveDocumentOnDropFileData(this._handle, requestId, id)).buffer;
            });
            const edits = await this._provider.provideDocumentDropEdits(doc, pos, dataTransfer, token);
            if (!edits) {
                return undefined;
            }
            return (0, arrays_1.asArray)(edits).map((edit) => ({
                title: edit.title ?? (0, nls_1.localize)('defaultDropLabel', "Drop using '{0}' extension", this._extension.displayName || this._extension.name),
                kind: edit.kind?.value,
                yieldTo: edit.yieldTo?.map(x => x.value),
                insertText: typeof edit.insertText === 'string' ? edit.insertText : { snippet: edit.insertText.value },
                additionalEdit: edit.additionalEdit ? typeConvert.WorkspaceEdit.from(edit.additionalEdit, undefined) : undefined,
            }));
        }
    }
    class MappedEditsAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideMappedEdits(resource, codeBlocks, context, token) {
            const uri = uri_1.URI.revive(resource);
            const doc = this._documents.getDocument(uri);
            const usedContext = context.documents.map((docSubArray) => docSubArray.map((r) => {
                return {
                    uri: uri_1.URI.revive(r.uri),
                    version: r.version,
                    ranges: r.ranges.map((range) => typeConvert.Range.to(range)),
                };
            }));
            const ctx = {
                documents: usedContext,
                selections: usedContext[0]?.[0]?.ranges ?? [] // @ulugbekna: this is a hack for backward compatibility
            };
            const mappedEdits = await this._provider.provideMappedEdits(doc, codeBlocks, ctx, token);
            return mappedEdits ? typeConvert.WorkspaceEdit.from(mappedEdits) : null;
        }
    }
    class AdapterData {
        constructor(adapter, extension) {
            this.adapter = adapter;
            this.extension = extension;
        }
    }
    class ExtHostLanguageFeatures {
        static { this._handlePool = 0; }
        constructor(mainContext, _uriTransformer, _documents, _commands, _diagnostics, _logService, _apiDeprecation, _extensionTelemetry) {
            this._uriTransformer = _uriTransformer;
            this._documents = _documents;
            this._commands = _commands;
            this._diagnostics = _diagnostics;
            this._logService = _logService;
            this._apiDeprecation = _apiDeprecation;
            this._extensionTelemetry = _extensionTelemetry;
            this._adapter = new Map();
            this._proxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadLanguageFeatures);
        }
        _transformDocumentSelector(selector, extension) {
            return typeConvert.DocumentSelector.from(selector, this._uriTransformer, extension);
        }
        _createDisposable(handle) {
            return new extHostTypes_1.Disposable(() => {
                this._adapter.delete(handle);
                this._proxy.$unregister(handle);
            });
        }
        _nextHandle() {
            return ExtHostLanguageFeatures._handlePool++;
        }
        async _withAdapter(handle, ctor, callback, fallbackValue, tokenToRaceAgainst, doNotLog = false) {
            const data = this._adapter.get(handle);
            if (!data || !(data.adapter instanceof ctor)) {
                return fallbackValue;
            }
            const t1 = Date.now();
            if (!doNotLog) {
                this._logService.trace(`[${data.extension.identifier.value}] INVOKE provider '${callback.toString().replace(/[\r\n]/g, '')}'`);
            }
            const result = callback(data.adapter, data.extension);
            // logging,tracing
            Promise.resolve(result).catch(err => {
                if (!(0, errors_1.isCancellationError)(err)) {
                    this._logService.error(`[${data.extension.identifier.value}] provider FAILED`);
                    this._logService.error(err);
                    this._extensionTelemetry.onExtensionError(data.extension.identifier, err);
                }
            }).finally(() => {
                if (!doNotLog) {
                    this._logService.trace(`[${data.extension.identifier.value}] provider DONE after ${Date.now() - t1}ms`);
                }
            });
            if (cancellation_1.CancellationToken.isCancellationToken(tokenToRaceAgainst)) {
                return (0, async_1.raceCancellationError)(result, tokenToRaceAgainst);
            }
            return result;
        }
        _addNewAdapter(adapter, extension) {
            const handle = this._nextHandle();
            this._adapter.set(handle, new AdapterData(adapter, extension));
            return handle;
        }
        static _extLabel(ext) {
            return ext.displayName || ext.name;
        }
        // --- outline
        registerDocumentSymbolProvider(extension, selector, provider, metadata) {
            const handle = this._addNewAdapter(new DocumentSymbolAdapter(this._documents, provider), extension);
            const displayName = (metadata && metadata.label) || ExtHostLanguageFeatures._extLabel(extension);
            this._proxy.$registerDocumentSymbolProvider(handle, this._transformDocumentSelector(selector, extension), displayName);
            return this._createDisposable(handle);
        }
        $provideDocumentSymbols(handle, resource, token) {
            return this._withAdapter(handle, DocumentSymbolAdapter, adapter => adapter.provideDocumentSymbols(uri_1.URI.revive(resource), token), undefined, token);
        }
        // --- code lens
        registerCodeLensProvider(extension, selector, provider) {
            const handle = this._nextHandle();
            const eventHandle = typeof provider.onDidChangeCodeLenses === 'function' ? this._nextHandle() : undefined;
            this._adapter.set(handle, new AdapterData(new CodeLensAdapter(this._documents, this._commands.converter, provider, extension, this._extensionTelemetry, this._logService), extension));
            this._proxy.$registerCodeLensSupport(handle, this._transformDocumentSelector(selector, extension), eventHandle);
            let result = this._createDisposable(handle);
            if (eventHandle !== undefined) {
                const subscription = provider.onDidChangeCodeLenses(_ => this._proxy.$emitCodeLensEvent(eventHandle));
                result = extHostTypes_1.Disposable.from(result, subscription);
            }
            return result;
        }
        $provideCodeLenses(handle, resource, token) {
            return this._withAdapter(handle, CodeLensAdapter, adapter => adapter.provideCodeLenses(uri_1.URI.revive(resource), token), undefined, token);
        }
        $resolveCodeLens(handle, symbol, token) {
            return this._withAdapter(handle, CodeLensAdapter, adapter => adapter.resolveCodeLens(symbol, token), undefined, undefined);
        }
        $releaseCodeLenses(handle, cacheId) {
            this._withAdapter(handle, CodeLensAdapter, adapter => Promise.resolve(adapter.releaseCodeLenses(cacheId)), undefined, undefined);
        }
        // --- declaration
        registerDefinitionProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DefinitionAdapter(this._documents, provider), extension);
            this._proxy.$registerDefinitionSupport(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $provideDefinition(handle, resource, position, token) {
            return this._withAdapter(handle, DefinitionAdapter, adapter => adapter.provideDefinition(uri_1.URI.revive(resource), position, token), [], token);
        }
        registerDeclarationProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DeclarationAdapter(this._documents, provider), extension);
            this._proxy.$registerDeclarationSupport(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $provideDeclaration(handle, resource, position, token) {
            return this._withAdapter(handle, DeclarationAdapter, adapter => adapter.provideDeclaration(uri_1.URI.revive(resource), position, token), [], token);
        }
        registerImplementationProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new ImplementationAdapter(this._documents, provider), extension);
            this._proxy.$registerImplementationSupport(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $provideImplementation(handle, resource, position, token) {
            return this._withAdapter(handle, ImplementationAdapter, adapter => adapter.provideImplementation(uri_1.URI.revive(resource), position, token), [], token);
        }
        registerTypeDefinitionProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new TypeDefinitionAdapter(this._documents, provider), extension);
            this._proxy.$registerTypeDefinitionSupport(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $provideTypeDefinition(handle, resource, position, token) {
            return this._withAdapter(handle, TypeDefinitionAdapter, adapter => adapter.provideTypeDefinition(uri_1.URI.revive(resource), position, token), [], token);
        }
        // --- extra info
        registerHoverProvider(extension, selector, provider, extensionId) {
            const handle = this._addNewAdapter(new HoverAdapter(this._documents, provider), extension);
            this._proxy.$registerHoverProvider(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $provideHover(handle, resource, position, token) {
            return this._withAdapter(handle, HoverAdapter, adapter => adapter.provideHover(uri_1.URI.revive(resource), position, token), undefined, token);
        }
        // --- debug hover
        registerEvaluatableExpressionProvider(extension, selector, provider, extensionId) {
            const handle = this._addNewAdapter(new EvaluatableExpressionAdapter(this._documents, provider), extension);
            this._proxy.$registerEvaluatableExpressionProvider(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $provideEvaluatableExpression(handle, resource, position, token) {
            return this._withAdapter(handle, EvaluatableExpressionAdapter, adapter => adapter.provideEvaluatableExpression(uri_1.URI.revive(resource), position, token), undefined, token);
        }
        // --- debug inline values
        registerInlineValuesProvider(extension, selector, provider, extensionId) {
            const eventHandle = typeof provider.onDidChangeInlineValues === 'function' ? this._nextHandle() : undefined;
            const handle = this._addNewAdapter(new InlineValuesAdapter(this._documents, provider), extension);
            this._proxy.$registerInlineValuesProvider(handle, this._transformDocumentSelector(selector, extension), eventHandle);
            let result = this._createDisposable(handle);
            if (eventHandle !== undefined) {
                const subscription = provider.onDidChangeInlineValues(_ => this._proxy.$emitInlineValuesEvent(eventHandle));
                result = extHostTypes_1.Disposable.from(result, subscription);
            }
            return result;
        }
        $provideInlineValues(handle, resource, range, context, token) {
            return this._withAdapter(handle, InlineValuesAdapter, adapter => adapter.provideInlineValues(uri_1.URI.revive(resource), range, context, token), undefined, token);
        }
        // --- occurrences
        registerDocumentHighlightProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DocumentHighlightAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentHighlightProvider(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        registerMultiDocumentHighlightProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new MultiDocumentHighlightAdapter(this._documents, provider), extension);
            this._proxy.$registerMultiDocumentHighlightProvider(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $provideDocumentHighlights(handle, resource, position, token) {
            return this._withAdapter(handle, DocumentHighlightAdapter, adapter => adapter.provideDocumentHighlights(uri_1.URI.revive(resource), position, token), undefined, token);
        }
        $provideMultiDocumentHighlights(handle, resource, position, otherModels, token) {
            return this._withAdapter(handle, MultiDocumentHighlightAdapter, adapter => adapter.provideMultiDocumentHighlights(uri_1.URI.revive(resource), position, otherModels.map(model => uri_1.URI.revive(model)), token), undefined, token);
        }
        // --- linked editing
        registerLinkedEditingRangeProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new LinkedEditingRangeAdapter(this._documents, provider), extension);
            this._proxy.$registerLinkedEditingRangeProvider(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $provideLinkedEditingRanges(handle, resource, position, token) {
            return this._withAdapter(handle, LinkedEditingRangeAdapter, async (adapter) => {
                const res = await adapter.provideLinkedEditingRanges(uri_1.URI.revive(resource), position, token);
                if (res) {
                    return {
                        ranges: res.ranges,
                        wordPattern: res.wordPattern ? ExtHostLanguageFeatures._serializeRegExp(res.wordPattern) : undefined
                    };
                }
                return undefined;
            }, undefined, token);
        }
        // --- references
        registerReferenceProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new ReferenceAdapter(this._documents, provider), extension);
            this._proxy.$registerReferenceSupport(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $provideReferences(handle, resource, position, context, token) {
            return this._withAdapter(handle, ReferenceAdapter, adapter => adapter.provideReferences(uri_1.URI.revive(resource), position, context, token), undefined, token);
        }
        // --- quick fix
        registerCodeActionProvider(extension, selector, provider, metadata) {
            const store = new lifecycle_1.DisposableStore();
            const handle = this._addNewAdapter(new CodeActionAdapter(this._documents, this._commands.converter, this._diagnostics, provider, this._logService, extension, this._apiDeprecation), extension);
            this._proxy.$registerQuickFixSupport(handle, this._transformDocumentSelector(selector, extension), {
                providedKinds: metadata?.providedCodeActionKinds?.map(kind => kind.value),
                documentation: metadata?.documentation?.map(x => ({
                    kind: x.kind.value,
                    command: this._commands.converter.toInternal(x.command, store),
                }))
            }, ExtHostLanguageFeatures._extLabel(extension), Boolean(provider.resolveCodeAction));
            store.add(this._createDisposable(handle));
            return store;
        }
        $provideCodeActions(handle, resource, rangeOrSelection, context, token) {
            return this._withAdapter(handle, CodeActionAdapter, adapter => adapter.provideCodeActions(uri_1.URI.revive(resource), rangeOrSelection, context, token), undefined, token);
        }
        $resolveCodeAction(handle, id, token) {
            return this._withAdapter(handle, CodeActionAdapter, adapter => adapter.resolveCodeAction(id, token), {}, undefined);
        }
        $releaseCodeActions(handle, cacheId) {
            this._withAdapter(handle, CodeActionAdapter, adapter => Promise.resolve(adapter.releaseCodeActions(cacheId)), undefined, undefined);
        }
        // --- formatting
        registerDocumentFormattingEditProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DocumentFormattingAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentFormattingSupport(handle, this._transformDocumentSelector(selector, extension), extension.identifier, extension.displayName || extension.name);
            return this._createDisposable(handle);
        }
        $provideDocumentFormattingEdits(handle, resource, options, token) {
            return this._withAdapter(handle, DocumentFormattingAdapter, adapter => adapter.provideDocumentFormattingEdits(uri_1.URI.revive(resource), options, token), undefined, token);
        }
        registerDocumentRangeFormattingEditProvider(extension, selector, provider) {
            const canFormatMultipleRanges = typeof provider.provideDocumentRangesFormattingEdits === 'function';
            const handle = this._addNewAdapter(new RangeFormattingAdapter(this._documents, provider), extension);
            this._proxy.$registerRangeFormattingSupport(handle, this._transformDocumentSelector(selector, extension), extension.identifier, extension.displayName || extension.name, canFormatMultipleRanges);
            return this._createDisposable(handle);
        }
        $provideDocumentRangeFormattingEdits(handle, resource, range, options, token) {
            return this._withAdapter(handle, RangeFormattingAdapter, adapter => adapter.provideDocumentRangeFormattingEdits(uri_1.URI.revive(resource), range, options, token), undefined, token);
        }
        $provideDocumentRangesFormattingEdits(handle, resource, ranges, options, token) {
            return this._withAdapter(handle, RangeFormattingAdapter, adapter => adapter.provideDocumentRangesFormattingEdits(uri_1.URI.revive(resource), ranges, options, token), undefined, token);
        }
        registerOnTypeFormattingEditProvider(extension, selector, provider, triggerCharacters) {
            const handle = this._addNewAdapter(new OnTypeFormattingAdapter(this._documents, provider), extension);
            this._proxy.$registerOnTypeFormattingSupport(handle, this._transformDocumentSelector(selector, extension), triggerCharacters, extension.identifier);
            return this._createDisposable(handle);
        }
        $provideOnTypeFormattingEdits(handle, resource, position, ch, options, token) {
            return this._withAdapter(handle, OnTypeFormattingAdapter, adapter => adapter.provideOnTypeFormattingEdits(uri_1.URI.revive(resource), position, ch, options, token), undefined, token);
        }
        // --- navigate types
        registerWorkspaceSymbolProvider(extension, provider) {
            const handle = this._addNewAdapter(new NavigateTypeAdapter(provider, this._logService), extension);
            this._proxy.$registerNavigateTypeSupport(handle, typeof provider.resolveWorkspaceSymbol === 'function');
            return this._createDisposable(handle);
        }
        $provideWorkspaceSymbols(handle, search, token) {
            return this._withAdapter(handle, NavigateTypeAdapter, adapter => adapter.provideWorkspaceSymbols(search, token), { symbols: [] }, token);
        }
        $resolveWorkspaceSymbol(handle, symbol, token) {
            return this._withAdapter(handle, NavigateTypeAdapter, adapter => adapter.resolveWorkspaceSymbol(symbol, token), undefined, undefined);
        }
        $releaseWorkspaceSymbols(handle, id) {
            this._withAdapter(handle, NavigateTypeAdapter, adapter => adapter.releaseWorkspaceSymbols(id), undefined, undefined);
        }
        // --- rename
        registerRenameProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new RenameAdapter(this._documents, provider, this._logService), extension);
            this._proxy.$registerRenameSupport(handle, this._transformDocumentSelector(selector, extension), RenameAdapter.supportsResolving(provider));
            return this._createDisposable(handle);
        }
        $provideRenameEdits(handle, resource, position, newName, token) {
            return this._withAdapter(handle, RenameAdapter, adapter => adapter.provideRenameEdits(uri_1.URI.revive(resource), position, newName, token), undefined, token);
        }
        $resolveRenameLocation(handle, resource, position, token) {
            return this._withAdapter(handle, RenameAdapter, adapter => adapter.resolveRenameLocation(uri_1.URI.revive(resource), position, token), undefined, token);
        }
        registerNewSymbolNamesProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new NewSymbolNamesAdapter(this._documents, provider, this._logService), extension);
            this._proxy.$registerNewSymbolNamesProvider(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $provideNewSymbolNames(handle, resource, range, token) {
            return this._withAdapter(handle, NewSymbolNamesAdapter, adapter => adapter.provideNewSymbolNames(uri_1.URI.revive(resource), range, token), undefined, token);
        }
        //#region semantic coloring
        registerDocumentSemanticTokensProvider(extension, selector, provider, legend) {
            const handle = this._addNewAdapter(new DocumentSemanticTokensAdapter(this._documents, provider), extension);
            const eventHandle = (typeof provider.onDidChangeSemanticTokens === 'function' ? this._nextHandle() : undefined);
            this._proxy.$registerDocumentSemanticTokensProvider(handle, this._transformDocumentSelector(selector, extension), legend, eventHandle);
            let result = this._createDisposable(handle);
            if (eventHandle) {
                const subscription = provider.onDidChangeSemanticTokens(_ => this._proxy.$emitDocumentSemanticTokensEvent(eventHandle));
                result = extHostTypes_1.Disposable.from(result, subscription);
            }
            return result;
        }
        $provideDocumentSemanticTokens(handle, resource, previousResultId, token) {
            return this._withAdapter(handle, DocumentSemanticTokensAdapter, adapter => adapter.provideDocumentSemanticTokens(uri_1.URI.revive(resource), previousResultId, token), null, token);
        }
        $releaseDocumentSemanticTokens(handle, semanticColoringResultId) {
            this._withAdapter(handle, DocumentSemanticTokensAdapter, adapter => adapter.releaseDocumentSemanticColoring(semanticColoringResultId), undefined, undefined);
        }
        registerDocumentRangeSemanticTokensProvider(extension, selector, provider, legend) {
            const handle = this._addNewAdapter(new DocumentRangeSemanticTokensAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentRangeSemanticTokensProvider(handle, this._transformDocumentSelector(selector, extension), legend);
            return this._createDisposable(handle);
        }
        $provideDocumentRangeSemanticTokens(handle, resource, range, token) {
            return this._withAdapter(handle, DocumentRangeSemanticTokensAdapter, adapter => adapter.provideDocumentRangeSemanticTokens(uri_1.URI.revive(resource), range, token), null, token);
        }
        //#endregion
        // --- suggestion
        registerCompletionItemProvider(extension, selector, provider, triggerCharacters) {
            const handle = this._addNewAdapter(new CompletionsAdapter(this._documents, this._commands.converter, provider, this._apiDeprecation, extension), extension);
            this._proxy.$registerCompletionsProvider(handle, this._transformDocumentSelector(selector, extension), triggerCharacters, CompletionsAdapter.supportsResolving(provider), extension.identifier);
            return this._createDisposable(handle);
        }
        $provideCompletionItems(handle, resource, position, context, token) {
            return this._withAdapter(handle, CompletionsAdapter, adapter => adapter.provideCompletionItems(uri_1.URI.revive(resource), position, context, token), undefined, token);
        }
        $resolveCompletionItem(handle, id, token) {
            return this._withAdapter(handle, CompletionsAdapter, adapter => adapter.resolveCompletionItem(id, token), undefined, token);
        }
        $releaseCompletionItems(handle, id) {
            this._withAdapter(handle, CompletionsAdapter, adapter => adapter.releaseCompletionItems(id), undefined, undefined);
        }
        // --- ghost test
        registerInlineCompletionsProvider(extension, selector, provider, metadata) {
            const adapter = new InlineCompletionAdapter(extension, this._documents, provider, this._commands.converter);
            const handle = this._addNewAdapter(adapter, extension);
            this._proxy.$registerInlineCompletionsSupport(handle, this._transformDocumentSelector(selector, extension), adapter.supportsHandleEvents, extensions_1.ExtensionIdentifier.toKey(extension.identifier.value), metadata?.yieldTo?.map(extId => extensions_1.ExtensionIdentifier.toKey(extId)) || []);
            return this._createDisposable(handle);
        }
        $provideInlineCompletions(handle, resource, position, context, token) {
            return this._withAdapter(handle, InlineCompletionAdapterBase, adapter => adapter.provideInlineCompletions(uri_1.URI.revive(resource), position, context, token), undefined, token);
        }
        $handleInlineCompletionDidShow(handle, pid, idx, updatedInsertText) {
            this._withAdapter(handle, InlineCompletionAdapterBase, async (adapter) => {
                adapter.handleDidShowCompletionItem(pid, idx, updatedInsertText);
            }, undefined, undefined);
        }
        $handleInlineCompletionPartialAccept(handle, pid, idx, acceptedCharacters, info) {
            this._withAdapter(handle, InlineCompletionAdapterBase, async (adapter) => {
                adapter.handlePartialAccept(pid, idx, acceptedCharacters, info);
            }, undefined, undefined);
        }
        $freeInlineCompletionsList(handle, pid) {
            this._withAdapter(handle, InlineCompletionAdapterBase, async (adapter) => { adapter.disposeCompletions(pid); }, undefined, undefined);
        }
        // --- inline edit
        registerInlineEditProvider(extension, selector, provider) {
            const adapter = new InlineEditAdapter(extension, this._documents, provider, this._commands.converter);
            const handle = this._addNewAdapter(adapter, extension);
            this._proxy.$registerInlineEditProvider(handle, this._transformDocumentSelector(selector, extension), extension.identifier);
            return this._createDisposable(handle);
        }
        $provideInlineEdit(handle, resource, context, token) {
            return this._withAdapter(handle, InlineEditAdapter, adapter => adapter.provideInlineEdits(uri_1.URI.revive(resource), context, token), undefined, token);
        }
        $freeInlineEdit(handle, pid) {
            this._withAdapter(handle, InlineEditAdapter, async (adapter) => { adapter.disposeEdit(pid); }, undefined, undefined);
        }
        // --- parameter hints
        registerSignatureHelpProvider(extension, selector, provider, metadataOrTriggerChars) {
            const metadata = Array.isArray(metadataOrTriggerChars)
                ? { triggerCharacters: metadataOrTriggerChars, retriggerCharacters: [] }
                : metadataOrTriggerChars;
            const handle = this._addNewAdapter(new SignatureHelpAdapter(this._documents, provider), extension);
            this._proxy.$registerSignatureHelpProvider(handle, this._transformDocumentSelector(selector, extension), metadata);
            return this._createDisposable(handle);
        }
        $provideSignatureHelp(handle, resource, position, context, token) {
            return this._withAdapter(handle, SignatureHelpAdapter, adapter => adapter.provideSignatureHelp(uri_1.URI.revive(resource), position, context, token), undefined, token);
        }
        $releaseSignatureHelp(handle, id) {
            this._withAdapter(handle, SignatureHelpAdapter, adapter => adapter.releaseSignatureHelp(id), undefined, undefined);
        }
        // --- inline hints
        registerInlayHintsProvider(extension, selector, provider) {
            const eventHandle = typeof provider.onDidChangeInlayHints === 'function' ? this._nextHandle() : undefined;
            const handle = this._addNewAdapter(new InlayHintsAdapter(this._documents, this._commands.converter, provider, this._logService, extension), extension);
            this._proxy.$registerInlayHintsProvider(handle, this._transformDocumentSelector(selector, extension), typeof provider.resolveInlayHint === 'function', eventHandle, ExtHostLanguageFeatures._extLabel(extension));
            let result = this._createDisposable(handle);
            if (eventHandle !== undefined) {
                const subscription = provider.onDidChangeInlayHints(uri => this._proxy.$emitInlayHintsEvent(eventHandle));
                result = extHostTypes_1.Disposable.from(result, subscription);
            }
            return result;
        }
        $provideInlayHints(handle, resource, range, token) {
            return this._withAdapter(handle, InlayHintsAdapter, adapter => adapter.provideInlayHints(uri_1.URI.revive(resource), range, token), undefined, token);
        }
        $resolveInlayHint(handle, id, token) {
            return this._withAdapter(handle, InlayHintsAdapter, adapter => adapter.resolveInlayHint(id, token), undefined, token);
        }
        $releaseInlayHints(handle, id) {
            this._withAdapter(handle, InlayHintsAdapter, adapter => adapter.releaseHints(id), undefined, undefined);
        }
        // --- links
        registerDocumentLinkProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new LinkProviderAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentLinkProvider(handle, this._transformDocumentSelector(selector, extension), typeof provider.resolveDocumentLink === 'function');
            return this._createDisposable(handle);
        }
        $provideDocumentLinks(handle, resource, token) {
            return this._withAdapter(handle, LinkProviderAdapter, adapter => adapter.provideLinks(uri_1.URI.revive(resource), token), undefined, token, resource.scheme === 'output');
        }
        $resolveDocumentLink(handle, id, token) {
            return this._withAdapter(handle, LinkProviderAdapter, adapter => adapter.resolveLink(id, token), undefined, undefined, true);
        }
        $releaseDocumentLinks(handle, id) {
            this._withAdapter(handle, LinkProviderAdapter, adapter => adapter.releaseLinks(id), undefined, undefined, true);
        }
        registerColorProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new ColorProviderAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentColorProvider(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $provideDocumentColors(handle, resource, token) {
            return this._withAdapter(handle, ColorProviderAdapter, adapter => adapter.provideColors(uri_1.URI.revive(resource), token), [], token);
        }
        $provideColorPresentations(handle, resource, colorInfo, token) {
            return this._withAdapter(handle, ColorProviderAdapter, adapter => adapter.provideColorPresentations(uri_1.URI.revive(resource), colorInfo, token), undefined, token);
        }
        registerFoldingRangeProvider(extension, selector, provider) {
            const handle = this._nextHandle();
            const eventHandle = typeof provider.onDidChangeFoldingRanges === 'function' ? this._nextHandle() : undefined;
            this._adapter.set(handle, new AdapterData(new FoldingProviderAdapter(this._documents, provider), extension));
            this._proxy.$registerFoldingRangeProvider(handle, this._transformDocumentSelector(selector, extension), extension.identifier, eventHandle);
            let result = this._createDisposable(handle);
            if (eventHandle !== undefined) {
                const subscription = provider.onDidChangeFoldingRanges(() => this._proxy.$emitFoldingRangeEvent(eventHandle));
                result = extHostTypes_1.Disposable.from(result, subscription);
            }
            return result;
        }
        $provideFoldingRanges(handle, resource, context, token) {
            return this._withAdapter(handle, FoldingProviderAdapter, (adapter) => adapter.provideFoldingRanges(uri_1.URI.revive(resource), context, token), undefined, token);
        }
        // --- smart select
        registerSelectionRangeProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new SelectionRangeAdapter(this._documents, provider, this._logService), extension);
            this._proxy.$registerSelectionRangeProvider(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $provideSelectionRanges(handle, resource, positions, token) {
            return this._withAdapter(handle, SelectionRangeAdapter, adapter => adapter.provideSelectionRanges(uri_1.URI.revive(resource), positions, token), [], token);
        }
        // --- call hierarchy
        registerCallHierarchyProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new CallHierarchyAdapter(this._documents, provider), extension);
            this._proxy.$registerCallHierarchyProvider(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $prepareCallHierarchy(handle, resource, position, token) {
            return this._withAdapter(handle, CallHierarchyAdapter, adapter => Promise.resolve(adapter.prepareSession(uri_1.URI.revive(resource), position, token)), undefined, token);
        }
        $provideCallHierarchyIncomingCalls(handle, sessionId, itemId, token) {
            return this._withAdapter(handle, CallHierarchyAdapter, adapter => adapter.provideCallsTo(sessionId, itemId, token), undefined, token);
        }
        $provideCallHierarchyOutgoingCalls(handle, sessionId, itemId, token) {
            return this._withAdapter(handle, CallHierarchyAdapter, adapter => adapter.provideCallsFrom(sessionId, itemId, token), undefined, token);
        }
        $releaseCallHierarchy(handle, sessionId) {
            this._withAdapter(handle, CallHierarchyAdapter, adapter => Promise.resolve(adapter.releaseSession(sessionId)), undefined, undefined);
        }
        // --- type hierarchy
        registerTypeHierarchyProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new TypeHierarchyAdapter(this._documents, provider), extension);
            this._proxy.$registerTypeHierarchyProvider(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $prepareTypeHierarchy(handle, resource, position, token) {
            return this._withAdapter(handle, TypeHierarchyAdapter, adapter => Promise.resolve(adapter.prepareSession(uri_1.URI.revive(resource), position, token)), undefined, token);
        }
        $provideTypeHierarchySupertypes(handle, sessionId, itemId, token) {
            return this._withAdapter(handle, TypeHierarchyAdapter, adapter => adapter.provideSupertypes(sessionId, itemId, token), undefined, token);
        }
        $provideTypeHierarchySubtypes(handle, sessionId, itemId, token) {
            return this._withAdapter(handle, TypeHierarchyAdapter, adapter => adapter.provideSubtypes(sessionId, itemId, token), undefined, token);
        }
        $releaseTypeHierarchy(handle, sessionId) {
            this._withAdapter(handle, TypeHierarchyAdapter, adapter => Promise.resolve(adapter.releaseSession(sessionId)), undefined, undefined);
        }
        // --- Document on drop
        registerDocumentOnDropEditProvider(extension, selector, provider, metadata) {
            const handle = this._nextHandle();
            this._adapter.set(handle, new AdapterData(new DocumentOnDropEditAdapter(this._proxy, this._documents, provider, handle, extension), extension));
            this._proxy.$registerDocumentOnDropEditProvider(handle, this._transformDocumentSelector(selector, extension), (0, extensions_2.isProposedApiEnabled)(extension, 'dropMetadata') ? metadata : undefined);
            return this._createDisposable(handle);
        }
        $provideDocumentOnDropEdits(handle, requestId, resource, position, dataTransferDto, token) {
            return this._withAdapter(handle, DocumentOnDropEditAdapter, adapter => Promise.resolve(adapter.provideDocumentOnDropEdits(requestId, uri_1.URI.revive(resource), position, dataTransferDto, token)), undefined, undefined);
        }
        // --- mapped edits
        registerMappedEditsProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new MappedEditsAdapter(this._documents, provider), extension);
            this._proxy.$registerMappedEditsProvider(handle, this._transformDocumentSelector(selector, extension));
            return this._createDisposable(handle);
        }
        $provideMappedEdits(handle, document, codeBlocks, context, token) {
            return this._withAdapter(handle, MappedEditsAdapter, adapter => Promise.resolve(adapter.provideMappedEdits(document, codeBlocks, context, token)), null, token);
        }
        // --- copy/paste actions
        registerDocumentPasteEditProvider(extension, selector, provider, metadata) {
            const handle = this._nextHandle();
            this._adapter.set(handle, new AdapterData(new DocumentPasteEditProvider(this._proxy, this._documents, provider, handle, extension), extension));
            this._proxy.$registerPasteEditProvider(handle, this._transformDocumentSelector(selector, extension), {
                supportsCopy: !!provider.prepareDocumentPaste,
                supportsPaste: !!provider.provideDocumentPasteEdits,
                supportsResolve: !!provider.resolveDocumentPasteEdit,
                providedPasteEditKinds: metadata.providedPasteEditKinds?.map(x => x.value),
                copyMimeTypes: metadata.copyMimeTypes,
                pasteMimeTypes: metadata.pasteMimeTypes,
            });
            return this._createDisposable(handle);
        }
        $prepareDocumentPaste(handle, resource, ranges, dataTransfer, token) {
            return this._withAdapter(handle, DocumentPasteEditProvider, adapter => adapter.prepareDocumentPaste(uri_1.URI.revive(resource), ranges, dataTransfer, token), undefined, token);
        }
        $providePasteEdits(handle, requestId, resource, ranges, dataTransferDto, context, token) {
            return this._withAdapter(handle, DocumentPasteEditProvider, adapter => adapter.providePasteEdits(requestId, uri_1.URI.revive(resource), ranges, dataTransferDto, context, token), undefined, token);
        }
        $resolvePasteEdit(handle, id, token) {
            return this._withAdapter(handle, DocumentPasteEditProvider, adapter => adapter.resolvePasteEdit(id, token), {}, undefined);
        }
        $releasePasteEdits(handle, cacheId) {
            this._withAdapter(handle, DocumentPasteEditProvider, adapter => Promise.resolve(adapter.releasePasteEdits(cacheId)), undefined, undefined);
        }
        // --- configuration
        static _serializeRegExp(regExp) {
            return {
                pattern: regExp.source,
                flags: regExp.flags,
            };
        }
        static _serializeIndentationRule(indentationRule) {
            return {
                decreaseIndentPattern: ExtHostLanguageFeatures._serializeRegExp(indentationRule.decreaseIndentPattern),
                increaseIndentPattern: ExtHostLanguageFeatures._serializeRegExp(indentationRule.increaseIndentPattern),
                indentNextLinePattern: indentationRule.indentNextLinePattern ? ExtHostLanguageFeatures._serializeRegExp(indentationRule.indentNextLinePattern) : undefined,
                unIndentedLinePattern: indentationRule.unIndentedLinePattern ? ExtHostLanguageFeatures._serializeRegExp(indentationRule.unIndentedLinePattern) : undefined,
            };
        }
        static _serializeOnEnterRule(onEnterRule) {
            return {
                beforeText: ExtHostLanguageFeatures._serializeRegExp(onEnterRule.beforeText),
                afterText: onEnterRule.afterText ? ExtHostLanguageFeatures._serializeRegExp(onEnterRule.afterText) : undefined,
                previousLineText: onEnterRule.previousLineText ? ExtHostLanguageFeatures._serializeRegExp(onEnterRule.previousLineText) : undefined,
                action: onEnterRule.action
            };
        }
        static _serializeOnEnterRules(onEnterRules) {
            return onEnterRules.map(ExtHostLanguageFeatures._serializeOnEnterRule);
        }
        static _serializeAutoClosingPair(autoClosingPair) {
            return {
                open: autoClosingPair.open,
                close: autoClosingPair.close,
                notIn: autoClosingPair.notIn ? autoClosingPair.notIn.map(v => extHostTypes_1.SyntaxTokenType.toString(v)) : undefined,
            };
        }
        static _serializeAutoClosingPairs(autoClosingPairs) {
            return autoClosingPairs.map(ExtHostLanguageFeatures._serializeAutoClosingPair);
        }
        setLanguageConfiguration(extension, languageId, configuration) {
            const { wordPattern } = configuration;
            // check for a valid word pattern
            if (wordPattern && (0, strings_1.regExpLeadsToEndlessLoop)(wordPattern)) {
                throw new Error(`Invalid language configuration: wordPattern '${wordPattern}' is not allowed to match the empty string.`);
            }
            // word definition
            if (wordPattern) {
                this._documents.setWordDefinitionFor(languageId, wordPattern);
            }
            else {
                this._documents.setWordDefinitionFor(languageId, undefined);
            }
            if (configuration.__electricCharacterSupport) {
                this._apiDeprecation.report('LanguageConfiguration.__electricCharacterSupport', extension, `Do not use.`);
            }
            if (configuration.__characterPairSupport) {
                this._apiDeprecation.report('LanguageConfiguration.__characterPairSupport', extension, `Do not use.`);
            }
            const handle = this._nextHandle();
            const serializedConfiguration = {
                comments: configuration.comments,
                brackets: configuration.brackets,
                wordPattern: configuration.wordPattern ? ExtHostLanguageFeatures._serializeRegExp(configuration.wordPattern) : undefined,
                indentationRules: configuration.indentationRules ? ExtHostLanguageFeatures._serializeIndentationRule(configuration.indentationRules) : undefined,
                onEnterRules: configuration.onEnterRules ? ExtHostLanguageFeatures._serializeOnEnterRules(configuration.onEnterRules) : undefined,
                __electricCharacterSupport: configuration.__electricCharacterSupport,
                __characterPairSupport: configuration.__characterPairSupport,
                autoClosingPairs: configuration.autoClosingPairs ? ExtHostLanguageFeatures._serializeAutoClosingPairs(configuration.autoClosingPairs) : undefined,
            };
            this._proxy.$setLanguageConfiguration(handle, languageId, serializedConfiguration);
            return this._createDisposable(handle);
        }
        $setWordDefinitions(wordDefinitions) {
            for (const wordDefinition of wordDefinitions) {
                this._documents.setWordDefinitionFor(wordDefinition.languageId, new RegExp(wordDefinition.regexSource, wordDefinition.regexFlags));
            }
        }
    }
    exports.ExtHostLanguageFeatures = ExtHostLanguageFeatures;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExhbmd1YWdlRmVhdHVyZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RMYW5ndWFnZUZlYXR1cmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFDaEcsY0FBYztJQUVkLE1BQU0scUJBQXFCO1FBRTFCLFlBQ2tCLFVBQTRCLEVBQzVCLFNBQXdDO1lBRHhDLGVBQVUsR0FBVixVQUFVLENBQWtCO1lBQzVCLGNBQVMsR0FBVCxTQUFTLENBQStCO1FBQ3RELENBQUM7UUFFTCxLQUFLLENBQUMsc0JBQXNCLENBQUMsUUFBYSxFQUFFLEtBQXdCO1lBQ25FLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdEUsSUFBSSxJQUFBLHVCQUFjLEVBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztpQkFBTSxJQUFJLEtBQU0sQ0FBQyxDQUFDLENBQUMsWUFBWSw2QkFBYyxFQUFFLENBQUM7Z0JBQ2hELE9BQTBCLEtBQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2RSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBc0IsS0FBSyxDQUFDLENBQUM7WUFDaEYsQ0FBQztRQUNGLENBQUM7UUFFTyxNQUFNLENBQUMscUJBQXFCLENBQUMsS0FBMEI7WUFDOUQsZ0VBQWdFO1lBQ2hFLHlDQUF5QztZQUN6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