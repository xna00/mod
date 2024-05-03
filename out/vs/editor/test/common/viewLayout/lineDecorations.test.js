/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewModel"], function (require, exports, assert, utils_1, range_1, lineDecorations_1, viewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor ViewLayout - ViewLineParts', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Bug 9827:Overlapping inline decorations can cause wrong inline class to be applied', () => {
            const result = lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 11, 'c1', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* InlineDecorationType.Regular */)
            ]);
            assert.deepStrictEqual(result, [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1', 0),
                new lineDecorations_1.DecorationSegment(2, 2, 'c2 c1', 0),
                new lineDecorations_1.DecorationSegment(3, 9, 'c1', 0),
            ]);
        });
        test('issue #3462: no whitespace shown at the end of a decorated line', () => {
            const result = lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(15, 21, 'mtkw', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(20, 21, 'inline-folded', 0 /* InlineDecorationType.Regular */),
            ]);
            assert.deepStrictEqual(result, [
                new lineDecorations_1.DecorationSegment(14, 18, 'mtkw', 0),
                new lineDecorations_1.DecorationSegment(19, 19, 'mtkw inline-folded', 0)
            ]);
        });
        test('issue #3661: Link decoration bleeds to next line when wrapping', () => {
            const result = lineDecorations_1.LineDecoration.filter([
                new viewModel_1.InlineDecoration(new range_1.Range(2, 12, 3, 30), 'detected-link', 0 /* InlineDecorationType.Regular */)
            ], 3, 12, 500);
            assert.deepStrictEqual(result, [
                new lineDecorations_1.LineDecoration(12, 30, 'detected-link', 0 /* InlineDecorationType.Regular */),
            ]);
        });
        test('issue #37401: Allow both before and after decorations on empty line', () => {
            const result = lineDecorations_1.LineDecoration.filter([
                new viewModel_1.InlineDecoration(new range_1.Range(4, 1, 4, 2), 'before', 1 /* InlineDecorationType.Before */),
                new viewModel_1.InlineDecoration(new range_1.Range(4, 0, 4, 1), 'after', 2 /* InlineDecorationType.After */),
            ], 4, 1, 500);
            assert.deepStrictEqual(result, [
                new lineDecorations_1.LineDecoration(1, 2, 'before', 1 /* InlineDecorationType.Before */),
                new lineDecorations_1.LineDecoration(0, 1, 'after', 2 /* InlineDecorationType.After */),
            ]);
        });
        test('ViewLineParts', () => {
            assert.deepStrictEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 2, 'c1', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* InlineDecorationType.Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 0, 'c1', 0),
                new lineDecorations_1.DecorationSegment(2, 2, 'c2', 0)
            ]);
            assert.deepStrictEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 3, 'c1', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* InlineDecorationType.Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1', 0),
                new lineDecorations_1.DecorationSegment(2, 2, 'c2', 0)
            ]);
            assert.deepStrictEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 4, 'c1', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* InlineDecorationType.Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1', 0),
                new lineDecorations_1.DecorationSegment(2, 2, 'c1 c2', 0)
            ]);
            assert.deepStrictEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 4, 'c1', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1*', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* InlineDecorationType.Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1 c1*', 0),
                new lineDecorations_1.DecorationSegment(2, 2, 'c1 c1* c2', 0)
            ]);
            assert.deepStrictEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 4, 'c1', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1*', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1**', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* InlineDecorationType.Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1 c1* c1**', 0),
                new lineDecorations_1.DecorationSegment(2, 2, 'c1 c1* c1** c2', 0)
            ]);
            assert.deepStrictEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 4, 'c1', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1*', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1**', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2*', 0 /* InlineDecorationType.Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1 c1* c1**', 0),
                new lineDecorations_1.DecorationSegment(2, 2, 'c1 c1* c1** c2 c2*', 0)
            ]);
            assert.deepStrictEqual(lineDecorations_1.LineDecorationsNormalizer.normalize('abcabcabcabcabcabcabcabcabcabc', [
                new lineDecorations_1.LineDecoration(1, 4, 'c1', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1*', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(1, 4, 'c1**', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(3, 4, 'c2', 0 /* InlineDecorationType.Regular */),
                new lineDecorations_1.LineDecoration(3, 5, 'c2*', 0 /* InlineDecorationType.Regular */)
            ]), [
                new lineDecorations_1.DecorationSegment(0, 1, 'c1 c1* c1**', 0),
                new lineDecorations_1.DecorationSegment(2, 2, 'c1 c1* c1** c2 c2*', 0),
                new lineDecorations_1.DecorationSegment(3, 3, 'c2*', 0)
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZURlY29yYXRpb25zLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi92aWV3TGF5b3V0L2xpbmVEZWNvcmF0aW9ucy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLEtBQUssQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7UUFFL0MsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxvRkFBb0YsRUFBRSxHQUFHLEVBQUU7WUFFL0YsTUFBTSxNQUFNLEdBQUcsMkNBQXlCLENBQUMsU0FBUyxDQUFDLGdDQUFnQyxFQUFFO2dCQUNwRixJQUFJLGdDQUFjLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLHVDQUErQjtnQkFDN0QsSUFBSSxnQ0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSx1Q0FBK0I7YUFDNUQsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUU7Z0JBQzlCLElBQUksbUNBQWlCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLG1DQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxtQ0FBaUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaUVBQWlFLEVBQUUsR0FBRyxFQUFFO1lBRTVFLE1BQU0sTUFBTSxHQUFHLDJDQUF5QixDQUFDLFNBQVMsQ0FBQyxnQ0FBZ0MsRUFBRTtnQkFDcEYsSUFBSSxnQ0FBYyxDQUFDLEVBQUUsRUFB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