/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/services/unicodeTextModelHighlighter", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, range_1, unicodeTextModelHighlighter_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('UnicodeTextModelHighlighter', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function t(text, options) {
            const m = (0, testTextModel_1.createTextModel)(text);
            const r = unicodeTextModelHighlighter_1.UnicodeTextModelHighlighter.computeUnicodeHighlights(m, options);
            m.dispose();
            return {
                ...r,
                ranges: r.ranges.map(r => range_1.Range.lift(r).toString())
            };
        }
        test('computeUnicodeHighlights (#168068)', () => {
            assert.deepStrictEqual(t(`
	For å gi et eksempel
`, {
                allowedCodePoints: [],
                allowedLocales: [],
                ambiguousCharacters: true,
                invisibleCharacters: true,
                includeComments: false,
                includeStrings: false,
                nonBasicASCII: false
            }), {
                ambiguousCharacterCount: 0,
                hasMore: false,
                invisibleCharacterCount: 4,
                nonBasicAsciiCharacterCount: 0,
                ranges: [
                    '[2,5 -> 2,6]',
                    '[2,7 -> 2,8]',
                    '[2,10 -> 2,11]',
                    '[2,13 -> 2,14]'
                ]
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pY29kZVRleHRNb2RlbEhpZ2hsaWdodGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9zZXJ2aWNlcy91bmljb2RlVGV4dE1vZGVsSGlnaGxpZ2h0ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxLQUFLLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1FBQ3pDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLENBQUMsQ0FBQyxJQUFZLEVBQUUsT0FBa0M7WUFDMUQsTUFBTSxDQUFDLEdBQUcsSUFBQSwrQkFBZSxFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxHQUFHLHlEQUEyQixDQUFDLHdCQUF3QixDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMzRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFWixPQUFPO2dCQUNOLEdBQUcsQ0FBQztnQkFDSixNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO2FBQ25ELENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtZQUMvQyxNQUFNLENBQUMsZUFBZSxDQUNyQixDQUFDLENBQUM7O0NBRUosRUFBRTtnQkFDQyxpQkFBaUIsRUFBRSxFQUFFO2dCQUNyQixjQUFjLEVBQUUsRUFBRTtnQkFDbEIsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIsZUFBZSxFQUFFLEtBQUs7Z0JBQ3RCLGNBQWMsRUFBRSxLQUFLO2dCQUNyQixhQUFhLEVBQUUsS0FBSzthQUNwQixDQUFDLEVBQ0Y7Z0JBQ0MsdUJBQXVCLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsdUJBQXVCLEVBQUUsQ0FBQztnQkFDMUIsMkJBQTJCLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxFQUFFO29CQUNQLGNBQWM7b0JBQ2QsY0FBYztvQkFDZCxnQkFBZ0I7b0JBQ2hCLGdCQUFnQjtpQkFDaEI7YUFDRCxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=