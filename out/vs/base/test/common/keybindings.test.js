/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/keybindings", "vs/base/test/common/utils"], function (require, exports, assert, keybindings_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('keyCodes', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #173325: wrong interpretations of special keys (e.g. [Equal] is mistaken for V)', () => {
            const a = new keybindings_1.KeyCodeChord(true, false, false, false, 52 /* KeyCode.KeyV */);
            const b = new keybindings_1.ScanCodeChord(true, false, false, false, 52 /* ScanCode.Equal */);
            assert.strictEqual(a.getHashCode() === b.getHashCode(), false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3MudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9rZXliaW5kaW5ncy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLEtBQUssQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO1FBRXRCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsdUZBQXVGLEVBQUUsR0FBRyxFQUFFO1lBQ2xHLE1BQU0sQ0FBQyxHQUFHLElBQUksMEJBQVksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLHdCQUFlLENBQUM7WUFDcEUsTUFBTSxDQUFDLEdBQUcsSUFBSSwyQkFBYSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssMEJBQWlCLENBQUM7WUFDdkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2hFLENBQUMsQ0FBQyxDQUFDO0lBRUosQ0FBQyxDQUFDLENBQUMifQ==