/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/workspace/common/workspace"], function (require, exports, platform_1, uri_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestWorkspace = exports.Workspace = void 0;
    exports.testWorkspace = testWorkspace;
    class Workspace extends workspace_1.Workspace {
        constructor(id, folders = [], configuration = null, ignorePathCasing = () => !platform_1.isLinux) {
            super(id, folders, false, configuration, ignorePathCasing);
        }
    }
    exports.Workspace = Workspace;
    const wsUri = uri_1.URI.file(platform_1.isWindows ? 'C:\\testWorkspace' : '/testWorkspace');
    exports.TestWorkspace = testWorkspace(wsUri);
    function testWorkspace(resource) {
        return new Workspace(resource.toString(), [(0, workspace_1.toWorkspaceFolder)(resource)]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFdvcmtzcGFjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd29ya3NwYWNlL3Rlc3QvY29tbW9uL3Rlc3RXb3Jrc3BhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0JoRyxzQ0FFQztJQWhCRCxNQUFhLFNBQVUsU0FBUSxxQkFBYTtRQUMzQyxZQUNDLEVBQVUsRUFDVixVQUE2QixFQUFFLEVBQy9CLGdCQUE0QixJQUFJLEVBQ2hDLG1CQUEwQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLGtCQUFPO1lBRXhELEtBQUssQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUM1RCxDQUFDO0tBQ0Q7SUFURCw4QkFTQztJQUVELE1BQU0sS0FBSyxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQVMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDOUQsUUFBQSxhQUFhLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRWxELFNBQWdCLGFBQWEsQ0FBQyxRQUFhO1FBQzFDLE9BQU8sSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBQSw2QkFBaUIsRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUUsQ0FBQyJ9