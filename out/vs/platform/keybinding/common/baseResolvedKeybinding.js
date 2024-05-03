/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/keybindingLabels", "vs/base/common/keybindings"], function (require, exports, errors_1, keybindingLabels_1, keybindings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseResolvedKeybinding = void 0;
    class BaseResolvedKeybinding extends keybindings_1.ResolvedKeybinding {
        constructor(os, chords) {
            super();
            if (chords.length === 0) {
                throw (0, errors_1.illegalArgument)(`chords`);
            }
            this._os = os;
            this._chords = chords;
        }
        getLabel() {
            return keybindingLabels_1.UILabelProvider.toLabel(this._os, this._chords, (keybinding) => this._getLabel(keybinding));
        }
        getAriaLabel() {
            return keybindingLabels_1.AriaLabelProvider.toLabel(this._os, this._chords, (keybinding) => this._getAriaLabel(keybinding));
        }
        getElectronAccelerator() {
            if (this._chords.length > 1) {
                // [Electron Accelerators] Electron cannot handle chords
                return null;
            }
            if (this._chords[0].isDuplicateModifierCase()) {
                // [Electron Accelerators] Electron cannot handle modifier only keybindings
                // e.g. "shift shift"
                return null;
            }
            return keybindingLabels_1.ElectronAcceleratorLabelProvider.toLabel(this._os, this._chords, (keybinding) => this._getElectronAccelerator(keybinding));
        }
        getUserSettingsLabel() {
            return keybindingLabels_1.UserSettingsLabelProvider.toLabel(this._os, this._chords, (keybinding) => this._getUserSettingsLabel(keybinding));
        }
        isWYSIWYG() {
            return this._chords.every((keybinding) => this._isWYSIWYG(keybinding));
        }
        hasMultipleChords() {
            return (this._chords.length > 1);
        }
        getChords() {
            return this._chords.map((keybinding) => this._getChord(keybinding));
        }
        _getChord(keybinding) {
            return new keybindings_1.ResolvedChord(keybinding.ctrlKey, keybinding.shiftKey, keybinding.altKey, keybinding.metaKey, this._getLabel(keybinding), this._getAriaLabel(keybinding));
        }
        getDispatchChords() {
            return this._chords.map((keybinding) => this._getChordDispatch(keybinding));
        }
        getSingleModifierDispatchChords() {
            return this._chords.map((keybinding) => this._getSingleModifierChordDispatch(keybinding));
        }
    }
    exports.BaseResolvedKeybinding = BaseResolvedKeybinding;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZVJlc29sdmVkS2V5YmluZGluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0va2V5YmluZGluZy9jb21tb24vYmFzZVJlc29sdmVkS2V5YmluZGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBc0Isc0JBQXdDLFNBQVEsZ0NBQWtCO1FBS3ZGLFlBQVksRUFBbUIsRUFBRSxNQUFvQjtZQUNwRCxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxJQUFBLHdCQUFlLEVBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsQ0FBQztZQUNELElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ2QsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDdkIsQ0FBQztRQUVNLFFBQVE7WUFDZCxPQUFPLGtDQUFlLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3BHLENBQUM7UUFFTSxZQUFZO1lBQ2xCLE9BQU8sb0NBQWlCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzFHLENBQUM7UUFFTSxzQkFBc0I7WUFDNUIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDN0Isd0RBQXdEO2dCQUN4RCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsdUJBQXVCLEVBQUUsRUFBRSxDQUFDO2dCQUMvQywyRUFBMkU7Z0JBQzNFLHFCQUFxQjtnQkFDckIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxtREFBZ0MsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNuSSxDQUFDO1FBRU0sb0JBQW9CO1lBQzFCLE9BQU8sNENBQXlCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDMUgsQ0FBQztRQUVNLFNBQVM7WUFDZixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVNLGlCQUFpQjtZQUN2QixPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVNLFNBQVM7WUFDZixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVPLFNBQVMsQ0FBQyxVQUFhO1lBQzlCLE9BQU8sSUFBSSwyQkFBYSxDQUN2QixVQUFVLENBQUMsT0FBTyxFQUNsQixVQUFVLENBQUMsUUFBUSxFQUNuQixVQUFVLENBQUMsTUFBTSxFQUNqQixVQUFVLENBQUMsT0FBTyxFQUNsQixJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUMxQixJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUM5QixDQUFDO1FBQ0gsQ0FBQztRQUVNLGlCQUFpQjtZQUN2QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRU0sK0JBQStCO1lBQ3JDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzNGLENBQUM7S0FTRDtJQTdFRCx3REE2RUMifQ==