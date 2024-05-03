define(["require", "exports", "assert", "sinon", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/symbols", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils"], function (require, exports, assert, sinon_1, async_1, cancellation_1, errors_1, event_1, lifecycle_1, observable_1, symbols_1, timeTravelScheduler_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Samples;
    (function (Samples) {
        class EventCounter {
            constructor() {
                this.count = 0;
            }
            reset() {
                this.count = 0;
            }
            onEvent() {
                this.count += 1;
            }
        }
        Samples.EventCounter = EventCounter;
        class Document3 {
            constructor() {
                this._onDidChange = new event_1.Emitter();
                this.onDidChange = this._onDidChange.event;
            }
            setText(value) {
                //...
                this._onDidChange.fire(value);
            }
            dispose() {
                this._onDidChange.dispose();
            }
        }
        Samples.Document3 = Document3;
    })(Samples || (Samples = {}));
    suite('Event utils dispose', function () {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let tracker = new lifecycle_1.DisposableTracker();
        function assertDisposablesCount(expected) {
            if (Array.isArray(expected)) {
                const instances = new Set(expected);
                const actualInstances = tracker.getTrackedDisposables();
                assert.strictEqual(actualInstances.length, expected.length);
                for (const item of actualInstances) {
                    assert.ok(instances.has(item));
                }
            }
            else {
                assert.strictEqual(tracker.getTrackedDisposables().length, expected);
            }
        }
        setup(() => {
            tracker = new lifecycle_1.DisposableTracker();
            (0, lifecycle_1.setDisposableTracker)(tracker);
        });
        teardown(function () {
            (0, lifecycle_1.setDisposableTracker)(null);
        });
        test('no leak with snapshot-utils', function () {
            const store = new lifecycle_1.DisposableStore();
            const emitter = ds.add(new event_1.Emitter());
            const evens = event_1.Event.filter(emitter.event, n => n % 2 === 0, store);
            assertDisposablesCount(1); // snaphot only listen when `evens` is being listened on
            let all = 0;
            const leaked = evens(n => all += n);
            assert.ok((0, lifecycle_1.isDisposable)(leaked));
            assertDisposablesCount(3);
            emitter.dispose();
            store.dispose();
            assertDisposablesCount([leaked]); // leaked is still there
        });
        test('no leak with debounce-util', function () {
            const store = new lifecycle_1.DisposableStore();
            const emitter = ds.add(new event_1.Emitter());
            const debounced = event_1.Event.debounce(emitter.event, (l) => 0, undefined, undefined, undefined, undefined, store);
            assertDisposablesCount(1); // debounce only listens when `debounce` is being listened on
            let all = 0;
            const leaked = debounced(n => all += n);
            assert.ok((0, lifecycle_1.isDisposable)(leaked));
            assertDisposablesCount(3);
            emitter.dispose();
            store.dispose();
            assertDisposablesCount([leaked]); // leaked is still there
        });
    });
    suite('Event', function () {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const counter = new Samples.EventCounter();
        setup(() => counter.reset());
        test('Emitter plain', function () {
            const doc = ds.add(new Samples.Document3());
            const subscription = doc.onDidChange(counter.onEvent, counter);
            doc.setText('far');
            doc.setText('boo');
            // unhook listener
            subscription.dispose();
            doc.setText('boo');
            assert.strictEqual(counter.count, 2);
        });
        test('Emitter duplicate functions', () => {
            const calls = [];
            const a = (v) => calls.push(`a${v}`);
            const b = (v) => calls.push(`b${v}`);
            const emitter = ds.add(new event_1.Emitter());
            ds.add(emitter.event(a));
            ds.add(emitter.event(b));
            const s2 = emitter.event(a);
            emitter.fire('1');
            assert.deepStrictEqual(calls, ['a1', 'b1', 'a1']);
            s2.dispose();
            calls.length = 0;
            emitter.fire('2');
            assert.deepStrictEqual(calls, ['a2', 'b2']);
        });
        test('Emitter, dispose listener during emission', () => {
            for (let keepFirstMod = 1; keepFirstMod < 4; keepFirstMod++) {
                const emitter = ds.add(new event_1.Emitter());
                const calls = [];
                const disposables = Array.from({ length: 25 }, (_, n) => ds.add(emitter.event(() => {
                    if (n % keepFirstMod === 0) {
                        disposables[n].dispose();
                    }
                    calls.push(n);
                })));
                emitter.fire();
                assert.deepStrictEqual(calls, Array.from({ length: 25 }, (_, n) => n));
            }
        });
        test('Emitter, dispose emitter during emission', () => {
            const emitter = ds.add(new event_1.Emitter());
            const calls = [];
            const disposables = Array.from({ length: 25 }, (_, n) => ds.add(emitter.event(() => {
                if (n === 10) {
                    emitter.dispose();
                }
                calls.push(n);
            })));
            emitter.fire();
            disposables.forEach(d => d.dispose());
            assert.deepStrictEqual(calls, Array.from({ length: 11 }, (_, n) => n));
        });
        test('Emitter, shared delivery queue', () => {
            const deliveryQueue = (0, event_1.createEventDeliveryQueue)();
            const emitter1 = ds.add(new event_1.Emitter({ deliveryQueue }));
            const emitter2 = ds.add(new event_1.Emitter({ deliveryQueue }));
            const calls = [];
            ds.add(emitter1.event(d => { calls.push(`${d}a`); if (d === 1) {
                emitter2.fire(2);
            } }));
            ds.add(emitter1.event(d => { calls.push(`${d}b`); }));
            ds.add(emitter2.event(d => { calls.push(`${d}c`); emitter1.dispose(); }));
            ds.add(emitter2.event(d => { calls.push(`${d}d`); }));
            emitter1.fire(1);
            // 1. Check that 2 is not delivered before 1 finishes
            // 2. Check that 2 finishes getting delivered even if one emitter is disposed
            assert.deepStrictEqual(calls, ['1a', '1b', '2c', '2d']);
        });
        test('Emitter, handles removal during 3', () => {
            const fn1 = (0, sinon_1.stub)();
            const fn2 = (0, sinon_1.stub)();
            const emitter = ds.add(new event_1.Emitter());
            ds.add(emitter.event(fn1));
            const h = emitter.event(() => {
                h.dispose();
            });
            ds.add(emitter.event(fn2));
            emitter.fire('foo');
            assert.deepStrictEqual(fn2.args, [['foo']]);
            assert.deepStrictEqual(fn1.args, [['foo']]);
        });
        test('Emitter, handles removal during 2', () => {
            const fn1 = (0, sinon_1.stub)();
            const emitter = ds.add(new event_1.Emitter());
            ds.add(emitter.event(fn1));
            const h = emitter.event(() => {
                h.dispose();
            });
            emitter.fire('foo');
            assert.deepStrictEqual(fn1.args, [['foo']]);
        });
        test('Emitter, bucket', function () {
            const bucket = [];
            const doc = ds.add(new Samples.Document3());
            const subscription = doc.onDidChange(counter.onEvent, counter, bucket);
            doc.setText('far');
            doc.setText('boo');
            // unhook listener
            while (bucket.length) {
                bucket.pop().dispose();
            }
            doc.setText('boo');
            // noop
            subscription.dispose();
            doc.setText('boo');
            assert.strictEqual(counter.count, 2);
        });
        test('Emitter, store', function () {
            const bucket = ds.add(new lifecycle_1.DisposableStore());
            const doc = ds.add(new Samples.Document3());
            const subscription = doc.onDidChange(counter.onEvent, counter, bucket);
            doc.setText('far');
            doc.setText('boo');
            // unhook listener
            bucket.clear();
            doc.setText('boo');
            // noop
            subscription.dispose();
            doc.setText('boo');
            assert.strictEqual(counter.count, 2);
        });
        test('onFirstAdd|onLastRemove', () => {
            let firstCount = 0;
            let lastCount = 0;
            const a = ds.add(new event_1.Emitter({
                onWillAddFirstListener() { firstCount += 1; },
                onDidRemoveLastListener() { lastCount += 1; }
            }));
            assert.strictEqual(firstCount, 0);
            assert.strictEqual(lastCount, 0);
            let subscription1 = ds.add(a.event(function () { }));
            const subscription2 = ds.add(a.event(function () { }));
            assert.strictEqual(firstCount, 1);
            assert.strictEqual(lastCount, 0);
            subscription1.dispose();
            assert.strictEqual(firstCount, 1);
            assert.strictEqual(lastCount, 0);
            subscription2.dispose();
            assert.strictEqual(firstCount, 1);
            assert.strictEqual(lastCount, 1);
            subscription1 = ds.add(a.event(function () { }));
            assert.strictEqual(firstCount, 2);
            assert.strictEqual(lastCount, 1);
        });
        test('onWillRemoveListener', () => {
            let count = 0;
            const a = ds.add(new event_1.Emitter({
                onWillRemoveListener() { count += 1; }
            }));
            assert.strictEqual(count, 0);
            let subscription = ds.add(a.event(function () { }));
            assert.strictEqual(count, 0);
            subscription.dispose();
            assert.strictEqual(count, 1);
            subscription = ds.add(a.event(function () { }));
            assert.strictEqual(count, 1);
        });
        test('throwingListener', () => {
            const origErrorHandler = errors_1.errorHandler.getUnexpectedErrorHandler();
            (0, errors_1.setUnexpectedErrorHandler)(() => null);
            try {
                const a = ds.add(new event_1.Emitter());
                let hit = false;
                ds.add(a.event(function () {
                    // eslint-disable-next-line no-throw-literal
                    throw 9;
                }));
                ds.add(a.event(function () {
                    hit = true;
                }));
                a.fire(undefined);
                assert.strictEqual(hit, true);
            }
            finally {
                (0, errors_1.setUnexpectedErrorHandler)(origErrorHandler);
            }
        });
        test('throwingListener (custom handler)', () => {
            const allError = [];
            const a = ds.add(new event_1.Emitter({
                onListenerError(e) { allError.push(e); }
            }));
            let hit = false;
            ds.add(a.event(function () {
                // eslint-disable-next-line no-throw-literal
                throw 9;
            }));
            ds.add(a.event(function () {
                hit = true;
            }));
            a.fire(undefined);
            assert.strictEqual(hit, true);
            assert.deepStrictEqual(allError, [9]);
        });
        test('reusing event function and context', function () {
            let counter = 0;
            function listener() {
                counter += 1;
            }
            const context = {};
            const emitter = ds.add(new event_1.Emitter());
            const reg1 = emitter.event(listener, context);
            const reg2 = emitter.event(listener, context);
            emitter.fire(undefined);
            assert.strictEqual(counter, 2);
            reg1.dispose();
            emitter.fire(undefined);
            assert.strictEqual(counter, 3);
            reg2.dispose();
            emitter.fire(undefined);
            assert.strictEqual(counter, 3);
        });
        test('DebounceEmitter', async function () {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({}, async function () {
                let callCount = 0;
                let sum = 0;
                const emitter = new event_1.DebounceEmitter({
                    merge: arr => {
                        callCount += 1;
                        return arr.reduce((p, c) => p + c);
                    }
                });
                ds.add(emitter.event(e => { sum = e; }));
                const p = event_1.Event.toPromise(emitter.event);
                emitter.fire(1);
                emitter.fire(2);
                await p;
                assert.strictEqual(callCount, 1);
                assert.strictEqual(sum, 3);
            });
        });
        test('Microtask Emitter', (done) => {
            let count = 0;
            assert.strictEqual(count, 0);
            const emitter = new event_1.MicrotaskEmitter();
            const listener = emitter.event(() => {
                count++;
            });
            emitter.fire();
            assert.strictEqual(count, 0);
            emitter.fire();
            assert.strictEqual(count, 0);
            // Should wait until the event loop ends and therefore be the last thing called
            setTimeout(() => {
                assert.strictEqual(count, 3);
                done();
            }, 0);
            queueMicrotask(() => {
                assert.strictEqual(count, 2);
                count++;
                listener.dispose();
            });
        });
        test('Emitter - In Order Delivery', function () {
            const a = ds.add(new event_1.Emitter());
            const listener2Events = [];
            ds.add(a.event(function listener1(event) {
                if (event === 'e1') {
                    a.fire('e2');
                    // assert that all events are delivered at this point
                    assert.deepStrictEqual(listener2Events, ['e1', 'e2']);
                }
            }));
            ds.add(a.event(function listener2(event) {
                listener2Events.push(event);
            }));
            a.fire('e1');
            // assert that all events are delivered in order
            assert.deepStrictEqual(listener2Events, ['e1', 'e2']);
        });
        test('Emitter, - In Order Delivery 3x', function () {
            const a = ds.add(new event_1.Emitter());
            const listener2Events = [];
            ds.add(a.event(function listener1(event) {
                if (event === 'e2') {
                    a.fire('e3');
                    // assert that all events are delivered at this point
                    assert.deepStrictEqual(listener2Events, ['e1', 'e2', 'e3']);
                }
            }));
            ds.add(a.event(function listener1(event) {
                if (event === 'e1') {
                    a.fire('e2');
                    // assert that all events are delivered at this point
                    assert.deepStrictEqual(listener2Events, ['e1', 'e2', 'e3']);
                }
            }));
            ds.add(a.event(function listener2(event) {
                listener2Events.push(event);
            }));
            a.fire('e1');
            // assert that all events are delivered in order
            assert.deepStrictEqual(listener2Events, ['e1', 'e2', 'e3']);
        });
        test('Cannot read property \'_actual\' of undefined #142204', function () {
            const e = ds.add(new event_1.Emitter());
            const dispo = e.event(() => { });
            dispo.dispose.call(undefined); // assert that disposable can be called with this
        });
    });
    suite('AsyncEmitter', function () {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('event has waitUntil-function', async function () {
            const emitter = new event_1.AsyncEmitter();
            ds.add(emitter.event(e => {
                assert.strictEqual(e.foo, true);
                assert.strictEqual(e.bar, 1);
                assert.strictEqual(typeof e.waitUntil, 'function');
            }));
            emitter.fireAsync({ foo: true, bar: 1, }, cancellation_1.CancellationToken.None);
            emitter.dispose();
        });
        test('sequential delivery', async function () {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({}, async function () {
                let globalState = 0;
                const emitter = new event_1.AsyncEmitter();
                ds.add(emitter.event(e => {
                    e.waitUntil((0, async_1.timeout)(10).then(_ => {
                        assert.strictEqual(globalState, 0);
                        globalState += 1;
                    }));
                }));
                ds.add(emitter.event(e => {
                    e.waitUntil((0, async_1.timeout)(1).then(_ => {
                        assert.strictEqual(globalState, 1);
                        globalState += 1;
                    }));
                }));
                await emitter.fireAsync({ foo: true }, cancellation_1.CancellationToken.None);
                assert.strictEqual(globalState, 2);
            });
        });
        test('sequential, in-order delivery', async function () {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({}, async function () {
                const events = [];
                let done = false;
                const emitter = new event_1.AsyncEmitter();
                // e1
                ds.add(emitter.event(e => {
                    e.waitUntil((0, async_1.timeout)(10).then(async (_) => {
                        if (e.foo === 1) {
                            await emitter.fireAsync({ foo: 2 }, cancellation_1.CancellationToken.None);
                            assert.deepStrictEqual(events, [1, 2]);
                            done = true;
                        }
                    }));
                }));
                // e2
                ds.add(emitter.event(e => {
                    events.push(e.foo);
                    e.waitUntil((0, async_1.timeout)(7));
                }));
                await emitter.fireAsync({ foo: 1 }, cancellation_1.CancellationToken.None);
                assert.ok(done);
            });
        });
        test('catch errors', async function () {
            const origErrorHandler = errors_1.errorHandler.getUnexpectedErrorHandler();
            (0, errors_1.setUnexpectedErrorHandler)(() => null);
            let globalState = 0;
            const emitter = new event_1.AsyncEmitter();
            ds.add(emitter.event(e => {
                globalState += 1;
                e.waitUntil(new Promise((_r, reject) => reject(new Error())));
            }));
            ds.add(emitter.event(e => {
                globalState += 1;
                e.waitUntil((0, async_1.timeout)(10));
                e.waitUntil((0, async_1.timeout)(20).then(() => globalState++)); // multiple `waitUntil` are supported and awaited on
            }));
            await emitter.fireAsync({ foo: true }, cancellation_1.CancellationToken.None).then(() => {
                assert.strictEqual(globalState, 3);
            }).catch(e => {
                console.log(e);
                assert.ok(false);
            });
            (0, errors_1.setUnexpectedErrorHandler)(origErrorHandler);
        });
    });
    suite('PausableEmitter', function () {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('basic', function () {
            const data = [];
            const emitter = ds.add(new event_1.PauseableEmitter());
            ds.add(emitter.event(e => data.push(e)));
            emitter.fire(1);
            emitter.fire(2);
            assert.deepStrictEqual(data, [1, 2]);
        });
        test('pause/resume - no merge', function () {
            const data = [];
            const emitter = ds.add(new event_1.PauseableEmitter());
            ds.add(emitter.event(e => data.push(e)));
            emitter.fire(1);
            emitter.fire(2);
            assert.deepStrictEqual(data, [1, 2]);
            emitter.pause();
            emitter.fire(3);
            emitter.fire(4);
            assert.deepStrictEqual(data, [1, 2]);
            emitter.resume();
            assert.deepStrictEqual(data, [1, 2, 3, 4]);
            emitter.fire(5);
            assert.deepStrictEqual(data, [1, 2, 3, 4, 5]);
        });
        test('pause/resume - merge', function () {
            const data = [];
            const emitter = ds.add(new event_1.PauseableEmitter({ merge: (a) => a.reduce((p, c) => p + c, 0) }));
            ds.add(emitter.event(e => data.push(e)));
            emitter.fire(1);
            emitter.fire(2);
            assert.deepStrictEqual(data, [1, 2]);
            emitter.pause();
            emitter.fire(3);
            emitter.fire(4);
            assert.deepStrictEqual(data, [1, 2]);
            emitter.resume();
            assert.deepStrictEqual(data, [1, 2, 7]);
            emitter.fire(5);
            assert.deepStrictEqual(data, [1, 2, 7, 5]);
        });
        test('double pause/resume', function () {
            const data = [];
            const emitter = ds.add(new event_1.PauseableEmitter());
            ds.add(emitter.event(e => data.push(e)));
            emitter.fire(1);
            emitter.fire(2);
            assert.deepStrictEqual(data, [1, 2]);
            emitter.pause();
            emitter.pause();
            emitter.fire(3);
            emitter.fire(4);
            assert.deepStrictEqual(data, [1, 2]);
            emitter.resume();
            assert.deepStrictEqual(data, [1, 2]);
            emitter.resume();
            assert.deepStrictEqual(data, [1, 2, 3, 4]);
            emitter.resume();
            assert.deepStrictEqual(data, [1, 2, 3, 4]);
        });
        test('resume, no pause', function () {
            const data = [];
            const emitter = ds.add(new event_1.PauseableEmitter());
            ds.add(emitter.event(e => data.push(e)));
            emitter.fire(1);
            emitter.fire(2);
            assert.deepStrictEqual(data, [1, 2]);
            emitter.resume();
            emitter.fire(3);
            assert.deepStrictEqual(data, [1, 2, 3]);
        });
        test('nested pause', function () {
            const data = [];
            const emitter = ds.add(new event_1.PauseableEmitter());
            let once = true;
            ds.add(emitter.event(e => {
                data.push(e);
                if (once) {
                    emitter.pause();
                    once = false;
                }
            }));
            ds.add(emitter.event(e => {
                data.push(e);
            }));
            emitter.pause();
            emitter.fire(1);
            emitter.fire(2);
            assert.deepStrictEqual(data, []);
            emitter.resume();
            assert.deepStrictEqual(data, [1, 1]); // paused after first event
            emitter.resume();
            assert.deepStrictEqual(data, [1, 1, 2, 2]); // remaing event delivered
            emitter.fire(3);
            assert.deepStrictEqual(data, [1, 1, 2, 2, 3, 3]);
        });
        test('empty pause with merge', function () {
            const data = [];
            const emitter = ds.add(new event_1.PauseableEmitter({ merge: a => a[0] }));
            ds.add(emitter.event(e => data.push(1)));
            emitter.pause();
            emitter.resume();
            assert.deepStrictEqual(data, []);
        });
    });
    suite('Event utils - ensureNoDisposablesAreLeakedInTestSuite', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('fromObservable', function () {
            const obs = (0, observable_1.observableValue)('test', 12);
            const event = event_1.Event.fromObservable(obs);
            const values = [];
            const d = event(n => { values.push(n); });
            obs.set(3, undefined);
            obs.set(13, undefined);
            obs.set(3, undefined);
            obs.set(33, undefined);
            obs.set(1, undefined);
            (0, observable_1.transaction)(tx => {
                obs.set(334, tx);
                obs.set(99, tx);
            });
            assert.deepStrictEqual(values, ([3, 13, 3, 33, 1, 99]));
            d.dispose();
        });
    });
    suite('Event utils', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('EventBufferer', () => {
            test('should not buffer when not wrapped', () => {
                const bufferer = new event_1.EventBufferer();
                const counter = new Samples.EventCounter();
                const emitter = ds.add(new event_1.Emitter());
                const event = bufferer.wrapEvent(emitter.event);
                const listener = event(counter.onEvent, counter);
                assert.strictEqual(counter.count, 0);
                emitter.fire();
                assert.strictEqual(counter.count, 1);
                emitter.fire();
                assert.strictEqual(counter.count, 2);
                emitter.fire();
                assert.strictEqual(counter.count, 3);
                listener.dispose();
            });
            test('should buffer when wrapped', () => {
                const bufferer = new event_1.EventBufferer();
                const counter = new Samples.EventCounter();
                const emitter = ds.add(new event_1.Emitter());
                const event = bufferer.wrapEvent(emitter.event);
                const listener = event(counter.onEvent, counter);
                assert.strictEqual(counter.count, 0);
                emitter.fire();
                assert.strictEqual(counter.count, 1);
                bufferer.bufferEvents(() => {
                    emitter.fire();
                    assert.strictEqual(counter.count, 1);
                    emitter.fire();
                    assert.strictEqual(counter.count, 1);
                });
                assert.strictEqual(counter.count, 3);
                emitter.fire();
                assert.strictEqual(counter.count, 4);
                listener.dispose();
            });
            test('once', () => {
                const emitter = ds.add(new event_1.Emitter());
                let counter1 = 0, counter2 = 0, counter3 = 0;
                const listener1 = emitter.event(() => counter1++);
                const listener2 = event_1.Event.once(emitter.event)(() => counter2++);
                const listener3 = event_1.Event.once(emitter.event)(() => counter3++);
                assert.strictEqual(counter1, 0);
                assert.strictEqual(counter2, 0);
                assert.strictEqual(counter3, 0);
                listener3.dispose();
                emitter.fire();
                assert.strictEqual(counter1, 1);
                assert.strictEqual(counter2, 1);
                assert.strictEqual(counter3, 0);
                emitter.fire();
                assert.strictEqual(counter1, 2);
                assert.strictEqual(counter2, 1);
                assert.strictEqual(counter3, 0);
                listener1.dispose();
                listener2.dispose();
            });
        });
        suite('buffer', () => {
            test('should buffer events', () => {
                const result = [];
                const emitter = ds.add(new event_1.Emitter());
                const event = emitter.event;
                const bufferedEvent = event_1.Event.buffer(event);
                emitter.fire(1);
                emitter.fire(2);
                emitter.fire(3);
                assert.deepStrictEqual(result, []);
                const listener = bufferedEvent(num => result.push(num));
                assert.deepStrictEqual(result, [1, 2, 3]);
                emitter.fire(4);
                assert.deepStrictEqual(result, [1, 2, 3, 4]);
                listener.dispose();
                emitter.fire(5);
                assert.deepStrictEqual(result, [1, 2, 3, 4]);
            });
            test('should buffer events on next tick', async () => {
                const result = [];
                const emitter = ds.add(new event_1.Emitter());
                const event = emitter.event;
                const bufferedEvent = event_1.Event.buffer(event, true);
                emitter.fire(1);
                emitter.fire(2);
                emitter.fire(3);
                assert.deepStrictEqual(result, []);
                const listener = bufferedEvent(num => result.push(num));
                assert.deepStrictEqual(result, []);
                await (0, async_1.timeout)(10);
                emitter.fire(4);
                assert.deepStrictEqual(result, [1, 2, 3, 4]);
                listener.dispose();
                emitter.fire(5);
                assert.deepStrictEqual(result, [1, 2, 3, 4]);
            });
            test('should fire initial buffer events', () => {
                const result = [];
                const emitter = ds.add(new event_1.Emitter());
                const event = emitter.event;
                const bufferedEvent = event_1.Event.buffer(event, false, [-2, -1, 0]);
                emitter.fire(1);
                emitter.fire(2);
                emitter.fire(3);
                assert.deepStrictEqual(result, []);
                ds.add(bufferedEvent(num => result.push(num)));
                assert.deepStrictEqual(result, [-2, -1, 0, 1, 2, 3]);
            });
        });
        suite('EventMultiplexer', () => {
            test('works', () => {
                const result = [];
                const m = new event_1.EventMultiplexer();
                ds.add(m.event(r => result.push(r)));
                const e1 = ds.add(new event_1.Emitter());
                ds.add(m.add(e1.event));
                assert.deepStrictEqual(result, []);
                e1.fire(0);
                assert.deepStrictEqual(result, [0]);
            });
            test('multiplexer dispose works', () => {
                const result = [];
                const m = new event_1.EventMultiplexer();
                ds.add(m.event(r => result.push(r)));
                const e1 = ds.add(new event_1.Emitter());
                ds.add(m.add(e1.event));
                assert.deepStrictEqual(result, []);
                e1.fire(0);
                assert.deepStrictEqual(result, [0]);
                m.dispose();
                assert.deepStrictEqual(result, [0]);
                e1.fire(0);
                assert.deepStrictEqual(result, [0]);
            });
            test('event dispose works', () => {
                const result = [];
                const m = new event_1.EventMultiplexer();
                ds.add(m.event(r => result.push(r)));
                const e1 = ds.add(new event_1.Emitter());
                ds.add(m.add(e1.event));
                assert.deepStrictEqual(result, []);
                e1.fire(0);
                assert.deepStrictEqual(result, [0]);
                e1.dispose();
                assert.deepStrictEqual(result, [0]);
                e1.fire(0);
                assert.deepStrictEqual(result, [0]);
            });
            test('mutliplexer event dispose works', () => {
                const result = [];
                const m = new event_1.EventMultiplexer();
                ds.add(m.event(r => result.push(r)));
                const e1 = ds.add(new event_1.Emitter());
                const l1 = m.add(e1.event);
                assert.deepStrictEqual(result, []);
                e1.fire(0);
                assert.deepStrictEqual(result, [0]);
                l1.dispose();
                assert.deepStrictEqual(result, [0]);
                e1.fire(0);
                assert.deepStrictEqual(result, [0]);
            });
            test('hot start works', () => {
                const result = [];
                const m = new event_1.EventMultiplexer();
                ds.add(m.event(r => result.push(r)));
                const e1 = ds.add(new event_1.Emitter());
                ds.add(m.add(e1.event));
                const e2 = ds.add(new event_1.Emitter());
                ds.add(m.add(e2.event));
                const e3 = ds.add(new event_1.Emitter());
                ds.add(m.add(e3.event));
                e1.fire(1);
                e2.fire(2);
                e3.fire(3);
                assert.deepStrictEqual(result, [1, 2, 3]);
            });
            test('cold start works', () => {
                const result = [];
                const m = new event_1.EventMultiplexer();
                const e1 = ds.add(new event_1.Emitter());
                ds.add(m.add(e1.event));
                const e2 = ds.add(new event_1.Emitter());
                ds.add(m.add(e2.event));
                const e3 = ds.add(new event_1.Emitter());
                ds.add(m.add(e3.event));
                ds.add(m.event(r => result.push(r)));
                e1.fire(1);
                e2.fire(2);
                e3.fire(3);
                assert.deepStrictEqual(result, [1, 2, 3]);
            });
            test('late add works', () => {
                const result = [];
                const m = new event_1.EventMultiplexer();
                const e1 = ds.add(new event_1.Emitter());
                ds.add(m.add(e1.event));
                const e2 = ds.add(new event_1.Emitter());
                ds.add(m.add(e2.event));
                ds.add(m.event(r => result.push(r)));
                e1.fire(1);
                e2.fire(2);
                const e3 = ds.add(new event_1.Emitter());
                ds.add(m.add(e3.event));
                e3.fire(3);
                assert.deepStrictEqual(result, [1, 2, 3]);
            });
            test('add dispose works', () => {
                const result = [];
                const m = new event_1.EventMultiplexer();
                const e1 = ds.add(new event_1.Emitter());
                ds.add(m.add(e1.event));
                const e2 = ds.add(new event_1.Emitter());
                ds.add(m.add(e2.event));
                ds.add(m.event(r => result.push(r)));
                e1.fire(1);
                e2.fire(2);
                const e3 = ds.add(new event_1.Emitter());
                const l3 = m.add(e3.event);
                e3.fire(3);
                assert.deepStrictEqual(result, [1, 2, 3]);
                l3.dispose();
                e3.fire(4);
                assert.deepStrictEqual(result, [1, 2, 3]);
                e2.fire(4);
                e1.fire(5);
                assert.deepStrictEqual(result, [1, 2, 3, 4, 5]);
            });
        });
        suite('DynamicListEventMultiplexer', () => {
            let addEmitter;
            let removeEmitter;
            const recordedEvents = [];
            class TestItem {
                constructor() {
                    this.onTestEventEmitter = ds.add(new event_1.Emitter());
                    this.onTestEvent = this.onTestEventEmitter.event;
                }
            }
            let items;
            let m;
            setup(() => {
                addEmitter = ds.add(new event_1.Emitter());
                removeEmitter = ds.add(new event_1.Emitter());
                items = [new TestItem(), new TestItem()];
                for (const [i, item] of items.entries()) {
                    ds.add(item.onTestEvent(e => `${i}:${e}`));
                }
                m = new event_1.DynamicListEventMultiplexer(items, addEmitter.event, removeEmitter.event, e => e.onTestEvent);
                ds.add(m.event(e => recordedEvents.push(e)));
                recordedEvents.length = 0;
            });
            teardown(() => m.dispose());
            test('should fire events for initial items', () => {
                items[0].onTestEventEmitter.fire(1);
                items[1].onTestEventEmitter.fire(2);
                items[0].onTestEventEmitter.fire(3);
                items[1].onTestEventEmitter.fire(4);
                assert.deepStrictEqual(recordedEvents, [1, 2, 3, 4]);
            });
            test('should fire events for added items', () => {
                const addedItem = new TestItem();
                addEmitter.fire(addedItem);
                addedItem.onTestEventEmitter.fire(1);
                items[0].onTestEventEmitter.fire(2);
                items[1].onTestEventEmitter.fire(3);
                addedItem.onTestEventEmitter.fire(4);
                assert.deepStrictEqual(recordedEvents, [1, 2, 3, 4]);
            });
            test('should not fire events for removed items', () => {
                removeEmitter.fire(items[0]);
                items[0].onTestEventEmitter.fire(1);
                items[1].onTestEventEmitter.fire(2);
                items[0].onTestEventEmitter.fire(3);
                items[1].onTestEventEmitter.fire(4);
                assert.deepStrictEqual(recordedEvents, [2, 4]);
            });
        });
        test('latch', () => {
            const emitter = ds.add(new event_1.Emitter());
            const event = event_1.Event.latch(emitter.event);
            const result = [];
            const listener = ds.add(event(num => result.push(num)));
            assert.deepStrictEqual(result, []);
            emitter.fire(1);
            assert.deepStrictEqual(result, [1]);
            emitter.fire(2);
            assert.deepStrictEqual(result, [1, 2]);
            emitter.fire(2);
            assert.deepStrictEqual(result, [1, 2]);
            emitter.fire(1);
            assert.deepStrictEqual(result, [1, 2, 1]);
            emitter.fire(1);
            assert.deepStrictEqual(result, [1, 2, 1]);
            emitter.fire(3);
            assert.deepStrictEqual(result, [1, 2, 1, 3]);
            emitter.fire(3);
            assert.deepStrictEqual(result, [1, 2, 1, 3]);
            emitter.fire(3);
            assert.deepStrictEqual(result, [1, 2, 1, 3]);
            listener.dispose();
        });
        test('dispose is reentrant', () => {
            const emitter = ds.add(new event_1.Emitter({
                onDidRemoveLastListener: () => {
                    emitter.dispose();
                }
            }));
            const listener = emitter.event(() => undefined);
            listener.dispose(); // should not crash
        });
        suite('fromPromise', () => {
            test('not yet resolved', async function () {
                return new Promise(resolve => {
                    let promise = new async_1.DeferredPromise();
                    ds.add(event_1.Event.fromPromise(promise.p)(e => {
                        assert.strictEqual(e, 1);
                        promise = new async_1.DeferredPromise();
                        ds.add(event_1.Event.fromPromise(promise.p)(() => {
                            resolve();
                        }));
                        promise.error(undefined);
                    }));
                    promise.complete(1);
                });
            });
            test('already resolved', async function () {
                return new Promise(resolve => {
                    let promise = new async_1.DeferredPromise();
                    promise.complete(1);
                    ds.add(event_1.Event.fromPromise(promise.p)(e => {
                        assert.strictEqual(e, 1);
                        promise = new async_1.DeferredPromise();
                        promise.error(undefined);
                        ds.add(event_1.Event.fromPromise(promise.p)(() => {
                            resolve();
                        }));
                    }));
                });
            });
        });
        suite('Relay', () => {
            test('should input work', () => {
                const e1 = ds.add(new event_1.Emitter());
                const e2 = ds.add(new event_1.Emitter());
                const relay = new event_1.Relay();
                const result = [];
                const listener = (num) => result.push(num);
                const subscription = relay.event(listener);
                e1.fire(1);
                assert.deepStrictEqual(result, []);
                relay.input = e1.event;
                e1.fire(2);
                assert.deepStrictEqual(result, [2]);
                relay.input = e2.event;
                e1.fire(3);
                e2.fire(4);
                assert.deepStrictEqual(result, [2, 4]);
                subscription.dispose();
                e1.fire(5);
                e2.fire(6);
                assert.deepStrictEqual(result, [2, 4]);
            });
            test('should Relay dispose work', () => {
                const e1 = ds.add(new event_1.Emitter());
                const e2 = ds.add(new event_1.Emitter());
                const relay = new event_1.Relay();
                const result = [];
                const listener = (num) => result.push(num);
                ds.add(relay.event(listener));
                e1.fire(1);
                assert.deepStrictEqual(result, []);
                relay.input = e1.event;
                e1.fire(2);
                assert.deepStrictEqual(result, [2]);
                relay.input = e2.event;
                e1.fire(3);
                e2.fire(4);
                assert.deepStrictEqual(result, [2, 4]);
                relay.dispose();
                e1.fire(5);
                e2.fire(6);
                assert.deepStrictEqual(result, [2, 4]);
            });
        });
        suite('accumulate', () => {
            test('should not fire after a listener is disposed with undefined or []', async () => {
                const eventEmitter = ds.add(new event_1.Emitter());
                const event = eventEmitter.event;
                const accumulated = event_1.Event.accumulate(event, 0);
                const calls1 = [];
                const calls2 = [];
                const listener1 = ds.add(accumulated((e) => calls1.push(e)));
                ds.add(accumulated((e) => calls2.push(e)));
                eventEmitter.fire(1);
                await (0, async_1.timeout)(1);
                assert.deepStrictEqual(calls1, [[1]]);
                assert.deepStrictEqual(calls2, [[1]]);
                listener1.dispose();
                await (0, async_1.timeout)(1);
                assert.deepStrictEqual(calls1, [[1]]);
                assert.deepStrictEqual(calls2, [[1]], 'should not fire after a listener is disposed with undefined or []');
            });
            test('should accumulate a single event', async () => {
                const eventEmitter = ds.add(new event_1.Emitter());
                const event = eventEmitter.event;
                const accumulated = event_1.Event.accumulate(event, 0);
                const results1 = await new Promise(r => {
                    ds.add(accumulated(r));
                    eventEmitter.fire(1);
                });
                assert.deepStrictEqual(results1, [1]);
                const results2 = await new Promise(r => {
                    ds.add(accumulated(r));
                    eventEmitter.fire(2);
                });
                assert.deepStrictEqual(results2, [2]);
            });
            test('should accumulate multiple events', async () => {
                const eventEmitter = ds.add(new event_1.Emitter());
                const event = eventEmitter.event;
                const accumulated = event_1.Event.accumulate(event, 0);
                const results1 = await new Promise(r => {
                    ds.add(accumulated(r));
                    eventEmitter.fire(1);
                    eventEmitter.fire(2);
                    eventEmitter.fire(3);
                });
                assert.deepStrictEqual(results1, [1, 2, 3]);
                const results2 = await new Promise(r => {
                    ds.add(accumulated(r));
                    eventEmitter.fire(4);
                    eventEmitter.fire(5);
                    eventEmitter.fire(6);
                    eventEmitter.fire(7);
                    eventEmitter.fire(8);
                });
                assert.deepStrictEqual(results2, [4, 5, 6, 7, 8]);
            });
        });
        suite('debounce', () => {
            test('simple', function (done) {
                const doc = ds.add(new Samples.Document3());
                const onDocDidChange = event_1.Event.debounce(doc.onDidChange, (prev, cur) => {
                    if (!prev) {
                        prev = [cur];
                    }
                    else if (prev.indexOf(cur) < 0) {
                        prev.push(cur);
                    }
                    return prev;
                }, 10);
                let count = 0;
                ds.add(onDocDidChange(keys => {
                    count++;
                    assert.ok(keys, 'was not expecting keys.');
                    if (count === 1) {
                        doc.setText('4');
                        assert.deepStrictEqual(keys, ['1', '2', '3']);
                    }
                    else if (count === 2) {
                        assert.deepStrictEqual(keys, ['4']);
                        done();
                    }
                }));
                doc.setText('1');
                doc.setText('2');
                doc.setText('3');
            });
            test('microtask', function (done) {
                const doc = ds.add(new Samples.Document3());
                const onDocDidChange = event_1.Event.debounce(doc.onDidChange, (prev, cur) => {
                    if (!prev) {
                        prev = [cur];
                    }
                    else if (prev.indexOf(cur) < 0) {
                        prev.push(cur);
                    }
                    return prev;
                }, symbols_1.MicrotaskDelay);
                let count = 0;
                ds.add(onDocDidChange(keys => {
                    count++;
                    assert.ok(keys, 'was not expecting keys.');
                    if (count === 1) {
                        doc.setText('4');
                        assert.deepStrictEqual(keys, ['1', '2', '3']);
                    }
                    else if (count === 2) {
                        assert.deepStrictEqual(keys, ['4']);
                        done();
                    }
                }));
                doc.setText('1');
                doc.setText('2');
                doc.setText('3');
            });
            test('leading', async function () {
                const emitter = ds.add(new event_1.Emitter());
                const debounced = event_1.Event.debounce(emitter.event, (l, e) => e, 0, /*leading=*/ true);
                let calls = 0;
                ds.add(debounced(() => {
                    calls++;
                }));
                // If the source event is fired once, the debounced (on the leading edge) event should be fired only once
                emitter.fire();
                await (0, async_1.timeout)(1);
                assert.strictEqual(calls, 1);
            });
            test('leading (2)', async function () {
                const emitter = ds.add(new event_1.Emitter());
                const debounced = event_1.Event.debounce(emitter.event, (l, e) => e, 0, /*leading=*/ true);
                let calls = 0;
                ds.add(debounced(() => {
                    calls++;
                }));
                // If the source event is fired multiple times, the debounced (on the leading edge) event should be fired twice
                emitter.fire();
                emitter.fire();
                emitter.fire();
                await (0, async_1.timeout)(1);
                assert.strictEqual(calls, 2);
            });
            test('leading reset', async function () {
                const emitter = ds.add(new event_1.Emitter());
                const debounced = event_1.Event.debounce(emitter.event, (l, e) => l ? l + 1 : 1, 0, /*leading=*/ true);
                const calls = [];
                ds.add(debounced((e) => calls.push(e)));
                emitter.fire(1);
                emitter.fire(1);
                await (0, async_1.timeout)(1);
                assert.deepStrictEqual(calls, [1, 1]);
            });
            test('should not flush events when a listener is disposed', async () => {
                const emitter = ds.add(new event_1.Emitter());
                const debounced = event_1.Event.debounce(emitter.event, (l, e) => l ? l + 1 : 1, 0);
                const calls = [];
                const listener = ds.add(debounced((e) => calls.push(e)));
                emitter.fire(1);
                listener.dispose();
                emitter.fire(1);
                await (0, async_1.timeout)(1);
                assert.deepStrictEqual(calls, []);
            });
            test('flushOnListenerRemove - should flush events when a listener is disposed', async () => {
                const emitter = ds.add(new event_1.Emitter());
                const debounced = event_1.Event.debounce(emitter.event, (l, e) => l ? l + 1 : 1, 0, undefined, true);
                const calls = [];
                const listener = ds.add(debounced((e) => calls.push(e)));
                emitter.fire(1);
                listener.dispose();
                emitter.fire(1);
                await (0, async_1.timeout)(1);
                assert.deepStrictEqual(calls, [1], 'should fire with the first event, not the second (after listener dispose)');
            });
            test('should flush events when the emitter is disposed', async () => {
                const emitter = ds.add(new event_1.Emitter());
                const debounced = event_1.Event.debounce(emitter.event, (l, e) => l ? l + 1 : 1, 0);
                const calls = [];
                ds.add(debounced((e) => calls.push(e)));
                emitter.fire(1);
                emitter.dispose();
                await (0, async_1.timeout)(1);
                assert.deepStrictEqual(calls, [1]);
            });
        });
        suite('chain2', () => {
            let em;
            let calls;
            setup(() => {
                em = ds.add(new event_1.Emitter());
                calls = [];
            });
            test('maps', () => {
                const ev = event_1.Event.chain(em.event, $ => $.map(v => v * 2));
                ds.add(ev(v => calls.push(v)));
                em.fire(1);
                em.fire(2);
                em.fire(3);
                assert.deepStrictEqual(calls, [2, 4, 6]);
            });
            test('filters', () => {
                const ev = event_1.Event.chain(em.event, $ => $.filter(v => v % 2 === 0));
                ds.add(ev(v => calls.push(v)));
                em.fire(1);
                em.fire(2);
                em.fire(3);
                em.fire(4);
                assert.deepStrictEqual(calls, [2, 4]);
            });
            test('reduces', () => {
                const ev = event_1.Event.chain(em.event, $ => $.reduce((acc, v) => acc + v, 0));
                ds.add(ev(v => calls.push(v)));
                em.fire(1);
                em.fire(2);
                em.fire(3);
                em.fire(4);
                assert.deepStrictEqual(calls, [1, 3, 6, 10]);
            });
            test('latches', () => {
                const ev = event_1.Event.chain(em.event, $ => $.latch());
                ds.add(ev(v => calls.push(v)));
                em.fire(1);
                em.fire(1);
                em.fire(2);
                em.fire(2);
                em.fire(3);
                em.fire(3);
                em.fire(1);
                assert.deepStrictEqual(calls, [1, 2, 3, 1]);
            });
            test('does everything', () => {
                const ev = event_1.Event.chain(em.event, $ => $
                    .filter(v => v % 2 === 0)
                    .map(v => v * 2)
                    .reduce((acc, v) => acc + v, 0)
                    .latch());
                ds.add(ev(v => calls.push(v)));
                em.fire(1);
                em.fire(2);
                em.fire(3);
                em.fire(4);
                em.fire(0);
                assert.deepStrictEqual(calls, [4, 12]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9ldmVudC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQWdCQSxJQUFVLE9BQU8sQ0ErQmhCO0lBL0JELFdBQVUsT0FBTztRQUVoQixNQUFhLFlBQVk7WUFBekI7Z0JBRUMsVUFBSyxHQUFHLENBQUMsQ0FBQztZQVNYLENBQUM7WUFQQSxLQUFLO2dCQUNKLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2hCLENBQUM7WUFFRCxPQUFPO2dCQUNOLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO1lBQ2pCLENBQUM7U0FDRDtRQVhZLG9CQUFZLGVBV3hCLENBQUE7UUFFRCxNQUFhLFNBQVM7WUFBdEI7Z0JBRWtCLGlCQUFZLEdBQUcsSUFBSSxlQUFPLEVBQVUsQ0FBQztnQkFFdEQsZ0JBQVcsR0FBa0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFXdEQsQ0FBQztZQVRBLE9BQU8sQ0FBQyxLQUFhO2dCQUNwQixLQUFLO2dCQUNMLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFFRCxPQUFPO2dCQUNOLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDN0IsQ0FBQztTQUVEO1FBZlksaUJBQVMsWUFlckIsQ0FBQTtJQUNGLENBQUMsRUEvQlMsT0FBTyxLQUFQLE9BQU8sUUErQmhCO0lBRUQsS0FBSyxDQUFDLHFCQUFxQixFQUFFO1FBRTVCLE1BQU0sRUFBRSxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUVyRCxJQUFJLE9BQU8sR0FBRyxJQUFJLDZCQUFpQixFQUFFLENBQUM7UUFFdEMsU0FBUyxzQkFBc0IsQ0FBQyxRQUFxQztZQUNwRSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3BDLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUU1RCxLQUFLLE1BQU0sSUFBSSxJQUFJLGVBQWUsRUFBRSxDQUFDO29CQUNwQyxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDaEMsQ0FBQztZQUVGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN0RSxDQUFDO1FBRUYsQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixPQUFPLEdBQUcsSUFBSSw2QkFBaUIsRUFBRSxDQUFDO1lBQ2xDLElBQUEsZ0NBQW9CLEVBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUM7WUFDUixJQUFBLGdDQUFvQixFQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFO1lBRW5DLE1BQU0sS0FBSyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sS0FBSyxHQUFHLGFBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ25FLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsd0RBQXdEO1lBRW5GLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNaLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUEsd0JBQVksRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTFCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNsQixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsc0JBQXNCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsd0JBQXdCO1FBQzNELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDRCQUE0QixFQUFFO1lBQ2xDLE1BQU0sS0FBSyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sU0FBUyxHQUFHLGFBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3RyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLDZEQUE2RDtZQUV4RixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDWixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDeEMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNoQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUxQixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWhCLHNCQUFzQixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLHdCQUF3QjtRQUMzRCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsS0FBSyxDQUFDLE9BQU8sRUFBRTtRQUVkLE1BQU0sRUFBRSxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUVyRCxNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUUzQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFFN0IsSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUVyQixNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFFNUMsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRS9ELEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVuQixrQkFBa0I7WUFDbEIsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3ZCLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtZQUN4QyxNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7WUFDM0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUU3QyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztZQUU5QyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QixFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTVCLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFbEQsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDakIsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQixNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJDQUEyQyxFQUFFLEdBQUcsRUFBRTtZQUN0RCxLQUFLLElBQUksWUFBWSxHQUFHLENBQUMsRUFBRSxZQUFZLEdBQUcsQ0FBQyxFQUFFLFlBQVksRUFBRSxFQUFFLENBQUM7Z0JBQzdELE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFO29CQUNsRixJQUFJLENBQUMsR0FBRyxZQUFZLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQzVCLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDMUIsQ0FBQztvQkFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNmLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFTCxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEUsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtZQUNyRCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUM1QyxNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7WUFDM0IsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7Z0JBQ2xGLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDO29CQUNkLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsQ0FBQztnQkFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUwsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2YsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtZQUMzQyxNQUFNLGFBQWEsR0FBRyxJQUFBLGdDQUF3QixHQUFFLENBQUM7WUFDakQsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sQ0FBUyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRSxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxDQUFTLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWhFLE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztZQUMzQixFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RixFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEQsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0RCxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWpCLHFEQUFxRDtZQUNyRCw2RUFBNkU7WUFDN0UsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3pELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRTtZQUM5QyxNQUFNLEdBQUcsR0FBRyxJQUFBLFlBQUksR0FBRSxDQUFDO1lBQ25CLE1BQU0sR0FBRyxHQUFHLElBQUEsWUFBSSxHQUFFLENBQUM7WUFDbkIsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7WUFFOUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7Z0JBQzVCLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLENBQUMsQ0FBQyxDQUFDO1lBQ0gsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDM0IsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVwQixNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7WUFDOUMsTUFBTSxHQUFHLEdBQUcsSUFBQSxZQUFJLEdBQUUsQ0FBQztZQUNuQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztZQUU5QyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMzQixNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtnQkFDNUIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXBCLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBRXZCLE1BQU0sTUFBTSxHQUFrQixFQUFFLENBQUM7WUFDakMsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFdkUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQixHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRW5CLGtCQUFrQjtZQUNsQixPQUFPLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxDQUFDLEdBQUcsRUFBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3pCLENBQUM7WUFDRCxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRW5CLE9BQU87WUFDUCxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFdkIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFFdEIsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUM1QyxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRXZFLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVuQixrQkFBa0I7WUFDbEIsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2YsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVuQixPQUFPO1lBQ1AsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXZCLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtZQUVwQyxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDbkIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLENBQUM7Z0JBQzVCLHNCQUFzQixLQUFLLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3Qyx1QkFBdUIsS0FBSyxTQUFTLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUM3QyxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWpDLElBQUksYUFBYSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckQsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVqQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFakMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWpDLGFBQWEsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtZQUNqQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDZCxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxDQUFDO2dCQUM1QixvQkFBb0IsS0FBSyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN0QyxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTdCLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFN0IsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTdCLFlBQVksR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtZQUM3QixNQUFNLGdCQUFnQixHQUFHLHFCQUFZLENBQUMseUJBQXlCLEVBQUUsQ0FBQztZQUNsRSxJQUFBLGtDQUF5QixFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXRDLElBQUksQ0FBQztnQkFDSixNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFhLENBQUMsQ0FBQztnQkFDM0MsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDO2dCQUNoQixFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7b0JBQ2QsNENBQTRDO29CQUM1QyxNQUFNLENBQUMsQ0FBQztnQkFDVCxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNKLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztvQkFDZCxHQUFHLEdBQUcsSUFBSSxDQUFDO2dCQUNaLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDbEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFL0IsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLElBQUEsa0NBQXlCLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUM3QyxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFO1lBRTlDLE1BQU0sUUFBUSxHQUFVLEVBQUUsQ0FBQztZQUUzQixNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxDQUFZO2dCQUN2QyxlQUFlLENBQUMsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3hDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDO1lBQ2hCLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDZCw0Q0FBNEM7Z0JBQzVDLE1BQU0sQ0FBQyxDQUFDO1lBQ1QsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDZCxHQUFHLEdBQUcsSUFBSSxDQUFDO1lBQ1osQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXZDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9DQUFvQyxFQUFFO1lBQzFDLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztZQUNoQixTQUFTLFFBQVE7Z0JBQ2hCLE9BQU8sSUFBSSxDQUFDLENBQUM7WUFDZCxDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBRW5CLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQWEsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzlDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRTlDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFL0IsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN4QixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUvQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDZixPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEtBQUs7WUFDNUIsT0FBTyxJQUFBLHdDQUFrQixFQUFDLEVBQUUsRUFBRSxLQUFLO2dCQUVsQyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7Z0JBQ2xCLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDWixNQUFNLE9BQU8sR0FBRyxJQUFJLHVCQUFlLENBQVM7b0JBQzNDLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRTt3QkFDWixTQUFTLElBQUksQ0FBQyxDQUFDO3dCQUNmLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDcEMsQ0FBQztpQkFDRCxDQUFDLENBQUM7Z0JBRUgsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXpDLE1BQU0sQ0FBQyxHQUFHLGFBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUV6QyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVoQixNQUFNLENBQUMsQ0FBQztnQkFFUixNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ2xDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNkLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sT0FBTyxHQUFHLElBQUksd0JBQWdCLEVBQVEsQ0FBQztZQUM3QyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtnQkFDbkMsS0FBSyxFQUFFLENBQUM7WUFDVCxDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNmLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNmLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdCLCtFQUErRTtZQUMvRSxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUNmLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixJQUFJLEVBQUUsQ0FBQztZQUNSLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNOLGNBQWMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ25CLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixLQUFLLEVBQUUsQ0FBQztnQkFDUixRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2QkFBNkIsRUFBRTtZQUNuQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztZQUN4QyxNQUFNLGVBQWUsR0FBYSxFQUFFLENBQUM7WUFDckMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsU0FBUyxDQUFDLEtBQUs7Z0JBQ3RDLElBQUksS0FBSyxLQUFLLElBQUksRUFBRSxDQUFDO29CQUNwQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNiLHFEQUFxRDtvQkFDckQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDdkQsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxTQUFTLENBQUMsS0FBSztnQkFDdEMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUViLGdEQUFnRDtZQUNoRCxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFO1lBQ3ZDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sZUFBZSxHQUFhLEVBQUUsQ0FBQztZQUNyQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxTQUFTLENBQUMsS0FBSztnQkFDdEMsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQ3BCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2IscURBQXFEO29CQUNyRCxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDN0QsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxTQUFTLENBQUMsS0FBSztnQkFDdEMsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQ3BCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2IscURBQXFEO29CQUNyRCxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDN0QsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxTQUFTLENBQUMsS0FBSztnQkFDdEMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUViLGdEQUFnRDtZQUNoRCxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM3RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1REFBdUQsRUFBRTtZQUM3RCxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztZQUN4QyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUUsaURBQWlEO1FBQ2xGLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLENBQUMsY0FBYyxFQUFFO1FBRXJCLE1BQU0sRUFBRSxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUVyRCxJQUFJLENBQUMsOEJBQThCLEVBQUUsS0FBSztZQU96QyxNQUFNLE9BQU8sR0FBRyxJQUFJLG9CQUFZLEVBQUssQ0FBQztZQUV0QyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQkFBcUIsRUFBRSxLQUFLO1lBQ2hDLE9BQU8sSUFBQSx3Q0FBa0IsRUFBQyxFQUFFLEVBQUUsS0FBSztnQkFNbEMsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO2dCQUNwQixNQUFNLE9BQU8sR0FBRyxJQUFJLG9CQUFZLEVBQUssQ0FBQztnQkFFdEMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUN4QixDQUFDLENBQUMsU0FBUyxDQUFDLElBQUEsZUFBTyxFQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ25DLFdBQVcsSUFBSSxDQUFDLENBQUM7b0JBQ2xCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFSixFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ3hCLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBQSxlQUFPLEVBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO3dCQUMvQixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDbkMsV0FBVyxJQUFJLENBQUMsQ0FBQztvQkFDbEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVKLE1BQU0sT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrQkFBK0IsRUFBRSxLQUFLO1lBQzFDLE9BQU8sSUFBQSx3Q0FBa0IsRUFBQyxFQUFFLEVBQUUsS0FBSztnQkFLbEMsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO2dCQUM1QixJQUFJLElBQUksR0FBRyxLQUFLLENBQUM7Z0JBQ2pCLE1BQU0sT0FBTyxHQUFHLElBQUksb0JBQVksRUFBSyxDQUFDO2dCQUV0QyxLQUFLO2dCQUNMLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDeEIsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFBLGVBQU8sRUFBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFDLENBQUMsRUFBQyxFQUFFO3dCQUN0QyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUM7NEJBQ2pCLE1BQU0sT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDNUQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDdkMsSUFBSSxHQUFHLElBQUksQ0FBQzt3QkFDYixDQUFDO29CQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFSixLQUFLO2dCQUNMLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ25CLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBQSxlQUFPLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFSixNQUFNLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxjQUFjLEVBQUUsS0FBSztZQUN6QixNQUFNLGdCQUFnQixHQUFHLHFCQUFZLENBQUMseUJBQXlCLEVBQUUsQ0FBQztZQUNsRSxJQUFBLGtDQUF5QixFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBTXRDLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztZQUNwQixNQUFNLE9BQU8sR0FBRyxJQUFJLG9CQUFZLEVBQUssQ0FBQztZQUV0QyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3hCLFdBQVcsSUFBSSxDQUFDLENBQUM7Z0JBQ2pCLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN4QixXQUFXLElBQUksQ0FBQyxDQUFDO2dCQUNqQixDQUFDLENBQUMsU0FBUyxDQUFDLElBQUEsZUFBTyxFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBQSxlQUFPLEVBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLG9EQUFvRDtZQUN6RyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ3hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDWixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNmLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEIsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFBLGtDQUF5QixFQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDN0MsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtRQUV4QixNQUFNLEVBQUUsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFckQsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNiLE1BQU0sSUFBSSxHQUFhLEVBQUUsQ0FBQztZQUMxQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksd0JBQWdCLEVBQVUsQ0FBQyxDQUFDO1lBRXZELEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVoQixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlCQUF5QixFQUFFO1lBQy9CLE1BQU0sSUFBSSxHQUFhLEVBQUUsQ0FBQztZQUMxQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksd0JBQWdCLEVBQVUsQ0FBQyxDQUFDO1lBRXZELEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXJDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNoQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVyQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDakIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxzQkFBc0IsRUFBRTtZQUM1QixNQUFNLElBQUksR0FBYSxFQUFFLENBQUM7WUFDMUIsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHdCQUFnQixDQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVyRyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVyQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFckMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXhDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFCQUFxQixFQUFFO1lBQzNCLE1BQU0sSUFBSSxHQUFhLEVBQUUsQ0FBQztZQUMxQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksd0JBQWdCLEVBQVUsQ0FBQyxDQUFDO1lBRXZELEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXJDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNoQixPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFckMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFckMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUzQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDakIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtCQUFrQixFQUFFO1lBQ3hCLE1BQU0sSUFBSSxHQUFhLEVBQUUsQ0FBQztZQUMxQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksd0JBQWdCLEVBQVUsQ0FBQyxDQUFDO1lBRXZELEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXJDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNqQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUNwQixNQUFNLElBQUksR0FBYSxFQUFFLENBQUM7WUFDMUIsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHdCQUFnQixFQUFVLENBQUMsQ0FBQztZQUV2RCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7WUFDaEIsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUViLElBQUksSUFBSSxFQUFFLENBQUM7b0JBQ1YsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNoQixJQUFJLEdBQUcsS0FBSyxDQUFDO2dCQUNkLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNoQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFakMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQywyQkFBMkI7WUFFakUsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLDBCQUEwQjtZQUV0RSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRWxELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdCQUF3QixFQUFFO1lBQzlCLE1BQU0sSUFBSSxHQUFhLEVBQUUsQ0FBQztZQUMxQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksd0JBQWdCLENBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0UsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFekMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2hCLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNqQixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztJQUVKLENBQUMsQ0FBQyxDQUFDO0lBRUgsS0FBSyxDQUFDLHVEQUF1RCxFQUFFO1FBQzlELElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFFdEIsTUFBTSxHQUFHLEdBQUcsSUFBQSw0QkFBZSxFQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN4QyxNQUFNLEtBQUssR0FBRyxhQUFLLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXhDLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztZQUM1QixNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFMUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdkIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdkIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFdEIsSUFBQSx3QkFBVyxFQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUNoQixHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDakIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDakIsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEQsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2IsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILEtBQUssQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1FBRXpCLE1BQU0sRUFBRSxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUVyRCxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtZQUUzQixJQUFJLENBQUMsb0NBQW9DLEVBQUUsR0FBRyxFQUFFO2dCQUMvQyxNQUFNLFFBQVEsR0FBRyxJQUFJLHFCQUFhLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQzNDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRWpELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNmLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNmLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNmLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLDRCQUE0QixFQUFFLEdBQUcsRUFBRTtnQkFDdkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxxQkFBYSxFQUFFLENBQUM7Z0JBQ3JDLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUMzQyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUVqRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDZixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXJDLFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFO29CQUMxQixPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNyQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxDQUFDLENBQUMsQ0FBQztnQkFFSCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDZixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXJDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO2dCQUNqQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztnQkFFNUMsSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUFFLFFBQVEsR0FBRyxDQUFDLEVBQUUsUUFBUSxHQUFHLENBQUMsQ0FBQztnQkFFN0MsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLFNBQVMsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLFNBQVMsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUU5RCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVoQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3BCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDZixNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVoQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFaEMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwQixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO1lBRXBCLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7Z0JBQ2pDLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7Z0JBQzlDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7Z0JBQzVCLE1BQU0sYUFBYSxHQUFHLGFBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRTFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQWMsQ0FBQyxDQUFDO2dCQUUvQyxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUUxQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTdDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlDLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUNwRCxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO2dCQUM1QixNQUFNLGFBQWEsR0FBRyxhQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFaEQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBYyxDQUFDLENBQUM7Z0JBRS9DLE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRW5DLE1BQU0sSUFBQSxlQUFPLEVBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2xCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0MsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNuQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUMsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFO2dCQUM5QyxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO2dCQUM1QixNQUFNLGFBQWEsR0FBRyxhQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUU5RCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxFQUFjLENBQUMsQ0FBQztnQkFFL0MsRUFBRSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0MsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxLQUFLLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1lBRTlCLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUNsQixNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxHQUFHLElBQUksd0JBQWdCLEVBQVUsQ0FBQztnQkFDekMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXJDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO2dCQUN6QyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBRXhCLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUVuQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNYLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQyxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7Z0JBQ3RDLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBSSx3QkFBZ0IsRUFBVSxDQUFDO2dCQUN6QyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFckMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7Z0JBQ3pDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFFeEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRW5DLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVwQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ1osTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVwQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNYLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQyxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7Z0JBQ2hDLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBSSx3QkFBZ0IsRUFBVSxDQUFDO2dCQUN6QyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFckMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7Z0JBQ3pDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFFeEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRW5DLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVwQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVwQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNYLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQyxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7Z0JBQzVDLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBSSx3QkFBZ0IsRUFBVSxDQUFDO2dCQUN6QyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFckMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7Z0JBQ3pDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUUzQixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFFbkMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDWCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXBDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDYixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXBDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtnQkFDNUIsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO2dCQUM1QixNQUFNLENBQUMsR0FBRyxJQUFJLHdCQUFnQixFQUFVLENBQUM7Z0JBQ3pDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVyQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztnQkFDekMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztnQkFDekMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztnQkFDekMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUV4QixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNYLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDWCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQyxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7Z0JBQzdCLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBSSx3QkFBZ0IsRUFBVSxDQUFDO2dCQUV6QyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztnQkFDekMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztnQkFDekMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztnQkFDekMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUV4QixFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFckMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDWCxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNYLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0MsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO2dCQUMzQixNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxHQUFHLElBQUksd0JBQWdCLEVBQVUsQ0FBQztnQkFFekMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7Z0JBQ3pDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7Z0JBQ3pDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFFeEIsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXJDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFWCxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztnQkFDekMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVYLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNDLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtnQkFDOUIsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO2dCQUM1QixNQUFNLENBQUMsR0FBRyxJQUFJLHdCQUFnQixFQUFVLENBQUM7Z0JBRXpDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO2dCQUN6QyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO2dCQUN6QyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBRXhCLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVyQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNYLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRVgsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7Z0JBQ3pDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMzQixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNYLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUUxQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2IsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDWCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFMUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDWCxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNYLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7WUFDekMsSUFBSSxVQUE2QixDQUFDO1lBQ2xDLElBQUksYUFBZ0MsQ0FBQztZQUNyQyxNQUFNLGNBQWMsR0FBYSxFQUFFLENBQUM7WUFDcEMsTUFBTSxRQUFRO2dCQUFkO29CQUNVLHVCQUFrQixHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO29CQUNuRCxnQkFBVyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7Z0JBQ3RELENBQUM7YUFBQTtZQUNELElBQUksS0FBaUIsQ0FBQztZQUN0QixJQUFJLENBQWdELENBQUM7WUFDckQsS0FBSyxDQUFDLEdBQUcsRUFBRTtnQkFDVixVQUFVLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBWSxDQUFDLENBQUM7Z0JBQzdDLGFBQWEsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFZLENBQUMsQ0FBQztnQkFDaEQsS0FBSyxHQUFHLENBQUMsSUFBSSxRQUFRLEVBQUUsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQ3pDLEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztvQkFDekMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxDQUFDO2dCQUNELENBQUMsR0FBRyxJQUFJLG1DQUEyQixDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ3RHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxjQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUMzQixDQUFDLENBQUMsQ0FBQztZQUNILFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO2dCQUNqRCxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLENBQUMsZUFBZSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEQsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsb0NBQW9DLEVBQUUsR0FBRyxFQUFFO2dCQUMvQyxNQUFNLFNBQVMsR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNqQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMzQixTQUFTLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxNQUFNLENBQUMsZUFBZSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEQsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsMENBQTBDLEVBQUUsR0FBRyxFQUFFO2dCQUNyRCxhQUFh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