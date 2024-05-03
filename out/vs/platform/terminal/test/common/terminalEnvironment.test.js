/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/test/common/utils", "vs/platform/terminal/common/terminalEnvironment"], function (require, exports, assert_1, platform_1, utils_1, terminalEnvironment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('terminalEnvironment', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('collapseTildePath', () => {
            test('should return empty string for a falsy path', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('', '/foo', '/'), '');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)(undefined, '/foo', '/'), '');
            });
            test('should return path for a falsy user home', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('/foo', '', '/'), '/foo');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('/foo', undefined, '/'), '/foo');
            });
            test('should not collapse when user home isn\'t present', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('/foo', '/bar', '/'), '/foo');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('C:\\foo', 'C:\\bar', '\\'), 'C:\\foo');
            });
            test('should collapse with Windows separators', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('C:\\foo\\bar', 'C:\\foo', '\\'), '~\\bar');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('C:\\foo\\bar', 'C:\\foo\\', '\\'), '~\\bar');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('C:\\foo\\bar\\baz', 'C:\\foo\\', '\\'), '~\\bar\\baz');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('C:\\foo\\bar\\baz', 'C:\\foo', '\\'), '~\\bar\\baz');
            });
            test('should collapse mixed case with Windows separators', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('c:\\foo\\bar', 'C:\\foo', '\\'), '~\\bar');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('C:\\foo\\bar\\baz', 'c:\\foo', '\\'), '~\\bar\\baz');
            });
            test('should collapse with Posix separators', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('/foo/bar', '/foo', '/'), '~/bar');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('/foo/bar', '/foo/', '/'), '~/bar');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('/foo/bar/baz', '/foo', '/'), '~/bar/baz');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.collapseTildePath)('/foo/bar/baz', '/foo/', '/'), '~/bar/baz');
            });
        });
        suite('sanitizeCwd', () => {
            if (platform_1.OS === 1 /* OperatingSystem.Windows */) {
                test('should make the Windows drive letter uppercase', () => {
                    (0, assert_1.strictEqual)((0, terminalEnvironment_1.sanitizeCwd)('c:\\foo\\bar'), 'C:\\foo\\bar');
                });
            }
            test('should remove any wrapping quotes', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.sanitizeCwd)('\'/foo/bar\''), '/foo/bar');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.sanitizeCwd)('"/foo/bar"'), '/foo/bar');
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFbnZpcm9ubWVudC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC90ZXN0L2NvbW1vbi90ZXJtaW5hbEVudmlyb25tZW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUNqQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtZQUMvQixJQUFJLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO2dCQUN4RCxJQUFBLG9CQUFXLEVBQUMsSUFBQSx1Q0FBaUIsRUFBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNwRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSx1Q0FBaUIsRUFBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVELENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtnQkFDckQsSUFBQSxvQkFBVyxFQUFDLElBQUEsdUNBQWlCLEVBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDeEQsSUFBQSxvQkFBVyxFQUFDLElBQUEsdUNBQWlCLEVBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNoRSxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxtREFBbUQsRUFBRSxHQUFHLEVBQUU7Z0JBQzlELElBQUEsb0JBQVcsRUFBQyxJQUFBLHVDQUFpQixFQUFDLE1BQU0s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