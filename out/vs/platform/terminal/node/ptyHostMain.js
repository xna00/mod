/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uriIpc", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.cp", "vs/base/parts/ipc/node/ipc.mp", "vs/nls", "vs/platform/environment/node/argv", "vs/platform/environment/node/environmentService", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/platform/log/common/logService", "vs/platform/log/node/loggerService", "vs/platform/product/common/product", "vs/platform/terminal/common/terminal", "vs/platform/terminal/node/heartbeatService", "vs/platform/terminal/node/ptyService", "vs/base/parts/sandbox/node/electronTypes", "vs/base/common/async", "vs/base/common/lifecycle"], function (require, exports, uriIpc_1, ipc_1, ipc_cp_1, ipc_mp_1, nls_1, argv_1, environmentService_1, log_1, logIpc_1, logService_1, loggerService_1, product_1, terminal_1, heartbeatService_1, ptyService_1, electronTypes_1, async_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    startPtyHost();
    async function startPtyHost() {
        // Parse environment variables
        const startupDelay = parseInt(process.env.VSCODE_STARTUP_DELAY ?? '0');
        const simulatedLatency = parseInt(process.env.VSCODE_LATENCY ?? '0');
        const reconnectConstants = {
            graceTime: parseInt(process.env.VSCODE_RECONNECT_GRACE_TIME || '0'),
            shortGraceTime: parseInt(process.env.VSCODE_RECONNECT_SHORT_GRACE_TIME || '0'),
            scrollback: parseInt(process.env.VSCODE_RECONNECT_SCROLLBACK || '100')
        };
        // Sanitize environment
        delete process.env.VSCODE_RECONNECT_GRACE_TIME;
        delete process.env.VSCODE_RECONNECT_SHORT_GRACE_TIME;
        delete process.env.VSCODE_RECONNECT_SCROLLBACK;
        delete process.env.VSCODE_LATENCY;
        delete process.env.VSCODE_STARTUP_DELAY;
        // Delay startup if needed, this must occur before RPC is setup to avoid the channel from timing
        // out.
        if (startupDelay) {
            await (0, async_1.timeout)(startupDelay);
        }
        // Setup RPC
        const _isUtilityProcess = (0, electronTypes_1.isUtilityProcess)(process);
        let server;
        if (_isUtilityProcess) {
            server = new ipc_mp_1.Server();
        }
        else {
            server = new ipc_cp_1.Server(terminal_1.TerminalIpcChannels.PtyHost);
        }
        // Services
        const productService = { _serviceBrand: undefined, ...product_1.default };
        const environmentService = new environmentService_1.NativeEnvironmentService((0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS), productService);
        const loggerService = new loggerService_1.LoggerService((0, log_1.getLogLevel)(environmentService), environmentService.logsHome);
        server.registerChannel(terminal_1.TerminalIpcChannels.Logger, new logIpc_1.LoggerChannel(loggerService, () => uriIpc_1.DefaultURITransformer));
        const logger = loggerService.createLogger('ptyhost', { name: (0, nls_1.localize)('ptyHost', "Pty Host") });
        const logService = new logService_1.LogService(logger);
        // Log developer config
        if (startupDelay) {
            logService.warn(`Pty Host startup is delayed ${startupDelay}ms`);
        }
        if (simulatedLatency) {
            logService.warn(`Pty host is simulating ${simulatedLatency}ms latency`);
        }
        const disposables = new lifecycle_1.DisposableStore();
        // Heartbeat responsiveness tracking
        const heartbeatService = new heartbeatService_1.HeartbeatService();
        server.registerChannel(terminal_1.TerminalIpcChannels.Heartbeat, ipc_1.ProxyChannel.fromService(heartbeatService, disposables));
        // Init pty service
        const ptyService = new ptyService_1.PtyService(logService, productService, reconnectConstants, simulatedLatency);
        const ptyServiceChannel = ipc_1.ProxyChannel.fromService(ptyService, disposables);
        server.registerChannel(terminal_1.TerminalIpcChannels.PtyHost, ptyServiceChannel);
        // Register a channel for direct communication via Message Port
        if (_isUtilityProcess) {
            server.registerChannel(terminal_1.TerminalIpcChannels.PtyHostWindow, ptyServiceChannel);
        }
        // Clean up
        process.once('exit', () => {
            logService.trace('Pty host exiting');
            logService.dispose();
            heartbeatService.dispose();
            ptyService.dispose();
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHR5SG9zdE1haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL25vZGUvcHR5SG9zdE1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFzQmhHLFlBQVksRUFBRSxDQUFDO0lBRWYsS0FBSyxVQUFVLFlBQVk7UUFDMUIsOEJBQThCO1FBQzlCLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZFLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sa0JBQWtCLEdBQXdCO1lBQy9DLFNBQVMsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsSUFBSSxHQUFHLENBQUM7WUFDbkUsY0FBYyxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxJQUFJLEdBQUcsQ0FBQztZQUM5RSxVQUFVLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLElBQUksS0FBSyxDQUFDO1NBQ3RFLENBQUM7UUFFRix1QkFBdUI7UUFDdkIsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUFDO1FBQy9DLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsQ0FBQztRQUNyRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUM7UUFDL0MsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQztRQUNsQyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUM7UUFFeEMsZ0dBQWdHO1FBQ2hHLE9B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