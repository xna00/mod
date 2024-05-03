/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform"], function (require, exports, instantiation_1, contextkey_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ITerminalLogService = exports.ILocalPtyService = exports.TerminalExtensions = exports.TerminalExitReason = exports.ShellIntegrationStatus = exports.ProfileSource = exports.FlowControlConstants = exports.LocalReconnectConstants = exports.TerminalLocationString = exports.TerminalLocation = exports.HeartbeatConstants = exports.IPtyService = exports.ProcessPropertyType = exports.TerminalIpcChannels = exports.TitleEventSource = exports.WindowsShellType = exports.PosixShellType = exports.TerminalSettingId = exports.TerminalSettingPrefix = exports.terminalTabFocusModeContextKey = void 0;
    exports.terminalTabFocusModeContextKey = new contextkey_1.RawContextKey('terminalTabFocusMode', false, true);
    var TerminalSettingPrefix;
    (function (TerminalSettingPrefix) {
        TerminalSettingPrefix["AutomationProfile"] = "terminal.integrated.automationProfile.";
        TerminalSettingPrefix["DefaultProfile"] = "terminal.integrated.defaultProfile.";
        TerminalSettingPrefix["Profiles"] = "terminal.integrated.profiles.";
    })(TerminalSettingPrefix || (exports.TerminalSettingPrefix = TerminalSettingPrefix = {}));
    var TerminalSettingId;
    (function (TerminalSettingId) {
        TerminalSettingId["SendKeybindingsToShell"] = "terminal.integrated.sendKeybindingsToShell";
        TerminalSettingId["AutomationProfileLinux"] = "terminal.integrated.automationProfile.linux";
        TerminalSettingId["AutomationProfileMacOs"] = "terminal.integrated.automationProfile.osx";
        TerminalSettingId["AutomationProfileWindows"] = "terminal.integrated.automationProfile.windows";
        TerminalSettingId["ProfilesWindows"] = "terminal.integrated.profiles.windows";
        TerminalSettingId["ProfilesMacOs"] = "terminal.integrated.profiles.osx";
        TerminalSettingId["ProfilesLinux"] = "terminal.integrated.profiles.linux";
        TerminalSettingId["DefaultProfileLinux"] = "terminal.integrated.defaultProfile.linux";
        TerminalSettingId["DefaultProfileMacOs"] = "terminal.integrated.defaultProfile.osx";
        TerminalSettingId["DefaultProfileWindows"] = "terminal.integrated.defaultProfile.windows";
        TerminalSettingId["UseWslProfiles"] = "terminal.integrated.useWslProfiles";
        TerminalSettingId["TabsDefaultColor"] = "terminal.integrated.tabs.defaultColor";
        TerminalSettingId["TabsDefaultIcon"] = "terminal.integrated.tabs.defaultIcon";
        TerminalSettingId["TabsEnabled"] = "terminal.integrated.tabs.enabled";
        TerminalSettingId["TabsEnableAnimation"] = "terminal.integrated.tabs.enableAnimation";
        TerminalSettingId["TabsHideCondition"] = "terminal.integrated.tabs.hideCondition";
        TerminalSettingId["TabsShowActiveTerminal"] = "terminal.integrated.tabs.showActiveTerminal";
        TerminalSettingId["TabsShowActions"] = "terminal.integrated.tabs.showActions";
        TerminalSettingId["TabsLocation"] = "terminal.integrated.tabs.location";
        TerminalSettingId["TabsFocusMode"] = "terminal.integrated.tabs.focusMode";
        TerminalSettingId["MacOptionIsMeta"] = "terminal.integrated.macOptionIsMeta";
        TerminalSettingId["MacOptionClickForcesSelection"] = "terminal.integrated.macOptionClickForcesSelection";
        TerminalSettingId["AltClickMovesCursor"] = "terminal.integrated.altClickMovesCursor";
        TerminalSettingId["CopyOnSelection"] = "terminal.integrated.copyOnSelection";
        TerminalSettingId["EnableMultiLinePasteWarning"] = "terminal.integrated.enableMultiLinePasteWarning";
        TerminalSettingId["DrawBoldTextInBrightColors"] = "terminal.integrated.drawBoldTextInBrightColors";
        TerminalSettingId["FontFamily"] = "terminal.integrated.fontFamily";
        TerminalSettingId["FontSize"] = "terminal.integrated.fontSize";
        TerminalSettingId["LetterSpacing"] = "terminal.integrated.letterSpacing";
        TerminalSettingId["LineHeight"] = "terminal.integrated.lineHeight";
        TerminalSettingId["MinimumContrastRatio"] = "terminal.integrated.minimumContrastRatio";
        TerminalSettingId["TabStopWidth"] = "terminal.integrated.tabStopWidth";
        TerminalSettingId["FastScrollSensitivity"] = "terminal.integrated.fastScrollSensitivity";
        TerminalSettingId["MouseWheelScrollSensitivity"] = "terminal.integrated.mouseWheelScrollSensitivity";
        TerminalSettingId["BellDuration"] = "terminal.integrated.bellDuration";
        TerminalSettingId["FontWeight"] = "terminal.integrated.fontWeight";
        TerminalSettingId["FontWeightBold"] = "terminal.integrated.fontWeightBold";
        TerminalSettingId["CursorBlinking"] = "terminal.integrated.cursorBlinking";
        TerminalSettingId["CursorStyle"] = "terminal.integrated.cursorStyle";
        TerminalSettingId["CursorStyleInactive"] = "terminal.integrated.cursorStyleInactive";
        TerminalSettingId["CursorWidth"] = "terminal.integrated.cursorWidth";
        TerminalSettingId["Scrollback"] = "terminal.integrated.scrollback";
        TerminalSettingId["DetectLocale"] = "terminal.integrated.detectLocale";
        TerminalSettingId["DefaultLocation"] = "terminal.integrated.defaultLocation";
        TerminalSettingId["GpuAcceleration"] = "terminal.integrated.gpuAcceleration";
        TerminalSettingId["TerminalTitleSeparator"] = "terminal.integrated.tabs.separator";
        TerminalSettingId["TerminalTitle"] = "terminal.integrated.tabs.title";
        TerminalSettingId["TerminalDescription"] = "terminal.integrated.tabs.description";
        TerminalSettingId["RightClickBehavior"] = "terminal.integrated.rightClickBehavior";
        TerminalSettingId["Cwd"] = "terminal.integrated.cwd";
        TerminalSettingId["ConfirmOnExit"] = "terminal.integrated.confirmOnExit";
        TerminalSettingId["ConfirmOnKill"] = "terminal.integrated.confirmOnKill";
        TerminalSettingId["EnableBell"] = "terminal.integrated.enableBell";
        TerminalSettingId["EnableVisualBell"] = "terminal.integrated.enableVisualBell";
        TerminalSettingId["CommandsToSkipShell"] = "terminal.integrated.commandsToSkipShell";
        TerminalSettingId["AllowChords"] = "terminal.integrated.allowChords";
        TerminalSettingId["AllowMnemonics"] = "terminal.integrated.allowMnemonics";
        TerminalSettingId["TabFocusMode"] = "terminal.integrated.tabFocusMode";
        TerminalSettingId["EnvMacOs"] = "terminal.integrated.env.osx";
        TerminalSettingId["EnvLinux"] = "terminal.integrated.env.linux";
        TerminalSettingId["EnvWindows"] = "terminal.integrated.env.windows";
        TerminalSettingId["EnvironmentChangesIndicator"] = "terminal.integrated.environmentChangesIndicator";
        TerminalSettingId["EnvironmentChangesRelaunch"] = "terminal.integrated.environmentChangesRelaunch";
        TerminalSettingId["ShowExitAlert"] = "terminal.integrated.showExitAlert";
        TerminalSettingId["SplitCwd"] = "terminal.integrated.splitCwd";
        TerminalSettingId["WindowsEnableConpty"] = "terminal.integrated.windowsEnableConpty";
        TerminalSettingId["WordSeparators"] = "terminal.integrated.wordSeparators";
        TerminalSettingId["EnableFileLinks"] = "terminal.integrated.enableFileLinks";
        TerminalSettingId["UnicodeVersion"] = "terminal.integrated.unicodeVersion";
        TerminalSettingId["LocalEchoLatencyThreshold"] = "terminal.integrated.localEchoLatencyThreshold";
        TerminalSettingId["LocalEchoEnabled"] = "terminal.integrated.localEchoEnabled";
        TerminalSettingId["LocalEchoExcludePrograms"] = "terminal.integrated.localEchoExcludePrograms";
        TerminalSettingId["LocalEchoStyle"] = "terminal.integrated.localEchoStyle";
        TerminalSettingId["EnablePersistentSessions"] = "terminal.integrated.enablePersistentSessions";
        TerminalSettingId["PersistentSessionReviveProcess"] = "terminal.integrated.persistentSessionReviveProcess";
        TerminalSettingId["HideOnStartup"] = "terminal.integrated.hideOnStartup";
        TerminalSettingId["CustomGlyphs"] = "terminal.integrated.customGlyphs";
        TerminalSettingId["RescaleOverlappingGlyphs"] = "terminal.integrated.rescaleOverlappingGlyphs";
        TerminalSettingId["PersistentSessionScrollback"] = "terminal.integrated.persistentSessionScrollback";
        TerminalSettingId["InheritEnv"] = "terminal.integrated.inheritEnv";
        TerminalSettingId["ShowLinkHover"] = "terminal.integrated.showLinkHover";
        TerminalSettingId["IgnoreProcessNames"] = "terminal.integrated.ignoreProcessNames";
        TerminalSettingId["AutoReplies"] = "terminal.integrated.autoReplies";
        TerminalSettingId["ShellIntegrationEnabled"] = "terminal.integrated.shellIntegration.enabled";
        TerminalSettingId["ShellIntegrationShowWelcome"] = "terminal.integrated.shellIntegration.showWelcome";
        TerminalSettingId["ShellIntegrationDecorationsEnabled"] = "terminal.integrated.shellIntegration.decorationsEnabled";
        TerminalSettingId["ShellIntegrationCommandHistory"] = "terminal.integrated.shellIntegration.history";
        TerminalSettingId["ShellIntegrationSuggestEnabled"] = "terminal.integrated.shellIntegration.suggestEnabled";
        TerminalSettingId["EnableImages"] = "terminal.integrated.enableImages";
        TerminalSettingId["SmoothScrolling"] = "terminal.integrated.smoothScrolling";
        TerminalSettingId["IgnoreBracketedPasteMode"] = "terminal.integrated.ignoreBracketedPasteMode";
        TerminalSettingId["FocusAfterRun"] = "terminal.integrated.focusAfterRun";
        TerminalSettingId["AccessibleViewPreserveCursorPosition"] = "terminal.integrated.accessibleViewPreserveCursorPosition";
        TerminalSettingId["AccessibleViewFocusOnCommandExecution"] = "terminal.integrated.accessibleViewFocusOnCommandExecution";
        TerminalSettingId["StickyScrollEnabled"] = "terminal.integrated.stickyScroll.enabled";
        TerminalSettingId["StickyScrollMaxLineCount"] = "terminal.integrated.stickyScroll.maxLineCount";
        TerminalSettingId["MouseWheelZoom"] = "terminal.integrated.mouseWheelZoom";
        TerminalSettingId["ExperimentalInlineChat"] = "terminal.integrated.experimentalInlineChat";
        // Debug settings that are hidden from user
        /** Simulated latency applied to all calls made to the pty host */
        TerminalSettingId["DeveloperPtyHostLatency"] = "terminal.integrated.developer.ptyHost.latency";
        /** Simulated startup delay of the pty host process */
        TerminalSettingId["DeveloperPtyHostStartupDelay"] = "terminal.integrated.developer.ptyHost.startupDelay";
        /** Shows the textarea element */
        TerminalSettingId["DevMode"] = "terminal.integrated.developer.devMode";
    })(TerminalSettingId || (exports.TerminalSettingId = TerminalSettingId = {}));
    var PosixShellType;
    (function (PosixShellType) {
        PosixShellType["PowerShell"] = "pwsh";
        PosixShellType["Bash"] = "bash";
        PosixShellType["Fish"] = "fish";
        PosixShellType["Sh"] = "sh";
        PosixShellType["Csh"] = "csh";
        PosixShellType["Ksh"] = "ksh";
        PosixShellType["Zsh"] = "zsh";
        PosixShellType["Python"] = "python";
    })(PosixShellType || (exports.PosixShellType = PosixShellType = {}));
    var WindowsShellType;
    (function (WindowsShellType) {
        WindowsShellType["CommandPrompt"] = "cmd";
        WindowsShellType["PowerShell"] = "pwsh";
        WindowsShellType["Wsl"] = "wsl";
        WindowsShellType["GitBash"] = "gitbash";
        WindowsShellType["Python"] = "python";
    })(WindowsShellType || (exports.WindowsShellType = WindowsShellType = {}));
    var TitleEventSource;
    (function (TitleEventSource) {
        /** From the API or the rename command that overrides any other type */
        TitleEventSource[TitleEventSource["Api"] = 0] = "Api";
        /** From the process name property*/
        TitleEventSource[TitleEventSource["Process"] = 1] = "Process";
        /** From the VT sequence */
        TitleEventSource[TitleEventSource["Sequence"] = 2] = "Sequence";
        /** Config changed */
        TitleEventSource[TitleEventSource["Config"] = 3] = "Config";
    })(TitleEventSource || (exports.TitleEventSource = TitleEventSource = {}));
    var TerminalIpcChannels;
    (function (TerminalIpcChannels) {
        /**
         * Communicates between the renderer process and shared process.
         */
        TerminalIpcChannels["LocalPty"] = "localPty";
        /**
         * Communicates between the shared process and the pty host process.
         */
        TerminalIpcChannels["PtyHost"] = "ptyHost";
        /**
         * Communicates between the renderer process and the pty host process.
         */
        TerminalIpcChannels["PtyHostWindow"] = "ptyHostWindow";
        /**
         * Deals with logging from the pty host process.
         */
        TerminalIpcChannels["Logger"] = "logger";
        /**
         * Enables the detection of unresponsive pty hosts.
         */
        TerminalIpcChannels["Heartbeat"] = "heartbeat";
    })(TerminalIpcChannels || (exports.TerminalIpcChannels = TerminalIpcChannels = {}));
    var ProcessPropertyType;
    (function (ProcessPropertyType) {
        ProcessPropertyType["Cwd"] = "cwd";
        ProcessPropertyType["InitialCwd"] = "initialCwd";
        ProcessPropertyType["FixedDimensions"] = "fixedDimensions";
        ProcessPropertyType["Title"] = "title";
        ProcessPropertyType["ShellType"] = "shellType";
        ProcessPropertyType["HasChildProcesses"] = "hasChildProcesses";
        ProcessPropertyType["ResolvedShellLaunchConfig"] = "resolvedShellLaunchConfig";
        ProcessPropertyType["OverrideDimensions"] = "overrideDimensions";
        ProcessPropertyType["FailedShellIntegrationActivation"] = "failedShellIntegrationActivation";
        ProcessPropertyType["UsedShellIntegrationInjection"] = "usedShellIntegrationInjection";
    })(ProcessPropertyType || (exports.ProcessPropertyType = ProcessPropertyType = {}));
    exports.IPtyService = (0, instantiation_1.createDecorator)('ptyService');
    var HeartbeatConstants;
    (function (HeartbeatConstants) {
        /**
         * The duration between heartbeats
         */
        HeartbeatConstants[HeartbeatConstants["BeatInterval"] = 5000] = "BeatInterval";
        /**
         * The duration of the first heartbeat while the pty host is starting up. This is much larger
         * than the regular BeatInterval to accommodate slow machines, we still want to warn about the
         * pty host's unresponsiveness eventually though.
         */
        HeartbeatConstants[HeartbeatConstants["ConnectingBeatInterval"] = 20000] = "ConnectingBeatInterval";
        /**
         * Defines a multiplier for BeatInterval for how long to wait before starting the second wait
         * timer.
         */
        HeartbeatConstants[HeartbeatConstants["FirstWaitMultiplier"] = 1.2] = "FirstWaitMultiplier";
        /**
         * Defines a multiplier for BeatInterval for how long to wait before telling the user about
         * non-responsiveness. The second timer is to avoid informing the user incorrectly when waking
         * the computer up from sleep
         */
        HeartbeatConstants[HeartbeatConstants["SecondWaitMultiplier"] = 1] = "SecondWaitMultiplier";
        /**
         * How long to wait before telling the user about non-responsiveness when they try to create a
         * process. This short circuits the standard wait timeouts to tell the user sooner and only
         * create process is handled to avoid additional perf overhead.
         */
        HeartbeatConstants[HeartbeatConstants["CreateProcessTimeout"] = 5000] = "CreateProcessTimeout";
    })(HeartbeatConstants || (exports.HeartbeatConstants = HeartbeatConstants = {}));
    var TerminalLocation;
    (function (TerminalLocation) {
        TerminalLocation[TerminalLocation["Panel"] = 1] = "Panel";
        TerminalLocation[TerminalLocation["Editor"] = 2] = "Editor";
    })(TerminalLocation || (exports.TerminalLocation = TerminalLocation = {}));
    var TerminalLocationString;
    (function (TerminalLocationString) {
        TerminalLocationString["TerminalView"] = "view";
        TerminalLocationString["Editor"] = "editor";
    })(TerminalLocationString || (exports.TerminalLocationString = TerminalLocationString = {}));
    var LocalReconnectConstants;
    (function (LocalReconnectConstants) {
        /**
         * If there is no reconnection within this time-frame, consider the connection permanently closed...
        */
        LocalReconnectConstants[LocalReconnectConstants["GraceTime"] = 60000] = "GraceTime";
        /**
         * Maximal grace time between the first and the last reconnection...
        */
        LocalReconnectConstants[LocalReconnectConstants["ShortGraceTime"] = 6000] = "ShortGraceTime";
    })(LocalReconnectConstants || (exports.LocalReconnectConstants = LocalReconnectConstants = {}));
    var FlowControlConstants;
    (function (FlowControlConstants) {
        /**
         * The number of _unacknowledged_ chars to have been sent before the pty is paused in order for
         * the client to catch up.
         */
        FlowControlConstants[FlowControlConstants["HighWatermarkChars"] = 100000] = "HighWatermarkChars";
        /**
         * After flow control pauses the pty for the client the catch up, this is the number of
         * _unacknowledged_ chars to have been caught up to on the client before resuming the pty again.
         * This is used to attempt to prevent pauses in the flowing data; ideally while the pty is
         * paused the number of unacknowledged chars would always be greater than 0 or the client will
         * appear to stutter. In reality this balance is hard to accomplish though so heavy commands
         * will likely pause as latency grows, not flooding the connection is the important thing as
         * it's shared with other core functionality.
         */
        FlowControlConstants[FlowControlConstants["LowWatermarkChars"] = 5000] = "LowWatermarkChars";
        /**
         * The number characters that are accumulated on the client side before sending an ack event.
         * This must be less than or equal to LowWatermarkChars or the terminal max never unpause.
         */
        FlowControlConstants[FlowControlConstants["CharCountAckSize"] = 5000] = "CharCountAckSize";
    })(FlowControlConstants || (exports.FlowControlConstants = FlowControlConstants = {}));
    var ProfileSource;
    (function (ProfileSource) {
        ProfileSource["GitBash"] = "Git Bash";
        ProfileSource["Pwsh"] = "PowerShell";
    })(ProfileSource || (exports.ProfileSource = ProfileSource = {}));
    var ShellIntegrationStatus;
    (function (ShellIntegrationStatus) {
        /** No shell integration sequences have been encountered. */
        ShellIntegrationStatus[ShellIntegrationStatus["Off"] = 0] = "Off";
        /** Final term shell integration sequences have been encountered. */
        ShellIntegrationStatus[ShellIntegrationStatus["FinalTerm"] = 1] = "FinalTerm";
        /** VS Code shell integration sequences have been encountered. Supercedes FinalTerm. */
        ShellIntegrationStatus[ShellIntegrationStatus["VSCode"] = 2] = "VSCode";
    })(ShellIntegrationStatus || (exports.ShellIntegrationStatus = ShellIntegrationStatus = {}));
    var TerminalExitReason;
    (function (TerminalExitReason) {
        TerminalExitReason[TerminalExitReason["Unknown"] = 0] = "Unknown";
        TerminalExitReason[TerminalExitReason["Shutdown"] = 1] = "Shutdown";
        TerminalExitReason[TerminalExitReason["Process"] = 2] = "Process";
        TerminalExitReason[TerminalExitReason["User"] = 3] = "User";
        TerminalExitReason[TerminalExitReason["Extension"] = 4] = "Extension";
    })(TerminalExitReason || (exports.TerminalExitReason = TerminalExitReason = {}));
    exports.TerminalExtensions = {
        Backend: 'workbench.contributions.terminal.processBackend'
    };
    class TerminalBackendRegistry {
        constructor() {
            this._backends = new Map();
        }
        get backends() { return this._backends; }
        registerTerminalBackend(backend) {
            const key = this._sanitizeRemoteAuthority(backend.remoteAuthority);
            if (this._backends.has(key)) {
                throw new Error(`A terminal backend with remote authority '${key}' was already registered.`);
            }
            this._backends.set(key, backend);
        }
        getTerminalBackend(remoteAuthority) {
            return this._backends.get(this._sanitizeRemoteAuthority(remoteAuthority));
        }
        _sanitizeRemoteAuthority(remoteAuthority) {
            // Normalize the key to lowercase as the authority is case-insensitive
            return remoteAuthority?.toLowerCase() ?? '';
        }
    }
    platform_1.Registry.add(exports.TerminalExtensions.Backend, new TerminalBackendRegistry());
    exports.ILocalPtyService = (0, instantiation_1.createDecorator)('localPtyService');
    exports.ITerminalLogService = (0, instantiation_1.createDecorator)('terminalLogService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL2NvbW1vbi90ZXJtaW5hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQm5GLFFBQUEsOEJBQThCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHNCQUFzQixFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUU5RyxJQUFrQixxQkFJakI7SUFKRCxXQUFrQixxQkFBcUI7UUFDdEMscUZBQTRELENBQUE7UUFDNUQsK0VBQXNELENBQUE7UUFDdEQsbUVBQTBDLENBQUE7SUFDM0MsQ0FBQyxFQUppQixxQkFBcUIscUNBQXJCLHFCQUFxQixRQUl0QztJQUVELElBQWtCLGlCQTRHakI7SUE1R0QsV0FBa0IsaUJBQWlCO1FBQ2xDLDBGQUFxRSxDQUFBO1FBQ3JFLDJGQUFzRSxDQUFBO1FBQ3RFLHlGQUFvRSxDQUFBO1FBQ3BFLCtGQUEwRSxDQUFBO1FBQzFFLDZFQUF3RCxDQUFBO1FBQ3hELHVFQUFrRCxDQUFBO1FBQ2xELHlFQUFvRCxDQUFBO1FBQ3BELHFGQUFnRSxDQUFBO1FBQ2hFLG1GQUE4RCxDQUFBO1FBQzlELHlGQUFvRSxDQUFBO1FBQ3BFLDBFQUFxRCxDQUFBO1FBQ3JELCtFQUEwRCxDQUFBO1FBQzFELDZFQUF3RCxDQUFBO1FBQ3hELHFFQUFnRCxDQUFBO1FBQ2hELHFGQUFnRSxDQUFBO1FBQ2hFLGlGQUE0RCxDQUFBO1FBQzVELDJGQUFzRSxDQUFBO1FBQ3RFLDZFQUF3RCxDQUFBO1FBQ3hELHVFQUFrRCxDQUFBO1FBQ2xELHlFQUFvRCxDQUFBO1FBQ3BELDRFQUF1RCxDQUFBO1FBQ3ZELHdHQUFtRixDQUFBO1FBQ25GLG9GQUErRCxDQUFBO1FBQy9ELDRFQUF1RCxDQUFBO1FBQ3ZELG9HQUErRSxDQUFBO1FBQy9FLGtHQUE2RSxDQUFBO1FBQzdFLGtFQUE2QyxDQUFBO1FBQzdDLDhEQUF5QyxDQUFBO1FBQ3pDLHdFQUFtRCxDQUFBO1FBQ25ELGtFQUE2QyxDQUFBO1FBQzdDLHNGQUFpRSxDQUFBO1FBQ2pFLHNFQUFpRCxDQUFBO1FBQ2pELHdGQUFtRSxDQUFBO1FBQ25FLG9HQUErRSxDQUFBO1FBQy9FLHNFQUFpRCxDQUFBO1FBQ2pELGtFQUE2QyxDQUFBO1FBQzdDLDBFQUFxRCxDQUFBO1FBQ3JELDBFQUFxRCxDQUFBO1FBQ3JELG9FQUErQyxDQUFBO1FBQy9DLG9GQUErRCxDQUFBO1FBQy9ELG9FQUErQyxDQUFBO1FBQy9DLGtFQUE2QyxDQUFBO1FBQzdDLHNFQUFpRCxDQUFBO1FBQ2pELDRFQUF1RCxDQUFBO1FBQ3ZELDRFQUF1RCxDQUFBO1FBQ3ZELGtGQUE2RCxDQUFBO1FBQzdELHFFQUFnRCxDQUFBO1FBQ2hELGlGQUE0RCxDQUFBO1FBQzVELGtGQUE2RCxDQUFBO1FBQzdELG9EQUErQixDQUFBO1FBQy9CLHdFQUFtRCxDQUFBO1FBQ25ELHdFQUFtRCxDQUFBO1FBQ25ELGtFQUE2QyxDQUFBO1FBQzdDLDhFQUF5RCxDQUFBO1FBQ3pELG9GQUErRCxDQUFBO1FBQy9ELG9FQUErQyxDQUFBO1FBQy9DLDBFQUFxRCxDQUFBO1FBQ3JELHNFQUFpRCxDQUFBO1FBQ2pELDZEQUF3QyxDQUFBO1FBQ3hDLCtEQUEwQyxDQUFBO1FBQzFDLG1FQUE4QyxDQUFBO1FBQzlDLG9HQUErRSxDQUFBO1FBQy9FLGtHQUE2RSxDQUFBO1FBQzdFLHdFQUFtRCxDQUFBO1FBQ25ELDhEQUF5QyxDQUFBO1FBQ3pDLG9GQUErRCxDQUFBO1FBQy9ELDBFQUFxRCxDQUFBO1FBQ3JELDRFQUF1RCxDQUFBO1FBQ3ZELDBFQUFxRCxDQUFBO1FBQ3JELGdHQUEyRSxDQUFBO1FBQzNFLDhFQUF5RCxDQUFBO1FBQ3pELDhGQUF5RSxDQUFBO1FBQ3pFLDBFQUFxRCxDQUFBO1FBQ3JELDhGQUF5RSxDQUFBO1FBQ3pFLDBHQUFxRixDQUFB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