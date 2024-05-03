/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/nls"], function (require, exports, event_1, lifecycle_1, network_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseTerminalBackend = void 0;
    class BaseTerminalBackend extends lifecycle_1.Disposable {
        get isResponsive() { return !this._isPtyHostUnresponsive; }
        constructor(_ptyHostController, _logService, historyService, configurationResolverService, statusBarService, _workspaceContextService) {
            super();
            this._ptyHostController = _ptyHostController;
            this._logService = _logService;
            this._workspaceContextService = _workspaceContextService;
            this._isPtyHostUnresponsive = false;
            this._onPtyHostConnected = this._register(new event_1.Emitter());
            this.onPtyHostConnected = this._onPtyHostConnected.event;
            this._onPtyHostRestart = this._register(new event_1.Emitter());
            this.onPtyHostRestart = this._onPtyHostRestart.event;
            this._onPtyHostUnresponsive = this._register(new event_1.Emitter());
            this.onPtyHostUnresponsive = this._onPtyHostUnresponsive.event;
            this._onPtyHostResponsive = this._register(new event_1.Emitter());
            this.onPtyHostResponsive = this._onPtyHostResponsive.event;
            let unresponsiveStatusBarEntry;
            let statusBarAccessor;
            let hasStarted = false;
            // Attach pty host listeners
            this._register(this._ptyHostController.onPtyHostExit(() => {
                this._logService.error(`The terminal's pty host process exited, the connection to all terminal processes was lost`);
            }));
            this._register(this.onPtyHostConnected(() => hasStarted = true));
            this._register(this._ptyHostController.onPtyHostStart(() => {
                this._logService.debug(`The terminal's pty host process is starting`);
                // Only fire the _restart_ event after it has started
                if (hasStarted) {
                    this._logService.trace('IPtyHostController#onPtyHostRestart');
                    this._onPtyHostRestart.fire();
                }
                statusBarAccessor?.dispose();
                this._isPtyHostUnresponsive = false;
            }));
            this._register(this._ptyHostController.onPtyHostUnresponsive(() => {
                statusBarAccessor?.dispose();
                if (!unresponsiveStatusBarEntry) {
                    unresponsiveStatusBarEntry = {
                        name: (0, nls_1.localize)('ptyHostStatus', 'Pty Host Status'),
                        text: `$(debug-disconnect) ${(0, nls_1.localize)('ptyHostStatus.short', 'Pty Host')}`,
                        tooltip: (0, nls_1.localize)('nonResponsivePtyHost', "The connection to the terminal's pty host process is unresponsive, terminals may stop working. Click to manually restart the pty host."),
                        ariaLabel: (0, nls_1.localize)('ptyHostStatus.ariaLabel', 'Pty Host is unresponsive'),
                        command: "workbench.action.terminal.restartPtyHost" /* TerminalCommandId.RestartPtyHost */,
                        kind: 'warning'
                    };
                }
                statusBarAccessor = statusBarService.addEntry(unresponsiveStatusBarEntry, 'ptyHostStatus', 0 /* StatusbarAlignment.LEFT */);
                this._isPtyHostUnresponsive = true;
                this._onPtyHostUnresponsive.fire();
            }));
            this._register(this._ptyHostController.onPtyHostResponsive(() => {
                if (!this._isPtyHostUnresponsive) {
                    return;
                }
                this._logService.info('The pty host became responsive again');
                statusBarAccessor?.dispose();
                this._isPtyHostUnresponsive = false;
                this._onPtyHostResponsive.fire();
            }));
            this._register(this._ptyHostController.onPtyHostRequestResolveVariables(async (e) => {
                // Only answer requests for this workspace
                if (e.workspaceId !== this._workspaceContextService.getWorkspace().id) {
                    return;
                }
                const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
                const lastActiveWorkspaceRoot = activeWorkspaceRootUri ? this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) ?? undefined : undefined;
                const resolveCalls = e.originalText.map(t => {
                    return configurationResolverService.resolveAsync(lastActiveWorkspaceRoot, t);
                });
                const result = await Promise.all(resolveCalls);
                this._ptyHostController.acceptPtyHostResolvedVariables(e.requestId, result);
            }));
        }
        restartPtyHost() {
            this._ptyHostController.restartPtyHost();
        }
        _deserializeTerminalState(serializedState) {
            if (serializedState === undefined) {
                return undefined;
            }
            const parsedUnknown = JSON.parse(serializedState);
            if (!('version' in parsedUnknown) || !('state' in parsedUnknown) || !Array.isArray(parsedUnknown.state)) {
                this._logService.warn('Could not revive serialized processes, wrong format', parsedUnknown);
                return undefined;
            }
            const parsedCrossVersion = parsedUnknown;
            if (parsedCrossVersion.version !== 1) {
                this._logService.warn(`Could not revive serialized processes, wrong version "${parsedCrossVersion.version}"`, parsedCrossVersion);
                return undefined;
            }
            return parsedCrossVersion.state;
        }
        _getWorkspaceId() {
            return this._workspaceContextService.getWorkspace().id;
        }
    }
    exports.BaseTerminalBackend = BaseTerminalBackend;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZVRlcm1pbmFsQmFja2VuZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci9iYXNlVGVybWluYWxCYWNrZW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFzQixtQkFBb0IsU0FBUSxzQkFBVTtRQUczRCxJQUFJLFlBQVksS0FBYyxPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztRQVdwRSxZQUNrQixrQkFBc0MsRUFDcEMsV0FBZ0MsRUFDbkQsY0FBK0IsRUFDL0IsNEJBQTJELEVBQzNELGdCQUFtQyxFQUNoQix3QkFBa0Q7WUFFckUsS0FBSyxFQUFFLENBQUM7WUFQUyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ3BDLGdCQUFXLEdBQVgsV0FBVyxDQUFxQjtZQUloQyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBbkI5RCwyQkFBc0IsR0FBWSxLQUFLLENBQUM7WUFJN0Isd0JBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDcEUsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQztZQUMxQyxzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNsRSxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1lBQ3RDLDJCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3ZFLDBCQUFxQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7WUFDaEQseUJBQW9C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