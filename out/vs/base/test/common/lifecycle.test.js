/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/utils"], function (require, exports, assert, event_1, lifecycle_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Disposable {
        constructor() {
            this.isDisposed = false;
        }
        dispose() { this.isDisposed = true; }
    }
    // Leaks are allowed here since we test lifecycle stuff:
    // eslint-disable-next-line local/code-ensure-no-disposables-leak-in-test
    suite('Lifecycle', () => {
        test('dispose single disposable', () => {
            const disposable = new Disposable();
            assert(!disposable.isDisposed);
            (0, lifecycle_1.dispose)(disposable);
            assert(disposable.isDisposed);
        });
        test('dispose disposable array', () => {
            const disposable = new Disposable();
            const disposable2 = new Disposable();
            assert(!disposable.isDisposed);
            assert(!disposable2.isDisposed);
            (0, lifecycle_1.dispose)([disposable, disposable2]);
            assert(disposable.isDisposed);
            assert(disposable2.isDisposed);
        });
        test('dispose disposables', () => {
            const disposable = new Disposable();
            const disposable2 = new Disposable();
            assert(!disposable.isDisposed);
            assert(!disposable2.isDisposed);
            (0, lifecycle_1.dispose)(disposable);
            (0, lifecycle_1.dispose)(disposable2);
            assert(disposable.isDisposed);
            assert(disposable2.isDisposed);
        });
        test('dispose array should dispose all if a child throws on dispose', () => {
            const disposedValues = new Set();
            let thrownError;
            try {
                (0, lifecycle_1.dispose)([
                    (0, lifecycle_1.toDisposable)(() => { disposedValues.add(1); }),
                    (0, lifecycle_1.toDisposable)(() => { throw new Error('I am error'); }),
                    (0, lifecycle_1.toDisposable)(() => { disposedValues.add(3); }),
                ]);
            }
            catch (e) {
                thrownError = e;
            }
            assert.ok(disposedValues.has(1));
            assert.ok(disposedValues.has(3));
            assert.strictEqual(thrownError.message, 'I am error');
        });
        test('dispose array should rethrow composite error if multiple entries throw on dispose', () => {
            const disposedValues = new Set();
            let thrownError;
            try {
                (0, lifecycle_1.dispose)([
                    (0, lifecycle_1.toDisposable)(() => { disposedValues.add(1); }),
                    (0, lifecycle_1.toDisposable)(() => { throw new Error('I am error 1'); }),
                    (0, lifecycle_1.toDisposable)(() => { throw new Error('I am error 2'); }),
                    (0, lifecycle_1.toDisposable)(() => { disposedValues.add(4); }),
                ]);
            }
            catch (e) {
                thrownError = e;
            }
            assert.ok(disposedValues.has(1));
            assert.ok(disposedValues.has(4));
            assert.ok(thrownError instanceof AggregateError);
            assert.strictEqual(thrownError.errors.length, 2);
            assert.strictEqual(thrownError.errors[0].message, 'I am error 1');
            assert.strictEqual(thrownError.errors[1].message, 'I am error 2');
        });
        test('Action bar has broken accessibility #100273', function () {
            const array = [{ dispose() { } }, { dispose() { } }];
            const array2 = (0, lifecycle_1.dispose)(array);
            assert.strictEqual(array.length, 2);
            assert.strictEqual(array2.length, 0);
            assert.ok(array !== array2);
            const set = new Set([{ dispose() { } }, { dispose() { } }]);
            const setValues = set.values();
            const setValues2 = (0, lifecycle_1.dispose)(setValues);
            assert.ok(setValues === setValues2);
        });
        test('SafeDisposable, dispose', function () {
            let disposed = 0;
            const actual = () => disposed += 1;
            const d = new lifecycle_1.SafeDisposable();
            d.set(actual);
            d.dispose();
            assert.strictEqual(disposed, 1);
        });
        test('SafeDisposable, unset', function () {
            let disposed = 0;
            const actual = () => disposed += 1;
            const d = new lifecycle_1.SafeDisposable();
            d.set(actual);
            d.unset();
            d.dispose();
            assert.strictEqual(disposed, 0);
        });
    });
    suite('DisposableStore', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('dispose should call all child disposes even if a child throws on dispose', () => {
            const disposedValues = new Set();
            const store = new lifecycle_1.DisposableStore();
            store.add((0, lifecycle_1.toDisposable)(() => { disposedValues.add(1); }));
            store.add((0, lifecycle_1.toDisposable)(() => { throw new Error('I am error'); }));
            store.add((0, lifecycle_1.toDisposable)(() => { disposedValues.add(3); }));
            let thrownError;
            try {
                store.dispose();
            }
            catch (e) {
                thrownError = e;
            }
            assert.ok(disposedValues.has(1));
            assert.ok(disposedValues.has(3));
            assert.strictEqual(thrownError.message, 'I am error');
        });
        test('dispose should throw composite error if multiple children throw on dispose', () => {
            const disposedValues = new Set();
            const store = new lifecycle_1.DisposableStore();
            store.add((0, lifecycle_1.toDisposable)(() => { disposedValues.add(1); }));
            store.add((0, lifecycle_1.toDisposable)(() => { throw new Error('I am error 1'); }));
            store.add((0, lifecycle_1.toDisposable)(() => { throw new Error('I am error 2'); }));
            store.add((0, lifecycle_1.toDisposable)(() => { disposedValues.add(4); }));
            let thrownError;
            try {
                store.dispose();
            }
            catch (e) {
                thrownError = e;
            }
            assert.ok(disposedValues.has(1));
            assert.ok(disposedValues.has(4));
            assert.ok(thrownError instanceof AggregateError);
            assert.strictEqual(thrownError.errors.length, 2);
            assert.strictEqual(thrownError.errors[0].message, 'I am error 1');
            assert.strictEqual(thrownError.errors[1].message, 'I am error 2');
        });
        test('delete should evict and dispose of the disposables', () => {
            const disposedValues = new Set();
            const disposables = [
                (0, lifecycle_1.toDisposable)(() => { disposedValues.add(1); }),
                (0, lifecycle_1.toDisposable)(() => { disposedValues.add(2); })
            ];
            const store = new lifecycle_1.DisposableStore();
            store.add(disposables[0]);
            store.add(disposables[1]);
            store.delete(disposables[0]);
            assert.ok(disposedValues.has(1));
            assert.ok(!disposedValues.has(2));
            store.dispose();
            assert.ok(disposedValues.has(1));
            assert.ok(disposedValues.has(2));
        });
        test('deleteAndLeak should evict and not dispose of the disposables', () => {
            const disposedValues = new Set();
            const disposables = [
                (0, lifecycle_1.toDisposable)(() => { disposedValues.add(1); }),
                (0, lifecycle_1.toDisposable)(() => { disposedValues.add(2); })
            ];
            const store = new lifecycle_1.DisposableStore();
            store.add(disposables[0]);
            store.add(disposables[1]);
            store.deleteAndLeak(disposables[0]);
            assert.ok(!disposedValues.has(1));
            assert.ok(!disposedValues.has(2));
            store.dispose();
            assert.ok(!disposedValues.has(1));
            assert.ok(disposedValues.has(2));
            disposables[0].dispose();
        });
    });
    suite('Reference Collection', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        class Collection extends lifecycle_1.ReferenceCollection {
            constructor() {
                super(...arguments);
                this._count = 0;
            }
            get count() { return this._count; }
            createReferencedObject(key) { this._count++; return key.length; }
            destroyReferencedObject(key, object) { this._count--; }
        }
        test('simple', () => {
            const collection = new Collection();
            const ref1 = collection.acquire('test');
            assert(ref1);
            assert.strictEqual(ref1.object, 4);
            assert.strictEqual(collection.count, 1);
            ref1.dispose();
            assert.strictEqual(collection.count, 0);
            const ref2 = collection.acquire('test');
            const ref3 = collection.acquire('test');
            assert.strictEqual(ref2.object, ref3.object);
            assert.strictEqual(collection.count, 1);
            const ref4 = collection.acquire('monkey');
            assert.strictEqual(ref4.object, 6);
            assert.strictEqual(collection.count, 2);
            ref2.dispose();
            assert.strictEqual(collection.count, 2);
            ref3.dispose();
            assert.strictEqual(collection.count, 1);
            ref4.dispose();
            assert.strictEqual(collection.count, 0);
        });
    });
    function assertThrows(fn, test) {
        try {
            fn();
            assert.fail('Expected function to throw, but it did not.');
        }
        catch (e) {
            assert.ok(test(e));
        }
    }
    suite('No Leakage Utilities', () => {
        suite('throwIfDisposablesAreLeaked', () => {
            test('throws if an event subscription is not cleaned up', () => {
                const eventEmitter = new event_1.Emitter();
                assertThrows(() => {
                    (0, utils_1.throwIfDisposablesAreLeaked)(() => {
                        eventEmitter.event(() => {
                            // noop
                        });
                    }, false);
                }, e => e.message.indexOf('undisposed disposables') !== -1);
            });
            test('throws if a disposable is not disposed', () => {
                assertThrows(() => {
                    (0, utils_1.throwIfDisposablesAreLeaked)(() => {
                        new lifecycle_1.DisposableStore();
                    }, false);
                }, e => e.message.indexOf('undisposed disposables') !== -1);
            });
            test('does not throw if all event subscriptions are cleaned up', () => {
                const eventEmitter = new event_1.Emitter();
                (0, utils_1.throwIfDisposablesAreLeaked)(() => {
                    eventEmitter.event(() => {
                        // noop
                    }).dispose();
                });
            });
            test('does not throw if all disposables are disposed', () => {
                // This disposable is reported before the test and not tracked.
                (0, lifecycle_1.toDisposable)(() => { });
                (0, utils_1.throwIfDisposablesAreLeaked)(() => {
                    // This disposable is marked as singleton
                    (0, lifecycle_1.markAsSingleton)((0, lifecycle_1.toDisposable)(() => { }));
                    // These disposables are also marked as singleton
                    const disposableStore = new lifecycle_1.DisposableStore();
                    disposableStore.add((0, lifecycle_1.toDisposable)(() => { }));
                    (0, lifecycle_1.markAsSingleton)(disposableStore);
                    (0, lifecycle_1.toDisposable)(() => { }).dispose();
                });
            });
        });
        suite('ensureNoDisposablesAreLeakedInTest', () => {
            (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
            test('Basic Test', () => {
                (0, lifecycle_1.toDisposable)(() => { }).dispose();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWN5Y2xlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vbGlmZWN5Y2xlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsTUFBTSxVQUFVO1FBQWhCO1lBQ0MsZUFBVSxHQUFHLEtBQUssQ0FBQztRQUVwQixDQUFDO1FBREEsT0FBTyxLQUFLLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztLQUNyQztJQUVELHdEQUF3RDtJQUN4RCx5RUFBeUU7SUFDekUsS0FBSyxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7UUFDdkIsSUFBSSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtZQUN0QyxNQUFNLFVBQVUsR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBRXBDLE1BQU0sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUUvQixJQUFBLG1CQUFPLEVBQUMsVUFBVSxDQUFDLENBQUM7WUFFcEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7WUFDckMsTUFBTSxVQUFVLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNwQyxNQUFNLFdBQVcsR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBRXJDLE1BQU0sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMvQixNQUFNLENBQUMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFaEMsSUFBQSxtQkFBTyxFQUFDLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFFbkMsTUFBTSxDQUFDLFVBQVUsQ0FB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