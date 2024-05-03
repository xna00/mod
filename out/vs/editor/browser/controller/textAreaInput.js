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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/keyboardEvent", "vs/base/browser/performance", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/strings", "vs/editor/browser/controller/textAreaState", "vs/editor/common/core/selection", "vs/platform/accessibility/common/accessibility", "vs/platform/log/common/log"], function (require, exports, browser, dom, event_1, keyboardEvent_1, performance_1, async_1, event_2, lifecycle_1, mime_1, strings, textAreaState_1, selection_1, accessibility_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextAreaWrapper = exports.ClipboardEventUtils = exports.TextAreaInput = exports.InMemoryClipboardMetadataManager = exports.CopyOptions = exports.TextAreaSyntethicEvents = void 0;
    var TextAreaSyntethicEvents;
    (function (TextAreaSyntethicEvents) {
        TextAreaSyntethicEvents.Tap = '-monaco-textarea-synthetic-tap';
    })(TextAreaSyntethicEvents || (exports.TextAreaSyntethicEvents = TextAreaSyntethicEvents = {}));
    exports.CopyOptions = {
        forceCopyWithSyntaxHighlighting: false
    };
    /**
     * Every time we write to the clipboard, we record a bit of extra metadata here.
     * Every time we read from the cipboard, if the text matches our last written text,
     * we can fetch the previous metadata.
     */
    class InMemoryClipboardMetadataManager {
        static { this.INSTANCE = new InMemoryClipboardMetadataManager(); }
        constructor() {
            this._lastState = null;
        }
        set(lastCopiedValue, data) {
            this._lastState = { lastCopiedValue, data };
        }
        get(pastedText) {
            if (this._lastState && this._lastState.lastCopiedValue === pastedText) {
                // match!
                return this._lastState.data;
            }
            this._lastState = null;
            return null;
        }
    }
    exports.InMemoryClipboardMetadataManager = InMemoryClipboardMetadataManager;
    class CompositionContext {
        constructor() {
            this._lastTypeTextLength = 0;
        }
        handleCompositionUpdate(text) {
            text = text || '';
            const typeInput = {
                text: text,
                replacePrevCharCnt: this._lastTypeTextLength,
                replaceNextCharCnt: 0,
                positionDelta: 0
            };
            this._lastTypeTextLength = text.length;
            return typeInput;
        }
    }
    /**
     * Writes screen reader content to the textarea and is able to analyze its input events to generate:
     *  - onCut
     *  - onPaste
     *  - onType
     *
     * Composition events are generated for presentation purposes (composition input is reflected in onType).
     */
    let TextAreaInput = class TextAreaInput extends lifecycle_1.Disposable {
        get textAreaState() {
            return this._textAreaState;
        }
        constructor(_host, _textArea, _OS, _browser, _accessibilityService, _logService) {
            super();
            this._host = _host;
            this._textArea = _textArea;
            this._OS = _OS;
            this._browser = _browser;
            this._accessibilityService = _accessibilityService;
            this._logService = _logService;
            this._onFocus = this._register(new event_2.Emitter());
            this.onFocus = this._onFocus.event;
            this._onBlur = this._register(new event_2.Emitter());
            this.onBlur = this._onBlur.event;
            this._onKeyDown = this._register(new event_2.Emitter());
            this.onKeyDown = this._onKeyDown.event;
            this._onKeyUp = this._register(new event_2.Emitter());
            this.onKeyUp = this._onKeyUp.event;
            this._onCut = this._register(new event_2.Emitter());
            this.onCut = this._onCut.event;
            this._onPaste = this._register(new event_2.Emitter());
            this.onPaste = this._onPaste.event;
            this._onType = this._register(new event_2.Emitter());
            this.onType = this._onType.event;
            this._onCompositionStart = this._register(new event_2.Emitter());
            this.onCompositionStart = this._onCompositionStart.event;
            this._onCompositionUpdate = this._register(new event_2.Emitter());
            this.onCompositionUpdate = this._onCompositionUpdate.event;
            this._onCompositionEnd = this._register(new event_2.Emitter());
            this.onCompositionEnd = this._onCompositionEnd.event;
            this._onSelectionChangeRequest = this._register(new event_2.Emitter());
            this.onSelectionChangeRequest = this._onSelectionChangeRequest.event;
            this._asyncFocusGainWriteScreenReaderContent = this._register(new lifecycle_1.MutableDisposable());
            this._asyncTriggerCut = this._register(new async_1.RunOnceScheduler(() => this._onCut.fire(), 0));
            this._textAreaState = textAreaState_1.TextAreaState.EMPTY;
            this._selectionChangeListener = null;
            if (this._accessibilityService.isScreenReaderOptimized()) {
                this.writeNativeTextAreaContent('ctor');
            }
            this._register(event_2.Event.runAndSubscribe(this._accessibilityService.onDidChangeScreenReaderOptimized, () => {
                if (this._accessibilityService.isScreenReaderOptimized() && !this._asyncFocusGainWriteScreenReaderContent.value) {
                    this._asyncFocusGainWriteScreenReaderContent.value = this._register(new async_1.RunOnceScheduler(() => this.writeNativeTextAreaContent('asyncFocusGain'), 0));
                }
                else {
                    this._asyncFocusGainWriteScreenReaderContent.clear();
                }
            }));
            this._hasFocus = false;
            this._currentComposition = null;
            let lastKeyDown = null;
            this._register(this._textArea.onKeyDown((_e) => {
                const e = new keyboardEvent_1.StandardKeyboardEvent(_e);
                if (e.keyCode === 114 /* KeyCode.KEY_IN_COMPOSITION */
                    || (this._currentComposition && e.keyCode === 1 /* KeyCode.Backspace */)) {
                    // Stop propagation for keyDown events if the IME is processing key input
                    e.stopPropagation();
                }
                if (e.equals(9 /* KeyCode.Escape */)) {
                    // Prevent default always for `Esc`, otherwise it will generate a keypress
                    // See https://msdn.microsoft.com/en-us/library/ie/ms536939(v=vs.85).aspx
                    e.preventDefault();
                }
                lastKeyDown = e;
                this._onKeyDown.fire(e);
            }));
            this._register(this._textArea.onKeyUp((_e) => {
                const e = new keyboardEvent_1.StandardKeyboardEvent(_e);
                this._onKeyUp.fire(e);
            }));
            this._register(this._textArea.onCompositionStart((e) => {
                if (textAreaState_1._debugComposition) {
                    console.log(`[compositionstart]`, e);
                }
                const currentComposition = new CompositionContext();
                if (this._currentComposition) {
                    // simply reset the composition context
                    this._currentComposition = currentComposition;
                    return;
                }
                this._currentComposition = currentComposition;
                if (this._OS === 2 /* OperatingSystem.Macintosh */
                    && lastKeyDown
                    && lastKeyDown.equals(114 /* KeyCode.KEY_IN_COMPOSITION */)
                    && this._textAreaState.selectionStart === this._textAreaState.selectionEnd
                    && this._textAreaState.selectionStart > 0
                    && this._textAreaState.value.substr(this._textAreaState.selectionStart - 1, 1) === e.data
                    && (lastKeyDown.code === 'ArrowRight' || lastKeyDown.code === 'ArrowLeft')) {
                    // Handling long press case on Chromium/Safari macOS + arrow key => pretend the character was selected
                    if (textAreaState_1._debugComposition) {
                        console.log(`[compositionstart] Handling long press case on macOS + arrow key`, e);
                    }
                    // Pretend the previous character was composed (in order to get it removed by subsequent compositionupdate events)
                    currentComposition.handleCompositionUpdate('x');
                    this._onCompositionStart.fire({ data: e.data });
                    return;
                }
                if (this._browser.isAndroid) {
                    // when tapping on the editor, Android enters composition mode to edit the current word
                    // so we cannot clear the textarea on Android and we must pretend the current word was selected
                    this._onCompositionStart.fire({ data: e.data });
                    return;
                }
                this._onCompositionStart.fire({ data: e.data });
            }));
            this._register(this._textArea.onCompositionUpdate((e) => {
                if (textAreaState_1._debugComposition) {
                    console.log(`[compositionupdate]`, e);
                }
                const currentComposition = this._currentComposition;
                if (!currentComposition) {
                    // should not be possible to receive a 'compositionupdate' without a 'compositionstart'
                    return;
                }
                if (this._browser.isAndroid) {
                    // On Android, the data sent with the composition update event is unusable.
                    // For example, if the cursor is in the middle of a word like Mic|osoft
                    // and Microsoft is chosen from the keyboard's suggestions, the e.data will contain "Microsoft".
                    // This is not really usable because it doesn't tell us where the edit began and where it ended.
                    const newState = textAreaState_1.TextAreaState.readFromTextArea(this._textArea, this._textAreaState);
                    const typeInput = textAreaState_1.TextAreaState.deduceAndroidCompositionInput(this._textAreaState, newState);
                    this._textAreaState = newState;
                    this._onType.fire(typeInput);
                    this._onCompositionUpdate.fire(e);
                    return;
                }
                const typeInput = currentComposition.handleCompositionUpdate(e.data);
                this._textAreaState = textAreaState_1.TextAreaState.readFromTextArea(this._textArea, this._textAreaState);
                this._onType.fire(typeInput);
                this._onCompositionUpdate.fire(e);
            }));
            this._register(this._textArea.onCompositionEnd((e) => {
                if (textAreaState_1._debugComposition) {
                    console.log(`[compositionend]`, e);
                }
                const currentComposition = this._currentComposition;
                if (!currentComposition) {
                    // https://github.com/microsoft/monaco-editor/issues/1663
                    // On iOS 13.2, Chinese system IME randomly trigger an additional compositionend event with empty data
                    return;
                }
                this._currentComposition = null;
                if (this._browser.isAndroid) {
                    // On Android, the data sent with the composition update event is unusable.
                    // For example, if the cursor is in the middle of a word like Mic|osoft
                    // and Microsoft is chosen from the keyboard's suggestions, the e.data will contain "Microsoft".
                    // This is not really usable because it doesn't tell us where the edit began and where it ended.
                    const newState = textAreaState_1.TextAreaState.readFromTextArea(this._textArea, this._textAreaState);
                    const typeInput = textAreaState_1.TextAreaState.deduceAndroidCompositionInput(this._textAreaState, newState);
                    this._textAreaState = newState;
                    this._onType.fire(typeInput);
                    this._onCompositionEnd.fire();
                    return;
                }
                const typeInput = currentComposition.handleCompositionUpdate(e.data);
                this._textAreaState = textAreaState_1.TextAreaState.readFromTextArea(this._textArea, this._textAreaState);
                this._onType.fire(typeInput);
                this._onCompositionEnd.fire();
            }));
            this._register(this._textArea.onInput((e) => {
                if (textAreaState_1._debugComposition) {
                    console.log(`[input]`, e);
                }
                // Pretend here we touched the text area, as the `input` event will most likely
                // result in a `selectionchange` event which we want to ignore
                this._textArea.setIgnoreSelectionChangeTime('received input event');
                if (this._currentComposition) {
                    return;
                }
                const newState = textAreaState_1.TextAreaState.readFromTextArea(this._textArea, this._textAreaState);
                const typeInput = textAreaState_1.TextAreaState.deduceInput(this._textAreaState, newState, /*couldBeEmojiInput*/ this._OS === 2 /* OperatingSystem.Macintosh */);
                if (typeInput.replacePrevCharCnt === 0 && typeInput.text.length === 1) {
                    // one character was typed
                    if (strings.isHighSurrogate(typeInput.text.charCodeAt(0))
                        || typeInput.text.charCodeAt(0) === 0x7f /* Delete */) {
                        // Ignore invalid input but keep it around for next time
                        return;
                    }
                }
                this._textAreaState = newState;
                if (typeInput.text !== ''
                    || typeInput.replacePrevCharCnt !== 0
                    || typeInput.replaceNextCharCnt !== 0
                    || typeInput.positionDelta !== 0) {
                    this._onType.fire(typeInput);
                }
            }));
            // --- Clipboard operations
            this._register(this._textArea.onCut((e) => {
                // Pretend here we touched the text area, as the `cut` event will most likely
                // result in a `selectionchange` event which we want to ignore
                this._textArea.setIgnoreSelectionChangeTime('received cut event');
                this._ensureClipboardGetsEditorSelection(e);
                this._asyncTriggerCut.schedule();
            }));
            this._register(this._textArea.onCopy((e) => {
                this._ensureClipboardGetsEditorSelection(e);
            }));
            this._register(this._textArea.onPaste((e) => {
                // Pretend here we touched the text area, as the `paste` event will most likely
                // result in a `selectionchange` event which we want to ignore
                this._textArea.setIgnoreSelectionChangeTime('received paste event');
                e.preventDefault();
                if (!e.clipboardData) {
                    return;
                }
                let [text, metadata] = exports.ClipboardEventUtils.getTextData(e.clipboardData);
                if (!text) {
                    return;
                }
                // try the in-memory store
                metadata = metadata || InMemoryClipboardMetadataManager.INSTANCE.get(text);
                this._onPaste.fire({
                    text: text,
                    metadata: metadata
                });
            }));
            this._register(this._textArea.onFocus(() => {
                const hadFocus = this._hasFocus;
                this._setHasFocus(true);
                if (this._accessibilityService.isScreenReaderOptimized() && this._browser.isSafari && !hadFocus && this._hasFocus) {
                    // When "tabbing into" the textarea, immediately after dispatching the 'focus' event,
                    // Safari will always move the selection at offset 0 in the textarea
                    if (!this._asyncFocusGainWriteScreenReaderContent.value) {
                        this._asyncFocusGainWriteScreenReaderContent.value = new async_1.RunOnceScheduler(() => this.writeNativeTextAreaContent('asyncFocusGain'), 0);
                    }
                    this._asyncFocusGainWriteScreenReaderContent.value.schedule();
                }
            }));
            this._register(this._textArea.onBlur(() => {
                if (this._currentComposition) {
                    // See https://github.com/microsoft/vscode/issues/112621
                    // where compositionend is not triggered when the editor
                    // is taken off-dom during a composition
                    // Clear the flag to be able to write to the textarea
                    this._currentComposition = null;
                    // Clear the textarea to avoid an unwanted cursor type
                    this.writeNativeTextAreaContent('blurWithoutCompositionEnd');
                    // Fire artificial composition end
                    this._onCompositionEnd.fire();
                }
                this._setHasFocus(false);
            }));
            this._register(this._textArea.onSyntheticTap(() => {
                if (this._browser.isAndroid && this._currentComposition) {
                    // on Android, tapping does not cancel the current composition, so the
                    // textarea is stuck showing the old composition
                    // Clear the flag to be able to write to the textarea
                    this._currentComposition = null;
                    // Clear the textarea to avoid an unwanted cursor type
                    this.writeNativeTextAreaContent('tapWithoutCompositionEnd');
                    // Fire artificial composition end
                    this._onCompositionEnd.fire();
                }
            }));
        }
        _initializeFromTest() {
            this._hasFocus = true;
            this._textAreaState = textAreaState_1.TextAreaState.readFromTextArea(this._textArea, null);
        }
        _installSelectionChangeListener() {
            // See https://github.com/microsoft/vscode/issues/27216 and https://github.com/microsoft/vscode/issues/98256
            // When using a Braille display, it is possible for users to reposition the
            // system caret. This is reflected in Chrome as a `selectionchange` event.
            //
            // The `selectionchange` event appears to be emitted under numerous other circumstances,
            // so it is quite a challenge to distinguish a `selectionchange` coming in from a user
            // using a Braille display from all the other cases.
            //
            // The problems with the `selectionchange` event are:
            //  * the event is emitted when the textarea is focused programmatically -- textarea.focus()
            //  * the event is emitted when the selection is changed in the textarea programmatically -- textarea.setSelectionRange(...)
            //  * the event is emitted when the value of the textarea is changed programmatically -- textarea.value = '...'
            //  * the event is emitted when tabbing into the textarea
            //  * the event is emitted asynchronously (sometimes with a delay as high as a few tens of ms)
            //  * the event sometimes comes in bursts for a single logical textarea operation
            // `selectionchange` events often come multiple times for a single logical change
            // so throttle multiple `selectionchange` events that burst in a short period of time.
            let previousSelectionChangeEventTime = 0;
            return dom.addDisposableListener(this._textArea.ownerDocument, 'selectionchange', (e) => {
                performance_1.inputLatency.onSelectionChange();
                if (!this._hasFocus) {
                    return;
                }
                if (this._currentComposition) {
                    return;
                }
                if (!this._browser.isChrome) {
                    // Support only for Chrome until testing happens on other browsers
                    return;
                }
                const now = Date.now();
                const delta1 = now - previousSelectionChangeEventTime;
                previousSelectionChangeEventTime = now;
                if (delta1 < 5) {
                    // received another `selectionchange` event within 5ms of the previous `selectionchange` event
                    // => ignore it
                    return;
                }
                const delta2 = now - this._textArea.getIgnoreSelectionChangeTime();
                this._textArea.resetSelectionChangeTime();
                if (delta2 < 100) {
                    // received a `selectionchange` event within 100ms since we touched the textarea
                    // => ignore it, since we caused it
                    return;
                }
                if (!this._textAreaState.selection) {
                    // Cannot correlate a position in the textarea with a position in the editor...
                    return;
                }
                const newValue = this._textArea.getValue();
                if (this._textAreaState.value !== newValue) {
                    // Cannot correlate a position in the textarea with a position in the editor...
                    return;
                }
                const newSelectionStart = this._textArea.getSelectionStart();
                const newSelectionEnd = this._textArea.getSelectionEnd();
                if (this._textAreaState.selectionStart === newSelectionStart && this._textAreaState.selectionEnd === newSelectionEnd) {
                    // Nothing to do...
                    return;
                }
                const _newSelectionStartPosition = this._textAreaState.deduceEditorPosition(newSelectionStart);
                const newSelectionStartPosition = this._host.deduceModelPosition(_newSelectionStartPosition[0], _newSelectionStartPosition[1], _newSelectionStartPosition[2]);
                const _newSelectionEndPosition = this._textAreaState.deduceEditorPosition(newSelectionEnd);
                const newSelectionEndPosition = this._host.deduceModelPosition(_newSelectionEndPosition[0], _newSelectionEndPosition[1], _newSelectionEndPosition[2]);
                const newSelection = new selection_1.Selection(newSelectionStartPosition.lineNumber, newSelectionStartPosition.column, newSelectionEndPosition.lineNumber, newSelectionEndPosition.column);
                this._onSelectionChangeRequest.fire(newSelection);
            });
        }
        dispose() {
            super.dispose();
            if (this._selectionChangeListener) {
                this._selectionChangeListener.dispose();
                this._selectionChangeListener = null;
            }
        }
        focusTextArea() {
            // Setting this._hasFocus and writing the screen reader content
            // will result in a focus() and setSelectionRange() in the textarea
            this._setHasFocus(true);
            // If the editor is off DOM, focus cannot be really set, so let's double check that we have managed to set the focus
            this.refreshFocusState();
        }
        isFocused() {
            return this._hasFocus;
        }
        refreshFocusState() {
            this._setHasFocus(this._textArea.hasFocus());
        }
        _setHasFocus(newHasFocus) {
            if (this._hasFocus === newHasFocus) {
                // no change
                return;
            }
            this._hasFocus = newHasFocus;
            if (this._selectionChangeListener) {
                this._selectionChangeListener.dispose();
                this._selectionChangeListener = null;
            }
            if (this._hasFocus) {
                this._selectionChangeListener = this._installSelectionChangeListener();
            }
            if (this._hasFocus) {
                this.writeNativeTextAreaContent('focusgain');
            }
            if (this._hasFocus) {
                this._onFocus.fire();
            }
            else {
                this._onBlur.fire();
            }
        }
        _setAndWriteTextAreaState(reason, textAreaState) {
            if (!this._hasFocus) {
                textAreaState = textAreaState.collapseSelection();
            }
            textAreaState.writeToTextArea(reason, this._textArea, this._hasFocus);
            this._textAreaState = textAreaState;
        }
        writeNativeTextAreaContent(reason) {
            if ((!this._accessibilityService.isScreenReaderOptimized() && reason === 'render') || this._currentComposition) {
                // Do not write to the text on render unless a screen reader is being used #192278
                // Do not write to the text area when doing composition
                return;
            }
            this._logService.trace(`writeTextAreaState(reason: ${reason})`);
            this._setAndWriteTextAreaState(reason, this._host.getScreenReaderContent());
        }
        _ensureClipboardGetsEditorSelection(e) {
            const dataToCopy = this._host.getDataToCopy();
            const storedMetadata = {
                version: 1,
                isFromEmptySelection: dataToCopy.isFromEmptySelection,
                multicursorText: dataToCopy.multicursorText,
                mode: dataToCopy.mode
            };
            InMemoryClipboardMetadataManager.INSTANCE.set(
            // When writing "LINE\r\n" to the clipboard and then pasting,
            // Firefox pastes "LINE\n", so let's work around this quirk
            (this._browser.isFirefox ? dataToCopy.text.replace(/\r\n/g, '\n') : dataToCopy.text), storedMetadata);
            e.preventDefault();
            if (e.clipboardData) {
                exports.ClipboardEventUtils.setTextData(e.clipboardData, dataToCopy.text, dataToCopy.html, storedMetadata);
            }
        }
    };
    exports.TextAreaInput = TextAreaInput;
    exports.TextAreaInput = TextAreaInput = __decorate([
        __param(4, accessibility_1.IAccessibilityService),
        __param(5, log_1.ILogService)
    ], TextAreaInput);
    exports.ClipboardEventUtils = {
        getTextData(clipboardData) {
            const text = clipboardData.getData(mime_1.Mimes.text);
            let metadata = null;
            const rawmetadata = clipboardData.getData('vscode-editor-data');
            if (typeof rawmetadata === 'string') {
                try {
                    metadata = JSON.parse(rawmetadata);
                    if (metadata.version !== 1) {
                        metadata = null;
                    }
                }
                catch (err) {
                    // no problem!
                }
            }
            if (text.length === 0 && metadata === null && clipboardData.files.length > 0) {
                // no textual data pasted, generate text from file names
                const files = Array.prototype.slice.call(clipboardData.files, 0);
                return [files.map(file => file.name).join('\n'), null];
            }
            return [text, metadata];
        },
        setTextData(clipboardData, text, html, metadata) {
            clipboardData.setData(mime_1.Mimes.text, text);
            if (typeof html === 'string') {
                clipboardData.setData('text/html', html);
            }
            clipboardData.setData('vscode-editor-data', JSON.stringify(metadata));
        }
    };
    class TextAreaWrapper extends lifecycle_1.Disposable {
        get ownerDocument() {
            return this._actual.ownerDocument;
        }
        constructor(_actual) {
            super();
            this._actual = _actual;
            this.onKeyDown = this._register(new event_1.DomEmitter(this._actual, 'keydown')).event;
            this.onKeyPress = this._register(new event_1.DomEmitter(this._actual, 'keypress')).event;
            this.onKeyUp = this._register(new event_1.DomEmitter(this._actual, 'keyup')).event;
            this.onCompositionStart = this._register(new event_1.DomEmitter(this._actual, 'compositionstart')).event;
            this.onCompositionUpdate = this._register(new event_1.DomEmitter(this._actual, 'compositionupdate')).event;
            this.onCompositionEnd = this._register(new event_1.DomEmitter(this._actual, 'compositionend')).event;
            this.onBeforeInput = this._register(new event_1.DomEmitter(this._actual, 'beforeinput')).event;
            this.onInput = this._register(new event_1.DomEmitter(this._actual, 'input')).event;
            this.onCut = this._register(new event_1.DomEmitter(this._actual, 'cut')).event;
            this.onCopy = this._register(new event_1.DomEmitter(this._actual, 'copy')).event;
            this.onPaste = this._register(new event_1.DomEmitter(this._actual, 'paste')).event;
            this.onFocus = this._register(new event_1.DomEmitter(this._actual, 'focus')).event;
            this.onBlur = this._register(new event_1.DomEmitter(this._actual, 'blur')).event;
            this._onSyntheticTap = this._register(new event_2.Emitter());
            this.onSyntheticTap = this._onSyntheticTap.event;
            this._ignoreSelectionChangeTime = 0;
            this._register(this.onKeyDown(() => performance_1.inputLatency.onKeyDown()));
            this._register(this.onBeforeInput(() => performance_1.inputLatency.onBeforeInput()));
            this._register(this.onInput(() => performance_1.inputLatency.onInput()));
            this._register(this.onKeyUp(() => performance_1.inputLatency.onKeyUp()));
            this._register(dom.addDisposableListener(this._actual, TextAreaSyntethicEvents.Tap, () => this._onSyntheticTap.fire()));
        }
        hasFocus() {
            const shadowRoot = dom.getShadowRoot(this._actual);
            if (shadowRoot) {
                return shadowRoot.activeElement === this._actual;
            }
            else if (this._actual.isConnected) {
                return dom.getActiveElement() === this._actual;
            }
            else {
                return false;
            }
        }
        setIgnoreSelectionChangeTime(reason) {
            this._ignoreSelectionChangeTime = Date.now();
        }
        getIgnoreSelectionChangeTime() {
            return this._ignoreSelectionChangeTime;
        }
        resetSelectionChangeTime() {
            this._ignoreSelectionChangeTime = 0;
        }
        getValue() {
            // console.log('current value: ' + this._textArea.value);
            return this._actual.value;
        }
        setValue(reason, value) {
            const textArea = this._actual;
            if (textArea.value === value) {
                // No change
                return;
            }
            // console.log('reason: ' + reason + ', current value: ' + textArea.value + ' => new value: ' + value);
            this.setIgnoreSelectionChangeTime('setValue');
            textArea.value = value;
        }
        getSelectionStart() {
            return this._actual.selectionDirection === 'backward' ? this._actual.selectionEnd : this._actual.selectionStart;
        }
        getSelectionEnd() {
            return this._actual.selectionDirection === 'backward' ? this._actual.selectionStart : this._actual.selectionEnd;
        }
        setSelectionRange(reason, selectionStart, selectionEnd) {
            const textArea = this._actual;
            let activeElement = null;
            const shadowRoot = dom.getShadowRoot(textArea);
            if (shadowRoot) {
                activeElement = shadowRoot.activeElement;
            }
            else {
                activeElement = dom.getActiveElement();
            }
            const activeWindow = dom.getWindow(activeElement);
            const currentIsFocused = (activeElement === textArea);
            const currentSelectionStart = textArea.selectionStart;
            const currentSelectionEnd = textArea.selectionEnd;
            if (currentIsFocused && currentSelectionStart === selectionStart && currentSelectionEnd === selectionEnd) {
                // No change
                // Firefox iframe bug https://github.com/microsoft/monaco-editor/issues/643#issuecomment-367871377
                if (browser.isFirefox && activeWindow.parent !== activeWindow) {
                    textArea.focus();
                }
                return;
            }
            // console.log('reason: ' + reason + ', setSelectionRange: ' + selectionStart + ' -> ' + selectionEnd);
            if (currentIsFocused) {
                // No need to focus, only need to change the selection range
                this.setIgnoreSelectionChangeTime('setSelectionRange');
                textArea.setSelectionRange(selectionStart, selectionEnd);
                if (browser.isFirefox && activeWindow.parent !== activeWindow) {
                    textArea.focus();
                }
                return;
            }
            // If the focus is outside the textarea, browsers will try really hard to reveal the textarea.
            // Here, we try to undo the browser's desperate reveal.
            try {
                const scrollState = dom.saveParentsScrollTop(textArea);
                this.setIgnoreSelectionChangeTime('setSelectionRange');
                textArea.focus();
                textArea.setSelectionRange(selectionStart, selectionEnd);
                dom.restoreParentsScrollTop(textArea, scrollState);
            }
            catch (e) {
                // Sometimes IE throws when setting selection (e.g. textarea is off-DOM)
            }
        }
    }
    exports.TextAreaWrapper = TextAreaWrapper;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEFyZWFJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvY29udHJvbGxlci90ZXh0QXJlYUlucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW9CaEcsSUFBaUIsdUJBQXVCLENBRXZDO0lBRkQsV0FBaUIsdUJBQXVCO1FBQzFCLDJCQUFHLEdBQUcsZ0NBQWdDLENBQUM7SUFDckQsQ0FBQyxFQUZnQix1QkFBdUIsdUNBQXZCLHVCQUF1QixRQUV2QztJQU1ZLFFBQUEsV0FBVyxHQUFHO1FBQzFCLCtCQUErQixFQUFFLEtBQUs7S0FDdEMsQ0FBQztJQWlDRjs7OztPQUlHO0lBQ0gsTUFBYSxnQ0FBZ0M7aUJBQ3JCLGFBQVEsR0FBRyxJQUFJLGdDQUFnQyxFQUFFLENBQUM7UUFJekU7WUFDQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN4QixDQUFDO1FBRU0sR0FBRyxDQUFDLGVBQXVCLEVBQUUsSUFBNkI7WUFDaEUsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUM3QyxDQUFDO1FBRU0sR0FBRyxDQUFDLFVBQWtCO1lBQzVCLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWUsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDdkUsU0FBUztnQkFDVCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO1lBQzdCLENBQUM7WUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN2QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7O0lBcEJGLDRFQXFCQztJQXNDRCxNQUFNLGtCQUFrQjtRQUl2QjtZQUNDLElBQUksQ0FBQyxtQkFBbUIs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