/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor"], function (require, exports, instantiation_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenEditorContext = exports.GroupsOrder = exports.MergeGroupMode = exports.GroupsArrangement = exports.GroupLocation = exports.GroupOrientation = exports.GroupDirection = exports.IEditorGroupsService = void 0;
    exports.isEditorReplacement = isEditorReplacement;
    exports.isEditorGroup = isEditorGroup;
    exports.preferredSideBySideGroupDirection = preferredSideBySideGroupDirection;
    exports.IEditorGroupsService = (0, instantiation_1.createDecorator)('editorGroupsService');
    var GroupDirection;
    (function (GroupDirection) {
        GroupDirection[GroupDirection["UP"] = 0] = "UP";
        GroupDirection[GroupDirection["DOWN"] = 1] = "DOWN";
        GroupDirection[GroupDirection["LEFT"] = 2] = "LEFT";
        GroupDirection[GroupDirection["RIGHT"] = 3] = "RIGHT";
    })(GroupDirection || (exports.GroupDirection = GroupDirection = {}));
    var GroupOrientation;
    (function (GroupOrientation) {
        GroupOrientation[GroupOrientation["HORIZONTAL"] = 0] = "HORIZONTAL";
        GroupOrientation[GroupOrientation["VERTICAL"] = 1] = "VERTICAL";
    })(GroupOrientation || (exports.GroupOrientation = GroupOrientation = {}));
    var GroupLocation;
    (function (GroupLocation) {
        GroupLocation[GroupLocation["FIRST"] = 0] = "FIRST";
        GroupLocation[GroupLocation["LAST"] = 1] = "LAST";
        GroupLocation[GroupLocation["NEXT"] = 2] = "NEXT";
        GroupLocation[GroupLocation["PREVIOUS"] = 3] = "PREVIOUS";
    })(GroupLocation || (exports.GroupLocation = GroupLocation = {}));
    var GroupsArrangement;
    (function (GroupsArrangement) {
        /**
         * Make the current active group consume the entire
         * editor area.
         */
        GroupsArrangement[GroupsArrangement["MAXIMIZE"] = 0] = "MAXIMIZE";
        /**
         * Make the current active group consume the maximum
         * amount of space possible.
         */
        GroupsArrangement[GroupsArrangement["EXPAND"] = 1] = "EXPAND";
        /**
         * Size all groups evenly.
         */
        GroupsArrangement[GroupsArrangement["EVEN"] = 2] = "EVEN";
    })(GroupsArrangement || (exports.GroupsArrangement = GroupsArrangement = {}));
    var MergeGroupMode;
    (function (MergeGroupMode) {
        MergeGroupMode[MergeGroupMode["COPY_EDITORS"] = 0] = "COPY_EDITORS";
        MergeGroupMode[MergeGroupMode["MOVE_EDITORS"] = 1] = "MOVE_EDITORS";
    })(MergeGroupMode || (exports.MergeGroupMode = MergeGroupMode = {}));
    function isEditorReplacement(replacement) {
        const candidate = replacement;
        return (0, editor_1.isEditorInput)(candidate?.editor) && (0, editor_1.isEditorInput)(candidate?.replacement);
    }
    var GroupsOrder;
    (function (GroupsOrder) {
        /**
         * Groups sorted by creation order (oldest one first)
         */
        GroupsOrder[GroupsOrder["CREATION_TIME"] = 0] = "CREATION_TIME";
        /**
         * Groups sorted by most recent activity (most recent active first)
         */
        GroupsOrder[GroupsOrder["MOST_RECENTLY_ACTIVE"] = 1] = "MOST_RECENTLY_ACTIVE";
        /**
         * Groups sorted by grid widget order
         */
        GroupsOrder[GroupsOrder["GRID_APPEARANCE"] = 2] = "GRID_APPEARANCE";
    })(GroupsOrder || (exports.GroupsOrder = GroupsOrder = {}));
    var OpenEditorContext;
    (function (OpenEditorContext) {
        OpenEditorContext[OpenEditorContext["NEW_EDITOR"] = 1] = "NEW_EDITOR";
        OpenEditorContext[OpenEditorContext["MOVE_EDITOR"] = 2] = "MOVE_EDITOR";
        OpenEditorContext[OpenEditorContext["COPY_EDITOR"] = 3] = "COPY_EDITOR";
    })(OpenEditorContext || (exports.OpenEditorContext = OpenEditorContext = {}));
    function isEditorGroup(obj) {
        const group = obj;
        return !!group && typeof group.id === 'number' && Array.isArray(group.editors);
    }
    //#region Editor Group Helpers
    function preferredSideBySideGroupDirection(configurationService) {
        const openSideBySideDirection = configurationService.getValue('workbench.editor.openSideBySideDirection');
        if (openSideBySideDirection === 'down') {
            return 1 /* GroupDirection.DOWN */;
        }
        return 3 /* GroupDirection.RIGHT */;
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3JvdXBzU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2VkaXRvci9jb21tb24vZWRpdG9yR3JvdXBzU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpSWhHLGtEQUlDO0lBZ3RCRCxzQ0FJQztJQUlELDhFQVFDO0lBcDFCWSxRQUFBLG9CQUFvQixHQUFHLElBQUEsK0JBQWUsRUFBdUIscUJBQXFCLENBQUMsQ0FBQztJQUVqRyxJQUFrQixjQUtqQjtJQUxELFdBQWtCLGNBQWM7UUFDL0IsK0NBQUUsQ0FBQTtRQUNGLG1EQUFJLENBQUE7UUFDSixtREFBSSxDQUFBO1FBQ0oscURBQUssQ0FBQTtJQUNOLENBQUMsRUFMaUIsY0FBYyw4QkFBZCxjQUFjLFFBSy9CO0lBRUQsSUFBa0IsZ0JBR2pCO0lBSEQsV0FBa0IsZ0JBQWdCO1FBQ2pDLG1FQUFVLENBQUE7UUFDViwrREFBUSxDQUFBO0lBQ1QsQ0FBQyxFQUhpQixnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQUdqQztJQUVELElBQWtCLGFBS2pCO0lBTEQsV0FBa0IsYUFBYTtRQUM5QixtREFBSyxDQUFBO1FBQ0wsaURBQUksQ0FBQTtRQUNKLGlEQUFJLENBQUE7UUFDSix5REFBUSxDQUFBO0lBQ1QsQ0FBQyxFQUxpQixhQUFhLDZCQUFiLGFBQWEsUUFLOUI7SUFPRCxJQUFrQixpQkFpQmpCO0lBakJELFdBQWtCLGlCQUFpQjtRQUNsQzs7O1dBR0c7UUFDSCxpRUFBUSxDQUFBO1FBRVI7OztXQUdHO1FBQ0gsNkRBQU0sQ0FBQTtRQUVOOztXQUVHO1FBQ0gseURBQUksQ0FBQTtJQUNMLENBQUMsRUFqQmlCLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBaUJsQztJQWdDRCxJQUFrQixjQUdqQjtJQUhELFdBQWtCLGNBQWM7UUFDL0IsbUVBQVksQ0FBQTtRQUNaLG1FQUFZLENBQUE7SUFDYixDQUFDLEVBSGlCLGNBQWMsOEJBQWQsY0FBYyxRQUcvQjtJQWtDRCxTQUFnQixtQkFBbUIsQ0FBQyxXQUFvQjtRQUN2RCxNQUFNLFNBQVMsR0FBRyxXQUE2QyxDQUFDO1FBRWhFLE9BQU8sSUFBQSxzQkFBYSxFQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsSUFBSSxJQUFBLHNCQUFhLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2xGLENBQUM7SUFFRCxJQUFrQixXQWdCakI7SUFoQkQsV0FBa0IsV0FBVztRQUU1Qjs7V0FFRztRQUNILCtEQUFhLENBQUE7UUFFYjs7V0FFRztRQUNILDZFQUFvQixDQUFBO1FBRXBCOztXQUVHO1FBQ0gsbUVBQWUsQ0FBQTtJQUNoQixDQUFDLEVBaEJpQixXQUFXLDJCQUFYLFdBQVcsUUFnQjVCO0lBd1hELElBQWtCLGlCQUlqQjtJQUpELFdBQWtCLGlCQUFpQjtRQUNsQyxxRUFBYyxDQUFBO1FBQ2QsdUVBQWUsQ0FBQTtRQUNmLHVFQUFlLENBQUE7SUFDaEIsQ0FBQyxFQUppQixpQkFBaUIsaUNBQWpCLGlCQUFpQixRQUlsQztJQWtVRCxTQUFnQixhQUFhLENBQUMsR0FBWTtRQUN6QyxNQUFNLEtBQUssR0FBRyxHQUErQixDQUFDO1FBRTlDLE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSxPQUFPLEtBQUssQ0FBQyxFQUFFLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hGLENBQUM7SUFFRCw4QkFBOEI7SUFFOUIsU0FBZ0IsaUNBQWlDLENBQUMsb0JBQTJDO1FBQzVGLE1BQU0sdUJBQXVCLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFDLDBDQUEwQyxDQUFDLENBQUM7UUFFMUcsSUFBSSx1QkFBdUIsS0FBSyxNQUFNLEVBQUUsQ0FBQztZQUN4QyxtQ0FBMkI7UUFDNUIsQ0FBQztRQUVELG9DQUE0QjtJQUM3QixDQUFDOztBQUVELFlBQVkifQ==