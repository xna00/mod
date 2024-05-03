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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/lifecycle", "vs/nls", "vs/base/common/themables", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, DOM, iconLabels_1, lifecycle_1, nls_1, themables_1, notebookIcons_1, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollapsedCodeCellExecutionIcon = void 0;
    let CollapsedCodeCellExecutionIcon = class CollapsedCodeCellExecutionIcon extends lifecycle_1.Disposable {
        constructor(_notebookEditor, _cell, _element, _executionStateService) {
            super();
            this._cell = _cell;
            this._element = _element;
            this._executionStateService = _executionStateService;
            this._visible = false;
            this._update();
            this._register(this._executionStateService.onDidChangeExecution(e => {
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && e.affectsCell(this._cell.uri)) {
                    this._update();
                }
            }));
            this._register(this._cell.model.onDidChangeInternalMetadata(() => this._update()));
        }
        setVisibility(visible) {
            this._visible = visible;
            this._update();
        }
        _update() {
            if (!this._visible) {
                return;
            }
            const runState = this._executionStateService.getCellExecution(this._cell.uri);
            const item = this._getItemForState(runState, this._cell.model.internalMetadata);
            if (item) {
                this._element.style.display = '';
                DOM.reset(this._element, ...(0, iconLabels_1.renderLabelWithIcons)(item.text));
                this._element.title = item.tooltip ?? '';
            }
            else {
                this._element.style.display = 'none';
                DOM.reset(this._element);
            }
        }
        _getItemForState(runState, internalMetadata) {
            const state = runState?.state;
            const { lastRunSuccess } = internalMetadata;
            if (!state && lastRunSuccess) {
                return {
                    text: `$(${notebookIcons_1.successStateIcon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.success', "Success"),
                };
            }
            else if (!state && lastRunSuccess === false) {
                return {
                    text: `$(${notebookIcons_1.errorStateIcon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.failure', "Failure"),
                };
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Pending || state === notebookCommon_1.NotebookCellExecutionState.Unconfirmed) {
                return {
                    text: `$(${notebookIcons_1.pendingStateIcon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.pending', "Pending"),
                };
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                const icon = themables_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin');
                return {
                    text: `$(${icon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.executing', "Executing"),
                };
            }
            return;
        }
    };
    exports.CollapsedCodeCellExecutionIcon = CollapsedCodeCellExecutionIcon;
    exports.CollapsedCodeCellExecutionIcon = CollapsedCodeCellExecutionIcon = __decorate([
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], CollapsedCodeCellExecutionIcon);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUNlbGxFeGVjdXRpb25JY29uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnRzL2NvZGVDZWxsRXhlY3V0aW9uSWNvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQnpGLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQStCLFNBQVEsc0JBQVU7UUFHN0QsWUFDQyxlQUF3QyxFQUN2QixLQUFxQixFQUNyQixRQUFxQixFQUNOLHNCQUE4RDtZQUU5RixLQUFLLEVBQUUsQ0FBQztZQUpTLFVBQUssR0FBTCxLQUFLLENBQWdCO1lBQ3JCLGFBQVEsR0FBUixRQUFRLENBQWE7WUFDRSwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQWdDO1lBTnZGLGFBQVEsR0FBRyxLQUFLLENBQUM7WUFVeEIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25FLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxxREFBcUIsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzVFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDaEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLDJCQUEyQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFD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