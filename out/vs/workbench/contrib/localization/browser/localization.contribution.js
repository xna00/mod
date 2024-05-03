/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/localization/common/localization.contribution", "vs/platform/registry/common/platform", "vs/workbench/common/contributions"], function (require, exports, localization_contribution_1, platform_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebLocalizationWorkbenchContribution = void 0;
    class WebLocalizationWorkbenchContribution extends localization_contribution_1.BaseLocalizationWorkbenchContribution {
    }
    exports.WebLocalizationWorkbenchContribution = WebLocalizationWorkbenchContribution;
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(WebLocalizationWorkbenchContribution, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxpemF0aW9uLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbG9jYWxpemF0aW9uL2Jyb3dzZXIvbG9jYWxpemF0aW9uLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSxvQ0FBcUMsU0FBUSxpRUFBcUM7S0FBSTtJQUFuRyxvRkFBbUc7SUFFbkcsTUFBTSxpQkFBaUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdEcsaUJBQWlCLENBQUMsNkJBQTZCLENBQUMsb0NBQW9DLG9DQUE0QixDQUFDIn0=