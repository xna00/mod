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
define(["require", "exports", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/contrib/terminal/electron-sandbox/terminalRemote", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/native/common/native", "vs/base/common/lifecycle", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/browser/dom"], function (require, exports, globals_1, uri_1, files_1, terminalRemote_1, remoteAgentService_1, native_1, lifecycle_1, terminal_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalNativeContribution = void 0;
    let TerminalNativeContribution = class TerminalNativeContribution extends lifecycle_1.Disposable {
        constructor(_fileService, _terminalService, remoteAgentService, nativeHostService) {
            super();
            this._fileService = _fileService;
            this._terminalService = _terminalService;
            globals_1.ipcRenderer.on('vscode:openFiles', (_, request) => { this._onOpenFileRequest(request); });
            this._register(nativeHostService.onDidResumeOS(() => this._onOsResume()));
            this._terminalService.setNativeDelegate({
                getWindowCount: () => nativeHostService.getWindowCount()
            });
            const connection = remoteAgentService.getConnection();
            if (connection && connection.remoteAuthority) {
                (0, terminalRemote_1.registerRemoteContributions)();
            }
        }
        _onOsResume() {
            for (const instance of this._terminalService.instances) {
                instance.xterm?.forceRedraw();
            }
        }
        async _onOpenFileRequest(request) {
            // if the request to open files is coming in from the integrated terminal (identified though
            // the termProgram variable) and we are instructed to wait for editors close, wait for the
            // marker file to get deleted and then focus back to the integrated terminal.
            if (request.termProgram === 'vscode' && request.filesToWait) {
                const waitMarkerFileUri = uri_1.URI.revive(request.filesToWait.waitMarkerFileUri);
                await this._whenFileDeleted(waitMarkerFileUri);
                // Focus active terminal
                this._terminalService.activeInstance?.focus();
            }
        }
        _whenFileDeleted(path) {
            // Complete when wait marker file is deleted
            return new Promise(resolve => {
                let running = false;
                const interval = (0, dom_1.disposableWindowInterval)((0, dom_1.getActiveWindow)(), async () => {
                    if (!running) {
                        running = true;
                        const exists = await this._fileService.exists(path);
                        running = false;
                        if (!exists) {
                            interval.dispose();
                            resolve(undefined);
                        }
                    }
                }, 1000);
            });
        }
    };
    exports.TerminalNativeContribution = TerminalNativeContribution;
    exports.TerminalNativeContribution = TerminalNativeContribution = __decorate([
        __param(0, files_1.IFileService),
        __param(1, terminal_1.ITerminalService),
        __param(2, remoteAgentService_1.IRemoteAgentService),
        __param(3, native_1.INativeHostService)
    ], TerminalNativeContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxOYXRpdmVDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2VsZWN0cm9uLXNhbmRib3gvdGVybWluYWxOYXRpdmVDb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0sMEJBQTBCLEdBQWhDLE1BQU0sMEJBQTJCLFNBQVEsc0JBQVU7UUFHekQsWUFDZ0MsWUFBMEIsRUFDdEIsZ0JBQWtDLEVBQ2hELGtCQUF1QyxFQUN4QyxpQkFBcUM7WUFFekQsS0FBSyxFQUFFLENBQUM7WUFMdUIsaUJBQVksR0FBWixZQUFZLENBQWM7WUFDdEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQU1yRSxxQkFBVyxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQVUsRUFBRSxPQUErQixFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzSCxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDdkMsY0FBYyxFQUFFLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRTthQUN4RCxDQUFDLENBQUM7WUFFSCxNQUFNLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN0RCxJQUFJLFVBQVUsSUFBSSxVQUFVLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzlDLElBQUEsNENBQTJCLEdBQUUsQ0FBQztZQUMvQixDQUFDO1FBQ0YsQ0FBQztRQUVPLFdBQVc7WUFDbEIsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3hELFFBQVEsQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFLENBQUM7WUFDL0IsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsa0JBQWtCLENBQUMsT0FBK0I7WUFDL0QsNEZBQTRGO1lBQzVGLDBGQUEwRjtZQUMxRiw2RUFBNkU7WUFDN0UsSUFBSSxPQUFPLENBQUMsV0FBVyxLQUFLLFFBQVEsSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzdELE1BQU0saUJBQWlCLEdBQUcsU0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQzVFLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBRS9DLHdCQUF3QjtnQkFDeEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsRUFBRSxLQUFLLEVBQUUsQ0FBQztZQUMvQyxDQUFDO1FBQ0YsQ0FBQztRQUVPLGdCQUFnQixDQUFDLElBQVM7WUFDakMsNENBQTRDO1lBQzVDLE9BQU8sSUFBSSxPQUFPLENBQU8sT0FBTyxDQUFDLEVBQUU7Z0JBQ2xDLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztnQkFDcEIsTUFBTSxRQUFRLEdBQUcsSUFBQSw4QkFBd0IsRUFBQyxJQUFBLHFCQUFlLEdBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDdkUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNkLE9BQU8sR0FBRyxJQUFJLENBQUM7d0JBQ2YsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDcEQsT0FBTyxHQUFHLEtBQUssQ0FBQzt3QkFFaEIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDOzRCQUNiLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs0QkFDbkIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO3dCQUNwQixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ1YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QsQ0FBQTtJQTdEWSxnRUFBMEI7eUNBQTFCLDBCQUEwQjtRQUlwQyxXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFdBQUEsd0NBQW1CLENBQUE7UUFDbkIsV0FBQSwyQkFBa0IsQ0FBQTtPQVBSLDBCQUEwQixDQTZEdEMifQ==