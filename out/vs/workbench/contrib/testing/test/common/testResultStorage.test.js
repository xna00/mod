/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/workbench/contrib/testing/common/testResult", "vs/workbench/contrib/testing/common/testResultStorage", "vs/workbench/contrib/testing/test/common/testStubs", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, arrays_1, lifecycle_1, utils_1, log_1, testResult_1, testResultStorage_1, testStubs_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - Test Result Storage', () => {
        let storage;
        let ds;
        const makeResult = (taskName = 't') => {
            const t = ds.add(new testResult_1.LiveTestResult('', true, { targets: [] }));
            t.addTask({ id: taskName, name: undefined, running: true });
            const tests = ds.add(testStubs_1.testStubs.nested());
            tests.expand(tests.root.id, Infinity);
            t.addTestChainToRun('ctrlId', [
                tests.root.toTestItem(),
                tests.root.children.get('id-a').toTestItem(),
                tests.root.children.get('id-a').children.get('id-aa').toTestItem(),
            ]);
            t.markComplete();
            return t;
        };
        const assertStored = async (stored) => assert.deepStrictEqual((await storage.read()).map(r => r.id), stored.map(s => s.id));
        setup(async () => {
            ds = new lifecycle_1.DisposableStore();
            storage = ds.add(new testResultStorage_1.InMemoryResultStorage({
                asCanonicalUri(uri) {
                    return uri;
                },
            }, ds.add(new workbenchTestServices_1.TestStorageService()), new log_1.NullLogService()));
        });
        teardown(() => ds.dispose());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('stores a single result', async () => {
            const r = (0, arrays_1.range)(5).map(() => makeResult());
            await storage.persist(r);
            await assertStored(r);
        });
        test('deletes old results', async () => {
            const r = (0, arrays_1.range)(5).map(() => makeResult());
            await storage.persist(r);
            const r2 = [makeResult(), ...r.slice(0, 3)];
            await storage.persist(r2);
            await assertStored(r2);
        });
        test('limits stored results', async () => {
            const r = (0, arrays_1.range)(100).map(() => makeResult());
            await storage.persist(r);
            await assertStored(r.slice(0, testResultStorage_1.RETAIN_MAX_RESULTS));
        });
        test('limits stored result by budget', async () => {
            const r = (0, arrays_1.range)(100).map(() => makeResult('a'.repeat(2048)));
            await storage.persist(r);
            const length = (await storage.read()).length;
            assert.strictEqual(true, length < 50);
        });
        test('always stores the min number of results', async () => {
            const r = (0, arrays_1.range)(20).map(() => makeResult('a'.repeat(1024 * 10)));
            await storage.persist(r);
            await assertStored(r.slice(0, 16));
        });
        test('takes into account existing stored bytes', async () => {
            const r = (0, arrays_1.range)(10).map(() => makeResult('a'.repeat(1024 * 10)));
            await storage.persist(r);
            await assertStored(r);
            const r2 = [...r, ...(0, arrays_1.range)(10).map(() => makeResult('a'.repeat(1024 * 10)))];
            await storage.persist(r2);
            await assertStored(r2.slice(0, 16));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFJlc3VsdFN0b3JhZ2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy90ZXN0L2NvbW1vbi90ZXN0UmVzdWx0U3RvcmFnZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLEtBQUssQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7UUFDN0MsSUFBSSxPQUE4QixDQUFDO1FBQ25DLElBQUksRUFBbUIsQ0FBQztRQUV4QixNQUFNLFVBQVUsR0FBRyxDQUFDLFFBQVEsR0FBRyxHQUFHLEVBQUUsRUFBRTtZQUNyQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksMkJBQWMsQ0FDbEMsRUFBRSxFQUNGLElBQUksRUFDSixFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FDZixDQUFDLENBQUM7WUFFSCxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzVELE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMscUJBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ3pDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDdEMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRTtnQkFDN0IsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7Z0JBQ3ZCLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUUsQ0FBQyxVQUFVLEVBQUU7Z0JBQzdDLEtBQUssQ0FBQyxJ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