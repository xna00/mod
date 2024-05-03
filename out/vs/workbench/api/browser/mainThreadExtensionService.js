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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/cancellation", "vs/base/common/network", "vs/base/common/severity", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/notification/common/notification", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/host/browser/host", "vs/workbench/services/timer/browser/timerService"], function (require, exports, actions_1, cancellation_1, network_1, severity_1, uri_1, nls_1, commands_1, extensionManagementUtil_1, notification_1, remoteAuthorityResolver_1, extHost_protocol_1, extensions_1, environmentService_1, extensionManagement_1, extensions_2, extHostCustomers_1, host_1, timerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadExtensionService = void 0;
    let MainThreadExtensionService = class MainThreadExtensionService {
        constructor(extHostContext, _extensionService, _notificationService, _extensionsWorkbenchService, _hostService, _extensionEnablementService, _timerService, _commandService, _environmentService) {
            this._extensionService = _extensionService;
            this._notificationService = _notificationService;
            this._extensionsWorkbenchService = _extensionsWorkbenchService;
            this._hostService = _hostService;
            this._extensionEnablementService = _extensionEnablementService;
            this._timerService = _timerService;
            this._commandService = _commandService;
            this._environmentService = _environmentService;
            this._extensionHostKind = extHostContext.extensionHostKind;
            const internalExtHostContext = extHostContext;
            this._internalExtensionService = internalExtHostContext.internalExtensionService;
            internalExtHostContext._setExtensionHostProxy(new ExtensionHostProxy(extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostExtensionService)));
            internalExtHostContext._setAllMainProxyIdentifiers(Object.keys(extHost_protocol_1.MainContext).map((key) => extHost_protocol_1.MainContext[key]));
        }
        dispose() {
        }
        $getExtension(extensionId) {
            return this._extensionService.getExtension(extensionId);
        }
        $activateExtension(extensionId, reason) {
            return this._internalExtensionService._activateById(extensionId, reason);
        }
        async $onWillActivateExtension(extensionId) {
            this._internalExtensionService._onWillActivateExtension(extensionId);
        }
        $onDidActivateExtension(extensionId, codeLoadingTime, activateCallTime, activateResolvedTime, activationReason) {
            this._internalExtensionService._onDidActivateExtension(extensionId, codeLoadingTime, activateCallTime, activateResolvedTime, activationReason);
        }
        $onExtensionRuntimeError(extensionId, data) {
            const error = new Error();
            error.name = data.name;
            error.message = data.message;
            error.stack = data.stack;
            this._internalExtensionService._onExtensionRuntimeError(extensionId, error);
            console.error(`[${extensionId.value}]${error.message}`);
            console.error(error.stack);
        }
        async $onExtensionActivationError(extensionId, data, missingExtensionDependency) {
            const error = new Error();
            error.name = data.name;
            error.message = data.message;
            error.stack = data.stack;
            this._internalExtensionService._onDidActivateExtensionError(extensionId, error);
            if (missingExtensionDependency) {
                const extension = await this._extensionService.getExtension(extensionId.value);
                if (extension) {
                    const local = await this._extensionsWorkbenchService.queryLocal();
                    const installedDependency = local.find(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, { id: missingExtensionDependency.dependency }));
                    if (installedDependency?.local) {
                        await this._handleMissingInstalledDependency(extension, installedDependency.local);
                        return;
                    }
                    else {
                        await this._handleMissingNotInstalledDependency(extension, missingExtensionDependency.dependency);
                        return;
                    }
                }
            }
            const isDev = !this._environmentService.isBuilt || this._environmentService.isExtensionDevelopment;
            if (isDev) {
                this._notificationService.error(error);
                return;
            }
            console.error(error.message);
        }
        async _handleMissingInstalledDependency(extension, missingInstalledDependency) {
            const extName = extension.displayName || extension.name;
            if (this._extensionEnablementService.isEnabled(missingInstalledDependency)) {
                this._notificationService.notify({
                    severity: severity_1.default.Error,
                    message: (0, nls_1.localize)('reload window', "Cannot activate the '{0}' extension because it depends on the '{1}' extension, which is not loaded. Would you like to reload the window to load the extension?", extName, missingInstalledDependency.manifest.displayName || missingInstalledDependency.manifest.name),
                    actions: {
                        primary: [new actions_1.Action('reload', (0, nls_1.localize)('reload', "Reload Window"), '', true, () => this._hostService.reload())]
                    }
                });
            }
            else {
                const enablementState = this._extensionEnablementService.getEnablementState(missingInstalledDependency);
                if (enablementState === 4 /* EnablementState.DisabledByVirtualWorkspace */) {
                    this._notificationService.notify({
                        severity: severity_1.default.Error,
                        message: (0, nls_1.localize)('notSupportedInWorkspace', "Cannot activate the '{0}' extension because it depends on the '{1}' extension which is not supported in the current workspace", extName, missingInstalledDependency.manifest.displayName || missingInstalledDependency.manifest.name),
                    });
                }
                else if (enablementState === 0 /* EnablementState.DisabledByTrustRequirement */) {
                    this._notificationService.notify({
                        severity: severity_1.default.Error,
                        message: (0, nls_1.localize)('restrictedMode', "Cannot activate the '{0}' extension because it depends on the '{1}' extension which is not supported in Restricted Mode", extName, missingInstalledDependency.manifest.displayName || missingInstalledDependency.manifest.name),
                        actions: {
                            primary: [new actions_1.Action('manageWorkspaceTrust', (0, nls_1.localize)('manageWorkspaceTrust', "Manage Workspace Trust"), '', true, () => this._commandService.executeCommand('workbench.trust.manage'))]
                        }
                    });
                }
                else if (this._extensionEnablementService.canChangeEnablement(missingInstalledDependency)) {
                    this._notificationService.notify({
                        severity: severity_1.default.Error,
                        message: (0, nls_1.localize)('disabledDep', "Cannot activate the '{0}' extension because it depends on the '{1}' extension which is disabled. Would you like to enable the extension and reload the window?", extName, missingInstalledDependency.manifest.displayName || missingInstalledDependency.manifest.name),
                        actions: {
                            primary: [new actions_1.Action('enable', (0, nls_1.localize)('enable dep', "Enable and Reload"), '', true, () => this._extensionEnablementService.setEnablement([missingInstalledDependency], enablementState === 6 /* EnablementState.DisabledGlobally */ ? 8 /* EnablementState.EnabledGlobally */ : 9 /* EnablementState.EnabledWorkspace */)
                                    .then(() => this._hostService.reload(), e => this._notificationService.error(e)))]
                        }
                    });
                }
                else {
                    this._notificationService.notify({
                        severity: severity_1.default.Error,
                        message: (0, nls_1.localize)('disabledDepNoAction', "Cannot activate the '{0}' extension because it depends on the '{1}' extension which is disabled.", extName, missingInstalledDependency.manifest.displayName || missingInstalledDependency.manifest.name),
                    });
                }
            }
        }
        async _handleMissingNotInstalledDependency(extension, missingDependency) {
            const extName = extension.displayName || extension.name;
            let dependencyExtension = null;
            try {
                dependencyExtension = (await this._extensionsWorkbenchService.getExtensions([{ id: missingDependency }], cancellation_1.CancellationToken.None))[0];
            }
            catch (err) {
            }
            if (dependencyExtension) {
                this._notificationService.notify({
                    severity: severity_1.default.Error,
                    message: (0, nls_1.localize)('uninstalledDep', "Cannot activate the '{0}' extension because it depends on the '{1}' extension from '{2}', which is not installed. Would you like to install the extension and reload the window?", extName, dependencyExtension.displayName, dependencyExtension.publisherDisplayName),
                    actions: {
                        primary: [new actions_1.Action('install', (0, nls_1.localize)('install missing dep', "Install and Reload"), '', true, () => this._extensionsWorkbenchService.install(dependencyExtension)
                                .then(() => this._hostService.reload(), e => this._notificationService.error(e)))]
                    }
                });
            }
            else {
                this._notificationService.error((0, nls_1.localize)('unknownDep', "Cannot activate the '{0}' extension because it depends on an unknown '{1}' extension.", extName, missingDependency));
            }
        }
        async $setPerformanceMarks(marks) {
            if (this._extensionHostKind === 1 /* ExtensionHostKind.LocalProcess */) {
                this._timerService.setPerformanceMarks('localExtHost', marks);
            }
            else if (this._extensionHostKind === 2 /* ExtensionHostKind.LocalWebWorker */) {
                this._timerService.setPerformanceMarks('workerExtHost', marks);
            }
            else {
                this._timerService.setPerformanceMarks('remoteExtHost', marks);
            }
        }
        async $asBrowserUri(uri) {
            return network_1.FileAccess.uriToBrowserUri(uri_1.URI.revive(uri));
        }
    };
    exports.MainThreadExtensionService = MainThreadExtensionService;
    exports.MainThreadExtensionService = MainThreadExtensionService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadExtensionService),
        __param(1, extensions_2.IExtensionService),
        __param(2, notification_1.INotificationService),
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, host_1.IHostService),
        __param(5, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(6, timerService_1.ITimerService),
        __param(7, commands_1.ICommandService),
        __param(8, environmentService_1.IWorkbenchEnvironmentService)
    ], MainThreadExtensionService);
    class ExtensionHostProxy {
        constructor(_actual) {
            this._actual = _actual;
        }
        async resolveAuthority(remoteAuthority, resolveAttempt) {
            const resolved = reviveResolveAuthorityResult(await this._actual.$resolveAuthority(remoteAuthority, resolveAttempt));
            return resolved;
        }
        async getCanonicalURI(remoteAuthority, uri) {
            const uriComponents = await this._actual.$getCanonicalURI(remoteAuthority, uri);
            return (uriComponents ? uri_1.URI.revive(uriComponents) : uriComponents);
        }
        startExtensionHost(extensionsDelta) {
            return this._actual.$startExtensionHost(extensionsDelta);
        }
        extensionTestsExecute() {
            return this._actual.$extensionTestsExecute();
        }
        activateByEvent(activationEvent, activationKind) {
            return this._actual.$activateByEvent(activationEvent, activationKind);
        }
        activate(extensionId, reason) {
            return this._actual.$activate(extensionId, reason);
        }
        setRemoteEnvironment(env) {
            return this._actual.$setRemoteEnvironment(env);
        }
        updateRemoteConnectionData(connectionData) {
            return this._actual.$updateRemoteConnectionData(connectionData);
        }
        deltaExtensions(extensionsDelta) {
            return this._actual.$deltaExtensions(extensionsDelta);
        }
        test_latency(n) {
            return this._actual.$test_latency(n);
        }
        test_up(b) {
            return this._actual.$test_up(b);
        }
        test_down(size) {
            return this._actual.$test_down(size);
        }
    }
    function reviveResolveAuthorityResult(result) {
        if (result.type === 'ok') {
            return {
                type: 'ok',
                value: {
                    ...result.value,
                    authority: reviveResolvedAuthority(result.value.authority),
                }
            };
        }
        else {
            return result;
        }
    }
    function reviveResolvedAuthority(resolvedAuthority) {
        return {
            ...resolvedAuthority,
            connectTo: reviveConnection(resolvedAuthority.connectTo),
        };
    }
    function reviveConnection(connection) {
        if (connection.type === 0 /* RemoteConnectionType.WebSocket */) {
            return new remoteAuthorityResolver_1.WebSocketRemoteConnection(connection.host, connection.port);
        }
        return new remoteAuthorityResolver_1.ManagedRemoteConnection(connection.id);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEV4dGVuc2lvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkRXh0ZW5zaW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE4QnpGLElBQU0sMEJBQTBCLEdBQWhDLE1BQU0sMEJBQTBCO1FBS3RDLFlBQ0MsY0FBK0IsRUFDSyxpQkFBb0MsRUFDakMsb0JBQTBDLEVBQ25DLDJCQUF3RCxFQUN2RSxZQUEwQixFQUNGLDJCQUFpRSxFQUN4RixhQUE0QixFQUMxQixlQUFnQyxFQUNqQixtQkFBaUQ7WUFQOUQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNqQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQ25DLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFDdkUsaUJBQVksR0FBWixZQUFZLENBQWM7WUFDRixnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQXNDO1lBQ3hGLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQzFCLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNqQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQThCO1lBRWxHLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxjQUFjLENBQUMsaUJBQWlCLENBQUM7WUFFM0QsTUFBTSxzQkFBc0IsR0FBNkIsY0FBZSxDQUFDO1lBQ3pFLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxzQkFBc0IsQ0FBQyx3QkFBd0IsQ0FBQztZQUNqRixzQkFBc0IsQ0FBQyxzQkFBc0IsQ0FDNUMsSUFBSSxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUN2RixDQUFDO1lBQ0Ysc0JBQXNCLENBQUMsMkJBQTJCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyw4QkFBVyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBTyw4QkFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwSCxDQUFDO1FBRU0sT0FBTztRQUNkLENBQUM7UUFFRCxhQUFhLENBQUMsV0FBbUI7WUFDaEMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFDRCxrQkFBa0IsQ0FBQyxXQUFnQyxFQUFFLE1BQWlDO1lBQ3JGLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUNELEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxXQUFnQztZQUM5RCxJQUFJLENBQUMseUJBQXlCLENBQUMsd0JBQXdCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUNELHVCQUF1QixDQUFDLFdBQWdDLEVBQUUsZUFBdUIsRUFBRSxnQkFBd0IsRUFBRSxvQkFBNEIsRUFBRSxnQkFBMkM7WUFDckwsSUFBSSxDQUFDLHlCQUF5QixDQUFDLHVCQUF1QixDQUFDLFdBQVcsRUFBRSxlQUFlLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUNoSixDQUFDO1FBQ0Qsd0JBQXdCLENBQUMsV0FBZ0MsRUFBRSxJQUFxQjtZQUMvRSxNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQzFCLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztZQUN2QixLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDN0IsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3pCLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyx3QkFBd0IsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLFdBQVcsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDeEQsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUNELEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxXQUFnQyxFQUFFLElBQXFCLEVBQUUsMEJBQTZEO1lBQ3ZKLE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7WUFDMUIsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ3ZCLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUM3QixLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFFekIsSUFBSSxDQUFDLHlCQUF5QixDQUFDLDRCQUE0QixDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVoRixJQUFJLDBCQUEwQixFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQy9FLElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ2YsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsMkJBQTJCLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ2xFLE1BQU0sbUJBQW1CLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUEsMkNBQWlCLEVBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSwwQkFBMEIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzVILElBQUksbUJBQW1CLEVBQUUsS0FBSyxFQUFFLENBQUM7d0JBQ2hDLE1BQU0sSUFBSSxDQUFDLGlDQUFpQyxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDbkYsT0FBTztvQkFDUixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxJQUFJLENBQUMsb0NBQW9DLENBQUMsU0FBUyxFQUFFLDBCQUEwQixDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUNsRyxPQUFPO29CQUNSLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLHNCQUFzQixDQUFDO1lBQ25HLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdkMsT0FBTztZQUNSLENBQUM7WUFFRCxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRU8sS0FBSyxDQUFDLGlDQUFpQyxDQUFDLFNBQWdDLEVBQUUsMEJBQTJDO1lBQzVILE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxXQUFXLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQztZQUN4RCxJQUFJLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxTQUFTLENBQUMsMEJBQTBCLENBQUMsRUFBRSxDQUFDO2dCQUM1RSxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDO29CQUNoQyxRQUFRLEVBQUUsa0JBQVEsQ0FBQyxLQUFLO29CQUN4QixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLGdLQUFnSyxFQUFFLE9BQU8sRUFBRSwwQkFBMEIsQ0FBQyxRQUFRLENBQUMsV0FBVyxJQUFJLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7b0JBQzFTLE9BQU8sRUFBRTt3QkFDUixPQUFPLEVBQUUsQ0FBQyxJQUFJLGdCQUFNLENBQUMsUUFBUSxFQUFFLElBQUEsY0FBUSxFQUFDLFFBQVEsRUFBRSxlQUFlLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztxQkFDaEg7aUJBQ0QsQ0FBQyxDQUFDO1lBQ0osQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxrQkFBa0IsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO2dCQUN4RyxJQUFJLGVBQWUsdURBQStDLEVBQUUsQ0FBQztvQkFDcEUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQzt3QkFDaEMsUUFBUSxFQUFFLGtCQUFRLENBQUMsS0FBSzt3QkFDeEIsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLCtIQUErSCxFQUFFLE9BQU8sRUFBRSwwQkFBMEIsQ0FBQyxRQUFRLENBQUMsV0FBVyxJQUFJLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7cUJBQ25SLENBQUMsQ0FBQztnQkFDSixDQUFDO3FCQUFNLElBQUksZUFBZSx1REFBK0MsRUFBRSxDQUFDO29CQUMzRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDO3dCQUNoQyxRQUFRLEVBQUUsa0JBQVEsQ0FBQyxLQUFLO3dCQUN4QixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUseUhBQXlILEVBQUUsT0FBTyxFQUFFLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxXQUFXLElBQUksMEJBQTBCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQzt3QkFDcFEsT0FBTyxFQUFFOzRCQUNSLE9BQU8sRUFBRSxDQUFDLElBQUksZ0JBQU0sQ0FBQyxzQkFBc0IsRUFBRSxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSx3QkFBd0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQ2hILEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQzt5QkFDdEU7cUJBQ0QsQ0FBQyxDQUFDO2dCQUNKLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsMkJBQTJCLENBQUMsbUJBQW1CLENBQUMsMEJBQTBCLENBQUMsRUFBRSxDQUFDO29CQUM3RixJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDO3dCQUNoQyxRQUFRLEVBQUUsa0JBQVEsQ0FBQyxLQUFLO3dCQUN4QixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsYUFBYSxFQUFFLGdLQUFnSyxFQUFFLE9BQU8sRUFBRSwwQkFBMEIsQ0FBQyxRQUFRLENBQUMsV0FBVyxJQUFJLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7d0JBQ3hTLE9BQU8sRUFBRTs0QkFDUixPQUFPLEVBQUUsQ0FBQyxJQUFJLGdCQUFNLENBQUMsUUFBUSxFQUFFLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQ25GLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxhQUFhLENBQUMsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFLGVBQWUsNkNBQXFDLENBQUMsQ0FBQyx5Q0FBaUMsQ0FBQyx5Q0FBaUMsQ0FBQztxQ0FDM00sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt5QkFDcEY7cUJBQ0QsQ0FBQyxDQUFDO2dCQUNKLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDO3dCQUNoQyxRQUFRLEVBQUUsa0JBQVEsQ0FBQyxLQUFLO3dCQUN4QixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsa0dBQWtHLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxXQUFXLElBQUksMEJBQTBCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztxQkFDbFAsQ0FBQyxDQUFDO2dCQUNKLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxTQUFnQyxFQUFFLGlCQUF5QjtZQUM3RyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsV0FBVyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUM7WUFDeEQsSUFBSSxtQkFBbUIsR0FBc0IsSUFBSSxDQUFDO1lBQ2xELElBQUksQ0FBQztnQkFDSixtQkFBbUIsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLGlCQUFpQixFQUFFLENBQUMsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RJLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2YsQ0FBQztZQUNELElBQUksbUJBQW1CLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQztvQkFDaEMsUUFBUSxFQUFFLGtCQUFRLENBQUMsS0FBSztvQkFDeEIsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLGtMQUFrTCxFQUFFLE9BQU8sRUFBRSxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsbUJBQW1CLENBQUMsb0JBQW9CLENBQUM7b0JBQzNTLE9BQU8sRUFBRTt3QkFDUixPQUFPLEVBQUUsQ0FBQyxJQUFJLGdCQUFNLENBQUMsU0FBUyxFQUFFLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLG9CQUFvQixDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFDOUYsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQztpQ0FDakUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDcEY7aUJBQ0QsQ0FBQyxDQUFDO1lBQ0osQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLHVGQUF1RixFQUFFLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDOUssQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsb0JBQW9CLENBQUMsS0FBd0I7WUFDbEQsSUFBSSxJQUFJLENBQUMsa0JBQWtCLDJDQUFtQyxFQUFFLENBQUM7Z0JBQ2hFLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9ELENBQUM7aUJBQU0sSUFBSSxJQUFJLENBQUMsa0JBQWtCLDZDQUFxQyxFQUFFLENBQUM7Z0JBQ3pFLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNoRSxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBa0I7WUFDckMsT0FBTyxvQkFBVSxDQUFDLGVBQWUsQ0FBQyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDcEQsQ0FBQztLQUNELENBQUE7SUFsS1ksZ0VBQTBCO3lDQUExQiwwQkFBMEI7UUFEdEMsSUFBQSx1Q0FBb0IsRUFBQyw4QkFBVyxDQUFDLDBCQUEwQixDQUFDO1FBUTFELFdBQUEsOEJBQWlCLENBQUE7UUFDakIsV0FBQSxtQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLHdDQUEyQixDQUFBO1FBQzNCLFdBQUEsbUJBQVksQ0FBQTtRQUNaLFdBQUEsMERBQW9DLENBQUE7UUFDcEMsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsV0FBQSwwQkFBZSxDQUFBO1FBQ2YsV0FBQSxpREFBNEIsQ0FBQTtPQWRsQiwwQkFBMEIsQ0FrS3RDO0lBRUQsTUFBTSxrQkFBa0I7UUFDdkIsWUFDa0IsT0FBcUM7WUFBckMsWUFBTyxHQUFQLE9BQU8sQ0FBOEI7UUFDbkQsQ0FBQztRQUVMLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxlQUF1QixFQUFFLGNBQXNCO1lBQ3JFLE1BQU0sUUFBUSxHQUFHLDRCQUE0QixDQUFDLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUNySCxPQUFPLFFBQVEsQ0FBQztRQUNqQixDQUFDO1FBQ0QsS0FBSyxDQUFDLGVBQWUsQ0FBQyxlQUF1QixFQUFFLEdBQVE7WUFDdEQsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLGVBQWUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNoRixPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxTQUFHLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBQ0Qsa0JBQWtCLENBQUMsZUFBMkM7WUFDN0QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFDRCxxQkFBcUI7WUFDcEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDOUMsQ0FBQztRQUNELGVBQWUsQ0FBQyxlQUF1QixFQUFFLGNBQThCO1lBQ3RFLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUNELFFBQVEsQ0FBQyxXQUFnQyxFQUFFLE1BQWlDO1lBQzNFLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFDRCxvQkFBb0IsQ0FBQyxHQUFxQztZQUN6RCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUNELDBCQUEwQixDQUFDLGNBQXFDO1lBQy9ELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNqRSxDQUFDO1FBQ0QsZUFBZSxDQUFDLGVBQTJDO1lBQzFELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBQ0QsWUFBWSxDQUFDLENBQVM7WUFDckIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBQ0QsT0FBTyxDQUFDLENBQVc7WUFDbEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBQ0QsU0FBUyxDQUFDLElBQVk7WUFDckIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxDQUFDO0tBQ0Q7SUFFRCxTQUFTLDRCQUE0QixDQUFDLE1BQW9DO1FBQ3pFLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUMxQixPQUFPO2dCQUNOLElBQUksRUFBRSxJQUFJO2dCQUNWLEtBQUssRUFBRTtvQkFDTixHQUFHLE1BQU0sQ0FBQyxLQUFLO29CQUNmLFNBQVMsRUFBRSx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztpQkFDMUQ7YUFDRCxDQUFDO1FBQ0gsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7SUFDRixDQUFDO0lBRUQsU0FBUyx1QkFBdUIsQ0FBQyxpQkFBeUM7UUFDekUsT0FBTztZQUNOLEdBQUcsaUJBQWlCO1lBQ3BCLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUM7U0FDeEQsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFTLGdCQUFnQixDQUFDLFVBQWlDO1FBQzFELElBQUksVUFBVSxDQUFDLElBQUksMkNBQW1DLEVBQUUsQ0FBQztZQUN4RCxPQUFPLElBQUksbURBQXlCLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUNELE9BQU8sSUFBSSxpREFBdUIsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbkQsQ0FBQyJ9