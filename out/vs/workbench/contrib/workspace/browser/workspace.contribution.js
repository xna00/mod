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
define(["require", "exports", "vs/platform/instantiation/common/descriptors", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/contributions", "vs/base/common/codicons", "vs/workbench/services/editor/common/editorService", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/browser/editor", "vs/workbench/contrib/workspace/browser/workspaceTrustEditor", "vs/workbench/services/workspaces/browser/workspaceTrustEditorInput", "vs/workbench/services/workspaces/common/workspaceTrust", "vs/workbench/common/editor", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/base/common/path", "vs/platform/configuration/common/configuration", "vs/base/common/htmlContent", "vs/platform/storage/common/storage", "vs/workbench/services/host/browser/host", "vs/workbench/services/banner/browser/bannerService", "vs/platform/workspace/common/virtualWorkspace", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/services/preferences/common/preferences", "vs/platform/label/common/label", "vs/platform/product/common/productService", "vs/workbench/contrib/workspace/common/workspace", "vs/base/common/platform", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/common/configuration", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/css!./media/workspaceTrustEditor"], function (require, exports, descriptors_1, lifecycle_1, nls_1, actions_1, configurationRegistry_1, dialogs_1, instantiation_1, notification_1, platform_1, workspaceTrust_1, contributions_1, codicons_1, editorService_1, contextkey_1, commands_1, statusbar_1, editor_1, workspaceTrustEditor_1, workspaceTrustEditorInput_1, workspaceTrust_2, editor_2, telemetry_1, workspace_1, path_1, configuration_1, htmlContent_1, storage_1, host_1, bannerService_1, virtualWorkspace_1, extensions_1, environmentService_1, preferences_1, preferences_2, label_1, productService_1, workspace_2, platform_2, remoteAgentService_1, configuration_2, resources_1, uri_1, environment_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTrustUXHandler = exports.WorkspaceTrustRequestHandler = exports.WorkspaceTrustContextKeys = void 0;
    const BANNER_RESTRICTED_MODE = 'workbench.banner.restrictedMode';
    const STARTUP_PROMPT_SHOWN_KEY = 'workspace.trust.startupPrompt.shown';
    const BANNER_RESTRICTED_MODE_DISMISSED_KEY = 'workbench.banner.restrictedMode.dismissed';
    let WorkspaceTrustContextKeys = class WorkspaceTrustContextKeys extends lifecycle_1.Disposable {
        constructor(contextKeyService, workspaceTrustEnablementService, workspaceTrustManagementService) {
            super();
            this._ctxWorkspaceTrustEnabled = workspace_2.WorkspaceTrustContext.IsEnabled.bindTo(contextKeyService);
            this._ctxWorkspaceTrustEnabled.set(workspaceTrustEnablementService.isWorkspaceTrustEnabled());
            this._ctxWorkspaceTrustState = workspace_2.WorkspaceTrustContext.IsTrusted.bindTo(contextKeyService);
            this._ctxWorkspaceTrustState.set(workspaceTrustManagementService.isWorkspaceTrusted());
            this._register(workspaceTrustManagementService.onDidChangeTrust(trusted => this._ctxWorkspaceTrustState.set(trusted)));
        }
    };
    exports.WorkspaceTrustContextKeys = WorkspaceTrustContextKeys;
    exports.WorkspaceTrustContextKeys = WorkspaceTrustContextKeys = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, workspaceTrust_1.IWorkspaceTrustEnablementService),
        __param(2, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], WorkspaceTrustContextKeys);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(WorkspaceTrustContextKeys, 3 /* LifecyclePhase.Restored */);
    /*
     * Trust Request via Service UX handler
     */
    let WorkspaceTrustRequestHandler = class WorkspaceTrustRequestHandler extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.workspaceTrustRequestHandler'; }
        constructor(dialogService, commandService, workspaceContextService, workspaceTrustManagementService, workspaceTrustRequestService) {
            super();
            this.dialogService = dialogService;
            this.commandService = commandService;
            this.workspaceContextService = workspaceContextService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.registerListeners();
        }
        get useWorkspaceLanguage() {
            return !(0, workspace_1.isSingleFolderWorkspaceIdentifier)((0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace()));
        }
        registerListeners() {
            // Open files trust request
            this._register(this.workspaceTrustRequestService.onDidInitiateOpenFilesTrustRequest(async () => {
                await this.workspaceTrustManagementService.workspaceResolved;
                // Details
                const markdownDetails = [
                    this.workspaceContextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ?
                        (0, nls_1.localize)('openLooseFileWorkspaceDetails', "You are trying to open untrusted files in a workspace which is trusted.") :
                        (0, nls_1.localize)('openLooseFileWindowDetails', "You are trying to open untrusted files in a window which is trusted."),
                    (0, nls_1.localize)('openLooseFileLearnMore', "If you don't want to open untrusted files, we recommend to open them in Restricted Mode in a new window as the files may be malicious. See [our docs](https://aka.ms/vscode-workspace-trust) to learn more.")
                ];
                // Dialog
                await this.dialogService.prompt({
                    type: notification_1.Severity.Info,
                    message: this.workspaceContextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ?
                        (0, nls_1.localize)('openLooseFileWorkspaceMesssage', "Do you want to allow untrusted files in this workspace?") :
                        (0, nls_1.localize)('openLooseFileWindowMesssage', "Do you want to allow untrusted files in this window?"),
                    buttons: [
                        {
                            label: (0, nls_1.localize)({ key: 'open', comment: ['&& denotes a mnemonic'] }, "&&Open"),
                            run: ({ checkboxChecked }) => this.workspaceTrustRequestService.completeOpenFilesTrustRequest(1 /* WorkspaceTrustUriResponse.Open */, !!checkboxChecked)
                        },
                        {
                            label: (0, nls_1.localize)({ key: 'newWindow', comment: ['&& denotes a mnemonic'] }, "Open in &&Restricted Mode"),
                            run: ({ checkboxChecked }) => this.workspaceTrustRequestService.completeOpenFilesTrustRequest(2 /* WorkspaceTrustUriResponse.OpenInNewWindow */, !!checkboxChecked)
                        }
                    ],
                    cancelButton: {
                        run: () => this.workspaceTrustRequestService.completeOpenFilesTrustRequest(3 /* WorkspaceTrustUriResponse.Cancel */)
                    },
                    checkbox: {
                        label: (0, nls_1.localize)('openLooseFileWorkspaceCheckbox', "Remember my decision for all workspaces"),
                        checked: false
                    },
                    custom: {
                        icon: codicons_1.Codicon.shield,
                        markdownDetails: markdownDetails.map(md => { return { markdown: new htmlContent_1.MarkdownString(md) }; })
                    }
                });
            }));
            // Workspace trust request
            this._register(this.workspaceTrustRequestService.onDidInitiateWorkspaceTrustRequest(async (requestOptions) => {
                await this.workspaceTrustManagementService.workspaceResolved;
                // Title
                const message = this.useWorkspaceLanguage ?
                    (0, nls_1.localize)('workspaceTrust', "Do you trust the authors of the files in this workspace?") :
                    (0, nls_1.localize)('folderTrust', "Do you trust the authors of the files in this folder?");
                // Message
                const defaultDetails = (0, nls_1.localize)('immediateTrustRequestMessage', "A feature you are trying to use may be a security risk if you do not trust the source of the files or folders you currently have open.");
                const details = requestOptions?.message ?? defaultDetails;
                // Buttons
                const buttons = requestOptions?.buttons ?? [
                    { label: this.useWorkspaceLanguage ? (0, nls_1.localize)({ key: 'grantWorkspaceTrustButton', comment: ['&& denotes a mnemonic'] }, "&&Trust Workspace & Continue") : (0, nls_1.localize)({ key: 'grantFolderTrustButton', comment: ['&& denotes a mnemonic'] }, "&&Trust Folder & Continue"), type: 'ContinueWithTrust' },
                    { label: (0, nls_1.localize)({ key: 'manageWorkspaceTrustButton', comment: ['&& denotes a mnemonic'] }, "&&Manage"), type: 'Manage' }
                ];
                // Add Cancel button if not provided
                if (!buttons.some(b => b.type === 'Cancel')) {
                    buttons.push({ label: (0, nls_1.localize)('cancelWorkspaceTrustButton', "Cancel"), type: 'Cancel' });
                }
                // Dialog
                const { result } = await this.dialogService.prompt({
                    type: notification_1.Severity.Info,
                    message,
                    custom: {
                        icon: codicons_1.Codicon.shield,
                        markdownDetails: [
                            { markdown: new htmlContent_1.MarkdownString(details) },
                            { markdown: new htmlContent_1.MarkdownString((0, nls_1.localize)('immediateTrustRequestLearnMore', "If you don't trust the authors of these files, we do not recommend continuing as the files may be malicious. See [our docs](https://aka.ms/vscode-workspace-trust) to learn more.")) }
                        ]
                    },
                    buttons: buttons.filter(b => b.type !== 'Cancel').map(button => {
                        return {
                            label: button.label,
                            run: () => button.type
                        };
                    }),
                    cancelButton: (() => {
                        const cancelButton = buttons.find(b => b.type === 'Cancel');
                        if (!cancelButton) {
                            return undefined;
                        }
                        return {
                            label: cancelButton.label,
                            run: () => cancelButton.type
                        };
                    })()
                });
                // Dialog result
                switch (result) {
                    case 'ContinueWithTrust':
                        await this.workspaceTrustRequestService.completeWorkspaceTrustRequest(true);
                        break;
                    case 'ContinueWithoutTrust':
                        await this.workspaceTrustRequestService.completeWorkspaceTrustRequest(undefined);
                        break;
                    case 'Manage':
                        this.workspaceTrustRequestService.cancelWorkspaceTrustRequest();
                        await this.commandService.executeCommand(workspace_2.MANAGE_TRUST_COMMAND_ID);
                        break;
                    case 'Cancel':
                        this.workspaceTrustRequestService.cancelWorkspaceTrustRequest();
                        break;
                }
            }));
        }
    };
    exports.WorkspaceTrustRequestHandler = WorkspaceTrustRequestHandler;
    exports.WorkspaceTrustRequestHandler = WorkspaceTrustRequestHandler = __decorate([
        __param(0, dialogs_1.IDialogService),
        __param(1, commands_1.ICommandService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(4, workspaceTrust_1.IWorkspaceTrustRequestService)
    ], WorkspaceTrustRequestHandler);
    /*
     * Trust UX and Startup Handler
     */
    let WorkspaceTrustUXHandler = class WorkspaceTrustUXHandler extends lifecycle_1.Disposable {
        constructor(dialogService, workspaceContextService, workspaceTrustEnablementService, workspaceTrustManagementService, configurationService, statusbarService, storageService, workspaceTrustRequestService, bannerService, labelService, hostService, productService, remoteAgentService, environmentService, fileService) {
            super();
            this.dialogService = dialogService;
            this.workspaceContextService = workspaceContextService;
            this.workspaceTrustEnablementService = workspaceTrustEnablementService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.configurationService = configurationService;
            this.statusbarService = statusbarService;
            this.storageService = storageService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.bannerService = bannerService;
            this.labelService = labelService;
            this.hostService = hostService;
            this.productService = productService;
            this.remoteAgentService = remoteAgentService;
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.entryId = `status.workspaceTrust`;
            this.statusbarEntryAccessor = this._register(new lifecycle_1.MutableDisposable());
            (async () => {
                await this.workspaceTrustManagementService.workspaceTrustInitialized;
                if (this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                    this.registerListeners();
                    this.updateStatusbarEntry(this.workspaceTrustManagementService.isWorkspaceTrusted());
                    // Show modal dialog
                    if (this.hostService.hasFocus) {
                        this.showModalOnStart();
                    }
                    else {
                        const focusDisposable = this.hostService.onDidChangeFocus(focused => {
                            if (focused) {
                                focusDisposable.dispose();
                                this.showModalOnStart();
                            }
                        });
                    }
                }
            })();
        }
        registerListeners() {
            this._register(this.workspaceContextService.onWillChangeWorkspaceFolders(e => {
                if (e.fromCache) {
                    return;
                }
                if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                    return;
                }
                const addWorkspaceFolder = async (e) => {
                    const trusted = this.workspaceTrustManagementService.isWorkspaceTrusted();
                    // Workspace is trusted and there are added/changed folders
                    if (trusted && (e.changes.added.length || e.changes.changed.length)) {
                        const addedFoldersTrustInfo = await Promise.all(e.changes.added.map(folder => this.workspaceTrustManagementService.getUriTrustInfo(folder.uri)));
                        if (!addedFoldersTrustInfo.map(info => info.trusted).every(trusted => trusted)) {
                            const { confirmed } = await this.dialogService.confirm({
                                type: notification_1.Severity.Info,
                                message: (0, nls_1.localize)('addWorkspaceFolderMessage', "Do you trust the authors of the files in this folder?"),
                                detail: (0, nls_1.localize)('addWorkspaceFolderDetail', "You are adding files that are not currently trusted to a trusted workspace. Do you trust the authors of these new files?"),
                                cancelButton: (0, nls_1.localize)('no', 'No'),
                                custom: { icon: codicons_1.Codicon.shield }
                            });
                            // Mark added/changed folders as trusted
                            await this.workspaceTrustManagementService.setUrisTrust(addedFoldersTrustInfo.map(i => i.uri), confirmed);
                        }
                    }
                };
                return e.join(addWorkspaceFolder(e));
            }));
            this._register(this.workspaceTrustManagementService.onDidChangeTrust(trusted => {
                this.updateWorkbenchIndicators(trusted);
            }));
            this._register(this.workspaceTrustRequestService.onDidInitiateWorkspaceTrustRequestOnStartup(async () => {
                let titleString;
                let learnMoreString;
                let trustOption;
                let dontTrustOption;
                const isAiGeneratedWorkspace = await this.isAiGeneratedWorkspace();
                if (isAiGeneratedWorkspace && this.productService.aiGeneratedWorkspaceTrust) {
                    titleString = this.productService.aiGeneratedWorkspaceTrust.title;
                    learnMoreString = this.productService.aiGeneratedWorkspaceTrust.startupTrustRequestLearnMore;
                    trustOption = this.productService.aiGeneratedWorkspaceTrust.trustOption;
                    dontTrustOption = this.productService.aiGeneratedWorkspaceTrust.dontTrustOption;
                }
                else {
                    console.warn('AI generated workspace trust dialog contents not available.');
                }
                const title = titleString ?? (this.useWorkspaceLanguage ?
                    (0, nls_1.localize)('workspaceTrust', "Do you trust the authors of the files in this workspace?") :
                    (0, nls_1.localize)('folderTrust', "Do you trust the authors of the files in this folder?"));
                let checkboxText;
                const workspaceIdentifier = (0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace());
                const isSingleFolderWorkspace = (0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceIdentifier);
                const isEmptyWindow = (0, workspace_1.isEmptyWorkspaceIdentifier)(workspaceIdentifier);
                if (!isAiGeneratedWorkspace && this.workspaceTrustManagementService.canSetParentFolderTrust()) {
                    const name = (0, resources_1.basename)((0, resources_1.dirname)(workspaceIdentifier.uri));
                    checkboxText = (0, nls_1.localize)('checkboxString', "Trust the authors of all files in the parent folder '{0}'", name);
                }
                // Show Workspace Trust Start Dialog
                this.doShowModal(title, { label: trustOption ?? (0, nls_1.localize)({ key: 'trustOption', comment: ['&& denotes a mnemonic'] }, "&&Yes, I trust the authors"), sublabel: isSingleFolderWorkspace ? (0, nls_1.localize)('trustFolderOptionDescription', "Trust folder and enable all features") : (0, nls_1.localize)('trustWorkspaceOptionDescription', "Trust workspace and enable all features") }, { label: dontTrustOption ?? (0, nls_1.localize)({ key: 'dontTrustOption', comment: ['&& denotes a mnemonic'] }, "&&No, I don't trust the authors"), sublabel: isSingleFolderWorkspace ? (0, nls_1.localize)('dontTrustFolderOptionDescription', "Browse folder in restricted mode") : (0, nls_1.localize)('dontTrustWorkspaceOptionDescription', "Browse workspace in restricted mode") }, [
                    !isSingleFolderWorkspace ?
                        (0, nls_1.localize)('workspaceStartupTrustDetails', "{0} provides features that may automatically execute files in this workspace.", this.productService.nameShort) :
                        (0, nls_1.localize)('folderStartupTrustDetails', "{0} provides features that may automatically execute files in this folder.", this.productService.nameShort),
                    learnMoreString ?? (0, nls_1.localize)('startupTrustRequestLearnMore', "If you don't trust the authors of these files, we recommend to continue in restricted mode as the files may be malicious. See [our docs](https://aka.ms/vscode-workspace-trust) to learn more."),
                    !isEmptyWindow ?
                        `\`${this.labelService.getWorkspaceLabel(workspaceIdentifier, { verbose: 2 /* Verbosity.LONG */ })}\`` : '',
                ], checkboxText);
            }));
        }
        updateWorkbenchIndicators(trusted) {
            const bannerItem = this.getBannerItem(!trusted);
            this.updateStatusbarEntry(trusted);
            if (bannerItem) {
                if (!trusted) {
                    this.bannerService.show(bannerItem);
                }
                else {
                    this.bannerService.hide(BANNER_RESTRICTED_MODE);
                }
            }
        }
        //#region Dialog
        async doShowModal(question, trustedOption, untrustedOption, markdownStrings, trustParentString) {
            await this.dialogService.prompt({
                type: notification_1.Severity.Info,
                message: question,
                checkbox: trustParentString ? {
                    label: trustParentString
                } : undefined,
                buttons: [
                    {
                        label: trustedOption.label,
                        run: async ({ checkboxChecked }) => {
                            if (checkboxChecked) {
                                await this.workspaceTrustManagementService.setParentFolderTrust(true);
                            }
                            else {
                                await this.workspaceTrustRequestService.completeWorkspaceTrustRequest(true);
                            }
                        }
                    },
                    {
                        label: untrustedOption.label,
                        run: () => {
                            this.updateWorkbenchIndicators(false);
                            this.workspaceTrustRequestService.cancelWorkspaceTrustRequest();
                        }
                    }
                ],
                custom: {
                    buttonDetails: [
                        trustedOption.sublabel,
                        untrustedOption.sublabel
                    ],
                    disableCloseAction: true,
                    icon: codicons_1.Codicon.shield,
                    markdownDetails: markdownStrings.map(md => { return { markdown: new htmlContent_1.MarkdownString(md) }; })
                }
            });
            this.storageService.store(STARTUP_PROMPT_SHOWN_KEY, true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        async showModalOnStart() {
            if (this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                this.updateWorkbenchIndicators(true);
                return;
            }
            // Don't show modal prompt if workspace trust cannot be changed
            if (!(this.workspaceTrustManagementService.canSetWorkspaceTrust())) {
                return;
            }
            // Don't show modal prompt for virtual workspaces by default
            if ((0, virtualWorkspace_1.isVirtualWorkspace)(this.workspaceContextService.getWorkspace())) {
                this.updateWorkbenchIndicators(false);
                return;
            }
            // Don't show modal prompt for empty workspaces by default
            if (this.workspaceContextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                this.updateWorkbenchIndicators(false);
                return;
            }
            if (this.startupPromptSetting === 'never') {
                this.updateWorkbenchIndicators(false);
                return;
            }
            if (this.startupPromptSetting === 'once' && this.storageService.getBoolean(STARTUP_PROMPT_SHOWN_KEY, 1 /* StorageScope.WORKSPACE */, false)) {
                this.updateWorkbenchIndicators(false);
                return;
            }
            // Use the workspace trust request service to show modal dialog
            this.workspaceTrustRequestService.requestWorkspaceTrustOnStartup();
        }
        get startupPromptSetting() {
            return this.configurationService.getValue(workspaceTrust_2.WORKSPACE_TRUST_STARTUP_PROMPT);
        }
        get useWorkspaceLanguage() {
            return !(0, workspace_1.isSingleFolderWorkspaceIdentifier)((0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace()));
        }
        async isAiGeneratedWorkspace() {
            const aiGeneratedWorkspaces = uri_1.URI.joinPath(this.environmentService.workspaceStorageHome, 'aiGeneratedWorkspaces.json');
            return await this.fileService.exists(aiGeneratedWorkspaces).then(async (result) => {
                if (result) {
                    try {
                        const content = await this.fileService.readFile(aiGeneratedWorkspaces);
                        const workspaces = JSON.parse(content.value.toString());
                        if (workspaces.indexOf(this.workspaceContextService.getWorkspace().folders[0].uri.toString()) > -1) {
                            return true;
                        }
                    }
                    catch (e) {
                        // Ignore errors when resolving file contents
                    }
                }
                return false;
            });
        }
        //#endregion
        //#region Banner
        getBannerItem(restrictedMode) {
            const dismissedRestricted = this.storageService.getBoolean(BANNER_RESTRICTED_MODE_DISMISSED_KEY, 1 /* StorageScope.WORKSPACE */, false);
            // never show the banner
            if (this.bannerSetting === 'never') {
                return undefined;
            }
            // info has been dismissed
            if (this.bannerSetting === 'untilDismissed' && dismissedRestricted) {
                return undefined;
            }
            const actions = [
                {
                    label: (0, nls_1.localize)('restrictedModeBannerManage', "Manage"),
                    href: 'command:' + workspace_2.MANAGE_TRUST_COMMAND_ID
                },
                {
                    label: (0, nls_1.localize)('restrictedModeBannerLearnMore', "Learn More"),
                    href: 'https://aka.ms/vscode-workspace-trust'
                }
            ];
            return {
                id: BANNER_RESTRICTED_MODE,
                icon: workspaceTrustEditor_1.shieldIcon,
                ariaLabel: this.getBannerItemAriaLabels(),
                message: this.getBannerItemMessages(),
                actions,
                onClose: () => {
                    if (restrictedMode) {
                        this.storageService.store(BANNER_RESTRICTED_MODE_DISMISSED_KEY, true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                    }
                }
            };
        }
        getBannerItemAriaLabels() {
            switch (this.workspaceContextService.getWorkbenchState()) {
                case 1 /* WorkbenchState.EMPTY */:
                    return (0, nls_1.localize)('restrictedModeBannerAriaLabelWindow', "Restricted Mode is intended for safe code browsing. Trust this window to enable all features. Use navigation keys to access banner actions.");
                case 2 /* WorkbenchState.FOLDER */:
                    return (0, nls_1.localize)('restrictedModeBannerAriaLabelFolder', "Restricted Mode is intended for safe code browsing. Trust this folder to enable all features. Use navigation keys to access banner actions.");
                case 3 /* WorkbenchState.WORKSPACE */:
                    return (0, nls_1.localize)('restrictedModeBannerAriaLabelWorkspace', "Restricted Mode is intended for safe code browsing. Trust this workspace to enable all features. Use navigation keys to access banner actions.");
            }
        }
        getBannerItemMessages() {
            switch (this.workspaceContextService.getWorkbenchState()) {
                case 1 /* WorkbenchState.EMPTY */:
                    return (0, nls_1.localize)('restrictedModeBannerMessageWindow', "Restricted Mode is intended for safe code browsing. Trust this window to enable all features.");
                case 2 /* WorkbenchState.FOLDER */:
                    return (0, nls_1.localize)('restrictedModeBannerMessageFolder', "Restricted Mode is intended for safe code browsing. Trust this folder to enable all features.");
                case 3 /* WorkbenchState.WORKSPACE */:
                    return (0, nls_1.localize)('restrictedModeBannerMessageWorkspace', "Restricted Mode is intended for safe code browsing. Trust this workspace to enable all features.");
            }
        }
        get bannerSetting() {
            const result = this.configurationService.getValue(workspaceTrust_2.WORKSPACE_TRUST_BANNER);
            // In serverless environments, we don't need to aggressively show the banner
            if (result !== 'always' && platform_2.isWeb && !this.remoteAgentService.getConnection()?.remoteAuthority) {
                return 'never';
            }
            return result;
        }
        //#endregion
        //#region Statusbar
        getStatusbarEntry(trusted) {
            const text = (0, workspaceTrust_1.workspaceTrustToString)(trusted);
            let ariaLabel = '';
            let toolTip;
            switch (this.workspaceContextService.getWorkbenchState()) {
                case 1 /* WorkbenchState.EMPTY */: {
                    ariaLabel = trusted ? (0, nls_1.localize)('status.ariaTrustedWindow', "This window is trusted.") :
                        (0, nls_1.localize)('status.ariaUntrustedWindow', "Restricted Mode: Some features are disabled because this window is not trusted.");
                    toolTip = trusted ? ariaLabel : {
                        value: (0, nls_1.localize)({ key: 'status.tooltipUntrustedWindow2', comment: ['[abc]({n}) are links.  Only translate `features are disabled` and `window is not trusted`. Do not change brackets and parentheses or {n}'] }, "Running in Restricted Mode\n\nSome [features are disabled]({0}) because this [window is not trusted]({1}).", `command:${extensions_1.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID}`, `command:${workspace_2.MANAGE_TRUST_COMMAND_ID}`),
                        isTrusted: true,
                        supportThemeIcons: true
                    };
                    break;
                }
                case 2 /* WorkbenchState.FOLDER */: {
                    ariaLabel = trusted ? (0, nls_1.localize)('status.ariaTrustedFolder', "This folder is trusted.") :
                        (0, nls_1.localize)('status.ariaUntrustedFolder', "Restricted Mode: Some features are disabled because this folder is not trusted.");
                    toolTip = trusted ? ariaLabel : {
                        value: (0, nls_1.localize)({ key: 'status.tooltipUntrustedFolder2', comment: ['[abc]({n}) are links.  Only translate `features are disabled` and `folder is not trusted`. Do not change brackets and parentheses or {n}'] }, "Running in Restricted Mode\n\nSome [features are disabled]({0}) because this [folder is not trusted]({1}).", `command:${extensions_1.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID}`, `command:${workspace_2.MANAGE_TRUST_COMMAND_ID}`),
                        isTrusted: true,
                        supportThemeIcons: true
                    };
                    break;
                }
                case 3 /* WorkbenchState.WORKSPACE */: {
                    ariaLabel = trusted ? (0, nls_1.localize)('status.ariaTrustedWorkspace', "This workspace is trusted.") :
                        (0, nls_1.localize)('status.ariaUntrustedWorkspace', "Restricted Mode: Some features are disabled because this workspace is not trusted.");
                    toolTip = trusted ? ariaLabel : {
                        value: (0, nls_1.localize)({ key: 'status.tooltipUntrustedWorkspace2', comment: ['[abc]({n}) are links. Only translate `features are disabled` and `workspace is not trusted`. Do not change brackets and parentheses or {n}'] }, "Running in Restricted Mode\n\nSome [features are disabled]({0}) because this [workspace is not trusted]({1}).", `command:${extensions_1.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID}`, `command:${workspace_2.MANAGE_TRUST_COMMAND_ID}`),
                        isTrusted: true,
                        supportThemeIcons: true
                    };
                    break;
                }
            }
            return {
                name: (0, nls_1.localize)('status.WorkspaceTrust', "Workspace Trust"),
                text: trusted ? `$(shield)` : `$(shield) ${text}`,
                ariaLabel: ariaLabel,
                tooltip: toolTip,
                command: workspace_2.MANAGE_TRUST_COMMAND_ID,
                kind: 'prominent'
            };
        }
        updateStatusbarEntry(trusted) {
            if (trusted && this.statusbarEntryAccessor.value) {
                this.statusbarEntryAccessor.clear();
                return;
            }
            if (!trusted && !this.statusbarEntryAccessor.value) {
                const entry = this.getStatusbarEntry(trusted);
                this.statusbarEntryAccessor.value = this.statusbarService.addEntry(entry, this.entryId, 0 /* StatusbarAlignment.LEFT */, 0.99 * Number.MAX_VALUE /* Right of remote indicator */);
            }
        }
    };
    exports.WorkspaceTrustUXHandler = WorkspaceTrustUXHandler;
    exports.WorkspaceTrustUXHandler = WorkspaceTrustUXHandler = __decorate([
        __param(0, dialogs_1.IDialogService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, workspaceTrust_1.IWorkspaceTrustEnablementService),
        __param(3, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, statusbar_1.IStatusbarService),
        __param(6, storage_1.IStorageService),
        __param(7, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(8, bannerService_1.IBannerService),
        __param(9, label_1.ILabelService),
        __param(10, host_1.IHostService),
        __param(11, productService_1.IProductService),
        __param(12, remoteAgentService_1.IRemoteAgentService),
        __param(13, environment_1.IEnvironmentService),
        __param(14, files_1.IFileService)
    ], WorkspaceTrustUXHandler);
    (0, contributions_1.registerWorkbenchContribution2)(WorkspaceTrustRequestHandler.ID, WorkspaceTrustRequestHandler, 2 /* WorkbenchPhase.BlockRestore */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(WorkspaceTrustUXHandler, 3 /* LifecyclePhase.Restored */);
    /**
     * Trusted Workspace GUI Editor
     */
    class WorkspaceTrustEditorInputSerializer {
        canSerialize(editorInput) {
            return true;
        }
        serialize(input) {
            return '';
        }
        deserialize(instantiationService) {
            return instantiationService.createInstance(workspaceTrustEditorInput_1.WorkspaceTrustEditorInput);
        }
    }
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory)
        .registerEditorSerializer(workspaceTrustEditorInput_1.WorkspaceTrustEditorInput.ID, WorkspaceTrustEditorInputSerializer);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(workspaceTrustEditor_1.WorkspaceTrustEditor, workspaceTrustEditor_1.WorkspaceTrustEditor.ID, (0, nls_1.localize)('workspaceTrustEditor', "Workspace Trust Editor")), [
        new descriptors_1.SyncDescriptor(workspaceTrustEditorInput_1.WorkspaceTrustEditorInput)
    ]);
    /*
     * Actions
     */
    // Configure Workspace Trust Settings
    const CONFIGURE_TRUST_COMMAND_ID = 'workbench.trust.configure';
    const WORKSPACES_CATEGORY = (0, nls_1.localize2)('workspacesCategory', 'Workspaces');
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: CONFIGURE_TRUST_COMMAND_ID,
                title: (0, nls_1.localize2)('configureWorkspaceTrustSettings', "Configure Workspace Trust Settings"),
                precondition: contextkey_1.ContextKeyExpr.and(workspace_2.WorkspaceTrustContext.IsEnabled, contextkey_1.ContextKeyExpr.equals(`config.${workspaceTrust_2.WORKSPACE_TRUST_ENABLED}`, true)),
                category: WORKSPACES_CATEGORY,
                f1: true
            });
        }
        run(accessor) {
            accessor.get(preferences_2.IPreferencesService).openUserSettings({ jsonEditor: false, query: `@tag:${preferences_1.WORKSPACE_TRUST_SETTING_TAG}` });
        }
    });
    // Manage Workspace Trust
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: workspace_2.MANAGE_TRUST_COMMAND_ID,
                title: (0, nls_1.localize2)('manageWorkspaceTrust', "Manage Workspace Trust"),
                precondition: contextkey_1.ContextKeyExpr.and(workspace_2.WorkspaceTrustContext.IsEnabled, contextkey_1.ContextKeyExpr.equals(`config.${workspaceTrust_2.WORKSPACE_TRUST_ENABLED}`, true)),
                category: WORKSPACES_CATEGORY,
                f1: true,
            });
        }
        run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const input = instantiationService.createInstance(workspaceTrustEditorInput_1.WorkspaceTrustEditorInput);
            editorService.openEditor(input, { pinned: true });
            return;
        }
    });
    /*
     * Configuration
     */
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        ...configuration_2.securityConfigurationNodeBase,
        properties: {
            [workspaceTrust_2.WORKSPACE_TRUST_ENABLED]: {
                type: 'boolean',
                default: true,
                description: (0, nls_1.localize)('workspace.trust.description', "Controls whether or not Workspace Trust is enabled within VS Code."),
                tags: [preferences_1.WORKSPACE_TRUST_SETTING_TAG],
                scope: 1 /* ConfigurationScope.APPLICATION */,
            },
            [workspaceTrust_2.WORKSPACE_TRUST_STARTUP_PROMPT]: {
                type: 'string',
                default: 'once',
                description: (0, nls_1.localize)('workspace.trust.startupPrompt.description', "Controls when the startup prompt to trust a workspace is shown."),
                tags: [preferences_1.WORKSPACE_TRUST_SETTING_TAG],
                scope: 1 /* ConfigurationScope.APPLICATION */,
                enum: ['always', 'once', 'never'],
                enumDescriptions: [
                    (0, nls_1.localize)('workspace.trust.startupPrompt.always', "Ask for trust every time an untrusted workspace is opened."),
                    (0, nls_1.localize)('workspace.trust.startupPrompt.once', "Ask for trust the first time an untrusted workspace is opened."),
                    (0, nls_1.localize)('workspace.trust.startupPrompt.never', "Do not ask for trust when an untrusted workspace is opened."),
                ]
            },
            [workspaceTrust_2.WORKSPACE_TRUST_BANNER]: {
                type: 'string',
                default: 'untilDismissed',
                description: (0, nls_1.localize)('workspace.trust.banner.description', "Controls when the restricted mode banner is shown."),
                tags: [preferences_1.WORKSPACE_TRUST_SETTING_TAG],
                scope: 1 /* ConfigurationScope.APPLICATION */,
                enum: ['always', 'untilDismissed', 'never'],
                enumDescriptions: [
                    (0, nls_1.localize)('workspace.trust.banner.always', "Show the banner every time an untrusted workspace is open."),
                    (0, nls_1.localize)('workspace.trust.banner.untilDismissed', "Show the banner when an untrusted workspace is opened until dismissed."),
                    (0, nls_1.localize)('workspace.trust.banner.never', "Do not show the banner when an untrusted workspace is open."),
                ]
            },
            [workspaceTrust_2.WORKSPACE_TRUST_UNTRUSTED_FILES]: {
                type: 'string',
                default: 'prompt',
                markdownDescription: (0, nls_1.localize)('workspace.trust.untrustedFiles.description', "Controls how to handle opening untrusted files in a trusted workspace. This setting also applies to opening files in an empty window which is trusted via `#{0}#`.", workspaceTrust_2.WORKSPACE_TRUST_EMPTY_WINDOW),
                tags: [preferences_1.WORKSPACE_TRUST_SETTING_TAG],
                scope: 1 /* ConfigurationScope.APPLICATION */,
                enum: ['prompt', 'open', 'newWindow'],
                enumDescriptions: [
                    (0, nls_1.localize)('workspace.trust.untrustedFiles.prompt', "Ask how to handle untrusted files for each workspace. Once untrusted files are introduced to a trusted workspace, you will not be prompted again."),
                    (0, nls_1.localize)('workspace.trust.untrustedFiles.open', "Always allow untrusted files to be introduced to a trusted workspace without prompting."),
                    (0, nls_1.localize)('workspace.trust.untrustedFiles.newWindow', "Always open untrusted files in a separate window in restricted mode without prompting."),
                ]
            },
            [workspaceTrust_2.WORKSPACE_TRUST_EMPTY_WINDOW]: {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('workspace.trust.emptyWindow.description', "Controls whether or not the empty window is trusted by default within VS Code. When used with `#{0}#`, you can enable the full functionality of VS Code without prompting in an empty window.", workspaceTrust_2.WORKSPACE_TRUST_UNTRUSTED_FILES),
                tags: [preferences_1.WORKSPACE_TRUST_SETTING_TAG],
                scope: 1 /* ConfigurationScope.APPLICATION */
            }
        }
    });
    let WorkspaceTrustTelemetryContribution = class WorkspaceTrustTelemetryContribution extends lifecycle_1.Disposable {
        constructor(environmentService, telemetryService, workspaceContextService, workspaceTrustEnablementService, workspaceTrustManagementService) {
            super();
            this.environmentService = environmentService;
            this.telemetryService = telemetryService;
            this.workspaceContextService = workspaceContextService;
            this.workspaceTrustEnablementService = workspaceTrustEnablementService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.workspaceTrustManagementService.workspaceTrustInitialized
                .then(() => {
                this.logInitialWorkspaceTrustInfo();
                this.logWorkspaceTrust(this.workspaceTrustManagementService.isWorkspaceTrusted());
                this._register(this.workspaceTrustManagementService.onDidChangeTrust(isTrusted => this.logWorkspaceTrust(isTrusted)));
            });
        }
        logInitialWorkspaceTrustInfo() {
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                const disabledByCliFlag = this.environmentService.disableWorkspaceTrust;
                this.telemetryService.publicLog2('workspaceTrustDisabled', {
                    reason: disabledByCliFlag ? 'cli' : 'setting'
                });
                return;
            }
            this.telemetryService.publicLog2('workspaceTrustFolderCounts', {
                trustedFoldersCount: this.workspaceTrustManagementService.getTrustedUris().length,
            });
        }
        async logWorkspaceTrust(isTrusted) {
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                return;
            }
            this.telemetryService.publicLog2('workspaceTrustStateChanged', {
                workspaceId: this.workspaceContextService.getWorkspace().id,
                isTrusted: isTrusted
            });
            if (isTrusted) {
                const getDepth = (folder) => {
                    let resolvedPath = (0, path_1.resolve)(folder);
                    let depth = 0;
                    while ((0, path_1.dirname)(resolvedPath) !== resolvedPath && depth < 100) {
                        resolvedPath = (0, path_1.dirname)(resolvedPath);
                        depth++;
                    }
                    return depth;
                };
                for (const folder of this.workspaceContextService.getWorkspace().folders) {
                    const { trusted, uri } = await this.workspaceTrustManagementService.getUriTrustInfo(folder.uri);
                    if (!trusted) {
                        continue;
                    }
                    const workspaceFolderDepth = getDepth(folder.uri.fsPath);
                    const trustedFolderDepth = getDepth(uri.fsPath);
                    const delta = workspaceFolderDepth - trustedFolderDepth;
                    this.telemetryService.publicLog2('workspaceFolderDepthBelowTrustedFolder', { workspaceFolderDepth, trustedFolderDepth, delta });
                }
            }
        }
    };
    WorkspaceTrustTelemetryContribution = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, workspaceTrust_1.IWorkspaceTrustEnablementService),
        __param(4, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], WorkspaceTrustTelemetryContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(WorkspaceTrustTelemetryContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd29ya3NwYWNlL2Jyb3dzZXIvd29ya3NwYWNlLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrRGhHLE1BQU0sc0JBQXNCLEdBQUcsaUNBQWlDLENBQUM7SUFDakUsTUFBTSx3QkFBd0IsR0FBRyxxQ0FBcUMsQ0FBQztJQUN2RSxNQUFNLG9DQUFvQyxHQUFHLDJDQUEyQyxDQUFDO0lBRWxGLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsc0JBQVU7UUFLeEQsWUFDcUIsaUJBQXFDLEVBQ3ZCLCtCQUFpRSxFQUNqRSwrQkFBaUU7WUFFbkcsS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLENBQUMseUJBQXlCLEdBQUcsaUNBQXFCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQzNGLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsK0JBQStCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDO1lBRTlGLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxpQ0FBcUIsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDekYsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQywrQkFBK0IsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUM7WUFFdkYsSUFBSSxDQUFDLFNBQVMsQ0FBQywrQkFBK0IsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hILENB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