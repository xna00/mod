/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MAX_PARALLEL_HISTORY_IO_OPS = exports.IWorkingCopyHistoryService = void 0;
    exports.IWorkingCopyHistoryService = (0, instantiation_1.createDecorator)('workingCopyHistoryService');
    /**
     * A limit on how many I/O operations we allow to run in parallel.
     * We do not want to spam the file system with too many requests
     * at the same time, so we limit to a maximum degree of parallellism.
     */
    exports.MAX_PARALLEL_HISTORY_IO_OPS = 20;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlIaXN0b3J5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvY29tbW9uL3dvcmtpbmdDb3B5SGlzdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRbkYsUUFBQSwwQkFBMEIsR0FBRyxJQUFBLCtCQUFlLEVBQTZCLDJCQUEyQixDQUFDLENBQUM7SUF1SW5IOzs7O09BSUc7SUFDVSxRQUFBLDJCQUEyQixHQUFHLEVBQUUsQ0FBQyJ9