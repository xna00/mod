/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/descriptors", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditor", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditorInput", "./actions", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffSourceResolverService", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/multiDiffEditor/browser/scmMultiDiffSourceResolver"], function (require, exports, nls_1, actions_1, configurationRegistry_1, descriptors_1, platform_1, editor_1, contributions_1, editor_2, multiDiffEditor_1, multiDiffEditorInput_1, actions_2, multiDiffSourceResolverService_1, extensions_1, scmMultiDiffSourceResolver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(actions_2.GoToFileAction);
    (0, actions_1.registerAction2)(actions_2.CollapseAllAction);
    (0, actions_1.registerAction2)(actions_2.ExpandAllAction);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        properties: {
            'multiDiffEditor.experimental.enabled': {
                type: 'boolean',
                default: true,
                description: 'Enable experimental multi diff editor.',
            },
        }
    });
    (0, extensions_1.registerSingleton)(multiDiffSourceResolverService_1.IMultiDiffSourceResolverService, multiDiffSourceResolverService_1.MultiDiffSourceResolverService, 1 /* InstantiationType.Delayed */);
    // Editor Integration
    (0, contributions_1.registerWorkbenchContribution2)(multiDiffEditorInput_1.MultiDiffEditorResolverContribution.ID, multiDiffEditorInput_1.MultiDiffEditorResolverContribution, 1 /* WorkbenchPhase.BlockStartup */);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane)
        .registerEditorPane(editor_1.EditorPaneDescriptor.create(multiDiffEditor_1.MultiDiffEditor, multiDiffEditor_1.MultiDiffEditor.ID, (0, nls_1.localize)('name', "Multi Diff Editor")), [new descriptors_1.SyncDescriptor(multiDiffEditorInput_1.MultiDiffEditorInput)]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory)
        .registerEditorSerializer(multiDiffEditorInput_1.MultiDiffEditorInput.ID, multiDiffEditorInput_1.MultiDiffEditorSerializer);
    // SCM integration
    (0, actions_1.registerAction2)(scmMultiDiffSourceResolver_1.OpenScmGroupAction);
    (0, contributions_1.registerWorkbenchContribution2)(scmMultiDiffSourceResolver_1.ScmMultiDiffSourceResolverContribution.ID, scmMultiDiffSourceResolver_1.ScmMultiDiffSourceResolverContribution, 1 /* WorkbenchPhase.BlockStartup */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmRWRpdG9yLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbXVsdGlEaWZmRWRpdG9yL2Jyb3dzZXIvbXVsdGlEaWZmRWRpdG9yLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWlCaEcsSUFBQSx5QkFBZSxFQUFDLHdCQUFjLENBQUMsQ0FBQztJQUNoQyxJQUFBLHlCQUFlLEVBQUMsMkJBQWlCLENBQUMsQ0FBQztJQUNuQyxJQUFBLHlCQUFlLEVBQUMseUJBQWUsQ0FBQyxDQUFDO0lBRWpDLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBVSxDQUFDLGFBQWEsQ0FBQztTQUMzRCxxQkFBcUIsQ0FBQztRQUN0QixVQUFVLEVBQUU7WUFDWCxzQ0FBc0MsRUFBRTtnQkFDdkMsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsV0FBVyxFQUFFLHdDQUF3QzthQUNyRDtTQUNEO0tBQ0QsQ0FBQyxDQUFDO0lBRUosSUFBQSw4QkFBaUIsRUFBQyxnRUFBK0IsRUFBRSwrREFBOEIsb0NBQTRCLENBQUM7SUFFOUcscUJBQXFCO0lBQ3JCLElBQUEsOENBQThCLEVBQUMsMERBQW1DLENBQUMsRUFBRSxFQUFFLDBEQUFtQyxzQ0FBd0UsQ0FBQztJQUVuTCxtQkFBUSxDQUFDLEVBQUUsQ0FBc0IseUJBQWdCLENBQUMsVUFBVSxDQUFDO1NBQzNELGtCQUFrQixDQUNsQiw2QkFBb0IsQ0FBQyxNQUFNLENBQUMsaUNBQWUsRUFBRSxpQ0FBZSxDQUFDLEVBQUUsRUFBRSxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxFQUN2RyxDQUFDLElBQUksNEJBQWMsQ0FBQywyQ0FBb0IsQ0FBQyxDQUFDLENBQzFDLENBQUM7SUFFSCxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIseUJBQWdCLENBQUMsYUFBYSxDQUFDO1NBQ2pFLHdCQUF3QixDQUFDLDJDQUFvQixDQUFDLEVBQUUsRUFBRSxnREFBeUIsQ0FBQyxDQUFDO0lBRS9FLGtCQUFrQjtJQUNsQixJQUFBLHlCQUFlLEVBQUMsK0NBQWtCLENBQUMsQ0FBQztJQUNwQyxJQUFBLDhDQUE4QixFQUFDLG1FQUFzQyxDQUFDLEVBQUUsRUFBRSxtRUFBc0Msc0NBQXlFLENBQUMifQ==