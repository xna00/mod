/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ctxAllCollapsed = exports.ctxSortMode = exports.ctxFilterOnType = exports.ctxFollowsCursor = exports.IOutlinePane = exports.OutlineSortOrder = void 0;
    var OutlineSortOrder;
    (function (OutlineSortOrder) {
        OutlineSortOrder[OutlineSortOrder["ByPosition"] = 0] = "ByPosition";
        OutlineSortOrder[OutlineSortOrder["ByName"] = 1] = "ByName";
        OutlineSortOrder[OutlineSortOrder["ByKind"] = 2] = "ByKind";
    })(OutlineSortOrder || (exports.OutlineSortOrder = OutlineSortOrder = {}));
    var IOutlinePane;
    (function (IOutlinePane) {
        IOutlinePane.Id = 'outline';
    })(IOutlinePane || (exports.IOutlinePane = IOutlinePane = {}));
    // --- context keys
    exports.ctxFollowsCursor = new contextkey_1.RawContextKey('outlineFollowsCursor', false);
    exports.ctxFilterOnType = new contextkey_1.RawContextKey('outlineFiltersOnType', false);
    exports.ctxSortMode = new contextkey_1.RawContextKey('outlineSortMode', 0 /* OutlineSortOrder.ByPosition */);
    exports.ctxAllCollapsed = new contextkey_1.RawContextKey('outlineAllCollapsed', false);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvb3V0bGluZS9icm93c2VyL291dGxpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLElBQWtCLGdCQUlqQjtJQUpELFdBQWtCLGdCQUFnQjtRQUNqQyxtRUFBVSxDQUFBO1FBQ1YsMkRBQU0sQ0FBQTtRQUNOLDJEQUFNLENBQUE7SUFDUCxDQUFDLEVBSmlCLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBSWpDO0lBUUQsSUFBaUIsWUFBWSxDQUU1QjtJQUZELFdBQWlCLFlBQVk7UUFDZixlQUFFLEdBQUcsU0FBUyxDQUFDO0lBQzdCLENBQUMsRUFGZ0IsWUFBWSw0QkFBWixZQUFZLFFBRTVCO0lBUUQsbUJBQW1CO0lBRU4sUUFBQSxnQkFBZ0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDN0UsUUFBQSxlQUFlLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHNCQUFzQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzVFLFFBQUEsV0FBVyxHQUFHLElBQUksMEJBQWEsQ0FBbUIsaUJBQWlCLHNDQUE4QixDQUFDO0lBQ2xHLFFBQUEsZUFBZSxHQUFHLElBQUksMEJBQWEsQ0FBVSxxQkFBcUIsRUFBRSxLQUFLLENBQUMsQ0FBQyJ9