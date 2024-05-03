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
define(["require", "exports", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/product/common/productService", "vs/workbench/services/issue/common/issue", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/extensionManagement/browser/extensionBisect", "vs/platform/notification/common/notification", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/host/browser/host", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/instantiation/common/instantiation", "vs/platform/action/common/actionCommonCategories", "vs/platform/instantiation/common/extensions", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/storage/common/storage", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/workbench/common/contextkeys", "vs/platform/contextkey/common/contextkeys"], function (require, exports, nls_1, extensionManagement_1, productService_1, issue_1, lifecycle_1, actions_1, userDataProfile_1, dialogs_1, extensionBisect_1, notification_1, extensionManagement_2, host_1, userDataProfile_2, instantiation_1, actionCommonCategories_1, extensions_1, contextkey_1, platform_1, contributions_1, storage_1, opener_1, uri_1, contextkeys_1, contextkeys_2) {
    "use strict";
    var TroubleshootIssueService_1, IssueTroubleshootUi_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    const ITroubleshootIssueService = (0, instantiation_1.createDecorator)('ITroubleshootIssueService');
    var TroubleshootStage;
    (function (TroubleshootStage) {
        TroubleshootStage[TroubleshootStage["EXTENSIONS"] = 1] = "EXTENSIONS";
        TroubleshootStage[TroubleshootStage["WORKBENCH"] = 2] = "WORKBENCH";
    })(TroubleshootStage || (TroubleshootStage = {}));
    class TroubleShootState {
        static fromJSON(raw) {
            if (!raw) {
                return undefined;
            }
            try {
                const data = JSON.parse(raw);
                if ((data.stage === TroubleshootStage.EXTENSIONS || data.stage === TroubleshootStage.WORKBENCH)
                    && typeof data.profile === 'string') {
                    return new TroubleShootState(data.stage, data.profile);
                }
            }
            catch { /* ignore */ }
            return undefined;
        }
        constructor(stage, profile) {
            this.stage = stage;
            this.profile = profile;
        }
    }
    let TroubleshootIssueService = class TroubleshootIssueService extends lifecycle_1.Disposable {
        static { TroubleshootIssueService_1 = this; }
        static { this.storageKey = 'issueTroubleshootState'; }
        constructor(userDataProfileService, userDataProfilesService, userDataProfileManagementService, userDataProfileImportExportService, dialogService, extensionBisectService, notificationService, extensionManagementService, extensionEnablementService, issueService, productService, hostService, storageService, openerService) {
            super();
            this.userDataProfileService = userDataProfileService;
            this.userDataProfilesService = userDataProfilesService;
            this.userDataProfileManagementService = userDataProfileManagementService;
            this.userDataProfileImportExportService = userDataProfileImportExportService;
            this.dialogService = dialogService;
            this.extensionBisectService = extensionBisectService;
            this.notificationService = notificationService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.issueService = issueService;
            this.productService = productService;
            this.hostService = hostService;
            this.storageService = storageService;
            this.openerService = openerService;
        }
        isActive() {
            return this.state !== undefined;
        }
        async start() {
            if (this.isActive()) {
                throw new Error('invalid state');
            }
            const res = await this.dialogService.confirm({
                message: (0, nls_1.localize)('troubleshoot issue', "Troubleshoot Issue"),
                detail: (0, nls_1.localize)('detail.start', "Issue troubleshooting is a process to help you identify the cause for an issue. The cause for an issue can be a misconfiguration, due to an extension, or be {0} itself.\n\nDuring the process the window reloads repeatedly. Each time you must confirm if you are still seeing the issue.", this.productService.nameLong),
                primaryButton: (0, nls_1.localize)({ key: 'msg', comment: ['&& denotes a mnemonic'] }, "&&Troubleshoot Issue"),
                custom: true
            });
            if (!res.confirmed) {
                return;
            }
            const originalProfile = this.userDataProfileService.currentProfile;
            await this.userDataProfileImportExportService.createTroubleshootProfile();
            this.state = new TroubleShootState(TroubleshootStage.EXTENSIONS, originalProfile.id);
            await this.resume();
        }
        async resume() {
            if (!this.isActive()) {
                return;
            }
            if (this.state?.stage === TroubleshootStage.EXTENSIONS && !this.extensionBisectService.isActive) {
                await this.reproduceIssueWithExtensionsDisabled();
            }
            if (this.state?.stage === TroubleshootStage.WORKBENCH) {
                await this.reproduceIssueWithEmptyProfile();
            }
            await this.stop();
        }
        async stop() {
            if (!this.isActive()) {
                return;
            }
            if (this.notificationHandle) {
                this.notificationHandle.close();
                this.notificationHandle = undefined;
            }
            if (this.extensionBisectService.isActive) {
                await this.extensionBisectService.reset();
            }
            const profile = this.userDataProfilesService.profiles.find(p => p.id === this.state?.profile) ?? this.userDataProfilesService.defaultProfile;
            this.state = undefined;
            await this.userDataProfileManagementService.switchProfile(profile);
        }
        async reproduceIssueWithExtensionsDisabled() {
            if (!(await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */)).length) {
                this.state = new TroubleShootState(TroubleshootStage.WORKBENCH, this.state.profile);
                return;
            }
            const result = await this.askToReproduceIssue((0, nls_1.localize)('profile.extensions.disabled', "Issue troubleshooting is active and has temporarily disabled all installed extensions. Check if you can still reproduce the problem and proceed by selecting from these options."));
            if (result === 'good') {
                const profile = this.userDataProfilesService.profiles.find(p => p.id === this.state.profile) ?? this.userDataProfilesService.defaultProfile;
                await this.reproduceIssueWithExtensionsBisect(profile);
            }
            if (result === 'bad') {
                this.state = new TroubleShootState(TroubleshootStage.WORKBENCH, this.state.profile);
            }
            if (result === 'stop') {
                await this.stop();
            }
        }
        async reproduceIssueWithEmptyProfile() {
            await this.userDataProfileManagementService.createAndEnterTransientProfile();
            this.updateState(this.state);
            const result = await this.askToReproduceIssue((0, nls_1.localize)('empty.profile', "Issue troubleshooting is active and has temporarily reset your configurations to defaults. Check if you can still reproduce the problem and proceed by selecting from these options."));
            if (result === 'stop') {
                await this.stop();
            }
            if (result === 'good') {
                await this.askToReportIssue((0, nls_1.localize)('issue is with configuration', "Issue troubleshooting has identified that the issue is caused by your configurations. Please report the issue by exporting your configurations using \"Export Profile\" command and share the file in the issue report."));
            }
            if (result === 'bad') {
                await this.askToReportIssue((0, nls_1.localize)('issue is in core', "Issue troubleshooting has identified that the issue is with {0}.", this.productService.nameLong));
            }
        }
        async reproduceIssueWithExtensionsBisect(profile) {
            await this.userDataProfileManagementService.switchProfile(profile);
            const extensions = (await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */)).filter(ext => this.extensionEnablementService.isEnabled(ext));
            await this.extensionBisectService.start(extensions);
            await this.hostService.reload();
        }
        askToReproduceIssue(message) {
            return new Promise((c, e) => {
                const goodPrompt = {
                    label: (0, nls_1.localize)('I cannot reproduce', "I Can't Reproduce"),
                    run: () => c('good')
                };
                const badPrompt = {
                    label: (0, nls_1.localize)('This is Bad', "I Can Reproduce"),
                    run: () => c('bad')
                };
                const stop = {
                    label: (0, nls_1.localize)('Stop', "Stop"),
                    run: () => c('stop')
                };
                this.notificationHandle = this.notificationService.prompt(notification_1.Severity.Info, message, [goodPrompt, badPrompt, stop], { sticky: true, priority: notification_1.NotificationPriority.URGENT });
            });
        }
        async askToReportIssue(message) {
            let isCheckedInInsiders = false;
            if (this.productService.quality === 'stable') {
                const res = await this.askToReproduceIssueWithInsiders();
                if (res === 'good') {
                    await this.dialogService.prompt({
                        type: notification_1.Severity.Info,
                        message: (0, nls_1.localize)('troubleshoot issue', "Troubleshoot Issue"),
                        detail: (0, nls_1.localize)('use insiders', "This likely means that the issue has been addressed already and will be available in an upcoming release. You can safely use {0} insiders until the new stable version is available.", this.productService.nameLong),
                        custom: true
                    });
                    return;
                }
                if (res === 'stop') {
                    await this.stop();
                    return;
                }
                if (res === 'bad') {
                    isCheckedInInsiders = true;
                }
            }
            await this.issueService.openReporter({
                issueBody: `> ${message} ${isCheckedInInsiders ? `It is confirmed that the issue exists in ${this.productService.nameLong} Insiders` : ''}`,
            });
        }
        async askToReproduceIssueWithInsiders() {
            const confirmRes = await this.dialogService.confirm({
                type: 'info',
                message: (0, nls_1.localize)('troubleshoot issue', "Troubleshoot Issue"),
                primaryButton: (0, nls_1.localize)('download insiders', "Download {0} Insiders", this.productService.nameLong),
                cancelButton: (0, nls_1.localize)('report anyway', "Report Issue Anyway"),
                detail: (0, nls_1.localize)('ask to download insiders', "Please try to download and reproduce the issue in {0} insiders.", this.productService.nameLong),
                custom: {
                    disableCloseAction: true,
                }
            });
            if (!confirmRes.confirmed) {
                return undefined;
            }
            const opened = await this.openerService.open(uri_1.URI.parse('https://aka.ms/vscode-insiders'));
            if (!opened) {
                return undefined;
            }
            const res = await this.dialogService.prompt({
                type: 'info',
                message: (0, nls_1.localize)('troubleshoot issue', "Troubleshoot Issue"),
                buttons: [{
                        label: (0, nls_1.localize)('good', "I can't reproduce"),
                        run: () => 'good'
                    }, {
                        label: (0, nls_1.localize)('bad', "I can reproduce"),
                        run: () => 'bad'
                    }],
                cancelButton: {
                    label: (0, nls_1.localize)('stop', "Stop"),
                    run: () => 'stop'
                },
                detail: (0, nls_1.localize)('ask to reproduce issue', "Please try to reproduce the issue in {0} insiders and confirm if the issue exists there.", this.productService.nameLong),
                custom: {
                    disableCloseAction: true,
                }
            });
            return res.result;
        }
        get state() {
            if (this._state === undefined) {
                const raw = this.storageService.get(TroubleshootIssueService_1.storageKey, 0 /* StorageScope.PROFILE */);
                this._state = TroubleShootState.fromJSON(raw);
            }
            return this._state || undefined;
        }
        set state(state) {
            this._state = state ?? null;
            this.updateState(state);
        }
        updateState(state) {
            if (state) {
                this.storageService.store(TroubleshootIssueService_1.storageKey, JSON.stringify(state), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(TroubleshootIssueService_1.storageKey, 0 /* StorageScope.PROFILE */);
            }
        }
    };
    TroubleshootIssueService = TroubleshootIssueService_1 = __decorate([
        __param(0, userDataProfile_1.IUserDataProfileService),
        __param(1, userDataProfile_2.IUserDataProfilesService),
        __param(2, userDataProfile_1.IUserDataProfileManagementService),
        __param(3, userDataProfile_1.IUserDataProfileImportExportService),
        __param(4, dialogs_1.IDialogService),
        __param(5, extensionBisect_1.IExtensionBisectService),
        __param(6, notification_1.INotificationService),
        __param(7, extensionManagement_1.IExtensionManagementService),
        __param(8, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(9, issue_1.IWorkbenchIssueService),
        __param(10, productService_1.IProductService),
        __param(11, host_1.IHostService),
        __param(12, storage_1.IStorageService),
        __param(13, opener_1.IOpenerService)
    ], TroubleshootIssueService);
    let IssueTroubleshootUi = class IssueTroubleshootUi extends lifecycle_1.Disposable {
        static { IssueTroubleshootUi_1 = this; }
        static { this.ctxIsTroubleshootActive = new contextkey_1.RawContextKey('isIssueTroubleshootActive', false); }
        constructor(contextKeyService, troubleshootIssueService, storageService) {
            super();
            this.contextKeyService = contextKeyService;
            this.troubleshootIssueService = troubleshootIssueService;
            this.updateContext();
            if (troubleshootIssueService.isActive()) {
                troubleshootIssueService.resume();
            }
            this._register(storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, TroubleshootIssueService.storageKey, this._register(new lifecycle_1.DisposableStore()))(() => {
                this.updateContext();
            }));
        }
        updateContext() {
            IssueTroubleshootUi_1.ctxIsTroubleshootActive.bindTo(this.contextKeyService).set(this.troubleshootIssueService.isActive());
        }
    };
    IssueTroubleshootUi = IssueTroubleshootUi_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, ITroubleshootIssueService),
        __param(2, storage_1.IStorageService)
    ], IssueTroubleshootUi);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(IssueTroubleshootUi, 3 /* LifecyclePhase.Restored */);
    (0, actions_1.registerAction2)(class TroubleshootIssueAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.troubleshootIssue.start',
                title: (0, nls_1.localize2)('troubleshootIssue', 'Troubleshoot Issue...'),
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(IssueTroubleshootUi.ctxIsTroubleshootActive.negate(), contextkeys_1.RemoteNameContext.isEqualTo(''), contextkeys_2.IsWebContext.negate()),
            });
        }
        run(accessor) {
            return accessor.get(ITroubleshootIssueService).start();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.troubleshootIssue.stop',
                title: (0, nls_1.localize2)('title.stop', 'Stop Troubleshoot Issue'),
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                precondition: IssueTroubleshootUi.ctxIsTroubleshootActive
            });
        }
        async run(accessor) {
            return accessor.get(ITroubleshootIssueService).stop();
        }
    });
    (0, extensions_1.registerSingleton)(ITroubleshootIssueService, TroubleshootIssueService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVUcm91Ymxlc2hvb3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9pc3N1ZS9icm93c2VyL2lzc3VlVHJvdWJsZXNob290LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTZCaEcsTUFBTSx5QkFBeUIsR0FBRyxJQUFBLCtCQUFlLEVBQTRCLDJCQUEyQixDQUFDLENBQUM7SUFVMUcsSUFBSyxpQkFHSjtJQUhELFdBQUssaUJBQWlCO1FBQ3JCLHFFQUFjLENBQUE7UUFDZCxtRUFBUyxDQUFBO0lBQ1YsQ0FBQyxFQUhJLGlCQUFpQixLQUFqQixpQkFBaUIsUUFHckI7SUFJRCxNQUFNLGlCQUFpQjtRQUV0QixNQUFNLENBQUMsUUFBUSxDQUFDLEdBQXVCO1lBQ3RDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDVixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsSUFBSSxDQUFDO2dCQUVKLE1BQU0sSUFBSSxHQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2xDLElBQ0MsQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLGlCQUFpQixDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLGlCQUFpQixDQUFDLFNBQVMsQ0FBQzt1QkFDeEYsT0FBTyxJQUFJLENBQUMsT0FBTyxLQUFLLFFBQVEsRUFDbEMsQ0FBQztvQkFDRixPQUFPLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3hELENBQUM7WUFDRixDQUFDO1lBQUMsTUFBTSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDeEIsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVE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