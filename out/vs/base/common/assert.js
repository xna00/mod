/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors"], function (require, exports, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ok = ok;
    exports.assertNever = assertNever;
    exports.assert = assert;
    exports.softAssert = softAssert;
    exports.assertFn = assertFn;
    exports.checkAdjacentItems = checkAdjacentItems;
    /**
     * Throws an error with the provided message if the provided value does not evaluate to a true Javascript value.
     *
     * @deprecated Use `assert(...)` instead.
     * This method is usually used like this:
     * ```ts
     * import * as assert from 'vs/base/common/assert';
     * assert.ok(...);
     * ```
     *
     * However, `assert` in that example is a user chosen name.
     * There is no tooling for generating such an import statement.
     * Thus, the `assert(...)` function should be used instead.
     */
    function ok(value, message) {
        if (!value) {
            throw new Error(message ? `Assertion failed (${message})` : 'Assertion Failed');
        }
    }
    function assertNever(value, message = 'Unreachable') {
        throw new Error(message);
    }
    function assert(condition) {
        if (!condition) {
            throw new errors_1.BugIndicatingError('Assertion Failed');
        }
    }
    /**
     * Like assert, but doesn't throw.
     */
    function softAssert(condition) {
        if (!condition) {
            (0, errors_1.onUnexpectedError)(new errors_1.BugIndicatingError('Soft Assertion Failed'));
        }
    }
    /**
     * condition must be side-effect free!
     */
    function assertFn(condition) {
        if (!condition()) {
            // eslint-disable-next-line no-debugger
            debugger;
            // Reevaluate `condition` again to make debugging easier
            condition();
            (0, errors_1.onUnexpectedError)(new errors_1.BugIndicatingError('Assertion Failed'));
        }
    }
    function checkAdjacentItems(items, predicate) {
        let i = 0;
        while (i < items.length - 1) {
            const a = items[i];
            const b = items[i + 1];
            if (!predicate(a, b)) {
                return false;
            }
            i++;
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9hc3NlcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLGdCQUlDO0lBRUQsa0NBRUM7SUFFRCx3QkFJQztJQUtELGdDQUlDO0lBS0QsNEJBUUM7SUFFRCxnREFXQztJQS9ERDs7Ozs7Ozs7Ozs7OztPQWFHO0lBQ0gsU0FBZ0IsRUFBRSxDQUFDLEtBQWUsRUFBRSxPQUFnQjtRQUNuRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWixNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMscUJBQXFCLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pGLENBQUM7SUFDRixDQUFDO0lBRUQsU0FBZ0IsV0FBVyxDQUFDLEtBQVksRUFBRSxPQUFPLEdBQUcsYUFBYTtRQUNoRSxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxTQUFnQixNQUFNLENBQUMsU0FBa0I7UUFDeEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2hCLE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2xELENBQUM7SUFDRixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixVQUFVLENBQUMsU0FBa0I7UUFDNUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2hCLElBQUEsMEJBQWlCLEVBQUMsSUFBSSwyQkFBa0IsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQztJQUNGLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQWdCLFFBQVEsQ0FBQyxTQUF3QjtRQUNoRCxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQztZQUNsQix1Q0FBdUM7WUFDdkMsUUFBUSxDQUFDO1lBQ1Qsd0RBQXdEO1lBQ3hELFNBQVMsRUFBRSxDQUFDO1lBQ1osSUFBQSwwQkFBaUIsRUFBQyxJQUFJLDJCQUFrQixDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQWdCLGtCQUFrQixDQUFJLEtBQW1CLEVBQUUsU0FBMEM7UUFDcEcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1YsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkIsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN2QixJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN0QixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxDQUFDLEVBQUUsQ0FBQztRQUNMLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMifQ==