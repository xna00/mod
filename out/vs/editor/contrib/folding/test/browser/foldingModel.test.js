define(["require", "exports", "assert", "vs/base/common/strings", "vs/base/test/common/utils", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/contrib/folding/browser/foldingModel", "vs/editor/contrib/folding/browser/indentRangeProvider", "vs/editor/test/common/testTextModel"], function (require, exports, assert, strings_1, utils_1, editOperation_1, position_1, range_1, textModel_1, foldingModel_1, indentRangeProvider_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestDecorationProvider = void 0;
    class TestDecorationProvider {
        static { this.collapsedDecoration = textModel_1.ModelDecorationOptions.register({
            description: 'test',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            linesDecorationsClassName: 'folding'
        }); }
        static { this.expandedDecoration = textModel_1.ModelDecorationOptions.register({
            description: 'test',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            linesDecorationsClassName: 'folding'
        }); }
        static { this.hiddenDecoration = textModel_1.ModelDecorationOptions.register({
            description: 'test',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            linesDecorationsClassName: 'folding'
        }); }
        constructor(model) {
            this.model = model;
        }
        getDecorationOption(isCollapsed, isHidden) {
            if (isHidden) {
                return TestDecorationProvider.hiddenDecoration;
            }
            if (isCollapsed) {
                return TestDecorationProvider.collapsedDecoration;
            }
            return TestDecorationProvider.expandedDecoration;
        }
        changeDecorations(callback) {
            return this.model.changeDecorations(callback);
        }
        removeDecorations(decorationIds) {
            this.model.changeDecorations((changeAccessor) => {
                changeAccessor.deltaDecorations(decorationIds, []);
            });
        }
        getDecorations() {
            const decorations = this.model.getAllDecorations();
            const res = [];
            for (const decoration of decorations) {
                if (decoration.options === TestDecorationProvider.hiddenDecoration) {
                    res.push({ line: decoration.range.startLineNumber, type: 'hidden' });
                }
                else if (decoration.options === TestDecorationProvider.collapsedDecoration) {
                    res.push({ line: decoration.range.startLineNumber, type: 'collapsed' });
                }
                else if (decoration.options === TestDecorationProvider.expandedDecoration) {
                    res.push({ line: decoration.range.startLineNumber, type: 'expanded' });
                }
            }
            return res;
        }
    }
    exports.TestDecorationProvider = TestDecorationProvider;
    suite('Folding Model', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function r(startLineNumber, endLineNumber, isCollapsed = false) {
            return { startLineNumber, endLineNumber, isCollapsed };
        }
        function d(line, type) {
            return { line, type };
        }
        function assertRegion(actual, expected, message) {
            assert.strictEqual(!!actual, !!expected, message);
            if (actual && expected) {
                assert.strictEqual(actual.startLineNumber, expected.startLineNumber, message);
                assert.strictEqual(actual.endLineNumber, expected.endLineNumber, message);
                assert.strictEqual(actual.isCollapsed, expected.isCollapsed, message);
            }
        }
        function assertFoldedRanges(foldingModel, expectedRegions, message) {
            const actualRanges = [];
            const actual = foldingModel.regions;
            for (let i = 0; i < actual.length; i++) {
                if (actual.isCollapsed(i)) {
                    actualRanges.push(r(actual.getStartLineNumber(i), actual.getEndLineNumber(i)));
                }
            }
            assert.deepStrictEqual(actualRanges, expectedRegions, message);
        }
        function assertRanges(foldingModel, expectedRegions, message) {
            const actualRanges = [];
            const actual = foldingModel.regions;
            for (let i = 0; i < actual.length; i++) {
                actualRanges.push(r(actual.getStartLineNumber(i), actual.getEndLineNumber(i), actual.isCollapsed(i)));
            }
            assert.deepStrictEqual(actualRanges, expectedRegions, message);
        }
        function assertDecorations(foldingModel, expectedDecoration, message) {
            const decorationProvider = foldingModel.decorationProvider;
            assert.deepStrictEqual(decorationProvider.getDecorations(), expectedDecoration, message);
        }
        function assertRegions(actual, expectedRegions, message) {
            assert.deepStrictEqual(actual.map(r => ({ startLineNumber: r.startLineNumber, endLineNumber: r.endLineNumber, isCollapsed: r.isCollapsed })), expectedRegions, message);
        }
        test('getRegionAtLine', () => {
            const lines = [
                /* 1*/ '/**',
                /* 2*/ ' * Comment',
                /* 3*/ ' */',
                /* 4*/ 'class A {',
                /* 5*/ '  void foo() {',
                /* 6*/ '    // comment {',
                /* 7*/ '  }',
                /* 8*/ '}'
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, undefined);
                foldingModel.update(ranges);
                const r1 = r(1, 3, false);
                const r2 = r(4, 7, false);
                const r3 = r(5, 6, false);
                assertRanges(foldingModel, [r1, r2, r3]);
                assertRegion(foldingModel.getRegionAtLine(1), r1, '1');
                assertRegion(foldingModel.getRegionAtLine(2), r1, '2');
                assertRegion(foldingModel.getRegionAtLine(3), r1, '3');
                assertRegion(foldingModel.getRegionAtLine(4), r2, '4');
                assertRegion(foldingModel.getRegionAtLine(5), r3, '5');
                assertRegion(foldingModel.getRegionAtLine(6), r3, '5');
                assertRegion(foldingModel.getRegionAtLine(7), r2, '6');
                assertRegion(foldingModel.getRegionAtLine(8), null, '7');
            }
            finally {
                textModel.dispose();
            }
        });
        test('collapse', () => {
            const lines = [
                /* 1*/ '/**',
                /* 2*/ ' * Comment',
                /* 3*/ ' */',
                /* 4*/ 'class A {',
                /* 5*/ '  void foo() {',
                /* 6*/ '    // comment {',
                /* 7*/ '  }',
                /* 8*/ '}'
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, undefined);
                foldingModel.update(ranges);
                const r1 = r(1, 3, false);
                const r2 = r(4, 7, false);
                const r3 = r(5, 6, false);
                assertRanges(foldingModel, [r1, r2, r3]);
                foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(1)]);
                foldingModel.update(ranges);
                assertRanges(foldingModel, [r(1, 3, true), r2, r3]);
                foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(5)]);
                foldingModel.update(ranges);
                assertRanges(foldingModel, [r(1, 3, true), r2, r(5, 6, true)]);
                foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(7)]);
                foldingModel.update(ranges);
                assertRanges(foldingModel, [r(1, 3, true), r(4, 7, true), r(5, 6, true)]);
                textModel.dispose();
            }
            finally {
                textModel.dispose();
            }
        });
        test('update', () => {
            const lines = [
                /* 1*/ '/**',
                /* 2*/ ' * Comment',
                /* 3*/ ' */',
                /* 4*/ 'class A {',
                /* 5*/ '  void foo() {',
                /* 6*/ '    // comment {',
                /* 7*/ '  }',
                /* 8*/ '}'
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, undefined);
                foldingModel.update(ranges);
                const r1 = r(1, 3, false);
                const r2 = r(4, 7, false);
                const r3 = r(5, 6, false);
                assertRanges(foldingModel, [r1, r2, r3]);
                foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(2), foldingModel.getRegionAtLine(5)]);
                textModel.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(4, 1), '//hello\n')]);
                foldingModel.update((0, indentRangeProvider_1.computeRanges)(textModel, false, undefined));
                assertRanges(foldingModel, [r(1, 3, true), r(5, 8, false), r(6, 7, true)]);
            }
            finally {
                textModel.dispose();
            }
        });
        test('delete', () => {
            const lines = [
                /* 1*/ 'function foo() {',
                /* 2*/ '  switch (x) {',
                /* 3*/ '    case 1:',
                /* 4*/ '      //hello1',
                /* 5*/ '      break;',
                /* 6*/ '    case 2:',
                /* 7*/ '      //hello2',
                /* 8*/ '      break;',
                /* 9*/ '    case 3:',
                /* 10*/ '      //hello3',
                /* 11*/ '      break;',
                /* 12*/ '  }',
                /* 13*/ '}'
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, undefined);
                foldingModel.update(ranges);
                const r1 = r(1, 12, false);
                const r2 = r(2, 11, false);
                const r3 = r(3, 5, false);
                const r4 = r(6, 8, false);
                const r5 = r(9, 11, false);
                assertRanges(foldingModel, [r1, r2, r3, r4, r5]);
                foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(6)]);
                textModel.applyEdits([editOperation_1.EditOperation.delete(new range_1.Range(6, 11, 9, 0))]);
                foldingModel.update((0, indentRangeProvider_1.computeRanges)(textModel, false, undefined));
                assertRanges(foldingModel, [r(1, 9, false), r(2, 8, false), r(3, 5, false), r(6, 8, false)]);
            }
            finally {
                textModel.dispose();
            }
        });
        test('getRegionsInside', () => {
            const lines = [
                /* 1*/ '/**',
                /* 2*/ ' * Comment',
                /* 3*/ ' */',
                /* 4*/ 'class A {',
                /* 5*/ '  void foo() {',
                /* 6*/ '    // comment {',
                /* 7*/ '  }',
                /* 8*/ '}'
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, undefined);
                foldingModel.update(ranges);
                const r1 = r(1, 3, false);
                const r2 = r(4, 7, false);
                const r3 = r(5, 6, false);
                assertRanges(foldingModel, [r1, r2, r3]);
                const region1 = foldingModel.getRegionAtLine(r1.startLineNumber);
                const region2 = foldingModel.getRegionAtLine(r2.startLineNumber);
                const region3 = foldingModel.getRegionAtLine(r3.startLineNumber);
                assertRegions(foldingModel.getRegionsInside(null), [r1, r2, r3], '1');
                assertRegions(foldingModel.getRegionsInside(region1), [], '2');
                assertRegions(foldingModel.getRegionsInside(region2), [r3], '3');
                assertRegions(foldingModel.getRegionsInside(region3), [], '4');
            }
            finally {
                textModel.dispose();
            }
        });
        test('getRegionsInsideWithLevel', () => {
            const lines = [
                /* 1*/ '//#region',
                /* 2*/ '//#endregion',
                /* 3*/ 'class A {',
                /* 4*/ '  void foo() {',
                /* 5*/ '    if (true) {',
                /* 6*/ '        return;',
                /* 7*/ '    }',
                /* 8*/ '    if (true) {',
                /* 9*/ '      return;',
                /* 10*/ '    }',
                /* 11*/ '  }',
                /* 12*/ '}'
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, { start: /^\/\/#region$/, end: /^\/\/#endregion$/ });
                foldingModel.update(ranges);
                const r1 = r(1, 2, false);
                const r2 = r(3, 11, false);
                const r3 = r(4, 10, false);
                const r4 = r(5, 6, false);
                const r5 = r(8, 9, false);
                const region1 = foldingModel.getRegionAtLine(r1.startLineNumber);
                const region2 = foldingModel.getRegionAtLine(r2.startLineNumber);
                const region3 = foldingModel.getRegionAtLine(r3.startLineNumber);
                assertRanges(foldingModel, [r1, r2, r3, r4, r5]);
                assertRegions(foldingModel.getRegionsInside(null, (r, level) => level === 1), [r1, r2], '1');
                assertRegions(foldingModel.getRegionsInside(null, (r, level) => level === 2), [r3], '2');
                assertRegions(foldingModel.getRegionsInside(null, (r, level) => level === 3), [r4, r5], '3');
                assertRegions(foldingModel.getRegionsInside(region2, (r, level) => level === 1), [r3], '4');
                assertRegions(foldingModel.getRegionsInside(region2, (r, level) => level === 2), [r4, r5], '5');
                assertRegions(foldingModel.getRegionsInside(region3, (r, level) => level === 1), [r4, r5], '6');
                assertRegions(foldingModel.getRegionsInside(region2, (r, level) => r.hidesLine(9)), [r3, r5], '7');
                assertRegions(foldingModel.getRegionsInside(region1, (r, level) => level === 1), [], '8');
            }
            finally {
                textModel.dispose();
            }
        });
        test('getRegionAtLine2', () => {
            const lines = [
                /* 1*/ '//#region',
                /* 2*/ 'class A {',
                /* 3*/ '  void foo() {',
                /* 4*/ '    if (true) {',
                /* 5*/ '      //hello',
                /* 6*/ '    }',
                /* 7*/ '',
                /* 8*/ '  }',
                /* 9*/ '}',
                /* 10*/ '//#endregion',
                /* 11*/ ''
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, { start: /^\/\/#region$/, end: /^\/\/#endregion$/ });
                foldingModel.update(ranges);
                const r1 = r(1, 10, false);
                const r2 = r(2, 8, false);
                const r3 = r(3, 7, false);
                const r4 = r(4, 5, false);
                assertRanges(foldingModel, [r1, r2, r3, r4]);
                assertRegions(foldingModel.getAllRegionsAtLine(1), [r1], '1');
                assertRegions(foldingModel.getAllRegionsAtLine(2), [r1, r2].reverse(), '2');
                assertRegions(foldingModel.getAllRegionsAtLine(3), [r1, r2, r3].reverse(), '3');
                assertRegions(foldingModel.getAllRegionsAtLine(4), [r1, r2, r3, r4].reverse(), '4');
                assertRegions(foldingModel.getAllRegionsAtLine(5), [r1, r2, r3, r4].reverse(), '5');
                assertRegions(foldingModel.getAllRegionsAtLine(6), [r1, r2, r3].reverse(), '6');
                assertRegions(foldingModel.getAllRegionsAtLine(7), [r1, r2, r3].reverse(), '7');
                assertRegions(foldingModel.getAllRegionsAtLine(8), [r1, r2].reverse(), '8');
                assertRegions(foldingModel.getAllRegionsAtLine(9), [r1], '9');
                assertRegions(foldingModel.getAllRegionsAtLine(10), [r1], '10');
                assertRegions(foldingModel.getAllRegionsAtLine(11), [], '10');
            }
            finally {
                textModel.dispose();
            }
        });
        test('setCollapseStateRecursivly', () => {
            const lines = [
                /* 1*/ '//#region',
                /* 2*/ '//#endregion',
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
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, { start: /^\/\/#region$/, end: /^\/\/#endregion$/ });
                foldingModel.update(ranges);
                const r1 = r(1, 2, false);
                const r2 = r(3, 12, false);
                const r3 = r(4, 11, false);
                const r4 = r(5, 6, false);
                const r5 = r(9, 10, false);
                assertRanges(foldingModel, [r1, r2, r3, r4, r5]);
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true, Number.MAX_VALUE, [4]);
                assertFoldedRanges(foldingModel, [r3, r4, r5], '1');
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false, Number.MAX_VALUE, [8]);
                assertFoldedRanges(foldingModel, [], '2');
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true, Number.MAX_VALUE, [12]);
                assertFoldedRanges(foldingModel, [r2, r3, r4, r5], '1');
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false, Number.MAX_VALUE, [7]);
                assertFoldedRanges(foldingModel, [r2], '1');
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false);
                assertFoldedRanges(foldingModel, [], '1');
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true);
                assertFoldedRanges(foldingModel, [r1, r2, r3, r4, r5], '1');
            }
            finally {
                textModel.dispose();
            }
        });
        test('setCollapseStateAtLevel', () => {
            const lines = [
                /* 1*/ '//#region',
                /* 2*/ '//#endregion',
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
                /* 13*/ '  //#region',
                /* 14*/ '  const bar = 9;',
                /* 15*/ '  //#endregion',
                /* 16*/ '}'
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, { start: /^\s*\/\/#region$/, end: /^\s*\/\/#endregion$/ });
                foldingModel.update(ranges);
                const r1 = r(1, 2, false);
                const r2 = r(3, 15, false);
                const r3 = r(4, 11, false);
                const r4 = r(5, 6, false);
                const r5 = r(9, 10, false);
                const r6 = r(13, 15, false);
                assertRanges(foldingModel, [r1, r2, r3, r4, r5, r6]);
                (0, foldingModel_1.setCollapseStateAtLevel)(foldingModel, 1, true, []);
                assertFoldedRanges(foldingModel, [r1, r2], '1');
                (0, foldingModel_1.setCollapseStateAtLevel)(foldingModel, 1, false, [5]);
                assertFoldedRanges(foldingModel, [r2], '2');
                (0, foldingModel_1.setCollapseStateAtLevel)(foldingModel, 1, false, [1]);
                assertFoldedRanges(foldingModel, [], '3');
                (0, foldingModel_1.setCollapseStateAtLevel)(foldingModel, 2, true, []);
                assertFoldedRanges(foldingModel, [r3, r6], '4');
                (0, foldingModel_1.setCollapseStateAtLevel)(foldingModel, 2, false, [5, 6]);
                assertFoldedRanges(foldingModel, [r3], '5');
                (0, foldingModel_1.setCollapseStateAtLevel)(foldingModel, 3, true, [4, 9]);
                assertFoldedRanges(foldingModel, [r3, r4], '6');
                (0, foldingModel_1.setCollapseStateAtLevel)(foldingModel, 3, false, [4, 9]);
                assertFoldedRanges(foldingModel, [r3], '7');
            }
            finally {
                textModel.dispose();
            }
        });
        test('setCollapseStateLevelsDown', () => {
            const lines = [
                /* 1*/ '//#region',
                /* 2*/ '//#endregion',
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
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, { start: /^\/\/#region$/, end: /^\/\/#endregion$/ });
                foldingModel.update(ranges);
                const r1 = r(1, 2, false);
                const r2 = r(3, 12, false);
                const r3 = r(4, 11, false);
                const r4 = r(5, 6, false);
                const r5 = r(9, 10, false);
                assertRanges(foldingModel, [r1, r2, r3, r4, r5]);
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true, 1, [4]);
                assertFoldedRanges(foldingModel, [r3], '1');
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true, 2, [4]);
                assertFoldedRanges(foldingModel, [r3, r4, r5], '2');
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false, 2, [3]);
                assertFoldedRanges(foldingModel, [r4, r5], '3');
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false, 2, [2]);
                assertFoldedRanges(foldingModel, [r4, r5], '4');
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true, 4, [2]);
                assertFoldedRanges(foldingModel, [r1, r4, r5], '5');
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false, 4, [2, 3]);
                assertFoldedRanges(foldingModel, [], '6');
            }
            finally {
                textModel.dispose();
            }
        });
        test('setCollapseStateLevelsUp', () => {
            const lines = [
                /* 1*/ '//#region',
                /* 2*/ '//#endregion',
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
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, { start: /^\/\/#region$/, end: /^\/\/#endregion$/ });
                foldingModel.update(ranges);
                const r1 = r(1, 2, false);
                const r2 = r(3, 12, false);
                const r3 = r(4, 11, false);
                const r4 = r(5, 6, false);
                const r5 = r(9, 10, false);
                assertRanges(foldingModel, [r1, r2, r3, r4, r5]);
                (0, foldingModel_1.setCollapseStateLevelsUp)(foldingModel, true, 1, [4]);
                assertFoldedRanges(foldingModel, [r3], '1');
                (0, foldingModel_1.setCollapseStateLevelsUp)(foldingModel, true, 2, [4]);
                assertFoldedRanges(foldingModel, [r2, r3], '2');
                (0, foldingModel_1.setCollapseStateLevelsUp)(foldingModel, false, 4, [1, 3, 4]);
                assertFoldedRanges(foldingModel, [], '3');
                (0, foldingModel_1.setCollapseStateLevelsUp)(foldingModel, true, 2, [10]);
                assertFoldedRanges(foldingModel, [r3, r5], '4');
            }
            finally {
                textModel.dispose();
            }
        });
        test('setCollapseStateUp', () => {
            const lines = [
                /* 1*/ '//#region',
                /* 2*/ '//#endregion',
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
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, { start: /^\/\/#region$/, end: /^\/\/#endregion$/ });
                foldingModel.update(ranges);
                const r1 = r(1, 2, false);
                const r2 = r(3, 12, false);
                const r3 = r(4, 11, false);
                const r4 = r(5, 6, false);
                const r5 = r(9, 10, false);
                assertRanges(foldingModel, [r1, r2, r3, r4, r5]);
                (0, foldingModel_1.setCollapseStateUp)(foldingModel, true, [5]);
                assertFoldedRanges(foldingModel, [r4], '1');
                (0, foldingModel_1.setCollapseStateUp)(foldingModel, true, [5]);
                assertFoldedRanges(foldingModel, [r3, r4], '2');
                (0, foldingModel_1.setCollapseStateUp)(foldingModel, true, [4]);
                assertFoldedRanges(foldingModel, [r2, r3, r4], '2');
            }
            finally {
                textModel.dispose();
            }
        });
        test('setCollapseStateForMatchingLines', () => {
            const lines = [
                /* 1*/ '/**',
                /* 2*/ ' * the class',
                /* 3*/ ' */',
                /* 4*/ 'class A {',
                /* 5*/ '  /**',
                /* 6*/ '   * the foo',
                /* 7*/ '   */',
                /* 8*/ '  void foo() {',
                /* 9*/ '    /*',
                /* 10*/ '     * the comment',
                /* 11*/ '     */',
                /* 12*/ '  }',
                /* 13*/ '}'
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, { start: /^\/\/#region$/, end: /^\/\/#endregion$/ });
                foldingModel.update(ranges);
                const r1 = r(1, 3, false);
                const r2 = r(4, 12, false);
                const r3 = r(5, 7, false);
                const r4 = r(8, 11, false);
                const r5 = r(9, 11, false);
                assertRanges(foldingModel, [r1, r2, r3, r4, r5]);
                const regExp = new RegExp('^\\s*' + (0, strings_1.escapeRegExpCharacters)('/*'));
                (0, foldingModel_1.setCollapseStateForMatchingLines)(foldingModel, regExp, true);
                assertFoldedRanges(foldingModel, [r1, r3, r5], '1');
            }
            finally {
                textModel.dispose();
            }
        });
        test('setCollapseStateForRest', () => {
            const lines = [
                /* 1*/ '//#region',
                /* 2*/ '//#endregion',
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
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, { start: /^\/\/#region$/, end: /^\/\/#endregion$/ });
                foldingModel.update(ranges);
                const r1 = r(1, 2, false);
                const r2 = r(3, 12, false);
                const r3 = r(4, 11, false);
                const r4 = r(5, 6, false);
                const r5 = r(9, 10, false);
                assertRanges(foldingModel, [r1, r2, r3, r4, r5]);
                (0, foldingModel_1.setCollapseStateForRest)(foldingModel, true, [5]);
                assertFoldedRanges(foldingModel, [r1, r5], '1');
                (0, foldingModel_1.setCollapseStateForRest)(foldingModel, false, [5]);
                assertFoldedRanges(foldingModel, [], '2');
                (0, foldingModel_1.setCollapseStateForRest)(foldingModel, true, [1]);
                assertFoldedRanges(foldingModel, [r2, r3, r4, r5], '3');
                (0, foldingModel_1.setCollapseStateForRest)(foldingModel, true, [3]);
                assertFoldedRanges(foldingModel, [r1, r2, r3, r4, r5], '3');
            }
            finally {
                textModel.dispose();
            }
        });
        test('folding decoration', () => {
            const lines = [
                /* 1*/ 'class A {',
                /* 2*/ '  void foo() {',
                /* 3*/ '    if (true) {',
                /* 4*/ '      hoo();',
                /* 5*/ '    }',
                /* 6*/ '  }',
                /* 7*/ '}'
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, undefined);
                foldingModel.update(ranges);
                const r1 = r(1, 6, false);
                const r2 = r(2, 5, false);
                const r3 = r(3, 4, false);
                assertRanges(foldingModel, [r1, r2, r3]);
                assertDecorations(foldingModel, [d(1, 'expanded'), d(2, 'expanded'), d(3, 'expanded')]);
                foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(2)]);
                assertRanges(foldingModel, [r1, r(2, 5, true), r3]);
                assertDecorations(foldingModel, [d(1, 'expanded'), d(2, 'collapsed'), d(3, 'hidden')]);
                foldingModel.update(ranges);
                assertRanges(foldingModel, [r1, r(2, 5, true), r3]);
                assertDecorations(foldingModel, [d(1, 'expanded'), d(2, 'collapsed'), d(3, 'hidden')]);
                foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(1)]);
                assertRanges(foldingModel, [r(1, 6, true), r(2, 5, true), r3]);
                assertDecorations(foldingModel, [d(1, 'collapsed'), d(2, 'hidden'), d(3, 'hidden')]);
                foldingModel.update(ranges);
                assertRanges(foldingModel, [r(1, 6, true), r(2, 5, true), r3]);
                assertDecorations(foldingModel, [d(1, 'collapsed'), d(2, 'hidden'), d(3, 'hidden')]);
                foldingModel.toggleCollapseState([foldingModel.getRegionAtLine(1), foldingModel.getRegionAtLine(3)]);
                assertRanges(foldingModel, [r1, r(2, 5, true), r(3, 4, true)]);
                assertDecorations(foldingModel, [d(1, 'expanded'), d(2, 'collapsed'), d(3, 'hidden')]);
                foldingModel.update(ranges);
                assertRanges(foldingModel, [r1, r(2, 5, true), r(3, 4, true)]);
                assertDecorations(foldingModel, [d(1, 'expanded'), d(2, 'collapsed'), d(3, 'hidden')]);
                textModel.dispose();
            }
            finally {
                textModel.dispose();
            }
        });
        test('fold jumping', () => {
            const lines = [
                /* 1*/ 'class A {',
                /* 2*/ '  void foo() {',
                /* 3*/ '    if (1) {',
                /* 4*/ '      a();',
                /* 5*/ '    } else if (2) {',
                /* 6*/ '      if (true) {',
                /* 7*/ '        b();',
                /* 8*/ '      }',
                /* 9*/ '    } else {',
                /* 10*/ '      c();',
                /* 11*/ '    }',
                /* 12*/ '  }',
                /* 13*/ '}'
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, undefined);
                foldingModel.update(ranges);
                const r1 = r(1, 12, false);
                const r2 = r(2, 11, false);
                const r3 = r(3, 4, false);
                const r4 = r(5, 8, false);
                const r5 = r(6, 7, false);
                const r6 = r(9, 10, false);
                assertRanges(foldingModel, [r1, r2, r3, r4, r5, r6]);
                // Test jump to parent.
                assert.strictEqual((0, foldingModel_1.getParentFoldLine)(7, foldingModel), 6);
                assert.strictEqual((0, foldingModel_1.getParentFoldLine)(6, foldingModel), 5);
                assert.strictEqual((0, foldingModel_1.getParentFoldLine)(5, foldingModel), 2);
                assert.strictEqual((0, foldingModel_1.getParentFoldLine)(2, foldingModel), 1);
                assert.strictEqual((0, foldingModel_1.getParentFoldLine)(1, foldingModel), null);
                // Test jump to previous.
                assert.strictEqual((0, foldingModel_1.getPreviousFoldLine)(10, foldingModel), 9);
                assert.strictEqual((0, foldingModel_1.getPreviousFoldLine)(9, foldingModel), 5);
                assert.strictEqual((0, foldingModel_1.getPreviousFoldLine)(5, foldingModel), 3);
                assert.strictEqual((0, foldingModel_1.getPreviousFoldLine)(3, foldingModel), null);
                // Test when not on a folding region start line.
                assert.strictEqual((0, foldingModel_1.getPreviousFoldLine)(4, foldingModel), 3);
                assert.strictEqual((0, foldingModel_1.getPreviousFoldLine)(7, foldingModel), 6);
                assert.strictEqual((0, foldingModel_1.getPreviousFoldLine)(8, foldingModel), 6);
                // Test jump to next.
                assert.strictEqual((0, foldingModel_1.getNextFoldLine)(3, foldingModel), 5);
                assert.strictEqual((0, foldingModel_1.getNextFoldLine)(5, foldingModel), 9);
                assert.strictEqual((0, foldingModel_1.getNextFoldLine)(9, foldingModel), null);
                // Test when not on a folding region start line.
                assert.strictEqual((0, foldingModel_1.getNextFoldLine)(4, foldingModel), 5);
                assert.strictEqual((0, foldingModel_1.getNextFoldLine)(7, foldingModel), 9);
                assert.strictEqual((0, foldingModel_1.getNextFoldLine)(8, foldingModel), 9);
            }
            finally {
                textModel.dispose();
            }
        });
        test('fold jumping issue #129503', () => {
            const lines = [
                /* 1*/ '',
                /* 2*/ 'if True:',
                /* 3*/ '  print(1)',
                /* 4*/ 'if True:',
                /* 5*/ '  print(1)',
                /* 6*/ ''
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const foldingModel = new foldingModel_1.FoldingModel(textModel, new TestDecorationProvider(textModel));
                const ranges = (0, indentRangeProvider_1.computeRanges)(textModel, false, undefined);
                foldingModel.update(ranges);
                const r1 = r(2, 3, false);
                const r2 = r(4, 6, false);
                assertRanges(foldingModel, [r1, r2]);
                // Test jump to next.
                assert.strictEqual((0, foldingModel_1.getNextFoldLine)(1, foldingModel), 2);
                assert.strictEqual((0, foldingModel_1.getNextFoldLine)(2, foldingModel), 4);
                assert.strictEqual((0, foldingModel_1.getNextFoldLine)(3, foldingModel), 4);
                assert.strictEqual((0, foldingModel_1.getNextFoldLine)(4, foldingModel), null);
                assert.strictEqual((0, foldingModel_1.getNextFoldLine)(5, foldingModel), null);
                assert.strictEqual((0, foldingModel_1.getNextFoldLine)(6, foldingModel), null);
                // Test jump to previous.
                assert.strictEqual((0, foldingModel_1.getPreviousFoldLine)(1, foldingModel), null);
                assert.strictEqual((0, foldingModel_1.getPreviousFoldLine)(2, foldingModel), null);
                assert.strictEqual((0, foldingModel_1.getPreviousFoldLine)(3, foldingModel), 2);
                assert.strictEqual((0, foldingModel_1.getPreviousFoldLine)(4, foldingModel), 2);
                assert.strictEqual((0, foldingModel_1.getPreviousFoldLine)(5, foldingModel), 4);
                assert.strictEqual((0, foldingModel_1.getPreviousFoldLine)(6, foldingModel), 4);
            }
            finally {
                textModel.dispose();
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGluZ01vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2ZvbGRpbmcvdGVzdC9icm93c2VyL2ZvbGRpbmdNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUE2QkEsTUFBYSxzQkFBc0I7aUJBRVYsd0JBQW1CLEdBQUcsa0NBQXNCLENBQUMsUUFBUSxDQUFDO1lBQzdFLFdBQVcsRUFBRSxNQUFNO1lBQ25CLFVBQVUsNERBQW9EO1lBQzlELHlCQUF5QixFQUFFLFNBQVM7U0FDcEMsQ0FBQyxDQUFDO2lCQUVxQix1QkFBa0IsR0FBRyxrQ0FBc0IsQ0FBQyxRQUFRLENBQUM7WUFDNUUsV0FBVyxFQUFFLE1BQU07WUFDbkIsVUFBVSw0REFBb0Q7WUFDOUQseUJBQXlCLEVBQUUsU0FBUztTQUNwQyxDQUFDLENBQUM7aUJBRXFCLHFCQUFnQixHQUFHLGtDQUFzQixDQUFDLFFBQVEsQ0FBQztZQUMxRSxXQUFXLEVBQUUsTUFBTTtZQUNuQixVQUFVLDREQUFvRDtZQUM5RCx5QkFBeUIsRUFBRSxTQUFTO1NBQ3BDLENBQUMsQ0FBQztRQUVILFlBQW9CLEtBQWlCO1lBQWpCLFVBQUssR0FBTCxLQUFLLENBQVk7UUFDckMsQ0FBQztRQUVELG1CQUFtQixDQUFDLFdBQW9CLEVBQUUsUUFBaUI7WUFDMUQsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxPQUFPLHNCQUFzQixDQUFDLGdCQUFnQixDQUFDO1lBQ2hELENBQUM7WUFDRCxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNqQixPQUFPLHNCQUFzQixDQUFDLG1CQUFtQixDQUFDO1lBQ25ELENBQUM7WUFDRCxPQUFPLHNCQUFzQixDQUFDLGtCQUFrQixDQUFDO1FBQ2xELENBQUM7UUFFRCxpQkFBaUIsQ0FBSSxRQUFnRTtZQUNwRixPQUFP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S0FBSyxDQUFDLENBQUM7Z0JBQzFCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMxQixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFMUIsWUFBWSxDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFekMsWUFBWSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUN2RCxZQUFZLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZELFlBQVksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDdkQsWUFBWSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUN2RCxZQUFZLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZELFlBQVksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDdkQsWUFBWSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUN2RCxZQUFZLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDMUQsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNyQixDQUFD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QUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXJGLFlBQVksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRTVCLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXJGLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFFLEVBQUUsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXZHLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXZGLFlBQVksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRTVCLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXZGLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNyQixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLENBQUM7UUFFRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1lBQ3pCLE1BQU0sS0FBSyxHQUFHO2dCQUNiLE1BQU0sQ0FBQyxXQUFXO2dCQUNsQixNQUFNLENBQUMsZ0JBQWdCO2dCQUN2QixNQUFNLENBQUMsY0FBYztnQkFDckIsTUFBTSxDQUFDLFlBQVk7Z0JBQ25CLE1BQU0sQ0FBQyxxQkFBcUI7Z0JBQzVCLE1BQU0sQ0FBQyxtQkFBbUI7Z0JBQzFCLE1BQU0sQ0FBQyxjQUFjO2dCQUNyQixNQUFNLENBQUMsU0FBUztnQkFDaEIsTUFBTSxDQUFDLGNBQWM7Z0JBQ3JCLE9BQU8sQ0FBQyxZQUFZO2dCQUNwQixPQUFPLENBQUMsT0FBTztnQkFDZixPQUFPLENBQUMsS0FBSztnQkFDYixPQUFPLENBQUMsR0FBRzthQUNYLENBQUM7WUFFRixNQUFNLFNBQVMsR0FBRyxJQUFBLCtCQUFlLEVBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQztnQkFDSixNQUFNLFlBQVksR0FBRyxJQUFJLDJCQUFZLENBQUMsU0FBUyxFQUFFLElBQUksc0JBQXNCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFFeEYsTUFBTSxNQUFNLEdBQUcsSUFBQSxtQ0FBYSxFQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzFELFlBQVksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRTVCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMzQixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDM0IsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzFCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMxQixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDMUIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzNCLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXJELHVCQUF1QjtnQkFDdkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLGdDQUFpQixFQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLGdDQUFpQixFQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLGdDQUFpQixFQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLGdDQUFpQixFQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLGdDQUFpQixFQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFN0QseUJBQXlCO2dCQUN6QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsa0NBQW1CLEVBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsa0NBQW1CLEVBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsa0NBQW1CLEVBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsa0NBQW1CLEVBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvRCxnREFBZ0Q7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxrQ0FBbUIsRUFBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxrQ0FBbUIsRUFBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxrQ0FBbUIsRUFBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRTVELHFCQUFxQjtnQkFDckIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDhCQUFlLEVBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsOEJBQWUsRUFBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw4QkFBZSxFQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDM0QsZ0RBQWdEO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsOEJBQWUsRUFBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw4QkFBZSxFQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDhCQUFlLEVBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXpELENBQUM7b0JBQVMsQ0FBQztnQkFDVixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckIsQ0FBQztRQUVGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDRCQUE0QixFQUFFLEdBQUcsRUFBRTtZQUN2QyxNQUFNLEtBQUssR0FBRztnQkFDYixNQUFNLENBQUMsRUFBRTtnQkFDVCxNQUFNLENBQUMsVUFBVTtnQkFDakIsTUFBTSxDQUFDLFlBQVk7Z0JBQ25CLE1BQU0sQ0FBQyxVQUFVO2dCQUNqQixNQUFNLENBQUMsWUFBWTtnQkFDbkIsTUFBTSxDQUFDLEVBQUU7YUFDVCxDQUFDO1lBRUYsTUFBTSxTQUFTLEdBQUcsSUFBQSwrQkFBZSxFQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwRCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxZQUFZLEdBQUcsSUFBSSwyQkFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBRXhGLE1BQU0sTUFBTSxHQUFHLElBQUEsbUNBQWEsRUFBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMxRCxZQUFZLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUU1QixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDMUIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzFCLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckMscUJBQXFCO2dCQUNyQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsOEJBQWUsRUFBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw4QkFBZSxFQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDhCQUFlLEVBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsOEJBQWUsRUFBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw4QkFBZSxFQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDhCQUFlLEVBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUUzRCx5QkFBeUI7Z0JBQ3pCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxrQ0FBbUIsRUFBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxrQ0FBbUIsRUFBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxrQ0FBbUIsRUFBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxrQ0FBbUIsRUFBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxrQ0FBbUIsRUFBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxrQ0FBbUIsRUFBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0QsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNyQixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9