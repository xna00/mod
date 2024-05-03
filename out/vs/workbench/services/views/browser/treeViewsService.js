/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/views/common/treeViewsService"], function (require, exports, extensions_1, instantiation_1, treeViewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ITreeViewsService = void 0;
    exports.ITreeViewsService = (0, instantiation_1.createDecorator)('treeViewsService');
    (0, extensions_1.registerSingleton)(exports.ITreeViewsService, treeViewsService_1.TreeviewsService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZVZpZXdzU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3ZpZXdzL2Jyb3dzZXIvdHJlZVZpZXdzU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPbkYsUUFBQSxpQkFBaUIsR0FBRyxJQUFBLCtCQUFlLEVBQW9CLGtCQUFrQixDQUFDLENBQUM7SUFDeEYsSUFBQSw4QkFBaUIsRUFBQyx5QkFBaUIsRUFBRSxtQ0FBZ0Isb0NBQTRCLENBQUMifQ==