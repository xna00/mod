/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/numbers"], function (require, exports, numbers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerCellToolbarStickyScroll = registerCellToolbarStickyScroll;
    function registerCellToolbarStickyScroll(notebookEditor, cell, element, opts) {
        const extraOffset = opts?.extraOffset ?? 0;
        const min = opts?.min ?? 0;
        const updateForScroll = () => {
            if (cell.isInputCollapsed) {
                element.style.top = '';
            }
            else {
                const scrollTop = notebookEditor.scrollTop;
                const elementTop = notebookEditor.getAbsoluteTopOfElement(cell);
                const diff = scrollTop - elementTop + extraOffset;
                const maxTop = cell.layoutInfo.editorHeight + cell.layoutInfo.statusBarHeight - 45; // subtract roughly the height of the execution order label plus padding
                const top = maxTop > 20 ? // Don't move the run button if it can only move a very short distance
                    (0, numbers_1.clamp)(min, diff, maxTop) :
                    min;
                element.style.top = `${top}px`;
            }
        };
        updateForScroll();
        return notebookEditor.onDidScroll(() => updateForScroll());
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbFRvb2xiYXJTdGlja3lTY3JvbGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlldy9jZWxsUGFydHMvY2VsbFRvb2xiYXJTdGlja3lTY3JvbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsMEVBcUJDO0lBckJELFNBQWdCLCtCQUErQixDQUFDLGNBQStCLEVBQUUsSUFBb0IsRUFBRSxPQUFvQixFQUFFLElBQTZDO1FBQ3pLLE1BQU0sV0FBVyxHQUFHLElBQUksRUFBRSxXQUFXLElBQUksQ0FBQyxDQUFDO1FBQzNDLE1BQU0sR0FBRyxHQUFHLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBRTNCLE1BQU0sZUFBZSxHQUFHLEdBQUcsRUFBRTtZQUM1QixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUMzQixPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7WUFDeEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sU0FBUyxHQUFHLGNBQWMsQ0FBQyxTQUFTLENBQUM7Z0JBQzNDLE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEUsTUFBTSxJQUFJLEdBQUcsU0FBUyxHQUFHLFVBQVUsR0FBRyxXQUFXLENBQUM7Z0JBQ2xELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQyxDQUFDLHdFQUF3RTtnQkFDNUosTUFBTSxHQUFHLEdBQUcsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsc0VBQXNFO29CQUMvRixJQUFBLGVBQUssRUFBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQzFCLEdBQUcsQ0FBQztnQkFDTCxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO1lBQ2hDLENBQUM7UUFDRixDQUFDLENBQUM7UUFFRixlQUFlLEVBQUUsQ0FBQztRQUNsQixPQUFPLGNBQWMsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztJQUM1RCxDQUFDIn0=