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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/resources", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorService"], function (require, exports, lifecycle_1, map_1, network_1, resources_1, platform_1, contributions_1, debug_1, notebookBrowser_1, notebookCommon_1, notebookService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NotebookBreakpoints = class NotebookBreakpoints extends lifecycle_1.Disposable {
        constructor(_debugService, _notebookService, _editorService) {
            super();
            this._debugService = _debugService;
            this._editorService = _editorService;
            const listeners = new map_1.ResourceMap();
            this._register(_notebookService.onWillAddNotebookDocument(model => {
                listeners.set(model.uri, model.onWillAddRemoveCells(e => {
                    // When deleting a cell, remove its breakpoints
                    const debugModel = this._debugService.getModel();
                    if (!debugModel.getBreakpoints().length) {
                        return;
                    }
                    if (e.rawEvent.kind !== notebookCommon_1.NotebookCellsChangeType.ModelChange) {
                        return;
                    }
                    for (const change of e.rawEvent.changes) {
                        const [start, deleteCount] = change;
                        if (deleteCount > 0) {
                            const deleted = model.cells.slice(start, start + deleteCount);
                            for (const deletedCell of deleted) {
                                const cellBps = debugModel.getBreakpoints({ uri: deletedCell.uri });
                                cellBps.forEach(cellBp => this._debugService.removeBreakpoints(cellBp.getId()));
                            }
                        }
                    }
                }));
            }));
            this._register(_notebookService.onWillRemoveNotebookDocument(model => {
                this.updateBreakpoints(model);
                listeners.get(model.uri)?.dispose();
                listeners.delete(model.uri);
            }));
            this._register(this._debugService.getModel().onDidChangeBreakpoints(e => {
                const newCellBp = e?.added?.find(bp => 'uri' in bp && bp.uri.scheme === network_1.Schemas.vscodeNotebookCell);
                if (newCellBp) {
                    const parsed = notebookCommon_1.CellUri.parse(newCellBp.uri);
                    if (!parsed) {
                        return;
                    }
                    const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
                    if (!editor || !editor.hasModel() || editor.textModel.uri.toString() !== parsed.notebook.toString()) {
                        return;
                    }
                    const cell = editor.getCellByHandle(parsed.handle);
                    if (!cell) {
                        return;
                    }
                    editor.focusElement(cell);
                }
            }));
        }
        updateBreakpoints(model) {
            const bps = this._debugService.getModel().getBreakpoints();
            if (!bps.length || !model.cells.length) {
                return;
            }
            const idxMap = new map_1.ResourceMap();
            model.cells.forEach((cell, i) => {
                idxMap.set(cell.uri, i);
            });
            bps.forEach(bp => {
                const idx = idxMap.get(bp.uri);
                if (typeof idx !== 'number') {
                    return;
                }
                const notebook = notebookCommon_1.CellUri.parse(bp.uri)?.notebook;
                if (!notebook) {
                    return;
                }
                const newUri = notebookCommon_1.CellUri.generate(notebook, idx);
                if ((0, resources_1.isEqual)(newUri, bp.uri)) {
                    return;
                }
                this._debugService.removeBreakpoints(bp.getId());
                this._debugService.addBreakpoints(newUri, [
                    {
                        column: bp.column,
                        condition: bp.condition,
                        enabled: bp.enabled,
                        hitCondition: bp.hitCondition,
                        logMessage: bp.logMessage,
                        lineNumber: bp.lineNumber
                    }
                ]);
            });
        }
    };
    NotebookBreakpoints = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, notebookService_1.INotebookService),
        __param(2, editorService_1.IEditorService)
    ], NotebookBreakpoints);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(NotebookBreakpoints, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tCcmVha3BvaW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2RlYnVnL25vdGVib29rQnJlYWtwb2ludHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFnQmhHLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7UUFDM0MsWUFDaUMsYUFBNEIsRUFDMUMsZ0JBQWtDLEVBQ25CLGNBQThCO1lBRS9ELEtBQUssRUFBRSxDQUFDO1lBSndCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBRTNCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUkvRCxNQUFNLFNBQVMsR0FBRyxJQUFJLGlCQUFXLEVBQWUsQ0FBQztZQUNqRCxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNqRSxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUN2RCwrQ0FBK0M7b0JBQy9DLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ2pELElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ3pDLE9BQU87b0JBQ1IsQ0FBQztvQkFFRCxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLHdDQUF1QixDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUM3RCxPQUFPO29CQUNSLENBQUM7b0JBRUQsS0FBSyxNQUFNLE1BQU0sSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFD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