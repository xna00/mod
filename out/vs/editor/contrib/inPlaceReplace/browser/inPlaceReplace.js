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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/editor/common/model/textModel", "vs/editor/common/services/editorWorker", "vs/nls", "./inPlaceReplaceCommand", "vs/css!./inPlaceReplace"], function (require, exports, async_1, errors_1, editorState_1, editorExtensions_1, range_1, selection_1, editorContextKeys_1, textModel_1, editorWorker_1, nls, inPlaceReplaceCommand_1) {
    "use strict";
    var InPlaceReplaceController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let InPlaceReplaceController = class InPlaceReplaceController {
        static { InPlaceReplaceController_1 = this; }
        static { this.ID = 'editor.contrib.inPlaceReplaceController'; }
        static get(editor) {
            return editor.getContribution(InPlaceReplaceController_1.ID);
        }
        static { this.DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'in-place-replace',
            className: 'valueSetReplacement'
        }); }
        constructor(editor, editorWorkerService) {
            this.editor = editor;
            this.editorWorkerService = editorWorkerService;
            this.decorations = this.editor.createDecorationsCollection();
        }
        dispose() {
        }
        run(source, up) {
            // cancel any pending request
            this.currentRequest?.cancel();
            const editorSelection = this.editor.getSelection();
            const model = this.editor.getModel();
            if (!model || !editorSelection) {
                return undefined;
            }
            let selection = editorSelection;
            if (selection.startLineNumber !== selection.endLineNumber) {
                // Can't accept multiline selection
                return undefined;
            }
            const state = new editorState_1.EditorState(this.editor, 1 /* CodeEditorStateFlag.Value */ | 4 /* CodeEditorStateFlag.Position */);
            const modelURI = model.uri;
            if (!this.editorWorkerService.canNavigateValueSet(modelURI)) {
                return Promise.resolve(undefined);
            }
            this.currentRequest = (0, async_1.createCancelablePromise)(token => this.editorWorkerService.navigateValueSet(modelURI, selection, up));
            return this.currentRequest.then(result => {
                if (!result || !result.range || !result.value) {
                    // No proper result
                    return;
                }
                if (!state.validate(this.editor)) {
                    // state has changed
                    return;
                }
                // Selection
                const editRange = range_1.Range.lift(result.range);
                let highlightRange = result.range;
                const diff = result.value.length - (selection.endColumn - selection.startColumn);
                // highlight
                highlightRange = {
                    startLineNumber: highlightRange.startLineNumber,
                    startColumn: highlightRange.startColumn,
                    endLineNumber: highlightRange.endLineNumber,
                    endColumn: highlightRange.startColumn + result.value.length
                };
                if (diff > 1) {
                    selection = new selection_1.Selection(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn + diff - 1);
                }
                // Insert new text
                const command = new inPlaceReplaceCommand_1.InPlaceReplaceCommand(editRange, selection, result.value);
                this.editor.pushUndoStop();
                this.editor.executeCommand(source, command);
                this.editor.pushUndoStop();
                // add decoration
                this.decorations.set([{
                        range: highlightRange,
                        options: InPlaceReplaceController_1.DECORATION
                    }]);
                // remove decoration after delay
                this.decorationRemover?.cancel();
                this.decorationRemover = (0, async_1.timeout)(350);
                this.decorationRemover.then(() => this.decorations.clear()).catch(errors_1.onUnexpectedError);
            }).catch(errors_1.onUnexpectedError);
        }
    };
    InPlaceReplaceController = InPlaceReplaceController_1 = __decorate([
        __param(1, editorWorker_1.IEditorWorkerService)
    ], InPlaceReplaceController);
    class InPlaceReplaceUp extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inPlaceReplace.up',
                label: nls.localize('InPlaceReplaceAction.previous.label', "Replace with Previous Value"),
                alias: 'Replace with Previous Value',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 87 /* KeyCode.Comma */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = InPlaceReplaceController.get(editor);
            if (!controller) {
                return Promise.resolve(undefined);
            }
            return controller.run(this.id, false);
        }
    }
    class InPlaceReplaceDown extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inPlaceReplace.down',
                label: nls.localize('InPlaceReplaceAction.next.label', "Replace with Next Value"),
                alias: 'Replace with Next Value',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 89 /* KeyCode.Period */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = InPlaceReplaceController.get(editor);
            if (!controller) {
                return Promise.resolve(undefined);
            }
            return controller.run(this.id, true);
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(InPlaceReplaceController.ID, InPlaceReplaceController, 4 /* EditorContributionInstantiation.Lazy */);
    (0, editorExtensions_1.registerEditorAction)(InPlaceReplaceUp);
    (0, editorExtensions_1.registerEditorAction)(InPlaceReplaceDown);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5QbGFjZVJlcGxhY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2luUGxhY2VSZXBsYWNlL2Jyb3dzZXIvaW5QbGFjZVJlcGxhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF3Qjs7aUJBRU4sT0FBRSxHQUFHLHlDQUF5QyxBQUE1QyxDQUE2QztRQUV0RSxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQzdCLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBMkIsMEJBQXdCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdEYsQ0FBQztpQkFFdUIsZUFBVSxHQUFHLGtDQUFzQixDQUFDLFFBQVEsQ0FBQztZQUNwRSxXQUFXLEVBQUUsa0JBQWtCO1lBQy9CLFNBQVMsRUFBRSxxQkFBcUI7U0FDaEMsQ0FBQyxBQUhnQyxDQUcvQjtRQVFILFlBQ0MsTUFBbUIsRUFDRyxtQkFBeUM7WUFFL0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFDckIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLG1CQUFtQixDQUFDO1lBQy9DLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1FBQzlELENBQUM7UUFFTSxPQUFPO1FBQ2QsQ0FBQztRQUVNLEdBQUcsQ0FBQyxNQUFjLEVBQUUsRUFBVztZQUVyQyw2QkFBNkI7WUFDN0IsSUFBSSxDQUFDLGNBQWMsRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUU5QixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ25ELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFB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