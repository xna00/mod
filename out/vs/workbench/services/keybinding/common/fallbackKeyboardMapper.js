/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keybindings", "vs/platform/keybinding/common/usLayoutResolvedKeybinding"], function (require, exports, keybindings_1, usLayoutResolvedKeybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FallbackKeyboardMapper = void 0;
    /**
     * A keyboard mapper to be used when reading the keymap from the OS fails.
     */
    class FallbackKeyboardMapper {
        constructor(_mapAltGrToCtrlAlt, _OS) {
            this._mapAltGrToCtrlAlt = _mapAltGrToCtrlAlt;
            this._OS = _OS;
        }
        dumpDebugInfo() {
            return 'FallbackKeyboardMapper dispatching on keyCode';
        }
        resolveKeyboardEvent(keyboardEvent) {
            const ctrlKey = keyboardEvent.ctrlKey || (this._mapAltGrToCtrlAlt && keyboardEvent.altGraphKey);
            const altKey = keyboardEvent.altKey || (this._mapAltGrToCtrlAlt && keyboardEvent.altGraphKey);
            const chord = new keybindings_1.KeyCodeChord(ctrlKey, keyboardEvent.shiftKey, altKey, keyboardEvent.metaKey, keyboardEvent.keyCode);
            const result = this.resolveKeybinding(new keybindings_1.Keybinding([chord]));
            return result[0];
        }
        resolveKeybinding(keybinding) {
            return usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.resolveKeybinding(keybinding, this._OS);
        }
    }
    exports.FallbackKeyboardMapper = FallbackKeyboardMapper;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFsbGJhY2tLZXlib2FyZE1hcHBlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2tleWJpbmRpbmcvY29tbW9uL2ZhbGxiYWNrS2V5Ym9hcmRNYXBwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHOztPQUVHO0lBQ0gsTUFBYSxzQkFBc0I7UUFFbEMsWUFDa0Isa0JBQTJCLEVBQzNCLEdBQW9CO1lBRHBCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBUztZQUMzQixRQUFHLEdBQUgsR0FBRyxDQUFpQjtRQUNsQyxDQUFDO1FBRUUsYUFBYTtZQUNuQixPQUFPLCtDQUErQyxDQUFDO1FBQ3hELENBQUM7UUFFTSxvQkFBb0IsQ0FBQyxhQUE2QjtZQUN4RCxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixJQUFJLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNoRyxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixJQUFJLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM5RixNQUFNLEtBQUssR0FBRyxJQUFJLDBCQUFZLENBQzdCLE9BQU8sRUFDUCxhQUFhLENBQUMsUUFBUSxFQUN0QixNQUFNLEVBQ04sYUFBYSxDQUFDLE9BQU8sRUFDckIsYUFBYSxDQUFDLE9BQU8sQ0FDckIsQ0FBQztZQUNGLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLHdCQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0QsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEIsQ0FBQztRQUVNLGlCQUFpQixDQUFDLFVBQXNCO1lBQzlDLE9BQU8sdURBQTBCLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzRSxDQUFDO0tBQ0Q7SUE1QkQsd0RBNEJDIn0=