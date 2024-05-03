/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/node/unc", "vs/base/test/common/utils"], function (require, exports, assert_1, unc_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('UNC', () => {
        test('getUNCHost', () => {
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)(undefined), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)(null), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('/'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('/foo'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('c:'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('c:\\'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('c:\\foo'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('c:\\foo\\\\server\\path'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\localhost'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\localhost\\'), 'localhost');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\localhost\\a'), 'localhost');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\.'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\?'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\.\\localhost'), '.');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\?\\localhost'), '?');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\.\\UNC\\localhost'), '.');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\?\\UNC\\localhost'), '?');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\.\\UNC\\localhost\\'), 'localhost');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\?\\UNC\\localhost\\'), 'localhost');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\.\\UNC\\localhost\\a'), 'localhost');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\?\\UNC\\localhost\\a'), 'localhost');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5jLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9ub2RlL3VuYy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO1FBRWpCLElBQUksQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBRXZCLElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMsU0FBUyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUMsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyxJQUFJLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUV6QyxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLEdBQUcsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3hDLElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFM0MsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyxJQUFJLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6QyxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzNDLElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMsU0FBUyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUMsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyx5QkFBeUIsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRTlELElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDekMsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyxNQUFNLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMzQyxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLGVBQWUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXBELElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMsaUJBQWlCLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN4RCxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLGtCQUFrQixDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFekQsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM1QyxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLE9BQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRTVDLElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMsa0JBQWtCLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNqRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLGtCQUFrQixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFakQsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyx1QkFBdUIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3RELElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMsdUJBQXVCLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUV0RCxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLHlCQUF5QixDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDaEUsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyx5QkFBeUIsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRWhFLElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMsMEJBQTBCLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNqRSxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLDBCQUEwQixDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUMifQ==