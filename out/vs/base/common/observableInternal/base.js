/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/observableInternal/debugName", "vs/base/common/observableInternal/logging"], function (require, exports, debugName_1, logging_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisposableObservableValue = exports.ObservableValue = exports.TransactionImpl = exports.BaseObservable = exports.ConvenientObservable = void 0;
    exports._setRecomputeInitiallyAndOnChange = _setRecomputeInitiallyAndOnChange;
    exports._setKeepObserved = _setKeepObserved;
    exports._setDerivedOpts = _setDerivedOpts;
    exports.transaction = transaction;
    exports.globalTransaction = globalTransaction;
    exports.asyncTransaction = asyncTransaction;
    exports.subtransaction = subtransaction;
    exports.observableValue = observableValue;
    exports.disposableObservableValue = disposableObservableValue;
    let _recomputeInitiallyAndOnChange;
    function _setRecomputeInitiallyAndOnChange(recomputeInitiallyAndOnChange) {
        _recomputeInitiallyAndOnChange = recomputeInitiallyAndOnChange;
    }
    let _keepObserved;
    function _setKeepObserved(keepObserved) {
        _keepObserved = keepObserved;
    }
    let _derived;
    /**
     * @internal
     * This is to allow splitting files.
    */
    function _setDerivedOpts(derived) {
        _derived = derived;
    }
    class ConvenientObservable {
        get TChange() { return null; }
        reportChanges() {
            this.get();
        }
        /** @sealed */
        read(reader) {
            if (reader) {
                return reader.readObservable(this);
            }
            else {
                return this.get();
            }
        }
        map(fnOrOwner, fnOrUndefined) {
            const owner = fnOrUndefined === undefined ? undefined : fnOrOwner;
            const fn = fnOrUndefined === undefined ? fnOrOwner : fnOrUndefined;
            return _derived({
                owner,
                debugName: () => {
                    const name = (0, debugName_1.getFunctionName)(fn);
                    if (name !== undefined) {
                        return name;
                    }
                    // regexp to match `x => x.y` or `x => x?.y` where x and y can be arbitrary identifiers (uses backref):
                    const regexp = /^\s*\(?\s*([a-zA-Z_$][a-zA-Z_$0-9]*)\s*\)?\s*=>\s*\1(?:\??)\.([a-zA-Z_$][a-zA-Z_$0-9]*)\s*$/;
                    const match = regexp.exec(fn.toString());
                    if (match) {
                        return `${this.debugName}.${match[2]}`;
                    }
                    if (!owner) {
                        return `${this.debugName} (mapped)`;
                    }
                    return undefined;
                },
            }, (reader) => fn(this.read(reader), reader));
        }
        recomputeInitiallyAndOnChange(store, handleValue) {
            store.add(_recomputeInitiallyAndOnChange(this, handleValue));
            return this;
        }
        /**
         * Ensures that this observable is observed. This keeps the cache alive.
         * However, in case of deriveds, it does not force eager evaluation (only when the value is read/get).
         * Use `recomputeInitiallyAndOnChange` for eager evaluation.
         */
        keepObserved(store) {
            store.add(_keepObserved(this));
            return this;
        }
    }
    exports.ConvenientObservable = ConvenientObservable;
    class BaseObservable extends ConvenientObservable {
        constructor() {
            super(...arguments);
            this.observers = new Set();
        }
        addObserver(observer) {
            const len = this.observers.size;
            this.observers.add(observer);
            if (len === 0) {
                this.onFirstObserverAdded();
            }
        }
        removeObserver(observer) {
            const deleted = this.observers.delete(observer);
            if (deleted && this.observers.size === 0) {
                this.onLastObserverRemoved();
            }
        }
        onFirstObserverAdded() { }
        onLastObserverRemoved() { }
    }
    exports.BaseObservable = BaseObservable;
    /**
     * Starts a transaction in which many observables can be changed at once.
     * {@link fn} should start with a JS Doc using `@description` to give the transaction a debug name.
     * Reaction run on demand or when the transaction ends.
     */
    function transaction(fn, getDebugName) {
        const tx = new TransactionImpl(fn, getDebugName);
        try {
            fn(tx);
        }
        finally {
            tx.finish();
        }
    }
    let _globalTransaction = undefined;
    function globalTransaction(fn) {
        if (_globalTransaction) {
            fn(_globalTransaction);
        }
        else {
            const tx = new TransactionImpl(fn, undefined);
            _globalTransaction = tx;
            try {
                fn(tx);
            }
            finally {
                tx.finish(); // During finish, more actions might be added to the transaction.
                // Which is why we only clear the global transaction after finish.
                _globalTransaction = undefined;
            }
        }
    }
    async function asyncTransaction(fn, getDebugName) {
        const tx = new TransactionImpl(fn, getDebugName);
        try {
            await fn(tx);
        }
        finally {
            tx.finish();
        }
    }
    /**
     * Allows to chain transactions.
     */
    function subtransaction(tx, fn, getDebugName) {
        if (!tx) {
            transaction(fn, getDebugName);
        }
        else {
            fn(tx);
        }
    }
    class TransactionImpl {
        constructor(_fn, _getDebugName) {
            this._fn = _fn;
            this._getDebugName = _getDebugName;
            this.updatingObservers = [];
            (0, logging_1.getLogger)()?.handleBeginTransaction(this);
        }
        getDebugName() {
            if (this._getDebugName) {
                return this._getDebugName();
            }
            return (0, debugName_1.getFunctionName)(this._fn);
        }
        updateObserver(observer, observable) {
            // When this gets called while finish is active, they will still get considered
            this.updatingObservers.push({ observer, observable });
            observer.beginUpdate(observable);
        }
        finish() {
            const updatingObservers = this.updatingObservers;
            for (let i = 0; i < updatingObservers.length; i++) {
                const { observer, observable } = updatingObservers[i];
                observer.endUpdate(observable);
            }
            // Prevent anyone from updating observers from now on.
            this.updatingObservers = null;
            (0, logging_1.getLogger)()?.handleEndTransaction();
        }
    }
    exports.TransactionImpl = TransactionImpl;
    function observableValue(nameOrOwner, initialValue) {
        if (typeof nameOrOwner === 'string') {
            return new ObservableValue(undefined, nameOrOwner, initialValue);
        }
        else {
            return new ObservableValue(nameOrOwner, undefined, initialValue);
        }
    }
    class ObservableValue extends BaseObservable {
        get debugName() {
            return new debugName_1.DebugNameData(this._owner, this._debugName, undefined).getDebugName(this) ?? 'ObservableValue';
        }
        constructor(_owner, _debugName, initialValue) {
            super();
            this._owner = _owner;
            this._debugName = _debugName;
            this._value = initialValue;
        }
        get() {
            return this._value;
        }
        set(value, tx, change) {
            if (this._value === value) {
                return;
            }
            let _tx;
            if (!tx) {
                tx = _tx = new TransactionImpl(() => { }, () => `Setting ${this.debugName}`);
            }
            try {
                const oldValue = this._value;
                this._setValue(value);
                (0, logging_1.getLogger)()?.handleObservableChanged(this, { oldValue, newValue: value, change, didChange: true, hadValue: true });
                for (const observer of this.observers) {
                    tx.updateObserver(observer, this);
                    observer.handleChange(this, change);
                }
            }
            finally {
                if (_tx) {
                    _tx.finish();
                }
            }
        }
        toString() {
            return `${this.debugName}: ${this._value}`;
        }
        _setValue(newValue) {
            this._value = newValue;
        }
    }
    exports.ObservableValue = ObservableValue;
    /**
     * A disposable observable. When disposed, its value is also disposed.
     * When a new value is set, the previous value is disposed.
     */
    function disposableObservableValue(nameOrOwner, initialValue) {
        if (typeof nameOrOwner === 'string') {
            return new DisposableObservableValue(undefined, nameOrOwner, initialValue);
        }
        else {
            return new DisposableObservableValue(nameOrOwner, undefined, initialValue);
        }
    }
    class DisposableObservableValue extends ObservableValue {
        _setValue(newValue) {
            if (this._value === newValue) {
                return;
            }
            if (this._value) {
                this._value.dispose();
            }
            this._value = newValue;
        }
        dispose() {
            this._value?.dispose();
        }
    }
    exports.DisposableObservableValue = DisposableObservableValue;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vb2JzZXJ2YWJsZUludGVybmFsL2Jhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNkpoRyw4RUFFQztJQUdELDRDQUVDO0lBUUQsMENBRUM7SUFxR0Qsa0NBT0M7SUFJRCw4Q0FjQztJQUVELDRDQU9DO0lBS0Qsd0NBTUM7SUFnREQsMENBTUM7SUE2REQsOERBTUM7SUE3UkQsSUFBSSw4QkFBb0UsQ0FBQztJQUN6RSxTQUFnQixpQ0FBaUMsQ0FBQyw2QkFBb0U7UUFDckgsOEJBQThCLEdBQUcsNkJBQTZCLENBQUM7SUFDaEUsQ0FBQztJQUVELElBQUksYUFBa0MsQ0FBQztJQUN2QyxTQUFnQixnQkFBZ0IsQ0FBQyxZQUFrQztRQUNsRSxhQUFhLEdBQUcsWUFBWSxDQUFDO0lBQzlCLENBQUM7SUFHRCxJQUFJLFFBQTRCLENBQUM7SUFDakM7OztNQUdFO0lBQ0YsU0FBZ0IsZUFBZSxDQUFDLE9BQXdCO1FBQ3ZELFFBQVEsR0FBRyxPQUFPLENBQUM7SUFDcEIsQ0FBQztJQUVELE1BQXNCLG9CQUFvQjtRQUN6QyxJQUFJLE9BQU8sS0FBYyxPQUFPLElBQUssQ0FBQyxDQUFDLENBQUM7UUFJakMsYUFBYTtZQUNuQixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDWixDQUFDO1FBS0QsY0FBYztRQUNQLElBQUksQ0FBQyxNQUEyQjtZQUN0QyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDbkIsQ0FBQztRQUNGLENBQUM7UUFLTSxHQUFHLENBQU8sU0FB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