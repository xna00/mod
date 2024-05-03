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
define(["require", "exports", "vs/workbench/services/configuration/common/configuration", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/workspace/common/workspace", "vs/platform/terminal/common/environmentVariableShared", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/base/common/network", "vs/platform/label/common/label", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/platform/terminal/common/terminal"], function (require, exports, configuration_1, remoteAuthorityResolver_1, workspace_1, environmentVariableShared_1, configurationResolver_1, editor_1, editorService_1, network_1, label_1, environmentVariable_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteTerminalChannelClient = exports.REMOTE_TERMINAL_CHANNEL_NAME = void 0;
    exports.REMOTE_TERMINAL_CHANNEL_NAME = 'remoteterminal';
    let RemoteTerminalChannelClient = class RemoteTerminalChannelClient {
        get onPtyHostExit() {
            return this._channel.listen("$onPtyHostExitEvent" /* RemoteTerminalChannelEvent.OnPtyHostExitEvent */);
        }
        get onPtyHostStart() {
            return this._channel.listen("$onPtyHostStartEvent" /* RemoteTerminalChannelEvent.OnPtyHostStartEvent */);
        }
        get onPtyHostUnresponsive() {
            return this._channel.listen("$onPtyHostUnresponsiveEvent" /* RemoteTerminalChannelEvent.OnPtyHostUnresponsiveEvent */);
        }
        get onPtyHostResponsive() {
            return this._channel.listen("$onPtyHostResponsiveEvent" /* RemoteTerminalChannelEvent.OnPtyHostResponsiveEvent */);
        }
        get onPtyHostRequestResolveVariables() {
            return this._channel.listen("$onPtyHostRequestResolveVariablesEvent" /* RemoteTerminalChannelEvent.OnPtyHostRequestResolveVariablesEvent */);
        }
        get onProcessData() {
            return this._channel.listen("$onProcessDataEvent" /* RemoteTerminalChannelEvent.OnProcessDataEvent */);
        }
        get onProcessExit() {
            return this._channel.listen("$onProcessExitEvent" /* RemoteTerminalChannelEvent.OnProcessExitEvent */);
        }
        get onProcessReady() {
            return this._channel.listen("$onProcessReadyEvent" /* RemoteTerminalChannelEvent.OnProcessReadyEvent */);
        }
        get onProcessReplay() {
            return this._channel.listen("$onProcessReplayEvent" /* RemoteTerminalChannelEvent.OnProcessReplayEvent */);
        }
        get onProcessOrphanQuestion() {
            return this._channel.listen("$onProcessOrphanQuestion" /* RemoteTerminalChannelEvent.OnProcessOrphanQuestion */);
        }
        get onExecuteCommand() {
            return this._channel.listen("$onExecuteCommand" /* RemoteTerminalChannelEvent.OnExecuteCommand */);
        }
        get onDidRequestDetach() {
            return this._channel.listen("$onDidRequestDetach" /* RemoteTerminalChannelEvent.OnDidRequestDetach */);
        }
        get onDidChangeProperty() {
            return this._channel.listen("$onDidChangeProperty" /* RemoteTerminalChannelEvent.OnDidChangeProperty */);
        }
        constructor(_remoteAuthority, _channel, _configurationService, _workspaceContextService, _resolverService, _environmentVariableService, _remoteAuthorityResolverService, _logService, _editorService, _labelService) {
            this._remoteAuthority = _remoteAuthority;
            this._channel = _channel;
            this._configurationService = _configurationService;
            this._workspaceContextService = _workspaceContextService;
            this._resolverService = _resolverService;
            this._environmentVariableService = _environmentVariableService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._logService = _logService;
            this._editorService = _editorService;
            this._labelService = _labelService;
        }
        restartPtyHost() {
            return this._channel.call("$restartPtyHost" /* RemoteTerminalChannelRequest.RestartPtyHost */, []);
        }
        async createProcess(shellLaunchConfig, configuration, activeWorkspaceRootUri, options, shouldPersistTerminal, cols, rows, unicodeVersion) {
            // Be sure to first wait for the remote configuration
            await this._configurationService.whenRemoteConfigurationLoaded();
            // We will use the resolver service to resolve all the variables in the config / launch config
            // But then we will keep only some variables, since the rest need to be resolved on the remote side
            const resolvedVariables = Object.create(null);
            const lastActiveWorkspace = activeWorkspaceRootUri ? this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) ?? undefined : undefined;
            let allResolvedVariables = undefined;
            try {
                allResolvedVariables = (await this._resolverService.resolveAnyMap(lastActiveWorkspace, {
                    shellLaunchConfig,
                    configuration
                })).resolvedVariables;
            }
            catch (err) {
                this._logService.error(err);
            }
            if (allResolvedVariables) {
                for (const [name, value] of allResolvedVariables.entries()) {
                    if (/^config:/.test(name) || name === 'selectedText' || name === 'lineNumber') {
                        resolvedVariables[name] = value;
                    }
                }
            }
            const envVariableCollections = [];
            for (const [k, v] of this._environmentVariableService.collections.entries()) {
                envVariableCollections.push([k, (0, environmentVariableShared_1.serializeEnvironmentVariableCollection)(v.map), (0, environmentVariableShared_1.serializeEnvironmentDescriptionMap)(v.descriptionMap)]);
            }
            const resolverResult = await this._remoteAuthorityResolverService.resolveAuthority(this._remoteAuthority);
            const resolverEnv = resolverResult.options && resolverResult.options.extensionHostEnv;
            const workspace = this._workspaceContextService.getWorkspace();
            const workspaceFolders = workspace.folders;
            const activeWorkspaceFolder = activeWorkspaceRootUri ? this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) : null;
            const activeFileResource = editor_1.EditorResourceAccessor.getOriginalUri(this._editorService.activeEditor, {
                supportSideBySide: editor_1.SideBySideEditor.PRIMARY,
                filterByScheme: [network_1.Schemas.file, network_1.Schemas.vscodeUserData, network_1.Schemas.vscodeRemote]
            });
            const args = {
                configuration,
                resolvedVariables,
                envVariableCollections,
                shellLaunchConfig,
                workspaceId: workspace.id,
                workspaceName: this._labelService.getWorkspaceLabel(workspace),
                workspaceFolders,
                activeWorkspaceFolder,
                activeFileResource,
                shouldPersistTerminal,
                options,
                cols,
                rows,
                unicodeVersion,
                resolverEnv
            };
            return await this._channel.call("$createProcess" /* RemoteTerminalChannelRequest.CreateProcess */, args);
        }
        requestDetachInstance(workspaceId, instanceId) {
            return this._channel.call("$requestDetachInstance" /* RemoteTerminalChannelRequest.RequestDetachInstance */, [workspaceId, instanceId]);
        }
        acceptDetachInstanceReply(requestId, persistentProcessId) {
            return this._channel.call("$acceptDetachInstanceReply" /* RemoteTerminalChannelRequest.AcceptDetachInstanceReply */, [requestId, persistentProcessId]);
        }
        attachToProcess(id) {
            return this._channel.call("$attachToProcess" /* RemoteTerminalChannelRequest.AttachToProcess */, [id]);
        }
        detachFromProcess(id, forcePersist) {
            return this._channel.call("$detachFromProcess" /* RemoteTerminalChannelRequest.DetachFromProcess */, [id, forcePersist]);
        }
        listProcesses() {
            return this._channel.call("$listProcesses" /* RemoteTerminalChannelRequest.ListProcesses */);
        }
        getLatency() {
            return this._channel.call("$getLatency" /* RemoteTerminalChannelRequest.GetLatency */);
        }
        getPerformanceMarks() {
            return this._channel.call("$getPerformanceMarks" /* RemoteTerminalChannelRequest.GetPerformanceMarks */);
        }
        reduceConnectionGraceTime() {
            return this._channel.call("$reduceConnectionGraceTime" /* RemoteTerminalChannelRequest.ReduceConnectionGraceTime */);
        }
        processBinary(id, data) {
            return this._channel.call("$processBinary" /* RemoteTerminalChannelRequest.ProcessBinary */, [id, data]);
        }
        start(id) {
            return this._channel.call("$start" /* RemoteTerminalChannelRequest.Start */, [id]);
        }
        input(id, data) {
            return this._channel.call("$input" /* RemoteTerminalChannelRequest.Input */, [id, data]);
        }
        acknowledgeDataEvent(id, charCount) {
            return this._channel.call("$acknowledgeDataEvent" /* RemoteTerminalChannelRequest.AcknowledgeDataEvent */, [id, charCount]);
        }
        setUnicodeVersion(id, version) {
            return this._channel.call("$setUnicodeVersion" /* RemoteTerminalChannelRequest.SetUnicodeVersion */, [id, version]);
        }
        shutdown(id, immediate) {
            return this._channel.call("$shutdown" /* RemoteTerminalChannelRequest.Shutdown */, [id, immediate]);
        }
        resize(id, cols, rows) {
            return this._channel.call("$resize" /* RemoteTerminalChannelRequest.Resize */, [id, cols, rows]);
        }
        clearBuffer(id) {
            return this._channel.call("$clearBuffer" /* RemoteTerminalChannelRequest.ClearBuffer */, [id]);
        }
        getInitialCwd(id) {
            return this._channel.call("$getInitialCwd" /* RemoteTerminalChannelRequest.GetInitialCwd */, [id]);
        }
        getCwd(id) {
            return this._channel.call("$getCwd" /* RemoteTerminalChannelRequest.GetCwd */, [id]);
        }
        orphanQuestionReply(id) {
            return this._channel.call("$orphanQuestionReply" /* RemoteTerminalChannelRequest.OrphanQuestionReply */, [id]);
        }
        sendCommandResult(reqId, isError, payload) {
            return this._channel.call("$sendCommandResult" /* RemoteTerminalChannelRequest.SendCommandResult */, [reqId, isError, payload]);
        }
        freePortKillProcess(port) {
            return this._channel.call("$freePortKillProcess" /* RemoteTerminalChannelRequest.FreePortKillProcess */, [port]);
        }
        installAutoReply(match, reply) {
            return this._channel.call("$installAutoReply" /* RemoteTerminalChannelRequest.InstallAutoReply */, [match, reply]);
        }
        uninstallAllAutoReplies() {
            return this._channel.call("$uninstallAllAutoReplies" /* RemoteTerminalChannelRequest.UninstallAllAutoReplies */, []);
        }
        getDefaultSystemShell(osOverride) {
            return this._channel.call("$getDefaultSystemShell" /* RemoteTerminalChannelRequest.GetDefaultSystemShell */, [osOverride]);
        }
        getProfiles(profiles, defaultProfile, includeDetectedProfiles) {
            return this._channel.call("$getProfiles" /* RemoteTerminalChannelRequest.GetProfiles */, [this._workspaceContextService.getWorkspace().id, profiles, defaultProfile, includeDetectedProfiles]);
        }
        acceptPtyHostResolvedVariables(requestId, resolved) {
            return this._channel.call("$acceptPtyHostResolvedVariables" /* RemoteTerminalChannelRequest.AcceptPtyHostResolvedVariables */, [requestId, resolved]);
        }
        getEnvironment() {
            return this._channel.call("$getEnvironment" /* RemoteTerminalChannelRequest.GetEnvironment */);
        }
        getWslPath(original, direction) {
            return this._channel.call("$getWslPath" /* RemoteTerminalChannelRequest.GetWslPath */, [original, direction]);
        }
        setTerminalLayoutInfo(layout) {
            const workspace = this._workspaceContextService.getWorkspace();
            const args = {
                workspaceId: workspace.id,
                tabs: layout ? layout.tabs : []
            };
            return this._channel.call("$setTerminalLayoutInfo" /* RemoteTerminalChannelRequest.SetTerminalLayoutInfo */, args);
        }
        updateTitle(id, title, titleSource) {
            return this._channel.call("$updateTitle" /* RemoteTerminalChannelRequest.UpdateTitle */, [id, title, titleSource]);
        }
        updateIcon(id, userInitiated, icon, color) {
            return this._channel.call("$updateIcon" /* RemoteTerminalChannelRequest.UpdateIcon */, [id, userInitiated, icon, color]);
        }
        refreshProperty(id, property) {
            return this._channel.call("$refreshProperty" /* RemoteTerminalChannelRequest.RefreshProperty */, [id, property]);
        }
        updateProperty(id, property, value) {
            return this._channel.call("$updateProperty" /* RemoteTerminalChannelRequest.UpdateProperty */, [id, property, value]);
        }
        getTerminalLayoutInfo() {
            const workspace = this._workspaceContextService.getWorkspace();
            const args = {
                workspaceId: workspace.id,
            };
            return this._channel.call("$getTerminalLayoutInfo" /* RemoteTerminalChannelRequest.GetTerminalLayoutInfo */, args);
        }
        reviveTerminalProcesses(workspaceId, state, dateTimeFormatLocate) {
            return this._channel.call("$reviveTerminalProcesses" /* RemoteTerminalChannelRequest.ReviveTerminalProcesses */, [workspaceId, state, dateTimeFormatLocate]);
        }
        getRevivedPtyNewId(id) {
            return this._channel.call("$getRevivedPtyNewId" /* RemoteTerminalChannelRequest.GetRevivedPtyNewId */, [id]);
        }
        serializeTerminalState(ids) {
            return this._channel.call("$serializeTerminalState" /* RemoteTerminalChannelRequest.SerializeTerminalState */, [ids]);
        }
    };
    exports.RemoteTerminalChannelClient = RemoteTerminalChannelClient;
    exports.RemoteTerminalChannelClient = RemoteTerminalChannelClient = __decorate([
        __param(2, configuration_1.IWorkbenchConfigurationService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, configurationResolver_1.IConfigurationResolverService),
        __param(5, environmentVariable_1.IEnvironmentVariableService),
        __param(6, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(7, terminal_1.ITerminalLogService),
        __param(8, editorService_1.IEditorService),
        __param(9, label_1.ILabelService)
    ], RemoteTerminalChannelClient);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlVGVybWluYWxDaGFubmVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9jb21tb24vcmVtb3RlL3JlbW90ZVRlcm1pbmFsQ2hhbm5lbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3Qm5GLFFBQUEsNEJBQTRCLEdBQUcsZ0JBQWdCLENBQUM7SUFpQ3RELElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTJCO1FBQ3ZDLElBQUksYUFBYTtZQUNoQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSwyRUFBdUQsQ0FBQztRQUNwRixDQUFDO1FBQ0QsSUFBSSxjQUFjO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLDZFQUFzRCxDQUFDO1FBQ25GLENBQUM7UUFDRCxJQUFJLHFCQUFxQjtZQUN4QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSwyRkFBNkQsQ0FBQztRQUMxRixDQUFDO1FBQ0QsSUFBSSxtQkFBbUI7WUFDdEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sdUZBQTJELENBQUM7UUFDeEYsQ0FBQztRQUNELElBQUksZ0NBQWdDO1lBQ25DLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLGlIQUFpRyxDQUFDO1FBQzlILENBQUM7UUFDRCxJQUFJLGFBQWE7WUFDaEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sMkVBQWtHLENBQUM7UUFDL0gsQ0FBQztRQUNELElBQUksYUFBYTtZQUNoQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSwyRUFBMEYsQ0FBQztRQUN2SCxDQUFDO1FBQ0QsSUFBSSxjQUFjO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFN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