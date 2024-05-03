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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/log/common/log", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, errors_1, lifecycle_1, uri_1, log_1, environmentService_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfilePreviewContribution = void 0;
    let UserDataProfilePreviewContribution = class UserDataProfilePreviewContribution extends lifecycle_1.Disposable {
        constructor(environmentService, userDataProfileImportExportService, logService) {
            super();
            if (environmentService.options?.profileToPreview) {
                userDataProfileImportExportService.importProfile(uri_1.URI.revive(environmentService.options.profileToPreview), { mode: 'both' })
                    .then(null, error => logService.error('Error while previewing the profile', (0, errors_1.getErrorMessage)(error)));
            }
        }
    };
    exports.UserDataProfilePreviewContribution = UserDataProfilePreviewContribution;
    exports.UserDataProfilePreviewContribution = UserDataProfilePreviewContribution = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, userDataProfile_1.IUserDataProfileImportExportService),
        __param(2, log_1.ILogService)
    ], UserDataProfilePreviewContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlUHJldmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdXNlckRhdGFQcm9maWxlL2Jyb3dzZXIvdXNlckRhdGFQcm9maWxlUHJldmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVekYsSUFBTSxrQ0FBa0MsR0FBeEMsTUFBTSxrQ0FBbUMsU0FBUSxzQkFBVTtRQUVqRSxZQUNzQyxrQkFBdUQsRUFDdkQsa0NBQXVFLEVBQy9GLFVBQXVCO1lBRXBDLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDbEQsa0NBQWtDLENBQUMsYUFBYSxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7cUJBQ3pILElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLG9DQUFvQyxFQUFFLElBQUEsd0JBQWUsRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkcsQ0FBQztRQUNGLENBQUM7S0FFRCxDQUFBO0lBZFksZ0ZBQWtDO2lEQUFsQyxrQ0FBa0M7UUFHNUMsV0FBQSx3REFBbUMsQ0FBQTtRQUNuQyxXQUFBLHFEQUFtQyxDQUFBO1FBQ25DLFdBQUEsaUJBQVcsQ0FBQTtPQUxELGtDQUFrQyxDQWM5QyJ9