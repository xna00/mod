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
define(["require", "exports", "vs/nls", "vs/base/common/json", "vs/base/common/types", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/language", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform", "vs/workbench/services/extensions/common/extensions", "vs/base/common/jsonErrorMessages", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/base/common/hash", "vs/base/common/lifecycle"], function (require, exports, nls, json_1, types, languageConfiguration_1, languageConfigurationRegistry_1, language_1, jsonContributionRegistry_1, platform_1, extensions_1, jsonErrorMessages_1, extensionResourceLoader_1, hash_1, lifecycle_1) {
    "use strict";
    var LanguageConfigurationFileHandler_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageConfigurationFileHandler = void 0;
    function isStringArr(something) {
        if (!Array.isArray(something)) {
            return false;
        }
        for (let i = 0, len = something.length; i < len; i++) {
            if (typeof something[i] !== 'string') {
                return false;
            }
        }
        return true;
    }
    function isCharacterPair(something) {
        return (isStringArr(something)
            && something.length === 2);
    }
    let LanguageConfigurationFileHandler = LanguageConfigurationFileHandler_1 = class LanguageConfigurationFileHandler extends lifecycle_1.Disposable {
        constructor(_languageService, _extensionResourceLoaderService, _extensionService, _languageConfigurationService) {
            super();
            this._languageService = _languageService;
            this._extensionResourceLoaderService = _extensionResourceLoaderService;
            this._extensionService = _extensionService;
            this._languageConfigurationService = _languageConfigurationService;
            /**
             * A map from language id to a hash computed from the config files locations.
             */
            this._done = new Map();
            this._register(this._languageService.onDidRequestBasicLanguageFeatures(async (languageIdentifier) => {
                // Modes can be instantiated before the extension points have finished registering
                this._extensionService.whenInstalledExtensionsRegistered().then(() => {
                    this._loadConfigurationsForMode(languageIdentifier);
                });
            }));
            this._register(this._languageService.onDidChange(() => {
                // reload language configurations as necessary
                for (const [languageId] of this._done) {
                    this._loadConfigurationsForMode(languageId);
                }
            }));
        }
        async _loadConfigurationsForMode(languageId) {
            const configurationFiles = this._languageService.getConfigurationFiles(languageId);
            const configurationHash = (0, hash_1.hash)(configurationFiles.map(uri => uri.toString()));
            if (this._done.get(languageId) === configurationHash) {
                return;
            }
            this._done.set(languageId, configurationHash);
            const configs = await Promise.all(configurationFiles.map(configFile => this._readConfigFile(configFile)));
            for (const config of configs) {
                this._handleConfig(languageId, config);
            }
        }
        async _readConfigFile(configFileLocation) {
            try {
                const contents = await this._extensionResourceLoaderService.readExtensionResource(configFileLocation);
                const errors = [];
                let configuration = (0, json_1.parse)(contents, errors);
                if (errors.length) {
                    console.error(nls.localize('parseErrors', "Errors parsing {0}: {1}", configFileLocation.toString(), errors.map(e => (`[${e.offset}, ${e.length}] ${(0, jsonErrorMessages_1.getParseErrorMessage)(e.error)}`)).join('\n')));
                }
                if ((0, json_1.getNodeType)(configuration) !== 'object') {
                    console.error(nls.localize('formatError', "{0}: Invalid format, JSON object expected.", configFileLocation.toString()));
                    configuration = {};
                }
                return configuration;
            }
            catch (err) {
                console.error(err);
                return {};
            }
        }
        static _extractValidCommentRule(languageId, configuration) {
            const source = configuration.comments;
            if (typeof source === 'undefined') {
                return undefined;
            }
            if (!types.isObject(source)) {
                console.warn(`[${languageId}]: language configuration: expected \`comments\` to be an object.`);
                return undefined;
            }
            let result = undefined;
            if (typeof source.lineComment !== 'undefined') {
                if (typeof source.lineComment !== 'string') {
                    console.warn(`[${languageId}]: language configuration: expected \`comments.lineComment\` to be a string.`);
                }
                else {
                    result = result || {};
                    result.lineComment = source.lineComment;
                }
            }
            if (typeof source.blockComment !== 'undefined') {
                if (!isCharacterPair(source.blockComment)) {
                    console.warn(`[${languageId}]: language configuration: expected \`comments.blockComment\` to be an array of two strings.`);
                }
                else {
                    result = result || {};
                    result.blockComment = source.blockComment;
                }
            }
            return result;
        }
        static _extractValidBrackets(languageId, configuration) {
            const source = configuration.brackets;
            if (typeof source === 'undefined') {
                return undefined;
            }
            if (!Array.isArray(source)) {
                console.warn(`[${languageId}]: language configuration: expected \`brackets\` to be an array.`);
                return undefined;
            }
            let result = undefined;
            for (let i = 0, len = source.length; i < len; i++) {
                const pair = source[i];
                if (!isCharacterPair(pair)) {
                    console.warn(`[${languageId}]: language configuration: expected \`brackets[${i}]\` to be an array of two strings.`);
                    continue;
                }
                result = result || [];
                result.push(pair);
            }
            return result;
        }
        static _extractValidAutoClosingPairs(languageId, configuration) {
            const source = configuration.autoClosingPairs;
            if (typeof source === 'undefined') {
                return undefined;
            }
            if (!Array.isArray(source)) {
                console.warn(`[${languageId}]: language configuration: expected \`autoClosingPairs\` to be an array.`);
                return undefined;
            }
            let result = undefined;
            for (let i = 0, len = source.length; i < len; i++) {
                const pair = source[i];
                if (Array.isArray(pair)) {
                    if (!isCharacterPair(pair)) {
                        console.warn(`[${languageId}]: language configuration: expected \`autoClosingPairs[${i}]\` to be an array of two strings or an object.`);
                        continue;
                    }
                    result = result || [];
                    result.push({ open: pair[0], close: pair[1] });
                }
                else {
                    if (!types.isObject(pair)) {
                        console.warn(`[${languageId}]: language configuration: expected \`autoClosingPairs[${i}]\` to be an array of two strings or an object.`);
                        continue;
                    }
                    if (typeof pair.open !== 'string') {
                        console.warn(`[${languageId}]: language configuration: expected \`autoClosingPairs[${i}].open\` to be a string.`);
                        continue;
                    }
                    if (typeof pair.close !== 'string') {
                        console.warn(`[${languageId}]: language configuration: expected \`autoClosingPairs[${i}].close\` to be a string.`);
                        continue;
                    }
                    if (typeof pair.notIn !== 'undefined') {
                        if (!isStringArr(pair.notIn)) {
                            console.warn(`[${languageId}]: language configuration: expected \`autoClosingPairs[${i}].notIn\` to be a string array.`);
                            continue;
                        }
                    }
                    result = result || [];
                    result.push({ open: pair.open, close: pair.close, notIn: pair.notIn });
                }
            }
            return result;
        }
        static _extractValidSurroundingPairs(languageId, configuration) {
            const source = configuration.surroundingPairs;
            if (typeof source === 'undefined') {
                return undefined;
            }
            if (!Array.isArray(source)) {
                console.warn(`[${languageId}]: language configuration: expected \`surroundingPairs\` to be an array.`);
                return undefined;
            }
            let result = undefined;
            for (let i = 0, len = source.length; i < len; i++) {
                const pair = source[i];
                if (Array.isArray(pair)) {
                    if (!isCharacterPair(pair)) {
                        console.warn(`[${languageId}]: language configuration: expected \`surroundingPairs[${i}]\` to be an array of two strings or an object.`);
                        continue;
                    }
                    result = result || [];
                    result.push({ open: pair[0], close: pair[1] });
                }
                else {
                    if (!types.isObject(pair)) {
                        console.warn(`[${languageId}]: language configuration: expected \`surroundingPairs[${i}]\` to be an array of two strings or an object.`);
                        continue;
                    }
                    if (typeof pair.open !== 'string') {
                        console.warn(`[${languageId}]: language configuration: expected \`surroundingPairs[${i}].open\` to be a string.`);
                        continue;
                    }
                    if (typeof pair.close !== 'string') {
                        console.warn(`[${languageId}]: language configuration: expected \`surroundingPairs[${i}].close\` to be a string.`);
                        continue;
                    }
                    result = result || [];
                    result.push({ open: pair.open, close: pair.close });
                }
            }
            return result;
        }
        static _extractValidColorizedBracketPairs(languageId, configuration) {
            const source = configuration.colorizedBracketPairs;
            if (typeof source === 'undefined') {
                return undefined;
            }
            if (!Array.isArray(source)) {
                console.warn(`[${languageId}]: language configuration: expected \`colorizedBracketPairs\` to be an array.`);
                return undefined;
            }
            const result = [];
            for (let i = 0, len = source.length; i < len; i++) {
                const pair = source[i];
                if (!isCharacterPair(pair)) {
                    console.warn(`[${languageId}]: language configuration: expected \`colorizedBracketPairs[${i}]\` to be an array of two strings.`);
                    continue;
                }
                result.push([pair[0], pair[1]]);
            }
            return result;
        }
        static _extractValidOnEnterRules(languageId, configuration) {
            const source = configuration.onEnterRules;
            if (typeof source === 'undefined') {
                return undefined;
            }
            if (!Array.isArray(source)) {
                console.warn(`[${languageId}]: language configuration: expected \`onEnterRules\` to be an array.`);
                return undefined;
            }
            let result = undefined;
            for (let i = 0, len = source.length; i < len; i++) {
                const onEnterRule = source[i];
                if (!types.isObject(onEnterRule)) {
                    console.warn(`[${languageId}]: language configuration: expected \`onEnterRules[${i}]\` to be an object.`);
                    continue;
                }
                if (!types.isObject(onEnterRule.action)) {
                    console.warn(`[${languageId}]: language configuration: expected \`onEnterRules[${i}].action\` to be an object.`);
                    continue;
                }
                let indentAction;
                if (onEnterRule.action.indent === 'none') {
                    indentAction = languageConfiguration_1.IndentAction.None;
                }
                else if (onEnterRule.action.indent === 'indent') {
                    indentAction = languageConfiguration_1.IndentAction.Indent;
                }
                else if (onEnterRule.action.indent === 'indentOutdent') {
                    indentAction = languageConfiguration_1.IndentAction.IndentOutdent;
                }
                else if (onEnterRule.action.indent === 'outdent') {
                    indentAction = languageConfiguration_1.IndentAction.Outdent;
                }
                else {
                    console.warn(`[${languageId}]: language configuration: expected \`onEnterRules[${i}].action.indent\` to be 'none', 'indent', 'indentOutdent' or 'outdent'.`);
                    continue;
                }
                const action = { indentAction };
                if (onEnterRule.action.appendText) {
                    if (typeof onEnterRule.action.appendText === 'string') {
                        action.appendText = onEnterRule.action.appendText;
                    }
                    else {
                        console.warn(`[${languageId}]: language configuration: expected \`onEnterRules[${i}].action.appendText\` to be undefined or a string.`);
                    }
                }
                if (onEnterRule.action.removeText) {
                    if (typeof onEnterRule.action.removeText === 'number') {
                        action.removeText = onEnterRule.action.removeText;
                    }
                    else {
                        console.warn(`[${languageId}]: language configuration: expected \`onEnterRules[${i}].action.removeText\` to be undefined or a number.`);
                    }
                }
                const beforeText = this._parseRegex(languageId, `onEnterRules[${i}].beforeText`, onEnterRule.beforeText);
                if (!beforeText) {
                    continue;
                }
                const resultingOnEnterRule = { beforeText, action };
                if (onEnterRule.afterText) {
                    const afterText = this._parseRegex(languageId, `onEnterRules[${i}].afterText`, onEnterRule.afterText);
                    if (afterText) {
                        resultingOnEnterRule.afterText = afterText;
                    }
                }
                if (onEnterRule.previousLineText) {
                    const previousLineText = this._parseRegex(languageId, `onEnterRules[${i}].previousLineText`, onEnterRule.previousLineText);
                    if (previousLineText) {
                        resultingOnEnterRule.previousLineText = previousLineText;
                    }
                }
                result = result || [];
                result.push(resultingOnEnterRule);
            }
            return result;
        }
        static extractValidConfig(languageId, configuration) {
            const comments = this._extractValidCommentRule(languageId, configuration);
            const brackets = this._extractValidBrackets(languageId, configuration);
            const autoClosingPairs = this._extractValidAutoClosingPairs(languageId, configuration);
            const surroundingPairs = this._extractValidSurroundingPairs(languageId, configuration);
            const colorizedBracketPairs = this._extractValidColorizedBracketPairs(languageId, configuration);
            const autoCloseBefore = (typeof configuration.autoCloseBefore === 'string' ? configuration.autoCloseBefore : undefined);
            const wordPattern = (configuration.wordPattern ? this._parseRegex(languageId, `wordPattern`, configuration.wordPattern) : undefined);
            const indentationRules = (configuration.indentationRules ? this._mapIndentationRules(languageId, configuration.indentationRules) : undefined);
            let folding = undefined;
            if (configuration.folding) {
                const rawMarkers = configuration.folding.markers;
                const startMarker = (rawMarkers && rawMarkers.start ? this._parseRegex(languageId, `folding.markers.start`, rawMarkers.start) : undefined);
                const endMarker = (rawMarkers && rawMarkers.end ? this._parseRegex(languageId, `folding.markers.end`, rawMarkers.end) : undefined);
                const markers = (startMarker && endMarker ? { start: startMarker, end: endMarker } : undefined);
                folding = {
                    offSide: configuration.folding.offSide,
                    markers
                };
            }
            const onEnterRules = this._extractValidOnEnterRules(languageId, configuration);
            const richEditConfig = {
                comments,
                brackets,
                wordPattern,
                indentationRules,
                onEnterRules,
                autoClosingPairs,
                surroundingPairs,
                colorizedBracketPairs,
                autoCloseBefore,
                folding,
                __electricCharacterSupport: undefined,
            };
            return richEditConfig;
        }
        _handleConfig(languageId, configuration) {
            const richEditConfig = LanguageConfigurationFileHandler_1.extractValidConfig(languageId, configuration);
            this._languageConfigurationService.register(languageId, richEditConfig, 50);
        }
        static _parseRegex(languageId, confPath, value) {
            if (typeof value === 'string') {
                try {
                    return new RegExp(value, '');
                }
                catch (err) {
                    console.warn(`[${languageId}]: Invalid regular expression in \`${confPath}\`: `, err);
                    return undefined;
                }
            }
            if (types.isObject(value)) {
                if (typeof value.pattern !== 'string') {
                    console.warn(`[${languageId}]: language configuration: expected \`${confPath}.pattern\` to be a string.`);
                    return undefined;
                }
                if (typeof value.flags !== 'undefined' && typeof value.flags !== 'string') {
                    console.warn(`[${languageId}]: language configuration: expected \`${confPath}.flags\` to be a string.`);
                    return undefined;
                }
                try {
                    return new RegExp(value.pattern, value.flags);
                }
                catch (err) {
                    console.warn(`[${languageId}]: Invalid regular expression in \`${confPath}\`: `, err);
                    return undefined;
                }
            }
            console.warn(`[${languageId}]: language configuration: expected \`${confPath}\` to be a string or an object.`);
            return undefined;
        }
        static _mapIndentationRules(languageId, indentationRules) {
            const increaseIndentPattern = this._parseRegex(languageId, `indentationRules.increaseIndentPattern`, indentationRules.increaseIndentPattern);
            if (!increaseIndentPattern) {
                return undefined;
            }
            const decreaseIndentPattern = this._parseRegex(languageId, `indentationRules.decreaseIndentPattern`, indentationRules.decreaseIndentPattern);
            if (!decreaseIndentPattern) {
                return undefined;
            }
            const result = {
                increaseIndentPattern: increaseIndentPattern,
                decreaseIndentPattern: decreaseIndentPattern
            };
            if (indentationRules.indentNextLinePattern) {
                result.indentNextLinePattern = this._parseRegex(languageId, `indentationRules.indentNextLinePattern`, indentationRules.indentNextLinePattern);
            }
            if (indentationRules.unIndentedLinePattern) {
                result.unIndentedLinePattern = this._parseRegex(languageId, `indentationRules.unIndentedLinePattern`, indentationRules.unIndentedLinePattern);
            }
            return result;
        }
    };
    exports.LanguageConfigurationFileHandler = LanguageConfigurationFileHandler;
    exports.LanguageConfigurationFileHandler = LanguageConfigurationFileHandler = LanguageConfigurationFileHandler_1 = __decorate([
        __param(0, language_1.ILanguageService),
        __param(1, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(2, extensions_1.IExtensionService),
        __param(3, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], LanguageConfigurationFileHandler);
    const schemaId = 'vscode://schemas/language-configuration';
    const schema = {
        allowComments: true,
        allowTrailingCommas: true,
        default: {
            comments: {
                blockComment: ['/*', '*/'],
                lineComment: '//'
            },
            brackets: [['(', ')'], ['[', ']'], ['{', '}']],
            autoClosingPairs: [['(', ')'], ['[', ']'], ['{', '}']],
            surroundingPairs: [['(', ')'], ['[', ']'], ['{', '}']]
        },
        definitions: {
            openBracket: {
                type: 'string',
                description: nls.localize('schema.openBracket', 'The opening bracket character or string sequence.')
            },
            closeBracket: {
                type: 'string',
                description: nls.localize('schema.closeBracket', 'The closing bracket character or string sequence.')
            },
            bracketPair: {
                type: 'array',
                items: [{
                        $ref: '#/definitions/openBracket'
                    }, {
                        $ref: '#/definitions/closeBracket'
                    }]
            }
        },
        properties: {
            comments: {
                default: {
                    blockComment: ['/*', '*/'],
                    lineComment: '//'
                },
                description: nls.localize('schema.comments', 'Defines the comment symbols'),
                type: 'object',
                properties: {
                    blockComment: {
                        type: 'array',
                        description: nls.localize('schema.blockComments', 'Defines how block comments are marked.'),
                        items: [{
                                type: 'string',
                                description: nls.localize('schema.blockComment.begin', 'The character sequence that starts a block comment.')
                            }, {
                                type: 'string',
                                description: nls.localize('schema.blockComment.end', 'The character sequence that ends a block comment.')
                            }]
                    },
                    lineComment: {
                        type: 'string',
                        description: nls.localize('schema.lineComment', 'The character sequence that starts a line comment.')
                    }
                }
            },
            brackets: {
                default: [['(', ')'], ['[', ']'], ['{', '}']],
                markdownDescription: nls.localize('schema.brackets', 'Defines the bracket symbols that increase or decrease the indentation. When bracket pair colorization is enabled and {0} is not defined, this also defines the bracket pairs that are colorized by their nesting level.', '\`colorizedBracketPairs\`'),
                type: 'array',
                items: {
                    $ref: '#/definitions/bracketPair'
                }
            },
            colorizedBracketPairs: {
                default: [['(', ')'], ['[', ']'], ['{', '}']],
                markdownDescription: nls.localize('schema.colorizedBracketPairs', 'Defines the bracket pairs that are colorized by their nesting level if bracket pair colorization is enabled. Any brackets included here that are not included in {0} will be automatically included in {0}.', '\`brackets\`'),
                type: 'array',
                items: {
                    $ref: '#/definitions/bracketPair'
                }
            },
            autoClosingPairs: {
                default: [['(', ')'], ['[', ']'], ['{', '}']],
                description: nls.localize('schema.autoClosingPairs', 'Defines the bracket pairs. When a opening bracket is entered, the closing bracket is inserted automatically.'),
                type: 'array',
                items: {
                    oneOf: [{
                            $ref: '#/definitions/bracketPair'
                        }, {
                            type: 'object',
                            properties: {
                                open: {
                                    $ref: '#/definitions/openBracket'
                                },
                                close: {
                                    $ref: '#/definitions/closeBracket'
                                },
                                notIn: {
                                    type: 'array',
                                    description: nls.localize('schema.autoClosingPairs.notIn', 'Defines a list of scopes where the auto pairs are disabled.'),
                                    items: {
                                        enum: ['string', 'comment']
                                    }
                                }
                            }
                        }]
                }
            },
            autoCloseBefore: {
                default: ';:.,=}])> \n\t',
                description: nls.localize('schema.autoCloseBefore', 'Defines what characters must be after the cursor in order for bracket or quote autoclosing to occur when using the \'languageDefined\' autoclosing setting. This is typically the set of characters which can not start an expression.'),
                type: 'string',
            },
            surroundingPairs: {
                default: [['(', ')'], ['[', ']'], ['{', '}']],
                description: nls.localize('schema.surroundingPairs', 'Defines the bracket pairs that can be used to surround a selected string.'),
                type: 'array',
                items: {
                    oneOf: [{
                            $ref: '#/definitions/bracketPair'
                        }, {
                            type: 'object',
                            properties: {
                                open: {
                                    $ref: '#/definitions/openBracket'
                                },
                                close: {
                                    $ref: '#/definitions/closeBracket'
                                }
                            }
                        }]
                }
            },
            wordPattern: {
                default: '',
                description: nls.localize('schema.wordPattern', 'Defines what is considered to be a word in the programming language.'),
                type: ['string', 'object'],
                properties: {
                    pattern: {
                        type: 'string',
                        description: nls.localize('schema.wordPattern.pattern', 'The RegExp pattern used to match words.'),
                        default: '',
                    },
                    flags: {
                        type: 'string',
                        description: nls.localize('schema.wordPattern.flags', 'The RegExp flags used to match words.'),
                        default: 'g',
                        pattern: '^([gimuy]+)$',
                        patternErrorMessage: nls.localize('schema.wordPattern.flags.errorMessage', 'Must match the pattern `/^([gimuy]+)$/`.')
                    }
                }
            },
            indentationRules: {
                default: {
                    increaseIndentPattern: '',
                    decreaseIndentPattern: ''
                },
                description: nls.localize('schema.indentationRules', 'The language\'s indentation settings.'),
                type: 'object',
                properties: {
                    increaseIndentPattern: {
                        type: ['string', 'object'],
                        description: nls.localize('schema.indentationRules.increaseIndentPattern', 'If a line matches this pattern, then all the lines after it should be indented once (until another rule matches).'),
                        properties: {
                            pattern: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.increaseIndentPattern.pattern', 'The RegExp pattern for increaseIndentPattern.'),
                                default: '',
                            },
                            flags: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.increaseIndentPattern.flags', 'The RegExp flags for increaseIndentPattern.'),
                                default: '',
                                pattern: '^([gimuy]+)$',
                                patternErrorMessage: nls.localize('schema.indentationRules.increaseIndentPattern.errorMessage', 'Must match the pattern `/^([gimuy]+)$/`.')
                            }
                        }
                    },
                    decreaseIndentPattern: {
                        type: ['string', 'object'],
                        description: nls.localize('schema.indentationRules.decreaseIndentPattern', 'If a line matches this pattern, then all the lines after it should be unindented once (until another rule matches).'),
                        properties: {
                            pattern: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.decreaseIndentPattern.pattern', 'The RegExp pattern for decreaseIndentPattern.'),
                                default: '',
                            },
                            flags: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.decreaseIndentPattern.flags', 'The RegExp flags for decreaseIndentPattern.'),
                                default: '',
                                pattern: '^([gimuy]+)$',
                                patternErrorMessage: nls.localize('schema.indentationRules.decreaseIndentPattern.errorMessage', 'Must match the pattern `/^([gimuy]+)$/`.')
                            }
                        }
                    },
                    indentNextLinePattern: {
                        type: ['string', 'object'],
                        description: nls.localize('schema.indentationRules.indentNextLinePattern', 'If a line matches this pattern, then **only the next line** after it should be indented once.'),
                        properties: {
                            pattern: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.indentNextLinePattern.pattern', 'The RegExp pattern for indentNextLinePattern.'),
                                default: '',
                            },
                            flags: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.indentNextLinePattern.flags', 'The RegExp flags for indentNextLinePattern.'),
                                default: '',
                                pattern: '^([gimuy]+)$',
                                patternErrorMessage: nls.localize('schema.indentationRules.indentNextLinePattern.errorMessage', 'Must match the pattern `/^([gimuy]+)$/`.')
                            }
                        }
                    },
                    unIndentedLinePattern: {
                        type: ['string', 'object'],
                        description: nls.localize('schema.indentationRules.unIndentedLinePattern', 'If a line matches this pattern, then its indentation should not be changed and it should not be evaluated against the other rules.'),
                        properties: {
                            pattern: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.unIndentedLinePattern.pattern', 'The RegExp pattern for unIndentedLinePattern.'),
                                default: '',
                            },
                            flags: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.unIndentedLinePattern.flags', 'The RegExp flags for unIndentedLinePattern.'),
                                default: '',
                                pattern: '^([gimuy]+)$',
                                patternErrorMessage: nls.localize('schema.indentationRules.unIndentedLinePattern.errorMessage', 'Must match the pattern `/^([gimuy]+)$/`.')
                            }
                        }
                    }
                }
            },
            folding: {
                type: 'object',
                description: nls.localize('schema.folding', 'The language\'s folding settings.'),
                properties: {
                    offSide: {
                        type: 'boolean',
                        description: nls.localize('schema.folding.offSide', 'A language adheres to the off-side rule if blocks in that language are expressed by their indentation. If set, empty lines belong to the subsequent block.'),
                    },
                    markers: {
                        type: 'object',
                        description: nls.localize('schema.folding.markers', 'Language specific folding markers such as \'#region\' and \'#endregion\'. The start and end regexes will be tested against the contents of all lines and must be designed efficiently'),
                        properties: {
                            start: {
                                type: 'string',
                                description: nls.localize('schema.folding.markers.start', 'The RegExp pattern for the start marker. The regexp must start with \'^\'.')
                            },
                            end: {
                                type: 'string',
                                description: nls.localize('schema.folding.markers.end', 'The RegExp pattern for the end marker. The regexp must start with \'^\'.')
                            },
                        }
                    }
                }
            },
            onEnterRules: {
                type: 'array',
                description: nls.localize('schema.onEnterRules', 'The language\'s rules to be evaluated when pressing Enter.'),
                items: {
                    type: 'object',
                    description: nls.localize('schema.onEnterRules', 'The language\'s rules to be evaluated when pressing Enter.'),
                    required: ['beforeText', 'action'],
                    properties: {
                        beforeText: {
                            type: ['string', 'object'],
                            description: nls.localize('schema.onEnterRules.beforeText', 'This rule will only execute if the text before the cursor matches this regular expression.'),
                            properties: {
                                pattern: {
                                    type: 'string',
                                    description: nls.localize('schema.onEnterRules.beforeText.pattern', 'The RegExp pattern for beforeText.'),
                                    default: '',
                                },
                                flags: {
                                    type: 'string',
                                    description: nls.localize('schema.onEnterRules.beforeText.flags', 'The RegExp flags for beforeText.'),
                                    default: '',
                                    pattern: '^([gimuy]+)$',
                                    patternErrorMessage: nls.localize('schema.onEnterRules.beforeText.errorMessage', 'Must match the pattern `/^([gimuy]+)$/`.')
                                }
                            }
                        },
                        afterText: {
                            type: ['string', 'object'],
                            description: nls.localize('schema.onEnterRules.afterText', 'This rule will only execute if the text after the cursor matches this regular expression.'),
                            properties: {
                                pattern: {
                                    type: 'string',
                                    description: nls.localize('schema.onEnterRules.afterText.pattern', 'The RegExp pattern for afterText.'),
                                    default: '',
                                },
                                flags: {
                                    type: 'string',
                                    description: nls.localize('schema.onEnterRules.afterText.flags', 'The RegExp flags for afterText.'),
                                    default: '',
                                    pattern: '^([gimuy]+)$',
                                    patternErrorMessage: nls.localize('schema.onEnterRules.afterText.errorMessage', 'Must match the pattern `/^([gimuy]+)$/`.')
                                }
                            }
                        },
                        previousLineText: {
                            type: ['string', 'object'],
                            description: nls.localize('schema.onEnterRules.previousLineText', 'This rule will only execute if the text above the line matches this regular expression.'),
                            properties: {
                                pattern: {
                                    type: 'string',
                                    description: nls.localize('schema.onEnterRules.previousLineText.pattern', 'The RegExp pattern for previousLineText.'),
                                    default: '',
                                },
                                flags: {
                                    type: 'string',
                                    description: nls.localize('schema.onEnterRules.previousLineText.flags', 'The RegExp flags for previousLineText.'),
                                    default: '',
                                    pattern: '^([gimuy]+)$',
                                    patternErrorMessage: nls.localize('schema.onEnterRules.previousLineText.errorMessage', 'Must match the pattern `/^([gimuy]+)$/`.')
                                }
                            }
                        },
                        action: {
                            type: ['string', 'object'],
                            description: nls.localize('schema.onEnterRules.action', 'The action to execute.'),
                            required: ['indent'],
                            default: { 'indent': 'indent' },
                            properties: {
                                indent: {
                                    type: 'string',
                                    description: nls.localize('schema.onEnterRules.action.indent', "Describe what to do with the indentation"),
                                    default: 'indent',
                                    enum: ['none', 'indent', 'indentOutdent', 'outdent'],
                                    markdownEnumDescriptions: [
                                        nls.localize('schema.onEnterRules.action.indent.none', "Insert new line and copy the previous line's indentation."),
                                        nls.localize('schema.onEnterRules.action.indent.indent', "Insert new line and indent once (relative to the previous line's indentation)."),
                                        nls.localize('schema.onEnterRules.action.indent.indentOutdent', "Insert two new lines:\n - the first one indented which will hold the cursor\n - the second one at the same indentation level"),
                                        nls.localize('schema.onEnterRules.action.indent.outdent', "Insert new line and outdent once (relative to the previous line's indentation).")
                                    ]
                                },
                                appendText: {
                                    type: 'string',
                                    description: nls.localize('schema.onEnterRules.action.appendText', 'Describes text to be appended after the new line and after the indentation.'),
                                    default: '',
                                },
                                removeText: {
                                    type: 'number',
                                    description: nls.localize('schema.onEnterRules.action.removeText', 'Describes the number of characters to remove from the new line\'s indentation.'),
                                    default: 0,
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    const schemaRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(schemaId, schema);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VDb25maWd1cmF0aW9uRXh0ZW5zaW9uUG9pbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVFZGl0b3IvY29tbW9uL2xhbmd1YWdlQ29uZmlndXJhdGlvbkV4dGVuc2lvblBvaW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFpRWhHLFNBQVMsV0FBVyxDQUFDLFNBQTBCO1FBQzlDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDL0IsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3RELElBQUksT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUViLENBQUM7SUFFRCxTQUFTLGVBQWUsQ0FBQyxTQUErQjtRQUN2RCxPQUFPLENBQ04sV0FBVyxDQUFDLFNBQVMsQ0FBQztlQUNuQixTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FDekIsQ0FBQztJQUNILENBQUM7SUFFTSxJQUFNLGdDQUFnQyx3Q0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSxzQkFBVTtRQU8vRCxZQUNtQixnQkFBbUQsRUFDcEMsK0JBQWlGLEVBQy9GLGlCQUFxRCxFQUN6Qyw2QkFBNkU7WUFFNUcsS0FBSyxFQUFFLENBQUM7WUFMMkIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNu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