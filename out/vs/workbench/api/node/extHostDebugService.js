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
define(["require", "exports", "vs/base/common/async", "vs/base/common/platform", "vs/nls", "vs/platform/externalTerminal/node/externalTerminalService", "vs/platform/sign/node/signService", "vs/workbench/api/common/extHostDebugService", "vs/workbench/api/common/extHostEditorTabs", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostVariableResolverService", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/contrib/debug/node/debugAdapter", "vs/workbench/contrib/debug/node/terminals", "../common/extHostConfiguration", "vs/workbench/api/common/extHostCommands"], function (require, exports, async_1, platform, nls, externalTerminalService_1, signService_1, extHostDebugService_1, extHostEditorTabs_1, extHostExtensionService_1, extHostRpcService_1, extHostTerminalService_1, extHostTypes_1, extHostVariableResolverService_1, extHostWorkspace_1, debugAdapter_1, terminals_1, extHostConfiguration_1, extHostCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDebugService = void 0;
    let ExtHostDebugService = class ExtHostDebugService extends extHostDebugService_1.ExtHostDebugServiceBase {
        constructor(extHostRpcService, workspaceService, extensionService, configurationService, _terminalService, editorTabs, variableResolver, commands) {
            super(extHostRpcService, workspaceService, extensionService, configurationService, editorTabs, variableResolver, commands);
            this._terminalService = _terminalService;
            this._integratedTerminalInstances = new DebugTerminalCollection();
        }
        createDebugAdapter(adapter, session) {
            switch (adapter.type) {
                case 'server':
                    return new debugAdapter_1.SocketDebugAdapter(adapter);
                case 'pipeServer':
                    return new debugAdapter_1.NamedPipeDebugAdapter(adapter);
                case 'executable':
                    return new debugAdapter_1.ExecutableDebugAdapter(adapter, session.type);
            }
            return super.createDebugAdapter(adapter, session);
        }
        daExecutableFromPackage(session, extensionRegistry) {
            const dae = debugAdapter_1.ExecutableDebugAdapter.platformAdapterExecutable(extensionRegistry.getAllExtensionDescriptions(), session.type);
            if (dae) {
                return new extHostTypes_1.DebugAdapterExecutable(dae.command, dae.args, dae.options);
            }
            return undefined;
        }
        createSignService() {
            return new signService_1.SignService();
        }
        async $runInTerminal(args, sessionId) {
            if (args.kind === 'integrated') {
                if (!this._terminalDisposedListener) {
                    // React on terminal disposed and check if that is the debug terminal #12956
                    this._terminalDisposedListener = this._terminalService.onDidCloseTerminal(terminal => {
                        this._integratedTerminalInstances.onTerminalClosed(terminal);
                    });
                }
                const configProvider = await this._configurationService.getConfigProvider();
                const shell = this._terminalService.getDefaultShell(true);
                const shellArgs = this._terminalService.getDefaultShellArgs(true);
                const terminalName = args.title || nls.localize('debug.terminal.title', "Debug Process");
                const shellConfig = JSON.stringify({ shell, shellArgs });
                let terminal = await this._integratedTerminalInstances.checkout(shellConfig, terminalName);
                let cwdForPrepareCommand;
                let giveShellTimeToInitialize = false;
                if (!terminal) {
                    const options = {
                        shellPath: shell,
                        shellArgs: shellArgs,
                        cwd: args.cwd,
                        name: terminalName,
                        iconPath: new extHostTypes_1.ThemeIcon('debug'),
                    };
                    giveShellTimeToInitialize = true;
                    terminal = this._terminalService.createTerminalFromOptions(options, {
                        isFeatureTerminal: true,
                        // Since debug termnials are REPLs, we want shell integration to be enabled.
                        // Ignore isFeatureTerminal when evaluating shell integration enablement.
                        forceShellIntegration: true,
                        useShellEnvironment: true
                    });
                    this._integratedTerminalInstances.insert(terminal, shellConfig);
                }
                else {
                    cwdForPrepareCommand = args.cwd;
                }
                terminal.show(true);
                const shellProcessId = await terminal.processId;
                if (giveShellTimeToInitialize) {
                    // give a new terminal some time to initialize the shell
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                else {
                    if (terminal.state.isInteractedWith) {
                        terminal.sendText('\u0003'); // Ctrl+C for #106743. Not part of the same command for #107969
                    }
                    if (configProvider.getConfiguration('debug.terminal').get('clearBeforeReusing')) {
                        // clear terminal before reusing it
                        if (shell.indexOf('powershell') >= 0 || shell.indexOf('pwsh') >= 0 || shell.indexOf('cmd.exe') >= 0) {
                            terminal.sendText('cls');
                        }
                        else if (shell.indexOf('bash') >= 0) {
                            terminal.sendText('clear');
                        }
                        else if (platform.isWindows) {
                            terminal.sendText('cls');
                        }
                        else {
                            terminal.sendText('clear');
                        }
                    }
                }
                const command = (0, terminals_1.prepareCommand)(shell, args.args, !!args.argsCanBeInterpretedByShell, cwdForPrepareCommand, args.env);
                terminal.sendText(command);
                // Mark terminal as unused when its session ends, see #112055
                const sessionListener = this.onDidTerminateDebugSession(s => {
                    if (s.id === sessionId) {
                        this._integratedTerminalInstances.free(terminal);
                        sessionListener.dispose();
                    }
                });
                return shellProcessId;
            }
            else if (args.kind === 'external') {
                return runInExternalTerminal(args, await this._configurationService.getConfigProvider());
            }
            return super.$runInTerminal(args, sessionId);
        }
    };
    exports.ExtHostDebugService = ExtHostDebugService;
    exports.ExtHostDebugService = ExtHostDebugService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostWorkspace_1.IExtHostWorkspace),
        __param(2, extHostExtensionService_1.IExtHostExtensionService),
        __param(3, extHostConfiguration_1.IExtHostConfiguration),
        __param(4, extHostTerminalService_1.IExtHostTerminalService),
        __param(5, extHostEditorTabs_1.IExtHostEditorTabs),
        __param(6, extHostVariableResolverService_1.IExtHostVariableResolverProvider),
        __param(7, extHostCommands_1.IExtHostCommands)
    ], ExtHostDebugService);
    let externalTerminalService = undefined;
    function runInExternalTerminal(args, configProvider) {
        if (!externalTerminalService) {
            if (platform.isWindows) {
                externalTerminalService = new externalTerminalService_1.WindowsExternalTerminalService();
            }
            else if (platform.isMacintosh) {
                externalTerminalService = new externalTerminalService_1.MacExternalTerminalService();
            }
            else if (platform.isLinux) {
                externalTerminalService = new externalTerminalService_1.LinuxExternalTerminalService();
            }
            else {
                throw new Error('external terminals not supported on this platform');
            }
        }
        const config = configProvider.getConfiguration('terminal');
        return externalTerminalService.runInTerminal(args.title, args.cwd, args.args, args.env || {}, config.external || {});
    }
    class DebugTerminalCollection {
        constructor() {
            this._terminalInstances = new Map();
        }
        /**
         * Delay before a new terminal is a candidate for reuse. See #71850
         */
        static { this.minUseDelay = 1000; }
        async checkout(config, name, cleanupOthersByName = false) {
            const entries = [...this._terminalInstances.entries()];
            const promises = entries.map(([terminal, termInfo]) => (0, async_1.createCancelablePromise)(async (ct) => {
                // Only allow terminals that match the title.  See #123189
                if (terminal.name !== name) {
                    return null;
                }
                if (termInfo.lastUsedAt !== -1 && await (0, terminals_1.hasChildProcesses)(await terminal.processId)) {
                    return null;
                }
                // important: date check and map operations must be synchronous
                const now = Date.now();
                if (termInfo.lastUsedAt + DebugTerminalCollection.minUseDelay > now || ct.isCancellationRequested) {
                    return null;
                }
                if (termInfo.config !== config) {
                    if (cleanupOthersByName) {
                        terminal.dispose();
                    }
                    return null;
                }
                termInfo.lastUsedAt = now;
                return terminal;
            }));
            return await (0, async_1.firstParallel)(promises, (t) => !!t);
        }
        insert(terminal, termConfig) {
            this._terminalInstances.set(terminal, { lastUsedAt: Date.now(), config: termConfig });
        }
        free(terminal) {
            const info = this._terminalInstances.get(terminal);
            if (info) {
                info.lastUsedAt = -1;
            }
        }
        onTerminalClosed(terminal) {
            this._terminalInstances.delete(terminal);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERlYnVnU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9ub2RlL2V4dEhvc3REZWJ1Z1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkJ6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLDZDQUF1QjtRQU8vRCxZQUNxQixpQkFBcUMsRUFDdEMsZ0JBQW1DLEVBQzVCLGdCQUEwQyxFQUM3QyxvQkFBMkMsRUFDekMsZ0JBQWlELEVBQ3RELFVBQThCLEVBQ2hCLGdCQUFrRCxFQUNsRSxRQUEwQjtZQUU1QyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBTDFGLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBeUI7WUFSbkUsaUNBQTRCLEdBQUcsSUFBSSx1QkFBdUIsRUFBRSxDQUFDO1FBY3JFLENBQUM7UUFFa0Isa0JBQWtCLENBQUMsT0FBMkIsRUFBRSxPQUE0QjtZQUM5RixRQUFRLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDdEIsS0FBSyxRQUFRO29CQUNaLE9BQU8sSUFBSSxpQ0FBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDeEMsS0FBSyxZQUFZO29CQUNoQixPQUFPLElBQUksb0NBQXFCLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzNDLEtBQUssWUFBWTtvQkFDaEIsT0FBTyxJQUFJLHFDQUFzQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0QsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRWtCLHVCQUF1QixDQUFDLE9BQTRCLEVBQUUsaUJBQStDO1lBQ3ZILE1BQU0sR0FBRyxHQUFHLHFDQUFzQixDQUFDLHlCQUF5QixDQUFDLGlCQUFpQixDQUFDLDJCQUEyQixFQUFFLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVILElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ1QsT0FBTyxJQUFJLHFDQUFzQixDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkUsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFa0IsaUJBQWlCO1lBQ25DLE9BQU8sSUFBSSx5QkFBVyxFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVlLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBaUQsRUFBRSxTQUFpQjtZQUV4RyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssWUFBWSxFQUFFLENBQUM7Z0JBRWhDLElBQUksQ0FBQyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztvQkFDckMsNEVBQTRFO29CQUM1RSxJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxFQUFFO3dCQUNwRixJQUFJLENBQUMsNEJBQTRCLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQzlELENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBRUQsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDNUUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVsRSxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsZUFBZSxDQUFDLENBQUM7Z0JBRXpGLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztnQkFDekQsSUFBSSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsNEJBQTRCLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFFM0YsSUFBSSxvQkFBd0MsQ0FBQztnQkFDN0MsSUFBSSx5QkFBeUIsR0FBRyxLQUFLLENBQUM7Z0JBRXRDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDZixNQUFNLE9BQU8sR0FBMkI7d0JBQ3ZDLFNBQVMsRUFBRSxLQUFLO3dCQUNoQixTQUFTLEVBQUUsU0FBUzt3QkFDcEIsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHO3dCQUNiLElBQUksRUFBRSxZQUFZO3dCQUNsQixRQUFRLEVBQUUsSUFBSSx3QkFBUyxDQUFDLE9BQU8sQ0FBQztxQkFDaEMsQ0FBQztvQkFDRix5QkFBeUIsR0FBRyxJQUFJLENBQUM7b0JBQ2pDLFFBQVEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMseUJBQXlCLENBQUMsT0FBTyxFQUFFO3dCQUNuRSxpQkFBaUIsRUFBRSxJQUFJO3dCQUN2Qiw0RUFBNEU7d0JBQzVFLHlFQUF5RTt3QkFDekUscUJBQXFCLEVBQUUsSUFBSTt3QkFDM0IsbUJBQW1CLEVBQUUsSUFBSTtxQkFDekIsQ0FBQyxDQUFDO29CQUNILElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUVqRSxDQUFDO3FCQUFNLENBQUM7b0JBQ1Asb0JBQW9CLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDakMsQ0FBQztnQkFFRCxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVwQixNQUFNLGNBQWMsR0FBRyxNQUFNLFFBQVEsQ0FBQyxTQUFTLENBQUM7Z0JBRWhELElBQUkseUJBQXlCLEVBQUUsQ0FBQztvQkFDL0Isd0RBQXdEO29CQUN4RCxNQUFNLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7d0JBQ3JDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQywrREFBK0Q7b0JBQzdGLENBQUM7b0JBRUQsSUFBSSxjQUFjLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQVUsb0JBQW9CLENBQUMsRUFBRSxDQUFDO3dCQUMxRixtQ0FBbUM7d0JBQ25DLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzs0QkFDckcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDMUIsQ0FBQzs2QkFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7NEJBQ3ZDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQzVCLENBQUM7NkJBQU0sSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7NEJBQy9CLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQzFCLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUM1QixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxNQUFNLE9BQU8sR0FBRyxJQUFBLDBCQUFjLEVBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQywyQkFBMkIsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3JILFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRTNCLDZEQUE2RDtnQkFDN0QsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUMzRCxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQ3hCLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQ2pELGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDM0IsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztnQkFFSCxPQUFPLGNBQWMsQ0FBQztZQUV2QixDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsTUFBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQzFGLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlDLENBQUM7S0FDRCxDQUFBO0lBcklZLGtEQUFtQjtrQ0FBbkIsbUJBQW1CO1FBUTdCLFdBQUEsc0NBQWtCLENBQUE7UUFDbEIsV0FBQSxvQ0FBaUIsQ0FBQTtRQUNqQixXQUFBLGtEQUF3QixDQUFBO1FBQ3hCLFdBQUEsNENBQXFCLENBQUE7UUFDckIsV0FBQSxnREFBdUIsQ0FBQTtRQUN2QixXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEsaUVBQWdDLENBQUE7UUFDaEMsV0FBQSxrQ0FBZ0IsQ0FBQTtPQWZOLG1CQUFtQixDQXFJL0I7SUFFRCxJQUFJLHVCQUF1QixHQUF5QyxTQUFTLENBQUM7SUFFOUUsU0FBUyxxQkFBcUIsQ0FBQyxJQUFpRCxFQUFFLGNBQXFDO1FBQ3RILElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQzlCLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN4Qix1QkFBdUIsR0FBRyxJQUFJLHdEQUE4QixFQUFFLENBQUM7WUFDaEUsQ0FBQztpQkFBTSxJQUFJLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDakMsdUJBQXVCLEdBQUcsSUFBSSxvREFBMEIsRUFBRSxDQUFDO1lBQzVELENBQUM7aUJBQU0sSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzdCLHVCQUF1QixHQUFHLElBQUksc0RBQTRCLEVBQUUsQ0FBQztZQUM5RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1lBQ3RFLENBQUM7UUFDRixDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzNELE9BQU8sdUJBQXVCLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLElBQUksRUFBRSxFQUFFLE1BQU0sQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdkgsQ0FBQztJQUVELE1BQU0sdUJBQXVCO1FBQTdCO1lBTVMsdUJBQWtCLEdBQUcsSUFBSSxHQUFHLEVBQTJELENBQUM7UUFpRGpHLENBQUM7UUF0REE7O1dBRUc7aUJBQ1ksZ0JBQVcsR0FBRyxJQUFJLEFBQVAsQ0FBUTtRQUkzQixLQUFLLENBQUMsUUFBUSxDQUFDLE1BQWMsRUFBRSxJQUFZLEVBQUUsbUJBQW1CLEdBQUcsS0FBSztZQUM5RSxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDdkQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFBLCtCQUF1QixFQUFDLEtBQUssRUFBQyxFQUFFLEVBQUMsRUFBRTtnQkFFekYsMERBQTBEO2dCQUMxRCxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQzVCLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsSUFBSSxRQUFRLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxJQUFJLE1BQU0sSUFBQSw2QkFBaUIsRUFBQyxNQUFNLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUNyRixPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO2dCQUVELCtEQUErRDtnQkFDL0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN2QixJQUFJLFFBQVEsQ0FBQyxVQUFVLEdBQUcsdUJBQXVCLENBQUMsV0FBVyxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztvQkFDbkcsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFFRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssTUFBTSxFQUFFLENBQUM7b0JBQ2hDLElBQUksbUJBQW1CLEVBQUUsQ0FBQzt3QkFDekIsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNwQixDQUFDO29CQUNELE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsUUFBUSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7Z0JBQzFCLE9BQU8sUUFBUSxDQUFDO1lBQ2pCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLE1BQU0sSUFBQSxxQkFBYSxFQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBd0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRU0sTUFBTSxDQUFDLFFBQXlCLEVBQUUsVUFBa0I7WUFDMUQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZGLENBQUM7UUFFTSxJQUFJLENBQUMsUUFBeUI7WUFDcEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNuRCxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUNWLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdEIsQ0FBQztRQUNGLENBQUM7UUFFTSxnQkFBZ0IsQ0FBQyxRQUF5QjtZQUNoRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFDLENBQUMifQ==