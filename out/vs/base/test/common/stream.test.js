/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/stream", "vs/base/test/common/utils"], function (require, exports, assert, async_1, buffer_1, cancellation_1, stream_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Stream', () => {
        test('isReadable', () => {
            assert.ok(!(0, stream_1.isReadable)(undefined));
            assert.ok(!(0, stream_1.isReadable)(Object.create(null)));
            assert.ok((0, stream_1.isReadable)((0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(''))));
        });
        test('isReadableStream', () => {
            assert.ok(!(0, stream_1.isReadableStream)(undefined));
            assert.ok(!(0, stream_1.isReadableStream)(Object.create(null)));
            assert.ok((0, stream_1.isReadableStream)((0, stream_1.newWriteableStream)(d => d)));
        });
        test('isReadableBufferedStream', async () => {
            assert.ok(!(0, stream_1.isReadableBufferedStream)(Object.create(null)));
            const stream = (0, stream_1.newWriteableStream)(d => d);
            stream.end();
            const bufferedStream = await (0, stream_1.peekStream)(stream, 1);
            assert.ok((0, stream_1.isReadableBufferedStream)(bufferedStream));
        });
        test('WriteableStream - basics', () => {
            const stream = (0, stream_1.newWriteableStream)(strings => strings.join());
            let error = false;
            stream.on('error', e => {
                error = true;
            });
            let end = false;
            stream.on('end', () => {
                end = true;
            });
            stream.write('Hello');
            const chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            assert.strictEqual(chunks[0], 'Hello');
            stream.write('World');
            assert.strictEqual(chunks[1], 'World');
            assert.strictEqual(error, false);
            assert.strictEqual(end, false);
            stream.pause();
            stream.write('1');
            stream.write('2');
            stream.write('3');
            assert.strictEqual(chunks.length, 2);
            stream.resume();
            assert.strictEqual(chunks.length, 3);
            assert.strictEqual(chunks[2], '1,2,3');
            stream.error(new Error());
            assert.strictEqual(error, true);
            error = false;
            stream.error(new Error());
            assert.strictEqual(error, true);
            stream.end('Final Bit');
            assert.strictEqual(chunks.length, 4);
            assert.strictEqual(chunks[3], 'Final Bit');
            assert.strictEqual(end, true);
            stream.destroy();
            stream.write('Unexpected');
            assert.strictEqual(chunks.length, 4);
        });
        test('WriteableStream - end with empty string works', async () => {
            const reducer = (strings) => strings.length > 0 ? strings.join() : 'error';
            const stream = (0, stream_1.newWriteableStream)(reducer);
            stream.end('');
            const result = await (0, stream_1.consumeStream)(stream, reducer);
            assert.strictEqual(result, '');
        });
        test('WriteableStream - end with error works', async () => {
            const reducer = (errors) => errors[0];
            const stream = (0, stream_1.newWriteableStream)(reducer);
            stream.end(new Error('error'));
            const result = await (0, stream_1.consumeStream)(stream, reducer);
            assert.ok(result instanceof Error);
        });
        test('WriteableStream - removeListener', () => {
            const stream = (0, stream_1.newWriteableStream)(strings => strings.join());
            let error = false;
            const errorListener = (e) => {
                error = true;
            };
            stream.on('error', errorListener);
            let data = false;
            const dataListener = () => {
                data = true;
            };
            stream.on('data', dataListener);
            stream.write('Hello');
            assert.strictEqual(data, true);
            data = false;
            stream.removeListener('data', dataListener);
            stream.write('World');
            assert.strictEqual(data, false);
            stream.error(new Error());
            assert.strictEqual(error, true);
            error = false;
            stream.removeListener('error', errorListener);
            // always leave at least one error listener to streams to avoid unexpected errors during test running
            stream.on('error', () => { });
            stream.error(new Error());
            assert.strictEqual(error, false);
        });
        test('WriteableStream - highWaterMark', async () => {
            const stream = (0, stream_1.newWriteableStream)(strings => strings.join(), { highWaterMark: 3 });
            let res = stream.write('1');
            assert.ok(!res);
            res = stream.write('2');
            assert.ok(!res);
            res = stream.write('3');
            assert.ok(!res);
            const promise1 = stream.write('4');
            assert.ok(promise1 instanceof Promise);
            const promise2 = stream.write('5');
            assert.ok(promise2 instanceof Promise);
            let drained1 = false;
            (async () => {
                await promise1;
                drained1 = true;
            })();
            let drained2 = false;
            (async () => {
                await promise2;
                drained2 = true;
            })();
            let data = undefined;
            stream.on('data', chunk => {
                data = chunk;
            });
            assert.ok(data);
            await (0, async_1.timeout)(0);
            assert.strictEqual(drained1, true);
            assert.strictEqual(drained2, true);
        });
        test('consumeReadable', () => {
            const readable = arrayToReadable(['1', '2', '3', '4', '5']);
            const consumed = (0, stream_1.consumeReadable)(readable, strings => strings.join());
            assert.strictEqual(consumed, '1,2,3,4,5');
        });
        test('peekReadable', () => {
            for (let i = 0; i < 5; i++) {
                const readable = arrayToReadable(['1', '2', '3', '4', '5']);
                const consumedOrReadable = (0, stream_1.peekReadable)(readable, strings => strings.join(), i);
                if (typeof consumedOrReadable === 'string') {
                    assert.fail('Unexpected result');
                }
                else {
                    const consumed = (0, stream_1.consumeReadable)(consumedOrReadable, strings => strings.join());
                    assert.strictEqual(consumed, '1,2,3,4,5');
                }
            }
            let readable = arrayToReadable(['1', '2', '3', '4', '5']);
            let consumedOrReadable = (0, stream_1.peekReadable)(readable, strings => strings.join(), 5);
            assert.strictEqual(consumedOrReadable, '1,2,3,4,5');
            readable = arrayToReadable(['1', '2', '3', '4', '5']);
            consumedOrReadable = (0, stream_1.peekReadable)(readable, strings => strings.join(), 6);
            assert.strictEqual(consumedOrReadable, '1,2,3,4,5');
        });
        test('peekReadable - error handling', async () => {
            // 0 Chunks
            let stream = (0, stream_1.newWriteableStream)(data => data);
            let error = undefined;
            let promise = (async () => {
                try {
                    await (0, stream_1.peekStream)(stream, 1);
                }
                catch (err) {
                    error = err;
                }
            })();
            stream.error(new Error());
            await promise;
            assert.ok(error);
            // 1 Chunk
            stream = (0, stream_1.newWriteableStream)(data => data);
            error = undefined;
            promise = (async () => {
                try {
                    await (0, stream_1.peekStream)(stream, 1);
                }
                catch (err) {
                    error = err;
                }
            })();
            stream.write('foo');
            stream.error(new Error());
            await promise;
            assert.ok(error);
            // 2 Chunks
            stream = (0, stream_1.newWriteableStream)(data => data);
            error = undefined;
            promise = (async () => {
                try {
                    await (0, stream_1.peekStream)(stream, 1);
                }
                catch (err) {
                    error = err;
                }
            })();
            stream.write('foo');
            stream.write('bar');
            stream.error(new Error());
            await promise;
            assert.ok(!error);
            stream.on('error', err => error = err);
            stream.on('data', chunk => { });
            assert.ok(error);
        });
        function arrayToReadable(array) {
            return {
                read: () => array.shift() || null
            };
        }
        function readableToStream(readable) {
            const stream = (0, stream_1.newWriteableStream)(strings => strings.join());
            // Simulate async behavior
            setTimeout(() => {
                let chunk = null;
                while ((chunk = readable.read()) !== null) {
                    stream.write(chunk);
                }
                stream.end();
            }, 0);
            return stream;
        }
        test('consumeStream', async () => {
            const stream = readableToStream(arrayToReadable(['1', '2', '3', '4', '5']));
            const consumed = await (0, stream_1.consumeStream)(stream, strings => strings.join());
            assert.strictEqual(consumed, '1,2,3,4,5');
        });
        test('consumeStream - without reducer', async () => {
            const stream = readableToStream(arrayToReadable(['1', '2', '3', '4', '5']));
            const consumed = await (0, stream_1.consumeStream)(stream);
            assert.strictEqual(consumed, undefined);
        });
        test('consumeStream - without reducer and error', async () => {
            const stream = (0, stream_1.newWriteableStream)(strings => strings.join());
            stream.error(new Error());
            const consumed = await (0, stream_1.consumeStream)(stream);
            assert.strictEqual(consumed, undefined);
        });
        test('listenStream', () => {
            const stream = (0, stream_1.newWriteableStream)(strings => strings.join());
            let error = false;
            let end = false;
            let data = '';
            (0, stream_1.listenStream)(stream, {
                onData: d => {
                    data = d;
                },
                onError: e => {
                    error = true;
                },
                onEnd: () => {
                    end = true;
                }
            });
            stream.write('Hello');
            assert.strictEqual(data, 'Hello');
            stream.write('World');
            assert.strictEqual(data, 'World');
            assert.strictEqual(error, false);
            assert.strictEqual(end, false);
            stream.error(new Error());
            assert.strictEqual(error, true);
            stream.end('Final Bit');
            assert.strictEqual(end, true);
        });
        test('listenStream - cancellation', () => {
            const stream = (0, stream_1.newWriteableStream)(strings => strings.join());
            let error = false;
            let end = false;
            let data = '';
            const cts = new cancellation_1.CancellationTokenSource();
            (0, stream_1.listenStream)(stream, {
                onData: d => {
                    data = d;
                },
                onError: e => {
                    error = true;
                },
                onEnd: () => {
                    end = true;
                }
            }, cts.token);
            cts.cancel();
            stream.write('Hello');
            assert.strictEqual(data, '');
            stream.write('World');
            assert.strictEqual(data, '');
            stream.error(new Error());
            assert.strictEqual(error, false);
            stream.end('Final Bit');
            assert.strictEqual(end, false);
        });
        test('peekStream', async () => {
            for (let i = 0; i < 5; i++) {
                const stream = readableToStream(arrayToReadable(['1', '2', '3', '4', '5']));
                const result = await (0, stream_1.peekStream)(stream, i);
                assert.strictEqual(stream, result.stream);
                if (result.ended) {
                    assert.fail('Unexpected result, stream should not have ended yet');
                }
                else {
                    assert.strictEqual(result.buffer.length, i + 1, `maxChunks: ${i}`);
                    const additionalResult = [];
                    await (0, stream_1.consumeStream)(stream, strings => {
                        additionalResult.push(...strings);
                        return strings.join();
                    });
                    assert.strictEqual([...result.buffer, ...additionalResult].join(), '1,2,3,4,5');
                }
            }
            let stream = readableToStream(arrayToReadable(['1', '2', '3', '4', '5']));
            let result = await (0, stream_1.peekStream)(stream, 5);
            assert.strictEqual(stream, result.stream);
            assert.strictEqual(result.buffer.join(), '1,2,3,4,5');
            assert.strictEqual(result.ended, true);
            stream = readableToStream(arrayToReadable(['1', '2', '3', '4', '5']));
            result = await (0, stream_1.peekStream)(stream, 6);
            assert.strictEqual(stream, result.stream);
            assert.strictEqual(result.buffer.join(), '1,2,3,4,5');
            assert.strictEqual(result.ended, true);
        });
        test('toStream', async () => {
            const stream = (0, stream_1.toStream)('1,2,3,4,5', strings => strings.join());
            const consumed = await (0, stream_1.consumeStream)(stream, strings => strings.join());
            assert.strictEqual(consumed, '1,2,3,4,5');
        });
        test('toReadable', async () => {
            const readable = (0, stream_1.toReadable)('1,2,3,4,5');
            const consumed = (0, stream_1.consumeReadable)(readable, strings => strings.join());
            assert.strictEqual(consumed, '1,2,3,4,5');
        });
        test('transform', async () => {
            const source = (0, stream_1.newWriteableStream)(strings => strings.join());
            const result = (0, stream_1.transform)(source, { data: string => string + string }, strings => strings.join());
            // Simulate async behavior
            setTimeout(() => {
                source.write('1');
                source.write('2');
                source.write('3');
                source.write('4');
                source.end('5');
            }, 0);
            const consumed = await (0, stream_1.consumeStream)(result, strings => strings.join());
            assert.strictEqual(consumed, '11,22,33,44,55');
        });
        test('events are delivered even if a listener is removed during delivery', () => {
            const stream = (0, stream_1.newWriteableStream)(strings => strings.join());
            let listener1Called = false;
            let listener2Called = false;
            const listener1 = () => { stream.removeListener('end', listener1); listener1Called = true; };
            const listener2 = () => { listener2Called = true; };
            stream.on('end', listener1);
            stream.on('end', listener2);
            stream.on('data', () => { });
            stream.end('');
            assert.strictEqual(listener1Called, true);
            assert.strictEqual(listener2Called, true);
        });
        test('prefixedReadable', () => {
            // Basic
            let readable = (0, stream_1.prefixedReadable)('1,2', arrayToReadable(['3', '4', '5']), val => val.join(','));
            assert.strictEqual((0, stream_1.consumeReadable)(readable, val => val.join(',')), '1,2,3,4,5');
            // Empty
            readable = (0, stream_1.prefixedReadable)('empty', arrayToReadable([]), val => val.join(','));
            assert.strictEqual((0, stream_1.consumeReadable)(readable, val => val.join(',')), 'empty');
        });
        test('prefixedStream', async () => {
            // Basic
            let stream = (0, stream_1.newWriteableStream)(strings => strings.join());
            stream.write('3');
            stream.write('4');
            stream.write('5');
            stream.end();
            let prefixStream = (0, stream_1.prefixedStream)('1,2', stream, val => val.join(','));
            assert.strictEqual(await (0, stream_1.consumeStream)(prefixStream, val => val.join(',')), '1,2,3,4,5');
            // Empty
            stream = (0, stream_1.newWriteableStream)(strings => strings.join());
            stream.end();
            prefixStream = (0, stream_1.prefixedStream)('1,2', stream, val => val.join(','));
            assert.strictEqual(await (0, stream_1.consumeStream)(prefixStream, val => val.join(',')), '1,2');
            // Error
            stream = (0, stream_1.newWriteableStream)(strings => strings.join());
            stream.error(new Error('fail'));
            prefixStream = (0, stream_1.prefixedStream)('error', stream, val => val.join(','));
            let error;
            try {
                await (0, stream_1.consumeStream)(prefixStream, val => val.join(','));
            }
            catch (e) {
                error = e;
            }
            assert.ok(error);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyZWFtLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vc3RyZWFtLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsS0FBSyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7UUFFcEIsSUFBSSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7WUFDdkIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUEsbUJBQVUsRUFBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFBLG1CQUFVLEVBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFBLG1CQUFVLEVBQUMsSUFBQSx5QkFBZ0IsRUFBQyxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7WUFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUEseUJBQWdCLEVBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBQSx5QkFBZ0IsRUFBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUEseUJBQWdCLEVBQUMsSUFBQSwyQkFBa0IsRUFBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyww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