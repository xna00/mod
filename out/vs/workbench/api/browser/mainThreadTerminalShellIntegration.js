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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, event_1, lifecycle_1, extHost_protocol_1, terminal_1, environmentService_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTerminalShellIntegration = void 0;
    let MainThreadTerminalShellIntegration = class MainThreadTerminalShellIntegration extends lifecycle_1.Disposable {
        constructor(extHostContext, _terminalService, workbenchEnvironmentService) {
            super();
            this._terminalService = _terminalService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTerminalShellIntegration);
            // onDidChangeTerminalShellIntegration
            const onDidAddCommandDetection = this._terminalService.createOnInstanceEvent(instance => {
                return event_1.Event.map(event_1.Event.filter(instance.capabilities.onDidAddCapabilityType, e => {
                    return e === 2 /* TerminalCapability.CommandDetection */;
                }, this._store), () => instance);
            });
            this._store.add(onDidAddCommandDetection(e => this._proxy.$shellIntegrationChange(e.instanceId)));
            // onDidStartTerminalShellExecution
            const commandDetectionStartEvent = this._store.add(this._terminalService.createOnInstanceCapabilityEvent(2 /* TerminalCapability.CommandDetection */, e => e.onCommandExecuted));
            let currentCommand;
            this._store.add(commandDetectionStartEvent.event(e => {
                // Prevent duplicate events from being sent in case command detection double fires the
                // event
                if (e.data === currentCommand) {
                    return;
                }
                currentCommand = e.data;
                this._proxy.$shellExecutionStart(e.instance.instanceId, e.data.command, e.data.cwd);
            }));
            // onDidEndTerminalShellExecution
            const commandDetectionEndEvent = this._store.add(this._terminalService.createOnInstanceCapabilityEvent(2 /* TerminalCapability.CommandDetection */, e => e.onCommandFinished));
            this._store.add(commandDetectionEndEvent.event(e => {
                currentCommand = undefined;
                this._proxy.$shellExecutionEnd(e.instance.instanceId, e.data.command, e.data.exitCode);
            }));
            // onDidChangeTerminalShellIntegration via cwd
            const cwdChangeEvent = this._store.add(this._terminalService.createOnInstanceCapabilityEvent(0 /* TerminalCapability.CwdDetection */, e => e.onDidChangeCwd));
            this._store.add(cwdChangeEvent.event(e => this._proxy.$cwdChange(e.instance.instanceId, e.data)));
            // Clean up after dispose
            this._store.add(this._terminalService.onDidDisposeInstance(e => this._proxy.$closeTerminal(e.instanceId)));
            // TerminalShellExecution.createDataStream
            // TODO: Support this on remote; it should go via the server
            if (!workbenchEnvironmentService.remoteAuthority) {
                this._store.add(this._terminalService.onAnyInstanceData(e => this._proxy.$shellExecutionData(e.instance.instanceId, e.data)));
            }
        }
        $executeCommand(terminalId, commandLine) {
            this._terminalService.getInstanceFromId(terminalId)?.runCommand(commandLine, true);
        }
    };
    exports.MainThreadTerminalShellIntegration = MainThreadTerminalShellIntegration;
    exports.MainThreadTerminalShellIntegration = MainThreadTerminalShellIntegration = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTerminalShellIntegration),
        __param(1, terminal_1.ITerminalService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService)
    ], MainThreadTerminalShellIntegration);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRlcm1pbmFsU2hlbGxJbnRlZ3JhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRUZXJtaW5hbFNoZWxsSW50ZWdyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV3pGLElBQU0sa0NBQWtDLEdBQXhDLE1BQU0sa0NBQW1DLFNBQVEsc0JBQVU7UUFHakUsWUFDQyxjQUErQixFQUNJLGdCQUFrQyxFQUN2QywyQkFBeUQ7WUFFdkYsS0FBSyxFQUFFLENBQUM7WUFIMkIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUtyRSxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1lBRXRGLHNDQUFzQztZQUN0QyxNQUFNLHdCQUF3QixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDdkYsT0FBTyxhQUFLLENBQUMsR0FBRyxDQUNmLGFBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDOUQsT0FBTyxDQUFDLGdEQUF3QyxDQUFDO2dCQUNsRCxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FDL0IsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbEcsbUNBQW1DO1lBQ25DLE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLCtCQUErQiw4Q0FBc0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBQ3pLLElBQUksY0FBNEMsQ0FBQztZQUNqRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3BELHNGQUFzRjtnQkFDdEYsUUFBUTtnQkFDUixJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssY0FBYyxFQUFFLENBQUM7b0JBQy9CLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxjQUFjLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixpQ0FBaUM7WUFDakMsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsK0JBQStCLDhDQUFzQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDdkssSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNsRCxjQUFjLEdBQUcsU0FBUyxDQUFDO2dCQUMzQixJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDeEYsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLDhDQUE4QztZQUM5QyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsK0JBQStCLDBDQUFrQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQ3RKLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWxHLHlCQUF5QjtZQUN6QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTNHLDBDQUEwQztZQUMxQyw0REFBNEQ7WUFDNUQsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUNsRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0gsQ0FBQztRQUNGLENBQUM7UUFFRCxlQUFlLENBQUMsVUFBa0IsRUFBRSxXQUFtQjtZQUN0RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLEVBQUUsVUFBVSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNwRixDQUFDO0tBQ0QsQ0FBQTtJQTNEWSxnRkFBa0M7aURBQWxDLGtDQUFrQztRQUQ5QyxJQUFBLHVDQUFvQixFQUFDLDhCQUFXLENBQUMsa0NBQWtDLENBQUM7UUFNbEUsV0FBQSwyQkFBZ0IsQ0FBQTtRQUNoQixXQUFBLGlEQUE0QixDQUFBO09BTmxCLGtDQUFrQyxDQTJEOUMifQ==