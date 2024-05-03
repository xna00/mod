/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullCommandService = void 0;
    exports.NullCommandService = {
        _serviceBrand: undefined,
        onWillExecuteCommand: () => lifecycle_1.Disposable.None,
        onDidExecuteCommand: () => lifecycle_1.Disposable.None,
        executeCommand() {
            return Promise.resolve(undefined);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbENvbW1hbmRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9jb21tYW5kcy90ZXN0L2NvbW1vbi9udWxsQ29tbWFuZFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS25GLFFBQUEsa0JBQWtCLEdBQW9CO1FBQ2xELGFBQWEsRUFBRSxTQUFTO1FBQ3hCLG9CQUFvQixFQUFFLEdBQUcsRUFBRSxDQUFDLHNCQUFVLENBQUMsSUFBSTtRQUMzQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxzQkFBVSxDQUFDLElBQUk7UUFDMUMsY0FBYztZQUNiLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuQyxDQUFDO0tBQ0QsQ0FBQyJ9