/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/keybindings"], function (require, exports, keyCodes_1, keybindings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingParser = void 0;
    class KeybindingParser {
        static _readModifiers(input) {
            input = input.toLowerCase().trim();
            let ctrl = false;
            let shift = false;
            let alt = false;
            let meta = false;
            let matchedModifier;
            do {
                matchedModifier = false;
                if (/^ctrl(\+|\-)/.test(input)) {
                    ctrl = true;
                    input = input.substr('ctrl-'.length);
                    matchedModifier = true;
                }
                if (/^shift(\+|\-)/.test(input)) {
                    shift = true;
                    input = input.substr('shift-'.length);
                    matchedModifier = true;
                }
                if (/^alt(\+|\-)/.test(input)) {
                    alt = true;
                    input = input.substr('alt-'.length);
                    matchedModifier = true;
                }
                if (/^meta(\+|\-)/.test(input)) {
                    meta = true;
                    input = input.substr('meta-'.length);
                    matchedModifier = true;
                }
                if (/^win(\+|\-)/.test(input)) {
                    meta = true;
                    input = input.substr('win-'.length);
                    matchedModifier = true;
                }
                if (/^cmd(\+|\-)/.test(input)) {
                    meta = true;
                    input = input.substr('cmd-'.length);
                    matchedModifier = true;
                }
            } while (matchedModifier);
            let key;
            const firstSpaceIdx = input.indexOf(' ');
            if (firstSpaceIdx > 0) {
                key = input.substring(0, firstSpaceIdx);
                input = input.substring(firstSpaceIdx);
            }
            else {
                key = input;
                input = '';
            }
            return {
                remains: input,
                ctrl,
                shift,
                alt,
                meta,
                key
            };
        }
        static parseChord(input) {
            const mods = this._readModifiers(input);
            const scanCodeMatch = mods.key.match(/^\[([^\]]+)\]$/);
            if (scanCodeMatch) {
                const strScanCode = scanCodeMatch[1];
                const scanCode = keyCodes_1.ScanCodeUtils.lowerCaseToEnum(strScanCode);
                return [new keybindings_1.ScanCodeChord(mods.ctrl, mods.shift, mods.alt, mods.meta, scanCode), mods.remains];
            }
            const keyCode = keyCodes_1.KeyCodeUtils.fromUserSettings(mods.key);
            return [new keybindings_1.KeyCodeChord(mods.ctrl, mods.shift, mods.alt, mods.meta, keyCode), mods.remains];
        }
        static parseKeybinding(input) {
            if (!input) {
                return null;
            }
            const chords = [];
            let chord;
            while (input.length > 0) {
                [chord, input] = this.parseChord(input);
                chords.push(chord);
            }
            return (chords.length > 0 ? new keybindings_1.Keybinding(chords) : null);
        }
    }
    exports.KeybindingParser = KeybindingParser;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ1BhcnNlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24va2V5YmluZGluZ1BhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEcsTUFBYSxnQkFBZ0I7UUFFcEIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFhO1lBQzFDLEtBQUssR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFbkMsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDO1lBQ2pCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNsQixJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUM7WUFDaEIsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDO1lBRWpCLElBQUksZUFBd0IsQ0FBQztZQUU3QixHQUFHLENBQUM7Z0JBQ0gsZUFBZSxHQUFHLEtBQUssQ0FBQztnQkFDeEIsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ2hDLElBQUksR0FBRyxJQUFJLENBQUM7b0JBQ1osS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNyQyxlQUFlLEdBQUcsSUFBSSxDQUFDO2dCQUN4QixDQUFDO2dCQUNELElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNqQyxLQUFLLEdBQUcsSUFBSSxDQUFDO29CQUNiLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDdEMsZUFBZSxHQUFHLElBQUksQ0FBQztnQkFDeEIsQ0FBQztnQkFDRCxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDL0IsR0FBRyxHQUFHLElBQUksQ0FBQztvQkFDWCxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ3BDLGVBQWUsR0FBRyxJQUFJLENBQUM7Z0JBQ3hCLENBQUM7Z0JBQ0QsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ2hDLElBQUksR0FBRyxJQUFJLENBQUM7b0JBQ1osS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNyQyxlQUFlLEdBQUcsSUFBSSxDQUFDO2dCQUN4QixDQUFDO2dCQUNELElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUMvQixJQUFJLEdBQUcsSUFBSSxDQUFDO29CQUNaLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDcEMsZUFBZSxHQUFHLElBQUksQ0FBQztnQkFDeEIsQ0FBQztnQkFDRCxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDL0IsSUFBSSxHQUFHLElBQUksQ0FBQztvQkFDWixLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ3BDLGVBQWUsR0FBRyxJQUFJLENBQUM7Z0JBQ3hCLENBQUM7WUFDRixDQUFDLFFBQVEsZUFBZSxFQUFFO1lBRTFCLElBQUksR0FBVyxDQUFDO1lBRWhCLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDekMsSUFBSSxhQUFhLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZCLEdBQUcsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDeEMsS0FBSyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDeEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLEdBQUcsR0FBRyxLQUFLLENBQUM7Z0JBQ1osS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNaLENBQUM7WUFFRCxPQUFPO2dCQUNOLE9BQU8sRUFBRSxLQUFLO2dCQUNkLElBQUk7Z0JBQ0osS0FBSztnQkFDTCxHQUFHO2dCQUNILElBQUk7Z0JBQ0osR0FBRzthQUNILENBQUM7UUFDSCxDQUFDO1FBRU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFhO1lBQ3RDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEMsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUN2RCxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUNuQixNQUFNLFdBQVcsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLE1BQU0sUUFBUSxHQUFHLHdCQUFhLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUM1RCxPQUFPLENBQUMsSUFBSSwyQkFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hHLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyx1QkFBWSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4RCxPQUFPLENBQUMsSUFBSSwwQkFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzlGLENBQUM7UUFFRCxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQWE7WUFDbkMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFZLEVBQUUsQ0FBQztZQUMzQixJQUFJLEtBQVksQ0FBQztZQUVqQixPQUFPLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEIsQ0FBQztZQUNELE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSx3QkFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1RCxDQUFDO0tBQ0Q7SUE3RkQsNENBNkZDIn0=