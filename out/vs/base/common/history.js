/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/navigator"], function (require, exports, navigator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HistoryNavigator2 = exports.HistoryNavigator = void 0;
    class HistoryNavigator {
        constructor(history = [], limit = 10) {
            this._initialize(history);
            this._limit = limit;
            this._onChange();
        }
        getHistory() {
            return this._elements;
        }
        add(t) {
            this._history.delete(t);
            this._history.add(t);
            this._onChange();
        }
        next() {
            // This will navigate past the end of the last element, and in that case the input should be cleared
            return this._navigator.next();
        }
        previous() {
            if (this._currentPosition() !== 0) {
                return this._navigator.previous();
            }
            return null;
        }
        current() {
            return this._navigator.current();
        }
        first() {
            return this._navigator.first();
        }
        last() {
            return this._navigator.last();
        }
        isFirst() {
            return this._currentPosition() === 0;
        }
        isLast() {
            return this._currentPosition() >= this._elements.length - 1;
        }
        isNowhere() {
            return this._navigator.current() === null;
        }
        has(t) {
            return this._history.has(t);
        }
        clear() {
            this._initialize([]);
            this._onChange();
        }
        _onChange() {
            this._reduceToLimit();
            const elements = this._elements;
            this._navigator = new navigator_1.ArrayNavigator(elements, 0, elements.length, elements.length);
        }
        _reduceToLimit() {
            const data = this._elements;
            if (data.length > this._limit) {
                this._initialize(data.slice(data.length - this._limit));
            }
        }
        _currentPosition() {
            const currentElement = this._navigator.current();
            if (!currentElement) {
                return -1;
            }
            return this._elements.indexOf(currentElement);
        }
        _initialize(history) {
            this._history = new Set();
            for (const entry of history) {
                this._history.add(entry);
            }
        }
        get _elements() {
            const elements = [];
            this._history.forEach(e => elements.push(e));
            return elements;
        }
    }
    exports.HistoryNavigator = HistoryNavigator;
    class HistoryNavigator2 {
        get size() { return this._size; }
        constructor(history, capacity = 10) {
            this.capacity = capacity;
            if (history.length < 1) {
                throw new Error('not supported');
            }
            this._size = 1;
            this.head = this.tail = this.cursor = {
                value: history[0],
                previous: undefined,
                next: undefined
            };
            this.valueSet = new Set([history[0]]);
            for (let i = 1; i < history.length; i++) {
                this.add(history[i]);
            }
        }
        add(value) {
            const node = {
                value,
                previous: this.tail,
                next: undefined
            };
            this.tail.next = node;
            this.tail = node;
            this.cursor = this.tail;
            this._size++;
            if (this.valueSet.has(value)) {
                this._deleteFromList(value);
            }
            else {
                this.valueSet.add(value);
            }
            while (this._size > this.capacity) {
                this.valueSet.delete(this.head.value);
                this.head = this.head.next;
                this.head.previous = undefined;
                this._size--;
            }
        }
        /**
         * @returns old last value
         */
        replaceLast(value) {
            if (this.tail.value === value) {
                return value;
            }
            const oldValue = this.tail.value;
            this.valueSet.delete(oldValue);
            this.tail.value = value;
            if (this.valueSet.has(value)) {
                this._deleteFromList(value);
            }
            else {
                this.valueSet.add(value);
            }
            return oldValue;
        }
        prepend(value) {
            if (this._size === this.capacity || this.valueSet.has(value)) {
                return;
            }
            const node = {
                value,
                previous: undefined,
                next: this.head
            };
            this.head.previous = node;
            this.head = node;
            this._size++;
            this.valueSet.add(value);
        }
        isAtEnd() {
            return this.cursor === this.tail;
        }
        current() {
            return this.cursor.value;
        }
        previous() {
            if (this.cursor.previous) {
                this.cursor = this.cursor.previous;
            }
            return this.cursor.value;
        }
        next() {
            if (this.cursor.next) {
                this.cursor = this.cursor.next;
            }
            return this.cursor.value;
        }
        has(t) {
            return this.valueSet.has(t);
        }
        resetCursor() {
            this.cursor = this.tail;
            return this.cursor.value;
        }
        *[Symbol.iterator]() {
            let node = this.head;
            while (node) {
                yield node.value;
                node = node.next;
            }
        }
        _deleteFromList(value) {
            let temp = this.head;
            while (temp !== this.tail) {
                if (temp.value === value) {
                    if (temp === this.head) {
                        this.head = this.head.next;
                        this.head.previous = undefined;
                    }
                    else {
                        temp.previous.next = temp.next;
                        temp.next.previous = temp.previous;
                    }
                    this._size--;
                }
                temp = temp.next;
            }
        }
    }
    exports.HistoryNavigator2 = HistoryNavigator2;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlzdG9yeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vaGlzdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsTUFBYSxnQkFBZ0I7UUFNNUIsWUFBWSxVQUF3QixFQUFFLEVBQUUsUUFBZ0IsRUFBRTtZQUN6RCxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNsQixDQUFDO1FBRU0sVUFBVTtZQUNoQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDdkIsQ0FBQztRQUVNLEdBQUcsQ0FBQyxDQUFJO1lBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckIsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2xCLENBQUM7UUFFTSxJQUFJO1lBQ1Ysb0dBQW9HO1lBQ3BHLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBRU0sUUFBUTtZQUNkLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNuQyxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU0sT0FBTztZQUNiLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNsQyxDQUFDO1FBRU0sS0FBSztZQUNYLE9BQU8sSUFBSSxDQUFD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