/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/errorMessage", "vs/base/test/common/utils"], function (require, exports, assert, errorMessage_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Errors', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Get Error Message', function () {
            assert.strictEqual((0, errorMessage_1.toErrorMessage)('Foo Bar'), 'Foo Bar');
            assert.strictEqual((0, errorMessage_1.toErrorMessage)(new Error('Foo Bar')), 'Foo Bar');
            let error = new Error();
            error = new Error();
            error.detail = {};
            error.detail.exception = {};
            error.detail.exception.message = 'Foo Bar';
            assert.strictEqual((0, errorMessage_1.toErrorMessage)(error), 'Foo Bar');
            assert.strictEqual((0, errorMessage_1.toErrorMessage)(error, true), 'Foo Bar');
            assert((0, errorMessage_1.toErrorMessage)());
            assert((0, errorMessage_1.toErrorMessage)(null));
            assert((0, errorMessage_1.toErrorMessage)({}));
            try {
                throw new Error();
            }
            catch (error) {
                assert.strictEqual((0, errorMessage_1.toErrorMessage)(error), 'An unknown error occurred. Please consult the log for more details.');
                assert.ok((0, errorMessage_1.toErrorMessage)(error, true).length > 'An unknown error occurred. Please consult the log for more details.'.length);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vZXJyb3JzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7UUFDcEIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUN6QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsNkJBQWMsRUFBQyxTQUFTLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsNkJBQWMsRUFBQyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXBFLElBQUksS0FBSyxHQUFRLElBQUksS0FBSyxFQUFFLENBQUM7WUFDN0IsS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7WUFDcEIsS0FBSyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDbEIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBQzVCLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7WUFDM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDckQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFjLEVBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRTNELE1BQU0sQ0FBQyxJQUFBLDZCQUFjLEdBQUUsQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sQ0FBQyxJQUFBLDZCQUFjLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsSUFBQSw2QkFBYyxFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFM0IsSUFBSSxDQUFDO2dCQUNKLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNuQixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLEVBQUUscUVBQXFFLENBQUMsQ0FBQztnQkFDakgsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFBLDZCQUFjLEVBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLE1BQU0sR0FBRyxxRUFBcUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5SCxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9