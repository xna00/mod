/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/contrib/files/common/files", "vs/workbench/common/editor", "vs/base/browser/ui/list/listWidget", "vs/workbench/contrib/files/common/explorerModel", "vs/base/common/arrays", "vs/base/browser/ui/tree/asyncDataTree", "vs/platform/instantiation/common/instantiation", "vs/base/browser/dom"], function (require, exports, uri_1, files_1, editor_1, listWidget_1, explorerModel_1, arrays_1, asyncDataTree_1, instantiation_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExplorerService = void 0;
    exports.getResourceForCommand = getResourceForCommand;
    exports.getMultiSelectedResources = getMultiSelectedResources;
    exports.getOpenEditorsViewMultiSelection = getOpenEditorsViewMultiSelection;
    exports.IExplorerService = (0, instantiation_1.createDecorator)('explorerService');
    function getFocus(listService) {
        const list = listService.lastFocusedList;
        const element = list?.getHTMLElement();
        if (element && (0, dom_1.isActiveElement)(element)) {
            let focus;
            if (list instanceof listWidget_1.List) {
                const focused = list.getFocusedElements();
                if (focused.length) {
                    focus = focused[0];
                }
            }
            else if (list instanceof asyncDataTree_1.AsyncDataTree) {
                const focused = list.getFocus();
                if (focused.length) {
                    focus = focused[0];
                }
            }
            return focus;
        }
        return undefined;
    }
    // Commands can get executed from a command palette, from a context menu or from some list using a keybinding
    // To cover all these cases we need to properly compute the resource on which the command is being executed
    function getResourceForCommand(resource, listService, editorService) {
        if (uri_1.URI.isUri(resource)) {
            return resource;
        }
        const focus = getFocus(listService);
        if (focus instanceof explorerModel_1.ExplorerItem) {
            return focus.resource;
        }
        else if (focus instanceof files_1.OpenEditor) {
            return focus.getResource();
        }
        return editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
    }
    function getMultiSelectedResources(resource, listService, editorService, explorerService) {
        const list = listService.lastFocusedList;
        const element = list?.getHTMLElement();
        if (element && (0, dom_1.isActiveElement)(element)) {
            // Explorer
            if (list instanceof asyncDataTree_1.AsyncDataTree && list.getFocus().every(item => item instanceof explorerModel_1.ExplorerItem)) {
                // Explorer
                const context = explorerService.getContext(true, true);
                if (context.length) {
                    return context.map(c => c.resource);
                }
            }
            // Open editors view
            if (list instanceof listWidget_1.List) {
                const selection = (0, arrays_1.coalesce)(list.getSelectedElements().filter(s => s instanceof files_1.OpenEditor).map((oe) => oe.getResource()));
                const focusedElements = list.getFocusedElements();
                const focus = focusedElements.length ? focusedElements[0] : undefined;
                let mainUriStr = undefined;
                if (uri_1.URI.isUri(resource)) {
                    mainUriStr = resource.toString();
                }
                else if (focus instanceof files_1.OpenEditor) {
                    const focusedResource = focus.getResource();
                    mainUriStr = focusedResource ? focusedResource.toString() : undefined;
                }
                // We only respect the selection if it contains the main element.
                if (selection.some(s => s.toString() === mainUriStr)) {
                    return selection;
                }
            }
        }
        const result = getResourceForCommand(resource, listService, editorService);
        return !!result ? [result] : [];
    }
    function getOpenEditorsViewMultiSelection(listService, editorGroupService) {
        const list = listService.lastFocusedList;
        const element = list?.getHTMLElement();
        if (element && (0, dom_1.isActiveElement)(element)) {
            // Open editors view
            if (list instanceof listWidget_1.List) {
                const selection = (0, arrays_1.coalesce)(list.getSelectedElements().filter(s => s instanceof files_1.OpenEditor));
                const focusedElements = list.getFocusedElements();
                const focus = focusedElements.length ? focusedElements[0] : undefined;
                let mainEditor = undefined;
                if (focus instanceof files_1.OpenEditor) {
                    mainEditor = focus;
                }
                // We only respect the selection if it contains the main element.
                if (selection.some(s => s === mainEditor)) {
                    return selection;
                }
                return mainEditor ? [mainEditor] : undefined;
            }
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ZpbGVzL2Jyb3dzZXIvZmlsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBeUZoRyxzREFhQztJQUVELDhEQWtDQztJQUVELDRFQXNCQztJQXBIWSxRQUFBLGdCQUFnQixHQUFHLElBQUEsK0JBQWUsRUFBbUIsaUJBQWlCLENBQUMsQ0FBQztJQWtCckYsU0FBUyxRQUFRLENBQUMsV0FBeUI7UUFDMUMsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FBQztRQUN6QyxNQUFNLE9BQU8sR0FBRyxJQUFJLEVBQUUsY0FBYyxFQUFFLENBQUM7UUFDdkMsSUFBSSxPQUFPLElBQUksSUFBQSxxQkFBZSxFQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDekMsSUFBSSxLQUFjLENBQUM7WUFDbkIsSUFBSSxJQUFJLFlBQVksaUJBQUksRUFBRSxDQUFDO2dCQUMxQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3BCLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksSUFBSSxZQUFZLDZCQUFhLEVBQUUsQ0FBQztnQkFDMUMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDcEIsS0FBSyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEIsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxPQUFP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