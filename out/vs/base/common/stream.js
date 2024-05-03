/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle"], function (require, exports, errors_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isReadable = isReadable;
    exports.isReadableStream = isReadableStream;
    exports.isReadableBufferedStream = isReadableBufferedStream;
    exports.newWriteableStream = newWriteableStream;
    exports.consumeReadable = consumeReadable;
    exports.peekReadable = peekReadable;
    exports.consumeStream = consumeStream;
    exports.listenStream = listenStream;
    exports.peekStream = peekStream;
    exports.toStream = toStream;
    exports.emptyStream = emptyStream;
    exports.toReadable = toReadable;
    exports.transform = transform;
    exports.prefixedReadable = prefixedReadable;
    exports.prefixedStream = prefixedStream;
    function isReadable(obj) {
        const candidate = obj;
        if (!candidate) {
            return false;
        }
        return typeof candidate.read === 'function';
    }
    function isReadableStream(obj) {
        const candidate = obj;
        if (!candidate) {
            return false;
        }
        return [candidate.on, candidate.pause, candidate.resume, candidate.destroy].every(fn => typeof fn === 'function');
    }
    function isReadableBufferedStream(obj) {
        const candidate = obj;
        if (!candidate) {
            return false;
        }
        return isReadableStream(candidate.stream) && Array.isArray(candidate.buffer) && typeof candidate.ended === 'boolean';
    }
    function newWriteableStream(reducer, options) {
        return new WriteableStreamImpl(reducer, options);
    }
    class WriteableStreamImpl {
        constructor(reducer, options) {
            this.reducer = reducer;
            this.options = options;
            this.state = {
                flowing: false,
                ended: false,
                destroyed: false
            };
            this.buffer = {
                data: [],
                error: []
            };
            this.listeners = {
                data: [],
                error: [],
                end: []
            };
            this.pendingWritePromises = [];
        }
        pause() {
            if (this.state.destroyed) {
                return;
            }
            this.state.flowing = false;
        }
        resume() {
            if (this.state.destroyed) {
                return;
            }
            if (!this.state.flowing) {
                this.state.flowing = true;
                // emit buffered events
                this.flowData();
                this.flowErrors();
                this.flowEnd();
            }
        }
        write(data) {
            if (this.state.destroyed) {
                return;
            }
            // flowing: directly send the data to listeners
            if (this.state.flowing) {
                this.emitData(data);
            }
            // not yet flowing: buffer data until flowing
            else {
                this.buffer.data.push(data);
                // highWaterMark: if configured, signal back when buffer reached limits
                if (typeof this.options?.highWaterMark === 'number' && this.buffer.data.length > this.options.highWaterMark) {
                    return new Promise(resolve => this.pendingWritePromises.push(resolve));
                }
            }
        }
        error(error) {
            if (this.state.destroyed) {
                return;
            }
            // flowing: directly send the error to listeners
            if (this.state.flowing) {
                this.emitError(error);
            }
            // not yet flowing: buffer errors until flowing
            else {
                this.buffer.error.push(error);
            }
        }
        end(result) {
            if (this.state.destroyed) {
                return;
            }
            // end with data if provided
            if (typeof result !== 'undefined') {
                this.write(result);
            }
            // flowing: send end event to listeners
            if (this.state.flowing) {
                this.emitEnd();
                this.destroy();
            }
            // not yet flowing: remember state
            else {
                this.state.ended = true;
            }
        }
        emitData(data) {
            this.listeners.data.slice(0).forEach(listener => listener(data)); // slice to avoid listener mutation from delivering event
        }
        emitError(error) {
            if (this.listeners.error.length === 0) {
                (0, errors_1.onUnexpectedError)(error); // nobody listened to this error so we log it as unexpected
            }
            else {
                this.listeners.error.slice(0).forEach(listener => listener(error)); // slice to avoid listener mutation from delivering event
            }
        }
        emitEnd() {
            this.listeners.end.slice(0).forEach(listener => listener()); // slice to avoid listener mutation from delivering event
        }
        on(event, callback) {
            if (this.state.destroyed) {
                return;
            }
            switch (event) {
                case 'data':
                    this.listeners.data.push(callback);
                    // switch into flowing mode as soon as the first 'data'
                    // listener is added and we are not yet in flowing mode
                    this.resume();
                    break;
                case 'end':
                    this.listeners.end.push(callback);
                    // emit 'end' event directly if we are flowing
                    // and the end has already been reached
                    //
                    // finish() when it went through
                    if (this.state.flowing && this.flowEnd()) {
                        this.destroy();
                    }
                    break;
                case 'error':
                    this.listeners.error.push(callback);
                    // emit buffered 'error' events unless done already
                    // now that we know that we have at least one listener
                    if (this.state.flowing) {
                        this.flowErrors();
                    }
                    break;
            }
        }
        removeListener(event, callback) {
            if (this.state.destroyed) {
                return;
            }
            let listeners = undefined;
            switch (event) {
                case 'data':
                    listeners = this.listeners.data;
                    break;
                case 'end':
                    listeners = this.listeners.end;
                    break;
                case 'error':
                    listeners = this.listeners.error;
                    break;
            }
            if (listeners) {
                const index = listeners.indexOf(callback);
                if (index >= 0) {
                    listeners.splice(index, 1);
                }
            }
        }
        flowData() {
            if (this.buffer.data.length > 0) {
                const fullDataBuffer = this.reducer(this.buffer.data);
                this.emitData(fullDataBuffer);
                this.buffer.data.length = 0;
                // When the buffer is empty, resolve all pending writers
                const pendingWritePromises = [...this.pendingWritePromises];
                this.pendingWritePromises.length = 0;
                pendingWritePromises.forEach(pendingWritePromise => pendingWritePromise());
            }
        }
        flowErrors() {
            if (this.listeners.error.length > 0) {
                for (const error of this.buffer.error) {
                    this.emitError(error);
                }
                this.buffer.error.length = 0;
            }
        }
        flowEnd() {
            if (this.state.ended) {
                this.emitEnd();
                return this.listeners.end.length > 0;
            }
            return false;
        }
        destroy() {
            if (!this.state.destroyed) {
                this.state.destroyed = true;
                this.state.ended = true;
                this.buffer.data.length = 0;
                this.buffer.error.length = 0;
                this.listeners.data.length = 0;
                this.listeners.error.length = 0;
                this.listeners.end.length = 0;
                this.pendingWritePromises.length = 0;
            }
        }
    }
    /**
     * Helper to fully read a T readable into a T.
     */
    function consumeReadable(readable, reducer) {
        const chunks = [];
        let chunk;
        while ((chunk = readable.read()) !== null) {
            chunks.push(chunk);
        }
        return reducer(chunks);
    }
    /**
     * Helper to read a T readable up to a maximum of chunks. If the limit is
     * reached, will return a readable instead to ensure all data can still
     * be read.
     */
    function peekReadable(readable, reducer, maxChunks) {
        const chunks = [];
        let chunk = undefined;
        while ((chunk = readable.read()) !== null && chunks.length < maxChunks) {
            chunks.push(chunk);
        }
        // If the last chunk is null, it means we reached the end of
        // the readable and return all the data at once
        if (chunk === null && chunks.length > 0) {
            return reducer(chunks);
        }
        // Otherwise, we still have a chunk, it means we reached the maxChunks
        // value and as such we return a new Readable that first returns
        // the existing read chunks and then continues with reading from
        // the underlying readable.
        return {
            read: () => {
                // First consume chunks from our array
                if (chunks.length > 0) {
                    return chunks.shift();
                }
                // Then ensure to return our last read chunk
                if (typeof chunk !== 'undefined') {
                    const lastReadChunk = chunk;
                    // explicitly use undefined here to indicate that we consumed
                    // the chunk, which could have either been null or valued.
                    chunk = undefined;
                    return lastReadChunk;
                }
                // Finally delegate back to the Readable
                return readable.read();
            }
        };
    }
    function consumeStream(stream, reducer) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            listenStream(stream, {
                onData: chunk => {
                    if (reducer) {
                        chunks.push(chunk);
                    }
                },
                onError: error => {
                    if (reducer) {
                        reject(error);
                    }
                    else {
                        resolve(undefined);
                    }
                },
                onEnd: () => {
                    if (reducer) {
                        resolve(reducer(chunks));
                    }
                    else {
                        resolve(undefined);
                    }
                }
            });
        });
    }
    /**
     * Helper to listen to all events of a T stream in proper order.
     */
    function listenStream(stream, listener, token) {
        stream.on('error', error => {
            if (!token?.isCancellationRequested) {
                listener.onError(error);
            }
        });
        stream.on('end', () => {
            if (!token?.isCancellationRequested) {
                listener.onEnd();
            }
        });
        // Adding the `data` listener will turn the stream
        // into flowing mode. As such it is important to
        // add this listener last (DO NOT CHANGE!)
        stream.on('data', data => {
            if (!token?.isCancellationRequested) {
                listener.onData(data);
            }
        });
    }
    /**
     * Helper to peek up to `maxChunks` into a stream. The return type signals if
     * the stream has ended or not. If not, caller needs to add a `data` listener
     * to continue reading.
     */
    function peekStream(stream, maxChunks) {
        return new Promise((resolve, reject) => {
            const streamListeners = new lifecycle_1.DisposableStore();
            const buffer = [];
            // Data Listener
            const dataListener = (chunk) => {
                // Add to buffer
                buffer.push(chunk);
                // We reached maxChunks and thus need to return
                if (buffer.length > maxChunks) {
                    // Dispose any listeners and ensure to pause the
                    // stream so that it can be consumed again by caller
                    streamListeners.dispose();
                    stream.pause();
                    return resolve({ stream, buffer, ended: false });
                }
            };
            // Error Listener
            const errorListener = (error) => {
                streamListeners.dispose();
                return reject(error);
            };
            // End Listener
            const endListener = () => {
                streamListeners.dispose();
                return resolve({ stream, buffer, ended: true });
            };
            streamListeners.add((0, lifecycle_1.toDisposable)(() => stream.removeListener('error', errorListener)));
            stream.on('error', errorListener);
            streamListeners.add((0, lifecycle_1.toDisposable)(() => stream.removeListener('end', endListener)));
            stream.on('end', endListener);
            // Important: leave the `data` listener last because
            // this can turn the stream into flowing mode and we
            // want `error` events to be received as well.
            streamListeners.add((0, lifecycle_1.toDisposable)(() => stream.removeListener('data', dataListener)));
            stream.on('data', dataListener);
        });
    }
    /**
     * Helper to create a readable stream from an existing T.
     */
    function toStream(t, reducer) {
        const stream = newWriteableStream(reducer);
        stream.end(t);
        return stream;
    }
    /**
     * Helper to create an empty stream
     */
    function emptyStream() {
        const stream = newWriteableStream(() => { throw new Error('not supported'); });
        stream.end();
        return stream;
    }
    /**
     * Helper to convert a T into a Readable<T>.
     */
    function toReadable(t) {
        let consumed = false;
        return {
            read: () => {
                if (consumed) {
                    return null;
                }
                consumed = true;
                return t;
            }
        };
    }
    /**
     * Helper to transform a readable stream into another stream.
     */
    function transform(stream, transformer, reducer) {
        const target = newWriteableStream(reducer);
        listenStream(stream, {
            onData: data => target.write(transformer.data(data)),
            onError: error => target.error(transformer.error ? transformer.error(error) : error),
            onEnd: () => target.end()
        });
        return target;
    }
    /**
     * Helper to take an existing readable that will
     * have a prefix injected to the beginning.
     */
    function prefixedReadable(prefix, readable, reducer) {
        let prefixHandled = false;
        return {
            read: () => {
                const chunk = readable.read();
                // Handle prefix only once
                if (!prefixHandled) {
                    prefixHandled = true;
                    // If we have also a read-result, make
                    // sure to reduce it to a single result
                    if (chunk !== null) {
                        return reducer([prefix, chunk]);
                    }
                    // Otherwise, just return prefix directly
                    return prefix;
                }
                return chunk;
            }
        };
    }
    /**
     * Helper to take an existing stream that will
     * have a prefix injected to the beginning.
     */
    function prefixedStream(prefix, stream, reducer) {
        let prefixHandled = false;
        const target = newWriteableStream(reducer);
        listenStream(stream, {
            onData: data => {
                // Handle prefix only once
                if (!prefixHandled) {
                    prefixHandled = true;
                    return target.write(reducer([prefix, data]));
                }
                return target.write(data);
            },
            onError: error => target.error(error),
            onEnd: () => {
                // Handle prefix only once
                if (!prefixHandled) {
                    prefixHandled = true;
                    target.write(prefix);
                }
                target.end();
            }
        });
        return target;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyZWFtLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9zdHJlYW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUErRWhHLGdDQU9DO0lBZ0VELDRDQU9DO0lBRUQsNERBT0M7SUFtQkQsZ0RBRUM7SUFzUUQsMENBU0M7SUFPRCxvQ0F5Q0M7SUFTRCxzQ0EwQkM7SUEwQkQsb0NBc0JDO0lBT0QsZ0NBaURDO0lBS0QsNEJBTUM7SUFLRCxrQ0FLQztJQUtELGdDQWNDO0lBS0QsOEJBVUM7SUFNRCw0Q0F3QkM7SUFNRCx3Q0FnQ0M7SUFqckJELFNBQWdCLFVBQVUsQ0FBSSxHQUFZO1FBQ3pDLE1BQU0sU0FBUyxHQUFHLEdBQThCLENBQUM7UUFDakQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2hCLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELE9BQU8sT0FBTyxTQUFTLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQztJQUM3QyxDQUFDO0lBZ0VELFNBQWdCLGdCQUFnQixDQUFJLEdBQVk7UUFDL0MsTUFBTSxTQUFTLEdBQUcsR0FBb0MsQ0FBQztRQUN2RCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDaEIsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxVQUFVLENBQUMsQ0FBQztJQUNuSCxDQUFDO0lBRUQsU0FBZ0Isd0JBQXdCLENBQUksR0FBWTtRQUN2RCxNQUFNLFNBQVMsR0FBRyxHQUE0QyxDQUFDO1FBQy9ELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNoQixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxPQUFPLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDO0lBQ3RILENBQUM7SUFtQkQsU0FBZ0Isa0JBQWtCLENBQUksT0FBb0IsRUFBRSxPQUFnQztRQUMzRixPQUFPLElBQUksbUJBQW1CLENBQUksT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFZRCxNQUFNLG1CQUFtQjtRQXFCeEIsWUFBb0IsT0FBb0IsRUFBVSxPQUFnQztZQUE5RCxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBQVUsWUFBTyxHQUFQLE9BQU8sQ0FBeUI7WUFuQmpFLFVBQUssR0FBRztnQkFDeEIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osU0FBUyxFQUFFLEtBQUs7YUFDaEIsQ0FBQztZQUVlLFdBQU0sR0FBRztnQkFDekIsSUFBSSxFQUFFLEVBQVM7Z0JBQ2YsS0FBSyxFQUFFLEVBQWE7YUFDcEIsQ0FBQztZQUVlLGNBQVMsR0FBRztnQkFDNUIsSUFBSSxFQUFFLEVBQTJCO2dCQUNqQyxLQUFLLEVBQUUsRUFBZ0M7Z0JBQ3ZDLEdBQUcsRUFBRSxFQUFvQjthQUN6QixDQUFDO1lBRWUseUJBQW9CLEdBQWUsRUFBRSxDQUFDO1FBRStCLENBQUM7UUFFdkYsS0FBSztZQUNKLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDMUIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDNUIsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzFCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFFMUIsdUJBQXVCO2dCQUN2QixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLElBQU87WUFDWixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzFCLE9BQU87WUFDUixDQUFDO1lBRUQsK0NBQStDO1lBQy9DLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQixDQUFDO1lBRUQsNkNBQTZDO2lCQUN4QyxDQUFDO2dCQUNMLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFNUIsdUVBQXVFO2dCQUN2RSxJQUFJLE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxhQUFhLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUM3RyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUN4RSxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsS0FBWTtZQUNqQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzFCLE9BQU87WUFDUixDQUFDO1lBRUQsZ0RBQWdEO1lBQ2hELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QixDQUFDO1lBRUQsK0NBQStDO2lCQUMxQyxDQUFDO2dCQUNMLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQixDQUFDO1FBQ0YsQ0FBQztRQUVELEdBQUcsQ0FBQyxNQUFVO1lBQ2IsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUMxQixPQUFPO1lBQ1IsQ0FBQztZQUVELDRCQUE0QjtZQUM1QixJQUFJLE9BQU8sTUFBTSxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUNuQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BCLENBQUM7WUFFRCx1Q0FBdUM7WUFDdkMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRWYsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLENBQUM7WUFFRCxrQ0FBa0M7aUJBQzdCLENBQUM7Z0JBQ0wsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLENBQUM7UUFDRixDQUFDO1FBRU8sUUFBUSxDQUFDLElBQU87WUFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMseURBQXlEO1FBQzVILENBQUM7UUFFTyxTQUFTLENBQUMsS0FBWTtZQUM3QixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdkMsSUFBQSwwQkFBaUIsRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLDJEQUEyRDtZQUN0RixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMseURBQXlEO1lBQzlILENBQUM7UUFDRixDQUFDO1FBRU8sT0FBTztZQUNkLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMseURBQXlEO1FBQ3ZILENBQUM7UUFLRCxFQUFFLENBQUMsS0FBK0IsRUFBRSxRQUE4QjtZQUNqRSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzFCLE9BQU87WUFDUixDQUFDO1lBRUQsUUFBUSxLQUFLLEVBQUUsQ0FBQztnQkFDZixLQUFLLE1BQU07b0JBQ1YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUVuQyx1REFBdUQ7b0JBQ3ZELHVEQUF1RDtvQkFDdkQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUVkLE1BQU07Z0JBRVAsS0FBSyxLQUFLO29CQUNULElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFFbEMsOENBQThDO29CQUM5Qyx1Q0FBdUM7b0JBQ3ZDLEVBQUU7b0JBQ0YsZ0NBQWdDO29CQUNoQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO3dCQUMxQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2hCLENBQUM7b0JBRUQsTUFBTTtnQkFFUCxLQUFLLE9BQU87b0JBQ1gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUVwQyxtREFBbUQ7b0JBQ25ELHNEQUFzRDtvQkFDdEQsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUN4QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ25CLENBQUM7b0JBRUQsTUFBTTtZQUNSLENBQUM7UUFDRixDQUFDO1FBRUQsY0FBYyxDQUFDLEtBQWEsRUFBRSxRQUFrQjtZQUMvQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzFCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxTQUFTLEdBQTBCLFNBQVMsQ0FBQztZQUVqRCxRQUFRLEtBQUssRUFBRSxDQUFDO2dCQUNmLEtBQUssTUFBTTtvQkFDVixTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7b0JBQ2hDLE1BQU07Z0JBRVAsS0FBSyxLQUFLO29CQUNULFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQztvQkFDL0IsTUFBTTtnQkFFUCxLQUFLLE9BQU87b0JBQ1gsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO29CQUNqQyxNQUFNO1lBQ1IsQ0FBQztZQUVELElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ2hCLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxRQUFRO1lBQ2YsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2pDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFdEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFFOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFFNUIsd0RBQXdEO2dCQUN4RCxNQUFNLG9CQUFvQixHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDNUQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQ3JDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQzVFLENBQUM7UUFDRixDQUFDO1FBRU8sVUFBVTtZQUNqQixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDckMsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUN2QyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN2QixDQUFDO2dCQUVELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDOUIsQ0FBQztRQUNGLENBQUM7UUFFTyxPQUFPO1lBQ2QsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRWYsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztnQkFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO2dCQUV4QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUU3QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUMvQixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUU5QixJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixlQUFlLENBQUksUUFBcUIsRUFBRSxPQUFvQjtRQUM3RSxNQUFNLE1BQU0sR0FBUSxFQUFFLENBQUM7UUFFdkIsSUFBSSxLQUFlLENBQUM7UUFDcEIsT0FBTyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUMzQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BCLENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFNBQWdCLFlBQVksQ0FBSSxRQUFxQixFQUFFLE9BQW9CLEVBQUUsU0FBaUI7UUFDN0YsTUFBTSxNQUFNLEdBQVEsRUFBRSxDQUFDO1FBRXZCLElBQUksS0FBSyxHQUF5QixTQUFTLENBQUM7UUFDNUMsT0FBTyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxJQUFJLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxTQUFTLEVBQUUsQ0FBQztZQUN4RSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BCLENBQUM7UUFFRCw0REFBNEQ7UUFDNUQsK0NBQStDO1FBQy9DLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3pDLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFFRCxzRUFBc0U7UUFDdEUsZ0VBQWdFO1FBQ2hFLGdFQUFnRTtRQUNoRSwyQkFBMkI7UUFDM0IsT0FBTztZQUNOLElBQUksRUFBRSxHQUFHLEVBQUU7Z0JBRVYsc0NBQXNDO2dCQUN0QyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZCLE9BQU8sTUFBTSxDQUFDLEtBQUssRUFBRyxDQUFDO2dCQUN4QixDQUFDO2dCQUVELDRDQUE0QztnQkFDNUMsSUFBSSxPQUFPLEtBQUssS0FBSyxXQUFXLEVBQUUsQ0FBQztvQkFDbEMsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDO29CQUU1Qiw2REFBNkQ7b0JBQzdELDBEQUEwRDtvQkFDMUQsS0FBSyxHQUFHLFNBQVMsQ0FBQztvQkFFbEIsT0FBTyxhQUFhLENBQUM7Z0JBQ3RCLENBQUM7Z0JBRUQsd0NBQXdDO2dCQUN4QyxPQUFPLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN4QixDQUFDO1NBQ0QsQ0FBQztJQUNILENBQUM7SUFTRCxTQUFnQixhQUFhLENBQVcsTUFBK0IsRUFBRSxPQUF3QjtRQUNoRyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3RDLE1BQU0sTUFBTSxHQUFRLEVBQUUsQ0FBQztZQUV2QixZQUFZLENBQUMsTUFBTSxFQUFFO2dCQUNwQixNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUU7b0JBQ2YsSUFBSSxPQUFPLEVBQUUsQ0FBQzt3QkFDYixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNwQixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFO29CQUNoQixJQUFJLE9BQU8sRUFBRSxDQUFDO3dCQUNiLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDZixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNwQixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsS0FBSyxFQUFFLEdBQUcsRUFBRTtvQkFDWCxJQUFJLE9BQU8sRUFBRSxDQUFDO3dCQUNiLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDMUIsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDcEIsQ0FBQztnQkFDRixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBdUJEOztPQUVHO0lBQ0gsU0FBZ0IsWUFBWSxDQUFJLE1BQStCLEVBQUUsUUFBNEIsRUFBRSxLQUF5QjtRQUV2SCxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsRUFBRTtZQUMxQixJQUFJLENBQUMsS0FBSyxFQUFFLHVCQUF1QixFQUFFLENBQUM7Z0JBQ3JDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekIsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQztnQkFDckMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILGtEQUFrRDtRQUNsRCxnREFBZ0Q7UUFDaEQsMENBQTBDO1FBQzFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ3hCLElBQUksQ0FBQyxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQztnQkFDckMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFNBQWdCLFVBQVUsQ0FBSSxNQUF5QixFQUFFLFNBQWlCO1FBQ3pFLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDdEMsTUFBTSxlQUFlLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDOUMsTUFBTSxNQUFNLEdBQVEsRUFBRSxDQUFDO1lBRXZCLGdCQUFnQjtZQUNoQixNQUFNLFlBQVksR0FBRyxDQUFDLEtBQVEsRUFBRSxFQUFFO2dCQUVqQyxnQkFBZ0I7Z0JBQ2hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRW5CLCtDQUErQztnQkFDL0MsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLFNBQVMsRUFBRSxDQUFDO29CQUUvQixnREFBZ0Q7b0JBQ2hELG9EQUFvRDtvQkFDcEQsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUMxQixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBRWYsT0FBTyxPQUFPLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRCxDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBRUYsaUJBQWlCO1lBQ2pCLE1BQU0sYUFBYSxHQUFHLENBQUMsS0FBWSxFQUFFLEVBQUU7Z0JBQ3RDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFMUIsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEIsQ0FBQyxDQUFDO1lBRUYsZUFBZTtZQUNmLE1BQU0sV0FBVyxHQUFHLEdBQUcsRUFBRTtnQkFDeEIsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUUxQixPQUFPLE9BQU8sQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDakQsQ0FBQyxDQUFDO1lBRUYsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRWxDLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUU5QixvREFBb0Q7WUFDcEQsb0RBQW9EO1lBQ3BELDhDQUE4QztZQUM5QyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDakMsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixRQUFRLENBQUksQ0FBSSxFQUFFLE9BQW9CO1FBQ3JELE1BQU0sTUFBTSxHQUFHLGtCQUFrQixDQUFJLE9BQU8sQ0FBQyxDQUFDO1FBRTlDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFZCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQWdCLFdBQVc7UUFDMUIsTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQVEsR0FBRyxFQUFFLEdBQUcsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RGLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUViLE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0IsVUFBVSxDQUFJLENBQUk7UUFDakMsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBRXJCLE9BQU87WUFDTixJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUNWLElBQUksUUFBUSxFQUFFLENBQUM7b0JBQ2QsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFFRCxRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUVoQixPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7U0FDRCxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0IsU0FBUyxDQUF3QixNQUFzQyxFQUFFLFdBQWdELEVBQUUsT0FBOEI7UUFDeEssTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQWMsT0FBTyxDQUFDLENBQUM7UUFFeEQsWUFBWSxDQUFDLE1BQU0sRUFBRTtZQUNwQixNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEQsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDcEYsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUU7U0FDekIsQ0FBQyxDQUFDO1FBRUgsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBZ0IsZ0JBQWdCLENBQUksTUFBUyxFQUFFLFFBQXFCLEVBQUUsT0FBb0I7UUFDekYsSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDO1FBRTFCLE9BQU87WUFDTixJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUNWLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFFOUIsMEJBQTBCO2dCQUMxQixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3BCLGFBQWEsR0FBRyxJQUFJLENBQUM7b0JBRXJCLHNDQUFzQztvQkFDdEMsdUNBQXVDO29CQUN2QyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsQ0FBQzt3QkFDcEIsT0FBTyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDakMsQ0FBQztvQkFFRCx5Q0FBeUM7b0JBQ3pDLE9BQU8sTUFBTSxDQUFDO2dCQUNmLENBQUM7Z0JBRUQsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1NBQ0QsQ0FBQztJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSCxTQUFnQixjQUFjLENBQUksTUFBUyxFQUFFLE1BQXlCLEVBQUUsT0FBb0I7UUFDM0YsSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDO1FBRTFCLE1BQU0sTUFBTSxHQUFHLGtCQUFrQixDQUFJLE9BQU8sQ0FBQyxDQUFDO1FBRTlDLFlBQVksQ0FBQyxNQUFNLEVBQUU7WUFDcEIsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUVkLDBCQUEwQjtnQkFDMUIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUNwQixhQUFhLEdBQUcsSUFBSSxDQUFDO29CQUVyQixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUMsQ0FBQztnQkFFRCxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0IsQ0FBQztZQUNELE9BQU8sRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQ3JDLEtBQUssRUFBRSxHQUFHLEVBQUU7Z0JBRVgsMEJBQTBCO2dCQUMxQixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3BCLGFBQWEsR0FBRyxJQUFJLENBQUM7b0JBRXJCLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3RCLENBQUM7Z0JBRUQsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2QsQ0FBQztTQUNELENBQUMsQ0FBQztRQUVILE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQyJ9