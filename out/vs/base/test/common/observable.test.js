/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/observable", "vs/base/common/observableInternal/base", "vs/base/test/common/utils"], function (require, exports, assert, event_1, observable_1, base_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoggingObservableValue = exports.LoggingObserver = void 0;
    suite('observables', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        /**
         * Reads these tests to understand how to use observables.
         */
        suite('tutorial', () => {
            test('observable + autorun', () => {
                const log = new Log();
                // This creates a variable that stores a value and whose value changes can be observed.
                // The name is only used for debugging purposes.
                // The second arg is the initial value.
                const myObservable = (0, observable_1.observableValue)('myObservable', 0);
                // This creates an autorun: It runs immediately and then again whenever any of the
                // dependencies change. Dependencies are tracked by reading observables with the `reader` parameter.
                //
                // The @description is only used for debugging purposes.
                // The autorun has to be disposed! This is very important.
                ds.add((0, observable_1.autorun)(reader => {
                    /** @description myAutorun */
                    // This code is run immediately.
                    // Use the `reader` to read observable values and track the dependency to them.
                    // If you use `observable.get()` instead of `observable.read(reader)`, you will just
                    // get the value and not subscribe to it.
                    log.log(`myAutorun.run(myObservable: ${myObservable.read(reader)})`);
                    // Now that all dependencies are tracked, the autorun is re-run whenever any of the
                    // dependencies change.
                }));
                // The autorun runs immediately
                assert.deepStrictEqual(log.getAndClearEntries(), ['myAutorun.run(myObservable: 0)']);
                // We set the observable.
                myObservable.set(1, undefined);
                // -> The autorun runs again when any read observable changed
                assert.deepStrictEqual(log.getAndClearEntries(), ['myAutorun.run(myObservable: 1)']);
                // We set the observable again.
                myObservable.set(1, undefined);
                // -> The autorun does not run again, because the observable didn't change.
                assert.deepStrictEqual(log.getAndClearEntries(), []);
                // Transactions batch autorun runs
                (0, observable_1.transaction)((tx) => {
                    myObservable.set(2, tx);
                    // No auto-run ran yet, even though the value changed!
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    myObservable.set(3, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                // Only at the end of the transaction the autorun re-runs
                assert.deepStrictEqual(log.getAndClearEntries(), ['myAutorun.run(myObservable: 3)']);
                // Note that the autorun did not see the intermediate value `2`!
            });
            test('derived + autorun', () => {
                const log = new Log();
                const observable1 = (0, observable_1.observableValue)('myObservable1', 0);
                const observable2 = (0, observable_1.observableValue)('myObservable2', 0);
                // A derived value is an observable that is derived from other observables.
                const myDerived = (0, observable_1.derived)(reader => {
                    /** @description myDerived */
                    const value1 = observable1.read(reader); // Use the reader to track dependencies.
                    const value2 = observable2.read(reader);
                    const sum = value1 + value2;
                    log.log(`myDerived.recompute: ${value1} + ${value2} = ${sum}`);
                    return sum;
                });
                // We create an autorun that reacts on changes to our derived value.
                ds.add((0, observable_1.autorun)(reader => {
                    /** @description myAutorun */
                    // Autoruns work with observable values and deriveds - in short, they work with any observable.
                    log.log(`myAutorun(myDerived: ${myDerived.read(reader)})`);
                }));
                // autorun runs immediately
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.recompute: 0 + 0 = 0",
                    "myAutorun(myDerived: 0)",
                ]);
                observable1.set(1, undefined);
                // and on changes...
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.recompute: 1 + 0 = 1",
                    "myAutorun(myDerived: 1)",
                ]);
                observable2.set(1, undefined);
                // ... of any dependency.
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.recompute: 1 + 1 = 2",
                    "myAutorun(myDerived: 2)",
                ]);
                // Now we change multiple observables in a transaction to batch process the effects.
                (0, observable_1.transaction)((tx) => {
                    observable1.set(5, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    observable2.set(5, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                // When changing multiple observables in a transaction,
                // deriveds are only recomputed on demand.
                // (Note that you cannot see the intermediate value when `obs1 == 5` and `obs2 == 1`)
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.recompute: 5 + 5 = 10",
                    "myAutorun(myDerived: 10)",
                ]);
                (0, observable_1.transaction)((tx) => {
                    observable1.set(6, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    observable2.set(4, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                // Now the autorun didn't run again, because its dependency changed from 10 to 10 (= no change).
                assert.deepStrictEqual(log.getAndClearEntries(), (["myDerived.recompute: 6 + 4 = 10"]));
            });
            test('read during transaction', () => {
                const log = new Log();
                const observable1 = (0, observable_1.observableValue)('myObservable1', 0);
                const observable2 = (0, observable_1.observableValue)('myObservable2', 0);
                const myDerived = (0, observable_1.derived)((reader) => {
                    /** @description myDerived */
                    const value1 = observable1.read(reader);
                    const value2 = observable2.read(reader);
                    const sum = value1 + value2;
                    log.log(`myDerived.recompute: ${value1} + ${value2} = ${sum}`);
                    return sum;
                });
                ds.add((0, observable_1.autorun)(reader => {
                    /** @description myAutorun */
                    log.log(`myAutorun(myDerived: ${myDerived.read(reader)})`);
                }));
                // autorun runs immediately
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.recompute: 0 + 0 = 0",
                    "myAutorun(myDerived: 0)",
                ]);
                (0, observable_1.transaction)((tx) => {
                    observable1.set(-10, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    myDerived.get(); // This forces a (sync) recomputation of the current value!
                    assert.deepStrictEqual(log.getAndClearEntries(), (["myDerived.recompute: -10 + 0 = -10"]));
                    // This means, that even in transactions you can assume that all values you can read with `get` and `read` are up-to-date.
                    // Read these values just might cause additional (potentially unneeded) recomputations.
                    observable2.set(10, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                // This autorun runs again, because its dependency changed from 0 to -10 and then back to 0.
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.recompute: -10 + 10 = 0",
                    "myAutorun(myDerived: 0)",
                ]);
            });
            test('get without observers', () => {
                const log = new Log();
                const observable1 = (0, observable_1.observableValue)('myObservableValue1', 0);
                // We set up some computeds.
                const computed1 = (0, observable_1.derived)((reader) => {
                    /** @description computed */
                    const value1 = observable1.read(reader);
                    const result = value1 % 3;
                    log.log(`recompute1: ${value1} % 3 = ${result}`);
                    return result;
                });
                const computed2 = (0, observable_1.derived)((reader) => {
                    /** @description computed */
                    const value1 = computed1.read(reader);
                    const result = value1 * 2;
                    log.log(`recompute2: ${value1} * 2 = ${result}`);
                    return result;
                });
                const computed3 = (0, observable_1.derived)((reader) => {
                    /** @description computed */
                    const value1 = computed1.read(reader);
                    const result = value1 * 3;
                    log.log(`recompute3: ${value1} * 3 = ${result}`);
                    return result;
                });
                const computedSum = (0, observable_1.derived)((reader) => {
                    /** @description computed */
                    const value1 = computed2.read(reader);
                    const value2 = computed3.read(reader);
                    const result = value1 + value2;
                    log.log(`recompute4: ${value1} + ${value2} = ${result}`);
                    return result;
                });
                assert.deepStrictEqual(log.getAndClearEntries(), []);
                observable1.set(1, undefined);
                assert.deepStrictEqual(log.getAndClearEntries(), []);
                // And now read the computed that dependens on all the others.
                log.log(`value: ${computedSum.get()}`);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'recompute1: 1 % 3 = 1',
                    'recompute2: 1 * 2 = 2',
                    'recompute3: 1 * 3 = 3',
                    'recompute4: 2 + 3 = 5',
                    'value: 5',
                ]);
                log.log(`value: ${computedSum.get()}`);
                // Because there are no observers, the derived values are not cached (!), but computed from scratch.
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'recompute1: 1 % 3 = 1',
                    'recompute2: 1 * 2 = 2',
                    'recompute3: 1 * 3 = 3',
                    'recompute4: 2 + 3 = 5',
                    'value: 5',
                ]);
                const disposable = (0, observable_1.keepObserved)(computedSum); // Use keepObserved to keep the cache.
                // You can also use `computedSum.keepObserved(store)` for an inline experience.
                log.log(`value: ${computedSum.get()}`);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'recompute1: 1 % 3 = 1',
                    'recompute2: 1 * 2 = 2',
                    'recompute3: 1 * 3 = 3',
                    'recompute4: 2 + 3 = 5',
                    'value: 5',
                ]);
                log.log(`value: ${computedSum.get()}`);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'value: 5',
                ]);
                // Tada, no recomputations!
                observable1.set(2, undefined);
                // The keepObserved does not force deriveds to be recomputed! They are still lazy.
                assert.deepStrictEqual(log.getAndClearEntries(), ([]));
                log.log(`value: ${computedSum.get()}`);
                // Those deriveds are recomputed on demand, i.e. when someone reads them.
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "recompute1: 2 % 3 = 2",
                    "recompute2: 2 * 2 = 4",
                    "recompute3: 2 * 3 = 6",
                    "recompute4: 4 + 6 = 10",
                    "value: 10",
                ]);
                log.log(`value: ${computedSum.get()}`);
                // ... and then cached again
                assert.deepStrictEqual(log.getAndClearEntries(), (["value: 10"]));
                disposable.dispose(); // Don't forget to dispose the keepAlive to prevent memory leaks!
                log.log(`value: ${computedSum.get()}`);
                // Which disables the cache again
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "recompute1: 2 % 3 = 2",
                    "recompute2: 2 * 2 = 4",
                    "recompute3: 2 * 3 = 6",
                    "recompute4: 4 + 6 = 10",
                    "value: 10",
                ]);
                log.log(`value: ${computedSum.get()}`);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "recompute1: 2 % 3 = 2",
                    "recompute2: 2 * 2 = 4",
                    "recompute3: 2 * 3 = 6",
                    "recompute4: 4 + 6 = 10",
                    "value: 10",
                ]);
                // Why don't we just always keep the cache alive?
                // This is because in order to keep the cache alive, we have to keep our subscriptions to our dependencies alive,
                // which could cause memory-leaks.
                // So instead, when the last observer of a derived is disposed, we dispose our subscriptions to our dependencies.
                // `keepObserved` just prevents this from happening.
            });
            // That is the end of the tutorial.
            // There are lots of utilities you can explore now, like `observableFromEvent`, `Event.fromObservableLight`,
            // autorunWithStore, observableWithStore and so on.
        });
        test('topological order', () => {
            const log = new Log();
            const myObservable1 = (0, observable_1.observableValue)('myObservable1', 0);
            const myObservable2 = (0, observable_1.observableValue)('myObservable2', 0);
            const myComputed1 = (0, observable_1.derived)(reader => {
                /** @description myComputed1 */
                const value1 = myObservable1.read(reader);
                const value2 = myObservable2.read(reader);
                const sum = value1 + value2;
                log.log(`myComputed1.recompute(myObservable1: ${value1} + myObservable2: ${value2} = ${sum})`);
                return sum;
            });
            const myComputed2 = (0, observable_1.derived)(reader => {
                /** @description myComputed2 */
                const value1 = myComputed1.read(reader);
                const value2 = myObservable1.read(reader);
                const value3 = myObservable2.read(reader);
                const sum = value1 + value2 + value3;
                log.log(`myComputed2.recompute(myComputed1: ${value1} + myObservable1: ${value2} + myObservable2: ${value3} = ${sum})`);
                return sum;
            });
            const myComputed3 = (0, observable_1.derived)(reader => {
                /** @description myComputed3 */
                const value1 = myComputed2.read(reader);
                const value2 = myObservable1.read(reader);
                const value3 = myObservable2.read(reader);
                const sum = value1 + value2 + value3;
                log.log(`myComputed3.recompute(myComputed2: ${value1} + myObservable1: ${value2} + myObservable2: ${value3} = ${sum})`);
                return sum;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                log.log(`myAutorun.run(myComputed3: ${myComputed3.read(reader)})`);
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myComputed1.recompute(myObservable1: 0 + myObservable2: 0 = 0)",
                "myComputed2.recompute(myComputed1: 0 + myObservable1: 0 + myObservable2: 0 = 0)",
                "myComputed3.recompute(myComputed2: 0 + myObservable1: 0 + myObservable2: 0 = 0)",
                "myAutorun.run(myComputed3: 0)",
            ]);
            myObservable1.set(1, undefined);
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myComputed1.recompute(myObservable1: 1 + myObservable2: 0 = 1)",
                "myComputed2.recompute(myComputed1: 1 + myObservable1: 1 + myObservable2: 0 = 2)",
                "myComputed3.recompute(myComputed2: 2 + myObservable1: 1 + myObservable2: 0 = 3)",
                "myAutorun.run(myComputed3: 3)",
            ]);
            (0, observable_1.transaction)((tx) => {
                myObservable1.set(2, tx);
                myComputed2.get();
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myComputed1.recompute(myObservable1: 2 + myObservable2: 0 = 2)",
                    "myComputed2.recompute(myComputed1: 2 + myObservable1: 2 + myObservable2: 0 = 4)",
                ]);
                myObservable1.set(3, tx);
                myComputed2.get();
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myComputed1.recompute(myObservable1: 3 + myObservable2: 0 = 3)",
                    "myComputed2.recompute(myComputed1: 3 + myObservable1: 3 + myObservable2: 0 = 6)",
                ]);
            });
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myComputed3.recompute(myComputed2: 6 + myObservable1: 3 + myObservable2: 0 = 9)",
                "myAutorun.run(myComputed3: 9)",
            ]);
        });
        suite('from event', () => {
            function init() {
                const log = new Log();
                let value = 0;
                const eventEmitter = new event_1.Emitter();
                let id = 0;
                const observable = (0, observable_1.observableFromEvent)((handler) => {
                    const curId = id++;
                    log.log(`subscribed handler ${curId}`);
                    const disposable = eventEmitter.event(handler);
                    return {
                        dispose: () => {
                            log.log(`unsubscribed handler ${curId}`);
                            disposable.dispose();
                        },
                    };
                }, () => {
                    log.log(`compute value ${value}`);
                    return value;
                });
                return {
                    log,
                    setValue: (newValue) => {
                        value = newValue;
                        eventEmitter.fire();
                    },
                    observable,
                };
            }
            test('Handle undefined', () => {
                const { log, setValue, observable } = init();
                setValue(undefined);
                const autorunDisposable = (0, observable_1.autorun)(reader => {
                    /** @description MyAutorun */
                    observable.read(reader);
                    log.log(`autorun, value: ${observable.read(reader)}`);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "subscribed handler 0",
                    "compute value undefined",
                    "autorun, value: undefined",
                ]);
                setValue(1);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "compute value 1",
                    "autorun, value: 1"
                ]);
                autorunDisposable.dispose();
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "unsubscribed handler 0"
                ]);
            });
            test('basic', () => {
                const { log, setValue, observable } = init();
                const shouldReadObservable = (0, observable_1.observableValue)('shouldReadObservable', true);
                const autorunDisposable = (0, observable_1.autorun)(reader => {
                    /** @description MyAutorun */
                    if (shouldReadObservable.read(reader)) {
                        observable.read(reader);
                        log.log(`autorun, should read: true, value: ${observable.read(reader)}`);
                    }
                    else {
                        log.log(`autorun, should read: false`);
                    }
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'subscribed handler 0',
                    'compute value 0',
                    'autorun, should read: true, value: 0',
                ]);
                // Cached get
                log.log(`get value: ${observable.get()}`);
                assert.deepStrictEqual(log.getAndClearEntries(), ['get value: 0']);
                setValue(1);
                // Trigger autorun, no unsub/sub
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'compute value 1',
                    'autorun, should read: true, value: 1',
                ]);
                // Unsubscribe when not read
                shouldReadObservable.set(false, undefined);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'autorun, should read: false',
                    'unsubscribed handler 0',
                ]);
                shouldReadObservable.set(true, undefined);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'subscribed handler 1',
                    'compute value 1',
                    'autorun, should read: true, value: 1',
                ]);
                autorunDisposable.dispose();
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'unsubscribed handler 1',
                ]);
            });
            test('get without observers', () => {
                const { log, observable } = init();
                assert.deepStrictEqual(log.getAndClearEntries(), []);
                log.log(`get value: ${observable.get()}`);
                // Not cached or subscribed
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'compute value 0',
                    'get value: 0',
                ]);
                log.log(`get value: ${observable.get()}`);
                // Still not cached or subscribed
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'compute value 0',
                    'get value: 0',
                ]);
            });
        });
        test('reading derived in transaction unsubscribes unnecessary observables', () => {
            const log = new Log();
            const shouldReadObservable = (0, observable_1.observableValue)('shouldReadMyObs1', true);
            const myObs1 = new LoggingObservableValue('myObs1', 0, log);
            const myComputed = (0, observable_1.derived)(reader => {
                /** @description myComputed */
                log.log('myComputed.recompute');
                if (shouldReadObservable.read(reader)) {
                    return myObs1.read(reader);
                }
                return 1;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const value = myComputed.read(reader);
                log.log(`myAutorun: ${value}`);
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myComputed.recompute",
                "myObs1.firstObserverAdded",
                "myObs1.get",
                "myAutorun: 0",
            ]);
            (0, observable_1.transaction)(tx => {
                myObs1.set(1, tx);
                assert.deepStrictEqual(log.getAndClearEntries(), (["myObs1.set (value 1)"]));
                shouldReadObservable.set(false, tx);
                assert.deepStrictEqual(log.getAndClearEntries(), ([]));
                myComputed.get();
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myComputed.recompute",
                    "myObs1.lastObserverRemoved",
                ]);
            });
            assert.deepStrictEqual(log.getAndClearEntries(), (["myAutorun: 1"]));
        });
        test('avoid recomputation of deriveds that are no longer read', () => {
            const log = new Log();
            const myObsShouldRead = new LoggingObservableValue('myObsShouldRead', true, log);
            const myObs1 = new LoggingObservableValue('myObs1', 0, log);
            const myComputed1 = (0, observable_1.derived)(reader => {
                /** @description myComputed1 */
                const myObs1Val = myObs1.read(reader);
                const result = myObs1Val % 10;
                log.log(`myComputed1(myObs1: ${myObs1Val}): Computed ${result}`);
                return myObs1Val;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const shouldRead = myObsShouldRead.read(reader);
                if (shouldRead) {
                    const v = myComputed1.read(reader);
                    log.log(`myAutorun(shouldRead: true, myComputed1: ${v}): run`);
                }
                else {
                    log.log(`myAutorun(shouldRead: false): run`);
                }
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObsShouldRead.firstObserverAdded",
                "myObsShouldRead.get",
                "myObs1.firstObserverAdded",
                "myObs1.get",
                "myComputed1(myObs1: 0): Computed 0",
                "myAutorun(shouldRead: true, myComputed1: 0): run",
            ]);
            (0, observable_1.transaction)(tx => {
                myObsShouldRead.set(false, tx);
                myObs1.set(1, tx);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObsShouldRead.set (value false)",
                    "myObs1.set (value 1)",
                ]);
            });
            // myComputed1 should not be recomputed here, even though its dependency myObs1 changed!
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObsShouldRead.get",
                "myAutorun(shouldRead: false): run",
                "myObs1.lastObserverRemoved",
            ]);
            (0, observable_1.transaction)(tx => {
                myObsShouldRead.set(true, tx);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObsShouldRead.set (value true)",
                ]);
            });
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObsShouldRead.get",
                "myObs1.firstObserverAdded",
                "myObs1.get",
                "myComputed1(myObs1: 1): Computed 1",
                "myAutorun(shouldRead: true, myComputed1: 1): run",
            ]);
        });
        suite('autorun rerun on neutral change', () => {
            test('autorun reruns on neutral observable double change', () => {
                const log = new Log();
                const myObservable = (0, observable_1.observableValue)('myObservable', 0);
                ds.add((0, observable_1.autorun)(reader => {
                    /** @description myAutorun */
                    log.log(`myAutorun.run(myObservable: ${myObservable.read(reader)})`);
                }));
                assert.deepStrictEqual(log.getAndClearEntries(), ['myAutorun.run(myObservable: 0)']);
                (0, observable_1.transaction)((tx) => {
                    myObservable.set(2, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    myObservable.set(0, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), ['myAutorun.run(myObservable: 0)']);
            });
            test('autorun does not rerun on indirect neutral observable double change', () => {
                const log = new Log();
                const myObservable = (0, observable_1.observableValue)('myObservable', 0);
                const myDerived = (0, observable_1.derived)(reader => {
                    /** @description myDerived */
                    const val = myObservable.read(reader);
                    log.log(`myDerived.read(myObservable: ${val})`);
                    return val;
                });
                ds.add((0, observable_1.autorun)(reader => {
                    /** @description myAutorun */
                    log.log(`myAutorun.run(myDerived: ${myDerived.read(reader)})`);
                }));
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.read(myObservable: 0)",
                    "myAutorun.run(myDerived: 0)"
                ]);
                (0, observable_1.transaction)((tx) => {
                    myObservable.set(2, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    myObservable.set(0, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.read(myObservable: 0)"
                ]);
            });
            test('autorun reruns on indirect neutral observable double change when changes propagate', () => {
                const log = new Log();
                const myObservable = (0, observable_1.observableValue)('myObservable', 0);
                const myDerived = (0, observable_1.derived)(reader => {
                    /** @description myDerived */
                    const val = myObservable.read(reader);
                    log.log(`myDerived.read(myObservable: ${val})`);
                    return val;
                });
                ds.add((0, observable_1.autorun)(reader => {
                    /** @description myAutorun */
                    log.log(`myAutorun.run(myDerived: ${myDerived.read(reader)})`);
                }));
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.read(myObservable: 0)",
                    "myAutorun.run(myDerived: 0)"
                ]);
                (0, observable_1.transaction)((tx) => {
                    myObservable.set(2, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                    myDerived.get(); // This marks the auto-run as changed
                    assert.deepStrictEqual(log.getAndClearEntries(), [
                        "myDerived.read(myObservable: 2)"
                    ]);
                    myObservable.set(0, tx);
                    assert.deepStrictEqual(log.getAndClearEntries(), []);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myDerived.read(myObservable: 0)",
                    "myAutorun.run(myDerived: 0)"
                ]);
            });
        });
        test('self-disposing autorun', () => {
            const log = new Log();
            const observable1 = new LoggingObservableValue('myObservable1', 0, log);
            const myObservable2 = new LoggingObservableValue('myObservable2', 0, log);
            const myObservable3 = new LoggingObservableValue('myObservable3', 0, log);
            const d = (0, observable_1.autorun)(reader => {
                /** @description autorun */
                if (observable1.read(reader) >= 2) {
                    assert.deepStrictEqual(log.getAndClearEntries(), [
                        "myObservable1.set (value 2)",
                        "myObservable1.get",
                    ]);
                    myObservable2.read(reader);
                    // First time this observable is read
                    assert.deepStrictEqual(log.getAndClearEntries(), [
                        "myObservable2.firstObserverAdded",
                        "myObservable2.get",
                    ]);
                    d.dispose();
                    // Disposing removes all observers
                    assert.deepStrictEqual(log.getAndClearEntries(), [
                        "myObservable1.lastObserverRemoved",
                        "myObservable2.lastObserverRemoved",
                    ]);
                    myObservable3.read(reader);
                    // This does not subscribe the observable, because the autorun is disposed
                    assert.deepStrictEqual(log.getAndClearEntries(), [
                        "myObservable3.get",
                    ]);
                }
            });
            assert.deepStrictEqual(log.getAndClearEntries(), [
                'myObservable1.firstObserverAdded',
                'myObservable1.get',
            ]);
            observable1.set(1, undefined);
            assert.deepStrictEqual(log.getAndClearEntries(), [
                'myObservable1.set (value 1)',
                'myObservable1.get',
            ]);
            observable1.set(2, undefined);
            // See asserts in the autorun
            assert.deepStrictEqual(log.getAndClearEntries(), ([]));
        });
        test('changing observables in endUpdate', () => {
            const log = new Log();
            const myObservable1 = new LoggingObservableValue('myObservable1', 0, log);
            const myObservable2 = new LoggingObservableValue('myObservable2', 0, log);
            const myDerived1 = (0, observable_1.derived)(reader => {
                /** @description myDerived1 */
                const val = myObservable1.read(reader);
                log.log(`myDerived1.read(myObservable: ${val})`);
                return val;
            });
            const myDerived2 = (0, observable_1.derived)(reader => {
                /** @description myDerived2 */
                const val = myObservable2.read(reader);
                if (val === 1) {
                    myDerived1.read(reader);
                }
                log.log(`myDerived2.read(myObservable: ${val})`);
                return val;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const myDerived1Val = myDerived1.read(reader);
                const myDerived2Val = myDerived2.read(reader);
                log.log(`myAutorun.run(myDerived1: ${myDerived1Val}, myDerived2: ${myDerived2Val})`);
            }));
            (0, observable_1.transaction)(tx => {
                myObservable2.set(1, tx);
                // end update of this observable will trigger endUpdate of myDerived1 and
                // the autorun and the autorun will add myDerived2 as observer to myDerived1
                myObservable1.set(1, tx);
            });
        });
        test('set dependency in derived', () => {
            const log = new Log();
            const myObservable = new LoggingObservableValue('myObservable', 0, log);
            const myComputed = (0, observable_1.derived)(reader => {
                /** @description myComputed */
                let value = myObservable.read(reader);
                const origValue = value;
                log.log(`myComputed(myObservable: ${origValue}): start computing`);
                if (value % 3 !== 0) {
                    value++;
                    myObservable.set(value, undefined);
                }
                log.log(`myComputed(myObservable: ${origValue}): finished computing`);
                return value;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const value = myComputed.read(reader);
                log.log(`myAutorun(myComputed: ${value})`);
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable.firstObserverAdded",
                "myObservable.get",
                "myComputed(myObservable: 0): start computing",
                "myComputed(myObservable: 0): finished computing",
                "myAutorun(myComputed: 0)"
            ]);
            myObservable.set(1, undefined);
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable.set (value 1)",
                "myObservable.get",
                "myComputed(myObservable: 1): start computing",
                "myObservable.set (value 2)",
                "myComputed(myObservable: 1): finished computing",
                "myObservable.get",
                "myComputed(myObservable: 2): start computing",
                "myObservable.set (value 3)",
                "myComputed(myObservable: 2): finished computing",
                "myObservable.get",
                "myComputed(myObservable: 3): start computing",
                "myComputed(myObservable: 3): finished computing",
                "myAutorun(myComputed: 3)",
            ]);
        });
        test('set dependency in autorun', () => {
            const log = new Log();
            const myObservable = new LoggingObservableValue('myObservable', 0, log);
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const value = myObservable.read(reader);
                log.log(`myAutorun(myObservable: ${value}): start`);
                if (value !== 0 && value < 4) {
                    myObservable.set(value + 1, undefined);
                }
                log.log(`myAutorun(myObservable: ${value}): end`);
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable.firstObserverAdded",
                "myObservable.get",
                "myAutorun(myObservable: 0): start",
                "myAutorun(myObservable: 0): end",
            ]);
            myObservable.set(1, undefined);
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable.set (value 1)",
                "myObservable.get",
                "myAutorun(myObservable: 1): start",
                "myObservable.set (value 2)",
                "myAutorun(myObservable: 1): end",
                "myObservable.get",
                "myAutorun(myObservable: 2): start",
                "myObservable.set (value 3)",
                "myAutorun(myObservable: 2): end",
                "myObservable.get",
                "myAutorun(myObservable: 3): start",
                "myObservable.set (value 4)",
                "myAutorun(myObservable: 3): end",
                "myObservable.get",
                "myAutorun(myObservable: 4): start",
                "myAutorun(myObservable: 4): end",
            ]);
        });
        test('get in transaction between sets', () => {
            const log = new Log();
            const myObservable = new LoggingObservableValue('myObservable', 0, log);
            const myDerived1 = (0, observable_1.derived)(reader => {
                /** @description myDerived1 */
                const value = myObservable.read(reader);
                log.log(`myDerived1(myObservable: ${value}): start computing`);
                return value;
            });
            const myDerived2 = (0, observable_1.derived)(reader => {
                /** @description myDerived2 */
                const value = myDerived1.read(reader);
                log.log(`myDerived2(myDerived1: ${value}): start computing`);
                return value;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const value = myDerived2.read(reader);
                log.log(`myAutorun(myDerived2: ${value})`);
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable.firstObserverAdded",
                "myObservable.get",
                "myDerived1(myObservable: 0): start computing",
                "myDerived2(myDerived1: 0): start computing",
                "myAutorun(myDerived2: 0)",
            ]);
            (0, observable_1.transaction)(tx => {
                myObservable.set(1, tx);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObservable.set (value 1)",
                ]);
                myDerived2.get();
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObservable.get",
                    "myDerived1(myObservable: 1): start computing",
                    "myDerived2(myDerived1: 1): start computing",
                ]);
                myObservable.set(2, tx);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObservable.set (value 2)",
                ]);
            });
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable.get",
                "myDerived1(myObservable: 2): start computing",
                "myDerived2(myDerived1: 2): start computing",
                "myAutorun(myDerived2: 2)",
            ]);
        });
        test('bug: Dont reset states', () => {
            const log = new Log();
            const myObservable1 = new LoggingObservableValue('myObservable1', 0, log);
            const myObservable2 = new LoggingObservableValue('myObservable2', 0, log);
            const myDerived2 = (0, observable_1.derived)(reader => {
                /** @description myDerived2 */
                const val = myObservable2.read(reader);
                log.log(`myDerived2.computed(myObservable2: ${val})`);
                return val % 10;
            });
            const myDerived3 = (0, observable_1.derived)(reader => {
                /** @description myDerived3 */
                const val1 = myObservable1.read(reader);
                const val2 = myDerived2.read(reader);
                log.log(`myDerived3.computed(myDerived1: ${val1}, myDerived2: ${val2})`);
                return `${val1} + ${val2}`;
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun */
                const val = myDerived3.read(reader);
                log.log(`myAutorun(myDerived3: ${val})`);
            }));
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable1.firstObserverAdded",
                "myObservable1.get",
                "myObservable2.firstObserverAdded",
                "myObservable2.get",
                "myDerived2.computed(myObservable2: 0)",
                "myDerived3.computed(myDerived1: 0, myDerived2: 0)",
                "myAutorun(myDerived3: 0 + 0)",
            ]);
            (0, observable_1.transaction)(tx => {
                myObservable1.set(1, tx); // Mark myDerived 3 as stale
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObservable1.set (value 1)",
                ]);
                myObservable2.set(10, tx); // This is a non-change. myDerived3 should not be marked as possibly-depedency-changed!
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    "myObservable2.set (value 10)",
                ]);
            });
            assert.deepStrictEqual(log.getAndClearEntries(), [
                "myObservable1.get",
                "myObservable2.get",
                "myDerived2.computed(myObservable2: 10)",
                'myDerived3.computed(myDerived1: 1, myDerived2: 0)',
                'myAutorun(myDerived3: 1 + 0)',
            ]);
        });
        test('bug: Add observable in endUpdate', () => {
            const myObservable1 = (0, observable_1.observableValue)('myObservable1', 0);
            const myObservable2 = (0, observable_1.observableValue)('myObservable2', 0);
            const myDerived1 = (0, observable_1.derived)(reader => {
                /** @description myDerived1 */
                return myObservable1.read(reader);
            });
            const myDerived2 = (0, observable_1.derived)(reader => {
                /** @description myDerived2 */
                return myObservable2.read(reader);
            });
            const myDerivedA1 = (0, observable_1.derived)(reader => /** @description myDerivedA1 */ {
                const d1 = myDerived1.read(reader);
                if (d1 === 1) {
                    // This adds an observer while myDerived is still in update mode.
                    // When myDerived exits update mode, the observer shouldn't receive
                    // more endUpdate than beginUpdate calls.
                    myDerived2.read(reader);
                }
            });
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun1 */
                myDerivedA1.read(reader);
            }));
            ds.add((0, observable_1.autorun)(reader => {
                /** @description myAutorun2 */
                myDerived2.read(reader);
            }));
            (0, observable_1.transaction)(tx => {
                myObservable1.set(1, tx);
                myObservable2.set(1, tx);
            });
        });
        test('bug: fromObservableLight doesnt subscribe', () => {
            const log = new Log();
            const myObservable = new LoggingObservableValue('myObservable', 0, log);
            const myDerived = (0, observable_1.derived)(reader => /** @description myDerived */ {
                const val = myObservable.read(reader);
                log.log(`myDerived.computed(myObservable2: ${val})`);
                return val % 10;
            });
            const e = event_1.Event.fromObservableLight(myDerived);
            log.log('event created');
            e(() => {
                log.log('event fired');
            });
            myObservable.set(1, undefined);
            assert.deepStrictEqual(log.getAndClearEntries(), [
                'event created',
                'myObservable.firstObserverAdded',
                'myObservable.get',
                'myDerived.computed(myObservable2: 0)',
                'myObservable.set (value 1)',
                'myObservable.get',
                'myDerived.computed(myObservable2: 1)',
                'event fired',
            ]);
        });
        test('dont run autorun after dispose', () => {
            const log = new Log();
            const myObservable = new LoggingObservableValue('myObservable', 0, log);
            const d = (0, observable_1.autorun)(reader => {
                /** @description update */
                const v = myObservable.read(reader);
                log.log('autorun, myObservable:' + v);
            });
            (0, observable_1.transaction)(tx => {
                myObservable.set(1, tx);
                d.dispose();
            });
            assert.deepStrictEqual(log.getAndClearEntries(), [
                'myObservable.firstObserverAdded',
                'myObservable.get',
                'autorun, myObservable:0',
                'myObservable.set (value 1)',
                'myObservable.lastObserverRemoved',
            ]);
        });
        suite('waitForState', () => {
            test('resolve', async () => {
                const log = new Log();
                const myObservable = new LoggingObservableValue('myObservable', { state: 'initializing' }, log);
                const p = (0, observable_1.waitForState)(myObservable, p => p.state === 'ready', p => p.state === 'error').then(r => {
                    log.log(`resolved ${JSON.stringify(r)}`);
                }, (err) => {
                    log.log(`rejected ${JSON.stringify(err)}`);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'myObservable.firstObserverAdded',
                    'myObservable.get',
                ]);
                myObservable.set({ state: 'ready' }, undefined);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'myObservable.set (value [object Object])',
                    'myObservable.get',
                    'myObservable.lastObserverRemoved',
                ]);
                await p;
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'resolved {\"state\":\"ready\"}',
                ]);
            });
            test('resolveImmediate', async () => {
                const log = new Log();
                const myObservable = new LoggingObservableValue('myObservable', { state: 'ready' }, log);
                const p = (0, observable_1.waitForState)(myObservable, p => p.state === 'ready', p => p.state === 'error').then(r => {
                    log.log(`resolved ${JSON.stringify(r)}`);
                }, (err) => {
                    log.log(`rejected ${JSON.stringify(err)}`);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'myObservable.firstObserverAdded',
                    'myObservable.get',
                    'myObservable.lastObserverRemoved',
                ]);
                myObservable.set({ state: 'error' }, undefined);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'myObservable.set (value [object Object])',
                ]);
                await p;
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'resolved {\"state\":\"ready\"}',
                ]);
            });
            test('reject', async () => {
                const log = new Log();
                const myObservable = new LoggingObservableValue('myObservable', { state: 'initializing' }, log);
                const p = (0, observable_1.waitForState)(myObservable, p => p.state === 'ready', p => p.state === 'error').then(r => {
                    log.log(`resolved ${JSON.stringify(r)}`);
                }, (err) => {
                    log.log(`rejected ${JSON.stringify(err)}`);
                });
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'myObservable.firstObserverAdded',
                    'myObservable.get',
                ]);
                myObservable.set({ state: 'error' }, undefined);
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'myObservable.set (value [object Object])',
                    'myObservable.get',
                    'myObservable.lastObserverRemoved',
                ]);
                await p;
                assert.deepStrictEqual(log.getAndClearEntries(), [
                    'rejected {\"state\":\"error\"}'
                ]);
            });
        });
    });
    class LoggingObserver {
        constructor(debugName, log) {
            this.debugName = debugName;
            this.log = log;
            this.count = 0;
        }
        beginUpdate(observable) {
            this.count++;
            this.log.log(`${this.debugName}.beginUpdate (count ${this.count})`);
        }
        endUpdate(observable) {
            this.log.log(`${this.debugName}.endUpdate (count ${this.count})`);
            this.count--;
        }
        handleChange(observable, change) {
            this.log.log(`${this.debugName}.handleChange (count ${this.count})`);
        }
        handlePossibleChange(observable) {
            this.log.log(`${this.debugName}.handlePossibleChange`);
        }
    }
    exports.LoggingObserver = LoggingObserver;
    class LoggingObservableValue extends base_1.BaseObservable {
        constructor(debugName, initialValue, log) {
            super();
            this.debugName = debugName;
            this.log = log;
            this.value = initialValue;
        }
        onFirstObserverAdded() {
            this.log.log(`${this.debugName}.firstObserverAdded`);
        }
        onLastObserverRemoved() {
            this.log.log(`${this.debugName}.lastObserverRemoved`);
        }
        get() {
            this.log.log(`${this.debugName}.get`);
            return this.value;
        }
        set(value, tx, change) {
            if (this.value === value) {
                return;
            }
            if (!tx) {
                (0, observable_1.transaction)((tx) => {
                    this.set(value, tx, change);
                }, () => `Setting ${this.debugName}`);
                return;
            }
            this.log.log(`${this.debugName}.set (value ${value})`);
            this.value = value;
            for (const observer of this.observers) {
                tx.updateObserver(observer, this);
                observer.handleChange(this, change);
            }
        }
        toString() {
            return `${this.debugName}: ${this.value}`;
        }
    }
    exports.LoggingObservableValue = LoggingObservableValue;
    class Log {
        constructor() {
            this.entries = [];
        }
        log(message) {
            this.entries.push(message);
        }
        getAndClearEntries() {
            const entries = [...this.entries];
            this.entries.length = 0;
            return entries;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL29ic2VydmFibGUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsS0FBSyxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7UUFDekIsTUFBTSxFQUFFLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXJEOztXQUVHO1FBQ0gsS0FBSyxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7WUFDdEIsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtnQkFDakMsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDdEIsdUZBQXVGO2dCQUN2RixnREFBZ0Q7Z0JBQ2hELHVDQUF1QztnQkFDdkMsTUFBTSxZQUFZLEdBQUcsSUFBQSw0QkFBZSxFQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFeEQsa0ZBQWtGO2dCQUNsRixvR0FBb0c7Z0JBQ3BHLEVBQUU7Z0JBQ0Ysd0RBQXdEO2dCQUN4RCwwREFBMEQ7Z0JBQzFELEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBQSxvQkFBTyxFQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUN2Qiw2QkFBNkI7b0JBRTdCLGdDQUFnQztvQkFFaEMsK0VBQStFO29CQUMvRSxvRkFBb0Y7b0JBQ3BGLHlDQUF5QztvQkFDekMsR0FBRyxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBRXJFLG1GQUFtRjtvQkFDbkYsdUJBQXVCO2dCQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNKLCtCQUErQjtnQkFDL0IsTUFBTSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsa0JB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