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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/base/common/process"], function (require, exports, nls, platform_1, contributions_1, platform_2, telemetry_1, storage_1, productService_1, notification_1, opener_1, uri_1, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const PROBABILITY = 0.15;
    const SESSION_COUNT_KEY = 'nps/sessionCount';
    const LAST_SESSION_DATE_KEY = 'nps/lastSessionDate';
    const SKIP_VERSION_KEY = 'nps/skipVersion';
    const IS_CANDIDATE_KEY = 'nps/isCandidate';
    let NPSContribution = class NPSContribution {
        constructor(storageService, notificationService, telemetryService, openerService, productService) {
            if (!productService.npsSurveyUrl) {
                return;
            }
            const skipVersion = storageService.get(SKIP_VERSION_KEY, -1 /* StorageScope.APPLICATION */, '');
            if (skipVersion) {
                return;
            }
            const date = new Date().toDateString();
            const lastSessionDate = storageService.get(LAST_SESSION_DATE_KEY, -1 /* StorageScope.APPLICATION */, new Date(0).toDateString());
            if (date === lastSessionDate) {
                return;
            }
            const sessionCount = (storageService.getNumber(SESSION_COUNT_KEY, -1 /* StorageScope.APPLICATION */, 0) || 0) + 1;
            storageService.store(LAST_SESSION_DATE_KEY, date, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            storageService.store(SESSION_COUNT_KEY, sessionCount, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            if (sessionCount < 9) {
                return;
            }
            const isCandidate = storageService.getBoolean(IS_CANDIDATE_KEY, -1 /* StorageScope.APPLICATION */, false)
                || Math.random() < PROBABILITY;
            storageService.store(IS_CANDIDATE_KEY, isCandidate, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            if (!isCandidate) {
                storageService.store(SKIP_VERSION_KEY, productService.version, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                return;
            }
            notificationService.prompt(notification_1.Severity.Info, nls.localize('surveyQuestion', "Do you mind taking a quick feedback survey?"), [{
                    label: nls.localize('takeSurvey', "Take Survey"),
                    run: () => {
                        openerService.open(uri_1.URI.parse(`${productService.npsSurveyUrl}?o=${encodeURIComponent(process_1.platform)}&v=${encodeURIComponent(productService.version)}&m=${encodeURIComponent(telemetryService.machineId)}`));
                        storageService.store(IS_CANDIDATE_KEY, false, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                        storageService.store(SKIP_VERSION_KEY, productService.version, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                    }
                }, {
                    label: nls.localize('remindLater', "Remind Me Later"),
                    run: () => storageService.store(SESSION_COUNT_KEY, sessionCount - 3, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */)
                }, {
                    label: nls.localize('neverAgain', "Don't Show Again"),
                    run: () => {
                        storageService.store(IS_CANDIDATE_KEY, false, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                        storageService.store(SKIP_VERSION_KEY, productService.version, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                    }
                }], { sticky: true, priority: notification_1.NotificationPriority.URGENT });
        }
    };
    NPSContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, notification_1.INotificationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, opener_1.IOpenerService),
        __param(4, productService_1.IProductService)
    ], NPSContribution);
    if (platform_1.language === 'en') {
        const workbenchRegistry = platform_2.Registry.as(contributions_1.Extensions.Workbench);
        workbenchRegistry.registerWorkbenchContribution(NPSContribution, 3 /* LifecyclePhase.Restored */);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnBzLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc3VydmV5cy9icm93c2VyL25wcy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFlaEcsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQ3pCLE1BQU0saUJBQWlCLEdBQUcsa0JBQWtCLENBQUM7SUFDN0MsTUFBTSxxQkFBcUIsR0FBRyxxQkFBcUIsQ0FBQztJQUNwRCxNQUFNLGdCQUFnQixHQUFHLGlCQUFpQixDQUFDO0lBQzNDLE1BQU0sZ0JBQWdCLEdBQUcsaUJBQWlCLENBQUM7SUFFM0MsSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZTtRQUVwQixZQUNrQixjQUErQixFQUMxQixtQkFBeUMsRUFDNUMsZ0JBQW1DLEVBQ3RDLGFBQTZCLEVBQzVCLGNBQStCO1lBRWhELElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ2xDLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IscUNBQTRCLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2pCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN2QyxNQUFNLGVBQWUsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLHFCQUFxQixxQ0FBNEIsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUV4SCxJQUFJLElBQUksS0FBSyxlQUFlLEVBQUUsQ0FBQztnQkFDOUIsT0FBTztZQUNSLENB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