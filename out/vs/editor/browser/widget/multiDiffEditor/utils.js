/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions"], function (require, exports, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActionRunnerWithContext = void 0;
    class ActionRunnerWithContext extends actions_1.ActionRunner {
        constructor(_getContext) {
            super();
            this._getContext = _getContext;
        }
        runAction(action, _context) {
            const ctx = this._getContext();
            return super.runAction(action, ctx);
        }
    }
    exports.ActionRunnerWithContext = ActionRunnerWithContext;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9tdWx0aURpZmZFZGl0b3IvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBSWhHLE1BQWEsdUJBQXdCLFNBQVEsc0JBQVk7UUFDeEQsWUFBNkIsV0FBMEI7WUFDdEQsS0FBSyxFQUFFLENBQUM7WUFEb0IsZ0JBQVcsR0FBWCxXQUFXLENBQWU7UUFFdkQsQ0FBQztRQUVrQixTQUFTLENBQUMsTUFBZSxFQUFFLFFBQWtCO1lBQy9ELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMvQixPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7S0FDRDtJQVRELDBEQVNDIn0=