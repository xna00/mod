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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/notification/common/notification"], function (require, exports, nls_1, event_1, errors_1, lifecycle_1, extensionManagement_1, extensionManagement_2, extensionRecommendations_1, lifecycle_2, instantiation_1, extensionManagementUtil_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeymapExtensions = void 0;
    exports.getInstalledExtensions = getInstalledExtensions;
    let KeymapExtensions = class KeymapExtensions extends lifecycle_1.Disposable {
        constructor(instantiationService, extensionEnablementService, tipsService, lifecycleService, notificationService) {
            super();
            this.instantiationService = instantiationService;
            this.extensionEnablementService = extensionEnablementService;
            this.tipsService = tipsService;
            this.notificationService = notificationService;
            this._register(lifecycleService.onDidShutdown(() => this.dispose()));
            this._register(instantiationService.invokeFunction(onExtensionChanged)((identifiers => {
                Promise.all(identifiers.map(identifier => this.checkForOtherKeymaps(identifier)))
                    .then(undefined, errors_1.onUnexpectedError);
            })));
        }
        checkForOtherKeymaps(extensionIdentifier) {
            return this.instantiationService.invokeFunction(getInstalledExtensions).then(extensions => {
                const keymaps = extensions.filter(extension => isKeymapExtension(this.tipsService, extension));
                const extension = keymaps.find(extension => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, extensionIdentifier));
                if (extension && extension.globallyEnabled) {
                    const otherKeymaps = keymaps.filter(extension => !(0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, extensionIdentifier) && extension.globallyEnabled);
                    if (otherKeymaps.length) {
                        return this.promptForDisablingOtherKeymaps(extension, otherKeymaps);
                    }
                }
                return undefined;
            });
        }
        promptForDisablingOtherKeymaps(newKeymap, oldKeymaps) {
            const onPrompt = (confirmed) => {
                if (confirmed) {
                    this.extensionEnablementService.setEnablement(oldKeymaps.map(keymap => keymap.local), 6 /* EnablementState.DisabledGlobally */);
                }
            };
            this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('disableOtherKeymapsConfirmation', "Disable other keymaps ({0}) to avoid conflicts between keybindings?", oldKeymaps.map(k => `'${k.local.manifest.displayName}'`).join(', ')), [{
                    label: (0, nls_1.localize)('yes', "Yes"),
                    run: () => onPrompt(true)
                }, {
                    label: (0, nls_1.localize)('no', "No"),
                    run: () => onPrompt(false)
                }]);
        }
    };
    exports.KeymapExtensions = KeymapExtensions;
    exports.KeymapExtensions = KeymapExtensions = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(2, extensionRecommendations_1.IExtensionRecommendationsService),
        __param(3, lifecycle_2.ILifecycleService),
        __param(4, notification_1.INotificationService)
    ], KeymapExtensions);
    function onExtensionChanged(accessor) {
        const extensionService = accessor.get(extensionManagement_1.IExtensionManagementService);
        const extensionEnablementService = accessor.get(extensionManagement_2.IWorkbenchExtensionEnablementService);
        const onDidInstallExtensions = event_1.Event.chain(extensionService.onDidInstallExtensions, $ => $.filter(e => e.some(({ operation }) => operation === 2 /* InstallOperation.Install */))
            .map(e => e.map(({ identifier }) => identifier)));
        return event_1.Event.debounce(event_1.Event.any(event_1.Event.any(onDidInstallExtensions, event_1.Event.map(extensionService.onDidUninstallExtension, e => [e.identifier])), event_1.Event.map(extensionEnablementService.onEnablementChanged, extensions => extensions.map(e => e.identifier))), (result, identifiers) => {
            result = result || [];
            for (const identifier of identifiers) {
                if (result.some(l => !(0, extensionManagementUtil_1.areSameExtensions)(l, identifier))) {
                    result.push(identifier);
                }
            }
            return result;
        });
    }
    async function getInstalledExtensions(accessor) {
        const extensionService = accessor.get(extensionManagement_1.IExtensionManagementService);
        const extensionEnablementService = accessor.get(extensionManagement_2.IWorkbenchExtensionEnablementService);
        const extensions = await extensionService.getInstalled();
        return extensions.map(extension => {
            return {
                identifier: extension.identifier,
                local: extension,
                globallyEnabled: extensionEnablementService.isEnabled(extension)
            };
        });
    }
    function isKeymapExtension(tipsService, extension) {
        const cats = extension.local.manifest.categories;
        return cats && cats.indexOf('Keymaps') !== -1 || tipsService.getKeymapRecommendations().some(extensionId => (0, extensionManagementUtil_1.areSameExtensions)({ id: extensionId }, extension.local.identifier));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1V0aWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2NvbW1vbi9leHRlbnNpb25zVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNEZoRyx3REFXQztJQWxGTSxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHNCQUFVO1FBRS9DLFlBQ3lDLG9CQUEyQyxFQUM1QiwwQkFBZ0UsRUFDcEUsV0FBNkMsRUFDN0UsZ0JBQW1DLEVBQ2YsbUJBQXlDO1lBRWhGLEtBQUssRUFBRSxDQUFDO1lBTmdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDNUIsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUFzQztZQUNwRSxnQkFBVyxHQUFYLFdBQVcsQ0FBa0M7WUFFekQsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUdoRixJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDckYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7cUJBQy9FLElBQUksQ0FBQyxTQUFTLEVBQUUsMEJBQWlCLENBQUMsQ0FBQztZQUN0QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTixDQUFDO1FBRU8sb0JBQW9CLENBQUMsbUJBQXlDO1lBQ3JFLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDekYsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDL0YsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUEsMkNBQWlCLEVBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7Z0JBQzFHLElBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFDNUMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBQSwyQ0FBaUIsRUFBQyxTQUFTLENBQUMsVUFBVSxFQUFFLG1CQUFtQixDQUFDLElBQUksU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUM3SSxJQUFJLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDekIsT0FBTyxJQUFJLENBQUMsOEJBQThCLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO29CQUNyRSxDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sOEJBQThCLENBQUMsU0FBMkIsRUFBRSxVQUE4QjtZQUNqRyxNQUFNLFFBQVEsR0FBRyxDQUFDLFNBQWtCLEVBQUUsRUFBRTtnQkFDdkMsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDZixJQUFJLENBQUMsMEJBQTBCLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLDJDQUFtQyxDQUFDO2dCQUN6SCxDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBRUYsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyx1QkFBUSxDQUFDLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxpQ0FBaUMsRUFBRSxxRUFBcUUsRUFBRSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUNyTyxDQUFDO29CQUNBLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO29CQUM3QixHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztpQkFDekIsRUFBRTtvQkFDRixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQztvQkFDM0IsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7aUJBQzFCLENBQUMsQ0FDRixDQUFDO1FBQ0gsQ0FBQztLQUNELENBQUE7SUFoRFksNENBQWdCOytCQUFoQixnQkFBZ0I7UUFHMUIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDBEQUFvQyxDQUFBO1FBQ3BDLFdBQUEsMkRBQWdDLENBQUE7UUFDaEMsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLG1DQUFvQixDQUFBO09BUFYsZ0JBQWdCLENBZ0Q1QjtJQUVELFNBQVMsa0JBQWtCLENBQUMsUUFBMEI7UUFDckQsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGlEQUEyQixDQUFDLENBQUM7UUFDbkUsTUFBTSwwQkFBMEIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBEQUFvQyxDQUFDLENBQUM7UUFDdEYsTUFBTSxzQkFBc0IsR0FBRyxhQUFLLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQ3ZGLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsU0FBUyxxQ0FBNkIsQ0FBQyxDQUFDO2FBQzlFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUNqRCxDQUFDO1FBQ0YsT0FBTyxhQUFLLENBQUMsUUFBUSxDQUFpRCxhQUFLLENBQUMsR0FBRyxDQUM5RSxhQUFLLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLGFBQUssQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQzNHLGFBQUssQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsbUJBQW1CLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQzFHLEVBQUUsQ0FBQyxNQUEwQyxFQUFFLFdBQW1DLEVBQUUsRUFBRTtZQUN0RixNQUFNLEdBQUcsTUFBTSxJQUFJLEVBQUUsQ0FBQztZQUN0QixLQUFLLE1BQU0sVUFBVSxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUEsMkNBQWlCLEVBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDekQsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDekIsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVNLEtBQUssVUFBVSxzQkFBc0IsQ0FBQyxRQUEwQjtRQUN0RSxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsaURBQTJCLENBQUMsQ0FBQztRQUNuRSxNQUFNLDBCQUEwQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMERBQW9DLENBQUMsQ0FBQztRQUN0RixNQUFNLFVBQVUsR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3pELE9BQU8sVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUNqQyxPQUFPO2dCQUNOLFVBQVUsRUFBRSxTQUFTLENBQUMsVUFBVTtnQkFDaEMsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLGVBQWUsRUFBRSwwQkFBMEIsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO2FBQ2hFLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFTLGlCQUFpQixDQUFDLFdBQTZDLEVBQUUsU0FBMkI7UUFDcEcsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO1FBQ2pELE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksV0FBVyxDQUFDLHdCQUF3QixFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsSUFBQSwyQ0FBaUIsRUFBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDakwsQ0FBQyJ9