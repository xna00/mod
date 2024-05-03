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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorGroupsService", "./webviewCommands", "./webviewEditor", "./webviewEditorInput", "./webviewEditorInputSerializer", "./webviewWorkbenchService", "vs/workbench/services/editor/common/editorService"], function (require, exports, lifecycle_1, nls_1, actions_1, descriptors_1, extensions_1, platform_1, editor_1, contributions_1, editor_2, editorGroupsService_1, webviewCommands_1, webviewEditor_1, webviewEditorInput_1, webviewEditorInputSerializer_1, webviewWorkbenchService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (platform_1.Registry.as(editor_2.EditorExtensions.EditorPane)).registerEditorPane(editor_1.EditorPaneDescriptor.create(webviewEditor_1.WebviewEditor, webviewEditor_1.WebviewEditor.ID, (0, nls_1.localize)('webview.editor.label', "webview editor")), [new descriptors_1.SyncDescriptor(webviewEditorInput_1.WebviewInput)]);
    let WebviewPanelContribution = class WebviewPanelContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.webviewPanel'; }
        constructor(editorService, editorGroupService) {
            super();
            this.editorGroupService = editorGroupService;
            this._register(editorService.onWillOpenEditor(e => {
                const group = editorGroupService.getGroup(e.groupId);
                if (group) {
                    this.onEditorOpening(e.editor, group);
                }
            }));
        }
        onEditorOpening(editor, group) {
            if (!(editor instanceof webviewEditorInput_1.WebviewInput) || editor.typeId !== webviewEditorInput_1.WebviewInput.typeId) {
                return;
            }
            if (group.contains(editor)) {
                return;
            }
            let previousGroup;
            const groups = this.editorGroupService.groups;
            for (const group of groups) {
                if (group.contains(editor)) {
                    previousGroup = group;
                    break;
                }
            }
            if (!previousGroup) {
                return;
            }
            previousGroup.closeEditor(editor);
        }
    };
    WebviewPanelContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService)
    ], WebviewPanelContribution);
    (0, contributions_1.registerWorkbenchContribution2)(WebviewPanelContribution.ID, WebviewPanelContribution, 1 /* WorkbenchPhase.BlockStartup */);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(webviewEditorInputSerializer_1.WebviewEditorInputSerializer.ID, webviewEditorInputSerializer_1.WebviewEditorInputSerializer);
    (0, extensions_1.registerSingleton)(webviewWorkbenchService_1.IWebviewWorkbenchService, webviewWorkbenchService_1.WebviewEditorService, 1 /* InstantiationType.Delayed */);
    (0, actions_1.registerAction2)(webviewCommands_1.ShowWebViewEditorFindWidgetAction);
    (0, actions_1.registerAction2)(webviewCommands_1.HideWebViewEditorFindCommand);
    (0, actions_1.registerAction2)(webviewCommands_1.WebViewEditorFindNextCommand);
    (0, actions_1.registerAction2)(webviewCommands_1.WebViewEditorFindPreviousCommand);
    (0, actions_1.registerAction2)(webviewCommands_1.ReloadWebviewAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld1BhbmVsLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2Vidmlld1BhbmVsL2Jyb3dzZXIvd2Vidmlld1BhbmVsLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQW9CaEcsQ0FBQyxtQkFBUSxDQUFDLEVBQUUsQ0FBc0IseUJBQWdCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyw2QkFBb0IsQ0FBQyxNQUFNLENBQzdHLDZCQUFhLEVBQ2IsNkJBQWEsQ0FBQyxFQUFFLEVBQ2hCLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLGdCQUFnQixDQUFDLENBQUMsRUFDbkQsQ0FBQyxJQUFJLDRCQUFjLENBQUMsaUNBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVyQyxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVO2lCQUVoQyxPQUFFLEdBQUcsZ0NBQWdDLEFBQW5DLENBQW9DO1FBRXRELFlBQ2lCLGFBQTZCLEVBQ04sa0JBQXdDO1lBRS9FLEtBQUssRUFBRSxDQUFDO1lBRitCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFJL0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2pELE1BQU0sS0FBSyxHQUFHLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3JELElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1gsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxlQUFlLENBQ3RCLE1BQW1CLEVBQ25CLEtBQW1CO1lBRW5CLElBQUksQ0FBQyxDQUFDLE1BQU0sWUFBWSxpQ0FBWSxDQUFDLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxpQ0FBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNoRixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUM1QixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksYUFBdUMsQ0FBQztZQUM1QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDO1lBQzlDLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQzVCLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUM1QixhQUFhLEdBQUcsS0FBSyxDQUFDO29CQUN0QixNQUFNO2dCQUNQLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNwQixPQUFPO1lBQ1IsQ0FBQztZQUVELGFBQWEsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkMsQ0FBQzs7SUE1Q0ksd0JBQXdCO1FBSzNCLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEsMENBQW9CLENBQUE7T0FOakIsd0JBQXdCLENBNkM3QjtJQUVELElBQUEsOENBQThCLEVBQUMsd0JBQXdCLENBQUMsRUFBRSxFQUFFLHdCQUF3QixzQ0FBOEIsQ0FBQztJQUVuSCxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIseUJBQWdCLENBQUMsYUFBYSxDQUFDLENBQUMsd0JBQXdCLENBQzNGLDJEQUE0QixDQUFDLEVBQUUsRUFDL0IsMkRBQTRCLENBQUMsQ0FBQztJQUUvQixJQUFBLDhCQUFpQixFQUFDLGtEQUF3QixFQUFFLDhDQUFvQixvQ0FBNEIsQ0FBQztJQUU3RixJQUFBLHlCQUFlLEVBQUMsbURBQWlDLENBQUMsQ0FBQztJQUNuRCxJQUFBLHlCQUFlLEVBQUMsOENBQTRCLENBQUMsQ0FBQztJQUM5QyxJQUFBLHlCQUFlLEVBQUMsOENBQTRCLENBQUMsQ0FBQztJQUM5QyxJQUFBLHlCQUFlLEVBQUMsa0RBQWdDLENBQUMsQ0FBQztJQUNsRCxJQUFBLHlCQUFlLEVBQUMscUNBQW1CLENBQUMsQ0FBQyJ9