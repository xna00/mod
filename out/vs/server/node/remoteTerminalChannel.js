/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/parts/ipc/node/ipc.net", "vs/workbench/api/node/uriTransformer", "vs/workbench/api/node/extHostCLIServer", "vs/platform/terminal/common/environmentVariableCollection", "vs/platform/terminal/common/environmentVariableShared", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/workbench/services/configurationResolver/common/variableResolver", "vs/server/node/extensionHostConnection", "vs/base/common/async", "vs/platform/terminal/common/terminalEnvironment"], function (require, exports, os, event_1, objects_1, lifecycle_1, path, platform, uri_1, ipc_net_1, uriTransformer_1, extHostCLIServer_1, environmentVariableCollection_1, environmentVariableShared_1, terminalEnvironment, variableResolver_1, extensionHostConnection_1, async_1, terminalEnvironment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteTerminalChannel = void 0;
    class CustomVariableResolver extends variableResolver_1.AbstractVariableResolverService {
        constructor(env, workspaceFolders, activeFileResource, resolvedVariables, extensionService) {
            super({
                getFolderUri: (folderName) => {
                    const found = workspaceFolders.filter(f => f.name === folderName);
                    if (found && found.length > 0) {
                        return found[0].uri;
                    }
                    return undefined;
                },
                getWorkspaceFolderCount: () => {
                    return workspaceFolders.length;
                },
                getConfigurationValue: (folderUri, section) => {
                    return resolvedVariables[`config:${section}`];
                },
                getExecPath: () => {
                    return env['VSCODE_EXEC_PATH'];
                },
                getAppRoot: () => {
                    return env['VSCODE_CWD'];
                },
                getFilePath: () => {
                    if (activeFileResource) {
                        return path.normalize(activeFileResource.fsPath);
                    }
                    return undefined;
                },
                getSelectedText: () => {
                    return resolvedVariables['selectedText'];
                },
                getLineNumber: () => {
                    return resolvedVariables['lineNumber'];
                },
                getExtension: async (id) => {
                    const installed = await extensionService.getInstalled();
                    const found = installed.find(e => e.identifier.id === id);
                    return found && { extensionLocation: found.location };
                },
            }, undefined, Promise.resolve(os.homedir()), Promise.resolve(env));
        }
    }
    class RemoteTerminalChannel extends lifecycle_1.Disposable {
        constructor(_environmentService, _logService, _ptyHostService, _productService, _extensionManagementService, _configurationService) {
            super();
            this._environmentService = _environmentService;
            this._logService = _logService;
            this._ptyHostService = _ptyHostService;
            this._productService = _productService;
            this._extensionManagementService = _extensionManagementService;
            this._configurationService = _configurationService;
            this._lastReqId = 0;
            this._pendingCommands = new Map();
            this._onExecuteCommand = this._register(new event_1.Emitter());
            this.onExecuteCommand = this._onExecuteCommand.event;
        }
        async call(ctx, command, args) {
            switch (command) {
                case "$restartPtyHost" /* RemoteTerminalChannelRequest.RestartPtyHost */: return this._ptyHostService.restartPtyHost.apply(this._ptyHostService, args);
                case "$createProcess" /* RemoteTerminalChannelRequest.CreateProcess */: {
                    const uriTransformer = (0, uriTransformer_1.createURITransformer)(ctx.remoteAuthority);
                    return this._createProcess(uriTransformer, args);
                }
                case "$attachToProcess" /* RemoteTerminalChannelRequest.AttachToProcess */: return this._ptyHostService.attachToProcess.apply(this._ptyHostService, args);
                case "$detachFromProcess" /* RemoteTerminalChannelRequest.DetachFromProcess */: return this._ptyHostService.detachFromProcess.apply(this._ptyHostService, args);
                case "$listProcesses" /* RemoteTerminalChannelRequest.ListProcesses */: return this._ptyHostService.listProcesses.apply(this._ptyHostService, args);
                case "$getLatency" /* RemoteTerminalChannelRequest.GetLatency */: return this._ptyHostService.getLatency.apply(this._ptyHostService, args);
                case "$getPerformanceMarks" /* RemoteTerminalChannelRequest.GetPerformanceMarks */: return this._ptyHostService.getPerformanceMarks.apply(this._ptyHostService, args);
                case "$orphanQuestionReply" /* RemoteTerminalChannelRequest.OrphanQuestionReply */: return this._ptyHostService.orphanQuestionReply.apply(this._ptyHostService, args);
                case "$acceptPtyHostResolvedVariables" /* RemoteTerminalChannelRequest.AcceptPtyHostResolvedVariables */: return this._ptyHostService.acceptPtyHostResolvedVariables.apply(this._ptyHostService, args);
                case "$start" /* RemoteTerminalChannelRequest.Start */: return this._ptyHostService.start.apply(this._ptyHostService, args);
                case "$input" /* RemoteTerminalChannelRequest.Input */: return this._ptyHostService.input.apply(this._ptyHostService, args);
                case "$acknowledgeDataEvent" /* RemoteTerminalChannelRequest.AcknowledgeDataEvent */: return this._ptyHostService.acknowledgeDataEvent.apply(this._ptyHostService, args);
                case "$shutdown" /* RemoteTerminalChannelRequest.Shutdown */: return this._ptyHostService.shutdown.apply(this._ptyHostService, args);
                case "$resize" /* RemoteTerminalChannelRequest.Resize */: return this._ptyHostService.resize.apply(this._ptyHostService, args);
                case "$clearBuffer" /* RemoteTerminalChannelRequest.ClearBuffer */: return this._ptyHostService.clearBuffer.apply(this._ptyHostService, args);
                case "$getInitialCwd" /* RemoteTerminalChannelRequest.GetInitialCwd */: return this._ptyHostService.getInitialCwd.apply(this._ptyHostService, args);
                case "$getCwd" /* RemoteTerminalChannelRequest.GetCwd */: return this._ptyHostService.getCwd.apply(this._ptyHostService, args);
                case "$processBinary" /* RemoteTerminalChannelRequest.ProcessBinary */: return this._ptyHostService.processBinary.apply(this._ptyHostService, args);
                case "$sendCommandResult" /* RemoteTerminalChannelRequest.SendCommandResult */: return this._sendCommandResult(args[0], args[1], args[2]);
                case "$installAutoReply" /* RemoteTerminalChannelRequest.InstallAutoReply */: return this._ptyHostService.installAutoReply.apply(this._ptyHostService, args);
                case "$uninstallAllAutoReplies" /* RemoteTerminalChannelRequest.UninstallAllAutoReplies */: return this._ptyHostService.uninstallAllAutoReplies.apply(this._ptyHostService, args);
                case "$getDefaultSystemShell" /* RemoteTerminalChannelRequest.GetDefaultSystemShell */: return this._getDefaultSystemShell.apply(this, args);
                case "$getProfiles" /* RemoteTerminalChannelRequest.GetProfiles */: return this._getProfiles.apply(this, args);
                case "$getEnvironment" /* RemoteTerminalChannelRequest.GetEnvironment */: return this._getEnvironment();
                case "$getWslPath" /* RemoteTerminalChannelRequest.GetWslPath */: return this._getWslPath(args[0], args[1]);
                case "$getTerminalLayoutInfo" /* RemoteTerminalChannelRequest.GetTerminalLayoutInfo */: return this._ptyHostService.getTerminalLayoutInfo(args);
                case "$setTerminalLayoutInfo" /* RemoteTerminalChannelRequest.SetTerminalLayoutInfo */: return this._ptyHostService.setTerminalLayoutInfo(args);
                case "$serializeTerminalState" /* RemoteTerminalChannelRequest.SerializeTerminalState */: return this._ptyHostService.serializeTerminalState.apply(this._ptyHostService, args);
                case "$reviveTerminalProcesses" /* RemoteTerminalChannelRequest.ReviveTerminalProcesses */: return this._ptyHostService.reviveTerminalProcesses.apply(this._ptyHostService, args);
                case "$getRevivedPtyNewId" /* RemoteTerminalChannelRequest.GetRevivedPtyNewId */: return this._ptyHostService.getRevivedPtyNewId.apply(this._ptyHostService, args);
                case "$setUnicodeVersion" /* RemoteTerminalChannelRequest.SetUnicodeVersion */: return this._ptyHostService.setUnicodeVersion.apply(this._ptyHostService, args);
                case "$reduceConnectionGraceTime" /* RemoteTerminalChannelRequest.ReduceConnectionGraceTime */: return this._reduceConnectionGraceTime();
                case "$updateIcon" /* RemoteTerminalChannelRequest.UpdateIcon */: return this._ptyHostService.updateIcon.apply(this._ptyHostService, args);
                case "$updateTitle" /* RemoteTerminalChannelRequest.UpdateTitle */: return this._ptyHostService.updateTitle.apply(this._ptyHostService, args);
                case "$updateProperty" /* RemoteTerminalChannelRequest.UpdateProperty */: return this._ptyHostService.updateProperty.apply(this._ptyHostService, args);
                case "$refreshProperty" /* RemoteTerminalChannelRequest.RefreshProperty */: return this._ptyHostService.refreshProperty.apply(this._ptyHostService, args);
                case "$requestDetachInstance" /* RemoteTerminalChannelRequest.RequestDetachInstance */: return this._ptyHostService.requestDetachInstance(args[0], args[1]);
                case "$acceptDetachedInstance" /* RemoteTerminalChannelRequest.AcceptDetachedInstance */: return this._ptyHostService.acceptDetachInstanceReply(args[0], args[1]);
                case "$freePortKillProcess" /* RemoteTerminalChannelRequest.FreePortKillProcess */: return this._ptyHostService.freePortKillProcess.apply(this._ptyHostService, args);
                case "$acceptDetachInstanceReply" /* RemoteTerminalChannelRequest.AcceptDetachInstanceReply */: return this._ptyHostService.acceptDetachInstanceReply.apply(this._ptyHostService, args);
            }
            // @ts-expect-error Assert command is the `never` type to ensure all messages are handled
            throw new Error(`IPC Command ${command} not found`);
        }
        listen(_, event, arg) {
            switch (event) {
                case "$onPtyHostExitEvent" /* RemoteTerminalChannelEvent.OnPtyHostExitEvent */: return this._ptyHostService.onPtyHostExit || event_1.Event.None;
                case "$onPtyHostStartEvent" /* RemoteTerminalChannelEvent.OnPtyHostStartEvent */: return this._ptyHostService.onPtyHostStart || event_1.Event.None;
                case "$onPtyHostUnresponsiveEvent" /* RemoteTerminalChannelEvent.OnPtyHostUnresponsiveEvent */: return this._ptyHostService.onPtyHostUnresponsive || event_1.Event.None;
                case "$onPtyHostResponsiveEvent" /* RemoteTerminalChannelEvent.OnPtyHostResponsiveEvent */: return this._ptyHostService.onPtyHostResponsive || event_1.Event.None;
                case "$onPtyHostRequestResolveVariablesEvent" /* RemoteTerminalChannelEvent.OnPtyHostRequestResolveVariablesEvent */: return this._ptyHostService.onPtyHostRequestResolveVariables || event_1.Event.None;
                case "$onProcessDataEvent" /* RemoteTerminalChannelEvent.OnProcessDataEvent */: return this._ptyHostService.onProcessData;
                case "$onProcessReadyEvent" /* RemoteTerminalChannelEvent.OnProcessReadyEvent */: return this._ptyHostService.onProcessReady;
                case "$onProcessExitEvent" /* RemoteTerminalChannelEvent.OnProcessExitEvent */: return this._ptyHostService.onProcessExit;
                case "$onProcessReplayEvent" /* RemoteTerminalChannelEvent.OnProcessReplayEvent */: return this._ptyHostService.onProcessReplay;
                case "$onProcessOrphanQuestion" /* RemoteTerminalChannelEvent.OnProcessOrphanQuestion */: return this._ptyHostService.onProcessOrphanQuestion;
                case "$onExecuteCommand" /* RemoteTerminalChannelEvent.OnExecuteCommand */: return this.onExecuteCommand;
                case "$onDidRequestDetach" /* RemoteTerminalChannelEvent.OnDidRequestDetach */: return this._ptyHostService.onDidRequestDetach || event_1.Event.None;
                case "$onDidChangeProperty" /* RemoteTerminalChannelEvent.OnDidChangeProperty */: return this._ptyHostService.onDidChangeProperty;
            }
            // @ts-expect-error Assert event is the `never` type to ensure all messages are handled
            throw new Error(`IPC Command ${event} not found`);
        }
        async _createProcess(uriTransformer, args) {
            const shellLaunchConfig = {
                name: args.shellLaunchConfig.name,
                executable: args.shellLaunchConfig.executable,
                args: args.shellLaunchConfig.args,
                cwd: (typeof args.shellLaunchConfig.cwd === 'string' || typeof args.shellLaunchConfig.cwd === 'undefined'
                    ? args.shellLaunchConfig.cwd
                    : uri_1.URI.revive(uriTransformer.transformIncoming(args.shellLaunchConfig.cwd))),
                env: args.shellLaunchConfig.env,
                useShellEnvironment: args.shellLaunchConfig.useShellEnvironment,
                reconnectionProperties: args.shellLaunchConfig.reconnectionProperties,
                type: args.shellLaunchConfig.type,
                isFeatureTerminal: args.shellLaunchConfig.isFeatureTerminal
            };
            const baseEnv = await (0, extensionHostConnection_1.buildUserEnvironment)(args.resolverEnv, !!args.shellLaunchConfig.useShellEnvironment, platform.language, this._environmentService, this._logService, this._configurationService);
            this._logService.trace('baseEnv', baseEnv);
            const reviveWorkspaceFolder = (workspaceData) => {
                return {
                    uri: uri_1.URI.revive(uriTransformer.transformIncoming(workspaceData.uri)),
                    name: workspaceData.name,
                    index: workspaceData.index,
                    toResource: () => {
                        throw new Error('Not implemented');
                    }
                };
            };
            const workspaceFolders = args.workspaceFolders.map(reviveWorkspaceFolder);
            const activeWorkspaceFolder = args.activeWorkspaceFolder ? reviveWorkspaceFolder(args.activeWorkspaceFolder) : undefined;
            const activeFileResource = args.activeFileResource ? uri_1.URI.revive(uriTransformer.transformIncoming(args.activeFileResource)) : undefined;
            const customVariableResolver = new CustomVariableResolver(baseEnv, workspaceFolders, activeFileResource, args.resolvedVariables, this._extensionManagementService);
            const variableResolver = terminalEnvironment.createVariableResolver(activeWorkspaceFolder, process.env, customVariableResolver);
            // Get the initial cwd
            const initialCwd = await terminalEnvironment.getCwd(shellLaunchConfig, os.homedir(), variableResolver, activeWorkspaceFolder?.uri, args.configuration['terminal.integrated.cwd'], this._logService);
            shellLaunchConfig.cwd = initialCwd;
            const envPlatformKey = platform.isWindows ? 'terminal.integrated.env.windows' : (platform.isMacintosh ? 'terminal.integrated.env.osx' : 'terminal.integrated.env.linux');
            const envFromConfig = args.configuration[envPlatformKey];
            const env = await terminalEnvironment.createTerminalEnvironment(shellLaunchConfig, envFromConfig, variableResolver, this._productService.version, args.configuration['terminal.integrated.detectLocale'], baseEnv);
            // Apply extension environment variable collections to the environment
            if ((0, terminalEnvironment_1.shouldUseEnvironmentVariableCollection)(shellLaunchConfig)) {
                const entries = [];
                for (const [k, v, d] of args.envVariableCollections) {
                    entries.push([k, { map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)(v), descriptionMap: (0, environmentVariableShared_1.deserializeEnvironmentDescriptionMap)(d) }]);
                }
                const envVariableCollections = new Map(entries);
                const mergedCollection = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(envVariableCollections);
                const workspaceFolder = activeWorkspaceFolder ? activeWorkspaceFolder ?? undefined : undefined;
                await mergedCollection.applyToProcessEnvironment(env, { workspaceFolder }, variableResolver);
            }
            // Fork the process and listen for messages
            this._logService.debug(`Terminal process launching on remote agent`, { shellLaunchConfig, initialCwd, cols: args.cols, rows: args.rows, env });
            // Setup the CLI server to support forwarding commands run from the CLI
            const ipcHandlePath = (0, ipc_net_1.createRandomIPCHandle)();
            env.VSCODE_IPC_HOOK_CLI = ipcHandlePath;
            const persistentProcessId = await this._ptyHostService.createProcess(shellLaunchConfig, initialCwd, args.cols, args.rows, args.unicodeVersion, env, baseEnv, args.options, args.shouldPersistTerminal, args.workspaceId, args.workspaceName);
            const commandsExecuter = {
                executeCommand: (id, ...args) => this._executeCommand(persistentProcessId, id, args, uriTransformer)
            };
            const cliServer = new extHostCLIServer_1.CLIServerBase(commandsExecuter, this._logService, ipcHandlePath);
            this._ptyHostService.onProcessExit(e => e.id === persistentProcessId && cliServer.dispose());
            return {
                persistentTerminalId: persistentProcessId,
                resolvedShellLaunchConfig: shellLaunchConfig
            };
        }
        _executeCommand(persistentProcessId, commandId, commandArgs, uriTransformer) {
            const { resolve, reject, promise } = (0, async_1.promiseWithResolvers)();
            const reqId = ++this._lastReqId;
            this._pendingCommands.set(reqId, { resolve, reject, uriTransformer });
            const serializedCommandArgs = (0, objects_1.cloneAndChange)(commandArgs, (obj) => {
                if (obj && obj.$mid === 1) {
                    // this is UriComponents
                    return uriTransformer.transformOutgoing(obj);
                }
                if (obj && obj instanceof uri_1.URI) {
                    return uriTransformer.transformOutgoingURI(obj);
                }
                return undefined;
            });
            this._onExecuteCommand.fire({
                reqId,
                persistentProcessId,
                commandId,
                commandArgs: serializedCommandArgs
            });
            return promise;
        }
        _sendCommandResult(reqId, isError, serializedPayload) {
            const data = this._pendingCommands.get(reqId);
            if (!data) {
                return;
            }
            this._pendingCommands.delete(reqId);
            const payload = (0, objects_1.cloneAndChange)(serializedPayload, (obj) => {
                if (obj && obj.$mid === 1) {
                    // this is UriComponents
                    return data.uriTransformer.transformIncoming(obj);
                }
                return undefined;
            });
            if (isError) {
                data.reject(payload);
            }
            else {
                data.resolve(payload);
            }
        }
        _getDefaultSystemShell(osOverride) {
            return this._ptyHostService.getDefaultSystemShell(osOverride);
        }
        async _getProfiles(workspaceId, profiles, defaultProfile, includeDetectedProfiles) {
            return this._ptyHostService.getProfiles(workspaceId, profiles, defaultProfile, includeDetectedProfiles) || [];
        }
        _getEnvironment() {
            return { ...process.env };
        }
        _getWslPath(original, direction) {
            return this._ptyHostService.getWslPath(original, direction);
        }
        _reduceConnectionGraceTime() {
            return this._ptyHostService.reduceConnectionGraceTime();
        }
    }
    exports.RemoteTerminalChannel = RemoteTerminalChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlVGVybWluYWxDaGFubmVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9zZXJ2ZXIvbm9kZS9yZW1vdGVUZXJtaW5hbENoYW5uZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUNoRyxNQUFNLHNCQUF1QixTQUFRLGtEQUErQjtRQUNuRSxZQUNDLEdBQWlDLEVBQ2pDLGdCQUFvQyxFQUNwQyxrQkFBbUMsRUFDbkMsaUJBQTZDLEVBQzdDLGdCQUE2QztZQUU3QyxLQUFLLENBQUM7Z0JBQ0wsWUFBWSxFQUFFLENBQUMsVUFBa0IsRUFBbUIsRUFBRTtvQkFDckQsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsQ0FBQztvQkFDbEUsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQzt3QkFDL0IsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO29CQUNyQixDQUFDO29CQUNELE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2dCQUNELHVCQUF1QixFQUFFLEdBQVcsRUFBRTtvQkFDckMsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUM7Z0JBQ2hDLENBQUM7Z0JBQ0QscUJBQXFCLEVBQUUsQ0FBQyxTQUFjLEVBQUUsT0FBZSxFQUFzQixFQUFFO29CQUM5RSxPQUFPLGlCQUFpQixDQUFDLFVBQVUsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDL0MsQ0FBQztnQkFDRCxXQUFXLEVBQUUsR0FBdUIsRUFBRTtvQkFDckMsT0FBTyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztnQkFDaEMsQ0FBQztnQkFDRCxVQUFVLEVBQUUsR0FBdUIs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