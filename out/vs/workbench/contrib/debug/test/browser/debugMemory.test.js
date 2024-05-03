/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/event", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/workbench/contrib/debug/common/debugModel"], function (require, exports, assert, buffer_1, event_1, mock_1, utils_1, debugModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - Memory', () => {
        const dapResponseCommon = {
            command: 'someCommand',
            type: 'response',
            seq: 1,
            request_seq: 1,
            success: true,
        };
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('MemoryRegion', () => {
            let memory;
            let unreadable;
            let invalidateMemoryEmitter;
            let session;
            let region;
            setup(() => {
                const memoryBuf = new Uint8Array(1024);
                for (let i = 0; i < memoryBuf.length; i++) {
                    memoryBuf[i] = i; // will be 0-255
                }
                memory = buffer_1.VSBuffer.wrap(memoryBuf);
                invalidateMemoryEmitter = new event_1.Emitter();
                unreadable = 0;
                session = (0, mock_1.mockObject)()({
                    onDidInvalidateMemory: invalidateMemoryEmitter.event
                });
                session.readMemory.callsFake((ref, fromOffset, count) => {
                    const res = ({
                        ...dapResponseCommon,
                        body: {
                            address: '0',
                            data: (0, buffer_1.encodeBase64)(memory.slice(fromOffset, fromOffset + Math.max(0, count - unreadable))),
                            unreadableBytes: unreadable
                        }
                    });
                    unreadable = 0;
                    return Promise.resolve(res);
                });
                session.writeMemory.callsFake((ref, fromOffset, data) => {
                    const decoded = (0, buffer_1.decodeBase64)(data);
                    for (let i = 0; i < decoded.byteLength; i++) {
                        memory.buffer[fromOffset + i] = decoded.buffer[i];
                    }
                    return ({
                        ...dapResponseCommon,
                        body: {
                            bytesWritten: decoded.byteLength,
                            offset: fromOffset,
                        }
                    });
                });
                region = new debugModel_1.MemoryRegion('ref', session);
            });
            teardown(() => {
                region.dispose();
            });
            test('reads a simple range', async () => {
                assert.deepStrictEqual(await region.read(10, 14), [
                    { type: 0 /* MemoryRangeType.Valid */, offset: 10, length: 4, data: buffer_1.VSBuffer.wrap(new Uint8Array([10, 11, 12, 13])) }
                ]);
            });
            test('reads a non-contiguous range', async () => {
                unreadable = 3;
                assert.deepStrictEqual(await region.read(10, 14), [
                    { type: 0 /* MemoryRangeType.Valid */, offset: 10, length: 1, data: buffer_1.VSBuffer.wrap(new Uint8Array([10])) },
                    { type: 1 /* MemoryRangeType.Unreadable */, offset: 11, length: 3 },
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdNZW1vcnkudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvdGVzdC9icm93c2VyL2RlYnVnTWVtb3J5LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUM1QixNQUFNLGlCQUFpQixHQUFHO1lBQ3pCLE9BQU8sRUFBRSxhQUFhO1lBQ3RCLElBQUksRUFBRSxVQUFVO1lBQ2hCLEdBQUcsRUFBRSxDQUFDO1lBQ04sV0FBVyxFQUFFLENBQUM7WUFDZCxPQUFPLEVBQUUsSUFBSTtTQUNiLENBQUM7UUFFRixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7WUFDMUIsSUFBSSxNQUFnQixDQUFDO1lBQ3JCLElBQUksVUFBa0IsQ0FBQztZQUN2QixJQUFJLHVCQUEyRCxDQUFDO1lBQ2hFLElBQUksT0FBeUQsQ0FBQztZQUM5RCxJQUFJLE1BQW9CLENBQUM7WUFFekIsS0FBSyxDQUFDLEdBQUcsRUFBRTtnQkFDVixNQUFNLFNBQVMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0MsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGdCQUFnQjtnQkFDbkMsQ0FBQztnQkFDRCxNQUFNLEdBQUcsaUJBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2xDLHVCQUF1QixHQUFHLElBQUksZUFBTyxFQUFFLENBQUM7Z0JB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