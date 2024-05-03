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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/core/wordHelper", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/languages/supports", "vs/editor/common/languages/supports/characterPair", "vs/editor/common/languages/supports/electricCharacter", "vs/editor/common/languages/supports/indentRules", "vs/editor/common/languages/supports/onEnter", "vs/editor/common/languages/supports/richEditBrackets", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/editor/common/languages/language", "vs/platform/instantiation/common/extensions", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/supports/languageBracketsConfiguration"], function (require, exports, event_1, lifecycle_1, strings, wordHelper_1, languageConfiguration_1, supports_1, characterPair_1, electricCharacter_1, indentRules_1, onEnter_1, richEditBrackets_1, instantiation_1, configuration_1, language_1, extensions_1, modesRegistry_1, languageBracketsConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResolvedLanguageConfiguration = exports.LanguageConfigurationRegistry = exports.LanguageConfigurationChangeEvent = exports.LanguageConfigurationService = exports.ILanguageConfigurationService = exports.LanguageConfigurationServiceChangeEvent = void 0;
    exports.getIndentationAtPosition = getIndentationAtPosition;
    exports.getScopedLineTokens = getScopedLineTokens;
    class LanguageConfigurationServiceChangeEvent {
        constructor(languageId) {
            this.languageId = languageId;
        }
        affects(languageId) {
            return !this.languageId ? true : this.languageId === languageId;
        }
    }
    exports.LanguageConfigurationServiceChangeEvent = LanguageConfigurationServiceChangeEvent;
    exports.ILanguageConfigurationService = (0, instantiation_1.createDecorator)('languageConfigurationService');
    let LanguageConfigurationService = class LanguageConfigurationService extends lifecycle_1.Disposable {
        constructor(configurationService, languageService) {
            super();
            this.configurationService = configurationService;
            this.languageService = languageService;
            this._registry = this._register(new LanguageConfigurationRegistry());
            this.onDidChangeEmitter = this._register(new event_1.Emitter());
            this.onDidChange = this.onDidChangeEmitter.event;
            this.configurations = new Map();
            const languageConfigKeys = new Set(Object.values(customizedLanguageConfigKeys));
            this._register(this.configurationService.onDidChangeConfiguration((e) => {
                const globalConfigChanged = e.change.keys.some((k) => languageConfigKeys.has(k));
                const localConfigChanged = e.change.overrides
                    .filter(([overrideLangName, keys]) => keys.some((k) => languageConfigKeys.has(k)))
                    .map(([overrideLangName]) => overrideLangName);
                if (globalConfigChanged) {
                    this.configurations.clear();
                    this.onDidChangeEmitter.fire(new LanguageConfigurationServiceChangeEvent(undefined));
                }
                else {
                    for (const languageId of localConfigChanged) {
                        if (this.languageService.isRegisteredLanguageId(languageId)) {
                            this.configurations.delete(languageId);
                            this.onDidChangeEmitter.fire(new LanguageConfigurationServiceChangeEvent(languageId));
                        }
                    }
                }
            }));
            this._register(this._registry.onDidChange((e) => {
                this.configurations.delete(e.languageId);
                this.onDidChangeEmitter.fire(new LanguageConfigurationServiceChangeEvent(e.languageId));
            }));
        }
        register(languageId, configuration, priority) {
            return this._registry.register(languageId, configuration, priority);
        }
        getLanguageConfiguration(languageId) {
            let result = this.configurations.get(languageId);
            if (!result) {
                result = computeConfig(languageId, this._registry, this.configurationService, this.languageService);
                this.configurations.set(languageId, result);
            }
            return result;
        }
    };
    exports.LanguageConfigurationService = LanguageConfigurationService;
    exports.LanguageConfigurationService = LanguageConfigurationService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, language_1.ILanguageService)
    ], LanguageConfigurationService);
    function computeConfig(languageId, registry, configurationService, languageService) {
        let languageConfig = registry.getLanguageConfiguration(languageId);
        if (!languageConfig) {
            if (!languageService.isRegisteredLanguageId(languageId)) {
                // this happens for the null language, which can be returned by monarch.
                // Instead of throwing an error, we just return a default config.
                return new ResolvedLanguageConfiguration(languageId, {});
            }
            languageConfig = new ResolvedLanguageConfiguration(languageId, {});
        }
        const customizedConfig = getCustomizedLanguageConfig(languageConfig.languageId, configurationService);
        const data = combineLanguageConfigurations([languageConfig.underlyingConfig, customizedConfig]);
        const config = new ResolvedLanguageConfiguration(languageConfig.languageId, data);
        return config;
    }
    const customizedLanguageConfigKeys = {
        brackets: 'editor.language.brackets',
        colorizedBracketPairs: 'editor.language.colorizedBracketPairs'
    };
    function getCustomizedLanguageConfig(languageId, configurationService) {
        const brackets = configurationService.getValue(customizedLanguageConfigKeys.brackets, {
            overrideIdentifier: languageId,
        });
        const colorizedBracketPairs = configurationService.getValue(customizedLanguageConfigKeys.colorizedBracketPairs, {
            overrideIdentifier: languageId,
        });
        return {
            brackets: validateBracketPairs(brackets),
            colorizedBracketPairs: validateBracketPairs(colorizedBracketPairs),
        };
    }
    function validateBracketPairs(data) {
        if (!Array.isArray(data)) {
            return undefined;
        }
        return data.map(pair => {
            if (!Array.isArray(pair) || pair.length !== 2) {
                return undefined;
            }
            return [pair[0], pair[1]];
        }).filter((p) => !!p);
    }
    function getIndentationAtPosition(model, lineNumber, column) {
        const lineText = model.getLineContent(lineNumber);
        let indentation = strings.getLeadingWhitespace(lineText);
        if (indentation.length > column - 1) {
            indentation = indentation.substring(0, column - 1);
        }
        return indentation;
    }
    function getScopedLineTokens(model, lineNumber, columnNumber) {
        model.tokenization.forceTokenization(lineNumber);
        const lineTokens = model.tokenization.getLineTokens(lineNumber);
        const column = (typeof columnNumber === 'undefined' ? model.getLineMaxColumn(lineNumber) - 1 : columnNumber - 1);
        return (0, supports_1.createScopedLineTokens)(lineTokens, column);
    }
    class ComposedLanguageConfiguration {
        constructor(languageId) {
            this.languageId = languageId;
            this._resolved = null;
            this._entries = [];
            this._order = 0;
            this._resolved = null;
        }
        register(configuration, priority) {
            const entry = new LanguageConfigurationContribution(configuration, priority, ++this._order);
            this._entries.push(entry);
            this._resolved = null;
            return (0, lifecycle_1.toDisposable)(() => {
                for (let i = 0; i < this._entries.length; i++) {
                    if (this._entries[i] === entry) {
                        this._entries.splice(i, 1);
                        this._resolved = null;
                        break;
                    }
                }
            });
        }
        getResolvedConfiguration() {
            if (!this._resolved) {
                const config = this._resolve();
                if (config) {
                    this._resolved = new ResolvedLanguageConfiguration(this.languageId, config);
                }
            }
            return this._resolved;
        }
        _resolve() {
            if (this._entries.length === 0) {
                return null;
            }
            this._entries.sort(LanguageConfigurationContribution.cmp);
            return combineLanguageConfigurations(this._entries.map(e => e.configuration));
        }
    }
    function combineLanguageConfigurations(configs) {
        let result = {
            comments: undefined,
            brackets: undefined,
            wordPattern: undefined,
            indentationRules: undefined,
            onEnterRules: undefined,
            autoClosingPairs: undefined,
            surroundingPairs: undefined,
            autoCloseBefore: undefined,
            folding: undefined,
            colorizedBracketPairs: undefined,
            __electricCharacterSupport: undefined,
        };
        for (const entry of configs) {
            result = {
                comments: entry.comments || result.comments,
                brackets: entry.brackets || result.brackets,
                wordPattern: entry.wordPattern || result.wordPattern,
                indentationRules: entry.indentationRules || result.indentationRules,
                onEnterRules: entry.onEnterRules || result.onEnterRules,
                autoClosingPairs: entry.autoClosingPairs || result.autoClosingPairs,
                surroundingPairs: entry.surroundingPairs || result.surroundingPairs,
                autoCloseBefore: entry.autoCloseBefore || result.autoCloseBefore,
                folding: entry.folding || result.folding,
                colorizedBracketPairs: entry.colorizedBracketPairs || result.colorizedBracketPairs,
                __electricCharacterSupport: entry.__electricCharacterSupport || result.__electricCharacterSupport,
            };
        }
        return result;
    }
    class LanguageConfigurationContribution {
        constructor(configuration, priority, order) {
            this.configuration = configuration;
            this.priority = priority;
            this.order = order;
        }
        static cmp(a, b) {
            if (a.priority === b.priority) {
                // higher order last
                return a.order - b.order;
            }
            // higher priority last
            return a.priority - b.priority;
        }
    }
    class LanguageConfigurationChangeEvent {
        constructor(languageId) {
            this.languageId = languageId;
        }
    }
    exports.LanguageConfigurationChangeEvent = LanguageConfigurationChangeEvent;
    class LanguageConfigurationRegistry extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._entries = new Map();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(this.register(modesRegistry_1.PLAINTEXT_LANGUAGE_ID, {
                brackets: [
                    ['(', ')'],
                    ['[', ']'],
                    ['{', '}'],
                ],
                surroundingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '<', close: '>' },
                    { open: '\"', close: '\"' },
                    { open: '\'', close: '\'' },
                    { open: '`', close: '`' },
                ],
                colorizedBracketPairs: [],
                folding: {
                    offSide: true
                }
            }, 0));
        }
        /**
         * @param priority Use a higher number for higher priority
         */
        register(languageId, configuration, priority = 0) {
            let entries = this._entries.get(languageId);
            if (!entries) {
                entries = new ComposedLanguageConfiguration(languageId);
                this._entries.set(languageId, entries);
            }
            const disposable = entries.register(configuration, priority);
            this._onDidChange.fire(new LanguageConfigurationChangeEvent(languageId));
            return (0, lifecycle_1.toDisposable)(() => {
                disposable.dispose();
                this._onDidChange.fire(new LanguageConfigurationChangeEvent(languageId));
            });
        }
        getLanguageConfiguration(languageId) {
            const entries = this._entries.get(languageId);
            return entries?.getResolvedConfiguration() || null;
        }
    }
    exports.LanguageConfigurationRegistry = LanguageConfigurationRegistry;
    /**
     * Immutable.
    */
    class ResolvedLanguageConfiguration {
        constructor(languageId, underlyingConfig) {
            this.languageId = languageId;
            this.underlyingConfig = underlyingConfig;
            this._brackets = null;
            this._electricCharacter = null;
            this._onEnterSupport =
                this.underlyingConfig.brackets ||
                    this.underlyingConfig.indentationRules ||
                    this.underlyingConfig.onEnterRules
                    ? new onEnter_1.OnEnterSupport(this.underlyingConfig)
                    : null;
            this.comments = ResolvedLanguageConfiguration._handleComments(this.underlyingConfig);
            this.characterPair = new characterPair_1.CharacterPairSupport(this.underlyingConfig);
            this.wordDefinition = this.underlyingConfig.wordPattern || wordHelper_1.DEFAULT_WORD_REGEXP;
            this.indentationRules = this.underlyingConfig.indentationRules;
            if (this.underlyingConfig.indentationRules) {
                this.indentRulesSupport = new indentRules_1.IndentRulesSupport(this.underlyingConfig.indentationRules);
            }
            else {
                this.indentRulesSupport = null;
            }
            this.foldingRules = this.underlyingConfig.folding || {};
            this.bracketsNew = new languageBracketsConfiguration_1.LanguageBracketsConfiguration(languageId, this.underlyingConfig);
        }
        getWordDefinition() {
            return (0, wordHelper_1.ensureValidWordDefinition)(this.wordDefinition);
        }
        get brackets() {
            if (!this._brackets && this.underlyingConfig.brackets) {
                this._brackets = new richEditBrackets_1.RichEditBrackets(this.languageId, this.underlyingConfig.brackets);
            }
            return this._brackets;
        }
        get electricCharacter() {
            if (!this._electricCharacter) {
                this._electricCharacter = new electricCharacter_1.BracketElectricCharacterSupport(this.brackets);
            }
            return this._electricCharacter;
        }
        onEnter(autoIndent, previousLineText, beforeEnterText, afterEnterText) {
            if (!this._onEnterSupport) {
                return null;
            }
            return this._onEnterSupport.onEnter(autoIndent, previousLineText, beforeEnterText, afterEnterText);
        }
        getAutoClosingPairs() {
            return new languageConfiguration_1.AutoClosingPairs(this.characterPair.getAutoClosingPairs());
        }
        getAutoCloseBeforeSet(forQuotes) {
            return this.characterPair.getAutoCloseBeforeSet(forQuotes);
        }
        getSurroundingPairs() {
            return this.characterPair.getSurroundingPairs();
        }
        static _handleComments(conf) {
            const commentRule = conf.comments;
            if (!commentRule) {
                return null;
            }
            // comment configuration
            const comments = {};
            if (commentRule.lineComment) {
                comments.lineCommentToken = commentRule.lineComment;
            }
            if (commentRule.blockComment) {
                const [blockStart, blockEnd] = commentRule.blockComment;
                comments.blockCommentStartToken = blockStart;
                comments.blockCommentEndToken = blockEnd;
            }
            return comments;
        }
    }
    exports.ResolvedLanguageConfiguration = ResolvedLanguageConfiguration;
    (0, extensions_1.registerSingleton)(exports.ILanguageConfigurationService, LanguageConfigurationService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VDb25maWd1cmF0aW9uUmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbGFuZ3VhZ2VzL2xhbmd1YWdlQ29uZmlndXJhdGlvblJlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJLaEcsNERBT0M7SUFFRCxrREFLQztJQTVJRCxNQUFhLHVDQUF1QztRQUNuRCxZQUE0QixVQUE4QjtZQUE5QixlQUFVLEdBQVYsVUFBVSxDQUFvQjtRQUFJLENBQUM7UUFFeEQsT0FBTyxDQUFDLFVBQWtCO1lBQ2hDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssVUFBVSxDQUFDO1FBQ2pFLENBQUM7S0FDRDtJQU5ELDBGQU1DO0lBRVksUUFBQSw2QkFBNkIsR0FBRyxJQUFBLCtCQUFlLEVBQWdDLDhCQUE4QixDQUFDLENBQUM7SUFFckgsSUFBTSw0QkFBNEIsR0FBbEMsTUFBTSw0QkFBNkIsU0FBUSxzQkFBVTtRQVUzRCxZQUN3QixvQkFBNEQsRUFDakUsZUFBa0Q7WUFFcEUsS0FBSyxFQUFFLENBQUM7WUFIZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNoRCxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFUcEQsY0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBNkIsRUFBRSxDQUFDLENBQUM7WUFFaEUsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBMkMsQ0FBQyxDQUFDO1lBQzdGLGdCQUFXLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztZQUUzQyxtQkFBYyxHQUFH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