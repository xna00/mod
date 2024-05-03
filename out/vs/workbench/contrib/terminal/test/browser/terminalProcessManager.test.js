/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/browser/terminalConfigHelper", "vs/workbench/contrib/terminal/browser/terminalProcessManager", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/product/common/productService", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/workbench/contrib/terminal/common/environmentVariableService", "vs/base/common/network", "vs/base/common/uri", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/test/common/workbenchTestServices", "vs/base/test/common/utils", "vs/platform/log/common/log"], function (require, exports, assert_1, configuration_1, terminalConfigHelper_1, terminalProcessManager_1, testConfigurationService_1, workbenchTestServices_1, productService_1, environmentVariable_1, environmentVariableService_1, network_1, uri_1, terminal_1, terminal_2, terminal_3, lifecycle_1, event_1, workbenchTestServices_2, utils_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTerminalChildProcess {
        get capabilities() { return []; }
        constructor(shouldPersist) {
            this.shouldPersist = shouldPersist;
            this.id = 0;
            this.onDidChangeProperty = event_1.Event.None;
            this.onProcessData = event_1.Event.None;
            this.onProcessExit = event_1.Event.None;
            this.onProcessReady = event_1.Event.None;
            this.onProcessTitleChanged = event_1.Event.None;
            this.onProcessShellTypeChanged = event_1.Event.None;
        }
        updateProperty(property, value) {
            throw new Error('Method not implemented.');
        }
        async start() { return undefined; }
        shutdown(immediate) { }
        input(data) { }
        resize(cols, rows) { }
        clearBuffer() { }
        acknowledgeDataEvent(charCount) { }
        async setUnicodeVersion(version) { }
        async getInitialCwd() { return ''; }
        async getCwd() { return ''; }
        async processBinary(data) { }
        refreshProperty(property) { return Promise.resolve(''); }
    }
    class TestTerminalInstanceService {
        getBackend() {
            return {
                onPtyHostExit: event_1.Event.None,
                onPtyHostUnresponsive: event_1.Event.None,
                onPtyHostResponsive: event_1.Event.None,
                onPtyHostRestart: event_1.Event.None,
                onDidMoveWindowInstance: event_1.Event.None,
                onDidRequestDetach: event_1.Event.None,
                createProcess: (shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, windowsEnableConpty, shouldPersist) => new TestTerminalChildProcess(shouldPersist),
                getLatency: () => Promise.resolve([])
            };
        }
    }
    suite('Workbench - TerminalProcessManager', () => {
        let store;
        let instantiationService;
        let manager;
        setup(async () => {
            store = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, store);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            await configurationService.setUserConfiguration('editor', { fontFamily: 'foo' });
            await configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: 'bar',
                    enablePersistentSessions: true,
                    shellIntegration: {
                        enabled: false
                    }
                }
            });
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(productService_1.IProductService, workbenchTestServices_2.TestProductService);
            instantiationService.stub(terminal_1.ITerminalLogService, new log_1.NullLogService());
            instantiationService.stub(environmentVariable_1.IEnvironmentVariableService, instantiationService.createInstance(environmentVariableService_1.EnvironmentVariableService));
            instantiationService.stub(terminal_2.ITerminalProfileResolverService, workbenchTestServices_1.TestTerminalProfileResolverService);
            instantiationService.stub(terminal_3.ITerminalInstanceService, new TestTerminalInstanceService());
            const configHelper = store.add(instantiationService.createInstance(terminalConfigHelper_1.TerminalConfigHelper));
            manager = store.add(instantiationService.createInstance(terminalProcessManager_1.TerminalProcessManager, 1, configHelper, undefined, undefined, undefined));
        });
        teardown(() => store.dispose());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('process persistence', () => {
            suite('local', () => {
                test('regular terminal should persist', async () => {
                    const p = await manager.createProcess({}, 1, 1, false);
                    (0, assert_1.strictEqual)(p, undefined);
                    (0, assert_1.strictEqual)(manager.shouldPersist, true);
                });
                test('task terminal should not persist', async () => {
                    const p = await manager.createProcess({
                        isFeatureTerminal: true
                    }, 1, 1, false);
                    (0, assert_1.strictEqual)(p, undefined);
                    (0, assert_1.strictEqual)(manager.shouldPersist, false);
                });
            });
            suite('remote', () => {
                const remoteCwd = uri_1.URI.from({
                    scheme: network_1.Schemas.vscodeRemote,
                    path: 'test/cwd'
                });
                test('regular terminal should persist', async () => {
                    const p = await manager.createProcess({
                        cwd: remoteCwd
                    }, 1, 1, false);
                    (0, assert_1.strictEqual)(p, undefined);
                    (0, assert_1.strictEqual)(manager.shouldPersist, true);
                });
                test('task terminal should not persist', async () => {
                    const p = await manager.createProcess({
                        isFeatureTerminal: true,
                        cwd: remoteCwd
                    }, 1, 1, false);
                    (0, assert_1.strictEqual)(p, undefined);
                    (0, assert_1.strictEqual)(manager.shouldPersist, false);
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9jZXNzTWFuYWdlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC90ZXN0L2Jyb3dzZXIvdGVybWluYWxQcm9jZXNzTWFuYWdlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0JoRyxNQUFNLHdCQUF3QjtRQUU3QixJQUFJLFlBQVksS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakMsWUFDVSxhQUFzQjtZQUF0QixrQkFBYSxHQUFiLGFBQWEsQ0FBUztZQUhoQyxPQUFFLEdBQVcsQ0FBQyxDQUFDO1lBY2Ysd0JBQW1CLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNqQyxrQkFBYSxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDM0Isa0JBQWEsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQzNCLG1CQUFjLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUM1QiwwQkFBcUIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ25DLDhCQUF5QixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7UUFkdkMsQ0FBQztRQUNELGNBQWMsQ0FBQyxRQUFhLEVBQUUsS0FBVTtZQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQVlELEtBQUssQ0FBQyxLQUFLLEtBQXlCLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN2RCxRQUFRLENBQUMsU0FBa0IsSUFBVSxDQUFDO1FBQ3RDLEtBQUssQ0FBQyxJQUFZLElBQVUsQ0FBQztRQUM3QixNQUFNLENBQUMsSUFBWSxFQUFFLElBQVksSUFBVSxDQUFDO1FBQzVDLFdBQVcsS0FBVyxDQUFDO1FBQ3ZCLG9CQUFvQixDQUFD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