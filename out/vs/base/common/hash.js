/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StringSHA1 = exports.Hasher = void 0;
    exports.hash = hash;
    exports.doHash = doHash;
    exports.numberHash = numberHash;
    exports.stringHash = stringHash;
    exports.toHexString = toHexString;
    /**
     * Return a hash value for an object.
     */
    function hash(obj) {
        return doHash(obj, 0);
    }
    function doHash(obj, hashVal) {
        switch (typeof obj) {
            case 'object':
                if (obj === null) {
                    return numberHash(349, hashVal);
                }
                else if (Array.isArray(obj)) {
                    return arrayHash(obj, hashVal);
                }
                return objectHash(obj, hashVal);
            case 'string':
                return stringHash(obj, hashVal);
            case 'boolean':
                return booleanHash(obj, hashVal);
            case 'number':
                return numberHash(obj, hashVal);
            case 'undefined':
                return numberHash(937, hashVal);
            default:
                return numberHash(617, hashVal);
        }
    }
    function numberHash(val, initialHashVal) {
        return (((initialHashVal << 5) - initialHashVal) + val) | 0; // hashVal * 31 + ch, keep as int32
    }
    function booleanHash(b, initialHashVal) {
        return numberHash(b ? 433 : 863, initialHashVal);
    }
    function stringHash(s, hashVal) {
        hashVal = numberHash(149417, hashVal);
        for (let i = 0, length = s.length; i < length; i++) {
            hashVal = numberHash(s.charCodeAt(i), hashVal);
        }
        return hashVal;
    }
    function arrayHash(arr, initialHashVal) {
        initialHashVal = numberHash(104579, initialHashVal);
        return arr.reduce((hashVal, item) => doHash(item, hashVal), initialHashVal);
    }
    function objectHash(obj, initialHashVal) {
        initialHashVal = numberHash(181387, initialHashVal);
        return Object.keys(obj).sort().reduce((hashVal, key) => {
            hashVal = stringHash(key, hashVal);
            return doHash(obj[key], hashVal);
        }, initialHashVal);
    }
    class Hasher {
        constructor() {
            this._value = 0;
        }
        get value() {
            return this._value;
        }
        hash(obj) {
            this._value = doHash(obj, this._value);
            return this._value;
        }
    }
    exports.Hasher = Hasher;
    var SHA1Constant;
    (function (SHA1Constant) {
        SHA1Constant[SHA1Constant["BLOCK_SIZE"] = 64] = "BLOCK_SIZE";
        SHA1Constant[SHA1Constant["UNICODE_REPLACEMENT"] = 65533] = "UNICODE_REPLACEMENT";
    })(SHA1Constant || (SHA1Constant = {}));
    function leftRotate(value, bits, totalBits = 32) {
        // delta + bits = totalBits
        const delta = totalBits - bits;
        // All ones, expect `delta` zeros aligned to the right
        const mask = ~((1 << delta) - 1);
        // Join (value left-shifted `bits` bits) with (masked value right-shifted `delta` bits)
        return ((value << bits) | ((mask & value) >>> delta)) >>> 0;
    }
    function fill(dest, index = 0, count = dest.byteLength, value = 0) {
        for (let i = 0; i < count; i++) {
            dest[index + i] = value;
        }
    }
    function leftPad(value, length, char = '0') {
        while (value.length < length) {
            value = char + value;
        }
        return value;
    }
    function toHexString(bufferOrValue, bitsize = 32) {
        if (bufferOrValue instanceof ArrayBuffer) {
            return Array.from(new Uint8Array(bufferOrValue)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        return leftPad((bufferOrValue >>> 0).toString(16), bitsize / 4);
    }
    /**
     * A SHA1 implementation that works with strings and does not allocate.
     */
    class StringSHA1 {
        static { this._bigBlock32 = new DataView(new ArrayBuffer(320)); } // 80 * 4 = 320
        constructor() {
            this._h0 = 0x67452301;
            this._h1 = 0xEFCDAB89;
            this._h2 = 0x98BADCFE;
            this._h3 = 0x10325476;
            this._h4 = 0xC3D2E1F0;
            this._buff = new Uint8Array(64 /* SHA1Constant.BLOCK_SIZE */ + 3 /* to fit any utf-8 */);
            this._buffDV = new DataView(this._buff.buffer);
            this._buffLen = 0;
            this._totalLen = 0;
            this._leftoverHighSurrogate = 0;
            this._finished = false;
        }
        update(str) {
            const strLen = str.length;
            if (strLen === 0) {
                return;
            }
            const buff = this._buff;
            let buffLen = this._buffLen;
            let leftoverHighSurrogate = this._leftoverHighSurrogate;
            let charCode;
            let offset;
            if (leftoverHighSurrogate !== 0) {
                charCode = leftoverHighSurrogate;
                offset = -1;
                leftoverHighSurrogate = 0;
            }
            else {
                charCode = str.charCodeAt(0);
                offset = 0;
            }
            while (true) {
                let codePoint = charCode;
                if (strings.isHighSurrogate(charCode)) {
                    if (offset + 1 < strLen) {
                        const nextCharCode = str.charCodeAt(offset + 1);
                        if (strings.isLowSurrogate(nextCharCode)) {
                            offset++;
                            codePoint = strings.computeCodePoint(charCode, nextCharCode);
                        }
                        else {
                            // illegal => unicode replacement character
                            codePoint = 65533 /* SHA1Constant.UNICODE_REPLACEMENT */;
                        }
                    }
                    else {
                        // last character is a surrogate pair
                        leftoverHighSurrogate = charCode;
                        break;
                    }
                }
                else if (strings.isLowSurrogate(charCode)) {
                    // illegal => unicode replacement character
                    codePoint = 65533 /* SHA1Constant.UNICODE_REPLACEMENT */;
                }
                buffLen = this._push(buff, buffLen, codePoint);
                offset++;
                if (offset < strLen) {
                    charCode = str.charCodeAt(offset);
                }
                else {
                    break;
                }
            }
            this._buffLen = buffLen;
            this._leftoverHighSurrogate = leftoverHighSurrogate;
        }
        _push(buff, buffLen, codePoint) {
            if (codePoint < 0x0080) {
                buff[buffLen++] = codePoint;
            }
            else if (codePoint < 0x0800) {
                buff[buffLen++] = 0b11000000 | ((codePoint & 0b00000000000000000000011111000000) >>> 6);
                buff[buffLen++] = 0b10000000 | ((codePoint & 0b00000000000000000000000000111111) >>> 0);
            }
            else if (codePoint < 0x10000) {
                buff[buffLen++] = 0b11100000 | ((codePoint & 0b00000000000000001111000000000000) >>> 12);
                buff[buffLen++] = 0b10000000 | ((codePoint & 0b00000000000000000000111111000000) >>> 6);
                buff[buffLen++] = 0b10000000 | ((codePoint & 0b00000000000000000000000000111111) >>> 0);
            }
            else {
                buff[buffLen++] = 0b11110000 | ((codePoint & 0b00000000000111000000000000000000) >>> 18);
                buff[buffLen++] = 0b10000000 | ((codePoint & 0b00000000000000111111000000000000) >>> 12);
                buff[buffLen++] = 0b10000000 | ((codePoint & 0b00000000000000000000111111000000) >>> 6);
                buff[buffLen++] = 0b10000000 | ((codePoint & 0b00000000000000000000000000111111) >>> 0);
            }
            if (buffLen >= 64 /* SHA1Constant.BLOCK_SIZE */) {
                this._step();
                buffLen -= 64 /* SHA1Constant.BLOCK_SIZE */;
                this._totalLen += 64 /* SHA1Constant.BLOCK_SIZE */;
                // take last 3 in case of UTF8 overflow
                buff[0] = buff[64 /* SHA1Constant.BLOCK_SIZE */ + 0];
                buff[1] = buff[64 /* SHA1Constant.BLOCK_SIZE */ + 1];
                buff[2] = buff[64 /* SHA1Constant.BLOCK_SIZE */ + 2];
            }
            return buffLen;
        }
        digest() {
            if (!this._finished) {
                this._finished = true;
                if (this._leftoverHighSurrogate) {
                    // illegal => unicode replacement character
                    this._leftoverHighSurrogate = 0;
                    this._buffLen = this._push(this._buff, this._buffLen, 65533 /* SHA1Constant.UNICODE_REPLACEMENT */);
                }
                this._totalLen += this._buffLen;
                this._wrapUp();
            }
            return toHexString(this._h0) + toHexString(this._h1) + toHexString(this._h2) + toHexString(this._h3) + toHexString(this._h4);
        }
        _wrapUp() {
            this._buff[this._buffLen++] = 0x80;
            fill(this._buff, this._buffLen);
            if (this._buffLen > 56) {
                this._step();
                fill(this._buff);
            }
            // this will fit because the mantissa can cover up to 52 bits
            const ml = 8 * this._totalLen;
            this._buffDV.setUint32(56, Math.floor(ml / 4294967296), false);
            this._buffDV.setUint32(60, ml % 4294967296, false);
            this._step();
        }
        _step() {
            const bigBlock32 = StringSHA1._bigBlock32;
            const data = this._buffDV;
            for (let j = 0; j < 64 /* 16*4 */; j += 4) {
                bigBlock32.setUint32(j, data.getUint32(j, false), false);
            }
            for (let j = 64; j < 320 /* 80*4 */; j += 4) {
                bigBlock32.setUint32(j, leftRotate((bigBlock32.getUint32(j - 12, false) ^ bigBlock32.getUint32(j - 32, false) ^ bigBlock32.getUint32(j - 56, false) ^ bigBlock32.getUint32(j - 64, false)), 1), false);
            }
            let a = this._h0;
            let b = this._h1;
            let c = this._h2;
            let d = this._h3;
            let e = this._h4;
            let f, k;
            let temp;
            for (let j = 0; j < 80; j++) {
                if (j < 20) {
                    f = (b & c) | ((~b) & d);
                    k = 0x5A827999;
                }
                else if (j < 40) {
                    f = b ^ c ^ d;
                    k = 0x6ED9EBA1;
                }
                else if (j < 60) {
                    f = (b & c) | (b & d) | (c & d);
                    k = 0x8F1BBCDC;
                }
                else {
                    f = b ^ c ^ d;
                    k = 0xCA62C1D6;
                }
                temp = (leftRotate(a, 5) + f + e + k + bigBlock32.getUint32(j * 4, false)) & 0xffffffff;
                e = d;
                d = c;
                c = leftRotate(b, 30);
                b = a;
                a = temp;
            }
            this._h0 = (this._h0 + a) & 0xffffffff;
            this._h1 = (this._h1 + b) & 0xffffffff;
            this._h2 = (this._h2 + c) & 0xffffffff;
            this._h3 = (this._h3 + d) & 0xffffffff;
            this._h4 = (this._h4 + e) & 0xffffffff;
        }
    }
    exports.StringSHA1 = StringSHA1;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vaGFzaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsb0JBRUM7SUFFRCx3QkFvQkM7SUFFRCxnQ0FFQztJQU1ELGdDQU1DO0lBNERELGtDQU1DO0lBN0dEOztPQUVHO0lBQ0gsU0FBZ0IsSUFBSSxDQUFDLEdBQVE7UUFDNUIsT0FBTyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxTQUFnQixNQUFNLENBQUMsR0FBUSxFQUFFLE9BQWU7UUFDL0MsUUFBUSxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ3BCLEtBQUssUUFBUTtnQkFDWixJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztvQkFDbEIsT0FBTyxVQUFVLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUNqQyxDQUFDO3FCQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUMvQixPQUFPLFNBQVMsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ2hDLENBQUM7Z0JBQ0QsT0FBTyxVQUFVLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2pDLEtBQUssUUFBUTtnQkFDWixPQUFPLFVBQVUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakMsS0FBSyxTQUFTO2dCQUNiLE9BQU8sV0FBVyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNsQyxLQUFLLFFBQVE7Z0JBQ1osT0FBTyxVQUFVLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2pDLEtBQUssV0FBVztnQkFDZixPQUFPLFVBQVUsQ0FBQyxHQUFHLEVBQUUs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LElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDO2dCQUN4RixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNOLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ04sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3RCLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ04sQ0FBQyxHQUFHLElBQUksQ0FBQztZQUNWLENBQUM7WUFFRCxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUM7WUFDdkMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQztZQUN2QyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUM7WUFDdkMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDO1FBQ3hDLENBQUM7O0lBak1GLGdDQWtNQyJ9