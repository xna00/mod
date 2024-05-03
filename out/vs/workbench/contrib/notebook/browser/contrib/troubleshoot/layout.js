/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorService"], function (require, exports, lifecycle_1, nls_1, actionCommonCategories_1, actions_1, notebookBrowser_1, notebookEditorExtensions_1, notebookService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TroubleshootController = void 0;
    class TroubleshootController extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.troubleshoot'; }
        constructor(_notebookEditor) {
            super();
            this._notebookEditor = _notebookEditor;
            this._localStore = this._register(new lifecycle_1.DisposableStore());
            this._cellStateListeners = [];
            this._enabled = false;
            this._cellStatusItems = [];
            this._register(this._notebookEditor.onDidChangeModel(() => {
                this._update();
            }));
            this._update();
        }
        toggle() {
            this._enabled = !this._enabled;
            this._update();
        }
        _update() {
            this._localStore.clear();
            this._cellStateListeners.forEach(listener => listener.dispose());
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            this._updateListener();
        }
        _log(cell, e) {
            if (this._enabled) {
                const oldHeight = this._notebookEditor.getViewHeight(cell);
                console.log(`cell#${cell.handle}`, e, `${oldHeight} -> ${cell.layoutInfo.totalHeight}`);
            }
        }
        _updateListener() {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            for (let i = 0; i < this._notebookEditor.getLength(); i++) {
                const cell = this._notebookEditor.cellAt(i);
                this._cellStateListeners.push(cell.onDidChangeLayout(e => {
                    this._log(cell, e);
                }));
            }
            this._localStore.add(this._notebookEditor.onDidChangeViewCells(e => {
                [...e.splices].reverse().forEach(splice => {
                    const [start, deleted, newCells] = splice;
                    const deletedCells = this._cellStateListeners.splice(start, deleted, ...newCells.map(cell => {
                        return cell.onDidChangeLayout((e) => {
                            this._log(cell, e);
                        });
                    }));
                    (0, lifecycle_1.dispose)(deletedCells);
                });
            }));
            const vm = this._notebookEditor.getViewModel();
            let items = [];
            if (this._enabled) {
                items = this._getItemsForCells();
            }
            this._cellStatusItems = vm.deltaCellStatusBarItems(this._cellStatusItems, items);
        }
        _getItemsForCells() {
            const items = [];
            for (let i = 0; i < this._notebookEditor.getLength(); i++) {
                items.push({
                    handle: i,
                    items: [
                        {
                            text: `index: ${i}`,
                            alignment: 1 /* CellStatusbarAlignment.Left */,
                            priority: Number.MAX_SAFE_INTEGER
                        }
                    ]
                });
            }
            return items;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._cellStateListeners);
            super.dispose();
        }
    }
    exports.TroubleshootController = TroubleshootController;
    (0, notebookEditorExtensions_1.registerNotebookContribution)(TroubleshootController.id, TroubleshootController);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.toggleLayoutTroubleshoot',
                title: (0, nls_1.localize2)('workbench.notebook.toggleLayoutTroubleshoot', "Toggle Layout Troubleshoot"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor) {
                return;
            }
            const controller = editor.getContribution(TroubleshootController.id);
            controller?.toggle();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.inspectLayout',
                title: (0, nls_1.localize2)('workbench.notebook.inspectLayout', "Inspect Notebook Layout"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor || !editor.hasModel()) {
                return;
            }
            for (let i = 0; i < editor.getLength(); i++) {
                const cell = editor.cellAt(i);
                console.log(`cell#${cell.handle}`, cell.layoutInfo);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.clearNotebookEdtitorTypeCache',
                title: (0, nls_1.localize2)('workbench.notebook.clearNotebookEdtitorTypeCache', "Clear Notebook Editor Type Cache"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const notebookService = accessor.get(notebookService_1.INotebookService);
            notebookService.clearEditorCache();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvdHJvdWJsZXNob290L2xheW91dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSxzQkFBdUIsU0FBUSxzQkFBVTtpQkFDOUMsT0FBRSxHQUFXLGlDQUFpQyxBQUE1QyxDQUE2QztRQU90RCxZQUE2QixlQUFnQztZQUM1RCxLQUFLLEVBQUUsQ0FBQztZQURvQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFMNUMsZ0JBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFDN0Qsd0JBQW1CLEdBQWtCLEVBQUUsQ0FBQztZQUN4QyxhQUFRLEdBQVksS0FBSyxDQUFDO1lBQzFCLHFCQUFnQixHQUFhLEVBQUUsQ0FBQztZQUt2QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFO2dCQUN6RCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQixDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQy9CLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQixDQUFDO1FBRU8sT0FBTztZQUNkLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVB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