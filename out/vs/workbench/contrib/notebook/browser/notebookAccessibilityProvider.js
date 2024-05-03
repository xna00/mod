/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/nls", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, event_1, lifecycle_1, observable_1, nls, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookAccessibilityProvider = void 0;
    class NotebookAccessibilityProvider extends lifecycle_1.Disposable {
        constructor(notebookExecutionStateService, viewModel, keybindingService, configurationService) {
            super();
            this.notebookExecutionStateService = notebookExecutionStateService;
            this.viewModel = viewModel;
            this.keybindingService = keybindingService;
            this.configurationService = configurationService;
            this._onDidAriaLabelChange = new event_1.Emitter();
            this.onDidAriaLabelChange = this._onDidAriaLabelChange.event;
            this._register(event_1.Event.debounce(this.notebookExecutionStateService.onDidChangeExecution, (last, e) => this.mergeEvents(last, e), 100)((cellHandles) => {
                const viewModel = this.viewModel();
                if (viewModel) {
                    for (const handle of cellHandles) {
                        const cellModel = viewModel.getCellByHandle(handle);
                        if (cellModel) {
                            this._onDidAriaLabelChange.fire(cellModel);
                        }
                    }
                }
            }, this));
        }
        getAriaLabel(element) {
            const event = event_1.Event.filter(this.onDidAriaLabelChange, e => e === element);
            return (0, observable_1.observableFromEvent)(event, () => {
                const viewModel = this.viewModel();
                if (!viewModel) {
                    return '';
                }
                const index = viewModel.getCellIndex(element);
                if (index >= 0) {
                    return this.getLabel(index, element);
                }
                return '';
            });
        }
        getLabel(index, element) {
            const executionState = this.notebookExecutionStateService.getCellExecution(element.uri)?.state;
            const executionLabel = executionState === notebookCommon_1.NotebookCellExecutionState.Executing
                ? ', executing'
                : executionState === notebookCommon_1.NotebookCellExecutionState.Pending
                    ? ', pending'
                    : '';
            return `Cell ${index}, ${element.cellKind === notebookCommon_1.CellKind.Markup ? 'markdown' : 'code'} cell${executionLabel}`;
        }
        getWidgetAriaLabel() {
            const keybinding = this.keybindingService.lookupKeybinding("editor.action.accessibilityHelp" /* AccessibilityCommandId.OpenAccessibilityHelp */)?.getLabel();
            if (this.configurationService.getValue("accessibility.verbosity.notebook" /* AccessibilityVerbositySettingId.Notebook */)) {
                return keybinding
                    ? nls.localize('notebookTreeAriaLabelHelp', "Notebook\nUse {0} for accessibility help", keybinding)
                    : nls.localize('notebookTreeAriaLabelHelpNoKb', "Notebook\nRun the Open Accessibility Help command for more information", keybinding);
            }
            return nls.localize('notebookTreeAriaLabel', "Notebook");
        }
        mergeEvents(last, e) {
            const viewModel = this.viewModel();
            const result = last || [];
            if (viewModel && e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && e.affectsNotebook(viewModel.uri)) {
                if (result.indexOf(e.cellHandle) < 0) {
                    result.push(e.cellHandle);
                }
            }
            return result;
        }
    }
    exports.NotebookAccessibilityProvider = NotebookAccessibilityProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tBY2Nlc3NpYmlsaXR5UHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvbm90ZWJvb2tBY2Nlc3NpYmlsaXR5UHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLE1BQWEsNkJBQThCLFNBQVEsc0JBQVU7UUFJNUQsWUFDa0IsNkJBQTZELEVBQzdELFNBQThDLEVBQzlDLGlCQUFxQyxFQUNyQyxvQkFBMkM7WUFFNUQsS0FBSyxFQUFFLENBQUM7WUFMUyxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWdDO1lBQzdELGNBQVMsR0FBVCxTQUFTLENBQXFDO1lBQzlDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDckMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQVA1QywwQkFBcUIsR0FBRyxJQUFJLGVBQU8sRUFBaUIsQ0FBQztZQUNyRCx5QkFBb0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBU3hFLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLFFBQVEsQ0FDNUIsSUFBSSxDQUFDLDZCQUE2QixDQUFDLG9CQUFvQixFQUN2RCxDQUFDLElBQTBCLEVBQUUsQ0FBZ0UsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQzNILEdBQUcsQ0FDSCxDQUFDLENBQUMsV0FBcUIsRUFBRSxFQUFFO2dCQUMzQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ25DLElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ2YsS0FBSyxNQUFNLE1BQU0sSUFBSSxXQUFXLEVBQUUsQ0FBQzt3QkFDbEMsTUFBTSxT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