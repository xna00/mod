/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PartialTerminalCommand = exports.TerminalCommand = void 0;
    class TerminalCommand {
        get command() { return this._properties.command; }
        get isTrusted() { return this._properties.isTrusted; }
        get timestamp() { return this._properties.timestamp; }
        get duration() { return this._properties.duration; }
        get promptStartMarker() { return this._properties.promptStartMarker; }
        get marker() { return this._properties.marker; }
        get endMarker() { return this._properties.endMarker; }
        set endMarker(value) { this._properties.endMarker = value; }
        get executedMarker() { return this._properties.executedMarker; }
        get aliases() { return this._properties.aliases; }
        get wasReplayed() { return this._properties.wasReplayed; }
        get cwd() { return this._properties.cwd; }
        get exitCode() { return this._properties.exitCode; }
        get commandStartLineContent() { return this._properties.commandStartLineContent; }
        get markProperties() { return this._properties.markProperties; }
        get executedX() { return this._properties.executedX; }
        get startX() { return this._properties.startX; }
        constructor(_xterm, _properties) {
            this._xterm = _xterm;
            this._properties = _properties;
        }
        static deserialize(xterm, serialized, isCommandStorageDisabled) {
            const buffer = xterm.buffer.normal;
            const marker = serialized.startLine !== undefined ? xterm.registerMarker(serialized.startLine - (buffer.baseY + buffer.cursorY)) : undefined;
            // Check for invalid command
            if (!marker) {
                return undefined;
            }
            const promptStartMarker = serialized.promptStartLine !== undefined ? xterm.registerMarker(serialized.promptStartLine - (buffer.baseY + buffer.cursorY)) : undefined;
            // Valid full command
            const endMarker = serialized.endLine !== undefined ? xterm.registerMarker(serialized.endLine - (buffer.baseY + buffer.cursorY)) : undefined;
            const executedMarker = serialized.executedLine !== undefined ? xterm.registerMarker(serialized.executedLine - (buffer.baseY + buffer.cursorY)) : undefined;
            const newCommand = new TerminalCommand(xterm, {
                command: isCommandStorageDisabled ? '' : serialized.command,
                isTrusted: serialized.isTrusted,
                promptStartMarker,
                marker,
                startX: serialized.startX,
                endMarker,
                executedMarker,
                executedX: serialized.executedX,
                timestamp: serialized.timestamp,
                duration: serialized.duration,
                cwd: serialized.cwd,
                commandStartLineContent: serialized.commandStartLineContent,
                exitCode: serialized.exitCode,
                markProperties: serialized.markProperties,
                aliases: undefined,
                wasReplayed: true
            });
            return newCommand;
        }
        serialize(isCommandStorageDisabled) {
            return {
                promptStartLine: this.promptStartMarker?.line,
                startLine: this.marker?.line,
                startX: undefined,
                endLine: this.endMarker?.line,
                executedLine: this.executedMarker?.line,
                executedX: this.executedX,
                command: isCommandStorageDisabled ? '' : this.command,
                isTrusted: this.isTrusted,
                cwd: this.cwd,
                exitCode: this.exitCode,
                commandStartLineContent: this.commandStartLineContent,
                timestamp: this.timestamp,
                duration: this.duration,
                markProperties: this.markProperties,
            };
        }
        getOutput() {
            if (!this.executedMarker || !this.endMarker) {
                return undefined;
            }
            const startLine = this.executedMarker.line;
            const endLine = this.endMarker.line;
            if (startLine === endLine) {
                return undefined;
            }
            let output = '';
            let line;
            for (let i = startLine; i < endLine; i++) {
                line = this._xterm.buffer.active.getLine(i);
                if (!line) {
                    continue;
                }
                output += line.translateToString(!line.isWrapped) + (line.isWrapped ? '' : '\n');
            }
            return output === '' ? undefined : output;
        }
        getOutputMatch(outputMatcher) {
            // TODO: Add back this check? this._ptyHeuristics.value instanceof WindowsPtyHeuristics && (executedMarker?.line === endMarker?.line) ? this._currentCommand.commandStartMarker : executedMarker
            if (!this.executedMarker || !this.endMarker) {
                return undefined;
            }
            const endLine = this.endMarker.line;
            if (endLine === -1) {
                return undefined;
            }
            const buffer = this._xterm.buffer.active;
            const startLine = Math.max(this.executedMarker.line, 0);
            const matcher = outputMatcher.lineMatcher;
            const linesToCheck = typeof matcher === 'string' ? 1 : outputMatcher.length || countNewLines(matcher);
            const lines = [];
            let match;
            if (outputMatcher.anchor === 'bottom') {
                for (let i = endLine - (outputMatcher.offset || 0); i >= startLine; i--) {
                    let wrappedLineStart = i;
                    const wrappedLineEnd = i;
                    while (wrappedLineStart >= startLine && buffer.getLine(wrappedLineStart)?.isWrapped) {
                        wrappedLineStart--;
                    }
                    i = wrappedLineStart;
                    lines.unshift(getXtermLineContent(buffer, wrappedLineStart, wrappedLineEnd, this._xterm.cols));
                    if (!match) {
                        match = lines[0].match(matcher);
                    }
                    if (lines.length >= linesToCheck) {
                        break;
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
                    lines.push(getXtermLineContent(buffer, wrappedLineStart, wrappedLineEnd, this._xterm.cols));
                    if (!match) {
                        match = lines[lines.length - 1].match(matcher);
                    }
                    if (lines.length >= linesToCheck) {
                        break;
                    }
                }
            }
            return match ? { regexMatch: match, outputLines: lines } : undefined;
        }
        hasOutput() {
            return (!this.executedMarker?.isDisposed &&
                !this.endMarker?.isDisposed &&
                !!(this.executedMarker &&
                    this.endMarker &&
                    this.executedMarker.line < this.endMarker.line));
        }
        getPromptRowCount() {
            return getPromptRowCount(this, this._xterm.buffer.active);
        }
        getCommandRowCount() {
            return getCommandRowCount(this);
        }
    }
    exports.TerminalCommand = TerminalCommand;
    class PartialTerminalCommand {
        constructor(_xterm) {
            this._xterm = _xterm;
        }
        serialize(cwd) {
            if (!this.commandStartMarker) {
                return undefined;
            }
            return {
                promptStartLine: this.promptStartMarker?.line,
                startLine: this.commandStartMarker.line,
                startX: this.commandStartX,
                endLine: undefined,
                executedLine: undefined,
                executedX: undefined,
                command: '',
                isTrusted: true,
                cwd,
                exitCode: undefined,
                commandStartLineContent: undefined,
                timestamp: 0,
                duration: 0,
                markProperties: undefined
            };
        }
        promoteToFullCommand(cwd, exitCode, ignoreCommandLine, markProperties) {
            // When the command finishes and executed never fires the placeholder selector should be used.
            if (exitCode === undefined && this.command === undefined) {
                this.command = '';
            }
            if ((this.command !== undefined && !this.command.startsWith('\\')) || ignoreCommandLine) {
                return new TerminalCommand(this._xterm, {
                    command: ignoreCommandLine ? '' : (this.command || ''),
                    isTrusted: !!this.isTrusted,
                    promptStartMarker: this.promptStartMarker,
                    marker: this.commandStartMarker,
                    startX: this.commandStartX,
                    endMarker: this.commandFinishedMarker,
                    executedMarker: this.commandExecutedMarker,
                    executedX: this.commandExecutedX,
                    timestamp: Date.now(),
                    duration: this.commandDuration || 0,
                    cwd,
                    exitCode,
                    commandStartLineContent: this.commandStartLineContent,
                    markProperties
                });
            }
            return undefined;
        }
        markExecutedTime() {
            if (this.commandExecutedTimestamp === undefined) {
                this.commandExecutedTimestamp = Date.now();
            }
        }
        markFinishedTime() {
            if (this.commandDuration === undefined && this.commandExecutedTimestamp !== undefined) {
                this.commandDuration = Date.now() - this.commandExecutedTimestamp;
            }
        }
        getPromptRowCount() {
            return getPromptRowCount(this, this._xterm.buffer.active);
        }
        getCommandRowCount() {
            return getCommandRowCount(this);
        }
    }
    exports.PartialTerminalCommand = PartialTerminalCommand;
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
    function countNewLines(regex) {
        if (!regex.multiline) {
            return 1;
        }
        const source = regex.source;
        let count = 1;
        let i = source.indexOf('\\n');
        while (i !== -1) {
            count++;
            i = source.indexOf('\\n', i + 1);
        }
        return count;
    }
    function getPromptRowCount(command, buffer) {
        const marker = 'hasOutput' in command ? command.marker : command.commandStartMarker;
        if (!marker || !command.promptStartMarker) {
            return 1;
        }
        let promptRowCount = 1;
        let promptStartLine = command.promptStartMarker.line;
        // Trim any leading whitespace-only lines to retain vertical space
        while (promptStartLine < marker.line && (buffer.getLine(promptStartLine)?.translateToString(true) ?? '').length === 0) {
            promptStartLine++;
        }
        promptRowCount = marker.line - promptStartLine + 1;
        return promptRowCount;
    }
    function getCommandRowCount(command) {
        const marker = 'hasOutput' in command ? command.marker : command.commandStartMarker;
        const executedMarker = 'hasOutput' in command ? command.executedMarker : command.commandExecutedMarker;
        if (!marker || !executedMarker) {
            return 1;
        }
        const commandExecutedLine = Math.max(executedMarker.line, marker.line);
        let commandRowCount = commandExecutedLine - marker.line + 1;
        // Trim the last line if the cursor X is in the left-most cell
        const executedX = 'hasOutput' in command ? command.executedX : command.commandExecutedX;
        if (executedX === 0) {
            commandRowCount--;
        }
        return commandRowCount;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDb21tYW5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vY2FwYWJpbGl0aWVzL2NvbW1hbmREZXRlY3Rpb24vdGVybWluYWxDb21tYW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTZCaEcsTUFBYSxlQUFlO1FBRTNCLElBQUksT0FBTyxLQUFLLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ2xELElBQUksU0FBUyxLQUFLLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3RELElBQUksU0FBUyxLQUFLLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3RELElBQUksUUFBUSxLQUFLLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksaUJBQWlCLEtBQUssT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztRQUN0RSxJQUFJLE1BQU0sS0FBSyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNoRCxJQUFJLFNBQVMsS0FBSyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN0RCxJQUFJLFNBQVMsQ0FBQyxLQUErQixJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdEYsSUFBSSxjQUFjLEtBQUssT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDaEUsSUFBSSxPQUFPLEtBQUssT0FB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