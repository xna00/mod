/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteTerminalChannelRequest = exports.RemoteTerminalChannelEvent = exports.REMOTE_TERMINAL_CHANNEL_NAME = void 0;
    exports.REMOTE_TERMINAL_CHANNEL_NAME = 'remoteterminal';
    var RemoteTerminalChannelEvent;
    (function (RemoteTerminalChannelEvent) {
        RemoteTerminalChannelEvent["OnPtyHostExitEvent"] = "$onPtyHostExitEvent";
        RemoteTerminalChannelEvent["OnPtyHostStartEvent"] = "$onPtyHostStartEvent";
        RemoteTerminalChannelEvent["OnPtyHostUnresponsiveEvent"] = "$onPtyHostUnresponsiveEvent";
        RemoteTerminalChannelEvent["OnPtyHostResponsiveEvent"] = "$onPtyHostResponsiveEvent";
        RemoteTerminalChannelEvent["OnPtyHostRequestResolveVariablesEvent"] = "$onPtyHostRequestResolveVariablesEvent";
        RemoteTerminalChannelEvent["OnProcessDataEvent"] = "$onProcessDataEvent";
        RemoteTerminalChannelEvent["OnProcessReadyEvent"] = "$onProcessReadyEvent";
        RemoteTerminalChannelEvent["OnProcessExitEvent"] = "$onProcessExitEvent";
        RemoteTerminalChannelEvent["OnProcessReplayEvent"] = "$onProcessReplayEvent";
        RemoteTerminalChannelEvent["OnProcessOrphanQuestion"] = "$onProcessOrphanQuestion";
        RemoteTerminalChannelEvent["OnExecuteCommand"] = "$onExecuteCommand";
        RemoteTerminalChannelEvent["OnDidRequestDetach"] = "$onDidRequestDetach";
        RemoteTerminalChannelEvent["OnDidChangeProperty"] = "$onDidChangeProperty";
    })(RemoteTerminalChannelEvent || (exports.RemoteTerminalChannelEvent = RemoteTerminalChannelEvent = {}));
    var RemoteTerminalChannelRequest;
    (function (RemoteTerminalChannelRequest) {
        RemoteTerminalChannelRequest["RestartPtyHost"] = "$restartPtyHost";
        RemoteTerminalChannelRequest["CreateProcess"] = "$createProcess";
        RemoteTerminalChannelRequest["AttachToProcess"] = "$attachToProcess";
        RemoteTerminalChannelRequest["DetachFromProcess"] = "$detachFromProcess";
        RemoteTerminalChannelRequest["ListProcesses"] = "$listProcesses";
        RemoteTerminalChannelRequest["GetLatency"] = "$getLatency";
        RemoteTerminalChannelRequest["GetPerformanceMarks"] = "$getPerformanceMarks";
        RemoteTerminalChannelRequest["OrphanQuestionReply"] = "$orphanQuestionReply";
        RemoteTerminalChannelRequest["AcceptPtyHostResolvedVariables"] = "$acceptPtyHostResolvedVariables";
        RemoteTerminalChannelRequest["Start"] = "$start";
        RemoteTerminalChannelRequest["Input"] = "$input";
        RemoteTerminalChannelRequest["AcknowledgeDataEvent"] = "$acknowledgeDataEvent";
        RemoteTerminalChannelRequest["Shutdown"] = "$shutdown";
        RemoteTerminalChannelRequest["Resize"] = "$resize";
        RemoteTerminalChannelRequest["ClearBuffer"] = "$clearBuffer";
        RemoteTerminalChannelRequest["GetInitialCwd"] = "$getInitialCwd";
        RemoteTerminalChannelRequest["GetCwd"] = "$getCwd";
        RemoteTerminalChannelRequest["ProcessBinary"] = "$processBinary";
        RemoteTerminalChannelRequest["SendCommandResult"] = "$sendCommandResult";
        RemoteTerminalChannelRequest["InstallAutoReply"] = "$installAutoReply";
        RemoteTerminalChannelRequest["UninstallAllAutoReplies"] = "$uninstallAllAutoReplies";
        RemoteTerminalChannelRequest["GetDefaultSystemShell"] = "$getDefaultSystemShell";
        RemoteTerminalChannelRequest["GetProfiles"] = "$getProfiles";
        RemoteTerminalChannelRequest["GetEnvironment"] = "$getEnvironment";
        RemoteTerminalChannelRequest["GetWslPath"] = "$getWslPath";
        RemoteTerminalChannelRequest["GetTerminalLayoutInfo"] = "$getTerminalLayoutInfo";
        RemoteTerminalChannelRequest["SetTerminalLayoutInfo"] = "$setTerminalLayoutInfo";
        RemoteTerminalChannelRequest["SerializeTerminalState"] = "$serializeTerminalState";
        RemoteTerminalChannelRequest["ReviveTerminalProcesses"] = "$reviveTerminalProcesses";
        RemoteTerminalChannelRequest["GetRevivedPtyNewId"] = "$getRevivedPtyNewId";
        RemoteTerminalChannelRequest["SetUnicodeVersion"] = "$setUnicodeVersion";
        RemoteTerminalChannelRequest["ReduceConnectionGraceTime"] = "$reduceConnectionGraceTime";
        RemoteTerminalChannelRequest["UpdateIcon"] = "$updateIcon";
        RemoteTerminalChannelRequest["UpdateTitle"] = "$updateTitle";
        RemoteTerminalChannelRequest["UpdateProperty"] = "$updateProperty";
        RemoteTerminalChannelRequest["RefreshProperty"] = "$refreshProperty";
        RemoteTerminalChannelRequest["RequestDetachInstance"] = "$requestDetachInstance";
        RemoteTerminalChannelRequest["AcceptDetachInstanceReply"] = "$acceptDetachInstanceReply";
        RemoteTerminalChannelRequest["AcceptDetachedInstance"] = "$acceptDetachedInstance";
        RemoteTerminalChannelRequest["FreePortKillProcess"] = "$freePortKillProcess";
    })(RemoteTerminalChannelRequest || (exports.RemoteTerminalChannelRequest = RemoteTerminalChannelRequest = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2NvbW1vbi9yZW1vdGUvdGVybWluYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT25GLFFBQUEsNEJBQTRCLEdBQUcsZ0JBQWdCLENBQUM7SUFpQzdELElBQWtCLDBCQWNqQjtJQWRELFdBQWtCLDBCQUEwQjtRQUMzQyx3RUFBMEMsQ0FBQTtRQUMxQywwRUFBNEMsQ0FBQTtRQUM1Qyx3RkFBMEQsQ0FBQTtRQUMxRCxvRkFBc0QsQ0FBQTtRQUN0RCw4R0FBZ0YsQ0FBQTtRQUNoRix3RUFBMEMsQ0FBQTtRQUMxQywwRUFBNEMsQ0FBQTtRQUM1Qyx3RUFBMEMsQ0FBQTtRQUMxQyw0RUFBOEMsQ0FBQTtRQUM5QyxrRkFBb0QsQ0FBQTtRQUNwRCxvRUFBc0MsQ0FBQTtRQUN0Qyx3RUFBMEMsQ0FBQTtRQUMxQywwRUFBNEMsQ0FBQTtJQUM3QyxDQUFDLEVBZGlCLDBCQUEwQiwwQ0FBMUIsMEJBQTBCLFFBYzNDO0lBRUQsSUFBa0IsNEJBeUNqQjtJQXpDRCxXQUFrQiw0QkFBNEI7UUFDN0Msa0VBQWtDLENBQUE7UUFDbEMsZ0VBQWdDLENBQUE7UUFDaEMsb0VBQW9DLENBQUE7UUFDcEMsd0VBQXdDLENBQUE7UUFDeEMsZ0VBQWdDLENBQUE7UUFDaEMsMERBQTBCLENBQUE7UUFDMUIsNEVBQTRDLENBQUE7UUFDNUMsNEVBQTRDLENBQUE7UUFDNUMsa0dBQWtFLENBQUE7UUFDbEUsZ0RBQWdCLENBQUE7UUFDaEIsZ0RBQWdCLENBQUE7UUFDaEIsOEVBQThDLENBQUE7UUFDOUMsc0RBQXNCLENBQUE7UUFDdEIsa0RBQWtCLENBQUE7UUFDbEIsNERBQTRCLENBQUE7UUFDNUIsZ0VBQWdDLENBQUE7UUFDaEMsa0RBQWtCLENBQUE7UUFDbEIsZ0VBQWdDLENBQUE7UUFDaEMsd0VBQXdDLENBQUE7UUFDeEMsc0VBQXNDLENBQUE7UUFDdEMsb0ZBQW9ELENBQUE7UUFDcEQsZ0ZBQWdELENBQUE7UUFDaEQsNERBQTRCLENBQUE7UUFDNUIsa0VBQWtDLENBQUE7UUFDbEMsMERBQTBCLENBQUE7UUFDMUIsZ0ZBQWdELENBQUE7UUFDaEQsZ0ZBQWdELENBQUE7UUFDaEQsa0ZBQWtELENBQUE7UUFDbEQsb0ZBQW9ELENBQUE7UUFDcEQsMEVBQTBDLENBQUE7UUFDMUMsd0VBQXdDLENBQUE7UUFDeEMsd0ZBQXdELENBQUE7UUFDeEQsMERBQTBCLENBQUE7UUFDMUIsNERBQTRCLENBQUE7UUFDNUIsa0VBQWtDLENBQUE7UUFDbEMsb0VBQW9DLENBQUE7UUFDcEMsZ0ZBQWdELENBQUE7UUFDaEQsd0ZBQXdELENBQUE7UUFDeEQsa0ZBQWtELENBQUE7UUFDbEQsNEVBQTRDLENBQUE7SUFDN0MsQ0FBQyxFQXpDaUIsNEJBQTRCLDRDQUE1Qiw0QkFBNEIsUUF5QzdDIn0=