/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/viewModel/foldingModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/nls"], function (require, exports, lifecycle_1, notebookContextKeys_1, notebookBrowser_1, foldingModel_1, notebookCommon_1, notebookEditorExtensions_1, actions_1, contextkey_1, contextkeys_1, editorService_1, coreActions_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FoldingController = void 0;
    class FoldingController extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.foldingController'; }
        constructor(_notebookEditor) {
            super();
            this._notebookEditor = _notebookEditor;
            this._foldingModel = null;
            this._localStore = this._register(new lifecycle_1.DisposableStore());
            this._register(this._notebookEditor.onMouseUp(e => { this.onMouseUp(e); }));
            this._register(this._notebookEditor.onDidChangeModel(() => {
                this._localStore.clear();
                if (!this._notebookEditor.hasModel()) {
                    return;
                }
                this._localStore.add(this._notebookEditor.onDidChangeCellState(e => {
                    if (e.source.editStateChanged && e.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                        this._foldingModel?.recompute();
                        // this._updateEditorFoldingRanges();
                    }
                }));
                this._foldingModel = new foldingModel_1.FoldingModel();
                this._localStore.add(this._foldingModel);
                this._foldingModel.attachViewModel(this._notebookEditor.getViewModel());
                this._localStore.add(this._foldingModel.onDidFoldingRegionChanged(() => {
                    this._updateEditorFoldingRanges();
                }));
            }));
        }
        saveViewState() {
            return this._foldingModel?.getMemento() || [];
        }
        restoreViewState(state) {
            this._foldingModel?.applyMemento(state || []);
            this._updateEditorFoldingRanges();
        }
        setFoldingStateDown(index, state, levels) {
            const doCollapse = state === 2 /* CellFoldingState.Collapsed */;
            const region = this._foldingModel.getRegionAtLine(index + 1);
            const regions = [];
            if (region) {
                if (region.isCollapsed !== doCollapse) {
                    regions.push(region);
                }
                if (levels > 1) {
                    const regionsInside = this._foldingModel.getRegionsInside(region, (r, level) => r.isCollapsed !== doCollapse && level < levels);
                    regions.push(...regionsInside);
                }
            }
            regions.forEach(r => this._foldingModel.setCollapsed(r.regionIndex, state === 2 /* CellFoldingState.Collapsed */));
            this._updateEditorFoldingRanges();
        }
        setFoldingStateUp(index, state, levels) {
            if (!this._foldingModel) {
                return;
            }
            const regions = this._foldingModel.getAllRegionsAtLine(index + 1, (region, level) => region.isCollapsed !== (state === 2 /* CellFoldingState.Collapsed */) && level <= levels);
            regions.forEach(r => this._foldingModel.setCollapsed(r.regionIndex, state === 2 /* CellFoldingState.Collapsed */));
            this._updateEditorFoldingRanges();
        }
        _updateEditorFoldingRanges() {
            if (!this._foldingModel) {
                return;
            }
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const vm = this._notebookEditor.getViewModel();
            vm.updateFoldingRanges(this._foldingModel.regions);
            const hiddenRanges = vm.getHiddenRanges();
            this._notebookEditor.setHiddenAreas(hiddenRanges);
        }
        onMouseUp(e) {
            if (!e.event.target) {
                return;
            }
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const viewModel = this._notebookEditor.getViewModel();
            const target = e.event.target;
            if (target.classList.contains('codicon-notebook-collapsed') || target.classList.contains('codicon-notebook-expanded')) {
                const parent = target.parentElement;
                if (!parent.classList.contains('notebook-folding-indicator')) {
                    return;
                }
                // folding icon
                const cellViewModel = e.target;
                const modelIndex = viewModel.getCellIndex(cellViewModel);
                const state = viewModel.getFoldingState(modelIndex);
                if (state === 0 /* CellFoldingState.None */) {
                    return;
                }
                this.setFoldingStateUp(modelIndex, state === 2 /* CellFoldingState.Collapsed */ ? 1 /* CellFoldingState.Expanded */ : 2 /* CellFoldingState.Collapsed */, 1);
                this._notebookEditor.focusElement(cellViewModel);
            }
            return;
        }
    }
    exports.FoldingController = FoldingController;
    (0, notebookEditorExtensions_1.registerNotebookContribution)(FoldingController.id, FoldingController);
    const NOTEBOOK_FOLD_COMMAND_LABEL = (0, nls_1.localize)('fold.cell', "Fold Cell");
    const NOTEBOOK_UNFOLD_COMMAND_LABEL = (0, nls_1.localize2)('unfold.cell', "Unfold Cell");
    const FOLDING_COMMAND_ARGS = {
        args: [{
                isOptional: true,
                name: 'index',
                description: 'The cell index',
                schema: {
                    'type': 'object',
                    'required': ['index', 'direction'],
                    'properties': {
                        'index': {
                            'type': 'number'
                        },
                        'direction': {
                            'type': 'string',
                            'enum': ['up', 'down'],
                            'default': 'down'
                        },
                        'levels': {
                            'type': 'number',
                            'default': 1
                        },
                    }
                }
            }]
    };
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.fold',
                title: (0, nls_1.localize2)('fold.cell', "Fold Cell"),
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 92 /* KeyCode.BracketLeft */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 92 /* KeyCode.BracketLeft */,
                        secondary: [15 /* KeyCode.LeftArrow */],
                    },
                    secondary: [15 /* KeyCode.LeftArrow */],
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                metadata: {
                    description: NOTEBOOK_FOLD_COMMAND_LABEL,
                    args: FOLDING_COMMAND_ARGS.args
                },
                precondition: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR,
                f1: true
            });
        }
        async run(accessor, args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor) {
                return;
            }
            if (!editor.hasModel()) {
                return;
            }
            const levels = args && args.levels || 1;
            const direction = args && args.direction === 'up' ? 'up' : 'down';
            let index = undefined;
            if (args) {
                index = args.index;
            }
            else {
                const activeCell = editor.getActiveCell();
                if (!activeCell) {
                    return;
                }
                index = editor.getCellIndex(activeCell);
            }
            const controller = editor.getContribution(FoldingController.id);
            if (index !== undefined) {
                const targetCell = (index < 0 || index >= editor.getLength()) ? undefined : editor.cellAt(index);
                if (targetCell?.cellKind === notebookCommon_1.CellKind.Code && direction === 'down') {
                    return;
                }
                if (direction === 'up') {
                    controller.setFoldingStateUp(index, 2 /* CellFoldingState.Collapsed */, levels);
                }
                else {
                    controller.setFoldingStateDown(index, 2 /* CellFoldingState.Collapsed */, levels);
                }
                const viewIndex = editor.getViewModel().getNearestVisibleCellIndexUpwards(index);
                editor.focusElement(editor.cellAt(viewIndex));
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.unfold',
                title: NOTEBOOK_UNFOLD_COMMAND_LABEL,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 94 /* KeyCode.BracketRight */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 94 /* KeyCode.BracketRight */,
                        secondary: [17 /* KeyCode.RightArrow */],
                    },
                    secondary: [17 /* KeyCode.RightArrow */],
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                metadata: {
                    description: NOTEBOOK_UNFOLD_COMMAND_LABEL,
                    args: FOLDING_COMMAND_ARGS.args
                },
                precondition: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR,
                f1: true
            });
        }
        async run(accessor, args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor) {
                return;
            }
            const levels = args && args.levels || 1;
            const direction = args && args.direction === 'up' ? 'up' : 'down';
            let index = undefined;
            if (args) {
                index = args.index;
            }
            else {
                const activeCell = editor.getActiveCell();
                if (!activeCell) {
                    return;
                }
                index = editor.getCellIndex(activeCell);
            }
            const controller = editor.getContribution(FoldingController.id);
            if (index !== undefined) {
                if (direction === 'up') {
                    controller.setFoldingStateUp(index, 1 /* CellFoldingState.Expanded */, levels);
                }
                else {
                    controller.setFoldingStateDown(index, 1 /* CellFoldingState.Expanded */, levels);
                }
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGluZ0NvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJvbGxlci9mb2xkaW5nQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxQmhHLE1BQWEsaUJBQWtCLFNBQVEsc0JBQVU7aUJBQ3pDLE9BQUUsR0FBVyxzQ0FBc0MsQUFBakQsQ0FBa0Q7UUFLM0QsWUFBNkIsZUFBZ0M7WUFDNUQsS0FBSyxFQUFFLENBQUM7WUFEb0Isb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBSHJELGtCQUFhLEdBQXdCLElBQUksQ0FBQztZQUNqQyxnQkFBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUtwRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFNUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRTtnQkFDekQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFekIsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztvQkFDdEMsT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ2xFLElBQUksQ0FBQyxDQUFDLE1BQU0s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