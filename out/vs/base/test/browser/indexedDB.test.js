define(["require", "exports", "assert", "vs/base/browser/indexedDB", "vs/base/test/common/testUtils", "vs/base/test/common/utils"], function (require, exports, assert, indexedDB_1, testUtils_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('IndexedDB', () => {
        let indexedDB;
        setup(async () => {
            indexedDB = await indexedDB_1.IndexedDB.create('vscode-indexeddb-test', 1, ['test-store']);
            await indexedDB.runInTransaction('test-store', 'readwrite', store => store.clear());
        });
        teardown(() => {
            indexedDB?.close();
        });
        test('runInTransaction', async () => {
            await indexedDB.runInTransaction('test-store', 'readwrite', store => store.add('hello1', 'key1'));
            const value = await indexedDB.runInTransaction('test-store', 'readonly', store => store.get('key1'));
            assert.deepStrictEqual(value, 'hello1');
        });
        test('getKeyValues', async () => {
            await indexedDB.runInTransaction('test-store', 'readwrite', store => {
                const requests = [];
                requests.push(store.add('hello1', 'key1'));
                requests.push(store.add('hello2', 'key2'));
                requests.push(store.add(true, 'key3'));
                return requests;
            });
            function isValid(value) {
                return typeof value === 'string';
            }
            const keyValues = await indexedDB.getKeyValues('test-store', isValid);
            assert.strictEqual(keyValues.size, 2);
            assert.strictEqual(keyValues.get('key1'), 'hello1');
            assert.strictEqual(keyValues.get('key2'), 'hello2');
        });
        test('hasPendingTransactions', async () => {
            const promise = indexedDB.runInTransaction('test-store', 'readwrite', store => store.add('hello2', 'key2'));
            assert.deepStrictEqual(indexedDB.hasPendingTransactions(), true);
            await promise;
            assert.deepStrictEqual(indexedDB.hasPendingTransactions(), false);
        });
        test('close', async () => {
            const promise = indexedDB.runInTransaction('test-store', 'readwrite', store => store.add('hello3', 'key3'));
            indexedDB.close();
            assert.deepStrictEqual(indexedDB.hasPendingTransactions(), false);
            try {
                await promise;
                assert.fail('Transaction should be aborted');
            }
            catch (error) { }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhlZERCLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9icm93c2VyL2luZGV4ZWREQi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVNBLElBQUEsc0JBQVUsRUFBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1FBRTVCLElBQUksU0FBb0IsQ0FBQztRQUV6QixLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEIsU0FBUyxHQUFHLE1BQU0scUJBQVMsQ0FBQyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUMvRSxNQUFNLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDckYsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25DLE1BQU0sU0FBUyxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLE1BQU0sS0FBSyxHQUFHLE1BQU0sU0FBUyxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDckcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVB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