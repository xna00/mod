/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/services/search/common/search"], function (require, exports, DOM, nls, searchModel_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.category = void 0;
    exports.isSearchViewFocused = isSearchViewFocused;
    exports.appendKeyBindingLabel = appendKeyBindingLabel;
    exports.getSearchView = getSearchView;
    exports.getElementsToOperateOn = getElementsToOperateOn;
    exports.shouldRefocus = shouldRefocus;
    exports.openSearchView = openSearchView;
    exports.category = nls.localize2('search', "Search");
    function isSearchViewFocused(viewsService) {
        const searchView = getSearchView(viewsService);
        return !!(searchView && DOM.isAncestorOfActiveElement(searchView.getContainer()));
    }
    function appendKeyBindingLabel(label, inputKeyBinding) {
        return doAppendKeyBindingLabel(label, inputKeyBinding);
    }
    function getSearchView(viewsService) {
        return viewsService.getActiveViewWithId(search_1.VIEW_ID);
    }
    function getElementsToOperateOn(viewer, currElement, sortConfig) {
        let elements = viewer.getSelection().filter((x) => x !== null).sort((a, b) => (0, searchModel_1.searchComparer)(a, b, sortConfig.sortOrder));
        // if selection doesn't include multiple elements, just return current focus element.
        if (currElement && !(elements.length > 1 && elements.includes(currElement))) {
            elements = [currElement];
        }
        return elements;
    }
    /**
     * @param elements elements that are going to be removed
     * @param focusElement element that is focused
     * @returns whether we need to re-focus on a remove
     */
    function shouldRefocus(elements, focusElement) {
        if (!focusElement) {
            return false;
        }
        return !focusElement || elements.includes(focusElement) || hasDownstreamMatch(elements, focusElement);
    }
    function hasDownstreamMatch(elements, focusElement) {
        for (const elem of elements) {
            if ((elem instanceof searchModel_1.FileMatch && focusElement instanceof searchModel_1.Match && elem.matches().includes(focusElement)) ||
                (elem instanceof searchModel_1.FolderMatch && ((focusElement instanceof searchModel_1.FileMatch && elem.getDownstreamFileMatch(focusElement.resource)) ||
                    (focusElement instanceof searchModel_1.Match && elem.getDownstreamFileMatch(focusElement.parent().resource))))) {
                return true;
            }
        }
        return false;
    }
    function openSearchView(viewsService, focus) {
        return viewsService.openView(search_1.VIEW_ID, focus).then(view => (view ?? undefined));
    }
    function doAppendKeyBindingLabel(label, keyBinding) {
        return keyBinding ? label + ' (' + keyBinding.getLabel() + ')' : label;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9uc0Jhc2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC9icm93c2VyL3NlYXJjaEFjdGlvbnNCYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxrREFHQztJQUVELHNEQUVDO0lBRUQsc0NBRUM7SUFFRCx3REFTQztJQU9ELHNDQUtDO0lBZ0JELHdDQUVDO0lBdERZLFFBQUEsUUFBUSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRTFELFNBQWdCLG1CQUFtQixDQUFDLFlBQTJCO1FBQzlELE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFVBQVUsSUFBSSxHQUFHLENBQUMseUJBQXlCLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNuRixDQUFDO0lBRUQsU0FBZ0IscUJBQXFCLENBQUMsS0FBYSxFQUFFLGVBQStDO1FBQ25HLE9BQU8sdUJBQXVCLENBQUMsS0FBSyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFRCxTQUFnQixhQUFhLENBQUMsWUFBMkI7UUFDeEQsT0FBTyxZQUFZLENBQUMsbUJBQW1CLENBQUMsZ0JBQU8sQ0FBZSxDQUFDO0lBQ2hFLENBQUM7SUFFRCxTQUFnQixzQkFBc0IsQ0FBQyxNQUE4RCxFQUFFLFdBQXdDLEVBQUUsVUFBMEM7UUFDMUwsSUFBSSxRQUFRLEdBQXNCLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQXdCLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBQSw0QkFBYyxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFFbksscUZBQXFGO1FBQ3JGLElBQUksV0FBVyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUM3RSxRQUFRLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBRUQsT0FBTyxRQUFRLENBQUM7SUFDakIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxTQUFnQixhQUFhLENBQUMsUUFBMkIsRUFBRSxZQUF5QztRQUNuRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDbkIsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ0QsT0FBTyxDQUFDLFlBQVksSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUN2RyxDQUFDO0lBRUQsU0FBUyxrQkFBa0IsQ0FBQyxRQUEyQixFQUFFLFlBQTZCO1FBQ3JGLEtBQUssTUFBTSxJQUFJLElBQUksUUFBUSxFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLElBQUksWUFBWSx1QkFBUyxJQUFJLFlBQVksWUFBWSxtQkFBSyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3hHLENBQUMsSUFBSSxZQUFZLHlCQUFXLElBQUksQ0FDL0IsQ0FBQyxZQUFZLFlBQVksdUJBQVMsSUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUN6RixDQUFDLFlBQVksWUFBWSxtQkFBSyxJQUFJLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FDOUYsQ0FBQyxFQUFFLENBQUM7Z0JBQ0wsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFDO0lBRWQsQ0FBQztJQUVELFNBQWdCLGNBQWMsQ0FBQyxZQUEyQixFQUFFLEtBQWU7UUFDMUUsT0FBTyxZQUFZLENBQUMsUUFBUSxDQUFDLGdCQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFrQixJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDOUYsQ0FBQztJQUVELFNBQVMsdUJBQXVCLENBQUMsS0FBYSxFQUFFLFVBQTBDO1FBQ3pGLE9BQU8sVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxHQUFHLFVBQVUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUN4RSxDQUFDIn0=