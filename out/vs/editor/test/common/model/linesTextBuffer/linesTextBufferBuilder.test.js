/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/strings", "vs/base/test/common/utils", "vs/editor/common/model/textModel"], function (require, exports, assert, strings, utils_1, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function testTextBufferFactory(text, eol, mightContainNonBasicASCII, mightContainRTL) {
        const { disposable, textBuffer } = (0, textModel_1.createTextBufferFactory)(text).create(1 /* DefaultEndOfLine.LF */);
        assert.strictEqual(textBuffer.mightContainNonBasicASCII(), mightContainNonBasicASCII);
        assert.strictEqual(textBuffer.mightContainRTL(), mightContainRTL);
        assert.strictEqual(textBuffer.getEOL(), eol);
        disposable.dispose();
    }
    suite('ModelBuilder', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('t1', () => {
            testTextBufferFactory('', '\n', false, false);
        });
        test('t2', () => {
            testTextBufferFactory('Hello world', '\n', false, false);
        });
        test('t3', () => {
            testTextBufferFactory('Hello world\nHow are you?', '\n', false, false);
        });
        test('t4', () => {
            testTextBufferFactory('Hello world\nHow are you?\nIs everything good today?\nDo you enjoy the weather?', '\n', false, false);
        });
        test('carriage return detection (1 \\r\\n 2 \\n)', () => {
            testTextBufferFactory('Hello world\r\nHow are you?\nIs everything good today?\nDo you enjoy the weather?', '\n', false, false);
        });
        test('carriage return detection (2 \\r\\n 1 \\n)', () => {
            testTextBufferFactory('Hello world\r\nHow are you?\r\nIs everything good today?\nDo you enjoy the weather?', '\r\n', false, false);
        });
        test('carriage return detection (3 \\r\\n 0 \\n)', () => {
            testTextBufferFactory('Hello world\r\nHow are you?\r\nIs everything good today?\r\nDo you enjoy the weather?', '\r\n', false, false);
        });
        test('BOM handling', () => {
            testTextBufferFactory(strings.UTF8_BOM_CHARACTER + 'Hello world!', '\n', false, false);
        });
        test('RTL handling 2', () => {
            testTextBufferFactory('Hello world!זוהי עובדה מבוססת שדעתו', '\n', true, true);
        });
        test('RTL handling 3', () => {
            testTextBufferFactory('Hello world!זוהי \nעובדה מבוססת שדעתו', '\n', true, true);
        });
        test('ASCII handling 1', () => {
            testTextBufferFactory('Hello world!!\nHow do you do?', '\n', false, false);
        });
        test('ASCII handling 2', () => {
            testTextBufferFactory('Hello world!!\nHow do you do?Züricha📚📚b', '\n', true, false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZXNUZXh0QnVmZmVyQnVpbGRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZWwvbGluZXNUZXh0QnVmZmVyL2xpbmVzVGV4dEJ1ZmZlckJ1aWxkZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxTQUFTLHFCQUFxQixDQUFDLElBQVksRUFBRSxHQUFXLEVBQUUseUJBQWtDLEVBQUUsZUFBd0I7UUFDckgsTUFBTSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsR0FBRyxJQUFBLG1DQUF1QixFQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sNkJBQXFCLENBQUM7UUFFN0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMseUJBQXlCLEVBQUUsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3RGLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsRUFBRSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsS0FBSyxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7UUFFMUIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO1lBQ2YscUJBQXFCLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHFCQUFxQixDQUFDLGFBQWEsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7WUFDZixxQkFBcUIsQ0FBQywyQkFBMkIsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hFLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7WUFDZixxQkFBcUIsQ0FBQyxpRkFBaUYsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzlILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDRDQUE0QyxFQUFFLEdBQUcsRUFBRTtZQUN2RCxxQkFBcUIsQ0FBQyxtRkFBbUYsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2hJLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDRDQUE0QyxFQUFFLEdBQUcsRUFBRTtZQUN2RCxxQkFBcUIsQ0FBQyxxRkFBcUYsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BJLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDRDQUE0QyxFQUFFLEdBQUcsRUFBRTtZQUN2RCxxQkFBcUIsQ0FBQyx1RkFBdUYsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3RJLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7WUFDekIscUJBQXFCLENBQUMsT0FBTyxDQUFDLGtCQUFrQixHQUFHLGNBQWMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtZQUMzQixxQkFBcUIsQ0FBQyxxQ0FBcUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtZQUMzQixxQkFBcUIsQ0FBQyx1Q0FBdUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtZQUM3QixxQkFBcUIsQ0FBQywrQkFBK0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVFLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtZQUM3QixxQkFBcUIsQ0FBQywyQ0FBMkMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3ZGLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==