/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GoScope = exports.GoFilter = exports.IHistoryService = void 0;
    exports.IHistoryService = (0, instantiation_1.createDecorator)('historyService');
    /**
     * Limit editor navigation to certain kinds.
     */
    var GoFilter;
    (function (GoFilter) {
        /**
         * Navigate between editor navigation history
         * entries from any kind of navigation source.
         */
        GoFilter[GoFilter["NONE"] = 0] = "NONE";
        /**
         * Only navigate between editor navigation history
         * entries that were resulting from edits.
         */
        GoFilter[GoFilter["EDITS"] = 1] = "EDITS";
        /**
         * Only navigate between editor navigation history
         * entries that were resulting from navigations, such
         * as "Go to definition".
         */
        GoFilter[GoFilter["NAVIGATION"] = 2] = "NAVIGATION";
    })(GoFilter || (exports.GoFilter = GoFilter = {}));
    /**
     * Limit editor navigation to certain scopes.
     */
    var GoScope;
    (function (GoScope) {
        /**
         * Navigate across all editors and editor groups.
         */
        GoScope[GoScope["DEFAULT"] = 0] = "DEFAULT";
        /**
         * Navigate only in editors of the active editor group.
         */
        GoScope[GoScope["EDITOR_GROUP"] = 1] = "EDITOR_GROUP";
        /**
         * Navigate only in the active editor.
         */
        GoScope[GoScope["EDITOR"] = 2] = "EDITOR";
    })(GoScope || (exports.GoScope = GoScope = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlzdG9yeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2hpc3RvcnkvY29tbW9uL2hpc3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUW5GLFFBQUEsZUFBZSxHQUFHLElBQUEsK0JBQWUsRUFBa0IsZ0JBQWdCLENBQUMsQ0FBQztJQUVsRjs7T0FFRztJQUNILElBQWtCLFFBb0JqQjtJQXBCRCxXQUFrQixRQUFRO1FBRXpCOzs7V0FHRztRQUNILHVDQUFJLENBQUE7UUFFSjs7O1dBR0c7UUFDSCx5Q0FBSyxDQUFBO1FBRUw7Ozs7V0FJRztRQUNILG1EQUFVLENBQUE7SUFDWCxDQUFDLEVBcEJpQixRQUFRLHdCQUFSLFFBQVEsUUFvQnpCO0lBRUQ7O09BRUc7SUFDSCxJQUFrQixPQWdCakI7SUFoQkQsV0FBa0IsT0FBTztRQUV4Qjs7V0FFRztRQUNILDJDQUFPLENBQUE7UUFFUDs7V0FFRztRQUNILHFEQUFZLENBQUE7UUFFWjs7V0FFRztRQUNILHlDQUFNLENBQUE7SUFDUCxDQUFDLEVBaEJpQixPQUFPLHVCQUFQLE9BQU8sUUFnQnhCIn0=