/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HierarchicalKind = void 0;
    class HierarchicalKind {
        static { this.sep = '.'; }
        static { this.None = new HierarchicalKind('@@none@@'); } // Special kind that matches nothing
        static { this.Empty = new HierarchicalKind(''); }
        constructor(value) {
            this.value = value;
        }
        equals(other) {
            return this.value === other.value;
        }
        contains(other) {
            return this.equals(other) || this.value === '' || other.value.startsWith(this.value + HierarchicalKind.sep);
        }
        intersects(other) {
            return this.contains(other) || other.contains(this);
        }
        append(...parts) {
            return new HierarchicalKind((this.value ? [this.value, ...parts] : parts).join(HierarchicalKind.sep));
        }
    }
    exports.HierarchicalKind = HierarchicalKind;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGllcmFyY2hpY2FsS2luZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vaGllcmFyY2hpY2FsS2luZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFFaEcsTUFBYSxnQkFBZ0I7aUJBQ0wsUUFBRyxHQUFHLEdBQUcsQ0FBQztpQkFFVixTQUFJLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFDLG9DQUFvQztpQkFDN0UsVUFBSyxHQUFHLElBQUksZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFeEQsWUFDaUIsS0FBYTtZQUFiLFVBQUssR0FBTCxLQUFLLENBQVE7UUFDMUIsQ0FBQztRQUVFLE1BQU0sQ0FBQyxLQUF1QjtZQUNwQyxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLEtBQUssQ0FBQztRQUNuQyxDQUFDO1FBRU0sUUFBUSxDQUFDLEtBQXVCO1lBQ3RDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdHLENBQUM7UUFFTSxVQUFVLENBQUMsS0FBdUI7WUFDeEMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVNLE1BQU0sQ0FBQyxHQUFHLEtBQWU7WUFDL0IsT0FBTyxJQUFJLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3ZHLENBQUM7O0lBeEJGLDRDQXlCQyJ9