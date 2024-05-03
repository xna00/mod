/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isString = isString;
    exports.isStringArray = isStringArray;
    exports.isObject = isObject;
    exports.isTypedArray = isTypedArray;
    exports.isNumber = isNumber;
    exports.isIterable = isIterable;
    exports.isBoolean = isBoolean;
    exports.isUndefined = isUndefined;
    exports.isDefined = isDefined;
    exports.isUndefinedOrNull = isUndefinedOrNull;
    exports.assertType = assertType;
    exports.assertIsDefined = assertIsDefined;
    exports.assertAllDefined = assertAllDefined;
    exports.isEmptyObject = isEmptyObject;
    exports.isFunction = isFunction;
    exports.areFunctions = areFunctions;
    exports.validateConstraints = validateConstraints;
    exports.validateConstraint = validateConstraint;
    /**
     * @returns whether the provided parameter is a JavaScript String or not.
     */
    function isString(str) {
        return (typeof str === 'string');
    }
    /**
     * @returns whether the provided parameter is a JavaScript Array and each element in the array is a string.
     */
    function isStringArray(value) {
        return Array.isArray(value) && value.every(elem => isString(elem));
    }
    /**
     * @returns whether the provided parameter is of type `object` but **not**
     *	`null`, an `array`, a `regexp`, nor a `date`.
     */
    function isObject(obj) {
        // The method can't do a type cast since there are type (like strings) which
        // are subclasses of any put not positvely matched by the function. Hence type
        // narrowing results in wrong results.
        return typeof obj === 'object'
            && obj !== null
            && !Array.isArray(obj)
            && !(obj instanceof RegExp)
            && !(obj instanceof Date);
    }
    /**
     * @returns whether the provided parameter is of type `Buffer` or Uint8Array dervived type
     */
    function isTypedArray(obj) {
        const TypedArray = Object.getPrototypeOf(Uint8Array);
        return typeof obj === 'object'
            && obj instanceof TypedArray;
    }
    /**
     * In **contrast** to just checking `typeof` this will return `false` for `NaN`.
     * @returns whether the provided parameter is a JavaScript Number or not.
     */
    function isNumber(obj) {
        return (typeof obj === 'number' && !isNaN(obj));
    }
    /**
     * @returns whether the provided parameter is an Iterable, casting to the given generic
     */
    function isIterable(obj) {
        return !!obj && typeof obj[Symbol.iterator] === 'function';
    }
    /**
     * @returns whether the provided parameter is a JavaScript Boolean or not.
     */
    function isBoolean(obj) {
        return (obj === true || obj === false);
    }
    /**
     * @returns whether the provided parameter is undefined.
     */
    function isUndefined(obj) {
        return (typeof obj === 'undefined');
    }
    /**
     * @returns whether the provided parameter is defined.
     */
    function isDefined(arg) {
        return !isUndefinedOrNull(arg);
    }
    /**
     * @returns whether the provided parameter is undefined or null.
     */
    function isUndefinedOrNull(obj) {
        return (isUndefined(obj) || obj === null);
    }
    function assertType(condition, type) {
        if (!condition) {
            throw new Error(type ? `Unexpected type, expected '${type}'` : 'Unexpected type');
        }
    }
    /**
     * Asserts that the argument passed in is neither undefined nor null.
     */
    function assertIsDefined(arg) {
        if (isUndefinedOrNull(arg)) {
            throw new Error('Assertion Failed: argument is undefined or null');
        }
        return arg;
    }
    function assertAllDefined(...args) {
        const result = [];
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (isUndefinedOrNull(arg)) {
                throw new Error(`Assertion Failed: argument at index ${i} is undefined or null`);
            }
            result.push(arg);
        }
        return result;
    }
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    /**
     * @returns whether the provided parameter is an empty JavaScript Object or not.
     */
    function isEmptyObject(obj) {
        if (!isObject(obj)) {
            return false;
        }
        for (const key in obj) {
            if (hasOwnProperty.call(obj, key)) {
                return false;
            }
        }
        return true;
    }
    /**
     * @returns whether the provided parameter is a JavaScript Function or not.
     */
    function isFunction(obj) {
        return (typeof obj === 'function');
    }
    /**
     * @returns whether the provided parameters is are JavaScript Function or not.
     */
    function areFunctions(...objects) {
        return objects.length > 0 && objects.every(isFunction);
    }
    function validateConstraints(args, constraints) {
        const len = Math.min(args.length, constraints.length);
        for (let i = 0; i < len; i++) {
            validateConstraint(args[i], constraints[i]);
        }
    }
    function validateConstraint(arg, constraint) {
        if (isString(constraint)) {
            if (typeof arg !== constraint) {
                throw new Error(`argument does not match constraint: typeof ${constraint}`);
            }
        }
        else if (isFunction(constraint)) {
            try {
                if (arg instanceof constraint) {
                    return;
                }
            }
            catch {
                // ignore
            }
            if (!isUndefinedOrNull(arg) && arg.constructor === constraint) {
                return;
            }
            if (constraint.length === 1 && constraint.call(undefined, arg) === true) {
                return;
            }
            throw new Error(`argument does not match one of these constraints: arg instanceof constraint, arg.constructor === constraint, nor constraint(arg) === true`);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3R5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBS2hHLDRCQUVDO0lBS0Qsc0NBRUM7SUFNRCw0QkFTQztJQUtELG9DQUlDO0lBTUQsNEJBRUM7SUFLRCxnQ0FFQztJQUtELDhCQUVDO0lBS0Qsa0NBRUM7SUFLRCw4QkFFQztJQUtELDhDQUVDO0lBR0QsZ0NBSUM7SUFLRCwwQ0FNQztJQVFELDRDQWNDO0lBT0Qsc0NBWUM7SUFLRCxnQ0FFQztJQUtELG9DQUVDO0lBSUQsa0RBS0M7SUFFRCxnREFzQkM7SUF6TEQ7O09BRUc7SUFDSCxTQUFnQixRQUFRLENBQUMsR0FBWTtRQUNwQyxPQUFPLENBQUMsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0IsYUFBYSxDQUFDLEtBQWM7UUFDM0MsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFnQixLQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDakYsQ0FBQztJQUVEOzs7T0FHRztJQUNILFNBQWdCLFFBQVEsQ0FBQyxHQUFZO1FBQ3BDLDRFQUE0RTtRQUM1RSw4RUFBOEU7UUFDOUUsc0NBQXNDO1FBQ3RDLE9BQU8sT0FBTyxHQUFHLEtBQUssUUFBUTtlQUMxQixHQUFHLEtBQUssSUFBSTtlQUNaLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7ZUFDbkIsQ0FBQyxDQUFDLEdBQUcsWUFBWSxNQUFNLENBQUM7ZUFDeEIsQ0FBQyxDQUFDLEdBQUcsWUFBWSxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDO0lB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