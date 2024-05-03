/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors"], function (require, exports, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResolvedKeybinding = exports.ResolvedChord = exports.Keybinding = exports.ScanCodeChord = exports.KeyCodeChord = void 0;
    exports.decodeKeybinding = decodeKeybinding;
    exports.createSimpleKeybinding = createSimpleKeybinding;
    /**
     * Binary encoding strategy:
     * ```
     *    1111 11
     *    5432 1098 7654 3210
     *    ---- CSAW KKKK KKKK
     *  C = bit 11 = ctrlCmd flag
     *  S = bit 10 = shift flag
     *  A = bit 9 = alt flag
     *  W = bit 8 = winCtrl flag
     *  K = bits 0-7 = key code
     * ```
     */
    var BinaryKeybindingsMask;
    (function (BinaryKeybindingsMask) {
        BinaryKeybindingsMask[BinaryKeybindingsMask["CtrlCmd"] = 2048] = "CtrlCmd";
        BinaryKeybindingsMask[BinaryKeybindingsMask["Shift"] = 1024] = "Shift";
        BinaryKeybindingsMask[BinaryKeybindingsMask["Alt"] = 512] = "Alt";
        BinaryKeybindingsMask[BinaryKeybindingsMask["WinCtrl"] = 256] = "WinCtrl";
        BinaryKeybindingsMask[BinaryKeybindingsMask["KeyCode"] = 255] = "KeyCode";
    })(BinaryKeybindingsMask || (BinaryKeybindingsMask = {}));
    function decodeKeybinding(keybinding, OS) {
        if (typeof keybinding === 'number') {
            if (keybinding === 0) {
                return null;
            }
            const firstChord = (keybinding & 0x0000FFFF) >>> 0;
            const secondChord = (keybinding & 0xFFFF0000) >>> 16;
            if (secondChord !== 0) {
                return new Keybinding([
                    createSimpleKeybinding(firstChord, OS),
                    createSimpleKeybinding(secondChord, OS)
                ]);
            }
            return new Keybinding([createSimpleKeybinding(firstChord, OS)]);
        }
        else {
            const chords = [];
            for (let i = 0; i < keybinding.length; i++) {
                chords.push(createSimpleKeybinding(keybinding[i], OS));
            }
            return new Keybinding(chords);
        }
    }
    function createSimpleKeybinding(keybinding, OS) {
        const ctrlCmd = (keybinding & 2048 /* BinaryKeybindingsMask.CtrlCmd */ ? true : false);
        const winCtrl = (keybinding & 256 /* BinaryKeybindingsMask.WinCtrl */ ? true : false);
        const ctrlKey = (OS === 2 /* OperatingSystem.Macintosh */ ? winCtrl : ctrlCmd);
        const shiftKey = (keybinding & 1024 /* BinaryKeybindingsMask.Shift */ ? true : false);
        const altKey = (keybinding & 512 /* BinaryKeybindingsMask.Alt */ ? true : false);
        const metaKey = (OS === 2 /* OperatingSystem.Macintosh */ ? ctrlCmd : winCtrl);
        const keyCode = (keybinding & 255 /* BinaryKeybindingsMask.KeyCode */);
        return new KeyCodeChord(ctrlKey, shiftKey, altKey, metaKey, keyCode);
    }
    /**
     * Represents a chord which uses the `keyCode` field of keyboard events.
     * A chord is a combination of keys pressed simultaneously.
     */
    class KeyCodeChord {
        constructor(ctrlKey, shiftKey, altKey, metaKey, keyCode) {
            this.ctrlKey = ctrlKey;
            this.shiftKey = shiftKey;
            this.altKey = altKey;
            this.metaKey = metaKey;
            this.keyCode = keyCode;
        }
        equals(other) {
            return (other instanceof KeyCodeChord
                && this.ctrlKey === other.ctrlKey
                && this.shiftKey === other.shiftKey
                && this.altKey === other.altKey
                && this.metaKey === other.metaKey
                && this.keyCode === other.keyCode);
        }
        getHashCode() {
            const ctrl = this.ctrlKey ? '1' : '0';
            const shift = this.shiftKey ? '1' : '0';
            const alt = this.altKey ? '1' : '0';
            const meta = this.metaKey ? '1' : '0';
            return `K${ctrl}${shift}${alt}${meta}${this.keyCode}`;
        }
        isModifierKey() {
            return (this.keyCode === 0 /* KeyCode.Unknown */
                || this.keyCode === 5 /* KeyCode.Ctrl */
                || this.keyCode === 57 /* KeyCode.Meta */
                || this.keyCode === 6 /* KeyCode.Alt */
                || this.keyCode === 4 /* KeyCode.Shift */);
        }
        toKeybinding() {
            return new Keybinding([this]);
        }
        /**
         * Does this keybinding refer to the key code of a modifier and it also has the modifier flag?
         */
        isDuplicateModifierCase() {
            return ((this.ctrlKey && this.keyCode === 5 /* KeyCode.Ctrl */)
                || (this.shiftKey && this.keyCode === 4 /* KeyCode.Shift */)
                || (this.altKey && this.keyCode === 6 /* KeyCode.Alt */)
                || (this.metaKey && this.keyCode === 57 /* KeyCode.Meta */));
        }
    }
    exports.KeyCodeChord = KeyCodeChord;
    /**
     * Represents a chord which uses the `code` field of keyboard events.
     * A chord is a combination of keys pressed simultaneously.
     */
    class ScanCodeChord {
        constructor(ctrlKey, shiftKey, altKey, metaKey, scanCode) {
            this.ctrlKey = ctrlKey;
            this.shiftKey = shiftKey;
            this.altKey = altKey;
            this.metaKey = metaKey;
            this.scanCode = scanCode;
        }
        equals(other) {
            return (other instanceof ScanCodeChord
                && this.ctrlKey === other.ctrlKey
                && this.shiftKey === other.shiftKey
                && this.altKey === other.altKey
                && this.metaKey === other.metaKey
                && this.scanCode === other.scanCode);
        }
        getHashCode() {
            const ctrl = this.ctrlKey ? '1' : '0';
            const shift = this.shiftKey ? '1' : '0';
            const alt = this.altKey ? '1' : '0';
            const meta = this.metaKey ? '1' : '0';
            return `S${ctrl}${shift}${alt}${meta}${this.scanCode}`;
        }
        /**
         * Does this keybinding refer to the key code of a modifier and it also has the modifier flag?
         */
        isDuplicateModifierCase() {
            return ((this.ctrlKey && (this.scanCode === 157 /* ScanCode.ControlLeft */ || this.scanCode === 161 /* ScanCode.ControlRight */))
                || (this.shiftKey && (this.scanCode === 158 /* ScanCode.ShiftLeft */ || this.scanCode === 162 /* ScanCode.ShiftRight */))
                || (this.altKey && (this.scanCode === 159 /* ScanCode.AltLeft */ || this.scanCode === 163 /* ScanCode.AltRight */))
                || (this.metaKey && (this.scanCode === 160 /* ScanCode.MetaLeft */ || this.scanCode === 164 /* ScanCode.MetaRight */)));
        }
    }
    exports.ScanCodeChord = ScanCodeChord;
    /**
     * A keybinding is a sequence of chords.
     */
    class Keybinding {
        constructor(chords) {
            if (chords.length === 0) {
                throw (0, errors_1.illegalArgument)(`chords`);
            }
            this.chords = chords;
        }
        getHashCode() {
            let result = '';
            for (let i = 0, len = this.chords.length; i < len; i++) {
                if (i !== 0) {
                    result += ';';
                }
                result += this.chords[i].getHashCode();
            }
            return result;
        }
        equals(other) {
            if (other === null) {
                return false;
            }
            if (this.chords.length !== other.chords.length) {
                return false;
            }
            for (let i = 0; i < this.chords.length; i++) {
                if (!this.chords[i].equals(other.chords[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.Keybinding = Keybinding;
    class ResolvedChord {
        constructor(ctrlKey, shiftKey, altKey, metaKey, keyLabel, keyAriaLabel) {
            this.ctrlKey = ctrlKey;
            this.shiftKey = shiftKey;
            this.altKey = altKey;
            this.metaKey = metaKey;
            this.keyLabel = keyLabel;
            this.keyAriaLabel = keyAriaLabel;
        }
    }
    exports.ResolvedChord = ResolvedChord;
    /**
     * A resolved keybinding. Consists of one or multiple chords.
     */
    class ResolvedKeybinding {
    }
    exports.ResolvedKeybinding = ResolvedKeybinding;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2tleWJpbmRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTJCaEcsNENBcUJDO0lBRUQsd0RBWUM7SUF4REQ7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0gsSUFBVyxxQkFNVjtJQU5ELFdBQVcscUJBQXFCO1FBQy9CLDBFQUF5QixDQUFBO1FBQ3pCLHNFQUF1QixDQUFBO1FBQ3ZCLGlFQUFvQixDQUFBO1FBQ3BCLHlFQUF3QixDQUFBO1FBQ3hCLHlFQUFvQixDQUFBO0lBQ3JCLENBQUMsRUFOVSxxQkFBcUIsS0FBckIscUJBQXFCLFFBTS9CO0lBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsVUFBNkIsRUFBRSxFQUFtQjtRQUNsRixJQUFJLE9BQU8sVUFBVSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ3BDLElBQUksVUFBVSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN0QixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxNQUFNLFVBQVUsR0FBRyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3JELElBQUksV0FBVyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN2QixPQUFPLElBQUksVUFBVSxDQUFDO29CQUNyQixzQkFBc0IsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO29CQUN0QyxzQkFBc0IsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO2lCQUN2QyxDQUFDLENBQUM7WUFDSixDQUFDO1lBQ0QsT0FBTyxJQUFJLFVBQVUsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLFVBQVUsRUFBRSxFQUFF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