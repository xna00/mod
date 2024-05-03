/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/languages/supports/tokenization"], function (require, exports, assert, utils_1, tokenization_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Token theme matching', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('gives higher priority to deeper matches', () => {
            const theme = tokenization_1.TokenTheme.createFromRawTokenTheme([
                { token: '', foreground: '100000', background: '200000' },
                { token: 'punctuation.definition.string.begin.html', foreground: '300000' },
                { token: 'punctuation.definition.string', foreground: '400000' },
            ], []);
            const colorMap = new tokenization_1.ColorMap();
            colorMap.getId('100000');
            const _B = colorMap.getId('200000');
            colorMap.getId('400000');
            const _D = colorMap.getId('300000');
            const actual = theme._match('punctuation.definition.string.begin.html');
            assert.deepStrictEqual(actual, new tokenization_1.ThemeTrieElementRule(0 /* FontStyle.None */, _D, _B));
        });
        test('can match', () => {
            const theme = tokenization_1.TokenTheme.createFromRawTokenTheme([
                { token: '', foreground: 'F8F8F2', background: '272822' },
                { token: 'source', background: '100000' },
                { token: 'something', background: '100000' },
                { token: 'bar', background: '200000' },
                { token: 'baz', background: '200000' },
                { token: 'bar', fontStyle: 'bold' },
                { token: 'constant', fontStyle: 'italic', foreground: '300000' },
                { token: 'constant.numeric', foreground: '400000' },
                { token: 'constant.numeric.hex', fontStyle: 'bold' },
                { token: 'constant.numeric.oct', fontStyle: 'bold italic underline' },
                { token: 'constant.numeric.bin', fontStyle: 'bold strikethrough' },
                { token: 'constant.numeric.dec', fontStyle: '', foreground: '500000' },
                { token: 'storage.object.bar', fontStyle: '', foreground: '600000' },
            ], []);
            const colorMap = new tokenization_1.ColorMap();
            const _A = colorMap.getId('F8F8F2');
            const _B = colorMap.getId('272822');
            const _C = colorMap.getId('200000');
            const _D = colorMap.getId('300000');
            const _E = colorMap.getId('400000');
            const _F = colorMap.getId('500000');
            const _G = colorMap.getId('100000');
            const _H = colorMap.getId('600000');
            function assertMatch(scopeName, expected) {
                const actual = theme._match(scopeName);
                assert.deepStrictEqual(actual, expected, 'when matching <<' + scopeName + '>>');
            }
            function assertSimpleMatch(scopeName, fontStyle, foreground, background) {
                assertMatch(scopeName, new tokenization_1.ThemeTrieElementRule(fontStyle, foreground, background));
            }
            function assertNoMatch(scopeName) {
                assertMatch(scopeName, new tokenization_1.ThemeTrieElementRule(0 /* FontStyle.None */, _A, _B));
            }
            // matches defaults
            assertNoMatch('');
            assertNoMatch('bazz');
            assertNoMatch('asdfg');
            // matches source
            assertSimpleMatch('source', 0 /* FontStyle.None */, _A, _G);
            assertSimpleMatch('source.ts', 0 /* FontStyle.None */, _A, _G);
            assertSimpleMatch('source.tss', 0 /* FontStyle.None */, _A, _G);
            // matches something
            assertSimpleMatch('something', 0 /* FontStyle.None */, _A, _G);
            assertSimpleMatch('something.ts', 0 /* FontStyle.None */, _A, _G);
            assertSimpleMatch('something.tss', 0 /* FontStyle.None */, _A, _G);
            // matches baz
            assertSimpleMatch('baz', 0 /* FontStyle.None */, _A, _C);
            assertSimpleMatch('baz.ts', 0 /* FontStyle.None */, _A, _C);
            assertSimpleMatch('baz.tss', 0 /* FontStyle.None */, _A, _C);
            // matches constant
            assertSimpleMatch('constant', 1 /* FontStyle.Italic */, _D, _B);
            assertSimpleMatch('constant.string', 1 /* FontStyle.Italic */, _D, _B);
            assertSimpleMatch('constant.hex', 1 /* FontStyle.Italic */, _D, _B);
            // matches constant.numeric
            assertSimpleMatch('constant.numeric', 1 /* FontStyle.Italic */, _E, _B);
            assertSimpleMatch('constant.numeric.baz', 1 /* FontStyle.Italic */, _E, _B);
            // matches constant.numeric.hex
            assertSimpleMatch('constant.numeric.hex', 2 /* FontStyle.Bold */, _E, _B);
            assertSimpleMatch('constant.numeric.hex.baz', 2 /* FontStyle.Bold */, _E, _B);
            // matches constant.numeric.oct
            assertSimpleMatch('constant.numeric.oct', 2 /* FontStyle.Bold */ | 1 /* FontStyle.Italic */ | 4 /* FontStyle.Underline */, _E, _B);
            assertSimpleMatch('constant.numeric.oct.baz', 2 /* FontStyle.Bold */ | 1 /* FontStyle.Italic */ | 4 /* FontStyle.Underline */, _E, _B);
            // matches constant.numeric.bin
            assertSimpleMatch('constant.numeric.bin', 2 /* FontStyle.Bold */ | 8 /* FontStyle.Strikethrough */, _E, _B);
            assertSimpleMatch('constant.numeric.bin.baz', 2 /* FontStyle.Bold */ | 8 /* FontStyle.Strikethrough */, _E, _B);
            // matches constant.numeric.dec
            assertSimpleMatch('constant.numeric.dec', 0 /* FontStyle.None */, _F, _B);
            assertSimpleMatch('constant.numeric.dec.baz', 0 /* FontStyle.None */, _F, _B);
            // matches storage.object.bar
            assertSimpleMatch('storage.object.bar', 0 /* FontStyle.None */, _H, _B);
            assertSimpleMatch('storage.object.bar.baz', 0 /* FontStyle.None */, _H, _B);
            // does not match storage.object.bar
            assertSimpleMatch('storage.object.bart', 0 /* FontStyle.None */, _A, _B);
            assertSimpleMatch('storage.object', 0 /* FontStyle.None */, _A, _B);
            assertSimpleMatch('storage', 0 /* FontStyle.None */, _A, _B);
            assertSimpleMatch('bar', 2 /* FontStyle.Bold */, _A, _C);
        });
    });
    suite('Token theme parsing', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('can parse', () => {
            const actual = (0, tokenization_1.parseTokenTheme)([
                { token: '', foreground: 'F8F8F2', background: '272822' },
                { token: 'source', background: '100000' },
                { token: 'something', background: '100000' },
                { token: 'bar', background: '010000' },
                { token: 'baz', background: '010000' },
                { token: 'bar', fontStyle: 'bold' },
                { token: 'constant', fontStyle: 'italic', foreground: 'ff0000' },
                { token: 'constant.numeric', foreground: '00ff00' },
                { token: 'constant.numeric.hex', fontStyle: 'bold' },
                { token: 'constant.numeric.oct', fontStyle: 'bold italic underline' },
                { token: 'constant.numeric.dec', fontStyle: '', foreground: '0000ff' },
            ]);
            const expected = [
                new tokenization_1.ParsedTokenThemeRule('', 0, -1 /* FontStyle.NotSet */, 'F8F8F2', '272822'),
                new tokenization_1.ParsedTokenThemeRule('source', 1, -1 /* FontStyle.NotSet */, null, '100000'),
                new tokenization_1.ParsedTokenThemeRule('something', 2, -1 /* FontStyle.NotSet */, null, '100000'),
                new tokenization_1.ParsedTokenThemeRule('bar', 3, -1 /* FontStyle.NotSet */, null, '010000'),
                new tokenization_1.ParsedTokenThemeRule('baz', 4, -1 /* FontStyle.NotSet */, null, '010000'),
                new tokenization_1.ParsedTokenThemeRule('bar', 5, 2 /* FontStyle.Bold */, null, null),
                new tokenization_1.ParsedTokenThemeRule('constant', 6, 1 /* FontStyle.Italic */, 'ff0000', null),
                new tokenization_1.ParsedTokenThemeRule('constant.numeric', 7, -1 /* FontStyle.NotSet */, '00ff00', null),
                new tokenization_1.ParsedTokenThemeRule('constant.numeric.hex', 8, 2 /* FontStyle.Bold */, null, null),
                new tokenization_1.ParsedTokenThemeRule('constant.numeric.oct', 9, 2 /* FontStyle.Bold */ | 1 /* FontStyle.Italic */ | 4 /* FontStyle.Underline */, null, null),
                new tokenization_1.ParsedTokenThemeRule('constant.numeric.dec', 10, 0 /* FontStyle.None */, '0000ff', null),
            ];
            assert.deepStrictEqual(actual, expected);
        });
    });
    suite('Token theme resolving', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('strcmp works', () => {
            const actual = ['bar', 'z', 'zu', 'a', 'ab', ''].sort(tokenization_1.strcmp);
            const expected = ['', 'a', 'ab', 'bar', 'z', 'zu'];
            assert.deepStrictEqual(actual, expected);
        });
        test('always has defaults', () => {
            const actual = tokenization_1.TokenTheme.createFromParsedTokenTheme([], []);
            const colorMap = new tokenization_1.ColorMap();
            const _A = colorMap.getId('000000');
            const _B = colorMap.getId('ffffff');
            assert.deepStrictEqual(actual.getColorMap(), colorMap.getColorMap());
            assert.deepStrictEqual(actual.getThemeTrieElement(), new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(0 /* FontStyle.None */, _A, _B)));
        });
        test('respects incoming defaults 1', () => {
            const actual = tokenization_1.TokenTheme.createFromParsedTokenTheme([
                new tokenization_1.ParsedTokenThemeRule('', -1, -1 /* FontStyle.NotSet */, null, null)
            ], []);
            const colorMap = new tokenization_1.ColorMap();
            const _A = colorMap.getId('000000');
            const _B = colorMap.getId('ffffff');
            assert.deepStrictEqual(actual.getColorMap(), colorMap.getColorMap());
            assert.deepStrictEqual(actual.getThemeTrieElement(), new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(0 /* FontStyle.None */, _A, _B)));
        });
        test('respects incoming defaults 2', () => {
            const actual = tokenization_1.TokenTheme.createFromParsedTokenTheme([
                new tokenization_1.ParsedTokenThemeRule('', -1, 0 /* FontStyle.None */, null, null)
            ], []);
            const colorMap = new tokenization_1.ColorMap();
            const _A = colorMap.getId('000000');
            const _B = colorMap.getId('ffffff');
            assert.deepStrictEqual(actual.getColorMap(), colorMap.getColorMap());
            assert.deepStrictEqual(actual.getThemeTrieElement(), new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(0 /* FontStyle.None */, _A, _B)));
        });
        test('respects incoming defaults 3', () => {
            const actual = tokenization_1.TokenTheme.createFromParsedTokenTheme([
                new tokenization_1.ParsedTokenThemeRule('', -1, 2 /* FontStyle.Bold */, null, null)
            ], []);
            const colorMap = new tokenization_1.ColorMap();
            const _A = colorMap.getId('000000');
            const _B = colorMap.getId('ffffff');
            assert.deepStrictEqual(actual.getColorMap(), colorMap.getColorMap());
            assert.deepStrictEqual(actual.getThemeTrieElement(), new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(2 /* FontStyle.Bold */, _A, _B)));
        });
        test('respects incoming defaults 4', () => {
            const actual = tokenization_1.TokenTheme.createFromParsedTokenTheme([
                new tokenization_1.ParsedTokenThemeRule('', -1, -1 /* FontStyle.NotSet */, 'ff0000', null)
            ], []);
            const colorMap = new tokenization_1.ColorMap();
            const _A = colorMap.getId('ff0000');
            const _B = colorMap.getId('ffffff');
            assert.deepStrictEqual(actual.getColorMap(), colorMap.getColorMap());
            assert.deepStrictEqual(actual.getThemeTrieElement(), new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(0 /* FontStyle.None */, _A, _B)));
        });
        test('respects incoming defaults 5', () => {
            const actual = tokenization_1.TokenTheme.createFromParsedTokenTheme([
                new tokenization_1.ParsedTokenThemeRule('', -1, -1 /* FontStyle.NotSet */, null, 'ff0000')
            ], []);
            const colorMap = new tokenization_1.ColorMap();
            const _A = colorMap.getId('000000');
            const _B = colorMap.getId('ff0000');
            assert.deepStrictEqual(actual.getColorMap(), colorMap.getColorMap());
            assert.deepStrictEqual(actual.getThemeTrieElement(), new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(0 /* FontStyle.None */, _A, _B)));
        });
        test('can merge incoming defaults', () => {
            const actual = tokenization_1.TokenTheme.createFromParsedTokenTheme([
                new tokenization_1.ParsedTokenThemeRule('', -1, -1 /* FontStyle.NotSet */, null, 'ff0000'),
                new tokenization_1.ParsedTokenThemeRule('', -1, -1 /* FontStyle.NotSet */, '00ff00', null),
                new tokenization_1.ParsedTokenThemeRule('', -1, 2 /* FontStyle.Bold */, null, null),
            ], []);
            const colorMap = new tokenization_1.ColorMap();
            const _A = colorMap.getId('00ff00');
            const _B = colorMap.getId('ff0000');
            assert.deepStrictEqual(actual.getColorMap(), colorMap.getColorMap());
            assert.deepStrictEqual(actual.getThemeTrieElement(), new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(2 /* FontStyle.Bold */, _A, _B)));
        });
        test('defaults are inherited', () => {
            const actual = tokenization_1.TokenTheme.createFromParsedTokenTheme([
                new tokenization_1.ParsedTokenThemeRule('', -1, -1 /* FontStyle.NotSet */, 'F8F8F2', '272822'),
                new tokenization_1.ParsedTokenThemeRule('var', -1, -1 /* FontStyle.NotSet */, 'ff0000', null)
            ], []);
            const colorMap = new tokenization_1.ColorMap();
            const _A = colorMap.getId('F8F8F2');
            const _B = colorMap.getId('272822');
            const _C = colorMap.getId('ff0000');
            assert.deepStrictEqual(actual.getColorMap(), colorMap.getColorMap());
            const root = new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(0 /* FontStyle.None */, _A, _B), {
                'var': new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(0 /* FontStyle.None */, _C, _B))
            });
            assert.deepStrictEqual(actual.getThemeTrieElement(), root);
        });
        test('same rules get merged', () => {
            const actual = tokenization_1.TokenTheme.createFromParsedTokenTheme([
                new tokenization_1.ParsedTokenThemeRule('', -1, -1 /* FontStyle.NotSet */, 'F8F8F2', '272822'),
                new tokenization_1.ParsedTokenThemeRule('var', 1, 2 /* FontStyle.Bold */, null, null),
                new tokenization_1.ParsedTokenThemeRule('var', 0, -1 /* FontStyle.NotSet */, 'ff0000', null),
            ], []);
            const colorMap = new tokenization_1.ColorMap();
            const _A = colorMap.getId('F8F8F2');
            const _B = colorMap.getId('272822');
            const _C = colorMap.getId('ff0000');
            assert.deepStrictEqual(actual.getColorMap(), colorMap.getColorMap());
            const root = new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(0 /* FontStyle.None */, _A, _B), {
                'var': new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(2 /* FontStyle.Bold */, _C, _B))
            });
            assert.deepStrictEqual(actual.getThemeTrieElement(), root);
        });
        test('rules are inherited 1', () => {
            const actual = tokenization_1.TokenTheme.createFromParsedTokenTheme([
                new tokenization_1.ParsedTokenThemeRule('', -1, -1 /* FontStyle.NotSet */, 'F8F8F2', '272822'),
                new tokenization_1.ParsedTokenThemeRule('var', -1, 2 /* FontStyle.Bold */, 'ff0000', null),
                new tokenization_1.ParsedTokenThemeRule('var.identifier', -1, -1 /* FontStyle.NotSet */, '00ff00', null),
            ], []);
            const colorMap = new tokenization_1.ColorMap();
            const _A = colorMap.getId('F8F8F2');
            const _B = colorMap.getId('272822');
            const _C = colorMap.getId('ff0000');
            const _D = colorMap.getId('00ff00');
            assert.deepStrictEqual(actual.getColorMap(), colorMap.getColorMap());
            const root = new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(0 /* FontStyle.None */, _A, _B), {
                'var': new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(2 /* FontStyle.Bold */, _C, _B), {
                    'identifier': new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(2 /* FontStyle.Bold */, _D, _B))
                })
            });
            assert.deepStrictEqual(actual.getThemeTrieElement(), root);
        });
        test('rules are inherited 2', () => {
            const actual = tokenization_1.TokenTheme.createFromParsedTokenTheme([
                new tokenization_1.ParsedTokenThemeRule('', -1, -1 /* FontStyle.NotSet */, 'F8F8F2', '272822'),
                new tokenization_1.ParsedTokenThemeRule('var', -1, 2 /* FontStyle.Bold */, 'ff0000', null),
                new tokenization_1.ParsedTokenThemeRule('var.identifier', -1, -1 /* FontStyle.NotSet */, '00ff00', null),
                new tokenization_1.ParsedTokenThemeRule('constant', 4, 1 /* FontStyle.Italic */, '100000', null),
                new tokenization_1.ParsedTokenThemeRule('constant.numeric', 5, -1 /* FontStyle.NotSet */, '200000', null),
                new tokenization_1.ParsedTokenThemeRule('constant.numeric.hex', 6, 2 /* FontStyle.Bold */, null, null),
                new tokenization_1.ParsedTokenThemeRule('constant.numeric.oct', 7, 2 /* FontStyle.Bold */ | 1 /* FontStyle.Italic */ | 4 /* FontStyle.Underline */, null, null),
                new tokenization_1.ParsedTokenThemeRule('constant.numeric.dec', 8, 0 /* FontStyle.None */, '300000', null),
            ], []);
            const colorMap = new tokenization_1.ColorMap();
            const _A = colorMap.getId('F8F8F2');
            const _B = colorMap.getId('272822');
            const _C = colorMap.getId('100000');
            const _D = colorMap.getId('200000');
            const _E = colorMap.getId('300000');
            const _F = colorMap.getId('ff0000');
            const _G = colorMap.getId('00ff00');
            assert.deepStrictEqual(actual.getColorMap(), colorMap.getColorMap());
            const root = new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(0 /* FontStyle.None */, _A, _B), {
                'var': new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(2 /* FontStyle.Bold */, _F, _B), {
                    'identifier': new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(2 /* FontStyle.Bold */, _G, _B))
                }),
                'constant': new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(1 /* FontStyle.Italic */, _C, _B), {
                    'numeric': new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(1 /* FontStyle.Italic */, _D, _B), {
                        'hex': new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(2 /* FontStyle.Bold */, _D, _B)),
                        'oct': new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(2 /* FontStyle.Bold */ | 1 /* FontStyle.Italic */ | 4 /* FontStyle.Underline */, _D, _B)),
                        'dec': new tokenization_1.ExternalThemeTrieElement(new tokenization_1.ThemeTrieElementRule(0 /* FontStyle.None */, _E, _B)),
                    })
                })
            });
            assert.deepStrictEqual(actual.getThemeTrieElement(), root);
        });
        test('custom colors are first in color map', () => {
            const actual = tokenization_1.TokenTheme.createFromParsedTokenTheme([
                new tokenization_1.ParsedTokenThemeRule('var', -1, -1 /* FontStyle.NotSet */, 'F8F8F2', null)
            ], [
                '000000', 'FFFFFF', '0F0F0F'
            ]);
            const colorMap = new tokenization_1.ColorMap();
            colorMap.getId('000000');
            colorMap.getId('FFFFFF');
            colorMap.getId('0F0F0F');
            colorMap.getId('F8F8F2');
            assert.deepStrictEqual(actual.getColorMap(), colorMap.getColorMap());
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5pemF0aW9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2Rlcy9zdXBwb3J0cy90b2tlbml6YXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1FBRWxDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMseUNBQXlDLEVBQUUsR0FBRyxFQUFFO1lBQ3BELE1BQU0sS0FBSyxHQUFHLHlCQUFVLENBQUMsdUJBQXVCLENBQUM7Z0JBQ2hELEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUU7Z0JBQ3pELEVBQUUsS0FBSyxFQUFFLDBDQUEwQyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUU7Z0JBQzNFLEVBQUUsS0FBSyxFQUFFLCtCQUErQixFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUU7YUFDaEUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVQLE1BQU0sUUFBUSxHQUFHLElBQUksdUJBQVEsRUFBRSxDQUFDO1lBQ2hDLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDekIsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFcEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO1lBRXhFLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLElBQUksbUNBQW9CLHlCQUFpQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1lBQ3RCLE1BQU0sS0FBSyxHQUFHLHlCQUFVLENBQUMsdUJBQXVCLENBQUM7Z0JBQ2hELEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUU7Z0JBQ3pELEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFO2dCQUN6QyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRTtnQkFDNUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUU7Z0JBQ3RDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFO2dCQUN0QyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRTtnQkFDbkMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRTtnQkFDaEUsRUFBRSxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRTtnQkFDbkQsRUFBRSxLQUFLLEVBQUUsc0JBQXNCLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRTtnQkFDcEQsRUFBRSxLQUFLLEVBQUUsc0JBQXNCLEVBQUUsU0FBUyxFQUFFLHVCQUF1QixFQUFFO2dCQUNyRSxFQUFFLEtBQUssRUFBRSxzQkFBc0IsRUFBRSxTQUFTLEVBQUUsb0JBQW9CLEVBQUU7Z0JBQ2xFLEVBQUUsS0FBSyxFQUFFLHNCQUFzQixFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRTtnQkFDdEUsRUFBRSxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFO2FBQ3BFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFUCxNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFRLEVBQUUsQ0FBQztZQUNoQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFcEMsU0FBUyxXQUFXLENBQUMsU0FBaUIsRUFBRSxRQUE4QjtnQkFDckUsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDdkMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixHQUFHLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUNqRixDQUFDO1lBRUQsU0FBUyxpQkFBaUIsQ0FBQyxTQUFpQixFQUFFLFNBQW9CLEVBQUUsVUFBa0IsRUFBRSxVQUFrQjtnQkFDekcsV0FBVyxDQUFDLFNBQVMsRUFBRSxJQUFJLG1DQUFvQixDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNyRixDQUFDO1lBRUQsU0FBUyxhQUFhLENBQUMsU0FBaUI7Z0JBQ3ZDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxtQ0FBb0IseUJBQWlCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFFLENBQUM7WUFFRCxtQkFBbUI7WUFDbkIsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xCLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0QixhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFdkIsaUJBQWlCO1lBQ2pCLGlCQUFpQixDQUFDLFFBQVEsMEJBQWtCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNwRCxpQkFBaUIsQ0FBQyxXQUFXLDBCQUFrQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdkQsaUJBQWlCLENBQUMsWUFBWSwwQkFBa0IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXhELG9CQUFvQjtZQUNwQixpQkFBaUIsQ0FBQyxXQUFXLDBCQUFrQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdkQsaUJBQWlCLENBQUMsY0FBYywwQkFBa0IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzFELGlCQUFpQixDQUFDLGVBQWUsMEJBQWtCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUUzRCxjQUFjO1lBQ2QsaUJBQWlCLENBQUMsS0FBSywwQkFBa0IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELGlCQUFpQixDQUFDLFFBQVEsMEJBQWtCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNwRCxpQkFBaUIsQ0FBQyxTQUFTLDBCQUFrQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFckQsbUJBQW1CO1lBQ25CLGlCQUFpQixDQUFDLFVBQVUsNEJBQW9CLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN4RCxpQkFBaUIsQ0FBQyxpQkFBaUIsNEJBQW9CLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMvRCxpQkFBaUIsQ0FBQyxjQUFjLDRCQUFvQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFNUQsMkJBQTJCO1lBQzNCLGlCQUFpQixDQUFDLGtCQUFrQiw0QkFBb0IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLGlCQUFpQixDQUFDLHNCQUFzQiw0QkFBb0IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXBFLCtCQUErQjtZQUMvQixpQkFBaUIsQ0FBQyxzQkFBc0IsMEJBQWtCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNsRSxpQkFBaUIsQ0FBQywwQkFBMEIsMEJBQWtCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV0RSwrQkFBK0I7WUFDL0IsaUJBQWlCLENBQUMsc0JBQXNCLEVBQUUsaURBQWlDLDhCQUFzQixFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMzRyxpQkFBaUIsQ0FBQywwQkFBMEIsRUFBRSxpREFBaUMsOEJBQXNCLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRS9HLCtCQUErQjtZQUMvQixpQkFBaUIsQ0FBQyxzQkFBc0IsRUFBRSx3REFBd0MsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDNUYsaUJBQWlCLENBQUMsMEJBQTBCLEVBQUUsd0RBQXdDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRWhHLCtCQUErQjtZQUMvQixpQkFBaUIsQ0FBQyxzQkFBc0IsMEJBQWtCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNsRSxpQkFBaUIsQ0FBQywwQkFBMEIsMEJBQWtCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV0RSw2QkFBNkI7WUFDN0IsaUJBQWlCLENBQUMsb0JBQW9CLDBCQUFrQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDaEUsaUJBQWlCLENBQUMsd0JBQXdCLDBCQUFrQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFcEUsb0NBQW9DO1lBQ3BDLGlCQUFpQixDQUFDLHFCQUFxQiwwQkFBa0IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLGlCQUFpQixDQUFDLGdCQUFnQiwwQkFBa0IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVELGlCQUFpQixDQUFDLFNBQVMsMEJBQWtCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVyRCxpQkFBaUIsQ0FBQyxLQUFLLDBCQUFrQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7UUFFakMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1lBRXRCLE1BQU0sTUFBTSxHQUFHLElBQUEsOEJBQWUsRUFBQztnQkFDOUIsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRTtnQkFDekQsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUU7Z0JBQ3pDLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFO2dCQUM1QyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRTtnQkFDdEMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUU7Z0JBQ3RDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFO2dCQUNuQyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFO2dCQUNoRSxFQUFFLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFO2dCQUNuRCxFQUFFLEtBQUssRUFBRSxzQkFBc0IsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFO2dCQUNwRCxFQUFFLEtBQUssRUFBRSxzQkFBc0IsRUFBRSxTQUFTLEVBQUUsdUJBQXVCLEVBQUU7Z0JBQ3JFLEVBQUUsS0FBSyxFQUFFLHNCQUFzQixFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRTthQUN0RSxDQUFDLENBQUM7WUFFSCxNQUFNLFFBQVEsR0FBRztnQkFDaEIsSUFBSSxtQ0FBb0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyw2QkFBb0IsUUFBUSxFQUFFLFFBQVEsQ0FBQztnQkFDckUsSUFBSSxtQ0FBb0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQyw2QkFBb0IsSUFBSSxFQUFFLFFBQVEsQ0FBQztnQkFDdkUsSUFBSSxtQ0FBb0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQyw2QkFBb0IsSUFBSSxFQUFFLFFBQVEsQ0FBQztnQkFDMUUsSUFBSSxtQ0FBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyw2QkFBb0IsSUFBSSxFQUFFLFFBQVEsQ0FBQztnQkFDcEUsSUFBSSxtQ0FBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyw2QkFBb0IsSUFBSSxFQUFFLFFBQVEsQ0FBQztnQkFDcEUsSUFBSSxtQ0FBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQywwQkFBa0IsSUFBSSxFQUFFLElBQUksQ0FBQztnQkFDOUQsSUFBSSxtQ0FBb0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyw0QkFBb0IsUUFBUSxFQUFFLElBQUksQ0FBQztnQkFDekUsSUFBSSxtQ0FBb0IsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLDZCQUFvQixRQUFRLEVBQUUsSUFBSSxDQUFDO2dCQUNqRixJQUFJLG1DQUFvQixDQUFDLHNCQUFzQixFQUFFLENBQUMsMEJBQWtCLElBQUksRUFBRSxJQUFJLENBQUM7Z0JBQy9FLElBQUksbUNBQW9CLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxFQUFFLGlEQUFpQyw4QkFBc0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO2dCQUN4SCxJQUFJLG1DQUFvQixDQUFDLHNCQUFzQixFQUFFLEVBQUUsMEJBQWtCLFFBQVEsRUFBRSxJQUFJLENBQUM7YUFDcEYsQ0FBQztZQUVGLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzFDLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBRW5DLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtZQUN6QixNQUFNLE1BQU0sR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFNLENBQUMsQ0FBQztZQUU5RCxNQUFNLFFBQVEsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1lBQ2hDLE1BQU0sTUFBTSxHQUFHLHlCQUFVLENBQUMsMEJBQTBCLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzdELE1BQU0sUUFBUSxHQUFHLElBQUksdUJBQVEsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLElBQUksdUNBQXdCLENBQUMsSUFBSSxtQ0FBb0IseUJBQWlCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEksQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1lBQ3pDLE1BQU0sTUFBTSxHQUFHLHlCQUFVLENBQUMsMEJBQTBCLENBQUM7Z0JBQ3BELElBQUksbUNBQW9CLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyw2QkFBb0IsSUFBSSxFQUFFLElBQUksQ0FBQzthQUM5RCxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ1AsTUFBTSxRQUFRLEdBQUcsSUFBSSx1QkFBUSxFQUFFLENBQUM7WUFDaEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsSUFBSSx1Q0FBd0IsQ0FBQyxJQUFJLG1DQUFvQix5QkFBaUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0SSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLEVBQUU7WUFDekMsTUFBTSxNQUFNLEdBQUcseUJBQVUsQ0FBQywwQkFBMEIsQ0FBQztnQkFDcEQsSUFBSSxtQ0FBb0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLDBCQUFrQixJQUFJLEVBQUUsSUFBSSxDQUFDO2FBQzVELEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDUCxNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFRLEVBQUUsQ0FBQztZQUNoQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLEVBQUUsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxJQUFJLHVDQUF3QixDQUFDLElBQUksbUNBQW9CLHlCQUFpQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RJLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtZQUN6QyxNQUFNLE1BQU0sR0FBRyx5QkFBVSxDQUFDLDBCQUEwQixDQUFDO2dCQUNwRCxJQUFJLG1DQUFvQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsMEJBQWtCLElBQUksRUFBRSxJQUFJLENBQUM7YUFDNUQsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNQLE1BQU0sUUFBUSxHQUFHLElBQUksdUJBQVEsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLElBQUksdUNBQXdCLENBQUMsSUFBSSxtQ0FBb0IseUJBQWlCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEksQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1lBQ3pDLE1BQU0sTUFBTSxHQUFHLHlCQUFVLENBQUMsMEJBQTBCLENBQUM7Z0JBQ3BELElBQUksbUNBQW9CLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyw2QkFBb0IsUUFBUSxFQUFFLElBQUksQ0FBQzthQUNsRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ1AsTUFBTSxRQUFRLEdBQUcsSUFBSSx1QkFBUSxFQUFFLENBQUM7WUFDaEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsSUFBSSx1Q0FBd0IsQ0FBQyxJQUFJLG1DQUFvQix5QkFBaUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0SSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLEVBQUU7WUFDekMsTUFBTSxNQUFNLEdBQUcseUJBQVUsQ0FBQywwQkFBMEIsQ0FBQztnQkFDcEQsSUFBSSxtQ0FBb0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLDZCQUFvQixJQUFJLEVBQUUsUUFBUSxDQUFDO2FBQ2xFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDUCxNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFRLEVBQUUsQ0FBQztZQUNoQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLEVBQUUsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxJQUFJLHVDQUF3QixDQUFDLElBQUksbUNBQW9CLHlCQUFpQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RJLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtZQUN4QyxNQUFNLE1BQU0sR0FBRyx5QkFBVSxDQUFDLDBCQUEwQixDQUFDO2dCQUNwRCxJQUFJLG1DQUFvQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsNkJBQW9CLElBQUksRUFBRSxRQUFRLENBQUM7Z0JBQ2xFLElBQUksbUNBQW9CLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyw2QkFBb0IsUUFBUSxFQUFFLElBQUksQ0FBQztnQkFDbEUsSUFBSSxtQ0FBb0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLDBCQUFrQixJQUFJLEVBQUUsSUFBSSxDQUFDO2FBQzVELEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDUCxNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFRLEVBQUUsQ0FBQztZQUNoQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLEVBQUUsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxJQUFJLHVDQUF3QixDQUFDLElBQUksbUNBQW9CLHlCQUFpQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RJLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtZQUNuQyxNQUFNLE1BQU0sR0FBRyx5QkFBVSxDQUFDLDBCQUEwQixDQUFDO2dCQUNwRCxJQUFJLG1DQUFvQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsNkJBQW9CLFFBQVEsRUFBRSxRQUFRLENBQUM7Z0JBQ3RFLElBQUksbUNBQW9CLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyw2QkFBb0IsUUFBUSxFQUFFLElBQUksQ0FBQzthQUNyRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ1AsTUFBTSxRQUFRLEdBQUcsSUFBSSx1QkFBUSxFQUFFLENBQUM7WUFDaEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLEVBQUUsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDckUsTUFBTSxJQUFJLEdBQUcsSUFBSSx1Q0FBd0IsQ0FBQyxJQUFJLG1DQUFvQix5QkFBaUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2dCQUMzRixLQUFLLEVBQUUsSUFBSSx1Q0FBd0IsQ0FBQyxJQUFJLG1DQUFvQix5QkFBaUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ3JGLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1lBQ2xDLE1BQU0sTUFBTSxHQUFHLHlCQUFVLENBQUMsMEJBQTBCLENBQUM7Z0JBQ3BELElBQUksbUNBQW9CLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyw2QkFBb0IsUUFBUSxFQUFFLFFBQVEsQ0FBQztnQkFDdEUsSUFBSSxtQ0FBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQywwQkFBa0IsSUFBSSxFQUFFLElBQUksQ0FBQztnQkFDOUQsSUFBSSxtQ0FBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyw2QkFBb0IsUUFBUSxFQUFFLElBQUksQ0FBQzthQUNwRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ1AsTUFBTSxRQUFRLEdBQUcsSUFBSSx1QkFBUSxFQUFFLENBQUM7WUFDaEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLEVBQUUsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDckUsTUFBTSxJQUFJLEdBQUcsSUFBSSx1Q0FBd0IsQ0FBQyxJQUFJLG1DQUFvQix5QkFBaUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2dCQUMzRixLQUFLLEVBQUUsSUFBSSx1Q0FBd0IsQ0FBQyxJQUFJLG1DQUFvQix5QkFBaUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ3JGLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1lBQ2xDLE1BQU0sTUFBTSxHQUFHLHlCQUFVLENBQUMsMEJBQTBCLENBQUM7Z0JBQ3BELElBQUksbUNBQW9CLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyw2QkFBb0IsUUFBUSxFQUFFLFFBQVEsQ0FBQztnQkFDdEUsSUFBSSxtQ0FBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLDBCQUFrQixRQUFRLEVBQUUsSUFBSSxDQUFDO2dCQUNuRSxJQUFJLG1DQUFvQixDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyw2QkFBb0IsUUFBUSxFQUFFLElBQUksQ0FBQzthQUNoRixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ1AsTUFBTSxRQUFRLEdBQUcsSUFBSSx1QkFBUSxFQUFFLENBQUM7WUFDaEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUNyRSxNQUFNLElBQUksR0FBRyxJQUFJLHVDQUF3QixDQUFDLElBQUksbUNBQW9CLHlCQUFpQixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQzNGLEtBQUssRUFBRSxJQUFJLHVDQUF3QixDQUFDLElBQUksbUNBQW9CLHlCQUFpQixFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7b0JBQ3JGLFlBQVksRUFBRSxJQUFJLHVDQUF3QixDQUFDLElBQUksbUNBQW9CLHlCQUFpQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7aUJBQzVGLENBQUM7YUFDRixDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtZQUNsQyxNQUFNLE1BQU0sR0FBRyx5QkFBVSxDQUFDLDBCQUEwQixDQUFDO2dCQUNwRCxJQUFJLG1DQUFvQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsNkJBQW9CLFFBQVEsRUFBRSxRQUFRLENBQUM7Z0JBQ3RFLElBQUksbUNBQW9CLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQywwQkFBa0IsUUFBUSxFQUFFLElBQUksQ0FBQztnQkFDbkUsSUFBSSxtQ0FBb0IsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsNkJBQW9CLFFBQVEsRUFBRSxJQUFJLENBQUM7Z0JBQ2hGLElBQUksbUNBQW9CLENBQUMsVUFBVSxFQUFFLENBQUMsNEJBQW9CLFFBQVEsRUFBRSxJQUFJLENBQUM7Z0JBQ3pFLElBQUksbUNBQW9CLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyw2QkFBb0IsUUFBUSxFQUFFLElBQUksQ0FBQztnQkFDakYsSUFBSSxtQ0FBb0IsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLDBCQUFrQixJQUFJLEVBQUUsSUFBSSxDQUFDO2dCQUMvRSxJQUFJLG1DQUFvQixDQUFDLHNCQUFzQixFQUFFLENBQUMsRUFBRSxpREFBaUMsOEJBQXNCLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQztnQkFDeEgsSUFBSSxtQ0FBb0IsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLDBCQUFrQixRQUFRLEVBQUUsSUFBSSxDQUFDO2FBQ25GLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDUCxNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFRLEVBQUUsQ0FBQztZQUNoQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sSUFBSSxHQUFHLElBQUksdUNBQXdCLENBQUMsSUFBSSxtQ0FBb0IseUJBQWlCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDM0YsS0FBSyxFQUFFLElBQUksdUNBQXdCLENBQUMsSUFBSSxtQ0FBb0IseUJBQWlCLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtvQkFDckYsWUFBWSxFQUFFLElBQUksdUNBQXdCLENBQUMsSUFBSSxtQ0FBb0IseUJBQWlCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztpQkFDNUYsQ0FBQztnQkFDRixVQUFVLEVBQUUsSUFBSSx1Q0FBd0IsQ0FBQyxJQUFJLG1DQUFvQiwyQkFBbUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO29CQUM1RixTQUFTLEVBQUUsSUFBSSx1Q0FBd0IsQ0FBQyxJQUFJLG1DQUFvQiwyQkFBbUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO3dCQUMzRixLQUFLLEVBQUUsSUFBSSx1Q0FBd0IsQ0FBQyxJQUFJLG1DQUFvQix5QkFBaUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUNyRixLQUFLLEVBQUUsSUFBSSx1Q0FBd0IsQ0FBQyxJQUFJLG1DQUFvQixDQUFDLGlEQUFpQyw4QkFBc0IsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQzlILEtBQUssRUFBRSxJQUFJLHVDQUF3QixDQUFDLElBQUksbUNBQW9CLHlCQUFpQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7cUJBQ3JGLENBQUM7aUJBQ0YsQ0FBQzthQUNGLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1lBQ2pELE1BQU0sTUFBTSxHQUFHLHlCQUFVLENBQUMsMEJBQTBCLENBQUM7Z0JBQ3BELElBQUksbUNBQW9CLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyw2QkFBb0IsUUFBUSxFQUFFLElBQUksQ0FBQzthQUNyRSxFQUFFO2dCQUNGLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUTthQUM1QixDQUFDLENBQUM7WUFDSCxNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFRLEVBQUUsQ0FBQztZQUNoQyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pCLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDekIsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6QixRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==