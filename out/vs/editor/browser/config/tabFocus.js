/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabFocus = void 0;
    class TabFocusImpl {
        constructor() {
            this._tabFocus = false;
            this._onDidChangeTabFocus = new event_1.Emitter();
            this.onDidChangeTabFocus = this._onDidChangeTabFocus.event;
        }
        getTabFocusMode() {
            return this._tabFocus;
        }
        setTabFocusMode(tabFocusMode) {
            this._tabFocus = tabFocusMode;
            this._onDidChangeTabFocus.fire(this._tabFocus);
        }
    }
    /**
     * Control what pressing Tab does.
     * If it is false, pressing Tab or Shift-Tab will be handled by the editor.
     * If it is true, pressing Tab or Shift-Tab will move the browser focus.
     * Defaults to false.
     */
    exports.TabFocus = new TabFocusImpl();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFiRm9jdXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL2NvbmZpZy90YWJGb2N1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsTUFBTSxZQUFZO1FBQWxCO1lBQ1MsY0FBUyxHQUFZLEtBQUssQ0FBQztZQUNsQix5QkFBb0IsR0FBRyxJQUFJLGVBQU8sRUFBVyxDQUFDO1lBQy9DLHdCQUFtQixHQUFtQixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1FBVXZGLENBQUM7UUFSTyxlQUFlO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUN2QixDQUFDO1FBRU0sZUFBZSxDQUFDLFlBQXFCO1lBQzNDLElBQUksQ0FBQyxTQUFTLEdBQUcsWUFBWSxDQUFDO1lBQzlCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7S0FDRDtJQUVEOzs7OztPQUtHO0lBQ1UsUUFBQSxRQUFRLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQyJ9