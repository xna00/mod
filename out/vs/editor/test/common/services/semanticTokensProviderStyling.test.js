/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/editor/common/tokens/sparseMultilineTokens", "vs/editor/common/services/semanticTokensProviderStyling", "vs/editor/test/common/testTextModel", "vs/platform/theme/common/themeService", "vs/editor/common/languages/language", "vs/base/test/common/utils"], function (require, exports, assert, lifecycle_1, sparseMultilineTokens_1, semanticTokensProviderStyling_1, testTextModel_1, themeService_1, language_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ModelService', () => {
        let disposables;
        let instantiationService;
        let languageService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            languageService = instantiationService.get(language_1.ILanguageService);
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #134973: invalid semantic tokens should be handled better', () => {
            const languageId = 'java';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            const legend = {
                tokenTypes: ['st0', 'st1', 'st2', 'st3', 'st4', 'st5', 'st6', 'st7', 'st8', 'st9', 'st10'],
                tokenModifiers: []
            };
            instantiationService.stub(themeService_1.IThemeService, {
                getColorTheme() {
                    return {
                        getTokenStyleMetadata: (tokenType, tokenModifiers, languageId) => {
                            return {
                                foreground: parseInt(tokenType.substr(2), 10),
                                bold: undefined,
                                underline: undefined,
                                strikethrough: undefined,
                                italic: undefined
                            };
                        }
                    };
                }
            });
            const styling = instantiationService.createInstance(semanticTokensProviderStyling_1.SemanticTokensProviderStyling, legend);
            const badTokens = {
                data: new Uint32Array([
                    0, 13, 16, 1, 0,
                    1, 2, 6, 2, 0,
                    0, 7, 6, 3, 0,
                    0, 15, 8, 4, 0,
                    0, 17, 1, 5, 0,
                    0, 7, 5, 6, 0,
                    1, 12, 8, 7, 0,
                    0, 19, 5, 8, 0,
                    0, 7, 1, 9, 0,
                    0, 4294967294, 5, 10, 0
                ])
            };
            const result = (0, semanticTokensProviderStyling_1.toMultilineTokens2)(badTokens, styling, languageId);
            const expected = sparseMultilineTokens_1.SparseMultilineTokens.create(1, new Uint32Array([
                0, 13, 29, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 2, 8, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (2 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 9, 15, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (3 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 24, 32, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (4 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 41, 42, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (5 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 48, 53, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (6 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                2, 12, 20, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (7 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                2, 31, 36, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (8 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                2, 38, 39, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (9 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
            ]));
            assert.deepStrictEqual(result.toString(), expected.toString());
        });
        test('issue #148651: VSCode UI process can hang if a semantic token with negative values is returned by language service', () => {
            const languageId = 'dockerfile';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            const legend = {
                tokenTypes: ['st0', 'st1', 'st2', 'st3', 'st4', 'st5', 'st6', 'st7', 'st8', 'st9'],
                tokenModifiers: ['stm0', 'stm1', 'stm2']
            };
            instantiationService.stub(themeService_1.IThemeService, {
                getColorTheme() {
                    return {
                        getTokenStyleMetadata: (tokenType, tokenModifiers, languageId) => {
                            return {
                                foreground: parseInt(tokenType.substr(2), 10),
                                bold: undefined,
                                underline: undefined,
                                strikethrough: undefined,
                                italic: undefined
                            };
                        }
                    };
                }
            });
            const styling = instantiationService.createInstance(semanticTokensProviderStyling_1.SemanticTokensProviderStyling, legend);
            const badTokens = {
                data: new Uint32Array([
                    0, 0, 3, 0, 0,
                    0, 4, 2, 2, 0,
                    0, 2, 3, 8, 0,
                    0, 3, 1, 9, 0,
                    0, 1, 1, 10, 0,
                    0, 1, 4, 8, 0,
                    0, 4, 4294967292, 2, 0,
                    0, 4294967292, 4294967294, 8, 0,
                    0, 4294967294, 1, 9, 0,
                    0, 1, 1, 10, 0,
                    0, 1, 3, 8, 0,
                    0, 3, 4294967291, 8, 0,
                    0, 4294967291, 1, 9, 0,
                    0, 1, 1, 10, 0,
                    0, 1, 4, 8, 0
                ])
            };
            const result = (0, semanticTokensProviderStyling_1.toMultilineTokens2)(badTokens, styling, languageId);
            const expected = sparseMultilineTokens_1.SparseMultilineTokens.create(1, new Uint32Array([
                0, 4, 6, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                0, 6, 9, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (2 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                0, 9, 10, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (3 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                0, 11, 15, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (4 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
            ]));
            assert.deepStrictEqual(result.toString(), expected.toString());
        });
        test('issue #149130: vscode freezes because of Bracket Pair Colorization', () => {
            const languageId = 'q';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            const legend = {
                tokenTypes: ['st0', 'st1', 'st2', 'st3', 'st4', 'st5'],
                tokenModifiers: ['stm0', 'stm1', 'stm2']
            };
            instantiationService.stub(themeService_1.IThemeService, {
                getColorTheme() {
                    return {
                        getTokenStyleMetadata: (tokenType, tokenModifiers, languageId) => {
                            return {
                                foreground: parseInt(tokenType.substr(2), 10),
                                bold: undefined,
                                underline: undefined,
                                strikethrough: undefined,
                                italic: undefined
                            };
                        }
                    };
                }
            });
            const styling = instantiationService.createInstance(semanticTokensProviderStyling_1.SemanticTokensProviderStyling, legend);
            const badTokens = {
                data: new Uint32Array([
                    0, 11, 1, 1, 0,
                    0, 4, 1, 1, 0,
                    0, 4294967289, 1, 1, 0
                ])
            };
            const result = (0, semanticTokensProviderStyling_1.toMultilineTokens2)(badTokens, styling, languageId);
            const expected = sparseMultilineTokens_1.SparseMultilineTokens.create(1, new Uint32Array([
                0, 11, 12, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                0, 15, 16, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
            ]));
            assert.deepStrictEqual(result.toString(), expected.toString());
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VtYW50aWNUb2tlbnNQcm92aWRlclN0eWxpbmcudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL3NlcnZpY2VzL3NlbWFudGljVG9rZW5zUHJvdmlkZXJTdHlsaW5nLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7UUFDMUIsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksb0JBQThDLENBQUM7UUFDbkQsSUFBSSxlQUFpQyxDQUFDO1FBRXRDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDcEMsb0JBQW9CLEdBQUcsSUFBQSxtQ0FBbUIsRUFBQyxXQUFXLENBQUMsQ0FBQztZQUN4RCxlQUFlLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDJCQUFnQixDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxpRUFBaUUsRUFBRSxHQUFHLEVBQUU7WUFDNUUsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDO1lBQzFCLFdBQVcsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RSxNQUFNLE1BQU0sR0FBRztnQkFDZCxVQUFVLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtB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