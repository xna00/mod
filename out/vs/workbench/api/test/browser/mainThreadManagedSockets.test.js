/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/workbench/api/browser/mainThreadManagedSockets"], function (require, exports, assert, async_1, buffer_1, event_1, lifecycle_1, mock_1, utils_1, mainThreadManagedSockets_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadManagedSockets', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('ManagedSocket', () => {
            let extHost;
            let half;
            class ExtHostMock extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidFire = new event_1.Emitter();
                    this.events = [];
                }
                $remoteSocketWrite(socketId, buffer) {
                    this.events.push({ socketId, data: buffer.toString() });
                    this.onDidFire.fire();
                }
                $remoteSocketDrain(socketId) {
                    this.events.push({ socketId, event: 'drain' });
                    this.onDidFire.fire();
                    return Promise.resolve();
                }
                $remoteSocketEnd(socketId) {
                    this.events.push({ socketId, event: 'end' });
                    this.onDidFire.fire();
                }
                expectEvent(test, message) {
                    if (this.events.some(test)) {
                        return;
                    }
                    const d = new lifecycle_1.DisposableStore();
                    return new Promise(resolve => {
                        d.add(this.onDidFire.event(() => {
                            if (this.events.some(test)) {
                                return;
                            }
                        }));
                        d.add((0, async_1.disposableTimeout)(() => {
                            throw new Error(`Expected ${message} but only had ${JSON.stringify(this.events, null, 2)}`);
                        }, 1000));
                    }).finally(() => d.dispose());
                }
            }
            setup(() => {
                extHost = new ExtHostMock();
                half = {
                    onClose: new event_1.Emitter(),
                    onData: new event_1.Emitter(),
                    onEnd: new event_1.Emitter(),
                };
            });
            async function doConnect() {
                const socket = mainThreadManagedSockets_1.MainThreadManagedSocket.connect(1, extHost, '/hello', 'world=true', '', half);
                await extHost.expectEvent(evt => evt.data && evt.data.startsWith('GET ws://localhost/hello?world=true&skipWebSocketFrames=true HTTP/1.1\r\nConnection: Upgrade\r\nUpgrade: websocket\r\nSec-WebSocket-Key:'), 'websocket open event');
                half.onData.fire(buffer_1.VSBuffer.fromString('Opened successfully ;)\r\n\r\n'));
                return ds.add(await socket);
            }
            test('connects', async () => {
                await doConnect();
            });
            test('includes trailing connection data', async () => {
                const socketProm = mainThreadManagedSockets_1.MainThreadManagedSocket.connect(1, extHost, '/hello', 'world=true', '', half);
                await extHost.expectEvent(evt => evt.data && evt.data.includes('GET ws://localhost'), 'websocket open event');
                half.onData.fire(buffer_1.VSBuffer.fromString('Opened successfully ;)\r\n\r\nSome trailing data'));
                const socket = ds.add(await socketProm);
                const data = [];
                ds.add(socket.onData(d => data.push(d.toString())));
                await (0, async_1.timeout)(1); // allow microtasks to flush
                assert.deepStrictEqual(data, ['Some trailing data']);
            });
            test('round trips data', async () => {
                const socket = await doConnect();
                const data = [];
                ds.add(socket.onData(d => data.push(d.toString())));
                socket.write(buffer_1.VSBuffer.fromString('ping'));
                await extHost.expectEvent(evt => evt.data === 'ping', 'expected ping');
                half.onData.fire(buffer_1.VSBuffer.fromString("pong"));
                assert.deepStrictEqual(data, ['pong']);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE1hbmFnZWRTb2NrZXRzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvdGVzdC9icm93c2VyL21haW5UaHJlYWRNYW5hZ2VkU29ja2V0cy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBY2hHLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7UUFFdEMsTUFBTSxFQUFFLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXJELEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1lBQzNCLElBQUksT0FBb0IsQ0FBQztZQUN6QixJQUFJLElBQXNCLENBQUM7WUFFM0IsTUFBTSxXQUFZLFNBQVEsSUFBQSxXQUFJLEdBQThCO2dCQUE1RDs7b0JBQ1MsY0FBUyxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7b0JBQ3hCLFdBQU0sR0FBVSxFQUFFLENBQUM7Z0JBbUNwQyxDQUFDO2dCQWpDUyxrQkFBa0IsQ0FBQyxRQUFnQixFQUFFLE1BQWdCO29CQUM3RCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDeEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDdkIsQ0FBQztnQkFFUSxrQkFBa0IsQ0FBQyxRQUFnQjtvQkFDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7b0JBQy9DLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3RCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dC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