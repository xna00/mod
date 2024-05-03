/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uint"], function (require, exports, uint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CharacterSet = exports.CharacterClassifier = void 0;
    /**
     * A fast character classifier that uses a compact array for ASCII values.
     */
    class CharacterClassifier {
        constructor(_defaultValue) {
            const defaultValue = (0, uint_1.toUint8)(_defaultValue);
            this._defaultValue = defaultValue;
            this._asciiMap = CharacterClassifier._createAsciiMap(defaultValue);
            this._map = new Map();
        }
        static _createAsciiMap(defaultValue) {
            const asciiMap = new Uint8Array(256);
            asciiMap.fill(defaultValue);
            return asciiMap;
        }
        set(charCode, _value) {
            const value = (0, uint_1.toUint8)(_value);
            if (charCode >= 0 && charCode < 256) {
                this._asciiMap[charCode] = value;
            }
            else {
                this._map.set(charCode, value);
            }
        }
        get(charCode) {
            if (charCode >= 0 && charCode < 256) {
                return this._asciiMap[charCode];
            }
            else {
                return (this._map.get(charCode) || this._defaultValue);
            }
        }
        clear() {
            this._asciiMap.fill(this._defaultValue);
            this._map.clear();
        }
    }
    exports.CharacterClassifier = CharacterClassifier;
    var Boolean;
    (function (Boolean) {
        Boolean[Boolean["False"] = 0] = "False";
        Boolean[Boolean["True"] = 1] = "True";
    })(Boolean || (Boolean = {}));
    class CharacterSet {
        constructor() {
            this._actual = new CharacterClassifier(0 /* Boolean.False */);
        }
        add(charCode) {
            this._actual.set(charCode, 1 /* Boolean.True */);
        }
        has(charCode) {
            return (this._actual.get(charCode) === 1 /* Boolean.True */);
        }
        clear() {
            return this._actual.clear();
        }
    }
    exports.CharacterSet = CharacterSet;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcmFjdGVyQ2xhc3NpZmllci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb3JlL2NoYXJhY3RlckNsYXNzaWZpZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBSWhHOztPQUVHO0lBQ0gsTUFBYSxtQkFBbUI7UUFhL0IsWUFBWSxhQUFnQjtZQUMzQixNQUFNLFlBQVksR0FBRyxJQUFBLGNBQU8sRUFBQyxhQUFhLENBQUMsQ0FBQztZQUU1QyxJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztZQUNsQyxJQUFJLENBQUMsU0FBUyxHQUFHLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNuRSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1FBQ3ZDLENBQUM7UUFFTyxNQUFNLENBQUMsZUFBZSxDQUFDLFlBQW9CO1lBQ2xELE1BQU0sUUFBUSxHQUFHLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JDLFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDNUIsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUFnQixFQUFFLE1BQVM7WUFDckMsTUFBTSxLQUFLLEdBQUcsSUFBQSxjQUFPLEVBQUMsTUFBTSxDQUFDLENBQUM7WUFFOUIsSUFBSSxRQUFRLElBQUksQ0FBQyxJQUFJLFFBQVEsR0FBRyxHQUFHLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDbEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNoQyxDQUFDO1FBQ0YsQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUFnQjtZQUMxQixJQUFJLFFBQVEsSUFBSSxDQUFDLElBQUksUUFBUSxHQUFHLEdBQUcsRUFBRSxDQUFDO2dCQUNyQyxPQUFVLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDM0QsQ0FBQztRQUNGLENBQUM7UUFFTSxLQUFLO1lBQ1gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDbkIsQ0FBQztLQUNEO0lBakRELGtEQWlEQztJQUVELElBQVcsT0FHVjtJQUhELFdBQVcsT0FBTztRQUNqQix1Q0FBUyxDQUFBO1FBQ1QscUNBQVEsQ0FBQTtJQUNULENBQUMsRUFIVSxPQUFPLEtBQVAsT0FBTyxRQUdqQjtJQUVELE1BQWEsWUFBWTtRQUl4QjtZQUNDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxtQkFBbUIsdUJBQXdCLENBQUM7UUFDaEUsQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUFnQjtZQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLHVCQUFlLENBQUM7UUFDMUMsQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUFnQjtZQUMxQixPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLHlCQUFpQixDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVNLEtBQUs7WUFDWCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDN0IsQ0FBQztLQUNEO0lBbkJELG9DQW1CQyJ9