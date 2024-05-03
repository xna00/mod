/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/codicons", "vs/base/common/themables", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/cellPart"], function (require, exports, DOM, codicons_1, themables_1, nls_1, keybinding_1, notebookBrowser_1, cellPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollapsedCellOutput = void 0;
    const $ = DOM.$;
    let CollapsedCellOutput = class CollapsedCellOutput extends cellPart_1.CellContentPart {
        constructor(notebookEditor, cellOutputCollapseContainer, keybindingService) {
            super();
            this.notebookEditor = notebookEditor;
            const placeholder = DOM.append(cellOutputCollapseContainer, $('span.expandOutputPlaceholder'));
            placeholder.textContent = (0, nls_1.localize)('cellOutputsCollapsedMsg', "Outputs are collapsed");
            const expandIcon = DOM.append(cellOutputCollapseContainer, $('span.expandOutputIcon'));
            expandIcon.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.more));
            const keybinding = keybindingService.lookupKeybinding(notebookBrowser_1.EXPAND_CELL_OUTPUT_COMMAND_ID);
            if (keybinding) {
                placeholder.title = (0, nls_1.localize)('cellExpandOutputButtonLabelWithDoubleClick', "Double-click to expand cell output ({0})", keybinding.getLabel());
                cellOutputCollapseContainer.title = (0, nls_1.localize)('cellExpandOutputButtonLabel', "Expand Cell Output (${0})", keybinding.getLabel());
            }
            DOM.hide(cellOutputCollapseContainer);
            this._register(DOM.addDisposableListener(expandIcon, DOM.EventType.CLICK, () => this.expand()));
            this._register(DOM.addDisposableListener(cellOutputCollapseContainer, DOM.EventType.DBLCLICK, () => this.expand()));
        }
        expand() {
            if (!this.currentCell) {
                return;
            }
            if (!this.currentCell) {
                return;
            }
            const textModel = this.notebookEditor.textModel;
            const index = textModel.cells.indexOf(this.currentCell.model);
            if (index < 0) {
                return;
            }
            this.currentCell.isOutputCollapsed = !this.currentCell.isOutputCollapsed;
        }
    };
    exports.CollapsedCellOutput = CollapsedCellOutput;
    exports.CollapsedCellOutput = CollapsedCellOutput = __decorate([
        __param(2, keybinding_1.IKeybindingService)
    ], CollapsedCellOutput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGFwc2VkQ2VsbE91dHB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L2NlbGxQYXJ0cy9jb2xsYXBzZWRDZWxsT3V0cHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVVoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRVQsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSwwQkFBZTtRQUN2RCxZQUNrQixjQUErQixFQUNoRCwyQkFBd0MsRUFDcEIsaUJBQXFDO1lBRXpELEtBQUssRUFBRSxDQUFDO1lBSlMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBTWhELE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDLDhCQUE4QixDQUFDLENBQWdCLENBQUM7WUFDOUcsV0FBVyxDQUFDLFdBQVcsR0FBRyxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3ZGLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQztZQUN2RixVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLHFCQUFTLENBQUMsZ0JBQWdCLENBQUMsa0JBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRXRFLE1BQU0sVUFBVSxHQUFHLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLCtDQUE2QixDQUFDLENBQUM7WUFDckYsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDaEIsV0FBVyxDQUFDLEtBQUssR0FBRyxJQUFBLGNBQVEsRUFBQyw0Q0FBNEMsRUFBRSwwQ0FBMEMsRUFBRSxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDOUksMkJBQTJCLENBQUMsS0FBSyxHQUFHLElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLDJCQUEyQixFQUFFLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ2pJLENBQUM7WUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFFdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNySCxDQUFDO1FBRU8sTUFBTTtZQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdkIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVUsQ0FBQztZQUNqRCxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTlELElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNmLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUM7UUFDMUUsQ0FBQztLQUNELENBQUE7SUEzQ1ksa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFJN0IsV0FBQSwrQkFBa0IsQ0FBQTtPQUpSLG1CQUFtQixDQTJDL0IifQ==