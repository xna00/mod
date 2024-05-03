/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/viewModel/glyphLanesModel", "vs/editor/common/core/range", "vs/editor/common/model"], function (require, exports, assert, utils_1, glyphLanesModel_1, range_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('GlyphLanesModel', () => {
        let model;
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const lineRange = (startLineNumber, endLineNumber) => new range_1.Range(startLineNumber, 1, endLineNumber, 1);
        const assertLines = (fromLine, n, expected) => {
            const result = [];
            for (let i = 0; i < n; i++) {
                result.push(model.getLanesAtLine(fromLine + i));
            }
            assert.deepStrictEqual(result, expected, `fromLine: ${fromLine}, n: ${n}`);
        };
        setup(() => {
            model = new glyphLanesModel_1.GlyphMarginLanesModel(10);
        });
        test('handles empty', () => {
            assert.equal(model.requiredLanes, 1);
            assertLines(1, 1, [
                [model_1.GlyphMarginLane.Center],
            ]);
        });
        test('works with a single line range', () => {
            model.push(model_1.GlyphMarginLane.Left, lineRange(2, 3));
            assert.equal(model.requiredLanes, 1);
            assertLines(1, 5, [
                [model_1.GlyphMarginLane.Center], // 1
                [model_1.GlyphMarginLane.Left], // 2
                [model_1.GlyphMarginLane.Left], // 3
                [model_1.GlyphMarginLane.Center], // 4
                [model_1.GlyphMarginLane.Center], // 5
            ]);
        });
        test('persists ranges', () => {
            model.push(model_1.GlyphMarginLane.Left, lineRange(2, 3), true);
            assert.equal(model.requiredLanes, 1);
            assertLines(1, 5, [
                [model_1.GlyphMarginLane.Left], // 1
                [model_1.GlyphMarginLane.Left], // 2
                [model_1.GlyphMarginLane.Left], // 3
                [model_1.GlyphMarginLane.Left], // 4
                [model_1.GlyphMarginLane.Left], // 5
            ]);
        });
        test('handles overlaps', () => {
            model.push(model_1.GlyphMarginLane.Left, lineRange(6, 9));
            model.push(model_1.GlyphMarginLane.Right, lineRange(5, 7));
            model.push(model_1.GlyphMarginLane.Center, lineRange(7, 8));
            assert.equal(model.requiredLanes, 3);
            assertLines(5, 6, [
                [model_1.GlyphMarginLane.Right], // 5
                [model_1.GlyphMarginLane.Left, model_1.GlyphMarginLane.Right], // 6
                [model_1.GlyphMarginLane.Left, model_1.GlyphMarginLane.Center, model_1.GlyphMarginLane.Right], // 7
                [model_1.GlyphMarginLane.Left, model_1.GlyphMarginLane.Center], // 8
                [model_1.GlyphMarginLane.Left], // 9
                [model_1.GlyphMarginLane.Center], // 10
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2x5cGhMYW5lc01vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi92aWV3TW9kZWwvZ2x5cGhMYW5lc01vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtRQUM3QixJQUFJLEtBQTRCLENBQUM7UUFFakMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLE1BQU0sU0FBUyxHQUFHLENBQUMsZUFBdUIsRUFBRSxhQUFxQixFQUFFLEVBQUUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0SCxNQUFNLFdBQVcsR0FBRyxDQUFDLFFBQWdCLEVBQUUsQ0FBUyxFQUFFLFFBQTZCLEVBQUUsRUFBRTtZQUNsRixNQUFNLE1BQU0sR0FBd0IsRUFBRSxDQUFDO1lBQ3ZDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFDRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsYUFBYSxRQUFRLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1RSxDQUFDLENBQUM7UUFFRixLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsS0FBSyxHQUFHLElBQUksdUNBQXFCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZUFB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