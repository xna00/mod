/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/ipc/electron-sandbox/services", "vs/platform/registry/common/platform", "vs/platform/terminal/common/terminal", "vs/workbench/common/contributions", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/electron-sandbox/terminalNativeContribution", "vs/workbench/contrib/terminal/electron-sandbox/terminalProfileResolverService", "vs/workbench/contrib/terminal/electron-sandbox/localTerminalBackend"], function (require, exports, extensions_1, services_1, platform_1, terminal_1, contributions_1, terminal_2, terminalNativeContribution_1, terminalProfileResolverService_1, localTerminalBackend_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register services
    (0, services_1.registerMainProcessRemoteService)(terminal_1.ILocalPtyService, terminal_1.TerminalIpcChannels.LocalPty);
    (0, extensions_1.registerSingleton)(terminal_2.ITerminalProfileResolverService, terminalProfileResolverService_1.ElectronTerminalProfileResolverService, 1 /* InstantiationType.Delayed */);
    // Register workbench contributions
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    // This contribution needs to be active during the Startup phase to be available when a remote resolver tries to open a local
    // terminal while connecting to the remote.
    (0, contributions_1.registerWorkbenchContribution2)(localTerminalBackend_1.LocalTerminalBackendContribution.ID, localTerminalBackend_1.LocalTerminalBackendContribution, 1 /* WorkbenchPhase.BlockStartup */);
    workbenchRegistry.registerWorkbenchContribution(terminalNativeContribution_1.TerminalNativeContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9lbGVjdHJvbi1zYW5kYm94L3Rlcm1pbmFsLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxvQkFBb0I7SUFDcEIsSUFBQSwyQ0FBZ0MsRUFBQywyQkFBZ0IsRUFBRSw4QkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNqRixJQUFBLDhCQUFpQixFQUFDLDBDQUErQixFQUFFLHVFQUFzQyxvQ0FBNEIsQ0FBQztJQUV0SCxtQ0FBbUM7SUFDbkMsTUFBTSxpQkFBaUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFdEcsNkhBQTZIO0lBQzdILDJDQUEyQztJQUMzQyxJQUFBLDhDQUE4QixFQUFDLHVEQUFnQyxDQUFDLEVBQUUsRUFBRSx1REFBZ0Msc0NBQThCLENBQUM7SUFDbkksaUJBQWlCLENBQUMsNkJBQTZCLENBQUMsdURBQTBCLGtDQUEwQixDQUFDIn0=