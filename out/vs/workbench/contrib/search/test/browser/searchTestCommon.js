/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/services/modelService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/workbench/contrib/notebook/browser/services/notebookEditorServiceImpl", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, platform_1, uri_1, modelService_1, configuration_1, testConfigurationService_1, contextkey_1, mockKeybindingService_1, themeService_1, testThemeService_1, notebookEditorServiceImpl_1, editorGroupsService_1, editorService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createFileUriFromPathFromRoot = createFileUriFromPathFromRoot;
    exports.getRootName = getRootName;
    exports.stubModelService = stubModelService;
    exports.stubNotebookEditorService = stubNotebookEditorService;
    exports.addToSearchResult = addToSearchResult;
    function createFileUriFromPathFromRoot(path) {
        const rootName = getRootName();
        if (path) {
            return uri_1.URI.file(`${rootName}${path}`);
        }
        else {
            if (platform_1.isWindows) {
                return uri_1.URI.file(`${rootName}/`);
            }
            else {
                return uri_1.URI.file(rootName);
            }
        }
    }
    function getRootName() {
        if (platform_1.isWindows) {
            return 'c:';
        }
        else {
            return '';
        }
    }
    function stubModelService(instantiationService, addDisposable) {
        instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
        const config = new testConfigurationService_1.TestConfigurationService();
        config.setUserConfiguration('search', { searchOnType: true });
        instantiationService.stub(configuration_1.IConfigurationService, config);
        const modelService = instantiationService.createInstance(modelService_1.ModelService);
        addDisposable(modelService);
        return modelService;
    }
    function stubNotebookEditorService(instantiationService, addDisposable) {
        instantiationService.stub(editorGroupsService_1.IEditorGroupsService, new workbenchTestServices_1.TestEditorGroupsService());
        instantiationService.stub(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
        const es = new workbenchTestServices_1.TestEditorService();
        addDisposable(es);
        instantiationService.stub(editorService_1.IEditorService, es);
        const notebookEditorWidgetService = instantiationService.createInstance(notebookEditorServiceImpl_1.NotebookEditorWidgetService);
        addDisposable(notebookEditorWidgetService);
        return notebookEditorWidgetService;
    }
    function addToSearchResult(searchResult, allRaw, searchInstanceID = '') {
        searchResult.add(allRaw, searchInstanceID, false);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoVGVzdENvbW1vbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL3Rlc3QvYnJvd3Nlci9zZWFyY2hUZXN0Q29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0JoRyxzRUFXQztJQUVELGtDQU1DO0lBRUQsNENBUUM7SUFFRCw4REFTQztJQUVELDhDQUVDO0lBNUNELFNBQWdCLDZCQUE2QixDQUFDLElBQWE7UUFDMUQsTUFBTSxRQUFRLEdBQUcsV0FBVyxFQUFFLENBQUM7UUFDL0IsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNWLE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7YUFBTSxDQUFDO1lBQ1AsSUFBSSxvQkFBUyxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxTQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNqQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxTQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzNCLENBQUM7UUFDRixDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQWdCLFdBQVc7UUFDMUIsSUFBSSxvQkFBUyxFQUFFLENBQUM7WUFDZixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7YUFBTSxDQUFDO1lBQ1AsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQWdCLGdCQUFnQixDQUFDLG9CQUE4QyxFQUFFLGFBQXVDO1FBQ3ZILG9CQUFvQixDQUFDLElBQUksQ0FBQyw0QkFBYSxFQUFFLElBQUksbUNBQWdCLEVBQUUsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sTUFBTSxHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztRQUM5QyxNQUFNLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDOUQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHFDQUFxQixFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3pELE1BQU0sWUFBWSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBWSxDQUFDLENBQUM7UUFDdkUsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzVCLE9BQU8sWUFBWSxDQUFDO0lBQ3JCLENBQUM7SUFFRCxTQUFnQix5QkFBeUIsQ0FBQyxvQkFBOEMsRUFBRSxhQUF1QztRQUNoSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsMENBQW9CLEVBQUUsSUFBSSwrQ0FBdUIsRUFBRSxDQUFDLENBQUM7UUFDL0Usb0JBQW9CLENBQUMsSUFBSSxDQUFDLCtCQUFrQixFQUFFLElBQUksNkNBQXFCLEVBQUUsQ0FBQyxDQUFDO1FBQzNFLE1BQU0sRUFBRSxHQUFHLElBQUkseUNBQWlCLEVBQUUsQ0FBQztRQUNuQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEIsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDhCQUFjLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDOUMsTUFBTSwyQkFBMkIsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsdURBQTJCLENBQUMsQ0FBQztRQUNyRyxhQUFhLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUMzQyxPQUFPLDJCQUEyQixDQUFDO0lBQ3BDLENBQUM7SUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxZQUEwQixFQUFFLE1BQW9CLEVBQUUsZ0JBQWdCLEdBQUcsRUFBRTtRQUN4RyxZQUFZLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNuRCxDQUFDIn0=