/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/lifecycle", "vs/base/common/observableInternal/base", "vs/base/common/observableInternal/debugName", "vs/base/common/observableInternal/logging"], function (require, exports, assert_1, lifecycle_1, base_1, debugName_1, logging_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Derived = exports.defaultEqualityComparer = void 0;
    exports.derived = derived;
    exports.derivedOpts = derivedOpts;
    exports.derivedHandleChanges = derivedHandleChanges;
    exports.derivedWithStore = derivedWithStore;
    exports.derivedDisposable = derivedDisposable;
    const defaultEqualityComparer = (a, b) => a === b;
    exports.defaultEqualityComparer = defaultEqualityComparer;
    function derived(computeFnOrOwner, computeFn) {
        if (computeFn !== undefined) {
            return new Derived(new debugName_1.DebugNameData(computeFnOrOwner, undefined, computeFn), computeFn, undefined, undefined, undefined, exports.defaultEqualityComparer);
        }
        return new Derived(new debugName_1.DebugNameData(undefined, undefined, computeFnOrOwner), computeFnOrOwner, undefined, undefined, undefined, exports.defaultEqualityComparer);
    }
    function derivedOpts(options, computeFn) {
        return new Derived(new debugName_1.DebugNameData(options.owner, options.debugName, options.debugReferenceFn), computeFn, undefined, undefined, options.onLastObserverRemoved, options.equalityComparer ?? exports.defaultEqualityComparer);
    }
    (0, base_1._setDerivedOpts)(derivedOpts);
    /**
     * Represents an observable that is derived from other observables.
     * The value is only recomputed when absolutely needed.
     *
     * {@link computeFn} should start with a JS Doc using `@description` to name the derived.
     *
     * Use `createEmptyChangeSummary` to create a "change summary" that can collect the changes.
     * Use `handleChange` to add a reported change to the change summary.
     * The compute function is given the last change summary.
     * The change summary is discarded after the compute function was called.
     *
     * @see derived
     */
    function derivedHandleChanges(options, computeFn) {
        return new Derived(new debugName_1.DebugNameData(options.owner, options.debugName, undefined), computeFn, options.createEmptyChangeSummary, options.handleChange, undefined, options.equalityComparer ?? exports.defaultEqualityComparer);
    }
    function derivedWithStore(computeFnOrOwner, computeFnOrUndefined) {
        let computeFn;
        let owner;
        if (computeFnOrUndefined === undefined) {
            computeFn = computeFnOrOwner;
            owner = undefined;
        }
        else {
            owner = computeFnOrOwner;
            computeFn = computeFnOrUndefined;
        }
        const store = new lifecycle_1.DisposableStore();
        return new Derived(new debugName_1.DebugNameData(owner, undefined, computeFn), r => {
            store.clear();
            return computeFn(r, store);
        }, undefined, undefined, () => store.dispose(), exports.defaultEqualityComparer);
    }
    function derivedDisposable(computeFnOrOwner, computeFnOrUndefined) {
        let computeFn;
        let owner;
        if (computeFnOrUndefined === undefined) {
            computeFn = computeFnOrOwner;
            owner = undefined;
        }
        else {
            owner = computeFnOrOwner;
            computeFn = computeFnOrUndefined;
        }
        const store = new lifecycle_1.DisposableStore();
        return new Derived(new debugName_1.DebugNameData(owner, undefined, computeFn), r => {
            store.clear();
            const result = computeFn(r);
            if (result) {
                store.add(result);
            }
            return result;
        }, undefined, undefined, () => store.dispose(), exports.defaultEqualityComparer);
    }
    var DerivedState;
    (function (DerivedState) {
        /** Initial state, no previous value, recomputation needed */
        DerivedState[DerivedState["initial"] = 0] = "initial";
        /**
         * A dependency could have changed.
         * We need to explicitly ask them if at least one dependency changed.
         */
        DerivedState[DerivedState["dependenciesMightHaveChanged"] = 1] = "dependenciesMightHaveChanged";
        /**
         * A dependency changed and we need to recompute.
         * After recomputation, we need to check the previous value to see if we changed as well.
         */
        DerivedState[DerivedState["stale"] = 2] = "stale";
        /**
         * No change reported, our cached value is up to date.
         */
        DerivedState[DerivedState["upToDate"] = 3] = "upToDate";
    })(DerivedState || (DerivedState = {}));
    class Derived extends base_1.BaseObservable {
        get debugName() {
            return this._debugNameData.getDebugName(this) ?? '(anonymous)';
        }
        constructor(_debugNameData, _computeFn, createChangeSummary, _handleChange, _handleLastObserverRemoved = undefined, _equalityComparator) {
            super();
            this._debugNameData = _debugNameData;
            this._computeFn = _computeFn;
            this.createChangeSummary = createChangeSummary;
            this._handleChange = _handleChange;
            this._handleLastObserverRemoved = _handleLastObserverRemoved;
            this._equalityComparator = _equalityComparator;
            this.state = 0 /* DerivedState.initial */;
            this.value = undefined;
            this.updateCount = 0;
            this.dependencies = new Set();
            this.dependenciesToBeRemoved = new Set();
            this.changeSummary = undefined;
            this.changeSummary = this.createChangeSummary?.();
            (0, logging_1.getLogger)()?.handleDerivedCreated(this);
        }
        onLastObserverRemoved() {
            /**
             * We are not tracking changes anymore, thus we have to assume
             * that our cache is invalid.
             */
            this.state = 0 /* DerivedState.initial */;
            this.value = undefined;
            for (const d of this.dependencies) {
                d.removeObserver(this);
            }
            this.dependencies.clear();
            this._handleLastObserverRemoved?.();
        }
        get() {
            if (this.observers.size === 0) {
                // Without observers, we don't know when to clean up stuff.
                // Thus, we don't cache anything to prevent memory leaks.
                const result = this._computeFn(this, this.createChangeSummary?.());
                // Clear new dependencies
                this.onLastObserverRemoved();
                return result;
            }
            else {
                do {
                    // We might not get a notification for a dependency that changed while it is updating,
                    // thus we also have to ask all our depedencies if they changed in this case.
                    if (this.state === 1 /* DerivedState.dependenciesMightHaveChanged */) {
                        for (const d of this.dependencies) {
                            /** might call {@link handleChange} indirectly, which could make us stale */
                            d.reportChanges();
                            if (this.state === 2 /* DerivedState.stale */) {
                                // The other dependencies will refresh on demand, so early break
                                break;
                            }
                        }
                    }
                    // We called report changes of all dependencies.
                    // If we are still not stale, we can assume to be up to date again.
                    if (this.state === 1 /* DerivedState.dependenciesMightHaveChanged */) {
                        this.state = 3 /* DerivedState.upToDate */;
                    }
                    this._recomputeIfNeeded();
                    // In case recomputation changed one of our dependencies, we need to recompute again.
                } while (this.state !== 3 /* DerivedState.upToDate */);
                return this.value;
            }
        }
        _recomputeIfNeeded() {
            if (this.state === 3 /* DerivedState.upToDate */) {
                return;
            }
            const emptySet = this.dependenciesToBeRemoved;
            this.dependenciesToBeRemoved = this.dependencies;
            this.dependencies = emptySet;
            const hadValue = this.state !== 0 /* DerivedState.initial */;
            const oldValue = this.value;
            this.state = 3 /* DerivedState.upToDate */;
            const changeSummary = this.changeSummary;
            this.changeSummary = this.createChangeSummary?.();
            try {
                /** might call {@link handleChange} indirectly, which could invalidate us */
                this.value = this._computeFn(this, changeSummary);
            }
            finally {
                // We don't want our observed observables to think that they are (not even temporarily) not being observed.
                // Thus, we only unsubscribe from observables that are definitely not read anymore.
                for (const o of this.dependenciesToBeRemoved) {
                    o.removeObserver(this);
                }
                this.dependenciesToBeRemoved.clear();
            }
            const didChange = hadValue && !(this._equalityComparator(oldValue, this.value));
            (0, logging_1.getLogger)()?.handleDerivedRecomputed(this, {
                oldValue,
                newValue: this.value,
                change: undefined,
                didChange,
                hadValue,
            });
            if (didChange) {
                for (const r of this.observers) {
                    r.handleChange(this, undefined);
                }
            }
        }
        toString() {
            return `LazyDerived<${this.debugName}>`;
        }
        // IObserver Implementation
        beginUpdate(_observable) {
            this.updateCount++;
            const propagateBeginUpdate = this.updateCount === 1;
            if (this.state === 3 /* DerivedState.upToDate */) {
                this.state = 1 /* DerivedState.dependenciesMightHaveChanged */;
                // If we propagate begin update, that will already signal a possible change.
                if (!propagateBeginUpdate) {
                    for (const r of this.observers) {
                        r.handlePossibleChange(this);
                    }
                }
            }
            if (propagateBeginUpdate) {
                for (const r of this.observers) {
                    r.beginUpdate(this); // This signals a possible change
                }
            }
        }
        endUpdate(_observable) {
            this.updateCount--;
            if (this.updateCount === 0) {
                // End update could change the observer list.
                const observers = [...this.observers];
                for (const r of observers) {
                    r.endUpdate(this);
                }
            }
            (0, assert_1.assertFn)(() => this.updateCount >= 0);
        }
        handlePossibleChange(observable) {
            // In all other states, observers already know that we might have changed.
            if (this.state === 3 /* DerivedState.upToDate */ && this.dependencies.has(observable) && !this.dependenciesToBeRemoved.has(observable)) {
                this.state = 1 /* DerivedState.dependenciesMightHaveChanged */;
                for (const r of this.observers) {
                    r.handlePossibleChange(this);
                }
            }
        }
        handleChange(observable, change) {
            if (this.dependencies.has(observable) && !this.dependenciesToBeRemoved.has(observable)) {
                const shouldReact = this._handleChange ? this._handleChange({
                    changedObservable: observable,
                    change,
                    didChange: o => o === observable,
                }, this.changeSummary) : true;
                const wasUpToDate = this.state === 3 /* DerivedState.upToDate */;
                if (shouldReact && (this.state === 1 /* DerivedState.dependenciesMightHaveChanged */ || wasUpToDate)) {
                    this.state = 2 /* DerivedState.stale */;
                    if (wasUpToDate) {
                        for (const r of this.observers) {
                            r.handlePossibleChange(this);
                        }
                    }
                }
            }
        }
        // IReader Implementation
        readObservable(observable) {
            // Subscribe before getting the value to enable caching
            observable.addObserver(this);
            /** This might call {@link handleChange} indirectly, which could invalidate us */
            const value = observable.get();
            // Which is why we only add the observable to the dependencies now.
            this.dependencies.add(observable);
            this.dependenciesToBeRemoved.delete(observable);
            return value;
        }
        addObserver(observer) {
            const shouldCallBeginUpdate = !this.observers.has(observer) && this.updateCount > 0;
            super.addObserver(observer);
            if (shouldCallBeginUpdate) {
                observer.beginUpdate(this);
            }
        }
        removeObserver(observer) {
            const shouldCallEndUpdate = this.observers.has(observer) && this.updateCount > 0;
            super.removeObserver(observer);
            if (shouldCallEndUpdate) {
                // Calling end update after removing the observer makes sure endUpdate cannot be called twice here.
                observer.endUpdate(this);
            }
        }
    }
    exports.Derived = Derived;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVyaXZlZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vb2JzZXJ2YWJsZUludGVybmFsL2Rlcml2ZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUJoRywwQkFtQkM7SUFFRCxrQ0FlQztJQWlCRCxvREFnQkM7SUFJRCw0Q0FzQkM7SUFJRCw4Q0EwQkM7SUF2SU0sTUFBTSx1QkFBdUIsR0FBMEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQW5FLFFBQUEsdUJBQXVCLDJCQUE0QztJQVVoRixTQUFnQixPQUFPLENBQUksZ0JBQW1ELEVBQUUsU0FBZ0Q7UUFDL0gsSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDN0IsT0FBTyxJQUFJLE9BQU8sQ0FDakIsSUFBSSx5QkFBYSxDQUFDLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFDekQsU0FBUyxFQUNULFNBQVMsRUFDVCxTQUFTLEVBQ1QsU0FBUyxFQUNULCtCQUF1QixDQUN2QixDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sSUFBSSxPQUFPLENBQ2pCLElBQUkseUJBQWEsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLGdCQUF1QixDQUFDLEVBQ2hFLGdCQUF1QixFQUN2QixTQUFTLEVBQ1QsU0FBUyxFQUNULFNBQVMsRUFDVCwrQkFBdUIsQ0FDdkIsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFnQixXQUFXLENBQzFCLE9BR0MsRUFDRCxTQUFpQztRQUVqQyxPQUFPLElBQUksT0FBTyxDQUNqQixJQUFJLHlCQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUM3RSxTQUFT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