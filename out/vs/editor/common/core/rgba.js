/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RGBA8 = void 0;
    /**
     * A very VM friendly rgba datastructure.
     * Please don't touch unless you take a look at the IR.
     */
    class RGBA8 {
        static { this.Empty = new RGBA8(0, 0, 0, 0); }
        constructor(r, g, b, a) {
            this._rgba8Brand = undefined;
            this.r = RGBA8._clamp(r);
            this.g = RGBA8._clamp(g);
            this.b = RGBA8._clamp(b);
            this.a = RGBA8._clamp(a);
        }
        equals(other) {
            return (this.r === other.r
                && this.g === other.g
                && this.b === other.b
                && this.a === other.a);
        }
        static _clamp(c) {
            if (c < 0) {
                return 0;
            }
            if (c > 255) {
                return 255;
            }
            return c | 0;
        }
    }
    exports.RGBA8 = RGBA8;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmdiYS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb3JlL3JnYmEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBRWhHOzs7T0FHRztJQUNILE1BQWEsS0FBSztpQkFHRCxVQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEFBQXhCLENBQXlCO1FBbUI5QyxZQUFZLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQVM7WUFyQnRELGdCQUFXLEdBQVMsU0FBUyxDQUFDO1lBc0I3QixJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QixJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUVNLE1BQU0sQ0FBQyxLQUFZO1lBQ3pCLE9BQU8sQ0FDTixJQUFJLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDO21CQUNmLElBQUksQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUM7bUJBQ2xCLElBQUksQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUM7bUJBQ2xCLElBQUksQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FDckIsQ0FBQztRQUNILENBQUM7UUFFTSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQVM7WUFDN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBQ0QsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxHQUFHLENBQUM7WUFDWixDQUFDO1lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsQ0FBQzs7SUE5Q0Ysc0JBK0NDIn0=