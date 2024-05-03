/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "child_process", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/platform", "vs/base/node/processes"], function (require, exports, assert, cp, network_1, objects, platform, processes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function fork(id) {
        const opts = {
            env: objects.mixin(objects.deepClone(process.env), {
                VSCODE_AMD_ENTRYPOINT: id,
                VSCODE_PIPE_LOGGING: 'true',
                VSCODE_VERBOSE_LOGGING: true
            })
        };
        return cp.fork(network_1.FileAccess.asFileUri('bootstrap-fork').fsPath, ['--type=processTests'], opts);
    }
    suite('Processes', () => {
        test('buffered sending - simple data', function (done) {
            if (process.env['VSCODE_PID']) {
                return done(); // this test fails when run from within VS Code
            }
            const child = fork('vs/base/test/node/processes/fixtures/fork');
            const sender = processes.createQueuedSender(child);
            let counter = 0;
            const msg1 = 'Hello One';
            const msg2 = 'Hello Two';
            const msg3 = 'Hello Three';
            child.on('message', msgFromChild => {
                if (msgFromChild === 'ready') {
                    sender.send(msg1);
                    sender.send(msg2);
                    sender.send(msg3);
                }
                else {
                    counter++;
                    if (counter === 1) {
                        assert.strictEqual(msgFromChild, msg1);
                    }
                    else if (counter === 2) {
                        assert.strictEqual(msgFromChild, msg2);
                    }
                    else if (counter === 3) {
                        assert.strictEqual(msgFromChild, msg3);
                        child.kill();
                        done();
                    }
                }
            });
        });
        (!platform.isWindows || process.env['VSCODE_PID'] ? test.skip : test)('buffered sending - lots of data (potential deadlock on win32)', function (done) {
            const child = fork('vs/base/test/node/processes/fixtures/fork_large');
            const sender = processes.createQueuedSender(child);
            const largeObj = Object.create(null);
            for (let i = 0; i < 10000; i++) {
                largeObj[i] = 'some data';
            }
            const msg = JSON.stringify(largeObj);
            child.on('message', msgFromChild => {
                if (msgFromChild === 'ready') {
                    sender.send(msg);
                    sender.send(msg);
                    sender.send(msg);
                }
                else if (msgFromChild === 'done') {
                    child.kill();
                    done();
                }
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzc2VzLmludGVncmF0aW9uVGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L25vZGUvcHJvY2Vzc2VzL3Byb2Nlc3Nlcy5pbnRlZ3JhdGlvblRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsU0FBUyxJQUFJLENBQUMsRUFBVTtRQUN2QixNQUFNLElBQUksR0FBUTtZQUNqQixHQUFHLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDbEQscUJBQXFCLEVBQUUsRUFBRTtnQkFDekIsbUJBQW1CLEVBQUUsTUFBTTtnQkFDM0Isc0JBQXNCLEVBQUUsSUFBSTthQUM1QixDQUFDO1NBQ0YsQ0FBQztRQUVGLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDOUYsQ0FBQztJQUVELEtBQUssQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1FBQ3ZCLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxVQUFVLElBQWdCO1lBQ2hFLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO2dCQUMvQixPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsK0NBQStDO1lBQy9ELENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsMkNBQTJDLENBQUMsQ0FBQztZQUNoRSxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbkQsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO1lBRWhCLE1B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