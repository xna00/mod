/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/contrib/folding/browser/foldingRanges", "vs/editor/contrib/folding/browser/indentRangeProvider", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, foldingRanges_1, indentRangeProvider_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const markers = {
        start: /^#region$/,
        end: /^#endregion$/
    };
    suite('FoldingRanges', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const foldRange = (from, to, collapsed = undefined, source = 0 /* FoldSource.provider */, type = undefined) => ({
            startLineNumber: from,
            endLineNumber: to,
            type: type,
            isCollapsed: collapsed || false,
            source
        });
        const assertEqualRanges = (range1, range2, msg) => {
            assert.strictEqual(range1.startLineNumber, range2.startLineNumber, msg + ' start');
            assert.strictEqual(range1.endLineNumber, range2.endLineNumber, msg + ' end');
            assert.strictEqual(range1.type, range2.type, msg + ' type');
            assert.strictEqual(range1.isCollapsed, range2.isCollapsed, msg + ' collapsed');
            assert.strictEqual(range1.source, range2.source, msg + ' source');
        };
        test('test max folding regions', () => {
            const lines = [];
            const nRegions = foldingRanges_1.MAX_FOLDING_REGIONS;
            const collector = new indentRangeProvider_1.RangesCollector({ limit: foldingRanges_1.MAX_FOLDING_REGIONS, update: () => { } });
            for (let i = 0; i < nRegions; i++) {
                const startLineNumber = lines.length;
                lines.push('#region');
                const endLineNumber = lines.length;
                lines.push('#endregion');
                collector.insertFirst(startLineNumber, endLineNumber, 0);
            }
            const model = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            const actual = collector.toIndentRanges(model);
            assert.strictEqual(actual.length, nRegions, 'len');
            model.dispose();
        });
        test('findRange', () => {
            const lines = [
                /* 1*/ '#region',
                /* 2*/ '#endregion',
                /* 3*/ 'class A {',
                /* 4*/ '  void foo() {',
                /* 5*/ '    if (true) {',
                /* 6*/ '        return;',
                /* 7*/ '    }',
                /* 8*/ '',
                /* 9*/ '    if (true) {',
                /* 10*/ '      return;',
                /* 11*/ '    }',
                /* 12*/ '  }',
                /* 13*/ '}'
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const actual = (0, indentRangeProvider_1.computeRanges)(textModel, false, markers);
                // let r0 = r(1, 2);
                // let r1 = r(3, 12);
                // let r2 = r(4, 11);
                // let r3 = r(5, 6);
                // let r4 = r(9, 10);
                assert.strictEqual(actual.findRange(1), 0, '1');
                assert.strictEqual(actual.findRange(2), 0, '2');
                assert.strictEqual(actual.findRange(3), 1, '3');
                assert.strictEqual(actual.findRange(4), 2, '4');
                assert.strictEqual(actual.findRange(5), 3, '5');
                assert.strictEqual(actual.findRange(6), 3, '6');
                assert.strictEqual(actual.findRange(7), 2, '7');
                assert.strictEqual(actual.findRange(8), 2, '8');
                assert.strictEqual(actual.findRange(9), 4, '9');
                assert.strictEqual(actual.findRange(10), 4, '10');
                assert.strictEqual(actual.findRange(11), 2, '11');
                assert.strictEqual(actual.findRange(12), 1, '12');
                assert.strictEqual(actual.findRange(13), -1, '13');
            }
            finally {
                textModel.dispose();
            }
        });
        test('setCollapsed', () => {
            const lines = [];
            const nRegions = 500;
            for (let i = 0; i < nRegions; i++) {
                lines.push('#region');
            }
            for (let i = 0; i < nRegions; i++) {
                lines.push('#endregion');
            }
            const model = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            const actual = (0, indentRangeProvider_1.computeRanges)(model, false, markers);
            assert.strictEqual(actual.length, nRegions, 'len');
            for (let i = 0; i < nRegions; i++) {
                actual.setCollapsed(i, i % 3 === 0);
            }
            for (let i = 0; i < nRegions; i++) {
                assert.strictEqual(actual.isCollapsed(i), i % 3 === 0, 'line' + i);
            }
            model.dispose();
        });
        test('sanitizeAndMerge1', () => {
            const regionSet1 = [
                foldRange(0, 100), // invalid, should be removed
                foldRange(1, 100, false, 0 /* FoldSource.provider */, 'A'), // valid
                foldRange(1, 100, false, 0 /* FoldSource.provider */, 'Z'), // invalid, duplicate start
                foldRange(10, 10, false), // invalid, should be removed
                foldRange(20, 80, false, 0 /* FoldSource.provider */, 'C1'), // valid inside 'B'
                foldRange(22, 80, true, 0 /* FoldSource.provider */, 'D1'), // valid inside 'C1'
                foldRange(90, 101), // invalid, should be removed
            ];
            const regionSet2 = [
                foldRange(20, 80, true), // should merge with C1
                foldRange(18, 80, true), // invalid, out of order
                foldRange(21, 81, true, 0 /* FoldSource.provider */, 'Z'), // invalid, overlapping
                foldRange(22, 80, true, 0 /* FoldSource.provider */, 'D2'), // should merge with D1
            ];
            const result = foldingRanges_1.FoldingRegions.sanitizeAndMerge(regionSet1, regionSet2, 100);
            assert.strictEqual(result.length, 3, 'result length1');
            assertEqualRanges(result[0], foldRange(1, 100, false, 0 /* FoldSource.provider */, 'A'), 'A1');
            assertEqualRanges(result[1], foldRange(20, 80, true, 0 /* FoldSource.provider */, 'C1'), 'C1');
            assertEqualRanges(result[2], foldRange(22, 80, true, 0 /* FoldSource.provider */, 'D1'), 'D1');
        });
        test('sanitizeAndMerge2', () => {
            const regionSet1 = [
                foldRange(1, 100, false, 0 /* FoldSource.provider */, 'a1'), // valid
                foldRange(2, 100, false, 0 /* FoldSource.provider */, 'a2'), // valid
                foldRange(3, 19, false, 0 /* FoldSource.provider */, 'a3'), // valid
                foldRange(20, 71, false, 0 /* FoldSource.provider */, 'a4'), // overlaps b3
                foldRange(21, 29, false, 0 /* FoldSource.provider */, 'a5'), // valid
                foldRange(81, 91, false, 0 /* FoldSource.provider */, 'a6'), // overlaps b4
            ];
            const regionSet2 = [
                foldRange(30, 39, true, 0 /* FoldSource.provider */, 'b1'), // valid, will be recovered
                foldRange(40, 49, true, 1 /* FoldSource.userDefined */, 'b2'), // valid
                foldRange(50, 100, true, 1 /* FoldSource.userDefined */, 'b3'), // overlaps a4
                foldRange(80, 90, true, 1 /* FoldSource.userDefined */, 'b4'), // overlaps a6
                foldRange(92, 100, true, 1 /* FoldSource.userDefined */, 'b5'), // valid
            ];
            const result = foldingRanges_1.FoldingRegions.sanitizeAndMerge(regionSet1, regionSet2, 100);
            assert.strictEqual(result.length, 9, 'result length1');
            assertEqualRanges(result[0], foldRange(1, 100, false, 0 /* FoldSource.provider */, 'a1'), 'P1');
            assertEqualRanges(result[1], foldRange(2, 100, false, 0 /* FoldSource.provider */, 'a2'), 'P2');
            assertEqualRanges(result[2], foldRange(3, 19, false, 0 /* FoldSource.provider */, 'a3'), 'P3');
            assertEqualRanges(result[3], foldRange(21, 29, false, 0 /* FoldSource.provider */, 'a5'), 'P4');
            assertEqualRanges(result[4], foldRange(30, 39, true, 2 /* FoldSource.recovered */, 'b1'), 'P5');
            assertEqualRanges(result[5], foldRange(40, 49, true, 1 /* FoldSource.userDefined */, 'b2'), 'P6');
            assertEqualRanges(result[6], foldRange(50, 100, true, 1 /* FoldSource.userDefined */, 'b3'), 'P7');
            assertEqualRanges(result[7], foldRange(80, 90, true, 1 /* FoldSource.userDefined */, 'b4'), 'P8');
            assertEqualRanges(result[8], foldRange(92, 100, true, 1 /* FoldSource.userDefined */, 'b5'), 'P9');
        });
        test('sanitizeAndMerge3', () => {
            const regionSet1 = [
                foldRange(1, 100, false, 0 /* FoldSource.provider */, 'a1'), // valid
                foldRange(10, 29, false, 0 /* FoldSource.provider */, 'a2'), // matches manual hidden
                foldRange(35, 39, true, 2 /* FoldSource.recovered */, 'a3'), // valid
            ];
            const regionSet2 = [
                foldRange(10, 29, true, 2 /* FoldSource.recovered */, 'b1'), // matches a
                foldRange(20, 28, true, 0 /* FoldSource.provider */, 'b2'), // should remain
                foldRange(30, 39, true, 2 /* FoldSource.recovered */, 'b3'), // should remain
            ];
            const result = foldingRanges_1.FoldingRegions.sanitizeAndMerge(regionSet1, regionSet2, 100);
            assert.strictEqual(result.length, 5, 'result length3');
            assertEqualRanges(result[0], foldRange(1, 100, false, 0 /* FoldSource.provider */, 'a1'), 'R1');
            assertEqualRanges(result[1], foldRange(10, 29, true, 0 /* FoldSource.provider */, 'a2'), 'R2');
            assertEqualRanges(result[2], foldRange(20, 28, true, 2 /* FoldSource.recovered */, 'b2'), 'R3');
            assertEqualRanges(result[3], foldRange(30, 39, true, 2 /* FoldSource.recovered */, 'b3'), 'R3');
            assertEqualRanges(result[4], foldRange(35, 39, true, 2 /* FoldSource.recovered */, 'a3'), 'R4');
        });
        test('sanitizeAndMerge4', () => {
            const regionSet1 = [
                foldRange(1, 100, false, 0 /* FoldSource.provider */, 'a1'), // valid
            ];
            const regionSet2 = [
                foldRange(20, 28, true, 0 /* FoldSource.provider */, 'b1'), // hidden
                foldRange(30, 38, true, 0 /* FoldSource.provider */, 'b2'), // hidden
            ];
            const result = foldingRanges_1.FoldingRegions.sanitizeAndMerge(regionSet1, regionSet2, 100);
            assert.strictEqual(result.length, 3, 'result length4');
            assertEqualRanges(result[0], foldRange(1, 100, false, 0 /* FoldSource.provider */, 'a1'), 'R1');
            assertEqualRanges(result[1], foldRange(20, 28, true, 2 /* FoldSource.recovered */, 'b1'), 'R2');
            assertEqualRanges(result[2], foldRange(30, 38, true, 2 /* FoldSource.recovered */, 'b2'), 'R3');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGluZ1Jhbmdlcy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9mb2xkaW5nL3Rlc3QvYnJvd3Nlci9mb2xkaW5nUmFuZ2VzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsTUFBTSxPQUFPLEdBQW1CO1FBQy9CLEtBQUssRUFBRSxXQUFXO1FBQ2xCLEdBQUcsRUFBRSxjQUFjO0tBQ25CLENBQUM7SUFFRixLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUMzQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFDMUMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBVSxFQUFFLFlBQWlDLFNBQVMsRUFBRSxvQ0FBd0MsRUFBRSxPQUEyQixTQUFTLEVBQUUsRUFBRSxDQUMxSyxDQUFXO1lBQ1YsZUFBZSxFQUFFLElBQUk7WUFDckIsYUFBYSxFQUFFLEVBQUU7WUFDakIsSUFBSSxFQUFFLElBQUk7WUFDVixXQUFXLEVBQUUsU0FBUyxJQUFJLEtBQUs7WUFDL0IsTUFBTTtTQUNOLENBQUEsQ0FBQztRQUNILE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxNQUFpQixFQUFFLE1BQWlCLEVBQUUsR0FBVyxFQUFFLEVBQUU7WUFDL0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxlQUFlLEVBQUUsR0FBRyxHQUFHLFFBQVEsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsYUFBYSxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUks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TUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMs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