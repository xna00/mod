/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/splitview/splitview", "vs/base/common/event", "vs/base/test/common/utils"], function (require, exports, assert, splitview_1, event_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestView {
        get minimumSize() { return this._minimumSize; }
        set minimumSize(size) { this._minimumSize = size; this._onDidChange.fire(undefined); }
        get maximumSize() { return this._maximumSize; }
        set maximumSize(size) { this._maximumSize = size; this._onDidChange.fire(undefined); }
        get element() { this._onDidGetElement.fire(); return this._element; }
        get size() { return this._size; }
        get orthogonalSize() { return this._orthogonalSize; }
        constructor(_minimumSize, _maximumSize, priority = 0 /* LayoutPriority.Normal */) {
            this._minimumSize = _minimumSize;
            this._maximumSize = _maximumSize;
            this.priority = priority;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._element = document.createElement('div');
            this._onDidGetElement = new event_1.Emitter();
            this.onDidGetElement = this._onDidGetElement.event;
            this._size = 0;
            this._orthogonalSize = 0;
            this._onDidLayout = new event_1.Emitter();
            this.onDidLayout = this._onDidLayout.event;
            this._onDidFocus = new event_1.Emitter();
            this.onDidFocus = this._onDidFocus.event;
            assert(_minimumSize <= _maximumSize, 'splitview view minimum size must be <= maximum size');
        }
        layout(size, _offset, orthogonalSize) {
            this._size = size;
            this._orthogonalSize = orthogonalSize;
            this._onDidLayout.fire({ size, orthogonalSize });
        }
        focus() {
            this._onDidFocus.fire();
        }
        dispose() {
            this._onDidChange.dispose();
            this._onDidGetElement.dispose();
            this._onDidLayout.dispose();
            this._onDidFocus.dispose();
        }
    }
    function getSashes(splitview) {
        return splitview.sashItems.map((i) => i.sash);
    }
    suite('Splitview', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let container;
        setup(() => {
            container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.width = `${200}px`;
            container.style.height = `${200}px`;
        });
        test('empty splitview has empty DOM', () => {
            store.add(new splitview_1.SplitView(container));
            assert.strictEqual(container.firstElementChild.firstElementChild.childElementCount, 0, 'split view should be empty');
        });
        test('has views and sashes as children', () => {
            const view1 = store.add(new TestView(20, 20));
            const view2 = store.add(new TestView(20, 20));
            const view3 = store.add(new TestView(20, 20));
            const splitview = store.add(new splitview_1.SplitView(container));
            splitview.addView(view1, 20);
            splitview.addView(view2, 20);
            splitview.addView(view3, 20);
            let viewQuery = container.querySelectorAll('.monaco-split-view2 > .monaco-scrollable-element > .split-view-container > .split-view-view');
            assert.strictEqual(viewQuery.length, 3, 'split view should have 3 views');
            let sashQuery = container.querySelectorAll('.monaco-split-view2 > .sash-container > .monaco-sash');
            assert.strictEqual(sashQuery.length, 2, 'split view should have 2 sashes');
            splitview.removeView(2);
            viewQuery = container.querySelectorAll('.monaco-split-view2 > .monaco-scrollable-element > .split-view-container > .split-view-view');
            assert.strictEqual(viewQuery.length, 2, 'split view should have 2 views');
            sashQuery = container.querySelectorAll('.monaco-split-view2 > .sash-container > .monaco-sash');
            assert.strictEqual(sashQuery.length, 1, 'split view should have 1 sash');
            splitview.removeView(0);
            viewQuery = container.querySelectorAll('.monaco-split-view2 > .monaco-scrollable-element > .split-view-container > .split-view-view');
            assert.strictEqual(viewQuery.length, 1, 'split view should have 1 view');
            sashQuery = container.querySelectorAll('.monaco-split-view2 > .sash-container > .monaco-sash');
            assert.strictEqual(sashQuery.length, 0, 'split view should have no sashes');
            splitview.removeView(0);
            viewQuery = container.querySelectorAll('.monaco-split-view2 > .monaco-scrollable-element > .split-view-container > .split-view-view');
            assert.strictEqual(viewQuery.length, 0, 'split view should have no views');
            sashQuery = container.querySelectorAll('.monaco-split-view2 > .sash-container > .monaco-sash');
            assert.strictEqual(sashQuery.length, 0, 'split view should have no sashes');
        });
        test('calls view methods on addView and removeView', () => {
            const view = store.add(new TestView(20, 20));
            const splitview = store.add(new splitview_1.SplitView(container));
            let didLayout = false;
            store.add(view.onDidLayout(() => didLayout = true));
            store.add(view.onDidGetElement(() => undefined));
            splitview.addView(view, 20);
            assert.strictEqual(view.size, 20, 'view has right size');
            assert(didLayout, 'layout is called');
            assert(didLayout, 'render is called');
        });
        test('stretches view to viewport', () => {
            const view = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const splitview = store.add(new splitview_1.SplitView(container));
            splitview.layout(200);
            splitview.addView(view, 20);
            assert.strictEqual(view.size, 200, 'view is stretched');
            splitview.layout(200);
            assert.strictEqual(view.size, 200, 'view stayed the same');
            splitview.layout(100);
            assert.strictEqual(view.size, 100, 'view is collapsed');
            splitview.layout(20);
            assert.strictEqual(view.size, 20, 'view is collapsed');
            splitview.layout(10);
            assert.strictEqual(view.size, 20, 'view is clamped');
            splitview.layout(200);
            assert.strictEqual(view.size, 200, 'view is stretched');
        });
        test('can resize views', () => {
            const view1 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view2 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view3 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const splitview = store.add(new splitview_1.SplitView(container));
            splitview.layout(200);
            splitview.addView(view1, 20);
            splitview.addView(view2, 20);
            splitview.addView(view3, 20);
            assert.strictEqual(view1.size, 160, 'view1 is stretched');
            assert.strictEqual(view2.size, 20, 'view2 size is 20');
            assert.strictEqual(view3.size, 20, 'view3 size is 20');
            splitview.resizeView(1, 40);
            assert.strictEqual(view1.size, 140, 'view1 is collapsed');
            assert.strictEqual(view2.size, 40, 'view2 is stretched');
            assert.strictEqual(view3.size, 20, 'view3 stays the same');
            splitview.resizeView(0, 70);
            assert.strictEqual(view1.size, 70, 'view1 is collapsed');
            assert.strictEqual(view2.size, 40, 'view2 stays the same');
            assert.strictEqual(view3.size, 90, 'view3 is stretched');
            splitview.resizeView(2, 40);
            assert.strictEqual(view1.size, 70, 'view1 stays the same');
            assert.strictEqual(view2.size, 90, 'view2 is collapsed');
            assert.strictEqual(view3.size, 40, 'view3 is stretched');
        });
        test('reacts to view changes', () => {
            const view1 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view2 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view3 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const splitview = store.add(new splitview_1.SplitView(container));
            splitview.layout(200);
            splitview.addView(view1, 20);
            splitview.addView(view2, 20);
            splitview.addView(view3, 20);
            assert.strictEqual(view1.size, 160, 'view1 is stretched');
            assert.strictEqual(view2.size, 20, 'view2 size is 20');
            assert.strictEqual(view3.size, 20, 'view3 size is 20');
            view1.maximumSize = 20;
            assert.strictEqual(view1.size, 20, 'view1 is collapsed');
            assert.strictEqual(view2.size, 20, 'view2 stays the same');
            assert.strictEqual(view3.size, 160, 'view3 is stretched');
            view3.maximumSize = 40;
            assert.strictEqual(view1.size, 20, 'view1 stays the same');
            assert.strictEqual(view2.size, 140, 'view2 is stretched');
            assert.strictEqual(view3.size, 40, 'view3 is collapsed');
            view2.maximumSize = 200;
            assert.strictEqual(view1.size, 20, 'view1 stays the same');
            assert.strictEqual(view2.size, 140, 'view2 stays the same');
            assert.strictEqual(view3.size, 40, 'view3 stays the same');
            view3.maximumSize = Number.POSITIVE_INFINITY;
            view3.minimumSize = 100;
            assert.strictEqual(view1.size, 20, 'view1 is collapsed');
            assert.strictEqual(view2.size, 80, 'view2 is collapsed');
            assert.strictEqual(view3.size, 100, 'view3 is stretched');
        });
        test('sashes are properly enabled/disabled', () => {
            const view1 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view2 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view3 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const splitview = store.add(new splitview_1.SplitView(container));
            splitview.layout(200);
            splitview.addView(view1, splitview_1.Sizing.Distribute);
            splitview.addView(view2, splitview_1.Sizing.Distribute);
            splitview.addView(view3, splitview_1.Sizing.Distribute);
            const sashes = getSashes(splitview);
            assert.strictEqual(sashes.length, 2, 'there are two sashes');
            assert.strictEqual(sashes[0].state, 3 /* SashState.Enabled */, 'first sash is enabled');
            assert.strictEqual(sashes[1].state, 3 /* SashState.Enabled */, 'second sash is enabled');
            splitview.layout(60);
            assert.strictEqual(sashes[0].state, 0 /* SashState.Disabled */, 'first sash is disabled');
            assert.strictEqual(sashes[1].state, 0 /* SashState.Disabled */, 'second sash is disabled');
            splitview.layout(20);
            assert.strictEqual(sashes[0].state, 0 /* SashState.Disabled */, 'first sash is disabled');
            assert.strictEqual(sashes[1].state, 0 /* SashState.Disabled */, 'second sash is disabled');
            splitview.layout(200);
            assert.strictEqual(sashes[0].state, 3 /* SashState.Enabled */, 'first sash is enabled');
            assert.strictEqual(sashes[1].state, 3 /* SashState.Enabled */, 'second sash is enabled');
            view1.maximumSize = 20;
            assert.strictEqual(sashes[0].state, 0 /* SashState.Disabled */, 'first sash is disabled');
            assert.strictEqual(sashes[1].state, 3 /* SashState.Enabled */, 'second sash is enabled');
            view2.maximumSize = 20;
            assert.strictEqual(sashes[0].state, 0 /* SashState.Disabled */, 'first sash is disabled');
            assert.strictEqual(sashes[1].state, 0 /* SashState.Disabled */, 'second sash is disabled');
            view1.maximumSize = 300;
            assert.strictEqual(sashes[0].state, 1 /* SashState.AtMinimum */, 'first sash is enabled');
            assert.strictEqual(sashes[1].state, 1 /* SashState.AtMinimum */, 'second sash is enabled');
            view2.maximumSize = 200;
            assert.strictEqual(sashes[0].state, 1 /* SashState.AtMinimum */, 'first sash is enabled');
            assert.strictEqual(sashes[1].state, 1 /* SashState.AtMinimum */, 'second sash is enabled');
            splitview.resizeView(0, 40);
            assert.strictEqual(sashes[0].state, 3 /* SashState.Enabled */, 'first sash is enabled');
            assert.strictEqual(sashes[1].state, 3 /* SashState.Enabled */, 'second sash is enabled');
        });
        test('issue #35497', () => {
            const view1 = store.add(new TestView(160, Number.POSITIVE_INFINITY));
            const view2 = store.add(new TestView(66, 66));
            const splitview = store.add(new splitview_1.SplitView(container));
            splitview.layout(986);
            splitview.addView(view1, 142, 0);
            assert.strictEqual(view1.size, 986, 'first view is stretched');
            store.add(view2.onDidGetElement(() => {
                assert.throws(() => splitview.resizeView(1, 922));
                assert.throws(() => splitview.resizeView(1, 922));
            }));
            splitview.addView(view2, 66, 0);
            assert.strictEqual(view2.size, 66, 'second view is fixed');
            assert.strictEqual(view1.size, 986 - 66, 'first view is collapsed');
            const viewContainers = container.querySelectorAll('.split-view-view');
            assert.strictEqual(viewContainers.length, 2, 'there are two view containers');
            assert.strictEqual(viewContainers.item(0).style.height, '66px', 'second view container is 66px');
            assert.strictEqual(viewContainers.item(1).style.height, `${986 - 66}px`, 'first view container is 66px');
        });
        test('automatic size distribution', () => {
            const view1 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view2 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view3 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const splitview = store.add(new splitview_1.SplitView(container));
            splitview.layout(200);
            splitview.addView(view1, splitview_1.Sizing.Distribute);
            assert.strictEqual(view1.size, 200);
            splitview.addView(view2, 50);
            assert.deepStrictEqual([view1.size, view2.size], [150, 50]);
            splitview.addView(view3, splitview_1.Sizing.Distribute);
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [66, 66, 68]);
            splitview.removeView(1, splitview_1.Sizing.Distribute);
            assert.deepStrictEqual([view1.size, view3.size], [100, 100]);
        });
        test('add views before layout', () => {
            const view1 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view2 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view3 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const splitview = store.add(new splitview_1.SplitView(container));
            splitview.addView(view1, 100);
            splitview.addView(view2, 75);
            splitview.addView(view3, 25);
            splitview.layout(200);
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [67, 67, 66]);
        });
        test('split sizing', () => {
            const view1 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view2 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view3 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const splitview = store.add(new splitview_1.SplitView(container));
            splitview.layout(200);
            splitview.addView(view1, splitview_1.Sizing.Distribute);
            assert.strictEqual(view1.size, 200);
            splitview.addView(view2, splitview_1.Sizing.Split(0));
            assert.deepStrictEqual([view1.size, view2.size], [100, 100]);
            splitview.addView(view3, splitview_1.Sizing.Split(1));
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [100, 50, 50]);
        });
        test('split sizing 2', () => {
            const view1 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view2 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view3 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const splitview = store.add(new splitview_1.SplitView(container));
            splitview.layout(200);
            splitview.addView(view1, splitview_1.Sizing.Distribute);
            assert.strictEqual(view1.size, 200);
            splitview.addView(view2, splitview_1.Sizing.Split(0));
            assert.deepStrictEqual([view1.size, view2.size], [100, 100]);
            splitview.addView(view3, splitview_1.Sizing.Split(0));
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [50, 100, 50]);
        });
        test('proportional layout', () => {
            const view1 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view2 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const splitview = store.add(new splitview_1.SplitView(container));
            splitview.layout(200);
            splitview.addView(view1, splitview_1.Sizing.Distribute);
            splitview.addView(view2, splitview_1.Sizing.Distribute);
            assert.deepStrictEqual([view1.size, view2.size], [100, 100]);
            splitview.layout(100);
            assert.deepStrictEqual([view1.size, view2.size], [50, 50]);
        });
        test('disable proportional layout', () => {
            const view1 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view2 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const splitview = store.add(new splitview_1.SplitView(container, { proportionalLayout: false }));
            splitview.layout(200);
            splitview.addView(view1, splitview_1.Sizing.Distribute);
            splitview.addView(view2, splitview_1.Sizing.Distribute);
            assert.deepStrictEqual([view1.size, view2.size], [100, 100]);
            splitview.layout(100);
            assert.deepStrictEqual([view1.size, view2.size], [80, 20]);
        });
        test('high layout priority', () => {
            const view1 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view2 = store.add(new TestView(20, Number.POSITIVE_INFINITY, 2 /* LayoutPriority.High */));
            const view3 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const splitview = store.add(new splitview_1.SplitView(container, { proportionalLayout: false }));
            splitview.layout(200);
            splitview.addView(view1, splitview_1.Sizing.Distribute);
            splitview.addView(view2, splitview_1.Sizing.Distribute);
            splitview.addView(view3, splitview_1.Sizing.Distribute);
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [66, 68, 66]);
            splitview.layout(180);
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [66, 48, 66]);
            splitview.layout(124);
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [66, 20, 38]);
            splitview.layout(60);
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [20, 20, 20]);
            splitview.layout(200);
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [20, 160, 20]);
        });
        test('low layout priority', () => {
            const view1 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view2 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view3 = store.add(new TestView(20, Number.POSITIVE_INFINITY, 1 /* LayoutPriority.Low */));
            const splitview = store.add(new splitview_1.SplitView(container, { proportionalLayout: false }));
            splitview.layout(200);
            splitview.addView(view1, splitview_1.Sizing.Distribute);
            splitview.addView(view2, splitview_1.Sizing.Distribute);
            splitview.addView(view3, splitview_1.Sizing.Distribute);
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [66, 68, 66]);
            splitview.layout(180);
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [66, 48, 66]);
            splitview.layout(132);
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [46, 20, 66]);
            splitview.layout(60);
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [20, 20, 20]);
            splitview.layout(200);
            assert.deepStrictEqual([view1.size, view2.size, view3.size], [20, 160, 20]);
        });
        test('context propagates to views', () => {
            const view1 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view2 = store.add(new TestView(20, Number.POSITIVE_INFINITY));
            const view3 = store.add(new TestView(20, Number.POSITIVE_INFINITY, 1 /* LayoutPriority.Low */));
            const splitview = store.add(new splitview_1.SplitView(container, { proportionalLayout: false }));
            splitview.layout(200);
            splitview.addView(view1, splitview_1.Sizing.Distribute);
            splitview.addView(view2, splitview_1.Sizing.Distribute);
            splitview.addView(view3, splitview_1.Sizing.Distribute);
            splitview.layout(200, 100);
            assert.deepStrictEqual([view1.orthogonalSize, view2.orthogonalSize, view3.orthogonalSize], [100, 100, 100]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BsaXR2aWV3LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9icm93c2VyL3VpL3NwbGl0dmlldy9zcGxpdHZpZXcudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxNQUFNLFFBQVE7UUFLYixJQUFJLFdBQVcsS0FBYSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELElBQUksV0FBVyxDQUFDLElBQVksSUFBSSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU5RixJQUFJLFdBQVcsS0FBYSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELElBQUksV0FBVyxDQUFDLElBQVksSUFBSSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUc5RixJQUFJLE9BQU8sS0FBa0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQU1sRixJQUFJLElBQUksS0FBYSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRXpDLElBQUksY0FBYyxLQUF5QixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBT3pFLFlBQ1MsWUFBb0IsRUFDcEIsWUFBb0IsRUFDbkIsd0NBQWdEO1lBRmpELGlCQUFZLEdBQVosWUFBWSxDQUFRO1lBQ3BCLGlCQUFZLEdBQVosWUFBWSxDQUFRO1lBQ25C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QUFDLENBQUM7WUFFM0QsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFFeEQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNyQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFFdkQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNyQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFFckQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFDekQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1lBQzdCLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDcEUsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUNwRSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxxQkFBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDdEQs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QyxJQUFJLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUNwRSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxxQkFBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUV0QixTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxrQkFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztZQUVwQyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU1RCxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxrQkFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTNFLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLGtCQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFF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