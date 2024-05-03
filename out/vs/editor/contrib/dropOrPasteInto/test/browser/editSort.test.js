define(["require", "exports", "assert", "vs/base/common/hierarchicalKind", "vs/base/test/common/utils", "vs/editor/contrib/dropOrPasteInto/browser/edit"], function (require, exports, assert, hierarchicalKind_1, utils_1, edit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createTestEdit(kind, args) {
        return {
            title: '',
            insertText: '',
            kind: new hierarchicalKind_1.HierarchicalKind(kind),
            ...args,
        };
    }
    suite('sortEditsByYieldTo', () => {
        test('Should noop for empty edits', () => {
            const edits = [];
            assert.deepStrictEqual((0, edit_1.sortEditsByYieldTo)(edits), []);
        });
        test('Yielded to edit should get sorted after target', () => {
            const edits = [
                createTestEdit('a', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('b') }] }),
                createTestEdit('b'),
            ];
            assert.deepStrictEqual((0, edit_1.sortEditsByYieldTo)(edits).map(x => x.kind?.value), ['b', 'a']);
        });
        test('Should handle chain of yield to', () => {
            {
                const edits = [
                    createTestEdit('c', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('a') }] }),
                    createTestEdit('a', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('b') }] }),
                    createTestEdit('b'),
                ];
                assert.deepStrictEqual((0, edit_1.sortEditsByYieldTo)(edits).map(x => x.kind?.value), ['b', 'a', 'c']);
            }
            {
                const edits = [
                    createTestEdit('a', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('b') }] }),
                    createTestEdit('c', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('a') }] }),
                    createTestEdit('b'),
                ];
                assert.deepStrictEqual((0, edit_1.sortEditsByYieldTo)(edits).map(x => x.kind?.value), ['b', 'a', 'c']);
            }
        });
        test(`Should not reorder when yield to isn't used`, () => {
            const edits = [
                createTestEdit('c', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('x') }] }),
                createTestEdit('a', { yieldTo: [{ kind: new hierarchicalKind_1.HierarchicalKind('y') }] }),
                createTestEdit('b'),
            ];
            assert.deepStrictEqual((0, edit_1.sortEditsByYieldTo)(edits).map(x => x.kind?.value), ['c', 'a', 'b']);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNvcnQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZHJvcE9yUGFzdGVJbnRvL3Rlc3QvYnJvd3Nlci9lZGl0U29ydC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVdBLFNBQVMsY0FBYyxDQUFDLElBQVksRUFBRSxJQUFrQztRQUN2RSxPQUFPO1lBQ04sS0FBSyxFQUFFLEVBQUU7WUFDVCxVQUFVLEVBQUUsRUFBRTtZQUNkLElBQUksRUFBRSxJQUFJLG1DQUFnQixDQUFDLElBQUksQ0FBQztZQUNoQyxHQUFHLElBQUk7U0FDUCxDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7UUFFaEMsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtZQUN4QyxNQUFNLEtBQUssR0FBeUIsRUFBRSxDQUFDO1lBRXZDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSx5QkFBa0IsRUFBQyxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN2RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnREFBZ0QsRUFBRSxHQUFHLEVBQUU7WUFDM0QsTUFBTSxLQUFLLEdBQXlCO2dCQUNuQyxjQUFjLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxtQ0FBZ0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDdkUsY0FBYyxDQUFDLEdBQUcsQ0FBQzthQUNuQixDQUFDO1lBQ0YsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLHlCQUFrQixFQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxD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