/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/services/textMate/common/TMScopeRegistry"], function (require, exports, lifecycle_1, TMScopeRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TMGrammarFactory = exports.missingTMGrammarErrorMessage = void 0;
    exports.missingTMGrammarErrorMessage = 'No TM Grammar registered for this language.';
    class TMGrammarFactory extends lifecycle_1.Disposable {
        constructor(host, grammarDefinitions, vscodeTextmate, onigLib) {
            super();
            this._host = host;
            this._initialState = vscodeTextmate.INITIAL;
            this._scopeRegistry = new TMScopeRegistry_1.TMScopeRegistry();
            this._injections = {};
            this._injectedEmbeddedLanguages = {};
            this._languageToScope = new Map();
            this._grammarRegistry = this._register(new vscodeTextmate.Registry({
                onigLib: onigLib,
                loadGrammar: async (scopeName) => {
                    const grammarDefinition = this._scopeRegistry.getGrammarDefinition(scopeName);
                    if (!grammarDefinition) {
                        this._host.logTrace(`No grammar found for scope ${scopeName}`);
                        return null;
                    }
                    const location = grammarDefinition.location;
                    try {
                        const content = await this._host.readFile(location);
                        return vscodeTextmate.parseRawGrammar(content, location.path);
                    }
                    catch (e) {
                        this._host.logError(`Unable to load and parse grammar for scope ${scopeName} from ${location}`, e);
                        return null;
                    }
                },
                getInjections: (scopeName) => {
                    const scopeParts = scopeName.split('.');
                    let injections = [];
                    for (let i = 1; i <= scopeParts.length; i++) {
                        const subScopeName = scopeParts.slice(0, i).join('.');
                        injections = [...injections, ...(this._injections[subScopeName] || [])];
                    }
                    return injections;
                }
            }));
            for (const validGrammar of grammarDefinitions) {
                this._scopeRegistry.register(validGrammar);
                if (validGrammar.injectTo) {
                    for (const injectScope of validGrammar.injectTo) {
                        let injections = this._injections[injectScope];
                        if (!injections) {
                            this._injections[injectScope] = injections = [];
                        }
                        injections.push(validGrammar.scopeName);
                    }
                    if (validGrammar.embeddedLanguages) {
                        for (const injectScope of validGrammar.injectTo) {
                            let injectedEmbeddedLanguages = this._injectedEmbeddedLanguages[injectScope];
                            if (!injectedEmbeddedLanguages) {
                                this._injectedEmbeddedLanguages[injectScope] = injectedEmbeddedLanguages = [];
                            }
                            injectedEmbeddedLanguages.push(validGrammar.embeddedLanguages);
                        }
                    }
                }
                if (validGrammar.language) {
                    this._languageToScope.set(validGrammar.language, validGrammar.scopeName);
                }
            }
        }
        has(languageId) {
            return this._languageToScope.has(languageId);
        }
        setTheme(theme, colorMap) {
            this._grammarRegistry.setTheme(theme, colorMap);
        }
        getColorMap() {
            return this._grammarRegistry.getColorMap();
        }
        async createGrammar(languageId, encodedLanguageId) {
            const scopeName = this._languageToScope.get(languageId);
            if (typeof scopeName !== 'string') {
                // No TM grammar defined
                throw new Error(exports.missingTMGrammarErrorMessage);
            }
            const grammarDefinition = this._scopeRegistry.getGrammarDefinition(scopeName);
            if (!grammarDefinition) {
                // No TM grammar defined
                throw new Error(exports.missingTMGrammarErrorMessage);
            }
            const embeddedLanguages = grammarDefinition.embeddedLanguages;
            if (this._injectedEmbeddedLanguages[scopeName]) {
                const injectedEmbeddedLanguages = this._injectedEmbeddedLanguages[scopeName];
                for (const injected of injectedEmbeddedLanguages) {
                    for (const scope of Object.keys(injected)) {
                        embeddedLanguages[scope] = injected[scope];
                    }
                }
            }
            const containsEmbeddedLanguages = (Object.keys(embeddedLanguages).length > 0);
            let grammar;
            try {
                grammar = await this._grammarRegistry.loadGrammarWithConfiguration(scopeName, encodedLanguageId, {
                    embeddedLanguages,
                    tokenTypes: grammarDefinition.tokenTypes,
                    balancedBracketSelectors: grammarDefinition.balancedBracketSelectors,
                    unbalancedBracketSelectors: grammarDefinition.unbalancedBracketSelectors,
                });
            }
            catch (err) {
                if (err.message && err.message.startsWith('No grammar provided for')) {
                    // No TM grammar defined
                    throw new Error(exports.missingTMGrammarErrorMessage);
                }
                throw err;
            }
            return {
                languageId: languageId,
                grammar: grammar,
                initialState: this._initialState,
                containsEmbeddedLanguages: containsEmbeddedLanguages,
                sourceExtensionId: grammarDefinition.sourceExtensionId,
            };
        }
    }
    exports.TMGrammarFactory = TMGrammarFactory;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVE1HcmFtbWFyRmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RleHRNYXRlL2NvbW1vbi9UTUdyYW1tYXJGYWN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFCbkYsUUFBQSw0QkFBNEIsR0FBRyw2Q0FBNkMsQ0FBQztJQUUxRixNQUFhLGdCQUFpQixTQUFRLHNCQUFVO1FBVS9DLFlBQVksSUFBMkIsRUFBRSxrQkFBNkMsRUFBRSxjQUFnRCxFQUFFLE9BQTBCO1lBQ25LLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDO1lBQzVDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxpQ0FBZSxFQUFFLENBQUM7WUFDNUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLDBCQUEwQixHQUFHLEVBQUUsQ0FBQztZQUNyQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7WUFDbEQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxjQUFjLENBQUMsUUFBUSxDQUFDO2dCQUNsRSxPQUFPLEVBQUUsT0FBTztnQkFDaEIsV0FBVyxFQUFFLEtBQUssRUFBRSxTQUFpQixFQUFFLEVBQUU7b0JBQ3hDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDOUUsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7d0JBQ3hCLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLDhCQUE4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