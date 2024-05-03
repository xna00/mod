/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "crypto", "net", "vs/base/common/platform", "os", "vs/base/common/path", "vs/base/node/ports", "vs/workbench/contrib/debug/node/debugAdapter", "vs/base/test/common/utils"], function (require, exports, assert, crypto, net, platform, os_1, path_1, ports, debugAdapter_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function sendInitializeRequest(debugAdapter) {
        return new Promise((resolve, reject) => {
            debugAdapter.sendRequest('initialize', { adapterID: 'test' }, (result) => {
                resolve(result);
            }, 3000);
        });
    }
    function serverConnection(socket) {
        socket.on('data', (data) => {
            const str = data.toString().split('\r\n')[2];
            const request = JSON.parse(str);
            const response = {
                seq: request.seq,
                request_seq: request.seq,
                type: 'response',
                command: request.command
            };
            if (request.arguments.adapterID === 'test') {
                response.success = true;
            }
            else {
                response.success = false;
                response.message = 'failed';
            }
            const responsePayload = JSON.stringify(response);
            socket.write(`Content-Length: ${responsePayload.length}\r\n\r\n${responsePayload}`);
        });
    }
    suite('Debug - StreamDebugAdapter', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test(`StreamDebugAdapter (NamedPipeDebugAdapter) can initialize a connection`, async () => {
            // todo@connor4312: debug test failure that seems to only happen in CI.
            // Even running this test on a loop on my machine for an hour doesn't hit failures :(
            const progress = [];
            const timeout = setTimeout(() => {
                console.log('NamedPipeDebugAdapter test might fail. Progress:', progress.join(','));
            }, 1000); // should usually finish is <10ms
            const pipeName = crypto.randomBytes(10).toString('hex');
            const pipePath = platform.isWindows ? (0, path_1.join)('\\\\.\\pipe\\', pipeName) : (0, path_1.join)((0, os_1.tmpdir)(), pipeName);
            progress.push(`listen on ${pipePath}`);
            const server = await new Promise((resolve, reject) => {
                const server = net.createServer(serverConnection);
                server.once('listening', () => resolve(server));
                server.once('error', reject);
                server.listen(pipePath);
            });
            progress.push('server up');
            const debugAdapter = new debugAdapter_1.NamedPipeDebugAdapter({
                type: 'pipeServer',
                path: pipePath
            });
            try {
                await debugAdapter.startSession();
                progress.push('started session');
                const response = await sendInitializeRequest(debugAdapter);
                progress.push('got response');
                assert.strictEqual(response.command, 'initialize');
                assert.strictEqual(response.request_seq, 1);
                assert.strictEqual(response.success, true, response.message);
            }
            finally {
                await debugAdapter.stopSession();
                progress.push('stopped session');
                clearTimeout(timeout);
                server.close();
                debugAdapter.dispose();
            }
        });
        test(`StreamDebugAdapter (SocketDebugAdapter) can initialize a connection`, async () => {
            const rndPort = Math.floor(Math.random() * 1000 + 8000);
            const port = await ports.findFreePort(rndPort, 10 /* try 10 ports */, 3000 /* try up to 3 seconds */, 87 /* skip 87 ports between attempts */);
            const server = net.createServer(serverConnection).listen(port);
            const debugAdapter = new debugAdapter_1.SocketDebugAdapter({
                type: 'server',
                port
            });
            try {
                await debugAdapter.startSession();
                const response = await sendInitializeRequest(debugAdapter);
                assert.strictEqual(response.command, 'initialize');
                assert.strictEqual(response.request_seq, 1);
                assert.strictEqual(response.success, true, response.message);
            }
            finally {
                await debugAdapter.stopSession();
                server.close();
                debugAdapter.dispose();
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyZWFtRGVidWdBZGFwdGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL3Rlc3Qvbm9kZS9zdHJlYW1EZWJ1Z0FkYXB0ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxTQUFTLHFCQUFxQixDQUFDLFlBQWdDO1FBQzlELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDdEMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDeEUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pCLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNWLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsTUFBa0I7UUFDM0MsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRTtZQUNsQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEMsTUFBTSxRQUFRLEdBQVE7Z0JBQ3JCLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRztnQkFDaEIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUFHO2dCQUN4QixJQUFJLEVBQUUsVUFBVTtnQkFDaEIsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPO2FBQ3hCLENBQUM7WUFDRixJQUFJLE9BQU8sQ0FBQyxT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