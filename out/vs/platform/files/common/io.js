/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/errors", "vs/nls", "vs/platform/files/common/files"], function (require, exports, buffer_1, errors_1, nls_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readFileIntoStream = readFileIntoStream;
    /**
     * A helper to read a file from a provider with open/read/close capability into a stream.
     */
    async function readFileIntoStream(provider, resource, target, transformer, options, token) {
        let error = undefined;
        try {
            await doReadFileIntoStream(provider, resource, target, transformer, options, token);
        }
        catch (err) {
            error = err;
        }
        finally {
            if (error && options.errorTransformer) {
                error = options.errorTransformer(error);
            }
            if (typeof error !== 'undefined') {
                target.error(error);
            }
            target.end();
        }
    }
    async function doReadFileIntoStream(provider, resource, target, transformer, options, token) {
        // Check for cancellation
        throwIfCancelled(token);
        // open handle through provider
        const handle = await provider.open(resource, { create: false });
        try {
            // Check for cancellation
            throwIfCancelled(token);
            let totalBytesRead = 0;
            let bytesRead = 0;
            let allowedRemainingBytes = (options && typeof options.length === 'number') ? options.length : undefined;
            let buffer = buffer_1.VSBuffer.alloc(Math.min(options.bufferSize, typeof allowedRemainingBytes === 'number' ? allowedRemainingBytes : options.bufferSize));
            let posInFile = options && typeof options.position === 'number' ? options.position : 0;
            let posInBuffer = 0;
            do {
                // read from source (handle) at current position (pos) into buffer (buffer) at
                // buffer position (posInBuffer) up to the size of the buffer (buffer.byteLength).
                bytesRead = await provider.read(handle, posInFile, buffer.buffer, posInBuffer, buffer.byteLength - posInBuffer);
                posInFile += bytesRead;
                posInBuffer += bytesRead;
                totalBytesRead += bytesRead;
                if (typeof allowedRemainingBytes === 'number') {
                    allowedRemainingBytes -= bytesRead;
                }
                // when buffer full, create a new one and emit it through stream
                if (posInBuffer === buffer.byteLength) {
                    await target.write(transformer(buffer));
                    buffer = buffer_1.VSBuffer.alloc(Math.min(options.bufferSize, typeof allowedRemainingBytes === 'number' ? allowedRemainingBytes : options.bufferSize));
                    posInBuffer = 0;
                }
            } while (bytesRead > 0 && (typeof allowedRemainingBytes !== 'number' || allowedRemainingBytes > 0) && throwIfCancelled(token) && throwIfTooLarge(totalBytesRead, options));
            // wrap up with last buffer (also respect maxBytes if provided)
            if (posInBuffer > 0) {
                let lastChunkLength = posInBuffer;
                if (typeof allowedRemainingBytes === 'number') {
                    lastChunkLength = Math.min(posInBuffer, allowedRemainingBytes);
                }
                target.write(transformer(buffer.slice(0, lastChunkLength)));
            }
        }
        catch (error) {
            throw (0, files_1.ensureFileSystemProviderError)(error);
        }
        finally {
            await provider.close(handle);
        }
    }
    function throwIfCancelled(token) {
        if (token.isCancellationRequested) {
            throw (0, errors_1.canceled)();
        }
        return true;
    }
    function throwIfTooLarge(totalBytesRead, options) {
        // Return early if file is too large to load and we have configured limits
        if (typeof options?.limits?.size === 'number' && totalBytesRead > options.limits.size) {
            throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileTooLargeError', "File is too large to open"), files_1.FileSystemProviderErrorCode.FileTooLarge);
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW8uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL2NvbW1vbi9pby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTBCaEcsZ0RBeUJDO0lBNUJEOztPQUVHO0lBQ0ksS0FBSyxVQUFVLGtCQUFrQixDQUN2QyxRQUE2RCxFQUM3RCxRQUFhLEVBQ2IsTUFBMEIsRUFDMUIsV0FBMEMsRUFDMUMsT0FBaUMsRUFDakMsS0FBd0I7UUFFeEIsSUFBSSxLQUFLLEdBQXNCLFNBQVMsQ0FBQztRQUV6QyxJQUFJLENBQUM7WUFDSixNQUFNLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckYsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDZCxLQUFLLEdBQUcsR0FBRyxDQUFDO1FBQ2IsQ0FBQztnQkFBUyxDQUFDO1lBQ1YsSUFBSSxLQUFLLElBQUksT0FBTyxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3ZDLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekMsQ0FBQztZQUVELElBQUksT0FBTyxLQUFLLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUVELE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNkLENBQUM7SUFDRixDQUFDO0lBRUQsS0FBSyxVQUFVLG9CQUFvQixDQUFJLFFBQTZELEVBQUUsUUFBYSxFQUFFLE1BQTBCLEVBQUUsV0FBMEMsRUFBRSxPQUFpQyxFQUFFLEtBQXdCO1FBRXZQLHlCQUF5QjtRQUN6QixnQkFBZ0IsQ0FBQyxLQUFLLENB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