/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/language", "vs/editor/common/standalone/standaloneEnums", "vs/editor/standalone/browser/standaloneServices", "vs/editor/standalone/common/monarch/monarchCompile", "vs/editor/standalone/common/monarch/monarchLexer", "vs/editor/standalone/common/standaloneTheme", "vs/platform/markers/common/markers", "vs/editor/common/services/languageFeatures", "vs/platform/configuration/common/configuration"], function (require, exports, color_1, range_1, languages, languageConfigurationRegistry_1, modesRegistry_1, language_1, standaloneEnums, standaloneServices_1, monarchCompile_1, monarchLexer_1, standaloneTheme_1, markers_1, languageFeatures_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TokenizationSupportAdapter = exports.EncodedTokenizationSupportAdapter = void 0;
    exports.register = register;
    exports.getLanguages = getLanguages;
    exports.getEncodedLanguageId = getEncodedLanguageId;
    exports.onLanguage = onLanguage;
    exports.onLanguageEncountered = onLanguageEncountered;
    exports.setLanguageConfiguration = setLanguageConfiguration;
    exports.setColorMap = setColorMap;
    exports.registerTokensProviderFactory = registerTokensProviderFactory;
    exports.setTokensProvider = setTokensProvider;
    exports.setMonarchTokensProvider = setMonarchTokensProvider;
    exports.registerReferenceProvider = registerReferenceProvider;
    exports.registerRenameProvider = registerRenameProvider;
    exports.registerNewSymbolNameProvider = registerNewSymbolNameProvider;
    exports.registerSignatureHelpProvider = registerSignatureHelpProvider;
    exports.registerHoverProvider = registerHoverProvider;
    exports.registerDocumentSymbolProvider = registerDocumentSymbolProvider;
    exports.registerDocumentHighlightProvider = registerDocumentHighlightProvider;
    exports.registerLinkedEditingRangeProvider = registerLinkedEditingRangeProvider;
    exports.registerDefinitionProvider = registerDefinitionProvider;
    exports.registerImplementationProvider = registerImplementationProvider;
    exports.registerTypeDefinitionProvider = registerTypeDefinitionProvider;
    exports.registerCodeLensProvider = registerCodeLensProvider;
    exports.registerCodeActionProvider = registerCodeActionProvider;
    exports.registerDocumentFormattingEditProvider = registerDocumentFormattingEditProvider;
    exports.registerDocumentRangeFormattingEditProvider = registerDocumentRangeFormattingEditProvider;
    exports.registerOnTypeFormattingEditProvider = registerOnTypeFormattingEditProvider;
    exports.registerLinkProvider = registerLinkProvider;
    exports.registerCompletionItemProvider = registerCompletionItemProvider;
    exports.registerColorProvider = registerColorProvider;
    exports.registerFoldingRangeProvider = registerFoldingRangeProvider;
    exports.registerDeclarationProvider = registerDeclarationProvider;
    exports.registerSelectionRangeProvider = registerSelectionRangeProvider;
    exports.registerDocumentSemanticTokensProvider = registerDocumentSemanticTokensProvider;
    exports.registerDocumentRangeSemanticTokensProvider = registerDocumentRangeSemanticTokensProvider;
    exports.registerInlineCompletionsProvider = registerInlineCompletionsProvider;
    exports.registerInlineEditProvider = registerInlineEditProvider;
    exports.registerInlayHintsProvider = registerInlayHintsProvider;
    exports.createMonacoLanguagesAPI = createMonacoLanguagesAPI;
    /**
     * Register information about a new language.
     */
    function register(language) {
        // Intentionally using the `ModesRegistry` here to avoid
        // instantiating services too quickly in the standalone editor.
        modesRegistry_1.ModesRegistry.registerLanguage(language);
    }
    /**
     * Get the information of all the registered languages.
     */
    function getLanguages() {
        let result = [];
        result = result.concat(modesRegistry_1.ModesRegistry.getLanguages());
        return result;
    }
    function getEncodedLanguageId(languageId) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        return languageService.languageIdCodec.encodeLanguageId(languageId);
    }
    /**
     * An event emitted when a language is associated for the first time with a text model.
     * @event
     */
    function onLanguage(languageId, callback) {
        return standaloneServices_1.StandaloneServices.withServices(() => {
            const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
            const disposable = languageService.onDidRequestRichLanguageFeatures((encounteredLanguageId) => {
                if (encounteredLanguageId === languageId) {
                    // stop listening
                    disposable.dispose();
                    // invoke actual listener
                    callback();
                }
            });
            return disposable;
        });
    }
    /**
     * An event emitted when a language is associated for the first time with a text model or
     * when a language is encountered during the tokenization of another language.
     * @event
     */
    function onLanguageEncountered(languageId, callback) {
        return standaloneServices_1.StandaloneServices.withServices(() => {
            const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
            const disposable = languageService.onDidRequestBasicLanguageFeatures((encounteredLanguageId) => {
                if (encounteredLanguageId === languageId) {
                    // stop listening
                    disposable.dispose();
                    // invoke actual listener
                    callback();
                }
            });
            return disposable;
        });
    }
    /**
     * Set the editing configuration for a language.
     */
    function setLanguageConfiguration(languageId, configuration) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        if (!languageService.isRegisteredLanguageId(languageId)) {
            throw new Error(`Cannot set configuration for unknown language ${languageId}`);
        }
        const languageConfigurationService = standaloneServices_1.StandaloneServices.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
        return languageConfigurationService.register(languageId, configuration, 100);
    }
    /**
     * @internal
     */
    class EncodedTokenizationSupportAdapter {
        constructor(languageId, actual) {
            this._languageId = languageId;
            this._actual = actual;
        }
        dispose() {
            // NOOP
        }
        getInitialState() {
            return this._actual.getInitialState();
        }
        tokenize(line, hasEOL, state) {
            if (typeof this._actual.tokenize === 'function') {
                return TokenizationSupportAdapter.adaptTokenize(this._languageId, this._actual, line, state);
            }
            throw new Error('Not supported!');
        }
        tokenizeEncoded(line, hasEOL, state) {
            const result = this._actual.tokenizeEncoded(line, state);
            return new languages.EncodedTokenizationResult(result.tokens, result.endState);
        }
    }
    exports.EncodedTokenizationSupportAdapter = EncodedTokenizationSupportAdapter;
    /**
     * @internal
     */
    class TokenizationSupportAdapter {
        constructor(_languageId, _actual, _languageService, _standaloneThemeService) {
            this._languageId = _languageId;
            this._actual = _actual;
            this._languageService = _languageService;
            this._standaloneThemeService = _standaloneThemeService;
        }
        dispose() {
            // NOOP
        }
        getInitialState() {
            return this._actual.getInitialState();
        }
        static _toClassicTokens(tokens, language) {
            const result = [];
            let previousStartIndex = 0;
            for (let i = 0, len = tokens.length; i < len; i++) {
                const t = tokens[i];
                let startIndex = t.startIndex;
                // Prevent issues stemming from a buggy external tokenizer.
                if (i === 0) {
                    // Force first token to start at first index!
                    startIndex = 0;
                }
                else if (startIndex < previousStartIndex) {
                    // Force tokens to be after one another!
                    startIndex = previousStartIndex;
                }
                result[i] = new languages.Token(startIndex, t.scopes, language);
                previousStartIndex = startIndex;
            }
            return result;
        }
        static adaptTokenize(language, actual, line, state) {
            const actualResult = actual.tokenize(line, state);
            const tokens = TokenizationSupportAdapter._toClassicTokens(actualResult.tokens, language);
            let endState;
            // try to save an object if possible
            if (actualResult.endState.equals(state)) {
                endState = state;
            }
            else {
                endState = actualResult.endState;
            }
            return new languages.TokenizationResult(tokens, endState);
        }
        tokenize(line, hasEOL, state) {
            return TokenizationSupportAdapter.adaptTokenize(this._languageId, this._actual, line, state);
        }
        _toBinaryTokens(languageIdCodec, tokens) {
            const languageId = languageIdCodec.encodeLanguageId(this._languageId);
            const tokenTheme = this._standaloneThemeService.getColorTheme().tokenTheme;
            const result = [];
            let resultLen = 0;
            let previousStartIndex = 0;
            for (let i = 0, len = tokens.length; i < len; i++) {
                const t = tokens[i];
                const metadata = tokenTheme.match(languageId, t.scopes) | 1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */;
                if (resultLen > 0 && result[resultLen - 1] === metadata) {
                    // same metadata
                    continue;
                }
                let startIndex = t.startIndex;
                // Prevent issues stemming from a buggy external tokenizer.
                if (i === 0) {
                    // Force first token to start at first index!
                    startIndex = 0;
                }
                else if (startIndex < previousStartIndex) {
                    // Force tokens to be after one another!
                    startIndex = previousStartIndex;
                }
                result[resultLen++] = startIndex;
                result[resultLen++] = metadata;
                previousStartIndex = startIndex;
            }
            const actualResult = new Uint32Array(resultLen);
            for (let i = 0; i < resultLen; i++) {
                actualResult[i] = result[i];
            }
            return actualResult;
        }
        tokenizeEncoded(line, hasEOL, state) {
            const actualResult = this._actual.tokenize(line, state);
            const tokens = this._toBinaryTokens(this._languageService.languageIdCodec, actualResult.tokens);
            let endState;
            // try to save an object if possible
            if (actualResult.endState.equals(state)) {
                endState = state;
            }
            else {
                endState = actualResult.endState;
            }
            return new languages.EncodedTokenizationResult(tokens, endState);
        }
    }
    exports.TokenizationSupportAdapter = TokenizationSupportAdapter;
    function isATokensProvider(provider) {
        return (typeof provider.getInitialState === 'function');
    }
    function isEncodedTokensProvider(provider) {
        return 'tokenizeEncoded' in provider;
    }
    function isThenable(obj) {
        return obj && typeof obj.then === 'function';
    }
    /**
     * Change the color map that is used for token colors.
     * Supported formats (hex): #RRGGBB, $RRGGBBAA, #RGB, #RGBA
     */
    function setColorMap(colorMap) {
        const standaloneThemeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        if (colorMap) {
            const result = [null];
            for (let i = 1, len = colorMap.length; i < len; i++) {
                result[i] = color_1.Color.fromHex(colorMap[i]);
            }
            standaloneThemeService.setColorMapOverride(result);
        }
        else {
            standaloneThemeService.setColorMapOverride(null);
        }
    }
    /**
     * @internal
     */
    function createTokenizationSupportAdapter(languageId, provider) {
        if (isEncodedTokensProvider(provider)) {
            return new EncodedTokenizationSupportAdapter(languageId, provider);
        }
        else {
            return new TokenizationSupportAdapter(languageId, provider, standaloneServices_1.StandaloneServices.get(language_1.ILanguageService), standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService));
        }
    }
    /**
     * Register a tokens provider factory for a language. This tokenizer will be exclusive with a tokenizer
     * set using `setTokensProvider` or one created using `setMonarchTokensProvider`, but will work together
     * with a tokens provider set using `registerDocumentSemanticTokensProvider` or `registerDocumentRangeSemanticTokensProvider`.
     */
    function registerTokensProviderFactory(languageId, factory) {
        const adaptedFactory = new languages.LazyTokenizationSupport(async () => {
            const result = await Promise.resolve(factory.create());
            if (!result) {
                return null;
            }
            if (isATokensProvider(result)) {
                return createTokenizationSupportAdapter(languageId, result);
            }
            return new monarchLexer_1.MonarchTokenizer(standaloneServices_1.StandaloneServices.get(language_1.ILanguageService), standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService), languageId, (0, monarchCompile_1.compile)(languageId, result), standaloneServices_1.StandaloneServices.get(configuration_1.IConfigurationService));
        });
        return languages.TokenizationRegistry.registerFactory(languageId, adaptedFactory);
    }
    /**
     * Set the tokens provider for a language (manual implementation). This tokenizer will be exclusive
     * with a tokenizer created using `setMonarchTokensProvider`, or with `registerTokensProviderFactory`,
     * but will work together with a tokens provider set using `registerDocumentSemanticTokensProvider`
     * or `registerDocumentRangeSemanticTokensProvider`.
     */
    function setTokensProvider(languageId, provider) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        if (!languageService.isRegisteredLanguageId(languageId)) {
            throw new Error(`Cannot set tokens provider for unknown language ${languageId}`);
        }
        if (isThenable(provider)) {
            return registerTokensProviderFactory(languageId, { create: () => provider });
        }
        return languages.TokenizationRegistry.register(languageId, createTokenizationSupportAdapter(languageId, provider));
    }
    /**
     * Set the tokens provider for a language (monarch implementation). This tokenizer will be exclusive
     * with a tokenizer set using `setTokensProvider`, or with `registerTokensProviderFactory`, but will
     * work together with a tokens provider set using `registerDocumentSemanticTokensProvider` or
     * `registerDocumentRangeSemanticTokensProvider`.
     */
    function setMonarchTokensProvider(languageId, languageDef) {
        const create = (languageDef) => {
            return new monarchLexer_1.MonarchTokenizer(standaloneServices_1.StandaloneServices.get(language_1.ILanguageService), standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService), languageId, (0, monarchCompile_1.compile)(languageId, languageDef), standaloneServices_1.StandaloneServices.get(configuration_1.IConfigurationService));
        };
        if (isThenable(languageDef)) {
            return registerTokensProviderFactory(languageId, { create: () => languageDef });
        }
        return languages.TokenizationRegistry.register(languageId, create(languageDef));
    }
    /**
     * Register a reference provider (used by e.g. reference search).
     */
    function registerReferenceProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.referenceProvider.register(languageSelector, provider);
    }
    /**
     * Register a rename provider (used by e.g. rename symbol).
     */
    function registerRenameProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.renameProvider.register(languageSelector, provider);
    }
    /**
     * Register a new symbol-name provider (e.g., when a symbol is being renamed, show new possible symbol-names)
     */
    function registerNewSymbolNameProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.newSymbolNamesProvider.register(languageSelector, provider);
    }
    /**
     * Register a signature help provider (used by e.g. parameter hints).
     */
    function registerSignatureHelpProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.signatureHelpProvider.register(languageSelector, provider);
    }
    /**
     * Register a hover provider (used by e.g. editor hover).
     */
    function registerHoverProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.hoverProvider.register(languageSelector, {
            provideHover: (model, position, token) => {
                const word = model.getWordAtPosition(position);
                return Promise.resolve(provider.provideHover(model, position, token)).then((value) => {
                    if (!value) {
                        return undefined;
                    }
                    if (!value.range && word) {
                        value.range = new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
                    }
                    if (!value.range) {
                        value.range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
                    }
                    return value;
                });
            }
        });
    }
    /**
     * Register a document symbol provider (used by e.g. outline).
     */
    function registerDocumentSymbolProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.documentSymbolProvider.register(languageSelector, provider);
    }
    /**
     * Register a document highlight provider (used by e.g. highlight occurrences).
     */
    function registerDocumentHighlightProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.documentHighlightProvider.register(languageSelector, provider);
    }
    /**
     * Register an linked editing range provider.
     */
    function registerLinkedEditingRangeProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.linkedEditingRangeProvider.register(languageSelector, provider);
    }
    /**
     * Register a definition provider (used by e.g. go to definition).
     */
    function registerDefinitionProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.definitionProvider.register(languageSelector, provider);
    }
    /**
     * Register a implementation provider (used by e.g. go to implementation).
     */
    function registerImplementationProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.implementationProvider.register(languageSelector, provider);
    }
    /**
     * Register a type definition provider (used by e.g. go to type definition).
     */
    function registerTypeDefinitionProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.typeDefinitionProvider.register(languageSelector, provider);
    }
    /**
     * Register a code lens provider (used by e.g. inline code lenses).
     */
    function registerCodeLensProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.codeLensProvider.register(languageSelector, provider);
    }
    /**
     * Register a code action provider (used by e.g. quick fix).
     */
    function registerCodeActionProvider(languageSelector, provider, metadata) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.codeActionProvider.register(languageSelector, {
            providedCodeActionKinds: metadata?.providedCodeActionKinds,
            documentation: metadata?.documentation,
            provideCodeActions: (model, range, context, token) => {
                const markerService = standaloneServices_1.StandaloneServices.get(markers_1.IMarkerService);
                const markers = markerService.read({ resource: model.uri }).filter(m => {
                    return range_1.Range.areIntersectingOrTouching(m, range);
                });
                return provider.provideCodeActions(model, range, { markers, only: context.only, trigger: context.trigger }, token);
            },
            resolveCodeAction: provider.resolveCodeAction
        });
    }
    /**
     * Register a formatter that can handle only entire models.
     */
    function registerDocumentFormattingEditProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.documentFormattingEditProvider.register(languageSelector, provider);
    }
    /**
     * Register a formatter that can handle a range inside a model.
     */
    function registerDocumentRangeFormattingEditProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.documentRangeFormattingEditProvider.register(languageSelector, provider);
    }
    /**
     * Register a formatter than can do formatting as the user types.
     */
    function registerOnTypeFormattingEditProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.onTypeFormattingEditProvider.register(languageSelector, provider);
    }
    /**
     * Register a link provider that can find links in text.
     */
    function registerLinkProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.linkProvider.register(languageSelector, provider);
    }
    /**
     * Register a completion item provider (use by e.g. suggestions).
     */
    function registerCompletionItemProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.completionProvider.register(languageSelector, provider);
    }
    /**
     * Register a document color provider (used by Color Picker, Color Decorator).
     */
    function registerColorProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.colorProvider.register(languageSelector, provider);
    }
    /**
     * Register a folding range provider
     */
    function registerFoldingRangeProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.foldingRangeProvider.register(languageSelector, provider);
    }
    /**
     * Register a declaration provider
     */
    function registerDeclarationProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.declarationProvider.register(languageSelector, provider);
    }
    /**
     * Register a selection range provider
     */
    function registerSelectionRangeProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.selectionRangeProvider.register(languageSelector, provider);
    }
    /**
     * Register a document semantic tokens provider. A semantic tokens provider will complement and enhance a
     * simple top-down tokenizer. Simple top-down tokenizers can be set either via `setMonarchTokensProvider`
     * or `setTokensProvider`.
     *
     * For the best user experience, register both a semantic tokens provider and a top-down tokenizer.
     */
    function registerDocumentSemanticTokensProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.documentSemanticTokensProvider.register(languageSelector, provider);
    }
    /**
     * Register a document range semantic tokens provider. A semantic tokens provider will complement and enhance a
     * simple top-down tokenizer. Simple top-down tokenizers can be set either via `setMonarchTokensProvider`
     * or `setTokensProvider`.
     *
     * For the best user experience, register both a semantic tokens provider and a top-down tokenizer.
     */
    function registerDocumentRangeSemanticTokensProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.documentRangeSemanticTokensProvider.register(languageSelector, provider);
    }
    /**
     * Register an inline completions provider.
     */
    function registerInlineCompletionsProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.inlineCompletionsProvider.register(languageSelector, provider);
    }
    function registerInlineEditProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.inlineEditProvider.register(languageSelector, provider);
    }
    /**
     * Register an inlay hints provider.
     */
    function registerInlayHintsProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.inlayHintsProvider.register(languageSelector, provider);
    }
    /**
     * @internal
     */
    function createMonacoLanguagesAPI() {
        return {
            register: register,
            getLanguages: getLanguages,
            onLanguage: onLanguage,
            onLanguageEncountered: onLanguageEncountered,
            getEncodedLanguageId: getEncodedLanguageId,
            // provider methods
            setLanguageConfiguration: setLanguageConfiguration,
            setColorMap: setColorMap,
            registerTokensProviderFactory: registerTokensProviderFactory,
            setTokensProvider: setTokensProvider,
            setMonarchTokensProvider: setMonarchTokensProvider,
            registerReferenceProvider: registerReferenceProvider,
            registerRenameProvider: registerRenameProvider,
            registerNewSymbolNameProvider: registerNewSymbolNameProvider,
            registerCompletionItemProvider: registerCompletionItemProvider,
            registerSignatureHelpProvider: registerSignatureHelpProvider,
            registerHoverProvider: registerHoverProvider,
            registerDocumentSymbolProvider: registerDocumentSymbolProvider,
            registerDocumentHighlightProvider: registerDocumentHighlightProvider,
            registerLinkedEditingRangeProvider: registerLinkedEditingRangeProvider,
            registerDefinitionProvider: registerDefinitionProvider,
            registerImplementationProvider: registerImplementationProvider,
            registerTypeDefinitionProvider: registerTypeDefinitionProvider,
            registerCodeLensProvider: registerCodeLensProvider,
            registerCodeActionProvider: registerCodeActionProvider,
            registerDocumentFormattingEditProvider: registerDocumentFormattingEditProvider,
            registerDocumentRangeFormattingEditProvider: registerDocumentRangeFormattingEditProvider,
            registerOnTypeFormattingEditProvider: registerOnTypeFormattingEditProvider,
            registerLinkProvider: registerLinkProvider,
            registerColorProvider: registerColorProvider,
            registerFoldingRangeProvider: registerFoldingRangeProvider,
            registerDeclarationProvider: registerDeclarationProvider,
            registerSelectionRangeProvider: registerSelectionRangeProvider,
            registerDocumentSemanticTokensProvider: registerDocumentSemanticTokensProvider,
            registerDocumentRangeSemanticTokensProvider: registerDocumentRangeSemanticTokensProvider,
            registerInlineCompletionsProvider: registerInlineCompletionsProvider,
            registerInlineEditProvider: registerInlineEditProvider,
            registerInlayHintsProvider: registerInlayHintsProvider,
            // enums
            DocumentHighlightKind: standaloneEnums.DocumentHighlightKind,
            CompletionItemKind: standaloneEnums.CompletionItemKind,
            CompletionItemTag: standaloneEnums.CompletionItemTag,
            CompletionItemInsertTextRule: standaloneEnums.CompletionItemInsertTextRule,
            SymbolKind: standaloneEnums.SymbolKind,
            SymbolTag: standaloneEnums.SymbolTag,
            IndentAction: standaloneEnums.IndentAction,
            CompletionTriggerKind: standaloneEnums.CompletionTriggerKind,
            SignatureHelpTriggerKind: standaloneEnums.SignatureHelpTriggerKind,
            InlayHintKind: standaloneEnums.InlayHintKind,
            InlineCompletionTriggerKind: standaloneEnums.InlineCompletionTriggerKind,
            InlineEditTriggerKind: standaloneEnums.InlineEditTriggerKind,
            CodeActionTriggerType: standaloneEnums.CodeActionTriggerType,
            NewSymbolNameTag: standaloneEnums.NewSymbolNameTag,
            PartialAcceptTriggerKind: standaloneEnums.PartialAcceptTriggerKind,
            // classes
            FoldingRangeKind: languages.FoldingRangeKind,
            SelectedSuggestionInfo: languages.SelectedSuggestionInfo,
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUxhbmd1YWdlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3N0YW5kYWxvbmUvYnJvd3Nlci9zdGFuZGFsb25lTGFuZ3VhZ2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTRCaEcsNEJBSUM7SUFLRCxvQ0FJQztJQUVELG9EQUdDO0lBTUQsZ0NBYUM7SUFPRCxzREFhQztJQUtELDREQU9DO0lBd1FELGtDQVdDO0lBdUJELHNFQVlDO0lBUUQsOENBU0M7SUFRRCw0REFRQztJQUtELDhEQUdDO0lBS0Qsd0RBR0M7SUFLRCxzRUFHQztJQUtELHNFQUdDO0lBS0Qsc0RBb0JDO0lBS0Qsd0VBR0M7SUFLRCw4RUFHQztJQUtELGdGQUdDO0lBS0QsZ0VBR0M7SUFLRCx3RUFHQztJQUtELHdFQUdDO0lBS0QsNERBR0M7SUFLRCxnRUFjQztJQUtELHdGQUdDO0lBS0Qsa0dBR0M7SUFLRCxvRkFHQztJQUtELG9EQUdDO0lBS0Qsd0VBR0M7SUFLRCxzREFHQztJQUtELG9FQUdDO0lBS0Qsa0VBR0M7SUFLRCx3RUFHQztJQVNELHdGQUdDO0lBU0Qsa0dBR0M7SUFLRCw4RUFHQztJQUVELGdFQUdDO0lBS0QsZ0VBR0M7SUE4REQsNERBK0RDO0lBcnhCRDs7T0FFRztJQUNILFNBQWdCLFFBQVEsQ0FBQyxRQUFpQztRQUN6RCx3REFBd0Q7UUFDeEQsK0RBQStEO1FBQy9ELDZCQUFhLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0IsWUFBWTtRQUMzQixJQUFJLE1BQU0sR0FBOEIsRUFBRSxDQUFDO1FBQzNDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLDZCQUFhLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUNy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