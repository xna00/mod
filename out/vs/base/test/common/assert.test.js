/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/assert", "vs/base/test/common/utils"], function (require, exports, assert, assert_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Assert', () => {
        test('ok', () => {
            assert.throws(function () {
                (0, assert_1.ok)(false);
            });
            assert.throws(function () {
                (0, assert_1.ok)(null);
            });
            assert.throws(function () {
                (0, assert_1.ok)();
            });
            assert.throws(function () {
                (0, assert_1.ok)(null, 'Foo Bar');
            }, function (e) {
                return e.message.indexOf('Foo Bar') >= 0;
            });
            (0, assert_1.ok)(true);
            (0, assert_1.ok)('foo');
            (0, assert_1.ok)({});
            (0, assert_1.ok)(5);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vYXNzZXJ0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7UUFDcEIsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7WUFDZixNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUNiLElBQUEsV0FBRSxFQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUNiLElBQUEsV0FBRSxFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1YsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUNiLElBQUEsV0FBRSxHQUFFLENBQUM7WUFDTixDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxNQUFNLENBQUM7Z0JBQ2IsSUFBQSxXQUFFLEVBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3JCLENBQUMsRUFBRSxVQUFVLENBQVE7Z0JBQ3BCLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFDLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBQSxXQUFFLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFDVCxJQUFBLFdBQUUsRUFBQyxLQUFLLENBQUMsQ0FBQztZQUNWLElBQUEsV0FBRSxFQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ1AsSUFBQSxXQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9