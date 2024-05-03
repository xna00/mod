/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/path", "vs/base/test/common/testUtils"], function (require, exports, extpath_1, path_1, testUtils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.flakySuite = void 0;
    exports.getRandomTestPath = getRandomTestPath;
    function getRandomTestPath(tmpdir, ...segments) {
        return (0, extpath_1.randomPath)((0, path_1.join)(tmpdir, ...segments));
    }
    exports.flakySuite = testUtils.flakySuite;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFV0aWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3Qvbm9kZS90ZXN0VXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLDhDQUVDO0lBRkQsU0FBZ0IsaUJBQWlCLENBQUMsTUFBYyxFQUFFLEdBQUcsUUFBa0I7UUFDdEUsT0FBTyxJQUFBLG9CQUFVLEVBQUMsSUFBQSxXQUFJLEVBQUMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBRWEsUUFBQSxVQUFVLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQyJ9