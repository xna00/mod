/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/keybindings", "vs/platform/keybinding/common/baseResolvedKeybinding", "vs/platform/keybinding/common/resolvedKeybindingItem"], function (require, exports, keyCodes_1, keybindings_1, baseResolvedKeybinding_1, resolvedKeybindingItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.USLayoutResolvedKeybinding = void 0;
    /**
     * Do not instantiate. Use KeybindingService to get a ResolvedKeybinding seeded with information about the current kb layout.
     */
    class USLayoutResolvedKeybinding extends baseResolvedKeybinding_1.BaseResolvedKeybinding {
        constructor(chords, os) {
            super(os, chords);
        }
        _keyCodeToUILabel(keyCode) {
            if (this._os === 2 /* OperatingSystem.Macintosh */) {
                switch (keyCode) {
                    case 15 /* KeyCode.LeftArrow */:
                        return '←';
                    case 16 /* KeyCode.UpArrow */:
                        return '↑';
                    case 17 /* KeyCode.RightArrow */:
                        return '→';
                    case 18 /* KeyCode.DownArrow */:
                        return '↓';
                }
            }
            return keyCodes_1.KeyCodeUtils.toString(keyCode);
        }
        _getLabel(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            return this._keyCodeToUILabel(chord.keyCode);
        }
        _getAriaLabel(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            return keyCodes_1.KeyCodeUtils.toString(chord.keyCode);
        }
        _getElectronAccelerator(chord) {
            return keyCodes_1.KeyCodeUtils.toElectronAccelerator(chord.keyCode);
        }
        _getUserSettingsLabel(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            const result = keyCodes_1.KeyCodeUtils.toUserSettingsUS(chord.keyCode);
            return (result ? result.toLowerCase() : result);
        }
        _isWYSIWYG() {
            return true;
        }
        _getChordDispatch(chord) {
            return USLayoutResolvedKeybinding.getDispatchStr(chord);
        }
        static getDispatchStr(chord) {
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
        _getSingleModifierChordDispatch(keybinding) {
            if (keybinding.keyCode === 5 /* KeyCode.Ctrl */ && !keybinding.shiftKey && !keybinding.altKey && !keybinding.metaKey) {
                return 'ctrl';
            }
            if (keybinding.keyCode === 4 /* KeyCode.Shift */ && !keybinding.ctrlKey && !keybinding.altKey && !keybinding.metaKey) {
                return 'shift';
            }
            if (keybinding.keyCode === 6 /* KeyCode.Alt */ && !keybinding.ctrlKey && !keybinding.shiftKey && !keybinding.metaKey) {
                return 'alt';
            }
            if (keybinding.keyCode === 57 /* KeyCode.Meta */ && !keybinding.ctrlKey && !keybinding.shiftKey && !keybinding.altKey) {
                return 'meta';
            }
            return null;
        }
        /**
         * *NOTE*: Check return value for `KeyCode.Unknown`.
         */
        static _scanCodeToKeyCode(scanCode) {
            const immutableKeyCode = keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode];
            if (immutableKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                return immutableKeyCode;
            }
            switch (scanCode) {
                case 10 /* ScanCode.KeyA */: return 31 /* KeyCode.KeyA */;
                case 11 /* ScanCode.KeyB */: return 32 /* KeyCode.KeyB */;
                case 12 /* ScanCode.KeyC */: return 33 /* KeyCode.KeyC */;
                case 13 /* ScanCode.KeyD */: return 34 /* KeyCode.KeyD */;
                case 14 /* ScanCode.KeyE */: return 35 /* KeyCode.KeyE */;
                case 15 /* ScanCode.KeyF */: return 36 /* KeyCode.KeyF */;
                case 16 /* ScanCode.KeyG */: return 37 /* KeyCode.KeyG */;
                case 17 /* ScanCode.KeyH */: return 38 /* KeyCode.KeyH */;
                case 18 /* ScanCode.KeyI */: return 39 /* KeyCode.KeyI */;
                case 19 /* ScanCode.KeyJ */: return 40 /* KeyCode.KeyJ */;
                case 20 /* ScanCode.KeyK */: return 41 /* KeyCode.KeyK */;
                case 21 /* ScanCode.KeyL */: return 42 /* KeyCode.KeyL */;
                case 22 /* ScanCode.KeyM */: return 43 /* KeyCode.KeyM */;
                case 23 /* ScanCode.KeyN */: return 44 /* KeyCode.KeyN */;
                case 24 /* ScanCode.KeyO */: return 45 /* KeyCode.KeyO */;
                case 25 /* ScanCode.KeyP */: return 46 /* KeyCode.KeyP */;
                case 26 /* ScanCode.KeyQ */: return 47 /* KeyCode.KeyQ */;
                case 27 /* ScanCode.KeyR */: return 48 /* KeyCode.KeyR */;
                case 28 /* ScanCode.KeyS */: return 49 /* KeyCode.KeyS */;
                case 29 /* ScanCode.KeyT */: return 50 /* KeyCode.KeyT */;
                case 30 /* ScanCode.KeyU */: return 51 /* KeyCode.KeyU */;
                case 31 /* ScanCode.KeyV */: return 52 /* KeyCode.KeyV */;
                case 32 /* ScanCode.KeyW */: return 53 /* KeyCode.KeyW */;
                case 33 /* ScanCode.KeyX */: return 54 /* KeyCode.KeyX */;
                case 34 /* ScanCode.KeyY */: return 55 /* KeyCode.KeyY */;
                case 35 /* ScanCode.KeyZ */: return 56 /* KeyCode.KeyZ */;
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
                case 51 /* ScanCode.Minus */: return 88 /* KeyCode.Minus */;
                case 52 /* ScanCode.Equal */: return 86 /* KeyCode.Equal */;
                case 53 /* ScanCode.BracketLeft */: return 92 /* KeyCode.BracketLeft */;
                case 54 /* ScanCode.BracketRight */: return 94 /* KeyCode.BracketRight */;
                case 55 /* ScanCode.Backslash */: return 93 /* KeyCode.Backslash */;
                case 56 /* ScanCode.IntlHash */: return 0 /* KeyCode.Unknown */; // missing
                case 57 /* ScanCode.Semicolon */: return 85 /* KeyCode.Semicolon */;
                case 58 /* ScanCode.Quote */: return 95 /* KeyCode.Quote */;
                case 59 /* ScanCode.Backquote */: return 91 /* KeyCode.Backquote */;
                case 60 /* ScanCode.Comma */: return 87 /* KeyCode.Comma */;
                case 61 /* ScanCode.Period */: return 89 /* KeyCode.Period */;
                case 62 /* ScanCode.Slash */: return 90 /* KeyCode.Slash */;
                case 106 /* ScanCode.IntlBackslash */: return 97 /* KeyCode.IntlBackslash */;
            }
            return 0 /* KeyCode.Unknown */;
        }
        static _toKeyCodeChord(chord) {
            if (!chord) {
                return null;
            }
            if (chord instanceof keybindings_1.KeyCodeChord) {
                return chord;
            }
            const keyCode = this._scanCodeToKeyCode(chord.scanCode);
            if (keyCode === 0 /* KeyCode.Unknown */) {
                return null;
            }
            return new keybindings_1.KeyCodeChord(chord.ctrlKey, chord.shiftKey, chord.altKey, chord.metaKey, keyCode);
        }
        static resolveKeybinding(keybinding, os) {
            const chords = (0, resolvedKeybindingItem_1.toEmptyArrayIfContainsNull)(keybinding.chords.map(chord => this._toKeyCodeChord(chord)));
            if (chords.length > 0) {
                return [new USLayoutResolvedKeybinding(chords, os)];
            }
            return [];
        }
    }
    exports.USLayoutResolvedKeybinding = USLayoutResolvedKeybinding;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNMYXlvdXRSZXNvbHZlZEtleWJpbmRpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2tleWJpbmRpbmcvY29tbW9uL3VzTGF5b3V0UmVzb2x2ZWRLZXliaW5kaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRzs7T0FFRztJQUNILE1BQWEsMEJBQTJCLFNBQVEsK0NBQW9DO1FBRW5GLFlBQVksTUFBc0IsRUFBRSxFQUFtQjtZQUN0RCxLQUFLLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ25CLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxPQUFnQjtZQUN6QyxJQUFJLElBQUksQ0FBQyxHQUFHLHNDQUE4QixFQUFFLENBQUM7Z0JBQzVDLFFBQVEsT0FBTyxFQUFFLENBQUM7b0JBQ2pCO3dCQUNDLE9BQU8sR0FBRyxDQUFDO29CQUNaO3dCQUNDLE9BQU8sR0FBRyxDQUFDO29CQUNaO3dCQUNDLE9BQU8sR0FBRyxDQUFDO29CQUNaO3dCQUNDLE9BQU8sR0FBRyxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyx1QkFBWSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRVMsU0FBUyxDQUFDLEtBQW1CO1lBQ3RDLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFUyxhQUFhLENBQUMsS0FBbUI7WUFDMUMsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsRUFBRSxDQUFDO2dCQUNyQyxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7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