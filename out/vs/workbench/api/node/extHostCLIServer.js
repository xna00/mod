/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/parts/ipc/node/ipc.net", "http", "fs", "vs/workbench/api/common/extHostCommands", "vs/base/common/uri", "vs/platform/log/common/log", "vs/platform/workspace/common/workspace"], function (require, exports, ipc_net_1, http, fs, extHostCommands_1, uri_1, log_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CLIServer = exports.CLIServerBase = void 0;
    class CLIServerBase {
        constructor(_commands, logService, _ipcHandlePath) {
            this._commands = _commands;
            this.logService = logService;
            this._ipcHandlePath = _ipcHandlePath;
            this._server = http.createServer((req, res) => this.onRequest(req, res));
            this.setup().catch(err => {
                logService.error(err);
                return '';
            });
        }
        get ipcHandlePath() {
            return this._ipcHandlePath;
        }
        async setup() {
            try {
                this._server.listen(this.ipcHandlePath);
                this._server.on('error', err => this.logService.error(err));
            }
            catch (err) {
                this.logService.error('Could not start open from terminal server.');
            }
            return this._ipcHandlePath;
        }
        onRequest(req, res) {
            const sendResponse = (statusCode, returnObj) => {
                res.writeHead(statusCode, { 'content-type': 'application/json' });
                res.end(JSON.stringify(returnObj || null), (err) => err && this.logService.error(err)); // CodeQL [SM01524] Only the message portion of errors are passed in.
            };
            const chunks = [];
            req.setEncoding('utf8');
            req.on('data', (d) => chunks.push(d));
            req.on('end', async () => {
                try {
                    const data = JSON.parse(chunks.join(''));
                    let returnObj;
                    switch (data.type) {
                        case 'open':
                            returnObj = await this.open(data);
                            break;
                        case 'openExternal':
                            returnObj = await this.openExternal(data);
                            break;
                        case 'status':
                            returnObj = await this.getStatus(data);
                            break;
                        case 'extensionManagement':
                            returnObj = await this.manageExtensions(data);
                            break;
                        default:
                            sendResponse(404, `Unknown message type: ${data.type}`);
                            break;
                    }
                    sendResponse(200, returnObj);
                }
                catch (e) {
                    const message = e instanceof Error ? e.message : JSON.stringify(e);
                    sendResponse(500, message);
                    this.logService.error('Error while processing pipe request', e);
                }
            });
        }
        async open(data) {
            const { fileURIs, folderURIs, forceNewWindow, diffMode, mergeMode, addMode, forceReuseWindow, gotoLineMode, waitMarkerFilePath, remoteAuthority } = data;
            const urisToOpen = [];
            if (Array.isArray(folderURIs)) {
                for (const s of folderURIs) {
                    try {
                        urisToOpen.push({ folderUri: uri_1.URI.parse(s) });
                    }
                    catch (e) {
                        // ignore
                    }
                }
            }
            if (Array.isArray(fileURIs)) {
                for (const s of fileURIs) {
                    try {
                        if ((0, workspace_1.hasWorkspaceFileExtension)(s)) {
                            urisToOpen.push({ workspaceUri: uri_1.URI.parse(s) });
                        }
                        else {
                            urisToOpen.push({ fileUri: uri_1.URI.parse(s) });
                        }
                    }
                    catch (e) {
                        // ignore
                    }
                }
            }
            const waitMarkerFileURI = waitMarkerFilePath ? uri_1.URI.file(waitMarkerFilePath) : undefined;
            const preferNewWindow = !forceReuseWindow && !waitMarkerFileURI && !addMode;
            const windowOpenArgs = { forceNewWindow, diffMode, mergeMode, addMode, gotoLineMode, forceReuseWindow, preferNewWindow, waitMarkerFileURI, remoteAuthority };
            this._commands.executeCommand('_remoteCLI.windowOpen', urisToOpen, windowOpenArgs);
        }
        async openExternal(data) {
            for (const uriString of data.uris) {
                const uri = uri_1.URI.parse(uriString);
                const urioOpen = uri.scheme === 'file' ? uri : uriString; // workaround for #112577
                await this._commands.executeCommand('_remoteCLI.openExternal', urioOpen);
            }
        }
        async manageExtensions(data) {
            const toExtOrVSIX = (inputs) => inputs?.map(input => /\.vsix$/i.test(input) ? uri_1.URI.parse(input) : input);
            const commandArgs = {
                list: data.list,
                install: toExtOrVSIX(data.install),
                uninstall: toExtOrVSIX(data.uninstall),
                force: data.force
            };
            return await this._commands.executeCommand('_remoteCLI.manageExtensions', commandArgs);
        }
        async getStatus(data) {
            return await this._commands.executeCommand('_remoteCLI.getSystemStatus');
        }
        dispose() {
            this._server.close();
            if (this._ipcHandlePath && process.platform !== 'win32' && fs.existsSync(this._ipcHandlePath)) {
                fs.unlinkSync(this._ipcHandlePath);
            }
        }
    }
    exports.CLIServerBase = CLIServerBase;
    let CLIServer = class CLIServer extends CLIServerBase {
        constructor(commands, logService) {
            super(commands, logService, (0, ipc_net_1.createRandomIPCHandle)());
        }
    };
    exports.CLIServer = CLIServer;
    exports.CLIServer = CLIServer = __decorate([
        __param(0, extHostCommands_1.IExtHostCommands),
        __param(1, log_1.ILogService)
    ], CLIServer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENMSVNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9ub2RlL2V4dEhvc3RDTElTZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0RoRyxNQUFhLGFBQWE7UUFHekIsWUFDa0IsU0FBNEIsRUFDNUIsVUFBdUIsRUFDdkIsY0FBc0I7WUFGdEIsY0FBUyxHQUFULFNBQVMsQ0FBbUI7WUFDNUIsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUN2QixtQkFBYyxHQUFkLGNBQWMsQ0FBUTtZQUV2QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3hCLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3RCLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsSUFBVyxhQUFhO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUM1QixDQUFDO1FBRU8sS0FBSyxDQUFDLEtBQUs7WUFDbEIsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFD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