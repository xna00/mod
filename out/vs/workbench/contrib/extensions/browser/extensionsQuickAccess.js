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
define(["require", "exports", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/nls", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/notification/common/notification", "vs/platform/log/common/log", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, pickerQuickAccess_1, nls_1, extensions_1, extensionManagement_1, notification_1, log_1, panecomposite_1) {
    "use strict";
    var InstallExtensionQuickAccessProvider_1, ManageExtensionsQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManageExtensionsQuickAccessProvider = exports.InstallExtensionQuickAccessProvider = void 0;
    let InstallExtensionQuickAccessProvider = class InstallExtensionQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { InstallExtensionQuickAccessProvider_1 = this; }
        static { this.PREFIX = 'ext install '; }
        constructor(paneCompositeService, galleryService, extensionsService, notificationService, logService) {
            super(InstallExtensionQuickAccessProvider_1.PREFIX);
            this.paneCompositeService = paneCompositeService;
            this.galleryService = galleryService;
            this.extensionsService = extensionsService;
            this.notificationService = notificationService;
            this.logService = logService;
        }
        _getPicks(filter, disposables, token) {
            // Nothing typed
            if (!filter) {
                return [{
                        label: (0, nls_1.localize)('type', "Type an extension name to install or search.")
                    }];
            }
            const genericSearchPickItem = {
                label: (0, nls_1.localize)('searchFor', "Press Enter to search for extension '{0}'.", filter),
                accept: () => this.searchExtension(filter)
            };
            // Extension ID typed: try to find it
            if (/\./.test(filter)) {
                return this.getPicksForExtensionId(filter, genericSearchPickItem, token);
            }
            // Extension name typed: offer to search it
            return [genericSearchPickItem];
        }
        async getPicksForExtensionId(filter, fallback, token) {
            try {
                const [galleryExtension] = await this.galleryService.getExtensions([{ id: filter }], token);
                if (token.isCancellationRequested) {
                    return []; // return early if canceled
                }
                if (!galleryExtension) {
                    return [fallback];
                }
                return [{
                        label: (0, nls_1.localize)('install', "Press Enter to install extension '{0}'.", filter),
                        accept: () => this.installExtension(galleryExtension, filter)
                    }];
            }
            catch (error) {
                if (token.isCancellationRequested) {
                    return []; // expected error
                }
                this.logService.error(error);
                return [fallback];
            }
        }
        async installExtension(extension, name) {
            try {
                await openExtensionsViewlet(this.paneCompositeService, `@id:${name}`);
                await this.extensionsService.installFromGallery(extension);
            }
            catch (error) {
                this.notificationService.error(error);
            }
        }
        async searchExtension(name) {
            openExtensionsViewlet(this.paneCompositeService, name);
        }
    };
    exports.InstallExtensionQuickAccessProvider = InstallExtensionQuickAccessProvider;
    exports.InstallExtensionQuickAccessProvider = InstallExtensionQuickAccessProvider = InstallExtensionQuickAccessProvider_1 = __decorate([
        __param(0, panecomposite_1.IPaneCompositePartService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, notification_1.INotificationService),
        __param(4, log_1.ILogService)
    ], InstallExtensionQuickAccessProvider);
    let ManageExtensionsQuickAccessProvider = class ManageExtensionsQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { ManageExtensionsQuickAccessProvider_1 = this; }
        static { this.PREFIX = 'ext '; }
        constructor(paneCompositeService) {
            super(ManageExtensionsQuickAccessProvider_1.PREFIX);
            this.paneCompositeService = paneCompositeService;
        }
        _getPicks() {
            return [{
                    label: (0, nls_1.localize)('manage', "Press Enter to manage your extensions."),
                    accept: () => openExtensionsViewlet(this.paneCompositeService)
                }];
        }
    };
    exports.ManageExtensionsQuickAccessProvider = ManageExtensionsQuickAccessProvider;
    exports.ManageExtensionsQuickAccessProvider = ManageExtensionsQuickAccessProvider = ManageExtensionsQuickAccessProvider_1 = __decorate([
        __param(0, panecomposite_1.IPaneCompositePartService)
    ], ManageExtensionsQuickAccessProvider);
    async function openExtensionsViewlet(paneCompositeService, search = '') {
        const viewlet = await paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
        const view = viewlet?.getViewPaneContainer();
        view?.search(search);
        view?.focus();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1F1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvZXh0ZW5zaW9uc1F1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFjekYsSUFBTSxtQ0FBbUMsR0FBekMsTUFBTSxtQ0FBb0MsU0FBUSw2Q0FBaUQ7O2lCQUVsRyxXQUFNLEdBQUcsY0FBYyxBQUFqQixDQUFrQjtRQUUvQixZQUM2QyxvQkFBK0MsRUFDaEQsY0FBd0MsRUFDckMsaUJBQThDLEVBQ3JELG1CQUF5QyxFQUNsRCxVQUF1QjtZQUVyRCxLQUFLLENBQUMscUNBQW1DLENBQUMsTUFBTSxDQUFDLENBQUM7WUFOTix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQTJCO1lBQ2hELG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUNyQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQTZCO1lBQ3JELHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDbEQsZUFBVSxHQUFWLFVBQVUsQ0FBYTtRQUd0RCxDQUFDO1FBRVMsU0FBUyxDQUFDLE1BQWMsRUFBRSxXQUE0QixFQUFFLEtBQXdCO1lBRXpGLGdCQUFnQjtZQUNoQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxDQUFDO3dCQUNQLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsOENBQThDLENBQUM7cUJBQ3ZFLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxNQUFNLHFCQUFxQixHQUEyQjtnQkFDckQsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSw0Q0FBNEMsRUFBRSxNQUFNLENBQUM7Z0JBQ2xGLE1BQU0sRUFBRSxHQUFHLEVBQUUs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