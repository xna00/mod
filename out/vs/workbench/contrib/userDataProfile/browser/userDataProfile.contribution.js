/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/userDataProfile/browser/userDataProfile", "vs/workbench/contrib/userDataProfile/browser/userDataProfilePreview", "./userDataProfileActions"], function (require, exports, platform_1, contributions_1, userDataProfile_1, userDataProfilePreview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    (0, contributions_1.registerWorkbenchContribution2)(userDataProfile_1.UserDataProfilesWorkbenchContribution.ID, userDataProfile_1.UserDataProfilesWorkbenchContribution, 2 /* WorkbenchPhase.BlockRestore */);
    workbenchRegistry.registerWorkbenchContribution(userDataProfilePreview_1.UserDataProfilePreviewContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdXNlckRhdGFQcm9maWxlL2Jyb3dzZXIvdXNlckRhdGFQcm9maWxlLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxNQUFNLGlCQUFpQixHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzdGLElBQUEsOENBQThCLEVBQUMsdURBQXFDLENBQUMsRUFBRSxFQUFFLHVEQUFxQyxzQ0FBOEIsQ0FBQztJQUM3SSxpQkFBaUIsQ0FBQyw2QkFBNkIsQ0FBQywyREFBa0Msa0NBQTBCLENBQUMifQ==