/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/errors", "vs/base/common/uri", "vs/workbench/api/common/extHostTypes", "vs/editor/test/common/testTextModel", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/workbench/api/test/common/testRPCProtocol", "vs/platform/markers/common/markers", "vs/platform/markers/common/markerService", "vs/workbench/api/common/extHostLanguageFeatures", "vs/workbench/api/browser/mainThreadLanguageFeatures", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/browser/mainThreadCommands", "vs/workbench/api/common/extHostDocuments", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/editor/common/languages", "vs/editor/contrib/codelens/browser/codelens", "vs/editor/contrib/gotoSymbol/browser/goToSymbol", "vs/editor/contrib/hover/browser/getHover", "vs/editor/contrib/wordHighlighter/browser/wordHighlighter", "vs/editor/contrib/codeAction/browser/codeAction", "vs/workbench/contrib/search/common/search", "vs/editor/contrib/rename/browser/rename", "vs/editor/contrib/parameterHints/browser/provideSignatureHelp", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/contrib/format/browser/format", "vs/editor/contrib/links/browser/getLinks", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostDiagnostics", "vs/platform/log/common/log", "vs/editor/contrib/colorPicker/browser/color", "vs/base/common/cancellation", "vs/workbench/services/extensions/common/extensions", "vs/editor/contrib/smartSelect/browser/smartSelect", "vs/base/test/common/mock", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostApiDeprecationService", "vs/platform/progress/common/progress", "vs/workbench/api/common/extHostUriTransformerService", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/languageFeaturesService", "vs/editor/contrib/codeAction/common/types", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/test/common/utils"], function (require, exports, assert, instantiationServiceMock_1, errors_1, uri_1, types, testTextModel_1, position_1, range_1, testRPCProtocol_1, markers_1, markerService_1, extHostLanguageFeatures_1, mainThreadLanguageFeatures_1, extHostCommands_1, mainThreadCommands_1, extHostDocuments_1, extHostDocumentsAndEditors_1, languages, codelens_1, goToSymbol_1, getHover_1, wordHighlighter_1, codeAction_1, search_1, rename_1, provideSignatureHelp_1, suggest_1, format_1, getLinks_1, extHost_protocol_1, extHostDiagnostics_1, log_1, color_1, cancellation_1, extensions_1, smartSelect_1, mock_1, lifecycle_1, extHostApiDeprecationService_1, progress_1, extHostUriTransformerService_1, outlineModel_1, languageFeatures_1, languageFeaturesService_1, types_1, uriIdentity_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostLanguageFeatures', function () {
        const defaultSelector = { scheme: 'far' };
        let model;
        let extHost;
        let mainThread;
        const disposables = new lifecycle_1.DisposableStore();
        let rpcProtocol;
        let languageFeaturesService;
        let originalErrorHandler;
        let instantiationService;
        setup(() => {
            model = (0, testTextModel_1.createTextModel)([
                'This is the first line',
                'This is the second line',
                'This is the third line',
            ].join('\n'), undefined, undefined, uri_1.URI.parse('far://testing/file.a'));
            rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            languageFeaturesService = new languageFeaturesService_1.LanguageFeaturesService();
            // Use IInstantiationService to get typechecking when instantiating
            let inst;
            {
                instantiationService = new instantiationServiceMock_1.TestInstantiationService();
                instantiationService.stub(markers_1.IMarkerService, markerService_1.MarkerService);
                instantiationService.set(languageFeatures_1.ILanguageFeaturesService, languageFeaturesService);
                instantiationService.set(uriIdentity_1.IUriIdentityService, new class extends (0, mock_1.mock)() {
                    asCanonicalUri(uri) {
                        return uri;
                    }
                });
                inst = instantiationService;
            }
            originalErrorHandler = errors_1.errorHandler.getUnexpectedErrorHandler();
            (0, errors_1.setUnexpectedErrorHandler)(() => { });
            const extHostDocumentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors(rpcProtocol, new log_1.NullLogService());
            extHostDocumentsAndEditors.$acceptDocumentsAndEditorsDelta({
                addedDocuments: [{
                        isDirty: false,
                        versionId: model.getVersionId(),
                        languageId: model.getLanguageId(),
                        uri: model.uri,
                        lines: model.getValue().split(model.getEOL()),
                        EOL: model.getEOL(),
                    }]
            });
            const extHostDocuments = new extHostDocuments_1.ExtHostDocuments(rpcProtocol, extHostDocumentsAndEditors);
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocuments, extHostDocuments);
            const commands = new extHostCommands_1.ExtHostCommands(rpcProtocol, new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
                onExtensionError() {
                    return true;
                }
            });
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostCommands, commands);
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadCommands, disposables.add(inst.createInstance(mainThreadCommands_1.MainThreadCommands, rpcProtocol)));
            const diagnostics = new extHostDiagnostics_1.ExtHostDiagnostics(rpcProtocol, new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
            }, extHostDocumentsAndEditors);
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDiagnostics, diagnostics);
            extHost = new extHostLanguageFeatures_1.ExtHostLanguageFeatures(rpcProtocol, new extHostUriTransformerService_1.URITransformerService(null), extHostDocuments, commands, diagnostics, new log_1.NullLogService(), extHostApiDeprecationService_1.NullApiDeprecationService, new class extends (0, mock_1.mock)() {
                onExtensionError() {
                    return true;
                }
            });
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLanguageFeatures, extHost);
            mainThread = rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadLanguageFeatures, disposables.add(inst.createInstance(mainThreadLanguageFeatures_1.MainThreadLanguageFeatures, rpcProtocol)));
        });
        teardown(() => {
            disposables.clear();
            (0, errors_1.setUnexpectedErrorHandler)(originalErrorHandler);
            model.dispose();
            mainThread.dispose();
            instantiationService.dispose();
            return rpcProtocol.sync();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        // --- outline
        test('DocumentSymbols, register/deregister', async () => {
            assert.strictEqual(languageFeaturesService.documentSymbolProvider.all(model).length, 0);
            const d1 = extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentSymbols() {
                    return [];
                }
            });
            await rpcProtocol.sync();
            assert.strictEqual(languageFeaturesService.documentSymbolProvider.all(model).length, 1);
            d1.dispose();
            return rpcProtocol.sync();
        });
        test('DocumentSymbols, evil provider', async () => {
            disposables.add(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentSymbols() {
                    throw new Error('evil document symbol provider');
                }
            }));
            disposables.add(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentSymbols() {
                    return [new types.SymbolInformation('test', types.SymbolKind.Field, new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = (await outlineModel_1.OutlineModel.create(languageFeaturesService.documentSymbolProvider, model, cancellation_1.CancellationToken.None)).asListOfDocumentSymbols();
            assert.strictEqual(value.length, 1);
        });
        test('DocumentSymbols, data conversion', async () => {
            disposables.add(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentSymbols() {
                    return [new types.SymbolInformation('test', types.SymbolKind.Field, new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = (await outlineModel_1.OutlineModel.create(languageFeaturesService.documentSymbolProvider, model, cancellation_1.CancellationToken.None)).asListOfDocumentSymbols();
            assert.strictEqual(value.length, 1);
            const entry = value[0];
            assert.strictEqual(entry.name, 'test');
            assert.deepStrictEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Quick Outline uses a not ideal sorting, #138502', async function () {
            const symbols = [
                { name: 'containers', range: { startLineNumber: 1, startColumn: 1, endLineNumber: 4, endColumn: 26 } },
                { name: 'container 0', range: { startLineNumber: 2, startColumn: 5, endLineNumber: 5, endColumn: 1 } },
                { name: 'name', range: { startLineNumber: 2, startColumn: 5, endLineNumber: 2, endColumn: 16 } },
                { name: 'ports', range: { startLineNumber: 3, startColumn: 5, endLineNumber: 5, endColumn: 1 } },
                { name: 'ports 0', range: { startLineNumber: 4, startColumn: 9, endLineNumber: 4, endColumn: 26 } },
                { name: 'containerPort', range: { startLineNumber: 4, startColumn: 9, endLineNumber: 4, endColumn: 26 } }
            ];
            disposables.add(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentSymbols: (doc, token) => {
                    return symbols.map(s => {
                        return new types.SymbolInformation(s.name, types.SymbolKind.Object, new types.Range(s.range.startLineNumber - 1, s.range.startColumn - 1, s.range.endLineNumber - 1, s.range.endColumn - 1));
                    });
                }
            }));
            await rpcProtocol.sync();
            const value = (await outlineModel_1.OutlineModel.create(languageFeaturesService.documentSymbolProvider, model, cancellation_1.CancellationToken.None)).asListOfDocumentSymbols();
            assert.strictEqual(value.length, 6);
            assert.deepStrictEqual(value.map(s => s.name), ['containers', 'container 0', 'name', 'ports', 'ports 0', 'containerPort']);
        });
        // --- code lens
        test('CodeLens, evil provider', async () => {
            disposables.add(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeLenses() {
                    throw new Error('evil');
                }
            }));
            disposables.add(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeLenses() {
                    return [new types.CodeLens(new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, codelens_1.getCodeLensModel)(languageFeaturesService.codeLensProvider, model, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.lenses.length, 1);
            value.dispose();
        });
        test('CodeLens, do not resolve a resolved lens', async () => {
            disposables.add(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeLenses() {
                    return [new types.CodeLens(new types.Range(0, 0, 0, 0), { command: 'id', title: 'Title' })];
                }
                resolveCodeLens() {
                    assert.ok(false, 'do not resolve');
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, codelens_1.getCodeLensModel)(languageFeaturesService.codeLensProvider, model, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.lenses.length, 1);
            const [data] = value.lenses;
            const symbol = await Promise.resolve(data.provider.resolveCodeLens(model, data.symbol, cancellation_1.CancellationToken.None));
            assert.strictEqual(symbol.command.id, 'id');
            assert.strictEqual(symbol.command.title, 'Title');
            value.dispose();
        });
        test('CodeLens, missing command', async () => {
            disposables.add(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeLenses() {
                    return [new types.CodeLens(new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, codelens_1.getCodeLensModel)(languageFeaturesService.codeLensProvider, model, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.lenses.length, 1);
            const [data] = value.lenses;
            const symbol = await Promise.resolve(data.provider.resolveCodeLens(model, data.symbol, cancellation_1.CancellationToken.None));
            assert.strictEqual(symbol, undefined);
            value.dispose();
        });
        // --- definition
        test('Definition, data conversion', async () => {
            disposables.add(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return [new types.Location(model.uri, new types.Range(1, 2, 3, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getDefinitionsAtPosition)(languageFeaturesService.definitionProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
            const [entry] = value;
            assert.deepStrictEqual(entry.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 4, endColumn: 5 });
            assert.strictEqual(entry.uri.toString(), model.uri.toString());
        });
        test('Definition, one or many', async () => {
            disposables.add(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return [new types.Location(model.uri, new types.Range(1, 1, 1, 1))];
                }
            }));
            disposables.add(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return new types.Location(model.uri, new types.Range(2, 1, 1, 1));
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getDefinitionsAtPosition)(languageFeaturesService.definitionProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 2);
        });
        test('Definition, registration order', async () => {
            disposables.add(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return [new types.Location(uri_1.URI.parse('far://first'), new types.Range(2, 3, 4, 5))];
                }
            }));
            disposables.add(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return new types.Location(uri_1.URI.parse('far://second'), new types.Range(1, 2, 3, 4));
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getDefinitionsAtPosition)(languageFeaturesService.definitionProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 2);
            // let [first, second] = value;
            assert.strictEqual(value[0].uri.authority, 'second');
            assert.strictEqual(value[1].uri.authority, 'first');
        });
        test('Definition, evil provider', async () => {
            disposables.add(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    throw new Error('evil provider');
                }
            }));
            disposables.add(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return new types.Location(model.uri, new types.Range(1, 1, 1, 1));
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getDefinitionsAtPosition)(languageFeaturesService.definitionProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
        });
        // -- declaration
        test('Declaration, data conversion', async () => {
            disposables.add(extHost.registerDeclarationProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDeclaration() {
                    return [new types.Location(model.uri, new types.Range(1, 2, 3, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getDeclarationsAtPosition)(languageFeaturesService.declarationProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
            const [entry] = value;
            assert.deepStrictEqual(entry.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 4, endColumn: 5 });
            assert.strictEqual(entry.uri.toString(), model.uri.toString());
        });
        // --- implementation
        test('Implementation, data conversion', async () => {
            disposables.add(extHost.registerImplementationProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideImplementation() {
                    return [new types.Location(model.uri, new types.Range(1, 2, 3, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getImplementationsAtPosition)(languageFeaturesService.implementationProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
            const [entry] = value;
            assert.deepStrictEqual(entry.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 4, endColumn: 5 });
            assert.strictEqual(entry.uri.toString(), model.uri.toString());
        });
        // --- type definition
        test('Type Definition, data conversion', async () => {
            disposables.add(extHost.registerTypeDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideTypeDefinition() {
                    return [new types.Location(model.uri, new types.Range(1, 2, 3, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getTypeDefinitionsAtPosition)(languageFeaturesService.typeDefinitionProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
            const [entry] = value;
            assert.deepStrictEqual(entry.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 4, endColumn: 5 });
            assert.strictEqual(entry.uri.toString(), model.uri.toString());
        });
        // --- extra info
        test('HoverProvider, word range at pos', async () => {
            disposables.add(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('Hello');
                }
            }));
            await rpcProtocol.sync();
            const hovers = await (0, getHover_1.getHoverPromise)(languageFeaturesService.hoverProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(hovers.length, 1);
            const [entry] = hovers;
            assert.deepStrictEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 });
        });
        test('HoverProvider, given range', async () => {
            disposables.add(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('Hello', new types.Range(3, 0, 8, 7));
                }
            }));
            await rpcProtocol.sync();
            const hovers = await (0, getHover_1.getHoverPromise)(languageFeaturesService.hoverProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(hovers.length, 1);
            const [entry] = hovers;
            assert.deepStrictEqual(entry.range, { startLineNumber: 4, startColumn: 1, endLineNumber: 9, endColumn: 8 });
        });
        test('HoverProvider, registration order', async () => {
            disposables.add(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('registered first');
                }
            }));
            disposables.add(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('registered second');
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, getHover_1.getHoverPromise)(languageFeaturesService.hoverProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 2);
            const [first, second] = value;
            assert.strictEqual(first.contents[0].value, 'registered second');
            assert.strictEqual(second.contents[0].value, 'registered first');
        });
        test('HoverProvider, evil provider', async () => {
            disposables.add(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    throw new Error('evil');
                }
            }));
            disposables.add(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('Hello');
                }
            }));
            await rpcProtocol.sync();
            const hovers = await (0, getHover_1.getHoverPromise)(languageFeaturesService.hoverProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(hovers.length, 1);
        });
        // --- occurrences
        test('Occurrences, data conversion', async () => {
            disposables.add(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = (await (0, wordHighlighter_1.getOccurrencesAtPosition)(languageFeaturesService.documentHighlightProvider, model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None));
            assert.strictEqual(value.size, 1);
            const [entry] = Array.from(value.values())[0];
            assert.deepStrictEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 });
            assert.strictEqual(entry.kind, languages.DocumentHighlightKind.Text);
        });
        test('Occurrences, order 1/2', async () => {
            disposables.add(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    return [];
                }
            }));
            disposables.add(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = (await (0, wordHighlighter_1.getOccurrencesAtPosition)(languageFeaturesService.documentHighlightProvider, model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None));
            assert.strictEqual(value.size, 1);
            const [entry] = Array.from(value.values())[0];
            assert.deepStrictEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 });
            assert.strictEqual(entry.kind, languages.DocumentHighlightKind.Text);
        });
        test('Occurrences, order 2/2', async () => {
            disposables.add(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 2))];
                }
            }));
            disposables.add(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = (await (0, wordHighlighter_1.getOccurrencesAtPosition)(languageFeaturesService.documentHighlightProvider, model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None));
            assert.strictEqual(value.size, 1);
            const [entry] = Array.from(value.values())[0];
            assert.deepStrictEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 3 });
            assert.strictEqual(entry.kind, languages.DocumentHighlightKind.Text);
        });
        test('Occurrences, evil provider', async () => {
            disposables.add(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    throw new Error('evil');
                }
            }));
            disposables.add(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, wordHighlighter_1.getOccurrencesAtPosition)(languageFeaturesService.documentHighlightProvider, model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.size, 1);
        });
        // --- references
        test('References, registration order', async () => {
            disposables.add(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    return [new types.Location(uri_1.URI.parse('far://register/first'), new types.Range(0, 0, 0, 0))];
                }
            }));
            disposables.add(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    return [new types.Location(uri_1.URI.parse('far://register/second'), new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getReferencesAtPosition)(languageFeaturesService.referenceProvider, model, new position_1.Position(1, 2), false, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 2);
            const [first, second] = value;
            assert.strictEqual(first.uri.path, '/second');
            assert.strictEqual(second.uri.path, '/first');
        });
        test('References, data conversion', async () => {
            disposables.add(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    return [new types.Location(model.uri, new types.Position(0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getReferencesAtPosition)(languageFeaturesService.referenceProvider, model, new position_1.Position(1, 2), false, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
            const [item] = value;
            assert.deepStrictEqual(item.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
            assert.strictEqual(item.uri.toString(), model.uri.toString());
        });
        test('References, evil provider', async () => {
            disposables.add(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    throw new Error('evil');
                }
            }));
            disposables.add(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    return [new types.Location(model.uri, new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getReferencesAtPosition)(languageFeaturesService.referenceProvider, model, new position_1.Position(1, 2), false, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
        });
        // --- quick fix
        test('Quick Fix, command data conversion', async () => {
            disposables.add(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions() {
                    return [
                        { command: 'test1', title: 'Testing1' },
                        { command: 'test2', title: 'Testing2' }
                    ];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, codeAction_1.getCodeActions)(languageFeaturesService.codeActionProvider, model, model.getFullModelRange(), { type: 1 /* languages.CodeActionTriggerType.Invoke */, triggerAction: types_1.CodeActionTriggerSource.QuickFix }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            const { validActions: actions } = value;
            assert.strictEqual(actions.length, 2);
            const [first, second] = actions;
            assert.strictEqual(first.action.title, 'Testing1');
            assert.strictEqual(first.action.command.id, 'test1');
            assert.strictEqual(second.action.title, 'Testing2');
            assert.strictEqual(second.action.command.id, 'test2');
            value.dispose();
        });
        test('Quick Fix, code action data conversion', async () => {
            disposables.add(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions() {
                    return [
                        {
                            title: 'Testing1',
                            command: { title: 'Testing1Command', command: 'test1' },
                            kind: types.CodeActionKind.Empty.append('test.scope')
                        }
                    ];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, codeAction_1.getCodeActions)(languageFeaturesService.codeActionProvider, model, model.getFullModelRange(), { type: 1 /* languages.CodeActionTriggerType.Invoke */, triggerAction: types_1.CodeActionTriggerSource.Default }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            const { validActions: actions } = value;
            assert.strictEqual(actions.length, 1);
            const [first] = actions;
            assert.strictEqual(first.action.title, 'Testing1');
            assert.strictEqual(first.action.command.title, 'Testing1Command');
            assert.strictEqual(first.action.command.id, 'test1');
            assert.strictEqual(first.action.kind, 'test.scope');
            value.dispose();
        });
        test('Cannot read property \'id\' of undefined, #29469', async () => {
            disposables.add(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeActions() {
                    return [
                        undefined,
                        null,
                        { command: 'test', title: 'Testing' }
                    ];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, codeAction_1.getCodeActions)(languageFeaturesService.codeActionProvider, model, model.getFullModelRange(), { type: 1 /* languages.CodeActionTriggerType.Invoke */, triggerAction: types_1.CodeActionTriggerSource.Default }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            const { validActions: actions } = value;
            assert.strictEqual(actions.length, 1);
            value.dispose();
        });
        test('Quick Fix, evil provider', async () => {
            disposables.add(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeActions() {
                    throw new Error('evil');
                }
            }));
            disposables.add(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeActions() {
                    return [{ command: 'test', title: 'Testing' }];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, codeAction_1.getCodeActions)(languageFeaturesService.codeActionProvider, model, model.getFullModelRange(), { type: 1 /* languages.CodeActionTriggerType.Invoke */, triggerAction: types_1.CodeActionTriggerSource.QuickFix }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            const { validActions: actions } = value;
            assert.strictEqual(actions.length, 1);
            value.dispose();
        });
        // --- navigate types
        test('Navigate types, evil provider', async () => {
            disposables.add(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    throw new Error('evil');
                }
            }));
            disposables.add(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    return [new types.SymbolInformation('testing', types.SymbolKind.Array, new types.Range(0, 0, 1, 1))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, search_1.getWorkspaceSymbols)('');
            assert.strictEqual(value.length, 1);
            const [first] = value;
            assert.strictEqual(first.symbol.name, 'testing');
        });
        test('Navigate types, de-duplicate results', async () => {
            const uri = uri_1.URI.from({ scheme: 'foo', path: '/some/path' });
            disposables.add(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    return [new types.SymbolInformation('ONE', types.SymbolKind.Array, undefined, new types.Location(uri, new types.Range(0, 0, 1, 1)))];
                }
            }));
            disposables.add(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    return [new types.SymbolInformation('ONE', types.SymbolKind.Array, undefined, new types.Location(uri, new types.Range(0, 0, 1, 1)))]; // get de-duped
                }
            }));
            disposables.add(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    return [new types.SymbolInformation('ONE', types.SymbolKind.Array, undefined, new types.Location(uri, undefined))]; // NO dedupe because of resolve
                }
                resolveWorkspaceSymbol(a) {
                    return a;
                }
            }));
            disposables.add(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    return [new types.SymbolInformation('ONE', types.SymbolKind.Struct, undefined, new types.Location(uri, new types.Range(0, 0, 1, 1)))]; // NO dedupe because of kind
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, search_1.getWorkspaceSymbols)('');
            assert.strictEqual(value.length, 3);
        });
        // --- rename
        test('Rename, evil provider 0/2', async () => {
            disposables.add(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits() {
                    throw new class Foo {
                    };
                }
            }));
            await rpcProtocol.sync();
            try {
                await (0, rename_1.rename)(languageFeaturesService.renameProvider, model, new position_1.Position(1, 1), 'newName');
                throw Error();
            }
            catch (err) {
                // expected
            }
        });
        test('Rename, evil provider 1/2', async () => {
            disposables.add(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits() {
                    throw Error('evil');
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, rename_1.rename)(languageFeaturesService.renameProvider, model, new position_1.Position(1, 1), 'newName');
            assert.strictEqual(value.rejectReason, 'evil');
        });
        test('Rename, evil provider 2/2', async () => {
            disposables.add(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideRenameEdits() {
                    throw Error('evil');
                }
            }));
            disposables.add(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits() {
                    const edit = new types.WorkspaceEdit();
                    edit.replace(model.uri, new types.Range(0, 0, 0, 0), 'testing');
                    return edit;
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, rename_1.rename)(languageFeaturesService.renameProvider, model, new position_1.Position(1, 1), 'newName');
            assert.strictEqual(value.edits.length, 1);
        });
        test('Rename, ordering', async () => {
            disposables.add(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideRenameEdits() {
                    const edit = new types.WorkspaceEdit();
                    edit.replace(model.uri, new types.Range(0, 0, 0, 0), 'testing');
                    edit.replace(model.uri, new types.Range(1, 0, 1, 0), 'testing');
                    return edit;
                }
            }));
            disposables.add(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits() {
                    return;
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, rename_1.rename)(languageFeaturesService.renameProvider, model, new position_1.Position(1, 1), 'newName');
            // least relevant rename provider
            assert.strictEqual(value.edits.length, 2);
        });
        test('Multiple RenameProviders don\'t respect all possible PrepareRename handlers 1/2, #98352', async function () {
            const called = [false, false, false, false];
            disposables.add(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                prepareRename(document, position) {
                    called[0] = true;
                    const range = document.getWordRangeAtPosition(position);
                    return range;
                }
                provideRenameEdits() {
                    called[1] = true;
                    return undefined;
                }
            }));
            disposables.add(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                prepareRename(document, position) {
                    called[2] = true;
                    return Promise.reject('Cannot rename this symbol2.');
                }
                provideRenameEdits() {
                    called[3] = true;
                    return undefined;
                }
            }));
            await rpcProtocol.sync();
            await (0, rename_1.rename)(languageFeaturesService.renameProvider, model, new position_1.Position(1, 1), 'newName');
            assert.deepStrictEqual(called, [true, true, true, false]);
        });
        test('Multiple RenameProviders don\'t respect all possible PrepareRename handlers 2/2, #98352', async function () {
            const called = [false, false, false];
            disposables.add(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                prepareRename(document, position) {
                    called[0] = true;
                    const range = document.getWordRangeAtPosition(position);
                    return range;
                }
                provideRenameEdits() {
                    called[1] = true;
                    return undefined;
                }
            }));
            disposables.add(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits(document, position, newName) {
                    called[2] = true;
                    return new types.WorkspaceEdit();
                }
            }));
            await rpcProtocol.sync();
            await (0, rename_1.rename)(languageFeaturesService.renameProvider, model, new position_1.Position(1, 1), 'newName');
            // first provider has NO prepare which means it is taken by default
            assert.deepStrictEqual(called, [false, false, true]);
        });
        // --- parameter hints
        test('Parameter Hints, order', async () => {
            disposables.add(extHost.registerSignatureHelpProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSignatureHelp() {
                    return undefined;
                }
            }, []));
            disposables.add(extHost.registerSignatureHelpProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSignatureHelp() {
                    return {
                        signatures: [],
                        activeParameter: 0,
                        activeSignature: 0
                    };
                }
            }, []));
            await rpcProtocol.sync();
            const value = await (0, provideSignatureHelp_1.provideSignatureHelp)(languageFeaturesService.signatureHelpProvider, model, new position_1.Position(1, 1), { triggerKind: languages.SignatureHelpTriggerKind.Invoke, isRetrigger: false }, cancellation_1.CancellationToken.None);
            assert.ok(value);
        });
        test('Parameter Hints, evil provider', async () => {
            disposables.add(extHost.registerSignatureHelpProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSignatureHelp() {
                    throw new Error('evil');
                }
            }, []));
            await rpcProtocol.sync();
            const value = await (0, provideSignatureHelp_1.provideSignatureHelp)(languageFeaturesService.signatureHelpProvider, model, new position_1.Position(1, 1), { triggerKind: languages.SignatureHelpTriggerKind.Invoke, isRetrigger: false }, cancellation_1.CancellationToken.None);
            assert.strictEqual(value, undefined);
        });
        // --- suggestions
        test('Suggest, order 1/3', async () => {
            disposables.add(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('testing1')];
                }
            }, []));
            disposables.add(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('testing2')];
                }
            }, []));
            await rpcProtocol.sync();
            const value = await (0, suggest_1.provideSuggestionItems)(languageFeaturesService.completionProvider, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* languages.CompletionItemKind.Snippet */)));
            assert.strictEqual(value.items.length, 1);
            assert.strictEqual(value.items[0].completion.insertText, 'testing2');
            value.disposable.dispose();
        });
        test('Suggest, order 2/3', async () => {
            disposables.add(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('weak-selector')]; // weaker selector but result
                }
            }, []));
            disposables.add(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return []; // stronger selector but not a good result;
                }
            }, []));
            await rpcProtocol.sync();
            const value = await (0, suggest_1.provideSuggestionItems)(languageFeaturesService.completionProvider, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* languages.CompletionItemKind.Snippet */)));
            assert.strictEqual(value.items.length, 1);
            assert.strictEqual(value.items[0].completion.insertText, 'weak-selector');
            value.disposable.dispose();
        });
        test('Suggest, order 3/3', async () => {
            disposables.add(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('strong-1')];
                }
            }, []));
            disposables.add(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('strong-2')];
                }
            }, []));
            await rpcProtocol.sync();
            const value = await (0, suggest_1.provideSuggestionItems)(languageFeaturesService.completionProvider, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* languages.CompletionItemKind.Snippet */)));
            assert.strictEqual(value.items.length, 2);
            assert.strictEqual(value.items[0].completion.insertText, 'strong-1'); // sort by label
            assert.strictEqual(value.items[1].completion.insertText, 'strong-2');
            value.disposable.dispose();
        });
        test('Suggest, evil provider', async () => {
            disposables.add(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    throw new Error('evil');
                }
            }, []));
            disposables.add(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('testing')];
                }
            }, []));
            await rpcProtocol.sync();
            const value = await (0, suggest_1.provideSuggestionItems)(languageFeaturesService.completionProvider, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* languages.CompletionItemKind.Snippet */)));
            assert.strictEqual(value.items[0].container.incomplete, false);
            value.disposable.dispose();
        });
        test('Suggest, CompletionList', async () => {
            disposables.add(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return new types.CompletionList([new types.CompletionItem('hello')], true);
                }
            }, []));
            await rpcProtocol.sync();
            await (0, suggest_1.provideSuggestionItems)(languageFeaturesService.completionProvider, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* languages.CompletionItemKind.Snippet */))).then(model => {
                assert.strictEqual(model.items[0].container.incomplete, true);
                model.disposable.dispose();
            });
        });
        // --- format
        const NullWorkerService = new class extends (0, mock_1.mock)() {
            computeMoreMinimalEdits(resource, edits) {
                return Promise.resolve(edits ?? undefined);
            }
        };
        test('Format Doc, data conversion', async () => {
            disposables.add(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), 'testing'), types.TextEdit.setEndOfLine(types.EndOfLine.LF)];
                }
            }));
            await rpcProtocol.sync();
            const value = (await (0, format_1.getDocumentFormattingEditsUntilResult)(NullWorkerService, languageFeaturesService, model, { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None));
            assert.strictEqual(value.length, 2);
            const [first, second] = value;
            assert.strictEqual(first.text, 'testing');
            assert.deepStrictEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
            assert.strictEqual(second.eol, 0 /* EndOfLineSequence.LF */);
            assert.strictEqual(second.text, '');
            assert.deepStrictEqual(second.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Format Doc, evil provider', async () => {
            disposables.add(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    throw new Error('evil');
                }
            }));
            await rpcProtocol.sync();
            return (0, format_1.getDocumentFormattingEditsUntilResult)(NullWorkerService, languageFeaturesService, model, { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None);
        });
        test('Format Doc, order', async () => {
            disposables.add(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return undefined;
                }
            }));
            disposables.add(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), 'testing')];
                }
            }));
            disposables.add(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return undefined;
                }
            }));
            await rpcProtocol.sync();
            const value = (await (0, format_1.getDocumentFormattingEditsUntilResult)(NullWorkerService, languageFeaturesService, model, { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None));
            assert.strictEqual(value.length, 1);
            const [first] = value;
            assert.strictEqual(first.text, 'testing');
            assert.deepStrictEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Format Range, data conversion', async () => {
            disposables.add(extHost.registerDocumentRangeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentRangeFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), 'testing')];
                }
            }));
            await rpcProtocol.sync();
            const value = (await (0, format_1.getDocumentRangeFormattingEditsUntilResult)(NullWorkerService, languageFeaturesService, model, new range_1.Range(1, 1, 1, 1), { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None));
            assert.strictEqual(value.length, 1);
            const [first] = value;
            assert.strictEqual(first.text, 'testing');
            assert.deepStrictEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Format Range, + format_doc', async () => {
            disposables.add(extHost.registerDocumentRangeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentRangeFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), 'range')];
                }
            }));
            disposables.add(extHost.registerDocumentRangeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentRangeFormattingEdits() {
                    return [new types.TextEdit(new types.Range(2, 3, 4, 5), 'range2')];
                }
            }));
            disposables.add(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 1, 1), 'doc')];
                }
            }));
            await rpcProtocol.sync();
            const value = (await (0, format_1.getDocumentRangeFormattingEditsUntilResult)(NullWorkerService, languageFeaturesService, model, new range_1.Range(1, 1, 1, 1), { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None));
            assert.strictEqual(value.length, 1);
            const [first] = value;
            assert.strictEqual(first.text, 'range2');
            assert.strictEqual(first.range.startLineNumber, 3);
            assert.strictEqual(first.range.startColumn, 4);
            assert.strictEqual(first.range.endLineNumber, 5);
            assert.strictEqual(first.range.endColumn, 6);
        });
        test('Format Range, evil provider', async () => {
            disposables.add(extHost.registerDocumentRangeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentRangeFormattingEdits() {
                    throw new Error('evil');
                }
            }));
            await rpcProtocol.sync();
            return (0, format_1.getDocumentRangeFormattingEditsUntilResult)(NullWorkerService, languageFeaturesService, model, new range_1.Range(1, 1, 1, 1), { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None);
        });
        test('Format on Type, data conversion', async () => {
            disposables.add(extHost.registerOnTypeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideOnTypeFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), arguments[2])];
                }
            }, [';']));
            await rpcProtocol.sync();
            const value = (await (0, format_1.getOnTypeFormattingEdits)(NullWorkerService, languageFeaturesService, model, new position_1.Position(1, 1), ';', { insertSpaces: true, tabSize: 2 }, cancellation_1.CancellationToken.None));
            assert.strictEqual(value.length, 1);
            const [first] = value;
            assert.strictEqual(first.text, ';');
            assert.deepStrictEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Links, data conversion', async () => {
            disposables.add(extHost.registerDocumentLinkProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentLinks() {
                    const link = new types.DocumentLink(new types.Range(0, 0, 1, 1), uri_1.URI.parse('foo:bar#3'));
                    link.tooltip = 'tooltip';
                    return [link];
                }
            }));
            await rpcProtocol.sync();
            const { links } = disposables.add(await (0, getLinks_1.getLinks)(languageFeaturesService.linkProvider, model, cancellation_1.CancellationToken.None));
            assert.strictEqual(links.length, 1);
            const [first] = links;
            assert.strictEqual(first.url?.toString(), 'foo:bar#3');
            assert.deepStrictEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 2, endColumn: 2 });
            assert.strictEqual(first.tooltip, 'tooltip');
        });
        test('Links, evil provider', async () => {
            disposables.add(extHost.registerDocumentLinkProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentLinks() {
                    return [new types.DocumentLink(new types.Range(0, 0, 1, 1), uri_1.URI.parse('foo:bar#3'))];
                }
            }));
            disposables.add(extHost.registerDocumentLinkProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentLinks() {
                    throw new Error();
                }
            }));
            await rpcProtocol.sync();
            const { links } = disposables.add(await (0, getLinks_1.getLinks)(languageFeaturesService.linkProvider, model, cancellation_1.CancellationToken.None));
            assert.strictEqual(links.length, 1);
            const [first] = links;
            assert.strictEqual(first.url?.toString(), 'foo:bar#3');
            assert.deepStrictEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 2, endColumn: 2 });
        });
        test('Document colors, data conversion', async () => {
            disposables.add(extHost.registerColorProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentColors() {
                    return [new types.ColorInformation(new types.Range(0, 0, 0, 20), new types.Color(0.1, 0.2, 0.3, 0.4))];
                }
                provideColorPresentations(color, context) {
                    return [];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, color_1.getColors)(languageFeaturesService.colorProvider, model, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
            const [first] = value;
            assert.deepStrictEqual(first.colorInfo.color, { red: 0.1, green: 0.2, blue: 0.3, alpha: 0.4 });
            assert.deepStrictEqual(first.colorInfo.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 21 });
        });
        // -- selection ranges
        test('Selection Ranges, data conversion', async () => {
            disposables.add(extHost.registerSelectionRangeProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSelectionRanges() {
                    return [
                        new types.SelectionRange(new types.Range(0, 10, 0, 18), new types.SelectionRange(new types.Range(0, 2, 0, 20))),
                    ];
                }
            }));
            await rpcProtocol.sync();
            (0, smartSelect_1.provideSelectionRanges)(languageFeaturesService.selectionRangeProvider, model, [new position_1.Position(1, 17)], { selectLeadingAndTrailingWhitespace: true, selectSubwords: true }, cancellation_1.CancellationToken.None).then(ranges => {
                assert.strictEqual(ranges.length, 1);
                assert.ok(ranges[0].length >= 2);
            });
        });
        test('Selection Ranges, bad data', async () => {
            try {
                const _a = new types.SelectionRange(new types.Range(0, 10, 0, 18), new types.SelectionRange(new types.Range(0, 11, 0, 18)));
                assert.ok(false, String(_a));
            }
            catch (err) {
                assert.ok(true);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExhbmd1YWdlRmVhdHVyZXMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS90ZXN0L2Jyb3dzZXIvZXh0SG9zdExhbmd1YWdlRmVhdHVyZXMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXdEaEcsS0FBSyxDQUFDLHlCQUF5QixFQUFFO1FBRWhDLE1BQU0sZUFBZSxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDO1FBQzFDLElBQUksS0FBaUIsQ0FBQztRQUN0QixJQUFJLE9BQWdDLENBQUM7UUFDckMsSUFBSSxVQUFzQyxDQUFDO1FBQzNDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBQzFDLElBQUksV0FBNEIsQ0FBQztRQUNqQyxJQUFJLHVCQUFpRCxDQUFDO1FBQ3RELElBQUksb0JBQXFDLENBQUM7UUFDMUMsSUFBSSxvQkFBOEMsQ0FBQztRQUVuRCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBRVYsS0FBSyxHQUFHLElBQUEsK0JBQWUsRUFDdEI7Z0JBQ0Msd0JBQXdCO2dCQUN4Qix5QkFBeUI7Z0JBQ3pCLHdCQUF3QjthQUN4QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDWixTQUFTLEVBQ1QsU0FBUyxFQUNULFNBQUcsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO1lBRXBDLFdBQVcsR0FBRyxJQUFJLGlDQUFlLEVBQUUsQ0FBQztZQUVwQyx1QkFBdUIsR0FBRyxJQUFJLGlEQUF1QixFQUFFLENBQUM7WUFFeEQsbUVBQW1FO1lBQ25FLElBQUksSUFBMkIsQ0FBQztZQUNoQyxDQUFDO2dCQUNBLG9CQUFvQixHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztnQkFDdEQsb0JBQW9CLENBQUMs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