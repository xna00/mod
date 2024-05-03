define(["require", "exports", "vs/nls", "vs/base/common/filters", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/platform/label/common/label"], function (require, exports, nls, filters_1, quickInput_1, debug_1, editorService_1, getIconClasses_1, model_1, language_1, lifecycle_1, resources_1, label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showLoadedScriptMenu = showLoadedScriptMenu;
    /**
     * This function takes a regular quickpick and makes one for loaded scripts that has persistent headers
     * e.g. when some picks are filtered out, the ones that are visible still have its header.
     */
    async function showLoadedScriptMenu(accessor) {
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        const debugService = accessor.get(debug_1.IDebugService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const sessions = debugService.getModel().getSessions(false);
        const modelService = accessor.get(model_1.IModelService);
        const languageService = accessor.get(language_1.ILanguageService);
        const labelService = accessor.get(label_1.ILabelService);
        const localDisposableStore = new lifecycle_1.DisposableStore();
        const quickPick = quickInputService.createQuickPick();
        localDisposableStore.add(quickPick);
        quickPick.matchOnLabel = quickPick.matchOnDescription = quickPick.matchOnDetail = quickPick.sortByLabel = false;
        quickPick.placeholder = nls.localize('moveFocusedView.selectView', "Search loaded scripts by name");
        quickPick.items = await _getPicks(quickPick.value, sessions, editorService, modelService, languageService, labelService);
        localDisposableStore.add(quickPick.onDidChangeValue(async () => {
            quickPick.items = await _getPicks(quickPick.value, sessions, editorService, modelService, languageService, labelService);
        }));
        localDisposableStore.add(quickPick.onDidAccept(() => {
            const selectedItem = quickPick.selectedItems[0];
            selectedItem.accept();
            quickPick.hide();
            localDisposableStore.dispose();
        }));
        quickPick.show();
    }
    async function _getPicksFromSession(session, filter, editorService, modelService, languageService, labelService) {
        const items = [];
        items.push({ type: 'separator', label: session.name });
        const sources = await session.getLoadedSources();
        sources.forEach((element) => {
            const pick = _createPick(element, filter, editorService, modelService, languageService, labelService);
            if (pick) {
                items.push(pick);
            }
        });
        return items;
    }
    async function _getPicks(filter, sessions, editorService, modelService, languageService, labelService) {
        const loadedScriptPicks = [];
        const picks = await Promise.all(sessions.map((session) => _getPicksFromSession(session, filter, editorService, modelService, languageService, labelService)));
        for (const row of picks) {
            for (const elem of row) {
                loadedScriptPicks.push(elem);
            }
        }
        return loadedScriptPicks;
    }
    function _createPick(source, filter, editorService, modelService, languageService, labelService) {
        const label = labelService.getUriBasenameLabel(source.uri);
        const desc = labelService.getUriLabel((0, resources_1.dirname)(source.uri));
        // manually filter so that headers don't get filtered out
        const labelHighlights = (0, filters_1.matchesFuzzy)(filter, label, true);
        const descHighlights = (0, filters_1.matchesFuzzy)(filter, desc, true);
        if (labelHighlights || descHighlights) {
            return {
                label,
                description: desc === '.' ? undefined : desc,
                highlights: { label: labelHighlights ?? undefined, description: descHighlights ?? undefined },
                iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, source.uri),
                accept: () => {
                    if (source.available) {
                        source.openInEditor(editorService, { startLineNumber: 0, startColumn: 0, endLineNumber: 0, endColumn: 0 });
                    }
                }
            };
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGVkU2NyaXB0c1BpY2tlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvY29tbW9uL2xvYWRlZFNjcmlwdHNQaWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBMkJBLG9EQTBCQztJQTlCRDs7O09BR0c7SUFDSSxLQUFLLFVBQVUsb0JBQW9CLENBQUMsUUFBMEI7UUFDcEUsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7UUFDM0QsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQkFBYSxDQUFDLENBQUM7UUFDakQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7UUFDbkQsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1RCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFCQUFhLENBQUMsQ0FBQztRQUNqRCxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDJCQUFnQixDQUFDLENBQUM7UUFDdkQsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQkFBYSxDQUFDLENBQUM7UUFFakQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUNuRCxNQUFNLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQyxlQUFlLEVBQW9CLENBQUM7UUFDeEUsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxhQUFhLEdBQUcsU0FBUyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFDaEgsU0FBUyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLCtCQUErQixDQUFDLENBQUM7UUFDcEcsU0FBUyxDQUFDLEtBQUssR0FBRyxNQUFNLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUV6SCxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLEtBQUssSUFBSSxFQUFFO1lBQzlELFNBQVMsQ0FBQyxLQUFLLEdBQUcsTUFBTSxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDMUgsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRTtZQUNuRCxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hELFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN0QixTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakIsb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNsQixDQUFDO0lBRUQsS0FBSyxVQUFVLG9CQUFvQixDQUFDLE9BQXNCLEVBQUUsTUFBYyxFQUFFLGFBQTZCLEVBQUUsWUFBMkIsRUFBRSxlQUFpQyxFQUFFLFlBQTJCO1FBQ3JNLE1BQU0sS0FBSyxHQUFrRCxFQUFFLENBQUM7UUFDaEUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFFakQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQWUsRUFBRSxFQUFFO1lBQ25DLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsZUFBZSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3RHLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1YsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQixDQUFDO1FBRUYsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFDRCxLQUFLLFVBQVUsU0FBUyxDQUFDLE1BQWMsRUFBRSxRQUF5QixFQUFFLGFBQTZCLEVBQUUsWUFBMkIsRUFBRSxlQUFpQyxFQUFFLFlBQTJCO1FBQzdMLE1BQU0saUJBQWlCLEdBQWtELEVBQUUsQ0FBQztRQUc1RSxNQUFNLEtBQUssR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQzlCLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FDNUgsQ0FBQztRQUVGLEtBQUssTUFBTSxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7WUFDekIsS0FBSyxNQUFNLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDeEIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxpQkFBaUIsQ0FBQztJQUMxQixDQUFDO0lBRUQsU0FBUyxXQUFXLENBQUMsTUFBYyxFQUFFLE1BQWMsRUFBRSxhQUE2QixFQUFFLFlBQTJCLEVBQUUsZUFBaUMsRUFBRSxZQUEyQjtRQUU5SyxNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNELE1BQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsSUFBQSxtQkFBTyxFQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRTNELHlEQUF5RDtRQUN6RCxNQUFNLGVBQWUsR0FBRyxJQUFBLHNCQUFZLEVBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMxRCxNQUFNLGNBQWMsR0FBRyxJQUFBLHNCQUFZLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4RCxJQUFJLGVBQWUsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUN2QyxPQUFPO2dCQUNOLEtBQUs7Z0JBQ0wsV0FBVyxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSTtnQkFDNUMsVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLGVBQWUsSUFBSSxTQUFTLEVBQUUsV0FBVyxFQUFFLGNBQWMsSUFBSSxTQUFTLEVBQUU7Z0JBQzdGLFdBQVcsRUFBRSxJQUFBLCtCQUFjLEVBQUMsWUFBWSxFQUFFLGVBQWUsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDO2dCQUN0RSxNQUFNLEVBQUUsR0FBRyxFQUFFO29CQUNaLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO3dCQUN0QixNQUFNLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxFQUFFLGVBQWUsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxhQUFhLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUM1RyxDQUFDO2dCQUNGLENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUMifQ==