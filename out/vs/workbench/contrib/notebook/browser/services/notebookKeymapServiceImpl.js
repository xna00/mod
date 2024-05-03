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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/workbench/contrib/extensions/common/extensionsUtils", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/storage/common/storage", "vs/workbench/common/memento", "vs/base/common/arrays"], function (require, exports, errors_1, event_1, lifecycle_1, nls_1, instantiation_1, notification_1, extensionsUtils_1, extensionManagement_1, lifecycle_2, extensionManagement_2, extensionManagementUtil_1, storage_1, memento_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookKeymapService = void 0;
    exports.isNotebookKeymapExtension = isNotebookKeymapExtension;
    function onExtensionChanged(accessor) {
        const extensionService = accessor.get(extensionManagement_2.IExtensionManagementService);
        const extensionEnablementService = accessor.get(extensionManagement_1.IWorkbenchExtensionEnablementService);
        const onDidInstallExtensions = event_1.Event.chain(extensionService.onDidInstallExtensions, $ => $.filter(e => e.some(({ operation }) => operation === 2 /* InstallOperation.Install */))
            .map(e => e.map(({ identifier }) => identifier)));
        return event_1.Event.debounce(event_1.Event.any(event_1.Event.any(onDidInstallExtensions, event_1.Event.map(extensionService.onDidUninstallExtension, e => [e.identifier])), event_1.Event.map(extensionEnablementService.onEnablementChanged, extensions => extensions.map(e => e.identifier))), (result, identifiers) => {
            result = result || (identifiers.length ? [identifiers[0]] : []);
            for (const identifier of identifiers) {
                if (result.some(l => !(0, extensionManagementUtil_1.areSameExtensions)(l, identifier))) {
                    result.push(identifier);
                }
            }
            return result;
        });
    }
    const hasRecommendedKeymapKey = 'hasRecommendedKeymap';
    let NotebookKeymapService = class NotebookKeymapService extends lifecycle_1.Disposable {
        constructor(instantiationService, extensionEnablementService, notificationService, storageService, lifecycleService) {
            super();
            this.instantiationService = instantiationService;
            this.extensionEnablementService = extensionEnablementService;
            this.notificationService = notificationService;
            this.notebookKeymapMemento = new memento_1.Memento('notebookKeymap', storageService);
            this.notebookKeymap = this.notebookKeymapMemento.getMemento(0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            this._register(lifecycleService.onDidShutdown(() => this.dispose()));
            this._register(this.instantiationService.invokeFunction(onExtensionChanged)((identifiers => {
                Promise.all(identifiers.map(identifier => this.checkForOtherKeymaps(identifier)))
                    .then(undefined, errors_1.onUnexpectedError);
            })));
        }
        checkForOtherKeymaps(extensionIdentifier) {
            return this.instantiationService.invokeFunction(extensionsUtils_1.getInstalledExtensions).then(extensions => {
                const keymaps = extensions.filter(extension => isNotebookKeymapExtension(extension));
                const extension = keymaps.find(extension => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, extensionIdentifier));
                if (extension && extension.globallyEnabled) {
                    // there is already a keymap extension
                    this.notebookKeymap[hasRecommendedKeymapKey] = true;
                    this.notebookKeymapMemento.saveMemento();
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
            this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('disableOtherKeymapsConfirmation', "Disable other keymaps ({0}) to avoid conflicts between keybindings?", (0, arrays_1.distinct)(oldKeymaps.map(k => k.local.manifest.displayName)).map(name => `'${name}'`).join(', ')), [{
                    label: (0, nls_1.localize)('yes', "Yes"),
                    run: () => onPrompt(true)
                }, {
                    label: (0, nls_1.localize)('no', "No"),
                    run: () => onPrompt(false)
                }]);
        }
    };
    exports.NotebookKeymapService = NotebookKeymapService;
    exports.NotebookKeymapService = NotebookKeymapService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(2, notification_1.INotificationService),
        __param(3, storage_1.IStorageService),
        __param(4, lifecycle_2.ILifecycleService)
    ], NotebookKeymapService);
    function isNotebookKeymapExtension(extension) {
        if (extension.local.manifest.extensionPack) {
            return false;
        }
        const keywords = extension.local.manifest.keywords;
        if (!keywords) {
            return false;
        }
        return keywords.indexOf('notebook-keymap') !== -1;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tLZXltYXBTZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9zZXJ2aWNlcy9ub3RlYm9va0tleW1hcFNlcnZpY2VJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVHaEcsOERBV0M7SUFoR0QsU0FBUyxrQkFBa0IsQ0FBQyxRQUEwQjtRQUNyRCxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsaURBQTJCLENBQUMsQ0FBQztRQUNuRSxNQUFNLDBCQUEwQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMERBQW9DLENBQUMsQ0FBQztRQUN0RixNQUFNLHNCQUFzQixHQUFHLGFBQUssQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FDdkYsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxTQUFTLHFDQUE2QixDQUFDLENBQUM7YUFDOUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQ2pELENBQUM7UUFDRixPQUFPLGFBQUssQ0FBQyxRQUFRLENBQWlELGFBQUssQ0FBQyxHQUFHLENBQzlFLGFBQUssQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsYUFBSyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMs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