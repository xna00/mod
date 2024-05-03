/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/contrib/folding/browser/indentRangeProvider", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, indentRangeProvider_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function assertRanges(lines, expected, offside, markers) {
        const model = (0, testTextModel_1.createTextModel)(lines.join('\n'));
        const actual = (0, indentRangeProvider_1.computeRanges)(model, offside, markers);
        const actualRanges = [];
        for (let i = 0; i < actual.length; i++) {
            actualRanges[i] = r(actual.getStartLineNumber(i), actual.getEndLineNumber(i), actual.getParentIndex(i));
        }
        assert.deepStrictEqual(actualRanges, expected);
        model.dispose();
    }
    function r(startLineNumber, endLineNumber, parentIndex, marker = false) {
        return { startLineNumber, endLineNumber, parentIndex };
    }
    suite('Indentation Folding', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Fold one level', () => {
            const range = [
                'A',
                '  A',
                '  A',
                '  A'
            ];
            assertRanges(range, [r(1, 4, -1)], true);
            assertRanges(range, [r(1, 4, -1)], false);
        });
        test('Fold two levels', () => {
            const range = [
                'A',
                '  A',
                '  A',
                '    A',
                '    A'
            ];
            assertRanges(range, [r(1, 5, -1), r(3, 5, 0)], true);
            assertRanges(range, [r(1, 5, -1), r(3, 5, 0)], false);
        });
        test('Fold three levels', () => {
            const range = [
                'A',
                '  A',
                '    A',
                '      A',
                'A'
            ];
            assertRanges(range, [r(1, 4, -1), r(2, 4, 0), r(3, 4, 1)], true);
            assertRanges(range, [r(1, 4, -1), r(2, 4, 0), r(3, 4, 1)], false);
        });
        test('Fold decreasing indent', () => {
            const range = [
                '    A',
                '  A',
                'A'
            ];
            assertRanges(range, [], true);
            assertRanges(range, [], false);
        });
        test('Fold Java', () => {
            assertRanges([
                /* 1*/ 'class A {',
                /* 2*/ '  void foo() {',
                /* 3*/ '    console.log();',
                /* 4*/ '    console.log();',
                /* 5*/ '  }',
                /* 6*/ '',
                /* 7*/ '  void bar() {',
                /* 8*/ '    console.log();',
                /* 9*/ '  }',
                /*10*/ '}',
                /*11*/ 'interface B {',
                /*12*/ '  void bar();',
                /*13*/ '}',
            ], [r(1, 9, -1), r(2, 4, 0), r(7, 8, 0), r(11, 12, -1)], false);
        });
        test('Fold Javadoc', () => {
            assertRanges([
                /* 1*/ '/**',
                /* 2*/ ' * Comment',
                /* 3*/ ' */',
                /* 4*/ 'class A {',
                /* 5*/ '  void foo() {',
                /* 6*/ '  }',
                /* 7*/ '}',
            ], [r(1, 3, -1), r(4, 6, -1)], false);
        });
        test('Fold Whitespace Java', () => {
            assertRanges([
                /* 1*/ 'class A {',
                /* 2*/ '',
                /* 3*/ '  void foo() {',
                /* 4*/ '     ',
                /* 5*/ '     return 0;',
                /* 6*/ '  }',
                /* 7*/ '      ',
                /* 8*/ '}',
            ], [r(1, 7, -1), r(3, 5, 0)], false);
        });
        test('Fold Whitespace Python', () => {
            assertRanges([
                /* 1*/ 'def a:',
                /* 2*/ '  pass',
                /* 3*/ '   ',
                /* 4*/ '  def b:',
                /* 5*/ '    pass',
                /* 6*/ '  ',
                /* 7*/ '      ',
                /* 8*/ 'def c: # since there was a deintent here'
            ], [r(1, 5, -1), r(4, 5, 0)], true);
        });
        test('Fold Tabs', () => {
            assertRanges([
                /* 1*/ 'class A {',
                /* 2*/ '\t\t',
                /* 3*/ '\tvoid foo() {',
                /* 4*/ '\t \t//hello',
                /* 5*/ '\t    return 0;',
                /* 6*/ '  \t}',
                /* 7*/ '      ',
                /* 8*/ '}',
            ], [r(1, 7, -1), r(3, 5, 0)], false);
        });
    });
    const markers = {
        start: /^\s*#region\b/,
        end: /^\s*#endregion\b/
    };
    suite('Folding with regions', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Inside region, indented', () => {
            assertRanges([
                /* 1*/ 'class A {',
                /* 2*/ '  #region',
                /* 3*/ '  void foo() {',
                /* 4*/ '     ',
                /* 5*/ '     return 0;',
                /* 6*/ '  }',
                /* 7*/ '  #endregion',
                /* 8*/ '}',
            ], [r(1, 7, -1), r(2, 7, 0, true), r(3, 5, 1)], false, markers);
        });
        test('Inside region, not indented', () => {
            assertRanges([
                /* 1*/ 'var x;',
                /* 2*/ '#region',
                /* 3*/ 'void foo() {',
                /* 4*/ '     ',
                /* 5*/ '     return 0;',
                /* 6*/ '  }',
                /* 7*/ '#endregion',
                /* 8*/ '',
            ], [r(2, 7, -1, true), r(3, 6, 0)], false, markers);
        });
        test('Empty Regions', () => {
            assertRanges([
                /* 1*/ 'var x;',
                /* 2*/ '#region',
                /* 3*/ '#endregion',
                /* 4*/ '#region',
                /* 5*/ '',
                /* 6*/ '#endregion',
                /* 7*/ 'var y;',
            ], [r(2, 3, -1, true), r(4, 6, -1, true)], false, markers);
        });
        test('Nested Regions', () => {
            assertRanges([
                /* 1*/ 'var x;',
                /* 2*/ '#region',
                /* 3*/ '#region',
                /* 4*/ '',
                /* 5*/ '#endregion',
                /* 6*/ '#endregion',
                /* 7*/ 'var y;',
            ], [r(2, 6, -1, true), r(3, 5, 0, true)], false, markers);
        });
        test('Nested Regions 2', () => {
            assertRanges([
                /* 1*/ 'class A {',
                /* 2*/ '  #region',
                /* 3*/ '',
                /* 4*/ '  #region',
                /* 5*/ '',
                /* 6*/ '  #endregion',
                /* 7*/ '  // comment',
                /* 8*/ '  #endregion',
                /* 9*/ '}',
            ], [r(1, 8, -1), r(2, 8, 0, true), r(4, 6, 1, true)], false, markers);
        });
        test('Incomplete Regions', () => {
            assertRanges([
                /* 1*/ 'class A {',
                /* 2*/ '#region',
                /* 3*/ '  // comment',
                /* 4*/ '}',
            ], [r(2, 3, -1)], false, markers);
        });
        test('Incomplete Regions 2', () => {
            assertRanges([
                /* 1*/ '',
                /* 2*/ '#region',
                /* 3*/ '#region',
                /* 4*/ '#region',
                /* 5*/ '  // comment',
                /* 6*/ '#endregion',
                /* 7*/ '#endregion',
                /* 8*/ ' // hello',
            ], [r(3, 7, -1, true), r(4, 6, 0, true)], false, markers);
        });
        test('Indented region before', () => {
            assertRanges([
                /* 1*/ 'if (x)',
                /* 2*/ '  return;',
                /* 3*/ '',
                /* 4*/ '#region',
                /* 5*/ '  // comment',
                /* 6*/ '#endregion',
            ], [r(1, 3, -1), r(4, 6, -1, true)], false, markers);
        });
        test('Indented region before 2', () => {
            assertRanges([
                /* 1*/ 'if (x)',
                /* 2*/ '  log();',
                /* 3*/ '',
                /* 4*/ '    #region',
                /* 5*/ '      // comment',
                /* 6*/ '    #endregion',
            ], [r(1, 6, -1), r(2, 6, 0), r(4, 6, 1, true)], false, markers);
        });
        test('Indented region in-between', () => {
            assertRanges([
                /* 1*/ '#region',
                /* 2*/ '  // comment',
                /* 3*/ '  if (x)',
                /* 4*/ '    return;',
                /* 5*/ '',
                /* 6*/ '#endregion',
            ], [r(1, 6, -1, true), r(3, 5, 0)], false, markers);
        });
        test('Indented region after', () => {
            assertRanges([
                /* 1*/ '#region',
                /* 2*/ '  // comment',
                /* 3*/ '',
                /* 4*/ '#endregion',
                /* 5*/ '  if (x)',
                /* 6*/ '    return;',
            ], [r(1, 4, -1, true), r(5, 6, -1)], false, markers);
        });
        test('With off-side', () => {
            assertRanges([
                /* 1*/ '#region',
                /* 2*/ '  ',
                /* 3*/ '',
                /* 4*/ '#endregion',
                /* 5*/ '',
            ], [r(1, 4, -1, true)], true, markers);
        });
        test('Nested with off-side', () => {
            assertRanges([
                /* 1*/ '#region',
                /* 2*/ '  ',
                /* 3*/ '#region',
                /* 4*/ '',
                /* 5*/ '#endregion',
                /* 6*/ '',
                /* 7*/ '#endregion',
                /* 8*/ '',
            ], [r(1, 7, -1, true), r(3, 5, 0, true)], true, markers);
        });
        test('Issue 35981', () => {
            assertRanges([
                /* 1*/ 'function thisFoldsToEndOfPage() {',
                /* 2*/ '  const variable = []',
                /* 3*/ '    // #region',
                /* 4*/ '    .reduce((a, b) => a,[]);',
                /* 5*/ '}',
                /* 6*/ '',
                /* 7*/ 'function thisFoldsProperly() {',
                /* 8*/ '  const foo = "bar"',
                /* 9*/ '}',
            ], [r(1, 4, -1), r(2, 4, 0), r(7, 8, -1)], false, markers);
        });
        test('Misspelled Markers', () => {
            assertRanges([
                /* 1*/ '#Region',
                /* 2*/ '#endregion',
                /* 3*/ '#regionsandmore',
                /* 4*/ '#endregion',
                /* 5*/ '#region',
                /* 6*/ '#end region',
                /* 7*/ '#region',
                /* 8*/ '#endregionff',
            ], [], true, markers);
        });
        test('Issue 79359', () => {
            assertRanges([
                /* 1*/ '#region',
                /* 2*/ '',
                /* 3*/ 'class A',
                /* 4*/ '  foo',
                /* 5*/ '',
                /* 6*/ 'class A',
                /* 7*/ '  foo',
                /* 8*/ '',
                /* 9*/ '#endregion',
            ], [r(1, 9, -1, true), r(3, 4, 0), r(6, 7, 0)], true, markers);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50UmFuZ2VQcm92aWRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9mb2xkaW5nL3Rlc3QvYnJvd3Nlci9pbmRlbnRSYW5nZVByb3ZpZGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFjaEcsU0FBUyxZQUFZLENBQUMsS0FBZSxFQUFFLFFBQStCLEVBQUUsT0FBZ0IsRUFBRSxPQUF3QjtRQUNqSCxNQUFNLEtBQUssR0FBRyxJQUFBLCtCQUFlLEVBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sTUFBTSxHQUFHLElBQUEsbUNBQWEsRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRXRELE1BQU0sWUFBWSxHQUEwQixFQUFFLENBQUM7UUFDL0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN4QyxZQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pHLENBQUM7UUFDRCxNQUFNLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMvQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVELFNBQVMsQ0FBQyxDQUFDLGVBQXVCLEVBQUUsYUFBcUIsRUFBRSxXQUFtQixFQUFFLE1BQU0sR0FBRyxLQUFLO1FBQzdG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