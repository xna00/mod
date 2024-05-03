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
define(["require", "exports", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/notification/common/notification", "vs/base/common/actions", "vs/workbench/services/host/browser/host", "vs/base/common/lifecycle", "vs/base/common/cancellation", "vs/base/common/async"], function (require, exports, extensions_1, extensions_2, commands_1, actions_1, nls_1, extensionManagementUtil_1, notification_1, actions_2, host_1, lifecycle_1, cancellation_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionDependencyChecker = void 0;
    let ExtensionDependencyChecker = class ExtensionDependencyChecker extends lifecycle_1.Disposable {
        constructor(extensionService, extensionsWorkbenchService, notificationService, hostService) {
            super();
            this.extensionService = extensionService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.notificationService = notificationService;
            this.hostService = hostService;
            commands_1.CommandsRegistry.registerCommand('workbench.extensions.installMissingDependencies', () => this.installMissingDependencies());
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
                command: {
                    id: 'workbench.extensions.installMissingDependencies',
                    category: (0, nls_1.localize)('extensions', "Extensions"),
                    title: (0, nls_1.localize)('auto install missing deps', "Install Missing Dependencies")
                }
            });
        }
        async getUninstalledMissingDependencies() {
            const allMissingDependencies = await this.getAllMissingDependencies();
            const localExtensions = await this.extensionsWorkbenchService.queryLocal();
            return allMissingDependencies.filter(id => localExtensions.every(l => !(0, extensionManagementUtil_1.areSameExtensions)(l.identifier, { id })));
        }
        async getAllMissingDependencies() {
            await this.extensionService.whenInstalledExtensionsRegistered();
            const runningExtensionsIds = this.extensionService.extensions.reduce((result, r) => { result.add(r.identifier.value.toLowerCase()); return result; }, new Set());
            const missingDependencies = new Set();
            for (const extension of this.extensionService.extensions) {
                if (extension.extensionDependencies) {
                    extension.extensionDependencies.forEach(dep => {
                        if (!runningExtensionsIds.has(dep.toLowerCase())) {
                            missingDependencies.add(dep);
                        }
                    });
                }
            }
            return [...missingDependencies.values()];
        }
        async installMissingDependencies() {
            const missingDependencies = await this.getUninstalledMissingDependencies();
            if (missingDependencies.length) {
                const extensions = await this.extensionsWorkbenchService.getExtensions(missingDependencies.map(id => ({ id })), cancellation_1.CancellationToken.None);
                if (extensions.length) {
                    await async_1.Promises.settled(extensions.map(extension => this.extensionsWorkbenchService.install(extension)));
                    this.notificationService.notify({
                        severity: notification_1.Severity.Info,
                        message: (0, nls_1.localize)('finished installing missing deps', "Finished installing missing dependencies. Please reload the window now."),
                        actions: {
                            primary: [new actions_2.Action('realod', (0, nls_1.localize)('reload', "Reload Window"), '', true, () => this.hostService.reload())]
                        }
                    });
                }
            }
            else {
                this.notificationService.info((0, nls_1.localize)('no missing deps', "There are no missing dependencies to install."));
            }
        }
    };
    exports.ExtensionDependencyChecker = ExtensionDependencyChecker;
    exports.ExtensionDependencyChecker = ExtensionDependencyChecker = __decorate([
        __param(0, extensions_2.IExtensionService),
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, notification_1.INotificationService),
        __param(3, host_1.IHostService)
    ], ExtensionDependencyChecker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc0RlcGVuZGVuY3lDaGVja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvZXh0ZW5zaW9uc0RlcGVuZGVuY3lDaGVja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCekYsSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMkIsU0FBUSxzQkFBVTtRQUV6RCxZQUNxQyxnQkFBbUMsRUFDekIsMEJBQXVELEVBQzlELG1CQUF5QyxFQUNqRCxXQUF5QjtZQUV4RCxLQUFLLEVBQUUsQ0FBQztZQUw0QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3pCLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7WUFDOUQsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUNqRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUd4RCwyQkFBZ0IsQ0FBQyxlQUFlLENBQUMsaURBQWlELEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQztZQUM3SCxzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLGNBQWMsRUFBRTtnQkFDbEQsT0FBTyxFQUFFO29CQUNSLEVBQUUsRUFBRSxpREFBaUQ7b0JBQ3JELFFBQVEsRUFBRSxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsWUFBWSxDQUFDO29CQUM5QyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsOEJBQThCLENBQUM7aUJBQzVFO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLEtBQUssQ0FBQyxpQ0FBaUM7WUFDOUMsTUFBTSxzQkFBc0IsR0FBRyxNQUFNLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFD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