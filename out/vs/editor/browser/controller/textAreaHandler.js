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
define(["require", "exports", "vs/nls", "vs/base/browser/browser", "vs/base/browser/fastDomNode", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/browser/config/domFontInfo", "vs/editor/browser/controller/textAreaInput", "vs/editor/browser/controller/textAreaState", "vs/editor/browser/view/viewPart", "vs/editor/browser/viewParts/lineNumbers/lineNumbers", "vs/editor/browser/viewParts/margin/margin", "vs/editor/common/config/editorOptions", "vs/editor/common/core/wordCharacterClassifier", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/base/browser/ui/mouseCursor/mouseCursor", "vs/editor/common/languages", "vs/base/common/color", "vs/base/common/ime", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/css!./textAreaHandler"], function (require, exports, nls, browser, fastDomNode_1, platform, strings, domFontInfo_1, textAreaInput_1, textAreaState_1, viewPart_1, lineNumbers_1, margin_1, editorOptions_1, wordCharacterClassifier_1, position_1, range_1, selection_1, mouseCursor_1, languages_1, color_1, ime_1, keybinding_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextAreaHandler = void 0;
    class VisibleTextAreaData {
        constructor(_context, modelLineNumber, distanceToModelLineStart, widthOfHiddenLineTextBefore, distanceToModelLineEnd) {
            this._context = _context;
            this.modelLineNumber = modelLineNumber;
            this.distanceToModelLineStart = distanceToModelLineStart;
            this.widthOfHiddenLineTextBefore = widthOfHiddenLineTextBefore;
            this.distanceToModelLineEnd = distanceToModelLineEnd;
            this._visibleTextAreaBrand = undefined;
            this.startPosition = null;
            this.endPosition = null;
            this.visibleTextareaStart = null;
            this.visibleTextareaEnd = null;
            /**
             * When doing composition, the currently composed text might be split up into
             * multiple tokens, then merged again into a single token, etc. Here we attempt
             * to keep the presentation of the <textarea> stable by using the previous used
             * style if multiple tokens come into play. This avoids flickering.
             */
            this._previousPresentation = null;
        }
        prepareRender(visibleRangeProvider) {
            const startModelPosition = new position_1.Position(this.modelLineNumber, this.distanceToModelLineStart + 1);
            const endModelPosition = new position_1.Position(this.modelLineNumber, this._context.viewModel.model.getLineMaxColumn(this.modelLineNumber) - this.distanceToModelLineEnd);
            this.startPosition = this._context.viewModel.coordinatesConverter.convertModelPositionToViewPosition(startModelPosition);
            this.endPosition = this._context.viewModel.coordinatesConverter.convertModelPositionToViewPosition(endModelPosition);
            if (this.startPosition.lineNumber === this.endPosition.lineNumber) {
                this.visibleTextareaStart = visibleRangeProvider.visibleRangeForPosition(this.startPosition);
                this.visibleTextareaEnd = visibleRangeProvider.visibleRangeForPosition(this.endPosition);
            }
            else {
                // TODO: what if the view positions are not on the same line?
                this.visibleTextareaStart = null;
                this.visibleTextareaEnd = null;
            }
        }
        definePresentation(tokenPresentation) {
            if (!this._previousPresentation) {
                // To avoid flickering, once set, always reuse a presentation throughout the entire IME session
                if (tokenPresentation) {
                    this._previousPresentation = tokenPresentation;
                }
                else {
                    this._previousPresentation = {
                        foreground: 1 /* ColorId.DefaultForeground */,
                        italic: false,
                        bold: false,
                        underline: false,
                        strikethrough: false,
                    };
                }
            }
            return this._previousPresentation;
        }
    }
    const canUseZeroSizeTextarea = (browser.isFirefox);
    let TextAreaHandler = class TextAreaHandler extends viewPart_1.ViewPart {
        constructor(context, viewController, visibleRangeProvider, _keybindingService, _instantiationService) {
            super(context);
            this._keybindingService = _keybindingService;
            this._instantiationService = _instantiationService;
            this._primaryCursorPosition = new position_1.Position(1, 1);
            this._primaryCursorVisibleRange = null;
            this._viewController = viewController;
            this._visibleRangeProvider = visibleRangeProvider;
            this._scrollLeft = 0;
            this._scrollTop = 0;
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._setAccessibilityOptions(options);
            this._contentLeft = layoutInfo.contentLeft;
            this._contentWidth = layoutInfo.contentWidth;
            this._contentHeight = layoutInfo.height;
            this._fontInfo = options.get(50 /* EditorOption.fontInfo */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._emptySelectionClipboard = options.get(37 /* EditorOption.emptySelectionClipboard */);
            this._copyWithSyntaxHighlighting = options.get(25 /* EditorOption.copyWithSyntaxHighlighting */);
            this._visibleTextArea = null;
            this._selections = [new selection_1.Selection(1, 1, 1, 1)];
            this._modelSelections = [new selection_1.Selection(1, 1, 1, 1)];
            this._lastRenderPosition = null;
            // Text Area (The focus will always be in the textarea when the cursor is blinking)
            this.textArea = (0, fastDomNode_1.createFastDomNode)(document.createElement('textarea'));
            viewPart_1.PartFingerprints.write(this.textArea, 7 /* PartFingerprint.TextArea */);
            this.textArea.setClassName(`inputarea ${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`);
            this.textArea.setAttribute('wrap', this._textAreaWrapping && !this._visibleTextArea ? 'on' : 'off');
            const { tabSize } = this._context.viewModel.model.getOptions();
            this.textArea.domNode.style.tabSize = `${tabSize * this._fontInfo.spaceWidth}px`;
            this.textArea.setAttribute('autocorrect', 'off');
            this.textArea.setAttribute('autocapitalize', 'off');
            this.textArea.setAttribute('autocomplete', 'off');
            this.textArea.setAttribute('spellcheck', 'false');
            this.textArea.setAttribute('aria-label', this._getAriaLabel(options));
            this.textArea.setAttribute('aria-required', options.get(5 /* EditorOption.ariaRequired */) ? 'true' : 'false');
            this.textArea.setAttribute('tabindex', String(options.get(124 /* EditorOption.tabIndex */)));
            this.textArea.setAttribute('role', 'textbox');
            this.textArea.setAttribute('aria-roledescription', nls.localize('editor', "editor"));
            this.textArea.setAttribute('aria-multiline', 'true');
            this.textArea.setAttribute('aria-autocomplete', options.get(91 /* EditorOption.readOnly */) ? 'none' : 'both');
            this._ensureReadOnlyAttribute();
            this.textAreaCover = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.textAreaCover.setPosition('absolute');
            const simpleModel = {
                getLineCount: () => {
                    return this._context.viewModel.getLineCount();
                },
                getLineMaxColumn: (lineNumber) => {
                    return this._context.viewModel.getLineMaxColumn(lineNumber);
                },
                getValueInRange: (range, eol) => {
                    return this._context.viewModel.getValueInRange(range, eol);
                },
                getValueLengthInRange: (range, eol) => {
                    return this._context.viewModel.getValueLengthInRange(range, eol);
                },
                modifyPosition: (position, offset) => {
                    return this._context.viewModel.modifyPosition(position, offset);
                }
            };
            const textAreaInputHost = {
                getDataToCopy: () => {
                    const rawTextToCopy = this._context.viewModel.getPlainTextToCopy(this._modelSelections, this._emptySelectionClipboard, platform.isWindows);
                    const newLineCharacter = this._context.viewModel.model.getEOL();
                    const isFromEmptySelection = (this._emptySelectionClipboard && this._modelSelections.length === 1 && this._modelSelections[0].isEmpty());
                    const multicursorText = (Array.isArray(rawTextToCopy) ? rawTextToCopy : null);
                    const text = (Array.isArray(rawTextToCopy) ? rawTextToCopy.join(newLineCharacter) : rawTextToCopy);
                    let html = undefined;
                    let mode = null;
                    if (textAreaInput_1.CopyOptions.forceCopyWithSyntaxHighlighting || (this._copyWithSyntaxHighlighting && text.length < 65536)) {
                        const richText = this._context.viewModel.getRichTextToCopy(this._modelSelections, this._emptySelectionClipboard);
                        if (richText) {
                            html = richText.html;
                            mode = richText.mode;
                        }
                    }
                    return {
                        isFromEmptySelection,
                        multicursorText,
                        text,
                        html,
                        mode
                    };
                },
                getScreenReaderContent: () => {
                    if (this._accessibilitySupport === 1 /* AccessibilitySupport.Disabled */) {
                        // We know for a fact that a screen reader is not attached
                        // On OSX, we write the character before the cursor to allow for "long-press" composition
                        // Also on OSX, we write the word before the cursor to allow for the Accessibility Keyboard to give good hints
                        const selection = this._selections[0];
                        if (platform.isMacintosh && selection.isEmpty()) {
                            const position = selection.getStartPosition();
                            let textBefore = this._getWordBeforePosition(position);
                            if (textBefore.length === 0) {
                                textBefore = this._getCharacterBeforePosition(position);
                            }
                            if (textBefore.length > 0) {
                                return new textAreaState_1.TextAreaState(textBefore, textBefore.length, textBefore.length, range_1.Range.fromPositions(position), 0);
                            }
                        }
                        // on macOS, write current selection into textarea will allow system text services pick selected text,
                        // but we still want to limit the amount of text given Chromium handles very poorly text even of a few
                        // thousand chars
                        // (https://github.com/microsoft/vscode/issues/27799)
                        const LIMIT_CHARS = 500;
                        if (platform.isMacintosh && !selection.isEmpty() && simpleModel.getValueLengthInRange(selection, 0 /* EndOfLinePreference.TextDefined */) < LIMIT_CHARS) {
                            const text = simpleModel.getValueInRange(selection, 0 /* EndOfLinePreference.TextDefined */);
                            return new textAreaState_1.TextAreaState(text, 0, text.length, selection, 0);
                        }
                        // on Safari, document.execCommand('cut') and document.execCommand('copy') will just not work
                        // if the textarea has no content selected. So if there is an editor selection, ensure something
                        // is selected in the textarea.
                        if (browser.isSafari && !selection.isEmpty()) {
                            const placeholderText = 'vscode-placeholder';
                            return new textAreaState_1.TextAreaState(placeholderText, 0, placeholderText.length, null, undefined);
                        }
                        return textAreaState_1.TextAreaState.EMPTY;
                    }
                    if (browser.isAndroid) {
                        // when tapping in the editor on a word, Android enters composition mode.
                        // in the `compositionstart` event we cannot clear the textarea, because
                        // it then forgets to ever send a `compositionend`.
                        // we therefore only write the current word in the textarea
                        const selection = this._selections[0];
                        if (selection.isEmpty()) {
                            const position = selection.getStartPosition();
                            const [wordAtPosition, positionOffsetInWord] = this._getAndroidWordAtPosition(position);
                            if (wordAtPosition.length > 0) {
                                return new textAreaState_1.TextAreaState(wordAtPosition, positionOffsetInWord, positionOffsetInWord, range_1.Range.fromPositions(position), 0);
                            }
                        }
                        return textAreaState_1.TextAreaState.EMPTY;
                    }
                    return textAreaState_1.PagedScreenReaderStrategy.fromEditorSelection(simpleModel, this._selections[0], this._accessibilityPageSize, this._accessibilitySupport === 0 /* AccessibilitySupport.Unknown */);
                },
                deduceModelPosition: (viewAnchorPosition, deltaOffset, lineFeedCnt) => {
                    return this._context.viewModel.deduceModelPositionRelativeToViewPosition(viewAnchorPosition, deltaOffset, lineFeedCnt);
                }
            };
            const textAreaWrapper = this._register(new textAreaInput_1.TextAreaWrapper(this.textArea.domNode));
            this._textAreaInput = this._register(this._instantiationService.createInstance(textAreaInput_1.TextAreaInput, textAreaInputHost, textAreaWrapper, platform.OS, {
                isAndroid: browser.isAndroid,
                isChrome: browser.isChrome,
                isFirefox: browser.isFirefox,
                isSafari: browser.isSafari,
            }));
            this._register(this._textAreaInput.onKeyDown((e) => {
                this._viewController.emitKeyDown(e);
            }));
            this._register(this._textAreaInput.onKeyUp((e) => {
                this._viewController.emitKeyUp(e);
            }));
            this._register(this._textAreaInput.onPaste((e) => {
                let pasteOnNewLine = false;
                let multicursorText = null;
                let mode = null;
                if (e.metadata) {
                    pasteOnNewLine = (this._emptySelectionClipboard && !!e.metadata.isFromEmptySelection);
                    multicursorText = (typeof e.metadata.multicursorText !== 'undefined' ? e.metadata.multicursorText : null);
                    mode = e.metadata.mode;
                }
                this._viewController.paste(e.text, pasteOnNewLine, multicursorText, mode);
            }));
            this._register(this._textAreaInput.onCut(() => {
                this._viewController.cut();
            }));
            this._register(this._textAreaInput.onType((e) => {
                if (e.replacePrevCharCnt || e.replaceNextCharCnt || e.positionDelta) {
                    // must be handled through the new command
                    if (textAreaState_1._debugComposition) {
                        console.log(` => compositionType: <<${e.text}>>, ${e.replacePrevCharCnt}, ${e.replaceNextCharCnt}, ${e.positionDelta}`);
                    }
                    this._viewController.compositionType(e.text, e.replacePrevCharCnt, e.replaceNextCharCnt, e.positionDelta);
                }
                else {
                    if (textAreaState_1._debugComposition) {
                        console.log(` => type: <<${e.text}>>`);
                    }
                    this._viewController.type(e.text);
                }
            }));
            this._register(this._textAreaInput.onSelectionChangeRequest((modelSelection) => {
                this._viewController.setSelection(modelSelection);
            }));
            this._register(this._textAreaInput.onCompositionStart((e) => {
                // The textarea might contain some content when composition starts.
                //
                // When we make the textarea visible, it always has a height of 1 line,
                // so we don't need to worry too much about content on lines above or below
                // the selection.
                //
                // However, the text on the current line needs to be made visible because
                // some IME methods allow to move to other glyphs on the current line
                // (by pressing arrow keys).
                //
                // (1) The textarea might contain only some parts of the current line,
                // like the word before the selection. Also, the content inside the textarea
                // can grow or shrink as composition occurs. We therefore anchor the textarea
                // in terms of distance to a certain line start and line end.
                //
                // (2) Also, we should not make \t characters visible, because their rendering
                // inside the <textarea> will not align nicely with our rendering. We therefore
                // will hide (if necessary) some of the leading text on the current line.
                const ta = this.textArea.domNode;
                const modelSelection = this._modelSelections[0];
                const { distanceToModelLineStart, widthOfHiddenTextBefore } = (() => {
                    // Find the text that is on the current line before the selection
                    const textBeforeSelection = ta.value.substring(0, Math.min(ta.selectionStart, ta.selectionEnd));
                    const lineFeedOffset1 = textBeforeSelection.lastIndexOf('\n');
                    const lineTextBeforeSelection = textBeforeSelection.substring(lineFeedOffset1 + 1);
                    // We now search to see if we should hide some part of it (if it contains \t)
                    const tabOffset1 = lineTextBeforeSelection.lastIndexOf('\t');
                    const desiredVisibleBeforeCharCount = lineTextBeforeSelection.length - tabOffset1 - 1;
                    const startModelPosition = modelSelection.getStartPosition();
                    const visibleBeforeCharCount = Math.min(startModelPosition.column - 1, desiredVisibleBeforeCharCount);
                    const distanceToModelLineStart = startModelPosition.column - 1 - visibleBeforeCharCount;
                    const hiddenLineTextBefore = lineTextBeforeSelection.substring(0, lineTextBeforeSelection.length - visibleBeforeCharCount);
                    const { tabSize } = this._context.viewModel.model.getOptions();
                    const widthOfHiddenTextBefore = measureText(this.textArea.domNode.ownerDocument, hiddenLineTextBefore, this._fontInfo, tabSize);
                    return { distanceToModelLineStart, widthOfHiddenTextBefore };
                })();
                const { distanceToModelLineEnd } = (() => {
                    // Find the text that is on the current line after the selection
                    const textAfterSelection = ta.value.substring(Math.max(ta.selectionStart, ta.selectionEnd));
                    const lineFeedOffset2 = textAfterSelection.indexOf('\n');
                    const lineTextAfterSelection = lineFeedOffset2 === -1 ? textAfterSelection : textAfterSelection.substring(0, lineFeedOffset2);
                    const tabOffset2 = lineTextAfterSelection.indexOf('\t');
                    const desiredVisibleAfterCharCount = (tabOffset2 === -1 ? lineTextAfterSelection.length : lineTextAfterSelection.length - tabOffset2 - 1);
                    const endModelPosition = modelSelection.getEndPosition();
                    const visibleAfterCharCount = Math.min(this._context.viewModel.model.getLineMaxColumn(endModelPosition.lineNumber) - endModelPosition.column, desiredVisibleAfterCharCount);
                    const distanceToModelLineEnd = this._context.viewModel.model.getLineMaxColumn(endModelPosition.lineNumber) - endModelPosition.column - visibleAfterCharCount;
                    return { distanceToModelLineEnd };
                })();
                // Scroll to reveal the location in the editor where composition occurs
                this._context.viewModel.revealRange('keyboard', true, range_1.Range.fromPositions(this._selections[0].getStartPosition()), 0 /* viewEvents.VerticalRevealType.Simple */, 1 /* ScrollType.Immediate */);
                this._visibleTextArea = new VisibleTextAreaData(this._context, modelSelection.startLineNumber, distanceToModelLineStart, widthOfHiddenTextBefore, distanceToModelLineEnd);
                // We turn off wrapping if the <textarea> becomes visible for composition
                this.textArea.setAttribute('wrap', this._textAreaWrapping && !this._visibleTextArea ? 'on' : 'off');
                this._visibleTextArea.prepareRender(this._visibleRangeProvider);
                this._render();
                // Show the textarea
                this.textArea.setClassName(`inputarea ${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME} ime-input`);
                this._viewController.compositionStart();
                this._context.viewModel.onCompositionStart();
            }));
            this._register(this._textAreaInput.onCompositionUpdate((e) => {
                if (!this._visibleTextArea) {
                    return;
                }
                this._visibleTextArea.prepareRender(this._visibleRangeProvider);
                this._render();
            }));
            this._register(this._textAreaInput.onCompositionEnd(() => {
                this._visibleTextArea = null;
                // We turn on wrapping as necessary if the <textarea> hides after composition
                this.textArea.setAttribute('wrap', this._textAreaWrapping && !this._visibleTextArea ? 'on' : 'off');
                this._render();
                this.textArea.setClassName(`inputarea ${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`);
                this._viewController.compositionEnd();
                this._context.viewModel.onCompositionEnd();
            }));
            this._register(this._textAreaInput.onFocus(() => {
                this._context.viewModel.setHasFocus(true);
            }));
            this._register(this._textAreaInput.onBlur(() => {
                this._context.viewModel.setHasFocus(false);
            }));
            this._register(ime_1.IME.onDidChange(() => {
                this._ensureReadOnlyAttribute();
            }));
        }
        writeScreenReaderContent(reason) {
            this._textAreaInput.writeNativeTextAreaContent(reason);
        }
        dispose() {
            super.dispose();
        }
        _getAndroidWordAtPosition(position) {
            const ANDROID_WORD_SEPARATORS = '`~!@#$%^&*()-=+[{]}\\|;:",.<>/?';
            const lineContent = this._context.viewModel.getLineContent(position.lineNumber);
            const wordSeparators = (0, wordCharacterClassifier_1.getMapForWordSeparators)(ANDROID_WORD_SEPARATORS, []);
            let goingLeft = true;
            let startColumn = position.column;
            let goingRight = true;
            let endColumn = position.column;
            let distance = 0;
            while (distance < 50 && (goingLeft || goingRight)) {
                if (goingLeft && startColumn <= 1) {
                    goingLeft = false;
                }
                if (goingLeft) {
                    const charCode = lineContent.charCodeAt(startColumn - 2);
                    const charClass = wordSeparators.get(charCode);
                    if (charClass !== 0 /* WordCharacterClass.Regular */) {
                        goingLeft = false;
                    }
                    else {
                        startColumn--;
                    }
                }
                if (goingRight && endColumn > lineContent.length) {
                    goingRight = false;
                }
                if (goingRight) {
                    const charCode = lineContent.charCodeAt(endColumn - 1);
                    const charClass = wordSeparators.get(charCode);
                    if (charClass !== 0 /* WordCharacterClass.Regular */) {
                        goingRight = false;
                    }
                    else {
                        endColumn++;
                    }
                }
                distance++;
            }
            return [lineContent.substring(startColumn - 1, endColumn - 1), position.column - startColumn];
        }
        _getWordBeforePosition(position) {
            const lineContent = this._context.viewModel.getLineContent(position.lineNumber);
            const wordSeparators = (0, wordCharacterClassifier_1.getMapForWordSeparators)(this._context.configuration.options.get(131 /* EditorOption.wordSeparators */), []);
            let column = position.column;
            let distance = 0;
            while (column > 1) {
                const charCode = lineContent.charCodeAt(column - 2);
                const charClass = wordSeparators.get(charCode);
                if (charClass !== 0 /* WordCharacterClass.Regular */ || distance > 50) {
                    return lineContent.substring(column - 1, position.column - 1);
                }
                distance++;
                column--;
            }
            return lineContent.substring(0, position.column - 1);
        }
        _getCharacterBeforePosition(position) {
            if (position.column > 1) {
                const lineContent = this._context.viewModel.getLineContent(position.lineNumber);
                const charBefore = lineContent.charAt(position.column - 2);
                if (!strings.isHighSurrogate(charBefore.charCodeAt(0))) {
                    return charBefore;
                }
            }
            return '';
        }
        _getAriaLabel(options) {
            const accessibilitySupport = options.get(2 /* EditorOption.accessibilitySupport */);
            if (accessibilitySupport === 1 /* AccessibilitySupport.Disabled */) {
                const toggleKeybindingLabel = this._keybindingService.lookupKeybinding('editor.action.toggleScreenReaderAccessibilityMode')?.getAriaLabel();
                const runCommandKeybindingLabel = this._keybindingService.lookupKeybinding('workbench.action.showCommands')?.getAriaLabel();
                const keybindingEditorKeybindingLabel = this._keybindingService.lookupKeybinding('workbench.action.openGlobalKeybindings')?.getAriaLabel();
                const editorNotAccessibleMessage = nls.localize('accessibilityModeOff', "The editor is not accessible at this time.");
                if (toggleKeybindingLabel) {
                    return nls.localize('accessibilityOffAriaLabel', "{0} To enable screen reader optimized mode, use {1}", editorNotAccessibleMessage, toggleKeybindingLabel);
                }
                else if (runCommandKeybindingLabel) {
                    return nls.localize('accessibilityOffAriaLabelNoKb', "{0} To enable screen reader optimized mode, open the quick pick with {1} and run the command Toggle Screen Reader Accessibility Mode, which is currently not triggerable via keyboard.", editorNotAccessibleMessage, runCommandKeybindingLabel);
                }
                else if (keybindingEditorKeybindingLabel) {
                    return nls.localize('accessibilityOffAriaLabelNoKbs', "{0} Please assign a keybinding for the command Toggle Screen Reader Accessibility Mode by accessing the keybindings editor with {1} and run it.", editorNotAccessibleMessage, keybindingEditorKeybindingLabel);
                }
                else {
                    // SOS
                    return editorNotAccessibleMessage;
                }
            }
            return options.get(4 /* EditorOption.ariaLabel */);
        }
        _setAccessibilityOptions(options) {
            this._accessibilitySupport = options.get(2 /* EditorOption.accessibilitySupport */);
            const accessibilityPageSize = options.get(3 /* EditorOption.accessibilityPageSize */);
            if (this._accessibilitySupport === 2 /* AccessibilitySupport.Enabled */ && accessibilityPageSize === editorOptions_1.EditorOptions.accessibilityPageSize.defaultValue) {
                // If a screen reader is attached and the default value is not set we should automatically increase the page size to 500 for a better experience
                this._accessibilityPageSize = 500;
            }
            else {
                this._accessibilityPageSize = accessibilityPageSize;
            }
            // When wrapping is enabled and a screen reader might be attached,
            // we will size the textarea to match the width used for wrapping points computation (see `domLineBreaksComputer.ts`).
            // This is because screen readers will read the text in the textarea and we'd like that the
            // wrapping points in the textarea match the wrapping points in the editor.
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            const wrappingColumn = layoutInfo.wrappingColumn;
            if (wrappingColumn !== -1 && this._accessibilitySupport !== 1 /* AccessibilitySupport.Disabled */) {
                const fontInfo = options.get(50 /* EditorOption.fontInfo */);
                this._textAreaWrapping = true;
                this._textAreaWidth = Math.round(wrappingColumn * fontInfo.typicalHalfwidthCharacterWidth);
            }
            else {
                this._textAreaWrapping = false;
                this._textAreaWidth = (canUseZeroSizeTextarea ? 0 : 1);
            }
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._setAccessibilityOptions(options);
            this._contentLeft = layoutInfo.contentLeft;
            this._contentWidth = layoutInfo.contentWidth;
            this._contentHeight = layoutInfo.height;
            this._fontInfo = options.get(50 /* EditorOption.fontInfo */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._emptySelectionClipboard = options.get(37 /* EditorOption.emptySelectionClipboard */);
            this._copyWithSyntaxHighlighting = options.get(25 /* EditorOption.copyWithSyntaxHighlighting */);
            this.textArea.setAttribute('wrap', this._textAreaWrapping && !this._visibleTextArea ? 'on' : 'off');
            const { tabSize } = this._context.viewModel.model.getOptions();
            this.textArea.domNode.style.tabSize = `${tabSize * this._fontInfo.spaceWidth}px`;
            this.textArea.setAttribute('aria-label', this._getAriaLabel(options));
            this.textArea.setAttribute('aria-required', options.get(5 /* EditorOption.ariaRequired */) ? 'true' : 'false');
            this.textArea.setAttribute('tabindex', String(options.get(124 /* EditorOption.tabIndex */)));
            if (e.hasChanged(34 /* EditorOption.domReadOnly */) || e.hasChanged(91 /* EditorOption.readOnly */)) {
                this._ensureReadOnlyAttribute();
            }
            if (e.hasChanged(2 /* EditorOption.accessibilitySupport */)) {
                this._textAreaInput.writeNativeTextAreaContent('strategy changed');
            }
            return true;
        }
        onCursorStateChanged(e) {
            this._selections = e.selections.slice(0);
            this._modelSelections = e.modelSelections.slice(0);
            // We must update the <textarea> synchronously, otherwise long press IME on macos breaks.
            // See https://github.com/microsoft/vscode/issues/165821
            this._textAreaInput.writeNativeTextAreaContent('selection changed');
            return true;
        }
        onDecorationsChanged(e) {
            // true for inline decorations that can end up relayouting text
            return true;
        }
        onFlushed(e) {
            return true;
        }
        onLinesChanged(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            this._scrollLeft = e.scrollLeft;
            this._scrollTop = e.scrollTop;
            return true;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        // --- begin view API
        isFocused() {
            return this._textAreaInput.isFocused();
        }
        focusTextArea() {
            this._textAreaInput.focusTextArea();
        }
        refreshFocusState() {
            this._textAreaInput.refreshFocusState();
        }
        getLastRenderData() {
            return this._lastRenderPosition;
        }
        setAriaOptions(options) {
            if (options.activeDescendant) {
                this.textArea.setAttribute('aria-haspopup', 'true');
                this.textArea.setAttribute('aria-autocomplete', 'list');
                this.textArea.setAttribute('aria-activedescendant', options.activeDescendant);
            }
            else {
                this.textArea.setAttribute('aria-haspopup', 'false');
                this.textArea.setAttribute('aria-autocomplete', 'both');
                this.textArea.removeAttribute('aria-activedescendant');
            }
            if (options.role) {
                this.textArea.setAttribute('role', options.role);
            }
        }
        // --- end view API
        _ensureReadOnlyAttribute() {
            const options = this._context.configuration.options;
            // When someone requests to disable IME, we set the "readonly" attribute on the <textarea>.
            // This will prevent composition.
            const useReadOnly = !ime_1.IME.enabled || (options.get(34 /* EditorOption.domReadOnly */) && options.get(91 /* EditorOption.readOnly */));
            if (useReadOnly) {
                this.textArea.setAttribute('readonly', 'true');
            }
            else {
                this.textArea.removeAttribute('readonly');
            }
        }
        prepareRender(ctx) {
            this._primaryCursorPosition = new position_1.Position(this._selections[0].positionLineNumber, this._selections[0].positionColumn);
            this._primaryCursorVisibleRange = ctx.visibleRangeForPosition(this._primaryCursorPosition);
            this._visibleTextArea?.prepareRender(ctx);
        }
        render(ctx) {
            this._textAreaInput.writeNativeTextAreaContent('render');
            this._render();
        }
        _render() {
            if (this._visibleTextArea) {
                // The text area is visible for composition reasons
                const visibleStart = this._visibleTextArea.visibleTextareaStart;
                const visibleEnd = this._visibleTextArea.visibleTextareaEnd;
                const startPosition = this._visibleTextArea.startPosition;
                const endPosition = this._visibleTextArea.endPosition;
                if (startPosition && endPosition && visibleStart && visibleEnd && visibleEnd.left >= this._scrollLeft && visibleStart.left <= this._scrollLeft + this._contentWidth) {
                    const top = (this._context.viewLayout.getVerticalOffsetForLineNumber(this._primaryCursorPosition.lineNumber) - this._scrollTop);
                    const lineCount = this._newlinecount(this.textArea.domNode.value.substr(0, this.textArea.domNode.selectionStart));
                    let scrollLeft = this._visibleTextArea.widthOfHiddenLineTextBefore;
                    let left = (this._contentLeft + visibleStart.left - this._scrollLeft);
                    // See https://github.com/microsoft/vscode/issues/141725#issuecomment-1050670841
                    // Here we are adding +1 to avoid flickering that might be caused by having a width that is too small.
                    // This could be caused by rounding errors that might only show up with certain font families.
                    // In other words, a pixel might be lost when doing something like
                    //      `Math.round(end) - Math.round(start)`
                    // vs
                    //      `Math.round(end - start)`
                    let width = visibleEnd.left - visibleStart.left + 1;
                    if (left < this._contentLeft) {
                        // the textarea would be rendered on top of the margin,
                        // so reduce its width. We use the same technique as
                        // for hiding text before
                        const delta = (this._contentLeft - left);
                        left += delta;
                        scrollLeft += delta;
                        width -= delta;
                    }
                    if (width > this._contentWidth) {
                        // the textarea would be wider than the content width,
                        // so reduce its width.
                        width = this._contentWidth;
                    }
                    // Try to render the textarea with the color/font style to match the text under it
                    const viewLineData = this._context.viewModel.getViewLineData(startPosition.lineNumber);
                    const startTokenIndex = viewLineData.tokens.findTokenIndexAtOffset(startPosition.column - 1);
                    const endTokenIndex = viewLineData.tokens.findTokenIndexAtOffset(endPosition.column - 1);
                    const textareaSpansSingleToken = (startTokenIndex === endTokenIndex);
                    const presentation = this._visibleTextArea.definePresentation((textareaSpansSingleToken ? viewLineData.tokens.getPresentation(startTokenIndex) : null));
                    this.textArea.domNode.scrollTop = lineCount * this._lineHeight;
                    this.textArea.domNode.scrollLeft = scrollLeft;
                    this._doRender({
                        lastRenderPosition: null,
                        top: top,
                        left: left,
                        width: width,
                        height: this._lineHeight,
                        useCover: false,
                        color: (languages_1.TokenizationRegistry.getColorMap() || [])[presentation.foreground],
                        italic: presentation.italic,
                        bold: presentation.bold,
                        underline: presentation.underline,
                        strikethrough: presentation.strikethrough
                    });
                }
                return;
            }
            if (!this._primaryCursorVisibleRange) {
                // The primary cursor is outside the viewport => place textarea to the top left
                this._renderAtTopLeft();
                return;
            }
            const left = this._contentLeft + this._primaryCursorVisibleRange.left - this._scrollLeft;
            if (left < this._contentLeft || left > this._contentLeft + this._contentWidth) {
                // cursor is outside the viewport
                this._renderAtTopLeft();
                return;
            }
            const top = this._context.viewLayout.getVerticalOffsetForLineNumber(this._selections[0].positionLineNumber) - this._scrollTop;
            if (top < 0 || top > this._contentHeight) {
                // cursor is outside the viewport
                this._renderAtTopLeft();
                return;
            }
            // The primary cursor is in the viewport (at least vertically) => place textarea on the cursor
            if (platform.isMacintosh || this._accessibilitySupport === 2 /* AccessibilitySupport.Enabled */) {
                // For the popup emoji input, we will make the text area as high as the line height
                // We will also make the fontSize and lineHeight the correct dimensions to help with the placement of these pickers
                this._doRender({
                    lastRenderPosition: this._primaryCursorPosition,
                    top,
                    left: this._textAreaWrapping ? this._contentLeft : left,
                    width: this._textAreaWidth,
                    height: this._lineHeight,
                    useCover: false
                });
                // In case the textarea contains a word, we're going to try to align the textarea's cursor
                // with our cursor by scrolling the textarea as much as possible
                this.textArea.domNode.scrollLeft = this._primaryCursorVisibleRange.left;
                const lineCount = this._textAreaInput.textAreaState.newlineCountBeforeSelection ?? this._newlinecount(this.textArea.domNode.value.substr(0, this.textArea.domNode.selectionStart));
                this.textArea.domNode.scrollTop = lineCount * this._lineHeight;
                return;
            }
            this._doRender({
                lastRenderPosition: this._primaryCursorPosition,
                top: top,
                left: this._textAreaWrapping ? this._contentLeft : left,
                width: this._textAreaWidth,
                height: (canUseZeroSizeTextarea ? 0 : 1),
                useCover: false
            });
        }
        _newlinecount(text) {
            let result = 0;
            let startIndex = -1;
            do {
                startIndex = text.indexOf('\n', startIndex + 1);
                if (startIndex === -1) {
                    break;
                }
                result++;
            } while (true);
            return result;
        }
        _renderAtTopLeft() {
            // (in WebKit the textarea is 1px by 1px because it cannot handle input to a 0x0 textarea)
            // specifically, when doing Korean IME, setting the textarea to 0x0 breaks IME badly.
            this._doRender({
                lastRenderPosition: null,
                top: 0,
                left: 0,
                width: this._textAreaWidth,
                height: (canUseZeroSizeTextarea ? 0 : 1),
                useCover: true
            });
        }
        _doRender(renderData) {
            this._lastRenderPosition = renderData.lastRenderPosition;
            const ta = this.textArea;
            const tac = this.textAreaCover;
            (0, domFontInfo_1.applyFontInfo)(ta, this._fontInfo);
            ta.setTop(renderData.top);
            ta.setLeft(renderData.left);
            ta.setWidth(renderData.width);
            ta.setHeight(renderData.height);
            ta.setColor(renderData.color ? color_1.Color.Format.CSS.formatHex(renderData.color) : '');
            ta.setFontStyle(renderData.italic ? 'italic' : '');
            if (renderData.bold) {
                // fontWeight is also set by `applyFontInfo`, so only overwrite it if necessary
                ta.setFontWeight('bold');
            }
            ta.setTextDecoration(`${renderData.underline ? ' underline' : ''}${renderData.strikethrough ? ' line-through' : ''}`);
            tac.setTop(renderData.useCover ? renderData.top : 0);
            tac.setLeft(renderData.useCover ? renderData.left : 0);
            tac.setWidth(renderData.useCover ? renderData.width : 0);
            tac.setHeight(renderData.useCover ? renderData.height : 0);
            const options = this._context.configuration.options;
            if (options.get(57 /* EditorOption.glyphMargin */)) {
                tac.setClassName('monaco-editor-background textAreaCover ' + margin_1.Margin.OUTER_CLASS_NAME);
            }
            else {
                if (options.get(68 /* EditorOption.lineNumbers */).renderType !== 0 /* RenderLineNumbersType.Off */) {
                    tac.setClassName('monaco-editor-background textAreaCover ' + lineNumbers_1.LineNumbersOverlay.CLASS_NAME);
                }
                else {
                    tac.setClassName('monaco-editor-background textAreaCover');
                }
            }
        }
    };
    exports.TextAreaHandler = TextAreaHandler;
    exports.TextAreaHandler = TextAreaHandler = __decorate([
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService)
    ], TextAreaHandler);
    function measureText(targetDocument, text, fontInfo, tabSize) {
        if (text.length === 0) {
            return 0;
        }
        const container = targetDocument.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-50000px';
        container.style.width = '50000px';
        const regularDomNode = targetDocument.createElement('span');
        (0, domFontInfo_1.applyFontInfo)(regularDomNode, fontInfo);
        regularDomNode.style.whiteSpace = 'pre'; // just like the textarea
        regularDomNode.style.tabSize = `${tabSize * fontInfo.spaceWidth}px`; // just like the textarea
        regularDomNode.append(text);
        container.appendChild(regularDomNode);
        targetDocument.body.appendChild(container);
        const res = regularDomNode.offsetWidth;
        targetDocument.body.removeChild(container);
        return res;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEFyZWFIYW5kbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci9jb250cm9sbGVyL3RleHRBcmVhSGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF5Q2hHLE1BQU0sbUJBQW1CO1FBaUJ4QixZQUNrQixRQUFxQixFQUN0QixlQUF1QixFQUN2Qix3QkFBZ0MsRUFDaEMsMkJBQW1DLEVBQ25DLHNCQUE4QjtZQUo3QixhQUFRLEdBQVIsUUFBUSxDQUFhO1lBQ3RCLG9CQUFlLEdBQWYsZUFBZSxDQUFRO1lBQ3ZCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBUTtZQUNoQyxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQVE7WUFDbkMsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFRO1lBckIvQywwQkFBcUIsR0FBUyxTQUFTLENBQUM7WUFFakMsa0JBQWEsR0FBb0IsSUFBSSxDQUFDO1lBQ3RDLGdCQUFXLEdBQW9CLElBQUksQ0FBQztZQUVwQyx5QkFBb0IsR0FBOEIsSUFBSSxDQUFDO1lBQ3ZELHVCQUFrQixHQUE4QixJQUFJLENBQUM7WUFFNUQ7Ozs7O2VBS0c7WUFDSywwQkFBcUIsR0FBOEIsSUFBSSxDQUFDO1FBU2hFLENBQUM7UUFFRCxhQUFhLENBQUMsb0JBQTJDO1lBQ3hELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxtQkFBUSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pHLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxtQkFBUSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxlQUFl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