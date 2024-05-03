/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/common/resources", "vs/base/common/platform", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, resources_1, platform_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHost API', function () {
        test('issue #51387: originalFSPath', function () {
            if (platform_1.isWindows) {
                assert.strictEqual((0, resources_1.originalFSPath)(uri_1.URI.file('C:\\test')).charAt(0), 'C');
                assert.strictEqual((0, resources_1.originalFSPath)(uri_1.URI.file('c:\\test')).charAt(0), 'c');
                assert.strictEqual((0, resources_1.originalFSPath)(uri_1.URI.revive(JSON.parse(JSON.stringify(uri_1.URI.file('C:\\test'))))).charAt(0), 'C');
                assert.strictEqual((0, resources_1.originalFSPath)(uri_1.URI.revive(JSON.parse(JSON.stringify(uri_1.URI.file('c:\\test'))))).charAt(0), 'c');
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdC5hcGkuaW1wbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9leHRIb3N0LmFwaS5pbXBsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsS0FBSyxDQUFDLGFBQWEsRUFBRTtRQUNwQixJQUFJLENBQUMsOEJBQThCLEVBQUU7WUFDcEMsSUFBSSxvQkFBUyxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDBCQUFjLEVBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDeEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDBCQUFjLEVBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFFeEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDBCQUFjLEVBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDaEgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDBCQUFjLEVBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNqSCxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUMifQ==