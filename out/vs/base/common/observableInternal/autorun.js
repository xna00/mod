/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/lifecycle", "vs/base/common/observableInternal/debugName", "vs/base/common/observableInternal/logging"], function (require, exports, assert_1, lifecycle_1, debugName_1, logging_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AutorunObserver = void 0;
    exports.autorun = autorun;
    exports.autorunOpts = autorunOpts;
    exports.autorunHandleChanges = autorunHandleChanges;
    exports.autorunWithStoreHandleChanges = autorunWithStoreHandleChanges;
    exports.autorunWithStore = autorunWithStore;
    exports.autorunDelta = autorunDelta;
    /**
     * Runs immediately and whenever a transaction ends and an observed observable changed.
     * {@link fn} should start with a JS Doc using `@description` to name the autorun.
     */
    function autorun(fn) {
        return new AutorunObserver(new debugName_1.DebugNameData(undefined, undefined, fn), fn, undefined, undefined);
    }
    /**
     * Runs immediately and whenever a transaction ends and an observed observable changed.
     * {@link fn} should start with a JS Doc using `@description` to name the autorun.
     */
    function autorunOpts(options, fn) {
        return new AutorunObserver(new debugName_1.DebugNameData(options.owner, options.debugName, options.debugReferenceFn ?? fn), fn, undefined, undefined);
    }
    /**
     * Runs immediately and whenever a transaction ends and an observed observable changed.
     * {@link fn} should start with a JS Doc using `@description` to name the autorun.
     *
     * Use `createEmptyChangeSummary` to create a "change summary" that can collect the changes.
     * Use `handleChange` to add a reported change to the change summary.
     * The run function is given the last change summary.
     * The change summary is discarded after the run function was called.
     *
     * @see autorun
     */
    function autorunHandleChanges(options, fn) {
        return new AutorunObserver(new debugName_1.DebugNameData(options.owner, options.debugName, options.debugReferenceFn ?? fn), fn, options.createEmptyChangeSummary, options.handleChange);
    }
    /**
     * @see autorunHandleChanges (but with a disposable store that is cleared before the next run or on dispose)
     */
    function autorunWithStoreHandleChanges(options, fn) {
        const store = new lifecycle_1.DisposableStore();
        const disposable = autorunHandleChanges({
            owner: options.owner,
            debugName: options.debugName,
            debugReferenceFn: options.debugReferenceFn,
            createEmptyChangeSummary: options.createEmptyChangeSummary,
            handleChange: options.handleChange,
        }, (reader, changeSummary) => {
            store.clear();
            fn(reader, changeSummary, store);
        });
        return (0, lifecycle_1.toDisposable)(() => {
            disposable.dispose();
            store.dispose();
        });
    }
    /**
     * @see autorun (but with a disposable store that is cleared before the next run or on dispose)
     */
    function autorunWithStore(fn) {
        const store = new lifecycle_1.DisposableStore();
        const disposable = autorunOpts({
            owner: undefined,
            debugName: undefined,
            debugReferenceFn: fn,
        }, reader => {
            store.clear();
            fn(reader, store);
        });
        return (0, lifecycle_1.toDisposable)(() => {
            disposable.dispose();
            store.dispose();
        });
    }
    function autorunDelta(observable, handler) {
        let _lastValue;
        return autorunOpts({ debugReferenceFn: handler }, (reader) => {
            const newValue = observable.read(reader);
            const lastValue = _lastValue;
            _lastValue = newValue;
            handler({ lastValue, newValue });
        });
    }
    var AutorunState;
    (function (AutorunState) {
        /**
         * A dependency could have changed.
         * We need to explicitly ask them if at least one dependency changed.
         */
        AutorunState[AutorunState["dependenciesMightHaveChanged"] = 1] = "dependenciesMightHaveChanged";
        /**
         * A dependency changed and we need to recompute.
         */
        AutorunState[AutorunState["stale"] = 2] = "stale";
        AutorunState[AutorunState["upToDate"] = 3] = "upToDate";
    })(AutorunState || (AutorunState = {}));
    class AutorunObserver {
        get debugName() {
            return this._debugNameData.getDebugName(this) ?? '(anonymous)';
        }
        constructor(_debugNameData, _runFn, createChangeSummary, _handleChange) {
            this._debugNameData = _debugNameData;
            this._runFn = _runFn;
            this.createChangeSummary = createChangeSummary;
            this._handleChange = _handleChange;
            this.state = 2 /* AutorunState.stale */;
            this.updateCount = 0;
            this.disposed = false;
            this.dependencies = new Set();
            this.dependenciesToBeRemoved = new Set();
            this.changeSummary = this.createChangeSummary?.();
            (0, logging_1.getLogger)()?.handleAutorunCreated(this);
            this._runIfNeeded();
            (0, lifecycle_1.trackDisposable)(this);
        }
        dispose() {
            this.disposed = true;
            for (const o of this.dependencies) {
                o.removeObserver(this);
            }
            this.dependencies.clear();
            (0, lifecycle_1.markAsDisposed)(this);
        }
        _runIfNeeded() {
            if (this.state === 3 /* AutorunState.upToDate */) {
                return;
            }
            const emptySet = this.dependenciesToBeRemoved;
            this.dependenciesToBeRemoved = this.dependencies;
            this.dependencies = emptySet;
            this.state = 3 /* AutorunState.upToDate */;
            const isDisposed = this.disposed;
            try {
                if (!isDisposed) {
                    (0, logging_1.getLogger)()?.handleAutorunTriggered(this);
                    const changeSummary = this.changeSummary;
                    this.changeSummary = this.createChangeSummary?.();
                    this._runFn(this, changeSummary);
                }
            }
            finally {
                if (!isDisposed) {
                    (0, logging_1.getLogger)()?.handleAutorunFinished(this);
                }
                // We don't want our observed observables to think that they are (not even temporarily) not being observed.
                // Thus, we only unsubscribe from observables that are definitely not read anymore.
                for (const o of this.dependenciesToBeRemoved) {
                    o.removeObserver(this);
                }
                this.dependenciesToBeRemoved.clear();
            }
        }
        toString() {
            return `Autorun<${this.debugName}>`;
        }
        // IObserver implementation
        beginUpdate() {
            if (this.state === 3 /* AutorunState.upToDate */) {
                this.state = 1 /* AutorunState.dependenciesMightHaveChanged */;
            }
            this.updateCount++;
        }
        endUpdate() {
            if (this.updateCount === 1) {
                do {
                    if (this.state === 1 /* AutorunState.dependenciesMightHaveChanged */) {
                        this.state = 3 /* AutorunState.upToDate */;
                        for (const d of this.dependencies) {
                            d.reportChanges();
                            if (this.state === 2 /* AutorunState.stale */) {
                                // The other dependencies will refresh on demand
                                break;
                            }
                        }
                    }
                    this._runIfNeeded();
                } while (this.state !== 3 /* AutorunState.upToDate */);
            }
            this.updateCount--;
            (0, assert_1.assertFn)(() => this.updateCount >= 0);
        }
        handlePossibleChange(observable) {
            if (this.state === 3 /* AutorunState.upToDate */ && this.dependencies.has(observable) && !this.dependenciesToBeRemoved.has(observable)) {
                this.state = 1 /* AutorunState.dependenciesMightHaveChanged */;
            }
        }
        handleChange(observable, change) {
            if (this.dependencies.has(observable) && !this.dependenciesToBeRemoved.has(observable)) {
                const shouldReact = this._handleChange ? this._handleChange({
                    changedObservable: observable,
                    change,
                    didChange: o => o === observable,
                }, this.changeSummary) : true;
                if (shouldReact) {
                    this.state = 2 /* AutorunState.stale */;
                }
            }
        }
        // IReader implementation
        readObservable(observable) {
            // In case the run action disposes the autorun
            if (this.disposed) {
                return observable.get();
            }
            observable.addObserver(this);
            const value = observable.get();
            this.dependencies.add(observable);
            this.dependenciesToBeRemoved.delete(observable);
            return value;
        }
    }
    exports.AutorunObserver = AutorunObserver;
    (function (autorun) {
        autorun.Observer = AutorunObserver;
    })(autorun || (exports.autorun = autorun = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b3J1bi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vb2JzZXJ2YWJsZUludGVybmFsL2F1dG9ydW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLDBCQU9DO0lBTUQsa0NBT0M7SUFhRCxvREFhQztJQUtELHNFQXlCQztJQUtELDRDQWlCQztJQUVELG9DQVdDO0lBbkhEOzs7T0FHRztJQUNILFNBQWdCLE9BQU8sQ0FBQyxFQUE2QjtRQUNwRCxPQUFPLElBQUksZUFBZSxDQUN6QixJQUFJLHlCQUFhLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFDM0MsRUFBRSxFQUNGLFNBQVMsRUFDVCxTQUFTLENBQ1QsQ0FBQztJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSCxTQUFnQixXQUFXLENBQUMsT0FBNEIsRUFBRSxFQUE2QjtRQUN0RixPQUFPLElBQUksZUFBZSxDQUN6QixJQUFJLHlCQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFLENBQUMsRUFDbkYsRUFBRSxFQUNGLFNBQVMsRUFDVCxTQUFTLENBQ1QsQ0FBQztJQUNILENBQUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0gsU0FBZ0Isb0JBQW9CLENBQ25DLE9BR0MsRUFDRCxFQUE0RDtRQUU1RCxPQUFPLElBQUksZUFBZSxDQUN6QixJQUFJLHlCQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFLENBQUMsRUFDbkYsRUFBRSxFQUNGLE9BQU8sQ0FBQyx3QkFBd0IsRUFDaEMsT0FBTyxDQUFDLFlBQVksQ0FDcEIsQ0FBQztJQUNILENB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