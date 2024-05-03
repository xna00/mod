/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.memoize = memoize;
    exports.debounce = debounce;
    exports.throttle = throttle;
    function createDecorator(mapFn) {
        return (target, key, descriptor) => {
            let fnKey = null;
            let fn = null;
            if (typeof descriptor.value === 'function') {
                fnKey = 'value';
                fn = descriptor.value;
            }
            else if (typeof descriptor.get === 'function') {
                fnKey = 'get';
                fn = descriptor.get;
            }
            if (!fn) {
                throw new Error('not supported');
            }
            descriptor[fnKey] = mapFn(fn, key);
        };
    }
    function memoize(_target, key, descriptor) {
        let fnKey = null;
        let fn = null;
        if (typeof descriptor.value === 'function') {
            fnKey = 'value';
            fn = descriptor.value;
            if (fn.length !== 0) {
                console.warn('Memoize should only be used in functions with zero parameters');
            }
        }
        else if (typeof descriptor.get === 'function') {
            fnKey = 'get';
            fn = descriptor.get;
        }
        if (!fn) {
            throw new Error('not supported');
        }
        const memoizeKey = `$memoize$${key}`;
        descriptor[fnKey] = function (...args) {
            if (!this.hasOwnProperty(memoizeKey)) {
                Object.defineProperty(this, memoizeKey, {
                    configurable: false,
                    enumerable: false,
                    writable: false,
                    value: fn.apply(this, args)
                });
            }
            return this[memoizeKey];
        };
    }
    function debounce(delay, reducer, initialValueProvider) {
        return createDecorator((fn, key) => {
            const timerKey = `$debounce$${key}`;
            const resultKey = `$debounce$result$${key}`;
            return function (...args) {
                if (!this[resultKey]) {
                    this[resultKey] = initialValueProvider ? initialValueProvider() : undefined;
                }
                clearTimeout(this[timerKey]);
                if (reducer) {
                    this[resultKey] = reducer(this[resultKey], ...args);
                    args = [this[resultKey]];
                }
                this[timerKey] = setTimeout(() => {
                    fn.apply(this, args);
                    this[resultKey] = initialValueProvider ? initialValueProvider() : undefined;
                }, delay);
            };
        });
    }
    function throttle(delay, reducer, initialValueProvider) {
        return createDecorator((fn, key) => {
            const timerKey = `$throttle$timer$${key}`;
            const resultKey = `$throttle$result$${key}`;
            const lastRunKey = `$throttle$lastRun$${key}`;
            const pendingKey = `$throttle$pending$${key}`;
            return function (...args) {
                if (!this[resultKey]) {
                    this[resultKey] = initialValueProvider ? initialValueProvider() : undefined;
                }
                if (this[lastRunKey] === null || this[lastRunKey] === undefined) {
                    this[lastRunKey] = -Number.MAX_VALUE;
                }
                if (reducer) {
                    this[resultKey] = reducer(this[resultKey], ...args);
                }
                if (this[pendingKey]) {
                    return;
                }
                const nextTime = this[lastRunKey] + delay;
                if (nextTime <= Date.now()) {
                    this[lastRunKey] = Date.now();
                    fn.apply(this, [this[resultKey]]);
                    this[resultKey] = initialValueProvider ? initialValueProvider() : undefined;
                }
                else {
                    this[pendingKey] = true;
                    this[timerKey] = setTimeout(() => {
                        this[pendingKey] = false;
                        this[lastRunKey] = Date.now();
                        fn.apply(this, [this[resultKey]]);
                        this[resultKey] = initialValueProvider ? initialValueProvider() : undefined;
                    }, nextTime - Date.now());
                }
            };
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vZGVjb3JhdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXVCaEcsMEJBaUNDO0lBTUQsNEJBdUJDO0lBRUQsNEJBdUNDO0lBNUhELFNBQVMsZUFBZSxDQUFDLEtBQThDO1FBQ3RFLE9BQU8sQ0FBQyxNQUFXLEVBQUUsR0FBVyxFQUFFLFVBQWUsRUFBRSxFQUFFO1lBQ3BELElBQUksS0FBSyxHQUFrQixJQUFJLENBQUM7WUFDaEMsSUFBSSxFQUFFLEdBQW9CLElBQUksQ0FBQztZQUUvQixJQUFJLE9BQU8sVUFBVSxDQUFDLEtBQUssS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDNUMsS0FBSyxHQUFHLE9BQU8sQ0FBQztnQkFDaEIsRUFBRSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFDdkIsQ0FBQztpQkFBTSxJQUFJLE9BQU8sVUFBVSxDQUFDLEdBQUcsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDakQsS0FBSyxHQUFHLEtBQUssQ0FBQztnQkFDZCxFQUFFLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQztZQUNyQixDQUFDO1lBRUQsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNULE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDbEMsQ0FBQztZQUVELFVBQVUsQ0FBQyxLQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFnQixPQUFPLENBQUMsT0FBWSxFQUFFLEdBQVcsRUFBRSxVQUFlO1FBQ2pFLElBQUksS0FBSyxHQUFrQixJQUFJLENBQUM7UUFDaEMsSUFBSSxFQUFFLEdBQW9CLElBQUks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