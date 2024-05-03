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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/network", "vs/editor/common/services/languageFeatures", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/browser/contrib/navigation/arrow", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/controller/editActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/statusbar/browser/statusbar"], function (require, exports, nls, lifecycle_1, network_1, languageFeatures_1, configuration_1, instantiation_1, log_1, platform_1, contributions_1, arrow_1, coreActions_1, editActions_1, notebookBrowser_1, notebookCommon_1, notebookKernelService_1, editorService_1, statusbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookIndentationStatus = exports.ActiveCellStatus = exports.KernelStatus = void 0;
    let ImplictKernelSelector = class ImplictKernelSelector {
        constructor(notebook, suggested, notebookKernelService, languageFeaturesService, logService) {
            const disposables = new lifecycle_1.DisposableStore();
            this.dispose = disposables.dispose.bind(disposables);
            const selectKernel = () => {
                disposables.clear();
                notebookKernelService.selectKernelForNotebook(suggested, notebook);
            };
            // IMPLICITLY select a suggested kernel when the notebook has been changed
            // e.g change cell source, move cells, etc
            disposables.add(notebook.onDidChangeContent(e => {
                for (const event of e.rawEvents) {
                    switch (event.kind) {
                        case notebookCommon_1.NotebookCellsChangeType.ChangeCellContent:
                        case notebookCommon_1.NotebookCellsChangeType.ModelChange:
                        case notebookCommon_1.NotebookCellsChangeType.Move:
                        case notebookCommon_1.NotebookCellsChangeType.ChangeCellLanguage:
                            logService.trace('IMPLICIT kernel selection because of change event', event.kind);
                            selectKernel();
                            break;
                    }
                }
            }));
            // IMPLICITLY select a suggested kernel when users start to hover. This should
            // be a strong enough hint that the user wants to interact with the notebook. Maybe
            // add more triggers like goto-providers or completion-providers
            disposables.add(languageFeaturesService.hoverProvider.register({ scheme: network_1.Schemas.vscodeNotebookCell, pattern: notebook.uri.path }, {
                provideHover() {
                    logService.trace('IMPLICIT kernel selection because of hover');
                    selectKernel();
                    return undefined;
                }
            }));
        }
    };
    ImplictKernelSelector = __decorate([
        __param(2, notebookKernelService_1.INotebookKernelService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, log_1.ILogService)
    ], ImplictKernelSelector);
    let KernelStatus = class KernelStatus extends lifecycle_1.Disposable {
        constructor(_editorService, _statusbarService, _notebookKernelService, _instantiationService) {
            super();
            this._editorService = _editorService;
            this._statusbarService = _statusbarService;
            this._notebookKernelService = _notebookKernelService;
            this._instantiationService = _instantiationService;
            this._editorDisposables = this._register(new lifecycle_1.DisposableStore());
            this._kernelInfoElement = this._register(new lifecycle_1.DisposableStore());
            this._register(this._editorService.onDidActiveEditorChange(() => this._updateStatusbar()));
        }
        _updateStatusbar() {
            this._editorDisposables.clear();
            const activeEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            if (!activeEditor) {
                // not a notebook -> clean-up, done
                this._kernelInfoElement.clear();
                return;
            }
            const updateStatus = () => {
                if (activeEditor.notebookOptions.getDisplayOptions().globalToolbar) {
                    // kernel info rendered in the notebook toolbar already
                    this._kernelInfoElement.clear();
                    return;
                }
                const notebook = activeEditor.textModel;
                if (notebook) {
                    this._showKernelStatus(notebook);
                }
                else {
                    this._kernelInfoElement.clear();
                }
            };
            this._editorDisposables.add(this._notebookKernelService.onDidAddKernel(updateStatus));
            this._editorDisposables.add(this._notebookKernelService.onDidChangeSelectedNotebooks(updateStatus));
            this._editorDisposables.add(this._notebookKernelService.onDidChangeNotebookAffinity(updateStatus));
            this._editorDisposables.add(activeEditor.onDidChangeModel(updateStatus));
            this._editorDisposables.add(activeEditor.notebookOptions.onDidChangeOptions(updateStatus));
            updateStatus();
        }
        _showKernelStatus(notebook) {
            this._kernelInfoElement.clear();
            const { selected, suggestions, all } = this._notebookKernelService.getMatchingKernel(notebook);
            const suggested = (suggestions.length === 1 ? suggestions[0] : undefined)
                ?? (all.length === 1) ? all[0] : undefined;
            let isSuggested = false;
            if (all.length === 0) {
                // no kernel -> no status
                return;
            }
            else if (selected || suggested) {
                // selected or single kernel
                let kernel = selected;
                if (!kernel) {
                    // proceed with suggested kernel - show UI and install handler that selects the kernel
                    // when non trivial interactions with the notebook happen.
                    kernel = suggested;
                    isSuggested = true;
                    this._kernelInfoElement.add(this._instantiationService.createInstance(ImplictKernelSelector, notebook, kernel));
                }
                const tooltip = kernel.description ?? kernel.detail ?? kernel.label;
                this._kernelInfoElement.add(this._statusbarService.addEntry({
                    name: nls.localize('notebook.info', "Notebook Kernel Info"),
                    text: `$(notebook-kernel-select) ${kernel.label}`,
                    ariaLabel: kernel.label,
                    tooltip: isSuggested ? nls.localize('tooltop', "{0} (suggestion)", tooltip) : tooltip,
                    command: coreActions_1.SELECT_KERNEL_ID,
                }, coreActions_1.SELECT_KERNEL_ID, 1 /* StatusbarAlignment.RIGHT */, 10));
                this._kernelInfoElement.add(kernel.onDidChange(() => this._showKernelStatus(notebook)));
            }
            else {
                // multiple kernels -> show selection hint
                this._kernelInfoElement.add(this._statusbarService.addEntry({
                    name: nls.localize('notebook.select', "Notebook Kernel Selection"),
                    text: nls.localize('kernel.select.label', "Select Kernel"),
                    ariaLabel: nls.localize('kernel.select.label', "Select Kernel"),
                    command: coreActions_1.SELECT_KERNEL_ID,
                    kind: 'prominent'
                }, coreActions_1.SELECT_KERNEL_ID, 1 /* StatusbarAlignment.RIGHT */, 10));
            }
        }
    };
    exports.KernelStatus = KernelStatus;
    exports.KernelStatus = KernelStatus = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, notebookKernelService_1.INotebookKernelService),
        __param(3, instantiation_1.IInstantiationService)
    ], KernelStatus);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(KernelStatus, 3 /* LifecyclePhase.Restored */);
    let ActiveCellStatus = class ActiveCellStatus extends lifecycle_1.Disposable {
        constructor(_editorService, _statusbarService) {
            super();
            this._editorService = _editorService;
            this._statusbarService = _statusbarService;
            this._itemDisposables = this._register(new lifecycle_1.DisposableStore());
            this._accessor = this._register(new lifecycle_1.MutableDisposable());
            this._register(this._editorService.onDidActiveEditorChange(() => this._update()));
        }
        _update() {
            this._itemDisposables.clear();
            const activeEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            if (activeEditor) {
                this._itemDisposables.add(activeEditor.onDidChangeSelection(() => this._show(activeEditor)));
                this._itemDisposables.add(activeEditor.onDidChangeActiveCell(() => this._show(activeEditor)));
                this._show(activeEditor);
            }
            else {
                this._accessor.clear();
            }
        }
        _show(editor) {
            if (!editor.hasModel()) {
                this._accessor.clear();
                return;
            }
            const newText = this._getSelectionsText(editor);
            if (!newText) {
                this._accessor.clear();
                return;
            }
            const entry = {
                name: nls.localize('notebook.activeCellStatusName', "Notebook Editor Selections"),
                text: newText,
                ariaLabel: newText,
                command: arrow_1.CENTER_ACTIVE_CELL
            };
            if (!this._accessor.value) {
                this._accessor.value = this._statusbarService.addEntry(entry, 'notebook.activeCellStatus', 1 /* StatusbarAlignment.RIGHT */, 100);
            }
            else {
                this._accessor.value.update(entry);
            }
        }
        _getSelectionsText(editor) {
            if (!editor.hasModel()) {
                return undefined;
            }
            const activeCell = editor.getActiveCell();
            if (!activeCell) {
                return undefined;
            }
            const idxFocused = editor.getCellIndex(activeCell) + 1;
            const numSelected = editor.getSelections().reduce((prev, range) => prev + (range.end - range.start), 0);
            const totalCells = editor.getLength();
            return numSelected > 1 ?
                nls.localize('notebook.multiActiveCellIndicator', "Cell {0} ({1} selected)", idxFocused, numSelected) :
                nls.localize('notebook.singleActiveCellIndicator', "Cell {0} of {1}", idxFocused, totalCells);
        }
    };
    exports.ActiveCellStatus = ActiveCellStatus;
    exports.ActiveCellStatus = ActiveCellStatus = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, statusbar_1.IStatusbarService)
    ], ActiveCellStatus);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ActiveCellStatus, 3 /* LifecyclePhase.Restored */);
    let NotebookIndentationStatus = class NotebookIndentationStatus extends lifecycle_1.Disposable {
        static { this.ID = 'selectNotebookIndentation'; }
        constructor(_editorService, _statusbarService, _configurationService) {
            super();
            this._editorService = _editorService;
            this._statusbarService = _statusbarService;
            this._configurationService = _configurationService;
            this._itemDisposables = this._register(new lifecycle_1.DisposableStore());
            this._accessor = this._register(new lifecycle_1.MutableDisposable());
            this._register(this._editorService.onDidActiveEditorChange(() => this._update()));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor') || e.affectsConfiguration('notebook')) {
                    this._update();
                }
            }));
        }
        _update() {
            this._itemDisposables.clear();
            const activeEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            if (activeEditor) {
                this._show(activeEditor);
                this._itemDisposables.add(activeEditor.onDidChangeSelection(() => {
                    this._accessor.clear();
                    this._show(activeEditor);
                }));
            }
            else {
                this._accessor.clear();
            }
        }
        _show(editor) {
            if (!editor.hasModel()) {
                this._accessor.clear();
                return;
            }
            const cellOptions = editor.getActiveCell()?.textModel?.getOptions();
            if (!cellOptions) {
                this._accessor.clear();
                return;
            }
            const cellEditorOverridesRaw = editor.notebookOptions.getDisplayOptions().editorOptionsCustomizations;
            const indentSize = cellEditorOverridesRaw['editor.indentSize'] ?? cellOptions?.indentSize;
            const insertSpaces = cellEditorOverridesRaw['editor.insertSpaces'] ?? cellOptions?.tabSize;
            const tabSize = cellEditorOverridesRaw['editor.tabSize'] ?? cellOptions?.insertSpaces;
            const width = typeof indentSize === 'number' ? indentSize : tabSize;
            const message = insertSpaces ? `Spaces: ${width}` : `Tab Size: ${width}`;
            const newText = message;
            if (!newText) {
                this._accessor.clear();
                return;
            }
            const entry = {
                name: nls.localize('notebook.indentation', "Notebook Indentation"),
                text: newText,
                ariaLabel: newText,
                tooltip: nls.localize('selectNotebookIndentation', "Select Indentation"),
                command: editActions_1.SELECT_NOTEBOOK_INDENTATION_ID
            };
            if (!this._accessor.value) {
                this._accessor.value = this._statusbarService.addEntry(entry, 'notebook.status.indentation', 1 /* StatusbarAlignment.RIGHT */, 100.4);
            }
            else {
                this._accessor.value.update(entry);
            }
        }
    };
    exports.NotebookIndentationStatus = NotebookIndentationStatus;
    exports.NotebookIndentationStatus = NotebookIndentationStatus = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, configuration_1.IConfigurationService)
    ], NotebookIndentationStatus);
    (0, contributions_1.registerWorkbenchContribution2)(NotebookIndentationStatus.ID, NotebookIndentationStatus, 3 /* WorkbenchPhase.AfterRestored */); // TODO@Yoyokrazy -- unsure on the phase
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU3RhdHVzQmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvZWRpdG9yU3RhdHVzQmFyL2VkaXRvclN0YXR1c0Jhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQmhHLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXFCO1FBSTFCLFlBQ0MsUUFBMkIsRUFDM0IsU0FBMEIsRUFDRixxQkFBNkMsRUFDM0MsdUJBQWlELEVBQzlELFVBQXVCO1lBRXBDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFckQsTUFBTSxZQUFZLEdBQUcsR0FBRyxFQUFFO2dCQUN6QixXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3BCLHFCQUFxQixDQUFDLHVCQUF1QixDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNwRSxDQUFDLENBQUM7WUFFRiwwRUFBMEU7WUFDMUUsMENBQTBDO1lBQzFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMvQyxLQUFLLE1BQU0sS0FBSyxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDakMsUUFBUSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ3BCLEtBQUssd0NBQXVCLENBQUMsaUJBQWlCLENBQUM7d0JBQy9DLEtBQUssd0NBQXVCLENBQUMsV0FBVyxDQUFDO3dCQUN6QyxLQUFLLHdDQUF1QixDQUFDLElBQUksQ0FBQzt3QkFDbEMsS0FB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