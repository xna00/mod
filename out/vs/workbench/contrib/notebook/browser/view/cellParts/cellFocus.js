/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/workbench/contrib/notebook/browser/view/cellPart"], function (require, exports, DOM, cellPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellFocusPart = void 0;
    class CellFocusPart extends cellPart_1.CellContentPart {
        constructor(containerElement, focusSinkElement, notebookEditor) {
            super();
            this._register(DOM.addDisposableListener(containerElement, DOM.EventType.FOCUS, () => {
                if (this.currentCell) {
                    notebookEditor.focusElement(this.currentCell);
                }
            }, true));
            if (focusSinkElement) {
                this._register(DOM.addDisposableListener(focusSinkElement, DOM.EventType.FOCUS, () => {
                    if (this.currentCell && this.currentCell.outputsViewModels.length) {
                        notebookEditor.focusNotebookCell(this.currentCell, 'output');
                    }
                }));
            }
        }
    }
    exports.CellFocusPart = CellFocusPart;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbEZvY3VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnRzL2NlbGxGb2N1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSxhQUFjLFNBQVEsMEJBQWU7UUFDakQsWUFDQyxnQkFBNkIsRUFDN0IsZ0JBQXlDLEVBQ3pDLGNBQStCO1lBRS9CLEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO2dCQUNwRixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDdEIsY0FBYyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQy9DLENBQUM7WUFDRixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUVWLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO29CQUNwRixJQUFJLElBQUksQ0FBQyxXQUFXLElBQUssSUFBSSxDQUFDLFdBQWlDLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQzFGLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUM5RCxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBdEJELHNDQXNCQyJ9