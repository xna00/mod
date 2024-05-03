/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "vs/workbench/services/textfile/common/encoding", "vs/base/common/stream", "vs/base/common/buffer", "vs/base/common/strings", "vs/base/common/network", "vs/amdX", "vs/base/test/common/utils"], function (require, exports, assert, fs, encoding, streams, buffer_1, strings_1, network_1, amdX_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.detectEncodingByBOM = detectEncodingByBOM;
    async function detectEncodingByBOM(file) {
        try {
            const { buffer, bytesRead } = await readExactlyByFile(file, 3);
            return encoding.detectEncodingByBOMFromBuffer(buffer, bytesRead);
        }
        catch (error) {
            return null; // ignore errors (like file not found)
        }
    }
    function readExactlyByFile(file, totalBytes) {
        return new Promise((resolve, reject) => {
            fs.open(file, 'r', null, (err, fd) => {
                if (err) {
                    return reject(err);
                }
                function end(err, resultBuffer, bytesRead) {
                    fs.close(fd, closeError => {
                        if (closeError) {
                            return reject(closeError);
                        }
                        if (err && err.code === 'EISDIR') {
                            return reject(err); // we want to bubble this error up (file is actually a folder)
                        }
                        return resolve({ buffer: resultBuffer ? buffer_1.VSBuffer.wrap(resultBuffer) : null, bytesRead });
                    });
                }
                const buffer = Buffer.allocUnsafe(totalBytes);
                let offset = 0;
                function readChunk() {
                    fs.read(fd, buffer, offset, totalBytes - offset, null, (err, bytesRead) => {
                        if (err) {
                            return end(err, null, 0);
                        }
                        if (bytesRead === 0) {
                            return end(null, buffer, offset);
                        }
                        offset += bytesRead;
                        if (offset === totalBytes) {
                            return end(null, buffer, offset);
                        }
                        return readChunk();
                    });
                }
                readChunk();
            });
        });
    }
    suite('Encoding', () => {
        test('detectBOM does not return error for non existing file', async () => {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/not-exist.css').fsPath;
            const detectedEncoding = await detectEncodingByBOM(file);
            assert.strictEqual(detectedEncoding, null);
        });
        test('detectBOM UTF-8', async () => {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some_utf8.css').fsPath;
            const detectedEncoding = await detectEncodingByBOM(file);
            assert.strictEqual(detectedEncoding, 'utf8bom');
        });
        test('detectBOM UTF-16 LE', async () => {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some_utf16le.css').fsPath;
            const detectedEncoding = await detectEncodingByBOM(file);
            assert.strictEqual(detectedEncoding, 'utf16le');
        });
        test('detectBOM UTF-16 BE', async () => {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some_utf16be.css').fsPath;
            const detectedEncoding = await detectEncodingByBOM(file);
            assert.strictEqual(detectedEncoding, 'utf16be');
        });
        test('detectBOM ANSI', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some_ansi.css').fsPath;
            const detectedEncoding = await detectEncodingByBOM(file);
            assert.strictEqual(detectedEncoding, null);
        });
        test('detectBOM ANSI (2)', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/empty.txt').fsPath;
            const detectedEncoding = await detectEncodingByBOM(file);
            assert.strictEqual(detectedEncoding, null);
        });
        test('detectEncodingFromBuffer (JSON saved as PNG)', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some.json.png').fsPath;
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.seemsBinary, false);
        });
        test('detectEncodingFromBuffer (PNG saved as TXT)', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some.png.txt').fsPath;
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.seemsBinary, true);
        });
        test('detectEncodingFromBuffer (XML saved as PNG)', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some.xml.png').fsPath;
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.seemsBinary, false);
        });
        test('detectEncodingFromBuffer (QWOFF saved as TXT)', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some.qwoff.txt').fsPath;
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.seemsBinary, true);
        });
        test('detectEncodingFromBuffer (CSS saved as QWOFF)', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some.css.qwoff').fsPath;
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.seemsBinary, false);
        });
        test('detectEncodingFromBuffer (PDF)', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some.pdf').fsPath;
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.seemsBinary, true);
        });
        test('detectEncodingFromBuffer (guess UTF-16 LE from content without BOM)', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/utf16_le_nobom.txt').fsPath;
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.encoding, encoding.UTF16le);
            assert.strictEqual(mimes.seemsBinary, false);
        });
        test('detectEncodingFromBuffer (guess UTF-16 BE from content without BOM)', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/utf16_be_nobom.txt').fsPath;
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.encoding, encoding.UTF16be);
            assert.strictEqual(mimes.seemsBinary, false);
        });
        test('autoGuessEncoding (UTF8)', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some_file.css').fsPath;
            const buffer = await readExactlyByFile(file, 512 * 8);
            const mimes = await encoding.detectEncodingFromBuffer(buffer, true);
            assert.strictEqual(mimes.encoding, 'utf8');
        });
        test('autoGuessEncoding (ASCII)', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some_ansi.css').fsPath;
            const buffer = await readExactlyByFile(file, 512 * 8);
            const mimes = await encoding.detectEncodingFromBuffer(buffer, true);
            assert.strictEqual(mimes.encoding, null);
        });
        test('autoGuessEncoding (ShiftJIS)', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some.shiftjis.txt').fsPath;
            const buffer = await readExactlyByFile(file, 512 * 8);
            const mimes = await encoding.detectEncodingFromBuffer(buffer, true);
            assert.strictEqual(mimes.encoding, 'shiftjis');
        });
        test('autoGuessEncoding (CP1252)', async function () {
            const file = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some.cp1252.txt').fsPath;
            const buffer = await readExactlyByFile(file, 512 * 8);
            const mimes = await encoding.detectEncodingFromBuffer(buffer, true);
            assert.strictEqual(mimes.encoding, 'windows1252');
        });
        async function readAndDecodeFromDisk(path, fileEncoding) {
            return new Promise((resolve, reject) => {
                fs.readFile(path, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve((0, amdX_1.importAMDNodeModule)('@vscode/iconv-lite-umd', 'lib/iconv-lite-umd.js').then(iconv => iconv.decode(data, encoding.toNodeEncoding(fileEncoding))));
                    }
                });
            });
        }
        function newTestReadableStream(buffers) {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            buffers
                .map(buffer_1.VSBuffer.wrap)
                .forEach(buffer => {
                setTimeout(() => {
                    stream.write(buffer);
                });
            });
            setTimeout(() => {
                stream.end();
            });
            return stream;
        }
        async function readAllAsString(stream) {
            return streams.consumeStream(stream, strings => strings.join(''));
        }
        test('toDecodeStream - some stream', async function () {
            const source = newTestReadableStream([
                Buffer.from([65, 66, 67]),
                Buffer.from([65, 66, 67]),
                Buffer.from([65, 66, 67]),
            ]);
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 4, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            assert.ok(detected);
            assert.ok(stream);
            const content = await readAllAsString(stream);
            assert.strictEqual(content, 'ABCABCABC');
        });
        test('toDecodeStream - some stream, expect too much data', async function () {
            const source = newTestReadableStream([
                Buffer.from([65, 66, 67]),
                Buffer.from([65, 66, 67]),
                Buffer.from([65, 66, 67]),
            ]);
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 64, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            assert.ok(detected);
            assert.ok(stream);
            const content = await readAllAsString(stream);
            assert.strictEqual(content, 'ABCABCABC');
        });
        test('toDecodeStream - some stream, no data', async function () {
            const source = (0, buffer_1.newWriteableBufferStream)();
            source.end();
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 512, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            assert.ok(detected);
            assert.ok(stream);
            const content = await readAllAsString(stream);
            assert.strictEqual(content, '');
        });
        test('toDecodeStream - encoding, utf16be', async function () {
            const path = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some_utf16be.css').fsPath;
            const source = (0, buffer_1.streamToBufferReadableStream)(fs.createReadStream(path));
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 64, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            assert.strictEqual(detected.encoding, 'utf16be');
            assert.strictEqual(detected.seemsBinary, false);
            const expected = await readAndDecodeFromDisk(path, detected.encoding);
            const actual = await readAllAsString(stream);
            assert.strictEqual(actual, expected);
        });
        test('toDecodeStream - empty file', async function () {
            const path = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/empty.txt').fsPath;
            const source = (0, buffer_1.streamToBufferReadableStream)(fs.createReadStream(path));
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            const expected = await readAndDecodeFromDisk(path, detected.encoding);
            const actual = await readAllAsString(stream);
            assert.strictEqual(actual, expected);
        });
        test('toDecodeStream - decodes buffer entirely', async function () {
            const emojis = Buffer.from('🖥️💻💾');
            const incompleteEmojis = emojis.slice(0, emojis.length - 1);
            const buffers = [];
            for (let i = 0; i < incompleteEmojis.length; i++) {
                buffers.push(incompleteEmojis.slice(i, i + 1));
            }
            const source = newTestReadableStream(buffers);
            const { stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 4, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            const expected = new TextDecoder().decode(incompleteEmojis);
            const actual = await readAllAsString(stream);
            assert.strictEqual(actual, expected);
        });
        test('toDecodeStream - some stream (GBK issue #101856)', async function () {
            const path = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some_gbk.txt').fsPath;
            const source = (0, buffer_1.streamToBufferReadableStream)(fs.createReadStream(path));
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 4, guessEncoding: false, overwriteEncoding: async () => 'gbk' });
            assert.ok(detected);
            assert.ok(stream);
            const content = await readAllAsString(stream);
            assert.strictEqual(content.length, 65537);
        });
        test('toDecodeStream - some stream (UTF-8 issue #102202)', async function () {
            const path = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/issue_102202.txt').fsPath;
            const source = (0, buffer_1.streamToBufferReadableStream)(fs.createReadStream(path));
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 4, guessEncoding: false, overwriteEncoding: async () => 'utf-8' });
            assert.ok(detected);
            assert.ok(stream);
            const content = await readAllAsString(stream);
            const lines = (0, strings_1.splitLines)(content);
            assert.strictEqual(lines[981].toString(), '啊啊啊啊啊啊aaa啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊，啊啊啊啊啊啊啊啊啊啊啊。');
        });
        test('toDecodeStream - binary', async function () {
            const source = () => {
                return newTestReadableStream([
                    Buffer.from([0, 0, 0]),
                    Buffer.from('Hello World'),
                    Buffer.from([0])
                ]);
            };
            // acceptTextOnly: true
            let error = undefined;
            try {
                await encoding.toDecodeStream(source(), { acceptTextOnly: true, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            }
            catch (e) {
                error = e;
            }
            assert.ok(error instanceof encoding.DecodeStreamError);
            assert.strictEqual(error.decodeStreamErrorKind, 1 /* encoding.DecodeStreamErrorKind.STREAM_IS_BINARY */);
            // acceptTextOnly: false
            const { detected, stream } = await encoding.toDecodeStream(source(), { acceptTextOnly: false, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            assert.ok(detected);
            assert.strictEqual(detected.seemsBinary, true);
            assert.ok(stream);
        });
        test('toEncodeReadable - encoding, utf16be', async function () {
            const path = network_1.FileAccess.asFileUri('vs/workbench/services/textfile/test/node/encoding/fixtures/some_utf16be.css').fsPath;
            const source = await readAndDecodeFromDisk(path, encoding.UTF16be);
            const iconv = await (0, amdX_1.importAMDNodeModule)('@vscode/iconv-lite-umd', 'lib/iconv-lite-umd.js');
            const expected = buffer_1.VSBuffer.wrap(iconv.encode(source, encoding.toNodeEncoding(encoding.UTF16be))).toString();
            const actual = streams.consumeReadable(await encoding.toEncodeReadable(streams.toReadable(source), encoding.UTF16be), buffer_1.VSBuffer.concat).toString();
            assert.strictEqual(actual, expected);
        });
        test('toEncodeReadable - empty readable to utf8', async function () {
            const source = {
                read() {
                    return null;
                }
            };
            const actual = streams.consumeReadable(await encoding.toEncodeReadable(source, encoding.UTF8), buffer_1.VSBuffer.concat).toString();
            assert.strictEqual(actual, '');
        });
        [{
                utfEncoding: encoding.UTF8,
                relatedBom: encoding.UTF8_BOM
            }, {
                utfEncoding: encoding.UTF8_with_bom,
                relatedBom: encoding.UTF8_BOM
            }, {
                utfEncoding: encoding.UTF16be,
                relatedBom: encoding.UTF16be_BOM,
            }, {
                utfEncoding: encoding.UTF16le,
                relatedBom: encoding.UTF16le_BOM
            }].forEach(({ utfEncoding, relatedBom }) => {
            test(`toEncodeReadable - empty readable to ${utfEncoding} with BOM`, async function () {
                const source = {
                    read() {
                        return null;
                    }
                };
                const encodedReadable = encoding.toEncodeReadable(source, utfEncoding, { addBOM: true });
                const expected = buffer_1.VSBuffer.wrap(Buffer.from(relatedBom)).toString();
                const actual = streams.consumeReadable(await encodedReadable, buffer_1.VSBuffer.concat).toString();
                assert.strictEqual(actual, expected);
            });
        });
        test('encodingExists', async function () {
            for (const enc in encoding.SUPPORTED_ENCODINGS) {
                if (enc === encoding.UTF8_with_bom) {
                    continue; // skip over encodings from us
                }
                const iconv = await (0, amdX_1.importAMDNodeModule)('@vscode/iconv-lite-umd', 'lib/iconv-lite-umd.js');
                assert.strictEqual(iconv.encodingExists(enc), true, enc);
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jb2RpbmcudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RleHRmaWxlL3Rlc3Qvbm9kZS9lbmNvZGluZy9lbmNvZGluZy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLGtEQVFDO0lBUk0sS0FBSyxVQUFVLG1CQUFtQixDQUFDLElBQVk7UUFDckQsSUFBSSxDQUFDO1lBQ0osTUFBTSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxNQUFNLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUvRCxPQUFPLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDaEIsT0FBTyxJQUFJLENBQUMsQ0FBQyxzQ0FBc0M7UUFDcEQsQ0FBQztJQUNGLENBQUM7SUFPRCxTQUFTLGlCQUFpQixDQUFDLElBQVksRUFBRSxVQUFrQjtRQUMxRCxPQUFPLElBQUksT0FBTyxDQUFhLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ2xELEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQ3BDLElBQUksR0FBRyxFQUFFLENBQUM7b0JBQ1QsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLENBQUM7Z0JBRUQsU0FBUyxHQUFHLENBQUMsR0FBaUIsRUFBRSxZQUEyQixFQUFFLFNBQWlCO29CQUM3RSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsRUFBRTt3QkFDekIsSUFBSSxVQUFVLEVBQUUs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