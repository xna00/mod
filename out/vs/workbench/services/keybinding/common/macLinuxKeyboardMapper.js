/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/keybindings", "vs/platform/keybinding/common/baseResolvedKeybinding"], function (require, exports, keyCodes_1, keybindings_1, baseResolvedKeybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MacLinuxKeyboardMapper = exports.NativeResolvedKeybinding = void 0;
    /**
     * A map from character to key codes.
     * e.g. Contains entries such as:
     *  - '/' => { keyCode: KeyCode.US_SLASH, shiftKey: false }
     *  - '?' => { keyCode: KeyCode.US_SLASH, shiftKey: true }
     */
    const CHAR_CODE_TO_KEY_CODE = [];
    class NativeResolvedKeybinding extends baseResolvedKeybinding_1.BaseResolvedKeybinding {
        constructor(mapper, os, chords) {
            super(os, chords);
            this._mapper = mapper;
        }
        _getLabel(chord) {
            return this._mapper.getUILabelForScanCodeChord(chord);
        }
        _getAriaLabel(chord) {
            return this._mapper.getAriaLabelForScanCodeChord(chord);
        }
        _getElectronAccelerator(chord) {
            return this._mapper.getElectronAcceleratorLabelForScanCodeChord(chord);
        }
        _getUserSettingsLabel(chord) {
            return this._mapper.getUserSettingsLabelForScanCodeChord(chord);
        }
        _isWYSIWYG(binding) {
            if (!binding) {
                return true;
            }
            if (keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[binding.scanCode] !== -1 /* KeyCode.DependsOnKbLayout */) {
                return true;
            }
            const a = this._mapper.getAriaLabelForScanCodeChord(binding);
            const b = this._mapper.getUserSettingsLabelForScanCodeChord(binding);
            if (!a && !b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return (a.toLowerCase() === b.toLowerCase());
        }
        _getChordDispatch(chord) {
            return this._mapper.getDispatchStrForScanCodeChord(chord);
        }
        _getSingleModifierChordDispatch(chord) {
            if ((chord.scanCode === 157 /* ScanCode.ControlLeft */ || chord.scanCode === 161 /* ScanCode.ControlRight */) && !chord.shiftKey && !chord.altKey && !chord.metaKey) {
                return 'ctrl';
            }
            if ((chord.scanCode === 159 /* ScanCode.AltLeft */ || chord.scanCode === 163 /* ScanCode.AltRight */) && !chord.ctrlKey && !chord.shiftKey && !chord.metaKey) {
                return 'alt';
            }
            if ((chord.scanCode === 158 /* ScanCode.ShiftLeft */ || chord.scanCode === 162 /* ScanCode.ShiftRight */) && !chord.ctrlKey && !chord.altKey && !chord.metaKey) {
                return 'shift';
            }
            if ((chord.scanCode === 160 /* ScanCode.MetaLeft */ || chord.scanCode === 164 /* ScanCode.MetaRight */) && !chord.ctrlKey && !chord.shiftKey && !chord.altKey) {
                return 'meta';
            }
            return null;
        }
    }
    exports.NativeResolvedKeybinding = NativeResolvedKeybinding;
    class ScanCodeCombo {
        constructor(ctrlKey, shiftKey, altKey, scanCode) {
            this.ctrlKey = ctrlKey;
            this.shiftKey = shiftKey;
            this.altKey = altKey;
            this.scanCode = scanCode;
        }
        toString() {
            return `${this.ctrlKey ? 'Ctrl+' : ''}${this.shiftKey ? 'Shift+' : ''}${this.altKey ? 'Alt+' : ''}${keyCodes_1.ScanCodeUtils.toString(this.scanCode)}`;
        }
        equals(other) {
            return (this.ctrlKey === other.ctrlKey
                && this.shiftKey === other.shiftKey
                && this.altKey === other.altKey
                && this.scanCode === other.scanCode);
        }
        getProducedCharCode(mapping) {
            if (!mapping) {
                return '';
            }
            if (this.ctrlKey && this.shiftKey && this.altKey) {
                return mapping.withShiftAltGr;
            }
            if (this.ctrlKey && this.altKey) {
                return mapping.withAltGr;
            }
            if (this.shiftKey) {
                return mapping.withShift;
            }
            return mapping.value;
        }
        getProducedChar(mapping) {
            const charCode = MacLinuxKeyboardMapper.getCharCode(this.getProducedCharCode(mapping));
            if (charCode === 0) {
                return ' --- ';
            }
            if (charCode >= 768 /* CharCode.U_Combining_Grave_Accent */ && charCode <= 879 /* CharCode.U_Combining_Latin_Small_Letter_X */) {
                // combining
                return 'U+' + charCode.toString(16);
            }
            return '  ' + String.fromCharCode(charCode) + '  ';
        }
    }
    class KeyCodeCombo {
        constructor(ctrlKey, shiftKey, altKey, keyCode) {
            this.ctrlKey = ctrlKey;
            this.shiftKey = shiftKey;
            this.altKey = altKey;
            this.keyCode = keyCode;
        }
        toString() {
            return `${this.ctrlKey ? 'Ctrl+' : ''}${this.shiftKey ? 'Shift+' : ''}${this.altKey ? 'Alt+' : ''}${keyCodes_1.KeyCodeUtils.toString(this.keyCode)}`;
        }
    }
    class ScanCodeKeyCodeMapper {
        constructor() {
            /**
             * ScanCode combination => KeyCode combination.
             * Only covers relevant modifiers ctrl, shift, alt (since meta does not influence the mappings).
             */
            this._scanCodeToKeyCode = [];
            /**
             * inverse of `_scanCodeToKeyCode`.
             * KeyCode combination => ScanCode combination.
             * Only covers relevant modifiers ctrl, shift, alt (since meta does not influence the mappings).
             */
            this._keyCodeToScanCode = [];
            this._scanCodeToKeyCode = [];
            this._keyCodeToScanCode = [];
        }
        registrationComplete() {
            // IntlHash and IntlBackslash are rare keys, so ensure they don't end up being the preferred...
            this._moveToEnd(56 /* ScanCode.IntlHash */);
            this._moveToEnd(106 /* ScanCode.IntlBackslash */);
        }
        _moveToEnd(scanCode) {
            for (let mod = 0; mod < 8; mod++) {
                const encodedKeyCodeCombos = this._scanCodeToKeyCode[(scanCode << 3) + mod];
                if (!encodedKeyCodeCombos) {
                    continue;
                }
                for (let i = 0, len = encodedKeyCodeCombos.length; i < len; i++) {
                    const encodedScanCodeCombos = this._keyCodeToScanCode[encodedKeyCodeCombos[i]];
                    if (encodedScanCodeCombos.length === 1) {
                        continue;
                    }
                    for (let j = 0, len = encodedScanCodeCombos.length; j < len; j++) {
                        const entry = encodedScanCodeCombos[j];
                        const entryScanCode = (entry >>> 3);
                        if (entryScanCode === scanCode) {
                            // Move this entry to the end
                            for (let k = j + 1; k < len; k++) {
                                encodedScanCodeCombos[k - 1] = encodedScanCodeCombos[k];
                            }
                            encodedScanCodeCombos[len - 1] = entry;
                        }
                    }
                }
            }
        }
        registerIfUnknown(scanCodeCombo, keyCodeCombo) {
            if (keyCodeCombo.keyCode === 0 /* KeyCode.Unknown */) {
                return;
            }
            const scanCodeComboEncoded = this._encodeScanCodeCombo(scanCodeCombo);
            const keyCodeComboEncoded = this._encodeKeyCodeCombo(keyCodeCombo);
            const keyCodeIsDigit = (keyCodeCombo.keyCode >= 21 /* KeyCode.Digit0 */ && keyCodeCombo.keyCode <= 30 /* KeyCode.Digit9 */);
            const keyCodeIsLetter = (keyCodeCombo.keyCode >= 31 /* KeyCode.KeyA */ && keyCodeCombo.keyCode <= 56 /* KeyCode.KeyZ */);
            const existingKeyCodeCombos = this._scanCodeToKeyCode[scanCodeComboEncoded];
            // Allow a scan code to map to multiple key codes if it is a digit or a letter key code
            if (keyCodeIsDigit || keyCodeIsLetter) {
                // Only check that we don't insert the same entry twice
                if (existingKeyCodeCombos) {
                    for (let i = 0, len = existingKeyCodeCombos.length; i < len; i++) {
                        if (existingKeyCodeCombos[i] === keyCodeComboEncoded) {
                            // avoid duplicates
                            return;
                        }
                    }
                }
            }
            else {
                // Don't allow multiples
                if (existingKeyCodeCombos && existingKeyCodeCombos.length !== 0) {
                    return;
                }
            }
            this._scanCodeToKeyCode[scanCodeComboEncoded] = this._scanCodeToKeyCode[scanCodeComboEncoded] || [];
            this._scanCodeToKeyCode[scanCodeComboEncoded].unshift(keyCodeComboEncoded);
            this._keyCodeToScanCode[keyCodeComboEncoded] = this._keyCodeToScanCode[keyCodeComboEncoded] || [];
            this._keyCodeToScanCode[keyCodeComboEncoded].unshift(scanCodeComboEncoded);
        }
        lookupKeyCodeCombo(keyCodeCombo) {
            const keyCodeComboEncoded = this._encodeKeyCodeCombo(keyCodeCombo);
            const scanCodeCombosEncoded = this._keyCodeToScanCode[keyCodeComboEncoded];
            if (!scanCodeCombosEncoded || scanCodeCombosEncoded.length === 0) {
                return [];
            }
            const result = [];
            for (let i = 0, len = scanCodeCombosEncoded.length; i < len; i++) {
                const scanCodeComboEncoded = scanCodeCombosEncoded[i];
                const ctrlKey = (scanCodeComboEncoded & 0b001) ? true : false;
                const shiftKey = (scanCodeComboEncoded & 0b010) ? true : false;
                const altKey = (scanCodeComboEncoded & 0b100) ? true : false;
                const scanCode = (scanCodeComboEncoded >>> 3);
                result[i] = new ScanCodeCombo(ctrlKey, shiftKey, altKey, scanCode);
            }
            return result;
        }
        lookupScanCodeCombo(scanCodeCombo) {
            const scanCodeComboEncoded = this._encodeScanCodeCombo(scanCodeCombo);
            const keyCodeCombosEncoded = this._scanCodeToKeyCode[scanCodeComboEncoded];
            if (!keyCodeCombosEncoded || keyCodeCombosEncoded.length === 0) {
                return [];
            }
            const result = [];
            for (let i = 0, len = keyCodeCombosEncoded.length; i < len; i++) {
                const keyCodeComboEncoded = keyCodeCombosEncoded[i];
                const ctrlKey = (keyCodeComboEncoded & 0b001) ? true : false;
                const shiftKey = (keyCodeComboEncoded & 0b010) ? true : false;
                const altKey = (keyCodeComboEncoded & 0b100) ? true : false;
                const keyCode = (keyCodeComboEncoded >>> 3);
                result[i] = new KeyCodeCombo(ctrlKey, shiftKey, altKey, keyCode);
            }
            return result;
        }
        guessStableKeyCode(scanCode) {
            if (scanCode >= 36 /* ScanCode.Digit1 */ && scanCode <= 45 /* ScanCode.Digit0 */) {
                // digits are ok
                switch (scanCode) {
                    case 36 /* ScanCode.Digit1 */: return 22 /* KeyCode.Digit1 */;
                    case 37 /* ScanCode.Digit2 */: return 23 /* KeyCode.Digit2 */;
                    case 38 /* ScanCode.Digit3 */: return 24 /* KeyCode.Digit3 */;
                    case 39 /* ScanCode.Digit4 */: return 25 /* KeyCode.Digit4 */;
                    case 40 /* ScanCode.Digit5 */: return 26 /* KeyCode.Digit5 */;
                    case 41 /* ScanCode.Digit6 */: return 27 /* KeyCode.Digit6 */;
                    case 42 /* ScanCode.Digit7 */: return 28 /* KeyCode.Digit7 */;
                    case 43 /* ScanCode.Digit8 */: return 29 /* KeyCode.Digit8 */;
                    case 44 /* ScanCode.Digit9 */: return 30 /* KeyCode.Digit9 */;
                    case 45 /* ScanCode.Digit0 */: return 21 /* KeyCode.Digit0 */;
                }
            }
            // Lookup the scanCode with and without shift and see if the keyCode is stable
            const keyCodeCombos1 = this.lookupScanCodeCombo(new ScanCodeCombo(false, false, false, scanCode));
            const keyCodeCombos2 = this.lookupScanCodeCombo(new ScanCodeCombo(false, true, false, scanCode));
            if (keyCodeCombos1.length === 1 && keyCodeCombos2.length === 1) {
                const shiftKey1 = keyCodeCombos1[0].shiftKey;
                const keyCode1 = keyCodeCombos1[0].keyCode;
                const shiftKey2 = keyCodeCombos2[0].shiftKey;
                const keyCode2 = keyCodeCombos2[0].keyCode;
                if (keyCode1 === keyCode2 && shiftKey1 !== shiftKey2) {
                    // This looks like a stable mapping
                    return keyCode1;
                }
            }
            return -1 /* KeyCode.DependsOnKbLayout */;
        }
        _encodeScanCodeCombo(scanCodeCombo) {
            return this._encode(scanCodeCombo.ctrlKey, scanCodeCombo.shiftKey, scanCodeCombo.altKey, scanCodeCombo.scanCode);
        }
        _encodeKeyCodeCombo(keyCodeCombo) {
            return this._encode(keyCodeCombo.ctrlKey, keyCodeCombo.shiftKey, keyCodeCombo.altKey, keyCodeCombo.keyCode);
        }
        _encode(ctrlKey, shiftKey, altKey, principal) {
            return (((ctrlKey ? 1 : 0) << 0)
                | ((shiftKey ? 1 : 0) << 1)
                | ((altKey ? 1 : 0) << 2)
                | principal << 3) >>> 0;
        }
    }
    class MacLinuxKeyboardMapper {
        constructor(_isUSStandard, rawMappings, _mapAltGrToCtrlAlt, _OS) {
            this._isUSStandard = _isUSStandard;
            this._mapAltGrToCtrlAlt = _mapAltGrToCtrlAlt;
            this._OS = _OS;
            /**
             * UI label for a ScanCode.
             */
            this._scanCodeToLabel = [];
            /**
             * Dispatching string for a ScanCode.
             */
            this._scanCodeToDispatch = [];
            this._codeInfo = [];
            this._scanCodeKeyCodeMapper = new ScanCodeKeyCodeMapper();
            this._scanCodeToLabel = [];
            this._scanCodeToDispatch = [];
            const _registerIfUnknown = (hwCtrlKey, hwShiftKey, hwAltKey, scanCode, kbCtrlKey, kbShiftKey, kbAltKey, keyCode) => {
                this._scanCodeKeyCodeMapper.registerIfUnknown(new ScanCodeCombo(hwCtrlKey ? true : false, hwShiftKey ? true : false, hwAltKey ? true : false, scanCode), new KeyCodeCombo(kbCtrlKey ? true : false, kbShiftKey ? true : false, kbAltKey ? true : false, keyCode));
            };
            const _registerAllCombos = (_ctrlKey, _shiftKey, _altKey, scanCode, keyCode) => {
                for (let ctrlKey = _ctrlKey; ctrlKey <= 1; ctrlKey++) {
                    for (let shiftKey = _shiftKey; shiftKey <= 1; shiftKey++) {
                        for (let altKey = _altKey; altKey <= 1; altKey++) {
                            _registerIfUnknown(ctrlKey, shiftKey, altKey, scanCode, ctrlKey, shiftKey, altKey, keyCode);
                        }
                    }
                }
            };
            // Initialize `_scanCodeToLabel`
            for (let scanCode = 0 /* ScanCode.None */; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
                this._scanCodeToLabel[scanCode] = null;
            }
            // Initialize `_scanCodeToDispatch`
            for (let scanCode = 0 /* ScanCode.None */; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
                this._scanCodeToDispatch[scanCode] = null;
            }
            // Handle immutable mappings
            for (let scanCode = 0 /* ScanCode.None */; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
                const keyCode = keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode];
                if (keyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                    _registerAllCombos(0, 0, 0, scanCode, keyCode);
                    this._scanCodeToLabel[scanCode] = keyCodes_1.KeyCodeUtils.toString(keyCode);
                    if (keyCode === 0 /* KeyCode.Unknown */ || keyCode === 5 /* KeyCode.Ctrl */ || keyCode === 57 /* KeyCode.Meta */ || keyCode === 6 /* KeyCode.Alt */ || keyCode === 4 /* KeyCode.Shift */) {
                        this._scanCodeToDispatch[scanCode] = null; // cannot dispatch on this ScanCode
                    }
                    else {
                        this._scanCodeToDispatch[scanCode] = `[${keyCodes_1.ScanCodeUtils.toString(scanCode)}]`;
                    }
                }
            }
            // Try to identify keyboard layouts where characters A-Z are missing
            // and forcibly map them to their corresponding scan codes if that is the case
            const missingLatinLettersOverride = {};
            {
                const producesLatinLetter = [];
                for (const strScanCode in rawMappings) {
                    if (rawMappings.hasOwnProperty(strScanCode)) {
                        const scanCode = keyCodes_1.ScanCodeUtils.toEnum(strScanCode);
                        if (scanCode === 0 /* ScanCode.None */) {
                            continue;
                        }
                        if (keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode] !== -1 /* KeyCode.DependsOnKbLayout */) {
                            continue;
                        }
                        const rawMapping = rawMappings[strScanCode];
                        const value = MacLinuxKeyboardMapper.getCharCode(rawMapping.value);
                        if (value >= 97 /* CharCode.a */ && value <= 122 /* CharCode.z */) {
                            const upperCaseValue = 65 /* CharCode.A */ + (value - 97 /* CharCode.a */);
                            producesLatinLetter[upperCaseValue] = true;
                        }
                    }
                }
                const _registerLetterIfMissing = (charCode, scanCode, value, withShift) => {
                    if (!producesLatinLetter[charCode]) {
                        missingLatinLettersOverride[keyCodes_1.ScanCodeUtils.toString(scanCode)] = {
                            value: value,
                            withShift: withShift,
                            withAltGr: '',
                            withShiftAltGr: ''
                        };
                    }
                };
                // Ensure letters are mapped
                _registerLetterIfMissing(65 /* CharCode.A */, 10 /* ScanCode.KeyA */, 'a', 'A');
                _registerLetterIfMissing(66 /* CharCode.B */, 11 /* ScanCode.KeyB */, 'b', 'B');
                _registerLetterIfMissing(67 /* CharCode.C */, 12 /* ScanCode.KeyC */, 'c', 'C');
                _registerLetterIfMissing(68 /* CharCode.D */, 13 /* ScanCode.KeyD */, 'd', 'D');
                _registerLetterIfMissing(69 /* CharCode.E */, 14 /* ScanCode.KeyE */, 'e', 'E');
                _registerLetterIfMissing(70 /* CharCode.F */, 15 /* ScanCode.KeyF */, 'f', 'F');
                _registerLetterIfMissing(71 /* CharCode.G */, 16 /* ScanCode.KeyG */, 'g', 'G');
                _registerLetterIfMissing(72 /* CharCode.H */, 17 /* ScanCode.KeyH */, 'h', 'H');
                _registerLetterIfMissing(73 /* CharCode.I */, 18 /* ScanCode.KeyI */, 'i', 'I');
                _registerLetterIfMissing(74 /* CharCode.J */, 19 /* ScanCode.KeyJ */, 'j', 'J');
                _registerLetterIfMissing(75 /* CharCode.K */, 20 /* ScanCode.KeyK */, 'k', 'K');
                _registerLetterIfMissing(76 /* CharCode.L */, 21 /* ScanCode.KeyL */, 'l', 'L');
                _registerLetterIfMissing(77 /* CharCode.M */, 22 /* ScanCode.KeyM */, 'm', 'M');
                _registerLetterIfMissing(78 /* CharCode.N */, 23 /* ScanCode.KeyN */, 'n', 'N');
                _registerLetterIfMissing(79 /* CharCode.O */, 24 /* ScanCode.KeyO */, 'o', 'O');
                _registerLetterIfMissing(80 /* CharCode.P */, 25 /* ScanCode.KeyP */, 'p', 'P');
                _registerLetterIfMissing(81 /* CharCode.Q */, 26 /* ScanCode.KeyQ */, 'q', 'Q');
                _registerLetterIfMissing(82 /* CharCode.R */, 27 /* ScanCode.KeyR */, 'r', 'R');
                _registerLetterIfMissing(83 /* CharCode.S */, 28 /* ScanCode.KeyS */, 's', 'S');
                _registerLetterIfMissing(84 /* CharCode.T */, 29 /* ScanCode.KeyT */, 't', 'T');
                _registerLetterIfMissing(85 /* CharCode.U */, 30 /* ScanCode.KeyU */, 'u', 'U');
                _registerLetterIfMissing(86 /* CharCode.V */, 31 /* ScanCode.KeyV */, 'v', 'V');
                _registerLetterIfMissing(87 /* CharCode.W */, 32 /* ScanCode.KeyW */, 'w', 'W');
                _registerLetterIfMissing(88 /* CharCode.X */, 33 /* ScanCode.KeyX */, 'x', 'X');
                _registerLetterIfMissing(89 /* CharCode.Y */, 34 /* ScanCode.KeyY */, 'y', 'Y');
                _registerLetterIfMissing(90 /* CharCode.Z */, 35 /* ScanCode.KeyZ */, 'z', 'Z');
            }
            const mappings = [];
            let mappingsLen = 0;
            for (const strScanCode in rawMappings) {
                if (rawMappings.hasOwnProperty(strScanCode)) {
                    const scanCode = keyCodes_1.ScanCodeUtils.toEnum(strScanCode);
                    if (scanCode === 0 /* ScanCode.None */) {
                        continue;
                    }
                    if (keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode] !== -1 /* KeyCode.DependsOnKbLayout */) {
                        continue;
                    }
                    this._codeInfo[scanCode] = rawMappings[strScanCode];
                    const rawMapping = missingLatinLettersOverride[strScanCode] || rawMappings[strScanCode];
                    const value = MacLinuxKeyboardMapper.getCharCode(rawMapping.value);
                    const withShift = MacLinuxKeyboardMapper.getCharCode(rawMapping.withShift);
                    const withAltGr = MacLinuxKeyboardMapper.getCharCode(rawMapping.withAltGr);
                    const withShiftAltGr = MacLinuxKeyboardMapper.getCharCode(rawMapping.withShiftAltGr);
                    const mapping = {
                        scanCode: scanCode,
                        value: value,
                        withShift: withShift,
                        withAltGr: withAltGr,
                        withShiftAltGr: withShiftAltGr,
                    };
                    mappings[mappingsLen++] = mapping;
                    this._scanCodeToDispatch[scanCode] = `[${keyCodes_1.ScanCodeUtils.toString(scanCode)}]`;
                    if (value >= 97 /* CharCode.a */ && value <= 122 /* CharCode.z */) {
                        const upperCaseValue = 65 /* CharCode.A */ + (value - 97 /* CharCode.a */);
                        this._scanCodeToLabel[scanCode] = String.fromCharCode(upperCaseValue);
                    }
                    else if (value >= 65 /* CharCode.A */ && value <= 90 /* CharCode.Z */) {
                        this._scanCodeToLabel[scanCode] = String.fromCharCode(value);
                    }
                    else if (value) {
                        this._scanCodeToLabel[scanCode] = String.fromCharCode(value);
                    }
                    else {
                        this._scanCodeToLabel[scanCode] = null;
                    }
                }
            }
            // Handle all `withShiftAltGr` entries
            for (let i = mappings.length - 1; i >= 0; i--) {
                const mapping = mappings[i];
                const scanCode = mapping.scanCode;
                const withShiftAltGr = mapping.withShiftAltGr;
                if (withShiftAltGr === mapping.withAltGr || withShiftAltGr === mapping.withShift || withShiftAltGr === mapping.value) {
                    // handled below
                    continue;
                }
                const kb = MacLinuxKeyboardMapper._charCodeToKb(withShiftAltGr);
                if (!kb) {
                    continue;
                }
                const kbShiftKey = kb.shiftKey;
                const keyCode = kb.keyCode;
                if (kbShiftKey) {
                    // Ctrl+Shift+Alt+ScanCode => Shift+KeyCode
                    _registerIfUnknown(1, 1, 1, scanCode, 0, 1, 0, keyCode); //       Ctrl+Alt+ScanCode =>          Shift+KeyCode
                }
                else {
                    // Ctrl+Shift+Alt+ScanCode => KeyCode
                    _registerIfUnknown(1, 1, 1, scanCode, 0, 0, 0, keyCode); //       Ctrl+Alt+ScanCode =>                KeyCode
                }
            }
            // Handle all `withAltGr` entries
            for (let i = mappings.length - 1; i >= 0; i--) {
                const mapping = mappings[i];
                const scanCode = mapping.scanCode;
                const withAltGr = mapping.withAltGr;
                if (withAltGr === mapping.withShift || withAltGr === mapping.value) {
                    // handled below
                    continue;
                }
                const kb = MacLinuxKeyboardMapper._charCodeToKb(withAltGr);
                if (!kb) {
                    continue;
                }
                const kbShiftKey = kb.shiftKey;
                const keyCode = kb.keyCode;
                if (kbShiftKey) {
                    // Ctrl+Alt+ScanCode => Shift+KeyCode
                    _registerIfUnknown(1, 0, 1, scanCode, 0, 1, 0, keyCode); //       Ctrl+Alt+ScanCode =>          Shift+KeyCode
                }
                else {
                    // Ctrl+Alt+ScanCode => KeyCode
                    _registerIfUnknown(1, 0, 1, scanCode, 0, 0, 0, keyCode); //       Ctrl+Alt+ScanCode =>                KeyCode
                }
            }
            // Handle all `withShift` entries
            for (let i = mappings.length - 1; i >= 0; i--) {
                const mapping = mappings[i];
                const scanCode = mapping.scanCode;
                const withShift = mapping.withShift;
                if (withShift === mapping.value) {
                    // handled below
                    continue;
                }
                const kb = MacLinuxKeyboardMapper._charCodeToKb(withShift);
                if (!kb) {
                    continue;
                }
                const kbShiftKey = kb.shiftKey;
                const keyCode = kb.keyCode;
                if (kbShiftKey) {
                    // Shift+ScanCode => Shift+KeyCode
                    _registerIfUnknown(0, 1, 0, scanCode, 0, 1, 0, keyCode); //          Shift+ScanCode =>          Shift+KeyCode
                    _registerIfUnknown(0, 1, 1, scanCode, 0, 1, 1, keyCode); //      Shift+Alt+ScanCode =>      Shift+Alt+KeyCode
                    _registerIfUnknown(1, 1, 0, scanCode, 1, 1, 0, keyCode); //     Ctrl+Shift+ScanCode =>     Ctrl+Shift+KeyCode
                    _registerIfUnknown(1, 1, 1, scanCode, 1, 1, 1, keyCode); // Ctrl+Shift+Alt+ScanCode => Ctrl+Shift+Alt+KeyCode
                }
                else {
                    // Shift+ScanCode => KeyCode
                    _registerIfUnknown(0, 1, 0, scanCode, 0, 0, 0, keyCode); //          Shift+ScanCode =>                KeyCode
                    _registerIfUnknown(0, 1, 0, scanCode, 0, 1, 0, keyCode); //          Shift+ScanCode =>          Shift+KeyCode
                    _registerIfUnknown(0, 1, 1, scanCode, 0, 0, 1, keyCode); //      Shift+Alt+ScanCode =>            Alt+KeyCode
                    _registerIfUnknown(0, 1, 1, scanCode, 0, 1, 1, keyCode); //      Shift+Alt+ScanCode =>      Shift+Alt+KeyCode
                    _registerIfUnknown(1, 1, 0, scanCode, 1, 0, 0, keyCode); //     Ctrl+Shift+ScanCode =>           Ctrl+KeyCode
                    _registerIfUnknown(1, 1, 0, scanCode, 1, 1, 0, keyCode); //     Ctrl+Shift+ScanCode =>     Ctrl+Shift+KeyCode
                    _registerIfUnknown(1, 1, 1, scanCode, 1, 0, 1, keyCode); // Ctrl+Shift+Alt+ScanCode =>       Ctrl+Alt+KeyCode
                    _registerIfUnknown(1, 1, 1, scanCode, 1, 1, 1, keyCode); // Ctrl+Shift+Alt+ScanCode => Ctrl+Shift+Alt+KeyCode
                }
            }
            // Handle all `value` entries
            for (let i = mappings.length - 1; i >= 0; i--) {
                const mapping = mappings[i];
                const scanCode = mapping.scanCode;
                const kb = MacLinuxKeyboardMapper._charCodeToKb(mapping.value);
                if (!kb) {
                    continue;
                }
                const kbShiftKey = kb.shiftKey;
                const keyCode = kb.keyCode;
                if (kbShiftKey) {
                    // ScanCode => Shift+KeyCode
                    _registerIfUnknown(0, 0, 0, scanCode, 0, 1, 0, keyCode); //                ScanCode =>          Shift+KeyCode
                    _registerIfUnknown(0, 0, 1, scanCode, 0, 1, 1, keyCode); //            Alt+ScanCode =>      Shift+Alt+KeyCode
                    _registerIfUnknown(1, 0, 0, scanCode, 1, 1, 0, keyCode); //           Ctrl+ScanCode =>     Ctrl+Shift+KeyCode
                    _registerIfUnknown(1, 0, 1, scanCode, 1, 1, 1, keyCode); //       Ctrl+Alt+ScanCode => Ctrl+Shift+Alt+KeyCode
                }
                else {
                    // ScanCode => KeyCode
                    _registerIfUnknown(0, 0, 0, scanCode, 0, 0, 0, keyCode); //                ScanCode =>                KeyCode
                    _registerIfUnknown(0, 0, 1, scanCode, 0, 0, 1, keyCode); //            Alt+ScanCode =>            Alt+KeyCode
                    _registerIfUnknown(0, 1, 0, scanCode, 0, 1, 0, keyCode); //          Shift+ScanCode =>          Shift+KeyCode
                    _registerIfUnknown(0, 1, 1, scanCode, 0, 1, 1, keyCode); //      Shift+Alt+ScanCode =>      Shift+Alt+KeyCode
                    _registerIfUnknown(1, 0, 0, scanCode, 1, 0, 0, keyCode); //           Ctrl+ScanCode =>           Ctrl+KeyCode
                    _registerIfUnknown(1, 0, 1, scanCode, 1, 0, 1, keyCode); //       Ctrl+Alt+ScanCode =>       Ctrl+Alt+KeyCode
                    _registerIfUnknown(1, 1, 0, scanCode, 1, 1, 0, keyCode); //     Ctrl+Shift+ScanCode =>     Ctrl+Shift+KeyCode
                    _registerIfUnknown(1, 1, 1, scanCode, 1, 1, 1, keyCode); // Ctrl+Shift+Alt+ScanCode => Ctrl+Shift+Alt+KeyCode
                }
            }
            // Handle all left-over available digits
            _registerAllCombos(0, 0, 0, 36 /* ScanCode.Digit1 */, 22 /* KeyCode.Digit1 */);
            _registerAllCombos(0, 0, 0, 37 /* ScanCode.Digit2 */, 23 /* KeyCode.Digit2 */);
            _registerAllCombos(0, 0, 0, 38 /* ScanCode.Digit3 */, 24 /* KeyCode.Digit3 */);
            _registerAllCombos(0, 0, 0, 39 /* ScanCode.Digit4 */, 25 /* KeyCode.Digit4 */);
            _registerAllCombos(0, 0, 0, 40 /* ScanCode.Digit5 */, 26 /* KeyCode.Digit5 */);
            _registerAllCombos(0, 0, 0, 41 /* ScanCode.Digit6 */, 27 /* KeyCode.Digit6 */);
            _registerAllCombos(0, 0, 0, 42 /* ScanCode.Digit7 */, 28 /* KeyCode.Digit7 */);
            _registerAllCombos(0, 0, 0, 43 /* ScanCode.Digit8 */, 29 /* KeyCode.Digit8 */);
            _registerAllCombos(0, 0, 0, 44 /* ScanCode.Digit9 */, 30 /* KeyCode.Digit9 */);
            _registerAllCombos(0, 0, 0, 45 /* ScanCode.Digit0 */, 21 /* KeyCode.Digit0 */);
            this._scanCodeKeyCodeMapper.registrationComplete();
        }
        dumpDebugInfo() {
            const result = [];
            const immutableSamples = [
                88 /* ScanCode.ArrowUp */,
                104 /* ScanCode.Numpad0 */
            ];
            let cnt = 0;
            result.push(`isUSStandard: ${this._isUSStandard}`);
            result.push(`----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------`);
            for (let scanCode = 0 /* ScanCode.None */; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
                if (keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode] !== -1 /* KeyCode.DependsOnKbLayout */) {
                    if (immutableSamples.indexOf(scanCode) === -1) {
                        continue;
                    }
                }
                if (cnt % 4 === 0) {
                    result.push(`|       HW Code combination      |  Key  |    KeyCode combination    | Pri |          UI label         |         User settings          |    Electron accelerator   |       Dispatching string       | WYSIWYG |`);
                    result.push(`----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------`);
                }
                cnt++;
                const mapping = this._codeInfo[scanCode];
                for (let mod = 0; mod < 8; mod++) {
                    const hwCtrlKey = (mod & 0b001) ? true : false;
                    const hwShiftKey = (mod & 0b010) ? true : false;
                    const hwAltKey = (mod & 0b100) ? true : false;
                    const scanCodeCombo = new ScanCodeCombo(hwCtrlKey, hwShiftKey, hwAltKey, scanCode);
                    const resolvedKb = this.resolveKeyboardEvent({
                        _standardKeyboardEventBrand: true,
                        ctrlKey: scanCodeCombo.ctrlKey,
                        shiftKey: scanCodeCombo.shiftKey,
                        altKey: scanCodeCombo.altKey,
                        metaKey: false,
                        altGraphKey: false,
                        keyCode: -1 /* KeyCode.DependsOnKbLayout */,
                        code: keyCodes_1.ScanCodeUtils.toString(scanCode)
                    });
                    const outScanCodeCombo = scanCodeCombo.toString();
                    const outKey = scanCodeCombo.getProducedChar(mapping);
                    const ariaLabel = resolvedKb.getAriaLabel();
                    const outUILabel = (ariaLabel ? ariaLabel.replace(/Control\+/, 'Ctrl+') : null);
                    const outUserSettings = resolvedKb.getUserSettingsLabel();
                    const outElectronAccelerator = resolvedKb.getElectronAccelerator();
                    const outDispatchStr = resolvedKb.getDispatchChords()[0];
                    const isWYSIWYG = (resolvedKb ? resolvedKb.isWYSIWYG() : false);
                    const outWYSIWYG = (isWYSIWYG ? '       ' : '   NO  ');
                    const kbCombos = this._scanCodeKeyCodeMapper.lookupScanCodeCombo(scanCodeCombo);
                    if (kbCombos.length === 0) {
                        result.push(`| ${this._leftPad(outScanCodeCombo, 30)} | ${outKey} | ${this._leftPad('', 25)} | ${this._leftPad('', 3)} | ${this._leftPad(outUILabel, 25)} | ${this._leftPad(outUserSettings, 30)} | ${this._leftPad(outElectronAccelerator, 25)} | ${this._leftPad(outDispatchStr, 30)} | ${outWYSIWYG} |`);
                    }
                    else {
                        for (let i = 0, len = kbCombos.length; i < len; i++) {
                            const kbCombo = kbCombos[i];
                            // find out the priority of this scan code for this key code
                            let colPriority;
                            const scanCodeCombos = this._scanCodeKeyCodeMapper.lookupKeyCodeCombo(kbCombo);
                            if (scanCodeCombos.length === 1) {
                                // no need for priority, this key code combo maps to precisely this scan code combo
                                colPriority = '';
                            }
                            else {
                                let priority = -1;
                                for (let j = 0; j < scanCodeCombos.length; j++) {
                                    if (scanCodeCombos[j].equals(scanCodeCombo)) {
                                        priority = j + 1;
                                        break;
                                    }
                                }
                                colPriority = String(priority);
                            }
                            const outKeybinding = kbCombo.toString();
                            if (i === 0) {
                                result.push(`| ${this._leftPad(outScanCodeCombo, 30)} | ${outKey} | ${this._leftPad(outKeybinding, 25)} | ${this._leftPad(colPriority, 3)} | ${this._leftPad(outUILabel, 25)} | ${this._leftPad(outUserSettings, 30)} | ${this._leftPad(outElectronAccelerator, 25)} | ${this._leftPad(outDispatchStr, 30)} | ${outWYSIWYG} |`);
                            }
                            else {
                                // secondary keybindings
                                result.push(`| ${this._leftPad('', 30)} |       | ${this._leftPad(outKeybinding, 25)} | ${this._leftPad(colPriority, 3)} | ${this._leftPad('', 25)} | ${this._leftPad('', 30)} | ${this._leftPad('', 25)} | ${this._leftPad('', 30)} |         |`);
                            }
                        }
                    }
                }
                result.push(`----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------`);
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
        keyCodeChordToScanCodeChord(chord) {
            // Avoid double Enter bindings (both ScanCode.NumpadEnter and ScanCode.Enter point to KeyCode.Enter)
            if (chord.keyCode === 3 /* KeyCode.Enter */) {
                return [new keybindings_1.ScanCodeChord(chord.ctrlKey, chord.shiftKey, chord.altKey, chord.metaKey, 46 /* ScanCode.Enter */)];
            }
            const scanCodeCombos = this._scanCodeKeyCodeMapper.lookupKeyCodeCombo(new KeyCodeCombo(chord.ctrlKey, chord.shiftKey, chord.altKey, chord.keyCode));
            const result = [];
            for (let i = 0, len = scanCodeCombos.length; i < len; i++) {
                const scanCodeCombo = scanCodeCombos[i];
                result[i] = new keybindings_1.ScanCodeChord(scanCodeCombo.ctrlKey, scanCodeCombo.shiftKey, scanCodeCombo.altKey, chord.metaKey, scanCodeCombo.scanCode);
            }
            return result;
        }
        getUILabelForScanCodeChord(chord) {
            if (!chord) {
                return null;
            }
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            if (this._OS === 2 /* OperatingSystem.Macintosh */) {
                switch (chord.scanCode) {
                    case 86 /* ScanCode.ArrowLeft */:
                        return '←';
                    case 88 /* ScanCode.ArrowUp */:
                        return '↑';
                    case 85 /* ScanCode.ArrowRight */:
                        return '→';
                    case 87 /* ScanCode.ArrowDown */:
                        return '↓';
                }
            }
            return this._scanCodeToLabel[chord.scanCode];
        }
        getAriaLabelForScanCodeChord(chord) {
            if (!chord) {
                return null;
            }
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            return this._scanCodeToLabel[chord.scanCode];
        }
        getDispatchStrForScanCodeChord(chord) {
            const codeDispatch = this._scanCodeToDispatch[chord.scanCode];
            if (!codeDispatch) {
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
            result += codeDispatch;
            return result;
        }
        getUserSettingsLabelForScanCodeChord(chord) {
            if (!chord) {
                return null;
            }
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            const immutableKeyCode = keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[chord.scanCode];
            if (immutableKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                return keyCodes_1.KeyCodeUtils.toUserSettingsUS(immutableKeyCode).toLowerCase();
            }
            // Check if this scanCode always maps to the same keyCode and back
            const constantKeyCode = this._scanCodeKeyCodeMapper.guessStableKeyCode(chord.scanCode);
            if (constantKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                // Verify that this is a good key code that can be mapped back to the same scan code
                const reverseChords = this.keyCodeChordToScanCodeChord(new keybindings_1.KeyCodeChord(chord.ctrlKey, chord.shiftKey, chord.altKey, chord.metaKey, constantKeyCode));
                for (let i = 0, len = reverseChords.length; i < len; i++) {
                    const reverseChord = reverseChords[i];
                    if (reverseChord.scanCode === chord.scanCode) {
                        return keyCodes_1.KeyCodeUtils.toUserSettingsUS(constantKeyCode).toLowerCase();
                    }
                }
            }
            return this._scanCodeToDispatch[chord.scanCode];
        }
        getElectronAcceleratorLabelForScanCodeChord(chord) {
            if (!chord) {
                return null;
            }
            const immutableKeyCode = keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[chord.scanCode];
            if (immutableKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                return keyCodes_1.KeyCodeUtils.toElectronAccelerator(immutableKeyCode);
            }
            // Check if this scanCode always maps to the same keyCode and back
            const constantKeyCode = this._scanCodeKeyCodeMapper.guessStableKeyCode(chord.scanCode);
            if (this._OS === 3 /* OperatingSystem.Linux */ && !this._isUSStandard) {
                // [Electron Accelerators] On Linux, Electron does not handle correctly OEM keys.
                // when using a different keyboard layout than US Standard.
                // See https://github.com/microsoft/vscode/issues/23706
                // See https://github.com/microsoft/vscode/pull/134890#issuecomment-941671791
                const isOEMKey = (constantKeyCode === 85 /* KeyCode.Semicolon */
                    || constantKeyCode === 86 /* KeyCode.Equal */
                    || constantKeyCode === 87 /* KeyCode.Comma */
                    || constantKeyCode === 88 /* KeyCode.Minus */
                    || constantKeyCode === 89 /* KeyCode.Period */
                    || constantKeyCode === 90 /* KeyCode.Slash */
                    || constantKeyCode === 91 /* KeyCode.Backquote */
                    || constantKeyCode === 92 /* KeyCode.BracketLeft */
                    || constantKeyCode === 93 /* KeyCode.Backslash */
                    || constantKeyCode === 94 /* KeyCode.BracketRight */);
                if (isOEMKey) {
                    return null;
                }
            }
            if (constantKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                return keyCodes_1.KeyCodeUtils.toElectronAccelerator(constantKeyCode);
            }
            return null;
        }
        _toResolvedKeybinding(chordParts) {
            if (chordParts.length === 0) {
                return [];
            }
            const result = [];
            this._generateResolvedKeybindings(chordParts, 0, [], result);
            return result;
        }
        _generateResolvedKeybindings(chordParts, currentIndex, previousParts, result) {
            const chordPart = chordParts[currentIndex];
            const isFinalIndex = currentIndex === chordParts.length - 1;
            for (let i = 0, len = chordPart.length; i < len; i++) {
                const chords = [...previousParts, chordPart[i]];
                if (isFinalIndex) {
                    result.push(new NativeResolvedKeybinding(this, this._OS, chords));
                }
                else {
                    this._generateResolvedKeybindings(chordParts, currentIndex + 1, chords, result);
                }
            }
        }
        resolveKeyboardEvent(keyboardEvent) {
            let code = keyCodes_1.ScanCodeUtils.toEnum(keyboardEvent.code);
            // Treat NumpadEnter as Enter
            if (code === 94 /* ScanCode.NumpadEnter */) {
                code = 46 /* ScanCode.Enter */;
            }
            const keyCode = keyboardEvent.keyCode;
            if ((keyCode === 15 /* KeyCode.LeftArrow */)
                || (keyCode === 16 /* KeyCode.UpArrow */)
                || (keyCode === 17 /* KeyCode.RightArrow */)
                || (keyCode === 18 /* KeyCode.DownArrow */)
                || (keyCode === 20 /* KeyCode.Delete */)
                || (keyCode === 19 /* KeyCode.Insert */)
                || (keyCode === 14 /* KeyCode.Home */)
                || (keyCode === 13 /* KeyCode.End */)
                || (keyCode === 12 /* KeyCode.PageDown */)
                || (keyCode === 11 /* KeyCode.PageUp */)
                || (keyCode === 1 /* KeyCode.Backspace */)) {
                // "Dispatch" on keyCode for these key codes to workaround issues with remote desktoping software
                // where the scan codes appear to be incorrect (see https://github.com/microsoft/vscode/issues/24107)
                const immutableScanCode = keyCodes_1.IMMUTABLE_KEY_CODE_TO_CODE[keyCode];
                if (immutableScanCode !== -1 /* ScanCode.DependsOnKbLayout */) {
                    code = immutableScanCode;
                }
            }
            else {
                if ((code === 95 /* ScanCode.Numpad1 */)
                    || (code === 96 /* ScanCode.Numpad2 */)
                    || (code === 97 /* ScanCode.Numpad3 */)
                    || (code === 98 /* ScanCode.Numpad4 */)
                    || (code === 99 /* ScanCode.Numpad5 */)
                    || (code === 100 /* ScanCode.Numpad6 */)
                    || (code === 101 /* ScanCode.Numpad7 */)
                    || (code === 102 /* ScanCode.Numpad8 */)
                    || (code === 103 /* ScanCode.Numpad9 */)
                    || (code === 104 /* ScanCode.Numpad0 */)
                    || (code === 105 /* ScanCode.NumpadDecimal */)) {
                    // "Dispatch" on keyCode for all numpad keys in order for NumLock to work correctly
                    if (keyCode >= 0) {
                        const immutableScanCode = keyCodes_1.IMMUTABLE_KEY_CODE_TO_CODE[keyCode];
                        if (immutableScanCode !== -1 /* ScanCode.DependsOnKbLayout */) {
                            code = immutableScanCode;
                        }
                    }
                }
            }
            const ctrlKey = keyboardEvent.ctrlKey || (this._mapAltGrToCtrlAlt && keyboardEvent.altGraphKey);
            const altKey = keyboardEvent.altKey || (this._mapAltGrToCtrlAlt && keyboardEvent.altGraphKey);
            const chord = new keybindings_1.ScanCodeChord(ctrlKey, keyboardEvent.shiftKey, altKey, keyboardEvent.metaKey, code);
            return new NativeResolvedKeybinding(this, this._OS, [chord]);
        }
        _resolveChord(chord) {
            if (!chord) {
                return [];
            }
            if (chord instanceof keybindings_1.ScanCodeChord) {
                return [chord];
            }
            return this.keyCodeChordToScanCodeChord(chord);
        }
        resolveKeybinding(keybinding) {
            const chords = keybinding.chords.map(chord => this._resolveChord(chord));
            return this._toResolvedKeybinding(chords);
        }
        static _redirectCharCode(charCode) {
            switch (charCode) {
                // allow-any-unicode-next-line
                // CJK: 。 「 」 【 】 ； ，
                // map: . [ ] [ ] ; ,
                case 12290 /* CharCode.U_IDEOGRAPHIC_FULL_STOP */: return 46 /* CharCode.Period */;
                case 12300 /* CharCode.U_LEFT_CORNER_BRACKET */: return 91 /* CharCode.OpenSquareBracket */;
                case 12301 /* CharCode.U_RIGHT_CORNER_BRACKET */: return 93 /* CharCode.CloseSquareBracket */;
                case 12304 /* CharCode.U_LEFT_BLACK_LENTICULAR_BRACKET */: return 91 /* CharCode.OpenSquareBracket */;
                case 12305 /* CharCode.U_RIGHT_BLACK_LENTICULAR_BRACKET */: return 93 /* CharCode.CloseSquareBracket */;
                case 65307 /* CharCode.U_FULLWIDTH_SEMICOLON */: return 59 /* CharCode.Semicolon */;
                case 65292 /* CharCode.U_FULLWIDTH_COMMA */: return 44 /* CharCode.Comma */;
            }
            return charCode;
        }
        static _charCodeToKb(charCode) {
            charCode = this._redirectCharCode(charCode);
            if (charCode < CHAR_CODE_TO_KEY_CODE.length) {
                return CHAR_CODE_TO_KEY_CODE[charCode];
            }
            return null;
        }
        /**
         * Attempt to map a combining character to a regular one that renders the same way.
         *
         * https://www.compart.com/en/unicode/bidiclass/NSM
         */
        static getCharCode(char) {
            if (char.length === 0) {
                return 0;
            }
            const charCode = char.charCodeAt(0);
            switch (charCode) {
                case 768 /* CharCode.U_Combining_Grave_Accent */: return 96 /* CharCode.U_GRAVE_ACCENT */;
                case 769 /* CharCode.U_Combining_Acute_Accent */: return 180 /* CharCode.U_ACUTE_ACCENT */;
                case 770 /* CharCode.U_Combining_Circumflex_Accent */: return 94 /* CharCode.U_CIRCUMFLEX */;
                case 771 /* CharCode.U_Combining_Tilde */: return 732 /* CharCode.U_SMALL_TILDE */;
                case 772 /* CharCode.U_Combining_Macron */: return 175 /* CharCode.U_MACRON */;
                case 773 /* CharCode.U_Combining_Overline */: return 8254 /* CharCode.U_OVERLINE */;
                case 774 /* CharCode.U_Combining_Breve */: return 728 /* CharCode.U_BREVE */;
                case 775 /* CharCode.U_Combining_Dot_Above */: return 729 /* CharCode.U_DOT_ABOVE */;
                case 776 /* CharCode.U_Combining_Diaeresis */: return 168 /* CharCode.U_DIAERESIS */;
                case 778 /* CharCode.U_Combining_Ring_Above */: return 730 /* CharCode.U_RING_ABOVE */;
                case 779 /* CharCode.U_Combining_Double_Acute_Accent */: return 733 /* CharCode.U_DOUBLE_ACUTE_ACCENT */;
            }
            return charCode;
        }
    }
    exports.MacLinuxKeyboardMapper = MacLinuxKeyboardMapper;
    (function () {
        function define(charCode, keyCode, shiftKey) {
            for (let i = CHAR_CODE_TO_KEY_CODE.length; i < charCode; i++) {
                CHAR_CODE_TO_KEY_CODE[i] = null;
            }
            CHAR_CODE_TO_KEY_CODE[charCode] = { keyCode: keyCode, shiftKey: shiftKey };
        }
        for (let chCode = 65 /* CharCode.A */; chCode <= 90 /* CharCode.Z */; chCode++) {
            define(chCode, 31 /* KeyCode.KeyA */ + (chCode - 65 /* CharCode.A */), true);
        }
        for (let chCode = 97 /* CharCode.a */; chCode <= 122 /* CharCode.z */; chCode++) {
            define(chCode, 31 /* KeyCode.KeyA */ + (chCode - 97 /* CharCode.a */), false);
        }
        define(59 /* CharCode.Semicolon */, 85 /* KeyCode.Semicolon */, false);
        define(58 /* CharCode.Colon */, 85 /* KeyCode.Semicolon */, true);
        define(61 /* CharCode.Equals */, 86 /* KeyCode.Equal */, false);
        define(43 /* CharCode.Plus */, 86 /* KeyCode.Equal */, true);
        define(44 /* CharCode.Comma */, 87 /* KeyCode.Comma */, false);
        define(60 /* CharCode.LessThan */, 87 /* KeyCode.Comma */, true);
        define(45 /* CharCode.Dash */, 88 /* KeyCode.Minus */, false);
        define(95 /* CharCode.Underline */, 88 /* KeyCode.Minus */, true);
        define(46 /* CharCode.Period */, 89 /* KeyCode.Period */, false);
        define(62 /* CharCode.GreaterThan */, 89 /* KeyCode.Period */, true);
        define(47 /* CharCode.Slash */, 90 /* KeyCode.Slash */, false);
        define(63 /* CharCode.QuestionMark */, 90 /* KeyCode.Slash */, true);
        define(96 /* CharCode.BackTick */, 91 /* KeyCode.Backquote */, false);
        define(126 /* CharCode.Tilde */, 91 /* KeyCode.Backquote */, true);
        define(91 /* CharCode.OpenSquareBracket */, 92 /* KeyCode.BracketLeft */, false);
        define(123 /* CharCode.OpenCurlyBrace */, 92 /* KeyCode.BracketLeft */, true);
        define(92 /* CharCode.Backslash */, 93 /* KeyCode.Backslash */, false);
        define(124 /* CharCode.Pipe */, 93 /* KeyCode.Backslash */, true);
        define(93 /* CharCode.CloseSquareBracket */, 94 /* KeyCode.BracketRight */, false);
        define(125 /* CharCode.CloseCurlyBrace */, 94 /* KeyCode.BracketRight */, true);
        define(39 /* CharCode.SingleQuote */, 95 /* KeyCode.Quote */, false);
        define(34 /* CharCode.DoubleQuote */, 95 /* KeyCode.Quote */, true);
    })();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFjTGludXhLZXlib2FyZE1hcHBlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2tleWJpbmRpbmcvY29tbW9uL21hY0xpbnV4S2V5Ym9hcmRNYXBwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHOzs7OztPQUtHO0lBQ0gsTUFBTSxxQkFBcUIsR0FBdUQsRUFBRSxDQUFDO0lBRXJGLE1BQWEsd0JBQXlCLFNBQVEsK0NBQXFDO1FBSWxGLFlBQVksTUFBOEIsRUFBRSxFQUFtQixFQUFFLE1BQXVCO1lBQ3ZGLEtBQUssQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDdkIsQ0FBQztRQUVTLFNBQVMsQ0FBQyxLQUFvQjtZQUN2QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVTLGFBQWEsQ0FBQyxLQUFvQjtZQUMzQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsNEJBQTRCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVTLHVCQUF1QixDQUFDLEtBQW9CO1lBQ3JELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQywyQ0FBMkMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRVMscUJBQXFCLENBQUMsS0FBb0I7WUFDbkQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLG9DQUFvQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFUyxVQUFVLENBQUMsT0FBNkI7WUFDakQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELElB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QUFDLENBQUM7UUFFL0MsTUFBTSxpREFBK0IsS0FBSyxDQUFDLENBQUM7UUFDNUMsTUFBTSxzREFBb0MsSUFBSSxDQUFDLENBQUM7UUFFaEQsTUFBTSxvREFBa0MsS0FBSyxDQUFDLENBQUM7UUFDL0MsTUFBTSx5REFBdUMsSUFBSSxDQUFDLENBQUM7UUFFbkQsTUFBTSxrREFBZ0MsS0FBSyxDQUFDLENBQUM7UUFDN0MsTUFBTSx5REFBdUMsSUFBSSxDQUFDLENBQUM7UUFFbkQsTUFBTSx5REFBdUMsS0FBSyxDQUFDLENBQUM7UUFDcEQsTUFBTSx1REFBb0MsSUFBSSxDQUFDLENBQUM7UUFFaEQsTUFBTSxvRUFBa0QsS0FBSyxDQUFDLENBQUM7UUFDL0QsTUFBTSxrRUFBK0MsSUFBSSxDQUFDLENBQUM7UUFFM0QsTUFBTSwwREFBd0MsS0FBSyxDQUFDLENBQUM7UUFDckQsTUFBTSxzREFBbUMsSUFBSSxDQUFDLENBQUM7UUFFL0MsTUFBTSxzRUFBb0QsS0FBSyxDQUFDLENBQUM7UUFDakUsTUFBTSxvRUFBaUQsSUFBSSxDQUFDLENBQUM7UUFFN0QsTUFBTSx3REFBc0MsS0FBSyxDQUFDLENBQUM7UUFDbkQsTUFBTSx3REFBc0MsSUFBSSxDQUFDLENBQUM7SUFDbkQsQ0FBQyxDQUFDLEVBQUUsQ0FBQyJ9