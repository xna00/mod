/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/languages", "vs/editor/common/languages/supports/tokenization", "vs/editor/common/services/languageService", "vs/editor/standalone/browser/standaloneLanguages", "vs/platform/theme/browser/iconsStyleSheet", "vs/platform/theme/common/theme"], function (require, exports, assert, event_1, lifecycle_1, utils_1, languages_1, tokenization_1, languageService_1, standaloneLanguages_1, iconsStyleSheet_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TokenizationSupport2Adapter', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const languageId = 'tttt';
        // const tokenMetadata = (LanguageId.PlainText << MetadataConsts.LANGUAGEID_OFFSET);
        class MockTokenTheme extends tokenization_1.TokenTheme {
            constructor() {
                super(null, null);
                this.counter = 0;
            }
            match(languageId, token) {
                return (((this.counter++) << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
                    | (languageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)) >>> 0;
            }
        }
        class MockThemeService {
            constructor() {
                this._builtInProductIconTheme = new iconsStyleSheet_1.UnthemedProductIconTheme();
                this.onDidColorThemeChange = new event_1.Emitter().event;
                this.onDidFileIconThemeChange = new event_1.Emitter().event;
                this.onDidProductIconThemeChange = new event_1.Emitter().event;
            }
            setTheme(themeName) {
                throw new Error('Not implemented');
            }
            setAutoDetectHighContrast(autoDetectHighContrast) {
                throw new Error('Not implemented');
            }
            defineTheme(themeName, themeData) {
                throw new Error('Not implemented');
            }
            getColorTheme() {
                return {
                    label: 'mock',
                    tokenTheme: new MockTokenTheme(),
                    themeName: theme_1.ColorScheme.LIGHT,
                    type: theme_1.ColorScheme.LIGHT,
                    getColor: (color, useDefault) => {
                        throw new Error('Not implemented');
                    },
                    defines: (color) => {
                        throw new Error('Not implemented');
                    },
                    getTokenStyleMetadata: (type, modifiers, modelLanguage) => {
                        return undefined;
                    },
                    semanticHighlighting: false,
                    tokenColorMap: []
                };
            }
            setColorMapOverride(colorMapOverride) {
            }
            getFileIconTheme() {
                return {
                    hasFileIcons: false,
                    hasFolderIcons: false,
                    hidesExplorerArrows: false
                };
            }
            getProductIconTheme() {
                return this._builtInProductIconTheme;
            }
        }
        class MockState {
            static { this.INSTANCE = new MockState(); }
            constructor() { }
            clone() {
                return this;
            }
            equals(other) {
                return this === other;
            }
        }
        function testBadTokensProvider(providerTokens, expectedClassicTokens, expectedModernTokens) {
            class BadTokensProvider {
                getInitialState() {
                    return MockState.INSTANCE;
                }
                tokenize(line, state) {
                    return {
                        tokens: providerTokens,
                        endState: MockState.INSTANCE
                    };
                }
            }
            const disposables = new lifecycle_1.DisposableStore();
            const languageService = disposables.add(new languageService_1.LanguageService());
            disposables.add(languageService.registerLanguage({ id: languageId }));
            const adapter = new standaloneLanguages_1.TokenizationSupportAdapter(languageId, new BadTokensProvider(), languageService, new MockThemeService());
            const actualClassicTokens = adapter.tokenize('whatever', true, MockState.INSTANCE);
            assert.deepStrictEqual(actualClassicTokens.tokens, expectedClassicTokens);
            const actualModernTokens = adapter.tokenizeEncoded('whatever', true, MockState.INSTANCE);
            const modernTokens = [];
            for (let i = 0; i < actualModernTokens.tokens.length; i++) {
                modernTokens[i] = actualModernTokens.tokens[i];
            }
            // Add the encoded language id to the expected tokens
            const encodedLanguageId = languageService.languageIdCodec.encodeLanguageId(languageId);
            const tokenLanguageMetadata = (encodedLanguageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */);
            for (let i = 1; i < expectedModernTokens.length; i += 2) {
                expectedModernTokens[i] |= tokenLanguageMetadata;
            }
            assert.deepStrictEqual(modernTokens, expectedModernTokens);
            disposables.dispose();
        }
        test('tokens always start at index 0', () => {
            testBadTokensProvider([
                { startIndex: 7, scopes: 'foo' },
                { startIndex: 0, scopes: 'bar' }
            ], [
                new languages_1.Token(0, 'foo', languageId),
                new languages_1.Token(0, 'bar', languageId),
            ], [
                0, (0 << 15 /* MetadataConsts.FOREGROUND_OFFSET */) | 1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */,
                0, (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */) | 1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */
            ]);
        });
        test('tokens always start after each other', () => {
            testBadTokensProvider([
                { startIndex: 0, scopes: 'foo' },
                { startIndex: 5, scopes: 'bar' },
                { startIndex: 3, scopes: 'foo' },
            ], [
                new languages_1.Token(0, 'foo', languageId),
                new languages_1.Token(5, 'bar', languageId),
                new languages_1.Token(5, 'foo', languageId),
            ], [
                0, (0 << 15 /* MetadataConsts.FOREGROUND_OFFSET */) | 1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */,
                5, (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */) | 1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */,
                5, (2 << 15 /* MetadataConsts.FOREGROUND_OFFSET */) | 1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUxhbmd1YWdlcy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3Ivc3RhbmRhbG9uZS90ZXN0L2Jyb3dzZXIvc3RhbmRhbG9uZUxhbmd1YWdlcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0JoRyxLQUFLLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1FBRXpDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUM7UUFDMUIsb0ZBQW9GO1FBRXBGLE1BQU0sY0FBZSxTQUFRLHlCQUFVO1lBRXRDO2dCQUNDLEtBQUssQ0FBQyxJQUFLLEVBQUUsSUFBSyxDQUFDLENBQUM7Z0JBRmIsWUFBTyxHQUFHLENBQUMsQ0FBQztZQUdwQixDQUFDO1lBQ2UsS0FBSyxDQUFDLFVBQXNCLEVBQUUsS0FBYTtnQkFDMUQsT0FBTyxDQUNOLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsNkNBQW9DLENBQUM7c0JBQ3BELENBQUMsVUFBVSw0Q0FBb0MsQ0FBQyxDQUNsRCxLQUFLLENBQUMsQ0FBQztZQUNULENBQUM7U0FDRDtRQUVELE1BQU0sZ0JBQWdCO1lBQXRCO2dCQWdEUyw2QkFBd0IsR0FBRyxJQUFJLDBDQUF3QixFQUFFLENBQUM7Z0JBS2xELDBCQUFxQixHQUFHLElBQUksZUFBTyxFQUFlLENBQUMsS0FBSyxDQUFDO2dCQUN6RCw2QkFBd0IsR0FBRyxJQUFJLGVBQU8sRUFBa0IsQ0FBQyxLQUFLLENBQUM7Z0JBQy9ELGdDQUEyQixHQUFHLElBQUksZUFBTyxFQUFxQixDQUFDLEtBQUssQ0FBQztZQUN0RixDQUFDO1lBdERPLFFBQVEsQ0FBQyxTQUFpQjtnQkFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIs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