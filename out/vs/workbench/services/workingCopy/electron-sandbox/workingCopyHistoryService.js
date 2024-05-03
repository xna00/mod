/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/workingCopy/common/workingCopyHistoryService", "vs/platform/instantiation/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyHistory"], function (require, exports, workingCopyHistoryService_1, extensions_1, workingCopyHistory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register Service
    (0, extensions_1.registerSingleton)(workingCopyHistory_1.IWorkingCopyHistoryService, workingCopyHistoryService_1.NativeWorkingCopyHistoryService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlIaXN0b3J5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L2VsZWN0cm9uLXNhbmRib3gvd29ya2luZ0NvcHlIaXN0b3J5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxtQkFBbUI7SUFDbkIsSUFBQSw4QkFBaUIsRUFBQywrQ0FBMEIsRUFBRSwyREFBK0Isb0NBQTRCLENBQUMifQ==