/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol"], function (require, exports, lifecycle_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLabelService = void 0;
    class ExtHostLabelService {
        constructor(mainContext) {
            this._handlePool = 0;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadLabelService);
        }
        $registerResourceLabelFormatter(formatter) {
            const handle = this._handlePool++;
            this._proxy.$registerResourceLabelFormatter(handle, formatter);
            return (0, lifecycle_1.toDisposable)(() => {
                this._proxy.$unregisterResourceLabelFormatter(handle);
            });
        }
    }
    exports.ExtHostLabelService = ExtHostLabelService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExhYmVsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdExhYmVsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxtQkFBbUI7UUFLL0IsWUFBWSxXQUF5QjtZQUY3QixnQkFBVyxHQUFXLENBQUMsQ0FBQztZQUcvQixJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFFRCwrQkFBK0IsQ0FBQyxTQUFpQztZQUNoRSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFL0QsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN4QixJQUFJLENBQUMsTUFBTSxDQUFDLGlDQUFpQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBakJELGtEQWlCQyJ9