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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/accessibility/common/accessibility", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookRange", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, async_1, lifecycle_1, accessibility_1, notebookBrowser_1, notebookEditorExtensions_1, codeCellViewModel_1, notebookCommon_1, notebookRange_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NotebookViewportContribution = class NotebookViewportContribution extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.viewportWarmup'; }
        constructor(_notebookEditor, _notebookService, accessibilityService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._notebookService = _notebookService;
            this._warmupDocument = null;
            this._warmupViewport = new async_1.RunOnceScheduler(() => this._warmupViewportNow(), 200);
            this._register(this._warmupViewport);
            this._register(this._notebookEditor.onDidScroll(() => {
                this._warmupViewport.schedule();
            }));
            this._warmupDocument = new async_1.RunOnceScheduler(() => this._warmupDocumentNow(), 200);
            this._register(this._warmupDocument);
            this._register(this._notebookEditor.onDidAttachViewModel(() => {
                if (this._notebookEditor.hasModel()) {
                    this._warmupDocument?.schedule();
                }
            }));
            if (this._notebookEditor.hasModel()) {
                this._warmupDocument?.schedule();
            }
        }
        _warmupDocumentNow() {
            if (this._notebookEditor.hasModel()) {
                for (let i = 0; i < this._notebookEditor.getLength(); i++) {
                    const cell = this._notebookEditor.cellAt(i);
                    if (cell?.cellKind === notebookCommon_1.CellKind.Markup && cell?.getEditState() === notebookBrowser_1.CellEditState.Preview && !cell.isInputCollapsed) {
                        // TODO@rebornix currently we disable markdown cell rendering in webview for accessibility
                        // this._notebookEditor.createMarkupPreview(cell);
                    }
                    else if (cell?.cellKind === notebookCommon_1.CellKind.Code) {
                        this._warmupCodeCell(cell);
                    }
                }
            }
        }
        _warmupViewportNow() {
            if (this._notebookEditor.isDisposed) {
                return;
            }
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const visibleRanges = this._notebookEditor.getVisibleRangesPlusViewportAboveAndBelow();
            (0, notebookRange_1.cellRangesToIndexes)(visibleRanges).forEach(index => {
                const cell = this._notebookEditor.cellAt(index);
                if (cell?.cellKind === notebookCommon_1.CellKind.Markup && cell?.getEditState() === notebookBrowser_1.CellEditState.Preview && !cell.isInputCollapsed) {
                    this._notebookEditor.createMarkupPreview(cell);
                }
                else if (cell?.cellKind === notebookCommon_1.CellKind.Code) {
                    this._warmupCodeCell(cell);
                }
            });
        }
        _warmupCodeCell(viewCell) {
            if (viewCell.isOutputCollapsed) {
                return;
            }
            const outputs = viewCell.outputsViewModels;
            for (const output of outputs.slice(0, codeCellViewModel_1.outputDisplayLimit)) {
                const [mimeTypes, pick] = output.resolveMimeTypes(this._notebookEditor.textModel, undefined);
                if (!mimeTypes.find(mimeType => mimeType.isTrusted) || mimeTypes.length === 0) {
                    continue;
                }
                const pickedMimeTypeRenderer = mimeTypes[pick];
                if (!pickedMimeTypeRenderer) {
                    return;
                }
                if (!this._notebookEditor.hasModel()) {
                    return;
                }
                const renderer = this._notebookService.getRendererInfo(pickedMimeTypeRenderer.rendererId);
                if (!renderer) {
                    return;
                }
                const result = { type: 1 /* RenderOutputType.Extension */, renderer, source: output, mimeType: pickedMimeTypeRenderer.mimeType };
                this._notebookEditor.createOutput(viewCell, result, 0, true);
            }
        }
    };
    NotebookViewportContribution = __decorate([
        __param(1, notebookService_1.INotebookService),
        __param(2, accessibility_1.IAccessibilityService)
    ], NotebookViewportContribution);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(NotebookViewportContribution.id, NotebookViewportContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3BvcnRXYXJtdXAuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi92aWV3cG9ydFdhcm11cC92aWV3cG9ydFdhcm11cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQVloRyxJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE2QixTQUFRLHNCQUFVO2lCQUM3QyxPQUFFLEdBQVcsbUNBQW1DLEFBQTlDLENBQStDO1FBSXhELFlBQ2tCLGVBQWdDLEVBQy9CLGdCQUFtRCxFQUM5QyxvQkFBMkM7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFKUyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDZCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBSnJELG9CQUFlLEdBQTRCLElBQUksQ0FBQztZQVNoRSxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3BELElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUMsU0FBUyxDQUFDLElB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