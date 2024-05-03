/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/workbench/contrib/notebook/browser/view/cellPart"], function (require, exports, DOM, cellPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollapsedCellInput = void 0;
    class CollapsedCellInput extends cellPart_1.CellContentPart {
        constructor(notebookEditor, cellInputCollapsedContainer) {
            super();
            this.notebookEditor = notebookEditor;
            this._register(DOM.addDisposableListener(cellInputCollapsedContainer, DOM.EventType.DBLCLICK, e => {
                if (!this.currentCell || !this.notebookEditor.hasModel()) {
                    return;
                }
                if (this.currentCell.isInputCollapsed) {
                    this.currentCell.isInputCollapsed = false;
                }
                else {
                    this.currentCell.isOutputCollapsed = false;
                }
            }));
            this._register(DOM.addDisposableListener(cellInputCollapsedContainer, DOM.EventType.CLICK, e => {
                if (!this.currentCell || !this.notebookEditor.hasModel()) {
                    return;
                }
                const element = e.target;
                if (element && element.classList && element.classList.contains('expandInputIcon')) {
                    // clicked on the expand icon
                    this.currentCell.isInputCollapsed = false;
                }
            }));
        }
    }
    exports.CollapsedCellInput = CollapsedCellInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGFwc2VkQ2VsbElucHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnRzL2NvbGxhcHNlZENlbGxJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxrQkFBbUIsU0FBUSwwQkFBZTtRQUN0RCxZQUNrQixjQUErQixFQUNoRCwyQkFBd0M7WUFFeEMsS0FBSyxFQUFFLENBQUM7WUFIUyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFLaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2pHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO29CQUMxRCxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO2dCQUMzQyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7Z0JBQzVDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQzlGLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO29CQUMxRCxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLE1BQXFCLENBQUM7Z0JBRXhDLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDO29CQUNuRiw2QkFBNkI7b0JBQzdCLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO2dCQUMzQyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRDtJQWhDRCxnREFnQ0MifQ==