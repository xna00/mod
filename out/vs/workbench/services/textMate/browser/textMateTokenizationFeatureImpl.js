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
define(["require", "exports", "vs/amdX", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/observable", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/types", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/supports/tokenization", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/textMate/browser/tokenizationSupport/textMateTokenizationSupport", "vs/workbench/services/textMate/browser/tokenizationSupport/tokenizationSupportWithLineLimit", "vs/workbench/services/textMate/browser/backgroundTokenization/threadedBackgroundTokenizerFactory", "vs/workbench/services/textMate/common/TMGrammarFactory", "vs/workbench/services/textMate/common/TMGrammars", "vs/workbench/services/themes/common/workbenchThemeService"], function (require, exports, amdX_1, dom, arrays_1, color_1, errors_1, lifecycle_1, network_1, observable_1, platform_1, resources, types, languages_1, language_1, tokenization_1, nls, configuration_1, extensionResourceLoader_1, instantiation_1, log_1, notification_1, progress_1, telemetry_1, environmentService_1, textMateTokenizationSupport_1, tokenizationSupportWithLineLimit_1, threadedBackgroundTokenizerFactory_1, TMGrammarFactory_1, TMGrammars_1, workbenchThemeService_1) {
    "use strict";
    var TextMateTokenizationFeature_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextMateTokenizationFeature = void 0;
    let TextMateTokenizationFeature = class TextMateTokenizationFeature extends lifecycle_1.Disposable {
        static { TextMateTokenizationFeature_1 = this; }
        static { this.reportTokenizationTimeCounter = { sync: 0, async: 0 }; }
        constructor(_languageService, _themeService, _extensionResourceLoaderService, _notificationService, _logService, _configurationService, _progressService, _environmentService, _instantiationService, _telemetryService) {
            super();
            this._languageService = _languageService;
            this._themeService = _themeService;
            this._extensionResourceLoaderService = _extensionResourceLoaderService;
            this._notificationService = _notificationService;
            this._logService = _logService;
            this._configurationService = _configurationService;
            this._progressService = _progressService;
            this._environmentService = _environmentService;
            this._instantiationService = _instantiationService;
            this._telemetryService = _telemetryService;
            this._createdModes = [];
            this._encounteredLanguages = [];
            this._debugMode = false;
            this._debugModePrintFunc = () => { };
            this._grammarDefinitions = null;
            this._grammarFactory = null;
            this._tokenizersRegistrations = new lifecycle_1.DisposableStore();
            this._currentTheme = null;
            this._currentTokenColorMap = null;
            this._threadedBackgroundTokenizerFactory = this._instantiationService.createInstance(threadedBackgroundTokenizerFactory_1.ThreadedBackgroundTokenizerFactory, (timeMs, languageId, sourceExtensionId, lineLength, isRandomSample) => this._reportTokenizationTime(timeMs, languageId, sourceExtensionId, lineLength, true, isRandomSample), () => this.getAsyncTokenizationEnabled());
            this._vscodeOniguruma = null;
            this._styleElement = dom.createStyleSheet();
            this._styleElement.className = 'vscode-tokens-styles';
            TMGrammars_1.grammarsExtPoint.setHandler((extensions) => this._handleGrammarsExtPoint(extensions));
            this._updateTheme(this._themeService.getColorTheme(), true);
            this._register(this._themeService.onDidColorThemeChange(() => {
                this._updateTheme(this._themeService.getColorTheme(), false);
            }));
            this._languageService.onDidRequestRichLanguageFeatures((languageId) => {
                this._createdModes.push(languageId);
            });
        }
        getAsyncTokenizationEnabled() {
            return !!this._configurationService.getValue('editor.experimental.asyncTokenization');
        }
        getAsyncTokenizationVerification() {
            return !!this._configurationService.getValue('editor.experimental.asyncTokenizationVerification');
        }
        _handleGrammarsExtPoint(extensions) {
            this._grammarDefinitions = null;
            if (this._grammarFactory) {
                this._grammarFactory.dispose();
                this._grammarFactory = null;
            }
            this._tokenizersRegistrations.clear();
            this._grammarDefinitions = [];
            for (const extension of extensions) {
                const grammars = extension.value;
                for (const grammar of grammars) {
                    const validatedGrammar = this._validateGrammarDefinition(extension, grammar);
                    if (validatedGrammar) {
                        this._grammarDefinitions.push(validatedGrammar);
                        if (validatedGrammar.language) {
                            const lazyTokenizationSupport = new languages_1.LazyTokenizationSupport(() => this._createTokenizationSupport(validatedGrammar.language));
                            this._tokenizersRegistrations.add(lazyTokenizationSupport);
                            this._tokenizersRegistrations.add(languages_1.TokenizationRegistry.registerFactory(validatedGrammar.language, lazyTokenizationSupport));
                        }
                    }
                }
            }
            this._threadedBackgroundTokenizerFactory.setGrammarDefinitions(this._grammarDefinitions);
            for (const createdMode of this._createdModes) {
                languages_1.TokenizationRegistry.getOrCreate(createdMode);
            }
        }
        _validateGrammarDefinition(extension, grammar) {
            if (!validateGrammarExtensionPoint(extension.description.extensionLocation, grammar, extension.collector, this._languageService)) {
                return null;
            }
            const grammarLocation = resources.joinPath(extension.description.extensionLocation, grammar.path);
            const embeddedLanguages = Object.create(null);
            if (grammar.embeddedLanguages) {
                const scopes = Object.keys(grammar.embeddedLanguages);
                for (let i = 0, len = scopes.length; i < len; i++) {
                    const scope = scopes[i];
                    const language = grammar.embeddedLanguages[scope];
                    if (typeof language !== 'string') {
                        // never hurts to be too careful
                        continue;
                    }
                    if (this._languageService.isRegisteredLanguageId(language)) {
                        embeddedLanguages[scope] = this._languageService.languageIdCodec.encodeLanguageId(language);
                    }
                }
            }
            const tokenTypes = Object.create(null);
            if (grammar.tokenTypes) {
                const scopes = Object.keys(grammar.tokenTypes);
                for (const scope of scopes) {
                    const tokenType = grammar.tokenTypes[scope];
                    switch (tokenType) {
                        case 'string':
                            tokenTypes[scope] = 2 /* StandardTokenType.String */;
                            break;
                        case 'other':
                            tokenTypes[scope] = 0 /* StandardTokenType.Other */;
                            break;
                        case 'comment':
                            tokenTypes[scope] = 1 /* StandardTokenType.Comment */;
                            break;
                    }
                }
            }
            const validLanguageId = grammar.language && this._languageService.isRegisteredLanguageId(grammar.language) ? grammar.language : null;
            function asStringArray(array, defaultValue) {
                if (!Array.isArray(array)) {
                    return defaultValue;
                }
                if (!array.every(e => typeof e === 'string')) {
                    return defaultValue;
                }
                return array;
            }
            return {
                location: grammarLocation,
                language: validLanguageId || undefined,
                scopeName: grammar.scopeName,
                embeddedLanguages: embeddedLanguages,
                tokenTypes: tokenTypes,
                injectTo: grammar.injectTo,
                balancedBracketSelectors: asStringArray(grammar.balancedBracketScopes, ['*']),
                unbalancedBracketSelectors: asStringArray(grammar.unbalancedBracketScopes, []),
                sourceExtensionId: extension.description.id,
            };
        }
        startDebugMode(printFn, onStop) {
            if (this._debugMode) {
                this._notificationService.error(nls.localize('alreadyDebugging', "Already Logging."));
                return;
            }
            this._debugModePrintFunc = printFn;
            this._debugMode = true;
            if (this._debugMode) {
                this._progressService.withProgress({
                    location: 15 /* ProgressLocation.Notification */,
                    buttons: [nls.localize('stop', "Stop")]
                }, (progress) => {
                    progress.report({
                        message: nls.localize('progress1', "Preparing to log TM Grammar parsing. Press Stop when finished.")
                    });
                    return this._getVSCodeOniguruma().then((vscodeOniguruma) => {
                        vscodeOniguruma.setDefaultDebugCall(true);
                        progress.report({
                            message: nls.localize('progress2', "Now logging TM Grammar parsing. Press Stop when finished.")
                        });
                        return new Promise((resolve, reject) => { });
                    });
                }, (choice) => {
                    this._getVSCodeOniguruma().then((vscodeOniguruma) => {
                        this._debugModePrintFunc = () => { };
                        this._debugMode = false;
                        vscodeOniguruma.setDefaultDebugCall(false);
                        onStop();
                    });
                });
            }
        }
        _canCreateGrammarFactory() {
            // Check if extension point is ready
            return !!this._grammarDefinitions;
        }
        async _getOrCreateGrammarFactory() {
            if (this._grammarFactory) {
                return this._grammarFactory;
            }
            const [vscodeTextmate, vscodeOniguruma] = await Promise.all([(0, amdX_1.importAMDNodeModule)('vscode-textmate', 'release/main.js'), this._getVSCodeOniguruma()]);
            const onigLib = Promise.resolve({
                createOnigScanner: (sources) => vscodeOniguruma.createOnigScanner(sources),
                createOnigString: (str) => vscodeOniguruma.createOnigString(str)
            });
            // Avoid duplicate instantiations
            if (this._grammarFactory) {
                return this._grammarFactory;
            }
            this._grammarFactory = new TMGrammarFactory_1.TMGrammarFactory({
                logTrace: (msg) => this._logService.trace(msg),
                logError: (msg, err) => this._logService.error(msg, err),
                readFile: (resource) => this._extensionResourceLoaderService.readExtensionResource(resource)
            }, this._grammarDefinitions || [], vscodeTextmate, onigLib);
            this._updateTheme(this._themeService.getColorTheme(), true);
            return this._grammarFactory;
        }
        async _createTokenizationSupport(languageId) {
            if (!this._languageService.isRegisteredLanguageId(languageId)) {
                return null;
            }
            if (!this._canCreateGrammarFactory()) {
                return null;
            }
            try {
                const grammarFactory = await this._getOrCreateGrammarFactory();
                if (!grammarFactory.has(languageId)) {
                    return null;
                }
                const encodedLanguageId = this._languageService.languageIdCodec.encodeLanguageId(languageId);
                const r = await grammarFactory.createGrammar(languageId, encodedLanguageId);
                if (!r.grammar) {
                    return null;
                }
                const maxTokenizationLineLength = observableConfigValue('editor.maxTokenizationLineLength', languageId, -1, this._configurationService);
                const tokenization = new textMateTokenizationSupport_1.TextMateTokenizationSupport(r.grammar, r.initialState, r.containsEmbeddedLanguages, (textModel, tokenStore) => this._threadedBackgroundTokenizerFactory.createBackgroundTokenizer(textModel, tokenStore, maxTokenizationLineLength), () => this.getAsyncTokenizationVerification(), (timeMs, lineLength, isRandomSample) => {
                    this._reportTokenizationTime(timeMs, languageId, r.sourceExtensionId, lineLength, false, isRandomSample);
                }, true);
                tokenization.onDidEncounterLanguage((encodedLanguageId) => {
                    if (!this._encounteredLanguages[encodedLanguageId]) {
                        const languageId = this._languageService.languageIdCodec.decodeLanguageId(encodedLanguageId);
                        this._encounteredLanguages[encodedLanguageId] = true;
                        this._languageService.requestBasicLanguageFeatures(languageId);
                    }
                });
                return new tokenizationSupportWithLineLimit_1.TokenizationSupportWithLineLimit(encodedLanguageId, tokenization, maxTokenizationLineLength);
            }
            catch (err) {
                if (err.message && err.message === TMGrammarFactory_1.missingTMGrammarErrorMessage) {
                    // Don't log this error message
                    return null;
                }
                (0, errors_1.onUnexpectedError)(err);
                return null;
            }
        }
        _updateTheme(colorTheme, forceUpdate) {
            if (!forceUpdate && this._currentTheme && this._currentTokenColorMap && equalsTokenRules(this._currentTheme.settings, colorTheme.tokenColors)
                && (0, arrays_1.equals)(this._currentTokenColorMap, colorTheme.tokenColorMap)) {
                return;
            }
            this._currentTheme = { name: colorTheme.label, settings: colorTheme.tokenColors };
            this._currentTokenColorMap = colorTheme.tokenColorMap;
            this._grammarFactory?.setTheme(this._currentTheme, this._currentTokenColorMap);
            const colorMap = toColorMap(this._currentTokenColorMap);
            const cssRules = (0, tokenization_1.generateTokensCSSForColorMap)(colorMap);
            this._styleElement.textContent = cssRules;
            languages_1.TokenizationRegistry.setColorMap(colorMap);
            if (this._currentTheme && this._currentTokenColorMap) {
                this._threadedBackgroundTokenizerFactory.acceptTheme(this._currentTheme, this._currentTokenColorMap);
            }
        }
        async createTokenizer(languageId) {
            if (!this._languageService.isRegisteredLanguageId(languageId)) {
                return null;
            }
            const grammarFactory = await this._getOrCreateGrammarFactory();
            if (!grammarFactory.has(languageId)) {
                return null;
            }
            const encodedLanguageId = this._languageService.languageIdCodec.encodeLanguageId(languageId);
            const { grammar } = await grammarFactory.createGrammar(languageId, encodedLanguageId);
            return grammar;
        }
        _getVSCodeOniguruma() {
            if (!this._vscodeOniguruma) {
                this._vscodeOniguruma = (async () => {
                    const [vscodeOniguruma, wasm] = await Promise.all([(0, amdX_1.importAMDNodeModule)('vscode-oniguruma', 'release/main.js'), this._loadVSCodeOnigurumaWASM()]);
                    await vscodeOniguruma.loadWASM({
                        data: wasm,
                        print: (str) => {
                            this._debugModePrintFunc(str);
                        }
                    });
                    return vscodeOniguruma;
                })();
            }
            return this._vscodeOniguruma;
        }
        async _loadVSCodeOnigurumaWASM() {
            if (platform_1.isWeb) {
                const response = await fetch(network_1.FileAccess.asBrowserUri('vscode-oniguruma/../onig.wasm').toString(true));
                // Using the response directly only works if the server sets the MIME type 'application/wasm'.
                // Otherwise, a TypeError is thrown when using the streaming compiler.
                // We therefore use the non-streaming compiler :(.
                return await response.arrayBuffer();
            }
            else {
                const response = await fetch(this._environmentService.isBuilt
                    ? network_1.FileAccess.asBrowserUri(`${network_1.nodeModulesAsarUnpackedPath}/vscode-oniguruma/release/onig.wasm`).toString(true)
                    : network_1.FileAccess.asBrowserUri(`${network_1.nodeModulesPath}/vscode-oniguruma/release/onig.wasm`).toString(true));
                return response;
            }
        }
        _reportTokenizationTime(timeMs, languageId, sourceExtensionId, lineLength, fromWorker, isRandomSample) {
            const key = fromWorker ? 'async' : 'sync';
            // 50 events per hour (one event has a low probability)
            if (TextMateTokenizationFeature_1.reportTokenizationTimeCounter[key] > 50) {
                // Don't flood telemetry with too many events
                return;
            }
            if (TextMateTokenizationFeature_1.reportTokenizationTimeCounter[key] === 0) {
                setTimeout(() => {
                    TextMateTokenizationFeature_1.reportTokenizationTimeCounter[key] = 0;
                }, 1000 * 60 * 60);
            }
            TextMateTokenizationFeature_1.reportTokenizationTimeCounter[key]++;
            this._telemetryService.publicLog2('editor.tokenizedLine', {
                timeMs,
                languageId,
                lineLength,
                fromWorker,
                sourceExtensionId,
                isRandomSample,
                tokenizationSetting: this.getAsyncTokenizationEnabled() ? (this.getAsyncTokenizationVerification() ? 2 : 1) : 0,
            });
        }
    };
    exports.TextMateTokenizationFeature = TextMateTokenizationFeature;
    exports.TextMateTokenizationFeature = TextMateTokenizationFeature = TextMateTokenizationFeature_1 = __decorate([
        __param(0, language_1.ILanguageService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(3, notification_1.INotificationService),
        __param(4, log_1.ILogService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, progress_1.IProgressService),
        __param(7, environmentService_1.IWorkbenchEnvironmentService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, telemetry_1.ITelemetryService)
    ], TextMateTokenizationFeature);
    function toColorMap(colorMap) {
        const result = [null];
        for (let i = 1, len = colorMap.length; i < len; i++) {
            result[i] = color_1.Color.fromHex(colorMap[i]);
        }
        return result;
    }
    function equalsTokenRules(a, b) {
        if (!b || !a || b.length !== a.length) {
            return false;
        }
        for (let i = b.length - 1; i >= 0; i--) {
            const r1 = b[i];
            const r2 = a[i];
            if (r1.scope !== r2.scope) {
                return false;
            }
            const s1 = r1.settings;
            const s2 = r2.settings;
            if (s1 && s2) {
                if (s1.fontStyle !== s2.fontStyle || s1.foreground !== s2.foreground || s1.background !== s2.background) {
                    return false;
                }
            }
            else if (!s1 || !s2) {
                return false;
            }
        }
        return true;
    }
    function validateGrammarExtensionPoint(extensionLocation, syntax, collector, _languageService) {
        if (syntax.language && ((typeof syntax.language !== 'string') || !_languageService.isRegisteredLanguageId(syntax.language))) {
            collector.error(nls.localize('invalid.language', "Unknown language in `contributes.{0}.language`. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, String(syntax.language)));
            return false;
        }
        if (!syntax.scopeName || (typeof syntax.scopeName !== 'string')) {
            collector.error(nls.localize('invalid.scopeName', "Expected string in `contributes.{0}.scopeName`. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, String(syntax.scopeName)));
            return false;
        }
        if (!syntax.path || (typeof syntax.path !== 'string')) {
            collector.error(nls.localize('invalid.path.0', "Expected string in `contributes.{0}.path`. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, String(syntax.path)));
            return false;
        }
        if (syntax.injectTo && (!Array.isArray(syntax.injectTo) || syntax.injectTo.some(scope => typeof scope !== 'string'))) {
            collector.error(nls.localize('invalid.injectTo', "Invalid value in `contributes.{0}.injectTo`. Must be an array of language scope names. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, JSON.stringify(syntax.injectTo)));
            return false;
        }
        if (syntax.embeddedLanguages && !types.isObject(syntax.embeddedLanguages)) {
            collector.error(nls.localize('invalid.embeddedLanguages', "Invalid value in `contributes.{0}.embeddedLanguages`. Must be an object map from scope name to language. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, JSON.stringify(syntax.embeddedLanguages)));
            return false;
        }
        if (syntax.tokenTypes && !types.isObject(syntax.tokenTypes)) {
            collector.error(nls.localize('invalid.tokenTypes', "Invalid value in `contributes.{0}.tokenTypes`. Must be an object map from scope name to token type. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, JSON.stringify(syntax.tokenTypes)));
            return false;
        }
        const grammarLocation = resources.joinPath(extensionLocation, syntax.path);
        if (!resources.isEqualOrParent(grammarLocation, extensionLocation)) {
            collector.warn(nls.localize('invalid.path.1', "Expected `contributes.{0}.path` ({1}) to be included inside extension's folder ({2}). This might make the extension non-portable.", TMGrammars_1.grammarsExtPoint.name, grammarLocation.path, extensionLocation.path));
        }
        return true;
    }
    function observableConfigValue(key, languageId, defaultValue, configurationService) {
        return (0, observable_1.observableFromEvent)((handleChange) => configurationService.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(key, { overrideIdentifier: languageId })) {
                handleChange(e);
            }
        }), () => configurationService.getValue(key, { overrideIdentifier: languageId }) ?? defaultValue);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1hdGVUb2tlbml6YXRpb25GZWF0dXJlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RleHRNYXRlL2Jyb3dzZXIvdGV4dE1hdGVUb2tlbml6YXRpb25GZWF0dXJlSW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0N6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHNCQUFVOztpQkFDM0Msa0NBQTZCLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQUFBeEIsQ0FBeUI7UUFxQnJFLFlBQ21CLGdCQUFtRCxFQUM3QyxhQUFzRCxFQUM3QywrQkFBaUYsRUFDNUYsb0JBQTJELEVBQ3BFLFdBQXlDLEVBQy9CLHFCQUE2RCxFQUNsRSxnQkFBbUQsRUFDdkMsbUJBQWtFLEVBQ3pFLHFCQUE2RCxFQUNqRSxpQkFBcUQ7WUFFeEUsS0FBSyxFQUFFLENBQUM7WUFYMkIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUM1QixrQkFBYSxHQUFiLGFBQWEsQ0FBd0I7WUFDNUIsb0NBQStCLEdBQS9CLCtCQUErQixDQUFpQztZQUMzRSx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQ25ELGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ2QsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUNqRCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ3RCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBOEI7WUFDeEQsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUNoRCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBM0J4RCxrQkFBYSxHQUFhLEVBQUUsQ0FBQztZQUM3QiwwQkFBcUIs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