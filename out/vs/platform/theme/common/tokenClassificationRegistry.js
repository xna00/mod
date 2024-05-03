/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/color", "vs/base/common/event", "vs/nls", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform"], function (require, exports, async_1, color_1, event_1, nls, jsonContributionRegistry_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.tokenStylingSchemaId = exports.SemanticTokenRule = exports.TokenStyle = exports.typeAndModifierIdPattern = void 0;
    exports.parseClassifierString = parseClassifierString;
    exports.getTokenClassificationRegistry = getTokenClassificationRegistry;
    const TOKEN_TYPE_WILDCARD = '*';
    const TOKEN_CLASSIFIER_LANGUAGE_SEPARATOR = ':';
    const CLASSIFIER_MODIFIER_SEPARATOR = '.';
    const idPattern = '\\w+[-_\\w+]*';
    exports.typeAndModifierIdPattern = `^${idPattern}$`;
    const selectorPattern = `^(${idPattern}|\\*)(\\${CLASSIFIER_MODIFIER_SEPARATOR}${idPattern})*(${TOKEN_CLASSIFIER_LANGUAGE_SEPARATOR}${idPattern})?$`;
    const fontStylePattern = '^(\\s*(italic|bold|underline|strikethrough))*\\s*$';
    class TokenStyle {
        constructor(foreground, bold, underline, strikethrough, italic) {
            this.foreground = foreground;
            this.bold = bold;
            this.underline = underline;
            this.strikethrough = strikethrough;
            this.italic = italic;
        }
    }
    exports.TokenStyle = TokenStyle;
    (function (TokenStyle) {
        function toJSONObject(style) {
            return {
                _foreground: style.foreground === undefined ? null : color_1.Color.Format.CSS.formatHexA(style.foreground, true),
                _bold: style.bold === undefined ? null : style.bold,
                _underline: style.underline === undefined ? null : style.underline,
                _italic: style.italic === undefined ? null : style.italic,
                _strikethrough: style.strikethrough === undefined ? null : style.strikethrough,
            };
        }
        TokenStyle.toJSONObject = toJSONObject;
        function fromJSONObject(obj) {
            if (obj) {
                const boolOrUndef = (b) => (typeof b === 'boolean') ? b : undefined;
                const colorOrUndef = (s) => (typeof s === 'string') ? color_1.Color.fromHex(s) : undefined;
                return new TokenStyle(colorOrUndef(obj._foreground), boolOrUndef(obj._bold), boolOrUndef(obj._underline), boolOrUndef(obj._strikethrough), boolOrUndef(obj._italic));
            }
            return undefined;
        }
        TokenStyle.fromJSONObject = fromJSONObject;
        function equals(s1, s2) {
            if (s1 === s2) {
                return true;
            }
            return s1 !== undefined && s2 !== undefined
                && (s1.foreground instanceof color_1.Color ? s1.foreground.equals(s2.foreground) : s2.foreground === undefined)
                && s1.bold === s2.bold
                && s1.underline === s2.underline
                && s1.strikethrough === s2.strikethrough
                && s1.italic === s2.italic;
        }
        TokenStyle.equals = equals;
        function is(s) {
            return s instanceof TokenStyle;
        }
        TokenStyle.is = is;
        function fromData(data) {
            return new TokenStyle(data.foreground, data.bold, data.underline, data.strikethrough, data.italic);
        }
        TokenStyle.fromData = fromData;
        function fromSettings(foreground, fontStyle, bold, underline, strikethrough, italic) {
            let foregroundColor = undefined;
            if (foreground !== undefined) {
                foregroundColor = color_1.Color.fromHex(foreground);
            }
            if (fontStyle !== undefined) {
                bold = italic = underline = strikethrough = false;
                const expression = /italic|bold|underline|strikethrough/g;
                let match;
                while ((match = expression.exec(fontStyle))) {
                    switch (match[0]) {
                        case 'bold':
                            bold = true;
                            break;
                        case 'italic':
                            italic = true;
                            break;
                        case 'underline':
                            underline = true;
                            break;
                        case 'strikethrough':
                            strikethrough = true;
                            break;
                    }
                }
            }
            return new TokenStyle(foregroundColor, bold, underline, strikethrough, italic);
        }
        TokenStyle.fromSettings = fromSettings;
    })(TokenStyle || (exports.TokenStyle = TokenStyle = {}));
    var SemanticTokenRule;
    (function (SemanticTokenRule) {
        function fromJSONObject(registry, o) {
            if (o && typeof o._selector === 'string' && o._style) {
                const style = TokenStyle.fromJSONObject(o._style);
                if (style) {
                    try {
                        return { selector: registry.parseTokenSelector(o._selector), style };
                    }
                    catch (_ignore) {
                    }
                }
            }
            return undefined;
        }
        SemanticTokenRule.fromJSONObject = fromJSONObject;
        function toJSONObject(rule) {
            return {
                _selector: rule.selector.id,
                _style: TokenStyle.toJSONObject(rule.style)
            };
        }
        SemanticTokenRule.toJSONObject = toJSONObject;
        function equals(r1, r2) {
            if (r1 === r2) {
                return true;
            }
            return r1 !== undefined && r2 !== undefined
                && r1.selector && r2.selector && r1.selector.id === r2.selector.id
                && TokenStyle.equals(r1.style, r2.style);
        }
        SemanticTokenRule.equals = equals;
        function is(r) {
            return r && r.selector && typeof r.selector.id === 'string' && TokenStyle.is(r.style);
        }
        SemanticTokenRule.is = is;
    })(SemanticTokenRule || (exports.SemanticTokenRule = SemanticTokenRule = {}));
    // TokenStyle registry
    const Extensions = {
        TokenClassificationContribution: 'base.contributions.tokenClassification'
    };
    class TokenClassificationRegistry {
        constructor() {
            this._onDidChangeSchema = new event_1.Emitter();
            this.onDidChangeSchema = this._onDidChangeSchema.event;
            this.currentTypeNumber = 0;
            this.currentModifierBit = 1;
            this.tokenStylingDefaultRules = [];
            this.tokenStylingSchema = {
                type: 'object',
                properties: {},
                patternProperties: {
                    [selectorPattern]: getStylingSchemeEntry()
                },
                //errorMessage: nls.localize('schema.token.errors', 'Valid token selectors have the form (*|tokenType)(.tokenModifier)*(:tokenLanguage)?.'),
                additionalProperties: false,
                definitions: {
                    style: {
                        type: 'object',
                        description: nls.localize('schema.token.settings', 'Colors and styles for the token.'),
                        properties: {
                            foreground: {
                                type: 'string',
                                description: nls.localize('schema.token.foreground', 'Foreground color for the token.'),
                                format: 'color-hex',
                                default: '#ff0000'
                            },
                            background: {
                                type: 'string',
                                deprecationMessage: nls.localize('schema.token.background.warning', 'Token background colors are currently not supported.')
                            },
                            fontStyle: {
                                type: 'string',
                                description: nls.localize('schema.token.fontStyle', 'Sets the all font styles of the rule: \'italic\', \'bold\', \'underline\' or \'strikethrough\' or a combination. All styles that are not listed are unset. The empty string unsets all styles.'),
                                pattern: fontStylePattern,
                                patternErrorMessage: nls.localize('schema.fontStyle.error', 'Font style must be \'italic\', \'bold\', \'underline\' or \'strikethrough\' or a combination. The empty string unsets all styles.'),
                                defaultSnippets: [
                                    { label: nls.localize('schema.token.fontStyle.none', 'None (clear inherited style)'), bodyText: '""' },
                                    { body: 'italic' },
                                    { body: 'bold' },
                                    { body: 'underline' },
                                    { body: 'strikethrough' },
                                    { body: 'italic bold' },
                                    { body: 'italic underline' },
                                    { body: 'italic strikethrough' },
                                    { body: 'bold underline' },
                                    { body: 'bold strikethrough' },
                                    { body: 'underline strikethrough' },
                                    { body: 'italic bold underline' },
                                    { body: 'italic bold strikethrough' },
                                    { body: 'italic underline strikethrough' },
                                    { body: 'bold underline strikethrough' },
                                    { body: 'italic bold underline strikethrough' }
                                ]
                            },
                            bold: {
                                type: 'boolean',
                                description: nls.localize('schema.token.bold', 'Sets or unsets the font style to bold. Note, the presence of \'fontStyle\' overrides this setting.'),
                            },
                            italic: {
                                type: 'boolean',
                                description: nls.localize('schema.token.italic', 'Sets or unsets the font style to italic. Note, the presence of \'fontStyle\' overrides this setting.'),
                            },
                            underline: {
                                type: 'boolean',
                                description: nls.localize('schema.token.underline', 'Sets or unsets the font style to underline. Note, the presence of \'fontStyle\' overrides this setting.'),
                            },
                            strikethrough: {
                                type: 'boolean',
                                description: nls.localize('schema.token.strikethrough', 'Sets or unsets the font style to strikethrough. Note, the presence of \'fontStyle\' overrides this setting.'),
                            }
                        },
                        defaultSnippets: [{ body: { foreground: '${1:#FF0000}', fontStyle: '${2:bold}' } }]
                    }
                }
            };
            this.tokenTypeById = Object.create(null);
            this.tokenModifierById = Object.create(null);
            this.typeHierarchy = Object.create(null);
        }
        registerTokenType(id, description, superType, deprecationMessage) {
            if (!id.match(exports.typeAndModifierIdPattern)) {
                throw new Error('Invalid token type id.');
            }
            if (superType && !superType.match(exports.typeAndModifierIdPattern)) {
                throw new Error('Invalid token super type id.');
            }
            const num = this.currentTypeNumber++;
            const tokenStyleContribution = { num, id, superType, description, deprecationMessage };
            this.tokenTypeById[id] = tokenStyleContribution;
            const stylingSchemeEntry = getStylingSchemeEntry(description, deprecationMessage);
            this.tokenStylingSchema.properties[id] = stylingSchemeEntry;
            this.typeHierarchy = Object.create(null);
        }
        registerTokenModifier(id, description, deprecationMessage) {
            if (!id.match(exports.typeAndModifierIdPattern)) {
                throw new Error('Invalid token modifier id.');
            }
            const num = this.currentModifierBit;
            this.currentModifierBit = this.currentModifierBit * 2;
            const tokenStyleContribution = { num, id, description, deprecationMessage };
            this.tokenModifierById[id] = tokenStyleContribution;
            this.tokenStylingSchema.properties[`*.${id}`] = getStylingSchemeEntry(description, deprecationMessage);
        }
        parseTokenSelector(selectorString, language) {
            const selector = parseClassifierString(selectorString, language);
            if (!selector.type) {
                return {
                    match: () => -1,
                    id: '$invalid'
                };
            }
            return {
                match: (type, modifiers, language) => {
                    let score = 0;
                    if (selector.language !== undefined) {
                        if (selector.language !== language) {
                            return -1;
                        }
                        score += 10;
                    }
                    if (selector.type !== TOKEN_TYPE_WILDCARD) {
                        const hierarchy = this.getTypeHierarchy(type);
                        const level = hierarchy.indexOf(selector.type);
                        if (level === -1) {
                            return -1;
                        }
                        score += (100 - level);
                    }
                    // all selector modifiers must be present
                    for (const selectorModifier of selector.modifiers) {
                        if (modifiers.indexOf(selectorModifier) === -1) {
                            return -1;
                        }
                    }
                    return score + selector.modifiers.length * 100;
                },
                id: `${[selector.type, ...selector.modifiers.sort()].join('.')}${selector.language !== undefined ? ':' + selector.language : ''}`
            };
        }
        registerTokenStyleDefault(selector, defaults) {
            this.tokenStylingDefaultRules.push({ selector, defaults });
        }
        deregisterTokenStyleDefault(selector) {
            const selectorString = selector.id;
            this.tokenStylingDefaultRules = this.tokenStylingDefaultRules.filter(r => r.selector.id !== selectorString);
        }
        deregisterTokenType(id) {
            delete this.tokenTypeById[id];
            delete this.tokenStylingSchema.properties[id];
            this.typeHierarchy = Object.create(null);
        }
        deregisterTokenModifier(id) {
            delete this.tokenModifierById[id];
            delete this.tokenStylingSchema.properties[`*.${id}`];
        }
        getTokenTypes() {
            return Object.keys(this.tokenTypeById).map(id => this.tokenTypeById[id]);
        }
        getTokenModifiers() {
            return Object.keys(this.tokenModifierById).map(id => this.tokenModifierById[id]);
        }
        getTokenStylingSchema() {
            return this.tokenStylingSchema;
        }
        getTokenStylingDefaultRules() {
            return this.tokenStylingDefaultRules;
        }
        getTypeHierarchy(typeId) {
            let hierarchy = this.typeHierarchy[typeId];
            if (!hierarchy) {
                this.typeHierarchy[typeId] = hierarchy = [typeId];
                let type = this.tokenTypeById[typeId];
                while (type && type.superType) {
                    hierarchy.push(type.superType);
                    type = this.tokenTypeById[type.superType];
                }
            }
            return hierarchy;
        }
        toString() {
            const sorter = (a, b) => {
                const cat1 = a.indexOf('.') === -1 ? 0 : 1;
                const cat2 = b.indexOf('.') === -1 ? 0 : 1;
                if (cat1 !== cat2) {
                    return cat1 - cat2;
                }
                return a.localeCompare(b);
            };
            return Object.keys(this.tokenTypeById).sort(sorter).map(k => `- \`${k}\`: ${this.tokenTypeById[k].description}`).join('\n');
        }
    }
    const CHAR_LANGUAGE = TOKEN_CLASSIFIER_LANGUAGE_SEPARATOR.charCodeAt(0);
    const CHAR_MODIFIER = CLASSIFIER_MODIFIER_SEPARATOR.charCodeAt(0);
    function parseClassifierString(s, defaultLanguage) {
        let k = s.length;
        let language = defaultLanguage;
        const modifiers = [];
        for (let i = k - 1; i >= 0; i--) {
            const ch = s.charCodeAt(i);
            if (ch === CHAR_LANGUAGE || ch === CHAR_MODIFIER) {
                const segment = s.substring(i + 1, k);
                k = i;
                if (ch === CHAR_LANGUAGE) {
                    language = segment;
                }
                else {
                    modifiers.push(segment);
                }
            }
        }
        const type = s.substring(0, k);
        return { type, modifiers, language };
    }
    const tokenClassificationRegistry = createDefaultTokenClassificationRegistry();
    platform.Registry.add(Extensions.TokenClassificationContribution, tokenClassificationRegistry);
    function createDefaultTokenClassificationRegistry() {
        const registry = new TokenClassificationRegistry();
        function registerTokenType(id, description, scopesToProbe = [], superType, deprecationMessage) {
            registry.registerTokenType(id, description, superType, deprecationMessage);
            if (scopesToProbe) {
                registerTokenStyleDefault(id, scopesToProbe);
            }
            return id;
        }
        function registerTokenStyleDefault(selectorString, scopesToProbe) {
            try {
                const selector = registry.parseTokenSelector(selectorString);
                registry.registerTokenStyleDefault(selector, { scopesToProbe });
            }
            catch (e) {
                console.log(e);
            }
        }
        // default token types
        registerTokenType('comment', nls.localize('comment', "Style for comments."), [['comment']]);
        registerTokenType('string', nls.localize('string', "Style for strings."), [['string']]);
        registerTokenType('keyword', nls.localize('keyword', "Style for keywords."), [['keyword.control']]);
        registerTokenType('number', nls.localize('number', "Style for numbers."), [['constant.numeric']]);
        registerTokenType('regexp', nls.localize('regexp', "Style for expressions."), [['constant.regexp']]);
        registerTokenType('operator', nls.localize('operator', "Style for operators."), [['keyword.operator']]);
        registerTokenType('namespace', nls.localize('namespace', "Style for namespaces."), [['entity.name.namespace']]);
        registerTokenType('type', nls.localize('type', "Style for types."), [['entity.name.type'], ['support.type']]);
        registerTokenType('struct', nls.localize('struct', "Style for structs."), [['entity.name.type.struct']]);
        registerTokenType('class', nls.localize('class', "Style for classes."), [['entity.name.type.class'], ['support.class']]);
        registerTokenType('interface', nls.localize('interface', "Style for interfaces."), [['entity.name.type.interface']]);
        registerTokenType('enum', nls.localize('enum', "Style for enums."), [['entity.name.type.enum']]);
        registerTokenType('typeParameter', nls.localize('typeParameter', "Style for type parameters."), [['entity.name.type.parameter']]);
        registerTokenType('function', nls.localize('function', "Style for functions"), [['entity.name.function'], ['support.function']]);
        registerTokenType('member', nls.localize('member', "Style for member functions"), [], 'method', 'Deprecated use `method` instead');
        registerTokenType('method', nls.localize('method', "Style for method (member functions)"), [['entity.name.function.member'], ['support.function']]);
        registerTokenType('macro', nls.localize('macro', "Style for macros."), [['entity.name.function.preprocessor']]);
        registerTokenType('variable', nls.localize('variable', "Style for variables."), [['variable.other.readwrite'], ['entity.name.variable']]);
        registerTokenType('parameter', nls.localize('parameter', "Style for parameters."), [['variable.parameter']]);
        registerTokenType('property', nls.localize('property', "Style for properties."), [['variable.other.property']]);
        registerTokenType('enumMember', nls.localize('enumMember', "Style for enum members."), [['variable.other.enummember']]);
        registerTokenType('event', nls.localize('event', "Style for events."), [['variable.other.event']]);
        registerTokenType('decorator', nls.localize('decorator', "Style for decorators & annotations."), [['entity.name.decorator'], ['entity.name.function']]);
        registerTokenType('label', nls.localize('labels', "Style for labels. "), undefined);
        // default token modifiers
        registry.registerTokenModifier('declaration', nls.localize('declaration', "Style for all symbol declarations."), undefined);
        registry.registerTokenModifier('documentation', nls.localize('documentation', "Style to use for references in documentation."), undefined);
        registry.registerTokenModifier('static', nls.localize('static', "Style to use for symbols that are static."), undefined);
        registry.registerTokenModifier('abstract', nls.localize('abstract', "Style to use for symbols that are abstract."), undefined);
        registry.registerTokenModifier('deprecated', nls.localize('deprecated', "Style to use for symbols that are deprecated."), undefined);
        registry.registerTokenModifier('modification', nls.localize('modification', "Style to use for write accesses."), undefined);
        registry.registerTokenModifier('async', nls.localize('async', "Style to use for symbols that are async."), undefined);
        registry.registerTokenModifier('readonly', nls.localize('readonly', "Style to use for symbols that are read-only."), undefined);
        registerTokenStyleDefault('variable.readonly', [['variable.other.constant']]);
        registerTokenStyleDefault('property.readonly', [['variable.other.constant.property']]);
        registerTokenStyleDefault('type.defaultLibrary', [['support.type']]);
        registerTokenStyleDefault('class.defaultLibrary', [['support.class']]);
        registerTokenStyleDefault('interface.defaultLibrary', [['support.class']]);
        registerTokenStyleDefault('variable.defaultLibrary', [['support.variable'], ['support.other.variable']]);
        registerTokenStyleDefault('variable.defaultLibrary.readonly', [['support.constant']]);
        registerTokenStyleDefault('property.defaultLibrary', [['support.variable.property']]);
        registerTokenStyleDefault('property.defaultLibrary.readonly', [['support.constant.property']]);
        registerTokenStyleDefault('function.defaultLibrary', [['support.function']]);
        registerTokenStyleDefault('member.defaultLibrary', [['support.function']]);
        return registry;
    }
    function getTokenClassificationRegistry() {
        return tokenClassificationRegistry;
    }
    function getStylingSchemeEntry(description, deprecationMessage) {
        return {
            description,
            deprecationMessage,
            defaultSnippets: [{ body: '${1:#ff0000}' }],
            anyOf: [
                {
                    type: 'string',
                    format: 'color-hex'
                },
                {
                    $ref: '#/definitions/style'
                }
            ]
        };
    }
    exports.tokenStylingSchemaId = 'vscode://schemas/token-styling';
    const schemaRegistry = platform.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(exports.tokenStylingSchemaId, tokenClassificationRegistry.getTokenStylingSchema());
    const delayer = new async_1.RunOnceScheduler(() => schemaRegistry.notifySchemaChanged(exports.tokenStylingSchemaId), 200);
    tokenClassificationRegistry.onDidChangeSchema(() => {
        if (!delayer.isScheduled()) {
            delayer.schedule();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5DbGFzc2lmaWNhdGlvblJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90aGVtZS9jb21tb24vdG9rZW5DbGFzc2lmaWNhdGlvblJlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTBlaEcsc0RBbUJDO0lBc0ZELHdFQUVDO0lBMWtCRCxNQUFNLG1CQUFtQixHQUFHLEdBQUcsQ0FBQztJQUNoQyxNQUFNLG1DQUFtQyxHQUFHLEdBQUcsQ0FBQztJQUNoRCxNQUFNLDZCQUE2QixHQUFHLEdBQUcsQ0FBQztJQUsxQyxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUM7SUFDckIsUUFBQSx3QkFBd0IsR0FBRyxJQUFJLFNBQVMsR0FBRyxDQUFDO0lBRXpELE1BQU0sZUFBZSxHQUFHLEtBQUssU0FBUyxXQUFXLDZCQUE2QixHQUFHLFNBQVMsTUFBTSxtQ0FBbUMsR0FBRyxTQUFTLEtBQUssQ0FBQztJQUVySixNQUFNLGdCQUFnQixHQUFHLG9EQUFvRCxDQUFDO0lBd0I5RSxNQUFhLFVBQVU7UUFDdEIsWUFDaUIsVUFBNkIsRUFDN0IsSUFBeUIsRUFDekIsU0FBOEIsRUFDOUIsYUFBa0MsRUFDbEMsTUFBMkI7WUFKM0IsZUFBVSxHQUFWLFVBQVUsQ0FBbUI7WUFDN0IsU0FBSSxHQUFKLElBQUksQ0FBcUI7WUFDekIsY0FBUyxHQUFULFNBQVMsQ0FBcUI7WUFDOUIsa0JBQWEsR0FBYixhQUFhLENBQXFCO1lBQ2xDLFdBQU0sR0FBTixNQUFNLENBQXFCO1FBRTVDLENBQUM7S0FDRDtJQVRELGdDQVNDO0lBRUQsV0FBaUIsVUFBVTtRQUMxQixTQUFnQixZQUFZLENBQUMsS0FBaUI7WUFDN0MsT0FBTztnQkFDTixXQUFXLEVBQUUsS0FBSyxDQUFDLFVBQVUsS0FBSyxTQUFTLENB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