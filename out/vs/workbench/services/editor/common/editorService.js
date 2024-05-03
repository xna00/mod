/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorGroupsService"], function (require, exports, instantiation_1, editorGroupsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AUX_WINDOW_GROUP = exports.SIDE_GROUP = exports.ACTIVE_GROUP = exports.IEditorService = void 0;
    exports.isPreferredGroup = isPreferredGroup;
    exports.IEditorService = (0, instantiation_1.createDecorator)('editorService');
    /**
     * Open an editor in the currently active group.
     */
    exports.ACTIVE_GROUP = -1;
    /**
     * Open an editor to the side of the active group.
     */
    exports.SIDE_GROUP = -2;
    /**
     * Open an editor in a new auxiliary window.
     */
    exports.AUX_WINDOW_GROUP = -3;
    function isPreferredGroup(obj) {
        const candidate = obj;
        return typeof obj === 'number' || (0, editorGroupsService_1.isEditorGroup)(candidate);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2VkaXRvci9jb21tb24vZWRpdG9yU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQ2hHLDRDQUlDO0lBMUJZLFFBQUEsY0FBYyxHQUFHLElBQUEsK0JBQWUsRUFBaUIsZUFBZSxDQUFDLENBQUM7SUFFL0U7O09BRUc7SUFDVSxRQUFBLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQztJQUcvQjs7T0FFRztJQUNVLFFBQUEsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRzdCOztPQUVHO0lBQ1UsUUFBQSxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUtuQyxTQUFnQixnQkFBZ0IsQ0FBQyxHQUFZO1FBQzVDLE1BQU0sU0FBUyxHQUFHLEdBQWlDLENBQUM7UUFFcEQsT0FBTyxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksSUFBQSxtQ0FBYSxFQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzVELENBQUMifQ==