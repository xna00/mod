/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/errors", "vs/base/common/uri", "vs/base/common/event", "vs/workbench/api/common/extHostTypes", "vs/editor/test/common/testTextModel", "vs/workbench/api/test/common/testRPCProtocol", "vs/platform/markers/common/markerService", "vs/platform/markers/common/markers", "vs/platform/commands/common/commands", "vs/editor/common/services/model", "vs/workbench/api/common/extHostLanguageFeatures", "vs/workbench/api/browser/mainThreadLanguageFeatures", "vs/workbench/api/common/extHostApiCommands", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/browser/mainThreadCommands", "vs/workbench/api/common/extHostDocuments", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostDiagnostics", "vs/platform/log/common/log", "vs/workbench/services/extensions/common/extensions", "vs/base/common/lifecycle", "vs/editor/common/services/editorWorker", "vs/base/test/common/mock", "vs/workbench/api/common/extHostApiDeprecationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/common/descriptors", "vs/editor/common/services/resolverService", "vs/workbench/api/common/extHostUriTransformerService", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/languageFeaturesService", "vs/base/common/types", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/environment/common/environment", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/test/common/utils", "vs/base/test/common/timeTravelScheduler", "vs/base/common/async", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codelens/browser/codelens", "vs/editor/contrib/colorPicker/browser/color", "vs/editor/contrib/format/browser/format", "vs/editor/contrib/gotoSymbol/browser/goToCommands", "vs/editor/contrib/documentSymbols/browser/documentSymbols", "vs/editor/contrib/hover/browser/getHover", "vs/editor/contrib/links/browser/getLinks", "vs/editor/contrib/parameterHints/browser/provideSignatureHelp", "vs/editor/contrib/smartSelect/browser/smartSelect", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/contrib/rename/browser/rename", "vs/editor/contrib/inlayHints/browser/inlayHintsController", "vs/workbench/contrib/search/browser/search.contribution"], function (require, exports, assert, errors_1, uri_1, event_1, types, testTextModel_1, testRPCProtocol_1, markerService_1, markers_1, commands_1, model_1, extHostLanguageFeatures_1, mainThreadLanguageFeatures_1, extHostApiCommands_1, extHostCommands_1, mainThreadCommands_1, extHostDocuments_1, extHostDocumentsAndEditors_1, extHost_protocol_1, extHostDiagnostics_1, log_1, extensions_1, lifecycle_1, editorWorker_1, mock_1, extHostApiDeprecationService_1, serviceCollection_1, descriptors_1, resolverService_1, extHostUriTransformerService_1, outlineModel_1, languageFeatureDebounce_1, languageFeatures_1, languageFeaturesService_1, types_1, uriIdentity_1, configuration_1, testConfigurationService_1, environment_1, instantiationServiceMock_1, utils_1, timeTravelScheduler_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function assertRejects(fn, message = 'Expected rejection') {
        return fn().then(() => assert.ok(false, message), _err => assert.ok(true));
    }
    function isLocation(value) {
        const candidate = value;
        return candidate && candidate.uri instanceof uri_1.URI && candidate.range instanceof types.Range;
    }
    suite('ExtHostLanguageFeatureCommands', function () {
        const defaultSelector = { scheme: 'far' };
        let model;
        let insta;
        let rpcProtocol;
        let extHost;
        let mainThread;
        let commands;
        let disposables = [];
        let originalErrorHandler;
        suiteSetup(() => {
            model = (0, testTextModel_1.createTextModel)([
                'This is the first line',
                'This is the second line',
                'This is the third line',
            ].join('\n'), undefined, undefined, uri_1.URI.parse('far://testing/file.b'));
            originalErrorHandler = errors_1.errorHandler.getUnexpectedErrorHandler();
            (0, errors_1.setUnexpectedErrorHandler)(() => { });
            // Use IInstantiationService to get typechecking when instantiating
            rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            const services = new serviceCollection_1.ServiceCollection();
            services.set(uriIdentity_1.IUriIdentityService, new class extends (0, mock_1.mock)() {
                asCanonicalUri(uri) {
                    return uri;
                }
            });
            services.set(languageFeatures_1.ILanguageFeaturesService, new descriptors_1.SyncDescriptor(languageFeaturesService_1.LanguageFeaturesService));
            services.set(extensions_1.IExtensionService, new class extends (0, mock_1.mock)() {
                async activateByEvent() {
                }
                activationEventIsDone(activationEvent) {
                    return true;
                }
            });
            services.set(commands_1.ICommandService, new descriptors_1.SyncDescriptor(class extends (0, mock_1.mock)() {
                executeCommand(id, ...args) {
                    const command = commands_1.CommandsRegistry.getCommands().get(id);
                    if (!command) {
                        return Promise.reject(new Error(id + ' NOT known'));
                    }
                    const { handler } = command;
                    return Promise.resolve(insta.invokeFunction(handler, ...args));
                }
            }));
            services.set(environment_1.IEnvironmentService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.isBuilt = true;
                    this.isExtensionDevelopment = false;
                }
            });
            services.set(markers_1.IMarkerService, new markerService_1.MarkerService());
            services.set(log_1.ILogService, new descriptors_1.SyncDescriptor(log_1.NullLogService));
            services.set(languageFeatureDebounce_1.ILanguageFeatureDebounceService, new descriptors_1.SyncDescriptor(languageFeatureDebounce_1.LanguageFeatureDebounceService));
            services.set(model_1.IModelService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onModelRemoved = event_1.Event.None;
                }
                getModel() { return model; }
            });
            services.set(resolverService_1.ITextModelService, new class extends (0, mock_1.mock)() {
                async createModelReference() {
                    return new lifecycle_1.ImmortalReference(new class extends (0, mock_1.mock)() {
                        constructor() {
                            super(...arguments);
                            this.textEditorModel = model;
                        }
                    });
                }
            });
            services.set(editorWorker_1.IEditorWorkerService, new class extends (0, mock_1.mock)() {
                async computeMoreMinimalEdits(_uri, edits) {
                    return edits || undefined;
                }
            });
            services.set(languageFeatureDebounce_1.ILanguageFeatureDebounceService, new descriptors_1.SyncDescriptor(languageFeatureDebounce_1.LanguageFeatureDebounceService));
            services.set(outlineModel_1.IOutlineModelService, new descriptors_1.SyncDescriptor(outlineModel_1.OutlineModelService));
            services.set(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            insta = new instantiationServiceMock_1.TestInstantiationService(services);
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
            commands = new extHostCommands_1.ExtHostCommands(rpcProtocol, new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
                onExtensionError() {
                    return true;
                }
            });
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostCommands, commands);
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadCommands, insta.createInstance(mainThreadCommands_1.MainThreadCommands, rpcProtocol));
            extHostApiCommands_1.ExtHostApiCommands.register(commands);
            const diagnostics = new extHostDiagnostics_1.ExtHostDiagnostics(rpcProtocol, new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
            }, extHostDocumentsAndEditors);
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDiagnostics, diagnostics);
            extHost = new extHostLanguageFeatures_1.ExtHostLanguageFeatures(rpcProtocol, new extHostUriTransformerService_1.URITransformerService(null), extHostDocuments, commands, diagnostics, new log_1.NullLogService(), extHostApiDeprecationService_1.NullApiDeprecationService, new class extends (0, mock_1.mock)() {
                onExtensionError() {
                    return true;
                }
            });
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLanguageFeatures, extHost);
            mainThread = rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadLanguageFeatures, insta.createInstance(mainThreadLanguageFeatures_1.MainThreadLanguageFeatures, rpcProtocol));
            // forcefully create the outline service so that `ensureNoDisposablesAreLeakedInTestSuite` doesn't bark
            insta.get(outlineModel_1.IOutlineModelService);
            return rpcProtocol.sync();
        });
        suiteTeardown(() => {
            (0, errors_1.setUnexpectedErrorHandler)(originalErrorHandler);
            model.dispose();
            mainThread.dispose();
            insta.get(outlineModel_1.IOutlineModelService).dispose();
            insta.dispose();
        });
        teardown(() => {
            disposables = (0, lifecycle_1.dispose)(disposables);
            return rpcProtocol.sync();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        // --- workspace symbols
        function testApiCmd(name, fn) {
            test(name, async function () {
                await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                    await fn();
                    await (0, async_1.timeout)(10000); // API commands for things that allow commands dispose their result delay. This is to be nice
                    // because otherwise properties like command are disposed too early
                });
            });
        }
        test('WorkspaceSymbols, invalid arguments', function () {
            const promises = [
                assertRejects(() => commands.executeCommand('vscode.executeWorkspaceSymbolProvider')),
                assertRejects(() => commands.executeCommand('vscode.executeWorkspaceSymbolProvider', null)),
                assertRejects(() => commands.executeCommand('vscode.executeWorkspaceSymbolProvider', undefined)),
                assertRejects(() => commands.executeCommand('vscode.executeWorkspaceSymbolProvider', true))
            ];
            return Promise.all(promises);
        });
        test('WorkspaceSymbols, back and forth', function () {
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, {
                provideWorkspaceSymbols(query) {
                    return [
                        new types.SymbolInformation(query, types.SymbolKind.Array, new types.Range(0, 0, 1, 1), uri_1.URI.parse('far://testing/first')),
                        new types.SymbolInformation(query, types.SymbolKind.Array, new types.Range(0, 0, 1, 1), uri_1.URI.parse('far://testing/second'))
                    ];
                }
            }));
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, {
                provideWorkspaceSymbols(query) {
                    return [
                        new types.SymbolInformation(query, types.SymbolKind.Array, new types.Range(0, 0, 1, 1), uri_1.URI.parse('far://testing/first'))
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeWorkspaceSymbolProvider', 'testing').then(value => {
                    assert.strictEqual(value.length, 2); // de-duped
                    for (const info of value) {
                        assert.strictEqual(info instanceof types.SymbolInformation, true);
                        assert.strictEqual(info.name, 'testing');
                        assert.strictEqual(info.kind, types.SymbolKind.Array);
                    }
                });
            });
        });
        test('executeWorkspaceSymbolProvider should accept empty string, #39522', async function () {
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, {
                provideWorkspaceSymbols() {
                    return [new types.SymbolInformation('hello', types.SymbolKind.Array, new types.Range(0, 0, 0, 0), uri_1.URI.parse('foo:bar'))];
                }
            }));
            await rpcProtocol.sync();
            let symbols = await commands.executeCommand('vscode.executeWorkspaceSymbolProvider', '');
            assert.strictEqual(symbols.length, 1);
            await rpcProtocol.sync();
            symbols = await commands.executeCommand('vscode.executeWorkspaceSymbolProvider', '*');
            assert.strictEqual(symbols.length, 1);
        });
        // --- formatting
        test('executeFormatDocumentProvider, back and forth', async function () {
            disposables.push(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return [types.TextEdit.insert(new types.Position(0, 0), '42')];
                }
            }));
            await rpcProtocol.sync();
            const edits = await commands.executeCommand('vscode.executeFormatDocumentProvider', model.uri);
            assert.strictEqual(edits.length, 1);
        });
        // --- rename
        test('vscode.prepareRename', async function () {
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                prepareRename(document, position) {
                    return {
                        range: new types.Range(0, 12, 0, 24),
                        placeholder: 'foooPlaceholder'
                    };
                }
                provideRenameEdits(document, position, newName) {
                    const edit = new types.WorkspaceEdit();
                    edit.insert(document.uri, position, newName);
                    return edit;
                }
            }));
            await rpcProtocol.sync();
            const data = await commands.executeCommand('vscode.prepareRename', model.uri, new types.Position(0, 12));
            assert.ok(data);
            assert.strictEqual(data.placeholder, 'foooPlaceholder');
            assert.strictEqual(data.range.start.line, 0);
            assert.strictEqual(data.range.start.character, 12);
            assert.strictEqual(data.range.end.line, 0);
            assert.strictEqual(data.range.end.character, 24);
        });
        test('vscode.executeDocumentRenameProvider', async function () {
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits(document, position, newName) {
                    const edit = new types.WorkspaceEdit();
                    edit.insert(document.uri, position, newName);
                    return edit;
                }
            }));
            await rpcProtocol.sync();
            const edit = await commands.executeCommand('vscode.executeDocumentRenameProvider', model.uri, new types.Position(0, 12), 'newNameOfThis');
            assert.ok(edit);
            assert.strictEqual(edit.has(model.uri), true);
            const textEdits = edit.get(model.uri);
            assert.strictEqual(textEdits.length, 1);
            assert.strictEqual(textEdits[0].newText, 'newNameOfThis');
        });
        // --- definition
        test('Definition, invalid arguments', function () {
            const promises = [
                assertRejects(() => commands.executeCommand('vscode.executeDefinitionProvider')),
                assertRejects(() => commands.executeCommand('vscode.executeDefinitionProvider', null)),
                assertRejects(() => commands.executeCommand('vscode.executeDefinitionProvider', undefined)),
                assertRejects(() => commands.executeCommand('vscode.executeDefinitionProvider', true, false))
            ];
            return Promise.all(promises);
        });
        test('Definition, back and forth', function () {
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDefinition(doc) {
                    return new types.Location(doc.uri, new types.Range(1, 0, 0, 0));
                }
            }));
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDefinition(doc) {
                    // duplicate result will get removed
                    return new types.Location(doc.uri, new types.Range(1, 0, 0, 0));
                }
            }));
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDefinition(doc) {
                    return [
                        new types.Location(doc.uri, new types.Range(2, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(3, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(4, 0, 0, 0)),
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeDefinitionProvider', model.uri, new types.Position(0, 0)).then(values => {
                    assert.strictEqual(values.length, 4);
                    for (const v of values) {
                        assert.ok(v.uri instanceof uri_1.URI);
                        assert.ok(v.range instanceof types.Range);
                    }
                });
            });
        });
        test('Definition, back and forth (sorting & de-deduping)', function () {
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDefinition(doc) {
                    return new types.Location(uri_1.URI.parse('file:///b'), new types.Range(1, 0, 0, 0));
                }
            }));
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDefinition(doc) {
                    // duplicate result will get removed
                    return new types.Location(uri_1.URI.parse('file:///b'), new types.Range(1, 0, 0, 0));
                }
            }));
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDefinition(doc) {
                    return [
                        new types.Location(uri_1.URI.parse('file:///a'), new types.Range(2, 0, 0, 0)),
                        new types.Location(uri_1.URI.parse('file:///c'), new types.Range(3, 0, 0, 0)),
                        new types.Location(uri_1.URI.parse('file:///d'), new types.Range(4, 0, 0, 0)),
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeDefinitionProvider', model.uri, new types.Position(0, 0)).then(values => {
                    assert.strictEqual(values.length, 4);
                    assert.strictEqual(values[0].uri.path, '/a');
                    assert.strictEqual(values[1].uri.path, '/b');
                    assert.strictEqual(values[2].uri.path, '/c');
                    assert.strictEqual(values[3].uri.path, '/d');
                });
            });
        });
        test('Definition Link', () => {
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDefinition(doc) {
                    return [
                        new types.Location(doc.uri, new types.Range(0, 0, 0, 0)),
                        { targetUri: doc.uri, targetRange: new types.Range(1, 0, 0, 0), targetSelectionRange: new types.Range(1, 1, 1, 1), originSelectionRange: new types.Range(2, 2, 2, 2) }
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeDefinitionProvider', model.uri, new types.Position(0, 0)).then(values => {
                    assert.strictEqual(values.length, 2);
                    for (const v of values) {
                        if (isLocation(v)) {
                            assert.ok(v.uri instanceof uri_1.URI);
                            assert.ok(v.range instanceof types.Range);
                        }
                        else {
                            assert.ok(v.targetUri instanceof uri_1.URI);
                            assert.ok(v.targetRange instanceof types.Range);
                            assert.ok(v.targetSelectionRange instanceof types.Range);
                            assert.ok(v.originSelectionRange instanceof types.Range);
                        }
                    }
                });
            });
        });
        // --- declaration
        test('Declaration, back and forth', function () {
            disposables.push(extHost.registerDeclarationProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDeclaration(doc) {
                    return new types.Location(doc.uri, new types.Range(1, 0, 0, 0));
                }
            }));
            disposables.push(extHost.registerDeclarationProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDeclaration(doc) {
                    // duplicate result will get removed
                    return new types.Location(doc.uri, new types.Range(1, 0, 0, 0));
                }
            }));
            disposables.push(extHost.registerDeclarationProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDeclaration(doc) {
                    return [
                        new types.Location(doc.uri, new types.Range(2, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(3, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(4, 0, 0, 0)),
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeDeclarationProvider', model.uri, new types.Position(0, 0)).then(values => {
                    assert.strictEqual(values.length, 4);
                    for (const v of values) {
                        assert.ok(v.uri instanceof uri_1.URI);
                        assert.ok(v.range instanceof types.Range);
                    }
                });
            });
        });
        test('Declaration Link', () => {
            disposables.push(extHost.registerDeclarationProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDeclaration(doc) {
                    return [
                        new types.Location(doc.uri, new types.Range(0, 0, 0, 0)),
                        { targetUri: doc.uri, targetRange: new types.Range(1, 0, 0, 0), targetSelectionRange: new types.Range(1, 1, 1, 1), originSelectionRange: new types.Range(2, 2, 2, 2) }
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeDeclarationProvider', model.uri, new types.Position(0, 0)).then(values => {
                    assert.strictEqual(values.length, 2);
                    for (const v of values) {
                        if (isLocation(v)) {
                            assert.ok(v.uri instanceof uri_1.URI);
                            assert.ok(v.range instanceof types.Range);
                        }
                        else {
                            assert.ok(v.targetUri instanceof uri_1.URI);
                            assert.ok(v.targetRange instanceof types.Range);
                            assert.ok(v.targetSelectionRange instanceof types.Range);
                            assert.ok(v.originSelectionRange instanceof types.Range);
                        }
                    }
                });
            });
        });
        // --- type definition
        test('Type Definition, invalid arguments', function () {
            const promises = [
                assertRejects(() => commands.executeCommand('vscode.executeTypeDefinitionProvider')),
                assertRejects(() => commands.executeCommand('vscode.executeTypeDefinitionProvider', null)),
                assertRejects(() => commands.executeCommand('vscode.executeTypeDefinitionProvider', undefined)),
                assertRejects(() => commands.executeCommand('vscode.executeTypeDefinitionProvider', true, false))
            ];
            return Promise.all(promises);
        });
        test('Type Definition, back and forth', function () {
            disposables.push(extHost.registerTypeDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideTypeDefinition(doc) {
                    return new types.Location(doc.uri, new types.Range(1, 0, 0, 0));
                }
            }));
            disposables.push(extHost.registerTypeDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideTypeDefinition(doc) {
                    // duplicate result will get removed
                    return new types.Location(doc.uri, new types.Range(1, 0, 0, 0));
                }
            }));
            disposables.push(extHost.registerTypeDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideTypeDefinition(doc) {
                    return [
                        new types.Location(doc.uri, new types.Range(2, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(3, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(4, 0, 0, 0)),
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeTypeDefinitionProvider', model.uri, new types.Position(0, 0)).then(values => {
                    assert.strictEqual(values.length, 4);
                    for (const v of values) {
                        assert.ok(v.uri instanceof uri_1.URI);
                        assert.ok(v.range instanceof types.Range);
                    }
                });
            });
        });
        test('Type Definition Link', () => {
            disposables.push(extHost.registerTypeDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideTypeDefinition(doc) {
                    return [
                        new types.Location(doc.uri, new types.Range(0, 0, 0, 0)),
                        { targetUri: doc.uri, targetRange: new types.Range(1, 0, 0, 0), targetSelectionRange: new types.Range(1, 1, 1, 1), originSelectionRange: new types.Range(2, 2, 2, 2) }
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeTypeDefinitionProvider', model.uri, new types.Position(0, 0)).then(values => {
                    assert.strictEqual(values.length, 2);
                    for (const v of values) {
                        if (isLocation(v)) {
                            assert.ok(v.uri instanceof uri_1.URI);
                            assert.ok(v.range instanceof types.Range);
                        }
                        else {
                            assert.ok(v.targetUri instanceof uri_1.URI);
                            assert.ok(v.targetRange instanceof types.Range);
                            assert.ok(v.targetSelectionRange instanceof types.Range);
                            assert.ok(v.originSelectionRange instanceof types.Range);
                        }
                    }
                });
            });
        });
        // --- implementation
        test('Implementation, invalid arguments', function () {
            const promises = [
                assertRejects(() => commands.executeCommand('vscode.executeImplementationProvider')),
                assertRejects(() => commands.executeCommand('vscode.executeImplementationProvider', null)),
                assertRejects(() => commands.executeCommand('vscode.executeImplementationProvider', undefined)),
                assertRejects(() => commands.executeCommand('vscode.executeImplementationProvider', true, false))
            ];
            return Promise.all(promises);
        });
        test('Implementation, back and forth', function () {
            disposables.push(extHost.registerImplementationProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideImplementation(doc) {
                    return new types.Location(doc.uri, new types.Range(1, 0, 0, 0));
                }
            }));
            disposables.push(extHost.registerImplementationProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideImplementation(doc) {
                    // duplicate result will get removed
                    return new types.Location(doc.uri, new types.Range(1, 0, 0, 0));
                }
            }));
            disposables.push(extHost.registerImplementationProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideImplementation(doc) {
                    return [
                        new types.Location(doc.uri, new types.Range(2, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(3, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(4, 0, 0, 0)),
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeImplementationProvider', model.uri, new types.Position(0, 0)).then(values => {
                    assert.strictEqual(values.length, 4);
                    for (const v of values) {
                        assert.ok(v.uri instanceof uri_1.URI);
                        assert.ok(v.range instanceof types.Range);
                    }
                });
            });
        });
        test('Implementation Definition Link', () => {
            disposables.push(extHost.registerImplementationProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideImplementation(doc) {
                    return [
                        new types.Location(doc.uri, new types.Range(0, 0, 0, 0)),
                        { targetUri: doc.uri, targetRange: new types.Range(1, 0, 0, 0), targetSelectionRange: new types.Range(1, 1, 1, 1), originSelectionRange: new types.Range(2, 2, 2, 2) }
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeImplementationProvider', model.uri, new types.Position(0, 0)).then(values => {
                    assert.strictEqual(values.length, 2);
                    for (const v of values) {
                        if (isLocation(v)) {
                            assert.ok(v.uri instanceof uri_1.URI);
                            assert.ok(v.range instanceof types.Range);
                        }
                        else {
                            assert.ok(v.targetUri instanceof uri_1.URI);
                            assert.ok(v.targetRange instanceof types.Range);
                            assert.ok(v.targetSelectionRange instanceof types.Range);
                            assert.ok(v.originSelectionRange instanceof types.Range);
                        }
                    }
                });
            });
        });
        // --- references
        test('reference search, back and forth', function () {
            disposables.push(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideReferences() {
                    return [
                        new types.Location(uri_1.URI.parse('some:uri/path'), new types.Range(0, 1, 0, 5))
                    ];
                }
            }));
            return commands.executeCommand('vscode.executeReferenceProvider', model.uri, new types.Position(0, 0)).then(values => {
                assert.strictEqual(values.length, 1);
                const [first] = values;
                assert.strictEqual(first.uri.toString(), 'some:uri/path');
                assert.strictEqual(first.range.start.line, 0);
                assert.strictEqual(first.range.start.character, 1);
                assert.strictEqual(first.range.end.line, 0);
                assert.strictEqual(first.range.end.character, 5);
            });
        });
        // --- document highlights
        test('"vscode.executeDocumentHighlights" API has stopped returning DocumentHighlight[]#200056', async function () {
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentHighlights() {
                    return [
                        new types.DocumentHighlight(new types.Range(0, 17, 0, 25), types.DocumentHighlightKind.Read)
                    ];
                }
            }));
            await rpcProtocol.sync();
            return commands.executeCommand('vscode.executeDocumentHighlights', model.uri, new types.Position(0, 0)).then(values => {
                assert.ok(Array.isArray(values));
                assert.strictEqual(values.length, 1);
                const [first] = values;
                assert.strictEqual(first.range.start.line, 0);
                assert.strictEqual(first.range.start.character, 17);
                assert.strictEqual(first.range.end.line, 0);
                assert.strictEqual(first.range.end.character, 25);
            });
        });
        // --- outline
        test('Outline, back and forth', function () {
            disposables.push(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentSymbols() {
                    return [
                        new types.SymbolInformation('testing1', types.SymbolKind.Enum, new types.Range(1, 0, 1, 0)),
                        new types.SymbolInformation('testing2', types.SymbolKind.Enum, new types.Range(0, 1, 0, 3)),
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeDocumentSymbolProvider', model.uri).then(values => {
                    assert.strictEqual(values.length, 2);
                    const [first, second] = values;
                    assert.strictEqual(first instanceof types.SymbolInformation, true);
                    assert.strictEqual(second instanceof types.SymbolInformation, true);
                    assert.strictEqual(first.name, 'testing2');
                    assert.strictEqual(second.name, 'testing1');
                });
            });
        });
        test('vscode.executeDocumentSymbolProvider command only returns SymbolInformation[] rather than DocumentSymbol[] #57984', function () {
            disposables.push(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentSymbols() {
                    return [
                        new types.SymbolInformation('SymbolInformation', types.SymbolKind.Enum, new types.Range(1, 0, 1, 0))
                    ];
                }
            }));
            disposables.push(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentSymbols() {
                    const root = new types.DocumentSymbol('DocumentSymbol', 'DocumentSymbol#detail', types.SymbolKind.Enum, new types.Range(1, 0, 1, 0), new types.Range(1, 0, 1, 0));
                    root.children = [new types.DocumentSymbol('DocumentSymbol#child', 'DocumentSymbol#detail#child', types.SymbolKind.Enum, new types.Range(1, 0, 1, 0), new types.Range(1, 0, 1, 0))];
                    return [root];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeDocumentSymbolProvider', model.uri).then(values => {
                    assert.strictEqual(values.length, 2);
                    const [first, second] = values;
                    assert.strictEqual(first instanceof types.SymbolInformation, true);
                    assert.strictEqual(first instanceof types.DocumentSymbol, false);
                    assert.strictEqual(second instanceof types.SymbolInformation, true);
                    assert.strictEqual(first.name, 'DocumentSymbol');
                    assert.strictEqual(first.children.length, 1);
                    assert.strictEqual(second.name, 'SymbolInformation');
                });
            });
        });
        // --- suggest
        testApiCmd('triggerCharacter is null when completion provider is called programmatically #159914', async function () {
            let actualContext;
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCompletionItems(_doc, _pos, _tok, context) {
                    actualContext = context;
                    return [];
                }
            }, []));
            await rpcProtocol.sync();
            await commands.executeCommand('vscode.executeCompletionItemProvider', model.uri, new types.Position(0, 4));
            assert.ok(actualContext);
            assert.deepStrictEqual(actualContext, { triggerKind: types.CompletionTriggerKind.Invoke, triggerCharacter: undefined });
        });
        testApiCmd('Suggest, back and forth', async function () {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCompletionItems() {
                    const a = new types.CompletionItem('item1');
                    a.documentation = new types.MarkdownString('hello_md_string');
                    const b = new types.CompletionItem('item2');
                    b.textEdit = types.TextEdit.replace(new types.Range(0, 4, 0, 8), 'foo'); // overwite after
                    const c = new types.CompletionItem('item3');
                    c.textEdit = types.TextEdit.replace(new types.Range(0, 1, 0, 6), 'foobar'); // overwite before & after
                    // snippet string!
                    const d = new types.CompletionItem('item4');
                    d.range = new types.Range(0, 1, 0, 4); // overwite before
                    d.insertText = new types.SnippetString('foo$0bar');
                    return [a, b, c, d];
                }
            }, []));
            await rpcProtocol.sync();
            const list = await commands.executeCommand('vscode.executeCompletionItemProvider', model.uri, new types.Position(0, 4));
            assert.ok(list instanceof types.CompletionList);
            const values = list.items;
            assert.ok(Array.isArray(values));
            assert.strictEqual(values.length, 4);
            const [first, second, third, fourth] = values;
            assert.strictEqual(first.label, 'item1');
            assert.strictEqual(first.textEdit, undefined); // no text edit, default ranges
            assert.ok(!types.Range.isRange(first.range));
            assert.strictEqual(first.documentation.value, 'hello_md_string');
            assert.strictEqual(second.label, 'item2');
            assert.strictEqual(second.textEdit.newText, 'foo');
            assert.strictEqual(second.textEdit.range.start.line, 0);
            assert.strictEqual(second.textEdit.range.start.character, 4);
            assert.strictEqual(second.textEdit.range.end.line, 0);
            assert.strictEqual(second.textEdit.range.end.character, 8);
            assert.strictEqual(third.label, 'item3');
            assert.strictEqual(third.textEdit.newText, 'foobar');
            assert.strictEqual(third.textEdit.range.start.line, 0);
            assert.strictEqual(third.textEdit.range.start.character, 1);
            assert.strictEqual(third.textEdit.range.end.line, 0);
            assert.strictEqual(third.textEdit.range.end.character, 6);
            assert.strictEqual(fourth.label, 'item4');
            assert.strictEqual(fourth.textEdit, undefined);
            const range = fourth.range;
            assert.ok(types.Range.isRange(range));
            assert.strictEqual(range.start.line, 0);
            assert.strictEqual(range.start.character, 1);
            assert.strictEqual(range.end.line, 0);
            assert.strictEqual(range.end.character, 4);
            assert.ok(fourth.insertText instanceof types.SnippetString);
            assert.strictEqual(fourth.insertText.value, 'foo$0bar');
        });
        testApiCmd('Suggest, return CompletionList !array', async function () {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCompletionItems() {
                    const a = new types.CompletionItem('item1');
                    const b = new types.CompletionItem('item2');
                    return new types.CompletionList([a, b], true);
                }
            }, []));
            await rpcProtocol.sync();
            const list = await commands.executeCommand('vscode.executeCompletionItemProvider', model.uri, new types.Position(0, 4));
            assert.ok(list instanceof types.CompletionList);
            assert.strictEqual(list.isIncomplete, true);
        });
        testApiCmd('Suggest, resolve completion items', async function () {
            let resolveCount = 0;
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCompletionItems() {
                    const a = new types.CompletionItem('item1');
                    const b = new types.CompletionItem('item2');
                    const c = new types.CompletionItem('item3');
                    const d = new types.CompletionItem('item4');
                    return new types.CompletionList([a, b, c, d], false);
                },
                resolveCompletionItem(item) {
                    resolveCount += 1;
                    return item;
                }
            }, []));
            await rpcProtocol.sync();
            const list = await commands.executeCommand('vscode.executeCompletionItemProvider', model.uri, new types.Position(0, 4), undefined, 2 // maxItemsToResolve
            );
            assert.ok(list instanceof types.CompletionList);
            assert.strictEqual(resolveCount, 2);
        });
        testApiCmd('"vscode.executeCompletionItemProvider" doesnot return a preselect field #53749', async function () {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCompletionItems() {
                    const a = new types.CompletionItem('item1');
                    a.preselect = true;
                    const b = new types.CompletionItem('item2');
                    const c = new types.CompletionItem('item3');
                    c.preselect = true;
                    const d = new types.CompletionItem('item4');
                    return new types.CompletionList([a, b, c, d], false);
                }
            }, []));
            await rpcProtocol.sync();
            const list = await commands.executeCommand('vscode.executeCompletionItemProvider', model.uri, new types.Position(0, 4), undefined);
            assert.ok(list instanceof types.CompletionList);
            assert.strictEqual(list.items.length, 4);
            const [a, b, c, d] = list.items;
            assert.strictEqual(a.preselect, true);
            assert.strictEqual(b.preselect, undefined);
            assert.strictEqual(c.preselect, true);
            assert.strictEqual(d.preselect, undefined);
        });
        testApiCmd('executeCompletionItemProvider doesn\'t capture commitCharacters #58228', async function () {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCompletionItems() {
                    const a = new types.CompletionItem('item1');
                    a.commitCharacters = ['a', 'b'];
                    const b = new types.CompletionItem('item2');
                    return new types.CompletionList([a, b], false);
                }
            }, []));
            await rpcProtocol.sync();
            const list = await commands.executeCommand('vscode.executeCompletionItemProvider', model.uri, new types.Position(0, 4), undefined);
            assert.ok(list instanceof types.CompletionList);
            assert.strictEqual(list.items.length, 2);
            const [a, b] = list.items;
            assert.deepStrictEqual(a.commitCharacters, ['a', 'b']);
            assert.strictEqual(b.commitCharacters, undefined);
        });
        testApiCmd('vscode.executeCompletionItemProvider returns the wrong CompletionItemKinds in insiders #95715', async function () {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCompletionItems() {
                    return [
                        new types.CompletionItem('My Method', types.CompletionItemKind.Method),
                        new types.CompletionItem('My Property', types.CompletionItemKind.Property),
                    ];
                }
            }, []));
            await rpcProtocol.sync();
            const list = await commands.executeCommand('vscode.executeCompletionItemProvider', model.uri, new types.Position(0, 4), undefined);
            assert.ok(list instanceof types.CompletionList);
            assert.strictEqual(list.items.length, 2);
            const [a, b] = list.items;
            assert.strictEqual(a.kind, types.CompletionItemKind.Method);
            assert.strictEqual(b.kind, types.CompletionItemKind.Property);
        });
        // --- signatureHelp
        test('Parameter Hints, back and forth', async () => {
            disposables.push(extHost.registerSignatureHelpProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSignatureHelp(_document, _position, _token, context) {
                    return {
                        activeSignature: 0,
                        activeParameter: 1,
                        signatures: [
                            {
                                label: 'abc',
                                documentation: `${context.triggerKind === 1 /* vscode.SignatureHelpTriggerKind.Invoke */ ? 'invoked' : 'unknown'} ${context.triggerCharacter}`,
                                parameters: []
                            }
                        ]
                    };
                }
            }, []));
            await rpcProtocol.sync();
            const firstValue = await commands.executeCommand('vscode.executeSignatureHelpProvider', model.uri, new types.Position(0, 1), ',');
            assert.strictEqual(firstValue.activeSignature, 0);
            assert.strictEqual(firstValue.activeParameter, 1);
            assert.strictEqual(firstValue.signatures.length, 1);
            assert.strictEqual(firstValue.signatures[0].label, 'abc');
            assert.strictEqual(firstValue.signatures[0].documentation, 'invoked ,');
        });
        // --- quickfix
        testApiCmd('QuickFix, back and forth', function () {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions() {
                    return [{ command: 'testing', title: 'Title', arguments: [1, 2, true] }];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeCodeActionProvider', model.uri, new types.Range(0, 0, 1, 1)).then(value => {
                    assert.strictEqual(value.length, 1);
                    const [first] = value;
                    assert.strictEqual(first.title, 'Title');
                    assert.strictEqual(first.command, 'testing');
                    assert.deepStrictEqual(first.arguments, [1, 2, true]);
                });
            });
        });
        testApiCmd('vscode.executeCodeActionProvider results seem to be missing their `command` property #45124', function () {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions(document, range) {
                    return [{
                            command: {
                                arguments: [document, range],
                                command: 'command',
                                title: 'command_title',
                            },
                            kind: types.CodeActionKind.Empty.append('foo'),
                            title: 'title',
                        }];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeCodeActionProvider', model.uri, new types.Range(0, 0, 1, 1)).then(value => {
                    assert.strictEqual(value.length, 1);
                    const [first] = value;
                    assert.ok(first.command);
                    assert.strictEqual(first.command.command, 'command');
                    assert.strictEqual(first.command.title, 'command_title');
                    assert.strictEqual(first.kind.value, 'foo');
                    assert.strictEqual(first.title, 'title');
                });
            });
        });
        testApiCmd('vscode.executeCodeActionProvider passes Range to provider although Selection is passed in #77997', function () {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions(document, rangeOrSelection) {
                    return [{
                            command: {
                                arguments: [document, rangeOrSelection],
                                command: 'command',
                                title: 'command_title',
                            },
                            kind: types.CodeActionKind.Empty.append('foo'),
                            title: 'title',
                        }];
                }
            }));
            const selection = new types.Selection(0, 0, 1, 1);
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeCodeActionProvider', model.uri, selection).then(value => {
                    assert.strictEqual(value.length, 1);
                    const [first] = value;
                    assert.ok(first.command);
                    assert.ok(first.command.arguments[1] instanceof types.Selection);
                    assert.ok(first.command.arguments[1].isEqual(selection));
                });
            });
        });
        testApiCmd('vscode.executeCodeActionProvider results seem to be missing their `isPreferred` property #78098', function () {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions(document, rangeOrSelection) {
                    return [{
                            command: {
                                arguments: [document, rangeOrSelection],
                                command: 'command',
                                title: 'command_title',
                            },
                            kind: types.CodeActionKind.Empty.append('foo'),
                            title: 'title',
                            isPreferred: true
                        }];
                }
            }));
            const selection = new types.Selection(0, 0, 1, 1);
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeCodeActionProvider', model.uri, selection).then(value => {
                    assert.strictEqual(value.length, 1);
                    const [first] = value;
                    assert.strictEqual(first.isPreferred, true);
                });
            });
        });
        testApiCmd('resolving code action', async function () {
            let didCallResolve = 0;
            class MyAction extends types.CodeAction {
            }
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions(document, rangeOrSelection) {
                    return [new MyAction('title', types.CodeActionKind.Empty.append('foo'))];
                },
                resolveCodeAction(action) {
                    assert.ok(action instanceof MyAction);
                    didCallResolve += 1;
                    action.title = 'resolved title';
                    action.edit = new types.WorkspaceEdit();
                    return action;
                }
            }));
            const selection = new types.Selection(0, 0, 1, 1);
            await rpcProtocol.sync();
            const value = await commands.executeCommand('vscode.executeCodeActionProvider', model.uri, selection, undefined, 1000);
            assert.strictEqual(didCallResolve, 1);
            assert.strictEqual(value.length, 1);
            const [first] = value;
            assert.strictEqual(first.title, 'title'); // does NOT change
            assert.ok(first.edit); // is set
        });
        // --- code lens
        testApiCmd('CodeLens, back and forth', function () {
            const complexArg = {
                foo() { },
                bar() { },
                big: extHost
            };
            disposables.push(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeLenses() {
                    return [new types.CodeLens(new types.Range(0, 0, 1, 1), { title: 'Title', command: 'cmd', arguments: [1, true, complexArg] })];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeCodeLensProvider', model.uri).then(value => {
                    assert.strictEqual(value.length, 1);
                    const [first] = value;
                    assert.strictEqual(first.command.title, 'Title');
                    assert.strictEqual(first.command.command, 'cmd');
                    assert.strictEqual(first.command.arguments[0], 1);
                    assert.strictEqual(first.command.arguments[1], true);
                    assert.strictEqual(first.command.arguments[2], complexArg);
                });
            });
        });
        testApiCmd('CodeLens, resolve', async function () {
            let resolveCount = 0;
            disposables.push(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeLenses() {
                    return [
                        new types.CodeLens(new types.Range(0, 0, 1, 1)),
                        new types.CodeLens(new types.Range(0, 0, 1, 1)),
                        new types.CodeLens(new types.Range(0, 0, 1, 1)),
                        new types.CodeLens(new types.Range(0, 0, 1, 1), { title: 'Already resolved', command: 'fff' })
                    ];
                },
                resolveCodeLens(codeLens) {
                    codeLens.command = { title: resolveCount.toString(), command: 'resolved' };
                    resolveCount += 1;
                    return codeLens;
                }
            }));
            await rpcProtocol.sync();
            let value = await commands.executeCommand('vscode.executeCodeLensProvider', model.uri, 2);
            assert.strictEqual(value.length, 3); // the resolve argument defines the number of results being returned
            assert.strictEqual(resolveCount, 2);
            resolveCount = 0;
            value = await commands.executeCommand('vscode.executeCodeLensProvider', model.uri);
            assert.strictEqual(value.length, 4);
            assert.strictEqual(resolveCount, 0);
        });
        testApiCmd('Links, back and forth', function () {
            disposables.push(extHost.registerDocumentLinkProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentLinks() {
                    return [new types.DocumentLink(new types.Range(0, 0, 0, 20), uri_1.URI.parse('foo:bar'))];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeLinkProvider', model.uri).then(value => {
                    assert.strictEqual(value.length, 1);
                    const [first] = value;
                    assert.strictEqual(first.target + '', 'foo:bar');
                    assert.strictEqual(first.range.start.line, 0);
                    assert.strictEqual(first.range.start.character, 0);
                    assert.strictEqual(first.range.end.line, 0);
                    assert.strictEqual(first.range.end.character, 20);
                });
            });
        });
        testApiCmd('What\'s the condition for DocumentLink target to be undefined? #106308', async function () {
            disposables.push(extHost.registerDocumentLinkProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentLinks() {
                    return [new types.DocumentLink(new types.Range(0, 0, 0, 20), undefined)];
                },
                resolveDocumentLink(link) {
                    link.target = uri_1.URI.parse('foo:bar');
                    return link;
                }
            }));
            await rpcProtocol.sync();
            const links1 = await commands.executeCommand('vscode.executeLinkProvider', model.uri);
            assert.strictEqual(links1.length, 1);
            assert.strictEqual(links1[0].target, undefined);
            const links2 = await commands.executeCommand('vscode.executeLinkProvider', model.uri, 1000);
            assert.strictEqual(links2.length, 1);
            assert.strictEqual(links2[0].target.toString(), uri_1.URI.parse('foo:bar').toString());
        });
        test('Color provider', function () {
            disposables.push(extHost.registerColorProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentColors() {
                    return [new types.ColorInformation(new types.Range(0, 0, 0, 20), new types.Color(0.1, 0.2, 0.3, 0.4))];
                },
                provideColorPresentations() {
                    const cp = new types.ColorPresentation('#ABC');
                    cp.textEdit = types.TextEdit.replace(new types.Range(1, 0, 1, 20), '#ABC');
                    cp.additionalTextEdits = [types.TextEdit.insert(new types.Position(2, 20), '*')];
                    return [cp];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeDocumentColorProvider', model.uri).then(value => {
                    assert.strictEqual(value.length, 1);
                    const [first] = value;
                    assert.strictEqual(first.color.red, 0.1);
                    assert.strictEqual(first.color.green, 0.2);
                    assert.strictEqual(first.color.blue, 0.3);
                    assert.strictEqual(first.color.alpha, 0.4);
                    assert.strictEqual(first.range.start.line, 0);
                    assert.strictEqual(first.range.start.character, 0);
                    assert.strictEqual(first.range.end.line, 0);
                    assert.strictEqual(first.range.end.character, 20);
                });
            }).then(() => {
                const color = new types.Color(0.5, 0.6, 0.7, 0.8);
                const range = new types.Range(0, 0, 0, 20);
                return commands.executeCommand('vscode.executeColorPresentationProvider', color, { uri: model.uri, range }).then(value => {
                    assert.strictEqual(value.length, 1);
                    const [first] = value;
                    assert.strictEqual(first.label, '#ABC');
                    assert.strictEqual(first.textEdit.newText, '#ABC');
                    assert.strictEqual(first.textEdit.range.start.line, 1);
                    assert.strictEqual(first.textEdit.range.start.character, 0);
                    assert.strictEqual(first.textEdit.range.end.line, 1);
                    assert.strictEqual(first.textEdit.range.end.character, 20);
                    assert.strictEqual(first.additionalTextEdits.length, 1);
                    assert.strictEqual(first.additionalTextEdits[0].range.start.line, 2);
                    assert.strictEqual(first.additionalTextEdits[0].range.start.character, 20);
                    assert.strictEqual(first.additionalTextEdits[0].range.end.line, 2);
                    assert.strictEqual(first.additionalTextEdits[0].range.end.character, 20);
                });
            });
        });
        test('"TypeError: e.onCancellationRequested is not a function" calling hover provider in Insiders #54174', function () {
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideHover() {
                    return new types.Hover('fofofofo');
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeHoverProvider', model.uri, new types.Position(1, 1)).then(value => {
                    assert.strictEqual(value.length, 1);
                    assert.strictEqual(value[0].contents.length, 1);
                });
            });
        });
        // --- inline hints
        testApiCmd('Inlay Hints, back and forth', async function () {
            disposables.push(extHost.registerInlayHintsProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideInlayHints() {
                    return [new types.InlayHint(new types.Position(0, 1), 'Foo')];
                }
            }));
            await rpcProtocol.sync();
            const value = await commands.executeCommand('vscode.executeInlayHintProvider', model.uri, new types.Range(0, 0, 20, 20));
            assert.strictEqual(value.length, 1);
            const [first] = value;
            assert.strictEqual(first.label, 'Foo');
            assert.strictEqual(first.position.line, 0);
            assert.strictEqual(first.position.character, 1);
        });
        testApiCmd('Inline Hints, merge', async function () {
            disposables.push(extHost.registerInlayHintsProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideInlayHints() {
                    const part = new types.InlayHintLabelPart('Bar');
                    part.tooltip = 'part_tooltip';
                    part.command = { command: 'cmd', title: 'part' };
                    const hint = new types.InlayHint(new types.Position(10, 11), [part]);
                    hint.tooltip = 'hint_tooltip';
                    hint.paddingLeft = true;
                    hint.paddingRight = false;
                    return [hint];
                }
            }));
            disposables.push(extHost.registerInlayHintsProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideInlayHints() {
                    const hint = new types.InlayHint(new types.Position(0, 1), 'Foo', types.InlayHintKind.Parameter);
                    hint.textEdits = [types.TextEdit.insert(new types.Position(0, 0), 'Hello')];
                    return [hint];
                }
            }));
            await rpcProtocol.sync();
            const value = await commands.executeCommand('vscode.executeInlayHintProvider', model.uri, new types.Range(0, 0, 20, 20));
            assert.strictEqual(value.length, 2);
            const [first, second] = value;
            assert.strictEqual(first.label, 'Foo');
            assert.strictEqual(first.position.line, 0);
            assert.strictEqual(first.position.character, 1);
            assert.strictEqual(first.textEdits?.length, 1);
            assert.strictEqual(first.textEdits[0].newText, 'Hello');
            assert.strictEqual(second.position.line, 10);
            assert.strictEqual(second.position.character, 11);
            assert.strictEqual(second.paddingLeft, true);
            assert.strictEqual(second.paddingRight, false);
            assert.strictEqual(second.tooltip, 'hint_tooltip');
            const label = second.label[0];
            (0, types_1.assertType)(label instanceof types.InlayHintLabelPart);
            assert.strictEqual(label.value, 'Bar');
            assert.strictEqual(label.tooltip, 'part_tooltip');
            assert.strictEqual(label.command?.command, 'cmd');
            assert.strictEqual(label.command?.title, 'part');
        });
        testApiCmd('Inline Hints, bad provider', async function () {
            disposables.push(extHost.registerInlayHintsProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideInlayHints() {
                    return [new types.InlayHint(new types.Position(0, 1), 'Foo')];
                }
            }));
            disposables.push(extHost.registerInlayHintsProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideInlayHints() {
                    throw new Error();
                }
            }));
            await rpcProtocol.sync();
            const value = await commands.executeCommand('vscode.executeInlayHintProvider', model.uri, new types.Range(0, 0, 20, 20));
            assert.strictEqual(value.length, 1);
            const [first] = value;
            assert.strictEqual(first.label, 'Foo');
            assert.strictEqual(first.position.line, 0);
            assert.strictEqual(first.position.character, 1);
        });
        // --- selection ranges
        test('Selection Range, back and forth', async function () {
            disposables.push(extHost.registerSelectionRangeProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideSelectionRanges() {
                    return [
                        new types.SelectionRange(new types.Range(0, 10, 0, 18), new types.SelectionRange(new types.Range(0, 2, 0, 20))),
                    ];
                }
            }));
            await rpcProtocol.sync();
            const value = await commands.executeCommand('vscode.executeSelectionRangeProvider', model.uri, [new types.Position(0, 10)]);
            assert.strictEqual(value.length, 1);
            assert.ok(value[0].parent);
        });
        // --- call hierarchy
        test('CallHierarchy, back and forth', async function () {
            disposables.push(extHost.registerCallHierarchyProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                prepareCallHierarchy(document, position) {
                    return new types.CallHierarchyItem(types.SymbolKind.Constant, 'ROOT', 'ROOT', document.uri, new types.Range(0, 0, 0, 0), new types.Range(0, 0, 0, 0));
                }
                provideCallHierarchyIncomingCalls(item, token) {
                    return [new types.CallHierarchyIncomingCall(new types.CallHierarchyItem(types.SymbolKind.Constant, 'INCOMING', 'INCOMING', item.uri, new types.Range(0, 0, 0, 0), new types.Range(0, 0, 0, 0)), [new types.Range(0, 0, 0, 0)])];
                }
                provideCallHierarchyOutgoingCalls(item, token) {
                    return [new types.CallHierarchyOutgoingCall(new types.CallHierarchyItem(types.SymbolKind.Constant, 'OUTGOING', 'OUTGOING', item.uri, new types.Range(0, 0, 0, 0), new types.Range(0, 0, 0, 0)), [new types.Range(0, 0, 0, 0)])];
                }
            }));
            await rpcProtocol.sync();
            const root = await commands.executeCommand('vscode.prepareCallHierarchy', model.uri, new types.Position(0, 0));
            assert.ok(Array.isArray(root));
            assert.strictEqual(root.length, 1);
            assert.strictEqual(root[0].name, 'ROOT');
            const incoming = await commands.executeCommand('vscode.provideIncomingCalls', root[0]);
            assert.strictEqual(incoming.length, 1);
            assert.strictEqual(incoming[0].from.name, 'INCOMING');
            const outgoing = await commands.executeCommand('vscode.provideOutgoingCalls', root[0]);
            assert.strictEqual(outgoing.length, 1);
            assert.strictEqual(outgoing[0].to.name, 'OUTGOING');
        });
        test('prepareCallHierarchy throws TypeError if clangd returns empty result #137415', async function () {
            disposables.push(extHost.registerCallHierarchyProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                prepareCallHierarchy(document, position) {
                    return [];
                }
                provideCallHierarchyIncomingCalls(item, token) {
                    return [];
                }
                provideCallHierarchyOutgoingCalls(item, token) {
                    return [];
                }
            }));
            await rpcProtocol.sync();
            const root = await commands.executeCommand('vscode.prepareCallHierarchy', model.uri, new types.Position(0, 0));
            assert.ok(Array.isArray(root));
            assert.strictEqual(root.length, 0);
        });
        // --- type hierarchy
        test('TypeHierarchy, back and forth', async function () {
            disposables.push(extHost.registerTypeHierarchyProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                prepareTypeHierarchy(document, position, token) {
                    return [new types.TypeHierarchyItem(types.SymbolKind.Constant, 'ROOT', 'ROOT', document.uri, new types.Range(0, 0, 0, 0), new types.Range(0, 0, 0, 0))];
                }
                provideTypeHierarchySupertypes(item, token) {
                    return [new types.TypeHierarchyItem(types.SymbolKind.Constant, 'SUPER', 'SUPER', item.uri, new types.Range(0, 0, 0, 0), new types.Range(0, 0, 0, 0))];
                }
                provideTypeHierarchySubtypes(item, token) {
                    return [new types.TypeHierarchyItem(types.SymbolKind.Constant, 'SUB', 'SUB', item.uri, new types.Range(0, 0, 0, 0), new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const root = await commands.executeCommand('vscode.prepareTypeHierarchy', model.uri, new types.Position(0, 0));
            assert.ok(Array.isArray(root));
            assert.strictEqual(root.length, 1);
            assert.strictEqual(root[0].name, 'ROOT');
            const incoming = await commands.executeCommand('vscode.provideSupertypes', root[0]);
            assert.strictEqual(incoming.length, 1);
            assert.strictEqual(incoming[0].name, 'SUPER');
            const outgoing = await commands.executeCommand('vscode.provideSubtypes', root[0]);
            assert.strictEqual(outgoing.length, 1);
            assert.strictEqual(outgoing[0].name, 'SUB');
        });
        test('selectionRangeProvider on inner array always returns outer array #91852', async function () {
            disposables.push(extHost.registerSelectionRangeProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideSelectionRanges(_doc, positions) {
                    const [first] = positions;
                    return [
                        new types.SelectionRange(new types.Range(first.line, first.character, first.line, first.character)),
                    ];
                }
            }));
            await rpcProtocol.sync();
            const value = await commands.executeCommand('vscode.executeSelectionRangeProvider', model.uri, [new types.Position(0, 10)]);
            assert.strictEqual(value.length, 1);
            assert.strictEqual(value[0].range.start.line, 0);
            assert.strictEqual(value[0].range.start.character, 10);
            assert.strictEqual(value[0].range.end.line, 0);
            assert.strictEqual(value[0].range.end.character, 10);
        });
        test('more element test of selectionRangeProvider on inner array always returns outer array #91852', async function () {
            disposables.push(extHost.registerSelectionRangeProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideSelectionRanges(_doc, positions) {
                    const [first, second] = positions;
                    return [
                        new types.SelectionRange(new types.Range(first.line, first.character, first.line, first.character)),
                        new types.SelectionRange(new types.Range(second.line, second.character, second.line, second.character)),
                    ];
                }
            }));
            await rpcProtocol.sync();
            const value = await commands.executeCommand('vscode.executeSelectionRangeProvider', model.uri, [new types.Position(0, 0), new types.Position(0, 10)]);
            assert.strictEqual(value.length, 2);
            assert.strictEqual(value[0].range.start.line, 0);
            assert.strictEqual(value[0].range.start.character, 0);
            assert.strictEqual(value[0].range.end.line, 0);
            assert.strictEqual(value[0].range.end.character, 0);
            assert.strictEqual(value[1].range.start.line, 0);
            assert.strictEqual(value[1].range.start.character, 10);
            assert.strictEqual(value[1].range.end.line, 0);
            assert.strictEqual(value[1].range.end.character, 10);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEFwaUNvbW1hbmRzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvdGVzdC9icm93c2VyL2V4dEhvc3RBcGlDb21tYW5kcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBaUVoRyxTQUFTLGFBQWEsQ0FBQyxFQUFzQixFQUFFLFVBQWtCLG9CQUFvQjtRQUNwRixPQUFPLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBRUQsU0FBUyxVQUFVLENBQUMsS0FBNEM7UUFDL0QsTUFBTSxTQUFTLEdBQUcsS0FBd0IsQ0FBQztRQUMzQyxPQUFPLFNBQVMsSUFBSSxTQUFTLENBQUMsR0FBRyxZQUFZLFNBQUcsSUFBSSxTQUFTLENBQUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxLQUFLLENBQUM7SUFDNUYsQ0FBQztJQUVELEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRTtRQUN2QyxNQUFNLGVBQWUsR0FBRyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUMxQyxJQUFJLEtBQWlCLENBQUM7UUFFdEIsSUFBSSxLQUErQixDQUFDO1FBQ3BDLElBQUksV0FBNEIsQ0FBQztRQUNqQyxJQUFJLE9BQWdDLENBQUM7UUFDckMsSUFBSSxVQUFzQyxDQUFDO1FBQzNDLElBQUksUUFBeUIsQ0FBQztRQUM5QixJQUFJLFdBQVcsR0FBd0IsRUFBRSxDQUFDO1FBRTFDLElBQUksb0JBQXFDLENBQUM7UUFFMUMsVUFBVSxDQUFDLEdBQUcsRUFBRTtZQUNmLEtBQUssR0FBRyxJQUFBLCtCQUFlLEVBQ3RCO2dCQUNDLHdCQUF3QjtnQkFDeEIseUJBQXlCO2dCQUN6Qix3QkFBd0I7YUFDeEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQ1osU0FBUyxFQUNULFNBQVMsRUFDVCxTQUFHLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztZQUNwQyxvQkFBb0IsR0FBRyxxQkFBWSxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFDaEUsSUFBQSxrQ0FBeUIsRUFBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVyQyxtRUFBbUU7WUFDbkUsV0FBVyxHQUFHLElBQUksaUNBQWUsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sUUFBUSxHQUFHLElBQUkscUNBQWlCLEVBQUUsQ0FBQztZQUN6QyxRQUFRLENBQUMsR0FBRyxDQUFDLGlDQUFtQixFQUFFLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUF1QjtnQkFDckUsY0FBYyxDQUFDLEdBQVE7b0JBQy9CLE9BQU8sR0FBRyxDQUFDO2dCQUNaLENBQUM7YUFDRCxDQUFDLENBQUM7WUFDSCxRQUFRLENBQUMsR0FBRyxDQUFDLDJDQUF3QixFQUFFLElBQUksNEJBQWMsQ0FBQyxpREFBdUIsQ0FBQyxDQUFDLENBQUM7WUFDcEYsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBaUIsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBcUI7Z0JBQ2pFLEtBQUssQ0FBQyxlQUFlO2dCQUU5QixDQUFDO2dCQUNRLHFCQUFxQixDQUFDLGVBQXVCO29CQUNyRCxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxDQUFDLEdBQUcsQ0FBQywwQkFBZSxFQUFFLElBQUksNEJBQWMsQ0FBQyxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQW1CO2dCQUU1RSxjQUFjLENBQUMsRUFBVSxFQUFFLEdBQUcsSUFBUztvQkFDL0MsTUFBTSxPQUFPLEdBQUcsMkJBQWdCLENBQUMsV0FBVyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN2RCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2QsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDO29CQUNyRCxDQUFDO29CQUNELE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUM7b0JBQzVCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2hFLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUNKLFFBQVEsQ0FBQyxHQUFHLENBQUMsaUNBQW1CLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQXVCO2dCQUF6Qzs7b0JBQzVCLFlBQU8sR0FBWSxJQUFJLENBQUM7b0JBQ3hCLDJCQUFzQixHQUFZLEtBQUssQ0FBQztnQkFDbEQsQ0FBQzthQUFBLENBQUMsQ0FBQztZQUNILFFBQVEsQ0FBQyxHQUFHLENBQUMsd0JBQWMsRUFBRSxJQUFJLDZCQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELFFBQVEsQ0FBQyxHQUFHLENBQUMsaUJBQVcsRUFBRSxJQUFJLDRCQUFjLENBQUMsb0JBQWMsQ0FBQyxDQUFDLENBQUM7WUFDOUQsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5REFBK0IsRUFBRSxJQUFJLDRCQUFjLENBQUMsd0RBQThCLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUJBQWEsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBaUI7Z0JBQW5DOztvQkFFdEIsbUJBQWMsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO2dCQUN0QyxDQUFDO2dCQUZTLFFBQVEsS0FBSyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFFckMsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxDQUFDLEdBQUcsQ0FBQyxtQ0FBaUIsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBcUI7Z0JBQ2pFLEtBQUssQ0FBQyxvQkFBb0I7b0JBQ2xDLE9BQU8sSUFBSSw2QkFBaUIsQ0FBMkIsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQTRCO3dCQUE5Qzs7NEJBQ2pELG9CQUFlLEdBQUcsS0FBSyxDQUFDO3dCQUNsQyxDQUFDO3FCQUFBLENBQUMsQ0FBQztnQkFDSixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxDQUFDLEdBQUcsQ0FBQyxtQ0FBb0IsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBd0I7Z0JBQ3ZFLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxJQUFTLEVBQUUsS0FBVTtvQkFDM0QsT0FBTyxLQUFLLElBQUksU0FBUyxDQUFDO2dCQUMzQixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5REFBK0IsRUFBRSxJQUFJLDRCQUFjLENBQUMsd0RBQThCLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLFFBQVEsQ0FBQyxHQUFHLENBQUMsbUNBQW9CLEVBQUUsSUFBSSw0QkFBYyxDQUFDLGtDQUFtQixDQUFDLENBQUMsQ0FBQztZQUM1RSxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixFQUFFLElBQUksbURBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBRXBFLEtBQUssR0FBRyxJQUFJLG1EQUF3QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRS9DLE1BQU0sMEJBQTBCLEdBQUcsSUFBSSx1REFBMEIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxvQkFBYyxFQUFFLENBQUMsQ0FBQztZQUNyRywwQkFBMEIsQ0FBQywrQkFBK0IsQ0FBQztnQkFDMUQsY0FBYyxFQUFFLENBQUM7d0JBQ2hCLE9BQU8sRUFBRSxLQUFLO3dCQUNkLFNBQVMsRUFBRSxLQUFLLENBQUMsWUFBWSxFQUFFO3dCQUMvQixVQUFVLEVBQUUsS0FBSyxDQUFDLGFBQWEsRUFBRTt3QkFDakMsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHO3dCQUNkLEtBQUssRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDN0MsR0FBRyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUU7cUJBQ25CLENBQUM7YUFDRixDQUFDLENBQUM7WUFDSCxNQUFNLGdCQUFnQixHQUFHLElBQUksbUNBQWdCLENBQUMsV0FBVyxFQUFFLDBCQUEwQixDQUFDLENBQUM7WUFDdkYsV0FBVyxDQUFDLEdBQUcsQ0FBQyxpQ0FBYyxDQUFDLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFFbkUsUUFBUSxHQUFHLElBQUksaUNBQWUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxvQkFBYyxFQUFFLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQXFCO2dCQUNuRyxnQkFBZ0I7b0JBQ3hCLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7YUFDRCxDQUFDLENBQUM7WUFDSCxXQUFXLENBQUMsR0FBRyxDQUFDLGlDQUFjLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzFELFdBQVcsQ0FBQyxHQUFHLENBQUMsOEJBQVcsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLHVDQUFrQixFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDdkcsdUNBQWtCLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXRDLE1BQU0sV0FBVyxHQUFHLElBQUksdUNBQWtCLENBQUMsV0FBVyxFQUFFLElBQUksb0JBQWMsRUFBRSxFQUFFLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUEwQjthQUFJLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztZQUNoSyxXQUFXLENBQUMsR0FBRyxDQUFDLGlDQUFjLENBQUMsa0JBQWtCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFaEUsT0FBTyxHQUFHLElBQUksaURBQXVCLENBQUMsV0FBVyxFQUFFLElBQUksb0RBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxJQUFJLG9CQUFjLEVBQUUsRUFBRSx3REFBeUIsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBcUI7Z0JBQy9NLGdCQUFnQjtvQkFDeEIsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQzthQUNELENBQUMsQ0FBQztZQUNILFdBQVcsQ0FBQyxHQUFHLENBQUMsaUNBQWMsQ0FBQyx1QkFBdUIsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVqRSxVQUFVLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyw4QkFBVyxDQUFDLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsdURBQTBCLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUVwSSx1R0FBdUc7WUFDdkcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxtQ0FBb0IsQ0FBQyxDQUFDO1lBRWhDLE9BQU8sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO1FBRUgsYUFBYSxDQUFDLEdBQUcsRUFBRTtZQUNsQixJQUFBLGtDQUF5QixFQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDaEQsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVDLEtBQUssQ0FBQyxHQUFHLENBQUMsbUNBQW9CLENBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxHQUFHLElBQUEsbUJBQU8sRUFBQyxXQUFXLENBQUMsQ0FBQztZQUNuQyxPQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyx3QkFBd0I7UUFFeEIsU0FBUyxVQUFVLENBQUMsSUFBWSxFQUFFLEVBQXNCO1lBQ3ZELElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSztnQkFDZixNQUFNLElBQUEsd0NBQWtCLEVBQUMsRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO29CQUN2QyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUNYLE1BQU0sSUFBQSxlQUFPLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBRSw2RkFBNkY7b0JBQ3BILG1FQUFtRTtnQkFDcEUsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUVKLENBQUM7UUFFRCxJQUFJLENBQUMscUNBQXFDLEVBQUU7WUFDM0MsTUFBTSxRQUFRLEdBQUc7Z0JBQ2hCLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7Z0JBQ3JGLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLHVDQUF1QyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMzRixhQUFhLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyx1Q0FBdUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDaEcsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsdUNBQXVDLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDM0YsQ0FBQztZQUNGLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQ0FBa0MsRUFBRTtZQUV4QyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxxQ0FBd0IsRUFBa0M7Z0JBQ2xILHVCQUF1QixDQUFDLEtBQUs7b0JBQzVCLE9BQU87d0JBQ04sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7d0JBQ3pILElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO3FCQUMxSCxDQUFDO2dCQUNILENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLCtCQUErQixDQUFDLHFDQUF3QixFQUFrQztnQkFDbEgsdUJBQXVCLENBQUMsS0FBSztvQkFDNUIsT0FBTzt3QkFDTixJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztxQkFDekgsQ0FBQztnQkFDSCxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNuQyxPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQTZCLHVDQUF1QyxFQUFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFFM0gsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVztvQkFDaEQsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQzt3QkFDMUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLFlBQVksS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUNsRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ3pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN2RCxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtRUFBbUUsRUFBRSxLQUFLO1lBRTlFLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLCtCQUErQixDQUFDLHFDQUF3QixFQUFFO2dCQUNsRix1QkFBdUI7b0JBQ3RCLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQTZCLENBQUMsQ0FBQztnQkFDdEosQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDekIsSUFBSSxPQUFPLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUE2Qix1Q0FBdUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNySCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFdEMsTUFBTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDekIsT0FBTyxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBNkIsdUNBQXVDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbEgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO1FBRUgsaUJBQWlCO1FBQ2pCLElBQUksQ0FBQywrQ0FBK0MsRUFBRSxLQUFLO1lBRTFELFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLHNDQUFzQyxDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBRSxJQUFJO2dCQUM5Ryw4QkFBOEI7b0JBQzdCLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2hFLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3pCLE1BQU0sS0FBSyxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBNkIsc0NBQXNDLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNILE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyQyxDQUFDLENBQUMsQ0FBQztRQUdILGFBQWE7UUFDYixJQUFJLENBQUMsc0JBQXNCLEVBQUUsS0FBSztZQUNqQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQUUsSUFBSTtnQkFFOUYsYUFBYSxDQUFDLFFBQTZCLEVBQUUsUUFBeUI7b0JBQ3JFLE9BQU87d0JBQ04sS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQ3BDLFdBQVcsRUFBRSxpQkFBaUI7cUJBQzlCLENBQUM7Z0JBQ0gsQ0FBQztnQkFFRCxrQkFBa0IsQ0FBQyxRQUE2QixFQUFFLFFBQXlCLEVBQUUsT0FBZTtvQkFDM0YsTUFBTSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBa0IsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUM3RCxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUV6QixNQUFNLElBQUksR0FBRyxNQUFNLFFBQVEsQ0FBQyxjQUFjLENBQStDLHNCQUFzQixFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXZKLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0NBQXNDLEVBQUUsS0FBSztZQUNqRCxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQUUsSUFBSTtnQkFDOUYsa0JBQWtCLENBQUMsUUFBNkIsRUFBRSxRQUF5QixFQUFFLE9BQWU7b0JBQzNGLE1BQU0sSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUN2QyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQWtCLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDN0QsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFekIsTUFBTSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUF1QixzQ0FBc0MsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFaEssTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxpQkFBaUI7UUFFakIsSUFBSSxDQUFDLCtCQUErQixFQUFFO1lBQ3JDLE1BQU0sUUFBUSxHQUFHO2dCQUNoQixhQUFhLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO2dCQUNoRixhQUFhLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxrQ0FBa0MsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDdEYsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsa0NBQWtDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzNGLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLGtDQUFrQyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQzthQUM3RixDQUFDO1lBRUYsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDRCQUE0QixFQUFFO1lBRWxDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDBCQUEwQixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBNkI7Z0JBQ3pILGlCQUFpQixDQUFDLEdBQVE7b0JBQ3pCLE9BQU8sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pFLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUNKLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDBCQUEwQixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBNkI7Z0JBQ3pILGlCQUFpQixDQUFDLEdBQVE7b0JBQ3pCLG9DQUFvQztvQkFDcEMsT0FBTyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakUsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBQ0osV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUE2QjtnQkFDekgsaUJBQWlCLENBQUMsR0FBUTtvQkFDekIsT0FBTzt3QkFDTixJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ3hELElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDeEQsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN4RCxDQUFDO2dCQUNILENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE9BQU8sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ25DLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBb0Isa0NBQWtDLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUN4SSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3JDLEtBQUssTUFBTSxDQUFDLElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ3hCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxTQUFHLENBQUMsQ0FBQzt3QkFDaEMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDM0MsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLENBQUMsb0RBQW9ELEVBQUU7WUFFMUQsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUE2QjtnQkFDekgsaUJBQWlCLENBQUMsR0FBUTtvQkFDekIsT0FBTyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEYsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBQ0osV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUE2QjtnQkFDekgsaUJBQWlCLENBQUMsR0FBUTtvQkFDekIsb0NBQW9DO29CQUNwQyxPQUFPLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRixDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFDSixXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQTZCO2dCQUN6SCxpQkFBaUIsQ0FBQyxHQUFRO29CQUN6QixPQUFPO3dCQUNOLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdkUsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN2RSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQ3ZFLENBQUM7Z0JBQ0gsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosT0FBTyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDbkMsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUFvQixrQ0FBa0MsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQ3hJLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFFckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDOUMsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtZQUM1QixXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQTZCO2dCQUN6SCxpQkFBaUIsQ0FBQyxHQUFRO29CQUN6QixPQUFPO3dCQUNOLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDeEQsRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7cUJBQ3RLLENBQUM7Z0JBQ0gsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosT0FBTyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDbkMsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUE0QyxrQ0FBa0MsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQ2hLLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDckMsS0FBSyxNQUFNLENBQUMsSUFBSSxNQUFNLEVBQUUsQ0FBQzt3QkFDeEIsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzs0QkFDbkIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLFNBQUcsQ0FBQyxDQUFDOzRCQUNoQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLFlBQVksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUMzQyxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxZQUFZLFNBQUcsQ0FBQyxDQUFDOzRCQUN0QyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLFlBQVksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUNoRCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsWUFBWSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ3pELE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixZQUFZLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDMUQsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILGtCQUFrQjtRQUVsQixJQUFJLENBQUMsNkJBQTZCLEVBQUU7WUFFbkMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsMkJBQTJCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUE4QjtnQkFDM0gsa0JBQWtCLENBQUMsR0FBUTtvQkFDMUIsT0FBTyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakUsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBQ0osV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsMkJBQTJCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUE4QjtnQkFDM0gsa0JBQWtCLENBQUMsR0FBUTtvQkFDMUIsb0NBQW9DO29CQUNwQyxPQUFPLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqRSxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFDSixXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQThCO2dCQUMzSCxrQkFBa0IsQ0FBQyxHQUFRO29CQUMxQixPQUFPO3dCQUNOLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDeEQsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN4RCxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQ3hELENBQUM7Z0JBQ0gsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosT0FBTyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDbkMsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUFvQixtQ0FBbUMsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQ3pJLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDckMsS0FBSyxNQUFNLENBQUMsSUFBSSxNQUFNLEVBQUUsQ0FBQzt3QkFDeEIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLFNBQUcsQ0FBQyxDQUFDO3dCQUNoQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLFlBQVksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMzQyxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7WUFDN0IsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsMkJBQTJCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUE4QjtnQkFDM0gsa0JBQWtCLENBQUMsR0FBUTtvQkFDMUIsT0FBTzt3QkFDTixJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ3hELEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO3FCQUN0SyxDQUFDO2dCQUNILENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE9BQU8sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ25DLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBNEMsbUNBQW1DLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNqSyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3JDLEtBQUssTUFBTSxDQUFDLElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ3hCLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ25CLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxTQUFHLENBQUMsQ0FBQzs0QkFDaEMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDM0MsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsWUFBWSxTQUFHLENBQUMsQ0FBQzs0QkFDdEMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxZQUFZLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzs0QkFDaEQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLFlBQVksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUN6RCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsWUFBWSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQzFELENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxzQkFBc0I7UUFFdEIsSUFBSSxDQUFDLG9DQUFvQyxFQUFFO1lBQzFDLE1BQU0sUUFBUSxHQUFHO2dCQUNoQixhQUFhLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO2dCQUNwRixhQUFhLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxzQ0FBc0MsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDMUYsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsc0NBQXNDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQy9GLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLHNDQUFzQyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQzthQUNqRyxDQUFDO1lBRUYsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFO1lBRXZDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBaUM7Z0JBQ2pJLHFCQUFxQixDQUFDLEdBQVE7b0JBQzdCLE9BQU8sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pFLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUNKLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBaUM7Z0JBQ2pJLHFCQUFxQixDQUFDLEdBQVE7b0JBQzdCLG9DQUFvQztvQkFDcEMsT0FBTyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakUsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBQ0osV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUFpQztnQkFDakkscUJBQXFCLENBQUMsR0FBUTtvQkFDN0IsT0FBTzt3QkFDTixJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ3hELElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDeEQsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN4RCxDQUFDO2dCQUNILENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE9BQU8sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ25DLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBb0Isc0NBQXNDLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUM1SSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3JDLEtBQUssTUFBTSxDQUFDLElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ3hCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxTQUFHLENBQUMsQ0FBQzt3QkFDaEMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDM0MsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1lBQ2pDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBaUM7Z0JBQ2pJLHFCQUFxQixDQUFDLEdBQVE7b0JBQzdCLE9BQU87d0JBQ04sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN4RCxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtxQkFDdEssQ0FBQztnQkFDSCxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNuQyxPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQTRDLHNDQUFzQyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDcEssTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNyQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLE1BQU0sRUFBRSxDQUFDO3dCQUN4QixJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUNuQixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksU0FBRyxDQUFDLENBQUM7NEJBQ2hDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssWUFBWSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQzNDLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLFlBQVksU0FBRyxDQUFDLENBQUM7NEJBQ3RDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsWUFBWSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ2hELE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixZQUFZLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzs0QkFDekQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLFlBQVksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUMxRCxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgscUJBQXFCO1FBRXJCLElBQUksQ0FBQyxtQ0FBbUMsRUFBRTtZQUN6QyxNQUFNLFFBQVEsR0FBRztnQkFDaEIsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsc0NBQXNDLENBQUMsQ0FBQztnQkFDcEYsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsc0NBQXNDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzFGLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLHNDQUFzQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMvRixhQUFhLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxzQ0FBc0MsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDakcsQ0FBQztZQUVGLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnQ0FBZ0MsRUFBRTtZQUV0QyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQWlDO2dCQUNqSSxxQkFBcUIsQ0FBQyxHQUFRO29CQUM3QixPQUFPLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqRSxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFDSixXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQWlDO2dCQUNqSSxxQkFBcUIsQ0FBQyxHQUFRO29CQUM3QixvQ0FBb0M7b0JBQ3BDLE9BQU8sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pFLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUNKLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBaUM7Z0JBQ2pJLHFCQUFxQixDQUFDLEdBQVE7b0JBQzdCLE9BQU87d0JBQ04sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN4RCxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ3hELElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztxQkFDeEQsQ0FBQztnQkFDSCxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNuQyxPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQW9CLHNDQUFzQyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDNUksTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNyQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLE1BQU0sRUFBRSxDQUFDO3dCQUN4QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksU0FBRyxDQUFDLENBQUM7d0JBQ2hDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssWUFBWSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzNDLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtZQUMzQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQWlDO2dCQUNqSSxxQkFBcUIsQ0FBQyxHQUFRO29CQUM3QixPQUFPO3dCQUNOLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDeEQsRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7cUJBQ3RLLENBQUM7Z0JBQ0gsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosT0FBTyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDbkMsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUE0QyxzQ0FBc0MsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQ3BLLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDckMsS0FBSyxNQUFNLENBQUMsSUFBSSxNQUFNLEVBQUUsQ0FBQzt3QkFDeEIsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzs0QkFDbkIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLFNBQUcsQ0FBQyxDQUFDOzRCQUNoQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLFlBQVksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUMzQyxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxZQUFZLFNBQUcsQ0FBQyxDQUFDOzRCQUN0QyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLFlBQVksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUNoRCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsWUFBWSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ3pELE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixZQUFZLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDMUQsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILGlCQUFpQjtRQUVqQixJQUFJLENBQUMsa0NBQWtDLEVBQUU7WUFFeEMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMseUJBQXlCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUE0QjtnQkFDdkgsaUJBQWlCO29CQUNoQixPQUFPO3dCQUNOLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztxQkFDM0UsQ0FBQztnQkFDSCxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQW9CLGlDQUFpQyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDdkksTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDO2dCQUN2QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7Z0JBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCwwQkFBMEI7UUFFMUIsSUFBSSxDQUFDLHlGQUF5RixFQUFFLEtBQUs7WUFHcEcsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsaUNBQWlDLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUFvQztnQkFDdkkseUJBQXlCO29CQUN4QixPQUFPO3dCQUNOLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDO3FCQUM1RixDQUFDO2dCQUNILENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXpCLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBNkIsa0NBQWtDLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNqSixNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDO2dCQUN2QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNuRCxDQUFDLENBQUMsQ0FBQztRQUVKLENBQUMsQ0FBQyxDQUFDO1FBRUgsY0FBYztRQUVkLElBQUksQ0FBQyx5QkFBeUIsRUFBRTtZQUMvQixXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQWlDO2dCQUNqSSxzQkFBc0I7b0JBQ3JCLE9BQU87d0JBQ04sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDM0YsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztxQkFDM0YsQ0FBQztnQkFDSCxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNuQyxPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQTZCLHNDQUFzQyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQzNILE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDckMsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUM7b0JBQy9CLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDbkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLFlBQVksS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDN0MsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1IQUFtSCxFQUFFO1lBQ3pILFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBaUM7Z0JBQ2pJLHNCQUFzQjtvQkFDckIsT0FBTzt3QkFDTixJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQ3BHLENBQUM7Z0JBQ0gsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBQ0osV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUFpQztnQkFDakksc0JBQXNCO29CQUNyQixNQUFNLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLEVBQUUsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsSyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLHNCQUFzQixFQUFFLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNuTCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2YsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosT0FBTyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDbkMsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUF1RCxzQ0FBc0MsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNySixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3JDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDO29CQUMvQixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssWUFBWSxLQUFLLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ25FLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxZQUFZLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUM7b0JBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzdDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO2dCQUN0RCxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxjQUFjO1FBRWQsVUFBVSxDQUFDLHNGQUFzRixFQUFFLEtBQUs7WUFFdkcsSUFBSSxhQUFtRCxDQUFDO1lBRXhELFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBaUM7Z0JBQ2pJLHNCQUFzQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU87b0JBQy9DLGFBQWEsR0FBRyxPQUFPLENBQUM7b0JBQ3hCLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUM7YUFDRCxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFUixNQUFNLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUV6QixNQUFNLFFBQVEsQ0FBQyxjQUFjLENBQXdCLHNDQUFzQyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWxJLE1BQU0sQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDekIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBRXpILENBQUMsQ0FBQyxDQUFDO1FBRUgsVUFBVSxDQUFDLHlCQUF5QixFQUFFLEtBQUs7WUFFMUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUFpQztnQkFDakksc0JBQXNCO29CQUNyQixNQUFNLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzVDLENBQUMsQ0FBQyxhQUFhLEdBQUcsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLENBQUM7b0JBQzlELE1BQU0sQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDNUMsQ0FBQyxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxpQkFBaUI7b0JBQzFGLE1BQU0sQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDNUMsQ0FBQyxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQywwQkFBMEI7b0JBRXRHLGtCQUFrQjtvQkFDbEIsTUFBTSxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUM1QyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBLGtCQUFrQjtvQkFDeEQsQ0FBQyxDQUFDLFVBQVUsR0FBRyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ25ELE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckIsQ0FBQzthQUNELEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVSLE1BQU0sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXpCLE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBd0Isc0NBQXNDLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0ksTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLFlBQVksS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDMUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLCtCQUErQjtZQUM5RSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBd0IsS0FBSyxDQUFDLGFBQWMsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUN6RixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVMsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDL0MsTUFBTSxLQUFLLEdBQVEsTUFBTSxDQUFDLEtBQU0sQ0FBQztZQUNqQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLFlBQVksS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQXVCLE1BQU0sQ0FBQyxVQUFXLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRWhGLENBQUMsQ0FBQyxDQUFDO1FBRUgsVUFBVSxDQUFDLHVDQUF1QyxFQUFFLEtBQUs7WUFFeEQsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUFpQztnQkFDakksc0JBQXNCO29CQUNyQixNQUFNLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzVDLE1BQU0sQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDNUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BELENBQUM7YUFDRCxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFUixNQUFNLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUV6QixNQUFNLElBQUksR0FBRyxNQUFNLFFBQVEsQ0FBQyxjQUFjLENBQXdCLHNDQUFzQyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRS9JLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxZQUFZLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDN0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxVQUFVLENBQUMsbUNBQW1DLEVBQUUsS0FBSztZQUdwRCxJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7WUFFckIsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUFpQztnQkFDakksc0JBQXNCO29CQUNyQixNQUFNLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzVDLE1BQU0sQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDNUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUM1QyxNQUFNLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzVDLE9BQU8sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3RELENBQUM7Z0JBQ0QscUJBQXFCLENBQUMsSUFBSTtvQkFDekIsWUFBWSxJQUFJLENBQUMsQ0FBQztvQkFDbEIsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQzthQUNELEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVSLE1BQU0sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXpCLE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FDekMsc0NBQXNDLEVBQ3RDLEtBQUssQ0FBQyxHQUFHLEVBQ1QsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDeEIsU0FBUyxFQUNULENBQUMsQ0FBQyxvQkFBb0I7YUFDdEIsQ0FBQztZQUVGLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxZQUFZLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVyQyxDQUFDLENBQUMsQ0FBQztRQUVILFVBQVUsQ0FBQyxnRkFBZ0YsRUFBRSxLQUFLO1lBSWpHLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBaUM7Z0JBQ2pJLHNCQUFzQjtvQkFDckIsTUFBTSxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUM1QyxDQUFDLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztvQkFDbkIsTUFBTSxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUM1QyxNQUFNLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzVDLENBQUMsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO29CQUNuQixNQUFNLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzVDLE9BQU8sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3RELENBQUM7YUFDRCxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFUixNQUFNLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUV6QixNQUFNLElBQUksR0FBRyxNQUFNLFFBQVEsQ0FBQyxjQUFjLENBQ3pDLHNDQUFzQyxFQUN0QyxLQUFLLENBQUMsR0FBRyxFQUNULElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ3hCLFNBQVMsQ0FDVCxDQUFDO1lBRUYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLFlBQVksS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFekMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO1FBRUgsVUFBVSxDQUFDLHdFQUF3RSxFQUFFLEtBQUs7WUFDekYsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUFpQztnQkFDakksc0JBQXNCO29CQUNyQixNQUFNLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzVDLENBQUMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDaEMsTUFBTSxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUM1QyxPQUFPLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDaEQsQ0FBQzthQUNELEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVSLE1BQU0sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXpCLE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FDekMsc0NBQXNDLEVBQ3RDLEtBQUssQ0FBQyxHQUFHLEVBQ1QsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDeEIsU0FBUyxDQUNULENBQUM7WUFFRixNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksWUFBWSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV6QyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDMUIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUMsQ0FBQztRQUVILFVBQVUsQ0FBQywrRkFBK0YsRUFBRSxLQUFLO1lBQ2hILFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBaUM7Z0JBQ2pJLHNCQUFzQjtvQkFDckIsT0FBTzt3QkFDTixJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7d0JBQ3RFLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQztxQkFDMUUsQ0FBQztnQkFDSCxDQUFDO2FBQ0QsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRVIsTUFBTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFekIsTUFBTSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUN6QyxzQ0FBc0MsRUFDdEMsS0FBSyxDQUFDLEdBQUcsRUFDVCxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUN4QixTQUFTLENBQ1QsQ0FBQztZQUVGLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxZQUFZLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXpDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUMxQixNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxvQkFBb0I7UUFFcEIsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xELFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDZCQUE2QixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBRSxJQUFJO2dCQUNyRyxvQkFBb0IsQ0FBQyxTQUE4QixFQUFFLFNBQTBCLEVBQUUsTUFBZ0MsRUFBRSxPQUFvQztvQkFDdEosT0FBTzt3QkFDTixlQUFlLEVBQUUsQ0FBQzt3QkFDbEIsZUFBZSxFQUFFLENBQUM7d0JBQ2xCLFVBQVUsRUFBRTs0QkFDWDtnQ0FDQyxLQUFLLEVBQUUsS0FBSztnQ0FDWixhQUFhLEVBQUUsR0FBRyxPQUFPLENBQUMsV0FBVyxLQUFLLENBQUMsQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLGdCQUFnQixFQUFFO2dDQUM5SSxVQUFVLEVBQUUsRUFBRTs2QkFDZDt5QkFDRDtxQkFDRCxDQUFDO2dCQUNILENBQUM7YUFDRCxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFUixNQUFNLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUV6QixNQUFNLFVBQVUsR0FBRyxNQUFNLFFBQVEsQ0FBQyxjQUFjLENBQXVCLHFDQUFxQyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN4SixNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3pFLENBQUMsQ0FBQyxDQUFDO1FBRUgsZUFBZTtRQUVmLFVBQVUsQ0FBQywwQkFBMEIsRUFBRTtZQUN0QyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQUU7Z0JBQzlGLGtCQUFrQjtvQkFDakIsT0FBTyxDQUFDLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRSxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNuQyxPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQW1CLGtDQUFrQyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUN6SSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3BDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7b0JBQ3RCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDekMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO29CQUM3QyxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZELENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILFVBQVUsQ0FBQyw2RkFBNkYsRUFBRTtZQUN6RyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQUU7Z0JBQzlGLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxLQUFLO29CQUNqQyxPQUFPLENBQUM7NEJBQ1AsT0FBTyxFQUFFO2dDQUNSLFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUM7Z0NBQzVCLE9BQU8sRUFBRSxTQUFTO2dDQUNsQixLQUFLLEVBQUUsZUFBZTs2QkFDdEI7NEJBQ0QsSUFBSSxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7NEJBQzlDLEtBQUssRUFBRSxPQUFPO3lCQUNkLENBQUMsQ0FBQztnQkFDSixDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNuQyxPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQXNCLGtDQUFrQyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUM1SSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3BDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7b0JBQ3RCLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUN6QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO29CQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLGVBQWUsQ0FBQyxDQUFDO29CQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRTFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILFVBQVUsQ0FBQyxrR0FBa0csRUFBRTtZQUM5RyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQUU7Z0JBQzlGLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxnQkFBZ0I7b0JBQzVDLE9BQU8sQ0FBQzs0QkFDUCxPQUFPLEVBQUU7Z0NBQ1IsU0FBUyxFQUFFLENBQUMsUUFBUSxFQUFFLGdCQUFnQixDQUFDO2dDQUN2QyxPQUFPLEVBQUUsU0FBUztnQ0FDbEIsS0FBSyxFQUFFLGVBQWU7NkJBQ3RCOzRCQUNELElBQUksRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDOzRCQUM5QyxLQUFLLEVBQUUsT0FBTzt5QkFDZCxDQUFDLENBQUM7Z0JBQ0osQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxTQUFTLEdBQUcsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWxELE9BQU8sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ25DLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBc0Isa0NBQWtDLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQzFILE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDcEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQztvQkFDdEIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3pCLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFVLENBQUMsQ0FBQyxDQUFDLFlBQVksS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNsRSxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUMzRCxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxVQUFVLENBQUMsaUdBQWlHLEVBQUU7WUFDN0csV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUFFO2dCQUM5RixrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsZ0JBQWdCO29CQUM1QyxPQUFPLENBQUM7NEJBQ1AsT0FBTyxFQUFFO2dDQUNSLFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsQ0FBQztnQ0FDdkMsT0FBTyxFQUFFLFNBQVM7Z0NBQ2xCLEtBQUssRUFBRSxlQUFlOzZCQUN0Qjs0QkFDRCxJQUFJLEVBQUUsS0FBSyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQzs0QkFDOUMsS0FBSyxFQUFFLE9BQU87NEJBQ2QsV0FBVyxFQUFFLElBQUk7eUJBQ2pCLENBQUMsQ0FBQztnQkFDSixDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLFNBQVMsR0FBRyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEQsT0FBTyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDbkMsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUFzQixrQ0FBa0MsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDMUgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNwQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO29CQUN0QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzdDLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILFVBQVUsQ0FBQyx1QkFBdUIsRUFBRSxLQUFLO1lBRXhDLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztZQUN2QixNQUFNLFFBQVMsU0FBUSxLQUFLLENBQUMsVUFBVTthQUFJO1lBRTNDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDBCQUEwQixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBRTtnQkFDOUYsa0JBQWtCLENBQUMsUUFBUSxFQUFFLGdCQUFnQjtvQkFDNUMsT0FBTyxDQUFDLElBQUksUUFBUSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxRSxDQUFDO2dCQUNELGlCQUFpQixDQUFDLE1BQU07b0JBQ3ZCLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxZQUFZLFFBQVEsQ0FBQyxDQUFDO29CQUV0QyxjQUFjLElBQUksQ0FBQyxDQUFDO29CQUNwQixNQUFNLENBQUMsS0FBSyxHQUFHLGdCQUFnQixDQUFDO29CQUNoQyxNQUFNLENBQUMsSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUN4QyxPQUFPLE1BQU0sQ0FBQztnQkFDZixDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLFNBQVMsR0FBRyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEQsTUFBTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFekIsTUFBTSxLQUFLLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUFzQixrQ0FBa0MsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUksTUFBTSxDQUFDLFdBQVcsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXBDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDdEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsa0JBQWtCO1lBQzVELE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUztRQUNqQyxDQUFDLENBQUMsQ0FBQztRQUVILGdCQUFnQjtRQUVoQixVQUFVLENBQUMsMEJBQTBCLEVBQUU7WUFFdEMsTUFBTSxVQUFVLEdBQUc7Z0JBQ2xCLEdBQUcsS0FBSyxDQUFDO2dCQUNULEdBQUcsS0FBSyxDQUFDO2dCQUNULEdBQUcsRUFBRSxPQUFPO2FBQ1osQ0FBQztZQUVGLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBMkI7Z0JBQ3JILGlCQUFpQjtvQkFDaEIsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEksQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosT0FBTyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDbkMsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUFvQixnQ0FBZ0MsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUMzRyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3BDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7b0JBRXRCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQVEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQVEsQ0FBQyxTQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3BELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQVEsQ0FBQyxTQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQVEsQ0FBQyxTQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQzlELENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILFVBQVUsQ0FBQyxtQkFBbUIsRUFBRSxLQUFLO1lBRXBDLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQztZQUVyQixXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQTJCO2dCQUNySCxpQkFBaUI7b0JBQ2hCLE9BQU87d0JBQ04sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDL0MsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDL0MsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDL0MsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7cUJBQzlGLENBQUM7Z0JBQ0gsQ0FBQztnQkFDRCxlQUFlLENBQUMsUUFBd0I7b0JBQ3ZDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLFFBQVEsRUFBRSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQztvQkFDM0UsWUFBWSxJQUFJLENBQUMsQ0FBQztvQkFDbEIsT0FBTyxRQUFRLENBQUM7Z0JBQ2pCLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXpCLElBQUksS0FBSyxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBb0IsZ0NBQWdDLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU3RyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxvRUFBb0U7WUFDekcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFcEMsWUFBWSxHQUFHLENBQUMsQ0FBQztZQUNqQixLQUFLLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUFvQixnQ0FBZ0MsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFdEcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBRUgsVUFBVSxDQUFDLHVCQUF1QixFQUFFO1lBRW5DLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDRCQUE0QixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBK0I7Z0JBQzdILG9CQUFvQjtvQkFDbkIsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JGLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE9BQU8sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ25DLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBd0IsNEJBQTRCLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDM0csTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNwQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO29CQUV0QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO29CQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDbkQsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsVUFBVSxDQUFDLHdFQUF3RSxFQUFFLEtBQUs7WUFDekYsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsNEJBQTRCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUErQjtnQkFDN0gsb0JBQW9CO29CQUNuQixPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUMxRSxDQUFDO2dCQUNELG1CQUFtQixDQUFDLElBQUk7b0JBQ3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDbkMsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFekIsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUF3Qiw0QkFBNEIsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0csTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUVoRCxNQUFNLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBQyxjQUFjLENBQXdCLDRCQUE0QixFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbkgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFFbkYsQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFFdEIsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUFnQztnQkFDdkgscUJBQXFCO29CQUNwQixPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hHLENBQUM7Z0JBQ0QseUJBQXlCO29CQUN4QixNQUFNLEVBQUUsR0FBRyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDL0MsRUFBRSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7b0JBQzNFLEVBQUUsQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDakYsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNiLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE9BQU8sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ25DLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBNEIscUNBQXFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDeEgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNwQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO29CQUV0QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUN6QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDbkQsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNaLE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDbEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUMzQyxPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQTZCLHlDQUF5QyxFQUFFLEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUNwSixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3BDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7b0JBRXRCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDeEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxtQkFBb0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG1CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxtQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsbUJBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG1CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRSxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsb0dBQW9HLEVBQUU7WUFFMUcsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUF3QjtnQkFDL0csWUFBWTtvQkFDWCxPQUFPLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDcEMsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosT0FBTyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDbkMsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUFpQiw2QkFBNkIsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQy9ILE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDakQsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsbUJBQW1CO1FBRW5CLFVBQVUsQ0FBQyw2QkFBNkIsRUFBRSxLQUFLO1lBQzlDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDBCQUEwQixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBNkI7Z0JBQ3pILGlCQUFpQjtvQkFDaEIsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQy9ELENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXpCLE1BQU0sS0FBSyxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBcUIsaUNBQWlDLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3SSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFcEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUN0QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO1FBRUgsVUFBVSxDQUFDLHFCQUFxQixFQUFFLEtBQUs7WUFDdEMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUE2QjtnQkFDekgsaUJBQWlCO29CQUNoQixNQUFNLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDakQsSUFBSSxDQUFDLE9BQU8sR0FBRyxjQUFjLENBQUM7b0JBQzlCLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQztvQkFDakQsTUFBTSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUNyRSxJQUFJLENBQUMsT0FBTyxHQUFHLGNBQWMsQ0FBQztvQkFDOUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7b0JBQ3hCLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO29CQUMxQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2YsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUE2QjtnQkFDekgsaUJBQWlCO29CQUNoQixNQUFNLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDakcsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFDNUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNmLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXpCLE1BQU0sS0FBSyxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBcUIsaUNBQWlDLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3SSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFcEMsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDOUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRW5ELE1BQU0sS0FBSyxHQUFnQyxNQUFNLENBQUMsS0FBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVELElBQUEsa0JBQVUsRUFBQyxLQUFLLFlBQVksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxVQUFVLENBQUMsNEJBQTRCLEVBQUUsS0FBSztZQUM3QyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQTZCO2dCQUN6SCxpQkFBaUI7b0JBQ2hCLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFDSixXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQTZCO2dCQUN6SCxpQkFBaUI7b0JBQ2hCLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDbkIsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFekIsTUFBTSxLQUFLLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUFxQixpQ0FBaUMsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdJLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVwQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ3RCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUFDLENBQUM7UUFFSCx1QkFBdUI7UUFFdkIsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEtBQUs7WUFFNUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUFpQztnQkFDakksc0JBQXNCO29CQUNyQixPQUFPO3dCQUNOLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUMvRyxDQUFDO2dCQUNILENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3pCLE1BQU0sS0FBSyxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBMEIsc0NBQXNDLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JKLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztRQUVILHFCQUFxQjtRQUVyQixJQUFJLENBQUMsK0JBQStCLEVBQUUsS0FBSztZQUUxQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxxQ0FBd0IsRUFBRSxlQUFlLEVBQUUsSUFBSTtnQkFFckcsb0JBQW9CLENBQUMsUUFBNkIsRUFBRSxRQUF5QjtvQkFDNUUsT0FBTyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN2SixDQUFDO2dCQUVELGlDQUFpQyxDQUFDLElBQThCLEVBQUUsS0FBK0I7b0JBRWhHLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FDMUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFDbEosQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FDN0IsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBRUQsaUNBQWlDLENBQUMsSUFBOEIsRUFBRSxLQUErQjtvQkFDaEcsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUMxQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUNsSixDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUM3QixDQUFDLENBQUM7Z0JBQ0osQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFekIsTUFBTSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUE2Qiw2QkFBNkIsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUzSSxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMvQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRXpDLE1BQU0sUUFBUSxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBcUMsNkJBQTZCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0gsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFdEQsTUFBTSxRQUFRLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUFxQyw2QkFBNkIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzSCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4RUFBOEUsRUFBRSxLQUFLO1lBRXpGLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDZCQUE2QixDQUFDLHFDQUF3QixFQUFFLGVBQWUsRUFBRSxJQUFJO2dCQUNyRyxvQkFBb0IsQ0FBQyxRQUE2QixFQUFFLFFBQXlCO29CQUM1RSxPQUFPLEVBQUUsQ0FBQztnQkFDWCxDQUFDO2dCQUNELGlDQUFpQyxDQUFDLElBQThCLEVBQUUsS0FBK0I7b0JBQ2hHLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUM7Z0JBQ0QsaUNBQWlDLENBQUMsSUFBOEIsRUFBRSxLQUErQjtvQkFDaEcsT0FBTyxFQUFFLENBQUM7Z0JBQ1gsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFekIsTUFBTSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUE2Qiw2QkFBNkIsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUzSSxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMvQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxxQkFBcUI7UUFFckIsSUFBSSxDQUFDLCtCQUErQixFQUFFLEtBQUs7WUFHMUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsNkJBQTZCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUFFLElBQUk7Z0JBQ3JHLG9CQUFvQixDQUFDLFFBQTZCLEVBQUUsUUFBeUIsRUFBRSxLQUErQjtvQkFDN0csT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekosQ0FBQztnQkFDRCw4QkFBOEIsQ0FBQyxJQUE4QixFQUFFLEtBQStCO29CQUM3RixPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN2SixDQUFDO2dCQUNELDRCQUE0QixDQUFDLElBQThCLEVBQUUsS0FBK0I7b0JBQzNGLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25KLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXpCLE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBNkIsNkJBQTZCLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFM0ksTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDL0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUV6QyxNQUFNLFFBQVEsR0FBRyxNQUFNLFFBQVEsQ0FBQyxjQUFjLENBQTZCLDBCQUEwQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hILE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFOUMsTUFBTSxRQUFRLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUE2Qix3QkFBd0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5RyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlFQUF5RSxFQUFFLEtBQUs7WUFFcEYsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUFpQztnQkFDakksc0JBQXNCLENBQUMsSUFBSSxFQUFFLFNBQVM7b0JBQ3JDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxTQUFTLENBQUM7b0JBQzFCLE9BQU87d0JBQ04sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7cUJBQ25HLENBQUM7Z0JBQ0gsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDekIsTUFBTSxLQUFLLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUEwQixzQ0FBc0MsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckosTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhGQUE4RixFQUFFLEtBQUs7WUFFekcsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMscUNBQXdCLEVBQUUsZUFBZSxFQUFpQztnQkFDakksc0JBQXNCLENBQUMsSUFBSSxFQUFFLFNBQVM7b0JBQ3JDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDO29CQUNsQyxPQUFPO3dCQUNOLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO3dCQUNuRyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztxQkFDdkcsQ0FBQztnQkFDSCxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN6QixNQUFNLEtBQUssR0FBRyxNQUFNLFFBQVEsQ0FBQyxjQUFjLENBQzFDLHNDQUFzQyxFQUN0QyxLQUFLLENBQUMsR0FBRyxFQUNULENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQ3JELENBQUM7WUFDRixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9