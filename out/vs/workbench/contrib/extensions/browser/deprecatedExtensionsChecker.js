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
define(["require", "exports", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/services/extensionManagement/common/extensionManagement"], function (require, exports, extensions_1, notification_1, storage_1, nls_1, instantiation_1, extensionsActions_1, arrays_1, lifecycle_1, extensionManagement_1, extensionManagementUtil_1, extensionManagement_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DeprecatedExtensionsChecker = void 0;
    let DeprecatedExtensionsChecker = class DeprecatedExtensionsChecker extends lifecycle_1.Disposable {
        constructor(extensionsWorkbenchService, extensionManagementService, extensionEnablementService, storageService, notificationService, instantiationService) {
            super();
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.instantiationService = instantiationService;
            this.checkForDeprecatedExtensions();
            this._register(extensionManagementService.onDidInstallExtensions(e => {
                const ids = [];
                for (const { local } of e) {
                    if (local && extensionsWorkbenchService.local.find(extension => (0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, local.identifier))?.deprecationInfo) {
                        ids.push(local.identifier.id.toLowerCase());
                    }
                }
                if (ids.length) {
                    this.setNotifiedDeprecatedExtensions(ids);
                }
            }));
        }
        async checkForDeprecatedExtensions() {
            if (this.storageService.getBoolean('extensionsAssistant/doNotCheckDeprecated', 0 /* StorageScope.PROFILE */, false)) {
                return;
            }
            const local = await this.extensionsWorkbenchService.queryLocal();
            const previouslyNotified = this.getNotifiedDeprecatedExtensions();
            const toNotify = local.filter(e => !!e.deprecationInfo && e.local && this.extensionEnablementService.isEnabled(e.local)).filter(e => !previouslyNotified.includes(e.identifier.id.toLowerCase()));
            if (toNotify.length) {
                this.notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('deprecated extensions', "You have deprecated extensions installed. We recommend to review them and migrate to alternatives."), [{
                        label: (0, nls_1.localize)('showDeprecated', "Show Deprecated Extensions"),
                        run: async () => {
                            this.setNotifiedDeprecatedExtensions(toNotify.map(e => e.identifier.id.toLowerCase()));
                            const action = this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, toNotify.map(extension => `@id:${extension.identifier.id}`).join(' '));
                            try {
                                await action.run();
                            }
                            finally {
                                action.dispose();
                            }
                        }
                    }, {
                        label: (0, nls_1.localize)('neverShowAgain', "Don't Show Again"),
                        isSecondary: true,
                        run: () => this.storageService.store('extensionsAssistant/doNotCheckDeprecated', true, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */)
                    }]);
            }
        }
        getNotifiedDeprecatedExtensions() {
            return JSON.parse(this.storageService.get('extensionsAssistant/deprecated', 0 /* StorageScope.PROFILE */, '[]'));
        }
        setNotifiedDeprecatedExtensions(notified) {
            this.storageService.store('extensionsAssistant/deprecated', JSON.stringify((0, arrays_1.distinct)([...this.getNotifiedDeprecatedExtensions(), ...notified])), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
    };
    exports.DeprecatedExtensionsChecker = DeprecatedExtensionsChecker;
    exports.DeprecatedExtensionsChecker = DeprecatedExtensionsChecker = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_1.IExtensionManagementService),
        __param(2, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(3, storage_1.IStorageService),
        __param(4, notification_1.INotificationService),
        __param(5, instantiation_1.IInstantiationService)
    ], DeprecatedExtensionsChecker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwcmVjYXRlZEV4dGVuc2lvbnNDaGVja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvZGVwcmVjYXRlZEV4dGVuc2lvbnNDaGVja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWV6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHNCQUFVO1FBRTFELFlBQytDLDBCQUF1RCxFQUN4RSwwQkFBdUQsRUFDN0IsMEJBQWdFLEVBQ3JGLGNBQStCLEVBQzFCLG1CQUF5QyxFQUN4QyxvQkFBMkM7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFQc0MsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUU5QywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQXNDO1lBQ3JGLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMxQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQ3hDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFHbkYsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7WUFDcEMsSUFBSSxDQUFDLFNBQVMsQ0FBQywwQkFBMEIsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDcEUsTUFBTSxHQUFHLEdBQWEsRUFBRSxDQUFDO2dCQUN6QixLQUFLLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxLQUFLLElBQUksMEJBQTBCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUEsMkNBQWlCLEVBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxlQUFlLEVBQUUs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