/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/test/common/testUtils"], function (require, exports, assert, platform_1, testUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function testErrorMessage(module) {
        return `Unable to load "${module}" dependency. It was probably not compiled for the right operating system architecture or had missing build tools.`;
    }
    (0, testUtils_1.flakySuite)('Native Modules (all platforms)', () => {
        test('kerberos', async () => {
            const kerberos = await new Promise((resolve_1, reject_1) => { require(['kerberos'], resolve_1, reject_1); });
            assert.ok(typeof kerberos.initializeClient === 'function', testErrorMessage('kerberos'));
        });
        test('native-is-elevated', async () => {
            const isElevated = await new Promise((resolve_2, reject_2) => { require(['native-is-elevated'], resolve_2, reject_2); });
            assert.ok(typeof isElevated === 'function', testErrorMessage('native-is-elevated '));
            const result = isElevated();
            assert.ok(typeof result === 'boolean', testErrorMessage('native-is-elevated'));
        });
        test('native-keymap', async () => {
            const keyMap = await new Promise((resolve_3, reject_3) => { require(['native-keymap'], resolve_3, reject_3); });
            assert.ok(typeof keyMap.getCurrentKeyboardLayout === 'function', testErrorMessage('native-keymap'));
            const result = keyMap.getCurrentKeyboardLayout();
            assert.ok(result, testErrorMessage('native-keymap'));
        });
        test('native-watchdog', async () => {
            const watchDog = await new Promise((resolve_4, reject_4) => { require(['native-watchdog'], resolve_4, reject_4); });
            assert.ok(typeof watchDog.start === 'function', testErrorMessage('native-watchdog'));
        });
        (process.type === 'renderer' ? test.skip /* TODO@electron module is not context aware yet and thus cannot load in Electron renderer used by tests */ : test)('node-pty', async () => {
            const nodePty = await new Promise((resolve_5, reject_5) => { require(['node-pty'], resolve_5, reject_5); });
            assert.ok(typeof nodePty.spawn === 'function', testErrorMessage('node-pty'));
        });
        (process.type === 'renderer' ? test.skip /* TODO@electron module is not context aware yet and thus cannot load in Electron renderer used by tests */ : test)('@vscode/spdlog', async () => {
            const spdlog = await new Promise((resolve_6, reject_6) => { require(['@vscode/spdlog'], resolve_6, reject_6); });
            assert.ok(typeof spdlog.createRotatingLogger === 'function', testErrorMessage('@vscode/spdlog'));
            assert.ok(typeof spdlog.version === 'number', testErrorMessage('@vscode/spdlog'));
        });
        test('@parcel/watcher', async () => {
            const parcelWatcher = await new Promise((resolve_7, reject_7) => { require(['@parcel/watcher'], resolve_7, reject_7); });
            assert.ok(typeof parcelWatcher.subscribe === 'function', testErrorMessage('@parcel/watcher'));
        });
        test('@vscode/sqlite3', async () => {
            const sqlite3 = await new Promise((resolve_8, reject_8) => { require(['@vscode/sqlite3'], resolve_8, reject_8); });
            assert.ok(typeof sqlite3.Database === 'function', testErrorMessage('@vscode/sqlite3'));
        });
        test('vsda', async () => {
            try {
                const vsda = globalThis._VSCODE_NODE_MODULES['vsda'];
                const signer = new vsda.signer();
                const signed = await signer.sign('value');
                assert.ok(typeof signed === 'string', testErrorMessage('vsda'));
            }
            catch (error) {
                if (error.code !== 'MODULE_NOT_FOUND') {
                    throw error;
                }
            }
        });
    });
    (!platform_1.isWindows ? suite.skip : suite)('Native Modules (Windows)', () => {
        (process.type === 'renderer' ? test.skip /* TODO@electron module is not context aware yet and thus cannot load in Electron renderer used by tests */ : test)('@vscode/windows-mutex', async () => {
            const mutex = await new Promise((resolve_9, reject_9) => { require(['@vscode/windows-mutex'], resolve_9, reject_9); });
            assert.ok(mutex && typeof mutex.isActive === 'function', testErrorMessage('@vscode/windows-mutex'));
            assert.ok(typeof mutex.isActive === 'function', testErrorMessage('@vscode/windows-mutex'));
        });
        test('windows-foreground-love', async () => {
            const foregroundLove = await new Promise((resolve_10, reject_10) => { require(['windows-foreground-love'], resolve_10, reject_10); });
            assert.ok(typeof foregroundLove.allowSetForegroundWindow === 'function', testErrorMessage('windows-foreground-love'));
            const result = foregroundLove.allowSetForegroundWindow(process.pid);
            assert.ok(typeof result === 'boolean', testErrorMessage('windows-foreground-love'));
        });
        test('@vscode/windows-process-tree', async () => {
            const processTree = await new Promise((resolve_11, reject_11) => { require(['@vscode/windows-process-tree'], resolve_11, reject_11); });
            assert.ok(typeof processTree.getProcessTree === 'function', testErrorMessage('@vscode/windows-process-tree'));
            return new Promise((resolve, reject) => {
                processTree.getProcessTree(process.pid, tree => {
                    if (tree) {
                        resolve();
                    }
                    else {
                        reject(new Error(testErrorMessage('@vscode/windows-process-tree')));
                    }
                });
            });
        });
        test('@vscode/windows-registry', async () => {
            const windowsRegistry = await new Promise((resolve_12, reject_12) => { require(['@vscode/windows-registry'], resolve_12, reject_12); });
            assert.ok(typeof windowsRegistry.GetStringRegKey === 'function', testErrorMessage('@vscode/windows-registry'));
            const result = windowsRegistry.GetStringRegKey('HKEY_LOCAL_MACHINE', 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion', 'EditionID');
            assert.ok(typeof result === 'string' || typeof result === 'undefined', testErrorMessage('@vscode/windows-registry'));
        });
        test('@vscode/windows-ca-certs', async () => {
            // @ts-ignore we do not directly depend on this module anymore
            // but indirectly from our dependency to `@vscode/proxy-agent`
            // we still want to ensure this module can work properly.
            const windowsCerts = await new Promise((resolve_13, reject_13) => { require(['@vscode/windows-ca-certs'], resolve_13, reject_13); });
            const store = new windowsCerts.Crypt32();
            assert.ok(windowsCerts, testErrorMessage('@vscode/windows-ca-certs'));
            let certCount = 0;
            try {
                while (store.next()) {
                    certCount++;
                }
            }
            finally {
                store.done();
            }
            assert(certCount > 0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlTW9kdWxlcy5pbnRlZ3JhdGlvblRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2Vudmlyb25tZW50L3Rlc3Qvbm9kZS9uYXRpdmVNb2R1bGVzLmludGVncmF0aW9uVGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxTQUFTLGdCQUFnQixDQUFDLE1BQWM7UUFDdkMsT0FBTyxtQkFBbUIsTUFBTSxvSEFBb0gsQ0FBQztJQUN0SixDQUFDO0lBRUQsSUFBQSxzQkFBVSxFQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtRQUVqRCxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzNCLE1BQU0sUUFBUSxHQUFHLHNEQUFhLFVBQVUsMkJBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sUUFBUSxDQUFDLGdCQUFnQixLQUFLLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzFGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3JDLE1BQU0sVUFBVSxHQUFHLHNEQUFhLG9CQUFvQiwyQkFBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxVQUFVLEtBQUssVUFBVSxFQUFFLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztZQUVyRixNQUFNLE1BQU0sR0FBRyxVQUFVLEVBQUUsQ0FBQztZQUM1QixNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sTUFBTSxLQUFLLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFDaEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZUFBZSxF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