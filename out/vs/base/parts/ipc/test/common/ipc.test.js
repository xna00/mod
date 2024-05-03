/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/base/parts/ipc/common/ipc", "vs/base/test/common/utils"], function (require, exports, assert, async_1, buffer_1, cancellation_1, errors_1, event_1, lifecycle_1, resources_1, uri_1, ipc_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class QueueProtocol {
        constructor() {
            this.buffering = true;
            this.buffers = [];
            this._onMessage = new event_1.Emitter({
                onDidAddFirstListener: () => {
                    for (const buffer of this.buffers) {
                        this._onMessage.fire(buffer);
                    }
                    this.buffers = [];
                    this.buffering = false;
                },
                onDidRemoveLastListener: () => {
                    this.buffering = true;
                }
            });
            this.onMessage = this._onMessage.event;
        }
        send(buffer) {
            this.other.receive(buffer);
        }
        receive(buffer) {
            if (this.buffering) {
                this.buffers.push(buffer);
            }
            else {
                this._onMessage.fire(buffer);
            }
        }
    }
    function createProtocolPair() {
        const one = new QueueProtocol();
        const other = new QueueProtocol();
        one.other = other;
        other.other = one;
        return [one, other];
    }
    class TestIPCClient extends ipc_1.IPCClient {
        constructor(protocol, id) {
            super(protocol, id);
            this._onDidDisconnect = new event_1.Emitter();
            this.onDidDisconnect = this._onDidDisconnect.event;
        }
        dispose() {
            this._onDidDisconnect.fire();
            super.dispose();
        }
    }
    class TestIPCServer extends ipc_1.IPCServer {
        constructor() {
            const onDidClientConnect = new event_1.Emitter();
            super(onDidClientConnect.event);
            this.onDidClientConnect = onDidClientConnect;
        }
        createConnection(id) {
            const [pc, ps] = createProtocolPair();
            const client = new TestIPCClient(pc, id);
            this.onDidClientConnect.fire({
                protocol: ps,
                onDidClientDisconnect: client.onDidDisconnect
            });
            return client;
        }
    }
    const TestChannelId = 'testchannel';
    class TestService {
        constructor() {
            this.disposables = new lifecycle_1.DisposableStore();
            this._onPong = new event_1.Emitter();
            this.onPong = this._onPong.event;
        }
        marco() {
            return Promise.resolve('polo');
        }
        error(message) {
            return Promise.reject(new Error(message));
        }
        neverComplete() {
            return new Promise(_ => { });
        }
        neverCompleteCT(cancellationToken) {
            if (cancellationToken.isCancellationRequested) {
                return Promise.reject((0, errors_1.canceled)());
            }
            return new Promise((_, e) => this.disposables.add(cancellationToken.onCancellationRequested(() => e((0, errors_1.canceled)()))));
        }
        buffersLength(buffers) {
            return Promise.resolve(buffers.reduce((r, b) => r + b.buffer.length, 0));
        }
        ping(msg) {
            this._onPong.fire(msg);
        }
        marshall(uri) {
            return Promise.resolve(uri);
        }
        context(context) {
            return Promise.resolve(context);
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    class TestChannel {
        constructor(service) {
            this.service = service;
        }
        call(_, command, arg, cancellationToken) {
            switch (command) {
                case 'marco': return this.service.marco();
                case 'error': return this.service.error(arg);
                case 'neverComplete': return this.service.neverComplete();
                case 'neverCompleteCT': return this.service.neverCompleteCT(cancellationToken);
                case 'buffersLength': return this.service.buffersLength(arg);
                default: return Promise.reject(new Error('not implemented'));
            }
        }
        listen(_, event, arg) {
            switch (event) {
                case 'onPong': return this.service.onPong;
                default: throw new Error('not implemented');
            }
        }
    }
    class TestChannelClient {
        get onPong() {
            return this.channel.listen('onPong');
        }
        constructor(channel) {
            this.channel = channel;
        }
        marco() {
            return this.channel.call('marco');
        }
        error(message) {
            return this.channel.call('error', message);
        }
        neverComplete() {
            return this.channel.call('neverComplete');
        }
        neverCompleteCT(cancellationToken) {
            return this.channel.call('neverCompleteCT', undefined, cancellationToken);
        }
        buffersLength(buffers) {
            return this.channel.call('buffersLength', buffers);
        }
        marshall(uri) {
            return this.channel.call('marshall', uri);
        }
        context() {
            return this.channel.call('context');
        }
    }
    suite('Base IPC', function () {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('createProtocolPair', async function () {
            const [clientProtocol, serverProtocol] = createProtocolPair();
            const b1 = buffer_1.VSBuffer.alloc(0);
            clientProtocol.send(b1);
            const b3 = buffer_1.VSBuffer.alloc(0);
            serverProtocol.send(b3);
            const b2 = await event_1.Event.toPromise(serverProtocol.onMessage);
            const b4 = await event_1.Event.toPromise(clientProtocol.onMessage);
            assert.strictEqual(b1, b2);
            assert.strictEqual(b3, b4);
        });
        suite('one to one', function () {
            let server;
            let client;
            let service;
            let ipcService;
            setup(function () {
                service = store.add(new TestService());
                const testServer = store.add(new TestIPCServer());
                server = testServer;
                server.registerChannel(TestChannelId, new TestChannel(service));
                client = store.add(testServer.createConnection('client1'));
                ipcService = new TestChannelClient(client.getChannel(TestChannelId));
            });
            test('call success', async function () {
                const r = await ipcService.marco();
                return assert.strictEqual(r, 'polo');
            });
            test('call error', async function () {
                try {
                    await ipcService.error('nice error');
                    return assert.fail('should not reach here');
                }
                catch (err) {
                    return assert.strictEqual(err.message, 'nice error');
                }
            });
            test('cancel call with cancelled cancellation token', async function () {
                try {
                    await ipcService.neverCompleteCT(cancellation_1.CancellationToken.Cancelled);
                    return assert.fail('should not reach here');
                }
                catch (err) {
                    return assert(err.message === 'Canceled');
                }
            });
            test('cancel call with cancellation token (sync)', function () {
                const cts = new cancellation_1.CancellationTokenSource();
                const promise = ipcService.neverCompleteCT(cts.token).then(_ => assert.fail('should not reach here'), err => assert(err.message === 'Canceled'));
                cts.cancel();
                return promise;
            });
            test('cancel call with cancellation token (async)', function () {
                const cts = new cancellation_1.CancellationTokenSource();
                const promise = ipcService.neverCompleteCT(cts.token).then(_ => assert.fail('should not reach here'), err => assert(err.message === 'Canceled'));
                setTimeout(() => cts.cancel());
                return promise;
            });
            test('listen to events', async function () {
                const messages = [];
                store.add(ipcService.onPong(msg => messages.push(msg)));
                await (0, async_1.timeout)(0);
                assert.deepStrictEqual(messages, []);
                service.ping('hello');
                await (0, async_1.timeout)(0);
                assert.deepStrictEqual(messages, ['hello']);
                service.ping('world');
                await (0, async_1.timeout)(0);
                assert.deepStrictEqual(messages, ['hello', 'world']);
            });
            test('buffers in arrays', async function () {
                const r = await ipcService.buffersLength([buffer_1.VSBuffer.alloc(2), buffer_1.VSBuffer.alloc(3)]);
                return assert.strictEqual(r, 5);
            });
            test('round trips numbers', () => {
                const input = [
                    0,
                    1,
                    -1,
                    12345,
                    -12345,
                    42.6,
                    123412341234
                ];
                const writer = new ipc_1.BufferWriter();
                (0, ipc_1.serialize)(writer, input);
                assert.deepStrictEqual((0, ipc_1.deserialize)(new ipc_1.BufferReader(writer.buffer)), input);
            });
        });
        suite('one to one (proxy)', function () {
            let server;
            let client;
            let service;
            let ipcService;
            const disposables = new lifecycle_1.DisposableStore();
            setup(function () {
                service = store.add(new TestService());
                const testServer = disposables.add(new TestIPCServer());
                server = testServer;
                server.registerChannel(TestChannelId, ipc_1.ProxyChannel.fromService(service, disposables));
                client = disposables.add(testServer.createConnection('client1'));
                ipcService = ipc_1.ProxyChannel.toService(client.getChannel(TestChannelId));
            });
            teardown(function () {
                disposables.clear();
            });
            test('call success', async function () {
                const r = await ipcService.marco();
                return assert.strictEqual(r, 'polo');
            });
            test('call error', async function () {
                try {
                    await ipcService.error('nice error');
                    return assert.fail('should not reach here');
                }
                catch (err) {
                    return assert.strictEqual(err.message, 'nice error');
                }
            });
            test('listen to events', async function () {
                const messages = [];
                disposables.add(ipcService.onPong(msg => messages.push(msg)));
                await (0, async_1.timeout)(0);
                assert.deepStrictEqual(messages, []);
                service.ping('hello');
                await (0, async_1.timeout)(0);
                assert.deepStrictEqual(messages, ['hello']);
                service.ping('world');
                await (0, async_1.timeout)(0);
                assert.deepStrictEqual(messages, ['hello', 'world']);
            });
            test('marshalling uri', async function () {
                const uri = uri_1.URI.file('foobar');
                const r = await ipcService.marshall(uri);
                assert.ok(r instanceof uri_1.URI);
                return assert.ok((0, resources_1.isEqual)(r, uri));
            });
            test('buffers in arrays', async function () {
                const r = await ipcService.buffersLength([buffer_1.VSBuffer.alloc(2), buffer_1.VSBuffer.alloc(3)]);
                return assert.strictEqual(r, 5);
            });
        });
        suite('one to one (proxy, extra context)', function () {
            let server;
            let client;
            let service;
            let ipcService;
            const disposables = new lifecycle_1.DisposableStore();
            setup(function () {
                service = store.add(new TestService());
                const testServer = disposables.add(new TestIPCServer());
                server = testServer;
                server.registerChannel(TestChannelId, ipc_1.ProxyChannel.fromService(service, disposables));
                client = disposables.add(testServer.createConnection('client1'));
                ipcService = ipc_1.ProxyChannel.toService(client.getChannel(TestChannelId), { context: 'Super Context' });
            });
            teardown(function () {
                disposables.clear();
            });
            test('call extra context', async function () {
                const r = await ipcService.context();
                return assert.strictEqual(r, 'Super Context');
            });
        });
        suite('one to many', function () {
            test('all clients get pinged', async function () {
                const service = store.add(new TestService());
                const channel = new TestChannel(service);
                const server = store.add(new TestIPCServer());
                server.registerChannel('channel', channel);
                let client1GotPinged = false;
                const client1 = store.add(server.createConnection('client1'));
                const ipcService1 = new TestChannelClient(client1.getChannel('channel'));
                store.add(ipcService1.onPong(() => client1GotPinged = true));
                let client2GotPinged = false;
                const client2 = store.add(server.createConnection('client2'));
                const ipcService2 = new TestChannelClient(client2.getChannel('channel'));
                store.add(ipcService2.onPong(() => client2GotPinged = true));
                await (0, async_1.timeout)(1);
                service.ping('hello');
                await (0, async_1.timeout)(1);
                assert(client1GotPinged, 'client 1 got pinged');
                assert(client2GotPinged, 'client 2 got pinged');
            });
            test('server gets pings from all clients (broadcast channel)', async function () {
                const server = store.add(new TestIPCServer());
                const client1 = server.createConnection('client1');
                const clientService1 = store.add(new TestService());
                const clientChannel1 = new TestChannel(clientService1);
                client1.registerChannel('channel', clientChannel1);
                const pings = [];
                const channel = server.getChannel('channel', () => true);
                const service = new TestChannelClient(channel);
                store.add(service.onPong(msg => pings.push(msg)));
                await (0, async_1.timeout)(1);
                clientService1.ping('hello 1');
                await (0, async_1.timeout)(1);
                assert.deepStrictEqual(pings, ['hello 1']);
                const client2 = server.createConnection('client2');
                const clientService2 = store.add(new TestService());
                const clientChannel2 = new TestChannel(clientService2);
                client2.registerChannel('channel', clientChannel2);
                await (0, async_1.timeout)(1);
                clientService2.ping('hello 2');
                await (0, async_1.timeout)(1);
                assert.deepStrictEqual(pings, ['hello 1', 'hello 2']);
                client1.dispose();
                clientService1.ping('hello 1');
                await (0, async_1.timeout)(1);
                assert.deepStrictEqual(pings, ['hello 1', 'hello 2']);
                await (0, async_1.timeout)(1);
                clientService2.ping('hello again 2');
                await (0, async_1.timeout)(1);
                assert.deepStrictEqual(pings, ['hello 1', 'hello 2', 'hello again 2']);
                client2.dispose();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvcGFydHMvaXBjL3Rlc3QvY29tbW9uL2lwYy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBY2hHLE1BQU0sYUFBYTtRQUFuQjtZQUVTLGNBQVMsR0FBRyxJQUFJLENBQUM7WUFDakIsWUFBTyxHQUFlLEVBQUUsQ0FBQztZQUVoQixlQUFVLEdBQUcsSUFBSSxlQUFPLENBQVc7Z0JBQ25ELHFCQUFxQixFQUFFLEdBQUcsRUFBRTtvQkFDM0IsS0FBSyxNQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ25DLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUM5QixDQUFDO29CQUVELElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNsQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztnQkFDeEIsQ0FBQztnQkFDRCx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7b0JBQzdCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUN2QixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1lBRU0sY0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1FBYzVDLENBQUM7UUFYQSxJQUFJLENBQUMsTUFBZ0I7WUFDcEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVTLE9BQU8sQ0FBQyxNQUFnQjtZQUNqQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0IsQ0FBQztpQkFBTSxDQUFDO2dC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