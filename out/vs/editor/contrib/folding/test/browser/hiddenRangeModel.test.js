define(["require", "exports", "assert", "vs/editor/contrib/folding/browser/foldingModel", "vs/editor/contrib/folding/browser/hiddenRangeModel", "vs/editor/contrib/folding/browser/indentRangeProvider", "vs/editor/test/common/testTextModel", "./foldingModel.test", "vs/base/test/common/utils"], function (require, exports, assert, foldingModel_1, hiddenRangeModel_1, indentRangeProvider_1, testTextModel_1, foldingModel_test_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Hidden Range Model', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function r(startLineNumber, endLineNumber) {
            return { startLineNumber, endLineNumber };
        }
        function assertRanges(actual, expectedRegions, message) {
            assert.deepStrictEqual(actual.map(r => ({ startLineNumber: r.startLineNumber, endLineNumber: r.endLineNumber })), expectedRegions, message);
        }
        test('hasRanges', () => {
            const lines = [
                /* 1*/ '/**',
                /* 2*/ ' * Comment',
                /* 3*/ ' */',
                /* 4*/ 'class A {',
                /* 5*/ '  void foo() {',
                /* 6*/ '    if (true) {',
                /* 7*/ '      //hello',
                /* 8*/ '    }',
                /* 9*/ '  }',
                /* 10*/ '}'
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            const foldingModel = new foldingModel_1.FoldingModel(textModel, new foldingModel_test_1.TestDecorationProvider(textModel));
            const hiddenRangeModel = new hiddenRangeModel_1.HiddenRangeModel(foldingModel);
            try {
                assert.strictEqual(hiddenRangeModel.hasRanges(), false);
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, undefined);
                foldingModel.update(ranges);
                foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(1), foldingModel.getRegionAtLine(6)]);
                assertRanges(hiddenRangeModel.hiddenRanges, [r(2, 3), r(7, 7)]);
                assert.strictEqual(hiddenRangeModel.hasRanges(), true);
                assert.strictEqual(hiddenRangeModel.isHidden(1), false);
                assert.strictEqual(hiddenRangeModel.isHidden(2), true);
                assert.strictEqual(hiddenRangeModel.isHidden(3), true);
                assert.strictEqual(hiddenRangeModel.isHidden(4), false);
                assert.strictEqual(hiddenRangeModel.isHidden(5), false);
                assert.strictEqual(hiddenRangeModel.isHidden(6), false);
                assert.strictEqual(hiddenRangeModel.isHidden(7), true);
                assert.strictEqual(hiddenRangeModel.isHidden(8), false);
                assert.strictEqual(hiddenRangeModel.isHidden(9), false);
                assert.strictEqual(hiddenRangeModel.isHidden(10), false);
                foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(4)]);
                assertRanges(hiddenRangeModel.hiddenRanges, [r(2, 3), r(5, 9)]);
                assert.strictEqual(hiddenRangeModel.hasRanges(), true);
                assert.strictEqual(hiddenRangeModel.isHidden(1), false);
                assert.strictEqual(hiddenRangeModel.isHidden(2), true);
                assert.strictEqual(hiddenRangeModel.isHidden(3), true);
                assert.strictEqual(hiddenRangeModel.isHidden(4), false);
                assert.strictEqual(hiddenRangeModel.isHidden(5), true);
                assert.strictEqual(hiddenRangeModel.isHidden(6), true);
                assert.strictEqual(hiddenRangeModel.isHidden(7), true);
                assert.strictEqual(hiddenRangeModel.isHidden(8), true);
                assert.strictEqual(hiddenRangeModel.isHidden(9), true);
                assert.strictEqual(hiddenRangeModel.isHidden(10), false);
                foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(1), foldingModel.getRegionAtLine(6), foldingModel.getRegionAtLine(4)]);
                assertRanges(hiddenRangeModel.hiddenRanges, []);
                assert.strictEqual(hiddenRangeModel.hasRanges(), false);
                assert.strictEqual(hiddenRangeModel.isHidden(1), false);
                assert.strictEqual(hiddenRangeModel.isHidden(2), false);
                assert.strictEqual(hiddenRangeModel.isHidden(3), false);
                assert.strictEqual(hiddenRangeModel.isHidden(4), false);
                assert.strictEqual(hiddenRangeModel.isHidden(5), false);
                assert.strictEqual(hiddenRangeModel.isHidden(6), false);
                assert.strictEqual(hiddenRangeModel.isHidden(7), false);
                assert.strictEqual(hiddenRangeModel.isHidden(8), false);
                assert.strictEqual(hiddenRangeModel.isHidden(9), false);
                assert.strictEqual(hiddenRangeModel.isHidden(10), false);
            }
            finally {
                textModel.dispose();
                hiddenRangeModel.dispose();
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlkZGVuUmFuZ2VNb2RlbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9mb2xkaW5nL3Rlc3QvYnJvd3Nlci9oaWRkZW5SYW5nZU1vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBbUJBLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7UUFDaEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLFNBQVMsQ0FBQyxDQUFDLGVBQXVCLEVBQUUsYUFBcUI7WUFDeEQsT0FBTyxFQUFFLGVBQWUsRUFBRSxhQUFhLEVBQUUsQ0FBQztRQUMzQyxDQUFDO1FBRUQsU0FBUyxZQUFZLENBQUMsTUFBZ0IsRUFBRSxlQUFnQyxFQUFFLE9BQWdCO1lBQ3pGLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRSxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0ksQ0FBQztRQUVELElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1lBQ3RCLE1BQU0sS0FBSyxHQUFHO2dCQUNkLE1BQU0sQ0FBQyxLQUFLO2dCQUNaLE1BQU0sQ0FBQyxZQUFZO2dCQUNuQixNQUFNLENBQUMsS0FBSztnQkFDWixNQUFNLENBQUMsV0FBVztnQkFDbEIsTUFBTSxDQUFDLGdCQUFnQjtnQkFDdkIsTUFBTSxDQUFDLGlCQUFpQjtnQkFDeEIsTUFBTSxDQUFDLGVBQWU7Z0JBQ3RCLE1BQU0sQ0FBQyxPQUFPO2dCQUNkLE1BQU0sQ0FBQyxLQUFLO2dCQUNaLE9BQU8sQ0FBQyxHQUFHO2FBQUMsQ0FBQztZ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