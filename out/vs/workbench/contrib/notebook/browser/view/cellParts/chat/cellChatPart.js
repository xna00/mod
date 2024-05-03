/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/browser/view/cellPart"], function (require, exports, cellPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellChatPart = void 0;
    class CellChatPart extends cellPart_1.CellContentPart {
        // private _controller: NotebookCellChatController | undefined;
        get activeCell() {
            return this.currentCell;
        }
        constructor(_notebookEditor, _partContainer) {
            super();
        }
        didRenderCell(element) {
            super.didRenderCell(element);
        }
        unrenderCell(element) {
            super.unrenderCell(element);
        }
        updateInternalLayoutNow(element) {
        }
        dispose() {
            super.dispose();
        }
    }
    exports.CellChatPart = CellChatPart;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbENoYXRQYXJ0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnRzL2NoYXQvY2VsbENoYXRQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRyxNQUFhLFlBQWEsU0FBUSwwQkFBZTtRQUNoRCwrREFBK0Q7UUFFL0QsSUFBSSxVQUFVO1lBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxZQUNDLGVBQXdDLEVBQ3hDLGNBQTJCO1lBRTNCLEtBQUssRUFBRSxDQUFDO1FBQ1QsQ0FBQztRQUVRLGFBQWEsQ0FBQyxPQUF1QjtZQUM3QyxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFUSxZQUFZLENBQUMsT0FBdUI7WUFDNUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBRVEsdUJBQXVCLENBQUMsT0FBdUI7UUFDeEQsQ0FBQztRQUVRLE9BQU87WUFDZixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztLQUNEO0lBNUJELG9DQTRCQyJ9