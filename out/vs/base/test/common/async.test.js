/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/symbols", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/uri", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert, async, MicrotaskDelay, cancellation_1, errors_1, event_1, uri_1, timeTravelScheduler_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Async', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('cancelablePromise', function () {
            test('set token, don\'t wait for inner promise', function () {
                let canceled = 0;
                const promise = async.createCancelablePromise(token => {
                    store.add(token.onCancellationRequested(_ => { canceled += 1; }));
                    return new Promise(resolve => { });
                });
                const result = promise.then(_ => assert.ok(false), err => {
                    assert.strictEqual(canceled, 1);
                    assert.ok((0, errors_1.isCancellationError)(err));
                });
                promise.cancel();
                promise.cancel(); // cancel only once
                return result;
            });
            test('cancel despite inner promise being resolved', function () {
                let canceled = 0;
                const promise = async.createCancelablePromise(token => {
                    store.add(token.onCancellationRequested(_ => { canceled += 1; }));
                    return Promise.resolve(1234);
                });
                const result = promise.then(_ => assert.ok(false), err => {
                    assert.strictEqual(canceled, 1);
                    assert.ok((0, errors_1.isCancellationError)(err));
                });
                promise.cancel();
                return result;
            });
            // Cancelling a sync cancelable promise will fire the cancelled token.
            // Also, every `then` callback runs in another execution frame.
            test('execution order (sync)', function () {
                const order = [];
                const cancellablePromise = async.createCancelablePromise(token => {
                    order.push('in callback');
                    store.add(token.onCancellationRequested(_ => order.push('cancelled')));
                    return Promise.resolve(1234);
                });
                order.push('afterCreate');
                const promise = cancellablePromise
                    .then(undefined, err => null)
                    .then(() => order.push('finally'));
                cancellablePromise.cancel();
                order.push('afterCancel');
                return promise.then(() => assert.deepStrictEqual(order, ['in callback', 'afterCreate', 'cancelled', 'afterCancel', 'finally']));
            });
            // Cancelling an async cancelable promise is just the same as a sync cancellable promise.
            test('execution order (async)', function () {
                const order = [];
                const cancellablePromise = async.createCancelablePromise(token => {
                    order.push('in callback');
                    store.add(token.onCancellationRequested(_ => order.push('cancelled')));
                    return new Promise(c => setTimeout(c.bind(1234), 0));
                });
                order.push('afterCreate');
                const promise = cancellablePromise
                    .then(undefined, err => null)
                    .then(() => order.push('finally'));
                cancellablePromise.cancel();
                order.push('afterCancel');
                return promise.then(() => assert.deepStrictEqual(order, ['in callback', 'afterCreate', 'cancelled', 'afterCancel', 'finally']));
            });
            test('execution order (async with late listener)', async function () {
                const order = [];
                const cancellablePromise = async.createCancelablePromise(async (token) => {
                    order.push('in callback');
                    await async.timeout(0);
                    store.add(token.onCancellationRequested(_ => order.push('cancelled')));
                    cancellablePromise.cancel();
                    order.push('afterCancel');
                });
                order.push('afterCreate');
                const promise = cancellablePromise
                    .then(undefined, err => null)
                    .then(() => order.push('finally'));
                return promise.then(() => assert.deepStrictEqual(order, ['in callback', 'afterCreate', 'cancelled', 'afterCancel', 'finally']));
            });
            test('get inner result', async function () {
                const promise = async.createCancelablePromise(token => {
                    return async.timeout(12).then(_ => 1234);
                });
                const result = await promise;
                assert.strictEqual(result, 1234);
            });
        });
        suite('Throttler', function () {
            test('non async', function () {
                let count = 0;
                const factory = () => {
                    return Promise.resolve(++count);
                };
                const throttler = new async.Throttler();
                return Promise.all([
                    throttler.queue(factory).then((result) => { assert.strictEqual(result, 1); }),
                    throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); }),
                    throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); }),
                    throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); }),
                    throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); })
                ]).then(() => assert.strictEqual(count, 2));
            });
            test('async', () => {
                let count = 0;
                const factory = () => async.timeout(0).then(() => ++count);
                const throttler = new async.Throttler();
                return Promise.all([
                    throttler.queue(factory).then((result) => { assert.strictEqual(result, 1); }),
                    throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); }),
                    throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); }),
                    throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); }),
                    throttler.queue(factory).then((result) => { assert.strictEqual(result, 2); })
                ]).then(() => {
                    return Promise.all([
                        throttler.queue(factory).then((result) => { assert.strictEqual(result, 3); }),
                        throttler.queue(factory).then((result) => { assert.strictEqual(result, 4); }),
                        throttler.queue(factory).then((result) => { assert.strictEqual(result, 4); }),
                        throttler.queue(factory).then((result) => { assert.strictEqual(result, 4); }),
                        throttler.queue(factory).then((result) => { assert.strictEqual(result, 4); })
                    ]);
                });
            });
            test('last factory should be the one getting called', function () {
                const factoryFactory = (n) => () => {
                    return async.timeout(0).then(() => n);
                };
                const throttler = new async.Throttler();
                const promises = [];
                promises.push(throttler.queue(factoryFactory(1)).then((n) => { assert.strictEqual(n, 1); }));
                promises.push(throttler.queue(factoryFactory(2)).then((n) => { assert.strictEqual(n, 3); }));
                promises.push(throttler.queue(factoryFactory(3)).then((n) => { assert.strictEqual(n, 3); }));
                return Promise.all(promises);
            });
            test('disposal after queueing', async () => {
                let factoryCalls = 0;
                const factory = async () => {
                    factoryCalls++;
                    return async.timeout(0);
                };
                const throttler = new async.Throttler();
                const promises = [];
                promises.push(throttler.queue(factory));
                promises.push(throttler.queue(factory));
                throttler.dispose();
                await Promise.all(promises);
                assert.strictEqual(factoryCalls, 1);
            });
            test('disposal before queueing', async () => {
                let factoryCalls = 0;
                const factory = async () => {
                    factoryCalls++;
                    return async.timeout(0);
                };
                const throttler = new async.Throttler();
                const promises = [];
                throttler.dispose();
                promises.push(throttler.queue(factory));
                try {
                    await Promise.all(promises);
                    assert.fail('should fail');
                }
                catch (err) {
                    assert.strictEqual(factoryCalls, 0);
                }
            });
        });
        suite('Delayer', function () {
            test('simple', () => {
                let count = 0;
                const factory = () => {
                    return Promise.resolve(++count);
                };
                const delayer = new async.Delayer(0);
                const promises = [];
                assert(!delayer.isTriggered());
                promises.push(delayer.trigger(factory).then((result) => { assert.strictEqual(result, 1); assert(!delayer.isTriggered()); }));
                assert(delayer.isTriggered());
                promises.push(delayer.trigger(factory).then((result) => { assert.strictEqual(result, 1); assert(!delayer.isTriggered()); }));
                assert(delayer.isTriggered());
                promises.push(delayer.trigger(factory).then((result) => { assert.strictEqual(result, 1); assert(!delayer.isTriggered()); }));
                assert(delayer.isTriggered());
                return Promise.all(promises).then(() => {
                    assert(!delayer.isTriggered());
                });
            });
            test('microtask delay simple', () => {
                let count = 0;
                const factory = () => {
                    return Promise.resolve(++count);
                };
                const delayer = new async.Delayer(MicrotaskDelay.MicrotaskDelay);
                const promises = [];
                assert(!delayer.isTriggered());
                promises.push(delayer.trigger(factory).then((result) => { assert.strictEqual(result, 1); assert(!delayer.isTriggered()); }));
                assert(delayer.isTriggered());
                promises.push(delayer.trigger(factory).then((result) => { assert.strictEqual(result, 1); assert(!delayer.isTriggered()); }));
                assert(delayer.isTriggered());
                promises.push(delayer.trigger(factory).then((result) => { assert.strictEqual(result, 1); assert(!delayer.isTriggered()); }));
                assert(delayer.isTriggered());
                return Promise.all(promises).then(() => {
                    assert(!delayer.isTriggered());
                });
            });
            suite('ThrottledDelayer', () => {
                test('promise should resolve if disposed', async () => {
                    const throttledDelayer = new async.ThrottledDelayer(100);
                    const promise = throttledDelayer.trigger(async () => { }, 0);
                    throttledDelayer.dispose();
                    try {
                        await promise;
                        assert.fail('SHOULD NOT BE HERE');
                    }
                    catch (err) {
                        // OK
                    }
                });
                test('trigger after dispose throws', async () => {
                    const throttledDelayer = new async.ThrottledDelayer(100);
                    throttledDelayer.dispose();
                    await assert.rejects(() => throttledDelayer.trigger(async () => { }, 0));
                });
            });
            test('simple cancel', function () {
                let count = 0;
                const factory = () => {
                    return Promise.resolve(++count);
                };
                const delayer = new async.Delayer(0);
                assert(!delayer.isTriggered());
                const p = delayer.trigger(factory).then(() => {
                    assert(false);
                }, () => {
                    assert(true, 'yes, it was cancelled');
                });
                assert(delayer.isTriggered());
                delayer.cancel();
                assert(!delayer.isTriggered());
                return p;
            });
            test('simple cancel microtask', function () {
                let count = 0;
                const factory = () => {
                    return Promise.resolve(++count);
                };
                const delayer = new async.Delayer(MicrotaskDelay.MicrotaskDelay);
                assert(!delayer.isTriggered());
                const p = delayer.trigger(factory).then(() => {
                    assert(false);
                }, () => {
                    assert(true, 'yes, it was cancelled');
                });
                assert(delayer.isTriggered());
                delayer.cancel();
                assert(!delayer.isTriggered());
                return p;
            });
            test('cancel should cancel all calls to trigger', function () {
                let count = 0;
                const factory = () => {
                    return Promise.resolve(++count);
                };
                const delayer = new async.Delayer(0);
                const promises = [];
                assert(!delayer.isTriggered());
                promises.push(delayer.trigger(factory).then(undefined, () => { assert(true, 'yes, it was cancelled'); }));
                assert(delayer.isTriggered());
                promises.push(delayer.trigger(factory).then(undefined, () => { assert(true, 'yes, it was cancelled'); }));
                assert(delayer.isTriggered());
                promises.push(delayer.trigger(factory).then(undefined, () => { assert(true, 'yes, it was cancelled'); }));
                assert(delayer.isTriggered());
                delayer.cancel();
                return Promise.all(promises).then(() => {
                    assert(!delayer.isTriggered());
                });
            });
            test('trigger, cancel, then trigger again', function () {
                let count = 0;
                const factory = () => {
                    return Promise.resolve(++count);
                };
                const delayer = new async.Delayer(0);
                let promises = [];
                assert(!delayer.isTriggered());
                const p = delayer.trigger(factory).then((result) => {
                    assert.strictEqual(result, 1);
                    assert(!delayer.isTriggered());
                    promises.push(delayer.trigger(factory).then(undefined, () => { assert(true, 'yes, it was cancelled'); }));
                    assert(delayer.isTriggered());
                    promises.push(delayer.trigger(factory).then(undefined, () => { assert(true, 'yes, it was cancelled'); }));
                    assert(delayer.isTriggered());
                    delayer.cancel();
                    const p = Promise.all(promises).then(() => {
                        promises = [];
                        assert(!delayer.isTriggered());
                        promises.push(delayer.trigger(factory).then(() => { assert.strictEqual(result, 1); assert(!delayer.isTriggered()); }));
                        assert(delayer.isTriggered());
                        promises.push(delayer.trigger(factory).then(() => { assert.strictEqual(result, 1); assert(!delayer.isTriggered()); }));
                        assert(delayer.isTriggered());
                        const p = Promise.all(promises).then(() => {
                            assert(!delayer.isTriggered());
                        });
                        assert(delayer.isTriggered());
                        return p;
                    });
                    return p;
                });
                assert(delayer.isTriggered());
                return p;
            });
            test('last task should be the one getting called', function () {
                const factoryFactory = (n) => () => {
                    return Promise.resolve(n);
                };
                const delayer = new async.Delayer(0);
                const promises = [];
                assert(!delayer.isTriggered());
                promises.push(delayer.trigger(factoryFactory(1)).then((n) => { assert.strictEqual(n, 3); }));
                promises.push(delayer.trigger(factoryFactory(2)).then((n) => { assert.strictEqual(n, 3); }));
                promises.push(delayer.trigger(factoryFactory(3)).then((n) => { assert.strictEqual(n, 3); }));
                const p = Promise.all(promises).then(() => {
                    assert(!delayer.isTriggered());
                });
                assert(delayer.isTriggered());
                return p;
            });
        });
        suite('sequence', () => {
            test('simple', () => {
                const factoryFactory = (n) => () => {
                    return Promise.resolve(n);
                };
                return async.sequence([
                    factoryFactory(1),
                    factoryFactory(2),
                    factoryFactory(3),
                    factoryFactory(4),
                    factoryFactory(5),
                ]).then((result) => {
                    assert.strictEqual(5, result.length);
                    assert.strictEqual(1, result[0]);
                    assert.strictEqual(2, result[1]);
                    assert.strictEqual(3, result[2]);
                    assert.strictEqual(4, result[3]);
                    assert.strictEqual(5, result[4]);
                });
            });
        });
        suite('Limiter', () => {
            test('assert degree of paralellism', function () {
                let activePromises = 0;
                const factoryFactory = (n) => () => {
                    activePromises++;
                    assert(activePromises < 6);
                    return async.timeout(0).then(() => { activePromises--; return n; });
                };
                const limiter = new async.Limiter(5);
                const promises = [];
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(n => promises.push(limiter.queue(factoryFactory(n))));
                return Promise.all(promises).then((res) => {
                    assert.strictEqual(10, res.length);
                    assert.deepStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], res);
                });
            });
        });
        suite('Queue', () => {
            test('simple', function () {
                const queue = new async.Queue();
                let syncPromise = false;
                const f1 = () => Promise.resolve(true).then(() => syncPromise = true);
                let asyncPromise = false;
                const f2 = () => async.timeout(10).then(() => asyncPromise = true);
                assert.strictEqual(queue.size, 0);
                queue.queue(f1);
                assert.strictEqual(queue.size, 1);
                const p = queue.queue(f2);
                assert.strictEqual(queue.size, 2);
                return p.then(() => {
                    assert.strictEqual(queue.size, 0);
                    assert.ok(syncPromise);
                    assert.ok(asyncPromise);
                });
            });
            test('stop processing on dispose', async function () {
                const queue = new async.Queue();
                let workCounter = 0;
                const task = async () => {
                    await async.timeout(0);
                    workCounter++;
                    queue.dispose(); // DISPOSE HERE
                };
                const p1 = queue.queue(task);
                queue.queue(task);
                queue.queue(task);
                assert.strictEqual(queue.size, 3);
                await p1;
                assert.strictEqual(workCounter, 1);
            });
            test('stop on clear', async function () {
                const queue = new async.Queue();
                let workCounter = 0;
                const task = async () => {
                    await async.timeout(0);
                    workCounter++;
                    queue.clear(); // CLEAR HERE
                    assert.strictEqual(queue.size, 1); // THIS task is still running
                };
                const p1 = queue.queue(task);
                queue.queue(task);
                queue.queue(task);
                assert.strictEqual(queue.size, 3);
                await p1;
                assert.strictEqual(workCounter, 1);
                assert.strictEqual(queue.size, 0); // has been cleared
                const p2 = queue.queue(task);
                await p2;
                assert.strictEqual(workCounter, 2);
            });
            test('clear and drain (1)', async function () {
                const queue = new async.Queue();
                let workCounter = 0;
                const task = async () => {
                    await async.timeout(0);
                    workCounter++;
                    queue.clear(); // CLEAR HERE
                };
                const p0 = event_1.Event.toPromise(queue.onDrained);
                const p1 = queue.queue(task);
                await p1;
                await p0; // expect drain to fire because a task was running
                assert.strictEqual(workCounter, 1);
                queue.dispose();
            });
            test('clear and drain (2)', async function () {
                const queue = new async.Queue();
                let didFire = false;
                const d = queue.onDrained(() => {
                    didFire = true;
                });
                queue.clear();
                assert.strictEqual(didFire, false); // no work, no drain!
                d.dispose();
                queue.dispose();
            });
            test('drain timing', async function () {
                const queue = new async.Queue();
                const logicClock = new class {
                    constructor() {
                        this.time = 0;
                    }
                    tick() {
                        return this.time++;
                    }
                };
                let didDrainTime = 0;
                let didFinishTime1 = 0;
                let didFinishTime2 = 0;
                const d = queue.onDrained(() => {
                    didDrainTime = logicClock.tick();
                });
                const p1 = queue.queue(() => {
                    // await async.timeout(10);
                    didFinishTime1 = logicClock.tick();
                    return Promise.resolve();
                });
                const p2 = queue.queue(async () => {
                    await async.timeout(10);
                    didFinishTime2 = logicClock.tick();
                });
                await Promise.all([p1, p2]);
                assert.strictEqual(didFinishTime1, 0);
                assert.strictEqual(didFinishTime2, 1);
                assert.strictEqual(didDrainTime, 2);
                d.dispose();
                queue.dispose();
            });
            test('drain event is send only once', async function () {
                const queue = new async.Queue();
                let drainCount = 0;
                const d = queue.onDrained(() => { drainCount++; });
                queue.queue(async () => { });
                queue.queue(async () => { });
                queue.queue(async () => { });
                queue.queue(async () => { });
                assert.strictEqual(drainCount, 0);
                assert.strictEqual(queue.size, 4);
                await queue.whenIdle();
                assert.strictEqual(drainCount, 1);
                d.dispose();
                queue.dispose();
            });
            test('order is kept', function () {
                return (0, timeTravelScheduler_1.runWithFakedTimers)({}, () => {
                    const queue = new async.Queue();
                    const res = [];
                    const f1 = () => Promise.resolve(true).then(() => res.push(1));
                    const f2 = () => async.timeout(10).then(() => res.push(2));
                    const f3 = () => Promise.resolve(true).then(() => res.push(3));
                    const f4 = () => async.timeout(20).then(() => res.push(4));
                    const f5 = () => async.timeout(0).then(() => res.push(5));
                    queue.queue(f1);
                    queue.queue(f2);
                    queue.queue(f3);
                    queue.queue(f4);
                    return queue.queue(f5).then(() => {
                        assert.strictEqual(res[0], 1);
                        assert.strictEqual(res[1], 2);
                        assert.strictEqual(res[2], 3);
                        assert.strictEqual(res[3], 4);
                        assert.strictEqual(res[4], 5);
                    });
                });
            });
            test('errors bubble individually but not cause stop', function () {
                const queue = new async.Queue();
                const res = [];
                let error = false;
                const f1 = () => Promise.resolve(true).then(() => res.push(1));
                const f2 = () => async.timeout(10).then(() => res.push(2));
                const f3 = () => Promise.resolve(true).then(() => Promise.reject(new Error('error')));
                const f4 = () => async.timeout(20).then(() => res.push(4));
                const f5 = () => async.timeout(0).then(() => res.push(5));
                queue.queue(f1);
                queue.queue(f2);
                queue.queue(f3).then(undefined, () => error = true);
                queue.queue(f4);
                return queue.queue(f5).then(() => {
                    assert.strictEqual(res[0], 1);
                    assert.strictEqual(res[1], 2);
                    assert.ok(error);
                    assert.strictEqual(res[2], 4);
                    assert.strictEqual(res[3], 5);
                });
            });
            test('order is kept (chained)', function () {
                const queue = new async.Queue();
                const res = [];
                const f1 = () => Promise.resolve(true).then(() => res.push(1));
                const f2 = () => async.timeout(10).then(() => res.push(2));
                const f3 = () => Promise.resolve(true).then(() => res.push(3));
                const f4 = () => async.timeout(20).then(() => res.push(4));
                const f5 = () => async.timeout(0).then(() => res.push(5));
                return queue.queue(f1).then(() => {
                    return queue.queue(f2).then(() => {
                        return queue.queue(f3).then(() => {
                            return queue.queue(f4).then(() => {
                                return queue.queue(f5).then(() => {
                                    assert.strictEqual(res[0], 1);
                                    assert.strictEqual(res[1], 2);
                                    assert.strictEqual(res[2], 3);
                                    assert.strictEqual(res[3], 4);
                                    assert.strictEqual(res[4], 5);
                                });
                            });
                        });
                    });
                });
            });
            test('events', async function () {
                const queue = new async.Queue();
                let drained = false;
                const onDrained = event_1.Event.toPromise(queue.onDrained).then(() => drained = true);
                const res = [];
                const f1 = () => async.timeout(10).then(() => res.push(2));
                const f2 = () => async.timeout(20).then(() => res.push(4));
                const f3 = () => async.timeout(0).then(() => res.push(5));
                const q1 = queue.queue(f1);
                const q2 = queue.queue(f2);
                queue.queue(f3);
                q1.then(() => {
                    assert.ok(!drained);
                    q2.then(() => {
                        assert.ok(!drained);
                    });
                });
                await onDrained;
                assert.ok(drained);
            });
        });
        suite('ResourceQueue', () => {
            test('simple', async function () {
                const queue = new async.ResourceQueue();
                await queue.whenDrained(); // returns immediately since empty
                let done1 = false;
                queue.queueFor(uri_1.URI.file('/some/path'), async () => { done1 = true; });
                await queue.whenDrained(); // returns immediately since no work scheduled
                assert.strictEqual(done1, true);
                let done2 = false;
                queue.queueFor(uri_1.URI.file('/some/other/path'), async () => { done2 = true; });
                await queue.whenDrained(); // returns immediately since no work scheduled
                assert.strictEqual(done2, true);
                // schedule some work
                const w1 = new async.DeferredPromise();
                queue.queueFor(uri_1.URI.file('/some/path'), () => w1.p);
                let drained = false;
                queue.whenDrained().then(() => drained = true);
                assert.strictEqual(drained, false);
                await w1.complete();
                await async.timeout(0);
                assert.strictEqual(drained, true);
                // schedule some work
                const w2 = new async.DeferredPromise();
                const w3 = new async.DeferredPromise();
                queue.queueFor(uri_1.URI.file('/some/path'), () => w2.p);
                queue.queueFor(uri_1.URI.file('/some/other/path'), () => w3.p);
                drained = false;
                queue.whenDrained().then(() => drained = true);
                queue.dispose();
                await async.timeout(0);
                assert.strictEqual(drained, true);
            });
        });
        suite('retry', () => {
            test('success case', async () => {
                return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                    let counter = 0;
                    const res = await async.retry(() => {
                        counter++;
                        if (counter < 2) {
                            return Promise.reject(new Error('fail'));
                        }
                        return Promise.resolve(true);
                    }, 10, 3);
                    assert.strictEqual(res, true);
                });
            });
            test('error case', async () => {
                return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                    const expectedError = new Error('fail');
                    try {
                        await async.retry(() => {
                            return Promise.reject(expectedError);
                        }, 10, 3);
                    }
                    catch (error) {
                        assert.strictEqual(error, error);
                    }
                });
            });
        });
        suite('TaskSequentializer', () => {
            test('execution basics', async function () {
                const sequentializer = new async.TaskSequentializer();
                assert.ok(!sequentializer.isRunning());
                assert.ok(!sequentializer.hasQueued());
                assert.ok(!sequentializer.isRunning(2323));
                assert.ok(!sequentializer.running);
                // pending removes itself after done
                await sequentializer.run(1, Promise.resolve());
                assert.ok(!sequentializer.isRunning());
                assert.ok(!sequentializer.isRunning(1));
                assert.ok(!sequentializer.running);
                assert.ok(!sequentializer.hasQueued());
                // pending removes itself after done (use async.timeout)
                sequentializer.run(2, async.timeout(1));
                assert.ok(sequentializer.isRunning());
                assert.ok(sequentializer.isRunning(2));
                assert.ok(!sequentializer.hasQueued());
                assert.strictEqual(sequentializer.isRunning(1), false);
                assert.ok(sequentializer.running);
                await async.timeout(2);
                assert.strictEqual(sequentializer.isRunning(), false);
                assert.strictEqual(sequentializer.isRunning(2), false);
                assert.ok(!sequentializer.running);
            });
            test('executing and queued (finishes instantly)', async function () {
                const sequentializer = new async.TaskSequentializer();
                let pendingDone = false;
                sequentializer.run(1, async.timeout(1).then(() => { pendingDone = true; return; }));
                // queued finishes instantly
                let queuedDone = false;
                const res = sequentializer.queue(() => Promise.resolve(null).then(() => { queuedDone = true; return; }));
                assert.ok(sequentializer.hasQueued());
                await res;
                assert.ok(pendingDone);
                assert.ok(queuedDone);
                assert.ok(!sequentializer.hasQueued());
            });
            test('executing and queued (finishes after timeout)', async function () {
                const sequentializer = new async.TaskSequentializer();
                let pendingDone = false;
                sequentializer.run(1, async.timeout(1).then(() => { pendingDone = true; return; }));
                // queued finishes after async.timeout
                let queuedDone = false;
                const res = sequentializer.queue(() => async.timeout(1).then(() => { queuedDone = true; return; }));
                await res;
                assert.ok(pendingDone);
                assert.ok(queuedDone);
                assert.ok(!sequentializer.hasQueued());
            });
            test('join (without executing or queued)', async function () {
                const sequentializer = new async.TaskSequentializer();
                await sequentializer.join();
                assert.ok(!sequentializer.hasQueued());
            });
            test('join (without queued)', async function () {
                const sequentializer = new async.TaskSequentializer();
                let pendingDone = false;
                sequentializer.run(1, async.timeout(1).then(() => { pendingDone = true; return; }));
                await sequentializer.join();
                assert.ok(pendingDone);
                assert.ok(!sequentializer.isRunning());
            });
            test('join (with executing and queued)', async function () {
                const sequentializer = new async.TaskSequentializer();
                let pendingDone = false;
                sequentializer.run(1, async.timeout(1).then(() => { pendingDone = true; return; }));
                // queued finishes after async.timeout
                let queuedDone = false;
                sequentializer.queue(() => async.timeout(1).then(() => { queuedDone = true; return; }));
                await sequentializer.join();
                assert.ok(pendingDone);
                assert.ok(queuedDone);
                assert.ok(!sequentializer.isRunning());
                assert.ok(!sequentializer.hasQueued());
            });
            test('executing and multiple queued (last one wins)', async function () {
                const sequentializer = new async.TaskSequentializer();
                let pendingDone = false;
                sequentializer.run(1, async.timeout(1).then(() => { pendingDone = true; return; }));
                // queued finishes after async.timeout
                let firstDone = false;
                const firstRes = sequentializer.queue(() => async.timeout(2).then(() => { firstDone = true; return; }));
                let secondDone = false;
                const secondRes = sequentializer.queue(() => async.timeout(3).then(() => { secondDone = true; return; }));
                let thirdDone = false;
                const thirdRes = sequentializer.queue(() => async.timeout(4).then(() => { thirdDone = true; return; }));
                await Promise.all([firstRes, secondRes, thirdRes]);
                assert.ok(pendingDone);
                assert.ok(!firstDone);
                assert.ok(!secondDone);
                assert.ok(thirdDone);
            });
            test('cancel executing', async function () {
                const sequentializer = new async.TaskSequentializer();
                const ctsTimeout = store.add(new cancellation_1.CancellationTokenSource());
                let pendingCancelled = false;
                const timeout = async.timeout(1, ctsTimeout.token);
                sequentializer.run(1, timeout, () => pendingCancelled = true);
                sequentializer.cancelRunning();
                assert.ok(pendingCancelled);
                ctsTimeout.cancel();
            });
        });
        suite('disposableTimeout', () => {
            test('handler only success', async () => {
                let cb = false;
                const t = async.disposableTimeout(() => cb = true);
                await async.timeout(0);
                assert.strictEqual(cb, true);
                t.dispose();
            });
            test('handler only cancel', async () => {
                let cb = false;
                const t = async.disposableTimeout(() => cb = true);
                t.dispose();
                await async.timeout(0);
                assert.strictEqual(cb, false);
            });
            test('store managed success', async () => {
                let cb = false;
                const s = new lifecycle_1.DisposableStore();
                async.disposableTimeout(() => cb = true, 0, s);
                await async.timeout(0);
                assert.strictEqual(cb, true);
                s.dispose();
            });
            test('store managed cancel via disposable', async () => {
                let cb = false;
                const s = new lifecycle_1.DisposableStore();
                const t = async.disposableTimeout(() => cb = true, 0, s);
                t.dispose();
                await async.timeout(0);
                assert.strictEqual(cb, false);
                s.dispose();
            });
            test('store managed cancel via store', async () => {
                let cb = false;
                const s = new lifecycle_1.DisposableStore();
                async.disposableTimeout(() => cb = true, 0, s);
                s.dispose();
                await async.timeout(0);
                assert.strictEqual(cb, false);
            });
        });
        test('raceCancellation', async () => {
            const cts = store.add(new cancellation_1.CancellationTokenSource());
            const ctsTimeout = store.add(new cancellation_1.CancellationTokenSource());
            let triggered = false;
            const timeout = async.timeout(100, ctsTimeout.token);
            const p = async.raceCancellation(timeout.then(() => triggered = true), cts.token);
            cts.cancel();
            await p;
            assert.ok(!triggered);
            ctsTimeout.cancel();
        });
        test('raceTimeout', async () => {
            const cts = store.add(new cancellation_1.CancellationTokenSource());
            // timeout wins
            let timedout = false;
            let triggered = false;
            const ctsTimeout1 = store.add(new cancellation_1.CancellationTokenSource());
            const timeout1 = async.timeout(100, ctsTimeout1.token);
            const p1 = async.raceTimeout(timeout1.then(() => triggered = true), 1, () => timedout = true);
            cts.cancel();
            await p1;
            assert.ok(!triggered);
            assert.strictEqual(timedout, true);
            ctsTimeout1.cancel();
            // promise wins
            timedout = false;
            const ctsTimeout2 = store.add(new cancellation_1.CancellationTokenSource());
            const timeout2 = async.timeout(1, ctsTimeout2.token);
            const p2 = async.raceTimeout(timeout2.then(() => triggered = true), 100, () => timedout = true);
            cts.cancel();
            await p2;
            assert.ok(triggered);
            assert.strictEqual(timedout, false);
            ctsTimeout2.cancel();
        });
        test('SequencerByKey', async () => {
            const s = new async.SequencerByKey();
            const r1 = await s.queue('key1', () => Promise.resolve('hello'));
            assert.strictEqual(r1, 'hello');
            await s.queue('key2', () => Promise.reject(new Error('failed'))).then(() => {
                throw new Error('should not be resolved');
            }, err => {
                // Expected error
                assert.strictEqual(err.message, 'failed');
            });
            // Still works after a queued promise is rejected
            const r3 = await s.queue('key2', () => Promise.resolve('hello'));
            assert.strictEqual(r3, 'hello');
        });
        test('IntervalCounter', async () => {
            let now = 0;
            const counter = new async.IntervalCounter(5, () => now);
            assert.strictEqual(counter.increment(), 1);
            assert.strictEqual(counter.increment(), 2);
            assert.strictEqual(counter.increment(), 3);
            now = 10;
            assert.strictEqual(counter.increment(), 1);
            assert.strictEqual(counter.increment(), 2);
            assert.strictEqual(counter.increment(), 3);
        });
        suite('firstParallel', () => {
            test('simple', async () => {
                const a = await async.firstParallel([
                    Promise.resolve(1),
                    Promise.resolve(2),
                    Promise.resolve(3),
                ], v => v === 2);
                assert.strictEqual(a, 2);
            });
            test('uses null default', async () => {
                assert.strictEqual(await async.firstParallel([Promise.resolve(1)], v => v === 2), null);
            });
            test('uses value default', async () => {
                assert.strictEqual(await async.firstParallel([Promise.resolve(1)], v => v === 2, 4), 4);
            });
            test('empty', async () => {
                assert.strictEqual(await async.firstParallel([], v => v === 2, 4), 4);
            });
            test('cancels', async () => {
                let ct1;
                const p1 = async.createCancelablePromise(async (ct) => {
                    ct1 = ct;
                    await async.timeout(200, ct);
                    return 1;
                });
                let ct2;
                const p2 = async.createCancelablePromise(async (ct) => {
                    ct2 = ct;
                    await async.timeout(2, ct);
                    return 2;
                });
                assert.strictEqual(await async.firstParallel([p1, p2], v => v === 2, 4), 2);
                assert.strictEqual(ct1.isCancellationRequested, true, 'should cancel a');
                assert.strictEqual(ct2.isCancellationRequested, true, 'should cancel b');
            });
            test('rejection handling', async () => {
                let ct1;
                const p1 = async.createCancelablePromise(async (ct) => {
                    ct1 = ct;
                    await async.timeout(200, ct);
                    return 1;
                });
                let ct2;
                const p2 = async.createCancelablePromise(async (ct) => {
                    ct2 = ct;
                    await async.timeout(2, ct);
                    throw new Error('oh no');
                });
                assert.strictEqual(await async.firstParallel([p1, p2], v => v === 2, 4).catch(() => 'ok'), 'ok');
                assert.strictEqual(ct1.isCancellationRequested, true, 'should cancel a');
                assert.strictEqual(ct2.isCancellationRequested, true, 'should cancel b');
            });
        });
        suite('DeferredPromise', () => {
            test('resolves', async () => {
                const deferred = new async.DeferredPromise();
                assert.strictEqual(deferred.isResolved, false);
                deferred.complete(42);
                assert.strictEqual(await deferred.p, 42);
                assert.strictEqual(deferred.isResolved, true);
            });
            test('rejects', async () => {
                const deferred = new async.DeferredPromise();
                assert.strictEqual(deferred.isRejected, false);
                const err = new Error('oh no!');
                deferred.error(err);
                assert.strictEqual(await deferred.p.catch(e => e), err);
                assert.strictEqual(deferred.isRejected, true);
            });
            test('cancels', async () => {
                const deferred = new async.DeferredPromise();
                assert.strictEqual(deferred.isRejected, false);
                deferred.cancel();
                assert.strictEqual((await deferred.p.catch(e => e)).name, 'Canceled');
                assert.strictEqual(deferred.isRejected, true);
            });
        });
        suite('Promises.settled', () => {
            test('resolves', async () => {
                const p1 = Promise.resolve(1);
                const p2 = async.timeout(1).then(() => 2);
                const p3 = async.timeout(2).then(() => 3);
                const result = await async.Promises.settled([p1, p2, p3]);
                assert.strictEqual(result.length, 3);
                assert.deepStrictEqual(result[0], 1);
                assert.deepStrictEqual(result[1], 2);
                assert.deepStrictEqual(result[2], 3);
            });
            test('resolves in order', async () => {
                const p1 = async.timeout(2).then(() => 1);
                const p2 = async.timeout(1).then(() => 2);
                const p3 = Promise.resolve(3);
                const result = await async.Promises.settled([p1, p2, p3]);
                assert.strictEqual(result.length, 3);
                assert.deepStrictEqual(result[0], 1);
                assert.deepStrictEqual(result[1], 2);
                assert.deepStrictEqual(result[2], 3);
            });
            test('rejects with first error but handles all promises (all errors)', async () => {
                const p1 = Promise.reject(1);
                let p2Handled = false;
                const p2Error = new Error('2');
                const p2 = async.timeout(1).then(() => {
                    p2Handled = true;
                    throw p2Error;
                });
                let p3Handled = false;
                const p3Error = new Error('3');
                const p3 = async.timeout(2).then(() => {
                    p3Handled = true;
                    throw p3Error;
                });
                let error = undefined;
                try {
                    await async.Promises.settled([p1, p2, p3]);
                }
                catch (e) {
                    error = e;
                }
                assert.ok(error);
                assert.notStrictEqual(error, p2Error);
                assert.notStrictEqual(error, p3Error);
                assert.ok(p2Handled);
                assert.ok(p3Handled);
            });
            test('rejects with first error but handles all promises (1 error)', async () => {
                const p1 = Promise.resolve(1);
                let p2Handled = false;
                const p2Error = new Error('2');
                const p2 = async.timeout(1).then(() => {
                    p2Handled = true;
                    throw p2Error;
                });
                let p3Handled = false;
                const p3 = async.timeout(2).then(() => {
                    p3Handled = true;
                    return 3;
                });
                let error = undefined;
                try {
                    await async.Promises.settled([p1, p2, p3]);
                }
                catch (e) {
                    error = e;
                }
                assert.strictEqual(error, p2Error);
                assert.ok(p2Handled);
                assert.ok(p3Handled);
            });
        });
        suite('Promises.withAsyncBody', () => {
            test('basics', async () => {
                const p1 = async.Promises.withAsyncBody(async (resolve, reject) => {
                    resolve(1);
                });
                const p2 = async.Promises.withAsyncBody(async (resolve, reject) => {
                    reject(new Error('error'));
                });
                const p3 = async.Promises.withAsyncBody(async (resolve, reject) => {
                    throw new Error('error');
                });
                const r1 = await p1;
                assert.strictEqual(r1, 1);
                let e2 = undefined;
                try {
                    await p2;
                }
                catch (error) {
                    e2 = error;
                }
                assert.ok(e2 instanceof Error);
                let e3 = undefined;
                try {
                    await p3;
                }
                catch (error) {
                    e3 = error;
                }
                assert.ok(e3 instanceof Error);
            });
        });
        suite('ThrottledWorker', () => {
            function assertArrayEquals(actual, expected) {
                assert.strictEqual(actual.length, expected.length);
                for (let i = 0; i < actual.length; i++) {
                    assert.strictEqual(actual[i], expected[i]);
                }
            }
            test('basics', async () => {
                let handled = [];
                let handledCallback;
                let handledPromise = new Promise(resolve => handledCallback = resolve);
                let handledCounterToResolve = 1;
                let currentHandledCounter = 0;
                const handler = (units) => {
                    handled.push(...units);
                    currentHandledCounter++;
                    if (currentHandledCounter === handledCounterToResolve) {
                        handledCallback();
                        handledPromise = new Promise(resolve => handledCallback = resolve);
                        currentHandledCounter = 0;
                    }
                };
                const worker = store.add(new async.ThrottledWorker({
                    maxWorkChunkSize: 5,
                    maxBufferedWork: undefined,
                    throttleDelay: 1
                }, handler));
                // Work less than chunk size
                let worked = worker.work([1, 2, 3]);
                assertArrayEquals(handled, [1, 2, 3]);
                assert.strictEqual(worker.pending, 0);
                assert.strictEqual(worked, true);
                worker.work([4, 5]);
                worked = worker.work([6]);
                assertArrayEquals(handled, [1, 2, 3, 4, 5, 6]);
                assert.strictEqual(worker.pending, 0);
                assert.strictEqual(worked, true);
                // Work more than chunk size (variant 1)
                handled = [];
                handledCounterToResolve = 2;
                worked = worker.work([1, 2, 3, 4, 5, 6, 7]);
                assertArrayEquals(handled, [1, 2, 3, 4, 5]);
                assert.strictEqual(worker.pending, 2);
                assert.strictEqual(worked, true);
                await handledPromise;
                assertArrayEquals(handled, [1, 2, 3, 4, 5, 6, 7]);
                handled = [];
                handledCounterToResolve = 4;
                worked = worker.work([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
                assertArrayEquals(handled, [1, 2, 3, 4, 5]);
                assert.strictEqual(worker.pending, 14);
                assert.strictEqual(worked, true);
                await handledPromise;
                assertArrayEquals(handled, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
                // Work more than chunk size (variant 2)
                handled = [];
                handledCounterToResolve = 2;
                worked = worker.work([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
                assertArrayEquals(handled, [1, 2, 3, 4, 5]);
                assert.strictEqual(worker.pending, 5);
                assert.strictEqual(worked, true);
                await handledPromise;
                assertArrayEquals(handled, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
                // Work more while throttled (variant 1)
                handled = [];
                handledCounterToResolve = 3;
                worked = worker.work([1, 2, 3, 4, 5, 6, 7]);
                assertArrayEquals(handled, [1, 2, 3, 4, 5]);
                assert.strictEqual(worker.pending, 2);
                assert.strictEqual(worked, true);
                worker.work([8]);
                worked = worker.work([9, 10, 11]);
                assertArrayEquals(handled, [1, 2, 3, 4, 5]);
                assert.strictEqual(worker.pending, 6);
                assert.strictEqual(worked, true);
                await handledPromise;
                assertArrayEquals(handled, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
                assert.strictEqual(worker.pending, 0);
                // Work more while throttled (variant 2)
                handled = [];
                handledCounterToResolve = 2;
                worked = worker.work([1, 2, 3, 4, 5, 6, 7]);
                assertArrayEquals(handled, [1, 2, 3, 4, 5]);
                assert.strictEqual(worked, true);
                worker.work([8]);
                worked = worker.work([9, 10]);
                assertArrayEquals(handled, [1, 2, 3, 4, 5]);
                assert.strictEqual(worked, true);
                await handledPromise;
                assertArrayEquals(handled, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            });
            test('do not accept too much work', async () => {
                const handled = [];
                const handler = (units) => handled.push(...units);
                const worker = store.add(new async.ThrottledWorker({
                    maxWorkChunkSize: 5,
                    maxBufferedWork: 5,
                    throttleDelay: 1
                }, handler));
                let worked = worker.work([1, 2, 3]);
                assert.strictEqual(worked, true);
                worked = worker.work([1, 2, 3, 4, 5, 6]);
                assert.strictEqual(worked, true);
                assert.strictEqual(worker.pending, 1);
                worked = worker.work([7]);
                assert.strictEqual(worked, true);
                assert.strictEqual(worker.pending, 2);
                worked = worker.work([8, 9, 10, 11]);
                assert.strictEqual(worked, false);
                assert.strictEqual(worker.pending, 2);
            });
            test('do not accept too much work (account for max chunk size', async () => {
                const handled = [];
                const handler = (units) => handled.push(...units);
                const worker = store.add(new async.ThrottledWorker({
                    maxWorkChunkSize: 5,
                    maxBufferedWork: 5,
                    throttleDelay: 1
                }, handler));
                let worked = worker.work([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
                assert.strictEqual(worked, false);
                assert.strictEqual(worker.pending, 0);
                worked = worker.work([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
                assert.strictEqual(worked, true);
                assert.strictEqual(worker.pending, 5);
            });
            test('disposed', async () => {
                const handled = [];
                const handler = (units) => handled.push(...units);
                const worker = store.add(new async.ThrottledWorker({
                    maxWorkChunkSize: 5,
                    maxBufferedWork: undefined,
                    throttleDelay: 1
                }, handler));
                worker.dispose();
                const worked = worker.work([1, 2, 3]);
                assertArrayEquals(handled, []);
                assert.strictEqual(worker.pending, 0);
                assert.strictEqual(worked, false);
            });
        });
        suite('LimitedQueue', () => {
            test('basics (with long running task)', async () => {
                const limitedQueue = new async.LimitedQueue();
                let counter = 0;
                const promises = [];
                for (let i = 0; i < 5; i++) {
                    promises.push(limitedQueue.queue(async () => {
                        counter = i;
                        await async.timeout(1);
                    }));
                }
                await Promise.all(promises);
                // only the last task executed
                assert.strictEqual(counter, 4);
            });
            test('basics (with sync running task)', async () => {
                const limitedQueue = new async.LimitedQueue();
                let counter = 0;
                const promises = [];
                for (let i = 0; i < 5; i++) {
                    promises.push(limitedQueue.queue(async () => {
                        counter = i;
                    }));
                }
                await Promise.all(promises);
                // only the last task executed
                assert.strictEqual(counter, 4);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9hc3luYy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLEtBQUssQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO1FBRW5CLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxLQUFLLENBQUMsbUJBQW1CLEVBQUU7WUFDMUIsSUFBSSxDQUFDLDBDQUEwQyxFQUFFO2dCQUNoRCxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7Z0JBQ2pCLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDckQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEUsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxDQUFDLENBQUMsQ0FBQztnQkFDSCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRTtvQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ2hDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBQSw0QkFBbUIsRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxDQUFDLENBQUMsQ0FBQztnQkFDSCxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7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Q0FBQztvQkFDN0UsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUM3RSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDWixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUM7d0JBQ2xCLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDN0UsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUM3RSxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzdFLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDN0UsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUM3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QWtCLEVBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRTtvQkFDbEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBRWhDLE1BQU0sR0FBRyxHQUFhLEVBQUUsQ0FBQztvQkFFekIsTUFBTSxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMvRCxNQUFNLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzNELE1BQU0sRUFBRSxHQUFHLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDL0QsTUFBTSxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMzRCxNQUFNLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRTFELEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ2hCLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ2hCLEtBQUssQ0FBQyxL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