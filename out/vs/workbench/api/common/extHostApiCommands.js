/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/network", "vs/base/common/uri", "vs/editor/common/languages", "vs/editor/common/services/semanticTokensDto", "vs/platform/contextkey/common/contextkey", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, arrays_1, network_1, uri_1, languages, semanticTokensDto_1, contextkey_1, extHostCommands_1, typeConverters, types) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostApiCommands = void 0;
    //#region --- NEW world
    const newCommands = [
        // -- document highlights
        new extHostCommands_1.ApiCommand('vscode.executeDocumentHighlights', '_executeDocumentHighlights', 'Execute document highlight provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of DocumentHighlight-instances.', tryMapWith(typeConverters.DocumentHighlight.to))),
        // -- document symbols
        new extHostCommands_1.ApiCommand('vscode.executeDocumentSymbolProvider', '_executeDocumentSymbolProvider', 'Execute document symbol provider.', [extHostCommands_1.ApiCommandArgument.Uri], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of SymbolInformation and DocumentSymbol instances.', (value, apiArgs) => {
            if ((0, arrays_1.isFalsyOrEmpty)(value)) {
                return undefined;
            }
            class MergedInfo extends types.SymbolInformation {
                static to(symbol) {
                    const res = new MergedInfo(symbol.name, typeConverters.SymbolKind.to(symbol.kind), symbol.containerName || '', new types.Location(apiArgs[0], typeConverters.Range.to(symbol.range)));
                    res.detail = symbol.detail;
                    res.range = res.location.range;
                    res.selectionRange = typeConverters.Range.to(symbol.selectionRange);
                    res.children = symbol.children ? symbol.children.map(MergedInfo.to) : [];
                    return res;
                }
            }
            return value.map(MergedInfo.to);
        })),
        // -- formatting
        new extHostCommands_1.ApiCommand('vscode.executeFormatDocumentProvider', '_executeFormatDocumentProvider', 'Execute document format provider.', [extHostCommands_1.ApiCommandArgument.Uri, new extHostCommands_1.ApiCommandArgument('options', 'Formatting options', _ => true, v => v)], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of TextEdits.', tryMapWith(typeConverters.TextEdit.to))),
        new extHostCommands_1.ApiCommand('vscode.executeFormatRangeProvider', '_executeFormatRangeProvider', 'Execute range format provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Range, new extHostCommands_1.ApiCommandArgument('options', 'Formatting options', _ => true, v => v)], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of TextEdits.', tryMapWith(typeConverters.TextEdit.to))),
        new extHostCommands_1.ApiCommand('vscode.executeFormatOnTypeProvider', '_executeFormatOnTypeProvider', 'Execute format on type provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position, new extHostCommands_1.ApiCommandArgument('ch', 'Trigger character', v => typeof v === 'string', v => v), new extHostCommands_1.ApiCommandArgument('options', 'Formatting options', _ => true, v => v)], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of TextEdits.', tryMapWith(typeConverters.TextEdit.to))),
        // -- go to symbol (definition, type definition, declaration, impl, references)
        new extHostCommands_1.ApiCommand('vscode.executeDefinitionProvider', '_executeDefinitionProvider', 'Execute all definition providers.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Location or LocationLink instances.', mapLocationOrLocationLink)),
        new extHostCommands_1.ApiCommand('vscode.executeTypeDefinitionProvider', '_executeTypeDefinitionProvider', 'Execute all type definition providers.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Location or LocationLink instances.', mapLocationOrLocationLink)),
        new extHostCommands_1.ApiCommand('vscode.executeDeclarationProvider', '_executeDeclarationProvider', 'Execute all declaration providers.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Location or LocationLink instances.', mapLocationOrLocationLink)),
        new extHostCommands_1.ApiCommand('vscode.executeImplementationProvider', '_executeImplementationProvider', 'Execute all implementation providers.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Location or LocationLink instances.', mapLocationOrLocationLink)),
        new extHostCommands_1.ApiCommand('vscode.executeReferenceProvider', '_executeReferenceProvider', 'Execute all reference providers.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Location-instances.', tryMapWith(typeConverters.location.to))),
        // -- hover
        new extHostCommands_1.ApiCommand('vscode.executeHoverProvider', '_executeHoverProvider', 'Execute all hover providers.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Hover-instances.', tryMapWith(typeConverters.Hover.to))),
        // -- selection range
        new extHostCommands_1.ApiCommand('vscode.executeSelectionRangeProvider', '_executeSelectionRangeProvider', 'Execute selection range provider.', [extHostCommands_1.ApiCommandArgument.Uri, new extHostCommands_1.ApiCommandArgument('position', 'A position in a text document', v => Array.isArray(v) && v.every(v => types.Position.isPosition(v)), v => v.map(typeConverters.Position.from))], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of ranges.', result => {
            return result.map(ranges => {
                let node;
                for (const range of ranges.reverse()) {
                    node = new types.SelectionRange(typeConverters.Range.to(range), node);
                }
                return node;
            });
        })),
        // -- symbol search
        new extHostCommands_1.ApiCommand('vscode.executeWorkspaceSymbolProvider', '_executeWorkspaceSymbolProvider', 'Execute all workspace symbol providers.', [extHostCommands_1.ApiCommandArgument.String.with('query', 'Search string')], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of SymbolInformation-instances.', value => {
            return value.map(typeConverters.WorkspaceSymbol.to);
        })),
        // --- call hierarchy
        new extHostCommands_1.ApiCommand('vscode.prepareCallHierarchy', '_executePrepareCallHierarchy', 'Prepare call hierarchy at a position inside a document', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of CallHierarchyItem-instances', v => v.map(typeConverters.CallHierarchyItem.to))),
        new extHostCommands_1.ApiCommand('vscode.provideIncomingCalls', '_executeProvideIncomingCalls', 'Compute incoming calls for an item', [extHostCommands_1.ApiCommandArgument.CallHierarchyItem], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of CallHierarchyIncomingCall-instances', v => v.map(typeConverters.CallHierarchyIncomingCall.to))),
        new extHostCommands_1.ApiCommand('vscode.provideOutgoingCalls', '_executeProvideOutgoingCalls', 'Compute outgoing calls for an item', [extHostCommands_1.ApiCommandArgument.CallHierarchyItem], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of CallHierarchyOutgoingCall-instances', v => v.map(typeConverters.CallHierarchyOutgoingCall.to))),
        // --- rename
        new extHostCommands_1.ApiCommand('vscode.prepareRename', '_executePrepareRename', 'Execute the prepareRename of rename provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to a range and placeholder text.', value => {
            if (!value) {
                return undefined;
            }
            return {
                range: typeConverters.Range.to(value.range),
                placeholder: value.text
            };
        })),
        new extHostCommands_1.ApiCommand('vscode.executeDocumentRenameProvider', '_executeDocumentRenameProvider', 'Execute rename provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position, extHostCommands_1.ApiCommandArgument.String.with('newName', 'The new symbol name')], new extHostCommands_1.ApiCommandResult('A promise that resolves to a WorkspaceEdit.', value => {
            if (!value) {
                return undefined;
            }
            if (value.rejectReason) {
                throw new Error(value.rejectReason);
            }
            return typeConverters.WorkspaceEdit.to(value);
        })),
        // --- links
        new extHostCommands_1.ApiCommand('vscode.executeLinkProvider', '_executeLinkProvider', 'Execute document link provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Number.with('linkResolveCount', 'Number of links that should be resolved, only when links are unresolved.').optional()], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of DocumentLink-instances.', value => value.map(typeConverters.DocumentLink.to))),
        // --- semantic tokens
        new extHostCommands_1.ApiCommand('vscode.provideDocumentSemanticTokensLegend', '_provideDocumentSemanticTokensLegend', 'Provide semantic tokens legend for a document', [extHostCommands_1.ApiCommandArgument.Uri], new extHostCommands_1.ApiCommandResult('A promise that resolves to SemanticTokensLegend.', value => {
            if (!value) {
                return undefined;
            }
            return new types.SemanticTokensLegend(value.tokenTypes, value.tokenModifiers);
        })),
        new extHostCommands_1.ApiCommand('vscode.provideDocumentSemanticTokens', '_provideDocumentSemanticTokens', 'Provide semantic tokens for a document', [extHostCommands_1.ApiCommandArgument.Uri], new extHostCommands_1.ApiCommandResult('A promise that resolves to SemanticTokens.', value => {
            if (!value) {
                return undefined;
            }
            const semanticTokensDto = (0, semanticTokensDto_1.decodeSemanticTokensDto)(value);
            if (semanticTokensDto.type !== 'full') {
                // only accepting full semantic tokens from provideDocumentSemanticTokens
                return undefined;
            }
            return new types.SemanticTokens(semanticTokensDto.data, undefined);
        })),
        new extHostCommands_1.ApiCommand('vscode.provideDocumentRangeSemanticTokensLegend', '_provideDocumentRangeSemanticTokensLegend', 'Provide semantic tokens legend for a document range', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Range.optional()], new extHostCommands_1.ApiCommandResult('A promise that resolves to SemanticTokensLegend.', value => {
            if (!value) {
                return undefined;
            }
            return new types.SemanticTokensLegend(value.tokenTypes, value.tokenModifiers);
        })),
        new extHostCommands_1.ApiCommand('vscode.provideDocumentRangeSemanticTokens', '_provideDocumentRangeSemanticTokens', 'Provide semantic tokens for a document range', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Range], new extHostCommands_1.ApiCommandResult('A promise that resolves to SemanticTokens.', value => {
            if (!value) {
                return undefined;
            }
            const semanticTokensDto = (0, semanticTokensDto_1.decodeSemanticTokensDto)(value);
            if (semanticTokensDto.type !== 'full') {
                // only accepting full semantic tokens from provideDocumentRangeSemanticTokens
                return undefined;
            }
            return new types.SemanticTokens(semanticTokensDto.data, undefined);
        })),
        // --- completions
        new extHostCommands_1.ApiCommand('vscode.executeCompletionItemProvider', '_executeCompletionItemProvider', 'Execute completion item provider.', [
            extHostCommands_1.ApiCommandArgument.Uri,
            extHostCommands_1.ApiCommandArgument.Position,
            extHostCommands_1.ApiCommandArgument.String.with('triggerCharacter', 'Trigger completion when the user types the character, like `,` or `(`').optional(),
            extHostCommands_1.ApiCommandArgument.Number.with('itemResolveCount', 'Number of completions to resolve (too large numbers slow down completions)').optional()
        ], new extHostCommands_1.ApiCommandResult('A promise that resolves to a CompletionList-instance.', (value, _args, converter) => {
            if (!value) {
                return new types.CompletionList([]);
            }
            const items = value.suggestions.map(suggestion => typeConverters.CompletionItem.to(suggestion, converter));
            return new types.CompletionList(items, value.incomplete);
        })),
        // --- signature help
        new extHostCommands_1.ApiCommand('vscode.executeSignatureHelpProvider', '_executeSignatureHelpProvider', 'Execute signature help provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position, extHostCommands_1.ApiCommandArgument.String.with('triggerCharacter', 'Trigger signature help when the user types the character, like `,` or `(`').optional()], new extHostCommands_1.ApiCommandResult('A promise that resolves to SignatureHelp.', value => {
            if (value) {
                return typeConverters.SignatureHelp.to(value);
            }
            return undefined;
        })),
        // --- code lens
        new extHostCommands_1.ApiCommand('vscode.executeCodeLensProvider', '_executeCodeLensProvider', 'Execute code lens provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Number.with('itemResolveCount', 'Number of lenses that should be resolved and returned. Will only return resolved lenses, will impact performance)').optional()], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of CodeLens-instances.', (value, _args, converter) => {
            return tryMapWith(item => {
                return new types.CodeLens(typeConverters.Range.to(item.range), item.command && converter.fromInternal(item.command));
            })(value);
        })),
        // --- code actions
        new extHostCommands_1.ApiCommand('vscode.executeCodeActionProvider', '_executeCodeActionProvider', 'Execute code action provider.', [
            extHostCommands_1.ApiCommandArgument.Uri,
            new extHostCommands_1.ApiCommandArgument('rangeOrSelection', 'Range in a text document. Some refactoring provider requires Selection object.', v => types.Range.isRange(v), v => types.Selection.isSelection(v) ? typeConverters.Selection.from(v) : typeConverters.Range.from(v)),
            extHostCommands_1.ApiCommandArgument.String.with('kind', 'Code action kind to return code actions for').optional(),
            extHostCommands_1.ApiCommandArgument.Number.with('itemResolveCount', 'Number of code actions to resolve (too large numbers slow down code actions)').optional()
        ], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Command-instances.', (value, _args, converter) => {
            return tryMapWith((codeAction) => {
                if (codeAction._isSynthetic) {
                    if (!codeAction.command) {
                        throw new Error('Synthetic code actions must have a command');
                    }
                    return converter.fromInternal(codeAction.command);
                }
                else {
                    const ret = new types.CodeAction(codeAction.title, codeAction.kind ? new types.CodeActionKind(codeAction.kind) : undefined);
                    if (codeAction.edit) {
                        ret.edit = typeConverters.WorkspaceEdit.to(codeAction.edit);
                    }
                    if (codeAction.command) {
                        ret.command = converter.fromInternal(codeAction.command);
                    }
                    ret.isPreferred = codeAction.isPreferred;
                    return ret;
                }
            })(value);
        })),
        // --- colors
        new extHostCommands_1.ApiCommand('vscode.executeDocumentColorProvider', '_executeDocumentColorProvider', 'Execute document color provider.', [extHostCommands_1.ApiCommandArgument.Uri], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of ColorInformation objects.', result => {
            if (result) {
                return result.map(ci => new types.ColorInformation(typeConverters.Range.to(ci.range), typeConverters.Color.to(ci.color)));
            }
            return [];
        })),
        new extHostCommands_1.ApiCommand('vscode.executeColorPresentationProvider', '_executeColorPresentationProvider', 'Execute color presentation provider.', [
            new extHostCommands_1.ApiCommandArgument('color', 'The color to show and insert', v => v instanceof types.Color, typeConverters.Color.from),
            new extHostCommands_1.ApiCommandArgument('context', 'Context object with uri and range', _v => true, v => ({ uri: v.uri, range: typeConverters.Range.from(v.range) })),
        ], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of ColorPresentation objects.', result => {
            if (result) {
                return result.map(typeConverters.ColorPresentation.to);
            }
            return [];
        })),
        // --- inline hints
        new extHostCommands_1.ApiCommand('vscode.executeInlayHintProvider', '_executeInlayHintProvider', 'Execute inlay hints provider', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Range], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Inlay objects', (result, args, converter) => {
            return result.map(typeConverters.InlayHint.to.bind(undefined, converter));
        })),
        // --- folding
        new extHostCommands_1.ApiCommand('vscode.executeFoldingRangeProvider', '_executeFoldingRangeProvider', 'Execute folding range provider', [extHostCommands_1.ApiCommandArgument.Uri], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of FoldingRange objects', (result, args) => {
            if (result) {
                return result.map(typeConverters.FoldingRange.to);
            }
            return undefined;
        })),
        // --- notebooks
        new extHostCommands_1.ApiCommand('vscode.resolveNotebookContentProviders', '_resolveNotebookContentProvider', 'Resolve Notebook Content Providers', [
        // new ApiCommandArgument<string, string>('viewType', '', v => typeof v === 'string', v => v),
        // new ApiCommandArgument<string, string>('displayName', '', v => typeof v === 'string', v => v),
        // new ApiCommandArgument<object, object>('options', '', v => typeof v === 'object', v => v),
        ], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of NotebookContentProvider static info objects.', tryMapWith(item => {
            return {
                viewType: item.viewType,
                displayName: item.displayName,
                options: {
                    transientOutputs: item.options.transientOutputs,
                    transientCellMetadata: item.options.transientCellMetadata,
                    transientDocumentMetadata: item.options.transientDocumentMetadata
                },
                filenamePattern: item.filenamePattern.map(pattern => typeConverters.NotebookExclusiveDocumentPattern.to(pattern))
            };
        }))),
        // --- debug support
        new extHostCommands_1.ApiCommand('vscode.executeInlineValueProvider', '_executeInlineValueProvider', 'Execute inline value provider', [
            extHostCommands_1.ApiCommandArgument.Uri,
            extHostCommands_1.ApiCommandArgument.Range,
            new extHostCommands_1.ApiCommandArgument('context', 'An InlineValueContext', v => v && typeof v.frameId === 'number' && v.stoppedLocation instanceof types.Range, v => typeConverters.InlineValueContext.from(v))
        ], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of InlineValue objects', result => {
            return result.map(typeConverters.InlineValue.to);
        })),
        // --- open'ish commands
        new extHostCommands_1.ApiCommand('vscode.open', '_workbench.open', 'Opens the provided resource in the editor. Can be a text or binary file, or an http(s) URL. If you need more control over the options for opening a text file, use vscode.window.showTextDocument instead.', [
            new extHostCommands_1.ApiCommandArgument('uriOrString', 'Uri-instance or string (only http/https)', v => uri_1.URI.isUri(v) || (typeof v === 'string' && (0, network_1.matchesSomeScheme)(v, network_1.Schemas.http, network_1.Schemas.https)), v => v),
            new extHostCommands_1.ApiCommandArgument('columnOrOptions', 'Either the column in which to open or editor options, see vscode.TextDocumentShowOptions', v => v === undefined || typeof v === 'number' || typeof v === 'object', v => !v ? v : typeof v === 'number' ? [typeConverters.ViewColumn.from(v), undefined] : [typeConverters.ViewColumn.from(v.viewColumn), typeConverters.TextEditorOpenOptions.from(v)]).optional(),
            extHostCommands_1.ApiCommandArgument.String.with('label', '').optional()
        ], extHostCommands_1.ApiCommandResult.Void),
        new extHostCommands_1.ApiCommand('vscode.openWith', '_workbench.openWith', 'Opens the provided resource with a specific editor.', [
            extHostCommands_1.ApiCommandArgument.Uri.with('resource', 'Resource to open'),
            extHostCommands_1.ApiCommandArgument.String.with('viewId', 'Custom editor view id. This should be the viewType string for custom editors or the notebookType string for notebooks. Use \'default\' to use VS Code\'s default text editor'),
            new extHostCommands_1.ApiCommandArgument('columnOrOptions', 'Either the column in which to open or editor options, see vscode.TextDocumentShowOptions', v => v === undefined || typeof v === 'number' || typeof v === 'object', v => !v ? v : typeof v === 'number' ? [typeConverters.ViewColumn.from(v), undefined] : [typeConverters.ViewColumn.from(v.viewColumn), typeConverters.TextEditorOpenOptions.from(v)]).optional()
        ], extHostCommands_1.ApiCommandResult.Void),
        new extHostCommands_1.ApiCommand('vscode.diff', '_workbench.diff', 'Opens the provided resources in the diff editor to compare their contents.', [
            extHostCommands_1.ApiCommandArgument.Uri.with('left', 'Left-hand side resource of the diff editor'),
            extHostCommands_1.ApiCommandArgument.Uri.with('right', 'Right-hand side resource of the diff editor'),
            extHostCommands_1.ApiCommandArgument.String.with('title', 'Human readable title for the diff editor').optional(),
            new extHostCommands_1.ApiCommandArgument('columnOrOptions', 'Either the column in which to open or editor options, see vscode.TextDocumentShowOptions', v => v === undefined || typeof v === 'object', v => v && [typeConverters.ViewColumn.from(v.viewColumn), typeConverters.TextEditorOpenOptions.from(v)]).optional(),
        ], extHostCommands_1.ApiCommandResult.Void),
        new extHostCommands_1.ApiCommand('vscode.changes', '_workbench.changes', 'Opens a list of resources in the changes editor to compare their contents.', [
            extHostCommands_1.ApiCommandArgument.String.with('title', 'Human readable title for the changes editor'),
            new extHostCommands_1.ApiCommandArgument('resourceList', 'List of resources to compare', resources => {
                for (const resource of resources) {
                    if (resource.length !== 3) {
                        return false;
                    }
                    const [label, left, right] = resource;
                    if (!uri_1.URI.isUri(label) ||
                        (!uri_1.URI.isUri(left) && left !== undefined && left !== null) ||
                        (!uri_1.URI.isUri(right) && right !== undefined && right !== null)) {
                        return false;
                    }
                }
                return true;
            }, v => v)
        ], extHostCommands_1.ApiCommandResult.Void),
        // --- type hierarchy
        new extHostCommands_1.ApiCommand('vscode.prepareTypeHierarchy', '_executePrepareTypeHierarchy', 'Prepare type hierarchy at a position inside a document', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of TypeHierarchyItem-instances', v => v.map(typeConverters.TypeHierarchyItem.to))),
        new extHostCommands_1.ApiCommand('vscode.provideSupertypes', '_executeProvideSupertypes', 'Compute supertypes for an item', [extHostCommands_1.ApiCommandArgument.TypeHierarchyItem], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of TypeHierarchyItem-instances', v => v.map(typeConverters.TypeHierarchyItem.to))),
        new extHostCommands_1.ApiCommand('vscode.provideSubtypes', '_executeProvideSubtypes', 'Compute subtypes for an item', [extHostCommands_1.ApiCommandArgument.TypeHierarchyItem], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of TypeHierarchyItem-instances', v => v.map(typeConverters.TypeHierarchyItem.to))),
        // --- testing
        new extHostCommands_1.ApiCommand('vscode.revealTestInExplorer', '_revealTestInExplorer', 'Reveals a test instance in the explorer', [extHostCommands_1.ApiCommandArgument.TestItem], extHostCommands_1.ApiCommandResult.Void),
        // --- continue edit session
        new extHostCommands_1.ApiCommand('vscode.experimental.editSession.continue', '_workbench.editSessions.actions.continueEditSession', 'Continue the current edit session in a different workspace', [extHostCommands_1.ApiCommandArgument.Uri.with('workspaceUri', 'The target workspace to continue the current edit session in')], extHostCommands_1.ApiCommandResult.Void),
        // --- context keys
        new extHostCommands_1.ApiCommand('setContext', '_setContext', 'Set a custom context key value that can be used in when clauses.', [
            extHostCommands_1.ApiCommandArgument.String.with('name', 'The context key name'),
            new extHostCommands_1.ApiCommandArgument('value', 'The context key value', () => true, v => v),
        ], extHostCommands_1.ApiCommandResult.Void),
        // --- mapped edits
        new extHostCommands_1.ApiCommand('vscode.executeMappedEditsProvider', '_executeMappedEditsProvider', 'Execute Mapped Edits Provider', [
            extHostCommands_1.ApiCommandArgument.Uri,
            extHostCommands_1.ApiCommandArgument.StringArray,
            new extHostCommands_1.ApiCommandArgument('MappedEditsContext', 'Mapped Edits Context', (v) => typeConverters.MappedEditsContext.is(v), (v) => typeConverters.MappedEditsContext.from(v))
        ], new extHostCommands_1.ApiCommandResult('A promise that resolves to a workspace edit or null', (value) => {
            return value ? typeConverters.WorkspaceEdit.to(value) : null;
        })),
    ];
    //#endregion
    //#region OLD world
    class ExtHostApiCommands {
        static register(commands) {
            newCommands.forEach(commands.registerApiCommand, commands);
            this._registerValidateWhenClausesCommand(commands);
        }
        static _registerValidateWhenClausesCommand(commands) {
            commands.registerCommand(false, '_validateWhenClauses', contextkey_1.validateWhenClauses);
        }
    }
    exports.ExtHostApiCommands = ExtHostApiCommands;
    function tryMapWith(f) {
        return (value) => {
            if (Array.isArray(value)) {
                return value.map(f);
            }
            return undefined;
        };
    }
    function mapLocationOrLocationLink(values) {
        if (!Array.isArray(values)) {
            return undefined;
        }
        const result = [];
        for (const item of values) {
            if (languages.isLocationLink(item)) {
                result.push(typeConverters.DefinitionLink.to(item));
            }
            else {
                result.push(typeConverters.location.to(item));
            }
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEFwaUNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0QXBpQ29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUJoRyx1QkFBdUI7SUFFdkIsTUFBTSxXQUFXLEdBQWlCO1FBQ2pDLHlCQUF5QjtRQUN6QixJQUFJLDRCQUFVLENBQ2Isa0NBQWtDLEVBQUUsNEJBQTRCLEVBQUUsc0NBQXNDLEVBQ3hHLENBQUMsb0NBQWtCLENBQUMsR0FBRyxFQUFFLG9DQUFrQixDQUFDLFFBQVEsQ0FBQyxFQUNyRCxJQUFJLGtDQUFnQixDQUF1RSxxRUFBcUUsRUFBRSxVQUFVLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQ2xOO1FBQ0Qsc0JBQXNCO1FBQ3RCLElBQUksNEJBQVUsQ0FDYixzQ0FBc0MsRUFBRSxnQ0FBZ0MsRUFBRSxtQ0FBbUMsRUFDN0csQ0FBQyxvQ0FBa0IsQ0FBQyxHQUFHLENBQUMsRUFDeEIsSUFBSSxrQ0FBZ0IsQ0FBcUUsd0ZBQXdGLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFFck0sSUFBSSxJQUFBLHVCQUFjLEVBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELE1BQU0sVUFBVyxTQUFRLEtBQUssQ0FBQyxpQkFBaUI7Z0JBQy9DLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBZ0M7b0JBQ3pDLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBVSxDQUN6QixNQUFNLENBQUMsSUFBSSxFQUNYLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFDekMsTUFBTSxDQUFD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