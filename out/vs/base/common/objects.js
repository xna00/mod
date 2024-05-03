/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types"], function (require, exports, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.deepClone = deepClone;
    exports.deepFreeze = deepFreeze;
    exports.cloneAndChange = cloneAndChange;
    exports.mixin = mixin;
    exports.equals = equals;
    exports.safeStringify = safeStringify;
    exports.distinct = distinct;
    exports.getCaseInsensitive = getCaseInsensitive;
    exports.filter = filter;
    exports.getAllPropertyNames = getAllPropertyNames;
    exports.getAllMethodNames = getAllMethodNames;
    exports.createProxyObject = createProxyObject;
    function deepClone(obj) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof RegExp) {
            return obj;
        }
        const result = Array.isArray(obj) ? [] : {};
        Object.entries(obj).forEach(([key, value]) => {
            result[key] = value && typeof value === 'object' ? deepClone(value) : value;
        });
        return result;
    }
    function deepFreeze(obj) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        const stack = [obj];
        while (stack.length > 0) {
            const obj = stack.shift();
            Object.freeze(obj);
            for (const key in obj) {
                if (_hasOwnProperty.call(obj, key)) {
                    const prop = obj[key];
                    if (typeof prop === 'object' && !Object.isFrozen(prop) && !(0, types_1.isTypedArray)(prop)) {
                        stack.push(prop);
                    }
                }
            }
        }
        return obj;
    }
    const _hasOwnProperty = Object.prototype.hasOwnProperty;
    function cloneAndChange(obj, changer) {
        return _cloneAndChange(obj, changer, new Set());
    }
    function _cloneAndChange(obj, changer, seen) {
        if ((0, types_1.isUndefinedOrNull)(obj)) {
            return obj;
        }
        const changed = changer(obj);
        if (typeof changed !== 'undefined') {
            return changed;
        }
        if (Array.isArray(obj)) {
            const r1 = [];
            for (const e of obj) {
                r1.push(_cloneAndChange(e, changer, seen));
            }
            return r1;
        }
        if ((0, types_1.isObject)(obj)) {
            if (seen.has(obj)) {
                throw new Error('Cannot clone recursive data-structure');
            }
            seen.add(obj);
            const r2 = {};
            for (const i2 in obj) {
                if (_hasOwnProperty.call(obj, i2)) {
                    r2[i2] = _cloneAndChange(obj[i2], changer, seen);
                }
            }
            seen.delete(obj);
            return r2;
        }
        return obj;
    }
    /**
     * Copies all properties of source into destination. The optional parameter "overwrite" allows to control
     * if existing properties on the destination should be overwritten or not. Defaults to true (overwrite).
     */
    function mixin(destination, source, overwrite = true) {
        if (!(0, types_1.isObject)(destination)) {
            return source;
        }
        if ((0, types_1.isObject)(source)) {
            Object.keys(source).forEach(key => {
                if (key in destination) {
                    if (overwrite) {
                        if ((0, types_1.isObject)(destination[key]) && (0, types_1.isObject)(source[key])) {
                            mixin(destination[key], source[key], overwrite);
                        }
                        else {
                            destination[key] = source[key];
                        }
                    }
                }
                else {
                    destination[key] = source[key];
                }
            });
        }
        return destination;
    }
    function equals(one, other) {
        if (one === other) {
            return true;
        }
        if (one === null || one === undefined || other === null || other === undefined) {
            return false;
        }
        if (typeof one !== typeof other) {
            return false;
        }
        if (typeof one !== 'object') {
            return false;
        }
        if ((Array.isArray(one)) !== (Array.isArray(other))) {
            return false;
        }
        let i;
        let key;
        if (Array.isArray(one)) {
            if (one.length !== other.length) {
                return false;
            }
            for (i = 0; i < one.length; i++) {
                if (!equals(one[i], other[i])) {
                    return false;
                }
            }
        }
        else {
            const oneKeys = [];
            for (key in one) {
                oneKeys.push(key);
            }
            oneKeys.sort();
            const otherKeys = [];
            for (key in other) {
                otherKeys.push(key);
            }
            otherKeys.sort();
            if (!equals(oneKeys, otherKeys)) {
                return false;
            }
            for (i = 0; i < oneKeys.length; i++) {
                if (!equals(one[oneKeys[i]], other[oneKeys[i]])) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Calls `JSON.Stringify` with a replacer to break apart any circular references.
     * This prevents `JSON`.stringify` from throwing the exception
     *  "Uncaught TypeError: Converting circular structure to JSON"
     */
    function safeStringify(obj) {
        const seen = new Set();
        return JSON.stringify(obj, (key, value) => {
            if ((0, types_1.isObject)(value) || Array.isArray(value)) {
                if (seen.has(value)) {
                    return '[Circular]';
                }
                else {
                    seen.add(value);
                }
            }
            return value;
        });
    }
    /**
     * Returns an object that has keys for each value that is different in the base object. Keys
     * that do not exist in the target but in the base object are not considered.
     *
     * Note: This is not a deep-diffing method, so the values are strictly taken into the resulting
     * object if they differ.
     *
     * @param base the object to diff against
     * @param obj the object to use for diffing
     */
    function distinct(base, target) {
        const result = Object.create(null);
        if (!base || !target) {
            return result;
        }
        const targetKeys = Object.keys(target);
        targetKeys.forEach(k => {
            const baseValue = base[k];
            const targetValue = target[k];
            if (!equals(baseValue, targetValue)) {
                result[k] = targetValue;
            }
        });
        return result;
    }
    function getCaseInsensitive(target, key) {
        const lowercaseKey = key.toLowerCase();
        const equivalentKey = Object.keys(target).find(k => k.toLowerCase() === lowercaseKey);
        return equivalentKey ? target[equivalentKey] : target[key];
    }
    function filter(obj, predicate) {
        const result = Object.create(null);
        for (const [key, value] of Object.entries(obj)) {
            if (predicate(key, value)) {
                result[key] = value;
            }
        }
        return result;
    }
    function getAllPropertyNames(obj) {
        let res = [];
        while (Object.prototype !== obj) {
            res = res.concat(Object.getOwnPropertyNames(obj));
            obj = Object.getPrototypeOf(obj);
        }
        return res;
    }
    function getAllMethodNames(obj) {
        const methods = [];
        for (const prop of getAllPropertyNames(obj)) {
            if (typeof obj[prop] === 'function') {
                methods.push(prop);
            }
        }
        return methods;
    }
    function createProxyObject(methodNames, invoke) {
        const createProxyMethod = (method) => {
            return function () {
                const args = Array.prototype.slice.call(arguments, 0);
                return invoke(method, args);
            };
        };
        const result = {};
        for (const methodName of methodNames) {
            result[methodName] = createProxyMethod(methodName);
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vb2JqZWN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQUloRyw4QkFZQztJQUVELGdDQWtCQztJQUtELHdDQUVDO0lBMENELHNCQXFCQztJQUVELHdCQW1EQztJQU9ELHNDQVlDO0lBYUQsNEJBa0JDO0lBRUQsZ0RBSUM7SUFFRCx3QkFRQztJQUVELGtEQU9DO0lBRUQsOENBUUM7SUFFRCw4Q0FhQztJQS9QRCxTQUFnQixTQUFTLENBQUksR0FBTTtRQUNsQyxJQUFJLENBQUMsR0FBRyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ3JDLE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUNELElBQUksR0FBRyxZQUFZLE1BQU0sRUFBRSxDQUFDO1lBQzNCLE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFRLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ2pELE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRTtZQUM1QyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDN0UsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFRCxTQUFnQixVQUFVLENBQUksR0FBTTtRQUNuQyxJQUFJLENB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