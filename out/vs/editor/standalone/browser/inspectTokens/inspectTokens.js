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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/languages", "vs/editor/common/encodedTokenAttributes", "vs/editor/common/languages/nullTokenize", "vs/editor/common/languages/language", "vs/editor/standalone/common/standaloneTheme", "vs/editor/common/standaloneStrings", "vs/css!./inspectTokens"], function (require, exports, dom_1, color_1, lifecycle_1, editorExtensions_1, languages_1, encodedTokenAttributes_1, nullTokenize_1, language_1, standaloneTheme_1, standaloneStrings_1) {
    "use strict";
    var InspectTokensController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let InspectTokensController = class InspectTokensController extends lifecycle_1.Disposable {
        static { InspectTokensController_1 = this; }
        static { this.ID = 'editor.contrib.inspectTokens'; }
        static get(editor) {
            return editor.getContribution(InspectTokensController_1.ID);
        }
        constructor(editor, standaloneColorService, languageService) {
            super();
            this._editor = editor;
            this._languageService = languageService;
            this._widget = null;
            this._register(this._editor.onDidChangeModel((e) => this.stop()));
            this._register(this._editor.onDidChangeModelLanguage((e) => this.stop()));
            this._register(languages_1.TokenizationRegistry.onDidChange((e) => this.stop()));
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
            this._widget = new InspectTokensWidget(this._editor, this._languageService);
        }
        stop() {
            if (this._widget) {
                this._widget.dispose();
                this._widget = null;
            }
        }
    };
    InspectTokensController = InspectTokensController_1 = __decorate([
        __param(1, standaloneTheme_1.IStandaloneThemeService),
        __param(2, language_1.ILanguageService)
    ], InspectTokensController);
    class InspectTokens extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inspectTokens',
                label: standaloneStrings_1.InspectTokensNLS.inspectTokensAction,
                alias: 'Developer: Inspect Tokens',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            const controller = InspectTokensController.get(editor);
            controller?.launch();
        }
    }
    function renderTokenText(tokenText) {
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
    function getSafeTokenizationSupport(languageIdCodec, languageId) {
        const tokenizationSupport = languages_1.TokenizationRegistry.get(languageId);
        if (tokenizationSupport) {
            return tokenizationSupport;
        }
        const encodedLanguageId = languageIdCodec.encodeLanguageId(languageId);
        return {
            getInitialState: () => nullTokenize_1.NullState,
            tokenize: (line, hasEOL, state) => (0, nullTokenize_1.nullTokenize)(languageId, state),
            tokenizeEncoded: (line, hasEOL, state) => (0, nullTokenize_1.nullTokenizeEncoded)(encodedLanguageId, state)
        };
    }
    class InspectTokensWidget extends lifecycle_1.Disposable {
        static { this._ID = 'editor.contrib.inspectTokensWidget'; }
        constructor(editor, languageService) {
            super();
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this._editor = editor;
            this._languageService = languageService;
            this._model = this._editor.getModel();
            this._domNode = document.createElement('div');
            this._domNode.className = 'tokens-inspect-widget';
            this._tokenizationSupport = getSafeTokenizationSupport(this._languageService.languageIdCodec, this._model.getLanguageId());
            this._compute(this._editor.getPosition());
            this._register(this._editor.onDidChangeCursorPosition((e) => this._compute(this._editor.getPosition())));
            this._editor.addContentWidget(this);
        }
        dispose() {
            this._editor.removeContentWidget(this);
            super.dispose();
        }
        getId() {
            return InspectTokensWidget._ID;
        }
        _compute(position) {
            const data = this._getTokensAtLine(position.lineNumber);
            let token1Index = 0;
            for (let i = data.tokens1.length - 1; i >= 0; i--) {
                const t = data.tokens1[i];
                if (position.column - 1 >= t.offset) {
                    token1Index = i;
                    break;
                }
            }
            let token2Index = 0;
            for (let i = (data.tokens2.length >>> 1); i >= 0; i--) {
                if (position.column - 1 >= data.tokens2[(i << 1)]) {
                    token2Index = i;
                    break;
                }
            }
            const lineContent = this._model.getLineContent(position.lineNumber);
            let tokenText = '';
            if (token1Index < data.tokens1.length) {
                const tokenStartIndex = data.tokens1[token1Index].offset;
                const tokenEndIndex = token1Index + 1 < data.tokens1.length ? data.tokens1[token1Index + 1].offset : lineContent.length;
                tokenText = lineContent.substring(tokenStartIndex, tokenEndIndex);
            }
            (0, dom_1.reset)(this._domNode, (0, dom_1.$)('h2.tm-token', undefined, renderTokenText(tokenText), (0, dom_1.$)('span.tm-token-length', undefined, `${tokenText.length} ${tokenText.length === 1 ? 'char' : 'chars'}`)));
            (0, dom_1.append)(this._domNode, (0, dom_1.$)('hr.tokens-inspect-separator', { 'style': 'clear:both' }));
            const metadata = (token2Index << 1) + 1 < data.tokens2.length ? this._decodeMetadata(data.tokens2[(token2Index << 1) + 1]) : null;
            (0, dom_1.append)(this._domNode, (0, dom_1.$)('table.tm-metadata-table', undefined, (0, dom_1.$)('tbody', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'language'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? metadata.languageId : '-?-'}`)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'token type'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? this._tokenTypeToString(metadata.tokenType) : '-?-'}`)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'font style'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? this._fontStyleToString(metadata.fontStyle) : '-?-'}`)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'foreground'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? color_1.Color.Format.CSS.formatHex(metadata.foreground) : '-?-'}`)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'background'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? color_1.Color.Format.CSS.formatHex(metadata.background) : '-?-'}`)))));
            (0, dom_1.append)(this._domNode, (0, dom_1.$)('hr.tokens-inspect-separator'));
            if (token1Index < data.tokens1.length) {
                (0, dom_1.append)(this._domNode, (0, dom_1.$)('span.tm-token-type', undefined, data.tokens1[token1Index].type));
            }
            this._editor.layoutContentWidget(this);
        }
        _decodeMetadata(metadata) {
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const languageId = encodedTokenAttributes_1.TokenMetadata.getLanguageId(metadata);
            const tokenType = encodedTokenAttributes_1.TokenMetadata.getTokenType(metadata);
            const fontStyle = encodedTokenAttributes_1.TokenMetadata.getFontStyle(metadata);
            const foreground = encodedTokenAttributes_1.TokenMetadata.getForeground(metadata);
            const background = encodedTokenAttributes_1.TokenMetadata.getBackground(metadata);
            return {
                languageId: this._languageService.languageIdCodec.decodeLanguageId(languageId),
                tokenType: tokenType,
                fontStyle: fontStyle,
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
        _fontStyleToString(fontStyle) {
            let r = '';
            if (fontStyle & 1 /* FontStyle.Italic */) {
                r += 'italic ';
            }
            if (fontStyle & 2 /* FontStyle.Bold */) {
                r += 'bold ';
            }
            if (fontStyle & 4 /* FontStyle.Underline */) {
                r += 'underline ';
            }
            if (fontStyle & 8 /* FontStyle.Strikethrough */) {
                r += 'strikethrough ';
            }
            if (r.length === 0) {
                r = '---';
            }
            return r;
        }
        _getTokensAtLine(lineNumber) {
            const stateBeforeLine = this._getStateBeforeLine(lineNumber);
            const tokenizationResult1 = this._tokenizationSupport.tokenize(this._model.getLineContent(lineNumber), true, stateBeforeLine);
            const tokenizationResult2 = this._tokenizationSupport.tokenizeEncoded(this._model.getLineContent(lineNumber), true, stateBeforeLine);
            return {
                startState: stateBeforeLine,
                tokens1: tokenizationResult1.tokens,
                tokens2: tokenizationResult2.tokens,
                endState: tokenizationResult1.endState
            };
        }
        _getStateBeforeLine(lineNumber) {
            let state = this._tokenizationSupport.getInitialState();
            for (let i = 1; i < lineNumber; i++) {
                const tokenizationResult = this._tokenizationSupport.tokenize(this._model.getLineContent(i), true, state);
                state = tokenizationResult.endState;
            }
            return state;
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
    (0, editorExtensions_1.registerEditorContribution)(InspectTokensController.ID, InspectTokensController, 4 /* EditorContributionInstantiation.Lazy */);
    (0, editorExtensions_1.registerEditorAction)(InspectTokens);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdFRva2Vucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3N0YW5kYWxvbmUvYnJvd3Nlci9pbnNwZWN0VG9rZW5zL2luc3BlY3RUb2tlbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJoRyxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNCQUFVOztpQkFFeEIsT0FBRSxHQUFHLDhCQUE4QixBQUFqQyxDQUFrQztRQUVwRCxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQ3BDLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBMEIseUJBQXVCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQU1ELFlBQ0MsTUFBbUIsRUFDTSxzQkFBK0MsRUFDdEQsZUFBaUM7WUFFbkQsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBRXBCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQ0FBb0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFD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