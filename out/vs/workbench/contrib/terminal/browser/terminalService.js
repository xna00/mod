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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalStrings", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/theme", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/workspace/common/workspace", "vs/workbench/common/contextkeys", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalConfigHelper", "vs/workbench/contrib/terminal/browser/terminalEditorInput", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/browser/terminalProfileQuickpick", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/contrib/terminal/browser/xterm/xtermTerminal", "vs/workbench/contrib/terminal/browser/terminalInstance", "vs/platform/keybinding/common/keybinding", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/services/timer/browser/timerService", "vs/base/common/performance", "vs/workbench/contrib/terminal/browser/detachedTerminal", "vs/workbench/contrib/terminal/browser/terminalEvents", "vs/base/browser/window"], function (require, exports, dom, async_1, decorators_1, event_1, lifecycle_1, network_1, platform_1, uri_1, nls, commands_1, configuration_1, contextkey_1, dialogs_1, instantiation_1, notification_1, terminal_1, terminalStrings_1, colorRegistry_1, iconRegistry_1, theme_1, themeService_1, themables_1, workspace_1, contextkeys_1, viewsService_1, terminal_2, terminalActions_1, terminalConfigHelper_1, terminalEditorInput_1, terminalIcon_1, terminalProfileQuickpick_1, terminalUri_1, terminal_3, terminalContextKey_1, editorGroupColumn_1, editorGroupsService_1, editorService_1, environmentService_1, extensions_1, lifecycle_2, remoteAgentService_1, xtermTerminal_1, terminalInstance_1, keybinding_1, terminalCapabilityStore_1, timerService_1, performance_1, detachedTerminal_1, terminalEvents_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalService = void 0;
    let TerminalService = class TerminalService extends lifecycle_1.Disposable {
        get isProcessSupportRegistered() { return !!this._processSupportContextKey.get(); }
        get connectionState() { return this._connectionState; }
        get whenConnected() { return this._whenConnected.p; }
        get restoredGroupCount() { return this._restoredGroupCount; }
        get configHelper() { return this._configHelper; }
        get instances() {
            return this._terminalGroupService.instances.concat(this._terminalEditorService.instances);
        }
        get detachedInstances() {
            return this._detachedXterms;
        }
        getReconnectedTerminals(reconnectionOwner) {
            return this._reconnectedTerminals.get(reconnectionOwner);
        }
        get defaultLocation() { return this.configHelper.config.defaultLocation === "editor" /* TerminalLocationString.Editor */ ? terminal_1.TerminalLocation.Editor : terminal_1.TerminalLocation.Panel; }
        get activeInstance() {
            // Check if either an editor or panel terminal has focus and return that, regardless of the
            // value of _activeInstance. This avoids terminals created in the panel for example stealing
            // the active status even when it's not focused.
            for (const activeHostTerminal of this._hostActiveTerminals.values()) {
                if (activeHostTerminal?.hasFocus) {
                    return activeHostTerminal;
                }
            }
            // Fallback to the last recorded active terminal if neither have focus
            return this._activeInstance;
        }
        get onDidCreateInstance() { return this._onDidCreateInstance.event; }
        get onDidChangeInstanceDimensions() { return this._onDidChangeInstanceDimensions.event; }
        get onDidRegisterProcessSupport() { return this._onDidRegisterProcessSupport.event; }
        get onDidChangeConnectionState() { return this._onDidChangeConnectionState.event; }
        get onDidRequestStartExtensionTerminal() { return this._onDidRequestStartExtensionTerminal.event; }
        get onDidDisposeInstance() { return this._onDidDisposeInstance.event; }
        get onDidFocusInstance() { return this._onDidFocusInstance.event; }
        get onDidChangeActiveInstance() { return this._onDidChangeActiveInstance.event; }
        get onDidChangeInstances() { return this._onDidChangeInstances.event; }
        get onDidChangeInstanceCapability() { return this._onDidChangeInstanceCapability.event; }
        get onDidChangeActiveGroup() { return this._onDidChangeActiveGroup.event; }
        // Lazily initialized events that fire when the specified event fires on _any_ terminal
        // TODO: Batch events
        get onAnyInstanceData() { return this.createOnInstanceEvent(instance => event_1.Event.map(instance.onData, data => ({ instance, data }))); }
        get onAnyInstanceDataInput() { return this.createOnInstanceEvent(e => e.onDidInputData); }
        get onAnyInstanceIconChange() { return this.createOnInstanceEvent(e => e.onIconChanged); }
        get onAnyInstanceMaximumDimensionsChange() { return this.createOnInstanceEvent(e => event_1.Event.map(e.onMaximumDimensionsChanged, () => e, e.store)); }
        get onAnyInstancePrimaryStatusChange() { return this.createOnInstanceEvent(e => event_1.Event.map(e.statusList.onDidChangePrimaryStatus, () => e, e.store)); }
        get onAnyInstanceProcessIdReady() { return this.createOnInstanceEvent(e => e.onProcessIdReady); }
        get onAnyInstanceSelectionChange() { return this.createOnInstanceEvent(e => e.onDidChangeSelection); }
        get onAnyInstanceTitleChange() { return this.createOnInstanceEvent(e => e.onTitleChanged); }
        constructor(_contextKeyService, _lifecycleService, _logService, _dialogService, _instantiationService, _remoteAgentService, _viewsService, _configurationService, _environmentService, _terminalEditorService, _terminalGroupService, _terminalInstanceService, _editorGroupsService, _terminalProfileService, _extensionService, _notificationService, _workspaceContextService, _commandService, _keybindingService, _timerService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._lifecycleService = _lifecycleService;
            this._logService = _logService;
            this._dialogService = _dialogService;
            this._instantiationService = _instantiationService;
            this._remoteAgentService = _remoteAgentService;
            this._viewsService = _viewsService;
            this._configurationService = _configurationService;
            this._environmentService = _environmentService;
            this._terminalEditorService = _terminalEditorService;
            this._terminalGroupService = _terminalGroupService;
            this._terminalInstanceService = _terminalInstanceService;
            this._editorGroupsService = _editorGroupsService;
            this._terminalProfileService = _terminalProfileService;
            this._extensionService = _extensionService;
            this._notificationService = _notificationService;
            this._workspaceContextService = _workspaceContextService;
            this._commandService = _commandService;
            this._keybindingService = _keybindingService;
            this._timerService = _timerService;
            this._hostActiveTerminals = new Map();
            this._detachedXterms = new Set();
            this._isShuttingDown = false;
            this._backgroundedTerminalInstances = [];
            this._backgroundedTerminalDisposables = new Map();
            this._connectionState = 0 /* TerminalConnectionState.Connecting */;
            this._whenConnected = new async_1.DeferredPromise();
            this._restoredGroupCount = 0;
            this._reconnectedTerminals = new Map();
            this._onDidCreateInstance = this._register(new event_1.Emitter());
            this._onDidChangeInstanceDimensions = this._register(new event_1.Emitter());
            this._onDidRegisterProcessSupport = this._register(new event_1.Emitter());
            this._onDidChangeConnectionState = this._register(new event_1.Emitter());
            this._onDidRequestStartExtensionTerminal = this._register(new event_1.Emitter());
            // ITerminalInstanceHost events
            this._onDidDisposeInstance = this._register(new event_1.Emitter());
            this._onDidFocusInstance = this._register(new event_1.Emitter());
            this._onDidChangeActiveInstance = this._register(new event_1.Emitter());
            this._onDidChangeInstances = this._register(new event_1.Emitter());
            this._onDidChangeInstanceCapability = this._register(new event_1.Emitter());
            // Terminal view events
            this._onDidChangeActiveGroup = this._register(new event_1.Emitter());
            this._configHelper = this._register(this._instantiationService.createInstance(terminalConfigHelper_1.TerminalConfigHelper));
            // the below avoids having to poll routinely.
            // we update detected profiles when an instance is created so that,
            // for example, we detect if you've installed a pwsh
            this._register(this.onDidCreateInstance(() => this._terminalProfileService.refreshAvailableProfiles()));
            this._forwardInstanceHostEvents(this._terminalGroupService);
            this._forwardInstanceHostEvents(this._terminalEditorService);
            this._register(this._terminalGroupService.onDidChangeActiveGroup(this._onDidChangeActiveGroup.fire, this._onDidChangeActiveGroup));
            this._register(this._terminalInstanceService.onDidCreateInstance(instance => {
                this._initInstanceListeners(instance);
                this._onDidCreateInstance.fire(instance);
            }));
            // Hide the panel if there are no more instances, provided that VS Code is not shutting
            // down. When shutting down the panel is locked in place so that it is restored upon next
            // launch.
            this._register(this._terminalGroupService.onDidChangeActiveInstance(instance => {
                if (!instance && !this._isShuttingDown) {
                    this._terminalGroupService.hidePanel();
                }
                if (instance?.shellType) {
                    this._terminalShellTypeContextKey.set(instance.shellType.toString());
                }
                else if (!instance) {
                    this._terminalShellTypeContextKey.reset();
                }
            }));
            this._handleInstanceContextKeys();
            this._terminalShellTypeContextKey = terminalContextKey_1.TerminalContextKeys.shellType.bindTo(this._contextKeyService);
            this._processSupportContextKey = terminalContextKey_1.TerminalContextKeys.processSupported.bindTo(this._contextKeyService);
            this._processSupportContextKey.set(!platform_1.isWeb || this._remoteAgentService.getConnection() !== null);
            this._terminalHasBeenCreated = terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated.bindTo(this._contextKeyService);
            this._terminalCountContextKey = terminalContextKey_1.TerminalContextKeys.count.bindTo(this._contextKeyService);
            this._terminalEditorActive = terminalContextKey_1.TerminalContextKeys.terminalEditorActive.bindTo(this._contextKeyService);
            this.onDidChangeActiveInstance(instance => {
                this._terminalEditorActive.set(!!instance?.target && instance.target === terminal_1.TerminalLocation.Editor);
            });
            _lifecycleService.onBeforeShutdown(async (e) => e.veto(this._onBeforeShutdown(e.reason), 'veto.terminal'));
            _lifecycleService.onWillShutdown(e => this._onWillShutdown(e));
            this._initializePrimaryBackend();
            // Create async as the class depends on `this`
            (0, async_1.timeout)(0).then(() => this._register(this._instantiationService.createInstance(TerminalEditorStyle, window_1.mainWindow.document.head)));
        }
        async showProfileQuickPick(type, cwd) {
            const quickPick = this._instantiationService.createInstance(terminalProfileQuickpick_1.TerminalProfileQuickpick);
            const result = await quickPick.showAndGetResult(type);
            if (!result) {
                return;
            }
            if (typeof result === 'string') {
                return;
            }
            const keyMods = result.keyMods;
            if (type === 'createInstance') {
                const activeInstance = this.getDefaultInstanceHost().activeInstance;
                let instance;
                if (result.config && 'id' in result?.config) {
                    await this.createContributedTerminalProfile(result.config.extensionIdentifier, result.config.id, {
                        icon: result.config.options?.icon,
                        color: result.config.options?.color,
                        location: !!(keyMods?.alt && activeInstance) ? { splitActiveTerminal: true } : this.defaultLocation
                    });
                    return;
                }
                else if (result.config && 'profileName' in result.config) {
                    if (keyMods?.alt && activeInstance) {
                        // create split, only valid if there's an active instance
                        instance = await this.createTerminal({ location: { parentTerminal: activeInstance }, config: result.config, cwd });
                    }
                    else {
                        instance = await this.createTerminal({ location: this.defaultLocation, config: result.config, cwd });
                    }
                }
                if (instance && this.defaultLocation !== terminal_1.TerminalLocation.Editor) {
                    this._terminalGroupService.showPanel(true);
                    this.setActiveInstance(instance);
                    return instance;
                }
            }
            return undefined;
        }
        async _initializePrimaryBackend() {
            (0, performance_1.mark)('code/terminal/willGetTerminalBackend');
            this._primaryBackend = await this._terminalInstanceService.getBackend(this._environmentService.remoteAuthority);
            (0, performance_1.mark)('code/terminal/didGetTerminalBackend');
            const enableTerminalReconnection = this.configHelper.config.enablePersistentSessions;
            // Connect to the extension host if it's there, set the connection state to connected when
            // it's done. This should happen even when there is no extension host.
            this._connectionState = 0 /* TerminalConnectionState.Connecting */;
            const isPersistentRemote = !!this._environmentService.remoteAuthority && enableTerminalReconnection;
            this._primaryBackend?.onDidRequestDetach(async (e) => {
                const instanceToDetach = this.getInstanceFromResource((0, terminalUri_1.getTerminalUri)(e.workspaceId, e.instanceId));
                if (instanceToDetach) {
                    const persistentProcessId = instanceToDetach?.persistentProcessId;
                    if (persistentProcessId && !instanceToDetach.shellLaunchConfig.isFeatureTerminal && !instanceToDetach.shellLaunchConfig.customPtyImplementation) {
                        if (instanceToDetach.target === terminal_1.TerminalLocation.Editor) {
                            this._terminalEditorService.detachInstance(instanceToDetach);
                        }
                        else {
                            this._terminalGroupService.getGroupForInstance(instanceToDetach)?.removeInstance(instanceToDetach);
                        }
                        await instanceToDetach.detachProcessAndDispose(terminal_1.TerminalExitReason.User);
                        await this._primaryBackend?.acceptDetachInstanceReply(e.requestId, persistentProcessId);
                    }
                    else {
                        // will get rejected without a persistentProcessId to attach to
                        await this._primaryBackend?.acceptDetachInstanceReply(e.requestId, undefined);
                    }
                }
            });
            (0, performance_1.mark)('code/terminal/willReconnect');
            let reconnectedPromise;
            if (isPersistentRemote) {
                reconnectedPromise = this._reconnectToRemoteTerminals();
            }
            else if (enableTerminalReconnection) {
                reconnectedPromise = this._reconnectToLocalTerminals();
            }
            else {
                reconnectedPromise = Promise.resolve();
            }
            reconnectedPromise.then(async () => {
                this._setConnected();
                (0, performance_1.mark)('code/terminal/didReconnect');
                (0, performance_1.mark)('code/terminal/willReplay');
                const instances = await this._reconnectedTerminalGroups?.then(groups => groups.map(e => e.terminalInstances).flat()) ?? [];
                await Promise.all(instances.map(e => new Promise(r => event_1.Event.once(e.onProcessReplayComplete)(r))));
                (0, performance_1.mark)('code/terminal/didReplay');
                (0, performance_1.mark)('code/terminal/willGetPerformanceMarks');
                await Promise.all(Array.from(this._terminalInstanceService.getRegisteredBackends()).map(async (backend) => {
                    this._timerService.setPerformanceMarks(backend.remoteAuthority === undefined ? 'localPtyHost' : 'remotePtyHost', await backend.getPerformanceMarks());
                    backend.setReady();
                }));
                (0, performance_1.mark)('code/terminal/didGetPerformanceMarks');
                this._whenConnected.complete();
            });
        }
        getPrimaryBackend() {
            return this._primaryBackend;
        }
        _forwardInstanceHostEvents(host) {
            host.onDidChangeInstances(this._onDidChangeInstances.fire, this._onDidChangeInstances);
            host.onDidDisposeInstance(this._onDidDisposeInstance.fire, this._onDidDisposeInstance);
            host.onDidChangeActiveInstance(instance => this._evaluateActiveInstance(host, instance));
            host.onDidFocusInstance(instance => {
                this._onDidFocusInstance.fire(instance);
                this._evaluateActiveInstance(host, instance);
            });
            host.onDidChangeInstanceCapability((instance) => {
                this._onDidChangeInstanceCapability.fire(instance);
            });
            this._hostActiveTerminals.set(host, undefined);
        }
        _evaluateActiveInstance(host, instance) {
            // Track the latest active terminal for each host so that when one becomes undefined, the
            // TerminalService's active terminal is set to the last active terminal from the other host.
            // This means if the last terminal editor is closed such that it becomes undefined, the last
            // active group's terminal will be used as the active terminal if available.
            this._hostActiveTerminals.set(host, instance);
            if (instance === undefined) {
                for (const active of this._hostActiveTerminals.values()) {
                    if (active) {
                        instance = active;
                    }
                }
            }
            this._activeInstance = instance;
            this._onDidChangeActiveInstance.fire(instance);
        }
        setActiveInstance(value) {
            // If this was a hideFromUser terminal created by the API this was triggered by show,
            // in which case we need to create the terminal group
            if (value.shellLaunchConfig.hideFromUser) {
                this._showBackgroundTerminal(value);
            }
            if (value.target === terminal_1.TerminalLocation.Editor) {
                this._terminalEditorService.setActiveInstance(value);
            }
            else {
                this._terminalGroupService.setActiveInstance(value);
            }
        }
        async focusActiveInstance() {
            if (!this._activeInstance) {
                return;
            }
            if (this._activeInstance.target === terminal_1.TerminalLocation.Editor) {
                return this._terminalEditorService.focusActiveInstance();
            }
            return this._terminalGroupService.focusActiveInstance();
        }
        async createContributedTerminalProfile(extensionIdentifier, id, options) {
            await this._extensionService.activateByEvent(`onTerminalProfile:${id}`);
            const profileProvider = this._terminalProfileService.getContributedProfileProvider(extensionIdentifier, id);
            if (!profileProvider) {
                this._notificationService.error(`No terminal profile provider registered for id "${id}"`);
                return;
            }
            try {
                await profileProvider.createContributedTerminalProfile(options);
                this._terminalGroupService.setActiveInstanceByIndex(this._terminalGroupService.instances.length - 1);
                await this._terminalGroupService.activeInstance?.focusWhenReady();
            }
            catch (e) {
                this._notificationService.error(e.message);
            }
        }
        async safeDisposeTerminal(instance) {
            // Confirm on kill in the editor is handled by the editor input
            if (instance.target !== terminal_1.TerminalLocation.Editor &&
                instance.hasChildProcesses &&
                (this.configHelper.config.confirmOnKill === 'panel' || this.configHelper.config.confirmOnKill === 'always')) {
                const veto = await this._showTerminalCloseConfirmation(true);
                if (veto) {
                    return;
                }
            }
            return new Promise(r => {
                event_1.Event.once(instance.onExit)(() => r());
                instance.dispose(terminal_1.TerminalExitReason.User);
            });
        }
        _setConnected() {
            this._connectionState = 1 /* TerminalConnectionState.Connected */;
            this._onDidChangeConnectionState.fire();
            this._logService.trace('Pty host ready');
        }
        async _reconnectToRemoteTerminals() {
            const remoteAuthority = this._environmentService.remoteAuthority;
            if (!remoteAuthority) {
                return;
            }
            const backend = await this._terminalInstanceService.getBackend(remoteAuthority);
            if (!backend) {
                return;
            }
            (0, performance_1.mark)('code/terminal/willGetTerminalLayoutInfo');
            const layoutInfo = await backend.getTerminalLayoutInfo();
            (0, performance_1.mark)('code/terminal/didGetTerminalLayoutInfo');
            backend.reduceConnectionGraceTime();
            (0, performance_1.mark)('code/terminal/willRecreateTerminalGroups');
            await this._recreateTerminalGroups(layoutInfo);
            (0, performance_1.mark)('code/terminal/didRecreateTerminalGroups');
            // now that terminals have been restored,
            // attach listeners to update remote when terminals are changed
            this._attachProcessLayoutListeners();
            this._logService.trace('Reconnected to remote terminals');
        }
        async _reconnectToLocalTerminals() {
            const localBackend = await this._terminalInstanceService.getBackend();
            if (!localBackend) {
                return;
            }
            (0, performance_1.mark)('code/terminal/willGetTerminalLayoutInfo');
            const layoutInfo = await localBackend.getTerminalLayoutInfo();
            (0, performance_1.mark)('code/terminal/didGetTerminalLayoutInfo');
            if (layoutInfo && layoutInfo.tabs.length > 0) {
                (0, performance_1.mark)('code/terminal/willRecreateTerminalGroups');
                this._reconnectedTerminalGroups = this._recreateTerminalGroups(layoutInfo);
                (0, performance_1.mark)('code/terminal/didRecreateTerminalGroups');
            }
            // now that terminals have been restored,
            // attach listeners to update local state when terminals are changed
            this._attachProcessLayoutListeners();
            this._logService.trace('Reconnected to local terminals');
        }
        _recreateTerminalGroups(layoutInfo) {
            const groupPromises = [];
            let activeGroup;
            if (layoutInfo) {
                for (const tabLayout of layoutInfo.tabs) {
                    const terminalLayouts = tabLayout.terminals.filter(t => t.terminal && t.terminal.isOrphan);
                    if (terminalLayouts.length) {
                        this._restoredGroupCount += terminalLayouts.length;
                        const promise = this._recreateTerminalGroup(tabLayout, terminalLayouts);
                        groupPromises.push(promise);
                        if (tabLayout.isActive) {
                            activeGroup = promise;
                        }
                        const activeInstance = this.instances.find(t => t.shellLaunchConfig.attachPersistentProcess?.id === tabLayout.activePersistentProcessId);
                        if (activeInstance) {
                            this.setActiveInstance(activeInstance);
                        }
                    }
                }
                if (layoutInfo.tabs.length) {
                    activeGroup?.then(group => this._terminalGroupService.activeGroup = group);
                }
            }
            return Promise.all(groupPromises).then(result => result.filter(e => !!e));
        }
        async _recreateTerminalGroup(tabLayout, terminalLayouts) {
            let lastInstance;
            for (const terminalLayout of terminalLayouts) {
                const attachPersistentProcess = terminalLayout.terminal;
                if (this._lifecycleService.startupKind !== 3 /* StartupKind.ReloadedWindow */ && attachPersistentProcess.type === 'Task') {
                    continue;
                }
                (0, performance_1.mark)(`code/terminal/willRecreateTerminal/${attachPersistentProcess.id}-${attachPersistentProcess.pid}`);
                lastInstance = this.createTerminal({
                    config: { attachPersistentProcess },
                    location: lastInstance ? { parentTerminal: lastInstance } : terminal_1.TerminalLocation.Panel
                });
                lastInstance.then(() => (0, performance_1.mark)(`code/terminal/didRecreateTerminal/${attachPersistentProcess.id}-${attachPersistentProcess.pid}`));
            }
            const group = lastInstance?.then(instance => {
                const g = this._terminalGroupService.getGroupForInstance(instance);
                g?.resizePanes(tabLayout.terminals.map(terminal => terminal.relativeSize));
                return g;
            });
            return group;
        }
        _attachProcessLayoutListeners() {
            this._register(this.onDidChangeActiveGroup(() => this._saveState()));
            this._register(this.onDidChangeActiveInstance(() => this._saveState()));
            this._register(this.onDidChangeInstances(() => this._saveState()));
            // The state must be updated when the terminal is relaunched, otherwise the persistent
            // terminal ID will be stale and the process will be leaked.
            this._register(this.onAnyInstanceProcessIdReady(() => this._saveState()));
            this._register(this.onAnyInstanceTitleChange(instance => this._updateTitle(instance)));
            this._register(this.onAnyInstanceIconChange(e => this._updateIcon(e.instance, e.userInitiated)));
        }
        _handleInstanceContextKeys() {
            const terminalIsOpenContext = terminalContextKey_1.TerminalContextKeys.isOpen.bindTo(this._contextKeyService);
            const updateTerminalContextKeys = () => {
                terminalIsOpenContext.set(this.instances.length > 0);
                this._terminalCountContextKey.set(this.instances.length);
            };
            this.onDidChangeInstances(() => updateTerminalContextKeys());
        }
        async getActiveOrCreateInstance(options) {
            const activeInstance = this.activeInstance;
            // No instance, create
            if (!activeInstance) {
                return this.createTerminal();
            }
            // Active instance, ensure accepts input
            if (!options?.acceptsInput || activeInstance.xterm?.isStdinDisabled !== true) {
                return activeInstance;
            }
            // Active instance doesn't accept input, create and focus
            const instance = await this.createTerminal();
            this.setActiveInstance(instance);
            await this.revealActiveTerminal();
            return instance;
        }
        async revealActiveTerminal(preserveFocus) {
            const instance = this.activeInstance;
            if (!instance) {
                return;
            }
            if (instance.target === terminal_1.TerminalLocation.Editor) {
                await this._terminalEditorService.revealActiveEditor(preserveFocus);
            }
            else {
                await this._terminalGroupService.showPanel();
            }
        }
        setEditable(instance, data) {
            if (!data) {
                this._editable = undefined;
            }
            else {
                this._editable = { instance: instance, data };
            }
            const pane = this._viewsService.getActiveViewWithId(terminal_3.TERMINAL_VIEW_ID);
            const isEditing = this.isEditable(instance);
            pane?.terminalTabbedView?.setEditable(isEditing);
        }
        isEditable(instance) {
            return !!this._editable && (this._editable.instance === instance || !instance);
        }
        getEditableData(instance) {
            return this._editable && this._editable.instance === instance ? this._editable.data : undefined;
        }
        requestStartExtensionTerminal(proxy, cols, rows) {
            // The initial request came from the extension host, no need to wait for it
            return new Promise(callback => {
                this._onDidRequestStartExtensionTerminal.fire({ proxy, cols, rows, callback });
            });
        }
        _onBeforeShutdown(reason) {
            // Never veto on web as this would block all windows from being closed. This disables
            // process revive as we can't handle it on shutdown.
            if (platform_1.isWeb) {
                this._isShuttingDown = true;
                return false;
            }
            return this._onBeforeShutdownAsync(reason);
        }
        async _onBeforeShutdownAsync(reason) {
            if (this.instances.length === 0) {
                // No terminal instances, don't veto
                return false;
            }
            // Persist terminal _buffer state_, note that even if this happens the dirty terminal prompt
            // still shows as that cannot be revived
            try {
                this._shutdownWindowCount = await this._nativeDelegate?.getWindowCount();
                const shouldReviveProcesses = this._shouldReviveProcesses(reason);
                if (shouldReviveProcesses) {
                    // Attempt to persist the terminal state but only allow 2000ms as we can't block
                    // shutdown. This can happen when in a remote workspace but the other side has been
                    // suspended and is in the process of reconnecting, the message will be put in a
                    // queue in this case for when the connection is back up and running. Aborting the
                    // process is preferable in this case.
                    await Promise.race([
                        this._primaryBackend?.persistTerminalState(),
                        (0, async_1.timeout)(2000)
                    ]);
                }
                // Persist terminal _processes_
                const shouldPersistProcesses = this._configHelper.config.enablePersistentSessions && reason === 3 /* ShutdownReason.RELOAD */;
                if (!shouldPersistProcesses) {
                    const hasDirtyInstances = ((this.configHelper.config.confirmOnExit === 'always' && this.instances.length > 0) ||
                        (this.configHelper.config.confirmOnExit === 'hasChildProcesses' && this.instances.some(e => e.hasChildProcesses)));
                    if (hasDirtyInstances) {
                        return this._onBeforeShutdownConfirmation(reason);
                    }
                }
            }
            catch (err) {
                // Swallow as exceptions should not cause a veto to prevent shutdown
                this._logService.warn('Exception occurred during terminal shutdown', err);
            }
            this._isShuttingDown = true;
            return false;
        }
        setNativeDelegate(nativeDelegate) {
            this._nativeDelegate = nativeDelegate;
        }
        _shouldReviveProcesses(reason) {
            if (!this._configHelper.config.enablePersistentSessions) {
                return false;
            }
            switch (this.configHelper.config.persistentSessionReviveProcess) {
                case 'onExit': {
                    // Allow on close if it's the last window on Windows or Linux
                    if (reason === 1 /* ShutdownReason.CLOSE */ && (this._shutdownWindowCount === 1 && !platform_1.isMacintosh)) {
                        return true;
                    }
                    return reason === 4 /* ShutdownReason.LOAD */ || reason === 2 /* ShutdownReason.QUIT */;
                }
                case 'onExitAndWindowClose': return reason !== 3 /* ShutdownReason.RELOAD */;
                default: return false;
            }
        }
        async _onBeforeShutdownConfirmation(reason) {
            // veto if configured to show confirmation and the user chose not to exit
            const veto = await this._showTerminalCloseConfirmation();
            if (!veto) {
                this._isShuttingDown = true;
            }
            return veto;
        }
        _onWillShutdown(e) {
            // Don't touch processes if the shutdown was a result of reload as they will be reattached
            const shouldPersistTerminals = this._configHelper.config.enablePersistentSessions && e.reason === 3 /* ShutdownReason.RELOAD */;
            for (const instance of [...this._terminalGroupService.instances, ...this._backgroundedTerminalInstances]) {
                if (shouldPersistTerminals && instance.shouldPersist) {
                    instance.detachProcessAndDispose(terminal_1.TerminalExitReason.Shutdown);
                }
                else {
                    instance.dispose(terminal_1.TerminalExitReason.Shutdown);
                }
            }
            // Clear terminal layout info only when not persisting
            if (!shouldPersistTerminals && !this._shouldReviveProcesses(e.reason)) {
                this._primaryBackend?.setTerminalLayoutInfo(undefined);
            }
        }
        _saveState() {
            // Avoid saving state when shutting down as that would override process state to be revived
            if (this._isShuttingDown) {
                return;
            }
            if (!this.configHelper.config.enablePersistentSessions) {
                return;
            }
            const tabs = this._terminalGroupService.groups.map(g => g.getLayoutInfo(g === this._terminalGroupService.activeGroup));
            const state = { tabs };
            this._primaryBackend?.setTerminalLayoutInfo(state);
        }
        _updateTitle(instance) {
            if (!this.configHelper.config.enablePersistentSessions || !instance || !instance.persistentProcessId || !instance.title || instance.isDisposed) {
                return;
            }
            if (instance.staticTitle) {
                this._primaryBackend?.updateTitle(instance.persistentProcessId, instance.staticTitle, terminal_1.TitleEventSource.Api);
            }
            else {
                this._primaryBackend?.updateTitle(instance.persistentProcessId, instance.title, instance.titleSource);
            }
        }
        _updateIcon(instance, userInitiated) {
            if (!this.configHelper.config.enablePersistentSessions || !instance || !instance.persistentProcessId || !instance.icon || instance.isDisposed) {
                return;
            }
            this._primaryBackend?.updateIcon(instance.persistentProcessId, userInitiated, instance.icon, instance.color);
        }
        refreshActiveGroup() {
            this._onDidChangeActiveGroup.fire(this._terminalGroupService.activeGroup);
        }
        getInstanceFromId(terminalId) {
            let bgIndex = -1;
            this._backgroundedTerminalInstances.forEach((terminalInstance, i) => {
                if (terminalInstance.instanceId === terminalId) {
                    bgIndex = i;
                }
            });
            if (bgIndex !== -1) {
                return this._backgroundedTerminalInstances[bgIndex];
            }
            try {
                return this.instances[this._getIndexFromId(terminalId)];
            }
            catch {
                return undefined;
            }
        }
        getInstanceFromIndex(terminalIndex) {
            return this.instances[terminalIndex];
        }
        getInstanceFromResource(resource) {
            return (0, terminalUri_1.getInstanceFromResource)(this.instances, resource);
        }
        isAttachedToTerminal(remoteTerm) {
            return this.instances.some(term => term.processId === remoteTerm.pid);
        }
        moveToEditor(source, group) {
            if (source.target === terminal_1.TerminalLocation.Editor) {
                return;
            }
            const sourceGroup = this._terminalGroupService.getGroupForInstance(source);
            if (!sourceGroup) {
                return;
            }
            sourceGroup.removeInstance(source);
            this._terminalEditorService.openEditor(source, group ? { viewColumn: group } : undefined);
        }
        moveIntoNewEditor(source) {
            this.moveToEditor(source, editorService_1.AUX_WINDOW_GROUP);
        }
        async moveToTerminalView(source, target, side) {
            if (uri_1.URI.isUri(source)) {
                source = this.getInstanceFromResource(source);
            }
            if (!source) {
                return;
            }
            this._terminalEditorService.detachInstance(source);
            if (source.target !== terminal_1.TerminalLocation.Editor) {
                await this._terminalGroupService.showPanel(true);
                return;
            }
            source.target = terminal_1.TerminalLocation.Panel;
            let group;
            if (target) {
                group = this._terminalGroupService.getGroupForInstance(target);
            }
            if (!group) {
                group = this._terminalGroupService.createGroup();
            }
            group.addInstance(source);
            this.setActiveInstance(source);
            await this._terminalGroupService.showPanel(true);
            if (target && side) {
                const index = group.terminalInstances.indexOf(target) + (side === 'after' ? 1 : 0);
                group.moveInstance(source, index);
            }
            // Fire events
            this._onDidChangeInstances.fire();
            this._onDidChangeActiveGroup.fire(this._terminalGroupService.activeGroup);
        }
        _initInstanceListeners(instance) {
            const instanceDisposables = [
                instance.onDimensionsChanged(() => {
                    this._onDidChangeInstanceDimensions.fire(instance);
                    if (this.configHelper.config.enablePersistentSessions && this.isProcessSupportRegistered) {
                        this._saveState();
                    }
                }),
                instance.onDidFocus(this._onDidChangeActiveInstance.fire, this._onDidChangeActiveInstance),
                instance.onRequestAddInstanceToGroup(async (e) => await this._addInstanceToGroup(instance, e))
            ];
            instance.onDisposed(() => (0, lifecycle_1.dispose)(instanceDisposables));
        }
        async _addInstanceToGroup(instance, e) {
            const terminalIdentifier = (0, terminalUri_1.parseTerminalUri)(e.uri);
            if (terminalIdentifier.instanceId === undefined) {
                return;
            }
            let sourceInstance = this.getInstanceFromResource(e.uri);
            // Terminal from a different window
            if (!sourceInstance) {
                const attachPersistentProcess = await this._primaryBackend?.requestDetachInstance(terminalIdentifier.workspaceId, terminalIdentifier.instanceId);
                if (attachPersistentProcess) {
                    sourceInstance = await this.createTerminal({ config: { attachPersistentProcess }, resource: e.uri });
                    this._terminalGroupService.moveInstance(sourceInstance, instance, e.side);
                    return;
                }
            }
            // View terminals
            sourceInstance = this._terminalGroupService.getInstanceFromResource(e.uri);
            if (sourceInstance) {
                this._terminalGroupService.moveInstance(sourceInstance, instance, e.side);
                return;
            }
            // Terminal editors
            sourceInstance = this._terminalEditorService.getInstanceFromResource(e.uri);
            if (sourceInstance) {
                this.moveToTerminalView(sourceInstance, instance, e.side);
                return;
            }
            return;
        }
        registerProcessSupport(isSupported) {
            if (!isSupported) {
                return;
            }
            this._processSupportContextKey.set(isSupported);
            this._onDidRegisterProcessSupport.fire();
        }
        // TODO: Remove this, it should live in group/editor servioce
        _getIndexFromId(terminalId) {
            let terminalIndex = -1;
            this.instances.forEach((terminalInstance, i) => {
                if (terminalInstance.instanceId === terminalId) {
                    terminalIndex = i;
                }
            });
            if (terminalIndex === -1) {
                throw new Error(`Terminal with ID ${terminalId} does not exist (has it already been disposed?)`);
            }
            return terminalIndex;
        }
        async _showTerminalCloseConfirmation(singleTerminal) {
            let message;
            if (this.instances.length === 1 || singleTerminal) {
                message = nls.localize('terminalService.terminalCloseConfirmationSingular', "Do you want to terminate the active terminal session?");
            }
            else {
                message = nls.localize('terminalService.terminalCloseConfirmationPlural', "Do you want to terminate the {0} active terminal sessions?", this.instances.length);
            }
            const { confirmed } = await this._dialogService.confirm({
                type: 'warning',
                message,
                primaryButton: nls.localize({ key: 'terminate', comment: ['&& denotes a mnemonic'] }, "&&Terminate")
            });
            return !confirmed;
        }
        getDefaultInstanceHost() {
            if (this.defaultLocation === terminal_1.TerminalLocation.Editor) {
                return this._terminalEditorService;
            }
            return this._terminalGroupService;
        }
        async getInstanceHost(location) {
            if (location) {
                if (location === terminal_1.TerminalLocation.Editor) {
                    return this._terminalEditorService;
                }
                else if (typeof location === 'object') {
                    if ('viewColumn' in location) {
                        return this._terminalEditorService;
                    }
                    else if ('parentTerminal' in location) {
                        return (await location.parentTerminal).target === terminal_1.TerminalLocation.Editor ? this._terminalEditorService : this._terminalGroupService;
                    }
                }
                else {
                    return this._terminalGroupService;
                }
            }
            return this;
        }
        async createTerminal(options) {
            // Await the initialization of available profiles as long as this is not a pty terminal or a
            // local terminal in a remote workspace as profile won't be used in those cases and these
            // terminals need to be launched before remote connections are established.
            if (this._terminalProfileService.availableProfiles.length === 0) {
                const isPtyTerminal = options?.config && 'customPtyImplementation' in options.config;
                const isLocalInRemoteTerminal = this._remoteAgentService.getConnection() && uri_1.URI.isUri(options?.cwd) && options?.cwd.scheme === network_1.Schemas.vscodeFileResource;
                if (!isPtyTerminal && !isLocalInRemoteTerminal) {
                    if (this._connectionState === 0 /* TerminalConnectionState.Connecting */) {
                        (0, performance_1.mark)(`code/terminal/willGetProfiles`);
                    }
                    await this._terminalProfileService.profilesReady;
                    if (this._connectionState === 0 /* TerminalConnectionState.Connecting */) {
                        (0, performance_1.mark)(`code/terminal/didGetProfiles`);
                    }
                }
            }
            const config = options?.config || this._terminalProfileService.getDefaultProfile();
            const shellLaunchConfig = config && 'extensionIdentifier' in config ? {} : this._terminalInstanceService.convertProfileToShellLaunchConfig(config || {});
            // Get the contributed profile if it was provided
            const contributedProfile = await this._getContributedProfile(shellLaunchConfig, options);
            const splitActiveTerminal = typeof options?.location === 'object' && 'splitActiveTerminal' in options.location ? options.location.splitActiveTerminal : typeof options?.location === 'object' ? 'parentTerminal' in options.location : false;
            await this._resolveCwd(shellLaunchConfig, splitActiveTerminal, options);
            // Launch the contributed profile
            if (contributedProfile) {
                const resolvedLocation = await this.resolveLocation(options?.location);
                let location;
                if (splitActiveTerminal) {
                    location = resolvedLocation === terminal_1.TerminalLocation.Editor ? { viewColumn: editorService_1.SIDE_GROUP } : { splitActiveTerminal: true };
                }
                else {
                    location = typeof options?.location === 'object' && 'viewColumn' in options.location ? options.location : resolvedLocation;
                }
                await this.createContributedTerminalProfile(contributedProfile.extensionIdentifier, contributedProfile.id, {
                    icon: contributedProfile.icon,
                    color: contributedProfile.color,
                    location,
                    cwd: shellLaunchConfig.cwd,
                });
                const instanceHost = resolvedLocation === terminal_1.TerminalLocation.Editor ? this._terminalEditorService : this._terminalGroupService;
                const instance = instanceHost.instances[instanceHost.instances.length - 1];
                await instance?.focusWhenReady();
                this._terminalHasBeenCreated.set(true);
                return instance;
            }
            if (!shellLaunchConfig.customPtyImplementation && !this.isProcessSupportRegistered) {
                throw new Error('Could not create terminal when process support is not registered');
            }
            if (shellLaunchConfig.hideFromUser) {
                const instance = this._terminalInstanceService.createInstance(shellLaunchConfig, terminal_1.TerminalLocation.Panel);
                this._backgroundedTerminalInstances.push(instance);
                this._backgroundedTerminalDisposables.set(instance.instanceId, [
                    instance.onDisposed(this._onDidDisposeInstance.fire, this._onDidDisposeInstance)
                ]);
                this._terminalHasBeenCreated.set(true);
                return instance;
            }
            this._evaluateLocalCwd(shellLaunchConfig);
            const location = await this.resolveLocation(options?.location) || this.defaultLocation;
            const parent = await this._getSplitParent(options?.location);
            this._terminalHasBeenCreated.set(true);
            if (parent) {
                return this._splitTerminal(shellLaunchConfig, location, parent);
            }
            return this._createTerminal(shellLaunchConfig, location, options);
        }
        async _getContributedProfile(shellLaunchConfig, options) {
            if (options?.config && 'extensionIdentifier' in options.config) {
                return options.config;
            }
            return this._terminalProfileService.getContributedDefaultProfile(shellLaunchConfig);
        }
        async createDetachedTerminal(options) {
            const ctor = await terminalInstance_1.TerminalInstance.getXtermConstructor(this._keybindingService, this._contextKeyService);
            const xterm = this._instantiationService.createInstance(xtermTerminal_1.XtermTerminal, ctor, this._configHelper, options.cols, options.rows, options.colorProvider, options.capabilities || new terminalCapabilityStore_1.TerminalCapabilityStore(), '', false);
            if (options.readonly) {
                xterm.raw.attachCustomKeyEventHandler(() => false);
            }
            const instance = new detachedTerminal_1.DetachedTerminal(xterm, options, this._instantiationService);
            this._detachedXterms.add(instance);
            const l = xterm.onDidDispose(() => {
                this._detachedXterms.delete(instance);
                l.dispose();
            });
            return instance;
        }
        async _resolveCwd(shellLaunchConfig, splitActiveTerminal, options) {
            const cwd = shellLaunchConfig.cwd;
            if (!cwd) {
                if (options?.cwd) {
                    shellLaunchConfig.cwd = options.cwd;
                }
                else if (splitActiveTerminal && options?.location) {
                    let parent = this.activeInstance;
                    if (typeof options.location === 'object' && 'parentTerminal' in options.location) {
                        parent = await options.location.parentTerminal;
                    }
                    if (!parent) {
                        throw new Error('Cannot split without an active instance');
                    }
                    shellLaunchConfig.cwd = await (0, terminalActions_1.getCwdForSplit)(this.configHelper, parent, this._workspaceContextService.getWorkspace().folders, this._commandService);
                }
            }
        }
        _splitTerminal(shellLaunchConfig, location, parent) {
            let instance;
            // Use the URI from the base instance if it exists, this will correctly split local terminals
            if (typeof shellLaunchConfig.cwd !== 'object' && typeof parent.shellLaunchConfig.cwd === 'object') {
                shellLaunchConfig.cwd = uri_1.URI.from({
                    scheme: parent.shellLaunchConfig.cwd.scheme,
                    authority: parent.shellLaunchConfig.cwd.authority,
                    path: shellLaunchConfig.cwd || parent.shellLaunchConfig.cwd.path
                });
            }
            if (location === terminal_1.TerminalLocation.Editor || parent.target === terminal_1.TerminalLocation.Editor) {
                instance = this._terminalEditorService.splitInstance(parent, shellLaunchConfig);
            }
            else {
                const group = this._terminalGroupService.getGroupForInstance(parent);
                if (!group) {
                    throw new Error(`Cannot split a terminal without a group ${parent}`);
                }
                shellLaunchConfig.parentTerminalId = parent.instanceId;
                instance = group.split(shellLaunchConfig);
            }
            this._addToReconnected(instance);
            return instance;
        }
        _addToReconnected(instance) {
            if (!instance.reconnectionProperties?.ownerId) {
                return;
            }
            const reconnectedTerminals = this._reconnectedTerminals.get(instance.reconnectionProperties.ownerId);
            if (reconnectedTerminals) {
                reconnectedTerminals.push(instance);
            }
            else {
                this._reconnectedTerminals.set(instance.reconnectionProperties.ownerId, [instance]);
            }
        }
        _createTerminal(shellLaunchConfig, location, options) {
            let instance;
            const editorOptions = this._getEditorOptions(options?.location);
            if (location === terminal_1.TerminalLocation.Editor) {
                instance = this._terminalInstanceService.createInstance(shellLaunchConfig, terminal_1.TerminalLocation.Editor);
                this._terminalEditorService.openEditor(instance, editorOptions);
            }
            else {
                // TODO: pass resource?
                const group = this._terminalGroupService.createGroup(shellLaunchConfig);
                instance = group.terminalInstances[0];
            }
            this._addToReconnected(instance);
            return instance;
        }
        async resolveLocation(location) {
            if (location && typeof location === 'object') {
                if ('parentTerminal' in location) {
                    // since we don't set the target unless it's an editor terminal, this is necessary
                    const parentTerminal = await location.parentTerminal;
                    return !parentTerminal.target ? terminal_1.TerminalLocation.Panel : parentTerminal.target;
                }
                else if ('viewColumn' in location) {
                    return terminal_1.TerminalLocation.Editor;
                }
                else if ('splitActiveTerminal' in location) {
                    // since we don't set the target unless it's an editor terminal, this is necessary
                    return !this._activeInstance?.target ? terminal_1.TerminalLocation.Panel : this._activeInstance?.target;
                }
            }
            return location;
        }
        async _getSplitParent(location) {
            if (location && typeof location === 'object' && 'parentTerminal' in location) {
                return location.parentTerminal;
            }
            else if (location && typeof location === 'object' && 'splitActiveTerminal' in location) {
                return this.activeInstance;
            }
            return undefined;
        }
        _getEditorOptions(location) {
            if (location && typeof location === 'object' && 'viewColumn' in location) {
                location.viewColumn = (0, editorGroupColumn_1.columnToEditorGroup)(this._editorGroupsService, this._configurationService, location.viewColumn);
                return location;
            }
            return undefined;
        }
        _evaluateLocalCwd(shellLaunchConfig) {
            // Add welcome message and title annotation for local terminals launched within remote or
            // virtual workspaces
            if (typeof shellLaunchConfig.cwd !== 'string' && shellLaunchConfig.cwd?.scheme === network_1.Schemas.file) {
                if (contextkeys_1.VirtualWorkspaceContext.getValue(this._contextKeyService)) {
                    shellLaunchConfig.initialText = (0, terminalStrings_1.formatMessageForTerminal)(nls.localize('localTerminalVirtualWorkspace', "This shell is open to a {0}local{1} folder, NOT to the virtual folder", '\x1b[3m', '\x1b[23m'), { excludeLeadingNewLine: true, loudFormatting: true });
                    shellLaunchConfig.type = 'Local';
                }
                else if (this._remoteAgentService.getConnection()) {
                    shellLaunchConfig.initialText = (0, terminalStrings_1.formatMessageForTerminal)(nls.localize('localTerminalRemote', "This shell is running on your {0}local{1} machine, NOT on the connected remote machine", '\x1b[3m', '\x1b[23m'), { excludeLeadingNewLine: true, loudFormatting: true });
                    shellLaunchConfig.type = 'Local';
                }
            }
        }
        _showBackgroundTerminal(instance) {
            this._backgroundedTerminalInstances.splice(this._backgroundedTerminalInstances.indexOf(instance), 1);
            const disposables = this._backgroundedTerminalDisposables.get(instance.instanceId);
            if (disposables) {
                (0, lifecycle_1.dispose)(disposables);
            }
            this._backgroundedTerminalDisposables.delete(instance.instanceId);
            instance.shellLaunchConfig.hideFromUser = false;
            this._terminalGroupService.createGroup(instance);
            // Make active automatically if it's the first instance
            if (this.instances.length === 1) {
                this._terminalGroupService.setActiveInstanceByIndex(0);
            }
            this._onDidChangeInstances.fire();
        }
        async setContainers(panelContainer, terminalContainer) {
            this._configHelper.panelContainer = panelContainer;
            this._terminalGroupService.setContainer(terminalContainer);
        }
        getEditingTerminal() {
            return this._editingTerminal;
        }
        setEditingTerminal(instance) {
            this._editingTerminal = instance;
        }
        createOnInstanceEvent(getEvent) {
            return this._register(new event_1.DynamicListEventMultiplexer(this.instances, this.onDidCreateInstance, this.onDidDisposeInstance, getEvent)).event;
        }
        createOnInstanceCapabilityEvent(capabilityId, getEvent) {
            return (0, terminalEvents_1.createInstanceCapabilityEventMultiplexer)(this.instances, this.onDidCreateInstance, this.onDidDisposeInstance, capabilityId, getEvent);
        }
    };
    exports.TerminalService = TerminalService;
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceData", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceDataInput", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceIconChange", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceMaximumDimensionsChange", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstancePrimaryStatusChange", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceProcessIdReady", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceSelectionChange", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceTitleChange", null);
    __decorate([
        (0, decorators_1.debounce)(500)
    ], TerminalService.prototype, "_saveState", null);
    __decorate([
        (0, decorators_1.debounce)(500)
    ], TerminalService.prototype, "_updateTitle", null);
    __decorate([
        (0, decorators_1.debounce)(500)
    ], TerminalService.prototype, "_updateIcon", null);
    exports.TerminalService = TerminalService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, lifecycle_2.ILifecycleService),
        __param(2, terminal_1.ITerminalLogService),
        __param(3, dialogs_1.IDialogService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, remoteAgentService_1.IRemoteAgentService),
        __param(6, viewsService_1.IViewsService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, environmentService_1.IWorkbenchEnvironmentService),
        __param(9, terminal_2.ITerminalEditorService),
        __param(10, terminal_2.ITerminalGroupService),
        __param(11, terminal_2.ITerminalInstanceService),
        __param(12, editorGroupsService_1.IEditorGroupsService),
        __param(13, terminal_3.ITerminalProfileService),
        __param(14, extensions_1.IExtensionService),
        __param(15, notification_1.INotificationService),
        __param(16, workspace_1.IWorkspaceContextService),
        __param(17, commands_1.ICommandService),
        __param(18, keybinding_1.IKeybindingService),
        __param(19, timerService_1.ITimerService)
    ], TerminalService);
    let TerminalEditorStyle = class TerminalEditorStyle extends themeService_1.Themable {
        constructor(container, _terminalService, _themeService, _terminalProfileService, _editorService) {
            super(_themeService);
            this._terminalService = _terminalService;
            this._themeService = _themeService;
            this._terminalProfileService = _terminalProfileService;
            this._editorService = _editorService;
            this._registerListeners();
            this._styleElement = dom.createStyleSheet(container);
            this._register((0, lifecycle_1.toDisposable)(() => container.removeChild(this._styleElement)));
            this.updateStyles();
        }
        _registerListeners() {
            this._register(this._terminalService.onAnyInstanceIconChange(() => this.updateStyles()));
            this._register(this._terminalService.onDidCreateInstance(() => this.updateStyles()));
            this._register(this._editorService.onDidActiveEditorChange(() => {
                if (this._editorService.activeEditor instanceof terminalEditorInput_1.TerminalEditorInput) {
                    this.updateStyles();
                }
            }));
            this._register(this._editorService.onDidCloseEditor(() => {
                if (this._editorService.activeEditor instanceof terminalEditorInput_1.TerminalEditorInput) {
                    this.updateStyles();
                }
            }));
            this._register(this._terminalProfileService.onDidChangeAvailableProfiles(() => this.updateStyles()));
        }
        updateStyles() {
            super.updateStyles();
            const colorTheme = this._themeService.getColorTheme();
            // TODO: add a rule collector to avoid duplication
            let css = '';
            const productIconTheme = this._themeService.getProductIconTheme();
            // Add icons
            for (const instance of this._terminalService.instances) {
                const icon = instance.icon;
                if (!icon) {
                    continue;
                }
                let uri = undefined;
                if (icon instanceof uri_1.URI) {
                    uri = icon;
                }
                else if (icon instanceof Object && 'light' in icon && 'dark' in icon) {
                    uri = colorTheme.type === theme_1.ColorScheme.LIGHT ? icon.light : icon.dark;
                }
                const iconClasses = (0, terminalIcon_1.getUriClasses)(instance, colorTheme.type);
                if (uri instanceof uri_1.URI && iconClasses && iconClasses.length > 1) {
                    css += (`.monaco-workbench .terminal-tab.${iconClasses[0]}::before` +
                        `{content: ''; background-image: ${dom.asCSSUrl(uri)};}`);
                }
                if (themables_1.ThemeIcon.isThemeIcon(icon)) {
                    const iconRegistry = (0, iconRegistry_1.getIconRegistry)();
                    const iconContribution = iconRegistry.getIcon(icon.id);
                    if (iconContribution) {
                        const def = productIconTheme.getIcon(iconContribution);
                        if (def) {
                            css += (`.monaco-workbench .terminal-tab.codicon-${icon.id}::before` +
                                `{content: '${def.fontCharacter}' !important; font-family: ${dom.asCSSPropertyValue(def.font?.id ?? 'codicon')} !important;}`);
                        }
                    }
                }
            }
            // Add colors
            const iconForegroundColor = colorTheme.getColor(colorRegistry_1.iconForeground);
            if (iconForegroundColor) {
                css += `.monaco-workbench .show-file-icons .file-icon.terminal-tab::before { color: ${iconForegroundColor}; }`;
            }
            css += (0, terminalIcon_1.getColorStyleContent)(colorTheme, true);
            this._styleElement.textContent = css;
        }
    };
    TerminalEditorStyle = __decorate([
        __param(1, terminal_2.ITerminalService),
        __param(2, themeService_1.IThemeService),
        __param(3, terminal_3.ITerminalProfileService),
        __param(4, editorService_1.IEditorService)
    ], TerminalEditorStyle);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwRHpGLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsc0JBQVU7UUF1QjlDLElBQUksMEJBQTBCLEtBQWMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUc1RixJQUFJLGVBQWUsS0FBOEIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBR2hGLElBQUksYUFBYSxLQUFvQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUdwRSxJQUFJLGtCQUFrQixLQUFhLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztRQUVyRSxJQUFJLFlBQVksS0FBNEIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUN4RSxJQUFJLFNBQVM7WUFDWixPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMzRixDQUFDO1FBQ0QsSUFBSSxpQkFBaUI7WUFDcEIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzdCLENBQUM7UUFLRCx1QkFBdUIsQ0FBQyxpQkFBeUI7WUFDaEQsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVELElBQUksZUFBZSxLQUF1QixP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