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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/terminal/common/terminal", "vs/base/browser/browser", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/notification/common/notification", "vs/workbench/contrib/terminal/browser/xterm/markNavigationAddon", "vs/nls", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/platform/terminal/common/xterm/shellIntegrationAddon", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/xterm/decorationAddon", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/amdX", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/clipboard/common/clipboardService", "vs/base/common/decorators", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/browser/mouseEvent", "vs/platform/layout/browser/layoutService", "vs/platform/accessibilitySignal/browser/accessibilitySignalService"], function (require, exports, dom, configuration_1, lifecycle_1, terminal_1, browser_1, log_1, storage_1, notification_1, markNavigationAddon_1, nls_1, themeService_1, theme_1, terminalColorRegistry_1, shellIntegrationAddon_1, instantiation_1, decorationAddon_1, event_1, telemetry_1, amdX_1, contextkey_1, terminalContextKey_1, clipboardService_1, decorators_1, scrollableElement_1, mouseEvent_1, layoutService_1, accessibilitySignalService_1) {
    "use strict";
    var XtermTerminal_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.XtermTerminal = void 0;
    exports.getXtermScaledDimensions = getXtermScaledDimensions;
    var RenderConstants;
    (function (RenderConstants) {
        /**
         * How long in milliseconds should an average frame take to render for a notification to appear
         * which suggests the fallback DOM-based renderer.
         */
        RenderConstants[RenderConstants["SlowCanvasRenderThreshold"] = 50] = "SlowCanvasRenderThreshold";
        RenderConstants[RenderConstants["NumberOfFramestoMeasure"] = 20] = "NumberOfFramestoMeasure";
        RenderConstants[RenderConstants["SmoothScrollDuration"] = 125] = "SmoothScrollDuration";
    })(RenderConstants || (RenderConstants = {}));
    let CanvasAddon;
    let ImageAddon;
    let SearchAddon;
    let SerializeAddon;
    let Unicode11Addon;
    let WebglAddon;
    function getFullBufferLineAsString(lineIndex, buffer) {
        let line = buffer.getLine(lineIndex);
        if (!line) {
            return { lineData: undefined, lineIndex };
        }
        let lineData = line.translateToString(true);
        while (lineIndex > 0 && line.isWrapped) {
            line = buffer.getLine(--lineIndex);
            if (!line) {
                break;
            }
            lineData = line.translateToString(false) + lineData;
        }
        return { lineData, lineIndex };
    }
    // DEBUG: This helper can be used to draw image data to the console, it's commented out as we don't
    //        want to ship it, but this is very useful for investigating texture atlas issues.
    // (console as any).image = (source: ImageData | HTMLCanvasElement, scale: number = 1) => {
    // 	function getBox(width: number, height: number) {
    // 		return {
    // 			string: '+',
    // 			style: 'font-size: 1px; padding: ' + Math.floor(height/2) + 'px ' + Math.floor(width/2) + 'px; line-height: ' + height + 'px;'
    // 		};
    // 	}
    // 	if (source instanceof HTMLCanvasElement) {
    // 		source = source.getContext('2d')?.getImageData(0, 0, source.width, source.height)!;
    // 	}
    // 	const canvas = document.createElement('canvas');
    // 	canvas.width = source.width;
    // 	canvas.height = source.height;
    // 	const ctx = canvas.getContext('2d')!;
    // 	ctx.putImageData(source, 0, 0);
    // 	const sw = source.width * scale;
    // 	const sh = source.height * scale;
    // 	const dim = getBox(sw, sh);
    // 	console.log(
    // 		`Image: ${source.width} x ${source.height}\n%c${dim.string}`,
    // 		`${dim.style}background: url(${canvas.toDataURL()}); background-size: ${sw}px ${sh}px; background-repeat: no-repeat; color: transparent;`
    // 	);
    // 	console.groupCollapsed('Zoomed');
    // 	console.log(
    // 		`%c${dim.string}`,
    // 		`${getBox(sw * 10, sh * 10).style}background: url(${canvas.toDataURL()}); background-size: ${sw * 10}px ${sh * 10}px; background-repeat: no-repeat; color: transparent; image-rendering: pixelated;-ms-interpolation-mode: nearest-neighbor;`
    // 	);
    // 	console.groupEnd();
    // };
    /**
     * Wraps the xterm object with additional functionality. Interaction with the backing process is out
     * of the scope of this class.
     */
    let XtermTerminal = class XtermTerminal extends lifecycle_1.Disposable {
        static { XtermTerminal_1 = this; }
        static { this._suggestedRendererType = undefined; }
        static { this._checkedWebglCompatible = false; }
        get findResult() { return this._lastFindResult; }
        get isStdinDisabled() { return !!this.raw.options.disableStdin; }
        get isGpuAccelerated() { return !!(this._canvasAddon || this._webglAddon); }
        get markTracker() { return this._markNavigationAddon; }
        get shellIntegration() { return this._shellIntegrationAddon; }
        get textureAtlas() {
            const canvas = this._webglAddon?.textureAtlas || this._canvasAddon?.textureAtlas;
            if (!canvas) {
                return undefined;
            }
            return createImageBitmap(canvas);
        }
        get isFocused() {
            if (!this.raw.element) {
                return false;
            }
            return dom.isAncestorOfActiveElement(this.raw.element);
        }
        /**
         * @param xtermCtor The xterm.js constructor, this is passed in so it can be fetched lazily
         * outside of this class such that {@link raw} is not nullable.
         */
        constructor(xtermCtor, _configHelper, cols, rows, _xtermColorProvider, _capabilities, shellIntegrationNonce, disableShellIntegrationReporting, _configurationService, _instantiationService, _logService, _notificationService, _storageService, _themeService, _telemetryService, _clipboardService, contextKeyService, _accessibilitySignalService, layoutService) {
            super();
            this._configHelper = _configHelper;
            this._xtermColorProvider = _xtermColorProvider;
            this._capabilities = _capabilities;
            this._configurationService = _configurationService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._notificationService = _notificationService;
            this._storageService = _storageService;
            this._themeService = _themeService;
            this._telemetryService = _telemetryService;
            this._clipboardService = _clipboardService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._isPhysicalMouseWheel = scrollableElement_1.MouseWheelClassifier.INSTANCE.isPhysicalMouseWheel();
            this._attachedDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onDidRequestRunCommand = this._register(new event_1.Emitter());
            this.onDidRequestRunCommand = this._onDidRequestRunCommand.event;
            this._onDidRequestFocus = this._register(new event_1.Emitter());
            this.onDidRequestFocus = this._onDidRequestFocus.event;
            this._onDidRequestSendText = this._register(new event_1.Emitter());
            this.onDidRequestSendText = this._onDidRequestSendText.event;
            this._onDidRequestFreePort = this._register(new event_1.Emitter());
            this.onDidRequestFreePort = this._onDidRequestFreePort.event;
            this._onDidChangeFindResults = this._register(new event_1.Emitter());
            this.onDidChangeFindResults = this._onDidChangeFindResults.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeFocus = this._register(new event_1.Emitter());
            this.onDidChangeFocus = this._onDidChangeFocus.event;
            this._onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this._onDidDispose.event;
            const font = this._configHelper.getFont(dom.getActiveWindow(), undefined, true);
            const config = this._configHelper.config;
            const editorOptions = this._configurationService.getValue('editor');
            this.raw = this._register(new xtermCtor({
                allowProposedApi: true,
                cols,
                rows,
                documentOverride: layoutService.mainContainer.ownerDocument,
                altClickMovesCursor: config.altClickMovesCursor && editorOptions.multiCursorModifier === 'alt',
                scrollback: config.scrollback,
                theme: this.getXtermTheme(),
                drawBoldTextInBrightColors: config.drawBoldTextInBrightColors,
                fontFamily: font.fontFamily,
                fontWeight: config.fontWeight,
                fontWeightBold: config.fontWeightBold,
                fontSize: font.fontSize,
                letterSpacing: font.letterSpacing,
                lineHeight: font.lineHeight,
                logLevel: vscodeToXtermLogLevel(this._logService.getLevel()),
                logger: this._logService,
                minimumContrastRatio: config.minimumContrastRatio,
                tabStopWidth: config.tabStopWidth,
                cursorBlink: config.cursorBlinking,
                cursorStyle: vscodeToXtermCursorStyle(config.cursorStyle),
                cursorInactiveStyle: vscodeToXtermCursorStyle(config.cursorStyleInactive),
                cursorWidth: config.cursorWidth,
                macOptionIsMeta: config.macOptionIsMeta,
                macOptionClickForcesSelection: config.macOptionClickForcesSelection,
                rightClickSelectsWord: config.rightClickBehavior === 'selectWord',
                fastScrollModifier: 'alt',
                fastScrollSensitivity: config.fastScrollSensitivity,
                scrollSensitivity: config.mouseWheelScrollSensitivity,
                wordSeparator: config.wordSeparators,
                overviewRulerWidth: 10,
                ignoreBracketedPasteMode: config.ignoreBracketedPasteMode,
                rescaleOverlappingGlyphs: config.rescaleOverlappingGlyphs,
            }));
            this._updateSmoothScrolling();
            this._core = this.raw._core;
            this._register(this._configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration("terminal.integrated.gpuAcceleration" /* TerminalSettingId.GpuAcceleration */)) {
                    XtermTerminal_1._suggestedRendererType = undefined;
                }
                if (e.affectsConfiguration('terminal.integrated') || e.affectsConfiguration('editor.fastScrollSensitivity') || e.affectsConfiguration('editor.mouseWheelScrollSensitivity') || e.affectsConfiguration('editor.multiCursorModifier')) {
                    this.updateConfig();
                }
                if (e.affectsConfiguration("terminal.integrated.unicodeVersion" /* TerminalSettingId.UnicodeVersion */)) {
                    this._updateUnicodeVersion();
                }
            }));
            this._register(this._themeService.onDidColorThemeChange(theme => this._updateTheme(theme)));
            this._register(this._logService.onDidChangeLogLevel(e => this.raw.options.logLevel = vscodeToXtermLogLevel(e)));
            // Refire events
            this._register(this.raw.onSelectionChange(() => {
                this._onDidChangeSelection.fire();
                if (this.isFocused) {
                    this._anyFocusedTerminalHasSelection.set(this.raw.hasSelection());
                }
            }));
            // Load addons
            this._updateUnicodeVersion();
            this._markNavigationAddon = this._instantiationService.createInstance(markNavigationAddon_1.MarkNavigationAddon, _capabilities);
            this.raw.loadAddon(this._markNavigationAddon);
            this._decorationAddon = this._instantiationService.createInstance(decorationAddon_1.DecorationAddon, this._capabilities);
            this._register(this._decorationAddon.onDidRequestRunCommand(e => this._onDidRequestRunCommand.fire(e)));
            this.raw.loadAddon(this._decorationAddon);
            this._shellIntegrationAddon = new shellIntegrationAddon_1.ShellIntegrationAddon(shellIntegrationNonce, disableShellIntegrationReporting, this._telemetryService, this._logService);
            this.raw.loadAddon(this._shellIntegrationAddon);
            this._anyTerminalFocusContextKey = terminalContextKey_1.TerminalContextKeys.focusInAny.bindTo(contextKeyService);
            this._anyFocusedTerminalHasSelection = terminalContextKey_1.TerminalContextKeys.textSelectedInFocused.bindTo(contextKeyService);
        }
        *getBufferReverseIterator() {
            for (let i = this.raw.buffer.active.length; i >= 0; i--) {
                const { lineData, lineIndex } = getFullBufferLineAsString(i, this.raw.buffer.active);
                if (lineData) {
                    i = lineIndex;
                    yield lineData;
                }
            }
        }
        async getContentsAsHtml() {
            if (!this._serializeAddon) {
                const Addon = await this._getSerializeAddonConstructor();
                this._serializeAddon = new Addon();
                this.raw.loadAddon(this._serializeAddon);
            }
            return this._serializeAddon.serializeAsHTML();
        }
        async getSelectionAsHtml(command) {
            if (!this._serializeAddon) {
                const Addon = await this._getSerializeAddonConstructor();
                this._serializeAddon = new Addon();
                this.raw.loadAddon(this._serializeAddon);
            }
            if (command) {
                const length = command.getOutput()?.length;
                const row = command.marker?.line;
                if (!length || !row) {
                    throw new Error(`No row ${row} or output length ${length} for command ${command}`);
                }
                this.raw.select(0, row + 1, length - Math.floor(length / this.raw.cols));
            }
            const result = this._serializeAddon.serializeAsHTML({ onlySelection: true });
            if (command) {
                this.raw.clearSelection();
            }
            return result;
        }
        attachToElement(container, partialOptions) {
            const options = { enableGpu: true, ...partialOptions };
            if (!this._attached) {
                this.raw.open(container);
            }
            // TODO: Move before open to the DOM renderer doesn't initialize
            if (options.enableGpu) {
                if (this._shouldLoadWebgl()) {
                    this._enableWebglRenderer();
                }
                else if (this._shouldLoadCanvas()) {
                    this._enableCanvasRenderer();
                }
            }
            if (!this.raw.element || !this.raw.textarea) {
                throw new Error('xterm elements not set after open');
            }
            const ad = this._attachedDisposables;
            ad.clear();
            ad.add(dom.addDisposableListener(this.raw.textarea, 'focus', () => this._setFocused(true)));
            ad.add(dom.addDisposableListener(this.raw.textarea, 'blur', () => this._setFocused(false)));
            ad.add(dom.addDisposableListener(this.raw.textarea, 'focusout', () => this._setFocused(false)));
            // Track wheel events in mouse wheel classifier and update smoothScrolling when it changes
            // as it must be disabled when a trackpad is used
            ad.add(dom.addDisposableListener(this.raw.element, dom.EventType.MOUSE_WHEEL, (e) => {
                const classifier = scrollableElement_1.MouseWheelClassifier.INSTANCE;
                classifier.acceptStandardWheelEvent(new mouseEvent_1.StandardWheelEvent(e));
                const value = classifier.isPhysicalMouseWheel();
                if (value !== this._isPhysicalMouseWheel) {
                    this._isPhysicalMouseWheel = value;
                    this._updateSmoothScrolling();
                }
            }, { passive: true }));
            this._attached = { container, options };
            // Screen must be created at this point as xterm.open is called
            return this._attached?.container.querySelector('.xterm-screen');
        }
        _setFocused(isFocused) {
            this._onDidChangeFocus.fire(isFocused);
            this._anyTerminalFocusContextKey.set(isFocused);
            this._anyFocusedTerminalHasSelection.set(isFocused && this.raw.hasSelection());
        }
        write(data, callback) {
            this.raw.write(data, callback);
        }
        resize(columns, rows) {
            this.raw.resize(columns, rows);
        }
        updateConfig() {
            const config = this._configHelper.config;
            this.raw.options.altClickMovesCursor = config.altClickMovesCursor;
            this._setCursorBlink(config.cursorBlinking);
            this._setCursorStyle(config.cursorStyle);
            this._setCursorStyleInactive(config.cursorStyleInactive);
            this._setCursorWidth(config.cursorWidth);
            this.raw.options.scrollback = config.scrollback;
            this.raw.options.drawBoldTextInBrightColors = config.drawBoldTextInBrightColors;
            this.raw.options.minimumContrastRatio = config.minimumContrastRatio;
            this.raw.options.tabStopWidth = config.tabStopWidth;
            this.raw.options.fastScrollSensitivity = config.fastScrollSensitivity;
            this.raw.options.scrollSensitivity = config.mouseWheelScrollSensitivity;
            this.raw.options.macOptionIsMeta = config.macOptionIsMeta;
            const editorOptions = this._configurationService.getValue('editor');
            this.raw.options.altClickMovesCursor = config.altClickMovesCursor && editorOptions.multiCursorModifier === 'alt';
            this.raw.options.macOptionClickForcesSelection = config.macOptionClickForcesSelection;
            this.raw.options.rightClickSelectsWord = config.rightClickBehavior === 'selectWord';
            this.raw.options.wordSeparator = config.wordSeparators;
            this.raw.options.customGlyphs = config.customGlyphs;
            this.raw.options.ignoreBracketedPasteMode = config.ignoreBracketedPasteMode;
            this.raw.options.rescaleOverlappingGlyphs = config.rescaleOverlappingGlyphs;
            this._updateSmoothScrolling();
            if (this._attached?.options.enableGpu) {
                if (this._shouldLoadWebgl()) {
                    this._enableWebglRenderer();
                }
                else {
                    this._disposeOfWebglRenderer();
                    if (this._shouldLoadCanvas()) {
                        this._enableCanvasRenderer();
                    }
                    else {
                        this._disposeOfCanvasRenderer();
                    }
                }
            }
        }
        _updateSmoothScrolling() {
            this.raw.options.smoothScrollDuration = this._configHelper.config.smoothScrolling && this._isPhysicalMouseWheel ? 125 /* RenderConstants.SmoothScrollDuration */ : 0;
        }
        _shouldLoadWebgl() {
            return !browser_1.isSafari && (this._configHelper.config.gpuAcceleration === 'auto' && XtermTerminal_1._suggestedRendererType === undefined) || this._configHelper.config.gpuAcceleration === 'on';
        }
        _shouldLoadCanvas() {
            return (this._configHelper.config.gpuAcceleration === 'auto' && (XtermTerminal_1._suggestedRendererType === undefined || XtermTerminal_1._suggestedRendererType === 'canvas')) || this._configHelper.config.gpuAcceleration === 'canvas';
        }
        forceRedraw() {
            this.raw.clearTextureAtlas();
        }
        clearDecorations() {
            this._decorationAddon?.clearDecorations();
        }
        forceRefresh() {
            this._core.viewport?._innerRefresh();
        }
        forceUnpause() {
            // HACK: Force the renderer to unpause by simulating an IntersectionObserver event.
            // This is to fix an issue where dragging the windpow to the top of the screen to
            // maximize on Windows/Linux would fire an event saying that the terminal was not
            // visible.
            if (!!this._canvasAddon) {
                this._core._renderService?._handleIntersectionChange({ intersectionRatio: 1 });
                // HACK: Force a refresh of the screen to ensure links are refresh corrected.
                // This can probably be removed when the above hack is fixed in Chromium.
                this.raw.refresh(0, this.raw.rows - 1);
            }
        }
        async findNext(term, searchOptions) {
            this._updateFindColors(searchOptions);
            return (await this._getSearchAddon()).findNext(term, searchOptions);
        }
        async findPrevious(term, searchOptions) {
            this._updateFindColors(searchOptions);
            return (await this._getSearchAddon()).findPrevious(term, searchOptions);
        }
        _updateFindColors(searchOptions) {
            const theme = this._themeService.getColorTheme();
            // Theme color names align with monaco/vscode whereas xterm.js has some different naming.
            // The mapping is as follows:
            // - findMatch -> activeMatch
            // - findMatchHighlight -> match
            const terminalBackground = theme.getColor(terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR) || theme.getColor(theme_1.PANEL_BACKGROUND);
            const findMatchBackground = theme.getColor(terminalColorRegistry_1.TERMINAL_FIND_MATCH_BACKGROUND_COLOR);
            const findMatchBorder = theme.getColor(terminalColorRegistry_1.TERMINAL_FIND_MATCH_BORDER_COLOR);
            const findMatchOverviewRuler = theme.getColor(terminalColorRegistry_1.TERMINAL_OVERVIEW_RULER_CURSOR_FOREGROUND_COLOR);
            const findMatchHighlightBackground = theme.getColor(terminalColorRegistry_1.TERMINAL_FIND_MATCH_HIGHLIGHT_BACKGROUND_COLOR);
            const findMatchHighlightBorder = theme.getColor(terminalColorRegistry_1.TERMINAL_FIND_MATCH_HIGHLIGHT_BORDER_COLOR);
            const findMatchHighlightOverviewRuler = theme.getColor(terminalColorRegistry_1.TERMINAL_OVERVIEW_RULER_FIND_MATCH_FOREGROUND_COLOR);
            searchOptions.decorations = {
                activeMatchBackground: findMatchBackground?.toString(),
                activeMatchBorder: findMatchBorder?.toString() || 'transparent',
                activeMatchColorOverviewRuler: findMatchOverviewRuler?.toString() || 'transparent',
                // decoration bgs don't support the alpha channel so blend it with the regular bg
                matchBackground: terminalBackground ? findMatchHighlightBackground?.blend(terminalBackground).toString() : undefined,
                matchBorder: findMatchHighlightBorder?.toString() || 'transparent',
                matchOverviewRuler: findMatchHighlightOverviewRuler?.toString() || 'transparent'
            };
        }
        _getSearchAddon() {
            if (!this._searchAddonPromise) {
                this._searchAddonPromise = this._getSearchAddonConstructor().then((AddonCtor) => {
                    this._searchAddon = new AddonCtor({ highlightLimit: 1000 /* XtermTerminalConstants.SearchHighlightLimit */ });
                    this.raw.loadAddon(this._searchAddon);
                    this._searchAddon.onDidChangeResults((results) => {
                        this._lastFindResult = results;
                        this._onDidChangeFindResults.fire(results);
                    });
                    return this._searchAddon;
                });
            }
            return this._searchAddonPromise;
        }
        clearSearchDecorations() {
            this._searchAddon?.clearDecorations();
        }
        clearActiveSearchDecoration() {
            this._searchAddon?.clearActiveDecoration();
        }
        getFont() {
            return this._configHelper.getFont(dom.getWindow(this.raw.element), this._core);
        }
        getLongestViewportWrappedLineLength() {
            let maxLineLength = 0;
            for (let i = this.raw.buffer.active.length - 1; i >= this.raw.buffer.active.viewportY; i--) {
                const lineInfo = this._getWrappedLineCount(i, this.raw.buffer.active);
                maxLineLength = Math.max(maxLineLength, ((lineInfo.lineCount * this.raw.cols) - lineInfo.endSpaces) || 0);
                i = lineInfo.currentIndex;
            }
            return maxLineLength;
        }
        _getWrappedLineCount(index, buffer) {
            let line = buffer.getLine(index);
            if (!line) {
                throw new Error('Could not get line');
            }
            let currentIndex = index;
            let endSpaces = 0;
            // line.length may exceed cols as it doesn't necessarily trim the backing array on resize
            for (let i = Math.min(line.length, this.raw.cols) - 1; i >= 0; i--) {
                if (!line?.getCell(i)?.getChars()) {
                    endSpaces++;
                }
                else {
                    break;
                }
            }
            while (line?.isWrapped && currentIndex > 0) {
                currentIndex--;
                line = buffer.getLine(currentIndex);
            }
            return { lineCount: index - currentIndex + 1, currentIndex, endSpaces };
        }
        scrollDownLine() {
            this.raw.scrollLines(1);
        }
        scrollDownPage() {
            this.raw.scrollPages(1);
        }
        scrollToBottom() {
            this.raw.scrollToBottom();
        }
        scrollUpLine() {
            this.raw.scrollLines(-1);
        }
        scrollUpPage() {
            this.raw.scrollPages(-1);
        }
        scrollToTop() {
            this.raw.scrollToTop();
        }
        scrollToLine(line, position = 0 /* ScrollPosition.Top */) {
            this.markTracker.scrollToLine(line, position);
        }
        clearBuffer() {
            this.raw.clear();
            // xterm.js does not clear the first prompt, so trigger these to simulate
            // the prompt being written
            this._capabilities.get(2 /* TerminalCapability.CommandDetection */)?.handlePromptStart();
            this._capabilities.get(2 /* TerminalCapability.CommandDetection */)?.handleCommandStart();
            this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.clear);
        }
        hasSelection() {
            return this.raw.hasSelection();
        }
        clearSelection() {
            this.raw.clearSelection();
        }
        selectMarkedRange(fromMarkerId, toMarkerId, scrollIntoView = false) {
            const detectionCapability = this.shellIntegration.capabilities.get(4 /* TerminalCapability.BufferMarkDetection */);
            if (!detectionCapability) {
                return;
            }
            const start = detectionCapability.getMark(fromMarkerId);
            const end = detectionCapability.getMark(toMarkerId);
            if (start === undefined || end === undefined) {
                return;
            }
            this.raw.selectLines(start.line, end.line);
            if (scrollIntoView) {
                this.raw.scrollToLine(start.line);
            }
        }
        selectAll() {
            this.raw.focus();
            this.raw.selectAll();
        }
        focus() {
            this.raw.focus();
        }
        async copySelection(asHtml, command) {
            if (this.hasSelection() || (asHtml && command)) {
                if (asHtml) {
                    const textAsHtml = await this.getSelectionAsHtml(command);
                    function listener(e) {
                        if (!e.clipboardData.types.includes('text/plain')) {
                            e.clipboardData.setData('text/plain', command?.getOutput() ?? '');
                        }
                        e.clipboardData.setData('text/html', textAsHtml);
                        e.preventDefault();
                    }
                    const doc = dom.getDocument(this.raw.element);
                    doc.addEventListener('copy', listener);
                    doc.execCommand('copy');
                    doc.removeEventListener('copy', listener);
                }
                else {
                    await this._clipboardService.writeText(this.raw.getSelection());
                }
            }
            else {
                this._notificationService.warn((0, nls_1.localize)('terminal.integrated.copySelection.noSelection', 'The terminal has no selection to copy'));
            }
        }
        _setCursorBlink(blink) {
            if (this.raw.options.cursorBlink !== blink) {
                this.raw.options.cursorBlink = blink;
                this.raw.refresh(0, this.raw.rows - 1);
            }
        }
        _setCursorStyle(style) {
            const mapped = vscodeToXtermCursorStyle(style);
            if (this.raw.options.cursorStyle !== mapped) {
                this.raw.options.cursorStyle = mapped;
            }
        }
        _setCursorStyleInactive(style) {
            const mapped = vscodeToXtermCursorStyle(style);
            if (this.raw.options.cursorInactiveStyle !== mapped) {
                this.raw.options.cursorInactiveStyle = mapped;
            }
        }
        _setCursorWidth(width) {
            if (this.raw.options.cursorWidth !== width) {
                this.raw.options.cursorWidth = width;
            }
        }
        async _enableWebglRenderer() {
            if (!this.raw.element || this._webglAddon) {
                return;
            }
            // Check if the the WebGL renderer is compatible with xterm.js:
            // - https://github.com/microsoft/vscode/issues/190195
            // - https://github.com/xtermjs/xterm.js/issues/4665
            // - https://bugs.chromium.org/p/chromium/issues/detail?id=1476475
            if (!XtermTerminal_1._checkedWebglCompatible) {
                XtermTerminal_1._checkedWebglCompatible = true;
                const checkCanvas = document.createElement('canvas');
                const checkGl = checkCanvas.getContext('webgl2');
                const debugInfo = checkGl?.getExtension('WEBGL_debug_renderer_info');
                if (checkGl && debugInfo) {
                    const renderer = checkGl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    if (renderer.startsWith('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)')) {
                        this._disableWebglForThisSession();
                        return;
                    }
                }
            }
            const Addon = await this._getWebglAddonConstructor();
            this._webglAddon = new Addon();
            this._disposeOfCanvasRenderer();
            try {
                this.raw.loadAddon(this._webglAddon);
                this._logService.trace('Webgl was loaded');
                this._webglAddon.onContextLoss(() => {
                    this._logService.info(`Webgl lost context, disposing of webgl renderer`);
                    this._disposeOfWebglRenderer();
                });
                this._refreshImageAddon();
                // Uncomment to add the texture atlas to the DOM
                // setTimeout(() => {
                // 	if (this._webglAddon?.textureAtlas) {
                // 		document.body.appendChild(this._webglAddon?.textureAtlas);
                // 	}
                // }, 5000);
            }
            catch (e) {
                this._logService.warn(`Webgl could not be loaded. Falling back to the canvas renderer type.`, e);
                const neverMeasureRenderTime = this._storageService.getBoolean("terminal.integrated.neverMeasureRenderTime" /* TerminalStorageKeys.NeverMeasureRenderTime */, -1 /* StorageScope.APPLICATION */, false);
                // if it's already set to dom, no need to measure render time
                if (!neverMeasureRenderTime && this._configHelper.config.gpuAcceleration !== 'off') {
                    this._measureRenderTime();
                }
                this._disableWebglForThisSession();
            }
        }
        _disableWebglForThisSession() {
            XtermTerminal_1._suggestedRendererType = 'canvas';
            this._disposeOfWebglRenderer();
            this._enableCanvasRenderer();
        }
        async _enableCanvasRenderer() {
            if (!this.raw.element || this._canvasAddon) {
                return;
            }
            const Addon = await this._getCanvasAddonConstructor();
            this._canvasAddon = new Addon();
            this._disposeOfWebglRenderer();
            try {
                this.raw.loadAddon(this._canvasAddon);
                this._logService.trace('Canvas renderer was loaded');
            }
            catch (e) {
                this._logService.warn(`Canvas renderer could not be loaded, falling back to dom renderer`, e);
                const neverMeasureRenderTime = this._storageService.getBoolean("terminal.integrated.neverMeasureRenderTime" /* TerminalStorageKeys.NeverMeasureRenderTime */, -1 /* StorageScope.APPLICATION */, false);
                // if it's already set to dom, no need to measure render time
                if (!neverMeasureRenderTime && this._configHelper.config.gpuAcceleration !== 'off') {
                    this._measureRenderTime();
                }
                XtermTerminal_1._suggestedRendererType = 'dom';
                this._disposeOfCanvasRenderer();
            }
            this._refreshImageAddon();
        }
        async _getCanvasAddonConstructor() {
            if (!CanvasAddon) {
                CanvasAddon = (await (0, amdX_1.importAMDNodeModule)('@xterm/addon-canvas', 'lib/xterm-addon-canvas.js')).CanvasAddon;
            }
            return CanvasAddon;
        }
        async _refreshImageAddon() {
            // Only allow the image addon when a canvas is being used to avoid possible GPU issues
            if (this._configHelper.config.enableImages && (this._canvasAddon || this._webglAddon)) {
                if (!this._imageAddon) {
                    const AddonCtor = await this._getImageAddonConstructor();
                    this._imageAddon = new AddonCtor();
                    this.raw.loadAddon(this._imageAddon);
                }
            }
            else {
                try {
                    this._imageAddon?.dispose();
                }
                catch {
                    // ignore
                }
                this._imageAddon = undefined;
            }
        }
        async _getImageAddonConstructor() {
            if (!ImageAddon) {
                ImageAddon = (await (0, amdX_1.importAMDNodeModule)('@xterm/addon-image', 'lib/addon-image.js')).ImageAddon;
            }
            return ImageAddon;
        }
        async _getSearchAddonConstructor() {
            if (!SearchAddon) {
                SearchAddon = (await (0, amdX_1.importAMDNodeModule)('@xterm/addon-search', 'lib/addon-search.js')).SearchAddon;
            }
            return SearchAddon;
        }
        async _getUnicode11Constructor() {
            if (!Unicode11Addon) {
                Unicode11Addon = (await (0, amdX_1.importAMDNodeModule)('@xterm/addon-unicode11', 'lib/addon-unicode11.js')).Unicode11Addon;
            }
            return Unicode11Addon;
        }
        async _getWebglAddonConstructor() {
            if (!WebglAddon) {
                WebglAddon = (await (0, amdX_1.importAMDNodeModule)('@xterm/addon-webgl', 'lib/addon-webgl.js')).WebglAddon;
            }
            return WebglAddon;
        }
        async _getSerializeAddonConstructor() {
            if (!SerializeAddon) {
                SerializeAddon = (await (0, amdX_1.importAMDNodeModule)('@xterm/addon-serialize', 'lib/addon-serialize.js')).SerializeAddon;
            }
            return SerializeAddon;
        }
        _disposeOfCanvasRenderer() {
            try {
                this._canvasAddon?.dispose();
            }
            catch {
                // ignore
            }
            this._canvasAddon = undefined;
            this._refreshImageAddon();
        }
        _disposeOfWebglRenderer() {
            try {
                this._webglAddon?.dispose();
            }
            catch {
                // ignore
            }
            this._webglAddon = undefined;
            this._refreshImageAddon();
        }
        async _measureRenderTime() {
            const frameTimes = [];
            if (!this._core._renderService?._renderer.value?._renderLayers) {
                return;
            }
            const textRenderLayer = this._core._renderService._renderer.value._renderLayers[0];
            const originalOnGridChanged = textRenderLayer?.onGridChanged;
            const evaluateCanvasRenderer = () => {
                // Discard first frame time as it's normal to take longer
                frameTimes.shift();
                const medianTime = frameTimes.sort((a, b) => a - b)[Math.floor(frameTimes.length / 2)];
                if (medianTime > 50 /* RenderConstants.SlowCanvasRenderThreshold */) {
                    if (this._configHelper.config.gpuAcceleration === 'auto') {
                        XtermTerminal_1._suggestedRendererType = 'dom';
                        this.updateConfig();
                    }
                    else {
                        const promptChoices = [
                            {
                                label: (0, nls_1.localize)('yes', "Yes"),
                                run: () => this._configurationService.updateValue("terminal.integrated.gpuAcceleration" /* TerminalSettingId.GpuAcceleration */, 'off', 2 /* ConfigurationTarget.USER */)
                            },
                            {
                                label: (0, nls_1.localize)('no', "No"),
                                run: () => { }
                            },
                            {
                                label: (0, nls_1.localize)('dontShowAgain', "Don't Show Again"),
                                isSecondary: true,
                                run: () => this._storageService.store("terminal.integrated.neverMeasureRenderTime" /* TerminalStorageKeys.NeverMeasureRenderTime */, true, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */)
                            }
                        ];
                        this._notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('terminal.slowRendering', 'Terminal GPU acceleration appears to be slow on your computer. Would you like to switch to disable it which may improve performance? [Read more about terminal settings](https://code.visualstudio.com/docs/editor/integrated-terminal#_changing-how-the-terminal-is-rendered).'), promptChoices);
                    }
                }
            };
            textRenderLayer.onGridChanged = (terminal, firstRow, lastRow) => {
                const startTime = performance.now();
                originalOnGridChanged.call(textRenderLayer, terminal, firstRow, lastRow);
                frameTimes.push(performance.now() - startTime);
                if (frameTimes.length === 20 /* RenderConstants.NumberOfFramestoMeasure */) {
                    evaluateCanvasRenderer();
                    // Restore original function
                    textRenderLayer.onGridChanged = originalOnGridChanged;
                }
            };
        }
        getXtermTheme(theme) {
            if (!theme) {
                theme = this._themeService.getColorTheme();
            }
            const foregroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_FOREGROUND_COLOR);
            const backgroundColor = this._xtermColorProvider.getBackgroundColor(theme);
            const cursorColor = theme.getColor(terminalColorRegistry_1.TERMINAL_CURSOR_FOREGROUND_COLOR) || foregroundColor;
            const cursorAccentColor = theme.getColor(terminalColorRegistry_1.TERMINAL_CURSOR_BACKGROUND_COLOR) || backgroundColor;
            const selectionBackgroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_SELECTION_BACKGROUND_COLOR);
            const selectionInactiveBackgroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_INACTIVE_SELECTION_BACKGROUND_COLOR);
            const selectionForegroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_SELECTION_FOREGROUND_COLOR) || undefined;
            return {
                background: backgroundColor?.toString(),
                foreground: foregroundColor?.toString(),
                cursor: cursorColor?.toString(),
                cursorAccent: cursorAccentColor?.toString(),
                selectionBackground: selectionBackgroundColor?.toString(),
                selectionInactiveBackground: selectionInactiveBackgroundColor?.toString(),
                selectionForeground: selectionForegroundColor?.toString(),
                black: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[0])?.toString(),
                red: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[1])?.toString(),
                green: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[2])?.toString(),
                yellow: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[3])?.toString(),
                blue: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[4])?.toString(),
                magenta: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[5])?.toString(),
                cyan: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[6])?.toString(),
                white: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[7])?.toString(),
                brightBlack: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[8])?.toString(),
                brightRed: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[9])?.toString(),
                brightGreen: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[10])?.toString(),
                brightYellow: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[11])?.toString(),
                brightBlue: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[12])?.toString(),
                brightMagenta: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[13])?.toString(),
                brightCyan: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[14])?.toString(),
                brightWhite: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[15])?.toString()
            };
        }
        _updateTheme(theme) {
            this.raw.options.theme = this.getXtermTheme(theme);
        }
        refresh() {
            this._updateTheme();
            this._decorationAddon.refreshLayouts();
        }
        async _updateUnicodeVersion() {
            if (!this._unicode11Addon && this._configHelper.config.unicodeVersion === '11') {
                const Addon = await this._getUnicode11Constructor();
                this._unicode11Addon = new Addon();
                this.raw.loadAddon(this._unicode11Addon);
            }
            if (this.raw.unicode.activeVersion !== this._configHelper.config.unicodeVersion) {
                this.raw.unicode.activeVersion = this._configHelper.config.unicodeVersion;
            }
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _writeText(data) {
            this.raw.write(data);
        }
        dispose() {
            this._anyTerminalFocusContextKey.reset();
            this._anyFocusedTerminalHasSelection.reset();
            this._onDidDispose.fire();
            super.dispose();
        }
    };
    exports.XtermTerminal = XtermTerminal;
    __decorate([
        (0, decorators_1.debounce)(100)
    ], XtermTerminal.prototype, "_refreshImageAddon", null);
    exports.XtermTerminal = XtermTerminal = XtermTerminal_1 = __decorate([
        __param(8, configuration_1.IConfigurationService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, terminal_1.ITerminalLogService),
        __param(11, notification_1.INotificationService),
        __param(12, storage_1.IStorageService),
        __param(13, themeService_1.IThemeService),
        __param(14, telemetry_1.ITelemetryService),
        __param(15, clipboardService_1.IClipboardService),
        __param(16, contextkey_1.IContextKeyService),
        __param(17, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(18, layoutService_1.ILayoutService)
    ], XtermTerminal);
    function getXtermScaledDimensions(w, font, width, height) {
        if (!font.charWidth || !font.charHeight) {
            return null;
        }
        // Because xterm.js converts from CSS pixels to actual pixels through
        // the use of canvas, window.devicePixelRatio needs to be used here in
        // order to be precise. font.charWidth/charHeight alone as insufficient
        // when window.devicePixelRatio changes.
        const scaledWidthAvailable = width * w.devicePixelRatio;
        const scaledCharWidth = font.charWidth * w.devicePixelRatio + font.letterSpacing;
        const cols = Math.max(Math.floor(scaledWidthAvailable / scaledCharWidth), 1);
        const scaledHeightAvailable = height * w.devicePixelRatio;
        const scaledCharHeight = Math.ceil(font.charHeight * w.devicePixelRatio);
        const scaledLineHeight = Math.floor(scaledCharHeight * font.lineHeight);
        const rows = Math.max(Math.floor(scaledHeightAvailable / scaledLineHeight), 1);
        return { rows, cols };
    }
    function vscodeToXtermLogLevel(logLevel) {
        switch (logLevel) {
            case log_1.LogLevel.Trace: return 'trace';
            case log_1.LogLevel.Debug: return 'debug';
            case log_1.LogLevel.Info: return 'info';
            case log_1.LogLevel.Warning: return 'warn';
            case log_1.LogLevel.Error: return 'error';
            default: return 'off';
        }
    }
    function vscodeToXtermCursorStyle(style) {
        // 'line' is used instead of bar in VS Code to be consistent with editor.cursorStyle
        if (style === 'line') {
            return 'bar';
        }
        return style;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHRlcm1UZXJtaW5hbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci94dGVybS94dGVybVRlcm1pbmFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFnOEJoRyw0REFvQkM7SUF4NkJELElBQVcsZUFRVjtJQVJELFdBQVcsZUFBZTtRQUN6Qjs7O1dBR0c7UUFDSCxnR0FBOEIsQ0FBQTtRQUM5Qiw0RkFBNEIsQ0FBQTtRQUM1Qix1RkFBMEIsQ0FBQTtJQUMzQixDQUFDLEVBUlUsZUFBZSxLQUFmLGVBQWUsUUFRekI7SUFFRCxJQUFJLFdBQW1DLENBQUM7SUFDeEMsSUFBSSxVQUFpQyxDQUFDO0lBQ3RDLElBQUksV0FBbUMsQ0FBQztJQUN4QyxJQUFJLGNBQXlDLENBQUM7SUFDOUMsSUFBSSxjQUF5QyxDQUFDO0lBQzlDLElBQUksVUFBaUMsQ0FBQztJQUV0QyxTQUFTLHlCQUF5QixDQUFDLFNBQWlCLEVBQUUsTUFBZTtRQUNwRSxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNYLE9BQU8sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxDQUFDO1FBQzNDLENBQUM7UUFDRCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUMsT0FBTyxTQUFTLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUN4QyxJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxJQUFJLEVBQUUs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