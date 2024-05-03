/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom"], function (require, exports, DOM) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renderText = renderText;
    exports.renderFormattedText = renderFormattedText;
    exports.createElement = createElement;
    function renderText(text, options = {}) {
        const element = createElement(options);
        element.textContent = text;
        return element;
    }
    function renderFormattedText(formattedText, options = {}) {
        const element = createElement(options);
        _renderFormattedText(element, parseFormattedText(formattedText, !!options.renderCodeSegments), options.actionHandler, options.renderCodeSegments);
        return element;
    }
    function createElement(options) {
        const tagName = options.inline ? 'span' : 'div';
        const element = document.createElement(tagName);
        if (options.className) {
            element.className = options.className;
        }
        return element;
    }
    class StringStream {
        constructor(source) {
            this.source = source;
            this.index = 0;
        }
        eos() {
            return this.index >= this.source.length;
        }
        next() {
            const next = this.peek();
            this.advance();
            return next;
        }
        peek() {
            return this.source[this.index];
        }
        advance() {
            this.index++;
        }
    }
    var FormatType;
    (function (FormatType) {
        FormatType[FormatType["Invalid"] = 0] = "Invalid";
        FormatType[FormatType["Root"] = 1] = "Root";
        FormatType[FormatType["Text"] = 2] = "Text";
        FormatType[FormatType["Bold"] = 3] = "Bold";
        FormatType[FormatType["Italics"] = 4] = "Italics";
        FormatType[FormatType["Action"] = 5] = "Action";
        FormatType[FormatType["ActionClose"] = 6] = "ActionClose";
        FormatType[FormatType["Code"] = 7] = "Code";
        FormatType[FormatType["NewLine"] = 8] = "NewLine";
    })(FormatType || (FormatType = {}));
    function _renderFormattedText(element, treeNode, actionHandler, renderCodeSegments) {
        let child;
        if (treeNode.type === 2 /* FormatType.Text */) {
            child = document.createTextNode(treeNode.content || '');
        }
        else if (treeNode.type === 3 /* FormatType.Bold */) {
            child = document.createElement('b');
        }
        else if (treeNode.type === 4 /* FormatType.Italics */) {
            child = document.createElement('i');
        }
        else if (treeNode.type === 7 /* FormatType.Code */ && renderCodeSegments) {
            child = document.createElement('code');
        }
        else if (treeNode.type === 5 /* FormatType.Action */ && actionHandler) {
            const a = document.createElement('a');
            actionHandler.disposables.add(DOM.addStandardDisposableListener(a, 'click', (event) => {
                actionHandler.callback(String(treeNode.index), event);
            }));
            child = a;
        }
        else if (treeNode.type === 8 /* FormatType.NewLine */) {
            child = document.createElement('br');
        }
        else if (treeNode.type === 1 /* FormatType.Root */) {
            child = element;
        }
        if (child && element !== child) {
            element.appendChild(child);
        }
        if (child && Array.isArray(treeNode.children)) {
            treeNode.children.forEach((nodeChild) => {
                _renderFormattedText(child, nodeChild, actionHandler, renderCodeSegments);
            });
        }
    }
    function parseFormattedText(content, parseCodeSegments) {
        const root = {
            type: 1 /* FormatType.Root */,
            children: []
        };
        let actionViewItemIndex = 0;
        let current = root;
        const stack = [];
        const stream = new StringStream(content);
        while (!stream.eos()) {
            let next = stream.next();
            const isEscapedFormatType = (next === '\\' && formatTagType(stream.peek(), parseCodeSegments) !== 0 /* FormatType.Invalid */);
            if (isEscapedFormatType) {
                next = stream.next(); // unread the backslash if it escapes a format tag type
            }
            if (!isEscapedFormatType && isFormatTag(next, parseCodeSegments) && next === stream.peek()) {
                stream.advance();
                if (current.type === 2 /* FormatType.Text */) {
                    current = stack.pop();
                }
                const type = formatTagType(next, parseCodeSegments);
                if (current.type === type || (current.type === 5 /* FormatType.Action */ && type === 6 /* FormatType.ActionClose */)) {
                    current = stack.pop();
                }
                else {
                    const newCurrent = {
                        type: type,
                        children: []
                    };
                    if (type === 5 /* FormatType.Action */) {
                        newCurrent.index = actionViewItemIndex;
                        actionViewItemIndex++;
                    }
                    current.children.push(newCurrent);
                    stack.push(current);
                    current = newCurrent;
                }
            }
            else if (next === '\n') {
                if (current.type === 2 /* FormatType.Text */) {
                    current = stack.pop();
                }
                current.children.push({
                    type: 8 /* FormatType.NewLine */
                });
            }
            else {
                if (current.type !== 2 /* FormatType.Text */) {
                    const textCurrent = {
                        type: 2 /* FormatType.Text */,
                        content: next
                    };
                    current.children.push(textCurrent);
                    stack.push(current);
                    current = textCurrent;
                }
                else {
                    current.content += next;
                }
            }
        }
        if (current.type === 2 /* FormatType.Text */) {
            current = stack.pop();
        }
        if (stack.length) {
            // incorrectly formatted string literal
        }
        return root;
    }
    function isFormatTag(char, supportCodeSegments) {
        return formatTagType(char, supportCodeSegments) !== 0 /* FormatType.Invalid */;
    }
    function formatTagType(char, supportCodeSegments) {
        switch (char) {
            case '*':
                return 3 /* FormatType.Bold */;
            case '_':
                return 4 /* FormatType.Italics */;
            case '[':
                return 5 /* FormatType.Action */;
            case ']':
                return 6 /* FormatType.ActionClose */;
            case '`':
                return supportCodeSegments ? 7 /* FormatType.Code */ : 0 /* FormatType.Invalid */;
            default:
                return 0 /* FormatType.Invalid */;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGVkVGV4dFJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvZm9ybWF0dGVkVGV4dFJlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBbUJoRyxnQ0FJQztJQUVELGtEQUlDO0lBRUQsc0NBT0M7SUFuQkQsU0FBZ0IsVUFBVSxDQUFDLElBQVksRUFBRSxVQUFzQyxFQUFFO1FBQ2hGLE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUMzQixPQUFPLE9BQU8sQ0FBQztJQUNoQixDQUFDO0lBRUQsU0FBZ0IsbUJBQW1CLENBQUMsYUFBcUIsRUFBRSxVQUFzQyxFQUFFO1FBQ2xHLE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsRUFBRSxPQUFPLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2xKLE9BQU8sT0FBTyxDQUFDO0lBQ2hCLENBQUM7SUFFRCxTQUFnQixhQUFhLENBQUMsT0FBbUM7UUFDaEUsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDaEQsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoRCxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUN2QixPQUFPLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxT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