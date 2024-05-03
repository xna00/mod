/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/platform/terminal/common/capabilities/cwdDetectionCapability", "vs/platform/terminal/common/capabilities/partialCommandDetectionCapability", "vs/base/common/event", "vs/platform/terminal/common/capabilities/bufferMarkCapability", "vs/base/common/uri", "vs/platform/terminal/common/terminalEnvironment"], function (require, exports, lifecycle_1, terminalCapabilityStore_1, commandDetectionCapability_1, cwdDetectionCapability_1, partialCommandDetectionCapability_1, event_1, bufferMarkCapability_1, uri_1, terminalEnvironment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShellIntegrationAddon = void 0;
    exports.deserializeMessage = deserializeMessage;
    exports.parseKeyValueAssignment = parseKeyValueAssignment;
    exports.parseMarkSequence = parseMarkSequence;
    /**
     * Shell integration is a feature that enhances the terminal's understanding of what's happening
     * in the shell by injecting special sequences into the shell's prompt using the "Set Text
     * Parameters" sequence (`OSC Ps ; Pt ST`).
     *
     * Definitions:
     * - OSC: `\x1b]`
     * - Ps:  A single (usually optional) numeric parameter, composed of one or more digits.
     * - Pt:  A text parameter composed of printable characters.
     * - ST: `\x7`
     *
     * This is inspired by a feature of the same name in the FinalTerm, iTerm2 and kitty terminals.
     */
    /**
     * The identifier for the first numeric parameter (`Ps`) for OSC commands used by shell integration.
     */
    var ShellIntegrationOscPs;
    (function (ShellIntegrationOscPs) {
        /**
         * Sequences pioneered by FinalTerm.
         */
        ShellIntegrationOscPs[ShellIntegrationOscPs["FinalTerm"] = 133] = "FinalTerm";
        /**
         * Sequences pioneered by VS Code. The number is derived from the least significant digit of
         * "VSC" when encoded in hex ("VSC" = 0x56, 0x53, 0x43).
         */
        ShellIntegrationOscPs[ShellIntegrationOscPs["VSCode"] = 633] = "VSCode";
        /**
         * Sequences pioneered by iTerm.
         */
        ShellIntegrationOscPs[ShellIntegrationOscPs["ITerm"] = 1337] = "ITerm";
        ShellIntegrationOscPs[ShellIntegrationOscPs["SetCwd"] = 7] = "SetCwd";
        ShellIntegrationOscPs[ShellIntegrationOscPs["SetWindowsFriendlyCwd"] = 9] = "SetWindowsFriendlyCwd";
    })(ShellIntegrationOscPs || (ShellIntegrationOscPs = {}));
    /**
     * VS Code-specific shell integration sequences. Some of these are based on more common alternatives
     * like those pioneered in FinalTerm. The decision to move to entirely custom sequences was to try
     * to improve reliability and prevent the possibility of applications confusing the terminal. If
     * multiple shell integration scripts run, VS Code will prioritize the VS Code-specific ones.
     *
     * It's recommended that authors of shell integration scripts use the common sequences (eg. 133)
     * when building general purpose scripts and the VS Code-specific (633) when targeting only VS Code
     * or when there are no other alternatives.
     */
    var VSCodeOscPt;
    (function (VSCodeOscPt) {
        /**
         * The start of the prompt, this is expected to always appear at the start of a line.
         * Based on FinalTerm's `OSC 133 ; A ST`.
         */
        VSCodeOscPt["PromptStart"] = "A";
        /**
         * The start of a command, ie. where the user inputs their command.
         * Based on FinalTerm's `OSC 133 ; B ST`.
         */
        VSCodeOscPt["CommandStart"] = "B";
        /**
         * Sent just before the command output begins.
         * Based on FinalTerm's `OSC 133 ; C ST`.
         */
        VSCodeOscPt["CommandExecuted"] = "C";
        /**
         * Sent just after a command has finished. The exit code is optional, when not specified it
         * means no command was run (ie. enter on empty prompt or ctrl+c).
         * Based on FinalTerm's `OSC 133 ; D [; <ExitCode>] ST`.
         */
        VSCodeOscPt["CommandFinished"] = "D";
        /**
         * Explicitly set the command line. This helps workaround performance and reliability problems
         * with parsing out the command, such as conpty not guaranteeing the position of the sequence or
         * the shell not guaranteeing that the entire command is even visible. Ideally this is called
         * immediately before {@link CommandExecuted}, immediately before {@link CommandFinished} will
         * also work but that means terminal will only know the accurate command line when the command is
         * finished.
         *
         * The command line can escape ascii characters using the `\xAB` format, where AB are the
         * hexadecimal representation of the character code (case insensitive), and escape the `\`
         * character using `\\`. It's required to escape semi-colon (`0x3b`) and characters 0x20 and
         * below, this is particularly important for new line and semi-colon.
         *
         * Some examples:
         *
         * ```
         * "\"  -> "\\"
         * "\n" -> "\x0a"
         * ";"  -> "\x3b"
         * ```
         *
         * An optional nonce can be provided which is may be required by the terminal in order enable
         * some features. This helps ensure no malicious command injection has occurred.
         *
         * Format: `OSC 633 ; E [; <CommandLine> [; <Nonce>]] ST`.
         */
        VSCodeOscPt["CommandLine"] = "E";
        /**
         * Similar to prompt start but for line continuations.
         *
         * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
         */
        VSCodeOscPt["ContinuationStart"] = "F";
        /**
         * Similar to command start but for line continuations.
         *
         * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
         */
        VSCodeOscPt["ContinuationEnd"] = "G";
        /**
         * The start of the right prompt.
         *
         * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
         */
        VSCodeOscPt["RightPromptStart"] = "H";
        /**
         * The end of the right prompt.
         *
         * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
         */
        VSCodeOscPt["RightPromptEnd"] = "I";
        /**
         * Set an arbitrary property: `OSC 633 ; P ; <Property>=<Value> ST`, only known properties will
         * be handled.
         *
         * Known properties:
         *
         * - `Cwd` - Reports the current working directory to the terminal.
         * - `IsWindows` - Indicates whether the terminal is using a Windows backend like winpty or
         *   conpty. This may be used to enable additional heuristics as the positioning of the shell
         *   integration sequences are not guaranteed to be correct. Valid values: `True`, `False`.
         *
         * WARNING: Any other properties may be changed and are not guaranteed to work in the future.
         */
        VSCodeOscPt["Property"] = "P";
        /**
         * Sets a mark/point-of-interest in the buffer. `OSC 633 ; SetMark [; Id=<string>] [; Hidden]`
         * `Id` - The identifier of the mark that can be used to reference it
         * `Hidden` - When set, the mark will be available to reference internally but will not visible
         *
         * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
         */
        VSCodeOscPt["SetMark"] = "SetMark";
    })(VSCodeOscPt || (VSCodeOscPt = {}));
    /**
     * ITerm sequences
     */
    var ITermOscPt;
    (function (ITermOscPt) {
        /**
         * Sets a mark/point-of-interest in the buffer. `OSC 1337 ; SetMark`
         */
        ITermOscPt["SetMark"] = "SetMark";
        /**
         * Reports current working directory (CWD). `OSC 1337 ; CurrentDir=<Cwd> ST`
         */
        ITermOscPt["CurrentDir"] = "CurrentDir";
    })(ITermOscPt || (ITermOscPt = {}));
    /**
     * The shell integration addon extends xterm by reading shell integration sequences and creating
     * capabilities and passing along relevant sequences to the capabilities. This is meant to
     * encapsulate all handling/parsing of sequences so the capabilities don't need to.
     */
    class ShellIntegrationAddon extends lifecycle_1.Disposable {
        get status() { return this._status; }
        constructor(_nonce, _disableTelemetry, _telemetryService, _logService) {
            super();
            this._nonce = _nonce;
            this._disableTelemetry = _disableTelemetry;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this.capabilities = this._register(new terminalCapabilityStore_1.TerminalCapabilityStore());
            this._hasUpdatedTelemetry = false;
            this._commonProtocolDisposables = [];
            this._status = 0 /* ShellIntegrationStatus.Off */;
            this._onDidChangeStatus = new event_1.Emitter();
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this._register((0, lifecycle_1.toDisposable)(() => {
                this._clearActivationTimeout();
                this._disposeCommonProtocol();
            }));
        }
        _disposeCommonProtocol() {
            (0, lifecycle_1.dispose)(this._commonProtocolDisposables);
            this._commonProtocolDisposables.length = 0;
        }
        activate(xterm) {
            this._terminal = xterm;
            this.capabilities.add(3 /* TerminalCapability.PartialCommandDetection */, this._register(new partialCommandDetectionCapability_1.PartialCommandDetectionCapability(this._terminal)));
            this._register(xterm.parser.registerOscHandler(633 /* ShellIntegrationOscPs.VSCode */, data => this._handleVSCodeSequence(data)));
            this._register(xterm.parser.registerOscHandler(1337 /* ShellIntegrationOscPs.ITerm */, data => this._doHandleITermSequence(data)));
            this._commonProtocolDisposables.push(xterm.parser.registerOscHandler(133 /* ShellIntegrationOscPs.FinalTerm */, data => this._handleFinalTermSequence(data)));
            this._register(xterm.parser.registerOscHandler(7 /* ShellIntegrationOscPs.SetCwd */, data => this._doHandleSetCwd(data)));
            this._register(xterm.parser.registerOscHandler(9 /* ShellIntegrationOscPs.SetWindowsFriendlyCwd */, data => this._doHandleSetWindowsFriendlyCwd(data)));
            this._ensureCapabilitiesOrAddFailureTelemetry();
        }
        getMarkerId(terminal, vscodeMarkerId) {
            this._createOrGetBufferMarkDetection(terminal).getMark(vscodeMarkerId);
        }
        _handleFinalTermSequence(data) {
            const didHandle = this._doHandleFinalTermSequence(data);
            if (this._status === 0 /* ShellIntegrationStatus.Off */) {
                this._status = 1 /* ShellIntegrationStatus.FinalTerm */;
                this._onDidChangeStatus.fire(this._status);
            }
            return didHandle;
        }
        _doHandleFinalTermSequence(data) {
            if (!this._terminal) {
                return false;
            }
            // Pass the sequence along to the capability
            // It was considered to disable the common protocol in order to not confuse the VS Code
            // shell integration if both happen for some reason. This doesn't work for powerlevel10k
            // when instant prompt is enabled though. If this does end up being a problem we could pass
            // a type flag through the capability calls
            const [command, ...args] = data.split(';');
            switch (command) {
                case 'A':
                    this._createOrGetCommandDetection(this._terminal).handlePromptStart();
                    return true;
                case 'B':
                    // Ignore the command line for these sequences as it's unreliable for example in powerlevel10k
                    this._createOrGetCommandDetection(this._terminal).handleCommandStart({ ignoreCommandLine: true });
                    return true;
                case 'C':
                    this._createOrGetCommandDetection(this._terminal).handleCommandExecuted();
                    return true;
                case 'D': {
                    const exitCode = args.length === 1 ? parseInt(args[0]) : undefined;
                    this._createOrGetCommandDetection(this._terminal).handleCommandFinished(exitCode);
                    return true;
                }
            }
            return false;
        }
        _handleVSCodeSequence(data) {
            const didHandle = this._doHandleVSCodeSequence(data);
            if (!this._hasUpdatedTelemetry && didHandle) {
                this._telemetryService?.publicLog2('terminal/shellIntegrationActivationSucceeded');
                this._hasUpdatedTelemetry = true;
                this._clearActivationTimeout();
            }
            if (this._status !== 2 /* ShellIntegrationStatus.VSCode */) {
                this._status = 2 /* ShellIntegrationStatus.VSCode */;
                this._onDidChangeStatus.fire(this._status);
            }
            return didHandle;
        }
        async _ensureCapabilitiesOrAddFailureTelemetry() {
            if (!this._telemetryService || this._disableTelemetry) {
                return;
            }
            this._activationTimeout = setTimeout(() => {
                if (!this.capabilities.get(2 /* TerminalCapability.CommandDetection */) && !this.capabilities.get(0 /* TerminalCapability.CwdDetection */)) {
                    this._telemetryService?.publicLog2('terminal/shellIntegrationActivationTimeout');
                    this._logService.warn('Shell integration failed to add capabilities within 10 seconds');
                }
                this._hasUpdatedTelemetry = true;
            }, 10000);
        }
        _clearActivationTimeout() {
            if (this._activationTimeout !== undefined) {
                clearTimeout(this._activationTimeout);
                this._activationTimeout = undefined;
            }
        }
        _doHandleVSCodeSequence(data) {
            if (!this._terminal) {
                return false;
            }
            // Pass the sequence along to the capability
            const argsIndex = data.indexOf(';');
            const sequenceCommand = argsIndex === -1 ? data : data.substring(0, argsIndex);
            // Cast to strict checked index access
            const args = argsIndex === -1 ? [] : data.substring(argsIndex + 1).split(';');
            switch (sequenceCommand) {
                case "A" /* VSCodeOscPt.PromptStart */:
                    this._createOrGetCommandDetection(this._terminal).handlePromptStart();
                    return true;
                case "B" /* VSCodeOscPt.CommandStart */:
                    this._createOrGetCommandDetection(this._terminal).handleCommandStart();
                    return true;
                case "C" /* VSCodeOscPt.CommandExecuted */:
                    this._createOrGetCommandDetection(this._terminal).handleCommandExecuted();
                    return true;
                case "D" /* VSCodeOscPt.CommandFinished */: {
                    const arg0 = args[0];
                    const exitCode = arg0 !== undefined ? parseInt(arg0) : undefined;
                    this._createOrGetCommandDetection(this._terminal).handleCommandFinished(exitCode);
                    return true;
                }
                case "E" /* VSCodeOscPt.CommandLine */: {
                    const arg0 = args[0];
                    const arg1 = args[1];
                    let commandLine;
                    if (arg0 !== undefined) {
                        commandLine = deserializeMessage(arg0);
                    }
                    else {
                        commandLine = '';
                    }
                    this._createOrGetCommandDetection(this._terminal).setCommandLine(commandLine, arg1 === this._nonce);
                    return true;
                }
                case "F" /* VSCodeOscPt.ContinuationStart */: {
                    this._createOrGetCommandDetection(this._terminal).handleContinuationStart();
                    return true;
                }
                case "G" /* VSCodeOscPt.ContinuationEnd */: {
                    this._createOrGetCommandDetection(this._terminal).handleContinuationEnd();
                    return true;
                }
                case "H" /* VSCodeOscPt.RightPromptStart */: {
                    this._createOrGetCommandDetection(this._terminal).handleRightPromptStart();
                    return true;
                }
                case "I" /* VSCodeOscPt.RightPromptEnd */: {
                    this._createOrGetCommandDetection(this._terminal).handleRightPromptEnd();
                    return true;
                }
                case "P" /* VSCodeOscPt.Property */: {
                    const arg0 = args[0];
                    const deserialized = arg0 !== undefined ? deserializeMessage(arg0) : '';
                    const { key, value } = parseKeyValueAssignment(deserialized);
                    if (value === undefined) {
                        return true;
                    }
                    switch (key) {
                        case 'Cwd': {
                            this._updateCwd(value);
                            return true;
                        }
                        case 'IsWindows': {
                            this._createOrGetCommandDetection(this._terminal).setIsWindowsPty(value === 'True' ? true : false);
                            return true;
                        }
                        case 'Task': {
                            this._createOrGetBufferMarkDetection(this._terminal);
                            this.capabilities.get(2 /* TerminalCapability.CommandDetection */)?.setIsCommandStorageDisabled();
                            return true;
                        }
                    }
                }
                case "SetMark" /* VSCodeOscPt.SetMark */: {
                    this._createOrGetBufferMarkDetection(this._terminal).addMark(parseMarkSequence(args));
                    return true;
                }
            }
            // Unrecognized sequence
            return false;
        }
        _updateCwd(value) {
            value = (0, terminalEnvironment_1.sanitizeCwd)(value);
            this._createOrGetCwdDetection().updateCwd(value);
            const commandDetection = this.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            commandDetection?.setCwd(value);
        }
        _doHandleITermSequence(data) {
            if (!this._terminal) {
                return false;
            }
            const [command] = data.split(';');
            switch (command) {
                case "SetMark" /* ITermOscPt.SetMark */: {
                    this._createOrGetBufferMarkDetection(this._terminal).addMark();
                }
                default: {
                    // Checking for known `<key>=<value>` pairs.
                    // Note that unlike `VSCodeOscPt.Property`, iTerm2 does not interpret backslash or hex-escape sequences.
                    // See: https://github.com/gnachman/iTerm2/blob/bb0882332cec5196e4de4a4225978d746e935279/sources/VT100Terminal.m#L2089-L2105
                    const { key, value } = parseKeyValueAssignment(command);
                    if (value === undefined) {
                        // No '=' was found, so it's not a property assignment.
                        return true;
                    }
                    switch (key) {
                        case "CurrentDir" /* ITermOscPt.CurrentDir */:
                            // Encountered: `OSC 1337 ; CurrentDir=<Cwd> ST`
                            this._updateCwd(value);
                            return true;
                    }
                }
            }
            // Unrecognized sequence
            return false;
        }
        _doHandleSetWindowsFriendlyCwd(data) {
            if (!this._terminal) {
                return false;
            }
            const [command, ...args] = data.split(';');
            switch (command) {
                case '9':
                    // Encountered `OSC 9 ; 9 ; <cwd> ST`
                    if (args.length) {
                        this._updateCwd(args[0]);
                    }
                    return true;
            }
            // Unrecognized sequence
            return false;
        }
        /**
         * Handles the sequence: `OSC 7 ; scheme://cwd ST`
         */
        _doHandleSetCwd(data) {
            if (!this._terminal) {
                return false;
            }
            const [command] = data.split(';');
            if (command.match(/^file:\/\/.*\//)) {
                const uri = uri_1.URI.parse(command);
                if (uri.path && uri.path.length > 0) {
                    this._updateCwd(uri.path);
                    return true;
                }
            }
            // Unrecognized sequence
            return false;
        }
        serialize() {
            if (!this._terminal || !this.capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                return {
                    isWindowsPty: false,
                    commands: []
                };
            }
            const result = this._createOrGetCommandDetection(this._terminal).serialize();
            return result;
        }
        deserialize(serialized) {
            if (!this._terminal) {
                throw new Error('Cannot restore commands before addon is activated');
            }
            this._createOrGetCommandDetection(this._terminal).deserialize(serialized);
        }
        _createOrGetCwdDetection() {
            let cwdDetection = this.capabilities.get(0 /* TerminalCapability.CwdDetection */);
            if (!cwdDetection) {
                cwdDetection = this._register(new cwdDetectionCapability_1.CwdDetectionCapability());
                this.capabilities.add(0 /* TerminalCapability.CwdDetection */, cwdDetection);
            }
            return cwdDetection;
        }
        _createOrGetCommandDetection(terminal) {
            let commandDetection = this.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (!commandDetection) {
                commandDetection = this._register(new commandDetectionCapability_1.CommandDetectionCapability(terminal, this._logService));
                this.capabilities.add(2 /* TerminalCapability.CommandDetection */, commandDetection);
            }
            return commandDetection;
        }
        _createOrGetBufferMarkDetection(terminal) {
            let bufferMarkDetection = this.capabilities.get(4 /* TerminalCapability.BufferMarkDetection */);
            if (!bufferMarkDetection) {
                bufferMarkDetection = this._register(new bufferMarkCapability_1.BufferMarkCapability(terminal));
                this.capabilities.add(4 /* TerminalCapability.BufferMarkDetection */, bufferMarkDetection);
            }
            return bufferMarkDetection;
        }
    }
    exports.ShellIntegrationAddon = ShellIntegrationAddon;
    function deserializeMessage(message) {
        return message.replaceAll(
        // Backslash ('\') followed by an escape operator: either another '\', or 'x' and two hex chars.
        /\\(\\|x([0-9a-f]{2}))/gi, 
        // If it's a hex value, parse it to a character.
        // Otherwise the operator is '\', which we return literally, now unescaped.
        (_match, op, hex) => hex ? String.fromCharCode(parseInt(hex, 16)) : op);
    }
    function parseKeyValueAssignment(message) {
        const separatorIndex = message.indexOf('=');
        if (separatorIndex === -1) {
            return { key: message, value: undefined }; // No '=' was found.
        }
        return {
            key: message.substring(0, separatorIndex),
            value: message.substring(1 + separatorIndex)
        };
    }
    function parseMarkSequence(sequence) {
        let id = undefined;
        let hidden = false;
        for (const property of sequence) {
            // Sanity check, this shouldn't happen in practice
            if (property === undefined) {
                continue;
            }
            if (property === 'Hidden') {
                hidden = true;
            }
            if (property.startsWith('Id=')) {
                id = property.substring(3);
            }
        }
        return { id, hidden };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGxJbnRlZ3JhdGlvbkFkZG9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24veHRlcm0vc2hlbGxJbnRlZ3JhdGlvbkFkZG9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1oQmhHLGdEQU9DO0lBRUQsMERBU0M7SUFHRCw4Q0FnQkM7SUFsaUJEOzs7Ozs7Ozs7Ozs7T0FZRztJQUVIOztPQUVHO0lBQ0gsSUFBVyxxQkFnQlY7SUFoQkQsV0FBVyxxQkFBcUI7UUFDL0I7O1dBRUc7UUFDSCw2RUFBZSxDQUFBO1FBQ2Y7OztXQUdHO1FBQ0gsdUVBQVksQ0FBQTtRQUNaOztXQUVHO1FBQ0gsc0VBQVksQ0FBQTtRQUNaLHFFQUFVLENBQUE7UUFDVixtR0FBeUIsQ0FBQTtJQUMxQixDQUFDLEVBaEJVLHFCQUFxQixLQUFyQixxQkFBcUIsUUFnQi9CO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0gsSUFBVyxXQXlHVjtJQXpHRCxXQUFXLFdBQVc7UUFDckI7OztXQUdHO1FBQ0gsZ0NBQWlCLENBQUE7UUFFakI7OztXQUdHO1FBQ0gsaUNBQWtCLENBQUE7UUFFbEI7OztXQUdHO1FBQ0gsb0NBQXFCLENBQUE7UUFFckI7Ozs7V0FJRztRQUNILG9DQUFxQixDQUFBO1FBRXJCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBeUJHO1FBQ0gsZ0NBQWlCLENBQUE7UUFFakI7Ozs7V0FJRztRQUNILHNDQUF1QixDQUFBO1FBRXZCOzs7O1dBSUc7UUFDSCxvQ0FBcUIsQ0FBQTtRQUVyQjs7OztXQUlHO1FBQ0gscUNBQXNCLENBQUE7UUFFdEI7Ozs7V0FJRztRQUNILG1DQUFvQixDQUFBO1FBRXBCOzs7Ozs7Ozs7Ozs7V0FZRztRQUNILDZCQUFjLENBQUE7UUFFZDs7Ozs7O1dBTUc7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