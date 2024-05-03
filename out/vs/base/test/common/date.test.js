/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/date", "vs/base/test/common/utils"], function (require, exports, assert_1, date_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Date', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('fromNow', () => {
            test('appendAgoLabel', () => {
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 35000), '35 secs');
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 35000, false), '35 secs');
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 35000, true), '35 secs ago');
            });
            test('useFullTimeWords', () => {
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 35000), '35 secs');
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 35000, undefined, false), '35 secs');
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 35000, undefined, true), '35 seconds');
            });
            test('disallowNow', () => {
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 5000), 'now');
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 5000, undefined, undefined, false), 'now');
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 5000, undefined, undefined, true), '5 secs');
            });
        });
        suite('getDurationString', () => {
            test('basic', () => {
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1), '1ms');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(999), '999ms');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000), '1s');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 - 1), '59.999s');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60), '1 mins');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60 - 1), '60 mins');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60), '1 hrs');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60 * 24 - 1), '24 hrs');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60 * 24), '1 days');
            });
            test('useFullTimeWords', () => {
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1, true), '1 milliseconds');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(999, true), '999 milliseconds');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000, true), '1 seconds');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 - 1, true), '59.999 seconds');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60, true), '1 minutes');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60 - 1, true), '60 minutes');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60, true), '1 hours');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60 * 24 - 1, true), '24 hours');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60 * 24, true), '1 days');
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL2RhdGUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtRQUNsQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7WUFDckIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtnQkFDM0IsSUFBQSxvQkFBVyxFQUFDLElBQUEsY0FBTyxFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDcEQsSUFBQSxvQkFBVyxFQUFDLElBQUEsY0FBTyxFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzNELElBQUEsb0JBQVcsRUFBQyxJQUFBLGNBQU8sRUFBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQy9ELENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtnQkFDN0IsSUFBQSxvQkFBVyxFQUFDLElBQUEsY0FBTyxFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDcEQsSUFBQSxvQkFBVyxFQUFDLElBQUEsY0FBTyxFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN0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