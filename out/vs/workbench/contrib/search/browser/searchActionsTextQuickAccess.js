define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/workbench/contrib/search/browser/searchActionsBase", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/search/browser/quickTextSearch/textSearchQuickAccess", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/search/browser/searchView"], function (require, exports, nls, actions_1, searchActionsBase_1, quickInput_1, textSearchQuickAccess_1, editorService_1, configuration_1, searchView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(class TextSearchQuickAccessAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "workbench.action.experimental.quickTextSearch" /* Constants.SearchCommandIds.QuickTextSearchActionId */,
                title: nls.localize2('quickTextSearch', "Quick Search (Experimental)"),
                category: searchActionsBase_1.category,
                f1: true
            });
        }
        async run(accessor, match) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const searchText = getSearchText(accessor) ?? '';
            quickInputService.quickAccess.show(textSearchQuickAccess_1.TEXT_SEARCH_QUICK_ACCESS_PREFIX + searchText, { preserveValue: !!searchText });
        }
    });
    function getSearchText(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const activeEditor = editorService.activeTextEditorControl;
        if (!activeEditor) {
            return null;
        }
        if (!activeEditor.hasTextFocus()) {
            return null;
        }
        // only happen if it would also happen for the search view
        const seedSearchStringFromSelection = configurationService.getValue('editor.find.seedSearchStringFromSelection');
        if (!seedSearchStringFromSelection) {
            return null;
        }
        return (0, searchView_1.getSelectionTextFromEditor)(false, activeEditor);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9uc1RleHRRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2Jyb3dzZXIvc2VhcmNoQWN0aW9uc1RleHRRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFpQkEsSUFBQSx5QkFBZSxFQUFDLE1BQU0sMkJBQTRCLFNBQVEsaUJBQU87UUFFaEU7WUFFQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSwwR0FBb0Q7Z0JBQ3RELEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLDZCQUE2QixDQUFDO2dCQUN0RSxRQUFRLEVBQVIsNEJBQVE7Z0JBQ1IsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFFSixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLEtBQWtDO1lBQ2hGLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1lBQzNELE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakQsaUJBQWlCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyx1REFBK0IsR0FBRyxVQUFVLEVBQUUsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDbkgsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILFNBQVMsYUFBYSxDQUFDLFFBQTBCO1FBQ2hELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1FBRWpFLE1BQU0sWUFBWSxHQUFZLGFBQWEsQ0FBQyx1QkFBa0MsQ0FBQztRQUMvRSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDbkIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDO1lBQ2xDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELDBEQUEwRDtRQUMxRCxNQUFNLDZCQUE2QixHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSwyQ0FBMkMsQ0FBQyxDQUFDO1FBQzFILElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO1lBQ3BDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU8sSUFBQSx1Q0FBMEIsRUFBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDeEQsQ0FBQyJ9