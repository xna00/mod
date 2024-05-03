/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NEW_FILE_COMMAND_ID = exports.NEW_UNTITLED_FILE_LABEL = exports.NEW_UNTITLED_FILE_COMMAND_ID = exports.LAST_COMPRESSED_FOLDER = exports.FIRST_COMPRESSED_FOLDER = exports.NEXT_COMPRESSED_FOLDER = exports.PREVIOUS_COMPRESSED_FOLDER = exports.REMOVE_ROOT_FOLDER_LABEL = exports.REMOVE_ROOT_FOLDER_COMMAND_ID = exports.ResourceSelectedForCompareContext = exports.OpenEditorsReadonlyEditorContext = exports.OpenEditorsDirtyEditorContext = exports.OpenEditorsGroupContext = exports.SAVE_FILES_COMMAND_ID = exports.SAVE_ALL_IN_GROUP_COMMAND_ID = exports.SAVE_ALL_LABEL = exports.SAVE_ALL_COMMAND_ID = exports.SAVE_FILE_WITHOUT_FORMATTING_LABEL = exports.SAVE_FILE_WITHOUT_FORMATTING_COMMAND_ID = exports.SAVE_FILE_LABEL = exports.SAVE_FILE_COMMAND_ID = exports.SAVE_FILE_AS_LABEL = exports.SAVE_FILE_AS_COMMAND_ID = exports.COPY_RELATIVE_PATH_COMMAND_ID = exports.COPY_PATH_COMMAND_ID = exports.COMPARE_WITH_SAVED_COMMAND_ID = exports.COMPARE_RESOURCE_COMMAND_ID = exports.COMPARE_SELECTED_COMMAND_ID = exports.SELECT_FOR_COMPARE_COMMAND_ID = exports.OPEN_WITH_EXPLORER_COMMAND_ID = exports.OPEN_TO_SIDE_COMMAND_ID = exports.REVERT_FILE_COMMAND_ID = exports.REVEAL_IN_EXPLORER_COMMAND_ID = void 0;
    exports.REVEAL_IN_EXPLORER_COMMAND_ID = 'revealInExplorer';
    exports.REVERT_FILE_COMMAND_ID = 'workbench.action.files.revert';
    exports.OPEN_TO_SIDE_COMMAND_ID = 'explorer.openToSide';
    exports.OPEN_WITH_EXPLORER_COMMAND_ID = 'explorer.openWith';
    exports.SELECT_FOR_COMPARE_COMMAND_ID = 'selectForCompare';
    exports.COMPARE_SELECTED_COMMAND_ID = 'compareSelected';
    exports.COMPARE_RESOURCE_COMMAND_ID = 'compareFiles';
    exports.COMPARE_WITH_SAVED_COMMAND_ID = 'workbench.files.action.compareWithSaved';
    exports.COPY_PATH_COMMAND_ID = 'copyFilePath';
    exports.COPY_RELATIVE_PATH_COMMAND_ID = 'copyRelativeFilePath';
    exports.SAVE_FILE_AS_COMMAND_ID = 'workbench.action.files.saveAs';
    exports.SAVE_FILE_AS_LABEL = nls.localize2('saveAs', "Save As...");
    exports.SAVE_FILE_COMMAND_ID = 'workbench.action.files.save';
    exports.SAVE_FILE_LABEL = nls.localize2('save', "Save");
    exports.SAVE_FILE_WITHOUT_FORMATTING_COMMAND_ID = 'workbench.action.files.saveWithoutFormatting';
    exports.SAVE_FILE_WITHOUT_FORMATTING_LABEL = nls.localize2('saveWithoutFormatting', "Save without Formatting");
    exports.SAVE_ALL_COMMAND_ID = 'saveAll';
    exports.SAVE_ALL_LABEL = nls.localize2('saveAll', "Save All");
    exports.SAVE_ALL_IN_GROUP_COMMAND_ID = 'workbench.files.action.saveAllInGroup';
    exports.SAVE_FILES_COMMAND_ID = 'workbench.action.files.saveFiles';
    exports.OpenEditorsGroupContext = new contextkey_1.RawContextKey('groupFocusedInOpenEditors', false);
    exports.OpenEditorsDirtyEditorContext = new contextkey_1.RawContextKey('dirtyEditorFocusedInOpenEditors', false);
    exports.OpenEditorsReadonlyEditorContext = new contextkey_1.RawContextKey('readonlyEditorFocusedInOpenEditors', false);
    exports.ResourceSelectedForCompareContext = new contextkey_1.RawContextKey('resourceSelectedForCompare', false);
    exports.REMOVE_ROOT_FOLDER_COMMAND_ID = 'removeRootFolder';
    exports.REMOVE_ROOT_FOLDER_LABEL = nls.localize('removeFolderFromWorkspace', "Remove Folder from Workspace");
    exports.PREVIOUS_COMPRESSED_FOLDER = 'previousCompressedFolder';
    exports.NEXT_COMPRESSED_FOLDER = 'nextCompressedFolder';
    exports.FIRST_COMPRESSED_FOLDER = 'firstCompressedFolder';
    exports.LAST_COMPRESSED_FOLDER = 'lastCompressedFolder';
    exports.NEW_UNTITLED_FILE_COMMAND_ID = 'workbench.action.files.newUntitledFile';
    exports.NEW_UNTITLED_FILE_LABEL = nls.localize2('newUntitledFile', "New Untitled Text File");
    exports.NEW_FILE_COMMAND_ID = 'workbench.action.files.newFile';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUNvbnN0YW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvYnJvd3Nlci9maWxlQ29uc3RhbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtuRixRQUFBLDZCQUE2QixHQUFHLGtCQUFrQixDQUFDO0lBQ25ELFFBQUEsc0JBQXNCLEdBQUcsK0JBQStCLENBQUM7SUFDekQsUUFBQSx1QkFBdUIsR0FBRyxxQkFBcUIsQ0FBQztJQUNoRCxRQUFBLDZCQUE2QixHQUFHLG1CQUFtQixDQUFDO0lBQ3BELFFBQUEsNkJBQTZCLEdBQUcsa0JBQWtCLENBQUM7SUFFbkQsUUFBQSwyQkFBMkIsR0FBRyxpQkFBaUIsQ0FBQztJQUNoRCxRQUFBLDJCQUEyQixHQUFHLGNBQWMsQ0FBQztJQUM3QyxRQUFBLDZCQUE2QixHQUFHLHlDQUF5QyxDQUFDO0lBQzFFLFFBQUEsb0JBQW9CLEdBQUcsY0FBYyxDQUFDO0lBQ3RDLFFBQUEsNkJBQTZCLEdBQUcsc0JBQXNCLENBQUM7SUFFdkQsUUFBQSx1QkFBdUIsR0FBRywrQkFBK0IsQ0FBQztJQUMxRCxRQUFBLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQzNELFFBQUEsb0JBQW9CLEdBQUcsNkJBQTZCLENBQUM7SUFDckQsUUFBQSxlQUFlLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDaEQsUUFBQSx1Q0FBdUMsR0FBRyw4Q0FBOEMsQ0FBQztJQUN6RixRQUFBLGtDQUFrQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLEVBQUUseUJBQXlCLENBQUMsQ0FBQztJQUV2RyxRQUFBLG1CQUFtQixHQUFHLFNBQVMsQ0FBQztJQUNoQyxRQUFBLGNBQWMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUV0RCxRQUFBLDRCQUE0QixHQUFHLHVDQUF1QyxDQUFDO0lBRXZFLFFBQUEscUJBQXFCLEdBQUcsa0NBQWtDLENBQUM7SUFFM0QsUUFBQSx1QkFBdUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsMkJBQTJCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDekYsUUFBQSw2QkFBNkIsR0FBRyxJQUFJLDBCQUFhLENBQVUsaUNBQWlDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDckcsUUFBQSxnQ0FBZ0MsR0FBRyxJQUFJLDBCQUFhLENBQVUsb0NBQW9DLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0csUUFBQSxpQ0FBaUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsNEJBQTRCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFcEcsUUFBQSw2QkFBNkIsR0FBRyxrQkFBa0IsQ0FBQztJQUNuRCxRQUFBLHdCQUF3QixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsMkJBQTJCLEVBQUUsOEJBQThCLENBQUMsQ0FBQztJQUVyRyxRQUFBLDBCQUEwQixHQUFHLDBCQUEwQixDQUFDO0lBQ3hELFFBQUEsc0JBQXNCLEdBQUcsc0JBQXNCLENBQUM7SUFDaEQsUUFBQSx1QkFBdUIsR0FBRyx1QkFBdUIsQ0FBQztJQUNsRCxRQUFBLHNCQUFzQixHQUFHLHNCQUFzQixDQUFDO0lBQ2hELFFBQUEsNEJBQTRCLEdBQUcsd0NBQXdDLENBQUM7SUFDeEUsUUFBQSx1QkFBdUIsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLHdCQUF3QixDQUFDLENBQUM7SUFDckYsUUFBQSxtQkFBbUIsR0FBRyxnQ0FBZ0MsQ0FBQyJ9