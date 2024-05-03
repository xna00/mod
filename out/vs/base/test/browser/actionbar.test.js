/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/test/common/utils"], function (require, exports, assert, actionbar_1, actions_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Actionbar', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('prepareActions()', function () {
            const a1 = new actions_1.Separator();
            const a2 = new actions_1.Separator();
            const a3 = store.add(new actions_1.Action('a3'));
            const a4 = new actions_1.Separator();
            const a5 = new actions_1.Separator();
            const a6 = store.add(new actions_1.Action('a6'));
            const a7 = new actions_1.Separator();
            const actions = (0, actionbar_1.prepareActions)([a1, a2, a3, a4, a5, a6, a7]);
            assert.strictEqual(actions.length, 3); // duplicate separators get removed
            assert(actions[0] === a3);
            assert(actions[1] === a5);
            assert(actions[2] === a6);
        });
        test('hasAction()', function () {
            const container = document.createElement('div');
            const actionbar = store.add(new actionbar_1.ActionBar(container));
            const a1 = store.add(new actions_1.Action('a1'));
            const a2 = store.add(new actions_1.Action('a2'));
            actionbar.push(a1);
            assert.strictEqual(actionbar.hasAction(a1), true);
            assert.strictEqual(actionbar.hasAction(a2), false);
            actionbar.pull(0);
            assert.strictEqual(actionbar.hasAction(a1), false);
            actionbar.push(a1, { index: 1 });
            actionbar.push(a2, { index: 0 });
            assert.strictEqual(actionbar.hasAction(a1), true);
            assert.strictEqual(actionbar.hasAction(a2), true);
            actionbar.pull(0);
            assert.strictEqual(actionbar.hasAction(a1), true);
            assert.strictEqual(actionbar.hasAction(a2), false);
            actionbar.pull(0);
            assert.strictEqual(actionbar.hasAction(a1), false);
            assert.strictEqual(actionbar.hasAction(a2), false);
            actionbar.push(a1);
            assert.strictEqual(actionbar.hasAction(a1), true);
            actionbar.clear();
            assert.strictEqual(actionbar.hasAction(a1), false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uYmFyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9icm93c2VyL2FjdGlvbmJhci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLEtBQUssQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1FBRXZCLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxJQUFJLENBQUMsa0JBQWtCLEVBQUU7WUFDeEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxtQkFBUyxFQUFFLENBQUM7WUFDM0IsTUFBTSxFQUFFLEdBQUcsSUFBSSxtQkFBUyxFQUFFLENBQUM7WUFDM0IsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGdCQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN2QyxNQUFNLEVBQUUsR0FBRyxJQUFJLG1CQUFTLEVBQUUsQ0FBQztZQUMzQixNQUFNLEVBQUUsR0FBRyxJQUFJLG1CQUFTLEVBQUUsQ0FBQztZQUMzQixNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksZ0JBQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sRUFBRSxHQUFHLElBQUksbUJBQVMsRUFBRSxDQUFDO1lBRTNCLE1BQU0sT0FBTyxHQUFHLElBQUEsMEJBQWMsRUFBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsbUNBQW1DO1lBQzFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDMUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUMxQixNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUNuQixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxxQkFBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFdEQsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGdCQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN2QyxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksZ0JBQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRXZDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVuRCxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVuRCxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2pDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVsRCxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFbkQsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQixNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRW5ELFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xELFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNsQixNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9