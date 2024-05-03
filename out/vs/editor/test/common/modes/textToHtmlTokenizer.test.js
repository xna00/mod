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
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/textToHtmlTokenizer", "vs/editor/common/services/languagesRegistry", "vs/editor/test/common/core/testLineToken", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, utils_1, languages_1, language_1, textToHtmlTokenizer_1, languagesRegistry_1, testLineToken_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor Modes - textToHtmlTokenizer', () => {
        let disposables;
        let instantiationService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testTextModel_1.createModelServices)(disposables);
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function toStr(pieces) {
            const resultArr = pieces.map((t) => `<span class="${t.className}">${t.text}</span>`);
            return resultArr.join('');
        }
        test('TextToHtmlTokenizer 1', () => {
            const mode = disposables.add(instantiationService.createInstance(Mode));
            const support = languages_1.TokenizationRegistry.get(mode.languageId);
            const actual = (0, textToHtmlTokenizer_1._tokenizeToString)('.abc..def...gh', new languagesRegistry_1.LanguageIdCodec(), support);
            const expected = [
                { className: 'mtk7', text: '.' },
                { className: 'mtk9', text: 'abc' },
                { className: 'mtk7', text: '..' },
                { className: 'mtk9', text: 'def' },
                { className: 'mtk7', text: '...' },
                { className: 'mtk9', text: 'gh' },
            ];
            const expectedStr = `<div class="monaco-tokenized-source">${toStr(expected)}</div>`;
            assert.strictEqual(actual, expectedStr);
        });
        test('TextToHtmlTokenizer 2', () => {
            const mode = disposables.add(instantiationService.createInstance(Mode));
            const support = languages_1.TokenizationRegistry.get(mode.languageId);
            const actual = (0, textToHtmlTokenizer_1._tokenizeToString)('.abc..def...gh\n.abc..def...gh', new languagesRegistry_1.LanguageIdCodec(), support);
            const expected1 = [
                { className: 'mtk7', text: '.' },
                { className: 'mtk9', text: 'abc' },
                { className: 'mtk7', text: '..' },
                { className: 'mtk9', text: 'def' },
                { className: 'mtk7', text: '...' },
                { className: 'mtk9', text: 'gh' },
            ];
            const expected2 = [
                { className: 'mtk7', text: '.' },
                { className: 'mtk9', text: 'abc' },
                { className: 'mtk7', text: '..' },
                { className: 'mtk9', text: 'def' },
                { className: 'mtk7', text: '...' },
                { className: 'mtk9', text: 'gh' },
            ];
            const expectedStr1 = toStr(expected1);
            const expectedStr2 = toStr(expected2);
            const expectedStr = `<div class="monaco-tokenized-source">${expectedStr1}<br/>${expectedStr2}</div>`;
            assert.strictEqual(actual, expectedStr);
        });
        test('tokenizeLineToHTML', () => {
            const text = 'Ciao hello world!';
            const lineTokens = new testLineToken_1.TestLineTokens([
                new testLineToken_1.TestLineToken(4, ((3 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
                    | ((2 /* FontStyle.Bold */ | 1 /* FontStyle.Italic */) << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)) >>> 0),
                new testLineToken_1.TestLineToken(5, ((1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)) >>> 0),
                new testLineToken_1.TestLineToken(10, ((4 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)) >>> 0),
                new testLineToken_1.TestLineToken(11, ((1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)) >>> 0),
                new testLineToken_1.TestLineToken(17, ((5 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
                    | ((4 /* FontStyle.Underline */) << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)) >>> 0)
            ]);
            const colorMap = [null, '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'];
            assert.strictEqual((0, textToHtmlTokenizer_1.tokenizeLineToHTML)(text, lineTokens, colorMap, 0, 17, 4, true), [
                '<div>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">Ciao</span>',
                '<span style="color: #000000;"> </span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;"> </span>',
                '<span style="color: #0000ff;text-decoration: underline;">world!</span>',
                '</div>'
            ].join(''));
            assert.strictEqual((0, textToHtmlTokenizer_1.tokenizeLineToHTML)(text, lineTokens, colorMap, 0, 12, 4, true), [
                '<div>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">Ciao</span>',
                '<span style="color: #000000;"> </span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;"> </span>',
                '<span style="color: #0000ff;text-decoration: underline;">w</span>',
                '</div>'
            ].join(''));
            assert.strictEqual((0, textToHtmlTokenizer_1.tokenizeLineToHTML)(text, lineTokens, colorMap, 0, 11, 4, true), [
                '<div>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">Ciao</span>',
                '<span style="color: #000000;"> </span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;"> </span>',
                '</div>'
            ].join(''));
            assert.strictEqual((0, textToHtmlTokenizer_1.tokenizeLineToHTML)(text, lineTokens, colorMap, 1, 11, 4, true), [
                '<div>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">iao</span>',
                '<span style="color: #000000;"> </span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;"> </span>',
                '</div>'
            ].join(''));
            assert.strictEqual((0, textToHtmlTokenizer_1.tokenizeLineToHTML)(text, lineTokens, colorMap, 4, 11, 4, true), [
                '<div>',
                '<span style="color: #000000;">&#160;</span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;"> </span>',
                '</div>'
            ].join(''));
            assert.strictEqual((0, textToHtmlTokenizer_1.tokenizeLineToHTML)(text, lineTokens, colorMap, 5, 11, 4, true), [
                '<div>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;"> </span>',
                '</div>'
            ].join(''));
            assert.strictEqual((0, textToHtmlTokenizer_1.tokenizeLineToHTML)(text, lineTokens, colorMap, 5, 10, 4, true), [
                '<div>',
                '<span style="color: #00ff00;">hello</span>',
                '</div>'
            ].join(''));
            assert.strictEqual((0, textToHtmlTokenizer_1.tokenizeLineToHTML)(text, lineTokens, colorMap, 6, 9, 4, true), [
                '<div>',
                '<span style="color: #00ff00;">ell</span>',
                '</div>'
            ].join(''));
        });
        test('tokenizeLineToHTML handle spaces #35954', () => {
            const text = '  Ciao   hello world!';
            const lineTokens = new testLineToken_1.TestLineTokens([
                new testLineToken_1.TestLineToken(2, ((1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)) >>> 0),
                new testLineToken_1.TestLineToken(6, ((3 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
                    | ((2 /* FontStyle.Bold */ | 1 /* FontStyle.Italic */) << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)) >>> 0),
                new testLineToken_1.TestLineToken(9, ((1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)) >>> 0),
                new testLineToken_1.TestLineToken(14, ((4 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)) >>> 0),
                new testLineToken_1.TestLineToken(15, ((1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)) >>> 0),
                new testLineToken_1.TestLineToken(21, ((5 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
                    | ((4 /* FontStyle.Underline */) << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)) >>> 0)
            ]);
            const colorMap = [null, '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'];
            assert.strictEqual((0, textToHtmlTokenizer_1.tokenizeLineToHTML)(text, lineTokens, colorMap, 0, 21, 4, true), [
                '<div>',
                '<span style="color: #000000;">&#160; </span>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">Ciao</span>',
                '<span style="color: #000000;"> &#160; </span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;"> </span>',
                '<span style="color: #0000ff;text-decoration: underline;">world!</span>',
                '</div>'
            ].join(''));
            assert.strictEqual((0, textToHtmlTokenizer_1.tokenizeLineToHTML)(text, lineTokens, colorMap, 0, 17, 4, true), [
                '<div>',
                '<span style="color: #000000;">&#160; </span>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">Ciao</span>',
                '<span style="color: #000000;"> &#160; </span>',
                '<span style="color: #00ff00;">hello</span>',
                '<span style="color: #000000;"> </span>',
                '<span style="color: #0000ff;text-decoration: underline;">wo</span>',
                '</div>'
            ].join(''));
            assert.strictEqual((0, textToHtmlTokenizer_1.tokenizeLineToHTML)(text, lineTokens, colorMap, 0, 3, 4, true), [
                '<div>',
                '<span style="color: #000000;">&#160; </span>',
                '<span style="color: #ff0000;font-style: italic;font-weight: bold;">C</span>',
                '</div>'
            ].join(''));
        });
    });
    let Mode = class Mode extends lifecycle_1.Disposable {
        constructor(languageService) {
            super();
            this.languageId = 'textToHtmlTokenizerMode';
            this._register(languageService.registerLanguage({ id: this.languageId }));
            this._register(languages_1.TokenizationRegistry.register(this.languageId, {
                getInitialState: () => null,
                tokenize: undefined,
                tokenizeEncoded: (line, hasEOL, state) => {
                    const tokensArr = [];
                    let prevColor = -1;
                    for (let i = 0; i < line.length; i++) {
                        const colorId = (line.charAt(i) === '.' ? 7 : 9);
                        if (prevColor !== colorId) {
                            tokensArr.push(i);
                            tokensArr.push((colorId << 15 /* MetadataConsts.FOREGROUND_OFFSET */) >>> 0);
                        }
                        prevColor = colorId;
                    }
                    const tokens = new Uint32Array(tokensArr.length);
                    for (let i = 0; i < tokens.length; i++) {
                        tokens[i] = tokensArr[i];
                    }
                    return new languages_1.EncodedTokenizationResult(tokens, null);
                }
            }));
        }
    };
    Mode = __decorate([
        __param(0, language_1.ILanguageService)
    ], Mode);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFRvSHRtbFRva2VuaXplci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZXMvdGV4dFRvSHRtbFRva2VuaXplci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBY2hHLEtBQUssQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7UUFFaEQsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksb0JBQThDLENBQUM7UUFFbkQsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNwQyxvQkFBb0IsR0FBRyxJQUFBLG1DQUFtQixFQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3pELENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLEtBQUssQ0FBQyxNQUE2QztZQUMzRCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLFNBQVMsS0FBSyxDQUFDLENBQUMsSUFBSSxTQUFTLENBQUMsQ0FBQztZQUNyRixPQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUVELElBQUksQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7WUFDbEMsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN4RSxNQUFNLE9B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