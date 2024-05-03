/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/console", "vs/base/common/path", "vs/base/test/common/utils"], function (require, exports, assert, console_1, path_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Console', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('getFirstFrame', () => {
            let stack = 'at vscode.commands.registerCommand (/Users/someone/Desktop/test-ts/out/src/extension.js:18:17)';
            let frame = (0, console_1.getFirstFrame)(stack);
            assert.strictEqual(frame.uri.fsPath, (0, path_1.normalize)('/Users/someone/Desktop/test-ts/out/src/extension.js'));
            assert.strictEqual(frame.line, 18);
            assert.strictEqual(frame.column, 17);
            stack = 'at /Users/someone/Desktop/test-ts/out/src/extension.js:18:17';
            frame = (0, console_1.getFirstFrame)(stack);
            assert.strictEqual(frame.uri.fsPath, (0, path_1.normalize)('/Users/someone/Desktop/test-ts/out/src/extension.js'));
            assert.strictEqual(frame.line, 18);
            assert.strictEqual(frame.column, 17);
            stack = 'at c:\\Users\\someone\\Desktop\\end-js\\extension.js:18:17';
            frame = (0, console_1.getFirstFrame)(stack);
            assert.strictEqual(frame.uri.fsPath, 'c:\\Users\\someone\\Desktop\\end-js\\extension.js');
            assert.strictEqual(frame.line, 18);
            assert.strictEqual(frame.column, 17);
            stack = 'at e.$executeContributedCommand(c:\\Users\\someone\\Desktop\\end-js\\extension.js:18:17)';
            frame = (0, console_1.getFirstFrame)(stack);
            assert.strictEqual(frame.uri.fsPath, 'c:\\Users\\someone\\Desktop\\end-js\\extension.js');
            assert.strictEqual(frame.line, 18);
            assert.strictEqual(frame.column, 17);
            stack = 'at /Users/someone/Desktop/test-ts/out/src/extension.js:18:17\nat /Users/someone/Desktop/test-ts/out/src/other.js:28:27\nat /Users/someone/Desktop/test-ts/out/src/more.js:38:37';
            frame = (0, console_1.getFirstFrame)(stack);
            assert.strictEqual(frame.uri.fsPath, (0, path_1.normalize)('/Users/someone/Desktop/test-ts/out/src/extension.js'));
            assert.strictEqual(frame.line, 18);
            assert.strictEqual(frame.column, 17);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc29sZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL2NvbnNvbGUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtRQUNyQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7WUFDMUIsSUFBSSxLQUFLLEdBQUcsZ0dBQWdHLENBQUM7WUFDN0csSUFBSSxLQUFLLEdBQUcsSUFBQSx1QkFBYSxFQUFDLEtBQUssQ0FBRSxDQUFDO1lBRWxDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBQSxnQkFBUyxFQUFDLHFEQUFxRCxDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXJDLEtBQUssR0FBRyw4REFBOEQsQ0FBQztZQUN2RSxLQUFLLEdBQUcsSUFBQSx1QkFBYSxFQUFDLEtBQUssQ0FBRSxDQUFDO1lBRTlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBQSxnQkFBUyxFQUFDLHFEQUFxRCxDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXJDLEtBQUssR0FBRyw0REFBNEQsQ0FBQztZQUNyRSxLQUFLLEdBQUcsSUFBQSx1QkFBYSxFQUFDLEtBQUssQ0FBRSxDQUFDO1lBRTlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsbURBQW1ELENBQUMsQ0FBQztZQUMxRixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXJDLEtBQUssR0FBRywwRkFBMEYsQ0FBQztZQUNuRyxLQUFLLEdBQUcsSUFBQSx1QkFBYSxFQUFDLEtBQUssQ0FBRSxDQUFDO1lBRTlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsbURBQW1ELENBQUMsQ0FBQztZQUMxRixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXJDLEtBQUssR0FBRyxpTEFBaUwsQ0FBQztZQUMxTCxLQUFLLEdBQUcsSUFBQSx1QkFBYSxFQUFDLEtBQUssQ0FBRSxDQUFDO1lBRTlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBQSxnQkFBUyxFQUFDLHFEQUFxRCxDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==