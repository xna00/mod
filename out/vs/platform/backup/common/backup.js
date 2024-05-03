/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isFolderBackupInfo = isFolderBackupInfo;
    exports.isWorkspaceBackupInfo = isWorkspaceBackupInfo;
    function isFolderBackupInfo(curr) {
        return curr && curr.hasOwnProperty('folderUri');
    }
    function isWorkspaceBackupInfo(curr) {
        return curr && curr.hasOwnProperty('workspace');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja3VwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9iYWNrdXAvY29tbW9uL2JhY2t1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWlCaEcsZ0RBRUM7SUFFRCxzREFFQztJQU5ELFNBQWdCLGtCQUFrQixDQUFDLElBQThDO1FBQ2hGLE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELFNBQWdCLHFCQUFxQixDQUFDLElBQThDO1FBQ25GLE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDakQsQ0FBQyJ9