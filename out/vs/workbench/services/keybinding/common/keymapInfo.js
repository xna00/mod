/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/platform/keyboardLayout/common/keyboardLayout"], function (require, exports, platform_1, keyboardLayout_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeymapInfo = void 0;
    function deserializeMapping(serializedMapping) {
        const mapping = serializedMapping;
        const ret = {};
        for (const key in mapping) {
            const result = mapping[key];
            if (result.length) {
                const value = result[0];
                const withShift = result[1];
                const withAltGr = result[2];
                const withShiftAltGr = result[3];
                const mask = Number(result[4]);
                const vkey = result.length === 6 ? result[5] : undefined;
                ret[key] = {
                    'value': value,
                    'vkey': vkey,
                    'withShift': withShift,
                    'withAltGr': withAltGr,
                    'withShiftAltGr': withShiftAltGr,
                    'valueIsDeadKey': (mask & 1) > 0,
                    'withShiftIsDeadKey': (mask & 2) > 0,
                    'withAltGrIsDeadKey': (mask & 4) > 0,
                    'withShiftAltGrIsDeadKey': (mask & 8) > 0
                };
            }
            else {
                ret[key] = {
                    'value': '',
                    'valueIsDeadKey': false,
                    'withShift': '',
                    'withShiftIsDeadKey': false,
                    'withAltGr': '',
                    'withAltGrIsDeadKey': false,
                    'withShiftAltGr': '',
                    'withShiftAltGrIsDeadKey': false
                };
            }
        }
        return ret;
    }
    class KeymapInfo {
        constructor(layout, secondaryLayouts, keyboardMapping, isUserKeyboardLayout) {
            this.layout = layout;
            this.secondaryLayouts = secondaryLayouts;
            this.mapping = deserializeMapping(keyboardMapping);
            this.isUserKeyboardLayout = !!isUserKeyboardLayout;
            this.layout.isUserKeyboardLayout = !!isUserKeyboardLayout;
        }
        static createKeyboardLayoutFromDebugInfo(layout, value, isUserKeyboardLayout) {
            const keyboardLayoutInfo = new KeymapInfo(layout, [], {}, true);
            keyboardLayoutInfo.mapping = value;
            return keyboardLayoutInfo;
        }
        update(other) {
            this.layout = other.layout;
            this.secondaryLayouts = other.secondaryLayouts;
            this.mapping = other.mapping;
            this.isUserKeyboardLayout = other.isUserKeyboardLayout;
            this.layout.isUserKeyboardLayout = other.isUserKeyboardLayout;
        }
        getScore(other) {
            let score = 0;
            for (const key in other) {
                if (platform_1.isWindows && (key === 'Backslash' || key === 'KeyQ')) {
                    // keymap from Chromium is probably wrong.
                    continue;
                }
                if (platform_1.isLinux && (key === 'Backspace' || key === 'Escape')) {
                    // native keymap doesn't align with keyboard event
                    continue;
                }
                const currentMapping = this.mapping[key];
                if (currentMapping === undefined) {
                    score -= 1;
                }
                const otherMapping = other[key];
                if (currentMapping && otherMapping && currentMapping.value !== otherMapping.value) {
                    score -= 1;
                }
            }
            return score;
        }
        equal(other) {
            if (this.isUserKeyboardLayout !== other.isUserKeyboardLayout) {
                return false;
            }
            if ((0, keyboardLayout_1.getKeyboardLayoutId)(this.layout) !== (0, keyboardLayout_1.getKeyboardLayoutId)(other.layout)) {
                return false;
            }
            return this.fuzzyEqual(other.mapping);
        }
        fuzzyEqual(other) {
            for (const key in other) {
                if (platform_1.isWindows && (key === 'Backslash' || key === 'KeyQ')) {
                    // keymap from Chromium is probably wrong.
                    continue;
                }
                if (this.mapping[key] === undefined) {
                    return false;
                }
                const currentMapping = this.mapping[key];
                const otherMapping = other[key];
                if (currentMapping.value !== otherMapping.value) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.KeymapInfo = KeymapInfo;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5bWFwSW5mby5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2tleWJpbmRpbmcvY29tbW9uL2tleW1hcEluZm8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLFNBQVMsa0JBQWtCLENBQUMsaUJBQXFDO1FBQ2hFLE1BQU0sT0FBTyxHQUFHLGlCQUFpQixDQUFDO1FBRWxDLE1BQU0sR0FBRyxHQUEyQixFQUFFLENBQUM7UUFDdkMsS0FBSyxNQUFNLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUMzQixNQUFNLE1BQU0sR0FBd0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pELElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNuQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUIsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUN6RCxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUc7b0JBQ1YsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsTUFBTSxFQUFFLElBQUk7b0JBQ1osV0FBVyxFQUFFLFNBQVM7b0JBQ3RCLFdBQVcs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