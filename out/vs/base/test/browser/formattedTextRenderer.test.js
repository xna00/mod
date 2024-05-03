/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/formattedTextRenderer", "vs/base/common/lifecycle", "vs/base/test/common/utils"], function (require, exports, assert, formattedTextRenderer_1, lifecycle_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FormattedTextRenderer', () => {
        const store = new lifecycle_1.DisposableStore();
        setup(() => {
            store.clear();
        });
        teardown(() => {
            store.clear();
        });
        test('render simple element', () => {
            const result = (0, formattedTextRenderer_1.renderText)('testing');
            assert.strictEqual(result.nodeType, document.ELEMENT_NODE);
            assert.strictEqual(result.textContent, 'testing');
            assert.strictEqual(result.tagName, 'DIV');
        });
        test('render element with class', () => {
            const result = (0, formattedTextRenderer_1.renderText)('testing', {
                className: 'testClass'
            });
            assert.strictEqual(result.nodeType, document.ELEMENT_NODE);
            assert.strictEqual(result.className, 'testClass');
        });
        test('simple formatting', () => {
            let result = (0, formattedTextRenderer_1.renderFormattedText)('**bold**');
            assert.strictEqual(result.children.length, 1);
            assert.strictEqual(result.firstChild.textContent, 'bold');
            assert.strictEqual(result.firstChild.tagName, 'B');
            assert.strictEqual(result.innerHTML, '<b>bold</b>');
            result = (0, formattedTextRenderer_1.renderFormattedText)('__italics__');
            assert.strictEqual(result.innerHTML, '<i>italics</i>');
            result = (0, formattedTextRenderer_1.renderFormattedText)('``code``');
            assert.strictEqual(result.innerHTML, '``code``');
            result = (0, formattedTextRenderer_1.renderFormattedText)('``code``', { renderCodeSegments: true });
            assert.strictEqual(result.innerHTML, '<code>code</code>');
            result = (0, formattedTextRenderer_1.renderFormattedText)('this string has **bold**, __italics__, and ``code``!!', { renderCodeSegments: true });
            assert.strictEqual(result.innerHTML, 'this string has <b>bold</b>, <i>italics</i>, and <code>code</code>!!');
        });
        test('no formatting', () => {
            const result = (0, formattedTextRenderer_1.renderFormattedText)('this is just a string');
            assert.strictEqual(result.innerHTML, 'this is just a string');
        });
        test('preserve newlines', () => {
            const result = (0, formattedTextRenderer_1.renderFormattedText)('line one\nline two');
            assert.strictEqual(result.innerHTML, 'line one<br>line two');
        });
        test('action', () => {
            let callbackCalled = false;
            const result = (0, formattedTextRenderer_1.renderFormattedText)('[[action]]', {
                actionHandler: {
                    callback(content) {
                        assert.strictEqual(content, '0');
                        callbackCalled = true;
                    },
                    disposables: store
                }
            });
            assert.strictEqual(result.innerHTML, '<a>action</a>');
            const event = document.createEvent('MouseEvent');
            event.initEvent('click', true, true);
            result.firstChild.dispatchEvent(event);
            assert.strictEqual(callbackCalled, true);
        });
        test('fancy action', () => {
            let callbackCalled = false;
            const result = (0, formattedTextRenderer_1.renderFormattedText)('__**[[action]]**__', {
                actionHandler: {
                    callback(content) {
                        assert.strictEqual(content, '0');
                        callbackCalled = true;
                    },
                    disposables: store
                }
            });
            assert.strictEqual(result.innerHTML, '<i><b><a>action</a></b></i>');
            const event = document.createEvent('MouseEvent');
            event.initEvent('click', true, true);
            result.firstChild.firstChild.firstChild.dispatchEvent(event);
            assert.strictEqual(callbackCalled, true);
        });
        test('fancier action', () => {
            let callbackCalled = false;
            const result = (0, formattedTextRenderer_1.renderFormattedText)('``__**[[action]]**__``', {
                renderCodeSegments: true,
                actionHandler: {
                    callback(content) {
                        assert.strictEqual(content, '0');
                        callbackCalled = true;
                    },
                    disposables: store
                }
            });
            assert.strictEqual(result.innerHTML, '<code><i><b><a>action</a></b></i></code>');
            const event = document.createEvent('MouseEvent');
            event.initEvent('click', true, true);
            result.firstChild.firstChild.firstChild.firstChild.dispatchEvent(event);
            assert.strictEqual(callbackCalled, true);
        });
        test('escaped formatting', () => {
            const result = (0, formattedTextRenderer_1.renderFormattedText)('\\*\\*bold\\*\\*');
            assert.strictEqual(result.children.length, 0);
            assert.strictEqual(result.innerHTML, '**bold**');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGVkVGV4dFJlbmRlcmVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9icm93c2VyL2Zvcm1hdHRlZFRleHRSZW5kZXJlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFDbkMsTUFBTSxLQUFLLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFcEMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtZQUNsQyxNQUFNLE1BQU0sR0FBZ0IsSUFBQSxrQ0FBVSxFQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRWxELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7WUFDdEMsTUFBTSxNQUFNLEdBQWdCLElBQUEsa0NBQVUsRUFBQyxTQUFTLEVBQUU7Z0JBQ2pELFNBQVMsRUFBRSxXQUFXO2FBQ3RCLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FB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