/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/customEditor/browser/customEditorInputFactory", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/webviewPanel/browser/webviewEditor", "./customEditorInput", "./customEditors"], function (require, exports, descriptors_1, extensions_1, platform_1, editor_1, contributions_1, editor_2, customEditorInputFactory_1, customEditor_1, webviewEditor_1, customEditorInput_1, customEditors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(customEditor_1.ICustomEditorService, customEditors_1.CustomEditorService, 1 /* InstantiationType.Delayed */);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane)
        .registerEditorPane(editor_1.EditorPaneDescriptor.create(webviewEditor_1.WebviewEditor, webviewEditor_1.WebviewEditor.ID, 'Webview Editor'), [
        new descriptors_1.SyncDescriptor(customEditorInput_1.CustomEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory)
        .registerEditorSerializer(customEditorInputFactory_1.CustomEditorInputSerializer.ID, customEditorInputFactory_1.CustomEditorInputSerializer);
    (0, contributions_1.registerWorkbenchContribution2)(customEditorInputFactory_1.ComplexCustomWorkingCopyEditorHandler.ID, customEditorInputFactory_1.ComplexCustomWorkingCopyEditorHandler, 1 /* WorkbenchPhase.BlockStartup */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tRWRpdG9yLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY3VzdG9tRWRpdG9yL2Jyb3dzZXIvY3VzdG9tRWRpdG9yLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWNoRyxJQUFBLDhCQUFpQixFQUFDLG1DQUFvQixFQUFFLG1DQUFtQixvQ0FBNEIsQ0FBQztJQUV4RixtQkFBUSxDQUFDLEVBQUUsQ0FBc0IseUJBQWdCLENBQUMsVUFBVSxDQUFDO1NBQzNELGtCQUFrQixDQUNsQiw2QkFBb0IsQ0FBQyxNQUFNLENBQzFCLDZCQUFhLEVBQ2IsNkJBQWEsQ0FBQyxFQUFFLEVBQ2hCLGdCQUFnQixDQUNoQixFQUFFO1FBQ0gsSUFBSSw0QkFBYyxDQUFDLHFDQUFpQixDQUFDO0tBQ3JDLENBQUMsQ0FBQztJQUVKLG1CQUFRLENBQUMsRUFBRSxDQUF5Qix5QkFBZ0IsQ0FBQyxhQUFhLENBQUM7U0FDakUsd0JBQXdCLENBQUMsc0RBQTJCLENBQUMsRUFBRSxFQUFFLHNEQUEyQixDQUFDLENBQUM7SUFFeEYsSUFBQSw4Q0FBOEIsRUFBQyxnRUFBcUMsQ0FBQyxFQUFFLEVBQUUsZ0VBQXFDLHNDQUE4QixDQUFDIn0=