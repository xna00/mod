/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/stream", "vs/base/common/buffer", "vs/amdX", "vs/base/common/cancellation"], function (require, exports, stream_1, buffer_1, amdX_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SUPPORTED_ENCODINGS = exports.DecodeStreamError = exports.DecodeStreamErrorKind = exports.UTF8_BOM = exports.UTF16le_BOM = exports.UTF16be_BOM = exports.UTF16le = exports.UTF16be = exports.UTF8_with_bom = exports.UTF8 = void 0;
    exports.isUTFEncoding = isUTFEncoding;
    exports.toDecodeStream = toDecodeStream;
    exports.toEncodeReadable = toEncodeReadable;
    exports.encodingExists = encodingExists;
    exports.toNodeEncoding = toNodeEncoding;
    exports.detectEncodingByBOMFromBuffer = detectEncodingByBOMFromBuffer;
    exports.toCanonicalName = toCanonicalName;
    exports.detectEncodingFromBuffer = detectEncodingFromBuffer;
    exports.UTF8 = 'utf8';
    exports.UTF8_with_bom = 'utf8bom';
    exports.UTF16be = 'utf16be';
    exports.UTF16le = 'utf16le';
    function isUTFEncoding(encoding) {
        return [exports.UTF8, exports.UTF8_with_bom, exports.UTF16be, exports.UTF16le].some(utfEncoding => utfEncoding === encoding);
    }
    exports.UTF16be_BOM = [0xFE, 0xFF];
    exports.UTF16le_BOM = [0xFF, 0xFE];
    exports.UTF8_BOM = [0xEF, 0xBB, 0xBF];
    const ZERO_BYTE_DETECTION_BUFFER_MAX_LEN = 512; // number of bytes to look at to decide about a file being binary or not
    const NO_ENCODING_GUESS_MIN_BYTES = 512; // when not auto guessing the encoding, small number of bytes are enough
    const AUTO_ENCODING_GUESS_MIN_BYTES = 512 * 8; // with auto guessing we want a lot more content to be read for guessing
    const AUTO_ENCODING_GUESS_MAX_BYTES = 512 * 128; // set an upper limit for the number of bytes we pass on to jschardet
    var DecodeStreamErrorKind;
    (function (DecodeStreamErrorKind) {
        /**
         * Error indicating that the stream is binary even
         * though `acceptTextOnly` was specified.
         */
        DecodeStreamErrorKind[DecodeStreamErrorKind["STREAM_IS_BINARY"] = 1] = "STREAM_IS_BINARY";
    })(DecodeStreamErrorKind || (exports.DecodeStreamErrorKind = DecodeStreamErrorKind = {}));
    class DecodeStreamError extends Error {
        constructor(message, decodeStreamErrorKind) {
            super(message);
            this.decodeStreamErrorKind = decodeStreamErrorKind;
        }
    }
    exports.DecodeStreamError = DecodeStreamError;
    class DecoderStream {
        /**
         * This stream will only load iconv-lite lazily if the encoding
         * is not UTF-8. This ensures that for most common cases we do
         * not pay the price of loading the module from disk.
         *
         * We still need to be careful when converting UTF-8 to a string
         * though because we read the file in chunks of Buffer and thus
         * need to decode it via TextDecoder helper that is available
         * in browser and node.js environments.
         */
        static async create(encoding) {
            let decoder = undefined;
            if (encoding !== exports.UTF8) {
                const iconv = await (0, amdX_1.importAMDNodeModule)('@vscode/iconv-lite-umd', 'lib/iconv-lite-umd.js');
                decoder = iconv.getDecoder(toNodeEncoding(encoding));
            }
            else {
                const utf8TextDecoder = new TextDecoder();
                decoder = {
                    write(buffer) {
                        return utf8TextDecoder.decode(buffer, {
                            // Signal to TextDecoder that potentially more data is coming
                            // and that we are calling `decode` in the end to consume any
                            // remainders
                            stream: true
                        });
                    },
                    end() {
                        return utf8TextDecoder.decode();
                    }
                };
            }
            return new DecoderStream(decoder);
        }
        constructor(iconvLiteDecoder) {
            this.iconvLiteDecoder = iconvLiteDecoder;
        }
        write(buffer) {
            return this.iconvLiteDecoder.write(buffer);
        }
        end() {
            return this.iconvLiteDecoder.end();
        }
    }
    function toDecodeStream(source, options) {
        const minBytesRequiredForDetection = options.minBytesRequiredForDetection ?? options.guessEncoding ? AUTO_ENCODING_GUESS_MIN_BYTES : NO_ENCODING_GUESS_MIN_BYTES;
        return new Promise((resolve, reject) => {
            const target = (0, stream_1.newWriteableStream)(strings => strings.join(''));
            const bufferedChunks = [];
            let bytesBuffered = 0;
            let decoder = undefined;
            const cts = new cancellation_1.CancellationTokenSource();
            const createDecoder = async () => {
                try {
                    // detect encoding from buffer
                    const detected = await detectEncodingFromBuffer({
                        buffer: buffer_1.VSBuffer.concat(bufferedChunks),
                        bytesRead: bytesBuffered
                    }, options.guessEncoding);
                    // throw early if the source seems binary and
                    // we are instructed to only accept text
                    if (detected.seemsBinary && options.acceptTextOnly) {
                        throw new DecodeStreamError('Stream is binary but only text is accepted for decoding', 1 /* DecodeStreamErrorKind.STREAM_IS_BINARY */);
                    }
                    // ensure to respect overwrite of encoding
                    detected.encoding = await options.overwriteEncoding(detected.encoding);
                    // decode and write buffered content
                    decoder = await DecoderStream.create(detected.encoding);
                    const decoded = decoder.write(buffer_1.VSBuffer.concat(bufferedChunks).buffer);
                    target.write(decoded);
                    bufferedChunks.length = 0;
                    bytesBuffered = 0;
                    // signal to the outside our detected encoding and final decoder stream
                    resolve({
                        stream: target,
                        detected
                    });
                }
                catch (error) {
                    // Stop handling anything from the source and target
                    cts.cancel();
                    target.destroy();
                    reject(error);
                }
            };
            (0, stream_1.listenStream)(source, {
                onData: async (chunk) => {
                    // if the decoder is ready, we just write directly
                    if (decoder) {
                        target.write(decoder.write(chunk.buffer));
                    }
                    // otherwise we need to buffer the data until the stream is ready
                    else {
                        bufferedChunks.push(chunk);
                        bytesBuffered += chunk.byteLength;
                        // buffered enough data for encoding detection, create stream
                        if (bytesBuffered >= minBytesRequiredForDetection) {
                            // pause stream here until the decoder is ready
                            source.pause();
                            await createDecoder();
                            // resume stream now that decoder is ready but
                            // outside of this stack to reduce recursion
                            setTimeout(() => source.resume());
                        }
                    }
                },
                onError: error => target.error(error), // simply forward to target
                onEnd: async () => {
                    // we were still waiting for data to do the encoding
                    // detection. thus, wrap up starting the stream even
                    // without all the data to get things going
                    if (!decoder) {
                        await createDecoder();
                    }
                    // end the target with the remainders of the decoder
                    target.end(decoder?.end());
                }
            }, cts.token);
        });
    }
    async function toEncodeReadable(readable, encoding, options) {
        const iconv = await (0, amdX_1.importAMDNodeModule)('@vscode/iconv-lite-umd', 'lib/iconv-lite-umd.js');
        const encoder = iconv.getEncoder(toNodeEncoding(encoding), options);
        let bytesWritten = false;
        let done = false;
        return {
            read() {
                if (done) {
                    return null;
                }
                const chunk = readable.read();
                if (typeof chunk !== 'string') {
                    done = true;
                    // If we are instructed to add a BOM but we detect that no
                    // bytes have been written, we must ensure to return the BOM
                    // ourselves so that we comply with the contract.
                    if (!bytesWritten && options?.addBOM) {
                        switch (encoding) {
                            case exports.UTF8:
                            case exports.UTF8_with_bom:
                                return buffer_1.VSBuffer.wrap(Uint8Array.from(exports.UTF8_BOM));
                            case exports.UTF16be:
                                return buffer_1.VSBuffer.wrap(Uint8Array.from(exports.UTF16be_BOM));
                            case exports.UTF16le:
                                return buffer_1.VSBuffer.wrap(Uint8Array.from(exports.UTF16le_BOM));
                        }
                    }
                    const leftovers = encoder.end();
                    if (leftovers && leftovers.length > 0) {
                        bytesWritten = true;
                        return buffer_1.VSBuffer.wrap(leftovers);
                    }
                    return null;
                }
                bytesWritten = true;
                return buffer_1.VSBuffer.wrap(encoder.write(chunk));
            }
        };
    }
    async function encodingExists(encoding) {
        const iconv = await (0, amdX_1.importAMDNodeModule)('@vscode/iconv-lite-umd', 'lib/iconv-lite-umd.js');
        return iconv.encodingExists(toNodeEncoding(encoding));
    }
    function toNodeEncoding(enc) {
        if (enc === exports.UTF8_with_bom || enc === null) {
            return exports.UTF8; // iconv does not distinguish UTF 8 with or without BOM, so we need to help it
        }
        return enc;
    }
    function detectEncodingByBOMFromBuffer(buffer, bytesRead) {
        if (!buffer || bytesRead < exports.UTF16be_BOM.length) {
            return null;
        }
        const b0 = buffer.readUInt8(0);
        const b1 = buffer.readUInt8(1);
        // UTF-16 BE
        if (b0 === exports.UTF16be_BOM[0] && b1 === exports.UTF16be_BOM[1]) {
            return exports.UTF16be;
        }
        // UTF-16 LE
        if (b0 === exports.UTF16le_BOM[0] && b1 === exports.UTF16le_BOM[1]) {
            return exports.UTF16le;
        }
        if (bytesRead < exports.UTF8_BOM.length) {
            return null;
        }
        const b2 = buffer.readUInt8(2);
        // UTF-8
        if (b0 === exports.UTF8_BOM[0] && b1 === exports.UTF8_BOM[1] && b2 === exports.UTF8_BOM[2]) {
            return exports.UTF8_with_bom;
        }
        return null;
    }
    // we explicitly ignore a specific set of encodings from auto guessing
    // - ASCII: we never want this encoding (most UTF-8 files would happily detect as
    //          ASCII files and then you could not type non-ASCII characters anymore)
    // - UTF-16: we have our own detection logic for UTF-16
    // - UTF-32: we do not support this encoding in VSCode
    const IGNORE_ENCODINGS = ['ascii', 'utf-16', 'utf-32'];
    /**
     * Guesses the encoding from buffer.
     */
    async function guessEncodingByBuffer(buffer) {
        const jschardet = await (0, amdX_1.importAMDNodeModule)('jschardet', 'dist/jschardet.min.js');
        // ensure to limit buffer for guessing due to https://github.com/aadsm/jschardet/issues/53
        const limitedBuffer = buffer.slice(0, AUTO_ENCODING_GUESS_MAX_BYTES);
        // before guessing jschardet calls toString('binary') on input if it is a Buffer,
        // since we are using it inside browser environment as well we do conversion ourselves
        // https://github.com/aadsm/jschardet/blob/v2.1.1/src/index.js#L36-L40
        const binaryString = encodeLatin1(limitedBuffer.buffer);
        const guessed = jschardet.detect(binaryString);
        if (!guessed || !guessed.encoding) {
            return null;
        }
        const enc = guessed.encoding.toLowerCase();
        if (0 <= IGNORE_ENCODINGS.indexOf(enc)) {
            return null; // see comment above why we ignore some encodings
        }
        return toIconvLiteEncoding(guessed.encoding);
    }
    const JSCHARDET_TO_ICONV_ENCODINGS = {
        'ibm866': 'cp866',
        'big5': 'cp950'
    };
    function toIconvLiteEncoding(encodingName) {
        const normalizedEncodingName = encodingName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const mapped = JSCHARDET_TO_ICONV_ENCODINGS[normalizedEncodingName];
        return mapped || normalizedEncodingName;
    }
    function encodeLatin1(buffer) {
        let result = '';
        for (let i = 0; i < buffer.length; i++) {
            result += String.fromCharCode(buffer[i]);
        }
        return result;
    }
    /**
     * The encodings that are allowed in a settings file don't match the canonical encoding labels specified by WHATWG.
     * See https://encoding.spec.whatwg.org/#names-and-labels
     * Iconv-lite strips all non-alphanumeric characters, but ripgrep doesn't. For backcompat, allow these labels.
     */
    function toCanonicalName(enc) {
        switch (enc) {
            case 'shiftjis':
                return 'shift-jis';
            case 'utf16le':
                return 'utf-16le';
            case 'utf16be':
                return 'utf-16be';
            case 'big5hkscs':
                return 'big5-hkscs';
            case 'eucjp':
                return 'euc-jp';
            case 'euckr':
                return 'euc-kr';
            case 'koi8r':
                return 'koi8-r';
            case 'koi8u':
                return 'koi8-u';
            case 'macroman':
                return 'x-mac-roman';
            case 'utf8bom':
                return 'utf8';
            default: {
                const m = enc.match(/windows(\d+)/);
                if (m) {
                    return 'windows-' + m[1];
                }
                return enc;
            }
        }
    }
    function detectEncodingFromBuffer({ buffer, bytesRead }, autoGuessEncoding) {
        // Always first check for BOM to find out about encoding
        let encoding = detectEncodingByBOMFromBuffer(buffer, bytesRead);
        // Detect 0 bytes to see if file is binary or UTF-16 LE/BE
        // unless we already know that this file has a UTF-16 encoding
        let seemsBinary = false;
        if (encoding !== exports.UTF16be && encoding !== exports.UTF16le && buffer) {
            let couldBeUTF16LE = true; // e.g. 0xAA 0x00
            let couldBeUTF16BE = true; // e.g. 0x00 0xAA
            let containsZeroByte = false;
            // This is a simplified guess to detect UTF-16 BE or LE by just checking if
            // the first 512 bytes have the 0-byte at a specific location. For UTF-16 LE
            // this would be the odd byte index and for UTF-16 BE the even one.
            // Note: this can produce false positives (a binary file that uses a 2-byte
            // encoding of the same format as UTF-16) and false negatives (a UTF-16 file
            // that is using 4 bytes to encode a character).
            for (let i = 0; i < bytesRead && i < ZERO_BYTE_DETECTION_BUFFER_MAX_LEN; i++) {
                const isEndian = (i % 2 === 1); // assume 2-byte sequences typical for UTF-16
                const isZeroByte = (buffer.readUInt8(i) === 0);
                if (isZeroByte) {
                    containsZeroByte = true;
                }
                // UTF-16 LE: expect e.g. 0xAA 0x00
                if (couldBeUTF16LE && (isEndian && !isZeroByte || !isEndian && isZeroByte)) {
                    couldBeUTF16LE = false;
                }
                // UTF-16 BE: expect e.g. 0x00 0xAA
                if (couldBeUTF16BE && (isEndian && isZeroByte || !isEndian && !isZeroByte)) {
                    couldBeUTF16BE = false;
                }
                // Return if this is neither UTF16-LE nor UTF16-BE and thus treat as binary
                if (isZeroByte && !couldBeUTF16LE && !couldBeUTF16BE) {
                    break;
                }
            }
            // Handle case of 0-byte included
            if (containsZeroByte) {
                if (couldBeUTF16LE) {
                    encoding = exports.UTF16le;
                }
                else if (couldBeUTF16BE) {
                    encoding = exports.UTF16be;
                }
                else {
                    seemsBinary = true;
                }
            }
        }
        // Auto guess encoding if configured
        if (autoGuessEncoding && !seemsBinary && !encoding && buffer) {
            return guessEncodingByBuffer(buffer.slice(0, bytesRead)).then(guessedEncoding => {
                return {
                    seemsBinary: false,
                    encoding: guessedEncoding
                };
            });
        }
        return { seemsBinary, encoding };
    }
    exports.SUPPORTED_ENCODINGS = {
        utf8: {
            labelLong: 'UTF-8',
            labelShort: 'UTF-8',
            order: 1,
            alias: 'utf8bom'
        },
        utf8bom: {
            labelLong: 'UTF-8 with BOM',
            labelShort: 'UTF-8 with BOM',
            encodeOnly: true,
            order: 2,
            alias: 'utf8'
        },
        utf16le: {
            labelLong: 'UTF-16 LE',
            labelShort: 'UTF-16 LE',
            order: 3
        },
        utf16be: {
            labelLong: 'UTF-16 BE',
            labelShort: 'UTF-16 BE',
            order: 4
        },
        windows1252: {
            labelLong: 'Western (Windows 1252)',
            labelShort: 'Windows 1252',
            order: 5
        },
        iso88591: {
            labelLong: 'Western (ISO 8859-1)',
            labelShort: 'ISO 8859-1',
            order: 6
        },
        iso88593: {
            labelLong: 'Western (ISO 8859-3)',
            labelShort: 'ISO 8859-3',
            order: 7
        },
        iso885915: {
            labelLong: 'Western (ISO 8859-15)',
            labelShort: 'ISO 8859-15',
            order: 8
        },
        macroman: {
            labelLong: 'Western (Mac Roman)',
            labelShort: 'Mac Roman',
            order: 9
        },
        cp437: {
            labelLong: 'DOS (CP 437)',
            labelShort: 'CP437',
            order: 10
        },
        windows1256: {
            labelLong: 'Arabic (Windows 1256)',
            labelShort: 'Windows 1256',
            order: 11
        },
        iso88596: {
            labelLong: 'Arabic (ISO 8859-6)',
            labelShort: 'ISO 8859-6',
            order: 12
        },
        windows1257: {
            labelLong: 'Baltic (Windows 1257)',
            labelShort: 'Windows 1257',
            order: 13
        },
        iso88594: {
            labelLong: 'Baltic (ISO 8859-4)',
            labelShort: 'ISO 8859-4',
            order: 14
        },
        iso885914: {
            labelLong: 'Celtic (ISO 8859-14)',
            labelShort: 'ISO 8859-14',
            order: 15
        },
        windows1250: {
            labelLong: 'Central European (Windows 1250)',
            labelShort: 'Windows 1250',
            order: 16
        },
        iso88592: {
            labelLong: 'Central European (ISO 8859-2)',
            labelShort: 'ISO 8859-2',
            order: 17
        },
        cp852: {
            labelLong: 'Central European (CP 852)',
            labelShort: 'CP 852',
            order: 18
        },
        windows1251: {
            labelLong: 'Cyrillic (Windows 1251)',
            labelShort: 'Windows 1251',
            order: 19
        },
        cp866: {
            labelLong: 'Cyrillic (CP 866)',
            labelShort: 'CP 866',
            order: 20
        },
        iso88595: {
            labelLong: 'Cyrillic (ISO 8859-5)',
            labelShort: 'ISO 8859-5',
            order: 21
        },
        koi8r: {
            labelLong: 'Cyrillic (KOI8-R)',
            labelShort: 'KOI8-R',
            order: 22
        },
        koi8u: {
            labelLong: 'Cyrillic (KOI8-U)',
            labelShort: 'KOI8-U',
            order: 23
        },
        iso885913: {
            labelLong: 'Estonian (ISO 8859-13)',
            labelShort: 'ISO 8859-13',
            order: 24
        },
        windows1253: {
            labelLong: 'Greek (Windows 1253)',
            labelShort: 'Windows 1253',
            order: 25
        },
        iso88597: {
            labelLong: 'Greek (ISO 8859-7)',
            labelShort: 'ISO 8859-7',
            order: 26
        },
        windows1255: {
            labelLong: 'Hebrew (Windows 1255)',
            labelShort: 'Windows 1255',
            order: 27
        },
        iso88598: {
            labelLong: 'Hebrew (ISO 8859-8)',
            labelShort: 'ISO 8859-8',
            order: 28
        },
        iso885910: {
            labelLong: 'Nordic (ISO 8859-10)',
            labelShort: 'ISO 8859-10',
            order: 29
        },
        iso885916: {
            labelLong: 'Romanian (ISO 8859-16)',
            labelShort: 'ISO 8859-16',
            order: 30
        },
        windows1254: {
            labelLong: 'Turkish (Windows 1254)',
            labelShort: 'Windows 1254',
            order: 31
        },
        iso88599: {
            labelLong: 'Turkish (ISO 8859-9)',
            labelShort: 'ISO 8859-9',
            order: 32
        },
        windows1258: {
            labelLong: 'Vietnamese (Windows 1258)',
            labelShort: 'Windows 1258',
            order: 33
        },
        gbk: {
            labelLong: 'Simplified Chinese (GBK)',
            labelShort: 'GBK',
            order: 34
        },
        gb18030: {
            labelLong: 'Simplified Chinese (GB18030)',
            labelShort: 'GB18030',
            order: 35
        },
        cp950: {
            labelLong: 'Traditional Chinese (Big5)',
            labelShort: 'Big5',
            order: 36
        },
        big5hkscs: {
            labelLong: 'Traditional Chinese (Big5-HKSCS)',
            labelShort: 'Big5-HKSCS',
            order: 37
        },
        shiftjis: {
            labelLong: 'Japanese (Shift JIS)',
            labelShort: 'Shift JIS',
            order: 38
        },
        eucjp: {
            labelLong: 'Japanese (EUC-JP)',
            labelShort: 'EUC-JP',
            order: 39
        },
        euckr: {
            labelLong: 'Korean (EUC-KR)',
            labelShort: 'EUC-KR',
            order: 40
        },
        windows874: {
            labelLong: 'Thai (Windows 874)',
            labelShort: 'Windows 874',
            order: 41
        },
        iso885911: {
            labelLong: 'Latin/Thai (ISO 8859-11)',
            labelShort: 'ISO 8859-11',
            order: 42
        },
        koi8ru: {
            labelLong: 'Cyrillic (KOI8-RU)',
            labelShort: 'KOI8-RU',
            order: 43
        },
        koi8t: {
            labelLong: 'Tajik (KOI8-T)',
            labelShort: 'KOI8-T',
            order: 44
        },
        gb2312: {
            labelLong: 'Simplified Chinese (GB 2312)',
            labelShort: 'GB 2312',
            order: 45
        },
        cp865: {
            labelLong: 'Nordic DOS (CP 865)',
            labelShort: 'CP 865',
            order: 46
        },
        cp850: {
            labelLong: 'Western European DOS (CP 850)',
            labelShort: 'CP 850',
            order: 47
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jb2RpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0ZmlsZS9jb21tb24vZW5jb2RpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLHNDQUVDO0lBaUdELHdDQWdHQztJQUVELDRDQStDQztJQUVELHdDQUlDO0lBRUQsd0NBTUM7SUFFRCxzRUE4QkM7SUE4REQsMENBK0JDO0lBY0QsNERBa0VDO0lBdGRZLFFBQUEsSUFBSSxHQUFHLE1BQU0sQ0FBQztJQUNkLFFBQUEsYUFBYSxHQUFHLFNBQVMsQ0FBQztJQUMxQixRQUFBLE9BQU8sR0FBRyxTQUFTLENBQUM7SUFDcEIsUUFBQSxPQUFPLEdBQUcsU0FBUyxDQUFDO0lBSWpDLFNBQWdCLGFBQWEsQ0FBQyxRQUFnQjtRQUM3QyxPQUFPLENBQUMsWUFBSSxFQUFFLHFCQUFhLEVBQUUsZUFBTyxFQUFFLGVBQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFdBQVcsS0FBSyxRQUFRLENBQUMsQ0FBQztJQUM5RixDQUFDO0lBRVksUUFBQSxXQUFXLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDM0IsUUFBQSxXQUFXLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDM0IsUUFBQSxRQUFRLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRTNDLE1BQU0sa0NBQWtDLEdBQUcsR0FBRyxDQUFDLENBQUUsd0VBQXdFO0lBQ3pILE1BQU0sMkJBQTJCLEdBQUcsR0FBRyxDQUFDLENBQUksd0VBQXdFO0lBQ3BILE1BQU0sNkJBQTZCLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFHLHdFQUF3RTtJQUN6SCxN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