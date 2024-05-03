/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/base/common/platform", "vs/base/common/buffer"], function (require, exports, strings, platform, buffer) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StringBuilder = void 0;
    exports.getPlatformTextDecoder = getPlatformTextDecoder;
    exports.decodeUTF16LE = decodeUTF16LE;
    let _utf16LE_TextDecoder;
    function getUTF16LE_TextDecoder() {
        if (!_utf16LE_TextDecoder) {
            _utf16LE_TextDecoder = new TextDecoder('UTF-16LE');
        }
        return _utf16LE_TextDecoder;
    }
    let _utf16BE_TextDecoder;
    function getUTF16BE_TextDecoder() {
        if (!_utf16BE_TextDecoder) {
            _utf16BE_TextDecoder = new TextDecoder('UTF-16BE');
        }
        return _utf16BE_TextDecoder;
    }
    let _platformTextDecoder;
    function getPlatformTextDecoder() {
        if (!_platformTextDecoder) {
            _platformTextDecoder = platform.isLittleEndian() ? getUTF16LE_TextDecoder() : getUTF16BE_TextDecoder();
        }
        return _platformTextDecoder;
    }
    function decodeUTF16LE(source, offset, len) {
        const view = new Uint16Array(source.buffer, offset, len);
        if (len > 0 && (view[0] === 0xFEFF || view[0] === 0xFFFE)) {
            // UTF16 sometimes starts with a BOM https://de.wikipedia.org/wiki/Byte_Order_Mark
            // It looks like TextDecoder.decode will eat up a leading BOM (0xFEFF or 0xFFFE)
            // We don't want that behavior because we know the string is UTF16LE and the BOM should be maintained
            // So we use the manual decoder
            return compatDecodeUTF16LE(source, offset, len);
        }
        return getUTF16LE_TextDecoder().decode(view);
    }
    function compatDecodeUTF16LE(source, offset, len) {
        const result = [];
        let resultLen = 0;
        for (let i = 0; i < len; i++) {
            const charCode = buffer.readUInt16LE(source, offset);
            offset += 2;
            result[resultLen++] = String.fromCharCode(charCode);
        }
        return result.join('');
    }
    class StringBuilder {
        constructor(capacity) {
            this._capacity = capacity | 0;
            this._buffer = new Uint16Array(this._capacity);
            this._completedStrings = null;
            this._bufferLength = 0;
        }
        reset() {
            this._completedStrings = null;
            this._bufferLength = 0;
        }
        build() {
            if (this._completedStrings !== null) {
                this._flushBuffer();
                return this._completedStrings.join('');
            }
            return this._buildBuffer();
        }
        _buildBuffer() {
            if (this._bufferLength === 0) {
                return '';
            }
            const view = new Uint16Array(this._buffer.buffer, 0, this._bufferLength);
            return getPlatformTextDecoder().decode(view);
        }
        _flushBuffer() {
            const bufferString = this._buildBuffer();
            this._bufferLength = 0;
            if (this._completedStrings === null) {
                this._completedStrings = [bufferString];
            }
            else {
                this._completedStrings[this._completedStrings.length] = bufferString;
            }
        }
        /**
         * Append a char code (<2^16)
         */
        appendCharCode(charCode) {
            const remainingSpace = this._capacity - this._bufferLength;
            if (remainingSpace <= 1) {
                if (remainingSpace === 0 || strings.isHighSurrogate(charCode)) {
                    this._flushBuffer();
                }
            }
            this._buffer[this._bufferLength++] = charCode;
        }
        /**
         * Append an ASCII char code (<2^8)
         */
        appendASCIICharCode(charCode) {
            if (this._bufferLength === this._capacity) {
                // buffer is full
                this._flushBuffer();
            }
            this._buffer[this._bufferLength++] = charCode;
        }
        appendString(str) {
            const strLen = str.length;
            if (this._bufferLength + strLen >= this._capacity) {
                // This string does not fit in the remaining buffer space
                this._flushBuffer();
                this._completedStrings[this._completedStrings.length] = str;
                return;
            }
            for (let i = 0; i < strLen; i++) {
                this._buffer[this._bufferLength++] = str.charCodeAt(i);
            }
        }
    }
    exports.StringBuilder = StringBuilder;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5nQnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb3JlL3N0cmluZ0J1aWxkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdUJoRyx3REFLQztJQUVELHNDQVVDO0lBbENELElBQUksb0JBQXdDLENBQUM7SUFDN0MsU0FBUyxzQkFBc0I7UUFDOUIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDM0Isb0JBQW9CLEdBQUcsSUFBSSxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUNELE9BQU8sb0JBQW9CLENBQUM7SUFDN0IsQ0FBQztJQUVELElBQUksb0JBQXdDLENBQUM7SUFDN0MsU0FBUyxzQkFBc0I7UUFDOUIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDM0Isb0JBQW9CLEdBQUcsSUFBSSxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUNELE9BQU8sb0JBQW9CLENBQUM7SUFDN0IsQ0FBQztJQUVELElBQUksb0JBQXdDLENBQUM7SUFDN0MsU0FBZ0Isc0JBQXNCO1FBQ3JDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzNCLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztRQUN4RyxDQUFDO1FBQ0QsT0FBTyxvQkFBb0IsQ0FBQztJQUM3QixDQUFDO0lBRUQsU0FBZ0IsYUFBYSxDQUFDLE1BQWtCLEVBQUUsTUFBYyxFQUFFLEdBQVc7UUFDNUUsTUFBTSxJQUFJLEdBQUcsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENB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