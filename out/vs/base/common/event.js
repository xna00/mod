/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/stopwatch"], function (require, exports, errors_1, functional_1, lifecycle_1, linkedList_1, stopwatch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Relay = exports.EventBufferer = exports.DynamicListEventMultiplexer = exports.EventMultiplexer = exports.MicrotaskEmitter = exports.DebounceEmitter = exports.PauseableEmitter = exports.AsyncEmitter = exports.createEventDeliveryQueue = exports.Emitter = exports.EventProfiling = exports.Event = void 0;
    exports.setGlobalLeakWarningThreshold = setGlobalLeakWarningThreshold;
    // -----------------------------------------------------------------------------------------------------------------------
    // Uncomment the next line to print warnings whenever a listener is GC'ed without having been disposed. This is a LEAK.
    // -----------------------------------------------------------------------------------------------------------------------
    const _enableListenerGCedWarning = false;
    // -----------------------------------------------------------------------------------------------------------------------
    // Uncomment the next line to print warnings whenever an emitter with listeners is disposed. That is a sign of code smell.
    // -----------------------------------------------------------------------------------------------------------------------
    const _enableDisposeWithListenerWarning = false;
    // -----------------------------------------------------------------------------------------------------------------------
    // Uncomment the next line to print warnings whenever a snapshotted event is used repeatedly without cleanup.
    // See https://github.com/microsoft/vscode/issues/142851
    // -----------------------------------------------------------------------------------------------------------------------
    const _enableSnapshotPotentialLeakWarning = false;
    var Event;
    (function (Event) {
        Event.None = () => lifecycle_1.Disposable.None;
        function _addLeakageTraceLogic(options) {
            if (_enableSnapshotPotentialLeakWarning) {
                const { onDidAddListener: origListenerDidAdd } = options;
                const stack = Stacktrace.create();
                let count = 0;
                options.onDidAddListener = () => {
                    if (++count === 2) {
                        console.warn('snapshotted emitter LIKELY used public and SHOULD HAVE BEEN created with DisposableStore. snapshotted here');
                        stack.print();
                    }
                    origListenerDidAdd?.();
                };
            }
        }
        /**
         * Given an event, returns another event which debounces calls and defers the listeners to a later task via a shared
         * `setTimeout`. The event is converted into a signal (`Event<void>`) to avoid additional object creation as a
         * result of merging events and to try prevent race conditions that could arise when using related deferred and
         * non-deferred events.
         *
         * This is useful for deferring non-critical work (eg. general UI updates) to ensure it does not block critical work
         * (eg. latency of keypress to text rendered).
         *
         * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
         * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
         * returned event causes this utility to leak a listener on the original event.
         *
         * @param event The event source for the new event.
         * @param disposable A disposable store to add the new EventEmitter to.
         */
        function defer(event, disposable) {
            return debounce(event, () => void 0, 0, undefined, true, undefined, disposable);
        }
        Event.defer = defer;
        /**
         * Given an event, returns another event which only fires once.
         *
         * @param event The event source for the new event.
         */
        function once(event) {
            return (listener, thisArgs = null, disposables) => {
                // we need this, in case the event fires during the listener call
                let didFire = false;
                let result = undefined;
                result = event(e => {
                    if (didFire) {
                        return;
                    }
                    else if (result) {
                        result.dispose();
                    }
                    else {
                        didFire = true;
                    }
                    return listener.call(thisArgs, e);
                }, null, disposables);
                if (didFire) {
                    result.dispose();
                }
                return result;
            };
        }
        Event.once = once;
        /**
         * Maps an event of one type into an event of another type using a mapping function, similar to how
         * `Array.prototype.map` works.
         *
         * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
         * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
         * returned event causes this utility to leak a listener on the original event.
         *
         * @param event The event source for the new event.
         * @param map The mapping function.
         * @param disposable A disposable store to add the new EventEmitter to.
         */
        function map(event, map, disposable) {
            return snapshot((listener, thisArgs = null, disposables) => event(i => listener.call(thisArgs, map(i)), null, disposables), disposable);
        }
        Event.map = map;
        /**
         * Wraps an event in another event that performs some function on the event object before firing.
         *
         * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
         * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
         * returned event causes this utility to leak a listener on the original event.
         *
         * @param event The event source for the new event.
         * @param each The function to perform on the event object.
         * @param disposable A disposable store to add the new EventEmitter to.
         */
        function forEach(event, each, disposable) {
            return snapshot((listener, thisArgs = null, disposables) => event(i => { each(i); listener.call(thisArgs, i); }, null, disposables), disposable);
        }
        Event.forEach = forEach;
        function filter(event, filter, disposable) {
            return snapshot((listener, thisArgs = null, disposables) => event(e => filter(e) && listener.call(thisArgs, e), null, disposables), disposable);
        }
        Event.filter = filter;
        /**
         * Given an event, returns the same event but typed as `Event<void>`.
         */
        function signal(event) {
            return event;
        }
        Event.signal = signal;
        function any(...events) {
            return (listener, thisArgs = null, disposables) => {
                const disposable = (0, lifecycle_1.combinedDisposable)(...events.map(event => event(e => listener.call(thisArgs, e))));
                return addAndReturnDisposable(disposable, disposables);
            };
        }
        Event.any = any;
        /**
         * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
         * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
         * returned event causes this utility to leak a listener on the original event.
         */
        function reduce(event, merge, initial, disposable) {
            let output = initial;
            return map(event, e => {
                output = merge(output, e);
                return output;
            }, disposable);
        }
        Event.reduce = reduce;
        function snapshot(event, disposable) {
            let listener;
            const options = {
                onWillAddFirstListener() {
                    listener = event(emitter.fire, emitter);
                },
                onDidRemoveLastListener() {
                    listener?.dispose();
                }
            };
            if (!disposable) {
                _addLeakageTraceLogic(options);
            }
            const emitter = new Emitter(options);
            disposable?.add(emitter);
            return emitter.event;
        }
        /**
         * Adds the IDisposable to the store if it's set, and returns it. Useful to
         * Event function implementation.
         */
        function addAndReturnDisposable(d, store) {
            if (store instanceof Array) {
                store.push(d);
            }
            else if (store) {
                store.add(d);
            }
            return d;
        }
        function debounce(event, merge, delay = 100, leading = false, flushOnListenerRemove = false, leakWarningThreshold, disposable) {
            let subscription;
            let output = undefined;
            let handle = undefined;
            let numDebouncedCalls = 0;
            let doFire;
            const options = {
                leakWarningThreshold,
                onWillAddFirstListener() {
                    subscription = event(cur => {
                        numDebouncedCalls++;
                        output = merge(output, cur);
                        if (leading && !handle) {
                            emitter.fire(output);
                            output = undefined;
                        }
                        doFire = () => {
                            const _output = output;
                            output = undefined;
                            handle = undefined;
                            if (!leading || numDebouncedCalls > 1) {
                                emitter.fire(_output);
                            }
                            numDebouncedCalls = 0;
                        };
                        if (typeof delay === 'number') {
                            clearTimeout(handle);
                            handle = setTimeout(doFire, delay);
                        }
                        else {
                            if (handle === undefined) {
                                handle = 0;
                                queueMicrotask(doFire);
                            }
                        }
                    });
                },
                onWillRemoveListener() {
                    if (flushOnListenerRemove && numDebouncedCalls > 0) {
                        doFire?.();
                    }
                },
                onDidRemoveLastListener() {
                    doFire = undefined;
                    subscription.dispose();
                }
            };
            if (!disposable) {
                _addLeakageTraceLogic(options);
            }
            const emitter = new Emitter(options);
            disposable?.add(emitter);
            return emitter.event;
        }
        Event.debounce = debounce;
        /**
         * Debounces an event, firing after some delay (default=0) with an array of all event original objects.
         *
         * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
         * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
         * returned event causes this utility to leak a listener on the original event.
         */
        function accumulate(event, delay = 0, disposable) {
            return Event.debounce(event, (last, e) => {
                if (!last) {
                    return [e];
                }
                last.push(e);
                return last;
            }, delay, undefined, true, undefined, disposable);
        }
        Event.accumulate = accumulate;
        /**
         * Filters an event such that some condition is _not_ met more than once in a row, effectively ensuring duplicate
         * event objects from different sources do not fire the same event object.
         *
         * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
         * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
         * returned event causes this utility to leak a listener on the original event.
         *
         * @param event The event source for the new event.
         * @param equals The equality condition.
         * @param disposable A disposable store to add the new EventEmitter to.
         *
         * @example
         * ```
         * // Fire only one time when a single window is opened or focused
         * Event.latch(Event.any(onDidOpenWindow, onDidFocusWindow))
         * ```
         */
        function latch(event, equals = (a, b) => a === b, disposable) {
            let firstCall = true;
            let cache;
            return filter(event, value => {
                const shouldEmit = firstCall || !equals(value, cache);
                firstCall = false;
                cache = value;
                return shouldEmit;
            }, disposable);
        }
        Event.latch = latch;
        /**
         * Splits an event whose parameter is a union type into 2 separate events for each type in the union.
         *
         * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
         * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
         * returned event causes this utility to leak a listener on the original event.
         *
         * @example
         * ```
         * const event = new EventEmitter<number | undefined>().event;
         * const [numberEvent, undefinedEvent] = Event.split(event, isUndefined);
         * ```
         *
         * @param event The event source for the new event.
         * @param isT A function that determines what event is of the first type.
         * @param disposable A disposable store to add the new EventEmitter to.
         */
        function split(event, isT, disposable) {
            return [
                Event.filter(event, isT, disposable),
                Event.filter(event, e => !isT(e), disposable),
            ];
        }
        Event.split = split;
        /**
         * Buffers an event until it has a listener attached.
         *
         * *NOTE* that this function returns an `Event` and it MUST be called with a `DisposableStore` whenever the returned
         * event is accessible to "third parties", e.g the event is a public property. Otherwise a leaked listener on the
         * returned event causes this utility to leak a listener on the original event.
         *
         * @param event The event source for the new event.
         * @param flushAfterTimeout Determines whether to flush the buffer after a timeout immediately or after a
         * `setTimeout` when the first event listener is added.
         * @param _buffer Internal: A source event array used for tests.
         *
         * @example
         * ```
         * // Start accumulating events, when the first listener is attached, flush
         * // the event after a timeout such that multiple listeners attached before
         * // the timeout would receive the event
         * this.onInstallExtension = Event.buffer(service.onInstallExtension, true);
         * ```
         */
        function buffer(event, flushAfterTimeout = false, _buffer = [], disposable) {
            let buffer = _buffer.slice();
            let listener = event(e => {
                if (buffer) {
                    buffer.push(e);
                }
                else {
                    emitter.fire(e);
                }
            });
            if (disposable) {
                disposable.add(listener);
            }
            const flush = () => {
                buffer?.forEach(e => emitter.fire(e));
                buffer = null;
            };
            const emitter = new Emitter({
                onWillAddFirstListener() {
                    if (!listener) {
                        listener = event(e => emitter.fire(e));
                        if (disposable) {
                            disposable.add(listener);
                        }
                    }
                },
                onDidAddFirstListener() {
                    if (buffer) {
                        if (flushAfterTimeout) {
                            setTimeout(flush);
                        }
                        else {
                            flush();
                        }
                    }
                },
                onDidRemoveLastListener() {
                    if (listener) {
                        listener.dispose();
                    }
                    listener = null;
                }
            });
            if (disposable) {
                disposable.add(emitter);
            }
            return emitter.event;
        }
        Event.buffer = buffer;
        /**
         * Wraps the event in an {@link IChainableEvent}, allowing a more functional programming style.
         *
         * @example
         * ```
         * // Normal
         * const onEnterPressNormal = Event.filter(
         *   Event.map(onKeyPress.event, e => new StandardKeyboardEvent(e)),
         *   e.keyCode === KeyCode.Enter
         * ).event;
         *
         * // Using chain
         * const onEnterPressChain = Event.chain(onKeyPress.event, $ => $
         *   .map(e => new StandardKeyboardEvent(e))
         *   .filter(e => e.keyCode === KeyCode.Enter)
         * );
         * ```
         */
        function chain(event, sythensize) {
            const fn = (listener, thisArgs, disposables) => {
                const cs = sythensize(new ChainableSynthesis());
                return event(function (value) {
                    const result = cs.evaluate(value);
                    if (result !== HaltChainable) {
                        listener.call(thisArgs, result);
                    }
                }, undefined, disposables);
            };
            return fn;
        }
        Event.chain = chain;
        const HaltChainable = Symbol('HaltChainable');
        class ChainableSynthesis {
            constructor() {
                this.steps = [];
            }
            map(fn) {
                this.steps.push(fn);
                return this;
            }
            forEach(fn) {
                this.steps.push(v => {
                    fn(v);
                    return v;
                });
                return this;
            }
            filter(fn) {
                this.steps.push(v => fn(v) ? v : HaltChainable);
                return this;
            }
            reduce(merge, initial) {
                let last = initial;
                this.steps.push(v => {
                    last = merge(last, v);
                    return last;
                });
                return this;
            }
            latch(equals = (a, b) => a === b) {
                let firstCall = true;
                let cache;
                this.steps.push(value => {
                    const shouldEmit = firstCall || !equals(value, cache);
                    firstCall = false;
                    cache = value;
                    return shouldEmit ? value : HaltChainable;
                });
                return this;
            }
            evaluate(value) {
                for (const step of this.steps) {
                    value = step(value);
                    if (value === HaltChainable) {
                        break;
                    }
                }
                return value;
            }
        }
        /**
         * Creates an {@link Event} from a node event emitter.
         */
        function fromNodeEventEmitter(emitter, eventName, map = id => id) {
            const fn = (...args) => result.fire(map(...args));
            const onFirstListenerAdd = () => emitter.on(eventName, fn);
            const onLastListenerRemove = () => emitter.removeListener(eventName, fn);
            const result = new Emitter({ onWillAddFirstListener: onFirstListenerAdd, onDidRemoveLastListener: onLastListenerRemove });
            return result.event;
        }
        Event.fromNodeEventEmitter = fromNodeEventEmitter;
        /**
         * Creates an {@link Event} from a DOM event emitter.
         */
        function fromDOMEventEmitter(emitter, eventName, map = id => id) {
            const fn = (...args) => result.fire(map(...args));
            const onFirstListenerAdd = () => emitter.addEventListener(eventName, fn);
            const onLastListenerRemove = () => emitter.removeEventListener(eventName, fn);
            const result = new Emitter({ onWillAddFirstListener: onFirstListenerAdd, onDidRemoveLastListener: onLastListenerRemove });
            return result.event;
        }
        Event.fromDOMEventEmitter = fromDOMEventEmitter;
        /**
         * Creates a promise out of an event, using the {@link Event.once} helper.
         */
        function toPromise(event) {
            return new Promise(resolve => once(event)(resolve));
        }
        Event.toPromise = toPromise;
        /**
         * Creates an event out of a promise that fires once when the promise is
         * resolved with the result of the promise or `undefined`.
         */
        function fromPromise(promise) {
            const result = new Emitter();
            promise.then(res => {
                result.fire(res);
            }, () => {
                result.fire(undefined);
            }).finally(() => {
                result.dispose();
            });
            return result.event;
        }
        Event.fromPromise = fromPromise;
        function runAndSubscribe(event, handler, initial) {
            handler(initial);
            return event(e => handler(e));
        }
        Event.runAndSubscribe = runAndSubscribe;
        class EmitterObserver {
            constructor(_observable, store) {
                this._observable = _observable;
                this._counter = 0;
                this._hasChanged = false;
                const options = {
                    onWillAddFirstListener: () => {
                        _observable.addObserver(this);
                    },
                    onDidRemoveLastListener: () => {
                        _observable.removeObserver(this);
                    }
                };
                if (!store) {
                    _addLeakageTraceLogic(options);
                }
                this.emitter = new Emitter(options);
                if (store) {
                    store.add(this.emitter);
                }
            }
            beginUpdate(_observable) {
                // assert(_observable === this.obs);
                this._counter++;
            }
            handlePossibleChange(_observable) {
                // assert(_observable === this.obs);
            }
            handleChange(_observable, _change) {
                // assert(_observable === this.obs);
                this._hasChanged = true;
            }
            endUpdate(_observable) {
                // assert(_observable === this.obs);
                this._counter--;
                if (this._counter === 0) {
                    this._observable.reportChanges();
                    if (this._hasChanged) {
                        this._hasChanged = false;
                        this.emitter.fire(this._observable.get());
                    }
                }
            }
        }
        /**
         * Creates an event emitter that is fired when the observable changes.
         * Each listeners subscribes to the emitter.
         */
        function fromObservable(obs, store) {
            const observer = new EmitterObserver(obs, store);
            return observer.emitter.event;
        }
        Event.fromObservable = fromObservable;
        /**
         * Each listener is attached to the observable directly.
         */
        function fromObservableLight(observable) {
            return (listener, thisArgs, disposables) => {
                let count = 0;
                let didChange = false;
                const observer = {
                    beginUpdate() {
                        count++;
                    },
                    endUpdate() {
                        count--;
                        if (count === 0) {
                            observable.reportChanges();
                            if (didChange) {
                                didChange = false;
                                listener.call(thisArgs);
                            }
                        }
                    },
                    handlePossibleChange() {
                        // noop
                    },
                    handleChange() {
                        didChange = true;
                    }
                };
                observable.addObserver(observer);
                observable.reportChanges();
                const disposable = {
                    dispose() {
                        observable.removeObserver(observer);
                    }
                };
                if (disposables instanceof lifecycle_1.DisposableStore) {
                    disposables.add(disposable);
                }
                else if (Array.isArray(disposables)) {
                    disposables.push(disposable);
                }
                return disposable;
            };
        }
        Event.fromObservableLight = fromObservableLight;
    })(Event || (exports.Event = Event = {}));
    class EventProfiling {
        static { this.all = new Set(); }
        static { this._idPool = 0; }
        constructor(name) {
            this.listenerCount = 0;
            this.invocationCount = 0;
            this.elapsedOverall = 0;
            this.durations = [];
            this.name = `${name}_${EventProfiling._idPool++}`;
            EventProfiling.all.add(this);
        }
        start(listenerCount) {
            this._stopWatch = new stopwatch_1.StopWatch();
            this.listenerCount = listenerCount;
        }
        stop() {
            if (this._stopWatch) {
                const elapsed = this._stopWatch.elapsed();
                this.durations.push(elapsed);
                this.elapsedOverall += elapsed;
                this.invocationCount += 1;
                this._stopWatch = undefined;
            }
        }
    }
    exports.EventProfiling = EventProfiling;
    let _globalLeakWarningThreshold = -1;
    function setGlobalLeakWarningThreshold(n) {
        const oldValue = _globalLeakWarningThreshold;
        _globalLeakWarningThreshold = n;
        return {
            dispose() {
                _globalLeakWarningThreshold = oldValue;
            }
        };
    }
    class LeakageMonitor {
        constructor(threshold, name = Math.random().toString(18).slice(2, 5)) {
            this.threshold = threshold;
            this.name = name;
            this._warnCountdown = 0;
        }
        dispose() {
            this._stacks?.clear();
        }
        check(stack, listenerCount) {
            const threshold = this.threshold;
            if (threshold <= 0 || listenerCount < threshold) {
                return undefined;
            }
            if (!this._stacks) {
                this._stacks = new Map();
            }
            const count = (this._stacks.get(stack.value) || 0);
            this._stacks.set(stack.value, count + 1);
            this._warnCountdown -= 1;
            if (this._warnCountdown <= 0) {
                // only warn on first exceed and then every time the limit
                // is exceeded by 50% again
                this._warnCountdown = threshold * 0.5;
                // find most frequent listener and print warning
                let topStack;
                let topCount = 0;
                for (const [stack, count] of this._stacks) {
                    if (!topStack || topCount < count) {
                        topStack = stack;
                        topCount = count;
                    }
                }
                console.warn(`[${this.name}] potential listener LEAK detected, having ${listenerCount} listeners already. MOST frequent listener (${topCount}):`);
                console.warn(topStack);
            }
            return () => {
                const count = (this._stacks.get(stack.value) || 0);
                this._stacks.set(stack.value, count - 1);
            };
        }
    }
    class Stacktrace {
        static create() {
            return new Stacktrace(new Error().stack ?? '');
        }
        constructor(value) {
            this.value = value;
        }
        print() {
            console.warn(this.value.split('\n').slice(2).join('\n'));
        }
    }
    let id = 0;
    class UniqueContainer {
        constructor(value) {
            this.value = value;
            this.id = id++;
        }
    }
    const compactionThreshold = 2;
    const forEachListener = (listeners, fn) => {
        if (listeners instanceof UniqueContainer) {
            fn(listeners);
        }
        else {
            for (let i = 0; i < listeners.length; i++) {
                const l = listeners[i];
                if (l) {
                    fn(l);
                }
            }
        }
    };
    const _listenerFinalizers = _enableListenerGCedWarning
        ? new FinalizationRegistry(heldValue => {
            if (typeof heldValue === 'string') {
                console.warn('[LEAKING LISTENER] GC\'ed a listener that was NOT yet disposed. This is where is was created:');
                console.warn(heldValue);
            }
        })
        : undefined;
    /**
     * The Emitter can be used to expose an Event to the public
     * to fire it from the insides.
     * Sample:
        class Document {
    
            private readonly _onDidChange = new Emitter<(value:string)=>any>();
    
            public onDidChange = this._onDidChange.event;
    
            // getter-style
            // get onDidChange(): Event<(value:string)=>any> {
            // 	return this._onDidChange.event;
            // }
    
            private _doIt() {
                //...
                this._onDidChange.fire(value);
            }
        }
     */
    class Emitter {
        constructor(options) {
            this._size = 0;
            this._options = options;
            this._leakageMon = _globalLeakWarningThreshold > 0 || this._options?.leakWarningThreshold ? new LeakageMonitor(this._options?.leakWarningThreshold ?? _globalLeakWarningThreshold) : undefined;
            this._perfMon = this._options?._profName ? new EventProfiling(this._options._profName) : undefined;
            this._deliveryQueue = this._options?.deliveryQueue;
        }
        dispose() {
            if (!this._disposed) {
                this._disposed = true;
                // It is bad to have listeners at the time of disposing an emitter, it is worst to have listeners keep the emitter
                // alive via the reference that's embedded in their disposables. Therefore we loop over all remaining listeners and
                // unset their subscriptions/disposables. Looping and blaming remaining listeners is done on next tick because the
                // the following programming pattern is very popular:
                //
                // const someModel = this._disposables.add(new ModelObject()); // (1) create and register model
                // this._disposables.add(someModel.onDidChange(() => { ... }); // (2) subscribe and register model-event listener
                // ...later...
                // this._disposables.dispose(); disposes (1) then (2): don't warn after (1) but after the "overall dispose" is done
                if (this._deliveryQueue?.current === this) {
                    this._deliveryQueue.reset();
                }
                if (this._listeners) {
                    if (_enableDisposeWithListenerWarning) {
                        const listeners = this._listeners;
                        queueMicrotask(() => {
                            forEachListener(listeners, l => l.stack?.print());
                        });
                    }
                    this._listeners = undefined;
                    this._size = 0;
                }
                this._options?.onDidRemoveLastListener?.();
                this._leakageMon?.dispose();
            }
        }
        /**
         * For the public to allow to subscribe
         * to events from this Emitter
         */
        get event() {
            this._event ??= (callback, thisArgs, disposables) => {
                if (this._leakageMon && this._size > this._leakageMon.threshold * 3) {
                    console.warn(`[${this._leakageMon.name}] REFUSES to accept new listeners because it exceeded its threshold by far`);
                    return lifecycle_1.Disposable.None;
                }
                if (this._disposed) {
                    // todo: should we warn if a listener is added to a disposed emitter? This happens often
                    return lifecycle_1.Disposable.None;
                }
                if (thisArgs) {
                    callback = callback.bind(thisArgs);
                }
                const contained = new UniqueContainer(callback);
                let removeMonitor;
                let stack;
                if (this._leakageMon && this._size >= Math.ceil(this._leakageMon.threshold * 0.2)) {
                    // check and record this emitter for potential leakage
                    contained.stack = Stacktrace.create();
                    removeMonitor = this._leakageMon.check(contained.stack, this._size + 1);
                }
                if (_enableDisposeWithListenerWarning) {
                    contained.stack = stack ?? Stacktrace.create();
                }
                if (!this._listeners) {
                    this._options?.onWillAddFirstListener?.(this);
                    this._listeners = contained;
                    this._options?.onDidAddFirstListener?.(this);
                }
                else if (this._listeners instanceof UniqueContainer) {
                    this._deliveryQueue ??= new EventDeliveryQueuePrivate();
                    this._listeners = [this._listeners, contained];
                }
                else {
                    this._listeners.push(contained);
                }
                this._size++;
                const result = (0, lifecycle_1.toDisposable)(() => {
                    _listenerFinalizers?.unregister(result);
                    removeMonitor?.();
                    this._removeListener(contained);
                });
                if (disposables instanceof lifecycle_1.DisposableStore) {
                    disposables.add(result);
                }
                else if (Array.isArray(disposables)) {
                    disposables.push(result);
                }
                if (_listenerFinalizers) {
                    const stack = new Error().stack.split('\n').slice(2).join('\n').trim();
                    _listenerFinalizers.register(result, stack, result);
                }
                return result;
            };
            return this._event;
        }
        _removeListener(listener) {
            this._options?.onWillRemoveListener?.(this);
            if (!this._listeners) {
                return; // expected if a listener gets disposed
            }
            if (this._size === 1) {
                this._listeners = undefined;
                this._options?.onDidRemoveLastListener?.(this);
                this._size = 0;
                return;
            }
            // size > 1 which requires that listeners be a list:
            const listeners = this._listeners;
            const index = listeners.indexOf(listener);
            if (index === -1) {
                console.log('disposed?', this._disposed);
                console.log('size?', this._size);
                console.log('arr?', JSON.stringify(this._listeners));
                throw new Error('Attempted to dispose unknown listener');
            }
            this._size--;
            listeners[index] = undefined;
            const adjustDeliveryQueue = this._deliveryQueue.current === this;
            if (this._size * compactionThreshold <= listeners.length) {
                let n = 0;
                for (let i = 0; i < listeners.length; i++) {
                    if (listeners[i]) {
                        listeners[n++] = listeners[i];
                    }
                    else if (adjustDeliveryQueue) {
                        this._deliveryQueue.end--;
                        if (n < this._deliveryQueue.i) {
                            this._deliveryQueue.i--;
                        }
                    }
                }
                listeners.length = n;
            }
        }
        _deliver(listener, value) {
            if (!listener) {
                return;
            }
            const errorHandler = this._options?.onListenerError || errors_1.onUnexpectedError;
            if (!errorHandler) {
                listener.value(value);
                return;
            }
            try {
                listener.value(value);
            }
            catch (e) {
                errorHandler(e);
            }
        }
        /** Delivers items in the queue. Assumes the queue is ready to go. */
        _deliverQueue(dq) {
            const listeners = dq.current._listeners;
            while (dq.i < dq.end) {
                // important: dq.i is incremented before calling deliver() because it might reenter deliverQueue()
                this._deliver(listeners[dq.i++], dq.value);
            }
            dq.reset();
        }
        /**
         * To be kept private to fire an event to
         * subscribers
         */
        fire(event) {
            if (this._deliveryQueue?.current) {
                this._deliverQueue(this._deliveryQueue);
                this._perfMon?.stop(); // last fire() will have starting perfmon, stop it before starting the next dispatch
            }
            this._perfMon?.start(this._size);
            if (!this._listeners) {
                // no-op
            }
            else if (this._listeners instanceof UniqueContainer) {
                this._deliver(this._listeners, event);
            }
            else {
                const dq = this._deliveryQueue;
                dq.enqueue(this, event, this._listeners.length);
                this._deliverQueue(dq);
            }
            this._perfMon?.stop();
        }
        hasListeners() {
            return this._size > 0;
        }
    }
    exports.Emitter = Emitter;
    const createEventDeliveryQueue = () => new EventDeliveryQueuePrivate();
    exports.createEventDeliveryQueue = createEventDeliveryQueue;
    class EventDeliveryQueuePrivate {
        constructor() {
            /**
             * Index in current's listener list.
             */
            this.i = -1;
            /**
             * The last index in the listener's list to deliver.
             */
            this.end = 0;
        }
        enqueue(emitter, value, end) {
            this.i = 0;
            this.end = end;
            this.current = emitter;
            this.value = value;
        }
        reset() {
            this.i = this.end; // force any current emission loop to stop, mainly for during dispose
            this.current = undefined;
            this.value = undefined;
        }
    }
    class AsyncEmitter extends Emitter {
        async fireAsync(data, token, promiseJoin) {
            if (!this._listeners) {
                return;
            }
            if (!this._asyncDeliveryQueue) {
                this._asyncDeliveryQueue = new linkedList_1.LinkedList();
            }
            forEachListener(this._listeners, listener => this._asyncDeliveryQueue.push([listener.value, data]));
            while (this._asyncDeliveryQueue.size > 0 && !token.isCancellationRequested) {
                const [listener, data] = this._asyncDeliveryQueue.shift();
                const thenables = [];
                const event = {
                    ...data,
                    token,
                    waitUntil: (p) => {
                        if (Object.isFrozen(thenables)) {
                            throw new Error('waitUntil can NOT be called asynchronous');
                        }
                        if (promiseJoin) {
                            p = promiseJoin(p, listener);
                        }
                        thenables.push(p);
                    }
                };
                try {
                    listener(event);
                }
                catch (e) {
                    (0, errors_1.onUnexpectedError)(e);
                    continue;
                }
                // freeze thenables-collection to enforce sync-calls to
                // wait until and then wait for all thenables to resolve
                Object.freeze(thenables);
                await Promise.allSettled(thenables).then(values => {
                    for (const value of values) {
                        if (value.status === 'rejected') {
                            (0, errors_1.onUnexpectedError)(value.reason);
                        }
                    }
                });
            }
        }
    }
    exports.AsyncEmitter = AsyncEmitter;
    class PauseableEmitter extends Emitter {
        get isPaused() {
            return this._isPaused !== 0;
        }
        constructor(options) {
            super(options);
            this._isPaused = 0;
            this._eventQueue = new linkedList_1.LinkedList();
            this._mergeFn = options?.merge;
        }
        pause() {
            this._isPaused++;
        }
        resume() {
            if (this._isPaused !== 0 && --this._isPaused === 0) {
                if (this._mergeFn) {
                    // use the merge function to create a single composite
                    // event. make a copy in case firing pauses this emitter
                    if (this._eventQueue.size > 0) {
                        const events = Array.from(this._eventQueue);
                        this._eventQueue.clear();
                        super.fire(this._mergeFn(events));
                    }
                }
                else {
                    // no merging, fire each event individually and test
                    // that this emitter isn't paused halfway through
                    while (!this._isPaused && this._eventQueue.size !== 0) {
                        super.fire(this._eventQueue.shift());
                    }
                }
            }
        }
        fire(event) {
            if (this._size) {
                if (this._isPaused !== 0) {
                    this._eventQueue.push(event);
                }
                else {
                    super.fire(event);
                }
            }
        }
    }
    exports.PauseableEmitter = PauseableEmitter;
    class DebounceEmitter extends PauseableEmitter {
        constructor(options) {
            super(options);
            this._delay = options.delay ?? 100;
        }
        fire(event) {
            if (!this._handle) {
                this.pause();
                this._handle = setTimeout(() => {
                    this._handle = undefined;
                    this.resume();
                }, this._delay);
            }
            super.fire(event);
        }
    }
    exports.DebounceEmitter = DebounceEmitter;
    /**
     * An emitter which queue all events and then process them at the
     * end of the event loop.
     */
    class MicrotaskEmitter extends Emitter {
        constructor(options) {
            super(options);
            this._queuedEvents = [];
            this._mergeFn = options?.merge;
        }
        fire(event) {
            if (!this.hasListeners()) {
                return;
            }
            this._queuedEvents.push(event);
            if (this._queuedEvents.length === 1) {
                queueMicrotask(() => {
                    if (this._mergeFn) {
                        super.fire(this._mergeFn(this._queuedEvents));
                    }
                    else {
                        this._queuedEvents.forEach(e => super.fire(e));
                    }
                    this._queuedEvents = [];
                });
            }
        }
    }
    exports.MicrotaskEmitter = MicrotaskEmitter;
    /**
     * An event emitter that multiplexes many events into a single event.
     *
     * @example Listen to the `onData` event of all `Thing`s, dynamically adding and removing `Thing`s
     * to the multiplexer as needed.
     *
     * ```typescript
     * const anythingDataMultiplexer = new EventMultiplexer<{ data: string }>();
     *
     * const thingListeners = DisposableMap<Thing, IDisposable>();
     *
     * thingService.onDidAddThing(thing => {
     *   thingListeners.set(thing, anythingDataMultiplexer.add(thing.onData);
     * });
     * thingService.onDidRemoveThing(thing => {
     *   thingListeners.deleteAndDispose(thing);
     * });
     *
     * anythingDataMultiplexer.event(e => {
     *   console.log('Something fired data ' + e.data)
     * });
     * ```
     */
    class EventMultiplexer {
        constructor() {
            this.hasListeners = false;
            this.events = [];
            this.emitter = new Emitter({
                onWillAddFirstListener: () => this.onFirstListenerAdd(),
                onDidRemoveLastListener: () => this.onLastListenerRemove()
            });
        }
        get event() {
            return this.emitter.event;
        }
        add(event) {
            const e = { event: event, listener: null };
            this.events.push(e);
            if (this.hasListeners) {
                this.hook(e);
            }
            const dispose = () => {
                if (this.hasListeners) {
                    this.unhook(e);
                }
                const idx = this.events.indexOf(e);
                this.events.splice(idx, 1);
            };
            return (0, lifecycle_1.toDisposable)((0, functional_1.createSingleCallFunction)(dispose));
        }
        onFirstListenerAdd() {
            this.hasListeners = true;
            this.events.forEach(e => this.hook(e));
        }
        onLastListenerRemove() {
            this.hasListeners = false;
            this.events.forEach(e => this.unhook(e));
        }
        hook(e) {
            e.listener = e.event(r => this.emitter.fire(r));
        }
        unhook(e) {
            e.listener?.dispose();
            e.listener = null;
        }
        dispose() {
            this.emitter.dispose();
            for (const e of this.events) {
                e.listener?.dispose();
            }
            this.events = [];
        }
    }
    exports.EventMultiplexer = EventMultiplexer;
    class DynamicListEventMultiplexer {
        constructor(items, onAddItem, onRemoveItem, getEvent) {
            this._store = new lifecycle_1.DisposableStore();
            const multiplexer = this._store.add(new EventMultiplexer());
            const itemListeners = this._store.add(new lifecycle_1.DisposableMap());
            function addItem(instance) {
                itemListeners.set(instance, multiplexer.add(getEvent(instance)));
            }
            // Existing items
            for (const instance of items) {
                addItem(instance);
            }
            // Added items
            this._store.add(onAddItem(instance => {
                addItem(instance);
            }));
            // Removed items
            this._store.add(onRemoveItem(instance => {
                itemListeners.deleteAndDispose(instance);
            }));
            this.event = multiplexer.event;
        }
        dispose() {
            this._store.dispose();
        }
    }
    exports.DynamicListEventMultiplexer = DynamicListEventMultiplexer;
    /**
     * The EventBufferer is useful in situations in which you want
     * to delay firing your events during some code.
     * You can wrap that code and be sure that the event will not
     * be fired during that wrap.
     *
     * ```
     * const emitter: Emitter;
     * const delayer = new EventDelayer();
     * const delayedEvent = delayer.wrapEvent(emitter.event);
     *
     * delayedEvent(console.log);
     *
     * delayer.bufferEvents(() => {
     *   emitter.fire(); // event will not be fired yet
     * });
     *
     * // event will only be fired at this point
     * ```
     */
    class EventBufferer {
        constructor() {
            this.buffers = [];
        }
        wrapEvent(event) {
            return (listener, thisArgs, disposables) => {
                return event(i => {
                    const buffer = this.buffers[this.buffers.length - 1];
                    if (buffer) {
                        buffer.push(() => listener.call(thisArgs, i));
                    }
                    else {
                        listener.call(thisArgs, i);
                    }
                }, undefined, disposables);
            };
        }
        bufferEvents(fn) {
            const buffer = [];
            this.buffers.push(buffer);
            const r = fn();
            this.buffers.pop();
            buffer.forEach(flush => flush());
            return r;
        }
    }
    exports.EventBufferer = EventBufferer;
    /**
     * A Relay is an event forwarder which functions as a replugabble event pipe.
     * Once created, you can connect an input event to it and it will simply forward
     * events from that input event through its own `event` property. The `input`
     * can be changed at any point in time.
     */
    class Relay {
        constructor() {
            this.listening = false;
            this.inputEvent = Event.None;
            this.inputEventListener = lifecycle_1.Disposable.None;
            this.emitter = new Emitter({
                onDidAddFirstListener: () => {
                    this.listening = true;
                    this.inputEventListener = this.inputEvent(this.emitter.fire, this.emitter);
                },
                onDidRemoveLastListener: () => {
                    this.listening = false;
                    this.inputEventListener.dispose();
                }
            });
            this.event = this.emitter.event;
        }
        set input(event) {
            this.inputEvent = event;
            if (this.listening) {
                this.inputEventListener.dispose();
                this.inputEventListener = event(this.emitter.fire, this.emitter);
            }
        }
        dispose() {
            this.inputEventListener.dispose();
            this.emitter.dispose();
        }
    }
    exports.Relay = Relay;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2V2ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWt6QmhHLHNFQVFDO0lBOXlCRCwwSEFBMEg7SUFDMUgsdUhBQXVIO0lBQ3ZILDBIQUEwSDtJQUMxSCxNQUFNLDBCQUEwQixHQUFHLEtBQUssQ0FFdEM7SUFFRiwwSEFBMEg7SUFDMUgsMEhBQTBIO0lBQzFILDBIQUEwSDtJQUMxSCxNQUFNLGlDQUFpQyxHQUFHLEtBQUssQ0FFN0M7SUFHRiwwSEFBMEg7SUFDMUgsNkdBQTZHO0lBQzdHLHdEQUF3RDtJQUN4RCwwSEFBMEg7SUFDMUgsTUFBTSxtQ0FBbUMsR0FBRyxLQUFLLENBRS9DO0lBU0YsSUFBaUIsS0FBSyxDQXNyQnJCO0lBdHJCRCxXQUFpQixLQUFLO1FBQ1IsVUFBSSxHQUFlLEdBQUcsRUFBRSxDQUFDLHNCQUFVLENBQUMsSUFBSSxDQUFDO1FBRXRELFNBQVMscUJBQXFCLENBQUMsT0FBdUI7WUFDckQsSUFBSSxtQ0FBbUMsRUFBRSxDQUFDO2dCQUN6QyxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsa0JBQWtCLEVBQUUsR0FBRyxPQUFPLENBQUM7Z0JBQ3pELE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUNkLE9BQU8sQ0FBQyxnQkFBZ0IsR0FBRyxHQUFHLEVBQUU7b0JBQy9CLElBQUksRUFBRSxLQUFLLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ25CLE9BQU8sQ0FBQyxJQUFJLENBQUMsNEdBQTRHLENBQUMsQ0FBQzt3QkFDM0gsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNmLENBQUM7b0JBQ0Qsa0JBQWtCLEVBQUUsRUFB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