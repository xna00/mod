/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/workbench/common/memento", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, lifecycle_1, utils_1, memento_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Memento', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let storage;
        setup(() => {
            storage = disposables.add(new workbenchTestServices_1.TestStorageService());
            memento_1.Memento.clear(-1 /* StorageScope.APPLICATION */);
            memento_1.Memento.clear(0 /* StorageScope.PROFILE */);
            memento_1.Memento.clear(1 /* StorageScope.WORKSPACE */);
        });
        teardown(() => {
            disposables.clear();
        });
        test('Loading and Saving Memento with Scopes', () => {
            const myMemento = new memento_1.Memento('memento.test', storage);
            // Application
            let memento = myMemento.getMemento(-1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            memento.foo = [1, 2, 3];
            let applicationMemento = myMemento.getMemento(-1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(applicationMemento, memento);
            // Profile
            memento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            memento.foo = [4, 5, 6];
            let profileMemento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(profileMemento, memento);
            // Workspace
            memento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            assert(memento);
            memento.foo = 'Hello World';
            myMemento.saveMemento();
            // Application
            memento = myMemento.getMemento(-1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, { foo: [1, 2, 3] });
            applicationMemento = myMemento.getMemento(-1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(applicationMemento, memento);
            // Profile
            memento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, { foo: [4, 5, 6] });
            profileMemento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(profileMemento, memento);
            // Workspace
            memento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, { foo: 'Hello World' });
            // Assert the Mementos are stored properly in storage
            assert.deepStrictEqual(JSON.parse(storage.get('memento/memento.test', -1 /* StorageScope.APPLICATION */)), { foo: [1, 2, 3] });
            assert.deepStrictEqual(JSON.parse(storage.get('memento/memento.test', 0 /* StorageScope.PROFILE */)), { foo: [4, 5, 6] });
            assert.deepStrictEqual(JSON.parse(storage.get('memento/memento.test', 1 /* StorageScope.WORKSPACE */)), { foo: 'Hello World' });
            // Delete Application
            memento = myMemento.getMemento(-1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            delete memento.foo;
            // Delete Profile
            memento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            delete memento.foo;
            // Delete Workspace
            memento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            delete memento.foo;
            myMemento.saveMemento();
            // Application
            memento = myMemento.getMemento(-1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, {});
            // Profile
            memento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, {});
            // Workspace
            memento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, {});
            // Assert the Mementos are also removed from storage
            assert.strictEqual(storage.get('memento/memento.test', -1 /* StorageScope.APPLICATION */, null), null);
            assert.strictEqual(storage.get('memento/memento.test', 0 /* StorageScope.PROFILE */, null), null);
            assert.strictEqual(storage.get('memento/memento.test', 1 /* StorageScope.WORKSPACE */, null), null);
        });
        test('Save and Load', () => {
            const myMemento = new memento_1.Memento('memento.test', storage);
            // Profile
            let memento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            memento.foo = [1, 2, 3];
            // Workspace
            memento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            assert(memento);
            memento.foo = 'Hello World';
            myMemento.saveMemento();
            // Profile
            memento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, { foo: [1, 2, 3] });
            let profileMemento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(profileMemento, memento);
            // Workspace
            memento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, { foo: 'Hello World' });
            // Profile
            memento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            memento.foo = [4, 5, 6];
            // Workspace
            memento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            assert(memento);
            memento.foo = 'World Hello';
            myMemento.saveMemento();
            // Profile
            memento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, { foo: [4, 5, 6] });
            profileMemento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(profileMemento, memento);
            // Workspace
            memento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, { foo: 'World Hello' });
            // Delete Profile
            memento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            delete memento.foo;
            // Delete Workspace
            memento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            delete memento.foo;
            myMemento.saveMemento();
            // Profile
            memento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, {});
            // Workspace
            memento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, {});
        });
        test('Save and Load - 2 Components with same id', () => {
            const myMemento = new memento_1.Memento('memento.test', storage);
            const myMemento2 = new memento_1.Memento('memento.test', storage);
            // Profile
            let memento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            memento.foo = [1, 2, 3];
            memento = myMemento2.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            memento.bar = [1, 2, 3];
            // Workspace
            memento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            assert(memento);
            memento.foo = 'Hello World';
            memento = myMemento2.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            assert(memento);
            memento.bar = 'Hello World';
            myMemento.saveMemento();
            myMemento2.saveMemento();
            // Profile
            memento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, { foo: [1, 2, 3], bar: [1, 2, 3] });
            let profileMemento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(profileMemento, memento);
            memento = myMemento2.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, { foo: [1, 2, 3], bar: [1, 2, 3] });
            profileMemento = myMemento2.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(profileMemento, memento);
            // Workspace
            memento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, { foo: 'Hello World', bar: 'Hello World' });
            memento = myMemento2.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(memento, { foo: 'Hello World', bar: 'Hello World' });
        });
        test('Clear Memento', () => {
            let myMemento = new memento_1.Memento('memento.test', storage);
            // Profile
            let profileMemento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            profileMemento.foo = 'Hello World';
            // Workspace
            let workspaceMemento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            workspaceMemento.bar = 'Hello World';
            myMemento.saveMemento();
            // Clear
            storage = disposables.add(new workbenchTestServices_1.TestStorageService());
            memento_1.Memento.clear(0 /* StorageScope.PROFILE */);
            memento_1.Memento.clear(1 /* StorageScope.WORKSPACE */);
            myMemento = new memento_1.Memento('memento.test', storage);
            profileMemento = myMemento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            workspaceMemento = myMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            assert.deepStrictEqual(profileMemento, {});
            assert.deepStrictEqual(workspaceMemento, {});
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVtZW50by50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9jb21tb24vbWVtZW50by50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1FBQ3JCLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBQzFDLElBQUksT0FBd0IsQ0FBQztRQUU3QixLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsT0FBTyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSwwQ0FBa0IsRUFBRSxDQUFDLENBQUM7WUFDcEQsaUJBQU8sQ0FBQyxLQUFLLG1DQUEwQixDQUFDO1lBQ3hDLGlCQUFPLENBQUMsS0FBSyw4QkFBc0IsQ0FBQztZQUNwQyxpQkFBTyxDQUFDLEtBQUssZ0NBQXdCLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdDQUF3QyxFQUFFLEdBQUcsRUFBRTtZQUNuRCxNQUFNLFNBQVMsR0FBRyxJQUFJLGlCQUFPLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRXZELGNBQWM7WUFDZCxJQUFJLE9BQU8sR0FBRyxTQUFTLENBQUMsVUFBVSxrRUFBaUQsQ0FBQztZQUNwRixPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixJQUFJLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxVQUFVLGtFQUFpRCxDQUFDO1lBQy9GLE1BQU0sQ0FBQyxlQUFlLENBQUMsa0JBQWtCLEVB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