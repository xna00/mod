/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/base/test/common/utils", "vs/platform/actions/common/actions", "vs/platform/actions/common/menuService", "vs/platform/commands/test/common/nullCommandService", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/storage/common/storage"], function (require, exports, assert, lifecycle_1, uuid_1, utils_1, actions_1, menuService_1, nullCommandService_1, mockKeybindingService_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // --- service instances
    const contextKeyService = new class extends mockKeybindingService_1.MockContextKeyService {
        contextMatchesRules() {
            return true;
        }
    };
    // --- tests
    suite('MenuService', function () {
        let menuService;
        const disposables = new lifecycle_1.DisposableStore();
        let testMenuId;
        setup(function () {
            menuService = new menuService_1.MenuService(nullCommandService_1.NullCommandService, new storage_1.InMemoryStorageService());
            testMenuId = new actions_1.MenuId(`testo/${(0, uuid_1.generateUuid)()}`);
            disposables.clear();
        });
        teardown(function () {
            disposables.clear();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('group sorting', function () {
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'one', title: 'FOO' },
                group: '0_hello'
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'two', title: 'FOO' },
                group: 'hello'
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'three', title: 'FOO' },
                group: 'Hello'
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'four', title: 'FOO' },
                group: ''
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'five', title: 'FOO' },
                group: 'navigation'
            }));
            const groups = disposables.add(menuService.createMenu(testMenuId, contextKeyService)).getActions();
            assert.strictEqual(groups.length, 5);
            const [one, two, three, four, five] = groups;
            assert.strictEqual(one[0], 'navigation');
            assert.strictEqual(two[0], '0_hello');
            assert.strictEqual(three[0], 'hello');
            assert.strictEqual(four[0], 'Hello');
            assert.strictEqual(five[0], '');
        });
        test('in group sorting, by title', function () {
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'a', title: 'aaa' },
                group: 'Hello'
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'b', title: 'fff' },
                group: 'Hello'
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'c', title: 'zzz' },
                group: 'Hello'
            }));
            const groups = disposables.add(menuService.createMenu(testMenuId, contextKeyService)).getActions();
            assert.strictEqual(groups.length, 1);
            const [, actions] = groups[0];
            assert.strictEqual(actions.length, 3);
            const [one, two, three] = actions;
            assert.strictEqual(one.id, 'a');
            assert.strictEqual(two.id, 'b');
            assert.strictEqual(three.id, 'c');
        });
        test('in group sorting, by title and order', function () {
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'a', title: 'aaa' },
                group: 'Hello',
                order: 10
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'b', title: 'fff' },
                group: 'Hello'
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'c', title: 'zzz' },
                group: 'Hello',
                order: -1
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'd', title: 'yyy' },
                group: 'Hello',
                order: -1
            }));
            const groups = disposables.add(menuService.createMenu(testMenuId, contextKeyService)).getActions();
            assert.strictEqual(groups.length, 1);
            const [, actions] = groups[0];
            assert.strictEqual(actions.length, 4);
            const [one, two, three, four] = actions;
            assert.strictEqual(one.id, 'd');
            assert.strictEqual(two.id, 'c');
            assert.strictEqual(three.id, 'b');
            assert.strictEqual(four.id, 'a');
        });
        test('in group sorting, special: navigation', function () {
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'a', title: 'aaa' },
                group: 'navigation',
                order: 1.3
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'b', title: 'fff' },
                group: 'navigation',
                order: 1.2
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(testMenuId, {
                command: { id: 'c', title: 'zzz' },
                group: 'navigation',
                order: 1.1
            }));
            const groups = disposables.add(menuService.createMenu(testMenuId, contextKeyService)).getActions();
            assert.strictEqual(groups.length, 1);
            const [[, actions]] = groups;
            assert.strictEqual(actions.length, 3);
            const [one, two, three] = actions;
            assert.strictEqual(one.id, 'c');
            assert.strictEqual(two.id, 'b');
            assert.strictEqual(three.id, 'a');
        });
        test('special MenuId palette', function () {
            disposables.add(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
                command: { id: 'a', title: 'Explicit' }
            }));
            disposables.add(actions_1.MenuRegistry.addCommand({ id: 'b', title: 'Implicit' }));
            let foundA = false;
            let foundB = false;
            for (const item of actions_1.MenuRegistry.getMenuItems(actions_1.MenuId.CommandPalette)) {
                if ((0, actions_1.isIMenuItem)(item)) {
                    if (item.command.id === 'a') {
                        assert.strictEqual(item.command.title, 'Explicit');
                        foundA = true;
                    }
                    if (item.command.id === 'b') {
                        assert.strictEqual(item.command.title, 'Implicit');
                        foundB = true;
                    }
                }
            }
            assert.strictEqual(foundA, true);
            assert.strictEqual(foundB, true);
        });
        test('Extension contributed submenus missing with errors in output #155030', function () {
            const id = (0, uuid_1.generateUuid)();
            const menu = new actions_1.MenuId(id);
            assert.throws(() => new actions_1.MenuId(id));
            assert.ok(menu === actions_1.MenuId.for(id));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYWN0aW9ucy90ZXN0L2NvbW1vbi9tZW51U2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLHdCQUF3QjtJQUV4QixNQUFNLGlCQUFpQixHQUFHLElBQUksS0FBTSxTQUFRLDZDQUFxQjtRQUN2RCxtQkFBbUI7WUFDM0IsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO0tBQ0QsQ0FBQztJQUVGLFlBQVk7SUFFWixLQUFLLENBQUMsYUFBYSxFQUFFO1FBRXBCLElBQUksV0FBd0IsQ0FBQztRQUM3QixNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxJQUFJLFVBQWtCLENBQUM7UUFFdkIsS0FBSyxDQUFDO1lBQ0wsV0FBVyxHQUFHLElBQUkseUJBQVcsQ0FBQyx1Q0FBa0IsRUFBRSxJQUFJLGdDQUFzQixFQUFFLENBQUMsQ0FBQztZQUNoRixVQUFVLEdBQUcsSUFBSSxnQkFBTSxDQUFDLFNBQVMsSUFBQSxtQkFBWSxHQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ25ELFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQztZQUNSLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsZUFBZSxFQUFFO1lBRXJCLFdBQVcsQ0FBQyxHQUFHLENBQUMsc0JBQVksQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFO2dCQUN2RCxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7Z0JB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