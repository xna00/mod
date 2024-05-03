/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserSettingsLabelProvider = exports.ElectronAcceleratorLabelProvider = exports.AriaLabelProvider = exports.UILabelProvider = exports.ModifierLabelProvider = void 0;
    class ModifierLabelProvider {
        constructor(mac, windows, linux = windows) {
            this.modifierLabels = [null]; // index 0 will never me accessed.
            this.modifierLabels[2 /* OperatingSystem.Macintosh */] = mac;
            this.modifierLabels[1 /* OperatingSystem.Windows */] = windows;
            this.modifierLabels[3 /* OperatingSystem.Linux */] = linux;
        }
        toLabel(OS, chords, keyLabelProvider) {
            if (chords.length === 0) {
                return null;
            }
            const result = [];
            for (let i = 0, len = chords.length; i < len; i++) {
                const chord = chords[i];
                const keyLabel = keyLabelProvider(chord);
                if (keyLabel === null) {
                    // this keybinding cannot be expressed...
                    return null;
                }
                result[i] = _simpleAsString(chord, keyLabel, this.modifierLabels[OS]);
            }
            return result.join(' ');
        }
    }
    exports.ModifierLabelProvider = ModifierLabelProvider;
    /**
     * A label provider that prints modifiers in a suitable format for displaying in the UI.
     */
    exports.UILabelProvider = new ModifierLabelProvider({
        ctrlKey: '\u2303',
        shiftKey: '⇧',
        altKey: '⌥',
        metaKey: '⌘',
        separator: '',
    }, {
        ctrlKey: nls.localize({ key: 'ctrlKey', comment: ['This is the short form for the Control key on the keyboard'] }, "Ctrl"),
        shiftKey: nls.localize({ key: 'shiftKey', comment: ['This is the short form for the Shift key on the keyboard'] }, "Shift"),
        altKey: nls.localize({ key: 'altKey', comment: ['This is the short form for the Alt key on the keyboard'] }, "Alt"),
        metaKey: nls.localize({ key: 'windowsKey', comment: ['This is the short form for the Windows key on the keyboard'] }, "Windows"),
        separator: '+',
    }, {
        ctrlKey: nls.localize({ key: 'ctrlKey', comment: ['This is the short form for the Control key on the keyboard'] }, "Ctrl"),
        shiftKey: nls.localize({ key: 'shiftKey', comment: ['This is the short form for the Shift key on the keyboard'] }, "Shift"),
        altKey: nls.localize({ key: 'altKey', comment: ['This is the short form for the Alt key on the keyboard'] }, "Alt"),
        metaKey: nls.localize({ key: 'superKey', comment: ['This is the short form for the Super key on the keyboard'] }, "Super"),
        separator: '+',
    });
    /**
     * A label provider that prints modifiers in a suitable format for ARIA.
     */
    exports.AriaLabelProvider = new ModifierLabelProvider({
        ctrlKey: nls.localize({ key: 'ctrlKey.long', comment: ['This is the long form for the Control key on the keyboard'] }, "Control"),
        shiftKey: nls.localize({ key: 'shiftKey.long', comment: ['This is the long form for the Shift key on the keyboard'] }, "Shift"),
        altKey: nls.localize({ key: 'optKey.long', comment: ['This is the long form for the Alt/Option key on the keyboard'] }, "Option"),
        metaKey: nls.localize({ key: 'cmdKey.long', comment: ['This is the long form for the Command key on the keyboard'] }, "Command"),
        separator: '+',
    }, {
        ctrlKey: nls.localize({ key: 'ctrlKey.long', comment: ['This is the long form for the Control key on the keyboard'] }, "Control"),
        shiftKey: nls.localize({ key: 'shiftKey.long', comment: ['This is the long form for the Shift key on the keyboard'] }, "Shift"),
        altKey: nls.localize({ key: 'altKey.long', comment: ['This is the long form for the Alt key on the keyboard'] }, "Alt"),
        metaKey: nls.localize({ key: 'windowsKey.long', comment: ['This is the long form for the Windows key on the keyboard'] }, "Windows"),
        separator: '+',
    }, {
        ctrlKey: nls.localize({ key: 'ctrlKey.long', comment: ['This is the long form for the Control key on the keyboard'] }, "Control"),
        shiftKey: nls.localize({ key: 'shiftKey.long', comment: ['This is the long form for the Shift key on the keyboard'] }, "Shift"),
        altKey: nls.localize({ key: 'altKey.long', comment: ['This is the long form for the Alt key on the keyboard'] }, "Alt"),
        metaKey: nls.localize({ key: 'superKey.long', comment: ['This is the long form for the Super key on the keyboard'] }, "Super"),
        separator: '+',
    });
    /**
     * A label provider that prints modifiers in a suitable format for Electron Accelerators.
     * See https://github.com/electron/electron/blob/master/docs/api/accelerator.md
     */
    exports.ElectronAcceleratorLabelProvider = new ModifierLabelProvider({
        ctrlKey: 'Ctrl',
        shiftKey: 'Shift',
        altKey: 'Alt',
        metaKey: 'Cmd',
        separator: '+',
    }, {
        ctrlKey: 'Ctrl',
        shiftKey: 'Shift',
        altKey: 'Alt',
        metaKey: 'Super',
        separator: '+',
    });
    /**
     * A label provider that prints modifiers in a suitable format for user settings.
     */
    exports.UserSettingsLabelProvider = new ModifierLabelProvider({
        ctrlKey: 'ctrl',
        shiftKey: 'shift',
        altKey: 'alt',
        metaKey: 'cmd',
        separator: '+',
    }, {
        ctrlKey: 'ctrl',
        shiftKey: 'shift',
        altKey: 'alt',
        metaKey: 'win',
        separator: '+',
    }, {
        ctrlKey: 'ctrl',
        shiftKey: 'shift',
        altKey: 'alt',
        metaKey: 'meta',
        separator: '+',
    });
    function _simpleAsString(modifiers, key, labels) {
        if (key === null) {
            return '';
        }
        const result = [];
        // translate modifier keys: Ctrl-Shift-Alt-Meta
        if (modifiers.ctrlKey) {
            result.push(labels.ctrlKey);
        }
        if (modifiers.shiftKey) {
            result.push(labels.shiftKey);
        }
        if (modifiers.altKey) {
            result.push(labels.altKey);
        }
        if (modifiers.metaKey) {
            result.push(labels.metaKey);
        }
        // the actual key
        if (key !== '') {
            result.push(key);
        }
        return result.join(labels.separator);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ0xhYmVscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24va2V5YmluZGluZ0xhYmVscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQmhHLE1BQWEscUJBQXFCO1FBSWpDLFlBQVksR0FBbUIsRUFBRSxPQUF1QixFQUFFLFFBQXdCLE9BQU87WUFDeEYsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLElBQUssQ0FBQyxDQUFDLENBQUMsa0NBQWtDO1lBQ2pFLElBQUksQ0FBQyxjQUFjLG1DQUEyQixHQUFHLEdBQUcsQ0FBQztZQUNyRCxJQUFJLENBQUMsY0FBYyxpQ0FBeUIsR0FBRyxPQUFPLENBQUM7WUFDdkQsSUFBSSxDQUFDLGNBQWMsK0JBQXVCLEdBQUcsS0FBSyxDQUFDO1FBQ3BELENBQUM7UUFFTSxPQUFPLENBQXNCLEVBQW1CLEVBQUUsTUFBb0IsRUFBRSxnQkFBcUM7WUFDbkgsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN6QixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7WUFDNUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLE1BQU0sUUFBUSxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN6QyxJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUUsQ0FBQztvQkFDdkIseUNBQXlDO29CQUN6QyxPQUFPLElBQUksQ0FBQztnQkFDYixD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