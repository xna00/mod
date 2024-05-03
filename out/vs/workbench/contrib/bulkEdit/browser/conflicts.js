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
define(["require", "exports", "vs/platform/files/common/files", "vs/editor/common/services/model", "vs/base/common/map", "vs/base/common/lifecycle", "vs/base/common/event", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/platform/log/common/log"], function (require, exports, files_1, model_1, map_1, lifecycle_1, event_1, bulkEditService_1, bulkCellEdits_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConflictDetector = void 0;
    let ConflictDetector = class ConflictDetector {
        constructor(edits, fileService, modelService, logService) {
            this._conflicts = new map_1.ResourceMap();
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidConflict = new event_1.Emitter();
            this.onDidConflict = this._onDidConflict.event;
            const _workspaceEditResources = new map_1.ResourceMap();
            for (const edit of edits) {
                if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                    _workspaceEditResources.set(edit.resource, true);
                    if (typeof edit.versionId === 'number') {
                        const model = modelService.getModel(edit.resource);
                        if (model && model.getVersionId() !== edit.versionId) {
                            this._conflicts.set(edit.resource, true);
                            this._onDidConflict.fire(this);
                        }
                    }
                }
                else if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                    if (edit.newResource) {
                        _workspaceEditResources.set(edit.newResource, true);
                    }
                    else if (edit.oldResource) {
                        _workspaceEditResources.set(edit.oldResource, true);
                    }
                }
                else if (edit instanceof bulkCellEdits_1.ResourceNotebookCellEdit) {
                    _workspaceEditResources.set(edit.resource, true);
                }
                else {
                    logService.warn('UNKNOWN edit type', edit);
                }
            }
            // listen to file changes
            this._disposables.add(fileService.onDidFilesChange(e => {
                for (const uri of _workspaceEditResources.keys()) {
                    // conflict happens when a file that we are working
                    // on changes on disk. ignore changes for which a model
                    // exists because we have a better check for models
                    if (!modelService.getModel(uri) && e.contains(uri)) {
                        this._conflicts.set(uri, true);
                        this._onDidConflict.fire(this);
                        break;
                    }
                }
            }));
            // listen to model changes...?
            const onDidChangeModel = (model) => {
                // conflict
                if (_workspaceEditResources.has(model.uri)) {
                    this._conflicts.set(model.uri, true);
                    this._onDidConflict.fire(this);
                }
            };
            for (const model of modelService.getModels()) {
                this._disposables.add(model.onDidChangeContent(() => onDidChangeModel(model)));
            }
        }
        dispose() {
            this._disposables.dispose();
            this._onDidConflict.dispose();
        }
        list() {
            return [...this._conflicts.keys()];
        }
        hasConflicts() {
            return this._conflicts.size > 0;
        }
    };
    exports.ConflictDetector = ConflictDetector;
    exports.ConflictDetector = ConflictDetector = __decorate([
        __param(1, files_1.IFileService),
        __param(2, model_1.IModelService),
        __param(3, log_1.ILogService)
    ], ConflictDetector);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmxpY3RzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9idWxrRWRpdC9icm93c2VyL2NvbmZsaWN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7UUFRNUIsWUFDQyxLQUFxQixFQUNQLFdBQXlCLEVBQ3hCLFlBQTJCLEVBQzdCLFVBQXVCO1lBVnBCLGVBQVUsR0FBRyxJQUFJLGlCQUFXLEVBQVcsQ0FBQztZQUN4QyxpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRXJDLG1CQUFjLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUM3QyxrQkFBYSxHQUFnQixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztZQVMvRCxNQUFNLHVCQUF1QixHQUFHLElBQUksaUJBQVcsRUFBVyxDQUFDO1lBRTNELEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQzFCLElBQUksSUFBSSxZQUFZLGtDQUFnQixFQUFFLENBQUM7b0JBQ3RDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNqRCxJQUFJLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRLEVBQUUsQ0FBQzt3QkFDeEMsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQ25ELElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxZQUFZLEVBQUUsS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7NEJBQ3RELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFR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