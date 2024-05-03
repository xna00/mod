var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/amdX", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/themeService", "vs/workbench/contrib/terminal/browser/terminalContextMenu", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/contrib/terminalContrib/stickyScroll/browser/terminalStickyScrollColorRegistry", "vs/css!./media/stickyScroll"], function (require, exports, amdX_1, dom_1, async_1, decorators_1, event_1, lifecycle_1, strings_1, nls_1, actions_1, configuration_1, contextkey_1, contextView_1, keybinding_1, themeService_1, terminalContextMenu_1, terminal_1, terminalStrings_1, terminalStickyScrollColorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalStickyScrollOverlay = void 0;
    var OverlayState;
    (function (OverlayState) {
        /** Initial state/disabled by the alt buffer. */
        OverlayState[OverlayState["Off"] = 0] = "Off";
        OverlayState[OverlayState["On"] = 1] = "On";
    })(OverlayState || (OverlayState = {}));
    var CssClasses;
    (function (CssClasses) {
        CssClasses["Visible"] = "visible";
    })(CssClasses || (CssClasses = {}));
    var Constants;
    (function (Constants) {
        Constants[Constants["StickyScrollPercentageCap"] = 0.4] = "StickyScrollPercentageCap";
    })(Constants || (Constants = {}));
    let TerminalStickyScrollOverlay = class TerminalStickyScrollOverlay extends lifecycle_1.Disposable {
        constructor(_instance, _xterm, _xtermColorProvider, _commandDetection, xtermCtor, configurationService, contextKeyService, _contextMenuService, _keybindingService, menuService, _themeService) {
            super();
            this._instance = _instance;
            this._xterm = _xterm;
            this._xtermColorProvider = _xtermColorProvider;
            this._commandDetection = _commandDetection;
            this._contextMenuService = _contextMenuService;
            this._keybindingService = _keybindingService;
            this._themeService = _themeService;
            this._canvasAddon = this._register(new lifecycle_1.MutableDisposable());
            this._refreshListeners = this._register(new lifecycle_1.MutableDisposable());
            this._state = 0 /* OverlayState.Off */;
            this._isRefreshQueued = false;
            this._rawMaxLineCount = 5;
            this._contextMenu = this._register(menuService.createMenu(actions_1.MenuId.TerminalStickyScrollContext, contextKeyService));
            // Only show sticky scroll in the normal buffer
            this._register(event_1.Event.runAndSubscribe(this._xterm.raw.buffer.onBufferChange, buffer => {
                this._setState((buffer ?? this._xterm.raw.buffer.active).type === 'normal' ? 1 /* OverlayState.On */ : 0 /* OverlayState.Off */);
            }));
            // React to configuration changes
            this._register(event_1.Event.runAndSubscribe(configurationService.onDidChangeConfiguration, e => {
                if (!e || e.affectsConfiguration("terminal.integrated.stickyScroll.maxLineCount" /* TerminalSettingId.StickyScrollMaxLineCount */)) {
                    this._rawMaxLineCount = configurationService.getValue("terminal.integrated.stickyScroll.maxLineCount" /* TerminalSettingId.StickyScrollMaxLineCount */);
                }
            }));
            // React to terminal location changes
            this._register(this._instance.onDidChangeTarget(() => this._syncOptions()));
            // Eagerly create the overlay
            xtermCtor.then(ctor => {
                if (this._store.isDisposed) {
                    return;
                }
                this._stickyScrollOverlay = this._register(new ctor({
                    rows: 1,
                    cols: this._xterm.raw.cols,
                    allowProposedApi: true,
                    ...this._getOptions()
                }));
                this._register(configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration(terminal_1.TERMINAL_CONFIG_SECTION)) {
                        this._syncOptions();
                    }
                }));
                this._register(this._themeService.onDidColorThemeChange(() => {
                    this._syncOptions();
                }));
                this._register(this._xterm.raw.onResize(() => {
                    this._syncOptions();
                    this._refresh();
                }));
                this._getSerializeAddonConstructor().then(SerializeAddon => {
                    this._serializeAddon = this._register(new SerializeAddon());
                    this._xterm.raw.loadAddon(this._serializeAddon);
                    // Trigger a render as the serialize addon is required to render
                    this._refresh();
                });
                this._syncGpuAccelerationState();
            });
        }
        _setState(state) {
            if (this._state === state) {
                return;
            }
            switch (state) {
                case 0 /* OverlayState.Off */: {
                    this._setVisible(false);
                    this._uninstallRefreshListeners();
                    break;
                }
                case 1 /* OverlayState.On */: {
                    this._refresh();
                    this._installRefreshListeners();
                    break;
                }
            }
        }
        _installRefreshListeners() {
            if (!this._refreshListeners.value) {
                this._refreshListeners.value = (0, lifecycle_1.combinedDisposable)(event_1.Event.any(this._xterm.raw.onScroll, this._xterm.raw.onLineFeed, 
                // Rarely an update may be required after just a cursor move, like when
                // scrolling horizontally in a pager
                this._xterm.raw.onCursorMove)(() => this._refresh()), (0, dom_1.addStandardDisposableListener)(this._xterm.raw.element.querySelector('.xterm-viewport'), 'scroll', () => this._refresh()));
            }
        }
        _uninstallRefreshListeners() {
            this._refreshListeners.clear();
        }
        _setVisible(isVisible) {
            if (isVisible) {
                this._ensureElement();
                // The GPU acceleration state may be changes at any time and there is no event to listen
                // to currently.
                this._syncGpuAccelerationState();
            }
            this._element?.classList.toggle("visible" /* CssClasses.Visible */, isVisible);
        }
        _refresh() {
            if (this._isRefreshQueued) {
                return;
            }
            this._isRefreshQueued = true;
            queueMicrotask(() => {
                this._refreshNow();
                this._isRefreshQueued = false;
            });
        }
        _refreshNow() {
            const command = this._commandDetection.getCommandForLine(this._xterm.raw.buffer.active.viewportY);
            // The command from viewportY + 1 is used because this one will not be obscured by sticky
            // scroll.
            this._currentStickyCommand = undefined;
            // No command
            if (!command) {
                this._setVisible(false);
                return;
            }
            // Partial command
            if (!('marker' in command)) {
                const partialCommand = this._commandDetection.currentCommand;
                if (partialCommand?.commandStartMarker && partialCommand.commandExecutedMarker) {
                    this._updateContent(partialCommand, partialCommand.commandStartMarker);
                    return;
                }
                this._setVisible(false);
                return;
            }
            // If the marker doesn't exist or it was trimmed from scrollback
            const marker = command.marker;
            if (!marker || marker.line === -1) {
                // TODO: It would be nice if we kept the cached command around even if it was trimmed
                // from scrollback
                this._setVisible(false);
                return;
            }
            this._updateContent(command, marker);
        }
        _updateContent(command, startMarker) {
            const xterm = this._xterm.raw;
            if (!xterm.element?.parentElement || !this._stickyScrollOverlay || !this._serializeAddon) {
                return;
            }
            // Hide sticky scroll if the prompt has been trimmed from the buffer
            if (command.promptStartMarker?.line === -1) {
                this._setVisible(false);
                return;
            }
            // Determine sticky scroll line count
            const buffer = xterm.buffer.active;
            const promptRowCount = command.getPromptRowCount();
            const commandRowCount = command.getCommandRowCount();
            const stickyScrollLineStart = startMarker.line - (promptRowCount - 1);
            // Calculate the row offset, this is the number of rows that will be clipped from the top
            // of the sticky overlay because we do not want to show any content above the bounds of the
            // original terminal. This is done because it seems like scrolling flickers more when a
            // partial line can be drawn on the top.
            const isPartialCommand = !('getOutput' in command);
            const rowOffset = !isPartialCommand && command.endMarker ? Math.max(buffer.viewportY - command.endMarker.line + 1, 0) : 0;
            const maxLineCount = Math.min(this._rawMaxLineCount, Math.floor(xterm.rows * 0.4 /* Constants.StickyScrollPercentageCap */));
            const stickyScrollLineCount = Math.min(promptRowCount + commandRowCount - 1, maxLineCount) - rowOffset;
            // Hide sticky scroll if it's currently on a line that contains it
            if (buffer.viewportY <= stickyScrollLineStart) {
                this._setVisible(false);
                return;
            }
            // Hide sticky scroll for the partial command if it looks like there is a pager like `less`
            // or `git log` active. This is done by checking if the bottom left cell contains the :
            // character and the cursor is immediately to its right. This improves the behavior of a
            // common case where the top of the text being viewport would otherwise be obscured.
            if (isPartialCommand && buffer.viewportY === buffer.baseY && buffer.cursorY === xterm.rows - 1) {
                const line = buffer.getLine(buffer.baseY + xterm.rows - 1);
                if ((buffer.cursorX === 1 && lineStartsWith(line, ':')) ||
                    (buffer.cursorX === 5 && lineStartsWith(line, '(END)'))) {
                    this._setVisible(false);
                    return;
                }
            }
            // Get the line content of the command from the terminal
            const content = this._serializeAddon.serialize({
                range: {
                    start: stickyScrollLineStart + rowOffset,
                    end: stickyScrollLineStart + rowOffset + Math.max(stickyScrollLineCount - 1, 0)
                }
            });
            // If a partial command's sticky scroll would show nothing, just hide it. This is another
            // edge case when using a pager or interactive editor.
            if (isPartialCommand && (0, strings_1.removeAnsiEscapeCodes)(content).length === 0) {
                this._setVisible(false);
                return;
            }
            // Write content if it differs
            if (content && this._currentContent !== content ||
                this._stickyScrollOverlay.cols !== xterm.cols ||
                this._stickyScrollOverlay.rows !== stickyScrollLineCount) {
                this._stickyScrollOverlay.resize(this._stickyScrollOverlay.cols, stickyScrollLineCount);
                // Clear attrs, reset cursor position, clear right
                this._stickyScrollOverlay.write('\x1b[0m\x1b[H\x1b[2J');
                this._stickyScrollOverlay.write(content);
                this._currentContent = content;
                // DEBUG: Log to show the command line we know
                // this._stickyScrollOverlay.write(` [${command?.command}]`);
            }
            if (content) {
                this._currentStickyCommand = command;
                this._setVisible(true);
                // Position the sticky scroll such that it never overlaps the prompt/output of the
                // following command. This must happen after setVisible to ensure the element is
                // initialized.
                if (this._element) {
                    const termBox = xterm.element.getBoundingClientRect();
                    const rowHeight = termBox.height / xterm.rows;
                    const overlayHeight = stickyScrollLineCount * rowHeight;
                    // Adjust sticky scroll content if it would below the end of the command, obscuring the
                    // following command.
                    let endMarkerOffset = 0;
                    if (!isPartialCommand && command.endMarker && command.endMarker.line !== -1) {
                        if (buffer.viewportY + stickyScrollLineCount > command.endMarker.line) {
                            const diff = buffer.viewportY + stickyScrollLineCount - command.endMarker.line;
                            endMarkerOffset = diff * rowHeight;
                        }
                    }
                    this._element.style.bottom = `${termBox.height - overlayHeight + 1 + endMarkerOffset}px`;
                }
            }
            else {
                this._setVisible(false);
            }
        }
        _ensureElement() {
            if (
            // The element is already created
            this._element ||
                // If the overlay is yet to be created, the terminal cannot be opened so defer to next call
                !this._stickyScrollOverlay ||
                // The xterm.js instance isn't opened yet
                !this._xterm?.raw.element?.parentElement) {
                return;
            }
            const overlay = this._stickyScrollOverlay;
            const hoverOverlay = (0, dom_1.$)('.hover-overlay');
            this._element = (0, dom_1.$)('.terminal-sticky-scroll', undefined, hoverOverlay);
            this._xterm.raw.element.parentElement.append(this._element);
            this._register((0, lifecycle_1.toDisposable)(() => this._element?.remove()));
            // Fill tooltip
            let hoverTitle = (0, nls_1.localize)('stickyScrollHoverTitle', 'Navigate to Command');
            const scrollToPreviousCommandKeybinding = this._keybindingService.lookupKeybinding("workbench.action.terminal.scrollToPreviousCommand" /* TerminalCommandId.ScrollToPreviousCommand */);
            if (scrollToPreviousCommandKeybinding) {
                const label = scrollToPreviousCommandKeybinding.getLabel();
                if (label) {
                    hoverTitle += '\n' + (0, nls_1.localize)('labelWithKeybinding', "{0} ({1})", terminalStrings_1.terminalStrings.scrollToPreviousCommand.value, label);
                }
            }
            const scrollToNextCommandKeybinding = this._keybindingService.lookupKeybinding("workbench.action.terminal.scrollToNextCommand" /* TerminalCommandId.ScrollToNextCommand */);
            if (scrollToNextCommandKeybinding) {
                const label = scrollToNextCommandKeybinding.getLabel();
                if (label) {
                    hoverTitle += '\n' + (0, nls_1.localize)('labelWithKeybinding', "{0} ({1})", terminalStrings_1.terminalStrings.scrollToNextCommand.value, label);
                }
            }
            hoverOverlay.title = hoverTitle;
            const scrollBarWidth = this._xterm.raw._core.viewport?.scrollBarWidth;
            if (scrollBarWidth !== undefined) {
                this._element.style.right = `${scrollBarWidth}px`;
            }
            this._stickyScrollOverlay.open(this._element);
            // Scroll to the command on click
            this._register((0, dom_1.addStandardDisposableListener)(hoverOverlay, 'click', () => {
                if (this._xterm && this._currentStickyCommand) {
                    this._xterm.markTracker.revealCommand(this._currentStickyCommand);
                    this._instance.focus();
                }
            }));
            // Forward mouse events to the terminal
            this._register((0, dom_1.addStandardDisposableListener)(hoverOverlay, 'wheel', e => this._xterm?.raw.element?.dispatchEvent(new WheelEvent(e.type, e))));
            // Context menu - stop propagation on mousedown because rightClickBehavior listens on
            // mousedown, not contextmenu
            this._register((0, dom_1.addDisposableListener)(hoverOverlay, 'mousedown', e => {
                e.stopImmediatePropagation();
                e.preventDefault();
            }));
            this._register((0, dom_1.addDisposableListener)(hoverOverlay, 'contextmenu', e => {
                e.stopImmediatePropagation();
                e.preventDefault();
                (0, terminalContextMenu_1.openContextMenu)((0, dom_1.getWindow)(hoverOverlay), e, this._instance, this._contextMenu, this._contextMenuService);
            }));
            // Instead of juggling decorations for hover styles, swap out the theme to indicate the
            // hover state. This comes with the benefit over other methods of working well with special
            // decorative characters like powerline symbols.
            this._register((0, dom_1.addStandardDisposableListener)(hoverOverlay, 'mouseover', () => overlay.options.theme = this._getTheme(true)));
            this._register((0, dom_1.addStandardDisposableListener)(hoverOverlay, 'mouseleave', () => overlay.options.theme = this._getTheme(false)));
        }
        _syncOptions() {
            if (!this._stickyScrollOverlay) {
                return;
            }
            this._stickyScrollOverlay.resize(this._xterm.raw.cols, this._stickyScrollOverlay.rows);
            this._stickyScrollOverlay.options = this._getOptions();
            this._syncGpuAccelerationState();
        }
        _syncGpuAccelerationState() {
            if (!this._stickyScrollOverlay) {
                return;
            }
            const overlay = this._stickyScrollOverlay;
            // The Webgl renderer isn't used here as there are a limited number of webgl contexts
            // available within a given page. This is a single row that isn't rendered too often so the
            // performance isn't as important
            if (this._xterm.isGpuAccelerated) {
                if (!this._canvasAddon.value && !this._pendingCanvasAddon) {
                    this._pendingCanvasAddon = (0, async_1.createCancelablePromise)(async (token) => {
                        const CanvasAddon = await this._getCanvasAddonConstructor();
                        if (!token.isCancellationRequested && !this._store.isDisposed) {
                            this._canvasAddon.value = new CanvasAddon();
                            if (this._canvasAddon.value) { // The MutableDisposable could be disposed
                                overlay.loadAddon(this._canvasAddon.value);
                            }
                        }
                        this._pendingCanvasAddon = undefined;
                    });
                }
            }
            else {
                this._canvasAddon.clear();
                this._pendingCanvasAddon?.cancel();
                this._pendingCanvasAddon = undefined;
            }
        }
        _getOptions() {
            const o = this._xterm.raw.options;
            return {
                allowTransparency: true,
                cursorInactiveStyle: 'none',
                scrollback: 0,
                logLevel: 'off',
                theme: this._getTheme(false),
                documentOverride: o.documentOverride,
                fontFamily: o.fontFamily,
                fontWeight: o.fontWeight,
                fontWeightBold: o.fontWeightBold,
                fontSize: o.fontSize,
                letterSpacing: o.letterSpacing,
                lineHeight: o.lineHeight,
                drawBoldTextInBrightColors: o.drawBoldTextInBrightColors,
                minimumContrastRatio: o.minimumContrastRatio,
                tabStopWidth: o.tabStopWidth,
                overviewRulerWidth: o.overviewRulerWidth,
            };
        }
        _getTheme(isHovering) {
            const theme = this._themeService.getColorTheme();
            return {
                ...this._xterm.getXtermTheme(),
                background: isHovering
                    ? theme.getColor(terminalStickyScrollColorRegistry_1.terminalStickyScrollHoverBackground)?.toString() ?? this._xtermColorProvider.getBackgroundColor(theme)?.toString()
                    : theme.getColor(terminalStickyScrollColorRegistry_1.terminalStickyScrollBackground)?.toString() ?? this._xtermColorProvider.getBackgroundColor(theme)?.toString(),
                selectionBackground: undefined,
                selectionInactiveBackground: undefined
            };
        }
        async _getCanvasAddonConstructor() {
            const m = await (0, amdX_1.importAMDNodeModule)('@xterm/addon-canvas', 'lib/xterm-addon-canvas.js');
            return m.CanvasAddon;
        }
        async _getSerializeAddonConstructor() {
            const m = await (0, amdX_1.importAMDNodeModule)('@xterm/addon-serialize', 'lib/addon-serialize.js');
            return m.SerializeAddon;
        }
    };
    exports.TerminalStickyScrollOverlay = TerminalStickyScrollOverlay;
    __decorate([
        (0, decorators_1.throttle)(0)
    ], TerminalStickyScrollOverlay.prototype, "_syncOptions", null);
    __decorate([
        decorators_1.memoize
    ], TerminalStickyScrollOverlay.prototype, "_getCanvasAddonConstructor", null);
    __decorate([
        decorators_1.memoize
    ], TerminalStickyScrollOverlay.prototype, "_getSerializeAddonConstructor", null);
    exports.TerminalStickyScrollOverlay = TerminalStickyScrollOverlay = __decorate([
        __param(5, configuration_1.IConfigurationService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, actions_1.IMenuService),
        __param(10, themeService_1.IThemeService)
    ], TerminalStickyScrollOverlay);
    function lineStartsWith(line, text) {
        if (!line) {
            return false;
        }
        for (let i = 0; i < text.length; i++) {
            if (line.getCell(i)?.getChars() !== text[i]) {
                return false;
            }
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdGlja3lTY3JvbGxPdmVybGF5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvc3RpY2t5U2Nyb2xsL2Jyb3dzZXIvdGVybWluYWxTdGlja3lTY3JvbGxPdmVybGF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFnQ0EsSUFBVyxZQUlWO0lBSkQsV0FBVyxZQUFZO1FBQ3RCLGdEQUFnRDtRQUNoRCw2Q0FBTyxDQUFBO1FBQ1AsMkNBQU0sQ0FBQTtJQUNQLENBQUMsRUFKVSxZQUFZLEtBQVosWUFBWSxRQUl0QjtJQUVELElBQVcsVUFFVjtJQUZELFdBQVcsVUFBVTtRQUNwQixpQ0FBbUIsQ0FBQTtJQUNwQixDQUFDLEVBRlUsVUFBVSxLQUFWLFVBQVUsUUFFcEI7SUFFRCxJQUFXLFNBRVY7SUFGRCxXQUFXLFNBQVM7UUFDbkIscUZBQStCLENBQUE7SUFDaEMsQ0FBQyxFQUZVLFNBQVMsS0FBVCxTQUFTLFFBRW5CO0lBRU0sSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxzQkFBVTtRQWtCMUQsWUFDa0IsU0FBNEIsRUFDNUIsTUFBa0QsRUFDbEQsbUJBQXdDLEVBQ3hDLGlCQUE4QyxFQUMvRCxTQUF3QyxFQUNqQixvQkFBMkMsRUFDOUMsaUJBQXFDLEVBQ3BDLG1CQUF5RCxFQUMxRCxrQkFBdUQsRUFDN0QsV0FBeUIsRUFDeEIsYUFBNkM7WUFFNUQsS0FBSyxFQUFFLENBQUM7WUFaUyxjQUFTLEdBQVQsU0FBUyxDQUFtQjtZQUM1QixXQUFNLEdBQU4sTUFBTSxDQUE0QztZQUNsRCx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQ3hDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBNkI7WUFJekIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUN6Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBRTNDLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBekJyRCxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBbUIsQ0FBQyxDQUFDO1lBUXhFLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFFNUQsV0FBTSw0QkFBa0M7WUFDeEMscUJBQWdCLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLHFCQUFnQixHQUFXLENBQUMsQ0FBQztZQWlCcEMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsZ0JBQU0sQ0FBQywyQkFBMkIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFFbEgsK0NBQStDO1lBQy9DLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNwRixJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMseUJBQWlCLENBQUMseUJBQWlCLENBQUMsQ0FBQztZQUNsSCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosaUNBQWlDO1lBQ2pDLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDdkYsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsb0JBQW9CLGtHQUE0QyxFQUFFLENBQUM7b0JBQzlFLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLGtHQUE0QyxDQUFDO2dCQUNuRyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLHFDQUFxQztZQUNyQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU1RSw2QkFBNkI7WUFDN0IsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDckIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUM1QixPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUM7b0JBQ25ELElBQUksRUFBRSxDQUFDO29CQUNQLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJO29CQUMxQixnQkFBZ0IsRUFBRSxJQUFJO29CQUN0QixHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUU7aUJBQ3JCLENBQUMsQ0FBQyxDQUFDO2dCQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ2hFLElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLGtDQUF1QixDQUFDLEVBQUUsQ0FBQzt3QkFDckQsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUNyQixDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRTtvQkFDNUQsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNyQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRTtvQkFDNUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUNwQixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2pCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFO29CQUMxRCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxjQUFjLEVBQUUsQ0FBQyxDQUFDO29CQUM1RCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUNoRCxnRUFBZ0U7b0JBQ2hFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDakIsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFDbEMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sU0FBUyxDQUFDLEtBQW1CO1lBQ3BDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDM0IsT0FBTztZQUNSLENBQUM7WUFDRCxRQUFRLEtBQUssRUFBRSxDQUFDO2dCQUNmLDZCQUFxQixDQUFDLENBQUMsQ0FBQztvQkFDdkIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDeEIsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7b0JBQ2xDLE1BQU07Z0JBQ1AsQ0FBQztnQkFDRCw0QkFBb0IsQ0FBQyxDQUFDLENBQUM7b0JBQ3RCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDaEIsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7b0JBQ2hDLE1BQU07Z0JBQ1AsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sd0JBQXdCO1lBQy9CLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUcsSUFBQSw4QkFBa0IsRUFDaEQsYUFBSyxDQUFDLEdBQUcsQ0FDUixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVU7Z0JBQzFCLHVFQUF1RTtnQkFDdkUsb0NBQW9DO2dCQUNwQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQzVCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQ3hCLElBQUEsbUNBQTZCLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBUSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FDMUgsQ0FBQztZQUNILENBQUM7UUFDRixDQUFDO1FBRU8sMEJBQTBCO1lBQ2pDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBRU8sV0FBVyxDQUFDLFNBQWtCO1lBQ3JDLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUN0Qix3RkFBd0Y7Z0JBQ3hGLGdCQUFnQjtnQkFDaEIsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFDbEMsQ0FBQztZQUNELElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLE1BQU0scUNBQXFCLFNBQVMsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFTyxRQUFRO1lBQ2YsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDM0IsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1lBQzdCLGNBQWMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ25CLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztZQUMvQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxXQUFXO1lBQ2xCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRWxHLHlGQUF5RjtZQUN6RixVQUFVO1lBQ1YsSUFBSSxDQUFDLHFCQUFxQixHQUFHLFNBQVMsQ0FBQztZQUV2QyxhQUFhO1lBQ2IsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBRUQsa0JBQWtCO1lBQ2xCLElBQUksQ0FBQyxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUM1QixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDO2dCQUM3RCxJQUFJLGNBQWMsRUFBRSxrQkFBa0IsSUFBSSxjQUFjLENBQUMscUJBQXFCLEVBQUUsQ0FBQztvQkFDaEYsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLGtCQUFrQixDQUFDLENBQUM7b0JBQ3ZFLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixPQUFPO1lBQ1IsQ0FBQztZQUVELGdFQUFnRTtZQUNoRSxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQzlCLElBQUksQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxxRkFBcUY7Z0JBQ3JGLGtCQUFrQjtnQkFDbEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDeEIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRU8sY0FBYyxDQUFDLE9BQWtELEVBQUUsV0FBb0I7WUFDOUYsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7WUFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsYUFBYSxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMxRixPQUFPO1lBQ1IsQ0FBQztZQUVELG9FQUFvRTtZQUNwRSxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDNUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDeEIsT0FBTztZQUNSLENBQUM7WUFFRCxxQ0FBcUM7WUFDckMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbkMsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDbkQsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDckQsTUFBTSxxQkFBcUIsR0FBRyxXQUFXLENBQUMsSUFBSSxHQUFHLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRXRFLHlGQUF5RjtZQUN6RiwyRkFBMkY7WUFDM0YsdUZBQXVGO1lBQ3ZGLHdDQUF3QztZQUN4QyxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxXQUFXLElBQUksT0FBTyxDQUFDLENBQUM7WUFDbkQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUgsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxnREFBc0MsQ0FBQyxDQUFDLENBQUM7WUFDbkgsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQWMsR0FBRyxlQUFlLEdBQUcsQ0FBQyxFQUFFLFlBQVksQ0FBQyxHQUFHLFNBQVMsQ0FBQztZQUV2RyxrRUFBa0U7WUFDbEUsSUFBSSxNQUFNLENBQUMsU0FBUyxJQUFJLHFCQUFxQixFQUFFLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBRUQsMkZBQTJGO1lBQzNGLHVGQUF1RjtZQUN2Rix3RkFBd0Y7WUFDeEYsb0ZBQW9GO1lBQ3BGLElBQUksZ0JBQWdCLElBQUksTUFBTSxDQUFDLFNBQVMsS0FBSyxNQUFNLENBQUMsS0FBSyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDaEcsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELElBQ0MsQ0FBQyxNQUFNLENBQUMsT0FBTyxLQUFLLENBQUMsSUFBSSxjQUFjLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUNuRCxDQUFDLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBQyxJQUFJLGNBQWMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFDdEQsQ0FBQztvQkFDRixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN4QixPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBRUQsd0RBQXdEO1lBQ3hELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDO2dCQUM5QyxLQUFLLEVBQUU7b0JBQ04sS0FBSyxFQUFFLHFCQUFxQixHQUFHLFNBQVM7b0JBQ3hDLEdBQUcsRUFBRSxxQkFBcUIsR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUMvRTthQUNELENBQUMsQ0FBQztZQUVILHlGQUF5RjtZQUN6RixzREFBc0Q7WUFDdEQsSUFBSSxnQkFBZ0IsSUFBSSxJQUFBLCtCQUFxQixFQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDckUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDeEIsT0FBTztZQUNSLENBQUM7WUFFRCw4QkFBOEI7WUFDOUIsSUFDQyxPQUFPLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSyxPQUFPO2dCQUMzQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJO2dCQUM3QyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxLQUFLLHFCQUFxQixFQUN2RCxDQUFDO2dCQUNGLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO2dCQUN4RixrREFBa0Q7Z0JBQ2xELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztnQkFDeEQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDekMsSUFBSSxDQUFDLGVBQWUsR0FBRyxPQUFPLENBQUM7Z0JBQy9CLDhDQUE4QztnQkFDOUMsNkRBQTZEO1lBQzlELENBQUM7WUFFRCxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxPQUFPLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRXZCLGtGQUFrRjtnQkFDbEYsZ0ZBQWdGO2dCQUNoRixlQUFlO2dCQUNmLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNuQixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLENBQUM7b0JBQ3RELE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztvQkFDOUMsTUFBTSxhQUFhLEdBQUcscUJBQXFCLEdBQUcsU0FBUyxDQUFDO29CQUV4RCx1RkFBdUY7b0JBQ3ZGLHFCQUFxQjtvQkFDckIsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDO29CQUN4QixJQUFJLENBQUMsZ0JBQWdCLElBQUksT0FBTyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUM3RSxJQUFJLE1BQU0sQ0FBQyxTQUFTLEdBQUcscUJBQXFCLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs0QkFDdkUsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFNBQVMsR0FBRyxxQkFBcUIsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQzs0QkFDL0UsZUFBZSxHQUFHLElBQUksR0FBRyxTQUFTLENBQUM7d0JBQ3BDLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLGFBQWEsR0FBRyxDQUFDLEdBQUcsZUFBZSxJQUFJLENBQUM7Z0JBQzFGLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6QixDQUFDO1FBQ0YsQ0FBQztRQUVPLGNBQWM7WUFDckI7WUFDQyxpQ0FBaUM7WUFDakMsSUFBSSxDQUFDLFFBQVE7Z0JBQ2IsMkZBQTJGO2dCQUMzRixDQUFDLElBQUksQ0FBQyxvQkFBb0I7Z0JBQzFCLHlDQUF5QztnQkFDekMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUN2QyxDQUFDO2dCQUNGLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDO1lBRTFDLE1BQU0sWUFBWSxHQUFHLElBQUEsT0FBQyxFQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFBLE9BQUMsRUFBQyx5QkFBeUIsRUFBRSxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTVELGVBQWU7WUFDZixJQUFJLFVBQVUsR0FBRyxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1lBQzNFLE1BQU0saUNBQWlDLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixxR0FBMkMsQ0FBQztZQUM5SCxJQUFJLGlDQUFpQyxFQUFFLENBQUM7Z0JBQ3ZDLE1BQU0sS0FBSyxHQUFHLGlDQUFpQyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMzRCxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNYLFVBQVUsSUFBSSxJQUFJLEdBQUcsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsV0FBVyxFQUFFLGlDQUFlLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN6SCxDQUFDO1lBQ0YsQ0FBQztZQUNELE1BQU0sNkJBQTZCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQiw2RkFBdUMsQ0FBQztZQUN0SCxJQUFJLDZCQUE2QixFQUFFLENBQUM7Z0JBQ25DLE1BQU0sS0FBSyxHQUFHLDZCQUE2QixDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN2RCxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNYLFVBQVUsSUFBSSxJQUFJLEdBQUcsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsV0FBVyxFQUFFLGlDQUFlLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNySCxDQUFDO1lBQ0YsQ0FBQztZQUNELFlBQVksQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDO1lBRWhDLE1BQU0sY0FBYyxHQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBb0MsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLGNBQWMsQ0FBQztZQUN4RyxJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsY0FBYyxJQUFJLENBQUM7WUFDbkQsQ0FBQztZQUVELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTlDLGlDQUFpQztZQUNqQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsbUNBQTZCLEVBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQ3hFLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztvQkFDL0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO29CQUNsRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN4QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLHVDQUF1QztZQUN2QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsbUNBQTZCLEVBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU5SSxxRkFBcUY7WUFDckYsNkJBQTZCO1lBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSwyQkFBcUIsRUFBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUNuRSxDQUFDLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDN0IsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsMkJBQXFCLEVBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDckUsQ0FBQyxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQzdCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDbkIsSUFBQSxxQ0FBZSxFQUFDLElBQUEsZUFBUyxFQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDMUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLHVGQUF1RjtZQUN2RiwyRkFBMkY7WUFDM0YsZ0RBQWdEO1lBQ2hELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSxtQ0FBNkIsRUFBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSxtQ0FBNkIsRUFBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hJLENBQUM7UUFHTyxZQUFZO1lBQ25CLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDaEMsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkYsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDdkQsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUVPLHlCQUF5QjtZQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQ2hDLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDO1lBRTFDLHFGQUFxRjtZQUNyRiwyRkFBMkY7WUFDM0YsaUNBQWlDO1lBQ2pDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztvQkFDM0QsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUEsK0JBQXVCLEVBQUMsS0FBSyxFQUFDLEtBQUssRUFBQyxFQUFFO3dCQUNoRSxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO3dCQUM1RCxJQUFJLENBQUMsS0FBSyxDQUFDLHVCQUF1QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQzs0QkFDL0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQzs0QkFDNUMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsMENBQTBDO2dDQUN4RSxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQzVDLENBQUM7d0JBQ0YsQ0FBQzt3QkFDRCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsU0FBUyxDQUFDO29CQUN0QyxDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxNQUFNLEVBQUUsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLFNBQVMsQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztRQUVPLFdBQVc7WUFDbEIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO1lBQ2xDLE9BQU87Z0JBQ04saUJBQWlCLEVBQUUsSUFBSTtnQkFDdkIsbUJBQW1CLEVBQUUsTUFBTTtnQkFDM0IsVUFBVSxFQUFFLENBQUM7Z0JBQ2IsUUFBUSxFQUFFLEtBQUs7Z0JBRWYsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO2dCQUM1QixnQkFBZ0IsRUFBRSxDQUFDLENBQUMsZ0JBQWdCO2dCQUNwQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFVBQVU7Z0JBQ3hCLFVBQVUsRUFBRSxDQUFDLENBQUMsVUFBVTtnQkFDeEIsY0FBYyxFQUFFLENBQUMsQ0FBQyxjQUFjO2dCQUNoQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVE7Z0JBQ3BCLGFBQWEsRUFBRSxDQUFDLENBQUMsYUFBYTtnQkFDOUIsVUFBVSxFQUFFLENBQUMsQ0FBQyxVQUFVO2dCQUN4QiwwQkFBMEIsRUFBRSxDQUFDLENBQUMsMEJBQTBCO2dCQUN4RCxvQkFBb0IsRUFBRSxDQUFDLENBQUMsb0JBQW9CO2dCQUM1QyxZQUFZLEVBQUUsQ0FBQyxDQUFDLFlBQVk7Z0JBQzVCLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxrQkFBa0I7YUFDeEMsQ0FBQztRQUNILENBQUM7UUFFTyxTQUFTLENBQUMsVUFBbUI7WUFDcEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNqRCxPQUFPO2dCQUNOLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUU7Z0JBQzlCLFVBQVUsRUFBRSxVQUFVO29CQUNyQixDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyx1RUFBbUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxRQUFRLEVBQUU7b0JBQ25JLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGtFQUE4QixDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUFFLFFBQVEsRUFBRTtnQkFDL0gsbUJBQW1CLEVBQUUsU0FBUztnQkFDOUIsMkJBQTJCLEVBQUUsU0FBUzthQUN0QyxDQUFDO1FBQ0gsQ0FBQztRQUdhLEFBQU4sS0FBSyxDQUFDLDBCQUEwQjtZQUN2QyxNQUFNLENBQUMsR0FBRyxNQUFNLElBQUEsMEJBQW1CLEVBQXVDLHFCQUFxQixFQUFFLDJCQUEyQixDQUFDLENBQUM7WUFDOUgsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFDO1FBQ3RCLENBQUM7UUFHYSxBQUFOLEtBQUssQ0FBQyw2QkFBNkI7WUFDMUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxJQUFBLDBCQUFtQixFQUEwQyx3QkFBd0IsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1lBQ2pJLE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQztRQUN6QixDQUFDO0tBQ0QsQ0FBQTtJQTdiWSxrRUFBMkI7SUF5Vy9CO1FBRFAsSUFBQSxxQkFBUSxFQUFDLENBQUMsQ0FBQzttRUFRWDtJQW1FYTtRQURiLG9CQUFPO2lGQUlQO0lBR2E7UUFEYixvQkFBTztvRkFJUDswQ0E1YlcsMkJBQTJCO1FBd0JyQyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsc0JBQVksQ0FBQTtRQUNaLFlBQUEsNEJBQWEsQ0FBQTtPQTdCSCwyQkFBMkIsQ0E2YnZDO0lBRUQsU0FBUyxjQUFjLENBQUMsSUFBNkIsRUFBRSxJQUFZO1FBQ2xFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNYLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdEMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUM3QyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDIn0=