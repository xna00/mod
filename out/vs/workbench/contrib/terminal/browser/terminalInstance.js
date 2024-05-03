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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/canIUse", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/browser/config/tabFocus", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/clipboard/common/clipboardService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/dnd/browser/dnd", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/platform/terminal/common/environmentVariableShared", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalStrings", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalEditorInput", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/browser/terminalProcessManager", "vs/workbench/contrib/terminal/browser/terminalRunRecentQuickPick", "vs/workbench/contrib/terminal/browser/terminalStatusList", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/browser/widgets/widgetManager", "vs/workbench/contrib/terminal/browser/xterm/lineDataEventAddon", "vs/workbench/contrib/terminal/browser/xterm/xtermTerminal", "vs/workbench/contrib/terminal/common/history", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/history/common/history", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/preferences/common/preferences", "vs/amdX", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/contrib/terminal/common/terminalClipboard"], function (require, exports, browser_1, canIUse_1, dnd_1, dom, keyboardEvent_1, scrollableElement_1, async_1, codicons_1, decorators_1, errors_1, event_1, labels_1, lifecycle_1, network_1, path, platform_1, uri_1, tabFocus_1, nls, accessibility_1, accessibilitySignalService_1, clipboardService_1, commands_1, configuration_1, contextkey_1, dnd_2, files_1, instantiation_1, serviceCollection_1, keybinding_1, notification_1, opener_1, productService_1, quickInput_1, storage_1, telemetry_1, terminalCapabilityStore_1, environmentVariableShared_1, terminal_1, terminalStrings_1, colorRegistry_1, iconRegistry_1, themeService_1, workspace_1, workspaceTrust_1, theme_1, views_1, viewsService_1, terminalActions_1, terminalEditorInput_1, terminalExtensions_1, terminalIcon_1, terminalProcessManager_1, terminalRunRecentQuickPick_1, terminalStatusList_1, terminalUri_1, widgetManager_1, lineDataEventAddon_1, xtermTerminal_1, history_1, terminal_2, terminalColorRegistry_1, terminalContextKey_1, terminalEnvironment_1, editorService_1, environmentService_1, history_2, layoutService_1, pathService_1, preferences_1, amdX_1, terminalStrings_2, terminalClipboard_1) {
    "use strict";
    var TerminalInstance_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalInstanceColorProvider = exports.TerminalLabelComputer = exports.TerminalInstance = void 0;
    exports.parseExitResult = parseExitResult;
    var Constants;
    (function (Constants) {
        /**
         * The maximum amount of milliseconds to wait for a container before starting to create the
         * terminal process. This period helps ensure the terminal has good initial dimensions to work
         * with if it's going to be a foreground terminal.
         */
        Constants[Constants["WaitForContainerThreshold"] = 100] = "WaitForContainerThreshold";
        Constants[Constants["DefaultCols"] = 80] = "DefaultCols";
        Constants[Constants["DefaultRows"] = 30] = "DefaultRows";
        Constants[Constants["MaxCanvasWidth"] = 4096] = "MaxCanvasWidth";
    })(Constants || (Constants = {}));
    let xtermConstructor;
    const shellIntegrationSupportedShellTypes = [
        "bash" /* PosixShellType.Bash */,
        "zsh" /* PosixShellType.Zsh */,
        "pwsh" /* PosixShellType.PowerShell */,
        "python" /* PosixShellType.Python */,
        "pwsh" /* WindowsShellType.PowerShell */
    ];
    let TerminalInstance = class TerminalInstance extends lifecycle_1.Disposable {
        static { TerminalInstance_1 = this; }
        static { this._instanceIdCounter = 1; }
        get domElement() { return this._wrapperElement; }
        get usedShellIntegrationInjection() { return this._usedShellIntegrationInjection; }
        get store() {
            return this._store;
        }
        get extEnvironmentVariableCollection() { return this._processManager.extEnvironmentVariableCollection; }
        get waitOnExit() { return this._shellLaunchConfig.attachPersistentProcess?.waitOnExit || this._shellLaunchConfig.waitOnExit; }
        set waitOnExit(value) {
            this._shellLaunchConfig.waitOnExit = value;
        }
        get target() { return this._target; }
        set target(value) {
            this._target = value;
            this._onDidChangeTarget.fire(value);
        }
        get instanceId() { return this._instanceId; }
        get resource() { return this._resource; }
        get cols() {
            if (this._fixedCols !== undefined) {
                return this._fixedCols;
            }
            if (this._dimensionsOverride && this._dimensionsOverride.cols) {
                if (this._dimensionsOverride.forceExactSize) {
                    return this._dimensionsOverride.cols;
                }
                return Math.min(Math.max(this._dimensionsOverride.cols, 2), this._cols);
            }
            return this._cols;
        }
        get rows() {
            if (this._fixedRows !== undefined) {
                return this._fixedRows;
            }
            if (this._dimensionsOverride && this._dimensionsOverride.rows) {
                if (this._dimensionsOverride.forceExactSize) {
                    return this._dimensionsOverride.rows;
                }
                return Math.min(Math.max(this._dimensionsOverride.rows, 2), this._rows);
            }
            return this._rows;
        }
        get isDisposed() { return this._store.isDisposed; }
        get fixedCols() { return this._fixedCols; }
        get fixedRows() { return this._fixedRows; }
        get maxCols() { return this._cols; }
        get maxRows() { return this._rows; }
        // TODO: Ideally processId would be merged into processReady
        get processId() { return this._processManager.shellProcessId; }
        // TODO: How does this work with detached processes?
        // TODO: Should this be an event as it can fire twice?
        get processReady() { return this._processManager.ptyProcessReady; }
        get hasChildProcesses() { return this.shellLaunchConfig.attachPersistentProcess?.hasChildProcesses || this._processManager.hasChildProcesses; }
        get reconnectionProperties() { return this.shellLaunchConfig.attachPersistentProcess?.reconnectionProperties || this.shellLaunchConfig.reconnectionProperties; }
        get areLinksReady() { return this._areLinksReady; }
        get initialDataEvents() { return this._initialDataEvents; }
        get exitCode() { return this._exitCode; }
        get exitReason() { return this._exitReason; }
        get hadFocusOnExit() { return this._hadFocusOnExit; }
        get isTitleSetByProcess() { return !!this._messageTitleDisposable.value; }
        get shellLaunchConfig() { return this._shellLaunchConfig; }
        get shellType() { return this._shellType; }
        get os() { return this._processManager.os; }
        get isRemote() { return this._processManager.remoteAuthority !== undefined; }
        get remoteAuthority() { return this._processManager.remoteAuthority; }
        get hasFocus() { return dom.isAncestorOfActiveElement(this._wrapperElement); }
        get title() { return this._title; }
        get titleSource() { return this._titleSource; }
        get icon() { return this._getIcon(); }
        get color() { return this._getColor(); }
        get processName() { return this._processName; }
        get sequence() { return this._sequence; }
        get staticTitle() { return this._staticTitle; }
        get workspaceFolder() { return this._workspaceFolder; }
        get cwd() { return this._cwd; }
        get initialCwd() { return this._initialCwd; }
        get description() {
            if (this._description) {
                return this._description;
            }
            const type = this.shellLaunchConfig.attachPersistentProcess?.type || this.shellLaunchConfig.type;
            switch (type) {
                case 'Task': return terminalStrings_2.terminalStrings.typeTask;
                case 'Local': return terminalStrings_2.terminalStrings.typeLocal;
                default: return undefined;
            }
        }
        get userHome() { return this._userHome; }
        get shellIntegrationNonce() { return this._processManager.shellIntegrationNonce; }
        get injectedArgs() { return this._injectedArgs; }
        constructor(_terminalShellTypeContextKey, _terminalInRunCommandPicker, _configHelper, _shellLaunchConfig, _contextKeyService, instantiationService, _terminalProfileResolverService, _pathService, _keybindingService, _notificationService, _preferencesService, _viewsService, _clipboardService, _themeService, _configurationService, _logService, _storageService, _accessibilityService, _productService, _quickInputService, workbenchEnvironmentService, _workspaceContextService, _editorService, _workspaceTrustRequestService, _historyService, _telemetryService, _openerService, _commandService, _accessibilitySignalService, _viewDescriptorService) {
            super();
            this._terminalShellTypeContextKey = _terminalShellTypeContextKey;
            this._terminalInRunCommandPicker = _terminalInRunCommandPicker;
            this._configHelper = _configHelper;
            this._shellLaunchConfig = _shellLaunchConfig;
            this._contextKeyService = _contextKeyService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._pathService = _pathService;
            this._keybindingService = _keybindingService;
            this._notificationService = _notificationService;
            this._preferencesService = _preferencesService;
            this._viewsService = _viewsService;
            this._clipboardService = _clipboardService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._logService = _logService;
            this._storageService = _storageService;
            this._accessibilityService = _accessibilityService;
            this._productService = _productService;
            this._quickInputService = _quickInputService;
            this._workspaceContextService = _workspaceContextService;
            this._editorService = _editorService;
            this._workspaceTrustRequestService = _workspaceTrustRequestService;
            this._historyService = _historyService;
            this._telemetryService = _telemetryService;
            this._openerService = _openerService;
            this._commandService = _commandService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._viewDescriptorService = _viewDescriptorService;
            this._contributions = new Map();
            this._latestXtermWriteData = 0;
            this._latestXtermParseData = 0;
            this._title = '';
            this._titleSource = terminal_1.TitleEventSource.Process;
            this._cols = 0;
            this._rows = 0;
            this._cwd = undefined;
            this._initialCwd = undefined;
            this._injectedArgs = undefined;
            this._layoutSettingsChanged = true;
            this._areLinksReady = false;
            this._initialDataEvents = [];
            this._messageTitleDisposable = this._register(new lifecycle_1.MutableDisposable());
            this._dndObserver = this._register(new lifecycle_1.MutableDisposable());
            this._processName = '';
            this._usedShellIntegrationInjection = false;
            this.capabilities = new terminalCapabilityStore_1.TerminalCapabilityStoreMultiplexer();
            this.disableLayout = false;
            // The onExit event is special in that it fires and is disposed after the terminal instance
            // itself is disposed
            this._onExit = new event_1.Emitter();
            this.onExit = this._onExit.event;
            this._onDisposed = this._register(new event_1.Emitter());
            this.onDisposed = this._onDisposed.event;
            this._onProcessIdReady = this._register(new event_1.Emitter());
            this.onProcessIdReady = this._onProcessIdReady.event;
            this._onProcessReplayComplete = this._register(new event_1.Emitter());
            this.onProcessReplayComplete = this._onProcessReplayComplete.event;
            this._onTitleChanged = this._register(new event_1.Emitter());
            this.onTitleChanged = this._onTitleChanged.event;
            this._onIconChanged = this._register(new event_1.Emitter());
            this.onIconChanged = this._onIconChanged.event;
            this._onData = this._register(new event_1.Emitter());
            this.onData = this._onData.event;
            this._onBinary = this._register(new event_1.Emitter());
            this.onBinary = this._onBinary.event;
            this._onLineData = this._register(new event_1.Emitter({
                onDidAddFirstListener: () => this._onLineDataSetup()
            }));
            this.onLineData = this._onLineData.event;
            this._onRequestExtHostProcess = this._register(new event_1.Emitter());
            this.onRequestExtHostProcess = this._onRequestExtHostProcess.event;
            this._onDimensionsChanged = this._register(new event_1.Emitter());
            this.onDimensionsChanged = this._onDimensionsChanged.event;
            this._onMaximumDimensionsChanged = this._register(new event_1.Emitter());
            this.onMaximumDimensionsChanged = this._onMaximumDimensionsChanged.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidRequestFocus = this._register(new event_1.Emitter());
            this.onDidRequestFocus = this._onDidRequestFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onDidInputData = this._register(new event_1.Emitter());
            this.onDidInputData = this._onDidInputData.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onRequestAddInstanceToGroup = this._register(new event_1.Emitter());
            this.onRequestAddInstanceToGroup = this._onRequestAddInstanceToGroup.event;
            this._onDidChangeHasChildProcesses = this._register(new event_1.Emitter());
            this.onDidChangeHasChildProcesses = this._onDidChangeHasChildProcesses.event;
            this._onDidExecuteText = this._register(new event_1.Emitter());
            this.onDidExecuteText = this._onDidExecuteText.event;
            this._onDidChangeTarget = this._register(new event_1.Emitter());
            this.onDidChangeTarget = this._onDidChangeTarget.event;
            this._onDidSendText = this._register(new event_1.Emitter());
            this.onDidSendText = this._onDidSendText.event;
            this._overrideCopySelection = undefined;
            this._wrapperElement = document.createElement('div');
            this._wrapperElement.classList.add('terminal-wrapper');
            this._widgetManager = this._register(instantiationService.createInstance(widgetManager_1.TerminalWidgetManager));
            this._skipTerminalCommands = [];
            this._isExiting = false;
            this._hadFocusOnExit = false;
            this._isVisible = false;
            this._instanceId = TerminalInstance_1._instanceIdCounter++;
            this._hasHadInput = false;
            this._fixedRows = _shellLaunchConfig.attachPersistentProcess?.fixedDimensions?.rows;
            this._fixedCols = _shellLaunchConfig.attachPersistentProcess?.fixedDimensions?.cols;
            this._resource = (0, terminalUri_1.getTerminalUri)(this._workspaceContextService.getWorkspace().id, this.instanceId, this.title);
            if (this._shellLaunchConfig.attachPersistentProcess?.hideFromUser) {
                this._shellLaunchConfig.hideFromUser = this._shellLaunchConfig.attachPersistentProcess.hideFromUser;
            }
            if (this._shellLaunchConfig.attachPersistentProcess?.isFeatureTerminal) {
                this._shellLaunchConfig.isFeatureTerminal = this._shellLaunchConfig.attachPersistentProcess.isFeatureTerminal;
            }
            if (this._shellLaunchConfig.attachPersistentProcess?.type) {
                this._shellLaunchConfig.type = this._shellLaunchConfig.attachPersistentProcess.type;
            }
            if (this.shellLaunchConfig.cwd) {
                const cwdUri = typeof this._shellLaunchConfig.cwd === 'string' ? uri_1.URI.from({
                    scheme: network_1.Schemas.file,
                    path: this._shellLaunchConfig.cwd
                }) : this._shellLaunchConfig.cwd;
                if (cwdUri) {
                    this._workspaceFolder = this._workspaceContextService.getWorkspaceFolder(cwdUri) ?? undefined;
                }
            }
            if (!this._workspaceFolder) {
                const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot();
                this._workspaceFolder = activeWorkspaceRootUri ? this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) ?? undefined : undefined;
            }
            const scopedContextKeyService = this._register(_contextKeyService.createScoped(this._wrapperElement));
            this._scopedContextKeyService = scopedContextKeyService;
            this._scopedInstantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService]));
            this._terminalFocusContextKey = terminalContextKey_1.TerminalContextKeys.focus.bindTo(scopedContextKeyService);
            this._terminalHasFixedWidth = terminalContextKey_1.TerminalContextKeys.terminalHasFixedWidth.bindTo(scopedContextKeyService);
            this._terminalHasTextContextKey = terminalContextKey_1.TerminalContextKeys.textSelected.bindTo(scopedContextKeyService);
            this._terminalAltBufferActiveContextKey = terminalContextKey_1.TerminalContextKeys.altBufferActive.bindTo(scopedContextKeyService);
            this._terminalShellIntegrationEnabledContextKey = terminalContextKey_1.TerminalContextKeys.terminalShellIntegrationEnabled.bindTo(scopedContextKeyService);
            this._logService.trace(`terminalInstance#ctor (instanceId: ${this.instanceId})`, this._shellLaunchConfig);
            this._register(this.capabilities.onDidAddCapabilityType(e => {
                this._logService.debug('terminalInstance added capability', e);
                if (e === 0 /* TerminalCapability.CwdDetection */) {
                    this.capabilities.get(0 /* TerminalCapability.CwdDetection */)?.onDidChangeCwd(e => {
                        this._cwd = e;
                        this._setTitle(this.title, terminal_1.TitleEventSource.Config);
                        this._scopedInstantiationService.invokeFunction(history_1.getDirectoryHistory)?.add(e, { remoteAuthority: this.remoteAuthority });
                    });
                }
                else if (e === 2 /* TerminalCapability.CommandDetection */) {
                    const commandCapability = this.capabilities.get(2 /* TerminalCapability.CommandDetection */);
                    commandCapability?.onCommandFinished(e => {
                        if (e.command.trim().length > 0) {
                            this._scopedInstantiationService.invokeFunction(history_1.getCommandHistory)?.add(e.command, { shellType: this._shellType });
                        }
                    });
                }
            }));
            this._register(this.capabilities.onDidRemoveCapabilityType(e => this._logService.debug('terminalInstance removed capability', e)));
            // Resolve just the icon ahead of time so that it shows up immediately in the tabs. This is
            // disabled in remote because this needs to be sync and the OS may differ on the remote
            // which would result in the wrong profile being selected and the wrong icon being
            // permanently attached to the terminal. This also doesn't work when the default profile
            // setting is set to null, that's handled after the process is created.
            if (!this.shellLaunchConfig.executable && !workbenchEnvironmentService.remoteAuthority) {
                this._terminalProfileResolverService.resolveIcon(this._shellLaunchConfig, platform_1.OS);
            }
            this._icon = _shellLaunchConfig.attachPersistentProcess?.icon || _shellLaunchConfig.icon;
            // When a custom pty is used set the name immediately so it gets passed over to the exthost
            // and is available when Pseudoterminal.open fires.
            if (this.shellLaunchConfig.customPtyImplementation) {
                this._setTitle(this._shellLaunchConfig.name, terminal_1.TitleEventSource.Api);
            }
            this.statusList = this._scopedInstantiationService.createInstance(terminalStatusList_1.TerminalStatusList);
            this._initDimensions();
            this._processManager = this._createProcessManager();
            this._containerReadyBarrier = new async_1.AutoOpenBarrier(100 /* Constants.WaitForContainerThreshold */);
            this._attachBarrier = new async_1.AutoOpenBarrier(1000);
            this._xtermReadyPromise = this._createXterm();
            this._xtermReadyPromise.then(async () => {
                // Wait for a period to allow a container to be ready
                await this._containerReadyBarrier.wait();
                // Resolve the executable ahead of time if shell integration is enabled, this should not
                // be done for custom PTYs as that would cause extension Pseudoterminal-based terminals
                // to hang in resolver extensions
                if (!this.shellLaunchConfig.customPtyImplementation && this._configHelper.config.shellIntegration?.enabled && !this.shellLaunchConfig.executable) {
                    const os = await this._processManager.getBackendOS();
                    const defaultProfile = (await this._terminalProfileResolverService.getDefaultProfile({ remoteAuthority: this.remoteAuthority, os }));
                    this.shellLaunchConfig.executable = defaultProfile.path;
                    this.shellLaunchConfig.args = defaultProfile.args;
                    if (this.shellLaunchConfig.isExtensionOwnedTerminal) {
                        // Only use default icon and color if they are undefined in the SLC
                        this.shellLaunchConfig.icon ??= defaultProfile.icon;
                        this.shellLaunchConfig.color ??= defaultProfile.color;
                    }
                    else {
                        this.shellLaunchConfig.icon = defaultProfile.icon;
                        this.shellLaunchConfig.color = defaultProfile.color;
                    }
                }
                await this._createProcess();
                // Re-establish the title after reconnect
                if (this.shellLaunchConfig.attachPersistentProcess) {
                    this._cwd = this.shellLaunchConfig.attachPersistentProcess.cwd;
                    this._setTitle(this.shellLaunchConfig.attachPersistentProcess.title, this.shellLaunchConfig.attachPersistentProcess.titleSource);
                    this.setShellType(this.shellType);
                }
                if (this._fixedCols) {
                    await this._addScrollbar();
                }
            }).catch((err) => {
                // Ignore exceptions if the terminal is already disposed
                if (!this.isDisposed) {
                    throw err;
                }
            });
            this._register(this._configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration("accessibility.verbosity.terminal" /* AccessibilityVerbositySettingId.Terminal */)) {
                    this._setAriaLabel(this.xterm?.raw, this._instanceId, this.title);
                }
                if (e.affectsConfiguration('terminal.integrated')) {
                    this.updateConfig();
                    this.setVisible(this._isVisible);
                }
                const layoutSettings = [
                    "terminal.integrated.fontSize" /* TerminalSettingId.FontSize */,
                    "terminal.integrated.fontFamily" /* TerminalSettingId.FontFamily */,
                    "terminal.integrated.fontWeight" /* TerminalSettingId.FontWeight */,
                    "terminal.integrated.fontWeightBold" /* TerminalSettingId.FontWeightBold */,
                    "terminal.integrated.letterSpacing" /* TerminalSettingId.LetterSpacing */,
                    "terminal.integrated.lineHeight" /* TerminalSettingId.LineHeight */,
                    'editor.fontFamily'
                ];
                if (layoutSettings.some(id => e.affectsConfiguration(id))) {
                    this._layoutSettingsChanged = true;
                    await this._resize();
                }
                if (e.affectsConfiguration("terminal.integrated.unicodeVersion" /* TerminalSettingId.UnicodeVersion */)) {
                    this._updateUnicodeVersion();
                }
                if (e.affectsConfiguration('editor.accessibilitySupport')) {
                    this.updateAccessibilitySupport();
                }
                if (e.affectsConfiguration("terminal.integrated.tabs.title" /* TerminalSettingId.TerminalTitle */) ||
                    e.affectsConfiguration("terminal.integrated.tabs.separator" /* TerminalSettingId.TerminalTitleSeparator */) ||
                    e.affectsConfiguration("terminal.integrated.tabs.description" /* TerminalSettingId.TerminalDescription */)) {
                    this._labelComputer?.refreshLabel(this);
                }
            }));
            this._register(this._workspaceContextService.onDidChangeWorkspaceFolders(() => this._labelComputer?.refreshLabel(this)));
            // Clear out initial data events after 10 seconds, hopefully extension hosts are up and
            // running at that point.
            let initialDataEventsTimeout = dom.getWindow(this._container).setTimeout(() => {
                initialDataEventsTimeout = undefined;
                this._initialDataEvents = undefined;
            }, 10000);
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (initialDataEventsTimeout) {
                    dom.getWindow(this._container).clearTimeout(initialDataEventsTimeout);
                }
            }));
            // Initialize contributions
            const contributionDescs = terminalExtensions_1.TerminalExtensionsRegistry.getTerminalContributions();
            for (const desc of contributionDescs) {
                if (this._contributions.has(desc.id)) {
                    (0, errors_1.onUnexpectedError)(new Error(`Cannot have two terminal contributions with the same id ${desc.id}`));
                    continue;
                }
                let contribution;
                try {
                    contribution = this._scopedInstantiationService.createInstance(desc.ctor, this, this._processManager, this._widgetManager);
                    this._contributions.set(desc.id, contribution);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                this._xtermReadyPromise.then(xterm => {
                    contribution.xtermReady?.(xterm);
                });
                this.onDisposed(() => {
                    contribution.dispose();
                    this._contributions.delete(desc.id);
                    // Just in case to prevent potential future memory leaks due to cyclic dependency.
                    if ('instance' in contribution) {
                        delete contribution.instance;
                    }
                    if ('_instance' in contribution) {
                        delete contribution._instance;
                    }
                });
            }
        }
        getContribution(id) {
            return this._contributions.get(id);
        }
        _getIcon() {
            if (!this._icon) {
                this._icon = this._processManager.processState >= 2 /* ProcessState.Launching */
                    ? (0, iconRegistry_1.getIconRegistry)().getIcon(this._configurationService.getValue("terminal.integrated.tabs.defaultIcon" /* TerminalSettingId.TabsDefaultIcon */))
                    : undefined;
            }
            return this._icon;
        }
        _getColor() {
            if (this.shellLaunchConfig.color) {
                return this.shellLaunchConfig.color;
            }
            if (this.shellLaunchConfig?.attachPersistentProcess?.color) {
                return this.shellLaunchConfig.attachPersistentProcess.color;
            }
            if (this._processManager.processState >= 2 /* ProcessState.Launching */) {
                return undefined;
            }
            return undefined;
        }
        _initDimensions() {
            // The terminal panel needs to have been created to get the real view dimensions
            if (!this._container) {
                // Set the fallback dimensions if not
                this._cols = 80 /* Constants.DefaultCols */;
                this._rows = 30 /* Constants.DefaultRows */;
                return;
            }
            const computedStyle = dom.getWindow(this._container).getComputedStyle(this._container);
            const width = parseInt(computedStyle.width);
            const height = parseInt(computedStyle.height);
            this._evaluateColsAndRows(width, height);
        }
        /**
         * Evaluates and sets the cols and rows of the terminal if possible.
         * @param width The width of the container.
         * @param height The height of the container.
         * @return The terminal's width if it requires a layout.
         */
        _evaluateColsAndRows(width, height) {
            // Ignore if dimensions are undefined or 0
            if (!width || !height) {
                this._setLastKnownColsAndRows();
                return null;
            }
            const dimension = this._getDimension(width, height);
            if (!dimension) {
                this._setLastKnownColsAndRows();
                return null;
            }
            const font = this.xterm ? this.xterm.getFont() : this._configHelper.getFont(dom.getWindow(this.domElement));
            const newRC = (0, xtermTerminal_1.getXtermScaledDimensions)(dom.getWindow(this.domElement), font, dimension.width, dimension.height);
            if (!newRC) {
                this._setLastKnownColsAndRows();
                return null;
            }
            if (this._cols !== newRC.cols || this._rows !== newRC.rows) {
                this._cols = newRC.cols;
                this._rows = newRC.rows;
                this._fireMaximumDimensionsChanged();
            }
            return dimension.width;
        }
        _setLastKnownColsAndRows() {
            if (TerminalInstance_1._lastKnownGridDimensions) {
                this._cols = TerminalInstance_1._lastKnownGridDimensions.cols;
                this._rows = TerminalInstance_1._lastKnownGridDimensions.rows;
            }
        }
        _fireMaximumDimensionsChanged() {
            this._onMaximumDimensionsChanged.fire();
        }
        _getDimension(width, height) {
            // The font needs to have been initialized
            const font = this.xterm ? this.xterm.getFont() : this._configHelper.getFont(dom.getWindow(this.domElement));
            if (!font || !font.charWidth || !font.charHeight) {
                return undefined;
            }
            if (!this.xterm?.raw.element) {
                return undefined;
            }
            const computedStyle = dom.getWindow(this.xterm.raw.element).getComputedStyle(this.xterm.raw.element);
            const horizontalPadding = parseInt(computedStyle.paddingLeft) + parseInt(computedStyle.paddingRight);
            const verticalPadding = parseInt(computedStyle.paddingTop) + parseInt(computedStyle.paddingBottom);
            TerminalInstance_1._lastKnownCanvasDimensions = new dom.Dimension(Math.min(4096 /* Constants.MaxCanvasWidth */, width - horizontalPadding), height + (this._hasScrollBar && !this._horizontalScrollbar ? -5 /* scroll bar height */ : 0) - 2 /* bottom padding */ - verticalPadding);
            return TerminalInstance_1._lastKnownCanvasDimensions;
        }
        get persistentProcessId() { return this._processManager.persistentProcessId; }
        get shouldPersist() { return this._processManager.shouldPersist && !this.shellLaunchConfig.isTransient && (!this.reconnectionProperties || this._configurationService.getValue('task.reconnection') === true); }
        static getXtermConstructor(keybindingService, contextKeyService) {
            const keybinding = keybindingService.lookupKeybinding("workbench.action.terminal.focusAccessibleBuffer" /* TerminalCommandId.FocusAccessibleBuffer */, contextKeyService);
            if (xtermConstructor) {
                return xtermConstructor;
            }
            xtermConstructor = async_1.Promises.withAsyncBody(async (resolve) => {
                const Terminal = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
                // Localize strings
                Terminal.strings.promptLabel = nls.localize('terminal.integrated.a11yPromptLabel', 'Terminal input');
                Terminal.strings.tooMuchOutput = keybinding ? nls.localize('terminal.integrated.useAccessibleBuffer', 'Use the accessible buffer {0} to manually review output', keybinding.getLabel()) : nls.localize('terminal.integrated.useAccessibleBufferNoKb', 'Use the Terminal: Focus Accessible Buffer command to manually review output');
                resolve(Terminal);
            });
            return xtermConstructor;
        }
        /**
         * Create xterm.js instance and attach data listeners.
         */
        async _createXterm() {
            const Terminal = await TerminalInstance_1.getXtermConstructor(this._keybindingService, this._contextKeyService);
            if (this.isDisposed) {
                throw new errors_1.ErrorNoTelemetry('Terminal disposed of during xterm.js creation');
            }
            const disableShellIntegrationReporting = (this.shellLaunchConfig.executable === undefined || this.shellType === undefined) || !shellIntegrationSupportedShellTypes.includes(this.shellType);
            const xterm = this._scopedInstantiationService.createInstance(xtermTerminal_1.XtermTerminal, Terminal, this._configHelper, this._cols, this._rows, this._scopedInstantiationService.createInstance(TerminalInstanceColorProvider, this), this.capabilities, this._processManager.shellIntegrationNonce, disableShellIntegrationReporting);
            this.xterm = xterm;
            this.updateAccessibilitySupport();
            this.xterm.onDidRequestRunCommand(e => {
                if (e.copyAsHtml) {
                    this.copySelection(true, e.command);
                }
                else {
                    this.sendText(e.command.command, e.noNewLine ? false : true);
                }
            });
            this.xterm.onDidRequestFocus(() => this.focus());
            this.xterm.onDidRequestSendText(e => this.sendText(e, false));
            // Write initial text, deferring onLineFeed listener when applicable to avoid firing
            // onLineData events containing initialText
            const initialTextWrittenPromise = this._shellLaunchConfig.initialText ? new Promise(r => this._writeInitialText(xterm, r)) : undefined;
            const lineDataEventAddon = this._register(new lineDataEventAddon_1.LineDataEventAddon(initialTextWrittenPromise));
            lineDataEventAddon.onLineData(e => this._onLineData.fire(e));
            this._lineDataEventAddon = lineDataEventAddon;
            // Delay the creation of the bell listener to avoid showing the bell when the terminal
            // starts up or reconnects
            (0, async_1.disposableTimeout)(() => {
                this._register(xterm.raw.onBell(() => {
                    if (this._configurationService.getValue("terminal.integrated.enableBell" /* TerminalSettingId.EnableBell */) || this._configurationService.getValue("terminal.integrated.enableVisualBell" /* TerminalSettingId.EnableVisualBell */)) {
                        this.statusList.add({
                            id: "bell" /* TerminalStatus.Bell */,
                            severity: notification_1.Severity.Warning,
                            icon: codicons_1.Codicon.bell,
                            tooltip: nls.localize('bellStatus', "Bell")
                        }, this._configHelper.config.bellDuration);
                    }
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.terminalBell);
                }));
            }, 1000, this._store);
            this._register(xterm.raw.onSelectionChange(async () => this._onSelectionChange()));
            this._register(xterm.raw.buffer.onBufferChange(() => this._refreshAltBufferContextKey()));
            this._processManager.onProcessData(e => this._onProcessData(e));
            this._register(xterm.raw.onData(async (data) => {
                await this._processManager.write(data);
                this._onDidInputData.fire(this);
            }));
            this._register(xterm.raw.onBinary(data => this._processManager.processBinary(data)));
            // Init winpty compat and link handler after process creation as they rely on the
            // underlying process OS
            this._processManager.onProcessReady(async (processTraits) => {
                if (this._processManager.os) {
                    lineDataEventAddon.setOperatingSystem(this._processManager.os);
                }
                xterm.raw.options.windowsPty = processTraits.windowsPty;
            });
            this._processManager.onRestoreCommands(e => this.xterm?.shellIntegration.deserialize(e));
            this._register(this._viewDescriptorService.onDidChangeLocation(({ views }) => {
                if (views.some(v => v.id === terminal_2.TERMINAL_VIEW_ID)) {
                    xterm.refresh();
                }
            }));
            // Set up updating of the process cwd on key press, this is only needed when the cwd
            // detection capability has not been registered
            if (!this.capabilities.has(0 /* TerminalCapability.CwdDetection */)) {
                let onKeyListener = xterm.raw.onKey(e => {
                    const event = new keyboardEvent_1.StandardKeyboardEvent(e.domEvent);
                    if (event.equals(3 /* KeyCode.Enter */)) {
                        this._updateProcessCwd();
                    }
                });
                this._register(this.capabilities.onDidAddCapabilityType(e => {
                    if (e === 0 /* TerminalCapability.CwdDetection */) {
                        onKeyListener?.dispose();
                        onKeyListener = undefined;
                    }
                }));
            }
            this._pathService.userHome().then(userHome => {
                this._userHome = userHome.fsPath;
            });
            if (this._isVisible) {
                this._open();
            }
            return xterm;
        }
        async _onLineDataSetup() {
            const xterm = this.xterm || await this._xtermReadyPromise;
            xterm.raw.loadAddon(this._lineDataEventAddon);
        }
        async runCommand(commandLine, shouldExecute) {
            let commandDetection = this.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            // Await command detection if the terminal is starting up
            if (!commandDetection && (this._processManager.processState === 1 /* ProcessState.Uninitialized */ || this._processManager.processState === 2 /* ProcessState.Launching */)) {
                const store = new lifecycle_1.DisposableStore();
                await Promise.race([
                    new Promise(r => {
                        store.add(this.capabilities.onDidAddCapabilityType(e => {
                            if (e === 2 /* TerminalCapability.CommandDetection */) {
                                commandDetection = this.capabilities.get(2 /* TerminalCapability.CommandDetection */);
                                r();
                            }
                        }));
                    }),
                    (0, async_1.timeout)(2000),
                ]);
                store.dispose();
            }
            // Determine whether to send ETX (ctrl+c) before running the command. This should always
            // happen unless command detection can reliably say that a command is being entered and
            // there is no content in the prompt
            if (commandDetection?.hasInput !== false) {
                await this.sendText('\x03', false);
                // Wait a little before running the command to avoid the sequences being echoed while the ^C
                // is being evaluated
                await (0, async_1.timeout)(100);
            }
            // Use bracketed paste mode only when not running the command
            await this.sendText(commandLine, shouldExecute, !shouldExecute);
        }
        async runRecent(type, filterMode, value) {
            return this._scopedInstantiationService.invokeFunction(terminalRunRecentQuickPick_1.showRunRecentQuickPick, this, this._terminalInRunCommandPicker, type, filterMode, value);
        }
        detachFromElement() {
            this._wrapperElement.remove();
            this._container = undefined;
        }
        attachToElement(container) {
            // The container did not change, do nothing
            if (this._container === container) {
                return;
            }
            this._attachBarrier.open();
            // The container changed, reattach
            this._container = container;
            this._container.appendChild(this._wrapperElement);
            // If xterm is already attached, call open again to pick up any changes to the window.
            if (this.xterm?.raw.element) {
                this.xterm.raw.open(this.xterm.raw.element);
            }
            this.xterm?.refresh();
            setTimeout(() => this._initDragAndDrop(container));
        }
        /**
         * Opens the the terminal instance inside the parent DOM element previously set with
         * `attachToElement`, you must ensure the parent DOM element is explicitly visible before
         * invoking this function as it performs some DOM calculations internally
         */
        _open() {
            if (!this.xterm || this.xterm.raw.element) {
                return;
            }
            if (!this._container || !this._container.isConnected) {
                throw new Error('A container element needs to be set with `attachToElement` and be part of the DOM before calling `_open`');
            }
            const xtermElement = document.createElement('div');
            this._wrapperElement.appendChild(xtermElement);
            this._container.appendChild(this._wrapperElement);
            const xterm = this.xterm;
            // Attach the xterm object to the DOM, exposing it to the smoke tests
            this._wrapperElement.xterm = xterm.raw;
            const screenElement = xterm.attachToElement(xtermElement);
            // Fire xtermOpen on all contributions
            for (const contribution of this._contributions.values()) {
                if (!this.xterm) {
                    this._xtermReadyPromise.then(xterm => contribution.xtermOpen?.(xterm));
                }
                else {
                    contribution.xtermOpen?.(this.xterm);
                }
            }
            this._register(xterm.shellIntegration.onDidChangeStatus(() => {
                if (this.hasFocus) {
                    this._setShellIntegrationContextKey();
                }
                else {
                    this._terminalShellIntegrationEnabledContextKey.reset();
                }
            }));
            if (!xterm.raw.element || !xterm.raw.textarea) {
                throw new Error('xterm elements not set after open');
            }
            this._setAriaLabel(xterm.raw, this._instanceId, this._title);
            xterm.raw.attachCustomKeyEventHandler((event) => {
                // Disable all input if the terminal is exiting
                if (this._isExiting) {
                    return false;
                }
                const standardKeyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(event);
                const resolveResult = this._keybindingService.softDispatch(standardKeyboardEvent, standardKeyboardEvent.target);
                // Respect chords if the allowChords setting is set and it's not Escape. Escape is
                // handled specially for Zen Mode's Escape, Escape chord, plus it's important in
                // terminals generally
                const isValidChord = resolveResult.kind === 1 /* ResultKind.MoreChordsNeeded */ && this._configHelper.config.allowChords && event.key !== 'Escape';
                if (this._keybindingService.inChordMode || isValidChord) {
                    event.preventDefault();
                    return false;
                }
                const SHOW_TERMINAL_CONFIG_PROMPT_KEY = 'terminal.integrated.showTerminalConfigPrompt';
                const EXCLUDED_KEYS = ['RightArrow', 'LeftArrow', 'UpArrow', 'DownArrow', 'Space', 'Meta', 'Control', 'Shift', 'Alt', '', 'Delete', 'Backspace', 'Tab'];
                // only keep track of input if prompt hasn't already been shown
                if (this._storageService.getBoolean(SHOW_TERMINAL_CONFIG_PROMPT_KEY, -1 /* StorageScope.APPLICATION */, true) &&
                    !EXCLUDED_KEYS.includes(event.key) &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey) {
                    this._hasHadInput = true;
                }
                // for keyboard events that resolve to commands described
                // within commandsToSkipShell, either alert or skip processing by xterm.js
                if (resolveResult.kind === 2 /* ResultKind.KbFound */ && resolveResult.commandId && this._skipTerminalCommands.some(k => k === resolveResult.commandId) && !this._configHelper.config.sendKeybindingsToShell) {
                    // don't alert when terminal is opened or closed
                    if (this._storageService.getBoolean(SHOW_TERMINAL_CONFIG_PROMPT_KEY, -1 /* StorageScope.APPLICATION */, true) &&
                        this._hasHadInput &&
                        !terminal_2.TERMINAL_CREATION_COMMANDS.includes(resolveResult.commandId)) {
                        this._notificationService.prompt(notification_1.Severity.Info, nls.localize('keybindingHandling', "Some keybindings don't go to the terminal by default and are handled by {0} instead.", this._productService.nameLong), [
                            {
                                label: nls.localize('configureTerminalSettings', "Configure Terminal Settings"),
                                run: () => {
                                    this._preferencesService.openSettings({ jsonEditor: false, query: `@id:${"terminal.integrated.commandsToSkipShell" /* TerminalSettingId.CommandsToSkipShell */},${"terminal.integrated.sendKeybindingsToShell" /* TerminalSettingId.SendKeybindingsToShell */},${"terminal.integrated.allowChords" /* TerminalSettingId.AllowChords */}` });
                                }
                            }
                        ]);
                        this._storageService.store(SHOW_TERMINAL_CONFIG_PROMPT_KEY, false, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                    }
                    event.preventDefault();
                    return false;
                }
                // Skip processing by xterm.js of keyboard events that match menu bar mnemonics
                if (this._configHelper.config.allowMnemonics && !platform_1.isMacintosh && event.altKey) {
                    return false;
                }
                // If tab focus mode is on, tab is not passed to the terminal
                if (tabFocus_1.TabFocus.getTabFocusMode() && event.key === 'Tab') {
                    return false;
                }
                // Prevent default when shift+tab is being sent to the terminal to avoid it bubbling up
                // and changing focus https://github.com/microsoft/vscode/issues/188329
                if (event.key === 'Tab' && event.shiftKey) {
                    event.preventDefault();
                    return true;
                }
                // Always have alt+F4 skip the terminal on Windows and allow it to be handled by the
                // system
                if (platform_1.isWindows && event.altKey && event.key === 'F4' && !event.ctrlKey) {
                    return false;
                }
                // Fallback to force ctrl+v to paste on browsers that do not support
                // navigator.clipboard.readText
                if (!canIUse_1.BrowserFeatures.clipboard.readText && event.key === 'v' && event.ctrlKey) {
                    return false;
                }
                return true;
            });
            this._register(dom.addDisposableListener(xterm.raw.element, 'mousedown', () => {
                // We need to listen to the mouseup event on the document since the user may release
                // the mouse button anywhere outside of _xterm.element.
                const listener = dom.addDisposableListener(xterm.raw.element.ownerDocument, 'mouseup', () => {
                    // Delay with a setTimeout to allow the mouseup to propagate through the DOM
                    // before evaluating the new selection state.
                    setTimeout(() => this._refreshSelectionContextKey(), 0);
                    listener.dispose();
                });
            }));
            this._register(dom.addDisposableListener(xterm.raw.element, 'touchstart', () => {
                xterm.raw.focus();
            }));
            // xterm.js currently drops selection on keyup as we need to handle this case.
            this._register(dom.addDisposableListener(xterm.raw.element, 'keyup', () => {
                // Wait until keyup has propagated through the DOM before evaluating
                // the new selection state.
                setTimeout(() => this._refreshSelectionContextKey(), 0);
            }));
            this._register(dom.addDisposableListener(xterm.raw.textarea, 'focus', () => this._setFocus(true)));
            this._register(dom.addDisposableListener(xterm.raw.textarea, 'blur', () => this._setFocus(false)));
            this._register(dom.addDisposableListener(xterm.raw.textarea, 'focusout', () => this._setFocus(false)));
            this._initDragAndDrop(this._container);
            this._widgetManager.attachToElement(screenElement);
            if (this._lastLayoutDimensions) {
                this.layout(this._lastLayoutDimensions);
            }
            this.updateConfig();
            // If IShellLaunchConfig.waitOnExit was true and the process finished before the terminal
            // panel was initialized.
            if (xterm.raw.options.disableStdin) {
                this._attachPressAnyKeyToCloseListener(xterm.raw);
            }
        }
        _setFocus(focused) {
            if (focused) {
                this._terminalFocusContextKey.set(true);
                this._setShellIntegrationContextKey();
                this._onDidFocus.fire(this);
            }
            else {
                this.resetFocusContextKey();
                this._onDidBlur.fire(this);
                this._refreshSelectionContextKey();
            }
        }
        _setShellIntegrationContextKey() {
            if (this.xterm) {
                this._terminalShellIntegrationEnabledContextKey.set(this.xterm.shellIntegration.status === 2 /* ShellIntegrationStatus.VSCode */);
            }
        }
        resetFocusContextKey() {
            this._terminalFocusContextKey.reset();
            this._terminalShellIntegrationEnabledContextKey.reset();
        }
        _initDragAndDrop(container) {
            const dndController = this._register(this._scopedInstantiationService.createInstance(TerminalInstanceDragAndDropController, container));
            dndController.onDropTerminal(e => this._onRequestAddInstanceToGroup.fire(e));
            dndController.onDropFile(async (path) => {
                this.focus();
                await this.sendPath(path, false);
            });
            this._dndObserver.value = new dom.DragAndDropObserver(container, dndController);
        }
        hasSelection() {
            return this.xterm ? this.xterm.raw.hasSelection() : false;
        }
        async copySelection(asHtml, command) {
            const xterm = await this._xtermReadyPromise;
            await xterm.copySelection(asHtml, command);
        }
        get selection() {
            return this.xterm && this.hasSelection() ? this.xterm.raw.getSelection() : undefined;
        }
        clearSelection() {
            this.xterm?.raw.clearSelection();
        }
        _refreshAltBufferContextKey() {
            this._terminalAltBufferActiveContextKey.set(!!(this.xterm && this.xterm.raw.buffer.active === this.xterm.raw.buffer.alternate));
        }
        dispose(reason) {
            if (this.isDisposed) {
                return;
            }
            this._logService.trace(`terminalInstance#dispose (instanceId: ${this.instanceId})`);
            (0, lifecycle_1.dispose)(this._widgetManager);
            if (this.xterm?.raw.element) {
                this._hadFocusOnExit = this.hasFocus;
            }
            if (this._wrapperElement.xterm) {
                this._wrapperElement.xterm = undefined;
            }
            if (this._horizontalScrollbar) {
                this._horizontalScrollbar.dispose();
                this._horizontalScrollbar = undefined;
            }
            try {
                this.xterm?.dispose();
            }
            catch (err) {
                // See https://github.com/microsoft/vscode/issues/153486
                this._logService.error('Exception occurred during xterm disposal', err);
            }
            // HACK: Workaround for Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=559561,
            // as 'blur' event in xterm.raw.textarea is not triggered on xterm.dispose()
            // See https://github.com/microsoft/vscode/issues/138358
            if (browser_1.isFirefox) {
                this.resetFocusContextKey();
                this._terminalHasTextContextKey.reset();
                this._onDidBlur.fire(this);
            }
            if (this._pressAnyKeyToCloseListener) {
                this._pressAnyKeyToCloseListener.dispose();
                this._pressAnyKeyToCloseListener = undefined;
            }
            if (this._exitReason === undefined) {
                this._exitReason = reason ?? terminal_1.TerminalExitReason.Unknown;
            }
            this._processManager.dispose();
            // Process manager dispose/shutdown doesn't fire process exit, trigger with undefined if it
            // hasn't happened yet
            this._onProcessExit(undefined);
            this._onDisposed.fire(this);
            super.dispose();
        }
        async detachProcessAndDispose(reason) {
            // Detach the process and dispose the instance, without the instance dispose the terminal
            // won't go away. Force persist if the detach was requested by the user (not shutdown).
            await this._processManager.detachFromProcess(reason === terminal_1.TerminalExitReason.User);
            this.dispose(reason);
        }
        focus(force) {
            this._refreshAltBufferContextKey();
            if (!this.xterm) {
                return;
            }
            if (force || !dom.getActiveWindow().getSelection()?.toString()) {
                this.xterm.raw.focus();
                this._onDidRequestFocus.fire();
            }
        }
        async focusWhenReady(force) {
            await this._xtermReadyPromise;
            await this._attachBarrier.wait();
            this.focus(force);
        }
        async paste() {
            await this._paste(await this._clipboardService.readText());
        }
        async pasteSelection() {
            await this._paste(await this._clipboardService.readText('selection'));
        }
        async _paste(value) {
            if (!this.xterm) {
                return;
            }
            let currentText = value;
            const shouldPasteText = await this._scopedInstantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, currentText, this.xterm?.raw.modes.bracketedPasteMode);
            if (!shouldPasteText) {
                return;
            }
            if (typeof shouldPasteText === 'object') {
                currentText = shouldPasteText.modifiedText;
            }
            this.focus();
            this.xterm.raw.paste(currentText);
        }
        async sendText(text, shouldExecute, bracketedPasteMode) {
            // Apply bracketed paste sequences if the terminal has the mode enabled, this will prevent
            // the text from triggering keybindings and ensure new lines are handled properly
            if (bracketedPasteMode && this.xterm?.raw.modes.bracketedPasteMode) {
                text = `\x1b[200~${text}\x1b[201~`;
            }
            // Normalize line endings to 'enter' press.
            text = text.replace(/\r?\n/g, '\r');
            if (shouldExecute && !text.endsWith('\r')) {
                text += '\r';
            }
            // Send it to the process
            await this._processManager.write(text);
            this._onDidInputData.fire(this);
            this._onDidSendText.fire(text);
            this.xterm?.scrollToBottom();
            if (shouldExecute) {
                this._onDidExecuteText.fire();
            }
        }
        async sendPath(originalPath, shouldExecute) {
            return this.sendText(await this.preparePathForShell(originalPath), shouldExecute);
        }
        async preparePathForShell(originalPath) {
            // Wait for shell type to be ready
            await this.processReady;
            return (0, terminalEnvironment_1.preparePathForShell)(originalPath, this.shellLaunchConfig.executable, this.title, this.shellType, this._processManager.backend, this._processManager.os);
        }
        setVisible(visible) {
            this._isVisible = visible;
            this._wrapperElement.classList.toggle('active', visible);
            if (visible && this.xterm) {
                this._open();
                // Resize to re-evaluate dimensions, this will ensure when switching to a terminal it is
                // using the most up to date dimensions (eg. when terminal is created in the background
                // using cached dimensions of a split terminal).
                this._resize();
                // HACK: Trigger a forced refresh of the viewport to sync the viewport and scroll bar.
                // This is necessary if the number of rows in the terminal has decreased while it was in
                // the background since scrollTop changes take no effect but the terminal's position
                // does change since the number of visible rows decreases.
                // This can likely be removed after https://github.com/xtermjs/xterm.js/issues/291 is
                // fixed upstream.
                setTimeout(() => this.xterm.forceRefresh(), 0);
            }
        }
        scrollDownLine() {
            this.xterm?.scrollDownLine();
        }
        scrollDownPage() {
            this.xterm?.scrollDownPage();
        }
        scrollToBottom() {
            this.xterm?.scrollToBottom();
        }
        scrollUpLine() {
            this.xterm?.scrollUpLine();
        }
        scrollUpPage() {
            this.xterm?.scrollUpPage();
        }
        scrollToTop() {
            this.xterm?.scrollToTop();
        }
        clearBuffer() {
            this._processManager.clearBuffer();
            this.xterm?.clearBuffer();
        }
        _refreshSelectionContextKey() {
            const isActive = !!this._viewsService.getActiveViewWithId(terminal_2.TERMINAL_VIEW_ID);
            let isEditorActive = false;
            const editor = this._editorService.activeEditor;
            if (editor) {
                isEditorActive = editor instanceof terminalEditorInput_1.TerminalEditorInput;
            }
            this._terminalHasTextContextKey.set((isActive || isEditorActive) && this.hasSelection());
        }
        _createProcessManager() {
            let deserializedCollections;
            if (this.shellLaunchConfig.attachPersistentProcess?.environmentVariableCollections) {
                deserializedCollections = (0, environmentVariableShared_1.deserializeEnvironmentVariableCollections)(this.shellLaunchConfig.attachPersistentProcess.environmentVariableCollections);
            }
            const processManager = this._scopedInstantiationService.createInstance(terminalProcessManager_1.TerminalProcessManager, this._instanceId, this._configHelper, this.shellLaunchConfig?.cwd, deserializedCollections, this.shellLaunchConfig.attachPersistentProcess?.shellIntegrationNonce);
            this.capabilities.add(processManager.capabilities);
            processManager.onProcessReady(async (e) => {
                this._onProcessIdReady.fire(this);
                this._initialCwd = await this.getInitialCwd();
                // Set the initial name based on the _resolved_ shell launch config, this will also
                // ensure the resolved icon gets shown
                if (!this._labelComputer) {
                    this._labelComputer = this._register(this._scopedInstantiationService.createInstance(TerminalLabelComputer, this._configHelper));
                    this._register(this._labelComputer.onDidChangeLabel(e => {
                        const wasChanged = this._title !== e.title || this._description !== e.description;
                        if (wasChanged) {
                            this._title = e.title;
                            this._description = e.description;
                            this._onTitleChanged.fire(this);
                        }
                    }));
                }
                if (this._shellLaunchConfig.name) {
                    this._setTitle(this._shellLaunchConfig.name, terminal_1.TitleEventSource.Api);
                }
                else {
                    // Listen to xterm.js' sequence title change event, trigger this async to ensure
                    // _xtermReadyPromise is ready constructed since this is called from the ctor
                    setTimeout(() => {
                        this._xtermReadyPromise.then(xterm => {
                            this._messageTitleDisposable.value = xterm.raw.onTitleChange(e => this._onTitleChange(e));
                        });
                    });
                    this._setTitle(this._shellLaunchConfig.executable, terminal_1.TitleEventSource.Process);
                }
            });
            processManager.onProcessExit(exitCode => this._onProcessExit(exitCode));
            processManager.onDidChangeProperty(({ type, value }) => {
                switch (type) {
                    case "cwd" /* ProcessPropertyType.Cwd */:
                        this._cwd = value;
                        this._labelComputer?.refreshLabel(this);
                        break;
                    case "initialCwd" /* ProcessPropertyType.InitialCwd */:
                        this._initialCwd = value;
                        this._cwd = this._initialCwd;
                        this._setTitle(this.title, terminal_1.TitleEventSource.Config);
                        this._icon = this._shellLaunchConfig.attachPersistentProcess?.icon || this._shellLaunchConfig.icon;
                        this._onIconChanged.fire({ instance: this, userInitiated: false });
                        break;
                    case "title" /* ProcessPropertyType.Title */:
                        this._setTitle(value ?? '', terminal_1.TitleEventSource.Process);
                        break;
                    case "overrideDimensions" /* ProcessPropertyType.OverrideDimensions */:
                        this.setOverrideDimensions(value, true);
                        break;
                    case "resolvedShellLaunchConfig" /* ProcessPropertyType.ResolvedShellLaunchConfig */:
                        this._setResolvedShellLaunchConfig(value);
                        break;
                    case "shellType" /* ProcessPropertyType.ShellType */:
                        this.setShellType(value);
                        break;
                    case "hasChildProcesses" /* ProcessPropertyType.HasChildProcesses */:
                        this._onDidChangeHasChildProcesses.fire(value);
                        break;
                    case "usedShellIntegrationInjection" /* ProcessPropertyType.UsedShellIntegrationInjection */:
                        this._usedShellIntegrationInjection = true;
                        break;
                }
            });
            processManager.onProcessData(ev => {
                this._initialDataEvents?.push(ev.data);
                this._onData.fire(ev.data);
            });
            processManager.onProcessReplayComplete(() => this._onProcessReplayComplete.fire());
            processManager.onEnvironmentVariableInfoChanged(e => this._onEnvironmentVariableInfoChanged(e));
            processManager.onPtyDisconnect(() => {
                if (this.xterm) {
                    this.xterm.raw.options.disableStdin = true;
                }
                this.statusList.add({
                    id: "disconnected" /* TerminalStatus.Disconnected */,
                    severity: notification_1.Severity.Error,
                    icon: codicons_1.Codicon.debugDisconnect,
                    tooltip: nls.localize('disconnectStatus', "Lost connection to process")
                });
            });
            processManager.onPtyReconnect(() => {
                if (this.xterm) {
                    this.xterm.raw.options.disableStdin = false;
                }
                this.statusList.remove("disconnected" /* TerminalStatus.Disconnected */);
            });
            return processManager;
        }
        async _createProcess() {
            if (this.isDisposed) {
                return;
            }
            const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
            if (activeWorkspaceRootUri) {
                const trusted = await this._trust();
                if (!trusted) {
                    this._onProcessExit({ message: nls.localize('workspaceNotTrustedCreateTerminal', "Cannot launch a terminal process in an untrusted workspace") });
                }
            }
            else if (this._cwd && this._userHome && this._cwd !== this._userHome) {
                // something strange is going on if cwd is not userHome in an empty workspace
                this._onProcessExit({
                    message: nls.localize('workspaceNotTrustedCreateTerminalCwd', "Cannot launch a terminal process in an untrusted workspace with cwd {0} and userHome {1}", this._cwd, this._userHome)
                });
            }
            // Re-evaluate dimensions if the container has been set since the xterm instance was created
            if (this._container && this._cols === 0 && this._rows === 0) {
                this._initDimensions();
                this.xterm?.raw.resize(this._cols || 80 /* Constants.DefaultCols */, this._rows || 30 /* Constants.DefaultRows */);
            }
            const originalIcon = this.shellLaunchConfig.icon;
            await this._processManager.createProcess(this._shellLaunchConfig, this._cols || 80 /* Constants.DefaultCols */, this._rows || 30 /* Constants.DefaultRows */).then(result => {
                if (result) {
                    if ('message' in result) {
                        this._onProcessExit(result);
                    }
                    else if ('injectedArgs' in result) {
                        this._injectedArgs = result.injectedArgs;
                    }
                }
            });
            if (this.xterm?.shellIntegration) {
                this.capabilities.add(this.xterm.shellIntegration.capabilities);
            }
            if (originalIcon !== this.shellLaunchConfig.icon || this.shellLaunchConfig.color) {
                this._icon = this._shellLaunchConfig.attachPersistentProcess?.icon || this._shellLaunchConfig.icon;
                this._onIconChanged.fire({ instance: this, userInitiated: false });
            }
        }
        registerMarker(offset) {
            return this.xterm?.raw.registerMarker(offset);
        }
        addBufferMarker(properties) {
            this.capabilities.get(4 /* TerminalCapability.BufferMarkDetection */)?.addMark(properties);
        }
        scrollToMark(startMarkId, endMarkId, highlight) {
            this.xterm?.markTracker.scrollToClosestMarker(startMarkId, endMarkId, highlight);
        }
        async freePortKillProcess(port, command) {
            await this._processManager?.freePortKillProcess(port);
            this.runCommand(command, false);
        }
        _onProcessData(ev) {
            if (ev.trackCommit) {
                ev.writePromise = new Promise(r => this._writeProcessData(ev, r));
            }
            else {
                this._writeProcessData(ev);
            }
        }
        _writeProcessData(ev, cb) {
            const messageId = ++this._latestXtermWriteData;
            this.xterm?.raw.write(ev.data, () => {
                this._latestXtermParseData = messageId;
                this._processManager.acknowledgeDataEvent(ev.data.length);
                cb?.();
            });
        }
        /**
         * Called when either a process tied to a terminal has exited or when a terminal renderer
         * simulates a process exiting (e.g. custom execution task).
         * @param exitCode The exit code of the process, this is undefined when the terminal was exited
         * through user action.
         */
        async _onProcessExit(exitCodeOrError) {
            // Prevent dispose functions being triggered multiple times
            if (this._isExiting) {
                return;
            }
            const parsedExitResult = parseExitResult(exitCodeOrError, this.shellLaunchConfig, this._processManager.processState, this._initialCwd);
            if (this._usedShellIntegrationInjection && this._processManager.processState === 4 /* ProcessState.KilledDuringLaunch */ && parsedExitResult?.code !== 0) {
                this._relaunchWithShellIntegrationDisabled(parsedExitResult?.message);
                this._onExit.fire(exitCodeOrError);
                return;
            }
            this._isExiting = true;
            await this._flushXtermData();
            this._exitCode = parsedExitResult?.code;
            const exitMessage = parsedExitResult?.message;
            this._logService.debug('Terminal process exit', 'instanceId', this.instanceId, 'code', this._exitCode, 'processState', this._processManager.processState);
            // Only trigger wait on exit when the exit was *not* triggered by the
            // user (via the `workbench.action.terminal.kill` command).
            const waitOnExit = this.waitOnExit;
            if (waitOnExit && this._processManager.processState !== 5 /* ProcessState.KilledByUser */) {
                this._xtermReadyPromise.then(xterm => {
                    if (exitMessage) {
                        xterm.raw.write((0, terminalStrings_1.formatMessageForTerminal)(exitMessage));
                    }
                    switch (typeof waitOnExit) {
                        case 'string':
                            xterm.raw.write((0, terminalStrings_1.formatMessageForTerminal)(waitOnExit, { excludeLeadingNewLine: true }));
                            break;
                        case 'function':
                            if (this.exitCode !== undefined) {
                                xterm.raw.write((0, terminalStrings_1.formatMessageForTerminal)(waitOnExit(this.exitCode), { excludeLeadingNewLine: true }));
                            }
                            break;
                    }
                    // Disable all input if the terminal is exiting and listen for next keypress
                    xterm.raw.options.disableStdin = true;
                    if (xterm.raw.textarea) {
                        this._attachPressAnyKeyToCloseListener(xterm.raw);
                    }
                });
            }
            else {
                this.dispose(terminal_1.TerminalExitReason.Process);
                if (exitMessage) {
                    const failedDuringLaunch = this._processManager.processState === 4 /* ProcessState.KilledDuringLaunch */;
                    if (failedDuringLaunch || this._configHelper.config.showExitAlert) {
                        // Always show launch failures
                        this._notificationService.notify({
                            message: exitMessage,
                            severity: notification_1.Severity.Error,
                            actions: { primary: [this._scopedInstantiationService.createInstance(terminalActions_1.TerminalLaunchHelpAction)] }
                        });
                    }
                    else {
                        // Log to help surface the error in case users report issues with showExitAlert
                        // disabled
                        this._logService.warn(exitMessage);
                    }
                }
            }
            // First onExit to consumers, this can happen after the terminal has already been disposed.
            this._onExit.fire(exitCodeOrError);
            // Dispose of the onExit event if the terminal will not be reused again
            if (this.isDisposed) {
                this._onExit.dispose();
            }
        }
        _relaunchWithShellIntegrationDisabled(exitMessage) {
            this._shellLaunchConfig.ignoreShellIntegration = true;
            this.relaunch();
            this.statusList.add({
                id: "shell-integration-attention-needed" /* TerminalStatus.ShellIntegrationAttentionNeeded */,
                severity: notification_1.Severity.Warning,
                icon: codicons_1.Codicon.warning,
                tooltip: (`${exitMessage} ` ?? '') + nls.localize('launchFailed.exitCodeOnlyShellIntegration', 'Disabling shell integration in user settings might help.'),
                hoverActions: [{
                        commandId: "workbench.action.terminal.learnMore" /* TerminalCommandId.ShellIntegrationLearnMore */,
                        label: nls.localize('shellIntegration.learnMore', "Learn more about shell integration"),
                        run: () => {
                            this._openerService.open('https://code.visualstudio.com/docs/editor/integrated-terminal#_shell-integration');
                        }
                    }, {
                        commandId: 'workbench.action.openSettings',
                        label: nls.localize('shellIntegration.openSettings', "Open user settings"),
                        run: () => {
                            this._commandService.executeCommand('workbench.action.openSettings', 'terminal.integrated.shellIntegration.enabled');
                        }
                    }]
            });
            this._telemetryService.publicLog2('terminal/shellIntegrationFailureProcessExit');
        }
        /**
         * Ensure write calls to xterm.js have finished before resolving.
         */
        _flushXtermData() {
            if (this._latestXtermWriteData === this._latestXtermParseData) {
                return Promise.resolve();
            }
            let retries = 0;
            return new Promise(r => {
                const interval = dom.disposableWindowInterval(dom.getActiveWindow().window, () => {
                    if (this._latestXtermWriteData === this._latestXtermParseData || ++retries === 5) {
                        interval.dispose();
                        r();
                    }
                }, 20);
            });
        }
        _attachPressAnyKeyToCloseListener(xterm) {
            if (xterm.textarea && !this._pressAnyKeyToCloseListener) {
                this._pressAnyKeyToCloseListener = dom.addDisposableListener(xterm.textarea, 'keypress', (event) => {
                    if (this._pressAnyKeyToCloseListener) {
                        this._pressAnyKeyToCloseListener.dispose();
                        this._pressAnyKeyToCloseListener = undefined;
                        this.dispose(terminal_1.TerminalExitReason.Process);
                        event.preventDefault();
                    }
                });
            }
        }
        _writeInitialText(xterm, callback) {
            if (!this._shellLaunchConfig.initialText) {
                callback?.();
                return;
            }
            const text = typeof this._shellLaunchConfig.initialText === 'string'
                ? this._shellLaunchConfig.initialText
                : this._shellLaunchConfig.initialText?.text;
            if (typeof this._shellLaunchConfig.initialText === 'string') {
                xterm.raw.writeln(text, callback);
            }
            else {
                if (this._shellLaunchConfig.initialText.trailingNewLine) {
                    xterm.raw.writeln(text, callback);
                }
                else {
                    xterm.raw.write(text, callback);
                }
            }
        }
        async reuseTerminal(shell, reset = false) {
            // Unsubscribe any key listener we may have.
            this._pressAnyKeyToCloseListener?.dispose();
            this._pressAnyKeyToCloseListener = undefined;
            const xterm = this.xterm;
            if (xterm) {
                if (!reset) {
                    // Ensure new processes' output starts at start of new line
                    await new Promise(r => xterm.raw.write('\n\x1b[G', r));
                }
                // Print initialText if specified
                if (shell.initialText) {
                    this._shellLaunchConfig.initialText = shell.initialText;
                    await new Promise(r => this._writeInitialText(xterm, r));
                }
                // Clean up waitOnExit state
                if (this._isExiting && this._shellLaunchConfig.waitOnExit) {
                    xterm.raw.options.disableStdin = false;
                    this._isExiting = false;
                }
                if (reset) {
                    xterm.clearDecorations();
                }
            }
            // Dispose the environment info widget if it exists
            this.statusList.remove("relaunch-needed" /* TerminalStatus.RelaunchNeeded */);
            if (!reset) {
                // HACK: Force initialText to be non-falsy for reused terminals such that the
                // conptyInheritCursor flag is passed to the node-pty, this flag can cause a Window to stop
                // responding in Windows 10 1903 so we only want to use it when something is definitely written
                // to the terminal.
                shell.initialText = ' ';
            }
            // Set the new shell launch config
            this._shellLaunchConfig = shell; // Must be done before calling _createProcess()
            await this._processManager.relaunch(this._shellLaunchConfig, this._cols || 80 /* Constants.DefaultCols */, this._rows || 30 /* Constants.DefaultRows */, reset).then(result => {
                if (result) {
                    if ('message' in result) {
                        this._onProcessExit(result);
                    }
                    else if ('injectedArgs' in result) {
                        this._injectedArgs = result.injectedArgs;
                    }
                }
            });
        }
        relaunch() {
            this.reuseTerminal(this._shellLaunchConfig, true);
        }
        _onTitleChange(title) {
            if (this.isTitleSetByProcess) {
                this._setTitle(title, terminal_1.TitleEventSource.Sequence);
            }
        }
        async _trust() {
            return (await this._workspaceTrustRequestService.requestWorkspaceTrust({
                message: nls.localize('terminal.requestTrust', "Creating a terminal process requires executing code")
            })) === true;
        }
        async _onSelectionChange() {
            this._onDidChangeSelection.fire(this);
            if (this._configurationService.getValue("terminal.integrated.copyOnSelection" /* TerminalSettingId.CopyOnSelection */)) {
                if (this._overrideCopySelection === false) {
                    return;
                }
                if (this.hasSelection()) {
                    await this.copySelection();
                }
            }
        }
        overrideCopyOnSelection(value) {
            if (this._overrideCopySelection !== undefined) {
                throw new Error('Cannot set a copy on selection override multiple times');
            }
            this._overrideCopySelection = value;
            return (0, lifecycle_1.toDisposable)(() => this._overrideCopySelection = undefined);
        }
        async _updateProcessCwd() {
            if (this.isDisposed || this.shellLaunchConfig.customPtyImplementation) {
                return;
            }
            // reset cwd if it has changed, so file based url paths can be resolved
            try {
                const cwd = await this._refreshProperty("cwd" /* ProcessPropertyType.Cwd */);
                if (typeof cwd !== 'string') {
                    throw new Error(`cwd is not a string ${cwd}`);
                }
            }
            catch (e) {
                // Swallow this as it means the process has been killed
                if (e instanceof Error && e.message === 'Cannot refresh property when process is not set') {
                    return;
                }
                throw e;
            }
        }
        updateConfig() {
            this._setCommandsToSkipShell(this._configHelper.config.commandsToSkipShell);
            this._refreshEnvironmentVariableInfoWidgetState(this._processManager.environmentVariableInfo);
        }
        async _updateUnicodeVersion() {
            this._processManager.setUnicodeVersion(this._configHelper.config.unicodeVersion);
        }
        updateAccessibilitySupport() {
            this.xterm.raw.options.screenReaderMode = this._accessibilityService.isScreenReaderOptimized();
        }
        _setCommandsToSkipShell(commands) {
            const excludeCommands = commands.filter(command => command[0] === '-').map(command => command.slice(1));
            this._skipTerminalCommands = terminal_2.DEFAULT_COMMANDS_TO_SKIP_SHELL.filter(defaultCommand => {
                return !excludeCommands.includes(defaultCommand);
            }).concat(commands);
        }
        layout(dimension) {
            this._lastLayoutDimensions = dimension;
            if (this.disableLayout) {
                return;
            }
            // Don't layout if dimensions are invalid (eg. the container is not attached to the DOM or
            // if display: none
            if (dimension.width <= 0 || dimension.height <= 0) {
                return;
            }
            // Evaluate columns and rows, exclude the wrapper element's margin
            const terminalWidth = this._evaluateColsAndRows(dimension.width, dimension.height);
            if (!terminalWidth) {
                return;
            }
            this._resize();
            // Signal the container is ready
            this._containerReadyBarrier.open();
            // Layout all contributions
            for (const contribution of this._contributions.values()) {
                if (!this.xterm) {
                    this._xtermReadyPromise.then(xterm => contribution.layout?.(xterm, dimension));
                }
                else {
                    contribution.layout?.(this.xterm, dimension);
                }
            }
        }
        async _resize() {
            this._resizeNow(false);
        }
        async _resizeNow(immediate) {
            let cols = this.cols;
            let rows = this.rows;
            if (this.xterm) {
                // Only apply these settings when the terminal is visible so that
                // the characters are measured correctly.
                if (this._isVisible && this._layoutSettingsChanged) {
                    const font = this.xterm.getFont();
                    const config = this._configHelper.config;
                    this.xterm.raw.options.letterSpacing = font.letterSpacing;
                    this.xterm.raw.options.lineHeight = font.lineHeight;
                    this.xterm.raw.options.fontSize = font.fontSize;
                    this.xterm.raw.options.fontFamily = font.fontFamily;
                    this.xterm.raw.options.fontWeight = config.fontWeight;
                    this.xterm.raw.options.fontWeightBold = config.fontWeightBold;
                    // Any of the above setting changes could have changed the dimensions of the
                    // terminal, re-evaluate now.
                    this._initDimensions();
                    cols = this.cols;
                    rows = this.rows;
                    this._layoutSettingsChanged = false;
                }
                if (isNaN(cols) || isNaN(rows)) {
                    return;
                }
                if (cols !== this.xterm.raw.cols || rows !== this.xterm.raw.rows) {
                    if (this._fixedRows || this._fixedCols) {
                        await this._updateProperty("fixedDimensions" /* ProcessPropertyType.FixedDimensions */, { cols: this._fixedCols, rows: this._fixedRows });
                    }
                    this._onDimensionsChanged.fire();
                }
                this.xterm.raw.resize(cols, rows);
                TerminalInstance_1._lastKnownGridDimensions = { cols, rows };
                if (this._isVisible) {
                    this.xterm.forceUnpause();
                }
            }
            if (immediate) {
                // do not await, call setDimensions synchronously
                this._processManager.setDimensions(cols, rows, true);
            }
            else {
                await this._processManager.setDimensions(cols, rows);
            }
        }
        setShellType(shellType) {
            this._shellType = shellType;
            if (shellType) {
                this._terminalShellTypeContextKey.set(shellType?.toString());
            }
        }
        _setAriaLabel(xterm, terminalId, title) {
            const labelParts = [];
            if (xterm && xterm.textarea) {
                if (title && title.length > 0) {
                    labelParts.push(nls.localize('terminalTextBoxAriaLabelNumberAndTitle', "Terminal {0}, {1}", terminalId, title));
                }
                else {
                    labelParts.push(nls.localize('terminalTextBoxAriaLabel', "Terminal {0}", terminalId));
                }
                const screenReaderOptimized = this._accessibilityService.isScreenReaderOptimized();
                if (!screenReaderOptimized) {
                    labelParts.push(nls.localize('terminalScreenReaderMode', "Run the command: Toggle Screen Reader Accessibility Mode for an optimized screen reader experience"));
                }
                const accessibilityHelpKeybinding = this._keybindingService.lookupKeybinding("editor.action.accessibilityHelp" /* AccessibilityCommandId.OpenAccessibilityHelp */)?.getLabel();
                if (this._configurationService.getValue("accessibility.verbosity.terminal" /* AccessibilityVerbositySettingId.Terminal */) && accessibilityHelpKeybinding) {
                    labelParts.push(nls.localize('terminalHelpAriaLabel', "Use {0} for terminal accessibility help", accessibilityHelpKeybinding));
                }
                xterm.textarea.setAttribute('aria-label', labelParts.join('\n'));
            }
        }
        _updateTitleProperties(title, eventSource) {
            if (!title) {
                return this._processName;
            }
            switch (eventSource) {
                case terminal_1.TitleEventSource.Process:
                    if (this._processManager.os === 1 /* OperatingSystem.Windows */) {
                        // Extract the file name without extension
                        title = path.win32.parse(title).name;
                    }
                    else {
                        const firstSpaceIndex = title.indexOf(' ');
                        if (title.startsWith('/')) {
                            title = path.basename(title);
                        }
                        else if (firstSpaceIndex > -1) {
                            title = title.substring(0, firstSpaceIndex);
                        }
                    }
                    this._processName = title;
                    break;
                case terminal_1.TitleEventSource.Api:
                    // If the title has not been set by the API or the rename command, unregister the handler that
                    // automatically updates the terminal name
                    this._staticTitle = title;
                    this._messageTitleDisposable.value = undefined;
                    break;
                case terminal_1.TitleEventSource.Sequence:
                    // On Windows, some shells will fire this with the full path which we want to trim
                    // to show just the file name. This should only happen if the title looks like an
                    // absolute Windows file path
                    this._sequence = title;
                    if (this._processManager.os === 1 /* OperatingSystem.Windows */ &&
                        title.match(/^[a-zA-Z]:\\.+\.[a-zA-Z]{1,3}/)) {
                        this._sequence = path.win32.parse(title).name;
                    }
                    break;
            }
            this._titleSource = eventSource;
            return title;
        }
        setOverrideDimensions(dimensions, immediate = false) {
            if (this._dimensionsOverride && this._dimensionsOverride.forceExactSize && !dimensions && this._rows === 0 && this._cols === 0) {
                // this terminal never had a real size => keep the last dimensions override exact size
                this._cols = this._dimensionsOverride.cols;
                this._rows = this._dimensionsOverride.rows;
            }
            this._dimensionsOverride = dimensions;
            if (immediate) {
                this._resizeNow(true);
            }
            else {
                this._resize();
            }
        }
        async setFixedDimensions() {
            const cols = await this._quickInputService.input({
                title: nls.localize('setTerminalDimensionsColumn', "Set Fixed Dimensions: Column"),
                placeHolder: 'Enter a number of columns or leave empty for automatic width',
                validateInput: async (text) => text.length > 0 && !text.match(/^\d+$/) ? { content: 'Enter a number or leave empty size automatically', severity: notification_1.Severity.Error } : undefined
            });
            if (cols === undefined) {
                return;
            }
            this._fixedCols = this._parseFixedDimension(cols);
            this._labelComputer?.refreshLabel(this);
            this._terminalHasFixedWidth.set(!!this._fixedCols);
            const rows = await this._quickInputService.input({
                title: nls.localize('setTerminalDimensionsRow', "Set Fixed Dimensions: Row"),
                placeHolder: 'Enter a number of rows or leave empty for automatic height',
                validateInput: async (text) => text.length > 0 && !text.match(/^\d+$/) ? { content: 'Enter a number or leave empty size automatically', severity: notification_1.Severity.Error } : undefined
            });
            if (rows === undefined) {
                return;
            }
            this._fixedRows = this._parseFixedDimension(rows);
            this._labelComputer?.refreshLabel(this);
            await this._refreshScrollbar();
            this._resize();
            this.focus();
        }
        _parseFixedDimension(value) {
            if (value === '') {
                return undefined;
            }
            const parsed = parseInt(value);
            if (parsed <= 0) {
                throw new Error(`Could not parse dimension "${value}"`);
            }
            return parsed;
        }
        async toggleSizeToContentWidth() {
            if (!this.xterm?.raw.buffer.active) {
                return;
            }
            if (this._hasScrollBar) {
                this._terminalHasFixedWidth.set(false);
                this._fixedCols = undefined;
                this._fixedRows = undefined;
                this._hasScrollBar = false;
                this._initDimensions();
                await this._resize();
            }
            else {
                const font = this.xterm ? this.xterm.getFont() : this._configHelper.getFont(dom.getWindow(this.domElement));
                const maxColsForTexture = Math.floor(4096 /* Constants.MaxCanvasWidth */ / (font.charWidth ?? 20));
                // Fixed columns should be at least xterm.js' regular column count
                const proposedCols = Math.max(this.maxCols, Math.min(this.xterm.getLongestViewportWrappedLineLength(), maxColsForTexture));
                // Don't switch to fixed dimensions if the content already fits as it makes the scroll
                // bar look bad being off the edge
                if (proposedCols > this.xterm.raw.cols) {
                    this._fixedCols = proposedCols;
                }
            }
            await this._refreshScrollbar();
            this._labelComputer?.refreshLabel(this);
            this.focus();
        }
        _refreshScrollbar() {
            if (this._fixedCols || this._fixedRows) {
                return this._addScrollbar();
            }
            return this._removeScrollbar();
        }
        async _addScrollbar() {
            const charWidth = (this.xterm ? this.xterm.getFont() : this._configHelper.getFont(dom.getWindow(this.domElement))).charWidth;
            if (!this.xterm?.raw.element || !this._container || !charWidth || !this._fixedCols) {
                return;
            }
            this._wrapperElement.classList.add('fixed-dims');
            this._hasScrollBar = true;
            this._initDimensions();
            // Always remove a row to make room for the scroll bar
            this._fixedRows = this._rows - 1;
            await this._resize();
            this._terminalHasFixedWidth.set(true);
            if (!this._horizontalScrollbar) {
                this._horizontalScrollbar = this._register(new scrollableElement_1.DomScrollableElement(this._wrapperElement, {
                    vertical: 2 /* ScrollbarVisibility.Hidden */,
                    horizontal: 1 /* ScrollbarVisibility.Auto */,
                    useShadows: false,
                    scrollYToX: false,
                    consumeMouseWheelIfScrollbarIsNeeded: false
                }));
                this._container.appendChild(this._horizontalScrollbar.getDomNode());
            }
            this._horizontalScrollbar.setScrollDimensions({
                width: this.xterm.raw.element.clientWidth,
                scrollWidth: this._fixedCols * charWidth + 40 // Padding + scroll bar
            });
            this._horizontalScrollbar.getDomNode().style.paddingBottom = '16px';
            // work around for https://github.com/xtermjs/xterm.js/issues/3482
            if (platform_1.isWindows) {
                for (let i = this.xterm.raw.buffer.active.viewportY; i < this.xterm.raw.buffer.active.length; i++) {
                    const line = this.xterm.raw.buffer.active.getLine(i);
                    line._line.isWrapped = false;
                }
            }
        }
        async _removeScrollbar() {
            if (!this._container || !this._horizontalScrollbar) {
                return;
            }
            this._horizontalScrollbar.getDomNode().remove();
            this._horizontalScrollbar.dispose();
            this._horizontalScrollbar = undefined;
            this._wrapperElement.remove();
            this._wrapperElement.classList.remove('fixed-dims');
            this._container.appendChild(this._wrapperElement);
        }
        _setResolvedShellLaunchConfig(shellLaunchConfig) {
            this._shellLaunchConfig.args = shellLaunchConfig.args;
            this._shellLaunchConfig.cwd = shellLaunchConfig.cwd;
            this._shellLaunchConfig.executable = shellLaunchConfig.executable;
            this._shellLaunchConfig.env = shellLaunchConfig.env;
        }
        _onEnvironmentVariableInfoChanged(info) {
            if (info.requiresAction) {
                this.xterm?.raw.textarea?.setAttribute('aria-label', nls.localize('terminalStaleTextBoxAriaLabel', "Terminal {0} environment is stale, run the 'Show Environment Information' command for more information", this._instanceId));
            }
            this._refreshEnvironmentVariableInfoWidgetState(info);
        }
        async _refreshEnvironmentVariableInfoWidgetState(info) {
            // Check if the status should exist
            if (!info) {
                this.statusList.remove("relaunch-needed" /* TerminalStatus.RelaunchNeeded */);
                this.statusList.remove("env-var-info-changes-active" /* TerminalStatus.EnvironmentVariableInfoChangesActive */);
                return;
            }
            // Recreate the process seamlessly without informing the use if the following conditions are
            // met.
            if (
            // The change requires a relaunch
            info.requiresAction &&
                // The feature is enabled
                this._configHelper.config.environmentChangesRelaunch &&
                // Has not been interacted with
                !this._processManager.hasWrittenData &&
                // Not a feature terminal or is a reconnecting task terminal (TODO: Need to explain the latter case)
                (!this._shellLaunchConfig.isFeatureTerminal || (this.reconnectionProperties && this._configurationService.getValue('task.reconnection') === true)) &&
                // Not a custom pty
                !this._shellLaunchConfig.customPtyImplementation &&
                // Not an extension owned terminal
                !this._shellLaunchConfig.isExtensionOwnedTerminal &&
                // Not a reconnected or revived terminal
                !this._shellLaunchConfig.attachPersistentProcess &&
                // Not a Windows remote using ConPTY (#187084)
                !(this._processManager.remoteAuthority && this._configHelper.config.windowsEnableConpty && (await this._processManager.getBackendOS()) === 1 /* OperatingSystem.Windows */)) {
                this.relaunch();
                return;
            }
            // Re-create statuses
            const workspaceFolder = (0, terminalEnvironment_1.getWorkspaceForTerminal)(this.shellLaunchConfig.cwd, this._workspaceContextService, this._historyService);
            this.statusList.add(info.getStatus({ workspaceFolder }));
        }
        async getInitialCwd() {
            if (!this._initialCwd) {
                this._initialCwd = this._processManager.initialCwd;
            }
            return this._initialCwd;
        }
        async getCwd() {
            if (this.capabilities.has(0 /* TerminalCapability.CwdDetection */)) {
                return this.capabilities.get(0 /* TerminalCapability.CwdDetection */).getCwd();
            }
            else if (this.capabilities.has(1 /* TerminalCapability.NaiveCwdDetection */)) {
                return this.capabilities.get(1 /* TerminalCapability.NaiveCwdDetection */).getCwd();
            }
            return this._processManager.initialCwd;
        }
        async _refreshProperty(type) {
            await this.processReady;
            return this._processManager.refreshProperty(type);
        }
        async _updateProperty(type, value) {
            return this._processManager.updateProperty(type, value);
        }
        async rename(title) {
            this._setTitle(title, terminal_1.TitleEventSource.Api);
        }
        _setTitle(title, eventSource) {
            const reset = !title;
            title = this._updateTitleProperties(title, eventSource);
            const titleChanged = title !== this._title;
            this._title = title;
            this._labelComputer?.refreshLabel(this, reset);
            this._setAriaLabel(this.xterm?.raw, this._instanceId, this._title);
            if (titleChanged) {
                this._onTitleChanged.fire(this);
            }
        }
        async changeIcon(icon) {
            if (icon) {
                this._icon = icon;
                this._onIconChanged.fire({ instance: this, userInitiated: true });
                return icon;
            }
            const items = [];
            for (const icon of (0, codicons_1.getAllCodicons)()) {
                items.push({ label: `$(${icon.id})`, description: `${icon.id}`, icon });
            }
            const result = await this._quickInputService.pick(items, {
                matchOnDescription: true,
                placeHolder: nls.localize('changeIcon', 'Select an icon for the terminal')
            });
            if (result) {
                this._icon = result.icon;
                this._onIconChanged.fire({ instance: this, userInitiated: true });
                return this._icon;
            }
            return;
        }
        async changeColor(color, skipQuickPick) {
            if (color) {
                this.shellLaunchConfig.color = color;
                this._onIconChanged.fire({ instance: this, userInitiated: true });
                return color;
            }
            else if (skipQuickPick) {
                // Reset this tab's color
                this.shellLaunchConfig.color = '';
                this._onIconChanged.fire({ instance: this, userInitiated: true });
                return;
            }
            const icon = this._getIcon();
            if (!icon) {
                return;
            }
            const colorTheme = this._themeService.getColorTheme();
            const standardColors = (0, terminalIcon_1.getStandardColors)(colorTheme);
            const colorStyleDisposable = (0, terminalIcon_1.createColorStyleElement)(colorTheme);
            const items = [];
            for (const colorKey of standardColors) {
                const colorClass = (0, terminalIcon_1.getColorClass)(colorKey);
                items.push({
                    label: `$(${codicons_1.Codicon.circleFilled.id}) ${colorKey.replace('terminal.ansi', '')}`, id: colorKey, description: colorKey, iconClasses: [colorClass]
                });
            }
            items.push({ type: 'separator' });
            const showAllColorsItem = { label: 'Reset to default' };
            items.push(showAllColorsItem);
            const quickPick = this._quickInputService.createQuickPick();
            quickPick.items = items;
            quickPick.matchOnDescription = true;
            quickPick.placeholder = nls.localize('changeColor', 'Select a color for the terminal');
            quickPick.show();
            const disposables = [];
            const result = await new Promise(r => {
                disposables.push(quickPick.onDidHide(() => r(undefined)));
                disposables.push(quickPick.onDidAccept(() => r(quickPick.selectedItems[0])));
            });
            (0, lifecycle_1.dispose)(disposables);
            if (result) {
                this.shellLaunchConfig.color = result.id;
                this._onIconChanged.fire({ instance: this, userInitiated: true });
            }
            quickPick.hide();
            colorStyleDisposable.dispose();
            return result?.id;
        }
        forceScrollbarVisibility() {
            this._wrapperElement.classList.add('force-scrollbar');
        }
        resetScrollbarVisibility() {
            this._wrapperElement.classList.remove('force-scrollbar');
        }
        setParentContextKeyService(parentContextKeyService) {
            this._scopedContextKeyService.updateParent(parentContextKeyService);
        }
    };
    exports.TerminalInstance = TerminalInstance;
    __decorate([
        (0, decorators_1.debounce)(50)
    ], TerminalInstance.prototype, "_fireMaximumDimensionsChanged", null);
    __decorate([
        (0, decorators_1.debounce)(1000)
    ], TerminalInstance.prototype, "relaunch", null);
    __decorate([
        (0, decorators_1.debounce)(2000)
    ], TerminalInstance.prototype, "_updateProcessCwd", null);
    __decorate([
        (0, decorators_1.debounce)(50)
    ], TerminalInstance.prototype, "_resize", null);
    exports.TerminalInstance = TerminalInstance = TerminalInstance_1 = __decorate([
        __param(4, contextkey_1.IContextKeyService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, terminal_2.ITerminalProfileResolverService),
        __param(7, pathService_1.IPathService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, preferences_1.IPreferencesService),
        __param(11, viewsService_1.IViewsService),
        __param(12, clipboardService_1.IClipboardService),
        __param(13, themeService_1.IThemeService),
        __param(14, configuration_1.IConfigurationService),
        __param(15, terminal_1.ITerminalLogService),
        __param(16, storage_1.IStorageService),
        __param(17, accessibility_1.IAccessibilityService),
        __param(18, productService_1.IProductService),
        __param(19, quickInput_1.IQuickInputService),
        __param(20, environmentService_1.IWorkbenchEnvironmentService),
        __param(21, workspace_1.IWorkspaceContextService),
        __param(22, editorService_1.IEditorService),
        __param(23, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(24, history_2.IHistoryService),
        __param(25, telemetry_1.ITelemetryService),
        __param(26, opener_1.IOpenerService),
        __param(27, commands_1.ICommandService),
        __param(28, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(29, views_1.IViewDescriptorService)
    ], TerminalInstance);
    let TerminalInstanceDragAndDropController = class TerminalInstanceDragAndDropController extends lifecycle_1.Disposable {
        get onDropFile() { return this._onDropFile.event; }
        get onDropTerminal() { return this._onDropTerminal.event; }
        constructor(_container, _layoutService, _viewDescriptorService) {
            super();
            this._container = _container;
            this._layoutService = _layoutService;
            this._viewDescriptorService = _viewDescriptorService;
            this._onDropFile = this._register(new event_1.Emitter());
            this._onDropTerminal = this._register(new event_1.Emitter());
            this._register((0, lifecycle_1.toDisposable)(() => this._clearDropOverlay()));
        }
        _clearDropOverlay() {
            if (this._dropOverlay && this._dropOverlay.parentElement) {
                this._dropOverlay.parentElement.removeChild(this._dropOverlay);
            }
            this._dropOverlay = undefined;
        }
        onDragEnter(e) {
            if (!(0, dnd_2.containsDragType)(e, dnd_1.DataTransfers.FILES, dnd_1.DataTransfers.RESOURCES, "Terminals" /* TerminalDataTransfers.Terminals */, dnd_2.CodeDataTransfers.FILES)) {
                return;
            }
            if (!this._dropOverlay) {
                this._dropOverlay = document.createElement('div');
                this._dropOverlay.classList.add('terminal-drop-overlay');
            }
            // Dragging terminals
            if ((0, dnd_2.containsDragType)(e, "Terminals" /* TerminalDataTransfers.Terminals */)) {
                const side = this._getDropSide(e);
                this._dropOverlay.classList.toggle('drop-before', side === 'before');
                this._dropOverlay.classList.toggle('drop-after', side === 'after');
            }
            if (!this._dropOverlay.parentElement) {
                this._container.appendChild(this._dropOverlay);
            }
        }
        onDragLeave(e) {
            this._clearDropOverlay();
        }
        onDragEnd(e) {
            this._clearDropOverlay();
        }
        onDragOver(e) {
            if (!e.dataTransfer || !this._dropOverlay) {
                return;
            }
            // Dragging terminals
            if ((0, dnd_2.containsDragType)(e, "Terminals" /* TerminalDataTransfers.Terminals */)) {
                const side = this._getDropSide(e);
                this._dropOverlay.classList.toggle('drop-before', side === 'before');
                this._dropOverlay.classList.toggle('drop-after', side === 'after');
            }
            this._dropOverlay.style.opacity = '1';
        }
        async onDrop(e) {
            this._clearDropOverlay();
            if (!e.dataTransfer) {
                return;
            }
            const terminalResources = (0, terminalUri_1.getTerminalResourcesFromDragEvent)(e);
            if (terminalResources) {
                for (const uri of terminalResources) {
                    const side = this._getDropSide(e);
                    this._onDropTerminal.fire({ uri, side });
                }
                return;
            }
            // Check if files were dragged from the tree explorer
            let path;
            const rawResources = e.dataTransfer.getData(dnd_1.DataTransfers.RESOURCES);
            if (rawResources) {
                path = uri_1.URI.parse(JSON.parse(rawResources)[0]);
            }
            const rawCodeFiles = e.dataTransfer.getData(dnd_2.CodeDataTransfers.FILES);
            if (!path && rawCodeFiles) {
                path = uri_1.URI.file(JSON.parse(rawCodeFiles)[0]);
            }
            if (!path && e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].path /* Electron only */) {
                // Check if the file was dragged from the filesystem
                path = uri_1.URI.file(e.dataTransfer.files[0].path);
            }
            if (!path) {
                return;
            }
            this._onDropFile.fire(path);
        }
        _getDropSide(e) {
            const target = this._container;
            if (!target) {
                return 'after';
            }
            const rect = target.getBoundingClientRect();
            return this._getViewOrientation() === 1 /* Orientation.HORIZONTAL */
                ? (e.clientX - rect.left < rect.width / 2 ? 'before' : 'after')
                : (e.clientY - rect.top < rect.height / 2 ? 'before' : 'after');
        }
        _getViewOrientation() {
            const panelPosition = this._layoutService.getPanelPosition();
            const terminalLocation = this._viewDescriptorService.getViewLocationById(terminal_2.TERMINAL_VIEW_ID);
            return terminalLocation === 1 /* ViewContainerLocation.Panel */ && panelPosition === 2 /* Position.BOTTOM */
                ? 1 /* Orientation.HORIZONTAL */
                : 0 /* Orientation.VERTICAL */;
        }
    };
    TerminalInstanceDragAndDropController = __decorate([
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, views_1.IViewDescriptorService)
    ], TerminalInstanceDragAndDropController);
    var TerminalLabelType;
    (function (TerminalLabelType) {
        TerminalLabelType["Title"] = "title";
        TerminalLabelType["Description"] = "description";
    })(TerminalLabelType || (TerminalLabelType = {}));
    let TerminalLabelComputer = class TerminalLabelComputer extends lifecycle_1.Disposable {
        get title() { return this._title; }
        get description() { return this._description; }
        constructor(_configHelper, _fileService, _workspaceContextService) {
            super();
            this._configHelper = _configHelper;
            this._fileService = _fileService;
            this._workspaceContextService = _workspaceContextService;
            this._title = '';
            this._description = '';
            this._onDidChangeLabel = this._register(new event_1.Emitter());
            this.onDidChangeLabel = this._onDidChangeLabel.event;
        }
        refreshLabel(instance, reset) {
            this._title = this.computeLabel(instance, this._configHelper.config.tabs.title, "title" /* TerminalLabelType.Title */, reset);
            this._description = this.computeLabel(instance, this._configHelper.config.tabs.description, "description" /* TerminalLabelType.Description */);
            if (this._title !== instance.title || this._description !== instance.description || reset) {
                this._onDidChangeLabel.fire({ title: this._title, description: this._description });
            }
        }
        computeLabel(instance, labelTemplate, labelType, reset) {
            const type = instance.shellLaunchConfig.attachPersistentProcess?.type || instance.shellLaunchConfig.type;
            const templateProperties = {
                cwd: instance.cwd || instance.initialCwd || '',
                cwdFolder: '',
                workspaceFolder: instance.workspaceFolder ? path.basename(instance.workspaceFolder.uri.fsPath) : undefined,
                local: type === 'Local' ? terminalStrings_2.terminalStrings.typeLocal : undefined,
                process: instance.processName,
                sequence: instance.sequence,
                task: type === 'Task' ? terminalStrings_2.terminalStrings.typeTask : undefined,
                fixedDimensions: instance.fixedCols
                    ? (instance.fixedRows ? `\u2194${instance.fixedCols} \u2195${instance.fixedRows}` : `\u2194${instance.fixedCols}`)
                    : (instance.fixedRows ? `\u2195${instance.fixedRows}` : ''),
                separator: { label: this._configHelper.config.tabs.separator }
            };
            labelTemplate = labelTemplate.trim();
            if (!labelTemplate) {
                return labelType === "title" /* TerminalLabelType.Title */ ? (instance.processName || '') : '';
            }
            if (!reset && instance.staticTitle && labelType === "title" /* TerminalLabelType.Title */) {
                return instance.staticTitle.replace(/[\n\r\t]/g, '') || templateProperties.process?.replace(/[\n\r\t]/g, '') || '';
            }
            const detection = instance.capabilities.has(0 /* TerminalCapability.CwdDetection */) || instance.capabilities.has(1 /* TerminalCapability.NaiveCwdDetection */);
            const folders = this._workspaceContextService.getWorkspace().folders;
            const multiRootWorkspace = folders.length > 1;
            // Only set cwdFolder if detection is on
            if (templateProperties.cwd && detection && (!instance.shellLaunchConfig.isFeatureTerminal || labelType === "title" /* TerminalLabelType.Title */)) {
                const cwdUri = uri_1.URI.from({
                    scheme: instance.workspaceFolder?.uri.scheme || network_1.Schemas.file,
                    path: instance.cwd ? path.resolve(instance.cwd) : undefined
                });
                // Multi-root workspaces always show cwdFolder to disambiguate them, otherwise only show
                // when it differs from the workspace folder in which it was launched from
                let showCwd = false;
                if (multiRootWorkspace) {
                    showCwd = true;
                }
                else if (instance.workspaceFolder?.uri) {
                    const caseSensitive = this._fileService.hasCapability(instance.workspaceFolder.uri, 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
                    showCwd = cwdUri.fsPath.localeCompare(instance.workspaceFolder.uri.fsPath, undefined, { sensitivity: caseSensitive ? 'case' : 'base' }) !== 0;
                }
                if (showCwd) {
                    templateProperties.cwdFolder = path.basename(templateProperties.cwd);
                }
            }
            // Remove special characters that could mess with rendering
            const label = (0, labels_1.template)(labelTemplate, templateProperties).replace(/[\n\r\t]/g, '').trim();
            return label === '' && labelType === "title" /* TerminalLabelType.Title */ ? (instance.processName || '') : label;
        }
    };
    exports.TerminalLabelComputer = TerminalLabelComputer;
    exports.TerminalLabelComputer = TerminalLabelComputer = __decorate([
        __param(1, files_1.IFileService),
        __param(2, workspace_1.IWorkspaceContextService)
    ], TerminalLabelComputer);
    function parseExitResult(exitCodeOrError, shellLaunchConfig, processState, initialCwd) {
        // Only return a message if the exit code is non-zero
        if (exitCodeOrError === undefined || exitCodeOrError === 0) {
            return { code: exitCodeOrError, message: undefined };
        }
        const code = typeof exitCodeOrError === 'number' ? exitCodeOrError : exitCodeOrError.code;
        // Create exit code message
        let message = undefined;
        switch (typeof exitCodeOrError) {
            case 'number': {
                let commandLine = undefined;
                if (shellLaunchConfig.executable) {
                    commandLine = shellLaunchConfig.executable;
                    if (typeof shellLaunchConfig.args === 'string') {
                        commandLine += ` ${shellLaunchConfig.args}`;
                    }
                    else if (shellLaunchConfig.args && shellLaunchConfig.args.length) {
                        commandLine += shellLaunchConfig.args.map(a => ` '${a}'`).join();
                    }
                }
                if (processState === 4 /* ProcessState.KilledDuringLaunch */) {
                    if (commandLine) {
                        message = nls.localize('launchFailed.exitCodeAndCommandLine', "The terminal process \"{0}\" failed to launch (exit code: {1}).", commandLine, code);
                    }
                    else {
                        message = nls.localize('launchFailed.exitCodeOnly', "The terminal process failed to launch (exit code: {0}).", code);
                    }
                }
                else {
                    if (commandLine) {
                        message = nls.localize('terminated.exitCodeAndCommandLine', "The terminal process \"{0}\" terminated with exit code: {1}.", commandLine, code);
                    }
                    else {
                        message = nls.localize('terminated.exitCodeOnly', "The terminal process terminated with exit code: {0}.", code);
                    }
                }
                break;
            }
            case 'object': {
                // Ignore internal errors
                if (exitCodeOrError.message.toString().includes('Could not find pty with id')) {
                    break;
                }
                // Convert conpty code-based failures into human friendly messages
                let innerMessage = exitCodeOrError.message;
                const conptyError = exitCodeOrError.message.match(/.*error code:\s*(\d+).*$/);
                if (conptyError) {
                    const errorCode = conptyError.length > 1 ? parseInt(conptyError[1]) : undefined;
                    switch (errorCode) {
                        case 5:
                            innerMessage = `Access was denied to the path containing your executable "${shellLaunchConfig.executable}". Manage and change your permissions to get this to work`;
                            break;
                        case 267:
                            innerMessage = `Invalid starting directory "${initialCwd}", review your terminal.integrated.cwd setting`;
                            break;
                        case 1260:
                            innerMessage = `Windows cannot open this program because it has been prevented by a software restriction policy. For more information, open Event Viewer or contact your system Administrator`;
                            break;
                    }
                }
                message = nls.localize('launchFailed.errorMessage', "The terminal process failed to launch: {0}.", innerMessage);
                break;
            }
        }
        return { code, message };
    }
    let TerminalInstanceColorProvider = class TerminalInstanceColorProvider {
        constructor(_instance, _viewDescriptorService) {
            this._instance = _instance;
            this._viewDescriptorService = _viewDescriptorService;
        }
        getBackgroundColor(theme) {
            const terminalBackground = theme.getColor(terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR);
            if (terminalBackground) {
                return terminalBackground;
            }
            if (this._instance.target === terminal_1.TerminalLocation.Editor) {
                return theme.getColor(colorRegistry_1.editorBackground);
            }
            const location = this._viewDescriptorService.getViewLocationById(terminal_2.TERMINAL_VIEW_ID);
            if (location === 1 /* ViewContainerLocation.Panel */) {
                return theme.getColor(theme_1.PANEL_BACKGROUND);
            }
            return theme.getColor(theme_1.SIDE_BAR_BACKGROUND);
        }
    };
    exports.TerminalInstanceColorProvider = TerminalInstanceColorProvider;
    exports.TerminalInstanceColorProvider = TerminalInstanceColorProvider = __decorate([
        __param(1, views_1.IViewDescriptorService)
    ], TerminalInstanceColorProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxJbnN0YW5jZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbEluc3RhbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFnN0VoRywwQ0FxRUM7SUE3NUVELElBQVcsU0FXVjtJQVhELFdBQVcsU0FBUztRQUNuQjs7OztXQUlHO1FBQ0gscUZBQStCLENBQUE7UUFFL0Isd0RBQWdCLENBQUE7UUFDaEIsd0RBQWdCLENBQUE7UUFDaEIsZ0VBQXFCLENBQUE7SUFDdEIsQ0FBQyxFQVhVLFNBQVMsS0FBVCxTQUFTLFFBV25CO0lBRUQsSUFBSSxnQkFBMkQsQ0FBQztJQVloRSxNQUFNLG1DQUFtQyxHQUFHOzs7Ozs7S0FNM0MsQ0FBQztJQUVLLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsc0JBQVU7O2lCQUdoQyx1QkFBa0IsR0FBRyxDQUFDLEFBQUosQ0FBSztRQXVCdEMsSUFBSSxVQUFVLEtBQWtCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFvQzlELElBQUksNkJBQTZCLEtBQWMsT0FBTyxJQUFJLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDO1FBTzVGLElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRUQsSUFBSSxnQ0FBZ0MsS0FBdUQsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztRQUsxSixJQUFJLFVBQVUsS0FBc0MsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsdUJBQXVCLEVBQUUsVUFBVSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQy9KLElBQUksVUFBVSxDQUFDLEtBQXNDO1lBQ3BELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1FBQzVDLENBQUM7UUFFRCxJQUFJLE1BQU0sS0FBbUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNuRSxJQUFJLE1BQU0sQ0FBQyxLQUFtQztZQUM3QyxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNyQixJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxJQUFJLFVBQVUsS0FBYSxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ3JELElBQUksUUFBUSxLQUFVLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDOUMsSUFBSSxJQUFJO1lBQ1AsSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNuQyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDeEIsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLG1CQUFtQixJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDL0QsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQzdDLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQztnQkFDdEMsQ0FBQztnQkFDRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6RSxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFDRCxJQUFJLElBQUk7WUFDUCxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ25DLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUN4QixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsbUJBQW1CLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxDQUFDO2dCQUMvRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDN0MsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDO2dCQUN0QyxDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pFLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUNELElBQUksVUFBVSxLQUFjLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzVELElBQUksU0FBUyxLQUF5QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQy9ELElBQUksU0FBUyxLQUF5QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQy9ELElBQUksT0FBTyxLQUFhLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDNUMsSUFBSSxPQUFPLEtBQWEsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM1Qyw0REFBNEQ7UUFDNUQsSUFBSSxTQUFTLEtBQXlCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQ25GLG9EQUFvRDtRQUNwRCxzREFBc0Q7UUFDdEQsSUFBSSxZQUFZLEtBQW9CLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQ2xGLElBQUksaUJBQWlCLEtBQWMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLEVBQUUsaUJBQWlCLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFDeEosSUFBSSxzQkFBc0IsS0FBMEMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLEVBQUUsc0JBQXNCLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztRQUNyTSxJQUFJLGFBQWEsS0FBYyxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQzVELElBQUksaUJBQWlCLEtBQTJCLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUNqRixJQUFJLFFBQVEsS0FBeUIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUM3RCxJQUFJLFVBQVUsS0FBcUMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUM3RSxJQUFJLGNBQWMsS0FBYyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQzlELElBQUksbUJBQW1CLEtBQWMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDbkYsSUFBSSxpQkFBaUIsS0FBeUIsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBQy9FLElBQUksU0FBUyxLQUFvQyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzFFLElBQUksRUFBRSxLQUFrQyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6RSxJQUFJLFFBQVEsS0FBYyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDdEYsSUFBSSxlQUFlLEtBQXlCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQzFGLElBQUksUUFBUSxLQUFjLE9BQU8sR0FBRyxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkYsSUFBSSxLQUFLLEtBQWEsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMzQyxJQUFJLFdBQVcsS0FBdUIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUNqRSxJQUFJLElBQUksS0FBK0IsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hFLElBQUksS0FBSyxLQUF5QixPQUFPLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUQsSUFBSSxXQUFXLEtBQWEsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUN2RCxJQUFJLFFBQVEsS0FBeUIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUM3RCxJQUFJLFdBQVcsS0FBeUIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUNuRSxJQUFJLGVBQWUsS0FBbUMsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLElBQUksR0FBRyxLQUF5QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ25ELElBQUksVUFBVSxLQUF5QixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksV0FBVztZQUNkLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN2QixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDMUIsQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQztZQUNqRyxRQUFRLElBQUksRUFBRSxDQUFDO2dCQUNkLEtBQUssTUFBTSxDQUFDLENBQUMsT0FBTyxpQ0FBZSxDQUFDLFFBQVEsQ0FBQztnQkFDN0MsS0FBSyxPQUFPLENBQUMsQ0FBQyxPQUFPLGlDQUFlLENBQUMsU0FBUyxDQUFDO2dCQUMvQyxPQUFPLENBQUMsQ0FBQyxPQUFPLFNBQVMsQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztRQUNELElBQUksUUFBUSxLQUF5QixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzdELElBQUkscUJBQXFCLEtBQWEsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUMxRixJQUFJLFlBQVksS0FBMkIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQW1EdkUsWUFDa0IsNEJBQWlELEVBQ2pELDJCQUFpRCxFQUNqRCxhQUFtQyxFQUM1QyxrQkFBc0MsRUFDMUIsa0JBQXVELEVBQ3BELG9CQUEyQyxFQUNqQywrQkFBaUYsRUFDcEcsWUFBMkMsRUFDckMsa0JBQXVELEVBQ3JELG9CQUEyRCxFQUM1RCxtQkFBeUQsRUFDL0QsYUFBNkMsRUFDekMsaUJBQXFELEVBQ3pELGFBQTZDLEVBQ3JDLHFCQUE2RCxFQUMvRCxXQUFpRCxFQUNyRCxlQUFpRCxFQUMzQyxxQkFBNkQsRUFDbkUsZUFBaUQsRUFDOUMsa0JBQXVELEVBQzdDLDJCQUF5RCxFQUM3RCx3QkFBbUUsRUFDN0UsY0FBK0MsRUFDaEMsNkJBQTZFLEVBQzNGLGVBQWlELEVBQy9DLGlCQUFxRCxFQUN4RCxjQUErQyxFQUM5QyxlQUFpRCxFQUNyQywyQkFBeUUsRUFDOUUsc0JBQStEO1lBRXZGLEtBQUssRUFBRSxDQUFDO1lBL0JTLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBcUI7WUFDakQsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUFzQjtZQUNqRCxrQkFBYSxHQUFiLGFBQWEsQ0FBc0I7WUFDNUMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUNULHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFFekIsb0NBQStCLEdBQS9CLCtCQUErQixDQUFpQztZQUNuRixpQkFBWSxHQUFaLFlBQVksQ0FBYztZQUNwQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ3BDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDM0Msd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUM5QyxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUN4QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ3hDLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQ3BCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDOUMsZ0JBQVcsR0FBWCxXQUFXLENBQXFCO1lBQ3BDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUMxQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ2xELG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUM3Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBRWhDLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDNUQsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ2Ysa0NBQTZCLEdBQTdCLDZCQUE2QixDQUErQjtZQUMxRSxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDOUIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUN2QyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDN0Isb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ3BCLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFDN0QsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtZQTNPdkUsbUJBQWMsR0FBdUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUt4RSwwQkFBcUIsR0FBVyxDQUFDLENBQUM7WUFDbEMsMEJBQXFCLEdBQVcsQ0FBQyxDQUFDO1lBUWxDLFdBQU0sR0FBVyxFQUFFLENBQUM7WUFDcEIsaUJBQVksR0FBcUIsMkJBQWdCLENBQUMsT0FBTyxDQUFDO1lBVTFELFVBQUssR0FBVyxDQUFDLENBQUM7WUFDbEIsVUFBSyxHQUFXLENBQUMsQ0FBQztZQUdsQixTQUFJLEdBQXVCLFNBQVMsQ0FBQztZQUNyQyxnQkFBVyxHQUF1QixTQUFTLENBQUM7WUFDNUMsa0JBQWEsR0FBeUIsU0FBUyxDQUFDO1lBQ2hELDJCQUFzQixHQUFZLElBQUksQ0FBQztZQUV2QyxtQkFBYyxHQUFZLEtBQUssQ0FBQztZQUNoQyx1QkFBa0IsR0FBeUIsRUFBRSxDQUFDO1lBSTlDLDRCQUF1QixHQUFtQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBRWxHLGlCQUFZLEdBQW1DLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFJdkYsaUJBQVksR0FBVyxFQUFFLENBQUM7WUFRMUIsbUNBQThCLEdBQVksS0FBSyxDQUFDO1lBSy9DLGlCQUFZLEdBQUcsSUFBSSw0REFBa0MsRUFBRSxDQUFDO1lBVWpFLGtCQUFhLEdBQVksS0FBSyxDQUFDO1lBd0YvQiwyRkFBMkY7WUFDM0YscUJBQXFCO1lBQ0osWUFBTyxHQUFHLElBQUksZUFBTyxFQUE2QyxDQUFDO1lBQzNFLFdBQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUNwQixnQkFBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUN2RSxlQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFDNUIsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBcUIsQ0FBQyxDQUFDO1lBQzdFLHFCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFDeEMsNkJBQXdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDdkUsNEJBQXVCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQztZQUN0RCxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUMzRSxtQkFBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1lBQ3BDLG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBMkQsQ0FBQyxDQUFDO1lBQ2hILGtCQUFhLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7WUFDbEMsWUFBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO1lBQ3hELFdBQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUNwQixjQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7WUFDMUQsYUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO1lBQ3hCLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sQ0FBUztnQkFDakUscUJBQXFCLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFO2FBQ3BELENBQUMsQ0FBQyxDQUFDO1lBQ0ssZUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO1lBQzVCLDZCQUF3QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUNwRiw0QkFBdUIsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDO1lBQ3RELHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ25FLHdCQUFtQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFDOUMsZ0NBQTJCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDMUUsK0JBQTBCLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEtBQUssQ0FBQztZQUM1RCxnQkFBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUN2RSxlQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFDNUIsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDakUsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztZQUMxQyxlQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBcUIsQ0FBQyxDQUFDO1lBQ3RFLGNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQUMxQixvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUMzRSxtQkFBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1lBQ3BDLDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUNqRix5QkFBb0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBQ2hELGlDQUE0QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW1DLENBQUMsQ0FBQztZQUN0RyxnQ0FBMkIsR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsS0FBSyxDQUFDO1lBQzlELGtDQUE2QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVcsQ0FBQyxDQUFDO1lBQy9FLGlDQUE0QixHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxLQUFLLENBQUM7WUFDaEUsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDaEUscUJBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUN4Qyx1QkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFnQyxDQUFDLENBQUM7WUFDekYsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztZQUMxQyxtQkFBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO1lBQy9ELGtCQUFhLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7WUFzM0MzQywyQkFBc0IsR0FBd0IsU0FBUyxDQUFDO1lBbDFDL0QsSUFBSSxDQUFDLGVBQWUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRXZELElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMscUNBQXFCLENBQUMsQ0FBQyxDQUFDO1lBRWpHLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxFQUFFLENBQUM7WUFDaEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDeEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7WUFDN0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxrQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQ3pELElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBQzFCLElBQUksQ0FBQyxVQUFVLEdBQUcsa0JBQWtCLENBQUMsdUJBQXVCLEVBQUUsZUFBZSxFQUFFLElBQUksQ0FBQztZQUNwRixJQUFJLENBQUMsVUFBVSxHQUFHLGtCQUFrQixDQUFDLHVCQUF1QixFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUM7WUFFcEYsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFBLDRCQUFjLEVBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUU5RyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyx1QkFBdUIsRUFBRSxZQUFZLEVBQUUsQ0FBQztnQkFDbkUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDO1lBQ3JHLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyx1QkFBdUIsRUFBRSxpQkFBaUIsRUFBRSxDQUFDO2dCQUN4RSxJQUFJLENBQUMsa0JBQWtCLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLHVCQUF1QixDQUFDLGlCQUFpQixDQUFDO1lBQy9HLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDO1lBQ3JGLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxNQUFNLEdBQUcsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQztvQkFDekUsTUFBTSxFQUFFLGlCQUFPLENBQUMsSUFBSTtvQkFDcEIsSUFBSSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHO2lCQUNqQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUM7Z0JBQ2pDLElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ1osSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxTQUFTLENBQUM7Z0JBQy9GLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUM1QixNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztnQkFDakYsSUFBSSxDQUFDLGdCQUFnQixHQUFHLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsa0JBQWtCLENBQUMsc0JBQXNCLENBQUMsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUNwSixDQUFDO1lBRUQsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQUN0RyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsdUJBQXVCLENBQUM7WUFDeEQsSUFBSSxDQUFDLDJCQUEyQixHQUFHLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxJQUFJLHFDQUFpQixDQUN4RixDQUFDLCtCQUFrQixFQUFFLHVCQUF1QixDQUFDLENBQzdDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyx3QkFBd0IsR0FBRyx3Q0FBbUIsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDMUYsSUFBSSxDQUFDLHNCQUFzQixHQUFHLHdDQUFtQixDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3hHLElBQUksQ0FBQywwQkFBMEIsR0FBRyx3Q0FBbUIsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDbkcsSUFBSSxDQUFDLGtDQUFrQyxHQUFHLHdDQUFtQixDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUM5RyxJQUFJLENBQUMsMENBQTBDLEdBQUcsd0NBQW1CLENBQUMsK0JBQStCLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFFdEksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsc0NBQXNDLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUMxRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzNELElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxJQUFJLENBQUMsNENBQW9DLEVBQUUsQ0FBQztvQkFDM0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLHlDQUFpQyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFDMUUsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7d0JBQ2QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLDJCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNwRCxJQUFJLENBQUMsMkJBQTJCLENBQUMsY0FBYyxDQUFDLDZCQUFtQixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztvQkFDekgsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osQ0FBQztxQkFBTSxJQUFJLENBQUMsZ0RBQXdDLEVBQUUsQ0FBQztvQkFDdEQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsNkNBQXFDLENBQUM7b0JBQ3JGLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxFQUFFO3dCQUN4QyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDOzRCQUNqQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsY0FBYyxDQUFDLDJCQUFpQixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7d0JBQ3BILENBQUM7b0JBQ0YsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbkksMkZBQTJGO1lBQzNGLHVGQUF1RjtZQUN2RixrRkFBa0Y7WUFDbEYsd0ZBQXdGO1lBQ3hGLHVFQUF1RTtZQUN2RSxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN4RixJQUFJLENBQUMsK0JBQStCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxhQUFFLENBQUMsQ0FBQztZQUMvRSxDQUFDO1lBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxrQkFBa0IsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDO1lBRXpGLDJGQUEyRjtZQUMzRixtREFBbUQ7WUFDbkQsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLDJCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BFLENBQUM7WUFFRCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxjQUFjLENBQUMsdUNBQWtCLENBQUMsQ0FBQztZQUN0RixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUVwRCxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSx1QkFBZSwrQ0FBcUMsQ0FBQztZQUN2RixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksdUJBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQzlDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZDLHFEQUFxRDtnQkFDckQsTUFBTSxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBRXpDLHdGQUF3RjtnQkFDeEYsdUZBQXVGO2dCQUN2RixpQ0FBaUM7Z0JBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNsSixNQUFNLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3JELE1BQU0sY0FBYyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsK0JBQStCLENBQUMsaUJBQWlCLENBQUMsRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3JJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQztvQkFDeEQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDO29CQUNsRCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO3dCQUNyRCxtRUFBbUU7d0JBQ25FLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEtBQUssY0FBYyxDQUFDLElBQUksQ0FBQzt3QkFDcEQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssS0FBSyxjQUFjLENBQUMsS0FBSyxDQUFDO29CQUN2RCxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDO3dCQUNsRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUM7b0JBQ3JELENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFFNUIseUNBQXlDO2dCQUN6QyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUNwRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUM7b0JBQy9ELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ2pJLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO2dCQUVELElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNyQixNQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDNUIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNoQix3REFBd0Q7Z0JBQ3hELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ3RCLE1BQU0sR0FBRyxDQUFDO2dCQUNYLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBQyxDQUFDLEVBQUMsRUFBRTtnQkFDNUUsSUFBSSxDQUFDLENBQUMsb0JBQW9CLG1GQUEwQyxFQUFFLENBQUM7b0JBQ3RFLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25FLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLENBQUMsb0JBQW9CLENBQUMscUJBQXFCLENBQUMsRUFBRSxDQUFDO29CQUNuRCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3BCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO2dCQUNELE1BQU0sY0FBYyxHQUFhOzs7Ozs7O29CQU9oQyxtQkFBbUI7aUJBQ25CLENBQUM7Z0JBQ0YsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDM0QsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQztvQkFDbkMsTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3RCLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLENBQUMsb0JBQW9CLDZFQUFrQyxFQUFFLENBQUM7b0JBQzlELElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUM5QixDQUFDO2dCQUNELElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLDZCQUE2QixDQUFDLEVBQUUsQ0FBQztvQkFDM0QsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7Z0JBQ25DLENBQUM7Z0JBQ0QsSUFDQyxDQUFDLENBQUMsb0JBQW9CLHdFQUFpQztvQkFDdkQsQ0FBQyxDQUFDLG9CQUFvQixxRkFBMEM7b0JBQ2hFLENBQUMsQ0FBQyxvQkFBb0Isb0ZBQXVDLEVBQUUsQ0FBQztvQkFDaEUsSUFBSSxDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3pDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsMkJBQTJCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXpILHVGQUF1RjtZQUN2Rix5QkFBeUI7WUFDekIsSUFBSSx3QkFBd0IsR0FBdUIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDakcsd0JBQXdCLEdBQUcsU0FBUyxDQUFDO2dCQUNyQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsU0FBUyxDQUFDO1lBQ3JDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNWLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDaEMsSUFBSSx3QkFBd0IsRUFBRSxDQUFDO29CQUM5QixHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxZQUFZLENBQUMsd0JBQXdCLENBQUMsQ0FBQztnQkFDdkUsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSiwyQkFBMkI7WUFDM0IsTUFBTSxpQkFBaUIsR0FBRywrQ0FBMEIsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQ2hGLEtBQUssTUFBTSxJQUFJLElBQUksaUJBQWlCLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDdEMsSUFBQSwwQkFBaUIsRUFBQyxJQUFJLEtBQUssQ0FBQywyREFBMkQsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDbkcsU0FBUztnQkFDVixDQUFDO2dCQUNELElBQUksWUFBbUMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDO29CQUNKLFlBQVksR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUMzSCxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO2dCQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7b0JBQ2QsSUFBQSwwQkFBaUIsRUFBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEIsQ0FBQztnQkFDRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUNwQyxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xDLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUNwQixZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3ZCLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDcEMsa0ZBQWtGO29CQUNsRixJQUFJLFVBQVUsSUFBSSxZQUFZLEVBQUUsQ0FBQzt3QkFDaEMsT0FBTyxZQUFZLENBQUMsUUFBUSxDQUFDO29CQUM5QixDQUFDO29CQUNELElBQUksV0FBVyxJQUFJLFlBQVksRUFBRSxDQUFDO3dCQUNqQyxPQUFPLFlBQVksQ0FBQyxTQUFTLENBQUM7b0JBQy9CLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQztRQUVNLGVBQWUsQ0FBa0MsRUFBVTtZQUNqRSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBYSxDQUFDO1FBQ2hELENBQUM7UUFFTyxRQUFRO1lBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDakIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksa0NBQTBCO29CQUN2RSxDQUFDLENBQUMsSUFBQSw4QkFBZSxHQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLGdGQUFtQyxDQUFDO29CQUNuRyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ2QsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNuQixDQUFDO1FBRU8sU0FBUztZQUNoQixJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1lBQ3JDLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSx1QkFBdUIsRUFBRSxLQUFLLEVBQUUsQ0FBQztnQkFDNUQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDO1lBQzdELENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxrQ0FBMEIsRUFBRSxDQUFDO2dCQUNqRSxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVPLGVBQWU7WUFDdEIsZ0ZBQWdGO1lBQ2hGLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RCLHFDQUFxQztnQkFDckMsSUFBSSxDQUFDLEtBQUssaUNBQXdCLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxLQUFLLGlDQUF3QixDQUFDO2dCQUNuQyxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN2RixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVDLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFOUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRUQ7Ozs7O1dBS0c7UUFDSyxvQkFBb0IsQ0FBQyxLQUFhLEVBQUUsTUFBYztZQUN6RCwwQ0FBMEM7WUFDMUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDcEQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM1RyxNQUFNLEtBQUssR0FBRyxJQUFBLHdDQUF3QixFQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNoSCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQ2hDLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUM1RCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztnQkFDeEIsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7WUFDdEMsQ0FBQztZQUVELE9BQU8sU0FBUyxDQUFDLEtBQUssQ0FBQztRQUN4QixDQUFDO1FBRU8sd0JBQXdCO1lBQy9CLElBQUksa0JBQWdCLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLEtBQUssR0FBRyxrQkFBZ0IsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUM7Z0JBQzVELElBQUksQ0FBQyxLQUFLLEdBQUcsa0JBQWdCLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDO1lBQzdELENBQUM7UUFDRixDQUFDO1FBR08sNkJBQTZCO1lBQ3BDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN6QyxDQUFDO1FBRU8sYUFBYSxDQUFDLEtBQWEsRUFBRSxNQUFjO1lBQ2xELDBDQUEwQztZQUMxQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzVHLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNsRCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM5QixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyRyxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNyRyxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDbkcsa0JBQWdCLENBQUMsMEJBQTBCLEdBQUcsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUM5RCxJQUFJLENBQUMsR0FBRyxzQ0FBMkIsS0FBSyxHQUFHLGlCQUFpQixDQUFDLEVBQzdELE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUEsb0JBQW9CLEdBQUcsZUFBZSxDQUFDLENBQUM7WUFDeEksT0FBTyxrQkFBZ0IsQ0FBQywwQkFBMEIsQ0FBQztRQUNwRCxDQUFDO1FBRUQsSUFBSSxtQkFBbUIsS0FBeUIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztRQUNsRyxJQUFJLGFBQWEsS0FBYyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsYUFBYSxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLHNCQUFzQixJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbE4sTUFBTSxDQUFDLG1CQUFtQixDQUFDLGlCQUFxQyxFQUFFLGlCQUFxQztZQUM3RyxNQUFNLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxnQkFBZ0Isa0dBQTBDLGlCQUFpQixDQUFDLENBQUM7WUFDbEgsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN0QixPQUFPLGdCQUFnQixDQUFDO1lBQ3pCLENBQUM7WUFDRCxnQkFBZ0IsR0FBRyxnQkFBUSxDQUFDLGFBQWEsQ0FBdUIsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO2dCQUNqRixNQUFNLFFBQVEsR0FBRyxDQUFDLE1BQU0sSUFBQSwwQkFBbUIsRUFBZ0MsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO2dCQUNySCxtQkFBbUI7Z0JBQ25CLFFBQVEsQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMscUNBQXFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztnQkFDckcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLHlDQUF5QyxFQUFFLHlEQUF5RCxFQUFFLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLDZDQUE2QyxFQUFFLDZFQUE2RSxDQUFDLENBQUM7Z0JBQ3JVLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNuQixDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sZ0JBQWdCLENBQUM7UUFDekIsQ0FBQztRQUVEOztXQUVHO1FBQ08sS0FBSyxDQUFDLFlBQVk7WUFDM0IsTUFBTSxRQUFRLEdBQUcsTUFBTSxrQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDOUcsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3JCLE1BQU0sSUFBSSx5QkFBZ0IsQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1lBQzdFLENBQUM7WUFFRCxNQUFNLGdDQUFnQyxHQUFHLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsS0FBSyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUwsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGNBQWMsQ0FDNUQsNkJBQWEsRUFDYixRQUFRLEVBQ1IsSUFBSSxDQUFDLGFBQWEsRUFDbEIsSUFBSSxDQUFDLEtBQUssRUFDVixJQUFJLENBQUMsS0FBSyxFQUNWLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxjQUFjLENBQUMsNkJBQTZCLEVBQUUsSUFBSSxDQUFDLEVBQ3BGLElBQUksQ0FBQyxZQUFZLEVBQ2pCLElBQUksQ0FBQyxlQUFlLENBQUMscUJBQXFCLEVBQzFDLGdDQUFnQyxDQUNoQyxDQUFDO1lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDckMsSUFBSSxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ2xCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDckMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUQsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM5RCxvRkFBb0Y7WUFDcEYsMkNBQTJDO1lBQzNDLE1BQU0seUJBQXlCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxPQUFPLENBQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUM3SSxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7WUFDN0Ysa0JBQWtCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsa0JBQWtCLENBQUM7WUFDOUMsc0ZBQXNGO1lBQ3RGLDBCQUEwQjtZQUMxQixJQUFBLHlCQUFpQixFQUFDLEdBQUcsRUFBRTtnQkFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUU7b0JBQ3BDLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEscUVBQThCLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsaUZBQW9DLEVBQUUsQ0FBQzt3QkFDbEosSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7NEJBQ25CLEVBQUUsa0NBQXFCOzRCQUN2QixRQUFRLEVBQUUsdUJBQVEsQ0FBQyxPQUFPOzRCQUMxQixJQUFJLEVBQUUsa0JBQU8sQ0FBQyxJQUFJOzRCQUNsQixPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDO3lCQUMzQyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUM1QyxDQUFDO29CQUNELElBQUksQ0FBQywyQkFBMkIsQ0FBQyxVQUFVLENBQUMsZ0RBQW1CLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQy9FLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTFGLElBQUksQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFDLElBQUksRUFBQyxFQUFFO2dCQUM1QyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN2QyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRixpRkFBaUY7WUFDakYsd0JBQXdCO1lBQ3hCLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsRUFBRTtnQkFDM0QsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUM3QixrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRSxDQUFDO2dCQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxhQUFhLENBQUMsVUFBVSxDQUFDO1lBQ3pELENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFekYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7Z0JBQzVFLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssMkJBQWdCLENBQUMsRUFBRSxDQUFDO29CQUNoRCxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2pCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosb0ZBQW9GO1lBQ3BGLCtDQUErQztZQUMvQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLHlDQUFpQyxFQUFFLENBQUM7Z0JBQzdELElBQUksYUFBYSxHQUE0QixLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDaEUsTUFBTSxLQUFLLEdBQUcsSUFBSSxxQ0FBcUIsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3BELElBQUksS0FBSyxDQUFDLE1BQU0sdUJBQWUsRUFBRSxDQUFDO3dCQUNqQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDMUIsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQzNELElBQUksQ0FBQyw0Q0FBb0MsRUFBRSxDQUFDO3dCQUMzQyxhQUFhLEVBQUUsT0FBTyxFQUFFLENBQUM7d0JBQ3pCLGFBQWEsR0FBRyxTQUFTLENBQUM7b0JBQzNCLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDNUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNkLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTyxLQUFLLENBQUMsZ0JBQWdCO1lBQzdCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLElBQUksTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUM7WUFDMUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG1CQUFvQixDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsV0FBbUIsRUFBRSxhQUFzQjtZQUMzRCxJQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyw2Q0FBcUMsQ0FBQztZQUVsRix5REFBeUQ7WUFDekQsSUFBSSxDQUFDLGdCQUFnQixJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLHVDQUErQixJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxtQ0FBMkIsQ0FBQyxFQUFFLENBQUM7Z0JBQzdKLE1BQU0sS0FBSyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO2dCQUNwQyxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUM7b0JBQ2xCLElBQUksT0FBTyxDQUFPLENBQUMsQ0FBQyxFQUFFO3dCQUNyQixLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEVBQUU7NEJBQ3RELElBQUksQ0FBQyxnREFBd0MsRUFBRSxDQUFDO2dDQUMvQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsNkNBQXFDLENBQUM7Z0NBQzlFLENBQUMsRUFBRSxDQUFDOzRCQUNMLENBQUM7d0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDTCxDQUFDLENBQUM7b0JBQ0YsSUFBQSxlQUFPLEVBQUMsSUFBSSxDQUFDO2lCQUNiLENBQUMsQ0FBQztnQkFDSCxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakIsQ0FBQztZQUVELHdGQUF3RjtZQUN4Rix1RkFBdUY7WUFDdkYsb0NBQW9DO1lBQ3BDLElBQUksZ0JBQWdCLEVBQUUsUUFBUSxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUMxQyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNuQyw0RkFBNEY7Z0JBQzVGLHFCQUFxQjtnQkFDckIsTUFBTSxJQUFBLGVBQU8sRUFBQyxHQUFHLENBQUMsQ0FBQztZQUNwQixDQUFDO1lBQ0QsNkRBQTZEO1lBQzdELE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsYUFBYSxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBdUIsRUFBRSxVQUFtQyxFQUFFLEtBQWM7WUFDM0YsT0FBTyxJQUFJLENBQUMsMkJBQTJCLENBQUMsY0FBYyxDQUNyRCxtREFBc0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLDJCQUEyQixFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUN2RixDQUFDO1FBQ0gsQ0FBQztRQUVELGlCQUFpQjtZQUNoQixJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1FBQzdCLENBQUM7UUFFRCxlQUFlLENBQUMsU0FBc0I7WUFDckMsMkNBQTJDO1lBQzNDLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDbkMsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRTNCLGtDQUFrQztZQUNsQyxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7WUFFbEQsc0ZBQXNGO1lBQ3RGLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBRUQsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUV0QixVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVEOzs7O1dBSUc7UUFDSyxLQUFLO1lBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzNDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN0RCxNQUFNLElBQUksS0FBSyxDQUFDLDBHQUEwRyxDQUFDLENBQUM7WUFDN0gsQ0FBQztZQUVELE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFL0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRWxELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFFekIscUVBQXFFO1lBQ3JFLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7WUFFdkMsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUUxRCxzQ0FBc0M7WUFDdEMsS0FBSyxNQUFNLFlBQVksSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2pCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDeEUsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO2dCQUM1RCxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDbkIsSUFBSSxDQUFDLDhCQUE4QixFQUFFLENBQUM7Z0JBQ3ZDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsMENBQTBDLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3pELENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDL0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO1lBQ3RELENBQUM7WUFFRCxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFN0QsS0FBSyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLEtBQW9CLEVBQVcsRUFBRTtnQkFDdkUsK0NBQStDO2dCQUMvQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDckIsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztnQkFFRCxNQUFNLHFCQUFxQixHQUFHLElBQUkscUNBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMscUJBQXFCLEVBQUUscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRWhILGtGQUFrRjtnQkFDbEYsZ0ZBQWdGO2dCQUNoRixzQkFBc0I7Z0JBQ3RCLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxJQUFJLHdDQUFnQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsR0FBRyxLQUFLLFFBQVEsQ0FBQztnQkFDM0ksSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsV0FBVyxJQUFJLFlBQVksRUFBRSxDQUFDO29CQUN6RCxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3ZCLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBRUQsTUFBTSwrQkFBK0IsR0FBRyw4Q0FBOEMsQ0FBQztnQkFDdkYsTUFBTSxhQUFhLEdBQUcsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFeEosK0RBQStEO2dCQUMvRCxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLCtCQUErQixxQ0FBNEIsSUFBSSxDQUFDO29CQUNuRyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztvQkFDbEMsQ0FBQyxLQUFLLENBQUMsT0FBTztvQkFDZCxDQUFDLEtBQUssQ0FBQyxRQUFRO29CQUNmLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNoQixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztnQkFDMUIsQ0FBQztnQkFFRCx5REFBeUQ7Z0JBQ3pELDBFQUEwRTtnQkFDMUUsSUFBSSxhQUFhLENBQUMsSUFBSSwrQkFBdUIsSUFBSSxhQUFhLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssYUFBYSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztvQkFDdE0sZ0RBQWdEO29CQUNoRCxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLCtCQUErQixxQ0FBNEIsSUFBSSxDQUFDO3dCQUNuRyxJQUFJLENBQUMsWUFBWTt3QkFDakIsQ0FBQyxxQ0FBMEIsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7d0JBQ2hFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQy9CLHVCQUFRLENBQUMsSUFBSSxFQUNiLEdBQUcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsc0ZBQXNGLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsRUFDeko7NEJBQ0M7Z0NBQ0MsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsMkJBQTJCLEVBQUUsNkJBQTZCLENBQUM7Z0NBQy9FLEdBQUcsRUFBRSxHQUFHLEVBQUU7b0NBQ1QsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8scUZBQXFDLElBQUksMkZBQXdDLElBQUkscUVBQTZCLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0NBQ2xNLENBQUM7NkJBQ2dCO3lCQUNsQixDQUNELENBQUM7d0JBQ0YsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsK0JBQStCLEVBQUUsS0FBSyxnRUFBK0MsQ0FBQztvQkFDbEgsQ0FBQztvQkFDRCxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3ZCLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBRUQsK0VBQStFO2dCQUMvRSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLGNBQWMsSUFBSSxDQUFDLHNCQUFXLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUM5RSxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUVELDZEQUE2RDtnQkFDN0QsSUFBSSxtQkFBUSxDQUFDLGVBQWUsRUFBRSxJQUFJLEtBQUssQ0FBQyxHQUFHLEtBQUssS0FBSyxFQUFFLENBQUM7b0JBQ3ZELE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBRUQsdUZBQXVGO2dCQUN2Rix1RUFBdUU7Z0JBQ3ZFLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxLQUFLLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUMzQyxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3ZCLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsb0ZBQW9GO2dCQUNwRixTQUFTO2dCQUNULElBQUksb0JBQVMsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN2RSxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUVELG9FQUFvRTtnQkFDcEUsK0JBQStCO2dCQUMvQixJQUFJLENBQUMseUJBQWUsQ0FBQyxTQUFTLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDL0UsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztnQkFFRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRTtnQkFDN0Usb0ZBQW9GO2dCQUNwRix1REFBdUQ7Z0JBQ3ZELE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQVEsQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRTtvQkFDNUYsNEVBQTRFO29CQUM1RSw2Q0FBNkM7b0JBQzdDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDeEQsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwQixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO2dCQUM5RSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ25CLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSiw4RUFBOEU7WUFDOUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDekUsb0VBQW9FO2dCQUNwRSwyQkFBMkI7Z0JBQzNCLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6RCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25HLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdkcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUV2QyxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUVuRCxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFDRCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFcEIseUZBQXlGO1lBQ3pGLHlCQUF5QjtZQUN6QixJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNwQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25ELENBQUM7UUFDRixDQUFDO1FBRU8sU0FBUyxDQUFDLE9BQWlCO1lBQ2xDLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLDhCQUE4QixFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzNCLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1lBQ3BDLENBQUM7UUFDRixDQUFDO1FBRU8sOEJBQThCO1lBQ3JDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsMENBQTBDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsTUFBTSwwQ0FBa0MsQ0FBQyxDQUFDO1lBQzNILENBQUM7UUFDRixDQUFDO1FBRUQsb0JBQW9CO1lBQ25CLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsMENBQTBDLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDekQsQ0FBQztRQUVPLGdCQUFnQixDQUFDLFNBQXNCO1lBQzlDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGNBQWMsQ0FBQyxxQ0FBcUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3hJLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0UsYUFBYSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUMsSUFBSSxFQUFDLEVBQUU7Z0JBQ3JDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDYixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ2pGLENBQUM7UUFFRCxZQUFZO1lBQ1gsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQzNELENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQWdCLEVBQUUsT0FBMEI7WUFDL0QsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUM7WUFDNUMsTUFBTSxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsSUFBSSxTQUFTO1lBQ1osT0FBTyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUN0RixDQUFDO1FBRUQsY0FBYztZQUNiLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ2xDLENBQUM7UUFFTywyQkFBMkI7WUFDbEMsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDakksQ0FBQztRQUVRLE9BQU8sQ0FBQyxNQUEyQjtZQUMzQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDckIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyx5Q0FBeUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDcEYsSUFBQSxtQkFBTyxFQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUU3QixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1lBQ3hDLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxTQUFTLENBQUM7WUFDdkMsQ0FBQztZQUVELElBQUksQ0FBQztnQkFDSixJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ3ZCLENBQUM7WUFBQyxPQUFPLEdBQVksRUFBRSxDQUFDO2dCQUN2Qix3REFBd0Q7Z0JBQ3hELElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3pFLENBQUM7WUFFRCx3RkFBd0Y7WUFDeEYsNEVBQTRFO1lBQzVFLHdEQUF3RDtZQUN4RCxJQUFJLG1CQUFTLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMzQyxJQUFJLENBQUMsMkJBQTJCLEdBQUcsU0FBUyxDQUFDO1lBQzlDLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxJQUFJLDZCQUFrQixDQUFDLE9BQU8sQ0FBQztZQUN6RCxDQUFDO1lBRUQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMvQiwyRkFBMkY7WUFDM0Ysc0JBQXNCO1lBQ3RCLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFL0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFNUIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxLQUFLLENBQUMsdUJBQXVCLENBQUMsTUFBMEI7WUFDdkQseUZBQXlGO1lBQ3pGLHVGQUF1RjtZQUN2RixNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsaUJBQWlCLENBQUMsTUFBTSxLQUFLLDZCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEIsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFlO1lBQ3BCLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1lBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2pCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUMsWUFBWSxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDaEUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNoQyxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBZTtZQUNuQyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztZQUM5QixNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQixDQUFDO1FBRUQsS0FBSyxDQUFDLEtBQUs7WUFDVixNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWM7WUFDbkIsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQWE7WUFDakMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDakIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDeEIsTUFBTSxlQUFlLEdBQUcsTUFBTSxJQUFJLENBQUMsMkJBQTJCLENBQUMsY0FBYyxDQUFDLDJDQUF1QixFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUM5SixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3RCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxPQUFPLGVBQWUsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDekMsV0FBVyxHQUFHLGVBQWUsQ0FBQyxZQUFZLENBQUM7WUFDNUMsQ0FBQztZQUVELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFZLEVBQUUsYUFBc0IsRUFBRSxrQkFBNEI7WUFDaEYsMEZBQTBGO1lBQzFGLGlGQUFpRjtZQUNqRixJQUFJLGtCQUFrQixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUNwRSxJQUFJLEdBQUcsWUFBWSxJQUFJLFdBQVcsQ0FBQztZQUNwQyxDQUFDO1lBRUQsMkNBQTJDO1lBQzNDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNwQyxJQUFJLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDM0MsSUFBSSxJQUFJLElBQUksQ0FBQztZQUNkLENBQUM7WUFFRCx5QkFBeUI7WUFDekIsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDO1lBQzdCLElBQUksYUFBYSxFQUFFLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMvQixDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBMEIsRUFBRSxhQUFzQjtZQUNoRSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUVELEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxZQUEwQjtZQUNuRCxrQ0FBa0M7WUFDbEMsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ3hCLE9BQU8sSUFBQSx5Q0FBbUIsRUFBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNoSyxDQUFDO1FBRUQsVUFBVSxDQUFDLE9BQWdCO1lBQzFCLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDO1lBQzFCLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDekQsSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2Isd0ZBQXdGO2dCQUN4Rix1RkFBdUY7Z0JBQ3ZGLGdEQUFnRDtnQkFDaEQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNmLHNGQUFzRjtnQkFDdEYsd0ZBQXdGO2dCQUN4RixvRkFBb0Y7Z0JBQ3BGLDBEQUEwRDtnQkFDMUQscUZBQXFGO2dCQUNyRixrQkFBa0I7Z0JBQ2xCLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBTSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pELENBQUM7UUFDRixDQUFDO1FBRUQsY0FBYztZQUNiLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFLENBQUM7UUFDOUIsQ0FBQztRQUVELGNBQWM7WUFDYixJQUFJLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFFRCxjQUFjO1lBQ2IsSUFBSSxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQztRQUM5QixDQUFDO1FBRUQsWUFBWTtZQUNYLElBQUksQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLENBQUM7UUFDNUIsQ0FBQztRQUVELFlBQVk7WUFDWCxJQUFJLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxDQUFDO1FBQzVCLENBQUM7UUFFRCxXQUFXO1lBQ1YsSUFBSSxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRUQsV0FBVztZQUNWLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkMsSUFBSSxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRU8sMkJBQTJCO1lBQ2xDLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLDJCQUFnQixDQUFDLENBQUM7WUFDNUUsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDO1lBQzNCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDO1lBQ2hELElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osY0FBYyxHQUFHLE1BQU0sWUFBWSx5Q0FBbUIsQ0FBQztZQUN4RCxDQUFDO1lBQ0QsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsSUFBSSxjQUFjLENBQUMsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUMxRixDQUFDO1FBRVMscUJBQXFCO1lBQzlCLElBQUksdUJBQXdGLENBQUM7WUFDN0YsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLEVBQUUsOEJBQThCLEVBQUUsQ0FBQztnQkFDcEYsdUJBQXVCLEdBQUcsSUFBQSxxRUFBeUMsRUFBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUNwSixDQUFDO1lBQ0QsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGNBQWMsQ0FDckUsK0NBQXNCLEVBQ3RCLElBQUksQ0FBQyxXQUFXLEVBQ2hCLElBQUksQ0FBQyxhQUFhLEVBQ2xCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQzNCLHVCQUF1QixFQUN2QixJQUFJLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLEVBQUUscUJBQXFCLENBQ3JFLENBQUM7WUFDRixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDbkQsY0FBYyxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3pDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzlDLG1GQUFtRjtnQkFDbkYsc0NBQXNDO2dCQUN0QyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUMxQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGNBQWMsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztvQkFDakksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO3dCQUN2RCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFlBQVksS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDO3dCQUNsRixJQUFJLFVBQVUsRUFBRSxDQUFDOzRCQUNoQixJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7NEJBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQzs0QkFDbEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ2pDLENBQUM7b0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDTCxDQUFDO2dCQUNELElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDO29CQUNsQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsMkJBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BFLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxnRkFBZ0Y7b0JBQ2hGLDZFQUE2RTtvQkFDN0UsVUFBVSxDQUFDLEdBQUcsRUFBRTt3QkFDZixJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFOzRCQUNwQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUMzRixDQUFDLENBQUMsQ0FBQztvQkFDSixDQUFDLENBQUMsQ0FBQztvQkFDSCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsMkJBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzlFLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUNILGNBQWMsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDeEUsY0FBYyxDQUFDLG1CQUFtQixDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtnQkFDdEQsUUFBUSxJQUFJLEVBQUUsQ0FBQztvQkFDZDt3QkFDQyxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQzt3QkFDbEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ3hDLE1BQU07b0JBQ1A7d0JBQ0MsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7d0JBQ3pCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQzt3QkFDN0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLDJCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNwRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQzt3QkFDbkcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO3dCQUNuRSxNQUFNO29CQUNQO3dCQUNDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUUsRUFBRSwyQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDdEQsTUFBTTtvQkFDUDt3QkFDQyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUN4QyxNQUFNO29CQUNQO3dCQUNDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDMUMsTUFBTTtvQkFDUDt3QkFDQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUN6QixNQUFNO29CQUNQO3dCQUNDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQy9DLE1BQU07b0JBQ1A7d0JBQ0MsSUFBSSxDQUFDLDhCQUE4QixHQUFHLElBQUksQ0FBQzt3QkFDM0MsTUFBTTtnQkFDUixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxjQUFjLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUNqQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxDQUFDO1lBQ0gsY0FBYyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ25GLGNBQWMsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLGNBQWMsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFO2dCQUNuQyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7Z0JBQzVDLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7b0JBQ25CLEVBQUUsa0RBQTZCO29CQUMvQixRQUFRLEVBQUUsdUJBQVEsQ0FBQyxLQUFLO29CQUN4QixJQUFJLEVBQUUsa0JBQU8sQ0FBQyxlQUFlO29CQUM3QixPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSw0QkFBNEIsQ0FBQztpQkFDdkUsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFDSCxjQUFjLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRTtnQkFDbEMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2hCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO2dCQUM3QyxDQUFDO2dCQUNELElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxrREFBNkIsQ0FBQztZQUNyRCxDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sY0FBYyxDQUFDO1FBQ3ZCLENBQUM7UUFFTyxLQUFLLENBQUMsY0FBYztZQUMzQixJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDckIsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsMEJBQTBCLENBQUMsaUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3RixJQUFJLHNCQUFzQixFQUFFLENBQUM7Z0JBQzVCLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNwQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG1DQUFtQyxFQUFFLDREQUE0RCxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNuSixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDeEUsNkVBQTZFO2dCQUM3RSxJQUFJLENBQUMsY0FBYyxDQUFDO29CQUNuQixPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQ0FBc0MsRUFBRSwwRkFBMEYsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7aUJBQ3BMLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCw0RkFBNEY7WUFDNUYsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzdELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLGtDQUF5QixFQUFFLElBQUksQ0FBQyxLQUFLLGtDQUF5QixDQUFDLENBQUM7WUFDbEcsQ0FBQztZQUNELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUM7WUFDakQsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLEtBQUssa0NBQXlCLEVBQUUsSUFBSSxDQUFDLEtBQUssa0NBQXlCLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ3pKLElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ1osSUFBSSxTQUFTLElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ3pCLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzdCLENBQUM7eUJBQU0sSUFBSSxjQUFjLElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ3JDLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQztvQkFDMUMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNqRSxDQUFDO1lBQ0QsSUFBSSxZQUFZLEtBQUssSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2xGLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLHVCQUF1QixFQUFFLElBQUksSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDO2dCQUNuRyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDcEUsQ0FBQztRQUNGLENBQUM7UUFFTSxjQUFjLENBQUMsTUFBZTtZQUNwQyxPQUFPLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRU0sZUFBZSxDQUFDLFVBQTJCO1lBQ2pELElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxnREFBd0MsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQUVNLFlBQVksQ0FBQyxXQUFtQixFQUFFLFNBQWtCLEVBQUUsU0FBbUI7WUFDL0UsSUFBSSxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMscUJBQXFCLENBQUMsV0FBVyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBRU0sS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQVksRUFBRSxPQUFlO1lBQzdELE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRU8sY0FBYyxDQUFDLEVBQXFCO1lBQzNDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNwQixFQUFFLENBQUMsWUFBWSxHQUFHLElBQUksT0FBTyxDQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNGLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxFQUFxQixFQUFFLEVBQWU7WUFDL0QsTUFBTSxTQUFTLEdBQUcsRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUM7WUFDL0MsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUNuQyxJQUFJLENBQUMscUJBQXFCLEdBQUcsU0FBUyxDQUFDO2dCQUN2QyxJQUFJLENBQUMsZUFBZSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzFELEVBQUUsRUFBRSxFQUFFLENBQUM7WUFDUixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRDs7Ozs7V0FLRztRQUNLLEtBQUssQ0FBQyxjQUFjLENBQUMsZUFBK0M7WUFDM0UsMkRBQTJEO1lBQzNELElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sZ0JBQWdCLEdBQUcsZUFBZSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRXZJLElBQUksSUFBSSxDQUFDLDhCQUE4QixJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSw0Q0FBb0MsSUFBSSxnQkFBZ0IsRUFBRSxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xKLElBQUksQ0FBQyxxQ0FBcUMsQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDdEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ25DLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFFdkIsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFFN0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxnQkFBZ0IsRUFBRSxJQUFJLENBQUM7WUFDeEMsTUFBTSxXQUFXLEdBQUcsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDO1lBRTlDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRTFKLHFFQUFxRTtZQUNyRSwyREFBMkQ7WUFDM0QsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUNuQyxJQUFJLFVBQVUsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksc0NBQThCLEVBQUUsQ0FBQztnQkFDbkYsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDcEMsSUFBSSxXQUFXLEVBQUUsQ0FBQzt3QkFDakIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBQSwwQ0FBd0IsRUFBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUN4RCxDQUFDO29CQUNELFFBQVEsT0FBTyxVQUFVLEVBQUUsQ0FBQzt3QkFDM0IsS0FBSyxRQUFROzRCQUNaLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUEsMENBQXdCLEVBQUMsVUFBVSxFQUFFLEVBQUUscUJBQXFCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDOzRCQUN2RixNQUFNO3dCQUNQLEtBQUssVUFBVTs0QkFDZCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7Z0NBQ2pDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUEsMENBQXdCLEVBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLHFCQUFxQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDdkcsQ0FBQzs0QkFDRCxNQUFNO29CQUNSLENBQUM7b0JBQ0QsNEVBQTRFO29CQUM1RSxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO29CQUN0QyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ3hCLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ25ELENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQyw2QkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDekMsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDakIsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksNENBQW9DLENBQUM7b0JBQ2pHLElBQUksa0JBQWtCLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7d0JBQ25FLDhCQUE4Qjt3QkFDOUIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQzs0QkFDaEMsT0FBTyxFQUFFLFdBQVc7NEJBQ3BCLFFBQVEsRUFBRSx1QkFBUSxDQUFDLEtBQUs7NEJBQ3hCLE9BQU8sRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxjQUFjLENBQUMsMENBQXdCLENBQUMsQ0FBQyxFQUFFO3lCQUNqRyxDQUFDLENBQUM7b0JBQ0osQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLCtFQUErRTt3QkFDL0UsV0FBVzt3QkFDWCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDcEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELDJGQUEyRjtZQUMzRixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUVuQyx1RUFBdUU7WUFDdkUsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDeEIsQ0FBQztRQUNGLENBQUM7UUFFTyxxQ0FBcUMsQ0FBQyxXQUErQjtZQUM1RSxJQUFJLENBQUMsa0JBQWtCLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1lBQ3RELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztnQkFDbkIsRUFBRSwyRkFBZ0Q7Z0JBQ2xELFFBQVEsRUFBRSx1QkFBUSxDQUFDLE9BQU87Z0JBQzFCLElBQUksRUFBRSxrQkFBTyxDQUFDLE9BQU87Z0JBQ3JCLE9BQU8sRUFBRSxDQUFDLEdBQUcsV0FBVyxHQUFHLElBQUksRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQywyQ0FBMkMsRUFBRSwwREFBMEQsQ0FBQztnQkFDMUosWUFBWSxFQUFFLENBQUM7d0JBQ2QsU0FBUyx5RkFBNkM7d0JBQ3RELEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLG9DQUFvQyxDQUFDO3dCQUN2RixHQUFHLEVBQUUsR0FBRyxFQUFFOzRCQUNULElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGtGQUFrRixDQUFDLENBQUM7d0JBQzlHLENBQUM7cUJBQ0QsRUFBRTt3QkFDRixTQUFTLEVBQUUsK0JBQStCO3dCQUMxQyxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywrQkFBK0IsRUFBRSxvQkFBb0IsQ0FBQzt3QkFDMUUsR0FBRyxFQUFFLEdBQUcsRUFBRTs0QkFDVCxJQUFJLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQywrQkFBK0IsRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO3dCQUN0SCxDQUFDO3FCQUNELENBQUM7YUFDRixDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFnSCw2Q0FBNkMsQ0FBQyxDQUFDO1FBQ2pNLENBQUM7UUFFRDs7V0FFRztRQUNLLGVBQWU7WUFDdEIsSUFBSSxJQUFJLENBQUMscUJBQXFCLEtBQUssSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQy9ELE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLENBQUM7WUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUM7WUFDaEIsT0FBTyxJQUFJLE9BQU8sQ0FBTyxDQUFDLENBQUMsRUFBRTtnQkFDNUIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO29CQUNoRixJQUFJLElBQUksQ0FBQyxxQkFBcUIsS0FBSyxJQUFJLENBQUMscUJBQXFCLElBQUksRUFBRSxPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ2xGLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDbkIsQ0FBQyxFQUFFLENBQUM7b0JBQ0wsQ0FBQztnQkFDRixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDUixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxpQ0FBaUMsQ0FBQyxLQUFvQjtZQUM3RCxJQUFJLEtBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztnQkFDekQsSUFBSSxDQUFDLDJCQUEyQixHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxDQUFDLEtBQW9CLEVBQUUsRUFBRTtvQkFDakgsSUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQzt3QkFDdEMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUMzQyxJQUFJLENBQUMsMkJBQTJCLEdBQUcsU0FBUyxDQUFDO3dCQUM3QyxJQUFJLENBQUMsT0FBTyxDQUFDLDZCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUN6QyxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3hCLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQztRQUVPLGlCQUFpQixDQUFDLEtBQW9CLEVBQUUsUUFBcUI7WUFDcEUsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDMUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDYixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsS0FBSyxRQUFRO2dCQUNuRSxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVc7Z0JBQ3JDLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQztZQUM3QyxJQUFJLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDN0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3pELEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDakMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUF5QixFQUFFLFFBQWlCLEtBQUs7WUFDcEUsNENBQTRDO1lBQzVDLElBQUksQ0FBQywyQkFBMkIsRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUM1QyxJQUFJLENBQUMsMkJBQTJCLEdBQUcsU0FBUyxDQUFDO1lBRTdDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDekIsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ1osMkRBQTJEO29CQUMzRCxNQUFNLElBQUksT0FBTyxDQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELENBQUM7Z0JBRUQsaUNBQWlDO2dCQUNqQyxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDdkIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO29CQUN4RCxNQUFNLElBQUksT0FBTyxDQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxDQUFDO2dCQUVELDRCQUE0QjtnQkFDNUIsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDM0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztvQkFDdkMsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7Z0JBQ3pCLENBQUM7Z0JBQ0QsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDWCxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDMUIsQ0FBQztZQUNGLENBQUM7WUFFRCxtREFBbUQ7WUFDbkQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLHVEQUErQixDQUFDO1lBRXRELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWiw2RUFBNkU7Z0JBQzdFLDJGQUEyRjtnQkFDM0YsK0ZBQStGO2dCQUMvRixtQkFBbUI7Z0JBQ25CLEtBQUssQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDO1lBQ3pCLENBQUM7WUFFRCxrQ0FBa0M7WUFDbEMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxDQUFDLCtDQUErQztZQUNoRixNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsS0FBSyxrQ0FBeUIsRUFBRSxJQUFJLENBQUMsS0FBSyxrQ0FBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQzNKLElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ1osSUFBSSxTQUFTLElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ3pCLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzdCLENBQUM7eUJBQU0sSUFBSSxjQUFjLElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ3JDLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQztvQkFDMUMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBR0QsUUFBUTtZQUNQLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFTyxjQUFjLENBQUMsS0FBYTtZQUNuQyxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSwyQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsRCxDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxNQUFNO1lBQ25CLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxxQkFBcUIsQ0FDckU7Z0JBQ0MsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUUscURBQXFELENBQUM7YUFDckcsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDO1FBQ2YsQ0FBQztRQUVPLEtBQUssQ0FBQyxrQkFBa0I7WUFDL0IsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0QyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLCtFQUFtQyxFQUFFLENBQUM7Z0JBQzVFLElBQUksSUFBSSxDQUFDLHNCQUFzQixLQUFLLEtBQUssRUFBRSxDQUFDO29CQUMzQyxPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQztvQkFDekIsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzVCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUdELHVCQUF1QixDQUFDLEtBQWM7WUFDckMsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQy9DLE1BQU0sSUFBSSxLQUFLLENBQUMsd0RBQXdELENBQUMsQ0FBQztZQUMzRSxDQUFDO1lBQ0QsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEtBQUssQ0FBQztZQUNwQyxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsU0FBUyxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUdhLEFBQU4sS0FBSyxDQUFDLGlCQUFpQjtZQUM5QixJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQ3ZFLE9BQU87WUFDUixDQUFDO1lBQ0QsdUVBQXVFO1lBQ3ZFLElBQUksQ0FBQztnQkFDSixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IscUNBQXlCLENBQUM7Z0JBQ2pFLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQzdCLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQy9DLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxDQUFVLEVBQUUsQ0FBQztnQkFDckIsdURBQXVEO2dCQUN2RCxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksQ0FBQyxDQUFDLE9BQU8sS0FBSyxpREFBaUQsRUFBRSxDQUFDO29CQUMzRixPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsTUFBTSxDQUFDLENBQUM7WUFDVCxDQUFDO1FBQ0YsQ0FBQztRQUVELFlBQVk7WUFDWCxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUM1RSxJQUFJLENBQUMsMENBQTBDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQy9GLENBQUM7UUFFTyxLQUFLLENBQUMscUJBQXFCO1lBQ2xDLElBQUksQ0FBQyxlQUFlLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDbEYsQ0FBQztRQUVELDBCQUEwQjtZQUN6QixJQUFJLENBQUMsS0FBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFDakcsQ0FBQztRQUVPLHVCQUF1QixDQUFDLFFBQWtCO1lBQ2pELE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hHLElBQUksQ0FBQyxxQkFBcUIsR0FBRyx5Q0FBOEIsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUU7Z0JBQ25GLE9BQU8sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ2xELENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQixDQUFDO1FBRUQsTUFBTSxDQUFDLFNBQXdCO1lBQzlCLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxTQUFTLENBQUM7WUFDdkMsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBRUQsMEZBQTBGO1lBQzFGLG1CQUFtQjtZQUNuQixJQUFJLFNBQVMsQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ25ELE9BQU87WUFDUixDQUFDO1lBRUQsa0VBQWtFO1lBQ2xFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3BCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWYsZ0NBQWdDO1lBQ2hDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUVuQywyQkFBMkI7WUFDM0IsS0FBSyxNQUFNLFlBQVksSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2pCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDOUMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBR2EsQUFBTixLQUFLLENBQUMsT0FBTztZQUNwQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFFTyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQWtCO1lBQzFDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDckIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztZQUVyQixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsaUVBQWlFO2dCQUNqRSx5Q0FBeUM7Z0JBQ3pDLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztvQkFDcEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDbEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7b0JBQ3pDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztvQkFDMUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO29CQUNwRCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7b0JBQ2hELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztvQkFDcEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO29CQUN0RCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUM7b0JBRTlELDRFQUE0RTtvQkFDNUUsNkJBQTZCO29CQUM3QixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3ZCLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO29CQUNqQixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztvQkFFakIsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEtBQUssQ0FBQztnQkFDckMsQ0FBQztnQkFFRCxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDaEMsT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUksSUFBSSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2xFLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7d0JBQ3hDLE1BQU0sSUFBSSxDQUFDLGVBQWUsOERBQXNDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO29CQUNuSCxDQUFDO29CQUNELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDbEMsQ0FBQztnQkFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNsQyxrQkFBZ0IsQ0FBQyx3QkFBd0IsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFFM0QsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQzNCLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixpREFBaUQ7Z0JBQ2pELElBQUksQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RELENBQUM7UUFDRixDQUFDO1FBRUQsWUFBWSxDQUFDLFNBQXdDO1lBQ3BELElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQzVCLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM5RCxDQUFDO1FBQ0YsQ0FBQztRQUVPLGFBQWEsQ0FBQyxLQUFnQyxFQUFFLFVBQWtCLEVBQUUsS0FBeUI7WUFDcEcsTUFBTSxVQUFVLEdBQWEsRUFBRSxDQUFDO1lBQ2hDLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDL0IsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLHdDQUF3QyxFQUFFLG1CQUFtQixFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNqSCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLDBCQUEwQixFQUFFLGNBQWMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUN2RixDQUFDO2dCQUNELE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQ25GLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO29CQUM1QixVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLEVBQUUsb0dBQW9HLENBQUMsQ0FBQyxDQUFDO2dCQUNqSyxDQUFDO2dCQUNELE1BQU0sMkJBQTJCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixzRkFBOEMsRUFBRSxRQUFRLEVBQUUsQ0FBQztnQkFDdkksSUFBSSxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxtRkFBMEMsSUFBSSwyQkFBMkIsRUFBRSxDQUFDO29CQUNsSCxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUUseUNBQXlDLEVBQUUsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO2dCQUNoSSxDQUFDO2dCQUNELEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbEUsQ0FBQztRQUNGLENBQUM7UUFFTyxzQkFBc0IsQ0FBQyxLQUF5QixFQUFFLFdBQTZCO1lBQ3RGLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDMUIsQ0FBQztZQUNELFFBQVEsV0FBVyxFQUFFLENBQUM7Z0JBQ3JCLEtBQUssMkJBQWdCLENBQUMsT0FBTztvQkFDNUIsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsb0NBQTRCLEVBQUUsQ0FBQzt3QkFDekQsMENBQTBDO3dCQUMxQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUN0QyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDM0MsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7NEJBQzNCLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUM5QixDQUFDOzZCQUFNLElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ2pDLEtBQUssR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQzt3QkFDN0MsQ0FBQztvQkFDRixDQUFDO29CQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO29CQUMxQixNQUFNO2dCQUNQLEtBQUssMkJBQWdCLENBQUMsR0FBRztvQkFDeEIsOEZBQThGO29CQUM5RiwwQ0FBMEM7b0JBQzFDLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO29CQUMxQixJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztvQkFDL0MsTUFBTTtnQkFDUCxLQUFLLDJCQUFnQixDQUFDLFFBQVE7b0JBQzdCLGtGQUFrRjtvQkFDbEYsaUZBQWlGO29CQUNqRiw2QkFBNkI7b0JBQzdCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO29CQUN2QixJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxvQ0FBNEI7d0JBQ3RELEtBQUssQ0FBQyxLQUFLLENBQUMsK0JBQStCLENBQUMsRUFBRSxDQUFDO3dCQUMvQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDL0MsQ0FBQztvQkFDRCxNQUFNO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1lBQ2hDLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELHFCQUFxQixDQUFDLFVBQW1ELEVBQUUsWUFBcUIsS0FBSztZQUNwRyxJQUFJLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsY0FBYyxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2hJLHNGQUFzRjtnQkFDdEYsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDO2dCQUMzQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7WUFDNUMsQ0FBQztZQUNELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxVQUFVLENBQUM7WUFDdEMsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsa0JBQWtCO1lBQ3ZCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztnQkFDaEQsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsNkJBQTZCLEVBQUUsOEJBQThCLENBQUM7Z0JBQ2xGLFdBQVcsRUFBRSw4REFBOEQ7Z0JBQzNFLGFBQWEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLGtEQUFrRCxFQUFFLFFBQVEsRUFBRSx1QkFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTO2FBQzlLLENBQUMsQ0FBQztZQUNILElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUN4QixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuRCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7Z0JBQ2hELEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDBCQUEwQixFQUFFLDJCQUEyQixDQUFDO2dCQUM1RSxXQUFXLEVBQUUsNERBQTREO2dCQUN6RSxhQUFhLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxrREFBa0QsRUFBRSxRQUFRLEVBQUUsdUJBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUzthQUM5SyxDQUFDLENBQUM7WUFDSCxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDeEIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4QyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQy9CLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNkLENBQUM7UUFFTyxvQkFBb0IsQ0FBQyxLQUFhO1lBQ3pDLElBQUksS0FBSyxLQUFLLEVBQUUsRUFBRSxDQUFDO2dCQUNsQixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLElBQUksTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFRCxLQUFLLENBQUMsd0JBQXdCO1lBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3BDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO2dCQUM1QixJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdkIsTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVHLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxzQ0FBMkIsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hGLGtFQUFrRTtnQkFDbEUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQ0FBbUMsRUFBRSxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDM0gsc0ZBQXNGO2dCQUN0RixrQ0FBa0M7Z0JBQ2xDLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUN4QyxJQUFJLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQztnQkFDaEMsQ0FBQztZQUNGLENBQUM7WUFDRCxNQUFNLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQy9CLElBQUksQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNkLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDeEMsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDN0IsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVPLEtBQUssQ0FBQyxhQUFhO1lBQzFCLE1BQU0sU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUM3SCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDcEYsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFDMUIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3ZCLHNEQUFzRDtZQUN0RCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdDQUFvQixDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7b0JBQ3pGLFFBQVEsb0NBQTRCO29CQUNwQyxVQUFVLGtDQUEwQjtvQkFDcEMsVUFBVSxFQUFFLEtBQUs7b0JBQ2pCLFVBQVUsRUFBRSxLQUFLO29CQUNqQixvQ0FBb0MsRUFBRSxLQUFLO2lCQUMzQyxDQUFDLENBQUMsQ0FBQztnQkFDSixJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUNyRSxDQUFDO1lBQ0QsSUFBSSxDQUFDLG9CQUFvQixDQUFDLG1CQUFtQixDQUFDO2dCQUM3QyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVc7Z0JBQ3pDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsR0FBRyxFQUFFLENBQUMsdUJBQXVCO2FBQ3JFLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQztZQUVwRSxrRUFBa0U7WUFDbEUsSUFBSSxvQkFBUyxFQUFFLENBQUM7Z0JBQ2YsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDbkcsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3BELElBQVksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztnQkFDdkMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLGdCQUFnQjtZQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUNwRCxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNoRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLFNBQVMsQ0FBQztZQUN0QyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNwRCxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVPLDZCQUE2QixDQUFDLGlCQUFxQztZQUMxRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQztZQUN0RCxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQztZQUNwRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxHQUFHLGlCQUFpQixDQUFDLFVBQVUsQ0FBQztZQUNsRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQztRQUNyRCxDQUFDO1FBRU8saUNBQWlDLENBQUMsSUFBOEI7WUFDdkUsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsK0JBQStCLEVBQUUsd0dBQXdHLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDak8sQ0FBQztZQUNELElBQUksQ0FBQywwQ0FBMEMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBRU8sS0FBSyxDQUFDLDBDQUEwQyxDQUFDLElBQStCO1lBQ3ZGLG1DQUFtQztZQUNuQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLHVEQUErQixDQUFDO2dCQUN0RCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0seUZBQXFELENBQUM7Z0JBQzVFLE9BQU87WUFDUixDQUFDO1lBRUQsNEZBQTRGO1lBQzVGLE9BQU87WUFDUDtZQUNDLGlDQUFpQztZQUNqQyxJQUFJLENBQUMsY0FBYztnQkFDbkIseUJBQXlCO2dCQUN6QixJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQywwQkFBMEI7Z0JBQ3BELCtCQUErQjtnQkFDL0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGNBQWM7Z0JBQ3BDLG9HQUFvRztnQkFDcEcsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsSUFBSSxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7Z0JBQ2xKLG1CQUFtQjtnQkFDbkIsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsdUJBQXVCO2dCQUNoRCxrQ0FBa0M7Z0JBQ2xDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLHdCQUF3QjtnQkFDakQsd0NBQXdDO2dCQUN4QyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyx1QkFBdUI7Z0JBQ2hELDhDQUE4QztnQkFDOUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLG1CQUFtQixJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxDQUFDLG9DQUE0QixDQUFDLEVBQ2xLLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNoQixPQUFPO1lBQ1IsQ0FBQztZQUNELHFCQUFxQjtZQUNyQixNQUFNLGVBQWUsR0FBRyxJQUFBLDZDQUF1QixFQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNqSSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYTtZQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDO1lBQ3BELENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUVELEtBQUssQ0FBQyxNQUFNO1lBQ1gsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcseUNBQWlDLEVBQUUsQ0FBQztnQkFDNUQsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcseUNBQWtDLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDekUsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyw4Q0FBc0MsRUFBRSxDQUFDO2dCQUN4RSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyw4Q0FBdUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUM5RSxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQztRQUN4QyxDQUFDO1FBRU8sS0FBSyxDQUFDLGdCQUFnQixDQUFnQyxJQUFPO1lBQ3BFLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQztZQUN4QixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFTyxLQUFLLENBQUMsZUFBZSxDQUFnQyxJQUFPLEVBQUUsS0FBNkI7WUFDbEcsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVELEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBYztZQUMxQixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSwyQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRU8sU0FBUyxDQUFDLEtBQXlCLEVBQUUsV0FBNkI7WUFDekUsTUFBTSxLQUFLLEdBQUcsQ0FBQyxLQUFLLENBQUM7WUFDckIsS0FBSyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDeEQsTUFBTSxZQUFZLEdBQUcsS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDM0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFbkUsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakMsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLElBQW1CO1lBQ25DLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDbEUsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQVcsRUFBRSxDQUFDO1lBQ3pCLEtBQUssTUFBTSxJQUFJLElBQUksSUFBQSx5QkFBYyxHQUFFLEVBQUUsQ0FBQztnQkFDckMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN6RSxDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDeEQsa0JBQWtCLEVBQUUsSUFBSTtnQkFDeEIsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLGlDQUFpQyxDQUFDO2FBQzFFLENBQUMsQ0FBQztZQUNILElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUN6QixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ2xFLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNuQixDQUFDO1lBQ0QsT0FBTztRQUNSLENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQWMsRUFBRSxhQUF1QjtZQUN4RCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2dCQUNyQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ2xFLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztpQkFBTSxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUMxQix5QkFBeUI7Z0JBQ3pCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ2xFLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDdEQsTUFBTSxjQUFjLEdBQWEsSUFBQSxnQ0FBaUIsRUFBQyxVQUFVLENBQUMsQ0FBQztZQUMvRCxNQUFNLG9CQUFvQixHQUFHLElBQUEsc0NBQXVCLEVBQUMsVUFBVSxDQUFDLENBQUM7WUFDakUsTUFBTSxLQUFLLEdBQW9CLEVBQUUsQ0FBQztZQUNsQyxLQUFLLE1BQU0sUUFBUSxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUN2QyxNQUFNLFVBQVUsR0FBRyxJQUFBLDRCQUFhLEVBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzNDLEtBQUssQ0FBQyxJQUFJLENBQUM7b0JBQ1YsS0FBSyxFQUFFLEtBQUssa0JBQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxLQUFLLFFBQVEsQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQztpQkFDL0ksQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUNsQyxNQUFNLGlCQUFpQixHQUFHLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLENBQUM7WUFDeEQsS0FBSyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRTlCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUM1RCxTQUFTLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUN4QixTQUFTLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1lBQ3BDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztZQUN2RixTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakIsTUFBTSxXQUFXLEdBQWtCLEVBQUUsQ0FBQztZQUN0QyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksT0FBTyxDQUE2QixDQUFDLENBQUMsRUFBRTtnQkFDaEUsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFELFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5RSxDQUFDLENBQUMsQ0FBQztZQUNILElBQUEsbUJBQU8sRUFBQyxXQUFXLENBQUMsQ0FBQztZQUVyQixJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLENBQUM7WUFFRCxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakIsb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDL0IsT0FBTyxNQUFNLEVBQUUsRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFFRCx3QkFBd0I7WUFDdkIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELHdCQUF3QjtZQUN2QixJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsMEJBQTBCLENBQUMsdUJBQTJDO1lBQ3JFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxZQUFZLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUNyRSxDQUFDOztJQS9rRVcsNENBQWdCO0lBcWlCcEI7UUFEUCxJQUFBLHFCQUFRLEVBQUMsRUFBRSxDQUFDO3lFQUdaO0lBcWdDRDtRQURDLElBQUEscUJBQVEsRUFBQyxJQUFJLENBQUM7b0RBR2Q7SUFxQ2E7UUFEYixJQUFBLHFCQUFRLEVBQUMsSUFBSSxDQUFDOzZEQWtCZDtJQXdEYTtRQURiLElBQUEscUJBQVEsRUFBQyxFQUFFLENBQUM7bURBR1o7K0JBOXBEVyxnQkFBZ0I7UUEwTjFCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDBDQUErQixDQUFBO1FBQy9CLFdBQUEsMEJBQVksQ0FBQTtRQUNaLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSxtQ0FBb0IsQ0FBQTtRQUNwQixZQUFBLGlDQUFtQixDQUFBO1FBQ25CLFlBQUEsNEJBQWEsQ0FBQTtRQUNiLFlBQUEsb0NBQWlCLENBQUE7UUFDakIsWUFBQSw0QkFBYSxDQUFBO1FBQ2IsWUFBQSxxQ0FBcUIsQ0FBQTtRQUNyQixZQUFBLDhCQUFtQixDQUFBO1FBQ25CLFlBQUEseUJBQWUsQ0FBQTtRQUNmLFlBQUEscUNBQXFCLENBQUE7UUFDckIsWUFBQSxnQ0FBZSxDQUFBO1FBQ2YsWUFBQSwrQkFBa0IsQ0FBQTtRQUNsQixZQUFBLGlEQUE0QixDQUFBO1FBQzVCLFlBQUEsb0NBQXdCLENBQUE7UUFDeEIsWUFBQSw4QkFBYyxDQUFBO1FBQ2QsWUFBQSw4Q0FBNkIsQ0FBQTtRQUM3QixZQUFBLHlCQUFlLENBQUE7UUFDZixZQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFlBQUEsdUJBQWMsQ0FBQTtRQUNkLFlBQUEsMEJBQWUsQ0FBQTtRQUNmLFlBQUEsd0RBQTJCLENBQUE7UUFDM0IsWUFBQSw4QkFBc0IsQ0FBQTtPQW5QWixnQkFBZ0IsQ0FnbEU1QjtJQUVELElBQU0scUNBQXFDLEdBQTNDLE1BQU0scUNBQXNDLFNBQVEsc0JBQVU7UUFJN0QsSUFBSSxVQUFVLEtBQTBCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRXhFLElBQUksY0FBYyxLQUE2QyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUVuRyxZQUNrQixVQUF1QixFQUNmLGNBQXdELEVBQ3pELHNCQUErRDtZQUV2RixLQUFLLEVBQUUsQ0FBQztZQUpTLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDRSxtQkFBYyxHQUFkLGNBQWMsQ0FBeUI7WUFDeEMsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtZQVJ2RSxnQkFBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWdCLENBQUMsQ0FBQztZQUUxRCxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW1DLENBQUMsQ0FBQztZQVNqRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDMUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNoRSxDQUFDO1lBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxTQUFTLENBQUM7UUFDL0IsQ0FBQztRQUVELFdBQVcsQ0FBQyxDQUFZO1lBQ3ZCLElBQUksQ0FBQyxJQUFBLHNCQUFnQixFQUFDLENBQUMsRUFBRSxtQkFBYSxDQUFDLEtBQUssRUFBRSxtQkFBYSxDQUFDLFNBQVMscURBQW1DLHVCQUFpQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xJLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUMxRCxDQUFDO1lBRUQscUJBQXFCO1lBQ3JCLElBQUksSUFBQSxzQkFBZ0IsRUFBQyxDQUFDLG9EQUFrQyxFQUFFLENBQUM7Z0JBQzFELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDO2dCQUNyRSxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLElBQUksS0FBSyxPQUFPLENBQUMsQ0FBQztZQUNwRSxDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNoRCxDQUFDO1FBQ0YsQ0FBQztRQUNELFdBQVcsQ0FBQyxDQUFZO1lBQ3ZCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFRCxTQUFTLENBQUMsQ0FBWTtZQUNyQixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRUQsVUFBVSxDQUFDLENBQVk7WUFDdEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQzNDLE9BQU87WUFDUixDQUFDO1lBRUQscUJBQXFCO1lBQ3JCLElBQUksSUFBQSxzQkFBZ0IsRUFBQyxDQUFDLG9EQUFrQyxFQUFFLENBQUM7Z0JBQzFELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDO2dCQUNyRSxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLElBQUksS0FBSyxPQUFPLENBQUMsQ0FBQztZQUNwRSxDQUFDO1lBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztRQUN2QyxDQUFDO1FBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFZO1lBQ3hCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBRXpCLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3JCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLCtDQUFpQyxFQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9ELElBQUksaUJBQWlCLEVBQUUsQ0FBQztnQkFDdkIsS0FBSyxNQUFNLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO29CQUNyQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUMxQyxDQUFDO2dCQUNELE9BQU87WUFDUixDQUFDO1lBRUQscURBQXFEO1lBQ3JELElBQUksSUFBcUIsQ0FBQztZQUMxQixNQUFNLFlBQVksR0FBRyxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxtQkFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JFLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvQyxDQUFDO1lBRUQsTUFBTSxZQUFZLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsdUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckUsSUFBSSxDQUFDLElBQUksSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlDLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQ2xHLG9EQUFvRDtnQkFDcEQsSUFBSSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0MsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFTyxZQUFZLENBQUMsQ0FBWTtZQUNoQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQy9CLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixPQUFPLE9BQU8sQ0FBQztZQUNoQixDQUFDO1lBRUQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDNUMsT0FBTyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsbUNBQTJCO2dCQUMzRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO2dCQUMvRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVPLG1CQUFtQjtZQUMxQixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDN0QsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsbUJBQW1CLENBQUMsMkJBQWdCLENBQUMsQ0FBQztZQUMzRixPQUFPLGdCQUFnQix3Q0FBZ0MsSUFBSSxhQUFhLDRCQUFvQjtnQkFDM0YsQ0FBQztnQkFDRCxDQUFDLDZCQUFxQixDQUFDO1FBQ3pCLENBQUM7S0FDRCxDQUFBO0lBL0hLLHFDQUFxQztRQVV4QyxXQUFBLHVDQUF1QixDQUFBO1FBQ3ZCLFdBQUEsOEJBQXNCLENBQUE7T0FYbkIscUNBQXFDLENBK0gxQztJQWNELElBQVcsaUJBR1Y7SUFIRCxXQUFXLGlCQUFpQjtRQUMzQixvQ0FBZSxDQUFBO1FBQ2YsZ0RBQTJCLENBQUE7SUFDNUIsQ0FBQyxFQUhVLGlCQUFpQixLQUFqQixpQkFBaUIsUUFHM0I7SUFFTSxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO1FBR3BELElBQUksS0FBSyxLQUF5QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELElBQUksV0FBVyxLQUFhLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFLdkQsWUFDa0IsYUFBbUMsRUFDdEMsWUFBMkMsRUFDL0Isd0JBQW1FO1lBRTdGLEtBQUssRUFBRSxDQUFDO1lBSlMsa0JBQWEsR0FBYixhQUFhLENBQXNCO1lBQ3JCLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBQ2QsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQVh0RixXQUFNLEdBQVcsRUFBRSxDQUFDO1lBQ3BCLGlCQUFZLEdBQVcsRUFBRSxDQUFDO1lBSWpCLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTBDLENBQUMsQ0FBQztZQUNsRyxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1FBUXpELENBQUM7UUFFRCxZQUFZLENBQUMsUUFBa08sRUFBRSxLQUFlO1lBQy9QLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUsseUNBQTJCLEtBQUssQ0FBQyxDQUFDO1lBQ2hILElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsb0RBQWdDLENBQUM7WUFDM0gsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLFFBQVEsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFlBQVksS0FBSyxRQUFRLENBQUMsV0FBVyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUMzRixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ3JGLENBQUM7UUFDRixDQUFDO1FBRUQsWUFBWSxDQUNYLFFBQWtPLEVBQ2xPLGFBQXFCLEVBQ3JCLFNBQTRCLEVBQzVCLEtBQWU7WUFFZixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLEVBQUUsSUFBSSxJQUFJLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUM7WUFDekcsTUFBTSxrQkFBa0IsR0FBcUM7Z0JBQzVELEdBQUcsRUFBRSxRQUFRLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxVQUFVLElBQUksRUFBRTtnQkFDOUMsU0FBUyxFQUFFLEVBQUU7Z0JBQ2IsZUFBZSxFQUFFLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0JBQzFHLEtBQUssRUFBRSxJQUFJLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxpQ0FBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUztnQkFDL0QsT0FBTyxFQUFFLFFBQVEsQ0FBQyxXQUFXO2dCQUM3QixRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVE7Z0JBQzNCLElBQUksRUFBRSxJQUFJLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxpQ0FBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUztnQkFDNUQsZUFBZSxFQUFFLFFBQVEsQ0FBQyxTQUFTO29CQUNsQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLFFBQVEsQ0FBQyxTQUFTLFVBQVUsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDbEgsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDNUQsU0FBUyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7YUFDOUQsQ0FBQztZQUNGLGFBQWEsR0FBRyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDckMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNwQixPQUFPLFNBQVMsMENBQTRCLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ2xGLENBQUM7WUFDRCxJQUFJLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQyxXQUFXLElBQUksU0FBUywwQ0FBNEIsRUFBRSxDQUFDO2dCQUM3RSxPQUFPLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDcEgsQ0FBQztZQUNELE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyx5Q0FBaUMsSUFBSSxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsOENBQXNDLENBQUM7WUFDaEosTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztZQUNyRSxNQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBRTlDLHdDQUF3QztZQUN4QyxJQUFJLGtCQUFrQixDQUFDLEdBQUcsSUFBSSxTQUFTLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsSUFBSSxTQUFTLDBDQUE0QixDQUFDLEVBQUUsQ0FBQztnQkFDckksTUFBTSxNQUFNLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQztvQkFDdkIsTUFBTSxFQUFFLFFBQVEsQ0FBQyxlQUFlLEVBQUUsR0FBRyxDQUFDLE1BQU0sSUFBSSxpQkFBTyxDQUFDLElBQUk7b0JBQzVELElBQUksRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUztpQkFDM0QsQ0FBQyxDQUFDO2dCQUNILHdGQUF3RjtnQkFDeEYsMEVBQTBFO2dCQUMxRSxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7Z0JBQ3BCLElBQUksa0JBQWtCLEVBQUUsQ0FBQztvQkFDeEIsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDaEIsQ0FBQztxQkFBTSxJQUFJLFFBQVEsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFLENBQUM7b0JBQzFDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsR0FBRyw4REFBbUQsQ0FBQztvQkFDdEksT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMvSSxDQUFDO2dCQUNELElBQUksT0FBTyxFQUFFLENBQUM7b0JBRWIsa0JBQWtCLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3RFLENBQUM7WUFDRixDQUFDO1lBRUQsMkRBQTJEO1lBQzNELE1BQU0sS0FBSyxHQUFHLElBQUEsaUJBQVEsRUFBQyxhQUFhLEVBQUcsa0JBQTJGLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3BLLE9BQU8sS0FBSyxLQUFLLEVBQUUsSUFBSSxTQUFTLDBDQUE0QixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUNyRyxDQUFDO0tBQ0QsQ0FBQTtJQWpGWSxzREFBcUI7b0NBQXJCLHFCQUFxQjtRQVcvQixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLG9DQUF3QixDQUFBO09BWmQscUJBQXFCLENBaUZqQztJQUVELFNBQWdCLGVBQWUsQ0FDOUIsZUFBMEQsRUFDMUQsaUJBQXFDLEVBQ3JDLFlBQTBCLEVBQzFCLFVBQThCO1FBRTlCLHFEQUFxRDtRQUNyRCxJQUFJLGVBQWUsS0FBSyxTQUFTLElBQUksZUFBZSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzVELE9BQU8sRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQztRQUN0RCxDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQUcsT0FBTyxlQUFlLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7UUFFMUYsMkJBQTJCO1FBQzNCLElBQUksT0FBTyxHQUF1QixTQUFTLENBQUM7UUFDNUMsUUFBUSxPQUFPLGVBQWUsRUFBRSxDQUFDO1lBQ2hDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDZixJQUFJLFdBQVcsR0FBdUIsU0FBUyxDQUFDO2dCQUNoRCxJQUFJLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNsQyxXQUFXLEdBQUcsaUJBQWlCLENBQUMsVUFBVSxDQUFDO29CQUMzQyxJQUFJLE9BQU8saUJBQWlCLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUNoRCxXQUFXLElBQUksSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDN0MsQ0FBQzt5QkFBTSxJQUFJLGlCQUFpQixDQUFDLElBQUksSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ3BFLFdBQVcsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNsRSxDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsSUFBSSxZQUFZLDRDQUFvQyxFQUFFLENBQUM7b0JBQ3RELElBQUksV0FBVyxFQUFFLENBQUM7d0JBQ2pCLE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLHFDQUFxQyxFQUFFLGlFQUFpRSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDckosQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDJCQUEyQixFQUFFLHlEQUF5RCxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUN0SCxDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLFdBQVcsRUFBRSxDQUFDO3dCQUNqQixPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQ0FBbUMsRUFBRSw4REFBOEQsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ2hKLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxzREFBc0QsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDakgsQ0FBQztnQkFDRixDQUFDO2dCQUNELE1BQU07WUFDUCxDQUFDO1lBQ0QsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUNmLHlCQUF5QjtnQkFDekIsSUFBSSxlQUFlLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLENBQUM7b0JBQy9FLE1BQU07Z0JBQ1AsQ0FBQztnQkFDRCxrRUFBa0U7Z0JBQ2xFLElBQUksWUFBWSxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUM7Z0JBQzNDLE1BQU0sV0FBVyxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7Z0JBQzlFLElBQUksV0FBVyxFQUFFLENBQUM7b0JBQ2pCLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztvQkFDaEYsUUFBUSxTQUFTLEVBQUUsQ0FBQzt3QkFDbkIsS0FBSyxDQUFDOzRCQUNMLFlBQVksR0FBRyw2REFBNkQsaUJBQWlCLENBQUMsVUFBVSwyREFBMkQsQ0FBQzs0QkFDcEssTUFBTTt3QkFDUCxLQUFLLEdBQUc7NEJBQ1AsWUFBWSxHQUFHLCtCQUErQixVQUFVLGdEQUFnRCxDQUFDOzRCQUN6RyxNQUFNO3dCQUNQLEtBQUssSUFBSTs0QkFDUixZQUFZLEdBQUcsK0tBQStLLENBQUM7NEJBQy9MLE1BQU07b0JBQ1IsQ0FBQztnQkFDRixDQUFDO2dCQUNELE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDJCQUEyQixFQUFFLDZDQUE2QyxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUNqSCxNQUFNO1lBQ1AsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFHTSxJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE2QjtRQUN6QyxZQUNrQixTQUE0QixFQUNKLHNCQUE4QztZQUR0RSxjQUFTLEdBQVQsU0FBUyxDQUFtQjtZQUNKLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBd0I7UUFFeEYsQ0FBQztRQUVELGtCQUFrQixDQUFDLEtBQWtCO1lBQ3BDLE1BQU0sa0JBQWtCLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxpREFBeUIsQ0FBQyxDQUFDO1lBQ3JFLElBQUksa0JBQWtCLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxrQkFBa0IsQ0FBQztZQUMzQixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSywyQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdkQsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLGdDQUFnQixDQUFDLENBQUM7WUFDekMsQ0FBQztZQUNELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxtQkFBbUIsQ0FBQywyQkFBZ0IsQ0FBRSxDQUFDO1lBQ3BGLElBQUksUUFBUSx3Q0FBZ0MsRUFBRSxDQUFDO2dCQUM5QyxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsd0JBQWdCLENBQUMsQ0FBQztZQUN6QyxDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLDJCQUFtQixDQUFDLENBQUM7UUFDNUMsQ0FBQztLQUNELENBQUE7SUFyQlksc0VBQTZCOzRDQUE3Qiw2QkFBNkI7UUFHdkMsV0FBQSw4QkFBc0IsQ0FBQTtPQUhaLDZCQUE2QixDQXFCekMifQ==