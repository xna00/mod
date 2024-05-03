/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/controller/textAreaInput", "vs/editor/browser/controller/textAreaState", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/base/browser/dom", "vs/base/browser/browser", "vs/base/common/platform", "vs/base/browser/window", "vs/platform/accessibility/test/common/testAccessibilityService", "vs/platform/log/common/log"], function (require, exports, textAreaInput_1, textAreaState_1, position_1, range_1, dom, browser, platform, window_1, testAccessibilityService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // To run this test, open imeTester.html
    class SingleLineTestModel {
        constructor(line) {
            this._line = line;
        }
        _setText(text) {
            this._line = text;
        }
        getLineMaxColumn(lineNumber) {
            return this._line.length + 1;
        }
        getValueInRange(range, eol) {
            return this._line.substring(range.startColumn - 1, range.endColumn - 1);
        }
        getValueLengthInRange(range, eol) {
            return this.getValueInRange(range, eol).length;
        }
        modifyPosition(position, offset) {
            const column = Math.min(this.getLineMaxColumn(position.lineNumber), Math.max(1, position.column + offset));
            return new position_1.Position(position.lineNumber, column);
        }
        getModelLineContent(lineNumber) {
            return this._line;
        }
        getLineCount() {
            return 1;
        }
    }
    class TestView {
        constructor(model) {
            this._model = model;
        }
        paint(output) {
            dom.clearNode(output);
            for (let i = 1; i <= this._model.getLineCount(); i++) {
                const textNode = document.createTextNode(this._model.getModelLineContent(i));
                output.appendChild(textNode);
                const br = document.createElement('br');
                output.appendChild(br);
            }
        }
    }
    function doCreateTest(description, inputStr, expectedStr) {
        let cursorOffset = 0;
        let cursorLength = 0;
        const container = document.createElement('div');
        container.className = 'container';
        const title = document.createElement('div');
        title.className = 'title';
        const inputStrStrong = document.createElement('strong');
        inputStrStrong.innerText = inputStr;
        title.innerText = description + '. Type ';
        title.appendChild(inputStrStrong);
        container.appendChild(title);
        const startBtn = document.createElement('button');
        startBtn.innerText = 'Start';
        container.appendChild(startBtn);
        const input = document.createElement('textarea');
        input.setAttribute('rows', '10');
        input.setAttribute('cols', '40');
        container.appendChild(input);
        const model = new SingleLineTestModel('some  text');
        const textAreaInputHost = {
            getDataToCopy: () => {
                return {
                    isFromEmptySelection: false,
                    multicursorText: null,
                    text: '',
                    html: undefined,
                    mode: null
                };
            },
            getScreenReaderContent: () => {
                const selection = new range_1.Range(1, 1 + cursorOffset, 1, 1 + cursorOffset + cursorLength);
                return textAreaState_1.PagedScreenReaderStrategy.fromEditorSelection(model, selection, 10, true);
            },
            deduceModelPosition: (viewAnchorPosition, deltaOffset, lineFeedCnt) => {
                return null;
            }
        };
        const handler = new textAreaInput_1.TextAreaInput(textAreaInputHost, new textAreaInput_1.TextAreaWrapper(input), platform.OS, {
            isAndroid: browser.isAndroid,
            isFirefox: browser.isFirefox,
            isChrome: browser.isChrome,
            isSafari: browser.isSafari,
        }, new testAccessibilityService_1.TestAccessibilityService(), new log_1.NullLogService());
        const output = document.createElement('pre');
        output.className = 'output';
        container.appendChild(output);
        const check = document.createElement('pre');
        check.className = 'check';
        container.appendChild(check);
        const br = document.createElement('br');
        br.style.clear = 'both';
        container.appendChild(br);
        const view = new TestView(model);
        const updatePosition = (off, len) => {
            cursorOffset = off;
            cursorLength = len;
            handler.writeNativeTextAreaContent('selection changed');
            handler.focusTextArea();
        };
        const updateModelAndPosition = (text, off, len) => {
            model._setText(text);
            updatePosition(off, len);
            view.paint(output);
            const expected = 'some ' + expectedStr + ' text';
            if (text === expected) {
                check.innerText = '[GOOD]';
                check.className = 'check good';
            }
            else {
                check.innerText = '[BAD]';
                check.className = 'check bad';
            }
            check.appendChild(document.createTextNode(expected));
        };
        handler.onType((e) => {
            console.log('type text: ' + e.text + ', replaceCharCnt: ' + e.replacePrevCharCnt);
            const text = model.getModelLineContent(1);
            const preText = text.substring(0, cursorOffset - e.replacePrevCharCnt);
            const postText = text.substring(cursorOffset + cursorLength);
            const midText = e.text;
            updateModelAndPosition(preText + midText + postText, (preText + midText).length, 0);
        });
        view.paint(output);
        startBtn.onclick = function () {
            updateModelAndPosition('some  text', 5, 0);
            input.focus();
        };
        return container;
    }
    const TESTS = [
        { description: 'Japanese IME 1', in: 'sennsei [Enter]', out: 'せんせい' },
        { description: 'Japanese IME 2', in: 'konnichiha [Enter]', out: 'こんいちは' },
        { description: 'Japanese IME 3', in: 'mikann [Enter]', out: 'みかん' },
        { description: 'Korean IME 1', in: 'gksrmf [Space]', out: '한글 ' },
        { description: 'Chinese IME 1', in: '.,', out: '。，' },
        { description: 'Chinese IME 2', in: 'ni [Space] hao [Space]', out: '你好' },
        { description: 'Chinese IME 3', in: 'hazni [Space]', out: '哈祝你' },
        { description: 'Mac dead key 1', in: '`.', out: '`.' },
        { description: 'Mac hold key 1', in: 'e long press and 1', out: 'é' }
    ];
    TESTS.forEach((t) => {
        window_1.mainWindow.document.body.appendChild(doCreateTest(t.description, t.in, t.out));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1lVGVzdGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9icm93c2VyL2NvbnRyb2xsZXIvaW1lVGVzdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBY2hHLHdDQUF3QztJQUV4QyxNQUFNLG1CQUFtQjtRQUl4QixZQUFZLElBQVk7WUFDdkIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbkIsQ0FBQztRQUVELFFBQVEsQ0FBQyxJQUFZO1lBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ25CLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxVQUFrQjtZQUNsQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQsZUFBZSxDQUFDLEtBQWEsRUFBRSxHQUF3QjtZQUN0RCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDekUsQ0FBQztRQUVELHFCQUFxQixDQUFDLEtBQVksRUFBRSxHQUF3QjtZQUMzRCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNoRCxDQUFDO1FBRUQsY0FBYyxDQUFDLFFBQWtCLEVBQUUsTUFBYztZQUNoRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFD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