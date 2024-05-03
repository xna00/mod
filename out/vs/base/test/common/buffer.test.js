/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/stream", "vs/base/test/common/utils"], function (require, exports, assert, async_1, buffer_1, stream_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Buffer', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #71993 - VSBuffer#toString returns numbers', () => {
            const data = new Uint8Array([1, 2, 3, 'h'.charCodeAt(0), 'i'.charCodeAt(0), 4, 5]).buffer;
            const buffer = buffer_1.VSBuffer.wrap(new Uint8Array(data, 3, 2));
            assert.deepStrictEqual(buffer.toString(), 'hi');
        });
        test('bufferToReadable / readableToBuffer', () => {
            const content = 'Hello World';
            const readable = (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(content));
            assert.strictEqual((0, buffer_1.readableToBuffer)(readable).toString(), content);
        });
        test('bufferToStream / streamToBuffer', async () => {
            const content = 'Hello World';
            const stream = (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(content));
            assert.strictEqual((await (0, buffer_1.streamToBuffer)(stream)).toString(), content);
        });
        test('bufferedStreamToBuffer', async () => {
            const content = 'Hello World';
            const stream = await (0, stream_1.peekStream)((0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(content)), 1);
            assert.strictEqual((await (0, buffer_1.bufferedStreamToBuffer)(stream)).toString(), content);
        });
        test('bufferWriteableStream - basics (no error)', async () => {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            const chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            const errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            await (0, async_1.timeout)(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            await (0, async_1.timeout)(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            assert.strictEqual(chunks.length, 2);
            assert.strictEqual(chunks[0].toString(), 'Hello');
            assert.strictEqual(chunks[1].toString(), 'World');
            assert.strictEqual(ended, true);
            assert.strictEqual(errors.length, 0);
        });
        test('bufferWriteableStream - basics (error)', async () => {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            const chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            const errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            await (0, async_1.timeout)(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            await (0, async_1.timeout)(0);
            stream.error(new Error());
            stream.end();
            assert.strictEqual(chunks.length, 1);
            assert.strictEqual(chunks[0].toString(), 'Hello');
            assert.strictEqual(ended, true);
            assert.strictEqual(errors.length, 1);
        });
        test('bufferWriteableStream - buffers data when no listener', async () => {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            await (0, async_1.timeout)(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            await (0, async_1.timeout)(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            const chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            const errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            assert.strictEqual(chunks.length, 1);
            assert.strictEqual(chunks[0].toString(), 'HelloWorld');
            assert.strictEqual(ended, true);
            assert.strictEqual(errors.length, 0);
        });
        test('bufferWriteableStream - buffers errors when no listener', async () => {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            await (0, async_1.timeout)(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            await (0, async_1.timeout)(0);
            stream.error(new Error());
            const chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            const errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            stream.end();
            assert.strictEqual(chunks.length, 1);
            assert.strictEqual(chunks[0].toString(), 'Hello');
            assert.strictEqual(ended, true);
            assert.strictEqual(errors.length, 1);
        });
        test('bufferWriteableStream - buffers end when no listener', async () => {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            await (0, async_1.timeout)(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            await (0, async_1.timeout)(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            const chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            const errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            assert.strictEqual(chunks.length, 1);
            assert.strictEqual(chunks[0].toString(), 'HelloWorld');
            assert.strictEqual(ended, true);
            assert.strictEqual(errors.length, 0);
        });
        test('bufferWriteableStream - nothing happens after end()', async () => {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            const chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            await (0, async_1.timeout)(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            await (0, async_1.timeout)(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            let dataCalledAfterEnd = false;
            stream.on('data', data => {
                dataCalledAfterEnd = true;
            });
            let errorCalledAfterEnd = false;
            stream.on('error', error => {
                errorCalledAfterEnd = true;
            });
            let endCalledAfterEnd = false;
            stream.on('end', () => {
                endCalledAfterEnd = true;
            });
            await (0, async_1.timeout)(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            await (0, async_1.timeout)(0);
            stream.error(new Error());
            await (0, async_1.timeout)(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            assert.strictEqual(dataCalledAfterEnd, false);
            assert.strictEqual(errorCalledAfterEnd, false);
            assert.strictEqual(endCalledAfterEnd, false);
            assert.strictEqual(chunks.length, 2);
            assert.strictEqual(chunks[0].toString(), 'Hello');
            assert.strictEqual(chunks[1].toString(), 'World');
        });
        test('bufferWriteableStream - pause/resume (simple)', async () => {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            const chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            const errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            stream.pause();
            await (0, async_1.timeout)(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            await (0, async_1.timeout)(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            assert.strictEqual(chunks.length, 0);
            assert.strictEqual(errors.length, 0);
            assert.strictEqual(ended, false);
            stream.resume();
            assert.strictEqual(chunks.length, 1);
            assert.strictEqual(chunks[0].toString(), 'HelloWorld');
            assert.strictEqual(ended, true);
            assert.strictEqual(errors.length, 0);
        });
        test('bufferWriteableStream - pause/resume (pause after first write)', async () => {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            const chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            const errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            await (0, async_1.timeout)(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            stream.pause();
            await (0, async_1.timeout)(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            assert.strictEqual(chunks.length, 1);
            assert.strictEqual(chunks[0].toString(), 'Hello');
            assert.strictEqual(errors.length, 0);
            assert.strictEqual(ended, false);
            stream.resume();
            assert.strictEqual(chunks.length, 2);
            assert.strictEqual(chunks[0].toString(), 'Hello');
            assert.strictEqual(chunks[1].toString(), 'World');
            assert.strictEqual(ended, true);
            assert.strictEqual(errors.length, 0);
        });
        test('bufferWriteableStream - pause/resume (error)', async () => {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            const chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            const errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            stream.pause();
            await (0, async_1.timeout)(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            await (0, async_1.timeout)(0);
            stream.error(new Error());
            stream.end();
            assert.strictEqual(chunks.length, 0);
            assert.strictEqual(ended, false);
            assert.strictEqual(errors.length, 0);
            stream.resume();
            assert.strictEqual(chunks.length, 1);
            assert.strictEqual(chunks[0].toString(), 'Hello');
            assert.strictEqual(ended, true);
            assert.strictEqual(errors.length, 1);
        });
        test('bufferWriteableStream - destroy', async () => {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            const chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            const errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            stream.destroy();
            await (0, async_1.timeout)(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            await (0, async_1.timeout)(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            assert.strictEqual(chunks.length, 0);
            assert.strictEqual(ended, false);
            assert.strictEqual(errors.length, 0);
        });
        test('Performance issue with VSBuffer#slice #76076', function () {
            // Buffer#slice creates a view
            if (typeof Buffer !== 'undefined') {
                const buff = Buffer.from([10, 20, 30, 40]);
                const b2 = buff.slice(1, 3);
                assert.strictEqual(buff[1], 20);
                assert.strictEqual(b2[0], 20);
                buff[1] = 17; // modify buff AND b2
                assert.strictEqual(buff[1], 17);
                assert.strictEqual(b2[0], 17);
            }
            // TypedArray#slice creates a copy
            {
                const unit = new Uint8Array([10, 20, 30, 40]);
                const u2 = unit.slice(1, 3);
                assert.strictEqual(unit[1], 20);
                assert.strictEqual(u2[0], 20);
                unit[1] = 17; // modify unit, NOT b2
                assert.strictEqual(unit[1], 17);
                assert.strictEqual(u2[0], 20);
            }
            // TypedArray#subarray creates a view
            {
                const unit = new Uint8Array([10, 20, 30, 40]);
                const u2 = unit.subarray(1, 3);
                assert.strictEqual(unit[1], 20);
                assert.strictEqual(u2[0], 20);
                unit[1] = 17; // modify unit AND b2
                assert.strictEqual(unit[1], 17);
                assert.strictEqual(u2[0], 17);
            }
        });
        test('indexOf', () => {
            const haystack = buffer_1.VSBuffer.fromString('abcaabbccaaabbbccc');
            assert.strictEqual(haystack.indexOf(buffer_1.VSBuffer.fromString('')), 0);
            assert.strictEqual(haystack.indexOf(buffer_1.VSBuffer.fromString('a'.repeat(100))), -1);
            assert.strictEqual(haystack.indexOf(buffer_1.VSBuffer.fromString('a')), 0);
            assert.strictEqual(haystack.indexOf(buffer_1.VSBuffer.fromString('c')), 2);
            assert.strictEqual(haystack.indexOf(buffer_1.VSBuffer.fromString('abcaa')), 0);
            assert.strictEqual(haystack.indexOf(buffer_1.VSBuffer.fromString('caaab')), 8);
            assert.strictEqual(haystack.indexOf(buffer_1.VSBuffer.fromString('ccc')), 15);
            assert.strictEqual(haystack.indexOf(buffer_1.VSBuffer.fromString('cccb')), -1);
        });
        suite('base64', () => {
            /*
            Generated with:
    
            const crypto = require('crypto');
    
            for (let i = 0; i < 16; i++) {
                const buf =  crypto.randomBytes(i);
                console.log(`[new Uint8Array([${Array.from(buf).join(', ')}]), '${buf.toString('base64')}'],`)
            }
    
            */
            const testCases = [
                [new Uint8Array([]), ''],
                [new Uint8Array([56]), 'OA=='],
                [new Uint8Array([209, 4]), '0QQ='],
                [new Uint8Array([19, 57, 119]), 'Ezl3'],
                [new Uint8Array([199, 237, 207, 112]), 'x+3PcA=='],
                [new Uint8Array([59, 193, 173, 26, 242]), 'O8GtGvI='],
                [new Uint8Array([81, 226, 95, 231, 116, 126]), 'UeJf53R+'],
                [new Uint8Array([11, 164, 253, 85, 8, 6, 56]), 'C6T9VQgGOA=='],
                [new Uint8Array([164, 16, 88, 88, 224, 173, 144, 114]), 'pBBYWOCtkHI='],
                [new Uint8Array([0, 196, 99, 12, 21, 229, 78, 101, 13]), 'AMRjDBXlTmUN'],
                [new Uint8Array([167, 114, 225, 116, 226, 83, 51, 48, 88, 114]), 'p3LhdOJTMzBYcg=='],
                [new Uint8Array([75, 33, 118, 10, 77, 5, 168, 194, 59, 47, 59]), 'SyF2Ck0FqMI7Lzs='],
                [new Uint8Array([203, 182, 165, 51, 208, 27, 123, 223, 112, 198, 127, 147]), 'y7alM9Abe99wxn+T'],
                [new Uint8Array([154, 93, 222, 41, 117, 234, 250, 85, 95, 144, 16, 94, 18]), 'ml3eKXXq+lVfkBBeEg=='],
                [new Uint8Array([246, 186, 88, 105, 192, 57, 25, 168, 183, 164, 103, 162, 243, 56]), '9rpYacA5Gai3pGei8zg='],
                [new Uint8Array([149, 240, 155, 96, 30, 55, 162, 172, 191, 187, 33, 124, 169, 183, 254]), 'lfCbYB43oqy/uyF8qbf+'],
            ];
            test('encodes', () => {
                for (const [bytes, expected] of testCases) {
                    assert.strictEqual((0, buffer_1.encodeBase64)(buffer_1.VSBuffer.wrap(bytes)), expected);
                }
            });
            test('decodes', () => {
                for (const [expected, encoded] of testCases) {
                    assert.deepStrictEqual(new Uint8Array((0, buffer_1.decodeBase64)(encoded).buffer), expected);
                }
            });
            test('throws error on invalid encoding', () => {
                assert.throws(() => (0, buffer_1.decodeBase64)('invalid!'));
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vYnVmZmVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsS0FBSyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7UUFFcEIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxrREFBa0QsRUFBRSxHQUFHLEVBQUU7WUFDN0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQzFGLE1BQU0sTUFBTSxHQUFHLGlCQUFRLENBQUMsSUFBSSxDQUFDLElBQUksVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7WUFDaEQsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDO1lBQzlCLE1BQU0sUUFBUSxHQUFHLElBQUEseUJBQWdCLEVBQUMsaUJBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUVoRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEseUJBQWdCLEVBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7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Q0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRTNDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVmLE1BQU0sSUFBQSxlQUFPLEVBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRXpDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFakMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRWhCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDL0QsTUFBTSxNQUFNLEdBQUcsSUFBQSxpQ0FBd0IsR0FBRSxDQUFDO1lBRTFDLE1BQU0s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Q0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDO2dCQUM5RCxDQUFDLElBQUksVUFBVSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDO2dCQUN2RSxDQUFDLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQztnQkFDeEUsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsa0JBQWtCLENBQUM7Z0JBQ3BGLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxrQkFBa0IsQ0FBQztnQkFDcEYsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxrQkFBa0IsQ0FBQztnQkFDaEcsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsc0JBQXNCLENBQUM7Z0JBQ3BHLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxzQkFBc0IsQ0FBQztnQkFDNUcsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxzQkFBc0IsQ0FBQzthQUNqSCxDQUFDO1lBRUYsSUFBSSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7Z0JBQ3BCLEtBQUssTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHFCQUFZLEVBQUMsaUJBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDbEUsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7Z0JBQ3BCLEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDN0MsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFBLHFCQUFZLEVBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ2hGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLEVBQUU7Z0JBQzdDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSxxQkFBWSxFQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDL0MsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=