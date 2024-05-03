/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observableInternal/autorun", "vs/base/common/observableInternal/base", "vs/base/common/observableInternal/debugName", "vs/base/common/observableInternal/derived", "vs/base/common/observableInternal/logging"], function (require, exports, lifecycle_1, autorun_1, base_1, debugName_1, derived_1, logging_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeepAliveObserver = exports.FromEventObservable = void 0;
    exports.constObservable = constObservable;
    exports.observableFromPromise = observableFromPromise;
    exports.observableFromEvent = observableFromEvent;
    exports.observableSignalFromEvent = observableSignalFromEvent;
    exports.observableSignal = observableSignal;
    exports.debouncedObservable = debouncedObservable;
    exports.debouncedObservable2 = debouncedObservable2;
    exports.wasEventTriggeredRecently = wasEventTriggeredRecently;
    exports.keepObserved = keepObserved;
    exports.recomputeInitiallyAndOnChange = recomputeInitiallyAndOnChange;
    exports.derivedObservableWithCache = derivedObservableWithCache;
    exports.derivedObservableWithWritableCache = derivedObservableWithWritableCache;
    exports.mapObservableArrayCached = mapObservableArrayCached;
    /**
     * Represents an efficient observable whose value never changes.
     */
    function constObservable(value) {
        return new ConstObservable(value);
    }
    class ConstObservable extends base_1.ConvenientObservable {
        constructor(value) {
            super();
            this.value = value;
        }
        get debugName() {
            return this.toString();
        }
        get() {
            return this.value;
        }
        addObserver(observer) {
            // NO OP
        }
        removeObserver(observer) {
            // NO OP
        }
        toString() {
            return `Const: ${this.value}`;
        }
    }
    function observableFromPromise(promise) {
        const observable = (0, base_1.observableValue)('promiseValue', {});
        promise.then((value) => {
            observable.set({ value }, undefined);
        });
        return observable;
    }
    function observableFromEvent(event, getValue) {
        return new FromEventObservable(event, getValue);
    }
    class FromEventObservable extends base_1.BaseObservable {
        constructor(event, _getValue) {
            super();
            this.event = event;
            this._getValue = _getValue;
            this.hasValue = false;
            this.handleEvent = (args) => {
                const newValue = this._getValue(args);
                const oldValue = this.value;
                const didChange = !this.hasValue || oldValue !== newValue;
                let didRunTransaction = false;
                if (didChange) {
                    this.value = newValue;
                    if (this.hasValue) {
                        didRunTransaction = true;
                        (0, base_1.subtransaction)(FromEventObservable.globalTransaction, (tx) => {
                            (0, logging_1.getLogger)()?.handleFromEventObservableTriggered(this, { oldValue, newValue, change: undefined, didChange, hadValue: this.hasValue });
                            for (const o of this.observers) {
                                tx.updateObserver(o, this);
                                o.handleChange(this, undefined);
                            }
                        }, () => {
                            const name = this.getDebugName();
                            return 'Event fired' + (name ? `: ${name}` : '');
                        });
                    }
                    this.hasValue = true;
                }
                if (!didRunTransaction) {
                    (0, logging_1.getLogger)()?.handleFromEventObservableTriggered(this, { oldValue, newValue, change: undefined, didChange, hadValue: this.hasValue });
                }
            };
        }
        getDebugName() {
            return (0, debugName_1.getFunctionName)(this._getValue);
        }
        get debugName() {
            const name = this.getDebugName();
            return 'From Event' + (name ? `: ${name}` : '');
        }
        onFirstObserverAdded() {
            this.subscription = this.event(this.handleEvent);
        }
        onLastObserverRemoved() {
            this.subscription.dispose();
            this.subscription = undefined;
            this.hasValue = false;
            this.value = undefined;
        }
        get() {
            if (this.subscription) {
                if (!this.hasValue) {
                    this.handleEvent(undefined);
                }
                return this.value;
            }
            else {
                // no cache, as there are no subscribers to keep it updated
                return this._getValue(undefined);
            }
        }
    }
    exports.FromEventObservable = FromEventObservable;
    (function (observableFromEvent) {
        observableFromEvent.Observer = FromEventObservable;
        function batchEventsGlobally(tx, fn) {
            let didSet = false;
            if (FromEventObservable.globalTransaction === undefined) {
                FromEventObservable.globalTransaction = tx;
                didSet = true;
            }
            try {
                fn();
            }
            finally {
                if (didSet) {
                    FromEventObservable.globalTransaction = undefined;
                }
            }
        }
        observableFromEvent.batchEventsGlobally = batchEventsGlobally;
    })(observableFromEvent || (exports.observableFromEvent = observableFromEvent = {}));
    function observableSignalFromEvent(debugName, event) {
        return new FromEventObservableSignal(debugName, event);
    }
    class FromEventObservableSignal extends base_1.BaseObservable {
        constructor(debugName, event) {
            super();
            this.debugName = debugName;
            this.event = event;
            this.handleEvent = () => {
                (0, base_1.transaction)((tx) => {
                    for (const o of this.observers) {
                        tx.updateObserver(o, this);
                        o.handleChange(this, undefined);
                    }
                }, () => this.debugName);
            };
        }
        onFirstObserverAdded() {
            this.subscription = this.event(this.handleEvent);
        }
        onLastObserverRemoved() {
            this.subscription.dispose();
            this.subscription = undefined;
        }
        get() {
            // NO OP
        }
    }
    function observableSignal(debugNameOrOwner) {
        if (typeof debugNameOrOwner === 'string') {
            return new ObservableSignal(debugNameOrOwner);
        }
        else {
            return new ObservableSignal(undefined, debugNameOrOwner);
        }
    }
    class ObservableSignal extends base_1.BaseObservable {
        get debugName() {
            return new debugName_1.DebugNameData(this._owner, this._debugName, undefined).getDebugName(this) ?? 'Observable Signal';
        }
        constructor(_debugName, _owner) {
            super();
            this._debugName = _debugName;
            this._owner = _owner;
        }
        trigger(tx, change) {
            if (!tx) {
                (0, base_1.transaction)(tx => {
                    this.trigger(tx, change);
                }, () => `Trigger signal ${this.debugName}`);
                return;
            }
            for (const o of this.observers) {
                tx.updateObserver(o, this);
                o.handleChange(this, change);
            }
        }
        get() {
            // NO OP
        }
    }
    /**
     * @deprecated Use `debouncedObservable2` instead.
     */
    function debouncedObservable(observable, debounceMs, disposableStore) {
        const debouncedObservable = (0, base_1.observableValue)('debounced', undefined);
        let timeout = undefined;
        disposableStore.add((0, autorun_1.autorun)(reader => {
            /** @description debounce */
            const value = observable.read(reader);
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                (0, base_1.transaction)(tx => {
                    debouncedObservable.set(value, tx);
                });
            }, debounceMs);
        }));
        return debouncedObservable;
    }
    /**
     * Creates an observable that debounces the input observable.
     */
    function debouncedObservable2(observable, debounceMs) {
        let hasValue = false;
        let lastValue;
        let timeout = undefined;
        return observableFromEvent(cb => {
            const d = (0, autorun_1.autorun)(reader => {
                const value = observable.read(reader);
                if (!hasValue) {
                    hasValue = true;
                    lastValue = value;
                }
                else {
                    if (timeout) {
                        clearTimeout(timeout);
                    }
                    timeout = setTimeout(() => {
                        lastValue = value;
                        cb();
                    }, debounceMs);
                }
            });
            return {
                dispose() {
                    d.dispose();
                    hasValue = false;
                    lastValue = undefined;
                },
            };
        }, () => {
            if (hasValue) {
                return lastValue;
            }
            else {
                return observable.get();
            }
        });
    }
    function wasEventTriggeredRecently(event, timeoutMs, disposableStore) {
        const observable = (0, base_1.observableValue)('triggeredRecently', false);
        let timeout = undefined;
        disposableStore.add(event(() => {
            observable.set(true, undefined);
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                observable.set(false, undefined);
            }, timeoutMs);
        }));
        return observable;
    }
    /**
     * This makes sure the observable is being observed and keeps its cache alive.
     */
    function keepObserved(observable) {
        const o = new KeepAliveObserver(false, undefined);
        observable.addObserver(o);
        return (0, lifecycle_1.toDisposable)(() => {
            observable.removeObserver(o);
        });
    }
    (0, base_1._setKeepObserved)(keepObserved);
    /**
     * This converts the given observable into an autorun.
     */
    function recomputeInitiallyAndOnChange(observable, handleValue) {
        const o = new KeepAliveObserver(true, handleValue);
        observable.addObserver(o);
        if (handleValue) {
            handleValue(observable.get());
        }
        else {
            observable.reportChanges();
        }
        return (0, lifecycle_1.toDisposable)(() => {
            observable.removeObserver(o);
        });
    }
    (0, base_1._setRecomputeInitiallyAndOnChange)(recomputeInitiallyAndOnChange);
    class KeepAliveObserver {
        constructor(_forceRecompute, _handleValue) {
            this._forceRecompute = _forceRecompute;
            this._handleValue = _handleValue;
            this._counter = 0;
        }
        beginUpdate(observable) {
            this._counter++;
        }
        endUpdate(observable) {
            this._counter--;
            if (this._counter === 0 && this._forceRecompute) {
                if (this._handleValue) {
                    this._handleValue(observable.get());
                }
                else {
                    observable.reportChanges();
                }
            }
        }
        handlePossibleChange(observable) {
            // NO OP
        }
        handleChange(observable, change) {
            // NO OP
        }
    }
    exports.KeepAliveObserver = KeepAliveObserver;
    function derivedObservableWithCache(computeFn) {
        let lastValue = undefined;
        const observable = (0, derived_1.derived)(reader => {
            lastValue = computeFn(reader, lastValue);
            return lastValue;
        });
        return observable;
    }
    function derivedObservableWithWritableCache(owner, computeFn) {
        let lastValue = undefined;
        const counter = (0, base_1.observableValue)('derivedObservableWithWritableCache.counter', 0);
        const observable = (0, derived_1.derived)(owner, reader => {
            counter.read(reader);
            lastValue = computeFn(reader, lastValue);
            return lastValue;
        });
        return Object.assign(observable, {
            clearCache: (transaction) => {
                lastValue = undefined;
                counter.set(counter.get() + 1, transaction);
            },
        });
    }
    /**
     * When the items array changes, referential equal items are not mapped again.
     */
    function mapObservableArrayCached(owner, items, map, keySelector) {
        let m = new ArrayMap(map, keySelector);
        const self = (0, derived_1.derivedOpts)({
            debugReferenceFn: map,
            owner,
            onLastObserverRemoved: () => {
                m.dispose();
                m = new ArrayMap(map);
            }
        }, (reader) => {
            m.setItems(items.read(reader));
            return m.getItems();
        });
        return self;
    }
    class ArrayMap {
        constructor(_map, _keySelector) {
            this._map = _map;
            this._keySelector = _keySelector;
            this._cache = new Map();
            this._items = [];
        }
        dispose() {
            this._cache.forEach(entry => entry.store.dispose());
            this._cache.clear();
        }
        setItems(items) {
            const newItems = [];
            const itemsToRemove = new Set(this._cache.keys());
            for (const item of items) {
                const key = this._keySelector ? this._keySelector(item) : item;
                let entry = this._cache.get(key);
                if (!entry) {
                    const store = new lifecycle_1.DisposableStore();
                    const out = this._map(item, store);
                    entry = { out, store };
                    this._cache.set(key, entry);
                }
                else {
                    itemsToRemove.delete(key);
                }
                newItems.push(entry.out);
            }
            for (const item of itemsToRemove) {
                const entry = this._cache.get(item);
                entry.store.dispose();
                this._cache.delete(item);
            }
            this._items = newItems;
        }
        getItems() {
            return this._items;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL29ic2VydmFibGVJbnRlcm5hbC91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsMENBRUM7SUEyQkQsc0RBTUM7SUFFRCxrREFLQztJQXdHRCw4REFLQztJQTZDRCw0Q0FNQztJQXdDRCxrREFxQkM7SUFLRCxvREFxQ0M7SUFFRCw4REFpQkM7SUFLRCxvQ0FNQztJQU9ELHNFQVlDO0lBb0NELGdFQU9DO0lBRUQsZ0ZBY0M7SUFLRCw0REFjQztJQW5iRDs7T0FFRztJQUNILFNBQWdCLGVBQWUsQ0FBSSxLQUFRO1FBQzFDLE9BQU8sSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVELE1BQU0sZUFBbUIsU0FBUSwyQkFBNkI7UUFDN0QsWUFBNkIsS0FBUTtZQUNwQyxLQUFLLEVBQUUsQ0FBQztZQURvQixVQUFLLEdBQUwsS0FBSyxDQUFHO1FBRXJDLENBQUM7UUFFRCxJQUFvQixTQUFTO1lBQzVCLE9BQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3hCLENBQUM7UUFFTSxHQUFHO1lBQ1QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFDTSxXQUFXLENBQUMsUUFBbUI7WUFDckMsUUFBUTtRQUNULENBQUM7UUFDTSxjQUFjLENBQUMsUUFBbUI7WUFDeEMsUUFBUTtRQUNULENBQUM7UUFFUSxRQUFRO1lBQ2hCLE9BQU8sVUFBVSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDL0IsQ0FBQztLQUNEO0lBR0QsU0FBZ0IscUJBQXFCLENBQUksT0FBbUI7UUFDM0QsTUFBTSxVQUFVLEdBQUcsSUFBQSxzQkFBZSxFQUFnQixjQUFjLEVBQUUsRUFBRSxDQUFDLENB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