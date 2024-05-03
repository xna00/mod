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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/encodedTokenAttributes", "vs/editor/common/languages/language", "vs/platform/notification/common/notification", "vs/workbench/services/textMate/common/TMHelper", "vs/workbench/services/textMate/browser/textMateTokenizationFeature", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/cancellation", "vs/platform/theme/common/tokenClassificationRegistry", "vs/platform/configuration/common/configuration", "vs/editor/contrib/semanticTokens/common/semanticTokensConfig", "vs/base/common/network", "vs/editor/common/services/languageFeatures", "vs/css!./inspectEditorTokens"], function (require, exports, nls, dom, color_1, lifecycle_1, editorExtensions_1, range_1, encodedTokenAttributes_1, language_1, notification_1, TMHelper_1, textMateTokenizationFeature_1, workbenchThemeService_1, cancellation_1, tokenClassificationRegistry_1, configuration_1, semanticTokensConfig_1, network_1, languageFeatures_1) {
    "use strict";
    var InspectEditorTokensController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    let InspectEditorTokensController = class InspectEditorTokensController extends lifecycle_1.Disposable {
        static { InspectEditorTokensController_1 = this; }
        static { this.ID = 'editor.contrib.inspectEditorTokens'; }
        static get(editor) {
            return editor.getContribution(InspectEditorTokensController_1.ID);
        }
        constructor(editor, textMateService, languageService, themeService, notificationService, configurationService, languageFeaturesService) {
            super();
            this._editor = editor;
            this._textMateService = textMateService;
            this._themeService = themeService;
            this._languageService = languageService;
            this._notificationService = notificationService;
            this._configurationService = configurationService;
            this._languageFeaturesService = languageFeaturesService;
            this._widget = null;
            this._register(this._editor.onDidChangeModel((e) => this.stop()));
            this._register(this._editor.onDidChangeModelLanguage((e) => this.stop()));
            this._register(this._editor.onKeyUp((e) => e.keyCode === 9 /* KeyCode.Escape */ && this.stop()));
        }
        dispose() {
            this.stop();
            super.dispose();
        }
        launch() {
            if (this._widget) {
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._editor.getModel().uri.scheme === network_1.Schemas.vscodeNotebookCell) {
                // disable in notebooks
                return;
            }
            this._widget = new InspectEditorTokensWidget(this._editor, this._textMateService, this._languageService, this._themeService, this._notificationService, this._configurationService, this._languageFeaturesService);
        }
        stop() {
            if (this._widget) {
                this._widget.dispose();
                this._widget = null;
            }
        }
        toggle() {
            if (!this._widget) {
                this.launch();
            }
            else {
                this.stop();
            }
        }
    };
    InspectEditorTokensController = InspectEditorTokensController_1 = __decorate([
        __param(1, textMateTokenizationFeature_1.ITextMateTokenizationService),
        __param(2, language_1.ILanguageService),
        __param(3, workbenchThemeService_1.IWorkbenchThemeService),
        __param(4, notification_1.INotificationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, languageFeatures_1.ILanguageFeaturesService)
    ], InspectEditorTokensController);
    class InspectEditorTokens extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inspectTMScopes',
                label: nls.localize('inspectEditorTokens', "Developer: Inspect Editor Tokens and Scopes"),
                alias: 'Developer: Inspect Editor Tokens and Scopes',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            const controller = InspectEditorTokensController.get(editor);
            controller?.toggle();
        }
    }
    function renderTokenText(tokenText) {
        if (tokenText.length > 40) {
            tokenText = tokenText.substr(0, 20) + '…' + tokenText.substr(tokenText.length - 20);
        }
        let result = '';
        for (let charIndex = 0, len = tokenText.length; charIndex < len; charIndex++) {
            const charCode = tokenText.charCodeAt(charIndex);
            switch (charCode) {
                case 9 /* CharCode.Tab */:
                    result += '\u2192'; // &rarr;
                    break;
                case 32 /* CharCode.Space */:
                    result += '\u00B7'; // &middot;
                    break;
                default:
                    result += String.fromCharCode(charCode);
            }
        }
        return result;
    }
    class InspectEditorTokensWidget extends lifecycle_1.Disposable {
        static { this._ID = 'editor.contrib.inspectEditorTokensWidget'; }
        constructor(editor, textMateService, languageService, themeService, notificationService, configurationService, languageFeaturesService) {
            super();
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this._isDisposed = false;
            this._editor = editor;
            this._languageService = languageService;
            this._themeService = themeService;
            this._textMateService = textMateService;
            this._notificationService = notificationService;
            this._configurationService = configurationService;
            this._languageFeaturesService = languageFeaturesService;
            this._model = this._editor.getModel();
            this._domNode = document.createElement('div');
            this._domNode.className = 'token-inspect-widget';
            this._currentRequestCancellationTokenSource = new cancellation_1.CancellationTokenSource();
            this._beginCompute(this._editor.getPosition());
            this._register(this._editor.onDidChangeCursorPosition((e) => this._beginCompute(this._editor.getPosition())));
            this._register(themeService.onDidColorThemeChange(_ => this._beginCompute(this._editor.getPosition())));
            this._register(configurationService.onDidChangeConfiguration(e => e.affectsConfiguration('editor.semanticHighlighting.enabled') && this._beginCompute(this._editor.getPosition())));
            this._editor.addContentWidget(this);
        }
        dispose() {
            this._isDisposed = true;
            this._editor.removeContentWidget(this);
            this._currentRequestCancellationTokenSource.cancel();
            super.dispose();
        }
        getId() {
            return InspectEditorTokensWidget._ID;
        }
        _beginCompute(position) {
            const grammar = this._textMateService.createTokenizer(this._model.getLanguageId());
            const semanticTokens = this._computeSemanticTokens(position);
            dom.clearNode(this._domNode);
            this._domNode.appendChild(document.createTextNode(nls.localize('inspectTMScopesWidget.loading', "Loading...")));
            Promise.all([grammar, semanticTokens]).then(([grammar, semanticTokens]) => {
                if (this._isDisposed) {
                    return;
                }
                this._compute(grammar, semanticTokens, position);
                this._domNode.style.maxWidth = `${Math.max(this._editor.getLayoutInfo().width * 0.66, 500)}px`;
                this._editor.layoutContentWidget(this);
            }, (err) => {
                this._notificationService.warn(err);
                setTimeout(() => {
                    InspectEditorTokensController.get(this._editor)?.stop();
                });
            });
        }
        _isSemanticColoringEnabled() {
            const setting = this._configurationService.getValue(semanticTokensConfig_1.SEMANTIC_HIGHLIGHTING_SETTING_ID, { overrideIdentifier: this._model.getLanguageId(), resource: this._model.uri })?.enabled;
            if (typeof setting === 'boolean') {
                return setting;
            }
            return this._themeService.getColorTheme().semanticHighlighting;
        }
        _compute(grammar, semanticTokens, position) {
            const textMateTokenInfo = grammar && this._getTokensAtPosition(grammar, position);
            const semanticTokenInfo = semanticTokens && this._getSemanticTokenAtPosition(semanticTokens, position);
            if (!textMateTokenInfo && !semanticTokenInfo) {
                dom.reset(this._domNode, 'No grammar or semantic tokens available.');
                return;
            }
            const tmMetadata = textMateTokenInfo?.metadata;
            const semMetadata = semanticTokenInfo?.metadata;
            const semTokenText = semanticTokenInfo && renderTokenText(this._model.getValueInRange(semanticTokenInfo.range));
            const tmTokenText = textMateTokenInfo && renderTokenText(this._model.getLineContent(position.lineNumber).substring(textMateTokenInfo.token.startIndex, textMateTokenInfo.token.endIndex));
            const tokenText = semTokenText || tmTokenText || '';
            dom.reset(this._domNode, $('h2.tiw-token', undefined, tokenText, $('span.tiw-token-length', undefined, `${tokenText.length} ${tokenText.length === 1 ? 'char' : 'chars'}`)));
            dom.append(this._domNode, $('hr.tiw-metadata-separator', { 'style': 'clear:both' }));
            dom.append(this._domNode, $('table.tiw-metadata-table', undefined, $('tbody', undefined, $('tr', undefined, $('td.tiw-metadata-key', undefined, 'language'), $('td.tiw-metadata-value', undefined, tmMetadata?.languageId || '')), $('tr', undefined, $('td.tiw-metadata-key', undefined, 'standard token type'), $('td.tiw-metadata-value', undefined, this._tokenTypeToString(tmMetadata?.tokenType || 0 /* StandardTokenType.Other */))), ...this._formatMetadata(semMetadata, tmMetadata))));
            if (semanticTokenInfo) {
                dom.append(this._domNode, $('hr.tiw-metadata-separator'));
                const table = dom.append(this._domNode, $('table.tiw-metadata-table', undefined));
                const tbody = dom.append(table, $('tbody', undefined, $('tr', undefined, $('td.tiw-metadata-key', undefined, 'semantic token type'), $('td.tiw-metadata-value', undefined, semanticTokenInfo.type))));
                if (semanticTokenInfo.modifiers.length) {
                    dom.append(tbody, $('tr', undefined, $('td.tiw-metadata-key', undefined, 'modifiers'), $('td.tiw-metadata-value', undefined, semanticTokenInfo.modifiers.join(' '))));
                }
                if (semanticTokenInfo.metadata) {
                    const properties = ['foreground', 'bold', 'italic', 'underline', 'strikethrough'];
                    const propertiesByDefValue = {};
                    const allDefValues = new Array(); // remember the order
                    // first collect to detect when the same rule is used for multiple properties
                    for (const property of properties) {
                        if (semanticTokenInfo.metadata[property] !== undefined) {
                            const definition = semanticTokenInfo.definitions[property];
                            const defValue = this._renderTokenStyleDefinition(definition, property);
                            const defValueStr = defValue.map(el => el instanceof HTMLElement ? el.outerHTML : el).join();
                            let properties = propertiesByDefValue[defValueStr];
                            if (!properties) {
                                propertiesByDefValue[defValueStr] = properties = [];
                                allDefValues.push([defValue, defValueStr]);
                            }
                            properties.push(property);
                        }
                    }
                    for (const [defValue, defValueStr] of allDefValues) {
                        dom.append(tbody, $('tr', undefined, $('td.tiw-metadata-key', undefined, propertiesByDefValue[defValueStr].join(', ')), $('td.tiw-metadata-value', undefined, ...defValue)));
                    }
                }
            }
            if (textMateTokenInfo) {
                const theme = this._themeService.getColorTheme();
                dom.append(this._domNode, $('hr.tiw-metadata-separator'));
                const table = dom.append(this._domNode, $('table.tiw-metadata-table'));
                const tbody = dom.append(table, $('tbody'));
                if (tmTokenText && tmTokenText !== tokenText) {
                    dom.append(tbody, $('tr', undefined, $('td.tiw-metadata-key', undefined, 'textmate token'), $('td.tiw-metadata-value', undefined, `${tmTokenText} (${tmTokenText.length})`)));
                }
                const scopes = new Array();
                for (let i = textMateTokenInfo.token.scopes.length - 1; i >= 0; i--) {
                    scopes.push(textMateTokenInfo.token.scopes[i]);
                    if (i > 0) {
                        scopes.push($('br'));
                    }
                }
                dom.append(tbody, $('tr', undefined, $('td.tiw-metadata-key', undefined, 'textmate scopes'), $('td.tiw-metadata-value.tiw-metadata-scopes', undefined, ...scopes)));
                const matchingRule = (0, TMHelper_1.findMatchingThemeRule)(theme, textMateTokenInfo.token.scopes, false);
                const semForeground = semanticTokenInfo?.metadata?.foreground;
                if (matchingRule) {
                    if (semForeground !== textMateTokenInfo.metadata.foreground) {
                        let defValue = $('code.tiw-theme-selector', undefined, matchingRule.rawSelector, $('br'), JSON.stringify(matchingRule.settings, null, '\t'));
                        if (semForeground) {
                            defValue = $('s', undefined, defValue);
                        }
                        dom.append(tbody, $('tr', undefined, $('td.tiw-metadata-key', undefined, 'foreground'), $('td.tiw-metadata-value', undefined, defValue)));
                    }
                }
                else if (!semForeground) {
                    dom.append(tbody, $('tr', undefined, $('td.tiw-metadata-key', undefined, 'foreground'), $('td.tiw-metadata-value', undefined, 'No theme selector')));
                }
            }
        }
        _formatMetadata(semantic, tm) {
            const elements = new Array();
            function render(property) {
                const value = semantic?.[property] || tm?.[property];
                if (value !== undefined) {
                    const semanticStyle = semantic?.[property] ? 'tiw-metadata-semantic' : '';
                    elements.push($('tr', undefined, $('td.tiw-metadata-key', undefined, property), $(`td.tiw-metadata-value.${semanticStyle}`, undefined, value)));
                }
                return value;
            }
            const foreground = render('foreground');
            const background = render('background');
            if (foreground && background) {
                const backgroundColor = color_1.Color.fromHex(background), foregroundColor = color_1.Color.fromHex(foreground);
                if (backgroundColor.isOpaque()) {
                    elements.push($('tr', undefined, $('td.tiw-metadata-key', undefined, 'contrast ratio'), $('td.tiw-metadata-value', undefined, backgroundColor.getContrastRatio(foregroundColor.makeOpaque(backgroundColor)).toFixed(2))));
                }
                else {
                    elements.push($('tr', undefined, $('td.tiw-metadata-key', undefined, 'Contrast ratio cannot be precise for background colors that use transparency'), $('td.tiw-metadata-value')));
                }
            }
            const fontStyleLabels = new Array();
            function addStyle(key) {
                let label;
                if (semantic && semantic[key]) {
                    label = $('span.tiw-metadata-semantic', undefined, key);
                }
                else if (tm && tm[key]) {
                    label = key;
                }
                if (label) {
                    if (fontStyleLabels.length) {
                        fontStyleLabels.push(' ');
                    }
                    fontStyleLabels.push(label);
                }
            }
            addStyle('bold');
            addStyle('italic');
            addStyle('underline');
            addStyle('strikethrough');
            if (fontStyleLabels.length) {
                elements.push($('tr', undefined, $('td.tiw-metadata-key', undefined, 'font style'), $('td.tiw-metadata-value', undefined, ...fontStyleLabels)));
            }
            return elements;
        }
        _decodeMetadata(metadata) {
            const colorMap = this._themeService.getColorTheme().tokenColorMap;
            const languageId = encodedTokenAttributes_1.TokenMetadata.getLanguageId(metadata);
            const tokenType = encodedTokenAttributes_1.TokenMetadata.getTokenType(metadata);
            const fontStyle = encodedTokenAttributes_1.TokenMetadata.getFontStyle(metadata);
            const foreground = encodedTokenAttributes_1.TokenMetadata.getForeground(metadata);
            const background = encodedTokenAttributes_1.TokenMetadata.getBackground(metadata);
            return {
                languageId: this._languageService.languageIdCodec.decodeLanguageId(languageId),
                tokenType: tokenType,
                bold: (fontStyle & 2 /* FontStyle.Bold */) ? true : undefined,
                italic: (fontStyle & 1 /* FontStyle.Italic */) ? true : undefined,
                underline: (fontStyle & 4 /* FontStyle.Underline */) ? true : undefined,
                strikethrough: (fontStyle & 8 /* FontStyle.Strikethrough */) ? true : undefined,
                foreground: colorMap[foreground],
                background: colorMap[background]
            };
        }
        _tokenTypeToString(tokenType) {
            switch (tokenType) {
                case 0 /* StandardTokenType.Other */: return 'Other';
                case 1 /* StandardTokenType.Comment */: return 'Comment';
                case 2 /* StandardTokenType.String */: return 'String';
                case 3 /* StandardTokenType.RegEx */: return 'RegEx';
                default: return '??';
            }
        }
        _getTokensAtPosition(grammar, position) {
            const lineNumber = position.lineNumber;
            const stateBeforeLine = this._getStateBeforeLine(grammar, lineNumber);
            const tokenizationResult1 = grammar.tokenizeLine(this._model.getLineContent(lineNumber), stateBeforeLine);
            const tokenizationResult2 = grammar.tokenizeLine2(this._model.getLineContent(lineNumber), stateBeforeLine);
            let token1Index = 0;
            for (let i = tokenizationResult1.tokens.length - 1; i >= 0; i--) {
                const t = tokenizationResult1.tokens[i];
                if (position.column - 1 >= t.startIndex) {
                    token1Index = i;
                    break;
                }
            }
            let token2Index = 0;
            for (let i = (tokenizationResult2.tokens.length >>> 1); i >= 0; i--) {
                if (position.column - 1 >= tokenizationResult2.tokens[(i << 1)]) {
                    token2Index = i;
                    break;
                }
            }
            return {
                token: tokenizationResult1.tokens[token1Index],
                metadata: this._decodeMetadata(tokenizationResult2.tokens[(token2Index << 1) + 1])
            };
        }
        _getStateBeforeLine(grammar, lineNumber) {
            let state = null;
            for (let i = 1; i < lineNumber; i++) {
                const tokenizationResult = grammar.tokenizeLine(this._model.getLineContent(i), state);
                state = tokenizationResult.ruleStack;
            }
            return state;
        }
        isSemanticTokens(token) {
            return token && token.data;
        }
        async _computeSemanticTokens(position) {
            if (!this._isSemanticColoringEnabled()) {
                return null;
            }
            const tokenProviders = this._languageFeaturesService.documentSemanticTokensProvider.ordered(this._model);
            if (tokenProviders.length) {
                const provider = tokenProviders[0];
                const tokens = await Promise.resolve(provider.provideDocumentSemanticTokens(this._model, null, this._currentRequestCancellationTokenSource.token));
                if (this.isSemanticTokens(tokens)) {
                    return { tokens, legend: provider.getLegend() };
                }
            }
            const rangeTokenProviders = this._languageFeaturesService.documentRangeSemanticTokensProvider.ordered(this._model);
            if (rangeTokenProviders.length) {
                const provider = rangeTokenProviders[0];
                const lineNumber = position.lineNumber;
                const range = new range_1.Range(lineNumber, 1, lineNumber, this._model.getLineMaxColumn(lineNumber));
                const tokens = await Promise.resolve(provider.provideDocumentRangeSemanticTokens(this._model, range, this._currentRequestCancellationTokenSource.token));
                if (this.isSemanticTokens(tokens)) {
                    return { tokens, legend: provider.getLegend() };
                }
            }
            return null;
        }
        _getSemanticTokenAtPosition(semanticTokens, pos) {
            const tokenData = semanticTokens.tokens.data;
            const defaultLanguage = this._model.getLanguageId();
            let lastLine = 0;
            let lastCharacter = 0;
            const posLine = pos.lineNumber - 1, posCharacter = pos.column - 1; // to 0-based position
            for (let i = 0; i < tokenData.length; i += 5) {
                const lineDelta = tokenData[i], charDelta = tokenData[i + 1], len = tokenData[i + 2], typeIdx = tokenData[i + 3], modSet = tokenData[i + 4];
                const line = lastLine + lineDelta; // 0-based
                const character = lineDelta === 0 ? lastCharacter + charDelta : charDelta; // 0-based
                if (posLine === line && character <= posCharacter && posCharacter < character + len) {
                    const type = semanticTokens.legend.tokenTypes[typeIdx] || 'not in legend (ignored)';
                    const modifiers = [];
                    let modifierSet = modSet;
                    for (let modifierIndex = 0; modifierSet > 0 && modifierIndex < semanticTokens.legend.tokenModifiers.length; modifierIndex++) {
                        if (modifierSet & 1) {
                            modifiers.push(semanticTokens.legend.tokenModifiers[modifierIndex]);
                        }
                        modifierSet = modifierSet >> 1;
                    }
                    if (modifierSet > 0) {
                        modifiers.push('not in legend (ignored)');
                    }
                    const range = new range_1.Range(line + 1, character + 1, line + 1, character + 1 + len);
                    const definitions = {};
                    const colorMap = this._themeService.getColorTheme().tokenColorMap;
                    const theme = this._themeService.getColorTheme();
                    const tokenStyle = theme.getTokenStyleMetadata(type, modifiers, defaultLanguage, true, definitions);
                    let metadata = undefined;
                    if (tokenStyle) {
                        metadata = {
                            languageId: undefined,
                            tokenType: 0 /* StandardTokenType.Other */,
                            bold: tokenStyle?.bold,
                            italic: tokenStyle?.italic,
                            underline: tokenStyle?.underline,
                            strikethrough: tokenStyle?.strikethrough,
                            foreground: colorMap[tokenStyle?.foreground || 0 /* ColorId.None */],
                            background: undefined
                        };
                    }
                    return { type, modifiers, range, metadata, definitions };
                }
                lastLine = line;
                lastCharacter = character;
            }
            return null;
        }
        _renderTokenStyleDefinition(definition, property) {
            const elements = new Array();
            if (definition === undefined) {
                return elements;
            }
            const theme = this._themeService.getColorTheme();
            if (Array.isArray(definition)) {
                const scopesDefinition = {};
                theme.resolveScopes(definition, scopesDefinition);
                const matchingRule = scopesDefinition[property];
                if (matchingRule && scopesDefinition.scope) {
                    const scopes = $('ul.tiw-metadata-values');
                    const strScopes = Array.isArray(matchingRule.scope) ? matchingRule.scope : [String(matchingRule.scope)];
                    for (const strScope of strScopes) {
                        scopes.appendChild($('li.tiw-metadata-value.tiw-metadata-scopes', undefined, strScope));
                    }
                    elements.push(scopesDefinition.scope.join(' '), scopes, $('code.tiw-theme-selector', undefined, JSON.stringify(matchingRule.settings, null, '\t')));
                    return elements;
                }
                return elements;
            }
            else if (tokenClassificationRegistry_1.SemanticTokenRule.is(definition)) {
                const scope = theme.getTokenStylingRuleScope(definition);
                if (scope === 'setting') {
                    elements.push(`User settings: ${definition.selector.id} - ${this._renderStyleProperty(definition.style, property)}`);
                    return elements;
                }
                else if (scope === 'theme') {
                    elements.push(`Color theme: ${definition.selector.id} - ${this._renderStyleProperty(definition.style, property)}`);
                    return elements;
                }
                return elements;
            }
            else {
                const style = theme.resolveTokenStyleValue(definition);
                elements.push(`Default: ${style ? this._renderStyleProperty(style, property) : ''}`);
                return elements;
            }
        }
        _renderStyleProperty(style, property) {
            switch (property) {
                case 'foreground': return style.foreground ? color_1.Color.Format.CSS.formatHexA(style.foreground, true) : '';
                default: return style[property] !== undefined ? String(style[property]) : '';
            }
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return {
                position: this._editor.getPosition(),
                preference: [2 /* ContentWidgetPositionPreference.BELOW */, 1 /* ContentWidgetPositionPreference.ABOVE */]
            };
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(InspectEditorTokensController.ID, InspectEditorTokensController, 4 /* EditorContributionInstantiation.Lazy */);
    (0, editorExtensions_1.registerEditorAction)(InspectEditorTokens);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdEVkaXRvclRva2Vucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL2luc3BlY3RFZGl0b3JUb2tlbnMvaW5zcGVjdEVkaXRvclRva2Vucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUErQmhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFaEIsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBOEIsU0FBUSxzQkFBVTs7aUJBRTlCLE9BQUUsR0FBRyxvQ0FBb0MsQUFBdkMsQ0FBd0M7UUFFMUQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUNwQyxPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQWdDLCtCQUE2QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hHLENBQUM7UUFXRCxZQUNDLE1BQW1CLEVBQ1csZUFBNkMsRUFDekQsZUFBaUMsRUFDM0IsWUFBb0MsRUFDdEMsbUJBQXlDLEVBQ3hDLG9CQUEyQyxFQUN4Qyx1QkFBaUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7WUFDeEMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG1CQUFtQixDQUFDO1lBQ2hELElBQUksQ0FBQyxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQztZQUNsRCxJQUFJLENBQUMsd0JBQXdCLEdBQUcsdUJBQXVCLENBQUM7WUFDeEQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJ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