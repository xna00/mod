define(["require", "exports", "vs/base/common/observableInternal/autorun", "./base", "vs/base/common/observableInternal/derived", "vs/base/common/cancellation", "vs/base/common/observableInternal/debugName"], function (require, exports, autorun_1, base_1, derived_1, cancellation_1, debugName_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObservableLazyPromise = exports.PromiseResult = exports.ObservablePromise = exports.ObservableLazy = void 0;
    exports.waitForState = waitForState;
    exports.derivedWithCancellationToken = derivedWithCancellationToken;
    class ObservableLazy {
        /**
         * The cached value.
         * Does not force a computation of the value.
         */
        get cachedValue() { return this._value; }
        constructor(_computeValue) {
            this._computeValue = _computeValue;
            this._value = (0, base_1.observableValue)(this, undefined);
        }
        /**
         * Returns the cached value.
         * Computes the value if the value has not been cached yet.
         */
        getValue() {
            let v = this._value.get();
            if (!v) {
                v = this._computeValue();
                this._value.set(v, undefined);
            }
            return v;
        }
    }
    exports.ObservableLazy = ObservableLazy;
    /**
     * A promise whose state is observable.
     */
    class ObservablePromise {
        constructor(promise) {
            this._value = (0, base_1.observableValue)(this, undefined);
            /**
             * The current state of the promise.
             * Is `undefined` if the promise didn't resolve yet.
             */
            this.promiseResult = this._value;
            this.promise = promise.then(value => {
                (0, base_1.transaction)(tx => {
                    /** @description onPromiseResolved */
                    this._value.set(new PromiseResult(value, undefined), tx);
                });
                return value;
            }, error => {
                (0, base_1.transaction)(tx => {
                    /** @description onPromiseRejected */
                    this._value.set(new PromiseResult(undefined, error), tx);
                });
                throw error;
            });
        }
    }
    exports.ObservablePromise = ObservablePromise;
    class PromiseResult {
        constructor(
        /**
         * The value of the resolved promise.
         * Undefined if the promise rejected.
         */
        data, 
        /**
         * The error in case of a rejected promise.
         * Undefined if the promise resolved.
         */
        error) {
            this.data = data;
            this.error = error;
        }
        /**
         * Returns the value if the promise resolved, otherwise throws the error.
         */
        getDataOrThrow() {
            if (this.error) {
                throw this.error;
            }
            return this.data;
        }
    }
    exports.PromiseResult = PromiseResult;
    /**
     * A lazy promise whose state is observable.
     */
    class ObservableLazyPromise {
        constructor(_computePromise) {
            this._computePromise = _computePromise;
            this._lazyValue = new ObservableLazy(() => new ObservablePromise(this._computePromise()));
            /**
             * Does not enforce evaluation of the promise compute function.
             * Is undefined if the promise has not been computed yet.
             */
            this.cachedPromiseResult = (0, derived_1.derived)(this, reader => this._lazyValue.cachedValue.read(reader)?.promiseResult.read(reader));
        }
        getPromise() {
            return this._lazyValue.getValue().promise;
        }
    }
    exports.ObservableLazyPromise = ObservableLazyPromise;
    function waitForState(observable, predicate, isError) {
        return new Promise((resolve, reject) => {
            let isImmediateRun = true;
            let shouldDispose = false;
            const stateObs = observable.map(state => {
                /** @description waitForState.state */
                return {
                    isFinished: predicate(state),
                    error: isError ? isError(state) : false,
                    state
                };
            });
            const d = (0, autorun_1.autorun)(reader => {
                /** @description waitForState */
                const { isFinished, error, state } = stateObs.read(reader);
                if (isFinished || error) {
                    if (isImmediateRun) {
                        // The variable `d` is not initialized yet
                        shouldDispose = true;
                    }
                    else {
                        d.dispose();
                    }
                    if (error) {
                        reject(error === true ? state : error);
                    }
                    else {
                        resolve(state);
                    }
                }
            });
            isImmediateRun = false;
            if (shouldDispose) {
                d.dispose();
            }
        });
    }
    function derivedWithCancellationToken(computeFnOrOwner, computeFnOrUndefined) {
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
        let cancellationTokenSource = undefined;
        return new derived_1.Derived(new debugName_1.DebugNameData(owner, undefined, computeFn), r => {
            if (cancellationTokenSource) {
                cancellationTokenSource.dispose(true);
            }
            cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            return computeFn(r, cancellationTokenSource.token);
        }, undefined, undefined, () => cancellationTokenSource?.dispose(), derived_1.defaultEqualityComparer);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvbWlzZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vb2JzZXJ2YWJsZUludGVybmFsL3Byb21pc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQTBIQSxvQ0FrQ0M7SUFJRCxvRUF5QkM7SUEvS0QsTUFBYSxjQUFjO1FBRzFCOzs7V0FHRztRQUNILElBQVcsV0FBVyxLQUFpQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBRTVFLFlBQTZCLGFBQXNCO1lBQXRCLGtCQUFhLEdBQWIsYUFBYSxDQUFTO1lBUmxDLFdBQU0sR0FBRyxJQUFBLHNCQUFlLEVBQWdCLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQVMxRSxDQUFDO1FBRUQ7OztXQUdHO1FBQ0ksUUFBUTtZQUNkLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNSLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMvQixDQUFDO1lBQ0QsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO0tBQ0Q7SUF4QkQsd0NBd0JDO0lBRUQ7O09BRUc7SUFDSCxNQUFhLGlCQUFpQjtRQWM3QixZQUFZLE9BQW1CO1lBYmQsV0FBTSxHQUFHLElBQUEsc0JBQWUsRUFBK0IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBT3pGOzs7ZUFHRztZQUNhLGtCQUFhLEdBQThDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFHdEYsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dC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