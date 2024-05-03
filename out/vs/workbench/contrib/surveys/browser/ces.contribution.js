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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/workbench/services/assignment/common/assignmentService", "vs/base/common/uri", "vs/base/common/process", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, nls, platform_1, contributions_1, platform_2, telemetry_1, storage_1, productService_1, notification_1, opener_1, assignmentService_1, uri_1, process_1, async_1, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const WAIT_TIME_TO_SHOW_SURVEY = 1000 * 60 * 60; // 1 hour
    const MIN_WAIT_TIME_TO_SHOW_SURVEY = 1000 * 60 * 2; // 2 minutes
    const MAX_INSTALL_AGE = 1000 * 60 * 60 * 24; // 24 hours
    const REMIND_LATER_DELAY = 1000 * 60 * 60 * 4; // 4 hours
    const SKIP_SURVEY_KEY = 'ces/skipSurvey';
    const REMIND_LATER_DATE_KEY = 'ces/remindLaterDate';
    let CESContribution = class CESContribution extends lifecycle_1.Disposable {
        constructor(storageService, notificationService, telemetryService, openerService, productService, tasExperimentService) {
            super();
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.openerService = openerService;
            this.productService = productService;
            this.promptDelayer = this._register(new async_1.ThrottledDelayer(0));
            this.tasExperimentService = tasExperimentService;
            if (!productService.cesSurveyUrl) {
                return;
            }
            const skipSurvey = storageService.get(SKIP_SURVEY_KEY, -1 /* StorageScope.APPLICATION */, '');
            if (skipSurvey) {
                return;
            }
            this.schedulePrompt();
        }
        async promptUser() {
            const isCandidate = await this.tasExperimentService?.getTreatment('CESSurvey');
            if (!isCandidate) {
                this.skipSurvey();
                return;
            }
            const sendTelemetry = (userReaction) => {
                /* __GDPR__
                "cesSurvey:popup" : {
                    "owner": "digitarald",
                    "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
                */
                this.telemetryService.publicLog('cesSurvey:popup', { userReaction });
            };
            const message = await this.tasExperimentService?.getTreatment('CESSurveyMessage') ?? nls.localize('cesSurveyQuestion', 'Got a moment to help the VS Code team? Please tell us about your experience with VS Code so far.');
            const button = await this.tasExperimentService?.getTreatment('CESSurveyButton') ?? nls.localize('giveFeedback', "Give Feedback");
            const notification = this.notificationService.prompt(notification_1.Severity.Info, message, [{
                    label: button,
                    run: () => {
                        sendTelemetry('accept');
                        let surveyUrl = `${this.productService.cesSurveyUrl}?o=${encodeURIComponent(process_1.platform)}&v=${encodeURIComponent(this.productService.version)}&m=${encodeURIComponent(this.telemetryService.machineId)}`;
                        const usedParams = this.productService.surveys
                            ?.filter(surveyData => surveyData.surveyId && surveyData.languageId)
                            // Counts provided by contrib/surveys/browser/languageSurveys
                            .filter(surveyData => this.storageService.getNumber(`${surveyData.surveyId}.editedCount`, -1 /* StorageScope.APPLICATION */, 0) > 0)
                            .map(surveyData => `${encodeURIComponent(surveyData.languageId)}Lang=1`)
                            .join('&');
                        if (usedParams) {
                            surveyUrl += `&${usedParams}`;
                        }
                        this.openerService.open(uri_1.URI.parse(surveyUrl));
                        this.skipSurvey();
                    }
                }, {
                    label: nls.localize('remindLater', "Remind Me Later"),
                    run: () => {
                        sendTelemetry('remindLater');
                        this.storageService.store(REMIND_LATER_DATE_KEY, new Date().toUTCString(), -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                        this.schedulePrompt();
                    }
                }], {
                sticky: true,
                onCancel: () => {
                    sendTelemetry('cancelled');
                    this.skipSurvey();
                }
            });
            await event_1.Event.toPromise(notification.onDidClose);
        }
        async schedulePrompt() {
            let waitTimeToShowSurvey = 0;
            const remindLaterDate = this.storageService.get(REMIND_LATER_DATE_KEY, -1 /* StorageScope.APPLICATION */, '');
            if (remindLaterDate) {
                const timeToRemind = new Date(remindLaterDate).getTime() + REMIND_LATER_DELAY - Date.now();
                if (timeToRemind > 0) {
                    waitTimeToShowSurvey = timeToRemind;
                }
            }
            else {
                const timeFromInstall = Date.now() - new Date(this.telemetryService.firstSessionDate).getTime();
                const isNewInstall = !isNaN(timeFromInstall) && timeFromInstall < MAX_INSTALL_AGE;
                // Installation is older than MAX_INSTALL_AGE
                if (!isNewInstall) {
                    this.skipSurvey();
                    return;
                }
                if (timeFromInstall < WAIT_TIME_TO_SHOW_SURVEY) {
                    waitTimeToShowSurvey = WAIT_TIME_TO_SHOW_SURVEY - timeFromInstall;
                }
            }
            /* __GDPR__
            "cesSurvey:schedule" : {
                "owner": "digitarald"
            }
            */
            this.telemetryService.publicLog('cesSurvey:schedule');
            this.promptDelayer.trigger(async () => {
                await this.promptUser();
            }, Math.max(waitTimeToShowSurvey, MIN_WAIT_TIME_TO_SHOW_SURVEY));
        }
        skipSurvey() {
            this.storageService.store(SKIP_SURVEY_KEY, this.productService.version, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
        }
    };
    CESContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, notification_1.INotificationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, opener_1.IOpenerService),
        __param(4, productService_1.IProductService),
        __param(5, assignmentService_1.IWorkbenchAssignmentService)
    ], CESContribution);
    if (platform_1.language === 'en') {
        const workbenchRegistry = platform_2.Registry.as(contributions_1.Extensions.Workbench);
        workbenchRegistry.registerWorkbenchContribution(CESContribution, 3 /* LifecyclePhase.Restored */);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VzLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc3VydmV5cy9icm93c2VyL2Nlcy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFtQmhHLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxTQUFTO0lBQzFELE1BQU0sNEJBQTRCLEdBQUcsSUFBSSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxZQUFZO0lBQ2hFLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLFdBQVc7SUFDeEQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVO0lBQ3pELE1BQU0sZUFBZSxHQUFHLGdCQUFnQixDQUFDO0lBQ3pDLE1BQU0scUJBQXFCLEdBQUcscUJBQXFCLENBQUM7SUFFcEQsSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxzQkFBVTtRQUt2QyxZQUNrQixjQUFnRCxFQUMzQyxtQkFBMEQsRUFDN0QsZ0JBQW9ELEVBQ3ZELGFBQThDLEVBQzdDLGNBQWdELEVBQ3BDLG9CQUFpRDtZQUU5RSxLQUFLLEVBQUUsQ0FBQztZQVAwQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDMUIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUM1QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3RDLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUM1QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFSMUQsa0JBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxD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