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
define(["require", "exports", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/platform/terminal/common/capabilities/commandDetection/terminalCommand"], function (require, exports, async_1, decorators_1, event_1, lifecycle_1, log_1, terminalCommand_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandDetectionCapability = void 0;
    exports.getLinesForCommand = getLinesForCommand;
    class CommandDetectionCapability extends lifecycle_1.Disposable {
        get commands() { return this._commands; }
        get executingCommand() { return this._currentCommand.command; }
        // TODO: as is unsafe here and it duplicates behavor of executingCommand
        get executingCommandObject() {
            if (this._currentCommand.commandStartMarker) {
                return { marker: this._currentCommand.commandStartMarker };
            }
            return undefined;
        }
        get currentCommand() {
            return this._currentCommand;
        }
        get cwd() { return this._cwd; }
        get _isInputting() {
            return !!(this._currentCommand.commandStartMarker && !this._currentCommand.commandExecutedMarker);
        }
        get hasInput() {
            if (!this._isInputting || !this._currentCommand?.commandStartMarker) {
                return undefined;
            }
            if (this._terminal.buffer.active.baseY + this._terminal.buffer.active.cursorY === this._currentCommand.commandStartMarker?.line) {
                const line = this._terminal.buffer.active.getLine(this._terminal.buffer.active.cursorY)?.translateToString(true, this._currentCommand.commandStartX);
                if (line === undefined) {
                    return undefined;
                }
                return line.length > 0;
            }
            return true;
        }
        constructor(_terminal, _logService) {
            super();
            this._terminal = _terminal;
            this._logService = _logService;
            this.type = 2 /* TerminalCapability.CommandDetection */;
            this._commands = [];
            this._currentCommand = new terminalCommand_1.PartialTerminalCommand(this._terminal);
            this._commandMarkers = [];
            this.__isCommandStorageDisabled = false;
            this._onCommandStarted = this._register(new event_1.Emitter());
            this.onCommandStarted = this._onCommandStarted.event;
            this._onBeforeCommandFinished = this._register(new event_1.Emitter());
            this.onBeforeCommandFinished = this._onBeforeCommandFinished.event;
            this._onCommandFinished = this._register(new event_1.Emitter());
            this.onCommandFinished = this._onCommandFinished.event;
            this._onCommandExecuted = this._register(new event_1.Emitter());
            this.onCommandExecuted = this._onCommandExecuted.event;
            this._onCommandInvalidated = this._register(new event_1.Emitter());
            this.onCommandInvalidated = this._onCommandInvalidated.event;
            this._onCurrentCommandInvalidated = this._register(new event_1.Emitter());
            this.onCurrentCommandInvalidated = this._onCurrentCommandInvalidated.event;
            // Set up platform-specific behaviors
            const that = this;
            this._ptyHeuristicsHooks = new class {
                get onCurrentCommandInvalidatedEmitter() { return that._onCurrentCommandInvalidated; }
                get onCommandStartedEmitter() { return that._onCommandStarted; }
                get onCommandExecutedEmitter() { return that._onCommandExecuted; }
                get dimensions() { return that._dimensions; }
                get isCommandStorageDisabled() { return that.__isCommandStorageDisabled; }
                get commandMarkers() { return that._commandMarkers; }
                set commandMarkers(value) { that._commandMarkers = value; }
                get clearCommandsInViewport() { return that._clearCommandsInViewport.bind(that); }
                commitCommandFinished() {
                    that._commitCommandFinished?.flush();
                    that._commitCommandFinished = undefined;
                }
            };
            this._ptyHeuristics = this._register(new lifecycle_1.MandatoryMutableDisposable(new UnixPtyHeuristics(this._terminal, this, this._ptyHeuristicsHooks, this._logService)));
            this._dimensions = {
                cols: this._terminal.cols,
                rows: this._terminal.rows
            };
            this._register(this._terminal.onResize(e => this._handleResize(e)));
            this._register(this._terminal.onCursorMove(() => this._handleCursorMove()));
        }
        _handleResize(e) {
            this._ptyHeuristics.value.preHandleResize?.(e);
            this._dimensions.cols = e.cols;
            this._dimensions.rows = e.rows;
        }
        _handleCursorMove() {
            // Early versions of conpty do not have real support for an alt buffer, in addition certain
            // commands such as tsc watch will write to the top of the normal buffer. The following
            // checks when the cursor has moved while the normal buffer is empty and if it is above the
            // current command, all decorations within the viewport will be invalidated.
            //
            // This function is debounced so that the cursor is only checked when it is stable so
            // conpty's screen reprinting will not trigger decoration clearing.
            //
            // This is mostly a workaround for Windows but applies to all OS' because of the tsc watch
            // case.
            if (this._terminal.buffer.active === this._terminal.buffer.normal && this._currentCommand.commandStartMarker) {
                if (this._terminal.buffer.active.baseY + this._terminal.buffer.active.cursorY < this._currentCommand.commandStartMarker.line) {
                    this._clearCommandsInViewport();
                    this._currentCommand.isInvalid = true;
                    this._onCurrentCommandInvalidated.fire({ reason: "windows" /* CommandInvalidationReason.Windows */ });
                }
            }
        }
        _clearCommandsInViewport() {
            // Find the number of commands on the tail end of the array that are within the viewport
            let count = 0;
            for (let i = this._commands.length - 1; i >= 0; i--) {
                const line = this._commands[i].marker?.line;
                if (line && line < this._terminal.buffer.active.baseY) {
                    break;
                }
                count++;
            }
            // Remove them
            if (count > 0) {
                this._onCommandInvalidated.fire(this._commands.splice(this._commands.length - count, count));
            }
        }
        setCwd(value) {
            this._cwd = value;
        }
        setIsWindowsPty(value) {
            if (value && !(this._ptyHeuristics.value instanceof WindowsPtyHeuristics)) {
                const that = this;
                this._ptyHeuristics.value = new WindowsPtyHeuristics(this._terminal, this, new class {
                    get onCurrentCommandInvalidatedEmitter() { return that._onCurrentCommandInvalidated; }
                    get onCommandStartedEmitter() { return that._onCommandStarted; }
                    get onCommandExecutedEmitter() { return that._onCommandExecuted; }
                    get dimensions() { return that._dimensions; }
                    get isCommandStorageDisabled() { return that.__isCommandStorageDisabled; }
                    get commandMarkers() { return that._commandMarkers; }
                    set commandMarkers(value) { that._commandMarkers = value; }
                    get clearCommandsInViewport() { return that._clearCommandsInViewport.bind(that); }
                    commitCommandFinished() {
                        that._commitCommandFinished?.flush();
                        that._commitCommandFinished = undefined;
                    }
                }, this._logService);
            }
            else if (!value && !(this._ptyHeuristics.value instanceof UnixPtyHeuristics)) {
                this._ptyHeuristics.value = new UnixPtyHeuristics(this._terminal, this, this._ptyHeuristicsHooks, this._logService);
            }
        }
        setIsCommandStorageDisabled() {
            this.__isCommandStorageDisabled = true;
        }
        getCommandForLine(line) {
            // Handle the current partial command first, anything below it's prompt is considered part
            // of the current command
            if (this._currentCommand.promptStartMarker && line >= this._currentCommand.promptStartMarker?.line) {
                return this._currentCommand;
            }
            // No commands
            if (this._commands.length === 0) {
                return undefined;
            }
            // Line is before any registered commands
            if ((this._commands[0].promptStartMarker ?? this._commands[0].marker).line > line) {
                return undefined;
            }
            // Iterate backwards through commands to find the right one
            for (let i = this.commands.length - 1; i >= 0; i--) {
                if ((this.commands[i].promptStartMarker ?? this.commands[i].marker).line <= line) {
                    return this.commands[i];
                }
            }
            return undefined;
        }
        getCwdForLine(line) {
            // Handle the current partial command first, anything below it's prompt is considered part
            // of the current command
            if (this._currentCommand.promptStartMarker && line >= this._currentCommand.promptStartMarker?.line) {
                return this._cwd;
            }
            const command = this.getCommandForLine(line);
            if (command && 'cwd' in command) {
                return command.cwd;
            }
            return undefined;
        }
        handlePromptStart(options) {
            // Adjust the last command's finished marker when needed. The standard position for the
            // finished marker `D` to appear is at the same position as the following prompt started
            // `A`.
            const lastCommand = this.commands.at(-1);
            if (lastCommand?.endMarker && lastCommand?.executedMarker && lastCommand.endMarker.line === lastCommand.executedMarker.line) {
                this._logService.debug('CommandDetectionCapability#handlePromptStart adjusted commandFinished', `${lastCommand.endMarker.line} -> ${lastCommand.executedMarker.line + 1}`);
                lastCommand.endMarker = cloneMarker(this._terminal, lastCommand.executedMarker, 1);
            }
            this._currentCommand.promptStartMarker = options?.marker || (lastCommand?.endMarker ? cloneMarker(this._terminal, lastCommand.endMarker) : this._terminal.registerMarker(0));
            this._logService.debug('CommandDetectionCapability#handlePromptStart', this._terminal.buffer.active.cursorX, this._currentCommand.promptStartMarker?.line);
        }
        handleContinuationStart() {
            this._currentCommand.currentContinuationMarker = this._terminal.registerMarker(0);
            this._logService.debug('CommandDetectionCapability#handleContinuationStart', this._currentCommand.currentContinuationMarker);
        }
        handleContinuationEnd() {
            if (!this._currentCommand.currentContinuationMarker) {
                this._logService.warn('CommandDetectionCapability#handleContinuationEnd Received continuation end without start');
                return;
            }
            if (!this._currentCommand.continuations) {
                this._currentCommand.continuations = [];
            }
            this._currentCommand.continuations.push({
                marker: this._currentCommand.currentContinuationMarker,
                end: this._terminal.buffer.active.cursorX
            });
            this._currentCommand.currentContinuationMarker = undefined;
            this._logService.debug('CommandDetectionCapability#handleContinuationEnd', this._currentCommand.continuations[this._currentCommand.continuations.length - 1]);
        }
        handleRightPromptStart() {
            this._currentCommand.commandRightPromptStartX = this._terminal.buffer.active.cursorX;
            this._logService.debug('CommandDetectionCapability#handleRightPromptStart', this._currentCommand.commandRightPromptStartX);
        }
        handleRightPromptEnd() {
            this._currentCommand.commandRightPromptEndX = this._terminal.buffer.active.cursorX;
            this._logService.debug('CommandDetectionCapability#handleRightPromptEnd', this._currentCommand.commandRightPromptEndX);
        }
        handleCommandStart(options) {
            this._handleCommandStartOptions = options;
            // Only update the column if the line has already been set
            this._currentCommand.commandStartMarker = options?.marker || this._currentCommand.commandStartMarker;
            if (this._currentCommand.commandStartMarker?.line === this._terminal.buffer.active.cursorY) {
                this._currentCommand.commandStartX = this._terminal.buffer.active.cursorX;
                this._logService.debug('CommandDetectionCapability#handleCommandStart', this._currentCommand.commandStartX, this._currentCommand.commandStartMarker?.line);
                return;
            }
            this._ptyHeuristics.value.handleCommandStart(options);
        }
        handleGenericCommand(options) {
            if (options?.markProperties?.disableCommandStorage) {
                this.setIsCommandStorageDisabled();
            }
            this.handlePromptStart(options);
            this.handleCommandStart(options);
            this.handleCommandExecuted(options);
            this.handleCommandFinished(undefined, options);
        }
        handleCommandExecuted(options) {
            this._ptyHeuristics.value.handleCommandExecuted(options);
            this._currentCommand.markExecutedTime();
        }
        handleCommandFinished(exitCode, options) {
            this._currentCommand.markFinishedTime();
            this._ptyHeuristics.value.preHandleCommandFinished?.();
            this._logService.debug('CommandDetectionCapability#handleCommandFinished', this._terminal.buffer.active.cursorX, options?.marker?.line, this._currentCommand.command, this._currentCommand);
            // HACK: Handle a special case on some versions of bash where identical commands get merged
            // in the output of `history`, this detects that case and sets the exit code to the the last
            // command's exit code. This covered the majority of cases but will fail if the same command
            // runs with a different exit code, that will need a more robust fix where we send the
            // command ID and exit code over to the capability to adjust there.
            if (exitCode === undefined) {
                const lastCommand = this.commands.length > 0 ? this.commands[this.commands.length - 1] : undefined;
                if (this._currentCommand.command && this._currentCommand.command.length > 0 && lastCommand?.command === this._currentCommand.command) {
                    exitCode = lastCommand.exitCode;
                }
            }
            if (this._currentCommand.commandStartMarker === undefined || !this._terminal.buffer.active) {
                return;
            }
            this._currentCommand.commandFinishedMarker = options?.marker || this._terminal.registerMarker(0);
            this._ptyHeuristics.value.postHandleCommandFinished?.();
            const newCommand = this._currentCommand.promoteToFullCommand(this._cwd, exitCode, this._handleCommandStartOptions?.ignoreCommandLine ?? false, options?.markProperties);
            if (newCommand) {
                this._commands.push(newCommand);
                this._commitCommandFinished = new async_1.RunOnceScheduler(() => {
                    this._onBeforeCommandFinished.fire(newCommand);
                    if (!this._currentCommand.isInvalid) {
                        this._logService.debug('CommandDetectionCapability#onCommandFinished', newCommand);
                        this._onCommandFinished.fire(newCommand);
                    }
                }, 50);
                this._commitCommandFinished.schedule();
            }
            this._currentCommand = new terminalCommand_1.PartialTerminalCommand(this._terminal);
            this._handleCommandStartOptions = undefined;
        }
        setCommandLine(commandLine, isTrusted) {
            this._logService.debug('CommandDetectionCapability#setCommandLine', commandLine, isTrusted);
            this._currentCommand.command = commandLine;
            this._currentCommand.isTrusted = isTrusted;
        }
        serialize() {
            const commands = this.commands.map(e => e.serialize(this.__isCommandStorageDisabled));
            const partialCommand = this._currentCommand.serialize(this._cwd);
            if (partialCommand) {
                commands.push(partialCommand);
            }
            return {
                isWindowsPty: this._ptyHeuristics.value instanceof WindowsPtyHeuristics,
                commands
            };
        }
        deserialize(serialized) {
            if (serialized.isWindowsPty) {
                this.setIsWindowsPty(serialized.isWindowsPty);
            }
            const buffer = this._terminal.buffer.normal;
            for (const e of serialized.commands) {
                // Partial command
                if (!e.endLine) {
                    // Check for invalid command
                    const marker = e.startLine !== undefined ? this._terminal.registerMarker(e.startLine - (buffer.baseY + buffer.cursorY)) : undefined;
                    if (!marker) {
                        continue;
                    }
                    this._currentCommand.commandStartMarker = e.startLine !== undefined ? this._terminal.registerMarker(e.startLine - (buffer.baseY + buffer.cursorY)) : undefined;
                    this._currentCommand.commandStartX = e.startX;
                    this._currentCommand.promptStartMarker = e.promptStartLine !== undefined ? this._terminal.registerMarker(e.promptStartLine - (buffer.baseY + buffer.cursorY)) : undefined;
                    this._cwd = e.cwd;
                    this._onCommandStarted.fire({ marker });
                    continue;
                }
                // Full command
                const newCommand = terminalCommand_1.TerminalCommand.deserialize(this._terminal, e, this.__isCommandStorageDisabled);
                if (!newCommand) {
                    continue;
                }
                this._commands.push(newCommand);
                this._logService.debug('CommandDetectionCapability#onCommandFinished', newCommand);
                this._onCommandFinished.fire(newCommand);
            }
        }
    }
    exports.CommandDetectionCapability = CommandDetectionCapability;
    __decorate([
        (0, decorators_1.debounce)(500)
    ], CommandDetectionCapability.prototype, "_handleCursorMove", null);
    /**
     * Non-Windows-specific behavior.
     */
    class UnixPtyHeuristics extends lifecycle_1.Disposable {
        constructor(_terminal, _capability, _hooks, _logService) {
            super();
            this._terminal = _terminal;
            this._capability = _capability;
            this._hooks = _hooks;
            this._logService = _logService;
            this._register(_terminal.parser.registerCsiHandler({ final: 'J' }, params => {
                if (params.length >= 1 && (params[0] === 2 || params[0] === 3)) {
                    _hooks.clearCommandsInViewport();
                }
                // We don't want to override xterm.js' default behavior, just augment it
                return false;
            }));
        }
        async handleCommandStart(options) {
            this._hooks.commitCommandFinished();
            const currentCommand = this._capability.currentCommand;
            currentCommand.commandStartX = this._terminal.buffer.active.cursorX;
            currentCommand.commandStartMarker = options?.marker || this._terminal.registerMarker(0);
            // Clear executed as it must happen after command start
            currentCommand.commandExecutedMarker?.dispose();
            currentCommand.commandExecutedMarker = undefined;
            currentCommand.commandExecutedX = undefined;
            for (const m of this._hooks.commandMarkers) {
                m.dispose();
            }
            this._hooks.commandMarkers.length = 0;
            this._hooks.onCommandStartedEmitter.fire({ marker: options?.marker || currentCommand.commandStartMarker, markProperties: options?.markProperties });
            this._logService.debug('CommandDetectionCapability#handleCommandStart', currentCommand.commandStartX, currentCommand.commandStartMarker?.line);
        }
        handleCommandExecuted(options) {
            const currentCommand = this._capability.currentCommand;
            currentCommand.commandExecutedMarker = options?.marker || this._terminal.registerMarker(0);
            currentCommand.commandExecutedX = this._terminal.buffer.active.cursorX;
            this._logService.debug('CommandDetectionCapability#handleCommandExecuted', currentCommand.commandExecutedX, currentCommand.commandExecutedMarker?.line);
            // Sanity check optional props
            if (!currentCommand.commandStartMarker || !currentCommand.commandExecutedMarker || currentCommand.commandStartX === undefined) {
                return;
            }
            // Calculate the command
            currentCommand.command = this._hooks.isCommandStorageDisabled ? '' : this._terminal.buffer.active.getLine(currentCommand.commandStartMarker.line)?.translateToString(true, currentCommand.commandStartX, currentCommand.commandRightPromptStartX).trim();
            let y = currentCommand.commandStartMarker.line + 1;
            const commandExecutedLine = currentCommand.commandExecutedMarker.line;
            for (; y < commandExecutedLine; y++) {
                const line = this._terminal.buffer.active.getLine(y);
                if (line) {
                    const continuation = currentCommand.continuations?.find(e => e.marker.line === y);
                    if (continuation) {
                        currentCommand.command += '\n';
                    }
                    const startColumn = continuation?.end ?? 0;
                    currentCommand.command += line.translateToString(true, startColumn);
                }
            }
            if (y === commandExecutedLine) {
                currentCommand.command += this._terminal.buffer.active.getLine(commandExecutedLine)?.translateToString(true, undefined, currentCommand.commandExecutedX) || '';
            }
            this._hooks.onCommandExecutedEmitter.fire(currentCommand);
        }
    }
    var AdjustCommandStartMarkerConstants;
    (function (AdjustCommandStartMarkerConstants) {
        AdjustCommandStartMarkerConstants[AdjustCommandStartMarkerConstants["MaxCheckLineCount"] = 5] = "MaxCheckLineCount";
        AdjustCommandStartMarkerConstants[AdjustCommandStartMarkerConstants["Interval"] = 20] = "Interval";
        AdjustCommandStartMarkerConstants[AdjustCommandStartMarkerConstants["MaximumPollCount"] = 50] = "MaximumPollCount";
    })(AdjustCommandStartMarkerConstants || (AdjustCommandStartMarkerConstants = {}));
    /**
     * An object that integrated with and decorates the command detection capability to add heuristics
     * that adjust various markers to work better with Windows and ConPTY. This isn't depended upon the
     * frontend OS, or even the backend OS, but the `IsWindows` property which technically a non-Windows
     * client can emit (for example in tests).
     */
    let WindowsPtyHeuristics = class WindowsPtyHeuristics extends lifecycle_1.Disposable {
        constructor(_terminal, _capability, _hooks, _logService) {
            super();
            this._terminal = _terminal;
            this._capability = _capability;
            this._hooks = _hooks;
            this._logService = _logService;
            this._onCursorMoveListener = this._register(new lifecycle_1.MutableDisposable());
            this._tryAdjustCommandStartMarkerScannedLineCount = 0;
            this._tryAdjustCommandStartMarkerPollCount = 0;
            this._register(_terminal.parser.registerCsiHandler({ final: 'J' }, params => {
                // Clear commands when the viewport is cleared
                if (params.length >= 1 && (params[0] === 2 || params[0] === 3)) {
                    this._hooks.clearCommandsInViewport();
                }
                // We don't want to override xterm.js' default behavior, just augment it
                return false;
            }));
            this._register(this._capability.onBeforeCommandFinished(command => {
                // For older Windows backends we cannot listen to CSI J, instead we assume running clear
                // or cls will clear all commands in the viewport. This is not perfect but it's right
                // most of the time.
                if (command.command.trim().toLowerCase() === 'clear' || command.command.trim().toLowerCase() === 'cls') {
                    this._tryAdjustCommandStartMarkerScheduler?.cancel();
                    this._tryAdjustCommandStartMarkerScheduler = undefined;
                    this._hooks.clearCommandsInViewport();
                    this._capability.currentCommand.isInvalid = true;
                    this._hooks.onCurrentCommandInvalidatedEmitter.fire({ reason: "windows" /* CommandInvalidationReason.Windows */ });
                }
            }));
        }
        preHandleResize(e) {
            // Resize behavior is different under conpty; instead of bringing parts of the scrollback
            // back into the viewport, new lines are inserted at the bottom (ie. the same behavior as if
            // there was no scrollback).
            //
            // On resize this workaround will wait for a conpty reprint to occur by waiting for the
            // cursor to move, it will then calculate the number of lines that the commands within the
            // viewport _may have_ shifted. After verifying the content of the current line is
            // incorrect, the line after shifting is checked and if that matches delete events are fired
            // on the xterm.js buffer to move the markers.
            //
            // While a bit hacky, this approach is quite safe and seems to work great at least for pwsh.
            const baseY = this._terminal.buffer.active.baseY;
            const rowsDifference = e.rows - this._hooks.dimensions.rows;
            // Only do when rows increase, do in the next frame as this needs to happen after
            // conpty reprints the screen
            if (rowsDifference > 0) {
                this._waitForCursorMove().then(() => {
                    // Calculate the number of lines the content may have shifted, this will max out at
                    // scrollback count since the standard behavior will be used then
                    const potentialShiftedLineCount = Math.min(rowsDifference, baseY);
                    // For each command within the viewport, assume commands are in the correct order
                    for (let i = this._capability.commands.length - 1; i >= 0; i--) {
                        const command = this._capability.commands[i];
                        if (!command.marker || command.marker.line < baseY || command.commandStartLineContent === undefined) {
                            break;
                        }
                        const line = this._terminal.buffer.active.getLine(command.marker.line);
                        if (!line || line.translateToString(true) === command.commandStartLineContent) {
                            continue;
                        }
                        const shiftedY = command.marker.line - potentialShiftedLineCount;
                        const shiftedLine = this._terminal.buffer.active.getLine(shiftedY);
                        if (shiftedLine?.translateToString(true) !== command.commandStartLineContent) {
                            continue;
                        }
                        // HACK: xterm.js doesn't expose this by design as it's an internal core
                        // function an embedder could easily do damage with. Additionally, this
                        // can't really be upstreamed since the event relies on shell integration to
                        // verify the shifting is necessary.
                        this._terminal._core._bufferService.buffer.lines.onDeleteEmitter.fire({
                            index: this._terminal.buffer.active.baseY,
                            amount: potentialShiftedLineCount
                        });
                    }
                });
            }
        }
        async handleCommandStart() {
            this._capability.currentCommand.commandStartX = this._terminal.buffer.active.cursorX;
            // On Windows track all cursor movements after the command start sequence
            this._hooks.commandMarkers.length = 0;
            const initialCommandStartMarker = this._capability.currentCommand.commandStartMarker = (this._capability.currentCommand.promptStartMarker
                ? cloneMarker(this._terminal, this._capability.currentCommand.promptStartMarker)
                : this._terminal.registerMarker(0));
            this._capability.currentCommand.commandStartX = 0;
            // DEBUG: Add a decoration for the original unadjusted command start position
            // if ('registerDecoration' in this._terminal) {
            // 	const d = (this._terminal as any).registerDecoration({
            // 		marker: this._capability.currentCommand.commandStartMarker,
            // 		x: this._capability.currentCommand.commandStartX
            // 	});
            // 	d?.onRender((e: HTMLElement) => {
            // 		e.textContent = 'b';
            // 		e.classList.add('xterm-sequence-decoration', 'top', 'right');
            // 		e.title = 'Initial command start position';
            // 	});
            // }
            // The command started sequence may be printed before the actual prompt is, for example a
            // multi-line prompt will typically look like this where D, A and B signify the command
            // finished, prompt started and command started sequences respectively:
            //
            //     D/my/cwdB
            //     > C
            //
            // Due to this, it's likely that this will be called before the line has been parsed.
            // Unfortunately, it is also the case that the actual command start data may not be parsed
            // by the end of the task either, so a microtask cannot be used.
            //
            // The strategy used is to begin polling and scanning downwards for up to the next 5 lines.
            // If it looks like a prompt is found, the command started location is adjusted. If the
            // command executed sequences comes in before polling is done, polling is canceled and the
            // final polling task is executed synchronously.
            this._tryAdjustCommandStartMarkerScannedLineCount = 0;
            this._tryAdjustCommandStartMarkerPollCount = 0;
            this._tryAdjustCommandStartMarkerScheduler = new async_1.RunOnceScheduler(() => this._tryAdjustCommandStartMarker(initialCommandStartMarker), 20 /* AdjustCommandStartMarkerConstants.Interval */);
            this._tryAdjustCommandStartMarkerScheduler.schedule();
            // TODO: Cache details about polling for the future - eg. if it always fails, stop bothering
        }
        _tryAdjustCommandStartMarker(start) {
            if (this._store.isDisposed) {
                return;
            }
            const buffer = this._terminal.buffer.active;
            let scannedLineCount = this._tryAdjustCommandStartMarkerScannedLineCount;
            while (scannedLineCount < 5 /* AdjustCommandStartMarkerConstants.MaxCheckLineCount */ && start.line + scannedLineCount < buffer.baseY + this._terminal.rows) {
                if (this._cursorOnNextLine()) {
                    const prompt = this._getWindowsPrompt(start.line + scannedLineCount);
                    if (prompt) {
                        const adjustedPrompt = typeof prompt === 'string' ? prompt : prompt.prompt;
                        this._capability.currentCommand.commandStartMarker = this._terminal.registerMarker(0);
                        if (typeof prompt === 'object' && prompt.likelySingleLine) {
                            this._logService.debug('CommandDetectionCapability#_tryAdjustCommandStartMarker adjusted promptStart', `${this._capability.currentCommand.promptStartMarker?.line} -> ${this._capability.currentCommand.commandStartMarker.line}`);
                            this._capability.currentCommand.promptStartMarker?.dispose();
                            this._capability.currentCommand.promptStartMarker = cloneMarker(this._terminal, this._capability.currentCommand.commandStartMarker);
                            // Adjust the last command if it's not in the same position as the following
                            // prompt start marker
                            const lastCommand = this._capability.commands.at(-1);
                            if (lastCommand && this._capability.currentCommand.commandStartMarker.line !== lastCommand.endMarker?.line) {
                                lastCommand.endMarker?.dispose();
                                lastCommand.endMarker = cloneMarker(this._terminal, this._capability.currentCommand.commandStartMarker);
                            }
                        }
                        // use the regex to set the position as it's possible input has occurred
                        this._capability.currentCommand.commandStartX = adjustedPrompt.length;
                        this._logService.debug('CommandDetectionCapability#_tryAdjustCommandStartMarker adjusted commandStart', `${start.line} -> ${this._capability.currentCommand.commandStartMarker.line}:${this._capability.currentCommand.commandStartX}`);
                        this._flushPendingHandleCommandStartTask();
                        return;
                    }
                }
                scannedLineCount++;
            }
            if (scannedLineCount < 5 /* AdjustCommandStartMarkerConstants.MaxCheckLineCount */) {
                this._tryAdjustCommandStartMarkerScannedLineCount = scannedLineCount;
                if (this._tryAdjustCommandStartMarkerPollCount < 50 /* AdjustCommandStartMarkerConstants.MaximumPollCount */) {
                    this._tryAdjustCommandStartMarkerScheduler?.schedule();
                }
                else {
                    this._flushPendingHandleCommandStartTask();
                }
            }
            else {
                this._flushPendingHandleCommandStartTask();
            }
        }
        _flushPendingHandleCommandStartTask() {
            // Perform final try adjust if necessary
            if (this._tryAdjustCommandStartMarkerScheduler) {
                // Max out poll count to ensure it's the last run
                this._tryAdjustCommandStartMarkerPollCount = 50 /* AdjustCommandStartMarkerConstants.MaximumPollCount */;
                this._tryAdjustCommandStartMarkerScheduler.flush();
                this._tryAdjustCommandStartMarkerScheduler = undefined;
            }
            this._hooks.commitCommandFinished();
            if (!this._capability.currentCommand.commandExecutedMarker) {
                this._onCursorMoveListener.value = this._terminal.onCursorMove(() => {
                    if (this._hooks.commandMarkers.length === 0 || this._hooks.commandMarkers[this._hooks.commandMarkers.length - 1].line !== this._terminal.buffer.active.cursorY) {
                        const marker = this._terminal.registerMarker(0);
                        if (marker) {
                            this._hooks.commandMarkers.push(marker);
                        }
                    }
                });
            }
            if (this._capability.currentCommand.commandStartMarker) {
                const line = this._terminal.buffer.active.getLine(this._capability.currentCommand.commandStartMarker.line);
                if (line) {
                    this._capability.currentCommand.commandStartLineContent = line.translateToString(true);
                }
            }
            this._hooks.onCommandStartedEmitter.fire({ marker: this._capability.currentCommand.commandStartMarker });
            this._logService.debug('CommandDetectionCapability#_handleCommandStartWindows', this._capability.currentCommand.commandStartX, this._capability.currentCommand.commandStartMarker?.line);
        }
        handleCommandExecuted(options) {
            if (this._tryAdjustCommandStartMarkerScheduler) {
                this._flushPendingHandleCommandStartTask();
            }
            // Use the gathered cursor move markers to correct the command start and executed markers
            this._onCursorMoveListener.clear();
            this._evaluateCommandMarkers();
            this._capability.currentCommand.commandExecutedX = this._terminal.buffer.active.cursorX;
            this._hooks.onCommandExecutedEmitter.fire(this._capability.currentCommand);
            this._logService.debug('CommandDetectionCapability#handleCommandExecuted', this._capability.currentCommand.commandExecutedX, this._capability.currentCommand.commandExecutedMarker?.line);
        }
        preHandleCommandFinished() {
            if (this._capability.currentCommand.commandExecutedMarker) {
                return;
            }
            // This is done on command finished just in case command executed never happens (for example
            // PSReadLine tab completion)
            if (this._hooks.commandMarkers.length === 0) {
                // If the command start timeout doesn't happen before command finished, just use the
                // current marker.
                if (!this._capability.currentCommand.commandStartMarker) {
                    this._capability.currentCommand.commandStartMarker = this._terminal.registerMarker(0);
                }
                if (this._capability.currentCommand.commandStartMarker) {
                    this._hooks.commandMarkers.push(this._capability.currentCommand.commandStartMarker);
                }
            }
            this._evaluateCommandMarkers();
        }
        postHandleCommandFinished() {
            const currentCommand = this._capability.currentCommand;
            const commandText = currentCommand.command;
            const commandLine = currentCommand.commandStartMarker?.line;
            const executedLine = currentCommand.commandExecutedMarker?.line;
            if (!commandText || commandText.length === 0 ||
                commandLine === undefined || commandLine === -1 ||
                executedLine === undefined || executedLine === -1) {
                return;
            }
            // Scan downwards from the command start line and search for every character in the actual
            // command line. This may end up matching the wrong characters, but it shouldn't matter at
            // least in the typical case as the entire command will still get matched.
            let current = 0;
            let found = false;
            for (let i = commandLine; i <= executedLine; i++) {
                const line = this._terminal.buffer.active.getLine(i);
                if (!line) {
                    break;
                }
                const text = line.translateToString(true);
                for (let j = 0; j < text.length; j++) {
                    // Skip whitespace in case it was not actually rendered or could be trimmed from the
                    // end of the line
                    while (commandText.length < current && commandText[current] === ' ') {
                        current++;
                    }
                    // Character match
                    if (text[j] === commandText[current]) {
                        current++;
                    }
                    // Full command match
                    if (current === commandText.length) {
                        // It's ambiguous whether the command executed marker should ideally appear at
                        // the end of the line or at the beginning of the next line. Since it's more
                        // useful for extracting the command at the end of the current line we go with
                        // that.
                        const wrapsToNextLine = j >= this._terminal.cols - 1;
                        currentCommand.commandExecutedMarker = this._terminal.registerMarker(i - (this._terminal.buffer.active.baseY + this._terminal.buffer.active.cursorY) + (wrapsToNextLine ? 1 : 0));
                        currentCommand.commandExecutedX = wrapsToNextLine ? 0 : j + 1;
                        found = true;
                        break;
                    }
                }
                if (found) {
                    break;
                }
            }
        }
        _evaluateCommandMarkers() {
            // On Windows, use the gathered cursor move markers to correct the command start and
            // executed markers.
            if (this._hooks.commandMarkers.length === 0) {
                return;
            }
            this._hooks.commandMarkers = this._hooks.commandMarkers.sort((a, b) => a.line - b.line);
            this._capability.currentCommand.commandStartMarker = this._hooks.commandMarkers[0];
            if (this._capability.currentCommand.commandStartMarker) {
                const line = this._terminal.buffer.active.getLine(this._capability.currentCommand.commandStartMarker.line);
                if (line) {
                    this._capability.currentCommand.commandStartLineContent = line.translateToString(true);
                }
            }
            this._capability.currentCommand.commandExecutedMarker = this._hooks.commandMarkers[this._hooks.commandMarkers.length - 1];
            // Fire this now to prevent issues like #197409
            this._hooks.onCommandExecutedEmitter.fire(this._capability.currentCommand);
        }
        _cursorOnNextLine() {
            const lastCommand = this._capability.commands.at(-1);
            // There is only a single command, so this check is unnecessary
            if (!lastCommand) {
                return true;
            }
            const cursorYAbsolute = this._terminal.buffer.active.baseY + this._terminal.buffer.active.cursorY;
            // If the cursor position is within the last command, we should poll.
            const lastCommandYAbsolute = (lastCommand.endMarker ? lastCommand.endMarker.line : lastCommand.marker?.line) ?? -1;
            return cursorYAbsolute > lastCommandYAbsolute;
        }
        _waitForCursorMove() {
            const cursorX = this._terminal.buffer.active.cursorX;
            const cursorY = this._terminal.buffer.active.cursorY;
            let totalDelay = 0;
            return new Promise((resolve, reject) => {
                const interval = setInterval(() => {
                    if (cursorX !== this._terminal.buffer.active.cursorX || cursorY !== this._terminal.buffer.active.cursorY) {
                        resolve();
                        clearInterval(interval);
                        return;
                    }
                    totalDelay += 10;
                    if (totalDelay > 1000) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 10);
            });
        }
        _getWindowsPrompt(y = this._terminal.buffer.active.baseY + this._terminal.buffer.active.cursorY) {
            const line = this._terminal.buffer.active.getLine(y);
            if (!line) {
                return;
            }
            // TODO: fine tune prompt regex to accomodate for unique configurations.
            const lineText = line.translateToString(true);
            if (!lineText) {
                return;
            }
            // PowerShell
            const pwshPrompt = lineText.match(/(?<prompt>(\(.+\)\s)?(?:PS.+>\s?))/)?.groups?.prompt;
            if (pwshPrompt) {
                const adjustedPrompt = this._adjustPrompt(pwshPrompt, lineText, '>');
                if (adjustedPrompt) {
                    return {
                        prompt: adjustedPrompt,
                        likelySingleLine: true
                    };
                }
            }
            // Custom prompts like starship end in the common \u276f character
            const customPrompt = lineText.match(/.*\u276f(?=[^\u276f]*$)/g)?.[0];
            if (customPrompt) {
                const adjustedPrompt = this._adjustPrompt(customPrompt, lineText, '\u276f');
                if (adjustedPrompt) {
                    return adjustedPrompt;
                }
            }
            // Python Prompt
            const pythonPrompt = lineText.match(/^(?<prompt>>>> )/g)?.groups?.prompt;
            if (pythonPrompt) {
                return {
                    prompt: pythonPrompt,
                    likelySingleLine: true
                };
            }
            // Command Prompt
            const cmdMatch = lineText.match(/^(?<prompt>(\(.+\)\s)?(?:[A-Z]:\\.*>))/);
            return cmdMatch?.groups?.prompt ? {
                prompt: cmdMatch.groups.prompt,
                likelySingleLine: true
            } : undefined;
        }
        _adjustPrompt(prompt, lineText, char) {
            if (!prompt) {
                return;
            }
            // Conpty may not 'render' the space at the end of the prompt
            if (lineText === prompt && prompt.endsWith(char)) {
                prompt += ' ';
            }
            return prompt;
        }
    };
    WindowsPtyHeuristics = __decorate([
        __param(3, log_1.ILogService)
    ], WindowsPtyHeuristics);
    function getLinesForCommand(buffer, command, cols, outputMatcher) {
        if (!outputMatcher) {
            return undefined;
        }
        const executedMarker = command.executedMarker;
        const endMarker = command.endMarker;
        if (!executedMarker || !endMarker) {
            return undefined;
        }
        const startLine = executedMarker.line;
        const endLine = endMarker.line;
        const linesToCheck = outputMatcher.length;
        const lines = [];
        if (outputMatcher.anchor === 'bottom') {
            for (let i = endLine - (outputMatcher.offset || 0); i >= startLine; i--) {
                let wrappedLineStart = i;
                const wrappedLineEnd = i;
                while (wrappedLineStart >= startLine && buffer.getLine(wrappedLineStart)?.isWrapped) {
                    wrappedLineStart--;
                }
                i = wrappedLineStart;
                lines.unshift(getXtermLineContent(buffer, wrappedLineStart, wrappedLineEnd, cols));
                if (lines.length > linesToCheck) {
                    lines.pop();
                }
            }
        }
        else {
            for (let i = startLine + (outputMatcher.offset || 0); i < endLine; i++) {
                const wrappedLineStart = i;
                let wrappedLineEnd = i;
                while (wrappedLineEnd + 1 < endLine && buffer.getLine(wrappedLineEnd + 1)?.isWrapped) {
                    wrappedLineEnd++;
                }
                i = wrappedLineEnd;
                lines.push(getXtermLineContent(buffer, wrappedLineStart, wrappedLineEnd, cols));
                if (lines.length === linesToCheck) {
                    lines.shift();
                }
            }
        }
        return lines;
    }
    function getXtermLineContent(buffer, lineStart, lineEnd, cols) {
        // Cap the maximum number of lines generated to prevent potential performance problems. This is
        // more of a sanity check as the wrapped line should already be trimmed down at this point.
        const maxLineLength = Math.max(2048 / cols * 2);
        lineEnd = Math.min(lineEnd, lineStart + maxLineLength);
        let content = '';
        for (let i = lineStart; i <= lineEnd; i++) {
            // Make sure only 0 to cols are considered as resizing when windows mode is enabled will
            // retain buffer data outside of the terminal width as reflow is disabled.
            const line = buffer.getLine(i);
            if (line) {
                content += line.translateToString(true, 0, cols);
            }
        }
        return content;
    }
    function cloneMarker(xterm, marker, offset = 0) {
        return xterm.registerMarker(marker.line - (xterm.buffer.active.baseY + xterm.buffer.active.cursorY) + offset);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZERldGVjdGlvbkNhcGFiaWxpdHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL2NvbW1vbi9jYXBhYmlsaXRpZXMvY29tbWFuZERldGVjdGlvbkNhcGFiaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNDVCaEcsZ0RBMENDO0lBbDdCRCxNQUFhLDBCQUEyQixTQUFRLHNCQUFVO1FBZ0J6RCxJQUFJLFFBQVEsS0FBaUMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNyRSxJQUFJLGdCQUFnQixLQUF5QixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNuRix3RUFBd0U7UUFDeEUsSUFBSSxzQkFBc0I7WUFDekIsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQzdDLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsRUFBc0IsQ0FBQztZQUNoRixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUNELElBQUksY0FBYztZQUNqQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUNELElBQUksR0FBRyxLQUF5QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ25ELElBQVksWUFBWTtZQUN2QixPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsa0JBQWtCLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDbkcsQ0FBQztRQUVELElBQUksUUFBUTtZQUNYLElBQUksQ0FBQyxJQUFJLENBQUMsWUFB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