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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/theme/common/themeService", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/base/browser/dom", "vs/platform/configuration/common/configuration"], function (require, exports, arrays_1, lifecycle_1, async_1, themeService_1, terminalColorRegistry_1, dom_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkNavigationAddon = exports.ScrollPosition = void 0;
    exports.getLine = getLine;
    exports.selectLines = selectLines;
    var Boundary;
    (function (Boundary) {
        Boundary[Boundary["Top"] = 0] = "Top";
        Boundary[Boundary["Bottom"] = 1] = "Bottom";
    })(Boundary || (Boundary = {}));
    var ScrollPosition;
    (function (ScrollPosition) {
        ScrollPosition[ScrollPosition["Top"] = 0] = "Top";
        ScrollPosition[ScrollPosition["Middle"] = 1] = "Middle";
    })(ScrollPosition || (exports.ScrollPosition = ScrollPosition = {}));
    let MarkNavigationAddon = class MarkNavigationAddon extends lifecycle_1.Disposable {
        activate(terminal) {
            this._terminal = terminal;
            this._register(this._terminal.onData(() => {
                this._currentMarker = Boundary.Bottom;
            }));
        }
        constructor(_capabilities, _configurationService, _themeService) {
            super();
            this._capabilities = _capabilities;
            this._configurationService = _configurationService;
            this._themeService = _themeService;
            this._currentMarker = Boundary.Bottom;
            this._selectionStart = null;
            this._isDisposable = false;
            this._commandGuideDecorations = this._register(new lifecycle_1.MutableDisposable());
        }
        _getMarkers(skipEmptyCommands) {
            const commandCapability = this._capabilities.get(2 /* TerminalCapability.CommandDetection */);
            const partialCommandCapability = this._capabilities.get(3 /* TerminalCapability.PartialCommandDetection */);
            const markCapability = this._capabilities.get(4 /* TerminalCapability.BufferMarkDetection */);
            let markers = [];
            if (commandCapability) {
                markers = (0, arrays_1.coalesce)(commandCapability.commands.filter(e => skipEmptyCommands ? e.exitCode !== undefined : true).map(e => e.promptStartMarker ?? e.marker));
                // Allow navigating to the current command iff it has been executed, this ignores the
                // skipEmptyCommands flag intenionally as chances are it's not going to be empty if an
                // executed marker exists when this is requested.
                if (commandCapability.currentCommand?.promptStartMarker && commandCapability.currentCommand.commandExecutedMarker) {
                    markers.push(commandCapability.currentCommand?.promptStartMarker);
                }
            }
            else if (partialCommandCapability) {
                markers.push(...partialCommandCapability.commands);
            }
            if (markCapability && !skipEmptyCommands) {
                let next = markCapability.markers().next()?.value;
                const arr = [];
                while (next) {
                    arr.push(next);
                    next = markCapability.markers().next()?.value;
                }
                markers = arr;
            }
            return markers;
        }
        _findCommand(marker) {
            const commandCapability = this._capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (commandCapability) {
                const command = commandCapability.commands.find(e => e.marker?.line === marker.line || e.promptStartMarker?.line === marker.line);
                if (command) {
                    return command;
                }
                if (commandCapability.currentCommand) {
                    return commandCapability.currentCommand;
                }
            }
            return undefined;
        }
        clear() {
            // Clear the current marker so successive focus/selection actions are performed from the
            // bottom of the buffer
            this._currentMarker = Boundary.Bottom;
            this._resetNavigationDecorations();
            this._selectionStart = null;
        }
        _resetNavigationDecorations() {
            if (this._navigationDecorations) {
                (0, lifecycle_1.dispose)(this._navigationDecorations);
            }
            this._navigationDecorations = [];
        }
        _isEmptyCommand(marker) {
            if (marker === Boundary.Bottom) {
                return true;
            }
            if (marker === Boundary.Top) {
                return !this._getMarkers(true).map(e => e.line).includes(0);
            }
            return !this._getMarkers(true).includes(marker);
        }
        scrollToPreviousMark(scrollPosition = 1 /* ScrollPosition.Middle */, retainSelection = false, skipEmptyCommands = true) {
            if (!this._terminal) {
                return;
            }
            if (!retainSelection) {
                this._selectionStart = null;
            }
            let markerIndex;
            const currentLineY = typeof this._currentMarker === 'object'
                ? this.getTargetScrollLine(this._currentMarker.line, scrollPosition)
                : Math.min(getLine(this._terminal, this._currentMarker), this._terminal.buffer.active.baseY);
            const viewportY = this._terminal.buffer.active.viewportY;
            if (typeof this._currentMarker === 'object' ? !this._isMarkerInViewport(this._terminal, this._currentMarker) : currentLineY !== viewportY) {
                // The user has scrolled, find the line based on the current scroll position. This only
                // works when not retaining selection
                const markersBelowViewport = this._getMarkers(skipEmptyCommands).filter(e => e.line >= viewportY).length;
                // -1 will scroll to the top
                markerIndex = this._getMarkers(skipEmptyCommands).length - markersBelowViewport - 1;
            }
            else if (this._currentMarker === Boundary.Bottom) {
                markerIndex = this._getMarkers(skipEmptyCommands).length - 1;
            }
            else if (this._currentMarker === Boundary.Top) {
                markerIndex = -1;
            }
            else if (this._isDisposable) {
                markerIndex = this._findPreviousMarker(skipEmptyCommands);
                this._currentMarker.dispose();
                this._isDisposable = false;
            }
            else {
                if (skipEmptyCommands && this._isEmptyCommand(this._currentMarker)) {
                    markerIndex = this._findPreviousMarker(true);
                }
                else {
                    markerIndex = this._getMarkers(skipEmptyCommands).indexOf(this._currentMarker) - 1;
                }
            }
            if (markerIndex < 0) {
                this._currentMarker = Boundary.Top;
                this._terminal.scrollToTop();
                this._resetNavigationDecorations();
                return;
            }
            this._currentMarker = this._getMarkers(skipEmptyCommands)[markerIndex];
            this._scrollToCommand(this._currentMarker, scrollPosition);
        }
        scrollToNextMark(scrollPosition = 1 /* ScrollPosition.Middle */, retainSelection = false, skipEmptyCommands = true) {
            if (!this._terminal) {
                return;
            }
            if (!retainSelection) {
                this._selectionStart = null;
            }
            let markerIndex;
            const currentLineY = typeof this._currentMarker === 'object'
                ? this.getTargetScrollLine(this._currentMarker.line, scrollPosition)
                : Math.min(getLine(this._terminal, this._currentMarker), this._terminal.buffer.active.baseY);
            const viewportY = this._terminal.buffer.active.viewportY;
            if (typeof this._currentMarker === 'object' ? !this._isMarkerInViewport(this._terminal, this._currentMarker) : currentLineY !== viewportY) {
                // The user has scrolled, find the line based on the current scroll position. This only
                // works when not retaining selection
                const markersAboveViewport = this._getMarkers(skipEmptyCommands).filter(e => e.line <= viewportY).length;
                // markers.length will scroll to the bottom
                markerIndex = markersAboveViewport;
            }
            else if (this._currentMarker === Boundary.Bottom) {
                markerIndex = this._getMarkers(skipEmptyCommands).length;
            }
            else if (this._currentMarker === Boundary.Top) {
                markerIndex = 0;
            }
            else if (this._isDisposable) {
                markerIndex = this._findNextMarker(skipEmptyCommands);
                this._currentMarker.dispose();
                this._isDisposable = false;
            }
            else {
                if (skipEmptyCommands && this._isEmptyCommand(this._currentMarker)) {
                    markerIndex = this._findNextMarker(true);
                }
                else {
                    markerIndex = this._getMarkers(skipEmptyCommands).indexOf(this._currentMarker) + 1;
                }
            }
            if (markerIndex >= this._getMarkers(skipEmptyCommands).length) {
                this._currentMarker = Boundary.Bottom;
                this._terminal.scrollToBottom();
                this._resetNavigationDecorations();
                return;
            }
            this._currentMarker = this._getMarkers(skipEmptyCommands)[markerIndex];
            this._scrollToCommand(this._currentMarker, scrollPosition);
        }
        _scrollToCommand(marker, position) {
            const command = this._findCommand(marker);
            if (command) {
                this.revealCommand(command, position);
            }
            else {
                this._scrollToMarker(marker, position);
            }
        }
        _scrollToMarker(start, position, end, options) {
            if (!this._terminal) {
                return;
            }
            if (!this._isMarkerInViewport(this._terminal, start) || options?.forceScroll) {
                const line = this.getTargetScrollLine(toLineIndex(start), position);
                this._terminal.scrollToLine(line);
            }
            if (!options?.hideDecoration) {
                if (options?.bufferRange) {
                    this._highlightBufferRange(options.bufferRange);
                }
                else {
                    this.registerTemporaryDecoration(start, end, true);
                }
            }
        }
        _createMarkerForOffset(marker, offset) {
            if (offset === 0 && isMarker(marker)) {
                return marker;
            }
            else {
                const offsetMarker = this._terminal?.registerMarker(-this._terminal.buffer.active.cursorY + toLineIndex(marker) - this._terminal.buffer.active.baseY + offset);
                if (offsetMarker) {
                    return offsetMarker;
                }
                else {
                    throw new Error(`Could not register marker with offset ${toLineIndex(marker)}, ${offset}`);
                }
            }
        }
        revealCommand(command, position = 1 /* ScrollPosition.Middle */) {
            const marker = 'getOutput' in command ? command.marker : command.commandStartMarker;
            if (!this._terminal || !marker) {
                return;
            }
            const line = toLineIndex(marker);
            const promptRowCount = command.getPromptRowCount();
            const commandRowCount = command.getCommandRowCount();
            this._scrollToMarker(line - (promptRowCount - 1), position, line + (commandRowCount - 1));
        }
        revealRange(range) {
            this._scrollToMarker(range.start.y - 1, 1 /* ScrollPosition.Middle */, range.end.y - 1, {
                bufferRange: range,
                // Ensure scroll shows the line when sticky scroll is enabled
                forceScroll: !!this._configurationService.getValue("terminal.integrated.stickyScroll.enabled" /* TerminalSettingId.StickyScrollEnabled */)
            });
        }
        showCommandGuide(command) {
            if (!this._terminal) {
                return;
            }
            if (!command) {
                this._commandGuideDecorations.clear();
                this._activeCommandGuide = undefined;
                return;
            }
            if (this._activeCommandGuide === command) {
                return;
            }
            if (command.marker) {
                this._activeCommandGuide = command;
                // Highlight output
                const store = this._commandGuideDecorations.value = new lifecycle_1.DisposableStore();
                if (!command.executedMarker || !command.endMarker) {
                    return;
                }
                const startLine = command.marker.line - (command.getPromptRowCount() - 1);
                const decorationCount = toLineIndex(command.endMarker) - startLine;
                // Abort if the command is too long, this limitation can be lifted when
                // xtermjs/xterm.js#4911 is handled.
                if (decorationCount > 200) {
                    return;
                }
                for (let i = 0; i < decorationCount; i++) {
                    const decoration = this._terminal.registerDecoration({
                        marker: this._createMarkerForOffset(startLine, i)
                    });
                    if (decoration) {
                        store.add(decoration);
                        let renderedElement;
                        store.add(decoration.onRender(element => {
                            if (!renderedElement) {
                                renderedElement = element;
                                element.classList.add('terminal-command-guide');
                                if (i === 0) {
                                    element.classList.add('top');
                                }
                                if (i === decorationCount - 1) {
                                    element.classList.add('bottom');
                                }
                            }
                            if (this._terminal?.element) {
                                element.style.marginLeft = `-${(0, dom_1.getWindow)(this._terminal.element).getComputedStyle(this._terminal.element).paddingLeft}`;
                            }
                        }));
                    }
                }
            }
        }
        saveScrollState() {
            this._scrollState = { viewportY: this._terminal?.buffer.active.viewportY ?? 0 };
        }
        restoreScrollState() {
            if (this._scrollState && this._terminal) {
                this._terminal.scrollToLine(this._scrollState.viewportY);
                this._scrollState = undefined;
            }
        }
        _highlightBufferRange(range) {
            if (!this._terminal) {
                return;
            }
            this._resetNavigationDecorations();
            const startLine = range.start.y;
            const decorationCount = range.end.y - range.start.y + 1;
            for (let i = 0; i < decorationCount; i++) {
                const decoration = this._terminal.registerDecoration({
                    marker: this._createMarkerForOffset(startLine - 1, i),
                    x: range.start.x - 1,
                    width: (range.end.x - 1) - (range.start.x - 1) + 1,
                    overviewRulerOptions: undefined
                });
                if (decoration) {
                    this._navigationDecorations?.push(decoration);
                    let renderedElement;
                    decoration.onRender(element => {
                        if (!renderedElement) {
                            renderedElement = element;
                            element.classList.add('terminal-range-highlight');
                        }
                    });
                    decoration.onDispose(() => { this._navigationDecorations = this._navigationDecorations?.filter(d => d !== decoration); });
                }
            }
        }
        registerTemporaryDecoration(marker, endMarker, showOutline) {
            if (!this._terminal) {
                return;
            }
            this._resetNavigationDecorations();
            const color = this._themeService.getColorTheme().getColor(terminalColorRegistry_1.TERMINAL_OVERVIEW_RULER_CURSOR_FOREGROUND_COLOR);
            const startLine = toLineIndex(marker);
            const decorationCount = endMarker ? toLineIndex(endMarker) - startLine + 1 : 1;
            for (let i = 0; i < decorationCount; i++) {
                const decoration = this._terminal.registerDecoration({
                    marker: this._createMarkerForOffset(marker, i),
                    width: this._terminal.cols,
                    overviewRulerOptions: i === 0 ? {
                        color: color?.toString() || '#a0a0a0cc'
                    } : undefined
                });
                if (decoration) {
                    this._navigationDecorations?.push(decoration);
                    let renderedElement;
                    decoration.onRender(element => {
                        if (!renderedElement) {
                            renderedElement = element;
                            element.classList.add('terminal-scroll-highlight');
                            if (showOutline) {
                                element.classList.add('terminal-scroll-highlight-outline');
                            }
                            if (i === 0) {
                                element.classList.add('top');
                            }
                            if (i === decorationCount - 1) {
                                element.classList.add('bottom');
                            }
                        }
                        else {
                            element.classList.add('terminal-scroll-highlight');
                        }
                        if (this._terminal?.element) {
                            element.style.marginLeft = `-${(0, dom_1.getWindow)(this._terminal.element).getComputedStyle(this._terminal.element).paddingLeft}`;
                        }
                    });
                    // TODO: This is not efficient for a large decorationCount
                    decoration.onDispose(() => { this._navigationDecorations = this._navigationDecorations?.filter(d => d !== decoration); });
                    // Number picked to align with symbol highlight in the editor
                    if (showOutline) {
                        (0, async_1.timeout)(350).then(() => {
                            if (renderedElement) {
                                renderedElement.classList.remove('terminal-scroll-highlight-outline');
                            }
                        });
                    }
                }
            }
        }
        scrollToLine(line, position) {
            this._terminal?.scrollToLine(this.getTargetScrollLine(line, position));
        }
        getTargetScrollLine(line, position) {
            // Middle is treated as 1/4 of the viewport's size because context below is almost always
            // more important than context above in the terminal.
            if (this._terminal && position === 1 /* ScrollPosition.Middle */) {
                return Math.max(line - Math.floor(this._terminal.rows / 4), 0);
            }
            return line;
        }
        _isMarkerInViewport(terminal, marker) {
            const viewportY = terminal.buffer.active.viewportY;
            const line = toLineIndex(marker);
            return line >= viewportY && line < viewportY + terminal.rows;
        }
        scrollToClosestMarker(startMarkerId, endMarkerId, highlight) {
            const detectionCapability = this._capabilities.get(4 /* TerminalCapability.BufferMarkDetection */);
            if (!detectionCapability) {
                return;
            }
            const startMarker = detectionCapability.getMark(startMarkerId);
            if (!startMarker) {
                return;
            }
            const endMarker = endMarkerId ? detectionCapability.getMark(endMarkerId) : startMarker;
            this._scrollToMarker(startMarker, 0 /* ScrollPosition.Top */, endMarker, { hideDecoration: !highlight });
        }
        selectToPreviousMark() {
            if (!this._terminal) {
                return;
            }
            if (this._selectionStart === null) {
                this._selectionStart = this._currentMarker;
            }
            if (this._capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                this.scrollToPreviousMark(1 /* ScrollPosition.Middle */, true, true);
            }
            else {
                this.scrollToPreviousMark(1 /* ScrollPosition.Middle */, true, false);
            }
            selectLines(this._terminal, this._currentMarker, this._selectionStart);
        }
        selectToNextMark() {
            if (!this._terminal) {
                return;
            }
            if (this._selectionStart === null) {
                this._selectionStart = this._currentMarker;
            }
            if (this._capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                this.scrollToNextMark(1 /* ScrollPosition.Middle */, true, true);
            }
            else {
                this.scrollToNextMark(1 /* ScrollPosition.Middle */, true, false);
            }
            selectLines(this._terminal, this._currentMarker, this._selectionStart);
        }
        selectToPreviousLine() {
            if (!this._terminal) {
                return;
            }
            if (this._selectionStart === null) {
                this._selectionStart = this._currentMarker;
            }
            this.scrollToPreviousLine(this._terminal, 1 /* ScrollPosition.Middle */, true);
            selectLines(this._terminal, this._currentMarker, this._selectionStart);
        }
        selectToNextLine() {
            if (!this._terminal) {
                return;
            }
            if (this._selectionStart === null) {
                this._selectionStart = this._currentMarker;
            }
            this.scrollToNextLine(this._terminal, 1 /* ScrollPosition.Middle */, true);
            selectLines(this._terminal, this._currentMarker, this._selectionStart);
        }
        scrollToPreviousLine(xterm, scrollPosition = 1 /* ScrollPosition.Middle */, retainSelection = false) {
            if (!retainSelection) {
                this._selectionStart = null;
            }
            if (this._currentMarker === Boundary.Top) {
                xterm.scrollToTop();
                return;
            }
            if (this._currentMarker === Boundary.Bottom) {
                this._currentMarker = this._registerMarkerOrThrow(xterm, this._getOffset(xterm) - 1);
            }
            else {
                const offset = this._getOffset(xterm);
                if (this._isDisposable) {
                    this._currentMarker.dispose();
                }
                this._currentMarker = this._registerMarkerOrThrow(xterm, offset - 1);
            }
            this._isDisposable = true;
            this._scrollToMarker(this._currentMarker, scrollPosition);
        }
        scrollToNextLine(xterm, scrollPosition = 1 /* ScrollPosition.Middle */, retainSelection = false) {
            if (!retainSelection) {
                this._selectionStart = null;
            }
            if (this._currentMarker === Boundary.Bottom) {
                xterm.scrollToBottom();
                return;
            }
            if (this._currentMarker === Boundary.Top) {
                this._currentMarker = this._registerMarkerOrThrow(xterm, this._getOffset(xterm) + 1);
            }
            else {
                const offset = this._getOffset(xterm);
                if (this._isDisposable) {
                    this._currentMarker.dispose();
                }
                this._currentMarker = this._registerMarkerOrThrow(xterm, offset + 1);
            }
            this._isDisposable = true;
            this._scrollToMarker(this._currentMarker, scrollPosition);
        }
        _registerMarkerOrThrow(xterm, cursorYOffset) {
            const marker = xterm.registerMarker(cursorYOffset);
            if (!marker) {
                throw new Error(`Could not create marker for ${cursorYOffset}`);
            }
            return marker;
        }
        _getOffset(xterm) {
            if (this._currentMarker === Boundary.Bottom) {
                return 0;
            }
            else if (this._currentMarker === Boundary.Top) {
                return 0 - (xterm.buffer.active.baseY + xterm.buffer.active.cursorY);
            }
            else {
                let offset = getLine(xterm, this._currentMarker);
                offset -= xterm.buffer.active.baseY + xterm.buffer.active.cursorY;
                return offset;
            }
        }
        _findPreviousMarker(skipEmptyCommands = false) {
            if (this._currentMarker === Boundary.Top) {
                return 0;
            }
            else if (this._currentMarker === Boundary.Bottom) {
                return this._getMarkers(skipEmptyCommands).length - 1;
            }
            let i;
            for (i = this._getMarkers(skipEmptyCommands).length - 1; i >= 0; i--) {
                if (this._getMarkers(skipEmptyCommands)[i].line < this._currentMarker.line) {
                    return i;
                }
            }
            return -1;
        }
        _findNextMarker(skipEmptyCommands = false) {
            if (this._currentMarker === Boundary.Top) {
                return 0;
            }
            else if (this._currentMarker === Boundary.Bottom) {
                return this._getMarkers(skipEmptyCommands).length - 1;
            }
            let i;
            for (i = 0; i < this._getMarkers(skipEmptyCommands).length; i++) {
                if (this._getMarkers(skipEmptyCommands)[i].line > this._currentMarker.line) {
                    return i;
                }
            }
            return this._getMarkers(skipEmptyCommands).length;
        }
    };
    exports.MarkNavigationAddon = MarkNavigationAddon;
    exports.MarkNavigationAddon = MarkNavigationAddon = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, themeService_1.IThemeService)
    ], MarkNavigationAddon);
    function getLine(xterm, marker) {
        // Use the _second last_ row as the last row is likely the prompt
        if (marker === Boundary.Bottom) {
            return xterm.buffer.active.baseY + xterm.rows - 1;
        }
        if (marker === Boundary.Top) {
            return 0;
        }
        return marker.line;
    }
    function selectLines(xterm, start, end) {
        if (end === null) {
            end = Boundary.Bottom;
        }
        let startLine = getLine(xterm, start);
        let endLine = getLine(xterm, end);
        if (startLine > endLine) {
            const temp = startLine;
            startLine = endLine;
            endLine = temp;
        }
        // Subtract a line as the marker is on the line the command run, we do not want the next
        // command in the selection for the current command
        endLine -= 1;
        xterm.selectLines(startLine, endLine);
    }
    function isMarker(value) {
        return typeof value !== 'number';
    }
    function toLineIndex(line) {
        return isMarker(line) ? line.line : line;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya05hdmlnYXRpb25BZGRvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci94dGVybS9tYXJrTmF2aWdhdGlvbkFkZG9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQSttQmhHLDBCQVdDO0lBRUQsa0NBbUJDO0lBaG9CRCxJQUFLLFFBR0o7SUFIRCxXQUFLLFFBQVE7UUFDWixxQ0FBRyxDQUFBO1FBQ0gsMkNBQU0sQ0FBQTtJQUNQLENBQUMsRUFISSxRQUFRLEtBQVIsUUFBUSxRQUdaO0lBRUQsSUFBa0IsY0FHakI7SUFIRCxXQUFrQixjQUFjO1FBQy9CLGlEQUFHLENBQUE7UUFDSCx1REFBTSxDQUFBO0lBQ1AsQ0FBQyxFQUhpQixjQUFjLDhCQUFkLGNBQWMsUUFHL0I7SUFTTSxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBVWxELFFBQVEsQ0FBQyxRQUFrQjtZQUMxQixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUMxQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRTtnQkFDekMsSUFBSSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQ3ZDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsWUFDa0IsYUFBdUMsRUFDakMscUJBQTZELEVBQ3JFLGFBQTZDO1lBRTVELEtBQUssRUFBRSxDQUFDO1lBSlMsa0JBQWEsR0FBYixhQUFhLENBQTBCO1lBQ2hCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDcEQsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFuQnJELG1CQUFjLEdBQXVCLFFB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