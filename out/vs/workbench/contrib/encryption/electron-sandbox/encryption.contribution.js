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
define(["require", "exports", "vs/base/common/platform", "vs/base/common/stripComments", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/workbench/common/contributions", "vs/workbench/services/configuration/common/jsonEditing"], function (require, exports, platform_1, stripComments_1, environment_1, files_1, platform_2, storage_1, contributions_1, jsonEditing_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let EncryptionContribution = class EncryptionContribution {
        constructor(jsonEditingService, environmentService, fileService, storageService) {
            this.jsonEditingService = jsonEditingService;
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.storageService = storageService;
            this.migrateToGnomeLibsecret();
        }
        /**
         * Migrate the user from using the gnome or gnome-keyring password-store to gnome-libsecret.
         * TODO@TylerLeonhardt: This migration can be removed in 3 months or so and then storage
         * can be cleaned up.
         */
        async migrateToGnomeLibsecret() {
            if (!platform_1.isLinux || this.storageService.getBoolean('encryption.migratedToGnomeLibsecret', -1 /* StorageScope.APPLICATION */, false)) {
                return;
            }
            try {
                const content = await this.fileService.readFile(this.environmentService.argvResource);
                const argv = JSON.parse((0, stripComments_1.stripComments)(content.value.toString()));
                if (argv['password-store'] === 'gnome' || argv['password-store'] === 'gnome-keyring') {
                    this.jsonEditingService.write(this.environmentService.argvResource, [{ path: ['password-store'], value: 'gnome-libsecret' }], true);
                }
                this.storageService.store('encryption.migratedToGnomeLibsecret', true, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            }
            catch (error) {
                console.error(error);
            }
        }
    };
    EncryptionContribution = __decorate([
        __param(0, jsonEditing_1.IJSONEditingService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, files_1.IFileService),
        __param(3, storage_1.IStorageService)
    ], EncryptionContribution);
    platform_2.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(EncryptionContribution, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jcnlwdGlvbi5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2VuY3J5cHRpb24vZWxlY3Ryb24tc2FuZGJveC9lbmNyeXB0aW9uLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQVloRyxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUFzQjtRQUMzQixZQUN1QyxrQkFBdUMsRUFDdkMsa0JBQXVDLEVBQzlDLFdBQXlCLEVBQ3RCLGNBQStCO1lBSDNCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDdkMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM5QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN0QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFFakUsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVEOzs7O1dBSUc7UUFDSyxLQUFLLENBQUMsdUJBQXVCO1lBQ3BDLElBQUksQ0FBQyxrQkFBTyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLHFDQUFxQyxxQ0FBNEIsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDeEgsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3RGLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBQSw2QkFBYSxFQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNqRSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLE9BQU8sSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxlQUFlLEVBQUUsQ0FBQztvQkFDdEYsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3JJLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMscUNBQXFDLEVBQUUsSUFBSSxnRUFBK0MsQ0FBQztZQUN0SCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUE5Qkssc0JBQXNCO1FBRXpCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLHlCQUFlLENBQUE7T0FMWixzQkFBc0IsQ0E4QjNCO0lBRUQsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLDZCQUE2QixDQUFDLHNCQUFzQixvQ0FBNEIsQ0FBQyJ9