/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/platform/instantiation/common/instantiation"], function (require, exports, keyCodes_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IKeyboardLayoutService = void 0;
    exports.areKeyboardLayoutsEqual = areKeyboardLayoutsEqual;
    exports.parseKeyboardLayoutDescription = parseKeyboardLayoutDescription;
    exports.getKeyboardLayoutId = getKeyboardLayoutId;
    exports.windowsKeyboardMappingEquals = windowsKeyboardMappingEquals;
    exports.macLinuxKeyboardMappingEquals = macLinuxKeyboardMappingEquals;
    exports.IKeyboardLayoutService = (0, instantiation_1.createDecorator)('keyboardLayoutService');
    function areKeyboardLayoutsEqual(a, b) {
        if (!a || !b) {
            return false;
        }
        if (a.name && b.name && a.name === b.name) {
            return true;
        }
        if (a.id && b.id && a.id === b.id) {
            return true;
        }
        if (a.model &&
            b.model &&
            a.model === b.model &&
            a.layout === b.layout) {
            return true;
        }
        return false;
    }
    function parseKeyboardLayoutDescription(layout) {
        if (!layout) {
            return { label: '', description: '' };
        }
        if (layout.name) {
            // windows
            const windowsLayout = layout;
            return {
                label: windowsLayout.text,
                description: ''
            };
        }
        if (layout.id) {
            const macLayout = layout;
            if (macLayout.localizedName) {
                return {
                    label: macLayout.localizedName,
                    description: ''
                };
            }
            if (/^com\.apple\.keylayout\./.test(macLayout.id)) {
                return {
                    label: macLayout.id.replace(/^com\.apple\.keylayout\./, '').replace(/-/, ' '),
                    description: ''
                };
            }
            if (/^.*inputmethod\./.test(macLayout.id)) {
                return {
                    label: macLayout.id.replace(/^.*inputmethod\./, '').replace(/[-\.]/, ' '),
                    description: `Input Method (${macLayout.lang})`
                };
            }
            return {
                label: macLayout.lang,
                description: ''
            };
        }
        const linuxLayout = layout;
        return {
            label: linuxLayout.layout,
            description: ''
        };
    }
    function getKeyboardLayoutId(layout) {
        if (layout.name) {
            return layout.name;
        }
        if (layout.id) {
            return layout.id;
        }
        return layout.layout;
    }
    function windowsKeyMappingEquals(a, b) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return (a.vkey === b.vkey
            && a.value === b.value
            && a.withShift === b.withShift
            && a.withAltGr === b.withAltGr
            && a.withShiftAltGr === b.withShiftAltGr);
    }
    function windowsKeyboardMappingEquals(a, b) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        for (let scanCode = 0; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
            const strScanCode = keyCodes_1.ScanCodeUtils.toString(scanCode);
            const aEntry = a[strScanCode];
            const bEntry = b[strScanCode];
            if (!windowsKeyMappingEquals(aEntry, bEntry)) {
                return false;
            }
        }
        return true;
    }
    function macLinuxKeyMappingEquals(a, b) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return (a.value === b.value
            && a.withShift === b.withShift
            && a.withAltGr === b.withAltGr
            && a.withShiftAltGr === b.withShiftAltGr);
    }
    function macLinuxKeyboardMappingEquals(a, b) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        for (let scanCode = 0; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
            const strScanCode = keyCodes_1.ScanCodeUtils.toString(scanCode);
            const aEntry = a[strScanCode];
            const bEntry = b[strScanCode];
            if (!macLinuxKeyMappingEquals(aEntry, bEntry)) {
                return false;
            }
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmRMYXlvdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2tleWJvYXJkTGF5b3V0L2NvbW1vbi9rZXlib2FyZExheW91dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrRmhHLDBEQXNCQztJQUVELHdFQWdEQztJQUVELGtEQVVDO0lBa0JELG9FQWdCQztJQWlCRCxzRUFnQkM7SUFqT1ksUUFBQSxzQkFBc0IsR0FBRyxJQUFBLCtCQUFlLEVBQXlCLHVCQUF1QixDQUFDLENBQUM7SUEwRXZHLFNBQWdCLHVCQUF1QixDQUFDLENBQTZCLEVBQUUsQ0FBNkI7UUFDbkcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ2QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsSUFBaUMsQ0FBRSxDQUFDLElBQUksSUFBaUMsQ0FBRSxDQUFDLElBQUksSUFBaUMsQ0FBRSxDQUFDLElBQUksS0FBa0MsQ0FBRSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ25LLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELElBQTZCLENBQUUsQ0FBQyxFQUFFLElBQTZCLENBQUUsQ0FBQyxFQUFFLElBQTZCLENBQUUsQ0FBQyxFQUFFLEtBQThCLENBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUMzSSxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxJQUErQixDQUFFLENBQUMsS0FBSztZQUNYLENBQUUsQ0FBQyxLQUFLO1lBQ1IsQ0FBRSxDQUFDLEtBQUssS0FBZ0MsQ0FBRSxDQUFDLEtBQUs7WUFDaEQsQ0FBRSxDQUFDLE1BQU0sS0FBZ0MsQ0FBRSxDQUFDLE1BQU0sRUFDNUUsQ0FBQztZQUNGLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU8sS0FB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