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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/progress/common/progress", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/platform/remoteTunnel/common/remoteTunnel", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/workbench/common/contributions", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/output/common/output", "vs/workbench/services/preferences/common/preferences"], function (require, exports, actions_1, lifecycle_1, network_1, resources_1, types_1, uri_1, nls_1, actions_2, clipboardService_1, commands_1, configurationRegistry_1, contextkey_1, dialogs_1, environment_1, log_1, notification_1, opener_1, productService_1, progress_1, quickInput_1, platform_1, remoteTunnel_1, storage_1, workspace_1, contributions_1, authentication_1, extensions_1, output_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteTunnelWorkbenchContribution = exports.REMOTE_TUNNEL_CONNECTION_STATE = exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY = exports.REMOTE_TUNNEL_CATEGORY = void 0;
    exports.REMOTE_TUNNEL_CATEGORY = (0, nls_1.localize2)('remoteTunnel.category', 'Remote Tunnels');
    exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY = 'remoteTunnelConnection';
    exports.REMOTE_TUNNEL_CONNECTION_STATE = new contextkey_1.RawContextKey(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'disconnected');
    const REMOTE_TUNNEL_USED_STORAGE_KEY = 'remoteTunnelServiceUsed';
    const REMOTE_TUNNEL_PROMPTED_PREVIEW_STORAGE_KEY = 'remoteTunnelServicePromptedPreview';
    const REMOTE_TUNNEL_EXTENSION_RECOMMENDED_KEY = 'remoteTunnelExtensionRecommended';
    const REMOTE_TUNNEL_HAS_USED_BEFORE = 'remoteTunnelHasUsed';
    const REMOTE_TUNNEL_EXTENSION_TIMEOUT = 4 * 60 * 1000; // show the recommendation that a machine started using tunnels if it joined less than 4 minutes ago
    const INVALID_TOKEN_RETRIES = 2;
    var RemoteTunnelCommandIds;
    (function (RemoteTunnelCommandIds) {
        RemoteTunnelCommandIds["turnOn"] = "workbench.remoteTunnel.actions.turnOn";
        RemoteTunnelCommandIds["turnOff"] = "workbench.remoteTunnel.actions.turnOff";
        RemoteTunnelCommandIds["connecting"] = "workbench.remoteTunnel.actions.connecting";
        RemoteTunnelCommandIds["manage"] = "workbench.remoteTunnel.actions.manage";
        RemoteTunnelCommandIds["showLog"] = "workbench.remoteTunnel.actions.showLog";
        RemoteTunnelCommandIds["configure"] = "workbench.remoteTunnel.actions.configure";
        RemoteTunnelCommandIds["copyToClipboard"] = "workbench.remoteTunnel.actions.copyToClipboard";
        RemoteTunnelCommandIds["learnMore"] = "workbench.remoteTunnel.actions.learnMore";
    })(RemoteTunnelCommandIds || (RemoteTunnelCommandIds = {}));
    // name shown in nofications
    var RemoteTunnelCommandLabels;
    (function (RemoteTunnelCommandLabels) {
        RemoteTunnelCommandLabels.turnOn = (0, nls_1.localize)('remoteTunnel.actions.turnOn', 'Turn on Remote Tunnel Access...');
        RemoteTunnelCommandLabels.turnOff = (0, nls_1.localize)('remoteTunnel.actions.turnOff', 'Turn off Remote Tunnel Access...');
        RemoteTunnelCommandLabels.showLog = (0, nls_1.localize)('remoteTunnel.actions.showLog', 'Show Remote Tunnel Service Log');
        RemoteTunnelCommandLabels.configure = (0, nls_1.localize)('remoteTunnel.actions.configure', 'Configure Tunnel Name...');
        RemoteTunnelCommandLabels.copyToClipboard = (0, nls_1.localize)('remoteTunnel.actions.copyToClipboard', 'Copy Browser URI to Clipboard');
        RemoteTunnelCommandLabels.learnMore = (0, nls_1.localize)('remoteTunnel.actions.learnMore', 'Get Started with Tunnels');
    })(RemoteTunnelCommandLabels || (RemoteTunnelCommandLabels = {}));
    let RemoteTunnelWorkbenchContribution = class RemoteTunnelWorkbenchContribution extends lifecycle_1.Disposable {
        constructor(authenticationService, dialogService, extensionService, contextKeyService, productService, storageService, loggerService, quickInputService, environmentService, remoteTunnelService, commandService, workspaceContextService, progressService, notificationService) {
            super();
            this.authenticationService = authenticationService;
            this.dialogService = dialogService;
            this.extensionService = extensionService;
            this.contextKeyService = contextKeyService;
            this.storageService = storageService;
            this.quickInputService = quickInputService;
            this.environmentService = environmentService;
            this.remoteTunnelService = remoteTunnelService;
            this.commandService = commandService;
            this.workspaceContextService = workspaceContextService;
            this.progressService = progressService;
            this.notificationService = notificationService;
            this.expiredSessions = new Set();
            this.logger = this._register(loggerService.createLogger((0, resources_1.joinPath)(environmentService.logsHome, `${remoteTunnel_1.LOG_ID}.log`), { id: remoteTunnel_1.LOG_ID, name: remoteTunnel_1.LOGGER_NAME }));
            this.connectionStateContext = exports.REMOTE_TUNNEL_CONNECTION_STATE.bindTo(this.contextKeyService);
            const serverConfiguration = productService.tunnelApplicationConfig;
            if (!serverConfiguration || !productService.tunnelApplicationName) {
                this.logger.error('Missing \'tunnelApplicationConfig\' or \'tunnelApplicationName\' in product.json. Remote tunneling is not available.');
                this.serverConfiguration = { authenticationProviders: {}, editorWebUrl: '', extension: { extensionId: '', friendlyName: '' } };
                return;
            }
            this.serverConfiguration = serverConfiguration;
            this._register(this.remoteTunnelService.onDidChangeTunnelStatus(s => this.handleTunnelStatusUpdate(s)));
            this.registerCommands();
            this.initialize();
            this.recommendRemoteExtensionIfNeeded();
        }
        handleTunnelStatusUpdate(status) {
            this.connectionInfo = undefined;
            if (status.type === 'disconnected') {
                if (status.onTokenFailed) {
                    this.expiredSessions.add(status.onTokenFailed.sessionId);
                }
                this.connectionStateContext.set('disconnected');
            }
            else if (status.type === 'connecting') {
                this.connectionStateContext.set('connecting');
            }
            else if (status.type === 'connected') {
                this.connectionInfo = status.info;
                this.connectionStateContext.set('connected');
            }
        }
        async recommendRemoteExtensionIfNeeded() {
            await this.extensionService.whenInstalledExtensionsRegistered();
            const remoteExtension = this.serverConfiguration.extension;
            const shouldRecommend = async () => {
                if (this.storageService.getBoolean(REMOTE_TUNNEL_EXTENSION_RECOMMENDED_KEY, -1 /* StorageScope.APPLICATION */)) {
                    return false;
                }
                if (await this.extensionService.getExtension(remoteExtension.extensionId)) {
                    return false;
                }
                const usedOnHostMessage = this.storageService.get(REMOTE_TUNNEL_USED_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
                if (!usedOnHostMessage) {
                    return false;
                }
                let usedTunnelName;
                try {
                    const message = JSON.parse(usedOnHostMessage);
                    if (!(0, types_1.isObject)(message)) {
                        return false;
                    }
                    const { hostName, timeStamp } = message;
                    if (!(0, types_1.isString)(hostName) || !(0, types_1.isNumber)(timeStamp) || new Date().getTime() > timeStamp + REMOTE_TUNNEL_EXTENSION_TIMEOUT) {
                        return false;
                    }
                    usedTunnelName = hostName;
                }
                catch (_) {
                    // problems parsing the message, likly the old message format
                    return false;
                }
                const currentTunnelName = await this.remoteTunnelService.getTunnelName();
                if (!currentTunnelName || currentTunnelName === usedTunnelName) {
                    return false;
                }
                return usedTunnelName;
            };
            const recommed = async () => {
                const usedOnHost = await shouldRecommend();
                if (!usedOnHost) {
                    return false;
                }
                this.notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message: (0, nls_1.localize)({
                        key: 'recommend.remoteExtension',
                        comment: ['{0} will be a tunnel name, {1} will the link address to the web UI, {6} an extension name. [label](command:commandId) is a markdown link. Only translate the label, do not modify the format']
                    }, "Tunnel '{0}' is avaiable for remote access. The {1} extension can be used to connect to it.", usedOnHost, remoteExtension.friendlyName),
                    actions: {
                        primary: [
                            new actions_1.Action('showExtension', (0, nls_1.localize)('action.showExtension', "Show Extension"), undefined, true, () => {
                                return this.commandService.executeCommand('workbench.extensions.action.showExtensionsWithIds', [remoteExtension.extensionId]);
                            }),
                            new actions_1.Action('doNotShowAgain', (0, nls_1.localize)('action.doNotShowAgain', "Do not show again"), undefined, true, () => {
                                this.storageService.store(REMOTE_TUNNEL_EXTENSION_RECOMMENDED_KEY, true, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                            }),
                        ]
                    }
                });
                return true;
            };
            if (await shouldRecommend()) {
                const disposables = this._register(new lifecycle_1.DisposableStore());
                disposables.add(this.storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, REMOTE_TUNNEL_USED_STORAGE_KEY, disposables)(async () => {
                    const success = await recommed();
                    if (success) {
                        disposables.dispose();
                    }
                }));
            }
        }
        async initialize() {
            const [mode, status] = await Promise.all([
                this.remoteTunnelService.getMode(),
                this.remoteTunnelService.getTunnelStatus(),
            ]);
            this.handleTunnelStatusUpdate(status);
            if (mode.active && mode.session.token) {
                return; // already initialized, token available
            }
            const doInitialStateDiscovery = async (progress) => {
                const listener = progress && this.remoteTunnelService.onDidChangeTunnelStatus(status => {
                    switch (status.type) {
                        case 'connecting':
                            if (status.progress) {
                                progress.report({ message: status.progress });
                            }
                            break;
                    }
                });
                let newSession;
                if (mode.active) {
                    const token = await this.getSessionToken(mode.session);
                    if (token) {
                        newSession = { ...mode.session, token };
                    }
                }
                const status = await this.remoteTunnelService.initialize(mode.active && newSession ? { ...mode, session: newSession } : remoteTunnel_1.INACTIVE_TUNNEL_MODE);
                listener?.dispose();
                if (status.type === 'connected') {
                    this.connectionInfo = status.info;
                    this.connectionStateContext.set('connected');
                    return;
                }
            };
            const hasUsed = this.storageService.getBoolean(REMOTE_TUNNEL_HAS_USED_BEFORE, -1 /* StorageScope.APPLICATION */, false);
            if (hasUsed) {
                await this.progressService.withProgress({
                    location: 10 /* ProgressLocation.Window */,
                    title: (0, nls_1.localize)({ key: 'initialize.progress.title', comment: ['Only translate \'Looking for remote tunnel\', do not change the format of the rest (markdown link format)'] }, "[Looking for remote tunnel](command:{0})", RemoteTunnelCommandIds.showLog),
                }, doInitialStateDiscovery);
            }
            else {
                doInitialStateDiscovery(undefined);
            }
        }
        getPreferredTokenFromSession(session) {
            return session.session.accessToken || session.session.idToken;
        }
        async startTunnel(asService) {
            if (this.connectionInfo) {
                return this.connectionInfo;
            }
            this.storageService.store(REMOTE_TUNNEL_HAS_USED_BEFORE, true, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            let tokenProblems = false;
            for (let i = 0; i < INVALID_TOKEN_RETRIES; i++) {
                tokenProblems = false;
                const authenticationSession = await this.getAuthenticationSession();
                if (authenticationSession === undefined) {
                    this.logger.info('No authentication session available, not starting tunnel');
                    return undefined;
                }
                const result = await this.progressService.withProgress({
                    location: 15 /* ProgressLocation.Notification */,
                    title: (0, nls_1.localize)({ key: 'startTunnel.progress.title', comment: ['Only translate \'Starting remote tunnel\', do not change the format of the rest (markdown link format)'] }, "[Starting remote tunnel](command:{0})", RemoteTunnelCommandIds.showLog),
                }, (progress) => {
                    return new Promise((s, e) => {
                        let completed = false;
                        const listener = this.remoteTunnelService.onDidChangeTunnelStatus(status => {
                            switch (status.type) {
                                case 'connecting':
                                    if (status.progress) {
                                        progress.report({ message: status.progress });
                                    }
                                    break;
                                case 'connected':
                                    listener.dispose();
                                    completed = true;
                                    s(status.info);
                                    if (status.serviceInstallFailed) {
                                        this.notificationService.notify({
                                            severity: notification_1.Severity.Warning,
                                            message: (0, nls_1.localize)({
                                                key: 'remoteTunnel.serviceInstallFailed',
                                                comment: ['{Locked="](command:{0})"}']
                                            }, "Installation as a service failed, and we fell back to running the tunnel for this session. See the [error log](command:{0}) for details.", RemoteTunnelCommandIds.showLog),
                                        });
                                    }
                                    break;
                                case 'disconnected':
                                    listener.dispose();
                                    completed = true;
                                    tokenProblems = !!status.onTokenFailed;
                                    s(undefined);
                                    break;
                            }
                        });
                        const token = this.getPreferredTokenFromSession(authenticationSession);
                        const account = { sessionId: authenticationSession.session.id, token, providerId: authenticationSession.providerId, accountLabel: authenticationSession.session.account.label };
                        this.remoteTunnelService.startTunnel({ active: true, asService, session: account }).then(status => {
                            if (!completed && (status.type === 'connected' || status.type === 'disconnected')) {
                                listener.dispose();
                                if (status.type === 'connected') {
                                    s(status.info);
                                }
                                else {
                                    tokenProblems = !!status.onTokenFailed;
                                    s(undefined);
                                }
                            }
                        });
                    });
                });
                if (result || !tokenProblems) {
                    return result;
                }
            }
            return undefined;
        }
        async getAuthenticationSession() {
            const sessions = await this.getAllSessions();
            const quickpick = this.quickInputService.createQuickPick();
            quickpick.ok = false;
            quickpick.placeholder = (0, nls_1.localize)('accountPreference.placeholder', "Sign in to an account to enable remote access");
            quickpick.ignoreFocusOut = true;
            quickpick.items = await this.createQuickpickItems(sessions);
            return new Promise((resolve, reject) => {
                quickpick.onDidHide((e) => {
                    resolve(undefined);
                    quickpick.dispose();
                });
                quickpick.onDidAccept(async (e) => {
                    const selection = quickpick.selectedItems[0];
                    if ('provider' in selection) {
                        const session = await this.authenticationService.createSession(selection.provider.id, selection.provider.scopes);
                        resolve(this.createExistingSessionItem(session, selection.provider.id));
                    }
                    else if ('session' in selection) {
                        resolve(selection);
                    }
                    else {
                        resolve(undefined);
                    }
                    quickpick.hide();
                });
                quickpick.show();
            });
        }
        createExistingSessionItem(session, providerId) {
            return {
                label: session.account.label,
                description: this.authenticationService.getProvider(providerId).label,
                session,
                providerId
            };
        }
        async createQuickpickItems(sessions) {
            const options = [];
            if (sessions.length) {
                options.push({ type: 'separator', label: (0, nls_1.localize)('signed in', "Signed In") });
                options.push(...sessions);
                options.push({ type: 'separator', label: (0, nls_1.localize)('others', "Others") });
            }
            for (const authenticationProvider of (await this.getAuthenticationProviders())) {
                const signedInForProvider = sessions.some(account => account.providerId === authenticationProvider.id);
                const provider = this.authenticationService.getProvider(authenticationProvider.id);
                if (!signedInForProvider || provider.supportsMultipleAccounts) {
                    options.push({ label: (0, nls_1.localize)({ key: 'sign in using account', comment: ['{0} will be a auth provider (e.g. Github)'] }, "Sign in with {0}", provider.label), provider: authenticationProvider });
                }
            }
            return options;
        }
        /**
         * Returns all authentication sessions available from {@link getAuthenticationProviders}.
         */
        async getAllSessions() {
            const authenticationProviders = await this.getAuthenticationProviders();
            const accounts = new Map();
            const currentAccount = await this.remoteTunnelService.getMode();
            let currentSession;
            for (const provider of authenticationProviders) {
                const sessions = await this.authenticationService.getSessions(provider.id, provider.scopes);
                for (const session of sessions) {
                    if (!this.expiredSessions.has(session.id)) {
                        const item = this.createExistingSessionItem(session, provider.id);
                        accounts.set(item.session.account.id, item);
                        if (currentAccount.active && currentAccount.session.sessionId === session.id) {
                            currentSession = item;
                        }
                    }
                }
            }
            if (currentSession !== undefined) {
                accounts.set(currentSession.session.account.id, currentSession);
            }
            return [...accounts.values()];
        }
        async getSessionToken(session) {
            if (session) {
                const sessionItem = (await this.getAllSessions()).find(s => s.session.id === session.sessionId);
                if (sessionItem) {
                    return this.getPreferredTokenFromSession(sessionItem);
                }
            }
            return undefined;
        }
        /**
         * Returns all authentication providers which can be used to authenticate
         * to the remote storage service, based on product.json configuration
         * and registered authentication providers.
         */
        async getAuthenticationProviders() {
            // Get the list of authentication providers configured in product.json
            const authenticationProviders = this.serverConfiguration.authenticationProviders;
            const configuredAuthenticationProviders = Object.keys(authenticationProviders).reduce((result, id) => {
                result.push({ id, scopes: authenticationProviders[id].scopes });
                return result;
            }, []);
            // Filter out anything that isn't currently available through the authenticationService
            const availableAuthenticationProviders = this.authenticationService.declaredProviders;
            return configuredAuthenticationProviders.filter(({ id }) => availableAuthenticationProviders.some(provider => provider.id === id));
        }
        registerCommands() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.turnOn,
                        title: RemoteTunnelCommandLabels.turnOn,
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        precondition: contextkey_1.ContextKeyExpr.equals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'disconnected'),
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                            },
                            {
                                id: actions_2.MenuId.AccountsContext,
                                group: '2_remoteTunnel',
                                when: contextkey_1.ContextKeyExpr.equals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'disconnected'),
                            }]
                    });
                }
                async run(accessor) {
                    const notificationService = accessor.get(notification_1.INotificationService);
                    const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                    const commandService = accessor.get(commands_1.ICommandService);
                    const storageService = accessor.get(storage_1.IStorageService);
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                    const productService = accessor.get(productService_1.IProductService);
                    const didNotifyPreview = storageService.getBoolean(REMOTE_TUNNEL_PROMPTED_PREVIEW_STORAGE_KEY, -1 /* StorageScope.APPLICATION */, false);
                    if (!didNotifyPreview) {
                        const { confirmed } = await dialogService.confirm({
                            message: (0, nls_1.localize)('tunnel.preview', 'Remote Tunnels is currently in preview. Please report any problems using the "Help: Report Issue" command.'),
                            primaryButton: (0, nls_1.localize)({ key: 'enable', comment: ['&& denotes a mnemonic'] }, '&&Enable')
                        });
                        if (!confirmed) {
                            return;
                        }
                        storageService.store(REMOTE_TUNNEL_PROMPTED_PREVIEW_STORAGE_KEY, true, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                    }
                    const disposables = new lifecycle_1.DisposableStore();
                    const quickPick = quickInputService.createQuickPick();
                    quickPick.placeholder = (0, nls_1.localize)('tunnel.enable.placeholder', 'Select how you want to enable access');
                    quickPick.items = [
                        { service: false, label: (0, nls_1.localize)('tunnel.enable.session', 'Turn on for this session'), description: (0, nls_1.localize)('tunnel.enable.session.description', 'Run whenever {0} is open', productService.nameShort) },
                        { service: true, label: (0, nls_1.localize)('tunnel.enable.service', 'Install as a service'), description: (0, nls_1.localize)('tunnel.enable.service.description', 'Run whenever you\'re logged in') }
                    ];
                    const asService = await new Promise(resolve => {
                        disposables.add(quickPick.onDidAccept(() => resolve(quickPick.selectedItems[0]?.service)));
                        disposables.add(quickPick.onDidHide(() => resolve(undefined)));
                        quickPick.show();
                    });
                    quickPick.dispose();
                    if (asService === undefined) {
                        return; // no-op
                    }
                    const connectionInfo = await that.startTunnel(/* installAsService= */ asService);
                    if (connectionInfo) {
                        const linkToOpen = that.getLinkToOpen(connectionInfo);
                        const remoteExtension = that.serverConfiguration.extension;
                        const linkToOpenForMarkdown = linkToOpen.toString(false).replace(/\)/g, '%29');
                        notificationService.notify({
                            severity: notification_1.Severity.Info,
                            message: (0, nls_1.localize)({
                                key: 'progress.turnOn.final',
                                comment: ['{0} will be the tunnel name, {1} will the link address to the web UI, {6} an extension name, {7} a link to the extension documentation. [label](command:commandId) is a markdown link. Only translate the label, do not modify the format']
                            }, "You can now access this machine anywhere via the secure tunnel [{0}](command:{4}). To connect via a different machine, use the generated [{1}]({2}) link or use the [{6}]({7}) extension in the desktop or web. You can [configure](command:{3}) or [turn off](command:{5}) this access via the VS Code Accounts menu.", connectionInfo.tunnelName, connectionInfo.domain, linkToOpenForMarkdown, RemoteTunnelCommandIds.manage, RemoteTunnelCommandIds.configure, RemoteTunnelCommandIds.turnOff, remoteExtension.friendlyName, 'https://code.visualstudio.com/docs/remote/tunnels'),
                            actions: {
                                primary: [
                                    new actions_1.Action('copyToClipboard', (0, nls_1.localize)('action.copyToClipboard', "Copy Browser Link to Clipboard"), undefined, true, () => clipboardService.writeText(linkToOpen.toString(true))),
                                    new actions_1.Action('showExtension', (0, nls_1.localize)('action.showExtension', "Show Extension"), undefined, true, () => {
                                        return commandService.executeCommand('workbench.extensions.action.showExtensionsWithIds', [remoteExtension.extensionId]);
                                    })
                                ]
                            }
                        });
                        const usedOnHostMessage = { hostName: connectionInfo.tunnelName, timeStamp: new Date().getTime() };
                        storageService.store(REMOTE_TUNNEL_USED_STORAGE_KEY, JSON.stringify(usedOnHostMessage), -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                    }
                    else {
                        notificationService.notify({
                            severity: notification_1.Severity.Info,
                            message: (0, nls_1.localize)('progress.turnOn.failed', "Unable to turn on the remote tunnel access. Check the Remote Tunnel Service log for details."),
                        });
                        await commandService.executeCommand(RemoteTunnelCommandIds.showLog);
                    }
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.manage,
                        title: (0, nls_1.localize)('remoteTunnel.actions.manage.on.v2', 'Remote Tunnel Access is On'),
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        menu: [{
                                id: actions_2.MenuId.AccountsContext,
                                group: '2_remoteTunnel',
                                when: contextkey_1.ContextKeyExpr.equals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'connected'),
                            }]
                    });
                }
                async run() {
                    that.showManageOptions();
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.connecting,
                        title: (0, nls_1.localize)('remoteTunnel.actions.manage.connecting', 'Remote Tunnel Access is Connecting'),
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        menu: [{
                                id: actions_2.MenuId.AccountsContext,
                                group: '2_remoteTunnel',
                                when: contextkey_1.ContextKeyExpr.equals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'connecting'),
                            }]
                    });
                }
                async run() {
                    that.showManageOptions();
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.turnOff,
                        title: RemoteTunnelCommandLabels.turnOff,
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        precondition: contextkey_1.ContextKeyExpr.notEquals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'disconnected'),
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.notEquals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, ''),
                            }]
                    });
                }
                async run() {
                    const message = that.connectionInfo?.isAttached ?
                        (0, nls_1.localize)('remoteTunnel.turnOffAttached.confirm', 'Do you want to turn off Remote Tunnel Access? This will also stop the service that was started externally.') :
                        (0, nls_1.localize)('remoteTunnel.turnOff.confirm', 'Do you want to turn off Remote Tunnel Access?');
                    const { confirmed } = await that.dialogService.confirm({ message });
                    if (confirmed) {
                        that.remoteTunnelService.stopTunnel();
                    }
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.showLog,
                        title: RemoteTunnelCommandLabels.showLog,
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.notEquals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, ''),
                            }]
                    });
                }
                async run(accessor) {
                    const outputService = accessor.get(output_1.IOutputService);
                    outputService.showChannel(remoteTunnel_1.LOG_ID);
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.configure,
                        title: RemoteTunnelCommandLabels.configure,
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.notEquals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, ''),
                            }]
                    });
                }
                async run(accessor) {
                    const preferencesService = accessor.get(preferences_1.IPreferencesService);
                    preferencesService.openSettings({ query: remoteTunnel_1.CONFIGURATION_KEY_PREFIX });
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.copyToClipboard,
                        title: RemoteTunnelCommandLabels.copyToClipboard,
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        precondition: contextkey_1.ContextKeyExpr.equals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'connected'),
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.equals(exports.REMOTE_TUNNEL_CONNECTION_STATE_KEY, 'connected'),
                            }]
                    });
                }
                async run(accessor) {
                    const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                    if (that.connectionInfo) {
                        const linkToOpen = that.getLinkToOpen(that.connectionInfo);
                        clipboardService.writeText(linkToOpen.toString(true));
                    }
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: RemoteTunnelCommandIds.learnMore,
                        title: RemoteTunnelCommandLabels.learnMore,
                        category: exports.REMOTE_TUNNEL_CATEGORY,
                        menu: []
                    });
                }
                async run(accessor) {
                    const openerService = accessor.get(opener_1.IOpenerService);
                    await openerService.open('https://aka.ms/vscode-server-doc');
                }
            }));
        }
        getLinkToOpen(connectionInfo) {
            const workspace = this.workspaceContextService.getWorkspace();
            const folders = workspace.folders;
            let resource;
            if (folders.length === 1) {
                resource = folders[0].uri;
            }
            else if (workspace.configuration && !(0, workspace_1.isUntitledWorkspace)(workspace.configuration, this.environmentService)) {
                resource = workspace.configuration;
            }
            const link = uri_1.URI.parse(connectionInfo.link);
            if (resource?.scheme === network_1.Schemas.file) {
                return (0, resources_1.joinPath)(link, resource.path);
            }
            return (0, resources_1.joinPath)(link, this.environmentService.userHome.path);
        }
        async showManageOptions() {
            const account = await this.remoteTunnelService.getMode();
            return new Promise((c, e) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = this.quickInputService.createQuickPick();
                quickPick.placeholder = (0, nls_1.localize)('manage.placeholder', 'Select a command to invoke');
                disposables.add(quickPick);
                const items = [];
                items.push({ id: RemoteTunnelCommandIds.learnMore, label: RemoteTunnelCommandLabels.learnMore });
                if (this.connectionInfo) {
                    quickPick.title =
                        this.connectionInfo.isAttached ?
                            (0, nls_1.localize)({ key: 'manage.title.attached', comment: ['{0} is the tunnel name'] }, 'Remote Tunnel Access enabled for {0} (launched externally)', this.connectionInfo.tunnelName) :
                            (0, nls_1.localize)({ key: 'manage.title.orunning', comment: ['{0} is the tunnel name'] }, 'Remote Tunnel Access enabled for {0}', this.connectionInfo.tunnelName);
                    items.push({ id: RemoteTunnelCommandIds.copyToClipboard, label: RemoteTunnelCommandLabels.copyToClipboard, description: this.connectionInfo.domain });
                }
                else {
                    quickPick.title = (0, nls_1.localize)('manage.title.off', 'Remote Tunnel Access not enabled');
                }
                items.push({ id: RemoteTunnelCommandIds.showLog, label: (0, nls_1.localize)('manage.showLog', 'Show Log') });
                items.push({ type: 'separator' });
                items.push({ id: RemoteTunnelCommandIds.configure, label: (0, nls_1.localize)('manage.tunnelName', 'Change Tunnel Name'), description: this.connectionInfo?.tunnelName });
                items.push({ id: RemoteTunnelCommandIds.turnOff, label: RemoteTunnelCommandLabels.turnOff, description: account.active ? `${account.session.accountLabel} (${account.session.providerId})` : undefined });
                quickPick.items = items;
                disposables.add(quickPick.onDidAccept(() => {
                    if (quickPick.selectedItems[0] && quickPick.selectedItems[0].id) {
                        this.commandService.executeCommand(quickPick.selectedItems[0].id);
                    }
                    quickPick.hide();
                }));
                disposables.add(quickPick.onDidHide(() => {
                    disposables.dispose();
                    c();
                }));
                quickPick.show();
            });
        }
    };
    exports.RemoteTunnelWorkbenchContribution = RemoteTunnelWorkbenchContribution;
    exports.RemoteTunnelWorkbenchContribution = RemoteTunnelWorkbenchContribution = __decorate([
        __param(0, authentication_1.IAuthenticationService),
        __param(1, dialogs_1.IDialogService),
        __param(2, extensions_1.IExtensionService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, productService_1.IProductService),
        __param(5, storage_1.IStorageService),
        __param(6, log_1.ILoggerService),
        __param(7, quickInput_1.IQuickInputService),
        __param(8, environment_1.INativeEnvironmentService),
        __param(9, remoteTunnel_1.IRemoteTunnelService),
        __param(10, commands_1.ICommandService),
        __param(11, workspace_1.IWorkspaceContextService),
        __param(12, progress_1.IProgressService),
        __param(13, notification_1.INotificationService)
    ], RemoteTunnelWorkbenchContribution);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(RemoteTunnelWorkbenchContribution, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        type: 'object',
        properties: {
            [remoteTunnel_1.CONFIGURATION_KEY_HOST_NAME]: {
                description: (0, nls_1.localize)('remoteTunnelAccess.machineName', "The name under which the remote tunnel access is registered. If not set, the host name is used."),
                type: 'string',
                scope: 1 /* ConfigurationScope.APPLICATION */,
                ignoreSync: true,
                pattern: '^(\\w[\\w-]*)?$',
                patternErrorMessage: (0, nls_1.localize)('remoteTunnelAccess.machineNameRegex', "The name must only consist of letters, numbers, underscore and dash. It must not start with a dash."),
                maxLength: 20,
                default: ''
            },
            [remoteTunnel_1.CONFIGURATION_KEY_PREVENT_SLEEP]: {
                description: (0, nls_1.localize)('remoteTunnelAccess.preventSleep', "Prevent this computer from sleeping when remote tunnel access is turned on."),
                type: 'boolean',
                scope: 1 /* ConfigurationScope.APPLICATION */,
                default: false,
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlVHVubmVsLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcmVtb3RlVHVubmVsL2VsZWN0cm9uLXNhbmRib3gvcmVtb3RlVHVubmVsLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQ25GLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSxlQUFTLEVBQUMsdUJBQXVCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUk5RSxRQUFBLGtDQUFrQyxHQUFHLHdCQUF3QixDQUFDO0lBQzlELFFBQUEsOEJBQThCLEdBQUcsSUFBSSwwQkFBYSxDQUFxQiwwQ0FBa0MsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUV4SSxNQUFNLDhCQUE4QixHQUFHLHlCQUF5QixDQUFDO0lBQ2pFLE1BQU0sMENBQTBDLEdBQUcsb0NBQW9DLENBQUM7SUFDeEYsTUFBTSx1Q0FBdUMsR0FBRyxrQ0FBa0MsQ0FBQztJQUNuRixNQUFNLDZCQUE2QixHQUFHLHFCQUFxQixDQUFDO0lBQzVELE1BQU0sK0JBQStCLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxvR0FBb0c7SUFFM0osTUFBTSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7SUFRaEMsSUFBSyxzQkFTSjtJQVRELFdBQUssc0JBQXNCO1FBQzFCLDBFQUFnRCxDQUFBO1FBQ2hELDRFQUFrRCxDQUFBO1FBQ2xELGtGQUF3RCxDQUFBO1FBQ3hELDBFQUFnRCxDQUFBO1FBQ2hELDRFQUFrRCxDQUFBO1FBQ2xELGdGQUFzRCxDQUFBO1FBQ3RELDRGQUFrRSxDQUFBO1FBQ2xFLGdGQUFzRCxDQUFBO0lBQ3ZELENBQUMsRUFUSSxzQkFBc0IsS0FBdEIsc0JBQXNCLFFBUzFCO0lBRUQs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