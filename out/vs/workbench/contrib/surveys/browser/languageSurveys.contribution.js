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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/editor/common/languages/language", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/platform/notification/common/notification", "vs/workbench/services/textfile/common/textfiles", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/base/common/process", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls_1, platform_1, language_1, contributions_1, platform_2, telemetry_1, storage_1, productService_1, notification_1, textfiles_1, opener_1, uri_1, process_1, async_1, lifecycle_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LanguageSurvey extends lifecycle_1.Disposable {
        constructor(data, storageService, notificationService, telemetryService, languageService, textFileService, openerService, productService) {
            super();
            const SESSION_COUNT_KEY = `${data.surveyId}.sessionCount`;
            const LAST_SESSION_DATE_KEY = `${data.surveyId}.lastSessionDate`;
            const SKIP_VERSION_KEY = `${data.surveyId}.skipVersion`;
            const IS_CANDIDATE_KEY = `${data.surveyId}.isCandidate`;
            const EDITED_LANGUAGE_COUNT_KEY = `${data.surveyId}.editedCount`;
            const EDITED_LANGUAGE_DATE_KEY = `${data.surveyId}.editedDate`;
            const skipVersion = storageService.get(SKIP_VERSION_KEY, -1 /* StorageScope.APPLICATION */, '');
            if (skipVersion) {
                return;
            }
            const date = new Date().toDateString();
            if (storageService.getNumber(EDITED_LANGUAGE_COUNT_KEY, -1 /* StorageScope.APPLICATION */, 0) < data.editCount) {
                // Process model-save event every 250ms to reduce load
                const onModelsSavedWorker = this._register(new async_1.RunOnceWorker(models => {
                    models.forEach(m => {
                        if (m.getLanguageId() === data.languageId && date !== storageService.get(EDITED_LANGUAGE_DATE_KEY, -1 /* StorageScope.APPLICATION */)) {
                            const editedCount = storageService.getNumber(EDITED_LANGUAGE_COUNT_KEY, -1 /* StorageScope.APPLICATION */, 0) + 1;
                            storageService.store(EDITED_LANGUAGE_COUNT_KEY, editedCount, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                            storageService.store(EDITED_LANGUAGE_DATE_KEY, date, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                        }
                    });
                }, 250));
                this._register(textFileService.files.onDidSave(e => onModelsSavedWorker.work(e.model)));
            }
            const lastSessionDate = storageService.get(LAST_SESSION_DATE_KEY, -1 /* StorageScope.APPLICATION */, new Date(0).toDateString());
            if (date === lastSessionDate) {
                return;
            }
            const sessionCount = storageService.getNumber(SESSION_COUNT_KEY, -1 /* StorageScope.APPLICATION */, 0) + 1;
            storageService.store(LAST_SESSION_DATE_KEY, date, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            storageService.store(SESSION_COUNT_KEY, sessionCount, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            if (sessionCount < 9) {
                return;
            }
            if (storageService.getNumber(EDITED_LANGUAGE_COUNT_KEY, -1 /* StorageScope.APPLICATION */, 0) < data.editCount) {
                return;
            }
            const isCandidate = storageService.getBoolean(IS_CANDIDATE_KEY, -1 /* StorageScope.APPLICATION */, false)
                || Math.random() < data.userProbability;
            storageService.store(IS_CANDIDATE_KEY, isCandidate, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            if (!isCandidate) {
                storageService.store(SKIP_VERSION_KEY, productService.version, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                return;
            }
            notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('helpUs', "Help us improve our support for {0}", languageService.getLanguageName(data.languageId) ?? data.languageId), [{
                    label: (0, nls_1.localize)('takeShortSurvey', "Take Short Survey"),
                    run: () => {
                        telemetryService.publicLog(`${data.surveyId}.survey/takeShortSurvey`);
                        openerService.open(uri_1.URI.parse(`${data.surveyUrl}?o=${encodeURIComponent(process_1.platform)}&v=${encodeURIComponent(productService.version)}&m=${encodeURIComponent(telemetryService.machineId)}`));
                        storageService.store(IS_CANDIDATE_KEY, false, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                        storageService.store(SKIP_VERSION_KEY, productService.version, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                    }
                }, {
                    label: (0, nls_1.localize)('remindLater', "Remind Me Later"),
                    run: () => {
                        telemetryService.publicLog(`${data.surveyId}.survey/remindMeLater`);
                        storageService.store(SESSION_COUNT_KEY, sessionCount - 3, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                    }
                }, {
                    label: (0, nls_1.localize)('neverAgain', "Don't Show Again"),
                    isSecondary: true,
                    run: () => {
                        telemetryService.publicLog(`${data.surveyId}.survey/dontShowAgain`);
                        storageService.store(IS_CANDIDATE_KEY, false, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                        storageService.store(SKIP_VERSION_KEY, productService.version, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                    }
                }], { sticky: true });
        }
    }
    let LanguageSurveysContribution = class LanguageSurveysContribution {
        constructor(storageService, notificationService, telemetryService, textFileService, openerService, productService, languageService, extensionService) {
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.textFileService = textFileService;
            this.openerService = openerService;
            this.productService = productService;
            this.languageService = languageService;
            this.extensionService = extensionService;
            this.handleSurveys();
        }
        async handleSurveys() {
            if (!this.productService.surveys) {
                return;
            }
            // Make sure to wait for installed extensions
            // being registered to show notifications
            // properly (https://github.com/microsoft/vscode/issues/121216)
            await this.extensionService.whenInstalledExtensionsRegistered();
            // Handle surveys
            this.productService.surveys
                .filter(surveyData => surveyData.surveyId && surveyData.editCount && surveyData.languageId && surveyData.surveyUrl && surveyData.userProbability)
                .map(surveyData => new LanguageSurvey(surveyData, this.storageService, this.notificationService, this.telemetryService, this.languageService, this.textFileService, this.openerService, this.productService));
        }
    };
    LanguageSurveysContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, notification_1.INotificationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, opener_1.IOpenerService),
        __param(5, productService_1.IProductService),
        __param(6, language_1.ILanguageService),
        __param(7, extensions_1.IExtensionService)
    ], LanguageSurveysContribution);
    if (platform_1.language === 'en') {
        const workbenchRegistry = platform_2.Registry.as(contributions_1.Extensions.Workbench);
        workbenchRegistry.registerWorkbenchContribution(LanguageSurveysContribution, 3 /* LifecyclePhase.Restored */);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VTdXJ2ZXlzLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc3VydmV5cy9icm93c2VyL2xhbmd1YWdlU3VydmV5cy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFxQmhHLE1BQU0sY0FBZSxTQUFRLHNCQUFVO1FBRXRDLFlBQ0MsSUFBaUIsRUFDakIsY0FBK0IsRUFDL0IsbUJBQXlDLEVBQ3pDLGdCQUFtQyxFQUNuQyxlQUFpQyxFQUNqQyxlQUFpQyxFQUNqQyxhQUE2QixFQUM3QixjQUErQjtZQUUvQixLQUFLLEVBQUUsQ0FBQztZQUVSLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxlQUFlLENBQUM7WUFDMUQsTUFBTSxxQkFBcUIsR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLGtCQUFrQixDQUFDO1lBQ2pFLE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxjQUFjLENBQUM7WUFDeEQsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLGNBQWMsQ0FBQztZQUN4RCxNQUFNLHlCQUF5QixHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsY0FBYyxDQUFDO1lBQ2pFLE1BQU0sd0JBQXdCLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxhQUFhLENBQUM7WUFFL0QsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IscUNBQTRCLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2pCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FB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