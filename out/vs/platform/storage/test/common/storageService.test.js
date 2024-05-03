/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/platform/storage/common/storage"], function (require, exports, assert_1, lifecycle_1, utils_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createSuite = createSuite;
    function createSuite(params) {
        let storageService;
        const disposables = new lifecycle_1.DisposableStore();
        setup(async () => {
            storageService = await params.setup();
        });
        teardown(() => {
            disposables.clear();
            return params.teardown(storageService);
        });
        test('Get Data, Integer, Boolean (application)', () => {
            storeData(-1 /* StorageScope.APPLICATION */);
        });
        test('Get Data, Integer, Boolean (profile)', () => {
            storeData(0 /* StorageScope.PROFILE */);
        });
        test('Get Data, Integer, Boolean, Object (workspace)', () => {
            storeData(1 /* StorageScope.WORKSPACE */);
        });
        test('Storage change source', () => {
            const storageValueChangeEvents = [];
            storageService.onDidChangeValue(1 /* StorageScope.WORKSPACE */, undefined, disposables)(e => storageValueChangeEvents.push(e), undefined, disposables);
            // Explicit external source
            storageService.storeAll([{ key: 'testExternalChange', value: 'foobar', scope: 1 /* StorageScope.WORKSPACE */, target: 1 /* StorageTarget.MACHINE */ }], true);
            let storageValueChangeEvent = storageValueChangeEvents.find(e => e.key === 'testExternalChange');
            (0, assert_1.strictEqual)(storageValueChangeEvent?.external, true);
            // Default source
            storageService.storeAll([{ key: 'testChange', value: 'barfoo', scope: 1 /* StorageScope.WORKSPACE */, target: 1 /* StorageTarget.MACHINE */ }], false);
            storageValueChangeEvent = storageValueChangeEvents.find(e => e.key === 'testChange');
            (0, assert_1.strictEqual)(storageValueChangeEvent?.external, false);
            storageService.store('testChange', 'foobar', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            storageValueChangeEvent = storageValueChangeEvents.find(e => e.key === 'testChange');
            (0, assert_1.strictEqual)(storageValueChangeEvent?.external, false);
        });
        test('Storage change event scope (all keys)', () => {
            const storageValueChangeEvents = [];
            storageService.onDidChangeValue(1 /* StorageScope.WORKSPACE */, undefined, disposables)(e => storageValueChangeEvents.push(e), undefined, disposables);
            storageService.store('testChange', 'foobar', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            storageService.store('testChange2', 'foobar', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            storageService.store('testChange', 'foobar', -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            storageService.store('testChange', 'foobar', 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            storageService.store('testChange2', 'foobar', 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)(storageValueChangeEvents.length, 2);
        });
        test('Storage change event scope (specific key)', () => {
            const storageValueChangeEvents = [];
            storageService.onDidChangeValue(1 /* StorageScope.WORKSPACE */, 'testChange', disposables)(e => storageValueChangeEvents.push(e), undefined, disposables);
            storageService.store('testChange', 'foobar', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            storageService.store('testChange', 'foobar', 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            storageService.store('testChange', 'foobar', -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            storageService.store('testChange2', 'foobar', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            const storageValueChangeEvent = storageValueChangeEvents.find(e => e.key === 'testChange');
            (0, assert_1.ok)(storageValueChangeEvent);
            (0, assert_1.strictEqual)(storageValueChangeEvents.length, 1);
        });
        function storeData(scope) {
            let storageValueChangeEvents = [];
            storageService.onDidChangeValue(scope, undefined, disposables)(e => storageValueChangeEvents.push(e), undefined, disposables);
            (0, assert_1.strictEqual)(storageService.get('test.get', scope, 'foobar'), 'foobar');
            (0, assert_1.strictEqual)(storageService.get('test.get', scope, ''), '');
            (0, assert_1.strictEqual)(storageService.getNumber('test.getNumber', scope, 5), 5);
            (0, assert_1.strictEqual)(storageService.getNumber('test.getNumber', scope, 0), 0);
            (0, assert_1.strictEqual)(storageService.getBoolean('test.getBoolean', scope, true), true);
            (0, assert_1.strictEqual)(storageService.getBoolean('test.getBoolean', scope, false), false);
            (0, assert_1.deepStrictEqual)(storageService.getObject('test.getObject', scope, { 'foo': 'bar' }), { 'foo': 'bar' });
            (0, assert_1.deepStrictEqual)(storageService.getObject('test.getObject', scope, {}), {});
            (0, assert_1.deepStrictEqual)(storageService.getObject('test.getObject', scope, []), []);
            storageService.store('test.get', 'foobar', scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)(storageService.get('test.get', scope, (undefined)), 'foobar');
            let storageValueChangeEvent = storageValueChangeEvents.find(e => e.key === 'test.get');
            (0, assert_1.strictEqual)(storageValueChangeEvent?.scope, scope);
            (0, assert_1.strictEqual)(storageValueChangeEvent?.key, 'test.get');
            storageValueChangeEvents = [];
            storageService.store('test.get', '', scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)(storageService.get('test.get', scope, (undefined)), '');
            storageValueChangeEvent = storageValueChangeEvents.find(e => e.key === 'test.get');
            (0, assert_1.strictEqual)(storageValueChangeEvent.scope, scope);
            (0, assert_1.strictEqual)(storageValueChangeEvent.key, 'test.get');
            storageService.store('test.getNumber', 5, scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)(storageService.getNumber('test.getNumber', scope, (undefined)), 5);
            storageService.store('test.getNumber', 0, scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)(storageService.getNumber('test.getNumber', scope, (undefined)), 0);
            storageService.store('test.getBoolean', true, scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)(storageService.getBoolean('test.getBoolean', scope, (undefined)), true);
            storageService.store('test.getBoolean', false, scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)(storageService.getBoolean('test.getBoolean', scope, (undefined)), false);
            storageService.store('test.getObject', {}, scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.deepStrictEqual)(storageService.getObject('test.getObject', scope, (undefined)), {});
            storageService.store('test.getObject', [42], scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.deepStrictEqual)(storageService.getObject('test.getObject', scope, (undefined)), [42]);
            storageService.store('test.getObject', { 'foo': {} }, scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.deepStrictEqual)(storageService.getObject('test.getObject', scope, (undefined)), { 'foo': {} });
            (0, assert_1.strictEqual)(storageService.get('test.getDefault', scope, 'getDefault'), 'getDefault');
            (0, assert_1.strictEqual)(storageService.getNumber('test.getNumberDefault', scope, 5), 5);
            (0, assert_1.strictEqual)(storageService.getBoolean('test.getBooleanDefault', scope, true), true);
            (0, assert_1.deepStrictEqual)(storageService.getObject('test.getObjectDefault', scope, { 'foo': 42 }), { 'foo': 42 });
            storageService.storeAll([
                { key: 'test.storeAll1', value: 'foobar', scope, target: 1 /* StorageTarget.MACHINE */ },
                { key: 'test.storeAll2', value: 4, scope, target: 1 /* StorageTarget.MACHINE */ },
                { key: 'test.storeAll3', value: null, scope, target: 1 /* StorageTarget.MACHINE */ }
            ], false);
            (0, assert_1.strictEqual)(storageService.get('test.storeAll1', scope, 'foobar'), 'foobar');
            (0, assert_1.strictEqual)(storageService.get('test.storeAll2', scope, '4'), '4');
            (0, assert_1.strictEqual)(storageService.get('test.storeAll3', scope, 'null'), 'null');
        }
        test('Remove Data (application)', () => {
            removeData(-1 /* StorageScope.APPLICATION */);
        });
        test('Remove Data (profile)', () => {
            removeData(0 /* StorageScope.PROFILE */);
        });
        test('Remove Data (workspace)', () => {
            removeData(1 /* StorageScope.WORKSPACE */);
        });
        function removeData(scope) {
            const storageValueChangeEvents = [];
            storageService.onDidChangeValue(scope, undefined, disposables)(e => storageValueChangeEvents.push(e), undefined, disposables);
            storageService.store('test.remove', 'foobar', scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)('foobar', storageService.get('test.remove', scope, (undefined)));
            storageService.remove('test.remove', scope);
            (0, assert_1.ok)(!storageService.get('test.remove', scope, (undefined)));
            const storageValueChangeEvent = storageValueChangeEvents.find(e => e.key === 'test.remove');
            (0, assert_1.strictEqual)(storageValueChangeEvent?.scope, scope);
            (0, assert_1.strictEqual)(storageValueChangeEvent?.key, 'test.remove');
        }
        test('Keys (in-memory)', () => {
            let storageTargetEvent = undefined;
            storageService.onDidChangeTarget(e => storageTargetEvent = e, undefined, disposables);
            // Empty
            for (const scope of [1 /* StorageScope.WORKSPACE */, 0 /* StorageScope.PROFILE */, -1 /* StorageScope.APPLICATION */]) {
                for (const target of [1 /* StorageTarget.MACHINE */, 0 /* StorageTarget.USER */]) {
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 0);
                }
            }
            let storageValueChangeEvent = undefined;
            // Add values
            for (const scope of [1 /* StorageScope.WORKSPACE */, 0 /* StorageScope.PROFILE */, -1 /* StorageScope.APPLICATION */]) {
                storageService.onDidChangeValue(scope, undefined, disposables)(e => storageValueChangeEvent = e, undefined, disposables);
                for (const target of [1 /* StorageTarget.MACHINE */, 0 /* StorageTarget.USER */]) {
                    storageTargetEvent = Object.create(null);
                    storageValueChangeEvent = Object.create(null);
                    storageService.store('test.target1', 'value1', scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 1);
                    (0, assert_1.strictEqual)(storageTargetEvent?.scope, scope);
                    (0, assert_1.strictEqual)(storageValueChangeEvent?.key, 'test.target1');
                    (0, assert_1.strictEqual)(storageValueChangeEvent?.scope, scope);
                    (0, assert_1.strictEqual)(storageValueChangeEvent?.target, target);
                    storageTargetEvent = undefined;
                    storageValueChangeEvent = Object.create(null);
                    storageService.store('test.target1', 'otherValue1', scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 1);
                    (0, assert_1.strictEqual)(storageTargetEvent, undefined);
                    (0, assert_1.strictEqual)(storageValueChangeEvent?.key, 'test.target1');
                    (0, assert_1.strictEqual)(storageValueChangeEvent?.scope, scope);
                    (0, assert_1.strictEqual)(storageValueChangeEvent?.target, target);
                    storageService.store('test.target2', 'value2', scope, target);
                    storageService.store('test.target3', 'value3', scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 3);
                }
            }
            // Remove values
            for (const scope of [1 /* StorageScope.WORKSPACE */, 0 /* StorageScope.PROFILE */, -1 /* StorageScope.APPLICATION */]) {
                for (const target of [1 /* StorageTarget.MACHINE */, 0 /* StorageTarget.USER */]) {
                    const keysLength = storageService.keys(scope, target).length;
                    storageService.store('test.target4', 'value1', scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, keysLength + 1);
                    storageTargetEvent = Object.create(null);
                    storageValueChangeEvent = Object.create(null);
                    storageService.remove('test.target4', scope);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, keysLength);
                    (0, assert_1.strictEqual)(storageTargetEvent?.scope, scope);
                    (0, assert_1.strictEqual)(storageValueChangeEvent?.key, 'test.target4');
                    (0, assert_1.strictEqual)(storageValueChangeEvent?.scope, scope);
                }
            }
            // Remove all
            for (const scope of [1 /* StorageScope.WORKSPACE */, 0 /* StorageScope.PROFILE */, -1 /* StorageScope.APPLICATION */]) {
                for (const target of [1 /* StorageTarget.MACHINE */, 0 /* StorageTarget.USER */]) {
                    const keys = storageService.keys(scope, target);
                    for (const key of keys) {
                        storageService.remove(key, scope);
                    }
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 0);
                }
            }
            // Adding undefined or null removes value
            for (const scope of [1 /* StorageScope.WORKSPACE */, 0 /* StorageScope.PROFILE */, -1 /* StorageScope.APPLICATION */]) {
                for (const target of [1 /* StorageTarget.MACHINE */, 0 /* StorageTarget.USER */]) {
                    storageService.store('test.target1', 'value1', scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 1);
                    storageTargetEvent = Object.create(null);
                    storageService.store('test.target1', undefined, scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 0);
                    (0, assert_1.strictEqual)(storageTargetEvent?.scope, scope);
                    storageService.store('test.target1', '', scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 1);
                    storageService.store('test.target1', null, scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 0);
                }
            }
            // Target change
            for (const scope of [1 /* StorageScope.WORKSPACE */, 0 /* StorageScope.PROFILE */, -1 /* StorageScope.APPLICATION */]) {
                storageTargetEvent = undefined;
                storageService.store('test.target5', 'value1', scope, 1 /* StorageTarget.MACHINE */);
                (0, assert_1.ok)(storageTargetEvent);
                storageTargetEvent = undefined;
                storageService.store('test.target5', 'value1', scope, 0 /* StorageTarget.USER */);
                (0, assert_1.ok)(storageTargetEvent);
                storageTargetEvent = undefined;
                storageService.store('test.target5', 'value1', scope, 1 /* StorageTarget.MACHINE */);
                (0, assert_1.ok)(storageTargetEvent);
                storageTargetEvent = undefined;
                storageService.store('test.target5', 'value1', scope, 1 /* StorageTarget.MACHINE */);
                (0, assert_1.ok)(!storageTargetEvent); // no change in target
            }
        });
    }
    suite('StorageService (in-memory)', function () {
        const disposables = new lifecycle_1.DisposableStore();
        teardown(() => {
            disposables.clear();
        });
        createSuite({
            setup: async () => disposables.add(new storage_1.InMemoryStorageService()),
            teardown: async () => { }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vc3RvcmFnZS90ZXN0L2NvbW1vbi9zdG9yYWdlU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLGtDQWtSQztJQWxSRCxTQUFnQixXQUFXLENBQTRCLE1BQTRFO1FBRWxJLElBQUksY0FBaUIsQ0FBQztRQUV0QixNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEIsY0FBYyxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNwQixPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDeEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMENBQTBDLEVBQUUsR0FBRyxFQUFFO1lBQ3JELFNBQVMsbUNBQTBCLENBQUM7UUFDckMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1lBQ2pELFNBQVMsOEJBQXNCLENBQUM7UUFDakMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxFQUFFO1lBQzNELFNBQVMsZ0NBQXdCLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1lBQ2xDLE1BQU0sd0JBQXdCLEdBQStCLEVBQUUsQ0FBQztZQUNoRSxjQUFjLENBQUMsZ0JBQWdCLGlDQUF5QixTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRS9JLDJCQUEyQjtZQUMzQixjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsb0JBQW9CLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLGdDQUF3QixFQUFFLE1BQU0sK0JBQXVCLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlJLElBQUksdUJBQXVCLEdBQUcsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ2pHLElBQUEsb0JBQVcsRUFBQyx1QkFBdUIsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFckQsaUJBQWlCO1lBQ2pCLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLGdDQUF3QixFQUFFLE1BQU0sK0JBQXVCLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3ZJLHVCQUF1QixHQUFHLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssWUFBWSxDQUFDLENBQUM7WUFDckYsSUFBQSxvQkFBVyxFQUFDLHVCQUF1QixFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUV0RCxjQUFjLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxRQUFRLGdFQUFnRCxDQUFDO1lBQzVGLHVCQUF1QixHQUFHLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssWUFBWSxDQUFDLENBQUM7WUFDckYsSUFBQSxvQkFBVyxFQUFDLHVCQUF1QixFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7WUFDbEQsTUFBTSx3QkFBd0IsR0FBK0IsRUFBRSxDQUFDO1lBQ2hFLGNBQWMsQ0FBQyxnQkFBZ0IsaUNBQXlCLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFL0ksY0FBYyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsUUFBUSxnRUFBZ0QsQ0FBQztZQUM1RixjQUFjLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxRQUFRLGdFQUFnRCxDQUFDO1lBQzdGLGNBQWMsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLFFBQVEsbUVBQWtELENBQUM7WUFDOUYsY0FBYyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsUUFBUSw4REFBOEMsQ0FBQztZQUMxRixjQUFjLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxRQUFRLDhEQUE4QyxDQUFDO1lBQzNGLElBQUEsb0JBQVcsRUFBQyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxFQUFFO1lBQ3RELE1BQU0sd0JBQXdCLEdBQStCLEVBQUUsQ0FBQztZQUNoRSxjQUFjLENBQUMsZ0JBQWdCLGlDQUF5QixZQUFZLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRWxKLGNBQWMsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLFFBQVEsZ0VBQWdELENBQUM7WUFDNUYsY0FBYyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsUUFBUSwyREFBMkMsQ0FBQztZQUN2RixjQUFjLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxRQUFRLG1FQUFrRCxDQUFDO1lBQzlGLGNBQWMsQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLFFBQVEsZ0VBQWdELENBQUM7WUFDN0YsTUFBTSx1QkFBdUIsR0FBRyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLFlBQVksQ0FBQyxDQUFDO1lBQzNGLElBQUEsV0FBRSxFQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDNUIsSUFBQSxvQkFBVyxFQUFDLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUMsQ0FBQztRQUVILFNBQVMsU0FBUyxDQUFDLEtBQW1CO1lBQ3JDLElBQUksd0JBQXdCLEdBQStCLEVBQUUsQ0FBQztZQUM5RCxjQUFjLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFOUgsSUFBQSxvQkFBVyxFQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN2RSxJQUFBLG9CQUFXLEVBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzNELElBQUEsb0JBQVcsRUFBQyxjQUFjLENBQUMsU0FBUyxDQUFDLGdCQUFnQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRSxJQUFBLG9CQUFXLEVBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsSUFBQSxvQkFBVyxFQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdFLElBQUEsb0JBQVcsRUFBQyxjQUFjLENBQUMsVUFBVSxDQUFDLGlCQUFpQixFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMvRSxJQUFBLHdCQUFlLEVBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZHLElBQUEsd0JBQWUsRUFBQyxjQUFjLENBQUMsU0FBUyxDQUFDLGdCQUFnQixFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMzRSxJQUFBLHdCQUFlLEVBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFM0UsY0FBYyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsUUFBUSxFQUFFLEtBQUssZ0NBQXdCLENBQUM7WUFDekUsSUFBQSxvQkFBVyxFQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDM0UsSUFBSSx1QkFBdUIsR0FBRyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLFVBQVUsQ0FBQyxDQUFDO1lBQ3ZGLElBQUEsb0JBQVcsRUFBQyx1QkFBdUIsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkQsSUFBQSxvQkFBVyxFQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN0RCx3QkFBd0IsR0FBRyxFQUFFLENBQUM7WUFFOUIsY0FBYyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssZ0NBQXdCLENBQUM7WUFDbkUsSUFBQSxvQkFBVyxFQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDckUsdUJBQXVCLEdBQUcsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxVQUFVLENBQUMsQ0FBQztZQUNuRixJQUFBLG9CQUFXLEVBQUMsdUJBQXdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ25ELElBQUEsb0JBQVcsRUFBQyx1QkFBd0IsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFdEQsY0FBYyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsS0FBSyxnQ0FBd0IsQ0FBQztZQUN4RSxJQUFBLG9CQUFXLEVBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWhGLGNBQWMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLEtBQUssZ0NBQXdCLENBQUM7WUFDeEUsSUFBQSxvQkFBVyxFQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLENBQUMsU0FBUyxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVoRixjQUFjLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSxLQUFLLGdDQUF3QixDQUFDO1lBQzVFLElBQUEsb0JBQVcsRUFBQyxjQUFjLENBQUMsVUFBVSxDQUFDLGlCQUFpQixFQUFFLEtBQUssRUFBRSxDQUFDLFNBQVMsQ0FBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFckYsY0FBYyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsS0FBSyxnQ0FBd0IsQ0FBQztZQUM3RSxJQUFBLG9CQUFXLEVBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRXRGLGNBQWMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxFQUFFLEtBQUssZ0NBQXdCLENBQUM7WUFDekUsSUFBQSx3QkFBZSxFQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLENBQUMsU0FBUyxDQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVyRixjQUFjLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxnQ0FBd0IsQ0FBQztZQUMzRSxJQUFBLHdCQUFlLEVBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV2RixjQUFjLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssZ0NBQXdCLENBQUM7WUFDcEYsSUFBQSx3QkFBZSxFQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLENBQUMsU0FBUyxDQUFFLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRWhHLElBQUEsb0JBQVcsRUFBQyxjQUFjLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUN0RixJQUFBLG9CQUFXLEVBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUUsSUFBQSxvQkFBVyxFQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3BGLElBQUEsd0JBQWUsRUFBQyxjQUFjLENBQUMsU0FBUyxDQUFDLHVCQUF1QixFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFeEcsY0FBYyxDQUFDLFFBQVEsQ0FBQztnQkFDdkIsRUFBRSxHQUFHLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsTUFBTSwrQkFBdUIsRUFBRTtnQkFDaEYsRUFBRSxHQUFHLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsTUFBTSwrQkFBdUIsRUFBRTtnQkFDekUsRUFBRSxHQUFHLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSwrQkFBdUIsRUFBRTthQUM1RSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRVYsSUFBQSxvQkFBVyxFQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzdFLElBQUEsb0JBQVcsRUFBQyxjQUFjLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNuRSxJQUFBLG9CQUFXLEVBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUVELElBQUksQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7WUFDdEMsVUFBVSxtQ0FBMEIsQ0FBQztRQUN0QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7WUFDbEMsVUFBVSw4QkFBc0IsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7WUFDcEMsVUFBVSxnQ0FBd0IsQ0FBQztRQUNwQyxDQUFDLENBQUMsQ0FBQztRQUVILFNBQVMsVUFBVSxDQUFDLEtBQW1CO1lBQ3RDLE1BQU0sd0JBQXdCLEdBQStCLEVBQUUsQ0FBQztZQUNoRSxjQUFjLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFOUgsY0FBYyxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsUUFBUSxFQUFFLEtBQUssZ0NBQXdCLENBQUM7WUFDNUUsSUFBQSxvQkFBVyxFQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUM7WUFFOUUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUMsSUFBQSxXQUFFLEVBQUMsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUQsTUFBTSx1QkFBdUIsR0FBRyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLGFBQWEsQ0FBQyxDQUFDO1lBQzVGLElBQUEsb0JBQVcsRUFBQyx1QkFBdUIsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkQsSUFBQSxvQkFBVyxFQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtZQUM3QixJQUFJLGtCQUFrQixHQUEwQyxTQUFTLENBQUM7WUFDMUUsY0FBYyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUV0RixRQUFRO1lBQ1IsS0FBSyxNQUFNLEtBQUssSUFBSSxpR0FBd0UsRUFBRSxDQUFDO2dCQUM5RixLQUFLLE1BQU0sTUFBTSxJQUFJLDJEQUEyQyxFQUFFLENBQUM7b0JBQ2xFLElBQUEsb0JBQVcsRUFBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSx1QkFBdUIsR0FBeUMsU0FBUyxDQUFDO1lBRTlFLGFBQWE7WUFDYixLQUFLLE1BQU0sS0FBSyxJQUFJLGlHQUF3RSxFQUFFLENBQUM7Z0JBQzlGLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLEdBQUcsQ0FBQyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFFekgsS0FBSyxNQUFNLE1BQU0sSUFBSSwyREFBMkMsRUFBRSxDQUFDO29CQUNsRSxrQkFBa0IsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN6Qyx1QkFBdUIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUU5QyxjQUFjLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUM5RCxJQUFBLG9CQUFXLEVBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUMxRCxJQUFBLG9CQUFXLEVBQUMsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUM5QyxJQUFBLG9CQUFXLEVBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFLGNBQWMsQ0FBQyxDQUFDO29CQUMxRCxJQUFBLG9CQUFXLEVBQUMsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUNuRCxJQUFBLG9CQUFXLEVBQUMsdUJBQXVCLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUVyRCxrQkFBa0IsR0FBRyxTQUFTLENBQUM7b0JBQy9CLHVCQUF1QixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRTlDLGNBQWMsQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7b0JBQ25FLElBQUEsb0JBQVcsRUFBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzFELElBQUEsb0JBQVcsRUFBQyxrQkFBa0IsRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDM0MsSUFBQSxvQkFBVyxFQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRSxjQUFjLENBQUMsQ0FBQztvQkFDMUQsSUFBQSxvQkFBVyxFQUFDLHVCQUF1QixFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDbkQsSUFBQSxvQkFBVyxFQUFDLHVCQUF1QixFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFFckQsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDOUQsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFFOUQsSUFBQSxvQkFBVyxFQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDM0QsQ0FBQztZQUNGLENBQUM7WUFFRCxnQkFBZ0I7WUFDaEIsS0FBSyxNQUFNLEtBQUssSUFBSSxpR0FBd0UsRUFBRSxDQUFDO2dCQUM5RixLQUFLLE1BQU0sTUFBTSxJQUFJLDJEQUEyQyxFQUFFLENBQUM7b0JBQ2xFLE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQztvQkFFN0QsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDOUQsSUFBQSxvQkFBVyxFQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBRXZFLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3pDLHVCQUF1QixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRTlDLGNBQWMsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUM3QyxJQUFBLG9CQUFXLEVBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUNuRSxJQUFBLG9CQUFXLEVBQUMsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUM5QyxJQUFBLG9CQUFXLEVBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFLGNBQWMsQ0FBQyxDQUFDO29CQUMxRCxJQUFBLG9CQUFXLEVBQUMsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNwRCxDQUFDO1lBQ0YsQ0FBQztZQUVELGFBQWE7WUFDYixLQUFLLE1BQU0sS0FBSyxJQUFJLGlHQUF3RSxFQUFFLENBQUM7Z0JBQzlGLEtBQUssTUFBTSxNQUFNLElBQUksMkRBQTJDLEVBQUUsQ0FBQztvQkFDbEUsTUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7b0JBRWhELEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7d0JBQ3hCLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUNuQyxDQUFDO29CQUVELElBQUEsb0JBQVcsRUFBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELENBQUM7WUFDRixDQUFDO1lBRUQseUNBQXlDO1lBQ3pDLEtBQUssTUFBTSxLQUFLLElBQUksaUdBQXdFLEVBQUUsQ0FBQztnQkFDOUYsS0FBSyxNQUFNLE1BQU0sSUFBSSwyREFBMkMsRUFBRSxDQUFDO29CQUNsRSxjQUFjLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUM5RCxJQUFBLG9CQUFXLEVBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUUxRCxrQkFBa0IsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUV6QyxjQUFjLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUMvRCxJQUFBLG9CQUFXLEVBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUMxRCxJQUFBLG9CQUFXLEVBQUMsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUU5QyxjQUFjLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUN4RCxJQUFBLG9CQUFXLEVBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUUxRCxjQUFjLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUMxRCxJQUFBLG9CQUFXLEVBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMzRCxDQUFDO1lBQ0YsQ0FBQztZQUVELGdCQUFnQjtZQUNoQixLQUFLLE1BQU0sS0FBSyxJQUFJLGlHQUF3RSxFQUFFLENBQUM7Z0JBQzlGLGtCQUFrQixHQUFHLFNBQVMsQ0FBQztnQkFDL0IsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLEtBQUssZ0NBQXdCLENBQUM7Z0JBQzdFLElBQUEsV0FBRSxFQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBQ3ZCLGtCQUFrQixHQUFHLFNBQVMsQ0FBQztnQkFDL0IsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLEtBQUssNkJBQXFCLENBQUM7Z0JBQzFFLElBQUEsV0FBRSxFQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBQ3ZCLGtCQUFrQixHQUFHLFNBQVMsQ0FBQztnQkFDL0IsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLEtBQUssZ0NBQXdCLENBQUM7Z0JBQzdFLElBQUEsV0FBRSxFQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBQ3ZCLGtCQUFrQixHQUFHLFNBQVMsQ0FBQztnQkFDL0IsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLEtBQUssZ0NBQXdCLENBQUM7Z0JBQzdFLElBQUEsV0FBRSxFQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLHNCQUFzQjtZQUNoRCxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsS0FBSyxDQUFDLDRCQUE0QixFQUFFO1FBRW5DLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7UUFFSCxXQUFXLENBQXlCO1lBQ25DLEtBQUssRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxnQ0FBc0IsRUFBRSxDQUFDO1lBQ2hFLFFBQVEsRUFBRSxLQUFLLElBQUksRUFBRSxHQUFHLENBQUM7U0FDekIsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=