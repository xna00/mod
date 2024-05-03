/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "net", "vs/platform/debug/common/extensionHostDebugIpc", "vs/platform/environment/node/argv"], function (require, exports, net_1, extensionHostDebugIpc_1, argv_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronExtensionHostDebugBroadcastChannel = void 0;
    class ElectronExtensionHostDebugBroadcastChannel extends extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel {
        constructor(windowsMainService) {
            super();
            this.windowsMainService = windowsMainService;
        }
        call(ctx, command, arg) {
            if (command === 'openExtensionDevelopmentHostWindow') {
                return this.openExtensionDevelopmentHostWindow(arg[0], arg[1]);
            }
            else {
                return super.call(ctx, command, arg);
            }
        }
        async openExtensionDevelopmentHostWindow(args, debugRenderer) {
            const pargs = (0, argv_1.parseArgs)(args, argv_1.OPTIONS);
            pargs.debugRenderer = debugRenderer;
            const extDevPaths = pargs.extensionDevelopmentPath;
            if (!extDevPaths) {
                return { success: false };
            }
            const [codeWindow] = await this.windowsMainService.openExtensionDevelopmentHostWindow(extDevPaths, {
                context: 5 /* OpenContext.API */,
                cli: pargs,
                forceProfile: pargs.profile,
                forceTempProfile: pargs['profile-temp']
            });
            if (!debugRenderer) {
                return { success: true };
            }
            const win = codeWindow.win;
            if (!win) {
                return { success: true };
            }
            const debug = win.webContents.debugger;
            let listeners = debug.isAttached() ? Infinity : 0;
            const server = (0, net_1.createServer)(listener => {
                if (listeners++ === 0) {
                    debug.attach();
                }
                let closed = false;
                const writeMessage = (message) => {
                    if (!closed) { // in case sendCommand promises settle after closed
                        listener.write(JSON.stringify(message) + '\0'); // null-delimited, CDP-compatible
                    }
                };
                const onMessage = (_event, method, params, sessionId) => writeMessage(({ method, params, sessionId }));
                win.on('close', () => {
                    debug.removeListener('message', onMessage);
                    listener.end();
                    closed = true;
                });
                debug.addListener('message', onMessage);
                let buf = Buffer.alloc(0);
                listener.on('data', data => {
                    buf = Buffer.concat([buf, data]);
                    for (let delimiter = buf.indexOf(0); delimiter !== -1; delimiter = buf.indexOf(0)) {
                        let data;
                        try {
                            const contents = buf.slice(0, delimiter).toString('utf8');
                            buf = buf.slice(delimiter + 1);
                            data = JSON.parse(contents);
                        }
                        catch (e) {
                            console.error('error reading cdp line', e);
                        }
                        // depends on a new API for which electron.d.ts has not been updated:
                        // @ts-ignore
                        debug.sendCommand(data.method, data.params, data.sessionId)
                            .then((result) => writeMessage({ id: data.id, sessionId: data.sessionId, result }))
                            .catch((error) => writeMessage({ id: data.id, sessionId: data.sessionId, error: { code: 0, message: error.message } }));
                    }
                });
                listener.on('error', err => {
                    console.error('error on cdp pipe:', err);
                });
                listener.on('close', () => {
                    closed = true;
                    if (--listeners === 0) {
                        debug.detach();
                    }
                });
            });
            await new Promise(r => server.listen(0, r));
            win.on('close', () => server.close());
            return { rendererDebugPort: server.address().port, success: true };
        }
    }
    exports.ElectronExtensionHostDebugBroadcastChannel = ElectronExtensionHostDebugBroadcastChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdERlYnVnSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9kZWJ1Zy9lbGVjdHJvbi1tYWluL2V4dGVuc2lvbkhvc3REZWJ1Z0lwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSwwQ0FBcUQsU0FBUSwwREFBNEM7UUFFckgsWUFDUyxrQkFBdUM7WUFFL0MsS0FBSyxFQUFFLENBQUM7WUFGQSx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1FBR2hELENBQUM7UUFFUSxJQUFJLENBQUMsR0FBYSxFQUFFLE9BQWUsRUFBRSxHQUFTO1lBQ3RELElBQUksT0FBTyxLQUFLLG9DQUFvQyxFQUFFLENBQUM7Z0JBQ3RELE9BQU8sSUFBSSxDQUFDLGtDQUFrQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdEMsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsa0NBQWtDLENBQUMsSUFBYyxFQUFFLGFBQXNCO1lBQ3RGLE1BQU0sS0FBSyxHQUFHLElBQUEsZ0JBQVMsRUFBQyxJQUFJLEVBQUUsY0FBTyxDQUFDLENBQUM7WUFDdkMsS0FBSyxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7WUFFcEMsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLHdCQUF3QixDQUFDO1lBQ25ELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQztZQUMzQixDQUFDO1lBRUQsTUFBTSxDQUFD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