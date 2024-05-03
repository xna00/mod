/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/iconLabels", "vs/base/test/common/utils"], function (require, exports, assert, iconLabels_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function filterOk(filter, word, target, highlights) {
        const r = filter(word, target);
        assert(r);
        if (highlights) {
            assert.deepStrictEqual(r, highlights);
        }
    }
    suite('Icon Labels', () => {
        test('Can get proper aria labels', () => {
            // note, the spaces in the results are important
            const testCases = new Map([
                ['', ''],
                ['asdf', 'asdf'],
                ['asdf$(squirrel)asdf', 'asdf squirrel asdf'],
                ['asdf $(squirrel) asdf', 'asdf  squirrel  asdf'],
                ['$(rocket)asdf', 'rocket asdf'],
                ['$(rocket) asdf', 'rocket  asdf'],
                ['$(rocket)$(rocket)$(rocket)asdf', 'rocket  rocket  rocket asdf'],
                ['$(rocket) asdf $(rocket)', 'rocket  asdf  rocket'],
                ['$(rocket)asdf$(rocket)', 'rocket asdf rocket'],
            ]);
            for (const [input, expected] of testCases) {
                assert.strictEqual((0, iconLabels_1.getCodiconAriaLabel)(input), expected);
            }
        });
        test('matchesFuzzyIconAware', () => {
            // Camel Case
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'ccr', (0, iconLabels_1.parseLabelWithIcons)('$(codicon)CamelCaseRocks$(codicon)'), [
                { start: 10, end: 11 },
                { start: 15, end: 16 },
                { start: 19, end: 20 }
            ]);
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'ccr', (0, iconLabels_1.parseLabelWithIcons)('$(codicon) CamelCaseRocks $(codicon)'), [
                { start: 11, end: 12 },
                { start: 16, end: 17 },
                { start: 20, end: 21 }
            ]);
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'iut', (0, iconLabels_1.parseLabelWithIcons)('$(codicon) Indent $(octico) Using $(octic) Tpaces'), [
                { start: 11, end: 12 },
                { start: 28, end: 29 },
                { start: 43, end: 44 },
            ]);
            // Prefix
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'using', (0, iconLabels_1.parseLabelWithIcons)('$(codicon) Indent Using Spaces'), [
                { start: 18, end: 23 },
            ]);
            // Broken Codicon
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'codicon', (0, iconLabels_1.parseLabelWithIcons)('This $(codicon Indent Using Spaces'), [
                { start: 7, end: 14 },
            ]);
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'indent', (0, iconLabels_1.parseLabelWithIcons)('This $codicon Indent Using Spaces'), [
                { start: 14, end: 20 },
            ]);
            // Testing #59343
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'unt', (0, iconLabels_1.parseLabelWithIcons)('$(primitive-dot) $(file-text) Untitled-1'), [
                { start: 30, end: 33 },
            ]);
            // Testing #136172
            filterOk(iconLabels_1.matchesFuzzyIconAware, 's', (0, iconLabels_1.parseLabelWithIcons)('$(loading~spin) start'), [
                { start: 16, end: 17 },
            ]);
        });
        test('stripIcons', () => {
            assert.strictEqual((0, iconLabels_1.stripIcons)('Hello World'), 'Hello World');
            assert.strictEqual((0, iconLabels_1.stripIcons)('$(Hello World'), '$(Hello World');
            assert.strictEqual((0, iconLabels_1.stripIcons)('$(Hello) World'), ' World');
            assert.strictEqual((0, iconLabels_1.stripIcons)('$(Hello) W$(oi)rld'), ' Wrld');
        });
        test('escapeIcons', () => {
            assert.strictEqual((0, iconLabels_1.escapeIcons)('Hello World'), 'Hello World');
            assert.strictEqual((0, iconLabels_1.escapeIcons)('$(Hello World'), '$(Hello World');
            assert.strictEqual((0, iconLabels_1.escapeIcons)('$(Hello) World'), '\\$(Hello) World');
            assert.strictEqual((0, iconLabels_1.escapeIcons)('\\$(Hello) W$(oi)rld'), '\\$(Hello) W\\$(oi)rld');
        });
        test('markdownEscapeEscapedIcons', () => {
            assert.strictEqual((0, iconLabels_1.markdownEscapeEscapedIcons)('Hello World'), 'Hello World');
            assert.strictEqual((0, iconLabels_1.markdownEscapeEscapedIcons)('$(Hello) World'), '$(Hello) World');
            assert.strictEqual((0, iconLabels_1.markdownEscapeEscapedIcons)('\\$(Hello) World'), '\\\\$(Hello) World');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvbkxhYmVscy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL2ljb25MYWJlbHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyxTQUFTLFFBQVEsQ0FBQyxNQUFtQixFQUFFLElBQVksRUFBRSxNQUE2QixFQUFFLFVBQTZDO1FBQ2hJLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDL0IsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1YsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNoQixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN2QyxDQUFDO0lBQ0YsQ0FBQztJQUVELEtBQUssQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1FBQ3pCLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7WUFDdkMsZ0RBQWdEO1lBQ2hELE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxDQUFpQjtnQkFDekMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNSLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDaEIsQ0FBQyxxQkFBcUIsRUFBRSxvQkFBb0IsQ0FBQztnQkFDN0MsQ0FBQyx1QkFBdUIsRUFBRSxzQkFBc0IsQ0FBQztnQkFDakQsQ0FBQyxlQUFlLEVBQUUsYUFBYSxDQUFDO2dCQUNoQyxDQUFDLGdCQUFnQixFQUFFLGNBQWMsQ0FBQztnQkFDbEMsQ0FBQyxpQ0FBaUMsRUFBRSw2QkFBNkIsQ0FBQztnQkFDbEUsQ0FBQywwQkFBMEIsRUFBRSxzQkFBc0IsQ0FBQztnQkFDcEQsQ0FBQyx3QkFBd0IsRUFBRSxvQkFBb0IsQ0FBQzthQUNoRCxDQUFDLENBQUM7WUFF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