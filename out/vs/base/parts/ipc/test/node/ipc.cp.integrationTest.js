/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/parts/ipc/node/ipc.cp", "./testService", "vs/base/common/network"], function (require, exports, assert, event_1, ipc_cp_1, testService_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createClient() {
        return new ipc_cp_1.Client(network_1.FileAccess.asFileUri('bootstrap-fork').fsPath, {
            serverName: 'TestServer',
            env: { VSCODE_AMD_ENTRYPOINT: 'vs/base/parts/ipc/test/node/testApp', verbose: true }
        });
    }
    suite('IPC, Child Process', function () {
        this.slow(2000);
        this.timeout(10000);
        let client;
        let channel;
        let service;
        setup(() => {
            client = createClient();
            channel = client.getChannel('test');
            service = new testService_1.TestServiceClient(channel);
        });
        teardown(() => {
            client.dispose();
        });
        test('createChannel', async () => {
            const result = await service.pong('ping');
            assert.strictEqual(result.incoming, 'ping');
            assert.strictEqual(result.outgoing, 'pong');
        });
        test('events', async () => {
            const event = event_1.Event.toPromise(event_1.Event.once(service.onMarco));
            const promise = service.marco();
            const [promiseResult, eventResult] = await Promise.all([promise, event]);
            assert.strictEqual(promiseResult, 'polo');
            assert.strictEqual(eventResult.answer, 'polo');
        });
        test('event dispose', async () => {
            let count = 0;
            const disposable = service.onMarco(() => count++);
            const answer = await service.marco();
            assert.strictEqual(answer, 'polo');
            assert.strictEqual(count, 1);
            const answer_1 = await service.marco();
            assert.strictEqual(answer_1, 'polo');
            assert.strictEqual(count, 2);
            disposable.dispose();
            const answer_2 = await service.marco();
            assert.strictEqual(answer_2, 'polo');
            assert.strictEqual(count, 2);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLmNwLmludGVncmF0aW9uVGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9wYXJ0cy9pcGMvdGVzdC9ub2RlL2lwYy5jcC5pbnRlZ3JhdGlvblRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsU0FBUyxZQUFZO1FBQ3BCLE9BQU8sSUFBSSxlQUFNLENBQUMsb0JBQVUsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLEVBQUU7WUFDaEUsVUFBVSxFQUFFLFlBQVk7WUFDeEIsR0FBRyxFQUFFLEVBQUUscUJBQXFCLEVBQUUscUNBQXFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtTQUNwRixDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsS0FBSyxDQUFDLG9CQUFvQixFQUFFO1FBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVwQixJQUFJLE1BQWMsQ0FBQztRQUNuQixJQUFJLE9BQWlCLENBQUM7UUFDdEIsSUFBSSxPQUFxQixDQUFDO1FBRTFCLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLEdBQUcsWUFBWSxFQUFFLENBQUM7WUFDeEIsT0FBTyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEMsT0FBTyxHQUFHLElBQUksK0JBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2xCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGVBQWUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoQyxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM3QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDekIsTUFBTSxLQUFLLEdBQUcsYUFBSyxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzNELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVoQyxNQUFNLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRXpFLE1BQU0sQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNoRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDaEMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2QsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBRWxELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTdCLE1BQU0sUUFBUSxHQUFHLE1BQU0sT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdCLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVyQixNQUFNLFFBQVEsR0FBRyxNQUFNLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN2QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=