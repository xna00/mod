/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/platform/storage/common/storage", "vs/workbench/contrib/testing/common/testExplorerFilterState"], function (require, exports, assert, lifecycle_1, utils_1, storage_1, testExplorerFilterState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TestExplorerFilterState', () => {
        let t;
        let ds;
        teardown(() => {
            ds.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            ds = new lifecycle_1.DisposableStore();
            t = ds.add(new testExplorerFilterState_1.TestExplorerFilterState(ds.add(new storage_1.InMemoryStorageService())));
        });
        const assertFilteringFor = (expected) => {
            for (const [term, expectation] of Object.entries(expected)) {
                assert.strictEqual(t.isFilteringFor(term), expectation, `expected filtering for ${term} === ${expectation}`);
            }
        };
        const termFiltersOff = {
            ["@failed" /* TestFilterTerm.Failed */]: false,
            ["@executed" /* TestFilterTerm.Executed */]: false,
            ["@doc" /* TestFilterTerm.CurrentDoc */]: false,
            ["@hidden" /* TestFilterTerm.Hidden */]: false,
        };
        test('filters simple globs', () => {
            t.setText('hello, !world');
            assert.deepStrictEqual(t.globList, [{ text: 'hello', include: true }, { text: 'world', include: false }]);
            assert.deepStrictEqual(t.includeTags, new Set());
            assert.deepStrictEqual(t.excludeTags, new Set());
            assertFilteringFor(termFiltersOff);
        });
        test('filters to patterns', () => {
            t.setText('@doc');
            assert.deepStrictEqual(t.globList, []);
            assert.deepStrictEqual(t.includeTags, new Set());
            assert.deepStrictEqual(t.excludeTags, new Set());
            assertFilteringFor({
                ...termFiltersOff,
                ["@doc" /* TestFilterTerm.CurrentDoc */]: true,
            });
        });
        test('filters to tags', () => {
            t.setText('@hello:world !@foo:bar');
            assert.deepStrictEqual(t.globList, []);
            assert.deepStrictEqual(t.includeTags, new Set(['hello\0world']));
            assert.deepStrictEqual(t.excludeTags, new Set(['foo\0bar']));
            assertFilteringFor(termFiltersOff);
        });
        test('filters to mixed terms and tags', () => {
            t.setText('@hello:world foo, !bar @doc !@foo:bar');
            assert.deepStrictEqual(t.globList, [{ text: 'foo', include: true }, { text: 'bar', include: false }]);
            assert.deepStrictEqual(t.includeTags, new Set(['hello\0world']));
            assert.deepStrictEqual(t.excludeTags, new Set(['foo\0bar']));
            assertFilteringFor({
                ...termFiltersOff,
                ["@doc" /* TestFilterTerm.CurrentDoc */]: true,
            });
        });
        test('parses quotes', () => {
            t.setText('@hello:"world" @foo:\'bar\' baz');
            assert.deepStrictEqual(t.globList, [{ text: 'baz', include: true }]);
            assert.deepStrictEqual([...t.includeTags], ['hello\0world', 'foo\0bar']);
            assert.deepStrictEqual(t.excludeTags, new Set());
        });
        test('parses quotes with escapes', () => {
            t.setText('@hello:"world\\"1" foo');
            assert.deepStrictEqual(t.globList, [{ text: 'foo', include: true }]);
            assert.deepStrictEqual([...t.includeTags], ['hello\0world"1']);
            assert.deepStrictEqual(t.excludeTags, new Set());
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdEV4cGxvcmVyRmlsdGVyU3RhdGUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy90ZXN0L2NvbW1vbi90ZXN0RXhwbG9yZXJGaWx0ZXJTdGF0ZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7UUFDckMsSUFBSSxDQUEwQixDQUFDO1FBQy9CLElBQUksRUFBbUIsQ0FBQztRQUV4QixRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLEVBQUUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMzQixDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGlEQUF1QixDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxnQ0FBc0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9FLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLFFBQTZDLEVBQUUsRUFBRTtZQUM1RSxLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBc0IsQ0FBQyxFQUFFLFdBQVcsRUFBRSwwQkFBMEIsSUFBSSxRQUFRLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDaEksQ0FBQztRQUNGLENBQUMsQ0FBQztRQUVG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