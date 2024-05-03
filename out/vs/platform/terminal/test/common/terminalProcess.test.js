/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/terminal/common/terminalProcess"], function (require, exports, assert_1, utils_1, terminalProcess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('platform - terminalProcess', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('chunkInput', () => {
            test('single chunk', () => {
                (0, assert_1.deepStrictEqual)((0, terminalProcess_1.chunkInput)('foo bar'), ['foo bar']);
            });
            test('multi chunk', () => {
                (0, assert_1.deepStrictEqual)((0, terminalProcess_1.chunkInput)('foo'.repeat(50)), [
                    'foofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofo',
                    'ofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoof',
                    'oofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoo'
                ]);
            });
            test('small data with escapes', () => {
                (0, assert_1.deepStrictEqual)((0, terminalProcess_1.chunkInput)('foo \x1b[30mbar'), [
                    'foo ',
                    '\x1b[30mbar'
                ]);
            });
            test('large data with escapes', () => {
                (0, assert_1.deepStrictEqual)((0, terminalProcess_1.chunkInput)('foofoofoofoo\x1b[30mbarbarbarbarbar\x1b[0m'.repeat(3)), [
                    'foofoofoofoo',
                    '\x1B[30mbarbarbarbarbar',
                    '\x1B[0mfoofoofoofoo',
                    '\x1B[30mbarbarbarbarbar',
                    '\x1B[0mfoofoofoofoo',
                    '\x1B[30mbarbarbarbarbar',
                    '\x1B[0m'
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9jZXNzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL3Rlc3QvY29tbW9uL3Rlcm1pbmFsUHJvY2Vzcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7UUFDeEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3hCLElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO2dCQUN6QixJQUFBLHdCQUFlLEVBQUMsSUFBQSw0QkFBVSxFQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNyRCxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO2dCQUN4QixJQUFBLHdCQUFlLEVBQUMsSUFBQSw0QkFBVSxFQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDN0Msb0RBQW9EO29CQUNwRCxvREFBb0Q7b0JBQ3BELG9EQUFvRDtpQkFDcEQsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO2dCQUNwQyxJQUFBLHdCQUFlLEVBQUMsSUFBQSw0QkFBVSxFQUFDLGlCQUFpQixDQUFDLEVBQUU7b0JBQzlDLE1BQU07b0JBQ04sYUFBYTtpQkFDYixDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7Z0JBQ3BDLElBQUEsd0JBQWUsRUFBQyxJQUFBLDRCQUFVLEVBQUMsNENBQTRDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ25GLGNBQWM7b0JBQ2QseUJBQXlCO29CQUN6QixxQkFBcUI7b0JBQ3JCLHlCQUF5QjtvQkFDekIscUJBQXFCO29CQUNyQix5QkFBeUI7b0JBQ3pCLFNBQVM7aUJBQ1QsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=