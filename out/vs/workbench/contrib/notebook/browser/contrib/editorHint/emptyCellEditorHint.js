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
define(["require", "exports", "vs/base/common/network", "vs/editor/browser/editorExtensions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/keybinding/common/keybinding", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/codeEditor/browser/emptyTextEditorHint/emptyTextEditorHint", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionService", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, network_1, editorExtensions_1, commands_1, configuration_1, keybinding_1, productService_1, telemetry_1, emptyTextEditorHint_1, inlineChatSessionService_1, inlineChat_1, notebookBrowser_1, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmptyCellEditorHintContribution = void 0;
    let EmptyCellEditorHintContribution = class EmptyCellEditorHintContribution extends emptyTextEditorHint_1.EmptyTextEditorHintContribution {
        static { this.CONTRIB_ID = 'notebook.editor.contrib.emptyCellEditorHint'; }
        constructor(editor, _editorService, editorGroupsService, commandService, configurationService, keybindingService, inlineChatSessionService, inlineChatService, telemetryService, productService) {
            super(editor, editorGroupsService, commandService, configurationService, keybindingService, inlineChatSessionService, inlineChatService, telemetryService, productService);
            this._editorService = _editorService;
            const activeEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            if (!activeEditor) {
                return;
            }
            this.toDispose.push(activeEditor.onDidChangeActiveCell(() => this.update()));
        }
        _getOptions() {
            return { clickable: false };
        }
        _shouldRenderHint() {
            const shouldRenderHint = super._shouldRenderHint();
            if (!shouldRenderHint) {
                return false;
            }
            const model = this.editor.getModel();
            if (!model) {
                return false;
            }
            const isNotebookCell = model?.uri.scheme === network_1.Schemas.vscodeNotebookCell;
            if (!isNotebookCell) {
                return false;
            }
            const activeEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            if (!activeEditor) {
                return false;
            }
            const activeCell = activeEditor.getActiveCell();
            if (activeCell?.uri.fragment !== model.uri.fragment) {
                return false;
            }
            return true;
        }
    };
    exports.EmptyCellEditorHintContribution = EmptyCellEditorHintContribution;
    exports.EmptyCellEditorHintContribution = EmptyCellEditorHintContribution = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, commands_1.ICommandService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, inlineChatSessionService_1.IInlineChatSessionService),
        __param(7, inlineChat_1.IInlineChatService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, productService_1.IProductService)
    ], EmptyCellEditorHintContribution);
    (0, editorExtensions_1.registerEditorContribution)(EmptyCellEditorHintContribution.CONTRIB_ID, EmptyCellEditorHintContribution, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to render a help message
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1wdHlDZWxsRWRpdG9ySGludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2VkaXRvckhpbnQvZW1wdHlDZWxsRWRpdG9ySGludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQnpGLElBQU0sK0JBQStCLEdBQXJDLE1BQU0sK0JBQWdDLFNBQVEscURBQStCO2lCQUM1RCxlQUFVLEdBQUcsNkNBQTZDLEFBQWhELENBQWlEO1FBQ2xGLFlBQ0MsTUFBbUIsRUFDYyxjQUE4QixFQUN6QyxtQkFBeUMsRUFDOUMsY0FBK0IsRUFDekIsb0JBQTJDLEVBQzlDLGlCQUFxQyxFQUM5Qix3QkFBbUQsRUFDMUQsaUJBQXFDLEVBQ3RDLGdCQUFtQyxFQUNyQyxjQUErQjtZQUVoRCxLQUFLLENBQ0osTUFBTSxFQUNOLG1CQUFtQixFQUNuQixjQUFjLEVBQ2Qsb0JBQW9CLEVBQ3BCLGlCQUFpQixFQUNqQix3QkFBd0IsRUFDeEIsaUJBQWlCLEVBQ2pCLGdCQUFnQixFQUNoQixjQUFjLENBQ2QsQ0FBQztZQXBCK0IsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBc0IvRCxNQUFNLFlBQVksR0FBRyxJQUFBLGlEQUErQixFQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUUzRixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ25CLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVrQixXQUFXO1lBQzdCLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDN0IsQ0FBQztRQUVrQixpQkFBaUI7WUFDbkMsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUNuRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdkIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsTUFBTSxjQUFjLEdBQUcsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxrQkFBa0IsQ0FBQztZQUN4RSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3JCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0sWUFBWSxHQUFHLElBQUEsaURBQStCLEVBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzNGLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDbkIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBRWhELElBQUksVUFBVSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEtBQUssS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDckQsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDOztJQW5FVywwRUFBK0I7OENBQS9CLCtCQUErQjtRQUl6QyxXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLDBDQUFvQixDQUFBO1FBQ3BCLFdBQUEsMEJBQWUsQ0FBQTtRQUNmLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLG9EQUF5QixDQUFBO1FBQ3pCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLGdDQUFlLENBQUE7T0FaTCwrQkFBK0IsQ0FvRTNDO0lBRUQsSUFBQSw2Q0FBMEIsRUFBQywrQkFBK0IsQ0FBQyxVQUFVLEVBQUUsK0JBQStCLGdEQUF3QyxDQUFDLENBQUMsa0RBQWtEIn0=