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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/actions/common/actions", "vs/nls", "vs/workbench/contrib/editSessions/common/editSessions", "vs/workbench/contrib/scm/common/scm", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/base/common/uri", "vs/base/common/resources", "vs/base/common/buffer", "vs/platform/configuration/common/configuration", "vs/platform/progress/common/progress", "vs/workbench/contrib/editSessions/browser/editSessionsStorageService", "vs/platform/instantiation/common/extensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/telemetry/common/telemetry", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/platform/product/common/productService", "vs/platform/opener/common/opener", "vs/platform/environment/common/environment", "vs/workbench/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/workspace/common/virtualWorkspace", "vs/base/common/network", "vs/platform/contextkey/common/contextkeys", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/editSessions/common/editSessionsLogService", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/editSessions/browser/editSessionsViews", "vs/workbench/contrib/editSessions/browser/editSessionsFileSystemProvider", "vs/base/common/platform", "vs/workbench/common/contextkeys", "vs/base/common/cancellation", "vs/base/common/objects", "vs/platform/workspace/common/editSessions", "vs/base/common/themables", "vs/workbench/services/output/common/output", "vs/base/browser/hash", "vs/platform/storage/common/storage", "vs/workbench/services/activity/common/activity", "vs/workbench/services/editor/common/editorService", "vs/base/common/codicons", "vs/base/common/errors", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/contrib/editSessions/common/workspaceStateSync", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/request/common/request", "vs/workbench/contrib/editSessions/common/editSessionsStorageClient", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/workspaces/common/workspaceIdentityService"], function (require, exports, lifecycle_1, contributions_1, platform_1, lifecycle_2, actions_1, nls_1, editSessions_1, scm_1, files_1, workspace_1, uri_1, resources_1, buffer_1, configuration_1, progress_1, editSessionsStorageService_1, extensions_1, userDataSync_1, telemetry_1, notification_1, dialogs_1, productService_1, opener_1, environment_1, configuration_2, configurationRegistry_1, quickInput_1, extensionsRegistry_1, contextkey_1, commands_1, virtualWorkspace_1, network_1, contextkeys_1, extensions_2, editSessionsLogService_1, views_1, viewsService_1, descriptors_1, viewPaneContainer_1, instantiation_1, editSessionsViews_1, editSessionsFileSystemProvider_1, platform_2, contextkeys_2, cancellation_1, objects_1, editSessions_2, themables_1, output_1, hash_1, storage_1, activity_1, editorService_1, codicons_1, errors_1, remoteAgentService_1, extensions_3, panecomposite_1, workspaceStateSync_1, userDataProfile_1, request_1, editSessionsStorageClient_1, uriIdentity_1, workspaceIdentityService_1) {
    "use strict";
    var EditSessionsContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditSessionsContribution = void 0;
    (0, extensions_1.registerSingleton)(editSessions_1.IEditSessionsLogService, editSessionsLogService_1.EditSessionsLogService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(editSessions_1.IEditSessionsStorageService, editSessionsStorageService_1.EditSessionsWorkbenchService, 1 /* InstantiationType.Delayed */);
    const continueWorkingOnCommand = {
        id: '_workbench.editSessions.actions.continueEditSession',
        title: (0, nls_1.localize2)('continue working on', 'Continue Working On...'),
        precondition: contextkeys_2.WorkspaceFolderCountContext.notEqualsTo('0'),
        f1: true
    };
    const openLocalFolderCommand = {
        id: '_workbench.editSessions.actions.continueEditSession.openLocalFolder',
        title: (0, nls_1.localize2)('continue edit session in local folder', 'Open In Local Folder'),
        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY,
        precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsWebContext.toNegated(), contextkeys_2.VirtualWorkspaceContext)
    };
    const showOutputChannelCommand = {
        id: 'workbench.editSessions.actions.showOutputChannel',
        title: (0, nls_1.localize2)('show log', "Show Log"),
        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY
    };
    const installAdditionalContinueOnOptionsCommand = {
        id: 'workbench.action.continueOn.extensions',
        title: (0, nls_1.localize)('continueOn.installAdditional', 'Install additional development environment options'),
    };
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({ ...installAdditionalContinueOnOptionsCommand, f1: false });
        }
        async run(accessor) {
            const paneCompositePartService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const viewlet = await paneCompositePartService.openPaneComposite(extensions_3.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            const view = viewlet?.getViewPaneContainer();
            view?.search('@tag:continueOn');
        }
    });
    const resumeProgressOptionsTitle = `[${(0, nls_1.localize)('resuming working changes window', 'Resuming working changes...')}](command:${showOutputChannelCommand.id})`;
    const resumeProgressOptions = {
        location: 10 /* ProgressLocation.Window */,
        type: 'syncing',
    };
    const queryParamName = 'editSessionId';
    const useEditSessionsWithContinueOn = 'workbench.editSessions.continueOn';
    let EditSessionsContribution = class EditSessionsContribution extends lifecycle_1.Disposable {
        static { EditSessionsContribution_1 = this; }
        static { this.APPLICATION_LAUNCHED_VIA_CONTINUE_ON_STORAGE_KEY = 'applicationLaunchedViaContinueOn'; }
        constructor(editSessionsStorageService, fileService, progressService, openerService, telemetryService, scmService, notificationService, dialogService, logService, environmentService, instantiationService, productService, configurationService, contextService, editSessionIdentityService, quickInputService, commandService, contextKeyService, fileDialogService, lifecycleService, storageService, activityService, editorService, remoteAgentService, extensionService, requestService, userDataProfilesService, uriIdentityService, workspaceIdentityService) {
            super();
            this.editSessionsStorageService = editSessionsStorageService;
            this.fileService = fileService;
            this.progressService = progressService;
            this.openerService = openerService;
            this.telemetryService = telemetryService;
            this.scmService = scmService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.logService = logService;
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            this.productService = productService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.editSessionIdentityService = editSessionIdentityService;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.contextKeyService = contextKeyService;
            this.fileDialogService = fileDialogService;
            this.lifecycleService = lifecycleService;
            this.storageService = storageService;
            this.activityService = activityService;
            this.editorService = editorService;
            this.remoteAgentService = remoteAgentService;
            this.extensionService = extensionService;
            this.requestService = requestService;
            this.userDataProfilesService = userDataProfilesService;
            this.uriIdentityService = uriIdentityService;
            this.workspaceIdentityService = workspaceIdentityService;
            this.continueEditSessionOptions = [];
            this.accountsMenuBadgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.registeredCommands = new Set();
            this.shouldShowViewsContext = editSessions_1.EDIT_SESSIONS_SHOW_VIEW.bindTo(this.contextKeyService);
            this.pendingEditSessionsContext = editSessions_1.EDIT_SESSIONS_PENDING.bindTo(this.contextKeyService);
            this.pendingEditSessionsContext.set(false);
            if (!this.productService['editSessions.store']?.url) {
                return;
            }
            this.editSessionsStorageClient = new editSessionsStorageClient_1.EditSessionsStoreClient(uri_1.URI.parse(this.productService['editSessions.store'].url), this.productService, this.requestService, this.logService, this.environmentService, this.fileService, this.storageService);
            this.editSessionsStorageService.storeClient = this.editSessionsStorageClient;
            this.workspaceStateSynchronizer = new workspaceStateSync_1.WorkspaceStateSynchroniser(this.userDataProfilesService.defaultProfile, undefined, this.editSessionsStorageClient, this.logService, this.fileService, this.environmentService, this.telemetryService, this.configurationService, this.storageService, this.uriIdentityService, this.workspaceIdentityService, this.editSessionsStorageService);
            this.autoResumeEditSession();
            this.registerActions();
            this.registerViews();
            this.registerContributedEditSessionOptions();
            this._register(this.fileService.registerProvider(editSessionsFileSystemProvider_1.EditSessionsFileSystemProvider.SCHEMA, new editSessionsFileSystemProvider_1.EditSessionsFileSystemProvider(this.editSessionsStorageService)));
            this.lifecycleService.onWillShutdown((e) => {
                if (e.reason !== 3 /* ShutdownReason.RELOAD */ && this.editSessionsStorageService.isSignedIn && this.configurationService.getValue('workbench.experimental.cloudChanges.autoStore') === 'onShutdown' && !platform_2.isWeb) {
                    e.join(this.autoStoreEditSession(), { id: 'autoStoreWorkingChanges', label: (0, nls_1.localize)('autoStoreWorkingChanges', 'Storing current working changes...') });
                }
            });
            this._register(this.editSessionsStorageService.onDidSignIn(() => this.updateAccountsMenuBadge()));
            this._register(this.editSessionsStorageService.onDidSignOut(() => this.updateAccountsMenuBadge()));
        }
        async autoResumeEditSession() {
            const shouldAutoResumeOnReload = this.configurationService.getValue('workbench.cloudChanges.autoResume') === 'onReload';
            if (this.environmentService.editSessionId !== undefined) {
                this.logService.info(`Resuming cloud changes, reason: found editSessionId ${this.environmentService.editSessionId} in environment service...`);
                await this.progressService.withProgress(resumeProgressOptions, async (progress) => await this.resumeEditSession(this.environmentService.editSessionId, undefined, undefined, undefined, progress).finally(() => this.environmentService.editSessionId = undefined));
            }
            else if (shouldAutoResumeOnReload && this.editSessionsStorageService.isSignedIn) {
                this.logService.info('Resuming cloud changes, reason: cloud changes enabled...');
                // Attempt to resume edit session based on edit workspace identifier
                // Note: at this point if the user is not signed into edit sessions,
                // we don't want them to be prompted to sign in and should just return early
                await this.progressService.withProgress(resumeProgressOptions, async (progress) => await this.resumeEditSession(undefined, true, undefined, undefined, progress));
            }
            else if (shouldAutoResumeOnReload) {
                // The application has previously launched via a protocol URL Continue On flow
                const hasApplicationLaunchedFromContinueOnFlow = this.storageService.getBoolean(EditSessionsContribution_1.APPLICATION_LAUNCHED_VIA_CONTINUE_ON_STORAGE_KEY, -1 /* StorageScope.APPLICATION */, false);
                this.logService.info(`Prompting to enable cloud changes, has application previously launched from Continue On flow: ${hasApplicationLaunchedFromContinueOnFlow}`);
                const handlePendingEditSessions = () => {
                    // display a badge in the accounts menu but do not prompt the user to sign in again
                    this.logService.info('Showing badge to enable cloud changes in accounts menu...');
                    this.updateAccountsMenuBadge();
                    this.pendingEditSessionsContext.set(true);
                    // attempt a resume if we are in a pending state and the user just signed in
                    const disposable = this.editSessionsStorageService.onDidSignIn(async () => {
                        disposable.dispose();
                        this.logService.info('Showing badge to enable cloud changes in accounts menu succeeded, resuming cloud changes...');
                        await this.progressService.withProgress(resumeProgressOptions, async (progress) => await this.resumeEditSession(undefined, true, undefined, undefined, progress));
                        this.storageService.remove(EditSessionsContribution_1.APPLICATION_LAUNCHED_VIA_CONTINUE_ON_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
                        this.environmentService.continueOn = undefined;
                    });
                };
                if ((this.environmentService.continueOn !== undefined) &&
                    !this.editSessionsStorageService.isSignedIn &&
                    // and user has not yet been prompted to sign in on this machine
                    hasApplicationLaunchedFromContinueOnFlow === false) {
                    // store the fact that we prompted the user
                    this.storageService.store(EditSessionsContribution_1.APPLICATION_LAUNCHED_VIA_CONTINUE_ON_STORAGE_KEY, true, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                    this.logService.info('Prompting to enable cloud changes...');
                    await this.editSessionsStorageService.initialize('read');
                    if (this.editSessionsStorageService.isSignedIn) {
                        this.logService.info('Prompting to enable cloud changes succeeded, resuming cloud changes...');
                        await this.progressService.withProgress(resumeProgressOptions, async (progress) => await this.resumeEditSession(undefined, true, undefined, undefined, progress));
                    }
                    else {
                        handlePendingEditSessions();
                    }
                }
                else if (!this.editSessionsStorageService.isSignedIn &&
                    // and user has been prompted to sign in on this machine
                    hasApplicationLaunchedFromContinueOnFlow === true) {
                    handlePendingEditSessions();
                }
            }
            else {
                this.logService.debug('Auto resuming cloud changes disabled.');
            }
        }
        updateAccountsMenuBadge() {
            if (this.editSessionsStorageService.isSignedIn) {
                return this.accountsMenuBadgeDisposable.clear();
            }
            const badge = new activity_1.NumberBadge(1, () => (0, nls_1.localize)('check for pending cloud changes', 'Check for pending cloud changes'));
            this.accountsMenuBadgeDisposable.value = this.activityService.showAccountsActivity({ badge });
        }
        async autoStoreEditSession() {
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            await this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                type: 'syncing',
                title: (0, nls_1.localize)('store working changes', 'Storing working changes...')
            }, async () => this.storeEditSession(false, cancellationTokenSource.token), () => {
                cancellationTokenSource.cancel();
                cancellationTokenSource.dispose();
            });
        }
        registerViews() {
            const container = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                id: editSessions_1.EDIT_SESSIONS_CONTAINER_ID,
                title: editSessions_1.EDIT_SESSIONS_TITLE,
                ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [editSessions_1.EDIT_SESSIONS_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
                icon: editSessions_1.EDIT_SESSIONS_VIEW_ICON,
                hideIfEmpty: true
            }, 0 /* ViewContainerLocation.Sidebar */, { doNotRegisterOpenCommand: true });
            this._register(this.instantiationService.createInstance(editSessionsViews_1.EditSessionsDataViews, container));
        }
        registerActions() {
            this.registerContinueEditSessionAction();
            this.registerResumeLatestEditSessionAction();
            this.registerStoreLatestEditSessionAction();
            this.registerContinueInLocalFolderAction();
            this.registerShowEditSessionViewAction();
            this.registerShowEditSessionOutputChannelAction();
        }
        registerShowEditSessionOutputChannelAction() {
            this._register((0, actions_1.registerAction2)(class ShowEditSessionOutput extends actions_1.Action2 {
                constructor() {
                    super(showOutputChannelCommand);
                }
                run(accessor, ...args) {
                    const outputChannel = accessor.get(output_1.IOutputService);
                    void outputChannel.showChannel(editSessions_1.editSessionsLogId);
                }
            }));
        }
        registerShowEditSessionViewAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class ShowEditSessionView extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.showEditSessions',
                        title: (0, nls_1.localize2)('show cloud changes', 'Show Cloud Changes'),
                        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY,
                        f1: true
                    });
                }
                async run(accessor) {
                    that.shouldShowViewsContext.set(true);
                    const viewsService = accessor.get(viewsService_1.IViewsService);
                    await viewsService.openView(editSessions_1.EDIT_SESSIONS_DATA_VIEW_ID);
                }
            }));
        }
        registerContinueEditSessionAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class ContinueEditSessionAction extends actions_1.Action2 {
                constructor() {
                    super(continueWorkingOnCommand);
                }
                async run(accessor, workspaceUri, destination) {
                    // First ask the user to pick a destination, if necessary
                    let uri = workspaceUri;
                    if (!destination && !uri) {
                        destination = await that.pickContinueEditSessionDestination();
                        if (!destination) {
                            that.telemetryService.publicLog2('continueOn.editSessions.pick.outcome', { outcome: 'noSelection' });
                            return;
                        }
                    }
                    // Determine if we need to store an edit session, asking for edit session auth if necessary
                    const shouldStoreEditSession = await that.shouldContinueOnWithEditSession();
                    // Run the store action to get back a ref
                    let ref;
                    if (shouldStoreEditSession) {
                        that.telemetryService.publicLog2('continueOn.editSessions.store');
                        const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                        try {
                            ref = await that.progressService.withProgress({
                                location: 15 /* ProgressLocation.Notification */,
                                cancellable: true,
                                type: 'syncing',
                                title: (0, nls_1.localize)('store your working changes', 'Storing your working changes...')
                            }, async () => {
                                const ref = await that.storeEditSession(false, cancellationTokenSource.token);
                                if (ref !== undefined) {
                                    that.telemetryService.publicLog2('continueOn.editSessions.store.outcome', { outcome: 'storeSucceeded', hashedId: (0, editSessions_1.hashedEditSessionId)(ref) });
                                }
                                else {
                                    that.telemetryService.publicLog2('continueOn.editSessions.store.outcome', { outcome: 'storeSkipped' });
                                }
                                return ref;
                            }, () => {
                                cancellationTokenSource.cancel();
                                cancellationTokenSource.dispose();
                                that.telemetryService.publicLog2('continueOn.editSessions.store.outcome', { outcome: 'storeCancelledByUser' });
                            });
                        }
                        catch (ex) {
                            that.telemetryService.publicLog2('continueOn.editSessions.store.outcome', { outcome: 'storeFailed' });
                            throw ex;
                        }
                    }
                    // Append the ref to the URI
                    uri = destination ? await that.resolveDestination(destination) : uri;
                    if (uri === undefined) {
                        return;
                    }
                    if (ref !== undefined && uri !== 'noDestinationUri') {
                        const encodedRef = encodeURIComponent(ref);
                        uri = uri.with({
                            query: uri.query.length > 0 ? (uri.query + `&${queryParamName}=${encodedRef}&continueOn=1`) : `${queryParamName}=${encodedRef}&continueOn=1`
                        });
                        // Open the URI
                        that.logService.info(`Opening ${uri.toString()}`);
                        await that.openerService.open(uri, { openExternal: true });
                    }
                    else if (!shouldStoreEditSession && uri !== 'noDestinationUri') {
                        // Open the URI without an edit session ref
                        that.logService.info(`Opening ${uri.toString()}`);
                        await that.openerService.open(uri, { openExternal: true });
                    }
                    else if (ref === undefined && shouldStoreEditSession) {
                        that.logService.warn(`Failed to store working changes when invoking ${continueWorkingOnCommand.id}.`);
                    }
                }
            }));
        }
        registerResumeLatestEditSessionAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class ResumeLatestEditSessionAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.resumeLatest',
                        title: (0, nls_1.localize2)('resume latest cloud changes', 'Resume Latest Changes from Cloud'),
                        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY,
                        f1: true,
                    });
                }
                async run(accessor, editSessionId, forceApplyUnrelatedChange) {
                    await that.progressService.withProgress({ ...resumeProgressOptions, title: resumeProgressOptionsTitle }, async () => await that.resumeEditSession(editSessionId, undefined, forceApplyUnrelatedChange));
                }
            }));
            this._register((0, actions_1.registerAction2)(class ResumeLatestEditSessionAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.resumeFromSerializedPayload',
                        title: (0, nls_1.localize2)('resume cloud changes', 'Resume Changes from Serialized Data'),
                        category: 'Developer',
                        f1: true,
                    });
                }
                async run(accessor, editSessionId) {
                    const data = await that.quickInputService.input({ prompt: 'Enter serialized data' });
                    if (data) {
                        that.editSessionsStorageService.lastReadResources.set('editSessions', { content: data, ref: '' });
                    }
                    await that.progressService.withProgress({ ...resumeProgressOptions, title: resumeProgressOptionsTitle }, async () => await that.resumeEditSession(editSessionId, undefined, undefined, undefined, undefined, data));
                }
            }));
        }
        registerStoreLatestEditSessionAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class StoreLatestEditSessionAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.storeCurrent',
                        title: (0, nls_1.localize2)('store working changes in cloud', 'Store Working Changes in Cloud'),
                        category: editSessions_1.EDIT_SESSION_SYNC_CATEGORY,
                        f1: true,
                    });
                }
                async run(accessor) {
                    const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                    await that.progressService.withProgress({
                        location: 15 /* ProgressLocation.Notification */,
                        title: (0, nls_1.localize)('storing working changes', 'Storing working changes...')
                    }, async () => {
                        that.telemetryService.publicLog2('editSessions.store');
                        await that.storeEditSession(true, cancellationTokenSource.token);
                    }, () => {
                        cancellationTokenSource.cancel();
                        cancellationTokenSource.dispose();
                    });
                }
            }));
        }
        async resumeEditSession(ref, silent, forceApplyUnrelatedChange, applyPartialMatch, progress, serializedData) {
            // Wait for the remote environment to become available, if any
            await this.remoteAgentService.getEnvironment();
            // Edit sessions are not currently supported in empty workspaces
            // https://github.com/microsoft/vscode/issues/159220
            if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                return;
            }
            this.logService.info(ref !== undefined ? `Resuming changes from cloud with ref ${ref}...` : 'Checking for pending cloud changes...');
            if (silent && !(await this.editSessionsStorageService.initialize('read', true))) {
                return;
            }
            this.telemetryService.publicLog2('editSessions.resume');
            performance.mark('code/willResumeEditSessionFromIdentifier');
            progress?.report({ message: (0, nls_1.localize)('checkingForWorkingChanges', 'Checking for pending cloud changes...') });
            const data = serializedData ? { content: serializedData, ref: '' } : await this.editSessionsStorageService.read('editSessions', ref);
            if (!data) {
                if (ref === undefined && !silent) {
                    this.notificationService.info((0, nls_1.localize)('no cloud changes', 'There are no changes to resume from the cloud.'));
                }
                else if (ref !== undefined) {
                    this.notificationService.warn((0, nls_1.localize)('no cloud changes for ref', 'Could not resume changes from the cloud for ID {0}.', ref));
                }
                this.logService.info(ref !== undefined ? `Aborting resuming changes from cloud as no edit session content is available to be applied from ref ${ref}.` : `Aborting resuming edit session as no edit session content is available to be applied`);
                return;
            }
            progress?.report({ message: resumeProgressOptionsTitle });
            const editSession = JSON.parse(data.content);
            ref = data.ref;
            if (editSession.version > editSessions_1.EditSessionSchemaVersion) {
                this.notificationService.error((0, nls_1.localize)('client too old', "Please upgrade to a newer version of {0} to resume your working changes from the cloud.", this.productService.nameLong));
                this.telemetryService.publicLog2('editSessions.resume.outcome', { hashedId: (0, editSessions_1.hashedEditSessionId)(ref), outcome: 'clientUpdateNeeded' });
                return;
            }
            try {
                const { changes, conflictingChanges } = await this.generateChanges(editSession, ref, forceApplyUnrelatedChange, applyPartialMatch);
                if (changes.length === 0) {
                    return;
                }
                // TODO@joyceerhl Provide the option to diff files which would be overwritten by edit session contents
                if (conflictingChanges.length > 0) {
                    // Allow to show edit sessions
                    const { confirmed } = await this.dialogService.confirm({
                        type: notification_1.Severity.Warning,
                        message: conflictingChanges.length > 1 ?
                            (0, nls_1.localize)('resume edit session warning many', 'Resuming your working changes from the cloud will overwrite the following {0} files. Do you want to proceed?', conflictingChanges.length) :
                            (0, nls_1.localize)('resume edit session warning 1', 'Resuming your working changes from the cloud will overwrite {0}. Do you want to proceed?', (0, resources_1.basename)(conflictingChanges[0].uri)),
                        detail: conflictingChanges.length > 1 ? (0, dialogs_1.getFileNamesMessage)(conflictingChanges.map((c) => c.uri)) : undefined
                    });
                    if (!confirmed) {
                        return;
                    }
                }
                for (const { uri, type, contents } of changes) {
                    if (type === editSessions_1.ChangeType.Addition) {
                        await this.fileService.writeFile(uri, (0, editSessions_1.decodeEditSessionFileContent)(editSession.version, contents));
                    }
                    else if (type === editSessions_1.ChangeType.Deletion && await this.fileService.exists(uri)) {
                        await this.fileService.del(uri);
                    }
                }
                await this.workspaceStateSynchronizer?.apply(false, {});
                this.logService.info(`Deleting edit session with ref ${ref} after successfully applying it to current workspace...`);
                await this.editSessionsStorageService.delete('editSessions', ref);
                this.logService.info(`Deleted edit session with ref ${ref}.`);
                this.telemetryService.publicLog2('editSessions.resume.outcome', { hashedId: (0, editSessions_1.hashedEditSessionId)(ref), outcome: 'resumeSucceeded' });
            }
            catch (ex) {
                this.logService.error('Failed to resume edit session, reason: ', ex.toString());
                this.notificationService.error((0, nls_1.localize)('resume failed', "Failed to resume your working changes from the cloud."));
            }
            performance.mark('code/didResumeEditSessionFromIdentifier');
        }
        async generateChanges(editSession, ref, forceApplyUnrelatedChange = false, applyPartialMatch = false) {
            const changes = [];
            const conflictingChanges = [];
            const workspaceFolders = this.contextService.getWorkspace().folders;
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            for (const folder of editSession.folders) {
                let folderRoot;
                if (folder.canonicalIdentity) {
                    // Look for an edit session identifier that we can use
                    for (const f of workspaceFolders) {
                        const identity = await this.editSessionIdentityService.getEditSessionIdentifier(f, cancellationTokenSource.token);
                        this.logService.info(`Matching identity ${identity} against edit session folder identity ${folder.canonicalIdentity}...`);
                        if ((0, objects_1.equals)(identity, folder.canonicalIdentity) || forceApplyUnrelatedChange) {
                            folderRoot = f;
                            break;
                        }
                        if (identity !== undefined) {
                            const match = await this.editSessionIdentityService.provideEditSessionIdentityMatch(f, identity, folder.canonicalIdentity, cancellationTokenSource.token);
                            if (match === editSessions_2.EditSessionIdentityMatch.Complete) {
                                folderRoot = f;
                                break;
                            }
                            else if (match === editSessions_2.EditSessionIdentityMatch.Partial &&
                                this.configurationService.getValue('workbench.experimental.cloudChanges.partialMatches.enabled') === true) {
                                if (!applyPartialMatch) {
                                    // Surface partially matching edit session
                                    this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('editSessionPartialMatch', 'You have pending working changes in the cloud for this workspace. Would you like to resume them?'), [{ label: (0, nls_1.localize)('resume', 'Resume'), run: () => this.resumeEditSession(ref, false, undefined, true) }]);
                                }
                                else {
                                    folderRoot = f;
                                    break;
                                }
                            }
                        }
                    }
                }
                else {
                    folderRoot = workspaceFolders.find((f) => f.name === folder.name);
                }
                if (!folderRoot) {
                    this.logService.info(`Skipping applying ${folder.workingChanges.length} changes from edit session with ref ${ref} as no matching workspace folder was found.`);
                    return { changes: [], conflictingChanges: [], contributedStateHandlers: [] };
                }
                const localChanges = new Set();
                for (const repository of this.scmService.repositories) {
                    if (repository.provider.rootUri !== undefined &&
                        this.contextService.getWorkspaceFolder(repository.provider.rootUri)?.name === folder.name) {
                        const repositoryChanges = this.getChangedResources(repository);
                        repositoryChanges.forEach((change) => localChanges.add(change.toString()));
                    }
                }
                for (const change of folder.workingChanges) {
                    const uri = (0, resources_1.joinPath)(folderRoot.uri, change.relativeFilePath);
                    changes.push({ uri, type: change.type, contents: change.contents });
                    if (await this.willChangeLocalContents(localChanges, uri, change)) {
                        conflictingChanges.push({ uri, type: change.type, contents: change.contents });
                    }
                }
            }
            return { changes, conflictingChanges };
        }
        async willChangeLocalContents(localChanges, uriWithIncomingChanges, incomingChange) {
            if (!localChanges.has(uriWithIncomingChanges.toString())) {
                return false;
            }
            const { contents, type } = incomingChange;
            switch (type) {
                case (editSessions_1.ChangeType.Addition): {
                    const [originalContents, incomingContents] = await Promise.all([(0, hash_1.sha1Hex)(contents), (0, hash_1.sha1Hex)((0, buffer_1.encodeBase64)((await this.fileService.readFile(uriWithIncomingChanges)).value))]);
                    return originalContents !== incomingContents;
                }
                case (editSessions_1.ChangeType.Deletion): {
                    return await this.fileService.exists(uriWithIncomingChanges);
                }
                default:
                    throw new Error('Unhandled change type.');
            }
        }
        async storeEditSession(fromStoreCommand, cancellationToken) {
            const folders = [];
            let editSessionSize = 0;
            let hasEdits = false;
            // Save all saveable editors before building edit session contents
            await this.editorService.saveAll();
            for (const repository of this.scmService.repositories) {
                // Look through all resource groups and compute which files were added/modified/deleted
                const trackedUris = this.getChangedResources(repository); // A URI might appear in more than one resource group
                const workingChanges = [];
                const { rootUri } = repository.provider;
                const workspaceFolder = rootUri ? this.contextService.getWorkspaceFolder(rootUri) : undefined;
                let name = workspaceFolder?.name;
                for (const uri of trackedUris) {
                    const workspaceFolder = this.contextService.getWorkspaceFolder(uri);
                    if (!workspaceFolder) {
                        this.logService.info(`Skipping working change ${uri.toString()} as no associated workspace folder was found.`);
                        continue;
                    }
                    await this.editSessionIdentityService.onWillCreateEditSessionIdentity(workspaceFolder, cancellationToken);
                    name = name ?? workspaceFolder.name;
                    const relativeFilePath = (0, resources_1.relativePath)(workspaceFolder.uri, uri) ?? uri.path;
                    // Only deal with file contents for now
                    try {
                        if (!(await this.fileService.stat(uri)).isFile) {
                            continue;
                        }
                    }
                    catch { }
                    hasEdits = true;
                    if (await this.fileService.exists(uri)) {
                        const contents = (0, buffer_1.encodeBase64)((await this.fileService.readFile(uri)).value);
                        editSessionSize += contents.length;
                        if (editSessionSize > this.editSessionsStorageService.SIZE_LIMIT) {
                            this.notificationService.error((0, nls_1.localize)('payload too large', 'Your working changes exceed the size limit and cannot be stored.'));
                            return undefined;
                        }
                        workingChanges.push({ type: editSessions_1.ChangeType.Addition, fileType: editSessions_1.FileType.File, contents: contents, relativeFilePath: relativeFilePath });
                    }
                    else {
                        // Assume it's a deletion
                        workingChanges.push({ type: editSessions_1.ChangeType.Deletion, fileType: editSessions_1.FileType.File, contents: undefined, relativeFilePath: relativeFilePath });
                    }
                }
                let canonicalIdentity = undefined;
                if (workspaceFolder !== null && workspaceFolder !== undefined) {
                    canonicalIdentity = await this.editSessionIdentityService.getEditSessionIdentifier(workspaceFolder, cancellationToken);
                }
                // TODO@joyceerhl debt: don't store working changes as a child of the folder
                folders.push({ workingChanges, name: name ?? '', canonicalIdentity: canonicalIdentity ?? undefined, absoluteUri: workspaceFolder?.uri.toString() });
            }
            // Store contributed workspace state
            await this.workspaceStateSynchronizer?.sync(null, {});
            if (!hasEdits) {
                this.logService.info('Skipped storing working changes in the cloud as there are no edits to store.');
                if (fromStoreCommand) {
                    this.notificationService.info((0, nls_1.localize)('no working changes to store', 'Skipped storing working changes in the cloud as there are no edits to store.'));
                }
                return undefined;
            }
            const data = { folders, version: 2, workspaceStateId: this.editSessionsStorageService.lastWrittenResources.get('workspaceState')?.ref };
            try {
                this.logService.info(`Storing edit session...`);
                const ref = await this.editSessionsStorageService.write('editSessions', data);
                this.logService.info(`Stored edit session with ref ${ref}.`);
                return ref;
            }
            catch (ex) {
                this.logService.error(`Failed to store edit session, reason: `, ex.toString());
                if (ex instanceof userDataSync_1.UserDataSyncStoreError) {
                    switch (ex.code) {
                        case "TooLarge" /* UserDataSyncErrorCode.TooLarge */:
                            // Uploading a payload can fail due to server size limits
                            this.telemetryService.publicLog2('editSessions.upload.failed', { reason: 'TooLarge' });
                            this.notificationService.error((0, nls_1.localize)('payload too large', 'Your working changes exceed the size limit and cannot be stored.'));
                            break;
                        default:
                            this.telemetryService.publicLog2('editSessions.upload.failed', { reason: 'unknown' });
                            this.notificationService.error((0, nls_1.localize)('payload failed', 'Your working changes cannot be stored.'));
                            break;
                    }
                }
            }
            return undefined;
        }
        getChangedResources(repository) {
            return repository.provider.groups.reduce((resources, resourceGroups) => {
                resourceGroups.resources.forEach((resource) => resources.add(resource.sourceUri));
                return resources;
            }, new Set()); // A URI might appear in more than one resource group
        }
        hasEditSession() {
            for (const repository of this.scmService.repositories) {
                if (this.getChangedResources(repository).size > 0) {
                    return true;
                }
            }
            return false;
        }
        async shouldContinueOnWithEditSession() {
            // If the user is already signed in, we should store edit session
            if (this.editSessionsStorageService.isSignedIn) {
                return this.hasEditSession();
            }
            // If the user has been asked before and said no, don't use edit sessions
            if (this.configurationService.getValue(useEditSessionsWithContinueOn) === 'off') {
                this.telemetryService.publicLog2('continueOn.editSessions.canStore.outcome', { outcome: 'disabledEditSessionsViaSetting' });
                return false;
            }
            // Prompt the user to use edit sessions if they currently could benefit from using it
            if (this.hasEditSession()) {
                const quickpick = this.quickInputService.createQuickPick();
                quickpick.placeholder = (0, nls_1.localize)('continue with cloud changes', "Select whether to bring your working changes with you");
                quickpick.ok = false;
                quickpick.ignoreFocusOut = true;
                const withCloudChanges = { label: (0, nls_1.localize)('with cloud changes', "Yes, continue with my working changes") };
                const withoutCloudChanges = { label: (0, nls_1.localize)('without cloud changes', "No, continue without my working changes") };
                quickpick.items = [withCloudChanges, withoutCloudChanges];
                const continueWithCloudChanges = await new Promise((resolve, reject) => {
                    quickpick.onDidAccept(() => {
                        resolve(quickpick.selectedItems[0] === withCloudChanges);
                        quickpick.hide();
                    });
                    quickpick.onDidHide(() => {
                        reject(new errors_1.CancellationError());
                        quickpick.hide();
                    });
                    quickpick.show();
                });
                if (!continueWithCloudChanges) {
                    this.telemetryService.publicLog2('continueOn.editSessions.canStore.outcome', { outcome: 'didNotEnableEditSessionsWhenPrompted' });
                    return continueWithCloudChanges;
                }
                const initialized = await this.editSessionsStorageService.initialize('write');
                if (!initialized) {
                    this.telemetryService.publicLog2('continueOn.editSessions.canStore.outcome', { outcome: 'didNotEnableEditSessionsWhenPrompted' });
                }
                return initialized;
            }
            return false;
        }
        //#region Continue Edit Session extension contribution point
        registerContributedEditSessionOptions() {
            continueEditSessionExtPoint.setHandler(extensions => {
                const continueEditSessionOptions = [];
                for (const extension of extensions) {
                    if (!(0, extensions_2.isProposedApiEnabled)(extension.description, 'contribEditSessions')) {
                        continue;
                    }
                    if (!Array.isArray(extension.value)) {
                        continue;
                    }
                    for (const contribution of extension.value) {
                        const command = actions_1.MenuRegistry.getCommand(contribution.command);
                        if (!command) {
                            return;
                        }
                        const icon = command.icon;
                        const title = typeof command.title === 'string' ? command.title : command.title.value;
                        const when = contextkey_1.ContextKeyExpr.deserialize(contribution.when);
                        continueEditSessionOptions.push(new ContinueEditSessionItem(themables_1.ThemeIcon.isThemeIcon(icon) ? `$(${icon.id}) ${title}` : title, command.id, command.source?.title, when, contribution.documentation));
                        if (contribution.qualifiedName) {
                            this.generateStandaloneOptionCommand(command.id, contribution.qualifiedName, contribution.category ?? command.category, when, contribution.remoteGroup);
                        }
                    }
                }
                this.continueEditSessionOptions = continueEditSessionOptions;
            });
        }
        generateStandaloneOptionCommand(commandId, qualifiedName, category, when, remoteGroup) {
            const command = {
                id: `${continueWorkingOnCommand.id}.${commandId}`,
                title: { original: qualifiedName, value: qualifiedName },
                category: typeof category === 'string' ? { original: category, value: category } : category,
                precondition: when,
                f1: true
            };
            if (!this.registeredCommands.has(command.id)) {
                this.registeredCommands.add(command.id);
                this._register((0, actions_1.registerAction2)(class StandaloneContinueOnOption extends actions_1.Action2 {
                    constructor() {
                        super(command);
                    }
                    async run(accessor) {
                        return accessor.get(commands_1.ICommandService).executeCommand(continueWorkingOnCommand.id, undefined, commandId);
                    }
                }));
                if (remoteGroup !== undefined) {
                    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.StatusBarRemoteIndicatorMenu, {
                        group: remoteGroup,
                        command: command,
                        when: command.precondition
                    });
                }
            }
        }
        registerContinueInLocalFolderAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class ContinueInLocalFolderAction extends actions_1.Action2 {
                constructor() {
                    super(openLocalFolderCommand);
                }
                async run(accessor) {
                    const selection = await that.fileDialogService.showOpenDialog({
                        title: (0, nls_1.localize)('continueEditSession.openLocalFolder.title.v2', 'Select a local folder to continue working in'),
                        canSelectFolders: true,
                        canSelectMany: false,
                        canSelectFiles: false,
                        availableFileSystems: [network_1.Schemas.file]
                    });
                    return selection?.length !== 1 ? undefined : uri_1.URI.from({
                        scheme: that.productService.urlProtocol,
                        authority: network_1.Schemas.file,
                        path: selection[0].path
                    });
                }
            }));
            if ((0, virtualWorkspace_1.getVirtualWorkspaceLocation)(this.contextService.getWorkspace()) !== undefined && platform_2.isNative) {
                this.generateStandaloneOptionCommand(openLocalFolderCommand.id, (0, nls_1.localize)('continueWorkingOn.existingLocalFolder', 'Continue Working in Existing Local Folder'), undefined, openLocalFolderCommand.precondition, undefined);
            }
        }
        async pickContinueEditSessionDestination() {
            const quickPick = this.quickInputService.createQuickPick();
            const workspaceContext = this.contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */
                ? this.contextService.getWorkspace().folders[0].name
                : this.contextService.getWorkspace().folders.map((folder) => folder.name).join(', ');
            quickPick.placeholder = (0, nls_1.localize)('continueEditSessionPick.title.v2', "Select a development environment to continue working on {0} in", `'${workspaceContext}'`);
            quickPick.items = this.createPickItems();
            this.extensionService.onDidChangeExtensions(() => {
                quickPick.items = this.createPickItems();
            });
            const command = await new Promise((resolve, reject) => {
                quickPick.onDidHide(() => resolve(undefined));
                quickPick.onDidAccept((e) => {
                    const selection = quickPick.activeItems[0].command;
                    if (selection === installAdditionalContinueOnOptionsCommand.id) {
                        void this.commandService.executeCommand(installAdditionalContinueOnOptionsCommand.id);
                    }
                    else {
                        resolve(selection);
                        quickPick.hide();
                    }
                });
                quickPick.show();
                quickPick.onDidTriggerItemButton(async (e) => {
                    if (e.item.documentation !== undefined) {
                        const uri = uri_1.URI.isUri(e.item.documentation) ? uri_1.URI.parse(e.item.documentation) : await this.commandService.executeCommand(e.item.documentation);
                        void this.openerService.open(uri, { openExternal: true });
                    }
                });
            });
            quickPick.dispose();
            return command;
        }
        async resolveDestination(command) {
            try {
                const uri = await this.commandService.executeCommand(command);
                // Some continue on commands do not return a URI
                // to support extensions which want to be in control
                // of how the destination is opened
                if (uri === undefined) {
                    this.telemetryService.publicLog2('continueOn.openDestination.outcome', { selection: command, outcome: 'noDestinationUri' });
                    return 'noDestinationUri';
                }
                if (uri_1.URI.isUri(uri)) {
                    this.telemetryService.publicLog2('continueOn.openDestination.outcome', { selection: command, outcome: 'resolvedUri' });
                    return uri;
                }
                this.telemetryService.publicLog2('continueOn.openDestination.outcome', { selection: command, outcome: 'invalidDestination' });
                return undefined;
            }
            catch (ex) {
                if (ex instanceof errors_1.CancellationError) {
                    this.telemetryService.publicLog2('continueOn.openDestination.outcome', { selection: command, outcome: 'cancelled' });
                }
                else {
                    this.telemetryService.publicLog2('continueOn.openDestination.outcome', { selection: command, outcome: 'unknownError' });
                }
                return undefined;
            }
        }
        createPickItems() {
            const items = [...this.continueEditSessionOptions].filter((option) => option.when === undefined || this.contextKeyService.contextMatchesRules(option.when));
            if ((0, virtualWorkspace_1.getVirtualWorkspaceLocation)(this.contextService.getWorkspace()) !== undefined && platform_2.isNative) {
                items.push(new ContinueEditSessionItem('$(folder) ' + (0, nls_1.localize)('continueEditSessionItem.openInLocalFolder.v2', 'Open in Local Folder'), openLocalFolderCommand.id, (0, nls_1.localize)('continueEditSessionItem.builtin', 'Built-in')));
            }
            const sortedItems = items.sort((item1, item2) => item1.label.localeCompare(item2.label));
            return sortedItems.concat({ type: 'separator' }, new ContinueEditSessionItem(installAdditionalContinueOnOptionsCommand.title, installAdditionalContinueOnOptionsCommand.id));
        }
    };
    exports.EditSessionsContribution = EditSessionsContribution;
    exports.EditSessionsContribution = EditSessionsContribution = EditSessionsContribution_1 = __decorate([
        __param(0, editSessions_1.IEditSessionsStorageService),
        __param(1, files_1.IFileService),
        __param(2, progress_1.IProgressService),
        __param(3, opener_1.IOpenerService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, scm_1.ISCMService),
        __param(6, notification_1.INotificationService),
        __param(7, dialogs_1.IDialogService),
        __param(8, editSessions_1.IEditSessionsLogService),
        __param(9, environment_1.IEnvironmentService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, productService_1.IProductService),
        __param(12, configuration_1.IConfigurationService),
        __param(13, workspace_1.IWorkspaceContextService),
        __param(14, editSessions_2.IEditSessionIdentityService),
        __param(15, quickInput_1.IQuickInputService),
        __param(16, commands_1.ICommandService),
        __param(17, contextkey_1.IContextKeyService),
        __param(18, dialogs_1.IFileDialogService),
        __param(19, lifecycle_2.ILifecycleService),
        __param(20, storage_1.IStorageService),
        __param(21, activity_1.IActivityService),
        __param(22, editorService_1.IEditorService),
        __param(23, remoteAgentService_1.IRemoteAgentService),
        __param(24, extensions_2.IExtensionService),
        __param(25, request_1.IRequestService),
        __param(26, userDataProfile_1.IUserDataProfilesService),
        __param(27, uriIdentity_1.IUriIdentityService),
        __param(28, workspaceIdentityService_1.IWorkspaceIdentityService)
    ], EditSessionsContribution);
    const infoButtonClass = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.info);
    class ContinueEditSessionItem {
        constructor(label, command, description, when, documentation) {
            this.label = label;
            this.command = command;
            this.description = description;
            this.when = when;
            this.documentation = documentation;
            if (documentation !== undefined) {
                this.buttons = [{
                        iconClass: infoButtonClass,
                        tooltip: (0, nls_1.localize)('learnMoreTooltip', 'Learn More'),
                    }];
            }
        }
    }
    const continueEditSessionExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'continueEditSession',
        jsonSchema: {
            description: (0, nls_1.localize)('continueEditSessionExtPoint', 'Contributes options for continuing the current edit session in a different environment'),
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    command: {
                        description: (0, nls_1.localize)('continueEditSessionExtPoint.command', 'Identifier of the command to execute. The command must be declared in the \'commands\'-section and return a URI representing a different environment where the current edit session can be continued.'),
                        type: 'string'
                    },
                    group: {
                        description: (0, nls_1.localize)('continueEditSessionExtPoint.group', 'Group into which this item belongs.'),
                        type: 'string'
                    },
                    qualifiedName: {
                        description: (0, nls_1.localize)('continueEditSessionExtPoint.qualifiedName', 'A fully qualified name for this item which is used for display in menus.'),
                        type: 'string'
                    },
                    description: {
                        description: (0, nls_1.localize)('continueEditSessionExtPoint.description', "The url, or a command that returns the url, to the option's documentation page."),
                        type: 'string'
                    },
                    remoteGroup: {
                        description: (0, nls_1.localize)('continueEditSessionExtPoint.remoteGroup', 'Group into which this item belongs in the remote indicator.'),
                        type: 'string'
                    },
                    when: {
                        description: (0, nls_1.localize)('continueEditSessionExtPoint.when', 'Condition which must be true to show this item.'),
                        type: 'string'
                    }
                },
                required: ['command']
            }
        }
    });
    //#endregion
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(EditSessionsContribution, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        ...configuration_2.workbenchConfigurationNodeBase,
        'properties': {
            'workbench.experimental.cloudChanges.autoStore': {
                enum: ['onShutdown', 'off'],
                enumDescriptions: [
                    (0, nls_1.localize)('autoStoreWorkingChanges.onShutdown', "Automatically store current working changes in the cloud on window close."),
                    (0, nls_1.localize)('autoStoreWorkingChanges.off', "Never attempt to automatically store working changes in the cloud.")
                ],
                'type': 'string',
                'tags': ['experimental', 'usesOnlineServices'],
                'default': 'off',
                'markdownDescription': (0, nls_1.localize)('autoStoreWorkingChangesDescription', "Controls whether to automatically store available working changes in the cloud for the current workspace. This setting has no effect in the web."),
            },
            'workbench.cloudChanges.autoResume': {
                enum: ['onReload', 'off'],
                enumDescriptions: [
                    (0, nls_1.localize)('autoResumeWorkingChanges.onReload', "Automatically resume available working changes from the cloud on window reload."),
                    (0, nls_1.localize)('autoResumeWorkingChanges.off', "Never attempt to resume working changes from the cloud.")
                ],
                'type': 'string',
                'tags': ['usesOnlineServices'],
                'default': 'onReload',
                'markdownDescription': (0, nls_1.localize)('autoResumeWorkingChanges', "Controls whether to automatically resume available working changes stored in the cloud for the current workspace."),
            },
            'workbench.cloudChanges.continueOn': {
                enum: ['prompt', 'off'],
                enumDescriptions: [
                    (0, nls_1.localize)('continueOnCloudChanges.promptForAuth', 'Prompt the user to sign in to store working changes in the cloud with Continue Working On.'),
                    (0, nls_1.localize)('continueOnCloudChanges.off', 'Do not store working changes in the cloud with Continue Working On unless the user has already turned on Cloud Changes.')
                ],
                type: 'string',
                tags: ['usesOnlineServices'],
                default: 'prompt',
                markdownDescription: (0, nls_1.localize)('continueOnCloudChanges', 'Controls whether to prompt the user to store working changes in the cloud when using Continue Working On.')
            },
            'workbench.experimental.cloudChanges.partialMatches.enabled': {
                'type': 'boolean',
                'tags': ['experimental', 'usesOnlineServices'],
                'default': false,
                'markdownDescription': (0, nls_1.localize)('cloudChangesPartialMatchesEnabled', "Controls whether to surface cloud changes which partially match the current session.")
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNlc3Npb25zLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZWRpdFNlc3Npb25zL2Jyb3dzZXIvZWRpdFNlc3Npb25zLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBcUVoRyxJQUFBLDhCQUFpQixFQUFDLHNDQUF1QixFQUFFLCtDQUFzQixvQ0FBNEIsQ0FBQztJQUM5RixJQUFBLDhCQUFpQixFQUFDLDBDQUEyQixFQUFFLHlEQUE0QixvQ0FBNEIsQ0FBQztJQUd4RyxNQUFNLHdCQUF3QixHQUFvQjtRQUNqRCxFQUFFLEVBQUUscURBQXFEO1FBQ3pELEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxxQkFBcUIsRUFBRSx3QkFBd0IsQ0FBQztRQUNqRSxZQUFZLEVBQUUseUNBQTJCLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQztRQUMxRCxFQUFFLEVBQUUsSUFBSTtLQUNSLENBQUM7SUFDRixNQUFNLHNCQUFzQixHQUFvQjtRQUMvQyxFQUFFLEVBQUUscUVBQXFFO1FBQ3pFLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyx1Q0FBdUMsRUFBRSxzQkFBc0IsQ0FBQztRQUNqRixRQUFRLEVBQUUseUNBQTBCO1FBQ3BDLFlBQVksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQywwQkFBWSxDQUFDLFNBQVMsRUFBRSxFQUFFLHFDQUF1QixDQUFDO0tBQ25GLENBQUM7SUFDRixNQUFNLHdCQUF3QixHQUFvQjtRQUNqRCxFQUFFLEVBQUUsa0RBQWtEO1FBQ3RELEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO1FBQ3hDLFFBQVEsRUFBRSx5Q0FBMEI7S0FDcEMsQ0FBQztJQUNGLE1BQU0s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