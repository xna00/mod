define(["require", "exports", "vs/base/common/types"], function (require, exports, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.register = register;
    exports.getCodiconFontCharacters = getCodiconFontCharacters;
    const _codiconFontCharacters = Object.create(null);
    function register(id, fontCharacter) {
        if ((0, types_1.isString)(fontCharacter)) {
            const val = _codiconFontCharacters[fontCharacter];
            if (val === undefined) {
                throw new Error(`${id} references an unknown codicon: ${fontCharacter}`);
            }
            fontCharacter = val;
        }
        _codiconFontCharacters[id] = fontCharacter;
        return { id };
    }
    /**
     * Only to be used by the iconRegistry.
     */
    function getCodiconFontCharacters() {
        return _codiconFontCharacters;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kaWNvbnNVdGlsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9jb2RpY29uc1V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBVUEsNEJBVUM7SUFLRCw0REFFQztJQW5CRCxNQUFNLHNCQUFzQixHQUE2QixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTdFLFNBQWdCLFFBQVEsQ0FBQyxFQUFVLEVBQUUsYUFBOEI7UUFDbEUsSUFBSSxJQUFBLGdCQUFRLEVBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztZQUM3QixNQUFNLEdBQUcsR0FBRyxzQkFBc0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNsRCxJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsbUNBQW1DLGFBQWEsRUFBRSxDQUFDLENBQUM7WUFDMUUsQ0FBQztZQUNELGFBQWEsR0FBRyxHQUFHLENBQUM7UUFDckIsQ0FBQztRQUNELHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQztRQUMzQyxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUM7SUFDZixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQix3QkFBd0I7UUFDdkMsT0FBTyxzQkFBc0IsQ0FBQztJQUMvQixDQUFDIn0=