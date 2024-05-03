/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CachedKeyboardMapper = void 0;
    class CachedKeyboardMapper {
        constructor(actual) {
            this._actual = actual;
            this._cache = new Map();
        }
        dumpDebugInfo() {
            return this._actual.dumpDebugInfo();
        }
        resolveKeyboardEvent(keyboardEvent) {
            return this._actual.resolveKeyboardEvent(keyboardEvent);
        }
        resolveKeybinding(keybinding) {
            const hashCode = keybinding.getHashCode();
            const resolved = this._cache.get(hashCode);
            if (!resolved) {
                const r = this._actual.resolveKeybinding(keybinding);
                this._cache.set(hashCode, r);
                return r;
            }
            return resolved;
        }
    }
    exports.CachedKeyboardMapper = CachedKeyboardMapper;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmRNYXBwZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2tleWJvYXJkTGF5b3V0L2NvbW1vbi9rZXlib2FyZE1hcHBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSxvQkFBb0I7UUFLaEMsWUFBWSxNQUF1QjtZQUNsQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxFQUFnQyxDQUFDO1FBQ3ZELENBQUM7UUFFTSxhQUFhO1lBQ25CLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNyQyxDQUFDO1FBRU0sb0JBQW9CLENBQUMsYUFBNkI7WUFDeEQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFFTSxpQkFBaUIsQ0FBQyxVQUFzQjtZQUM5QyxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDMUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDN0IsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztLQUNEO0lBNUJELG9EQTRCQyJ9