/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UndoRedoSource = exports.UndoRedoGroup = exports.ResourceEditStackSnapshot = exports.UndoRedoElementType = exports.IUndoRedoService = void 0;
    exports.IUndoRedoService = (0, instantiation_1.createDecorator)('undoRedoService');
    var UndoRedoElementType;
    (function (UndoRedoElementType) {
        UndoRedoElementType[UndoRedoElementType["Resource"] = 0] = "Resource";
        UndoRedoElementType[UndoRedoElementType["Workspace"] = 1] = "Workspace";
    })(UndoRedoElementType || (exports.UndoRedoElementType = UndoRedoElementType = {}));
    class ResourceEditStackSnapshot {
        constructor(resource, elements) {
            this.resource = resource;
            this.elements = elements;
        }
    }
    exports.ResourceEditStackSnapshot = ResourceEditStackSnapshot;
    class UndoRedoGroup {
        static { this._ID = 0; }
        constructor() {
            this.id = UndoRedoGroup._ID++;
            this.order = 1;
        }
        nextOrder() {
            if (this.id === 0) {
                return 0;
            }
            return this.order++;
        }
        static { this.None = new UndoRedoGroup(); }
    }
    exports.UndoRedoGroup = UndoRedoGroup;
    class UndoRedoSource {
        static { this._ID = 0; }
        constructor() {
            this.id = UndoRedoSource._ID++;
            this.order = 1;
        }
        nextOrder() {
            if (this.id === 0) {
                return 0;
            }
            return this.order++;
        }
        static { this.None = new UndoRedoSource(); }
    }
    exports.UndoRedoSource = UndoRedoSource;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5kb1JlZG8uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VuZG9SZWRvL2NvbW1vbi91bmRvUmVkby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNbkYsUUFBQSxnQkFBZ0IsR0FBRyxJQUFBLCtCQUFlLEVBQW1CLGlCQUFpQixDQUFDLENBQUM7SUFFckYsSUFBa0IsbUJBR2pCO0lBSEQsV0FBa0IsbUJBQW1CO1FBQ3BDLHFFQUFRLENBQUE7UUFDUix1RUFBUyxDQUFBO0lBQ1YsQ0FBQyxFQUhpQixtQkFBbUIsbUNBQW5CLG1CQUFtQixRQUdwQztJQXFFRCxNQUFhLHlCQUF5QjtRQUNyQyxZQUNpQixRQUFhLEVBQ2IsUUFBa0I7WUFEbEIsYUFBUSxHQUFSLFFBQVEsQ0FBSztZQUNiLGFBQVEsR0FBUixRQUFRLENBQVU7UUFDL0IsQ0FBQztLQUNMO0lBTEQsOERBS0M7SUFFRCxNQUFhLGFBQWE7aUJBQ1YsUUFBRyxHQUFHLENBQUMsQ0FBQztRQUt2QjtZQUNDLElBQUksQ0FBQyxFQUFFLEdBQUcsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLENBQUM7UUFFTSxTQUFTO1lBQ2YsSUFBSSxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNuQixPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDO2lCQUVhLFNBQUksR0FBRyxJQUFJLGFBQWEsRUFBRSxDQUFDOztJQWxCMUMsc0NBbUJDO0lBRUQsTUFBYSxjQUFjO2lCQUNYLFFBQUcsR0FBRyxDQUFDLENBQUM7UUFLdkI7WUFDQyxJQUFJLENBQUMsRUFBRSxHQUFHLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNoQixDQUFDO1FBRU0sU0FBUztZQUNmLElBQUksSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbkIsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsQ0FBQztpQkFFYSxTQUFJLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQzs7SUFsQjNDLHdDQW1CQyJ9