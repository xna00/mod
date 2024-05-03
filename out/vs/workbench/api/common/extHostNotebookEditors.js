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
define(["require", "exports", "vs/base/common/event", "vs/platform/log/common/log", "vs/workbench/api/common/extHostTypeConverters"], function (require, exports, event_1, log_1, typeConverters) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookEditors = void 0;
    let ExtHostNotebookEditors = class ExtHostNotebookEditors {
        constructor(_logService, _notebooksAndEditors) {
            this._logService = _logService;
            this._notebooksAndEditors = _notebooksAndEditors;
            this._onDidChangeNotebookEditorSelection = new event_1.Emitter();
            this._onDidChangeNotebookEditorVisibleRanges = new event_1.Emitter();
            this.onDidChangeNotebookEditorSelection = this._onDidChangeNotebookEditorSelection.event;
            this.onDidChangeNotebookEditorVisibleRanges = this._onDidChangeNotebookEditorVisibleRanges.event;
        }
        $acceptEditorPropertiesChanged(id, data) {
            this._logService.debug('ExtHostNotebook#$acceptEditorPropertiesChanged', id, data);
            const editor = this._notebooksAndEditors.getEditorById(id);
            // ONE: make all state updates
            if (data.visibleRanges) {
                editor._acceptVisibleRanges(data.visibleRanges.ranges.map(typeConverters.NotebookRange.to));
            }
            if (data.selections) {
                editor._acceptSelections(data.selections.selections.map(typeConverters.NotebookRange.to));
            }
            // TWO: send all events after states have been updated
            if (data.visibleRanges) {
                this._onDidChangeNotebookEditorVisibleRanges.fire({
                    notebookEditor: editor.apiEditor,
                    visibleRanges: editor.apiEditor.visibleRanges
                });
            }
            if (data.selections) {
                this._onDidChangeNotebookEditorSelection.fire(Object.freeze({
                    notebookEditor: editor.apiEditor,
                    selections: editor.apiEditor.selections
                }));
            }
        }
        $acceptEditorViewColumns(data) {
            for (const id in data) {
                const editor = this._notebooksAndEditors.getEditorById(id);
                editor._acceptViewColumn(typeConverters.ViewColumn.to(data[id]));
            }
        }
    };
    exports.ExtHostNotebookEditors = ExtHostNotebookEditors;
    exports.ExtHostNotebookEditors = ExtHostNotebookEditors = __decorate([
        __param(0, log_1.ILogService)
    ], ExtHostNotebookEditors);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rRWRpdG9ycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdE5vdGVib29rRWRpdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVekYsSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBc0I7UUFRbEMsWUFDYyxXQUF5QyxFQUNyQyxvQkFBK0M7WUFEbEMsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDckMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUEyQjtZQVJoRCx3Q0FBbUMsR0FBRyxJQUFJLGVBQU8sRUFBNkMsQ0FBQztZQUMvRiw0Q0FBdUMsR0FBRyxJQUFJLGVBQU8sRUFBaUQsQ0FBQztZQUUvRyx1Q0FBa0MsR0FBRyxJQUFJLENBQUMsbUNBQW1DLENBQUMsS0FBSyxDQUFDO1lBQ3BGLDJDQUFzQyxHQUFHLElBQUksQ0FBQyx1Q0FBdUMsQ0FBQyxLQUFLLENBQUM7UUFLakcsQ0FBQztRQUVMLDhCQUE4QixDQUFDLEVBQVUsRUFBRSxJQUF5QztZQUNuRixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxnREFBZ0QsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbkYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMzRCw4QkFBOEI7WUFDOUIsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdGLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0YsQ0FBQztZQUVELHNEQUFzRDtZQUN0RCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLHVDQUF1QyxDQUFDLElBQUksQ0FBQztvQkFDakQsY0FBYyxFQUFFLE1BQU0sQ0FBQyxTQUFTO29CQUNoQyxhQUFhLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhO2lCQUM3QyxDQUFDLENBQUM7WUFDSixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztvQkFDM0QsY0FBYyxFQUFFLE1BQU0sQ0FBQyxTQUFTO29CQUNoQyxVQUFVLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVO2lCQUN2QyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7UUFDRixDQUFDO1FBRUQsd0JBQXdCLENBQUMsSUFBbUM7WUFDM0QsS0FBSyxNQUFNLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEUsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBN0NZLHdEQUFzQjtxQ0FBdEIsc0JBQXNCO1FBU2hDLFdBQUEsaUJBQVcsQ0FBQTtPQVRELHNCQUFzQixDQTZDbEMifQ==