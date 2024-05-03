/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/testing/common/testItemCollection"], function (require, exports, testItemCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getPrivateApiFor = exports.createPrivateApiFor = void 0;
    const eventPrivateApis = new WeakMap();
    const createPrivateApiFor = (impl, controllerId) => {
        const api = { controllerId };
        eventPrivateApis.set(impl, api);
        return api;
    };
    exports.createPrivateApiFor = createPrivateApiFor;
    /**
     * Gets the private API for a test item implementation. This implementation
     * is a managed object, but we keep a weakmap to avoid exposing any of the
     * internals to extensions.
     */
    const getPrivateApiFor = (impl) => {
        const api = eventPrivateApis.get(impl);
        if (!api) {
            throw new testItemCollection_1.InvalidTestItemError(impl?.id || '<unknown>');
        }
        return api;
    };
    exports.getPrivateApiFor = getPrivateApiFor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlc3RpbmdQcml2YXRlQXBpLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0VGVzdGluZ1ByaXZhdGVBcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxPQUFPLEVBQXdDLENBQUM7SUFFdEUsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLElBQXFCLEVBQUUsWUFBb0IsRUFBRSxFQUFFO1FBQ2xGLE1BQU0sR0FBRyxHQUF3QixFQUFFLFlBQVksRUFBRSxDQUFDO1FBQ2xELGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDaEMsT0FBTyxHQUFHLENBQUM7SUFDWixDQUFDLENBQUM7SUFKVyxRQUFBLG1CQUFtQix1QkFJOUI7SUFFRjs7OztPQUlHO0lBQ0ksTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLElBQXFCLEVBQUUsRUFBRTtRQUN6RCxNQUFNLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ1YsTUFBTSxJQUFJLHlDQUFvQixDQUFDLElBQUksRUFBRSxFQUFFLElBQUksV0FBVyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVELE9BQU8sR0FBRyxDQUFDO0lBQ1osQ0FBQyxDQUFDO0lBUFcsUUFBQSxnQkFBZ0Isb0JBTzNCIn0=