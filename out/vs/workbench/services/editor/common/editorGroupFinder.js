/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/editor/common/editor", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, configuration_1, editor_1, editor_2, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findGroup = findGroup;
    function findGroup(accessor, editor, preferredGroup) {
        const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const group = doFindGroup(editor, preferredGroup, editorGroupService, configurationService);
        if (group instanceof Promise) {
            return group.then(group => handleGroupActivation(group, editor, preferredGroup, editorGroupService));
        }
        return handleGroupActivation(group, editor, preferredGroup, editorGroupService);
    }
    function handleGroupActivation(group, editor, preferredGroup, editorGroupService) {
        // Resolve editor activation strategy
        let activation = undefined;
        if (editorGroupService.activeGroup !== group && // only if target group is not already active
            editor.options && !editor.options.inactive && // never for inactive editors
            editor.options.preserveFocus && // only if preserveFocus
            typeof editor.options.activation !== 'number' && // only if activation is not already defined (either true or false)
            preferredGroup !== editorService_1.SIDE_GROUP // never for the SIDE_GROUP
        ) {
            // If the resolved group is not the active one, we typically
            // want the group to become active. There are a few cases
            // where we stay away from encorcing this, e.g. if the caller
            // is already providing `activation`.
            //
            // Specifically for historic reasons we do not activate a
            // group is it is opened as `SIDE_GROUP` with `preserveFocus:true`.
            // repeated Alt-clicking of files in the explorer always open
            // into the same side group and not cause a group to be created each time.
            activation = editor_1.EditorActivation.ACTIVATE;
        }
        return [group, activation];
    }
    function doFindGroup(input, preferredGroup, editorGroupService, configurationService) {
        let group;
        const editor = (0, editor_2.isEditorInputWithOptions)(input) ? input.editor : input;
        const options = input.options;
        // Group: Instance of Group
        if (preferredGroup && typeof preferredGroup !== 'number') {
            group = preferredGroup;
        }
        // Group: Specific Group
        else if (typeof preferredGroup === 'number' && preferredGroup >= 0) {
            group = editorGroupService.getGroup(preferredGroup);
        }
        // Group: Side by Side
        else if (preferredGroup === editorService_1.SIDE_GROUP) {
            const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService);
            let candidateGroup = editorGroupService.findGroup({ direction });
            if (!candidateGroup || isGroupLockedForEditor(candidateGroup, editor)) {
                // Create new group either when the candidate group
                // is locked or was not found in the direction
                candidateGroup = editorGroupService.addGroup(editorGroupService.activeGroup, direction);
            }
            group = candidateGroup;
        }
        // Group: Aux Window
        else if (preferredGroup === editorService_1.AUX_WINDOW_GROUP) {
            group = editorGroupService.createAuxiliaryEditorPart().then(group => group.activeGroup);
        }
        // Group: Unspecified without a specific index to open
        else if (!options || typeof options.index !== 'number') {
            const groupsByLastActive = editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            // Respect option to reveal an editor if it is already visible in any group
            if (options?.revealIfVisible) {
                for (const lastActiveGroup of groupsByLastActive) {
                    if (isActive(lastActiveGroup, editor)) {
                        group = lastActiveGroup;
                        break;
                    }
                }
            }
            // Respect option to reveal an editor if it is open (not necessarily visible)
            // Still prefer to reveal an editor in a group where the editor is active though.
            // We also try to reveal an editor if it has the `Singleton` capability which
            // indicates that the same editor cannot be opened across groups.
            if (!group) {
                if (options?.revealIfOpened || configurationService.getValue('workbench.editor.revealIfOpen') || ((0, editor_2.isEditorInput)(editor) && editor.hasCapability(8 /* EditorInputCapabilities.Singleton */))) {
                    let groupWithInputActive = undefined;
                    let groupWithInputOpened = undefined;
                    for (const group of groupsByLastActive) {
                        if (isOpened(group, editor)) {
                            if (!groupWithInputOpened) {
                                groupWithInputOpened = group;
                            }
                            if (!groupWithInputActive && group.isActive(editor)) {
                                groupWithInputActive = group;
                            }
                        }
                        if (groupWithInputOpened && groupWithInputActive) {
                            break; // we found all groups we wanted
                        }
                    }
                    // Prefer a target group where the input is visible
                    group = groupWithInputActive || groupWithInputOpened;
                }
            }
        }
        // Fallback to active group if target not valid but avoid
        // locked editor groups unless editor is already opened there
        if (!group) {
            let candidateGroup = editorGroupService.activeGroup;
            // Locked group: find the next non-locked group
            // going up the neigbours of the group or create
            // a new group otherwise
            if (isGroupLockedForEditor(candidateGroup, editor)) {
                for (const group of editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                    if (isGroupLockedForEditor(group, editor)) {
                        continue;
                    }
                    candidateGroup = group;
                    break;
                }
                if (isGroupLockedForEditor(candidateGroup, editor)) {
                    // Group is still locked, so we have to create a new
                    // group to the side of the candidate group
                    group = editorGroupService.addGroup(candidateGroup, (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService));
                }
                else {
                    group = candidateGroup;
                }
            }
            // Non-locked group: take as is
            else {
                group = candidateGroup;
            }
        }
        return group;
    }
    function isGroupLockedForEditor(group, editor) {
        if (!group.isLocked) {
            // only relevant for locked editor groups
            return false;
        }
        if (isOpened(group, editor)) {
            // special case: the locked group contains
            // the provided editor. in that case we do not want
            // to open the editor in any different group.
            return false;
        }
        // group is locked for this editor
        return true;
    }
    function isActive(group, editor) {
        if (!group.activeEditor) {
            return false;
        }
        return group.activeEditor.matches(editor);
    }
    function isOpened(group, editor) {
        for (const typedEditor of group.editors) {
            if (typedEditor.matches(editor)) {
                return true;
            }
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3JvdXBGaW5kZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9lZGl0b3IvY29tbW9uL2VkaXRvckdyb3VwRmluZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0JoRyw4QkFVQztJQVZELFNBQWdCLFNBQVMsQ0FBQyxRQUEwQixFQUFFLE1BQW9ELEVBQUUsY0FBMEM7UUFDckosTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBDQUFvQixDQUFDLENBQUM7UUFDOUQsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7UUFFakUsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUM1RixJQUFJLEtBQUssWUFBWSxPQUFPLEVBQUUsQ0FBQztZQUM5QixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFDdEcsQ0FBQztRQUVELE9BQU8scUJBQXFCLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUNqRixDQUFDO0lBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFtQixFQUFFLE1BQW9ELEVBQUUsY0FBMEMsRUFBRSxrQkFBd0M7UUFFN0wscUNBQXFDO1FBQ3JDLElBQUksVUFBVSxHQUFpQyxTQUFTLENBQUM7UUFDekQsSUFDQyxrQkFBa0IsQ0FBQyxXQUFXLEtBQUssS0FBSyxJQUFNLDZDQUE2QztZQUMzRixNQUFNLENB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