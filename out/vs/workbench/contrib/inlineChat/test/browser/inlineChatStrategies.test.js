/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/async", "vs/base/test/common/utils", "../../browser/utils", "assert"], function (require, exports, cancellation_1, async_1, utils_1, utils_2, assert) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('AsyncEdit', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('asProgressiveEdit', async () => {
            const interval = new async_1.IntervalTimer();
            const edit = {
                range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
                text: 'Hello, world!'
            };
            const cts = new cancellation_1.CancellationTokenSource();
            const result = (0, utils_2.asProgressiveEdit)(interval, edit, 5, cts.token);
            // Verify the range
            assert.deepStrictEqual(result.range, edit.range);
            const iter = result.newText[Symbol.asyncIterator]();
            // Verify the newText
            const a = await iter.next();
            assert.strictEqual(a.value, 'Hello,');
            assert.strictEqual(a.done, false);
            // Verify the next word
            const b = await iter.next();
            assert.strictEqual(b.value, ' world!');
            assert.strictEqual(b.done, false);
            const c = await iter.next();
            assert.strictEqual(c.value, undefined);
            assert.strictEqual(c.done, true);
            cts.dispose();
        });
        test('asProgressiveEdit - cancellation', async () => {
            const interval = new async_1.IntervalTimer();
            const edit = {
                range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
                text: 'Hello, world!'
            };
            const cts = new cancellation_1.CancellationTokenSource();
            const result = (0, utils_2.asProgressiveEdit)(interval, edit, 5, cts.token);
            // Verify the range
            assert.deepStrictEqual(result.range, edit.range);
            const iter = result.newText[Symbol.asyncIterator]();
            // Verify the newText
            const a = await iter.next();
            assert.strictEqual(a.value, 'Hello,');
            assert.strictEqual(a.done, false);
            cts.dispose(true);
            const c = await iter.next();
            assert.strictEqual(c.value, undefined);
            assert.strictEqual(c.done, true);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFN0cmF0ZWdpZXMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW5saW5lQ2hhdC90ZXN0L2Jyb3dzZXIvaW5saW5lQ2hhdFN0cmF0ZWdpZXMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxLQUFLLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtRQUV2QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3BDLE1BQU0sUUFBUSxHQUFHLElBQUkscUJBQWEsRUFBRSxDQUFDO1lBQ3JDLE1BQU0sSUFBSSxHQUFHO2dCQUNaLEtBQUssRUFBRSxFQUFFLGVBQWUsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxhQUFhLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7Z0JBQzdFLElBQUksRUFBRSxlQUFlO2FBQ3JCLENBQUM7WUFFRixNQUFNLEdBQUcsR0FBRyxJQUFJLHNDQUF1QixFQUFFLENBQUM7WUFDMUMsTUFBTSxNQUFNLEdBQUcsSUFBQSx5QkFBaUIsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFL0QsbUJBQW1CO1lBQ25CLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFakQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztZQUVwRCxxQkFBcUI7WUFDckIsTUFBTSxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDNUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVsQyx1QkFBdUI7WUFDdkIsTUFBTSxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDNUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVsQyxNQUFNLENBQUMsR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM1QixNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRWpDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtDQUFrQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25ELE1BQU0sUUFBUSxHQUFHLElBQUkscUJBQWEsRUFBRSxDQUFDO1lBQ3JDLE1BQU0sSUFBSSxHQUFHO2dCQUNaLEtBQUssRUFBRSxFQUFFLGVBQWUsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxhQUFhLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7Z0JBQzdFLElBQUksRUFBRSxlQUFlO2FBQ3JCLENBQUM7WUFFRixNQUFNLEdBQUcsR0FBRyxJQUFJLHNDQUF1QixFQUFFLENBQUM7WUFDMUMsTUFBTSxNQUFNLEdBQUcsSUFBQSx5QkFBaUIsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFL0QsbUJBQW1CO1lBQ25CLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFakQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztZQUVwRCxxQkFBcUI7WUFDckIsTUFBTSxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDNUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVsQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRWxCLE1BQU0sQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzVCLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEMsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9