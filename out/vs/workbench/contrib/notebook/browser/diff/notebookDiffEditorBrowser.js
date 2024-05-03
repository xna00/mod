/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NOTEBOOK_DIFF_CELL_PROPERTY_EXPANDED = exports.NOTEBOOK_DIFF_CELL_PROPERTY = exports.NOTEBOOK_DIFF_CELL_INPUT = exports.DIFF_CELL_MARGIN = exports.DiffSide = void 0;
    var DiffSide;
    (function (DiffSide) {
        DiffSide[DiffSide["Original"] = 0] = "Original";
        DiffSide[DiffSide["Modified"] = 1] = "Modified";
    })(DiffSide || (exports.DiffSide = DiffSide = {}));
    exports.DIFF_CELL_MARGIN = 16;
    exports.NOTEBOOK_DIFF_CELL_INPUT = new contextkey_1.RawContextKey('notebookDiffCellInputChanged', false);
    exports.NOTEBOOK_DIFF_CELL_PROPERTY = new contextkey_1.RawContextKey('notebookDiffCellPropertyChanged', false);
    exports.NOTEBOOK_DIFF_CELL_PROPERTY_EXPANDED = new contextkey_1.RawContextKey('notebookDiffCellPropertyExpanded', false);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tEaWZmRWRpdG9yQnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9kaWZmL25vdGVib29rRGlmZkVkaXRvckJyb3dzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0JoRyxJQUFZLFFBR1g7SUFIRCxXQUFZLFFBQVE7UUFDbkIsK0NBQVksQ0FBQTtRQUNaLCtDQUFZLENBQUE7SUFDYixDQUFDLEVBSFcsUUFBUSx3QkFBUixRQUFRLFFBR25CO0lBb0dZLFFBQUEsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLFFBQUEsd0JBQXdCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDhCQUE4QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzdGLFFBQUEsMkJBQTJCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGlDQUFpQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ25HLFFBQUEsb0NBQW9DLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGtDQUFrQyxFQUFFLEtBQUssQ0FBQyxDQUFDIn0=