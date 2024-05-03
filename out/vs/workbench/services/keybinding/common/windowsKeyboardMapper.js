/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/keybindings", "vs/base/common/keybindingLabels", "vs/platform/keybinding/common/baseResolvedKeybinding", "vs/platform/keybinding/common/resolvedKeybindingItem"], function (require, exports, keyCodes_1, keybindings_1, keybindingLabels_1, baseResolvedKeybinding_1, resolvedKeybindingItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowsKeyboardMapper = exports.WindowsNativeResolvedKeybinding = void 0;
    const LOG = false;
    function log(str) {
        if (LOG) {
            console.info(str);
        }
    }
    class WindowsNativeResolvedKeybinding extends baseResolvedKeybinding_1.BaseResolvedKeybinding {
        constructor(mapper, chords) {
            super(1 /* OperatingSystem.Windows */, chords);
            this._mapper = mapper;
        }
        _getLabel(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            return this._mapper.getUILabelForKeyCode(chord.keyCode);
        }
        _getUSLabelForKeybinding(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            return keyCodes_1.KeyCodeUtils.toString(chord.keyCode);
        }
        getUSLabel() {
            return keybindingLabels_1.UILabelProvider.toLabel(this._os, this._chords, (keybinding) => this._getUSLabelForKeybinding(keybinding));
        }
        _getAriaLabel(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            return this._mapper.getAriaLabelForKeyCode(chord.keyCode);
        }
        _getElectronAccelerator(chord) {
            return this._mapper.getElectronAcceleratorForKeyBinding(chord);
        }
        _getUserSettingsLabel(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            const result = this._mapper.getUserSettingsLabelForKeyCode(chord.keyCode);
            return (result ? result.toLowerCase() : result);
        }
        _isWYSIWYG(chord) {
            return this.__isWYSIWYG(chord.keyCode);
        }
        __isWYSIWYG(keyCode) {
            if (keyCode === 15 /* KeyCode.LeftArrow */
                || keyCode === 16 /* KeyCode.UpArrow */
                || keyCode === 17 /* KeyCode.RightArrow */
                || keyCode === 18 /* KeyCode.DownArrow */) {
                return true;
            }
            const ariaLabel = this._mapper.getAriaLabelForKeyCode(keyCode);
            const userSettingsLabel = this._mapper.getUserSettingsLabelForKeyCode(keyCode);
            return (ariaLabel === userSettingsLabel);
        }
        _getChordDispatch(chord) {
            if (chord.isModifierKey()) {
                return null;
            }
            let result = '';
            if (chord.ctrlKey) {
                result += 'ctrl+';
            }
            if (chord.shiftKey) {
                result += 'shift+';
            }
            if (chord.altKey) {
                result += 'alt+';
            }
            if (chord.metaKey) {
                result += 'meta+';
            }
            result += keyCodes_1.KeyCodeUtils.toString(chord.keyCode);
            return result;
        }
        _getSingleModifierChordDispatch(chord) {
            if (chord.keyCode === 5 /* KeyCode.Ctrl */ && !chord.shiftKey && !chord.altKey && !chord.metaKey) {
                return 'ctrl';
            }
            if (chord.keyCode === 4 /* KeyCode.Shift */ && !chord.ctrlKey && !chord.altKey && !chord.metaKey) {
                return 'shift';
            }
            if (chord.keyCode === 6 /* KeyCode.Alt */ && !chord.ctrlKey && !chord.shiftKey && !chord.metaKey) {
                return 'alt';
            }
            if (chord.keyCode === 57 /* KeyCode.Meta */ && !chord.ctrlKey && !chord.shiftKey && !chord.altKey) {
                return 'meta';
            }
            return null;
        }
        static getProducedCharCode(chord, mapping) {
            if (!mapping) {
                return null;
            }
            if (chord.ctrlKey && chord.shiftKey && chord.altKey) {
                return mapping.withShiftAltGr;
            }
            if (chord.ctrlKey && chord.altKey) {
                return mapping.withAltGr;
            }
            if (chord.shiftKey) {
                return mapping.withShift;
            }
            return mapping.value;
        }
        static getProducedChar(chord, mapping) {
            const char = this.getProducedCharCode(chord, mapping);
            if (char === null || char.length === 0) {
                return ' --- ';
            }
            return '  ' + char + '  ';
        }
    }
    exports.WindowsNativeResolvedKeybinding = WindowsNativeResolvedKeybinding;
    class WindowsKeyboardMapper {
        constructor(_isUSStandard, rawMappings, _mapAltGrToCtrlAlt) {
            this._isUSStandard = _isUSStandard;
            this._mapAltGrToCtrlAlt = _mapAltGrToCtrlAlt;
            this._keyCodeToLabel = [];
            this._scanCodeToKeyCode = [];
            this._keyCodeToLabel = [];
            this._keyCodeExists = [];
            this._keyCodeToLabel[0 /* KeyCode.Unknown */] = keyCodes_1.KeyCodeUtils.toString(0 /* KeyCode.Unknown */);
            for (let scanCode = 0 /* ScanCode.None */; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
                const immutableKeyCode = keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode];
                if (immutableKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                    this._scanCodeToKeyCode[scanCode] = immutableKeyCode;
                    this._keyCodeToLabel[immutableKeyCode] = keyCodes_1.KeyCodeUtils.toString(immutableKeyCode);
                    this._keyCodeExists[immutableKeyCode] = true;
                }
            }
            const producesLetter = [];
            let producesLetters = false;
            this._codeInfo = [];
            for (const strCode in rawMappings) {
                if (rawMappings.hasOwnProperty(strCode)) {
                    const scanCode = keyCodes_1.ScanCodeUtils.toEnum(strCode);
                    if (scanCode === 0 /* ScanCode.None */) {
                        log(`Unknown scanCode ${strCode} in mapping.`);
                        continue;
                    }
                    const rawMapping = rawMappings[strCode];
                    const immutableKeyCode = keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode];
                    if (immutableKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                        const keyCode = keyCodes_1.NATIVE_WINDOWS_KEY_CODE_TO_KEY_CODE[rawMapping.vkey] || 0 /* KeyCode.Unknown */;
                        if (keyCode === 0 /* KeyCode.Unknown */ || immutableKeyCode === keyCode) {
                            continue;
                        }
                        if (scanCode !== 134 /* ScanCode.NumpadComma */) {
                            // Looks like ScanCode.NumpadComma doesn't always map to KeyCode.NUMPAD_SEPARATOR
                            // e.g. on POR - PTB
                            continue;
                        }
                    }
                    const value = rawMapping.value;
                    const withShift = rawMapping.withShift;
                    const withAltGr = rawMapping.withAltGr;
                    const withShiftAltGr = rawMapping.withShiftAltGr;
                    const keyCode = keyCodes_1.NATIVE_WINDOWS_KEY_CODE_TO_KEY_CODE[rawMapping.vkey] || 0 /* KeyCode.Unknown */;
                    const mapping = {
                        scanCode: scanCode,
                        keyCode: keyCode,
                        value: value,
                        withShift: withShift,
                        withAltGr: withAltGr,
                        withShiftAltGr: withShiftAltGr,
                    };
                    this._codeInfo[scanCode] = mapping;
                    this._scanCodeToKeyCode[scanCode] = keyCode;
                    if (keyCode === 0 /* KeyCode.Unknown */) {
                        continue;
                    }
                    this._keyCodeExists[keyCode] = true;
                    if (value.length === 0) {
                        // This key does not produce strings
                        this._keyCodeToLabel[keyCode] = null;
                    }
                    else if (value.length > 1) {
                        // This key produces a letter representable with multiple UTF-16 code units.
                        this._keyCodeToLabel[keyCode] = value;
                    }
                    else {
                        const charCode = value.charCodeAt(0);
                        if (charCode >= 97 /* CharCode.a */ && charCode <= 122 /* CharCode.z */) {
                            const upperCaseValue = 65 /* CharCode.A */ + (charCode - 97 /* CharCode.a */);
                            producesLetter[upperCaseValue] = true;
                            producesLetters = true;
                            this._keyCodeToLabel[keyCode] = String.fromCharCode(65 /* CharCode.A */ + (charCode - 97 /* CharCode.a */));
                        }
                        else if (charCode >= 65 /* CharCode.A */ && charCode <= 90 /* CharCode.Z */) {
                            producesLetter[charCode] = true;
                            producesLetters = true;
                            this._keyCodeToLabel[keyCode] = value;
                        }
                        else {
                            this._keyCodeToLabel[keyCode] = value;
                        }
                    }
                }
            }
            // Handle keyboard layouts where latin characters are not produced e.g. Cyrillic
            const _registerLetterIfMissing = (charCode, keyCode) => {
                if (!producesLetter[charCode]) {
                    this._keyCodeToLabel[keyCode] = String.fromCharCode(charCode);
                }
            };
            _registerLetterIfMissing(65 /* CharCode.A */, 31 /* KeyCode.KeyA */);
            _registerLetterIfMissing(66 /* CharCode.B */, 32 /* KeyCode.KeyB */);
            _registerLetterIfMissing(67 /* CharCode.C */, 33 /* KeyCode.KeyC */);
            _registerLetterIfMissing(68 /* CharCode.D */, 34 /* KeyCode.KeyD */);
            _registerLetterIfMissing(69 /* CharCode.E */, 35 /* KeyCode.KeyE */);
            _registerLetterIfMissing(70 /* CharCode.F */, 36 /* KeyCode.KeyF */);
            _registerLetterIfMissing(71 /* CharCode.G */, 37 /* KeyCode.KeyG */);
            _registerLetterIfMissing(72 /* CharCode.H */, 38 /* KeyCode.KeyH */);
            _registerLetterIfMissing(73 /* CharCode.I */, 39 /* KeyCode.KeyI */);
            _registerLetterIfMissing(74 /* CharCode.J */, 40 /* KeyCode.KeyJ */);
            _registerLetterIfMissing(75 /* CharCode.K */, 41 /* KeyCode.KeyK */);
            _registerLetterIfMissing(76 /* CharCode.L */, 42 /* KeyCode.KeyL */);
            _registerLetterIfMissing(77 /* CharCode.M */, 43 /* KeyCode.KeyM */);
            _registerLetterIfMissing(78 /* CharCode.N */, 44 /* KeyCode.KeyN */);
            _registerLetterIfMissing(79 /* CharCode.O */, 45 /* KeyCode.KeyO */);
            _registerLetterIfMissing(80 /* CharCode.P */, 46 /* KeyCode.KeyP */);
            _registerLetterIfMissing(81 /* CharCode.Q */, 47 /* KeyCode.KeyQ */);
            _registerLetterIfMissing(82 /* CharCode.R */, 48 /* KeyCode.KeyR */);
            _registerLetterIfMissing(83 /* CharCode.S */, 49 /* KeyCode.KeyS */);
            _registerLetterIfMissing(84 /* CharCode.T */, 50 /* KeyCode.KeyT */);
            _registerLetterIfMissing(85 /* CharCode.U */, 51 /* KeyCode.KeyU */);
            _registerLetterIfMissing(86 /* CharCode.V */, 52 /* KeyCode.KeyV */);
            _registerLetterIfMissing(87 /* CharCode.W */, 53 /* KeyCode.KeyW */);
            _registerLetterIfMissing(88 /* CharCode.X */, 54 /* KeyCode.KeyX */);
            _registerLetterIfMissing(89 /* CharCode.Y */, 55 /* KeyCode.KeyY */);
            _registerLetterIfMissing(90 /* CharCode.Z */, 56 /* KeyCode.KeyZ */);
            if (!producesLetters) {
                // Since this keyboard layout produces no latin letters at all, most of the UI will use the
                // US kb layout equivalent for UI labels, so also try to render other keys with the US labels
                // for consistency...
                const _registerLabel = (keyCode, charCode) => {
                    // const existingLabel = this._keyCodeToLabel[keyCode];
                    // const existingCharCode = (existingLabel ? existingLabel.charCodeAt(0) : CharCode.Null);
                    // if (existingCharCode < 32 || existingCharCode > 126) {
                    this._keyCodeToLabel[keyCode] = String.fromCharCode(charCode);
                    // }
                };
                _registerLabel(85 /* KeyCode.Semicolon */, 59 /* CharCode.Semicolon */);
                _registerLabel(86 /* KeyCode.Equal */, 61 /* CharCode.Equals */);
                _registerLabel(87 /* KeyCode.Comma */, 44 /* CharCode.Comma */);
                _registerLabel(88 /* KeyCode.Minus */, 45 /* CharCode.Dash */);
                _registerLabel(89 /* KeyCode.Period */, 46 /* CharCode.Period */);
                _registerLabel(90 /* KeyCode.Slash */, 47 /* CharCode.Slash */);
                _registerLabel(91 /* KeyCode.Backquote */, 96 /* CharCode.BackTick */);
                _registerLabel(92 /* KeyCode.BracketLeft */, 91 /* CharCode.OpenSquareBracket */);
                _registerLabel(93 /* KeyCode.Backslash */, 92 /* CharCode.Backslash */);
                _registerLabel(94 /* KeyCode.BracketRight */, 93 /* CharCode.CloseSquareBracket */);
                _registerLabel(95 /* KeyCode.Quote */, 39 /* CharCode.SingleQuote */);
            }
        }
        dumpDebugInfo() {
            const result = [];
            const immutableSamples = [
                88 /* ScanCode.ArrowUp */,
                104 /* ScanCode.Numpad0 */
            ];
            let cnt = 0;
            result.push(`-----------------------------------------------------------------------------------------------------------------------------------------`);
            for (let scanCode = 0 /* ScanCode.None */; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
                if (keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode] !== -1 /* KeyCode.DependsOnKbLayout */) {
                    if (immutableSamples.indexOf(scanCode) === -1) {
                        continue;
                    }
                }
                if (cnt % 6 === 0) {
                    result.push(`|       HW Code combination      |  Key  |    KeyCode combination    |          UI label         |        User settings       | WYSIWYG |`);
                    result.push(`-----------------------------------------------------------------------------------------------------------------------------------------`);
                }
                cnt++;
                const mapping = this._codeInfo[scanCode];
                const strCode = keyCodes_1.ScanCodeUtils.toString(scanCode);
                const mods = [0b000, 0b010, 0b101, 0b111];
                for (const mod of mods) {
                    const ctrlKey = (mod & 0b001) ? true : false;
                    const shiftKey = (mod & 0b010) ? true : false;
                    const altKey = (mod & 0b100) ? true : false;
                    const scanCodeChord = new keybindings_1.ScanCodeChord(ctrlKey, shiftKey, altKey, false, scanCode);
                    const keyCodeChord = this._resolveChord(scanCodeChord);
                    const strKeyCode = (keyCodeChord ? keyCodes_1.KeyCodeUtils.toString(keyCodeChord.keyCode) : null);
                    const resolvedKb = (keyCodeChord ? new WindowsNativeResolvedKeybinding(this, [keyCodeChord]) : null);
                    const outScanCode = `${ctrlKey ? 'Ctrl+' : ''}${shiftKey ? 'Shift+' : ''}${altKey ? 'Alt+' : ''}${strCode}`;
                    const ariaLabel = (resolvedKb ? resolvedKb.getAriaLabel() : null);
                    const outUILabel = (ariaLabel ? ariaLabel.replace(/Control\+/, 'Ctrl+') : null);
                    const outUserSettings = (resolvedKb ? resolvedKb.getUserSettingsLabel() : null);
                    const outKey = WindowsNativeResolvedKeybinding.getProducedChar(scanCodeChord, mapping);
                    const outKb = (strKeyCode ? `${ctrlKey ? 'Ctrl+' : ''}${shiftKey ? 'Shift+' : ''}${altKey ? 'Alt+' : ''}${strKeyCode}` : null);
                    const isWYSIWYG = (resolvedKb ? resolvedKb.isWYSIWYG() : false);
                    const outWYSIWYG = (isWYSIWYG ? '       ' : '   NO  ');
                    result.push(`| ${this._leftPad(outScanCode, 30)} | ${outKey} | ${this._leftPad(outKb, 25)} | ${this._leftPad(outUILabel, 25)} |  ${this._leftPad(outUserSettings, 25)} | ${outWYSIWYG} |`);
                }
                result.push(`-----------------------------------------------------------------------------------------------------------------------------------------`);
            }
            return result.join('\n');
        }
        _leftPad(str, cnt) {
            if (str === null) {
                str = 'null';
            }
            while (str.length < cnt) {
                str = ' ' + str;
            }
            return str;
        }
        getUILabelForKeyCode(keyCode) {
            return this._getLabelForKeyCode(keyCode);
        }
        getAriaLabelForKeyCode(keyCode) {
            return this._getLabelForKeyCode(keyCode);
        }
        getUserSettingsLabelForKeyCode(keyCode) {
            if (this._isUSStandard) {
                return keyCodes_1.KeyCodeUtils.toUserSettingsUS(keyCode);
            }
            return keyCodes_1.KeyCodeUtils.toUserSettingsGeneral(keyCode);
        }
        getElectronAcceleratorForKeyBinding(chord) {
            return keyCodes_1.KeyCodeUtils.toElectronAccelerator(chord.keyCode);
        }
        _getLabelForKeyCode(keyCode) {
            return this._keyCodeToLabel[keyCode] || keyCodes_1.KeyCodeUtils.toString(0 /* KeyCode.Unknown */);
        }
        resolveKeyboardEvent(keyboardEvent) {
            const ctrlKey = keyboardEvent.ctrlKey || (this._mapAltGrToCtrlAlt && keyboardEvent.altGraphKey);
            const altKey = keyboardEvent.altKey || (this._mapAltGrToCtrlAlt && keyboardEvent.altGraphKey);
            const chord = new keybindings_1.KeyCodeChord(ctrlKey, keyboardEvent.shiftKey, altKey, keyboardEvent.metaKey, keyboardEvent.keyCode);
            return new WindowsNativeResolvedKeybinding(this, [chord]);
        }
        _resolveChord(chord) {
            if (!chord) {
                return null;
            }
            if (chord instanceof keybindings_1.KeyCodeChord) {
                if (!this._keyCodeExists[chord.keyCode]) {
                    return null;
                }
                return chord;
            }
            const keyCode = this._scanCodeToKeyCode[chord.scanCode] || 0 /* KeyCode.Unknown */;
            if (keyCode === 0 /* KeyCode.Unknown */ || !this._keyCodeExists[keyCode]) {
                return null;
            }
            return new keybindings_1.KeyCodeChord(chord.ctrlKey, chord.shiftKey, chord.altKey, chord.metaKey, keyCode);
        }
        resolveKeybinding(keybinding) {
            const chords = (0, resolvedKeybindingItem_1.toEmptyArrayIfContainsNull)(keybinding.chords.map(chord => this._resolveChord(chord)));
            if (chords.length > 0) {
                return [new WindowsNativeResolvedKeybinding(this, chords)];
            }
            return [];
        }
    }
    exports.WindowsKeyboardMapper = WindowsKeyboardMapper;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93c0tleWJvYXJkTWFwcGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMva2V5YmluZGluZy9jb21tb24vd2luZG93c0tleWJvYXJkTWFwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUM7SUFDbEIsU0FBUyxHQUFHLENBQUMsR0FBVztRQUN2QixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ1QsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixDQUFDO0lBQ0YsQ0FBQztJQVlELE1BQWEsK0JBQWdDLFNBQVEsK0NBQW9DO1FBSXhGLFlBQVksTUFBNkIsRUFBRSxNQUFzQjtZQUNoRSxLQUFLLGtDQUEwQixNQUFNLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUN2QixDQUFDO1FBRVMsU0FBUyxDQUFDLEtBQW1CO1lBQ3RDLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6RCxDQUFDO1FBRU8sd0JBQXdCLENBQUMsS0FBbUI7WUFDbkQsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsRUFBRSxDQUFDO2dCQUNyQyxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFDRCxPQUFPLHVCQUFZLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRU0sVUFBVTtZQUNoQixPQUFPLGtDQUFlLENBQUMsT0FBTyxDQUFD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