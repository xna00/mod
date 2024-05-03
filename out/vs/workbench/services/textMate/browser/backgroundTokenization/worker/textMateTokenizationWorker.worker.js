/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/services/textMate/common/TMGrammarFactory", "./textMateWorkerTokenizer"], function (require, exports, uri_1, TMGrammarFactory_1, textMateWorkerTokenizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextMateTokenizationWorker = void 0;
    exports.create = create;
    /**
     * Defines the worker entry point. Must be exported and named `create`.
     */
    function create(ctx, createData) {
        return new TextMateTokenizationWorker(ctx, createData);
    }
    class TextMateTokenizationWorker {
        constructor(ctx, _createData) {
            this._createData = _createData;
            this._models = new Map();
            this._grammarCache = [];
            this._host = ctx.host;
            const grammarDefinitions = _createData.grammarDefinitions.map((def) => {
                return {
                    location: uri_1.URI.revive(def.location),
                    language: def.language,
                    scopeName: def.scopeName,
                    embeddedLanguages: def.embeddedLanguages,
                    tokenTypes: def.tokenTypes,
                    injectTo: def.injectTo,
                    balancedBracketSelectors: def.balancedBracketSelectors,
                    unbalancedBracketSelectors: def.unbalancedBracketSelectors,
                    sourceExtensionId: def.sourceExtensionId,
                };
            });
            this._grammarFactory = this._loadTMGrammarFactory(grammarDefinitions);
        }
        async _loadTMGrammarFactory(grammarDefinitions) {
            const uri = this._createData.textmateMainUri;
            const vscodeTextmate = await new Promise((resolve_1, reject_1) => { require([uri], resolve_1, reject_1); });
            const vscodeOniguruma = await new Promise((resolve_2, reject_2) => { require([this._createData.onigurumaMainUri], resolve_2, reject_2); });
            const response = await fetch(this._createData.onigurumaWASMUri);
            // Using the response directly only works if the server sets the MIME type 'application/wasm'.
            // Otherwise, a TypeError is thrown when using the streaming compiler.
            // We therefore use the non-streaming compiler :(.
            const bytes = await response.arrayBuffer();
            await vscodeOniguruma.loadWASM(bytes);
            const onigLib = Promise.resolve({
                createOnigScanner: (sources) => vscodeOniguruma.createOnigScanner(sources),
                createOnigString: (str) => vscodeOniguruma.createOnigString(str)
            });
            return new TMGrammarFactory_1.TMGrammarFactory({
                logTrace: (msg) => { },
                logError: (msg, err) => console.error(msg, err),
                readFile: (resource) => this._host.readFile(resource)
            }, grammarDefinitions, vscodeTextmate, onigLib);
        }
        // These methods are called by the renderer
        acceptNewModel(data) {
            const uri = uri_1.URI.revive(data.uri);
            const that = this;
            this._models.set(data.controllerId, new textMateWorkerTokenizer_1.TextMateWorkerTokenizer(uri, data.lines, data.EOL, data.versionId, {
                async getOrCreateGrammar(languageId, encodedLanguageId) {
                    const grammarFactory = await that._grammarFactory;
                    if (!grammarFactory) {
                        return Promise.resolve(null);
                    }
                    if (!that._grammarCache[encodedLanguageId]) {
                        that._grammarCache[encodedLanguageId] = grammarFactory.createGrammar(languageId, encodedLanguageId);
                    }
                    return that._grammarCache[encodedLanguageId];
                },
                setTokensAndStates(versionId, tokens, stateDeltas) {
                    that._host.setTokensAndStates(data.controllerId, versionId, tokens, stateDeltas);
                },
                reportTokenizationTime(timeMs, languageId, sourceExtensionId, lineLength, isRandomSample) {
                    that._host.reportTokenizationTime(timeMs, languageId, sourceExtensionId, lineLength, isRandomSample);
                },
            }, data.languageId, data.encodedLanguageId, data.maxTokenizationLineLength));
        }
        acceptModelChanged(controllerId, e) {
            this._models.get(controllerId).onEvents(e);
        }
        retokenize(controllerId, startLineNumber, endLineNumberExclusive) {
            this._models.get(controllerId).retokenize(startLineNumber, endLineNumberExclusive);
        }
        acceptModelLanguageChanged(controllerId, newLanguageId, newEncodedLanguageId) {
            this._models.get(controllerId).onLanguageId(newLanguageId, newEncodedLanguageId);
        }
        acceptRemovedModel(controllerId) {
            const model = this._models.get(controllerId);
            if (model) {
                model.dispose();
                this._models.delete(controllerId);
            }
        }
        async acceptTheme(theme, colorMap) {
            const grammarFactory = await this._grammarFactory;
            grammarFactory?.setTheme(theme, colorMap);
        }
        acceptMaxTokenizationLineLength(controllerId, value) {
            this._models.get(controllerId).acceptMaxTokenizationLineLength(value);
        }
    }
    exports.TextMateTokenizationWorker = TextMateTokenizationWorker;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1hdGVUb2tlbml6YXRpb25Xb3JrZXIud29ya2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dE1hdGUvYnJvd3Nlci9iYWNrZ3JvdW5kVG9rZW5pemF0aW9uL3dvcmtlci90ZXh0TWF0ZVRva2VuaXphdGlvbldvcmtlci53b3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLHdCQUVDO0lBTEQ7O09BRUc7SUFDSCxTQUFnQixNQUFNLENBQUMsR0FBd0MsRUFBRSxVQUF1QjtRQUN2RixPQUFPLElBQUksMEJBQTBCLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFpQ0QsTUFBYSwwQkFBMEI7UUFNdEMsWUFDQyxHQUF3QyxFQUN2QixXQUF3QjtZQUF4QixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQU56QixZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQXNELENBQUM7WUFDeEUsa0JBQWEsR0FBb0MsRUFBRSxDQUFDO1lBT3BFLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztZQUN0QixNQUFNLGtCQUFrQixHQUFHLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQTBCLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQzlGLE9BQU87b0JBQ04sUUFBUSxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztvQkFDbEMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxRQUFRO29CQUN0QixTQUFTLEVBQUUsR0FBRyxDQUFDLFNBQVM7b0JBQ3hCLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxpQkFBaUI7b0JBQ3hDLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVTtvQkFDMUIsUUFBUSxFQUFFLEdBQUcs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