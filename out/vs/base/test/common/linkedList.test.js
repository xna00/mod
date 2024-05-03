/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/linkedList", "vs/base/test/common/utils"], function (require, exports, assert, linkedList_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('LinkedList', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertElements(list, ...elements) {
            // check size
            assert.strictEqual(list.size, elements.length);
            // assert toArray
            assert.deepStrictEqual(Array.from(list), elements);
            // assert Symbol.iterator (1)
            assert.deepStrictEqual([...list], elements);
            // assert Symbol.iterator (2)
            for (const item of list) {
                assert.strictEqual(item, elements.shift());
            }
            assert.strictEqual(elements.length, 0);
        }
        test('Push/Iter', () => {
            const list = new linkedList_1.LinkedList();
            list.push(0);
            list.push(1);
            list.push(2);
            assertElements(list, 0, 1, 2);
        });
        test('Push/Remove', () => {
            let list = new linkedList_1.LinkedList();
            let disp = list.push(0);
            list.push(1);
            list.push(2);
            disp();
            assertElements(list, 1, 2);
            list = new linkedList_1.LinkedList();
            list.push(0);
            disp = list.push(1);
            list.push(2);
            disp();
            assertElements(list, 0, 2);
            list = new linkedList_1.LinkedList();
            list.push(0);
            list.push(1);
            disp = list.push(2);
            disp();
            assertElements(list, 0, 1);
            list = new linkedList_1.LinkedList();
            list.push(0);
            list.push(1);
            disp = list.push(2);
            disp();
            disp();
            assertElements(list, 0, 1);
        });
        test('Push/toArray', () => {
            const list = new linkedList_1.LinkedList();
            list.push('foo');
            list.push('bar');
            list.push('far');
            list.push('boo');
            assertElements(list, 'foo', 'bar', 'far', 'boo');
        });
        test('unshift/Iter', () => {
            const list = new linkedList_1.LinkedList();
            list.unshift(0);
            list.unshift(1);
            list.unshift(2);
            assertElements(list, 2, 1, 0);
        });
        test('unshift/Remove', () => {
            let list = new linkedList_1.LinkedList();
            let disp = list.unshift(0);
            list.unshift(1);
            list.unshift(2);
            disp();
            assertElements(list, 2, 1);
            list = new linkedList_1.LinkedList();
            list.unshift(0);
            disp = list.unshift(1);
            list.unshift(2);
            disp();
            assertElements(list, 2, 0);
            list = new linkedList_1.LinkedList();
            list.unshift(0);
            list.unshift(1);
            disp = list.unshift(2);
            disp();
            assertElements(list, 1, 0);
        });
        test('unshift/toArray', () => {
            const list = new linkedList_1.LinkedList();
            list.unshift('foo');
            list.unshift('bar');
            list.unshift('far');
            list.unshift('boo');
            assertElements(list, 'boo', 'far', 'bar', 'foo');
        });
        test('pop/unshift', function () {
            const list = new linkedList_1.LinkedList();
            list.push('a');
            list.push('b');
            assertElements(list, 'a', 'b');
            const a = list.shift();
            assert.strictEqual(a, 'a');
            assertElements(list, 'b');
            list.unshift('a');
            assertElements(list, 'a', 'b');
            const b = list.pop();
            assert.strictEqual(b, 'b');
            assertElements(list, 'a');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua2VkTGlzdC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL2xpbmtlZExpc3QudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsWUFBWSxFQUFFO1FBRW5CLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLGNBQWMsQ0FBSSxJQUFtQixFQUFFLEdBQUcsUUFBYTtZQUUvRCxhQUFhO1lBQ2IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUUvQyxpQkFBaUI7WUFDakIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRW5ELDZCQUE2QjtZQUM3QixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUU1Qyw2QkFBNkI7WUFDN0IsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUNELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRUQsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7WUFDdEIsTUFBTSxJQUFJLEdBQUcsSUFBSSx1QkFBVSxFQUFVLENBQUM7WUFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FB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