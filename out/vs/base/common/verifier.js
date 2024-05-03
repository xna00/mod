/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types"], function (require, exports, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectVerifier = exports.EnumVerifier = exports.SetVerifier = exports.NumberVerifier = exports.BooleanVerifier = void 0;
    exports.verifyObject = verifyObject;
    class Verifier {
        constructor(defaultValue) {
            this.defaultValue = defaultValue;
        }
        verify(value) {
            if (!this.isType(value)) {
                return this.defaultValue;
            }
            return value;
        }
    }
    class BooleanVerifier extends Verifier {
        isType(value) {
            return typeof value === 'boolean';
        }
    }
    exports.BooleanVerifier = BooleanVerifier;
    class NumberVerifier extends Verifier {
        isType(value) {
            return typeof value === 'number';
        }
    }
    exports.NumberVerifier = NumberVerifier;
    class SetVerifier extends Verifier {
        isType(value) {
            return value instanceof Set;
        }
    }
    exports.SetVerifier = SetVerifier;
    class EnumVerifier extends Verifier {
        constructor(defaultValue, allowedValues) {
            super(defaultValue);
            this.allowedValues = allowedValues;
        }
        isType(value) {
            return this.allowedValues.includes(value);
        }
    }
    exports.EnumVerifier = EnumVerifier;
    class ObjectVerifier extends Verifier {
        constructor(defaultValue, verifier) {
            super(defaultValue);
            this.verifier = verifier;
        }
        verify(value) {
            if (!this.isType(value)) {
                return this.defaultValue;
            }
            return verifyObject(this.verifier, value);
        }
        isType(value) {
            return (0, types_1.isObject)(value);
        }
    }
    exports.ObjectVerifier = ObjectVerifier;
    function verifyObject(verifiers, value) {
        const result = Object.create(null);
        for (const key in verifiers) {
            if (Object.hasOwnProperty.call(verifiers, key)) {
                const verifier = verifiers[key];
                result[key] = verifier.verify(value[key]);
            }
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZpZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3ZlcmlmaWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdFaEcsb0NBV0M7SUEzRUQsTUFBZSxRQUFRO1FBRXRCLFlBQStCLFlBQWU7WUFBZixpQkFBWSxHQUFaLFlBQVksQ0FBRztRQUFJLENBQUM7UUFFbkQsTUFBTSxDQUFDLEtBQWM7WUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQzFCLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7S0FHRDtJQUVELE1BQWEsZUFBZ0IsU0FBUSxRQUFpQjtRQUMzQyxNQUFNLENBQUMsS0FBYztZQUM5QixPQUFPLE9BQU8sS0FBSyxLQUFLLFNBQVMsQ0FBQztRQUNuQyxDQUFDO0tBQ0Q7SUFKRCwwQ0FJQztJQUVELE1BQWEsY0FBZSxTQUFRLFFBQWdCO1FBQ3pDLE1BQU0sQ0FBQyxLQUFjO1lBQzlCLE9BQU8sT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDO1FBQ2xDLENBQUM7S0FDRDtJQUpELHdDQUlDO0lBRUQsTUFBYSxXQUFlLFNBQVEsUUFBZ0I7UUFDekMsTUFBTSxDQUFDLEtBQWM7WUFDOUIsT0FBTyxLQUFLLFlBQVksR0FBRyxDQUFDO1FBQzdCLENBQUM7S0FDRDtJQUpELGtDQUlDO0lBRUQsTUFBYSxZQUFnQixTQUFRLFFBQVc7UUFHL0MsWUFBWSxZQUFlLEVBQUUsYUFBK0I7WUFDM0QsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1FBQ3BDLENBQUM7UUFFUyxNQUFNLENBQUMsS0FBYztZQUM5QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEtBQVUsQ0FBQyxDQUFDO1FBQ2hELENBQUM7S0FDRDtJQVhELG9DQVdDO0lBRUQsTUFBYSxjQUFpQyxTQUFRLFFBQVc7UUFFaEUsWUFBWSxZQUFlLEVBQW1CLFFBQTZDO1lBQzFGLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUR5QixhQUFRLEdBQVIsUUFBUSxDQUFxQztRQUUzRixDQUFDO1FBRVEsTUFBTSxDQUFDLEtBQWM7WUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQzFCLENBQUM7WUFDRCxPQUFPLFlBQVksQ0FBSSxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFUyxNQUFNLENBQUMsS0FBYztZQUM5QixPQUFPLElBQUEsZ0JBQVEsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUN4QixDQUFDO0tBQ0Q7SUFoQkQsd0NBZ0JDO0lBRUQsU0FBZ0IsWUFBWSxDQUFtQixTQUE4QyxFQUFFLEtBQWE7UUFDM0csTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVuQyxLQUFLLE1BQU0sR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQzdCLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUUsS0FBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDcEQsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUMifQ==